ALTER TABLE posts ADD COLUMN seo_title TEXT;
ALTER TABLE posts ADD COLUMN seo_description TEXT;
ALTER TABLE posts ADD COLUMN seo_keywords TEXT;
ALTER TABLE posts ADD COLUMN og_image TEXT;
ALTER TABLE posts ADD COLUMN canonical_url TEXT;
ALTER TABLE posts ADD COLUMN noindex INTEGER NOT NULL DEFAULT 0;
ALTER TABLE posts ADD COLUMN deleted_at TEXT;
ALTER TABLE categories ADD COLUMN deleted_at TEXT;
ALTER TABLE tags ADD COLUMN deleted_at TEXT;
ALTER TABLE comments ADD COLUMN deleted_at TEXT;
CREATE TABLE IF NOT EXISTS media_assets (
 id TEXT PRIMARY KEY,
 key TEXT NOT NULL UNIQUE,
 url TEXT NOT NULL,
 filename TEXT,
 mime_type TEXT,
 size INTEGER,
 alt_text TEXT,
 deleted_at TEXT,
 created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_posts_deleted_at ON posts(deleted_at);
CREATE INDEX IF NOT EXISTS idx_categories_deleted_at ON categories(deleted_at);
CREATE INDEX IF NOT EXISTS idx_tags_deleted_at ON tags(deleted_at);
CREATE INDEX IF NOT EXISTS idx_comments_status_deleted ON comments(status,deleted_at);
CREATE INDEX IF NOT EXISTS idx_media_deleted_at ON media_assets(deleted_at);
