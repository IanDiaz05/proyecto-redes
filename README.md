# Proyecto Data Warehouse - Programación de Aplicaciones de Red

Este proyecto simula un entorno moderno de Data Warehouse. Su objetivo es recibir datos simulados de sistemas externos a través de la red (TCP/UDP), almacenarlos de forma centralizada y exponerlos en un panel de control interactivo.

## Arquitectura del Sistema

1. **Ingesta (Agentes):** Scripts en Python que simulan sistemas transaccionales (TCP) y sensores de telemetría (UDP).
2. **Core / Backend:** Un servidor concurrente hecho con FastAPI que escucha en los puertos 12000 y 12001, e inserta la información en la base de datos.
3. **Base de Datos:** Instancia de PostgreSQL (Supabase) almacenando datos estructurados en formato JSONB.
4. **Dashboard:** Aplicación React (Vite) para la visualización de datos en tiempo real mediante gráficas y tablas dinámicas.

## Estructura del Repositorio (Monorepo)

* `/agentes` - Scripts simuladores de tráfico.
* `/backend` - API de FastAPI y lógica de sockets.
* `/frontend` - Interfaz gráfica en React.

## Flujo de Desarrollo (Git)
* **Rama `dev`:** Toda la programación, pruebas locales y creación de nuevos archivos se hacen aquí.
* **Rama `main`:** Exclusiva para producción. Ian se encarga de hacer el *merge* hacia aquí, lo cual dispara automáticamente el despliegue en Dokploy.