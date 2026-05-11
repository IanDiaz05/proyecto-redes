FROM node:24-alpine AS build
WORKDIR /app

# Instalar dependencias
COPY package*.json ./
RUN npm install

# Declarar los argumentos de construcción (ARG)
ARG VITE_API_BASE_URL
ARG VITE_API_KEY
ARG VITE_MAPBOX_TOKEN

# Pasarlos a variables de entorno (ENV) para que Vite los lea al compilar
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_API_KEY=$VITE_API_KEY
ENV VITE_MAPBOX_TOKEN=$VITE_MAPBOX_TOKEN

# Copiar el resto y construir
COPY . .
RUN npm run build

FROM nginx:alpine
# Copiamos la build de Vite
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]