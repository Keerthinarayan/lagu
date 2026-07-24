// The API key is injected at build time by vite (see vite.config.ts) from
// GEMINI_API_KEY in .env.local. Get a free key at https://aistudio.google.com/apikey
const API_KEY = (process.env.API_KEY || '').trim();
const MODEL = 'gemini-flash-latest';
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

const BASE_SYSTEM_PROMPT = `You are "ಅಕ್ಷರ ಗುರು" (Akshara Guru), a friendly, precise Kannada language tutor built into the Akshara prosody-analysis app.

You help with:
- ವ್ಯಾಕರಣ (grammar): ಸಂಧಿ (sandhi), ಸಮಾಸ (compounds), ವಿಭಕ್ತಿ (case endings), ಕ್ರಿಯಾಪದ/ನಾಮಪದ (verbs/nouns), parts of speech, spelling and usage.
- ಛಂದಸ್ಸು (prosody): ಲಘು/ಗುರು (laghu/guru) classification, meters like ಕಂದ, ವೃತ್ತ, ರಗಳೆ, ತ್ರಿಪದಿ.
- ಅಲಂಕಾರ (figures of speech) and general Kannada literature questions.

Rules for answering:
- Be concise and well structured. Use short paragraphs or bullet points, not walls of text.
- Give Kannada examples in Kannada script, and briefly gloss them in English so non-native readers can follow.
- When a grammar rule applies, name the rule (e.g. "ಆಗಮ ಸಂಧಿ") so the user can look it up further.
- If asked something outside Kannada language/literature/prosody, briefly say that's outside your focus and steer back.
- Never fabricate a grammar rule you are not confident about; say so if unsure.`;

// Cap how much of the loaded document we inject as context. Every chat turn
// resends the full system prompt (this API is stateless per-request), so a
// very large book would make every message slow and token-expensive.
const MAX_CONTEXT_CHARS = 40000;

/** Builds the system prompt, optionally grounding the tutor in the user's loaded text. */
const buildSystemPrompt = (documentText?: string): string => {
  const trimmed = documentText?.trim();
  if (!trimmed) return BASE_SYSTEM_PROMPT;

  const truncated = trimmed.length > MAX_CONTEXT_CHARS;
  const context = truncated ? trimmed.slice(0, MAX_CONTEXT_CHARS) : trimmed;

  return `${BASE_SYSTEM_PROMPT}

The user has loaded the following Kannada text into the app${truncated ? ' (only the first portion is shown below — the full document is longer)' : ''}. When their question is about this specific text, answer using it directly: quote the exact words or lines as evidence rather than speaking generically.

"""
${context}
"""`;
};

const PLACEHOLDER_KEYS = new Set(['', 'PLACEHOLDER_API_KEY', 'YOUR_API_KEY']);

/** True when a real Gemini API key has been configured. */
export const isChatAvailable = (): boolean => !PLACEHOLDER_KEYS.has(API_KEY);

/**
 * Sends the full chat history plus a new user message to Gemini and returns
 * the model's reply. The caller is responsible for appending both the user
 * message and the reply to its own history state.
 * @param history Prior turns of the conversation (not including the new message).
 * @param newMessage The user's new message.
 * @param documentText The Kannada text currently loaded in the app, used as grounding context.
 * @returns The model's text reply.
 */
export const sendChatMessage = async (
  history: ChatMessage[],
  newMessage: string,
  documentText?: string
): Promise<string> => {
  if (!isChatAvailable()) {
    throw new Error(
      'No Gemini API key configured. Get a free key at https://aistudio.google.com/apikey and set GEMINI_API_KEY in your .env.local file.'
    );
  }

  const contents = [
    ...history.map((m) => ({ role: m.role, parts: [{ text: m.text }] })),
    { role: 'user', parts: [{ text: newMessage }] },
  ];

  const body = {
    systemInstruction: { parts: [{ text: buildSystemPrompt(documentText) }] },
    contents,
    generationConfig: {
      temperature: 0.4,
    },
  };

  let response: Response;
  try {
    response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-goog-api-key': API_KEY },
      body: JSON.stringify(body),
    });
  } catch {
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
  const replyText: string | undefined = json?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!replyText) {
    throw new Error('Gemini returned an empty response. Please try again.');
  }

  return replyText;
};
