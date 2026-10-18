# Multi-stage non-root Dockerfile for Decision Service
FROM python:3.11-slim as builder

WORKDIR /build
COPY packages/shield_core /build/packages/shield_core
COPY detectors/rules /build/detectors/rules
COPY detectors/pii /build/detectors/pii
COPY detectors/honey /build/detectors/honey
COPY services/decision /build/services/decision

RUN pip install --no-cache-dir \
    /build/packages/shield_core \
    /build/detectors/rules \
    /build/detectors/pii \
    /build/detectors/honey \
    /build/services/decision

FROM python:3.11-slim as runner

WORKDIR /app
RUN addgroup --system shield && adduser --system --group shield
USER shield

COPY --from=builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin
COPY services/decision/src /app/src

ENV PYTHONPATH=/app/src
EXPOSE 8001

CMD ["python", "-m", "uvicorn", "decision.main:app", "--host", "0.0.0.0", "--port", "8001"]
