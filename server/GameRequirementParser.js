/**
 * 🧠 GameRequirementParser v1.0
 * 
 * 자연어 게임 요구사항을 파싱하여 구조화된 게임 사양으로 변환
 * - 자연어 분석 및 키워드 추출
 * - 게임 타입, 장르, 메커니즘 식별
 * - 센서 요구사항 매핑
 */

class GameRequirementParser {
    constructor() {
        // 게임 타입 키워드 매핑
        this.gameTypeKeywords = {
            solo: ['혼자', '1인', '솔로', '개인', '단독'],
            dual: ['둘이', '2인', '협력', '함께', '파트너', '듀얼'],
            multi: ['여러명', '다수', '멀티', '경쟁', '대전', '3명', '4명', '5명', '6명', '7명', '8명']
        };

        // 게임 장르 키워드 매핑
        this.genreKeywords = {
            platformer: ['플랫폼', '점프', '뛰어넘', '발판', '마리오'],
            puzzle: ['퍼즐', '미로', '문제', '해결', '생각', '논리'],
            racing: ['레이싱', '경주', '빠르게', '속도', '달리기', '레이스'],
            adventure: ['모험', '탐험', '여행', '스토리', '캐릭터'],
            arcade: ['아케이드', '간단', '캐주얼', '점수', '클래식'],
            action: ['액션', '빠른', '반응', '전투', '싸움'],
            sports: ['스포츠', '축구', '농구', '테니스', '골프'],
            rhythm: ['리듬', '음악', '박자', '노래', '멜로디']
        };

        // 센서 메커니즘 키워드 매핑
        this.sensorKeywords = {
            tilt: ['기울', '기울이', '틸트', '좌우', '앞뒤', '방향'],
            shake: ['흔들', '흔들어', '쉐이크', '진동', '털어'],
            rotate: ['회전', '돌려', '돌리', '스핀', '회전시켜'],
            motion: ['움직', '이동', '모션', '동작', '제스처'],
            tap: ['터치', '탭', '누르', '클릭', '터치']
        };

        // 게임 오브젝트 키워드 매핑
        this.objectKeywords = {
            player: ['플레이어', '캐릭터', '주인공', '조작', '공', '배'],
            obstacle: ['장애물', '벽', '적', '위험', '함정', '블록'],
            collectible: ['수집', '아이템', '코인', '점수', '보석', '별'],
            goal: ['목표', '도착', '끝', '완주', '골', '목적지'],
            enemy: ['적', '몬스터', '위험', '공격', '악역'],
            platform: ['발판', '바닥', '플랫폼', '땅', '기반']
        };

        // 난이도 키워드 매핑
        this.difficultyKeywords = {
            easy: ['쉬운', '간단한', '초보', '기초', '입문'],
            medium: ['보통', '중간', '적당한', '일반'],
            hard: ['어려운', '복잡한', '고급', '도전적인', '어려운']
        };
    }

    /**
     * 자연어 요구사항을 구조화된 게임 사양으로 파싱
     */
    async parseRequirement(naturalLanguageInput) {
        try {
            console.log(`🧠 자연어 파싱 시작: "${naturalLanguageInput}"`);

            const requirement = naturalLanguageInput.toLowerCase();
            
            const gameSpec = {
                // 기본 정보
                originalInput: naturalLanguageInput,
                gameType: this.detectGameType(requirement),
                genre: this.detectGenre(requirement),
                difficulty: this.detectDifficulty(requirement),
                
                // 게임 메커니즘
                sensorMechanics: this.detectSensorMechanics(requirement),
                gameObjects: this.detectGameObjects(requirement),
                
                // 게임 목표 및 규칙
                objective: this.extractObjective(requirement),
                rules: this.extractRules(requirement),
                
                // 기술적 요구사항
                sensors: this.mapSensorsRequired(requirement),
                estimatedComplexity: this.calculateComplexity(requirement),
                
                // 생성 메타데이터
                parsedAt: new Date().toISOString(),
                confidence: 0.8 // 파싱 신뢰도
            };

            // 게임 ID 생성
            gameSpec.suggestedGameId = this.generateGameId(gameSpec);
            gameSpec.suggestedTitle = this.generateGameTitle(gameSpec);

            console.log('✅ 자연어 파싱 완료:', gameSpec);
            return gameSpec;

        } catch (error) {
            console.error('❌ 자연어 파싱 실패:', error);
            throw error;
        }
    }

    /**
     * 게임 타입 감지 (solo/dual/multi)
     */
    detectGameType(requirement) {
        for (const [type, keywords] of Object.entries(this.gameTypeKeywords)) {
            if (keywords.some(keyword => requirement.includes(keyword))) {
                return type;
            }
        }
        return 'solo'; // 기본값
    }

    /**
     * 게임 장르 감지
     */
    detectGenre(requirement) {
        const detectedGenres = [];
        
        for (const [genre, keywords] of Object.entries(this.genreKeywords)) {
            const matchCount = keywords.filter(keyword => requirement.includes(keyword)).length;
            if (matchCount > 0) {
                detectedGenres.push({ genre, confidence: matchCount });
            }
        }

        // 가장 높은 신뢰도의 장르 반환
        if (detectedGenres.length > 0) {
            detectedGenres.sort((a, b) => b.confidence - a.confidence);
            return detectedGenres[0].genre;
        }

        return 'arcade'; // 기본값
    }

    /**
     * 센서 메커니즘 감지
     */
    detectSensorMechanics(requirement) {
        const mechanics = [];
        
        for (const [mechanic, keywords] of Object.entries(this.sensorKeywords)) {
            if (keywords.some(keyword => requirement.includes(keyword))) {
                mechanics.push(mechanic);
            }
        }

        return mechanics.length > 0 ? mechanics : ['tilt']; // 기본값
    }

