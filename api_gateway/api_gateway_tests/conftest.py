import pytest
import pytest_asyncio
import httpx

from api_gateway_app import config
from api_gateway_app import main
from api_gateway_app import security
from api_gateway_app.proxy_routes import maps_proxy

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
    monkeypatch.setattr(config, "USER_SERVICE_URL", user_base_url, raising=False)
    monkeypatch.setattr(config, "MAP_SERVICE_URL", map_base_url, raising=False)

    monkeypatch.setattr(security, "USER_SERVICE_URL", user_base_url, raising=False)

    monkeypatch.setattr(maps_proxy, "USER_SERVICE_URL", user_base_url, raising=False)
    monkeypatch.setattr(maps_proxy, "MAP_SERVICE_URL", map_base_url, raising=False)


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
    transport = httpx.ASGITransport(app=main.app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac