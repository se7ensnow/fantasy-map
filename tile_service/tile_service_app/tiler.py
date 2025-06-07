import os
import math
from PIL import Image

def generate_tile_pyramid(map_id: str, source_image_path: str, output_base_path: str):

    image = Image.open(source_image_path)
    width, height = image.size

    max_dim = max(width, height)
    max_zoom = math.ceil(math.log2(max(1.0, max_dim / 256)))

    tiles_base_path = os.path.join(output_base_path, f"{map_id}")
    os.makedirs(tiles_base_path, exist_ok=True)

    for z in range(max_zoom + 1):
        scale = 2 ** (max_zoom - z)
        resized = image.resize((math.ceil(width / scale), math.ceil(height / scale)), Image.LANCZOS)

        tiles_x = math.ceil(resized.width / 256)
        tiles_y = math.ceil(resized.height / 256)

        for x in range(tiles_x):
            for y in range(tiles_y):
                left = x * 256
                upper = y * 256
                right = min(left + 256, resized.width)
                lower = min(upper + 256, resized.height)

                tile = resized.crop((left, upper, right, lower))

                tile_dir = os.path.join(tiles_base_path, str(z), str(x))
                os.makedirs(tile_dir, exist_ok=True)

                tile_path = os.path.join(tile_dir, f"{y}.png")
                tile.save(tile_path, format="PNG")

    return {
        "width": width,
        "height": height,
        "max_zoom": max_zoom,
        "tiles_path": f"/tiles/{map_id}/"
    }