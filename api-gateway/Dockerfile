# Usa a versão mais recente e segura do Alpine para mitigar vulnerabilidades
FROM nginx:alpine

# Remove a configuração padrão do Nginx
RUN rm /etc/nginx/conf.d/default.conf
# Copia a nossa configuração personalizada para o lugar certo
COPY nginx.conf /etc/nginx/conf.d/
