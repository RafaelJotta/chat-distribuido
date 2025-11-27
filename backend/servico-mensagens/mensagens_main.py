from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request # <--- NOVO: Request
from pydantic import BaseModel
import json
from datetime import datetime
from typing import Dict, List, Set, Tuple
import boto3
from boto3.dynamodb.conditions import Key, Attr
from botocore.exceptions import ClientError
import os
from contextlib import asynccontextmanager
import time # <--- NOVO: time


def connect_with_retry(max_retries: int = 3, delay_seconds: int = 2):
    """Tenta criar o recurso DynamoDB com retries simples.

    Esta função melhora a tolerância a falhas operacionais ao lidar com cenários em que o
    DynamoDB Local ou o serviço AWS ainda está inicializando ou momentaneamente indisponível.
    Em vez de falhar imediatamente na primeira tentativa de conexão, o serviço de mensagens
    aguarda alguns segundos e tenta novamente, até o limite configurado de tentativas.

    Se todas as tentativas falharem, a exceção é propagada para que o FastAPI registre o erro
    e o container possa ser reiniciado pelo orquestrador (ex.: Docker Compose), mantendo o
    comportamento atual de falha visível, porém com maior resiliência a falhas transitórias.
    """

    last_exception = None

    for attempt in range(1, max_retries + 1):
        try:
            if IS_LOCAL:
                print(f"[DynamoDB][Tentativa {attempt}/{max_retries}] Conectando ao DynamoDB Local...")
                return boto3.resource(
                    'dynamodb',
                    endpoint_url='http://dynamodb-local:8000',
                    region_name='us-east-1',
                    aws_access_key_id='dummykey',
                    aws_secret_access_key='dummysecret'
                )
            else:
                print(f"[DynamoDB][Tentativa {attempt}/{max_retries}] Conectando ao AWS DynamoDB...")
                return boto3.resource('dynamodb', region_name='us-east-1')
        except Exception as exc:
            last_exception = exc
            print(f"[DynamoDB][ERRO] Falha ao conectar (tentativa {attempt}/{max_retries}): {exc}")

            if attempt < max_retries:
                print(f"[DynamoDB] Aguardando {delay_seconds}s antes de tentar novamente...")
                time.sleep(delay_seconds)

    print("[DynamoDB][FALHA] Todas as tentativas de conexão ao DynamoDB falharam. Abortando inicialização do serviço de mensagens.")
    raise last_exception if last_exception else RuntimeError("Falha desconhecida ao conectar ao DynamoDB")

# --- Configuração do Banco ---
IS_LOCAL = os.getenv("IS_LOCAL", "false").lower() == "true"

if IS_LOCAL:
    print(">>> MODO DE DESENVOLVIMENTO: Conectando ao DynamoDB Local (com retry) <<<")
else:
    print(">>> MODO DE PRODUÇÃO: Conectando ao AWS DynamoDB (com retry) <<<")

# A inicialização do recurso DynamoDB agora passa por um mecanismo de retry simples,
# reduzindo falhas causadas por atrasos temporários na disponibilidade do DynamoDB.
dynamodb = connect_with_retry()

HIERARQUIA_TABLE = dynamodb.Table('ChatHierarquia')
MENSAGENS_TABLE = dynamodb.Table('ChatMensagens')
READ_RECEIPTS_TABLE = dynamodb.Table('ChatReadReceipts')

# --- Lifespan ---
def create_table_if_not_exists(table_name, key_schema, attribute_definitions):
    try:
        dynamodb.create_table(TableName=table_name, KeySchema=key_schema, AttributeDefinitions=attribute_definitions, ProvisionedThroughput={'ReadCapacityUnits': 5, 'WriteCapacityUnits': 5})
        table = dynamodb.Table(table_name)
        table.wait_until_exists()
    except ClientError: pass

@asynccontextmanager
async def lifespan(app: FastAPI):
    if IS_LOCAL:
        create_table_if_not_exists('ChatMensagens', [{'AttributeName': 'channelId', 'KeyType': 'HASH'}, {'AttributeName': 'timestamp', 'KeyType': 'RANGE'}], [{'AttributeName': 'channelId', 'AttributeType': 'S'}, {'AttributeName': 'timestamp', 'AttributeType': 'S'}])
    yield

app = FastAPI(lifespan=lifespan)
active_connections: Dict[str, WebSocket] = {}

# ✅ NOVO: Middleware de Logs
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    print(f"LOG [MENSAGENS]: {request.method} {request.url.path} - Status: {response.status_code} - Tempo: {process_time:.4f}s")
    return response

async def fetch_hierarchy_from_db():
    try:
        response = HIERARQUIA_TABLE.scan()
        return response.get('Items', [])
    except ClientError: return []

def get_group_members_ids(channel_id: str, hierarchy: List[Dict]) -> List[str]:
    try: role_group = channel_id.split("group-")[1]
    except IndexError: return []
    
    target_roles = []
    if role_group == 'directors': target_roles = ['director']
    elif role_group == 'managers': target_roles = ['manager', 'director']
    elif role_group == 'supervisors': target_roles = ['supervisor', 'manager', 'director']
    elif role_group == 'employees': target_roles = ['employee', 'supervisor', 'manager', 'director']
    else: return []

    member_ids = []
    def find_users_by_role(nodes: List[Dict]):
        for node in nodes:
            if node.get("role") in target_roles: member_ids.append(node["id"])
            if "children" in node and node["children"]: find_users_by_role(node["children"])
    
    find_users_by_role(hierarchy)
    return list(set(member_ids))

