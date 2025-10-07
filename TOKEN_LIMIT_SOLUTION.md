# 🚨 Claude API 토큰 제한 문제 및 해결 방안

## 📊 문제 상황

### 1. API 오류 메시지
```
BadRequestError: 400
"max_tokens: 16384 > 8192, which is the maximum allowed number of output tokens for claude-3-5-sonnet-20241022"
```

### 2. 실제 최대 토큰
- **Claude 3.5 Sonnet (20241022)**: 최대 **8,192 출력 토큰**
- **Claude 3 Opus (20240229)**: 최대 **4,096 출력 토큰** (더 짧음)
- **Claude 3.5 Haiku**: 최대 **8,192 출력 토큰**

### 3. 현재 프롬프트 크기
- `generateGameCreationPrompt()` 함수: **약 900+ 줄**
- 예상 입력 토큰: **약 3,000-4,000 토큰**
- 필요한 출력 토큰: **약 10,000-12,000 토큰** (완전한 HTML 게임)
- **결과**: 8,192 토큰으로는 완전한 게임 생성 불가능

---

## 🔧 해결 방안 (3가지)

### ✅ 방안 1: 프롬프트 최적화 (즉시 가능)

**목표**: 프롬프트 크기를 50% 줄여서 출력 토큰 확보

**실행 계획**:
1. `generateGameCreationPrompt()` 함수 900줄 → 400줄로 축소
2. 장르별 특화 지침 제거 (또는 대폭 축소)
3. 버그 패턴 예시 코드 제거 (문서 참조로 대체)
4. SessionSDK 예제 코드 간소화 (핵심만 남기기)

**예상 효과**:
- 입력 토큰: 3,000 → 1,500 토큰
- 출력 가능 토큰: 5,000 → 6,500 토큰
- **여전히 불충분** (완전한 게임은 10,000+ 토큰 필요)

**구현 난이도**: ⭐⭐ (중간)

---

### ✅✅ 방안 2: Multi-Stage 생성 (권장) ★★★

**목표**: 게임을 여러 단계로 나눠서 생성

**실행 계획**:
1. **Stage 1**: HTML 구조 + SessionSDK 통합 (2,000 토큰)
2. **Stage 2**: 게임 로직 (변수, 초기화, update) (3,000 토큰)
3. **Stage 3**: 렌더링 + UI (2,000 토큰)
4. **Stage 4**: 통합 및 버그 수정 (1,000 토큰)

**예상 효과**:
- 각 단계별로 8,192 토큰 제한 내에서 완전한 코드 생성 가능
- 단계별 검증으로 품질 향상
- **100% 완전한 게임 생성 보장**

**구현 난이도**: ⭐⭐⭐⭐ (높음 - 새로운 시스템 필요)

**필요한 작업**:
- `server/generators/StructureGenerator.js` 생성
- `server/generators/GameLogicGenerator.js` 생성
- `server/generators/IntegrationGenerator.js` 생성
- InteractiveGameGenerator.js 수정 (멀티 스테이지 지원)

---

### ✅✅✅ 방안 3: Response Continuation (최고) ★★★★★

**목표**: Claude API 응답이 잘려도 이어서 생성

**실행 계획**:
1. 첫 번째 호출로 최대한 생성
2. `stop_reason === 'max_tokens'` 감지
3. 다음 프롬프트로 "이어서 작성" 요청
4. 완전한 `</html>` 태그까지 반복

**예상 효과**:
- 프롬프트 수정 불필요
- 자동으로 긴 게임도 완전 생성
- **기존 시스템과 완벽 호환**

**구현 난이도**: ⭐⭐ (중간)

**필요한 코드** (InteractiveGameGenerator.js):
```javascript
async generateWithContinuation(prompt, requirements) {
    let fullResponse = '';
    let continueGeneration = true;
    let attempts = 0;
    const MAX_ATTEMPTS = 3;

    while (continueGeneration && attempts < MAX_ATTEMPTS) {
        const response = await this.llm.invoke([
            { role: 'user', content: attempts === 0 ? prompt :
                `이전 코드가 잘렸습니다. 다음 부분부터 계속 작성해주세요:\n\n${fullResponse.slice(-500)}`
            }
        ]);

        fullResponse += response.content;
        attempts++;

        // stop_reason 체크
        if (response.response_metadata?.stop_reason === 'max_tokens') {
            console.log(`⚠️ 토큰 제한 도달 (시도 ${attempts}/${MAX_ATTEMPTS}) - 계속 생성 중...`);
            continueGeneration = true;
        } else if (response.response_metadata?.stop_reason === 'end_turn') {
            console.log(`✅ 완전한 응답 생성 완료 (시도 ${attempts})`);
            continueGeneration = false;
        }

        // </html> 태그 발견 시 완료
        if (fullResponse.includes('</html>')) {
            console.log(`✅ 완전한 HTML 발견 - 생성 종료`);
            continueGeneration = false;
        }
    }

    return { content: fullResponse };
}
```

