/**
 * 🏗️ GameTemplateEngine v1.0
 * 
 * 게임 사양을 바탕으로 완전한 HTML 게임 코드를 생성하는 템플릿 엔진
 * - 게임 장르별 템플릿 관리
 * - 동적 코드 생성 및 조립
 * - SessionSDK 통합 코드 자동 생성
 */

class GameTemplateEngine {
    constructor() {
        // 게임 템플릿 저장소
        this.templates = new Map();
        this.initializeTemplates();
    }

    /**
     * 게임 템플릿 초기화
     */
    initializeTemplates() {
        // 기본 HTML 구조 템플릿
        this.templates.set('base', {
            html: this.getBaseHTMLTemplate(),
            css: this.getBaseCSSTemplate(),
            js: this.getBaseJSTemplate()
        });

        // 장르별 게임 로직 템플릿
        this.templates.set('platformer', this.getPlatformerTemplate());
        this.templates.set('puzzle', this.getPuzzleTemplate());
        this.templates.set('racing', this.getRacingTemplate());
        this.templates.set('arcade', this.getArcadeTemplate());
        this.templates.set('action', this.getActionTemplate());
    }

    /**
     * 게임 사양을 바탕으로 완전한 HTML 게임 생성
     */
    async generateGame(gameSpec) {
        try {
            console.log(`🏗️ 게임 생성 시작: ${gameSpec.suggestedTitle}`);

            // 1. 기본 템플릿 선택
            const baseTemplate = this.templates.get('base');
            let genreTemplate = this.templates.get(gameSpec.genre);
            
            // 2. 동적 템플릿 생성 (기존 템플릿이 없는 경우)
            if (!genreTemplate) {
                console.log(`🔧 "${gameSpec.genre}" 템플릿이 없습니다. 동적 생성을 시도합니다...`);
                genreTemplate = await this.generateDynamicTemplate(gameSpec);
                
                // 생성된 템플릿 캐싱
                if (genreTemplate) {
                    this.templates.set(`dynamic_${gameSpec.genre}_${Date.now()}`, genreTemplate);
                    console.log(`✅ 동적 템플릿 생성 및 캐싱 완료`);
                } else {
                    console.log(`⚠️ 동적 템플릿 생성 실패, 기본 arcade 템플릿 사용`);
                    genreTemplate = this.templates.get('arcade');
                }
            }

            // 2. 게임별 설정 생성
            const gameConfig = this.generateGameConfig(gameSpec);

            // 3. 게임 로직 생성
            const gameLogic = this.generateGameLogic(gameSpec, genreTemplate);

            // 4. 센서 처리 로직 생성
            const sensorLogic = this.generateSensorLogic(gameSpec);

            // 5. UI 컴포넌트 생성
            const uiComponents = this.generateUIComponents(gameSpec);

            // 6. 전체 HTML 조립
            const completeHTML = this.assembleHTML({
                gameSpec,
                gameConfig,
                gameLogic,
                sensorLogic,
                uiComponents,
                baseTemplate
            });

            console.log('✅ 게임 생성 완료');
            return {
                success: true,
                gameId: gameSpec.suggestedGameId,
                title: gameSpec.suggestedTitle,
                html: completeHTML,
                metadata: this.generateGameMetadata(gameSpec)
            };

        } catch (error) {
            console.error('❌ 게임 생성 실패:', error);
            throw error;
        }
    }

    /**
     * 동적 템플릿 생성 - AI 기반으로 새로운 게임 템플릿 생성
     */
    async generateDynamicTemplate(gameSpec) {
        try {
            console.log(`🤖 AI 기반 동적 템플릿 생성 중...`);
            
            // AI를 위한 템플릿 생성 프롬프트
            const templatePrompt = `다음 게임 사양을 바탕으로 JavaScript 게임 템플릿을 생성해주세요:

게임 정보:
- 제목: ${gameSpec.suggestedTitle}
- 장르: ${gameSpec.genre}
- 타입: ${gameSpec.gameType}
- 센서: ${gameSpec.sensorMechanics.join(', ')}
- 목표: ${gameSpec.objective}
- 규칙: ${gameSpec.rules.join(', ')}
- 원본 요청: ${gameSpec.originalInput}

다음 JSON 형식으로 게임 템플릿을 생성해주세요:
{
    "gameLogic": "게임 초기화 코드 (변수, 오브젝트 설정)",
    "updateLogic": "게임 업데이트 로직 (매 프레임 실행)",
    "renderLogic": "게임 렌더링 로직 (화면 그리기)",
    "sensorLogic": "센서 데이터 처리 로직",
    "resetLogic": "게임 리셋 로직",
    "helperMethods": "도우미 메서드들"
}

요구사항:
1. Canvas 2D 기반 게임으로 작성
2. 모든 코드는 JavaScript로 작성
3. SessionSDK와 호환되는 센서 처리
4. 완전히 동작하는 게임 로직 포함
5. 창의적이고 독특한 게임 메커니즘 적용

JSON만 반환해주세요:`;

            // AIAssistant 인스턴스가 필요하므로 생성자에서 받아와야 함
            // 현재는 간단한 기본 템플릿을 생성
            const dynamicTemplate = this.generateBasicDynamicTemplate(gameSpec);
            
            return dynamicTemplate;

        } catch (error) {
            console.error('❌ 동적 템플릿 생성 실패:', error);
            return null;
        }
    }

    /**
     * 기본 동적 템플릿 생성 (AI 없이)
     */
    generateBasicDynamicTemplate(gameSpec) {
        console.log(`🔧 기본 동적 템플릿 생성: ${gameSpec.genre}`);
        
        // 게임 타입별 기본 구조 결정
        const baseStructure = this.determineGameStructure(gameSpec);
        
        return {
            gameLogic: baseStructure.initCode,
            updateLogic: baseStructure.updateCode,
            renderLogic: baseStructure.renderCode,
            sensorLogic: baseStructure.sensorCode,
            resetLogic: baseStructure.resetCode,
            helperMethods: baseStructure.helperCode
        };
    }

    /**
     * 게임 구조 결정 - 요구사항에 따른 기본 구조 생성
     */
    determineGameStructure(gameSpec) {
        const { genre, sensorMechanics, gameObjects, objective } = gameSpec;
        
        console.log(`🔍 게임 구조 분석 중: "${gameSpec.originalInput}"`);
        
        // 3D 게임 요청 감지
        if (gameSpec.originalInput.includes('3D') || gameSpec.originalInput.includes('3차원') || 
            gameSpec.originalInput.includes('입체') || gameSpec.originalInput.includes('우주선') ||
            gameSpec.originalInput.includes('큐브')) {
            console.log('🎯 3D 게임 구조 감지됨');
            return this.generate3DGameStructure(gameSpec);
        }
        
        // 음성/음악 게임 요청 감지
        if (genre === 'rhythm' || gameSpec.originalInput.includes('음성') || gameSpec.originalInput.includes('음악') ||
            gameSpec.originalInput.includes('리듬') || gameSpec.originalInput.includes('박자')) {
            console.log('🎯 오디오 게임 구조 감지됨');
            return this.generateAudioGameStructure(gameSpec);
        }
        
        // 카메라 기반 게임 요청 감지
        if (gameSpec.originalInput.includes('카메라') || gameSpec.originalInput.includes('QR') || 
            gameSpec.originalInput.includes('AR') || gameSpec.originalInput.includes('얼굴')) {
            console.log('🎯 카메라 게임 구조 감지됨');
            return this.generateCameraGameStructure(gameSpec);
        }
        
        // 멀티터치 게임 요청 감지
        if (gameSpec.originalInput.includes('터치') || gameSpec.originalInput.includes('멀티터치') ||
            gameSpec.originalInput.includes('손가락')) {
            console.log('🎯 터치 게임 구조 감지됨');
            return this.generateTouchGameStructure(gameSpec);
        }
        
        // 기본 2D 캔버스 게임 구조
        console.log('🎯 기본 2D 캔버스 게임 구조 사용');
        return this.generateCanvas2DStructure(gameSpec);
    }

    /**
     * 3D 게임 구조 생성 - Three.js 기반
     */
    generate3DGameStructure(gameSpec) {
        console.log('🔧 3D 게임 구조 생성 중...');
        
        return {
            initCode: `
                // Three.js 3D 씬 초기화
                this.scene = new THREE.Scene();
                this.camera = new THREE.PerspectiveCamera(75, this.canvas.width / this.canvas.height, 0.1, 1000);
                this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true });
                this.renderer.setSize(this.canvas.width, this.canvas.height);
                this.renderer.setClearColor(0x000011);
                
                // 조명 설정
                const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
                this.scene.add(ambientLight);
                
                const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
                directionalLight.position.set(10, 10, 10);
                this.scene.add(directionalLight);
                
                // 3D 오브젝트들
                this.player = this.create3DPlayer();
                this.obstacles = [];
                this.collectibles = [];
                
                // 카메라 위치
                this.camera.position.set(0, 5, 10);
                this.camera.lookAt(0, 0, 0);
                
                // 센서 데이터 저장
                this.sensorRotation = { x: 0, y: 0, z: 0 };
                this.sensorAcceleration = { x: 0, y: 0, z: 0 };
                
                console.log('✅ 3D 게임 환경 초기화 완료');
            `,
            updateCode: `
                // 센서 데이터 기반 플레이어 이동
                if (this.player) {
                    // 기울기 기반 회전
                    this.player.rotation.z = this.sensorRotation.z * 0.02;
                    this.player.rotation.x = this.sensorRotation.x * 0.02;
                    
                    // 가속도 기반 이동
                    this.player.position.x += this.sensorAcceleration.x * 0.001;
                    this.player.position.y += this.sensorAcceleration.y * 0.001;
                    
                    // 경계 체크
                    this.player.position.x = Math.max(-5, Math.min(5, this.player.position.x));
                    this.player.position.y = Math.max(-3, Math.min(3, this.player.position.y));
                }
                
                // 장애물 애니메이션
                this.obstacles.forEach(obstacle => {
                    obstacle.position.z += 0.1;
                    obstacle.rotation.y += 0.02;
                    
                    if (obstacle.position.z > 10) {
                        obstacle.position.z = -20;
                        obstacle.position.x = (Math.random() - 0.5) * 10;
                    }
                    
                    // 충돌 검사
                    if (this.player && this.player.position.distanceTo(obstacle.position) < 1) {
                        this.lives--;
                        obstacle.position.z = -20;
                        if (this.lives <= 0) {
                            this.gameOver();
                        }
                    }
                });
                
                // 수집 아이템 애니메이션
                this.collectibles.forEach((item, index) => {
                    item.position.z += 0.05;
                    item.rotation.y += 0.05;
                    
                    if (item.position.z > 10) {
                        item.position.z = -30;
                        item.position.x = (Math.random() - 0.5) * 8;
                        item.position.y = (Math.random() - 0.5) * 4;
                    }
                    
                    // 수집 검사
                    if (this.player && this.player.position.distanceTo(item.position) < 0.8) {
                        this.score += 20;
                        item.position.z = -30;
                    }
                });
                
                // 카메라 추적
                if (this.player) {
                    this.camera.position.x = this.player.position.x * 0.5;
                    this.camera.position.y = this.player.position.y * 0.3 + 5;
                    this.camera.lookAt(this.player.position);
                }
            `,
            renderCode: `
                // Three.js 렌더링
                this.renderer.render(this.scene, this.camera);
                
                // 2D UI 오버레이 (Canvas 2D 컨텍스트 사용)
                this.ctx.save();
                this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
                this.ctx.font = '20px Arial';
                this.ctx.fillText('3D 게임 모드', 20, 50);
                
                // 센서 상태 표시
                this.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
                this.ctx.font = '14px Arial';
                this.ctx.fillText(\`회전: X:\${this.sensorRotation.x.toFixed(1)} Y:\${this.sensorRotation.y.toFixed(1)} Z:\${this.sensorRotation.z.toFixed(1)}\`, 20, 580);
                this.ctx.restore();
            `,
            sensorCode: `
                const { orientation, acceleration } = sensorData.data;
                
                if (orientation) {
                    this.sensorRotation.x = orientation.beta || 0;
                    this.sensorRotation.y = orientation.alpha || 0;
                    this.sensorRotation.z = orientation.gamma || 0;
                }
                
                if (acceleration) {
                    this.sensorAcceleration.x = acceleration.x || 0;
                    this.sensorAcceleration.y = acceleration.y || 0;
                    this.sensorAcceleration.z = acceleration.z || 0;
                }
            `,
            resetCode: `
                if (this.player) {
                    this.player.position.set(0, 0, 0);
                    this.player.rotation.set(0, 0, 0);
                }
                
                this.sensorRotation = { x: 0, y: 0, z: 0 };
                this.sensorAcceleration = { x: 0, y: 0, z: 0 };
                
                // 장애물 리셋
                this.obstacles.forEach(obstacle => {
                    obstacle.position.z = -Math.random() * 30 - 10;
                });
            `,
            helperCode: `
                create3DPlayer() {
                    const geometry = new THREE.BoxGeometry(1, 1, 1);
                    const material = new THREE.MeshLambertMaterial({ color: 0x3b82f6 });
                    const player = new THREE.Mesh(geometry, material);
                    this.scene.add(player);
                    
                    // 장애물 생성
                    for (let i = 0; i < 5; i++) {
                        const obstacleGeometry = new THREE.SphereGeometry(0.5, 8, 6);
                        const obstacleMaterial = new THREE.MeshLambertMaterial({ color: 0xef4444 });
                        const obstacle = new THREE.Mesh(obstacleGeometry, obstacleMaterial);
                        obstacle.position.set((Math.random() - 0.5) * 10, (Math.random() - 0.5) * 6, -Math.random() * 20 - 5);
                        this.scene.add(obstacle);
                        this.obstacles.push(obstacle);
                    }
                    
                    // 수집 아이템 생성
                    for (let i = 0; i < 8; i++) {
                        const itemGeometry = new THREE.OctahedronGeometry(0.3, 0);
                        const itemMaterial = new THREE.MeshLambertMaterial({ color: 0xfbbf24 });
                        const item = new THREE.Mesh(itemGeometry, itemMaterial);
                        item.position.set((Math.random() - 0.5) * 8, (Math.random() - 0.5) * 4, -Math.random() * 30 - 10);
                        this.scene.add(item);
                        this.collectibles.push(item);
                    }
                    
                    return player;
                }
                
                // Three.js 리사이즈 처리
                resize() {
                    const container = this.canvas.parentElement;
                    const containerRect = container.getBoundingClientRect();
                    
                    const maxWidth = Math.min(800, containerRect.width - 40);
                    const maxHeight = Math.min(600, containerRect.height - 40);
                    
                    this.canvas.style.width = maxWidth + 'px';
                    this.canvas.style.height = maxHeight + 'px';
                    
                    if (this.renderer) {
                        this.renderer.setSize(maxWidth, maxHeight);
                        this.camera.aspect = maxWidth / maxHeight;
                        this.camera.updateProjectionMatrix();
                    }
                }
            `
        };
    }

