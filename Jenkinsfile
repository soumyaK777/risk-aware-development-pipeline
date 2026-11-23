
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

        stage('Risk Gatekeeper') {
            steps {
                script {
                    def trigger = sh(
                        script: "awk -F= '/^RISK_TRIGGER=/ {gsub(/\\r/, \"\", \$2); value=\$2} END {print value}' backend/health_config.txt",
                        returnStdout: true
                    ).trim()

                    echo "Risk trigger detected: ${trigger}"

                    if (trigger == 'HIGH') {
                        error('GATEKEEPER REJECTED: HIGH RISK. Deployment blocked!')
                    } else if (trigger == 'LOW') {
                        echo 'GATEKEEPER APPROVED: LOW RISK. Deployment allowed.'
                    } else {
                        error('GATEKEEPER REJECTED: Invalid or missing risk configuration!')
                    }

                    env.RISK_TRIGGER = trigger
                }
            }
        }

        stage('Docker Deploy') {
            steps {
                sh '''
                    set -eu

                    echo "Preparing Docker deployment..."

                    if docker container inspect risk-backend >/dev/null 2>&1; then
                        docker stop risk-backend
                        docker rename risk-backend risk-backend-previous
                    fi

                    if ! docker run -d --restart unless-stopped \
                        --name risk-backend \
                        -p 5000:5000 \
                        risk-aware-backend:v1; then

                        if docker container inspect risk-backend-previous >/dev/null 2>&1; then
                            docker rename risk-backend-previous risk-backend
                            docker start risk-backend
                        fi

                        exit 1
                    fi

                    echo "Checking new backend deployment..."

                    HEALTHY=0

                    for i in $(seq 1 15); do
                        if curl -fsS http://localhost:5000/api/status >/dev/null; then
                            HEALTHY=1
                            break
                        fi
                        sleep 2
                    done

                    if [ "$HEALTHY" -ne 1 ]; then
                        echo "Deployment health check failed!"
                        docker rm -f risk-backend || true

                        if docker container inspect risk-backend-previous >/dev/null 2>&1; then
                            docker rename risk-backend-previous risk-backend
                            docker start risk-backend
                        fi

                        exit 1
                    fi

                    if docker container inspect risk-backend-previous >/dev/null 2>&1; then
                        docker rm -f risk-backend-previous
                    fi

                    echo "Backend deployed and health check passed!"
                '''
            }
        }

        stage('Complete') {
            steps {
                echo 'Jenkins + Docker + Risk Gatekeeper pipeline completed!'
            }
        }
    }
}
