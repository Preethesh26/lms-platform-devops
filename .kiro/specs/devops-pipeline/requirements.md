# Requirements Document

## Introduction

This document defines the DevOps pipeline requirements for the LMS Platform — a full-stack application with a React/TypeScript/Vite frontend and a Node.js/Express backend backed by MongoDB. The goal is to containerize both services with Docker, orchestrate them with Kubernetes manifests (compatible with k3s or Minikube locally), automate CI/CD through Jenkins (self-hosted on Oracle Cloud Always Free VM) and GitHub Actions, and leverage entirely free-tier services (MongoDB Atlas, Docker Hub, Render, Netlify, Cloudflare, Grafana + Prometheus, GitHub Secrets) for a production-grade, observable, and resilient delivery pipeline across dev, staging, and production environments.

## Glossary

- **Frontend**: The React/TypeScript/Vite application containerized as a Docker image and served via Nginx.
- **Backend**: The Node.js/Express API containerized as a Docker image, connecting to MongoDB Atlas.
- **Docker_Image**: An immutable, versioned container image built from a Dockerfile.
- **Docker_Hub**: Docker Hub (`hub.docker.com`) — the free public/private Docker image registry used to store Frontend and Backend images, authenticated via `DOCKERHUB_USERNAME` and `DOCKERHUB_TOKEN`.
- **K8s_Namespace**: A Kubernetes namespace used to isolate workloads by environment (`dev`, `staging`, `production`), compatible with k3s or Minikube.
- **Jenkins_Pipeline**: The automated CI/CD pipeline defined in a `Jenkinsfile` that builds, tests, and deploys the application, running on a self-hosted Oracle Cloud Always Free VM.
- **GitHub_Actions**: The cloud CI pipeline running on GitHub's free tier (2000 min/month) that handles linting, building, and image publishing.
- **MongoDB_Atlas**: The free-tier MongoDB Atlas cluster (512 MB) used as the database for all environments.
- **Render**: The free-tier cloud platform used to host the Backend API service.
- **Netlify**: The free-tier platform used to host the Frontend static site.
- **Cloudflare**: The free DNS and CDN service used to manage domain records and cache static assets.
- **Prometheus**: The self-hosted metrics collection system scraping Backend and Kubernetes metrics.
- **Grafana**: The self-hosted observability dashboard visualizing Prometheus metrics and application logs.
- **GitHub_Secrets**: GitHub repository and environment secrets used to store sensitive credentials, replacing AWS Secrets Manager.
- **HPA**: Kubernetes Horizontal Pod Autoscaler that scales pod replicas based on CPU/memory metrics.
- **Health_Check**: An HTTP endpoint (`/api/health`) on the Backend that returns the current operational status.
- **Smoke_Test**: A minimal automated test run post-deployment to verify the deployment is functional.
- **Rollback**: The process of reverting a Kubernetes deployment to the previous known-good image version.

---

## Requirements

### Requirement 1: Docker — Frontend Containerization

**User Story:** As a developer, I want the Frontend packaged as a Docker image, so that it runs consistently across all environments without local dependency issues.

#### Acceptance Criteria

1. THE Frontend SHALL have a `Dockerfile` in the repository root that performs a multi-stage build: a `node:20-alpine` build stage running `npm run build`, and an `nginx:alpine` serve stage copying the Vite dist output.
2. THE Frontend `Dockerfile` SHALL accept a build argument `VITE_API_URL` and bake it into the static build at image build time.
3. WHEN the Frontend Docker_Image is built, THE Docker_Image SHALL produce a final image under 150 MB.
4. THE Frontend SHALL have an `nginx.conf` that serves the SPA with a fallback to `index.html` for client-side routing.
5. IF the Nginx process exits unexpectedly, THEN the Docker container SHALL restart automatically via the `restart: unless-stopped` policy in docker-compose.

---

### Requirement 2: Docker — Backend Containerization

**User Story:** As a developer, I want the Backend packaged as a Docker image, so that the API and its dependencies are portable and environment-agnostic.

#### Acceptance Criteria

