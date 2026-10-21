#!/bin/bash

set -u

if ! command -v firebase >/dev/null 2>&1; then
  echo "❌ Firebase CLI não encontrado. Instale com: npm install --global firebase-tools"
  exit 1
fi

if [ ! -f firebase.json ]; then
  echo "❌ firebase.json não encontrado neste diretório."
  exit 1
fi

echo "🔧 Iniciando build..."
export REACT_APP_APP_ENV=production

if ! npm run build; then
  echo "❌ Erro no build. Abortando deploy."
  exit 1
fi

echo "🚀 Deploy no Firebase (site pacoca-clicker-493322)..."

if ! firebase deploy --only hosting; then
  echo "❌ Erro no deploy do Firebase."
  exit 1
fi

echo "✅ Deploy finalizado!"
