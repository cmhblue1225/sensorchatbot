/**
 * 💬 ConversationHistoryOptimizer v1.0
 *
 * 대화 히스토리 활용 최적화 시스템
 * - 지능형 대화 패턴 분석
 * - 개인화된 응답 개선
 * - 다단계 대화 흐름 추적
 * - 학습 기반 응답 품질 향상
 */

const fs = require('fs').promises;
const path = require('path');

class ConversationHistoryOptimizer {
    constructor(contextManager, options = {}) {
        this.contextManager = contextManager;

        this.config = {
            learningThreshold: options.learningThreshold || 10, // 최소 대화 수
            patternAnalysisDepth: options.patternAnalysisDepth || 20,
            personalizationWeight: options.personalizationWeight || 0.7,
            qualityMetricsWindow: options.qualityMetricsWindow || 100,
            adaptationRate: options.adaptationRate || 0.1,
            ...options
        };

        // 대화 패턴 저장소
        this.conversationPatterns = new Map();

        // 사용자별 개인화 데이터
        this.userProfiles = new Map();

        // 응답 품질 메트릭
        this.qualityMetrics = {
            responseAccuracy: new Map(),
            userSatisfaction: new Map(),
            conversationFlow: new Map(),
            problemResolution: new Map()
        };

        // 학습된 패턴
        this.learnedPatterns = {
            commonQuestionFlow: new Map(),
            effectiveResponses: new Map(),
            userPreferences: new Map(),
            contextualCues: new Map()
        };

        this.initialize();
    }

    /**
     * 최적화 시스템 초기화
     */
    async initialize() {
        try {
            console.log('💬 ConversationHistoryOptimizer 초기화 중...');

            // 기존 학습 데이터 로드
            await this.loadLearnedPatterns();

            // 사용자 프로필 로드
            await this.loadUserProfiles();

            // 품질 메트릭 로드
            await this.loadQualityMetrics();

            console.log('✅ ConversationHistoryOptimizer 초기화 완료');
        } catch (error) {
            console.error('❌ ConversationHistoryOptimizer 초기화 실패:', error);
        }
    }

    /**
     * 대화 히스토리 분석 및 최적화된 컨텍스트 생성
     */
    optimizeContextForUser(sessionId, currentMessage) {
        const session = this.contextManager.getOrCreateSession(sessionId);
        const userProfile = this.getUserProfile(sessionId);

        // 1. 대화 패턴 분석
        const conversationPattern = this.analyzeConversationPattern(session);

        // 2. 개인화된 컨텍스트 구성
        const personalizedContext = this.buildPersonalizedContext(session, userProfile, currentMessage);

        // 3. 최적화된 응답 힌트 생성
        const responseHints = this.generateResponseHints(session, conversationPattern);

        // 4. 컨텍스트 품질 점수 계산
        const contextQuality = this.calculateContextQuality(session, personalizedContext);

        return {
            originalContext: this.contextManager.buildContextForSession(sessionId),
            optimizedContext: personalizedContext,
            responseHints,
            conversationPattern,
            contextQuality,
            personalizationData: userProfile
        };
    }

    /**
     * 대화 패턴 분석
     */
    analyzeConversationPattern(session) {
        const messages = session.messageHistory;
        if (messages.length < 3) {
            return { pattern: 'initial', confidence: 0.5 };
        }

        const pattern = {
            type: this.identifyConversationType(messages),
            flow: this.analyzeConversationFlow(messages),
            complexity: this.assessConversationComplexity(messages),
            userBehavior: this.analyzeUserBehavior(messages),
            topicProgression: this.analyzeTopicProgression(messages),
            questionAnswerPairs: this.extractQuestionAnswerPairs(messages)
        };

        const confidence = this.calculatePatternConfidence(pattern, messages.length);

        return { ...pattern, confidence };
    }

