"""여행 다이어리 API (담당: 건용). docs/API-SPEC.md 4절."""

import re
from datetime import datetime

from fastapi import APIRouter, HTTPException, Query, Response
from pydantic import BaseModel, field_validator

from database import get_connection
from routers.uploads import check_photo_name, delete_photo

router = APIRouter(prefix="/api/diaries", tags=["diaries"])

PAGE_SIZE = 20  # 전체 보기 한 페이지의 일기 수 (D-034)

NOT_FOUND = "일기를 찾을 수 없어요"

# 기분에 저장하는 이름 5개 (D-016). 이모지는 화면이 이름에 맞춰 보인다.
MOODS = ("설렘", "행복", "평온", "피곤", "아쉬움")

# HH:MM 24시간, 두 자리씩 (D-016). 글자 순서대로 정렬해도 시간 순서가 맞는다.
TIME_PATTERN = re.compile(r"^([01]\d|2[0-3]):[0-5]\d$")


def check_date_text(value: str) -> str:
    # YYYY-MM-DD 꼴이고 실제로 있는 날짜여야 한다 (D-029).
    try:
        parsed = datetime.strptime(value, "%Y-%m-%d")
    except ValueError:
        raise ValueError("YYYY-MM-DD 꼴의 실제 날짜여야 해요")
    if parsed.strftime("%Y-%m-%d") != value:
        raise ValueError("YYYY-MM-DD 꼴의 실제 날짜여야 해요")
    return value


class DiaryUpdate(BaseModel):
    """PUT 본문. trip_id가 와도 무시한다 (일기의 여행은 바꾸지 않는다)."""

    date: str
    time: str
    title: str
    body: str | None = None
    mood: str
    photo: str | None = None  # 사진 파일 이름 (D-033)

    @field_validator("date")
    @classmethod
    def check_date(cls, value: str) -> str:
        return check_date_text(value)

    @field_validator("time")
    @classmethod
    def check_time(cls, value: str) -> str:
        if not TIME_PATTERN.match(value):
            raise ValueError("HH:MM(00:00~23:59) 꼴이어야 해요")
        return value

    @field_validator("title")
    @classmethod
    def check_title(cls, value: str) -> str:
        # 앞뒤 공백을 빼고 저장한다. 공백만 적으면 비운 것으로 본다 (D-021, D-029).
        value = value.strip()
        if not value:
            raise ValueError("비어 있을 수 없어요")
        if len(value) > 50:
            raise ValueError("50자까지 쓸 수 있어요")
        return value

    @field_validator("body")
    @classmethod
    def check_body(cls, value: str | None) -> str | None:
        # 글자 수 제한은 없다. 비우거나 공백만 적으면 null로 저장한다 (D-029).
        if value is None:
            return None
        return value.strip() or None

    @field_validator("mood")
    @classmethod
    def check_mood(cls, value: str) -> str:
        if value not in MOODS:
            raise ValueError("기분 이름 5개 중 하나여야 해요")
        return value

    @field_validator("photo")
    @classmethod
    def check_photo(cls, value: str | None) -> str | None:
        # POST /api/uploads가 돌려준 이름이어야 한다 (API-SPEC 1절).
        if value is None:
            return None
        return check_photo_name(value)


class DiaryIn(DiaryUpdate):
    """POST 본문. 규칙은 API-SPEC 4절 3번."""

    trip_id: int


def find_diary(conn, diary_id: int):
    row = conn.execute("SELECT * FROM diaries WHERE id = ?", (diary_id,)).fetchone()
    if row is None:
        raise HTTPException(status_code=404, detail=NOT_FOUND)
    return row


def check_in_period(conn, trip_id: int, date: str):
    """날짜가 그 여행의 기간 안인지 본다. 없는 여행이면 422 (API-SPEC 1절)."""
    trip = conn.execute(
        "SELECT start_date, end_date FROM trips WHERE id = ?", (trip_id,)
    ).fetchone()
    if trip is None:
        raise HTTPException(status_code=422, detail="없는 여행이에요")
    if not trip["start_date"] <= date <= trip["end_date"]:
        raise HTTPException(
            status_code=422,
            detail=f"날짜는 여행 기간({trip['start_date']} ~ {trip['end_date']}) 안이어야 해요",
        )


