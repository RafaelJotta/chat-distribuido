import requests
import json
import time
import boto3
from datetime import datetime, timedelta
# ✅ *** NOVO: Importa a classe de erro do Boto3 ***
from botocore.exceptions import ClientError 

# --- Configuração ---

# ✅ *** SEU INTERRUPTOR: Mude esta linha *** ✅
# Mude para "production" para popular o banco da AWS (EC2).
# Mude para "local" para popular o seu banco local (Docker).
TARGET_ENV = "local"
# ----------------------------------------------------

# ❗️❗️ Coloque o IP público do seu servidor EC2 aqui
# (Este é o IP que você acessa no navegador, ex: 54.221.74.94)
YOUR_EC2_IP = "54.221.74.94" 

# --- Definições de Ambiente (Não mexa aqui) ---
MENSAGENS_TABLE_NAME = 'ChatMensagens'
CONTADORES_TABLE_NAME = 'ChatContadores' # Necessário para o init_counters
DYNAMO_ARGS = {}
BASE_URL = ""

if TARGET_ENV == "local":
    print(">>> ALVO: Ambiente LOCAL (http://localhost:8000)")
    BASE_URL = "http://localhost:8080" # API Gateway Local
    DYNAMO_ARGS = {
        'endpoint_url': 'http://localhost:8000',
        'region_name': 'us-east-1',
        'aws_access_key_id': 'dummykey',
        'aws_secret_access_key': 'dummysecret'
    }
else:
    print(f">>> ALVO: Ambiente de PRODUÇÃO ({YOUR_EC2_IP})")
    BASE_URL = f"http://{YOUR_EC2_IP}:8080" # API Gateway na AWS
    DYNAMO_ARGS = {
        'region_name': 'us-east-1'
        # (O Boto3 vai usar as credenciais do seu 'aws configure' local)
    }

# --- Listas de Usuários e Mensagens (sem alteração) ---
users_to_create = [
    {"email": "adm@empresa.com", "password": "adm", "name": "Thiago Caproni", "role": "director", "manager_id": None},
    {"email": "alessandro@empresa.com", "password": "123", "name": "Alessandro Augusto", "role": "manager", "manager_id": "dir-1"},
    {"email": "rafael@empresa.com", "password": "123", "name": "Rafael Jotta", "role": "manager", "manager_id": "dir-1"},
    {"email": "amando@empresa.com", "password": "123", "name": "Amando Luiz", "role": "manager", "manager_id": "dir-1"},
]

messages_to_create = [
    {
        "id": "msg-seed-1", "channelId": "general-chat", "senderId": "dir-1",
        "senderName": "Thiago Caproni", "senderRole": "director",
        "content": f"Olá equipe, bem-vindos ao sistema de chat no ambiente ({TARGET_ENV})!",
        "priority": "normal", "timestamp": (datetime.now() - timedelta(minutes=5)).isoformat()
    },
    {
        "id": "msg-seed-2", "channelId": "general-chat", "senderId": "man-1",
        "senderName": "Alessandro Augusto", "senderRole": "manager",
        "content": "Parabéns pelo lançamento! Parece ótimo.",
        "priority": "normal", "timestamp": (datetime.now() - timedelta(minutes=3)).isoformat()
    }
]

# ✅ *** NOVO: Função 'init_counters' (Funciona em ambos os ambientes) ***
def init_counters():
    """Inicializa os contadores no DynamoDB"""
    print(f"--- Inicializando Contadores ({TARGET_ENV}) ---")
    try:
        # Usa os DYNAMO_ARGS corretos para o ambiente
        dynamodb = boto3.resource('dynamodb', **DYNAMO_ARGS)
        table = dynamodb.Table(CONTADORES_TABLE_NAME)
        roles = ['director', 'manager', 'supervisor', 'employee']
        
        with table.batch_writer() as batch:
            for role in roles:
                batch.put_item(Item={'role': role, 'count': 0})
        print("Contadores inicializados com 0.")
    except ClientError as e:
        if e.response['Error']['Code'] == 'ResourceNotFoundException':
            print(f"ERRO: Tabela '{CONTADORES_TABLE_NAME}' não encontrada.")
        else:
            print(f"Aviso ao inicializar contadores (talvez já existam): {e}")
    except Exception as e:
        print(f"Erro ao inicializar contadores: {e}")

def seed_users():
    print(f"--- Iniciando Povoamento de Usuários ({TARGET_ENV}) ---")
    for user in users_to_create:
        try:
            # BASE_URL será 'localhost:8080' ou 'SEU_IP:8080'
            response = requests.post(f"{BASE_URL}/api/auth/register", json=user)
            if 200 <= response.status_code < 300:
                print(f"Usuário '{user['name']}' criado com sucesso.")
            else:
                print(f"Aviso/Erro ao criar usuário '{user['name']}': {response.status_code} - {response.text}")
        except requests.exceptions.RequestException as e:
            print(f"Não foi possível conectar ao serviço de autenticação em {BASE_URL}: {e}")

# ✅ *** CORRIGIDO: Função 'seed_messages' (Usa DYNAMO_ARGS) ***
def seed_messages():
    print(f"\n--- Iniciando Povoamento de Mensagens ({TARGET_ENV}) ---")
    try:
        # Usa os DYNAMO_ARGS corretos para o ambiente
        dynamodb = boto3.resource('dynamodb', **DYNAMO_ARGS)
        table = dynamodb.Table(MENSAGENS_TABLE_NAME)
        
        with table.batch_writer() as batch:
            for msg in messages_to_create:
                batch.put_item(Item=msg)
                print(f"Mensagem de '{msg['senderName']}' adicionada.")
        print("Povoamento de mensagens concluído.")
    except ClientError as e:
        if e.response['Error']['Code'] == 'ResourceNotFoundException':
             print(f"ERRO: Tabela '{MENSAGENS_TABLE_NAME}' não encontrada! Verifique o console da AWS ou o docker-compose.dev.yml.")
        else:
            print(f"Erro ao popular mensagens no DynamoDB: {e}")
    except Exception as e:
        print(f"Erro ao popular mensagens no DynamoDB: {e}")


# ✅ *** CORRIGIDO: 'seed_database' (Chama init_counters) ***
def seed_database():
    print(f"Aguardando os serviços subirem... (10s)")
    time.sleep(10)
    
    init_counters() # Primeiro, zera/cria os contadores
    seed_users()    # Segundo, cria os usuários
    seed_messages() # Terceiro, adiciona mensagens

if __name__ == "__main__":
    seed_database()