// PlatformOps CI/CD on Jenkins: test → build images → push to Amazon ECR → bump the k8s image tag (Argo CD syncs it)
// Needs: Docker on the agent, AWS CLI, and Jenkins credentials "aws-ecr" (AWS access key) + "github-token".
pipeline {
  agent any
  options { timestamps(); disableConcurrentBuilds(); buildDiscarder(logRotator(numToKeepStr: '30')) }
  environment {
    AWS_REGION   = 'ap-south-1'
    ECR_REGISTRY = "${env.ECR_REGISTRY ?: '123456789012.dkr.ecr.ap-south-1.amazonaws.com'}"
    IMAGE_TAG    = "${env.GIT_COMMIT?.take(7) ?: 'latest'}"
  }
  stages {
    stage('Backend tests') {
      agent { docker { image 'maven:3.9-eclipse-temurin-21'; args '-v $HOME/.m2:/root/.m2'; reuseNode true } }
      steps { dir('Backend') { sh 'mvn -B -ntp verify' } }
      post { always { junit allowEmptyResults: true, testResults: 'Backend/target/surefire-reports/*.xml' } }
    }
    stage('Frontend build') {
      agent { docker { image 'node:22-alpine'; reuseNode true } }
      steps { dir('Frontend') { sh 'npm ci && npm run build' } }
    }
    stage('Build images') {
      steps {
        sh 'docker build -t $ECR_REGISTRY/platformops-api:$IMAGE_TAG Backend'
        sh 'docker build -t $ECR_REGISTRY/platformops-web:$IMAGE_TAG Frontend'
      }
    }
    stage('Push to ECR') {
      when { branch 'main' }
      steps {
        withCredentials([[$class: 'AmazonWebServicesCredentialsBinding', credentialsId: 'aws-ecr']]) {
          sh 'aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ECR_REGISTRY'
          sh 'docker push $ECR_REGISTRY/platformops-api:$IMAGE_TAG'
          sh 'docker push $ECR_REGISTRY/platformops-web:$IMAGE_TAG'
        }
      }
    }
    stage('Release (GitOps)') {
      when { branch 'main' }
      steps {
        withCredentials([string(credentialsId: 'github-token', variable: 'GH_TOKEN')]) {
          sh '''
            cd deploy/k8s/overlays/prod
            sed -i "s|newTag: .*|newTag: ${IMAGE_TAG}|g" kustomization.yaml
            git config user.email "jenkins@platformops.dev" && git config user.name "Jenkins"
            git commit -am "release: ${IMAGE_TAG}" || echo "nothing to release"
            git push https://x-access-token:${GH_TOKEN}@github.com/Saiyaf-Sdk/PlatformOps.git HEAD:main
          '''
        }
      }
    }
  }
  post { failure { echo 'Pipeline failed — check the stage logs above.' } }
}
