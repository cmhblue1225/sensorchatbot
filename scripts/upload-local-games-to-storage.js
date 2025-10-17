/**
 * 🚀 로컬 게임들을 Supabase Storage에 업로드
 *
 * 이 스크립트는 public/games/ 폴더의 모든 게임을 Supabase Storage에 업로드하고
 * generated_games 테이블에 메타데이터를 등록합니다.
 */

require('dotenv').config();
const fs = require('fs').promises;
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Supabase 클라이언트 초기화
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

const gamesDir = path.join(__dirname, '../public/games');

async function uploadFileToStorage(storagePath, content, contentType) {
    const { error: uploadError } = await supabase
        .storage
        .from('games')
        .upload(storagePath, content, {
            contentType: contentType,
            upsert: true
        });

    if (uploadError) {
        if (uploadError.message.includes('already exists')) {
            // 이미 존재하면 업데이트
            const { error: updateError } = await supabase
                .storage
                .from('games')
                .update(storagePath, content, {
                    contentType: contentType,
                    upsert: true
                });

            if (updateError) {
                throw updateError;
            }
        } else {
            throw uploadError;
        }
    }
}

async function uploadGameFolder(gameId, gamePath) {
    const uploadedFiles = [];

    async function uploadDir(dirPath, relativePath = '') {
        const entries = await fs.readdir(dirPath, { withFileTypes: true });

        for (const entry of entries) {
            const fullPath = path.join(dirPath, entry.name);
            const relPath = relativePath ? `${relativePath}/${entry.name}` : entry.name;

            if (entry.isDirectory()) {
                // 재귀적으로 디렉토리 탐색
                await uploadDir(fullPath, relPath);
            } else {
                // 파일 업로드
                const content = await fs.readFile(fullPath);
                const storagePath = `${gameId}/${relPath}`;

                // MIME 타입 결정
                let contentType = 'application/octet-stream';
                if (entry.name.endsWith('.html')) contentType = 'text/html';
                else if (entry.name.endsWith('.json')) contentType = 'application/json';
                else if (entry.name.endsWith('.md')) contentType = 'text/markdown';
                else if (entry.name.endsWith('.js')) contentType = 'text/javascript';
                else if (entry.name.endsWith('.css')) contentType = 'text/css';
                else if (entry.name.endsWith('.png')) contentType = 'image/png';
                else if (entry.name.endsWith('.jpg') || entry.name.endsWith('.jpeg')) contentType = 'image/jpeg';
                else if (entry.name.endsWith('.svg')) contentType = 'image/svg+xml';
                else if (entry.name.endsWith('.mp3')) contentType = 'audio/mpeg';
                else if (entry.name.endsWith('.wav')) contentType = 'audio/wav';

                await uploadFileToStorage(storagePath, content, contentType);
                uploadedFiles.push(relPath);
                console.log(`      ✓ ${relPath}`);
            }
        }
    }

    await uploadDir(gamePath);
    return uploadedFiles;
}

async function uploadGame(gameId) {
    console.log(`\n📦 게임 업로드 중: ${gameId}`);

    try {
        const gamePath = path.join(gamesDir, gameId);

        // 1. 게임 폴더의 모든 파일 업로드
        console.log(`   ☁️  Storage 업로드 중...`);
        const uploadedFiles = await uploadGameFolder(gameId, gamePath);
        console.log(`   ✅ Storage 업로드 완료 (${uploadedFiles.length}개 파일)`);

        // 2. game.json 읽기 (메타데이터용)
        let metadata = {
            title: gameId,
            description: `${gameId} 게임`,
            gameType: 'solo',
            genre: 'action'
        };

        try {
            const gameJsonPath = path.join(gamePath, 'game.json');
            const gameJsonContent = await fs.readFile(gameJsonPath, 'utf-8');
            const gameJson = JSON.parse(gameJsonContent);
            metadata = {
                title: gameJson.title || gameId,
                description: gameJson.description || `${gameId} 게임`,
                gameType: gameJson.gameType || gameJson.category || 'solo',
                genre: gameJson.genre || 'action'
            };
        } catch (e) {
            console.log(`   ⚠️  game.json 없음, 기본값 사용`);
        }

        // 4. DB에 메타데이터 등록
        console.log(`   💾 DB 등록 중...`);

        const { error: dbError } = await supabase
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
                    source: 'local_upload',
                    uploadedAt: new Date().toISOString()
                }
            }, {
                onConflict: 'game_id'
            });

        if (dbError) {
            throw dbError;
        }

        console.log(`   ✅ DB 등록 완료`);
        return { success: true, gameId, metadata };

    } catch (error) {
        console.error(`   ❌ 실패: ${error.message}`);
        return { success: false, gameId, error: error.message };
    }
}

async function main() {
    console.log('🚀 로컬 게임 Storage 업로드 시작\n');
    console.log(`📂 게임 디렉토리: ${gamesDir}\n`);

    try {
        // 모든 게임 폴더 찾기
        const entries = await fs.readdir(gamesDir, { withFileTypes: true });
        const gameDirectories = entries
            .filter(entry => entry.isDirectory())
            .map(entry => entry.name);

        console.log(`🎮 발견된 게임: ${gameDirectories.length}개\n`);
        console.log(`게임 목록: ${gameDirectories.join(', ')}\n`);

        // 각 게임 업로드
        const results = [];
        for (const gameId of gameDirectories) {
            const result = await uploadGame(gameId);
            results.push(result);
        }

        // 결과 요약
        console.log('\n\n📊 === 업로드 결과 요약 ===');
        const successful = results.filter(r => r.success);
        const failed = results.filter(r => !r.success);

        console.log(`✅ 성공: ${successful.length}개`);
        successful.forEach(r => {
            console.log(`   - ${r.gameId}: ${r.metadata.title}`);
        });

        if (failed.length > 0) {
            console.log(`\n❌ 실패: ${failed.length}개`);
            failed.forEach(r => {
                console.log(`   - ${r.gameId}: ${r.error}`);
            });
        }

        console.log('\n✅ 업로드 완료!\n');
        console.log('이제 모든 게임이 Supabase Storage에 저장되었습니다.');
        console.log('버그 신고 및 기능 추가가 가능합니다! 🎉');

    } catch (error) {
        console.error('\n❌ 스크립트 실행 실패:', error.message);
        process.exit(1);
    }
}

main();
