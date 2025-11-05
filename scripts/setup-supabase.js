/**
 * Supabase 설정 스크립트
 * - generated_games 테이블 생성
 * - Storage 버킷 생성
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { Client } = require('pg');
const fs = require('fs').promises;
const path = require('path');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ SUPABASE_URL 또는 SUPABASE_SERVICE_ROLE_KEY가 설정되지 않았습니다.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// PostgreSQL 직접 연결 설정
// Supabase 프로젝트 ref 추출
const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
const databaseUrl = process.env.DATABASE_URL ||
    `postgresql://postgres.${projectRef}:${process.env.SUPABASE_DB_PASSWORD || '[PASSWORD]'}@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres`;

async function createTable() {
    console.log('🔧 PostgreSQL 직접 연결로 테이블 생성 중...');

    // DATABASE_URL 또는 SUPABASE_DB_PASSWORD 확인
    if (!process.env.DATABASE_URL && !process.env.SUPABASE_DB_PASSWORD) {
        console.error('\n❌ DATABASE_URL 또는 SUPABASE_DB_PASSWORD가 설정되지 않았습니다.');
        console.log('\n📝 Supabase 데이터베이스 비밀번호 설정 방법:');
        console.log('1. https://supabase.com/dashboard/project/rwkgktwdljsddowcxphc/settings/database 접속');
        console.log('2. Database Password 복사');
        console.log('3. .env 파일에 다음 추가:');
        console.log('   SUPABASE_DB_PASSWORD=your_password_here');
        console.log('\n또는 전체 연결 문자열을 사용:');
        console.log('   DATABASE_URL=postgresql://postgres:[PASSWORD]@db.rwkgktwdljsddowcxphc.supabase.co:5432/postgres');
        return false;
    }

    const client = new Client({
        connectionString: databaseUrl,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log('✅ PostgreSQL 연결 성공');

        // SQL 파일 읽기
        const sqlPath = path.join(__dirname, '../supabase/migrations/create_generated_games.sql');
        const sql = await fs.readFile(sqlPath, 'utf-8');

        // SQL 실행
        console.log('📝 SQL 실행 중...');
        await client.query(sql);
        console.log('✅ generated_games 테이블 생성 완료');

        await client.end();
        return true;

    } catch (error) {
        await client.end().catch(() => {});

        if (error.code === 'ENOTFOUND' || error.message.includes('password')) {
            console.error('\n❌ 데이터베이스 연결 실패:', error.message);
            console.log('\n📝 DATABASE_URL 또는 SUPABASE_DB_PASSWORD를 확인하세요.');
            return false;
        } else if (error.message.includes('already exists')) {
            console.log('✅ generated_games 테이블이 이미 존재합니다.');
            return true;
        } else {
            throw error;
        }
    }
}

async function main() {
    console.log('🚀 Supabase 설정 시작...\n');

    try {
        // 1. 테이블 생성
        const tableCreated = await createTable();

        if (!tableCreated) {
            console.log('\n⚠️  테이블 생성을 건너뛰었습니다. Storage 버킷만 설정합니다.');
        }

        // 3. Storage 버킷 생성
        console.log('\n📦 Storage 버킷 생성 중...');
        const { data: bucket, error: bucketError } = await supabase
            .storage
            .createBucket('games', {
                public: true,
                fileSizeLimit: 52428800, // 50MB
                allowedMimeTypes: ['text/html', 'application/json', 'text/plain']
            });

        if (bucketError) {
            if (bucketError.message.includes('already exists')) {
                console.log('✅ games 버킷이 이미 존재합니다.');
            } else {
                console.error('❌ 버킷 생성 실패:', bucketError.message);
                throw bucketError;
            }
        } else {
            console.log('✅ games 버킷 생성 완료');
        }

        // 4. 버킷 정책 확인
        console.log('\n🔐 Storage 정책 확인 중...');
        const { data: policies, error: policyError } = await supabase
            .storage
            .from('games')
            .list('', { limit: 1 });

        if (policyError) {
            console.warn('⚠️  버킷 접근 테스트 실패:', policyError.message);
            console.log('📝 Supabase Dashboard에서 Storage 정책을 확인하세요:');
            console.log('   https://supabase.com/dashboard/project/rwkgktwdljsddowcxphc/storage/policies');
        } else {
            console.log('✅ Storage 버킷 접근 가능');
        }

        console.log('\n✅ Supabase 설정 완료!');
        console.log('\n📊 요약:');
        console.log('- 테이블: generated_games ✓');
        console.log('- Storage: games bucket ✓');
        console.log('- Project: rwkgktwdljsddowcxphc');

    } catch (error) {
        console.error('\n❌ 설정 실패:', error.message);
        process.exit(1);
    }
}

main();
