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
  cd "$API_DIR"
  dotnet run
}

run_frontend() {
  echo "Iniciando Web (Angular) em $WEB_DIR"
  cd "$WEB_DIR"
  load_nvm
  npm start
}

run_all() {
  trap cleanup EXIT INT TERM

  echo "Iniciando API (.NET) e Web (Angular)..."

  (
    cd "$API_DIR"
    dotnet run
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
