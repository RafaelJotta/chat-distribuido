from fastapi import FastAPI, WebSocket, WebSocketDisconnect
import json
from datetime import datetime
import asyncio

app = FastAPI()

# Mantém a lista de conexões ativas
connections = set()

# Dados que antes eram "mock" no frontend, agora são a fonte de verdade do backend
# Em um projeto real, isso viria de um banco de dados
initial_data = {
    "hierarchy": [
        {
            "id": 'dir-1', "name": 'Thiago Caproni', "role": 'director', "isExpanded": True,
            "children": [
                {
                    "id": 'mgr-1', "name": 'Alessandro Augusto', "role": 'manager', "isExpanded": True,
                    "children": [
                        {"id": 'sup-1', "name": 'Amando Luiz', "role": 'supervisor'},
                        {"id": 'sup-2', "name": 'Mariana Silva', "role": 'supervisor'},
                    ],
                },
                {
                    "id": 'mgr-2', "name": 'Rafael Jotta', "role": 'manager',
                    "children": [{"id": 'sup-3', "name": 'Bruno Santos', "role": 'supervisor'}],
                },
            ],
        },
    ],
    "messages": [
        {
            "id": 'msg-1', "senderId": 'dir-1', "senderName": 'Thiago Caproni', "senderRole": 'director',
            "content": 'AVISO: Reunião de revisão dos relatórios trimestrais marcada para amanhã às 14h.',
            "timestamp": datetime.now().isoformat(), "priority": 'normal',
        },
        {
            "id": 'msg-3', "senderId": 'dir-1', "senderName": 'Thiago Caproni', "senderRole": 'director',
            "content": 'AVISO URGENTE: Problema crítico identificado no sistema de produção. Mobilizem as equipes!',
            "timestamp": datetime.now().isoformat(), "priority": 'urgent',
        },
    ]
}

async def broadcast(message: str, exclude_socket: WebSocket = None):
    # Cria uma cópia da lista de conexões para evitar problemas de concorrência
    current_connections = list(connections)
    tasks = []
    for connection in current_connections:
        if connection != exclude_socket:
            tasks.append(connection.send_text(message))
    await asyncio.gather(*tasks)


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    connections.add(websocket)
    
    # Envia o estado inicial para o novo cliente conectado
    initial_state_message = {
        "type": "initialState",
        "payload": initial_data
    }
    await websocket.send_text(json.dumps(initial_state_message))
    
    try:
        while True:
            data = await websocket.receive_text()
            message_data = json.loads(data)
            
            # Adiciona timestamp e ID a novas mensagens antes de fazer o broadcast
            if message_data.get("type") == "message":
                message_data["id"] = f"msg-{datetime.now().timestamp()}"
                message_data["timestamp"] = datetime.now().isoformat()
                initial_data["messages"].append(message_data) # Adiciona a nova msg na memória
                await broadcast(json.dumps(message_data))
            
            # Repassa a notificação de "digitando" para outros clientes
            elif message_data.get("type") == "typing":
                await broadcast(json.dumps(message_data), exclude_socket=websocket)

            # Notifica a todos que um novo usuário entrou
            elif message_data.get("type") == "userJoined":
                 await broadcast(json.dumps(message_data), exclude_socket=websocket)

    except WebSocketDisconnect:
        connections.remove(websocket)
        print(f"Cliente {websocket.client} desconectado")
