/**
 * 📊 UserSatisfactionTracker v1.0
 *
 * 사용자 만족도 측정 및 분석 시스템
 * - 실시간 만족도 추적
 * - 다차원 품질 지표 측정
 * - 자동 개선 제안
 * - 사용자 경험 분석
 */

const fs = require('fs').promises;
const path = require('path');
const EventEmitter = require('events');

class UserSatisfactionTracker extends EventEmitter {
    constructor(contextManager, conversationOptimizer, options = {}) {
        super();

        this.contextManager = contextManager;
        this.conversationOptimizer = conversationOptimizer;

        this.config = {
            satisfactionThreshold: options.satisfactionThreshold || 3.5, // 5점 만점 기준
            feedbackRequestInterval: options.feedbackRequestInterval || 300000, // 5분
            minInteractionsForFeedback: options.minInteractionsForFeedback || 3,
            retentionDays: options.retentionDays || 30,
            analysisInterval: options.analysisInterval || 86400000, // 24시간
            ...options
        };

        // 만족도 데이터 저장소
        this.satisfactionData = new Map();

        // 사용자별 경험 데이터
        this.userExperiences = new Map();

        // 실시간 만족도 지표
        this.realTimeMetrics = {
            currentSatisfaction: 0,
            responseAccuracy: 0,
            responseSpeed: 0,
            problemResolution: 0,
            userEngagement: 0,
            systemUsability: 0
        };

        // 만족도 분석 결과
        this.analysisResults = {
            trends: [],
            insights: [],
            recommendations: [],
            lastAnalysis: null
        };

        // 피드백 수집 설정
        this.feedbackCollectors = new Map();

        this.initialize();
    }

    /**
     * 사용자 만족도 추적 시스템 초기화
     */
    async initialize() {
        try {
            console.log('📊 UserSatisfactionTracker 초기화 중...');

            // 기존 만족도 데이터 로드
            await this.loadSatisfactionData();

            // 사용자 경험 데이터 로드
            await this.loadUserExperiences();

            // 실시간 메트릭 초기화
            await this.initializeRealTimeMetrics();

            // 자동 피드백 수집 설정
            this.setupAutomaticFeedbackCollection();

            // 정기 분석 설정
            this.setupPeriodicAnalysis();

            console.log('✅ UserSatisfactionTracker 초기화 완료');
        } catch (error) {
            console.error('❌ UserSatisfactionTracker 초기화 실패:', error);
        }
    }

    /**
     * 사용자 상호작용 추적
     */
    trackUserInteraction(sessionId, interactionData) {
        const timestamp = Date.now();

        // 상호작용 데이터 구조화
        const interaction = {
            sessionId,
            timestamp,
            type: interactionData.type, // 'question', 'feedback', 'request', 'complaint'
            content: interactionData.content,
            response: interactionData.response,
            responseTime: interactionData.responseTime,
            context: interactionData.context,
            userSatisfaction: null, // 나중에 업데이트
            resolutionStatus: 'pending',
            metadata: {
                messageLength: interactionData.content?.length || 0,
                complexity: this.assessInteractionComplexity(interactionData),
                technicalLevel: interactionData.technicalLevel || 'intermediate'
            }
        };

        // 사용자 경험 업데이트
        this.updateUserExperience(sessionId, interaction);

        // 실시간 지표 업데이트
        this.updateRealTimeMetrics(interaction);

        // 자동 만족도 추정
        const estimatedSatisfaction = this.estimateInteractionSatisfaction(interaction);
        interaction.estimatedSatisfaction = estimatedSatisfaction;

        // 피드백 요청 여부 결정
        if (this.shouldRequestFeedback(sessionId, interaction)) {
            this.requestUserFeedback(sessionId, interaction);
        }

        console.log(`📊 사용자 상호작용 추적: ${sessionId} (${interaction.type})`);

        this.emit('interaction-tracked', {
            sessionId,
            interaction,
            estimatedSatisfaction,
            timestamp
        });

        return interaction;
    }

