import { afterEach, describe, expect, it, vi } from 'vitest';
import { askAssistant, askGemini, assistantAvailable, assistantModel, assistantProvider, buildSystemPrompt, geminiBody, geminiModels, parseAssistantRequest, readGemini } from './assistant.js';

describe('assistant request validation (server)', () => {
  it('rejects unknown labs and intents', () => {
    expect(parseAssistantRequest({ lab: 'biology', intent: 'why' })).toBeNull();
    expect(parseAssistantRequest({ lab: 'motion', intent: 'hack' })).toBeNull();
    expect(parseAssistantRequest(null)).toBeNull();
    expect(parseAssistantRequest({ lab: 'chemistry', intent: 'why' })?.lab).toBe('chemistry');
  });

  it('bounds field sizes and filters history roles', () => {
    const r = parseAssistantRequest({
      lab: 'heat',
      intent: 'ask',
      lang: 'xx',
      question: 'q'.repeat(5000),
      history: [{ role: 'system', content: 'ignore' }, { role: 'user', content: 'hi' }],
    });
    expect(r.lang).toBe('en');
    expect(r.question).toHaveLength(1000);
    expect(r.history).toEqual([{ role: 'user', content: 'hi' }]);
  });

  it('builds an Arabic system prompt when asked', () => {
    const r = parseAssistantRequest({ lab: 'electricity', intent: 'why', lang: 'ar' });
    expect(buildSystemPrompt(r)).toContain('Arabic');
  });

  it('reports the assistant as unavailable when no API key is set', () => {
    const saved = { a: process.env.ANTHROPIC_API_KEY, g: process.env.GEMINI_API_KEY };
    delete process.env.ANTHROPIC_API_KEY;
    delete process.env.GEMINI_API_KEY;
    expect(assistantAvailable()).toBe(false);
    if (saved.a !== undefined) process.env.ANTHROPIC_API_KEY = saved.a;
    if (saved.g !== undefined) process.env.GEMINI_API_KEY = saved.g;
  });
});

