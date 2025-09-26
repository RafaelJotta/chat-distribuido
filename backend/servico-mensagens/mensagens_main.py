from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from pydantic import BaseModel
import json
from datetime import datetime
import asyncio
from typing import Dict, List, Set
import copy

app = FastAPI()

active_connections: Dict[str, WebSocket] = {}

initial_data = {
    "hierarchy": [
        {
            "id": 'dir-1', "name": 'Thiago Caproni', "role": 'director', "email": "adm@empresa.com", "children": [
                {
                    "id": 'mgr-1', "name": 'Alessandro Augusto', "role": 'manager', "email": "alessandro@empresa.com", "children": [
                        {"id": 'sup-1', "name": 'Amando Luiz', "role": 'supervisor', "email": "amando@empresa.com"},
                        {"id": 'sup-2', "name": 'Mariana Silva', "role": 'supervisor', "email": "mariana@empresa.com"},
                    ]
                },
                {
                    "id": 'mgr-2', "name": 'Rafael Jotta', "role": 'manager', "email": "rafael@empresa.com", "children": [
                        {"id": 'sup-3', "name": 'Bruno Santos', "role": 'supervisor', "email": "bruno@empresa.com"}
                    ]
                },
            ],
        },
    ], "messages": []
}

def get_group_members_ids(channel_id: str, hierarchy: List[Dict]) -> List[str]:
    try: role = channel_id.split("group-")[1].rstrip('s')
    except IndexError: return []
    member_ids = []
    def find_users_by_role(nodes: List[Dict], target_role: str):
        for node in nodes:
            if node.get("role") == target_role: member_ids.append(node["id"])
            if "children" in node and node["children"]: find_users_by_role(node["children"], target_role)
    find_users_by_role(hierarchy, role)
    return member_ids

async def broadcast_status_update(user_id: str, status: str):
    message = {"type": "status_update", "payload": {"userId": user_id, "status": status}}
    connections_to_send = list(active_connections.values())
    for connection in connections_to_send:
        try:
            await connection.send_text(json.dumps(message))
        except Exception as e:
            print(f"Erro ao enviar broadcast de status: {e}")

def update_statuses_in_hierarchy(nodes: List[Dict], online_users: List[str]):
    for node in nodes:
        node['status'] = 'online' if node['id'] in online_users else 'offline'
        if 'children' in node and node['children']:
            update_statuses_in_hierarchy(node['children'], online_users)

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    user_id = None
    try:
        initial_payload = await websocket.receive_json()
        if initial_payload.get("type") == "user_connect":
            user_id = initial_payload.get("userId")
            if user_id:
                active_connections[user_id] = websocket
                print(f"Usuário {user_id} conectado via WebSocket. Total: {len(active_connections)}")
                await broadcast_status_update(user_id, "online")
                
                current_initial_data = copy.deepcopy(initial_data)
                update_statuses_in_hierarchy(current_initial_data['hierarchy'], list(active_connections.keys()))
                initial_state_message = {"type": "initialState", "payload": current_initial_data}
                await websocket.send_text(json.dumps(initial_state_message))
            else:
                raise WebSocketDisconnect
        else:
            raise WebSocketDisconnect

        while True:
            data = await websocket.receive_text()
            message_data = json.loads(data)
            if message_data.get("type") == "message":
                message_data["id"] = f"msg-{datetime.now().timestamp()}"
                message_data["timestamp"] = datetime.now().isoformat()
                
                channel_id = message_data.get("channelId", "")
                sender_id = message_data.get("senderId")
                
                targets: Set[str] = set()

                # ✅ LÓGICA DE MENSAGENS PRIVADAS CORRIGIDA
                if channel_id.startswith("private-"):
                    try:
                        # Formato esperado: "private-id_parte1-id_parte2-id_parte3-id_parte4"
                        # Ex: "private-dir-1-mgr-1"
                        parts = channel_id.split('-')
                        if len(parts) == 5:
                            # Reconstrói o primeiro ID, ex: "dir-1"
                            id1 = f"{parts[1]}-{parts[2]}"
                            # Reconstrói o segundo ID, ex: "mgr-1"
                            id2 = f"{parts[3]}-{parts[4]}"
                            targets.add(id1)
                            targets.add(id2)
                        else:
                             print(f"ID de canal privado com formato inesperado: {channel_id}")
                    except Exception as e:
                        print(f"Erro ao processar ID de canal privado '{channel_id}': {e}")

                elif channel_id.startswith("group-"):
                    group_members = get_group_members_ids(channel_id, initial_data["hierarchy"])
                    for member_id in group_members:
                        targets.add(member_id)
                    # Adiciona o remetente ao grupo também, para ele ver a própria mensagem
                    if sender_id:
                        targets.add(sender_id)

                elif channel_id == 'general-chat':
                    for uid in active_connections.keys():
                        targets.add(uid)
                        
                print(f"Enviando mensagem de {sender_id} para os alvos: {targets}")
                for target_id in targets:
                    if target_id in active_connections:
                        try:
                            await active_connections[target_id].send_text(json.dumps(message_data))
                        except Exception as e:
                            print(f"Não foi possível enviar para {target_id}, talvez desconectado. Erro: {e}")

    except WebSocketDisconnect:
        if user_id and user_id in active_connections:
            del active_connections[user_id]
            print(f"Usuário {user_id} desconectado do WebSocket. Total: {len(active_connections)}")
            await broadcast_status_update(user_id, "offline")

class UserInfo(BaseModel):
    id: str
    name: str
    role: str

@app.post("/internal/user-connected")
async def user_connected(info: UserInfo):
    print(f"Recebida notificação de login do serviço de autenticação para o usuário: {info.name} (ID: {info.id})")
    return {"message": "Notification received"}