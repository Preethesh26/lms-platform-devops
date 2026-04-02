# Interview Concepts & DevOps (This Repository)

This document maps **topics you may be asked about in interviews** to the AcademyPro LMS stack, and explains **DevOps concepts** as they are implemented in **this** repo (GitHub Actions, Docker, Render, Vercel, Kubernetes manifests).

Use it alongside [deployment.md](./deployment.md), [project_documentation.md](./project_documentation.md), and the root [README.md](../README.md).

---

## Part A — Interview concepts (aligned with this project)

Study these in clusters so you can say *“In this LMS I used X to achieve Y.”*

### A.1 Frontend

| Concept | What to be able to explain | Tie-in here |
|--------|----------------------------|-------------|
| SPA + routing | Client-side navigation, route guards, lazy loading | React + React Router; separate trees for `/admin/*`, `/superadmin/*`, student routes |
| Build-time configuration | What `VITE_*` env vars are; they are inlined at build | `VITE_API_URL` for API base URL |
| State management | When to use Context vs local state; auth persistence | Context + hooks for user/session and global sync patterns |
| Forms & UX | Validation, loading/error states, accessibility basics | Login (enrollment + password), admin CRUD, quiz player |
| API consumption | Central client, JWT attachment, error handling | Shared API layer calling `/api/...` |

### A.2 Backend

| Concept | What to be able to explain | Tie-in here |
|--------|----------------------------|-------------|
| REST API | Resources, verbs, status codes, idempotency where relevant | Courses, users, quizzes, tests, payments, support |
| Express middleware | Order of execution; `next()`, error handling | `json`, `cors`, `protect`, org scoping (`requireOrgScope`), role checks |
| MongoDB + Mongoose | Schemas, indexes, references, aggregation | Models for users, courses, progress, quizzes, etc. |
| Multi-tenancy (if you discuss it) | Tenant boundary, data isolation, super-admin vs org admin | `organizationId` on documents; scoped queries; super-admin routes |
| AuthN / AuthZ | Authentication vs authorization | JWT payload (`role`, optional `organizationId`); bcrypt; RBAC (admin / superadmin / student) |

### A.3 Security

| Concept | What to be able to explain | Tie-in here |
|--------|----------------------------|-------------|
| JWT | Stateless sessions; expiry; what not to put in payload | Issued on login; used for protected routes |
| Password storage | Hashing, salt, why plaintext is unacceptable | bcrypt |
| 2FA (TOTP) | Shared secret, time-based codes, backup flows | Admin hardening (see root README feature list) |
| CORS | Browser enforcement vs server trust | Backend allows origins; production hardening via `FRONTEND_URL` (see deployment.md) |
| Rate limiting | Brute-force resistance | Super-admin step auth and similar patterns |

### A.4 Integrations & platform services

| Concept | What to be able to explain | Tie-in here |
|--------|----------------------------|-------------|
| Transactional email | Templates, API keys, bounce/deliverability | Brevo (Sendinblue) |
| Object storage | S3-compatible buckets, public vs signed URLs | Cloudflare R2 for media |
| Payments | Client vs server responsibilities; webhooks; testing | Razorpay and/or mock payment flows documented in plans |

### A.5 System design talking points

- **Split deployment**: Static or CDN-hosted frontend talking to a separate API (latency, CORS, versioning).
- **Environments**: Local, staging, production; different DBs and API URLs.
- **Observability** (be honest if partial): server logs, CI logs; mention what you would add (metrics, tracing, health checks).

### A.6 One practice method

For each of three flows—**(1)** student opens course player, **(2)** admin creates/publishes a quiz, **(3)** email or payment side effect—trace:

**UI action → HTTP request → middleware → controller → DB → response → UI update.**

---

## Part B — DevOps concepts and how this repository uses them

### B.1 Core vocabulary

| Term | Meaning |
|------|---------|
| **CI (Continuous Integration)** | On each change, automatically build/test so breaks are caught early. |
| **CD (Continuous Delivery/Deployment)** | After CI passes, deploy automatically or with a gate (manual approval, branch rules). |
| **Pipeline / workflow** | Ordered steps running on a runner (e.g. Ubuntu VM in GitHub Actions). |
| **Artifact** | Output of a build (e.g. `dist/`, Docker image) stored for deploy or reuse. |
| **Secrets** | Credentials injected at runtime or in CI, not committed to git. |
| **Infrastructure as code (IaC)** | Declarative files describing infra (here: Kubernetes YAML under `k8s/`). |

### B.2 GitHub Actions (`.github/workflows/ci.yml`)

