/**
 * 🏗️ StructureGenerator v1.0
 *
 * Stage 1: HTML 구조 생성기
 * - SessionSDK 통합
 * - 캔버스 초기화
 * - QR 코드 생성
 * - 기본 UI 구조
 *
 * ✅ 로직 없이 순수한 구조만 생성
 */

const { ChatAnthropic } = require('@langchain/anthropic');

class StructureGenerator {
    constructor(config) {
        this.config = config;
        this.llm = new ChatAnthropic({
            anthropicApiKey: config.claudeApiKey,
            model: config.claudeModel,
            maxTokens: 4096, // 구조만 생성하므로 절반 사용
            temperature: 0.3  // 일관성 중시
        });
    }

    /**
     * HTML 기본 구조 생성
     */
    async generate(requirements) {
        console.log('🏗️ Stage 1: HTML 구조 생성 시작...');

        const prompt = this.buildPrompt(requirements);

        try {
            const response = await this.llm.invoke(prompt);
            const htmlStructure = this.extractHTML(response.content);

            console.log('✅ Stage 1: HTML 구조 생성 완료');
            return {
                success: true,
                html: htmlStructure,
                stage: 'structure'
            };
        } catch (error) {
            console.error('❌ Stage 1 실패:', error.message);
            return {
                success: false,
                error: error.message,
                stage: 'structure'
            };
        }
    }

