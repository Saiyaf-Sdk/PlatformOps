pipeline {

    agent { label 'rootless-docker' }

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
