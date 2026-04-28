# 🤖 Prompts de Ayuda para Copilotos de IA (ChatGPT, Claude, Gemini)

*Copia y pega el texto debajo de las líneas directamente en tu IA de preferencia. Estos prompts ya tienen el contexto de nuestra arquitectura.*

---
**Prompt 1: Inicializar Base de Datos (core/database.py)**

> Actúa como un experto en Python y Supabase. Estoy creando un proyecto modular en FastAPI. 
> Escribe el código para el archivo `core/database.py`. Necesito que este archivo cargue las variables de entorno usando `python-dotenv` (SUPABASE_URL y SUPABASE_KEY) e inicialice el cliente oficial de Supabase. 
> El cliente debe quedar disponible para ser importado por otros archivos de mi proyecto. Incluye manejo de errores por si las variables no existen.

---
**Prompt 2: Lógica de Sockets e Inserción (sockets/handlers.py)**

> Actúa como un experto en Python. En mi proyecto FastAPI tengo un archivo `sockets/handlers.py`. Aquí vivirán dos funciones que corren en hilos separados: `start_tcp_server` (puerto 12000) y `start_udp_server` (puerto 12001).
> Escribe el código de este archivo. Debe importar el cliente de Supabase desde `core.database`. 
> Cuando los sockets reciban datos (texto), deben decodificarlos e insertarlos en la tabla `registro_datos` de Supabase. La tabla tiene las columnas: `origen` ("TCP" o "UDP") y `contenido` (JSONB). 
> Añade bloques `try/except` robustos para que el hilo del socket nunca muera si falla una inserción en la base de datos.

---
**Prompt 3: Endpoints y Pydantic (api/endpoints.py y models/schemas.py)**

> Actúa como un experto en FastAPI. Necesito crear las rutas para consultar los datos que mi base de datos Supabase ya recopiló.
> Primero, descríbeme cómo hacer un modelo de Pydantic en `models/schemas.py` para la tabla `registro_datos` (id: int, origen: str, contenido: dict, fecha: datetime).
> Luego, escribe el código para `api/endpoints.py`. Utiliza `APIRouter` para crear un endpoint `GET /api/v1/datos`. Este endpoint debe usar el cliente de Supabase (desde `core.database`) para traer los últimos 100 registros ordenados por fecha descendente y devolverlos validados con el esquema de Pydantic.
> Finalmente, muéstrame cómo registrar este router en mi `main.py`.