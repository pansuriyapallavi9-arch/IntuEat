import Groq from 'groq-sdk';

// Server-side Groq client. Never import this into a Client Component.
let client;

export function getGroq() {
  if (!process.env.GROQ_API_KEY) return null;
  if (!client) {
    client = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return client;
}

// Defaults target the models available on the provided Groq key.
// Override via env (GROQ_VISION_MODEL / GROQ_TEXT_MODEL) to use Meta Llama, etc.
export const VISION_MODEL = process.env.GROQ_VISION_MODEL || 'qwen/qwen3.6-27b';
export const TEXT_MODEL = process.env.GROQ_TEXT_MODEL || 'qwen/qwen3.6-27b';

// Calls Groq and returns parsed JSON. We deliberately DON'T use Groq's strict
// `response_format: json_object` because reasoning models (qwen) intermittently
// return empty content and the server rejects it with a hard 400. Instead we
// prompt for JSON, parse leniently, and retry once on an empty/unparseable reply.
export async function chatJSON(groq, { model, messages, temperature = 0.4, maxTokens = 2048, retries = 1 }) {
  let lastErr;
  // `reasoning_effort: 'none'` disables chain-of-thought so the model writes the JSON
  // answer directly. Reasoning models (qwen) otherwise spend the whole token budget
  // "thinking" and return empty content. If a model rejects the param (e.g. some
  // Llama variants), we drop it and rely on safeJson stripping any <think> block.
  let useReasoningEffort = true;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const params = { model, temperature, max_tokens: maxTokens, messages };
      if (useReasoningEffort) params.reasoning_effort = 'none';

      const completion = await groq.chat.completions.create(params);
      const parsed = safeJson(completion.choices?.[0]?.message?.content);
      if (parsed) return parsed;
      lastErr = new Error('AI returned no parseable JSON.');
    } catch (e) {
      lastErr = e;
      const msg = String(e?.message || e?.error?.message || '');
      // Param not supported by this model -> retry without it (doesn't count as a retry)
      if (useReasoningEffort && /reasoning_effort|reasoning/i.test(msg)) {
        useReasoningEffort = false;
        attempt--;
        continue;
      }
      if (e?.status === 429) throw e; // rate limited — retrying now won't help
    }
  }
  throw lastErr || new Error('AI returned no parseable JSON.');
}

// Plain-text completion (for the chat coach). Same reasoning-off handling as chatJSON.
export async function chatText(groq, { model, messages, temperature = 0.5, maxTokens = 900 }) {
  let useReasoningEffort = true;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const params = { model, temperature, max_tokens: maxTokens, messages };
      if (useReasoningEffort) params.reasoning_effort = 'none';
      const completion = await groq.chat.completions.create(params);
      const raw = completion.choices?.[0]?.message?.content || '';
      // Strip any stray reasoning block, then return the text.
      const text = raw
        .replace(/<think>[\s\S]*?<\/think>/gi, '')
        .replace(/^[\s\S]*?<\/think>/i, '')
        .trim();
      if (text) return text;
    } catch (e) {
      const msg = String(e?.message || e?.error?.message || '');
      if (useReasoningEffort && /reasoning_effort|reasoning/i.test(msg)) {
        useReasoningEffort = false;
        continue;
      }
      throw e;
    }
  }
  throw new Error('The AI returned an empty response.');
}

// Best-effort JSON extraction from an LLM response.
export function safeJson(text) {
  if (!text) return null;
  let cleaned = String(text)
    // Strip reasoning blocks some models inline into the content
    .replace(/<think>[\s\S]*?<\/think>/gi, '')
    .replace(/^[\s\S]*?<\/think>/i, '')
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    // Try to grab the first {...} or [...] block
    const match = cleaned.match(/[[{][\s\S]*[\]}]/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {
        return null;
      }
    }
    return null;
  }
}
