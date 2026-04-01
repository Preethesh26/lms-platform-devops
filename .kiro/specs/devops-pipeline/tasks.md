# Implementation Plan: DevOps Pipeline

## Overview

Implement a full free-tier DevOps pipeline for the LMS Platform: Docker containerization, Kubernetes manifests (k3s), GitHub Actions CI, Jenkins CD, Netlify/Render hosting, MongoDB Atlas, Cloudflare DNS, and Prometheus + Grafana observability.

## Tasks

- [x] 1. Docker — Frontend Containerization
  - [x] 1.1 Create `nginx.conf` at the repository root with SPA fallback (`try_files $uri $uri/ /index.html`) and a 404 block for `/api/`
    - _Requirements: 1.4_
  - [x] 1.2 Create the multi-stage `Dockerfile` at the repository root: `node:20-alpine` builder stage accepting `ARG VITE_API_URL` running `npm ci && npm run build`, then `nginx:alpine` serve stage copying `dist/` and `nginx.conf`
    - _Requirements: 1.1, 1.2, 1.3_
  - [ ]* 1.3 Write a property test for Docker image build reproducibility
    - **Property 1: Docker Image Build Reproducibility**
    - Build the frontend image twice with the same `VITE_API_URL` and assert both image layer digests are identical using a shell-based test script `scripts/test-image-reproducibility.sh`
    - **Validates: Requirements 1.1, 1.2**

- [x] 2. Docker — Backend Containerization
  - [x] 2.1 Create `backend/Dockerfile` using `node:20-alpine`, copying `package*.json` first, running `npm install --omit=dev`, then copying source, creating a non-root `appuser`, and setting `EXPOSE 5000` with `CMD ["node", "server.js"]`
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [x] 3. Docker Compose — Local Development Stack
  - [x] 3.1 Create `docker-compose.yml` at the repository root
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 2.5, 1.5_

- [ ] 4. Checkpoint — Verify local Docker stack
  - Build and verify `docker compose up` starts all three services. Ensure all tests pass, ask the user if questions arise.

- [x] 5. Kubernetes — Namespace, ResourceQuota, and NetworkPolicy Manifests
  - [x] 5.1 Create `k8s/namespaces.yaml`
    - _Requirements: 5.1_
  - [x] 5.2 Create `k8s/resourcequotas.yaml`
    - _Requirements: 5.2_
  - [x] 5.3 Create `k8s/networkpolicies.yaml`
    - _Requirements: 5.4_

- [x] 6. Kubernetes — ConfigMap and Secret Manifests
  - [x] 6.1 Create `k8s/backend-configmap.yaml`
    - _Requirements: 8.1_
  - [x] 6.2 Create `scripts/apply-secrets.sh`
    - _Requirements: 8.2, 8.3, 8.4, 8.5, 20.1_

- [x] 7. Kubernetes — Deployment and Service Manifests
  - [x] 7.1 Create `k8s/frontend-deployment.yaml`
    - _Requirements: 6.1, 6.3, 15.4_
  - [x] 7.2 Create `k8s/frontend-service.yaml`
    - _Requirements: 6.4_
  - [x] 7.3 Create `k8s/backend-deployment.yaml`
    - _Requirements: 6.2, 6.3, 6.6, 8.1, 8.2, 15.4_
  - [x] 7.4 Create `k8s/backend-service.yaml`
    - _Requirements: 6.5_

- [x] 8. Kubernetes — Ingress Manifest
  - [x] 8.1 Create `k8s/ingress.yaml`
    - _Requirements: 7.1, 7.2, 7.3_

- [x] 9. Kubernetes — Horizontal Pod Autoscaler Manifests
  - [x] 9.1 Create `k8s/backend-hpa.yaml`
    - _Requirements: 9.1, 9.2, 9.3, 9.4_
  - [x] 9.2 Create `k8s/frontend-hpa.yaml`
    - _Requirements: 9.5_

- [ ] 10. Checkpoint — Validate all Kubernetes manifests
  - Run `kubectl apply --dry-run=client -f k8s/` against a local cluster. Ensure all tests pass, ask the user if questions arise.

- [x] 11. Backend — Prometheus Metrics Endpoint
  - [x] 11.1 Install `prom-client` and create `backend/middleware/metrics.js`
    - _Requirements: 18.2_
  - [x] 11.2 Wire metrics middleware into `backend/server.js`
    - _Requirements: 18.2_
  - [ ]* 11.3 Write unit tests for the metrics middleware

- [x] 12. Backend — Health Check Endpoint
  - [x] 12.1 Updated `GET /api/health` to return `{ "status": "ok" }` with HTTP 200
    - _Requirements: 11.5, 16.2_

- [x] 13. GitHub Actions — CI Pipeline
  - [x] 13.1 Create `.github/workflows/ci.yml`
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 4.1, 4.2, 4.3, 12.3, 20.1, 20.2, 20.5_
  - [ ]* 13.2 Property test: branch-namespace invariant
  - [ ]* 13.3 Property test: image tag immutability

- [x] 14. Jenkinsfile — CD Pipeline
  - [x] 14.1 Create `Jenkinsfile`
    - _Requirements: 11.1–11.6, 15.1–15.5, 16.1–16.5, 19.1–19.5, 5.3, 5.5, 20.3, 20.4_
  - [ ]* 14.2 Property test: rollback idempotence
  - [ ]* 14.3 Property test: health check convergence

- [ ] 15. Checkpoint — Validate CI/CD pipeline files
  - Lint `Jenkinsfile` and validate YAML syntax of `ci.yml`.

- [x] 16. Observability — Prometheus and Grafana Kubernetes Manifests
  - [x] 16.1 Create `k8s/monitoring/prometheus-configmap.yaml`
    - _Requirements: 18.1, 18.5_
  - [x] 16.2 Create `k8s/monitoring/prometheus-deployment.yaml`
    - _Requirements: 18.1, 18.6_
  - [x] 16.3 Create `k8s/monitoring/grafana-dashboard-configmap.yaml`
    - _Requirements: 18.4_
  - [x] 16.4 Create `k8s/monitoring/grafana-deployment.yaml`
    - _Requirements: 18.3, 18.4_

- [x] 17. Netlify — Frontend Hosting Configuration
  - [x] 17.1 `netlify.toml` already correctly configured — no changes needed
    - _Requirements: 13.1, 13.2_

- [x] 18. Cloudflare — DNS Update Script
  - [x] 18.1 Create `scripts/update-cloudflare-dns.sh`
    - _Requirements: 17.1, 17.2, 17.3_
  - [x] 18.2 DNS update step added to `ci.yml` on main branch
    - _Requirements: 17.3_

- [x] 19. GitHub Secrets — Validation Step
  - [x] 19.1 `validate-secrets` job added to `ci.yml`
    - _Requirements: 20.5_
  - [ ]* 19.2 Property test: round-trip secret injection

- [ ] 20. Final Checkpoint — End-to-end pipeline validation
  - Verify all manifests apply cleanly, CI workflow YAML is valid, Jenkinsfile parses without errors.

## Notes

- Tasks marked with `*` are optional property tests — skip for MVP
- Secrets are never hardcoded — always injected via GitHub Secrets, Jenkins credentials, or environment variables
- `scripts/apply-secrets.sh` uses `--dry-run=client -o yaml | kubectl apply -f -` for idempotent secret creation
- Cloudflare, Render, and MongoDB Atlas UI configuration steps are external to the codebase
