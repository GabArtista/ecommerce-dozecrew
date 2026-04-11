# Deploy em Produção

Guia completo para deployar o e-commerce Dozecrew no servidor K3s.

## Arquitetura de Produção

```
Internet
    │
    ├── shop.dozecrew.com ──────────────────────────────────────────────────────────
    │                        NGINX Ingress                                          │
    │                             │                                                 │
    │                    shop-frontend (Next.js)  ◄──── namespace: ecommerce       │
    │                             │                                                 │
    └── shop-back.dozecrew.com ───┤                                                 │
                                  │                                                 │
                         medusa-backend (Medusa.js)                                 │
                                  │                                                 │
                         postgres (PostgreSQL 15)                                   │
                                                                                    │
    s3.minio.dozecrew.com ──────────────────────────────────────────────────────────
                         MinIO (S3-compatible)  ◄──── namespace: storage
                         Bucket: ecommerce-uploads (público para download)
```

### Componentes

| Serviço | Namespace | Imagem | Porta |
|---------|-----------|--------|-------|
| shop-frontend | ecommerce | ecommerce/shop-frontend:v2.0 | 3000 |
| medusa-backend | ecommerce | ecommerce/medusa-backend:v2.0 | 9000 |
| postgres | ecommerce | postgres:15 | 5432 |
| minio | storage | minio/minio | 9000 |

---

## Primeiro Deploy (ambiente novo)

```bash
# 1. Clonar repositório no servidor
git clone https://github.com/GabArtista/ecommerce-dozecrew.git /tmp/ecommerce-full
cd /tmp/ecommerce-full

# 2. Rodar script de deploy completo com seed
bash k8s/deploy.sh --reseed

# Aguarde ~10 minutos para build completo
```

O script faz automaticamente:
- Cria namespace e secrets no K8s
- Garante bucket MinIO com política pública
- Constrói imagens Docker
- Importa imagens no k3s (imagePullPolicy: Never)
- Deploya PostgreSQL, backend, frontend
- Roda migrations e seed
- Atualiza MEDUSA_PUBLISHABLE_KEY no frontend

---

## Atualizar o Sistema (redeploy)

### Apenas backend (código do Medusa)

```bash
cd /tmp/ecommerce-full
git pull origin prod

# Rebuild e redeploy apenas do backend
IMAGE_TAG=v2.1 bash k8s/deploy.sh --backend-only
```

### Apenas frontend (código Next.js)

```bash
cd /tmp/ecommerce-full
git pull origin prod

# Rebuild e redeploy apenas do frontend
IMAGE_TAG=v2.1 bash k8s/deploy.sh --frontend-only
```

### Redeploy completo (sem rebuild)

```bash
kubectl rollout restart deployment/medusa-backend -n ecommerce
kubectl rollout restart deployment/shop-frontend -n ecommerce
```

---

## Secrets e Variáveis de Ambiente

Os secrets estão em `k8s/secrets.yaml` como valores base64. Para atualizar:

```bash
# Gerar novo valor base64
echo -n "novo_valor_secreto" | base64

# Editar o arquivo secrets.yaml com o novo valor, depois:
kubectl apply -f k8s/secrets.yaml
kubectl rollout restart deployment/medusa-backend -n ecommerce
```

### Variáveis críticas em produção

| Secret/ConfigMap | Chave | Descrição |
|-----------------|-------|-----------|
| ecommerce-secrets | JWT_SECRET | Token JWT (32 bytes hex) |
| ecommerce-secrets | COOKIE_SECRET | Cookie secret |
| ecommerce-secrets | POSTGRES_PASSWORD | Senha do PostgreSQL |
| ecommerce-secrets | MINIO_SECRET_KEY | Senha do MinIO (SUPER_MINIO_PASSWORD_123) |
| ecommerce-secrets | ASAAS_API_KEY | Chave da API ASAAS |
| ecommerce-secrets | RESEND_API_KEY | Chave da API Resend |
| deployment/medusa-backend | S3_URL | `https://s3.minio.dozecrew.com/ecommerce-uploads` |
| deployment/medusa-backend | S3_ENDPOINT | `http://minio.storage:9000` |
| deployment/shop-frontend | MEDUSA_PUBLISHABLE_KEY | Atualizada automaticamente pelo deploy.sh |

---

## Gerenciar Dados (Seed)

> ⚠️ **Atenção**: Re-executar o seed em produção com dados reais pode causar duplicatas ou erros. Use `--reseed` apenas em ambiente limpo.

