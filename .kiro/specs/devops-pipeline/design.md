# Design Document

## Overview

This document describes the technical architecture and implementation design for the LMS Platform DevOps pipeline. The stack is entirely free-tier: Docker Hub for image storage, GitHub Actions for CI, Jenkins self-hosted on Oracle Cloud Always Free VM for CD, k3s on Oracle Cloud for Kubernetes, Netlify for frontend hosting, Render for backend hosting, MongoDB Atlas M0 for the database, Cloudflare for DNS/CDN, and Prometheus + Grafana self-hosted for observability.

---

## Architecture Diagram

```
Developer Push
      │
      ▼
GitHub Repository
      │
      ├──► GitHub Actions (CI)
      │         │  lint + build frontend
      │         │  syntax check backend
      │         │  docker build + push → Docker Hub
      │         │  trigger Render deploy hook
      │         └──► Netlify (auto-deploy on push)
      │
      └──► Jenkins (CD) ← webhook from GitHub Actions
                │
                ├──► kubectl apply → k3s (Oracle Cloud VM)
                │         ├── lms-dev
                │         ├── lms-staging
                │         └── lms-production
                │                 ├── Frontend Deployment (Nginx)
                │                 ├── Backend Deployment (Node.js)
                │                 ├── Ingress (nginx-ingress + cert-manager)
                │                 └── HPA
                │
                ├──► Health Check polling /api/health
                ├──► Smoke Tests
                └──► Rollback on failure

Docker Hub ──────────────────────────────────────────────────────────────────►
  <user>/lms-frontend:<sha>, <user>/lms-frontend:latest
  <user>/lms-backend:<sha>,  <user>/lms-backend:latest

MongoDB Atlas M0 ◄── Backend (k3s + Render)
Cloudflare DNS ──► Netlify (frontend) + Render (api subdomain)
Prometheus + Grafana (lms-monitoring namespace, Oracle Cloud VM)
```

---

## Component Design

### 1. Docker — Frontend Image

**File:** `Dockerfile` (repository root)

Multi-stage build:
- Stage 1 (`builder`): `node:20-alpine`, accepts `ARG VITE_API_URL`, runs `npm ci && npm run build`
- Stage 2 (`serve`): `nginx:alpine`, copies `dist/` from builder, copies custom `nginx.conf`

**File:** `nginx.conf` (repository root)

```nginx
server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        return 404;
    }
}
```

Target image size: < 150 MB. Non-root user not applicable for Nginx official image (runs as nginx user internally).

---

### 2. Docker — Backend Image

**File:** `backend/Dockerfile`

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY . .
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser
EXPOSE 5000
CMD ["node", "server.js"]
```

Layer caching: `package*.json` copied and installed before source copy.

---

### 3. Docker Compose — Local Development

**File:** `docker-compose.yml` (repository root)

Services:
- `frontend`: builds from root `Dockerfile`, port `5173:80`, `VITE_API_URL=http://localhost:5000/api`
- `backend`: builds from `backend/Dockerfile`, port `5000:5000`, `env_file: backend/.env`, `restart: unless-stopped`
- `mongo`: `mongo:7-jammy`, named volume `mongo_data`, port `27017:27017`

The `backend` service depends on `mongo`. The `frontend` service depends on `backend`.

---

### 4. Docker Hub — Image Registry

**Registry:** `hub.docker.com/<DOCKERHUB_USERNAME>/lms-frontend` and `hub.docker.com/<DOCKERHUB_USERNAME>/lms-backend`

**Authentication:** `docker login -u $DOCKERHUB_USERNAME -p $DOCKERHUB_TOKEN`

**Tagging strategy:**
- `main` branch: `<sha>` + `latest`
- `staging` branch: `<sha>` + `staging`
- `dev` branch: `<sha>` + `dev` (optional, CI only)

**Kubernetes imagePullSecret:** A `Secret` of type `kubernetes.io/dockerconfigjson` created in each namespace using `DOCKERHUB_USERNAME` and `DOCKERHUB_TOKEN` from GitHub Secrets.

---

### 5. GitHub Actions — CI Pipeline

**File:** `.github/workflows/ci.yml`

