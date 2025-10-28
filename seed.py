import requests
import json
import time
import boto3 # NOVO
from datetime import datetime, timedelta # NOVO

# --- Configuração ---
BASE_URL = "http://localhost:8080" # API Gateway
DYNAMO_ENDPOINT = 'http://localhost:8000' # DynamoDB Local (da porta no docker-compose.dev.yml)
MENSAGENS_TABLE_NAME = 'ChatMensagens'

# Os IDs (dir-1, man-1) agora vêm dos contadores atômicos no DynamoDB
users_to_create = [
    {"email": "adm@empresa.com", "password": "adm", "name": "Thiago Caproni", "role": "director", "manager_id": None},
    {"email": "alessandro@empresa.com", "password": "123", "name": "Alessandro Augusto", "role": "manager", "manager_id": "dir-1"},
    {"email": "rafael@empresa.com", "password": "123", "name": "Rafael Jotta", "role": "manager", "manager_id": "dir-1"},
    {"email": "amando@empresa.com", "password": "123", "name": "Amando Luiz", "role": "manager", "manager_id": "dir-1"},
]

# NOVO: Mensagens para popular o canal 'general-chat'
# Note que os senderId correspondem aos IDs que serão gerados pelos contadores
messages_to_create = [
    {
        "id": "msg-seed-1",
        "channelId": "general-chat",
        "senderId": "dir-1",
        "senderName": "Thiago Caproni",
        "senderRole": "director",
        "content": "Olá equipe, bem-vindos ao novo sistema de chat!",
        "priority": "normal",
        "timestamp": (datetime.now() - timedelta(minutes=5)).isoformat()
    },
    {
        "id": "msg-seed-2",
        "channelId": "general-chat",
        "senderId": "man-1", # Alessandro
        "senderName": "Alessandro Augusto",
        "senderRole": "manager",
        "content": "Parabéns pelo lançamento, Thiago! Parece ótimo.",
        "priority": "normal",
        "timestamp": (datetime.now() - timedelta(minutes=3)).isoformat()
    },
    {
        "id": "msg-seed-3",
        "channelId": "general-chat",
        "senderId": "dir-1",
        "senderName": "Thiago Caproni",
        "senderRole": "director",
        "content": "Temos uma reunião de alinhamento amanhã. Por favor, confirmem a presença.",
        "priority": "urgent",
        "timestamp": (datetime.now() - timedelta(minutes=1)).isoformat()
    }
]

def seed_users():
    print("--- Iniciando Povoamento de Usuários (via API) ---")
    for user in users_to_create:
        try:
            # O endpoint é /api/auth/register por causa do Nginx
            response = requests.post(f"{BASE_URL}/api/auth/register", json=user)
            if 200 <= response.status_code < 300:
                print(f"Usuário '{user['name']}' criado com sucesso.")
            else:
                print(f"Erro ao criar usuário '{user['name']}': {response.status_code} - {response.text}")
        except requests.exceptions.RequestException as e:
            print(f"Não foi possível conectar ao serviço de autenticação: {e}")

# NOVO: Função para popular mensagens direto no DynamoDB Local
def seed_messages():
    print("\n--- Iniciando Povoamento de Mensagens (via Boto3) ---")
    try:
        # Conecta ao DynamoDB Local na porta 8000
        dynamodb = boto3.resource(
            'dynamodb',
            endpoint_url=DYNAMO_ENDPOINT,
            region_name='us-east-1',
            aws_access_key_id='dummykey',
            aws_secret_access_key='dummysecret'
        )
        table = dynamodb.Table(MENSAGENS_TABLE_NAME)
        
        with table.batch_writer() as batch:
            for msg in messages_to_create:
                batch.put_item(Item=msg)
                print(f"Mensagem de '{msg['senderName']}' adicionada.")
        print("Povoamento de mensagens concluído.")
    except Exception as e:
        print(f"Erro ao popular mensagens no DynamoDB Local: {e}")
        print("Certifique-se que o container 'dynamodb-local' está rodando.")

def seed_database():
    print("Aguardando os serviços subirem... (10s)")
    time.sleep(10) # Dá um tempo para os containers iniciarem
    
    seed_users()
    seed_messages()

if __name__ == "__main__":
    seed_database()