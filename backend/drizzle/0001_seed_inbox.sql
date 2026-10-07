-- DATA-MODEL 6: Inbox는 처음부터 정확히 1개 있다 (D-052). 이름·색·아이콘은 고정 (D-032, D-062).
INSERT INTO `projects` (`id`, `name`, `name_key`, `color`, `icon`, `is_inbox`, `created_at`, `updated_at`)
VALUES ('00000000-0000-4000-8000-000000000001', 'Inbox', 'inbox', 'inbox', 'inbox', 1,
        strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now'));