```bash
MEDUSA_POD=$(kubectl get pod -l app=medusa-backend -n ecommerce -o jsonpath="{.items[0].metadata.name}")

# Apenas migrations (seguro sempre)
kubectl exec -n ecommerce $MEDUSA_POD -- npx medusa db:migrate

# Re-seed completo (dados demo + coleções homepage)
kubectl exec -n ecommerce $MEDUSA_POD -- npm run seed
```

O seed cria:
- Região Brasil (BRL)
- Canal de vendas padrão
- Categorias: Camisetas, Moletons, Calças, Merch
- Produtos demo com imagens do S3 AWS (medusa-public-images)
- **Coleções da homepage**: `hidden-homepage-featured-items` e `hidden-homepage-carousel`
- Opções de frete: Padrão (R$ 19,90) e Expresso (R$ 39,90)

---

## Monitoramento

```bash
# Status dos pods
kubectl get pods -n ecommerce
kubectl get pods -n storage

# Logs do backend
kubectl logs -f -l app=medusa-backend -n ecommerce

# Logs do frontend
kubectl logs -f -l app=shop-frontend -n ecommerce

# Health check
curl https://shop-back.dozecrew.com/health

# Verificar imagens no MinIO
kubectl exec -n storage minio-589b94487c-kzmx2 -- mc ls local/ecommerce-uploads
```

---

## Rodar Testes E2E em Produção

```bash
cd /tmp/ecommerce-full/frontend

# Instalar dependências e browsers Playwright
npm install
npx playwright install chromium

# Rodar todos os testes contra produção
PLAYWRIGHT_BASE_URL=https://shop.dozecrew.com \
BACKEND_URL=https://shop-back.dozecrew.com \
MEDUSA_PUBLISHABLE_KEY=pk_... \
npx playwright test --project=chromium

# Ver relatório com screenshots
npx playwright show-report
```

Os screenshots provam visualmente que imagens aparecem. Salvos em `tests/screenshots/`.

---

## Troubleshooting

### Imagens não aparecem na loja

1. Verificar que o bucket MinIO existe e tem política pública:
   ```bash
   kubectl exec -n storage <minio-pod> -- mc ls local/ecommerce-uploads
   kubectl exec -n storage <minio-pod> -- mc anonymous get local/ecommerce-uploads
   ```

2. Verificar que o backend tem as vars S3 configuradas:
   ```bash
   kubectl exec -n ecommerce <backend-pod> -- env | grep S3_
   ```

3. Verificar que o frontend permite o domínio do MinIO (`next.config.ts`):
   - `s3.minio.dozecrew.com` deve estar em `remotePatterns`

4. Testar upload de imagem diretamente:
   ```bash
   curl -X POST https://shop-back.dozecrew.com/admin/uploads \
     -H "Authorization: Bearer $TOKEN" \
     -F "files=@/tmp/test.jpg"
   ```

### Homepage não mostra produtos

1. Verificar que as coleções da home existem:
   ```bash
   curl "https://shop-back.dozecrew.com/store/collections?handle=hidden-homepage-featured-items" \
     -H "x-publishable-api-key: $PUB_KEY"
   ```

2. Se não existirem, re-executar o seed ou criar manualmente no admin.

### Pod em CrashLoopBackOff

```bash
# Ver logs do pod com crash
kubectl logs -n ecommerce <pod-name> --previous

# Verificar eventos do pod
kubectl describe pod -n ecommerce <pod-name>
```

Causas comuns:
- `MEDUSA_PUBLISHABLE_KEY` inválida → execute o deploy.sh para atualizar
- `DATABASE_URL` incorreta → verificar secret `POSTGRES_PASSWORD`
- Falta de memória → aumentar o `resources.limits.memory` no YAML

---

## Fluxo de Upload de Imagens em Produção

```
Admin faz upload
      │
      ▼
Medusa Backend recebe o arquivo
      │
      ▼
@medusajs/file-s3 envia para MinIO
  Endpoint: http://minio.storage:9000
  Bucket: ecommerce-uploads
      │
      ▼
MinIO armazena o arquivo
      │
      ▼
Medusa salva URL pública no banco
  URL: https://s3.minio.dozecrew.com/ecommerce-uploads/{chave}
      │
      ▼
Frontend carrega imagem
  next.config.ts permite: s3.minio.dozecrew.com
  Next.js Image Component otimiza e serve via /_next/image
```