```yaml
name: CI

on:
  push:
    branches: ['**']

jobs:
  lint-build-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci
      - run: npm run lint
      - run: npm run build
        env:
          VITE_API_URL: ${{ secrets.VITE_API_URL }}

  check-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci
        working-directory: backend
      - run: node --check server.js
        working-directory: backend

  build-push-images:
    needs: [lint-build-frontend, check-backend]
    if: github.ref == 'refs/heads/main' || github.ref == 'refs/heads/staging'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: docker/login-action@v3
        with:
          username: ${{ secrets.DOCKERHUB_USERNAME }}
          password: ${{ secrets.DOCKERHUB_TOKEN }}
      - name: Build and push frontend
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          build-args: VITE_API_URL=${{ secrets.VITE_API_URL }}
          tags: |
            ${{ secrets.DOCKERHUB_USERNAME }}/lms-frontend:${{ github.sha }}
            ${{ secrets.DOCKERHUB_USERNAME }}/lms-frontend:latest
      - name: Build and push backend
        uses: docker/build-push-action@v5
        with:
          context: backend
          push: true
          tags: |
            ${{ secrets.DOCKERHUB_USERNAME }}/lms-backend:${{ github.sha }}
            ${{ secrets.DOCKERHUB_USERNAME }}/lms-backend:latest
      - name: Trigger Render deploy
        if: github.ref == 'refs/heads/main'
        run: curl -X POST "${{ secrets.RENDER_DEPLOY_HOOK }}"
```

---

### 6. Kubernetes — Namespace Strategy

**Files:** `k8s/namespaces.yaml`

Three namespaces: `lms-dev`, `lms-staging`, `lms-production`. Each has a `ResourceQuota` capping CPU and memory. `lms-production` has a `NetworkPolicy` restricting ingress to the Ingress controller only.

Branch-to-namespace mapping enforced in Jenkinsfile:
- `main` → `lms-production`
- `staging` → `lms-staging`
- `dev` → `lms-dev`
- Any other branch targeting `lms-production` → pipeline abort

---

### 7. Kubernetes — Deployments and Services

**Files:** `k8s/frontend-deployment.yaml`, `k8s/backend-deployment.yaml`

Both deployments:
- `replicas: 2`
- `strategy: RollingUpdate` with `maxUnavailable: 0`, `maxSurge: 1`
- Image: `<DOCKERHUB_USERNAME>/lms-<service>:<GIT_SHA>`
- `imagePullSecrets` referencing the Docker Hub pull secret

Backend deployment additionally includes:
```yaml
livenessProbe:
  httpGet: { path: /api/health, port: 5000 }
  initialDelaySeconds: 15
  periodSeconds: 10
readinessProbe:
  httpGet: { path: /api/health, port: 5000 }
  initialDelaySeconds: 15
  periodSeconds: 5
```

Services: both `ClusterIP`. Frontend on port `80`, Backend on port `5000`.

---

### 8. Kubernetes — Ingress

**File:** `k8s/ingress.yaml`

Uses `nginx` ingress class (k3s default: Traefik, but nginx-ingress can be installed). Routes:
- `/api/*` → backend service port 5000
- `/*` → frontend service port 80

TLS terminated via cert-manager + Let's Encrypt `ClusterIssuer`. Cloudflare DNS `A` record points to the Oracle Cloud VM's public IP with proxy enabled.

---

### 9. Kubernetes — ConfigMaps and Secrets

**File:** `k8s/backend-configmap.yaml`

Non-sensitive vars: `PORT=5000`, `NODE_ENV=production`, `FRONTEND_URL`

**Secrets** (never committed, applied at deploy time by Jenkins/GitHub Actions):

```bash
kubectl create secret generic backend-secrets \
  --from-literal=MONGODB_URI="$MONGODB_URI" \
  --from-literal=JWT_SECRET="$JWT_SECRET" \
  --from-literal=BREVO_API_KEY="$BREVO_API_KEY" \
  --from-literal=GEMINI_API_KEY="$GEMINI_API_KEY" \
  --from-literal=GOOGLE_PRIVATE_KEY="$GOOGLE_PRIVATE_KEY" \
  -n lms-production --dry-run=client -o yaml | kubectl apply -f -
```

Docker Hub pull secret per namespace:
```bash
kubectl create secret docker-registry dockerhub-pull-secret \
  --docker-username="$DOCKERHUB_USERNAME" \
  --docker-password="$DOCKERHUB_TOKEN" \
  --docker-server=https://index.docker.io/v1/ \
  -n lms-production --dry-run=client -o yaml | kubectl apply -f -
```

