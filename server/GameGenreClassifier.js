/**
 * 🎮 GameGenreClassifier v1.0
 * 
 * 사용자 주제를 분석하여 적절한 게임 장르와 센서 매핑을 결정하는 지능형 분류 시스템
 * - 주제별 장르 자동 분류
 * - 센서 사용 패턴 매핑
 * - 게임 메커니즘 제안
 * - 난이도 및 복잡도 평가
 */

class GameGenreClassifier {
    constructor() {
        this.initializeClassificationData();
    }

    initializeClassificationData() {
        // 게임 장르별 특성 정의
        this.GENRE_DEFINITIONS = {
            'action': {
                keywords: ['빠른', '반응', '액션', '슈팅', '전투', '공격', '방어', '적', '총', '칼', '무기'],
                characteristics: ['빠른 반응속도', '실시간 조작', '연속적 입력'],
                sensorUsage: ['빠른 기울기', '즉각적 반응', '연속 조작'],
                difficulty: 'medium',
                examples: ['총쏘기 게임', '적 피하기', '빠른 반응 게임']
            },
            'puzzle': {
                keywords: ['퍼즐', '논리', '문제', '해결', '생각', '두뇌', '맞추기', '블록', '퀴즈'],
                characteristics: ['논리적 사고', '문제 해결', '단계별 진행'],
                sensorUsage: ['정밀한 조작', '신중한 움직임', '정확한 위치'],
                difficulty: 'easy',
                examples: ['블록 맞추기', '미로 찾기', '논리 퍼즐']
            },
            'arcade': {
                keywords: ['클래식', '간단한', '점수', '하이스코어', '연속', '콤보', '패턴'],
                characteristics: ['단순한 룰', '점수 추구', '반복 플레이'],
                sensorUsage: ['반복적 조작', '리듬감', '패턴 인식'],
                difficulty: 'easy',
                examples: ['공 튀기기', '블록 깨기', '점수 경쟁']
            },
            'simulation': {
                keywords: ['시뮬레이션', '현실', '조작', '운전', '조종', '컨트롤', '시뮬', '실제'],
                characteristics: ['현실적 물리', '정교한 조작', '상태 관리'],
                sensorUsage: ['현실적 움직임', '정밀 제어', '상태 유지'],
                difficulty: 'hard',
                examples: ['비행 시뮬레이터', '운전 게임', '조종 시뮬']
            },
            'sports': {
                keywords: ['스포츠', '공', '축구', '농구', '테니스', '골프', '야구', '운동', '경기'],
                characteristics: ['스포츠 룰', '팀플레이', '경쟁'],
                sensorUsage: ['방향 조작', '힘 조절', '타이밍'],
                difficulty: 'medium',
                examples: ['축구 게임', '골프 게임', '농구 게임']
            },
            'cooking': {
                keywords: ['요리', '음식', '레시피', '재료', '섞기', '굽기', '조리', '셰프', '주방'],
                characteristics: ['순서 중요', '타이밍', '재료 조합'],
                sensorUsage: ['혼합 동작', '순서 제어', '타이밍'],
                difficulty: 'medium',
                examples: ['요리 시뮬레이터', '베이킹 게임', '레스토랑 게임']
            },
            'balance': {
                keywords: ['균형', '밸런스', '중심', '흔들리지', '안정', '무너지지', '떨어지지'],
                characteristics: ['정밀한 조작', '집중력', '안정성'],
                sensorUsage: ['미세한 기울기', '정밀 조작', '안정 유지'],
                difficulty: 'medium',
                examples: ['균형 잡기', '탑 쌓기', '중심 맞추기']
            },
            'racing': {
                keywords: ['레이싱', '경주', '달리기', '속도', '빠르게', '경쟁', '추월', '드라이빙'],
                characteristics: ['속도감', '경로 선택', '장애물 회피'],
                sensorUsage: ['좌우 조작', '방향 전환', '속도 조절'],
                difficulty: 'medium',
                examples: ['자동차 경주', '오토바이 경주', '달리기 경주']
            },
            'platform': {
                keywords: ['점프', '플랫폼', '올라가기', '내려가기', '착지', '뛰어넘기', '장애물'],
                characteristics: ['점프 액션', '플랫폼 이동', '타이밍'],
                sensorUsage: ['점프 조작', '좌우 이동', '타이밍'],
                difficulty: 'medium',
                examples: ['점프 게임', '플랫포머', '장애물 넘기']
            },
            'rhythm': {
                keywords: ['리듬', '음악', '박자', '타이밍', '댄스', '비트', '멜로디', '사운드'],
                characteristics: ['음악 동기화', '정확한 타이밍', '리듬감'],
                sensorUsage: ['타이밍 조작', '리듬 동기화', '정확성'],
                difficulty: 'hard',
                examples: ['리듬 게임', '댄스 게임', '음악 게임']
            }
        };

        // 센서 사용 패턴별 메커니즘
        this.SENSOR_MECHANICS = {
            'tilt_control': {
                description: '기기 기울기로 오브젝트 제어',
                usage: '좌우/앞뒤 기울기 → 방향 이동',
                sensitivity: 'medium',
                gameTypes: ['solo', 'dual'],
                bestFor: ['공 굴리기', '자동차 조종', '균형 게임']
            },
            'shake_action': {
                description: '기기 흔들기로 액션 실행',
                usage: '빠른 흔들기 → 특별 동작',
                sensitivity: 'high',
                gameTypes: ['solo', 'dual'],
                bestFor: ['요리 게임', '액션 게임', '파괴 게임']
            },
            'precision_tilt': {
                description: '정밀한 기울기로 섬세한 조작',
                usage: '미세한 기울기 → 정확한 위치 조정',
                sensitivity: 'low',
                gameTypes: ['solo'],
                bestFor: ['균형 게임', '퍼즐 게임', '정밀 조작']
            },
            'rotation_control': {
                description: '회전으로 방향 제어',
                usage: '기기 회전 → 오브젝트 회전',
                sensitivity: 'medium',
                gameTypes: ['solo', 'dual'],
                bestFor: ['회전 게임', '방향 맞추기', '조종 게임']
            },
            'multi_gesture': {
                description: '복합 센서 동작',
                usage: '기울기 + 흔들기 조합',
                sensitivity: 'dynamic',
                gameTypes: ['dual', 'multi'],
                bestFor: ['복합 액션', '협력 게임', '고급 조작']
            }
        };

        // 성공한 게임 사례 데이터베이스
        this.SUCCESSFUL_EXAMPLES = {
            '공 굴리기': {
                genre: 'arcade',
                mechanics: 'tilt_control',
                template_base: 'acorn-battle',
                key_features: ['물리 엔진', '벽 충돌', '아이템 수집'],
                sensor_pattern: 'gamma/beta → velocity 변환',
                difficulty: 'easy'
            },
            '요리 게임': {
                genre: 'cooking',
                mechanics: 'shake_action',
                template_base: 'rhythm-blade',
                key_features: ['재료 혼합', '타이밍', '순서 제어'],
                sensor_pattern: 'shake magnitude → mixing intensity',
                difficulty: 'medium'
            },
            '균형 게임': {
                genre: 'balance',
                mechanics: 'precision_tilt',
                template_base: 'solo',
                key_features: ['정밀 제어', '안정성', '집중력'],
                sensor_pattern: 'micro-tilt → balance adjustment',
                difficulty: 'medium'
            },
            '레이싱': {
                genre: 'racing',
                mechanics: 'tilt_control',
                template_base: 'dual',
                key_features: ['속도감', '코스', '경쟁'],
                sensor_pattern: 'tilt angle → steering wheel',
                difficulty: 'medium'
            }
        };
    }

