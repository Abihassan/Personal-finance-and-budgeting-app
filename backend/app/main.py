import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from app.config import get_settings
from app.database import create_all_tables

# Import routers individually — never via __init__ to avoid circular imports
from app.routers.auth         import router as auth_router
from app.routers.accounts     import router as accounts_router
from app.routers.transactions import router as transactions_router
from app.routers.budgets      import router as budgets_router
from app.routers.investments  import router as investments_router
from app.routers.reports      import router as reports_router
from app.routers.ai           import router as ai_router

settings = get_settings()
logger   = logging.getLogger("sequro")
logging.basicConfig(level=logging.INFO, format="%(levelname)s │ %(name)s │ %(message)s")

limiter = Limiter(key_func=get_remote_address)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("🚀  Starting Sequro API ...")
    await create_all_tables()
    logger.info("✅  Database tables ready")
    yield
    logger.info("🛑  Sequro API shutting down")


app = FastAPI(
    title="Sequro API",
    description="Personal finance backend — Groq-powered AI, accounts, transactions, budgets, investments",
    version="1.0.0",
    lifespan=lifespan,
)

# ─── Rate limiter ─────────────────────────────────────────────────────────────
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ─── CORS ─────────────────────────────────────────────────────────────────────
# "*" is required for Expo Go on physical devices.
# In production lock this to your specific domain.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8080",
        "https://personal-finance-and-budgeting-app.vercel.app/.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Routers ──────────────────────────────────────────────────────────────────
PREFIX = "/api"
app.include_router(auth_router,         prefix=PREFIX)
app.include_router(accounts_router,     prefix=PREFIX)
app.include_router(transactions_router, prefix=PREFIX)
app.include_router(budgets_router,      prefix=PREFIX)
app.include_router(investments_router,  prefix=PREFIX)
app.include_router(reports_router,      prefix=PREFIX)
app.include_router(ai_router,           prefix=PREFIX)

# ─── Health check ─────────────────────────────────────────────────────────────
@app.get("/api/health", tags=["health"])
async def health():
    return {"status": "ok", "service": "sequro-api", "version": "1.0.0"}


# ─── Global unhandled error handler ───────────────────────────────────────────
# HTTPException is handled natively by FastAPI — this only catches truly
# unexpected exceptions so they get logged and return a helpful message.
@app.exception_handler(Exception)
async def global_error(request: Request, exc: Exception):
    logger.exception("Unhandled error on %s %s → %s", request.method, request.url.path, exc)
    return JSONResponse(
        status_code=500,
        content={"detail": f"Internal server error: {type(exc).__name__}: {exc}"},
    )