---

### 10. Kubernetes — Horizontal Pod Autoscaler

**Files:** `k8s/backend-hpa.yaml`, `k8s/frontend-hpa.yaml`

Backend HPA: `minReplicas: 2`, `maxReplicas: 10`, CPU target: 70%
Frontend HPA: `minReplicas: 2`, `maxReplicas: 6`, CPU target: 70%

Scale-up triggers at 70% CPU sustained for 60 seconds. Scale-down at < 50% for 5 minutes.

Requires `metrics-server` installed in the cluster (available as a k3s add-on).

---

### 11. Jenkins — CD Pipeline

**File:** `Jenkinsfile` (repository root)

Declarative pipeline stages:

1. `Checkout` — clone repo, extract `GIT_SHA`
2. `Deploy to Kubernetes` — apply ConfigMap, re-apply Secrets from env vars, run `kubectl set image` for frontend and backend deployments, apply any changed manifests
3. `Health Check` — poll `GET /api/health` every 15 seconds for up to 3 minutes (12 attempts)
4. `Smoke Test` — HTTP GET frontend URL (assert 200), HTTP GET `/api/health` (assert 200 + `"status":"ok"`)
5. `post { failure }` — trigger rollback via `kubectl rollout undo`, send failure notification
6. `post { success }` — send success notification

Credentials sourced from Jenkins credential store (mirrored from GitHub Secrets):
- `DOCKERHUB_USERNAME`, `DOCKERHUB_TOKEN`
- `KUBECONFIG` (base64-encoded kubeconfig for Oracle Cloud k3s)
- Notification webhook URL

Branch guard in `Deploy to Kubernetes` stage:
```groovy
if (env.BRANCH_NAME == 'main' && env.TARGET_NS != 'lms-production') {
    error("Production deploys only from main branch")
}
```

---

### 12. Render — Backend Hosting

The Render Web Service is configured to pull from Docker Hub (`<DOCKERHUB_USERNAME>/lms-backend:latest`). All sensitive env vars are set as Render environment secrets in the Render dashboard. The GitHub Actions `build-push-images` job triggers the Render deploy hook via `curl -X POST $RENDER_DEPLOY_HOOK` after a successful push to `main`.

Health check URL: `<render-url>/api/health` — Render uses this for its own health monitoring.

---

### 13. Netlify — Frontend Hosting

`netlify.toml` already present with correct build command (`npm run build`), publish dir (`dist`), and SPA redirect rule. Netlify's GitHub integration auto-deploys on push to `main` (production) and `staging` (preview URL). `VITE_API_URL` is set in Netlify's environment variables UI pointing to the Render backend URL.

---

### 14. MongoDB Atlas

Two databases on the same M0 cluster: `lms_production` and `lms_staging`. Connection strings differ only in the database name suffix. IP allowlist: Render outbound IPs + Oracle Cloud VM egress IP. Atlas free tier provides basic daily snapshots. Mongoose reconnect logic handles transient connection drops with built-in exponential backoff.

---

### 15. Rollback Strategy

Automatic rollback triggered by Jenkins `post { failure }` block after smoke test failure:

```groovy
sh "kubectl rollout undo deployment/lms-frontend -n ${TARGET_NS}"
sh "kubectl rollout undo deployment/lms-backend -n ${TARGET_NS}"
```

Manual rollback via Jenkins parameterized build: accepts `GIT_SHA` parameter, runs `kubectl set image` with the specified SHA tag from Docker Hub, then re-runs health check polling.

`revisionHistoryLimit: 5` set on all Deployment manifests.

---

### 16. Observability — Prometheus + Grafana

**Namespace:** `lms-monitoring`

Prometheus deployed as a `Deployment` with a `ConfigMap` for `prometheus.yml` scrape config. Scrapes Backend pods via pod annotations (`prometheus.io/scrape: "true"`, `prometheus.io/port: "5000"`, `prometheus.io/path: "/metrics"`).

Backend exposes `/metrics` using `prom-client` npm package:
- `http_requests_total` (counter, labeled by method/route/status)
- `http_request_duration_seconds` (histogram)
- `active_connections` (gauge)

