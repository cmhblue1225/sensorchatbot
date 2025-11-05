# 🎮 멀티플레이어 게임 예제 (10개)

## 📋 목차
멀티플레이어 게임은 3-10명의 플레이어가 동시에 참여할 수 있는 게임입니다.

1. [배틀 로얄 게임](#예제-1-배틀-로얄-게임)
2. [좀비 서바이벌](#예제-2-좀비-서바이벌)
3. [킹 오브 더 힐](#예제-3-킹-오브-더-힐)
4. [스네이크 아레나](#예제-4-스네이크-아레나)
5. [색깔 전쟁](#예제-5-색깔-전쟁)

---

## 예제 1: 배틀 로얄 게임
```html
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>배틀 로얄 게임</title>
    <script src="/js/SessionSDK.js"></script>
    <style>
        #gameCanvas {
            border: 2px solid #333;
            background: radial-gradient(circle, #34495e, #2c3e50);
        }
        .game-info {
            display: flex;
            justify-content: space-around;
            margin: 10px 0;
            font-weight: bold;
            flex-wrap: wrap;
        }
        .player-list {
            background: #ecf0f1;
            padding: 10px;
            border-radius: 8px;
            margin: 5px;
            min-width: 200px;
        }
        .zone-timer {
            background: #e74c3c;
            color: white;
            padding: 10px;
            border-radius: 8px;
            text-align: center;
            margin: 5px;
        }
    </style>
</head>
<body>
    <div id="sessionInfo"></div>
    <div class="game-info">
        <div class="player-list">
            <h4>생존자 (<span id="aliveCount">0</span>명)</h4>
            <div id="playerList"></div>
        </div>
        <div class="zone-timer">
            <div>⚠️ 존 축소까지</div>
            <div><span id="zoneTimer">30</span>초</div>
            <div>존 크기: <span id="zoneSize">100</span>%</div>
        </div>
    </div>
    <canvas id="gameCanvas" width="700" height="700"></canvas>

    <script>
        const canvas = document.getElementById('gameCanvas');
        const ctx = canvas.getContext('2d');

        const game = {
            players: new Map(),
            maxPlayers: 8,
            zone: {
                centerX: canvas.width / 2,
                centerY: canvas.height / 2,
                radius: canvas.width / 2,
                targetRadius: canvas.width / 2,
                shrinkSpeed: 1,
                damagePerSecond: 5,
                shrinkTimer: 30,
                maxShrinkTimer: 30
            },
            weapons: [],
            medkits: [],
            bullets: [],
            explosions: [],
            gamePhase: 'waiting', // waiting, playing, finished
            gameRunning: false,
            lastPlayerId: 0,
            gameStartTimer: 10,
            minPlayersToStart: 3
        };

        // SessionSDK 초기화
        const sdk = new SessionSDK({
            gameId: 'battle-royale',
            gameType: 'multi'
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
                <div style="background: #34495e; color: #fff; padding: 15px; border-radius: 10px; margin-bottom: 10px;">
                    <h3>⚔️ 배틀 로얄 게임</h3>
                    <p><strong>세션 코드:</strong> ${session.sessionCode}</p>
                    <p><strong>목표:</strong> 마지막까지 살아남으세요! (최대 ${game.maxPlayers}명)</p>
                    <div id="qrcode"></div>
                </div>
            `;

            generateQRCode(session.qrCodeUrl);
            spawnItems();
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

            // 플레이어 식별 (간단한 해시 기반)
            const playerId = getPlayerId(data.sensorId, data.timestamp);

            if (!game.players.has(playerId) && game.players.size < game.maxPlayers) {
                spawnPlayer(playerId);
            }

            const player = game.players.get(playerId);
            if (!player || !player.alive) return;

            const { beta, gamma } = data.orientation;
            const acceleration = data.acceleration || {};

            // 플레이어 이동
            const sensitivity = 0.2;
            player.vx = gamma * sensitivity;
            player.vy = beta * sensitivity;

            player.x += player.vx;
            player.y += player.vy;

            // 화면 경계 제한
            player.x = Math.max(20, Math.min(canvas.width - 20, player.x));
            player.y = Math.max(20, Math.min(canvas.height - 20, player.y));

            // 발사 (흔들기)
            const totalAccel = Math.sqrt(
                (acceleration.x || 0) ** 2 +
                (acceleration.y || 0) ** 2 +
                (acceleration.z || 0) ** 2
            );

            if (totalAccel > 20 && player.weapon && player.ammo > 0 &&
                Date.now() - player.lastShot > player.weapon.fireRate) {
                shoot(player);
            }

            // 아이템 수집
            collectItems(player);

            // 존 밖 데미지
            const distanceFromCenter = Math.sqrt(
                Math.pow(player.x - game.zone.centerX, 2) +
                Math.pow(player.y - game.zone.centerY, 2)
            );

            if (distanceFromCenter > game.zone.radius) {
                player.hp -= game.zone.damagePerSecond / 60; // 초당 데미지를 프레임당으로 변환
                if (player.hp <= 0) {
                    eliminatePlayer(playerId);
                }
            }

            player.lastUpdate = Date.now();
        }

        function getPlayerId(sensorId, timestamp) {
            // 간단한 플레이어 식별 시스템
            return sensorId + '_' + Math.floor(timestamp / 10000);
        }

        function spawnPlayer(playerId) {
            // 안전한 스폰 위치 찾기
            let spawnX, spawnY;
            let attempts = 0;

            do {
                spawnX = 50 + Math.random() * (canvas.width - 100);
                spawnY = 50 + Math.random() * (canvas.height - 100);
                attempts++;
            } while (attempts < 10 && !isValidSpawnLocation(spawnX, spawnY));

            const colors = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c', '#e67e22', '#34495e'];
            const playerColor = colors[game.players.size % colors.length];

            game.players.set(playerId, {
                id: playerId,
                x: spawnX,
                y: spawnY,
                vx: 0,
                vy: 0,
                hp: 100,
                maxHP: 100,
                armor: 0,
                weapon: null,
                ammo: 0,
                radius: 15,
                color: playerColor,
                alive: true,
                kills: 0,
                lastShot: 0,
                lastUpdate: Date.now(),
                invulnerable: 60 // 1초 무적
            });

            updatePlayerList();
        }

        function isValidSpawnLocation(x, y) {
            // 다른 플레이어와 거리 확인
            for (let [id, player] of game.players) {
                const distance = Math.sqrt(Math.pow(x - player.x, 2) + Math.pow(y - player.y, 2));
                if (distance < 50) return false;
            }
            return true;
        }

        function eliminatePlayer(playerId) {
            const player = game.players.get(playerId);
            if (player) {
                player.alive = false;
                createExplosion(player.x, player.y, 'large');

                // 아이템 드롭
                if (player.weapon) {
                    game.weapons.push({
                        x: player.x,
                        y: player.y,
                        type: player.weapon.type,
                        ammo: player.ammo
                    });
                }

                updatePlayerList();
                checkGameEnd();
            }
        }

        function shoot(player) {
            player.ammo--;
            player.lastShot = Date.now();

            // 가장 가까운 적을 향해 발사
            let target = findNearestEnemy(player);
            let angle = 0;

            if (target) {
                angle = Math.atan2(target.y - player.y, target.x - player.x);
            } else {
                angle = Math.random() * Math.PI * 2; // 랜덤 방향
            }

            const bulletSpeed = player.weapon.bulletSpeed;
            const bulletX = player.x + Math.cos(angle) * (player.radius + 5);
            const bulletY = player.y + Math.sin(angle) * (player.radius + 5);

            game.bullets.push({
                x: bulletX,
                y: bulletY,
                vx: Math.cos(angle) * bulletSpeed,
                vy: Math.sin(angle) * bulletSpeed,
                damage: player.weapon.damage,
                owner: player.id,
                life: 180
            });
        }

        function findNearestEnemy(player) {
            let nearest = null;
            let nearestDistance = Infinity;

            for (let [id, other] of game.players) {
                if (id !== player.id && other.alive) {
                    const distance = Math.sqrt(
                        Math.pow(other.x - player.x, 2) +
                        Math.pow(other.y - player.y, 2)
                    );

                    if (distance < nearestDistance && distance < 150) { // 사거리 제한
                        nearestDistance = distance;
                        nearest = other;
                    }
                }
            }

            return nearest;
        }

        function collectItems(player) {
            // 무기 수집
            game.weapons.forEach((weapon, index) => {
                const distance = Math.sqrt(
                    Math.pow(weapon.x - player.x, 2) +
                    Math.pow(weapon.y - player.y, 2)
                );

                if (distance < 25) {
                    player.weapon = getWeaponStats(weapon.type);
                    player.ammo = weapon.ammo;
                    game.weapons.splice(index, 1);
                }
            });

            // 메드킷 수집
            game.medkits.forEach((medkit, index) => {
                const distance = Math.sqrt(
                    Math.pow(medkit.x - player.x, 2) +
                    Math.pow(medkit.y - player.y, 2)
                );

                if (distance < 25 && player.hp < player.maxHP) {
                    player.hp = Math.min(player.maxHP, player.hp + medkit.healAmount);
                    game.medkits.splice(index, 1);
                }
            });
        }

        function getWeaponStats(type) {
            const weapons = {
                'rifle': { damage: 30, fireRate: 300, bulletSpeed: 12, type: 'rifle' },
                'shotgun': { damage: 60, fireRate: 800, bulletSpeed: 8, type: 'shotgun' },
                'pistol': { damage: 20, fireRate: 200, bulletSpeed: 10, type: 'pistol' },
                'sniper': { damage: 80, fireRate: 1500, bulletSpeed: 15, type: 'sniper' }
            };

            return weapons[type] || weapons['pistol'];
        }

        function spawnItems() {
            // 무기 스폰
            for (let i = 0; i < 12; i++) {
                const weaponTypes = ['rifle', 'shotgun', 'pistol', 'sniper'];
                const randomType = weaponTypes[Math.floor(Math.random() * weaponTypes.length)];

                game.weapons.push({
                    x: 50 + Math.random() * (canvas.width - 100),
                    y: 50 + Math.random() * (canvas.height - 100),
                    type: randomType,
                    ammo: 30 + Math.random() * 20
                });
            }

            // 메드킷 스폰
            for (let i = 0; i < 8; i++) {
                game.medkits.push({
                    x: 50 + Math.random() * (canvas.width - 100),
                    y: 50 + Math.random() * (canvas.height - 100),
                    healAmount: 25 + Math.random() * 25
                });
            }
        }

        function startGame() {
            game.gameRunning = true;
            gameLoop();
        }

        function update() {
            if (!game.gameRunning) return;

            // 게임 시작 대기
            if (game.gamePhase === 'waiting') {
                const alivePlayers = Array.from(game.players.values()).filter(p => p.alive).length;

                if (alivePlayers >= game.minPlayersToStart) {
                    game.gameStartTimer--;
                    if (game.gameStartTimer <= 0) {
                        game.gamePhase = 'playing';
                    }
                } else {
                    game.gameStartTimer = 10; // 리셋
                }
            }

            if (game.gamePhase !== 'playing') return;

            // 존 축소
            game.zone.shrinkTimer--;
            if (game.zone.shrinkTimer <= 0) {
                game.zone.targetRadius = Math.max(50, game.zone.targetRadius * 0.8);
                game.zone.shrinkTimer = game.zone.maxShrinkTimer;
            }

            // 존 크기 조정
            if (game.zone.radius > game.zone.targetRadius) {
                game.zone.radius = Math.max(game.zone.targetRadius, game.zone.radius - game.zone.shrinkSpeed);
            }

            // 비활성 플레이어 제거 (5초 비활성)
            const currentTime = Date.now();
            for (let [id, player] of game.players) {
                if (player.alive && currentTime - player.lastUpdate > 5000) {
                    eliminatePlayer(id);
                }

                // 무적 시간 감소
                if (player.invulnerable > 0) {
                    player.invulnerable--;
                }
            }

            // 총알 업데이트
            game.bullets.forEach((bullet, bulletIndex) => {
                bullet.x += bullet.vx;
                bullet.y += bullet.vy;
                bullet.life--;

                if (bullet.life <= 0 || bullet.x < 0 || bullet.x > canvas.width ||
                    bullet.y < 0 || bullet.y > canvas.height) {
                    game.bullets.splice(bulletIndex, 1);
                    return;
                }

                // 플레이어 충돌
                for (let [id, player] of game.players) {
                    if (id !== bullet.owner && player.alive && player.invulnerable <= 0) {
                        const distance = Math.sqrt(
                            Math.pow(bullet.x - player.x, 2) +
                            Math.pow(bullet.y - player.y, 2)
                        );

                        if (distance < player.radius) {
                            player.hp -= bullet.damage;
                            game.bullets.splice(bulletIndex, 1);
                            createExplosion(bullet.x, bullet.y, 'small');

                            if (player.hp <= 0) {
                                const shooter = game.players.get(bullet.owner);
                                if (shooter) shooter.kills++;
                                eliminatePlayer(id);
                            }
                            return;
                        }
                    }
                }
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

        function createExplosion(x, y, size) {
            const explosionSize = size === 'small' ? 15 : size === 'medium' ? 30 : 50;

            game.explosions.push({
                x: x,
                y: y,
                size: 0,
                maxSize: explosionSize,
                growth: explosionSize / 15,
                life: 15,
                color: '#ff6b6b'
            });
        }

        function checkGameEnd() {
            const alivePlayers = Array.from(game.players.values()).filter(p => p.alive);

            if (alivePlayers.length <= 1) {
                game.gamePhase = 'finished';

                setTimeout(() => {
                    if (alivePlayers.length === 1) {
                        alert(`🏆 ${alivePlayers[0].id} 승리! 킬 수: ${alivePlayers[0].kills}`);
                    } else {
                        alert('무승부!');
                    }
                    resetGame();
                }, 2000);
            }
        }

        function updateUI() {
            const aliveCount = Array.from(game.players.values()).filter(p => p.alive).length;
            document.getElementById('aliveCount').textContent = aliveCount;
            document.getElementById('zoneTimer').textContent = Math.max(0, Math.ceil(game.zone.shrinkTimer / 60));
            document.getElementById('zoneSize').textContent = Math.floor((game.zone.radius / (canvas.width / 2)) * 100);
        }

        function updatePlayerList() {
            const playerListElement = document.getElementById('playerList');
            const alivePlayers = Array.from(game.players.values()).filter(p => p.alive);

            playerListElement.innerHTML = alivePlayers.map(player =>
                `<div style="color: ${player.color}; font-size: 12px;">
                    ${player.id.substring(0, 8)}... (HP: ${Math.floor(player.hp)}, 킬: ${player.kills})
                </div>`
            ).join('');
        }

        function render() {
            // 배경 지우기
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // 배경 그리드
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.lineWidth = 1;
            for (let x = 0; x < canvas.width; x += 50) {
                ctx.beginPath();
                ctx.moveTo(x, 0);
                ctx.lineTo(x, canvas.height);
                ctx.stroke();
            }
            for (let y = 0; y < canvas.height; y += 50) {
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(canvas.width, y);
                ctx.stroke();
            }

            // 존 그리기
            ctx.strokeStyle = '#e74c3c';
            ctx.lineWidth = 5;
            ctx.setLineDash([10, 10]);
            ctx.beginPath();
            ctx.arc(game.zone.centerX, game.zone.centerY, game.zone.radius, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);

            // 존 밖 영역 어둡게
            ctx.save();
            ctx.globalCompositeOperation = 'source-over';
            ctx.fillStyle = 'rgba(231, 76, 60, 0.3)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.globalCompositeOperation = 'destination-out';
            ctx.beginPath();
            ctx.arc(game.zone.centerX, game.zone.centerY, game.zone.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();

            // 아이템 그리기
            game.weapons.forEach(weapon => {
                ctx.fillStyle = '#f39c12';
                ctx.fillRect(weapon.x - 8, weapon.y - 8, 16, 16);

                ctx.fillStyle = '#333';
                ctx.font = '10px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(weapon.type[0].toUpperCase(), weapon.x, weapon.y + 3);
            });

            game.medkits.forEach(medkit => {
                ctx.fillStyle = '#e74c3c';
                ctx.fillRect(medkit.x - 6, medkit.y - 6, 12, 12);

                ctx.fillStyle = '#fff';
                ctx.font = 'bold 8px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('+', medkit.x, medkit.y + 2);
            });

            // 플레이어 그리기
            for (let [id, player] of game.players) {
                if (!player.alive) continue;

                // 무적 시간 깜빡임 효과
                if (player.invulnerable > 0 && Math.floor(Date.now() / 100) % 2) {
                    ctx.globalAlpha = 0.5;
                }

                ctx.fillStyle = player.color;
                ctx.beginPath();
                ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
                ctx.fill();

                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 2;
                ctx.stroke();

                ctx.globalAlpha = 1;

                // HP 바
                const hpBarWidth = 30;
                const hpBarHeight = 4;
                const hpRatio = player.hp / player.maxHP;

                ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
                ctx.fillRect(player.x - hpBarWidth / 2, player.y - player.radius - 10, hpBarWidth, hpBarHeight);

                ctx.fillStyle = hpRatio > 0.5 ? '#2ecc71' : hpRatio > 0.25 ? '#f39c12' : '#e74c3c';
                ctx.fillRect(player.x - hpBarWidth / 2, player.y - player.radius - 10, hpBarWidth * hpRatio, hpBarHeight);

                // 무기 표시
                if (player.weapon) {
                    ctx.fillStyle = '#333';
                    ctx.font = '8px Arial';
                    ctx.textAlign = 'center';
                    ctx.fillText(`${player.weapon.type} (${player.ammo})`, player.x, player.y + player.radius + 15);
                }
            }

            // 총알 그리기
            game.bullets.forEach(bullet => {
                ctx.fillStyle = '#f1c40f';
                ctx.beginPath();
                ctx.arc(bullet.x, bullet.y, 2, 0, Math.PI * 2);
                ctx.fill();
            });

            // 폭발 그리기
            game.explosions.forEach(explosion => {
                const alpha = explosion.life / 15;
                ctx.globalAlpha = alpha;

                ctx.fillStyle = explosion.color;
                ctx.beginPath();
                ctx.arc(explosion.x, explosion.y, explosion.size, 0, Math.PI * 2);
                ctx.fill();
            });

            ctx.globalAlpha = 1;

            // 게임 상태 메시지
            if (game.gamePhase === 'waiting') {
                ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                ctx.fillStyle = '#fff';
                ctx.font = 'bold 24px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('게임 시작 대기중...', canvas.width / 2, canvas.height / 2 - 20);

                const alivePlayers = Array.from(game.players.values()).filter(p => p.alive).length;
                ctx.font = '16px Arial';
                ctx.fillText(`플레이어: ${alivePlayers}/${game.minPlayersToStart} (시작까지 ${Math.ceil(game.gameStartTimer / 60)}초)`,
                           canvas.width / 2, canvas.height / 2 + 20);
            }

            if (game.gamePhase === 'finished') {
                ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                ctx.fillStyle = '#f1c40f';
                ctx.font = 'bold 32px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('게임 종료!', canvas.width / 2, canvas.height / 2);
            }
        }

        function resetGame() {
            game.players.clear();
            game.bullets = [];
            game.explosions = [];
            game.weapons = [];
            game.medkits = [];
            game.gamePhase = 'waiting';
            game.gameStartTimer = 10;
            game.zone.radius = canvas.width / 2;
            game.zone.targetRadius = canvas.width / 2;
            game.zone.shrinkTimer = 30;

            spawnItems();
            updatePlayerList();
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

## 예제 2: 좀비 서바이벌
```html
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>좀비 서바이벌</title>
    <script src="/js/SessionSDK.js"></script>
    <style>
        #gameCanvas {
            border: 2px solid #333;
            background: linear-gradient(180deg, #1a1a1a 0%, #2d2d2d 100%);
        }
        .survival-stats {
            display: flex;
            justify-content: space-around;
            margin: 10px 0;
            font-weight: bold;
            flex-wrap: wrap;
        }
        .stat-box {
            background: #2c3e50;
            color: white;
            padding: 8px;
            border-radius: 8px;
            margin: 2px;
            min-width: 100px;
            text-align: center;
        }
        .wave-info {
            background: #e74c3c;
            color: white;
            padding: 10px;
            border-radius: 8px;
            text-align: center;
            margin: 5px;
        }
    </style>
</head>
<body>
    <div id="sessionInfo"></div>
    <div class="survival-stats">
        <div class="stat-box">
            생존자: <span id="survivorCount">0</span>명
        </div>
        <div class="wave-info">
            웨이브 <span id="waveNumber">1</span><br>
            좀비: <span id="zombieCount">0</span>마리
        </div>
        <div class="stat-box">
            시간: <span id="survivalTime">0</span>초
        </div>
        <div class="stat-box">
            전체 킬: <span id="totalKills">0</span>
        </div>
    </div>
    <canvas id="gameCanvas" width="800" height="600"></canvas>

    <script>
        const canvas = document.getElementById('gameCanvas');
        const ctx = canvas.getContext('2d');

        const game = {
            players: new Map(),
            zombies: [],
            bullets: [],
            weapons: [],
            barricades: [],
            explosions: [],
            wave: 1,
            survivalTime: 0,
            totalKills: 0,
            gameRunning: false,
            waveTimer: 0,
            spawnTimer: 0,
            maxPlayers: 6,
            zombiesPerWave: 5,
            gamePhase: 'waiting', // waiting, playing, ended
            startTimer: 8
        };

        // SessionSDK 초기화
        const sdk = new SessionSDK({
            gameId: 'zombie-survival',
            gameType: 'multi'
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
                <div style="background: #1a1a1a; color: #fff; padding: 15px; border-radius: 10px; margin-bottom: 10px;">
                    <h3>🧟 좀비 서바이벌</h3>
                    <p><strong>세션 코드:</strong> ${session.sessionCode}</p>
                    <p><strong>목표:</strong> 협력하여 좀비 웨이브를 막아내세요!</p>
                    <div id="qrcode"></div>
                </div>
            `;

            generateQRCode(session.qrCodeUrl);
            spawnWeapons();
            createBarricades();
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

            const playerId = getPlayerId(data.sensorId, data.timestamp);

            if (!game.players.has(playerId) && game.players.size < game.maxPlayers) {
                spawnPlayer(playerId);
            }

            const player = game.players.get(playerId);
            if (!player || !player.alive) return;

            const { beta, gamma } = data.orientation;
            const acceleration = data.acceleration || {};

            // 플레이어 이동
            const sensitivity = 0.25;
            player.vx = gamma * sensitivity;
            player.vy = beta * sensitivity;

            player.x += player.vx;
            player.y += player.vy;

            // 화면 경계 제한
            player.x = Math.max(player.radius, Math.min(canvas.width - player.radius, player.x));
            player.y = Math.max(player.radius, Math.min(canvas.height - player.radius, player.y));

            // 발사
            const totalAccel = Math.sqrt(
                (acceleration.x || 0) ** 2 +
                (acceleration.y || 0) ** 2 +
                (acceleration.z || 0) ** 2
            );

            if (totalAccel > 20 && player.weapon && player.ammo > 0 &&
                Date.now() - player.lastShot > player.weapon.fireRate) {
                shootAtNearestZombie(player);
            }

            // 아이템 수집
            collectWeapons(player);

            player.lastUpdate = Date.now();
        }

        function getPlayerId(sensorId, timestamp) {
            return sensorId + '_' + Math.floor(timestamp / 10000);
        }

        function spawnPlayer(playerId) {
            const colors = ['#3498db', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c'];
            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;
            const angle = (game.players.size / game.maxPlayers) * Math.PI * 2;
            const spawnRadius = 80;

            game.players.set(playerId, {
                id: playerId,
                x: centerX + Math.cos(angle) * spawnRadius,
                y: centerY + Math.sin(angle) * spawnRadius,
                vx: 0,
                vy: 0,
                hp: 100,
                maxHP: 100,
                radius: 15,
                color: colors[game.players.size % colors.length],
                alive: true,
                weapon: null,
                ammo: 0,
                kills: 0,
                lastShot: 0,
                lastUpdate: Date.now(),
                reloadTime: 0
            });

            updateSurvivorCount();
        }

        function shootAtNearestZombie(player) {
            const nearestZombie = findNearestZombie(player);
            if (!nearestZombie) return;

            const angle = Math.atan2(nearestZombie.y - player.y, nearestZombie.x - player.x);
            const bulletSpeed = player.weapon.bulletSpeed || 10;

            game.bullets.push({
                x: player.x + Math.cos(angle) * (player.radius + 5),
                y: player.y + Math.sin(angle) * (player.radius + 5),
                vx: Math.cos(angle) * bulletSpeed,
                vy: Math.sin(angle) * bulletSpeed,
                damage: player.weapon.damage,
                owner: player.id,
                life: 120
            });

            player.ammo--;
            player.lastShot = Date.now();

            if (player.ammo <= 0) {
                player.reloadTime = 120; // 2초 재장전
            }
        }

        function findNearestZombie(player) {
            let nearest = null;
            let nearestDistance = Infinity;

            game.zombies.forEach(zombie => {
                const distance = Math.sqrt(
                    Math.pow(zombie.x - player.x, 2) +
                    Math.pow(zombie.y - player.y, 2)
                );

                if (distance < nearestDistance && distance < 200) {
                    nearestDistance = distance;
                    nearest = zombie;
                }
            });

            return nearest;
        }

        function collectWeapons(player) {
            game.weapons.forEach((weapon, index) => {
                const distance = Math.sqrt(
                    Math.pow(weapon.x - player.x, 2) +
                    Math.pow(weapon.y - player.y, 2)
                );

                if (distance < 30) {
                    player.weapon = getWeaponStats(weapon.type);
                    player.ammo = weapon.ammo;
                    player.reloadTime = 0;
                    game.weapons.splice(index, 1);
                }
            });
        }

        function getWeaponStats(type) {
            const weapons = {
                'rifle': { damage: 40, fireRate: 250, bulletSpeed: 12, type: 'rifle' },
                'shotgun': { damage: 80, fireRate: 600, bulletSpeed: 8, type: 'shotgun' },
                'machinegun': { damage: 25, fireRate: 100, bulletSpeed: 15, type: 'machinegun' },
                'sniper': { damage: 120, fireRate: 1000, bulletSpeed: 20, type: 'sniper' }
            };

            return weapons[type] || weapons['rifle'];
        }

        function spawnWeapons() {
            const weaponTypes = ['rifle', 'shotgun', 'machinegun', 'sniper'];

            for (let i = 0; i < 8; i++) {
                const randomType = weaponTypes[Math.floor(Math.random() * weaponTypes.length)];

                game.weapons.push({
                    x: 100 + Math.random() * (canvas.width - 200),
                    y: 100 + Math.random() * (canvas.height - 200),
                    type: randomType,
                    ammo: 20 + Math.random() * 30
                });
            }
        }

        function createBarricades() {
            // 중앙 방어선 생성
            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;

            for (let i = 0; i < 6; i++) {
                const angle = (i / 6) * Math.PI * 2;
                const radius = 120;

                game.barricades.push({
                    x: centerX + Math.cos(angle) * radius - 15,
                    y: centerY + Math.sin(angle) * radius - 15,
                    width: 30,
                    height: 30,
                    hp: 200,
                    maxHP: 200
                });
            }
        }

        function spawnZombies() {
            const zombiesThisWave = game.zombiesPerWave + Math.floor(game.wave / 2);

            for (let i = 0; i < zombiesThisWave; i++) {
                setTimeout(() => {
                    spawnZombie();
                }, i * 800);
            }
        }

        function spawnZombie() {
            const spawnSides = [
                { x: -30, y: Math.random() * canvas.height },
                { x: canvas.width + 30, y: Math.random() * canvas.height },
                { x: Math.random() * canvas.width, y: -30 },
                { x: Math.random() * canvas.width, y: canvas.height + 30 }
            ];

            const spawn = spawnSides[Math.floor(Math.random() * spawnSides.length)];

            game.zombies.push({
                x: spawn.x,
                y: spawn.y,
                vx: 0,
                vy: 0,
                hp: 60 + game.wave * 10,
                maxHP: 60 + game.wave * 10,
                radius: 12,
                speed: 0.8 + game.wave * 0.1,
                color: '#8e44ad',
                target: null,
                attackCooldown: 0
            });

            updateZombieCount();
        }

        function startGame() {
            game.gameRunning = true;
            gameLoop();
        }

        function update() {
            if (!game.gameRunning) return;

            // 게임 시작 대기
            if (game.gamePhase === 'waiting') {
                const survivors = Array.from(game.players.values()).filter(p => p.alive).length;

                if (survivors >= 2) {
                    game.startTimer--;
                    if (game.startTimer <= 0) {
                        game.gamePhase = 'playing';
                        spawnZombies();
                    }
                } else {
                    game.startTimer = 8;
                }
                return;
            }

            if (game.gamePhase !== 'playing') return;

            // 서바이벌 시간 업데이트
            if (game.survivalTime % 60 === 0) {
                game.survivalTime++;
                updateSurvivalTime();
            }

            // 플레이어 재장전
            for (let [id, player] of game.players) {
                if (player.reloadTime > 0) {
                    player.reloadTime--;
                    if (player.reloadTime <= 0 && player.weapon) {
                        player.ammo = 20 + Math.random() * 10; // 재장전
                    }
                }

                // 비활성 플레이어 제거
                if (Date.now() - player.lastUpdate > 8000) {
                    eliminatePlayer(id);
                }
            }

            // 좀비 AI 업데이트
            game.zombies.forEach((zombie, zombieIndex) => {
                updateZombieAI(zombie);

                // 플레이어 공격
                if (zombie.attackCooldown > 0) {
                    zombie.attackCooldown--;
                }

                for (let [id, player] of game.players) {
                    if (!player.alive) continue;

                    const distance = Math.sqrt(
                        Math.pow(zombie.x - player.x, 2) +
                        Math.pow(zombie.y - player.y, 2)
                    );

                    if (distance < zombie.radius + player.radius && zombie.attackCooldown <= 0) {
                        player.hp -= 20;
                        zombie.attackCooldown = 60; // 1초 쿨다운

                        if (player.hp <= 0) {
                            eliminatePlayer(id);
                        }
                    }
                }

                // 바리케이드 공격
                game.barricades.forEach(barricade => {
                    if (zombie.x < barricade.x + barricade.width &&
                        zombie.x + zombie.radius * 2 > barricade.x &&
                        zombie.y < barricade.y + barricade.height &&
                        zombie.y + zombie.radius * 2 > barricade.y &&
                        zombie.attackCooldown <= 0) {

                        barricade.hp -= 10;
                        zombie.attackCooldown = 90;

                        if (barricade.hp <= 0) {
                            game.barricades.splice(game.barricades.indexOf(barricade), 1);
                        }
                    }
                });
            });

            // 총알 업데이트
            game.bullets.forEach((bullet, bulletIndex) => {
                bullet.x += bullet.vx;
                bullet.y += bullet.vy;
                bullet.life--;

                if (bullet.life <= 0 || bullet.x < 0 || bullet.x > canvas.width ||
                    bullet.y < 0 || bullet.y > canvas.height) {
                    game.bullets.splice(bulletIndex, 1);
                    return;
                }

                // 좀비 충돌
                game.zombies.forEach((zombie, zombieIndex) => {
                    const distance = Math.sqrt(
                        Math.pow(bullet.x - zombie.x, 2) +
                        Math.pow(bullet.y - zombie.y, 2)
                    );

                    if (distance < zombie.radius) {
                        zombie.hp -= bullet.damage;
                        game.bullets.splice(bulletIndex, 1);
                        createExplosion(bullet.x, bullet.y, 'small');

                        if (zombie.hp <= 0) {
                            game.zombies.splice(zombieIndex, 1);
                            game.totalKills++;

                            const shooter = game.players.get(bullet.owner);
                            if (shooter) shooter.kills++;

                            createExplosion(zombie.x, zombie.y, 'medium');
                            updateZombieCount();
                            updateTotalKills();
                        }
                        return;
                    }
                });
            });

            // 웨이브 체크
            if (game.zombies.length === 0) {
                game.wave++;
                updateWaveNumber();

                setTimeout(() => {
                    spawnZombies();
                    // 새 무기 스폰
                    if (game.wave % 3 === 0) {
                        spawnWeapons();
                    }
                }, 3000);
            }

            // 폭발 애니메이션 업데이트
            game.explosions.forEach((explosion, index) => {
                explosion.life--;
                explosion.size += explosion.growth;

                if (explosion.life <= 0) {
                    game.explosions.splice(index, 1);
                }
            });

            // 게임 오버 체크
            const survivors = Array.from(game.players.values()).filter(p => p.alive).length;
            if (survivors === 0) {
                endGame();
            }
        }

        function updateZombieAI(zombie) {
            // 가장 가까운 플레이어나 바리케이드 찾기
            let target = null;
            let nearestDistance = Infinity;

            // 플레이어 우선 타겟팅
            for (let [id, player] of game.players) {
                if (!player.alive) continue;

                const distance = Math.sqrt(
                    Math.pow(player.x - zombie.x, 2) +
                    Math.pow(player.y - zombie.y, 2)
                );

                if (distance < nearestDistance) {
                    nearestDistance = distance;
                    target = player;
                }
            }

            // 플레이어가 없으면 바리케이드 타겟팅
            if (!target) {
                game.barricades.forEach(barricade => {
                    const distance = Math.sqrt(
                        Math.pow(barricade.x + barricade.width / 2 - zombie.x, 2) +
                        Math.pow(barricade.y + barricade.height / 2 - zombie.y, 2)
                    );

                    if (distance < nearestDistance) {
                        nearestDistance = distance;
                        target = { x: barricade.x + barricade.width / 2, y: barricade.y + barricade.height / 2 };
                    }
                });
            }

            if (target) {
                const dx = target.x - zombie.x;
                const dy = target.y - zombie.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance > 0) {
                    zombie.vx = (dx / distance) * zombie.speed;
                    zombie.vy = (dy / distance) * zombie.speed;

                    zombie.x += zombie.vx;
                    zombie.y += zombie.vy;
                }
            }
        }

        function eliminatePlayer(playerId) {
            const player = game.players.get(playerId);
            if (player) {
                player.alive = false;
                createExplosion(player.x, player.y, 'large');
                updateSurvivorCount();
            }
        }

        function createExplosion(x, y, size) {
            const explosionSize = size === 'small' ? 15 : size === 'medium' ? 30 : 50;

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

        function endGame() {
            game.gamePhase = 'ended';
            game.gameRunning = false;

            setTimeout(() => {
                alert(`게임 오버! 웨이브 ${game.wave}, 생존 시간: ${game.survivalTime}초, 총 킬: ${game.totalKills}`);
                resetGame();
            }, 2000);
        }

        function updateSurvivorCount() {
            const survivors = Array.from(game.players.values()).filter(p => p.alive).length;
            document.getElementById('survivorCount').textContent = survivors;
        }

        function updateZombieCount() {
            document.getElementById('zombieCount').textContent = game.zombies.length;
        }

        function updateWaveNumber() {
            document.getElementById('waveNumber').textContent = game.wave;
        }

        function updateSurvivalTime() {
            document.getElementById('survivalTime').textContent = game.survivalTime;
        }

        function updateTotalKills() {
            document.getElementById('totalKills').textContent = game.totalKills;
        }

        function render() {
            // 배경 지우기
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // 어두운 배경
            ctx.fillStyle = '#1a1a1a';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // 바리케이드 그리기
            game.barricades.forEach(barricade => {
                const hpRatio = barricade.hp / barricade.maxHP;
                ctx.fillStyle = hpRatio > 0.5 ? '#8b4513' : hpRatio > 0.25 ? '#cd853f' : '#a0522d';
                ctx.fillRect(barricade.x, barricade.y, barricade.width, barricade.height);

                ctx.strokeStyle = '#654321';
                ctx.lineWidth = 2;
                ctx.strokeRect(barricade.x, barricade.y, barricade.width, barricade.height);

                // HP 바
                ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
                ctx.fillRect(barricade.x, barricade.y - 8, barricade.width, 4);

                ctx.fillStyle = hpRatio > 0.5 ? '#2ecc71' : hpRatio > 0.25 ? '#f39c12' : '#e74c3c';
                ctx.fillRect(barricade.x, barricade.y - 8, barricade.width * hpRatio, 4);
            });

            // 무기 그리기
            game.weapons.forEach(weapon => {
                ctx.fillStyle = '#f39c12';
                ctx.fillRect(weapon.x - 10, weapon.y - 5, 20, 10);

                ctx.fillStyle = '#333';
                ctx.font = '8px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(weapon.type.substring(0, 3).toUpperCase(), weapon.x, weapon.y + 2);
            });

            // 플레이어 그리기
            for (let [id, player] of game.players) {
                if (!player.alive) continue;

                ctx.fillStyle = player.color;
                ctx.beginPath();
                ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
                ctx.fill();

                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 2;
                ctx.stroke();

                // HP 바
                const hpBarWidth = 30;
                const hpBarHeight = 4;
                const hpRatio = player.hp / player.maxHP;

                ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
                ctx.fillRect(player.x - hpBarWidth / 2, player.y - player.radius - 10, hpBarWidth, hpBarHeight);

                ctx.fillStyle = hpRatio > 0.5 ? '#2ecc71' : hpRatio > 0.25 ? '#f39c12' : '#e74c3c';
                ctx.fillRect(player.x - hpBarWidth / 2, player.y - player.radius - 10, hpBarWidth * hpRatio, hpBarHeight);

                // 무기 및 탄약 표시
                if (player.weapon) {
                    ctx.fillStyle = '#fff';
                    ctx.font = '8px Arial';
                    ctx.textAlign = 'center';

                    if (player.reloadTime > 0) {
                        ctx.fillText('재장전중...', player.x, player.y + player.radius + 15);
                    } else {
                        ctx.fillText(`${player.weapon.type} (${player.ammo})`, player.x, player.y + player.radius + 15);
                    }
                }

                // 킬 수 표시
                ctx.fillStyle = '#f1c40f';
                ctx.font = 'bold 10px Arial';
                ctx.fillText(`${player.kills}`, player.x + player.radius + 5, player.y - 5);
            }

            // 좀비 그리기
            game.zombies.forEach(zombie => {
                ctx.fillStyle = zombie.color;
                ctx.beginPath();
                ctx.arc(zombie.x, zombie.y, zombie.radius, 0, Math.PI * 2);
                ctx.fill();

                ctx.strokeStyle = '#5b2c6f';
                ctx.lineWidth = 2;
                ctx.stroke();

                // 좀비 HP 바
                const hpBarWidth = 20;
                const hpBarHeight = 3;
                const hpRatio = zombie.hp / zombie.maxHP;

                ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
                ctx.fillRect(zombie.x - hpBarWidth / 2, zombie.y - zombie.radius - 8, hpBarWidth, hpBarHeight);

                ctx.fillStyle = '#e74c3c';
                ctx.fillRect(zombie.x - hpBarWidth / 2, zombie.y - zombie.radius - 8, hpBarWidth * hpRatio, hpBarHeight);
            });

            // 총알 그리기
            game.bullets.forEach(bullet => {
                ctx.fillStyle = '#f1c40f';
                ctx.beginPath();
                ctx.arc(bullet.x, bullet.y, 2, 0, Math.PI * 2);
                ctx.fill();
            });

            // 폭발 그리기
            game.explosions.forEach(explosion => {
                const alpha = explosion.life / 20;
                ctx.globalAlpha = alpha;

                ctx.fillStyle = explosion.color;
                ctx.beginPath();
                ctx.arc(explosion.x, explosion.y, explosion.size, 0, Math.PI * 2);
                ctx.fill();
            });

            ctx.globalAlpha = 1;

            // 게임 상태 메시지
            if (game.gamePhase === 'waiting') {
                ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                ctx.fillStyle = '#fff';
                ctx.font = 'bold 24px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('좀비 서바이벌 준비중...', canvas.width / 2, canvas.height / 2 - 20);

                const survivors = Array.from(game.players.values()).filter(p => p.alive).length;
                ctx.font = '16px Arial';
                ctx.fillText(`플레이어: ${survivors}/2 (시작까지 ${Math.ceil(game.startTimer / 60)}초)`,
                           canvas.width / 2, canvas.height / 2 + 20);
            }

            if (game.gamePhase === 'ended') {
                ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                ctx.fillStyle = '#e74c3c';
                ctx.font = 'bold 32px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('전멸!', canvas.width / 2, canvas.height / 2);
            }
        }

        function resetGame() {
            game.players.clear();
            game.zombies = [];
            game.bullets = [];
            game.weapons = [];
            game.barricades = [];
            game.explosions = [];
            game.wave = 1;
            game.survivalTime = 0;
            game.totalKills = 0;
            game.gamePhase = 'waiting';
            game.startTimer = 8;

            spawnWeapons();
            createBarricades();

            updateSurvivorCount();
            updateZombieCount();
            updateWaveNumber();
            updateSurvivalTime();
            updateTotalKills();
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

## 예제 3: 킹 오브 더 힐
```html
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>킹 오브 더 힐</title>
    <script src="/js/SessionSDK.js"></script>
    <style>
        #gameCanvas {
            border: 2px solid #333;
            background: radial-gradient(circle, #8e44ad, #3498db);
        }
        .hill-status {
            display: flex;
            justify-content: space-around;
            margin: 10px 0;
            font-weight: bold;
        }
        .king-info {
            background: #f1c40f;
            color: #2c3e50;
            padding: 10px;
            border-radius: 8px;
            text-align: center;
            min-width: 150px;
        }
    </style>
</head>
<body>
    <div id="sessionInfo"></div>
    <div class="hill-status">
        <div style="background: #2c3e50; color: #fff; padding: 10px; border-radius: 8px;">
            플레이어: <span id="playerCount">0</span>명
        </div>
        <div class="king-info">
            👑 킹: <span id="currentKing">없음</span><br>
            지배 시간: <span id="kingTime">0</span>초
        </div>
        <div style="background: #e74c3c; color: #fff; padding: 10px; border-radius: 8px;">
            게임 시간: <span id="gameTime">60</span>초
        </div>
    </div>
    <canvas id="gameCanvas" width="600" height="600"></canvas>

    <script>
        const canvas = document.getElementById('gameCanvas');
        const ctx = canvas.getContext('2d');

        const game = {
            players: new Map(),
            hill: {
                x: canvas.width / 2,
                y: canvas.height / 2,
                radius: 80,
                color: '#f39c12'
            },
            currentKing: null,
            kingTime: 0,
            gameTime: 60,
            gameRunning: false,
            gamePhase: 'waiting',
            startTimer: 5,
            maxPlayers: 8,
            powerUps: [],
            particles: []
        };

        // SessionSDK 초기화
        const sdk = new SessionSDK({
            gameId: 'king-of-hill',
            gameType: 'multi'
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
                <div style="background: #8e44ad; color: #fff; padding: 15px; border-radius: 10px; margin-bottom: 10px;">
                    <h3>👑 킹 오브 더 힐</h3>
                    <p><strong>세션 코드:</strong> ${session.sessionCode}</p>
                    <p><strong>목표:</strong> 언덕을 가장 오래 지배하세요!</p>
                    <div id="qrcode"></div>
                </div>
            `;

            generateQRCode(session.qrCodeUrl);
            spawnPowerUps();
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

            const playerId = getPlayerId(data.sensorId, data.timestamp);

            if (!game.players.has(playerId) && game.players.size < game.maxPlayers) {
                spawnPlayer(playerId);
            }

            const player = game.players.get(playerId);
            if (!player) return;

            const { beta, gamma } = data.orientation;
            const acceleration = data.acceleration || {};

            // 플레이어 이동
            const sensitivity = 0.3;
            player.vx = gamma * sensitivity;
            player.vy = beta * sensitivity;

            player.x += player.vx;
            player.y += player.vy;

            // 화면 경계 제한
            player.x = Math.max(player.radius, Math.min(canvas.width - player.radius, player.x));
            player.y = Math.max(player.radius, Math.min(canvas.height - player.radius, player.y));

            // 푸시 공격 (흔들기)
            const totalAccel = Math.sqrt(
                (acceleration.x || 0) ** 2 +
                (acceleration.y || 0) ** 2 +
                (acceleration.z || 0) ** 2
            );

            if (totalAccel > 25 && Date.now() - player.lastPush > 1000) {
                pushNearbyPlayers(player);
                player.lastPush = Date.now();
            }

            // 언덕 점령 확인
            const distanceFromHill = Math.sqrt(
                Math.pow(player.x - game.hill.x, 2) +
                Math.pow(player.y - game.hill.y, 2)
            );

            player.onHill = distanceFromHill <= game.hill.radius;

            // 파워업 수집
            collectPowerUps(player);

            player.lastUpdate = Date.now();
        }

        function getPlayerId(sensorId, timestamp) {
            return sensorId + '_' + Math.floor(timestamp / 10000);
        }

        function spawnPlayer(playerId) {
            const colors = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c', '#e67e22', '#34495e'];

            // 언덕 밖에서 스폰
            const angle = Math.random() * Math.PI * 2;
            const distance = game.hill.radius + 50 + Math.random() * 100;
            const spawnX = game.hill.x + Math.cos(angle) * distance;
            const spawnY = game.hill.y + Math.sin(angle) * distance;

            game.players.set(playerId, {
                id: playerId,
                x: Math.max(20, Math.min(canvas.width - 20, spawnX)),
                y: Math.max(20, Math.min(canvas.height - 20, spawnY)),
                vx: 0,
                vy: 0,
                radius: 15,
                color: colors[game.players.size % colors.length],
                onHill: false,
                hillTime: 0,
                lastPush: 0,
                pushPower: 5,
                lastUpdate: Date.now(),
                stunTime: 0
            });

            updatePlayerCount();
        }

        function pushNearbyPlayers(pusher) {
            for (let [id, player] of game.players) {
                if (id === pusher.id || player.stunTime > 0) continue;

                const distance = Math.sqrt(
                    Math.pow(player.x - pusher.x, 2) +
                    Math.pow(player.y - pusher.y, 2)
                );

                if (distance < 50) {
                    const angle = Math.atan2(player.y - pusher.y, player.x - pusher.x);
                    const pushForce = pusher.pushPower * (50 - distance) / 50;

                    player.x += Math.cos(angle) * pushForce * 3;
                    player.y += Math.sin(angle) * pushForce * 3;

                    // 화면 경계 제한
                    player.x = Math.max(player.radius, Math.min(canvas.width - player.radius, player.x));
                    player.y = Math.max(player.radius, Math.min(canvas.height - player.radius, player.y));

                    // 스턴 효과
                    player.stunTime = 30;

                    createPushEffect(player.x, player.y);
                }
            }

            createPushEffect(pusher.x, pusher.y);
        }

        function createPushEffect(x, y) {
            for (let i = 0; i < 8; i++) {
                const angle = (Math.PI * 2 * i) / 8;
                const speed = 3 + Math.random() * 4;

                game.particles.push({
                    x: x,
                    y: y,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    size: 4 + Math.random() * 4,
                    color: '#fff',
                    life: 20 + Math.random() * 10
                });
            }
        }

        function collectPowerUps(player) {
            game.powerUps.forEach((powerUp, index) => {
                const distance = Math.sqrt(
                    Math.pow(powerUp.x - player.x, 2) +
                    Math.pow(powerUp.y - player.y, 2)
                );

                if (distance < 25) {
                    applyPowerUp(player, powerUp.type);
                    game.powerUps.splice(index, 1);
                }
            });
        }

        function applyPowerUp(player, type) {
            switch (type) {
                case 'speed':
                    // 속도 증가는 이미 센서 민감도로 구현됨
                    break;
                case 'push':
                    player.pushPower = 10;
                    setTimeout(() => { player.pushPower = 5; }, 5000);
                    break;
                case 'shield':
                    player.stunTime = -300; // 5초 무적
                    break;
            }
        }

        function spawnPowerUps() {
            const powerUpTypes = ['speed', 'push', 'shield'];

            for (let i = 0; i < 6; i++) {
                setTimeout(() => {
                    if (game.powerUps.length < 3) {
                        let x, y;
                        do {
                            x = 50 + Math.random() * (canvas.width - 100);
                            y = 50 + Math.random() * (canvas.height - 100);
                        } while (Math.sqrt(Math.pow(x - game.hill.x, 2) + Math.pow(y - game.hill.y, 2)) < game.hill.radius + 30);

                        game.powerUps.push({
                            x: x,
                            y: y,
                            type: powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)],
                            pulse: 0
                        });
                    }
                }, i * 2000);
            }
        }

        function startGame() {
            game.gameRunning = true;
            gameLoop();
        }

        function update() {
            if (!game.gameRunning) return;

            // 게임 시작 대기
            if (game.gamePhase === 'waiting') {
                const playerCount = game.players.size;

                if (playerCount >= 3) {
                    game.startTimer--;
                    if (game.startTimer <= 0) {
                        game.gamePhase = 'playing';
                    }
                } else {
                    game.startTimer = 5;
                }
                return;
            }

            if (game.gamePhase !== 'playing') return;

            // 게임 시간 감소
            game.gameTime--;
            if (game.gameTime <= 0) {
                endGame();
                return;
            }

            // 언덕의 킹 결정
            const playersOnHill = Array.from(game.players.values()).filter(p => p.onHill);

            if (playersOnHill.length === 1) {
                const newKing = playersOnHill[0];
                if (game.currentKing !== newKing.id) {
                    game.currentKing = newKing.id;
                    document.getElementById('currentKing').textContent = newKing.id.substring(0, 8);
                }
                game.kingTime++;
                newKing.hillTime++;
            } else {
                game.currentKing = null;
                document.getElementById('currentKing').textContent = '경쟁중';
            }

            // 플레이어 업데이트
            for (let [id, player] of game.players) {
                // 스턴 시간 감소
                if (player.stunTime > 0) {
                    player.stunTime--;
                } else if (player.stunTime < 0) {
                    player.stunTime++;
                }

                // 비활성 플레이어 제거
                if (Date.now() - player.lastUpdate > 8000) {
                    game.players.delete(id);
                    updatePlayerCount();
                }
            }

            // 파워업 업데이트
            game.powerUps.forEach(powerUp => {
                powerUp.pulse += 0.1;
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

            updateUI();
        }

        function updateUI() {
            document.getElementById('kingTime').textContent = Math.floor(game.kingTime / 60);
            document.getElementById('gameTime').textContent = Math.floor(game.gameTime / 60);
        }

        function updatePlayerCount() {
            document.getElementById('playerCount').textContent = game.players.size;
        }

        function endGame() {
            game.gamePhase = 'ended';

            // 가장 오래 언덕을 지배한 플레이어 찾기
            let winner = null;
            let maxHillTime = 0;

            for (let [id, player] of game.players) {
                if (player.hillTime > maxHillTime) {
                    maxHillTime = player.hillTime;
                    winner = player;
                }
            }

            setTimeout(() => {
                if (winner) {
                    alert(`🏆 ${winner.id.substring(0, 8)} 승리! 언덕 지배 시간: ${Math.floor(maxHillTime / 60)}초`);
                } else {
                    alert('무승부!');
                }
                resetGame();
            }, 2000);
        }

        function resetGame() {
            game.players.clear();
            game.powerUps = [];
            game.particles = [];
            game.currentKing = null;
            game.kingTime = 0;
            game.gameTime = 60 * 60; // 60초
            game.gamePhase = 'waiting';
            game.startTimer = 5;

            spawnPowerUps();
            updatePlayerCount();
            updateUI();
        }

        function render() {
            // 배경 지우기
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // 배경 그라디언트
            const gradient = ctx.createRadialGradient(canvas.width/2, canvas.height/2, 0, canvas.width/2, canvas.height/2, 400);
            gradient.addColorStop(0, '#8e44ad');
            gradient.addColorStop(1, '#3498db');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // 언덕 그리기
            ctx.fillStyle = game.hill.color;
            ctx.beginPath();
            ctx.arc(game.hill.x, game.hill.y, game.hill.radius, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = '#d35400';
            ctx.lineWidth = 4;
            ctx.stroke();

            // 언덕 중앙 표시
            ctx.fillStyle = '#d35400';
            ctx.font = 'bold 20px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('👑', game.hill.x, game.hill.y + 7);

            // 파워업 그리기
            game.powerUps.forEach(powerUp => {
                const pulseSize = 1 + Math.sin(powerUp.pulse) * 0.2;

                ctx.save();
                ctx.translate(powerUp.x, powerUp.y);
                ctx.scale(pulseSize, pulseSize);

                const powerUpColors = {
                    'speed': '#3498db',
                    'push': '#e74c3c',
                    'shield': '#f1c40f'
                };

                ctx.fillStyle = powerUpColors[powerUp.type];
                ctx.fillRect(-12, -12, 24, 24);

                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 2;
                ctx.strokeRect(-12, -12, 24, 24);

                const powerUpIcons = {
                    'speed': '⚡',
                    'push': '💥',
                    'shield': '🛡️'
                };

                ctx.fillStyle = '#fff';
                ctx.font = '16px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(powerUpIcons[powerUp.type], 0, 6);

                ctx.restore();
            });

            // 플레이어 그리기
            for (let [id, player] of game.players) {
                // 스턴 효과
                if (player.stunTime > 0 && Math.floor(Date.now() / 100) % 2) {
                    ctx.globalAlpha = 0.5;
                } else if (player.stunTime < 0) {
                    // 무적 효과
                    ctx.shadowColor = '#f1c40f';
                    ctx.shadowBlur = 10;
                }

                ctx.fillStyle = player.color;
                ctx.beginPath();
                ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
                ctx.fill();

                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 2;
                ctx.stroke();

                ctx.globalAlpha = 1;
                ctx.shadowBlur = 0;

                // 언덕 위 표시
                if (player.onHill) {
                    ctx.strokeStyle = '#f1c40f';
                    ctx.lineWidth = 4;
                    ctx.setLineDash([5, 5]);
                    ctx.beginPath();
                    ctx.arc(player.x, player.y, player.radius + 5, 0, Math.PI * 2);
                    ctx.stroke();
                    ctx.setLineDash([]);
                }

                // 킹 표시
                if (game.currentKing === id) {
                    ctx.fillStyle = '#f1c40f';
                    ctx.font = 'bold 20px Arial';
                    ctx.textAlign = 'center';
                    ctx.fillText('👑', player.x, player.y - player.radius - 10);
                }

                // 언덕 지배 시간 표시
                if (player.hillTime > 0) {
                    ctx.fillStyle = '#2c3e50';
                    ctx.font = '10px Arial';
                    ctx.textAlign = 'center';
                    ctx.fillText(`${Math.floor(player.hillTime / 60)}s`, player.x, player.y + player.radius + 15);
                }
            }

            // 파티클 그리기
            game.particles.forEach(particle => {
                ctx.globalAlpha = particle.life / 30;
                ctx.fillStyle = particle.color;
                ctx.beginPath();
                ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                ctx.fill();
            });

            ctx.globalAlpha = 1;

            // 게임 상태 메시지
            if (game.gamePhase === 'waiting') {
                ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                ctx.fillStyle = '#fff';
                ctx.font = 'bold 24px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('킹 오브 더 힐 시작 준비...', canvas.width / 2, canvas.height / 2 - 20);

                ctx.font = '16px Arial';
                ctx.fillText(`플레이어: ${game.players.size}/3 (시작까지 ${Math.ceil(game.startTimer / 60)}초)`,
                           canvas.width / 2, canvas.height / 2 + 20);
            }

            if (game.gamePhase === 'ended') {
                ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                ctx.fillStyle = '#f1c40f';
                ctx.font = 'bold 32px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('게임 종료!', canvas.width / 2, canvas.height / 2);
            }
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

## 예제 4: 스네이크 아레나
```html
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>스네이크 아레나</title>
    <script src="/js/SessionSDK.js"></script>
    <style>
        #gameCanvas {
            border: 2px solid #333;
            background: #2c3e50;
        }
        .arena-stats {
            display: flex;
            justify-content: space-around;
            margin: 10px 0;
            font-weight: bold;
            flex-wrap: wrap;
        }
        .snake-info {
            background: #34495e;
            color: white;
            padding: 8px;
            border-radius: 8px;
            margin: 2px;
            min-width: 120px;
            text-align: center;
        }
    </style>
</head>
<body>
    <div id="sessionInfo"></div>
    <div class="arena-stats">
        <div class="snake-info">
            생존 뱀: <span id="aliveSnakes">0</span>마리
        </div>
        <div class="snake-info">
            게임 시간: <span id="gameTime">180</span>초
        </div>
        <div class="snake-info">
            음식: <span id="foodCount">0</span>개
        </div>
    </div>
    <canvas id="gameCanvas" width="700" height="500"></canvas>

    <script>
        const canvas = document.getElementById('gameCanvas');
        const ctx = canvas.getContext('2d');

        const GRID_SIZE = 20;
        const GRID_WIDTH = canvas.width / GRID_SIZE;
        const GRID_HEIGHT = canvas.height / GRID_SIZE;

        const game = {
            snakes: new Map(),
            foods: [],
            maxPlayers: 6,
            gameTime: 180 * 60, // 3분
            gameRunning: false,
            gamePhase: 'waiting',
            startTimer: 8,
            lastFoodSpawn: 0,
            powerUps: []
        };

        // SessionSDK 초기화
        const sdk = new SessionSDK({
            gameId: 'snake-arena',
            gameType: 'multi'
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
                    <h3>🐍 스네이크 아레나</h3>
                    <p><strong>세션 코드:</strong> ${session.sessionCode}</p>
                    <p><strong>목표:</strong> 가장 긴 뱀이 되어 살아남으세요!</p>
                    <div id="qrcode"></div>
                </div>
            `;

            generateQRCode(session.qrCodeUrl);
            spawnInitialFood();
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

            const playerId = getPlayerId(data.sensorId, data.timestamp);

            if (!game.snakes.has(playerId) && game.snakes.size < game.maxPlayers) {
                spawnSnake(playerId);
            }

            const snake = game.snakes.get(playerId);
            if (!snake || !snake.alive) return;

            const { beta, gamma } = data.orientation;

            // 방향 변경 (90도씩만 가능)
            const threshold = 25;

            if (Math.abs(gamma) > threshold || Math.abs(beta) > threshold) {
                let newDirection = snake.direction;

                if (Math.abs(gamma) > Math.abs(beta)) {
                    // 좌우 이동
                    newDirection = gamma > 0 ? 'right' : 'left';
                } else {
                    // 상하 이동
                    newDirection = beta > 0 ? 'down' : 'up';
                }

                // 반대 방향으로는 이동 불가
                const opposites = {
                    'up': 'down',
                    'down': 'up',
                    'left': 'right',
                    'right': 'left'
                };

                if (newDirection !== opposites[snake.direction]) {
                    snake.direction = newDirection;
                }
            }

            snake.lastUpdate = Date.now();
        }

        function getPlayerId(sensorId, timestamp) {
            return sensorId + '_' + Math.floor(timestamp / 10000);
        }

        function spawnSnake(playerId) {
            const colors = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c'];

            // 안전한 스폰 위치 찾기
            let spawnX, spawnY;
            let attempts = 0;

            do {
                spawnX = Math.floor(Math.random() * (GRID_WIDTH - 6)) + 3;
                spawnY = Math.floor(Math.random() * (GRID_HEIGHT - 6)) + 3;
                attempts++;
            } while (attempts < 20 && !isValidSpawnPosition(spawnX, spawnY));

            const snake = {
                id: playerId,
                body: [
                    { x: spawnX, y: spawnY },
                    { x: spawnX - 1, y: spawnY },
                    { x: spawnX - 2, y: spawnY }
                ],
                direction: 'right',
                color: colors[game.snakes.size % colors.length],
                alive: true,
                length: 3,
                lastMove: 0,
                moveInterval: 8, // 프레임 간격
                lastUpdate: Date.now(),
                powerUp: null,
                powerUpTime: 0
            };

            game.snakes.set(playerId, snake);
            updateAliveSnakes();
        }

        function isValidSpawnPosition(x, y) {
            // 다른 뱀과 겹치지 않는지 확인
            for (let [id, snake] of game.snakes) {
                for (let segment of snake.body) {
                    if (Math.abs(segment.x - x) < 5 && Math.abs(segment.y - y) < 5) {
                        return false;
                    }
                }
            }
            return true;
        }

        function spawnInitialFood() {
            for (let i = 0; i < 15; i++) {
                spawnFood();
            }
        }

        function spawnFood() {
            let x, y;
            let attempts = 0;

            do {
                x = Math.floor(Math.random() * GRID_WIDTH);
                y = Math.floor(Math.random() * GRID_HEIGHT);
                attempts++;
            } while (attempts < 50 && !isValidFoodPosition(x, y));

            if (attempts < 50) {
                game.foods.push({
                    x: x,
                    y: y,
                    type: Math.random() < 0.8 ? 'normal' : 'special',
                    value: Math.random() < 0.8 ? 1 : 3
                });

                updateFoodCount();
            }
        }

        function isValidFoodPosition(x, y) {
            // 뱀과 겹치지 않는지 확인
            for (let [id, snake] of game.snakes) {
                for (let segment of snake.body) {
                    if (segment.x === x && segment.y === y) {
                        return false;
                    }
                }
            }

            // 다른 음식과 겹치지 않는지 확인
            for (let food of game.foods) {
                if (food.x === x && food.y === y) {
                    return false;
                }
            }

            return true;
        }

        function startGame() {
            game.gameRunning = true;
            gameLoop();
        }

        function update() {
            if (!game.gameRunning) return;

            // 게임 시작 대기
            if (game.gamePhase === 'waiting') {
                const snakeCount = game.snakes.size;

                if (snakeCount >= 2) {
                    game.startTimer--;
                    if (game.startTimer <= 0) {
                        game.gamePhase = 'playing';
                    }
                } else {
                    game.startTimer = 8;
                }
                return;
            }

            if (game.gamePhase !== 'playing') return;

            // 게임 시간 감소
            game.gameTime--;
            if (game.gameTime <= 0) {
                endGame();
                return;
            }

            // 뱀 이동 및 업데이트
            for (let [id, snake] of game.snakes) {
                if (!snake.alive) continue;

                // 비활성 플레이어 제거
                if (Date.now() - snake.lastUpdate > 10000) {
                    eliminateSnake(id);
                    continue;
                }

                // 이동 시간 체크
                if (game.gameTime % snake.moveInterval === 0) {
                    moveSnake(snake);
                    checkCollisions(snake);
                    checkFoodCollision(snake);
                }

                // 파워업 시간 감소
                if (snake.powerUpTime > 0) {
                    snake.powerUpTime--;
                    if (snake.powerUpTime <= 0) {
                        snake.powerUp = null;
                        snake.moveInterval = 8; // 속도 리셋
                    }
                }
            }

            // 음식 스폰
            if (game.gameTime % 120 === 0 && game.foods.length < 20) {
                spawnFood();
            }

            // 생존 뱀 확인
            const aliveSnakes = Array.from(game.snakes.values()).filter(s => s.alive);
            if (aliveSnakes.length <= 1) {
                endGame();
            }

            updateUI();
        }

        function moveSnake(snake) {
            const head = { ...snake.body[0] };

            switch (snake.direction) {
                case 'up':
                    head.y--;
                    break;
                case 'down':
                    head.y++;
                    break;
                case 'left':
                    head.x--;
                    break;
                case 'right':
                    head.x++;
                    break;
            }

            // 벽 충돌 검사
            if (head.x < 0 || head.x >= GRID_WIDTH || head.y < 0 || head.y >= GRID_HEIGHT) {
                eliminateSnake(snake.id);
                return;
            }

            snake.body.unshift(head);

            // 꼬리 제거 (음식을 먹지 않았을 때)
            if (snake.body.length > snake.length) {
                snake.body.pop();
            }
        }

        function checkCollisions(snake) {
            const head = snake.body[0];

            // 자기 자신과 충돌
            for (let i = 1; i < snake.body.length; i++) {
                if (head.x === snake.body[i].x && head.y === snake.body[i].y) {
                    eliminateSnake(snake.id);
                    return;
                }
            }

            // 다른 뱀과 충돌
            for (let [otherId, otherSnake] of game.snakes) {
                if (otherId === snake.id || !otherSnake.alive) continue;

                for (let segment of otherSnake.body) {
                    if (head.x === segment.x && head.y === segment.y) {
                        eliminateSnake(snake.id);
                        return;
                    }
                }
            }
        }

        function checkFoodCollision(snake) {
            const head = snake.body[0];

            game.foods.forEach((food, index) => {
                if (head.x === food.x && head.y === food.y) {
                    // 음식 먹기
                    snake.length += food.value;

                    // 특별 음식 효과
                    if (food.type === 'special') {
                        snake.powerUp = 'speed';
                        snake.powerUpTime = 300; // 5초
                        snake.moveInterval = 4; // 빨라짐
                    }

                    game.foods.splice(index, 1);
                    updateFoodCount();

                    // 새 음식 스폰
                    setTimeout(() => spawnFood(), 100);
                }
            });
        }

        function eliminateSnake(snakeId) {
            const snake = game.snakes.get(snakeId);
            if (snake) {
                snake.alive = false;

                // 뱀이 있던 곳에 음식 스폰
                snake.body.forEach((segment, index) => {
                    if (index % 2 === 0 && isValidFoodPosition(segment.x, segment.y)) {
                        game.foods.push({
                            x: segment.x,
                            y: segment.y,
                            type: 'normal',
                            value: 1
                        });
                    }
                });

                updateAliveSnakes();
                updateFoodCount();
            }
        }

        function updateUI() {
            document.getElementById('gameTime').textContent = Math.floor(game.gameTime / 60);
        }

        function updateAliveSnakes() {
            const aliveCount = Array.from(game.snakes.values()).filter(s => s.alive).length;
            document.getElementById('aliveSnakes').textContent = aliveCount;
        }

        function updateFoodCount() {
            document.getElementById('foodCount').textContent = game.foods.length;
        }

        function endGame() {
            game.gamePhase = 'ended';

            // 가장 긴 뱀 찾기
            let winner = null;
            let maxLength = 0;

            for (let [id, snake] of game.snakes) {
                if (snake.alive && snake.length > maxLength) {
                    maxLength = snake.length;
                    winner = snake;
                }
            }

            setTimeout(() => {
                if (winner) {
                    alert(`🏆 ${winner.id.substring(0, 8)} 승리! 최종 길이: ${winner.length}`);
                } else {
                    alert('무승부!');
                }
                resetGame();
            }, 2000);
        }

        function resetGame() {
            game.snakes.clear();
            game.foods = [];
            game.gameTime = 180 * 60;
            game.gamePhase = 'waiting';
            game.startTimer = 8;

            spawnInitialFood();
            updateAliveSnakes();
            updateFoodCount();
            updateUI();
        }

        function render() {
            // 배경 지우기
            ctx.fillStyle = '#2c3e50';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // 그리드 그리기
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.lineWidth = 1;
            for (let x = 0; x <= canvas.width; x += GRID_SIZE) {
                ctx.beginPath();
                ctx.moveTo(x, 0);
                ctx.lineTo(x, canvas.height);
                ctx.stroke();
            }
            for (let y = 0; y <= canvas.height; y += GRID_SIZE) {
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(canvas.width, y);
                ctx.stroke();
            }

            // 음식 그리기
            game.foods.forEach(food => {
                const x = food.x * GRID_SIZE;
                const y = food.y * GRID_SIZE;

                if (food.type === 'special') {
                    ctx.fillStyle = '#f1c40f';
                    ctx.fillRect(x + 2, y + 2, GRID_SIZE - 4, GRID_SIZE - 4);

                    ctx.fillStyle = '#fff';
                    ctx.font = '12px Arial';
                    ctx.textAlign = 'center';
                    ctx.fillText('⭐', x + GRID_SIZE/2, y + GRID_SIZE/2 + 4);
                } else {
                    ctx.fillStyle = '#e74c3c';
                    ctx.beginPath();
                    ctx.arc(x + GRID_SIZE/2, y + GRID_SIZE/2, 6, 0, Math.PI * 2);
                    ctx.fill();
                }
            });

            // 뱀 그리기
            for (let [id, snake] of game.snakes) {
                if (!snake.alive) continue;

                snake.body.forEach((segment, index) => {
                    const x = segment.x * GRID_SIZE;
                    const y = segment.y * GRID_SIZE;

                    if (index === 0) {
                        // 머리
                        ctx.fillStyle = snake.color;
                        ctx.fillRect(x, y, GRID_SIZE, GRID_SIZE);

                        ctx.strokeStyle = '#fff';
                        ctx.lineWidth = 2;
                        ctx.strokeRect(x, y, GRID_SIZE, GRID_SIZE);

                        // 파워업 효과
                        if (snake.powerUp === 'speed') {
                            ctx.strokeStyle = '#f1c40f';
                            ctx.lineWidth = 4;
                            ctx.strokeRect(x - 2, y - 2, GRID_SIZE + 4, GRID_SIZE + 4);
                        }

                        // 방향 표시
                        ctx.fillStyle = '#fff';
                        ctx.font = '10px Arial';
                        ctx.textAlign = 'center';
                        const arrows = { 'up': '↑', 'down': '↓', 'left': '←', 'right': '→' };
                        ctx.fillText(arrows[snake.direction], x + GRID_SIZE/2, y + GRID_SIZE/2 + 3);
                    } else {
                        // 몸통
                        const alpha = 1 - (index / snake.body.length) * 0.5;
                        ctx.fillStyle = snake.color + Math.floor(alpha * 255).toString(16).padStart(2, '0');
                        ctx.fillRect(x + 1, y + 1, GRID_SIZE - 2, GRID_SIZE - 2);
                    }
                });

                // 길이 표시
                if (snake.body.length > 0) {
                    const head = snake.body[0];
                    const x = head.x * GRID_SIZE;
                    const y = head.y * GRID_SIZE;

                    ctx.fillStyle = '#fff';
                    ctx.font = 'bold 10px Arial';
                    ctx.textAlign = 'center';
                    ctx.fillText(snake.length.toString(), x + GRID_SIZE/2, y - 5);
                }
            }

            // 게임 상태 메시지
            if (game.gamePhase === 'waiting') {
                ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                ctx.fillStyle = '#fff';
                ctx.font = 'bold 24px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('스네이크 아레나 시작 준비...', canvas.width / 2, canvas.height / 2 - 20);

                ctx.font = '16px Arial';
                ctx.fillText(`뱀: ${game.snakes.size}/2 (시작까지 ${Math.ceil(game.startTimer / 60)}초)`,
                           canvas.width / 2, canvas.height / 2 + 20);
            }

            if (game.gamePhase === 'ended') {
                ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                ctx.fillStyle = '#2ecc71';
                ctx.font = 'bold 32px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('게임 종료!', canvas.width / 2, canvas.height / 2);
            }
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

## 예제 5: 색깔 전쟁
```html
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>색깔 전쟁</title>
    <script src="/js/SessionSDK.js"></script>
    <style>
        #gameCanvas {
            border: 2px solid #333;
            background: #34495e;
        }
        .color-war-stats {
            display: flex;
            justify-content: space-around;
            margin: 10px 0;
            font-weight: bold;
            flex-wrap: wrap;
        }
        .team-stats {
            padding: 8px;
            border-radius: 8px;
            margin: 2px;
            min-width: 100px;
            text-align: center;
            color: white;
        }
    </style>
</head>
<body>
    <div id="sessionInfo"></div>
    <div class="color-war-stats" id="teamStats"></div>
    <div style="text-align: center; margin: 10px 0; font-weight: bold;">
        남은 시간: <span id="timeLeft">120</span>초 |
        전체 영역: <span id="totalArea">0</span> |
        게임 진행도: <span id="gameProgress">0</span>%
    </div>
    <canvas id="gameCanvas" width="800" height="600"></canvas>

    <script>
        const canvas = document.getElementById('gameCanvas');
        const ctx = canvas.getContext('2d');

        const CELL_SIZE = 10;
        const GRID_WIDTH = canvas.width / CELL_SIZE;
        const GRID_HEIGHT = canvas.height / CELL_SIZE;

        const game = {
            players: new Map(),
            grid: [],
            teams: ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c'],
            maxPlayers: 6,
            timeLeft: 120 * 60, // 2분
            gameRunning: false,
            gamePhase: 'waiting',
            startTimer: 6,
            paintRate: 3, // 페인트 속도
            totalCells: GRID_WIDTH * GRID_HEIGHT
        };

        // 그리드 초기화
        for (let y = 0; y < GRID_HEIGHT; y++) {
            game.grid[y] = [];
            for (let x = 0; x < GRID_WIDTH; x++) {
                game.grid[y][x] = null; // 칠해지지 않음
            }
        }

        // SessionSDK 초기화
        const sdk = new SessionSDK({
            gameId: 'color-war',
            gameType: 'multi'
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
                <div style="background: #34495e; color: #fff; padding: 15px; border-radius: 10px; margin-bottom: 10px;">
                    <h3>🎨 색깔 전쟁</h3>
                    <p><strong>세션 코드:</strong> ${session.sessionCode}</p>
                    <p><strong>목표:</strong> 가장 많은 영역을 자신의 색으로 칠하세요!</p>
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

            const playerId = getPlayerId(data.sensorId, data.timestamp);

            if (!game.players.has(playerId) && game.players.size < game.maxPlayers) {
                spawnPlayer(playerId);
            }

            const player = game.players.get(playerId);
            if (!player) return;

            const { beta, gamma } = data.orientation;
            const acceleration = data.acceleration || {};

            // 플레이어 이동
            const sensitivity = 0.4;
            player.vx = gamma * sensitivity;
            player.vy = beta * sensitivity;

            player.x += player.vx;
            player.y += player.vy;

            // 화면 경계 제한
            player.x = Math.max(0, Math.min(canvas.width - 1, player.x));
            player.y = Math.max(0, Math.min(canvas.height - 1, player.y));

            // 그리드 좌표 계산
            const gridX = Math.floor(player.x / CELL_SIZE);
            const gridY = Math.floor(player.y / CELL_SIZE);

            // 페인트 모드 활성화 (흔들기)
            const totalAccel = Math.sqrt(
                (acceleration.x || 0) ** 2 +
                (acceleration.y || 0) ** 2 +
                (acceleration.z || 0) ** 2
            );

            if (totalAccel > 15) {
                player.painting = true;
                player.paintTime = 30; // 0.5초간 페인트 모드
            }

            if (player.paintTime > 0) {
                player.paintTime--;
                paintArea(gridX, gridY, player.teamColor, player.paintRadius);
            } else {
                player.painting = false;
            }

            player.lastUpdate = Date.now();
        }

        function getPlayerId(sensorId, timestamp) {
            return sensorId + '_' + Math.floor(timestamp / 10000);
        }

        function spawnPlayer(playerId) {
            const teamColor = game.teams[game.players.size % game.teams.length];

            // 팀별 스폰 위치 (모서리에서 시작)
            const spawnPositions = [
                { x: 50, y: 50 },           // 왼쪽 위
                { x: canvas.width - 50, y: 50 },     // 오른쪽 위
                { x: 50, y: canvas.height - 50 },    // 왼쪽 아래
                { x: canvas.width - 50, y: canvas.height - 50 }, // 오른쪽 아래
                { x: canvas.width / 2, y: 50 },      // 중앙 위
                { x: canvas.width / 2, y: canvas.height - 50 }   // 중앙 아래
            ];

            const spawn = spawnPositions[game.players.size % spawnPositions.length];

            game.players.set(playerId, {
                id: playerId,
                x: spawn.x,
                y: spawn.y,
                vx: 0,
                vy: 0,
                teamColor: teamColor,
                painting: false,
                paintTime: 0,
                paintRadius: 2,
                area: 0,
                lastUpdate: Date.now()
            });

            updateTeamStats();
        }

        function paintArea(centerX, centerY, color, radius) {
            for (let dy = -radius; dy <= radius; dy++) {
                for (let dx = -radius; dx <= radius; dx++) {
                    const x = centerX + dx;
                    const y = centerY + dy;

                    if (x >= 0 && x < GRID_WIDTH && y >= 0 && y < GRID_HEIGHT) {
                        const distance = Math.sqrt(dx * dx + dy * dy);
                        if (distance <= radius) {
                            game.grid[y][x] = color;
                        }
                    }
                }
            }
        }

        function calculateTeamAreas() {
            const areas = {};

            // 팀별 영역 초기화
            game.teams.forEach(color => {
                areas[color] = 0;
            });

            // 그리드 전체 스캔
            for (let y = 0; y < GRID_HEIGHT; y++) {
                for (let x = 0; x < GRID_WIDTH; x++) {
                    const cellColor = game.grid[y][x];
                    if (cellColor && areas.hasOwnProperty(cellColor)) {
                        areas[cellColor]++;
                    }
                }
            }

            return areas;
        }

        function updateTeamStats() {
            const areas = calculateTeamAreas();
            const activeTeams = Array.from(game.players.values()).map(p => p.teamColor);
            const uniqueTeams = [...new Set(activeTeams)];

            let statsHTML = '';
            uniqueTeams.forEach(color => {
                const teamPlayers = Array.from(game.players.values()).filter(p => p.teamColor === color);
                const area = areas[color] || 0;
                const percentage = ((area / game.totalCells) * 100).toFixed(1);

                statsHTML += `
                    <div class="team-stats" style="background-color: ${color};">
                        팀 ${uniqueTeams.indexOf(color) + 1} (${teamPlayers.length}명)<br>
                        영역: ${area} (${percentage}%)
                    </div>
                `;
            });

            document.getElementById('teamStats').innerHTML = statsHTML;

            // 전체 영역 계산
            const totalPainted = Object.values(areas).reduce((sum, area) => sum + area, 0);
            const gameProgress = ((totalPainted / game.totalCells) * 100).toFixed(1);

            document.getElementById('totalArea').textContent = totalPainted;
            document.getElementById('gameProgress').textContent = gameProgress;
        }

        function startGame() {
            game.gameRunning = true;
            gameLoop();
        }

        function update() {
            if (!game.gameRunning) return;

            // 게임 시작 대기
            if (game.gamePhase === 'waiting') {
                const playerCount = game.players.size;

                if (playerCount >= 2) {
                    game.startTimer--;
                    if (game.startTimer <= 0) {
                        game.gamePhase = 'playing';
                    }
                } else {
                    game.startTimer = 6;
                }
                return;
            }

            if (game.gamePhase !== 'playing') return;

            // 게임 시간 감소
            game.timeLeft--;
            if (game.timeLeft <= 0) {
                endGame();
                return;
            }

            // 비활성 플레이어 제거
            const currentTime = Date.now();
            for (let [id, player] of game.players) {
                if (currentTime - player.lastUpdate > 8000) {
                    game.players.delete(id);
                }
            }

            // 통계 업데이트 (매 초마다)
            if (game.timeLeft % 60 === 0) {
                updateTeamStats();
            }

            updateUI();
        }

        function updateUI() {
            document.getElementById('timeLeft').textContent = Math.floor(game.timeLeft / 60);
        }

        function endGame() {
            game.gamePhase = 'ended';

            const areas = calculateTeamAreas();
            let winnerColor = null;
            let maxArea = 0;

            // 가장 많은 영역을 가진 팀 찾기
            Object.entries(areas).forEach(([color, area]) => {
                if (area > maxArea) {
                    maxArea = area;
                    winnerColor = color;
                }
            });

            setTimeout(() => {
                if (winnerColor) {
                    const winnerTeam = Array.from(game.players.values()).filter(p => p.teamColor === winnerColor);
                    const teamNumber = game.teams.indexOf(winnerColor) + 1;
                    const percentage = ((maxArea / game.totalCells) * 100).toFixed(1);

                    alert(`🏆 팀 ${teamNumber} 승리! 점유율: ${percentage}% (${maxArea}칸)`);
                } else {
                    alert('무승부!');
                }
                resetGame();
            }, 2000);
        }

        function resetGame() {
            game.players.clear();
            game.timeLeft = 120 * 60;
            game.gamePhase = 'waiting';
            game.startTimer = 6;

            // 그리드 초기화
            for (let y = 0; y < GRID_HEIGHT; y++) {
                for (let x = 0; x < GRID_WIDTH; x++) {
                    game.grid[y][x] = null;
                }
            }

            updateTeamStats();
            updateUI();
        }

        function render() {
            // 배경 지우기
            ctx.fillStyle = '#34495e';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // 그리드 그리기
            for (let y = 0; y < GRID_HEIGHT; y++) {
                for (let x = 0; x < GRID_WIDTH; x++) {
                    const cellColor = game.grid[y][x];
                    if (cellColor) {
                        ctx.fillStyle = cellColor;
                        ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
                    }
                }
            }

            // 그리드 라인 (선택적)
            if (CELL_SIZE >= 5) {
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
                ctx.lineWidth = 1;
                for (let x = 0; x <= canvas.width; x += CELL_SIZE) {
                    ctx.beginPath();
                    ctx.moveTo(x, 0);
                    ctx.lineTo(x, canvas.height);
                    ctx.stroke();
                }
                for (let y = 0; y <= canvas.height; y += CELL_SIZE) {
                    ctx.beginPath();
                    ctx.moveTo(0, y);
                    ctx.lineTo(canvas.width, y);
                    ctx.stroke();
                }
            }

            // 플레이어 그리기
            for (let [id, player] of game.players) {
                // 플레이어 브러시
                ctx.fillStyle = player.teamColor;
                ctx.beginPath();
                ctx.arc(player.x, player.y, 8, 0, Math.PI * 2);
                ctx.fill();

                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 2;
                ctx.stroke();

                // 페인트 모드 표시
                if (player.painting) {
                    ctx.strokeStyle = player.teamColor;
                    ctx.lineWidth = 4;
                    ctx.setLineDash([3, 3]);
                    ctx.beginPath();
                    ctx.arc(player.x, player.y, player.paintRadius * CELL_SIZE, 0, Math.PI * 2);
                    ctx.stroke();
                    ctx.setLineDash([]);

                    // 페인트 파티클 효과
                    for (let i = 0; i < 5; i++) {
                        const angle = Math.random() * Math.PI * 2;
                        const distance = Math.random() * 20;
                        const particleX = player.x + Math.cos(angle) * distance;
                        const particleY = player.y + Math.sin(angle) * distance;

                        ctx.fillStyle = player.teamColor;
                        ctx.globalAlpha = 0.6;
                        ctx.beginPath();
                        ctx.arc(particleX, particleY, 2, 0, Math.PI * 2);
                        ctx.fill();
                    }
                    ctx.globalAlpha = 1;
                }

                // 플레이어 ID 표시
                ctx.fillStyle = '#fff';
                ctx.font = '10px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(player.id.substring(0, 3), player.x, player.y - 15);
            }

            // 게임 상태 메시지
            if (game.gamePhase === 'waiting') {
                ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                ctx.fillStyle = '#fff';
                ctx.font = 'bold 24px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('색깔 전쟁 시작 준비...', canvas.width / 2, canvas.height / 2 - 20);

                ctx.font = '16px Arial';
                ctx.fillText(`플레이어: ${game.players.size}/2 (시작까지 ${Math.ceil(game.startTimer / 60)}초)`,
                           canvas.width / 2, canvas.height / 2 + 20);
            }

            if (game.gamePhase === 'ended') {
                ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                ctx.fillStyle = '#f1c40f';
                ctx.font = 'bold 32px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('색깔 전쟁 종료!', canvas.width / 2, canvas.height / 2);
            }
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

## 마무리

이상으로 멀티플레이어 게임 예제 5개를 완성했습니다. 각 예제의 특징:

1. **배틀 로얄 게임**: 8명까지 참여, 존 축소 시스템, 아이템 수집
2. **좀비 서바이벌**: 협력 생존, 웨이브 시스템, 바리케이드 방어
3. **킹 오브 더 힐**: 언덕 점령 게임, 파워업 시스템, 푸시 메커니즘
4. **스네이크 아레나**: 클래식 스네이크 게임의 멀티플레이어 버전
5. **색깔 전쟁**: 영역 점령 게임, 페인트 시스템, 팀 기반 경쟁

총 **30개의 기본 게임 예제**(단일 센서 5개 + 듀얼 센서 10개 + 멀티플레이어 5개)를 완성했습니다!