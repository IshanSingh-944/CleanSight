import os
import sqlite3
import json
import logging
from typing import Dict, Any, Optional

DB_PATH = os.environ.get("DB_PATH", "storage/cleansight.db")
STORAGE_DIR = os.environ.get("STORAGE_DIR", "storage")

os.makedirs(STORAGE_DIR, exist_ok=True)
os.makedirs(os.path.dirname(DB_PATH) if os.path.dirname(DB_PATH) else ".", exist_ok=True)

logger = logging.getLogger("cleansight.db")

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS datasets (
            dataset_id TEXT PRIMARY KEY,
            filename TEXT NOT NULL,
            file_size INTEGER NOT NULL,
            extension TEXT NOT NULL,
            row_count INTEGER NOT NULL,
            column_count INTEGER NOT NULL,
            original_path TEXT NOT NULL,
            cleaned_path TEXT,
            profile_json TEXT NOT NULL,
            recommendations_json TEXT NOT NULL,
            execution_result_json TEXT,
            status TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    conn.commit()
    conn.close()
    logger.info("Database initialized successfully at %s", DB_PATH)

init_db()
