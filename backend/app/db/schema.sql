CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY,
  email varchar(320) UNIQUE,
  full_name varchar(180),
  avatar_url varchar(1024),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS audio_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  original_filename varchar(255) NOT NULL,
  stored_filename varchar(255) NOT NULL,
  storage_path varchar(1024) NOT NULL,
  mime_type varchar(128) NOT NULL,
  size_bytes bigint NOT NULL CHECK (size_bytes >= 0),
  duration_seconds integer,
  checksum varchar(64) NOT NULL,
  status varchar(32) NOT NULL CHECK (status IN ('queued','processing','completed','failed')),
  language varchar(32),
  error_message varchar(1024),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_audio_files_user_checksum UNIQUE (user_id, checksum)
);

CREATE INDEX IF NOT EXISTS ix_audio_files_user_status ON audio_files(user_id, status);

CREATE TABLE IF NOT EXISTS transcripts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  audio_file_id uuid NOT NULL UNIQUE REFERENCES audio_files(id) ON DELETE CASCADE,
  title varchar(255) NOT NULL,
  text text NOT NULL DEFAULT '',
  language varchar(32),
  status varchar(32) NOT NULL CHECK (status IN ('queued','processing','completed','failed')),
  duration_seconds integer,
  confidence double precision CHECK (confidence IS NULL OR (confidence >= 0 AND confidence <= 1)),
  word_count integer NOT NULL DEFAULT 0,
  model_name varchar(64),
  error_message varchar(1024),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_transcripts_user_status ON transcripts(user_id, status);
CREATE INDEX IF NOT EXISTS ix_transcripts_user_language ON transcripts(user_id, language);
CREATE INDEX IF NOT EXISTS ix_transcripts_text_search ON transcripts USING GIN (to_tsvector('simple', coalesce(title,'') || ' ' || coalesce(text,'')));

CREATE TABLE IF NOT EXISTS transcript_segments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transcript_id uuid NOT NULL REFERENCES transcripts(id) ON DELETE CASCADE,
  speaker_label varchar(80) NOT NULL DEFAULT 'Speaker 1',
  start_time double precision NOT NULL CHECK (start_time >= 0),
  end_time double precision NOT NULL CHECK (end_time >= start_time),
  text text NOT NULL,
  confidence double precision,
  words jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_transcript_segments_transcript_start ON transcript_segments(transcript_id, start_time);

CREATE TABLE IF NOT EXISTS transcript_exports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transcript_id uuid NOT NULL REFERENCES transcripts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  format varchar(12) NOT NULL CHECK (format IN ('txt','pdf','docx')),
  status varchar(32) NOT NULL CHECK (status IN ('queued','completed','failed')),
  storage_path varchar(1024),
  size_bytes bigint,
  error_message varchar(1024),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_transcript_exports_user_format ON transcript_exports(user_id, format);

CREATE TABLE IF NOT EXISTS user_settings (
  user_id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  theme varchar(24) NOT NULL DEFAULT 'system' CHECK (theme IN ('light','dark','system')),
  language varchar(64) NOT NULL DEFAULT 'English',
  notifications_enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE audio_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE transcripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE transcript_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE transcript_exports ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE profiles, audio_files, transcripts, transcript_segments, transcript_exports, user_settings FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE profiles, audio_files, transcripts, transcript_segments, transcript_exports, user_settings TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE profiles, audio_files, transcripts, transcript_segments, transcript_exports, user_settings TO service_role;

CREATE POLICY profiles_owner_access ON profiles FOR ALL TO authenticated
USING ((select auth.uid()) = id)
WITH CHECK ((select auth.uid()) = id);

CREATE POLICY audio_files_owner_access ON audio_files FOR ALL TO authenticated
USING ((select auth.uid()) = user_id)
WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY transcripts_owner_access ON transcripts FOR ALL TO authenticated
USING ((select auth.uid()) = user_id)
WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY transcript_segments_owner_access ON transcript_segments FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM transcripts
    WHERE transcripts.id = transcript_segments.transcript_id
      AND transcripts.user_id = (select auth.uid())
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM transcripts
    WHERE transcripts.id = transcript_segments.transcript_id
      AND transcripts.user_id = (select auth.uid())
  )
);

CREATE POLICY transcript_exports_owner_access ON transcript_exports FOR ALL TO authenticated
USING ((select auth.uid()) = user_id)
WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY user_settings_owner_access ON user_settings FOR ALL TO authenticated
USING ((select auth.uid()) = user_id)
WITH CHECK ((select auth.uid()) = user_id);
