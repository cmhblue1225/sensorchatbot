# 🎮 듀얼 센서 게임 예제 (파트 2) - 나머지 4개

## 예제 7: 협력 탱크 게임
```html
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>협력 탱크 게임</title>
    <script src="/js/SessionSDK.js"></script>
    <style>
        #gameCanvas {
            border: 2px solid #333;
            background: linear-gradient(180deg, #2c3e50 0%, #34495e 100%);
        }
        .tank-status {
            display: flex;
            justify-content: space-around;
            margin: 10px 0;
            font-weight: bold;
        }
        .tank-info {
            background: #ecf0f1;
            padding: 8px;
            border-radius: 8px;
            min-width: 120px;
            text-align: center;
        }
    </style>
</head>
<body>
    <div id="sessionInfo"></div>
    <div class="tank-status">
        <div class="tank-info">
            <div>🟢 탱크 1</div>
            <div>HP: <span id="tank1HP">100</span>/100</div>
            <div>탄약: <span id="tank1Ammo">10</span>/10</div>
        </div>
        <div class="tank-info">
            <div>🔴 탱크 2</div>
            <div>HP: <span id="tank2HP">100</span>/100</div>
            <div>탄약: <span id="tank2Ammo">10</span>/10</div>
        </div>
        <div class="tank-info">
            <div>적 남은 수: <span id="enemyCount">5</span></div>
            <div>웨이브: <span id="waveNumber">1</span></div>
        </div>
    </div>
    <canvas id="gameCanvas" width="800" height="600"></canvas>

    <script>
        const canvas = document.getElementById('gameCanvas');
        const ctx = canvas.getContext('2d');

        const game = {
            tanks: {
                tank1: {
                    x: 100,
                    y: 500,
                    angle: 0,
                    turretAngle: 0,
                    width: 40,
                    height: 30,
                    hp: 100,
                    maxHP: 100,
                    ammo: 10,
                    maxAmmo: 10,
                    speed: 2,
                    color: '#2ecc71',
                    connected: false,
                    reloadTime: 0,
                    lastShot: 0
                },
                tank2: {
                    x: 700,
                    y: 500,
                    angle: Math.PI,
                    turretAngle: Math.PI,
                    width: 40,
                    height: 30,
                    hp: 100,
                    maxHP: 100,
                    ammo: 10,
                    maxAmmo: 10,
                    speed: 2,
                    color: '#e74c3c',
                    connected: false,
                    reloadTime: 0,
                    lastShot: 0
                }
            },
            bullets: [],
            enemies: [],
            explosions: [],
            obstacles: [
                { x: 200, y: 200, width: 80, height: 80 },
                { x: 520, y: 350, width: 80, height: 80 },
                { x: 350, y: 150, width: 60, height: 120 }
            ],
            waveNumber: 1,
            enemiesInWave: 5,
            enemiesKilled: 0,
            gameRunning: false,
            spawnTimer: 0,
            powerUps: []
        };

        // SessionSDK 초기화
        const sdk = new SessionSDK({
            gameId: 'tank-coop',
            gameType: 'dual'
        });

        sdk.on('connected', () => {
            createSession();
        });

        sdk.on('session-created', (event) => {
            const session = event.detail || event;
            displaySessionInfo(session);
        });

        sdk.on('sensor-data', (event) => {
            const data = event.detail || event;
            processSensorData(data);
        });

        function createSession() {
            sdk.createSession();
        }

        function displaySessionInfo(session) {
            document.getElementById('sessionInfo').innerHTML = `
                <div style="background: #2c3e50; color: #fff; padding: 15px; border-radius: 10px; margin-bottom: 10px;">
                    <h3>🚗 협력 탱크 게임</h3>
                    <p><strong>세션 코드:</strong> ${session.sessionCode}</p>
                    <p><strong>목표:</strong> 협력하여 적들을 물리치세요!</p>
                    <div id="qrcode"></div>
                </div>
            `;

            generateQRCode(session.qrCodeUrl);
            spawnWave();
            startGame();
        }

        function generateQRCode(url) {
            try {
                if (typeof QRCode !== 'undefined') {
                    new QRCode(document.getElementById("qrcode"), {
                        text: url,
                        width: 128,
                        height: 128
                    });
                } else {
                    document.getElementById("qrcode").innerHTML =
                        `<img src="https://api.qrserver.com/v1/create-qr-code/?size=128x128&data=${encodeURIComponent(url)}" alt="QR Code">`;
                }
            } catch (error) {
                document.getElementById("qrcode").innerHTML =
                    `<img src="https://api.qrserver.com/v1/create-qr-code/?size=128x128&data=${encodeURIComponent(url)}" alt="QR Code">`;
            }
        }

        function processSensorData(data) {
            if (!game.gameRunning || !data.orientation) return;

            const isTank1 = data.sensorId.includes('sensor1') || data.timestamp % 2 === 0;
            const tank = isTank1 ? game.tanks.tank1 : game.tanks.tank2;

            tank.connected = true;

            const { beta, gamma } = data.orientation;
            const acceleration = data.acceleration || {};

            // 탱크 이동 (좌우 기울기)
            if (Math.abs(gamma) > 10) {
                const turnSpeed = 0.05;
                tank.angle += (gamma > 0 ? turnSpeed : -turnSpeed);
            }

            // 탱크 전진/후진 (앞뒤 기울기)
            if (Math.abs(beta) > 15) {
                const moveSpeed = tank.speed * (beta > 0 ? -0.5 : 1);
                const newX = tank.x + Math.cos(tank.angle) * moveSpeed;
                const newY = tank.y + Math.sin(tank.angle) * moveSpeed;

                if (canMoveTo(newX, newY, tank)) {
                    tank.x = newX;
                    tank.y = newY;
                }
            }

            // 포탑 조준 (회전)
            if (data.rotationRate && Math.abs(data.rotationRate.alpha) > 2) {
                tank.turretAngle += data.rotationRate.alpha * 0.01;
            }

            // 발사 (흔들기)
            const totalAccel = Math.sqrt(
                (acceleration.x || 0) ** 2 +
                (acceleration.y || 0) ** 2 +
                (acceleration.z || 0) ** 2
            );

            if (totalAccel > 20 && tank.ammo > 0 && Date.now() - tank.lastShot > 500) {
                shoot(tank);
            }
        }

        function canMoveTo(x, y, tank) {
            // 화면 경계 검사
            if (x < tank.width/2 || x > canvas.width - tank.width/2 ||
                y < tank.height/2 || y > canvas.height - tank.height/2) {
                return false;
            }

            // 장애물 충돌 검사
            for (let obstacle of game.obstacles) {
                if (x < obstacle.x + obstacle.width &&
                    x + tank.width > obstacle.x &&
                    y < obstacle.y + obstacle.height &&
                    y + tank.height > obstacle.y) {
                    return false;
                }
            }

            return true;
        }

        function shoot(tank) {
            if (tank.ammo <= 0) return;

            tank.ammo--;
            tank.lastShot = Date.now();

            const bulletSpeed = 8;
            const bulletX = tank.x + Math.cos(tank.turretAngle) * (tank.width / 2 + 10);
            const bulletY = tank.y + Math.sin(tank.turretAngle) * (tank.width / 2 + 10);

            game.bullets.push({
                x: bulletX,
                y: bulletY,
                vx: Math.cos(tank.turretAngle) * bulletSpeed,
                vy: Math.sin(tank.turretAngle) * bulletSpeed,
                owner: tank,
                life: 120
            });

            updateUI();
        }

        function spawnWave() {
            game.enemies = [];
            const enemyCount = game.enemiesInWave + Math.floor(game.waveNumber / 2);

            for (let i = 0; i < enemyCount; i++) {
                setTimeout(() => {
                    spawnEnemy();
                }, i * 1000);
            }

            document.getElementById('enemyCount').textContent = enemyCount;
            document.getElementById('waveNumber').textContent = game.waveNumber;
        }

        function spawnEnemy() {
            const spawnPoints = [
                { x: 50, y: 50 },
                { x: canvas.width - 50, y: 50 },
                { x: canvas.width / 2, y: 50 },
                { x: 50, y: canvas.height / 2 },
                { x: canvas.width - 50, y: canvas.height / 2 }
            ];

            const spawn = spawnPoints[Math.floor(Math.random() * spawnPoints.length)];

            game.enemies.push({
                x: spawn.x,
                y: spawn.y,
                angle: 0,
                hp: 50 + game.waveNumber * 10,
                maxHP: 50 + game.waveNumber * 10,
                speed: 1 + game.waveNumber * 0.2,
                width: 35,
                height: 25,
                color: '#8e44ad',
                lastShot: 0,
                target: null,
                ai: {
                    state: 'hunting',
                    pathfindingTimer: 0
                }
            });
        }

        function startGame() {
            game.gameRunning = true;
            gameLoop();
        }

        function update() {
            if (!game.gameRunning) return;

            // 탄약 재장전
            Object.values(game.tanks).forEach(tank => {
                if (tank.ammo < tank.maxAmmo) {
                    tank.reloadTime++;
                    if (tank.reloadTime >= 120) { // 2초
                        tank.ammo++;
                        tank.reloadTime = 0;
                        updateUI();
                    }
                }
            });

            // 총알 업데이트
            game.bullets.forEach((bullet, index) => {
                bullet.x += bullet.vx;
                bullet.y += bullet.vy;
                bullet.life--;

                // 화면 밖으로 나가거나 수명 다함
                if (bullet.x < 0 || bullet.x > canvas.width ||
                    bullet.y < 0 || bullet.y > canvas.height ||
                    bullet.life <= 0) {
                    game.bullets.splice(index, 1);
                    return;
                }

                // 장애물 충돌
                for (let obstacle of game.obstacles) {
                    if (bullet.x > obstacle.x && bullet.x < obstacle.x + obstacle.width &&
                        bullet.y > obstacle.y && bullet.y < obstacle.y + obstacle.height) {
                        game.bullets.splice(index, 1);
                        createExplosion(bullet.x, bullet.y, 'small');
                        return;
                    }
                }

                // 적과의 충돌
                game.enemies.forEach((enemy, enemyIndex) => {
                    const dx = bullet.x - enemy.x;
                    const dy = bullet.y - enemy.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < enemy.width / 2) {
                        enemy.hp -= 25;
                        game.bullets.splice(index, 1);
                        createExplosion(bullet.x, bullet.y, 'medium');

                        if (enemy.hp <= 0) {
                            game.enemies.splice(enemyIndex, 1);
                            game.enemiesKilled++;
                            createExplosion(enemy.x, enemy.y, 'large');

                            // 웨이브 완료 확인
                            if (game.enemies.length === 0) {
                                game.waveNumber++;
                                setTimeout(() => spawnWave(), 2000);
                            }
                        }
                    }
                });
            });

            // 적 AI 업데이트
            game.enemies.forEach(enemy => {
                updateEnemyAI(enemy);
            });

            // 폭발 애니메이션 업데이트
            game.explosions.forEach((explosion, index) => {
                explosion.life--;
                explosion.size += explosion.growth;

                if (explosion.life <= 0) {
                    game.explosions.splice(index, 1);
                }
            });

            updateUI();
        }

        function updateEnemyAI(enemy) {
            // 가장 가까운 탱크 찾기
            const tanks = Object.values(game.tanks).filter(tank => tank.connected && tank.hp > 0);
            if (tanks.length === 0) return;

            let nearestTank = null;
            let nearestDistance = Infinity;

            tanks.forEach(tank => {
                const dx = tank.x - enemy.x;
                const dy = tank.y - enemy.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < nearestDistance) {
                    nearestDistance = distance;
                    nearestTank = tank;
                }
            });

            if (nearestTank) {
                // 타겟을 향해 이동
                const dx = nearestTank.x - enemy.x;
                const dy = nearestTank.y - enemy.y;
                const angle = Math.atan2(dy, dx);

                enemy.angle = angle;

                const newX = enemy.x + Math.cos(angle) * enemy.speed;
                const newY = enemy.y + Math.sin(angle) * enemy.speed;

                if (canMoveTo(newX, newY, enemy)) {
                    enemy.x = newX;
                    enemy.y = newY;
                }

                // 발사
                if (nearestDistance < 200 && Date.now() - enemy.lastShot > 1500) {
                    shootEnemyBullet(enemy, nearestTank);
                }
            }
        }

        function shootEnemyBullet(enemy, target) {
            enemy.lastShot = Date.now();

            const bulletSpeed = 6;
            const angle = Math.atan2(target.y - enemy.y, target.x - enemy.x);

            game.bullets.push({
                x: enemy.x + Math.cos(angle) * (enemy.width / 2 + 10),
                y: enemy.y + Math.sin(angle) * (enemy.width / 2 + 10),
                vx: Math.cos(angle) * bulletSpeed,
                vy: Math.sin(angle) * bulletSpeed,
                owner: enemy,
                life: 120,
                isEnemyBullet: true
            });
        }

        function createExplosion(x, y, size) {
            const explosionSize = size === 'small' ? 20 : size === 'medium' ? 40 : 60;

            game.explosions.push({
                x: x,
                y: y,
                size: 0,
                maxSize: explosionSize,
                growth: explosionSize / 20,
                life: 20,
                color: '#ff6b6b'
            });
        }

        function updateUI() {
            document.getElementById('tank1HP').textContent = game.tanks.tank1.hp;
            document.getElementById('tank1Ammo').textContent = game.tanks.tank1.ammo;
            document.getElementById('tank2HP').textContent = game.tanks.tank2.hp;
            document.getElementById('tank2Ammo').textContent = game.tanks.tank2.ammo;
            document.getElementById('enemyCount').textContent = game.enemies.length;
        }

        function render() {
            // 배경 지우기
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // 배경 패턴
            ctx.fillStyle = '#34495e';
            for (let x = 0; x < canvas.width; x += 50) {
                for (let y = 0; y < canvas.height; y += 50) {
                    if ((x + y) % 100 === 0) {
                        ctx.fillRect(x, y, 25, 25);
                    }
                }
            }

            // 장애물 그리기
            game.obstacles.forEach(obstacle => {
                ctx.fillStyle = '#7f8c8d';
                ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);

                ctx.strokeStyle = '#95a5a6';
                ctx.lineWidth = 2;
                ctx.strokeRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
            });

            // 탱크 그리기
            Object.values(game.tanks).forEach(tank => {
                if (!tank.connected) return;

                ctx.save();
                ctx.translate(tank.x, tank.y);

                // 탱크 본체
                ctx.rotate(tank.angle);
                ctx.fillStyle = tank.color;
                ctx.fillRect(-tank.width / 2, -tank.height / 2, tank.width, tank.height);

                ctx.strokeStyle = '#2c3e50';
                ctx.lineWidth = 2;
                ctx.strokeRect(-tank.width / 2, -tank.height / 2, tank.width, tank.height);

                // 포탑
                ctx.rotate(tank.turretAngle - tank.angle);
                ctx.fillStyle = '#34495e';
                ctx.fillRect(-5, -8, tank.width / 2 + 10, 16);

                ctx.restore();

                // HP 바
                const hpBarWidth = 40;
                const hpBarHeight = 6;
                const hpRatio = tank.hp / tank.maxHP;

                ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
                ctx.fillRect(tank.x - hpBarWidth / 2, tank.y - tank.height / 2 - 15, hpBarWidth, hpBarHeight);

                ctx.fillStyle = hpRatio > 0.5 ? '#2ecc71' : hpRatio > 0.25 ? '#f39c12' : '#e74c3c';
                ctx.fillRect(tank.x - hpBarWidth / 2, tank.y - tank.height / 2 - 15, hpBarWidth * hpRatio, hpBarHeight);
            });

            // 적 그리기
            game.enemies.forEach(enemy => {
                ctx.save();
                ctx.translate(enemy.x, enemy.y);
                ctx.rotate(enemy.angle);

                ctx.fillStyle = enemy.color;
                ctx.fillRect(-enemy.width / 2, -enemy.height / 2, enemy.width, enemy.height);

                ctx.strokeStyle = '#5b2c6f';
                ctx.lineWidth = 2;
                ctx.strokeRect(-enemy.width / 2, -enemy.height / 2, enemy.width, enemy.height);

                ctx.restore();

                // 적 HP 바
                const hpBarWidth = 30;
                const hpBarHeight = 4;
                const hpRatio = enemy.hp / enemy.maxHP;

                ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
                ctx.fillRect(enemy.x - hpBarWidth / 2, enemy.y - enemy.height / 2 - 10, hpBarWidth, hpBarHeight);

                ctx.fillStyle = '#e74c3c';
                ctx.fillRect(enemy.x - hpBarWidth / 2, enemy.y - enemy.height / 2 - 10, hpBarWidth * hpRatio, hpBarHeight);
            });

            // 총알 그리기
            game.bullets.forEach(bullet => {
                ctx.fillStyle = bullet.isEnemyBullet ? '#e74c3c' : '#f1c40f';
                ctx.beginPath();
                ctx.arc(bullet.x, bullet.y, 3, 0, Math.PI * 2);
                ctx.fill();

                // 총알 트레일
                ctx.strokeStyle = bullet.isEnemyBullet ? '#c0392b' : '#f39c12';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(bullet.x - bullet.vx * 2, bullet.y - bullet.vy * 2);
                ctx.lineTo(bullet.x, bullet.y);
                ctx.stroke();
            });

            // 폭발 그리기
            game.explosions.forEach(explosion => {
                const alpha = explosion.life / 20;
                ctx.globalAlpha = alpha;

                ctx.fillStyle = explosion.color;
                ctx.beginPath();
                ctx.arc(explosion.x, explosion.y, explosion.size, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = '#ffd700';
                ctx.beginPath();
                ctx.arc(explosion.x, explosion.y, explosion.size * 0.6, 0, Math.PI * 2);
                ctx.fill();
            });

            ctx.globalAlpha = 1;
        }

        function gameLoop() {
            if (game.gameRunning) {
                update();
                render();
                requestAnimationFrame(gameLoop);
            }
        }

        // QR 코드 라이브러리 로드
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js';
        document.head.appendChild(script);
    </script>
</body>
</html>
```

