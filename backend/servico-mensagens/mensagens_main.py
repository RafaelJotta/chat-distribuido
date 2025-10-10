from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from pydantic import BaseModel
import json
from datetime import datetime
from typing import Dict, List, Set
import motor.motor_asyncio
import os

# --- Configuração do Banco de Dados ---
DATABASE_URL = os.getenv("DATABASE_URL", "mongodb://localhost:27017")
client = motor.motor_asyncio.AsyncIOMotorClient(DATABASE_URL)
db = client.chat_distribuido

app = FastAPI()
active_connections: Dict[str, WebSocket] = {}

async def fetch_hierarchy_from_db():
    hierarchy_cursor = db.hierarchy.find({}, {"_id": 0})
    return await hierarchy_cursor.to_list(length=None)

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
    for connection in active_connections.values():
        try: await connection.send_text(json.dumps(message))
        except Exception: pass

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
        if initial_payload.get("type") == "user_connect" and initial_payload.get("userId"):
            user_id = initial_payload["userId"]
            active_connections[user_id] = websocket
            await broadcast_status_update(user_id, "online")
            
            hierarchy_data = await fetch_hierarchy_from_db()
            update_statuses_in_hierarchy(hierarchy_data, list(active_connections.keys()))
            
            # Busca as últimas 50 mensagens para popular o chat
            messages_cursor = db.messages.find({}, {"_id": 0}).sort("timestamp", -1).limit(50)
            messages_data = await messages_cursor.to_list(length=50)
            messages_data.reverse()

            initial_state = {"hierarchy": hierarchy_data, "messages": messages_data}
            await websocket.send_text(json.dumps({"type": "initialState", "payload": initial_state}))
        else:
            await websocket.close()
            return

        while True:
            data = await websocket.receive_text()
            message_data = json.loads(data)
            
            if message_data.get("type") == "message":
                message_data["id"] = f"msg-{datetime.now().timestamp()}"
                message_data["timestamp"] = datetime.now().isoformat()
                
                await db.messages.insert_one(message_data)
                
                channel_id = message_data.get("channelId", "")
                sender_id = message_data.get("senderId")
                targets: Set[str] = set()
                current_hierarchy = await fetch_hierarchy_from_db()

                if channel_id.startswith("private-"):
                    parts = channel_id.replace("private-", "").split("-")
                    user1_id = "-".join(parts[:2])
                    user2_id = "-".join(parts[2:])
                    targets.add(user1_id)
                    targets.add(user2_id)
                elif channel_id.startswith("group-"):
                    group_members = get_group_members_ids(channel_id, current_hierarchy)
                    for member_id in group_members: targets.add(member_id)
                    if sender_id: targets.add(sender_id)
                elif channel_id == 'general-chat':
                    targets.update(active_connections.keys())
                        
                for target_id in targets:
                    if target_id in active_connections:
                        try: await active_connections[target_id].send_text(json.dumps(message_data))
                        except Exception: pass

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