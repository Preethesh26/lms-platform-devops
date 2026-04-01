// ============================================================
// JENKINSFILE — FULL PIPELINE
//
// Flow:
//   1. Build Docker images on your laptop
//   2. Deploy to local k3s and run health + smoke tests
//   3. If tests pass → push images to Docker Hub
//   4. Trigger Render to redeploy the live backend
//   5. Trigger Netlify to redeploy the live frontend
//
// Live deploy only happens on the main branch
// and only if local tests pass first
// ============================================================

pipeline {
    agent any

    parameters {
        string(
            name: 'GIT_SHA',
            defaultValue: '',
            description: 'Leave empty for latest. Enter a SHA to rollback.'
        )
    }

    // Credentials stored in Jenkins → Manage Credentials
    environment {
        DOCKERHUB_USERNAME  = 'preethesh26'
        DOCKERHUB_TOKEN     = credentials('DOCKERHUB_TOKEN')
        RENDER_DEPLOY_HOOK  = credentials('RENDER_DEPLOY_HOOK')
        NETLIFY_HOOK        = credentials('NETLIFY_HOOK')
        NOTIFY_WEBHOOK      = credentials('NOTIFY_WEBHOOK')
        MONGODB_URI         = credentials('MONGODB_URI')
        JWT_SECRET          = credentials('JWT_SECRET')
        BREVO_API_KEY       = credentials('BREVO_API_KEY')
        GEMINI_API_KEY      = credentials('GEMINI_API_KEY')
        GOOGLE_PRIVATE_KEY  = credentials('GOOGLE_PRIVATE_KEY')
    }

    stages {

        // ── Stage 1: Checkout ─────────────────────────────────
        stage('Checkout') {
            steps {
                checkout scm
                script {
                    env.DEPLOY_SHA = params.GIT_SHA ?: env.GIT_COMMIT

                    // Map branch → local k3s namespace
                    switch (env.BRANCH_NAME) {
                        case 'main':    env.TARGET_NS = 'lms-production'; break
                        case 'staging': env.TARGET_NS = 'lms-staging';    break
                        default:        env.TARGET_NS = 'lms-dev';        break
                    }

                    echo "Branch: ${env.BRANCH_NAME}"
                    echo "SHA: ${env.DEPLOY_SHA}"
                    echo "Local namespace: ${env.TARGET_NS}"
                }
            }
        }


        // ── Stage 2: Build Docker images locally ──────────────
        // Builds on your laptop — not pushed to Docker Hub yet
        stage('Build Images') {
            steps {
                script {
                    echo "Building frontend image..."
                    sh """
                        docker build \
                            --build-arg VITE_API_URL=http://localhost:5000/api \
                            -t ${env.DOCKERHUB_USERNAME}/lms-frontend:${env.DEPLOY_SHA} \
                            -t ${env.DOCKERHUB_USERNAME}/lms-frontend:local \
                            .
                    """

                    echo "Building backend image..."
                    sh """
                        docker build \
                            -t ${env.DOCKERHUB_USERNAME}/lms-backend:${env.DEPLOY_SHA} \
                            -t ${env.DOCKERHUB_USERNAME}/lms-backend:local \
                            ./backend
                    """
                }
            }
        }

        // ── Stage 3: Deploy to local k3s ──────────────────────
        // Test the new images on your local Kubernetes cluster
        // before touching the live environment
        stage('Deploy to Local k3s') {
            steps {
                script {
                    // Safety: only main branch can use lms-production namespace
                    if (env.TARGET_NS == 'lms-production' && env.BRANCH_NAME != 'main') {
                        error("Only main branch can deploy to lms-production namespace!")
                    }

                    // Apply namespaces and config
                    sh "kubectl apply -f k8s/namespaces.yaml"
                    sh "kubectl apply -f k8s/backend-configmap.yaml -n ${env.TARGET_NS}"

                    // Inject secrets into local k3s
                    sh """
                        kubectl create secret generic backend-secrets \
                            --from-literal=MONGODB_URI='${env.MONGODB_URI}' \
                            --from-literal=JWT_SECRET='${env.JWT_SECRET}' \
                            --from-literal=BREVO_API_KEY='${env.BREVO_API_KEY}' \
                            --from-literal=GEMINI_API_KEY='${env.GEMINI_API_KEY}' \
                            --from-literal=GOOGLE_PRIVATE_KEY='${env.GOOGLE_PRIVATE_KEY}' \
                            -n ${env.TARGET_NS} \
                            --dry-run=client -o yaml | kubectl apply -f -
                    """

                    // Create Docker Hub pull secret for k3s
                    sh """
                        kubectl create secret docker-registry dockerhub-pull-secret \
                            --docker-username='${env.DOCKERHUB_USERNAME}' \
                            --docker-password='${env.DOCKERHUB_TOKEN}' \
                            --docker-server=https://index.docker.io/v1/ \
                            -n ${env.TARGET_NS} \
                            --dry-run=client -o yaml | kubectl apply -f -
                    """

                    // Apply deployment manifests
                    sh "kubectl apply -f k8s/frontend-deployment.yaml -n ${env.TARGET_NS}"
                    sh "kubectl apply -f k8s/frontend-service.yaml    -n ${env.TARGET_NS}"
                    sh "kubectl apply -f k8s/backend-deployment.yaml  -n ${env.TARGET_NS}"
                    sh "kubectl apply -f k8s/backend-service.yaml     -n ${env.TARGET_NS}"

                    // Update pods to use the new image
                    sh """
                        kubectl set image deployment/lms-frontend \
                            frontend=${env.DOCKERHUB_USERNAME}/lms-frontend:${env.DEPLOY_SHA} \
                            -n ${env.TARGET_NS}

                        kubectl set image deployment/lms-backend \
                            backend=${env.DOCKERHUB_USERNAME}/lms-backend:${env.DEPLOY_SHA} \
                            -n ${env.TARGET_NS}
                    """
                }
            }
        }

        // ── Stage 4: Health Check (local) ─────────────────────
        // Polls /api/health on the local k3s pod every 15s
        // If this fails, we never touch the live environment
        stage('Health Check (Local)') {
            steps {
                script {
                    // Open a tunnel to the local backend pod
                    sh "kubectl port-forward svc/lms-backend 5001:5000 -n ${env.TARGET_NS} &"
                    sleep(5)

                    def maxAttempts = 12   // 12 × 15s = 3 minutes
                    def attempt = 0
                    def healthy = false

                    while (attempt < maxAttempts && !healthy) {
                        attempt++
                        echo "Attempt ${attempt}/${maxAttempts}..."

                        def status = sh(
                            script: "curl -s -o /dev/null -w '%{http_code}' http://localhost:5001/api/health",
                            returnStdout: true
                        ).trim()

                        echo "HTTP ${status}"

                        if (status == '200') {
                            healthy = true
                            echo "Local backend is healthy!"
                        } else {
                            sleep(15)
                        }
                    }

                    sh "pkill -f 'kubectl port-forward' || true"

                    if (!healthy) {
                        error("Local health check failed. Aborting — live deploy cancelled.")
                    }
                }
            }
        }

        // ── Stage 5: Smoke Test (local) ───────────────────────
        // Quick checks on the local k3s deployment
        // If these fail, we never touch the live environment
        stage('Smoke Test (Local)') {
            steps {
                script {
                    sh "kubectl port-forward svc/lms-frontend 8080:80    -n ${env.TARGET_NS} &"
                    sh "kubectl port-forward svc/lms-backend  5001:5000  -n ${env.TARGET_NS} &"
                    sleep(5)

                    // Check frontend loads
                    def feStatus = sh(
                        script: "curl -s -o /dev/null -w '%{http_code}' http://localhost:8080",
                        returnStdout: true
                    ).trim()
                    assert feStatus == '200' : "Frontend returned HTTP ${feStatus}"

                    // Check backend returns { "status": "ok" }
                    def beBody = sh(
                        script: "curl -s http://localhost:5001/api/health",
                        returnStdout: true
                    ).trim()
                    assert beBody.contains('"ok"') : "Backend returned: ${beBody}"

                    sh "pkill -f 'kubectl port-forward' || true"

                    echo "Local smoke tests passed! Proceeding to live deploy..."
                    writeFile file: 'smoke-test-results.txt',
                        text: "LOCAL PASSED\nFrontend: HTTP ${feStatus}\nBackend: ${beBody}"
                    archiveArtifacts artifacts: 'smoke-test-results.txt'
                }
            }
        }

        // ── Stage 6: Push images to Docker Hub ────────────────
        // Only runs on main branch after local tests pass
        // These are the images Render will pull for the live backend
        stage('Push to Docker Hub') {
            when {
                branch 'main'   // only push to live registry from main
            }
            steps {
                script {
                    echo "Local tests passed. Pushing images to Docker Hub..."

                    sh "docker login -u ${env.DOCKERHUB_USERNAME} -p ${env.DOCKERHUB_TOKEN}"

                    // Tag with SHA (permanent) and latest (moving pointer)
                    sh "docker tag ${env.DOCKERHUB_USERNAME}/lms-frontend:${env.DEPLOY_SHA} ${env.DOCKERHUB_USERNAME}/lms-frontend:latest"
                    sh "docker tag ${env.DOCKERHUB_USERNAME}/lms-backend:${env.DEPLOY_SHA}  ${env.DOCKERHUB_USERNAME}/lms-backend:latest"

                    sh "docker push ${env.DOCKERHUB_USERNAME}/lms-frontend:${env.DEPLOY_SHA}"
                    sh "docker push ${env.DOCKERHUB_USERNAME}/lms-frontend:latest"
                    sh "docker push ${env.DOCKERHUB_USERNAME}/lms-backend:${env.DEPLOY_SHA}"
                    sh "docker push ${env.DOCKERHUB_USERNAME}/lms-backend:latest"

                    echo "Images pushed to Docker Hub."
                }
            }
        }

        // ── Stage 7: Deploy to Live (Render + Netlify) ────────
        // Only runs on main branch after images are pushed
        // Render pulls the new backend image and restarts
        // Netlify rebuilds and redeploys the frontend
        stage('Deploy to Live') {
            when {
                branch 'main'   // only deploy live from main
            }
            steps {
                script {
                    echo "Triggering live backend deploy on Render..."
                    sh "curl -fsS -X POST '${env.RENDER_DEPLOY_HOOK}'"
                    echo "Render deploy triggered."

                    echo "Triggering live frontend deploy on Netlify..."
                    sh "curl -fsS -X POST '${env.NETLIFY_HOOK}'"
                    echo "Netlify deploy triggered."

                    echo "Live deploy complete! App is now live."
                }
            }
        }
    }

    post {
        // If anything failed → rollback local k3s and skip live deploy
        failure {
            script {
                echo "Pipeline failed! Rolling back local k3s..."
                sh "kubectl rollout undo deployment/lms-frontend -n ${env.TARGET_NS} || true"
                sh "kubectl rollout undo deployment/lms-backend  -n ${env.TARGET_NS} || true"
                sh "pkill -f 'kubectl port-forward' || true"

                def msg = "FAILED | Branch: ${env.BRANCH_NAME} | SHA: ${env.DEPLOY_SHA} | ${env.BUILD_URL}"
                sh "curl -s -X POST '${env.NOTIFY_WEBHOOK}' -H 'Content-Type: application/json' -d '{\"text\":\"${msg}\"}' || true"
            }
        }

        success {
            script {
                def where = env.BRANCH_NAME == 'main' ? 'LOCAL + LIVE' : 'LOCAL ONLY'
                def msg = "DEPLOYED (${where}) | Branch: ${env.BRANCH_NAME} | SHA: ${env.DEPLOY_SHA} | ${env.BUILD_URL}"
                sh "curl -s -X POST '${env.NOTIFY_WEBHOOK}' -H 'Content-Type: application/json' -d '{\"text\":\"${msg}\"}' || true"
            }
        }
    }
}
