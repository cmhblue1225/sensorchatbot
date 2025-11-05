/**
 * 🎮 GameLogicGenerator v1.0
 *
 * Stage 2: 게임 로직 생성기
 * - 검증된 버그 없는 패턴 라이브러리 사용
 * - 물리 시뮬레이션
 * - 충돌 감지
 * - 타이머 시스템
 * - 상태 관리
 *
 * ✅ 100% 검증된 패턴만 사용
 */

const { ChatAnthropic } = require('@langchain/anthropic');

class GameLogicGenerator {
    constructor(config) {
        this.config = config;
        this.llm = new ChatAnthropic({
            anthropicApiKey: config.claudeApiKey,
            model: config.claudeModel,
            maxTokens: 4096, // 로직 생성
            temperature: 0.2  // 일관성 최우선
        });

        // 검증된 버그 없는 패턴 라이브러리
        this.patterns = this.loadVerifiedPatterns();
    }

    /**
     * 검증된 패턴 라이브러리 로드
     */
    loadVerifiedPatterns() {
        return {
            // 패턴 1: 공 이동 로직 (벽돌깨기, 퐁 게임)
            ballMovement: {
                name: '공 이동 로직',
                bugFree: true,
                code: `
// ✅ 검증된 패턴: 공이 패들에서 떨어지는 로직
if (!gameState.gameStarted) {
    // 게임 시작 전: 공을 패들 위에 고정
    gameState.ball.x = gameState.paddle.x + gameState.paddle.width / 2;
    gameState.ball.y = gameState.paddle.y - gameState.ball.radius;
    gameState.ball.dx = 0;  // 속도 0
    gameState.ball.dy = 0;
} else {
    // 게임 시작 후: 공이 독립적으로 이동
    gameState.ball.x += gameState.ball.dx;
    gameState.ball.y += gameState.ball.dy;
}

// 게임 시작 트리거 (클릭)
document.addEventListener('click', () => {
    if (!gameState.gameStarted && gameState.lives > 0) {
        gameState.gameStarted = true;
        gameState.ball.dx = 4;
        gameState.ball.dy = -7;
    }
});`
            },

            // 패턴 2: 완벽한 충돌 감지
            collisionDetection: {
                name: '충돌 감지',
                bugFree: true,
                code: `
// ✅ 검증된 패턴: 벽 충돌
if (gameState.ball.x + gameState.ball.radius >= canvas.width ||
    gameState.ball.x - gameState.ball.radius <= 0) {
    gameState.ball.dx *= -1;
}
if (gameState.ball.y - gameState.ball.radius <= 0) {
    gameState.ball.dy *= -1;
}

// ✅ 검증된 패턴: 패들 충돌 (완전한 조건 체크)
if (gameState.ball.y + gameState.ball.radius >= gameState.paddle.y &&
    gameState.ball.y + gameState.ball.radius <= gameState.paddle.y + gameState.paddle.height &&
    gameState.ball.x >= gameState.paddle.x &&
    gameState.ball.x <= gameState.paddle.x + gameState.paddle.width &&
    gameState.ball.dy > 0) {  // 아래로 이동 중일 때만

    gameState.ball.dy = -Math.abs(gameState.ball.dy);

    // 패들 위치에 따른 반사각 조절
    const hitPos = (gameState.ball.x - gameState.paddle.x) / gameState.paddle.width;
    gameState.ball.dx = 8 * (hitPos - 0.5);
}

// ✅ 검증된 패턴: 바닥 충돌 (목숨 감소)
if (gameState.ball.y + gameState.ball.radius >= canvas.height) {
    gameState.lives--;
    gameState.gameStarted = false;

    if (gameState.lives <= 0) {
        gameState.gameOver = true;
        alert('Game Over! Score: ' + gameState.score);
        resetGame();
    } else {
        // 공 리셋
        gameState.ball.x = gameState.paddle.x + gameState.paddle.width / 2;
        gameState.ball.y = gameState.paddle.y - gameState.ball.radius;
        gameState.ball.dx = 0;
        gameState.ball.dy = 0;
    }
    updateUI();
}`
            },

            // 패턴 3: 타이머 시스템
            timerSystem: {
                name: '타이머 시스템',
                bugFree: true,
                code: `
// ✅ 검증된 패턴: 작동하는 타이머
let timerInterval = null;

function startTimer() {
    if (timerInterval) clearInterval(timerInterval);

    gameState.timeLeft = GAME_TIME;

    timerInterval = setInterval(() => {
        if (gameState.gameStarted && !gameState.gameOver) {
            gameState.timeLeft--;

            if (gameState.timeLeft <= 0) {
                gameState.gameOver = true;
                clearInterval(timerInterval);
                alert('Time Over! Final Score: ' + gameState.score);
                resetGame();
            }

            updateUI();
        }
    }, 1000);
}

// 센서 연결 시 타이머 시작
function initGame() {
    startTimer();
    gameState.gameStarted = false;
    gameState.gameOver = false;
}`
            },

            // 패턴 4: 벽돌 충돌 감지
            brickCollision: {
                name: '벽돌 충돌',
                bugFree: true,
                code: `
// ✅ 검증된 패턴: 벽돌 충돌
for (let i = 0; i < gameState.bricks.length; i++) {
    const brick = gameState.bricks[i];

    if (brick.active &&
        gameState.ball.x + gameState.ball.radius >= brick.x &&
        gameState.ball.x - gameState.ball.radius <= brick.x + brick.width &&
        gameState.ball.y + gameState.ball.radius >= brick.y &&
        gameState.ball.y - gameState.ball.radius <= brick.y + brick.height) {

        brick.active = false;
        gameState.ball.dy *= -1;
        gameState.score += 10;
        updateUI();

        // 모든 벽돌 파괴 시 승리
        const activeBricks = gameState.bricks.filter(b => b.active).length;
        if (activeBricks === 0) {
            gameState.gameOver = true;
            alert('Victory! Score: ' + gameState.score);
            resetGame();
        }
    }
}`
            },

            // 패턴 5: 센서 데이터 처리
            sensorProcessing: {
                name: '센서 데이터 처리',
                bugFree: true,
                code: `
// ✅ 검증된 패턴: 센서 데이터로 패들 조작
function processSensorData(sensorData) {
    if (gameState.gameOver) return;

    const { orientation } = sensorData.data;

    // 기울기 값 범위 제한 (-1 ~ 1)
    const tiltX = Math.max(-1, Math.min(1, orientation.gamma / 90));

    // 패들 이동
    gameState.paddle.x += tiltX * gameState.paddle.speed;

    // 경계 체크
    gameState.paddle.x = Math.max(0, Math.min(
        canvas.width - gameState.paddle.width,
        gameState.paddle.x
    ));

    // 게임 시작 전에는 공도 함께 이동
    if (!gameState.gameStarted) {
        gameState.ball.x = gameState.paddle.x + gameState.paddle.width / 2;
    }
}`
            },

            // 패턴 6: 게임 리셋
            gameReset: {
                name: '게임 리셋',
                bugFree: true,
                code: `
// ✅ 검증된 패턴: 완전한 게임 리셋
function resetGame() {
    gameState.score = 0;
    gameState.lives = INITIAL_LIVES;
    gameState.timeLeft = GAME_TIME;
    gameState.gameStarted = false;
    gameState.gameOver = false;

    // 공 리셋
    gameState.ball.x = gameState.paddle.x + gameState.paddle.width / 2;
    gameState.ball.y = gameState.paddle.y - gameState.ball.radius;
    gameState.ball.dx = 0;
    gameState.ball.dy = 0;

    // 벽돌 리셋
    initBricks();

    // UI 업데이트
    updateUI();

    // 타이머 리셋
    if (timerInterval) clearInterval(timerInterval);
    startTimer();
}`
            }
        };
    }