    /**
     * 사용자 피드백 수집
     */
    collectUserFeedback(sessionId, feedbackData) {
        const timestamp = Date.now();

        const feedback = {
            sessionId,
            timestamp,
            rating: feedbackData.rating, // 1-5 점수
            category: feedbackData.category, // 'response_quality', 'speed', 'accuracy', 'helpfulness'
            comment: feedbackData.comment,
            suggestions: feedbackData.suggestions,
            problemResolved: feedbackData.problemResolved,
            wouldRecommend: feedbackData.wouldRecommend,
            userContext: {
                sessionDuration: this.calculateSessionDuration(sessionId),
                interactionCount: this.getInteractionCount(sessionId),
                userTechnicalLevel: this.getUserTechnicalLevel(sessionId)
            }
        };

        // 만족도 데이터에 저장
        if (!this.satisfactionData.has(sessionId)) {
            this.satisfactionData.set(sessionId, []);
        }
        this.satisfactionData.get(sessionId).push(feedback);

        // 사용자 경험 업데이트
        this.updateUserExperienceWithFeedback(sessionId, feedback);

        // 실시간 메트릭 업데이트
        this.updateMetricsWithFeedback(feedback);

        // 개선 제안 생성
        const improvements = this.generateImprovementSuggestions(feedback);

        console.log(`📊 사용자 피드백 수집: ${sessionId} (평점: ${feedback.rating}/5)`);

        this.emit('feedback-collected', {
            sessionId,
            feedback,
            improvements,
            timestamp
        });

        return {
            feedback,
            improvements,
            currentSatisfaction: this.realTimeMetrics.currentSatisfaction
        };
    }

    /**
     * 상호작용 복잡도 평가
     */
    assessInteractionComplexity(interactionData) {
        let complexity = 0;

        // 메시지 길이 기반
        const messageLength = interactionData.content?.length || 0;
        complexity += Math.min(messageLength / 100, 3); // 최대 3점

        // 기술적 키워드 수
        const technicalKeywords = [
            'SessionSDK', 'WebSocket', 'sensor', 'API', 'function',
            'error', 'debug', 'performance', 'optimization'
        ];
        const technicalCount = technicalKeywords.reduce((count, keyword) =>
            count + (interactionData.content?.toLowerCase().includes(keyword.toLowerCase()) ? 1 : 0), 0
        );
        complexity += technicalCount * 0.5;

        // 질문 형태
        if (interactionData.content?.includes('?')) {
            complexity += 1;
        }

        // 코드 포함 여부
        if (interactionData.content?.includes('```') || interactionData.content?.includes('function')) {
            complexity += 2;
        }

        return Math.min(complexity, 10); // 최대 10점
    }

    /**
     * 상호작용 만족도 추정
     */
    estimateInteractionSatisfaction(interaction) {
        let satisfaction = 3.0; // 기본 점수

        // 응답 시간 기반
        if (interaction.responseTime < 2000) {
            satisfaction += 0.5; // 빠른 응답
        } else if (interaction.responseTime > 10000) {
            satisfaction -= 0.5; // 느린 응답
        }

        // 응답 길이 적절성
        const responseLength = interaction.response?.length || 0;
        const questionLength = interaction.content?.length || 0;

        if (responseLength > questionLength * 2 && responseLength < questionLength * 10) {
            satisfaction += 0.3; // 적절한 응답 길이
        }

        // 기술적 정확성 (키워드 기반 추정)
        if (interaction.response?.includes('SessionSDK') && interaction.content?.includes('SessionSDK')) {
            satisfaction += 0.4; // 관련성 있는 응답
        }

        // 해결책 제시 여부
        if (interaction.response?.includes('해결') || interaction.response?.includes('방법') ||
            interaction.response?.includes('단계')) {
            satisfaction += 0.3;
        }

        return Math.max(1, Math.min(5, satisfaction));
    }

