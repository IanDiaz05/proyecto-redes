FROM python:3.11-slim

WORKDIR /app

# Instalar dependencias
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar el código
COPY . .

# Exponer puertos: 8000 (API), 12000 (TCP), 12001 (UDP)
EXPOSE 8000 12000 12001/udp

# Comando para ejecutar (Asegúrate que main.py inicie FastAPI y los hilos)
CMD ["python", "main.py"]
