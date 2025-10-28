# 📄 Relatório Técnico Parcial (Entrega 3)

**Data de Referência:** 28/10/2025

**Escopo:** Documentação das implementações de Coordenação, Nomeação e Consistência/Replicação, conforme o cronograma do trabalho prático.

---

## 1. MUDANÇA DE ARQUITETURA E TECNOLOGIAS (Requisito 6 - Base)

A arquitetura de dados foi migrada do MongoDB local para o Amazon DynamoDB, visando o cumprimento dos requisitos de resiliência e consistência da Entrega 3.

* **Tecnologia Adotada:** Amazon DynamoDB (Serviço Gerenciado).
* **Separação Lógica:** O DynamoDB foi dividido em 5 tabelas distintas, seguindo o padrão *Database per Service* e *Context Bounded* (ex: `ChatUsuarios` para autenticação e `ChatMensagens` para o chat).

---

## 2. IMPLEMENTAÇÃO DE REQUISITOS (Entrega 3)

### A. Coordenação (Requisito 4)

Implementamos dois mecanismos atômicos de coordenação para garantir a integridade dos dados sob concorrência.

#### A.1. Exclusão Mútua (Cadastro de E-mails)
* **Objetivo:** Garantir que dois usuários não possam se cadastrar simultaneamente com o mesmo e-mail.
* **Mecanismo:** Utilizamos a funcionalidade de **Escritas Condicionais** do DynamoDB na operação `put_item` (dentro de `servico-autenticacao`).
    ```python
    # Trecho do Código (autenticacao_main.py)
    USUARIOS_TABLE.put_item(
        Item=user_document,
        # A operação SÓ tem sucesso se o atributo 'email' ainda não existir (atomicidade)
        ConditionExpression='attribute_not_exists(email)' 
    )
    ```

#### A.2. Contadores Atômicos (Geração de IDs)
* **Objetivo:** Gerar IDs sequenciais e únicos (`dir-1`, `man-2`, etc.) sem falhar sob concorrência (evitando a *race condition* de ler e depois escrever).
* **Mecanismo:** Utilizamos a operação atômica `UpdateItem` do DynamoDB na tabela `ChatContadores` para incrementar o valor de forma segura antes de atribuir o ID ao novo usuário.

---

### B. Consistência e Replicação (Requisito 6)

#### B.1. Replicação de Dados
* **Mecanismo:** A replicação é fornecida nativamente pela AWS. O DynamoDB replica automaticamente todos os dados em **três Zonas de Disponibilidade (AZs)** dentro da região.
* **Status:** Implementado por configuração e uso de serviço gerenciado.

#### B.2. Modelo de Consistência Adotado
* **Definição:** Adotamos o modelo de **Consistência Eventual** (Eventually Consistent) para a maioria das leituras (mensagens e status).
* **Justificativa:** Priorizamos a **baixa latência** e a **disponibilidade** (Time-to-Market) do sistema de chat. Para o usuário, é mais importante ver o feed do chat imediatamente do que esperar a garantia de consistência global total.

---

### C. Nomeação (Requisito 5)

Aplicamos um esquema de nomes coeso e hierárquico para recursos e serviços.

| Recurso | Esquema de Nomes | Exemplo |
|---|---|---|
| **Serviços** | DNS Interno do Docker | `http://servico-autenticacao:18080` |
| **Usuários** | Prefixo de Cargo + Contador Atômico | `dir-1`, `man-2`, `emp-5` |
| **Canais Privados** | Conciliação de IDs de Usuários | `private-dir-1-man-2` |
| **Canais de Grupo**| Nome Lógico de Cargo | `group-directors`, `group-managers` |

---

## 3. MELHORIAS E AJUSTES DE LÓGICA (Corrigidos para esta Entrega)

#### A. Permissões de Cadastro e Canais
* **Permissões:** A lógica no `RegisterUserModal.tsx` e no backend foi ajustada para seguir a hierarquia correta: **Diretor** pode cadastrar qualquer cargo, **Gerente** pode cadastrar Supervisores e Funcionários, **Supervisor** só Funcionários.
* **Canais:** A lógica do `servico-mensagens` foi expandida para incluir o canal `group-directors` e garantir que membros (como Gerentes e Diretores) vejam seus respectivos canais.

#### B. Persistência e Notificações de Mensagens
* **Notificações Persistentes:** Implementamos a persistência de "status de leitura" na tabela `ChatReadReceipts`. O contador de mensagens não lidas não é mais perdido ao recarregar a página.
* **Experiência de Mensagens:** A mensagem enviada agora aparece instantaneamente na tela do remetente (UI Otimista), e os contadores de mensagens não lidas aparecem corretamente no Diretório e nas Conversas Recentes.