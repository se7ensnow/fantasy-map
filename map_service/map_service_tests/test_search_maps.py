from uuid import uuid4
import pytest

from map_service_app.crud import create_map, list_maps_catalog
from map_service_app.schemas import MapCreate, Visibility


def make_public_map(
    title: str,
    owner_username: str = "u1",
    tags: list[str] | None = None,
) -> MapCreate:
    return MapCreate(
        title=title,
        description=None,
        visibility="public",  # type: Visibility
        owner_username=owner_username,
        tags=tags or [],
    )


@pytest.fixture
def owner_id():
    return uuid4()


def test_catalog_returns_only_public(db, owner_id):
    create_map(db, owner_id, make_public_map("Alpha City", tags=["Magic"]))
    create_map(
        db,
        owner_id,
        MapCreate(title="Hidden Base", description=None, visibility="private", owner_username="u1", tags=["Secret"]),
    )

    maps, total = list_maps_catalog(db, q=None, tags=[], tags_mode="any")
    assert total == 1
    assert len(maps) == 1
    assert maps[0].title == "Alpha City"


@pytest.mark.parametrize(
    "filter_tags, tags_mode, expected_title",
    [
        (["magic"], "any", "Wizard Tower"),
        (["rpg", "war"], "all", "Orc Camp"),
    ],
)
def test_catalog_filters_by_tags(db, owner_id, filter_tags, tags_mode, expected_title):
    create_map(db, owner_id, make_public_map("Wizard Tower", tags=["Magic", "RPG"]))
    create_map(db, owner_id, make_public_map("Orc Camp", tags=["RPG", "War"]))
    create_map(db, owner_id, make_public_map("Lonely Hill", tags=["Nature"]))

    maps, total = list_maps_catalog(db, q=None, tags=filter_tags, tags_mode=tags_mode)
    assert total == 1
    assert maps[0].title == expected_title


def test_search_len_lt_3_uses_like(db, owner_id):
    create_map(db, owner_id, make_public_map("Alpha City"))
    create_map(db, owner_id, make_public_map("Beta Town"))

    maps, total = list_maps_catalog(db, q="Al", tags=[], tags_mode="any")
    assert total == 1
    assert maps[0].title == "Alpha City"