    /**
     * 대화 유형 식별
     */
    identifyConversationType(messages) {
        const userMessages = messages.filter(msg => msg.type === 'user');

        const patterns = {
            'troubleshooting': ['오류', '에러', '문제', '안돼', 'error', 'issue'],
            'learning': ['어떻게', '방법', '설명', 'how', 'explain', 'tutorial'],
            'development': ['만들어', '구현', '개발', 'create', 'implement', 'develop'],
            'optimization': ['최적화', '성능', '개선', 'optimize', 'improve', 'performance'],
            'exploration': ['가능한', '있나', '방법이', 'possible', 'available', 'options']
        };

        const scores = {};
        for (const [type, keywords] of Object.entries(patterns)) {
            scores[type] = 0;
            userMessages.forEach(msg => {
                keywords.forEach(keyword => {
                    if (msg.content.toLowerCase().includes(keyword.toLowerCase())) {
                        scores[type]++;
                    }
                });
            });
        }

        const maxScore = Math.max(...Object.values(scores));
        const dominantType = Object.entries(scores).find(([, score]) => score === maxScore)?.[0];

        return dominantType || 'general';
    }

    /**
     * 대화 흐름 분석
     */
    analyzeConversationFlow(messages) {
        const flow = [];
        let currentTopic = null;

        messages.forEach(msg => {
            const topic = msg.metadata.topic;
            const intent = msg.metadata.intent;

            if (topic !== currentTopic) {
                flow.push({
                    transition: currentTopic ? `${currentTopic} -> ${topic}` : `start -> ${topic}`,
                    timestamp: msg.timestamp,
                    intent: intent
                });
                currentTopic = topic;
            }
        });

        return {
            transitions: flow,
            topicChanges: flow.length - 1,
            avgTimePerTopic: this.calculateAverageTopicTime(flow),
            flowType: this.classifyFlowType(flow)
        };
    }

    /**
     * 대화 복잡도 평가
     */
    assessConversationComplexity(messages) {
        const userMessages = messages.filter(msg => msg.type === 'user');

        const complexity = {
            averageMessageLength: userMessages.reduce((sum, msg) => sum + msg.content.length, 0) / userMessages.length,
            technicalTermCount: this.countTechnicalTerms(userMessages),
            questionsPerMessage: userMessages.filter(msg => msg.content.includes('?')).length / userMessages.length,
            topicDiversity: new Set(messages.map(msg => msg.metadata.topic)).size,
            timeSpan: messages.length > 0 ? messages[messages.length - 1].timestamp - messages[0].timestamp : 0
        };

        // 복잡도 점수 계산 (0-100)
        const score = Math.min(100,
            (complexity.averageMessageLength / 10) +
            (complexity.technicalTermCount * 5) +
            (complexity.questionsPerMessage * 20) +
            (complexity.topicDiversity * 10)
        );

        return { ...complexity, score };
    }

    /**
     * 사용자 행동 분석
     */
    analyzeUserBehavior(messages) {
        const userMessages = messages.filter(msg => msg.type === 'user');

        return {
            responseTime: this.calculateAverageResponseTime(messages),
            messageFrequency: this.calculateMessageFrequency(messages),
            questioningStyle: this.analyzeQuestioningStyle(userMessages),
            communicationStyle: this.analyzeCommunicationStyle(userMessages),
            persistenceLevel: this.analyzePersistenceLevel(userMessages),
            feedbackProvision: this.analyzeFeedbackProvision(userMessages)
        };
    }

    /**
     * 토픽 진행 분석
     */
    analyzeTopicProgression(messages) {
        const topics = messages.map(msg => ({
            topic: msg.metadata.topic,
            timestamp: msg.timestamp,
            type: msg.type
        }));

        const progression = {
            topicSequence: [...new Set(topics.map(t => t.topic))],
            topicDepth: this.calculateTopicDepth(topics),
            progressionSpeed: this.calculateProgressionSpeed(topics),
            backtracking: this.detectBacktracking(topics)
        };

        return progression;
    }

