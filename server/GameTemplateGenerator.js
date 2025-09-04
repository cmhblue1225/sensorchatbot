/**
 * 🎮 GameTemplateGenerator v1.0
 * 
 * 게임 타입별 특화 템플릿 생성 시스템
 * - Solo, Dual, Multi 게임 타입별 최적화된 템플릿 제공
 * - 장르와 타입의 조합에 따른 맞춤형 코드 생성
 * - 검증된 패턴과 베스트 프랙티스 적용
 */

const fs = require('fs').promises;
const path = require('path');

class GameTemplateGenerator {
    constructor() {
        // 게임 타입별 기본 구조 정의
        this.gameTypeTemplates = {
            solo: {
                maxSensors: 1,
                sessionSDKConfig: 'solo',
                description: '1개 센서로 플레이하는 개인 게임',
                characteristics: ['개인 플레이', '점수 경쟁', '스킬 향상'],
                commonPatterns: ['개인 기록', '난이도 조절', '즉시 시작']
            },
            dual: {
                maxSensors: 2,
                sessionSDKConfig: 'dual',
                description: '2개 센서로 협력하는 게임',
                characteristics: ['협력 플레이', '역할 분담', '소통 필요'],
                commonPatterns: ['협력 미션', '동기화', '공동 목표']
            },
            multi: {
                maxSensors: 8,
                sessionSDKConfig: 'multi',
                description: '3-8명이 함께하는 경쟁 게임',
                characteristics: ['다중 플레이어', '실시간 경쟁', '순위 시스템'],
                commonPatterns: ['실시간 랭킹', '플레이어 식별', '공정한 경쟁']
            }
        };

        // 장르별 타입 적합도 매트릭스
        this.genreTypeCompatibility = {
            physics: {
                solo: { score: 9, examples: ['볼 굴리기', '중력 퍼즐', '물리 시뮬레이션'] },
                dual: { score: 7, examples: ['협력 블록 쌓기', '시소 게임', '공동 건설'] },
                multi: { score: 6, examples: ['물리 경주', '공 놓기 경쟁', '충돌 배틀'] }
            },
            cooking: {
                solo: { score: 8, examples: ['개인 레시피', '요리 연습', '타이밍 게임'] },
                dual: { score: 9, examples: ['협력 요리', '재료 나누기', '레스토랑 운영'] },
                multi: { score: 7, examples: ['요리 경연', '팀 대항전', '마스터 셰프'] }
            },
            action: {
                solo: { score: 9, examples: ['슈팅 게임', '회피 액션', '반응속도'] },
                dual: { score: 8, examples: ['협력 슈팅', '백투백', '팀 배틀'] },
                multi: { score: 10, examples: ['배틀 로얄', '팀 데스매치', '생존 게임'] }
            },
            puzzle: {
                solo: { score: 10, examples: ['논리 퍼즐', '미로 탈출', '패턴 매칭'] },
                dual: { score: 8, examples: ['협력 퍼즐', '정보 공유', '역할 분담'] },
                multi: { score: 6, examples: ['퍼즐 경쟁', '빠른 해결', '지식 퀴즈'] }
            },
            racing: {
                solo: { score: 8, examples: ['타임 어택', '개인 기록', '코스 마스터'] },
                dual: { score: 7, examples: ['릴레이 레이스', '팀 레이싱', '협력 주행'] },
                multi: { score: 10, examples: ['멀티 레이싱', '순위 경쟁', '토너먼트'] }
            }
        };

        // 타입별 핵심 코드 패턴
        this.corePatterns = {
            solo: {
                sessionManagement: this.getSoloSessionPattern(),
                gameLogic: this.getSoloGameLogicPattern(),
                uiStructure: this.getSoloUIPattern()
            },
            dual: {
                sessionManagement: this.getDualSessionPattern(),
                gameLogic: this.getDualGameLogicPattern(),
                uiStructure: this.getDualUIPattern()
            },
            multi: {
                sessionManagement: this.getMultiSessionPattern(),
                gameLogic: this.getMultiGameLogicPattern(),
                uiStructure: this.getMultiUIPattern()
            }
        };
    }

