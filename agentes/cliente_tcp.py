import socket
import json
import time
import pandas as pd
import numpy as np

HOST = '127.0.0.1'
PORT = 12000

def preparar_datos_venta():
    print("fusionando archivos CSV...")
    try:
        # 1. Cargar los df
        orders = pd.read_csv('datasets/olist_orders_dataset.csv')
        items = pd.read_csv('datasets/olist_order_items_dataset.csv')
        customers = pd.read_csv('datasets/olist_customers_dataset.csv')
        products = pd.read_csv('datasets/olist_products_dataset.csv')
        sellers = pd.read_csv('datasets/olist_sellers_dataset.csv')
        
        # 2. Realizar JOINs
        df = items.merge(orders, on='order_id', how='left')
        df = df.merge(customers, on='customer_id', how='left')
        df = df.merge(products, on='product_id', how='left')
        df = df.merge(sellers, on='seller_id', how='left')
        
        # 3. Renombrar columnas
        df = df.rename(columns={
            'order_purchase_timestamp': 'purchase_date',
            'customer_zip_code_prefix': 'customer_zip_code',
            'customer_city': 'customer_city',
            'customer_state': 'customer_state',
            'seller_zip_code_prefix': 'seller_zip_code',
            'seller_city': 'seller_city',
            'seller_state': 'seller_state',
            'product_category_name': 'category'
        })
        
        # 4. Seleccionar columnas finales
        columnas_finales = [
            'order_id', 'order_item_id', 'customer_id', 'product_id', 'seller_id',
            'price', 'freight_value', 'purchase_date', 'category',
            'customer_zip_code', 'customer_city', 'customer_state',
            'seller_zip_code', 'seller_city', 'seller_state'
        ]
        df_limpio = df[columnas_finales]
        
        # 5. Convertir nulos a None
        df_limpio = df_limpio.replace({np.nan: None})
        return df_limpio
        
    except FileNotFoundError as e:
        print(f"❌ Error: {e}")
        return None

def iniciar_transmision_tcp():
    df_ventas = preparar_datos_venta()
    if df_ventas is None:
        return

    total_registros = len(df_ventas)
    print(f"✅ ¡Fusión exitosa! Se han preparado {total_registros} items para enviar.")
    print(f"🔌 Conectando al servidor Data Warehouse en {HOST}:{PORT}...")
    
    cliente = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    
    try:
        cliente.connect((HOST, PORT))
        print("🟢 Conexión TCP establecida con éxito.\n")
        
        # Convertir el DataFrame a una lista de diccionarios
        registros = df_ventas.to_dict(orient='records')
        
        for i, fila in enumerate(registros):
            mensaje = json.dumps(fila) + "\n"
            cliente.sendall(mensaje.encode('utf-8'))
            print(f"[TCP] ({i+1}/{total_registros}) Venta enviada -> Orden: {fila['order_id'][:8]}... | Precio: ${fila['price']}")

            time.sleep(0.01)
            
    except ConnectionRefusedError:
        print("❌ Error: Conexión rechazada. Asegúrate de que el backend de FastAPI esté corriendo.")
    finally:
        cliente.close()
        print("\n🛑 Transmisión finalizada y socket cerrado.")

if __name__ == "__main__":
    iniciar_transmision_tcp()