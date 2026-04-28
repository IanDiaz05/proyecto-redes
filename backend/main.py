from fastapi import FastAPI
import uvicorn

app = FastAPI()

@app.get("/")
def read_root():
    return {"mensaje": "¡Hola Mundo desde FastAPI en Dokploy!"}

@app.get("/api/datos")
def get_datos():
    return {"datos": ["Aún no hay datos de los agentes"]}

if __name__ == "__main__":
    # permite que el tráfico externo/Docker acceda a la API
    uvicorn.run(app, host="0.0.0.0", port=8000)