    /**
     * 게임 타입과 장르에 최적화된 템플릿 생성
     */
    generateOptimizedTemplate(gameType, genre, requirements) {
        console.log(`🎮 ${gameType} 타입 ${genre} 장르 템플릿 생성 시작`);

        // 적합도 검증
        const compatibility = this.validateTypeGenreCompatibility(gameType, genre);
        
        // 최적화된 템플릿 구조 생성
        const template = {
            metadata: this.generateTemplateMetadata(gameType, genre, requirements, compatibility),
            structure: this.generateTemplateStructure(gameType, genre),
            codePatterns: this.generateCodePatterns(gameType, genre, requirements),
            recommendations: this.generateRecommendations(gameType, genre, compatibility)
        };

        console.log(`✅ ${gameType} 템플릿 생성 완료 (적합도: ${compatibility.score}/10)`);
        return template;
    }

    /**
     * 타입-장르 적합도 검증
     */
    validateTypeGenreCompatibility(gameType, genre) {
        const genreData = this.genreTypeCompatibility[genre];
        if (!genreData) {
            return { score: 5, warning: '알 수 없는 장르', examples: [] };
        }

        const typeData = genreData[gameType];
        if (!typeData) {
            return { score: 5, warning: '지원되지 않는 타입', examples: [] };
        }

        return {
            score: typeData.score,
            examples: typeData.examples,
            recommendation: this.getCompatibilityRecommendation(typeData.score)
        };
    }

    /**
     * 적합도 기반 권장사항 생성
     */
    getCompatibilityRecommendation(score) {
        if (score >= 9) return '매우 적합한 조합입니다';
        if (score >= 7) return '좋은 조합입니다';
        if (score >= 5) return '가능한 조합이지만 최적화 필요';
        return '다른 타입을 고려해보세요';
    }

    /**
     * 템플릿 메타데이터 생성
     */
    generateTemplateMetadata(gameType, genre, requirements, compatibility) {
        return {
            gameType: gameType,
            genre: genre,
            compatibility: compatibility,
            generatedAt: new Date().toISOString(),
            description: `${this.gameTypeTemplates[gameType].description} - ${genre} 장르`,
            characteristics: [
                ...this.gameTypeTemplates[gameType].characteristics,
                ...compatibility.examples.slice(0, 2)
            ],
            maxSensors: this.gameTypeTemplates[gameType].maxSensors,
            estimatedDifficulty: this.calculateEstimatedDifficulty(gameType, genre),
            developmentTips: this.generateDevelopmentTips(gameType, genre)
        };
    }

    /**
     * 템플릿 구조 생성
     */
    generateTemplateStructure(gameType, genre) {
        const baseStructure = {
            html: this.generateHTMLStructure(gameType),
            css: this.generateCSSStructure(gameType, genre),
            javascript: this.generateJavaScriptStructure(gameType, genre)
        };

        return baseStructure;
    }

    /**
     * HTML 구조 생성
     */
    generateHTMLStructure(gameType) {
        return {
            doctype: '<!DOCTYPE html>',
            head: this.generateHeadSection(gameType),
            body: this.generateBodyStructure(gameType)
        };
    }

    /**
     * Head 섹션 생성
     */
    generateHeadSection(gameType) {
        return {
            meta: [
                '<meta charset="UTF-8">',
                '<meta name="viewport" content="width=device-width, initial-scale=1.0">',
                `<title>{{GAME_TITLE}} - ${gameType.toUpperCase()} Game</title>`
            ],
            scripts: [
                '<script src="/socket.io/socket.io.js"></script>',
                '<script src="https://unpkg.com/qrcode@1.5.3/build/qrcode.min.js"></script>',
                '<script src="/js/SessionSDK.js"></script>'
            ],
            styles: [
                '<style>{{CSS_CONTENT}}</style>'
            ]
        };
    }

