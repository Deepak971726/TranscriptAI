from fastapi.testclient import TestClient

from app.main import create_app
from app.core.config import Settings


def test_websocket_connects(tmp_path) -> None:
    app = create_app(
        Settings(
            environment="test",
            database_url=f"sqlite+aiosqlite:///{tmp_path / 'test.db'}",
            jwt_secret="test-secret",
            upload_directory=tmp_path / "uploads",
            export_directory=tmp_path / "exports",
            temp_directory=tmp_path / "tmp",
            trusted_hosts="*",
        )
    )
    with TestClient(app) as client:
        with client.websocket_connect("/ws/transcribe") as websocket:
            first = websocket.receive_json()
            assert first["event"] == "connected"
            websocket.send_json({"event": "disconnect"})
