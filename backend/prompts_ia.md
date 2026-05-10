### Maestro para Generación de Endpoints

> **Contexto:**
> Actúa como un experto en SQL y Python (FastAPI). Estoy trabajando en el backend de un Data Warehouse y mi rol es escribir los endpoints (rutas) de consulta (`SELECT`) que consumirá el frontend (React) para mostrar gráficas y KPIs.
> Mi nivel técnico se enfoca principalmente en SQL puro y análisis de datos, por lo que necesito que generes el código Python necesario para exponer estas consultas mediante FastAPI usando la librería `pymysql`.
> **Estructura del Archivo Destino (`api/endpoints.py`):**
> Ya tengo un archivo base configurado que utiliza un router y una dependencia de seguridad (API Key). Todo código nuevo que generes debe encajar en esta estructura:
> ```python
> from fastapi import APIRouter, HTTPException, Security
> from core.database import get_db_connection
> # (Asume que 'validar_token' ya está importado o definido en el archivo)
> router = APIRouter()
> 
> @router.get("/mi-nuevo-endpoint")
> def nombre_de_funcion(token: str = Security(validar_token)):
>     try:
>         conn = get_db_connection()
>         with conn.cursor() as cursor:
>             # AQUÍ VA EL CÓDIGO SQL Y LA EJECUCIÓN
>             sql = "SELECT ..."
>             cursor.execute(sql)
>             resultados = cursor.fetchall()
>         conn.close()
>         return {"status": "ok", "data": resultados}
>     except Exception as e:
>         raise HTTPException(status_code=500, detail=f"Error en BD: {str(e)}")
> 
> ```
> 
> 
> **El Esquema de la Base de Datos:**
> *(Pega aquí el código SQL con todos los `CREATE TABLE` del Data Warehouse)*
> **Tu Tarea:**
> 1. Analiza el esquema de la base de datos que te proporcioné.
> 2. Genera el código completo para **3 nuevos endpoints** (incluyendo el decorador `@router.get(...)` y la función) siguiendo exactamente la estructura base.
> 3. Los endpoints que necesito son:
> * **Endpoint 1 (`/kpis-resumen`):** Debe devolver el total de ventas (dinero sumado), el total de pedidos (órdenes únicas) y el ticket promedio (total/pedidos).
> * **Endpoint 2 (`/ventas-por-estado`):** Debe devolver el volumen de ventas agrupado por el estado (`state`) del cliente, ordenado de mayor a menor. Esto servirá para una gráfica de barras.
> * **Endpoint 3 (`/top-categorias`):** Debe devolver las 5 categorías de productos más vendidas (en cantidad de items) junto con su nombre en inglés (`product_category_name_english`), cruzando con la tabla de traducciones.
> 
> 
> 
> 
> **Restricciones:**
> * Usa SQL puro, no uses ORMs.
> * Asegúrate de manejar posibles nulos en tus consultas (ej. `COALESCE`).
> * El resultado devuelto en el JSON debe ser fácil de iterar para un frontend de React.
> 
> 