    /**
     * Body 구조 생성
     */
    generateBodyStructure(gameType) {
        const commonElements = [
            '<canvas id="gameCanvas"></canvas>',
            '<div class="game-ui">{{UI_CONTENT}}</div>'
        ];

        const typeSpecificElements = {
            solo: [
                '<div class="ui-panel score-panel">{{SCORE_PANEL}}</div>',
                '<div class="ui-panel status-panel">{{STATUS_PANEL}}</div>'
            ],
            dual: [
                '<div class="ui-panel players-panel">{{PLAYERS_PANEL}}</div>',
                '<div class="ui-panel cooperation-panel">{{COOP_PANEL}}</div>'
            ],
            multi: [
                '<div class="ui-panel ranking-panel">{{RANKING_PANEL}}</div>',
                '<div class="ui-panel players-list">{{PLAYERS_LIST}}</div>'
            ]
        };

        return {
            common: commonElements,
            typeSpecific: typeSpecificElements[gameType] || [],
            sessionPanel: '<div class="ui-panel session-panel" id="sessionPanel">{{SESSION_CONTENT}}</div>',
            controls: '<div class="ui-panel controls-panel">{{CONTROLS_CONTENT}}</div>',
            script: '<script>{{JAVASCRIPT_CONTENT}}</script>'
        };
    }

    /**
     * 코드 패턴 생성
     */
    generateCodePatterns(gameType, genre, requirements) {
        return {
            sessionSDK: this.corePatterns[gameType].sessionManagement,
            gameLogic: this.corePatterns[gameType].gameLogic,
            uiManagement: this.corePatterns[gameType].uiStructure,
            sensorHandling: this.generateSensorHandlingPattern(gameType, genre),
            gameSpecific: this.generateGameSpecificPatterns(gameType, genre, requirements)
        };
    }

    /**
     * Solo 게임 세션 패턴
     */
    getSoloSessionPattern() {
        return `
// Solo 게임 세션 관리
class SoloGameSession {
    constructor() {
        this.sdk = new SessionSDK({
            gameId: '{{GAME_ID}}',
            gameType: 'solo',
            debug: true
        });
        
        this.state = {
            connected: false,
            sensorConnected: false,
            playing: false,
            score: 0,
            personalBest: localStorage.getItem('{{GAME_ID}}_best') || 0
        };
        
        this.setupEvents();
    }
    
    setupEvents() {
        this.sdk.on('connected', async () => {
            this.state.connected = true;
            this.updateServerStatus(true);
            await this.createGameSession();
        });
        
        this.sdk.on('session-created', (event) => {
            const session = event.detail || event;
            this.displaySessionInfo(session);
        });
        
        this.sdk.on('sensor-connected', (event) => {
            const data = event.detail || event;
            this.state.sensorConnected = true;
            this.hideSessionPanel();
            this.startGame();
        });
        
        this.sdk.on('sensor-data', (event) => {
            const data = event.detail || event;
            this.processSensorData(data);
        });
    }
    
    updateScore(points) {
        this.state.score += points;
        if (this.state.score > this.state.personalBest) {
            this.state.personalBest = this.state.score;
            localStorage.setItem('{{GAME_ID}}_best', this.state.personalBest);
            this.showPersonalBestUpdate();
        }
        this.updateScoreDisplay();
    }
}`;
    }

