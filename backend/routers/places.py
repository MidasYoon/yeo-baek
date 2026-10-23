"""여행지 정보 API (담당: 은희). docs/API-SPEC.md 3절."""

from datetime import datetime

from fastapi import APIRouter, HTTPException, Query, Response
from pydantic import BaseModel, field_validator

from database import get_connection
from routers.uploads import check_photo_name, delete_photo

router = APIRouter(prefix="/api/places", tags=["places"])

NOT_FOUND = "장소를 찾을 수 없어요"

MAX_PHOTOS = 4  # 장소 사진은 0~4장 (D-033)
PAGE_SIZE = 10  # 전체 보기 한 페이지의 장소 수 (D-034)

# 지역에 저장하는 시·도 17개 이름 (D-016)
REGIONS = (
    "서울", "부산", "대구", "인천", "광주", "대전", "울산", "세종", "경기",
    "강원", "충북", "충남", "전북", "전남", "경북", "경남", "제주",
)


def check_date_text(value: str) -> str:
    # YYYY-MM-DD 꼴이고 실제로 있는 날짜여야 한다 (D-029).
    try:
        parsed = datetime.strptime(value, "%Y-%m-%d")
    except ValueError:
        raise ValueError("YYYY-MM-DD 꼴의 실제 날짜여야 해요")
    if parsed.strftime("%Y-%m-%d") != value:
        raise ValueError("YYYY-MM-DD 꼴의 실제 날짜여야 해요")
    return value


class PlaceUpdate(BaseModel):
    """PUT 본문. trip_id가 와도 무시한다 (장소의 여행은 바꾸지 않는다)."""

    region: str
    name: str
    visit_date: str
    memo: str | None = None
    photos: list[str] = []  # 사진 파일 이름 목록 (D-033)

    @field_validator("region")
    @classmethod
    def check_region(cls, value: str) -> str:
        if value not in REGIONS:
            raise ValueError("시·도 17개 이름 중 하나여야 해요")
        return value

    @field_validator("name")
    @classmethod
    def check_name(cls, value: str) -> str:
        # 앞뒤 공백을 빼고 저장한다. 공백만 적으면 비운 것으로 본다 (D-021, D-029).
        value = value.strip()
        if not value:
            raise ValueError("비어 있을 수 없어요")
        if len(value) > 20:
            raise ValueError("20자까지 쓸 수 있어요")
        return value

    @field_validator("visit_date")
    @classmethod
    def check_visit_date(cls, value: str) -> str:
        return check_date_text(value)

    @field_validator("memo")
    @classmethod
    def check_memo(cls, value: str | None) -> str | None:
        # 비우거나 공백만 적으면 null로 저장한다 (D-029).
        if value is None:
            return None
        value = value.strip()
        if len(value) > 20:
            raise ValueError("20자까지 쓸 수 있어요")
        return value or None

    @field_validator("photos")
    @classmethod
    def check_photos(cls, value: list[str]) -> list[str]:
        # 0~4장, 같은 이름은 한 번만, 모두 POST /api/uploads가 돌려준 이름이어야 한다 (API-SPEC 3절).
        if len(value) > MAX_PHOTOS:
            raise ValueError(f"사진은 {MAX_PHOTOS}장까지 넣을 수 있어요")
        if len(set(value)) != len(value):
            raise ValueError("같은 사진이 두 번 있어요")
        return [check_photo_name(name) for name in value]


class PlaceIn(PlaceUpdate):
    """POST 본문. 규칙은 API-SPEC 3절 3번."""

    trip_id: int


def find_place(conn, place_id: int):
    row = conn.execute("SELECT * FROM places WHERE id = ?", (place_id,)).fetchone()
    if row is None:
        raise HTTPException(status_code=404, detail=NOT_FOUND)
    return row


def photo_names(conn, place_id: int) -> list[str]:
    """한 장소의 사진 파일 이름. 먼저 붙인 것(id가 작은 것)이 앞."""
    rows = conn.execute(
        "SELECT filename FROM place_photos WHERE place_id = ? ORDER BY id", (place_id,)
    ).fetchall()
    return [row["filename"] for row in rows]


def with_photos(conn, row) -> dict:
    """장소 줄에 photos 목록을 붙여 응답 모양으로 만든다 (API-SPEC 3절 2번)."""
    place = dict(row)
    place["photos"] = photo_names(conn, place["id"])
    return place


def check_in_period(conn, trip_id: int, visit_date: str):
    """방문 날짜가 그 여행의 기간 안인지 본다. 없는 여행이면 422 (API-SPEC 1절)."""
    trip = conn.execute(
        "SELECT start_date, end_date FROM trips WHERE id = ?", (trip_id,)
    ).fetchone()
    if trip is None:
        raise HTTPException(status_code=422, detail="없는 여행이에요")
    if not trip["start_date"] <= visit_date <= trip["end_date"]:
        raise HTTPException(
            status_code=422,
            detail=f"방문 날짜는 여행 기간({trip['start_date']} ~ {trip['end_date']}) 안이어야 해요",
        )


