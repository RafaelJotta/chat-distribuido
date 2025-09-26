# Chat Empresarial com Inteligência Distribuída

Este projeto combina um frontend moderno e profissional, desenvolvido com **React + TypeScript + Vite**, com um backend robusto de microsserviços em **Python (FastAPI)**, orquestrado com **Docker Compose** e exposto através de um **API Gateway (Nginx)**.

---

## 🚀 Tecnologias

- **Frontend**: React 18, TypeScript, Vite, TailwindCSS, Lucide React
- **Backend**: Python, FastAPI, Uvicorn
- **API Gateway**: Nginx
- **Orquestração**: Docker & Docker Compose

---

## ⚙️ Como Executar o Projeto Completo

**Pré-requisitos:**
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) instalado e em execução.
- [Node.js](https://nodejs.org/) >= 18 (para o seu editor de código entender o TypeScript).

**Passos:**

1.  **Crie a Estrutura de Pastas:** Crie todas as pastas e arquivos exatamente como descrito no guia.
2.  **Abra o Terminal:** Navegue até a pasta raiz do projeto (`chat-distribuido`).
3.  **Execute o Docker Compose:**
    ```bash
    docker-compose up --build
    ```
    Na primeira vez, o Docker irá baixar e construir todas as imagens. Isso pode levar alguns minutos. Nas próximas vezes, será bem mais rápido.

4.  **Acesse a Aplicação:**
    Abra seu navegador e acesse:
    👉 **http://localhost:8080**

**Credenciais para Login:**
- **Email:** `adm@empresa.com`
- **Senha:** `adm`

---

## 🛠️ Para Parar a Aplicação

1.  Vá para o terminal onde os contêineres estão rodando.
2.  Pressione `Ctrl + C`.
3.  (Opcional) Para remover os contêineres e a rede, rode: `docker-compose down`.

## ⚙️ Como Executar o Projeto

Existem dois modos para executar este projeto: **Desenvolvimento** (recomendado para codificar) e **Produção** (para simular o ambiente final).

### 🚀 Modo de Desenvolvimento (Recomendado)

Use este modo para o dia a dia de trabalho. Ele ativa o *Hot Reload*, que atualiza a aplicação automaticamente no navegador sempre que você salva uma alteração nos arquivos, tornando o desenvolvimento muito mais rápido.

Para iniciar, execute o comando:

```bash
docker-compose -f docker-compose.dev.yml up --build
```

### 📦 Modo de Produção

Use este modo para testar a versão final e otimizada do projeto, como se ele estivesse implantado na nuvem. Neste modo, as alterações no código não são refletidas automaticamente.

Para iniciar, execute o comando:

```bash
docker-compose up --build
```

Em ambos os modos, a aplicação estará disponível no seu navegador em:<br>
👉 **http://localhost:8080**

### Para parar a aplicação

- Vá para o terminal onde os contêineres estão rodando.
- Pressione `Ctrl + C`.

<img width="3374" height="3840" alt="DiagramaEntrega2" src="https://github.com/user-attachments/assets/fc646b1c-5098-4d3c-b3ba-68c1506e446c" />

