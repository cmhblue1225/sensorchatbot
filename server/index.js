/**
 * 🚀 Sensor Game Hub v6.0 Server
 * 
 * 완벽한 게임별 독립 세션 시스템
 * - Express + Socket.IO 기반
 * - 실시간 센서 데이터 처리
 * - 자동 세션 관리 및 정리
 */

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');

const SessionManager = require('./SessionManager');
const GameScanner = require('./GameScanner');
const AIAssistant = require('./AIAssistant');
const DocumentEmbedder = require('./DocumentEmbedder');
const AIGameGenerator = require('./AIGameGenerator');
const InteractiveGameGenerator = require('./InteractiveGameGenerator');

class GameServer {
    constructor() {
        this.app = express();
        this.server = http.createServer(this.app);
        this.io = socketIo(this.server, {
            cors: {
                origin: "*",
                methods: ["GET", "POST"]
            },
            transports: ['websocket', 'polling']
        });
        
        this.sessionManager = new SessionManager();
        this.gameScanner = new GameScanner();
        this.aiAssistant = null; // 지연 초기화
        this.documentEmbedder = null; // 지연 초기화
        this.aiGameGenerator = null; // 지연 초기화
        this.interactiveGameGenerator = null; // 지연 초기화
        this.port = process.env.PORT || 3000;
        
        this.setupMiddleware();
        this.setupRoutes();
        this.setupSocketHandlers();
        
        // 게임 스캔 초기화
        this.initializeGames();
        
        // AI Assistant 초기화 (비동기)
        this.initializeAI();
        
        console.log('🚀 GameServer v6.0 초기화 완료');
    }
    
    /**
     * 미들웨어 설정
     */
    setupMiddleware() {
        // 보안 및 성능 미들웨어
        this.app.use(helmet({
            contentSecurityPolicy: false, // 개발 편의상 비활성화
            crossOriginEmbedderPolicy: false
        }));
        this.app.use(compression());
        this.app.use(cors());
        this.app.use(express.json());
        
        // 정적 파일 서빙
        this.app.use(express.static(path.join(__dirname, '../public')));
        
        // 요청 로깅
        this.app.use((req, res, next) => {
            console.log(`📝 ${req.method} ${req.path} - ${req.ip}`);
            next();
        });
    }
    