    /**
     * 오디오 게임 구조 생성 - Web Audio API 기반
     */
    generateAudioGameStructure(gameSpec) {
        console.log('🔧 오디오 게임 구조 생성 중...');
        
        return {
            initCode: `
                // Web Audio API 초기화
                this.audioContext = null;
                this.microphone = null;
                this.analyser = null;
                this.frequencyData = null;
                this.audioInitialized = false;
                
                // 리듬 게임 설정
                this.beats = [];
                this.currentBeat = 0;
                this.beatTiming = 0;
                this.beatInterval = 1000;
                this.lastBeatTime = 0;
                
                // 오디오 레벨 및 주파수 분석
                this.audioLevel = 0;
                this.pitchDetection = { frequency: 0, confidence: 0 };
                this.rhythmPattern = [];
                
                // 비주얼 요소들
                this.audioVisualizer = {
                    bars: [],
                    waveform: [],
                    colors: ['#3b82f6', '#8b5cf6', '#ef4444', '#10b981', '#f59e0b']
                };
                
                // 게임 오브젝트들
                this.musicNotes = [];
                this.playerNote = { x: 400, y: 500, size: 30, active: false };
                
                this.initAudioSystem();
            `,
            updateCode: `
                if (!this.audioInitialized) return;
                
                // 오디오 데이터 분석
                if (this.analyser && this.frequencyData) {
                    this.analyser.getByteFrequencyData(this.frequencyData);
                    
                    let sum = 0;
                    for (let i = 0; i < this.frequencyData.length; i++) {
                        sum += this.frequencyData[i];
                    }
                    this.audioLevel = sum / this.frequencyData.length;
                    
                    this.analyzePitch();
                    this.updateAudioVisualizer();
                }
                
                // 리듬 게임 로직
                const currentTime = Date.now();
                if (currentTime - this.lastBeatTime > this.beatInterval) {
                    this.generateBeat();
                    this.lastBeatTime = currentTime;
                }
                
                // 음파 노트 이동
                this.musicNotes.forEach((note, index) => {
                    note.y += note.speed;
                    
                    if (note.y > this.canvas.height + 50) {
                        this.musicNotes.splice(index, 1);
                        this.lives--;
                    }
                    
                    const distance = Math.sqrt(
                        Math.pow(note.x - this.playerNote.x, 2) + 
                        Math.pow(note.y - this.playerNote.y, 2)
                    );
                    
                    if (distance < 40 && this.playerNote.active) {
                        if (this.checkPitchMatch(note.targetPitch)) {
                            this.score += 100;
                            this.musicNotes.splice(index, 1);
                        }
                    }
                });
                
                this.playerNote.active = this.audioLevel > 50;
                this.playerNote.size = 30 + (this.audioLevel / 10);
                
                if (this.lives <= 0) {
                    this.gameOver();
                }
            `,
            renderCode: `
                const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
                gradient.addColorStop(0, '#0f172a');
                gradient.addColorStop(1, '#1e293b');
                this.ctx.fillStyle = gradient;
                this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
                
                this.renderAudioVisualizer();
                
                this.musicNotes.forEach(note => {
                    this.ctx.fillStyle = note.color;
                    this.ctx.beginPath();
                    this.ctx.arc(note.x, note.y, note.size, 0, Math.PI * 2);
                    this.ctx.fill();
                    
                    this.ctx.fillStyle = '#ffffff';
                    this.ctx.font = '16px Arial';
                    this.ctx.textAlign = 'center';
                    this.ctx.fillText(note.note, note.x, note.y + 5);
                });
                
                this.ctx.fillStyle = this.playerNote.active ? '#10b981' : '#6b7280';
                this.ctx.beginPath();
                this.ctx.arc(this.playerNote.x, this.playerNote.y, this.playerNote.size, 0, Math.PI * 2);
                this.ctx.fill();
                
                this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
                this.ctx.font = '18px Arial';
                this.ctx.textAlign = 'left';
                this.ctx.fillText(\`음량: \${Math.round(this.audioLevel)}\`, 20, 50);
                this.ctx.fillText(\`주파수: \${this.pitchDetection.frequency.toFixed(1)}Hz\`, 20, 75);
                
                if (!this.audioInitialized) {
                    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
                    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
                    
                    this.ctx.fillStyle = '#ffffff';
                    this.ctx.font = '24px Arial';
                    this.ctx.textAlign = 'center';
                    this.ctx.fillText('마이크 권한을 활성화해주세요', this.canvas.width/2, this.canvas.height/2);
                    this.ctx.fillText('노래하거나 소리를 내어 게임을 플레이하세요!', this.canvas.width/2, this.canvas.height/2 + 40);
                }
            `,
            sensorCode: `
                const { orientation, acceleration } = sensorData.data;
                
                if (orientation) {
                    this.playerNote.x += orientation.gamma * 2;
                    this.playerNote.x = Math.max(50, Math.min(this.canvas.width - 50, this.playerNote.x));
                }
                
                if (acceleration) {
                    const totalAccel = Math.sqrt(
                        acceleration.x ** 2 + acceleration.y ** 2 + acceleration.z ** 2
                    );
                    
                    if (totalAccel > 20) {
                        this.triggerSpecialEffect();
                    }
                }
            `,
            resetCode: `
                this.musicNotes = [];
                this.playerNote.x = 400;
                this.playerNote.active = false;
                this.currentBeat = 0;
                this.rhythmPattern = [];
                this.audioLevel = 0;
                
                if (this.audioContext) {
                    this.beatInterval = Math.max(500, 1500 - (this.level * 100));
                }
            `,
            helperCode: `
                async initAudioSystem() {
                    try {
                        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                        
                        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
                        this.microphone = this.audioContext.createMediaStreamSource(stream);
                        this.analyser = this.audioContext.createAnalyser();
                        
                        this.analyser.fftSize = 2048;
                        this.frequencyData = new Uint8Array(this.analyser.frequencyBinCount);
                        
                        this.microphone.connect(this.analyser);
                        
                        this.audioInitialized = true;
                        console.log('✅ 오디오 시스템 초기화 완료');
                        
                    } catch (error) {
                        console.error('❌ 오디오 시스템 초기화 실패:', error);
                        alert('마이크 권한이 필요합니다.');
                    }
                }
                
                generateBeat() {
                    const notes = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
                    const frequencies = [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88];
                    
                    const noteIndex = Math.floor(Math.random() * notes.length);
                    const xPosition = Math.random() * (this.canvas.width - 100) + 50;
                    
                    this.musicNotes.push({
                        x: xPosition,
                        y: -30,
                        size: 20,
                        speed: 2 + (this.level * 0.3),
                        note: notes[noteIndex],
                        targetPitch: frequencies[noteIndex],
                        color: this.audioVisualizer.colors[noteIndex % this.audioVisualizer.colors.length]
                    });
                }
                
                analyzePitch() {
                    let maxValue = 0;
                    let maxIndex = 0;
                    
                    for (let i = 0; i < this.frequencyData.length; i++) {
                        if (this.frequencyData[i] > maxValue) {
                            maxValue = this.frequencyData[i];
                            maxIndex = i;
                        }
                    }
                    
                    const nyquist = this.audioContext.sampleRate / 2;
                    this.pitchDetection.frequency = (maxIndex * nyquist) / this.frequencyData.length;
                    this.pitchDetection.confidence = maxValue / 255;
                }
                
                checkPitchMatch(targetFrequency) {
                    const tolerance = 50;
                    return Math.abs(this.pitchDetection.frequency - targetFrequency) < tolerance && 
                           this.pitchDetection.confidence > 0.3;
                }
                
                updateAudioVisualizer() {
                    const barCount = 32;
                    const dataStep = Math.floor(this.frequencyData.length / barCount);
                    
                    this.audioVisualizer.bars = [];
                    for (let i = 0; i < barCount; i++) {
                        const value = this.frequencyData[i * dataStep];
                        this.audioVisualizer.bars.push({
                            height: (value / 255) * 200,
                            color: this.audioVisualizer.colors[i % this.audioVisualizer.colors.length]
                        });
                    }
                }
                
                renderAudioVisualizer() {
                    const barWidth = this.canvas.width / this.audioVisualizer.bars.length;
                    
                    this.audioVisualizer.bars.forEach((bar, index) => {
                        this.ctx.fillStyle = bar.color + '80';
                        this.ctx.fillRect(
                            index * barWidth,
                            this.canvas.height - bar.height,
                            barWidth - 2,
                            bar.height
                        );
                    });
                }
                
                triggerSpecialEffect() {
                    this.musicNotes.forEach(note => {
                        if (Math.abs(note.x - this.playerNote.x) < 100) {
                            this.score += 50;
                        }
                    });
                    
                    this.musicNotes = this.musicNotes.filter(note => 
                        Math.abs(note.x - this.playerNote.x) >= 100
                    );
                }
            `
        };
    }