    /**
     * 질문-답변 쌍 추출
     */
    extractQuestionAnswerPairs(messages) {
        const pairs = [];

        for (let i = 0; i < messages.length - 1; i++) {
            const currentMsg = messages[i];
            const nextMsg = messages[i + 1];

            if (currentMsg.type === 'user' &&
                (currentMsg.content.includes('?') || currentMsg.metadata.intent === 'question') &&
                nextMsg.type === 'assistant') {

                pairs.push({
                    question: currentMsg.content,
                    answer: nextMsg.content,
                    topic: currentMsg.metadata.topic,
                    timestamp: currentMsg.timestamp,
                    quality: this.assessAnswerQuality(currentMsg, nextMsg)
                });
            }
        }

        return pairs;
    }

    /**
     * 개인화된 컨텍스트 구성
     */
    buildPersonalizedContext(session, userProfile, currentMessage) {
        const baseContext = this.contextManager.buildContextForSession(session.sessionId);

        const personalizedContext = {
            ...baseContext,
            personalization: {
                userProfile: userProfile,
                preferredResponseStyle: this.determinePreferredResponseStyle(userProfile),
                technicalLevel: this.adjustTechnicalLevel(userProfile, currentMessage),
                communicationPreferences: userProfile.communicationPreferences,
                pastSuccesses: this.findRelevantPastSuccesses(userProfile, currentMessage),
                learningPath: this.generateLearningPath(userProfile, currentMessage)
            },
            optimizedHistory: this.selectOptimalHistoryMessages(session, currentMessage),
            contextualCues: this.generateContextualCues(session, userProfile),
            responseGuidance: this.generateResponseGuidance(session, userProfile, currentMessage)
        };

        return personalizedContext;
    }

    /**
     * 사용자 프로필 가져오기 또는 생성
     */
    getUserProfile(sessionId) {
        if (!this.userProfiles.has(sessionId)) {
            const session = this.contextManager.getOrCreateSession(sessionId);
            const profile = this.buildUserProfile(session);
            this.userProfiles.set(sessionId, profile);
        }

        return this.userProfiles.get(sessionId);
    }

    /**
     * 사용자 프로필 구축
     */
    buildUserProfile(session) {
        const messages = session.messageHistory;
        const userMessages = messages.filter(msg => msg.type === 'user');

        const profile = {
            sessionId: session.sessionId,
            createdAt: Date.now(),
            lastUpdated: Date.now(),

            // 기본 특성
            messageCount: userMessages.length,
            averageMessageLength: userMessages.reduce((sum, msg) => sum + msg.content.length, 0) / Math.max(userMessages.length, 1),

            // 기술적 특성
            technicalLevel: this.assessOverallTechnicalLevel(userMessages),
            preferredTopics: this.extractPreferredTopics(messages),
            commonQuestions: this.extractCommonQuestions(userMessages),

            // 커뮤니케이션 스타일
            communicationStyle: this.assessCommunicationStyle(userMessages),
            questioningStyle: this.assessQuestioningStyle(userMessages),
            feedbackStyle: this.assessFeedbackStyle(userMessages),

            // 학습 패턴
            learningStyle: this.assessLearningStyle(messages),
            preferredExplanationStyle: this.assessPreferredExplanationStyle(userMessages),

            // 성공 패턴
            successfulInteractions: this.extractSuccessfulInteractions(messages),
            problematicPatterns: this.extractProblematicPatterns(messages),

            // 개인화 힌트
            responsePreferences: this.extractResponsePreferences(messages),
            contextualPreferences: this.extractContextualPreferences(messages)
        };

        return profile;
    }

    /**
     * 최적 히스토리 메시지 선택
     */
    selectOptimalHistoryMessages(session, currentMessage) {
        const messages = session.messageHistory;
        const relevanceScores = messages.map(msg =>
            this.calculateMessageRelevance(msg, currentMessage, session)
        );

        // 관련도 점수와 시간 가중치를 결합하여 최적 메시지 선택
        const rankedMessages = messages
            .map((msg, index) => ({
                message: msg,
                score: relevanceScores[index] * this.calculateTimeWeight(msg.timestamp),
                index
            }))
            .sort((a, b) => b.score - a.score)
            .slice(0, 10); // 상위 10개 선택

        return rankedMessages.map(item => item.message);
    }

