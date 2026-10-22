"""여행기록 API (담당: 서준). docs/API-SPEC.md 2절."""

from datetime import datetime

from fastapi import APIRouter, HTTPException, Response
from pydantic import BaseModel, field_validator, model_validator

from database import get_connection
from routers.uploads import check_photo_name, delete_photo

router = APIRouter(prefix="/api/trips", tags=["trips"])

NOT_FOUND = "여행을 찾을 수 없어요"


class TripIn(BaseModel):
    """POST·PUT 본문. 규칙은 API-SPEC 2절 3번."""

    name: str
    destination: str
    start_date: str
    end_date: str
    info: str | None = None
    photo: str | None = None  # 대표사진 파일 이름 (D-033)

    @field_validator("name", "destination")
    @classmethod
    def check_text(cls, value: str) -> str:
        # 앞뒤 공백을 빼고 저장한다. 공백만 적으면 비운 것으로 본다 (D-021).
        value = value.strip()
        if not value:
            raise ValueError("비어 있을 수 없어요")
        if len(value) > 20:
            raise ValueError("20자까지 쓸 수 있어요")
        return value

    @field_validator("start_date", "end_date")
    @classmethod
    def check_date(cls, value: str) -> str:
        # YYYY-MM-DD 꼴이고 실제로 있는 날짜여야 한다.
        try:
            parsed = datetime.strptime(value, "%Y-%m-%d")
        except ValueError:
            raise ValueError("YYYY-MM-DD 꼴의 실제 날짜여야 해요")
        if parsed.strftime("%Y-%m-%d") != value:
            raise ValueError("YYYY-MM-DD 꼴의 실제 날짜여야 해요")
        return value

    @field_validator("info")
    @classmethod
    def check_info(cls, value: str | None) -> str | None:
        # 비우거나 공백만 적으면 null로 저장한다.
        if value is None:
            return None
        value = value.strip()
        return value or None

    @field_validator("photo")
    @classmethod
    def check_photo(cls, value: str | None) -> str | None:
        # POST /api/uploads가 돌려준 이름이어야 한다 (API-SPEC 1절).
        if value is None:
            return None
        return check_photo_name(value)

    @model_validator(mode="after")
    def check_period(self):
        if self.end_date < self.start_date:
            raise ValueError("종료일은 시작일과 같거나 뒤여야 해요")
        return self


def find_trip(conn, trip_id: int):
    row = conn.execute("SELECT * FROM trips WHERE id = ?", (trip_id,)).fetchone()
    if row is None:
        raise HTTPException(status_code=404, detail=NOT_FOUND)
    return row


@router.get("")
def list_trips():
    """여행 목록. 시작일이 늦은 것이 앞, 같으면 id가 큰 것이 앞."""
    conn = get_connection()
    try:
        rows = conn.execute(
            "SELECT * FROM trips ORDER BY start_date DESC, id DESC"
        ).fetchall()
    finally:
        conn.close()
    return [dict(row) for row in rows]


@router.get("/{trip_id}")
def get_trip(trip_id: int):
    conn = get_connection()
    try:
        row = find_trip(conn, trip_id)
    finally:
        conn.close()
    return dict(row)


@router.post("", status_code=201)
def create_trip(trip: TripIn):
    conn = get_connection()
    try:
        cursor = conn.execute(
            "INSERT INTO trips (name, destination, start_date, end_date, info, photo)"
            " VALUES (?, ?, ?, ?, ?, ?)",
            (trip.name, trip.destination, trip.start_date, trip.end_date, trip.info, trip.photo),
        )
        conn.commit()
        row = find_trip(conn, cursor.lastrowid)
    finally:
        conn.close()
    return dict(row)


@router.put("/{trip_id}")
def update_trip(trip_id: int, trip: TripIn):
    """검사 순서: 본문 422 → 없는 id 404 → 기간 밖 장소·일기 409."""
    conn = get_connection()
    try:
        old_photo = find_trip(conn, trip_id)["photo"]
        # 새 기간 밖에 있는 장소·일기를 센다 (R-T-017).
        place_count = conn.execute(
            "SELECT COUNT(*) FROM places"
            " WHERE trip_id = ? AND (visit_date < ? OR visit_date > ?)",
            (trip_id, trip.start_date, trip.end_date),
        ).fetchone()[0]
        diary_count = conn.execute(
            "SELECT COUNT(*) FROM diaries"
            " WHERE trip_id = ? AND (date < ? OR date > ?)",
            (trip_id, trip.start_date, trip.end_date),
        ).fetchone()[0]
        if place_count or diary_count:
            raise HTTPException(
                status_code=409,
                detail={"place_count": place_count, "diary_count": diary_count},
            )
        conn.execute(
            "UPDATE trips SET name = ?, destination = ?, start_date = ?, end_date = ?,"
            " info = ?, photo = ?, updated_at = datetime('now', 'localtime') WHERE id = ?",
            (
                trip.name, trip.destination, trip.start_date, trip.end_date,
                trip.info, trip.photo, trip_id,
            ),
        )
        conn.commit()
        row = find_trip(conn, trip_id)
    finally:
        conn.close()
    # 바꾸거나 뺀 전 사진 파일을 지운다 (D-033).
    if old_photo != trip.photo:
        delete_photo(old_photo)
    return dict(row)


@router.delete("/{trip_id}", status_code=204)
def delete_trip(trip_id: int):
    """검사 순서: 없는 id 404 → 붙은 장소·일기 409 (D-015)."""
    conn = get_connection()
    try:
        photo = find_trip(conn, trip_id)["photo"]
        place_count = conn.execute(
            "SELECT COUNT(*) FROM places WHERE trip_id = ?", (trip_id,)
        ).fetchone()[0]
        diary_count = conn.execute(
            "SELECT COUNT(*) FROM diaries WHERE trip_id = ?", (trip_id,)
        ).fetchone()[0]
        if place_count or diary_count:
            raise HTTPException(
                status_code=409,
                detail={"place_count": place_count, "diary_count": diary_count},
            )
        conn.execute("DELETE FROM trips WHERE id = ?", (trip_id,))
        conn.commit()
    finally:
        conn.close()
    delete_photo(photo)  # 409면 여기까지 오지 않아 사진도 남는다 (D-033).
    return Response(status_code=204)
