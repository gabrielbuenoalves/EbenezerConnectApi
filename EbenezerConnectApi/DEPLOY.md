# Deploy com Docker Compose (sem MySQL local)

Este projeto foi preparado para subir em producao usando Docker Compose com:
- API .NET 8.0
- Frontend Angular 21 com SSR
- Nginx 1.27 como reverse proxy
- MySQL externo (ja existente, NAO gerenciado por Compose)

## 1) Pre-requisitos no servidor

- VM Linux com IP publico (recomendado: Oracle Cloud Always Free Ampere)
- Docker 20.10+ e Docker Compose 2.0+ instalados
- Portas liberadas no Security List / firewall:
  - 80 (HTTP)
  - 443 (HTTPS, quando configurar certificado)
- Acesso ao host MySQL externo (credenciais e IP validados)

## 2) Preparar variaveis de ambiente

Na raiz do projeto, copie `.env.example` para `.env` e preencha todos os valores reais:

```bash
cp .env.example .env
nano .env  # ou editor de sua preferencia
```

**Variaveis obrigatorias** (do seu banco externo e servico SMTP):
- `DB_CONNECTION_STRING` — conexao com MySQL existente
- `JWT_KEY` — alterar para uma chave aleatoria de 32+ caracteres
- `EMAIL_FROM` — email SMTP como remetente
- `EMAIL_PASSWORD` — senha ou app-specific password do SMTP
- `APP_BASE_URL` — URL publica da aplicacao (sem trailing slash)
- `Cors__AllowedOrigins` — lista de dominios permitidos (separados por `;`)

**Variaveis opcionais**:
- `SeedAdmin__Enabled` — `true` para criar admin no primeiro run, `false` em producao
- `SeedAdmin__*` — customizar email/senha do seed admin se habilitado

**Exemplo para producao:**
```bash
DB_CONNECTION_STRING=server=seu-mysql-host;port=3306;database=ebenezer;uid=app_user;pwd=SENHA_FORTE
JWT_KEY=kL9m!@#$%^&*()_+{}:|<>?-=[];\\',.P2x9Y5bQ8wR3sT7u
JWT_ISSUER=EbenezerConnectApi
JWT_AUDIENCE=EbenezerConnectApp
EMAIL_FROM=noreply@seudominio.com
EMAIL_PASSWORD=SENHA_APP_SPECIFIC
APP_BASE_URL=https://api.seudominio.com
Cors__AllowedOrigins=https://seudominio.com;https://www.seudominio.com
SeedAdmin__Enabled=false
```

## 3) Build e subida dos containers

Na raiz do projeto (onde esta docker-compose.prod.yml):

```bash
docker compose -f docker-compose.prod.yml --env-file .env up -d --build
```

Verificar status dos containers:

```bash
docker compose -f docker-compose.prod.yml ps
```

Monitorar logs em tempo real:

```bash
docker compose -f docker-compose.prod.yml logs -f
```

Subir/parar manualmente:

```bash
docker compose -f docker-compose.prod.yml up -d     # subir
docker compose -f docker-compose.prod.yml down      # parar
docker compose -f docker-compose.prod.yml restart   # reiniciar
```

## 4) Rotas publicas possiveis

Depois de subir com sucesso:
- **Frontend**: `http://SEU_IP/` ou `https://seu-dominio.com/`
- **API**: `http://SEU_IP/api/...` ou `https://seu-dominio.com/api/...`
- **Swagger** (apenas Dev): `http://localhost:5000/swagger` (nao acessivel via Nginx em Prod)

## 5) Oracle Cloud Free Tier (passo a passo rapido)

### 5.1 - Criar instancia

1. Console Oracle Cloud → Compute → Instances → Create Instance
2. Image & Shape: **Canonical Ubuntu** ou **Oracle Linux 8.9**
3. Shape: **Ampere (Always Free)** — 4 OCPUs, 24GB RAM
4. Networking: Default VCN, atribuir IP publico
5. SSH Key: adicionar sua chave publica
6. Clicar Create

### 5.2 - Configurar VM

