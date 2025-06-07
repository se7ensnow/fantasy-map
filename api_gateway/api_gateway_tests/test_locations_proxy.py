import pytest

from api_gateway_app.config import MAP_SERVICE_URL, USER_SERVICE_URL

@pytest.mark.asyncio
async def test_create_location_ok(httpx_mock, mock_verify_token, async_client, test_user_id, test_map_id, test_loc_id):
    httpx_mock.add_response(
        method='POST',
        url=f"{USER_SERVICE_URL}/auth/verify-token",
        json={"user_id": test_user_id}
    )

    httpx_mock.add_response(
        method='POST',
        url=f"{MAP_SERVICE_URL}/locations/create",
        json={
            "id": test_loc_id,
            "map_id": test_map_id,
            "name": "Location 1",
            "description": "Test Location",
            "type": "city",
            "x": 100.0,
            "y": 200.0,
            "created_at": "2000-01-01",
            "updated_at": "2000-01-01"
        }
    )

    response = await async_client.post(
        "locations/create",
        json={
            "map_id": test_map_id,
            "name": "Location 1",
            "description": "Test Location",
            "type": "city",
            "x": 100.0,
            "y": 200.0
        },
        headers={"Authorization": f"Bearer test-token"}
    )

    assert response.status_code == 200
    data = response.json()
    assert data["id"] == test_loc_id
    assert data["map_id"] == test_map_id

@pytest.mark.asyncio
async def test_list_locations_ok(httpx_mock, mock_verify_token, async_client, test_user_id, test_map_id, test_loc_id):

    httpx_mock.add_response(
        method='GET',
        url=f"{MAP_SERVICE_URL}/locations/?map_id={test_map_id}",
        json=[
            {
                "id": test_loc_id,
                "map_id": test_map_id,
                "name": "Location 1",
                "description": "Test Location",
                "type": "city",
                "x": 100.0,
                "y": 200.0,
                "created_at": "2000-01-01",
                "updated_at": "2000-01-01"
            }
        ]
    )

    response = await async_client.get(
        "/locations/",
        params={"map_id": test_map_id},
    )

    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) == 1
    assert data[0]["id"] == test_loc_id

@pytest.mark.asyncio
async def test_get_location_ok(httpx_mock, mock_verify_token, async_client, test_user_id, test_map_id, test_loc_id):

    httpx_mock.add_response(
        method='GET',
        url=f"{MAP_SERVICE_URL}/locations/{test_loc_id}",
        json={
            "id": test_loc_id,
            "map_id": test_map_id,
            "name": "Location 1",
            "description": "Test Location",
            "type": "city",
            "x": 100.0,
            "y": 200.0,
            "created_at": "2000-01-01",
            "updated_at": "2000-01-01"
        }
    )

    response = await async_client.get(
        f"/locations/{test_loc_id}",
    )

    assert response.status_code == 200
    data = response.json()
    assert data["id"] == test_loc_id

@pytest.mark.asyncio
async def test_update_location_ok(httpx_mock, mock_verify_token, async_client, test_user_id, test_map_id, test_loc_id):
    httpx_mock.add_response(
        method='POST',
        url=f"{USER_SERVICE_URL}/auth/verify-token",
        json={"user_id": test_user_id}
    )

    httpx_mock.add_response(
        method='PUT',
        url=f"{MAP_SERVICE_URL}/locations/{test_loc_id}",
        json={
            "id": test_loc_id,
            "map_id": test_map_id,
            "name": "Update Location 1",
            "description": "Updated Description",
            "type": "city",
            "x": 150.0,
            "y": 250.0,
            "created_at": "2000-01-01",
            "updated_at": "2000-01-01"
        }
    )

    response = await async_client.put(
        f"/locations/{test_loc_id}",
        json={
            "name": "Update Location 1",
            "description": "Updated Description",
            "type": "city",
            "x": 150.0,
            "y": 250.0
        },
        headers={"Authorization": f"Bearer test-token"}
    )

    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Update Location 1"

@pytest.mark.asyncio
async def test_delete_location_ok(httpx_mock, mock_verify_token, async_client, test_user_id, test_map_id, test_loc_id):
    httpx_mock.add_response(
        method='POST',
        url=f"{USER_SERVICE_URL}/auth/verify-token",
        json={"user_id": test_user_id}
    )

    httpx_mock.add_response(
        method='DELETE',
        url=f"{MAP_SERVICE_URL}/locations/{test_loc_id}",
        status_code=204
    )

    response = await async_client.delete(
        f"/locations/{test_loc_id}",
        headers={"Authorization": f"Bearer test-token"}
    )

    assert response.status_code == 204