1. THE Backend SHALL have a `Dockerfile` inside the `backend/` directory using a `node:20-alpine` base image.
2. THE Backend `Dockerfile` SHALL copy `package.json` and run `npm install --omit=dev` before copying application source, to leverage Docker layer caching.
3. WHEN the Backend Docker_Image is built, THE Docker_Image SHALL expose port `5000` and set `CMD ["node", "server.js"]`.
4. THE Backend `Dockerfile` SHALL run the process as a non-root user (`node`) for security hardening.
5. IF the Backend process exits with a non-zero code, THEN the Docker container SHALL restart automatically via the `restart: unless-stopped` policy in docker-compose.

---

### Requirement 3: Docker Compose — Local Development

**User Story:** As a developer, I want a single `docker-compose.yml` to spin up the full stack locally, so that onboarding new developers requires only one command.

#### Acceptance Criteria

1. THE repository root SHALL contain a `docker-compose.yml` that defines services for `frontend`, `backend`, and `mongo` (local MongoDB for dev).
2. WHEN `docker compose up` is run, THE docker-compose SHALL start all three services and make the Frontend accessible at `http://localhost:5173` and the Backend at `http://localhost:5000`.
3. THE docker-compose `backend` service SHALL mount a `.env` file from `backend/.env` to inject environment variables without hardcoding secrets in the compose file.
4. THE docker-compose `mongo` service SHALL use a named volume to persist data across container restarts.
5. WHEN `docker compose down -v` is run, THE docker-compose SHALL stop all services and remove associated volumes cleanly.

---

### Requirement 4: Docker Hub — Container Registry

**User Story:** As a DevOps engineer, I want Docker images pushed to Docker Hub after every successful build, so that Kubernetes and Render can pull versioned images from a free registry.

#### Acceptance Criteria

1. THE Jenkins_Pipeline and GitHub_Actions SHALL authenticate to Docker Hub using `DOCKERHUB_USERNAME` and `DOCKERHUB_TOKEN` stored in GitHub_Secrets before pushing any image.
2. WHEN a build succeeds on the `main` branch, THE Jenkins_Pipeline SHALL tag the Docker_Image with both the Git commit SHA and `latest`, then push both tags to `<DOCKERHUB_USERNAME>/<repo>` on Docker Hub.
3. WHEN a build succeeds on the `staging` branch, THE Jenkins_Pipeline SHALL tag the Docker_Image with the Git commit SHA and `staging`, then push both tags to Docker Hub.
4. THE Docker Hub repository settings SHALL be configured to allow read access to the Kubernetes cluster's pull secret and Render's deployment webhook.
5. IF the Docker Hub push fails, THEN THE Jenkins_Pipeline SHALL fail the build stage and halt deployment.

---

### Requirement 5: Kubernetes — Namespace Strategy

**User Story:** As a DevOps engineer, I want isolated Kubernetes namespaces per environment, so that dev, staging, and production workloads cannot interfere with each other on a local k3s or Minikube cluster.

#### Acceptance Criteria

1. THE Kubernetes manifests SHALL define three K8s_Namespaces: `lms-dev`, `lms-staging`, and `lms-production`.
2. THE Kubernetes manifests SHALL define `ResourceQuota` objects per K8s_Namespace to cap CPU and memory consumption.
3. WHEN the Jenkins_Pipeline deploys to a K8s_Namespace, THE Jenkins_Pipeline SHALL apply manifests scoped to that namespace only, using `kubectl apply -n <namespace>`.
4. THE K8s_Namespace `lms-production` SHALL have a `NetworkPolicy` that restricts ingress to traffic originating from the Ingress controller only.
5. IF a deployment targets `lms-production` from any branch other than `main`, THEN THE Jenkins_Pipeline SHALL abort with an error message.

---

### Requirement 6: Kubernetes — Deployments and Services

**User Story:** As a DevOps engineer, I want Kubernetes Deployment and Service manifests for both Frontend and Backend, so that pods are managed declaratively and traffic is routed correctly.

#### Acceptance Criteria

