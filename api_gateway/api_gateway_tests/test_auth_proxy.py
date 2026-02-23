import pytest


@pytest.mark.asyncio
async def test_auth_register_ok(httpx_mock, async_client, user_base_url, test_user_id):
    httpx_mock.add_response(
        method="POST",
        url=f"{user_base_url}/auth/register",
        status_code=200,
        json={
            "id": test_user_id,
            "username": "testuser",
            "email": "text@example.com",
            "created_at": "2000-01-01",
        },
    )

    resp = await async_client.post(
        "/auth/register",
        json={
            "username": "testuser",
            "email": "text@example.com",
            "password": "StrongPass123!",
        },
    )

    assert resp.status_code == 200
    assert "id" in resp.json()
    assert resp.json()["username"] == "testuser"


@pytest.mark.asyncio
async def test_auth_register_validation_error(async_client):
    # Это проверка валидации на стороне gateway (Pydantic)
    resp = await async_client.post(
        "/auth/register",
        json={
            "username": "",
            "email": "invalid",
            "password": "123",
        },
    )

    assert resp.status_code == 422
    assert "detail" in resp.json()


@pytest.mark.asyncio
async def test_auth_login_ok(httpx_mock, async_client, user_base_url):
    httpx_mock.add_response(
        method="POST",
        url=f"{user_base_url}/auth/login",
        status_code=200,
        json={
            "access_token": "jwt-token",
            "token_type": "bearer",
        },
    )

    resp = await async_client.post(
        "/auth/login",
        data={
            "username": "testuser",
            "password": "password123",
        },
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )

    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data
    assert data["token_type"].lower() == "bearer"


@pytest.mark.asyncio
async def test_auth_login_invalid(httpx_mock, async_client, user_base_url):
    httpx_mock.add_response(
        method="POST",
        url=f"{user_base_url}/auth/login",
        status_code=401,
        json={"detail": "Invalid credentials"},
    )

    resp = await async_client.post(
        "/auth/login",
        data={
            "username": "wronguser",
            "password": "wrongpass",
        },
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )

    assert resp.status_code == 401
    assert "detail" in resp.json()


@pytest.mark.asyncio
async def test_auth_service_unavailable_on_register(httpx_mock, async_client, user_base_url):
    httpx_mock.add_response(
        method="POST",
        url=f"{user_base_url}/auth/register",
        status_code=503,
        json={"detail": "User service unavailable"},
    )

    resp = await async_client.post(
        "/auth/register",
        json={
            "username": "testuser",
            "email": "test@example.com",
            "password": "StrongPass123!",
        },
    )

    assert resp.status_code == 503
    assert "detail" in resp.json()