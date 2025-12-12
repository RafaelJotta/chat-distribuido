# RELATÓRIO TÉCNICO FINAL: PROJETO DE SISTEMAS DISTRIBUÍDOS
## SISTEMA DE CHAT CORPORATIVO HIERÁRQUICO

**Instituição:** Faculdade de Engenharia de Computação
**Disciplina:** Sistemas Distribuídos
**Aluno:** Amando Luiz
**Data:** 12/12/2025

---

## 1. INTRODUÇÃO

Este relatório documenta o ciclo de vida completo de desenvolvimento de um Sistema de Chat Corporativo Distribuído. O projeto foi concebido para solucionar o problema de comunicação em tempo real em ambientes organizacionais hierárquicos, superando as limitações de escalabilidade e disponibilidade típicas de arquiteturas monolíticas.

O objetivo central do trabalho foi a aplicação prática dos pilares de **Sistemas Distribuídos**:
1.  **Transparência:** Ocultar do usuário a complexidade da rede, a localização dos recursos e a recuperação de falhas.
2.  **Escalabilidade:** Suportar o crescimento horizontal de usuários e mensagens.
3.  **Concorrência e Coordenação:** Gerenciar o acesso simultâneo a recursos compartilhados garantindo a integridade dos dados.

A solução final adota uma arquitetura de **Microsserviços**, desacoplando a lógica de negócios em contêineres independentes orquestrados via Docker, com persistência delegada ao **Amazon DynamoDB** para garantir alta disponibilidade e replicação de dados.

---

## 2. DESENVOLVIMENTO E ARQUITETURA

A implementação técnica foi estruturada em camadas lógicas distintas, comunicando-se através de protocolos padronizados.

### 2.1 Backend (Python & FastAPI)
O backend foi desenvolvido utilizando **Python 3.10+** com o framework **FastAPI**. A escolha desta tecnologia justifica-se pelo suporte nativo ao padrão ASGI (*Asynchronous Server Gateway Interface*).

* **Concorrência Assíncrona:** Diferente de frameworks bloqueantes (WSGI), o FastAPI utiliza `async/await`. No serviço de mensagens, isso permite gerenciar milhares de conexões WebSocket (`active_connections`) sem alocar uma *thread* do Sistema Operacional para cada usuário, otimizando o uso de CPU e Memória.
* **Serviço de Autenticação (`servico-autenticacao`):** Responsável pelo ciclo de vida do usuário. Implementa o padrão *Stateless* via **JWT (JSON Web Tokens)** e realiza o *hashing* seguro de senhas com o algoritmo **Bcrypt**.
* **Serviço de Mensagens (`servico-mensagens`):** Atua como um *Message Broker* em memória. Ele implementa lógica de roteamento hierárquico, garantindo que mensagens de grupos de "Diretores" não sejam entregues a "Funcionários", validando o *role* contido no token.

### 2.2 Frontend (React & WebSocket Controller)
O frontend é uma *Single Page Application* (SPA) construída com **React**, **TypeScript** e **Vite**.

* **Gerenciamento de Estado Distribuído:** O *hook* `useWebSocket.ts` atua como um controlador de estado de rede. Ele não apenas recebe dados, mas gerencia a máquina de estados da conexão (`connecting` -> `connected` -> `reconnecting`).
* **Interface Otimista (Optimistic UI):** Para garantir transparência de desempenho, a interface exibe mensagens enviadas instantaneamente, assumindo sucesso especulativo enquanto a confirmação assíncrona é processada pelo servidor.

---

## 3. EVOLUÇÃO DO PROJETO (Entregas 1 a 4)

### 3.1 Entrega 1 – Arquitetura e Transparência de Localização
Nesta fase, estabelecemos a topologia da rede e o **API Gateway** utilizando **Nginx**.

* **Reverse Proxy:** O Nginx roteia tráfego `/api/auth` para o serviço de autenticação e `/ws` para o serviço de mensagens.
* **Transparência:** O cliente desconhece a existência de múltiplos contêineres ou portas internas. Para o mundo externo, o sistema é um ponto único na porta `8080`.
* **Service Discovery:** Utilizamos o DNS interno do Docker (`resolver 127.0.0.11`) para resolução dinâmica de nomes.

### 3.2 Entrega 2 – Comunicação Inter-Processos
Implementamos um modelo híbrido de comunicação:

* **REST (Síncrono):** Utilizado para Login e Registro. A semântica HTTP (POST/GET) é ideal para operações atômicas.
* **WebSocket (Assíncrono/Full-Duplex):** Utilizado para o Chat. A conexão persistente elimina o *overhead* de *handshakes* HTTP repetitivos e evita o *Polling*, permitindo *push* de dados em tempo real.

### 3.3 Entrega 3 – Coordenação, Nomeação e Consistência
A migração para o **Amazon DynamoDB** permitiu a implementação robusta de algoritmos distribuídos.

* **Coordenação (Exclusão Mútua):** Utilizamos **Escritas Condicionais** (`attribute_not_exists`) para garantir atomicidade no cadastro de e-mails, evitando duplicidade sob concorrência.
* **Contadores Atômicos:** Geração de IDs únicos via `UpdateItem` com incremento atômico no banco.
* **Consistência Eventual:** Priorizamos a Disponibilidade (Teorema CAP), aceitando convergência eventual das réplicas de mensagens.

### 3.4 Entrega 4 – Tolerância a Falhas e Segurança

#### A. Recuperação de Falhas (Exponential Backoff)
Implementamos algoritmos de resiliência tanto no Frontend quanto no Backend (`connect_with_retry`):
* **Algoritmo:** Em caso de falha de conexão (ex: banco indisponível), o sistema espera tempos progressivos ($1s, 2s, 4s, \dots, 30s$) antes de tentar reconectar.
* **Benefício:** Previne o efeito de "manada" (DDoS acidental) sobre os serviços durante a recuperação.

#### B. Segurança
* **Isolamento:** A rede interna do Docker é fechada; apenas o API Gateway é exposto.
* **Criptografia:** Senhas em *hash* (Bcrypt) e Tokens JWT com expiração temporal.

---

## 4. DOCUMENTAÇÃO DA API

### 4.1 API REST (Autenticação)
**Base URL:** `http://<host>:8080/api/auth`

| Método | Endpoint | Descrição | Payload Exemplo |
| :--- | :--- | :--- | :--- |
| **POST** | `/register` | Cadastra usuário. | `{ "email": "a@b.com", "password": "...", "role": "manager" }` |
| **POST** | `/login` | Retorna Token JWT. | `{ "email": "a@b.com", "password": "..." }` |
| **GET** | `/health` | Healthcheck. | - |

### 4.2 API WebSocket (Mensagens)
**URL:** `ws://<host>:8080/ws`

Eventos principais (JSON):
* `user_connect`: Handshake inicial (`{ "type": "user_connect", "userId": "..." }`).
* `message`: Envio de mensagem (`{ "type": "message", "content": "..." }`).
* `initialState`: Recebido ao conectar (traz mensagens antigas e hierarquia).

---

## 5. CONCLUSÃO

O desenvolvimento do Sistema de Chat Corporativo Distribuído atingiu com êxito todos os requisitos funcionais e não-funcionais. A arquitetura baseada em **Microsserviços** e **DynamoDB** permitiu implementar **Coordenação Atômica** e **Escalabilidade** robustas.

As métricas qualitativas indicam que o sistema é resiliente, recuperando-se autonomamente de quedas (via *Backoff* e *Healthchecks*) e mantendo a integridade dos dados sob alta concorrência. O projeto encontra-se documentado e pronto para implantação.