# Multi-stage Dockerfile for AI Extreme Weather Tracking

# Stage 1: Build Frontend
FROM node:20-slim AS frontend-builder
WORKDIR /app/web
COPY web/package*.json ./
RUN npm install --no-audit --no-fund
COPY web/ ./
RUN npm run build

# Stage 2: Python Backend & Production Runtime
FROM python:3.12-slim
WORKDIR /app

ENV PYTHONUNBUFFERED=1 \
    DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source code & configs
COPY src/ ./src/
COPY configs/ ./configs/
COPY run.py Makefile ./

# Copy built frontend assets from stage 1
COPY --from=frontend-builder /app/web/dist ./web/dist

# Expose port
EXPOSE 8000

# Default command: generate data, preprocess, and start server
CMD ["sh", "-c", "python run.py data && python run.py preprocess && python run.py train && python run.py track && python run.py forecast && python run.py evaluate && python -m uvicorn src.api.main:app --host 0.0.0.0 --port 8000"]
