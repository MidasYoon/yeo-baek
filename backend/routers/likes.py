"""여행 좋아요 API (담당: 팀 공동). docs/API-SPEC.md 8절, DATA-MODEL 8절, D-042.

누르기·취소 모두 200과 좋아요 상태({trip_id, like_count, liked})를 돌려준다.
이미 누른 것을 또 누르거나, 누르지 않은 것을 취소해도 오류 없이 지금 상태를 준다.
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from database import get_connection
from routers.users import login_required

router = APIRouter(prefix="/api/likes", tags=["likes"])


class LikeIn(BaseModel):
    """POST 본문."""

    trip_id: int


def check_trip(conn, trip_id: int) -> None:
    """없는 여행이면 422 (본문·쿼리의 trip_id라서, API-SPEC 1절)."""
    if conn.execute("SELECT 1 FROM trips WHERE id = ?", (trip_id,)).fetchone() is None:
        raise HTTPException(status_code=422, detail="없는 여행이에요")


def like_state(conn, trip_id: int, user_id: int) -> dict:
    like_count = conn.execute(
        "SELECT COUNT(*) FROM trip_likes WHERE trip_id = ?", (trip_id,)
    ).fetchone()[0]
    liked = conn.execute(
        "SELECT 1 FROM trip_likes WHERE trip_id = ? AND user_id = ?", (trip_id, user_id)
    ).fetchone() is not None
    return {"trip_id": trip_id, "like_count": like_count, "liked": liked}


@router.post("")
def like_trip(body: LikeIn, user=Depends(login_required)):
    """검사 순서: 로그인 401 → 본문 422(없는 여행 포함)."""
    conn = get_connection()
    try:
        check_trip(conn, body.trip_id)
        # 이미 눌렀으면 UNIQUE (trip_id, user_id)라 줄을 더하지 않는다.
        conn.execute(
            "INSERT OR IGNORE INTO trip_likes (trip_id, user_id) VALUES (?, ?)",
            (body.trip_id, user["id"]),
        )
        conn.commit()
        return like_state(conn, body.trip_id, user["id"])
    finally:
        conn.close()


@router.delete("")
def unlike_trip(trip_id: int, user=Depends(login_required)):
    """검사 순서: 로그인 401 → trip_id 422(빠짐·없는 여행)."""
    conn = get_connection()
    try:
        check_trip(conn, trip_id)
        conn.execute(
            "DELETE FROM trip_likes WHERE trip_id = ? AND user_id = ?", (trip_id, user["id"])
        )
        conn.commit()
        return like_state(conn, trip_id, user["id"])
    finally:
        conn.close()
