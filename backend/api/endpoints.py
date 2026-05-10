import os
from fastapi import APIRouter, HTTPException, Security, status, Query
from fastapi.security import APIKeyHeader
from core.database import get_db_connection
from dotenv import load_dotenv

load_dotenv()

router = APIRouter()

# ==========================================
# CONFIGURACIÓN DE SEGURIDAD (API Key)
# ==========================================
SECRET_AUTH_TOKEN = os.getenv("SECRET_AUTH_TOKEN")
header_scheme = APIKeyHeader(name="X-API-Key")

def validar_token(api_key: str = Security(header_scheme)):
    if not SECRET_AUTH_TOKEN or api_key != SECRET_AUTH_TOKEN:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Acceso denegado: Token inválido o ausente"
        )
    return api_key


# ==========================================
# 1. KPIs RESUMEN GENERAL
# ==========================================
@router.get("/kpis-resumen")
def kpis_resumen(token: str = Security(validar_token)):
    """Total de ventas, pedidos, ticket promedio y flete total."""
    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            sql = """
                SELECT
                    COALESCE(SUM(total_value), 0)           AS total_ventas,
                    COUNT(DISTINCT order_id)                AS total_pedidos,
                    COALESCE(ROUND(AVG(total_value), 2), 0) AS ticket_promedio,
                    COALESCE(SUM(freight_value), 0)         AS total_flete
                FROM fact_sales
            """
            cursor.execute(sql)
            resultado = cursor.fetchone()
        conn.close()
        return {"status": "ok", "data": resultado}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error en BD: {str(e)}")


# ==========================================
# 2. VENTAS POR ESTADO (gráfica de barras)
# ==========================================
@router.get("/ventas-por-estado")
def ventas_por_estado(token: str = Security(validar_token)):
    """Volumen de ventas agrupado por estado del cliente, de mayor a menor."""
    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            sql = """
                SELECT
                    c.state                                     AS estado,
                    COUNT(DISTINCT o.order_id)                  AS total_pedidos,
                    COALESCE(SUM(s.total_value), 0)             AS ingresos_totales,
                    COALESCE(ROUND(AVG(s.total_value), 2), 0)   AS ticket_promedio
                FROM fact_sales s
                JOIN dim_orders o    ON s.order_id    = o.order_id
                JOIN dim_customers c ON o.customer_id = c.customer_id
                GROUP BY c.state
                ORDER BY ingresos_totales DESC
            """
            cursor.execute(sql)
            resultados = cursor.fetchall()
        conn.close()
        return {"status": "ok", "data": resultados}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error en BD: {str(e)}")


# ==========================================
# 3. TOP CATEGORÍAS MÁS VENDIDAS
# ==========================================
@router.get("/top-categorias")
def top_categorias(
    limit: int = Query(5, description="Número de categorías a devolver"),
    token: str = Security(validar_token)
):
    """Top categorías por cantidad de items vendidos, con nombre en inglés."""
    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            sql = """
                SELECT
                    COALESCE(ct.product_category_name_english,
                             p.product_category_name, 'Sin categoría') AS categoria,
                    COUNT(*)                        AS items_vendidos,
                    COALESCE(SUM(s.total_value), 0) AS ingresos_totales
                FROM fact_sales s
                JOIN dim_products p ON s.product_id = p.product_id
                LEFT JOIN dim_category_translation ct
                    ON p.product_category_name = ct.product_category_name
                GROUP BY categoria
                ORDER BY items_vendidos DESC
                LIMIT %s
            """
            cursor.execute(sql, (limit,))
            resultados = cursor.fetchall()
        conn.close()
        return {"status": "ok", "data": resultados}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error en BD: {str(e)}")


