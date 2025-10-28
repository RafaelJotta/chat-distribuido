# Chat Empresarial com Inteligência Distribuída

Este projeto combina um frontend moderno e profissional, desenvolvido com **React + TypeScript + Vite**, com um backend robusto de microsserviços em **Python (FastAPI)**, orquestrado com **Docker Compose** e exposto através de um **API Gateway (Nginx)**.

O sistema é projetado para dois ambientes: um ambiente de **desenvolvimento local** (usando `docker-compose.dev.yml` e `dynamodb-local`) e um ambiente de **produção na nuvem** (usando `docker-compose.yml` e **Amazon DynamoDB**).

---

## 🚀 Tecnologias Principais

- **Frontend**: React 18, TypeScript, Vite, TailwindCSS, Lucide React
- **Backend**: Python, FastAPI (para `servico-autenticacao` e `servico-mensagens`)
- **API Gateway**: Nginx
- **Banco de Dados**:
    - **Produção**: Amazon DynamoDB
    - **Desenvolvimento**: `amazon/dynamodb-local` (via Docker)
- **Infraestrutura & DevOps**:
    - Docker & Docker Compose
    - **AWS (Amazon Web Services)**
        - **EC2** (para hospedar os contêineres)
        - **ECR** (para armazenar as imagens Docker)
        - **DynamoDB** (banco de dados NoSQL gerenciado)
        - **IAM** (para permissões do EC2)

---

## ⚙️ 1. Ambiente de Desenvolvimento (Na sua máquina local)

Use este modo para o dia a dia de trabalho. Ele ativa o *Hot Reload* do frontend e do backend, e usa um banco de dados local que roda em um contêiner.

1.  **Pré-requisitos:**
    * Docker Desktop instalado e rodando.
    * Python 3 instalado no seu PC (para rodar o script `seed.py`).
    * Instale as bibliotecas Python para o seed: `pip install boto3 requests`

2.  **Inicie os Contêineres:**
    (Este comando usa o `dynamodb-local` e o `nginx.conf` de desenvolvimento).
    ```bash
    docker-compose -f docker-compose.dev.yml up --build
    ```

3.  **Popule o Banco Local (Seed):**
    * Abra um **segundo terminal**.
    * Abra o arquivo `seed.py` no seu PC e verifique se a variável `TARGET_ENV` está definida como `"local"`.
    * Rode o script:
        ```bash
        python seed.py
        ```

4.  **Acesse a Aplicação:**
    Abra seu navegador e acesse `http://localhost:8080`.

---

## 📦 2. Ambiente de Produção (Implantado na AWS)

Este é o guia para implantar a aplicação na AWS, usando os serviços de produção (ECR, EC2, DynamoDB).

### Pré-requisitos na AWS (Configuração única)

1.  **ECR (Elastic Container Registry):** Crie 4 repositórios privados no ECR:
    * `chat-api-gateway`
    * `chat-servico-autenticacao`
    * `chat-servico-mensagens`
    * `chat-frontend`

2.  **DynamoDB:** Crie as 5 tabelas de produção (na região `us-east-1`):
    * `ChatContadores` (Chave: `role` [String])
    * `ChatHierarquia` (Chave: `id` [String])
    * `ChatUsuarios` (Chave: `email` [String])
    * `ChatMensagens` (Chave: `channelId` [String], Chave de Classificação: `timestamp` [String])
    * `ChatReadReceipts` (Chave: `userId` [String], Chave de Classificação: `channelId` [String])

3.  **EC2 (Servidor):**
    * Inicie uma instância `t2.micro` com **Amazon Linux 2023**.
    * **IAM Role:** Crie e anexe uma IAM Role à instância com as permissões: `AmazonDynamoDBFullAccess` e `AmazonEC2ContainerRegistryReadOnly` (ou `FullAccess` se você for fazer o build no EC2).
    * **Security Group:** Abra as portas `SSH (22)` (para seu IP) e `HTTP (8080)` (para `0.0.0.0/0`).

### Passos de Implantação

#### A. Na sua Máquina LOCAL (Windows/PowerShell)

1.  **Atualize os Arquivos:**
    * Certifique-se que o `docker-compose.yml` aponta para os seus repositórios ECR corretos.
    * Certifique-se que o `api-gateway/nginx.conf` aponta o `proxy_pass` do `frontend` para `http://frontend:80;` (e não `5173`).

2.  **Faça o Login no ECR:**
    ```bash
    aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 151567229120.dkr.ecr.us-east-1.amazonaws.com
    ```

3.  **Construa as Imagens de Produção:**
    ```bash
    docker compose -f docker-compose.yml build
    ```

4.  **Envie as Imagens para o ECR:**
    ```bash
    docker compose -f docker-compose.yml push
    ```

#### B. No seu Servidor EC2 (Via SSM Session Manager)

1.  **Instale Docker e Docker Compose:**
    ```bash
    sudo yum update -y
    sudo yum install docker -y
    sudo service docker start
    sudo usermod -aG docker ec2-user
    # Instala o Compose V1 (com hífen)
    sudo curl -L "[https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname](https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname) -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    # SAIA E RECONECTE no SSM para as permissões do Docker funcionarem
    ```

2.  **Faça o Login no ECR (no servidor):**
    ```bash
    aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 151567229120.dkr.ecr.us-east-1.amazonaws.com
    ```

3.  **Transfira seus arquivos (`.zip` ou Git) e entre na pasta:**
    ```bash
    # Ex: scp -i ... (do seu PC)
    # Ex: unzip chat-distribuido.zip (no EC2)
    cd chat-distribuido
    ```

4.  **Inicie a Aplicação:**
    (Use `docker-compose` com hífen)
    ```bash
    docker-compose pull
    docker-compose up -d
    ```

5.  **Popule o Banco de Dados (Primeira Vez):**
    * Instale o Python: `sudo yum install python3-pip -y`
    * Instale as bibliotecas: `pip3 install boto3 requests`
    * Certifique-se que seu `seed.py` é a versão de produção (sem `DYNAMO_ENDPOINT`).
    * Execute o seed:
        ```bash
        python3 seed.py
        ```

6.  **Acesse a Aplicação:**
    Abra seu navegador e acesse:
    👉 **`http://<SEU_IP_PÚBLICO_EC2>:8080`**

---

## 🔐 Credenciais de Login (Padrão do Seed)

-   **Email:** `adm@empresa.com`
-   **Senha:** `adm`

## 🎨 Diagramas de Arquitetura

<img width="716" height="743" alt="DiagramaEntrega2ICONES" src="https://github.com/user-attachments/assets/9c86b121-bfba-4cd4-ac8e-1f3b5e719966" />