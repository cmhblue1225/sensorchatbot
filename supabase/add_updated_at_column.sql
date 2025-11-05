-- game_creators 테이블에 updated_at 컬럼 추가 (없는 경우)
DO $$
BEGIN
    -- updated_at 컬럼이 없으면 추가
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'game_creators'
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE public.game_creators
        ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();

        -- 기존 행들의 updated_at을 created_at으로 초기화
        UPDATE public.game_creators
        SET updated_at = created_at
        WHERE updated_at IS NULL;
    END IF;
END $$;

-- last_game_created_at 컬럼 추가 (없는 경우)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'game_creators'
        AND column_name = 'last_game_created_at'
    ) THEN
        ALTER TABLE public.game_creators
        ADD COLUMN last_game_created_at TIMESTAMPTZ;
    END IF;
END $$;

-- last_login_at 컬럼 추가 (없는 경우)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'game_creators'
        AND column_name = 'last_login_at'
    ) THEN
        ALTER TABLE public.game_creators
        ADD COLUMN last_login_at TIMESTAMPTZ;
    END IF;
END $$;

-- 트리거가 없으면 생성
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger
        WHERE tgname = 'update_game_creators_updated_at'
    ) THEN
        CREATE TRIGGER update_game_creators_updated_at
            BEFORE UPDATE ON public.game_creators
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;