    /**
     * 응답 힌트 생성
     */
    generateResponseHints(session, conversationPattern) {
        const hints = [];

        // 대화 패턴 기반 힌트
        if (conversationPattern.type === 'troubleshooting') {
            hints.push('체계적인 문제 해결 단계 제시');
            hints.push('구체적인 해결책과 대안 제공');
        } else if (conversationPattern.type === 'learning') {
            hints.push('단계별 설명과 예제 포함');
            hints.push('이해도 확인 질문 추가');
        }

        // 사용자 행동 기반 힌트
        if (conversationPattern.userBehavior.persistenceLevel > 0.7) {
            hints.push('상세하고 완전한 답변 제공');
        }

        // 토픽 진행 기반 힌트
        if (conversationPattern.topicProgression.backtracking > 2) {
            hints.push('이전 설명 요약 포함');
            hints.push('연결성 명확히 설명');
        }

        return hints;
    }

    /**
     * 메시지 관련도 계산
     */
    calculateMessageRelevance(message, currentMessage, session) {
        let relevance = 0;

        // 토픽 유사성
        if (message.metadata.topic === this.extractTopic(currentMessage)) {
            relevance += 0.4;
        }

        // 의도 유사성
        if (message.metadata.intent === this.detectIntent(currentMessage)) {
            relevance += 0.3;
        }

        // 키워드 유사성
        const messageKeywords = this.extractKeywords(message.content);
        const currentKeywords = this.extractKeywords(currentMessage);
        const keywordSimilarity = this.calculateKeywordSimilarity(messageKeywords, currentKeywords);
        relevance += keywordSimilarity * 0.3;

        return Math.min(relevance, 1.0);
    }

    /**
     * 시간 가중치 계산
     */
    calculateTimeWeight(timestamp) {
        const now = Date.now();
        const timeDiff = now - timestamp;
        const hoursDiff = timeDiff / (1000 * 60 * 60);

        // 지수 감소 함수 (최근 메시지에 더 높은 가중치)
        return Math.exp(-hoursDiff / 24);
    }

    /**
     * 컨텍스트 품질 계산
     */
    calculateContextQuality(session, personalizedContext) {
        const quality = {
            completeness: this.assessContextCompleteness(personalizedContext),
            relevance: this.assessContextRelevance(session, personalizedContext),
            personalization: this.assessPersonalizationLevel(personalizedContext),
            coherence: this.assessContextCoherence(personalizedContext),
            actionability: this.assessActionability(personalizedContext)
        };

        const overallScore = Object.values(quality).reduce((sum, score) => sum + score, 0) / Object.keys(quality).length;

        return { ...quality, overallScore };
    }

    /**
     * 학습된 패턴 저장
     */
    async saveLearnedPatterns() {
        try {
            const dataDir = path.join(__dirname, '../data/conversation');
            await fs.mkdir(dataDir, { recursive: true });

            const patternsPath = path.join(dataDir, 'learned_patterns.json');
            await fs.writeFile(patternsPath, JSON.stringify({
                patterns: Object.fromEntries(this.learnedPatterns.commonQuestionFlow),
                responses: Object.fromEntries(this.learnedPatterns.effectiveResponses),
                preferences: Object.fromEntries(this.learnedPatterns.userPreferences),
                cues: Object.fromEntries(this.learnedPatterns.contextualCues),
                lastUpdated: Date.now()
            }, null, 2));

            return true;
        } catch (error) {
            console.error('❌ 학습 패턴 저장 실패:', error);
            return false;
        }
    }

    /**
     * 학습된 패턴 로드
     */
    async loadLearnedPatterns() {
        try {
            const dataDir = path.join(__dirname, '../data/conversation');
            const patternsPath = path.join(dataDir, 'learned_patterns.json');

            const data = JSON.parse(await fs.readFile(patternsPath, 'utf8'));

            this.learnedPatterns.commonQuestionFlow = new Map(Object.entries(data.patterns || {}));
            this.learnedPatterns.effectiveResponses = new Map(Object.entries(data.responses || {}));
            this.learnedPatterns.userPreferences = new Map(Object.entries(data.preferences || {}));
            this.learnedPatterns.contextualCues = new Map(Object.entries(data.cues || {}));

            console.log('📚 학습된 패턴 로드 완료');
        } catch (error) {
            console.log('📝 새로운 학습 패턴 시작');
        }
    }