    /**
     * Dual 게임 세션 패턴
     */
    getDualSessionPattern() {
        return `
// Dual 게임 세션 관리
class DualGameSession {
    constructor() {
        this.sdk = new SessionSDK({
            gameId: '{{GAME_ID}}',
            gameType: 'dual',
            debug: true
        });
        
        this.state = {
            connected: false,
            players: {},
            playersConnected: 0,
            gameStarted: false,
            teamScore: 0,
            cooperation: 0
        };
        
        this.setupEvents();
    }
    
    setupEvents() {
        this.sdk.on('connected', async () => {
            this.state.connected = true;
            this.updateServerStatus(true);
            await this.createGameSession();
        });
        
        this.sdk.on('session-created', (event) => {
            const session = event.detail || event;
            this.displaySessionInfo(session);
            this.showWaitingMessage('2명의 플레이어 대기 중...');
        });
        
        this.sdk.on('sensor-connected', (event) => {
            const data = event.detail || event;
            this.addPlayer(data.sensorId);
            this.updatePlayersDisplay();
            
            if (this.state.playersConnected >= 2) {
                this.hideSessionPanel();
                this.startCooperativeGame();
            }
        });
        
        this.sdk.on('sensor-disconnected', (event) => {
            const data = event.detail || event;
            this.removePlayer(data.sensorId);
            this.updatePlayersDisplay();
        });
        
        this.sdk.on('sensor-data', (event) => {
            const data = event.detail || event;
            this.processPlayerSensorData(data);
        });
    }
    
    addPlayer(sensorId) {
        if (!this.state.players[sensorId]) {
            this.state.players[sensorId] = {
                id: sensorId,
                role: this.assignPlayerRole(),
                ready: true,
                contribution: 0
            };
            this.state.playersConnected++;
        }
    }
    
    assignPlayerRole() {
        const roles = ['Player 1', 'Player 2'];
        return roles[this.state.playersConnected] || 'Observer';
    }
}`;
    }

    /**
     * Multi 게임 세션 패턴
     */
    getMultiSessionPattern() {
        return `
// Multi 게임 세션 관리
class MultiGameSession {
    constructor() {
        this.sdk = new SessionSDK({
            gameId: '{{GAME_ID}}',
            gameType: 'multi',
            debug: true
        });
        
        this.state = {
            connected: false,
            players: {},
            playersConnected: 0,
            gameStarted: false,
            rankings: [],
            gamePhase: 'waiting' // waiting, ready, playing, finished
        };
        
        this.setupEvents();
    }
    
    setupEvents() {
        this.sdk.on('connected', async () => {
            this.state.connected = true;
            this.updateServerStatus(true);
            await this.createGameSession();
        });
        
        this.sdk.on('session-created', (event) => {
            const session = event.detail || event;
            this.displaySessionInfo(session);
            this.showWaitingMessage('최소 3명 필요 (최대 8명)');
        });
        
        this.sdk.on('sensor-connected', (event) => {
            const data = event.detail || event;
            this.addPlayer(data.sensorId);
            this.updatePlayersDisplay();
            
            if (this.state.playersConnected >= 3) {
                this.enableGameStart();
            }
        });
        
        this.sdk.on('sensor-disconnected', (event) => {
            const data = event.detail || event;
            this.removePlayer(data.sensorId);
            this.updatePlayersDisplay();
            this.updateRankings();
        });
        
        this.sdk.on('sensor-data', (event) => {
            const data = event.detail || event;
            this.processPlayerSensorData(data);
            this.updateRealTimeRankings();
        });
    }
    
    addPlayer(sensorId) {
        if (!this.state.players[sensorId] && this.state.playersConnected < 8) {
            this.state.players[sensorId] = {
                id: sensorId,
                name: \`Player \${this.state.playersConnected + 1}\`,
                score: 0,
                rank: this.state.playersConnected + 1,
                alive: true,
                lastActivity: Date.now()
            };
            this.state.playersConnected++;
        }
    }
    
    updateRealTimeRankings() {
        this.state.rankings = Object.values(this.state.players)
            .sort((a, b) => b.score - a.score)
            .map((player, index) => ({
                ...player,
                rank: index + 1
            }));
        
        this.displayRankings();
    }
}`;
    }

