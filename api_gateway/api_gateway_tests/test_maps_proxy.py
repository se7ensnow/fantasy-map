import pytest

from api_gateway_app.config import MAP_SERVICE_URL, USER_SERVICE_URL

@pytest.mark.asyncio
async def test_create_map_ok(httpx_mock, mock_verify_token, async_client, test_user_id, test_map_id):
    httpx_mock.add_response(
        method="POST",
        url=f"{USER_SERVICE_URL}/auth/verify-token",
        json={"user_id": test_user_id}
    )

    httpx_mock.add_response(
        method="GET",
        url=f"{USER_SERVICE_URL}/users/me",
        json={
            "id": test_user_id,
            "username": "testuser",
            "email": "test@example.com",
            "created_at": "2000-01-01"
        }
    )

    httpx_mock.add_response(
        method='POST',
        url=f"{MAP_SERVICE_URL}/maps/create",
        json={
            "id": test_map_id,
            "title": "Test Map",
            "description": "Test Description",
            "tiles_path": "",
            "owner_id": test_user_id,
            "owner_username": "testuser",
            "source_path": "",
            "width": 0,
            "height": 0,
            "max_zoom": 0,
            "created_at": "2000-01-01",
            "updated_at": "2000-01-01"
        }
    )

    response = await async_client.post(
        "/maps/create",
        json={
            "title": "Test Map",
            "description": "Test Description",
        },
        headers={"Authorization": f"Bearer test-token"}
    )

    assert response.status_code == 200
    data = response.json()
    assert data["id"] == test_map_id
    assert data["title"] == "Test Map"

@pytest.mark.asyncio
async def test_get_maps_ok(httpx_mock, mock_verify_token, async_client, test_user_id, test_map_id):
    httpx_mock.add_response(
        method="POST",
        url=f"{USER_SERVICE_URL}/auth/verify-token",
        json={"user_id": test_user_id}
    )

    httpx_mock.add_response(
        method='GET',
        url=f"{MAP_SERVICE_URL}/maps/owned?page=1&size=10",
        json={
            "items": [{
                "id": test_map_id,
                "title": "Test Map",
                "description": "Test Description",
                "tiles_path": "",
                "owner_id": test_user_id,
                "owner_username": "testuser",
                "source_path": "",
                "width": 0,
                "height": 0,
                "max_zoom": 0,
                "created_at": "2000-01-01",
                "updated_at": "2000-01-01"
            }],
            "total": 1
        }
    )

    response = await async_client.get(
        "/maps/owned?page=1&size=10",
        headers={"Authorization": f"Bearer test-token"}
    )

    assert response.status_code == 200
    data = response.json()
    assert len(data["items"]) == 1
    assert data["items"][0]["id"] == test_map_id
    assert data["total"] == 1

@pytest.mark.asyncio
async def test_get_map_ok(httpx_mock, mock_verify_token, async_client, test_user_id, test_map_id):
    httpx_mock.add_response(
        method="POST",
        url=f"{USER_SERVICE_URL}/auth/verify-token",
        json={"user_id": test_user_id}
    )

    httpx_mock.add_response(
        method='GET',
        url=f"{MAP_SERVICE_URL}/maps/{test_map_id}",
        json={
            "id": test_map_id,
            "title": "Test Map",
            "description": "Test Description",
            "tiles_path": "",
            "owner_id": test_user_id,
            "owner_username": "testuser",
            "source_path": "",
            "width": 0,
            "height": 0,
            "max_zoom": 0,
            "created_at": "2000-01-01",
            "updated_at": "2000-01-01"
        }
    )

    response = await async_client.get(
        f"/maps/{test_map_id}",
        headers={"Authorization": f"Bearer test-token"}
    )

    assert response.status_code == 200
    data = response.json()
    assert data["id"] == test_map_id


@pytest.mark.asyncio
async def test_get_map_not_found(httpx_mock, mock_verify_token, async_client, test_user_id, test_map_id):
    httpx_mock.add_response(
        method="POST",
        url=f"{USER_SERVICE_URL}/auth/verify-token",
        json={"user_id": test_user_id}
    )

    httpx_mock.add_response(
        method='GET',
        url=f"{MAP_SERVICE_URL}/maps/{test_map_id}",
        status_code=404,
        json={"detail": "Map not found"}
    )

    response = await async_client.get(
        f"/maps/{test_map_id}",
        headers={"Authorization": f"Bearer test-token"}
    )

    assert response.status_code == 404
    assert "detail" in response.json()

