import type {
  AgentChatInput,
  AgentApproveInput,
  AgentReply,
  AgentApplied,
  AgentConnection,
} from '@todo-zone/shared';
import { request } from './client.ts';
export const agentStatus = () => request<AgentConnection>('GET', '/api/agent/status');
export const chatWithAgent = (input: AgentChatInput) =>
  request<AgentReply>('POST', '/api/agent/chat', input);
export const approveAgent = (input: AgentApproveInput) =>
  request<AgentApplied>('POST', '/api/agent/approve', input);