    /**
     * 카메라 게임 구조 생성 - Camera API 기반
     */
    generateCameraGameStructure(gameSpec) {
        console.log('🔧 카메라 게임 구조 생성 중...');
        
        return {
            initCode: `
                // 카메라 시스템 초기화
                this.video = null;
                this.cameraStream = null;
                this.cameraInitialized = false;
                this.facingMode = 'environment'; // 후막 카메라 기본
                
                // 이미지 처리 및 분석
                this.imageCapture = null;
                this.motionDetection = {
                    previousFrame: null,
                    motionLevel: 0,
                    motionThreshold: 30
                };
                
                // 색상 추적 시스템
                this.colorTracking = {
                    targetColor: { r: 255, g: 0, b: 0 }, // 빨간색 기본
                    tolerance: 50,
                    detectedObjects: []
                };
                
                // QR 코드 인식 시스템 (jsQR 라이브러리 사용)
                this.qrDetection = {
                    enabled: false,
                    detectedCodes: [],
                    scanInterval: null
                };
                
                // 게임 오브젝트들
                this.cameraObjects = [];
                this.virtualObjects = [];
                this.gameTargets = [];
                
                // AR 오버레이 콘텍스트
                this.overlayCanvas = document.createElement('canvas');
                this.overlayCtx = this.overlayCanvas.getContext('2d');
                
                this.initCameraSystem();
            `,
            updateCode: `
                if (!this.cameraInitialized) return;
                
                // 영상 데이터 처리
                if (this.video && this.video.readyState === this.video.HAVE_ENOUGH_DATA) {
                    // 모션 감지
                    this.detectMotion();
                    
                    // 색상 추적
                    this.trackColors();
                    
                    // QR 코드 인식
                    if (this.qrDetection.enabled) {
                        this.detectQRCodes();
                    }
                }
                
                // 가상 오브젝트 업데이트
                this.virtualObjects.forEach((obj, index) => {
                    obj.life -= 1;
                    if (obj.life <= 0) {
                        this.virtualObjects.splice(index, 1);
                    }
                    
                    // 모션에 따른 반응
                    if (this.motionDetection.motionLevel > this.motionDetection.motionThreshold) {
                        obj.x += (Math.random() - 0.5) * 10;
                        obj.y += (Math.random() - 0.5) * 10;
                    }
                });
                
                // 색상 기반 인터랙션
                this.colorTracking.detectedObjects.forEach(colorObj => {
                    this.virtualObjects.forEach(virtObj => {
                        const distance = Math.sqrt(
                            Math.pow(colorObj.x - virtObj.x, 2) + 
                            Math.pow(colorObj.y - virtObj.y, 2)
                        );
                        
                        if (distance < 50) {
                            this.score += 10;
                            virtObj.collected = true;
                        }
                    });
                });
                
                // 수집된 오브젝트 제거
                this.virtualObjects = this.virtualObjects.filter(obj => !obj.collected);
                
                // 새 오브젝트 생성
                if (Math.random() < 0.02 && this.virtualObjects.length < 10) {
                    this.spawnVirtualObject();
                }
            `,
            renderCode: `
                // 카메라 영상 그리기
                if (this.video && this.cameraInitialized) {
                    this.ctx.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);
                    
                    // AR 오버레이 그리기
                    this.renderAROverlay();
                    
                    // 모션 시각화
                    if (this.motionDetection.motionLevel > this.motionDetection.motionThreshold) {
                        this.ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
                        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
                    }
                    
                    // 색상 추적 시각화
                    this.colorTracking.detectedObjects.forEach(obj => {
                        this.ctx.strokeStyle = '#00ff00';
                        this.ctx.lineWidth = 3;
                        this.ctx.strokeRect(obj.x - 25, obj.y - 25, 50, 50);
                        
                        this.ctx.fillStyle = '#00ff00';
                        this.ctx.font = '16px Arial';
                        this.ctx.fillText('대상 감지', obj.x - 30, obj.y - 30);
                    });
                    
                    // QR 코드 시각화
                    this.qrDetection.detectedCodes.forEach(qr => {
                        this.ctx.strokeStyle = '#ffff00';
                        this.ctx.lineWidth = 4;
                        this.ctx.strokeRect(qr.location.topLeftCorner.x, qr.location.topLeftCorner.y, 
                                          qr.location.bottomRightCorner.x - qr.location.topLeftCorner.x,
                                          qr.location.bottomRightCorner.y - qr.location.topLeftCorner.y);
                        
                        this.ctx.fillStyle = '#ffff00';
                        this.ctx.font = '18px Arial';
                        this.ctx.fillText('QR: ' + qr.data, qr.location.topLeftCorner.x, qr.location.topLeftCorner.y - 10);
                    });
                    
                } else {
                    // 카메라 미초기화 상태
                    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
                    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
                    
                    this.ctx.fillStyle = '#ffffff';
                    this.ctx.font = '24px Arial';
                    this.ctx.textAlign = 'center';
                    this.ctx.fillText('카메라 권한을 활성화해주세요', this.canvas.width/2, this.canvas.height/2);
                    this.ctx.fillText('실세계 오브젝트를 인식하여 게임을 플레이하세요!', this.canvas.width/2, this.canvas.height/2 + 40);
                }
                
                // 게임 정보 오버레이
                this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                this.ctx.fillRect(10, 10, 300, 120);
                
                this.ctx.fillStyle = '#ffffff';
                this.ctx.font = '16px Arial';
                this.ctx.textAlign = 'left';
                this.ctx.fillText('모션 레벨: ' + Math.round(this.motionDetection.motionLevel), 20, 35);
                this.ctx.fillText('감지된 색상: ' + this.colorTracking.detectedObjects.length, 20, 55);
                this.ctx.fillText('QR 코드: ' + this.qrDetection.detectedCodes.length, 20, 75);
                this.ctx.fillText('가상 오브젝트: ' + this.virtualObjects.length, 20, 95);
            `,
            sensorCode: `
                const { orientation, acceleration } = sensorData.data;
                
                if (orientation) {
                    // 기울기로 가상 오브젝트 이동
                    this.virtualObjects.forEach(obj => {
                        obj.x += orientation.gamma * 0.5;
                        obj.y += orientation.beta * 0.5;
                        
                        // 경계 체크
                        obj.x = Math.max(0, Math.min(this.canvas.width, obj.x));
                        obj.y = Math.max(0, Math.min(this.canvas.height, obj.y));
                    });
                }
                
                if (acceleration) {
                    // 흙들기로 색상 추적 모드 전환
                    const totalAccel = Math.sqrt(
                        acceleration.x ** 2 + acceleration.y ** 2 + acceleration.z ** 2
                    );
                    
                    if (totalAccel > 15) {
                        this.switchColorTarget();
                    }
                }
            `,
            resetCode: `
                this.virtualObjects = [];
                this.colorTracking.detectedObjects = [];
                this.qrDetection.detectedCodes = [];
                this.motionDetection.previousFrame = null;
                this.motionDetection.motionLevel = 0;
                
                // 새 가상 오브젝트 생성
                for (let i = 0; i < 5; i++) {
                    this.spawnVirtualObject();
                }
            `,
            helperCode: `
                async initCameraSystem() {
                    try {
                        // 카메라 권한 요청
                        this.cameraStream = await navigator.mediaDevices.getUserMedia({
                            video: {
                                facingMode: this.facingMode,
                                width: { ideal: 640 },
                                height: { ideal: 480 }
                            }
                        });
                        
                        // 비디오 요소 생성 및 설정
                        this.video = document.createElement('video');
                        this.video.srcObject = this.cameraStream;
                        this.video.autoplay = true;
                        this.video.playsInline = true;
                        
                        this.video.onloadedmetadata = () => {
                            this.cameraInitialized = true;
                            console.log('✅ 카메라 시스템 초기화 완료');
                            
                            // 오버레이 캔버스 설정
                            this.overlayCanvas.width = this.canvas.width;
                            this.overlayCanvas.height = this.canvas.height;
                        };
                        
                    } catch (error) {
                        console.error('❌ 카메라 시스템 초기화 실패:', error);
                        alert('카메라 권한이 필요합니다. 브라우저 설정에서 허용해주세요.');
                        this.cameraInitialized = false;
                    }
                }
                
                detectMotion() {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    canvas.width = 160; // 성능을 위해 작은 크기
                    canvas.height = 120;
                    
                    ctx.drawImage(this.video, 0, 0, canvas.width, canvas.height);
                    const currentFrame = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    
                    if (this.motionDetection.previousFrame) {
                        let diffSum = 0;
                        const data1 = this.motionDetection.previousFrame.data;
                        const data2 = currentFrame.data;
                        
                        for (let i = 0; i < data1.length; i += 4) {
                            const diff = Math.abs(data1[i] - data2[i]) + 
                                        Math.abs(data1[i + 1] - data2[i + 1]) + 
                                        Math.abs(data1[i + 2] - data2[i + 2]);
                            diffSum += diff;
                        }
                        
                        this.motionDetection.motionLevel = diffSum / (canvas.width * canvas.height);
                    }
                    
                    this.motionDetection.previousFrame = currentFrame;
                }
                
                trackColors() {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    canvas.width = this.canvas.width;
                    canvas.height = this.canvas.height;
                    
                    ctx.drawImage(this.video, 0, 0, canvas.width, canvas.height);
                    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    const data = imageData.data;
                    
                    this.colorTracking.detectedObjects = [];
                    const target = this.colorTracking.targetColor;
                    const tolerance = this.colorTracking.tolerance;
                    
                    // 색상 매칭 영역 찾기
                    const regions = [];
                    for (let y = 0; y < canvas.height; y += 10) {
                        for (let x = 0; x < canvas.width; x += 10) {
                            const index = (y * canvas.width + x) * 4;
                            const r = data[index];
                            const g = data[index + 1];
                            const b = data[index + 2];
                            
                            if (Math.abs(r - target.r) < tolerance &&
                                Math.abs(g - target.g) < tolerance &&
                                Math.abs(b - target.b) < tolerance) {
                                regions.push({ x, y });
                            }
                        }
                    }
                    
                    // 영역 그룹화 (간단한 클러스터링)
                    if (regions.length > 5) {
                        const centerX = regions.reduce((sum, r) => sum + r.x, 0) / regions.length;
                        const centerY = regions.reduce((sum, r) => sum + r.y, 0) / regions.length;
                        
                        this.colorTracking.detectedObjects.push({
                            x: centerX,
                            y: centerY,
                            confidence: Math.min(regions.length / 50, 1)
                        });
                    }
                }
                
                detectQRCodes() {
                    // jsQR 라이브러리가 있을 경우
                    if (typeof jsQR !== 'undefined') {
                        const canvas = document.createElement('canvas');
                        const ctx = canvas.getContext('2d');
                        canvas.width = this.canvas.width;
                        canvas.height = this.canvas.height;
                        
                        ctx.drawImage(this.video, 0, 0, canvas.width, canvas.height);
                        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                        
                        const code = jsQR(imageData.data, canvas.width, canvas.height);
                        
                        if (code) {
                            this.qrDetection.detectedCodes = [code];
                            this.score += 50; // QR 코드 발견 시 점수
                        } else {
                            this.qrDetection.detectedCodes = [];
                        }
                    }
                }
                
                renderAROverlay() {
                    // 가상 오브젝트 그리기
                    this.virtualObjects.forEach(obj => {
                        this.ctx.fillStyle = obj.color;
                        this.ctx.beginPath();
                        this.ctx.arc(obj.x, obj.y, obj.size, 0, Math.PI * 2);
                        this.ctx.fill();
                        
                        // 효과 추가
                        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
                        this.ctx.lineWidth = 2;
                        this.ctx.stroke();
                        
                        // 라벨
                        this.ctx.fillStyle = '#ffffff';
                        this.ctx.font = '12px Arial';
                        this.ctx.textAlign = 'center';
                        this.ctx.fillText(obj.type, obj.x, obj.y - obj.size - 5);
                    });
                }
                
                spawnVirtualObject() {
                    const types = ['아이템', '코인', '보석', '에너지'];
                    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
                    
                    this.virtualObjects.push({
                        x: Math.random() * this.canvas.width,
                        y: Math.random() * this.canvas.height,
                        size: 15 + Math.random() * 10,
                        color: colors[Math.floor(Math.random() * colors.length)],
                        type: types[Math.floor(Math.random() * types.length)],
                        life: 300 + Math.random() * 200,
                        collected: false
                    });
                }
                
                switchColorTarget() {
                    const colors = [
                        { r: 255, g: 0, b: 0 },   // 빨간
                        { r: 0, g: 255, b: 0 },   // 초록
                        { r: 0, g: 0, b: 255 },   // 파란
                        { r: 255, g: 255, b: 0 }, // 노랑
                        { r: 255, g: 0, b: 255 }  // 자주
                    ];
                    
                    this.colorTracking.targetColor = colors[Math.floor(Math.random() * colors.length)];
                    console.log('색상 타겟 변경:', this.colorTracking.targetColor);
                }
                
                toggleCamera() {
                    this.facingMode = this.facingMode === 'environment' ? 'user' : 'environment';
                    this.initCameraSystem(); // 카메라 재초기화
                }
            `
        };
    }

