from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware

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

@app.post("/login")
async def login(request: LoginRequest):
    if request.email == "adm@empresa.com" and request.password == "adm":
        return {
            "id": "dir-1",
            "name": "Thiago Caproni",
            "role": "director",
            "status": "online"
        }
    elif request.email == "alessandro@empresa.com" and request.password == "123":
        return {
            "id": "mgr-1",
            "name": "Alessandro Augusto",
            "role": "manager",
            "status": "online"
        }
    elif request.email == "amando@empresa.com" and request.password == "123":
        return {
            "id": "sup-1",
            "name": "Amando Luiz",
            "role": "supervisor",
            "status": "online"
        }
    elif request.email == "rafael@empresa.com" and request.password == "123":
        return {
            "id": "mgr-2",
            "name": "Rafael Jotta",
            "role": "manager",
            "status": "online"
        }
    else:
        raise HTTPException(status_code=401, detail="Credenciais inválidas")

@app.get("/health")
async def health_check():
    return {"status": "OK"}