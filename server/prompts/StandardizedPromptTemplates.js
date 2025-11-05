/**
 * 🧠 표준화된 프롬프트 템플릿 시스템 v6.0
 *
 * 목적: 새로운 게임 템플릿 표준화 시스템에 최적화된 프롬프트 생성
 * 특징:
 * - GameTemplateStandard와 완전 통합
 * - 90%+ 성공률을 위한 검증된 프롬프트 패턴
 * - 단계별 코드 생성 가이드
 * - 실시간 검증 및 수정 지원
 */

const GameTemplateStandard = require('../templates/GameTemplateStandard');

class StandardizedPromptTemplates {
    constructor() {
        this.templateStandard = new GameTemplateStandard();
        this.templateStandard.initializeAllTemplates();

        this.initializePromptCategories();
        this.initializeValidationPrompts();
        this.initializeEnhancementPrompts();
    }

    /**
     * 프롬프트 카테고리 초기화
     */
    initializePromptCategories() {
        this.systemPrompts = {
            gameAnalyzer: this.createGameAnalyzerPrompt(),
            codeGenerator: this.createCodeGeneratorPrompt(),
            validator: this.createValidatorPrompt(),
            enhancer: this.createEnhancerPrompt()
        };

        this.gameTypePrompts = {
            solo: this.createSoloGamePrompt(),
            dual: this.createDualGamePrompt(),
            multi: this.createMultiGamePrompt()
        };

        this.componentPrompts = {
            physics: this.createPhysicsPrompt(),
            ui: this.createUIPrompt(),
            sensors: this.createSensorPrompt(),
            graphics: this.createGraphicsPrompt()
        };
    }

    /**
     * 게임 분석용 시스템 프롬프트
     */
    createGameAnalyzerPrompt() {
        const standardTemplates = this.templateStandard.getAllTemplates();

        return `당신은 센서 게임 전문 분석가입니다. 사용자의 게임 아이디어를 분석하여 최적의 구현 방향을 제시해야 합니다.

**사용 가능한 표준 템플릿:**
${Object.keys(standardTemplates).map(key => {
    const template = standardTemplates[key];
    return `- ${key.toUpperCase()}: ${template.description} (센서 ${template.requiredSensors}개)
  특징: ${template.features.join(', ')}`;
}).join('\n')}

**분석 기준:**
1. 센서 사용 패턴 (1개, 2개, 또는 다중)
2. 게임 장르 및 메커니즘
3. 기술적 복잡도
4. 구현 가능성

**출력 형식 (JSON):**
{
    "gameType": "solo|dual|multi",
    "genre": "physics|action|puzzle|racing|cooking",
    "complexity": "simple|medium|complex",
    "requiredFeatures": ["feature1", "feature2"],
    "recommendedTemplate": "solo|dual|multi",
    "technicalRequirements": {
        "sensors": ["orientation", "acceleration", "rotationRate"],
        "interactions": ["tilt", "shake", "rotate"],
        "graphics": ["2d", "particles", "animations"]
    },
    "implementationNotes": "구체적인 구현 방향"
}

사용자 입력을 분석하고 위 형식으로 응답하세요.`;
    }

