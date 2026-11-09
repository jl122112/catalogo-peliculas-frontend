# Etapa 1: Build (Usamos Node.js 22)
FROM node:22-alpine AS build
WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm ci

# Copiar el resto del código
COPY . .

# Construir la aplicación para producción
RUN npm run build -- --configuration=production

# Etapa 2: Servir con Nginx
FROM nginx:alpine

# Copiar los archivos compilados desde la etapa de build
# Nota: Si tu angular.json usa el builder antiguo, la ruta podría ser solo /app/dist/frontend
COPY --from=build /app/dist/frontend/browser /usr/share/nginx/html

# Copiar la configuración personalizada de Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]