# ==========================================
# 4. VENTAS POR TRIMESTRE
# ==========================================
@router.get("/ventas-por-trimestre")
def ventas_por_trimestre(
    year: int = Query(None, description="Filtrar por año, ej: 2018"),
    token: str = Security(validar_token)
):
    """Ingresos agrupados por año y trimestre. Útil para gráfica de línea."""
    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            sql = """
                SELECT
                    d.year                          AS año,
                    d.quarter                       AS trimestre,
                    COUNT(DISTINCT o.order_id)      AS total_pedidos,
                    COALESCE(SUM(s.total_value), 0) AS ingresos_totales
                FROM fact_sales s
                JOIN dim_orders o ON s.order_id = o.order_id
                JOIN dim_date d   ON o.purchase_date_id = d.date_id
                {where}
                GROUP BY d.year, d.quarter
                ORDER BY d.year, d.quarter
            """
            if year:
                cursor.execute(sql.format(where="WHERE d.year = %s"), (year,))
            else:
                cursor.execute(sql.format(where=""))
            resultados = cursor.fetchall()
        conn.close()
        return {"status": "ok", "data": resultados}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error en BD: {str(e)}")


# ==========================================
# 5. VENTAS POR DÍA DE LA SEMANA
# ==========================================
@router.get("/ventas-por-dia-semana")
def ventas_por_dia_semana(token: str = Security(validar_token)):
    """Pedidos e ingresos por día de la semana. Útil para heatmap."""
    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            sql = """
                SELECT
                    d.day_name                      AS dia,
                    COUNT(DISTINCT o.order_id)      AS total_pedidos,
                    COALESCE(SUM(s.total_value), 0) AS ingresos_totales
                FROM fact_sales s
                JOIN dim_orders o ON s.order_id = o.order_id
                JOIN dim_date d   ON o.purchase_date_id = d.date_id
                GROUP BY d.day_name
                ORDER BY FIELD(d.day_name,
                    'Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday')
            """
            cursor.execute(sql)
            resultados = cursor.fetchall()
        conn.close()
        return {"status": "ok", "data": resultados}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error en BD: {str(e)}")


# ==========================================
# 6. KPI SATISFACCIÓN GLOBAL
# ==========================================
@router.get("/kpi-satisfaccion")
def kpi_satisfaccion(token: str = Security(validar_token)):
    """Score promedio, total reseñas y % de reseñas positivas (4-5 estrellas)."""
    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            sql = """
                SELECT
                    ROUND(AVG(review_score), 2)                                 AS score_promedio,
                    COUNT(*)                                                    AS total_resenas,
                    SUM(CASE WHEN review_score >= 4 THEN 1 ELSE 0 END)         AS resenas_positivas,
                    ROUND(
                        SUM(CASE WHEN review_score >= 4 THEN 1 ELSE 0 END)
                        * 100.0 / NULLIF(COUNT(*), 0)
                    , 2)                                                        AS pct_positivas
                FROM fact_reviews
            """
            cursor.execute(sql)
            resultado = cursor.fetchone()
        conn.close()
        return {"status": "ok", "data": resultado}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error en BD: {str(e)}")


# ==========================================
# 7. DETALLE DE UN PEDIDO ESPECÍFICO
# ==========================================
@router.get("/pedido/{order_id}")
def detalle_pedido(order_id: str, token: str = Security(validar_token)):
    """Items, pagos y reseña de un pedido dado su ID."""
    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            cursor.execute("""
                SELECT s.order_item_id,
                       s.product_id,
                       COALESCE(ct.product_category_name_english,
                                p.product_category_name) AS categoria,
                       s.price, s.freight_value, s.total_value,
                       sv.state AS estado_vendedor
                FROM fact_sales s
                JOIN dim_products p  ON s.product_id = p.product_id
                LEFT JOIN dim_category_translation ct
                    ON p.product_category_name = ct.product_category_name
                JOIN dim_sellers sv  ON s.seller_id  = sv.seller_id
                WHERE s.order_id = %s
            """, (order_id,))
            items = cursor.fetchall()

            cursor.execute("""
                SELECT payment_type, payment_installments, payment_value
                FROM fact_payments WHERE order_id = %s
            """, (order_id,))
            pagos = cursor.fetchall()

            cursor.execute("""
                SELECT review_score FROM fact_reviews
                WHERE order_id = %s LIMIT 1
            """, (order_id,))
            resena = cursor.fetchone()

        conn.close()
        if not items:
            raise HTTPException(status_code=404, detail="Pedido no encontrado")
        return {"status": "ok", "data": {"items": items, "pagos": pagos, "resena": resena}}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error en BD: {str(e)}")


