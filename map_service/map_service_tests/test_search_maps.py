from uuid import uuid4

from map_service_app.crud import create_map, list_maps_catalog
from map_service_app.schemas import MapCreate

def test_catalog_no_filters_returns_all(db):
    owner_id = uuid4()
    create_map(db, owner_id, MapCreate(title="Alpha City", description=None, owner_username="u1", tags=["Magic"]))
    create_map(db, owner_id, MapCreate(title="Beta Town", description=None, owner_username="u1", tags=["War"]))

    maps, total = list_maps_catalog(db, q=None, tags=[], tags_mode="any")
    assert total == 2
    assert len(maps) == 2


def test_catalog_filter_tags_any(db):
    owner_id = uuid4()
    create_map(db, owner_id, MapCreate(title="Wizard Tower", description=None, owner_username="u1", tags=["Magic", "RPG"]))
    create_map(db, owner_id, MapCreate(title="Orc Camp", description=None, owner_username="u1", tags=["War"]))

    maps, total = list_maps_catalog(db, q=None, tags=["magic"], tags_mode="any")
    assert total == 1
    assert maps[0].title == "Wizard Tower"


def test_catalog_filter_tags_all(db):
    owner_id = uuid4()
    create_map(db, owner_id, MapCreate(title="Wizard Tower", description=None, owner_username="u1", tags=["Magic", "RPG"]))
    create_map(db, owner_id, MapCreate(title="Orc Camp", description=None, owner_username="u1", tags=["RPG", "War"]))

    maps, total = list_maps_catalog(db, q=None, tags=["rpg", "war"], tags_mode="all")
    assert total == 1
    assert maps[0].title == "Orc Camp"


def test_search_maps_len_lt_3_uses_like(db):
    owner_id = uuid4()
    create_map(db, owner_id, MapCreate(title="Alpha City", description=None, owner_username="u1"))
    create_map(db, owner_id, MapCreate(title="Beta Town", description=None, owner_username="u1"))

    maps, total = list_maps_catalog(db, q="Al", tags=[], tags_mode="any")
    assert total == 1
    assert maps[0].title == "Alpha City"