import pytest

from api_gateway_app.config import USER_SERVICE_URL

@pytest.mark.asyncio
async def test_auth_register_ok(httpx_mock, mock_verify_token, async_client, test_user_id):
    httpx_mock.add_response(
        method='POST',
        url=f"{USER_SERVICE_URL}/auth/register",
        json={"id": test_user_id,
              "username": "testuser",
              "email": "text@example.com",
              "created_at": "2000-01-01"}
    )

    response = await async_client.post(
        "/auth/register",
        json={
            "username": "testuser",
            "email": "text@example.com",
            "password": "StrongPass123!"
        }
    )

    assert response.status_code == 200
    assert "id" in response.json()

@pytest.mark.asyncio
async def test_auth_register_error(httpx_mock, mock_verify_token, async_client):
    response = await async_client.post(
        "/auth/register",
        json={
            "username": "",
            "email": "invalid",
            "password": "123"
        }
    )

    assert response.status_code == 422
    assert "detail" in response.json()

@pytest.mark.asyncio
async def test_auth_login_ok(httpx_mock, mock_verify_token, async_client):
    httpx_mock.add_response(
        method='POST',
        url=f"{USER_SERVICE_URL}/auth/login",
        json={"access_token": "jwt-token",
              "token_type": "Bearer",}
    )

    response = await async_client.post(
        "/auth/login",
        data={
            "username": "testuser",
            "password": "password123"
        },
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )

    assert response.status_code == 200
    assert "access_token" in response.json()

@pytest.mark.asyncio
async def test_auth_login_invalid(httpx_mock, mock_verify_token, async_client):
    httpx_mock.add_response(
        method='POST',
        url=f"{USER_SERVICE_URL}/auth/login",
        status_code=401,
        json={"detail": "Invalid credentials"}
    )

    response = await async_client.post(
        "/auth/login",
        data={
            "username": "wronguser",
            "password": "wrongpass"
        },
        headers = {"Content-Type": "application/x-www-form-urlencoded"}
    )

    assert response.status_code == 401
    assert "detail" in response.json()

@pytest.mark.asyncio
async def test_auth_service_unavailable(httpx_mock, mock_verify_token, async_client):
    httpx_mock.add_response(
        method='POST',
        url=f"{USER_SERVICE_URL}/auth/register",
        status_code=503
    )

    response = await async_client.post(
        "/auth/register",
        json={
            "username": "testuser",
            "email": "test@example.com",
            "password": "StrongPass123!"
        }
    )

    assert response.status_code == 503