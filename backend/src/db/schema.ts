import { sql } from 'drizzle-orm';
import { check, index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';
import type { ProjectColor, ProjectIcon, Status } from '@todo-zone/shared';

// docs/DATA-MODEL.md 2장. DB 제약은 services 버그를 막는 마지막 안전장치다 (DATA-MODEL 5).

export const projects = sqliteTable(
  'projects',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    nameKey: text('name_key').notNull().unique(), // D-053
    color: text('color').$type<ProjectColor>().notNull(), // D-054, D-057
    icon: text('icon').$type<ProjectIcon>().notNull().default('folder'), // D-062
    isInbox: integer('is_inbox', { mode: 'boolean' }).notNull().default(false), // D-052
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
  },
  () => [
    uniqueIndex('projects_one_inbox')
      .on(sql`is_inbox`)
      .where(sql`is_inbox = 1`),
    check('projects_is_inbox_bool', sql`is_inbox IN (0, 1)`),
    check('projects_color', sql`color IN ('inbox', 'mist', 'gold', 'sage', 'salmon')`),
    check(
      'projects_inbox_color',
      sql`(is_inbox = 1 AND color = 'inbox') OR (is_inbox = 0 AND color <> 'inbox')`,
    ),
    check(
      'projects_inbox_icon',
      sql`(is_inbox = 1 AND icon = 'inbox') OR (is_inbox = 0 AND icon <> 'inbox')`,
    ),
  ],
);

export const cards = sqliteTable(
  'cards',
  {
    id: text('id').primaryKey(),
    title: text('title').notNull(),
    memo: text('memo').notNull().default(''),
    dueDate: text('due_date'),
    status: text('status').$type<Status>().notNull(),
    position: integer('position').notNull(),
    projectId: text('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'restrict' }), // D-055
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
  },
  (t) => [
    index('cards_status_position').on(t.status, t.position),
    check('cards_title_length', sql`length(title) BETWEEN 1 AND 100`),
    check('cards_memo_length', sql`length(memo) <= 2000`),
    check('cards_status', sql`status IN ('todo', 'doing', 'done')`),
    check('cards_position', sql`position >= 0`),
    check(
      'cards_due_date',
      sql`due_date IS NULL OR due_date GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'`,
    ),
  ],
);