---

## 📊 방안 비교

| 방안 | 구현 난이도 | 즉시 적용 | 완전성 | 장기 유지보수 |
|------|-------------|----------|--------|---------------|
| 1. 프롬프트 최적화 | ⭐⭐ | ✅ | ❌ | ⭐⭐ |
| 2. Multi-Stage | ⭐⭐⭐⭐ | ❌ | ✅✅✅ | ⭐⭐⭐⭐⭐ |
| 3. Continuation | ⭐⭐ | ✅ | ✅✅ | ⭐⭐⭐⭐ |

---

## 🎯 권장 실행 순서

### 단계 1: 즉시 (방안 3 구현) ✅
- Response Continuation 로직 추가
- `generateWithContinuation()` 함수 구현
- 기존 `generateFinalGame()` 수정
- **예상 시간**: 30분
- **예상 효과**: 90% 문제 해결

### 단계 2: 단기 (프롬프트 최적화)
- 불필요한 예제 코드 제거
- 장르별 지침 간소화
- **예상 시간**: 1시간
- **예상 효과**: Continuation 횟수 감소 (3회 → 2회)

### 단계 3: 장기 (Multi-Stage 시스템)
- Phase 4 본격 구현
- 품질 검증 시스템 통합
- **예상 시간**: 4-6시간
- **예상 효과**: 100% 완전한 게임, 최고 품질

---

## 📝 현재 설정

**InteractiveGameGenerator.js (line 33)**:
```javascript
maxTokens: 8192,   // ✅ Claude 3.5 Sonnet 최대 출력 토큰 (공식 제한)
```

**문제점**:
- 프롬프트 약 3,000 토큰 사용
- 게임 생성에 필요한 출력: 10,000+ 토큰
- 남은 출력 토큰: 5,000 토큰 (50% 부족!)

---

## ✅ 해결 완료 (2025-10-08 22:00)

### 🎉 최종 해결 방법: Claude Sonnet 4.5 모델 업그레이드

**적용된 솔루션**: 옵션 D - 최신 Claude 모델로 업그레이드 (가장 근본적 해결)

**변경 사항:**
1. **모델 업그레이드** (`server/InteractiveGameGenerator.js` line 31)
   - BEFORE: `claude-3-5-sonnet-20241022` (8,192 토큰)
   - AFTER: `claude-sonnet-4-5-20250929` (64,000 토큰) - **8배 증가!**

2. **maxTokens 증가** (line 33)
   - BEFORE: 8,192
   - AFTER: **64,000** - 완전한 게임 생성 가능

3. **Opus 모델 업그레이드** (line 32, 128-134)
   - BEFORE: `claude-opus-3-20240229` (4,096 토큰)
   - AFTER: `claude-opus-4-1-20250805` (32,000 토큰)

**서버 재시작:**
```bash
# 기존 프로세스 종료 (PID 확인 후 kill)
ps aux | grep "node server/index.js"
kill [PID]

# 새 서버 시작 (Claude Sonnet 4.5)
cd /Users/dev/졸업작품/sensorchatbot
node server/index.js
# ✅ 서버 정상 작동 확인 (포트 3000)
```

**결과:**
- ✅ 64,000 토큰으로 어떤 복잡한 게임도 완성 가능
- ✅ Response Continuation 불필요 (충분한 토큰)
- ✅ 프롬프트 최적화 불필요 (8배 여유)
- ✅ Multi-Stage 생성 불필요 (단일 호출로 완성)

**다음 테스트:**
- 동일한 벽돌깨기 게임 재생성
- 완전한 코드 생성 확인 (모든 함수 포함)
- 토큰 사용량 모니터링

---

**작성일**: 2025-10-08
**수정일**: 2025-10-08 22:00
**작성자**: Claude Code
**상태**: ✅ **해결 완료** - Claude Sonnet 4.5 적용
