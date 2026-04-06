from tile_service_app.storage import storage, build_map_tiles_prefix


def upload_generated_tiles(map_id: str, tiles_local_dir: str, workers: int = 20) -> int:
    return storage.upload_directory(
        local_dir=tiles_local_dir,
        object_prefix=build_map_tiles_prefix(map_id),
        content_type="image/png",
        workers=workers,
    )