    /**
     * 사용자 주제를 분석하여 게임 분류 정보 반환
     */
    classifyGameTopic(userInput) {
        const analysis = {
            originalInput: userInput,
            detectedGenres: [],
            primaryGenre: null,
            recommendedMechanics: [],
            primaryMechanic: null,
            gameType: null,
            difficulty: 'medium',
            confidence: 0,
            suggestions: [],
            sensorMapping: null
        };

        // 1. 장르 분석
        analysis.detectedGenres = this.analyzeGenres(userInput);
        analysis.primaryGenre = this.selectPrimaryGenre(analysis.detectedGenres);

        // 2. 센서 메커니즘 분석
        analysis.recommendedMechanics = this.analyzeMechanics(userInput, analysis.primaryGenre);
        analysis.primaryMechanic = this.selectPrimaryMechanic(analysis.recommendedMechanics);

        // 3. 게임 타입 결정
        analysis.gameType = this.determineGameType(userInput, analysis.primaryGenre);

        // 4. 난이도 평가
        analysis.difficulty = this.assessDifficulty(analysis.primaryGenre, analysis.primaryMechanic);

        // 5. 신뢰도 계산
        analysis.confidence = this.calculateConfidence(analysis);

        // 6. 제안사항 생성
        analysis.suggestions = this.generateSuggestions(analysis);

        // 7. 센서 매핑 생성
        analysis.sensorMapping = this.createSensorMapping(analysis);

        return analysis;
    }

