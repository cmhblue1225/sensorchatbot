/**
 * 🔧 GameMaintenanceManager v1.0
 *
 * 게임 생성 후 유지보수 시스템
 * - 세션 유지 및 관리
 * - 버그 리포트 처리
 * - 기능 추가 요청 처리
 * - 증분 업데이트 (전체 재생성 아님)
 *
 * ✅ 사용자가 게임 생성 후에도 계속 개선 가능
 */

const fs = require('fs').promises;
const path = require('path');
const { ChatAnthropic } = require('@langchain/anthropic');
const { createClient } = require('@supabase/supabase-js');

class GameMaintenanceManager {
    constructor(config) {
        this.config = config;
        this.llm = new ChatAnthropic({
            anthropicApiKey: config.claudeApiKey,
            model: config.claudeModel,
            maxTokens: 8192,  // 긴 게임 코드 처리 가능하도록 증가
            temperature: 0.2  // 유지보수는 정확성 최우선
        });

        // Supabase 클라이언트 초기화
        this.supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_ANON_KEY
        );

        // 활성 게임 세션 (gameId → 게임 정보)
        this.activeSessions = new Map();

        // 세션 만료 시간 (30분)
        this.sessionTimeout = 30 * 60 * 1000;

        // 자동 정리 타이머
        this.startSessionCleaner();
    }

    /**
     * 게임 세션 등록
     */
    registerGameSession(gameId, gameInfo) {
        this.activeSessions.set(gameId, {
            ...gameInfo,
            createdAt: Date.now(),
            lastAccessedAt: Date.now(),
            version: '1.0',
            modifications: []
        });

        console.log(`✅ 게임 세션 등록: ${gameId}`);
    }

    /**
     * 세션 존재 확인
     */
    hasSession(gameId) {
        return this.activeSessions.has(gameId);
    }

    /**
     * 세션 정보 가져오기
     */
    getSession(gameId) {
        const session = this.activeSessions.get(gameId);
        if (session) {
            session.lastAccessedAt = Date.now();
        }
        return session;
    }

    /**
     * 버그 리포트 처리
     */
    async handleBugReport(gameId, bugDescription, userContext = '') {
        console.log(`🐛 버그 리포트 받음: ${gameId}`);
        console.log(`설명: ${bugDescription}`);

        // 세션이 없으면 자동으로 생성 (기존 게임도 지원)
        if (!this.hasSession(gameId)) {
            console.log(`⚠️ 세션 없음. 자동 생성: ${gameId}`);
            await this.createSessionFromExistingGame(gameId);
        }

        const session = this.getSession(gameId);
        const gamePath = path.join(__dirname, '../public/games', gameId, 'index.html');

        try {
            // 1. 현재 게임 코드 읽기
            const currentCode = await fs.readFile(gamePath, 'utf-8');

            // 2. 버그 분석 및 수정 코드 생성
            const fixResult = await this.analyzeBugAndFix(currentCode, bugDescription, userContext);

            if (!fixResult.success) {
                return {
                    success: false,
                    message: '버그를 자동으로 수정할 수 없습니다. 더 구체적인 설명을 제공해주세요.',
                    analysis: fixResult.analysis
                };
            }

            // 3. 버전 백업 (현재 버전 저장)
            await this.backupVersion(gameId, session.version);

            // 4. 수정된 코드 저장
            await fs.writeFile(gamePath, fixResult.fixedCode, 'utf-8');

            // 5. 버전 증가
            session.version = this.incrementVersion(session.version);
            session.modifications.push({
                type: 'bug_fix',
                description: bugDescription,
                timestamp: Date.now(),
                version: session.version
            });

            // 6. DB에 버전 정보 저장
            await this.saveGameVersionToDB(gameId, session);

            console.log(`✅ 버그 수정 완료: ${gameId} (v${session.version})`);

            return {
                success: true,
                message: '버그가 수정되었습니다!',
                version: session.version,
                changes: fixResult.changes
            };

        } catch (error) {
            console.error(`❌ 버그 수정 실패: ${error.message}`);
            return {
                success: false,
                message: `버그 수정 중 오류 발생: ${error.message}`
            };
        }
    }

    /**
     * 버그 분석 및 수정 코드 생성
     */
    async analyzeBugAndFix(currentCode, bugDescription, userContext) {
        const prompt = `당신은 HTML5 Canvas 게임 버그를 분석하고 수정하는 전문 개발자입니다.

**사용자 버그 리포트:**
"${bugDescription}"

${userContext ? `**추가 정보:**\n${userContext}\n` : ''}

**현재 게임 코드:**
\`\`\`html
${currentCode.substring(0, 15000)}
\`\`\`

**분석 및 수정 작업:**
1. 버그의 정확한 원인을 JavaScript 코드에서 찾으세요
2. 버그를 수정한 완전한 HTML 파일을 생성하세요
3. 변경사항을 명확히 표시하세요

**중요 규칙:**
- SessionSDK, QR코드, 센서 연결 로직은 절대 변경하지 마세요
- <!DOCTYPE html>부터 </html>까지 전체 코드를 반환하세요
- 버그 수정에 필요한 최소한의 변경만 하세요
- gameStarted 플래그가 있으면 활용하세요

**일반적인 버그 패턴:**
- "공이 움직이지 않아요" → gameStarted 플래그 확인, 속도 초기화 확인
- "타이머가 작동 안해요" → setInterval/requestAnimationFrame 확인
- "센서 반응 없어요" → sensor-data 이벤트 핸들러 확인

**출력 형식:**
반드시 아래 형식으로 응답하세요:

\`\`\`html
<!DOCTYPE html>
<html>
... 전체 수정된 HTML 코드 ...
</html>
\`\`\`

지금 버그를 수정한 전체 HTML 코드를 생성하세요.`;

        try {
            const response = await this.llm.invoke(prompt);
            const fixedCode = this.extractHTML(response.content);

            // 간단한 검증: 기본 구조가 있는지 확인
            if (!fixedCode.includes('<!DOCTYPE html>') || !fixedCode.includes('SessionSDK')) {
                throw new Error('생성된 코드가 유효하지 않습니다');
            }

            return {
                success: true,
                fixedCode,
                changes: this.detectChanges(currentCode, fixedCode)
            };

        } catch (error) {
            return {
                success: false,
                analysis: `버그 분석 실패: ${error.message}`
            };
        }
    }

    /**
     * 기능 추가 요청 처리
     */
    async handleFeatureRequest(gameId, featureDescription, userContext = '') {
        console.log(`✨ 기능 추가 요청 받음: ${gameId}`);
        console.log(`설명: ${featureDescription}`);

        // 세션이 없으면 자동으로 생성 (기존 게임도 지원)
        if (!this.hasSession(gameId)) {
            console.log(`⚠️ 세션 없음. 자동 생성: ${gameId}`);
            await this.createSessionFromExistingGame(gameId);
        }

        const session = this.getSession(gameId);
        const gamePath = path.join(__dirname, '../public/games', gameId, 'index.html');

        try {
            // 1. 현재 게임 코드 읽기
            const currentCode = await fs.readFile(gamePath, 'utf-8');

            // 2. 기능 추가 코드 생성
            const addResult = await this.addFeatureToGame(currentCode, featureDescription, userContext);

            if (!addResult.success) {
                return {
                    success: false,
                    message: '기능을 자동으로 추가할 수 없습니다. 더 구체적인 설명을 제공해주세요.',
                    analysis: addResult.analysis
                };
            }

            // 3. 버전 백업
            await this.backupVersion(gameId, session.version);

            // 4. 수정된 코드 저장
            await fs.writeFile(gamePath, addResult.enhancedCode, 'utf-8');

            // 5. 버전 증가
            session.version = this.incrementVersion(session.version);
            session.modifications.push({
                type: 'feature_add',
                description: featureDescription,
                timestamp: Date.now(),
                version: session.version
            });

            // 6. DB에 버전 정보 저장
            await this.saveGameVersionToDB(gameId, session);

            console.log(`✅ 기능 추가 완료: ${gameId} (v${session.version})`);

            return {
                success: true,
                message: '기능이 추가되었습니다!',
                version: session.version,
                changes: addResult.changes
            };

        } catch (error) {
            console.error(`❌ 기능 추가 실패: ${error.message}`);
            return {
                success: false,
                message: `기능 추가 중 오류 발생: ${error.message}`
            };
        }
    }

    /**
     * 기능 추가 코드 생성
     */
    async addFeatureToGame(currentCode, featureDescription, userContext) {
        const prompt = `당신은 게임에 새로운 기능을 추가하는 전문가입니다.

**사용자 기능 요청:**
${featureDescription}

${userContext ? `**추가 컨텍스트:**\n${userContext}\n` : ''}

**현재 게임 코드:**
\`\`\`html
${currentCode}
\`\`\`

**작업:**
1. 요청된 기능을 게임에 추가하세요
2. 기존 로직과 충돌하지 않도록 통합하세요
3. 추가된 기능을 간단히 설명하세요

**주의사항:**
- 기존 게임 로직을 최대한 보존
- SessionSDK 통합은 절대 건드리지 말 것
- 새 기능이 기존 기능과 충돌하지 않도록 주의

**출력 형식:**
반드시 \`\`\`html 코드 블록으로 전체 HTML을 감싸주세요.`;

        try {
            const response = await this.llm.invoke(prompt);
            const enhancedCode = this.extractHTML(response.content);

            // 간단한 검증
            if (!enhancedCode.includes('<!DOCTYPE html>') || !enhancedCode.includes('SessionSDK')) {
                throw new Error('생성된 코드가 유효하지 않습니다');
            }

            return {
                success: true,
                enhancedCode,
                changes: this.detectChanges(currentCode, enhancedCode)
            };

        } catch (error) {
            return {
                success: false,
                analysis: `기능 추가 실패: ${error.message}`
            };
        }
    }

    /**
     * 버전 백업
     */
    async backupVersion(gameId, version) {
        const gamePath = path.join(__dirname, '../public/games', gameId, 'index.html');
        const backupDir = path.join(__dirname, '../public/games', gameId, 'backups');
        const backupPath = path.join(backupDir, `index.v${version}.html`);

        try {
            // 백업 디렉토리 생성
            await fs.mkdir(backupDir, { recursive: true });

            // 현재 버전 백업
            const currentCode = await fs.readFile(gamePath, 'utf-8');
            await fs.writeFile(backupPath, currentCode, 'utf-8');

            console.log(`💾 백업 완료: ${backupPath}`);
        } catch (error) {
            console.error(`⚠️ 백업 실패: ${error.message}`);
        }
    }

    /**
     * 버전 증가
     */
    incrementVersion(currentVersion) {
        const parts = currentVersion.split('.');
        const minor = parseInt(parts[1] || 0) + 1;
        return `${parts[0]}.${minor}`;
    }

    /**
     * HTML 추출
     */
    extractHTML(content) {
        // HTML 코드 블록 추출
        const htmlMatch = content.match(/```html\n([\s\S]*?)\n```/);
        if (htmlMatch) {
            return htmlMatch[1].trim();
        }

        // 코드 블록 없이 바로 HTML인 경우
        if (content.includes('<!DOCTYPE html>')) {
            return content.trim();
        }

        throw new Error('HTML 코드를 찾을 수 없습니다');
    }

    /**
     * 변경 사항 감지 (간단한 버전)
     */
    detectChanges(oldCode, newCode) {
        const changes = [];

        // 라인 수 변화
        const oldLines = oldCode.split('\n').length;
        const newLines = newCode.split('\n').length;
        const lineDiff = newLines - oldLines;

        if (lineDiff > 0) {
            changes.push(`${lineDiff}줄 추가됨`);
        } else if (lineDiff < 0) {
            changes.push(`${Math.abs(lineDiff)}줄 제거됨`);
        }

        // 주요 변경 사항 감지
        if (newCode.includes('function') && !oldCode.includes('function')) {
            changes.push('새로운 함수 추가됨');
        }

        if (newCode.match(/const|let|var/) && newCode.length > oldCode.length) {
            changes.push('새로운 변수 추가됨');
        }

        return changes.length > 0 ? changes : ['코드 수정됨'];
    }

    /**
     * 세션 자동 정리 (30분마다)
     */
    startSessionCleaner() {
        setInterval(() => {
            const now = Date.now();
            let cleaned = 0;

            for (const [gameId, session] of this.activeSessions.entries()) {
                if (now - session.lastAccessedAt > this.sessionTimeout) {
                    this.activeSessions.delete(gameId);
                    cleaned++;
                }
            }

            if (cleaned > 0) {
                console.log(`🧹 ${cleaned}개 만료된 세션 정리됨`);
            }
        }, 5 * 60 * 1000); // 5분마다 실행
    }

    /**
     * 기존 게임에서 세션 생성 (세션 없이도 유지보수 가능)
     */
    async createSessionFromExistingGame(gameId) {
        try {
            const gamePath = path.join(__dirname, '../public/games', gameId, 'index.html');

            // 게임 파일 존재 확인
            await fs.access(gamePath);

            // 1. DB에서 버전 정보 로드 시도
            const dbSession = await this.loadSessionFromDB(gameId);

            // 2. game.json에서 메타데이터 읽기 (있으면)
            let gameInfo = { title: gameId };
            try {
                const gameJsonPath = path.join(__dirname, '../public/games', gameId, 'game.json');
                const gameJsonContent = await fs.readFile(gameJsonPath, 'utf-8');
                gameInfo = JSON.parse(gameJsonContent);
            } catch (e) {
                // game.json 없으면 기본값 사용
            }

            // 3. 세션 등록 (DB 정보 우선, 없으면 기본값)
            this.registerGameSession(gameId, {
                title: (dbSession && dbSession.title) || gameInfo.title || gameId,
                description: (dbSession && dbSession.description) || gameInfo.description || '기존 게임',
                gameType: (dbSession && dbSession.gameType) || gameInfo.gameType || 'solo',
                path: `games/${gameId}`,
                version: (dbSession && dbSession.version) || '1.0',
                modifications: (dbSession && dbSession.modifications) || []
            });

            console.log(`✅ 기존 게임 세션 생성: ${gameId} (v${(dbSession && dbSession.version) || '1.0'})`);
            return true;
        } catch (error) {
            console.error(`❌ 세션 생성 실패: ${gameId}`, error.message);
            throw new Error(`게임을 찾을 수 없습니다: ${gameId}`);
        }
    }

    /**
     * 세션 정보 조회 (디버깅용)
     */
    getAllSessions() {
        const sessions = [];
        for (const [gameId, session] of this.activeSessions.entries()) {
            sessions.push({
                gameId,
                version: session.version,
                createdAt: new Date(session.createdAt).toISOString(),
                lastAccessedAt: new Date(session.lastAccessedAt).toISOString(),
                modifications: session.modifications.length
            });
        }
        return sessions;
    }

    /**
     * 특정 세션의 수정 이력 조회 (메모리 + DB)
     */
    async getModificationHistory(gameId) {
        // 1. 메모리 세션에서 확인
        const session = this.getSession(gameId);
        if (session && session.modifications && session.modifications.length > 0) {
            return session.modifications.map(mod => ({
                type: mod.type === 'bug_fix' ? '🐛 버그 수정' : '✨ 기능 추가',
                description: mod.description,
                timestamp: new Date(mod.timestamp).toISOString(),
                version: mod.version
            }));
        }

        // 2. 세션 없거나 이력 없으면 DB에서 조회
        try {
            const dbVersion = await this.getGameVersionFromDB(gameId);
            if (dbVersion && dbVersion.modifications && dbVersion.modifications.length > 0) {
                return dbVersion.modifications.map(mod => ({
                    type: mod.type === 'bug_fix' ? '🐛 버그 수정' : '✨ 기능 추가',
                    description: mod.description,
                    timestamp: new Date(mod.timestamp).toISOString(),
                    version: mod.version
                }));
            }
        } catch (error) {
            console.error(`❌ DB에서 이력 조회 실패: ${gameId}`, error.message);
        }

        return null;
    }

    /**
     * ===== Supabase DB 연동 메서드 =====
     */

    /**
     * DB에서 게임 버전 정보 가져오기
     */
    async getGameVersionFromDB(gameId) {
        try {
            const { data, error } = await this.supabase
                .from('game_versions')
                .select('*')
                .eq('game_id', gameId)
                .single();

            if (error && error.code !== 'PGRST116') { // PGRST116 = not found
                throw error;
            }

            return data;
        } catch (error) {
            console.error(`❌ DB 조회 실패: ${gameId}`, error.message);
            return null;
        }
    }

    /**
     * DB에 게임 버전 정보 저장
     */
    async saveGameVersionToDB(gameId, session) {
        try {
            const versionData = {
                game_id: gameId,
                current_version: session.version,
                title: session.title,
                description: session.description,
                game_type: session.gameType,
                modifications: session.modifications
            };

            const { data, error } = await this.supabase
                .from('game_versions')
                .upsert(versionData, {
                    onConflict: 'game_id'
                })
                .select()
                .single();

            if (error) {
                throw error;
            }

            console.log(`✅ DB 저장 완료: ${gameId} v${session.version}`);
            return data;
        } catch (error) {
            console.error(`❌ DB 저장 실패: ${gameId}`, error.message);
            throw error;
        }
    }

    /**
     * 세션 로드 시 DB에서 버전 정보 복원
     */
    async loadSessionFromDB(gameId) {
        const dbVersion = await this.getGameVersionFromDB(gameId);

        if (dbVersion) {
            // DB에 저장된 정보로 세션 복원
            return {
                version: dbVersion.current_version,
                title: dbVersion.title,
                description: dbVersion.description,
                gameType: dbVersion.game_type,
                modifications: dbVersion.modifications || []
            };
        }

        return null;
    }
}

module.exports = GameMaintenanceManager;
