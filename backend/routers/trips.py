"""여행기록 API (담당: 서준). docs/API-SPEC.md 2절."""

from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Response
from pydantic import BaseModel, field_validator, model_validator

from database import get_connection
from routers.uploads import check_photo_name, delete_photo
from routers.users import current_user, login_required, require_trip_owner

router = APIRouter(prefix="/api/trips", tags=["trips"])

NOT_FOUND = "여행을 찾을 수 없어요"

# 여행 객체: trips 칸 + 주인의 지금 닉네임(user_nickname, 주인 없는 여행은 null),
# 좋아요 수(like_count), 지금 로그인한 회원이 눌렀는지(liked) (API-SPEC 2절 2번, D-042),
# 댓글 수(comment_count, D-045).
# ?에는 로그인한 회원의 id를 넣는다. 로그인하지 않았으면 None이라 liked가 0이다.
TRIP_SELECT = (
    "SELECT trips.*, users.nickname AS user_nickname,"
    " (SELECT COUNT(*) FROM trip_likes WHERE trip_likes.trip_id = trips.id) AS like_count,"
    " EXISTS (SELECT 1 FROM trip_likes"
    " WHERE trip_likes.trip_id = trips.id AND trip_likes.user_id = ?) AS liked,"
    " (SELECT COUNT(*) FROM trip_comments WHERE trip_comments.trip_id = trips.id) AS comment_count"
    " FROM trips LEFT JOIN users ON users.id = trips.user_id"
)


def user_id_of(user):
    return user["id"] if user else None


def trip_dict(row) -> dict:
    trip = dict(row)
    trip["liked"] = bool(trip["liked"])  # SQLite는 0·1로 준다
    return trip


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


def find_trip(conn, trip_id: int, user_id: int | None = None):
    row = conn.execute(f"{TRIP_SELECT} WHERE trips.id = ?", (user_id, trip_id)).fetchone()
    if row is None:
        raise HTTPException(status_code=404, detail=NOT_FOUND)
    return row


@router.get("")
def list_trips(user=Depends(current_user)):
    """여행 목록. 시작일이 늦은 것이 앞, 같으면 id가 큰 것이 앞."""
    conn = get_connection()
    try:
        rows = conn.execute(
            f"{TRIP_SELECT} ORDER BY trips.start_date DESC, trips.id DESC",
            (user_id_of(user),),
        ).fetchall()
    finally:
        conn.close()
    return [trip_dict(row) for row in rows]


@router.get("/{trip_id}")
def get_trip(trip_id: int, user=Depends(current_user)):
    conn = get_connection()
    try:
        row = find_trip(conn, trip_id, user_id_of(user))
    finally:
        conn.close()
    return trip_dict(row)


@router.post("", status_code=201)
def create_trip(trip: TripIn, user=Depends(login_required)):
    """검사 순서: 로그인 401 → 본문 422. 만든 회원이 주인이 된다 (D-042)."""
    conn = get_connection()
    try:
        cursor = conn.execute(
            "INSERT INTO trips (name, destination, start_date, end_date, info, photo, user_id)"
            " VALUES (?, ?, ?, ?, ?, ?, ?)",
            (
                trip.name, trip.destination, trip.start_date, trip.end_date,
                trip.info, trip.photo, user["id"],
            ),
        )
        conn.commit()
        row = find_trip(conn, cursor.lastrowid, user["id"])
    finally:
        conn.close()
    return trip_dict(row)


@router.put("/{trip_id}")
def update_trip(trip_id: int, trip: TripIn, user=Depends(login_required)):
    """검사 순서: 로그인 401 → 본문 422 → 없는 id 404 → 주인 403 → 기간 밖 장소·일기 409."""
    conn = get_connection()
    try:
        old_photo = find_trip(conn, trip_id)["photo"]
        require_trip_owner(conn, trip_id, user)
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
        row = find_trip(conn, trip_id, user["id"])
    finally:
        conn.close()
    # 바꾸거나 뺀 전 사진 파일을 지운다 (D-033).
    if old_photo != trip.photo:
        delete_photo(old_photo)
    return trip_dict(row)


@router.delete("/{trip_id}", status_code=204)
def delete_trip(trip_id: int, user=Depends(login_required)):
    """검사 순서: 로그인 401 → 없는 id 404 → 주인 403 → 붙은 장소·일기 409 (D-015, D-042)."""
    conn = get_connection()
    try:
        photo = find_trip(conn, trip_id)["photo"]
        require_trip_owner(conn, trip_id, user)
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
