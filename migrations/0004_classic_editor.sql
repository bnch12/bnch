ALTER TABLE posts ADD COLUMN content_format TEXT NOT NULL DEFAULT 'MARKDOWN';
CREATE INDEX IF NOT EXISTS idx_posts_content_format ON posts(content_format);
