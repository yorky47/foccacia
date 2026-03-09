# Relatório Técnico do Projeto FOCCACIA

**Unidade Curricular:** Introdução à Programação Web (IPW)  
**Curso:** Engenharia Informática e de Computadores (LEIC) - ISEL  
**Grupo:** Yorky, Victor, Martim  
**Semestre:** Inverno 2025/2026

---

## 1. Estrutura da Aplicação

A aplicação **FOCCACIA** (*Football Complete Clubs API and Chelas Internet Application*) é uma solução web desenvolvida em **Node.js**. A arquitetura segue um modelo monolítico modular, onde o servidor fornece tanto a **Web API** (JSON) como o **Web Site** (HTML), partilhando a lógica de negócio e o acesso a dados.

O ponto de entrada é o ficheiro `foccacia-server.mjs`, que orquestra a inicialização dos módulos usando **Injeção de Dependências**.

### 1.1. Ficheiros de Configuração e Dependências
A raiz do projeto contém os ficheiros essenciais para a gestão de dependências e configuração do ambiente:
* **`package.json`**: Define os metadados do projeto e as dependências (ex: `express`, `hbs`, `passport`, `cors`, `swagger-ui-express`, `yamljs`, `bootstrap`).
* **`package-lock.json`**: Garante a consistência das versões das bibliotecas instaladas.
* **`.env`**: Armazena variáveis de ambiente sensíveis e de configuração usadas no arranque (ex: `ELASTIC_URL` e `KEY`/`API_KEY`/`FOOTBALL_API_KEY`).

### 1.2. Componente Servidor (Server-Side)
O servidor utiliza a framework **Express** e organiza-se nas seguintes camadas:

* **Web Layer (`web/`):**
    * **API (`web/api/`):** Controladores que respondem a pedidos RESTful com JSON. Inclui documentação OpenAPI e tratamento de erros centralizado.
    * **Site (`web/site/`):** Controladores que gerem a interação com o utilizador (HBS). Integra o middleware **Passport.js** para gestão de autenticação e sessões.
* **Service Layer (`services/`):** Contém a lógica de negócio independente da infraestrutura.
    * **`groups-services.mjs`**: Valida regras de domínio (ex: propriedade de grupos).
    * **`competitions-services.mjs`**: Gere a lógica de obtenção de dados de futebol, mapeando erros da API externa (ex: 404 Not Found) para erros internos da aplicação. Nota: o rate limit externo (429) é convertido num erro interno que, na Web API, é devolvido como HTTP 400.
* **Data Layer (`data/`):** Abstrai o acesso ao armazenamento.
    * **Elasticsearch**: Módulos para persistência de utilizadores e grupos.
    * **Web API Externa**: Cliente HTTP (`fapi-teams-data`) para consumo de dados de futebol.

### 1.3. Componente Cliente (Interface)
A interface é baseada em **Server-Side Rendering (SSR)**:
* **Vistas (Handlebars):** O HTML é gerado no servidor. A estrutura base está em `layout.hbs`, reutilizando componentes como `navbar.hbs`.
* **Estilo:** Utilização de **Bootstrap** para layout e responsividade, com estilos personalizados em `web/site/public/styles.css`.
* **Interação:** Utilização de formulários para submissão de dados e navegação gerida pelo servidor.

---

## 2. Desenho do Armazenamento de Dados (Elasticsearch)

A persistência é assegurada pelo **Elasticsearch** (v8.15.0), configurado via Docker.

### 2.1. Índices e Mapeamentos
Os mapeamentos são definidos explicitamente no script de povoamento (`populate-elastic.mjs`) para garantir tipos de dados corretos:

* **Índice `users`:**
    * `username`: Tipo `text` (com subcampo `keyword`).
    * `password`: Tipo `text`.
    * `token`: Tipo `text` (para uso em testes de API).
* **Índice `groups`:**
    * `name`: Tipo `text` (com subcampo `keyword`).
    * `description`: Tipo `text`.
    * `competition`: Tipo `text` (com subcampo `keyword`).
    * `year`: Tipo `integer`.
    * `userToken`: Tipo `text` (com subcampo `keyword`) — chave lógica para o utilizador.
    * `players`: Tipo **`nested`**. O uso de *nested objects* permite indexar cada jogador do grupo individualmente com propriedades como `id`, `name`, `position`, `nationality`, `age`, `teamId`, `teamCode` e `teamName`.

### 2.2. Mapeamento de Documentos
A camada de dados converte os documentos do Elasticsearch em objetos de domínio:
* **Leitura:** O campo `_id` do Elastic é exposto como propriedade `id`.
* **Escrita:** Os objetos são enviados como JSON, respeitando os mapeamentos definidos acima.

---

## 3. Documentação da API do Servidor

A API segue os princípios REST e existe uma especificação OpenAPI (`docs/foccacia-api-spec.yaml`). A implementação real do servidor expõe os seguintes *endpoints* e comportamentos (métodos/rotas), com os códigos de estado efetivamente devolvidos.

### Utilizadores (`/api/users`)
* `POST /api/users`: Cria um novo utilizador e devolve um token.
    * Sucesso: **201** com `{ token, username }`.
    * Nota de implementação: o campo `username` é preenchido a partir de `out.name` no controller, pelo que pode ficar vazio caso o service/data layer não exponha `name`.
    * Erros típicos: **400** (username/password inválidos ou user já existente)

