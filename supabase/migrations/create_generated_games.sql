-- Generated Games 테이블 생성
-- 이 테이블은 AI로 생성된 게임들의 메타데이터를 저장합니다.

CREATE TABLE IF NOT EXISTS generated_games (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    game_id TEXT UNIQUE NOT NULL,  -- 게임 폴더명 (예: "maze-game-abc123")
    title TEXT NOT NULL,
    description TEXT,
    game_type TEXT NOT NULL,  -- solo, dual, multi
    genre TEXT,
    storage_path TEXT NOT NULL,  -- Supabase Storage 경로 (예: "games/maze-game-abc123/index.html")
    thumbnail_url TEXT,  -- 게임 썸네일 URL (선택)
    play_count INTEGER DEFAULT 0,  -- 플레이 횟수
    metadata JSONB,  -- 추가 메타데이터 (requirements, validation 등)
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_generated_games_game_id ON generated_games(game_id);
CREATE INDEX IF NOT EXISTS idx_generated_games_game_type ON generated_games(game_type);
CREATE INDEX IF NOT EXISTS idx_generated_games_created_at ON generated_games(created_at DESC);

-- updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_generated_games_updated_at
    BEFORE UPDATE ON generated_games
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security) 활성화
ALTER TABLE generated_games ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 읽을 수 있도록 설정
CREATE POLICY "Anyone can read generated games"
    ON generated_games
    FOR SELECT
    USING (true);

-- 인증된 사용자만 게임을 생성할 수 있도록 설정 (향후 사용자 인증 시)
CREATE POLICY "Authenticated users can insert games"
    ON generated_games
    FOR INSERT
    WITH CHECK (true);  -- 현재는 모두 허용, 향후 auth.uid() 체크 가능

-- 게임 생성자만 수정/삭제 가능 (향후 사용자 인증 시)
CREATE POLICY "Anyone can update games"
    ON generated_games
    FOR UPDATE
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Anyone can delete games"
    ON generated_games
    FOR DELETE
    USING (true);

-- 코멘트 추가
COMMENT ON TABLE generated_games IS 'AI로 생성된 센서 게임들의 메타데이터를 저장하는 테이블';
COMMENT ON COLUMN generated_games.game_id IS '게임 고유 ID (폴더명)';
COMMENT ON COLUMN generated_games.storage_path IS 'Supabase Storage에 저장된 게임 파일 경로';
COMMENT ON COLUMN generated_games.play_count IS '게임 플레이 횟수 (통계용)';