    /**
     * HTTP 라우트 설정
     */
    setupRoutes() {
        // 기본 루트 - 동적 게임 허브 페이지
        this.app.get('/', (req, res) => {
            const games = this.gameScanner.getActiveGames();
            res.send(this.generateHomePage(games));
        });
        
        // AI Assistant 페이지
        this.app.get('/ai-assistant', (req, res) => {
            res.send(this.generateAIAssistantPage());
        });
        
        // AI 게임 생성기 페이지 (기존)
        this.app.get('/ai-game-generator', (req, res) => {
            res.sendFile(path.join(__dirname, '../public/ai-game-generator.html'));
        });
        
        // 대화형 게임 생성기 페이지 (새로운 기본)
        this.app.get('/interactive-game-generator', (req, res) => {
            res.sendFile(path.join(__dirname, '../public/interactive-game-generator.html'));
        });
        
        // 개발자 가이드 페이지
        this.app.get('/developer-guide', (req, res) => {
            res.send(this.generateDeveloperGuidePage());
        });
        
        // 게임 목록 API
        this.app.get('/api/games', (req, res) => {
            const games = this.gameScanner.getActiveGames();
            res.json({
                success: true,
                data: games,
                stats: this.gameScanner.getStats()
            });
        });
        
        // 특정 게임 정보 API  
        this.app.get('/api/games/:gameId', (req, res) => {
            const game = this.gameScanner.getGame(req.params.gameId);
            if (!game) {
                return res.status(404).json({
                    success: false,
                    error: '게임을 찾을 수 없습니다.'
                });
            }
            res.json({
                success: true,
                data: game
            });
        });
        
        // 게임 재스캔 API (개발용)
        this.app.post('/api/admin/rescan', async (req, res) => {
            try {
                await this.gameScanner.scanGames();
                res.json({
                    success: true,
                    message: '게임 재스캔 완료',
                    stats: this.gameScanner.getStats()
                });
            } catch (error) {
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });
        
        // 기존 정적 홈페이지 (백업용)
        this.app.get('/static', (req, res) => {
            res.send(`
                <!DOCTYPE html>
                <html lang="ko">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>🚀 Sensor Game Hub v6.0</title>
                    <style>
                        body {
                            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                            background: linear-gradient(135deg, #0f172a, #1e293b);
                            color: #f8fafc;
                            margin: 0;
                            padding: 2rem;
                            min-height: 100vh;
                            display: flex;
                            flex-direction: column;
                            align-items: center;
                            justify-content: center;
                        }
                        .container {
                            max-width: 800px;
                            text-align: center;
                        }
                        h1 {
                            font-size: 3rem;
                            margin-bottom: 1rem;
                            background: linear-gradient(135deg, #3b82f6, #8b5cf6);
                            -webkit-background-clip: text;
                            -webkit-text-fill-color: transparent;
                            background-clip: text;
                        }
                        .subtitle {
                            font-size: 1.2rem;
                            color: #cbd5e1;
                            margin-bottom: 3rem;
                        }
                        .games-grid {
                            display: grid;
                            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                            gap: 2rem;
                            margin-bottom: 3rem;
                        }
                        .game-card {
                            background: rgba(30, 41, 59, 0.8);
                            border: 1px solid #475569;
                            border-radius: 1rem;
                            padding: 2rem;
                            text-decoration: none;
                            color: inherit;
                            transition: all 0.3s ease;
                            backdrop-filter: blur(12px);
                        }
                        .game-card:hover {
                            transform: translateY(-8px);
                            border-color: #3b82f6;
                            box-shadow: 0 10px 25px rgba(59, 130, 246, 0.3);
                        }
                        .game-icon {
                            font-size: 3rem;
                            margin-bottom: 1rem;
                        }
                        .game-title {
                            font-size: 1.5rem;
                            font-weight: 600;
                            margin-bottom: 0.5rem;
                        }
                        .game-desc {
                            color: #94a3b8;
                            font-size: 0.9rem;
                            line-height: 1.5;
                        }
                        .sensor-link {
                            background: linear-gradient(135deg, #8b5cf6, #3b82f6);
                            color: white;
                            padding: 1rem 2rem;
                            border-radius: 0.5rem;
                            text-decoration: none;
                            font-weight: 600;
                            display: inline-block;
                            margin-top: 2rem;
                            transition: transform 0.3s ease;
                        }
                        .sensor-link:hover {
                            transform: translateY(-2px);
                        }
                        .info {
                            margin-top: 3rem;
                            padding: 2rem;
                            background: rgba(59, 130, 246, 0.1);
                            border: 1px solid rgba(59, 130, 246, 0.2);
                            border-radius: 1rem;
                        }
                        .info h3 {
                            color: #3b82f6;
                            margin-bottom: 1rem;
                        }
                        .info p {
                            color: #cbd5e1;
                            margin-bottom: 0.5rem;
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <h1>🚀 Sensor Game Hub v6.0</h1>
                        <p class="subtitle">모바일 센서로 즐기는 혁신적인 게임 경험</p>
                        
                        <div class="games-grid">
                            <a href="/games/solo" class="game-card">
                                <div class="game-icon">🎯</div>
                                <div class="game-title">Solo Game</div>
                                <div class="game-desc">1개 센서로 플레이하는 공 조작 게임<br>목표 수집 및 콤보 시스템</div>
                            </a>
                            
                            <a href="/games/dual" class="game-card">
                                <div class="game-icon">🎮</div>
                                <div class="game-title">Dual Game</div>
                                <div class="game-desc">2개 센서로 협력하는 미션 게임<br>공동 목표 달성 시스템</div>
                            </a>
                            
                            <a href="/games/multi" class="game-card">
                                <div class="game-icon">👥</div>
                                <div class="game-title">Multi Game</div>
                                <div class="game-desc">최대 8명 실시간 경쟁<br>리더보드 및 타이머 시스템</div>
                            </a>
                        </div>
                        
                        <a href="/sensor.html" class="sensor-link">📱 모바일 센서 클라이언트</a>
                        
                        <div class="info">
                            <h3>🎮 게임 방법</h3>
                            <p>1. PC에서 원하는 게임 선택</p>
                            <p>2. 화면에 표시되는 4자리 세션 코드 확인</p>
                            <p>3. 모바일에서 센서 클라이언트 접속 후 코드 입력</p>
                            <p>4. 센서 권한 허용 후 자동으로 게임 시작!</p>
                        </div>
                    </div>
                </body>
                </html>
            `);
        });
        
        // 게임 라우트 (동적)
        this.app.get('/games/:gameId', (req, res) => {
            const { gameId } = req.params;
            const game = this.gameScanner.getGame(gameId);
            
            if (!game || game.status !== 'active') {
                return res.status(404).send(`
                    <h1>🎮 게임을 찾을 수 없습니다</h1>
                    <p>요청하신 게임 "${gameId}"을(를) 찾을 수 없습니다.</p>
                    <p><a href="/">게임 허브로 돌아가기</a></p>
                `);
            }
            
            try {
                res.sendFile(path.join(__dirname, `../public/games/${gameId}/index.html`));
            } catch (error) {
                res.status(500).send(`
                    <h1>🚨 게임 로드 오류</h1>
                    <p>게임을 불러오는 중 오류가 발생했습니다.</p>
                    <p><a href="/">게임 허브로 돌아가기</a></p>
                `);
            }
        });
        
        // API 라우트
        this.app.get('/api/stats', (req, res) => {
            try {
                const stats = this.sessionManager.getStats();
                res.json({
                    success: true,
                    data: stats,
                    timestamp: Date.now()
                });
            } catch (error) {
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });
        
        // 세션 정보 조회
        this.app.get('/api/session/:code', (req, res) => {
            try {
                const { code } = req.params;
                const session = this.sessionManager.findSessionByCode(code);
                
                if (!session) {
                    return res.status(404).json({
                        success: false,
                        error: '세션을 찾을 수 없습니다.'
                    });
                }
                
                res.json({
                    success: true,
                    data: {
                        sessionId: session.id,
                        gameType: session.gameType,
                        state: session.state,
                        connectedSensors: session.sensors.size,
                        maxSensors: session.maxSensors
                    }
                });
            } catch (error) {
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });
        
        // AI Assistant API 라우트
        this.app.post('/api/ai/query', async (req, res) => {
            try {
                if (!this.aiAssistant) {
                    return res.status(503).json({
                        success: false,
                        error: 'AI Assistant가 초기화되지 않았습니다. 환경변수를 확인해주세요.'
                    });
                }

                const { question } = req.body;
                
                if (!question || typeof question !== 'string' || question.trim() === '') {
                    return res.status(400).json({
                        success: false,
                        error: '유효한 질문이 제공되지 않았습니다.'
                    });
                }

                console.log(`🤔 AI 질문 요청: "${question}"`);
                
                // 헬스 체크 먼저 실행
                const healthCheck = await this.aiAssistant.healthCheck();
                if (!healthCheck.success) {
                    console.error('❌ AI Assistant 헬스 체크 실패:', healthCheck.error);
                    return res.status(503).json({
                        success: false,
                        error: 'AI 서비스가 현재 사용할 수 없습니다. 잠시 후 다시 시도해주세요.'
                    });
                }

                const result = await this.aiAssistant.query(question.trim());
                
                // 결과 검증
                if (!result || typeof result !== 'object') {
                    throw new Error('AI Assistant로부터 유효하지 않은 응답을 받았습니다.');
                }

                // 답변이 비어있는 경우 처리
                if (result.success && (!result.answer || result.answer.trim() === '')) {
                    result.answer = '죄송합니다. 해당 질문에 대한 적절한 답변을 생성하지 못했습니다. 다른 방식으로 질문해 주세요.';
                }
                
                res.json(result);

            } catch (error) {
                console.error('❌ AI 질문 처리 실패:', error);
                
                // 구체적인 오류 분류
                let errorMessage = '죄송합니다. 처리 중 오류가 발생했습니다.';
                let statusCode = 500;
                
                if (error.message.includes('documents')) {
                    errorMessage = '문서 검색 중 오류가 발생했습니다. 관리자에게 문의하세요.';
                } else if (error.message.includes('embedding')) {
                    errorMessage = '텍스트 분석 중 오류가 발생했습니다. 다시 시도해 주세요.';
                } else if (error.message.includes('network') || error.message.includes('timeout')) {
                    errorMessage = '네트워크 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.';
                    statusCode = 503;
                } else if (error.message.includes('API key')) {
                    errorMessage = 'AI 서비스 인증 오류입니다. 관리자에게 문의하세요.';
                    statusCode = 503;
                }
                
                res.status(statusCode).json({
                    success: false,
                    error: errorMessage,
                    details: process.env.NODE_ENV === 'development' ? error.message : undefined
                });
            }
        });

        this.app.post('/api/ai/generate-code', async (req, res) => {
            try {
                if (!this.aiAssistant) {
                    return res.status(503).json({
                        success: false,
                        error: 'AI Assistant가 초기화되지 않았습니다.'
                    });
                }

                const { request } = req.body;
                
                if (!request) {
                    return res.status(400).json({
                        success: false,
                        error: '코드 생성 요청이 제공되지 않았습니다.'
                    });
                }

                console.log(`💻 코드 생성 요청: "${request}"`);
                const result = await this.aiAssistant.generateCode(request);
                
                res.json(result);

            } catch (error) {
                console.error('❌ 코드 생성 실패:', error);
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });

        this.app.post('/api/ai/debug-help', async (req, res) => {
            try {
                if (!this.aiAssistant) {
                    return res.status(503).json({
                        success: false,
                        error: 'AI Assistant가 초기화되지 않았습니다.'
                    });
                }

                const { errorDescription, codeSnippet } = req.body;
                
                if (!errorDescription) {
                    return res.status(400).json({
                        success: false,
                        error: '오류 설명이 제공되지 않았습니다.'
                    });
                }

                console.log(`🐛 디버깅 도움 요청: "${errorDescription}"`);
                const result = await this.aiAssistant.debugHelp(errorDescription, codeSnippet);
                
                res.json(result);

            } catch (error) {
                console.error('❌ 디버깅 도움 실패:', error);
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });

        this.app.get('/api/ai/health', async (req, res) => {
            try {
                if (!this.aiAssistant) {
                    return res.json({
                        success: false,
                        status: 'not_initialized',
                        message: 'AI Assistant가 초기화되지 않았습니다.'
                    });
                }

                const healthStatus = await this.aiAssistant.healthCheck();
                res.json(healthStatus);

            } catch (error) {
                console.error('❌ AI 헬스체크 실패:', error);
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });

        this.app.post('/api/ai/embed-documents', async (req, res) => {
            try {
                if (!this.documentEmbedder) {
                    return res.status(503).json({
                        success: false,
                        error: 'Document Embedder가 초기화되지 않았습니다.'
                    });
                }

                console.log('📚 문서 임베딩 시작...');
                const result = await this.documentEmbedder.embedAllDocuments();
                
                res.json(result);

            } catch (error) {
                console.error('❌ 문서 임베딩 실패:', error);
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });

        // AI 게임 생성 API 라우트
        this.app.post('/api/ai/generate-game', async (req, res) => {
            try {
                if (!this.aiGameGenerator) {
                    return res.status(503).json({
                        success: false,
                        error: 'AI 게임 생성기가 초기화되지 않았습니다. 환경변수를 확인해주세요.'
                    });
                }

                const { userInput, options } = req.body;
                
                if (!userInput) {
                    return res.status(400).json({
                        success: false,
                        error: '게임 생성 요청이 제공되지 않았습니다.'
                    });
                }

                console.log(`🎮 AI 게임 생성 요청: "${userInput}"`);
                const result = await this.aiGameGenerator.generateGame(userInput, options || {});
                
                res.json(result);

            } catch (error) {
                console.error('❌ AI 게임 생성 실패:', error);
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });

        this.app.post('/api/ai/suggest-ideas', async (req, res) => {
            try {
                if (!this.aiGameGenerator) {
                    return res.status(503).json({
                        success: false,
                        error: 'AI 게임 생성기가 초기화되지 않았습니다.'
                    });
                }

                const { category, count } = req.body;
                
                console.log(`💡 게임 아이디어 제안 요청: 카테고리=${category || 'all'}, 개수=${count || 5}`);
                const result = await this.aiGameGenerator.suggestGameIdeas(category, count);
                
                res.json(result);

            } catch (error) {
                console.error('❌ 게임 아이디어 제안 실패:', error);
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });

        this.app.get('/api/ai/generation-history', async (req, res) => {
            try {
                if (!this.aiGameGenerator) {
                    return res.status(503).json({
                        success: false,
                        error: 'AI 게임 생성기가 초기화되지 않았습니다.'
                    });
                }

                const limit = parseInt(req.query.limit) || 10;
                const result = this.aiGameGenerator.getGenerationHistory(limit);
                
                res.json(result);

            } catch (error) {
                console.error('❌ 생성 이력 조회 실패:', error);
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });

        this.app.post('/api/ai/regenerate-game', async (req, res) => {
            try {
                if (!this.aiGameGenerator) {
                    return res.status(503).json({
                        success: false,
                        error: 'AI 게임 생성기가 초기화되지 않았습니다.'
                    });
                }

                const { generationId, modifications } = req.body;
                
                if (!generationId) {
                    return res.status(400).json({
                        success: false,
                        error: '재생성할 게임 ID가 제공되지 않았습니다.'
                    });
                }

                console.log(`🔄 AI 게임 재생성 요청: ${generationId}`);
                const result = await this.aiGameGenerator.regenerateGame(generationId, modifications || {});
                
                res.json(result);

            } catch (error) {
                console.error('❌ AI 게임 재생성 실패:', error);
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });

        this.app.get('/api/ai/generator-status', async (req, res) => {
            try {
                if (!this.aiGameGenerator) {
                    return res.json({
                        success: false,
                        status: 'not_initialized',
                        message: 'AI 게임 생성기가 초기화되지 않았습니다.'
                    });
                }

                const status = await this.aiGameGenerator.getStatus();
                res.json(status);

            } catch (error) {
                console.error('❌ 생성기 상태 확인 실패:', error);
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });

        // 게임 폴더 다운로드 API
        this.app.post('/api/ai/download-game', async (req, res) => {
            try {
                const { generationId } = req.body;
                
                if (!generationId) {
                    return res.status(400).json({
                        success: false,
                        error: '생성 ID가 제공되지 않았습니다.'
                    });
                }

                if (!this.aiGameGenerator) {
                    return res.status(503).json({
                        success: false,
                        error: 'AI 게임 생성기가 초기화되지 않았습니다.'
                    });
                }

                // 생성 이력에서 게임 데이터 찾기
                const history = this.aiGameGenerator.getGenerationHistory(100);
                const gameData = history.history.find(h => h.id === generationId);
                
                if (!gameData || !gameData.result.success) {
                    return res.status(404).json({
                        success: false,
                        error: '게임 데이터를 찾을 수 없습니다.'
                    });
                }

                const archiver = require('archiver');
                const archive = archiver('zip', { zlib: { level: 9 } });
                
                res.attachment(`${gameData.result.gameSpec.suggestedGameId}.zip`);
                archive.pipe(res);

                // 게임 메인 파일
                archive.append(gameData.result.gameCode, { name: 'index.html' });

                // 게임 메타데이터 파일
                if (gameData.result.gameMetadata) {
                    archive.append(JSON.stringify(gameData.result.gameMetadata, null, 2), { name: 'game.json' });
                }

                // README 파일
                const readmeContent = `# ${gameData.result.gameSpec.suggestedTitle}

${gameData.result.gameSpec.objective}

## 게임 정보
- **ID**: ${gameData.result.gameSpec.suggestedGameId}  
- **타입**: ${gameData.result.gameSpec.gameType}
- **장르**: ${gameData.result.gameSpec.genre}
- **센서**: ${gameData.result.gameSpec.sensorMechanics.join(', ')}
- **난이도**: ${gameData.result.gameSpec.difficulty}

## 게임 규칙
${gameData.result.gameSpec.rules.map(rule => `- ${rule}`).join('\n')}

## 실행 방법
1. index.html 파일을 웹 서버에서 실행
2. 모바일에서 Sensor Game Hub 센서 클라이언트 접속
3. 게임에서 생성된 4자리 세션 코드 입력
4. 게임 시작!

## 원본 요청
"${gameData.result.metadata.originalInput}"

---
🤖 AI로 생성된 게임입니다.
생성 시간: ${new Date(gameData.result.metadata.timestamp).toLocaleString()}
`;
                archive.append(readmeContent, { name: 'README.md' });

                archive.finalize();

            } catch (error) {
                console.error('❌ 게임 다운로드 실패:', error);
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });

        this.app.get('/api/ai/knowledge-status', async (req, res) => {
            try {
                if (!this.aiAssistant) {
                    return res.status(503).json({
                        success: false,
                        error: 'AI Assistant가 초기화되지 않았습니다.'
                    });
                }

                const status = await this.aiAssistant.getKnowledgeBaseStatus();
                res.json(status);

            } catch (error) {
                console.error('❌ 지식베이스 상태 조회 실패:', error);
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });

        // 대화형 게임 생성기 API 라우트
        this.app.post('/api/ai/interactive/start-session', async (req, res) => {
            try {
                if (!this.interactiveGameGenerator) {
                    return res.status(503).json({
                        success: false,
                        error: '대화형 게임 생성기가 초기화되지 않았습니다. 환경변수를 확인해주세요.'
                    });
                }

                const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                const result = await this.interactiveGameGenerator.startNewSession(sessionId);
                
                res.json(result);

            } catch (error) {
                console.error('대화형 세션 시작 실패:', error);
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });

        this.app.post('/api/ai/interactive/message', async (req, res) => {
            try {
                if (!this.interactiveGameGenerator) {
                    return res.status(503).json({
                        success: false,
                        error: '대화형 게임 생성기가 초기화되지 않았습니다.'
                    });
                }

                const { sessionId, message } = req.body;
                
                if (!sessionId || !message) {
                    return res.status(400).json({
                        success: false,
                        error: 'sessionId와 message가 필요합니다.'
                    });
                }

                const result = await this.interactiveGameGenerator.processUserMessage(sessionId, message);
                res.json(result);

            } catch (error) {
                console.error('대화형 메시지 처리 실패:', error);
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });

        this.app.post('/api/ai/interactive/generate', async (req, res) => {
            try {
                if (!this.interactiveGameGenerator) {
                    return res.status(503).json({
                        success: false,
                        error: '대화형 게임 생성기가 초기화되지 않았습니다.'
                    });
                }

                const { sessionId } = req.body;
                
                if (!sessionId) {
                    return res.status(400).json({
                        success: false,
                        error: 'sessionId가 필요합니다.'
                    });
                }

                const result = await this.interactiveGameGenerator.generateFinalGame(sessionId);
                
                // 게임이 성공적으로 생성되고 저장되었다면 게임 스캐너 재실행
                if (result.success && result.gamePath) {
                    console.log('🔄 새로운 게임 생성 완료 - 게임 스캐너 재실행 중...');
                    try {
                        // 게임 스캐너 재실행
                        await this.rescanGames();
                        console.log('✅ 게임 스캐너 재실행 완료 - 새 게임이 등록되었습니다.');
                        
                        // 결과에 등록 성공 정보 추가
                        result.gameRegistered = true;
                        result.message = '게임이 성공적으로 생성되고 등록되었습니다! 이제 게임 허브에서 플레이할 수 있습니다.';
                        
                    } catch (scanError) {
                        console.error('⚠️ 게임 스캐너 재실행 실패:', scanError);
                        result.gameRegistered = false;
                        result.warning = '게임이 생성되었지만 자동 등록에 실패했습니다. 수동으로 새로고침해 주세요.';
                    }
                }
                
                res.json(result);

            } catch (error) {
                console.error('대화형 게임 생성 실패:', error);
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });

        this.app.get('/api/ai/interactive/session/:sessionId', async (req, res) => {
            try {
                if (!this.interactiveGameGenerator) {
                    return res.status(503).json({
                        success: false,
                        error: '대화형 게임 생성기가 초기화되지 않았습니다.'
                    });
                }

                const { sessionId } = req.params;
                const session = this.interactiveGameGenerator.getSession(sessionId);
                
                if (!session) {
                    return res.status(404).json({
                        success: false,
                        error: '세션을 찾을 수 없습니다.'
                    });
                }

                res.json({
                    success: true,
                    session: {
                        id: session.id,
                        stage: session.stage,
                        progress: this.interactiveGameGenerator.getStageProgress(session.stage),
                        requirements: session.gameRequirements,
                        conversationHistory: session.conversationHistory,
                        createdAt: session.createdAt,
                        lastUpdated: session.lastUpdated
                    }
                });

            } catch (error) {
                console.error('세션 조회 실패:', error);
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });

        this.app.delete('/api/ai/interactive/session/:sessionId', async (req, res) => {
            try {
                if (!this.interactiveGameGenerator) {
                    return res.status(503).json({
                        success: false,
                        error: '대화형 게임 생성기가 초기화되지 않았습니다.'
                    });
                }

                const { sessionId } = req.params;
                const deleted = this.interactiveGameGenerator.cleanupSession(sessionId);
                
                res.json({
                    success: true,
                    deleted: deleted,
                    message: deleted ? '세션이 삭제되었습니다.' : '세션을 찾을 수 없습니다.'
                });

            } catch (error) {
                console.error('세션 삭제 실패:', error);
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });

        this.app.get('/api/ai/interactive/health', async (req, res) => {
            try {
                if (!this.interactiveGameGenerator) {
                    return res.json({
                        success: false,
                        status: 'not_initialized',
                        error: '대화형 게임 생성기가 초기화되지 않았습니다.'
                    });
                }

                const result = await this.interactiveGameGenerator.healthCheck();
                res.json(result);

            } catch (error) {
                console.error('대화형 게임 생성기 상태 확인 실패:', error);
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });
        
        // 404 핸들러
        this.app.use((req, res) => {
            res.status(404).send(`
                <h1>404 - 페이지를 찾을 수 없습니다</h1>
                <p><a href="/">홈으로 돌아가기</a></p>
            `);
        });
    }
    
    /**
     * 게임 스캔 초기화
     */
    async initializeGames() {
        try {
            await this.gameScanner.scanGames();
            console.log('✅ 게임 스캔 완료');
        } catch (error) {
            console.error('❌ 게임 스캔 실패:', error.message);
        }
    }
    
    /**
     * AI Assistant 초기화
     */
    async initializeAI() {
        try {
            console.log('🤖 AI Assistant 초기화 중...');
            
            // Interactive Game Generator는 항상 초기화 (더미 모드 지원)
            this.interactiveGameGenerator = new InteractiveGameGenerator();
            await this.interactiveGameGenerator.initialize();
            
            // 환경변수 확인
            if (!process.env.CLAUDE_API_KEY || !process.env.OPENAI_API_KEY || 
                !process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
                console.log('⚠️ AI 관련 환경변수가 설정되지 않아 AI Assistant를 건너뜁니다.');
                console.log('✅ Interactive Game Generator는 데모 모드로 동작합니다.');
                return;
            }
            
            // AI Assistant 초기화
            this.aiAssistant = new AIAssistant();
            await this.aiAssistant.initialize();
            
            // Document Embedder 초기화
            this.documentEmbedder = new DocumentEmbedder();
            
            // AI Game Generator 초기화
            this.aiGameGenerator = new AIGameGenerator();
            await this.aiGameGenerator.initialize();
            
            // 자동 문서 임베딩 실행
            await this.autoEmbedDocuments();
            
            console.log('✅ AI Assistant 및 게임 생성기 초기화 완료');
            
        } catch (error) {
            console.error('❌ AI Assistant 초기화 실패:', error.message);
            // Interactive Game Generator는 유지 (더미 모드로 동작)
            this.aiAssistant = null;
            this.documentEmbedder = null;
            this.aiGameGenerator = null;
        }
    }
    
    /**
     * 자동 문서 임베딩 실행
     */
    async autoEmbedDocuments() {
        try {
            if (!this.documentEmbedder) {
                console.log('⚠️ DocumentEmbedder가 초기화되지 않아 임베딩을 건너뜁니다.');
                return;
            }

            console.log('🔍 기존 임베딩 데이터 확인 중...');
            
            // 기존 데이터 확인
            const stats = await this.documentEmbedder.getEmbeddingStats();
            
            if (stats && stats.total > 0) {
                console.log(`📊 기존 임베딩 데이터 발견: ${stats.total}개 문서`);
                console.log('✅ 임베딩 건너뜀 (기존 데이터 사용)');
                return;
            }
            
            console.log('📚 새로운 문서 임베딩 시작...');
            const result = await this.documentEmbedder.embedAllDocuments();
            
            if (result.success) {
                console.log('✅ 자동 임베딩 완료!');
                console.log(`📊 총 ${result.stats.total}개 문서가 임베딩되었습니다.`);
            } else {
                console.log('⚠️ 임베딩 중 일부 오류 발생, 계속 진행합니다.');
            }
            
        } catch (error) {
            console.error('❌ 자동 임베딩 실패:', error.message);
            console.log('⚠️ 임베딩 실패했지만 서버는 계속 실행됩니다.');
        }
    }
    
    /**
     * 동적 홈페이지 생성
     */
    generateHomePage(games) {
        const gameCards = games.map(game => `
            <a href="${game.path}" class="game-card">
                <div class="game-icon">${game.icon}</div>
                <div class="game-title">${game.title}</div>
                <div class="game-desc">${game.description}</div>
                ${game.featured ? '<div class="featured-badge">⭐ 추천</div>' : ''}
                ${game.experimental ? '<div class="experimental-badge">🧪 실험적</div>' : ''}
            </a>
        `).join('');
        
        const stats = this.gameScanner.getStats();
        
        return `
            <!DOCTYPE html>
            <html lang="ko">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>🚀 Sensor Game Hub v6.0</title>
                <style>
                    body {
                        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                        background: linear-gradient(135deg, #0f172a, #1e293b);
                        color: #f8fafc;
                        margin: 0;
                        padding: 2rem;
                        min-height: 100vh;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                    }
                    .container {
                        max-width: 1200px;
                        text-align: center;
                    }
                    h1 {
                        font-size: 3rem;
                        margin-bottom: 1rem;
                        background: linear-gradient(135deg, #3b82f6, #8b5cf6);
                        -webkit-background-clip: text;
                        -webkit-text-fill-color: transparent;
                        background-clip: text;
                    }
                    .subtitle {
                        font-size: 1.2rem;
                        color: #cbd5e1;
                        margin-bottom: 1rem;
                    }
                    .stats {
                        font-size: 0.9rem;
                        color: #94a3b8;
                        margin-bottom: 3rem;
                    }
                    .games-grid {
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
                        gap: 2rem;
                        margin-bottom: 3rem;
                    }
                    .game-card {
                        background: rgba(30, 41, 59, 0.8);
                        border: 1px solid #475569;
                        border-radius: 1rem;
                        padding: 2rem;
                        text-decoration: none;
                        color: inherit;
                        transition: all 0.3s ease;
                        backdrop-filter: blur(12px);
                        position: relative;
                        overflow: hidden;
                    }
                    .game-card:hover {
                        transform: translateY(-8px);
                        border-color: #3b82f6;
                        box-shadow: 0 10px 25px rgba(59, 130, 246, 0.3);
                    }
                    .game-icon {
                        font-size: 3rem;
                        margin-bottom: 1rem;
                    }
                    .game-title {
                        font-size: 1.5rem;
                        font-weight: 600;
                        margin-bottom: 0.5rem;
                    }
                    .game-desc {
                        color: #94a3b8;
                        font-size: 0.9rem;
                        line-height: 1.5;
                    }
                    .featured-badge {
                        position: absolute;
                        top: 1rem;
                        right: 1rem;
                        background: linear-gradient(135deg, #f59e0b, #d97706);
                        color: white;
                        padding: 0.25rem 0.75rem;
                        border-radius: 1rem;
                        font-size: 0.7rem;
                        font-weight: 600;
                    }
                    .experimental-badge {
                        position: absolute;
                        top: 3rem;
                        right: 1rem;
                        background: linear-gradient(135deg, #8b5cf6, #7c3aed);
                        color: white;
                        padding: 0.25rem 0.75rem;
                        border-radius: 1rem;
                        font-size: 0.7rem;
                        font-weight: 600;
                    }
                    .sensor-link {
                        background: linear-gradient(135deg, #8b5cf6, #3b82f6);
                        color: white;
                        padding: 1rem 2rem;
                        border-radius: 0.5rem;
                        text-decoration: none;
                        font-weight: 600;
                        display: inline-block;
                        margin-top: 2rem;
                        transition: transform 0.3s ease;
                    }
                    .sensor-link:hover {
                        transform: translateY(-2px);
                    }
                    .info {
                        margin-top: 3rem;
                        padding: 2rem;
                        background: rgba(59, 130, 246, 0.1);
                        border: 1px solid rgba(59, 130, 246, 0.2);
                        border-radius: 1rem;
                    }
                    .info h3 {
                        color: #3b82f6;
                        margin-bottom: 1rem;
                    }
                    .info p {
                        color: #cbd5e1;
                        margin-bottom: 0.5rem;
                    }
                    .developer-info {
                        margin-top: 2rem;
                        padding: 1.5rem;
                        background: rgba(16, 185, 129, 0.1);
                        border: 1px solid rgba(16, 185, 129, 0.2);
                        border-radius: 1rem;
                        text-align: left;
                    }
                    .developer-info h4 {
                        color: #10b981;
                        margin-bottom: 1rem;
                    }
                    .api-link {
                        color: #10b981;
                        text-decoration: none;
                        font-family: monospace;
                        background: rgba(16, 185, 129, 0.1);
                        padding: 0.25rem 0.5rem;
                        border-radius: 0.25rem;
                        margin: 0 0.25rem;
                    }
                    .ai-chat-btn {
                        background: linear-gradient(135deg, #6366f1, #8b5cf6);
                        color: white;
                        padding: 0.75rem 1.5rem;
                        border-radius: 0.5rem;
                        text-decoration: none;
                        font-weight: 600;
                        display: inline-block;
                        margin: 1rem 0.5rem 0.5rem 0;
                        transition: all 0.3s ease;
                        border: none;
                        cursor: pointer;
                    }
                    .ai-chat-btn:hover {
                        transform: translateY(-2px);
                        box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
                    }
                    .developer-actions {
                        margin-top: 1.5rem;
                        padding-top: 1.5rem;
                        border-top: 1px solid rgba(16, 185, 129, 0.2);
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>🚀 Sensor Game Hub v6.0</h1>
                    <p class="subtitle">모바일 센서로 즐기는 혁신적인 게임 경험</p>
                    <p class="stats">
                        총 ${stats.total}개 게임 | 
                        솔로: ${stats.categories.solo || 0}개 | 
                        듀얼: ${stats.categories.dual || 0}개 | 
                        멀티: ${stats.categories.multi || 0}개
                        ${stats.experimental > 0 ? ` | 실험적: ${stats.experimental}개` : ''}
                    </p>
                    
                    <div class="games-grid">
                        ${gameCards}
                    </div>
                    
                    <a href="/sensor.html" class="sensor-link">📱 모바일 센서 클라이언트</a>
                    
                    <div class="info">
                        <h3>🎮 게임 방법</h3>
                        <p>1. PC에서 원하는 게임 선택</p>
                        <p>2. 화면에 표시되는 4자리 세션 코드 확인</p>
                        <p>3. 모바일에서 센서 클라이언트 접속 후 코드 입력</p>
                        <p>4. 센서 권한 허용 후 자동으로 게임 시작!</p>
                    </div>
                    
                    <div class="developer-info">
                        <h4>🛠️ 개발자 도구</h4>
                        <p><strong>게임 API:</strong> 
                            <a href="/api/games" class="api-link">/api/games</a>
                            <a href="/api/admin/rescan" class="api-link">/api/admin/rescan</a>
                        </p>
                        <p><strong>새 게임 추가:</strong> <code>games/</code> 폴더에 게임을 추가하고 <code>game.json</code> 파일을 생성하세요</p>
                        <p><strong>자동 스캔:</strong> 서버 재시작 시 자동으로 새 게임이 감지됩니다</p>
                        
                        <div class="developer-actions">
                            <h5 style="color: #6366f1; margin-bottom: 1rem;">🤖 AI 개발 도우미</h5>
                            <p style="margin-bottom: 1rem;">게임 개발 질문, 코드 생성, 디버깅 도움을 받아보세요!</p>
                            <a href="/interactive-game-generator" class="ai-chat-btn" style="background: linear-gradient(135deg, #f59e0b, #d97706);">🎯 대화형 게임 생성기</a>
                            <a href="/ai-assistant" class="ai-chat-btn">💬 AI 채팅 상담하기</a>
                            <a href="/developer-guide" class="ai-chat-btn" style="background: linear-gradient(135deg, #059669, #10b981);">📚 개발자 가이드</a>
                        </div>
                    </div>
                </div>
            </body>
            </html>
        `;
    }
    
    /**
     * AI Assistant 페이지 생성
     */
    generateAIAssistantPage() {
        return `
            <!DOCTYPE html>
            <html lang="ko">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>🤖 AI 개발 도우미 - Sensor Game Hub</title>
                <style>
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
                        background: var(--background);
                        color: var(--text-primary);
                        height: 100vh;
                        display: flex;
                        flex-direction: column;
                    }
                    
                    .header {
                        background: var(--surface);
                        border-bottom: 1px solid var(--border);
                        padding: 1rem 2rem;
                        display: flex;
                        justify-content: between;
                        align-items: center;
                    }
                    
                    .header h1 {
                        background: linear-gradient(135deg, var(--primary), var(--secondary));
                        -webkit-background-clip: text;
                        -webkit-text-fill-color: transparent;
                        background-clip: text;
                        font-size: 1.5rem;
                    }
                    
                    .nav-links {
                        display: flex;
                        gap: 1rem;
                    }
                    
                    .nav-link {
                        color: var(--text-secondary);
                        text-decoration: none;
                        padding: 0.5rem 1rem;
                        border-radius: 0.5rem;
                        transition: all 0.3s ease;
                    }
                    
                    .nav-link:hover {
                        background: rgba(59, 130, 246, 0.1);
                        color: var(--primary);
                    }
                    
                    .chat-container {
                        flex: 1;
                        display: flex;
                        flex-direction: column;
                        max-width: 1200px;
                        margin: 0 auto;
                        width: 100%;
                        padding: 2rem;
                    }
                    
                    .chat-messages {
                        flex: 1;
                        overflow-y: auto;
                        padding: 1rem;
                        background: var(--surface);
                        border-radius: 1rem;
                        margin-bottom: 1rem;
                        min-height: 500px;
                        max-height: 600px;
                    }
                    
                    .message {
                        margin-bottom: 1.5rem;
                        display: flex;
                        align-items: flex-start;
                        gap: 0.75rem;
                    }
                    
                    .message.user {
                        flex-direction: row-reverse;
                    }
                    
                    .message-avatar {
                        width: 40px;
                        height: 40px;
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 1.2rem;
                        flex-shrink: 0;
                    }
                    
                    .message.user .message-avatar {
                        background: linear-gradient(135deg, var(--primary), var(--secondary));
                    }
                    
                    .message.ai .message-avatar {
                        background: linear-gradient(135deg, var(--success), #059669);
                    }
                    
                    .message-content {
                        background: var(--card);
                        padding: 1rem;
                        border-radius: 1rem;
                        max-width: 70%;
                        word-wrap: break-word;
                    }
                    
                    .message.user .message-content {
                        background: linear-gradient(135deg, var(--primary), var(--secondary));
                    }
                    
                    .message pre {
                        background: rgba(0, 0, 0, 0.3);
                        padding: 1rem;
                        border-radius: 0.5rem;
                        overflow-x: auto;
                        margin: 0.5rem 0;
                        font-size: 0.9rem;
                    }
                    
                    .chat-input {
                        display: flex;
                        gap: 1rem;
                        align-items: flex-end;
                    }
                    
                    .input-group {
                        flex: 1;
                        display: flex;
                        flex-direction: column;
                        gap: 0.5rem;
                    }
                    
                    .quick-actions {
                        display: flex;
                        gap: 0.5rem;
                        flex-wrap: wrap;
                    }
                    
                    .quick-btn {
                        background: rgba(59, 130, 246, 0.1);
                        color: var(--primary);
                        border: 1px solid var(--primary);
                        padding: 0.25rem 0.75rem;
                        border-radius: 1rem;
                        font-size: 0.8rem;
                        cursor: pointer;
                        transition: all 0.3s ease;
                    }
                    
                    .quick-btn:hover {
                        background: var(--primary);
                        color: white;
                    }
                    
                    #messageInput {
                        background: var(--surface);
                        border: 1px solid var(--border);
                        border-radius: 0.75rem;
                        padding: 1rem;
                        color: var(--text-primary);
                        font-family: inherit;
                        resize: vertical;
                        min-height: 80px;
                        max-height: 200px;
                    }
                    
                    #messageInput:focus {
                        outline: none;
                        border-color: var(--primary);
                        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
                    }
                    
                    .send-btn {
                        background: linear-gradient(135deg, var(--primary), var(--secondary));
                        color: white;
                        border: none;
                        padding: 1rem 2rem;
                        border-radius: 0.75rem;
                        font-weight: 600;
                        cursor: pointer;
                        transition: all 0.3s ease;
                        height: fit-content;
                    }
                    
                    .send-btn:hover:not(:disabled) {
                        transform: translateY(-2px);
                        box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
                    }
                    
                    .send-btn:disabled {
                        opacity: 0.6;
                        cursor: not-allowed;
                    }
                    
                    .loading {
                        display: none;
                        color: var(--text-muted);
                        font-style: italic;
                        padding: 1rem;
                    }
                    
                    .welcome-message {
                        text-align: center;
                        padding: 2rem;
                        color: var(--text-muted);
                    }
                    
                    .welcome-message h2 {
                        color: var(--primary);
                        margin-bottom: 1rem;
                    }
                    
                    .status-indicator {
                        display: inline-block;
                        width: 8px;
                        height: 8px;
                        border-radius: 50%;
                        margin-right: 0.5rem;
                    }
                    
                    .status-online {
                        background: var(--success);
                    }
                    
                    .status-offline {
                        background: var(--error);
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>🤖 AI 개발 도우미</h1>
                    <div class="nav-links">
                        <span class="status-indicator" id="aiStatus"></span>
                        <span id="statusText">연결 확인 중...</span>
                        <a href="/developer-guide" class="nav-link">📚 개발자 가이드</a>
                        <a href="/" class="nav-link">🏠 홈으로</a>
                    </div>
                </div>
                
                <div class="chat-container">
                    <div class="chat-messages" id="chatMessages">
                        <div class="welcome-message">
                            <h2>👋 안녕하세요!</h2>
                            <p>Sensor Game Hub 개발을 도와드리는 AI 어시스턴트입니다.</p>
                            <p>게임 개발 질문, 코드 생성, 디버깅 도움 등 무엇이든 물어보세요!</p>
                        </div>
                    </div>
                    
                    <div class="loading" id="loadingIndicator">
                        🤖 AI가 답변을 생성하고 있습니다...
                    </div>
                    
                    <div class="chat-input">
                        <div class="input-group">
                            <div class="quick-actions">
                                <button class="quick-btn" onclick="insertQuickQuestion('새 게임을 만들고 싶어요')">🎮 새 게임 만들기</button>
                                <button class="quick-btn" onclick="insertQuickQuestion('센서 데이터 처리 방법을 알려주세요')">📱 센서 데이터</button>
                                <button class="quick-btn" onclick="insertQuickQuestion('SessionSDK 사용법을 알려주세요')">🔧 SDK 사용법</button>
                                <button class="quick-btn" onclick="insertQuickQuestion('디버깅 도움이 필요해요')">🐛 디버깅</button>
                            </div>
                            <textarea 
                                id="messageInput" 
                                placeholder="게임 개발에 대해 궁금한 것을 물어보세요..." 
                                onkeydown="handleKeyDown(event)"></textarea>
                        </div>
                        <button class="send-btn" id="sendBtn" onclick="sendMessage()">전송</button>
                    </div>
                </div>

                <script>
                    let chatHistory = JSON.parse(localStorage.getItem('aiChatHistory') || '[]');
                    
                    // 페이지 로드 시 초기화
                    document.addEventListener('DOMContentLoaded', function() {
                        checkAIStatus();
                        loadChatHistory();
                        checkURLParams();
                    });
                    
                    // AI 상태 확인
                    async function checkAIStatus() {
                        try {
                            const response = await fetch('/api/ai/health');
                            const result = await response.json();
                            
                            const statusIndicator = document.getElementById('aiStatus');
                            const statusText = document.getElementById('statusText');
                            
                            if (result.success && result.status === 'healthy') {
                                statusIndicator.className = 'status-indicator status-online';
                                statusText.textContent = 'AI 준비 완료';
                            } else {
                                statusIndicator.className = 'status-indicator status-offline';
                                statusText.textContent = 'AI 서비스 불가';
                            }
                        } catch (error) {
                            document.getElementById('aiStatus').className = 'status-indicator status-offline';
                            document.getElementById('statusText').textContent = 'AI 서비스 오류';
                        }
                    }
                    
                    // 채팅 기록 로드
                    function loadChatHistory() {
                        const messagesContainer = document.getElementById('chatMessages');
                        
                        if (chatHistory.length === 0) {
                            return; // Welcome message 유지
                        }
                        
                        messagesContainer.innerHTML = '';
                        
                        chatHistory.forEach(msg => {
                            addMessageToUI(msg.content, msg.type, false);
                        });
                        
                        scrollToBottom();
                    }
                    
                    // URL 파라미터 확인 및 자동 메시지 전송
                    function checkURLParams() {
                        const urlParams = new URLSearchParams(window.location.search);
                        const question = urlParams.get('q');
                        
                        if (question) {
                            // URL에서 질문 파라미터 제거 (뒤로가기 시 중복 전송 방지)
                            const newUrl = window.location.pathname;
                            window.history.replaceState({}, document.title, newUrl);
                            
                            // 입력창에 질문 설정하고 자동 전송
                            const input = document.getElementById('messageInput');
                            input.value = decodeURIComponent(question);
                            
                            // 잠시 후 자동 전송 (UI가 완전히 로드된 후)
                            setTimeout(() => {
                                sendMessage();
                            }, 500);
                        }
                    }
                    
                    // 채팅 기록 저장
                    function saveChatHistory() {
                        localStorage.setItem('aiChatHistory', JSON.stringify(chatHistory));
                    }
                    
                    // 빠른 질문 삽입
                    function insertQuickQuestion(question) {
                        document.getElementById('messageInput').value = question;
                        document.getElementById('messageInput').focus();
                    }
                    
                    // 키보드 이벤트 처리
                    function handleKeyDown(event) {
                        if (event.key === 'Enter' && !event.shiftKey) {
                            event.preventDefault();
                            sendMessage();
                        }
                    }
                    
                    // 메시지 전송
                    async function sendMessage() {
                        const input = document.getElementById('messageInput');
                        const message = input.value.trim();
                        
                        if (!message) return;
                        
                        // UI에 사용자 메시지 추가
                        addMessageToUI(message, 'user');
                        chatHistory.push({ content: message, type: 'user', timestamp: new Date().toISOString() });
                        
                        // 입력창 초기화 및 버튼 비활성화
                        input.value = '';
                        document.getElementById('sendBtn').disabled = true;
                        document.getElementById('loadingIndicator').style.display = 'block';
                        
                        try {
                            // AI API 호출
                            const response = await fetch('/api/ai/query', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({ question: message })
                            });
                            
                            const result = await response.json();
                            
                            if (result.success) {
                                addMessageToUI(result.answer, 'ai');
                                chatHistory.push({ content: result.answer, type: 'ai', timestamp: new Date().toISOString() });
                            } else {
                                addMessageToUI('죄송합니다. 오류가 발생했습니다: ' + result.error, 'ai');
                            }
                            
                        } catch (error) {
                            addMessageToUI('네트워크 오류가 발생했습니다. 다시 시도해주세요.', 'ai');
                        } finally {
                            document.getElementById('sendBtn').disabled = false;
                            document.getElementById('loadingIndicator').style.display = 'none';
                            saveChatHistory();
                        }
                    }
                    
                    // UI에 메시지 추가
                    function addMessageToUI(content, type, scroll = true) {
                        const messagesContainer = document.getElementById('chatMessages');
                        
                        // Welcome message 제거
                        const welcomeMsg = messagesContainer.querySelector('.welcome-message');
                        if (welcomeMsg) {
                            welcomeMsg.remove();
                        }
                        
                        const messageDiv = document.createElement('div');
                        messageDiv.className = \`message \${type}\`;
                        
                        const avatar = type === 'user' ? '👤' : '🤖';
                        
                        messageDiv.innerHTML = \`
                            <div class="message-avatar">\${avatar}</div>
                            <div class="message-content">\${formatMessage(content)}</div>
                        \`;
                        
                        messagesContainer.appendChild(messageDiv);
                        
                        if (scroll) {
                            scrollToBottom();
                        }
                    }
                    
                    // 메시지 포맷팅
                    function formatMessage(content) {
                        // 코드 블록 처리
                        content = content.replace(/\`\`\`([\\s\\S]*?)\`\`\`/g, '<pre><code>$1</code></pre>');
                        
                        // 인라인 코드 처리
                        content = content.replace(/\`(.+?)\`/g, '<code style="background: rgba(0,0,0,0.3); padding: 0.2rem 0.4rem; border-radius: 0.25rem;">$1</code>');
                        
                        // 줄바꿈 처리
                        content = content.replace(/\\n/g, '<br>');
                        
                        return content;
                    }
                    
                    // 스크롤을 아래로
                    function scrollToBottom() {
                        const messagesContainer = document.getElementById('chatMessages');
                        messagesContainer.scrollTop = messagesContainer.scrollHeight;
                    }
                    
                    // 채팅 기록 초기화
                    function clearHistory() {
                        if (confirm('채팅 기록을 모두 삭제하시겠습니까?')) {
                            chatHistory = [];
                            localStorage.removeItem('aiChatHistory');
                            location.reload();
                        }
                    }
                </script>
            </body>
            </html>
        `;
    }
    
    /**
     * 개발자 가이드 페이지 생성
     */
    generateDeveloperGuidePage() {
        return `
            <!DOCTYPE html>
            <html lang="ko">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>📚 개발자 가이드 - Sensor Game Hub</title>
                <style>
                    :root {
                        --primary: #3b82f6;
                        --secondary: #8b5cf6;
                        --success: #10b981;
                        --background: #0f172a;
                        --surface: #1e293b;
                        --text-primary: #f8fafc;
                        --text-secondary: #cbd5e1;
                        --border: #475569;
                    }
                    
                    * {
                        margin: 0;
                        padding: 0;
                        box-sizing: border-box;
                    }
                    
                    body {
                        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                        background: var(--background);
                        color: var(--text-primary);
                        line-height: 1.6;
                    }
                    
                    .header {
                        background: var(--surface);
                        border-bottom: 1px solid var(--border);
                        padding: 1rem 2rem;
                        position: sticky;
                        top: 0;
                        z-index: 100;
                    }
                    
                    .header h1 {
                        background: linear-gradient(135deg, var(--primary), var(--secondary));
                        -webkit-background-clip: text;
                        -webkit-text-fill-color: transparent;
                        background-clip: text;
                    }
                    
                    .nav-links {
                        margin-top: 1rem;
                        display: flex;
                        gap: 1rem;
                    }
                    
                    .nav-link {
                        color: var(--text-secondary);
                        text-decoration: none;
                        padding: 0.5rem 1rem;
                        border-radius: 0.5rem;
                        transition: all 0.3s ease;
                    }
                    
                    .nav-link:hover {
                        background: rgba(59, 130, 246, 0.1);
                        color: var(--primary);
                    }
                    
                    .container {
                        max-width: 1200px;
                        margin: 0 auto;
                        padding: 2rem;
                    }
                    
                    .guide-grid {
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                        gap: 2rem;
                        margin-top: 2rem;
                    }
                    
                    .guide-card {
                        background: var(--surface);
                        border: 1px solid var(--border);
                        border-radius: 1rem;
                        padding: 2rem;
                        transition: all 0.3s ease;
                    }
                    
                    .guide-card:hover {
                        transform: translateY(-8px);
                        border-color: var(--primary);
                        box-shadow: 0 10px 25px rgba(59, 130, 246, 0.3);
                    }
                    
                    .guide-card h3 {
                        color: var(--primary);
                        margin-bottom: 1rem;
                        font-size: 1.5rem;
                    }
                    
                    .guide-card p {
                        color: var(--text-secondary);
                        margin-bottom: 1.5rem;
                    }
                    
                    .guide-links {
                        display: flex;
                        flex-direction: column;
                        gap: 0.5rem;
                    }
                    
                    .guide-link {
                        color: var(--success);
                        text-decoration: none;
                        padding: 0.5rem;
                        border-radius: 0.5rem;
                        transition: all 0.3s ease;
                        display: flex;
                        align-items: center;
                        gap: 0.5rem;
                    }
                    
                    .guide-link:hover {
                        background: rgba(16, 185, 129, 0.1);
                    }
                    
                    .ai-promote {
                        background: linear-gradient(135deg, var(--primary), var(--secondary));
                        border-radius: 1rem;
                        padding: 2rem;
                        text-align: center;
                        margin: 2rem 0;
                    }
                    
                    .ai-promote h2 {
                        color: white;
                        margin-bottom: 1rem;
                    }
                    
                    .ai-promote p {
                        color: rgba(255, 255, 255, 0.9);
                        margin-bottom: 1.5rem;
                    }
                    
                    .ai-btn {
                        background: white;
                        color: var(--primary);
                        padding: 1rem 2rem;
                        border-radius: 0.75rem;
                        text-decoration: none;
                        font-weight: 600;
                        display: inline-block;
                        transition: all 0.3s ease;
                    }
                    
                    .ai-btn:hover {
                        transform: translateY(-2px);
                        box-shadow: 0 4px 12px rgba(255, 255, 255, 0.3);
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>📚 개발자 가이드</h1>
                    <div class="nav-links">
                        <a href="/ai-assistant" class="nav-link">🤖 AI 채팅</a>
                        <a href="/" class="nav-link">🏠 홈으로</a>
                    </div>
                </div>
                
                <div class="container">
                    <div class="ai-promote">
                        <h2>🎯 새로운 대화형 게임 생성기!</h2>
                        <p>AI와 대화하며 완벽한 센서 게임을 만들어보세요. 단계별 대화를 통해 정확하고 실행 가능한 게임을 생성합니다.</p>
                        <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap; margin-top: 1rem;">
                            <a href="/interactive-game-generator" class="ai-btn">🎮 대화형 게임 생성기</a>
                            <a href="/ai-assistant" class="ai-btn" style="background: rgba(255,255,255,0.2);">💬 AI 채팅 도우미</a>
                        </div>
                    </div>
                    
                    <div class="guide-grid">
                        <div class="guide-card">
                            <h3>🚀 빠른 시작</h3>
                            <p>Sensor Game Hub에서 첫 게임을 만들어보세요.</p>
                            <div class="guide-links">
                                <a href="#" class="guide-link" onclick="openAIChat('📋 게임 템플릿 사용법에 대해서 알려주세요. GAME_TEMPLATE.html을 사용해서 새 게임을 만드는 과정을 단계별로 설명해주세요.')">📋 게임 템플릿 사용법</a>
                                <a href="#" class="guide-link" onclick="openAIChat('🔧 SessionSDK 기본 사용법을 알려주세요. 세션 생성, 센서 연결, 이벤트 처리 방법을 예제 코드와 함께 설명해주세요.')">🔧 SessionSDK 기본 사용법</a>
                                <a href="#" class="guide-link" onclick="openAIChat('📱 센서 데이터 처리법을 알려주세요. orientation, acceleration, rotationRate 데이터를 게임에서 어떻게 활용하는지 실제 예제로 보여주세요.')">📱 센서 데이터 처리법</a>
                            </div>
                        </div>
                        
                        <div class="guide-card">
                            <h3>🎮 게임 타입</h3>
                            <p>다양한 게임 타입과 특징을 알아보세요.</p>
                            <div class="guide-links">
                                <a href="#" class="guide-link" onclick="openAIChat('🎯 솔로 게임 (1명) 개발 방법을 알려주세요. gameType: solo로 설정하고, 1개 센서로 플레이하는 게임의 특징과 구현 방법을 예제와 함께 설명해주세요.')">🎯 솔로 게임 (1명)</a>
                                <a href="#" class="guide-link" onclick="openAIChat('🤝 듀얼 게임 (2명 협력) 개발 방법을 알려주세요. gameType: dual로 설정하고, 2개 센서가 협력하는 게임 로직과 센서 식별 방법을 구체적으로 알려주세요.')">🤝 듀얼 게임 (2명 협력)</a>
                                <a href="#" class="guide-link" onclick="openAIChat('👥 멀티 게임 (3-8명 경쟁) 개발 방법을 알려주세요. gameType: multi로 설정하고, 여러 플레이어 간 경쟁 시스템과 실시간 순위 업데이트 방법을 예제로 보여주세요.')">👥 멀티 게임 (3-8명 경쟁)</a>
                            </div>
                        </div>
                        
                        <div class="guide-card">
                            <h3>📱 센서 활용</h3>
                            <p>모바일 센서를 게임에 효과적으로 활용하는 방법입니다.</p>
                            <div class="guide-links">
                                <a href="#" class="guide-link" onclick="openAIChat('📐 기울기 센서 (orientation) 사용법을 알려주세요. alpha, beta, gamma 값의 의미와 범위, 게임에서 기울기를 이용한 캐릭터 이동과 조작 방법을 실제 코드로 보여주세요.')">📐 기울기 센서 (orientation)</a>
                                <a href="#" class="guide-link" onclick="openAIChat('🏃 가속도 센서 (acceleration) 사용법을 알려주세요. x, y, z 축 가속도 데이터를 이용한 흔들기, 터치, 점프 동작 감지 방법과 실제 구현 예제를 보여주세요.')">🏃 가속도 센서 (acceleration)</a>
                                <a href="#" class="guide-link" onclick="openAIChat('🔄 회전 속도 (rotationRate) 사용법을 알려주세요. alpha, beta, gamma 회전 속도를 이용한 스핀, 회전 동작 감지와 게임에서의 활용 방법을 예제로 설명해주세요.')">🔄 회전 속도 (rotationRate)</a>
                            </div>
                        </div>
                        
                        <div class="guide-card">
                            <h3>🐛 문제 해결</h3>
                            <p>일반적인 개발 이슈와 해결 방법입니다.</p>
                            <div class="guide-links">
                                <a href="#" class="guide-link" onclick="openAIChat('🔌 연결 오류 해결 방법을 알려주세요. \"서버에 연결되지 않았습니다\" 오류가 발생했을 때 체크해야 할 사항들과 해결 방법을 단계별로 설명해주세요.')">🔌 연결 오류 해결</a>
                                <a href="#" class="guide-link" onclick="openAIChat('❓ undefined 오류 해결 방법을 알려주세요. 세션 코드나 센서 데이터가 undefined로 나오는 문제의 원인과 해결책을 CustomEvent 처리 패턴과 함께 설명해주세요.')">❓ undefined 오류</a>
                                <a href="#" class="guide-link" onclick="openAIChat('📡 센서 데이터 문제 해결 방법을 알려주세요. 센서 데이터가 오지 않거나 부정확할 때의 원인 진단과 해결 방법, 센서 권한 설정을 알려주세요.')">📡 센서 데이터 문제</a>
                            </div>
                        </div>
                        
                        <div class="guide-card">
                            <h3>🎨 UI/UX 디자인</h3>
                            <p>게임 인터페이스를 멋지게 꾸미는 방법입니다.</p>
                            <div class="guide-links">
                                <a href="#" class="guide-link" onclick="openAIChat('🎨 UI 디자인 가이드를 알려주세요. 게임 인터페이스 설계 원칙, 사용자 친화적인 버튼과 아이콘 배치, 시각적 피드백 구현 방법을 실제 예제로 보여주세요.')">🎨 UI 디자인 가이드</a>
                                <a href="#" class="guide-link" onclick="openAIChat('🌈 테마 변수 활용 방법을 알려주세요. --primary, --secondary, --success 등 CSS 커스텀 속성을 활용한 일관된 디자인 시스템 구축과 다크/라이트 테마 구현을 설명해주세요.')">🌈 테마 변수 활용</a>
                                <a href="#" class="guide-link" onclick="openAIChat('📱 반응형 디자인 구현 방법을 알려주세요. 다양한 모바일 화면 크기에 대응하는 게임 UI 설계와 미디어 쿼리, Flexbox/Grid 활용법을 예제로 보여주세요.')">📱 반응형 디자인</a>
                            </div>
                        </div>
                        
                        <div class="guide-card">
                            <h3>⚡ 성능 최적화</h3>
                            <p>게임 성능을 향상시키는 팁과 기법입니다.</p>
                            <div class="guide-links">
                                <a href="#" class="guide-link" onclick="openAIChat('🚀 센서 데이터 최적화 방법을 알려주세요. throttling과 debouncing을 활용한 센서 데이터 전송 빈도 제어, 배터리 효율성 개선 방법을 코드 예제로 설명해주세요.')">🚀 센서 데이터 최적화</a>
                                <a href="#" class="guide-link" onclick="openAIChat('🖼️ 렌더링 최적화 방법을 알려주세요. Canvas 성능 향상을 위한 더블 버퍼링, requestAnimationFrame 활용, 불필요한 렌더링 방지 기법을 실제 구현으로 보여주세요.')">🖼️ 렌더링 최적화</a>
                                <a href="#" class="guide-link" onclick="openAIChat('🧠 메모리 관리 방법을 알려주세요. 게임에서 발생할 수 있는 메모리 누수 패턴과 예방법, 이벤트 리스너 정리, 타이머 해제 등을 구체적으로 설명해주세요.')">🧠 메모리 관리</a>
                            </div>
                        </div>
                    </div>
                    
                    <div style="margin-top: 3rem; padding: 2rem; background: var(--surface); border-radius: 1rem; text-align: center;">
                        <h3 style="color: var(--success); margin-bottom: 1rem;">📊 API 엔드포인트</h3>
                        <p style="color: var(--text-secondary); margin-bottom: 1rem;">개발에 유용한 API들</p>
                        <div style="display: flex; justify-content: center; gap: 1rem; flex-wrap: wrap;">
                            <a href="/api/games" style="color: var(--success); text-decoration: none; padding: 0.5rem 1rem; background: rgba(16, 185, 129, 0.1); border-radius: 0.5rem;">/api/games</a>
                            <a href="/api/ai/health" style="color: var(--success); text-decoration: none; padding: 0.5rem 1rem; background: rgba(16, 185, 129, 0.1); border-radius: 0.5rem;">/api/ai/health</a>
                            <a href="/api/stats" style="color: var(--success); text-decoration: none; padding: 0.5rem 1rem; background: rgba(16, 185, 129, 0.1); border-radius: 0.5rem;">/api/stats</a>
                        </div>
                    </div>
                </div>
                
                <script>
                    function openAIChat(question) {
                        // AI 채팅 페이지로 이동하면서 질문을 URL 파라미터로 전달
                        const encodedQuestion = encodeURIComponent(question);
                        window.location.href = \`/ai-assistant?q=\${encodedQuestion}\`;
                    }
                </script>
            </body>
            </html>
        `;
    }
    
    /**
     * Socket.IO 이벤트 핸들러 설정
     */
    setupSocketHandlers() {
        this.io.on('connection', (socket) => {
            console.log(`🔌 클라이언트 연결: ${socket.id} (${socket.handshake.address})`);
            
            // 게임 세션 생성 (게임에서 호출)
            socket.on('create-session', (data, callback) => {
                try {
                    console.log(`🔍 create-session 이벤트 수신:`, data);
                    const { gameId, gameType } = data;
                    
                    if (!gameId || !gameType) {
                        throw new Error('gameId와 gameType이 필요합니다.');
                    }
                    
                    const session = this.sessionManager.createSession(
                        gameId,
                        gameType,
                        socket.id,
                        socket.handshake.address
                    );
                    
                    console.log(`🔍 SessionManager에서 반환받은 세션:`, session);
                    console.log(`🔍 반환받은 sessionCode: "${session.sessionCode}" (타입: ${typeof session.sessionCode})`);
                    
                    const responseData = {
                        success: true,
                        session: session
                    };
                    
                    console.log(`🔍 클라이언트에 전송할 응답:`, responseData);
                    
                    // 게임 클라이언트에 세션 정보 전송
                    callback(responseData);
                    
                    console.log(`🎮 세션 생성됨: ${session.sessionCode} for ${gameId}`);
                    
                } catch (error) {
                    console.error(`❌ 세션 생성 실패:`, error.message);
                    callback({
                        success: false,
                        error: error.message
                    });
                }
            });
            
            // 센서 클라이언트 연결 (모바일에서 호출)
            socket.on('connect-sensor', (data, callback) => {
                try {
                    const { sessionCode, deviceInfo } = data;
                    
                    if (!sessionCode) {
                        throw new Error('세션 코드가 필요합니다.');
                    }
                    
                    const result = this.sessionManager.connectSensor(
                        sessionCode,
                        socket.id,
                        socket.handshake.address,
                        deviceInfo
                    );
                    
                    // 센서 클라이언트에 연결 확인
                    callback({
                        success: true,
                        connection: result
                    });
                    
                    // 게임 호스트에 센서 연결 알림
                    const session = this.sessionManager.getSession(result.sessionId);
                    socket.to(session.host.socketId).emit('sensor-connected', {
                        sensorId: result.sensorId,
                        gameType: session.gameType,
                        connectedSensors: result.connectedSensors,
                        maxSensors: result.maxSensors,
                        isReady: result.isReady
                    });
                    
                    // 모든 센서가 연결되면 게임 준비 완료 알림
                    if (result.isReady) {
                        socket.to(session.host.socketId).emit('game-ready', {
                            sessionId: result.sessionId,
                            gameType: session.gameType,
                            connectedSensors: Array.from(session.sensors.keys())
                        });
                    }
                    
                    console.log(`📱 센서 연결됨: ${result.sensorId} → ${sessionCode}`);
                    
                } catch (error) {
                    console.error(`❌ 센서 연결 실패:`, error.message);
                    callback({
                        success: false,
                        error: error.message
                    });
                }
            });
            
            // 센서 데이터 수신 (모바일에서 호출)
            socket.on('sensor-data', (data) => {
                try {
                    const { sessionCode, sensorId, sensorData } = data;
                    
                    const result = this.sessionManager.updateSensorData(
                        sessionCode,
                        sensorId,
                        sensorData
                    );
                    
                    // 게임 호스트에 센서 데이터 전달
                    socket.to(result.hostSocketId).emit('sensor-update', result.sensorData);
                    
                } catch (error) {
                    console.error(`❌ 센서 데이터 처리 실패:`, error.message);
                    socket.emit('sensor-error', { error: error.message });
                }
            });
            
            // 게임 시작 (게임에서 호출)
            socket.on('start-game', (data, callback) => {
                try {
                    const { sessionId } = data;
                    
                    const gameInfo = this.sessionManager.startGame(sessionId);
                    
                    callback({
                        success: true,
                        game: gameInfo
                    });
                    
                    // 모든 센서 클라이언트에 게임 시작 알림
                    const session = this.sessionManager.getSession(sessionId);
                    for (const sensor of session.sensors.values()) {
                        socket.to(sensor.socketId).emit('game-started', {
                            gameType: session.gameType,
                            sensorId: sensor.id
                        });
                    }
                    
                    console.log(`🎮 게임 시작: ${session.code}`);
                    
                } catch (error) {
                    console.error(`❌ 게임 시작 실패:`, error.message);
                    callback({
                        success: false,
                        error: error.message
                    });
                }
            });
            
            // 연결 해제 처리
            socket.on('disconnect', () => {
                console.log(`🔌 클라이언트 연결 해제: ${socket.id}`);
                
                const disconnections = this.sessionManager.disconnect(socket.id);
                
                // 연결 해제 알림 전송
                disconnections.forEach(disconnection => {
                    if (disconnection.type === 'host_disconnected') {
                        // 모든 센서에 호스트 연결 해제 알림
                        disconnection.affectedSensors.forEach(sensorId => {
                            this.io.emit('host-disconnected', { sessionId: disconnection.sessionId });
                        });
                    } else if (disconnection.type === 'sensor_disconnected') {
                        // 호스트에 센서 연결 해제 알림
                        socket.to(disconnection.hostSocketId).emit('sensor-disconnected', {
                            sensorId: disconnection.sensorId,
                            remainingSensors: disconnection.remainingSensors
                        });
                    }
                });
            });
            
            // 핑 응답
            socket.on('ping', (callback) => {
                if (callback) callback({ pong: Date.now() });
            });
        });
    }
    
    /**
     * 서버 시작
     */
    start() {
        this.server.listen(this.port, () => {
            console.log(`🚀 Sensor Game Hub v6.0 서버 시작`);
            console.log(`📍 포트: ${this.port}`);
            console.log(`🌐 URL: http://localhost:${this.port}`);
            console.log(`📱 센서: http://localhost:${this.port}/sensor.html`);
            console.log(`🎮 게임: http://localhost:${this.port}/games/[solo|dual|multi]`);
        });
    }
    
    /**
     * 게임 재스캔 (내부 사용)
     */
    async rescanGames() {
        try {
            console.log('🔄 게임 재스캔 시작...');
            await this.gameScanner.scanGames();
            console.log('✅ 게임 재스캔 완료');
            return {
                success: true,
                stats: this.gameScanner.getStats()
            };
        } catch (error) {
            console.error('❌ 게임 재스캔 실패:', error);
            throw error;
        }
    }

    /**
     * 서버 종료
     */
    stop() {
        this.server.close(() => {
            console.log('🛑 서버가 종료되었습니다.');
        });
    }
}

// 서버 시작
const server = new GameServer();
server.start();

// 우아한 종료 처리
process.on('SIGTERM', () => {
    console.log('🛑 SIGTERM 신호 수신, 서버 종료 중...');
    server.stop();
});

process.on('SIGINT', () => {
    console.log('🛑 SIGINT 신호 수신, 서버 종료 중...');
    server.stop();
    process.exit(0);
});

module.exports = GameServer;