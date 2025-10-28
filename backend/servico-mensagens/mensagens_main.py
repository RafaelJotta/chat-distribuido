from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from pydantic import BaseModel
import json
from datetime import datetime
from typing import Dict, List, Set, Tuple
import boto3
from boto3.dynamodb.conditions import Key, Attr
from botocore.exceptions import ClientError
import os
from contextlib import asynccontextmanager

# --- Configuração do Banco de Dados ---
IS_LOCAL = os.getenv("IS_LOCAL", "false").lower() == "true"

if IS_LOCAL:
    print(">>> MODO DE DESENVOLVIMENTO: Conectando ao DynamoDB Local <<<")
    dynamodb = boto3.resource(
        'dynamodb',
        endpoint_url='http://dynamodb-local:8000',
        region_name='us-east-1',
        aws_access_key_id='dummykey',
        aws_secret_access_key='dummysecret'
    )
else:
    print(">>> MODO DE PRODUÇÃO: Conectando ao AWS DynamoDB <<<")
    dynamodb = boto3.resource('dynamodb', region_name='us-east-1')

HIERARQUIA_TABLE = dynamodb.Table('ChatHierarquia')
MENSAGENS_TABLE = dynamodb.Table('ChatMensagens')
READ_RECEIPTS_TABLE = dynamodb.Table('ChatReadReceipts')


# --- Lógica de Inicialização (Lifespan) ---
def create_table_if_not_exists(table_name, key_schema, attribute_definitions):
    try:
        dynamodb.create_table(
            TableName=table_name,
            KeySchema=key_schema,
            AttributeDefinitions=attribute_definitions,
            ProvisionedThroughput={'ReadCapacityUnits': 5, 'WriteCapacityUnits': 5}
        )
        print(f"Criando tabela '{table_name}', aguarde...")
        table = dynamodb.Table(table_name)
        table.wait_until_exists()
        print(f"Tabela '{table_name}' criada com sucesso.")
    except ClientError as e:
        if e.response['Error']['Code'] == 'ResourceInUseException':
            print(f"Tabela '{table_name}' já existe.")
        else:
            print(f"Erro inesperado ao criar tabela '{table_name}': {e}")
    except Exception as e:
        print(f"Erro geral ao criar tabela '{table_name}': {e}")

@asynccontextmanager
async def lifespan(app: FastAPI):
    if IS_LOCAL:
        print(">>> MODO LOCAL: Verificando/Criando tabela do serviço de mensagens...")
        create_table_if_not_exists(
            table_name='ChatMensagens',
            key_schema=[
                {'AttributeName': 'channelId', 'KeyType': 'HASH'}, 
                {'AttributeName': 'timestamp', 'KeyType': 'RANGE'}
            ],
            attribute_definitions=[
                {'AttributeName': 'channelId', 'AttributeType': 'S'},
                {'AttributeName': 'timestamp', 'AttributeType': 'S'}
            ]
        )
    yield
    print("Finalizando serviço de mensagens...")
# --- Fim do Lifespan ---

app = FastAPI(lifespan=lifespan)
active_connections: Dict[str, WebSocket] = {}

async def fetch_hierarchy_from_db():
    try:
        response = HIERARQUIA_TABLE.scan()
        return response.get('Items', [])
    except ClientError as e:
        print(f"Erro ao buscar hierarquia: {e}")
        return []

# ✅ *** CORREÇÃO DA LÓGICA DOS CANAIS *** ✅
def get_group_members_ids(channel_id: str, hierarchy: List[Dict]) -> List[str]:
    try: 
        role_group = channel_id.split("group-")[1] # ex: 'managers', 'supervisors'
    except IndexError: 
        return []
    
    target_roles = []
    # ✅ *** NOVO PASSO: Adiciona o canal 'directors' ***
    if role_group == 'directors':
        target_roles = ['director']
    elif role_group == 'managers':
        target_roles = ['manager', 'director']
    elif role_group == 'supervisors':
        target_roles = ['supervisor', 'manager', 'director']
    elif role_group == 'employees':
        target_roles = ['employee', 'supervisor', 'manager', 'director']
    else:
        return []

    member_ids = []
    def find_users_by_role(nodes: List[Dict]):
        for node in nodes:
            if node.get("role") in target_roles:
                member_ids.append(node["id"])
            if "children" in node and node["children"]:
                find_users_by_role(node["children"])
    
    find_users_by_role(hierarchy)
    print(f"Membros para {channel_id} (cargos: {target_roles}): {list(set(member_ids))}")
    return list(set(member_ids))


async def broadcast_status_update(user_id: str, status: str):
    message = {"type": "status_update", "payload": {"userId": user_id, "status": status}}
    for connection in active_connections.values():
        try: await connection.send_text(json.dumps(message))
        except Exception: pass

def update_statuses_in_hierarchy(nodes: List[Dict], online_users: List[str]):
    for node in nodes:
        node['status'] = 'online' if node['id'] in online_users else 'offline'
        if 'children' in node and node['children']:
            update_statuses_in_hierarchy(node['children'], online_users)

