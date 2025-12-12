# 📅 Entrega 3: Coordenação, Nomeação e Consistência
**Data:** 24/10/2025

## 1. Migração para Amazon DynamoDB

Para atender aos requisitos de consistência e disponibilidade distribuída, a persistência de dados foi migrada de arquivos locais/memória para o **Amazon DynamoDB**.

* **Tecnologia:** Banco NoSQL gerenciado (Serverless).
* **Particionamento:** Dados distribuídos baseados em chaves de partição (`PK`) eficientes (ex: `channelId` para mensagens e `email` para usuários).
* **Replicação:** O DynamoDB replica dados automaticamente em 3 Zonas de Disponibilidade (AZs) dentro da região `us-east-1`.

## 2. Algoritmos de Coordenação e Concorrência

Implementamos mecanismos para garantir a integridade dos dados sob alta concorrência sem utilizar *locks* globais de aplicação (que degradariam a performance).

### A. Exclusão Mútua (Cadastro Único)
Utilizamos **Escritas Condicionais** (Optimistic Locking) para garantir que dois usuários não cadastrem o mesmo e-mail simultaneamente.
* **Implementação:** No método `put_item`, adicionamos a condição `ConditionExpression='attribute_not_exists(email)'`.
* **Resultado:** O banco de dados serializa as requisições. Se houver colisão, a segunda tentativa falha atomicamente com `ConditionalCheckFailedException`, garantindo consistência.

### B. Contadores Atômicos (Geração de IDs)
Para gerar IDs sequenciais (`dir-1`, `man-2`) em um ambiente distribuído, não podemos "ler, somar e salvar". Usamos a operação `UpdateItem` com incremento atômico:
* **Lógica:** `SET count = count + 1 RETURNING NEW`.
* **Resultado:** Garante unicidade dos IDs sem *Race Conditions*.

## 3. Esquema de Nomeação

Adotamos uma nomeação hierárquica e semântica para facilitar o roteamento de mensagens ("Routing based on naming"):

| Tipo de Recurso | Padrão de Nome | Exemplo | Descrição |
| :--- | :--- | :--- | :--- |
| **Canais de Grupo** | `group-{role}` | `group-managers` | O sistema infere permissão de acesso apenas lendo o nome do recurso. |
| **Canais Privados** |