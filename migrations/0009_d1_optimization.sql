-- D1 read optimizations for public queries.

CREATE INDEX IF NOT EXISTS idx_post_tags_tag_post
ON post_tags(tag_id, post_id);

CREATE INDEX IF NOT EXISTS idx_posts_published_date
ON posts(published_at DESC)
WHERE status='PUBLISHED'
  AND published_at IS NOT NULL
  AND deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_posts_category_published
ON posts(category_id, published_at DESC)
WHERE status='PUBLISHED'
  AND published_at IS NOT NULL
  AND deleted_at IS NULL;
