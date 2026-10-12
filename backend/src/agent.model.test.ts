import { afterEach, describe, expect, it, vi } from 'vitest';
import { agentConnection, agentFailure, planWithAI } from './agent/model.ts';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('OpenAI direct connection', () => {
  it('uses the OpenAI key ahead of Gateway and requests structured proposals without response storage', async () => {
    vi.stubEnv('OPENAI_API_KEY', 'test-openai-key');
    vi.stubEnv('OPENAI_MODEL', 'gpt-5.4-mini');
    vi.stubEnv('AI_GATEWAY_API_KEY', 'test-unused-gateway-key');
    const proposal = {
      reply: '어떤 Card를 변경할까요?',
      clarification: '어떤 Card를 변경할까요?',
      changes: [],
    };
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          id: 'resp_test',
          object: 'response',
          created_at: 1,
          model: 'gpt-5.4-mini',
          status: 'completed',
          output: [
            {
              id: 'msg_test',
              type: 'message',
              role: 'assistant',
              status: 'completed',
              content: [{ type: 'output_text', text: JSON.stringify(proposal), annotations: [] }],
            },
          ],
          usage: { input_tokens: 10, output_tokens: 10, total_tokens: 20 },
        }),
        { headers: { 'Content-Type': 'application/json' } },
      ),
    );
    vi.stubGlobal('fetch', fetchMock);
    expect(agentConnection()).toMatchObject({ configured: true, model: 'gpt-5.4-mini' });
    expect(
      await planWithAI({
        board: { cards: [], projects: [], areas: [] },
        messages: [],
        pending: [],
        today: '2026-10-12',
        timezone: 'Asia/Seoul',
      }),
    ).toEqual(proposal);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, options] = fetchMock.mock.calls[0]!;
    expect(String(url)).toBe('https://api.openai.com/v1/responses');
    expect(new Headers(options.headers).get('authorization')).toBe('Bearer test-openai-key');
    const body = JSON.parse(options.body);
    expect(body).toMatchObject({
      model: 'gpt-5.4-mini',
      store: false,
      text: { format: { type: 'json_schema' } },
    });
  });

  it('distinguishes OpenAI exhausted quota from transient rate limits and authentication errors', () => {
    const failure = (statusCode: number, code: string) =>
      agentFailure({ statusCode, responseBody: JSON.stringify({ error: { code } }) }, 'openai');
    expect(failure(429, 'insufficient_quota')).toMatchObject({ code: 'AGENT_BILLING' });
    expect(failure(429, 'rate_limit_exceeded')).toMatchObject({ code: 'RATE_LIMIT' });
    expect(failure(401, 'invalid_api_key').message).toContain('OpenAI API 키');
    expect(failure(403, 'permission_denied').message).not.toContain('Gateway');
  });
});
