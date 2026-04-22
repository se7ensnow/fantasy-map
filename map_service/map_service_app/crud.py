import re
import typing
import uuid

import sqlalchemy
from sqlalchemy import exc
from sqlalchemy import orm

from map_service_app import config
from map_service_app import models
from map_service_app import schemas
from map_service_app import utils


_strip_re = re.compile(r"[^0-9a-zA-Zа-яА-ЯёЁ\- ]+")
_spaces_re = re.compile(r"\s+")


def create_map(db: orm.Session, owner_id: uuid.UUID, map_in: schemas.MapCreate) -> models.Map:
    db_map = models.Map(
        owner_id=owner_id,
        owner_username=map_in.owner_username,
        title=map_in.title,
        description=map_in.description,
        visibility=map_in.visibility,
    )

    db.add(db_map)
    db.flush()

    if map_in.tags:
        set_map_tags(db, db_map, map_in.tags)

    db.commit()
    db.refresh(db_map)

    return db_map


def get_map_by_id(db: orm.Session, map_id: uuid.UUID) -> typing.Optional[models.Map]:
    return (
        db.query(models.Map)
        .options(orm.selectinload(models.Map.tags))
        .filter(models.Map.id == map_id)
        .first()
    )


def update_map_tiles_info(
    db: orm.Session,
    map_id: uuid.UUID,
    tiles_info: schemas.TilesInfo,
) -> typing.Optional[models.Map]:
    db_map = get_map_by_id(db, map_id)
    if db_map is None:
        return None

    if tiles_info.tiles_version < db_map.tiles_version:
        return db_map

    db_map.has_tiles = True
    db_map.status = "ready"
    db_map.tiles_version = tiles_info.tiles_version
    db_map.width = tiles_info.width
    db_map.height = tiles_info.height
    db_map.max_zoom = tiles_info.max_zoom
    db.commit()
    db.refresh(db_map)
    return db_map


def update_map(
    db: orm.Session,
    map_id: uuid.UUID,
    map_in: schemas.MapUpdate,
) -> typing.Optional[models.Map]:
    db_map = get_map_by_id(db, map_id)
    if db_map is None:
        return None

    if map_in.title is not None:
        db_map.title = map_in.title
    if map_in.description is not None:
        db_map.description = map_in.description
    if map_in.visibility is not None:
        db_map.visibility = map_in.visibility

    removed_tags: typing.List[models.Tag] = []
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


def delete_map(db: orm.Session, map_id: uuid.UUID) -> bool:
    db_map = get_map_by_id(db, map_id)
    if db_map is None:
        return False

    old_tags = list(db_map.tags)

    db.delete(db_map)
    db.commit()

    cleanup_unused_tags(db, old_tags)
    db.commit()
    return True


def get_map_tiles_version(db: orm.Session, map_id: uuid.UUID) -> typing.Optional[int]:
    db_map = get_map_by_id(db, map_id)
    if db_map is None:
        return None
    return db_map.tiles_version


def get_maps_by_owner(db: orm.Session, owner_id: uuid.UUID, offset: int = 0, limit: int = 10):
    query = (
        db.query(models.Map)
        .options(orm.selectinload(models.Map.tags))
        .filter(models.Map.owner_id == owner_id)
    )
    total = query.count()
    maps = query.offset(offset).limit(limit).all()
    return maps, total


