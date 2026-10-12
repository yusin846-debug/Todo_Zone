import { z } from 'zod';
import { createCardInput, updateCardInput, checklistInput } from './schemas.ts';
import { STATUSES } from './constants.ts';
import type { Card } from './types.ts';

export const agentContent = z.strictObject({
  title: createCardInput.shape.title,
  memo: updateCardInput.shape.memo.unwrap(),
  dueDate: updateCardInput.shape.dueDate.unwrap(),
  projectId: z.string().min(1),
  status: z.enum(STATUSES),
  checklist: checklistInput,
});
export type AgentContent = z.infer<typeof agentContent>;
export type AgentChange = {
  id: string;
  kind: 'create' | 'update' | 'complete';
  cardId: string;
  before: Card | null;
  after: AgentContent;
  projectName: string;
  projectUpdatedAt: string;
};
export type AgentReply = {
  conversationId: string;
  version: number;
  reply: string;
  clarification: string | null;
  changes: AgentChange[];
  expiresAt: number;
};
export type AgentApplied = { appliedCount: number; cardIds: string[]; appliedAt: string };
export type AgentMessage = { role: 'user' | 'assistant'; content: string };
export type AgentConnection = { configured: boolean; model: string; message: string };
export const agentChatInput = z.strictObject({
  conversationId: z.uuid(),
  expectedVersion: z.number().int().min(0),
  message: z.string().trim().min(1).max(2000),
  draft: z
    .array(
      z.strictObject({ id: z.uuid(), title: createCardInput.shape.title, selected: z.boolean() }),
    )
    .max(10)
    .optional(),
  timezone: z
    .string()
    .max(80)
    .refine((value) => {
      try {
        new Intl.DateTimeFormat('en-US', { timeZone: value });
        return true;
      } catch {
        return false;
      }
    }, '시간대가 올바르지 않아요.'),
});
export const agentApproveInput = z.strictObject({
  conversationId: z.uuid(),
  version: z.number().int().positive(),
  changes: z
    .array(z.strictObject({ id: z.uuid(), title: createCardInput.shape.title }))
    .min(1)
    .max(10)
    .refine(
      (items) => new Set(items.map((item) => item.id)).size === items.length,
      '변경 항목이 중복됐어요.',
    ),
});
export type AgentChatInput = z.infer<typeof agentChatInput>;
export type AgentApproveInput = z.infer<typeof agentApproveInput>;
