# 🎨 UI/UX 패턴 - 센서 게임을 위한 인터페이스 디자인

## 📚 목차
1. [센서 게임 UI 원칙](#센서-게임-ui-원칙)
2. [QR 코드 및 세션 UI](#qr-코드-및-세션-ui)
3. [게임 HUD 디자인](#게임-hud-디자인)
4. [피드백 시스템](#피드백-시스템)
5. [튜토리얼 및 온보딩](#튜토리얼-및-온보딩)
6. [반응형 디자인](#반응형-디자인)
7. [애니메이션 및 전환](#애니메이션-및-전환)
8. [접근성](#접근성)

---

## 🎯 센서 게임 UI 원칙

### 1. 최소주의 디자인

센서 게임은 플레이어가 화면이 아닌 센서에 집중해야 하므로 UI는 최소화되어야 합니다.

```javascript
// ✅ 좋은 예: 간결한 HUD
class MinimalHUD {
    constructor() {
        this.elements = {
            score: this.createScoreDisplay(),
            timer: this.createTimerDisplay(),
            health: this.createHealthBar()
        };

        this.setupStyles();
    }

    createScoreDisplay() {
        const scoreEl = document.createElement('div');
        scoreEl.className = 'hud-score';
        scoreEl.textContent = '0';
        return scoreEl;
    }

    setupStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .hud-score {
                position: fixed;
                top: 20px;
                right: 20px;
                font-size: 2.5rem;
                font-weight: bold;
                color: rgba(255, 255, 255, 0.9);
                text-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
                z-index: 100;
                pointer-events: none; /* 터치 이벤트 무시 */
            }

            .hud-timer {
                position: fixed;
                top: 20px;
                left: 20px;
                font-size: 1.5rem;
                color: rgba(255, 255, 255, 0.8);
            }

            .hud-health {
                position: fixed;
                bottom: 30px;
                left: 50%;
                transform: translateX(-50%);
                width: 200px;
                height: 20px;
                background: rgba(0, 0, 0, 0.3);
                border-radius: 10px;
                overflow: hidden;
            }

            .hud-health-fill {
                height: 100%;
                background: linear-gradient(90deg, #ff4444, #ff8844);
                transition: width 0.3s ease;
            }
        `;
        document.head.appendChild(style);
    }

    updateScore(score) {
        this.elements.score.textContent = score.toLocaleString();

        // 점수 증가 애니메이션
        this.elements.score.style.transform = 'scale(1.2)';
        setTimeout(() => {
            this.elements.score.style.transform = 'scale(1)';
        }, 150);
    }

    updateHealth(current, max) {
        const percentage = (current / max) * 100;
        const fillEl = this.elements.health.querySelector('.hud-health-fill');
        fillEl.style.width = `${percentage}%`;

        // 체력 낮을 때 색상 변경
        if (percentage < 30) {
            fillEl.style.background = 'linear-gradient(90deg, #ff0000, #ff4444)';
        } else {
            fillEl.style.background = 'linear-gradient(90deg, #ff4444, #ff8844)';
        }
    }
}
```

### 2. 대형 터치 영역

```javascript
class TouchOptimizedUI {
    createButton(text, onClick) {
        const button = document.createElement('button');
        button.textContent = text;
        button.className = 'touch-button';

        button.style.cssText = `
            min-width: 120px;
            min-height: 60px; /* 최소 44x44px 권장 */
            padding: 1rem 2rem;
            font-size: 1.2rem;
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
            border: none;
            border-radius: 12px;
            cursor: pointer;
            transition: all 0.2s;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
        `;

        // 터치 피드백
        button.addEventListener('touchstart', (e) => {
            button.style.transform = 'scale(0.95)';
            button.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.3)';
        });

        button.addEventListener('touchend', (e) => {
            button.style.transform = 'scale(1)';
            button.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.2)';
            onClick(e);
        });

        return button;
    }
}
```

---

## 📱 QR 코드 및 세션 UI

### 세션 코드 표시

```javascript
class SessionUI {
    constructor() {
        this.overlay = null;
    }

    showSessionCode(sessionCode, qrCodeDataUrl) {
        this.overlay = document.createElement('div');
        this.overlay.className = 'session-overlay';
        this.overlay.innerHTML = `
            <div class="session-card">
                <h2>📱 모바일 연결</h2>

                <div class="session-code-display">
                    <div class="code-label">세션 코드</div>
                    <div class="code-value">${this.formatCode(sessionCode)}</div>
                </div>

                <div class="qr-code-container">
                    <img src="${qrCodeDataUrl}" alt="QR Code" class="qr-code">
                    <p class="qr-instruction">
                        📸 QR 코드를 스캔하거나<br>
                        세션 코드를 입력하세요
                    </p>
                </div>

                <div class="connection-status">
                    <div class="status-indicator connecting"></div>
                    <span>센서 연결 대기중...</span>
                </div>

                <div class="sensor-url">
                    ${window.location.origin}/sensor.html
                </div>
            </div>
        `;

        this.addStyles();
        document.body.appendChild(this.overlay);
    }

    formatCode(code) {
        // "1234" → "1 2 3 4"
        return code.split('').join(' ');
    }

    updateConnectionStatus(connected) {
        const indicator = this.overlay.querySelector('.status-indicator');
        const statusText = this.overlay.querySelector('.connection-status span');

        if (connected) {
            indicator.className = 'status-indicator connected';
            statusText.textContent = '✅ 센서 연결됨';

            // 2초 후 오버레이 제거
            setTimeout(() => {
                this.hide();
            }, 2000);
        }
    }

    hide() {
        if (this.overlay) {
            this.overlay.style.opacity = '0';
            setTimeout(() => {
                this.overlay.remove();
                this.overlay = null;
            }, 300);
        }
    }

    addStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .session-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.85);
                backdrop-filter: blur(10px);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 1000;
                animation: fadeIn 0.3s;
            }

            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }

            .session-card {
                background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
                border: 2px solid rgba(99, 102, 241, 0.3);
                border-radius: 24px;
                padding: 2.5rem;
                max-width: 450px;
                width: 90%;
                text-align: center;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
            }

            .session-card h2 {
                color: #f8fafc;
                margin-bottom: 2rem;
                font-size: 1.8rem;
            }

            .session-code-display {
                background: rgba(99, 102, 241, 0.1);
                border: 2px solid #6366f1;
                border-radius: 16px;
                padding: 1.5rem;
                margin-bottom: 2rem;
            }

            .code-label {
                color: #94a3b8;
                font-size: 0.875rem;
                margin-bottom: 0.5rem;
                text-transform: uppercase;
                letter-spacing: 0.1em;
            }

            .code-value {
                color: #f8fafc;
                font-size: 3rem;
                font-weight: bold;
                font-family: 'Courier New', monospace;
                letter-spacing: 0.5rem;
                text-shadow: 0 0 20px rgba(99, 102, 241, 0.5);
            }

            .qr-code-container {
                margin: 2rem 0;
            }

            .qr-code {
                width: 200px;
                height: 200px;
                border: 4px solid white;
                border-radius: 12px;
                background: white;
                padding: 10px;
            }

            .qr-instruction {
                color: #cbd5e1;
                margin-top: 1rem;
                font-size: 0.9rem;
                line-height: 1.6;
            }

            .connection-status {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 0.75rem;
                margin-top: 2rem;
                color: #e2e8f0;
            }

            .status-indicator {
                width: 12px;
                height: 12px;
                border-radius: 50%;
                position: relative;
            }

            .status-indicator.connecting {
                background: #fbbf24;
                animation: pulse 1.5s infinite;
            }

            .status-indicator.connected {
                background: #10b981;
            }

            @keyframes pulse {
                0%, 100% { opacity: 1; transform: scale(1); }
                50% { opacity: 0.5; transform: scale(1.2); }
            }

            .sensor-url {
                margin-top: 1.5rem;
                padding: 0.75rem;
                background: rgba(0, 0, 0, 0.3);
                border-radius: 8px;
                color: #94a3b8;
                font-size: 0.8rem;
                font-family: monospace;
            }
        `;
        document.head.appendChild(style);
    }
}

// 사용 예
const sessionUI = new SessionUI();

sdk.on('session-created', (event) => {
    const session = event.detail || event;
    // QR URL 직접 생성
    const qrUrl = `${window.location.origin}/sensor.html?session=${session.sessionCode}`;
    sessionUI.showSessionCode(session.sessionCode, qrUrl);
});

sdk.on('sensor-connected', () => {
    sessionUI.updateConnectionStatus(true);
});
```

---

## 🎮 게임 HUD 디자인

### 멀티플레이어 스코어보드

```javascript
class ScoreboardUI {
    constructor() {
        this.container = this.createContainer();
        this.players = new Map();
    }

    createContainer() {
        const container = document.createElement('div');
        container.className = 'scoreboard';
        container.innerHTML = `
            <div class="scoreboard-header">
                <h3>🏆 순위</h3>
            </div>
            <div class="scoreboard-list"></div>
        `;

        const style = document.createElement('style');
        style.textContent = `
            .scoreboard {
                position: fixed;
                top: 20px;
                right: 20px;
                width: 250px;
                background: rgba(30, 41, 59, 0.9);
                backdrop-filter: blur(10px);
                border: 1px solid rgba(99, 102, 241, 0.3);
                border-radius: 16px;
                overflow: hidden;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
                z-index: 100;
            }

            .scoreboard-header {
                background: linear-gradient(135deg, #6366f1, #8b5cf6);
                padding: 1rem;
                text-align: center;
            }

            .scoreboard-header h3 {
                margin: 0;
                color: white;
                font-size: 1.1rem;
            }

            .scoreboard-list {
                padding: 0.5rem;
                max-height: 300px;
                overflow-y: auto;
            }

            .player-row {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 0.75rem;
                margin: 0.25rem 0;
                background: rgba(100, 116, 139, 0.2);
                border-radius: 8px;
                transition: all 0.2s;
            }

            .player-row.rank-1 {
                background: linear-gradient(90deg, rgba(255, 215, 0, 0.2), rgba(255, 215, 0, 0.1));
                border: 1px solid rgba(255, 215, 0, 0.3);
            }

            .player-row.rank-2 {
                background: linear-gradient(90deg, rgba(192, 192, 192, 0.2), rgba(192, 192, 192, 0.1));
                border: 1px solid rgba(192, 192, 192, 0.3);
            }

            .player-row.rank-3 {
                background: linear-gradient(90deg, rgba(205, 127, 50, 0.2), rgba(205, 127, 50, 0.1));
                border: 1px solid rgba(205, 127, 50, 0.3);
            }

            .player-info {
                display: flex;
                align-items: center;
                gap: 0.5rem;
            }

            .player-rank {
                font-weight: bold;
                color: #fbbf24;
                min-width: 24px;
            }

            .player-name {
                color: #e2e8f0;
                font-weight: 500;
            }

            .player-score {
                color: #a5b4fc;
                font-weight: bold;
                font-size: 1.1rem;
            }
        `;
        document.head.appendChild(style);

        document.body.appendChild(container);
        return container;
    }

    updatePlayer(playerId, playerData) {
        this.players.set(playerId, playerData);
        this.render();
    }

    removePlayer(playerId) {
        this.players.delete(playerId);
        this.render();
    }

    render() {
        const list = this.container.querySelector('.scoreboard-list');

        // 점수 순으로 정렬
        const sortedPlayers = Array.from(this.players.entries())
            .sort((a, b) => b[1].score - a[1].score);

        list.innerHTML = sortedPlayers.map(([id, player], index) => {
            const rank = index + 1;
            const medals = ['🥇', '🥈', '🥉'];
            const medal = medals[index] || `${rank}.`;

            return `
                <div class="player-row rank-${rank}">
                    <div class="player-info">
                        <span class="player-rank">${medal}</span>
                        <span class="player-name">${player.name}</span>
                    </div>
                    <span class="player-score">${player.score}</span>
                </div>
            `;
        }).join('');
    }
}

// 사용 예
const scoreboard = new ScoreboardUI();

// 플레이어 업데이트
gameEvents.on('score:changed', (playerId, score) => {
    scoreboard.updatePlayer(playerId, {
        name: `Player ${playerId}`,
        score: score
    });
});
```

---

## 💫 피드백 시스템

### 시각적 피드백

```javascript
class VisualFeedback {
    // 화면 흔들림
    static screenShake(duration = 300, intensity = 10) {
        const canvas = document.getElementById('gameCanvas');
        const originalTransform = canvas.style.transform;

        let startTime = Date.now();

        function shake() {
            const elapsed = Date.now() - startTime;

            if (elapsed < duration) {
                const progress = elapsed / duration;
                const currentIntensity = intensity * (1 - progress);

                const x = (Math.random() - 0.5) * currentIntensity;
                const y = (Math.random() - 0.5) * currentIntensity;

                canvas.style.transform = `translate(${x}px, ${y}px)`;

                requestAnimationFrame(shake);
            } else {
                canvas.style.transform = originalTransform;
            }
        }

        shake();
    }

    // 화면 플래시
    static screenFlash(color = 'rgba(255, 255, 255, 0.5)', duration = 200) {
        const flash = document.createElement('div');
        flash.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: ${color};
            pointer-events: none;
            z-index: 9999;
            animation: flashFade ${duration}ms ease-out;
        `;

        const style = document.createElement('style');
        style.textContent = `
            @keyframes flashFade {
                from { opacity: 1; }
                to { opacity: 0; }
            }
        `;
        document.head.appendChild(style);

        document.body.appendChild(flash);

        setTimeout(() => {
            flash.remove();
            style.remove();
        }, duration);
    }

    // 파티클 효과
    static createParticles(x, y, count = 20, color = '#fbbf24') {
        const canvas = document.getElementById('gameCanvas');
        const container = document.createElement('div');
        container.style.cssText = `
            position: absolute;
            left: ${x}px;
            top: ${y}px;
            pointer-events: none;
        `;

        for (let i = 0; i < count; i++) {
            const particle = document.createElement('div');
            const angle = (Math.PI * 2 * i) / count;
            const velocity = 2 + Math.random() * 3;

            particle.style.cssText = `
                position: absolute;
                width: 8px;
                height: 8px;
                background: ${color};
                border-radius: 50%;
                animation: particleFloat 1s ease-out forwards;
                --vx: ${Math.cos(angle) * velocity * 100}px;
                --vy: ${Math.sin(angle) * velocity * 100}px;
            `;

            container.appendChild(particle);
        }

        const style = document.createElement('style');
        style.textContent = `
            @keyframes particleFloat {
                to {
                    transform: translate(var(--vx), var(--vy));
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);

        canvas.parentElement.appendChild(container);

        setTimeout(() => {
            container.remove();
            style.remove();
        }, 1000);
    }

    // 점수 팝업
    static showScorePopup(x, y, score, color = '#10b981') {
        const popup = document.createElement('div');
        popup.textContent = `+${score}`;
        popup.style.cssText = `
            position: absolute;
            left: ${x}px;
            top: ${y}px;
            color: ${color};
            font-size: 2rem;
            font-weight: bold;
            pointer-events: none;
            text-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
            animation: scorePopup 1s ease-out forwards;
            z-index: 1000;
        `;

        const style = document.createElement('style');
        style.textContent = `
            @keyframes scorePopup {
                0% {
                    opacity: 1;
                    transform: translateY(0) scale(1);
                }
                50% {
                    transform: translateY(-30px) scale(1.2);
                }
                100% {
                    opacity: 0;
                    transform: translateY(-60px) scale(0.8);
                }
            }
        `;
        document.head.appendChild(style);

        document.body.appendChild(popup);

        setTimeout(() => {
            popup.remove();
            style.remove();
        }, 1000);
    }
}

// 사용 예
gameEvents.on('player:hit', () => {
    VisualFeedback.screenShake(300, 15);
    VisualFeedback.screenFlash('rgba(255, 0, 0, 0.3)', 200);
});

gameEvents.on('coin:collected', (x, y, value) => {
    VisualFeedback.createParticles(x, y, 15, '#fbbf24');
    VisualFeedback.showScorePopup(x, y, value, '#10b981');
});
```

### 햅틱 피드백

```javascript
class HapticFeedback {
    static isSupported() {
        return 'vibrate' in navigator;
    }

    // 짧은 진동
    static light() {
        if (this.isSupported()) {
            navigator.vibrate(10);
        }
    }

    // 중간 진동
    static medium() {
        if (this.isSupported()) {
            navigator.vibrate(50);
        }
    }

    // 강한 진동
    static heavy() {
        if (this.isSupported()) {
            navigator.vibrate(100);
        }
    }

    // 패턴 진동
    static pattern(pattern) {
        if (this.isSupported()) {
            navigator.vibrate(pattern);
        }
    }

    // 성공 피드백
    static success() {
        this.pattern([50, 50, 100]);
    }

    // 실패 피드백
    static error() {
        this.pattern([100, 50, 100, 50, 100]);
    }
}

// 사용 예
gameEvents.on('coin:collected', () => {
    HapticFeedback.light();
});

gameEvents.on('player:hit', () => {
    HapticFeedback.heavy();
});

gameEvents.on('game:over', () => {
    HapticFeedback.error();
});
```

---

## 📖 튜토리얼 및 온보딩

```javascript
class TutorialSystem {
    constructor() {
        this.steps = [];
        this.currentStep = 0;
        this.overlay = null;
    }

    addStep(config) {
        this.steps.push(config);
    }

    start() {
        this.currentStep = 0;
        this.showStep(0);
    }

    showStep(index) {
        if (index >= this.steps.length) {
            this.complete();
            return;
        }

        const step = this.steps[index];

        this.overlay = document.createElement('div');
        this.overlay.className = 'tutorial-overlay';
        this.overlay.innerHTML = `
            <div class="tutorial-content">
                <div class="tutorial-icon">${step.icon}</div>
                <h2>${step.title}</h2>
                <p>${step.description}</p>

                ${step.action ? `
                    <div class="tutorial-action">
                        ${step.action}
                    </div>
                ` : ''}

                <div class="tutorial-navigation">
                    <div class="tutorial-progress">
                        ${index + 1} / ${this.steps.length}
                    </div>
                    <button class="tutorial-next">
                        ${index === this.steps.length - 1 ? '시작하기' : '다음'}
                    </button>
                </div>
            </div>
        `;

        this.addStyles();
        document.body.appendChild(this.overlay);

        // 다음 버튼 이벤트
        this.overlay.querySelector('.tutorial-next').addEventListener('click', () => {
            this.next();
        });

        // 커스텀 완료 조건
        if (step.waitFor) {
            gameEvents.on(step.waitFor, () => {
                this.next();
            });
        }
    }

    next() {
        if (this.overlay) {
            this.overlay.remove();
            this.overlay = null;
        }

        this.currentStep++;
        this.showStep(this.currentStep);
    }

    complete() {
        gameEvents.emit('tutorial:completed');
        localStorage.setItem('tutorial_completed', 'true');
    }

    addStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .tutorial-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.9);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10000;
                animation: fadeIn 0.3s;
            }

            .tutorial-content {
                max-width: 500px;
                padding: 3rem;
                background: linear-gradient(135deg, #1e293b, #334155);
                border: 2px solid rgba(99, 102, 241, 0.3);
                border-radius: 24px;
                text-align: center;
                color: white;
            }

            .tutorial-icon {
                font-size: 4rem;
                margin-bottom: 1rem;
            }

            .tutorial-content h2 {
                font-size: 1.8rem;
                margin-bottom: 1rem;
            }

            .tutorial-content p {
                color: #cbd5e1;
                line-height: 1.6;
                margin-bottom: 2rem;
            }

            .tutorial-action {
                padding: 1.5rem;
                background: rgba(99, 102, 241, 0.1);
                border: 2px dashed #6366f1;
                border-radius: 12px;
                margin-bottom: 2rem;
            }

            .tutorial-navigation {
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            .tutorial-progress {
                color: #94a3b8;
                font-size: 0.9rem;
            }

            .tutorial-next {
                padding: 0.75rem 2rem;
                background: linear-gradient(135deg, #6366f1, #8b5cf6);
                color: white;
                border: none;
                border-radius: 12px;
                font-size: 1.1rem;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s;
            }

            .tutorial-next:hover {
                transform: translateY(-2px);
                box-shadow: 0 10px 20px rgba(99, 102, 241, 0.3);
            }
        `;
        document.head.appendChild(style);
    }
}

// 튜토리얼 설정
const tutorial = new TutorialSystem();

tutorial.addStep({
    icon: '📱',
    title: '모바일 연결',
    description: 'QR 코드를 스캔하거나 세션 코드를 입력하여 핸드폰을 연결하세요.',
    waitFor: 'sensor:connected'
});

tutorial.addStep({
    icon: '🎮',
    title: '센서 조작',
    description: '핸드폰을 기울여서 캐릭터를 움직여보세요!',
    action: '<div style="font-size: 3rem;">📱 ↔️</div>'
});

tutorial.addStep({
    icon: '🎯',
    title: '목표',
    description: '코인을 모으고 적을 피하며 최고 점수를 달성하세요!',
});

// 최초 방문 시 튜토리얼 표시
if (!localStorage.getItem('tutorial_completed')) {
    sdk.on('connected', () => {
        tutorial.start();
    });
}
```

---

## 🎓 핵심 원칙 요약

1. **최소주의**: 센서 조작에 방해되지 않는 간결한 UI
2. **대형 터치**: 모바일에 최적화된 큰 터치 영역
3. **즉각 피드백**: 시각/청각/햅틱 피드백으로 반응성 향상
4. **명확한 온보딩**: 직관적인 튜토리얼로 진입 장벽 감소
5. **접근성**: 모든 사용자가 쉽게 사용할 수 있는 디자인

---

## 📖 다음 단계

- [성능 최적화](./06-performance-optimization.md)
- [SessionSDK 심화](./02-sessionsdk-advanced.md)
- [물리 엔진](./04-physics-engine.md)
