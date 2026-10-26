# CleanSight AI Backend

This is the production-ready FastAPI backend for CleanSight AI.

## Requirements

- Python 3.11+
- FastAPI, Uvicorn, Pandas, NumPy, Pydantic, OpenPyXL

## Production Startup Command

To run the backend in production mode:

```bash
uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

## Environment Variables

- `PORT`: Port number (default: 8000)
- `OPENROUTER_API_KEY`: API key for LLM planning
- `OPENAI_API_KEY`: Fallback OpenAI API key
- `MAX_UPLOAD_SIZE_MB`: Max upload file size in MB (default: 50)
- `MAX_ROWS`: Maximum dataset row limit (default: 1,000,000)
- `MAX_COLUMNS`: Maximum dataset column limit (default: 500)
- `STORAGE_DIR`: Directory for dataset files (default: `storage`)
- `DB_PATH`: SQLite database path (default: `storage/cleansight.db`)
- `LOG_LEVEL`: Logging verbosity (`INFO`, `DEBUG`, `ERROR`)
