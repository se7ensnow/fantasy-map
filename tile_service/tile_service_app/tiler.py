import logging
import math
import os
import time

from PIL import Image, ImageOps

from tile_service_app.log_config import log

TILE_SIZE = 256

Image.MAX_IMAGE_PIXELS = 400_000_000

def generate_tile_pyramid(map_id: str, source_image_path: str, output_base_path: str):
    total_started = time.perf_counter()

    with Image.open(source_image_path) as image:
        image = ImageOps.exif_transpose(image).convert("RGBA")
        width, height = image.size

        max_dim = max(width, height)
        max_zoom = math.ceil(math.log2(max(1.0, max_dim / TILE_SIZE)))

        map_output_dir = os.path.join(output_base_path, map_id)
        os.makedirs(map_output_dir, exist_ok=True)

        total_written_tiles = 0

        log(
            logging.INFO,
            "tiler_started",
            map_id=map_id,
            width=width,
            height=height,
            max_zoom=max_zoom,
            mode="single_process",
        )

        for z in range(max_zoom + 1):
            level_started = time.perf_counter()

            scale = 2 ** (max_zoom - z)

            resize_started = time.perf_counter()
            resized = image.resize(
                (math.ceil(width / scale), math.ceil(height / scale)),
                Image.Resampling.LANCZOS,
            )
            resize_ms = round((time.perf_counter() - resize_started) * 1000, 2)

            resized_width, resized_height = resized.size
            tiles_x = math.ceil(resized_width / TILE_SIZE)
            tiles_y = math.ceil(resized_height / TILE_SIZE)
            tiles_count = tiles_x * tiles_y

            write_started = time.perf_counter()
            written_tiles = 0

            for x in range(tiles_x):
                tile_dir = os.path.join(map_output_dir, str(z), str(x))
                os.makedirs(tile_dir, exist_ok=True)

                for y in range(tiles_y):
                    left = x * TILE_SIZE
                    lower = resized_height - y * TILE_SIZE
                    right = min(left + TILE_SIZE, resized.width)
                    upper = max(lower - TILE_SIZE, 0)

                    tile = resized.crop((left, upper, right, lower))

                    tile_w, tile_h = tile.size
                    if tile_w != TILE_SIZE or tile_h != TILE_SIZE:
                        padded = Image.new("RGBA", (TILE_SIZE, TILE_SIZE), (0, 0, 0, 0))
                        paste_x = 0
                        paste_y = TILE_SIZE - tile_h
                        padded.paste(tile, (paste_x, paste_y))
                        tile = padded

                    tile_path = os.path.join(tile_dir, f"{y}.png")
                    tile.save(tile_path, format="PNG", compress_level=0)
                    written_tiles += 1

            write_ms = round((time.perf_counter() - write_started) * 1000, 2)
            level_total_ms = round((time.perf_counter() - level_started) * 1000, 2)

            total_written_tiles += written_tiles

            log(
                logging.INFO,
                "tiler_level_finished",
                map_id=map_id,
                z=z,
                resized_width=resized_width,
                resized_height=resized_height,
                tiles_x=tiles_x,
                tiles_y=tiles_y,
                tiles_count=tiles_count,
                written_tiles=written_tiles,
                resize_ms=resize_ms,
                write_ms=write_ms,
                total_ms=level_total_ms,
            )

        total_ms = round((time.perf_counter() - total_started) * 1000, 2)

        log(
            logging.INFO,
            "tiler_finished",
            map_id=map_id,
            width=width,
            height=height,
            max_zoom=max_zoom,
            total_written_tiles=total_written_tiles,
            total_ms=total_ms,
        )

    return {
        "width": width,
        "height": height,
        "max_zoom": max_zoom,
        "tiles_local_dir": map_output_dir,
    }