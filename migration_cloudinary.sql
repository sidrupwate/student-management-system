-- ============================================================
-- MIGRATION: Add Cloudinary photo storage support
-- ------------------------------------------------------------
-- Run this against your EXISTING Neon database (the one you
-- already set up with the original database.sql). It adds what's
-- needed for the Cloudinary swap WITHOUT dropping or losing any
-- existing student data.
--
-- Run it the same way you ran database.sql:
--   psql "<your-neon-connection-string>" -f migration_cloudinary.sql
-- or paste its contents into Neon's SQL Editor and run.
-- ============================================================

-- Widen photo_url - Cloudinary URLs (with transformation
-- parameters baked in) can be longer than the original 255-char
-- limit.
ALTER TABLE students
  ALTER COLUMN photo_url TYPE VARCHAR(500);

-- Add the new column that stores Cloudinary's public_id, needed
-- to delete or replace a photo on Cloudinary (Cloudinary assets
-- can't be deleted by URL alone).
ALTER TABLE students
  ADD COLUMN IF NOT EXISTS photo_public_id VARCHAR(255);

-- Any students created BEFORE this migration have a photo_url
-- like "/uploads/student-xxx.jpg" (the old local-disk path) and
-- no photo_public_id. Those files no longer exist on Render's
-- disk anyway (ephemeral filesystem), so we clear them out
-- rather than show broken images. Their photo_public_id was
-- already NULL by default, nothing to do there.
UPDATE students
SET photo_url = NULL
WHERE photo_url LIKE '/uploads/%';

-- Verify:
--   \d students
--   SELECT id, name, photo_url, photo_public_id FROM students;
