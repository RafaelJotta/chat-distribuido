from fastapi import FastAPI, WebSocket, WebSocketDisconnect
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
        try: await connection.send_text(json.dumps(message))
        except Exception as e: print(f"Erro ao enviar broadcast de status: {e}")

def update_statuses_in_hierarchy(nodes: List[Dict], online_users: List[str]):
    for node in nodes:
        node['status'] = 'online' if node['id'] in online_users else 'offline'
        if 'children' in node and node['children']: update_statuses_in_hierarchy(node['children'], online_users)

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
                print(f"Usuário {user_id} conectado. Total: {len(active_connections)}")
                await broadcast_status_update(user_id, "online")
                current_initial_data = copy.deepcopy(initial_data)
                update_statuses_in_hierarchy(current_initial_data['hierarchy'], list(active_connections.keys()))
                initial_state_message = {"type": "initialState", "payload": current_initial_data}
                await websocket.send_text(json.dumps(initial_state_message))
            else: raise WebSocketDisconnect
        else: raise WebSocketDisconnect
        while True:
            data = await websocket.receive_text()
            message_data = json.loads(data)
            if message_data.get("type") == "message":
                message_data["id"], message_data["timestamp"] = f"msg-{datetime.now().timestamp()}", datetime.now().isoformat()
                channel_id, sender_id = message_data.get("channelId", ""), message_data.get("senderId")
                targets: Set[str] = set()
                if channel_id.startswith("private-"): targets.add(channel_id.split("private-")[1])
                elif channel_id.startswith("group-"):
                    for mid in get_group_members_ids(channel_id, initial_data["hierarchy"]): targets.add(mid)
                if sender_id: targets.add(sender_id)
                print(f"Enviando mensagem de {sender_id} para os alvos: {targets}")
                for target_id in targets:
                    if target_id in active_connections:
                        await active_connections[target_id].send_text(json.dumps(message_data))
    except WebSocketDisconnect:
        if user_id and user_id in active_connections:
            del active_connections[user_id]
            print(f"Usuário {user_id} desconectado. Total: {len(active_connections)}")
            await broadcast_status_update(user_id, "offline")