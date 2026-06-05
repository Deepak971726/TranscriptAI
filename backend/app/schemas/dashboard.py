from pydantic import BaseModel


class DashboardStats(BaseModel):
    total_transcripts: int
    total_audio_files: int
    total_minutes: int
    languages_used: int
