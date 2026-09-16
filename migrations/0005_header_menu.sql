CREATE TABLE IF NOT EXISTS header_menu_items (
  id TEXT PRIMARY KEY,
  category_id TEXT NOT NULL UNIQUE,
  parent_id TEXT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (category_id) REFERENCES categories(id),
  FOREIGN KEY (parent_id) REFERENCES header_menu_items(id)
);

CREATE INDEX IF NOT EXISTS idx_header_menu_parent_order ON header_menu_items(parent_id, sort_order);

INSERT OR IGNORE INTO header_menu_items (id, category_id, parent_id, sort_order, created_at, updated_at)
SELECT
  'menu-' || c.id,
  c.id,
  NULL,
  ROW_NUMBER() OVER (ORDER BY c.name) - 1,
  datetime('now'),
  datetime('now')
FROM categories c
WHERE c.deleted_at IS NULL;