@router.get("")
def list_diaries(trip_id: int):
    """여행별 일기 목록. 날짜·시각이 오래된 것이 앞, 같으면 id가 작은 것이 앞."""
    conn = get_connection()
    try:
        rows = conn.execute(
            "SELECT * FROM diaries WHERE trip_id = ? ORDER BY date ASC, time ASC, id ASC",
            (trip_id,),
        ).fetchall()
    finally:
        conn.close()
    return [dict(row) for row in rows]


# /recent는 /{diary_id}보다 먼저 등록해야 recent가 id로 읽히지 않는다 (API-SPEC 1절).
@router.get("/recent")
def get_recent_diary():
    """모든 여행에서 날짜·시각이 늦은 것, 같으면 id가 큰 것 1개. 없으면 null."""
    conn = get_connection()
    try:
        row = conn.execute(
            "SELECT * FROM diaries ORDER BY date DESC, time DESC, id DESC LIMIT 1"
        ).fetchone()
    finally:
        conn.close()
    return dict(row) if row else None


# /page도 /{diary_id}보다 먼저 등록한다 (API-SPEC 4절 1번).
@router.get("/page")
def get_diary_page(
    page: int = Query(1, ge=1),
    size: int = Query(PAGE_SIZE, ge=1, le=50),
):
    """전체 보기 한 페이지 (D-034). 모든 여행에서 날짜·시각이 늦은 것, 같으면 id가 큰 것이 앞.
    항목마다 그 여행의 이름을 trip_name으로 붙이고, total은 모든 일기 개수다."""
    conn = get_connection()
    try:
        total = conn.execute("SELECT COUNT(*) FROM diaries").fetchone()[0]
        rows = conn.execute(
            "SELECT diaries.*, trips.name AS trip_name FROM diaries "
            "JOIN trips ON trips.id = diaries.trip_id "
            "ORDER BY diaries.date DESC, diaries.time DESC, diaries.id DESC LIMIT ? OFFSET ?",
            (size, (page - 1) * size),
        ).fetchall()
    finally:
        conn.close()
    return {"items": [dict(row) for row in rows], "total": total}


@router.get("/{diary_id}")
def get_diary(diary_id: int):
    conn = get_connection()
    try:
        row = find_diary(conn, diary_id)
    finally:
        conn.close()
    return dict(row)


@router.post("", status_code=201)
def create_diary(diary: DiaryIn):
    """검사 순서: 본문 422 → 없는 여행 422 → 기간 밖 422.
    같은 날짜·시각의 일기가 있어도 저장한다 (R-D-002)."""
    conn = get_connection()
    try:
        check_in_period(conn, diary.trip_id, diary.date)
        cursor = conn.execute(
            "INSERT INTO diaries (trip_id, date, time, title, body, mood, photo)"
            " VALUES (?, ?, ?, ?, ?, ?, ?)",
            (
                diary.trip_id, diary.date, diary.time, diary.title,
                diary.body, diary.mood, diary.photo,
            ),
        )
        conn.commit()
        row = find_diary(conn, cursor.lastrowid)
    finally:
        conn.close()
    return dict(row)


@router.put("/{diary_id}")
def update_diary(diary_id: int, diary: DiaryUpdate):
    """검사 순서: 본문 422 → 없는 id 404 → 기간 밖 422 (D-029).
    기간은 그 일기에 저장된 trip_id의 여행으로 검사한다."""
    conn = get_connection()
    try:
        saved = find_diary(conn, diary_id)
        check_in_period(conn, saved["trip_id"], diary.date)
        conn.execute(
            "UPDATE diaries SET date = ?, time = ?, title = ?, body = ?, mood = ?, photo = ?,"
            " updated_at = datetime('now', 'localtime') WHERE id = ?",
            (
                diary.date, diary.time, diary.title, diary.body,
                diary.mood, diary.photo, diary_id,
            ),
        )
        conn.commit()
        row = find_diary(conn, diary_id)
    finally:
        conn.close()
    # 바꾸거나 뺀 전 사진 파일을 지운다 (D-033).
    if saved["photo"] != diary.photo:
        delete_photo(saved["photo"])
    return dict(row)


@router.delete("/{diary_id}", status_code=204)
def delete_diary(diary_id: int):
    conn = get_connection()
    try:
        photo = find_diary(conn, diary_id)["photo"]
        conn.execute("DELETE FROM diaries WHERE id = ?", (diary_id,))
        conn.commit()
    finally:
        conn.close()
    delete_photo(photo)  # 사진 파일도 지운다 (D-033).
    return Response(status_code=204)
