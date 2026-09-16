CREATE TABLE IF NOT EXISTS post_categories (
  post_id TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, category_id)
);

ALTER TABLE comments ADD COLUMN comment_type TEXT NOT NULL DEFAULT 'comment';
ALTER TABLE comments ADD COLUMN parent_comment_id TEXT REFERENCES comments(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_post_categories_category ON post_categories(category_id);
