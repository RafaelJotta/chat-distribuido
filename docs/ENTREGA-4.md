# 📅 Entrega 4: Tolerância a Falhas e Segurança
**Data:** 28/11/2025

## 1. Detecção e Recuperação de Falhas

Implementamos resiliência tanto no cliente quanto no servidor para lidar com instabilidades de rede e quedas de serviço.

### A. Exponential Backoff (Algoritmo)
Implementado no Frontend (`useWebSocket.ts`) e no Backend (`connect_with_retry` em Python).
Quando uma conexão falha, o sistema não tenta reconectar imediatamente em loop (o que causaria DDoS). Ele espera um tempo progressivo:
$$Tempo = \min(MaxCap, Base \times 2^{tentativas})$$
* **Sequência:** 1s, 2s, 4s, 8s, 16s...
* *Objetivo:* Permitir *Graceful Recovery* (recuperação suave) dos serviços.

### B. Healthchecks
Configuramos *Healthchecks* no Docker Compose. Se um serviço travar, o Docker detecta via endpoint `/health` e reinicia o contêiner automaticamente (`restart: always`).

## 2. Segurança

### A. Autenticação e Autorização
* **JWT (JSON Web Token):** O backend é *stateless*. O token contém o `role` do usuário, assinado com algoritmo **HS256**. O serviço de mensagens valida esse token antes de permitir inscrição em canais restritos.
* **Hashing:** Senhas nunca são salvas em texto plano. Utilizamos **Bcrypt** (via `passlib`) com *salt* automático.

### B. Isolamento de Rede
* **Rede Interna:** Os contêineres `servico-autenticacao`, `servico-mensagens` e o banco de dados rodam em uma rede interna do Docker.
* **Exposição Mínima:** Apenas as portas `80` e `443` (via Nginx) são expostas ao mundo externo, reduzindo a superfície de ataque.