    /**
     * 피드백 요청 필요성 판단
     */
    shouldRequestFeedback(sessionId, interaction) {
        const userExperience = this.userExperiences.get(sessionId);
        if (!userExperience) return false;

        // 최소 상호작용 수 확인
        if (userExperience.interactionCount < this.config.minInteractionsForFeedback) {
            return false;
        }

        // 마지막 피드백 요청 시간 확인
        const lastFeedbackRequest = userExperience.lastFeedbackRequest || 0;
        const timeSinceLastRequest = Date.now() - lastFeedbackRequest;

        if (timeSinceLastRequest < this.config.feedbackRequestInterval) {
            return false;
        }

        // 낮은 추정 만족도일 때
        if (interaction.estimatedSatisfaction < this.config.satisfactionThreshold) {
            return true;
        }

        // 복잡한 상호작용일 때
        if (interaction.metadata.complexity > 6) {
            return true;
        }

        // 정기적 피드백 요청
        if (userExperience.interactionCount % 10 === 0) {
            return true;
        }

        return false;
    }

    /**
     * 사용자 피드백 요청
     */
    requestUserFeedback(sessionId, interaction) {
        const feedbackRequest = {
            sessionId,
            interactionId: interaction.timestamp,
            type: 'satisfaction_survey',
            priority: interaction.estimatedSatisfaction < 3 ? 'high' : 'normal',
            questions: this.generateFeedbackQuestions(interaction),
            timestamp: Date.now()
        };

        // 사용자 경험에 피드백 요청 기록
        const userExperience = this.userExperiences.get(sessionId);
        if (userExperience) {
            userExperience.lastFeedbackRequest = Date.now();
            userExperience.feedbackRequests++;
        }

        this.emit('feedback-requested', feedbackRequest);

        console.log(`📝 피드백 요청: ${sessionId} (우선순위: ${feedbackRequest.priority})`);

        return feedbackRequest;
    }

    /**
     * 피드백 질문 생성
     */
    generateFeedbackQuestions(interaction) {
        const baseQuestions = [
            {
                id: 'overall_satisfaction',
                type: 'rating',
                question: '전체적으로 이번 응답에 만족하시나요?',
                scale: '1-5',
                required: true
            },
            {
                id: 'response_helpfulness',
                type: 'rating',
                question: '제공된 답변이 도움이 되었나요?',
                scale: '1-5',
                required: true
            }
        ];

        // 상호작용 유형별 추가 질문
        if (interaction.type === 'question') {
            baseQuestions.push({
                id: 'answer_clarity',
                type: 'rating',
                question: '답변이 명확하고 이해하기 쉬웠나요?',
                scale: '1-5',
                required: false
            });
        }

        if (interaction.metadata.complexity > 5) {
            baseQuestions.push({
                id: 'technical_accuracy',
                type: 'rating',
                question: '기술적 내용이 정확했나요?',
                scale: '1-5',
                required: false
            });
        }

        baseQuestions.push({
            id: 'additional_comments',
            type: 'text',
            question: '추가로 하고 싶은 말씀이 있으시면 자유롭게 작성해주세요.',
            required: false
        });

        return baseQuestions;
    }

    /**
     * 사용자 경험 업데이트
     */
    updateUserExperience(sessionId, interaction) {
        if (!this.userExperiences.has(sessionId)) {
            this.userExperiences.set(sessionId, {
                sessionId,
                startTime: Date.now(),
                lastActivity: Date.now(),
                interactionCount: 0,
                totalSatisfaction: 0,
                feedbackCount: 0,
                feedbackRequests: 0,
                lastFeedbackRequest: 0,
                issuesResolved: 0,
                averageResponseTime: 0,
                technicalLevel: 'intermediate',
                preferredTopics: [],
                problemAreas: []
            });
        }

        const experience = this.userExperiences.get(sessionId);

        experience.lastActivity = Date.now();
        experience.interactionCount++;

        // 평균 응답 시간 업데이트
        if (interaction.responseTime) {
            experience.averageResponseTime =
                (experience.averageResponseTime * (experience.interactionCount - 1) + interaction.responseTime) /
                experience.interactionCount;
        }

        // 기술 수준 업데이트
        if (interaction.metadata.technicalLevel) {
            experience.technicalLevel = interaction.metadata.technicalLevel;
        }
    }

