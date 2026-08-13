def installCmd = 'npm install'
def runCmd = 'npm'
def buildDir = ''

pipeline {
    agent any

    options {
        timestamps()
        disableConcurrentBuilds()
        timeout(time: 15, unit: 'MINUTES')
        buildDiscarder(logRotator(numToKeepStr: '10'))
    }

    stages {
        stage('Checkout Source') {
            steps {
                echo 'Đang thực hiện checkout mã nguồn frontend từ Git...'
                checkout scm
            }
        }

        stage('Show Environment') {
            steps {
                sh '''
                    set -eux
                    node -v
                    npm -v
                    git --version
                    pwd
                '''
            }
        }

        stage('Validate Project') {
            steps {
                script {
                    if (!fileExists('package.json')) {
                        error "LỖI: Không tìm thấy file 'package.json' ở thư mục gốc của dự án. Hủy pipeline!"
                    }
                    
                    if (fileExists('package-lock.json')) {
                        installCmd = 'npm ci'
                        runCmd = 'npm'
                        echo "Phát hiện package-lock.json. Sử dụng lệnh cài đặt: npm ci"
                    } else if (fileExists('yarn.lock')) {
                        def hasYarn = sh(script: 'command -v yarn >/dev/null 2>&1', returnStatus: true) == 0
                        if (hasYarn) {
                            installCmd = 'yarn install --frozen-lockfile'
                            runCmd = 'yarn'
                            echo "Phát hiện yarn.lock và yarn đã được cài đặt. Sử dụng yarn"
                        } else {
                            installCmd = 'npm install'
                            runCmd = 'npm'
                            echo "Phát hiện yarn.lock nhưng không tìm thấy yarn trên Agent. Dự phòng dùng npm"
                        }
                    } else if (fileExists('pnpm-lock.yaml')) {
                        def hasPnpm = sh(script: 'command -v pnpm >/dev/null 2>&1', returnStatus: true) == 0
                        if (hasPnpm) {
                            installCmd = 'pnpm install --frozen-lockfile'
                            runCmd = 'pnpm'
                            echo "Phát hiện pnpm-lock.yaml và pnpm đã được cài đặt. Sử dụng pnpm"
                        } else {
                            installCmd = 'npm install'
                            runCmd = 'npm'
                            echo "Phát hiện pnpm-lock.yaml nhưng không tìm thấy pnpm trên Agent. Dự phòng dùng npm"
                        }
                    } else {
                        installCmd = 'npm install'
                    }
                }
            }
        }

        stage('Prepare Environment') {
            steps {
                script {
                    if (!fileExists('.env') && fileExists('.env.example')) {
                        echo 'Tự động sao chép .env.example -> .env cho môi trường CI...'
                        sh 'cp .env.example .env'
                    }
                }
            }
        }

        stage('Install Dependencies') {
            steps {
                sh """
                    set -eux
                    ${installCmd}
                """
            }
        }

        stage('Test hoặc Lint') {
            steps {
                sh """
                    set -eux
                    node -e "
                    const fs = require('fs');
                    const execSync = require('child_process').execSync;
                    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
                    
                    const runScript = (scriptName) => {
                        if (pkg.scripts && pkg.scripts[scriptName]) {
                            console.log('=== Đang chạy script: ' + scriptName + ' ===');
                            try {
                                const extraArgs = scriptName === 'test' ? ' -- --watchAll=false --passWithNoTests' : '';
                                const cmd = '${runCmd} run ' + scriptName + extraArgs;
                                execSync(cmd, { stdio: 'inherit', env: { ...process.env, CI: 'true' } });
                            } catch (e) {
                                console.error('=== Script ' + scriptName + ' gặp lỗi! ===');
                                process.exit(1);
                            }
                        } else {
                            console.log('=== Không tìm thấy script: ' + scriptName + ' trong package.json, bỏ qua ===');
                        }
                    };

                    runScript('lint');
                    runScript('test');
                    "
                """
            }
        }

        stage('Build') {
            steps {
                sh """
                    set -eux
                    ${runCmd} run build
                """
            }
        }

        stage('Archive Build') {
            steps {
                script {
                    if (fileExists('dist')) {
                        buildDir = 'dist'
                        echo "Phát hiện thư mục build: dist"
                    } else if (fileExists('build')) {
                        buildDir = 'build'
                        echo "Phát hiện thư mục build: build"
                    } else {
                        error "LỖI: Không tìm thấy thư mục đầu ra 'dist' hay 'build'. Quá trình build có thể đã thất bại!"
                    }
                    
                    archiveArtifacts artifacts: "${buildDir}/**/*", excludes: '**/.env, **/.env.*'
                    
                    stash name: 'frontend-build-artifacts', includes: "${buildDir}/**/*", excludes: '**/.env, **/.env.*'
                }
            }
        }
    }

    post {
        success {
            echo 'KẾT QUẢ: Pipeline chạy thành công tốt đẹp!'
        }
        unstable {
            echo 'KẾT QUẢ: Pipeline chạy hoàn thành nhưng trạng thái không ổn định (unstable)!'
        }
        failure {
            echo 'KẾT QUẢ: Pipeline thất bại! Vui lòng kiểm tra lại log chi tiết.'
        }
        always {
            echo 'Đang dọn dẹp thư mục làm việc (Workspace)...'
            cleanWs()
        }
    }
}
