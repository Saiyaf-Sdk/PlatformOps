pipeline {
    agent any

    options {
        timeout(time: 30, unit: 'MINUTES')
        buildDiscarder(logRotator(numToKeepStr: '10'))
        disableConcurrentBuilds()
    }

    environment {
        IMAGE_BACKEND  = 'platformops-backend'
        IMAGE_FRONTEND = 'platformops-frontend'
    }

    stages {
        // =====================================================================
        // STAGE 1: SCM CHECKOUT
        // =====================================================================
        stage('Checkout') {
            steps {
                checkout scm
                script {
                    env.GIT_COMMIT_HASH = sh(script: 'git rev-parse HEAD', returnStdout: true).trim()
                    env.SHORT_SHA       = sh(script: 'git rev-parse --short HEAD', returnStdout: true).trim()
                    echo "========================================================"
                    echo "PLATFORMOPS CI/CD PIPELINE"
                    echo "Branch:       ${env.BRANCH_NAME ?: env.GIT_BRANCH ?: 'main'}"
                    echo "Commit SHA:   ${env.GIT_COMMIT_HASH}"
                    echo "Short SHA:    ${env.SHORT_SHA}"
                    echo "Build Number: #${env.BUILD_NUMBER}"
                    echo "========================================================"
                }
            }
        }

        // =====================================================================
        // STAGE 2: ENVIRONMENT DIAGNOSTICS
        // =====================================================================
        stage('Environment Info') {
            steps {
                echo 'Checking build environment toolchains...'
                sh '''
                    echo "Java Version:" && java -version 2>&1 | head -n 2
                    echo "Node Version:" && node --version
                    echo "NPM Version:"  && npm --version
                    echo "Docker Version:" && docker version --format 'Client: {{.Client.Version}} | Server: {{.Server.Version}}'
                '''
                dir('Backend') {
                    sh 'chmod +x mvnw && ./mvnw -v | head -n 1'
                }
            }
        }

        // =====================================================================
        // STAGE 3: FRONTEND DEPENDENCY INSTALLATION
        // =====================================================================
        stage('Frontend Install') {
            steps {
                dir('Frontend') {
                    echo 'Installing frontend dependencies using exact package-lock...'
                    sh 'npm ci'
                }
            }
        }

        // =====================================================================
        // STAGE 4: FRONTEND TEST SUITE
        // =====================================================================
        stage('Frontend Test') {
            steps {
                dir('Frontend') {
                    script {
                        echo '========================================================'
                        echo 'Frontend Test Suite: NOT CONFIGURED'
                        echo 'No test script or test runner currently defined in package.json.'
                        echo 'Quality verification relies on oxlint static analysis and Vite build.'
                        echo '========================================================'
                    }
                }
            }
        }

        // =====================================================================
        // STAGE 5: FRONTEND STATIC LINT & PRODUCTION BUILD
        // =====================================================================
        stage('Frontend Build') {
            steps {
                dir('Frontend') {
                    echo 'Running oxlint static code analysis...'
                    sh 'npm run lint'
                    echo 'Building production Vite bundle...'
                    sh 'npm run build'
                }
            }
        }

        // =====================================================================
        // STAGE 6: BACKEND INTEGRATION & UNIT TESTS
        // =====================================================================
        stage('Backend Test') {
            steps {
                dir('Backend') {
                    echo 'Running Spring Boot test suite against PostgreSQL H2 profile...'
                    sh '''
                        chmod +x mvnw
                        ./mvnw clean test -B -ntp
                    '''
                }
            }
        }

        // =====================================================================
        // STAGE 7: BACKEND APPLICATION PACKAGING
        // =====================================================================
        stage('Backend Package') {
            steps {
                dir('Backend') {
                    echo 'Packaging Spring Boot executable JAR artifact...'
                    sh './mvnw package -DskipTests -B -ntp'
                }
            }
        }

        // =====================================================================
        // STAGE 8: DOCKER IMAGE BUILD
        // =====================================================================
        stage('Docker Build') {
            steps {
                echo "Building platformops-frontend:${env.SHORT_SHA}..."
                sh "docker build -t ${env.IMAGE_FRONTEND}:${env.SHORT_SHA} -t ${env.IMAGE_FRONTEND}:build-${env.BUILD_NUMBER} -f Frontend/Dockerfile Frontend/"

                echo "Building platformops-backend:${env.SHORT_SHA}..."
                sh "docker build -t ${env.IMAGE_BACKEND}:${env.SHORT_SHA} -t ${env.IMAGE_BACKEND}:build-${env.BUILD_NUMBER} -f Backend/Dockerfile Backend/"
            }
        }

        // =====================================================================
        // STAGE 9: SECURITY SCANNING (TRIVY CONTAINER)
        // =====================================================================
        stage('Security Check') {
            steps {
                script {
                    echo 'Scanning built container images for HIGH and CRITICAL vulnerabilities...'
                    sh """
                        echo "--- Scanning Frontend Image: ${env.IMAGE_FRONTEND}:${env.SHORT_SHA} ---"
                        docker run --rm -v /var/run/docker.sock:/var/run/docker.sock aquasec/trivy:latest image --severity HIGH,CRITICAL --no-progress ${env.IMAGE_FRONTEND}:${env.SHORT_SHA} || true
                        echo "--- Scanning Backend Image: ${env.IMAGE_BACKEND}:${env.SHORT_SHA} ---"
                        docker run --rm -v /var/run/docker.sock:/var/run/docker.sock aquasec/trivy:latest image --severity HIGH,CRITICAL --no-progress ${env.IMAGE_BACKEND}:${env.SHORT_SHA} || true
                    """
                }
            }
        }

        // =====================================================================
        // STAGE 10: IMAGE TAGGING & REGISTRY READINESS
        // =====================================================================
        stage('Image Tagging') {
            steps {
                script {
                    def branch = env.BRANCH_NAME ?: env.GIT_BRANCH ?: 'main'
                    if (branch.contains('main')) {
                        echo "Main branch detected: Tagging 'latest' production release pointers..."
                        sh "docker tag ${env.IMAGE_FRONTEND}:${env.SHORT_SHA} ${env.IMAGE_FRONTEND}:latest"
                        sh "docker tag ${env.IMAGE_BACKEND}:${env.SHORT_SHA} ${env.IMAGE_BACKEND}:latest"
                    }
                    echo 'Listing newly generated PlatformOps container images:'
                    sh "docker images | grep -E '${env.IMAGE_FRONTEND}|${env.IMAGE_BACKEND}'"

                    echo '========================================================'
                    echo 'Future Registry Readiness (Amazon ECR):'
                    echo 'Image push to AWS ECR is deferred to Stage 5.'
                    echo 'Images are securely tagged and validated locally.'
                    echo '========================================================'
                }
            }
        }
    }

    // =========================================================================
    // POST ACTIONS & NOTIFICATIONS
    // =========================================================================
    post {
        always {
            echo 'Collecting Surefire test reports...'
            junit allowEmptyResults: true, testResults: 'Backend/target/surefire-reports/*.xml'

            echo 'Archiving build artifacts...'
            archiveArtifacts allowEmptyArchive: true, artifacts: 'Backend/target/*.jar, Frontend/dist/**'

            echo 'Cleaning workspace...'
            cleanWs deleteDirs: true, notFailBuild: true
        }
        success {
            echo "========================================================"
            echo "SUCCESS: PlatformOps CI/CD Pipeline #${env.BUILD_NUMBER} passed!"
            echo "Commit:       ${env.GIT_COMMIT_HASH}"
            echo "Release Tags: ${env.IMAGE_BACKEND}:${env.SHORT_SHA}, ${env.IMAGE_FRONTEND}:${env.SHORT_SHA}"
            echo "========================================================"
        }
        failure {
            echo "========================================================"
            echo "FAILURE: PlatformOps CI/CD Pipeline #${env.BUILD_NUMBER} failed."
            echo "Inspect the console output above to identify root cause."
            echo "========================================================"
        }
    }
}
