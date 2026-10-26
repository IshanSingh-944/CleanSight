import logging
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .api.routes import datasets, recommendations, planning, execution, chat
from .services.middleware import ObservabilityMiddleware
from .services.db import get_db_connection

log_level = os.environ.get("LOG_LEVEL", "INFO").upper()
logging.basicConfig(level=getattr(logging, log_level, logging.INFO), format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("cleansight")

app = FastAPI(title="CleanSight AI API", version="3.1.0")

app.add_middleware(ObservabilityMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(datasets.router, prefix="/api")
app.include_router(recommendations.router, prefix="/api")
app.include_router(planning.router, prefix="/api")
app.include_router(execution.router, prefix="/api")
app.include_router(chat.router, prefix="/api")

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "CleanSight AI Backend"}

@app.get("/ready")
async def readiness_check():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT 1")
        cursor.fetchone()
        conn.close()
        return {"status": "ready", "database": "connected"}
    except Exception as e:
        logger.error("Readiness check failed: %s", str(e))
        return {"status": "not_ready", "error": "Database connection failed"}, 503

