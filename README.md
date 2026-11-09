# Ebenezer Connect

Sistema web de apoio à operação do acampamento da Igreja Batista Independente de Ribeirão Preto. Reúne, num único produto, o que antes era feito com ficha de papel e planilha Excel: cadastro dos participantes, cantina com estoque e preço, saldo, histórico financeiro e escala dos conselheiros.

A solução tem duas partes:

- **API** ASP.NET Core 8, em `EbenezerConnectApi/EbenezerConnectApi`
- **Cliente** Angular 21, em `EbenezerConnectApi/ebenezer-connect-web`

A persistência é MySQL 8 via Entity Framework Core. As rotas protegidas usam JWT. A senha fica apenas como hash BCrypt.

Repositório: https://github.com/gabrielbuenoalves/EbenezerConnectApi

Ambiente publicado: https://ebenezerconnect.store

Este guia descreve o produto, a execução local e os testes. O deploy em container está em `EbenezerConnectApi/DEPLOY.md` e `EbenezerConnectApi/DEPLOY_AWS_FREE.md`.

## O que o sistema faz

Há três papéis gravados em `Pessoa.Funcao`: `acampante`, `conselheiro` e `admin`. A consulta de saldo e a leitura da escala ativa também funcionam sem login.

| Capacidade | Comportamento |
|---|---|
| Identidade | Cadastro com nome, e-mail, CPF, função e senha. Confirmação de e-mail por token de 24 horas. Login devolve JWT com validade de 2 horas. A claim de papel é a própria função. |
| Pessoas | Listar, consultar, atualizar e remover. Nome e quarto podem ser alterados por qualquer usuário autenticado. E-mail, CPF e função só mudam se o token for de `admin`. |
| Importação | Excel (`.xlsx` ou `.xls`) ou JSON, restrita a `admin` e `conselheiro`. Nome é obrigatório. E-mail ou CPF já cadastrado não gera outro registro. Função fora de `acampante`, `conselheiro` e `admin` é gravada como `acampante`. |
| Produtos | Estoque, preço de compra e preço de venda. Criar o produto ou alterar o preço grava `PrecoHistoricoProduto`. |
| Venda | Exige ao menos um item. Pagamento `saldo` só conclui se o saldo cobrir o total; caso contrário a venda não é gravada e o estoque não muda. Pagamento `avista` não altera saldo. Outro tipo é recusado. |
| Estoque | A quantidade do mesmo produto é somada. A baixa é um `UPDATE` condicionado ao estoque disponível, dentro de transação com isolamento `Serializable`. |
| Saldo | Consulta pública por CPF (busca exata) ou por nome (contém, sem diferenciar maiúsculas). A resposta inclui o quarto, quando houver vínculo. |
| Financeiro | Crédito soma o valor ao saldo e grava `AdicaoSaldo`. O histórico junta vendas e créditos, do mais recente para o mais antigo. Reverter uma venda devolve o estoque e, se o pagamento foi `saldo`, devolve o valor. Reverter um crédito subtrai o valor. Um lançamento já revertido não é revertido de novo. |
| Escala | A lista pública mostra só eventos ativos. Criar, alterar, excluir e incluir entradas exige `admin`. No mesmo evento e no mesmo dia, o mesmo conselheiro não pode ter horários sobrepostos nem intervalo menor que uma hora entre atividades. |

Datas de venda, crédito, reversão e início de vigência de preço usam o horário de Brasília (`E. South America Standard Time`). A criação do evento de escala usa UTC.

Ficou de fora desta versão: CRUD de quarto, pagamento pendente, persistência de telefone e de igreja, e o uso de `CapacidadeMaxima` como limite de conselheiros na entrada. O formulário de cadastro coleta telefone, mas esse campo não é coluna de `Pessoa`.

## Arquitetura

```
Navegador (Angular 21)
        │  http://localhost:5000/api   (desenvolvimento)
        │  /api                        (produção, via Nginx)
        ▼
ASP.NET Core 8
  Controllers  → contrato HTTP, status e autorização
  Services     → cadastro, importação, venda, produto, e-mail e JWT
  Repositories → pessoas, confirmação, produtos e transações
  EF Core      → MySQL 8
        │
        ├── MySQL (externo ao Docker em produção)
        └── SMTP Gmail, porta 587, STARTTLS (confirmação de e-mail)
```