    /**
     * 게임 로직 패턴 생성
     */
    getSoloGameLogicPattern() {
        return `
// Solo 게임 로직
class SoloGameLogic {
    constructor() {
        this.gameConfig = {
            difficulty: 1,
            progressionRate: 0.1,
            scoreMultiplier: 1
        };
    }
    
    startGame() {
        this.resetGameState();
        this.startGameLoop();
        this.showGameInstructions();
    }
    
    gameLoop() {
        if (!this.state.playing) return;
        
        this.updateGameLogic();
        this.checkProgressiveElements();
        this.render();
        
        requestAnimationFrame(() => this.gameLoop());
    }
    
    checkProgressiveElements() {
        // 난이도 점진적 증가
        if (this.state.score > this.gameConfig.difficulty * 100) {
            this.increaseDifficulty();
        }
        
        // 개인 목표 달성 체크
        this.checkPersonalMilestones();
    }
    
    increaseDifficulty() {
        this.gameConfig.difficulty += this.gameConfig.progressionRate;
        this.gameConfig.scoreMultiplier += 0.1;
        this.showDifficultyIncrease();
    }
}`;
    }

    /**
     * Dual 게임 로직 패턴
     */
    getDualGameLogicPattern() {
        return `
// Dual 게임 로직
class DualGameLogic {
    constructor() {
        this.gameConfig = {
            cooperationBonus: 1.5,
            syncRequired: true,
            teamGoals: [],
            currentObjective: null
        };
    }
    
    startCooperativeGame() {
        this.initializeTeamObjectives();
        this.startGameLoop();
        this.showCooperationInstructions();
    }
    
    gameLoop() {
        if (!this.state.gameStarted) return;
        
        this.updateCooperativeLogic();
        this.checkTeamSynchronization();
        this.updateTeamProgress();
        this.render();
        
        requestAnimationFrame(() => this.gameLoop());
    }
    
    checkTeamSynchronization() {
        const players = Object.values(this.state.players);
        if (players.length >= 2) {
            const timeDiff = Math.abs(players[0].lastActivity - players[1].lastActivity);
            const isSync = timeDiff < 500; // 500ms 동기화 허용
            
            if (isSync) {
                this.applyCooperationBonus();
                this.state.cooperation = Math.min(100, this.state.cooperation + 5);
            } else {
                this.state.cooperation = Math.max(0, this.state.cooperation - 2);
            }
        }
    }
    
    applyCooperationBonus() {
        const bonus = Math.floor(this.gameConfig.cooperationBonus * this.state.cooperation);
        this.state.teamScore += bonus;
        this.showCooperationSuccess(bonus);
    }
}`;
    }

    /**
     * Multi 게임 로직 패턴
     */
    getMultiGameLogicPattern() {
        return `
// Multi 게임 로직
class MultiGameLogic {
    constructor() {
        this.gameConfig = {
            maxPlayers: 8,
            minPlayers: 3,
            gameMode: 'competitive', // 'competitive', 'survival', 'tournament'
            roundDuration: 60000,
            eliminationMode: false
        };
    }
    
    startCompetitiveGame() {
        this.initializeCompetition();
        this.startCountdown();
    }
    
    gameLoop() {
        if (!this.state.gameStarted) return;
        
        this.updateCompetitiveLogic();
        this.processPlayerInteractions();
        this.updateLiveRankings();
        this.checkEliminationConditions();
        this.render();
        
        requestAnimationFrame(() => this.gameLoop());
    }
    
    processPlayerInteractions() {
        Object.values(this.state.players).forEach(player => {
            if (player.alive) {
                this.updatePlayerPosition(player);
                this.checkPlayerCollisions(player);
                this.updatePlayerScore(player);
            }
        });
    }
    
    checkEliminationConditions() {
        if (this.gameConfig.eliminationMode) {
            const alivePlayers = Object.values(this.state.players)
                .filter(p => p.alive);
            
            if (alivePlayers.length <= 1) {
                this.endGame(alivePlayers[0]);
            }
        }
    }
    
    updateLiveRankings() {
        this.state.rankings = Object.values(this.state.players)
            .filter(p => p.alive)
            .sort((a, b) => b.score - a.score)
            .map((player, index) => ({
                ...player,
                rank: index + 1,
                rankChange: this.calculateRankChange(player, index + 1)
            }));
    }
}`;
    }

