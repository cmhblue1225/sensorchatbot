-- Sensor Game Hub v6.0 게임 제작자 테이블 (간단 버전)
-- 목적: 게임 이용자와 게임 제작자 구분
-- 특징: 회원가입 즉시 게임 제작 가능, 관리자 승인 불필요

-- =====================================================
-- 1. 게임 제작자 테이블 생성
-- =====================================================

CREATE TABLE IF NOT EXISTS public.game_creators (
    -- Primary Key: Supabase Auth의 user UUID와 연결
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,

    -- 기본 정보
    name VARCHAR(100) NOT NULL CHECK (LENGTH(name) >= 2),
    nickname VARCHAR(50) UNIQUE NOT NULL CHECK (LENGTH(nickname) >= 2),

    -- 제작 통계
    games_created INTEGER DEFAULT 0,
    last_game_created_at TIMESTAMP WITH TIME ZONE,

    -- 타임스탬프
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- 닉네임 형식 제약
    CONSTRAINT valid_creator_nickname CHECK (nickname ~ '^[a-zA-Z0-9가-힣_-]+$')
);

-- =====================================================
-- 2. 인덱스 생성
-- =====================================================

-- 닉네임 검색용 인덱스
CREATE INDEX IF NOT EXISTS idx_game_creators_nickname ON public.game_creators(nickname);

-- 게임 생성 순서 정렬용 인덱스
CREATE INDEX IF NOT EXISTS idx_game_creators_last_game ON public.game_creators(last_game_created_at DESC NULLS LAST);

-- =====================================================
-- 3. RLS (Row Level Security) 정책
-- =====================================================

-- RLS 활성화
ALTER TABLE public.game_creators ENABLE ROW LEVEL SECURITY;

-- 제작자는 자신의 정보만 읽을 수 있음
CREATE POLICY "Creators can read own info" ON public.game_creators
    FOR SELECT USING (auth.uid() = id);

-- 제작자는 자신의 정보만 수정할 수 있음
CREATE POLICY "Creators can update own info" ON public.game_creators
    FOR UPDATE USING (auth.uid() = id);

-- 새 제작자는 자신의 계정을 생성할 수 있음
CREATE POLICY "Creators can create own account" ON public.game_creators
    FOR INSERT WITH CHECK (auth.uid() = id);

-- =====================================================
-- 4. 신규 제작자 자동 등록 함수
-- =====================================================

-- 새 사용자가 회원가입할 때 자동으로 제작자 계정 생성
CREATE OR REPLACE FUNCTION public.handle_new_game_creator()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.game_creators (
        id,
        name,
        nickname,
        created_at,
        last_login_at
    ) VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
        COALESCE(NEW.raw_user_meta_data->>'nickname', SPLIT_PART(NEW.email, '@', 1)),
        NOW(),
        NOW()
    );
    RETURN NEW;
END;
$$ language 'plpgsql' security definer;

-- auth.users에 새 사용자 추가 시 제작자 계정 자동 생성
CREATE TRIGGER on_auth_user_created_game_creator
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_game_creator();

-- =====================================================
-- 5. 유틸리티 함수들
-- =====================================================

-- 사용자가 로그인된 제작자인지 확인
CREATE OR REPLACE FUNCTION public.is_authenticated_creator()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN auth.uid() IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.game_creators WHERE id = auth.uid()
    );
END;
$$ language 'plpgsql' security definer;

-- 게임 생성 후 통계 업데이트
CREATE OR REPLACE FUNCTION public.increment_games_created(creator_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE public.game_creators
    SET
        games_created = games_created + 1,
        last_game_created_at = NOW()
    WHERE id = creator_id;
END;
$$ language 'plpgsql' security definer;

-- 로그인 시간 업데이트
CREATE OR REPLACE FUNCTION public.update_creator_login(creator_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE public.game_creators
    SET last_login_at = NOW()
    WHERE id = creator_id;
END;
$$ language 'plpgsql' security definer;

-- =====================================================
-- 6. 제작자 정보 뷰
-- =====================================================

-- 제작자 기본 정보 뷰
CREATE OR REPLACE VIEW public.creator_info AS
SELECT
    c.id,
    c.name,
    c.nickname,
    a.email,
    c.games_created,
    c.last_game_created_at,
    c.created_at,
    c.last_login_at
FROM public.game_creators c
JOIN auth.users a ON c.id = a.id;

-- =====================================================
-- 7. 권한 설정
-- =====================================================

-- authenticated 사용자들이 접근할 수 있도록 권한 부여
GRANT SELECT, INSERT, UPDATE ON public.game_creators TO authenticated;
GRANT SELECT ON public.creator_info TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_authenticated_creator TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_games_created TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_creator_login TO authenticated;

-- service_role이 모든 작업을 할 수 있도록 (서버 사이드 작업용)
GRANT ALL ON public.game_creators TO service_role;
GRANT ALL ON public.creator_info TO service_role;

-- =====================================================
-- 8. 테이블 코멘트
-- =====================================================

COMMENT ON TABLE public.game_creators IS '게임 제작자 인증 테이블 - 로그인 기반 AI 게임 생성기 접근 제어';
COMMENT ON COLUMN public.game_creators.id IS 'Supabase Auth Users ID';
COMMENT ON COLUMN public.game_creators.name IS '제작자 이름';
COMMENT ON COLUMN public.game_creators.nickname IS '제작자 닉네임 (고유값)';
COMMENT ON COLUMN public.game_creators.games_created IS '생성한 게임 총 개수';

-- =====================================================
-- 설치 완료 메시지
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '✅ 게임 제작자 테이블 설정 완료!';
    RAISE NOTICE '';
    RAISE NOTICE '📋 구조:';
    RAISE NOTICE '   📊 테이블: game_creators (간단 버전)';
    RAISE NOTICE '   👁️ 뷰: creator_info';
    RAISE NOTICE '   🔒 RLS 정책: 3개';
    RAISE NOTICE '   ⚙️ 함수: 4개';
    RAISE NOTICE '   📈 인덱스: 2개';
    RAISE NOTICE '';
    RAISE NOTICE '🎯 동작 방식:';
    RAISE NOTICE '   ✅ 게임 이용: 로그인 불필요';
    RAISE NOTICE '   🔐 게임 제작: 로그인 필요';
    RAISE NOTICE '   🚀 회원가입 즉시 제작 가능';
    RAISE NOTICE '   ❌ 관리자 승인 불필요';
    RAISE NOTICE '';
    RAISE NOTICE '⚠️ Supabase 설정:';
    RAISE NOTICE '   📧 이메일 인증 비활성화 권장';
    RAISE NOTICE '   🔑 간단한 회원가입 프로세스';
END $$;