    /**
     * 터치 게임 구조 생성 - 멀티터치 기반
     */
    generateTouchGameStructure(gameSpec) {
        console.log('🔧 터치 게임 구조 생성 중...');
        
        return {
            initCode: `
                // 멀티터치 시스템 초기화
                this.touchPoints = [];
                this.maxTouchPoints = 10;
                this.gestureRecognition = {
                    isRecording: false,
                    startTime: 0,
                    gesturePath: [],
                    recognizedGesture: null
                };
                
                // 터치 인터랙션 시스템
                this.touchObjects = [];
                this.multiTouchActions = {
                    pinchZoom: { scale: 1, lastDistance: 0 },
                    rotation: { angle: 0, lastAngle: 0 },
                    dragDrop: { activeObject: null, offset: { x: 0, y: 0 } }
                };
                
                // 터치 비주얼 효과
                this.touchEffects = [];
                this.touchTrails = [];
                
                // 게임 오브젝트들
                this.interactiveObjects = [];
                this.touchTargets = [];
                
                // 사전 정의된 제스처 패턴
                this.gesturePatterns = {
                    circle: { threshold: 0.8, action: 'rotate' },
                    line: { threshold: 0.7, action: 'swipe' },
                    zigzag: { threshold: 0.6, action: 'shake' },
                    heart: { threshold: 0.9, action: 'special' }
                };
                
                this.initTouchEvents();
                this.createInteractiveObjects();
            `,
            updateCode: `
                // 터치 포인트 업데이트
                this.touchPoints.forEach((touch, index) => {
                    touch.life--;
                    if (touch.life <= 0) {
                        this.touchPoints.splice(index, 1);
                    }
                });
                
                // 멀티터치 제스처 분석
                this.analyzeMultiTouchGestures();
                
                // 터치 효과 업데이트
                this.touchEffects.forEach((effect, index) => {
                    effect.life--;
                    effect.radius += effect.expansion;
                    effect.opacity = Math.max(0, effect.life / effect.maxLife);
                    
                    if (effect.life <= 0) {
                        this.touchEffects.splice(index, 1);
                    }
                });
                
                // 터치 트레일 업데이트
                this.touchTrails.forEach((trail, index) => {
                    trail.points.forEach(point => {
                        point.life--;
                        point.opacity = Math.max(0, point.life / 60);
                    });
                    
                    trail.points = trail.points.filter(point => point.life > 0);
                    
                    if (trail.points.length === 0) {
                        this.touchTrails.splice(index, 1);
                    }
                });
                
                // 인터랙티브 오브젝트 업데이트
                this.interactiveObjects.forEach(obj => {
                    // 터치 충돌 검사
                    this.touchPoints.forEach(touch => {
                        if (this.isPointInObject(touch, obj)) {
                            obj.touched = true;
                            obj.touchTime = Date.now();
                            
                            // 터치에 따른 반응
                            this.handleObjectTouch(obj, touch);
                        }
                    });
                    
                    // 터치 상태 리셋
                    if (Date.now() - obj.touchTime > 500) {
                        obj.touched = false;
                    }
                });
                
                // 제스처 인식 결과 처리
                if (this.gestureRecognition.recognizedGesture) {
                    this.executeGestureAction(this.gestureRecognition.recognizedGesture);
                    this.gestureRecognition.recognizedGesture = null;
                }
            `,
            renderCode: `
                // 배경
                const gradient = this.ctx.createLinearGradient(0, 0, this.canvas.width, this.canvas.height);
                gradient.addColorStop(0, '#1e293b');
                gradient.addColorStop(1, '#0f172a');
                this.ctx.fillStyle = gradient;
                this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
                
                // 인터랙티브 오브젝트 그리기
                this.interactiveObjects.forEach(obj => {
                    this.ctx.save();
                    
                    // 터치 상태에 따른 시각적 변화
                    if (obj.touched) {
                        this.ctx.shadowColor = obj.color;
                        this.ctx.shadowBlur = 20;
                        this.ctx.globalAlpha = 0.8;
                    }
                    
                    this.ctx.fillStyle = obj.color;
                    this.ctx.beginPath();
                    this.ctx.arc(obj.x, obj.y, obj.size, 0, Math.PI * 2);
                    this.ctx.fill();
                    
                    // 오브젝트 라벨
                    this.ctx.fillStyle = '#ffffff';
                    this.ctx.font = '14px Arial';
                    this.ctx.textAlign = 'center';
                    this.ctx.fillText(obj.type, obj.x, obj.y + 5);
                    
                    this.ctx.restore();
                });
                
                // 터치 포인트 시각화
                this.touchPoints.forEach(touch => {
                    this.ctx.fillStyle = \`rgba(\${touch.color.r}, \${touch.color.g}, \${touch.color.b}, \${touch.life / 60})\`;
                    this.ctx.beginPath();
                    this.ctx.arc(touch.x, touch.y, touch.size, 0, Math.PI * 2);
                    this.ctx.fill();
                    
                    // 터치 ID 표시
                    this.ctx.fillStyle = '#ffffff';
                    this.ctx.font = '12px Arial';
                    this.ctx.textAlign = 'center';
                    this.ctx.fillText(touch.id, touch.x, touch.y - touch.size - 5);
                });
                
                // 터치 효과 그리기
                this.touchEffects.forEach(effect => {
                    this.ctx.strokeStyle = \`rgba(\${effect.color.r}, \${effect.color.g}, \${effect.color.b}, \${effect.opacity})\`;
                    this.ctx.lineWidth = 3;
                    this.ctx.beginPath();
                    this.ctx.arc(effect.x, effect.y, effect.radius, 0, Math.PI * 2);
                    this.ctx.stroke();
                });
                
                // 터치 트레일 그리기
                this.touchTrails.forEach(trail => {
                    this.ctx.strokeStyle = trail.color;
                    this.ctx.lineWidth = 2;
                    this.ctx.beginPath();
                    
                    trail.points.forEach((point, index) => {
                        this.ctx.globalAlpha = point.opacity;
                        if (index === 0) {
                            this.ctx.moveTo(point.x, point.y);
                        } else {
                            this.ctx.lineTo(point.x, point.y);
                        }
                    });
                    
                    this.ctx.stroke();
                    this.ctx.globalAlpha = 1;
                });
                
                // 제스처 인식 시각화
                if (this.gestureRecognition.isRecording && this.gestureRecognition.gesturePath.length > 1) {
                    this.ctx.strokeStyle = '#ffff00';
                    this.ctx.lineWidth = 4;
                    this.ctx.beginPath();
                    
                    this.gestureRecognition.gesturePath.forEach((point, index) => {
                        if (index === 0) {
                            this.ctx.moveTo(point.x, point.y);
                        } else {
                            this.ctx.lineTo(point.x, point.y);
                        }
                    });
                    
                    this.ctx.stroke();
                }
                
                // 게임 정보 오버레이
                this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                this.ctx.fillRect(10, 10, 280, 100);
                
                this.ctx.fillStyle = '#ffffff';
                this.ctx.font = '16px Arial';
                this.ctx.textAlign = 'left';
                this.ctx.fillText('활성 터치: ' + this.touchPoints.length, 20, 35);
                this.ctx.fillText('인터랙션: ' + this.interactiveObjects.filter(o => o.touched).length, 20, 55);
                this.ctx.fillText('마지막 제스처: ' + (this.gestureRecognition.recognizedGesture || '없음'), 20, 75);
                
                // 도움말
                this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
                this.ctx.font = '14px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.fillText('화면을 터치하여 인터랙션하세요', this.canvas.width/2, this.canvas.height - 30);
                this.ctx.fillText('다중 터치로 제스처를 만들어보세요', this.canvas.width/2, this.canvas.height - 10);
            `,
            sensorCode: `
                const { orientation, acceleration } = sensorData.data;
                
                if (orientation) {
                    // 기울기로 인터랙티브 오브젝트 이동
                    this.interactiveObjects.forEach(obj => {
                        if (!obj.touched) { // 터치되지 않은 오브젝트만 이동
                            obj.x += orientation.gamma * 0.3;
                            obj.y += orientation.beta * 0.3;
                            
                            // 경계 체크
                            obj.x = Math.max(obj.size, Math.min(this.canvas.width - obj.size, obj.x));
                            obj.y = Math.max(obj.size, Math.min(this.canvas.height - obj.size, obj.y));
                        }
                    });
                }
                
                if (acceleration) {
                    // 흙들기로 특수 효과
                    const totalAccel = Math.sqrt(
                        acceleration.x ** 2 + acceleration.y ** 2 + acceleration.z ** 2
                    );
                    
                    if (totalAccel > 15) {
                        this.createGlobalTouchEffect();
                    }
                }
            `,
            resetCode: `
                this.touchPoints = [];
                this.touchEffects = [];
                this.touchTrails = [];
                this.gestureRecognition.gesturePath = [];
                this.gestureRecognition.recognizedGesture = null;
                
                // 인터랙티브 오브젝트 리셋
                this.interactiveObjects.forEach(obj => {
                    obj.touched = false;
                    obj.touchTime = 0;
                });
                
                this.createInteractiveObjects();
            `,
            helperCode: `
                initTouchEvents() {
                    // 터치 이벤트 리스너 등록
                    this.canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: false });
                    this.canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
                    this.canvas.addEventListener('touchend', (e) => this.handleTouchEnd(e), { passive: false });
                    
                    // 마우스 이벤트도 지원 (데스탑 테스팅용)
                    this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
                    this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
                    this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
                }
                
                handleTouchStart(e) {
                    e.preventDefault();
                    
                    Array.from(e.changedTouches).forEach(touch => {
                        const rect = this.canvas.getBoundingClientRect();
                        const x = touch.clientX - rect.left;
                        const y = touch.clientY - rect.top;
                        
                        this.addTouchPoint(touch.identifier, x, y);
                        this.createTouchEffect(x, y);
                        
                        // 제스처 인식 시작
                        if (e.touches.length === 1) {
                            this.startGestureRecording(x, y);
                        }
                    });
                }
                
                handleTouchMove(e) {
                    e.preventDefault();
                    
                    Array.from(e.changedTouches).forEach(touch => {
                        const rect = this.canvas.getBoundingClientRect();
                        const x = touch.clientX - rect.left;
                        const y = touch.clientY - rect.top;
                        
                        this.updateTouchPoint(touch.identifier, x, y);
                        this.addToTouchTrail(touch.identifier, x, y);
                        
                        // 제스처 경로 추가
                        if (this.gestureRecognition.isRecording && e.touches.length === 1) {
                            this.addToGesturePath(x, y);
                        }
                    });
                }
                
                handleTouchEnd(e) {
                    e.preventDefault();
                    
                    Array.from(e.changedTouches).forEach(touch => {
                        this.removeTouchPoint(touch.identifier);
                    });
                    
                    // 제스처 인식 종료
                    if (e.touches.length === 0 && this.gestureRecognition.isRecording) {
                        this.endGestureRecording();
                    }
                }
                
                addTouchPoint(id, x, y) {
                    const colors = [
                        { r: 59, g: 130, b: 246 },   // 파란
                        { r: 16, g: 185, b: 129 },   // 초록
                        { r: 245, g: 158, b: 11 },   // 노랑
                        { r: 239, g: 68, b: 68 },    // 빨간
                        { r: 139, g: 92, b: 246 }    // 보라
                    ];
                    
                    this.touchPoints.push({
                        id: id,
                        x: x,
                        y: y,
                        size: 25,
                        life: 60,
                        color: colors[id % colors.length],
                        startTime: Date.now()
                    });
                }
                
                updateTouchPoint(id, x, y) {
                    const touchPoint = this.touchPoints.find(tp => tp.id === id);
                    if (touchPoint) {
                        touchPoint.x = x;
                        touchPoint.y = y;
                        touchPoint.life = 60; // 생명 연장
                    }
                }
                
                removeTouchPoint(id) {
                    const index = this.touchPoints.findIndex(tp => tp.id === id);
                    if (index !== -1) {
                        this.touchPoints.splice(index, 1);
                    }
                }
                
                createTouchEffect(x, y) {
                    this.touchEffects.push({
                        x: x,
                        y: y,
                        radius: 10,
                        expansion: 3,
                        life: 30,
                        maxLife: 30,
                        opacity: 1,
                        color: { r: 255, g: 255, b: 255 }
                    });
                }
                
                addToTouchTrail(id, x, y) {
                    let trail = this.touchTrails.find(t => t.id === id);
                    
                    if (!trail) {
                        trail = {
                            id: id,
                            points: [],
                            color: \`hsl(\${id * 60}, 70%, 60%)\`
                        };
                        this.touchTrails.push(trail);
                    }
                    
                    trail.points.push({
                        x: x,
                        y: y,
                        life: 60,
                        opacity: 1
                    });
                    
                    // 트레일 길이 제한
                    if (trail.points.length > 20) {
                        trail.points.shift();
                    }
                }
                
                createInteractiveObjects() {
                    this.interactiveObjects = [];
                    const types = ['보석', '코인', '에너지', '도구'];
                    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];
                    
                    for (let i = 0; i < 8; i++) {
                        this.interactiveObjects.push({
                            x: Math.random() * (this.canvas.width - 100) + 50,
                            y: Math.random() * (this.canvas.height - 100) + 50,
                            size: 30 + Math.random() * 20,
                            color: colors[i % colors.length],
                            type: types[i % types.length],
                            touched: false,
                            touchTime: 0,
                            value: Math.floor(Math.random() * 100) + 10
                        });
                    }
                }
                
                isPointInObject(point, obj) {
                    const distance = Math.sqrt(
                        Math.pow(point.x - obj.x, 2) + Math.pow(point.y - obj.y, 2)
                    );
                    return distance < obj.size;
                }
                
                handleObjectTouch(obj, touch) {
                    // 터치에 따른 오브젝트 반응
                    this.score += obj.value;
                    this.createTouchEffect(obj.x, obj.y);
                    
                    // 오브젝트 이동 (드래그 효과)
                    obj.x = touch.x;
                    obj.y = touch.y;
                }
                
                startGestureRecording(x, y) {
                    this.gestureRecognition.isRecording = true;
                    this.gestureRecognition.startTime = Date.now();
                    this.gestureRecognition.gesturePath = [{ x, y }];
                }
                
                addToGesturePath(x, y) {
                    if (this.gestureRecognition.gesturePath.length > 0) {
                        const lastPoint = this.gestureRecognition.gesturePath[this.gestureRecognition.gesturePath.length - 1];
                        const distance = Math.sqrt(Math.pow(x - lastPoint.x, 2) + Math.pow(y - lastPoint.y, 2));
                        
                        // 최소 거리 이상일 때만 추가
                        if (distance > 10) {
                            this.gestureRecognition.gesturePath.push({ x, y });
                        }
                    }
                }
                
                endGestureRecording() {
                    this.gestureRecognition.isRecording = false;
                    
                    if (this.gestureRecognition.gesturePath.length > 3) {
                        this.gestureRecognition.recognizedGesture = this.recognizeGesture();
                    }
                    
                    // 제스처 경로 클리어 (지연)
                    setTimeout(() => {
                        this.gestureRecognition.gesturePath = [];
                    }, 2000);
                }
                
                recognizeGesture() {
                    const path = this.gestureRecognition.gesturePath;
                    if (path.length < 4) return 'unknown';
                    
                    // 간단한 제스처 인식 로직
                    const startPoint = path[0];
                    const endPoint = path[path.length - 1];
                    const distance = Math.sqrt(
                        Math.pow(endPoint.x - startPoint.x, 2) + 
                        Math.pow(endPoint.y - startPoint.y, 2)
                    );
                    
                    // 원형 제스처 감지
                    if (distance < 50 && path.length > 8) {
                        return 'circle';
                    }
                    
                    // 직선 제스처 감지
                    if (distance > 100 && path.length < 8) {
                        return 'line';
                    }
                    
                    // 지그재그 제스처 감지
                    let directionChanges = 0;
                    for (let i = 1; i < path.length - 1; i++) {
                        const prev = path[i - 1];
                        const curr = path[i];
                        const next = path[i + 1];
                        
                        const angle1 = Math.atan2(curr.y - prev.y, curr.x - prev.x);
                        const angle2 = Math.atan2(next.y - curr.y, next.x - curr.x);
                        const angleDiff = Math.abs(angle2 - angle1);
                        
                        if (angleDiff > Math.PI / 3) directionChanges++;
                    }
                    
                    if (directionChanges > 3) {
                        return 'zigzag';
                    }
                    
                    return 'unknown';
                }
                
                executeGestureAction(gesture) {
                    switch (gesture) {
                        case 'circle':
                            this.score += 50;
                            this.createGlobalTouchEffect();
                            break;
                        case 'line':
                            this.interactiveObjects.forEach(obj => {
                                obj.x += (Math.random() - 0.5) * 100;
                                obj.y += (Math.random() - 0.5) * 100;
                            });
                            break;
                        case 'zigzag':
                            this.score += 25;
                            break;
                    }
                }
                
                createGlobalTouchEffect() {
                    for (let i = 0; i < 10; i++) {
                        this.createTouchEffect(
                            Math.random() * this.canvas.width,
                            Math.random() * this.canvas.height
                        );
                    }
                }
                
                // 마우스 지원 (데스탑 테스트용)
                handleMouseDown(e) {
                    const rect = this.canvas.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const y = e.clientY - rect.top;
                    
                    this.addTouchPoint(0, x, y);
                    this.createTouchEffect(x, y);
                    this.startGestureRecording(x, y);
                }
                
                handleMouseMove(e) {
                    if (e.buttons === 1) {
                        const rect = this.canvas.getBoundingClientRect();
                        const x = e.clientX - rect.left;
                        const y = e.clientY - rect.top;
                        
                        this.updateTouchPoint(0, x, y);
                        this.addToTouchTrail(0, x, y);
                        
                        if (this.gestureRecognition.isRecording) {
                            this.addToGesturePath(x, y);
                        }
                    }
                }
                
                handleMouseUp(e) {
                    this.removeTouchPoint(0);
                    if (this.gestureRecognition.isRecording) {
                        this.endGestureRecording();
                    }
                }
            `
        };
    }

