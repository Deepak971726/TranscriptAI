"""initial TranscribeAI schema

Revision ID: 20260604_0001
Revises:
Create Date: 2026-06-04
"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "20260604_0001"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "profiles",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("email", sa.String(length=320), nullable=True),
        sa.Column("full_name", sa.String(length=180), nullable=True),
        sa.Column("avatar_url", sa.String(length=1024), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_profiles_email", "profiles", ["email"], unique=True)

    op.create_table(
        "audio_files",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("original_filename", sa.String(length=255), nullable=False),
        sa.Column("stored_filename", sa.String(length=255), nullable=False),
        sa.Column("storage_path", sa.String(length=1024), nullable=False),
        sa.Column("mime_type", sa.String(length=128), nullable=False),
        sa.Column("size_bytes", sa.BigInteger(), nullable=False),
        sa.Column("duration_seconds", sa.Integer(), nullable=True),
        sa.Column("checksum", sa.String(length=64), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("language", sa.String(length=32), nullable=True),
        sa.Column("error_message", sa.String(length=1024), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.CheckConstraint("size_bytes >= 0", name="ck_audio_files_size_non_negative"),
        sa.CheckConstraint("status IN ('queued','processing','completed','failed')", name="ck_audio_files_status"),
        sa.ForeignKeyConstraint(["user_id"], ["profiles.id"], ondelete="CASCADE"),
        sa.UniqueConstraint("user_id", "checksum", name="uq_audio_files_user_checksum"),
    )
    op.create_index("ix_audio_files_user_id", "audio_files", ["user_id"])
    op.create_index("ix_audio_files_user_status", "audio_files", ["user_id", "status"])

    op.create_table(
        "transcripts",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("audio_file_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("text", sa.Text(), nullable=False, server_default=""),
        sa.Column("language", sa.String(length=32), nullable=True),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("duration_seconds", sa.Integer(), nullable=True),
        sa.Column("confidence", sa.Float(), nullable=True),
        sa.Column("word_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("model_name", sa.String(length=64), nullable=True),
        sa.Column("error_message", sa.String(length=1024), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.CheckConstraint("status IN ('queued','processing','completed','failed')", name="ck_transcripts_status"),
        sa.CheckConstraint("confidence IS NULL OR (confidence >= 0 AND confidence <= 1)", name="ck_transcripts_confidence"),
        sa.ForeignKeyConstraint(["audio_file_id"], ["audio_files.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["profiles.id"], ondelete="CASCADE"),
        sa.UniqueConstraint("audio_file_id", name="uq_transcripts_audio_file_id"),
    )
    op.create_index("ix_transcripts_user_status", "transcripts", ["user_id", "status"])
    op.create_index("ix_transcripts_user_language", "transcripts", ["user_id", "language"])
    op.create_index("ix_transcripts_created_at", "transcripts", ["created_at"])
    op.execute("CREATE INDEX ix_transcripts_text_search ON transcripts USING GIN (to_tsvector('simple', coalesce(title,'') || ' ' || coalesce(text,'')))")

    op.create_table(
        "transcript_segments",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("transcript_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("speaker_label", sa.String(length=80), nullable=False),
        sa.Column("start_time", sa.Float(), nullable=False),
        sa.Column("end_time", sa.Float(), nullable=False),
        sa.Column("text", sa.Text(), nullable=False),
        sa.Column("confidence", sa.Float(), nullable=True),
        sa.Column("words", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.CheckConstraint("start_time >= 0", name="ck_segments_start_non_negative"),
        sa.CheckConstraint("end_time >= start_time", name="ck_segments_end_after_start"),
        sa.ForeignKeyConstraint(["transcript_id"], ["transcripts.id"], ondelete="CASCADE"),
    )
    op.create_index("ix_transcript_segments_transcript_start", "transcript_segments", ["transcript_id", "start_time"])

    op.create_table(
        "transcript_exports",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("transcript_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("format", sa.String(length=12), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("storage_path", sa.String(length=1024), nullable=True),
        sa.Column("size_bytes", sa.BigInteger(), nullable=True),
        sa.Column("error_message", sa.String(length=1024), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.CheckConstraint("format IN ('txt','pdf','docx')", name="ck_transcript_exports_format"),
        sa.CheckConstraint("status IN ('queued','completed','failed')", name="ck_transcript_exports_status"),
        sa.ForeignKeyConstraint(["transcript_id"], ["transcripts.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["profiles.id"], ondelete="CASCADE"),
    )
    op.create_index("ix_transcript_exports_user_format", "transcript_exports", ["user_id", "format"])

    op.create_table(
        "user_settings",
        sa.Column("user_id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("theme", sa.String(length=24), nullable=False, server_default="system"),
        sa.Column("language", sa.String(length=64), nullable=False, server_default="English"),
        sa.Column("notifications_enabled", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.CheckConstraint("theme IN ('light','dark','system')", name="ck_user_settings_theme"),
        sa.ForeignKeyConstraint(["user_id"], ["profiles.id"], ondelete="CASCADE"),
    )


def downgrade() -> None:
    op.drop_table("user_settings")
    op.drop_index("ix_transcript_exports_user_format", table_name="transcript_exports")
    op.drop_table("transcript_exports")
    op.drop_index("ix_transcript_segments_transcript_start", table_name="transcript_segments")
    op.drop_table("transcript_segments")
    op.execute("DROP INDEX IF EXISTS ix_transcripts_text_search")
    op.drop_index("ix_transcripts_created_at", table_name="transcripts")
    op.drop_index("ix_transcripts_user_language", table_name="transcripts")
    op.drop_index("ix_transcripts_user_status", table_name="transcripts")
    op.drop_table("transcripts")
    op.drop_index("ix_audio_files_user_status", table_name="audio_files")
    op.drop_index("ix_audio_files_user_id", table_name="audio_files")
    op.drop_table("audio_files")
    op.drop_index("ix_profiles_email", table_name="profiles")
    op.drop_table("profiles")
