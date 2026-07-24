import { Syllable, SyllableType } from '../types';
import { PROSODY_SYSTEM_PROMPT, PROSODY_JSON_INSTRUCTIONS, buildUserPrompt } from './prosodyPrompt';
import { extractJsonObject } from './aiJsonUtils';

// Free-tagged models on OpenRouter. Get a key at https://openrouter.ai/keys
const API_KEY = (process.env.OPENROUTER_API_KEY || '').trim();
const MODEL = 'nvidia/nemotron-3-ultra-550b-a55b:free';
const ENDPOINT = 'https://openrouter.ai/api/v1/chat/completions';

const PLACEHOLDER_KEYS = new Set(['', 'PLACEHOLDER_API_KEY', 'YOUR_API_KEY']);

export const isOpenRouterAvailable = (): boolean => !PLACEHOLDER_KEYS.has(API_KEY);

export const analyzeWithOpenRouter = async (text: string): Promise<Syllable[]> => {
  if (!isOpenRouterAvailable()) {
    throw new Error(
      'No OpenRouter API key configured. Get a free key at https://openrouter.ai/keys and set OPENROUTER_API_KEY in your .env.local file.'
    );
  }

  const body = {
    model: MODEL,
    temperature: 0,
    response_format: { type: 'json_object' },
    // Nemotron is a reasoning model — left on, it burns thousands of hidden
    // "thinking" tokens even on this simple classification task, which turns
    // a 2s request into a 60s+ one. This task doesn't need chain-of-thought.
    reasoning: { enabled: false },
    messages: [
      { role: 'system', content: `${PROSODY_SYSTEM_PROMPT}\n\n${PROSODY_JSON_INSTRUCTIONS}` },
      { role: 'user', content: buildUserPrompt(text) },
    ],
  };

  let response: Response;
  try {
    response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${API_KEY}`,
        // Recommended by OpenRouter for their usage attribution; harmless if ignored.
        'X-Title': 'Akshara',
      },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error('Could not reach the OpenRouter API. Please check your internet connection.');
  }

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new Error('The OpenRouter API key is invalid or not authorized. Please check your OPENROUTER_API_KEY.');
    }
    if (response.status === 429) {
      throw new Error('OpenRouter rate limit reached (free tier). Please wait a moment and try again.');
    }
    throw new Error(`OpenRouter API request failed (HTTP ${response.status}).`);
  }

  const json = await response.json();

  // OpenRouter can return HTTP 200 with an `error` body instead of `choices`
  // when the free upstream provider (NVIDIA, in this case) itself fails —
  // that's a different situation than an empty/blocked completion.
  if (json?.error) {
    const providerMessage = json.error.message || json.error.code || 'unknown upstream error';
    throw new Error(`OpenRouter's upstream provider failed: ${providerMessage}. This is usually temporary — try again in a moment.`);
  }

  const choice = json?.choices?.[0];
  const rawText: string | undefined = choice?.message?.content;

  if (!rawText) {
    const finishReason = choice?.finish_reason || choice?.native_finish_reason;
    const refusal = choice?.message?.refusal;
    if (refusal) {
      throw new Error(`OpenRouter's model refused to respond: ${refusal}`);
    }
    if (finishReason === 'length') {
      throw new Error('OpenRouter cut the response off before it finished (hit the output length limit). Try a shorter piece of text.');
    }
    throw new Error(`OpenRouter returned no content (finish reason: ${finishReason || 'unknown'}). The free model may be temporarily overloaded — try again.`);
  }

  let parsed: { syllables?: { text: string; type: string }[] };
  try {
    parsed = extractJsonObject(rawText);
  } catch {
    throw new Error('Could not understand the OpenRouter response. Please try again.');
  }

  const syllables = (parsed.syllables || [])
    .filter((s) => s && typeof s.text === 'string' && (s.type === 'L' || s.type === 'G'))
    .map((s): Syllable => ({ text: s.text, type: s.type as SyllableType }));

  if (syllables.length === 0) {
    throw new Error('OpenRouter did not find any Kannada syllables in this text.');
  }

  return syllables;
};
