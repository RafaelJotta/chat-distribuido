from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import httpx # Importa a biblioteca para fazer chamadas HTTP

class LoginRequest(BaseModel):
    email: str
    password: str

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- SUGESTÃO DE REATORAÇÃO ---
# Simula um banco de dados de usuários para um código mais limpo e escalável
mock_db_users = {
    "adm@empresa.com": {
        "password": "adm",
        "data": {"id": "dir-1", "name": "Thiago Caproni", "role": "director"}
    },
    "alessandro@empresa.com": {
        "password": "123",
        "data": {"id": "mgr-1", "name": "Alessandro Augusto", "role": "manager"}
    },
    "amando@empresa.com": {
        "password": "123",
        "data": {"id": "sup-1", "name": "Amando Luiz", "role": "supervisor"}
    },
    "rafael@empresa.com": {
        "password": "123",
        "data": {"id": "mgr-2", "name": "Rafael Jotta", "role": "manager"}
    }
}

@app.post("/login")
async def login(request: LoginRequest):
    user_record = mock_db_users.get(request.email)
    
    if user_record and user_record["password"] == request.password:
        user_data = user_record["data"]
        
        # --- NOVO: COMUNICAÇÃO ENTRE SERVIÇOS ---
        # Notifica o serviço de mensagens que este usuário fez login.
        # A URL usa o nome do serviço Docker ('servico-mensagens') e a porta dele.
        MESSAGING_SERVICE_URL = "http://servico-mensagens:18081/internal/user-connected"
        
        try:
            async with httpx.AsyncClient() as client:
                await client.post(MESSAGING_SERVICE_URL, json=user_data)
            print(f"Notificação de login enviada com sucesso para o serviço de mensagens para o usuário: {user_data['name']}")
        except httpx.RequestError as e:
            # Em um sistema real, isso poderia ser logado ou colocado em uma fila de retentativas.
            print(f"ERRO: Falha ao notificar o serviço de mensagens: {e}")
            
        return {**user_data, "status": "online"} # Adiciona o status dinamicamente

    raise HTTPException(status_code=401, detail="Credenciais inválidas")

@app.get("/health")
async def health_check():
    return {"status": "OK"}