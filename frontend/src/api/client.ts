import type { ApiError, ApiErrorCode } from '@todo-zone/shared';

// 서버 호출 한 곳. 오류 응답(API-SPEC 1.1)은 ApiRequestError로 바꿔 던진다.

export class ApiRequestError extends Error {
  constructor(
    readonly code: ApiErrorCode | 'NETWORK',
    message: string,
  ) {
    super(message);
  }
}

const NETWORK_MESSAGE = '서버에 연결할 수 없어요. 서버가 켜져 있는지 확인해 주세요.';

export async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, {
      method,
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiRequestError('NETWORK', NETWORK_MESSAGE);
  }

  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const err = (data as ApiError | null)?.error;
    throw new ApiRequestError(
      err?.code ?? 'INTERNAL',
      err?.message ?? '저장하지 못했어요. 잠시 후 다시 시도해 주세요.',
    );
  }
  return data as T;
}