    /**
     * UI 패턴 생성
     */
    getSoloUIPattern() {
        return `
// Solo UI 관리
class SoloUI {
    constructor() {
        this.elements = {
            score: document.getElementById('scoreValue'),
            personalBest: document.getElementById('personalBest'),
            progress: document.getElementById('progressBar'),
            achievements: document.getElementById('achievements')
        };
    }
    
    updateScoreDisplay() {
        this.elements.score.textContent = this.state.score;
        this.elements.personalBest.textContent = this.state.personalBest;
        
        // 애니메이션 효과
        this.elements.score.classList.add('score-update');
        setTimeout(() => {
            this.elements.score.classList.remove('score-update');
        }, 300);
    }
    
    showPersonalBestUpdate() {
        this.showNotification('🏆 새로운 개인 기록!', 'success');
        this.elements.personalBest.classList.add('new-record');
    }
    
    updateProgressBar(progress) {
        this.elements.progress.style.width = \`\${progress}%\`;
    }
}`;
    }

    /**
     * Dual UI 패턴
     */
    getDualUIPattern() {
        return `
// Dual UI 관리
class DualUI {
    constructor() {
        this.elements = {
            teamScore: document.getElementById('teamScore'),
            cooperation: document.getElementById('cooperationMeter'),
            player1Status: document.getElementById('player1Status'),
            player2Status: document.getElementById('player2Status'),
            objective: document.getElementById('currentObjective')
        };
    }
    
    updatePlayersDisplay() {
        const players = Object.values(this.state.players);
        
        players.forEach((player, index) => {
            const statusElement = this.elements[\`player\${index + 1}Status\`];
            if (statusElement) {
                statusElement.innerHTML = \`
                    <div class="player-info">
                        <span class="player-name">\${player.role}</span>
                        <div class="player-status \${player.ready ? 'ready' : 'waiting'}">
                            \${player.ready ? '준비완료' : '연결 대기'}
                        </div>
                        <div class="contribution-bar">
                            <div class="contribution-fill" style="width: \${player.contribution}%"></div>
                        </div>
                    </div>
                \`;
            }
        });
    }
    
    updateCooperationMeter() {
        this.elements.cooperation.style.width = \`\${this.state.cooperation}%\`;
        this.elements.cooperation.className = \`cooperation-meter \${this.getCooperationLevel()}\`;
    }
    
    getCooperationLevel() {
        if (this.state.cooperation >= 80) return 'excellent';
        if (this.state.cooperation >= 60) return 'good';
        if (this.state.cooperation >= 40) return 'fair';
        return 'poor';
    }
}`;
    }

    /**
     * Multi UI 패턴
     */
    getMultiUIPattern() {
        return `
// Multi UI 관리
class MultiUI {
    constructor() {
        this.elements = {
            rankingsList: document.getElementById('rankingsList'),
            playerCount: document.getElementById('playerCount'),
            gameStatus: document.getElementById('gameStatus'),
            leaderboard: document.getElementById('leaderboard')
        };
    }
    
    displayRankings() {
        const rankingsHTML = this.state.rankings.map(player => \`
            <div class="ranking-item rank-\${player.rank}">
                <div class="rank-number">\${player.rank}</div>
                <div class="player-info">
                    <span class="player-name">\${player.name}</span>
                    <span class="player-score">\${player.score}</span>
                    \${player.rankChange ? \`<span class="rank-change \${player.rankChange > 0 ? 'up' : 'down'}">\${player.rankChange}</span>\` : ''}
                </div>
                <div class="player-status \${player.alive ? 'alive' : 'eliminated'}">
                    \${player.alive ? '플레이 중' : '탈락'}
                </div>
            </div>
        \`).join('');
        
        this.elements.rankingsList.innerHTML = rankingsHTML;
    }
    
    updatePlayerCount() {
        this.elements.playerCount.textContent = \`\${this.state.playersConnected}/8\`;
    }
    
    showGamePhaseStatus() {
        const phaseMessages = {
            waiting: '플레이어 대기 중...',
            ready: '게임 시작 준비',
            playing: '게임 진행 중',
            finished: '게임 종료'
        };
        
        this.elements.gameStatus.textContent = phaseMessages[this.state.gamePhase];
    }
}`;
    }

