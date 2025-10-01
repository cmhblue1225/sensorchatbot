-- 게임 버전 관리 테이블
CREATE TABLE IF NOT EXISTS game_versions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    game_id TEXT NOT NULL UNIQUE,
    current_version TEXT NOT NULL DEFAULT '1.0',
    title TEXT,
    description TEXT,
    game_type TEXT,
    modifications JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_game_versions_game_id ON game_versions(game_id);
CREATE INDEX IF NOT EXISTS idx_game_versions_updated_at ON game_versions(updated_at);

-- RLS 활성화
ALTER TABLE game_versions ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 읽을 수 있도록 (공개)
CREATE POLICY "Anyone can read game versions"
    ON game_versions
    FOR SELECT
    USING (true);

-- 서버에서만 쓸 수 있도록 (service_role)
CREATE POLICY "Service role can insert game versions"
    ON game_versions
    FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Service role can update game versions"
    ON game_versions
    FOR UPDATE
    USING (true);

-- updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_game_versions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER game_versions_updated_at
    BEFORE UPDATE ON game_versions
    FOR EACH ROW
    EXECUTE FUNCTION update_game_versions_updated_at();
