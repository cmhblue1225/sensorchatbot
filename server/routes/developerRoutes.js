/**
 * 👨‍💻 DeveloperRoutes v6.0
 *
 * 통합 개발자 센터 라우트
 * - 35개 마크다운 문서 뷰어
 * - AI 게임 생성기 통합
 * - AI 매뉴얼 챗봇 통합
 * - 좌측 사이드바 네비게이션
 */

const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const fsSync = require('fs');
const archiver = require('archiver');
const multer = require('multer');
const AdmZip = require('adm-zip');
const { createClient } = require('@supabase/supabase-js');
const MarkdownRenderer = require('../utils/markdownRenderer');
const { checkCreatorAuth, optionalAuth } = require('../middleware/authMiddleware');

class DeveloperRoutes {
    constructor(gameScanner, aiServiceGetter) {
        this.gameScanner = gameScanner;
        this.aiServiceGetter = aiServiceGetter;
        this.router = express.Router();
        this.markdownRenderer = new MarkdownRenderer();
        this.docsBasePath = path.join(__dirname, '../../docs');

        // 💬 챗봇 세션 관리 (메모리 기반)
        this.chatSessions = new Map(); // sessionId -> { messages: [], lastAccess: timestamp }
        this.sessionTimeout = 30 * 60 * 1000; // 30분

        // 🗑️ 세션 정리 타이머 (10분마다 실행)
        setInterval(() => {
            const now = Date.now();
            let cleanedCount = 0;

            for (const [sessionId, session] of this.chatSessions.entries()) {
                if (now - session.lastAccess > this.sessionTimeout) {
                    this.chatSessions.delete(sessionId);
                    cleanedCount++;
                }
            }

            if (cleanedCount > 0) {
                console.log(`🗑️ 챗봇 세션 ${cleanedCount}개 정리됨 (30분 무활동)`);
            }
        }, 10 * 60 * 1000);

        console.log('💬 챗봇 세션 관리 시스템 초기화됨');

        // 문서 트리 구조 정의
        this.documentTree = {
            'Root Docs': [
                { path: 'README.md', title: '📚 센서 게임 허브 문서' },
                { path: 'PERFECT_GAME_DEVELOPMENT_GUIDE.md', title: '🎮 완벽한 게임 개발 가이드' },
                { path: 'SENSOR_GAME_TROUBLESHOOTING.md', title: '🔧 센서 게임 트러블슈팅' },
                { path: 'SESSIONSK_INTEGRATION_PATTERNS.md', title: '🔗 SessionSDK 통합 패턴' }
            ],
            'Game Development': [
                { path: 'game-development/01-architecture-design.md', title: '1️⃣ 아키텍처 디자인' },
                { path: 'game-development/02-sessionsdk-advanced.md', title: '2️⃣ SessionSDK 고급' },
                { path: 'game-development/03-sensor-data-mastery.md', title: '3️⃣ 센서 데이터 마스터리' },
                { path: 'game-development/04-physics-engine.md', title: '4️⃣ 물리 엔진' },
                { path: 'game-development/05-ui-ux-patterns.md', title: '5️⃣ UI/UX 패턴' },
                { path: 'game-development/06-performance-optimization.md', title: '6️⃣ 성능 최적화' }
            ],
            'API & SDK': [
                { path: 'api-sdk/sessionsdk-reference.md', title: '📖 SessionSDK API 레퍼런스' }
            ],
            'Sensor Processing': [
                { path: 'sensor-processing/orientation-sensor.md', title: '🧭 방향 센서' },
                { path: 'sensor-processing/acceleration-sensor.md', title: '⚡ 가속도 센서' },
                { path: 'sensor-processing/sensor-fusion.md', title: '🔄 센서 퓨전' }
            ],
            'Game Types': [
                { path: 'game-types/solo-game-guide.md', title: '👤 솔로 게임 가이드' },
                { path: 'game-types/dual-game-guide.md', title: '👥 듀얼 게임 가이드' },
                { path: 'game-types/multi-game-guide.md', title: '👨‍👩‍👧‍👦 멀티 게임 가이드' }
            ],
            'Troubleshooting': [
                { path: 'troubleshooting/common-issues.md', title: '⚠️ 일반적인 문제' },
                { path: 'troubleshooting/network-issues.md', title: '🌐 네트워크 문제' },
                { path: 'troubleshooting/sensor-problems.md', title: '📱 센서 문제' }
            ],
            'Advanced': [
                { path: 'advanced/plugin-system.md', title: '🔌 플러그인 시스템' },
                { path: 'advanced/custom-game-engine.md', title: '⚙️ 커스텀 게임 엔진' },
                { path: 'advanced/3d-graphics.md', title: '🎨 3D 그래픽스' },
                { path: 'advanced/audio-system.md', title: '🔊 오디오 시스템' },
                { path: 'advanced/pwa-implementation.md', title: '📲 PWA 구현' }
            ],
            'Examples': [
                { path: 'examples/basic-games/index.md', title: '🎮 기본 게임 예제' },
                { path: 'examples/basic-games/dual-games.md', title: '👥 듀얼 게임 예제' },
                { path: 'examples/basic-games/dual-games-part2.md', title: '👥 듀얼 게임 예제 Part 2' },
                { path: 'examples/basic-games/multi-games.md', title: '👨‍👩‍👧‍👦 멀티 게임 예제' },
                { path: 'examples/sensor-usage/index.md', title: '📱 센서 사용 예제' },
                { path: 'examples/ui-components/index.md', title: '🎨 UI 컴포넌트 예제' },
                { path: 'examples/optimization/index.md', title: '⚡ 최적화 예제' },
                { path: 'examples/troubleshooting/index.md', title: '🔧 트러블슈팅 예제' }
            ],
            'Project Plans': [
                { path: '계획서/revised_presentation_script.md', title: '📝 발표 스크립트' },
                { path: '계획서/프로젝트_문서_검토_및_개선_제안.md', title: '📋 프로젝트 개선 제안' }
            ]
        };

        // Multer 설정 (파일 업로드)
        this.upload = multer({
            storage: multer.memoryStorage(),  // 메모리에 임시 저장
            limits: {
                fileSize: 50 * 1024 * 1024  // 50MB 제한
            },
            fileFilter: (req, file, cb) => {
                // 모든 파일 타입 허용 (ZIP 포함)
                cb(null, true);
            }
        });

        // Supabase Admin 클라이언트 (Storage 관리용)
        this.supabaseAdmin = null;
        if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
            this.supabaseAdmin = createClient(
                process.env.SUPABASE_URL,
                process.env.SUPABASE_SERVICE_ROLE_KEY
            );
        }

