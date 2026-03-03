#!/usr/bin/env bash
set -euo pipefail

echo "Parando API e frontend..."

pkill -f "dotnet run" 2>/dev/null || true
pkill -f "ng serve" 2>/dev/null || true
pkill -f "npm start" 2>/dev/null || true

lsof -ti tcp:5000 | xargs kill -9 2>/dev/null || true
lsof -ti tcp:4200 | xargs kill -9 2>/dev/null || true

echo "Processos encerrados."
