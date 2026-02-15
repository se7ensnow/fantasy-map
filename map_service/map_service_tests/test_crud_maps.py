from uuid import uuid4

from map_service_app.crud import create_map, update_map, delete_map, update_map_tiles_info, get_map_by_id, get_maps_by_owner
from map_service_app.schemas import MapCreate, MapUpdate, TilesInfo

owner_id = uuid4()
map_request = MapCreate(
    title = "Test Map",
    description = "Test description",
    tags = ["Test Tag", "Map Tag"],
    owner_username = "testuser"
)

def test_create_map(db):
    db_map = create_map(db, owner_id, map_request)
    assert db_map.owner_id == owner_id
    assert db_map.owner_username == "testuser"
    assert db_map.title == "Test Map"
    assert db_map.description == "Test description"

    assert len(db_map.tags) == 2
    assert {tag.slug for tag in db_map.tags} == {"test-tag", "map-tag"}
    assert {tag.name for tag in db_map.tags} == {"Test Tag", "Map Tag"}

    assert db_map.tiles_path == ""

def test_update_map(db):
    db_map = create_map(db, owner_id, map_request)

    update_in = MapUpdate(
        title = "Updated Title",
        description = "Updated Description",
        tags = ["Updated Tag", "Map Tag"],
    )
    updated_map = update_map(db, db_map.id, update_in)

    assert updated_map.title == "Updated Title"
    assert updated_map.description == "Updated Description"
    assert len(updated_map.tags) == 2
    assert {tag.slug for tag in updated_map.tags} == {"updated-tag", "map-tag"}
    assert {tag.name for tag in updated_map.tags} == {"Updated Tag", "Map Tag"}

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