Em produção o Compose sobe três containers: `ebenezer-web` (Angular com SSR), `ebenezer-api` (porta interna 5000) e `ebenezer-nginx` (portas 80 e 443). O MySQL não sobe pelo Compose.

`FinanceiroController` e `EscalasController` acessam o `DbContext` diretamente. A venda efetiva também usa o contexto no serviço, não o repositório de transação.

### Estrutura do repositório

```
EbenezerConnectApi/
├── EbenezerConnectApi.sln
├── EbenezerConnectApi/          API (net8.0)
│   ├── Controllers/
│   ├── Services/
│   ├── Repository/              ApplicationDbContext e migrações
│   ├── Models/                  entidades e DTOs
│   └── Properties/launchSettings.json
├── EbenezerConnectApi.Tests/    suíte xUnit (net10.0)
├── ebenezer-connect-web/        cliente Angular
├── docker-compose.prod.yml
├── .env.example                 variáveis do deploy
├── .env.local.example           modelo das mesmas chaves para a máquina local
├── DEPLOY.md
├── DEPLOY_AWS_FREE.md
└── CONCURRENT_SALES_TEST.md     roteiro manual de vendas simultâneas
```

Os workflows ficam em `.github/workflows/`: `ci.yml` roda `dotnet test` em push e pull request; `deploy.yml` publica somente a branch `main`.

## Pré-requisitos locais

| Ferramenta | Por quê |
|---|---|
| SDK .NET 8 | A API tem `TargetFramework` `net8.0`. |
| SDK .NET 10 | O projeto de testes é `net10.0`. O CI usa `dotnet-version: 10.0.x`. |
| Node.js 20.19+ (ou 22.12+) e npm 11 | Cliente Angular 21. O `package.json` declara `packageManager` `npm@11.9.0`. |
| MySQL 8 | Banco da aplicação. Os testes automatizados não precisam dele. |
| `dotnet-ef` | Aplicar as migrações. A API não cria o esquema sozinha na subida. |

Confira as duas plataformas .NET:

```powershell
dotnet --list-sdks
```

A lista precisa mostrar uma linha `8.x` e uma linha `10.x`. Instale o que faltar em https://dotnet.microsoft.com/download.

Instale a ferramenta de migração uma vez:

```powershell
dotnet tool install --global dotnet-ef
```

Se ela já existir e o comando falhar por versão, atualize com `dotnet tool update --global dotnet-ef`.

## Configurar o banco

A API em execução lê a connection string de `EbenezerConnectApi/EbenezerConnectApi/appsettings.Development.json`, chave `ConnectionStrings:DefaultConnection`. O arquivo versionado aponta para:

```text
server=localhost;port=3306;database=ebenezer_connect_dev;uid=root;pwd=CHANGE_ME
```

Troque `CHANGE_ME` pela senha real do MySQL local. Use somente dados fictícios.

O `dotnet ef` não usa esse arquivo. `DesignTimeDbContextFactory` grava a connection string de design fixa em `server=localhost;port=3306;database=ebenezer_design;uid=root;pwd=design`. Para a migração e a API falarem com o mesmo banco, deixe as duas strings iguais antes de aplicar o esquema. O caminho mais simples no laboratório é criar o banco `ebenezer_design` com usuário `root` e senha `design`, e copiar essa mesma string para `appsettings.Development.json`.

No cliente MySQL:

```sql
CREATE DATABASE ebenezer_design CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Na pasta da API, aplique a migração versionada (`AddEscalas`, que descreve o esquema atual):

```powershell
cd EbenezerConnectApi\EbenezerConnectApi
dotnet ef database update
```

Tabelas criadas: `Pessoa`, `Quarto`, `Produto`, `PrecoHistoricoProduto`, `TransacaoCantina`, `ItemTransacaoCantina`, `AdicaoSaldo`, `EmailConfirmacao`, `EscalaEvento` e `EscalaEntrada`. `Pessoa.Cpf` tem índice único.

## Configurar a API

Além da connection string, `appsettings.Development.json` traz JWT, SMTP, CORS e a URL base. Os placeholders já permitem subir a API. Ajuste o que for usar de verdade:

| Chave | Uso local |
|---|---|
| `Jwt:Key` | Segredo HMAC. Precisa ter 32 caracteres ou mais. O valor de exemplo do arquivo serve para desenvolvimento. |
| `Jwt:Issuer` / `Jwt:Audience` | `EbenezerConnectApi` e `EbenezerConnectApp`. Precisam ser os mesmos na emissão e na validação. |
| `EmailSettings:From` e `EmailSettings:Password` | SMTP. Sem isso o cadastro ainda é gravado: a falha de envio só registra aviso. Em `Development` o login não exige e-mail confirmado. |
| `AppSettings:BaseUrl` | `http://localhost:5000`, sem barra no final. Entra no link de confirmação. |
| `AppSettings:EnableHttpsRedirection` | `false` no arquivo de desenvolvimento. |
| `Cors:AllowedOrigins` | `http://localhost:4200;http://localhost:3000`. O Angular local usa a porta 4200. |
| `SeedAdmin` | Está `Enabled: false`. O `Program.cs` não lê essa seção. Não conta com um administrador criado na subida. |

