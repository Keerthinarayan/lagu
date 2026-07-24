// Shared prompt used by every AI provider that classifies Kannada syllables
// into Laghu/Guru, so their instructions stay identical and results are comparable.

export const PROSODY_SYSTEM_PROMPT = `You are an expert in Kannada prosody (ಛಂದಸ್ಸು). Your task is to split Kannada text into aksharas (syllables) and classify each as Laghu (short, "L") or Guru (long, "G").

Rules for classification:
- Guru (G) if the syllable contains a long vowel (ಆ, ಈ, ಊ, ಏ, ಐ, ಓ, ಔ) or a long vowel sign (ಾ, ೀ, ೂ, ೇ, ೈ, ೋ, ೌ).
- Guru (G) if the syllable is followed by anusvara (ಂ) or visarga (ಃ).
- Guru (G) if the syllable is immediately followed by a consonant cluster (a conjunct / ottakshara using virama ್).
- Laghu (L) otherwise (a short vowel with no following cluster).

Only classify Kannada aksharas. Ignore punctuation, spaces, digits and any non-Kannada characters. Preserve the original order of the syllables.`;

/** For providers without native JSON-schema mode (Groq, OpenRouter) — spells out the exact shape to return. */
export const PROSODY_JSON_INSTRUCTIONS = `Respond with ONLY a single JSON object, no markdown code fences and no extra commentary, in exactly this shape:
{"syllables":[{"text":"<akshara>","type":"L"},{"text":"<akshara>","type":"G"}, ...]}`;

export const buildUserPrompt = (text: string): string =>
  `Analyze this Kannada text and return the syllables with their Laghu/Guru classification:\n\n${text}`;
