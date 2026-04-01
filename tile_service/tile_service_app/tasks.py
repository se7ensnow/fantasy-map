import os
import httpx
import shutil
import tempfile

from tile_service_app.storage import storage, build_map_source_key, build_map_tiles_prefix
from tile_service_app.tiler import generate_tile_pyramid
from tile_service_app.utils import upload_generated_tiles
from tile_service_app.config import MAP_SERVICE_URL

def process_task(map_id: str):
    temp_dir = tempfile.mkdtemp(prefix=f"tiles_{map_id}_")
    try:
        source_path = os.path.join(temp_dir, "source.png")
        source_key = build_map_source_key(map_id)

        storage.download_file(source_key, source_path)

        result = generate_tile_pyramid(
            map_id=map_id,
            source_image_path=source_path,
            output_base_path=temp_dir,
        )

        tiles_prefix = build_map_tiles_prefix(map_id)

        deleted_count = storage.delete_prefix(tiles_prefix)
        print(f"[tile-service] Deleted {deleted_count} old tiles for map {map_id}")

        uploaded_count = upload_generated_tiles(
            map_id=map_id,
            tiles_local_dir=result["tiles_local_dir"],
        )
        print(f"[tile-service] Uploaded {uploaded_count} tiles for map {map_id}")

        callback_url = f"{MAP_SERVICE_URL}/maps/{map_id}/tiles_info"
        callback_payload = {
            "width": result["width"],
            "height": result["height"],
            "max_zoom": result["max_zoom"],
        }

        with httpx.Client(timeout=30.0) as client:
            response = client.post(callback_url, json=callback_payload)
            response.raise_for_status()

        return {
            "status": "ok",
            "map_id": map_id,
            "width": result["width"],
            "height": result["height"],
            "max_zoom": result["max_zoom"],
        }
    except Exception as e:
        raise e

    finally:
        shutil.rmtree(temp_dir, ignore_errors=True)