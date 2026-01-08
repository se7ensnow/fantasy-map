from sqlalchemy.orm import Session
from uuid import UUID
from typing import Optional

from map_service_app.models import Map, Location
from map_service_app.schemas import MapCreate, LocationCreate, MapUpdate, LocationUpdate, TilesInfo
from map_service_app.utils import generate_share_id


def create_map(db: Session, owner_id: UUID, map_in: MapCreate) -> Map:
    db_map = Map(
        owner_id=owner_id,
        owner_username=map_in.owner_username,
        title=map_in.title,
        description=map_in.description,
        visibility='private',
        source_path='',
        tiles_path='',
        width=0,
        height=0,
        max_zoom=0,
    )
    db.add(db_map)
    db.commit()
    db.refresh(db_map)

    return db_map


def get_map_by_id(db: Session, map_id: UUID) -> Optional[Map]:
    return db.query(Map).filter(Map.id == map_id).first()


def update_map_tiles_info(db: Session, map_id: UUID, tiles_info: TilesInfo) -> Optional[Map]:
    db_map = get_map_by_id(db, map_id)
    if db_map is None:
        return None
    db_map.tiles_path = tiles_info.tiles_path
    db_map.width = tiles_info.width
    db_map.height = tiles_info.height
    db_map.max_zoom = tiles_info.max_zoom
    db.commit()
    db.refresh(db_map)
    return db_map


# --- Share helpers and operations ---
def create_share(db: Session, map_id: UUID) -> Optional[str]:
    db_map = db.query(Map).filter(Map.id == map_id).first()
    if not db_map:
        return None
    if db_map.share_id:
        return str(db_map.share_id)

    for _ in range(10):
        candidate = generate_share_id()
        exists = db.query(Map).filter(Map.share_id == candidate).first()
        if not exists:
            db_map.share_id = candidate
            db.add(db_map)
            db.commit()
            db.refresh(db_map)
            return candidate
    raise RuntimeError("Не удалось сгенерировать уникальный share_id")


def revoke_share(db: Session, map_id: UUID) -> bool:
    db_map = db.query(Map).filter(Map.id == map_id).first()
    if not db_map:
        return False
    db_map.share_id = None
    db.add(db_map)
    db.commit()
    return True


# --- Map update / CRUD operations ---
def update_map(db: Session, map_id: UUID, map_in: MapUpdate) -> Optional[Map]:
    db_map = get_map_by_id(db, map_id)
    if db_map is None:
        return None
    if map_in.title is not None:
        db_map.title = map_in.title
    if map_in.description is not None:
        db_map.description = map_in.description
    if map_in.visibility is not None:
        new_vis = map_in.visibility
        if new_vis == 'link':
            if not db_map.share_id:
                create_share(db, map_id)
                db_map = get_map_by_id(db, map_id)
            db_map.visibility = 'link'
        else:
            if db_map.share_id:
                db_map.share_id = None
            db_map.visibility = new_vis

    db.commit()
    db.refresh(db_map)
    return db_map


def delete_map(db: Session, map_id: UUID) -> bool:
    db_map = get_map_by_id(db, map_id)
    if db_map is None:
        return False
    db.delete(db_map)
    db.commit()
    return True


def get_maps_by_owner(db: Session, owner_id: UUID, offset: int = 0, limit: int = 10):
    query = db.query(Map).filter(Map.owner_id == owner_id)
    total = query.count()
    maps = query.offset(offset).limit(limit).all()
    return maps, total


def get_all_maps(db: Session, offset: int = 0, limit: int = 10):
    query = db.query(Map).filter(Map.visibility == 'public')
    total = query.count()
    maps = query.offset(offset).limit(limit).all()
    return maps, total


def create_location(db: Session, location_in: LocationCreate) -> Location:
    location = Location(
        map_id=location_in.map_id,
        type=location_in.type,
        name=location_in.name,
        description=location_in.description,
        x=location_in.x,
        y=location_in.y,
        metadata_json=location_in.metadata_json,
    )
    db.add(location)
    db.commit()
    db.refresh(location)
    return location


def get_locations_by_map_id(db: Session, map_id: UUID) -> list:
    return db.query(Location).filter(Location.map_id == map_id).all()


def get_location_by_id(db: Session, location_id: UUID) -> Optional[Location]:
    return db.query(Location).filter(Location.id == location_id).first()


def update_location(db: Session, location_id: UUID, location_in: LocationUpdate) -> Optional[Location]:
    location = get_location_by_id(db, location_id)
    if location is None:
        return None
    if location_in.type is not None:
        location.type = location_in.type
    if location_in.name is not None:
        location.name = location_in.name
    if location_in.description is not None:
        location.description = location_in.description
    if location_in.x is not None:
        location.x = location_in.x
    if location_in.y is not None:
        location.y = location_in.y
    if location_in.metadata_json is not None:
        location.metadata_json = location_in.metadata_json
    db.commit()
    db.refresh(location)
    return location


def delete_location(db: Session, location_id: UUID) -> bool:
    location = get_location_by_id(db, location_id)
    if location is None:
        return False
    db.delete(location)
    db.commit()
    return True


def is_map_owned_by_user(db: Session, user_id: UUID, map_id: UUID) -> bool:
    return db.query(Map).filter(Map.owner_id == user_id, Map.id == map_id).first() is not None


def is_location_owned_by_user(db: Session, user_id: UUID, location_id: UUID) -> bool:
    location = get_location_by_id(db, location_id)
    if location is None:
        return False
    return db.query(Location).filter(Map.id == location.map_id, Map.owner_id == user_id).first() is not None


def get_map_by_share_id(db: Session, share_id: str) -> Optional[object]:
    db_map = db.query(Map).filter(Map.share_id == share_id).first()
    if not db_map:
        return None
    if db_map.visibility != "link":
        return None
    return db_map