# ==========================================
# 8. RELACIÓN PRECIO VS FLETE POR CATEGORÍA
# ==========================================
@router.get("/relacion-precio-flete")
def relacion_precio_flete(
    limit: int = Query(10, description="Top N categorías"),
    token: str = Security(validar_token)
):
    """Precio promedio vs flete promedio. Útil para gráfica de dispersión."""
    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            sql = """
                SELECT
                    COALESCE(ct.product_category_name_english,
                             p.product_category_name, 'Sin categoría') AS categoria,
                    ROUND(AVG(s.price), 2)         AS precio_promedio,
                    ROUND(AVG(s.freight_value), 2) AS flete_promedio,
                    ROUND(
                        AVG(s.freight_value) * 100.0 / NULLIF(AVG(s.price), 0)
                    , 2)                           AS pct_flete_sobre_precio
                FROM fact_sales s
                JOIN dim_products p ON s.product_id = p.product_id
                LEFT JOIN dim_category_translation ct
                    ON p.product_category_name = ct.product_category_name
                GROUP BY categoria
                ORDER BY pct_flete_sobre_precio DESC
                LIMIT %s
            """
            cursor.execute(sql, (limit,))
            resultados = cursor.fetchall()
        conn.close()
        return {"status": "ok", "data": resultados}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error en BD: {str(e)}")


# ==========================================
# 9. HEATMAP VENTAS POR ESTADO Y MES
# ==========================================
@router.get("/heatmap-estado-mes")
def heatmap_estado_mes(
    year: int = Query(None, description="Filtrar por año"),
    token: str = Security(validar_token)
):
    """Pedidos por estado y mes. Datos para heatmap geográfico-temporal."""
    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            sql = """
                SELECT
                    c.state                         AS estado,
                    d.year                          AS año,
                    d.month                         AS mes,
                    COUNT(DISTINCT o.order_id)      AS total_pedidos,
                    COALESCE(SUM(s.total_value), 0) AS ingresos_totales
                FROM fact_sales s
                JOIN dim_orders o    ON s.order_id    = o.order_id
                JOIN dim_customers c ON o.customer_id = c.customer_id
                JOIN dim_date d      ON o.purchase_date_id = d.date_id
                {where}
                GROUP BY c.state, d.year, d.month
                ORDER BY c.state, d.year, d.month
            """
            if year:
                cursor.execute(sql.format(where="WHERE d.year = %s"), (year,))
            else:
                cursor.execute(sql.format(where=""))
            resultados = cursor.fetchall()
        conn.close()
        return {"status": "ok", "data": resultados}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error en BD: {str(e)}")


# ==========================================
# 10. RESEÑAS NEGATIVAS POR CATEGORÍA
# ==========================================
@router.get("/resenas-negativas-por-categoria")
def resenas_negativas_por_categoria(token: str = Security(validar_token)):
    """Categorías con más reseñas de 1-2 estrellas. Para alertas de calidad."""
    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            sql = """
                SELECT
                    COALESCE(ct.product_category_name_english,
                             p.product_category_name, 'Sin categoría') AS categoria,
                    COUNT(r.review_id)            AS resenas_negativas,
                    ROUND(AVG(r.review_score), 2) AS score_promedio
                FROM fact_reviews r
                JOIN dim_orders o   ON r.order_id   = o.order_id
                JOIN fact_sales s   ON o.order_id   = s.order_id
                JOIN dim_products p ON s.product_id = p.product_id
                LEFT JOIN dim_category_translation ct
                    ON p.product_category_name = ct.product_category_name
                WHERE r.review_score <= 2
                GROUP BY categoria
                ORDER BY resenas_negativas DESC
                LIMIT 15
            """
            cursor.execute(sql)
            resultados = cursor.fetchall()
        conn.close()
        return {"status": "ok", "data": resultados}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error en BD: {str(e)}")


