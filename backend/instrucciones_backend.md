# 🎯 Objetivos de Desarrollo: Arquitectura Backend Modular (MariaDB)

¡Hola! Para mantener el código limpio y profesional, hemos dividido el backend en módulos. Ahora nos conectaremos a una base de datos **MariaDB (MySQL)** alojada en nuestro propio servidor, utilizando SQL tradicional.

## 📦 Estructura que debes crear:
Dentro de esta carpeta `backend`, crea las siguientes subcarpetas y archivos:
* `/core/database.py`
* `/sockets/handlers.py`
* `/models/schemas.py`
* `/api/endpoints.py`

## Meta 1: Conexión y Modelos (`core` y `models`)
1. **En `database.py`:** Configura la conexión a la base de datos usando la librería `pymysql`. Usa `python-dotenv` para cargar las variables desde un archivo `.env` local (`DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`). 
   * *Nota para tu entorno local:* Pide a Ian las credenciales de la base de datos `dw_dev` y el puerto externo para que pruebes desde tu computadora.
2. **En `schemas.py`:** Crea un modelo de Pydantic llamado `RegistroDatosResponse` que defina los campos de nuestra tabla (id, origen, contenido, fecha). Esto le servirá a FastAPI para la documentación.

## Meta 2: Aislamiento de Sockets (`sockets`)
1. Mueve las funciones `start_tcp_server` y `start_udp_server` que estaban en `main.py` hacia `handlers.py`.
2. Dentro de esas funciones, importa tu conexión de base de datos desde `core/database.py`.
3. Escribe la lógica para que, al recibir un string por el socket, lo decodifique y ejecute un `INSERT INTO registro_datos` en MariaDB usando `pymysql`. (Asegúrate de guardar el 'contenido' como un formato JSON válido).

## Meta 3: API RESTful (`api` y `main.py`)
1. **En `endpoints.py`:** Usa `APIRouter` de FastAPI para crear dos rutas:
   * `GET /api/v1/datos`: Ejecuta un `SELECT * FROM registro_datos ORDER BY fecha DESC LIMIT 100`, convierte los resultados a diccionarios y devuélvelos.
   * `GET /api/v1/stats`: (Opcional) Ejecuta una consulta con `COUNT()` agrupada por la columna `origen` para saber cuántos mensajes TCP y UDP tenemos.
2. **En `main.py`:** Este archivo debe quedar muy limpio. Solo debe inicializar `app = FastAPI()`, hacer un `app.include_router()` para cargar tus endpoints, e iniciar los hilos de tus sockets.