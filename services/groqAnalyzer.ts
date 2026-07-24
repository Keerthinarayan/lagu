import { Syllable, SyllableType } from '../types';
import { PROSODY_SYSTEM_PROMPT, PROSODY_JSON_INSTRUCTIONS, buildUserPrompt } from './prosodyPrompt';
import { extractJsonObject } from './aiJsonUtils';

// Free, fast inference. Get a key at https://console.groq.com/keys
const API_KEY = (process.env.GROQ_API_KEY || '').trim();
const MODEL = 'llama-3.3-70b-versatile';
const ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';

const PLACEHOLDER_KEYS = new Set(['', 'PLACEHOLDER_API_KEY', 'YOUR_API_KEY']);

export const isGroqAvailable = (): boolean => !PLACEHOLDER_KEYS.has(API_KEY);

export const analyzeWithGroq = async (text: string): Promise<Syllable[]> => {
  if (!isGroqAvailable()) {
    throw new Error(
      'No Groq API key configured. Get a free key at https://console.groq.com/keys and set GROQ_API_KEY in your .env.local file.'
    );
  }

  const body = {
    model: MODEL,
    temperature: 0,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: `${PROSODY_SYSTEM_PROMPT}\n\n${PROSODY_JSON_INSTRUCTIONS}` },
      { role: 'user', content: buildUserPrompt(text) },
    ],
  };

  let response: Response;
  try {
    response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${API_KEY}` },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error('Could not reach the Groq API. Please check your internet connection.');
  }

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new Error('The Groq API key is invalid or not authorized. Please check your GROQ_API_KEY.');
    }
    if (response.status === 429) {
      throw new Error('Groq API rate limit reached (free tier). Please wait a moment and try again.');
    }
    throw new Error(`Groq API request failed (HTTP ${response.status}).`);
  }

  const json = await response.json();
  const rawText: string | undefined = json?.choices?.[0]?.message?.content;

  if (!rawText) {
    throw new Error('Groq returned an empty response. Please try again.');
  }

  let parsed: { syllables?: { text: string; type: string }[] };
  try {
    parsed = extractJsonObject(rawText);
  } catch {
    throw new Error('Could not understand the Groq response. Please try again.');
  }

  const syllables = (parsed.syllables || [])
    .filter((s) => s && typeof s.text === 'string' && (s.type === 'L' || s.type === 'G'))
    .map((s): Syllable => ({ text: s.text, type: s.type as SyllableType }));

  if (syllables.length === 0) {
    throw new Error('Groq did not find any Kannada syllables in this text.');
  }

  return syllables;
};
