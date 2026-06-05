from functools import lru_cache

from supabase import Client, create_client

from app.core.config import Settings, get_settings


@lru_cache
def _create_supabase_admin_client(supabase_url: str, service_role_key: str) -> Client:
    return create_client(supabase_url, service_role_key)


def get_supabase_admin_client(settings: Settings | None = None) -> Client | None:
    """Return a Supabase service-role client when Supabase settings are present."""

    active_settings = settings or get_settings()
    if not active_settings.supabase_url or not active_settings.supabase_service_role_key:
        return None

    return _create_supabase_admin_client(
        str(active_settings.supabase_url),
        active_settings.supabase_service_role_key.get_secret_value(),
    )
