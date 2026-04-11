# Setup de Desenvolvimento Local

Guia para rodar o e-commerce Dozecrew localmente, sem Kubernetes.

## Pré-requisitos

| Ferramenta | Versão mínima | Verificar |
|-----------|---------------|-----------|
| Node.js | 20.x | `node --version` |
| npm | 10.x | `npm --version` |
| Docker | 24.x | `docker --version` |
| PostgreSQL | 15.x (via Docker) | — |
| MinIO (via Docker) | latest | — |

---

## 1. Subir dependências de infraestrutura

Use o docker-compose na raiz do projeto — sobe PostgreSQL + MinIO e cria o bucket automaticamente:

```bash
# Na raiz do projeto (onde está docker-compose.yml)
docker compose up -d

# Acompanhar logs (opcional)
docker compose logs -f minio-init
```

Serviços após o `up`:
| Serviço | URL | Credenciais |
|---------|-----|-------------|
| PostgreSQL | `localhost:5432` | medusa / senha_local |
| MinIO S3 API | `http://localhost:9002` | admin / password |
| MinIO Console | `http://localhost:9001` | admin / password |

> O serviço `minio-init` cria o bucket `ecommerce-uploads` com acesso público de leitura automaticamente.

Para parar e limpar volumes:
```bash
docker compose down -v
```

---

## 2. Backend (Medusa.js)

```bash
cd backend

# Copiar e editar variáveis de ambiente
cp .env.example .env
# Edite .env com suas credenciais locais

# Instalar dependências
npm install

# Rodar migrations
npx medusa db:migrate

# Rodar seed (dados de demonstração + coleções da home)
npm run seed

# Iniciar em modo desenvolvimento (hot reload)
npm run dev
```

O backend estará em: `http://localhost:9000`  
Painel admin: `http://localhost:9000/app`

### Credenciais padrão do admin

Após o seed, o usuário admin é criado. Veja o script de seed para detalhes, ou crie via:

```bash
npx medusa user --email admin@dozecrew.com --password SuaSenhaAqui
```

---

## 3. Frontend (Next.js)

```bash
cd frontend

# Copiar e editar variáveis de ambiente
cp .env.local.example .env.local
# Edite .env.local com a MEDUSA_PUBLISHABLE_KEY correta

# Como obter a publishable key:
# 1. Acesse http://localhost:9000/app
# 2. Settings > API Keys > copiar chave "publishable"

# Instalar dependências (usando pnpm)
pnpm install  # ou: npm install

# Iniciar em modo desenvolvimento
npm run dev
```

A loja estará em: `http://localhost:3000`

---

## 4. Rodar os testes E2E

```bash
cd frontend

# Instalar browsers do Playwright (primeira vez)
npx playwright install chromium

# Rodar todos os testes (contra localhost)
npx playwright test

# Rodar testes específicos de imagens
npx playwright test tests/e2e/images.spec.ts

# Ver relatório com screenshots
npx playwright show-report
```

### Screenshots de prova

Após os testes, screenshots são salvos em `frontend/tests/screenshots/`. Eles provam visualmente que imagens aparecem corretamente.

---

## 5. Variáveis de ambiente importantes

### Backend (`.env`)

| Variável | Obrigatória | Descrição |
|---------|-------------|-----------|
| `DATABASE_URL` | Sim | URL de conexão PostgreSQL |
| `JWT_SECRET` | Sim | Secret para tokens JWT |
| `COOKIE_SECRET` | Sim | Secret para cookies de sessão |
| `STORE_CORS` | Sim | Origens permitidas para a loja |
| `S3_URL` | Sim | URL pública base do MinIO/S3 |
| `S3_BUCKET` | Sim | Nome do bucket |
| `S3_ENDPOINT` | Sim | Endpoint do MinIO |
| `S3_ACCESS_KEY_ID` | Sim | Credencial de acesso |
| `S3_SECRET_ACCESS_KEY` | Sim | Credencial secreta |
| `ASAAS_API_KEY` | Para pagamentos | Chave da API ASAAS |
| `RESEND_API_KEY` | Para emails | Chave da API Resend |

### Frontend (`.env.local`)

| Variável | Obrigatória | Descrição |
|---------|-------------|-----------|
| `MEDUSA_BACKEND_URL` | Sim | URL do backend (server-side) |
| `NEXT_PUBLIC_MEDUSA_BACKEND_URL` | Sim | URL pública do backend (browser) |
| `MEDUSA_PUBLISHABLE_KEY` | Sim | Chave pública da API Medusa |
| `MEDUSA_REVALIDATION_SECRET` | Sim | Secret para webhook de cache |

---

## 6. Estrutura do projeto

```
ecommerce-dozecrew/
├── backend/                  # Medusa.js API
│   ├── src/
│   │   ├── api/              # Endpoints customizados (ASAAS, marketplace)
│   │   ├── modules/          # Módulos (asaas, marketplace)
│   │   ├── scripts/seed.ts   # Script de seed
│   │   └── lib/              # Utilitários (email, templates)
│   ├── medusa-config.ts      # Configuração principal
│   ├── .env.example          # Template de variáveis
│   └── Dockerfile
├── frontend/                 # Next.js 15 Storefront
│   ├── app/                  # App Router (páginas)
│   ├── components/           # Componentes React
│   ├── lib/
│   │   ├── medusa/           # Client da API Medusa
│   │   └── image.ts          # Utilitários de imagem
│   ├── tests/e2e/            # Testes Playwright
│   ├── next.config.ts        # Configuração Next.js (domínios de imagem)
│   ├── .env.local.example    # Template de variáveis
│   └── Dockerfile
├── k8s/                      # Manifests Kubernetes
│   ├── deploy.sh             # Script de deploy completo
│   ├── frontend.yaml
│   ├── medusa-backend.yaml
│   ├── secrets.yaml          # NUNCA commitar com valores reais
│   └── ingress.yaml
└── docs/
    ├── SETUP.md              # Este arquivo
    └── PRODUCTION.md         # Deploy em produção
```
