import pytest
import httpx
from uuid import uuid4
import time
import pathlib

API_GATEWAY_URL = "http://localhost:8000"
NGINX_URL = "http://localhost:8080"

@pytest.fixture
def tiles_image_path():
    current_dir = pathlib.Path(__file__).parent
    return current_dir / "image.png"

@pytest.mark.asyncio
async def test_full_flow(tiles_image_path):
    async with httpx.AsyncClient(base_url=API_GATEWAY_URL) as client:

        username = f"user_{uuid4()}"
        email = f"{username}@test.com"
        password = "TestPassword123"

        register_resp = await client.post(
            "/auth/register",
            json = {
                "username": username,
                "email": email,
                "password": password
            }
        )
        assert register_resp.status_code == 200

        login_resp = await client.post(
            "/auth/login",
            data={
                "username": username,
                "password": password
            }
        )
        assert login_resp.status_code == 200
        token = login_resp.json()["access_token"]

        headers = {"Authorization": f"Bearer {token}"}

        create_map_resp = await client.post(
            "/maps/create",
            json={
                "title": "Test Map",
                "description": "Integration test map",
            },
            headers=headers
        )
        assert create_map_resp.status_code == 200
        map_id = create_map_resp.json()["id"]

        get_map_resp = await client.get(
            f"/maps/{map_id}",
            headers=headers
        )
        assert get_map_resp.status_code == 200
        assert get_map_resp.json()["id"] == map_id

        with open(tiles_image_path, "rb") as f:
            upload_resp = await client.post(
                f"/maps/{map_id}/upload-image",
                files={"file": ("image.png", f, "image/png")},
                headers=headers
            )

        assert upload_resp.status_code == 200
        upload_resp_data = upload_resp.json()
        assert upload_resp_data["status"] == "image uploaded"
        assert upload_resp_data["task"] == "tile generation started"

        tiles_path = None
        max_wait_time = 50
        poll_interval = 3

        for _ in range(max_wait_time // poll_interval):
            poll_resp = await client.get(
                f"/maps/{map_id}",
                headers=headers
            )
            assert poll_resp.status_code == 200
            map_data = poll_resp.json()

            tiles_path = map_data.get("tiles_path")
            if tiles_path:
                print(f"Tiles ready at {tiles_path}")
                break
            else:
                print("Tiles not ready yet, waiting...")
                time.sleep(poll_interval)

        assert tiles_path is not None, "Tiles were not generated in time!"

        tile_url = f"{NGINX_URL}{tiles_path}/0/0/0.png"
        tile_resp = await client.get(tile_url)
        assert tile_resp.status_code == 200
        assert tile_resp.headers["content-type"] == "image/png"

        create_loc_resp = await client.post(
            "/locations/create",
            json={
                "map_id": map_id,
                "type": "city",
                "name": "Test City",
                "description": "Integration test location",
                "x": 100.5,
                "y": 200.5,
                "metadata_json": {}
            },
            headers=headers
        )
        assert create_loc_resp.status_code == 200
        location_id = create_loc_resp.json()["id"]

        get_loc_resp = await client.get(
            f"/locations/{location_id}",
            headers=headers
        )
        assert get_loc_resp.status_code == 200
        assert get_loc_resp.json()["id"] == location_id