"""여행 댓글 API (담당: 팀 공동). docs/API-SPEC.md 9절, DATA-MODEL 9절, D-042.

목록은 로그인 없이 본다. 쓰기는 로그인한 회원 누구나, 지우기는 쓴 회원만 한다.
댓글을 고치는 API는 없다 (D-042).
"""

from fastapi import APIRouter, Depends, HTTPException, Response
from pydantic import BaseModel, field_validator

from database import get_connection
from routers.users import login_required

router = APIRouter(prefix="/api/comments", tags=["comments"])

NOT_FOUND = "댓글을 찾을 수 없어요"
NOT_WRITER = "내 댓글만 지울 수 있어요"

# 댓글 객체: trip_comments 칸 + 쓴 회원의 지금 닉네임·프로필사진 (API-SPEC 9절 2번)
COMMENT_SELECT = (
    "SELECT trip_comments.id, trip_comments.trip_id, trip_comments.user_id,"
    " users.nickname, users.profile_photo, trip_comments.content,"
    " trip_comments.created_at, trip_comments.updated_at"
    " FROM trip_comments JOIN users ON users.id = trip_comments.user_id"
)


class CommentIn(BaseModel):
    """POST 본문. 규칙은 API-SPEC 9절 3번."""

    trip_id: int
    content: str

    @field_validator("content")
    @classmethod
    def check_content(cls, value: str) -> str:
        # 앞뒤 공백을 빼고 1~200자. 공백만 적으면 비운 것으로 본다 (D-021, D-029).
        value = value.strip()
        if not value:
            raise ValueError("비어 있을 수 없어요")
        if len(value) > 200:
            raise ValueError("200자까지 쓸 수 있어요")
        return value


@router.get("")
def list_comments(trip_id: int):
    """여행별 댓글 목록. 먼저 쓴 것(id가 작은 것)이 앞. 없는 여행이면 []."""
    conn = get_connection()
    try:
        rows = conn.execute(
            f"{COMMENT_SELECT} WHERE trip_comments.trip_id = ? ORDER BY trip_comments.id",
            (trip_id,),
        ).fetchall()
    finally:
        conn.close()
    return [dict(row) for row in rows]


@router.post("", status_code=201)
def create_comment(body: CommentIn, user=Depends(login_required)):
    """검사 순서: 로그인 401 → 본문 422(없는 여행 포함). 주인이 아니어도 쓴다."""
    conn = get_connection()
    try:
        if conn.execute("SELECT 1 FROM trips WHERE id = ?", (body.trip_id,)).fetchone() is None:
            raise HTTPException(status_code=422, detail="없는 여행이에요")
        cursor = conn.execute(
            "INSERT INTO trip_comments (trip_id, user_id, content) VALUES (?, ?, ?)",
            (body.trip_id, user["id"], body.content),
        )
        conn.commit()
        row = conn.execute(
            f"{COMMENT_SELECT} WHERE trip_comments.id = ?", (cursor.lastrowid,)
        ).fetchone()
    finally:
        conn.close()
    return dict(row)


@router.delete("/{comment_id}", status_code=204)
def delete_comment(comment_id: int, user=Depends(login_required)):
    """검사 순서: 로그인 401 → 없는 id 404 → 쓴 회원이 아니면 403. 여행 주인도 남의 댓글은 못 지운다."""
    conn = get_connection()
    try:
        row = conn.execute(
            "SELECT user_id FROM trip_comments WHERE id = ?", (comment_id,)
        ).fetchone()
        if row is None:
            raise HTTPException(status_code=404, detail=NOT_FOUND)
        if row["user_id"] != user["id"]:
            raise HTTPException(status_code=403, detail=NOT_WRITER)
        conn.execute("DELETE FROM trip_comments WHERE id = ?", (comment_id,))
        conn.commit()
    finally:
        conn.close()
    return Response(status_code=204)
