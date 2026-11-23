
pipeline {
    agent any

    stages {
        stage('Checkout') {
            steps {
                echo 'Connected to GitHub successfully!'
            }
        }

        stage('Build Docker Image') {
            steps {
                sh 'docker build -t risk-aware-backend:${BUILD_NUMBER} -f backend/Dockerfile .'
            }
        }

        stage('Risk Gatekeeper - Trivy Scan') {
            steps {
                sh 'trivy image --scanners vuln --severity HIGH,CRITICAL --exit-code 1 risk-aware-backend:${BUILD_NUMBER}'
            }
        }

        stage('Complete') {
            steps {
                echo 'Security checks passed! Ready for deployment.'
            }
        }
    }
}
