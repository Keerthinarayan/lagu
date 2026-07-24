/**
 * Extracts a JSON object from a raw LLM text response, tolerating markdown
 * code fences or stray commentary some models add around the JSON payload.
 */
export const extractJsonObject = (raw: string): any => {
  let text = raw.trim();

  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenceMatch) {
    text = fenceMatch[1].trim();
  }

  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1 || end < start) {
    throw new Error('No JSON object found in the response.');
  }

  return JSON.parse(text.slice(start, end + 1));
};
