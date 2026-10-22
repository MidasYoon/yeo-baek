"""여행지 정보 API (담당: 은희). docs/API-SPEC.md 3절."""

from fastapi import APIRouter

from database import get_connection

router = APIRouter(prefix="/api/places", tags=["places"])


@router.get("")
def list_places(trip_id: int):
    """여행별 장소 목록. 방문 날짜가 오래된 것이 앞, 같으면 id가 작은 것이 앞."""
    conn = get_connection()
    try:
        rows = conn.execute(
            "SELECT * FROM places WHERE trip_id = ? ORDER BY visit_date ASC, id ASC",
            (trip_id,),
        ).fetchall()
    finally:
        conn.close()
    return [dict(row) for row in rows]
