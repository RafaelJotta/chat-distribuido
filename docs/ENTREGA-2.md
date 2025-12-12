# 📅 Entrega 2: Primeiros Módulos e Comunicação
**Data:** 26/09/2025

## 1. Estratégia de Comunicação

Implementamos um modelo de comunicação híbrido para otimizar o tráfego de rede:

* **REST (HTTP/1.1):** Utilizado para operações transacionais de curta duração (Login e Cadastro).
    * *Justificativa:* Semântica clara de verbos (POST, GET) e statelessness.
* **WebSocket (WS):** Utilizado para o envio e recebimento de mensagens.
    * *Justificativa:* Mantém um túnel Full-Duplex aberto, eliminando a necessidade de *Polling* (o cliente ficar perguntando "tem mensagem nova?"), reduzindo latência e carga no servidor.

## 2. Implementação do API Gateway

O arquivo `nginx.conf` foi configurado para direcionar o tráfego baseado na URL, garantindo transparência:

```nginx
# Exemplo da configuração implementada
location /api/auth/ {
    proxy_pass http://servico-autenticacao:18080;
}

location /ws {
    proxy_pass http://servico-mensagens:18081/ws;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
}