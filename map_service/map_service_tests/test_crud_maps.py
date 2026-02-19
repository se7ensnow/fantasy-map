from uuid import uuid4
import pytest

from map_service_app.crud import (
    create_map,
    get_map_by_id,
    update_map,
    create_share,
    revoke_share,
    get_map_by_share_id,
    is_map_owned_by_user,
    update_map_tiles_info,
    delete_map,
    get_maps_by_owner,
)
from map_service_app.schemas import MapCreate, MapUpdate, TilesInfo
from map_service_app.models import Tag
from map_service_app.config import MAX_TAGS_PER_MAP, MAX_TAG_LEN


def make_map_create(title="Test map", description="desc", tags=["  Magic!!  ", "Tower", "magic"], owner_username="tester"):
    return MapCreate(title=title, description=description, tags=tags, owner_username=owner_username)


def test_create_map_defaults_and_owner(db):
    owner_id = uuid4()
    req = make_map_create()
    m = create_map(db, owner_id, req)
    assert m is not None
    assert m.owner_id == owner_id
    assert m.visibility == "private"
    assert m.share_id is None


def test_update_visibility_to_link_creates_share(db):
    owner_id = uuid4()
    m = create_map(db, owner_id, make_map_create())
    # owner should be detected
    assert is_map_owned_by_user(db, owner_id, m.id)

    updated = update_map(db, m.id, MapUpdate(visibility="link"))
    assert updated is not None
    assert updated.visibility == "link"
    assert updated.share_id is not None
    # get by share id should return the same map
    found = get_map_by_share_id(db, updated.share_id)
    assert found is not None
    assert found.id == updated.id


def test_revoke_share_clears_identifier(db):
    owner_id = uuid4()
    m = create_map(db, owner_id, make_map_create())
    sid = create_share(db, m.id)
    assert sid
    # revoke
    ok = revoke_share(db, m.id)
    assert ok is True
    reloaded = get_map_by_id(db, m.id)
    assert reloaded.share_id is None


def test_switch_public_clears_share(db):
    owner_id = uuid4()
    m = create_map(db, owner_id, make_map_create())
    sid = create_share(db, m.id)
    assert sid
    # switch to public via update_map
    updated = update_map(db, m.id, MapUpdate(visibility="public"))
    assert updated.visibility == "public"
    assert updated.share_id is None


def test_get_map_by_share_non_link_visibility(db):
    owner_id = uuid4()
    m = create_map(db, owner_id, make_map_create())
    sid = create_share(db, m.id)
    assert sid
    updated = update_map(db, m.id, MapUpdate(visibility="private"))
    assert updated.visibility == "private"
    assert get_map_by_share_id(db, sid) is None


def test_update_map(db):
    owner_id = uuid4()
    db_map = create_map(db, owner_id, make_map_create())

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
    owner_id = uuid4()
    db_map = create_map(db, owner_id, make_map_create())

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
    owner_id = uuid4()
    db_map = create_map(db, owner_id, make_map_create())

    success = delete_map(db, db_map.id)
    assert success

    not_found = get_map_by_id(db, db_map.id)
    assert not_found is None

def test_get_maps_by_owner(db):
    owner_id = uuid4()
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
