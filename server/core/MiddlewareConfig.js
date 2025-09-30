/**
 * 🔧 MiddlewareConfig v6.0
 *
 * Express 미들웨어 설정
 * - 보안 및 성능 미들웨어
 * - 정적 파일 서빙
 * - 요청 로깅
 */

const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const express = require('express');

class MiddlewareConfig {
    /**
     * Express 앱에 미들웨어 설정
     */
    static setupMiddleware(app) {
        // 보안 미들웨어
        // CSP 완전 비활성화 (개발 편의상)
        app.use(helmet({
            contentSecurityPolicy: false,
            crossOriginEmbedderPolicy: false // Socket.IO 호환성
        }));

        // 성능 미들웨어
        app.use(compression({
            threshold: 1024, // 1KB 이상만 압축
            level: 6, // 압축 레벨 (1-9)
            filter: (req, res) => {
                // 이미 압축된 파일은 제외
                if (req.headers['x-no-compression']) {
                    return false;
                }
                return compression.filter(req, res);
            }
        }));

        // CORS 설정
        app.use(cors({
            origin: process.env.NODE_ENV === 'production'
                ? ['https://your-domain.com'] // 프로덕션 도메인
                : true, // 개발 환경에서는 모든 origin 허용
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
        }));

        // JSON 파싱
        app.use(express.json({
            limit: '10mb', // 요청 본문 크기 제한
            strict: true
        }));

        // URL 인코딩 파싱
        app.use(express.urlencoded({
            extended: true,
            limit: '10mb'
        }));

        // 정적 파일 서빙
        app.use(express.static(path.join(__dirname, '../../public'), {
            maxAge: process.env.NODE_ENV === 'production' ? '1d' : '0', // 캐시 설정
            etag: true,
            lastModified: true
        }));

        // 요청 로깅 미들웨어
        app.use(MiddlewareConfig.requestLogger);

        // 에러 처리 미들웨어
        app.use(MiddlewareConfig.errorHandler);

        console.log('🔧 미들웨어 설정 완료');
    }

    /**
     * 요청 로깅 미들웨어
     */
    static requestLogger(req, res, next) {
        const start = Date.now();
        const userAgent = req.get('User-Agent') || 'Unknown';
        const isBot = /bot|crawler|spider/i.test(userAgent);

        // 봇 요청은 간단히 로깅
        if (isBot) {
            console.log(`🤖 Bot ${req.method} ${req.path} - ${req.ip}`);
            return next();
        }

        // 응답 완료 시 로깅
        res.on('finish', () => {
            const duration = Date.now() - start;
            const statusCode = res.statusCode;
            const statusIcon = statusCode >= 400 ? '❌' : statusCode >= 300 ? '🔄' : '✅';

            console.log(
                `${statusIcon} ${req.method} ${req.path} - ` +
                `${statusCode} - ${duration}ms - ${req.ip}`
            );
        });

        next();
    }

    /**
     * 전역 에러 처리 미들웨어
     */
    static errorHandler(err, req, res, next) {
        console.error('❌ 서버 에러:', err);

        // 클라이언트에게 안전한 에러 메시지 전송
        const isDevelopment = process.env.NODE_ENV !== 'production';

        res.status(err.status || 500).json({
            success: false,
            error: isDevelopment ? err.message : '서버 내부 오류가 발생했습니다.',
            ...(isDevelopment && { stack: err.stack })
        });
    }

    /**
     * 404 처리 미들웨어
     */
    static notFoundHandler(req, res) {
        res.status(404).json({
            success: false,
            error: '요청한 리소스를 찾을 수 없습니다.',
            path: req.path
        });
    }
}

module.exports = MiddlewareConfig;