1. THE Frontend SHALL have a Kubernetes `Deployment` manifest with `replicas: 2` minimum, using the Docker Hub image tagged with the current Git SHA.
2. THE Backend SHALL have a Kubernetes `Deployment` manifest with `replicas: 2` minimum, using the Docker Hub image tagged with the current Git SHA.
3. WHEN a new image is deployed, THE Kubernetes `Deployment` SHALL use a `RollingUpdate` strategy with `maxUnavailable: 0` and `maxSurge: 1` to ensure zero-downtime deployments.
4. THE Frontend SHALL have a Kubernetes `Service` of type `ClusterIP` exposing port `80`.
5. THE Backend SHALL have a Kubernetes `Service` of type `ClusterIP` exposing port `5000`.
6. THE Backend `Deployment` SHALL include a `livenessProbe` and `readinessProbe` targeting `GET /api/health` with an initial delay of 15 seconds.

---

### Requirement 7: Kubernetes — Ingress

**User Story:** As a DevOps engineer, I want a Kubernetes Ingress to route external traffic to the correct service, so that users access the LMS over a load-balanced endpoint managed by Cloudflare.

#### Acceptance Criteria

1. THE Kubernetes manifests SHALL define an `Ingress` resource using the cluster's default Ingress controller (nginx-ingress for k3s/Minikube).
2. THE Ingress SHALL route requests to `/api/*` to the Backend `Service` and all other paths to the Frontend `Service`.
3. THE Ingress SHALL be annotated to terminate TLS using a cert-manager-issued certificate (Let's Encrypt free tier), enforcing HTTPS on port 443.
4. WHEN the Ingress is created or updated, THE Ingress controller SHALL become healthy and return HTTP 200 for the Frontend root path within 5 minutes.
5. THE Cloudflare DNS SHALL have an `A` record pointing the production domain to the cluster's external IP, with Cloudflare proxying enabled for CDN and DDoS protection.

---

### Requirement 8: Kubernetes — ConfigMaps and Secrets

**User Story:** As a DevOps engineer, I want non-sensitive configuration in ConfigMaps and sensitive credentials sourced from GitHub Secrets, so that configuration is auditable and secrets are never stored in Git.

#### Acceptance Criteria

1. THE Backend `Deployment` SHALL reference a Kubernetes `ConfigMap` for non-sensitive environment variables such as `PORT`, `NODE_ENV`, and `FRONTEND_URL`.
2. THE Backend `Deployment` SHALL source sensitive variables (`MONGODB_URI`, `JWT_SECRET`, `BREVO_API_KEY`, `GEMINI_API_KEY`, `GOOGLE_PRIVATE_KEY`) from Kubernetes `Secret` objects.
3. THE Kubernetes `Secret` objects SHALL be populated by the Jenkins_Pipeline or GitHub_Actions at deploy time using values read from GitHub_Secrets, and SHALL NOT be committed to the repository.
4. WHEN GitHub_Secrets values are updated, THE Jenkins_Pipeline or GitHub_Actions SHALL re-apply the Kubernetes `Secret` on the next deployment run.
5. IF a required Kubernetes `Secret` key is missing at pod startup, THEN the pod SHALL fail with a `CreateContainerConfigError` and THE Jenkins_Pipeline health check SHALL detect and report the failure.

---

### Requirement 9: Kubernetes — Horizontal Pod Autoscaler

**User Story:** As a DevOps engineer, I want the Backend to scale automatically under load, so that the LMS handles traffic spikes without manual intervention.

#### Acceptance Criteria

1. THE Backend `Deployment` SHALL have an HPA manifest targeting CPU utilization at 70% as the scale-up threshold.
2. THE HPA SHALL define `minReplicas: 2` and `maxReplicas: 10` for the Backend.
3. WHEN average CPU utilization across Backend pods exceeds 70% for 60 seconds, THE HPA SHALL increase the replica count by at least 1.
4. WHEN average CPU utilization drops below 50% for 5 minutes, THE HPA SHALL scale down replicas toward the minimum.
5. THE Frontend `Deployment` SHALL have an HPA with `minReplicas: 2` and `maxReplicas: 6` based on CPU utilization at 70%.

---

### Requirement 10: GitHub Actions — CI Pipeline

**User Story:** As a developer, I want GitHub Actions to automatically build and validate code on every push, so that broken builds are caught before deployment.

#### Acceptance Criteria

1. THE repository SHALL contain a `.github/workflows/ci.yml` workflow with jobs: `lint-build-frontend`, `check-backend`, `build-push-images`.
2. WHEN a push is made to any branch, THE GitHub_Actions workflow SHALL run the `lint-build-frontend` job executing `npm run lint` and `npm run build` in the repository root.
3. WHEN a push is made to any branch, THE GitHub_Actions workflow SHALL run the `check-backend` job executing `npm install` and `node --check server.js` inside `backend/`.
4. IF the lint, build, or syntax check exits with a non-zero code, THEN THE GitHub_Actions workflow SHALL mark the run as failed and skip all subsequent jobs.
5. WHEN all validation jobs pass on the `main` or `staging` branch, THE GitHub_Actions workflow SHALL proceed to the `build-push-images` job to build and push Docker images to Docker Hub.

---

### Requirement 11: Jenkins — CD Pipeline (Deploy)

**User Story:** As a DevOps engineer, I want Jenkins to deploy pre-built images from Docker Hub to the Kubernetes cluster automatically after a successful CI run, so that validated code reaches the target environment without manual steps.

#### Acceptance Criteria

1. THE repository root SHALL contain a `Jenkinsfile` defining a declarative pipeline with stages: `Checkout`, `Deploy to Kubernetes`, `Health Check`, `Smoke Test`.
2. WHEN the `Deploy to Kubernetes` stage runs on the `main` branch, THE Jenkins_Pipeline SHALL update the `lms-production` namespace image tags via `kubectl set image` and apply any changed manifests using the Docker Hub image SHA produced by GitHub_Actions.
3. WHEN the `Deploy to Kubernetes` stage runs on the `staging` branch, THE Jenkins_Pipeline SHALL deploy to the `lms-staging` namespace only.
4. WHEN the `Deploy to Kubernetes` stage runs on the `dev` branch, THE Jenkins_Pipeline SHALL deploy to the `lms-dev` namespace only.
5. WHEN the deployment completes, THE Jenkins_Pipeline SHALL poll the Backend Health_Check endpoint at 15-second intervals for up to 3 minutes until it returns HTTP 200.
6. THE Jenkins_Pipeline SHALL read all deployment credentials (Docker Hub token, kubeconfig) from GitHub_Secrets injected as environment variables into the Jenkins agent.

---

### Requirement 12: Render — Backend Hosting

**User Story:** As a DevOps engineer, I want the Backend deployed to Render's free tier, so that the API is publicly accessible without managing server infrastructure.

#### Acceptance Criteria

1. THE Backend SHALL be configured as a Render Web Service using the Docker Hub image, with the service set to the free tier plan.
2. THE Render service SHALL have all sensitive environment variables (`MONGODB_URI`, `JWT_SECRET`, `BREVO_API_KEY`, `GEMINI_API_KEY`, `GOOGLE_PRIVATE_KEY`) configured as Render environment secrets, not hardcoded in any config file.
3. WHEN a new Docker_Image is pushed to Docker Hub on the `main` branch, THE GitHub_Actions workflow SHALL trigger a Render deploy hook via an HTTP POST to the Render deploy URL stored in GitHub_Secrets.
4. WHEN the Render deployment completes, THE Backend Health_Check endpoint at `<render-url>/api/health` SHALL return HTTP 200 within 3 minutes.
5. IF the Render deployment fails, THEN THE GitHub_Actions workflow SHALL mark the deployment job as failed and send a build notification.

---

### Requirement 13: Netlify — Frontend Hosting

**User Story:** As a DevOps engineer, I want the Frontend deployed to Netlify's free tier, so that the static site is globally distributed via CDN without infrastructure costs.

#### Acceptance Criteria

1. THE Frontend SHALL be configured as a Netlify site with build command `npm run build` and publish directory `dist`.
2. THE `netlify.toml` file SHALL define redirect rules so that all routes fall back to `index.html` for client-side routing.
3. WHEN a push is made to the `main` branch, THE Netlify site SHALL automatically trigger a production deployment via Netlify's GitHub integration.
4. WHEN a push is made to the `staging` branch, THE Netlify site SHALL deploy to a Netlify preview environment with a unique preview URL.
5. THE Netlify site SHALL have the `VITE_API_URL` environment variable configured to point to the Render Backend URL for the production environment.

---

### Requirement 14: MongoDB Atlas — Database

**User Story:** As a DevOps engineer, I want the Backend to connect to MongoDB Atlas free tier, so that the database is managed, backed up, and accessible without self-hosting costs.

#### Acceptance Criteria

1. THE production and staging environments SHALL use a MongoDB Atlas free-tier cluster (M0, 512 MB) with separate databases per environment (`lms_production`, `lms_staging`).
2. THE Backend `Deployment` SHALL connect to MongoDB Atlas using a `MONGODB_URI` connection string sourced from GitHub_Secrets (for CI/CD) and Kubernetes `Secret` objects (for k8s deployments).
3. THE MongoDB Atlas cluster SHALL have automated daily snapshots enabled (Atlas free tier provides basic backup).
4. THE MongoDB Atlas cluster SHALL have IP access list entries configured to allow connections from Render's outbound IPs and the Kubernetes cluster's egress IP only.
5. WHEN the MongoDB Atlas connection is lost, THE Backend SHALL reconnect automatically using Mongoose's built-in retry logic with exponential backoff.

---

### Requirement 15: Kubernetes — Rollback

**User Story:** As a DevOps engineer, I want to roll back a bad deployment instantly, so that production downtime is minimized when a release introduces a critical regression.

#### Acceptance Criteria

1. WHEN a smoke test fails after a production deployment, THE Jenkins_Pipeline SHALL automatically execute `kubectl rollout undo deployment/<name> -n lms-production` for both Frontend and Backend deployments.
2. WHEN a manual rollback is triggered via a Jenkins parameterized build, THE Jenkins_Pipeline SHALL accept a `GIT_SHA` parameter and re-deploy the Docker Hub image tagged with that SHA to the target namespace.
3. WHEN a rollback deployment completes, THE Jenkins_Pipeline SHALL re-run the Health_Check polling defined in Requirement 11 to confirm the rolled-back version is healthy.
4. THE Kubernetes `Deployment` manifests SHALL retain a `revisionHistoryLimit` of 5 to allow `kubectl rollout undo` to reference the last 5 revisions.
5. WHEN a rollback is executed, THE Jenkins_Pipeline SHALL send a build notification identifying the rollback event, target environment, and the SHA that was restored.

---

### Requirement 16: Jenkins — Smoke Tests

**User Story:** As a DevOps engineer, I want automated smoke tests to run after every deployment, so that a broken release is detected immediately before users are impacted.

#### Acceptance Criteria

1. WHEN the `Smoke Test` stage runs, THE Jenkins_Pipeline SHALL send an HTTP GET to the deployed Frontend URL and assert an HTTP 200 response.
2. WHEN the `Smoke Test` stage runs, THE Jenkins_Pipeline SHALL send an HTTP GET to `<backend-url>/api/health` and assert an HTTP 200 response with a JSON body containing `"status": "ok"`.
3. IF any smoke test assertion fails, THEN THE Jenkins_Pipeline SHALL mark the build as `FAILED` and trigger the rollback procedure defined in Requirement 15.
4. WHEN all smoke tests pass, THE Jenkins_Pipeline SHALL mark the build as `SUCCESS` and send a build notification.
5. THE Jenkins_Pipeline SHALL archive smoke test results as a build artifact for post-deployment audit.

---

### Requirement 17: Cloudflare — DNS and CDN

**User Story:** As a DevOps engineer, I want Cloudflare to manage DNS records and provide CDN caching, so that the LMS is accessible via a human-readable domain with DDoS protection and fast global delivery at no cost.

#### Acceptance Criteria

1. THE Cloudflare DNS zone SHALL contain an `A` record for the production domain pointing to the Netlify or Kubernetes cluster IP, with Cloudflare proxying enabled.
2. THE Cloudflare DNS zone SHALL contain a `CNAME` record for the `api` subdomain (e.g., `api.lms.example.com`) pointing to the Render Backend service URL.
3. WHEN the Render or Netlify deployment URL changes, THE Cloudflare DNS record SHALL be updated via the Cloudflare API using a token stored in GitHub_Secrets.
4. THE Cloudflare zone SHALL have caching rules configured to cache Frontend static assets (JS, CSS, images) at the edge with a TTL of at least 1 hour.
5. THE Cloudflare zone SHALL have SSL/TLS mode set to `Full (strict)` to enforce end-to-end HTTPS between Cloudflare and the origin servers.

---

### Requirement 18: Observability — Grafana and Prometheus

**User Story:** As a DevOps engineer, I want all application metrics and logs visualized in self-hosted Grafana and Prometheus, so that I can diagnose failures and track system health without paid monitoring services.

#### Acceptance Criteria

1. THE Kubernetes cluster SHALL have Prometheus deployed as a `Deployment` in the `lms-monitoring` namespace, scraping metrics from Backend pods via a `ServiceMonitor` or annotated pod scrape config.
2. THE Backend SHALL expose a `/metrics` endpoint in Prometheus exposition format, including HTTP request count, request duration histogram, and active connection gauge.
3. THE Kubernetes cluster SHALL have Grafana deployed in the `lms-monitoring` namespace with Prometheus configured as a data source, accessible via a Kubernetes `Service` of type `NodePort` or `LoadBalancer`.
4. THE Grafana instance SHALL have a pre-provisioned dashboard displaying: HTTP request rate, error rate (5xx/total), p95 request latency, pod CPU/memory utilization, and MongoDB Atlas connection count.
5. WHEN the Backend error rate (5xx responses / total responses) exceeds 5% over a 5-minute window, THE Prometheus alerting rule SHALL fire and Grafana SHALL display the alert in the Alerting panel.
6. WHEN a Backend pod crashes or restarts, THE Prometheus `kube_pod_container_status_restarts_total` metric SHALL reflect the restart within 60 seconds of the event.

---

### Requirement 19: Jenkins — Build Notifications

**User Story:** As a developer, I want Jenkins to notify the team on build outcomes, so that failures are visible immediately without checking the Jenkins dashboard manually.

#### Acceptance Criteria

1. WHEN a Jenkins_Pipeline build fails on the `main` or `staging` branch, THE Jenkins_Pipeline SHALL send a notification containing the branch name, stage that failed, build URL, and Git commit SHA.
2. WHEN a Jenkins_Pipeline build succeeds on the `main` branch, THE Jenkins_Pipeline SHALL send a success notification containing the deployed image SHA and target environment.
3. WHEN a rollback is executed, THE Jenkins_Pipeline SHALL send a rollback notification as defined in Requirement 15, Criterion 5.
4. THE Jenkins_Pipeline SHALL support notification delivery via at least one of: email (SMTP), Slack webhook, or Microsoft Teams webhook, configured via a Jenkins credential stored in the Jenkins credential store.
5. IF the notification delivery fails, THEN THE Jenkins_Pipeline SHALL log the failure to the build console output but SHALL NOT mark the build as failed due to notification errors.

---

### Requirement 20: GitHub Secrets — Secrets Management

**User Story:** As a DevOps engineer, I want all sensitive credentials stored in GitHub Secrets, so that secrets are never committed to the repository and are injected securely at runtime.

#### Acceptance Criteria

1. THE repository SHALL store all sensitive credentials as GitHub repository secrets or GitHub environment secrets, including: `MONGODB_URI`, `JWT_SECRET`, `BREVO_API_KEY`, `GEMINI_API_KEY`, `GOOGLE_PRIVATE_KEY`, `DOCKERHUB_USERNAME`, `DOCKERHUB_TOKEN`, `RENDER_DEPLOY_HOOK`, and `CLOUDFLARE_API_TOKEN`.
2. THE GitHub_Actions workflows SHALL reference secrets using the `${{ secrets.SECRET_NAME }}` syntax and SHALL NOT echo or log secret values in any workflow step.
3. THE Jenkins_Pipeline SHALL receive secrets as environment variables injected by the Jenkins credential binding plugin, sourced from GitHub_Secrets via a sync mechanism or manually mirrored Jenkins credentials.
4. WHEN a secret value is rotated in GitHub_Secrets, THE change SHALL take effect on the next GitHub_Actions workflow run or Jenkins build without requiring code changes.
5. IF a required secret is missing or empty at workflow runtime, THEN THE GitHub_Actions workflow SHALL fail the affected job with a descriptive error message identifying the missing secret name.
