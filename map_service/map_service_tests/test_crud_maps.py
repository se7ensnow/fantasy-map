from uuid import uuid4
import pytest

from map_service_app.crud import create_map, update_map, delete_map, update_map_tiles_info, get_map_by_id, get_maps_by_owner
from map_service_app.schemas import MapCreate, MapUpdate, TilesInfo
from map_service_app.models import Tag
from map_service_app.config import MAX_TAGS_PER_MAP, MAX_TAG_LEN

owner_id = uuid4()
map_request = MapCreate(
    title = "Test Map",
    description = "Test description",
    tags = ["  Magic!!  ", "Tower", "magic"],
    owner_username = "testuser"
)

def test_create_map(db):
    db_map = create_map(db, owner_id, map_request)
    assert db_map.owner_id == owner_id
    assert db_map.owner_username == "testuser"
    assert db_map.title == "Test Map"
    assert db_map.description == "Test description"

    assert len(db_map.tags) == 2
    assert {tag.tag_name for tag in db_map.tags} == {"magic", "tower"}

    assert db_map.tiles_path == ""

def test_update_map(db):
    db_map = create_map(db, owner_id, map_request)

    update_in = MapUpdate(
        title = "Updated Title",
        description = "Updated Description",
        tags = ["magic"],
    )
    updated_map = update_map(db, db_map.id, update_in)

    assert updated_map.title == "Updated Title"
    assert updated_map.description == "Updated Description"
    assert len(updated_map.tags) == 1
    assert {tag.tag_name for tag in updated_map.tags} == {"magic"}

    assert db.query(Tag).filter(Tag.name == "tower").first() is None

def test_update_map_tiles_info(db):
    db_map = create_map(db, owner_id, map_request)

    tiles_info = TilesInfo(
        width = 256,
        height = 256,
        max_zoom=5,
        tiles_path="/tiles/test-path"
    )
    updated_map = update_map_tiles_info(db, db_map.id, tiles_info)
    assert updated_map.tiles_path == "/tiles/test-path"
    assert updated_map.max_zoom == 5
    assert updated_map.width == 256
    assert updated_map.height == 256

def test_delete_map(db):
    db_map = create_map(db, owner_id, map_request)

    success = delete_map(db, db_map.id)
    assert success

    not_found = get_map_by_id(db, db_map.id)
    assert not_found is None

def test_get_maps_by_owner(db):
    create_map(db, owner_id, MapCreate(title="Map1", description=None, owner_username="testuser"))
    create_map(db, owner_id, MapCreate(title="Map2", description=None, owner_username="testuser"))

    maps, total = get_maps_by_owner(db, owner_id)
    assert len(maps) == 2
    assert maps[0].owner_id == owner_id
    assert total == 2


def test_tags_limit_10(db):
    owner_id = uuid4()
    tags = [f"t{i}" for i in range(MAX_TAGS_PER_MAP + 1)]
    with pytest.raises(ValueError):
        create_map(db, owner_id, MapCreate(title="M", description=None, owner_username="u", tags=tags))

def test_tag_len_25(db):
    owner_id = uuid4()
    too_long = "a" * (MAX_TAG_LEN + 1)
    with pytest.raises(ValueError):
        create_map(db, owner_id, MapCreate(title="M", description=None, owner_username="u", tags=[too_long]))
