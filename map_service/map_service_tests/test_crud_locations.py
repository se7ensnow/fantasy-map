from uuid import uuid4
from typing import Dict

import pytest

from map_service_app.crud import create_map, create_location, update_location, delete_location, get_location_by_id, get_locations_by_map_id
from map_service_app.schemas import LocationCreate, LocationUpdate, MapCreate

@pytest.fixture
def db_map(db):
    owner_id = uuid4()
    map_in = MapCreate(
        title='Test Map',
        description='Test description',
        owner_username="testuser",
    )
    created_map = create_map(db, owner_id, map_in)
    return created_map

def test_create_location(db, db_map):
    location_in = LocationCreate(
        map_id = db_map.id,
        type="city",
        name="Test Location",
        description="Test description",
        x=100.5,
        y=200.5,
        metadata_json={"population": 5000}
    )

    location = create_location(db, location_in)
    assert location.name == "Test Location"
    assert location.description == "Test description"
    assert location.map_id == db_map.id
    assert location.type == "city"
    assert location.x == 100.5
    assert location.y == 200.5
    assert location.metadata_json["population"] == 5000

def test_update_location(db, db_map):
    location = create_location(db, LocationCreate(
        map_id=db_map.id,
        type="village",
        name="Loc",
        description=None,
        x=0.0,
        y=0.0,
        metadata_json=None
    ))

    update_in = LocationUpdate(
        type="city",
        name="Updated Loc",
        description="Updated description",
        x=10.0,
        y=20.0,
        metadata_json={"key": "value"}
    )

    updated_location = update_location(db, location.id, update_in)
    assert updated_location.name == "Updated Loc"
    assert updated_location.description == "Updated description"
    assert updated_location.x == 10.0
    assert updated_location.y == 20.0
    assert updated_location.metadata_json["key"] == "value"

def test_delete_location(db, db_map):
    location = create_location(db, LocationCreate(
        map_id=db_map.id,
        type="city",
        name="Loc to delete",
        description=None,
        x=1.0,
        y=2.0,
        metadata_json=None
    ))

    deleted = delete_location(db, location.id)
    assert deleted is True

    not_found = get_location_by_id(db, location.id)
    assert not_found is None

def test_get_locations_by_map_id(db, db_map):
    create_location(db, LocationCreate(
        map_id=db_map.id,
        type="city",
        name="Loc1",
        description=None,
        x=0.0,
        y=0.0,
        metadata_json=None
    ))
    create_location(db, LocationCreate(
        map_id=db_map.id,
        type="city",
        name="Loc2",
        description=None,
        x=1.0,
        y=1.0,
        metadata_json=None
    ))

    locations = get_locations_by_map_id(db, db_map.id)
    assert len(locations) == 2
    assert locations[0].map_id == db_map.id