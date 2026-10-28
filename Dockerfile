# Build frontend stage
FROM node:20-slim AS frontend-build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install
COPY . .
RUN npm run build

# Production runtime stage
FROM python:3.11-slim
WORKDIR /app

# Install system dependencies if needed
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install python requirements
COPY backend/requirements.txt ./backend/
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r backend/requirements.txt

# Copy backend application code
COPY backend/ ./backend/

# Copy built frontend assets from stage 1 into backend static directory or app root
COPY --from=frontend-build /app/dist ./frontend_dist

# Create storage directory for SQLite DB and files
RUN mkdir -p /app/backend/storage

ENV STORAGE_DIR=/app/backend/storage
ENV DB_PATH=/app/backend/storage/cleansight.db
ENV PYTHONUNBUFFERED=1

EXPOSE 8000

# Run FastAPI via Uvicorn (Render sets $PORT dynamically)
CMD ["sh", "-c", "uvicorn backend.app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