    /**
     * 코드 생성용 시스템 프롬프트
     */
    createCodeGeneratorPrompt() {
        const soloTemplate = this.templateStandard.getTemplate('solo');

        return `당신은 센서 게임 코드 생성 전문가입니다. 표준화된 템플릿을 기반으로 완전한 HTML 게임을 생성해야 합니다.

**핵심 규칙:**
1. 반드시 SessionSDK를 사용한 센서 연결
2. 모든 이벤트는 CustomEvent 패턴 사용: event.detail || event
3. 에러 처리 시스템 포함
4. Canvas 기반 렌더링
5. 센서 데이터 검증 및 스무딩

**표준 구조 (Solo Game 예시):**
\`\`\`html
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>[게임 제목]</title>
    <style>
        /* 표준 CSS 구조 */
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: "Segoe UI", sans-serif; overflow: hidden; }
        .game-container { width: 100vw; height: 100vh; display: flex; flex-direction: column; }
        /* 게임별 특화 스타일 */
    </style>
</head>
<body>
    <div class="game-container">
        <!-- 표준 헤더 -->
        <div class="header">
            <div class="game-title">[게임 제목]</div>
            <div class="session-info">
                <div class="status-indicator" id="connectionStatus"></div>
                <span>세션: <span id="sessionCode">----</span></span>
            </div>
        </div>

        <!-- 게임 캔버스 -->
        <canvas id="gameCanvas"></canvas>

        <!-- 컨트롤 패널 -->
        <div class="control-panel">
            <!-- 게임별 컨트롤 -->
        </div>
    </div>

    <script src="/js/SessionSDK.js"></script>
    <script>
        // 표준 SDK 초기화
        const sdk = new SessionSDK({
            gameId: '[game-id]',
            gameType: '[solo|dual|multi]'
        });

        // 게임 클래스
        class [GameName] {
            constructor() {
                this.canvas = document.getElementById('gameCanvas');
                this.ctx = this.canvas.getContext('2d');
                this.setupCanvas();
                this.initializeGame();
                this.startGameLoop();
            }

            setupCanvas() {
                this.canvas.width = window.innerWidth;
                this.canvas.height = window.innerHeight - 100;

                window.addEventListener('resize', () => {
                    this.canvas.width = window.innerWidth;
                    this.canvas.height = window.innerHeight - 100;
                });
            }

            initializeGame() {
                // 게임 오브젝트 초기화
            }

            processSensorData(data) {
                // 센서 데이터 처리
                const { orientation, acceleration } = data.data;
                // 구체적인 게임 로직
            }

            update() {
                // 게임 로직 업데이트
            }

            render() {
                // 렌더링 로직
                this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
                // 게임 오브젝트 렌더링
            }

            startGameLoop() {
                const gameLoop = () => {
                    this.update();
                    this.render();
                    requestAnimationFrame(gameLoop);
                };
                gameLoop();
            }
        }

        // SDK 이벤트 처리
        let game;

        sdk.on('connected', () => {
            sdk.createSession('[game-id]', '[game-type]');
        });

        sdk.on('session-created', (event) => {
            const session = event.detail || event;
            document.getElementById('sessionCode').textContent = session.sessionCode;

            // 게임 인스턴스 생성
            game = new [GameName]();
        });

        sdk.on('sensor-connected', (event) => {
            document.getElementById('connectionStatus').classList.add('connected');
        });

        sdk.on('sensor-data', (event) => {
            const data = event.detail || event;
            if (game) {
                game.processSensorData(data);
            }
        });
    </script>
</body>
</html>
\`\`\`

**중요 사항:**
- 위 구조를 반드시 따르세요
- 사용자 요구사항에 맞게 게임 로직만 변경하세요
- 모든 센서 데이터는 검증 후 사용하세요
- 에러 처리를 포함하세요

사용자의 게임 아이디어와 분석 결과를 바탕으로 완전한 HTML 코드를 생성하세요.`;
    }

    /**
     * 검증용 시스템 프롬프트
     */
    createValidatorPrompt() {
        return `당신은 센서 게임 코드 검증 전문가입니다. 생성된 코드의 품질과 동작 가능성을 검사해야 합니다.

**검증 항목:**

1. **구조적 검증**
   - HTML 문법 정확성
   - CSS 스타일 완성도
   - JavaScript 문법 오류
   - SessionSDK 올바른 사용

2. **기능적 검증**
   - 센서 데이터 처리 로직
   - 게임 루프 구현
   - 이벤트 처리 (CustomEvent 패턴)
   - 에러 처리 시스템

3. **성능 검증**
   - Canvas 렌더링 최적화
   - 메모리 누수 방지
   - 이벤트 리스너 정리
   - 프레임률 안정성

4. **사용자 경험 검증**
   - 반응형 디자인
   - 접근성 고려
   - 시각적 피드백
   - 센서 연결 상태 표시

**출력 형식 (JSON):**
{
    "isValid": true/false,
    "score": 0-100,
    "structuralIssues": ["문제1", "문제2"],
    "functionalIssues": ["문제1", "문제2"],
    "performanceIssues": ["문제1", "문제2"],
    "uxIssues": ["문제1", "문제2"],
    "fixedCode": "수정된 코드 (문제가 있는 경우)",
    "recommendations": ["개선 제안1", "개선 제안2"]
}

코드를 분석하고 위 형식으로 검증 결과를 제공하세요.`;
    }