Grafana deployed as a `Deployment` with a `NodePort` service. Pre-provisioned dashboard via `ConfigMap` (Grafana provisioning). Data source: Prometheus service URL.

Alert rule: `rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m]) > 0.05`

---

### 17. Cloudflare DNS

| Record | Type | Value | Proxy |
|--------|------|-------|-------|
| `lms.example.com` | A | Netlify/k3s IP | ✅ |
| `api.lms.example.com` | CNAME | `<render-service>.onrender.com` | ✅ |

SSL/TLS mode: `Full (strict)`. Cache rules: JS/CSS/images TTL ≥ 1 hour. DNS updates via Cloudflare API using `CLOUDFLARE_API_TOKEN` from GitHub Secrets when origin URLs change.

---

### 18. GitHub Secrets Reference

| Secret Name | Used By | Purpose |
|-------------|---------|---------|
| `DOCKERHUB_USERNAME` | GHA, Jenkins | Docker Hub login |
| `DOCKERHUB_TOKEN` | GHA, Jenkins | Docker Hub password |
| `MONGODB_URI` | Jenkins, k8s | Atlas connection string |
| `JWT_SECRET` | Jenkins, k8s | JWT signing key |
| `BREVO_API_KEY` | Jenkins, k8s | Email service |
| `GEMINI_API_KEY` | Jenkins, k8s | AI service |
| `GOOGLE_PRIVATE_KEY` | Jenkins, k8s | Google Sheets |
| `RENDER_DEPLOY_HOOK` | GHA | Trigger Render deploy |
| `CLOUDFLARE_API_TOKEN` | GHA | DNS updates |
| `VITE_API_URL` | GHA | Frontend build arg |
| `KUBECONFIG` | Jenkins | k3s cluster access |

---

### 19. File Structure

```
.
├── Dockerfile                    # Frontend multi-stage build
├── nginx.conf                    # SPA fallback config
├── docker-compose.yml            # Local dev stack
├── Jenkinsfile                   # CD pipeline
├── .github/
│   └── workflows/
│       └── ci.yml                # CI pipeline
├── backend/
│   └── Dockerfile                # Backend image
└── k8s/
    ├── namespaces.yaml
    ├── resourcequotas.yaml
    ├── networkpolicies.yaml
    ├── backend-configmap.yaml
    ├── backend-deployment.yaml
    ├── backend-service.yaml
    ├── backend-hpa.yaml
    ├── frontend-deployment.yaml
    ├── frontend-service.yaml
    ├── frontend-hpa.yaml
    ├── ingress.yaml
    └── monitoring/
        ├── prometheus-deployment.yaml
        ├── prometheus-configmap.yaml
        ├── grafana-deployment.yaml
        └── grafana-dashboard-configmap.yaml
```

---

## Correctness Properties

### Property 1: Docker Image Build Reproducibility
For any given Git SHA, building the Frontend or Backend Dockerfile with the same `VITE_API_URL` build arg SHALL produce a functionally equivalent image (same binary output for the same source input). This is verifiable by building twice and comparing layer digests.

### Property 2: Round-Trip Secret Injection
A secret value written to GitHub Secrets, injected into a Kubernetes Secret via the pipeline, and read back by a pod environment variable SHALL equal the original value (no encoding corruption). Verifiable by comparing `echo $SECRET` in a test pod against the source value.

### Property 3: Rollback Idempotence
Executing `kubectl rollout undo` twice on the same deployment SHALL result in the same pod state as executing it once (the second undo reverts to the pre-rollback state, which is idempotent with respect to the rollback target). Pipeline rollback logic must account for this.

### Property 4: Health Check Convergence
After any deployment (new image or rollback), the health check polling loop SHALL eventually return HTTP 200 within the 3-minute window if the image is healthy, regardless of the order in which pods become ready (rolling update order independence).

### Property 5: Branch-Namespace Invariant
For all pipeline runs, the invariant `branch == 'main' ↔ namespace == 'lms-production'` SHALL hold. Any violation (non-main branch deploying to production, or main branch deploying to non-production) SHALL cause the pipeline to abort before applying any manifests.

### Property 6: Image Tag Immutability
For a given Git SHA, the Docker Hub image tag `<sha>` SHALL always refer to the same image digest. The `latest` tag is mutable and SHALL only be updated on successful `main` branch builds.
