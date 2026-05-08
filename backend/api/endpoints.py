import os
from fastapi import APIRouter, HTTPException, Security, status
from fastapi.security import APIKeyHeader
from core.database import get_db_connection
from dotenv import load_dotenv

# Cargar las variables de entorno
load_dotenv()

router = APIRouter()

# ==========================================
# CONFIGURACIÓN DE SEGURIDAD (API Key)
# ==========================================
# Leemos el token seguro desde el archivo .env
SECRET_AUTH_TOKEN = os.getenv("SECRET_AUTH_TOKEN") 
header_scheme = APIKeyHeader(name="X-API-Key")

def validar_token(api_key: str = Security(header_scheme)):
    """Dependencia que verifica que el token sea correcto."""
    # Validamos que el token exista en el .env y coincida con el enviado en la petición
    if not SECRET_AUTH_TOKEN or api_key != SECRET_AUTH_TOKEN:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Acceso denegado: Token inválido o ausente"
        )
    return api_key

# ==========================================
# ENDPOINTS PROTEGIDOS
# ==========================================

@router.get("/kpis")
def obtener_kpis_principales(token: str = Security(validar_token)):
    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            cursor.execute("SELECT COUNT(*) as total_pedidos FROM dim_orders")
            total_pedidos = cursor.fetchone()
        conn.close()
        return {"status": "ok", "data": {"pedidos": total_pedidos['total_pedidos']}}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error en BD: {str(e)}")

@router.get("/ultimas_ventas")
def obtener_ventas_recientes(token: str = Security(validar_token)):
    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            sql = """
                SELECT 
                    o.order_id, 
                    o.purchase_date_id, 
                    s.total_value,
                    c.state as customer_state
                FROM fact_sales s
                JOIN dim_orders o ON s.order_id = o.order_id
                JOIN dim_customers c ON o.customer_id = c.customer_id
                ORDER BY o.purchase_date_id DESC
                LIMIT 10
            """
            cursor.execute(sql)
            resultados = cursor.fetchall()
            
        conn.close()
        return {"status": "ok", "data": resultados}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error en BD: {str(e)}")