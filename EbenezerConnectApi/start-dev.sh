#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
API_DIR="$ROOT_DIR/EbenezerConnectApi"
WEB_DIR="$ROOT_DIR/ebenezer-connect-web"

API_PID=""
WEB_PID=""

load_nvm() {
  if [ -s "$HOME/.nvm/nvm.sh" ]; then
    . "$HOME/.nvm/nvm.sh"
    nvm use 22 >/dev/null
  else
    echo "[aviso] NVM não encontrado. Usando Node padrão do sistema."
  fi
}

load_env_file() {
  local shared_env_file="$ROOT_DIR/.env"
  local local_env_file="$ROOT_DIR/.env.local"

  if [[ -f "$shared_env_file" ]]; then
    load_env_file_from "$shared_env_file"
  fi

  if [[ -f "$local_env_file" ]]; then
    if is_template_env_file "$local_env_file"; then
      echo "[aviso] .env.local está com placeholders e será ignorado."
    else
      load_env_file_from "$local_env_file"
    fi
  fi

  validate_local_env
}

validate_local_env() {
  local conn="${ConnectionStrings__DefaultConnection:-}"

  if [[ -z "$conn" ]]; then
    echo "[erro] ConnectionStrings__DefaultConnection não foi definida."
    echo "[dica] Defina a conexão do MySQL remoto no seu ambiente ou em .env.local."
    exit 1
  fi
}

is_template_env_file() {
  local file_path="$1"

  if grep -Eq "YOUR_REMOTE_MYSQL_HOST|YOUR_DB_|YOUR_SMTP_|CHANGE_ME_WITH_A_LONG_RANDOM_SECRET|CHANGE_ME_STRONG_PASSWORD" "$file_path"; then
    return 0
  fi

  return 1
}

free_dev_ports() {
  local port

  for port in 5000 4200; do
    local pids
    pids="$(lsof -ti tcp:"$port" 2>/dev/null || true)"

    if [[ -n "$pids" ]]; then
      echo "Liberando porta $port"
      kill -9 $pids 2>/dev/null || true
    fi
  done
}

load_env_file_from() {
  local file_path="$1"

  if [[ ! -f "$file_path" ]]; then
    return
  fi

  echo "Carregando variáveis de ambiente de $(basename "$file_path")"

  while IFS= read -r line || [[ -n "$line" ]]; do
    line="${line%$'\r'}"

    if [[ -z "$line" || "$line" == \#* ]]; then
      continue
    fi

    if [[ "$line" == export\ * ]]; then
      line="${line#export }"
    fi

    if [[ "$line" != *=* ]]; then
      continue
    fi

    local key value
    key="${line%%=*}"
    value="${line#*=}"

    case "$value" in
      '"'*)
        if [[ ${#value} -ge 2 && "$value" == *'"' ]]; then
          value="${value:1:${#value}-2}"
        fi
        ;;
      "'"*)
        if [[ ${#value} -ge 2 && "$value" == *"'" ]]; then
          value="${value:1:${#value}-2}"
        fi
        ;;
    esac

    if [[ "$key" =~ ^[A-Za-z_][A-Za-z0-9_]*$ ]]; then
      printf -v "$key" '%s' "$value"
      export "$key"
    fi
  done < "$file_path"
}

cleanup() {
  echo
  echo "Encerrando processos..."

  if [[ -n "${API_PID}" ]] && kill -0 "$API_PID" 2>/dev/null; then
    kill "$API_PID" 2>/dev/null || true
  fi

  if [[ -n "${WEB_PID}" ]] && kill -0 "$WEB_PID" 2>/dev/null; then
    kill "$WEB_PID" 2>/dev/null || true
  fi
}

run_backend() {
  echo "Iniciando API (.NET) em $API_DIR"
  load_env_file
  free_dev_ports
  cd "$API_DIR"
  ASPNETCORE_ENVIRONMENT=Development dotnet run
}

run_frontend() {
  echo "Iniciando Web (Angular) em $WEB_DIR"
  load_env_file
  free_dev_ports
  cd "$WEB_DIR"
  load_nvm
  npm start
}

run_all() {
  trap cleanup EXIT INT TERM

  echo "Iniciando API (.NET) e Web (Angular)..."
  load_env_file
  free_dev_ports

  (
    cd "$API_DIR"
    ASPNETCORE_ENVIRONMENT=Development dotnet run
  ) &
  API_PID=$!

  (
    cd "$WEB_DIR"
    load_nvm
    npm start
  ) &
  WEB_PID=$!

  echo "API: http://localhost:5000"
  echo "Web: http://localhost:4200"
  echo "Pressione Ctrl+C para encerrar ambos."

  while true; do
    if ! kill -0 "$API_PID" 2>/dev/null; then
      wait "$API_PID" 2>/dev/null || true
      break
    fi

    if ! kill -0 "$WEB_PID" 2>/dev/null; then
      wait "$WEB_PID" 2>/dev/null || true
      break
    fi

    sleep 1
  done
}

MODE="${1:-all}"

case "$MODE" in
  all)
    run_all
    ;;
  backend)
    run_backend
    ;;
  frontend)
    run_frontend
    ;;
  *)
    echo "Uso: $(basename "$0") [all|backend|frontend]"
    exit 1
    ;;
esac
