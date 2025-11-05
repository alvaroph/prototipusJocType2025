# Etapa 1: Construcción de la aplicación
FROM node:20-alpine AS build-stage

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Etapa 2: Servir la aplicación con Nginx
FROM nginx:stable-alpine

COPY --from=build-stage /app/dist /usr/share/nginx/html
EXPOSE 80

