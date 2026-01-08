from uuid import uuid4

from map_service_app.crud import create_map, search_maps_by_title
from map_service_app.schemas import MapCreate


def test_search_maps_simple(db):
    owner_id = uuid4()
    create_map(db, owner_id, MapCreate(title="Alpha City", description=None, owner_username="u1"))
    create_map(db, owner_id, MapCreate(title="Beta Town", description=None, owner_username="u1"))
    create_map(db, owner_id, MapCreate(title="Gamma Village", description=None, owner_username="u1"))

    maps, total = search_maps_by_title(db, "Alpha")
    assert total == 1
    assert len(maps) == 1
    assert maps[0].title == "Alpha City"

    maps, total = search_maps_by_title(db, "town")
    assert total == 1
    assert maps[0].title == "Beta Town"

    maps, total = search_maps_by_title(db, "a")
    # 'a' appears in multiple titles; ensure at least 2 results
    assert total >= 2


def test_search_empty_q_returns_all(db):
    owner_id = uuid4()
    create_map(db, owner_id, MapCreate(title="One", description=None, owner_username="u1"))
    create_map(db, owner_id, MapCreate(title="Two", description=None, owner_username="u1"))

    maps, total = search_maps_by_title(db, "")
    assert total == 2
    assert len(maps) == 2

