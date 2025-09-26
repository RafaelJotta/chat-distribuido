# Estágio 1: Build do projeto Vite
FROM node:18-alpine AS build
WORKDIR /app
COPY package.json ./
# A linha abaixo foi removida pois o package-lock.json não foi fornecido.
# COPY package-lock.json ./ 
RUN npm install
COPY . .
RUN npm run build

# Estágio 2: Servir os arquivos estáticos com Nginx
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
