"""여행 다이어리 API (담당: 건용). docs/API-SPEC.md 4절."""

from fastapi import APIRouter

from database import get_connection

router = APIRouter(prefix="/api/diaries", tags=["diaries"])


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