    /**
     * 향상된 2D 캔버스 구조 생성
     */
    generateCanvas2DStructure(gameSpec) {
        console.log('🔧 향상된 2D 캔버스 구조 생성 중...');
        
        // 게임 장르에 따른 특화 기능
        const genreFeatures = this.getGenreSpecificFeatures(gameSpec.genre);
        
        return {
            initCode: `
                // 향상된 2D 캔버스 시스템 초기화
                this.physics = {
                    gravity: ${genreFeatures.gravity},
                    friction: ${genreFeatures.friction},
                    bounce: ${genreFeatures.bounce},
                    airResistance: 0.99
                };
                
                // 파티클 시스템
                this.particles = [];
                this.maxParticles = 100;
                
                // 애니메이션 시스템
                this.animations = [];
                this.tweens = [];
                
                // 사운드 시스템 시뮬레이션
                this.soundEffects = {
                    jump: { frequency: 440, duration: 0.1 },
                    collect: { frequency: 880, duration: 0.2 },
                    hit: { frequency: 220, duration: 0.3 }
                };
                
                // 게임 오브젝트들
                this.gameObjects = [];
                this.backgroundLayers = [];
                this.foregroundEffects = [];
                
                // 게임 로직 초기화
                ${genreFeatures.initCode}
                
                // 배경 레이어 생성
                this.createBackgroundLayers();
            `,
            updateCode: `
                // 물리 엔진 업데이트
                this.updatePhysics();
                
                // 파티클 시스템 업데이트
                this.updateParticles();
                
                // 애니메이션 업데이트
                this.updateAnimations();
                
                // 게임 오브젝트 업데이트
                this.gameObjects.forEach(obj => {
                    this.updateGameObject(obj);
                });
                
                // 배경 레이어 스크롤링
                this.updateBackgroundLayers();
                
                // 장르별 게임 로직
                ${genreFeatures.updateCode}
                
                // 충돌 검사 및 처리
                this.handleCollisions();
                
                // 화면 밖 오브젝트 정리
                this.cleanupObjects();
            `,
            renderCode: `
                // 배경 레이어 렌더링
                this.renderBackgroundLayers();
                
                // 게임 오브젝트 렌더링
                this.gameObjects.forEach(obj => {
                    this.renderGameObject(obj);
                });
                
                // 장르별 렌더링
                ${genreFeatures.renderCode}
                
                // 파티클 렌더링
                this.renderParticles();
                
                // 전경 효과 렌더링
                this.renderForegroundEffects();
                
                // UI 오버레이
                this.renderUI();
            `,
            sensorCode: `
                const { orientation, acceleration } = sensorData.data;
                
                if (orientation) {
                    // 장르별 센서 처리
                    ${genreFeatures.sensorCode}
                    
                    // 공통 센서 처리
                    this.processOrientationData(orientation);
                }
                
                if (acceleration) {
                    this.processAccelerationData(acceleration);
                }
            `,
            resetCode: `
                // 게임 오브젝트 리셋
                this.gameObjects = [];
                this.particles = [];
                this.animations = [];
                this.foregroundEffects = [];
                
                // 장르별 리셋
                ${genreFeatures.resetCode}
                
                // 배경 레이어 재생성
                this.createBackgroundLayers();
            `,
            helperCode: `
                updatePhysics() {
                    this.gameObjects.forEach(obj => {
                        if (obj.physics) {
                            // 중력 적용
                            obj.velocityY += this.physics.gravity;
                            
                            // 마찰 적용
                            if (obj.onGround) {
                                obj.velocityX *= this.physics.friction;
                            } else {
                                obj.velocityX *= this.physics.airResistance;
                                obj.velocityY *= this.physics.airResistance;
                            }
                            
                            // 위치 업데이트
                            obj.x += obj.velocityX;
                            obj.y += obj.velocityY;
                        }
                    });
                }
                
                updateParticles() {
                    this.particles = this.particles.filter(particle => {
                        particle.life--;
                        particle.x += particle.velocityX;
                        particle.y += particle.velocityY;
                        particle.velocityY += 0.1; // 중력
                        particle.alpha = particle.life / particle.maxLife;
                        
                        return particle.life > 0;
                    });
                }
                
                updateAnimations() {
                    this.animations = this.animations.filter(anim => {
                        anim.currentFrame++;
                        
                        if (anim.currentFrame >= anim.duration) {
                            if (anim.onComplete) anim.onComplete();
                            return false;
                        }
                        
                        // 이징 업데이트
                        const progress = anim.currentFrame / anim.duration;
                        const easedProgress = this.easeInOutCubic(progress);
                        
                        Object.keys(anim.from).forEach(key => {
                            anim.target[key] = anim.from[key] + (anim.to[key] - anim.from[key]) * easedProgress;
                        });
                        
                        return true;
                    });
                }
                
                createParticle(x, y, color, velocity) {
                    if (this.particles.length < this.maxParticles) {
                        this.particles.push({
                            x: x,
                            y: y,
                            velocityX: (Math.random() - 0.5) * (velocity || 5),
                            velocityY: (Math.random() - 0.5) * (velocity || 5) - 2,
                            color: color || '#ffffff',
                            size: Math.random() * 3 + 1,
                            life: 60,
                            maxLife: 60,
                            alpha: 1
                        });
                    }
                }
                
                renderParticles() {
                    this.particles.forEach(particle => {
                        this.ctx.save();
                        this.ctx.globalAlpha = particle.alpha;
                        this.ctx.fillStyle = particle.color;
                        this.ctx.beginPath();
                        this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                        this.ctx.fill();
                        this.ctx.restore();
                    });
                }
                
                createBackgroundLayers() {
                    this.backgroundLayers = [
                        {
                            type: 'gradient',
                            colors: ['#0f172a', '#1e293b', '#334155'],
                            scrollSpeed: 0
                        },
                        {
                            type: 'stars',
                            count: 50,
                            scrollSpeed: 0.1,
                            stars: []
                        },
                        {
                            type: 'clouds',
                            count: 8,
                            scrollSpeed: 0.3,
                            clouds: []
                        }
                    ];
                    
                    // 별 생성
                    const starLayer = this.backgroundLayers.find(l => l.type === 'stars');
                    for (let i = 0; i < starLayer.count; i++) {
                        starLayer.stars.push({
                            x: Math.random() * this.canvas.width,
                            y: Math.random() * this.canvas.height,
                            size: Math.random() * 2 + 1,
                            brightness: Math.random()
                        });
                    }
                    
                    // 구름 생성
                    const cloudLayer = this.backgroundLayers.find(l => l.type === 'clouds');
                    for (let i = 0; i < cloudLayer.count; i++) {
                        cloudLayer.clouds.push({
                            x: Math.random() * this.canvas.width,
                            y: Math.random() * this.canvas.height * 0.6,
                            width: Math.random() * 100 + 50,
                            height: Math.random() * 30 + 20,
                            alpha: Math.random() * 0.3 + 0.1
                        });
                    }
                }
                
                renderBackgroundLayers() {
                    this.backgroundLayers.forEach(layer => {
                        switch (layer.type) {
                            case 'gradient':
                                const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
                                layer.colors.forEach((color, index) => {
                                    gradient.addColorStop(index / (layer.colors.length - 1), color);
                                });
                                this.ctx.fillStyle = gradient;
                                this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
                                break;
                                
                            case 'stars':
                                layer.stars.forEach(star => {
                                    this.ctx.fillStyle = \`rgba(255, 255, 255, \${star.brightness})\`;
                                    this.ctx.beginPath();
                                    this.ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
                                    this.ctx.fill();
                                });
                                break;
                                
                            case 'clouds':
                                layer.clouds.forEach(cloud => {
                                    this.ctx.fillStyle = \`rgba(255, 255, 255, \${cloud.alpha})\`;
                                    this.ctx.fillRect(cloud.x, cloud.y, cloud.width, cloud.height);
                                });
                                break;
                        }
                    });
                }
                
                easeInOutCubic(t) {
                    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
                }
                
                // 장르별 헬퍼 메소드들
                ${genreFeatures.helperCode}
            `
        };
    }

    /**
     * 게임 장르별 특화 기능 반환
     */
    getGenreSpecificFeatures(genre) {
        const features = {
            gravity: 0.5,
            friction: 0.9,
            bounce: 0.7,
            initCode: '',
            updateCode: '',
            renderCode: '',
            sensorCode: '',
            resetCode: '',
            helperCode: ''
        };
        
        switch (genre) {
            case 'platformer':
                features.gravity = 0.8;
                features.initCode = 'this.createPlatformerObjects();';
                features.updateCode = 'this.updatePlatformerLogic();';
                break;
                
            case 'puzzle':
                features.gravity = 0;
                features.initCode = 'this.createPuzzleGrid();';
                features.updateCode = 'this.updatePuzzleLogic();';
                break;
                
            case 'racing':
                features.friction = 0.95;
                features.initCode = 'this.createRaceTrack();';
                features.updateCode = 'this.updateRacingLogic();';
                break;
                
            default:
                features.initCode = 'this.createBasicGameComponents();';
                features.updateCode = 'this.updateBasicGameLogic();';
        }
        
        return features;
    }

    /**
     * 기본 HTML 템플맿
     */
    getBaseHTMLTemplate() {
        return `<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{GAME_TITLE}}</title>
    <style>{{CSS_CONTENT}}</style>
</head>
<body>
    <div class="game-container">
        <!-- 게임 캔버스 -->
        <canvas id="gameCanvas" width="800" height="600"></canvas>
        
        <!-- 게임 UI 오버레이 -->
        <div class="game-ui">
            <!-- 세션 정보 패널 -->
            <div class="session-panel">
                <div class="session-title">🎮 {{GAME_TITLE}}</div>
                <div class="session-info">
                    <div class="session-code" id="sessionCode">----</div>
                    <div class="qr-container" id="qrContainer"></div>
                </div>
                <div class="sensor-status">
                    <span class="status-indicator" id="sensorStatus">⚪ 센서 대기중</span>
                </div>
            </div>

            <!-- 게임 정보 -->
            <div class="game-info">
                <div class="score">점수: <span id="score">0</span></div>
                <div class="lives">생명: <span id="lives">3</span></div>
                <div class="level">레벨: <span id="level">1</span></div>
            </div>

            <!-- 컨트롤 패널 -->
            <div class="control-panel">
                <button id="startBtn" onclick="startGame()">🎮 시작</button>
                <button id="pauseBtn" onclick="togglePause()">⏸️ 일시정지</button>
                <button id="resetBtn" onclick="resetGame()">🔄 재시작</button>
                <a href="/" class="home-btn">🏠 허브로</a>
            </div>
        </div>

        <!-- 게임 상태 메시지 -->
        <div class="message-overlay" id="messageOverlay">
            <div class="message-content" id="messageContent"></div>
        </div>
    </div>

    <!-- 필수 라이브러리 -->
    <script src="/socket.io/socket.io.js"></script>
    <script src="/js/SessionSDK.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js"></script>
    
    <!-- 3D 게임 라이브러리 -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
    
    <!-- QR 코드 인식 라이브러리 -->
    <script src="https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js"></script>

    <script>
        {{JS_CONTENT}}
    </script>
</body>
</html>`;
    }

