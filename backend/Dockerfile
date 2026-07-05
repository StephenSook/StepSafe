FROM python:3.11-slim AS base

WORKDIR /app

RUN apt-get update && \
    apt-get install -y --no-install-recommends libgl1 libglib2.0-0 && \
    rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Model weights are gitignored; fetch them from the public repo history at build time.
ADD https://github.com/StephenSook/StepSafe/raw/1ab06e4f9b8dfd1460d3082bbcb26ed0f0f08fb3/stepsafe_model.h5 ml_model/stepsafe_model.h5

RUN addgroup --system appgroup && \
    adduser --system --ingroup appgroup appuser && \
    chown -R appuser:appgroup /app

USER appuser

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/docs')" || exit 1

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
