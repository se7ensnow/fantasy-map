import pytest

def auth_header(token="test-token"):
    return {"Authorization": f"Bearer {token}"}


@pytest.mark.asyncio
async def test_create_map_ok(httpx_mock, async_client, user_base_url, map_base_url, test_user_id, test_map_id):
    httpx_mock.add_response(
        method="POST",
        url=f"{user_base_url}/auth/verify-token",
        status_code=200,
        json={"user_id": test_user_id},
    )

    httpx_mock.add_response(
        method="GET",
        url=f"{user_base_url}/users/me",
        status_code=200,
        json={
            "id": test_user_id,
            "username": "testuser",
            "email": "test@example.com",
            "created_at": "2000-01-01",
        },
    )

    httpx_mock.add_response(
        method="POST",
        url=f"{map_base_url}/maps/create",
        status_code=200,
        json={
            "id": test_map_id,
            "owner_id": test_user_id,
            "owner_username": "testuser",
            "title": "Test Map",
            "description": "Test Description",
            "tags": ["magic"],
            "visibility": "private",
            "source_path": "",
            "tiles_path": "",
            "width": 0,
            "height": 0,
            "max_zoom": 0,
            "created_at": "2000-01-01",
            "updated_at": "2000-01-01",
            "share_id": None,
        },
    )

    resp = await async_client.post(
        "/maps/create",
        json={"title": "Test Map", "description": "Test Description", "tags": ["Magic"], "visibility": "private"},
        headers=auth_header(),
    )

    assert resp.status_code == 200
    data = resp.json()
    assert data["id"] == test_map_id
    assert data["title"] == "Test Map"
    assert data["tags"] == ["magic"]


@pytest.mark.asyncio
async def test_owned_maps_ok(httpx_mock, async_client, user_base_url, map_base_url, test_user_id, test_map_id):
    httpx_mock.add_response(
        method="POST",
        url=f"{user_base_url}/auth/verify-token",
        status_code=200,
        json={"user_id": test_user_id},
    )

    httpx_mock.add_response(
        method="GET",
        url=f"{map_base_url}/maps/owned?page=1&size=10",
        status_code=200,
        json={
            "items": [
                {
                    "id": test_map_id,
                    "owner_username": "testuser",
                    "title": "My Map",
                    "tags": ["magic"],
                    "visibility": "private",
                    "updated_at": "2000-01-01",
                }
            ],
            "total": 1,
        },
    )

    resp = await async_client.get("/maps/owned?page=1&size=10", headers=auth_header())
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] == 1
    assert data["items"][0]["id"] == test_map_id


@pytest.mark.asyncio
async def test_all_maps_ok(httpx_mock, async_client, map_base_url, test_map_id):
    httpx_mock.add_response(
        method="GET",
        url=f"{map_base_url}/maps/all?page=1&size=10&q=tower&tags=magic,rpg&tags_mode=all",
        status_code=200,
        json={
            "items": [
                {
                    "id": test_map_id,
                    "owner_username": "u1",
                    "title": "Wizard Tower",
                    "tags": ["magic", "rpg"],
                    "visibility": "public",
                    "updated_at": "2000-01-01",
                }
            ],
            "total": 1,
        },
    )

    resp = await async_client.get("/maps/all?page=1&size=10&q=tower&tags=magic,rpg&tags_mode=all")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] == 1
    assert data["items"][0]["title"] == "Wizard Tower"


@pytest.mark.asyncio
async def test_get_map_ok(httpx_mock, async_client, map_base_url, test_map_id, test_user_id):
    httpx_mock.add_response(
        method="GET",
        url=f"{map_base_url}/maps/{test_map_id}",
        status_code=200,
        json={
            "id": test_map_id,
            "owner_id": test_user_id,
            "owner_username": "u1",
            "title": "Public Map",
            "description": None,
            "tags": [],
            "visibility": "public",
            "source_path": "",
            "tiles_path": "",
            "width": 0,
            "height": 0,
            "max_zoom": 0,
            "created_at": "2000-01-01",
            "updated_at": "2000-01-01",
            "share_id": None,
        },
    )

    resp = await async_client.get(f"/maps/{test_map_id}")
    assert resp.status_code == 200
    assert resp.json()["id"] == test_map_id


@pytest.mark.asyncio
async def test_update_map_ok(httpx_mock, async_client, user_base_url, map_base_url, test_user_id, test_map_id):
    httpx_mock.add_response(
        method="POST",
        url=f"{user_base_url}/auth/verify-token",
        status_code=200,
        json={"user_id": test_user_id},
    )

    httpx_mock.add_response(
        method="PUT",
        url=f"{map_base_url}/maps/{test_map_id}",
        status_code=200,
        json={
            "id": test_map_id,
            "owner_id": test_user_id,
            "owner_username": "u1",
            "title": "Updated",
            "description": "Updated Description",
            "tags": ["updated"],
            "visibility": "private",
            "source_path": "",
            "tiles_path": "",
            "width": 0,
            "height": 0,
            "max_zoom": 0,
            "created_at": "2000-01-01",
            "updated_at": "2000-01-01",
            "share_id": None,
        },
    )

    resp = await async_client.put(
        f"/maps/{test_map_id}",
        json={"title": "Updated", "description": "Updated Description", "tags": ["Updated"], "visibility": "private"},
        headers=auth_header(),
    )
    assert resp.status_code == 200
    assert resp.json()["title"] == "Updated"


