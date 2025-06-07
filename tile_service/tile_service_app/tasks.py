import os
import httpx

from tile_service_app.config import SOURCE_IMAGES_PATH, TILES_OUTPUT_PATH, MAP_SERVICE_URL
from tile_service_app.tiler import generate_tile_pyramid

def process_task(map_id: str):
    source_image_path = os.path.join(SOURCE_IMAGES_PATH, f"{map_id}", "source.png")

    if not os.path.exists(source_image_path):
        raise FileNotFoundError(f"{source_image_path} does not exist")

    callback_payload = generate_tile_pyramid(
        map_id = map_id,
        source_image_path = source_image_path,
        output_base_path=TILES_OUTPUT_PATH
    )

    callback_url = f"{MAP_SERVICE_URL}/maps/{map_id}/tiles_info"

    try:
        with httpx.Client() as client:
            response = client.post(callback_url, json=callback_payload)
            response.raise_for_status()
    except Exception as e:
        raise RuntimeError(f"Callback failed: {e}")