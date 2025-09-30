/**
 * 🎮 GameRoutes v6.0
 *
 * 게임 관련 라우트
 * - 게임 허브 페이지
 * - 게임별 세션 관리
 * - 새로운 게임 프레임워크 지원
 */

const express = require('express');
const path = require('path');
const HtmlGenerator = require('../utils/htmlGenerator');

class GameRoutes {
    constructor(gameService, sessionService) {
        this.gameService = gameService;
        this.sessionService = sessionService;
        this.router = express.Router();
        this.htmlGenerator = new HtmlGenerator();

        this.setupRoutes();
        console.log('🎮 GameRoutes 초기화 완료');
    }

    /**
     * 라우트 설정
     */
    setupRoutes() {
        // 메인 게임 허브 페이지
        this.router.get('/', (req, res) => {
            this.getGameHub(req, res);
        });

        // 개별 게임 페이지 (새로운 프레임워크)
        this.router.get('/games/:gameId', (req, res) => {
            this.getGamePage(req, res);
        });

        // 게임 템플릿 페이지 (개발자용)
        this.router.get('/game-template', (req, res) => {
            this.getGameTemplate(req, res);
        });

        // 새 게임 생성 페이지
        this.router.get('/create-game', (req, res) => {
            this.getGameCreator(req, res);
        });

        // 센서 클라이언트 (개선된 버전)
        this.router.get('/sensor', (req, res) => {
            this.getSensorClient(req, res);
        });

        // 게임 프레임워크 문서
        this.router.get('/framework-docs', (req, res) => {
            this.getFrameworkDocs(req, res);
        });

        // AI 관련 별칭 라우트 (사용자 친화적 URL)
        this.router.get('/ai-assistant', (req, res) => {
            res.redirect('/ai/assistant');
        });

        this.router.get('/interactive-game-generator', (req, res) => {
            res.redirect('/ai/game-generator');
        });
    }

    /**
     * 메인 게임 허브 페이지
     */
    async getGameHub(req, res) {
        try {
            const games = this.gameService.getActiveGames();
            const stats = this.gameService.getStats();
            const sessionStats = this.sessionService.getStats();

            const html = this.htmlGenerator.generateGameHub(games);

            res.send(html);
        } catch (error) {
            console.error('❌ 게임 허브 페이지 생성 실패:', error);
            res.status(500).send(this.htmlGenerator.generateErrorPage(error.message));
        }
    }

    /**
     * 개별 게임 페이지 (새로운 프레임워크)
     */
    async getGamePage(req, res) {
        try {
            const { gameId } = req.params;
            const game = this.gameService.getGame(gameId);

            if (!game) {
                return res.status(404).send(
                    this.htmlGenerator.generateErrorPage(`게임 '${gameId}'를 찾을 수 없습니다.`)
                );
            }

            // 기존 게임 파일이 있는지 확인
            const fs = require('fs');
            const gameFilePath = path.join(__dirname, '../../public/games', gameId, 'index.html');

            if (fs.existsSync(gameFilePath)) {
                // 기존 게임 파일 제공
                res.sendFile(gameFilePath);
            } else {
                // 새로운 프레임워크로 게임 페이지 생성
                const html = this.htmlGenerator.generateNewGamePage(game);
                res.send(html);
            }
        } catch (error) {
            console.error('❌ 게임 페이지 생성 실패:', error);
            res.status(500).send(this.htmlGenerator.generateErrorPage(error.message));
        }
    }

    /**
     * 게임 템플릿 페이지 (새로운 프레임워크)
     */
    getGameTemplate(req, res) {
        try {
            const html = this.htmlGenerator.generateGameTemplate();
            res.send(html);
        } catch (error) {
            console.error('❌ 게임 템플릿 페이지 생성 실패:', error);
            res.status(500).send(this.htmlGenerator.generateErrorPage(error.message));
        }
    }

    /**
     * 새 게임 생성 페이지
     */
    getGameCreator(req, res) {
        try {
            const html = this.htmlGenerator.generateGameCreator();
            res.send(html);
        } catch (error) {
            console.error('❌ 게임 생성 페이지 생성 실패:', error);
            res.status(500).send(this.htmlGenerator.generateErrorPage(error.message));
        }
    }

    /**
     * 개선된 센서 클라이언트
     */
    getSensorClient(req, res) {
        try {
            const html = this.htmlGenerator.generateSensorClient();
            res.send(html);
        } catch (error) {
            console.error('❌ 센서 클라이언트 페이지 생성 실패:', error);
            res.status(500).send(this.htmlGenerator.generateErrorPage(error.message));
        }
    }

    /**
     * 게임 프레임워크 문서
     */
    getFrameworkDocs(req, res) {
        try {
            const html = this.htmlGenerator.generateFrameworkDocs();
            res.send(html);
        } catch (error) {
            console.error('❌ 프레임워크 문서 페이지 생성 실패:', error);
            res.status(500).send(this.htmlGenerator.generateErrorPage(error.message));
        }
    }

    /**
     * 라우터 반환
     */
    getRouter() {
        return this.router;
    }
}

module.exports = GameRoutes;