import os
import shutil
import math
import pytest
from PIL import Image
from tile_service_app.tiler import generate_tile_pyramid

@pytest.fixture
def tmp_image(tmp_path):
    img = Image.new("RGB", (512, 512), color=(255, 0, 0))
    source_path = tmp_path / "source.png"
    img.save(source_path)
    return source_path

@pytest.fixture
def tmp_output(tmp_path):
    output_path = tmp_path / "tiles"
    os.makedirs(output_path, exist_ok=True)
    return output_path

def test_generate_tile_pyramid_square(tmp_image, tmp_output):
    result = generate_tile_pyramid(
        map_id="1",
        source_image_path=str(tmp_image),
        output_base_path=str(tmp_output)
    )

    assert result["width"] == 512
    assert result["height"] == 512
    assert result["max_zoom"] >= 0
    assert result["tiles_path"] == "/tiles/1/"

    tile_dir = tmp_output / "1" / str(result["max_zoom"]) / "0"
    assert tile_dir.exists()
    tiles = list(tile_dir.glob("*.png"))
    assert len(tiles) > 0

def test_generate_tile_pyramid_non_square(tmp_path):
    img = Image.new("RGB", (1024, 512), color=(0, 255, 0))
    source_path = tmp_path / "source.png"
    img.save(source_path)

    output_path = tmp_path / "tiles"
    os.makedirs(output_path, exist_ok=True)

    result = generate_tile_pyramid(
        map_id="2",
        source_image_path=str(source_path),
        output_base_path=str(output_path)
    )

    assert result["width"] == 1024
    assert result["height"] == 512
    assert result["max_zoom"] >= 0
    assert result["tiles_path"] == "/tiles/2/"

    tile_dir = output_path / "2" / str(result["max_zoom"]) / "0"
    assert tile_dir.exists()
    tiles = list(tile_dir.glob("*.png"))
    assert len(tiles) > 0

def test_generate_tile_pyramid_small(tmp_path):
    img = Image.new("RGB", (100, 100), color=(0, 0, 255))
    source_path = tmp_path / "source.png"
    img.save(source_path)

    output_path = tmp_path / "tiles"
    os.makedirs(output_path, exist_ok=True)

    result = generate_tile_pyramid(
        map_id="3",
        source_image_path=str(source_path),
        output_base_path=str(output_path)
    )

    assert result["width"] == 100
    assert result["height"] == 100
    assert result["max_zoom"] == 0
    assert result["tiles_path"] == "/tiles/3/"

    tile_dir = output_path / "3" / str(result["max_zoom"]) / "0"
    assert tile_dir.exists()
    tiles = list(tile_dir.glob("*.png"))
    assert len(tiles) > 0

def test_generate_tile_pyramid_invalid_file(tmp_path):
    fake_path = tmp_path / "not_a_png.txt"
    with open(fake_path, "w") as f:
        f.write("this is not an image")

    output_path = tmp_path / "tiles"
    os.makedirs(output_path, exist_ok=True)

    with pytest.raises(Exception):
        generate_tile_pyramid(
            map_id="4",
            source_image_path=str(fake_path),
            output_base_path=str(output_path)
        )