    /**
     * 게임 오브젝트 감지
     */
    detectGameObjects(requirement) {
        const objects = [];
        
        for (const [object, keywords] of Object.entries(this.objectKeywords)) {
            if (keywords.some(keyword => requirement.includes(keyword))) {
                objects.push(object);
            }
        }

        // 기본 오브젝트 보장
        if (!objects.includes('player')) objects.push('player');
        if (objects.length === 1) objects.push('obstacle'); // 최소한의 게임 요소

        return objects;
    }

    /**
     * 난이도 감지
     */
    detectDifficulty(requirement) {
        for (const [difficulty, keywords] of Object.entries(this.difficultyKeywords)) {
            if (keywords.some(keyword => requirement.includes(keyword))) {
                return difficulty;
            }
        }
        return 'medium'; // 기본값
    }

    /**
     * 게임 목표 추출
     */
    extractObjective(requirement) {
        // 목표 관련 키워드 패턴 매칭
        const objectivePatterns = [
            { pattern: /(\w+)를?\s*피해?/, objective: '장애물 피하기' },
            { pattern: /(\w+)를?\s*수집/, objective: '아이템 수집하기' },
            { pattern: /(\w+)에?\s*도착/, objective: '목적지 도달하기' },
            { pattern: /점수/, objective: '높은 점수 달성하기' },
            { pattern: /미로/, objective: '미로 탈출하기' },
            { pattern: /퍼즐/, objective: '퍼즐 해결하기' }
        ];

        for (const { pattern, objective } of objectivePatterns) {
            if (pattern.test(requirement)) {
                return objective;
            }
        }

        return '게임 목표 달성하기'; // 기본값
    }

    /**
     * 게임 규칙 추출
     */
    extractRules(requirement) {
        const rules = [];

        // 규칙 패턴 매칭
        if (requirement.includes('피해') || requirement.includes('장애물')) {
            rules.push('장애물에 닿으면 게임 오버');
        }
        if (requirement.includes('수집') || requirement.includes('코인')) {
            rules.push('아이템을 수집하면 점수 획득');
        }
        if (requirement.includes('시간') || requirement.includes('빨리')) {
            rules.push('제한 시간 내에 완료해야 함');
        }
        if (requirement.includes('생명') || requirement.includes('목숨')) {
            rules.push('생명이 다하면 게임 종료');
        }

        return rules.length > 0 ? rules : ['게임 목표를 달성하세요'];
    }

    /**
     * 필요한 센서 매핑
     */
    mapSensorsRequired(requirement) {
        const sensors = [];
        const mechanics = this.detectSensorMechanics(requirement);

        mechanics.forEach(mechanic => {
            switch (mechanic) {
                case 'tilt':
                    sensors.push('orientation');
                    break;
                case 'shake':
                case 'motion':
                    sensors.push('acceleration');
                    break;
                case 'rotate':
                    sensors.push('rotationRate');
                    break;
                default:
                    sensors.push('orientation');
            }
        });

        return [...new Set(sensors)]; // 중복 제거
    }

    /**
     * 복잡도 계산
     */
    calculateComplexity(requirement) {
        let complexity = 1; // 기본 복잡도

        // 게임 오브젝트 수에 따른 복잡도
        const objects = this.detectGameObjects(requirement);
        complexity += objects.length * 0.2;

        // 센서 메커니즘에 따른 복잡도
        const mechanics = this.detectSensorMechanics(requirement);
        complexity += mechanics.length * 0.3;

        // 특정 키워드에 따른 복잡도
        if (requirement.includes('물리')) complexity += 0.5;
        if (requirement.includes('애니메이션')) complexity += 0.3;
        if (requirement.includes('소리') || requirement.includes('음악')) complexity += 0.2;

        return Math.min(Math.max(complexity, 1), 5); // 1-5 범위로 제한
    }

    /**
     * 게임 ID 생성
     */
    generateGameId(gameSpec) {
        const genre = gameSpec.genre;
        const mechanic = gameSpec.sensorMechanics[0] || 'tilt';
        const type = gameSpec.gameType;
        
        return `${genre}-${mechanic}-${type}-${Date.now().toString().slice(-4)}`;
    }

    /**
     * 게임 제목 생성
     */
    generateGameTitle(gameSpec) {
        const genreNames = {
            platformer: '플랫폼 어드벤처',
            puzzle: '퍼즐 챌린지',
            racing: '스피드 레이싱',
            adventure: '센서 어드벤처',
            arcade: '아케이드 게임',
            action: '액션 게임',
            sports: '스포츠 게임',
            rhythm: '리듬 게임'
        };

        const mechanicNames = {
            tilt: '틸트',
            shake: '쉐이크',
            rotate: '로테이션',
            motion: '모션',
            tap: '터치'
        };

        const genre = genreNames[gameSpec.genre] || '센서 게임';
        const mechanic = mechanicNames[gameSpec.sensorMechanics[0]] || '센서';
        
        return `${mechanic} ${genre}`;
    }

    /**
     * 파싱 결과 검증
     */
    validateGameSpec(gameSpec) {
        const errors = [];

        if (!gameSpec.gameType || !['solo', 'dual', 'multi'].includes(gameSpec.gameType)) {
            errors.push('유효하지 않은 게임 타입');
        }

        if (!gameSpec.sensors || gameSpec.sensors.length === 0) {
            errors.push('최소 하나의 센서가 필요합니다');
        }

        if (!gameSpec.gameObjects || gameSpec.gameObjects.length === 0) {
            errors.push('게임 오브젝트가 필요합니다');
        }

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }
}

module.exports = GameRequirementParser;