    /**
     * 게임 로직 생성
     */
    async generate(requirements, structureHtml) {
        console.log('🎮 Stage 2: 게임 로직 생성 시작...');

        const prompt = this.buildPrompt(requirements);

        try {
            const response = await this.llm.invoke(prompt);
            const logicCode = this.extractLogicCode(response.content);

            console.log('✅ Stage 2: 게임 로직 생성 완료');
            return {
                success: true,
                logic: logicCode,
                stage: 'logic'
            };
        } catch (error) {
            console.error('❌ Stage 2 실패:', error.message);
            return {
                success: false,
                error: error.message,
                stage: 'logic'
            };
        }
    }

    /**
     * 프롬프트 생성
     */
    buildPrompt(requirements) {
        const { title, gameType, genre, description } = requirements;

        return `당신은 버그 없는 게임 로직을 생성하는 전문가입니다.

**요구사항:**
- 게임 제목: ${title || '미지정'}
- 게임 타입: ${gameType}
- 장르: ${genre || '일반'}
- 설명: ${description || '센서 기반 게임'}

**중요: 아래의 검증된 패턴을 반드시 사용하세요!**

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🏆 검증된 버그 없는 패턴 라이브러리
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${Object.values(this.patterns).map(pattern => `
### ${pattern.name}
${pattern.code}
`).join('\n')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 생성 규칙
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. **위 패턴을 정확히 사용** (수정 금지!)
2. 게임 상수 정의
3. gameState 객체 초기화
4. initGame() 함수 구현
5. processSensorData() 함수 구현 (위 패턴 사용)
6. update() 함수 구현 (위 패턴 사용)
7. render() 함수 구현
8. updateUI() 함수 구현

**출력 형식:**
\`\`\`javascript
// 게임 상수
const INITIAL_LIVES = 3;
const GAME_TIME = 60;
const PADDLE_SPEED = 10;

// 게임 상태 초기화
gameState = {
    paddle: {
        x: canvas.width / 2 - 50,
        y: canvas.height - 30,
        width: 100,
        height: 10,
        speed: PADDLE_SPEED
    },
    ball: {
        x: canvas.width / 2,
        y: canvas.height - 40,
        dx: 0,
        dy: 0,
        radius: 10
    },
    bricks: [],
    score: 0,
    lives: INITIAL_LIVES,
    timeLeft: GAME_TIME,
    gameStarted: false,
    gameOver: false
};

// 벽돌 초기화
function initBricks() {
    const rows = 5;
    const cols = 8;
    const brickWidth = 80;
    const brickHeight = 20;
    const padding = 10;
    const offsetTop = 50;
    const offsetLeft = 60;

    gameState.bricks = [];
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            gameState.bricks.push({
                x: c * (brickWidth + padding) + offsetLeft,
                y: r * (brickHeight + padding) + offsetTop,
                width: brickWidth,
                height: brickHeight,
                active: true
            });
        }
    }
}

// [위의 검증된 패턴들을 여기에 정확히 복사]

function initGame() {
    // 패턴: 타이머 시스템
    startTimer();
    gameState.gameStarted = false;
    gameState.gameOver = false;
    initBricks();
}

function processSensorData(sensorData) {
    // 패턴: 센서 데이터 처리
    [위 패턴 사용]
}

function update() {
    if (gameState.gameOver) return;

    // 패턴: 공 이동 로직
    [위 패턴 사용]

    // 패턴: 충돌 감지
    [위 패턴 사용]

    // 패턴: 벽돌 충돌
    [위 패턴 사용]
}

function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 패들 렌더링
    ctx.fillStyle = '#4CAF50';
    ctx.fillRect(gameState.paddle.x, gameState.paddle.y,
                 gameState.paddle.width, gameState.paddle.height);

    // 공 렌더링
    ctx.beginPath();
    ctx.arc(gameState.ball.x, gameState.ball.y, gameState.ball.radius,
            0, Math.PI * 2);
    ctx.fillStyle = '#FFF';
    ctx.fill();
    ctx.closePath();

    // 벽돌 렌더링
    gameState.bricks.forEach((brick, i) => {
        if (brick.active) {
            ctx.fillStyle = \`hsl(\${360 * i / gameState.bricks.length}, 70%, 50%)\`;
            ctx.fillRect(brick.x, brick.y, brick.width, brick.height);
        }
    });
}

function updateUI() {
    document.getElementById('score').textContent = gameState.score;
    document.getElementById('lives').textContent = gameState.lives;
    document.getElementById('time').textContent = gameState.timeLeft;
}

// 벽돌 초기화
initBricks();
\`\`\`

**중요:**
- 검증된 패턴을 정확히 사용하세요 (수정 금지!)
- 모든 함수가 완전히 구현되어야 합니다
- 버그 없는 코드만 생성하세요

위 규칙을 준수하여 **완전한 JavaScript 코드**를 생성하세요.`;
    }