def list_maps_catalog(
    db: orm.Session,
    q: typing.Optional[str],
    tags: typing.List[str],
    tags_mode: str,
    offset: int = 0,
    limit: int = 10,
):
    query = (
        db.query(models.Map)
        .options(orm.selectinload(models.Map.tags))
        .filter(models.Map.visibility == "public", models.Map.status == "ready")
    )

    matched_tags_count = None

    if tags:
        names = prepare_tags(tags)
        if names:
            n = len(set(names))
            query = query.join(models.Map.tags).filter(models.Tag.name.in_(names))
            matched_tags_count = sqlalchemy.func.count(sqlalchemy.func.distinct(models.Tag.name))

            if tags_mode == "all":
                query = query.group_by(models.Map.id).having(matched_tags_count == n)
            else:
                query = query.group_by(models.Map.id)

    q = (q or "").strip()
    order_criteria = []

    if q:
        if len(q) < 3:
            q_lower = q.lower()
            q_pattern = f"%{q_lower}%"
            q_prefix = f"{q_lower}%"
            query = query.filter(sqlalchemy.func.lower(models.Map.title).like(q_pattern))
            query = query.order_by(models.Map.updated_at.desc())

            short_q_rank = sqlalchemy.case(
                (sqlalchemy.func.lower(models.Map.title) == q_lower, 3),
                (sqlalchemy.func.lower(models.Map.title).like(q_prefix), 2),
                else_=1,
            )
            order_criteria.append(short_q_rank.desc())
        else:
            threshold = 0.15
            similarity_expr = sqlalchemy.func.similarity(models.Map.title, q)

            query = query.filter(similarity_expr >= threshold)
            order_criteria.append(similarity_expr.desc())

    if matched_tags_count is not None:
        order_criteria.append(matched_tags_count.desc())

    order_criteria.append(models.Map.updated_at.desc())

    query = query.order_by(*order_criteria)

    total = query.count()
    items = query.offset(offset).limit(limit).all()
    return items, total


def create_location(db: orm.Session, location_in: schemas.LocationCreate) -> models.Location:
    location = models.Location(
        map_id=location_in.map_id,
        type=location_in.type,
        name=location_in.name,
        description_md=location_in.description_md,
        x=location_in.x,
        y=location_in.y,
    )
    db.add(location)
    db.commit()
    db.refresh(location)
    return location


def get_locations_by_map_id(db: orm.Session, map_id: uuid.UUID) -> typing.List[models.Location]:
    return db.query(models.Location).filter(models.Location.map_id == map_id).all()


def get_location_by_id(db: orm.Session, location_id: uuid.UUID) -> typing.Optional[models.Location]:
    return db.query(models.Location).filter(models.Location.id == location_id).first()


def update_location(
    db: orm.Session,
    location_id: uuid.UUID,
    location_in: schemas.LocationUpdate,
) -> typing.Optional[models.Location]:
    location = get_location_by_id(db, location_id)
    if location is None:
        return None

    if location_in.type is not None:
        location.type = location_in.type
    if location_in.name is not None:
        location.name = location_in.name
    if location_in.description_md is not None:
        location.description_md = location_in.description_md
    if location_in.x is not None:
        location.x = location_in.x
    if location_in.y is not None:
        location.y = location_in.y

    db.commit()
    db.refresh(location)
    return location


def delete_location(db: orm.Session, location_id: uuid.UUID) -> bool:
    location = get_location_by_id(db, location_id)
    if location is None:
        return False

    db.delete(location)
    db.commit()
    return True


def is_map_owned_by_user(db: orm.Session, user_id: uuid.UUID, map_id: uuid.UUID) -> bool:
    return db.query(models.Map).filter(
        models.Map.owner_id == user_id,
        models.Map.id == map_id
    ).first() is not None


def is_location_owned_by_user(db: orm.Session, user_id: uuid.UUID, location_id: uuid.UUID) -> bool:
    location = get_location_by_id(db, location_id)
    if location is None:
        return False

    return db.query(models.Location).filter(
        models.Map.id == location.map_id,
        models.Map.owner_id == user_id
    ).first() is not None


def normalize_tag(raw: str) -> str | None:
    if raw is None:
        return None

    name = raw.strip()
    name = _strip_re.sub("", name)
    name = _spaces_re.sub(" ", name).strip()

    if not name:
        return None

    name = name.lower()

    if len(name) > config.MAX_TAG_LEN:
        raise ValueError(f"Tag '{raw}' is too long (max {config.MAX_TAG_LEN} chars)")

    return name


def prepare_tags(tags: typing.List[str]) -> typing.List[str]:
    prepared: typing.List[str] = []
    seen: set[str] = set()

    for raw in tags or []:
        norm = normalize_tag(raw)
        if not norm:
            continue
        if norm in seen:
            continue
        seen.add(norm)
        prepared.append(norm)

    if len(prepared) > config.MAX_TAGS_PER_MAP:
        raise ValueError(f"Too many tags (max {config.MAX_TAGS_PER_MAP})")

    return prepared