# ==========================================
# 11. RENDIMIENTO DE VENDEDORES
# ==========================================
@router.get("/rendimiento-vendedores")
def rendimiento_vendedores(
    limit: int = Query(15, description="Top N vendedores"),
    token: str = Security(validar_token)
):
    """Cruza ventas y reseñas por vendedor para medir rendimiento global."""
    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            sql = """
                SELECT
                    s.seller_id,
                    sv.state                        AS estado,
                    COUNT(DISTINCT s.order_id)      AS total_pedidos,
                    COALESCE(SUM(s.total_value), 0) AS ingresos_totales,
                    ROUND(AVG(r.review_score), 2)   AS score_promedio,
                    COUNT(r.review_id)              AS total_resenas
                FROM fact_sales s
                JOIN dim_sellers sv  ON s.seller_id  = sv.seller_id
                LEFT JOIN dim_orders o  ON s.order_id  = o.order_id
                LEFT JOIN fact_reviews r ON o.order_id = r.order_id
                GROUP BY s.seller_id, sv.state
                ORDER BY ingresos_totales DESC
                LIMIT %s
            """
            cursor.execute(sql, (limit,))
            resultados = cursor.fetchall()
        conn.close()
        return {"status": "ok", "data": resultados}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error en BD: {str(e)}")


# ==========================================
# 12. MAPA DE VENDEDORES (coordenadas)
# ==========================================
@router.get("/mapa-vendedores")
def mapa_vendedores(token: str = Security(validar_token)):
    """Coordenadas de vendedores para pin en mapa interactivo."""
    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            sql = """
                SELECT
                    sv.seller_id,
                    sv.city                         AS ciudad,
                    sv.state                        AS estado,
                    g.latitude,
                    g.longitude,
                    COUNT(DISTINCT s.order_id)      AS total_pedidos,
                    COALESCE(SUM(s.total_value), 0) AS ingresos_totales
                FROM dim_sellers sv
                JOIN dim_geolocation g ON sv.zip_code_prefix = g.zip_code_prefix
                JOIN fact_sales s      ON sv.seller_id        = s.seller_id
                GROUP BY sv.seller_id, sv.city, sv.state, g.latitude, g.longitude
                ORDER BY ingresos_totales DESC
            """
            cursor.execute(sql)
            resultados = cursor.fetchall()
        conn.close()
        return {"status": "ok", "data": resultados}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error en BD: {str(e)}")


# ==========================================
# 13. MAPA DE CLIENTES (densidad)
# ==========================================
@router.get("/mapa-clientes")
def mapa_clientes(token: str = Security(validar_token)):
    """Coordenadas y densidad de clientes para mapa de calor."""
    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            sql = """
                SELECT
                    c.state                                 AS estado,
                    c.city                                  AS ciudad,
                    ROUND(AVG(g.latitude), 4)               AS latitud,
                    ROUND(AVG(g.longitude), 4)              AS longitud,
                    COUNT(DISTINCT c.customer_unique_id)    AS clientes_unicos,
                    COUNT(DISTINCT o.order_id)              AS total_pedidos
                FROM dim_customers c
                JOIN dim_geolocation g ON c.zip_code_prefix = g.zip_code_prefix
                LEFT JOIN dim_orders o  ON c.customer_id    = o.customer_id
                GROUP BY c.state, c.city
                ORDER BY clientes_unicos DESC
                LIMIT 100
            """
            cursor.execute(sql)
            resultados = cursor.fetchall()
        conn.close()
        return {"status": "ok", "data": resultados}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error en BD: {str(e)}")


# ==========================================
# 14. MÉTODOS DE PAGO POR ESTADO
# ==========================================
@router.get("/pagos-por-estado")
def pagos_por_estado(token: str = Security(validar_token)):
    """Método de pago más usado en cada estado. Para gráfica de barras apiladas."""
    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            sql = """
                SELECT
                    c.state              AS estado,
                    p.payment_type       AS metodo_pago,
                    COUNT(*)             AS total_transacciones,
                    SUM(p.payment_value) AS monto_total
                FROM fact_payments p
                JOIN dim_orders o    ON p.order_id    = o.order_id
                JOIN dim_customers c ON o.customer_id = c.customer_id
                GROUP BY c.state, p.payment_type
                ORDER BY c.state, total_transacciones DESC
            """
            cursor.execute(sql)
            resultados = cursor.fetchall()
        conn.close()
        return {"status": "ok", "data": resultados}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error en BD: {str(e)}")


