# Multi-stage non-root Dockerfile for Gateway Service
FROM python:3.11-slim as builder

WORKDIR /build
COPY packages/shield_core /build/packages/shield_core
COPY packages/eventbus /build/packages/eventbus
COPY services/gateway /build/services/gateway

RUN pip install --no-cache-dir \
    /build/packages/shield_core \
    /build/packages/eventbus \
    /build/services/gateway

FROM python:3.11-slim as runner

WORKDIR /app
RUN addgroup --system shield && adduser --system --group shield
USER shield

COPY --from=builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin
COPY services/gateway/src /app/src

ENV PYTHONPATH=/app/src
EXPOSE 8000

CMD ["python", "-m", "uvicorn", "gateway.main:app", "--host", "0.0.0.0", "--port", "8000"]