Variáveis de ambiente do processo sobrescrevem o JSON, no formato do ASP.NET Core (`ConnectionStrings__DefaultConnection`, `Jwt__Key`, e assim por diante). O arquivo `.env.local.example` é o modelo dessas chaves. A API não carrega `.env` nem `.env.local` sozinha. Esse arquivo entra no Docker Compose de produção (`--env-file .env`), não no `dotnet run`.

Não commite senha, connection string real nem chave JWT.

## Rodar a API

Em um terminal, a partir da raiz do repositório:

```powershell
cd EbenezerConnectApi\EbenezerConnectApi
dotnet run --launch-profile http
```

O perfil `http` sobe em `http://localhost:5000` com `ASPNETCORE_ENVIRONMENT=Development` e abre o Swagger. Endereço direto: http://localhost:5000/swagger

O Swagger só existe em Development. No canto superior, use **Authorize** com o valor `Bearer {token}` devolvido pelo login.

O perfil `https` do `launchSettings.json` também escuta em `http://0.0.0.0:5000`. Para o dia a dia, use o perfil `http`.

Rotas em `/api/Auth/dev` existem só com o ambiente `Development`. Fora dele o middleware responde 404. Prefira cadastrar um usuário fictício em `/auth/register`. Não use a credencial fixa do endpoint de criação de administrador, e não a reproduza em documentação nem em captura de tela.

## Rodar o cliente Angular

Em outro terminal, a partir da raiz do repositório:

```powershell
cd EbenezerConnectApi\ebenezer-connect-web
npm install
npm start
```

Abra http://localhost:4200 . O `ng serve` recarrega ao salvar arquivo.

Em desenvolvimento, `src/environments/environment.ts` aponta a API para `http://localhost:5000/api`. O build de produção troca esse arquivo por `environment.prod.ts`, cuja `apiUrl` é `/api` (o Nginx encaminha para a API).

A API precisa estar no ar antes de login, venda, saldo e escala. Sem ela, o navegador mostra falha de rede nas chamadas.

### Telas

| Rota | Quem acessa | Uso |
|---|---|---|
| `/auth/login` e `/auth/register` | Público | Entrada e cadastro |
| `/saldo/consultar` | Público | Consulta de saldo por CPF ou nome |
| `/escala` | Público | Escala ativa |
| `/dashboard` | Autenticado | Página inicial |
| `/pessoas` | Autenticado | Lista de pessoas |
| `/pessoas/importar` | Admin ou conselheiro | Importação Excel ou JSON |
| `/produtos` | Autenticado | Produtos |
| `/transacoes` e `/saida-produtos` | Autenticado | Vendas |
| `/adicionar-saldo` | Autenticado | Crédito |
| `/controle-financeiro` | Autenticado | Histórico e reversão |
| `/escalas` | Admin | Manutenção da escala |

A raiz `/` redireciona para `/dashboard`, que pede login.

### Primeiro uso, com dados fictícios

1. Cadastre um usuário em http://localhost:4200/auth/register com função `admin`, e-mail e CPF inventados. Senha e confirmação precisam ser iguais.
2. Entre em `/auth/login`. Em Development o e-mail não precisa estar confirmado. A resposta traz o token, guardado pelo cliente.
3. Em `/produtos`, crie um produto com estoque e os dois preços.
4. Em `/adicionar-saldo`, lance crédito para essa pessoa.
5. Em `/transacoes`, registre uma venda `saldo` com pelo menos um item. Se o saldo não cobrir o total, a venda é recusada e o estoque permanece.
6. Confira o lançamento em `/controle-financeiro` e a consulta pública em `/saldo/consultar`.
7. Com o mesmo usuário admin, crie um evento em `/escalas` e inclua uma entrada. Uma segunda entrada do mesmo conselheiro, no mesmo dia, com sobreposição ou com menos de uma hora de intervalo, é recusada.

