import socket
import json
import time
import random

HOST = '127.0.0.1' 
PORT = 12001

def iniciar_agente_udp():
    print(f"📡 Iniciando Agente de Telemetría UDP hacia {HOST}:{PORT}")
    # Definimos SOCK_DGRAM para el protocolo UDP
    cliente = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    
    sensores = ["S-1", "S-2", "S-3"]
    
    try:
        while True:
            # Generar datos aleatorios simulando sensores
            datos = {
                "sensor_id": random.choice(sensores),
                "temperature": round(random.uniform(20.0, 35.0), 2),
                "humidity": round(random.uniform(40.0, 80.0), 2)
            }
            
            mensaje = json.dumps(datos)
            
            # En UDP no usamos connect(), usamos sendto() directo a la IP y Puerto
            cliente.sendto(mensaje.encode('utf-8'), (HOST, PORT))
            print(f"[UDP] Transmitiendo -> {mensaje}")
            
            # Envíos cada 0.5 segundos
            time.sleep(0.5) 
            
    except KeyboardInterrupt:
        print("\n🛑 Transmisión UDP detenida.")
    finally:
        cliente.close()

if __name__ == "__main__":
    iniciar_agente_udp()