@pytest.mark.asyncio
async def test_update_map_ok(httpx_mock, mock_verify_token, async_client, test_user_id, test_map_id):
    httpx_mock.add_response(
        method="POST",
        url=f"{USER_SERVICE_URL}/auth/verify-token",
        json={"user_id": test_user_id}
    )

    httpx_mock.add_response(
        method='PUT',
        url=f"{MAP_SERVICE_URL}/maps/{test_map_id}",
        json={
            "id": test_map_id,
            "title": "Updated Map",
            "description": "Updated Description",
            "tiles_path": "",
            "owner_id": test_user_id,
            "owner_username": "testuser",
            "source_path": "",
            "width": 0,
            "height": 0,
            "max_zoom": 0,
            "created_at": "2000-01-01",
            "updated_at": "2000-01-01"
        }
    )

    response = await async_client.put(
        f"/maps/{test_map_id}",
        json={
            "title": "Updated Map",
            "description": "Updated Description"
        },
        headers={"Authorization": f"Bearer test-token"}
    )

    assert response.status_code == 200
    data = response.json()
    assert data["id"] == test_map_id
    assert data["title"] == "Updated Map"

@pytest.mark.asyncio
async def test_update_map_forbidden(httpx_mock, mock_verify_token, async_client, test_user_id, test_map_id):
    httpx_mock.add_response(
        method="POST",
        url=f"{USER_SERVICE_URL}/auth/verify-token",
        json={"user_id": test_user_id}
    )

    httpx_mock.add_response(
        method='PUT',
        url=f"{MAP_SERVICE_URL}/maps/{test_map_id}",
        status_code=403,
        json={"detail": "You do not own this map"}
    )

    response = await async_client.put(
        f"/maps/{test_map_id}",
        json={
            "title": "Updated Map",
            "description": "Updated Description"
        },
        headers={"Authorization": f"Bearer test-token"}
    )

    assert response.status_code == 403
    assert "detail" in response.json()

@pytest.mark.asyncio
async def test_upload_image_ok(httpx_mock, mock_verify_token, async_client, test_user_id, test_map_id):
    httpx_mock.add_response(
        method="POST",
        url=f"{USER_SERVICE_URL}/auth/verify-token",
        json={"user_id": test_user_id}
    )

    httpx_mock.add_response(
        method='POST',
        url=f"{MAP_SERVICE_URL}/maps/{test_map_id}/upload-image",
        json={"status": "image uploaded", "task": "tile generation started"}
    )

    response = await async_client.post(
        f"/maps/{test_map_id}/upload-image",
        files={"file": ("file.png", b"dummy content", "application/png")},
        headers={"Authorization": f"Bearer test-token"}
    )

    assert response.status_code == 200
    assert response.json()["status"] == "image uploaded"
    assert response.json()["task"] == "tile generation started"

@pytest.mark.asyncio
async def test_upload_image_forbidden(httpx_mock, mock_verify_token, async_client, test_user_id, test_map_id):
    httpx_mock.add_response(
        method="POST",
        url=f"{USER_SERVICE_URL}/auth/verify-token",
        json={"user_id": test_user_id}
    )

    httpx_mock.add_response(
        method='POST',
        url=f"{MAP_SERVICE_URL}/maps/{test_map_id}/upload-image",
        status_code=403,
        json={"detail": "You do not own this map"}
    )

    response = await async_client.post(
        f"/maps/{test_map_id}/upload-image",
        files={"file": ("file.png", b"dummy content", "application/png")},
        headers={"Authorization": f"Bearer test-token"}
    )

    assert response.status_code == 403
    assert "detail" in response.json()


@pytest.mark.asyncio
async def test_delete_map_ok(httpx_mock, mock_verify_token, async_client, test_user_id, test_map_id):
    httpx_mock.add_response(
        method="POST",
        url=f"{USER_SERVICE_URL}/auth/verify-token",
        json={"user_id": test_user_id}
    )

    httpx_mock.add_response(
        method='DELETE',
        url=f"{MAP_SERVICE_URL}/maps/{test_map_id}",
        status_code=204
    )

    response = await async_client.delete(
        f"/maps/{test_map_id}",
        headers={"Authorization": f"Bearer test-token"}
    )

    assert response.status_code == 204

@pytest.mark.asyncio
async def test_delete_map_forbidden(httpx_mock, mock_verify_token, async_client, test_user_id, test_map_id):
    httpx_mock.add_response(
        method="POST",
        url=f"{USER_SERVICE_URL}/auth/verify-token",
        json={"user_id": test_user_id}
    )

    httpx_mock.add_response(
        method='DELETE',
        url=f"{MAP_SERVICE_URL}/maps/{test_map_id}",
        status_code=403,
        json={"detail": "You do not own this map"}
    )

    response = await async_client.delete(
        f"/maps/{test_map_id}",
        headers={"Authorization": f"Bearer test-token"}
    )

    assert response.status_code == 403
    assert "detail" in response.json()


