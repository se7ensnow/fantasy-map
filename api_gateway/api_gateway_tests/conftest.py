import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport

USER = "http://user-service"
MAP = "http://map-service"


@pytest.fixture
def user_base_url():
    return USER


@pytest.fixture
def map_base_url():
    return MAP


@pytest.fixture(autouse=True)
def patch_service_urls(monkeypatch, user_base_url, map_base_url):
    import api_gateway_app.config as cfg
    monkeypatch.setattr(cfg, "USER_SERVICE_URL", user_base_url, raising=False)
    monkeypatch.setattr(cfg, "MAP_SERVICE_URL", map_base_url, raising=False)

    import api_gateway_app.security as sec
    monkeypatch.setattr(sec, "USER_SERVICE_URL", user_base_url, raising=False)

    import api_gateway_app.proxy_routes.maps_proxy as mp
    monkeypatch.setattr(mp, "USER_SERVICE_URL", user_base_url, raising=False)
    monkeypatch.setattr(mp, "MAP_SERVICE_URL", map_base_url, raising=False)


@pytest.fixture
def test_user_id():
    return "11111111-1111-1111-1111-111111111111"


@pytest.fixture
def test_map_id():
    return "22222222-2222-2222-2222-222222222222"


@pytest.fixture
def test_loc_id():
    return "33333333-3333-3333-3333-333333333333"


@pytest_asyncio.fixture
async def async_client():
    from api_gateway_app.main import app
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac