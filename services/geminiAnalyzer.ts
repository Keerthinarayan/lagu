import { Syllable, SyllableType } from '../types';

// The API key is injected at build time by vite (see vite.config.ts) from
// GEMINI_API_KEY in .env.local. Get a free key at https://aistudio.google.com/apikey
const API_KEY = (process.env.API_KEY || '').trim();
const MODEL = 'gemini-flash-latest';
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

const PLACEHOLDER_KEYS = new Set(['', 'PLACEHOLDER_API_KEY', 'YOUR_API_KEY']);

/** True when a real Gemini API key has been configured. */
export const isAiAvailable = (): boolean => !PLACEHOLDER_KEYS.has(API_KEY);

const SYSTEM_PROMPT = `You are an expert in Kannada prosody (ಛಂದಸ್ಸು). Your task is to split Kannada text into aksharas (syllables) and classify each as Laghu (short, "L") or Guru (long, "G").

Rules for classification:
- Guru (G) if the syllable contains a long vowel (ಆ, ಈ, ಊ, ಏ, ಐ, ಓ, ಔ) or a long vowel sign (ಾ, ೀ, ೂ, ೇ, ೈ, ೋ, ೌ).
- Guru (G) if the syllable is followed by anusvara (ಂ) or visarga (ಃ).
- Guru (G) if the syllable is immediately followed by a consonant cluster (a conjunct / ottakshara using virama ್).
- Laghu (L) otherwise (a short vowel with no following cluster).

Only classify Kannada aksharas. Ignore punctuation, spaces, digits and any non-Kannada characters. Preserve the original order of the syllables.`;

const requestSchema = {
  type: 'OBJECT',
  properties: {
    syllables: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          text: { type: 'STRING', description: 'The Kannada akshara (syllable).' },
          type: { type: 'STRING', enum: ['L', 'G'], description: 'L for Laghu, G for Guru.' },
        },
        required: ['text', 'type'],
      },
    },
  },
  required: ['syllables'],
};

/**
 * Sends Kannada text to Gemini and returns its Laghu/Guru classification.
 * @param text The Kannada text to analyze.
 * @returns A flat list of classified syllables.
 */
export const analyzeWithAI = async (text: string): Promise<Syllable[]> => {
  if (!isAiAvailable()) {
    throw new Error(
      'No Gemini API key configured. Get a free key at https://aistudio.google.com/apikey and set GEMINI_API_KEY in your .env.local file.'
    );
  }

  const body = {
    systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
    contents: [
      {
        parts: [
          { text: `Analyze this Kannada text and return the syllables with their Laghu/Guru classification:\n\n${text}` },
        ],
      },
    ],
    generationConfig: {
      temperature: 0,
      responseMimeType: 'application/json',
      responseSchema: requestSchema,
    },
  };

  let response: Response;
  try {
    response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-goog-api-key': API_KEY },
      body: JSON.stringify(body),
    });
  } catch (e) {
    throw new Error('Could not reach the Gemini API. Please check your internet connection.');
  }

  if (!response.ok) {
    if (response.status === 400 || response.status === 401 || response.status === 403) {
      throw new Error('The Gemini API key is invalid or not authorized. Please check your GEMINI_API_KEY.');
    }
    if (response.status === 429) {
      throw new Error('Gemini API rate limit reached (free tier). Please wait a moment and try again.');
    }
    throw new Error(`Gemini API request failed (HTTP ${response.status}).`);
  }

  const json = await response.json();
  const rawText: string | undefined = json?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!rawText) {
    throw new Error('Gemini returned an empty response. Please try again.');
  }

  let parsed: { syllables?: { text: string; type: string }[] };
  try {
    parsed = JSON.parse(rawText);
  } catch {
    throw new Error('Could not understand the AI response. Please try again.');
  }

  const syllables = (parsed.syllables || [])
    .filter((s) => s && typeof s.text === 'string' && (s.type === 'L' || s.type === 'G'))
    .map((s): Syllable => ({ text: s.text, type: s.type as SyllableType }));

  if (syllables.length === 0) {
    throw new Error('The AI did not find any Kannada syllables in this text.');
  }

  return syllables;
};