@pytest.mark.asyncio
async def test_delete_map_ok(httpx_mock, async_client, user_base_url, map_base_url, test_user_id, test_map_id):
    httpx_mock.add_response(
        method="POST",
        url=f"{user_base_url}/auth/verify-token",
        status_code=200,
        json={"user_id": test_user_id},
    )

    httpx_mock.add_response(
        method="DELETE",
        url=f"{map_base_url}/maps/{test_map_id}",
        status_code=204,
    )

    resp = await async_client.delete(f"/maps/{test_map_id}", headers=auth_header())
    assert resp.status_code == 204


@pytest.mark.asyncio
async def test_upload_image_ok(httpx_mock, async_client, user_base_url, map_base_url, test_user_id, test_map_id):
    httpx_mock.add_response(
        method="POST",
        url=f"{user_base_url}/auth/verify-token",
        status_code=200,
        json={"user_id": test_user_id},
    )

    httpx_mock.add_response(
        method="POST",
        url=f"{map_base_url}/maps/{test_map_id}/upload-image",
        status_code=200,
        json={"status": "image uploaded", "task": "tile generation started"},
    )

    resp = await async_client.post(
        f"/maps/{test_map_id}/upload-image",
        files={"file": ("file.png", b"content", "image/png")},
        headers=auth_header(),
    )
    assert resp.status_code == 200
    assert resp.json()["status"] == "image uploaded"


@pytest.mark.asyncio
async def test_list_tags_ok(httpx_mock, async_client, map_base_url):
    httpx_mock.add_response(
        method="GET",
        url=f"{map_base_url}/maps/tags?limit=50",
        status_code=200,
        json=[{"name": "rpg", "count": 2}],
    )

    resp = await async_client.get("/maps/tags?limit=50")
    assert resp.status_code == 200
    assert resp.json()[0]["name"] == "rpg"


@pytest.mark.asyncio
async def test_get_map_by_share_id_ok(httpx_mock, async_client, map_base_url):
    share_id = "share-xyz"
    httpx_mock.add_response(
        method="GET",
        url=f"{map_base_url}/maps/share/{share_id}",
        status_code=200,
        json={
            "id": "22222222-2222-2222-2222-222222222222",
            "owner_id": "11111111-1111-1111-1111-111111111111",
            "owner_username": "tester",
            "title": "Title",
            "description": "Desc",
            "tags": [],
            "visibility": "private",
            "source_path": "src",
            "tiles_path": "tiles",
            "width": 1000,
            "height": 800,
            "max_zoom": 5,
            "created_at": "2000-01-01",
            "updated_at": "2000-01-01",
            "share_id": "share-xyz",
        },
    )

    resp = await async_client.get(f"/maps/share/{share_id}")
    assert resp.status_code == 200
    assert resp.json()["title"] == "Title"


@pytest.mark.asyncio
async def test_owned_maps_no_token_401(async_client):
    resp = await async_client.get("/maps/owned?page=1&size=10")
    assert resp.status_code == 401
    body = resp.json()
    assert "detail" in body


@pytest.mark.asyncio
async def test_owned_maps_invalid_token_401(httpx_mock, async_client, user_base_url):
    httpx_mock.add_response(
        method="POST",
        url=f"{user_base_url}/auth/verify-token",
        status_code=401,
        json={"detail": "Invalid or expired token"},
    )

    resp = await async_client.get("/maps/owned?page=1&size=10", headers=auth_header("bad-token"))
    assert resp.status_code == 401
    assert "detail" in resp.json()


@pytest.mark.asyncio
async def test_owned_maps_user_service_down_503(httpx_mock, async_client, user_base_url):
    httpx_mock.add_response(
        method="POST",
        url=f"{user_base_url}/auth/verify-token",
        status_code=503,
        json={"detail": "User service unavailable"},
    )

    resp = await async_client.get("/maps/owned?page=1&size=10", headers=auth_header())
    assert resp.status_code == 503


@pytest.mark.asyncio
async def test_get_map_optional_auth_invalid_token_still_works(
    httpx_mock, async_client, user_base_url, map_base_url, test_map_id, test_user_id
):
    httpx_mock.add_response(
        method="POST",
        url=f"{user_base_url}/auth/verify-token",
        status_code=401,
        json={"detail": "Invalid token"},
    )

    httpx_mock.add_response(
        method="GET",
        url=f"{map_base_url}/maps/{test_map_id}",
        status_code=200,
        json={
            "id": test_map_id,
            "owner_id": test_user_id,
            "owner_username": "u1",
            "title": "Public Map",
            "description": None,
            "tags": [],
            "visibility": "public",
            "source_path": "",
            "tiles_path": "",
            "width": 0,
            "height": 0,
            "max_zoom": 0,
            "created_at": "2000-01-01",
            "updated_at": "2000-01-01",
            "share_id": None,
        },
    )

    resp = await async_client.get(f"/maps/{test_map_id}", headers=auth_header("bad-token"))
    assert resp.status_code == 200
    assert resp.json()["id"] == test_map_id


