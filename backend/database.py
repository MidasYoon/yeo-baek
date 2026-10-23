"""SQLite 연결과 테이블 만들기 (공통 파일, 담당: 건용).

테이블 구조는 docs/DATA-MODEL.md 2~9절을 따른다. 바꿀 때는 팀이 합의한다.
"""

import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).resolve().parent / "yeoback.db"

# users를 먼저, 그다음 trips를 만든다. trips·sessions가 users(id)를, places·diaries가 trips(id)를,
# place_photos가 places(id)를 가리키기 때문이다.
SCHEMA = [
    # users (담당: 팀 공동) — DATA-MODEL 6절, D-042
    """
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY,
        login_id TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        nickname TEXT NOT NULL,
        profile_photo TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
    )
    """,
    # sessions (담당: 팀 공동) — DATA-MODEL 7절, D-042
    """
    CREATE TABLE IF NOT EXISTS sessions (
        id INTEGER PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        token TEXT NOT NULL UNIQUE,
        expires_at TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
    )
    """,
    # trips (담당: 서준) — DATA-MODEL 2절
    """
    CREATE TABLE IF NOT EXISTS trips (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        destination TEXT NOT NULL,
        start_date TEXT NOT NULL,
        end_date TEXT NOT NULL,
        info TEXT,
        photo TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
    )
    """,
    # places (담당: 은희) — DATA-MODEL 3절
    """
    CREATE TABLE IF NOT EXISTS places (
        id INTEGER PRIMARY KEY,
        trip_id INTEGER NOT NULL REFERENCES trips(id) ON DELETE RESTRICT,
        region TEXT NOT NULL,
        name TEXT NOT NULL,
        visit_date TEXT NOT NULL,
        memo TEXT,
        lat REAL,
        lng REAL,
        kakao_place_id TEXT,
        rating INTEGER,
        created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
    )
    """,
    # diaries (담당: 건용) — DATA-MODEL 4절
    """
    CREATE TABLE IF NOT EXISTS diaries (
        id INTEGER PRIMARY KEY,
        trip_id INTEGER NOT NULL REFERENCES trips(id) ON DELETE RESTRICT,
        date TEXT NOT NULL,
        time TEXT NOT NULL,
        title TEXT NOT NULL,
        body TEXT,
        mood TEXT NOT NULL,
        photo TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
    )
    """,
    # place_photos (담당: 은희) — DATA-MODEL 5절, D-033
    """
    CREATE TABLE IF NOT EXISTS place_photos (
        id INTEGER PRIMARY KEY,
        place_id INTEGER NOT NULL REFERENCES places(id) ON DELETE CASCADE,
        filename TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
    )
    """,
    # trip_likes (담당: 팀 공동) — DATA-MODEL 8절, D-042. 여행을 지우면 함께 지운다
    """
    CREATE TABLE IF NOT EXISTS trip_likes (
        id INTEGER PRIMARY KEY,
        trip_id INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id),
        created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
        UNIQUE (trip_id, user_id)
    )
    """,
]

# 나중에 더한 칸 (테이블, 칸, 타입). 이미 있는 DB에는 CREATE TABLE IF NOT EXISTS가 칸을 더하지 않으므로
# 시작할 때 없는 칸만 ALTER TABLE로 더한다. 넣어 둔 데이터는 그대로이고 새 칸은 NULL이다.
ADDED_COLUMNS = [
    # places 좌표와 카카오 장소 id (담당: 은희) — DATA-MODEL 3절, D-036
    ("places", "lat", "REAL"),
    ("places", "lng", "REAL"),
    ("places", "kakao_place_id", "TEXT"),
    # trips 주인 (담당: 팀 공동) — DATA-MODEL 2절, D-042. ALTER로 더하므로 NOT NULL을 붙이지 않는다.
    ("trips", "user_id", "INTEGER REFERENCES users(id)"),
    # places 별점 1~5 (담당: 은희) — DATA-MODEL 3절, D-043. 필수는 서버(routers/places.py)가 지킨다
    ("places", "rating", "INTEGER"),
]


def get_connection():
    """DB 연결을 연다. 연결마다 외래 키 검사를 켠다 (D-015)."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def assign_ownerless_trips(conn):
    """주인이 없는 여행을 처음 가입한 회원(id가 가장 작은 회원)에게 붙인다 (DATA-MODEL 1절, D-042).

    회원이 없으면 아무것도 하지 않는다. 커밋은 부른 쪽이 한다.
    """
    conn.execute(
        "UPDATE trips SET user_id = (SELECT MIN(id) FROM users)"
        " WHERE user_id IS NULL AND EXISTS (SELECT 1 FROM users)"
    )


def init_db():
    """테이블이 없으면 만든다. 이미 있으면 그대로 두고, 빠진 칸(ADDED_COLUMNS)만 더한다."""
    conn = get_connection()
    try:
        for statement in SCHEMA:
            conn.execute(statement)
        for table, column, column_type in ADDED_COLUMNS:
            existing = {row["name"] for row in conn.execute(f"PRAGMA table_info({table})")}
            if column not in existing:
                conn.execute(f"ALTER TABLE {table} ADD COLUMN {column} {column_type}")
        # 권한 검사(PLAN P-73) 전에 로그인 없이 만든 여행도 주인을 갖게 켤 때마다 붙인다.
        assign_ownerless_trips(conn)
        conn.commit()
    finally:
        conn.close()