        this.setupRoutes();
        console.log('👨‍💻 DeveloperRoutes 초기화 완료');
    }

    /**
     * 라우트 설정
     */
    setupRoutes() {
        // 메인 개발자 센터 페이지
        this.router.get('/', (req, res) => {
            this.getDeveloperCenter(req, res);
        });

        // 문서 뷰어 - 3단계 경로 (examples/basic-games/index.md)
        this.router.get('/docs/:category/:subcategory/:filename', async (req, res) => {
            await this.viewDocument(req, res);
        });

        // 문서 뷰어 - 2단계 경로 (game-development/01-architecture-design.md)
        this.router.get('/docs/:category/:filename', async (req, res) => {
            await this.viewDocument(req, res);
        });

        // 루트 문서 뷰어 - 1단계 경로 (README.md)
        this.router.get('/docs/:filename', async (req, res) => {
            await this.viewDocument(req, res);
        });

        // AI 챗봇 API
        this.router.post('/api/chat', async (req, res) => {
            await this.handleChat(req, res);
        });

        // AI 게임 생성 API (레거시, 인증 필요)
        this.router.post('/api/generate-game', checkCreatorAuth, async (req, res) => {
            await this.handleGameGeneration(req, res);
        });

        // 🆕 대화형 게임 생성 API (Phase 2)
        // 세션 시작 (인증 필요)
        this.router.post('/api/start-game-session', checkCreatorAuth, async (req, res) => {
            await this.handleStartGameSession(req, res);
        });

        // 대화 메시지 처리 (인증 필요)
        this.router.post('/api/game-chat', checkCreatorAuth, async (req, res) => {
            await this.handleGameChat(req, res);
        });

        // 최종 게임 생성 (인증 필요)
        this.router.post('/api/finalize-game', checkCreatorAuth, async (req, res) => {
            await this.handleFinalizeGame(req, res);
        });

        // 🆕 게임 미리보기
        this.router.get('/api/preview-game/:gameId', async (req, res) => {
            await this.handlePreviewGame(req, res);
        });

        // 🆕 게임 관리 API
        // 게임 업로드 (ZIP 파일 또는 개별 파일)
        this.router.post('/api/upload-game', this.upload.array('files', 100), async (req, res) => {
            await this.handleUploadGame(req, res);
        });

        // 게임 다운로드 (ZIP 형태)
        this.router.get('/api/download-game/:gameId', async (req, res) => {
            await this.handleDownloadGame(req, res);
        });

        // 게임 삭제 (Storage + DB)
        this.router.delete('/api/delete-game/:gameId', async (req, res) => {
            await this.handleDeleteGame(req, res);
        });

        // 🆕 계정 관리 API
        // 사용자 정보 조회 (인증 필요)
        this.router.get('/api/account/info', checkCreatorAuth, async (req, res) => {
            await this.handleGetAccountInfo(req, res);
        });

        // 닉네임 변경 (인증 필요)
        this.router.post('/api/account/change-nickname', checkCreatorAuth, async (req, res) => {
            await this.handleChangeNickname(req, res);
        });

        // 비밀번호 변경 (인증 필요)
        this.router.post('/api/account/change-password', checkCreatorAuth, async (req, res) => {
            await this.handleChangePassword(req, res);
        });
    }

    /**
     * 통합 개발자 센터 페이지 생성
     */
    getDeveloperCenter(req, res) {
        const html = `
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Developer Center - Sensor Game Hub v6.0</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/atom-one-dark.min.css">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #0F172A 0%, #581C87 50%, #0F172A 100%);
            color: #F8FAFC;
            min-height: 100vh;
            overflow: hidden;
        }

        .header {
            background: rgba(30, 41, 59, 0.8);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            border-bottom: 1px solid rgba(100, 116, 139, 0.3);
            padding: 1rem 2rem;
            display: flex;
            align-items: center;
            justify-content: space-between;
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            z-index: 100;
        }

        .header-left {
            display: flex;
            align-items: center;
            gap: 1rem;
        }

        .header-title {
            font-size: 1.5rem;
            font-weight: 700;
            background: linear-gradient(135deg, #6366F1, #A855F7);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }

        .back-btn {
            padding: 0.5rem 1rem;
            background: rgba(99, 102, 241, 0.2);
            border: 1px solid #6366F1;
            border-radius: 0.5rem;
            color: #A5B4FC;
            text-decoration: none;
            transition: all 0.2s;
            font-size: 0.875rem;
        }

        .back-btn:hover {
            background: rgba(99, 102, 241, 0.3);
            transform: translateX(-2px);
        }

        .main-container {
            display: flex;
            height: calc(100vh - 73px);
            margin-top: 73px;
        }

        .sidebar {
            width: 320px;
            background: rgba(30, 41, 59, 0.6);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            border-right: 1px solid rgba(100, 116, 139, 0.3);
            overflow-y: auto;
            flex-shrink: 0;
        }

        .sidebar-section {
            padding: 1.5rem;
            border-bottom: 1px solid rgba(100, 116, 139, 0.2);
        }

        .section-title {
            font-size: 0.875rem;
            font-weight: 600;
            color: #94A3B8;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-bottom: 0.75rem;
        }

        .doc-list {
            list-style: none;
        }

        .doc-item {
            margin-bottom: 0.5rem;
        }

        .doc-link {
            display: block;
            padding: 0.5rem 0.75rem;
            color: #CBD5E1;
            text-decoration: none;
            border-radius: 0.375rem;
            transition: all 0.2s;
            font-size: 0.875rem;
        }

        .doc-link:hover {
            background: rgba(99, 102, 241, 0.2);
            color: #A5B4FC;
            transform: translateX(4px);
        }

        .doc-link.active {
            background: rgba(99, 102, 241, 0.3);
            color: #A5B4FC;
            border-left: 3px solid #6366F1;
        }

        .content-area {
            flex: 1;
            display: flex;
            flex-direction: column;
            overflow: hidden;
        }

        .tabs {
            display: flex;
            background: rgba(30, 41, 59, 0.6);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            border-bottom: 1px solid rgba(100, 116, 139, 0.3);
            padding: 0 1rem;
            gap: 0.5rem;
        }

        .tab {
            padding: 1rem 1.5rem;
            background: none;
            border: none;
            color: #94A3B8;
            font-size: 0.875rem;
            font-weight: 600;
            cursor: pointer;
            border-bottom: 2px solid transparent;
            transition: all 0.2s;
        }

        .tab:hover {
            color: #CBD5E1;
        }

        .tab.active {
            color: #A5B4FC;
            border-bottom-color: #6366F1;
        }

        .tab-content {
            flex: 1;
            overflow-y: auto;
            padding: 2rem;
            display: none;
        }

        .tab-content.active {
            display: block;
        }

        .welcome-screen {
            text-align: center;
            padding: 4rem 2rem;
        }

        .welcome-icon {
            font-size: 5rem;
            margin-bottom: 1rem;
        }

        .welcome-title {
            font-size: 2rem;
            font-weight: 700;
            margin-bottom: 1rem;
            background: linear-gradient(135deg, #6366F1, #A855F7);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }

        .welcome-text {
            color: #CBD5E1;
            font-size: 1.125rem;
            margin-bottom: 2rem;
        }

        .quick-links {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1rem;
            max-width: 800px;
            margin: 0 auto;
        }

        .quick-link {
            background: rgba(30, 41, 59, 0.6);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            border: 1px solid rgba(100, 116, 139, 0.3);
            border-radius: 1rem;
            padding: 1.5rem;
            text-align: center;
            transition: all 0.3s;
            cursor: pointer;
        }

        .quick-link:hover {
            transform: translateY(-4px);
            border-color: #6366F1;
            box-shadow: 0 10px 30px rgba(99, 102, 241, 0.3);
        }

        .quick-link-icon {
            font-size: 2.5rem;
            margin-bottom: 0.5rem;
        }

        .quick-link-text {
            font-weight: 600;
            color: #E2E8F0;
        }

        .doc-viewer {
            background: rgba(30, 41, 59, 0.4);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            border-radius: 1rem;
            padding: 2rem;
            border: 1px solid rgba(100, 116, 139, 0.3);
        }

        .chat-container {
            display: flex;
            flex-direction: column;
            height: 100%;
            max-width: 900px;
            margin: 0 auto;
        }

        .chat-messages {
            flex: 1;
            overflow-y: auto;
            padding: 1rem;
            background: rgba(30, 41, 59, 0.4);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            border-radius: 1rem;
            margin-bottom: 1rem;
            border: 1px solid rgba(100, 116, 139, 0.3);
        }

        .chat-message {
            margin-bottom: 1rem;
            padding: 1rem;
            border-radius: 0.75rem;
        }

        .chat-message.user {
            background: rgba(99, 102, 241, 0.2);
            border-left: 3px solid #6366F1;
        }

        .chat-message.assistant {
            background: rgba(168, 85, 247, 0.2);
            border-left: 3px solid #A855F7;
        }

        .chat-message.typing {
            background: rgba(100, 116, 139, 0.2);
            border-left: 3px solid #64748B;
        }

        .typing-indicator {
            display: inline-flex;
            gap: 0.25rem;
            align-items: center;
            padding: 0.5rem 0;
        }

        .typing-indicator span {
            width: 8px;
            height: 8px;
            background: #94A3B8;
            border-radius: 50%;
            animation: typing 1.4s infinite;
        }

        .typing-indicator span:nth-child(2) {
            animation-delay: 0.2s;
        }

        .typing-indicator span:nth-child(3) {
            animation-delay: 0.4s;
        }

        @keyframes typing {
            0%, 60%, 100% {
                transform: translateY(0);
                opacity: 0.7;
            }
            30% {
                transform: translateY(-10px);
                opacity: 1;
            }
        }

        .chat-input-area {
            display: flex;
            gap: 0.75rem;
        }

        .chat-input {
            flex: 1;
            padding: 1rem;
            background: rgba(30, 41, 59, 0.6);
            border: 1px solid rgba(100, 116, 139, 0.3);
            border-radius: 0.75rem;
            color: #E2E8F0;
            font-size: 0.875rem;
            resize: none;
            height: 80px;
        }

        .chat-input:focus {
            outline: none;
            border-color: #6366F1;
            box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
        }

        .send-btn {
            padding: 1rem 2rem;
            background: linear-gradient(135deg, #6366F1, #A855F7);
            border: none;
            border-radius: 0.75rem;
            color: white;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
        }

        .send-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 30px rgba(99, 102, 241, 0.4);
        }

        .send-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }

        .generator-container {
            max-width: 1400px;
            margin: 0 auto;
        }

        /* 📊 정보 수집 진행률 바 */
        .info-completeness-bar {
            background: rgba(30, 41, 59, 0.4);
            backdrop-filter: blur(12px);
            border-radius: 1rem;
            padding: 1.5rem;
            margin-bottom: 1.5rem;
            border: 1px solid rgba(100, 116, 139, 0.3);
        }

        .completeness-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 0.75rem;
        }

        .completeness-label {
            color: #CBD5E1;
            font-weight: 600;
            font-size: 0.875rem;
        }

        .completeness-value {
            color: #6366F1;
            font-weight: 700;
            font-size: 1.25rem;
        }

        .progress-bar-container {
            height: 12px;
            background: rgba(15, 23, 42, 0.6);
            border-radius: 9999px;
            overflow: hidden;
            margin-bottom: 0.75rem;
        }

        .info-progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #6366F1, #A855F7);
            transition: width 0.5s ease;
            border-radius: 9999px;
        }

        .completeness-status {
            display: flex;
            justify-content: center;
        }

        .readiness-badge {
            padding: 0.5rem 1rem;
            border-radius: 0.5rem;
            font-size: 0.75rem;
            font-weight: 600;
        }

        .readiness-badge.not-ready {
            background: rgba(239, 68, 68, 0.2);
            color: #FCA5A5;
        }

        .readiness-badge.ready {
            background: rgba(34, 197, 94, 0.2);
            color: #86EFAC;
        }

        /* 2열 레이아웃 */
        .generator-main-layout {
            display: flex;
            gap: 1.5rem;
        }

        .generator-main-layout > .generator-chat-container {
            flex: 1;
        }

        /* 명령 버튼 영역 */
        .command-buttons-area {
            display: flex;
            gap: 0.75rem;
            padding: 1rem;
            background: rgba(15, 23, 42, 0.6);
            border-top: 1px solid rgba(100, 116, 139, 0.3);
            border-bottom: 1px solid rgba(100, 116, 139, 0.3);
        }

        .command-btn {
            flex: 1;
            padding: 0.75rem 1rem;
            background: rgba(100, 116, 139, 0.2);
            border: 1px solid rgba(100, 116, 139, 0.3);
            border-radius: 0.5rem;
            color: #CBD5E1;
            font-size: 0.875rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
        }

        .command-btn:hover:not(:disabled) {
            background: rgba(100, 116, 139, 0.3);
            border-color: #6366F1;
            color: #E2E8F0;
            transform: translateY(-1px);
        }

        .command-btn.generate {
            background: linear-gradient(135deg, #6366F1, #A855F7);
            border-color: transparent;
            color: white;
        }

        .command-btn.generate:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
        }

        .command-btn:disabled {
            opacity: 0.4;
            cursor: not-allowed;
        }

        /* 정보 수집 패널 */
        .info-collection-panel {
            width: 300px;
            flex-shrink: 0;
            background: rgba(30, 41, 59, 0.4);
            backdrop-filter: blur(12px);
            border-radius: 1rem;
            border: 1px solid rgba(100, 116, 139, 0.3);
            overflow: hidden;
        }

        .panel-header {
            background: rgba(15, 23, 42, 0.6);
            padding: 1rem;
            border-bottom: 1px solid rgba(100, 116, 139, 0.3);
        }

        .panel-title {
            color: #E2E8F0;
            font-size: 1rem;
            font-weight: 600;
            margin: 0;
        }

        .panel-content {
            padding: 1rem;
            max-height: 600px;
            overflow-y: auto;
        }

        .info-section {
            margin-bottom: 1rem;
            padding-bottom: 1rem;
            border-bottom: 1px solid rgba(100, 116, 139, 0.2);
        }

        .info-section:last-child {
            border-bottom: none;
        }

        .info-label {
            color: #94A3B8;
            font-size: 0.75rem;
            font-weight: 600;
            margin-bottom: 0.5rem;
        }

        .info-value {
            color: #E2E8F0;
            font-size: 0.875rem;
        }

        .info-value.info-list {
            color: #CBD5E1;
        }

        .generator-form {
            background: rgba(30, 41, 59, 0.4);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            border-radius: 1rem;
            padding: 2rem;
            border: 1px solid rgba(100, 116, 139, 0.3);
            margin-bottom: 1.5rem;
        }

        .form-group {
            margin-bottom: 1.5rem;
        }

        .form-label {
            display: block;
            color: #CBD5E1;
            font-weight: 600;
            margin-bottom: 0.5rem;
        }

        .form-input, .form-textarea, .form-select {
            width: 100%;
            padding: 0.75rem;
            background: rgba(30, 41, 59, 0.6);
            border: 1px solid rgba(100, 116, 139, 0.3);
            border-radius: 0.5rem;
            color: #E2E8F0;
            font-size: 0.875rem;
        }

        .form-textarea {
            resize: vertical;
            min-height: 100px;
        }

        .form-input:focus, .form-textarea:focus, .form-select:focus {
            outline: none;
            border-color: #6366F1;
            box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
        }

        .generate-btn {
            width: 100%;
            padding: 1rem;
            background: linear-gradient(135deg, #6366F1, #A855F7);
            border: none;
            border-radius: 0.75rem;
            color: white;
            font-weight: 600;
            font-size: 1rem;
            cursor: pointer;
            transition: all 0.2s;
        }

        .generate-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 30px rgba(99, 102, 241, 0.4);
        }

        .generate-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }

        .progress-area {
            background: rgba(30, 41, 59, 0.4);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            border-radius: 1rem;
            padding: 2rem;
            border: 1px solid rgba(100, 116, 139, 0.3);
            display: none;
        }

        .progress-area.active {
            display: block;
        }

        .loading-spinner {
            display: inline-block;
            width: 20px;
            height: 20px;
            border: 3px solid rgba(99, 102, 241, 0.3);
            border-radius: 50%;
            border-top-color: #6366F1;
            animation: spin 1s linear infinite;
        }

        @keyframes spin {
            to { transform: rotate(360deg); }
        }

        /* 대화형 게임 생성기 스타일 */
        .generation-progress-bar {
            display: flex;
            justify-content: space-between;
            margin-bottom: 2rem;
            padding: 1rem;
            background: rgba(30, 41, 59, 0.4);
            border-radius: 1rem;
            border: 1px solid rgba(100, 116, 139, 0.3);
        }

        .progress-step {
            flex: 1;
            text-align: center;
            position: relative;
            opacity: 0.4;
            transition: all 0.3s;
        }

        .progress-step.active {
            opacity: 1;
        }

        .progress-step.active .step-number {
            background: linear-gradient(135deg, #6366F1, #A855F7);
            color: white;
        }

        .step-number {
            width: 40px;
            height: 40px;
            margin: 0 auto 0.5rem;
            border-radius: 50%;
            background: rgba(100, 116, 139, 0.3);
            color: #64748B;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 600;
        }

        .step-label {
            font-size: 0.75rem;
            color: #CBD5E1;
        }

        .generator-chat-container {
            background: rgba(30, 41, 59, 0.4);
            backdrop-filter: blur(12px);
            border-radius: 1rem;
            border: 1px solid rgba(100, 116, 139, 0.3);
            overflow: hidden;
        }

        .generator-chat-messages {
            height: 400px;
            overflow-y: auto;
            padding: 1.5rem;
        }

        .generator-chat-input-area {
            display: flex;
            gap: 0.75rem;
            padding: 1rem;
            background: rgba(15, 23, 42, 0.6);
            border-top: 1px solid rgba(100, 116, 139, 0.3);
        }

        .generator-chat-input {
            flex: 1;
            padding: 0.75rem 1rem;
            background: rgba(30, 41, 59, 0.8);
            border: 1px solid rgba(100, 116, 139, 0.3);
            border-radius: 0.5rem;
            color: #E2E8F0;
            font-size: 0.875rem;
        }

        .generator-chat-input:focus {
            outline: none;
            border-color: #6366F1;
        }

        .generator-send-btn {
            padding: 0.75rem 1.5rem;
            background: linear-gradient(135deg, #6366F1, #A855F7);
            border: none;
            border-radius: 0.5rem;
            color: white;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
        }

        .generator-send-btn:hover {
            transform: translateY(-2px);
        }

        .generator-send-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }

        .generate-action-area {
            display: flex;
            gap: 1rem;
            padding: 1rem;
            background: rgba(15, 23, 42, 0.6);
            border-top: 1px solid rgba(100, 116, 139, 0.3);
        }

        .generate-action-area.hidden {
            display: none;
        }

        .final-generate-btn, .modify-requirements-btn {
            flex: 1;
            padding: 1rem;
            border: none;
            border-radius: 0.75rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
        }

        .final-generate-btn {
            background: linear-gradient(135deg, #6366F1, #A855F7);
            color: white;
        }

        .modify-requirements-btn {
            background: rgba(100, 116, 139, 0.3);
            color: #CBD5E1;
        }

        .generation-modal, .result-modal {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(15, 23, 42, 0.9);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
        }

        .generation-modal.hidden, .result-modal.hidden {
            display: none;
        }

        .modal-content {
            background: rgba(30, 41, 59, 0.95);
            backdrop-filter: blur(12px);
            border-radius: 1rem;
            padding: 2rem;
            max-width: 600px;
            width: 90%;
            border: 1px solid rgba(100, 116, 139, 0.3);
            position: relative;
        }

        .modal-close {
            position: absolute;
            top: 1rem;
            right: 1rem;
            background: none;
            border: none;
            color: #94A3B8;
            font-size: 1.5rem;
            cursor: pointer;
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 0.5rem;
        }

        .modal-close:hover {
            background: rgba(100, 116, 139, 0.3);
        }

        .modal-title {
            font-size: 1.5rem;
            font-weight: 700;
            margin-bottom: 1.5rem;
            color: #E2E8F0;
        }

        .generation-steps {
            margin-bottom: 1.5rem;
        }

        .gen-step {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            padding: 0.75rem;
            margin-bottom: 0.5rem;
            background: rgba(30, 41, 59, 0.6);
            border-radius: 0.5rem;
        }

        .gen-step-icon {
            font-size: 1.25rem;
        }

        .gen-step-text {
            color: #CBD5E1;
            font-size: 0.875rem;
        }

        .progress-bar-container {
            width: 100%;
            height: 8px;
            background: rgba(100, 116, 139, 0.3);
            border-radius: 4px;
            overflow: hidden;
        }

        .progress-bar {
            height: 100%;
            background: linear-gradient(135deg, #6366F1, #A855F7);
            transition: width 0.3s ease;
        }

        .progress-percentage {
            text-align: center;
            color: #CBD5E1;
            font-size: 0.875rem;
            margin-top: 0.5rem;
        }

        .result-content {
            margin-bottom: 1.5rem;
            color: #CBD5E1;
        }

        .result-actions {
            display: flex;
            gap: 1rem;
            flex-direction: column;
        }

        .result-btn {
            padding: 1rem;
            border: none;
            border-radius: 0.75rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
            text-decoration: none;
            text-align: center;
        }

        .result-btn.primary {
            background: linear-gradient(135deg, #6366F1, #A855F7);
            color: white;
        }

        .result-btn.secondary {
            background: rgba(100, 116, 139, 0.3);
            color: #CBD5E1;
        }

        .result-btn:hover {
            transform: translateY(-2px);
        }

        /* Scrollbar Styling */
        ::-webkit-scrollbar {
            width: 10px;
            height: 10px;
        }

        ::-webkit-scrollbar-track {
            background: rgba(30, 41, 59, 0.3);
        }

        ::-webkit-scrollbar-thumb {
            background: rgba(99, 102, 241, 0.5);
            border-radius: 5px;
        }

        ::-webkit-scrollbar-thumb:hover {
            background: rgba(99, 102, 241, 0.7);
        }

        /* Markdown Styling */
        .markdown-body {
            color: #E2E8F0;
        }

        .markdown-body h1 {
            font-size: 2rem;
            font-weight: 700;
            margin-bottom: 1rem;
            padding-bottom: 0.75rem;
            border-bottom: 2px solid #6366F1;
            background: linear-gradient(135deg, #6366F1, #A855F7);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            scroll-margin-top: 100px;
        }

        .markdown-body h2 {
            font-size: 1.5rem;
            font-weight: 600;
            margin-top: 2rem;
            margin-bottom: 0.75rem;
            color: #A855F7;
            scroll-margin-top: 100px;
        }

        .markdown-body h3 {
            font-size: 1.25rem;
            font-weight: 600;
            margin-top: 1.5rem;
            margin-bottom: 0.5rem;
            color: #EC4899;
            scroll-margin-top: 100px;
        }

        .markdown-body h4 {
            scroll-margin-top: 100px;
        }

        .markdown-body h5 {
            scroll-margin-top: 100px;
        }

        .markdown-body h6 {
            scroll-margin-top: 100px;
        }

        .markdown-body p {
            margin-bottom: 1rem;
            color: #CBD5E1;
            line-height: 1.7;
        }

        .markdown-body code {
            background: rgba(99, 102, 241, 0.2);
            padding: 0.2rem 0.4rem;
            border-radius: 0.25rem;
            font-family: 'Monaco', 'Menlo', monospace;
            font-size: 0.875em;
            color: #A5B4FC;
        }

        .markdown-body pre {
            background: #1E293B;
            padding: 1rem;
            border-radius: 0.5rem;
            overflow-x: auto;
            margin-bottom: 1rem;
            border: 1px solid rgba(100, 116, 139, 0.3);
        }

        .markdown-body pre code {
            background: none;
            padding: 0;
            color: inherit;
            font-size: 0.875rem;
        }

        .markdown-body ul, .markdown-body ol {
            margin-bottom: 1rem;
            margin-left: 1.5rem;
            color: #CBD5E1;
        }

        .markdown-body li {
            margin-bottom: 0.5rem;
        }

        .markdown-body a {
            color: #6366F1;
            text-decoration: none;
            border-bottom: 1px solid transparent;
            transition: all 0.2s;
        }

        .markdown-body a:hover {
            color: #A855F7;
            border-bottom-color: #A855F7;
        }

        .markdown-body table {
            width: 100%;
            border-collapse: collapse;
            margin: 1rem 0;
        }

        .markdown-body th, .markdown-body td {
            padding: 0.75rem;
            border: 1px solid rgba(100, 116, 139, 0.3);
            text-align: left;
        }

        .markdown-body th {
            background: rgba(99, 102, 241, 0.2);
            font-weight: 600;
            color: #E2E8F0;
        }

        .markdown-body td {
            color: #CBD5E1;
        }

        .markdown-body blockquote {
            border-left: 4px solid #6366F1;
            padding-left: 1rem;
            margin: 1rem 0;
            color: #94A3B8;
            font-style: italic;
        }

        @media (max-width: 768px) {
            .sidebar {
                position: fixed;
                left: -320px;
                top: 73px;
                height: calc(100vh - 73px);
                z-index: 50;
                transition: left 0.3s;
            }

            .sidebar.open {
                left: 0;
            }

            .main-container {
                flex-direction: column;
            }
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="header-left">
            <a href="/" class="back-btn">← 홈으로</a>
            <h1 class="header-title">Developer Center</h1>
        </div>
    </div>

    <div class="main-container">
        <aside class="sidebar" id="sidebar">
            ${this.generateSidebarHTML()}
        </aside>

        <main class="content-area">
            <div class="tabs">
                <button class="tab active" data-tab="welcome">🏠 시작하기</button>
                <button class="tab" data-tab="docs">📚 문서</button>
                <button class="tab" data-tab="chat">💬 AI 챗봇</button>
                <button class="tab" data-tab="manager">🎯 게임 관리</button>
            </div>

            <div class="tab-content active" id="welcome-tab">
                ${this.generateWelcomeHTML()}
            </div>

            <div class="tab-content" id="docs-tab">
                <div class="doc-viewer">
                    <div class="markdown-body" id="doc-content">
                        <p style="color: #94A3B8;">← 좌측 사이드바에서 문서를 선택하세요</p>
                    </div>
                </div>
            </div>

            <div class="tab-content" id="chat-tab">
                ${this.generateChatHTML()}
            </div>

            <div class="tab-content" id="generator-tab">
                ${this.generateGeneratorHTML()}
            </div>

            <div class="tab-content" id="manager-tab">
                ${this.generateGameManagerHTML()}
            </div>
        </main>
    </div>

    <script src="/socket.io/socket.io.js"></script>
    <script>
        // 탭 전환
        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', () => {
                const targetTab = tab.dataset.tab;

                document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
                document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

                tab.classList.add('active');
                document.getElementById(targetTab + '-tab').classList.add('active');
            });
        });

        // 문서 로드
        document.querySelectorAll('.doc-link').forEach(link => {
            link.addEventListener('click', async (e) => {
                e.preventDefault();
                const docPath = link.dataset.path;

                document.querySelectorAll('.doc-link').forEach(l => l.classList.remove('active'));
                link.classList.add('active');

                // 문서 탭으로 전환
                document.querySelector('[data-tab="docs"]').click();

                // 문서 로드
                const docContent = document.getElementById('doc-content');
                docContent.innerHTML = '<p style="color: #94A3B8;">📄 로딩 중...</p>';

                try {
                    const response = await fetch('/developer' + docPath);
                    const html = await response.text();
                    docContent.innerHTML = html;
                } catch (error) {
                    docContent.innerHTML = '<p style="color: #EF4444;">❌ 문서를 불러올 수 없습니다.</p>';
                }
            });
        });

        // AI 챗봇
        const chatMessages = document.getElementById('chat-messages');
        const chatInput = document.getElementById('chat-input');
        const sendBtn = document.getElementById('send-btn');

        // 💬 챗봇 세션 ID 관리
        let chatSessionId = localStorage.getItem('chatSessionId') || null;

        async function sendMessage() {
            const message = chatInput.value.trim();
            if (!message) return;

            // 사용자 메시지 추가
            addMessage('user', message);
            chatInput.value = '';
            sendBtn.disabled = true;

            // 로딩 인디케이터 추가
            const typingDiv = addTypingIndicator();

            try {
                const response = await fetch('/developer/api/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        message: message,
                        sessionId: chatSessionId // ✨ 세션 ID 전송
                    })
                });

                const data = await response.json();

                // ✨ 세션 ID 저장 (서버에서 반환)
                if (data.sessionId) {
                    chatSessionId = data.sessionId;
                    localStorage.setItem('chatSessionId', chatSessionId);
                    console.log('💬 챗봇 세션: ' + chatSessionId.substring(0, 8) + '...');
                }

                // 📊 캐시 통계 로깅 (개발 모드)
                if (data.cacheStats) {
                    console.log('📊 캐시 통계:', data.cacheStats);
                }

                // 로딩 인디케이터 제거
                removeTypingIndicator(typingDiv);

                // AI 응답 추가
                addMessage('assistant', data.response);
            } catch (error) {
                // 로딩 인디케이터 제거
                removeTypingIndicator(typingDiv);

                addMessage('assistant', '❌ 오류가 발생했습니다. 다시 시도해주세요.');
            }

            sendBtn.disabled = false;
        }

        // 🔄 새 대화 시작 함수
        function startNewConversation() {
            if (confirm('💬 새 대화를 시작하시겠습니까?\\n현재 대화 내용이 초기화됩니다.')) {
                // 세션 ID 초기화
                chatSessionId = null;
                localStorage.removeItem('chatSessionId');

                // 채팅 메시지 초기화
                chatMessages.innerHTML = '';

                // 환영 메시지 추가
                addMessage('assistant', '👋 안녕하세요! Sensor Game Hub v6.0 AI 어시스턴트입니다.\\n게임 개발에 대해 무엇이든 물어보세요!');

                console.log('🔄 새 대화 세션 시작됨');
            }
        }

        // 버튼에 새 대화 시작 핸들러 연결
        const newChatBtn = document.getElementById('new-chat-btn');
        if (newChatBtn) {
            newChatBtn.addEventListener('click', startNewConversation);
        }

        function addMessage(role, content) {
            const messageDiv = document.createElement('div');
            messageDiv.className = 'chat-message ' + role;
            messageDiv.innerHTML = '<div class="markdown-body">' + marked.parse(content) + '</div>';
            chatMessages.appendChild(messageDiv);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }

        function addTypingIndicator() {
            const typingDiv = document.createElement('div');
            typingDiv.className = 'chat-message typing';
            typingDiv.innerHTML = '<div class="typing-indicator"><span></span><span></span><span></span></div>';
            chatMessages.appendChild(typingDiv);
            chatMessages.scrollTop = chatMessages.scrollHeight;
            return typingDiv;
        }

        function removeTypingIndicator(typingDiv) {
            if (typingDiv && typingDiv.parentNode) {
                typingDiv.parentNode.removeChild(typingDiv);
            }
        }

        sendBtn.addEventListener('click', sendMessage);
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });

        // AI 게임 생성기 (대화형)
        let generatorSessionId = null;
        let currentStage = 'initial';
        const generatorChatMessages = document.getElementById('generator-chat-messages');
        const generatorChatInput = document.getElementById('generator-chat-input');
        const generatorSendBtn = document.getElementById('generator-send-btn');
        const generateActionArea = document.getElementById('generate-action-area');
        const finalGenerateBtn = document.getElementById('final-generate-btn');
        const modifyRequirementsBtn = document.getElementById('modify-requirements-btn');

        // 메시지 추가 함수
        function addGeneratorMessage(content, isBot = false) {
            const messageDiv = document.createElement('div');
            messageDiv.className = 'chat-message ' + (isBot ? 'bot' : 'user');
            messageDiv.innerHTML = '<div class="message-content">' + content + '</div>';
            generatorChatMessages.appendChild(messageDiv);
            generatorChatMessages.scrollTop = generatorChatMessages.scrollHeight;
        }

        // ✨ Phase 2: 정보 패널 업데이트 함수
        function updateInfoPanel(metadata) {
            if (!metadata) return;

            // 1️⃣ 진행률 바 업데이트
            const completeness = metadata.infoCompleteness || 0;
            const progressBar = document.getElementById('info-progress-bar');
            const completenessText = document.getElementById('completeness-percentage');

            if (progressBar && completenessText) {
                progressBar.style.width = completeness + '%';
                completenessText.textContent = completeness + '%';
            }

            // 2️⃣ 준비 상태 배지 업데이트
            const readyBadge = document.getElementById('readiness-badge');
            const generateBtn = document.getElementById('cmd-generate-btn');

            if (readyBadge) {
                if (metadata.readyToGenerate) {
                    readyBadge.className = 'readiness-badge ready';
                    readyBadge.textContent = '✅ 게임 생성 준비 완료';
                    if (generateBtn) generateBtn.disabled = false;
                } else {
                    readyBadge.className = 'readiness-badge not-ready';
                    if (completeness < 30) {
                        readyBadge.textContent = '⏳ 더 많은 정보가 필요합니다';
                    } else if (completeness < 60) {
                        readyBadge.textContent = '🔄 정보 수집 중...';
                    } else {
                        readyBadge.textContent = '🎯 거의 완성! 조금만 더...';
                    }
                    if (generateBtn) generateBtn.disabled = true;
                }
            }

            // 3️⃣ 수집된 정보 업데이트
            if (metadata.collectedInfo) {
                const info = metadata.collectedInfo;

                // 게임 타입
                const gameTypeEl = document.getElementById('info-gameType');
                if (gameTypeEl) {
                    const typeMap = { 'solo': '🎮 1인 플레이', 'dual': '👥 2인 협력', 'multi': '🏆 다중 경쟁' };
                    gameTypeEl.textContent = info.gameType ? (typeMap[info.gameType] || info.gameType) : '미정';
                }

                // 장르
                const genreEl = document.getElementById('info-genre');
                if (genreEl) {
                    genreEl.textContent = info.genre || '미정';
                }

                // 센서 사용
                const sensorEl = document.getElementById('info-sensorUsage');
                if (sensorEl) {
                    if (info.sensorUsage && info.sensorUsage.length > 0) {
                        sensorEl.innerHTML = info.sensorUsage.map(s => '• ' + s).join('<br>');
                    } else {
                        sensorEl.textContent = '없음';
                    }
                }

                // 난이도
                const difficultyEl = document.getElementById('info-difficulty');
                if (difficultyEl) {
                    const diffMap = { '쉬움': '😊 쉬움', '보통': '😐 보통', '어려움': '😤 어려움' };
                    difficultyEl.textContent = info.difficulty ? (diffMap[info.difficulty] || info.difficulty) : '미정';
                }

                // 핵심 메카닉
                const mechanicsEl = document.getElementById('info-mechanics');
                if (mechanicsEl) {
                    if (info.mechanics && info.mechanics.length > 0) {
                        mechanicsEl.innerHTML = info.mechanics.map(m => '• ' + m).join('<br>');
                    } else {
                        mechanicsEl.textContent = '없음';
                    }
                }

                // 추가 기능
                const featuresEl = document.getElementById('info-features');
                if (featuresEl) {
                    if (info.additionalFeatures && info.additionalFeatures.length > 0) {
                        featuresEl.innerHTML = info.additionalFeatures.map(f => '• ' + f).join('<br>');
                    } else {
                        featuresEl.textContent = '없음';
                    }
                }
            }

            console.log('✅ 정보 패널 업데이트 완료:', metadata);
        }

        // 레거시: 진행 단계 업데이트 함수 (4단계 시스템, 하위 호환)
        function updateGeneratorProgress(stage) {
            const stageMap = {
                'initial': 1,
                'details': 2,
                'mechanics': 3,
                'confirmation': 4
            };
            const stepNumber = stageMap[stage] || 1;

            document.querySelectorAll('.progress-step').forEach((step, index) => {
                if (index < stepNumber) {
                    step.classList.add('active');
                } else {
                    step.classList.remove('active');
                }
            });

            currentStage = stage;

            // 레거시: generate-action-area 처리 (더 이상 사용하지 않음)
            const generateActionArea = document.getElementById('generate-action-area');
            if (generateActionArea) {
                if (stage === 'confirmation') {
                    generateActionArea.classList.remove('hidden');
                } else {
                    generateActionArea.classList.add('hidden');
                }
            }
        }

        // 세션 초기화 함수
        async function initGeneratorSession() {
            if (generatorSessionId) return; // 이미 세션이 있으면 리턴

            try {
                const response = await fetch('/developer/api/start-game-session', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        initialMessage: ''
                    })
                });

                const data = await response.json();

                if (data.success) {
                    generatorSessionId = data.sessionId;
                    console.log('✅ 게임 생성 세션 초기화 완료:', generatorSessionId);
                } else {
                    console.error('❌ 세션 초기화 실패:', data.error);
                }
            } catch (error) {
                console.error('❌ 세션 초기화 오류:', error);
            }
        }

        // 대화 전송
        async function sendGeneratorMessage() {
            const message = generatorChatInput.value.trim();
            if (!message) return;

            // 세션이 없으면 생성
            if (!generatorSessionId) {
                await initGeneratorSession();
            }

            addGeneratorMessage(message, false);
            generatorChatInput.value = '';
            generatorSendBtn.disabled = true;

            try {
                const response = await fetch('/developer/api/game-chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        sessionId: generatorSessionId,
                        message: message
                    })
                });

                const data = await response.json();

                if (data.success) {
                    addGeneratorMessage(data.message, true);

                    if (data.sessionId) {
                        generatorSessionId = data.sessionId;
                    }

                    // ✨ 메타데이터 처리 (Phase 2)
                    if (data.metadata) {
                        updateInfoPanel(data.metadata);
                    }

                    // 레거시: stage 처리 (하위 호환)
                    if (data.stage) {
                        updateGeneratorProgress(data.stage);
                    }
                } else {
                    addGeneratorMessage('❌ ' + data.error, true);
                }
            } catch (error) {
                addGeneratorMessage('❌ 오류가 발생했습니다.', true);
            }

            generatorSendBtn.disabled = false;
            generatorChatInput.focus();
        }

        generatorSendBtn.addEventListener('click', sendGeneratorMessage);
        generatorChatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendGeneratorMessage();
            }
        });

        // ✨ Phase 2: 명령 버튼 이벤트 핸들러
        const cmdSummaryBtn = document.getElementById('cmd-summary-btn');
        const cmdModifyBtn = document.getElementById('cmd-modify-btn');
        const cmdConfirmBtn = document.getElementById('cmd-confirm-btn');
        const cmdGenerateBtn = document.getElementById('cmd-generate-btn');

        if (cmdSummaryBtn) {
            cmdSummaryBtn.addEventListener('click', () => {
                generatorChatInput.value = '요약';
                sendGeneratorMessage();
            });
        }

        if (cmdModifyBtn) {
            cmdModifyBtn.addEventListener('click', () => {
                generatorChatInput.value = '수정';
                sendGeneratorMessage();
            });
        }

        if (cmdConfirmBtn) {
            cmdConfirmBtn.addEventListener('click', () => {
                generatorChatInput.value = '확인';
                sendGeneratorMessage();
            });
        }

        if (cmdGenerateBtn) {
            cmdGenerateBtn.addEventListener('click', () => {
                generatorChatInput.value = '생성';
                sendGeneratorMessage();
            });
        }

        // 🔗 Socket.IO 연결 및 진행률 이벤트 리스너
        const socket = io();

        socket.on('game-generation-progress', (data) => {
            console.log('📡 진행률 이벤트 수신:', data);

            // 현재 세션의 이벤트만 처리
            if (data.sessionId !== generatorSessionId) return;

            // 진행률 UI 업데이트
            updateProgressUI(data.step, data.percentage, data.message);
        });

        // 진행률 UI 업데이트 함수
        function updateProgressUI(step, percentage, message) {
            // 진행률 바 업데이트
            const progressBar = document.getElementById('generation-progress-bar');
            const progressText = document.getElementById('generation-progress-text');

            if (progressBar) {
                progressBar.style.width = percentage + '%';
            }
            if (progressText) {
                progressText.textContent = percentage + '%';
            }

            // 각 단계 아이콘 업데이트
            for (let i = 1; i <= 5; i++) {
                const stepEl = document.querySelector(\`[data-gen-step="\${i}"]\`);
                if (!stepEl) continue;

                const iconEl = stepEl.querySelector('.gen-step-icon');
                const textEl = stepEl.querySelector('.gen-step-text');

                if (i < step) {
                    // 완료된 단계
                    iconEl.textContent = '✅';
                    stepEl.style.opacity = '0.6';
                } else if (i === step) {
                    // 현재 진행 중인 단계
                    iconEl.textContent = '⏳';
                    stepEl.style.opacity = '1';
                    stepEl.style.fontWeight = 'bold';
                    if (textEl && message) {
                        textEl.textContent = message;
                    }
                } else {
                    // 대기 중인 단계
                    iconEl.textContent = '⏳';
                    stepEl.style.opacity = '0.4';
                }
            }
        }

        // 최종 게임 생성
        finalGenerateBtn.addEventListener('click', async () => {
            if (!generatorSessionId) {
                alert('세션이 없습니다. 대화를 먼저 시작해주세요.');
                return;
            }

            // 생성 모달 표시 및 초기화
            const generationModal = document.getElementById('generation-modal');
            generationModal.classList.remove('hidden');
            finalGenerateBtn.disabled = true;

            // 진행률 초기화
            updateProgressUI(1, 0, '게임 생성 시작...');

            try {
                const response = await fetch('/developer/api/finalize-game', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        sessionId: generatorSessionId
                    })
                });

                const data = await response.json();

                // 완료 후 잠시 대기 (사용자가 100% 확인 가능)
                setTimeout(() => {
                    generationModal.classList.add('hidden');

                    if (data.success) {
                        // 결과 모달 표시
                        showResultModal(data);
                    } else {
                        addGeneratorMessage('❌ 게임 생성 실패: ' + data.error, true);
                    }
                }, 1000);

            } catch (error) {
                generationModal.classList.add('hidden');
                addGeneratorMessage('❌ 오류가 발생했습니다.', true);
            }

            finalGenerateBtn.disabled = false;
        });

        // 요구사항 수정
        modifyRequirementsBtn.addEventListener('click', () => {
            updateGeneratorProgress('mechanics');
            addGeneratorMessage('요구사항을 수정하려면 수정할 내용을 말씀해주세요.', true);
        });

        // 게임 데이터 저장 변수
        let currentGameData = null;

        // 결과 모달 표시
        function showResultModal(data) {
            const resultModal = document.getElementById('result-modal');
            const resultContent = document.getElementById('result-content');
            const playGameBtn = document.getElementById('play-game-btn');

            // 게임 데이터 저장
            currentGameData = data;

            // 결과 내용 표시
            let contentHtml = '<p style="color: #94A3B8; margin-bottom: 1rem;">게임이 성공적으로 생성되었습니다!</p>';

            if (data.metadata) {
                contentHtml += '<div style="background: rgba(30, 41, 59, 0.5); padding: 1rem; border-radius: 0.5rem; margin-bottom: 1rem;">';
                contentHtml += '<p style="color: #CBD5E1; margin-bottom: 0.5rem;"><strong>게임 ID:</strong> ' + data.gameId + '</p>';
                contentHtml += '<p style="color: #CBD5E1; margin-bottom: 0.5rem;"><strong>게임 이름:</strong> ' + (data.metadata.gameName || '미지정') + '</p>';
                contentHtml += '<p style="color: #CBD5E1; margin-bottom: 0.5rem;"><strong>게임 타입:</strong> ' + (data.metadata.gameType || 'solo') + '</p>';
                if (data.validationScore) {
                    contentHtml += '<p style="color: #CBD5E1;"><strong>검증 점수:</strong> ' + (data.validationScore.totalScore || 0) + '/100</p>';
                }
                contentHtml += '</div>';
            }

            resultContent.innerHTML = contentHtml;
            playGameBtn.href = data.gameUrl || '/games';

            resultModal.classList.remove('hidden');
        }

        // 결과 모달 닫기
        document.getElementById('close-result-modal').addEventListener('click', () => {
            document.getElementById('result-modal').classList.add('hidden');
        });

        // 새 게임 만들기
        document.getElementById('new-game-btn').addEventListener('click', () => {
            document.getElementById('result-modal').classList.add('hidden');
            currentGameData = null;
            generatorSessionId = null;
            currentStage = 'initial';
            generatorChatMessages.innerHTML = '<div class="chat-message bot"><div class="message-content">🎮 <strong>Sensor Game Hub 대화형 게임 생성기에 오신 것을 환영합니다!</strong><br><br>저는 여러분의 게임 아이디어를 현실로 만들어드리는 AI 개발 파트너입니다.<br><br><strong>어떤 게임을 만들고 싶으신가요?</strong><br><br>예를 들어:<br>• "스마트폰을 기울여서 공을 굴리는 미로 게임"<br>• "친구와 함께 흔들어서 요리하는 협력 게임"<br>• "여러 명이 경쟁하는 반응속도 테스트 게임"<br><br>💡 아이디어를 자유롭게 말씀해주세요!</div></div>';
            updateGeneratorProgress('initial');
        });

        // Quick Links
        document.querySelectorAll('.quick-link').forEach(link => {
            link.addEventListener('click', () => {
                const tab = link.dataset.tab;
                document.querySelector('[data-tab="' + tab + '"]').click();
            });
        });

        // marked 라이브러리 로드 (CDN)
        if (typeof marked === 'undefined') {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/marked@11.1.1/marked.min.js';
            document.head.appendChild(script);
        }
    </script>
</body>
</html>
        `;

        res.send(html);
    }

    /**
     * 사이드바 HTML 생성
     */
    generateSidebarHTML() {
        let html = '';

        for (const [category, docs] of Object.entries(this.documentTree)) {
            html += `
            <div class="sidebar-section">
                <h3 class="section-title">${category}</h3>
                <ul class="doc-list">
            `;

            for (const doc of docs) {
                const docUrl = doc.path.includes('/')
                    ? `/docs/${doc.path}`
                    : `/docs/${doc.path}`;

                html += `
                    <li class="doc-item">
                        <a href="#" class="doc-link" data-path="${docUrl}">
                            ${doc.title}
                        </a>
                    </li>
                `;
            }

            html += `
                </ul>
            </div>
            `;
        }

        return html;
    }

    /**
     * 웰컴 화면 HTML 생성
     */
    generateWelcomeHTML() {
        return `
        <div class="welcome-screen">
            <div class="welcome-icon">👨‍💻</div>
            <h2 class="welcome-title">Sensor Game Hub Developer Center</h2>
            <p class="welcome-text">
                센서 게임 개발을 위한 모든 것이 여기에 있습니다.<br>
                35개의 문서, AI 챗봇, 게임 생성기를 활용하세요.
            </p>

            <div class="quick-links">
                <div class="quick-link" data-tab="docs">
                    <div class="quick-link-icon">📚</div>
                    <div class="quick-link-text">문서 보기</div>
                </div>
                <div class="quick-link" data-tab="chat">
                    <div class="quick-link-icon">💬</div>
                    <div class="quick-link-text">AI 챗봇</div>
                </div>
            </div>
        </div>
        `;
    }

    /**
     * 챗봇 HTML 생성
     */
    generateChatHTML() {
        return `
        <div class="chat-container">
            <div class="chat-messages" id="chat-messages">
                <div class="chat-message assistant">
                    <div class="markdown-body">
                        <p>👋 안녕하세요! Sensor Game Hub AI 어시스턴트입니다.</p>
                        <p>센서 게임 개발에 대해 무엇이든 물어보세요. 616개의 벡터 임베딩으로 정확한 답변을 제공합니다.</p>
                    </div>
                </div>
            </div>
            <div class="chat-input-area">
                <textarea
                    id="chat-input"
                    class="chat-input"
                    placeholder="센서 게임 개발에 대해 질문하세요... (Shift+Enter: 줄바꿈, Enter: 전송)"
                ></textarea>
                <div style="display: flex; gap: 0.75rem;">
                    <button id="new-chat-btn" class="send-btn" style="flex: 0 0 auto; background: linear-gradient(135deg, #10B981, #059669); padding: 1rem 1.5rem;">
                        🔄 새 대화
                    </button>
                    <button id="send-btn" class="send-btn" style="flex: 1;">전송</button>
                </div>
            </div>
        </div>
        `;
    }

    /**
     * 게임 생성기 HTML 생성 (대화형 인터페이스)
     */
    generateGeneratorHTML() {
        return `
        <div class="generator-container">
            <!-- 📊 정보 수집 진행률 바 (0-100%) -->
            <div class="info-completeness-bar">
                <div class="completeness-header">
                    <span class="completeness-label">📊 정보 수집 진행률</span>
                    <span id="completeness-percentage" class="completeness-value">0%</span>
                </div>
                <div class="progress-bar-container">
                    <div id="info-progress-bar" class="info-progress-fill" style="width: 0%"></div>
                </div>
                <div class="completeness-status">
                    <span id="readiness-badge" class="readiness-badge not-ready">⏳ 더 많은 정보가 필요합니다</span>
                </div>
            </div>

            <!-- 2열 레이아웃 (채팅 + 정보 패널) -->
            <div class="generator-main-layout">
                <!-- 왼쪽: 대화형 채팅 영역 -->
                <div class="generator-chat-container">
                <div id="generator-chat-messages" class="generator-chat-messages">
                    <div class="chat-message bot">
                        <div class="message-content">
                            🎮 <strong>Sensor Game Hub 대화형 게임 생성기에 오신 것을 환영합니다!</strong><br><br>
                            저는 여러분의 게임 아이디어를 현실로 만들어드리는 AI 개발 파트너입니다.<br><br>
                            <strong>어떤 게임을 만들고 싶으신가요?</strong><br><br>
                            예를 들어:<br>
                            • "스마트폰을 기울여서 공을 굴리는 미로 게임"<br>
                            • "친구와 함께 흔들어서 요리하는 협력 게임"<br>
                            • "여러 명이 경쟁하는 반응속도 테스트 게임"<br><br>
                            💡 아이디어를 자유롭게 말씀해주세요!
                        </div>
                    </div>
                </div>

                <!-- 명령 버튼 영역 -->
                <div class="command-buttons-area">
                    <button id="cmd-summary-btn" class="command-btn" title="지금까지 수집된 정보 요약">
                        📋 요약
                    </button>
                    <button id="cmd-modify-btn" class="command-btn" title="특정 정보 수정">
                        ✏️ 수정
                    </button>
                    <button id="cmd-confirm-btn" class="command-btn" title="정보 확인 및 생성 준비">
                        ✓ 확인
                    </button>
                    <button id="cmd-generate-btn" class="command-btn generate" title="게임 생성 시작" disabled>
                        🚀 생성
                    </button>
                </div>

                <!-- 입력 영역 -->
                <div class="generator-chat-input-area">
                    <input
                        type="text"
                        id="generator-chat-input"
                        class="generator-chat-input"
                        placeholder="게임 아이디어를 입력하세요... (명령: 요약/수정/확인/생성)"
                    >
                    <button id="generator-send-btn" class="generator-send-btn">
                        <span>전송</span>
                    </button>
                </div>
            </div>

            <!-- 오른쪽: 정보 수집 패널 -->
            <div class="info-collection-panel">
                <div class="panel-header">
                    <h3 class="panel-title">📝 수집된 정보</h3>
                </div>
                <div class="panel-content">
                    <div class="info-section">
                        <div class="info-label">🎮 게임 타입</div>
                        <div id="info-gameType" class="info-value">미정</div>
                    </div>
                    <div class="info-section">
                        <div class="info-label">🎯 장르</div>
                        <div id="info-genre" class="info-value">미정</div>
                    </div>
                    <div class="info-section">
                        <div class="info-label">📱 센서 사용</div>
                        <div id="info-sensorUsage" class="info-value info-list">없음</div>
                    </div>
                    <div class="info-section">
                        <div class="info-label">🎲 난이도</div>
                        <div id="info-difficulty" class="info-value">미정</div>
                    </div>
                    <div class="info-section">
                        <div class="info-label">⚙️ 핵심 메카닉</div>
                        <div id="info-mechanics" class="info-value info-list">없음</div>
                    </div>
                    <div class="info-section">
                        <div class="info-label">✨ 추가 기능</div>
                        <div id="info-features" class="info-value info-list">없음</div>
                    </div>
                </div>
            </div>
        </div>

            <!-- 게임 생성 진행 모달 -->
            <div id="generation-modal" class="generation-modal hidden">
                <div class="modal-content">
                    <h3 class="modal-title">🎮 게임 생성 중...</h3>
                    <div class="generation-steps">
                        <div class="gen-step" data-gen-step="1">
                            <div class="gen-step-icon">⏳</div>
                            <div class="gen-step-text">게임 아이디어 분석 중...</div>
                        </div>
                        <div class="gen-step" data-gen-step="2">
                            <div class="gen-step-icon">⏳</div>
                            <div class="gen-step-text">관련 문서 검색 중... (616개 임베딩)</div>
                        </div>
                        <div class="gen-step" data-gen-step="3">
                            <div class="gen-step-icon">⏳</div>
                            <div class="gen-step-text">Claude AI로 게임 코드 생성 중...</div>
                        </div>
                        <div class="gen-step" data-gen-step="4">
                            <div class="gen-step-icon">⏳</div>
                            <div class="gen-step-text">게임 코드 검증 중...</div>
                        </div>
                        <div class="gen-step" data-gen-step="5">
                            <div class="gen-step-icon">⏳</div>
                            <div class="gen-step-text">게임 파일 저장 및 등록 중...</div>
                        </div>
                    </div>
                    <div class="generation-progress">
                        <div class="progress-bar-container">
                            <div id="generation-progress-bar" class="progress-bar" style="width: 0%"></div>
                        </div>
                        <p id="generation-progress-text" class="progress-percentage">0%</p>
                    </div>
                </div>
            </div>

            <!-- 결과 모달 -->
            <div id="result-modal" class="result-modal hidden">
                <div class="modal-content">
                    <button class="modal-close" id="close-result-modal">×</button>
                    <h3 class="modal-title">✅ 게임 생성 완료!</h3>
                    <div id="result-content" class="result-content">
                        <!-- 동적으로 채워짐 -->
                    </div>
                    <div class="result-actions">
                        <a id="play-game-btn" class="result-btn primary" href="#" target="_blank">
                            🎮 바로 플레이하기
                        </a>
                        <button id="new-game-btn" class="result-btn secondary">
                            🔄 새 게임 만들기
                        </button>
                    </div>
                </div>
            </div>
        </div>
        `;
    }

    /**
     * 게임 관리 HTML 생성
     */
    generateGameManagerHTML() {
        return `
        <div class="game-manager-container">
            <div class="manager-header">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 2rem;">
                    <div>
                        <h2 style="font-size: 2rem; font-weight: 700; margin-bottom: 0.5rem; background: linear-gradient(135deg, #A78BFA, #EC4899); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">
                            🛠️ 게임 관리
                        </h2>
                        <p style="color: #94A3B8;">생성된 게임을 관리하고 개선하세요</p>
                    </div>
                    <button onclick="openUploadModal()" style="padding: 0.75rem 1.5rem; border-radius: 8px; background: linear-gradient(135deg, #10B981, #059669); color: white; border: none; font-size: 1rem; font-weight: 600; cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 6px rgba(16, 185, 129, 0.3);">
                        📤 게임 업로드
                    </button>
                </div>
            </div>

            <div class="search-bar" style="margin-bottom: 2rem;">
                <input
                    type="text"
                    id="manager-search-input"
                    placeholder="🔍 게임 검색 (제목 또는 ID)..."
                    style="flex: 1; min-width: 250px; padding: 0.75rem 1rem; border-radius: 8px; border: 1px solid rgba(100, 116, 139, 0.3); background: rgba(30, 41, 59, 0.6); color: #F8FAFC; font-size: 1rem;"
                    onkeyup="filterManagerGames()"
                >
            </div>

            <div id="manager-games-grid" class="games-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(450px, 1fr)); gap: 1.5rem;">
                <p style="text-align: center; color: #94A3B8; grid-column: 1 / -1;">게임을 불러오는 중...</p>
            </div>
        </div>

        <!-- 버그 리포트 모달 -->
        <div id="manager-bug-modal" class="modal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.7); backdrop-filter: blur(4px); z-index: 1000; align-items: center; justify-content: center;">
            <div class="modal-content" style="background: rgba(30, 41, 59, 0.95); border: 1px solid rgba(139, 92, 246, 0.5); border-radius: 16px; padding: 2rem; max-width: 500px; width: 90%;">
                <div class="modal-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                    <h3 style="font-size: 1.5rem; font-weight: 600; color: #E2E8F0;">🐛 버그 신고</h3>
                    <button class="modal-close" onclick="closeManagerBugModal()" style="background: none; border: none; font-size: 1.5rem; color: #94A3B8; cursor: pointer;">×</button>
                </div>
                <textarea id="manager-bug-description" placeholder="버그 설명을 입력하세요...&#10;예: 공이 패들에 붙어서 떨어지지 않습니다." style="width: 100%; min-height: 120px; padding: 0.75rem; border-radius: 8px; border: 1px solid rgba(100, 116, 139, 0.3); background: rgba(15, 23, 42, 0.6); color: #F8FAFC; font-family: inherit; font-size: 0.95rem; resize: vertical; margin-bottom: 1rem;"></textarea>
                <button onclick="submitManagerBugReport()" style="width: 100%; padding: 0.75rem 1.5rem; border-radius: 8px; background: linear-gradient(135deg, #8B5CF6, #7C3AED); color: white; border: none; font-weight: 500; cursor: pointer; transition: all 0.2s;">제출</button>
                <div id="manager-bug-loading" style="display: none; text-align: center; color: #8B5CF6; margin-top: 1rem;">처리 중...</div>
            </div>
        </div>

        <!-- 기능 추가 모달 -->
        <div id="manager-feature-modal" class="modal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.7); backdrop-filter: blur(4px); z-index: 1000; align-items: center; justify-content: center;">
            <div class="modal-content" style="background: rgba(30, 41, 59, 0.95); border: 1px solid rgba(139, 92, 246, 0.5); border-radius: 16px; padding: 2rem; max-width: 500px; width: 90%;">
                <div class="modal-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                    <h3 style="font-size: 1.5rem; font-weight: 600; color: #E2E8F0;">✨ 기능 추가</h3>
                    <button class="modal-close" onclick="closeManagerFeatureModal()" style="background: none; border: none; font-size: 1.5rem; color: #94A3B8; cursor: pointer;">×</button>
                </div>
                <textarea id="manager-feature-description" placeholder="추가할 기능을 설명하세요...&#10;예: 60초 타이머를 추가해주세요" style="width: 100%; min-height: 120px; padding: 0.75rem; border-radius: 8px; border: 1px solid rgba(100, 116, 139, 0.3); background: rgba(15, 23, 42, 0.6); color: #F8FAFC; font-family: inherit; font-size: 0.95rem; resize: vertical; margin-bottom: 1rem;"></textarea>
                <button onclick="submitManagerFeatureRequest()" style="width: 100%; padding: 0.75rem 1.5rem; border-radius: 8px; background: linear-gradient(135deg, #8B5CF6, #7C3AED); color: white; border: none; font-weight: 500; cursor: pointer; transition: all 0.2s;">제출</button>
                <div id="manager-feature-loading" style="display: none; text-align: center; color: #8B5CF6; margin-top: 1rem;">처리 중...</div>
            </div>
        </div>

        <!-- 이력 모달 -->
        <div id="manager-history-modal" class="modal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.7); backdrop-filter: blur(4px); z-index: 1000; align-items: center; justify-content: center;">
            <div class="modal-content" style="background: rgba(30, 41, 59, 0.95); border: 1px solid rgba(139, 92, 246, 0.5); border-radius: 16px; padding: 2rem; max-width: 600px; width: 90%; max-height: 80vh; overflow-y: auto;">
                <div class="modal-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                    <h3 style="font-size: 1.5rem; font-weight: 600; color: #E2E8F0;">📜 수정 이력</h3>
                    <button class="modal-close" onclick="closeManagerHistoryModal()" style="background: none; border: none; font-size: 1.5rem; color: #94A3B8; cursor: pointer;">×</button>
                </div>
                <div id="manager-history-content" style="color: #CBD5E1;">
                    로딩 중...
                </div>
            </div>
        </div>

        <!-- 게임 업로드 모달 -->
        <div id="upload-modal" class="modal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.7); backdrop-filter: blur(4px); z-index: 1000; align-items: center; justify-content: center;">
            <div class="modal-content" style="background: rgba(30, 41, 59, 0.95); border: 1px solid rgba(16, 185, 129, 0.5); border-radius: 16px; padding: 2rem; max-width: 500px; width: 90%;">
                <div class="modal-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                    <h3 style="font-size: 1.5rem; font-weight: 600; color: #E2E8F0;">📤 게임 업로드</h3>
                    <button class="modal-close" onclick="closeUploadModal()" style="background: none; border: none; font-size: 1.5rem; color: #94A3B8; cursor: pointer;">×</button>
                </div>
                <div style="margin-bottom: 1.5rem;">
                    <label style="display: block; color: #CBD5E1; margin-bottom: 0.5rem; font-weight: 500;">게임 파일 선택</label>
                    <div style="background: rgba(15, 23, 42, 0.6); border: 2px dashed rgba(16, 185, 129, 0.5); border-radius: 12px; padding: 2rem; text-align: center; cursor: pointer; transition: all 0.2s;" onclick="document.getElementById('upload-file-input').click()">
                        <div style="font-size: 3rem; margin-bottom: 0.5rem;">📁</div>
                        <div style="color: #10B981; font-weight: 500; margin-bottom: 0.25rem;">클릭하여 파일 선택</div>
                        <div style="color: #94A3B8; font-size: 0.875rem;">ZIP 파일 또는 여러 개의 게임 파일</div>
                        <div style="color: #94A3B8; font-size: 0.75rem; margin-top: 0.5rem;">최대 50MB</div>
                    </div>
                    <input
                        type="file"
                        id="upload-file-input"
                        multiple
                        accept=".zip,.html,.js,.css,.json,.png,.jpg,.jpeg,.svg,.mp3,.wav"
                        style="display: none;"
                        onchange="handleFileSelect(this.files)"
                    />
                </div>
                <div id="upload-file-list" style="margin-bottom: 1rem; max-height: 200px; overflow-y: auto;"></div>
                <button id="upload-submit-btn" onclick="handleUploadSubmit()" disabled style="width: 100%; padding: 0.75rem 1.5rem; border-radius: 8px; background: linear-gradient(135deg, #10B981, #059669); color: white; border: none; font-weight: 500; cursor: pointer; transition: all 0.2s; opacity: 0.5;">업로드</button>
                <div id="upload-progress" style="display: none; margin-top: 1rem;">
                    <div style="background: rgba(15, 23, 42, 0.6); border-radius: 8px; height: 8px; overflow: hidden;">
                        <div id="upload-progress-bar" style="background: linear-gradient(135deg, #10B981, #059669); height: 100%; width: 0%; transition: width 0.3s;"></div>
                    </div>
                    <div id="upload-status" style="text-align: center; color: #10B981; margin-top: 0.5rem; font-size: 0.875rem;">업로드 중...</div>
                </div>
            </div>
        </div>

        <script>
            let currentManagerGameId = null;

            // 게임 목록 로드
            async function loadManagerGames() {
                try {
                    // 현재 사용자 정보 가져오기
                    const token = localStorage.getItem('authToken');
                    let currentUser = null;
                    let isAdmin = false;

                    if (token) {
                        try {
                            const userResponse = await fetch('/api/auth/user', {
                                headers: { 'Authorization': \`Bearer \${token}\` }
                            });
                            const userData = await userResponse.json();
                            console.log('🔍 사용자 정보 조회:', userData);

                            if (userData.success) {
                                currentUser = userData.user;
                                isAdmin = currentUser.email === 'admin@admin.com';
                                console.log('👤 현재 사용자:', currentUser.email);
                                console.log('👑 관리자 여부:', isAdmin);
                            } else {
                                console.error('❌ 사용자 정보 조회 실패:', userData);
                            }
                        } catch (error) {
                            console.error('❌ 사용자 정보 조회 오류:', error);
                        }
                    } else {
                        console.warn('⚠️ 토큰이 없습니다.');
                    }

                    const response = await fetch('/api/games');
                    const data = await response.json();

                    if (data.success && data.data) {
                        const gamesGrid = document.getElementById('manager-games-grid');
                        const games = data.data;

                        if (games.length === 0) {
                            gamesGrid.innerHTML = '<p style="text-align: center; color: #94A3B8; grid-column: 1 / -1;">생성된 게임이 없습니다.</p>';
                            return;
                        }

                        console.log('🎮 전체 게임 목록:', games.length, '개');
                        console.log('📋 현재 사용자 ID:', currentUser?.id);
                        console.log('👑 관리자 여부:', isAdmin);

                        gamesGrid.innerHTML = games.map(game => {
                            // 현재 사용자가 이 게임의 소유자인지 확인
                            const isOwner = currentUser && game.creator_id === currentUser.id;
                            const canModify = isAdmin || isOwner;

                            console.log(\`🎯 게임: \${game.id}, creator_id: \${game.creator_id}, isOwner: \${isOwner}, canModify: \${canModify}\`);

                            // 권한 배지
                            const permissionBadge = isAdmin
                                ? '<span style="padding: 0.25rem 0.5rem; margin-left: 0.5rem; border-radius: 8px; font-size: 0.7rem; font-weight: 600; background: rgba(239, 68, 68, 0.2); color: #EF4444; border: 1px solid #EF4444;">👑 관리자</span>'
                                : isOwner
                                    ? '<span style="padding: 0.25rem 0.5rem; margin-left: 0.5rem; border-radius: 8px; font-size: 0.7rem; font-weight: 600; background: rgba(16, 185, 129, 0.2); color: #10B981; border: 1px solid #10B981;">✓ 내 게임</span>'
                                    : '<span style="padding: 0.25rem 0.5rem; margin-left: 0.5rem; border-radius: 8px; font-size: 0.7rem; font-weight: 600; background: rgba(71, 85, 105, 0.2); color: #94A3B8; border: 1px solid #64748B;">🔒 읽기 전용</span>';

                            return \`
                            <div class="game-card" data-game-id="\${game.id}" style="background: rgba(30, 41, 59, 0.6); border: 1px solid rgba(100, 116, 139, 0.3); border-radius: 16px; padding: 1.5rem; transition: all 0.3s;">
                                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
                                    <div>
                                        <div style="display: flex; align-items: center;">
                                            <div style="font-size: 1.25rem; font-weight: 600; color: #E2E8F0; margin-bottom: 0.25rem;">\${game.title || game.id}</div>
                                            \${permissionBadge}
                                        </div>
                                        <div style="font-size: 0.875rem; color: #94A3B8;">\${game.id}</div>
                                    </div>
                                    <span style="padding: 0.25rem 0.75rem; border-radius: 12px; font-size: 0.75rem; font-weight: 600; background: rgba(16, 185, 129, 0.2); color: #10B981; border: 1px solid #10B981;">v\${game.version || '1.0'}</span>
                                </div>
                                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.5rem; margin-top: 1rem;">
                                    <button onclick="playManagerGame('\${game.id}')" style="padding: 0.5rem 1rem; border-radius: 8px; background: linear-gradient(135deg, #8B5CF6, #7C3AED); color: white; border: none; font-size: 0.875rem; font-weight: 500; cursor: pointer; transition: all 0.2s;">▶️ 플레이</button>
                                    <button onclick="downloadManagerGame('\${game.id}')" style="padding: 0.5rem 1rem; border-radius: 8px; background: rgba(59, 130, 246, 0.2); color: #3B82F6; border: 1px solid #3B82F6; font-size: 0.875rem; font-weight: 500; cursor: pointer; transition: all 0.2s;">📥 다운로드</button>
                                    <button onclick="deleteManagerGame('\${game.id}')" \${!canModify ? 'disabled' : ''} style="padding: 0.5rem 1rem; border-radius: 8px; background: rgba(239, 68, 68, 0.2); color: #EF4444; border: 1px solid #EF4444; font-size: 0.875rem; font-weight: 500; cursor: \${canModify ? 'pointer' : 'not-allowed'}; transition: all 0.2s; opacity: \${canModify ? '1' : '0.5'};">🗑️ 삭제</button>
                                    <button onclick="openManagerBugModal('\${game.id}')" \${!canModify ? 'disabled' : ''} style="padding: 0.5rem 1rem; border-radius: 8px; background: rgba(71, 85, 105, 0.5); color: #E2E8F0; border: 1px solid rgba(100, 116, 139, 0.5); font-size: 0.875rem; font-weight: 500; cursor: \${canModify ? 'pointer' : 'not-allowed'}; transition: all 0.2s; opacity: \${canModify ? '1' : '0.5'};">🐛 버그 신고</button>
                                    <button onclick="openManagerFeatureModal('\${game.id}')" \${!canModify ? 'disabled' : ''} style="padding: 0.5rem 1rem; border-radius: 8px; background: rgba(71, 85, 105, 0.5); color: #E2E8F0; border: 1px solid rgba(100, 116, 139, 0.5); font-size: 0.875rem; font-weight: 500; cursor: \${canModify ? 'pointer' : 'not-allowed'}; transition: all 0.2s; opacity: \${canModify ? '1' : '0.5'};">✨ 기능 추가</button>
                                    <button onclick="viewManagerHistory('\${game.id}')" style="padding: 0.5rem 1rem; border-radius: 8px; background: rgba(71, 85, 105, 0.5); color: #E2E8F0; border: 1px solid rgba(100, 116, 139, 0.5); font-size: 0.875rem; font-weight: 500; cursor: pointer; transition: all 0.2s;">📜 이력</button>
                                </div>
                            </div>
                        \`;
                        }).join('');
                    }
                } catch (error) {
                    console.error('게임 목록 로드 실패:', error);
                    document.getElementById('manager-games-grid').innerHTML = '<p style="text-align: center; color: #EF4444; grid-column: 1 / -1;">게임 목록을 불러올 수 없습니다.</p>';
                }
            }

            function filterManagerGames() {
                const searchValue = document.getElementById('manager-search-input').value.toLowerCase();
                const gameCards = document.querySelectorAll('.game-card');

                gameCards.forEach(card => {
                    const gameId = card.dataset.gameId.toLowerCase();
                    const gameTitle = card.querySelector('div > div').textContent.toLowerCase();

                    if (gameId.includes(searchValue) || gameTitle.includes(searchValue)) {
                        card.style.display = 'block';
                    } else {
                        card.style.display = 'none';
                    }
                });
            }

            function playManagerGame(gameId) {
                window.open('/games/' + gameId, '_blank');
            }

            function openManagerBugModal(gameId) {
                currentManagerGameId = gameId;
                document.getElementById('manager-bug-modal').style.display = 'flex';
            }

            function closeManagerBugModal() {
                document.getElementById('manager-bug-modal').style.display = 'none';
                document.getElementById('manager-bug-description').value = '';
            }

            function openManagerFeatureModal(gameId) {
                currentManagerGameId = gameId;
                document.getElementById('manager-feature-modal').style.display = 'flex';
            }

            function closeManagerFeatureModal() {
                document.getElementById('manager-feature-modal').style.display = 'none';
                document.getElementById('manager-feature-description').value = '';
            }

            function closeManagerHistoryModal() {
                document.getElementById('manager-history-modal').style.display = 'none';
            }

            async function submitManagerBugReport() {
                const bugDescription = document.getElementById('manager-bug-description').value.trim();

                if (!bugDescription) {
                    alert('버그 설명을 입력해주세요.');
                    return;
                }

                // 🔐 토큰 확인
                const token = localStorage.getItem('authToken');
                if (!token) {
                    alert('⚠️ 로그인이 필요합니다.\\n\\n게임 관리 탭 상단의 "🔐 로그인" 버튼을 클릭하여 로그인해주세요.');
                    return;
                }

                const loadingEl = document.getElementById('manager-bug-loading');
                loadingEl.style.display = 'block';

                try {
                    const response = await fetch('/api/maintenance/report-bug', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': \`Bearer \${token}\`
                        },
                        body: JSON.stringify({
                            gameId: currentManagerGameId,
                            bugDescription: bugDescription
                        })
                    });

                    const data = await response.json();

                    if (response.status === 401) {
                        alert('⚠️ 로그인이 만료되었습니다.\\n\\n게임 관리 탭 상단의 "🔐 로그인" 버튼을 클릭하여 다시 로그인해주세요.');
                        closeManagerBugModal();
                        return;
                    }

                    if (data.success) {
                        alert('✅ 버그가 성공적으로 수정되었습니다!');
                        closeManagerBugModal();
                        loadManagerGames();
                    } else {
                        alert('❌ ' + (data.error || '버그 수정에 실패했습니다.'));
                    }
                } catch (error) {
                    console.error('버그 신고 실패:', error);
                    alert('❌ 오류가 발생했습니다.');
                } finally {
                    loadingEl.style.display = 'none';
                }
            }

            async function submitManagerFeatureRequest() {
                const featureDescription = document.getElementById('manager-feature-description').value.trim();

                if (!featureDescription) {
                    alert('추가할 기능을 입력해주세요.');
                    return;
                }

                // 🔐 토큰 확인
                const token = localStorage.getItem('authToken');
                if (!token) {
                    alert('⚠️ 로그인이 필요합니다.\\n\\n게임 관리 탭 상단의 "🔐 로그인" 버튼을 클릭하여 로그인해주세요.');
                    return;
                }

                const loadingEl = document.getElementById('manager-feature-loading');
                loadingEl.style.display = 'block';

                try {
                    const response = await fetch('/api/maintenance/add-feature', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': \`Bearer \${token}\`
                        },
                        body: JSON.stringify({
                            gameId: currentManagerGameId,
                            featureDescription: featureDescription
                        })
                    });

                    const data = await response.json();

                    if (response.status === 401) {
                        alert('⚠️ 로그인이 만료되었습니다.\\n\\n게임 관리 탭 상단의 "🔐 로그인" 버튼을 클릭하여 다시 로그인해주세요.');
                        closeManagerFeatureModal();
                        return;
                    }

                    if (data.success) {
                        alert('✅ 기능이 성공적으로 추가되었습니다!');
                        closeManagerFeatureModal();
                        loadManagerGames();
                    } else {
                        alert('❌ ' + (data.error || '기능 추가에 실패했습니다.'));
                    }
                } catch (error) {
                    console.error('기능 추가 실패:', error);
                    alert('❌ 오류가 발생했습니다.');
                } finally {
                    loadingEl.style.display = 'none';
                }
            }

            async function viewManagerHistory(gameId) {
                currentManagerGameId = gameId;
                document.getElementById('manager-history-modal').style.display = 'flex';
                document.getElementById('manager-history-content').innerHTML = '로딩 중...';

                try {
                    const response = await fetch('/api/maintenance/history/' + gameId);
                    const data = await response.json();

                    if (data.success && data.history && data.history.length > 0) {
                        const historyHtml = data.history.map(item => \`
                            <div style="padding: 1rem; background: rgba(15, 23, 42, 0.6); border-radius: 8px; margin-bottom: 1rem;">
                                <div style="color: #A5B4FC; font-weight: 600; margin-bottom: 0.5rem;">
                                    \${item.type === 'bug' ? '🐛 버그 수정' : '✨ 기능 추가'} - v\${item.version}
                                </div>
                                <div style="color: #CBD5E1; font-size: 0.875rem; margin-bottom: 0.5rem;">
                                    \${item.description}
                                </div>
                                <div style="color: #64748B; font-size: 0.75rem;">
                                    \${new Date(item.timestamp).toLocaleString('ko-KR')}
                                </div>
                            </div>
                        \`).join('');

                        document.getElementById('manager-history-content').innerHTML = historyHtml;
                    } else {
                        document.getElementById('manager-history-content').innerHTML = '<p style="text-align: center; color: #94A3B8;">수정 이력이 없습니다.</p>';
                    }
                } catch (error) {
                    console.error('이력 조회 실패:', error);
                    document.getElementById('manager-history-content').innerHTML = '<p style="text-align: center; color: #EF4444;">이력을 불러올 수 없습니다.</p>';
                }
            }

            // 🆕 업로드 모달 관련 함수들
            let selectedFiles = null;

            function openUploadModal() {
                document.getElementById('upload-modal').style.display = 'flex';
                selectedFiles = null;
                document.getElementById('upload-file-list').innerHTML = '';
                document.getElementById('upload-submit-btn').disabled = true;
                document.getElementById('upload-submit-btn').style.opacity = '0.5';
                document.getElementById('upload-file-input').value = '';
                document.getElementById('upload-progress').style.display = 'none';
            }

            function closeUploadModal() {
                document.getElementById('upload-modal').style.display = 'none';
                selectedFiles = null;
            }

            function handleFileSelect(files) {
                if (!files || files.length === 0) return;

                selectedFiles = files;
                const fileListEl = document.getElementById('upload-file-list');
                const submitBtn = document.getElementById('upload-submit-btn');

                // 파일 목록 표시
                const fileItems = Array.from(files).map(file => \`
                    <div style="padding: 0.5rem; background: rgba(15, 23, 42, 0.6); border-radius: 8px; margin-bottom: 0.5rem; display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <div style="color: #E2E8F0; font-size: 0.875rem;">\${file.name}</div>
                            <div style="color: #64748B; font-size: 0.75rem;">\${(file.size / 1024).toFixed(1)} KB</div>
                        </div>
                        <div style="color: #10B981;">✓</div>
                    </div>
                \`).join('');

                fileListEl.innerHTML = fileItems;
                submitBtn.disabled = false;
                submitBtn.style.opacity = '1';
            }

            async function handleUploadSubmit() {
                if (!selectedFiles || selectedFiles.length === 0) {
                    alert('파일을 선택해주세요.');
                    return;
                }

                const submitBtn = document.getElementById('upload-submit-btn');
                const progressEl = document.getElementById('upload-progress');
                const progressBar = document.getElementById('upload-progress-bar');
                const statusEl = document.getElementById('upload-status');

                submitBtn.disabled = true;
                submitBtn.style.opacity = '0.5';
                progressEl.style.display = 'block';
                progressBar.style.width = '0%';
                statusEl.textContent = '업로드 중...';

                try {
                    const formData = new FormData();
                    for (let i = 0; i < selectedFiles.length; i++) {
                        formData.append('files', selectedFiles[i]);
                    }

                    // 진행률 시뮬레이션 (실제 진행률은 서버에서 추적)
                    let progress = 0;
                    const progressInterval = setInterval(() => {
                        progress += 5;
                        if (progress <= 90) {
                            progressBar.style.width = progress + '%';
                        }
                    }, 100);

                    const response = await fetch('/developer/api/upload-game', {
                        method: 'POST',
                        body: formData
                    });

                    clearInterval(progressInterval);
                    progressBar.style.width = '100%';

                    const data = await response.json();

                    if (data.success) {
                        statusEl.textContent = '✅ 업로드 완료!';
                        statusEl.style.color = '#10B981';

                        setTimeout(() => {
                            closeUploadModal();
                            loadManagerGames();
                        }, 1000);
                    } else {
                        statusEl.textContent = '❌ ' + (data.error || '업로드 실패');
                        statusEl.style.color = '#EF4444';
                        submitBtn.disabled = false;
                        submitBtn.style.opacity = '1';
                    }
                } catch (error) {
                    console.error('업로드 실패:', error);
                    statusEl.textContent = '❌ 오류 발생';
                    statusEl.style.color = '#EF4444';
                    submitBtn.disabled = false;
                    submitBtn.style.opacity = '1';
                }
            }

            // 🆕 게임 다운로드
            async function downloadManagerGame(gameId) {
                try {
                    const response = await fetch(\`/developer/api/download-game/\${gameId}\`);

                    if (!response.ok) {
                        const errorData = await response.json();
                        alert('❌ ' + (errorData.error || '다운로드 실패'));
                        return;
                    }

                    // Blob으로 변환하여 다운로드
                    const blob = await response.blob();
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = \`\${gameId}.zip\`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    window.URL.revokeObjectURL(url);

                    alert('✅ 게임이 다운로드되었습니다!');
                } catch (error) {
                    console.error('다운로드 실패:', error);
                    alert('❌ 다운로드 중 오류가 발생했습니다.');
                }
            }

            // 🆕 게임 삭제
            async function deleteManagerGame(gameId) {
                if (!confirm(\`정말로 "\${gameId}" 게임을 삭제하시겠습니까?\\n\\n⚠️ 이 작업은 되돌릴 수 없습니다.\`)) {
                    return;
                }

                try {
                    const response = await fetch(\`/developer/api/delete-game/\${gameId}\`, {
                        method: 'DELETE'
                    });

                    const data = await response.json();

                    if (data.success) {
                        alert('✅ 게임이 삭제되었습니다!');
                        loadManagerGames();
                    } else {
                        alert('❌ ' + (data.error || '삭제 실패'));
                    }
                } catch (error) {
                    console.error('삭제 실패:', error);
                    alert('❌ 삭제 중 오류가 발생했습니다.');
                }
            }

            // 게임 관리 탭이 활성화될 때 게임 목록 로드
            document.querySelector('[data-tab="manager"]').addEventListener('click', () => {
                setTimeout(loadManagerGames, 100);
            });
        </script>
        `;
    }


    /**
     * 문서 뷰어
     */
    async viewDocument(req, res) {
        try {
            const { category, subcategory, filename } = req.params;

            // 경로 구성 (1단계, 2단계, 3단계 경로 지원)
            let docPath;
            if (subcategory) {
                // 3단계: examples/basic-games/index.md
                docPath = path.join(this.docsBasePath, category, subcategory, filename);
            } else if (category) {
                // 2단계: game-development/01-architecture-design.md
                docPath = path.join(this.docsBasePath, category, filename);
            } else {
                // 1단계: README.md
                docPath = path.join(this.docsBasePath, filename);
            }

            const markdown = await fs.readFile(docPath, 'utf-8');
            const html = this.markdownRenderer.render(markdown);

            res.send(html);
        } catch (error) {
            console.error('문서 로드 실패:', error);
            res.status(404).send('<p style="color: #EF4444;">❌ 문서를 찾을 수 없습니다.</p>');
        }
    }

    /**
     * 💬 AI 챗봇 처리 (v2.0 - 세션 기반 대화 히스토리)
     *
     * Request: { message: string, sessionId?: string }
     * Response: { response: string, sessionId: string, cacheStats?: object }
     */
    async handleChat(req, res) {
        try {
            const { message, sessionId: clientSessionId } = req.body;

            // ✅ 세션 ID 생성 또는 재사용
            const sessionId = clientSessionId || `chat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

            // aiServiceGetter를 호출하여 현재 aiService 가져오기
            const aiService = this.aiServiceGetter();

            if (!aiService) {
                return res.json({
                    response: '❌ AI 서비스가 초기화되지 않았습니다. 잠시 후 다시 시도해주세요.',
                    sessionId: sessionId
                });
            }

            // 📚 세션 가져오기 또는 생성
            let session = this.chatSessions.get(sessionId);
            if (!session) {
                session = {
                    messages: [],
                    lastAccess: Date.now(),
                    createdAt: Date.now()
                };
                this.chatSessions.set(sessionId, session);
                console.log(`✨ 새 챗봇 세션 생성: ${sessionId}`);
            }

            // 📝 사용자 메시지 추가
            session.messages.push({
                role: 'user',
                content: message
            });
            session.lastAccess = Date.now();

            // 🤖 AI 서비스 호출 (전체 대화 히스토리 전달)
            const result = await aiService.processChat(message, session.messages);

            if (result.success) {
                // 💾 AI 응답 저장
                session.messages.push({
                    role: 'assistant',
                    content: result.message
                });

                // 📊 캐시 통계 로깅 (개발 모드)
                if (result.usage) {
                    console.log(`💬 세션 ${sessionId.substring(0, 8)}... 응답 생성 (메시지 ${session.messages.length}개)`);
                }

                res.json({
                    response: result.message,
                    sessionId: sessionId,
                    // 개발 모드: 캐시 통계 전송
                    cacheStats: process.env.NODE_ENV === 'development' ? result.usage : undefined
                });
            } else {
                // 에러 발생 시에도 세션 유지 (사용자 메시지는 저장됨)
                res.json({
                    response: '❌ ' + result.error,
                    sessionId: sessionId
                });
            }
        } catch (error) {
            console.error('❌ AI 챗봇 오류:', error);
            res.json({
                response: '❌ 오류가 발생했습니다: ' + error.message,
                sessionId: req.body.sessionId // 기존 세션 ID 유지
            });
        }
    }

    /**
     * AI 게임 생성 처리 (레거시)
     */
    async handleGameGeneration(req, res) {
        try {
            const { title, type, description } = req.body;

            if (!this.aiService) {
                return res.json({
                    success: false,
                    error: 'AI 서비스가 초기화되지 않았습니다.'
                });
            }

            // AI 게임 생성 호출
            const result = await this.aiService.generateGame({
                title,
                gameType: type,
                description
            });

            res.json({
                success: true,
                gameUrl: `/games/${result.gameId}`,
                gameId: result.gameId
            });
        } catch (error) {
            console.error('게임 생성 오류:', error);
            res.json({
                success: false,
                error: error.message
            });
        }
    }

    /**
     * 🆕 대화형 게임 생성 세션 시작 (Phase 2)
     */
    async handleStartGameSession(req, res) {
        try {
            const { initialMessage } = req.body;

            // aiServiceGetter로 현재 aiService 가져오기
            const aiService = this.aiServiceGetter();

            if (!aiService || !aiService.interactiveGameGenerator) {
                return res.json({
                    success: false,
                    error: 'AI 게임 생성기가 초기화되지 않았습니다.'
                });
            }

            // 고유 세션 ID 생성
            const sessionId = `game-session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

            console.log('🎮 대화형 게임 생성 세션 시작:', sessionId);

            // InteractiveGameGenerator의 startNewSession 호출
            await aiService.interactiveGameGenerator.startNewSession(sessionId);

            console.log('✅ 세션 생성 완료:', sessionId);

            res.json({
                success: true,
                sessionId: sessionId,
                aiResponse: '세션이 시작되었습니다. 게임 아이디어를 말씀해주세요!',
                message: '세션이 시작되었습니다. 게임 아이디어를 말씀해주세요!',
                stage: 'initial',
                metadata: {
                    infoCompleteness: 0,
                    readyToGenerate: false,
                    collectedInfo: {
                        gameType: null,
                        genre: null,
                        sensorUsage: [],
                        difficulty: null,
                        mechanics: [],
                        additionalFeatures: []
                    },
                    nextAction: 'ask_more'
                }
            });
        } catch (error) {
            console.error('❌ 게임 세션 시작 오류:', error);
            res.json({
                success: false,
                error: error.message
            });
        }
    }

    /**
     * 🆕 대화형 게임 생성 메시지 처리 (Phase 2)
     */
    async handleGameChat(req, res) {
        try {
            const { sessionId, message } = req.body;

            if (!sessionId || !message) {
                return res.json({
                    success: false,
                    error: '세션 ID와 메시지가 필요합니다.'
                });
            }

            // aiServiceGetter로 현재 aiService 가져오기
            const aiService = this.aiServiceGetter();

            if (!aiService || !aiService.interactiveGameGenerator) {
                return res.json({
                    success: false,
                    error: 'AI 게임 생성기가 초기화되지 않았습니다.'
                });
            }

            console.log(`💬 대화 메시지 처리 [세션: ${sessionId}]:`, message);

            // InteractiveGameGenerator의 processUserMessage 호출
            const result = await aiService.interactiveGameGenerator.processUserMessage(
                sessionId,
                message
            );

            console.log(`✅ 메시지 처리 완료 [단계: ${result.stage}]`);

            res.json({
                success: true,
                aiResponse: result.message,
                message: result.message,
                stage: result.stage,
                requirements: result.requirements,
                sessionId: sessionId,
                metadata: result.metadata || {
                    infoCompleteness: 0,
                    readyToGenerate: false,
                    collectedInfo: {
                        gameType: null,
                        genre: null,
                        sensorUsage: [],
                        difficulty: null,
                        mechanics: [],
                        additionalFeatures: []
                    },
                    nextAction: 'ask_more'
                }
            });
        } catch (error) {
            console.error('❌ 게임 채팅 오류:', error);
            res.json({
                success: false,
                error: error.message
            });
        }
    }

    /**
     * 🆕 최종 게임 생성 (Phase 2)
     */
    async handleFinalizeGame(req, res) {
        try {
            const { sessionId } = req.body;

            if (!sessionId) {
                return res.json({
                    success: false,
                    error: '세션 ID가 필요합니다.'
                });
            }

            // aiServiceGetter로 현재 aiService 가져오기
            const aiService = this.aiServiceGetter();

            if (!aiService || !aiService.interactiveGameGenerator) {
                return res.json({
                    success: false,
                    error: 'AI 게임 생성기가 초기화되지 않았습니다.'
                });
            }

            console.log(`🚀 최종 게임 생성 시작 [세션: ${sessionId}]`);

            // InteractiveGameGenerator의 generateFinalGame 호출
            const result = await aiService.interactiveGameGenerator.generateFinalGame(sessionId);

            console.log(`✅ 게임 생성 완료 [게임 ID: ${result.gameId}]`);

            res.json({
                success: true,
                gameId: result.gameId,
                gameUrl: `/games/${result.gameId}`,
                metadata: result.metadata,
                validationScore: result.validationScore,
                message: '🎉 게임이 성공적으로 생성되었습니다!'
            });
        } catch (error) {
            console.error('❌ 최종 게임 생성 오류:', error);
            res.json({
                success: false,
                error: error.message
            });
        }
    }

    /**
     * 🆕 게임 미리보기 핸들러
     * 생성된 게임을 iframe으로 미리볼 수 있는 HTML 페이지 제공
     */
    async handlePreviewGame(req, res) {
        try {
            const { gameId } = req.params;
            const gameFolderPath = path.join(__dirname, '../../public/games', gameId);
            const gameIndexPath = path.join(gameFolderPath, 'index.html');

            console.log(`🔍 게임 미리보기 요청: ${gameId}`);

            // 게임 파일 존재 확인
            if (!fsSync.existsSync(gameIndexPath)) {
                return res.status(404).send(`
                    <!DOCTYPE html>
                    <html lang="ko">
                    <head>
                        <meta charset="UTF-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <title>게임을 찾을 수 없습니다</title>
                        <style>
                            body {
                                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
                                display: flex;
                                justify-content: center;
                                align-items: center;
                                height: 100vh;
                                margin: 0;
                                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                            }
                            .error-box {
                                background: white;
                                padding: 40px;
                                border-radius: 12px;
                                box-shadow: 0 8px 16px rgba(0,0,0,0.2);
                                text-align: center;
                                max-width: 500px;
                            }
                            .error-icon { font-size: 64px; margin-bottom: 20px; }
                            h1 { color: #333; margin: 0 0 10px 0; }
                            p { color: #666; margin-bottom: 20px; }
                            .btn {
                                display: inline-block;
                                padding: 12px 24px;
                                background: #667eea;
                                color: white;
                                text-decoration: none;
                                border-radius: 6px;
                                transition: background 0.3s;
                            }
                            .btn:hover { background: #5568d3; }
                        </style>
                    </head>
                    <body>
                        <div class="error-box">
                            <div class="error-icon">🎮❌</div>
                            <h1>게임을 찾을 수 없습니다</h1>
                            <p>게임 ID: <strong>${gameId}</strong></p>
                            <p>해당 게임이 존재하지 않거나 아직 생성되지 않았습니다.</p>
                            <a href="/developer" class="btn">개발자 센터로 돌아가기</a>
                        </div>
                    </body>
                    </html>
                `);
            }

            // 미리보기 HTML 페이지 생성
            const previewHtml = `
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🎮 게임 미리보기 - ${gameId}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            height: 100vh;
            display: flex;
            flex-direction: column;
        }

        /* 상단 헤더 */
        .preview-header {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            padding: 15px 30px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            display: flex;
            justify-content: space-between;
            align-items: center;
            z-index: 1000;
        }

        .header-left {
            display: flex;
            align-items: center;
            gap: 15px;
        }

        .game-title {
            font-size: 18px;
            font-weight: 600;
            color: #333;
        }

        .preview-badge {
            background: #667eea;
            color: white;
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 500;
        }

        .header-buttons {
            display: flex;
            gap: 10px;
        }

        .btn {
            padding: 10px 20px;
            border: none;
            border-radius: 6px;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.3s;
            text-decoration: none;
            display: inline-flex;
            align-items: center;
            gap: 8px;
        }

        .btn-primary {
            background: #667eea;
            color: white;
        }

        .btn-primary:hover {
            background: #5568d3;
            transform: translateY(-1px);
            box-shadow: 0 4px 8px rgba(102, 126, 234, 0.3);
        }

        .btn-secondary {
            background: #f3f4f6;
            color: #333;
        }

        .btn-secondary:hover {
            background: #e5e7eb;
        }

        .btn-success {
            background: #10b981;
            color: white;
        }

        .btn-success:hover {
            background: #059669;
        }

        /* 게임 프레임 컨테이너 */
        .game-container {
            flex: 1;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 20px;
            overflow: hidden;
        }

        .game-frame-wrapper {
            width: 100%;
            max-width: 1400px;
            height: 100%;
            background: white;
            border-radius: 12px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.2);
            overflow: hidden;
            display: flex;
            flex-direction: column;
        }

        .game-iframe {
            width: 100%;
            height: 100%;
            border: none;
            background: white;
        }

        /* 로딩 상태 */
        .loading-overlay {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(255, 255, 255, 0.9);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 999;
        }

        .loading-spinner {
            width: 50px;
            height: 50px;
            border: 4px solid #f3f4f6;
            border-top: 4px solid #667eea;
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }

        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }

        /* 반응형 디자인 */
        @media (max-width: 768px) {
            .preview-header {
                flex-direction: column;
                gap: 10px;
                padding: 15px;
            }

            .header-buttons {
                width: 100%;
                justify-content: stretch;
            }

            .btn {
                flex: 1;
                justify-content: center;
            }

            .game-title {
                font-size: 16px;
            }
        }
    </style>
</head>
<body>
    <!-- 상단 헤더 -->
    <div class="preview-header">
        <div class="header-left">
            <span class="game-title">🎮 ${gameId}</span>
            <span class="preview-badge">미리보기 모드</span>
        </div>
        <div class="header-buttons">
            <a href="/developer" class="btn btn-secondary">
                ← 개발자 센터
            </a>
            <button onclick="refreshGame()" class="btn btn-primary">
                🔄 새로고침
            </button>
        </div>
    </div>

    <!-- 게임 프레임 -->
    <div class="game-container">
        <div class="game-frame-wrapper">
            <div class="loading-overlay" id="loading">
                <div class="loading-spinner"></div>
            </div>
            <iframe
                id="game-iframe"
                class="game-iframe"
                src="/games/${gameId}/index.html"
                allow="accelerometer; gyroscope"
                sandbox="allow-scripts allow-same-origin allow-forms"
            ></iframe>
        </div>
    </div>

    <script>
        // 로딩 완료 처리
        const iframe = document.getElementById('game-iframe');
        const loading = document.getElementById('loading');

        iframe.addEventListener('load', () => {
            setTimeout(() => {
                loading.style.display = 'none';
            }, 500);
        });

        // 새로고침 기능
        function refreshGame() {
            loading.style.display = 'flex';
            iframe.src = iframe.src;
        }

        // 단축키 지원
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + R: 새로고침
            if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
                e.preventDefault();
                refreshGame();
            }
            // ESC: 개발자 센터로 돌아가기
            if (e.key === 'Escape') {
                window.location.href = '/developer';
            }
        });

        console.log('🎮 게임 미리보기 모드');
        console.log('단축키: Ctrl+R (새로고침), ESC (나가기)');
    </script>
</body>
</html>
            `;

            console.log(`✅ 게임 미리보기 페이지 생성: ${gameId}`);
            res.send(previewHtml);

        } catch (error) {
            console.error('❌ 게임 미리보기 오류:', error);
            res.status(500).send(`
                <!DOCTYPE html>
                <html lang="ko">
                <head>
                    <meta charset="UTF-8">
                    <title>오류 발생</title>
                    <style>
                        body { font-family: sans-serif; padding: 40px; text-align: center; }
                        .error { color: #e53e3e; }
                    </style>
                </head>
                <body>
                    <h1 class="error">⚠️ 미리보기 생성 오류</h1>
                    <p>${error.message}</p>
                    <a href="/developer">개발자 센터로 돌아가기</a>
                </body>
                </html>
            `);
        }
    }

    /**
     * 사용자 정보 조회
     */
    async handleGetAccountInfo(req, res) {
        try {
            console.log('🔍 [계정 정보 조회] 시작');
            console.log('User:', req.user ? { id: req.user.id, email: req.user.email } : 'undefined');
            console.log('Creator:', req.creator);

            const user = req.user; // authMiddleware에서 추가됨
            let creator = req.creator; // authMiddleware에서 추가됨

            const { createClient } = require('@supabase/supabase-js');
            const supabaseAdmin = createClient(
                process.env.SUPABASE_URL,
                process.env.SUPABASE_SERVICE_ROLE_KEY
            );

            console.log('Service Role Key 존재 여부:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);

            // game_creators 테이블에 데이터가 없으면 생성 (기존 사용자 대응)
            if (!creator) {
                console.log('⚠️ Creator 정보 없음, 자동 생성 시도');
                const userName = user.user_metadata?.name || user.email.split('@')[0];
                const userNickname = user.user_metadata?.nickname || userName;

                console.log('생성할 데이터:', { id: user.id, name: userName, nickname: userNickname });

                const { data: newCreator, error: insertError } = await supabaseAdmin
                    .from('game_creators')
                    .insert({
                        id: user.id,
                        name: userName,
                        nickname: userNickname,
                        games_created: 0
                    })
                    .select('id, name, nickname')
                    .single();

                if (insertError) {
                    console.error('❌ Creator insert error:', insertError);
                    console.error('Error details:', JSON.stringify(insertError, null, 2));
                    return res.status(500).json({
                        success: false,
                        error: '사용자 정보를 생성할 수 없습니다.',
                        details: insertError.message
                    });
                }

                if (newCreator) {
                    console.log('✅ Creator 생성 성공:', newCreator);
                    creator = newCreator;
                }
            } else {
                console.log('✅ Creator 정보 존재:', creator);
            }

            res.json({
                success: true,
                user: {
                    id: user.id,
                    name: creator.name,
                    nickname: creator.nickname,
                    email: user.email,
                    password: '' // 보안상 비밀번호는 절대 전송하지 않음
                }
            });
        } catch (error) {
            console.error('❌ 사용자 정보 조회 오류:', error);
            res.status(500).json({
                success: false,
                error: '사용자 정보를 불러올 수 없습니다.',
                details: error.message
            });
        }
    }

    /**
     * 닉네임 변경
     */
    async handleChangeNickname(req, res) {
        try {
            console.log('🔄 [닉네임 변경] 시작');
            const { newNickname, password } = req.body;
            const user = req.user;

            console.log('요청 데이터:', { newNickname, passwordLength: password?.length, userId: user.id });

            if (!newNickname || !password) {
                console.log('❌ 입력값 누락');
                return res.status(400).json({
                    success: false,
                    error: '닉네임과 비밀번호를 입력하세요.'
                });
            }

            // 닉네임 유효성 검사
            if (newNickname.length < 2 || newNickname.length > 20) {
                return res.status(400).json({
                    success: false,
                    error: '닉네임은 2-20자 사이여야 합니다.'
                });
            }

            // Supabase 클라이언트 생성
            const { createClient } = require('@supabase/supabase-js');
            const supabase = createClient(
                process.env.SUPABASE_URL,
                process.env.SUPABASE_ANON_KEY
            );
            const supabaseAdmin = createClient(
                process.env.SUPABASE_URL,
                process.env.SUPABASE_SERVICE_ROLE_KEY
            );

            // 비밀번호 확인 (Supabase Auth의 signInWithPassword 사용)
            console.log('🔐 비밀번호 확인 중...');
            const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
                email: user.email,
                password: password
            });

            if (signInError || !signInData.user) {
                console.log('❌ 비밀번호 확인 실패:', signInError);
                return res.status(401).json({
                    success: false,
                    error: '비밀번호가 올바르지 않습니다.'
                });
            }

            console.log('✅ 비밀번호 확인 성공');

            // 닉네임 중복 확인
            console.log('🔍 닉네임 중복 확인 중...');
            const { data: existingNickname, error: checkError } = await supabaseAdmin
                .from('game_creators')
                .select('id')
                .eq('nickname', newNickname)
                .neq('id', user.id)
                .maybeSingle();

            if (checkError) {
                console.error('❌ 닉네임 중복 확인 오류:', checkError);
            }

            if (existingNickname) {
                console.log('❌ 닉네임 중복:', newNickname);
                return res.status(409).json({
                    success: false,
                    error: '이미 사용 중인 닉네임입니다.'
                });
            }

            // game_creators 테이블에서 닉네임 업데이트 (Service Role Key 사용)
            console.log('📝 닉네임 업데이트 중...', { newNickname, userId: user.id });
            const { error: updateError } = await supabaseAdmin
                .from('game_creators')
                .update({ nickname: newNickname })
                .eq('id', user.id);

            if (updateError) {
                console.error('❌ 닉네임 업데이트 오류:', updateError);
                console.error('Error details:', JSON.stringify(updateError, null, 2));
                return res.status(500).json({
                    success: false,
                    error: '닉네임 변경에 실패했습니다.',
                    details: updateError.message
                });
            }

            console.log('✅ 닉네임 변경 성공:', newNickname);
            res.json({
                success: true,
                message: '닉네임이 성공적으로 변경되었습니다.',
                newNickname: newNickname
            });
        } catch (error) {
            console.error('❌ 닉네임 변경 오류:', error);
            console.error('Error stack:', error.stack);
            res.status(500).json({
                success: false,
                error: '닉네임 변경 중 오류가 발생했습니다.',
                details: error.message
            });
        }
    }

    /**
     * 비밀번호 변경
     */
    async handleChangePassword(req, res) {
        try {
            console.log('🔐 [비밀번호 변경] 시작');
            const { currentPassword, newPassword } = req.body;
            const user = req.user;

            console.log('요청 데이터:', {
                currentPasswordLength: currentPassword?.length,
                newPasswordLength: newPassword?.length,
                userId: user.id
            });

            if (!currentPassword || !newPassword) {
                console.log('❌ 입력값 누락');
                return res.status(400).json({
                    success: false,
                    error: '현재 비밀번호와 새 비밀번호를 입력하세요.'
                });
            }

            if (newPassword.length < 6) {
                console.log('❌ 비밀번호 길이 부족:', newPassword.length);
                return res.status(400).json({
                    success: false,
                    error: '비밀번호는 최소 6자 이상이어야 합니다.'
                });
            }

            // Supabase 클라이언트 생성
            const { createClient } = require('@supabase/supabase-js');
            const supabase = createClient(
                process.env.SUPABASE_URL,
                process.env.SUPABASE_ANON_KEY
            );

            // 현재 비밀번호 확인
            console.log('🔐 현재 비밀번호 확인 중...');
            const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
                email: user.email,
                password: currentPassword
            });

            if (signInError || !signInData.user) {
                console.log('❌ 현재 비밀번호 확인 실패:', signInError);
                return res.status(401).json({
                    success: false,
                    error: '현재 비밀번호가 올바르지 않습니다.'
                });
            }

            console.log('✅ 현재 비밀번호 확인 성공');

            // 비밀번호 업데이트 (Supabase Auth)
            console.log('📝 비밀번호 업데이트 중...');
            const { data: updateData, error: updateError } = await supabase.auth.updateUser({
                password: newPassword
            });

            if (updateError) {
                console.error('❌ 비밀번호 업데이트 오류:', updateError);
                return res.status(500).json({
                    success: false,
                    error: '비밀번호 변경에 실패했습니다.',
                    details: updateError.message
                });
            }

            console.log('✅ 비밀번호 변경 성공');

            // 새 비밀번호로 다시 로그인하여 새 세션 토큰 받기
            console.log('🔄 새 세션 생성 중...');
            const { data: newSessionData, error: newSessionError } = await supabase.auth.signInWithPassword({
                email: user.email,
                password: newPassword
            });

            if (newSessionError || !newSessionData.session) {
                console.error('❌ 새 세션 생성 실패:', newSessionError);
                // 비밀번호는 변경되었지만 세션 생성 실패
                return res.json({
                    success: true,
                    message: '비밀번호가 변경되었습니다. 다시 로그인해주세요.',
                    requireRelogin: true
                });
            }

            console.log('✅ 새 세션 생성 성공');
            res.json({
                success: true,
                message: '비밀번호가 성공적으로 변경되었습니다.',
                session: newSessionData.session // 새 세션 정보 반환
            });
        } catch (error) {
            console.error('❌ 비밀번호 변경 오류:', error);
            res.status(500).json({
                success: false,
                error: '비밀번호 변경 중 오류가 발생했습니다.',
                details: error.message
            });
        }
    }

    /**
     * 🆕 게임 업로드 핸들러
     * ZIP 파일 또는 개별 파일들을 업로드하여 Storage에 저장
     */
    async handleUploadGame(req, res) {
        try {
            const files = req.files;

            if (!files || files.length === 0) {
                return res.status(400).json({
                    success: false,
                    error: '업로드할 파일이 없습니다.'
                });
            }

            console.log(`📤 게임 업로드 요청 [파일 수: ${files.length}]`);

            // 게임 ID 추출 (body에서 받거나 자동 생성)
            let gameId = req.body.gameId;
            let gameFiles = [];

            // ZIP 파일인 경우
            if (files.length === 1 && files[0].originalname.endsWith('.zip')) {
                console.log(`📦 ZIP 파일 압축 해제 중...`);

                const zip = new AdmZip(files[0].buffer);
                const zipEntries = zip.getEntries();

                // 게임 ID 추출 (ZIP 내부 최상위 폴더명)
                if (!gameId && zipEntries.length > 0) {
                    const firstEntry = zipEntries[0].entryName;
                    gameId = firstEntry.split('/')[0];
                }

                // ZIP 내부 파일들 추출
                zipEntries.forEach(entry => {
                    if (!entry.isDirectory) {
                        const relativePath = entry.entryName.replace(`${gameId}/`, '');
                        gameFiles.push({
                            path: relativePath,
                            content: entry.getData()
                        });
                    }
                });
            }
            // 개별 파일들인 경우
            else {
                // 게임 ID가 없으면 자동 생성
                if (!gameId) {
                    gameId = `game-${Date.now()}`;
                }

                // 파일 경로 파싱 (webkitRelativePath 사용)
                files.forEach(file => {
                    const relativePath = file.originalname;
                    gameFiles.push({
                        path: relativePath,
                        content: file.buffer
                    });
                });
            }

            console.log(`🎮 게임 ID: ${gameId}`);
            console.log(`📁 파일 수: ${gameFiles.length}`);

            // index.html 검증
            const hasIndexHtml = gameFiles.some(f => f.path === 'index.html' || f.path.endsWith('/index.html'));
            if (!hasIndexHtml) {
                return res.status(400).json({
                    success: false,
                    error: 'index.html 파일이 필요합니다.'
                });
            }

            // Supabase Storage에 업로드
            if (!this.supabaseAdmin) {
                return res.status(500).json({
                    success: false,
                    error: 'Storage 클라이언트가 초기화되지 않았습니다.'
                });
            }

            console.log(`☁️  Supabase Storage 업로드 중...`);

            for (const file of gameFiles) {
                const storagePath = `${gameId}/${file.path}`;

                // MIME 타입 결정
                let contentType = 'application/octet-stream';
                if (file.path.endsWith('.html')) contentType = 'text/html';
                else if (file.path.endsWith('.json')) contentType = 'application/json';
                else if (file.path.endsWith('.js')) contentType = 'text/javascript';
                else if (file.path.endsWith('.css')) contentType = 'text/css';
                else if (file.path.endsWith('.png')) contentType = 'image/png';
                else if (file.path.endsWith('.jpg') || file.path.endsWith('.jpeg')) contentType = 'image/jpeg';
                else if (file.path.endsWith('.svg')) contentType = 'image/svg+xml';

                const { error: uploadError } = await this.supabaseAdmin
                    .storage
                    .from('games')
                    .upload(storagePath, file.content, {
                        contentType,
                        upsert: true
                    });

                if (uploadError) {
                    console.error(`❌ 업로드 실패: ${storagePath}`, uploadError);
                    throw uploadError;
                }

                console.log(`  ✓ ${file.path}`);
            }

            console.log(`✅ Storage 업로드 완료`);

            // game.json 파싱 (메타데이터)
            const gameJsonFile = gameFiles.find(f => f.path === 'game.json' || f.path.endsWith('/game.json'));
            let metadata = {
                title: gameId,
                description: `${gameId} 게임`,
                gameType: 'solo',
                genre: 'action'
            };

            if (gameJsonFile) {
                try {
                    const gameJson = JSON.parse(gameJsonFile.content.toString('utf-8'));
                    metadata = {
                        title: gameJson.title || gameId,
                        description: gameJson.description || `${gameId} 게임`,
                        gameType: gameJson.gameType || gameJson.category || 'solo',
                        genre: gameJson.genre || 'action'
                    };
                } catch (e) {
                    console.warn(`⚠️  game.json 파싱 실패, 기본값 사용`);
                }
            }

            // DB 등록
            console.log(`💾 DB 등록 중...`);

            const { error: dbError } = await this.supabaseAdmin
                .from('generated_games')
                .upsert({
                    game_id: gameId,
                    title: metadata.title,
                    description: metadata.description,
                    game_type: metadata.gameType,
                    genre: metadata.genre,
                    storage_path: `${gameId}/index.html`,
                    thumbnail_url: null,
                    play_count: 0,
                    metadata: {
                        version: '1.0',
                        source: 'manual_upload',
                        uploadedAt: new Date().toISOString()
                    }
                }, {
                    onConflict: 'game_id'
                });

            if (dbError) {
                throw dbError;
            }

            console.log(`✅ DB 등록 완료`);

            // GameScanner 재스캔
            if (this.gameScanner) {
                await this.gameScanner.scanGames();
            }

            res.json({
                success: true,
                gameId,
                metadata,
                filesUploaded: gameFiles.length
            });

        } catch (error) {
            console.error('❌ 게임 업로드 실패:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    /**
     * 🆕 게임 다운로드 핸들러
     * Storage에서 게임 파일을 다운로드하여 ZIP으로 압축해서 전송
     */
    async handleDownloadGame(req, res) {
        try {
            const { gameId } = req.params;

            if (!gameId) {
                return res.status(400).json({
                    success: false,
                    error: '게임 ID가 필요합니다.'
                });
            }

            console.log(`📥 게임 다운로드 요청 [게임 ID: ${gameId}]`);

            if (!this.supabaseAdmin) {
                return res.status(500).json({
                    success: false,
                    error: 'Storage 클라이언트가 초기화되지 않았습니다.'
                });
            }

            // Storage에서 파일 목록 조회
            const { data: fileList, error: listError } = await this.supabaseAdmin
                .storage
                .from('games')
                .list(gameId);

            if (listError) {
                throw listError;
            }

            if (!fileList || fileList.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: '게임 파일을 찾을 수 없습니다.'
                });
            }

            console.log(`📦 ZIP 압축 시작 [파일 수: ${fileList.length}]`);

            // ZIP 다운로드 헤더 설정
            res.setHeader('Content-Type', 'application/zip');
            res.setHeader('Content-Disposition', `attachment; filename="${gameId}.zip"`);

            // archiver 인스턴스 생성
            const archive = archiver('zip', {
                zlib: { level: 9 }
            });

            // 오류 처리
            archive.on('error', (err) => {
                console.error('❌ ZIP 압축 오류:', err);
                if (!res.headersSent) {
                    res.status(500).json({
                        success: false,
                        error: 'ZIP 압축 중 오류 발생'
                    });
                }
            });

            // 완료 로깅
            archive.on('end', () => {
                console.log(`✅ ZIP 압축 완료 [${gameId}.zip]`);
            });

            // 스트림 연결
            archive.pipe(res);

            // Storage에서 파일 다운로드 후 ZIP에 추가
            for (const file of fileList) {
                const storagePath = `${gameId}/${file.name}`;

                const { data: fileData, error: downloadError } = await this.supabaseAdmin
                    .storage
                    .from('games')
                    .download(storagePath);

                if (downloadError) {
                    console.error(`❌ 다운로드 실패: ${storagePath}`, downloadError);
                    continue;
                }

                // ZIP에 파일 추가
                archive.append(Buffer.from(await fileData.arrayBuffer()), {
                    name: `${gameId}/${file.name}`
                });

                console.log(`  ✓ ${file.name}`);
            }

            // ZIP 생성 완료
            await archive.finalize();

        } catch (error) {
            console.error('❌ 게임 다운로드 오류:', error);
            if (!res.headersSent) {
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        }
    }

    /**
     * 🆕 게임 삭제 핸들러
     * Storage와 DB에서 게임 완전 삭제
     */
    async handleDeleteGame(req, res) {
        try {
            const { gameId } = req.params;

            if (!gameId) {
                return res.status(400).json({
                    success: false,
                    error: '게임 ID가 필요합니다.'
                });
            }

            console.log(`🗑️  게임 삭제 요청 [게임 ID: ${gameId}]`);

            if (!this.supabaseAdmin) {
                return res.status(500).json({
                    success: false,
                    error: 'Storage 클라이언트가 초기화되지 않았습니다.'
                });
            }

            // Storage에서 파일 목록 조회
            const { data: fileList, error: listError } = await this.supabaseAdmin
                .storage
                .from('games')
                .list(gameId);

            if (listError) {
                throw listError;
            }

            // Storage에서 파일 삭제
            if (fileList && fileList.length > 0) {
                console.log(`☁️  Storage 파일 삭제 중 [${fileList.length}개 파일]...`);

                const filePaths = fileList.map(file => `${gameId}/${file.name}`);

                const { error: deleteError } = await this.supabaseAdmin
                    .storage
                    .from('games')
                    .remove(filePaths);

                if (deleteError) {
                    throw deleteError;
                }

                console.log(`✅ Storage 파일 삭제 완료`);
            }

            // DB에서 레코드 삭제
            console.log(`💾 DB 레코드 삭제 중...`);

            const { error: dbError } = await this.supabaseAdmin
                .from('generated_games')
                .delete()
                .eq('game_id', gameId);

            if (dbError) {
                throw dbError;
            }

            console.log(`✅ DB 레코드 삭제 완료`);

            // GameScanner 재스캔
            if (this.gameScanner) {
                await this.gameScanner.scanGames();
            }

            res.json({
                success: true,
                message: `게임 "${gameId}"이(가) 완전히 삭제되었습니다.`
            });

        } catch (error) {
            console.error('❌ 게임 삭제 오류:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    /**
     * 라우터 반환
     */
    getRouter() {
        return this.router;
    }
}

module.exports = DeveloperRoutes;
