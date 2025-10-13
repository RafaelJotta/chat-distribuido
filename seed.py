import requests
import json
import time

# A API Gateway está na porta 8080
BASE_URL = "http://localhost:8080" 

users_to_create = [
    {"email": "adm@empresa.com", "password": "adm", "name": "Thiago Caproni", "role": "director", "manager_id": None},
    {"email": "alessandro@empresa.com", "password": "123", "name": "Alessandro Augusto", "role": "manager", "manager_id": "dir-1"},
    {"email": "rafael@empresa.com", "password": "123", "name": "Rafael Jotta", "role": "manager", "manager_id": "dir-1"},
    {"email": "amando@empresa.com", "password": "123", "name": "Amando Luiz", "role": "manager", "manager_id": "dir-1"},
]

def seed_database():
    print("Aguardando os serviços subirem...")
    time.sleep(10) # Dá um tempo para os containers iniciarem completamente
    
    print("Iniciando o povoamento do banco de dados...")
    for user in users_to_create:
        try:
            # O endpoint agora é /api/auth/register por causa do Nginx
            response = requests.post(f"{BASE_URL}/api/auth/register", json=user)
            if 200 <= response.status_code < 300:
                print(f"Usuário '{user['name']}' criado com sucesso.")
            else:
                print(f"Erro ao criar usuário '{user['name']}': {response.status_code} - {response.text}")
        except requests.exceptions.RequestException as e:
            print(f"Não foi possível conectar ao serviço de autenticação: {e}")

if __name__ == "__main__":
    seed_database()
