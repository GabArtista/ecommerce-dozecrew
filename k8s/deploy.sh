#!/bin/bash
# Script de deploy do e-commerce no servidor k3s
# Executar como root no servidor: bash /tmp/ecommerce/k8s/deploy.sh

set -e

NAMESPACE=ecommerce
BACKEND_DIR=/tmp/ecommerce/backend
FRONTEND_DIR=/tmp/ecommerce/frontend
K8S_DIR=/tmp/ecommerce/k8s

echo "=== [1/7] Criando namespace e secrets ==="
kubectl apply -f "$K8S_DIR/namespace.yaml"
kubectl apply -f "$K8S_DIR/secrets.yaml"

echo "=== [2/7] Build imagem backend (Medusa) ==="
cd "$BACKEND_DIR"
docker build -t ecommerce/medusa-backend:latest . 2>&1 | tail -5

echo "=== [3/7] Build imagem frontend (Next.js) ==="
cd "$FRONTEND_DIR"
docker build -t ecommerce/shop-frontend:latest . 2>&1 | tail -5

echo "=== [4/7] Importando imagens para k3s ==="
docker save ecommerce/medusa-backend:latest | k3s ctr images import -
docker save ecommerce/shop-frontend:latest | k3s ctr images import -

echo "=== [5/7] Deploy PostgreSQL ==="
kubectl apply -f "$K8S_DIR/postgres.yaml"
echo "Aguardando PostgreSQL ficar pronto..."
kubectl wait --for=condition=ready pod -l app=postgres -n $NAMESPACE --timeout=120s

echo "=== [6/7] Deploy Medusa backend ==="
kubectl apply -f "$K8S_DIR/medusa-backend.yaml"

echo "=== [7/7] Deploy frontend + ingress ==="
kubectl apply -f "$K8S_DIR/frontend.yaml"
kubectl apply -f "$K8S_DIR/ingress.yaml"

echo ""
echo "=== Aguardando pods ficarem prontos ==="
kubectl wait --for=condition=ready pod -l app=medusa-backend -n $NAMESPACE --timeout=180s || true
kubectl wait --for=condition=ready pod -l app=shop-frontend -n $NAMESPACE --timeout=120s || true

echo ""
echo "=== Status final ==="
kubectl get pods -n $NAMESPACE
kubectl get ingress -n $NAMESPACE

echo ""
echo "=== Rodando migrations e seed no backend ==="
MEDUSA_POD=$(kubectl get pod -l app=medusa-backend -n $NAMESPACE -o jsonpath="{.items[0].metadata.name}")
if [ -n "$MEDUSA_POD" ]; then
  kubectl exec -n $NAMESPACE "$MEDUSA_POD" -- npx medusa db:migrate 2>&1 | tail -5
  kubectl exec -n $NAMESPACE "$MEDUSA_POD" -- npm run seed 2>&1 | tail -5

  # Get publishable key and update frontend
  PUB_KEY=$(kubectl exec -n $NAMESPACE "$MEDUSA_POD" -- sh -c "NODE_ENV=production node -e \"
const { Pool } = require('pg');
const p = new Pool({ connectionString: process.env.DATABASE_URL });
p.query('SELECT token FROM api_key WHERE type = \\'publishable\\' LIMIT 1').then(r => { console.log(r.rows[0]?.token || ''); p.end(); });
\"" 2>/dev/null | tail -1)

  if [ -n "$PUB_KEY" ]; then
    echo "Publishable key: $PUB_KEY"
    # Update frontend deployment with key
    kubectl set env deployment/shop-frontend -n $NAMESPACE MEDUSA_PUBLISHABLE_KEY="$PUB_KEY"
  fi
fi

echo ""
echo "Deploy concluido!"
echo "Frontend: https://shop.dozecrew.com"
echo "Backend:  https://shop-back.dozecrew.com"
echo "Health:   https://shop-back.dozecrew.com/health"
