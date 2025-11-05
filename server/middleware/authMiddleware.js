/**
 * Supabase 인증 미들웨어
 * 게임 제작자 권한 확인을 위한 미들웨어
 */

const { createClient } = require('@supabase/supabase-js');

class AuthMiddleware {
    constructor() {
        this.supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_ANON_KEY
        );
        // Service Role Key for admin operations (server-side only)
        this.supabaseAdmin = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );
    }

    /**
     * 게임 제작자 권한 확인 미들웨어
     * AI 게임 생성기 접근 시 사용
     */
    checkCreatorAuth = async (req, res, next) => {
        try {
            // Authorization 헤더에서 토큰 추출
            const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return res.status(401).json({
                    error: '게임 제작을 위해서는 로그인이 필요합니다.',
                    code: 'AUTH_REQUIRED'
                });
            }

            const token = authHeader.substring(7); // 'Bearer ' 제거

            // Supabase에서 토큰 검증
            const { data: { user }, error } = await this.supabase.auth.getUser(token);

            if (error || !user) {
                return res.status(401).json({
                    error: '유효하지 않은 인증 토큰입니다.',
                    code: 'INVALID_TOKEN'
                });
            }

            // 제작자 테이블에서 사용자 확인
            let { data: creator, error: creatorError } = await this.supabase
                .from('game_creators')
                .select('id, name, nickname')
                .eq('id', user.id)
                .single();

            // game_creators 테이블에 데이터가 없으면 자동으로 생성 (기존 사용자 대응)
            if (creatorError || !creator) {
                const userName = user.user_metadata?.name || user.email.split('@')[0];
                const userNickname = user.user_metadata?.nickname || userName;

                const { data: newCreator, error: insertError } = await this.supabaseAdmin
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
                    console.error('Auto-create creator error:', insertError);
                    return res.status(403).json({
                        error: '게임 제작 권한을 생성할 수 없습니다.',
                        code: 'CREATOR_CREATE_FAILED'
                    });
                }

                creator = newCreator;
            }

            // 요청 객체에 사용자 정보 추가
            req.user = user;
            req.creator = creator;

            next();
        } catch (error) {
            console.error('Auth middleware error:', error);
            return res.status(500).json({
                error: '인증 확인 중 오류가 발생했습니다.',
                code: 'AUTH_ERROR'
            });
        }
    };

    /**
     * 선택적 인증 미들웨어
     * 로그인된 경우에만 사용자 정보 추가
     */
    optionalAuth = async (req, res, next) => {
        try {
            const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                // 인증 없이 진행
                return next();
            }

            const token = authHeader.substring(7);
            const { data: { user }, error } = await this.supabase.auth.getUser(token);

            if (!error && user) {
                req.user = user;

                // 제작자 정보도 조회
                const { data: creator } = await this.supabase
                    .from('game_creators')
                    .select('id, name, nickname')
                    .eq('id', user.id)
                    .single();

                if (creator) {
                    req.creator = creator;
                }
            }

            next();
        } catch (error) {
            console.error('Optional auth middleware error:', error);
            // 에러가 있어도 진행
            next();
        }
    };

    /**
     * 관리자 권한 확인 (향후 확장용)
     */
    checkAdminAuth = async (req, res, next) => {
        try {
            // 먼저 기본 인증 확인
            await this.checkCreatorAuth(req, res, () => {});

            if (!req.creator) {
                return res.status(403).json({
                    error: '관리자 권한이 필요합니다.',
                    code: 'ADMIN_REQUIRED'
                });
            }

            // 관리자 확인 로직 (필요시 추가)
            // 현재는 모든 제작자가 관리자 권한 보유

            next();
        } catch (error) {
            console.error('Admin auth middleware error:', error);
            return res.status(500).json({
                error: '관리자 권한 확인 중 오류가 발생했습니다.',
                code: 'ADMIN_AUTH_ERROR'
            });
        }
    };

    /**
     * 게임 소유권 확인 미들웨어
     * 게임 수정/삭제 시 해당 게임의 제작자인지 확인
     * admin@admin.com 계정은 모든 게임에 접근 가능
     */
    checkGameOwnership = async (req, res, next) => {
        try {
            const gameId = req.params.gameId || req.body.gameId;

            if (!gameId) {
                return res.status(400).json({
                    error: 'gameId가 필요합니다.',
                    code: 'GAME_ID_REQUIRED'
                });
            }

            const userId = req.user?.id;
            const userEmail = req.user?.email;

            // 관리자는 모든 게임에 접근 가능
            if (userEmail === 'admin@admin.com') {
                req.isAdmin = true;
                return next();
            }

            // 일반 사용자는 자신이 만든 게임만 접근 가능
            const { data: game, error } = await this.supabase
                .from('generated_games')
                .select('creator_id')
                .eq('game_id', gameId)
                .single();

            if (error) {
                console.error('Game ownership check error:', error);
                return res.status(404).json({
                    error: '게임을 찾을 수 없습니다.',
                    code: 'GAME_NOT_FOUND'
                });
            }

            if (game.creator_id !== userId) {
                return res.status(403).json({
                    error: '이 게임에 대한 권한이 없습니다.',
                    code: 'FORBIDDEN'
                });
            }

            next();
        } catch (error) {
            console.error('Game ownership check error:', error);
            return res.status(500).json({
                error: '권한 확인 중 오류가 발생했습니다.',
                code: 'OWNERSHIP_CHECK_ERROR'
            });
        }
    };

    /**
     * 관리자 여부 확인 헬퍼 함수
     */
    isAdmin = (user) => {
        return user?.email === 'admin@admin.com';
    };
}

// 싱글톤 패턴으로 미들웨어 인스턴스 생성
const authMiddleware = new AuthMiddleware();

module.exports = {
    checkCreatorAuth: authMiddleware.checkCreatorAuth,
    optionalAuth: authMiddleware.optionalAuth,
    checkAdminAuth: authMiddleware.checkAdminAuth,
    checkGameOwnership: authMiddleware.checkGameOwnership,
    isAdmin: authMiddleware.isAdmin,
    AuthMiddleware
};