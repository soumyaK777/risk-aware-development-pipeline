
pipeline {
    agent any

    parameters {
        choice(
            name: 'RISK_LEVEL',
            choices: ['LOW', 'HIGH'],
            description: 'Select the risk level for the Docker image'
        )
    }

    environment {
        LOW_IMAGE = 'risk-aware-backend:v1'
        HIGH_IMAGE = 'risk-aware-backend:high'
    }

    stages {
        stage('Checkout') {
            steps {
                echo 'GitHub connection successful!'
            }
        }

        stage('Docker Build') {
            steps {
                script {
                    if (params.RISK_LEVEL == 'LOW') {
                        sh 'docker build -t risk-aware-backend:v1 -f backend/Dockerfile .'
                    } else {
                        sh 'docker build -t risk-aware-backend:high -f Dockerfile.high .'
                    }
                }
            }
        }

        stage('Trivy Vulnerability Scan') {
            steps {
                script {
                    def image = params.RISK_LEVEL == 'LOW'
                        ? env.LOW_IMAGE
                        : env.HIGH_IMAGE

                    def scanStatus = sh(
                        script: "trivy image --scanners vuln --severity HIGH,CRITICAL --exit-code 1 ${image}",
                        returnStatus: true
                    )

                    env.TRIVY_EXIT_CODE = "${scanStatus}"
                }
            }
        }

        stage('Risk Gatekeeper') {
            steps {
                script {
                    if (env.TRIVY_EXIT_CODE == '1') {
                        error('GATEKEEPER REJECTED: HIGH OR CRITICAL VULNERABILITIES FOUND. Deployment blocked!')
                    } else if (env.TRIVY_EXIT_CODE == '0') {
                        echo 'GATEKEEPER APPROVED: No HIGH or CRITICAL vulnerabilities.'
                    } else {
                        error('GATEKEEPER REJECTED: Trivy scan failed!')
                    }
                }
            }
        }

        stage('Docker Deploy') {
            when {
                expression {
                    params.RISK_LEVEL == 'LOW'
                }
            }
            steps {
                sh '''
                    set -eu

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

                    HEALTHY=0

                    for i in $(seq 1 15); do
                        if curl -fsS http://localhost:5000/api/status >/dev/null; then
                            HEALTHY=1
                            break
                        fi
                        sleep 2
                    done

                    if [ "$HEALTHY" -ne 1 ]; then
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

                    echo 'LOW-risk backend deployed successfully!'
                '''
            }
        }

        stage('Complete') {
            steps {
                echo "Risk level ${params.RISK_LEVEL} pipeline completed!"
            }
        }
    }
}