    /**
     * 텍스트에서 게임 장르 분석
     */
    analyzeGenres(text) {
        const detectedGenres = [];
        const lowerText = text.toLowerCase();

        for (const [genre, definition] of Object.entries(this.GENRE_DEFINITIONS)) {
            let score = 0;
            let matchedKeywords = [];

            // 키워드 매칭
            for (const keyword of definition.keywords) {
                if (lowerText.includes(keyword)) {
                    score += 1;
                    matchedKeywords.push(keyword);
                }
            }

            if (score > 0) {
                detectedGenres.push({
                    genre,
                    score,
                    matchedKeywords,
                    definition
                });
            }
        }

        // 점수 순으로 정렬
        return detectedGenres.sort((a, b) => b.score - a.score);
    }

    /**
     * 주 장르 선택
     */
    selectPrimaryGenre(detectedGenres) {
        if (detectedGenres.length === 0) {
            return 'arcade'; // 기본값
        }

        const topGenre = detectedGenres[0];
        
        // 신뢰도가 높은 경우
        if (topGenre.score >= 2) {
            return topGenre.genre;
        }

        // 애매한 경우 arcade로 기본 설정
        return 'arcade';
    }

    /**
     * 센서 메커니즘 분석
     */
    analyzeMechanics(text, primaryGenre) {
        const recommendedMechanics = [];
        const lowerText = text.toLowerCase();

        // 텍스트에서 센서 관련 키워드 검색
        const sensorKeywords = {
            'tilt_control': ['기울', '기울이기', '굴리기', '굴러', '방향', '좌우', '앞뒤'],
            'shake_action': ['흔들', '흔들기', '혼합', '섞기', '두드리기', '타격'],
            'precision_tilt': ['정밀', '균형', '조심', '섬세', '정확', '미세'],
            'rotation_control': ['회전', '돌리기', '방향', '각도', '조종'],
            'multi_gesture': ['복합', '다양한', '여러', '조합', '함께']
        };

        for (const [mechanic, keywords] of Object.entries(sensorKeywords)) {
            let score = 0;
            for (const keyword of keywords) {
                if (lowerText.includes(keyword)) {
                    score++;
                }
            }

            if (score > 0) {
                recommendedMechanics.push({
                    mechanic,
                    score,
                    definition: this.SENSOR_MECHANICS[mechanic]
                });
            }
        }

        // 장르 기반 추천 추가
        if (primaryGenre) {
            const genreRecommendations = this.getGenreBasedMechanics(primaryGenre);
            for (const rec of genreRecommendations) {
                const existing = recommendedMechanics.find(m => m.mechanic === rec);
                if (existing) {
                    existing.score += 1; // 장르 매칭 보너스
                } else {
                    recommendedMechanics.push({
                        mechanic: rec,
                        score: 1,
                        definition: this.SENSOR_MECHANICS[rec]
                    });
                }
            }
        }

        return recommendedMechanics.sort((a, b) => b.score - a.score);
    }

