-- Indexes for the paginated admin CMS list.
-- Keep the dashboard limited to a small page while making every post reachable.

CREATE INDEX IF NOT EXISTS idx_posts_admin_updated
ON posts(updated_at DESC, id DESC)
WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_posts_admin_status_updated
ON posts(status, updated_at DESC, id DESC)
WHERE deleted_at IS NULL;
