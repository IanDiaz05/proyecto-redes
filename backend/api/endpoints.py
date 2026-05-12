import os
import datetime
from fastapi import APIRouter, HTTPException, Security, status, Query
from fastapi.security import APIKeyHeader
from core.database import get_db_connection
from dotenv import load_dotenv

load_dotenv()
api_version = "v2.4.1"
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
# ENDPOINT: ESTADO DEL SISTEMA (Health Check)
# ==========================================
@router.get("/sistema-estado")
def sistema_estado(
    token: str = Security(validar_token),
    incluir_historico: bool = Query(False, description="Incluir conteos de últimos 5 minutos para sparklines"),
    detalle_tablas: bool = Query(False, description="Desglosar conteo por tabla principal")
):
    """
    Métricas de salud del Data Warehouse y pipeline de ingesta.
    Ideal para sidebar de estado y monitoreo operativo.
    """
    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            
            # --- 1. Conteo total de registros en el DW ---
            cursor.execute("SELECT COUNT(*) AS total FROM fact_sales")
            total_ventas = cursor.fetchone()['total']
            
            cursor.execute("SELECT COUNT(*) AS total FROM dim_orders")
            total_ordenes = cursor.fetchone()['total']
            
            # --- 2. Estado de ingesta UDP (últimos 10 segundos) ---
            cursor.execute("""
                SELECT COUNT(*) AS total 
                FROM telemetry_logs 
                WHERE timestamp >= DATE_SUB(NOW(), INTERVAL 10 SECOND)
            """)
            udp_ultimo_minuto = cursor.fetchone()['total']
            
            # --- 3. Estado de ingesta TCP (últimos 10 segundos) ---
            cursor.execute("""
                SELECT COUNT(*) AS total 
                FROM central_logs 
                WHERE origen = 'TCP' AND fecha >= DATE_SUB(NOW(), INTERVAL 10 SECOND)
            """)
            tcp_ultimo_minuto = cursor.fetchone()['total']
            
            # --- 4. Última sincronización (último registro en central_logs) ---
            cursor.execute("""
                SELECT MAX(fecha) AS ultima_sinc 
                FROM central_logs
            """)
            ultima_sync = cursor.fetchone()['ultima_sinc']
            
            # --- 5. Tamaño total del DW (aproximado en registros) ---
            cursor.execute("""
                SELECT 
                    (SELECT COUNT(*) FROM fact_sales) +
                    (SELECT COUNT(*) FROM dim_orders) +
                    (SELECT COUNT(*) FROM dim_customers) +
                    (SELECT COUNT(*) FROM dim_sellers) +
                    (SELECT COUNT(*) FROM telemetry_logs) +
                    (SELECT COUNT(*) FROM central_logs) AS total_registros_dw
            """)
            total_registros_dw = cursor.fetchone()['total_registros_dw']
            
            # --- 6. Datos históricos para sparklines (si se solicitan) ---
            historico = None
            if incluir_historico:
                cursor.execute("""
                    SELECT 
                        DATE_FORMAT(fecha, '%H:%i') AS minuto,
                        SUM(CASE WHEN origen = 'TCP' THEN 1 ELSE 0 END) AS tcp,
                        SUM(CASE WHEN origen = 'UDP' THEN 1 ELSE 0 END) AS udp
                    FROM central_logs
                    WHERE fecha >= DATE_SUB(NOW(), INTERVAL 5 MINUTE)
                    GROUP BY DATE_FORMAT(fecha, '%H:%i')
                    ORDER BY minuto ASC
                """)
                historico = cursor.fetchall()
            
            # --- 7. Detalle por tablas (si se solicita) ---
            tablas = None
            if detalle_tablas:
                cursor.execute("""
                    SELECT 
                        'fact_sales' AS tabla, COUNT(*) AS registros FROM fact_sales
                    UNION ALL
                    SELECT 'dim_orders', COUNT(*) FROM dim_orders
                    UNION ALL
                    SELECT 'dim_customers', COUNT(*) FROM dim_customers
                    UNION ALL
                    SELECT 'dim_sellers', COUNT(*) FROM dim_sellers
                    UNION ALL
                    SELECT 'telemetry_logs', COUNT(*) FROM telemetry_logs
                    UNION ALL
                    SELECT 'central_logs', COUNT(*) FROM central_logs
                """)
                tablas = cursor.fetchall()
            
        conn.close()
        
        # Determinar estado de ingesta basado en actividad reciente
        estado_udp = "Activa" if udp_ultimo_minuto > 0 else "Inactiva"
        estado_tcp = "Activa" if tcp_ultimo_minuto > 0 else "Inactiva"
        
        # Formatear última sincronización
        ultima_sync_str = ultima_sync.strftime('%Y-%m-%d %H:%M:%S') if ultima_sync else "Sin registros"
        
        respuesta = {
            "status": "ok",
            "data": {
                "total_registros_dw": total_registros_dw,
                "total_ventas_procesadas": total_ventas,
                "total_ordenes_unicas": total_ordenes,
                "estado_ingesta_udp": estado_udp,
                "estado_ingesta_tcp": estado_tcp,
                "registros_udp_ultimo_minuto": udp_ultimo_minuto,
                "registros_tcp_ultimo_minuto": tcp_ultimo_minuto,
                "ultima_sincronizacion": ultima_sync_str,
                "version_api": api_version,
                "timestamp_servidor": datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            }
        }
        
        if historico:
            respuesta["data"]["historico_ingesta_5min"] = historico
            
        if tablas:
            respuesta["data"]["detalle_tablas"] = tablas
            
        return respuesta
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error en BD: {str(e)}")
    
    
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
    min_ventas: int = Query(10, ge=1, description="Mínimo de ventas para incluir categoría"),
    token: str = Security(validar_token)
):
    """
    Precio promedio vs flete promedio por categoría.
    Incluye volumen de ventas para ponderar la relevancia de cada punto.
    """
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
                    , 2)                           AS pct_flete_sobre_precio,
                    COUNT(*)                       AS total_ventas
                FROM fact_sales s
                JOIN dim_products p ON s.product_id = p.product_id
                LEFT JOIN dim_category_translation ct
                    ON p.product_category_name = ct.product_category_name
                GROUP BY p.product_category_name, ct.product_category_name_english
                HAVING COUNT(*) >= %s
                ORDER BY total_ventas DESC
            """
            cursor.execute(sql, (min_ventas,))
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
# 14. DISTRIBUCIÓN DE MÉTODOS DE PAGO
# ==========================================
@router.get("/distribucion-pagos")
def distribucion_pagos(token: str = Security(validar_token)):
    """Distribución global de métodos de pago para gráfica de pastel."""
    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            sql = """
                SELECT 
                    payment_type AS metodo,
                    COUNT(*) AS total_transacciones,
                    COALESCE(SUM(payment_value), 0) AS monto_total,
                    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) AS porcentaje
                FROM fact_payments
                GROUP BY payment_type
                ORDER BY total_transacciones DESC
            """
            cursor.execute(sql)
            resultado = cursor.fetchall()
        conn.close()
        return {"status": "ok", "data": resultado}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error en BD: {str(e)}")


# ==========================================
# 15. TICKET PROMEDIO MENSUAL (línea de tendencia)
# ==========================================
@router.get("/ticket-promedio-mensual")
def ticket_promedio_mensual(token: str = Security(validar_token)):
    """Ticket promedio mensual. Tendencia de valor por orden."""
    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            sql = """
                SELECT
                    d.year AS año,
                    d.month AS mes,
                    ROUND(AVG(fs.total_value), 2) AS ticket_promedio,
                    COUNT(DISTINCT fs.order_id) AS total_pedidos
                FROM fact_sales fs
                JOIN dim_orders o ON fs.order_id = o.order_id
                JOIN dim_date d ON o.purchase_date_id = d.date_id
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
# 20. TELEMETRÍA EN VIVO (últimos 20 registros)
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