    /**
     * 기본 CSS 템플릿
     */
    getBaseCSSTemplate() {
        return `
        :root {
            --primary: #3b82f6;
            --secondary: #8b5cf6;
            --success: #10b981;
            --warning: #f59e0b;
            --error: #ef4444;
            --background: #0f172a;
            --surface: #1e293b;
            --card: #334155;
            --text-primary: #f8fafc;
            --text-secondary: #cbd5e1;
            --text-muted: #94a3b8;
            --border: #475569;
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, var(--background), var(--surface));
            color: var(--text-primary);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .game-container {
            position: relative;
            max-width: 1200px;
            width: 100%;
            height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        #gameCanvas {
            background: linear-gradient(45deg, #1e293b, #334155);
            border-radius: 12px;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
            max-width: 100%;
            max-height: 80vh;
        }

        .game-ui {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            pointer-events: none;
            z-index: 10;
        }

        .session-panel {
            position: absolute;
            top: 20px;
            left: 20px;
            background: rgba(30, 41, 59, 0.9);
            backdrop-filter: blur(10px);
            border-radius: 12px;
            padding: 20px;
            pointer-events: auto;
            min-width: 250px;
        }

        .session-title {
            font-size: 1.2rem;
            font-weight: bold;
            margin-bottom: 15px;
            text-align: center;
            color: var(--primary);
        }

        .session-code {
            font-size: 2rem;
            font-weight: bold;
            text-align: center;
            margin-bottom: 15px;
            color: var(--success);
            font-family: 'Courier New', monospace;
        }

        .qr-container {
            display: flex;
            justify-content: center;
            margin-bottom: 15px;
        }

        .sensor-status {
            text-align: center;
            font-size: 0.9rem;
        }

        .status-indicator {
            display: inline-block;
            margin-right: 5px;
        }

        .game-info {
            position: absolute;
            top: 20px;
            right: 20px;
            background: rgba(30, 41, 59, 0.9);
            backdrop-filter: blur(10px);
            border-radius: 12px;
            padding: 20px;
            pointer-events: auto;
        }

        .game-info > div {
            margin-bottom: 10px;
            font-weight: bold;
        }

        .control-panel {
            position: absolute;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            display: flex;
            gap: 15px;
            pointer-events: auto;
        }

        .control-panel button,
        .control-panel .home-btn {
            background: var(--primary);
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            font-size: 1rem;
            cursor: pointer;
            transition: all 0.3s ease;
            text-decoration: none;
            display: inline-block;
        }

        .control-panel button:hover,
        .control-panel .home-btn:hover {
            background: var(--secondary);
            transform: translateY(-2px);
        }

        .message-overlay {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.8);
            display: none;
            align-items: center;
            justify-content: center;
            z-index: 100;
        }

        .message-content {
            background: var(--surface);
            padding: 40px;
            border-radius: 12px;
            text-align: center;
            font-size: 1.5rem;
            font-weight: bold;
        }

        @media (max-width: 768px) {
            .session-panel,
            .game-info {
                position: relative;
                margin: 10px;
            }
            
            .control-panel {
                position: relative;
                transform: none;
                justify-content: center;
                margin: 20px;
            }
        }`;
    }

    /**
     * 기본 JavaScript 템플릿
     */
    getBaseJSTemplate() {
        return `
        // 게임 메인 클래스
        class {{GAME_CLASS_NAME}} {
            constructor() {
                this.canvas = document.getElementById('gameCanvas');
                this.ctx = this.canvas.getContext('2d');
                
                // 게임 상태
                this.gameState = 'waiting'; // waiting, playing, paused, gameOver
                this.score = 0;
                this.lives = 3;
                this.level = 1;
                this.isPaused = false;
                
                // SessionSDK 초기화
                this.sdk = new SessionSDK({
                    gameId: '{{GAME_ID}}',
                    gameType: '{{GAME_TYPE}}',
                    debug: true
                });
                
                this.setupEvents();
                this.init();
            }
            
            setupEvents() {
                // SessionSDK 이벤트 처리
                this.sdk.on('connected', () => {
                    console.log('✅ 서버 연결 완료');
                    this.createSession();
                });
                
                this.sdk.on('session-created', (event) => {
                    const session = event.detail || event;
                    this.displaySessionInfo(session);
                });
                
                this.sdk.on('sensor-connected', (event) => {
                    const data = event.detail || event;
                    this.onSensorConnected(data);
                });
                
                this.sdk.on('sensor-data', (event) => {
                    const data = event.detail || event;
                    this.processSensorData(data);
                });
                
                this.sdk.on('game-ready', (event) => {
                    const data = event.detail || event;
                    this.onGameReady();
                });
            }
            
            async createSession() {
                try {
                    await this.sdk.createSession();
                } catch (error) {
                    console.error('세션 생성 실패:', error);
                }
            }
            
            displaySessionInfo(session) {
                document.getElementById('sessionCode').textContent = session.sessionCode;
                
                const qrUrl = \`\${window.location.origin}/sensor.html?session=\${session.sessionCode}\`;
                
                if (typeof QRCode !== 'undefined') {
                    QRCode.toCanvas(document.createElement('canvas'), qrUrl, (error, canvas) => {
                        if (!error) {
                            canvas.style.width = '150px';
                            canvas.style.height = '150px';
                            document.getElementById('qrContainer').innerHTML = '';
                            document.getElementById('qrContainer').appendChild(canvas);
                        } else {
                            this.showQRCodeFallback(qrUrl);
                        }
                    });
                } else {
                    this.showQRCodeFallback(qrUrl);
                }
            }
            
            showQRCodeFallback(qrUrl) {
                const qrApiUrl = \`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=\${encodeURIComponent(qrUrl)}\`;
                const img = document.createElement('img');
                img.src = qrApiUrl;
                img.style.width = '150px';
                img.style.height = '150px';
                img.alt = 'QR Code';
                
                document.getElementById('qrContainer').innerHTML = '';
                document.getElementById('qrContainer').appendChild(img);
            }
            
            onSensorConnected(data) {
                console.log('센서 연결됨:', data);
                document.getElementById('sensorStatus').innerHTML = '🟢 센서 연결됨';
            }
            
            onGameReady() {
                document.getElementById('sensorStatus').innerHTML = '🟢 게임 준비 완료';
                this.showMessage('센서가 연결되었습니다!\\n게임을 시작하세요', 2000);
            }
            
            processSensorData(sensorData) {
                if (this.gameState !== 'playing') return;
                
                {{SENSOR_PROCESSING_LOGIC}}
            }
            
            init() {
                this.resize();
                this.gameLoop();
                
                // 윈도우 리사이즈 이벤트
                window.addEventListener('resize', () => this.resize());
                
                // 사용자 정의 초기화 대기
                if (typeof this.customInit === 'function') {
                    this.customInit();
                }
            }
            
            resize() {
                const container = this.canvas.parentElement;
                const containerRect = container.getBoundingClientRect();
                
                const maxWidth = Math.min(800, containerRect.width - 40);
                const maxHeight = Math.min(600, containerRect.height - 40);
                
                this.canvas.style.width = maxWidth + 'px';
                this.canvas.style.height = maxHeight + 'px';
            }
            
            gameLoop() {
                this.update();
                this.render();
                requestAnimationFrame(() => this.gameLoop());
            }
            
            update() {
                if (this.gameState !== 'playing' || this.isPaused) return;
                
                {{GAME_UPDATE_LOGIC}}
            }
            
            render() {
                // 화면 클리어
                this.ctx.fillStyle = '#1e293b';
                this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
                
                {{GAME_RENDER_LOGIC}}
                
                this.updateUI();
            }
            
            updateUI() {
                document.getElementById('score').textContent = this.score;
                document.getElementById('lives').textContent = this.lives;
                document.getElementById('level').textContent = this.level;
            }
            
            showMessage(message, duration = 3000) {
                const overlay = document.getElementById('messageOverlay');
                const content = document.getElementById('messageContent');
                
                content.textContent = message;
                overlay.style.display = 'flex';
                
                setTimeout(() => {
                    overlay.style.display = 'none';
                }, duration);
            }
            
            startGame() {
                if (this.gameState === 'waiting') {
                    this.gameState = 'playing';
                    this.showMessage('게임 시작!', 1500);
                }
            }
            
            togglePause() {
                if (this.gameState === 'playing') {
                    this.isPaused = !this.isPaused;
                    const pauseBtn = document.getElementById('pauseBtn');
                    pauseBtn.textContent = this.isPaused ? '▶️ 계속' : '⏸️ 일시정지';
                    
                    if (this.isPaused) {
                        this.showMessage('일시정지', 1000);
                    }
                }
            }
            
            resetGame() {
                this.gameState = 'waiting';
                this.score = 0;
                this.lives = 3;
                this.level = 1;
                this.isPaused = false;
                
                document.getElementById('pauseBtn').textContent = '⏸️ 일시정지';
                this.showMessage('게임 리셋!', 1500);
                
                {{GAME_RESET_LOGIC}}
            }
            
            gameOver() {
                this.gameState = 'gameOver';
                this.showMessage(\`게임 종료!\\n최종 점수: \${this.score}\`, 5000);
            }
        }
        
        // 전역 함수들
        function startGame() {
            game.startGame();
        }
        
        function togglePause() {
            game.togglePause();
        }
        
        function resetGame() {
            game.resetGame();
        }
        
        // 게임 인스턴스 생성
        let game;
        
        window.addEventListener('load', () => {
            game = new {{GAME_CLASS_NAME}}();
        });`;
    }

    /**
     * 플랫폼 게임 템플릿
     */
    getPlatformerTemplate() {
        return {
            gameLogic: `
                // 플레이어 객체
                this.player = {
                    x: 100,
                    y: 300,
                    width: 30,
                    height: 40,
                    velocityX: 0,
                    velocityY: 0,
                    onGround: false,
                    color: '#3b82f6'
                };
                
                // 플랫폼들
                this.platforms = [
                    { x: 0, y: 550, width: 800, height: 50 },
                    { x: 200, y: 450, width: 150, height: 20 },
                    { x: 500, y: 350, width: 150, height: 20 }
                ];
                
                // 적들
                this.enemies = [
                    { x: 300, y: 430, width: 20, height: 20, speed: 1, direction: 1 }
                ];
                
                // 수집 아이템
                this.collectibles = [
                    { x: 250, y: 420, width: 15, height: 15, collected: false }
                ];
            `,
            updateLogic: `
                // 중력 적용
                this.player.velocityY += 0.5;
                
                // 플레이어 이동
                this.player.x += this.player.velocityX;
                this.player.y += this.player.velocityY;
                
                // 플랫폼 충돌 검사
                this.player.onGround = false;
                this.platforms.forEach(platform => {
                    if (this.checkCollision(this.player, platform)) {
                        if (this.player.velocityY > 0) {
                            this.player.y = platform.y - this.player.height;
                            this.player.velocityY = 0;
                            this.player.onGround = true;
                        }
                    }
                });
                
                // 적 이동
                this.enemies.forEach(enemy => {
                    enemy.x += enemy.speed * enemy.direction;
                    if (enemy.x <= 200 || enemy.x >= 330) {
                        enemy.direction *= -1;
                    }
                });
                
                // 수집 아이템 체크
                this.collectibles.forEach(item => {
                    if (!item.collected && this.checkCollision(this.player, item)) {
                        item.collected = true;
                        this.score += 10;
                    }
                });
                
                // 경계 체크
                if (this.player.x < 0) this.player.x = 0;
                if (this.player.x > this.canvas.width - this.player.width) {
                    this.player.x = this.canvas.width - this.player.width;
                }
                
                // 떨어짐 체크
                if (this.player.y > this.canvas.height) {
                    this.lives--;
                    if (this.lives <= 0) {
                        this.gameOver();
                    } else {
                        this.resetPlayerPosition();
                    }
                }
            `,
            renderLogic: `
                // 플랫폼 그리기
                this.ctx.fillStyle = '#475569';
                this.platforms.forEach(platform => {
                    this.ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
                });
                
                // 플레이어 그리기
                this.ctx.fillStyle = this.player.color;
                this.ctx.fillRect(this.player.x, this.player.y, this.player.width, this.player.height);
                
                // 적 그리기
                this.ctx.fillStyle = '#ef4444';
                this.enemies.forEach(enemy => {
                    this.ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
                });
                
                // 수집 아이템 그리기
                this.ctx.fillStyle = '#f59e0b';
                this.collectibles.forEach(item => {
                    if (!item.collected) {
                        this.ctx.fillRect(item.x, item.y, item.width, item.height);
                    }
                });
            `,
            sensorLogic: `
                const { orientation } = sensorData.data;
                if (orientation) {
                    // 좌우 기울기로 이동
                    this.player.velocityX = orientation.gamma * 0.2;
                    
                    // 앞으로 기울이면 점프
                    if (orientation.beta < -20 && this.player.onGround) {
                        this.player.velocityY = -12;
                    }
                }
            `,
            resetLogic: `
                this.player.x = 100;
                this.player.y = 300;
                this.player.velocityX = 0;
                this.player.velocityY = 0;
                
                this.collectibles.forEach(item => {
                    item.collected = false;
                });
            `,
            helperMethods: `
                checkCollision(rect1, rect2) {
                    return rect1.x < rect2.x + rect2.width &&
                           rect1.x + rect1.width > rect2.x &&
                           rect1.y < rect2.y + rect2.height &&
                           rect1.y + rect1.height > rect2.y;
                }
                
                resetPlayerPosition() {
                    this.player.x = 100;
                    this.player.y = 300;
                    this.player.velocityX = 0;
                    this.player.velocityY = 0;
                }
            `
        };
    }

