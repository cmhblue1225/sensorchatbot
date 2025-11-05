/**
 * 🧠 ContextManager v1.0
 *
 * 상용 수준의 컨텍스트 관리 시스템
 * - 다단계 대화 컨텍스트 추적
 * - 사용자별 세션 기반 기억
 * - 지능형 컨텍스트 압축 및 요약
 * - 실시간 컨텍스트 분석
 */

const fs = require('fs').promises;
const path = require('path');

class ContextManager {
    constructor(options = {}) {
        this.config = {
            maxContextLength: options.maxContextLength || 8000,
            maxSessionHistory: options.maxSessionHistory || 50,
            contextCompressionThreshold: options.contextCompressionThreshold || 6000,
            memoryRetentionHours: options.memoryRetentionHours || 24,
            autoSaveInterval: options.autoSaveInterval || 300000, // 5분
            ...options
        };

        // 세션별 컨텍스트 저장소
        this.sessions = new Map();

        // 글로벌 컨텍스트 (프로젝트 정보, 설정 등)
        this.globalContext = {
            projectInfo: {
                name: 'Sensor Game Hub v6.0',
                version: '6.0.0',
                description: '센서 기반 웹 게임 플랫폼',
                gameTypes: ['solo', 'dual', 'multi'],
                mainFeatures: ['SessionSDK', 'WebSocket', 'AI Generation', 'Real-time Monitoring']
            },
            developmentContext: {},
            commonPatterns: new Map(),
            frequentQuestions: new Map()
        };

        // 컨텍스트 분석 메트릭
        this.analytics = {
            totalSessions: 0,
            averageSessionLength: 0,
            contextCompressions: 0,
            popularTopics: new Map(),
            userPatterns: new Map()
        };

        this.initialize();
    }

    /**
     * 컨텍스트 매니저 초기화
     */
    async initialize() {
        try {
            console.log('🧠 ContextManager 초기화 중...');

            // 기존 세션 데이터 로드
            await this.loadPersistedSessions();

            // 글로벌 컨텍스트 로드
            await this.loadGlobalContext();

            // 주기적 자동 저장 설정
            this.setupAutoSave();

            // 메모리 정리 스케줄 설정
            this.setupMemoryCleanup();

            console.log('✅ ContextManager 초기화 완료');
        } catch (error) {
            console.error('❌ ContextManager 초기화 실패:', error);
        }
    }

    /**
     * 새로운 세션 생성 또는 기존 세션 조회
     */
    getOrCreateSession(sessionId, userId = null) {
        if (!this.sessions.has(sessionId)) {
            const newSession = {
                sessionId,
                userId,
                createdAt: Date.now(),
                lastActivity: Date.now(),
                messageHistory: [],
                contextState: {
                    currentTopic: null,
                    activeProjects: [],
                    userPreferences: {},
                    technicalLevel: 'intermediate'
                },
                metadata: {
                    totalMessages: 0,
                    contextCompressions: 0,
                    averageResponseTime: 0,
                    topicSwitches: 0
                }
            };

            this.sessions.set(sessionId, newSession);
            this.analytics.totalSessions++;
            console.log(`📝 새 세션 생성: ${sessionId}`);
        }

        const session = this.sessions.get(sessionId);
        session.lastActivity = Date.now();
        return session;
    }

    /**
     * 컨텍스트에 메시지 추가
     */
    addMessage(sessionId, message, messageType = 'user', metadata = {}) {
        const session = this.getOrCreateSession(sessionId);

        const messageEntry = {
            id: this.generateMessageId(),
            timestamp: Date.now(),
            type: messageType, // 'user', 'assistant', 'system'
            content: message,
            metadata: {
                length: message.length,
                topic: this.extractTopic(message),
                intent: this.detectIntent(message),
                technicalLevel: this.assessTechnicalLevel(message),
                ...metadata
            }
        };

        session.messageHistory.push(messageEntry);
        session.metadata.totalMessages++;
        session.lastActivity = Date.now();

        // 토픽 변경 감지 및 기록
        this.updateTopicTracking(session, messageEntry.metadata.topic);

        // 컨텍스트 길이 확인 및 압축
        this.checkAndCompressContext(session);

        // 분석 데이터 업데이트
        this.updateAnalytics(messageEntry);

        return messageEntry;
    }

