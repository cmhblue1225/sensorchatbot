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
    constructor(gameService, aiService, supabaseClient) {
        this.gameService = gameService;
        this.aiService = aiService;
        this.supabaseClient = supabaseClient;
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

        // 게임 관리 페이지
        this.router.get('/game-manager', (req, res) => {
            this.getGameManagerPage(req, res);
        });

        // 계정 관리 페이지
        this.router.get('/account-management', (req, res) => {
            this.getAccountManagementPage(req, res);
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
     * ✅ Phase 5: 비공개 게임 필터링
     * - 공개 게임: 모든 사용자에게 표시
     * - 비공개 게임: 소유자에게만 표시 (배지 추가)
     */
    async getGamesPage(req, res) {
        try {
            // GameScanner에서 게임 목록 가져오기
            const allGames = this.gameService.getGames() || [];

            console.log('🎮 전체 게임 목록:', allGames.length, '개');

            // 현재 사용자 정보 가져오기 (선택적 인증)
            let currentUserId = null;
            const authHeader = req.headers.authorization;

            if (authHeader && authHeader.startsWith('Bearer ') && this.supabaseClient) {
                const token = authHeader.substring(7);
                try {
                    const { data: { user }, error } = await this.supabaseClient.auth.getUser(token);
                    if (!error && user) {
                        currentUserId = user.id;
                        console.log('👤 로그인한 사용자:', user.email);
                    }
                } catch (error) {
                    console.log('ℹ️  비로그인 사용자 (토큰 확인 실패)');
                }
            } else {
                console.log('ℹ️  비로그인 사용자');
            }

            // 각 게임의 is_public과 creator_id를 DB에서 가져오기
            const gamesWithVisibility = await Promise.all(allGames.map(async (game) => {
                let is_public = true;  // 기본값: 공개
                let creator_id = null;

                if (this.supabaseClient) {
                    try {
                        const { data, error } = await this.supabaseClient
                            .from('generated_games')
                            .select('is_public, creator_id')
                            .eq('game_id', game.id)
                            .single();

                        if (!error && data) {
                            is_public = data.is_public !== false;
                            creator_id = data.creator_id;
                        }
                    } catch (error) {
                        // DB에 없는 게임은 공개로 처리
                        console.log(`게임 ${game.id}의 공개 정보를 가져오지 못했습니다:`, error.message);
                    }
                }

                return {
                    ...game,
                    is_public,
                    creator_id,
                    is_owner: currentUserId && creator_id === currentUserId
                };
            }));

            // ✅ 필터링: 공개 게임 + 소유자의 비공개 게임
            const visibleGames = gamesWithVisibility.filter(game => {
                if (game.is_public) {
                    return true;  // 공개 게임은 모두에게 표시
                }
                // 비공개 게임은 소유자에게만 표시
                return currentUserId && game.creator_id === currentUserId;
            });

            console.log('✅ 필터링된 게임 목록:', visibleGames.length, '개');

            const html = this.htmlGenerator.generateGamesListPage({
                title: '게임 목록 - Sensor Game Hub',
                games: visibleGames
            });

            res.send(html);
        } catch (error) {
            console.error('게임 목록 페이지 생성 실패:', error);
            res.status(500).send('게임 목록 로딩 중 오류가 발생했습니다.');
        }
    }

    /**
     * 게임 관리 페이지
     */
    async getGameManagerPage(req, res) {
        try {
            // GameScanner에서 게임 목록 가져오기
            const games = this.gameService.getGames() || [];

            const html = this.htmlGenerator.generateGameManagerPage({
                title: '게임 관리 - Sensor Game Hub',
                games: games
            });

            res.send(html);
        } catch (error) {
            console.error('게임 관리 페이지 생성 실패:', error);
            res.status(500).send('게임 관리 페이지 로딩 중 오류가 발생했습니다.');
        }
    }

    /**
     * 계정 관리 페이지
     */
    async getAccountManagementPage(req, res) {
        try {
            const html = this.htmlGenerator.generateAccountManagementPage({
                title: '계정 관리 - Sensor Game Hub'
            });

            res.send(html);
        } catch (error) {
            console.error('계정 관리 페이지 생성 실패:', error);
            res.status(500).send('계정 관리 페이지 로딩 중 오류가 발생했습니다.');
        }
    }

    /**
     * 시스템 통계 정보 수집
     */
    async getSystemStats() {
        try {
            // 게임 수 (GameScanner에서 실제 게임 수 가져오기)
            const games = this.gameService.getGames() || [];
            const totalGames = games.length;

            // 문서 수
            const totalDocs = 35;

            // 벡터 임베딩 수
            const totalVectors = 616;

            // AI 기능 상태
            const aiStatus = this.aiService ? 'active' : 'inactive';

            console.log(`📊 랜딩 페이지 통계 - 게임 수: ${totalGames}개`);

            return {
                games: totalGames,
                documents: totalDocs,
                vectors: totalVectors,
                aiEnabled: aiStatus === 'active'
            };
        } catch (error) {
            console.error('통계 수집 실패:', error);
            // 오류 발생 시에도 실제 게임 수를 가져오려고 시도
            const games = this.gameService?.getGames() || [];
            return {
                games: games.length || 0,
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
