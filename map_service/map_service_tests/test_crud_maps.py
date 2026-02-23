from uuid import uuid4
import pytest

from map_service_app.crud import (
    create_map,
    get_map_by_id,
    update_map,
    is_map_owned_by_user,
    update_map_tiles_info,
    delete_map,
    get_maps_by_owner,
    create_share,
    delete_share,
    get_map_by_share_id,
)
from map_service_app.schemas import MapCreate, MapUpdate, TilesInfo, Visibility
from map_service_app.models import Tag, Map
from map_service_app.config import MAX_TAGS_PER_MAP, MAX_TAG_LEN


def make_map_create(
    title="Test map",
    description="desc",
    tags=("  Magic!!  ", "Tower", "magic"),
    owner_username="tester",
    visibility="private",  # type: Visibility
):
    return MapCreate(
        title=title,
        description=description,
        tags=list(tags),
        owner_username=owner_username,
        visibility=visibility,
    )


@pytest.fixture
def owner_id():
    return uuid4()


@pytest.fixture
def map_obj(db, owner_id) -> Map:
    return create_map(db, owner_id, make_map_create())


def test_create_map_defaults(db, owner_id):
    m = create_map(db, owner_id, make_map_create())
    assert m is not None
    assert m.owner_id == owner_id
    assert m.visibility == "private"
    assert m.share_id is None


def test_is_map_owned_by_user(db, owner_id, map_obj):
    assert is_map_owned_by_user(db, owner_id, map_obj.id) is True
    assert is_map_owned_by_user(db, uuid4(), map_obj.id) is False


def test_update_map_updates_title_and_description(db, map_obj):
    updated = update_map(
        db,
        map_obj.id,
        MapUpdate(title="Updated Title", description="Updated Description"),
    )
    assert updated.title == "Updated Title"
    assert updated.description == "Updated Description"


def test_update_map_replaces_tags_and_cleans_unused(db, map_obj):
    updated = update_map(db, map_obj.id, MapUpdate(tags=["magic"]))
    assert {tag.name for tag in updated.tags} == {"magic"}

    assert db.query(Tag).filter(Tag.name == "tower").first() is None


def test_update_map_tiles_info(db, map_obj):
    tiles_info = TilesInfo(width=256, height=256, max_zoom=5, tiles_path="/tiles/test-path")
    updated = update_map_tiles_info(db, map_obj.id, tiles_info)

    assert updated is not None
    assert updated.tiles_path == "/tiles/test-path"
    assert updated.max_zoom == 5
    assert updated.width == 256
    assert updated.height == 256


def test_delete_map_deletes_and_cleans_tags_when_unused(db, owner_id):
    m = create_map(db, owner_id, make_map_create())

    ok = delete_map(db, m.id)
    assert ok is True
    assert get_map_by_id(db, m.id) is None

    assert db.query(Tag).filter(Tag.name.in_(["magic", "tower"])).count() == 0


def test_delete_map_does_not_delete_tags_still_used(db, owner_id):
    m1 = create_map(db, owner_id, make_map_create(title="M1", tags=("magic", "tower")))
    m2 = create_map(db, owner_id, make_map_create(title="M2", tags=("magic", "tower")))

    assert db.query(Tag).filter(Tag.name == "magic").first() is not None

    ok = delete_map(db, m1.id)
    assert ok is True
    assert get_map_by_id(db, m1.id) is None

    assert db.query(Tag).filter(Tag.name == "magic").first() is not None
    assert db.query(Tag).filter(Tag.name == "tower").first() is not None

    ok2 = delete_map(db, m2.id)
    assert ok2 is True
    assert db.query(Tag).filter(Tag.name.in_(["magic", "tower"])).count() == 0


def test_get_maps_by_owner_pagination_and_total(db, owner_id):
    create_map(db, owner_id, make_map_create(title="Map1", tags=()))
    create_map(db, owner_id, make_map_create(title="Map2", tags=()))
    create_map(db, owner_id, make_map_create(title="Map3", tags=()))

    maps, total = get_maps_by_owner(db, owner_id, offset=0, limit=2)
    assert total == 3
    assert len(maps) == 2
    assert all(m.owner_id == owner_id for m in maps)

    maps2, total2 = get_maps_by_owner(db, owner_id, offset=2, limit=2)
    assert total2 == 3
    assert len(maps2) == 1
    assert maps2[0].title == "Map3"


@pytest.mark.parametrize(
    "tags, expected_error_substring",
    [
        ([f"t{i}" for i in range(MAX_TAGS_PER_MAP + 1)], "too many tags"),
        (["a" * (MAX_TAG_LEN + 1)], "too long"),
    ],
)
def test_tag_validation_limits(db, owner_id, tags, expected_error_substring):
    with pytest.raises(ValueError) as e:
        create_map(db, owner_id, MapCreate(title="M", description=None, owner_username="u", tags=tags))
    assert expected_error_substring in str(e.value).lower()


def test_create_share_creates_and_is_idempotent(db, map_obj):
    sid1 = create_share(db, map_obj.id)
    assert sid1 is not None

    db.refresh(map_obj)
    assert map_obj.share_id == sid1

    sid2 = create_share(db, map_obj.id)
    assert sid2 == sid1


def test_delete_share_idempotent(db, map_obj):
    sid = create_share(db, map_obj.id)
    assert sid is not None

    ok = delete_share(db, map_obj.id)
    assert ok is True

    db.refresh(map_obj)
    assert map_obj.share_id is None

    ok2 = delete_share(db, map_obj.id)
    assert ok2 is True


def test_get_share_id_and_get_map_by_share_id(db, map_obj):
    assert get_map_by_share_id(db, "nonexistent") is None

    sid = create_share(db, map_obj.id)
    assert sid is not None

    by_share = get_map_by_share_id(db, sid)
    assert by_share is not None
    assert by_share.id == map_obj.id

    delete_share(db, map_obj.id)
    assert get_map_by_share_id(db, sid) is None