    /**
     * 장르별 추천 메커니즘
     */
    getGenreBasedMechanics(genre) {
        const genreMechanicsMap = {
            'action': ['shake_action', 'tilt_control'],
            'puzzle': ['precision_tilt', 'tilt_control'],
            'arcade': ['tilt_control', 'shake_action'],
            'simulation': ['precision_tilt', 'rotation_control'],
            'sports': ['tilt_control', 'shake_action'],
            'cooking': ['shake_action', 'multi_gesture'],
            'balance': ['precision_tilt'],
            'racing': ['tilt_control', 'rotation_control'],
            'platform': ['tilt_control'],
            'rhythm': ['shake_action', 'multi_gesture']
        };

        return genreMechanicsMap[genre] || ['tilt_control'];
    }

    /**
     * 주 메커니즘 선택
     */
    selectPrimaryMechanic(recommendedMechanics) {
        if (recommendedMechanics.length === 0) {
            return 'tilt_control'; // 기본값
        }
        return recommendedMechanics[0].mechanic;
    }

    /**
     * 게임 타입 결정 (solo/dual/multi)
     */
    determineGameType(text, primaryGenre) {
        const lowerText = text.toLowerCase();

        // 명시적 키워드 확인
        if (lowerText.includes('혼자') || lowerText.includes('1인') || lowerText.includes('개인')) {
            return 'solo';
        }
        if (lowerText.includes('둘이') || lowerText.includes('2인') || lowerText.includes('친구와')) {
            return 'dual';
        }
        if (lowerText.includes('여러') || lowerText.includes('다수') || lowerText.includes('여러명')) {
            return 'multi';
        }

        // 장르별 기본 게임 타입
        const genreDefaults = {
            'balance': 'solo',
            'puzzle': 'solo',
            'cooking': 'dual',
            'sports': 'dual',
            'racing': 'multi',
            'action': 'dual',
            'arcade': 'solo'
        };

        return genreDefaults[primaryGenre] || 'solo';
    }

    /**
     * 난이도 평가
     */
    assessDifficulty(primaryGenre, primaryMechanic) {
        const genreDifficulty = this.GENRE_DEFINITIONS[primaryGenre]?.difficulty || 'medium';
        const mechanicComplexity = {
            'tilt_control': 'easy',
            'shake_action': 'easy',
            'precision_tilt': 'medium',
            'rotation_control': 'medium',
            'multi_gesture': 'hard'
        };

        const mechComplexity = mechanicComplexity[primaryMechanic] || 'medium';

        // 전체 난이도 결정
        const difficultyScore = {
            'easy': 1,
            'medium': 2,
            'hard': 3
        };

        const avgScore = (difficultyScore[genreDifficulty] + difficultyScore[mechComplexity]) / 2;
        
        if (avgScore <= 1.5) return 'easy';
        if (avgScore <= 2.5) return 'medium';
        return 'hard';
    }

    /**
     * 분석 신뢰도 계산
     */
    calculateConfidence(analysis) {
        let confidence = 0;

        // 장르 매칭 신뢰도
        if (analysis.detectedGenres.length > 0) {
            confidence += Math.min(analysis.detectedGenres[0].score * 0.2, 0.4);
        }

        // 메커니즘 매칭 신뢰도
        if (analysis.recommendedMechanics.length > 0) {
            confidence += Math.min(analysis.recommendedMechanics[0].score * 0.15, 0.3);
        }

        // 입력 길이 보너스 (더 자세한 설명일수록 높은 신뢰도)
        const inputLength = analysis.originalInput.length;
        confidence += Math.min(inputLength * 0.005, 0.3);

        return Math.min(confidence, 1.0);
    }

