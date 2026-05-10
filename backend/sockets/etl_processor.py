from datetime import datetime

def limpiar_datos(payload: dict) -> dict:
    """
    Recibe el JSON crudo del agente, limpia nulos, 
    formatea fechas y asegura tipos de datos correctos.
    """
    datos_limpios = {}
    
    # 1. Limpieza de Identificadores (Evitar strings vacíos)
    datos_limpios['order_id'] = payload.get('order_id', 'UNKNOWN_ORDER').strip()
    datos_limpios['customer_id'] = payload.get('customer_id', 'UNKNOWN_CUST').strip()
    datos_limpios['product_id'] = payload.get('product_id', 'UNKNOWN_PROD').strip()
    datos_limpios['seller_id'] = payload.get('seller_id', 'UNKNOWN_SELL').strip()
    
    # 2. Formateo de Fechas a formato SQL (YYYY-MM-DD) y extracción de dimensiones
    fecha_cruda = payload.get('purchase_date', '')
    try:
        # Intenta parsear la fecha que viene del CSV de Kaggle
        dt = datetime.strptime(fecha_cruda, '%Y-%m-%d %H:%M:%S')
        datos_limpios['purchase_date_id'] = dt.strftime('%Y-%m-%d')
        datos_limpios['year'] = dt.year
        datos_limpios['month'] = dt.month
        datos_limpios['day'] = dt.day
        datos_limpios['quarter'] = (dt.month - 1) // 3 + 1
        datos_limpios['day_name'] = dt.strftime('%A')
    except (ValueError, TypeError):
        # Si la fecha viene nula o rota, asignamos la fecha actual de limpieza
        hoy = datetime.now()
        datos_limpios['purchase_date_id'] = hoy.strftime('%Y-%m-%d')
        datos_limpios['year'] = hoy.year
        datos_limpios['month'] = hoy.month
        datos_limpios['day'] = hoy.day
        datos_limpios['quarter'] = (hoy.month - 1) // 3 + 1
        datos_limpios['day_name'] = hoy.strftime('%A')

    # 3. Limpieza de Geometría y Strings (Diferenciando Cliente y Vendedor)
    # Cliente
    datos_limpios['customer_zip_code'] = int(payload.get('customer_zip_code') or 0)
    datos_limpios['customer_city'] = str(payload.get('customer_city', 'Sin Especificar')).upper()
    datos_limpios['customer_state'] = str(payload.get('customer_state', 'NA')).upper()[:2]
    
    # Vendedor
    datos_limpios['seller_zip_code'] = int(payload.get('seller_zip_code') or 0)
    datos_limpios['seller_city'] = str(payload.get('seller_city', 'Sin Especificar')).upper()
    datos_limpios['seller_state'] = str(payload.get('seller_state', 'NA')).upper()[:2]
    
    # Categoría
    datos_limpios['category'] = str(payload.get('category', 'sin_categoria')).lower()
    
    # 4. Formateo de Números (Asegurar que no vengan nulos o textos raros)
    try:
        datos_limpios['price'] = round(float(payload.get('price', 0.0)), 2)
        datos_limpios['freight_value'] = round(float(payload.get('freight_value', 0.0)), 2)
        datos_limpios['total_value'] = datos_limpios['price'] + datos_limpios['freight_value']
        datos_limpios['order_item_id'] = int(payload.get('order_item_id', 1))
    except (ValueError, TypeError):
        datos_limpios['price'] = 0.0
        datos_limpios['freight_value'] = 0.0
        datos_limpios['total_value'] = 0.0
        datos_limpios['order_item_id'] = 1

    return datos_limpios