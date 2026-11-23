pipeline {

    agent { label 'rootless-docker' }
parameters {
        booleanParam(
            name: 'DEPLOY_TO_CLOUD',
            defaultValue: false,
            description: 'Deploy PlatformOps to the cloud after CI passes'
        )
        string(
            name: 'CLOUD_HOST',
            defaultValue: '',
            description: 'IP address or DNS name of the cloud server'
        )
        string(
            name: 'IMAGE_TAG',
            defaultValue: 'lab-1',
            description: 'Existing Docker Hub tag for both PlatformOps images'
        )
    }

    options {
        timestamps()
        disableConcurrentBuilds()
    }

    environment {
        FRONTEND_DIR = 'frontend'
        BACKEND_DIR  = 'backend'
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm

                script {
                    env.SHORT_SHA = sh(
                        script: 'git rev-parse --short HEAD',
                        returnStdout: true
                    ).trim()

                    echo "Building Git commit: ${env.SHORT_SHA}"
                }
            }
        }

        stage('Environment Check') {
            steps {
                sh '''
                    echo "===== USER ====="
                    whoami

                    echo "===== GIT ====="
                    git --version

                    echo "===== JAVA ====="
                    java -version

                    echo "===== NODE ====="
                    node --version
                    npm --version

                    echo "===== DOCKER ====="
                    docker context show
                    docker info | grep -i rootless
                    docker --version

                    echo "===== COMPOSE ====="
                    docker compose version
                '''
            }
        }

        stage('Frontend Install') {
            steps {
                dir("${FRONTEND_DIR}") {
                    sh '''
                        if [ -f package-lock.json ]; then
                            npm ci
                        else
                            npm install
                        fi
                    '''
                }
            }
        }

        stage('Frontend Build') {
            steps {
                dir("${FRONTEND_DIR}") {
                    sh 'npm run build'
                }
            }
        }

        stage('Backend Test') {
            steps {
                dir("${BACKEND_DIR}") {
                    script {
                        if (fileExists('mvnw')) {
                            sh '''
                                chmod +x mvnw
                                ./mvnw -B clean test
                            '''
                        } else {
                            sh 'mvn -B clean test'
                        }
                    }
                }
            }
        }

        stage('Backend Package') {
            steps {
                dir("${BACKEND_DIR}") {
                    script {
                        if (fileExists('mvnw')) {
                            sh './mvnw -B package -DskipTests'
                        } else {
                            sh 'mvn -B package -DskipTests'
                        }
                    }
                }
            }
        }

        stage('Docker Compose Validate') {
            steps {
                sh 'docker compose config'
            }
        }

        stage('Build Frontend Docker Image') {
            steps {
                sh '''
                    docker build \
                    -t platformops-frontend:${SHORT_SHA} \
                    ./frontend
                '''
            }
        }

        stage('Build Backend Docker Image') {
            steps {
                sh '''
                    docker build \
                    -t platformops-backend:${SHORT_SHA} \
                    ./backend
                '''
            }
        }

        stage('Verify Docker Images') {
            steps {
                sh '''
                    docker image inspect platformops-frontend:${SHORT_SHA}
                    docker image inspect platformops-backend:${SHORT_SHA}

                    echo "===== PLATFORMOPS IMAGES ====="
                    docker images | grep platformops
                '''
            }
        }

        stage('Deploy to Cloud') {
            when {
                expression { return params.DEPLOY_TO_CLOUD }
            }
            steps {
                withCredentials([sshUserPrivateKey(
                    credentialsId: 'platformops-cloud-ssh',
                    keyFileVariable: 'SSH_KEY',
                    usernameVariable: 'SSH_USER'
                )]) {
                    sh '''
                        set -eu

                        case "$CLOUD_HOST" in
                            ''|-*|*[!A-Za-z0-9.-]*)
                                echo "Enter a valid cloud hostname or IPv4 address."
                                exit 1 ;;
                        esac

                        case "$IMAGE_TAG" in
                            ''|[.-]*|*[!A-Za-z0-9_.-]*)
                                echo "Enter a valid Docker image tag."
                                exit 1 ;;
                        esac

                        echo "Deploying PlatformOps version $IMAGE_TAG"

                        ssh -i "$SSH_KEY" \
                            -o BatchMode=yes \
                            -o StrictHostKeyChecking=yes \
                            -o ConnectTimeout=15 \
                            "$SSH_USER@$CLOUD_HOST" \
                            "bash -se -- '$IMAGE_TAG'" <<'REMOTE'
set -eu
cd "$HOME/platformops"

export FRONTEND_IMAGE="saiyaf25/platformops-frontend:$1"
export BACKEND_IMAGE="saiyaf25/platformops-backend:$1"

docker compose -f compose.yaml config --quiet
docker compose -f compose.yaml pull
docker compose -f compose.yaml up -d --wait --wait-timeout 120
docker compose -f compose.yaml ps

curl --fail --silent --show-error --retry 5 --retry-connrefused \
    --output /dev/null http://127.0.0.1/

echo "PlatformOps frontend responded successfully."
REMOTE
                    '''
                }
            }
        }
    }

    post {

        success {
            echo '===================================='
            echo 'PLATFORMOPS PIPELINE SUCCESS'
            echo '===================================='
            echo "Git Commit: ${env.SHORT_SHA}"
            echo "Jenkins Build: ${env.BUILD_NUMBER}"
        }

        failure {
            echo '===================================='
            echo 'PLATFORMOPS PIPELINE FAILED'
            echo 'Check the failed stage above.'
            echo '===================================='
        }

        always {
            echo "Build Number: ${env.BUILD_NUMBER}"
        }
    }
}