    /**
     * 개선 제안사항 생성
     */
    generateSuggestions(analysis) {
        const suggestions = [];

        if (analysis.confidence < 0.5) {
            suggestions.push("더 구체적인 게임 설명을 제공하시면 더 정확한 게임을 만들 수 있습니다.");
        }

        if (analysis.primaryGenre && this.GENRE_DEFINITIONS[analysis.primaryGenre]) {
            const genreDef = this.GENRE_DEFINITIONS[analysis.primaryGenre];
            suggestions.push(`${analysis.primaryGenre} 장르의 특징: ${genreDef.characteristics.join(', ')}`);
        }

        if (analysis.primaryMechanic && this.SENSOR_MECHANICS[analysis.primaryMechanic]) {
            const mechanicDef = this.SENSOR_MECHANICS[analysis.primaryMechanic];
            suggestions.push(`추천 센서 사용법: ${mechanicDef.description}`);
        }

        return suggestions;
    }

    /**
     * 센서 매핑 정보 생성
     */
    createSensorMapping(analysis) {
        const mapping = {
            primary: analysis.primaryMechanic,
            gameType: analysis.gameType,
            sensitivity: 'medium',
            controls: {},
            implementation: {}
        };

        if (analysis.primaryMechanic && this.SENSOR_MECHANICS[analysis.primaryMechanic]) {
            const mechanic = this.SENSOR_MECHANICS[analysis.primaryMechanic];
            mapping.sensitivity = mechanic.sensitivity;
            mapping.description = mechanic.description;
        }

        // 메커니즘별 구체적 구현 방법
        switch (analysis.primaryMechanic) {
            case 'tilt_control':
                mapping.controls = {
                    tiltX: 'orientation.beta → forward/backward movement',
                    tiltY: 'orientation.gamma → left/right movement'
                };
                mapping.implementation = {
                    code: 'const tiltX = Math.max(-1, Math.min(1, orientation.gamma / 45));'
                };
                break;
            case 'shake_action':
                mapping.controls = {
                    shake: 'acceleration magnitude → action trigger'
                };
                mapping.implementation = {
                    code: 'const magnitude = Math.sqrt(acc.x*acc.x + acc.y*acc.y + acc.z*acc.z);'
                };
                break;
            case 'precision_tilt':
                mapping.controls = {
                    microTilt: 'small orientation changes → precise adjustment'
                };
                mapping.implementation = {
                    code: 'const precision = orientation.gamma / 90; // 매우 작은 범위'
                };
                break;
        }

        return mapping;
    }

    /**
     * 주제와 유사한 성공 사례 찾기
     */
    findSimilarSuccessfulExample(userInput) {
        const lowerInput = userInput.toLowerCase();
        
        for (const [example, data] of Object.entries(this.SUCCESSFUL_EXAMPLES)) {
            const lowerExample = example.toLowerCase();
            
            // 직접적 매칭
            if (lowerInput.includes(lowerExample)) {
                return data;
            }

            // 키워드 매칭
            const exampleKeywords = example.split(' ');
            let matchCount = 0;
            for (const keyword of exampleKeywords) {
                if (lowerInput.includes(keyword.toLowerCase())) {
                    matchCount++;
                }
            }
            
            if (matchCount > 0) {
                return data;
            }
        }

        return null;
    }

