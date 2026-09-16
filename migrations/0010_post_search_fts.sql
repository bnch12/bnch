-- Full-text search index for public post search.
-- Trigram keeps substring-style search while avoiding repeated full-table LIKE scans.

CREATE VIRTUAL TABLE IF NOT EXISTS posts_fts USING fts5(
  post_id UNINDEXED,
  title,
  excerpt,
  slug,
  content,
  tokenize='trigram'
);

INSERT INTO posts_fts (post_id,title,excerpt,slug,content)
SELECT
  p.id,
  COALESCE(p.title,''),
  COALESCE(p.excerpt,''),
  COALESCE(p.slug,''),
  COALESCE(p.content,'')
FROM posts p
WHERE NOT EXISTS (
  SELECT 1 FROM posts_fts f WHERE f.post_id=p.id
);

CREATE TRIGGER IF NOT EXISTS posts_fts_ai
AFTER INSERT ON posts
BEGIN
  INSERT INTO posts_fts (post_id,title,excerpt,slug,content)
  VALUES (new.id,COALESCE(new.title,''),COALESCE(new.excerpt,''),COALESCE(new.slug,''),COALESCE(new.content,''));
END;

CREATE TRIGGER IF NOT EXISTS posts_fts_ad
AFTER DELETE ON posts
BEGIN
  DELETE FROM posts_fts WHERE post_id=old.id;
END;

CREATE TRIGGER IF NOT EXISTS posts_fts_au
AFTER UPDATE OF title,excerpt,slug,content ON posts
BEGIN
  DELETE FROM posts_fts WHERE post_id=old.id;
  INSERT INTO posts_fts (post_id,title,excerpt,slug,content)
  VALUES (new.id,COALESCE(new.title,''),COALESCE(new.excerpt,''),COALESCE(new.slug,''),COALESCE(new.content,''));
END;

PRAGMA optimize;