    /**
     * 현재 세션의 전체 컨텍스트 구성
     */
    buildContextForSession(sessionId, includeGlobal = true) {
        const session = this.getOrCreateSession(sessionId);

        let context = {
            sessionInfo: {
                sessionId: session.sessionId,
                createdAt: session.createdAt,
                messageCount: session.metadata.totalMessages,
                currentTopic: session.contextState.currentTopic
            },
            recentMessages: this.getRecentMessages(session),
            conversationSummary: this.generateConversationSummary(session),
            userPreferences: session.contextState.userPreferences,
            activeContext: this.extractActiveContext(session)
        };

        // 글로벌 컨텍스트 포함
        if (includeGlobal) {
            context.globalContext = this.globalContext;
        }

        return context;
    }

    /**
     * 지능형 컨텍스트 압축
     */
    checkAndCompressContext(session) {
        const totalLength = this.calculateContextLength(session);

        if (totalLength > this.config.contextCompressionThreshold) {
            console.log(`🗜️ 세션 ${session.sessionId} 컨텍스트 압축 시작 (${totalLength} 토큰)`);

            // 오래된 메시지 요약
            const oldMessages = session.messageHistory.slice(0, -20); // 최근 20개 제외
            const summary = this.summarizeMessages(oldMessages);

            // 요약된 내용으로 교체
            session.messageHistory = [
                {
                    id: this.generateMessageId(),
                    timestamp: Date.now(),
                    type: 'system',
                    content: `[이전 대화 요약]: ${summary}`,
                    metadata: { isCompressed: true }
                },
                ...session.messageHistory.slice(-20)
            ];

            session.metadata.contextCompressions++;
            this.analytics.contextCompressions++;

            console.log(`✅ 컨텍스트 압축 완료: ${this.calculateContextLength(session)} 토큰`);
        }
    }

    /**
     * 최근 메시지 추출 (중요도 기반)
     */
    getRecentMessages(session, count = 10) {
        const messages = session.messageHistory
            .slice(-count)
            .map(msg => ({
                type: msg.type,
                content: msg.content,
                timestamp: msg.timestamp,
                topic: msg.metadata.topic,
                intent: msg.metadata.intent
            }));

        return messages;
    }

    /**
     * 대화 요약 생성
     */
    generateConversationSummary(session) {
        if (session.messageHistory.length < 5) {
            return "대화 시작 단계입니다.";
        }

        const topics = new Map();
        const keyPoints = [];

        session.messageHistory.forEach(msg => {
            if (msg.metadata.topic) {
                topics.set(msg.metadata.topic, (topics.get(msg.metadata.topic) || 0) + 1);
            }

            // 중요한 포인트 추출 (질문, 에러, 솔루션 등)
            if (msg.type === 'user' && (
                msg.content.includes('?') ||
                msg.content.includes('오류') ||
                msg.content.includes('에러') ||
                msg.content.includes('어떻게')
            )) {
                keyPoints.push(msg.content.substring(0, 100));
            }
        });

        const mainTopics = Array.from(topics.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([topic]) => topic);

        return {
            mainTopics,
            keyPoints: keyPoints.slice(0, 5),
            totalMessages: session.metadata.totalMessages,
            duration: Date.now() - session.createdAt
        };
    }

    /**
     * 활성 컨텍스트 추출
     */
    extractActiveContext(session) {
        const recentMessages = session.messageHistory.slice(-5);

        // 현재 진행 중인 작업 추출
        const activeProjects = this.extractActiveProjects(recentMessages);
        const currentProblem = this.extractCurrentProblem(recentMessages);
        const technicalLevel = this.assessCurrentTechnicalLevel(session);

        return {
            activeProjects,
            currentProblem,
            technicalLevel,
            lastIntent: recentMessages[recentMessages.length - 1]?.metadata.intent,
            contextualHints: this.generateContextualHints(session)
        };
    }

    /**
     * 토픽 추출
     */
    extractTopic(message) {
        const topicPatterns = {
            'game-development': ['게임', 'game', '개발', 'development', 'SessionSDK'],
            'sensor-data': ['센서', 'sensor', 'orientation', 'acceleration', 'rotationRate'],
            'websocket': ['웹소켓', 'websocket', 'connection', '연결'],
            'ai-generation': ['AI', '생성', 'generate', '자동'],
            'debugging': ['오류', '에러', 'error', 'debug', '문제'],
            'performance': ['성능', 'performance', '최적화', 'optimization'],
            'ui-design': ['UI', 'CSS', 'HTML', '디자인', 'design']
        };

        for (const [topic, keywords] of Object.entries(topicPatterns)) {
            if (keywords.some(keyword =>
                message.toLowerCase().includes(keyword.toLowerCase())
            )) {
                return topic;
            }
        }

        return 'general';
    }

