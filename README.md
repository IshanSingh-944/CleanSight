# CleanSight AI

Production-ready data profiling, AI-powered planning, deterministic cleaning execution, and audit-logged export platform.

## Architecture

- **Frontend**: React, TypeScript, Tailwind CSS, Lucide icons.
- **Backend**: Python 3.11+, FastAPI, Pandas, NumPy, Pydantic, SQLite (for persistent dataset metadata and state).

## Features

1. **Dataset Ingestion & Profiling**: Secure validation of CSV, Excel (`.xlsx`, `.xls`), and JSON uploads with strict MIME type and size checks.
2. **AI Cleaning Planner**: Context-aware recommendations via OpenRouter/OpenAI LLM integration with deterministic fallback rules.
3. **Deterministic Execution Engine**: Server-side risk-classified execution of whitespace trimming, missing value imputation, duplicate removal, constant column dropping, and outlier management. Original datasets remain strictly immutable.
4. **Production Hardening (Phase 5)**:
   - SQLite metadata persistence surviving restarts.
   - Observability middleware with request correlation IDs and duration logging.
   - `/health` and `/ready` probes.
   - Comprehensive security validations against path traversal and oversized uploads.

## Setup & Environment Variables

Copy `.env.example` to `.env` in the `backend` directory and configure your keys:

```env
OPENROUTER_API_KEY=your_openrouter_api_key_here
OPENAI_API_KEY=your_openai_api_key_here
MAX_UPLOAD_SIZE_MB=50
MAX_ROWS=1000000
MAX_COLUMNS=500
STORAGE_DIR=storage
DB_PATH=storage/cleansight.db
LOG_LEVEL=INFO
```

## Running the Application

### Backend

```bash
cd backend
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
npm install
npm run dev
```

## Running Tests

```bash
cd backend
python -m pytest
```

## Supported Formats & Limitations

- **Formats**: `.csv`, `.xlsx`, `.xls`, `.json`.
- **In-Memory Limitations**: Suitable for datasets up to 1,000,000 rows and 500 columns. For distributed big data processing (multi-gigabyte files), Spark or Dask integration is recommended.
