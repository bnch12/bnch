CREATE TABLE IF NOT EXISTS post_categories (
  post_id TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, category_id)
);

CREATE INDEX IF NOT EXISTS idx_post_categories_category ON post_categories(category_id);
