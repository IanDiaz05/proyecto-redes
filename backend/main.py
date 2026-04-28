from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def read_root():
    return {"mensaje": "¡Hola Mundo desde FastAPI en Dokploy!"}

@app.get("/api/datos")
def get_datos():
    return {"datos": ["Aún no hay datos de los agentes"]}