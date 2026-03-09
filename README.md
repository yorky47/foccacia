# ⚽ FOCCACIA - Football Complete Clubs API and Chelas Internet Application

> **⚠️ NOTA AO PROFESSOR:** A funcionalidade **Wiki** encontra-se desativada nas definições deste repositório e não temos permissões para a ativar. Por este motivo, o Relatório Final encontra-se localizado aqui: [Ver Relatório Final](https://github.com/isel-leic-ipw/isel-leic-ipw-pi-2526i-foccacia-leic2526i-ipw33d-g01/blob/main/FOCCACIA_WIKI_FINAL.md)
> 
## 📄 Descrição do Projeto


O projeto **FOCCACIA** é uma aplicação web completa desenvolvida em **Node.js** com **Express**, que combina uma **API REST** com uma **interface web** para gestão de grupos de jogadores de futebol ("Best XI").

### Objetivos Principais
1. **Aceder a dados reais** de competições e equipas através da **Football Data API (v4)**
2. **Gerir "Grupos Best XI"** - coleções personalizadas de jogadores favoritos (máximo 11 por grupo)
3. **Interface Web** - Sistema completo de visualização e gestão via browser
4. **API REST** - Endpoints JSON para integração programática
5. **Autenticação** - Login via Web Site (sessões) e API protegida por Bearer token

### Tecnologias Utilizadas
- **Backend**: Node.js + Express
- **Template Engine**: Handlebars (hbs) 4.2.0
- **Frontend**: Bootstrap 5.3.8 + Bootstrap Icons
- **Documentação**: OpenAPI 3.0 + Swagger UI
- **Testes**: Mocha 11.7.4
- **Persistência**: ElasticSearch (via Docker Compose)
- **Autenticação Web**: Passport (Local Strategy) + express-session

---

## 👥 Autores do Projeto

| Nome do Aluno | Número de Matrícula | GitHub |
| :--- | :---: | :--- |
| **Yorky Reyes** | 52764 | [@yorky47](https://github.com/yorky47) |
| **Victor Gorincioi** | 52545 | [@victorgorincioi](https://github.com/victorgorincioi) |
| **Martim Monteiro** | 52878 | [@martimmonteiro](https://github.com/MartimMonteiroZork) |

**Turma**: LEIC33D - Grupo 01  
**UC**: Introdução à Programação Web (IPW)  
**Ano Letivo**: 2025/2026 - Inverno  
**Instituição**: ISEL - Instituto Superior de Engenharia de Lisboa

---

## 🏗️ Arquitetura do Projeto

### Estrutura de Camadas (3-Tier Architecture)

```
┌─────────────────────────────────────────┐
│  PRESENTATION LAYER                     │
│  ├─ Web Site (HTML via Handlebars)     │
│  │  └─ /site/*                          │
│  └─ Web API (JSON)                      │
│     └─ /api/*                           │
├─────────────────────────────────────────┤
│  BUSINESS LOGIC LAYER                   │
│  ├─ users-services.mjs                  │
│  ├─ groups-services.mjs                 │
│  └─ competitions-services.mjs           │
├─────────────────────────────────────────┤
│  DATA ACCESS LAYER                      │
│  ├─ users-data-elastic.mjs (Elastic)    │
│  ├─ foccacia-data-elastic.mjs (Elastic) │
│  └─ fapi-teams-data.mjs (Football API)  │
└─────────────────────────────────────────┘
```

### Padrões de Design Implementados
- ✅ **Dependency Injection (DI)** - Todas as camadas recebem dependências via factory functions
- ✅ **Repository Pattern** - Abstração do acesso a dados (implementado com ElasticSearch)
- ✅ **Factory Pattern** - Módulos exportam funções `init()` que retornam objetos com métodos
- ✅ **Separation of Concerns** - Web API/Site separados, services isolados de data access
- ✅ **Error Handling Centralizado** - Mapeamento de erros internos para HTTP responses

---

## 📦 Estrutura de Ficheiros

```
foccacia/
├── 📄 foccacia-server.mjs          # Entry point + configuração Express + DI
├── 📄 package.json                 # Dependências e scripts
├── 📄 docker-compose.yml            # ElasticSearch + Kibana
├── 📁 scripts/
│   └── populate-elastic.mjs         # Criação de índices + dados de teste (npm run populate)
│
├── 📁 web/                         # Camada de Apresentação
│   ├── 📁 api/                     # Controllers da API REST (JSON)
│   │   ├── users-web-api.mjs       # POST /api/users
│   │   ├── competitions-web-api.mjs # GET /api/competitions
│   │   ├── groups-web-api.mjs      # CRUD /api/groups
│   │   └── process-request.mjs     # Helper para processar requests
│   │
│   └── 📁 site/                    # Interface Web (HTML)
│       ├── foccacia-web-site.mjs   # Controller das páginas web
│       ├── 📁 views/               # Templates Handlebars
│       │   ├── 📁 layouts/         # Layout base (main.hbs)
│       │   ├── 📁 partials/        # Componentes reutilizáveis (navbar.hbs)
│       │   ├── 📁 groups/          # Páginas de grupos
│       │   │   ├── list.hbs        # Lista de grupos
│       │   │   ├── details.hbs     # Detalhes de um grupo
│       │   │   └── create.hbs      # Formulário criar grupo
│       │   ├── home.hbs            # Home page
│       │   ├── login.hbs           # Login (não usado na Parte 1)
│       │   └── error.hbs           # Página de erro
│       │
│       └── 📁 public/              # Assets estáticos
│           └── styles.css          # CSS customizado
│
├── 📁 services/                    # Camada de Negócio
│   ├── users-services.mjs          # Lógica de utilizadores
│   ├── groups-services.mjs         # Lógica de grupos (validações)
│   ├── competitions-services.mjs   # Lógica de competições
│   └── foccacia-services.mjs       # (Legado - não usado)
│
├── 📁 data/                        # Camada de Acesso a Dados
│   ├── 📁 elastic/                  # Implementação ElasticSearch
│   │   ├── users-data-elastic.mjs   # Users repository (ES)
│   │   └── foccacia-data-elastic.mjs # Groups repository (ES)
│   ├── 📁 mem/                      # Implementação alternativa (legado/testes)
│   │   └── fapi-teams-data.mjs      # Fetch Football API
│
│   └── 📁 mock/                    # Dados mock para testes
│       ├── mock-users-data.mjs     # 2 users pré-criados
│       ├── mock-groups-data.mjs    # Grupos de exemplo
│       └── mock-fapi-teams-data.mjs # Dados da Football API simulados
│
├── 📁 commons/                     # Utilitários partilhados
│   └── 📁 errors/
│       ├── internal-errors.mjs     # Definição de erros de negócio
│       └── errors-to-http-responses.mjs # Mapeamento erro → HTTP status
│
├── 📁 test/                        # Testes Unitários (Mocha)
│   ├── users-services-test.mjs     # 6 testes
│   ├── groups-services-test.mjs    # 9 testes
│   ├── groups-addplayer-test.mjs   # 3 testes
│   └── competitions-services-test.mjs # 3 testes
│
├── 📁 docs/                        # Documentação
│   ├── foccacia-api-spec.yaml      # OpenAPI 3.0 (505 linhas)
│   ├── foccacia-api-requests.http  # Requests para REST Client
│   ├── groups-requests.http        # Requests de grupos
│   ├── competitions-requests.http  # Requests de competições
│   └── users-requests.http         # Requests de users
│
└── 📄 README.md                    # Este ficheiro
```

**Estatísticas:**
- 📊 **39 ficheiros .mjs** (módulos JavaScript)
- 📊 **8 templates .hbs** (Handlebars)
- 📊 **21 testes unitários** (Mocha)

---

## 🚀 Como Executar

### 1️⃣ Instalação
```bash
# Clonar repositório
git clone https://github.com/isel-leic-ipw/isel-leic-ipw-pi-2526i-foccacia-leic2526i-ipw33d-g01.git
cd isel-leic-ipw-pi-2526i-foccacia-leic2526i-ipw33d-g01

# Instalar dependências
npm install
```

### 2️⃣ Iniciar ElasticSearch (Docker)

```bash
docker-compose up -d
```

ElasticSearch ficará disponível em `http://localhost:9200`.

### 3️⃣ Configurar variáveis de ambiente

Criar/editar o ficheiro `.env` na raiz. Exemplo (mínimo recomendado):

```env
# ElasticSearch (opcional: por omissão usa http://localhost:9200)
ELASTIC_URL=http://localhost:9200

# Football Data API (necessário para /api/competitions e para adicionar jogadores)
API_KEY=your_api_key_here
API_BASE_URL=http://api.football-data.org/v4
```

Notas:
- Também são aceites nomes alternativos para a key (`KEY`, `FOOTBALL_API_KEY`).
- Existe um modo mock para a Football API (configurável em `foccacia-server.mjs`).

### 4️⃣ Introdução automática de dados (CRÍTICO)

Este projeto inclui um script de povoamento que cria os índices e injeta utilizadores/grupos de teste.

```bash
npm run populate
```

### 5️⃣ Executar Servidor
```bash
npm start
```

**Saída esperada:**
```
FOCCACIA API running on port 3000!
```

### 6️⃣ Aceder à Aplicação

| Recurso | URL | Descrição |
|---------|-----|-----------|
| 🌐 **Interface Web** | http://localhost:3000/site | Home page da aplicação |
| 📋 **Documentação API** | http://localhost:3000/api-doc | Swagger UI interativo |
| 🔧 **API REST** | http://localhost:3000/api | Endpoints JSON |

### Credenciais de teste (pós-populate)

- `alice` / `123456`
- `bob` / `123456`

---

## 🧪 Executar Testes

```bash
npm test
```

**Resultado esperado:**
```
  Groups Services Test
    ✔ should create a new group
    ✔ should return all groups for a user
    ✔ should get group by id
    ✔ should update group name
    ✔ should update group description
    ✔ should delete a group
    ✔ should add a player to a group
    ✔ should remove a player from a group
    ✔ should not exceed 11 players

  Users Services Test
    ✔ should create a new user
    ✔ should validate existing token
    ✔ should reject invalid token
    ✔ should not create duplicate users
    ✔ should require username
    ✔ should require minimum username length

  Competitions Services Test
    ✔ should list all competitions
    ✔ should get teams by competition code
    ✔ should handle invalid competition code

  Groups Add Player Test
    ✔ should add player with all details
    ✔ should reject player without required fields
    ✔ should not add player if group is full

  21 passing (45ms)
```

---

## 📡 API REST - Endpoints Disponíveis

### 🔓 Públicos (sem autenticação)

#### **POST /api/users**
Criar novo utilizador e obter token de autenticação.

**Request:**
```json
{
  "username": "joaosilva",
  "password": "123456"
}
```

**Response:**
```json
{
  "username": "joaosilva",
  "token": "f8e3a1b2-4c9d-4e7f-9a2b-1c3d4e5f6a7b"
}
```

#### **GET /api/competitions**
Listar todas as competições disponíveis.

**Header obrigatório:**
```
X-Auth-Token: <football_api_key>
```

**Response:**
```json
[
  {
    "code": "PL",
    "name": "Premier League"
  },
  {
    "code": "PD",
    "name": "Primera Division"
  }
]
```

#### **GET /api/competitions/:code/teams?season=YYYY**
Obter equipas e jogadores de uma competição específica, por época.

**Headers obrigatórios:**
```
X-Auth-Token: <football_api_key>
```

**Exemplo:** `GET /api/competitions/PL/teams?season=2023`

**Response:**
```json
[
  {
    "id": 65,
    "code": "MCI",
    "name": "Manchester City",
    "tla": "MCI"
  }
]
```

---

### 🔒 Protegidos (requerem Bearer Token)

**Header obrigatório:**
```
Authorization: Bearer f8e3a1b2-4c9d-4e7f-9a2b-1c3d4e5f6a7b
```

#### **GET /api/groups**
Listar todos os grupos do utilizador autenticado.

**Response:**
```json
[
  {
    "id": "1",
    "name": "Dream Team",
    "description": "Os melhores jogadores",
    "competition": "PL",
    "year": 2024,
    "players": [...]
  }
]
```

#### **POST /api/groups**
Criar novo grupo.

**Request:**
```json
{
  "name": "My Squad",
  "description": "Best players ever",
  "competition": "PL",
  "year": 2024
}
```

#### **GET /api/groups/:id**
Obter detalhes de um grupo específico.

#### **PUT /api/groups/:id**
Atualizar informações do grupo.

**Request:**
```json
{
  "name": "New Name",
  "description": "New description"
}
```

#### **DELETE /api/groups/:id**
Eliminar um grupo.

#### **POST /api/groups/:id/players**
Adicionar jogador ao grupo (máximo 11).

**Request:**
```json
{
  "playerId": "44"
}
```

**Nota:** Para adicionar jogadores é necessário que a Football API key esteja configurada (o serviço valida o `playerId` contra a Football Data API).

#### **DELETE /api/groups/:id/players/:playerId**
Remover jogador do grupo.

---

## 🌐 Interface Web - Páginas Disponíveis

### Rotas Web (HTML)

| Rota | Método | Descrição |
|------|--------|-----------|
| `/site` | GET | Home page com apresentação |
| `/site/login` | GET | Formulário de login |
| `/site/login` | POST | Autenticação (sessão) |
| `/site/logout` | POST | Terminar sessão |
| `/site/groups` | GET | Lista de todos os grupos |
| `/site/groups/new` | GET | Formulário criar grupo |
| `/site/groups/new` | POST | Submeter novo grupo |
| `/site/groups/:id/update` | GET | Formulário editar grupo |
| `/site/groups/:id/update` | POST | Submeter alterações |
| `/site/groups/:id/delete` | POST | Remover grupo |
| `/site/groups/:id/players` | POST | Adicionar jogador |
| `/site/groups/:id/players/:playerId/delete` | POST | Remover jogador |
| `/site/groups/:id` | GET | Detalhes e jogadores do grupo |

### Funcionalidades Implementadas

✅ **Home Page** - Landing page responsiva com Bootstrap  
✅ **Lista de Grupos** - Cards com informações de cada grupo  
✅ **Criar Grupo** - Formulário com validação (nome, competição, ano)  
✅ **Detalhes do Grupo** - Visualizar jogadores e informações  
✅ **Navegação** - Navbar responsiva com links entre páginas  
✅ **Design Moderno** - Bootstrap 5.3 + CSS customizado  

### Screenshots das Páginas

#### Home Page (`/site`)
- Apresentação da aplicação
- Botões para "View My Groups" e "Create New Group"
- Cards informativos sobre funcionalidades

#### Lista de Grupos (`/site/groups`)
- Grid de cards com todos os grupos
- Informações: Nome, descrição, competição, nº jogadores
- Botão "View Details" em cada card

#### Criar Grupo (`/site/groups/new`)
- Formulário com campos:
  - Nome do grupo (obrigatório)
  - Descrição (opcional)
  - Competição (dropdown: PL, PD, SA, BL1, FL1)
  - Ano da época (2020-2030)
- Botões "Create Group" e "Cancel"

#### Detalhes do Grupo (`/site/groups/:id`)
- Informações do grupo
- Tabela de jogadores (nome, posição, nacionalidade, equipa)
- Botão "Back to Groups"

---

## 📚 Documentação Adicional

### Ficheiros de Documentação

| Ficheiro | Conteúdo |
|----------|----------|
| [`WEB_INTERFACE.md`](WEB_INTERFACE.md) | Guia completo da interface web |
| [`DEVELOPMENT.md`](DEVELOPMENT.md) | Status do desenvolvimento e métricas |
| [`ANALISE_PROJETO.md`](ANALISE_PROJETO.md) | Análise técnica detalhada |
| [`docs/foccacia-api-spec.yaml`](docs/foccacia-api-spec.yaml) | Especificação OpenAPI 3.0 completa |

### OpenAPI / Swagger

A documentação interativa está disponível em:
- **URL:** http://localhost:3000/api-doc
- **Formato:** OpenAPI 3.0 (YAML)
- **Linhas:** 505
- **Endpoints documentados:** 10
- **Schemas definidos:** 7

---

## 🔐 Autenticação

### Web Site (HTML)
- O Web Site usa **sessões** (`express-session`) e autenticação via **Passport Local Strategy**.
- Após login com username/password, o utilizador fica disponível em `req.user` e o token do utilizador é usado internamente para operações sobre grupos.
- Comportamento de conveniência: ao efetuar login, se o utilizador ainda não existir na base de dados, ele é criado automaticamente.

### API REST (JSON)
- A API usa **Bearer Token** nos endpoints protegidos.
- O token é obtido ao criar utilizador em `POST /api/users` (ou via `npm run populate` para credenciais de teste).

---

## 🧩 Dependências

### Produção
```json
{
  "express": "^5.1.0",          // Framework web
  "hbs": "^4.2.0",              // Template engine Handlebars
  "bootstrap": "^5.3.8",        // CSS framework
  "cors": "^2.8.5",             // CORS middleware
  "swagger-ui-express": "^5.0.1", // Documentação API
  "yamljs": "^0.3.0"            // Parser YAML
}
```

### Desenvolvimento
```json
{
  "mocha": "^11.7.4"            // Framework de testes
}
```

**Total de dependências:** 6 (prod) + 1 (dev)

---

## ✅ Status do Projeto

### Entrega Final ✅
- [x] **API REST** - Endpoints implementados e documentados (Swagger UI)
- [x] **Interface Web** - Gestão completa de grupos via HTML (com autenticação)
- [x] **Persistência ElasticSearch** - Índices `users` e `groups`
- [x] **Povoamento automático** - Script `npm run populate`
- [x] **Integração Football API** - Competições/equipas/jogadores (com modo mock)
- [x] **Error Handling** - Mapeamento centralizado de erros

---

## 📊 Métricas do Projeto

| Métrica | Valor |
|---------|-------|
| **Linhas de Código** | ~2500 |
| **Módulos JavaScript** | 39 |
| **Templates Handlebars** | 8 |
| **Endpoints API** | 10 |
| **Páginas Web** | 5 |
| **Testes Unitários** | 21 (executar com `npm test`) |
| **Camadas de Arquitetura** | 3 (Web, Services, Data) |
| **Padrões de Design** | 5 (DI, Repository, Factory, SoC, Error Handling) |
| **Documentação (linhas)** | 505 (OpenAPI) + 400 (README/MD) |

---

## 🐛 Problemas Conhecidos

### Limitações Atuais
1. **Rate limiting externo** - A Football Data API pode limitar pedidos (ex.: plano free).
2. **Credenciais simples (académico)** - Passwords são armazenadas de forma simples (não recomendado para produção).
3. **Elastic sem security (dev)** - No `docker-compose.yml` a segurança do Elastic está desativada para simplificar a execução local.

---

## 📝 Notas Importantes

### Football Data API
- **Versão:** v4
- **Base URL:** `https://api.football-data.org/v4`
- **Header obrigatório:** `X-Auth-Token: <your_api_key>`
- **Rate Limit (Free):** 10 requests/minuto
- **Plano recomendado:** Tier One (€24/mês) ou usar modo mock

### Modo Mock
Para desenvolver sem API key:
1. Editar `foccacia-server.mjs`
2. Garantir `const USE_MOCK_DATA = true;`
3. Reiniciar servidor

---

## 🤝 Contribuições

Este é um projeto académico da UC de IPW do ISEL.  
**Não são aceites contribuições externas.**

---

## 📄 Licença

ISC License - Projeto Académico  
© 2025 Yorky Reyes, Victor Gorincioi, Martim Monteiro

---


**Grupo FOCCACIA - LEIC33D Grupo 01**  
**Instituição:** ISEL - Instituto Superior de Engenharia de Lisboa  
**UC:** Introdução à Programação Web (IPW)  

---

**Última atualização:** 10 Janeiro 2026  
**Versão:** 2.0.0 (Entrega Final - ElasticSearch + Autenticação + Povoamento)
