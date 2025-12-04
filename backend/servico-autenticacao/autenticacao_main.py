from fastapi import FastAPI, HTTPException, status, Depends
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel, EmailStr
from fastapi.middleware.cors import CORSMiddleware
import httpx
import boto3
from botocore.exceptions import ClientError
import os
from passlib.context import CryptContext
from typing import Optional
from contextlib import asynccontextmanager
from datetime import datetime, timedelta
from jose import JWTError, jwt
import time
import logging # <--- NOVO

# --- Configuração de Logs ---
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("auth-service")

# --- Configuração JWT ---
SECRET_KEY = "chave-super-secreta-do-trabalho-sis-dist"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

IS_LOCAL = os.getenv("IS_LOCAL", "false").lower() == "true"

def connect_with_retry(max_retries: int = 5, delay_seconds: int = 3):
    last_exception = None
    for attempt in range(1, max_retries + 1):
        try:
            if IS_LOCAL:
                logger.info(f"[DynamoDB] Tentativa {attempt}/{max_retries} - Conectando Local...")
                return boto3.resource(
                    'dynamodb',
                    endpoint_url='http://dynamodb-local:8000',
                    region_name='us-east-1',
                    aws_access_key_id='dummykey',
                    aws_secret_access_key='dummysecret'
                )
            else:
                logger.info(f"[DynamoDB] Tentativa {attempt}/{max_retries} - Conectando AWS...")
                return boto3.resource('dynamodb', region_name='us-east-1')
        except Exception as exc:
            last_exception = exc
            logger.warning(f"[DynamoDB] Erro na conexão (tentativa {attempt}): {exc}")
            if attempt < max_retries:
                time.sleep(delay_seconds)
    
    logger.critical("Falha crítica ao conectar ao DynamoDB após várias tentativas.")
    raise last_exception if last_exception else RuntimeError("Falha crítica no DynamoDB")

dynamodb = connect_with_retry()

USUARIOS_TABLE = dynamodb.Table('ChatUsuarios')
HIERARQUIA_TABLE = dynamodb.Table('ChatHierarquia')
CONTADORES_TABLE = dynamodb.Table('ChatContadores')
READ_RECEIPTS_TABLE = dynamodb.Table('ChatReadReceipts')

def create_table_if_not_exists(table_name, key_schema, attribute_definitions):
    try:
        dynamodb.create_table(TableName=table_name, KeySchema=key_schema, AttributeDefinitions=attribute_definitions, ProvisionedThroughput={'ReadCapacityUnits': 5, 'WriteCapacityUnits': 5})
        logger.info(f"Criando tabela '{table_name}'...")
        table = dynamodb.Table(table_name)
        table.wait_until_exists()
    except ClientError: pass

@asynccontextmanager
async def lifespan(app: FastAPI):
    if IS_LOCAL:
        logger.info(">>> MODO LOCAL: Verificando tabelas de Autenticação...")
        create_table_if_not_exists('ChatUsuarios', [{'AttributeName': 'email', 'KeyType': 'HASH'}], [{'AttributeName': 'email', 'AttributeType': 'S'}])
        create_table_if_not_exists('ChatHierarquia', [{'AttributeName': 'id', 'KeyType': 'HASH'}], [{'AttributeName': 'id', 'AttributeType': 'S'}])
        create_table_if_not_exists('ChatContadores', [{'AttributeName': 'role', 'KeyType': 'HASH'}], [{'AttributeName': 'role', 'AttributeType': 'S'}])
        create_table_if_not_exists('ChatReadReceipts', [{'AttributeName': 'userId', 'KeyType': 'HASH'}, {'AttributeName': 'channelId', 'KeyType': 'RANGE'}], [{'AttributeName': 'userId', 'AttributeType': 'S'}, {'AttributeName': 'channelId', 'AttributeType': 'S'}])
        
        roles = ['director', 'manager', 'supervisor', 'employee']
        for role in roles:
            try:
                CONTADORES_TABLE.put_item(Item={'role': role, 'count': 0}, ConditionExpression='attribute_not_exists(#r)', ExpressionAttributeNames={'#r': 'role'})
            except ClientError: pass
    logger.info("Serviço de Autenticação iniciado.")
    yield

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

