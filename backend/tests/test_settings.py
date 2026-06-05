from httpx import AsyncClient


async def test_settings_read_and_update(client: AsyncClient) -> None:
    read_response = await client.get("/api/settings")
    assert read_response.status_code == 200
    assert read_response.json()["theme"] == "system"

    update_response = await client.put(
        "/api/settings",
        json={"theme": "dark", "language": "English", "notifications_enabled": False},
    )
    assert update_response.status_code == 200
    assert update_response.json()["theme"] == "dark"
    assert update_response.json()["notifications_enabled"] is False