# ==========================================
# 21. BALANCE DE PROTOCOLOS TCP VS UDP
# ==========================================
@router.get("/balance-protocolos")
def obtener_balance_protocolos(token: str = Security(validar_token)):
    """
    Devuelve el conteo total de registros procesados por TCP vs UDP
    ideal para una gráfica de pastel en el dashboard.
    """
    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            # Consultamos la tabla de auditoría central
            sql = """
                SELECT origen, COUNT(*) as total 
                FROM central_logs 
                GROUP BY origen
            """
            cursor.execute(sql)
            resultados = cursor.fetchall()
        conn.close()
        
        return {
            "status": "ok", 
            "data": resultados
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error en auditoría: {str(e)}")
    
# ==========================================
# 22. VENTAS RECIENTES (Feed en vivo - Random, sin DEMO-)
# Esta tabla es una simulación de un feed en vivo, mostrando las ventas más recientes excluyendo las de prueba (DEMO-).
# asegurando que cada vez que se consulte, se obtenga un conjunto aleatorio de ventas reales ordenadas por fecha de compra más reciente.
# ==========================================
@router.get("/ventas-recientes")
def ventas_recientes(
    token: str = Security(validar_token),
    limite: int = Query(10, ge=1, le=50)
):
    """Feed aleatorio de ventas reales (excluye DEMO-), ordenadas por más recientes."""
    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            sql = """
                SELECT order_id, categoria, estado_cliente, total_value
                FROM (
                    SELECT 
                        fs.order_id,
                        COALESCE(ct.product_category_name_english, p.product_category_name) AS categoria,
                        c.state AS estado_cliente,
                        fs.total_value,
                        o.purchase_date_id
                    FROM fact_sales fs
                    JOIN dim_products p ON fs.product_id = p.product_id
                    LEFT JOIN dim_category_translation ct 
                        ON p.product_category_name = ct.product_category_name
                    JOIN dim_orders o ON fs.order_id = o.order_id
                    JOIN dim_customers c ON o.customer_id = c.customer_id
                    WHERE fs.order_id NOT LIKE 'DEMO-%%'
                    ORDER BY RAND()
                    LIMIT %s
                ) AS ventas_random
                ORDER BY purchase_date_id DESC
            """
            cursor.execute(sql, (limite,))
            resultado = cursor.fetchall()
        conn.close()
        return {"status": "ok", "data": resultado}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error en BD: {str(e)}")
    
    
# ==========================================
# ENDPOINT: RUTAS LOGÍSTICAS (ArcLayer Deck.gl)
# ==========================================
@router.get("/rutas-logisticas")
def rutas_logisticas(
    token: str = Security(validar_token),
    min_paquetes: int = Query(5, ge=1, le=1000, description="Umbral mínimo de paquetes para mostrar ruta"),
    limite: int = Query(500, ge=10, le=2000, description="Máximo de rutas a devolver")
):
    """
    Devuelve arcos origen→destino con metadatos para Deck.gl ArcLayer.
    Origen: vendedor. Destino: cliente. Volumen = cantidad de pedidos.
    """
    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            sql = """
                SELECT 
                    -- Origen (Vendedor)
                    g_v.longitude AS lon_origen,
                    g_v.latitude AS lat_origen,
                    g_v.city AS ciudad_origen,
                    g_v.state AS estado_origen,
                    
                    -- Destino (Cliente)
                    g_c.longitude AS lon_destino,
                    g_c.latitude AS lat_destino,
                    g_c.city AS ciudad_destino,
                    g_c.state AS estado_destino,
                    
                    -- Métricas de la ruta
                    COUNT(DISTINCT fs.order_id) AS cantidad_paquetes,
                    COALESCE(SUM(fs.total_value), 0) AS ingresos_totales,
                    COALESCE(SUM(fs.freight_value), 0) AS flete_total,
                    COALESCE(ROUND(AVG(fs.freight_value), 2), 0) AS flete_promedio,
                    COALESCE(ROUND(AVG(fs.total_value), 2), 0) AS ticket_promedio_ruta
                    
                FROM fact_sales fs
                JOIN dim_orders o ON fs.order_id = o.order_id
                JOIN dim_customers c ON o.customer_id = c.customer_id
                JOIN dim_sellers s ON fs.seller_id = s.seller_id
                
                -- JOIN con geolocalización maestra (ahora con coordenadas reales)
                JOIN dim_geolocation g_v ON s.zip_code_prefix = g_v.zip_code_prefix
                JOIN dim_geolocation g_c ON c.zip_code_prefix = g_c.zip_code_prefix
                
                -- Solo rutas donde AMBOS tengan coordenadas válidas
                WHERE g_v.latitude IS NOT NULL 
                  AND g_v.longitude IS NOT NULL
                  AND g_c.latitude IS NOT NULL 
                  AND g_c.longitude IS NOT NULL
                
                GROUP BY 
                    g_v.longitude, g_v.latitude, g_v.city, g_v.state,
                    g_c.longitude, g_c.latitude, g_c.city, g_c.state
                
                HAVING COUNT(DISTINCT fs.order_id) >= %s
                
                ORDER BY cantidad_paquetes DESC, ingresos_totales DESC
                LIMIT %s
            """
            cursor.execute(sql, (min_paquetes, limite))
            rows = cursor.fetchall()
            
            # Formatear al JSON exacto que Deck.gl ArcLayer espera
            data = []
            for row in rows:
                data.append({
                    "origen": [float(row['lon_origen']), float(row['lat_origen'])],
                    "destino": [float(row['lon_destino']), float(row['lat_destino'])],
                    "ciudad_origen": row['ciudad_origen'],
                    "estado_origen": row['estado_origen'],
                    "ciudad_destino": row['ciudad_destino'],
                    "estado_destino": row['estado_destino'],
                    "cantidad_paquetes": row['cantidad_paquetes'],
                    "ingresos_totales": float(row['ingresos_totales']),
                    "flete_total": float(row['flete_total']),
                    "flete_promedio": float(row['flete_promedio']),
                    "ticket_promedio_ruta": float(row['ticket_promedio_ruta'])
                })
                
        conn.close()
        return {"status": "ok", "total_rutas": len(data), "data": data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error en BD: {str(e)}")
    
# ==========================================
# ENDPOINT: FLETE VS DISTANCIA GEOESPACIAL
# ==========================================
@router.get("/flete-vs-distancia")
def flete_vs_distancia(
    token: str = Security(validar_token),
    agrupar_por: str = Query("ruta", description="Opciones: 'ruta' (origen→destino), 'estado_destino', 'estado_origen'")
):
    """
    Calcula distancia Haversine entre vendedor y cliente, cruzada con costo de flete.
    Detecta rutas donde el flete es desproporcionado respecto a la distancia.
    """
    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            
            # Fórmula de Haversine en SQL puro (radio de Tierra = 6371 km)
            haversine_sql = """
                6371 * 2 * ASIN(SQRT(
                    POWER(SIN(RADIANS(g_v.latitude - g_c.latitude) / 2), 2) +
                    COS(RADIANS(g_v.latitude)) * COS(RADIANS(g_c.latitude)) *
                    POWER(SIN(RADIANS(g_v.longitude - g_c.longitude) / 2), 2)
                ))
            """
            
            if agrupar_por == "ruta":
                sql = f"""
                    SELECT 
                        g_v.state AS estado_origen,
                        g_c.state AS estado_destino,
                        g_v.city AS ciudad_origen,
                        g_c.city AS ciudad_destino,
                        
                        -- Distancia calculada
                        ROUND(AVG({haversine_sql}), 2) AS distancia_km,
                        
                        -- Métricas de flete
                        COALESCE(ROUND(AVG(fs.freight_value), 2), 0) AS flete_promedio,
                        COALESCE(ROUND(AVG(fs.price), 2), 0) AS precio_promedio,
                        COALESCE(ROUND(AVG(fs.freight_value) / NULLIF(AVG(fs.price), 0) * 100, 2), 0) AS pct_flete_sobre_precio,
                        
                        -- Coordenadas para el mapa (promedio de la ruta)
                        ROUND(AVG(g_v.latitude), 6) AS lat_origen,
                        ROUND(AVG(g_v.longitude), 6) AS lon_origen,
                        ROUND(AVG(g_c.latitude), 6) AS lat_destino,
                        ROUND(AVG(g_c.longitude), 6) AS lon_destino,
                        
                        COUNT(*) AS total_envios,
                        COALESCE(SUM(fs.freight_value), 0) AS flete_total_acumulado
                        
                    FROM fact_sales fs
                    JOIN dim_orders o ON fs.order_id = o.order_id
                    JOIN dim_customers c ON o.customer_id = c.customer_id
                    JOIN dim_sellers s ON fs.seller_id = s.seller_id
                    JOIN dim_geolocation g_v ON s.zip_code_prefix = g_v.zip_code_prefix
                    JOIN dim_geolocation g_c ON c.zip_code_prefix = g_c.zip_code_prefix
                    
                    WHERE 
                        g_v.latitude IS NOT NULL AND g_v.longitude IS NOT NULL
                        AND g_c.latitude IS NOT NULL AND g_c.longitude IS NOT NULL
                    
                    GROUP BY g_v.state, g_c.state, g_v.city, g_c.city
                    HAVING COUNT(*) >= 5
                    ORDER BY pct_flete_sobre_precio DESC, distancia_km DESC
                """
                cursor.execute(sql)
                
            elif agrupar_por == "estado_destino":
                sql = f"""
                    SELECT 
                        g_c.state AS estado_destino,
                        ROUND(AVG({haversine_sql}), 2) AS distancia_km,
                        COALESCE(ROUND(AVG(fs.freight_value), 2), 0) AS flete_promedio,
                        COALESCE(ROUND(AVG(fs.price), 2), 0) AS precio_promedio,
                        COALESCE(ROUND(AVG(fs.freight_value) / NULLIF(AVG(fs.price), 0) * 100, 2), 0) AS pct_flete_sobre_precio,
                        COUNT(*) AS total_envios,
                        ROUND(AVG(g_c.latitude), 6) AS latitud,
                        ROUND(AVG(g_c.longitude), 6) AS longitud
                        
                    FROM fact_sales fs
                    JOIN dim_orders o ON fs.order_id = o.order_id
                    JOIN dim_customers c ON o.customer_id = c.customer_id
                    JOIN dim_sellers s ON fs.seller_id = s.seller_id
                    JOIN dim_geolocation g_v ON s.zip_code_prefix = g_v.zip_code_prefix
                    JOIN dim_geolocation g_c ON c.zip_code_prefix = g_c.zip_code_prefix
                    
                    WHERE g_c.latitude IS NOT NULL AND g_c.longitude IS NOT NULL
                    
                    GROUP BY g_c.state
                    ORDER BY pct_flete_sobre_precio DESC
                """
                cursor.execute(sql)
                
            else:  # estado_origen
                sql = f"""
                    SELECT 
                        g_v.state AS estado_origen,
                        ROUND(AVG({haversine_sql}), 2) AS distancia_km,
                        COALESCE(ROUND(AVG(fs.freight_value), 2), 0) AS flete_promedio,
                        COALESCE(ROUND(AVG(fs.price), 2), 0) AS precio_promedio,
                        COALESCE(ROUND(AVG(fs.freight_value) / NULLIF(AVG(fs.price), 0) * 100, 2), 0) AS pct_flete_sobre_precio,
                        COUNT(*) AS total_envios,
                        ROUND(AVG(g_v.latitude), 6) AS latitud,
                        ROUND(AVG(g_v.longitude), 6) AS longitud
                        
                    FROM fact_sales fs
                    JOIN dim_orders o ON fs.order_id = o.order_id
                    JOIN dim_customers c ON o.customer_id = c.customer_id
                    JOIN dim_sellers s ON fs.seller_id = s.seller_id
                    JOIN dim_geolocation g_v ON s.zip_code_prefix = g_v.zip_code_prefix
                    JOIN dim_geolocation g_c ON c.zip_code_prefix = g_c.zip_code_prefix
                    
                    WHERE g_v.latitude IS NOT NULL AND g_v.longitude IS NOT NULL
                    
                    GROUP BY g_v.state
                    ORDER BY pct_flete_sobre_precio DESC
                """
                cursor.execute(sql)
            
            rows = cursor.fetchall()
            
            # Formatear respuesta
            data = []
            for row in rows:
                item = dict(row)
                # Convertir Decimals a float para JSON serializable
                for key in ['distancia_km', 'flete_promedio', 'precio_promedio', 
                           'pct_flete_sobre_precio', 'latitud', 'longitud',
                           'lat_origen', 'lon_origen', 'lat_destino', 'lon_destino',
                           'flete_total_acumulado']:
                    if key in item and item[key] is not None:
                        item[key] = float(item[key])
                data.append(item)
                
        conn.close()
        return {
            "status": "ok", 
            "agrupado_por": agrupar_por,
            "total_rutas": len(data),
            "data": data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error en BD: {str(e)}")