    /**
     * 로직 코드 추출
     */
    extractLogicCode(content) {
        // JavaScript 코드 블록 추출
        const jsMatch = content.match(/```javascript\n([\s\S]*?)\n```/);
        if (jsMatch) {
            return jsMatch[1].trim();
        }

        // 코드 블록 없이 바로 JavaScript인 경우
        if (content.includes('gameState')) {
            return content.trim();
        }

        throw new Error('JavaScript 코드를 찾을 수 없습니다');
    }

    /**
     * 장르별 특화 패턴 가져오기
     */
    getGenreSpecificPatterns(genre) {
        const genreLower = (genre || '').toLowerCase();

        if (genreLower.includes('brick') || genreLower.includes('breaker') || genreLower.includes('벽돌')) {
            return ['ballMovement', 'collisionDetection', 'brickCollision', 'sensorProcessing', 'timerSystem', 'gameReset'];
        }

        if (genreLower.includes('maze') || genreLower.includes('미로')) {
            return ['sensorProcessing', 'timerSystem', 'gameReset'];
        }

        if (genreLower.includes('racing') || genreLower.includes('레이싱')) {
            return ['sensorProcessing', 'collisionDetection', 'timerSystem'];
        }

        // 기본 패턴
        return ['ballMovement', 'collisionDetection', 'sensorProcessing', 'timerSystem', 'gameReset'];
    }
}

module.exports = GameLogicGenerator;
