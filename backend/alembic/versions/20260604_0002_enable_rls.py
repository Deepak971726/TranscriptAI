"""enable Supabase RLS policies

Revision ID: 20260604_0002
Revises: 20260604_0001
Create Date: 2026-06-04
"""

from collections.abc import Sequence

from alembic import op

revision: str = "20260604_0002"
down_revision: str | None = "20260604_0001"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    tables = [
        "profiles",
        "audio_files",
        "transcripts",
        "transcript_segments",
        "transcript_exports",
        "user_settings",
    ]
    for table in tables:
        op.execute(f"ALTER TABLE public.{table} ENABLE ROW LEVEL SECURITY")
        op.execute(f"REVOKE ALL ON TABLE public.{table} FROM anon")
        op.execute(f"GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.{table} TO authenticated")
        op.execute(f"GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.{table} TO service_role")

    op.execute(
        """
        CREATE POLICY profiles_owner_access
        ON public.profiles
        FOR ALL
        TO authenticated
        USING ((select auth.uid()) = id)
        WITH CHECK ((select auth.uid()) = id)
        """
    )
    op.execute(
        """
        CREATE POLICY audio_files_owner_access
        ON public.audio_files
        FOR ALL
        TO authenticated
        USING ((select auth.uid()) = user_id)
        WITH CHECK ((select auth.uid()) = user_id)
        """
    )
    op.execute(
        """
        CREATE POLICY transcripts_owner_access
        ON public.transcripts
        FOR ALL
        TO authenticated
        USING ((select auth.uid()) = user_id)
        WITH CHECK ((select auth.uid()) = user_id)
        """
    )
    op.execute(
        """
        CREATE POLICY transcript_segments_owner_access
        ON public.transcript_segments
        FOR ALL
        TO authenticated
        USING (
          EXISTS (
            SELECT 1
            FROM public.transcripts
            WHERE transcripts.id = transcript_segments.transcript_id
              AND transcripts.user_id = (select auth.uid())
          )
        )
        WITH CHECK (
          EXISTS (
            SELECT 1
            FROM public.transcripts
            WHERE transcripts.id = transcript_segments.transcript_id
              AND transcripts.user_id = (select auth.uid())
          )
        )
        """
    )
    op.execute(
        """
        CREATE POLICY transcript_exports_owner_access
        ON public.transcript_exports
        FOR ALL
        TO authenticated
        USING ((select auth.uid()) = user_id)
        WITH CHECK ((select auth.uid()) = user_id)
        """
    )
    op.execute(
        """
        CREATE POLICY user_settings_owner_access
        ON public.user_settings
        FOR ALL
        TO authenticated
        USING ((select auth.uid()) = user_id)
        WITH CHECK ((select auth.uid()) = user_id)
        """
    )


def downgrade() -> None:
    policies = [
        ("profiles", "profiles_owner_access"),
        ("audio_files", "audio_files_owner_access"),
        ("transcripts", "transcripts_owner_access"),
        ("transcript_segments", "transcript_segments_owner_access"),
        ("transcript_exports", "transcript_exports_owner_access"),
        ("user_settings", "user_settings_owner_access"),
    ]
    for table, policy in policies:
        op.execute(f"DROP POLICY IF EXISTS {policy} ON public.{table}")
    for table, _ in policies:
        op.execute(f"ALTER TABLE public.{table} DISABLE ROW LEVEL SECURITY")
