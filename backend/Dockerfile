FROM python:3.14-slim
WORKDIR /app

# Instalar dependencias
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar el código del backend
COPY . .

# Exponemos el puerto de la API y los de los Sockets
EXPOSE 8000 12000 12001/udp

CMD ["python", "main.py"]