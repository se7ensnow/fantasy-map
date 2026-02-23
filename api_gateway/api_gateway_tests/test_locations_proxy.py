import pytest

def auth_header(token="test-token"):
    return {"Authorization": f"Bearer {token}"}


@pytest.mark.asyncio
async def test_create_location_ok(httpx_mock, async_client, user_base_url, map_base_url, test_user_id, test_map_id, test_loc_id):
    # auth dependency
    httpx_mock.add_response(
        method="POST",
        url=f"{user_base_url}/auth/verify-token",
        status_code=200,
        json={"user_id": test_user_id},
    )

    httpx_mock.add_response(
        method="POST",
        url=f"{map_base_url}/locations/create",
        status_code=200,
        json={
            "id": test_loc_id,
            "map_id": test_map_id,
            "name": "Location 1",
            "description": "Test Location",
            "type": "city",
            "x": 100.0,
            "y": 200.0,
            "metadata_json": None,
            "created_at": "2000-01-01",
            "updated_at": "2000-01-01",
        },
    )

    resp = await async_client.post(
        "/locations/create",
        json={
            "map_id": test_map_id,
            "name": "Location 1",
            "description": "Test Location",
            "type": "city",
            "x": 100.0,
            "y": 200.0,
        },
        headers=auth_header(),
    )

    assert resp.status_code == 200
    data = resp.json()
    assert data["id"] == test_loc_id
    assert data["map_id"] == test_map_id


@pytest.mark.asyncio
async def test_list_locations_ok(httpx_mock, async_client, map_base_url, test_map_id, test_loc_id):
    # ВАЖНО: query должен совпасть 1:1
    httpx_mock.add_response(
        method="GET",
        url=f"{map_base_url}/locations/?map_id={test_map_id}",
        status_code=200,
        json=[
            {
                "id": test_loc_id,
                "map_id": test_map_id,
                "name": "Location 1",
                "description": "Test Location",
                "type": "city",
                "x": 100.0,
                "y": 200.0,
                "metadata_json": None,
                "created_at": "2000-01-01",
                "updated_at": "2000-01-01",
            }
        ],
    )

    resp = await async_client.get("/locations/", params={"map_id": test_map_id})

    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, list)
    assert len(data) == 1
    assert data[0]["id"] == test_loc_id


@pytest.mark.asyncio
async def test_get_location_ok(httpx_mock, async_client, map_base_url, test_map_id, test_loc_id):
    httpx_mock.add_response(
        method="GET",
        url=f"{map_base_url}/locations/{test_loc_id}",
        status_code=200,
        json={
            "id": test_loc_id,
            "map_id": test_map_id,
            "name": "Location 1",
            "description": "Test Location",
            "type": "city",
            "x": 100.0,
            "y": 200.0,
            "metadata_json": None,
            "created_at": "2000-01-01",
            "updated_at": "2000-01-01",
        },
    )

    resp = await async_client.get(f"/locations/{test_loc_id}")

    assert resp.status_code == 200
    assert resp.json()["id"] == test_loc_id


@pytest.mark.asyncio
async def test_update_location_ok(httpx_mock, async_client, user_base_url, map_base_url, test_user_id, test_map_id, test_loc_id):
    httpx_mock.add_response(
        method="POST",
        url=f"{user_base_url}/auth/verify-token",
        status_code=200,
        json={"user_id": test_user_id},
    )

    httpx_mock.add_response(
        method="PUT",
        url=f"{map_base_url}/locations/{test_loc_id}",
        status_code=200,
        json={
            "id": test_loc_id,
            "map_id": test_map_id,
            "name": "Update Location 1",
            "description": "Updated Description",
            "type": "city",
            "x": 150.0,
            "y": 250.0,
            "metadata_json": None,
            "created_at": "2000-01-01",
            "updated_at": "2000-01-01",
        },
    )

    resp = await async_client.put(
        f"/locations/{test_loc_id}",
        json={
            "name": "Update Location 1",
            "description": "Updated Description",
            "type": "city",
            "x": 150.0,
            "y": 250.0,
        },
        headers=auth_header(),
    )

    assert resp.status_code == 200
    assert resp.json()["name"] == "Update Location 1"


@pytest.mark.asyncio
async def test_delete_location_ok(httpx_mock, async_client, user_base_url, map_base_url, test_user_id, test_loc_id):
    httpx_mock.add_response(
        method="POST",
        url=f"{user_base_url}/auth/verify-token",
        status_code=200,
        json={"user_id": test_user_id},
    )

    httpx_mock.add_response(
        method="DELETE",
        url=f"{map_base_url}/locations/{test_loc_id}",
        status_code=204,
    )

    resp = await async_client.delete(f"/locations/{test_loc_id}", headers=auth_header())

    assert resp.status_code == 204