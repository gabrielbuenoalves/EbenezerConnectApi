# Deploy AWS Free Tier (EC2 + Docker Compose)

Este guia eh o caminho recomendado para o projeto atual:
- Frontend Angular SSR
- API .NET 8
- Nginx reverse proxy
- MySQL externo (fora do compose)

## 1) O que entra no Free Tier

- EC2 t3.micro (x86) ou t4g.micro (ARM), ate 750h/mes por 12 meses
- EBS gp2/gp3 ate o limite do Free Tier

Observacoes:
- Route 53 e NAT Gateway podem gerar custo
- Free Tier da AWS normalmente vale por 12 meses em conta nova

## 2) Criar infraestrutura minima

1. Crie uma instancia EC2 Ubuntu 22.04 LTS
2. Security Group:
   - TCP 22: seu IP
   - TCP 80: 0.0.0.0/0
   - TCP 443: 0.0.0.0/0
3. Associe um Elastic IP (opcional, mas recomendado para IP fixo)
4. Configure DNS do seu dominio para o IP publico da EC2

## 3) Preparar servidor

```bash
ssh -i SUA_CHAVE.pem ubuntu@SEU_IP
sudo apt update && sudo apt upgrade -y
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
newgrp docker
docker --version
docker compose version
```

## 4) Subir projeto

```bash
git clone SEU_REPO
cd EbenezerConnectApi
cp .env.example .env
nano .env
```

Preencha no .env:
- DB_CONNECTION_STRING
- JWT_KEY
- JWT_ISSUER
- JWT_AUDIENCE
- EMAIL_FROM
- EMAIL_PASSWORD
- APP_BASE_URL
- Cors__AllowedOrigins
- SeedAdmin__Enabled=false

Suba os containers:

```bash
docker compose -f docker-compose.prod.yml --env-file .env up -d --build
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f
```

## 5) HTTPS (recomendado)

Voce tem 2 opcoes:

1. TLS no proprio Nginx do projeto (Let\'s Encrypt + certbot)
2. TLS no Cloudflare e trafego HTTP entre Cloudflare e EC2 (mais simples, menos recomendado)

Se ainda nao configurar TLS no Nginx, mantenha APP_BASE_URL em http e depois mude para https quando ativar certificado.

## 6) Checklist de producao

- ASPNETCORE_ENVIRONMENT=Production
- Segredos somente via .env
- SeedAdmin__Enabled=false
- Cors__AllowedOrigins com dominio real
- Backup do banco externo ativo
- Rotacao de credenciais antigas

## 7) Comandos uteis

```bash
# Status
docker compose -f docker-compose.prod.yml ps

# Logs por servico
docker compose -f docker-compose.prod.yml logs -f api
docker compose -f docker-compose.prod.yml logs -f web
docker compose -f docker-compose.prod.yml logs -f nginx

# Restart
docker compose -f docker-compose.prod.yml restart

# Stop
docker compose -f docker-compose.prod.yml down
```
