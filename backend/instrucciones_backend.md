# 🎯 Objetivos de Desarrollo: Arquitectura Backend Modular

¡Hola! Para mantener el código limpio y profesional, hemos dividido el backend en módulos. Tu objetivo es construir cada pieza de esta arquitectura paso a paso.

## 📦 Estructura que debes crear:
Dentro de esta carpeta `backend`, crea las siguientes subcarpetas y archivos:
* `/core/database.py`
* `/sockets/handlers.py`
* `/models/schemas.py`
* `/api/endpoints.py`

## Meta 1: Conexión y Modelos (`core` y `models`)
1. **En `database.py`:** Configura el cliente de Supabase. Usa la librería `python-dotenv` para cargar `SUPABASE_URL` y `SUPABASE_KEY` desde un archivo `.env` local (¡no subas el .env a git!).
2. **En `schemas.py`:** Crea un modelo de Pydantic llamado `RegistroDatosResponse` que defina los campos de nuestra tabla (id, origen, contenido, fecha). Esto le servirá a FastAPI para la documentación automática.

## Meta 2: Aislamiento de Sockets (`sockets`)
1. Mueve las funciones `start_tcp_server` y `start_udp_server` que estaban en `main.py` hacia `handlers.py`.
2. Dentro de esas funciones, importa el cliente de Supabase de tu módulo `core/database.py`.
3. Escribe la lógica para que, al recibir un string por el socket, lo decodifique e inserte en la tabla `registro_datos` de Supabase.

## Meta 3: API RESTful (`api` y `main.py`)
1. **En `endpoints.py`:** Usa `APIRouter` de FastAPI para crear dos rutas:
   * `GET /api/v1/datos`: Hace un `.select("*")` a Supabase y devuelve los últimos 100 registros.
   * `GET /api/v1/stats`: (Opcional pero recomendado) Devuelve un conteo de cuántos mensajes son TCP y cuántos UDP.
2. **En `main.py`:** Este archivo debe quedar muy limpio. Solo debe inicializar `app = FastAPI()`, hacer un `app.include_router()` para cargar tus endpoints, e iniciar los hilos de tus sockets.