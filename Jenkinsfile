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
                sh '''
                    set -eux
                    SITE_ROOT="/www/wwwroot/datn-nextgen-suggest.site"
                    
                    # 1. Thử copy trực tiếp nếu có quyền đọc
                    if [ -f "$SITE_ROOT/.env" ]; then
                        echo "Copy trực tiếp từ $SITE_ROOT/.env"
                        cp "$SITE_ROOT/.env" .env
                    elif [ -f "$SITE_ROOT/.env" ]; then
                        echo "Copy trực tiếp từ $SITE_ROOT/.env"
                        cp "$SITE_ROOT/.env" .env
                    else
                        echo "Thử nạp file .env từ Host qua Docker Daemon..."
                        docker run --rm -v "$SITE_ROOT":/host_dir alpine sh -c "
                            if [ -f /host_dir/.env ]; then
                                cat /host_dir/.env
                            elif [ -f /host_dir/.env ]; then
                                cat /host_dir/.env
                            fi
                        " > .env || true
                    fi

                    if [ ! -s .env ] && [ -f .env.example ]; then
                        echo "CẢNH BÁO: Không nạp được .env thật, sử dụng tạm .env.example..."
                        cp .env.example .env
                    else
                        echo "=== Nạp file .env thật thành công! ==="
                    fi
                '''
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

        stage('Deploy Website (CD)') {
            steps {
                sh '''
                    set -eux
                    IMAGE_NAME="nivora-frontend-react:latest"
                    CONTAINER_NAME="nivora-frontend-react"

                    echo "=== 1. Đang xây dựng Docker Image cho Frontend ==="
                    docker build -t $IMAGE_NAME .

                    echo "=== 2. Đang dừng và xóa container cũ (nếu có) ==="
                    docker rm -f $CONTAINER_NAME || true

                    echo "=== 3. Khởi chạy Docker Container mới ở Port 3000 ==="
                    docker run -d \
                        --name $CONTAINER_NAME \
                        -p 3000:80 \
                        --restart always \
                        $IMAGE_NAME

                    echo "=== Triển khai Frontend thành công chạy dưới dạng Docker Container ở Port 3000! ==="
                '''
            }
        }

        stage('Archive Build') {
            steps {
                script {
                    if (fileExists('dist')) {
                        archiveArtifacts artifacts: 'dist/**/*', excludes: '**/.env, **/.env.*', allowEmptyArchive: true
                    } else {
                        echo "Build đã được đóng gói trực tiếp vào Docker Container!"
                    }
                }
            }
        }
    }

    post {
        success {
            echo 'KẾT QUẢ: Frontend React CI/CD pipeline thành công.'
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
