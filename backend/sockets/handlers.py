import socket
import json
import threading
from core.database import get_db_connection
from sockets.etl_processor import limpiar_datos

# ==========================================
# 1. LÓGICA DE INSERCIÓN RELACIONAL (ETL)
# ==========================================
def procesar_e_insertar(origen_red, datos_crudos):
    """
    Limpia el JSON recibido e inserta los datos respetando 
    la jerarquía del modelo en estrella (Dimensiones -> Órdenes -> Hechos).
    """
    # 1. Limpieza de datos usando nuestro ETL
    d = limpiar_datos(datos_crudos)
    
    conn = None
    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:

            # --- LOG CENTRAL ---
            # Guardamos el JSON tal cual llegó antes de los inserts específicos
            cursor.execute(
                "INSERT INTO central_logs (origen, contenido) VALUES (%s, %s)",
                (origen_red, json.dumps(datos_crudos))
            )

            # --- DIMENSIONES ---
            
            # Geolocalización del cliente
            cursor.execute("INSERT IGNORE INTO dim_geolocation (zip_code_prefix, city, state) VALUES (%s, %s, %s)", 
                           (d['customer_zip_code'], d['customer_city'], d['customer_state']))
            
            # Geolocalización del vendedor
            cursor.execute("INSERT IGNORE INTO dim_geolocation (zip_code_prefix, city, state) VALUES (%s, %s, %s)", 
                           (d['seller_zip_code'], d['seller_city'], d['seller_state']))
            
            # Cliente
            cursor.execute("INSERT IGNORE INTO dim_customers (customer_id, zip_code_prefix, city, state) VALUES (%s, %s, %s, %s)", 
                           (d['customer_id'], d['customer_zip_code'], d['customer_city'], d['customer_state']))
            
            # Vendedor
            cursor.execute("INSERT IGNORE INTO dim_sellers (seller_id, zip_code_prefix, city, state) VALUES (%s, %s, %s, %s)", 
                           (d['seller_id'], d['seller_zip_code'], d['seller_city'], d['seller_state']))
            
            # Fecha
            cursor.execute("INSERT IGNORE INTO dim_date (date_id, year, month, day, quarter, day_name) VALUES (%s, %s, %s, %s, %s, %s)", 
                           (d['purchase_date_id'], d['year'], d['month'], d['day'], d['quarter'], d['day_name']))
            
            # Traducción de categoría
            cursor.execute("INSERT IGNORE INTO dim_category_translation (product_category_name, product_category_name_english) VALUES (%s, %s)", 
                           (d['category'], d['category'])) # Si no hay traducción en inglés, repetimos la original temporalmente
            
            # Producto
            cursor.execute("INSERT IGNORE INTO dim_products (product_id, product_category_name) VALUES (%s, %s)", 
                           (d['product_id'], d['category']))
            
            # --- CABECERA DE LA ORDEN (dim_orders) ---
            cursor.execute("INSERT IGNORE INTO dim_orders (order_id, customer_id, purchase_date_id) VALUES (%s, %s, %s)", 
                           (d['order_id'], d['customer_id'], d['purchase_date_id']))
            
            # --- HECHOS (FACTS) ---
            # fact_sales
            sql_sales = """
                INSERT INTO fact_sales (order_id, order_item_id, product_id, seller_id, price, freight_value, total_value) 
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                ON DUPLICATE KEY UPDATE 
                    price=VALUES(price), 
                    freight_value=VALUES(freight_value), 
                    total_value=VALUES(total_value)
            """
            cursor.execute(sql_sales, (d['order_id'], d['order_item_id'], d['product_id'], d['seller_id'], d['price'], d['freight_value'], d['total_value']))

        # Si todo salió bien, guardamos los cambios (Commit)
        conn.commit()
        print(f"✅ [{origen_red}] Pedido {d['order_id'][:8]}... insertado limpiamente.")
        
    except Exception as e:
        if conn:
            conn.rollback() # Revertimos la transacción entera si algo falla
        print(f"❌ Error insertando pedido {d.get('order_id')}: {e}")
    finally:
        if conn:
            conn.close()

# ==========================================
# 2. SERVIDOR TCP (AGENTE TRANSACCIONAL)
# ==========================================
def start_tcp_server():
    server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    server.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1) 
    server.bind(('0.0.0.0', 12000))
    server.listen(5)
    print("🟢 Servidor TCP escuchando (Puerto 12000)")
    
    while True:
        client, addr = server.accept()
        print(f"📞 Nueva conexión TCP desde {addr}")
        
        buffer = "" # Memoria temporal para juntar pedazos de mensajes
        
        while True:
            try:
                data = client.recv(4096).decode('utf-8')
                
                if not data:
                    print(f"🛑 El cliente {addr} cerró la conexión TCP.")
                    break 
                
                buffer += data # Añadimos lo recibido al buffer
                
                # Procesamos todos los JSON completos que haya en el buffer
                while '\n' in buffer:
                    linea, buffer = buffer.split('\n', 1)
                    if linea.strip(): # Si la línea no está vacía
                        datos_json = json.loads(linea)
                        procesar_e_insertar("TCP", datos_json)
                
            except json.JSONDecodeError:
                print("⚠️ Error TCP: Se recibió un dato que no es JSON válido.")
            except Exception as e:
                print(f"⚠️ Error leyendo datos del cliente TCP: {e}")
                break
                
        client.close()

# ==========================================
# 3. LOGICA DE PROCESAMIENTO DE TELEMETRÍA (AGENTE DE TELEMETRÍA UDP)
# ==========================================
def procesar_telemetria(origen_red, datos):
    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            # --- 1. LOG CENTRAL ---
            cursor.execute(
                "INSERT INTO central_logs (origen, contenido) VALUES (%s, %s)",
                (origen_red, json.dumps(datos))
            )

            # --- 2. TABLA DE TELEMETRÍA ---
            cursor.execute(
                "INSERT INTO telemetry_logs (sensor_id, temperature, humidity) VALUES (%s, %s, %s)",
                (datos.get('sensor_id'), datos.get('temperature'), datos.get('humidity'))
            )
        conn.commit()
        print(f"📡 [{origen_red}] Telemetría registrada en Log Central y Tabla de Sensores.")
    except Exception as e:
        print(f"❌ Error insertando telemetría: {e}")
    finally:
        if conn:
            conn.close()

# ==========================================
# 4. SERVIDOR UDP (AGENTE DE TELEMETRÍA)
# ==========================================
def start_udp_server():
    server = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    server.bind(('0.0.0.0', 12001))
    print("🟢 Servidor UDP escuchando (Puerto 12001)")
    
    while True:
        try:
            data, addr = server.recvfrom(4096)
            datos_json = json.loads(data.decode('utf-8'))
            
            # Redirigimos a la tabla de telemetría
            procesar_telemetria("UDP", datos_json)
            
        except json.JSONDecodeError:
            pass # Ignoramos paquetes mal formados (común en UDP)
        except Exception as e:
            print(f"❌ Error en el servidor UDP: {e}")