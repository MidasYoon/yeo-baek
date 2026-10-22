"""사진 올리기 API (공통 파일, 담당: 건용). docs/API-SPEC.md 1절 "사진 올리기와 보기", D-033.

사진 보기(GET /api/uploads/{filename})는 main.py가 UPLOAD_DIR을 연결해 처리한다.
여행·장소·일기 라우터는 check_photo_name, delete_photo를 가져다 쓴다.
"""

import re
import uuid
from pathlib import Path

from fastapi import APIRouter, HTTPException, UploadFile

router = APIRouter(prefix="/api/uploads", tags=["uploads"])

UPLOAD_DIR = Path(__file__).resolve().parent.parent / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

MAX_BYTES = 5 * 1024 * 1024  # 한 장 5MB

# 확장자마다 받는 Content-Type
ALLOWED_TYPES = {
    "jpg": "image/jpeg",
    "jpeg": "image/jpeg",
    "png": "image/png",
    "webp": "image/webp",
}

# 서버가 붙인 이름 꼴: uuid 32자 + 허용 확장자
NAME_PATTERN = re.compile(r"^[0-9a-f]{32}\.(jpg|jpeg|png|webp)$")


@router.post("", status_code=201)
async def upload_photo(file: UploadFile):
    ext = Path(file.filename or "").suffix.lower().lstrip(".")
    if ALLOWED_TYPES.get(ext) != file.content_type:
        raise HTTPException(status_code=422, detail="jpg·png·webp 사진만 올릴 수 있어요")

    # 5MB를 넘는지 보려고 한 바이트 더 읽는다.
    data = await file.read(MAX_BYTES + 1)
    if len(data) > MAX_BYTES:
        raise HTTPException(status_code=422, detail="5MB 이하 사진만 올릴 수 있어요")

    filename = f"{uuid.uuid4().hex}.{ext}"
    (UPLOAD_DIR / filename).write_bytes(data)
    return {"filename": filename}


def check_photo_name(value: str) -> str:
    """본문의 사진 칸 검사. 이름 꼴이 맞고 실제로 있는 파일이어야 한다 (pydantic 검사기에서 쓴다)."""
    if not NAME_PATTERN.match(value) or not (UPLOAD_DIR / value).is_file():
        raise ValueError("올린 사진의 이름이 아니에요")
    return value


def delete_photo(filename: str | None) -> None:
    """사진 파일을 지운다. 이름이 없거나 파일이 이미 없으면 그냥 넘어간다."""
    if filename and NAME_PATTERN.match(filename):
        (UPLOAD_DIR / filename).unlink(missing_ok=True)
