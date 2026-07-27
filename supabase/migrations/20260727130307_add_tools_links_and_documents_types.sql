/*
# Add tools_links table and extend documents with file metadata

## Overview
1. New table `tools_links` — user-managed bookmarks for bid pages and tool links,
   replacing the hard-coded list in the Tools page. Each link has a category
   ("bid" or "tool"), name, url, and description.
2. Add columns to `documents` to support typed uploads: `file_type` (pdf|image|note),
   `file_size`, `mime_type`, and `file_name`. Existing rows default to `note`.

## New Tables
- `tools_links`
  - id (uuid, pk)
  - user_id (uuid, owner, default auth.uid())
  - name (text, not null)
  - url (text, not null)
  - description (text)
  - category (text: 'bid' | 'tool', default 'tool')
  - created_at (timestamptz)

## Modified Tables
- `documents` — add file_type, file_size, mime_type, file_name columns.

## Security
- RLS enabled on tools_links with owner-scoped CRUD (auth.uid() = user_id).
- documents already has RLS; new columns inherit existing policies.
*/

CREATE TABLE IF NOT EXISTS tools_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  url text NOT NULL,
  description text,
  category text NOT NULL DEFAULT 'tool',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE tools_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own" ON tools_links;
CREATE POLICY "select_own" ON tools_links FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own" ON tools_links;
CREATE POLICY "insert_own" ON tools_links FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own" ON tools_links;
CREATE POLICY "update_own" ON tools_links FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own" ON tools_links;
CREATE POLICY "delete_own" ON tools_links FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Add file metadata columns to documents
ALTER TABLE documents ADD COLUMN IF NOT EXISTS file_type text DEFAULT 'note';
ALTER TABLE documents ADD COLUMN IF NOT EXISTS file_name text;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS file_size bigint;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS mime_type text;

CREATE INDEX IF NOT EXISTS idx_tools_links_user ON tools_links(user_id);