async def broadcast_status_update(user_id: str, status: str):
    message = {"type": "status_update", "payload": {"userId": user_id, "status": status}}
    for connection in active_connections.values():
        try: await connection.send_text(json.dumps(message))
        except Exception: pass

def update_statuses_in_hierarchy(nodes: List[Dict], online_users: List[str]):
    for node in nodes:
        node['status'] = 'online' if node['id'] in online_users else 'offline'
        if 'children' in node and node['children']: update_statuses_in_hierarchy(node['children'], online_users)

async def fetch_initial_data(user_id: str, user_role: str) -> Tuple[List[Dict], Dict[str, int]]:
    channels_to_query = ['general-chat']
    if user_role == 'director': channels_to_query.extend(['group-directors', 'group-managers', 'group-supervisors', 'group-employees'])
    elif user_role == 'manager': channels_to_query.extend(['group-managers', 'group-supervisors', 'group-employees'])
    elif user_role == 'supervisor': channels_to_query.extend(['group-supervisors', 'group-employees'])
    elif user_role == 'employee': channels_to_query.append('group-employees')

    all_messages = []
    for channel in channels_to_query:
        try:
            response = MENSAGENS_TABLE.query(KeyConditionExpression=Key('channelId').eq(channel), Limit=50, ScanIndexForward=False)
            all_messages.extend(response.get('Items', []))
        except ClientError: pass

    try:
        response = MENSAGENS_TABLE.scan(FilterExpression=Attr('channelId').contains(user_id) & Attr('channelId').begins_with('private-'))
        all_messages.extend(response.get('Items', []))
    except ClientError: pass

    read_receipts = {}
    try:
        response = READ_RECEIPTS_TABLE.query(KeyConditionExpression=Key('userId').eq(user_id))
        for item in response.get('Items', []): read_receipts[item['channelId']] = item['lastReadTimestamp']
    except ClientError: pass

    unread_counts = {}
    for msg in all_messages:
        channel_id = msg['channelId']
        if msg['senderId'] != user_id:
            last_read = read_receipts.get(channel_id)
            if not last_read or msg['timestamp'] > last_read: unread_counts[channel_id] = unread_counts.get(channel_id, 0) + 1

    unique_messages = {msg['id']: msg for msg in all_messages}.values()
    sorted_messages = sorted(list(unique_messages), key=lambda x: x['timestamp'])
    return sorted_messages, unread_counts

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    user_id = None
    try:
        initial_payload = await websocket.receive_json()
        if (initial_payload.get("type") == "user_connect" and initial_payload.get("userId") and initial_payload.get("role")):
            user_id = initial_payload["userId"]
            user_role = initial_payload["role"]
            active_connections[user_id] = websocket
            await broadcast_status_update(user_id, "online")
            
            hierarchy_data = await fetch_hierarchy_from_db()
            update_statuses_in_hierarchy(hierarchy_data, list(active_connections.keys()))
            messages_data, unread_counts = await fetch_initial_data(user_id, user_role)
            
            initial_state = {"hierarchy": hierarchy_data, "messages": messages_data, "unreadCounts": unread_counts}
            await websocket.send_text(json.dumps({"type": "initialState", "payload": initial_state}))
            
            # Log de conexão WebSocket
            print(f"LOG [WS]: Usuário {user_id} conectado.")
        else:
            await websocket.close()
            return

        while True:
            data = await websocket.receive_text()
            message_data = json.loads(data)
            
            if message_data.get("type") == "mark_read":
                channel_id_to_mark = message_data.get("channelId")
                if user_id and channel_id_to_mark:
                    try:
                        READ_RECEIPTS_TABLE.put_item(Item={'userId': user_id, 'channelId': channel_id_to_mark, 'lastReadTimestamp': datetime.now().isoformat()})
                    except ClientError: pass

            elif message_data.get("type") == "message":
                message_data["id"] = f"msg-servidor-{datetime.now().timestamp()}"
                message_data["timestamp"] = datetime.now().isoformat()
                try:
                    MENSAGENS_TABLE.put_item(Item=message_data)
                    print(f"LOG [WS]: Mensagem salva de {message_data.get('senderId')} para {message_data.get('channelId')}")
                except ClientError: pass
                
                channel_id = message_data.get("channelId", "")
                sender_id = message_data.get("senderId")
                targets: Set[str] = set()
                
                if channel_id.startswith("group-"):
                    current_hierarchy = await fetch_hierarchy_from_db()
                    group_members = get_group_members_ids(channel_id, current_hierarchy)
                    for member_id in group_members: targets.add(member_id)
                elif channel_id.startswith("private-"):
                    parts = channel_id.replace("private-", "").split("-")
                    targets.add("-".join(parts[:2]))
                    targets.add("-".join(parts[2:]))
                elif channel_id == 'general-chat':
                    targets.update(active_connections.keys())
                        
                for target_id in targets:
                    if target_id != sender_id and target_id in active_connections:
                        try: await active_connections[target_id].send_text(json.dumps(message_data))
                        except Exception: pass

    except WebSocketDisconnect:
        if user_id and user_id in active_connections:
            del active_connections[user_id]
            await broadcast_status_update(user_id, "offline")
            print(f"LOG [WS]: Usuário {user_id} desconectado.")

class UserInfo(BaseModel):
    id: str
    name: str
    role: str

@app.post("/internal/user-connected")
async def user_connected(info: UserInfo):
    return {"message": "Notification received"}