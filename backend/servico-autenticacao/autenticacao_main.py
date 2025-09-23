from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware

class LoginRequest(BaseModel):
    email: str
    password: str

app = FastAPI()

# Permite requisições de qualquer origem, já que o Gateway protege o serviço
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/login")
async def login(request: LoginRequest):
    # Autenticação de demonstração
    if request.email == "adm@empresa.com" and request.password == "adm":
        # --- CORREÇÃO APLICADA AQUI ---
        # Agora, o login de administrador retorna o usuário Diretor, que tem permissões.
        return {
            "id": "dir-1",
            "name": "Thiago Caproni (Você)",
            "avatar": "",
            "role": "director",
            "status": "online"
        }
    else:
        raise HTTPException(status_code=401, detail="Credenciais inválidas")

@app.get("/health")
async def health_check():
    return {"status": "OK"}