    /**
     * 향상용 시스템 프롬프트
     */
    createEnhancerPrompt() {
        return `당신은 센서 게임 향상 전문가입니다. 기본 게임을 더욱 흥미롭고 몰입감 있게 개선해야 합니다.

**향상 영역:**

1. **게임플레이 향상**
   - 레벨 시스템 추가
   - 점수 시스템 개선
   - 도전 과제 추가
   - 난이도 조절

2. **시각적 향상**
   - 파티클 효과 추가
   - 애니메이션 개선
   - 시각적 피드백 강화
   - UI/UX 개선

3. **센서 활용 향상**
   - 복합 센서 활용
   - 센서 데이터 융합
   - 캘리브레이션 시스템
   - 센서 피드백 개선

4. **몰입감 향상**
   - 사운드 효과 (Web Audio API)
   - 햅틱 피드백 (Vibration API)
   - 진행 상황 표시
   - 성과 시스템

**향상 원칙:**
- 기존 코드 구조 유지
- 성능 저하 방지
- 사용자 경험 최우선
- 센서 게임 특성 활용

사용자의 요청사항과 기존 코드를 바탕으로 향상된 버전을 제공하세요.`;
    }

    /**
     * Solo Game 특화 프롬프트
     */
    createSoloGamePrompt() {
        return `Solo Game은 1개의 센서로 플레이하는 게임입니다.

**Solo Game 특징:**
- 단일 센서 입력 (orientation, acceleration, rotationRate)
- 개인 플레이 경험 최적화
- 직관적인 컨트롤
- 점진적 난이도 증가

**센서 활용 패턴:**
- 기울기 (gamma, beta): 공 굴리기, 캐릭터 이동
- 가속도 (x, y, z): 충격 감지, 흔들기 동작
- 회전 속도: 스핀, 회전 동작

**게임 메커니즘 예시:**
- 미로 탈출: 기울기로 공 조작
- 타겟 슈팅: 기울기로 조준, 흔들기로 발사
- 밸런스 게임: 균형 잡기 챌린지
- 레이싱: 기울기로 조향, 가속도로 속도 조절

사용자의 아이디어를 Solo Game 형태로 구현하세요.`;
    }

    /**
     * Dual Game 특화 프롬프트
     */
    createDualGamePrompt() {
        return `Dual Game은 2개의 센서로 협력하는 게임입니다.

**Dual Game 특징:**
- 2명 협력 플레이
- 센서 간 동기화
- 팀워크 중심 게임플레이
- 역할 분담 시스템

**센서 조합 패턴:**
- Player 1 + Player 2 독립 조작
- 좌손 + 우손 조합
- 메인 + 서브 역할 분담
- 동시 동작 + 순차 동작

**협력 메커니즘 예시:**
- 시소 게임: 양쪽 균형 맞추기
- 협력 퍼즐: 각자 다른 조각 조작
- 릴레이 게임: 순차적 임무 수행
- 동기화 챌린지: 같은 동작 수행

**동기화 고려사항:**
- 센서 지연 시간 보정
- 동작 인식 허용 오차
- 시각적 가이드 제공
- 실패 시 재시도 시스템

사용자의 아이디어를 Dual Game 형태로 구현하세요.`;
    }

    /**
     * Multi Game 특화 프롬프트
     */
    createMultiGamePrompt() {
        return `Multi Game은 3-10명이 동시에 플레이하는 경쟁 게임입니다.

**Multi Game 특징:**
- 다중 플레이어 경쟁
- 실시간 순위 시스템
- 스케일러블 게임플레이
- 네트워크 지연 최적화

**경쟁 메커니즘:**
- 개인전: 각자 점수 경쟁
- 팀전: 그룹별 협력 경쟁
- 배틀로얄: 점진적 탈락
- 릴레이: 순차적 참여

**다중 플레이어 고려사항:**
- 센서 ID 관리
- 플레이어 상태 추적
- 공정한 경쟁 환경
- 네트워크 동기화

**UI/UX 요소:**
- 플레이어 목록 표시
- 실시간 순위판
- 개별 진행 상황
- 대기 큐 시스템

**게임 타입 예시:**
- 빠른 반응: 최초 반응자 승리
- 지구력 게임: 가장 오래 버티기
- 정확도 경쟁: 목표 달성 정확도
- 창의성 게임: 동작 창의성 평가

사용자의 아이디어를 Multi Game 형태로 구현하세요.`;
    }

