from uuid import uuid4

from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.models.audio_file import AudioFile
from app.models.profile import Profile
from app.models.transcript import Transcript
from app.schemas.auth import CurrentUser


async def seed_transcript(
    session_maker: async_sessionmaker[AsyncSession],
    user: CurrentUser,
) -> str:
    async with session_maker() as session:
        profile = Profile(id=user.id, email=user.email)
        audio = AudioFile(
            id=uuid4(),
            user_id=user.id,
            original_filename="meeting.mp3",
            stored_filename="meeting.mp3",
            storage_path="uploads/meeting.mp3",
            mime_type="audio/mpeg",
            size_bytes=100,
            checksum="abc123",
            status="completed",
        )
        transcript = Transcript(
            user_id=user.id,
            audio_file_id=audio.id,
            title="meeting.mp3",
            text="A clear product meeting transcript",
            language="English",
            status="completed",
            word_count=5,
        )
        session.add_all([profile, audio, transcript])
        await session.commit()
        return str(transcript.id)


async def test_list_and_read_transcripts(
    client: AsyncClient,
    session_maker: async_sessionmaker[AsyncSession],
    test_user: CurrentUser,
) -> None:
    transcript_id = await seed_transcript(session_maker, test_user)

    list_response = await client.get("/api/transcripts")
    assert list_response.status_code == 200
    assert list_response.json()["total"] == 1

    detail_response = await client.get(f"/api/transcripts/{transcript_id}")
    assert detail_response.status_code == 200
    assert detail_response.json()["title"] == "meeting.mp3"
