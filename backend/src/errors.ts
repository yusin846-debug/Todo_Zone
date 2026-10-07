import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import type { ApiError, ApiErrorCode } from '@todo-zone/shared';

// 오류 응답 형식은 docs/API-SPEC.md 1.1. message는 화면에 그대로 보여 줄 한글 문장이다.

export class AppError extends Error {
  constructor(
    readonly status: number,
    readonly code: ApiErrorCode,
    message: string,
  ) {
    super(message);
  }
}

export const notFound = () => new AppError(404, 'NOT_FOUND', '찾을 수 없어요. 새로고침해 주세요.');
export const inboxLocked = () =>
  new AppError(400, 'INBOX_LOCKED', 'Inbox는 바꾸거나 삭제할 수 없어요.');
export const invalid = (message: string) => new AppError(400, 'VALIDATION', message);

function body(code: ApiErrorCode, message: string): ApiError {
  return { error: { code, message } };
}

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof AppError) {
    res.status(err.status).json(body(err.code, err.message));
    return;
  }
  if (err instanceof ZodError) {
    res.status(400).json(body('VALIDATION', err.issues[0]?.message ?? '입력이 올바르지 않아요.'));
    return;
  }
  // express.json()이 깨진 JSON을 만났을 때
  if (err?.type === 'entity.parse.failed') {
    res.status(400).json(body('VALIDATION', '요청 형식이 올바르지 않아요.'));
    return;
  }
  console.error(err);
  res.status(500).json(body('INTERNAL', '저장하지 못했어요. 잠시 후 다시 시도해 주세요.'));
};
