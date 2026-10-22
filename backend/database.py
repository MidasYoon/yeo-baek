"""SQLite 연결과 테이블 만들기 (공통 파일, 담당: 건용).

테이블 구조는 docs/DATA-MODEL.md 2~5절을 따른다. 바꿀 때는 팀이 합의한다.
"""

import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).resolve().parent / "yeoback.db"

# trips를 먼저 만든다. places·diaries가 trips(id)를, place_photos가 places(id)를 가리키기 때문이다.
SCHEMA = [
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
]


def get_connection():
    """DB 연결을 연다. 연결마다 외래 키 검사를 켠다 (D-015)."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_db():
    """테이블이 없으면 만든다. 이미 있으면 그대로 둔다."""
    conn = get_connection()
    try:
        for statement in SCHEMA:
            conn.execute(statement)
        conn.commit()
    finally:
        conn.close()
