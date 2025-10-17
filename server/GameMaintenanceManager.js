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
    constructor(config, gameScanner = null) {
        this.config = config;
        this.llm = new ChatAnthropic({
            anthropicApiKey: config.claudeApiKey,
            model: config.claudeModel,
            maxTokens: 64000,  // Claude Sonnet 4.5의 최대 출력 토큰 (공식 문서 확인)
            temperature: 0.2,  // 유지보수는 정확성 최우선
            streaming: true  // ✅ 스트리밍 활성화 (타임아웃 방지)
        });

        // Supabase 클라이언트 초기화 (읽기용 - Anon Key)
        this.supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_ANON_KEY
        );

        // Supabase Admin 클라이언트 초기화 (Storage 쓰기용 - Service Role Key)
        this.supabaseAdmin = null;
        if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
            this.supabaseAdmin = createClient(
                process.env.SUPABASE_URL,
                process.env.SUPABASE_SERVICE_ROLE_KEY
            );
            console.log('✅ Supabase Admin Client 초기화 (Storage 쓰기 가능)');
        }

        // GameScanner 주입 (자동 재스캔용)
        this.gameScanner = gameScanner;

        // 활성 게임 세션 (gameId → 게임 정보)
        this.activeSessions = new Map();

        // 세션 만료 시간 (24시간)
        // 💡 만료되어도 DB에서 자동 복원되므로 걱정 없음!
        this.sessionTimeout = 24 * 60 * 60 * 1000;  // 24시간 (기존: 30분)

        // 자동 정리 타이머
        this.startSessionCleaner();

        console.log('🔧 GameMaintenanceManager 초기화 완료', {
            hasGameScanner: !!this.gameScanner,
            streamingEnabled: true
        });
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
     * 🌐 Supabase Storage 또는 로컬에서 게임 코드 읽기
     */
    async readGameCode(gameId) {
        // 1. Storage에서 먼저 시도 (원격 게임)
        if (this.supabaseAdmin) {
            try {
                console.log(`☁️  Storage에서 게임 읽기 시도: ${gameId}`);
                const storagePath = `${gameId}/index.html`;

                const { data, error } = await this.supabaseAdmin
                    .storage
                    .from('games')
                    .download(storagePath);

                if (!error && data) {
                    const code = await data.text();
                    console.log(`✅ Storage에서 읽기 성공: ${code.length} 문자`);
                    return { code, source: 'storage' };
                }
            } catch (storageError) {
                console.log(`⚠️ Storage 읽기 실패, 로컬 시도: ${storageError.message}`);
            }
        }

        // 2. 로컬 파일 시스템에서 시도
        try {
            const gamePath = path.join(__dirname, '../public/games', gameId, 'index.html');
            const code = await fs.readFile(gamePath, 'utf-8');
            console.log(`✅ 로컬에서 읽기 성공: ${code.length} 문자`);
            return { code, source: 'local' };
        } catch (localError) {
            throw new Error(`게임 코드를 찾을 수 없습니다: ${gameId}`);
        }
    }

    /**
     * 🌐 Supabase Storage와 로컬에 게임 코드 저장
     */
    async saveGameCode(gameId, code, version) {
        const results = { storage: false, local: false };

        // 1. Storage에 저장 (우선순위 높음)
        if (this.supabaseAdmin) {
            try {
                console.log(`☁️  Storage에 게임 저장 중: ${gameId}`);
                const storagePath = `${gameId}/index.html`;

                const { error: uploadError } = await this.supabaseAdmin
                    .storage
                    .from('games')
                    .upload(storagePath, code, {
                        contentType: 'text/html',
                        upsert: true  // 덮어쓰기
                    });

                if (!uploadError) {
                    console.log(`✅ Storage 저장 성공`);
                    results.storage = true;

                    // DB 메타데이터도 업데이트
                    await this.updateGeneratedGamesDB(gameId, version);
                } else {
                    console.error(`❌ Storage 저장 실패:`, uploadError.message);
                }
            } catch (storageError) {
                console.error(`❌ Storage 저장 오류:`, storageError.message);
            }
        }

        // 2. 로컬에도 저장 (백업 및 개발용)
        try {
            const gamePath = path.join(__dirname, '../public/games', gameId, 'index.html');
            await fs.writeFile(gamePath, code, 'utf-8');
            console.log(`✅ 로컬 저장 성공`);
            results.local = true;
        } catch (localError) {
            console.warn(`⚠️ 로컬 저장 실패: ${localError.message}`);
        }

        return results;
    }

    /**
     * 🌐 generated_games DB 테이블 업데이트
     */
    async updateGeneratedGamesDB(gameId, version) {
        try {
            const { error } = await this.supabaseAdmin
                .from('generated_games')
                .update({
                    metadata: {
                        version: version,
                        lastModified: new Date().toISOString()
                    },
                    updated_at: new Date().toISOString()
                })
                .eq('game_id', gameId);

            if (!error) {
                console.log(`✅ generated_games DB 업데이트 성공: ${gameId}`);
            }
        } catch (error) {
            console.warn(`⚠️ DB 업데이트 실패: ${error.message}`);
        }
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

        try {
            // 1. 현재 게임 코드 읽기 (Storage 우선)
            const { code: currentCode, source } = await this.readGameCode(gameId);
            console.log(`📖 게임 코드 읽기 완료 (source: ${source})`);


            // 2. 버그 분석 및 수정 코드 생성
            const fixResult = await this.analyzeBugAndFix(currentCode, bugDescription, userContext);

            if (!fixResult.success) {
                return {
                    success: false,
                    message: '버그를 자동으로 수정할 수 없습니다. 더 구체적인 설명을 제공해주세요.',
                    analysis: fixResult.analysis
                };
            }

            // 3. 버전 증가
            const newVersion = this.incrementVersion(session.version);

            // 4. 버전 백업 (Storage 지원)
            await this.backupVersion(gameId, session.version, currentCode);

            // 5. 수정된 코드 저장 (Storage + Local)
            const saveResults = await this.saveGameCode(gameId, fixResult.fixedCode, newVersion);
            console.log(`💾 저장 결과:`, saveResults);

            // 6. 세션 정보 업데이트
            session.version = newVersion;
            session.modifications.push({
                type: 'bug_fix',
                description: bugDescription,
                timestamp: Date.now(),
                version: newVersion
            });

            // 7. DB에 버전 정보 저장
            await this.saveGameVersionToDB(gameId, session);

            // 7. 🔄 GameScanner 자동 재스캔 (게임 허브에 즉시 반영)
            if (this.gameScanner) {
                try {
                    console.log('🔄 GameScanner 재스캔 중...');
                    await this.gameScanner.scanGames();
                    console.log('✅ GameScanner 재스캔 완료 - 허브에 반영됨');
                } catch (scanError) {
                    console.error('⚠️ GameScanner 재스캔 실패:', scanError.message);
                    // 게임은 수정되었으므로 오류로 처리하지 않음
                }
            } else {
                console.log('⚠️ GameScanner 없음 - 서버 재시작 시 반영됨');
            }

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
        const codeLength = currentCode.length;
        console.log(`📏 원본 코드 길이: ${codeLength} 문자`);

        const prompt = `당신은 HTML5 Canvas 게임 버그 수정 전문가입니다.

**사용자 버그 리포트:**
"${bugDescription}"

${userContext ? `**추가 정보:**\n${userContext}\n` : ''}

**현재 게임 코드:**
\`\`\`html
${currentCode}
\`\`\`

**작업 지침:**
1. 버그의 정확한 원인을 찾아 최소한의 변경으로 수정하세요
2. SessionSDK, QR코드, 센서 연결 로직은 절대 건드리지 마세요
3. 전체 HTML 코드를 반환하되, 수정된 부분을 명확히 표시하세요

**버그 패턴별 해결책:**
- "센서 민감도가 낮아요" / "반응이 둔해요":
  → SENSOR_THRESHOLD 값 낮추기 (15-20 → 5-10)
  → sensitivity 계수 높이기 (1.0 → 1.5-2.0)
  → 센서 데이터 곱셈 계수 증가 (gamma * 0.5 → gamma * 1.5)
  → ROTATION_COOLDOWN 감소 (300ms → 100ms)

**출력 형식:**
먼저 변경사항을 간단히 설명하고, 그 다음 전체 HTML 코드를 반환하세요.

변경 사항:
- [수정 1]
- [수정 2]

수정된 전체 코드:
\`\`\`html
<!DOCTYPE html>
... 전체 코드 ...
</html>
\`\`\``;

        try {
            console.log('🤖 LLM 스트리밍 호출 중... (타임아웃 방지)');

            // ✅ 스트리밍으로 응답 받기 (10분+ 타임아웃 방지)
            let fullResponse = '';
            let chunkCount = 0;

            const stream = await this.llm.stream(prompt);

            for await (const chunk of stream) {
                fullResponse += chunk.content;
                chunkCount++;

                // 진행 상황 로깅 (1000청크마다)
                if (chunkCount % 1000 === 0) {
                    console.log(`📦 청크 ${chunkCount}개 받음, 현재 길이: ${fullResponse.length}자`);
                }
            }

            console.log(`✅ LLM 스트리밍 완료: 총 ${chunkCount}개 청크, ${fullResponse.length}자`);

            const fixedCode = this.extractHTML(fullResponse);
            console.log('📝 HTML 추출 완료, 길이:', fixedCode.length);

            // 간단한 검증: 기본 구조가 있는지 확인
            if (!fixedCode.includes('<!DOCTYPE html>') || !fixedCode.includes('SessionSDK')) {
                console.error('❌ 코드 검증 실패:', {
                    hasDoctype: fixedCode.includes('<!DOCTYPE html>'),
                    hasSessionSDK: fixedCode.includes('SessionSDK')
                });
                throw new Error('생성된 코드가 유효하지 않습니다');
            }

            return {
                success: true,
                fixedCode,
                changes: this.detectChanges(currentCode, fixedCode)
            };

        } catch (error) {
            console.error('❌ 버그 수정 실패:', error.message);
            console.error('상세 에러:', error.stack);
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

        try {
            // 1. 현재 게임 코드 읽기 (Storage 우선)
            const { code: currentCode, source } = await this.readGameCode(gameId);
            console.log(`📖 게임 코드 읽기 완료 (source: ${source})`);

            // 2. 기능 추가 코드 생성
            const addResult = await this.addFeatureToGame(currentCode, featureDescription, userContext);

            if (!addResult.success) {
                return {
                    success: false,
                    message: '기능을 자동으로 추가할 수 없습니다. 더 구체적인 설명을 제공해주세요.',
                    analysis: addResult.analysis
                };
            }

            // 3. 버전 증가
            const newVersion = this.incrementVersion(session.version);

            // 4. 버전 백업 (Storage 지원)
            await this.backupVersion(gameId, session.version, currentCode);

            // 5. 수정된 코드 저장 (Storage + Local)
            const saveResults = await this.saveGameCode(gameId, addResult.enhancedCode, newVersion);
            console.log(`💾 저장 결과:`, saveResults);

            // 6. 세션 정보 업데이트
            session.version = newVersion;
            session.modifications.push({
                type: 'feature_add',
                description: featureDescription,
                timestamp: Date.now(),
                version: newVersion
            });

            // 7. DB에 버전 정보 저장
            await this.saveGameVersionToDB(gameId, session);

            // 7. 🔄 GameScanner 자동 재스캔 (게임 허브에 즉시 반영)
            if (this.gameScanner) {
                try {
                    console.log('🔄 GameScanner 재스캔 중...');
                    await this.gameScanner.scanGames();
                    console.log('✅ GameScanner 재스캔 완료 - 허브에 반영됨');
                } catch (scanError) {
                    console.error('⚠️ GameScanner 재스캔 실패:', scanError.message);
                    // 게임은 수정되었으므로 오류로 처리하지 않음
                }
            } else {
                console.log('⚠️ GameScanner 없음 - 서버 재시작 시 반영됨');
            }

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
        const codeLength = currentCode.length;
        console.log(`📏 원본 코드 길이: ${codeLength} 문자`);

        const prompt = `당신은 게임 기능 추가 전문가입니다.

**사용자 기능 요청:**
${featureDescription}

${userContext ? `**추가 컨텍스트:**\n${userContext}\n` : ''}

**현재 게임 코드:**
\`\`\`html
${currentCode}
\`\`\`

**작업 지침:**
1. 요청된 기능을 최소한의 변경으로 추가하세요
2. SessionSDK, QR코드, 센서 연결 로직은 절대 건드리지 마세요
3. 전체 HTML 코드를 반환하되, 추가된 부분을 명확히 표시하세요

**출력 형식:**
먼저 추가된 기능을 간단히 설명하고, 그 다음 전체 HTML 코드를 반환하세요.

추가된 기능:
- [기능 1]
- [기능 2]

기능이 추가된 전체 코드:
\`\`\`html
<!DOCTYPE html>
... 전체 코드 ...
</html>
\`\`\``;

        try {
            console.log('🤖 LLM 스트리밍 호출 중... (기능 추가)');

            // ✅ 스트리밍으로 응답 받기
            let fullResponse = '';
            let chunkCount = 0;

            const stream = await this.llm.stream(prompt);

            for await (const chunk of stream) {
                fullResponse += chunk.content;
                chunkCount++;

                if (chunkCount % 1000 === 0) {
                    console.log(`📦 청크 ${chunkCount}개 받음, 현재 길이: ${fullResponse.length}자`);
                }
            }

            console.log(`✅ LLM 스트리밍 완료: 총 ${chunkCount}개 청크, ${fullResponse.length}자`);

            const enhancedCode = this.extractHTML(fullResponse);

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
            console.error('❌ 기능 추가 실패:', error.message);
            return {
                success: false,
                analysis: `기능 추가 실패: ${error.message}`
            };
        }
    }

    /**
     * 버전 백업 (Storage + Local)
     */
    async backupVersion(gameId, version, currentCode) {
        // 1. Storage에 백업 (우선순위)
        if (this.supabaseAdmin) {
            try {
                const backupPath = `${gameId}/backups/index.v${version}.html`;

                const { error } = await this.supabaseAdmin
                    .storage
                    .from('games')
                    .upload(backupPath, currentCode, {
                        contentType: 'text/html',
                        upsert: false  // 덮어쓰기 안함
                    });

                if (!error) {
                    console.log(`💾 Storage 백업 완료: v${version}`);
                }
            } catch (storageError) {
                console.warn(`⚠️ Storage 백업 실패: ${storageError.message}`);
            }
        }

        // 2. 로컬에도 백업
        try {
            const backupDir = path.join(__dirname, '../public/games', gameId, 'backups');
            const backupPath = path.join(backupDir, `index.v${version}.html`);

            await fs.mkdir(backupDir, { recursive: true });
            await fs.writeFile(backupPath, currentCode, 'utf-8');

            console.log(`💾 로컬 백업 완료: ${backupPath}`);
        } catch (error) {
            console.warn(`⚠️ 로컬 백업 실패: ${error.message}`);
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
