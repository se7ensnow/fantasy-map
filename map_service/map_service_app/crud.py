from sqlalchemy.orm import Session, selectinload
from uuid import UUID
from typing import Optional, List
from sqlalchemy import func, text, desc
from sqlalchemy.exc import IntegrityError

import re

from map_service_app.config import MAX_TAGS_PER_MAP, MAX_TAG_LEN, SHARE_ID_TRIES
from map_service_app.models import Map, Location, Tag
from map_service_app.schemas import MapCreate, LocationCreate, MapUpdate, LocationUpdate, TilesInfo
from map_service_app.utils import generate_share_id



_strip_re = re.compile(r"[^0-9a-zA-Zа-яА-ЯёЁ\- ]+")
_spaces_re = re.compile(r"\s+")


def create_map(db: Session, owner_id: UUID, map_in: MapCreate) -> Map:
    db_map = Map(
        owner_id=owner_id,
        owner_username=map_in.owner_username,
        title=map_in.title,
        description=map_in.description,
        visibility=map_in.visibility,
        source_path='',
        tiles_path='',
        width=0,
        height=0,
        max_zoom=0,
    )

    if map_in.visibility == 'link':
        create_share(db, db_map)

    db.add(db_map)
    db.flush()

    if map_in.tags:
        set_map_tags(db, db_map, map_in.tags)

    db.commit()
    db.refresh(db_map)

    return db_map


def get_map_by_id(db: Session, map_id: UUID) -> Optional[Map]:
    return (
        db.query(Map)
        .options(selectinload(Map.tags))
        .filter(Map.id == map_id)
        .first()
    )


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


def create_share(db: Session, map_obj: Map) -> str:
    if map_obj.share_id:
        return str(map_obj.share_id)

    for _ in range(SHARE_ID_TRIES):
        candidate = generate_share_id()
        exists = db.query(Map).filter(Map.share_id == candidate).first()
        if not exists:
            map_obj.share_id = candidate
            return candidate
    raise RuntimeError("Failed to generate unique share ID after multiple attempts")


def update_map(db: Session, map_id: UUID, map_in: MapUpdate) -> Optional[Map]:
    db_map = get_map_by_id(db, map_id)
    if db_map is None:
        return None
    if map_in.title is not None:
        db_map.title = map_in.title
    if map_in.description is not None:
        db_map.description = map_in.description
    if map_in.visibility is not None:
        if map_in.visibility == 'link':
            create_share(db, db_map)
        else:
            if db_map.share_id:
                db_map.share_id = None
        db_map.visibility = map_in.visibility

    removed_tags: List[Tag] = []
    if map_in.tags is not None:
        old_tags = list(db_map.tags)

        set_map_tags(db, db_map, map_in.tags)

        new_ids = {t.id for t in db_map.tags}
        removed_tags = [t for t in old_tags if t.id not in new_ids]

    db.commit()

    if removed_tags:
        cleanup_unused_tags(db, removed_tags)
        db.commit()

    db.refresh(db_map)
    return db_map



def delete_map(db: Session, map_id: UUID) -> bool:
    db_map = get_map_by_id(db, map_id)
    if db_map is None:
        return False

    old_tags = list(db_map.tags)

    db.delete(db_map)
    db.commit()

    cleanup_unused_tags(db, old_tags)
    db.commit()
    return True



def get_maps_by_owner(db: Session, owner_id: UUID, offset: int = 0, limit: int = 10):
    query = db.query(Map).options(selectinload(Map.tags)).filter(Map.owner_id == owner_id)
    total = query.count()
    maps = query.offset(offset).limit(limit).all()
    return maps, total


