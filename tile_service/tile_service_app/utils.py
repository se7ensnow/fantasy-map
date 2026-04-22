from collections import abc

from tile_service_app import storage


def upload_generated_tiles(
    map_id: str,
    tiles_version: int,
    tiles_local_dir: str,
    workers: int = 20,
    progress_callback: abc.Callable[[int, int], None] | None = None,
    progress_every: int = 10,
) -> int:
    return storage.storage.upload_directory(
        local_dir=tiles_local_dir,
        object_prefix=storage.build_map_tiles_version_prefix(map_id, tiles_version),
        content_type="image/png",
        workers=workers,
        progress_callback=progress_callback,
        progress_every=progress_every,
    )