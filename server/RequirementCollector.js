/**
 * RequirementCollector.js
 * 게임 생성을 위한 인터랙티브 요구사항 수집 시스템
 * 
 * 이 시스템은 사용자와의 대화를 통해 게임의 세부 요구사항을 체계적으로 수집합니다.
 * 단계별 질문, 조건부 분기, 사용자 입력 분석을 통해 완전한 게임 명세서를 작성합니다.
 */

class RequirementCollector {
    constructor() {
        // 요구사항 수집 단계별 질문 템플릿
        this.questionTemplates = {
            'genre': {
                priority: 1,
                condition: (context) => !context.genre || context.confidence < 0.7,
                questions: [
                    "어떤 장르의 게임을 원하시나요? (액션, 퍼즐, 물리학, 요리, 레이싱 등)",
                    "게임의 전반적인 분위기나 스타일을 설명해주세요.",
                    "참고하고 싶은 기존 게임이 있다면 알려주세요."
                ]
            },
            'gameType': {
                priority: 2,
                condition: (context) => !context.gameType,
                questions: [
                    "몇 명이 동시에 플레이할 수 있는 게임인가요? (1명/2명/여러명)",
                    "협력 게임인가요, 경쟁 게임인가요?",
                    "턴제 게임인가요, 실시간 게임인가요?"
                ]
            },
            'mechanics': {
                priority: 3,
                condition: (context) => !context.mechanics || context.mechanics.length < 2,
                questions: [
                    "핸드폰을 어떻게 조작해서 게임을 플레이하고 싶나요? (기울이기, 흔들기, 회전 등)",
                    "게임의 핵심 메카닉이나 규칙을 설명해주세요.",
                    "점수는 어떤 방식으로 획득하고 싶나요?"
                ]
            },
            'difficulty': {
                priority: 4,
                condition: (context) => !context.difficulty,
                questions: [
                    "게임의 난이도는 어느 정도로 설정하고 싶나요? (쉬움/보통/어려움)",
                    "게임 시간은 대략 얼마나 걸렸으면 좋겠나요?",
                    "난이도가 점진적으로 증가해야 하나요?"
                ]
            },
            'visuals': {
                priority: 5,
                condition: (context) => !context.visuals,
                questions: [
                    "게임의 시각적 스타일은 어떤 느낌이면 좋겠나요? (심플/화려/리얼/카툰)",
                    "특별한 색상 테마나 선호하는 색깔이 있나요?",
                    "게임 화면에 꼭 포함되었으면 하는 요소가 있나요?"
                ]
            },
            'objectives': {
                priority: 6,
                condition: (context) => !context.objectives || context.objectives.length < 2,
                questions: [
                    "게임의 최종 목표는 무엇인가요?",
                    "플레이어가 달성해야 할 중간 목표들이 있나요?",
                    "게임 오버 조건은 무엇인가요?"
                ]
            }
        };

        // 입력 분석 패턴
        this.analysisPatterns = {
            gameType: {
                solo: /혼자|1명|솔로|개인/i,
                dual: /2명|둘이|함께|협력|듀얼/i,
                multi: /여러명|다수|경쟁|멀티/i
            },
            difficulty: {
                easy: /쉬움|초보|간단|easy/i,
                medium: /보통|일반|적당|medium|normal/i,
                hard: /어려움|도전|복잡|hard|difficult/i
            },
            mechanics: {
                tilt: /기울|기울이|틸트|tilt|lean/i,
                shake: /흔들|셰이크|shake|vibrat/i,
                rotate: /회전|돌리|spin|rotat/i,
                tap: /터치|탭|클릭|tap|click/i
            },
            genre: {
                action: /액션|전투|싸움|action|fight|battle/i,
                puzzle: /퍼즐|사고|논리|puzzle|think|logic/i,
                physics: /물리|중력|던지|physics|gravity|throw/i,
                cooking: /요리|음식|레시피|cook|food|recipe/i,
                racing: /레이싱|달리기|속도|race|speed|fast/i,
                casual: /캐주얼|심플|간단|casual|simple|easy/i
            }
        };

        // 수집된 요구사항 저장
        this.currentSession = null;
        this.requirementSessions = new Map();
    }

    /**
     * 새로운 요구사항 수집 세션 시작
     */
    startSession(userId, initialMessage = '') {
        const sessionId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        const session = {
            sessionId,
            userId,
            startTime: new Date(),
            currentStep: 'initial',
            context: {
                messages: [initialMessage].filter(Boolean),
                extractedInfo: {}
            },
            questionsAsked: [],
            remainingQuestions: this.getPriorityQuestions({}),
            isComplete: false,
            completionScore: 0
        };

        // 초기 메시지가 있으면 분석
        if (initialMessage) {
            this.analyzeUserInput(session, initialMessage);
        }

        this.requirementSessions.set(sessionId, session);
        this.currentSession = session;

        return {
            sessionId,
            nextQuestion: this.getNextQuestion(session),
            progress: this.calculateProgress(session)
        };
    }

