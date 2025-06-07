import pytest

from api_gateway_app.config import USER_SERVICE_URL

@pytest.mark.asyncio
async def test_get_user_ok(httpx_mock, mock_verify_token, async_client, test_user_id):
    httpx_mock.add_response(
        method='GET',
        url=f"{USER_SERVICE_URL}/users/{test_user_id}",
        json={
            "id": test_user_id,
            "username": "testuser",
            "email": "test@example.com",
            "created_at": "2000-01-01"
        }
    )

    response = await async_client.get(
        f"/users/{test_user_id}",
        headers={"Authorization": f"Bearer test-token"}
    )

    assert response.status_code == 200
    data = response.json()
    assert data["id"] == test_user_id
    assert data["username"] == "testuser"
    assert data["email"] == "test@example.com"

@pytest.mark.asyncio
async def test_get_user_not_found(httpx_mock, mock_verify_token, async_client, test_user_id):
    httpx_mock.add_response(
        method='GET',
        url=f"{USER_SERVICE_URL}/users/{test_user_id}",
        status_code=404,
        json={"detail": "User not found"}
    )

    response = await async_client.get(
        f"/users/{test_user_id}",
        headers={"Authorization": f"Bearer test-token"}
    )

    assert response.status_code == 404
    assert "detail" in response.json()

@pytest.mark.asyncio
async def test_get_user_service_unavailable(httpx_mock, mock_verify_token, async_client, test_user_id):
    httpx_mock.add_response(
        method='GET',
        url=f"{USER_SERVICE_URL}/users/{test_user_id}",
        status_code=503
    )

    response = await async_client.get(
        f"/users/{test_user_id}",
        headers={"Authorization": f"Bearer test-token"}
    )

    assert response.status_code == 503