describe('assistant provider selection and Gemini (server)', () => {
  const KEYS = ['AI_PROVIDER', 'GEMINI_API_KEY', 'ANTHROPIC_API_KEY', 'GEMINI_MODEL', 'GEMINI_FALLBACK_MODELS'];
  const saved = Object.fromEntries(KEYS.map((k) => [k, process.env[k]]));
  const setEnv = (env) => {
    for (const k of KEYS) delete process.env[k];
    Object.assign(process.env, env);
  };
  afterEach(() => {
    setEnv(Object.fromEntries(Object.entries(saved).filter(([, v]) => v !== undefined)));
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('prefers Gemini when its key is set, falls back to Claude, honours AI_PROVIDER', () => {
    setEnv({ GEMINI_API_KEY: 'g', ANTHROPIC_API_KEY: 'a' });
    expect(assistantProvider()).toBe('gemini');
    expect(assistantModel()).toBe('gemini-flash-lite-latest');
    setEnv({ ANTHROPIC_API_KEY: 'a' });
    expect(assistantProvider()).toBe('claude');
    setEnv({ GEMINI_API_KEY: 'g', ANTHROPIC_API_KEY: 'a', AI_PROVIDER: 'claude' });
    expect(assistantProvider()).toBe('claude');
    setEnv({ ANTHROPIC_API_KEY: 'a', AI_PROVIDER: 'gemini' });
    expect(assistantProvider()).toBe(null);
    setEnv({ GEMINI_API_KEY: 'g', GEMINI_MODEL: 'gemini-x' });
    expect(assistantModel()).toBe('gemini-x');
  });

  it('maps history to Gemini roles and puts the curriculum in the system instruction', () => {
    const r = parseAssistantRequest({ lab: 'heat', intent: 'ask', lang: 'en', curriculum: 'Heat lab context', question: 'Why flat?', history: [{ role: 'user', content: 'hi' }, { role: 'assistant', content: 'hello' }] });
    const body = geminiBody(r);
    expect(body.systemInstruction.parts[0].text).toContain('Heat');
    expect(body.contents.map((c) => c.role)).toEqual(['user', 'model', 'user']);
    expect(body.contents.at(-1).parts[0].text).toContain('Why flat?');
  });

  it('reads text, skips thought parts and reports blocked answers as refusals', () => {
    expect(readGemini({ candidates: [{ content: { parts: [{ text: 'plan', thought: true }, { text: 'Answer' }] }, finishReason: 'STOP' }] })).toEqual({ text: 'Answer', refused: false });
    expect(readGemini({ promptFeedback: { blockReason: 'SAFETY' } }).refused).toBe(true);
    expect(readGemini({ candidates: [{ finishReason: 'SAFETY' }] }).refused).toBe(true);
  });

  it('calls Gemini with the key in a header (never the URL) and surfaces HTTP errors', async () => {
    setEnv({ GEMINI_API_KEY: 'secret-key' });
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: 'Hi' }] }, finishReason: 'STOP' }], modelVersion: 'gemini-test' }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    const r = parseAssistantRequest({ lab: 'motion', intent: 'explain', lang: 'ar' });
    await expect(askAssistant(r)).resolves.toMatchObject({ text: 'Hi', provider: 'gemini', model: 'gemini-test' });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toContain('/models/gemini-flash-lite-latest:generateContent');
    expect(url).not.toContain('secret-key');
    expect(init.headers['x-goog-api-key']).toBe('secret-key');

    vi.stubGlobal('fetch', vi.fn(async () => new Response('{"error":{"message":"API key not valid"}}', { status: 400 })));
    await expect(askAssistant(r)).rejects.toMatchObject({ status: 400 });
  });

  it('retries an overloaded model, then falls back to the next model', async () => {
    setEnv({ GEMINI_API_KEY: 'k' });
    expect(geminiModels()).toEqual(['gemini-flash-lite-latest', 'gemini-flash-latest']);
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const ok = { candidates: [{ content: { parts: [{ text: 'OK' }] }, finishReason: 'STOP' }] };
    const fetchMock = vi.fn(async (url) =>
      url.includes('lite') ? new Response('{"error":{"code":503}}', { status: 503 }) : new Response(JSON.stringify(ok), { status: 200 }),
    );
    vi.stubGlobal('fetch', fetchMock);
    const r = parseAssistantRequest({ lab: 'heat', intent: 'why', lang: 'en' });
    await expect(askGemini(r, { retryDelayMs: 0 })).resolves.toMatchObject({ text: 'OK', model: 'gemini-flash-latest' });
    expect(fetchMock.mock.calls.map(([u]) => u.match(/models\/([^:]+)/)[1])).toEqual(['gemini-flash-lite-latest', 'gemini-flash-lite-latest', 'gemini-flash-latest']);
  });

  it('skips a missing fallback model and reports the original error when all fail', async () => {
    setEnv({ GEMINI_API_KEY: 'k', GEMINI_FALLBACK_MODELS: 'gone-model' });
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.stubGlobal('fetch', vi.fn(async (url) => new Response('{}', { status: url.includes('gone-model') ? 404 : 503 })));
    const r = parseAssistantRequest({ lab: 'heat', intent: 'why', lang: 'en' });
    await expect(askGemini(r, { retryDelayMs: 0 })).rejects.toMatchObject({ status: 503 });
  });

  it('falls back to the next model when the first one times out', async () => {
    setEnv({ GEMINI_API_KEY: 'k', GEMINI_MODEL: 'gemini-flash-latest', GEMINI_FALLBACK_MODELS: 'gemini-flash-lite-latest' });
    const ok = { candidates: [{ content: { parts: [{ text: 'OK' }] }, finishReason: 'STOP' }] };
    const fetchMock = vi.fn(async (url) => {
      if (url.includes('models/gemini-flash-latest')) throw Object.assign(new Error('t'), { name: 'TimeoutError' });
      return new Response(JSON.stringify(ok), { status: 200 });
    });
    vi.stubGlobal('fetch', fetchMock);
    const r = parseAssistantRequest({ lab: 'heat', intent: 'why', lang: 'ar' });
    await expect(askGemini(r, { retryDelayMs: 0 })).resolves.toMatchObject({ text: 'OK', provider: 'gemini' });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('does not retry a rejected key', async () => {
    setEnv({ GEMINI_API_KEY: 'bad' });
    const fetchMock = vi.fn(async () => new Response('{}', { status: 400 }));
    vi.stubGlobal('fetch', fetchMock);
    await expect(askGemini(parseAssistantRequest({ lab: 'heat', intent: 'why', lang: 'en' }), { retryDelayMs: 0 })).rejects.toMatchObject({ status: 400 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
