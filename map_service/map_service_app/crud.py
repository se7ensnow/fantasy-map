from sqlalchemy.orm import Session, selectinload
from uuid import UUID
from typing import Optional, List
from sqlalchemy import func, text, desc
from sqlalchemy.exc import IntegrityError

import re

from map_service_app.models import Map, Location, Tag
from map_service_app.schemas import MapCreate, LocationCreate, MapUpdate, LocationUpdate, TilesInfo

_slug_re = re.compile(r"[^0-9a-zA-Zа-яА-ЯёЁ\- ]+")


def create_map(db: Session, owner_id: UUID, map_in: MapCreate) -> Map:
    db_map = Map(
        owner_id=owner_id,
        owner_username=map_in.owner_username,
        title=map_in.title,
        description=map_in.description,
        source_path='',
        tiles_path='',
        width=0,
        height=0,
        max_zoom=0,
    )
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


def update_map(db: Session, map_id: UUID, map_in: MapUpdate) -> Optional[Map]:
    db_map = get_map_by_id(db, map_id)
    if db_map is None:
        return None
    if map_in.title is not None:
        db_map.title = map_in.title
    if map_in.description is not None:
        db_map.description = map_in.description
    if map_in.tags is not None:
        set_map_tags(db, db_map, map_in.tags)
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
    query = db.query(Map).options(selectinload(Map.tags)).filter(Map.owner_id == owner_id)
    total = query.count()
    maps = query.offset(offset).limit(limit).all()
    return maps, total


def list_maps_catalog(
        db: Session,
        q: Optional[str],
        tag_slugs: List[str],
        tags_mode: str,
        offset: int = 0,
        limit: int = 10,
):
    query = db.query(Map).options(selectinload(Map.tags))
    if tag_slugs:
        uniq = list(set(tag_slugs))
        n = len(uniq)

        query = query.join(Map.tags).filter(Tag.slug.in_(uniq))

        if tags_mode == "all":
            query = query.group_by(Map.id).having(func.count(func.distinct(Tag.slug)) == n)
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
        metadata_json=location_in.metadata_json
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


def normalize_tag(raw: str) -> tuple[str, str] | None:
    if raw is None:
        return None
    name = raw.strip()
    if not name:
        return None

    name = re.sub(r"\s+", " ", name)

    slug = name.lower().replace("ё", "е")
    slug = _slug_re.sub("", slug)
    slug = re.sub(r"\s+", "-", slug)
    slug = re.sub(r"-{2,}", "-", slug)
    slug = slug.strip("-")

    if not slug:
        return None
    if len(slug) > 50:
        slug = slug[:50].strip("-")

    return slug, name


def get_or_create_tags(db: Session, tag_names: List[str]) -> List[Tag]:
    items: dict[str, str] = {}
    for raw in tag_names or []:
        norm = normalize_tag(raw)
        if not norm:
            continue
        slug, name = norm
        items.setdefault(slug, name)

    if not items:
        return []

    slugs = list(items.keys())

    existing = db.query(Tag).filter(Tag.slug.in_(slugs)).all()
    by_slug = {t.slug: t for t in existing}

    to_create = [Tag(slug=s, name=items[s]) for s in slugs if s not in by_slug]

    if to_create:
        with db.begin_nested():
            db.add_all(to_create)
            try:
                db.flush()
            except IntegrityError:
                pass

        existing = db.query(Tag).filter(Tag.slug.in_(slugs)).all()
        by_slug = {t.slug: t for t in existing}

    return [by_slug[s] for s in slugs if s in by_slug]


def set_map_tags(db: Session, map_obj: Map, tag_names: List[str]) -> None:
    tags = get_or_create_tags(db, tag_names)
    map_obj.tags = tags


def list_tags(db: Session, q: Optional[str] = None, limit: int = 50):
    query = (
        db.query(
            Tag.slug.label("slug"),
            Tag.name.label("name"),
            func.count(Map.id).label("count"),
        )
        .select_from(Tag)
        .outerjoin(Tag.maps)
        .group_by(Tag.id)
    )

    if q:
        q2 = q.strip().lower()
        query = query.filter(func.lower(Tag.name).like(f"%{q2}%") | func.lower(Tag.slug).like(f"%{q2}%"))

    query = query.order_by(desc("count"), Tag.name.asc()).limit(limit)
    return query.all()