    /**
     * 센서 처리 패턴 생성
     */
    generateSensorHandlingPattern(gameType, genre) {
        const basePattern = `
processSensorData(data) {
    const sensorData = data.data;
    const sensorId = data.sensorId;
    
    // 센서 데이터 검증
    if (!sensorData || !sensorId) {
        console.warn('Invalid sensor data received');
        return;
    }
    
    // 기본 센서 데이터 처리
    this.updateSensorData(sensorId, sensorData);
    
    // 게임 상태 확인
    if (!this.state.gameStarted || this.state.paused) {
        return;
    }
    
    // 타입별 특화 처리
    ${this.getTypeSpecificSensorHandling(gameType)}
}`;

        return basePattern;
    }

    /**
     * 타입별 특화 센서 처리
     */
    getTypeSpecificSensorHandling(gameType) {
        const patterns = {
            solo: `
    // Solo: 단일 센서 데이터를 직접 게임에 적용
    this.applySensorToGame(sensorData);
    this.updatePersonalProgress(sensorData);`,
            
            dual: `
    // Dual: 2개 센서의 협력적 처리
    this.updatePlayerSensorData(sensorId, sensorData);
    this.checkPlayerSynchronization();
    this.applyCooperativeSensorLogic();`,
            
            multi: `
    // Multi: 다중 플레이어 센서 데이터 관리
    this.updatePlayerSensorData(sensorId, sensorData);
    this.processCompetitiveSensorData(sensorId, sensorData);
    this.updatePlayerRanking(sensorId);`
        };

        return patterns[gameType] || patterns.solo;
    }

    /**
     * 추정 난이도 계산
     */
    calculateEstimatedDifficulty(gameType, genre) {
        const typeDifficulty = {
            solo: 1,
            dual: 2,
            multi: 3
        };

        const genreDifficulty = {
            physics: 2,
            cooking: 1,
            action: 3,
            puzzle: 2,
            racing: 2
        };

        const totalDifficulty = (typeDifficulty[gameType] || 1) + (genreDifficulty[genre] || 1);
        
        if (totalDifficulty >= 5) return 'Hard';
        if (totalDifficulty >= 3) return 'Medium';
        return 'Easy';
    }

    /**
     * 개발 팁 생성
     */
    generateDevelopmentTips(gameType, genre) {
        const typeTips = {
            solo: [
                '개인 기록 저장 시스템 구현',
                '점진적 난이도 증가 고려',
                '즉시 피드백 제공'
            ],
            dual: [
                '플레이어 간 동기화 중요',
                '역할 분담 명확화',
                '협력 보상 시스템 구현'
            ],
            multi: [
                '실시간 순위 업데이트',
                '공정한 경쟁 환경 조성',
                '플레이어 식별 시스템'
            ]
        };

        const genreTips = {
            physics: ['물리 법칙 일관성 유지', '충돌 검증 정확성'],
            cooking: ['타이밍 시스템 정밀도', '진행도 시각화'],
            action: ['반응속도 최적화', '콤보 시스템 설계'],
            puzzle: ['힌트 시스템 구현', '단계별 안내'],
            racing: ['조작감 최적화', '공정한 출발선']
        };

        return [
            ...(typeTips[gameType] || []),
            ...(genreTips[genre] || [])
        ];
    }

    /**
     * 권장사항 생성
     */
    generateRecommendations(gameType, genre, compatibility) {
        return {
            compatibility: compatibility,
            bestPractices: this.getBestPractices(gameType, genre),
            commonPitfalls: this.getCommonPitfalls(gameType, genre),
            optimizationTips: this.getOptimizationTips(gameType, genre),
            testingStrategy: this.getTestingStrategy(gameType)
        };
    }