@pytest.mark.asyncio
async def test_get_map_optional_auth_user_service_503_still_works(
    httpx_mock, async_client, user_base_url, map_base_url, test_map_id, test_user_id
):
    httpx_mock.add_response(
        method="POST",
        url=f"{user_base_url}/auth/verify-token",
        status_code=503,
        json={"detail": "User service unavailable"},
    )

    httpx_mock.add_response(
        method="GET",
        url=f"{map_base_url}/maps/{test_map_id}",
        status_code=200,
        json={
            "id": test_map_id,
            "owner_id": test_user_id,
            "owner_username": "u1",
            "title": "Public Map",
            "description": None,
            "tags": [],
            "visibility": "public",
            "source_path": "",
            "tiles_path": "",
            "width": 0,
            "height": 0,
            "max_zoom": 0,
            "created_at": "2000-01-01",
            "updated_at": "2000-01-01",
            "share_id": None,
        },
    )

    resp = await async_client.get(f"/maps/{test_map_id}", headers=auth_header())
    assert resp.status_code == 200


@pytest.mark.asyncio
async def test_get_map_not_found_propagates(httpx_mock, async_client, map_base_url, test_map_id):
    httpx_mock.add_response(
        method="GET",
        url=f"{map_base_url}/maps/{test_map_id}",
        status_code=404,
        json={"detail": "Map not found"},
    )

    resp = await async_client.get(f"/maps/{test_map_id}")
    assert resp.status_code == 404
    assert "detail" in resp.json()


@pytest.mark.asyncio
async def test_update_map_forbidden_propagates(
    httpx_mock, async_client, user_base_url, map_base_url, test_user_id, test_map_id
):
    httpx_mock.add_response(
        method="POST",
        url=f"{user_base_url}/auth/verify-token",
        status_code=200,
        json={"user_id": test_user_id},
    )

    httpx_mock.add_response(
        method="PUT",
        url=f"{map_base_url}/maps/{test_map_id}",
        status_code=403,
        json={"detail": "You do not own this map"},
    )

    resp = await async_client.put(
        f"/maps/{test_map_id}",
        json={"title": "X", "visibility": "private"},
        headers=auth_header(),
    )
    assert resp.status_code == 403
    assert "detail" in resp.json()


@pytest.mark.asyncio
async def test_delete_map_not_found_propagates(
    httpx_mock, async_client, user_base_url, map_base_url, test_user_id, test_map_id
):
    httpx_mock.add_response(
        method="POST",
        url=f"{user_base_url}/auth/verify-token",
        status_code=200,
        json={"user_id": test_user_id},
    )

    httpx_mock.add_response(
        method="DELETE",
        url=f"{map_base_url}/maps/{test_map_id}",
        status_code=404,
        json={"detail": "Map not found"},
    )

    resp = await async_client.delete(f"/maps/{test_map_id}", headers=auth_header())
    assert resp.status_code == 404
    assert "detail" in resp.json()


@pytest.mark.asyncio
async def test_upload_image_forbidden_propagates(
    httpx_mock, async_client, user_base_url, map_base_url, test_user_id, test_map_id
):
    httpx_mock.add_response(
        method="POST",
        url=f"{user_base_url}/auth/verify-token",
        status_code=200,
        json={"user_id": test_user_id},
    )

    httpx_mock.add_response(
        method="POST",
        url=f"{map_base_url}/maps/{test_map_id}/upload-image",
        status_code=403,
        json={"detail": "You do not own this map"},
    )

    resp = await async_client.post(
        f"/maps/{test_map_id}/upload-image",
        files={"file": ("file.png", b"content", "image/png")},
        headers=auth_header(),
    )
    assert resp.status_code == 403
    assert "detail" in resp.json()


@pytest.mark.asyncio
async def test_create_map_user_me_error_propagates(
    httpx_mock, async_client, user_base_url, test_user_id
):
    httpx_mock.add_response(
        method="POST",
        url=f"{user_base_url}/auth/verify-token",
        status_code=200,
        json={"user_id": test_user_id},
    )

    httpx_mock.add_response(
        method="GET",
        url=f"{user_base_url}/users/me",
        status_code=503,
        json={"detail": "User service unavailable"},
    )

    resp = await async_client.post(
        "/maps/create",
        json={"title": "T", "visibility": "private"},
        headers=auth_header(),
    )
    assert resp.status_code == 503


@pytest.mark.asyncio
async def test_get_map_by_share_id_404_custom_message(httpx_mock, async_client, map_base_url):
    share_id = "missing"
    httpx_mock.add_response(
        method="GET",
        url=f"{map_base_url}/maps/share/{share_id}",
        status_code=404,
        json={"detail": "Map not found"},
    )

    resp = await async_client.get(f"/maps/share/{share_id}")
    assert resp.status_code == 404
    assert resp.json()["detail"] == "Shared map not found or expired"
