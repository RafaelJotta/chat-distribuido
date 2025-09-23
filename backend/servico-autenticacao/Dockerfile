FROM python:3.9-slim

# Instala o 'curl' para o healthcheck do Docker Compose
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
COPY . .

EXPOSE 18080
CMD ["uvicorn", "autenticacao_main:app", "--host", "0.0.0.0", "--port", "18080"]