| Idea | How it is used here |
|------|---------------------|
| **Trigger on push** | Workflow runs on pushes to any branch (`branches: ['**']`). |
| **Parallel jobs** | Frontend lint/build and backend syntax check run as separate jobs. |
| **Job dependencies** | Deploy jobs use `needs: [lint-build-frontend, check-backend]` so deploy only runs if both succeed. |
| **Branch-conditioned deploy** | `if: github.ref == 'refs/heads/main'` for production; `if: github.ref == 'refs/heads/staging'` for staging. |
| **GitHub Environments** | `environment: production` and `environment: staging` for environment-scoped secrets and protection rules. |
| **Node setup** | `actions/setup-node@v4` with Node 20; `npm ci` for reproducible installs. |
| **Frontend CI** | `working-directory: frontend` — `npm run lint`, `npm run build` with a build-time `VITE_API_URL`. |
| **Backend CI** | `node --check server.js` for syntax validation. |

**Environment / database mapping** (as documented in the workflow comments):

- Local / Docker Compose → development DB (`lms_dev` on Atlas in typical setup).
- **`staging` branch** → staging Atlas DB (`MONGODB_URI_STAGING`).
- **`main` branch** → production Atlas DB (`MONGODB_URI`).

### B.3 Docker and Docker Hub

| Idea | How it is used here |
|------|---------------------|
| **Image per service** | Separate images for frontend and backend (`docker/build-push-action` with `context: ./frontend` and `context: ./backend`). |
| **Registry** | Images pushed to Docker Hub under `preethesh26/lms-frontend` and `preethesh26/lms-backend`. |
| **Immutability / traceability** | Tags include `${{ github.sha }}` plus `latest` or `staging`. |
| **Build args** | Frontend: `VITE_API_URL` differs for production vs staging builds. Backend CI passes `MONGODB_URI` as a build-arg (be aware: for maximum security, prefer runtime injection unless the image truly needs it at build time). |
| **Auth to registry** | `docker/login-action` with `DOCKERHUB_TOKEN` secret. |

### B.4 Render deploy hooks

After images are pushed, deployment is triggered with:

`curl -fsS -X POST "${{ secrets.RENDER_DEPLOY_HOOK }}"` (production)  
`curl -fsS -X POST "${{ secrets.RENDER_DEPLOY_HOOK_STAGING }}"` (staging)

**Interview framing:** “We use Render’s deploy hook URL so the pipeline can trigger a redeploy after the registry has new images, without tying every step to Git’s native integration.”

### B.5 Docker Compose (local)

File: `docker-compose.yml` at repository root.

| Idea | How it is used here |
|------|---------------------|
| **Multi-service dev** | `backend` and `frontend` services defined together. |
| **Networking** | Published ports (e.g. backend `10000`, frontend `5173:80`). |
| **Configuration** | Backend uses `env_file: backend/.env` (typically `MONGODB_URI` to Atlas). |
| **Startup order** | `depends_on` from frontend to backend. |
| **Build args for frontend** | `VITE_API_URL` passed at image build for the frontend service. |

### B.6 Kubernetes (`k8s/`)

The repo includes manifests such as namespaces, deployments, and services for frontend and backend.

**Interview framing:** “We maintain Kubernetes manifests for a cluster-based deployment path; day-to-day hosted demos may use Vercel + Render while these YAML files document a portable, scalable target.”

### B.7 Vercel and `vercel.json`

[deployment.md](./deployment.md) describes hosting the Vite frontend on Vercel with `VITE_API_URL` set in the dashboard. Root `vercel.json` configures Vercel-specific behavior for this project.

### B.8 Elevator pitch (DevOps, this repo)

> “We run GitHub Actions on every push: lint and build the React app, and syntax-check the Node API. On `main` and `staging`, we build Docker images, push to Docker Hub with the commit SHA as a tag, and call Render deploy hooks so each environment picks up the right image and configuration. Locally we can use Docker Compose; the repo also ships Kubernetes manifests for a cluster deployment option.”

---

## Related documents

- [deployment.md](./deployment.md) — Vercel + Render setup
- [STAGING_SETUP.md](./STAGING_SETUP.md) — Staging environment
- [WORKFLOW_GUIDE.md](./WORKFLOW_GUIDE.md) — End-to-end workflow
- [HANDOVER.md](./HANDOVER.md) — Recent feature status and resume hints

---

*Last updated: 2026-04-02 — aligns with `.github/workflows/ci.yml` and `docker-compose.yml` in this repository.*