## 예제 8: 듀얼 패들 게임
```html
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>듀얼 패들 게임</title>
    <script src="/js/SessionSDK.js"></script>
    <style>
        #gameCanvas {
            border: 2px solid #333;
            background: linear-gradient(45deg, #1e3c72, #2a5298);
        }
        .game-stats {
            display: flex;
            justify-content: space-around;
            margin: 10px 0;
            font-weight: bold;
        }
        .score-display {
            font-size: 18px;
            padding: 5px 15px;
            border-radius: 5px;
            min-width: 100px;
            text-align: center;
        }
        .player1-score { background: #3498db; color: white; }
        .player2-score { background: #e74c3c; color: white; }
    </style>
</head>
<body>
    <div id="sessionInfo"></div>
    <div class="game-stats">
        <div class="score-display player1-score">
            플레이어 1: <span id="player1Score">0</span>
        </div>
        <div class="score-display" style="background: #95a5a6; color: white;">
            공 속도: <span id="ballSpeed">5</span>
        </div>
        <div class="score-display player2-score">
            플레이어 2: <span id="player2Score">0</span>
        </div>
    </div>
    <canvas id="gameCanvas" width="800" height="500"></canvas>

    <script>
        const canvas = document.getElementById('gameCanvas');
        const ctx = canvas.getContext('2d');

        const game = {
            paddles: {
                player1: {
                    x: 20,
                    y: canvas.height / 2 - 50,
                    width: 15,
                    height: 100,
                    speed: 0,
                    maxSpeed: 8,
                    color: '#3498db',
                    connected: false,
                    powerUp: null,
                    powerUpTime: 0
                },
                player2: {
                    x: canvas.width - 35,
                    y: canvas.height / 2 - 50,
                    width: 15,
                    height: 100,
                    speed: 0,
                    maxSpeed: 8,
                    color: '#e74c3c',
                    connected: false,
                    powerUp: null,
                    powerUpTime: 0
                }
            },
            balls: [{
                x: canvas.width / 2,
                y: canvas.height / 2,
                vx: 5,
                vy: 3,
                radius: 8,
                baseSpeed: 5,
                maxSpeed: 12,
                trail: []
            }],
            scores: { player1: 0, player2: 0 },
            powerUps: [],
            particles: [],
            gameRunning: false,
            winScore: 7,
            lastScorer: null,
            multiballActive: false,
            freezeTime: 0
        };

        // SessionSDK 초기화
        const sdk = new SessionSDK({
            gameId: 'dual-paddle',
            gameType: 'dual'
        });

        sdk.on('connected', () => {
            createSession();
        });

        sdk.on('session-created', (event) => {
            const session = event.detail || event;
            displaySessionInfo(session);
        });

        sdk.on('sensor-data', (event) => {
            const data = event.detail || event;
            processSensorData(data);
        });

        function createSession() {
            sdk.createSession();
        }

        function displaySessionInfo(session) {
            document.getElementById('sessionInfo').innerHTML = `
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #fff; padding: 15px; border-radius: 10px; margin-bottom: 10px;">
                    <h3>🏓 듀얼 패들 게임</h3>
                    <p><strong>세션 코드:</strong> ${session.sessionCode}</p>
                    <p><strong>목표:</strong> 7점을 먼저 얻는 플레이어가 승리!</p>
                    <div id="qrcode"></div>
                </div>
            `;

            generateQRCode(session.qrCodeUrl);
            startGame();
        }

        function generateQRCode(url) {
            try {
                if (typeof QRCode !== 'undefined') {
                    new QRCode(document.getElementById("qrcode"), {
                        text: url,
                        width: 128,
                        height: 128
                    });
                } else {
                    document.getElementById("qrcode").innerHTML =
                        `<img src="https://api.qrserver.com/v1/create-qr-code/?size=128x128&data=${encodeURIComponent(url)}" alt="QR Code">`;
                }
            } catch (error) {
                document.getElementById("qrcode").innerHTML =
                    `<img src="https://api.qrserver.com/v1/create-qr-code/?size=128x128&data=${encodeURIComponent(url)}" alt="QR Code">`;
            }
        }

        function processSensorData(data) {
            if (!game.gameRunning || !data.orientation) return;

            const isPlayer1 = data.sensorId.includes('sensor1') || data.timestamp % 2 === 0;
            const paddle = isPlayer1 ? game.paddles.player1 : game.paddles.player2;

            paddle.connected = true;

            const { beta } = data.orientation; // 앞뒤 기울기로 패들 제어

            // 패들 속도 계산
            paddle.speed = (beta / 90) * paddle.maxSpeed;

            // 패들 위치 업데이트
            paddle.y += paddle.speed;

            // 화면 경계 제한
            paddle.y = Math.max(0, Math.min(canvas.height - paddle.height, paddle.y));

            // 파워업 활성화 (흔들기)
            if (data.acceleration) {
                const totalAccel = Math.sqrt(
                    (data.acceleration.x || 0) ** 2 +
                    (data.acceleration.y || 0) ** 2 +
                    (data.acceleration.z || 0) ** 2
                );

                if (totalAccel > 25 && !paddle.powerUp) {
                    activateRandomPowerUp(paddle);
                }
            }
        }

        function activateRandomPowerUp(paddle) {
            const powerUpTypes = ['big', 'fast', 'freeze', 'multiball'];
            const randomPowerUp = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];

            paddle.powerUp = randomPowerUp;
            paddle.powerUpTime = 300; // 5초

            switch (randomPowerUp) {
                case 'big':
                    paddle.height = 150;
                    break;
                case 'fast':
                    paddle.maxSpeed = 15;
                    break;
                case 'freeze':
                    game.freezeTime = 180; // 3초
                    break;
                case 'multiball':
                    if (!game.multiballActive) {
                        addExtraBalls();
                        game.multiballActive = true;
                    }
                    break;
            }

            createPowerUpEffect(paddle.x, paddle.y + paddle.height / 2);
        }

        function addExtraBalls() {
            for (let i = 0; i < 2; i++) {
                const angle = (Math.PI / 4) * (i + 1);
                game.balls.push({
                    x: canvas.width / 2 + Math.cos(angle) * 50,
                    y: canvas.height / 2 + Math.sin(angle) * 50,
                    vx: Math.cos(angle) * 4,
                    vy: Math.sin(angle) * 4,
                    radius: 6,
                    baseSpeed: 4,
                    maxSpeed: 10,
                    trail: []
                });
            }
        }

        function createPowerUpEffect(x, y) {
            for (let i = 0; i < 15; i++) {
                const angle = (Math.PI * 2 * i) / 15;
                const speed = 3 + Math.random() * 4;

                game.particles.push({
                    x: x,
                    y: y,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    size: 4 + Math.random() * 6,
                    color: `hsl(${Math.random() * 360}, 100%, 50%)`,
                    life: 30 + Math.random() * 20
                });
            }
        }

        function startGame() {
            game.gameRunning = true;
            gameLoop();
        }

        function update() {
            if (!game.gameRunning) return;

            // 파워업 시간 감소
            Object.values(game.paddles).forEach(paddle => {
                if (paddle.powerUp && paddle.powerUpTime > 0) {
                    paddle.powerUpTime--;

                    if (paddle.powerUpTime <= 0) {
                        // 파워업 해제
                        switch (paddle.powerUp) {
                            case 'big':
                                paddle.height = 100;
                                break;
                            case 'fast':
                                paddle.maxSpeed = 8;
                                break;
                        }
                        paddle.powerUp = null;
                    }
                }
            });

            // 프리즈 효과 감소
            if (game.freezeTime > 0) {
                game.freezeTime--;
            }

            // 공 업데이트
            game.balls.forEach((ball, ballIndex) => {
                // 프리즈 상태가 아닐 때만 공 이동
                if (game.freezeTime <= 0) {
                    ball.x += ball.vx;
                    ball.y += ball.vy;
                }

                // 공 트레일 추가
                ball.trail.push({ x: ball.x, y: ball.y, life: 10 });
                if (ball.trail.length > 15) {
                    ball.trail.shift();
                }

                // 상하 벽 충돌
                if (ball.y <= ball.radius || ball.y >= canvas.height - ball.radius) {
                    ball.vy = -ball.vy;
                    ball.y = Math.max(ball.radius, Math.min(canvas.height - ball.radius, ball.y));
                    createBounceEffect(ball.x, ball.y);
                }

                // 패들 충돌 검사
                Object.entries(game.paddles).forEach(([playerKey, paddle]) => {
                    if (paddle.connected &&
                        ball.x - ball.radius < paddle.x + paddle.width &&
                        ball.x + ball.radius > paddle.x &&
                        ball.y + ball.radius > paddle.y &&
                        ball.y - ball.radius < paddle.y + paddle.height) {

                        // 충돌 위치에 따른 반사각 계산
                        const hitPos = (ball.y - (paddle.y + paddle.height / 2)) / (paddle.height / 2);
                        const maxAngle = Math.PI / 3; // 60도

                        ball.vx = -ball.vx;
                        ball.vy = Math.sin(hitPos * maxAngle) * Math.abs(ball.vx);

                        // 속도 증가
                        const currentSpeed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
                        const newSpeed = Math.min(ball.maxSpeed, currentSpeed + 0.5);
                        const speedRatio = newSpeed / currentSpeed;

                        ball.vx *= speedRatio;
                        ball.vy *= speedRatio;

                        // 공 위치 조정
                        if (playerKey === 'player1') {
                            ball.x = paddle.x + paddle.width + ball.radius;
                        } else {
                            ball.x = paddle.x - ball.radius;
                        }

                        createBounceEffect(ball.x, ball.y);
                    }
                });

                // 좌우 경계 (득점)
                if (ball.x < -ball.radius) {
                    game.scores.player2++;
                    game.lastScorer = 'player2';
                    resetBall(ball);
                    updateScoreDisplay();
                } else if (ball.x > canvas.width + ball.radius) {
                    game.scores.player1++;
                    game.lastScorer = 'player1';
                    resetBall(ball);
                    updateScoreDisplay();
                }

                // 멀티볼 모드에서 공 제거
                if (game.multiballActive && game.balls.length > 1 &&
                    (ball.x < -100 || ball.x > canvas.width + 100)) {
                    game.balls.splice(ballIndex, 1);
                    if (game.balls.length === 1) {
                        game.multiballActive = false;
                    }
                }
            });

            // 파티클 업데이트
            game.particles.forEach((particle, index) => {
                particle.x += particle.vx;
                particle.y += particle.vy;
                particle.life--;
                particle.size *= 0.98;

                if (particle.life <= 0) {
                    game.particles.splice(index, 1);
                }
            });

            // 승리 조건 확인
            if (game.scores.player1 >= game.winScore || game.scores.player2 >= game.winScore) {
                endGame();
            }

            // UI 업데이트
            const avgSpeed = game.balls.reduce((sum, ball) => {
                return sum + Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
            }, 0) / game.balls.length;

            document.getElementById('ballSpeed').textContent = avgSpeed.toFixed(1);
        }

        function resetBall(ball) {
            ball.x = canvas.width / 2;
            ball.y = canvas.height / 2;

            // 마지막 득점자의 반대편으로 공 발사
            const direction = game.lastScorer === 'player1' ? -1 : 1;
            const angle = (Math.random() - 0.5) * Math.PI / 3; // -30도 ~ 30도

            ball.vx = direction * ball.baseSpeed * Math.cos(angle);
            ball.vy = ball.baseSpeed * Math.sin(angle);

            ball.trail = [];
        }

        function createBounceEffect(x, y) {
            for (let i = 0; i < 8; i++) {
                const angle = (Math.PI * 2 * i) / 8;
                const speed = 2 + Math.random() * 3;

                game.particles.push({
                    x: x,
                    y: y,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    size: 3 + Math.random() * 4,
                    color: '#ffffff',
                    life: 15 + Math.random() * 10
                });
            }
        }

        function updateScoreDisplay() {
            document.getElementById('player1Score').textContent = game.scores.player1;
            document.getElementById('player2Score').textContent = game.scores.player2;
        }

        function render() {
            // 배경 그리기
            const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
            gradient.addColorStop(0, '#1e3c72');
            gradient.addColorStop(1, '#2a5298');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // 중앙선
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.lineWidth = 3;
            ctx.setLineDash([15, 15]);
            ctx.beginPath();
            ctx.moveTo(canvas.width / 2, 0);
            ctx.lineTo(canvas.width / 2, canvas.height);
            ctx.stroke();
            ctx.setLineDash([]);

            // 프리즈 효과
            if (game.freezeTime > 0) {
                ctx.fillStyle = 'rgba(173, 216, 230, 0.3)';
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                ctx.fillStyle = '#87CEEB';
                ctx.font = 'bold 24px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('FREEZE!', canvas.width / 2, 50);
            }

            // 패들 그리기
            Object.values(game.paddles).forEach(paddle => {
                if (!paddle.connected) return;

                // 파워업 글로우 효과
                if (paddle.powerUp) {
                    ctx.shadowColor = '#FFD700';
                    ctx.shadowBlur = 15;
                } else {
                    ctx.shadowBlur = 0;
                }

                ctx.fillStyle = paddle.color;
                ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);

                ctx.shadowBlur = 0;

                // 파워업 표시
                if (paddle.powerUp) {
                    ctx.fillStyle = '#FFD700';
                    ctx.font = 'bold 12px Arial';
                    ctx.textAlign = 'center';
                    ctx.fillText(
                        paddle.powerUp.toUpperCase(),
                        paddle.x + paddle.width / 2,
                        paddle.y - 10
                    );

                    // 파워업 시간 바
                    const timeRatio = paddle.powerUpTime / 300;
                    ctx.fillStyle = 'rgba(255, 215, 0, 0.7)';
                    ctx.fillRect(paddle.x, paddle.y - 5, paddle.width * timeRatio, 3);
                }
            });

            // 공 트레일 그리기
            game.balls.forEach(ball => {
                ball.trail.forEach((trail, index) => {
                    const alpha = (trail.life / 10) * 0.5;
                    ctx.globalAlpha = alpha;
                    ctx.fillStyle = '#ffffff';
                    ctx.beginPath();
                    ctx.arc(trail.x, trail.y, ball.radius * alpha, 0, Math.PI * 2);
                    ctx.fill();
                });
            });

            ctx.globalAlpha = 1;

            // 공 그리기
            game.balls.forEach(ball => {
                // 공 글로우 효과
                ctx.shadowColor = '#ffffff';
                ctx.shadowBlur = 10;

                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
                ctx.fill();

                ctx.shadowBlur = 0;

                // 공 내부 디테일
                ctx.fillStyle = '#f0f0f0';
                ctx.beginPath();
                ctx.arc(ball.x - 2, ball.y - 2, ball.radius * 0.6, 0, Math.PI * 2);
                ctx.fill();
            });

            // 파티클 그리기
            game.particles.forEach(particle => {
                ctx.globalAlpha = particle.life / 30;
                ctx.fillStyle = particle.color;
                ctx.beginPath();
                ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                ctx.fill();
            });

            ctx.globalAlpha = 1;

            // 점수 표시 (화면 중앙 상단)
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.font = 'bold 32px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(
                `${game.scores.player1} : ${game.scores.player2}`,
                canvas.width / 2,
                50
            );

            // 멀티볼 모드 표시
            if (game.multiballActive) {
                ctx.fillStyle = '#FFD700';
                ctx.font = 'bold 18px Arial';
                ctx.fillText('MULTIBALL!', canvas.width / 2, 80);
            }
        }

        function endGame() {
            game.gameRunning = false;
            const winner = game.scores.player1 >= game.winScore ? 'Player 1' : 'Player 2';

            setTimeout(() => {
                alert(`${winner} 승리! 최종 점수: ${game.scores.player1} - ${game.scores.player2}`);
                resetGame();
            }, 1000);
        }

        function resetGame() {
            game.scores = { player1: 0, player2: 0 };
            game.balls = [{
                x: canvas.width / 2,
                y: canvas.height / 2,
                vx: 5,
                vy: 3,
                radius: 8,
                baseSpeed: 5,
                maxSpeed: 12,
                trail: []
            }];
            game.multiballActive = false;
            game.freezeTime = 0;
            game.lastScorer = null;

            // 패들 리셋
            Object.values(game.paddles).forEach(paddle => {
                paddle.powerUp = null;
                paddle.powerUpTime = 0;
                paddle.height = 100;
                paddle.maxSpeed = 8;
            });

            updateScoreDisplay();
            document.getElementById('ballSpeed').textContent = '5.0';
        }

        function gameLoop() {
            if (game.gameRunning) {
                update();
                render();
                requestAnimationFrame(gameLoop);
            }
        }

        // QR 코드 라이브러리 로드
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js';
        document.head.appendChild(script);
    </script>
</body>
</html>
```

이상으로 나머지 듀얼 센서 게임 예제 2개를 작성했습니다. 각 예제의 특징:

7. **협력 탱크 게임**: AI 적과의 전투, 협력 공격 시스템
8. **듀얼 패들 게임**: 파워업 시스템, 물리 기반 공 반사

이제 멀티플레이어 게임 예제 10개를 작성하겠습니다.