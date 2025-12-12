# 💬 Chat Corporativo Distribuído

Sistema de comunicação em tempo real baseado em microsserviços, desenvolvido para a disciplina de **Sistemas Distribuídos**. O projeto implementa conceitos de transparência, escalabilidade, coordenação distribuída e tolerância a falhas.

---

## 🚀 Tecnologias e Arquitetura

O sistema segue uma arquitetura de microsserviços conteinerizada:

* **Frontend:** React, TypeScript, Vite, TailwindCSS (SPA).
* **Backend de Autenticação:** Python FastAPI (REST, JWT, Bcrypt).
* **Backend de Mensagens:** Python FastAPI (WebSockets, Async).
* **API Gateway:** Nginx (Reverse Proxy & Load Balancing).
* **Banco de Dados:** Amazon DynamoDB (NoSQL, Alta Disponibilidade).
* **Orquestração:** Docker & Docker Compose.

---

## ⚙️ Como Executar (Ambiente de Desenvolvimento)

### Pré-requisitos
* Docker & Docker Compose.
* Python 3 + Pip (para script de seed).

### Passo a Passo

1.  **Subir os Contêineres:**
    Execute o ambiente completo (incluindo DynamoDB Local):
    ```bash
    docker-compose -f docker-compose.dev.yml up --build
    ```

2.  **Popular o Banco de Dados (Seed):**
    Em outro terminal, instale as dependências e rode o script para criar tabelas e usuários iniciais:
    ```bash
    pip install requests boto3
    python seed.py
    ```

3.  **Acessar a Aplicação:**
    Acesse via navegador: **http://localhost:8080**

---

## 🧪 Contas para Teste (Geradas pelo Seed)

| Role       | Email                 | Senha | Permissões |
| :---       | :---                  | :---  | :--- |
| **Diretor**| `director@corp.com`   | `123` | Acesso total a todos os canais. |
| **Gerente**| `manager@corp.com`    | `123` | Acesso a canais de gerência e abaixo. |
| **Func.** | `employee@corp.com`   | `123` | Acesso apenas ao canal geral e de funcionários. |

---

## 📂 Estrutura do Projeto

* `/api-gateway`: Configurações do Nginx.
* `/backend`: Microsserviços Python (Autenticação e Mensagens).
* `/frontend`: Aplicação React.
* `docker-compose.yml`: Orquestração para produção (AWS).
* `docker-compose.dev.yml`: Orquestração para desenvolvimento local.