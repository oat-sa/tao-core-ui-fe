pipeline {
    agent {
        label 'master'
    }
    stages {
        stage('Frontend Tests') {
            agent {
                docker {
                    image 'btamas/puppeteer-git'
                    args '--cap-add=SYS_ADMIN'
                    reuseNode true
                }
            }
            environment {
                HOME = '.'
                PARALLEL_TESTS = 2
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