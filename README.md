# Gamificação 2 - Implementação de Serviços em um Sistema de Informações de Bordo Baseado em SOA - Grupo
LORI RONALDO FLORES MACHADO FILHO • 3 de out. (editado: 3 de out.)
- 20 pontos
- Data de entrega: 10 de out., 22:30

Cada grupo será responsável por desenvolver um serviço essencial do Sistema de Software de Bordo. O sistema permitirá que os carros recebam informações de diferentes fontes (tráfego, clima, localização), autentiquem os usuários, e processem dados em tempo real. 

Os grupos deverão trabalhar de forma colaborativa, conectando seus serviços para criar um sistema modular, escalável e funcional, utilizando conceitos de SOA.

Sobre os serviços: (100XP)

## Serviço de Autenticação - Sem nome
**Requisitos mínimos**
- POST /login: Recebe um JSON com username e password e retorna um token de acesso se as credenciais forem válidas.
- GET /validate: Verifica se um token é válido.

Sobre a integração (100XP)

Para que vocês concluam a atividade com maestria, todos os serviços devem poder se comunicar de forma independente

# Documentação SOAAuthService

## Executando API

### Rodando Localmente

1. Instale as dependências com `npm install`
1. Execute o script [projectSetup.js](./projectSetup.js) para gerar os arquivos da base de dados e segredos de token .
    ```bash
    node projectSetup.js
    ```
1. Por fim basta executar o arquivo principal.
    ```bash
    node index.js
    ```

### Rodando via Container

Basta apenas montar uma imagem a partir do [Dockerfile](./Dockerfile) do repositório e rodar um container.

```bash
# Cria imagem
docker build -t auth-service .

# Executa container temporário na porta 3000
docker run --rm  --name auth-service -p 3000:3000 auth-service
```

## Endpoints

### `POST:/login`
Verifica credenciais do usuário e gera um token de acesso.

**Corpo Requisição:**
```json
{
    "username": "<string> nome de usuario",
    "password": "<string> senha do usuario",
    "expiration": "(opcional) <int | string> Default: 5min, Inteiro: Segundos, String: formatos biblioteca MS"
}
```
Formatos válidos disponíveis para tempo de validade podem ser conferidos em [vercel/ms](https://github.com/vercel/ms)


**Resposta:**
```json
{
    "status": "<string> success | error>",
    "sessionToken": "<string> token de sessão gerado",
    "expiresIn": "<ISOstring> data e hora limite da validate do token",
    "msg": "<string> mensagem de erro"
}
```

### `GET:/validate/<token-de-acesso>`
Verifica se um token de acesso é valido.

**Resposta:**
```json
{
    "status": "<string> success | error>",
    "user": "<string> usuario que gerou o token",
    "token": "<string> token enviado",
    "msg": "<string> mensagem de erro"
}
```

### `GET:/admin/user-list`

Lista usuários registrados na base de dados.

**Resposta:**
```json
{
    "status": "<string> success | error",
    "users": [
        {
            "username": "<string> nome do usuário",
            "isactive": "<bool> status de ativação do usuário"
        },
        {"..."},
        {"..."}
    ]
}
```

### `POST:/admin/add-user`
Adiciona um usuário a base de dados.

**Corpo Requisição:**
```json
{
    "username": "<string> nome de usuario",
    "password": "<string> senha do usuario"
}
```

**Resposta:**
```json
{
    "status": "<string> success | error",
    "msg": "<string> mensagem de resposta"
}
```

### `POST:/admin/toggle-user-status`
Alterna o status de ativação do usuário.

**Corpo Requisição:**
```json
{
    "username": "<string> nome de usuario",
}
```

**Resposta:**
```json
{
    "status": "<string> success | error",
    "msg": "<string> mensagem de resposta"
}
```