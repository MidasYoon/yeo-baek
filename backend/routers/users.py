"""회원 API (담당: 팀 공동). docs/API-SPEC.md 1절 "로그인"·7절, DATA-MODEL 6·7절, D-042.

로그인한 회원은 쿠키(yeoback_session)의 토큰으로 sessions 테이블에서 찾는다.
다른 라우터는 current_user(로그인 안 했으면 None), login_required(안 했으면 401),
require_trip_owner(여행 주인이 아니면 403)를 가져다 쓴다.
비밀번호·password_hash·토큰은 응답과 로그에 넣지 않는다.
"""

import re
import secrets
import sqlite3
from typing import Annotated

import bcrypt
from fastapi import APIRouter, Cookie, Depends, HTTPException, Response
from pydantic import AfterValidator, BaseModel, field_validator, model_validator

from database import assign_ownerless_trips, get_connection
from routers.uploads import check_photo_name, delete_photo

router = APIRouter(prefix="/api/users", tags=["users"])

COOKIE_NAME = "yeoback_session"
SESSION_SECONDS = 7 * 24 * 60 * 60  # 로그인 유지 7일 (AI 제안)

LOGIN_REQUIRED = "로그인이 필요해요"
LOGIN_FAILED = "아이디 또는 비밀번호가 맞지 않아요"
LOGIN_ID_TAKEN = "이미 쓰는 아이디예요"
WRONG_PASSWORD = "지금 비밀번호가 맞지 않아요"
NOT_OWNER = "내 여행만 고칠 수 있어요"

# 아이디: 영문 소문자·숫자·_ 4~20자. 비밀번호: 공백을 뺀 ASCII(! ~ ~) 8~20자라 bcrypt 72바이트를 넘지 않는다.
LOGIN_ID_PATTERN = re.compile(r"[a-z0-9_]{4,20}")
PASSWORD_PATTERN = re.compile(r"[!-~]{8,20}")

# 응답에 넣는 칸. password_hash는 넣지 않는다.
USER_FIELDS = "id, login_id, nickname, profile_photo, created_at, updated_at"


def check_nickname(value: str) -> str:
    # 앞뒤 공백을 빼고 2~10자. 공백만 적으면 비운 것으로 본다 (D-021).
    value = value.strip()
    if not 2 <= len(value) <= 10:
        raise ValueError("닉네임은 2~10자여야 해요")
    return value


def check_password(value: str) -> str:
    if not PASSWORD_PATTERN.fullmatch(value):
        raise ValueError("비밀번호는 영문·숫자·기호 8~20자여야 해요")
    return value


def check_profile_photo(value: str | None) -> str | None:
    # POST /api/uploads가 돌려준 이름이어야 한다 (API-SPEC 1절).
    if value is None:
        return None
    return check_photo_name(value)


Password = Annotated[str, AfterValidator(check_password)]
Nickname = Annotated[str, AfterValidator(check_nickname)]
ProfilePhoto = Annotated[str | None, AfterValidator(check_profile_photo)]


class SignupIn(BaseModel):
    """POST /api/users 본문. 규칙은 API-SPEC 7절 3번."""

    login_id: str
    password: Password
    nickname: Nickname
    profile_photo: ProfilePhoto = None

    @field_validator("login_id")
    @classmethod
    def check_login_id(cls, value: str) -> str:
        # 앞뒤 공백을 빼지 않는다. 공백이 있으면 꼴이 틀린 것이다.
        if not LOGIN_ID_PATTERN.fullmatch(value):
            raise ValueError("아이디는 영문 소문자·숫자·_ 4~20자여야 해요")
        return value


class LoginIn(BaseModel):
    """POST /api/users/login 본문. 꼴은 검사하지 않고, 틀리면 401이다."""

    login_id: str
    password: str


class UserUpdateIn(BaseModel):
    """PUT /api/users/me 본문. 폼의 값 전체를 보낸다 (D-018). login_id는 받지 않는다."""

    nickname: Nickname
    profile_photo: ProfilePhoto = None
    current_password: str | None = None
    new_password: Password | None = None

    @model_validator(mode="after")
    def check_current_password(self):
        # 비밀번호를 바꿀 때는 지금 비밀번호가 있어야 한다.
        if self.new_password is not None and not self.current_password:
            raise ValueError("새 비밀번호를 쓰려면 지금 비밀번호가 필요해요")
        return self


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("ascii")


def password_matches(password: str, password_hash: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("ascii"))
    except ValueError:
        # 72바이트를 넘는 비밀번호 등. 가입 규칙상 맞을 수 없으므로 틀린 것으로 본다.
        return False


def find_user(conn, user_id: int):
    return conn.execute(f"SELECT {USER_FIELDS} FROM users WHERE id = ?", (user_id,)).fetchone()


def find_session_user(conn, token: str | None):
    """토큰의 회원을 찾는다. 없거나 지난 세션이면 None이고, 지난 세션 줄은 지운다."""
    if not token:
        return None
    row = conn.execute(
        "SELECT user_id, expires_at <= datetime('now', 'localtime') AS expired"
        " FROM sessions WHERE token = ?",
        (token,),
    ).fetchone()
    if row is None:
        return None
    if row["expired"]:
        conn.execute("DELETE FROM sessions WHERE token = ?", (token,))
        conn.commit()
        return None
    return find_user(conn, row["user_id"])


