from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.auth_middleware import get_current_user
from app.models import User
from app.schemas import ChatRequest
from app.services.ai_service import stream_chat

router = APIRouter(prefix="/ai", tags=["ai"])


@router.post("/chat")
async def chat(
    body: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    messages = [{"role": m.role, "content": m.content} for m in body.messages]

    return StreamingResponse(
        stream_chat(db, current_user.id, messages),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",   # disables nginx buffering
        },
    )
