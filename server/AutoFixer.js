/**
 * 🔧 AutoFixer v1.0
 *
 * 자동 버그 수정 시스템
 * - 테스트 결과 분석
 * - Claude API로 버그 수정
 * - 최대 3회 재시도
 *
 * ✅ 자동으로 버그를 찾아서 수정
 */

const { ChatAnthropic } = require('@langchain/anthropic');

class AutoFixer {
    constructor(config) {
        this.config = config;
        this.llm = new ChatAnthropic({
            anthropicApiKey: config.claudeApiKey,
            model: config.claudeModel,
            maxTokens: 4096,
            temperature: 0.1  // 수정은 정확성 최우선
        });
        this.maxAttempts = 3;
    }

    /**
     * 버그 자동 수정
     */
    async fixBugs(gameHtml, testResults) {
        console.log('🔧 자동 버그 수정 시작...');

        if (testResults.passed) {
            console.log('✅ 버그 없음 - 수정 불필요');
            return {
                success: true,
                fixedHtml: gameHtml,
                attempts: 0,
                fixes: []
            };
        }

        let currentHtml = gameHtml;
        const fixes = [];

        // 실패한 테스트만 추출
        const failedTests = Object.values(testResults.tests).filter(test => !test.success);

        for (let attempt = 1; attempt <= this.maxAttempts; attempt++) {
            console.log(`🔄 수정 시도 ${attempt}/${this.maxAttempts}...`);

            try {
                // 버그 분석 및 수정 코드 생성
                const fixResult = await this.generateFix(currentHtml, failedTests, attempt);

                if (fixResult.success) {
                    currentHtml = fixResult.fixedHtml;
                    fixes.push({
                        attempt,
                        issues: failedTests.map(t => t.name),
                        applied: true
                    });

                    console.log(`✅ 시도 ${attempt} 성공`);

                    // 수정 후 재테스트 (간단한 검증)
                    const stillHasBugs = this.quickValidate(currentHtml, failedTests);
                    if (!stillHasBugs) {
                        console.log('✅ 모든 버그 수정 완료');
                        return {
                            success: true,
                            fixedHtml: currentHtml,
                            attempts: attempt,
                            fixes
                        };
                    }
                }
            } catch (error) {
                console.error(`❌ 시도 ${attempt} 실패:`, error.message);
                fixes.push({
                    attempt,
                    issues: failedTests.map(t => t.name),
                    applied: false,
                    error: error.message
                });
            }
        }

        // 최대 시도 횟수 초과
        console.log('⚠️ 최대 시도 횟수 초과 - 부분 수정됨');
        return {
            success: false,
            fixedHtml: currentHtml,
            attempts: this.maxAttempts,
            fixes,
            message: '일부 버그가 남아있을 수 있습니다'
        };
    }

    /**
     * 수정 코드 생성
     */
    async generateFix(html, failedTests, attempt) {
        const issuesDescription = this.describeIssues(failedTests);

        const prompt = `당신은 버그를 수정하는 전문가입니다.

**현재 문제:**
${issuesDescription}

**수정 규칙:**
1. 문제가 있는 부분만 수정
2. 기존 로직 최대한 보존
3. 검증된 패턴 사용

**특히 주의할 버그 패턴:**

1. **공이 패들에 붙어있는 버그:**
\`\`\`javascript
// ❌ 잘못된 코드
} else {
    ball.x = paddle.x + paddle.width/2;
    ball.y = paddle.y - ball.radius;
}

// ✅ 올바른 코드
if (!gameStarted) {
    ball.x = paddle.x + paddle.width/2;
    ball.y = paddle.y - ball.radius;
    ball.dx = 0;
    ball.dy = 0;
} else {
    ball.x += ball.dx;
    ball.y += ball.dy;
}
\`\`\`

2. **타이머가 작동하지 않는 버그:**
\`\`\`javascript
// ❌ 잘못된 코드
setInterval(() => {
    timeLeft--;  // 조건 없이 감소
}, 1000);

// ✅ 올바른 코드
setInterval(() => {
    if (gameStarted && !gameOver) {
        timeLeft--;
        if (timeLeft <= 0) {
            gameOver = true;
            alert('Time Over!');
        }
        updateUI();
    }
}, 1000);
\`\`\`

3. **session.code 버그:**
\`\`\`javascript
// ❌ 잘못된 코드
document.getElementById('session-code').textContent = session.code;

// ✅ 올바른 코드
document.getElementById('session-code').textContent = session.sessionCode;
\`\`\`

**현재 HTML 코드:**
\`\`\`html
${html}
\`\`\`

**요청:**
위 버그들을 수정한 완전한 HTML 코드를 생성하세요.
반드시 \`\`\`html 코드 블록으로 감싸주세요.`;

        try {
            const response = await this.llm.invoke(prompt);
            const fixedHtml = this.extractHTML(response.content);

            return {
                success: true,
                fixedHtml
            };
        } catch (error) {
            throw new Error(`수정 코드 생성 실패: ${error.message}`);
        }
    }

    /**
     * 문제 설명 생성
     */
    describeIssues(failedTests) {
        let description = '';

        failedTests.forEach((test, index) => {
            description += `\n${index + 1}. ${test.name} 실패 (${test.passed}/${test.total})\n`;

            if (test.issues && test.issues.length > 0) {
                test.issues.forEach(issue => {
                    description += `   - ${issue}\n`;
                });
            }
        });

        return description;
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

        throw new Error('수정된 HTML 코드를 찾을 수 없습니다');
    }

    /**
     * 간단한 검증
     */
    quickValidate(html, failedTests) {
        let stillHasBugs = false;

        failedTests.forEach(test => {
            // SessionSDK 버그 체크
            if (test.name === 'SessionSDK 통합') {
                if (html.includes('session.code') && !html.includes('session.sessionCode')) {
                    stillHasBugs = true;
                }
            }

            // 타이머 버그 체크
            if (test.name === '타이머 시스템') {
                if (!html.includes('timeLeft--') && !html.includes('time--')) {
                    stillHasBugs = true;
                }
            }

            // 공 붙어있는 버그 체크
            if (test.name === '버그 패턴 감지') {
                const ballMovementPattern = /ball\.x\s*=\s*paddle\.x/;
                const hasProtection = html.includes('!gameStarted');

                if (ballMovementPattern.test(html) && !hasProtection) {
                    stillHasBugs = true;
                }
            }
        });

        return stillHasBugs;
    }

    /**
     * 특정 버그 패턴 수정
     */
    fixSpecificPattern(html, patternName) {
        let fixedHtml = html;

        switch (patternName) {
            case 'session.code':
                fixedHtml = html.replace(/session\.code\b/g, 'session.sessionCode');
                console.log('✅ session.code → session.sessionCode 수정');
                break;

            case 'ballSticking':
                // 공이 붙어있는 버그는 복잡하므로 Claude API 사용
                break;

            case 'timer':
                // 타이머 버그도 복잡하므로 Claude API 사용
                break;
        }

        return fixedHtml;
    }
}

module.exports = AutoFixer;
