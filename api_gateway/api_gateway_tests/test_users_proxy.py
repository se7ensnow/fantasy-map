import pytest


def auth_header(token="test-token"):
    return {"Authorization": f"Bearer {token}"}


@pytest.mark.asyncio
async def test_get_user_ok(httpx_mock, async_client, user_base_url, test_user_id):
    httpx_mock.add_response(
        method="GET",
        url=f"{user_base_url}/users/{test_user_id}",
        status_code=200,
        json={
            "id": test_user_id,
            "username": "testuser",
            "email": "test@example.com",
            "created_at": "2000-01-01",
        },
    )

    resp = await async_client.get(f"/users/{test_user_id}", headers=auth_header())

    assert resp.status_code == 200
    data = resp.json()
    assert data["id"] == test_user_id
    assert data["username"] == "testuser"
    assert data["email"] == "test@example.com"


@pytest.mark.asyncio
async def test_get_user_not_found(httpx_mock, async_client, user_base_url, test_user_id):
    httpx_mock.add_response(
        method="GET",
        url=f"{user_base_url}/users/{test_user_id}",
        status_code=404,
        json={"detail": "User not found"},
    )

    resp = await async_client.get(f"/users/{test_user_id}", headers=auth_header())

    assert resp.status_code == 404
    assert "detail" in resp.json()


@pytest.mark.asyncio
async def test_get_user_service_unavailable(httpx_mock, async_client, user_base_url, test_user_id):
    httpx_mock.add_response(
        method="GET",
        url=f"{user_base_url}/users/{test_user_id}",
        status_code=503,
        json={"detail": "User service unavailable"},
    )

    resp = await async_client.get(f"/users/{test_user_id}", headers=auth_header())

    assert resp.status_code == 503
    assert "detail" in resp.json()