CPF vazio no cadastro ou na importação recebe um CPF técnico de 11 dígitos. E-mail vazio recebe um endereço em `sem-email.local` e já nasce confirmado. A validação de CPF confere 11 dígitos depois de tirar ponto, traço e espaço. Não calcula o dígito verificador.

## Testes

A evidência automatizada está em `EbenezerConnectApi/EbenezerConnectApi.Tests`, com xUnit. O edital da disciplina cita JUnit; a suíte equivalente neste backend é xUnit, porque a API é .NET.

Os testes de venda, estorno e importação usam o provider em memória do Entity Framework, não um MySQL. Por isso não exercitam o `UPDATE` condicional de produção: esse comando só roda quando o provedor é MySQL. O teste de e-mail não envia SMTP. Ele confere o destinatário montado por `EmailService.MontarConfirmacao`.

Na raiz do repositório:

```powershell
dotnet test EbenezerConnectApi\EbenezerConnectApi.sln --configuration Release
```

É o mesmo comando do job `Build and test` em `.github/workflows/ci.yml`. São 9 testes:

| Teste | O que garante |
|---|---|
| `Recusa_venda_em_saldo_quando_o_saldo_nao_cobre_o_total_e_mantem_o_estoque` | Venda `saldo` sem cobertura não grava e não baixa estoque. |
| `Debita_saldo_e_estoque_quando_o_saldo_cobre_a_venda` | Venda `saldo` com cobertura debita a pessoa e baixa o estoque. |
| `Nao_estorna_o_mesmo_credito_duas_vezes` | O mesmo crédito não é estornado duas vezes. |
| `Senha_temporaria_da_importacao_nao_copia_o_inicio_do_cpf` | A senha temporária da importação não repete os seis primeiros dígitos do CPF. |
| `Confirmacao_vai_para_o_email_da_pessoa_cadastrada` | A mensagem de confirmação vai para o e-mail da pessoa. |
| `Registrar_venda_sem_token_retorna_nao_autorizado` | `POST /api/TransacaoCantina/registrar` exige JWT. |
| `Criar_produto_sem_token_retorna_nao_autorizado` | Criar produto exige JWT. |
| `Consulta_de_saldo_sem_token_nao_exige_login` | `GET /api/Saldo/consultar` permanece público. |
| `Rota_de_desenvolvimento_fica_indisponivel_em_producao` | Caminhos `/api/Auth/dev` respondem 404 fora de Development. |

As regras de saldo insuficiente e de estorno único foram escritas primeiro contra o código anterior (o estorno aceitava a segunda chamada e a venda não recusava saldo insuficiente de forma testável) e só depois a implementação passou a recusar a venda e a marcar o crédito como revertido.

Ainda não há teste automatizado para conflito de horário da escala, descanso de uma hora, capacidade máxima, nem para vários casos de aceitação descritos no portfólio (cadastro com senha divergente, login em produção sem confirmação, importação de CPF duplicado, venda com tipo diferente de `saldo` e `avista`). Não há percentual de cobertura medido.

O cliente tem `npm test` (`ng test`, Vitest). O spec versionado ainda espera o título do template do Angular CLI. Ele não protege as telas do Ebenezer e não entra no workflow de CI.

O arquivo `EbenezerConnectApi/CONCURRENT_SALES_TEST.md` é um roteiro manual de duas vendas ao mesmo tempo. O trecho inicial descreve a leitura de estoque que foi substituída. O código atual baixa o estoque com atualização condicional dentro da transação.

## Endpoints

O prefixo é `api/[controller]`. No Swagger local a lista completa está em http://localhost:5000/swagger .

