import pytest_asyncio
from httpx import AsyncClient, ASGITransport

from api_gateway_app.main import app

@pytest_asyncio.fixture
def test_user_id():
    return "11111111-1111-1111-1111-111111111111"

@pytest_asyncio.fixture
def test_map_id():
    return "22222222-2222-2222-2222-222222222222"

@pytest_asyncio.fixture
def test_loc_id():
    return "33333333-3333-3333-3333-333333333333"

@pytest_asyncio.fixture
def mock_verify_token(mocker, test_user_id):
    return mocker.patch('api_gateway_app.proxy_routes.maps_proxy.verify_token', return_value=test_user_id)

@pytest_asyncio.fixture
async def async_client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac