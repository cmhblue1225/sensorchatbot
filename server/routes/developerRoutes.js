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
const MarkdownRenderer = require('../utils/markdownRenderer');

class DeveloperRoutes {
    constructor(gameScanner, aiServiceGetter) {
        this.gameScanner = gameScanner;
        this.aiServiceGetter = aiServiceGetter;
        this.router = express.Router();
        this.markdownRenderer = new MarkdownRenderer();
        this.docsBasePath = path.join(__dirname, '../../docs');

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

        // AI 게임 생성 API (레거시)
        this.router.post('/api/generate-game', async (req, res) => {
            await this.handleGameGeneration(req, res);
        });

        // 🆕 대화형 게임 생성 API (Phase 2)
        // 세션 시작
        this.router.post('/api/start-game-session', async (req, res) => {
            await this.handleStartGameSession(req, res);
        });

        // 대화 메시지 처리
        this.router.post('/api/game-chat', async (req, res) => {
            await this.handleGameChat(req, res);
        });

        // 최종 게임 생성
        this.router.post('/api/finalize-game', async (req, res) => {
            await this.handleFinalizeGame(req, res);
        });

        // 게임 다운로드
        this.router.get('/api/download-game/:gameId', async (req, res) => {
            await this.handleDownloadGame(req, res);
        });

        // 🆕 게임 미리보기
        this.router.get('/api/preview-game/:gameId', async (req, res) => {
            await this.handlePreviewGame(req, res);
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
            max-width: 900px;
            margin: 0 auto;
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
                <button class="tab" data-tab="generator">🎮 게임 생성기</button>
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
                    body: JSON.stringify({ message })
                });

                const data = await response.json();

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

        // 진행 단계 업데이트 함수
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

            // 확인 단계에서 생성 버튼 표시
            if (stage === 'confirmation') {
                generateActionArea.classList.remove('hidden');
            } else {
                generateActionArea.classList.add('hidden');
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

        // 최종 게임 생성
        finalGenerateBtn.addEventListener('click', async () => {
            if (!generatorSessionId) {
                alert('세션이 없습니다. 대화를 먼저 시작해주세요.');
                return;
            }

            // 생성 모달 표시
            const generationModal = document.getElementById('generation-modal');
            generationModal.classList.remove('hidden');
            finalGenerateBtn.disabled = true;

            try {
                const response = await fetch('/developer/api/finalize-game', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        sessionId: generatorSessionId
                    })
                });

                const data = await response.json();

                generationModal.classList.add('hidden');

                if (data.success) {
                    // 결과 모달 표시
                    showResultModal(data);
                } else {
                    addGeneratorMessage('❌ 게임 생성 실패: ' + data.error, true);
                }
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

        // 게임 다운로드
        document.getElementById('download-game-btn').addEventListener('click', async () => {
            if (!currentGameData || !currentGameData.gameId) {
                alert('다운로드할 게임 정보가 없습니다.');
                return;
            }

            try {
                // 게임 파일 다운로드 API 호출
                const response = await fetch('/developer/api/download-game/' + currentGameData.gameId);

                if (!response.ok) {
                    throw new Error('게임 다운로드 실패');
                }

                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = currentGameData.gameId + '.html';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);

                alert('✅ 게임이 성공적으로 다운로드되었습니다!');
            } catch (error) {
                console.error('다운로드 오류:', error);
                alert('❌ 게임 다운로드 중 오류가 발생했습니다.');
            }
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
                <div class="quick-link" data-tab="generator">
                    <div class="quick-link-icon">🎮</div>
                    <div class="quick-link-text">게임 생성</div>
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
                <button id="send-btn" class="send-btn">전송</button>
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
            <!-- 진행 단계 표시 -->
            <div class="generation-progress-bar">
                <div class="progress-step active" data-step="1">
                    <div class="step-number">1</div>
                    <div class="step-label">아이디어</div>
                </div>
                <div class="progress-step" data-step="2">
                    <div class="step-number">2</div>
                    <div class="step-label">세부사항</div>
                </div>
                <div class="progress-step" data-step="3">
                    <div class="step-number">3</div>
                    <div class="step-label">메커니즘</div>
                </div>
                <div class="progress-step" data-step="4">
                    <div class="step-number">4</div>
                    <div class="step-label">확인</div>
                </div>
            </div>

            <!-- 대화형 채팅 영역 -->
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

                <!-- 입력 영역 -->
                <div class="generator-chat-input-area">
                    <input
                        type="text"
                        id="generator-chat-input"
                        class="generator-chat-input"
                        placeholder="게임 아이디어를 입력하세요..."
                    >
                    <button id="generator-send-btn" class="generator-send-btn">
                        <span>전송</span>
                    </button>
                </div>

                <!-- 생성 버튼 (확인 단계에서 표시) -->
                <div id="generate-action-area" class="generate-action-area hidden">
                    <button id="final-generate-btn" class="final-generate-btn">
                        🚀 게임 생성 시작
                    </button>
                    <button id="modify-requirements-btn" class="modify-requirements-btn">
                        ✏️ 요구사항 수정
                    </button>
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
                        <button id="download-game-btn" class="result-btn secondary">
                            💾 게임 다운로드
                        </button>
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
     * AI 챗봇 처리
     */
    async handleChat(req, res) {
        try {
            const { message } = req.body;

            // aiServiceGetter를 호출하여 현재 aiService 가져오기
            const aiService = this.aiServiceGetter();

            if (!aiService) {
                return res.json({
                    response: '❌ AI 서비스가 초기화되지 않았습니다. 잠시 후 다시 시도해주세요.'
                });
            }

            // AI 서비스 호출 (processChat 메서드 사용)
            // conversationHistory는 빈 배열로 전달 (필요시 세션 관리 구현 가능)
            const result = await aiService.processChat(message, []);

            if (result.success) {
                res.json({ response: result.message });
            } else {
                res.json({ response: '❌ ' + result.error });
            }
        } catch (error) {
            console.error('AI 챗봇 오류:', error);
            res.json({
                response: '❌ 오류가 발생했습니다: ' + error.message
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
                message: '세션이 시작되었습니다. 게임 아이디어를 말씀해주세요!',
                stage: 'initial'
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
                message: result.message,
                stage: result.stage,
                requirements: result.requirements,
                sessionId: sessionId
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
     * 🆕 게임 다운로드 (Phase 3)
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

            // 게임 폴더 경로
            const gameFolderPath = path.join(__dirname, '../../public/games', gameId);

            // 폴더 존재 확인
            if (!fsSync.existsSync(gameFolderPath)) {
                console.error(`❌ 게임 폴더를 찾을 수 없음: ${gameFolderPath}`);
                return res.status(404).json({
                    success: false,
                    error: '게임 폴더를 찾을 수 없습니다.'
                });
            }

            console.log(`✅ 게임 폴더 발견: ${gameFolderPath}`);
            console.log(`📦 ZIP 압축 시작...`);

            // ZIP 다운로드 헤더 설정
            res.setHeader('Content-Type', 'application/zip');
            res.setHeader('Content-Disposition', `attachment; filename="${gameId}.zip"`);

            // archiver 인스턴스 생성
            const archive = archiver('zip', {
                zlib: { level: 9 }  // 최대 압축
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

            // 진행 상황 로깅
            archive.on('progress', (progress) => {
                console.log(`📦 압축 진행: ${progress.entries.processed}개 파일 처리됨`);
            });

            // 완료 로깅
            archive.on('end', () => {
                console.log(`✅ ZIP 압축 완료 [${gameId}.zip] - ${archive.pointer()} bytes`);
            });

            // 스트림 연결 (파일 → archive → response)
            archive.pipe(res);

            // 게임 폴더 전체를 ZIP에 추가 (폴더명 포함)
            // 결과: {gameId}/index.html, {gameId}/game.json 등의 구조
            archive.directory(gameFolderPath, gameId);

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
            <a href="/developer/api/download-game/${gameId}" class="btn btn-success">
                ⬇️ 다운로드
            </a>
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
     * 라우터 반환
     */
    getRouter() {
        return this.router;
    }
}

module.exports = DeveloperRoutes;