| Método e rota | Autenticação |
|---|---|
| `POST /api/Auth/register` | Anônima |
| `POST /api/Auth/login` | Anônima |
| `POST /api/Auth/redefinir-senha` | Anônima. Confere a senha temporária já armazenada como hash. |
| `GET /api/Auth/confirmar-email?token` | Anônima |
| `POST /api/Auth/dev/confirm-email` | Só Development |
| `POST /api/Auth/dev/create-admin` | Só Development |
| `POST /api/Auth/dev/test-email` | Só Development |
| `GET /api/Pessoa`, `GET /api/Pessoa/funcao/{funcao}`, `GET /api/Pessoa/{id}` | JWT |
| `PUT /api/Pessoa/{id}`, `DELETE /api/Pessoa/{id}` | JWT. Campos sensíveis no `PUT` só com função `admin`. |
| `POST /api/Pessoa/creditos` | JWT |
| `POST /api/Pessoa/importar-excel`, `POST /api/Pessoa/importar-json` | JWT de `admin` ou `conselheiro` |
| `GET /api/Produto`, `GET /api/Produto/{id}` | Pública |
| `POST /api/Produto`, `PUT /api/Produto/{id}`, `DELETE /api/Produto/{id}` | JWT |
| `GET /api/Saldo/consultar` | Pública. Exige CPF ou nome. |
| `POST /api/TransacaoCantina/registrar` | JWT |
| `GET /api/Financeiro/historico` | JWT |
| `POST /api/Financeiro/reverter` | JWT |
| `POST /api/Financeiro/criar-estorno`, `POST /api/Financeiro/desfazer-estorno` | JWT |
| `GET /api/Escalas`, `GET /api/Escalas/{id}` | Pública. A lista omite evento inativo. A consulta por id não aplica esse filtro. |
| `POST /api/Escalas`, `PUT /api/Escalas/{id}`, `DELETE /api/Escalas/{id}` | JWT de `admin` |
| `POST /api/Escalas/{id}/entradas` | JWT de `admin` |
| `DELETE /api/Escalas/{id}/entradas/{entradaId}` | JWT de `admin` |

CORS aceita só as origens configuradas. Sem configuração, o padrão é `http://localhost:4200` e `http://localhost:3000`. Erro não tratado responde 500 com a mensagem genérica `Erro interno no servidor`, sem a pilha. Em Development, a falha do cadastro ainda devolve a exceção no corpo.

## Stack

| Tecnologia | Onde |
|---|---|
| .NET 8 / ASP.NET Core | API, injeção de dependência, pipeline JWT |
| Entity Framework Core 8.0.4 e Pomelo 8.0.1 | Mapeamento MySQL e migrações |
| JWT Bearer 8.0.0 | Rotas com `[Authorize]` |
| BCrypt.Net-Next 4.0.3 | Hash de senha e de senha temporária |
| AutoMapper 12.0.1 | DTO e entidade. E-mail técnico sai vazio na resposta de pessoa. |
| Swashbuckle 6.4.0 | Swagger em Development |
| MailKit 4.11.0 | SMTP com STARTTLS |
| EPPlus 7.0.0 | Leitura da planilha, licença não comercial |
| Angular 21, RxJS, TypeScript 5.9, Tailwind 3 | Cliente e guards de login, admin e admin/conselheiro |
| Angular SSR e Express 5 | Container web |
| Docker e Nginx 1.27 | Publicação |
| GitHub Actions | CI com `dotnet test`; deploy da `main` por SSH |

## Publicação

O passo a passo de servidor, variáveis e Compose está em `EbenezerConnectApi/DEPLOY.md`. O caminho de EC2 no free tier está em `EbenezerConnectApi/DEPLOY_AWS_FREE.md`.

Resumo do que o workflow da `main` faz: entra no servidor por SSH, atualiza o repositório, constrói a imagem da API e depois a do site, e sobe os containers com:

```bash
docker compose -f docker-compose.prod.yml --env-file .env up -d
```

O job de deploy não espera o job de teste. Não há ambiente de homologação separado nem passo de rollback no YAML. Segredos de banco, JWT, SMTP e SSH ficam em variáveis e em secrets do GitHub.

## Privacidade na demonstração

O sistema guarda nome, CPF, e-mail, senha, saldo e quarto. Na máquina local e na banca, use pessoas, produtos e escalas fictícios. Capturas não devem mostrar CPF real, planilha real ou senha. A senha permanece só como hash. A senha temporária da importação é aleatória. O retorno da importação ainda informa essa senha a quem importou, para a pessoa conseguir entrar e redefinir.
