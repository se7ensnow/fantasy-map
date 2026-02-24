import os
import math
import shutil
from PIL import Image

TILE_SIZE = 256

def generate_tile_pyramid(map_id: str, source_image_path: str, output_base_path: str):
    image = Image.open(source_image_path).convert("RGBA")
    width, height = image.size

    max_dim = max(width, height)
    max_zoom = math.ceil(math.log2(max(1.0, max_dim / TILE_SIZE)))

    final_base = os.path.join(output_base_path, f"{map_id}")
    tmp_base = os.path.join(output_base_path, f"{map_id}__tmp")

    if os.path.isdir(tmp_base):
        shutil.rmtree(tmp_base)

    os.makedirs(tmp_base, exist_ok=True)

    for z in range(max_zoom + 1):
        scale = 2 ** (max_zoom - z)
        resized = image.resize(
            (math.ceil(width / scale), math.ceil(height / scale)),
            Image.LANCZOS
        )

        resized_width, resized_height = resized.size

        tiles_x = math.ceil(resized_width / TILE_SIZE)
        tiles_y = math.ceil(resized_height / TILE_SIZE)

        for x in range(tiles_x):
            tile_dir = os.path.join(tmp_base, str(z), str(x))
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
                tile.save(tile_path, format="PNG")

    if os.path.isdir(final_base):
        shutil.rmtree(final_base)

    os.replace(tmp_base, final_base)

    return {
        "width": width,
        "height": height,
        "max_zoom": max_zoom,
        "tiles_path": f"/tiles/{map_id}/"
    }