    /**
     * 사용자 프로필 저장
     */
    async saveUserProfiles() {
        try {
            const dataDir = path.join(__dirname, '../data/conversation');
            await fs.mkdir(dataDir, { recursive: true });

            const profilesPath = path.join(dataDir, 'user_profiles.json');
            await fs.writeFile(profilesPath, JSON.stringify(
                Object.fromEntries(this.userProfiles),
                null, 2
            ));

            return true;
        } catch (error) {
            console.error('❌ 사용자 프로필 저장 실패:', error);
            return false;
        }
    }

    /**
     * 사용자 프로필 로드
     */
    async loadUserProfiles() {
        try {
            const dataDir = path.join(__dirname, '../data/conversation');
            const profilesPath = path.join(dataDir, 'user_profiles.json');

            const data = JSON.parse(await fs.readFile(profilesPath, 'utf8'));
            this.userProfiles = new Map(Object.entries(data));

            console.log(`👤 ${this.userProfiles.size}개 사용자 프로필 로드 완료`);
        } catch (error) {
            console.log('👤 새로운 사용자 프로필 시작');
        }
    }

    /**
     * 품질 메트릭 로드
     */
    async loadQualityMetrics() {
        try {
            const dataDir = path.join(__dirname, '../data/conversation');
            const metricsPath = path.join(dataDir, 'quality_metrics.json');

            const data = JSON.parse(await fs.readFile(metricsPath, 'utf8'));

            this.qualityMetrics.responseAccuracy = new Map(Object.entries(data.responseAccuracy || {}));
            this.qualityMetrics.userSatisfaction = new Map(Object.entries(data.userSatisfaction || {}));
            this.qualityMetrics.conversationFlow = new Map(Object.entries(data.conversationFlow || {}));
            this.qualityMetrics.problemResolution = new Map(Object.entries(data.problemResolution || {}));

            console.log('📊 품질 메트릭 로드 완료');
        } catch (error) {
            console.log('📊 새로운 품질 메트릭 시작');
        }
    }

    /**
     * 유틸리티 메서드들
     */
    extractTopic(message) {
        // ContextManager의 extractTopic 메서드 활용
        return this.contextManager.extractTopic(message);
    }

    detectIntent(message) {
        // ContextManager의 detectIntent 메서드 활용
        return this.contextManager.detectIntent(message);
    }

    extractKeywords(text) {
        // 간단한 키워드 추출 (실제로는 더 정교한 NLP 기법 사용)
        return text.toLowerCase()
            .split(/\s+/)
            .filter(word => word.length > 3)
            .slice(0, 10);
    }

    calculateKeywordSimilarity(keywords1, keywords2) {
        const set1 = new Set(keywords1);
        const set2 = new Set(keywords2);
        const intersection = new Set([...set1].filter(x => set2.has(x)));
        const union = new Set([...set1, ...set2]);

        return union.size > 0 ? intersection.size / union.size : 0;
    }

    // 더 많은 유틸리티 메서드들이 필요하지만 지면상 생략...
    // 실제 구현에서는 모든 메서드를 완전히 구현해야 함

    /**
     * 최적화 통계 조회
     */
    getOptimizationStats() {
        return {
            learnedPatterns: {
                questionFlows: this.learnedPatterns.commonQuestionFlow.size,
                effectiveResponses: this.learnedPatterns.effectiveResponses.size,
                userPreferences: this.learnedPatterns.userPreferences.size,
                contextualCues: this.learnedPatterns.contextualCues.size
            },
            userProfiles: this.userProfiles.size,
            qualityMetrics: {
                responseAccuracy: this.qualityMetrics.responseAccuracy.size,
                userSatisfaction: this.qualityMetrics.userSatisfaction.size,
                conversationFlow: this.qualityMetrics.conversationFlow.size,
                problemResolution: this.qualityMetrics.problemResolution.size
            }
        };
    }
}

module.exports = ConversationHistoryOptimizer;