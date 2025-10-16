-- game_creators 테이블 생성
CREATE TABLE IF NOT EXISTS public.game_creators (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    nickname TEXT NOT NULL UNIQUE,
    games_created INTEGER DEFAULT 0,
    last_game_created_at TIMESTAMPTZ,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS (Row Level Security) 활성화
ALTER TABLE public.game_creators ENABLE ROW LEVEL SECURITY;

-- 정책: 모든 사용자가 자신의 데이터를 읽을 수 있음
CREATE POLICY "Users can view their own data"
    ON public.game_creators
    FOR SELECT
    USING (auth.uid() = id);

-- 정책: 서비스 역할은 모든 작업 가능 (Service Role Key 사용 시)
CREATE POLICY "Service role has full access"
    ON public.game_creators
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_game_creators_nickname ON public.game_creators(nickname);
CREATE INDEX IF NOT EXISTS idx_game_creators_created_at ON public.game_creators(created_at);

-- 업데이트 트리거 (updated_at 자동 갱신)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_game_creators_updated_at
    BEFORE UPDATE ON public.game_creators
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 로그인 시간 업데이트 함수 (옵션)
CREATE OR REPLACE FUNCTION update_creator_login(creator_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE public.game_creators
    SET last_login_at = NOW()
    WHERE id = creator_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
