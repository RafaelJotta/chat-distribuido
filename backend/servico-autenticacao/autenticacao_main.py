from fastapi import FastAPI, HTTPException, status
from pydantic import BaseModel, EmailStr
from fastapi.middleware.cors import CORSMiddleware
import httpx
import boto3
from botocore.exceptions import ClientError
import os
from passlib.context import CryptContext
from typing import Optional
from contextlib import asynccontextmanager

# --- Configuração do Banco de Dados ---
IS_LOCAL = os.getenv("IS_LOCAL", "false").lower() == "true"

if IS_LOCAL:
    print(">>> MODO DE DESENVOLVIMENTO: Conectando ao DynamoDB Local <<<")
    dynamodb = boto3.resource(
        'dynamodb',
        endpoint_url='http://dynamodb-local:8000',
        region_name='us-east-1',
        aws_access_key_id='dummykey',
        aws_secret_access_key='dummysecret'
    )
else:
    print(">>> MODO DE PRODUÇÃO: Conectando ao AWS DynamoDB <<<")
    dynamodb = boto3.resource('dynamodb', region_name='us-east-1')

USUARIOS_TABLE = dynamodb.Table('ChatUsuarios')
HIERARQUIA_TABLE = dynamodb.Table('ChatHierarquia')
CONTADORES_TABLE = dynamodb.Table('ChatContadores')
READ_RECEIPTS_TABLE = dynamodb.Table('ChatReadReceipts')


# --- Lógica de Inicialização (Lifespan) ---

def create_table_if_not_exists(table_name, key_schema, attribute_definitions):
    """Helper para criar tabelas no modo local"""
    try:
        dynamodb.create_table(
            TableName=table_name,
            KeySchema=key_schema,
            AttributeDefinitions=attribute_definitions,
            ProvisionedThroughput={'ReadCapacityUnits': 5, 'WriteCapacityUnits': 5}
        )
        print(f"Criando tabela '{table_name}', aguarde...")
        table = dynamodb.Table(table_name)
        table.wait_until_exists()
        print(f"Tabela '{table_name}' criada com sucesso.")
    except ClientError as e:
        if e.response['Error']['Code'] == 'ResourceInUseException':
            print(f"Tabela '{table_name}' já existe.")
        else:
            print(f"Erro inesperado ao criar tabela '{table_name}': {e}")
    except Exception as e:
        print(f"Erro geral ao criar tabela '{table_name}': {e}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    if IS_LOCAL:
        print(">>> MODO LOCAL: Verificando/Criando tabelas do serviço de autenticação...")
        
        create_table_if_not_exists(
            table_name='ChatUsuarios',
            key_schema=[{'AttributeName': 'email', 'KeyType': 'HASH'}],
            attribute_definitions=[{'AttributeName': 'email', 'AttributeType': 'S'}]
        )
        
        create_table_if_not_exists(
            table_name='ChatHierarquia',
            key_schema=[{'AttributeName': 'id', 'KeyType': 'HASH'}],
            attribute_definitions=[{'AttributeName': 'id', 'AttributeType': 'S'}]
        )

        create_table_if_not_exists(
            table_name='ChatContadores',
            key_schema=[{'AttributeName': 'role', 'KeyType': 'HASH'}],
            attribute_definitions=[{'AttributeName': 'role', 'AttributeType': 'S'}]
        )

        create_table_if_not_exists(
            table_name='ChatReadReceipts',
            key_schema=[
                {'AttributeName': 'userId', 'KeyType': 'HASH'},
                {'AttributeName': 'channelId', 'KeyType': 'RANGE'}
            ],
            attribute_definitions=[
                {'AttributeName': 'userId', 'AttributeType': 'S'},
                {'AttributeName': 'channelId', 'AttributeType': 'S'}
            ]
        )
        
        print(">>> MODO LOCAL: Populando contadores iniciais...")
        roles = ['director', 'manager', 'supervisor', 'employee'] # Já inclui 'employee'
        
        for role in roles:
            try:
                CONTADORES_TABLE.put_item(
                    Item={'role': role, 'count': 0},
                    ConditionExpression='attribute_not_exists(#r)',
                    ExpressionAttributeNames={'#r': 'role'}
                )
                print(f"Contador para '{role}' inicializado com 0.")
            except ClientError as e:
                if e.response['Error']['Code'] == 'ConditionalCheckFailedException':
                    print(f"Contador para '{role}' já existe. Ignorando.")
                else:
                    print(f"Erro ao popular contador '{role}': {e}")
            except Exception as e:
                print(f"Erro geral ao popular contador: {e}")

        print("Povoamento de contadores concluído.")

    yield
    
    print("Finalizando serviço de autenticação...")

# --- Configuração de Hashing de Senha ---
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    role: str # O tipo 'str' já aceita 'director', 'manager', 'supervisor', 'employee'
    manager_id: Optional[str] = None

class LoginRequest(BaseModel):
    email: str
    password: str

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

def get_next_user_id(role: str) -> str:
    """Gera um ID atômico (Requisito de Coordenação)"""
    try:
        response = CONTADORES_TABLE.update_item(
            Key={'role': role},
            UpdateExpression='SET #c = #c + :val',
            ExpressionAttributeNames={'#c': 'count'},
            ExpressionAttributeValues={':val': 1},
            ReturnValues="UPDATED_NEW"
        )
        new_count = int(response['Attributes']['count'])
        # ✅ *** CORREÇÃO: Mapeia 'employee' para 'emp' ***
        prefix = role[:3]
        if role == 'employee':
            prefix = 'emp'
            
        return f"{prefix}-{new_count}"
    except ClientError as e:
        print(f"Erro ao gerar ID para role '{role}': {e}")
        raise HTTPException(status_code=500, detail=f"Erro ao gerar ID de usuário: {e}")


@app.post("/register", status_code=status.HTTP_201_CREATED)
async def register_user(user: UserCreate):
    
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
        USUARIOS_TABLE.put_item(
            Item=user_document,
            ConditionExpression='attribute_not_exists(email)'
        )
    except ClientError as e:
        if e.response['Error']['Code'] == 'ConditionalCheckFailedException':
            raise HTTPException(status_code=400, detail="Email já registrado")
        else:
            print(f"Erro no DynamoDB (USUARIOS_TABLE): {e}")
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
            # Se não há manager_id, é um nó raiz (provavelmente um Diretor)
            HIERARQUIA_TABLE.put_item(
                Item=new_node,
                ConditionExpression='attribute_not_exists(id)'
            )
    except ClientError as e:
        print(f"Erro ao atualizar hierarquia (HIERARQUIA_TABLE): {e}")
        # Se falhar aqui, o usuário foi criado mas não está na hierarquia.
        # Em produção, usaríamos um padrão SAGA para reverter a criação do usuário.
        raise HTTPException(status_code=500, detail="Usuário criado, mas falha ao atualizar hierarquia.")

    return {"message": "Usuário criado com sucesso!", "user_id": user_id}

@app.post("/login")
async def login(request: LoginRequest):
    
    try:
        response = USUARIOS_TABLE.get_item(Key={'email': request.email})
        user_record = response.get('Item')
    except ClientError as e:
        print(f"Erro no DynamoDB (USUARIOS_TABLE GetItem): {e}")
        raise HTTPException(status_code=500, detail="Erro ao fazer login.")

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