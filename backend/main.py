import os
import threading
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sockets.handlers import start_tcp_server, start_udp_server
from api.endpoints import router as api_router
from dotenv import load_dotenv

load_dotenv() # Cargar variables de entorno

app = FastAPI(title="Data Warehouse API")

# ==========================================
# CONFIGURACIÓN CORS (Crucial para React)
# ==========================================
origins_raw = os.getenv("CORS_ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:5173")
allowed_origins = [origin.strip() for origin in origins_raw.split(",")]
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins, 
    allow_credentials=True,
    allow_methods=["GET"],
    allow_headers=["*"],
)

# ==========================================
# RUTAS DE LA API
# ==========================================
app.include_router(api_router, prefix="/api/v1")

@app.get("/")
def root():
    return {"status": "ok", "mensaje": "Data Warehouse API y Sockets en línea"}

# ==========================================
# INICIO DE PROCESOS
# ==========================================
if __name__ == "__main__":
    # Iniciar sockets en hilos paralelos
    threading.Thread(target=start_tcp_server, daemon=True).start()
    threading.Thread(target=start_udp_server, daemon=True).start()
    
    # Iniciar API
    uvicorn.run(app, host="0.0.0.0", port=8000)