@router.get("")
def list_places(trip_id: int):
    """여행별 장소 목록. 방문 날짜가 오래된 것이 앞, 같으면 id가 작은 것이 앞."""
    conn = get_connection()
    try:
        rows = conn.execute(
            "SELECT * FROM places WHERE trip_id = ? ORDER BY visit_date ASC, id ASC",
            (trip_id,),
        ).fetchall()
        places = [with_photos(conn, row) for row in rows]
    finally:
        conn.close()
    return places


# /recent는 /{place_id}보다 먼저 등록해야 recent가 id로 읽히지 않는다 (API-SPEC 1절).
@router.get("/recent")
def get_recent_place():
    """모든 여행에서 방문 날짜가 늦은 것, 같으면 id가 큰 것 1개. 없으면 null."""
    conn = get_connection()
    try:
        row = conn.execute(
            "SELECT * FROM places ORDER BY visit_date DESC, id DESC LIMIT 1"
        ).fetchone()
        place = with_photos(conn, row) if row else None
    finally:
        conn.close()
    return place


# /page도 /{place_id}보다 먼저 등록한다 (API-SPEC 3절 1번).
@router.get("/page")
def get_place_page(
    page: int = Query(1, ge=1),
    size: int = Query(PAGE_SIZE, ge=1, le=50),
):
    """전체 보기 한 페이지 (D-034). 모든 여행에서 방문 날짜가 늦은 것, 같으면 id가 큰 것이 앞.
    항목마다 그 여행의 이름을 trip_name으로 붙이고, total은 모든 장소 개수다."""
    conn = get_connection()
    try:
        total = conn.execute("SELECT COUNT(*) FROM places").fetchone()[0]
        rows = conn.execute(
            "SELECT places.*, trips.name AS trip_name FROM places "
            "JOIN trips ON trips.id = places.trip_id "
            "ORDER BY places.visit_date DESC, places.id DESC LIMIT ? OFFSET ?",
            (size, (page - 1) * size),
        ).fetchall()
        items = [with_photos(conn, row) for row in rows]
    finally:
        conn.close()
    return {"items": items, "total": total}


@router.get("/{place_id}")
def get_place(place_id: int):
    conn = get_connection()
    try:
        place = with_photos(conn, find_place(conn, place_id))
    finally:
        conn.close()
    return place


@router.post("", status_code=201)
def create_place(place: PlaceIn):
    """검사 순서: 본문 422 → 없는 여행 422 → 기간 밖 422."""
    conn = get_connection()
    try:
        check_in_period(conn, place.trip_id, place.visit_date)
        cursor = conn.execute(
            "INSERT INTO places (trip_id, region, name, visit_date, memo)"
            " VALUES (?, ?, ?, ?, ?)",
            (place.trip_id, place.region, place.name, place.visit_date, place.memo),
        )
        conn.executemany(
            "INSERT INTO place_photos (place_id, filename) VALUES (?, ?)",
            [(cursor.lastrowid, name) for name in place.photos],
        )
        conn.commit()
        created = with_photos(conn, find_place(conn, cursor.lastrowid))
    finally:
        conn.close()
    return created


@router.put("/{place_id}")
def update_place(place_id: int, place: PlaceUpdate):
    """검사 순서: 본문 422 → 없는 id 404 → 기간 밖 422 (D-029).
    기간은 그 장소에 저장된 trip_id의 여행으로 검사한다."""
    conn = get_connection()
    try:
        saved = find_place(conn, place_id)
        check_in_period(conn, saved["trip_id"], place.visit_date)
        conn.execute(
            "UPDATE places SET region = ?, name = ?, visit_date = ?, memo = ?,"
            " updated_at = datetime('now', 'localtime') WHERE id = ?",
            (place.region, place.name, place.visit_date, place.memo, place_id),
        )
        # 사진은 본문 목록으로 통째로 바꾼다. 남는 사진은 순서 그대로, 새 사진은 뒤에 붙는다 (API-SPEC 3절 4번).
        old_photos = photo_names(conn, place_id)
        removed = [name for name in old_photos if name not in place.photos]
        conn.executemany(
            "DELETE FROM place_photos WHERE place_id = ? AND filename = ?",
            [(place_id, name) for name in removed],
        )
        conn.executemany(
            "INSERT INTO place_photos (place_id, filename) VALUES (?, ?)",
            [(place_id, name) for name in place.photos if name not in old_photos],
        )
        conn.commit()
        updated = with_photos(conn, find_place(conn, place_id))
    finally:
        conn.close()
    for name in removed:
        delete_photo(name)
    return updated


@router.delete("/{place_id}", status_code=204)
def delete_place(place_id: int):
    conn = get_connection()
    try:
        find_place(conn, place_id)
        photos = photo_names(conn, place_id)
        # 사진 줄은 DB가 ON DELETE CASCADE로 함께 지운다 (DATA-MODEL 5절, DM-01).
        conn.execute("DELETE FROM places WHERE id = ?", (place_id,))
        conn.commit()
    finally:
        conn.close()
    for name in photos:
        delete_photo(name)
    return Response(status_code=204)
