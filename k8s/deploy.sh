#!/bin/bash
# Script de deploy do e-commerce no servidor k3s
# Uso: bash /tmp/ecommerce-full/k8s/deploy.sh [--skip-build] [--backend-only] [--frontend-only]
#
# Flags:
#   --skip-build      Pula o build das imagens Docker (usa imagens já existentes)
#   --backend-only    Reconstrói e redeploya apenas o backend
#   --frontend-only   Reconstrói e redeploya apenas o frontend
#   --reseed          Força re-execução do seed (cuidado: recria dados demo)

set -e

NAMESPACE=ecommerce
REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"
BACKEND_DIR="$REPO_DIR/backend"
FRONTEND_DIR="$REPO_DIR/frontend"
K8S_DIR="$REPO_DIR/k8s"
VERSION=${IMAGE_TAG:-v2.0}

SKIP_BUILD=false
BACKEND_ONLY=false
FRONTEND_ONLY=false
RESEED=false

for arg in "$@"; do
  case $arg in
    --skip-build) SKIP_BUILD=true ;;
    --backend-only) BACKEND_ONLY=true ;;
    --frontend-only) FRONTEND_ONLY=true ;;
    --reseed) RESEED=true ;;
  esac
done

echo "=== Deploy e-commerce Dozecrew (v${VERSION}) ==="
echo "Repo: $REPO_DIR"

echo ""
echo "=== [1/8] Namespace e secrets ==="
kubectl apply -f "$K8S_DIR/namespace.yaml"
kubectl apply -f "$K8S_DIR/secrets.yaml"

echo ""
echo "=== [2/8] Garantindo bucket MinIO ==="
MINIO_POD=$(kubectl get pod -n storage -l app=minio -o jsonpath="{.items[0].metadata.name}" 2>/dev/null || echo "")
if [ -n "$MINIO_POD" ]; then
  kubectl exec -n storage "$MINIO_POD" -- mc alias set local http://localhost:9000 admin SUPER_MINIO_PASSWORD_123 2>/dev/null || true
  kubectl exec -n storage "$MINIO_POD" -- mc mb --ignore-existing local/ecommerce-uploads 2>/dev/null || true
  kubectl exec -n storage "$MINIO_POD" -- mc anonymous set download local/ecommerce-uploads 2>/dev/null || true
  echo "Bucket ecommerce-uploads: OK"
else
  echo "AVISO: MinIO pod não encontrado, certifique-se que o bucket existe"
fi

if [ "$FRONTEND_ONLY" = false ]; then
  if [ "$SKIP_BUILD" = false ]; then
    echo ""
    echo "=== [3/8] Build imagem backend (Medusa) ==="
    cd "$BACKEND_DIR"
    docker build -t "ecommerce/medusa-backend:${VERSION}" -t ecommerce/medusa-backend:latest . 2>&1 | tail -10
    docker save "ecommerce/medusa-backend:${VERSION}" | k3s ctr images import -
    echo "Imagem backend importada: ecommerce/medusa-backend:${VERSION}"
  fi

  echo ""
  echo "=== [4/8] Deploy PostgreSQL ==="
  kubectl apply -f "$K8S_DIR/postgres.yaml"
  echo "Aguardando PostgreSQL..."
  kubectl wait --for=condition=ready pod -l app=postgres -n $NAMESPACE --timeout=120s || true

  echo ""
  echo "=== [5/8] Deploy Medusa backend ==="
  kubectl apply -f "$K8S_DIR/medusa-backend.yaml"
  kubectl rollout restart deployment/medusa-backend -n $NAMESPACE 2>/dev/null || true
fi

if [ "$BACKEND_ONLY" = false ]; then
  if [ "$SKIP_BUILD" = false ]; then
    echo ""
    echo "=== [6/8] Build imagem frontend (Next.js) ==="
    cd "$FRONTEND_DIR"
    docker build -t "ecommerce/shop-frontend:${VERSION}" -t ecommerce/shop-frontend:latest . 2>&1 | tail -10
    docker save "ecommerce/shop-frontend:${VERSION}" | k3s ctr images import -
    echo "Imagem frontend importada: ecommerce/shop-frontend:${VERSION}"
  fi

  echo ""
  echo "=== [7/8] Deploy frontend + ingress ==="
  kubectl apply -f "$K8S_DIR/frontend.yaml"
  kubectl apply -f "$K8S_DIR/ingress.yaml"
fi

echo ""
echo "=== Aguardando pods ficarem prontos ==="
kubectl wait --for=condition=ready pod -l app=medusa-backend -n $NAMESPACE --timeout=300s || true
kubectl wait --for=condition=ready pod -l app=shop-frontend -n $NAMESPACE --timeout=180s || true

echo ""
echo "=== Status dos pods ==="
kubectl get pods -n $NAMESPACE
kubectl get ingress -n $NAMESPACE

if [ "$FRONTEND_ONLY" = false ]; then
  echo ""
  echo "=== [8/8] Migrations e seed ==="
  MEDUSA_POD=$(kubectl get pod -l app=medusa-backend -n $NAMESPACE -o jsonpath="{.items[0].metadata.name}")
  if [ -n "$MEDUSA_POD" ]; then
    echo "Rodando migrations..."
    kubectl exec -n $NAMESPACE "$MEDUSA_POD" -- npx medusa db:migrate 2>&1 | tail -5

    if [ "$RESEED" = true ]; then
      echo "Rodando seed (--reseed ativo)..."
      kubectl exec -n $NAMESPACE "$MEDUSA_POD" -- npm run seed 2>&1 | tail -10
    fi

    # Atualizar publishable key no frontend
    PUB_KEY=$(kubectl exec -n $NAMESPACE "$MEDUSA_POD" -- sh -c "NODE_ENV=production node -e \"
const { Pool } = require('pg');
const p = new Pool({ connectionString: process.env.DATABASE_URL });
p.query('SELECT token FROM api_key WHERE type = \\'publishable\\' LIMIT 1').then(r => { console.log(r.rows[0]?.token || ''); p.end(); });
\"" 2>/dev/null | tail -1)

    if [ -n "$PUB_KEY" ] && [[ "$PUB_KEY" == pk_* ]]; then
      echo "Atualizando MEDUSA_PUBLISHABLE_KEY: ${PUB_KEY:0:20}..."
      kubectl set env deployment/shop-frontend -n $NAMESPACE MEDUSA_PUBLISHABLE_KEY="$PUB_KEY"
    fi
  fi
fi

echo ""
echo "=================================================="
echo "Deploy concluido!"
echo "  Frontend: https://shop.dozecrew.com"
echo "  Backend:  https://shop-back.dozecrew.com"
echo "  Health:   https://shop-back.dozecrew.com/health"
echo "  Admin:    https://shop-back.dozecrew.com/app"
echo "=================================================="
