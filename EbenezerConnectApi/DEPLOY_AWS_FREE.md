# Deploy AWS Free Tier (Passo a Passo Iniciante)

Este guia foi escrito para voce copiar e colar comandos sem precisar conhecer AWS a fundo.
Arquitetura deste projeto:
- Frontend Angular SSR
- API .NET 8
- Nginx reverse proxy
- MySQL externo (o banco ja existe)

## 1) Criar servidor na AWS (EC2)

1. Acesse EC2 > Launch Instance.
2. Nome: `ebenezer-prod`.
3. Imagem: Ubuntu Server 22.04 LTS.
4. Tipo: `t3.micro` (Free Tier).
5. Key pair: crie ou selecione uma e baixe o `.pem`.
6. Security Group (Inbound Rules):
   - SSH (22): `My IP`
   - HTTP (80): `Anywhere`
   - HTTPS (443): `Anywhere`
7. Clique em Launch Instance.

## 2) Conectar na EC2

No seu computador, rode:

```bash
chmod 400 SUA_CHAVE.pem
ssh -i SUA_CHAVE.pem ubuntu@SEU_IP_PUBLICO
```

## 3) Instalar Docker na EC2

```bash
sudo apt update && sudo apt upgrade -y
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
newgrp docker
docker --version
docker compose version
```

## 4) Clonar o projeto

```bash
git clone URL_DO_SEU_REPO
cd EbenezerConnectApi
```

## 5) Criar arquivo .env de producao

Copie e cole exatamente este bloco na EC2:

```bash
cat > .env << 'EOF'
ConnectionStrings__DefaultConnection=server=187.35.145.6;port=3306;database=db_batista;uid=root;pwd=cprg49bn

Jwt__Key=a3F1zM9@p*BvL7$dQs#XzNw!eR4CtU6H
Jwt__Issuer=EbenezerConnectApi
Jwt__Audience=EbenezerConnectApp

EmailSettings__From=acampamentobatistaebenezer@gmail.com
EmailSettings__Password=lgrgcjlooaaesxac

AppSettings__BaseUrl=http://18.229.137.241

Cors__AllowedOrigins__0=http://18.229.137.241
# Se tiver dominio final, adicione mais origens:
# Cors__AllowedOrigins__1=https://seudominio.com
# Cors__AllowedOrigins__2=https://www.seudominio.com

SeedAdmin__Enabled=false
SeedAdmin__Name=Admin
SeedAdmin__Email=admin@example.com
SeedAdmin__Password=troque-esta-senha
SeedAdmin__Cpf=00000000000
EOF
```

Importante:
- Nao rode migrations se seu banco ja esta pronto.
- No servidor do MySQL, libere acesso para o IP da EC2.

## 6) Subir containers

```bash
docker compose -f docker-compose.prod.yml --env-file .env up -d --build
docker compose -f docker-compose.prod.yml ps
```

## 7) Testar se funcionou

1. Frontend: `http://SEU_IP_PUBLICO`
2. API: `http://SEU_IP_PUBLICO/api/...`

Se der erro, veja logs:

```bash
docker compose -f docker-compose.prod.yml logs -f api
docker compose -f docker-compose.prod.yml logs -f web
docker compose -f docker-compose.prod.yml logs -f nginx
```

## 8) Atualizar aplicacao depois

```bash
git pull
docker compose -f docker-compose.prod.yml --env-file .env up -d --build
```

## 9) HTTPS (depois que estiver no ar)

Para manter simples no inicio:
1. Suba primeiro com HTTP e valide tudo.
2. Depois configure dominio + HTTPS (Cloudflare Free ou certbot no Nginx).

## 10) Checklist final de seguranca

- `SeedAdmin__Enabled=false`
- `.env` so no servidor (nao commitar)
- Security Group sem SSH aberto para `Anywhere`
- Backup do banco configurado