# ==========================================
# 15. TICKET PROMEDIO MENSUAL (línea de tendencia)
# ==========================================
@router.get("/ticket-promedio-mensual")
def ticket_promedio_mensual(token: str = Security(validar_token)):
    """Ticket promedio mes a mes. Útil para gráfica de tendencia."""
    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            sql = """
                SELECT
                    d.year                              AS año,
                    d.month                             AS mes,
                    ROUND(AVG(sub.total_orden), 2)      AS ticket_promedio,
                    COUNT(sub.order_id)                 AS total_pedidos
                FROM (
                    SELECT order_id, SUM(total_value) AS total_orden
                    FROM fact_sales
                    GROUP BY order_id
                ) sub
                JOIN dim_orders o ON sub.order_id = o.order_id
                JOIN dim_date d   ON o.purchase_date_id = d.date_id
                GROUP BY d.year, d.month
                ORDER BY d.year, d.month
            """
            cursor.execute(sql)
            resultados = cursor.fetchall()
        conn.close()
        return {"status": "ok", "data": resultados}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error en BD: {str(e)}")


# ==========================================
# 16. RANGO DE PRECIOS POR CATEGORÍA
# ==========================================
@router.get("/precios-por-categoria")
def precios_por_categoria(token: str = Security(validar_token)):
    """Precio máximo, mínimo y promedio por categoría."""
    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            sql = """
                SELECT
                    COALESCE(ct.product_category_name_english,
                             p.product_category_name, 'Sin categoría') AS categoria,
                    ROUND(MAX(s.price), 2) AS precio_maximo,
                    ROUND(MIN(s.price), 2) AS precio_minimo,
                    ROUND(AVG(s.price), 2) AS precio_promedio,
                    COUNT(*)               AS items_vendidos
                FROM fact_sales s
                JOIN dim_products p ON s.product_id = p.product_id
                LEFT JOIN dim_category_translation ct
                    ON p.product_category_name = ct.product_category_name
                GROUP BY categoria
                ORDER BY precio_promedio DESC
            """
            cursor.execute(sql)
            resultados = cursor.fetchall()
        conn.close()
        return {"status": "ok", "data": resultados}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error en BD: {str(e)}")


# ==========================================
# 17. TOP CLIENTES POR GASTO
# ==========================================
@router.get("/top-clientes-por-gasto")
def top_clientes_por_gasto(
    limit: int = Query(10, description="Top N clientes"),
    token: str = Security(validar_token)
):
    """Clientes únicos con mayor gasto acumulado."""
    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            sql = """
                SELECT
                    c.customer_unique_id,
                    c.state                         AS estado,
                    c.city                          AS ciudad,
                    COUNT(DISTINCT o.order_id)      AS total_pedidos,
                    COALESCE(SUM(s.total_value), 0) AS gasto_total,
                    ROUND(AVG(s.total_value), 2)    AS ticket_promedio
                FROM dim_customers c
                JOIN dim_orders o ON c.customer_id = o.customer_id
                JOIN fact_sales s ON o.order_id    = s.order_id
                GROUP BY c.customer_unique_id, c.state, c.city
                ORDER BY gasto_total DESC
                LIMIT %s
            """
            cursor.execute(sql, (limit,))
            resultados = cursor.fetchall()
        conn.close()
        return {"status": "ok", "data": resultados}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error en BD: {str(e)}")


