FROM node:24-alpine AS build
WORKDIR /app

# Instalar dependencias
COPY package*.json ./
RUN npm install

# Copiar el resto y construir
COPY . .
RUN npm run build

FROM nginx:alpine
# Copiamos la build de Vite
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]