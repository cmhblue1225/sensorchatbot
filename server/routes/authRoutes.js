/**
 * 인증 관련 라우트
 * 회원가입, 로그인, 로그아웃 기능
 */

const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const { optionalAuth } = require('../middleware/authMiddleware');

class AuthRoutes {
    constructor() {
        this.router = express.Router();
        this.supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_ANON_KEY
        );
        // Service Role Key for admin operations (server-side only)
        this.supabaseAdmin = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        this.setupRoutes();
    }

    setupRoutes() {
        // 회원가입
        this.router.post('/api/auth/signup', async (req, res) => {
            await this.handleSignup(req, res);
        });

        // 로그인
        this.router.post('/api/auth/login', async (req, res) => {
            await this.handleLogin(req, res);
        });

        // 로그아웃
        this.router.post('/api/auth/logout', async (req, res) => {
            await this.handleLogout(req, res);
        });

        // 사용자 정보 조회
        this.router.get('/api/auth/user', optionalAuth, async (req, res) => {
            await this.handleGetUser(req, res);
        });

        // 토큰 갱신
        this.router.post('/api/auth/refresh', async (req, res) => {
            await this.handleRefreshToken(req, res);
        });

        // 비밀번호 재설정 요청
        this.router.post('/api/auth/reset-password', async (req, res) => {
            await this.handleResetPassword(req, res);
        });
    }

    /**
     * 회원가입 처리
     */
    async handleSignup(req, res) {
        try {
            const { email, password, name, nickname } = req.body;

            // 입력 검증
            if (!email || !password || !name || !nickname) {
                return res.status(400).json({
                    error: '이메일, 비밀번호, 이름, 닉네임을 모두 입력해주세요.',
                    code: 'MISSING_FIELDS'
                });
            }

            // 이메일 형식 검증
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return res.status(400).json({
                    error: '올바른 이메일 형식을 입력해주세요.',
                    code: 'INVALID_EMAIL'
                });
            }

            // 비밀번호 강도 검증
            if (password.length < 6) {
                return res.status(400).json({
                    error: '비밀번호는 최소 6자 이상이어야 합니다.',
                    code: 'WEAK_PASSWORD'
                });
            }

            // 닉네임 중복 확인
            const { data: existingCreator } = await this.supabase
                .from('game_creators')
                .select('nickname')
                .eq('nickname', nickname)
                .single();

            if (existingCreator) {
                return res.status(409).json({
                    error: '이미 사용 중인 닉네임입니다.',
                    code: 'NICKNAME_EXISTS'
                });
            }

            // Supabase Auth로 회원가입
            const { data, error } = await this.supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        name,
                        nickname
                    }
                }
            });

            if (error) {
                console.error('Signup error:', error);
                return res.status(400).json({
                    error: this.getErrorMessage(error),
                    code: error.message
                });
            }

            // game_creators 테이블에 사용자 정보 삽입 (Service Role Key 사용)
            const { error: creatorError } = await this.supabaseAdmin
                .from('game_creators')
                .insert({
                    id: data.user.id,
                    name: name,
                    nickname: nickname,
                    games_created: 0
                });

            if (creatorError) {
                console.error('Creator insert error:', creatorError);
                // Auth 사용자는 생성되었지만 creator 테이블 삽입 실패
                // 로그만 남기고 계속 진행 (나중에 수동으로 추가 가능)
            }

            // 회원가입 성공
            res.status(201).json({
                message: '회원가입이 완료되었습니다.',
                user: {
                    id: data.user.id,
                    email: data.user.email,
                    name,
                    nickname
                },
                session: data.session
            });

        } catch (error) {
            console.error('Signup handler error:', error);
            res.status(500).json({
                error: '회원가입 처리 중 오류가 발생했습니다.',
                code: 'SIGNUP_ERROR'
            });
        }
    }

    /**
     * 로그인 처리
     */
    async handleLogin(req, res) {
        try {
            const { email, password } = req.body;

            // 입력 검증
            if (!email || !password) {
                return res.status(400).json({
                    error: '이메일과 비밀번호를 입력해주세요.',
                    code: 'MISSING_CREDENTIALS'
                });
            }

            // Supabase Auth로 로그인
            const { data, error } = await this.supabase.auth.signInWithPassword({
                email,
                password
            });

            if (error) {
                console.error('Login error:', error);
                return res.status(401).json({
                    error: this.getErrorMessage(error),
                    code: error.message
                });
            }

            // 제작자 정보 조회
            let { data: creator, error: creatorError } = await this.supabase
                .from('game_creators')
                .select('name, nickname, games_created')
                .eq('id', data.user.id)
                .single();

            // game_creators 테이블에 데이터가 없으면 생성 (기존 사용자 대응)
            if (creatorError || !creator) {
                const userName = data.user.user_metadata?.name || data.user.email.split('@')[0];
                const userNickname = data.user.user_metadata?.nickname || userName;

                const { data: newCreator, error: insertError } = await this.supabaseAdmin
                    .from('game_creators')
                    .insert({
                        id: data.user.id,
                        name: userName,
                        nickname: userNickname,
                        games_created: 0
                    })
                    .select('name, nickname, games_created')
                    .single();

                if (!insertError) {
                    creator = newCreator;
                }
            }

            // 로그인 시간 업데이트
            if (creator) {
                try {
                    await this.supabase.rpc('update_creator_login', {
                        creator_id: data.user.id
                    });
                } catch (rpcError) {
                    // RPC 함수가 없어도 로그인은 계속 진행
                    console.log('update_creator_login RPC not available');
                }
            }

            // 로그인 성공
            res.json({
                message: '로그인되었습니다.',
                user: {
                    id: data.user.id,
                    email: data.user.email,
                    ...creator
                },
                session: data.session
            });

        } catch (error) {
            console.error('Login handler error:', error);
            res.status(500).json({
                error: '로그인 처리 중 오류가 발생했습니다.',
                code: 'LOGIN_ERROR'
            });
        }
    }

    /**
     * 로그아웃 처리
     */
    async handleLogout(req, res) {
        try {
            const authHeader = req.headers.authorization;
            if (authHeader && authHeader.startsWith('Bearer ')) {
                const token = authHeader.substring(7);
                await this.supabase.auth.signOut(token);
            }

            res.json({
                message: '로그아웃되었습니다.'
            });

        } catch (error) {
            console.error('Logout handler error:', error);
            res.status(500).json({
                error: '로그아웃 처리 중 오류가 발생했습니다.',
                code: 'LOGOUT_ERROR'
            });
        }
    }

    /**
     * 사용자 정보 조회
     */
    async handleGetUser(req, res) {
        try {
            if (!req.user) {
                return res.status(401).json({
                    error: '로그인이 필요합니다.',
                    code: 'NOT_AUTHENTICATED'
                });
            }

            // 제작자 정보 조회
            const { data: creator } = await this.supabase
                .from('game_creators')
                .select('name, nickname, games_created, last_game_created_at, created_at')
                .eq('id', req.user.id)
                .single();

            res.json({
                success: true,
                user: {
                    id: req.user.id,
                    email: req.user.email,
                    ...creator
                }
            });

        } catch (error) {
            console.error('Get user handler error:', error);
            res.status(500).json({
                error: '사용자 정보 조회 중 오류가 발생했습니다.',
                code: 'USER_INFO_ERROR'
            });
        }
    }

    /**
     * 토큰 갱신
     */
    async handleRefreshToken(req, res) {
        try {
            const { refresh_token } = req.body;

            if (!refresh_token) {
                return res.status(400).json({
                    error: 'Refresh token이 필요합니다.',
                    code: 'MISSING_REFRESH_TOKEN'
                });
            }

            const { data, error } = await this.supabase.auth.refreshSession({
                refresh_token
            });

            if (error) {
                return res.status(401).json({
                    error: '토큰 갱신에 실패했습니다.',
                    code: 'REFRESH_FAILED'
                });
            }

            res.json({
                session: data.session
            });

        } catch (error) {
            console.error('Refresh token handler error:', error);
            res.status(500).json({
                error: '토큰 갱신 중 오류가 발생했습니다.',
                code: 'REFRESH_ERROR'
            });
        }
    }

    /**
     * 비밀번호 재설정 요청
     */
    async handleResetPassword(req, res) {
        try {
            const { email } = req.body;

            if (!email) {
                return res.status(400).json({
                    error: '이메일을 입력해주세요.',
                    code: 'MISSING_EMAIL'
                });
            }

            const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password`
            });

            if (error) {
                console.error('Reset password error:', error);
                return res.status(400).json({
                    error: '비밀번호 재설정 요청에 실패했습니다.',
                    code: 'RESET_FAILED'
                });
            }

            res.json({
                message: '비밀번호 재설정 링크가 이메일로 전송되었습니다.'
            });

        } catch (error) {
            console.error('Reset password handler error:', error);
            res.status(500).json({
                error: '비밀번호 재설정 요청 중 오류가 발생했습니다.',
                code: 'RESET_ERROR'
            });
        }
    }

    /**
     * Supabase 에러 메시지를 사용자 친화적으로 변환
     */
    getErrorMessage(error) {
        const errorMap = {
            'User already registered': '이미 가입된 이메일입니다.',
            'Invalid login credentials': '이메일 또는 비밀번호가 올바르지 않습니다.',
            'Email not confirmed': '이메일 인증이 필요합니다.',
            'Password should be at least 6 characters': '비밀번호는 최소 6자 이상이어야 합니다.',
            'Unable to validate email address: invalid format': '올바른 이메일 형식을 입력해주세요.',
            'signup_disabled': '회원가입이 비활성화되어 있습니다.'
        };

        return errorMap[error.message] || error.message || '알 수 없는 오류가 발생했습니다.';
    }

    getRouter() {
        return this.router;
    }
}

module.exports = AuthRoutes;