    /**
     * 피드백으로 사용자 경험 업데이트
     */
    updateUserExperienceWithFeedback(sessionId, feedback) {
        const experience = this.userExperiences.get(sessionId);
        if (!experience) return;

        experience.feedbackCount++;
        experience.totalSatisfaction += feedback.rating;

        if (feedback.problemResolved) {
            experience.issuesResolved++;
        }

        // 문제 영역 파악
        if (feedback.rating < 3) {
            if (feedback.category && !experience.problemAreas.includes(feedback.category)) {
                experience.problemAreas.push(feedback.category);
            }
        }
    }

    /**
     * 실시간 메트릭 업데이트
     */
    updateRealTimeMetrics(interaction) {
        // 응답 속도 메트릭
        if (interaction.responseTime) {
            const speedScore = Math.max(0, Math.min(5, 5 - (interaction.responseTime / 2000)));
            this.realTimeMetrics.responseSpeed =
                (this.realTimeMetrics.responseSpeed * 0.9) + (speedScore * 0.1);
        }

        // 추정 만족도 반영
        if (interaction.estimatedSatisfaction) {
            this.realTimeMetrics.currentSatisfaction =
                (this.realTimeMetrics.currentSatisfaction * 0.9) + (interaction.estimatedSatisfaction * 0.1);
        }

        // 시스템 사용성 (복잡도 역산)
        const usabilityScore = Math.max(1, 5 - (interaction.metadata.complexity / 2));
        this.realTimeMetrics.systemUsability =
            (this.realTimeMetrics.systemUsability * 0.9) + (usabilityScore * 0.1);
    }

    /**
     * 피드백으로 메트릭 업데이트
     */
    updateMetricsWithFeedback(feedback) {
        // 전체 만족도 업데이트
        this.realTimeMetrics.currentSatisfaction =
            (this.realTimeMetrics.currentSatisfaction * 0.8) + (feedback.rating * 0.2);

        // 카테고리별 메트릭 업데이트
        switch (feedback.category) {
            case 'response_quality':
                this.realTimeMetrics.responseAccuracy =
                    (this.realTimeMetrics.responseAccuracy * 0.8) + (feedback.rating * 0.2);
                break;
            case 'speed':
                this.realTimeMetrics.responseSpeed =
                    (this.realTimeMetrics.responseSpeed * 0.8) + (feedback.rating * 0.2);
                break;
            case 'helpfulness':
                this.realTimeMetrics.problemResolution =
                    (this.realTimeMetrics.problemResolution * 0.8) + (feedback.rating * 0.2);
                break;
        }

        // 사용자 참여도 (피드백 제공은 높은 참여도의 신호)
        this.realTimeMetrics.userEngagement =
            Math.min(5, this.realTimeMetrics.userEngagement + 0.1);
    }