    /**
     * 🎯 게임 아이디어 분류 (InteractiveGameGenerator에서 사용)
     * 사용자 입력을 분석하여 게임 장르, 타입, 센서 메카닉을 결정
     */
    async classifyGameIdea(userInput) {
        console.log('🔍 게임 아이디어 분류 시작:', userInput);
        
        // 1. 장르 분석
        const detectedGenres = this.analyzeGenres(userInput);
        const primaryGenre = this.selectPrimaryGenre(detectedGenres);
        
        // 2. 복잡도 분석
        const complexity = this.analyzeComplexity(userInput);
        
        // 3. 테마 키워드 추출
        const themeKeywords = this.extractThemeKeywords(userInput);
        
        // 4. 센서 매핑 생성
        const sensorMapping = this.createSensorMapping({
            primaryGenre,
            detectedGenres,
            complexity,
            themeKeywords
        });
        
        // InteractiveGameGenerator에서 사용할 형태로 변환
        const classification = {
            // 주 장르
            primaryGenre: primaryGenre,
            confidence: detectedGenres.length > 0 ? detectedGenres[0].score / 10 : 0.5,
            
            // 추가 장르들
            secondaryGenres: detectedGenres.slice(1, 3).map(g => g.genre),
            
            // 게임 타입 추정 (단어 분석으로)
            gameType: this.estimateGameType(userInput),
            
            // 센서 메카닉
            sensorMechanics: sensorMapping,
            
            // 난이도
            difficulty: complexity,
            
            // 원본 분석 결과
            fullAnalysis: {
                primaryGenre,
                detectedGenres,
                complexity,
                themeKeywords,
                sensorMapping
            }
        };

        console.log('📊 분류 결과:', classification);
        return classification;
    }

    /**
     * 복잡도 분석
     */
    analyzeComplexity(text) {
        const lowerText = text.toLowerCase();
        
        // 복잡도 키워드들
        const easyKeywords = ['간단한', '쉬운', '단순한', '기본적인', '초보'];
        const mediumKeywords = ['보통', '일반적인', '적당한'];
        const hardKeywords = ['복잡한', '어려운', '고급', '전문적인', '도전적인'];
        
        let easyScore = 0;
        let mediumScore = 0;
        let hardScore = 0;
        
        easyKeywords.forEach(keyword => {
            if (lowerText.includes(keyword)) easyScore++;
        });
        
        mediumKeywords.forEach(keyword => {
            if (lowerText.includes(keyword)) mediumScore++;
        });
        
        hardKeywords.forEach(keyword => {
            if (lowerText.includes(keyword)) hardScore++;
        });
        
        if (hardScore > 0) return 'hard';
        if (mediumScore > 0) return 'medium';
        if (easyScore > 0) return 'easy';
        
        return 'medium'; // 기본값
    }

    /**
     * 테마 키워드 추출
     */
    extractThemeKeywords(text) {
        const words = text.toLowerCase()
            .replace(/[^\w\s가-힣]/g, ' ')
            .split(/\s+/)
            .filter(word => word.length > 1);
        
        // 게임 관련 키워드들만 필터링
        const gameKeywords = words.filter(word => {
            return !['게임', '만들기', '하고', '싶어요', '원해요', '해주세요', '같은', '이런', '저런'].includes(word);
        });
        
        return gameKeywords.slice(0, 10); // 상위 10개만
    }

    /**
     * 게임 타입 추정 (솔로/듀얼/멀티)
     */
    estimateGameType(userInput) {
        const text = userInput.toLowerCase();
        
        // 멀티플레이어 키워드
        const multiKeywords = ['여러명', '다수', '경쟁', '대전', '순위', '랭킹', '친구들', '같이', '함께'];
        
        // 듀얼 플레이어 키워드  
        const dualKeywords = ['2명', '둘이', '협력', '파트너', '팀', '듀얼'];
        
        // 솔로 키워드
        const soloKeywords = ['혼자', '1명', '개인', '솔로'];

        // 키워드 매칭
        for (const keyword of multiKeywords) {
            if (text.includes(keyword)) {
                return 'multi';
            }
        }
        
        for (const keyword of dualKeywords) {
            if (text.includes(keyword)) {
                return 'dual';
            }
        }
        
        for (const keyword of soloKeywords) {
            if (text.includes(keyword)) {
                return 'solo';
            }
        }

        // 기본값은 솔로
        return 'solo';
    }
}

module.exports = GameGenreClassifier;