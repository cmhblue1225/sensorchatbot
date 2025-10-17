/**
 * Supabase Storage 버킷 설정 업데이트
 * - allowedMimeTypes 제한 제거하여 모든 파일 타입 허용
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function updateBucket() {
    console.log('🔧 Storage 버킷 설정 업데이트 중...\n');

    try {
        // 버킷 설정 업데이트
        const { data, error } = await supabase
            .storage
            .updateBucket('games', {
                public: true,
                fileSizeLimit: 52428800, // 50MB
                allowedMimeTypes: null  // 모든 파일 타입 허용
            });

        if (error) {
            throw error;
        }

        console.log('✅ 버킷 설정 업데이트 완료!');
        console.log('   - public: true');
        console.log('   - fileSizeLimit: 50MB');
        console.log('   - allowedMimeTypes: 모든 타입 허용\n');

        return true;

    } catch (error) {
        console.error('❌ 버킷 업데이트 실패:', error.message);
        return false;
    }
}

updateBucket();
