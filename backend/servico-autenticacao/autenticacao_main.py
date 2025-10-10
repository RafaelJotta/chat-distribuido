from fastapi import FastAPI, HTTPException, status
from pydantic import BaseModel, EmailStr
from fastapi.middleware.cors import CORSMiddleware
import httpx
import motor.motor_asyncio
import os
from passlib.context import CryptContext
from typing import Optional

# --- Configuração do Banco de Dados ---
DATABASE_URL = os.getenv("DATABASE_URL", "mongodb://localhost:27017")
client = motor.motor_asyncio.AsyncIOMotorClient(DATABASE_URL)
db = client.chat_distribuido

# --- Configuração de Hashing de Senha ---
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    role: str
    manager_id: Optional[str] = None

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

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

@app.post("/register", status_code=status.HTTP_201_CREATED)
async def register_user(user: UserCreate):
    if await db.users.find_one({"email": user.email}):
        raise HTTPException(status_code=400, detail="Email já registrado")
    
    user_id = f"{user.role[:3]}-{await db.users.count_documents({'role': user.role}) + 1}"
    hashed_password = get_password_hash(user.password)
    
    user_document = {
        "id": user_id,
        "email": user.email,
        "hashed_password": hashed_password,
        "name": user.name,
        "role": user.role,
    }
    await db.users.insert_one(user_document)

    new_node = {"id": user_id, "name": user.name, "role": user.role, "email": user.email, "children": []}
    if user.manager_id:
        await db.hierarchy.update_one(
            {"id": user.manager_id},
            {"$push": {"children": new_node}}
        )
    else:
        await db.hierarchy.insert_one(new_node)

    return {"message": "Usuário criado com sucesso!", "user_id": user_id}

@app.post("/login")
async def login(request: LoginRequest):
    user_record = await db.users.find_one({"email": request.email})
    
    if user_record and verify_password(request.password, user_record["hashed_password"]):
        user_data = {"id": user_record["id"], "name": user_record["name"], "role": user_record["role"]}
        
        MESSAGING_SERVICE_URL = "http://servico-mensagens:18081/internal/user-connected"
        try:
            async with httpx.AsyncClient() as client:
                await client.post(MESSAGING_SERVICE_URL, json=user_data)
        except httpx.RequestError as e:
            print(f"ERRO: Falha ao notificar o serviço de mensagens: {e}")
            
        return {**user_data, "status": "online"}

    raise HTTPException(status_code=401, detail="Credenciais inválidas")

@app.get("/health")
async def health_check():
    return {"status": "OK"}