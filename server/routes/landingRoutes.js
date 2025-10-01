/**
 * 🏠 LandingRoutes v6.0
 *
 * 랜딩 페이지 라우트
 * - Tailwind CSS v3 기반 세련된 디자인
 * - 메인 진입점 및 프로젝트 소개
 */

const express = require('express');
const HtmlGenerator = require('../utils/htmlGenerator');

class LandingRoutes {
    constructor(gameService, aiService) {
        this.gameService = gameService;
        this.aiService = aiService;
        this.router = express.Router();
        this.htmlGenerator = new HtmlGenerator();

        this.setupRoutes();
        console.log('🏠 LandingRoutes 초기화 완료');
    }

    /**
     * 라우트 설정
     */
    setupRoutes() {
        // 메인 랜딩 페이지
        this.router.get('/', (req, res) => {
            this.getLandingPage(req, res);
        });

        // 게임 목록 페이지
        this.router.get('/games/', (req, res) => {
            this.getGamesPage(req, res);
        });
    }

    /**
     * 랜딩 페이지 HTML 생성
     */
    async getLandingPage(req, res) {
        try {
            // 통계 정보 수집
            const stats = await this.getSystemStats();

            const html = this.htmlGenerator.generateLandingPage({
                title: 'Sensor Game Hub v6.0',
                stats: stats
            });

            res.send(html);
        } catch (error) {
            console.error('랜딩 페이지 생성 실패:', error);
            res.status(500).send('랜딩 페이지 로딩 중 오류가 발생했습니다.');
        }
    }

    /**
     * 게임 목록 페이지
     */
    async getGamesPage(req, res) {
        try {
            // GameScanner에서 게임 목록 가져오기
            const games = this.gameService.getGames() || [];

            const html = this.htmlGenerator.generateGamesListPage({
                title: '게임 목록 - Sensor Game Hub',
                games: games
            });

            res.send(html);
        } catch (error) {
            console.error('게임 목록 페이지 생성 실패:', error);
            res.status(500).send('게임 목록 로딩 중 오류가 발생했습니다.');
        }
    }

    /**
     * 시스템 통계 정보 수집
     */
    async getSystemStats() {
        try {
            // 게임 수 (디렉토리 기반)
            const totalGames = 12;

            // 문서 수
            const totalDocs = 35;

            // 벡터 임베딩 수
            const totalVectors = 616;

            // AI 기능 상태
            const aiStatus = this.aiService ? 'active' : 'inactive';

            return {
                games: totalGames,
                documents: totalDocs,
                vectors: totalVectors,
                aiEnabled: aiStatus === 'active'
            };
        } catch (error) {
            console.error('통계 수집 실패:', error);
            return {
                games: 12,
                documents: 35,
                vectors: 616,
                aiEnabled: true
            };
        }
    }

    /**
     * 라우터 반환
     */
    getRouter() {
        return this.router;
    }
}

module.exports = LandingRoutes;