def get_or_create_tags(db: orm.Session, tags: typing.List[str]) -> typing.List[models.Tag]:
    names = prepare_tags(tags)
    if not names:
        return []

    existing = db.query(models.Tag).filter(models.Tag.name.in_(names)).all()
    by_name = {t.name: t for t in existing}

    to_create = [models.Tag(name=n) for n in names if n not in by_name]

    if to_create:
        with db.begin_nested():
            db.add_all(to_create)
            try:
                db.flush()
            except exc.IntegrityError:
                pass

        existing = db.query(models.Tag).filter(models.Tag.name.in_(names)).all()
        by_name = {t.name: t for t in existing}

    return [by_name[n] for n in names if n in by_name]


def set_map_tags(db: orm.Session, map_obj: models.Map, tag_names: typing.List[str]) -> None:
    tags = get_or_create_tags(db, tag_names)
    map_obj.tags = tags


def cleanup_unused_tags(db: orm.Session, removed_tags: typing.List[models.Tag]) -> None:
    if not removed_tags:
        return

    removed_by_id = {t.id: t for t in removed_tags}

    for tag_id in removed_by_id:
        still_used = (
            db.query(models.Map.id)
            .join(models.Map.tags)
            .filter(models.Tag.id == tag_id)
            .limit(1)
            .first()
            is not None
        )
        if not still_used:
            db.delete(removed_by_id[tag_id])


def list_tags(db: orm.Session, q: typing.Optional[str] = None, limit: int = 50):
    query = (
        db.query(
            models.Tag.name.label("name"),
            sqlalchemy.func.count(models.Map.id).label("count"),
        )
        .select_from(models.Tag)
        .outerjoin(models.Tag.maps)
        .group_by(models.Tag.id)
    )

    if q:
        q_norm = normalize_tag(q)
        if q_norm:
            if len(q_norm) < 3:
                query = query.filter(sqlalchemy.func.lower(models.Tag.name).like(f"%{q_norm}%"))
                query = query.order_by(sqlalchemy.desc("count"), models.Tag.name.asc())
            else:
                th = 0.2
                query = (
                    query.filter(sqlalchemy.text("similarity(tags.name, :q) >= :th"))
                    .params(q=q_norm, th=th)
                    .order_by(
                        sqlalchemy.text("similarity(tags.name, :q) DESC"),
                        sqlalchemy.desc("count"),
                        models.Tag.name.asc(),
                    )
                    .params(q=q_norm)
                )
        else:
            query = query.order_by(sqlalchemy.desc("count"), models.Tag.name.asc())
    else:
        query = query.order_by(sqlalchemy.desc("count"), models.Tag.name.asc())

    return query.limit(limit).all()


def create_share(db: orm.Session, map_id: uuid.UUID) -> typing.Optional[str]:
    db_map = db.query(models.Map).filter(models.Map.id == map_id).first()
    if not db_map:
        return None

    if db_map.share_id:
        return str(db_map.share_id)

    for _ in range(config.SHARE_ID_TRIES):
        candidate = utils.generate_share_id()
        exists = db.query(models.Map).filter(models.Map.share_id == candidate).first()
        if not exists:
            db_map.share_id = candidate
            db.commit()
            db.refresh(db_map)
            return candidate

    raise RuntimeError("Failed to generate unique share ID after multiple attempts")


def delete_share(db: orm.Session, map_id: uuid.UUID) -> bool:
    db_map = db.query(models.Map).filter(models.Map.id == map_id).first()
    if not db_map:
        return False

    if db_map.share_id is None:
        return True

    db_map.share_id = None
    db.commit()
    return True


def get_map_by_share_id(db: orm.Session, share_id: str) -> typing.Optional[models.Map]:
    db_map = (
        db.query(models.Map)
        .options(orm.selectinload(models.Map.tags))
        .filter(models.Map.share_id == share_id)
        .first()
    )
    if not db_map:
        return None
    return db_map