    /**
     * 의도 감지
     */
    detectIntent(message) {
        const intentPatterns = {
            'question': ['?', '어떻게', '무엇', '왜', 'how', 'what', 'why'],
            'request': ['만들어', '생성해', '도와줘', 'create', 'generate', 'help'],
            'problem': ['오류', '에러', '안돼', '문제', 'error', 'issue', 'problem'],
            'clarification': ['즉', '그러니까', '다시말해', 'mean', 'clarify'],
            'confirmation': ['맞나', '확인', '정확', 'correct', 'right', 'confirm']
        };

        for (const [intent, patterns] of Object.entries(intentPatterns)) {
            if (patterns.some(pattern =>
                message.toLowerCase().includes(pattern.toLowerCase())
            )) {
                return intent;
            }
        }

        return 'statement';
    }

    /**
     * 기술 수준 평가
     */
    assessTechnicalLevel(message) {
        const technicalIndicators = {
            beginner: ['처음', '초보', '모르겠', '어려워', 'beginner'],
            intermediate: ['이해했어', '어느정도', '기본적', 'basic'],
            advanced: ['최적화', '성능', '아키텍처', 'optimization', 'architecture']
        };

        for (const [level, indicators] of Object.entries(technicalIndicators)) {
            if (indicators.some(indicator =>
                message.toLowerCase().includes(indicator.toLowerCase())
            )) {
                return level;
            }
        }

        return 'intermediate';
    }

    /**
     * 컨텍스트 길이 계산
     */
    calculateContextLength(session) {
        return session.messageHistory.reduce((total, msg) =>
            total + msg.content.length, 0
        );
    }

    /**
     * 메시지 요약
     */
    summarizeMessages(messages) {
        if (messages.length === 0) return '';

        const topics = new Map();
        const keyActions = [];

        messages.forEach(msg => {
            if (msg.metadata.topic) {
                topics.set(msg.metadata.topic, (topics.get(msg.metadata.topic) || 0) + 1);
            }

            if (msg.type === 'assistant' && msg.content.length > 200) {
                keyActions.push(msg.content.substring(0, 100) + '...');
            }
        });

        const mainTopics = Array.from(topics.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 2)
            .map(([topic]) => topic);

        return `주요 논의 주제: ${mainTopics.join(', ')}. 주요 활동: ${keyActions.slice(0, 2).join(' | ')}`;
    }

    /**
     * 토픽 추적 업데이트
     */
    updateTopicTracking(session, newTopic) {
        if (session.contextState.currentTopic !== newTopic) {
            session.metadata.topicSwitches++;
            session.contextState.currentTopic = newTopic;
        }
    }

    /**
     * 분석 데이터 업데이트
     */
    updateAnalytics(messageEntry) {
        const topic = messageEntry.metadata.topic;
        if (topic) {
            this.analytics.popularTopics.set(
                topic,
                (this.analytics.popularTopics.get(topic) || 0) + 1
            );
        }
    }

    /**
     * 컨텍스트힌트 생성
     */
    generateContextualHints(session) {
        const hints = [];

        // 최근 토픽 기반 힌트
        if (session.contextState.currentTopic) {
            hints.push(`현재 ${session.contextState.currentTopic} 관련 작업 중`);
        }

        // 기술 수준 기반 힌트
        const techLevel = session.contextState.technicalLevel;
        if (techLevel === 'beginner') {
            hints.push('기초적인 설명과 단계별 가이드 필요');
        } else if (techLevel === 'advanced') {
            hints.push('고급 기능과 최적화 정보 선호');
        }

        return hints;
    }

    /**
     * 세션 데이터 영속화
     */
    async persistSession(sessionId) {
        try {
            const session = this.sessions.get(sessionId);
            if (!session) return false;

            const dataDir = path.join(__dirname, '../data/sessions');
            await fs.mkdir(dataDir, { recursive: true });

            const filePath = path.join(dataDir, `${sessionId}.json`);
            await fs.writeFile(filePath, JSON.stringify(session, null, 2));

            return true;
        } catch (error) {
            console.error(`❌ 세션 저장 실패 (${sessionId}):`, error);
            return false;
        }
    }

