pipeline {
    agent {
        docker {
            image 'btamas/puppeteer-git'
            reuseNode true
        }
    }
    stages {
        stage('Test') {
            environment {
                HOME = '.'
            }
            options {
                skipDefaultCheckout()
            }
            steps {
                dir('.') {
                    sh(
                        label: 'Setup frontend toolchain',
                        script: 'npm install'
                    )
                    sh (
                        label : 'Run frontend tests',
                        script: 'npm run test'
                    )
                }
            }
        }
    }
}