    /**
     * 사용자 입력 처리 및 다음 질문 생성
     */
    processUserInput(sessionId, userInput) {
        const session = this.requirementSessions.get(sessionId);
        if (!session) {
            throw new Error('세션을 찾을 수 없습니다.');
        }

        // 사용자 입력 저장
        session.context.messages.push(userInput);

        // 입력 내용 분석
        this.analyzeUserInput(session, userInput);

        // 진행 상황 업데이트
        session.remainingQuestions = this.getPriorityQuestions(session.context.extractedInfo);
        session.completionScore = this.calculateCompletionScore(session.context.extractedInfo);

        // 완료 여부 확인
        if (session.completionScore >= 80 || session.remainingQuestions.length === 0) {
            session.isComplete = true;
            session.endTime = new Date();
        }

        return {
            sessionId,
            isComplete: session.isComplete,
            nextQuestion: session.isComplete ? null : this.getNextQuestion(session),
            progress: this.calculateProgress(session),
            extractedInfo: session.context.extractedInfo,
            completionScore: session.completionScore
        };
    }

    /**
     * 사용자 입력 내용 분석
     */
    analyzeUserInput(session, input) {
        const context = session.context.extractedInfo;

        // 게임 타입 추출
        Object.entries(this.analysisPatterns.gameType).forEach(([type, pattern]) => {
            if (pattern.test(input)) {
                context.gameType = type;
                context.confidence = (context.confidence || 0) + 0.3;
            }
        });

        // 장르 추출
        Object.entries(this.analysisPatterns.genre).forEach(([genre, pattern]) => {
            if (pattern.test(input)) {
                context.genre = genre;
                context.confidence = (context.confidence || 0) + 0.3;
            }
        });

        // 메카닉 추출
        if (!context.mechanics) context.mechanics = [];
        Object.entries(this.analysisPatterns.mechanics).forEach(([mechanic, pattern]) => {
            if (pattern.test(input) && !context.mechanics.includes(mechanic)) {
                context.mechanics.push(mechanic);
            }
        });

        // 난이도 추출
        Object.entries(this.analysisPatterns.difficulty).forEach(([level, pattern]) => {
            if (pattern.test(input)) {
                context.difficulty = level;
            }
        });

        // 목표 및 objectives 추출
        if (!context.objectives) context.objectives = [];
        const objectiveKeywords = [
            '목표', '목적', '승리', '클리어', '완료', '달성',
            'goal', 'objective', 'win', 'clear', 'complete'
        ];
        
        objectiveKeywords.forEach(keyword => {
            const regex = new RegExp(`${keyword}[는은이가를]?\\s*([^.!?]+)`, 'gi');
            const matches = input.match(regex);
            if (matches) {
                matches.forEach(match => {
                    if (!context.objectives.some(obj => obj.includes(match.trim()))) {
                        context.objectives.push(match.trim());
                    }
                });
            }
        });

        // 시각적 요소 추출
        const visualKeywords = ['색깔', '색상', '디자인', '스타일', '모양', '외형'];
        visualKeywords.forEach(keyword => {
            if (input.includes(keyword)) {
                if (!context.visuals) context.visuals = {};
                context.visuals.mentioned = true;
                context.visuals.description = input;
            }
        });

        // 숫자 정보 추출 (시간, 점수 등)
        const numbers = input.match(/\d+/g);
        if (numbers) {
            if (input.includes('분') || input.includes('초')) {
                context.duration = numbers[0];
            }
            if (input.includes('점') || input.includes('스코어')) {
                context.targetScore = numbers[0];
            }
        }
    }

    /**
     * 우선순위에 따른 질문 목록 생성
     */
    getPriorityQuestions(extractedInfo) {
        return Object.entries(this.questionTemplates)
            .filter(([category, template]) => template.condition(extractedInfo))
            .sort((a, b) => a[1].priority - b[1].priority)
            .map(([category, template]) => ({
                category,
                questions: template.questions,
                priority: template.priority
            }));
    }

    /**
     * 다음 질문 선택 및 생성
     */
    getNextQuestion(session) {
        if (session.remainingQuestions.length === 0) {
            return null;
        }

        const nextCategory = session.remainingQuestions[0];
        const alreadyAsked = session.questionsAsked.filter(q => q.category === nextCategory.category);
        
        if (alreadyAsked.length < nextCategory.questions.length) {
            const questionIndex = alreadyAsked.length;
            const question = {
                category: nextCategory.category,
                text: nextCategory.questions[questionIndex],
                index: questionIndex,
                priority: nextCategory.priority
            };

            session.questionsAsked.push(question);
            return question;
        }

        // 현재 카테고리의 모든 질문을 다 물어봤으면 다음 카테고리로
        session.remainingQuestions.shift();
        return this.getNextQuestion(session);
    }