# ✅ *** CORREÇÃO DA LÓGICA DOS CANAIS *** ✅
async def fetch_initial_data(user_id: str, user_role: str) -> Tuple[List[Dict], Dict[str, int]]:
    """Busca histórico e calcula contagens de não lidos."""
    
    channels_to_query = ['general-chat']
    
    # ✅ *** NOVO PASSO: Adiciona 'directors' e ajusta a lógica ***
    if user_role == 'director':
        channels_to_query.extend(['group-directors', 'group-managers', 'group-supervisors', 'group-employees'])
    elif user_role == 'manager':
         # Gerente agora vê seu próprio canal
        channels_to_query.extend(['group-managers', 'group-supervisors', 'group-employees'])
    elif user_role == 'supervisor':
        channels_to_query.extend(['group-supervisors', 'group-employees'])
    elif user_role == 'employee':
        channels_to_query.append('group-employees')

    all_messages = []
    
    print(f"Buscando histórico (Query) para canais: {channels_to_query}")
    for channel in channels_to_query:
        try:
            response = MENSAGENS_TABLE.query(
                KeyConditionExpression=Key('channelId').eq(channel),
                Limit=50,
                ScanIndexForward=False
            )
            all_messages.extend(response.get('Items', []))
        except ClientError as e:
            print(f"Erro ao buscar mensagens para {channel}: {e}")

    print(f"Buscando histórico (Scan) de DMs para o usuário: {user_id}")
    try:
        response = MENSAGENS_TABLE.scan(
            FilterExpression=Attr('channelId').contains(user_id) & Attr('channelId').begins_with('private-')
        )
        all_messages.extend(response.get('Items', []))
    except ClientError as e:
        print(f"Erro ao escanear DMs: {e}")

    read_receipts = {}
    try:
        response = READ_RECEIPTS_TABLE.query(
            KeyConditionExpression=Key('userId').eq(user_id)
        )
        for item in response.get('Items', []):
            read_receipts[item['channelId']] = item['lastReadTimestamp']
    except ClientError as e:
        print(f"Erro ao buscar recibos de leitura: {e}")

    unread_counts = {}
    for msg in all_messages:
        channel_id = msg['channelId']
        if msg['senderId'] != user_id:
            last_read = read_receipts.get(channel_id)
            if not last_read or msg['timestamp'] > last_read:
                unread_counts[channel_id] = unread_counts.get(channel_id, 0) + 1

    unique_messages = {msg['id']: msg for msg in all_messages}.values()
    sorted_messages = sorted(list(unique_messages), key=lambda x: x['timestamp'])
    
    print(f"Encontradas {len(sorted_messages)} mensagens e {unread_counts} não lidas para {user_id}.")
    return sorted_messages, unread_counts


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    user_id = None
    try:
        initial_payload = await websocket.receive_json()
        
        if (initial_payload.get("type") == "user_connect" 
            and initial_payload.get("userId")
            and initial_payload.get("role")):

            user_id = initial_payload["userId"]
            user_role = initial_payload["role"]
            
            active_connections[user_id] = websocket
            await broadcast_status_update(user_id, "online")
            
            hierarchy_data = await fetch_hierarchy_from_db()
            update_statuses_in_hierarchy(hierarchy_data, list(active_connections.keys()))
            
            messages_data, unread_counts = await fetch_initial_data(user_id, user_role)
            
            initial_state = {
                "hierarchy": hierarchy_data, 
                "messages": messages_data,
                "unreadCounts": unread_counts
            }
            await websocket.send_text(json.dumps({"type": "initialState", "payload": initial_state}))
        else:
            print("Payload de conexão inicial inválido. Fechando conexão.")
            await websocket.close()
            return

        while True:
            data = await websocket.receive_text()
            message_data = json.loads(data)
            
            if message_data.get("type") == "mark_read":
                channel_id_to_mark = message_data.get("channelId")
                if user_id and channel_id_to_mark:
                    try:
                        READ_RECEIPTS_TABLE.put_item(
                            Item={
                                'userId': user_id,
                                'channelId': channel_id_to_mark,
                                'lastReadTimestamp': datetime.now().isoformat()
                            }
                        )
                        print(f"Usuário {user_id} marcou o canal {channel_id_to_mark} como lido.")
                    except ClientError as e:
                        print(f"Erro ao salvar recibo de leitura: {e}")

            elif message_data.get("type") == "message":
                message_data["id"] = f"msg-servidor-{datetime.now().timestamp()}"
                message_data["timestamp"] = datetime.now().isoformat()
                
                try:
                    MENSAGENS_TABLE.put_item(Item=message_data)
                except ClientError as e:
                    print(f"Erro ao salvar mensagem no DynamoDB: {e}")
                
                channel_id = message_data.get("channelId", "")
                sender_id = message_data.get("senderId")
                targets: Set[str] = set()
                
                if channel_id.startswith("group-"):
                    current_hierarchy = await fetch_hierarchy_from_db()
                    group_members = get_group_members_ids(channel_id, current_hierarchy)
                    for member_id in group_members: 
                        targets.add(member_id)
                
                elif channel_id.startswith("private-"):
                    parts = channel_id.replace("private-", "").split("-")
                    user1_id = "-".join(parts[:2])
                    user2_id = "-".join(parts[2:])
                    targets.add(user1_id)
                    targets.add(user2_id)

                elif channel_id == 'general-chat':
                    targets.update(active_connections.keys())
                        
                for target_id in targets:
                    if target_id != sender_id and target_id in active_connections:
                        try:
                            await active_connections[target_id].send_text(json.dumps(message_data))
                        except Exception as e:
                            print(f"ERRO ao enviar para {target_id}: {e}")

    except WebSocketDisconnect:
        if user_id and user_id in active_connections:
            del active_connections[user_id]
            await broadcast_status_update(user_id, "offline")

class UserInfo(BaseModel):
    id: str
    name: str
    role: str

@app.post("/internal/user-connected")
async def user_connected(info: UserInfo):
    return {"message": "Notification received"}