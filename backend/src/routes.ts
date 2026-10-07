import { Router } from 'express';
import {
  createAreaInput,
  createCardInput,
  createProjectInput,
  moveCardInput,
  updateCardInput,
  updateAreaInput,
  updateProjectInput,
  type HealthResponse,
} from '@todo-zone/shared';
import type { Db } from './db/client.ts';
import { notFound } from './errors.ts';
import { createArea, deleteArea, listAreas, updateArea } from './services/areas.ts';
import { createCard, deleteCard, listCards, moveCardTo, updateCard } from './services/cards.ts';
import { createProject, deleteProject, listProjects, updateProject } from './services/projects.ts';

// HTTP만 담당한다: 입력 검사(shared zod) → services 호출 → 상태 코드 (ARCHITECTURE 3).
// 엔드포인트 목록과 응답 모양은 docs/API-SPEC.md 2장.

export function apiRoutes(db: Db) {
  const r = Router();

  r.get('/health', (_req, res) => {
    const body: HealthResponse = { status: 'ok' };
    res.json(body);
  });

  r.get('/board', async (_req, res) => {
    const [areas, projects, cards] = await Promise.all([
      listAreas(db),
      listProjects(db),
      listCards(db),
    ]);
    res.json({ areas, projects, cards });
  });

  r.post('/cards', async (req, res) => {
    res.status(201).json(await createCard(db, createCardInput.parse(req.body)));
  });

  r.patch('/cards/:id', async (req, res) => {
    res.json(await updateCard(db, req.params.id, updateCardInput.parse(req.body)));
  });

  r.post('/cards/:id/move', async (req, res) => {
    res.json({ cards: await moveCardTo(db, req.params.id, moveCardInput.parse(req.body)) });
  });

  r.delete('/cards/:id', async (req, res) => {
    await deleteCard(db, req.params.id);
    res.status(204).end();
  });

  r.post('/projects', async (req, res) => {
    res.status(201).json(await createProject(db, createProjectInput.parse(req.body)));
  });

  r.patch('/projects/:id', async (req, res) => {
    res.json(await updateProject(db, req.params.id, updateProjectInput.parse(req.body)));
  });

  r.delete('/projects/:id', async (req, res) => {
    res.json(await deleteProject(db, req.params.id));
  });

  r.post('/areas', async (req, res) => {
    res.status(201).json(await createArea(db, createAreaInput.parse(req.body)));
  });

  r.patch('/areas/:id', async (req, res) => {
    res.json(await updateArea(db, req.params.id, updateAreaInput.parse(req.body)));
  });

  r.delete('/areas/:id', async (req, res) => {
    res.json(await deleteArea(db, req.params.id));
  });

  r.use(() => {
    throw notFound();
  });

  return r;
}