    /**
     * 요구사항 완성도 점수 계산
     */
    calculateCompletionScore(extractedInfo) {
        let score = 0;
        const weights = {
            genre: 20,
            gameType: 20,
            mechanics: 15,
            difficulty: 10,
            objectives: 15,
            visuals: 10,
            duration: 5,
            targetScore: 5
        };

        Object.entries(weights).forEach(([key, weight]) => {
            if (extractedInfo[key]) {
                if (Array.isArray(extractedInfo[key])) {
                    score += extractedInfo[key].length > 0 ? weight : 0;
                } else if (typeof extractedInfo[key] === 'object') {
                    score += Object.keys(extractedInfo[key]).length > 0 ? weight : 0;
                } else {
                    score += weight;
                }
            }
        });

        return Math.min(score, 100);
    }

    /**
     * 진행 상황 계산
     */
    calculateProgress(session) {
        const totalQuestions = Object.keys(this.questionTemplates).length * 3; // 카테고리당 평균 3개 질문
        const askedQuestions = session.questionsAsked.length;
        
        return {
            percentage: Math.min((askedQuestions / totalQuestions) * 100, 100),
            completionScore: session.completionScore,
            questionsAsked: askedQuestions,
            remainingCategories: session.remainingQuestions.length
        };
    }

    /**
     * 세션 완료 및 최종 요구사항 정리
     */
    completeSession(sessionId) {
        const session = this.requirementSessions.get(sessionId);
        if (!session) {
            throw new Error('세션을 찾을 수 없습니다.');
        }

        session.isComplete = true;
        session.endTime = new Date();

        // 최종 요구사항 정리
        const finalRequirements = this.consolidateRequirements(session.context.extractedInfo);
        
        return {
            sessionId,
            requirements: finalRequirements,
            completionScore: session.completionScore,
            duration: session.endTime - session.startTime,
            totalMessages: session.context.messages.length
        };
    }

    /**
     * 요구사항 정리 및 표준화
     */
    consolidateRequirements(extractedInfo) {
        return {
            // 기본 정보
            gameType: extractedInfo.gameType || 'solo',
            genre: extractedInfo.genre || 'casual',
            difficulty: extractedInfo.difficulty || 'medium',
            
            // 게임 메카닉
            mechanics: extractedInfo.mechanics || ['tilt'],
            objectives: extractedInfo.objectives || ['점수 획득'],
            
            // 시각적 요소
            visuals: {
                style: extractedInfo.visuals?.style || 'simple',
                colors: extractedInfo.visuals?.colors || ['blue', 'white'],
                description: extractedInfo.visuals?.description || '깔끔하고 직관적인 디자인'
            },
            
            // 게임 설정
            duration: extractedInfo.duration || '2-5분',
            targetScore: extractedInfo.targetScore || 1000,
            
            // 추가 정보
            specialFeatures: extractedInfo.specialFeatures || [],
            references: extractedInfo.references || [],
            
            // 메타데이터
            confidence: extractedInfo.confidence || 0.5,
            completeness: this.calculateCompletionScore(extractedInfo)
        };
    }

    /**
     * 세션 상태 조회
     */
    getSessionStatus(sessionId) {
        const session = this.requirementSessions.get(sessionId);
        if (!session) {
            return null;
        }

        return {
            sessionId,
            isActive: !session.isComplete,
            progress: this.calculateProgress(session),
            extractedInfo: session.context.extractedInfo,
            questionsAsked: session.questionsAsked.length,
            remainingQuestions: session.remainingQuestions.length
        };
    }

    /**
     * 세션 정리 (메모리 관리)
     */
    cleanupOldSessions() {
        const now = new Date();
        const maxAge = 24 * 60 * 60 * 1000; // 24시간

        for (const [sessionId, session] of this.requirementSessions) {
            const sessionAge = now - session.startTime;
            if (sessionAge > maxAge) {
                this.requirementSessions.delete(sessionId);
            }
        }
    }

    /**
     * 통계 정보 생성
     */
    getStatistics() {
        const sessions = Array.from(this.requirementSessions.values());
        const completedSessions = sessions.filter(s => s.isComplete);

        return {
            totalSessions: sessions.length,
            completedSessions: completedSessions.length,
            averageCompletionScore: completedSessions.length > 0 
                ? completedSessions.reduce((sum, s) => sum + s.completionScore, 0) / completedSessions.length 
                : 0,
            averageQuestions: completedSessions.length > 0
                ? completedSessions.reduce((sum, s) => sum + s.questionsAsked.length, 0) / completedSessions.length
                : 0,
            mostCommonGenres: this.getMostCommon(completedSessions.map(s => s.context.extractedInfo.genre)),
            mostCommonGameTypes: this.getMostCommon(completedSessions.map(s => s.context.extractedInfo.gameType))
        };
    }

    /**
     * 가장 많이 나타나는 항목 찾기
     */
    getMostCommon(array) {
        const counts = {};
        array.filter(Boolean).forEach(item => {
            counts[item] = (counts[item] || 0) + 1;
        });

        return Object.entries(counts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([item, count]) => ({ item, count }));
    }
}

module.exports = RequirementCollector;