# 📅 Entrega 1: Definição e Planejamento
**Data:** 05/09/2025

## 1. Escopo e Tema
O projeto consiste em um **Sistema de Chat Corporativo Hierárquico**. Diferente de chats convencionais, este sistema impõe regras de visibilidade baseadas em cargos (Diretor, Gerente, Supervisor, Funcionário), exigindo um controle rigoroso de estado e permissões distribuídas.

## 2. Decisões de Arquitetura

Optou-se pelo padrão de **Microsserviços** para garantir desacoplamento e escalabilidade independente.

### Diagrama de Componentes
* **Cliente (Browser):** Interage apenas com a porta 8080.
* **API Gateway (Nginx):** Ponto único de entrada. Resolve o problema de CORS e oculta a topologia da rede interna (Transparência de Localização).
* **Service Discovery:** Utilização do DNS interno do Docker (`resolver 127.0.0.11`) para comunicação entre contêineres.

### Quadro de Seleção de Tecnologias

| Componente | Tecnologia | Justificativa |
| :--- | :--- | :--- |
| **Linguagem Backend** | Python 3.10+ | Suporte robusto a assincronismo (`asyncio`) necessário para WebSockets. |
| **Framework** | FastAPI | Alta performance (ASGI) e validação automática de dados (Pydantic). |
| **Frontend** | React + Vite | Renderização eficiente de listas grandes (mensagens) e ecossistema rico. |
| **Gateway** | Nginx | Leve, eficiente para conexões concorrentes e fácil configuração de Proxy Reverso. |

## 3. Divisão de Responsabilidades

1.  **Serviço de Autenticação:** Responsável estritamente por identificar "quem é quem" (Login/Registro).
2.  **Serviço de Mensagens:** Responsável por rotear dados em tempo real. Não acessa tabela de senhas.
3.  **Frontend:** Responsável pela apresentação e manutenção do estado local da conexão.