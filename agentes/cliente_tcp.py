import socket
import json
import time
import random
from datetime import datetime
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

    print("✅ ¡Base de datos cargada en RAM! Iniciando Modo Demo E-commerce.")
    print(f"🔌 Conectando al servidor Data Warehouse en {HOST}:{PORT}...")
    
    cliente = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    
    try:
        cliente.connect((HOST, PORT))
        print("🟢 Conexión TCP establecida con éxito.\n")
        
        contador = 1
        while True:
            # Seleccionar una fila completamente al azar del dataset
            fila_aleatoria = df_ventas.sample(n=1).to_dict(orient='records')[0]
            
            # Alterar el ID y la Fecha para que sea "En Vivo"
            # Generamos un ID único usando el timestamp actual
            nuevo_order_id = f"DEMO-{int(time.time() * 1000)}"
            fila_aleatoria['order_id'] = nuevo_order_id
            
            # Asignamos la fecha y hora exacta de este segundo
            fecha_actual = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            fila_aleatoria['purchase_date'] = fecha_actual
            
            # Enviar el paquete
            mensaje = json.dumps(fila_aleatoria) + "\n"
            cliente.sendall(mensaje.encode('utf-8'))
            
            print(f"[TCP] Venta Simulada #{contador} -> Orden: {nuevo_order_id} | Precio: ${fila_aleatoria['price']} | Hora: {fecha_actual}")
            
            contador += 1
            
            # Pausa aleatoria entre 1 y 4 segundos para simular compras orgánicas
            time.sleep(random.uniform(1.0, 4.0))
            
    except ConnectionRefusedError:
        print("❌ Error: Conexión rechazada. Asegúrate de que el backend de FastAPI esté corriendo.")
    except KeyboardInterrupt:
        print("\n🛑 Simulación pausada manualmente.")
    finally:
        cliente.close()
        print("Socket cerrado.")

if __name__ == "__main__":
    iniciar_transmision_tcp()