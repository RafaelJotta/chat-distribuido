FROM python:3.9-slim
WORKDIR /app
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 18081
CMD ["uvicorn", "mensagens_main:app", "--host", "0.0.0.0", "--port", "18081"]