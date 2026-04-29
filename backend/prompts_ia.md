# 🤖 Prompts de Ayuda para Copilotos de IA (ChatGPT, Claude, Gemini)

*Copia y pega el texto debajo de las líneas directamente en tu IA de preferencia. Estos prompts ya tienen el contexto de nuestra nueva arquitectura con MariaDB.*

---
**Prompt 1: Inicializar Base de Datos MySQL/MariaDB (core/database.py)**

> Actúa como un experto en Python. Estoy creando un proyecto en FastAPI con una base de datos MariaDB/MySQL. 
> Escribe el código para el archivo `core/database.py`. Necesito que este archivo cargue las credenciales usando `python-dotenv` (variables: DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME). 
> Implementa una función generadora llamada `get_db_connection()` que utilice la librería `pymysql` para abrir una conexión a la base de datos usando un cursor de tipo `DictCursor` (para que los resultados regresen como diccionarios). Asegúrate de incluir el manejo básico de excepciones de conexión.

---
**Prompt 2: Lógica de Sockets e Inserción SQL (sockets/handlers.py)**

> Actúa como un experto en Python. En mi proyecto FastAPI tengo un archivo `sockets/handlers.py` con dos funciones que corren en hilos separados: `start_tcp_server` (puerto 12000) y `start_udp_server` (puerto 12001).
> Escribe el código de este archivo. Debe importar `get_db_connection` desde `core.database`. 
> Cuando los sockets reciban datos (texto CSV o JSON), deben decodificarlos e insertarlos usando SQL tradicional: `INSERT INTO registro_datos (origen, contenido) VALUES (%s, %s)`. 
> La columna `origen` será el string "TCP" o "UDP", y la columna `contenido` debe guardar el dato. 
> MUY IMPORTANTE: Usa la conexión a la base de datos de manera segura (`with get_db_connection() as conn:`) y añade bloques `try/except` robustos para que el hilo del socket nunca muera si falla la base de datos.

---
**Prompt 3: Endpoints, SQL y Pydantic (api/endpoints.py y models/schemas.py)**

> Actúa como un experto en FastAPI y MySQL. Necesito crear las rutas para consultar los datos de MariaDB.
> Primero, descríbeme cómo hacer un modelo de Pydantic en `models/schemas.py` para la tabla `registro_datos` (id: int, origen: str, contenido: dict o str, fecha: datetime).
> Luego, escribe el código para `api/endpoints.py`. Utiliza `APIRouter` para crear un endpoint `GET /api/v1/datos`. 
> Este endpoint debe usar `get_db_connection` desde `core.database` para ejecutar `SELECT * FROM registro_datos ORDER BY fecha DESC LIMIT 100`. 
> Transforma el resultado obtenido por pymysql en una lista de diccionarios, valídalos con el esquema de Pydantic, y devuélvelos.
> Finalmente, muéstrame cómo registrar este router en mi archivo `main.py`.