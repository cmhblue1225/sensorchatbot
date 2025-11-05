/**
 * 🚀 GameServer v6.0 Core
 *
 * 핵심 게임 서버 클래스 - 모듈화된 아키텍처
 * - Express 서버 초기화
 * - 컴포넌트 간 의존성 관리
 * - 서버 라이프사이클 관리
 */

const express = require('express');
const http = require('http');

const MiddlewareConfig = require('./MiddlewareConfig');
const SocketManager = require('./SocketManager');
const GameRoutes = require('../routes/gameRoutes');
const ApiRoutes = require('../routes/apiRoutes');
const AiRoutes = require('../routes/aiRoutes');
const TestRoutes = require('../routes/testRoutes');
const PerformanceRoutes = require('../routes/performanceRoutes');

const SessionService = require('../services/SessionService');
const GameService = require('../services/GameService');
const AIService = require('../services/AIService');

// 모니터링 시스템 추가
const PerformanceMonitor = require('../monitoring/PerformanceMonitor');

// 컨트롤러 추가
const GameController = require('../controllers/GameController');
const AIController = require('../controllers/AIController');

// 유틸리티 추가
const responseHelper = require('../utils/responseHelper');
const DocumentProcessor = require('../utils/documentProcessor');

class GameServer {
    constructor() {
        this.app = express();
        this.server = http.createServer(this.app);
        this.port = process.env.PORT || 3000;

        // 서비스 초기화
        this.sessionService = new SessionService();
        this.gameService = new GameService();
        this.aiService = new AIService();
        this.documentProcessor = new DocumentProcessor();

        // 모니터링 시스템 초기화
        this.performanceMonitor = new PerformanceMonitor();

        // 컨트롤러 초기화
        this.gameController = new GameController(this.gameService, this.sessionService);
        this.aiController = new AIController(this.aiService);

        // 라우터 초기화
        this.gameRoutes = new GameRoutes(this.gameService, this.sessionService);
        this.apiRoutes = new ApiRoutes(this.gameService, this.sessionService);
        this.aiRoutes = new AiRoutes(this.aiService);
        this.testRoutes = new TestRoutes();
        this.performanceRoutes = new PerformanceRoutes(this.performanceMonitor);

        // 소켓 매니저 초기화
        this.socketManager = new SocketManager(
            this.server,
            this.sessionService,
            this.gameService,
            this.aiService
        );

        // 초기화
        this.initializeServer();

        console.log('🚀 GameServer v6.0 Core 초기화 완료');
    }

    /**
     * 서버 초기화
     */
    initializeServer() {
        // 미들웨어 설정
        MiddlewareConfig.setupMiddleware(this.app);

        // 라우트 설정
        this.setupRoutes();

        // 게임 스캔 초기화
        this.gameService.initializeGames();

        // AI 서비스 초기화 (비동기)
        this.aiService.initialize();
    }

    /**
     * 라우트 설정
     */
    setupRoutes() {
        // 게임 관련 라우트
        this.app.use('/', this.gameRoutes.getRouter());

        // API 라우트
        this.app.use('/api', this.apiRoutes.getRouter());

        // AI 관련 라우트
        this.app.use('/ai', this.aiRoutes.getRouter());

        // 테스트 관련 라우트
        this.app.use('/test', this.testRoutes.getRouter());

        // 성능 모니터링 라우트
        this.app.use('/performance', this.performanceRoutes.getRouter());
    }

    /**
     * 서버 시작
     */
    start() {
        return new Promise((resolve, reject) => {
            try {
                this.server.listen(this.port, () => {
                    console.log(`🌟 Sensor Game Hub v6.0 서버가 포트 ${this.port}에서 실행 중입니다!`);
                    console.log(`🔗 http://localhost:${this.port}`);
                    console.log(`📱 센서 클라이언트: http://localhost:${this.port}/sensor.html`);
                    console.log(`🤖 AI 어시스턴트: http://localhost:${this.port}/ai-assistant`);
                    console.log(`🎮 게임 생성기: http://localhost:${this.port}/interactive-game-generator`);
                    console.log(`🧪 테스트 대시보드: http://localhost:${this.port}/test/dashboard`);
                    console.log(`📊 성능 대시보드: http://localhost:${this.port}/performance/dashboard`);
                    resolve();
                });
            } catch (error) {
                console.error('❌ 서버 시작 실패:', error);
                reject(error);
            }
        });
    }

    /**
     * 서버 정리 및 종료
     */
    async shutdown() {
        console.log('🔄 서버 종료 중...');

        try {
            // 소켓 연결 정리
            await this.socketManager.cleanup();

            // 서비스 정리
            await this.sessionService.cleanup();
            await this.gameService.cleanup();
            await this.aiService.cleanup();

            // 서버 종료
            this.server.close();

            console.log('✅ 서버가 안전하게 종료되었습니다.');
        } catch (error) {
            console.error('❌ 서버 종료 중 오류 발생:', error);
        }
    }

    /**
     * 서버 상태 조회
     */
    getStatus() {
        return {
            port: this.port,
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            sessions: this.sessionService.getStats(),
            games: this.gameService.getStats(),
            ai: this.aiService.getStatus()
        };
    }
}

module.exports = GameServer;