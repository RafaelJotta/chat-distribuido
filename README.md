# Frontend - Chat Distribuído

Este é o frontend do projeto **Chat Distribuído**, desenvolvido com **React + TypeScript**, utilizando **Vite** como bundler e **TailwindCSS** para estilização.  
O projeto também faz uso de ícones com **Lucide React** e possui integração preparada com **Supabase**.

---

## 🚀 Tecnologias utilizadas

- [React 18](https://react.dev/) – Biblioteca para construção da interface.
- [TypeScript](https://www.typescriptlang.org/) – Superset tipado do JavaScript.
- [Vite](https://vitejs.dev/) – Ferramenta de build e servidor de desenvolvimento rápido.
- [TailwindCSS](https://tailwindcss.com/) – Framework utilitário para estilização.
- [Lucide React](https://lucide.dev/) – Biblioteca de ícones em React.
- [Supabase JS](https://supabase.com/) – Cliente para integração com backend em Supabase.

---

## 📦 Pré-requisitos

- [Node.js](https://nodejs.org/) **>= 18**  
- [npm](https://www.npmjs.com/) (já vem junto com o Node)

---

## ⚙️ Instalação e execução

1. Instale as dependências:
    ```bash
    npm install
    ```
2. Inicie o servidor de desenvolvimento:
    ```bash
    npm run dev
    ```
    O site estará disponível em:  
    👉 http://localhost:5173

---

## 🛠️ Scripts disponíveis

- `npm run dev` → Inicia o servidor de desenvolvimento.
- `npm run build` → Cria a build otimizada para produção (saída em `/dist`).
- `npm run preview` → Roda um servidor local para visualizar a build final.
- `npm run lint` → Executa o ESLint para análise do código.

---

## 📂 Estrutura recomendada

```
Frontend/
├── src/               # Código-fonte do projeto
├── public/            # Arquivos estáticos públicos
├── package.json       # Configurações e dependências
├── tsconfig.json      # Configuração do TypeScript
├── tailwind.config.js
└── vite.config.ts
```

---

## 📝 Observações

- A pasta `node_modules/` não deve ser versionada (já está no `.gitignore`).
- Para instalar novas dependências, use:
  ```bash
  npm install nome-da-biblioteca
  ```

---

## 🔗 Integração com o backend distribuído

A comunicação entre o frontend e o backend distribuído será realizada via **API REST** e/ou **WebSockets**, permitindo o envio e recebimento de mensagens em tempo real. A integração está preparada para utilizar o Supabase como backend, mas pode ser adaptada conforme a arquitetura do sistema distribuído.

---