    /**
     * 베스트 프랙티스
     */
    getBestPractices(gameType, genre) {
        return [
            `${gameType} 게임은 ${this.gameTypeTemplates[gameType].maxSensors}개 센서 최적화 필요`,
            `${genre} 장르 특성에 맞는 피드백 시스템 구현`,
            '에러 처리 및 복구 메커니즘 구현',
            '성능 모니터링 및 최적화'
        ];
    }

    /**
     * 공통 함정들
     */
    getCommonPitfalls(gameType, genre) {
        const typePitfalls = {
            solo: ['개인 기록 저장 실패', '난이도 급상승'],
            dual: ['동기화 실패', '불균형한 역할 분담'],
            multi: ['네트워크 지연', '불공정한 경쟁 조건']
        };

        return typePitfalls[gameType] || [];
    }

    /**
     * 최적화 팁
     */
    getOptimizationTips(gameType, genre) {
        return [
            '센서 데이터 스로틀링 적용',
            '불필요한 렌더링 최소화',
            '메모리 누수 방지',
            '브라우저 호환성 확보'
        ];
    }

    /**
     * 테스트 전략
     */
    getTestingStrategy(gameType) {
        const strategies = {
            solo: ['개인 플레이 시나리오', '기록 갱신 테스트', '난이도 전환 테스트'],
            dual: ['협력 시나리오', '동기화 테스트', '연결 해제 복구'],
            multi: ['다중 플레이어 동시 접속', '순위 시스템 정확성', '지연 상황 대응']
        };

        return strategies[gameType] || strategies.solo;
    }

    /**
     * 완전한 템플릿 HTML 생성
     */
    generateCompleteTemplate(gameType, genre, requirements) {
        const template = this.generateOptimizedTemplate(gameType, genre, requirements);
        
        // HTML 템플릿 조합
        const html = this.assembleHTMLTemplate(template);
        
        return {
            template: template,
            html: html,
            recommendations: template.recommendations
        };
    }

    /**
     * HTML 템플릿 조합
     */
    assembleHTMLTemplate(template) {
        return `<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{GAME_TITLE}} - ${template.metadata.gameType.toUpperCase()} Game</title>
    
    <!-- 필수 스크립트 -->
    <script src="/socket.io/socket.io.js"></script>
    <script src="https://unpkg.com/qrcode@1.5.3/build/qrcode.min.js"></script>
    <script src="/js/SessionSDK.js"></script>
    
    <style>
        {{CSS_CONTENT}}
    </style>
</head>
<body>
    <!-- 게임 캔버스 -->
    <canvas id="gameCanvas"></canvas>
    
    <!-- 게임 UI -->
    <div class="game-ui">
        {{UI_CONTENT}}
        
        <!-- 세션 패널 -->
        <div class="ui-panel session-panel" id="sessionPanel">
            <div class="session-info">
                <h3>게임 세션</h3>
                <div class="session-code">
                    <span>세션 코드: </span>
                    <strong id="session-code-display">-</strong>
                </div>
                <div class="qr-container" id="qrContainer">
                    QR 코드 생성 중...
                </div>
            </div>
            
            <div class="connection-status">
                <div class="sensor-status">
                    <span>📱 센서:</span>
                    <span class="status-indicator waiting" id="sensor-status">대기중</span>
                </div>
            </div>
            
            <button id="start-game-btn" disabled>게임 시작</button>
        </div>
    </div>

    <script>
        // 게임 메인 클래스
        class {{GAME_CLASS_NAME}} {
            constructor() {
                this.initializeGame();
                this.setupSDK();
                this.setupUI();
            }
            
            ${template.codePatterns.sessionSDK}
            
            ${template.codePatterns.gameLogic}
            
            ${template.codePatterns.sensorHandling}
            
            ${template.codePatterns.uiManagement}
        }
        
        // 게임 시작
        document.addEventListener('DOMContentLoaded', () => {
            const game = new {{GAME_CLASS_NAME}}();
        });
    </script>
</body>
</html>`;
    }
}

module.exports = GameTemplateGenerator;