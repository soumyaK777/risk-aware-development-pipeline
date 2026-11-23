
pipeline {
    agent any

    stages {
        stage('Checkout') {
            steps {
                echo 'GitHub connection successful!'
            }
        }

        stage('Docker Build') {
            steps {
                echo 'Building backend Docker image...'
                sh 'docker build -t risk-aware-backend:v1 -f backend/Dockerfile .'
            }
        }

        stage('Docker Verify') {
            steps {
                sh 'docker images risk-aware-backend'
                echo 'Docker image created successfully!'
            }
        }

        stage('Complete') {
            steps {
                echo 'Jenkins and Docker integration successful!'
            }
        }
    }
}