### Grupos (`/api/groups`)
Todas as rotas em `/api/groups` estão protegidas por um middleware que exige `Authorization: Bearer <token>`. O middleware valida apenas a presença/formato do header; a validade do token é verificada no service layer.

* `GET /api/groups`: Lista todos os grupos do utilizador autenticado.
    * Sucesso: **200**
    * Erros típicos: **401** (token em falta/inválido), **500**
* `POST /api/groups`: Cria um grupo.
    * Sucesso: **200** (nota: não devolve 201 na implementação atual)
    * Erros típicos: **400** (body inválido), **401** (token em falta/inválido)
* `GET /api/groups/:groupId`: Detalhes de um grupo.
    * Sucesso: **200**
    * Erros típicos: **401**, **404** (não encontrado ou acesso não autorizado é mascarado como 404)
* `PUT /api/groups/:groupId`: Atualiza um grupo.
    * Sucesso: **200** com `{ ok: true }` (nota: não devolve o objeto `Group` na implementação atual)
    * Erros típicos: **400**, **401**, **404**
* `DELETE /api/groups/:groupId`: Remove um grupo.
    * Sucesso: **200** com `{ ok: true }` (nota: não devolve 204 na implementação atual)
    * Erros típicos: **401**, **404**

### Jogadores (`/api/groups/:groupId/players`)
* `POST /api/groups/:groupId/players`: Adiciona jogador ao grupo.
    * Sucesso: **200** (nota: não devolve 201 na implementação atual)
    * Erros típicos: **400** (playerId em falta ou jogador não pertence à competição/época), **401**, **404**, **409** (grupo cheio / jogador duplicado)
* `DELETE /api/groups/:groupId/players/:playerId`: Remove jogador.
    * Sucesso: **200** com `{ ok: true }`
    * Erros típicos: **401**, **404**

### Competições (Via Serviços)
* `GET /api/competitions`: Lista competições (requer header `X-Auth-Token`).
    * Sucesso: **200**
    * Erros típicos: **400** (X-Auth-Token em falta), **401** (API key inválida), **400** (rate limit externo convertido)
* `GET /api/competitions/:code/teams?season=YYYY`: Lista equipas e jogadores (requer header `X-Auth-Token`).
    * Sucesso: **200**
    * Erros típicos: **400** (season/code/key em falta), **401** (API key inválida), **404** (competição inexistente), **400** (rate limit externo convertido)

Nota: o servidor também expõe `POST /api/users` para criar utilizadores e devolver um token.

---

## 4. Instruções de Instalação, Execução e Testes

Para garantir o correto funcionamento da aplicação, siga a ordem dos passos abaixo.

### Pré-requisitos
* **Node.js** (versão LTS recomendada).
* **Docker Desktop** (deve estar instalado e em execução).

### Passo 1: Configuração da Base de Dados (Docker)
A aplicação depende do Elasticsearch. Utilizamos o Docker para evitar instalações manuais.
1.  Na raiz do projeto, abra o terminal e execute:
    ```bash
    docker-compose up -d
    ```
    * **O que faz:** Lê o ficheiro `docker-compose.yml` e inicia os contentores do `elasticsearch` (porta 9200) e `kibana` (porta 5601) em segundo plano.
    * **Verificação:** Aguarde cerca de 30 a 60 segundos até o serviço estar operacional.

### Passo 2: Configuração de Variáveis de Ambiente
Certifique-se de que existe um ficheiro **`.env`** na raiz do projeto.
* O servidor utiliza este ficheiro para carregar configurações no arranque, nomeadamente:
    * `ELASTIC_URL` (URL do Elasticsearch)
    * `KEY` ou `API_KEY` ou `FOOTBALL_API_KEY` (chave para a Football Data API)

Nota: na implementação atual, a porta do servidor é fixa (3000) e a base URL da Football Data API está definida no código.

### Passo 3: Instalação de Dependências
Instale as bibliotecas externas necessárias.
1.  Execute:
    ```bash
    npm install
    ```
    * **O que faz:** Lê o ficheiro `package.json` e instala todas as dependências na pasta `node_modules`.


### Passo 4: Injeção Automática de Dados (Data Seeding)
Para inicializar a base de dados com os índices e dados de teste (ex: utilizadores alice e bob):
1.  Execute:
    ```bash
    npm run populate
    ```
  * **Este passo:**
         cria os índices `users` e `groups` (se não existirem);
         injeta utilizadores de teste e um grupo de demonstração.



### Passo 5: Executar a Aplicação
Com a base de dados pronta e as dependências instaladas, inicie o servidor.
1.  Execute:
    ```bash
    npm start
    ```
    * **O que faz:** Inicia o servidor Node.js (por defeito na porta 3000).
    * **Acesso:** Abra `http://localhost:3000` no navegador para aceder ao Site, ou `http://localhost:3000/api` para a API.

### Passo 6: Executar Testes Automatizados
Para validar a integridade do código e a lógica de negócio, utilize a suite de testes incluída.
1.  Execute:
    ```bash
    npm test
    ```
    * **O que faz:** Executa os testes unitários e de integração localizados na pasta `test/`, validando serviços como `users-services` e `groups-services`.