    /**
     * 퍼즐 게임 템플릿
     */
    getPuzzleTemplate() {
        return {
            gameLogic: `
                // 미로 맵 (1: 벽, 0: 길)
                this.maze = [
                    [1,1,1,1,1,1,1,1,1,1],
                    [1,0,0,0,1,0,0,0,0,1],
                    [1,0,1,0,1,0,1,1,0,1],
                    [1,0,1,0,0,0,0,1,0,1],
                    [1,0,1,1,1,1,0,1,0,1],
                    [1,0,0,0,0,0,0,1,0,1],
                    [1,1,1,1,1,1,0,0,0,1],
                    [1,1,1,1,1,1,1,1,1,1]
                ];
                
                // 플레이어 위치 (격자 좌표)
                this.player = {
                    gridX: 1,
                    gridY: 1,
                    x: 1 * 60 + 10,
                    y: 1 * 60 + 10,
                    size: 40,
                    color: '#10b981'
                };
                
                // 목표 지점
                this.goal = {
                    gridX: 8,
                    gridY: 6,
                    x: 8 * 60 + 10,
                    y: 6 * 60 + 10,
                    size: 40,
                    color: '#f59e0b'
                };
                
                this.cellSize = 60;
            `,
            updateLogic: `
                // 플레이어 실제 위치 업데이트
                this.player.x = this.player.gridX * this.cellSize + 10;
                this.player.y = this.player.gridY * this.cellSize + 10;
                
                // 목표 도달 체크
                if (this.player.gridX === this.goal.gridX && 
                    this.player.gridY === this.goal.gridY) {
                    this.score += 100;
                    this.level++;
                    this.generateNewMaze();
                }
            `,
            renderLogic: `
                // 미로 그리기
                for (let y = 0; y < this.maze.length; y++) {
                    for (let x = 0; x < this.maze[y].length; x++) {
                        if (this.maze[y][x] === 1) {
                            this.ctx.fillStyle = '#475569';
                        } else {
                            this.ctx.fillStyle = '#334155';
                        }
                        this.ctx.fillRect(x * this.cellSize, y * this.cellSize, 
                                         this.cellSize, this.cellSize);
                    }
                }
                
                // 목표 지점 그리기
                this.ctx.fillStyle = this.goal.color;
                this.ctx.fillRect(this.goal.x, this.goal.y, this.goal.size, this.goal.size);
                
                // 플레이어 그리기
                this.ctx.fillStyle = this.player.color;
                this.ctx.fillRect(this.player.x, this.player.y, this.player.size, this.player.size);
            `,
            sensorLogic: `
                const { orientation } = sensorData.data;
                if (orientation) {
                    let newX = this.player.gridX;
                    let newY = this.player.gridY;
                    
                    // 기울기 방향에 따른 이동
                    if (orientation.gamma > 15) newX++; // 우측
                    if (orientation.gamma < -15) newX--; // 좌측
                    if (orientation.beta > 15) newY++; // 하향
                    if (orientation.beta < -15) newY--; // 상향
                    
                    // 벽 충돌 체크
                    if (newY >= 0 && newY < this.maze.length &&
                        newX >= 0 && newX < this.maze[newY].length &&
                        this.maze[newY][newX] === 0) {
                        this.player.gridX = newX;
                        this.player.gridY = newY;
                    }
                }
            `,
            resetLogic: `
                this.player.gridX = 1;
                this.player.gridY = 1;
            `,
            helperMethods: `
                generateNewMaze() {
                    // 간단한 미로 생성 로직 (여기서는 기본 미로 재사용)
                    this.showMessage(\`레벨 \${this.level} 클리어!\`, 2000);
                }
            `
        };
    }

    /**
     * 레이싱 게임 템플릿
     */
    getRacingTemplate() {
        return {
            gameLogic: `
                // 플레이어 차량
                this.car = {
                    x: 375,
                    y: 500,
                    width: 50,
                    height: 80,
                    speed: 0,
                    maxSpeed: 8,
                    color: '#3b82f6'
                };
                
                // 도로 차선
                this.roadLines = [];
                for (let i = 0; i < 10; i++) {
                    this.roadLines.push({
                        x: 395,
                        y: i * 120,
                        width: 10,
                        height: 60
                    });
                }
                
                // 장애물 차량들
                this.obstacles = [
                    { x: 300, y: -100, width: 50, height: 80, speed: 3, color: '#ef4444' },
                    { x: 450, y: -300, width: 50, height: 80, speed: 4, color: '#f59e0b' }
                ];
                
                this.roadSpeed = 5;
            `,
            updateLogic: `
                // 도로 움직임
                this.roadLines.forEach(line => {
                    line.y += this.roadSpeed;
                    if (line.y > this.canvas.height) {
                        line.y = -60;
                    }
                });
                
                // 장애물 이동
                this.obstacles.forEach(obstacle => {
                    obstacle.y += obstacle.speed + this.roadSpeed;
                    if (obstacle.y > this.canvas.height) {
                        obstacle.y = -100;
                        obstacle.x = 250 + Math.random() * 300;
                        this.score += 10;
                    }
                    
                    // 충돌 검사
                    if (this.checkCollision(this.car, obstacle)) {
                        this.lives--;
                        if (this.lives <= 0) {
                            this.gameOver();
                        } else {
                            obstacle.y = -100;
                        }
                    }
                });
                
                // 차량 경계 체크
                if (this.car.x < 250) this.car.x = 250;
                if (this.car.x > 500) this.car.x = 500;
                
                // 속도 증가
                this.roadSpeed += 0.001;
            `,
            renderLogic: `
                // 도로 배경
                this.ctx.fillStyle = '#374151';
                this.ctx.fillRect(250, 0, 300, this.canvas.height);
                
                // 도로 경계선
                this.ctx.fillStyle = '#f9fafb';
                this.ctx.fillRect(250, 0, 5, this.canvas.height);
                this.ctx.fillRect(545, 0, 5, this.canvas.height);
                
                // 중앙선
                this.ctx.fillStyle = '#fbbf24';
                this.roadLines.forEach(line => {
                    this.ctx.fillRect(line.x, line.y, line.width, line.height);
                });
                
                // 장애물 차량
                this.obstacles.forEach(obstacle => {
                    this.ctx.fillStyle = obstacle.color;
                    this.ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
                });
                
                // 플레이어 차량
                this.ctx.fillStyle = this.car.color;
                this.ctx.fillRect(this.car.x, this.car.y, this.car.width, this.car.height);
            `,
            sensorLogic: `
                const { orientation } = sensorData.data;
                if (orientation) {
                    // 좌우 기울기로 차량 조작
                    this.car.x += orientation.gamma * 0.5;
                }
            `,
            resetLogic: `
                this.car.x = 375;
                this.car.speed = 0;
                this.roadSpeed = 5;
                
                this.obstacles.forEach(obstacle => {
                    obstacle.y = -Math.random() * 500 - 100;
                    obstacle.x = 250 + Math.random() * 300;
                });
            `,
            helperMethods: `
                checkCollision(rect1, rect2) {
                    return rect1.x < rect2.x + rect2.width &&
                           rect1.x + rect1.width > rect2.x &&
                           rect1.y < rect2.y + rect2.height &&
                           rect1.y + rect1.height > rect2.y;
                }
            `
        };
    }

    /**
     * 아케이드 게임 템플릿 (기본)
     */
    getArcadeTemplate() {
        return {
            gameLogic: `
                // 패들 (플레이어 조작)
                this.paddle = {
                    x: this.canvas.width / 2 - 60,
                    y: this.canvas.height - 30,
                    width: 120,
                    height: 15,
                    color: '#3b82f6'
                };
                
                // 공
                this.ball = {
                    x: this.canvas.width / 2,
                    y: this.canvas.height - 50,
                    radius: 12,
                    velocityX: 4,
                    velocityY: -4,
                    color: '#f59e0b',
                    maxSpeed: 8
                };
                
                // 벽돌들
                this.bricks = [];
                this.createBricks();
                
                this.lives = 3;
                this.gameStarted = false;
            `,
            updateLogic: `
                if (!this.gameStarted) return;
                
                // 공 이동
                this.ball.x += this.ball.velocityX;
                this.ball.y += this.ball.velocityY;
                
                // 좌우 벽 충돌
                if (this.ball.x - this.ball.radius < 0 || 
                    this.ball.x + this.ball.radius > this.canvas.width) {
                    this.ball.velocityX = -this.ball.velocityX;
                    this.ball.x = Math.max(this.ball.radius, 
                                          Math.min(this.canvas.width - this.ball.radius, this.ball.x));
                }
                
                // 상단 벽 충돌
                if (this.ball.y - this.ball.radius < 0) {
                    this.ball.velocityY = -this.ball.velocityY;
                    this.ball.y = this.ball.radius;
                }
                
                // 하단 벽 충돌 (생명 감소)
                if (this.ball.y + this.ball.radius > this.canvas.height) {
                    this.lives--;
                    if (this.lives <= 0) {
                        this.showMessage('게임 오버!');
                        this.resetGame();
                    } else {
                        this.resetBall();
                    }
                }
                
                // 패들과 공 충돌
                if (this.ball.y + this.ball.radius > this.paddle.y &&
                    this.ball.x > this.paddle.x && 
                    this.ball.x < this.paddle.x + this.paddle.width) {
                    
                    this.ball.velocityY = -Math.abs(this.ball.velocityY);
                    
                    // 패들 위치에 따른 반사 각도 조정
                    let relativeIntersectX = (this.ball.x - (this.paddle.x + this.paddle.width/2));
                    let normalizedIntersectX = relativeIntersectX / (this.paddle.width/2);
                    this.ball.velocityX = normalizedIntersectX * this.ball.maxSpeed;
                }
                
                // 벽돌과 공 충돌
                for (let i = this.bricks.length - 1; i >= 0; i--) {
                    let brick = this.bricks[i];
                    if (this.ball.x > brick.x && this.ball.x < brick.x + brick.width &&
                        this.ball.y > brick.y && this.ball.y < brick.y + brick.height) {
                        
                        this.ball.velocityY = -this.ball.velocityY;
                        this.bricks.splice(i, 1);
                        this.score += 10;
                        
                        // 모든 벽돌 제거 시 승리
                        if (this.bricks.length === 0) {
                            this.showMessage('승리! 모든 벽돌을 깨뜨렸습니다!');
                            this.resetGame();
                        }
                        break;
                    }
                }
            `,
            renderLogic: `
                // 패들 그리기
                this.ctx.fillStyle = this.paddle.color;
                this.ctx.fillRect(this.paddle.x, this.paddle.y, this.paddle.width, this.paddle.height);
                
                // 벽돌들 그리기
                this.bricks.forEach(brick => {
                    this.ctx.fillStyle = brick.color;
                    this.ctx.fillRect(brick.x, brick.y, brick.width, brick.height);
                    
                    // 벽돌 테두리
                    this.ctx.strokeStyle = '#1e293b';
                    this.ctx.lineWidth = 2;
                    this.ctx.strokeRect(brick.x, brick.y, brick.width, brick.height);
                });
                
                // 공 그리기
                this.ctx.fillStyle = this.ball.color;
                this.ctx.beginPath();
                this.ctx.arc(this.ball.x, this.ball.y, this.ball.radius, 0, Math.PI * 2);
                this.ctx.fill();
                
                // 생명 표시
                this.ctx.fillStyle = '#ef4444';
                this.ctx.font = '20px Arial';
                this.ctx.fillText('생명: ' + this.lives, 20, 30);
                
                // 게임 시작 안내
                if (!this.gameStarted) {
                    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
                    
                    this.ctx.fillStyle = '#ffffff';
                    this.ctx.font = '24px Arial';
                    this.ctx.textAlign = 'center';
                    this.ctx.fillText('기기를 기울여서 패들을 조작하세요', 
                                    this.canvas.width/2, this.canvas.height/2 - 20);
                    this.ctx.fillText('클릭하여 시작!', 
                                    this.canvas.width/2, this.canvas.height/2 + 20);
                    this.ctx.textAlign = 'left';
                }
            `,
            sensorLogic: `
                const { orientation } = sensorData.data;
                if (orientation && this.gameStarted) {
                    // 기울기로 패들 조작 (좌우만)
                    const tiltSensitivity = 4;
                    this.paddle.x += orientation.gamma * tiltSensitivity;
                    
                    // 패들이 화면 밖으로 나가지 않도록 제한
                    this.paddle.x = Math.max(0, Math.min(this.canvas.width - this.paddle.width, this.paddle.x));
                }
            `,
            resetLogic: `
                // 게임 초기화
                this.paddle.x = this.canvas.width / 2 - 60;
                this.resetBall();
                this.createBricks();
                this.lives = 3;
                this.score = 0;
                this.gameStarted = false;
            `,
            helperMethods: `
                createBricks() {
                    this.bricks = [];
                    const rows = 5;
                    const cols = 8;
                    const brickWidth = this.canvas.width / cols - 10;
                    const brickHeight = 25;
                    const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6'];
                    
                    for (let row = 0; row < rows; row++) {
                        for (let col = 0; col < cols; col++) {
                            this.bricks.push({
                                x: col * (brickWidth + 5) + 5,
                                y: row * (brickHeight + 5) + 50,
                                width: brickWidth,
                                height: brickHeight,
                                color: colors[row]
                            });
                        }
                    }
                }
                
                resetBall() {
                    this.ball.x = this.canvas.width / 2;
                    this.ball.y = this.canvas.height - 50;
                    this.ball.velocityX = 4;
                    this.ball.velocityY = -4;
                }
                
                // 게임 시작 처리
                startGame() {
                    this.gameStarted = true;
                }
                
                // 캔버스 클릭 이벤트 추가
                init() {
                    this.canvas.addEventListener('click', () => {
                        if (!this.gameStarted) {
                            this.startGame();
                        }
                    });
                }
            `
        };
    }