    /**
     * 물리 엔진 특화 프롬프트
     */
    createPhysicsPrompt() {
        return `물리 시뮬레이션 게임을 위한 코드 생성 가이드:

**기본 물리 요소:**
- 중력: 9.8m/s² 또는 게임에 맞는 값
- 마찰력: 표면별 다른 계수
- 충돌 감지: AABB, 원형 충돌
- 반발력: 탄성 충돌 구현

**센서 물리 매핑:**
- beta (앞뒤 기울기) → Y축 가속도
- gamma (좌우 기울기) → X축 가속도
- acceleration → 충격/흔들기 감지

**물리 코드 패턴:**
\`\`\`javascript
// 물리 오브젝트 기본 구조
class PhysicsObject {
    constructor(x, y, mass = 1) {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.mass = mass;
        this.friction = 0.98;
    }

    applyForce(fx, fy) {
        this.vx += fx / this.mass;
        this.vy += fy / this.mass;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vx *= this.friction;
        this.vy *= this.friction;
    }
}
\`\`\`

물리 기반 게임 로직을 구현하세요.`;
    }

    /**
     * 검증 프롬프트 초기화
     */
    initializeValidationPrompts() {
        this.validationPrompts = {
            syntax: `코드의 HTML, CSS, JavaScript 문법을 검사하고 오류를 수정하세요.`,
            sessionSDK: `SessionSDK 사용법이 올바른지 검사하세요. CustomEvent 패턴 (event.detail || event) 사용 확인.`,
            sensorHandling: `센서 데이터 처리 로직이 안전하고 효율적인지 검사하세요.`,
            performance: `렌더링 성능과 메모리 사용을 최적화하세요.`,
            userExperience: `사용자 경험과 접근성을 개선하세요.`
        };
    }

    /**
     * 향상 프롬프트 초기화
     */
    initializeEnhancementPrompts() {
        this.enhancementPrompts = {
            gameplay: `게임플레이를 더욱 흥미롭고 도전적으로 만드세요.`,
            visuals: `시각적 효과와 애니메이션을 추가하여 몰입감을 높이세요.`,
            audio: `Web Audio API를 사용한 사운드 효과를 추가하세요.`,
            haptics: `진동 피드백을 추가하여 촉각적 경험을 제공하세요.`,
            progression: `레벨, 점수, 도전 과제 시스템을 추가하세요.`
        };
    }

    /**
     * 통합 프롬프트 생성
     */
    generateIntegratedPrompt(userInput, analysisResult, step = 'generation') {
        const basePrompt = this.systemPrompts[this.getPromptTypeForStep(step)];
        const gameTypePrompt = this.gameTypePrompts[analysisResult.gameType];
        const componentPrompts = this.getRelevantComponentPrompts(analysisResult);

        return `${basePrompt}

**게임 타입별 가이드:**
${gameTypePrompt}

**컴포넌트별 가이드:**
${componentPrompts.join('\n\n')}

**사용자 요청:**
${userInput}

**분석 결과:**
${JSON.stringify(analysisResult, null, 2)}

위 정보를 바탕으로 ${step} 단계를 수행하세요.`;
    }

    /**
     * 단계별 프롬프트 타입 결정
     */
    getPromptTypeForStep(step) {
        const mapping = {
            'analysis': 'gameAnalyzer',
            'generation': 'codeGenerator',
            'validation': 'validator',
            'enhancement': 'enhancer'
        };
        return mapping[step] || 'codeGenerator';
    }

    /**
     * 관련 컴포넌트 프롬프트 가져오기
     */
    getRelevantComponentPrompts(analysisResult) {
        const prompts = [];

        if (analysisResult.requiredFeatures.includes('physics')) {
            prompts.push(this.componentPrompts.physics);
        }

        if (analysisResult.technicalRequirements.graphics.includes('particles')) {
            prompts.push(this.componentPrompts.graphics);
        }

        // 항상 센서와 UI 프롬프트 포함
        prompts.push(this.componentPrompts.sensors);
        prompts.push(this.componentPrompts.ui);

        return prompts;
    }

    /**
     * 표준 템플릿 정보 가져오기
     */
    getStandardTemplateInfo() {
        return this.templateStandard.getAllTemplates();
    }

    /**
     * 검증 프롬프트 가져오기
     */
    getValidationPrompt(validationType) {
        return this.validationPrompts[validationType] || this.validationPrompts.syntax;
    }

    /**
     * 향상 프롬프트 가져오기
     */
    getEnhancementPrompt(enhancementType) {
        return this.enhancementPrompts[enhancementType] || this.enhancementPrompts.gameplay;
    }
}

module.exports = StandardizedPromptTemplates;