class Token(BaseModel):
    access_token: str
    token_type: str
    user: dict

app = FastAPI(lifespan=lifespan)

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

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_next_user_id(role: str) -> str:
    try:
        response = CONTADORES_TABLE.update_item(
            Key={'role': role},
            UpdateExpression='SET #c = #c + :val',
            ExpressionAttributeNames={'#c': 'count'},
            ExpressionAttributeValues={':val': 1},
            ReturnValues="UPDATED_NEW"
        )
        new_count = int(response['Attributes']['count'])
        prefix = role[:3]
        if role == 'employee': prefix = 'emp'
        return f"{prefix}-{new_count}"
    except ClientError as e:
        logger.error(f"Erro ao gerar ID para role {role}: {e}")
        raise HTTPException(status_code=500, detail=f"Erro ao gerar ID: {e}")

@app.post("/register", status_code=status.HTTP_201_CREATED)
async def register_user(user: UserCreate):
    logger.info(f"Tentativa de registro para email: {user.email} (Role: {user.role})")
    user_id = get_next_user_id(user.role)
    hashed_password = get_password_hash(user.password)
    
    user_document = {
        "id": user_id,
        "email": user.email,
        "hashed_password": hashed_password,
        "name": user.name,
        "role": user.role,
    }

    try:
        USUARIOS_TABLE.put_item(Item=user_document, ConditionExpression='attribute_not_exists(email)')
    except ClientError as e:
        if e.response['Error']['Code'] == 'ConditionalCheckFailedException':
            logger.warning(f"Tentativa de registro duplicado para email: {user.email}")
            raise HTTPException(status_code=400, detail="Email já registrado")
        logger.error(f"Erro DynamoDB ao registrar usuário: {e}")
        raise HTTPException(status_code=500, detail="Erro ao registrar usuário.")

    new_node = {"id": user_id, "name": user.name, "role": user.role, "email": user.email, "children": []}
    try:
        if user.manager_id:
            HIERARQUIA_TABLE.update_item(
                Key={'id': user.manager_id},
                UpdateExpression='SET #children = list_append(if_not_exists(#children, :empty_list), :new_node)',
                ExpressionAttributeNames={'#children': 'children'},
                ExpressionAttributeValues={':new_node': [new_node], ':empty_list': []}
            )
        else:
            HIERARQUIA_TABLE.put_item(Item=new_node, ConditionExpression='attribute_not_exists(id)')
    except ClientError: pass

    logger.info(f"Usuário registrado com sucesso: {user_id}")
    return {"message": "Usuário criado com sucesso!", "user_id": user_id}

@app.post("/login", response_model=Token)
async def login(request: LoginRequest):
    try:
        response = USUARIOS_TABLE.get_item(Key={'email': request.email})
        user_record = response.get('Item')
    except ClientError as e:
        logger.error(f"Erro ao buscar usuário no login: {e}")
        raise HTTPException(status_code=500, detail="Erro interno.")

    if user_record and verify_password(request.password, user_record["hashed_password"]):
        user_data = {"id": user_record["id"], "name": user_record["name"], "role": user_record["role"]}
        
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user_record["email"], "role": user_record["role"], "id": user_record["id"]},
            expires_delta=access_token_expires
        )

        try:
            async with httpx.AsyncClient(timeout=1.0) as client:
                await client.post("http://servico-mensagens:18081/internal/user-connected", json=user_data)
        except (httpx.RequestError, httpx.TimeoutException):
            logger.warning(f"Não foi possível notificar serviço de mensagens sobre login de {user_data['id']}")
            
        logger.info(f"Login efetuado com sucesso: {request.email} (ID: {user_data['id']})")
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": {**user_data, "status": "online"}
        }

    logger.warning(f"Falha de login (credenciais inválidas): {request.email}")
    raise HTTPException(status_code=401, detail="Credenciais inválidas")

@app.get("/health")
async def health_check():
    return {"status": "OK", "service": "autenticacao"}