```bash
# SSH para a VM (substituir IP)
ssh ubuntu@SEU_IP_PUBLICO

# Atualizar pacotes
sudo apt update -y && sudo apt upgrade -y

# Instalar Docker (Ubuntu)
curl -fsSL https://get.docker.com -o get-docker.sh && sudo sh get-docker.sh
sudo usermod -aG docker $USER
newgrp docker

# (Optional) Instalar Docker Compose separado (se nao vier com a versao 2+)
sudo apt install -y docker-compose
```

### 5.3 - Clonar repositorio e configurar

```bash
git clone https://seu-repo.git
cd EbenezerConnectApi

# Editar .env com seus valores
cp .env.example .env
nano .env
```

### 5.4 - Subir a aplicacao

```bash
docker compose -f docker-compose.prod.yml --env-file .env up -d --build
```

### 5.5 - Abrir porta 80 no firewall Oracle

1. Console Oracle Cloud → Networking → Virtual Cloud Network
2. Encontrar sua VCN
3. Security Lists → Default Security List
4. Add Ingress Rule:
   - Source CIDR: `0.0.0.0/0`
   - IP Protocol: TCP
   - Destination Port: `80` (depois adicione `443`)
5. Save changes

Também na VM (se usando firewall local):
```bash
sudo iptables -A INPUT -p tcp --dport 80 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 443 -j ACCEPT
# Para persistir (Ubuntu):
sudo apt install -y iptables-persistent
sudo netfilter-persistent save
```

## 6) HTTPS com Let's Encrypt (proximo passo)

Instale Certbot e configure auto-renewal:

```bash
sudo apt install -y certbot python3-certbot-nginx

# Gerar certificado (substituir dominio)
sudo certbot certonly --standalone -d seu-dominio.com -d www.seu-dominio.com

# Atualizar nginx volume no compose com certificados
```

Edite `infra/nginx/default.conf` para redirecionar HTTP → HTTPS e servidor HTTPS na porta 443.

## 7) Recomendacoes de seguranca CRITICAS

- ✅ **Ja implementado**: CORS restringido por dominio (nao permite AllowAnyOrigin)
- ✅ **Ja implementado**: Swagger desativado em Producao (apenas Development)
- ✅ **Ja implementado**: Seed admin controlado por variavel (desativado por padrao em Prod)
- ✅ **Ja implementado**: Segredos NAO versionados (somente via .env)
- ⚠️ **TODO**: HTTPS/TLS (adicionar Certbot + Let's Encrypt)
- ⚠️ **TODO**: Rate-limiting na API (implementar no Nginx ou .NET)
- ⚠️ **TODO**: Audit logs de autenticacao e financeiro
- ⚠️ **TODO**: Backup automatico do MySQL externo
- ⚠️ **TODO**: Monitoramento e alertas (Prometheus, Grafana, etc)

## 8) Troubleshooting

### Erro de conexao com MySQL
- Validar `DB_CONNECTION_STRING` com telnet ao host
- Confirmar que o MySQL permite conexoes remotas
- Verificar firewall do MySQL (porta 3306)

### Swagger visivel em Producao
- Revisar `ASPNETCORE_ENVIRONMENT=Production` no compose
- Verificar se Swagger foi habilitada no `appsettings.Production.json`

### CORS bloqueando frontend
- Validar `Cors__AllowedOrigins` no .env
- Confirmar que URL do browser bate exatamente com origem declarada

### Containers saindo/crasheando
```bash
docker compose -f docker-compose.prod.yml logs api
docker compose -f docker-compose.prod.yml logs web
docker compose -f docker-compose.prod.yml logs nginx
```

## 9) Arquivos e estrutura de deploy

```
.
├── docker-compose.prod.yml       # Definicao dos servicos
├── .env.example                  # Template de variaveis (VERSIONAR)
├── .env                          # Valores reais (IGNORAR DO GIT)
├── EbenezerConnectApi/
│   ├── Dockerfile                # Build da API
│   ├── appsettings.json          # Config base
│   ├── appsettings.Development.json
│   └── appsettings.Production.json  # Config producao (valores por env)
├── ebenezer-connect-web/
│   ├── Dockerfile                # Build do frontend
│   └── src/environments/
│       └── environment.prod.ts   # apiUrl: '/api' (rota relativa)
└── infra/
    └── nginx/
        └── default.conf          # Proxy para API + frontend