    /**
     * 개선 제안 생성
     */
    generateImprovementSuggestions(feedback) {
        const suggestions = [];

        // 낮은 평점에 대한 제안
        if (feedback.rating < 3) {
            suggestions.push({
                type: 'immediate',
                priority: 'high',
                area: feedback.category || 'general',
                suggestion: this.generateSpecificSuggestion(feedback),
                impact: 'high'
            });
        }

        // 카테고리별 제안
        if (feedback.category === 'response_quality' && feedback.rating < 4) {
            suggestions.push({
                type: 'process',
                priority: 'medium',
                area: 'response_generation',
                suggestion: '응답 품질 향상을 위한 프롬프트 최적화 필요',
                impact: 'medium'
            });
        }

        if (feedback.category === 'speed' && feedback.rating < 4) {
            suggestions.push({
                type: 'technical',
                priority: 'medium',
                area: 'performance',
                suggestion: '응답 속도 개선을 위한 시스템 최적화 필요',
                impact: 'medium'
            });
        }

        // 긍정적 피드백에 대한 강화 제안
        if (feedback.rating >= 4) {
            suggestions.push({
                type: 'reinforcement',
                priority: 'low',
                area: feedback.category || 'general',
                suggestion: '현재 좋은 성과를 보이는 영역 - 이 패턴을 다른 영역에도 적용 고려',
                impact: 'low'
            });
        }

        return suggestions;
    }

    /**
     * 구체적 제안 생성
     */
    generateSpecificSuggestion(feedback) {
        const suggestions = {
            'response_quality': '응답의 정확성과 완성도를 높이기 위해 더 자세한 컨텍스트 분석이 필요합니다',
            'speed': '응답 시간 단축을 위해 캐싱 시스템 개선이나 모델 최적화를 고려하세요',
            'accuracy': '기술적 정확성 향상을 위해 최신 문서와 베스트 프랙티스 업데이트가 필요합니다',
            'helpfulness': '더 실용적이고 실행 가능한 조언 제공을 위해 단계별 가이드 강화가 필요합니다'
        };

        return suggestions[feedback.category] || '사용자 피드백을 바탕으로 전반적인 서비스 품질 개선이 필요합니다';
    }

    /**
     * 자동 피드백 수집 설정
     */
    setupAutomaticFeedbackCollection() {
        // 컨텍스트 매니저 이벤트 구독
        if (this.contextManager) {
            this.contextManager.on?.('message-added', (data) => {
                this.trackUserInteraction(data.sessionId, {
                    type: 'message',
                    content: data.message,
                    response: data.response,
                    responseTime: data.responseTime
                });
            });
        }

        console.log('🔄 자동 피드백 수집 설정 완료');
    }

    /**
     * 정기 분석 설정
     */
    setupPeriodicAnalysis() {
        setInterval(() => {
            this.performSatisfactionAnalysis();
        }, this.config.analysisInterval);

        console.log('📈 정기 만족도 분석 설정 완료');
    }

    /**
     * 만족도 분석 수행
     */
    async performSatisfactionAnalysis() {
        try {
            console.log('📊 만족도 분석 시작...');

            const analysis = {
                timestamp: Date.now(),
                period: '24h',
                metrics: { ...this.realTimeMetrics },
                trends: this.analyzeTrends(),
                insights: this.generateInsights(),
                recommendations: this.generateRecommendations(),
                userSegments: this.analyzeUserSegments(),
                qualityScore: this.calculateOverallQualityScore()
            };

            this.analysisResults = analysis;

            // 중요한 인사이트가 있으면 알림
            if (analysis.qualityScore < 3.0) {
                this.emit('quality-alert', {
                    level: 'critical',
                    score: analysis.qualityScore,
                    recommendations: analysis.recommendations.slice(0, 3)
                });
            }

            await this.saveAnalysisResults(analysis);

            console.log(`✅ 만족도 분석 완료 (품질 점수: ${analysis.qualityScore.toFixed(2)}/5)`);

            return analysis;

        } catch (error) {
            console.error('❌ 만족도 분석 실패:', error);
            throw error;
        }
    }

    /**
     * 유틸리티 메서드들
     */
    calculateSessionDuration(sessionId) {
        const experience = this.userExperiences.get(sessionId);
        return experience ? Date.now() - experience.startTime : 0;
    }

    getInteractionCount(sessionId) {
        const experience = this.userExperiences.get(sessionId);
        return experience ? experience.interactionCount : 0;
    }

