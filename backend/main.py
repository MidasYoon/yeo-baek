"""FastAPI 앱 만들기와 라우터 등록 (공통 파일, 담당: 건용).

실행: backend/ 안에서 uvicorn main:app --reload --port 8000 (D-024)
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from database import init_db
from routers import diaries, places, trips, uploads


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(title="여백", lifespan=lifespan)

# 라우터 등록 (trips / places / diaries)
app.include_router(trips.router)
app.include_router(places.router)
app.include_router(diaries.router)
app.include_router(uploads.router)

# 사진 보기: GET /api/uploads/{filename} (D-033). 올리기 라우터보다 뒤에 둔다.
app.mount("/api/uploads", StaticFiles(directory=uploads.UPLOAD_DIR), name="uploads")
