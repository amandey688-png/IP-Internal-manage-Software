FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Internal service port used by NGINX upstream
EXPOSE 8000

# One container = one backend instance.
# NGINX load-balances across multiple instances of this image.
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
