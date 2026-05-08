import socket
import time
import random
import json

HOST = '127.0.0.1'
PORT = 12001

def generar_datos_telemetria():
    """Genera datos aleatorios simulando un sensor en tiempo real."""
    return {
        "sensor_id": f"S-{random.randint(1, 5)}",
        "temperatura_c": round(random.uniform(20.0, 35.0), 2),
        "humedad_pct": round(random.uniform(40.0, 80.0), 1),
        "estado": random.choice(["OK", "WARNING", "OK", "OK"])
    }

# ==========================================
# LÓGICA DEL CLIENTE UDP
# ==========================================
def iniciar_agente_udp():
    print(f"Iniciando Agente UDP... Transmitiendo a {HOST}:{PORT}")
    
    # Crear el socket no orientado a conexión (UDP)
    cliente = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    
    try:
        # Enviar 10 lecturas de telemetría de prueba
        for i in range(10):
            datos = generar_datos_telemetria()
            mensaje = json.dumps(datos)
            
            # En UDP se usa sendto() especificando la dirección destino cada vez
            cliente.sendto(mensaje.encode('utf-8'), (HOST, PORT))
            print(f"[UDP] Enviado: {mensaje}")
            
            # Pausa de 0.5 segundos solicitada por el requerimiento
            time.sleep(0.5)
            
        print("✅ Transmisión UDP de prueba finalizada.")
        
    except Exception as e:
        print(f"❌ Error en transmisión UDP: {e}")
    finally:
        cliente.close()
        print("Socket UDP cerrado.")

if __name__ == "__main__":
    iniciar_agente_udp()