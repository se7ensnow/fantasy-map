import os

from tile_service_app.storage import storage, build_tile_key


def upload_generated_tiles(map_id: str, tiles_local_dir: str) -> int:
    uploaded_count = 0

    for root, _, files in os.walk(tiles_local_dir):
        for filename in files:
            if not filename.endswith(".png"):
                continue

            local_path = os.path.join(root, filename)
            rel_path = os.path.relpath(local_path, tiles_local_dir)

            z_str, x_str, y_file = rel_path.split(os.sep)
            y_str = os.path.splitext(y_file)[0]

            object_key = build_tile_key(
                map_id=map_id,
                z=int(z_str),
                x=int(x_str),
                y=int(y_str),
            )

            storage.upload_file(local_path, object_key, content_type="image/png")
            uploaded_count += 1

    return uploaded_count