    /**
     * 프롬프트 생성
     */
    buildPrompt(requirements) {
        const { title, gameType, genre, description } = requirements;

        return `당신은 센서 게임의 HTML 구조를 생성하는 전문가입니다.

**요구사항:**
- 게임 제목: ${title || '미지정'}
- 게임 타입: ${gameType}
- 장르: ${genre || '일반'}
- 설명: ${description || '센서 기반 게임'}

**생성 규칙:**
1. **SessionSDK 완벽 통합** (가장 중요!)
2. 캔버스 및 기본 UI 구조
3. QR 코드 생성 로직 (폴백 포함)
4. 게임 정보 표시 영역
5. **로직은 절대 포함하지 말 것** (update, render 함수 비어있어도 됨)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔥 **필수! SessionSDK 통합 패턴 (절대 틀리지 말 것!)**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

\`\`\`javascript
// 1. SDK 초기화
const sdk = new SessionSDK({
    gameId: '${title?.toLowerCase().replace(/\s+/g, '-') || 'sensor-game'}',
    gameType: '${gameType}'
});

// 2. 서버 연결 완료 대기 → 세션 생성 (반드시 이 순서!)
sdk.on('connected', () => {
    console.log('✅ 서버 연결 완료');
    createSession();
});

function createSession() {
    sdk.createSession().then(session => {
        console.log('✅ 세션 생성됨:', session);
    }).catch(error => {
        console.error('❌ 세션 생성 실패:', error);
        alert('세션 생성에 실패했습니다: ' + error.message);
    });
}

// 3. CustomEvent 처리 패턴 (event.detail || event)
sdk.on('session-created', (event) => {
    const session = event.detail || event;  // 반드시 이 패턴!
    document.getElementById('session-code').textContent = session.sessionCode;  // session.code 아님!

    // QR URL 직접 생성 (session.qrCodeUrl 속성 없음!)
    const qrUrl = \`\${window.location.origin}/sensor.html?session=\${session.sessionCode}\`;
    generateQRCode(qrUrl);
});

sdk.on('sensor-connected', (event) => {
    const data = event.detail || event;
    document.getElementById('sensor-status').textContent = '센서 연결됨';
    document.getElementById('sensor-status').className = 'connected';

    // 게임 시작 준비
    initGame();
});

sdk.on('sensor-data', (event) => {
    const data = event.detail || event;
    processSensorData(data);  // Stage 2에서 구현
});

sdk.on('sensor-disconnected', (event) => {
    const data = event.detail || event;
    document.getElementById('sensor-status').textContent = '센서 연결 대기 중...';
    document.getElementById('sensor-status').className = 'disconnected';
});
\`\`\`

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎨 **QR 코드 생성 (폴백 포함)**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

\`\`\`javascript
function generateQRCode(url) {
    const qrContainer = document.getElementById('qr-code');
    qrContainer.innerHTML = '';

    // qrcodejs 라이브러리 사용 시도
    if (typeof QRCode !== 'undefined') {
        new QRCode(qrContainer, {
            text: url,
            width: 200,
            height: 200,
            colorDark: '#000000',
            colorLight: '#ffffff',
            correctLevel: QRCode.CorrectLevel.H
        });
    } else {
        // 폴백: 외부 API 사용
        const img = document.createElement('img');
        img.src = \`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=\${encodeURIComponent(url)}\`;
        img.alt = 'QR Code';
        img.style.width = '200px';
        img.style.height = '200px';
        qrContainer.appendChild(img);
    }
}
\`\`\`

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 **HTML 구조 (단일 파일)**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

\`\`\`html
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title || '센서 게임'}</title>
    <style>
        /* 모던 디자인 스타일 */
        body {
            margin: 0;
            padding: 20px;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            display: flex;
            flex-direction: column;
            align-items: center;
            min-height: 100vh;
        }

        h1 {
            font-size: 2.5rem;
            margin: 20px 0;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }

        #game-container {
            position: relative;
            width: 100%;
            max-width: 800px;
            margin: 20px auto;
        }

        canvas {
            background: #000;
            border-radius: 8px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.3);
            display: block;
            width: 100%;
            height: auto;
        }

        #session-info {
            background: rgba(255,255,255,0.1);
            backdrop-filter: blur(10px);
            padding: 20px;
            border-radius: 12px;
            margin: 20px 0;
            text-align: center;
            box-shadow: 0 4px 16px rgba(0,0,0,0.2);
        }

        #session-code {
            font-size: 32px;
            font-weight: bold;
            color: #ffd700;
            letter-spacing: 4px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
        }

        #sensor-status {
            padding: 12px 24px;
            border-radius: 24px;
            margin: 15px 0;
            font-weight: 600;
            transition: all 0.3s ease;
        }

        #sensor-status.connected {
            background: #4CAF50;
            box-shadow: 0 0 20px rgba(76, 175, 80, 0.5);
        }

        #sensor-status.disconnected {
            background: #f44336;
            animation: pulse 2s infinite;
        }

        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.6; }
        }

        #qr-code {
            margin: 20px auto;
            padding: 15px;
            background: white;
            border-radius: 12px;
            display: inline-block;
            box-shadow: 0 4px 16px rgba(0,0,0,0.2);
        }

        #game-info {
            position: absolute;
            top: 15px;
            left: 15px;
            background: rgba(0,0,0,0.7);
            padding: 15px;
            border-radius: 8px;
            font-size: 18px;
            font-weight: 600;
        }

        #game-info div {
            margin: 5px 0;
        }
    </style>
</head>
<body>
    <h1>${title || '🎮 센서 게임'}</h1>

    <!-- 세션 정보 영역 -->
    <div id="session-info">
        <h2>세션 코드</h2>
        <div id="session-code">대기중...</div>
        <div id="sensor-status" class="disconnected">센서 연결 대기 중...</div>
        <div id="qr-code"></div>
    </div>

    <!-- 게임 컨테이너 -->
    <div id="game-container">
        <canvas id="gameCanvas"></canvas>
        <div id="game-info">
            <div>Score: <span id="score">0</span></div>
            <div>Lives: <span id="lives">3</span></div>
            <div>Time: <span id="time">60</span>s</div>
        </div>
    </div>

    <!-- 필수 스크립트 -->
    <script src="/socket.io/socket.io.js"></script>
    <script src="/js/SessionSDK.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js"></script>

    <script>
        // 게임 상수 (Stage 2에서 수정 가능)
        const CANVAS_WIDTH = 800;
        const CANVAS_HEIGHT = 600;

        // 캔버스 초기화
        const canvas = document.getElementById('gameCanvas');
        const ctx = canvas.getContext('2d');
        canvas.width = CANVAS_WIDTH;
        canvas.height = CANVAS_HEIGHT;

        // 게임 상태 (Stage 2에서 초기화)
        let gameState = {};

        // SDK 초기화
        const sdk = new SessionSDK({
            gameId: '${title?.toLowerCase().replace(/\s+/g, '-') || 'sensor-game'}',
            gameType: '${gameType}'
        });

        // [위에 작성한 SessionSDK 통합 코드 삽입]
        sdk.on('connected', () => {
            console.log('✅ 서버 연결 완료');
            createSession();
        });

        function createSession() {
            sdk.createSession().then(session => {
                console.log('✅ 세션 생성됨:', session);
            }).catch(error => {
                console.error('❌ 세션 생성 실패:', error);
                alert('세션 생성에 실패했습니다: ' + error.message);
            });
        }

        sdk.on('session-created', (event) => {
            const session = event.detail || event;
            document.getElementById('session-code').textContent = session.sessionCode;
            const qrUrl = \`\${window.location.origin}/sensor.html?session=\${session.sessionCode}\`;
            generateQRCode(qrUrl);
        });

        sdk.on('sensor-connected', (event) => {
            const data = event.detail || event;
            document.getElementById('sensor-status').textContent = '센서 연결됨';
            document.getElementById('sensor-status').className = 'connected';
            initGame();
        });

        sdk.on('sensor-data', (event) => {
            const data = event.detail || event;
            processSensorData(data);
        });

        sdk.on('sensor-disconnected', (event) => {
            const data = event.detail || event;
            document.getElementById('sensor-status').textContent = '센서 연결 대기 중...';
            document.getElementById('sensor-status').className = 'disconnected';
        });

        // QR 코드 생성
        function generateQRCode(url) {
            const qrContainer = document.getElementById('qr-code');
            qrContainer.innerHTML = '';

            if (typeof QRCode !== 'undefined') {
                new QRCode(qrContainer, {
                    text: url,
                    width: 200,
                    height: 200,
                    colorDark: '#000000',
                    colorLight: '#ffffff',
                    correctLevel: QRCode.CorrectLevel.H
                });
            } else {
                const img = document.createElement('img');
                img.src = \`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=\${encodeURIComponent(url)}\`;
                img.alt = 'QR Code';
                img.style.width = '200px';
                img.style.height = '200px';
                qrContainer.appendChild(img);
            }
        }

        // Stage 2에서 구현될 함수들 (빈 껍데기)
        function initGame() {
            console.log('🎮 게임 초기화 (Stage 2에서 구현 예정)');
            // Stage 2: GameLogicGenerator에서 로직 추가
        }

        function processSensorData(sensorData) {
            console.log('📱 센서 데이터 수신 (Stage 2에서 구현 예정)', sensorData);
            // Stage 2: GameLogicGenerator에서 로직 추가
        }

        function update() {
            // Stage 2: GameLogicGenerator에서 로직 추가
        }

        function render() {
            // Stage 2: GameLogicGenerator에서 로직 추가
        }

        function gameLoop() {
            update();
            render();
            requestAnimationFrame(gameLoop);
        }

        // 게임 루프 시작 (Stage 2에서 실제 로직 추가)
        gameLoop();
    </script>
</body>
</html>
\`\`\`

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**중요:**
- 위 구조만 생성하고 게임 로직은 포함하지 마세요
- SessionSDK 통합은 반드시 정확하게 구현
- QR 코드 폴백 처리 필수
- 단일 HTML 파일로 완성

위 규칙을 준수하여 **완전한 HTML 파일**을 생성하세요.`;
    }

    /**
     * HTML 추출
     */
    extractHTML(content) {
        // HTML 코드 블록 추출
        const htmlMatch = content.match(/```html\n([\s\S]*?)\n```/);
        if (htmlMatch) {
            return htmlMatch[1].trim();
        }

        // 코드 블록 없이 바로 HTML인 경우
        if (content.includes('<!DOCTYPE html>')) {
            return content.trim();
        }

        throw new Error('HTML 코드를 찾을 수 없습니다');
    }
}

module.exports = StructureGenerator;