def start_session(conn, response: Response, user_id: int, old_token: str | None) -> None:
    """세션을 만들고 쿠키를 준다. 이 브라우저의 전 세션이 있으면 지운다. 커밋은 부른 쪽이 한다."""
    if old_token:
        conn.execute("DELETE FROM sessions WHERE token = ?", (old_token,))
    token = secrets.token_urlsafe(32)
    conn.execute(
        "INSERT INTO sessions (user_id, token, expires_at)"
        " VALUES (?, ?, datetime('now', 'localtime', '+7 days'))",
        (user_id, token),
    )
    response.set_cookie(
        COOKIE_NAME, token, max_age=SESSION_SECONDS, path="/", httponly=True, samesite="lax"
    )


def session_token(token: str | None = Cookie(default=None, alias=COOKIE_NAME)) -> str | None:
    return token


def current_user(token: str | None = Depends(session_token)):
    """로그인한 회원(sqlite3.Row) 또는 None. 다른 라우터도 Depends로 쓴다."""
    conn = get_connection()
    try:
        return find_session_user(conn, token)
    finally:
        conn.close()


def login_required(user=Depends(current_user)):
    """로그인한 회원. 안 했으면 401 (본문 422보다 먼저, API-SPEC 1절 "로그인")."""
    if user is None:
        raise HTTPException(status_code=401, detail=LOGIN_REQUIRED)
    return user


def require_trip_owner(conn, trip_id: int, user) -> None:
    """그 여행의 주인인지 본다 (D-042). 장소·일기는 여행의 주인을 따른다.

    없는 여행이면 422(본문의 trip_id라서, API-SPEC 1절), 주인이 아니거나 주인 없는 여행이면 403.
    여행 주소의 {id}로 부를 때는 부르기 전에 없는 여행 404를 먼저 본다.
    """
    row = conn.execute("SELECT user_id FROM trips WHERE id = ?", (trip_id,)).fetchone()
    if row is None:
        raise HTTPException(status_code=422, detail="없는 여행이에요")
    if row["user_id"] is None or row["user_id"] != user["id"]:
        raise HTTPException(status_code=403, detail=NOT_OWNER)


@router.post("", status_code=201)
def signup(body: SignupIn, response: Response, token: str | None = Depends(session_token)):
    """회원가입. 검사 순서: 본문 422 → 아이디 겹침 409. 성공하면 바로 로그인된다."""
    conn = get_connection()
    try:
        try:
            cursor = conn.execute(
                "INSERT INTO users (login_id, password_hash, nickname, profile_photo)"
                " VALUES (?, ?, ?, ?)",
                (body.login_id, hash_password(body.password), body.nickname, body.profile_photo),
            )
        except sqlite3.IntegrityError:
            raise HTTPException(status_code=409, detail=LOGIN_ID_TAKEN)
        user_id = cursor.lastrowid
        # 주인 없는 여행을 처음 가입한 회원에게 붙인다 (같은 트랜잭션, D-042).
        assign_ownerless_trips(conn)
        start_session(conn, response, user_id, token)
        conn.commit()
        row = find_user(conn, user_id)
    finally:
        conn.close()
    return dict(row)


@router.post("/login")
def login(body: LoginIn, response: Response, token: str | None = Depends(session_token)):
    """로그인. 아이디가 없거나 비밀번호가 틀리면 똑같이 401."""
    conn = get_connection()
    try:
        row = conn.execute(
            "SELECT id, password_hash FROM users WHERE login_id = ?", (body.login_id,)
        ).fetchone()
        if row is None or not password_matches(body.password, row["password_hash"]):
            raise HTTPException(status_code=401, detail=LOGIN_FAILED)
        start_session(conn, response, row["id"], token)
        conn.commit()
        user = find_user(conn, row["id"])
    finally:
        conn.close()
    return dict(user)


@router.post("/logout", status_code=204)
def logout(token: str | None = Depends(session_token)):
    """로그아웃. 로그인하지 않았어도 204."""
    if token:
        conn = get_connection()
        try:
            conn.execute("DELETE FROM sessions WHERE token = ?", (token,))
            conn.commit()
        finally:
            conn.close()
    response = Response(status_code=204)
    response.delete_cookie(COOKIE_NAME, path="/", httponly=True, samesite="lax")
    return response


@router.get("/me")
def get_me(user=Depends(current_user)):
    """지금 로그인한 회원. 로그인하지 않았으면 null (401이 아님)."""
    return dict(user) if user is not None else None


@router.put("/me")
def update_me(
    body: UserUpdateIn,
    user=Depends(login_required),
    token: str | None = Depends(session_token),
):
    """회원정보수정. 검사 순서: 로그인 401 → 본문 422 → 지금 비밀번호 403."""
    conn = get_connection()
    try:
        if body.new_password is not None:
            password_hash = conn.execute(
                "SELECT password_hash FROM users WHERE id = ?", (user["id"],)
            ).fetchone()["password_hash"]
            if not password_matches(body.current_password, password_hash):
                raise HTTPException(status_code=403, detail=WRONG_PASSWORD)
            conn.execute(
                "UPDATE users SET password_hash = ? WHERE id = ?",
                (hash_password(body.new_password), user["id"]),
            )
            # 다른 브라우저의 로그인은 풀고, 지금 세션은 남긴다 (DATA-MODEL 7절).
            conn.execute(
                "DELETE FROM sessions WHERE user_id = ? AND token != ?", (user["id"], token)
            )
        conn.execute(
            "UPDATE users SET nickname = ?, profile_photo = ?,"
            " updated_at = datetime('now', 'localtime') WHERE id = ?",
            (body.nickname, body.profile_photo, user["id"]),
        )
        conn.commit()
        row = find_user(conn, user["id"])
    finally:
        conn.close()
    # 바꾸거나 뺀 전 프로필사진 파일을 지운다 (D-033).
    if user["profile_photo"] != body.profile_photo:
        delete_photo(user["profile_photo"])
    return dict(row)
