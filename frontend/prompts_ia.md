# 🤖 Prompts de Ayuda para el Desarrollo de React

*Estos prompts te servirán para generar la estructura rápida de tu Dashboard interactivo.*

---
**Prompt 1: Obtener datos y tipado (Fetch & State)**

> Actúa como un experto en React y Vite. Estoy construyendo un Dashboard. Necesito un componente principal que, al montarse (`useEffect`), haga una petición `fetch` a mi backend en `/api/datos`. 
> El backend me devuelve un array de objetos con esta estructura: `{ id: number, origen: "TCP" | "UDP", contenido: object, fecha: string }`.
> Escribe el código para gestionar este estado (`useState`), manejar un estado de "Cargando" (loading), un estado de error, y mostrar una tabla básica HTML que itere sobre estos datos temporalmente.

---
**Prompt 2: Integración de Chart.js**

> Ya tengo mis datos de la API guardados en un estado de React llamado `datos`. Ahora quiero integrar `Chart.js` (o `react-chartjs-2`).
> Necesito crear un componente de Gráfica de Anillo (Doughnut chart) que muestre el volumen de mensajes recibidos agrupados por la columna `origen`. 
> Es decir, necesito una función que procese mi array de `datos`, cuente cuántos tienen `origen === "TCP"` y cuántos `"UDP"`, y le pase esa cuenta exacta a la configuración de datos de Chart.js. Muéstrame el código del componente y cómo procesar el array.