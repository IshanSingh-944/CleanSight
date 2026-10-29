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
    
    # Users table for authenticated accounts
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            user_id TEXT PRIMARY KEY,
            email TEXT UNIQUE NOT NULL,
            hashed_password TEXT NOT NULL,
            full_name TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Datasets table supporting guest (user_id IS NULL) and user-owned persistence
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS datasets (
            dataset_id TEXT PRIMARY KEY,
            user_id TEXT,
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
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (user_id)
        )
    ''')
    
    # Cleaning executions audit log table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS cleaning_executions (
            execution_id TEXT PRIMARY KEY,
            dataset_id TEXT NOT NULL,
            user_id TEXT,
            audit_log_json TEXT NOT NULL,
            metrics_json TEXT NOT NULL,
            cleaned_path TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (dataset_id) REFERENCES datasets (dataset_id)
        )
    ''')
    
    conn.commit()
    conn.close()
    logger.info("Database initialized successfully with multi-user schema at %s", DB_PATH)

init_db()