    /**
     * 영속화된 세션 로드
     */
    async loadPersistedSessions() {
        try {
            const dataDir = path.join(__dirname, '../data/sessions');
            const files = await fs.readdir(dataDir).catch(() => []);

            for (const file of files) {
                if (file.endsWith('.json')) {
                    const sessionId = file.replace('.json', '');
                    const filePath = path.join(dataDir, file);
                    const sessionData = JSON.parse(await fs.readFile(filePath, 'utf8'));

                    // 24시간 이내 세션만 로드
                    if (Date.now() - sessionData.lastActivity < this.config.memoryRetentionHours * 3600000) {
                        this.sessions.set(sessionId, sessionData);
                    }
                }
            }

            console.log(`📁 ${this.sessions.size}개 세션 로드 완료`);
        } catch (error) {
            console.error('❌ 세션 로드 실패:', error);
        }
    }

    /**
     * 글로벌 컨텍스트 로드
     */
    async loadGlobalContext() {
        try {
            // 프로젝트 구조 분석
            const projectStructure = await this.analyzeProjectStructure();
            this.globalContext.developmentContext = projectStructure;

            console.log('📋 글로벌 컨텍스트 로드 완료');
        } catch (error) {
            console.error('❌ 글로벌 컨텍스트 로드 실패:', error);
        }
    }

    /**
     * 프로젝트 구조 분석
     */
    async analyzeProjectStructure() {
        // 실제 구현에서는 프로젝트 파일을 스캔하여 구조 분석
        return {
            gameTypes: ['solo', 'dual', 'multi'],
            availableGames: [], // 실제 게임 목록으로 채워짐
            serverModules: ['SessionManager', 'AIService', 'GameServer'],
            clientModules: ['SessionSDK', 'GameEngine'],
            lastAnalyzed: Date.now()
        };
    }

    /**
     * 자동 저장 설정
     */
    setupAutoSave() {
        setInterval(async () => {
            for (const sessionId of this.sessions.keys()) {
                await this.persistSession(sessionId);
            }
        }, this.config.autoSaveInterval);
    }

    /**
     * 메모리 정리 설정
     */
    setupMemoryCleanup() {
        setInterval(() => {
            const cutoff = Date.now() - (this.config.memoryRetentionHours * 3600000);

            for (const [sessionId, session] of this.sessions.entries()) {
                if (session.lastActivity < cutoff) {
                    this.sessions.delete(sessionId);
                    console.log(`🗑️ 만료된 세션 정리: ${sessionId}`);
                }
            }
        }, 3600000); // 1시간마다
    }

    /**
     * 유틸리티 메서드들
     */
    generateMessageId() {
        return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    extractActiveProjects(messages) {
        // 메시지에서 현재 작업 중인 프로젝트 추출
        return [];
    }

    extractCurrentProblem(messages) {
        // 현재 해결 중인 문제 추출
        const problemMessages = messages.filter(msg =>
            msg.metadata.intent === 'problem' ||
            msg.content.includes('오류') ||
            msg.content.includes('문제')
        );

        return problemMessages.length > 0 ? problemMessages[problemMessages.length - 1].content : null;
    }

    assessCurrentTechnicalLevel(session) {
        const recentLevels = session.messageHistory
            .slice(-10)
            .map(msg => msg.metadata.technicalLevel)
            .filter(Boolean);

        if (recentLevels.length === 0) return 'intermediate';

        // 최빈값 계산
        const levelCounts = {};
        recentLevels.forEach(level => {
            levelCounts[level] = (levelCounts[level] || 0) + 1;
        });

        return Object.entries(levelCounts)
            .sort((a, b) => b[1] - a[1])[0][0];
    }

    /**
     * 세션 정보 조회
     */
    getSessionInfo(sessionId) {
        const session = this.sessions.get(sessionId);
        if (!session) return null;

        return {
            sessionId: session.sessionId,
            userId: session.userId,
            createdAt: session.createdAt,
            lastActivity: session.lastActivity,
            messageCount: session.metadata.totalMessages,
            currentTopic: session.contextState.currentTopic,
            technicalLevel: session.contextState.technicalLevel,
            contextCompressions: session.metadata.contextCompressions
        };
    }

    /**
     * 전체 분석 데이터 조회
     */
    getAnalytics() {
        return {
            ...this.analytics,
            activeSessions: this.sessions.size,
            popularTopics: Array.from(this.analytics.popularTopics.entries())
                .sort((a, b) => b[1] - a[1])
                .slice(0, 10)
        };
    }
}

module.exports = ContextManager;