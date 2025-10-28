# Chat Empresarial com Sistemas Distribuídos

Este projeto é uma arquitetura de microsserviços modular desenvolvida para atender aos requisitos de Sistemas Distribuídos, focada em resiliência e concorrência.

O projeto migrou o componente de banco de dados para **Amazon DynamoDB**, cumprindo os requisitos de **Coordenação e Replicação** da Entrega 3.

---

## 🚀 Tecnologias Essenciais

* **Frontend**: React, TypeScript, Vite, TailwindCSS.
* **Backend**: Python, FastAPI, Uvicorn, Boto3 (SDK da AWS).
* **API Gateway**: Nginx.
* **Banco de Dados**: **DynamoDB Local** (para desenvolvimento e simulação de produção).
* **Orquestração**: Docker & Docker Compose.

---

## ⚙️ 1. Ambiente de Desenvolvimento (Foco no Hot Reload)

Use este modo para o desenvolvimento diário. Ele ativa o *Hot Reload* no frontend e backend, e usa um banco de dados local (`dynamodb-local`) para simular a produção sem custo.

### 🛠️ Pré-requisitos
1.  **Docker Desktop** (ou Docker Engine) instalado e rodando.
2.  **Python 3** e **PIP** (para rodar o script de povoamento `seed.py`).
3.  **Bibliotecas Python:** Instale `requests` e `boto3` localmente (necessário para o `seed.py`):
    ```bash
    pip install requests boto3
    ```

### 🏃 Passos para Execução

1.  **Abra o Terminal** na pasta raiz do projeto (`chat-distribuido`).
2.  **Inicie os Serviços:** Este comando utiliza o `docker-compose.dev.yml`, que agora sobe o ambiente completo com o **DynamoDB Local**.
    ```bash
    docker-compose -f docker-compose.dev.yml up --build
    ```

3.  **Popule o Banco de Dados (Seed):**
    * Abra um **segundo terminal**.
    * Rode o script (ele inicializará as tabelas no DynamoDB Local):
    ```bash
    python seed.py
    ```

4.  **Acesse a Aplicação:**
    Abra seu navegador e acesse:
    👉 **http://localhost:8080**

### 🛑 Para Parar o Ambiente Local

Use o terminal onde os contêineres estão rodando e pressione `Ctrl + C`.

---

## 🗺️ Diagramas de Arquitetura e Estrutura

Esta seção mostra a visão geral e a hierarquia da aplicação.

### 1. Diagrama de Arquitetura (Visão Geral de Microsserviços)

**Nota:** Este diagrama ilustra a arquitetura de contêineres e o fluxo através do API Gateway.



### 2. Fluxo de Dados e Componentes

**Nota:** Este diagrama foca na hierarquia de ícones e nos principais serviços.



---

## 🚨 Dicas para o Colaborador (Desenvolvimento)

- Se houver o erro de porta (`8080 already allocated`), use `docker-compose -f docker-compose.dev.yml down` para limpar.
- Para re-iniciar a codificação, certifique-se de usar sempre o comando `docker-compose -f docker-compose.dev.yml up --build`.