# ==========================================
# 18. PEDIDOS SIN RESEÑA (KPI de cobertura)
# ==========================================
@router.get("/pedidos-sin-resena")
def pedidos_sin_resena(token: str = Security(validar_token)):
    """Total de pedidos sin reseña y su porcentaje sobre el total."""
    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            sql = """
                SELECT
                    COUNT(DISTINCT o.order_id) AS pedidos_sin_resena,
                    (SELECT COUNT(DISTINCT order_id) FROM dim_orders) AS total_pedidos,
                    ROUND(
                        COUNT(DISTINCT o.order_id) * 100.0
                        / NULLIF((SELECT COUNT(DISTINCT order_id) FROM dim_orders), 0)
                    , 2) AS pct_sin_resena
                FROM dim_orders o
                LEFT JOIN fact_reviews r ON o.order_id = r.order_id
                WHERE r.review_id IS NULL
            """
            cursor.execute(sql)
            resultado = cursor.fetchone()
        conn.close()
        return {"status": "ok", "data": resultado}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error en BD: {str(e)}")


# ==========================================
# 19. COMPARATIVA ANUAL (YoY)
# ==========================================
@router.get("/comparativa-anual")
def comparativa_anual(token: str = Security(validar_token)):
    """Ingresos y pedidos por año para comparar crecimiento año a año."""
    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            sql = """
                SELECT
                    d.year                           AS año,
                    COUNT(DISTINCT o.order_id)       AS total_pedidos,
                    COALESCE(SUM(s.total_value), 0)  AS ingresos_totales,
                    COALESCE(SUM(s.freight_value), 0) AS flete_total,
                    ROUND(AVG(s.total_value), 2)     AS ticket_promedio
                FROM fact_sales s
                JOIN dim_orders o ON s.order_id = o.order_id
                JOIN dim_date d   ON o.purchase_date_id = d.date_id
                GROUP BY d.year
                ORDER BY d.year
            """
            cursor.execute(sql)
            resultados = cursor.fetchall()
        conn.close()
        return {"status": "ok", "data": resultados}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error en BD: {str(e)}")


# ==========================================
# 20. PEDIDOS POR RANGO DE FECHAS
# ==========================================
@router.get("/pedidos-por-rango")
def pedidos_por_rango(
    fecha_inicio: str = Query(..., description="Fecha inicio YYYY-MM-DD"),
    fecha_fin:    str = Query(..., description="Fecha fin   YYYY-MM-DD"),
    token: str = Security(validar_token)
):
    """Pedidos e ingresos dentro de un rango de fechas específico."""
    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            sql = """
                SELECT
                    o.order_id,
                    o.purchase_date_id                AS fecha,
                    c.state                           AS estado_cliente,
                    COALESCE(SUM(s.total_value), 0)   AS total_pedido,
                    COALESCE(SUM(s.freight_value), 0) AS total_flete,
                    COUNT(s.order_item_id)            AS items
                FROM dim_orders o
                JOIN dim_customers c ON o.customer_id = c.customer_id
                JOIN fact_sales s    ON o.order_id    = s.order_id
                WHERE o.purchase_date_id BETWEEN %s AND %s
                GROUP BY o.order_id, o.purchase_date_id, c.state
                ORDER BY o.purchase_date_id DESC
            """
            cursor.execute(sql, (fecha_inicio, fecha_fin))
            resultados = cursor.fetchall()
        conn.close()
        return {"status": "ok", "data": resultados}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error en BD: {str(e)}")

# ==========================================
# 21. TELEMETRÍA EN VIVO (últimos 20 registros)
# ==========================================
@router.get("/telemetria-vivo")
def obtener_telemetria_vivo(token: str = Security(validar_token)):
    """
    Devuelve los últimos 20 registros de sensores para una gráfica en tiempo real.
    """
    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            cursor.execute("""
                SELECT sensor_id, temperature, humidity, DATE_FORMAT(timestamp, '%H:%i:%s') as time 
                FROM telemetry_logs 
                ORDER BY id DESC 
                LIMIT 20
            """)
            resultados = cursor.fetchall()
        conn.close()
        
        # Invertimos la lista para que el gráfico vaya de izquierda (antiguo) a derecha (nuevo)
        return {"status": "ok", "data": resultados[::-1]}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error en BD: {str(e)}")