def list_maps_catalog(
        db: Session,
        q: Optional[str],
        tags: List[str],
        tags_mode: str,
        offset: int = 0,
        limit: int = 10,
):
    query = db.query(Map).options(selectinload(Map.tags)).filter(Map.visibility == 'public')
    if tags:
        names = prepare_tags(tags)
        if names:
            n = len(set(names))
            query = query.join(Map.tags).filter(Tag.name.in_(names))

            if tags_mode == "all":
                query = query.group_by(Map.id).having(func.count(func.distinct(Tag.name)) == n)
            else:
                query = query.group_by(Map.id)

    q = (q or "").strip()
    if q:
        if len(q) < 3:
            q_pattern = f"%{q.lower()}%"
            query = query.filter(func.lower(Map.title).like(q_pattern))
            query = query.order_by(Map.updated_at.desc())
        else:
            threshold = 0.15
            query = (
                query.filter(text("similarity(maps.title, :q) >= :th"))
                .params(q=q, th=threshold)
                .order_by(text("similarity(maps.title, :q) DESC"), Map.updated_at.desc())
                .params(q=q)
            )
    else:
        query = query.order_by(Map.updated_at.desc())

    total = query.count()
    items = query.offset(offset).limit(limit).all()
    return items, total


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


def get_locations_by_map_id(db: Session, map_id: UUID) -> List[Location]:
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


def get_map_by_share_id(db: Session, share_id: str) -> Optional[Map]:
    db_map = db.query(Map).options(selectinload(Map.tags)).filter(Map.share_id == share_id).first()
    if not db_map:
        return None
    if db_map.visibility != "link":
        return None
    return db_map


def normalize_tag(raw: str) -> str | None:
    if raw is None:
        return None

    name = raw.strip()
    name = _strip_re.sub("", name)
    name = _spaces_re.sub(" ", name).strip()

    if not name:
        return None

    name = name.lower()

    if len(name) > MAX_TAG_LEN:
        raise ValueError(f"Tag '{raw}' is too long (max {MAX_TAG_LEN} chars)")

    return name


def prepare_tags(tags: List[str]) -> List[str]:
    prepared: List[str] = []
    seen: set[str] = set()

    for raw in tags or []:
        norm = normalize_tag(raw)
        if not norm:
            continue
        if norm in seen:
            continue
        seen.add(norm)
        prepared.append(norm)

    if len(prepared) > MAX_TAGS_PER_MAP:
        raise ValueError(f"Too many tags (max {MAX_TAGS_PER_MAP})")

    return prepared


def get_or_create_tags(db: Session, tags: List[str]) -> List[Tag]:
    names = prepare_tags(tags)
    if not names:
        return []

    existing = db.query(Tag).filter(Tag.name.in_(names)).all()
    by_name = {t.name: t for t in existing}

    to_create = [Tag(name=n) for n in names if n not in by_name]

    if to_create:
        with db.begin_nested():
            db.add_all(to_create)
            try:
                db.flush()
            except IntegrityError:
                pass

        existing = db.query(Tag).filter(Tag.name.in_(names)).all()
        by_name = {t.name: t for t in existing}

    return [by_name[n] for n in names if n in by_name]


def set_map_tags(db: Session, map_obj: Map, tag_names: List[str]) -> None:
    tags = get_or_create_tags(db, tag_names)
    map_obj.tags = tags


def cleanup_unused_tags(db: Session, removed_tags: List[Tag]) -> None:
    if not removed_tags:
        return

    removed_by_id = {t.id: t for t in removed_tags}

    for tag_id in removed_by_id:
        still_used = (
            db.query(Map.id)
            .join(Map.tags)
            .filter(Tag.id == tag_id)
            .limit(1)
            .first()
            is not None
        )
        if not still_used:
            db.delete(removed_by_id[tag_id])


def list_tags(db: Session, q: Optional[str] = None, limit: int = 50):
    query = (
        db.query(
            Tag.name.label("name"),
            func.count(Map.id).label("count"),
        )
        .select_from(Tag)
        .outerjoin(Tag.maps)
        .group_by(Tag.id)
    )

    if q:
        q_norm = normalize_tag(q)
        if q_norm:
            if len(q_norm) < 3:
                query = query.filter(func.lower(Tag.name).like(f"%{q_norm}%"))
                query = query.order_by(desc("count"), Tag.name.asc())
            else:
                th = 0.2
                query = (
                    query.filter(text("similarity(tags.name, :q) >= :th"))
                    .params(q=q_norm, th=th)
                    .order_by(text("similarity(tags.name, :q) DESC"), desc("count"), Tag.name.asc())
                    .params(q=q_norm)
                )
        else:
            query = query.order_by(desc("count"), Tag.name.asc())
    else:
        query = query.order_by(desc("count"), Tag.name.asc())

    return query.limit(limit).all()
