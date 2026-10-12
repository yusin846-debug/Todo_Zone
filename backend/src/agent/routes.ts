import { Router } from 'express';
import { agentApproveInput, agentChatInput } from '@todo-zone/shared';
import type { Db } from '../db/client.ts';
import { agentConnection, planWithAI, type AgentPlanner } from './model.ts';
import { approveChanges, ensureAgentTables, prepareChanges } from './service.ts';

export function agentRoutes(db: Db, planner: AgentPlanner = planWithAI) {
  const router = Router();
  let ready: Promise<void> | undefined;
  router.use(async (_req, res, next) => {
    res.set('Cache-Control', 'no-store');
    ready ??= ensureAgentTables(db).catch((error) => {
      ready = undefined;
      throw error;
    });
    await ready;
    next();
  });
  router.get('/status', (_req, res) => res.json(agentConnection()));
  router.post('/chat', async (req, res) =>
    res.json(await prepareChanges(db, agentChatInput.parse(req.body), planner)),
  );
  router.post('/approve', async (req, res) =>
    res.json(await approveChanges(db, agentApproveInput.parse(req.body))),
  );
  return router;
}
