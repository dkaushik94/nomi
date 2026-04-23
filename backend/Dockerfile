FROM python:3.12-slim

WORKDIR /app

RUN pip install uv --no-cache-dir

COPY pyproject.toml .
RUN uv pip install --system -e "."

COPY alembic.ini .
COPY alembic/ ./alembic/
COPY migrate.py .
COPY app/ ./app/

CMD python migrate.py && uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}
