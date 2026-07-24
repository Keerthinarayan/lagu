import { ChatMessage, buildSystemPrompt } from './tutorPrompt';

// Free, fast inference. Get a key at https://console.groq.com/keys
const API_KEY = (process.env.GROQ_API_KEY || '').trim();
const MODEL = 'llama-3.3-70b-versatile';
const ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';

const PLACEHOLDER_KEYS = new Set(['', 'PLACEHOLDER_API_KEY', 'YOUR_API_KEY']);

/** True when a real Groq API key has been configured. */
export const isGroqChatAvailable = (): boolean => !PLACEHOLDER_KEYS.has(API_KEY);

/**
 * Sends the full chat history plus a new user message to Groq (Llama 3.3) and
 * returns the model's reply. Same shared tutor persona and document-context
 * behavior as the Gemini chat, so switching providers mid-conversation only
 * changes which model answers, not how it behaves.
 * @param history Prior turns of the conversation (not including the new message).
 * @param newMessage The user's new message.
 * @param documentText The Kannada text currently loaded in the app, used as grounding context.
 * @returns The model's text reply.
 */
export const sendGroqChatMessage = async (
  history: ChatMessage[],
  newMessage: string,
  documentText?: string
): Promise<string> => {
  if (!isGroqChatAvailable()) {
    throw new Error(
      'No Groq API key configured. Get a free key at https://console.groq.com/keys and set GROQ_API_KEY in your .env.local file.'
    );
  }

  const messages = [
    { role: 'system', content: buildSystemPrompt(documentText) },
    ...history.map((m) => ({ role: m.role === 'model' ? 'assistant' : 'user', content: m.text })),
    { role: 'user', content: newMessage },
  ];

  const body = {
    model: MODEL,
    temperature: 0.4,
    messages,
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
    if (response.status === 413) {
      throw new Error('This conversation (plus your loaded document) is too large for Groq. Try a shorter document or start a new chat.');
    }
    if (response.status === 429) {
      throw new Error('Groq API rate limit reached (free tier). Please wait a moment and try again.');
    }
    throw new Error(`Groq API request failed (HTTP ${response.status}).`);
  }

  const json = await response.json();
  const replyText: string | undefined = json?.choices?.[0]?.message?.content;

  if (!replyText) {
    throw new Error('Groq returned an empty response. Please try again.');
  }

  return replyText;
};