@pytest.mark.asyncio
async def test_update_map_visibility_link_creates_share(httpx_mock, mock_verify_token, async_client, test_user_id, test_map_id):
    httpx_mock.add_response(
        method="POST",
        url=f"{USER_SERVICE_URL}/auth/verify-token",
        json={"user_id": test_user_id}
    )

    httpx_mock.add_response(
        method='PUT',
        url=f"{MAP_SERVICE_URL}/maps/{test_map_id}",
        json={
            "id": test_map_id,
            "title": "Test Map",
            "description": "Test Description",
            "tiles_path": "",
            "owner_id": test_user_id,
            "owner_username": "testuser",
            "source_path": "",
            "width": 0,
            "height": 0,
            "max_zoom": 0,
            "created_at": "2000-01-01",
            "updated_at": "2000-01-01",
            "visibility": "link",
            "share_id": "share-abc",
            "share_url": "/maps/share/share-abc",
        }
    )

    response = await async_client.put(
        f"/maps/{test_map_id}",
        json={"visibility": "link"},
        headers={"Authorization": f"Bearer test-token"}
    )

    assert response.status_code == 200
    data = response.json()
    assert data["visibility"] == "link"
    assert data.get("share_id") == "share-abc"
    assert data.get("share_url") == "/maps/share/share-abc"


@pytest.mark.asyncio
async def test_get_map_owner_sees_share(httpx_mock, mock_verify_token, async_client, test_user_id, test_map_id):
    httpx_mock.add_response(
        method="POST",
        url=f"{USER_SERVICE_URL}/auth/verify-token",
        json={"user_id": test_user_id}
    )

    httpx_mock.add_response(
        method='GET',
        url=f"{MAP_SERVICE_URL}/maps/{test_map_id}",
        json={
            "id": test_map_id,
            "title": "Test Map",
            "description": "Test Description",
            "tiles_path": "",
            "owner_id": test_user_id,
            "owner_username": "testuser",
            "source_path": "",
            "width": 0,
            "height": 0,
            "max_zoom": 0,
            "created_at": "2000-01-01",
            "updated_at": "2000-01-01",
            "visibility": "link",
            "share_id": "share-abc",
            "share_url": "/maps/share/share-abc",
        }
    )

    response = await async_client.get(
        f"/maps/{test_map_id}",
        headers={"Authorization": f"Bearer test-token"}
    )

    assert response.status_code == 200
    data = response.json()
    assert data.get("share_id") == "share-abc"
    assert data.get("share_url") == "/maps/share/share-abc"


@pytest.mark.asyncio
async def test_get_map_anon_hides_share(httpx_mock, async_client, test_map_id):

    httpx_mock.add_response(
        method='GET',
        url=f"{MAP_SERVICE_URL}/maps/{test_map_id}",
        json={
            "id": test_map_id,
            "title": "Test Map",
            "description": "Test Description",
            "tiles_path": "",
            "owner_id": "11111111-1111-1111-1111-111111111111",
            "owner_username": "testuser",
            "source_path": "",
            "width": 0,
            "height": 0,
            "max_zoom": 0,
            "created_at": "2000-01-01",
            "updated_at": "2000-01-01",
        }
    )

    response = await async_client.get(f"/maps/{test_map_id}")
    assert response.status_code == 200
    data = response.json()
    assert data.get("share_id") is None
    assert data.get("share_url") is None


@pytest.mark.asyncio
async def test_get_map_by_share_id_proxied(httpx_mock, async_client):
    share_id = "share-xyz"
    now = "2000-01-01"
    sample_map = {
        "id": "22222222-2222-2222-2222-222222222222",
        "owner_id": "11111111-1111-1111-1111-111111111111",
        "owner_username": "tester",
        "title": "Title",
        "description": "Desc",
        "source_path": "src",
        "tiles_path": "tiles",
        "width": 1000,
        "height": 800,
        "max_zoom": 5,
        "created_at": now,
        "updated_at": now,
    }

    httpx_mock.add_response(
        method='GET',
        url=f"{MAP_SERVICE_URL}/maps/share/{share_id}",
        status_code=200,
        json=sample_map
    )

    response = await async_client.get(f"/maps/share/{share_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == sample_map["id"]
    assert data.get("share_id") is None

