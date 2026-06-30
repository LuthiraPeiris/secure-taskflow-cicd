pipeline {
    agent any

    environment {
        DOCKERHUB_USERNAME = "luthirapeiris"
        BACKEND_IMAGE = "${DOCKERHUB_USERNAME}/taskflow-backend"
        FRONTEND_IMAGE = "${DOCKERHUB_USERNAME}/taskflow-frontend"
        IMAGE_TAG = "${BUILD_NUMBER}"

        DOCKER_CREDENTIALS = "dockerhub-credentials"

        BASTION_IP = "98.92.230.83"
        APP_PRIVATE_IP = "10.0.2.13"
        SSH_KEY_PATH = "/home/ubuntu/taskflow-key.pem"
    }

    stages {
        stage('Fetch Code') {
            steps {
                echo 'Fetching code from GitHub...'
                checkout scm
            }
        }

        stage('Install Backend Dependencies') {
            steps {
                dir('backend') {
                    sh 'npm install'
                }
            }
        }

        stage('Test Backend') {
            steps {
                dir('backend') {
                    sh 'npm test'
                }
            }
        }

        stage('Install Frontend Dependencies') {
            steps {
                dir('frontend') {
                    sh 'npm install'
                }
            }
        }

        stage('Test Frontend') {
            steps {
                dir('frontend') {
                    sh 'npm test'
                }
            }
        }

        stage('Build Docker Images') {
            steps {
                sh '''
                docker build -t $BACKEND_IMAGE:$IMAGE_TAG ./backend
                docker build -t $FRONTEND_IMAGE:$IMAGE_TAG ./frontend
                '''
            }
        }

        stage('Scan Docker Images with Trivy') {
            steps {
                sh '''
                trivy image --exit-code 0 --severity LOW,MEDIUM,HIGH,CRITICAL $BACKEND_IMAGE:$IMAGE_TAG
                trivy image --exit-code 0 --severity LOW,MEDIUM,HIGH,CRITICAL $FRONTEND_IMAGE:$IMAGE_TAG
                '''
            }
        }

        stage('Login to Docker Hub') {
            steps {
                withCredentials([usernamePassword(
                    credentialsId: "${DOCKER_CREDENTIALS}",
                    usernameVariable: 'DOCKER_USER',
                    passwordVariable: 'DOCKER_PASS'
                )]) {
                    sh '''
                    echo "$DOCKER_PASS" | docker login -u "$DOCKER_USER" --password-stdin
                    '''
                }
            }
        }

        stage('Push Docker Images') {
            steps {
                sh '''
                docker push $BACKEND_IMAGE:$IMAGE_TAG
                docker push $FRONTEND_IMAGE:$IMAGE_TAG
                '''
            }
        }

        stage('Deploy to Private EC2') {
            steps {
                sh '''
                sed "s/YOUR_DOCKERHUB_USERNAME/$DOCKERHUB_USERNAME/g; s/\\${IMAGE_TAG}/$IMAGE_TAG/g" docker-compose.prod.yml > docker-compose.deploy.yml

                scp -i $SSH_KEY_PATH \
                -o StrictHostKeyChecking=no \
                -o ProxyCommand="ssh -i $SSH_KEY_PATH -o StrictHostKeyChecking=no -W %h:%p ubuntu@$BASTION_IP" \
                docker-compose.deploy.yml ubuntu@$APP_PRIVATE_IP:/home/ubuntu/docker-compose.yml

                scp -i $SSH_KEY_PATH \
                -o StrictHostKeyChecking=no \
                -o ProxyCommand="ssh -i $SSH_KEY_PATH -o StrictHostKeyChecking=no -W %h:%p ubuntu@$BASTION_IP" \
                database/init.sql ubuntu@$APP_PRIVATE_IP:/home/ubuntu/init.sql

                ssh -i $SSH_KEY_PATH \
                -o StrictHostKeyChecking=no \
                -o ProxyCommand="ssh -i $SSH_KEY_PATH -o StrictHostKeyChecking=no -W %h:%p ubuntu@$BASTION_IP" \
                ubuntu@$APP_PRIVATE_IP "
                    mkdir -p /home/ubuntu/database &&
                    mv /home/ubuntu/init.sql /home/ubuntu/database/init.sql &&
                    docker compose down || true &&
                    IMAGE_TAG=$IMAGE_TAG docker compose up -d
                "
                '''
            }
        }
    }

    post {
        success {
            echo 'CI/CD pipeline completed successfully!'
        }

        failure {
            echo 'CI/CD pipeline failed. Check logs.'
        }
    }
}