CREATE TABLE IF NOT EXISTS tasks (
  slug        TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  description TEXT,
  completed   INTEGER NOT NULL DEFAULT 0,
  due_date    TEXT NOT NULL
);