    getUserTechnicalLevel(sessionId) {
        const experience = this.userExperiences.get(sessionId);
        return experience ? experience.technicalLevel : 'intermediate';
    }

    calculateOverallQualityScore() {
        const weights = {
            currentSatisfaction: 0.3,
            responseAccuracy: 0.25,
            responseSpeed: 0.15,
            problemResolution: 0.2,
            systemUsability: 0.1
        };

        return Object.entries(weights).reduce((score, [metric, weight]) => {
            return score + (this.realTimeMetrics[metric] * weight);
        }, 0);
    }

    /**
     * 데이터 저장/로드
     */
    async saveSatisfactionData() {
        try {
            const dataDir = path.join(__dirname, '../data/satisfaction');
            await fs.mkdir(dataDir, { recursive: true });

            const dataPath = path.join(dataDir, 'satisfaction_data.json');
            await fs.writeFile(dataPath, JSON.stringify(
                Object.fromEntries(this.satisfactionData),
                null, 2
            ));

            return true;
        } catch (error) {
            console.error('❌ 만족도 데이터 저장 실패:', error);
            return false;
        }
    }

    async loadSatisfactionData() {
        try {
            const dataDir = path.join(__dirname, '../data/satisfaction');
            const dataPath = path.join(dataDir, 'satisfaction_data.json');

            const data = JSON.parse(await fs.readFile(dataPath, 'utf8'));
            this.satisfactionData = new Map(Object.entries(data));

            console.log(`📊 ${this.satisfactionData.size}개 세션 만족도 데이터 로드 완료`);
        } catch (error) {
            console.log('📊 새로운 만족도 추적 시작');
        }
    }

    async loadUserExperiences() {
        try {
            const dataDir = path.join(__dirname, '../data/satisfaction');
            const experiencesPath = path.join(dataDir, 'user_experiences.json');

            const data = JSON.parse(await fs.readFile(experiencesPath, 'utf8'));
            this.userExperiences = new Map(Object.entries(data));

            console.log(`👤 ${this.userExperiences.size}개 사용자 경험 데이터 로드 완료`);
        } catch (error) {
            console.log('👤 새로운 사용자 경험 추적 시작');
        }
    }

    async initializeRealTimeMetrics() {
        // 기존 데이터가 있으면 평균값으로 초기화
        if (this.satisfactionData.size > 0) {
            const allFeedback = Array.from(this.satisfactionData.values()).flat();
            const avgRating = allFeedback.reduce((sum, fb) => sum + fb.rating, 0) / allFeedback.length;

            this.realTimeMetrics.currentSatisfaction = avgRating;
            this.realTimeMetrics.responseAccuracy = avgRating;
            this.realTimeMetrics.responseSpeed = avgRating;
            this.realTimeMetrics.problemResolution = avgRating;
            this.realTimeMetrics.systemUsability = avgRating;
            this.realTimeMetrics.userEngagement = avgRating;
        } else {
            // 기본값으로 초기화
            Object.keys(this.realTimeMetrics).forEach(key => {
                this.realTimeMetrics[key] = 3.5; // 중간값
            });
        }
    }

    /**
     * 만족도 통계 조회
     */
    getSatisfactionStats() {
        const totalFeedback = Array.from(this.satisfactionData.values()).flat();

        return {
            realTimeMetrics: this.realTimeMetrics,
            totalFeedback: totalFeedback.length,
            averageRating: totalFeedback.length > 0 ?
                totalFeedback.reduce((sum, fb) => sum + fb.rating, 0) / totalFeedback.length : 0,
            activeSessions: this.userExperiences.size,
            qualityScore: this.calculateOverallQualityScore(),
            lastAnalysis: this.analysisResults.timestamp,
            trends: this.analysisResults.trends?.slice(0, 5) || []
        };
    }
}

module.exports = UserSatisfactionTracker;