    /**
     * 액션 게임 템플릿
     */
    getActionTemplate() {
        return {
            gameLogic: `
                // 플레이어
                this.player = {
                    x: 400,
                    y: 300,
                    radius: 25,
                    health: 100,
                    maxHealth: 100,
                    color: '#3b82f6'
                };
                
                // 총알들
                this.bullets = [];
                
                // 적들
                this.enemies = [];
                this.spawnEnemy();
                
                this.lastShot = 0;
                this.shotCooldown = 200;
            `,
            updateLogic: `
                // 총알 업데이트
                this.bullets = this.bullets.filter(bullet => {
                    bullet.x += bullet.velocityX;
                    bullet.y += bullet.velocityY;
                    
                    return bullet.x > 0 && bullet.x < this.canvas.width &&
                           bullet.y > 0 && bullet.y < this.canvas.height;
                });
                
                // 적 업데이트
                this.enemies.forEach(enemy => {
                    // 플레이어를 향해 이동
                    const dx = this.player.x - enemy.x;
                    const dy = this.player.y - enemy.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    if (distance > 0) {
                        enemy.x += (dx / distance) * enemy.speed;
                        enemy.y += (dy / distance) * enemy.speed;
                    }
                    
                    // 플레이어와 충돌 체크
                    if (distance < this.player.radius + enemy.radius) {
                        this.player.health -= 1;
                        if (this.player.health <= 0) {
                            this.gameOver();
                        }
                    }
                });
                
                // 총알과 적 충돌 체크
                this.bullets.forEach((bullet, bulletIndex) => {
                    this.enemies.forEach((enemy, enemyIndex) => {
                        const distance = Math.sqrt(
                            Math.pow(bullet.x - enemy.x, 2) + 
                            Math.pow(bullet.y - enemy.y, 2)
                        );
                        
                        if (distance < bullet.radius + enemy.radius) {
                            this.bullets.splice(bulletIndex, 1);
                            this.enemies.splice(enemyIndex, 1);
                            this.score += 20;
                            this.spawnEnemy();
                        }
                    });
                });
                
                // 새 적 스폰
                if (Math.random() < 0.01) {
                    this.spawnEnemy();
                }
            `,
            renderLogic: `
                // 플레이어 그리기
                this.ctx.fillStyle = this.player.color;
                this.ctx.beginPath();
                this.ctx.arc(this.player.x, this.player.y, this.player.radius, 0, Math.PI * 2);
                this.ctx.fill();
                
                // 체력바 그리기
                const healthBarWidth = 200;
                const healthBarHeight = 20;
                const healthPercent = this.player.health / this.player.maxHealth;
                
                this.ctx.fillStyle = '#374151';
                this.ctx.fillRect(10, 10, healthBarWidth, healthBarHeight);
                
                this.ctx.fillStyle = healthPercent > 0.5 ? '#10b981' : 
                                   healthPercent > 0.25 ? '#f59e0b' : '#ef4444';
                this.ctx.fillRect(10, 10, healthBarWidth * healthPercent, healthBarHeight);
                
                // 총알 그리기
                this.ctx.fillStyle = '#fbbf24';
                this.bullets.forEach(bullet => {
                    this.ctx.beginPath();
                    this.ctx.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2);
                    this.ctx.fill();
                });
                
                // 적 그리기
                this.ctx.fillStyle = '#ef4444';
                this.enemies.forEach(enemy => {
                    this.ctx.beginPath();
                    this.ctx.arc(enemy.x, enemy.y, enemy.radius, 0, Math.PI * 2);
                    this.ctx.fill();
                });
            `,
            sensorLogic: `
                const { orientation, acceleration } = sensorData.data;
                
                if (orientation) {
                    // 기울기로 플레이어 이동
                    this.player.x += orientation.gamma * 0.5;
                    this.player.y += orientation.beta * 0.5;
                    
                    // 경계 체크
                    this.player.x = Math.max(this.player.radius, 
                                           Math.min(this.canvas.width - this.player.radius, this.player.x));
                    this.player.y = Math.max(this.player.radius, 
                                           Math.min(this.canvas.height - this.player.radius, this.player.y));
                }
                
                if (acceleration) {
                    // 흔들기로 총알 발사
                    const totalAccel = Math.sqrt(
                        acceleration.x ** 2 + acceleration.y ** 2 + acceleration.z ** 2
                    );
                    
                    if (totalAccel > 15 && Date.now() - this.lastShot > this.shotCooldown) {
                        this.shoot();
                        this.lastShot = Date.now();
                    }
                }
            `,
            resetLogic: `
                this.player.x = 400;
                this.player.y = 300;
                this.player.health = this.player.maxHealth;
                
                this.bullets = [];
                this.enemies = [];
                this.spawnEnemy();
            `,
            helperMethods: `
                spawnEnemy() {
                    const side = Math.floor(Math.random() * 4);
                    let x, y;
                    
                    switch (side) {
                        case 0: x = Math.random() * this.canvas.width; y = -20; break;
                        case 1: x = this.canvas.width + 20; y = Math.random() * this.canvas.height; break;
                        case 2: x = Math.random() * this.canvas.width; y = this.canvas.height + 20; break;
                        case 3: x = -20; y = Math.random() * this.canvas.height; break;
                    }
                    
                    this.enemies.push({
                        x: x,
                        y: y,
                        radius: 15,
                        speed: 1 + Math.random()
                    });
                }
                
                shoot() {
                    // 가장 가까운 적을 향해 발사
                    let targetX = this.canvas.width / 2;
                    let targetY = this.canvas.height / 2;
                    
                    if (this.enemies.length > 0) {
                        const nearestEnemy = this.enemies.reduce((nearest, enemy) => {
                            const distance = Math.sqrt(
                                Math.pow(this.player.x - enemy.x, 2) + 
                                Math.pow(this.player.y - enemy.y, 2)
                            );
                            return distance < nearest.distance ? 
                                   { enemy, distance } : nearest;
                        }, { distance: Infinity });
                        
                        if (nearestEnemy.enemy) {
                            targetX = nearestEnemy.enemy.x;
                            targetY = nearestEnemy.enemy.y;
                        }
                    }
                    
                    const dx = targetX - this.player.x;
                    const dy = targetY - this.player.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    if (distance > 0) {
                        const speed = 10;
                        this.bullets.push({
                            x: this.player.x,
                            y: this.player.y,
                            velocityX: (dx / distance) * speed,
                            velocityY: (dy / distance) * speed,
                            radius: 5
                        });
                    }
                }
            `
        };
    }

    /**
     * 게임 설정 생성
     */
    generateGameConfig(gameSpec) {
        return {
            gameId: gameSpec.suggestedGameId,
            gameType: gameSpec.gameType,
            title: gameSpec.suggestedTitle,
            className: this.generateClassName(gameSpec.suggestedGameId),
            sensors: gameSpec.sensors
        };
    }

    /**
     * 게임 로직 생성
     */
    generateGameLogic(gameSpec, template) {
        return {
            initLogic: template.gameLogic || '',
            updateLogic: template.updateLogic || '',
            renderLogic: template.renderLogic || '',
            resetLogic: template.resetLogic || '',
            helperMethods: template.helperMethods || ''
        };
    }

    /**
     * 센서 처리 로직 생성
     */
    generateSensorLogic(gameSpec) {
        const template = this.templates.get(gameSpec.genre) || this.templates.get('arcade');
        return template.sensorLogic || `
            const { orientation } = sensorData.data;
            if (orientation) {
                // 기본 센서 처리 로직
                console.log('센서 데이터:', orientation);
            }
        `;
    }

    /**
     * UI 컴포넌트 생성
     */
    generateUIComponents(gameSpec) {
        return {
            sessionPanel: true,
            gameInfo: true,
            controlPanel: true,
            messageOverlay: true
        };
    }

    /**
     * 전체 HTML 조립
     */
    assembleHTML(components) {
        const { gameSpec, gameConfig, gameLogic, sensorLogic, baseTemplate } = components;
        
        let html = baseTemplate.html;
        let css = this.getBaseCSSTemplate();
        let js = this.getBaseJSTemplate();

        // HTML 템플릿 변수 치환
        html = html.replace(/{{GAME_TITLE}}/g, gameConfig.title);
        html = html.replace(/{{CSS_CONTENT}}/g, css);
        html = html.replace(/{{JS_CONTENT}}/g, this.assembleJavaScript(gameConfig, gameLogic, sensorLogic));

        return html;
    }

    /**
     * JavaScript 코드 조립
     */
    assembleJavaScript(gameConfig, gameLogic, sensorLogic) {
        let js = this.getBaseJSTemplate();

        // JavaScript 템플릿 변수 치환
        js = js.replace(/{{GAME_CLASS_NAME}}/g, gameConfig.className);
        js = js.replace(/{{GAME_ID}}/g, gameConfig.gameId);
        js = js.replace(/{{GAME_TYPE}}/g, gameConfig.gameType);
        js = js.replace(/{{SENSOR_PROCESSING_LOGIC}}/g, sensorLogic);
        js = js.replace(/{{GAME_UPDATE_LOGIC}}/g, gameLogic.updateLogic);
        js = js.replace(/{{GAME_RENDER_LOGIC}}/g, gameLogic.renderLogic);
        js = js.replace(/{{GAME_RESET_LOGIC}}/g, gameLogic.resetLogic);

        // 게임 초기화 로직과 헬퍼 메서드 추가
        js = js.replace('this.init();', `
            ${gameLogic.initLogic}
            this.init();
        `);

        // 헬퍼 메서드 추가
        js = js.replace('// 게임 인스턴스 생성', `
            ${gameLogic.helperMethods}
            
            // 게임 인스턴스 생성
        `);

        return js;
    }

    /**
     * 클래스명 생성
     */
    generateClassName(gameId) {
        return gameId.split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join('') + 'Game';
    }

    /**
     * 게임 메타데이터 생성
     */
    generateGameMetadata(gameSpec) {
        return {
            id: gameSpec.suggestedGameId,
            title: gameSpec.suggestedTitle,
            description: `AI가 생성한 ${gameSpec.genre} 게임입니다. ${gameSpec.objective}`,
            category: gameSpec.gameType,
            icon: this.getGenreIcon(gameSpec.genre),
            version: "1.0.0",
            author: "AI Game Generator",
            sensors: gameSpec.sensors,
            maxPlayers: gameSpec.gameType === 'solo' ? 1 : gameSpec.gameType === 'dual' ? 2 : 8,
            difficulty: gameSpec.difficulty,
            status: "active",
            featured: false,
            tags: [gameSpec.genre, ...gameSpec.sensorMechanics, "ai-generated"],
            instructions: [
                gameSpec.objective,
                "모바일을 기울여서 조작하세요",
                "세션 코드로 센서를 연결하세요"
            ],
            controls: this.generateControlsDescription(gameSpec),
            createdAt: new Date().toISOString(),
            aiGenerated: true,
            originalPrompt: gameSpec.originalInput
        };
    }

    /**
     * 장르별 아이콘 반환
     */
    getGenreIcon(genre) {
        const icons = {
            platformer: '🏃',
            puzzle: '🧩',
            racing: '🏎️',
            adventure: '🗺️',
            arcade: '🕹️',
            action: '⚔️',
            sports: '⚽',
            rhythm: '🎵'
        };
        return icons[genre] || '🎮';
    }

    /**
     * 조작법 설명 생성
     */
    generateControlsDescription(gameSpec) {
        const controls = {};
        
        gameSpec.sensorMechanics.forEach(mechanic => {
            switch (mechanic) {
                case 'tilt':
                    controls['기울기'] = '캐릭터/오브젝트 이동';
                    break;
                case 'shake':
                    controls['흔들기'] = '특수 액션 실행';
                    break;
                case 'rotate':
                    controls['회전'] = '방향 전환';
                    break;
                case 'motion':
                    controls['움직임'] = '다양한 제스처 인식';
                    break;
            }
        });

        return controls;
    }
}

module.exports = GameTemplateEngine;