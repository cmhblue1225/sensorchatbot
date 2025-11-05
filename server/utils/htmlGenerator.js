// 새로운 표준화 시스템 임포트
const GameTemplateStandard = require('../templates/GameTemplateStandard');

class HtmlGenerator {
    constructor() {
        // 표준화 시스템 초기화
        this.templateStandard = new GameTemplateStandard();
        this.templateStandard.initializeAllTemplates();

        this.baseStyles = `
            <style>
                :root {
                    --primary: #3b82f6;
                    --primary-dark: #1d4ed8;
                    --secondary: #8b5cf6;
                    --success: #10b981;
                    --warning: #f59e0b;
                    --error: #ef4444;
                    --background: #f8fafc;
                    --surface: #ffffff;
                    --text-primary: #1e293b;
                    --text-secondary: #475569;
                    --text-muted: #64748b;
                    --border: #e2e8f0;
                    --radius: 0.5rem;
                    --shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
                    --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
                }

                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }

                body {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    background: var(--background);
                    color: var(--text-primary);
                    line-height: 1.6;
                }

                .container {
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: 2rem;
                }

                .title {
                    font-size: 2.5rem;
                    font-weight: 700;
                    text-align: center;
                    margin-bottom: 1rem;
                    background: linear-gradient(135deg, var(--primary), var(--secondary));
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                }

                .subtitle {
                    font-size: 1.125rem;
                    color: var(--text-secondary);
                    text-align: center;
                    margin-bottom: 3rem;
                }

                .card {
                    background: var(--surface);
                    border-radius: var(--radius);
                    box-shadow: var(--shadow);
                    border: 1px solid var(--border);
                    padding: 1.5rem;
                    margin-bottom: 1.5rem;
                }

                .btn {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.75rem 1.5rem;
                    border-radius: var(--radius);
                    font-weight: 500;
                    text-decoration: none;
                    border: none;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .btn:hover {
                    transform: translateY(-1px);
                    box-shadow: var(--shadow-lg);
                }

                .btn-primary {
                    background: linear-gradient(135deg, var(--primary), var(--primary-dark));
                    color: white;
                }

                .btn-secondary {
                    background: var(--surface);
                    color: var(--text-primary);
                    border: 1px solid var(--border);
                }

                .btn:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                    transform: none;
                }

                .features-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                    gap: 2rem;
                    margin-bottom: 3rem;
                }

                .feature-card {
                    background: var(--surface);
                    border-radius: var(--radius);
                    box-shadow: var(--shadow);
                    border: 1px solid var(--border);
                    padding: 2rem;
                    text-align: center;
                    cursor: pointer;
                    transition: all 0.3s;
                }

                .feature-card:hover {
                    transform: translateY(-4px);
                    box-shadow: var(--shadow-lg);
                    border-color: var(--primary);
                }

                .feature-card h3 {
                    font-size: 1.5rem;
                    margin-bottom: 1rem;
                    color: var(--text-primary);
                }

                .feature-card p {
                    color: var(--text-secondary);
                    margin-bottom: 1.5rem;
                }

                .feature-card ul {
                    list-style: none;
                    margin-bottom: 1.5rem;
                }

                .feature-card li {
                    color: var(--text-muted);
                    margin-bottom: 0.5rem;
                    font-size: 0.875rem;
                }

                .click-hint {
                    background: var(--primary);
                    color: white;
                    padding: 0.5rem 1rem;
                    border-radius: var(--radius);
                    font-size: 0.875rem;
                    font-weight: 500;
                }

                .template-viewer {
                    background: var(--surface);
                    border-radius: var(--radius);
                    box-shadow: var(--shadow);
                    border: 1px solid var(--border);
                    overflow: hidden;
                }

                .template-header {
                    background: linear-gradient(135deg, var(--primary), var(--secondary));
                    color: white;
                    padding: 1.5rem;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .template-actions {
                    display: flex;
                    gap: 1rem;
                }

                .code-container {
                    background: #1e293b;
                    color: #e2e8f0;
                    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
                    font-size: 0.875rem;
                    line-height: 1.5;
                    overflow-x: auto;
                    max-height: 600px;
                    overflow-y: auto;
                }

                .code-container pre {
                    padding: 1.5rem;
                    margin: 0;
                    white-space: pre-wrap;
                    word-wrap: break-word;
                }

                .status-online {
                    color: var(--success);
                    font-weight: 600;
                }

                .status-offline {
                    color: var(--error);
                    font-weight: 600;
                }

                /* 게임 허브 스타일 */
                .stats-bar {
                    display: flex;
                    gap: 2rem;
                    justify-content: center;
                    margin-bottom: 3rem;
                    flex-wrap: wrap;
                }

                .stat-item {
                    text-align: center;
                    background: var(--surface);
                    padding: 1.5rem;
                    border-radius: var(--radius);
                    box-shadow: var(--shadow);
                    border: 1px solid var(--border);
                    min-width: 120px;
                }

                .stat-number {
                    font-size: 2rem;
                    font-weight: 700;
                    color: var(--primary);
                    margin-bottom: 0.5rem;
                }

                .stat-label {
                    color: var(--text-secondary);
                    font-size: 0.875rem;
                    font-weight: 500;
                }

                .games-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
                    gap: 1.5rem;
                    margin-bottom: 2rem;
                }

                .game-card {
                    background: var(--surface);
                    border-radius: var(--radius);
                    box-shadow: var(--shadow);
                    border: 1px solid var(--border);
                    padding: 1.5rem;
                    transition: all 0.3s ease;
                    cursor: pointer;
                }

                .game-card:hover {
                    transform: translateY(-4px);
                    box-shadow: var(--shadow-lg);
                    border-color: var(--primary);
                }

                .game-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 1rem;
                }

                .game-title {
                    font-size: 1.25rem;
                    font-weight: 600;
                    color: var(--text-primary);
                    margin: 0;
                    flex: 1;
                }

                .game-type {
                    padding: 0.25rem 0.75rem;
                    border-radius: 20px;
                    font-size: 0.75rem;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }

                .game-type.solo {
                    background: #dbeafe;
                    color: #1d4ed8;
                }

                .game-type.dual {
                    background: #fef3c7;
                    color: #d97706;
                }

                .game-type.multi {
                    background: #dcfce7;
                    color: #16a34a;
                }

                .game-description {
                    color: var(--text-secondary);
                    line-height: 1.5;
                    margin-bottom: 1.5rem;
                    font-size: 0.9rem;
                }

                .game-actions {
                    display: flex;
                    gap: 0.75rem;
                }

                .empty-state {
                    text-align: center;
                    padding: 4rem 2rem;
                    color: var(--text-secondary);
                }

                .empty-icon {
                    font-size: 4rem;
                    margin-bottom: 1rem;
                }

                .empty-state h3 {
                    margin-bottom: 0.5rem;
                    color: var(--text-primary);
                }

                @media (max-width: 768px) {
                    .container {
                        padding: 1rem;
                    }

                    .title {
                        font-size: 2rem;
                    }

                    .features-grid {
                        grid-template-columns: 1fr;
                        gap: 1rem;
                    }

                    .games-grid {
                        grid-template-columns: 1fr;
                    }

                    .stats-bar {
                        gap: 1rem;
                    }

                    .stat-item {
                        min-width: 100px;
                        padding: 1rem;
                    }

                    .game-header {
                        flex-direction: column;
                        gap: 0.5rem;
                        align-items: flex-start;
                    }

                    .game-actions {
                        flex-direction: column;
                    }

                    .template-header {
                        flex-direction: column;
                        gap: 1rem;
                        text-align: center;
                    }
                }
            </style>
        `;
    }

    getBaseTemplate(title, content, scripts = '') {
        return `
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} - Sensor Game Hub v6.0</title>
    ${this.baseStyles}
</head>
<body>
    ${content}
    <script>${scripts}</script>
</body>
</html>
        `;
    }

    /**
     * AI 어시스턴트 페이지 생성
     */
    generateAIAssistantPage() {
        const content = `
        <div class="container">
            <h1 class="title">🤖 AI 어시스턴트</h1>
            <p class="subtitle">센서 게임 개발을 위한 AI 기반 어시스턴트</p>

            <div class="card">
                <div class="status-section">
                    <h3>시스템 상태</h3>
                    <p class="status-online">🟢 AI 시스템 온라인</p>
                    <p class="status-online">🟢 Claude API 연결됨</p>
                    <p class="status-online">🟢 OpenAI API 연결됨</p>
                </div>

                <div style="margin-top: 2rem;">
                    <h3>사용 가능한 기능</h3>
                    <ul style="margin-left: 2rem; margin-top: 1rem;">
                        <li>게임 개념 설계 및 기획 지원</li>
                        <li>센서 데이터 활용 방법 제안</li>
                        <li>코드 리뷰 및 최적화 제안</li>
                        <li>디버깅 및 문제 해결 지원</li>
                    </ul>
                </div>
            </div>
        </div>
        `;

        const scripts = `
        console.log('AI Assistant page loaded');
        `;

        return this.getBaseTemplate('AI 어시스턴트', content, scripts);
    }

    /**
     * 인터랙티브 게임 생성기 페이지 생성
     */
    generateInteractiveGameGeneratorPage() {
        const content = `
        <div class="container">
            <h1 class="title">🎮 게임 생성기</h1>
            <p class="subtitle">AI 기반 인터랙티브 게임 생성 도구</p>

            <div class="card">
                <div class="status-section">
                    <h3>생성기 상태</h3>
                    <p class="status-online">🟢 AI 생성기 온라인</p>
                    <p class="status-online">🟢 템플릿 엔진 준비됨</p>
                </div>

                <div style="margin-top: 2rem;">
                    <h3>생성 가능한 게임 타입</h3>
                    <div class="features-grid">
                        <div class="feature-card">
                            <h3>🎯 솔로 게임</h3>
                            <p>개인 플레이어용 센서 기반 게임</p>
                        </div>
                        <div class="feature-card">
                            <h3>👥 듀얼 게임</h3>
                            <p>2명이 협력하는 게임</p>
                        </div>
                        <div class="feature-card">
                            <h3>🏆 멀티 게임</h3>
                            <p>최대 10명 동시 플레이 게임</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        `;

        const scripts = `
        console.log('Game Generator page loaded');
        `;

        return this.getBaseTemplate('게임 생성기', content, scripts);
    }

    /**
     * 게임 템플릿 페이지 생성
     */
    generateGameTemplate() {
        // 새로운 표준화 시스템에서 템플릿 가져오기
        const standardTemplates = this.templateStandard.getAllTemplates();
        const templateData = {};

        // 표준화된 템플릿을 기존 형식으로 변환
        Object.keys(standardTemplates).forEach(key => {
            templateData[key] = standardTemplates[key].code;
        });

        const content = `
        <div class="container">
            <h1 class="title">🎮 게임 템플릿</h1>
            <p class="subtitle">Sensor Game Hub v6.0을 위한 완전한 게임 템플릿</p>

            <div class="features-grid">
                <div class="feature-card" data-template="solo">
                    <h3>🎯 Solo Game</h3>
                    <p>한 명의 플레이어가 센서로 조작</p>
                    <ul>
                        <li>중력/가속도 물리 엔진</li>
                        <li>실시간 센서 기반 조작</li>
                        <li>고급 Canvas 렌더링</li>
                        <li>프로덕션 레벨 최적화</li>
                    </ul>
                    <span class="click-hint">클릭하여 템플릿 보기</span>
                </div>

                <div class="feature-card" data-template="dual">
                    <h3>👥 Dual Game</h3>
                    <p>두 명의 플레이어가 협력</p>
                    <ul>
                        <li>멀티플레이어 동기화</li>
                        <li>협력 미션 시스템</li>
                        <li>실시간 상태 공유</li>
                        <li>고급 물리 시뮬레이션</li>
                    </ul>
                    <span class="click-hint">클릭하여 템플릿 보기</span>
                </div>

                <div class="feature-card" data-template="multi">
                    <h3>🏆 Multi Game</h3>
                    <p>최대 10명까지 경쟁</p>
                    <ul>
                        <li>실시간 순위 시스템</li>
                        <li>스케일링 아키텍처</li>
                        <li>고성능 렌더링</li>
                        <li>커스텀 파티클 시스템</li>
                    </ul>
                    <span class="click-hint">클릭하여 템플릿 보기</span>
                </div>
            </div>

            <div class="template-viewer" id="templateViewer" style="display: none;">
                <div class="template-header">
                    <h3>📝 선택된 템플릿 코드</h3>
                    <div class="template-actions">
                        <button class="btn btn-secondary" id="copyCodeBtn" disabled>📋 코드 복사</button>
                        <button class="btn btn-primary" id="downloadBtn" disabled>💾 HTML 다운로드</button>
                    </div>
                </div>
                <div id="templateCode" class="code-container"></div>
            </div>
        </div>
        `;

        const scripts = `
        let selectedTemplate = null;
        let templateCode = null;

        // 템플릿 데이터를 JSON으로 안전하게 저장
        const templateData = ${JSON.stringify(templateData)};

        function selectTemplate(type) {
            selectedTemplate = type;
            templateCode = templateData[type];

            // 코드를 HTML 엔티티로 변환하여 안전하게 표시
            const escapedCode = templateCode
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#x27;');

            document.getElementById('templateCode').innerHTML = '<pre>' + escapedCode + '</pre>';
            document.getElementById('templateViewer').style.display = 'block';
            document.getElementById('copyCodeBtn').disabled = false;
            document.getElementById('downloadBtn').disabled = false;
        }

        function copyTemplate() {
            if (!templateCode) return;

            navigator.clipboard.writeText(templateCode).then(() => {
                const btn = document.getElementById('copyCodeBtn');
                const originalText = btn.textContent;
                btn.textContent = '✅ 복사 완료!';
                btn.style.background = 'var(--success)';
                setTimeout(() => {
                    btn.textContent = originalText;
                    btn.style.background = '';
                }, 2000);
            }).catch(() => {
                alert('복사에 실패했습니다. 수동으로 복사해주세요.');
            });
        }

        function downloadTemplate() {
            if (!templateCode) return;

            const blob = new Blob([templateCode], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = selectedTemplate + '-advanced-game-v6.0.html';
            a.click();
            URL.revokeObjectURL(url);

            // 다운로드 완료 피드백
            const btn = document.getElementById('downloadBtn');
            const originalText = btn.textContent;
            btn.textContent = '✅ 다운로드 완료!';
            btn.style.background = 'var(--success)';
            setTimeout(() => {
                btn.textContent = originalText;
                btn.style.background = '';
            }, 2000);
        }

        // DOM 로드 완료 후 이벤트 리스너 추가
        document.addEventListener('DOMContentLoaded', function() {
            // 템플릿 카드 클릭 이벤트
            document.querySelectorAll('[data-template]').forEach(function(card) {
                card.addEventListener('click', function() {
                    const templateType = this.getAttribute('data-template');
                    selectTemplate(templateType);
                });
            });

            // 복사 버튼 클릭 이벤트
            document.getElementById('copyCodeBtn').addEventListener('click', copyTemplate);

            // 다운로드 버튼 클릭 이벤트
            document.getElementById('downloadBtn').addEventListener('click', downloadTemplate);
        });
        `;

        return this.getBaseTemplate('게임 템플릿', content, scripts);
    }

    /**
     * 프레임워크 문서 페이지 생성
     */
    generateFrameworkDocs() {
        const content = `
        <div class="container">
            <h1 class="title">📚 개발 가이드</h1>
            <p class="subtitle">Sensor Game Hub v6.0 개발 문서</p>

            <div class="card">
                <h3>개발 문서</h3>
                <p>게임 개발에 필요한 모든 문서와 가이드를 제공합니다.</p>

                <div style="margin-top: 2rem;">
                    <h4>주요 문서</h4>
                    <ul style="margin-left: 2rem; margin-top: 1rem;">
                        <li>API 참조 문서</li>
                        <li>게임 개발 튜토리얼</li>
                        <li>센서 데이터 활용 가이드</li>
                        <li>배포 및 운영 가이드</li>
                    </ul>
                </div>
            </div>
        </div>
        `;

        const scripts = `
        console.log('Framework docs loaded');
        `;

        return this.getBaseTemplate('프레임워크 문서', content, scripts);
    }

    /**
     * 게임 허브 페이지 생성
     */
    generateGameHub(games = []) {
        const content = `
        <div class="container">
            <h1 class="title">🎮 게임 허브</h1>
            <p class="subtitle">Sensor Game Hub v6.0에서 제공하는 모든 게임을 플레이해보세요</p>

            <div class="stats-bar">
                <div class="stat-item">
                    <div class="stat-number">${games.length}</div>
                    <div class="stat-label">등록된 게임</div>
                </div>
                <div class="stat-item">
                    <div class="stat-number">${games.filter(g => g.type === 'solo').length}</div>
                    <div class="stat-label">Solo 게임</div>
                </div>
                <div class="stat-item">
                    <div class="stat-number">${games.filter(g => g.type === 'dual').length}</div>
                    <div class="stat-label">Dual 게임</div>
                </div>
                <div class="stat-item">
                    <div class="stat-number">${games.filter(g => g.type === 'multi').length}</div>
                    <div class="stat-label">Multi 게임</div>
                </div>
            </div>

            <div class="games-grid">
                ${games.map(game => `
                    <div class="game-card" data-type="${game.type || 'solo'}">
                        <div class="game-header">
                            <h3 class="game-title">${game.title || game.name}</h3>
                            <span class="game-type ${game.type || 'solo'}">${(game.type || 'solo').toUpperCase()}</span>
                        </div>
                        <div class="game-description">
                            ${game.description || '센서를 사용한 재미있는 게임입니다.'}
                        </div>
                        <div class="game-actions">
                            <a href="/games/${game.id}" class="btn btn-primary">게임 시작</a>
                            <button class="btn btn-secondary" onclick="showGameInfo('${game.id}')">정보</button>
                        </div>
                    </div>
                `).join('')}
            </div>

            ${games.length === 0 ? `
                <div class="empty-state">
                    <div class="empty-icon">🎮</div>
                    <h3>아직 등록된 게임이 없습니다</h3>
                    <p>새로운 게임을 추가해보세요!</p>
                </div>
            ` : ''}
        </div>
        `;

        const scripts = `
        // 게임 정보 표시
        function showGameInfo(gameId) {
            const gameData = ${JSON.stringify(games)};
            const game = gameData.find(g => g.id === gameId);

            if (game) {
                alert('게임: ' + game.title + '\\n타입: ' + (game.type || 'solo') + '\\n경로: ' + game.path);
            }
        }

        // 게임 타입별 필터링
        function filterGames(type) {
            const cards = document.querySelectorAll('.game-card');
            cards.forEach(card => {
                if (type === 'all' || card.dataset.type === type) {
                    card.style.display = 'block';
                } else {
                    card.style.display = 'none';
                }
            });
        }

        console.log('Game Hub loaded with ${games.length} games');
        `;

        return this.getBaseTemplate('게임 허브', content, scripts);
    }

    /**
     * 에러 페이지 생성
     */
    generateErrorPage(error = '알 수 없는 오류가 발생했습니다.', statusCode = 500) {
        const content = `
        <div class="container">
            <div class="error-container">
                <div class="error-icon">⚠️</div>
                <h1 class="error-title">오류가 발생했습니다</h1>
                <div class="error-code">Error ${statusCode}</div>
                <div class="error-message">${error}</div>

                <div class="error-actions">
                    <button class="btn btn-primary" onclick="window.history.back()">이전 페이지로</button>
                    <a href="/" class="btn btn-secondary">홈으로 이동</a>
                    <button class="btn btn-outline" onclick="window.location.reload()">새로고침</button>
                </div>

                <div class="error-details">
                    <h3>문제 해결 방법</h3>
                    <ul>
                        <li>페이지를 새로고침해보세요</li>
                        <li>브라우저의 캐시를 삭제해보세요</li>
                        <li>잠시 후 다시 시도해보세요</li>
                        <li>문제가 계속되면 관리자에게 문의하세요</li>
                    </ul>
                </div>
            </div>
        </div>
        `;

        const errorStyles = `
        <style>
            .error-container {
                text-align: center;
                max-width: 600px;
                margin: 2rem auto;
                padding: 2rem;
            }

            .error-icon {
                font-size: 4rem;
                margin-bottom: 1rem;
            }

            .error-title {
                color: var(--error);
                margin-bottom: 1rem;
            }

            .error-code {
                font-size: 1.2rem;
                color: var(--text-secondary);
                margin-bottom: 0.5rem;
            }

            .error-message {
                font-size: 1.1rem;
                margin-bottom: 2rem;
                padding: 1rem;
                background: rgba(239, 68, 68, 0.1);
                border-radius: var(--radius);
                border-left: 4px solid var(--error);
            }

            .error-actions {
                display: flex;
                gap: 1rem;
                justify-content: center;
                margin-bottom: 2rem;
                flex-wrap: wrap;
            }

            .error-details {
                text-align: left;
                background: var(--surface);
                padding: 1.5rem;
                border-radius: var(--radius);
                box-shadow: var(--shadow);
            }

            .error-details h3 {
                margin-bottom: 1rem;
                color: var(--primary);
            }

            .error-details ul {
                margin-left: 1.5rem;
            }

            .error-details li {
                margin-bottom: 0.5rem;
            }

            .btn-outline {
                background: transparent;
                border: 2px solid var(--primary);
                color: var(--primary);
            }

            .btn-outline:hover {
                background: var(--primary);
                color: white;
            }
        </style>
        `;

        const scripts = `
        console.log('Error page loaded - Status: ${statusCode}');

        // 에러 보고 기능 (옵션)
        function reportError() {
            const errorInfo = {
                statusCode: ${statusCode},
                message: '${error}',
                userAgent: navigator.userAgent,
                timestamp: new Date().toISOString(),
                url: window.location.href
            };

            console.log('Error Report:', errorInfo);
            // 실제 환경에서는 서버로 에러 보고를 전송할 수 있습니다.
        }

        // 페이지 로드 시 에러 보고 (옵션)
        // reportError();
        `;

        return this.getBaseTemplate('오류 - Sensor Game Hub', content + errorStyles, scripts);
    }

    /**
     * 랜딩 페이지 생성
     * Developer Center와 일관성 있는 디자인 적용
     */
    generateLandingPage(options = {}) {
        const {
            title = 'Sensor Game Hub v6.0',
            stats = {
                games: 12,
                documents: 35,
                vectors: 616
            }
        } = options;

        const styles = `
            <style>
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }

                body {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    background: linear-gradient(135deg, #0F172A 0%, #581C87 50%, #0F172A 100%);
                    color: #F8FAFC;
                    min-height: 100vh;
                    overflow-x: hidden;
                }

                .landing-container {
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: 2rem;
                    min-height: 100vh;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                }

                .hero {
                    text-align: center;
                    margin-bottom: 4rem;
                    animation: fadeInUp 0.8s ease;
                }

                @keyframes fadeInUp {
                    from {
                        opacity: 0;
                        transform: translateY(30px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                .hero-title {
                    font-size: 4rem;
                    font-weight: 900;
                    background: linear-gradient(135deg, #6366F1, #A855F7, #EC4899);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    margin-bottom: 1rem;
                    letter-spacing: -0.02em;
                }

                .hero-subtitle {
                    font-size: 1.5rem;
                    color: #CBD5E1;
                    margin-bottom: 2rem;
                }

                .stats-container {
                    display: flex;
                    justify-content: center;
                    gap: 3rem;
                    margin-bottom: 4rem;
                    flex-wrap: wrap;
                }

                .stat-item {
                    text-align: center;
                    padding: 1.5rem;
                    background: rgba(30, 41, 59, 0.6);
                    backdrop-filter: blur(12px);
                    -webkit-backdrop-filter: blur(12px);
                    border: 1px solid rgba(99, 102, 241, 0.3);
                    border-radius: 16px;
                    min-width: 150px;
                    transition: all 0.3s;
                }

                .stat-item:hover {
                    transform: translateY(-5px);
                    border-color: #6366F1;
                    box-shadow: 0 10px 30px rgba(99, 102, 241, 0.3);
                }

                .stat-number {
                    font-size: 3rem;
                    font-weight: bold;
                    background: linear-gradient(135deg, #6366F1, #8B5CF6);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    display: block;
                    margin-bottom: 0.5rem;
                }

                .stat-label {
                    font-size: 0.875rem;
                    color: #94A3B8;
                    text-transform: uppercase;
                    letter-spacing: 0.1em;
                }

                .nav-cards {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    grid-template-rows: repeat(2, 1fr);
                    gap: 2rem;
                    margin-bottom: 3rem;
                }

                .nav-card {
                    background: rgba(30, 41, 59, 0.6);
                    backdrop-filter: blur(12px);
                    -webkit-backdrop-filter: blur(12px);
                    border: 2px solid rgba(99, 102, 241, 0.3);
                    border-radius: 24px;
                    padding: 2.5rem;
                    text-align: center;
                    cursor: pointer;
                    transition: all 0.3s;
                    text-decoration: none;
                    color: #F8FAFC;
                    display: block;
                }

                .nav-card:hover {
                    transform: translateY(-10px);
                    border-color: #6366F1;
                    box-shadow: 0 20px 60px rgba(99, 102, 241, 0.4);
                    background: rgba(30, 41, 59, 0.8);
                }

                .nav-card-icon {
                    font-size: 4rem;
                    margin-bottom: 1.5rem;
                    display: block;
                }

                .nav-card-title {
                    font-size: 1.8rem;
                    font-weight: 700;
                    margin-bottom: 1rem;
                    color: #F8FAFC;
                }

                .nav-card-description {
                    font-size: 1rem;
                    color: #CBD5E1;
                    line-height: 1.6;
                    margin-bottom: 1.5rem;
                }

                .nav-card-badge {
                    display: inline-block;
                    padding: 0.5rem 1rem;
                    background: rgba(99, 102, 241, 0.2);
                    border: 1px solid #6366F1;
                    border-radius: 12px;
                    font-size: 0.875rem;
                    color: #A5B4FC;
                    font-weight: 600;
                }

                .features {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                    gap: 1.5rem;
                    margin-top: 4rem;
                }

                .feature-item {
                    background: rgba(30, 41, 59, 0.4);
                    border: 1px solid rgba(100, 116, 139, 0.3);
                    border-radius: 16px;
                    padding: 2rem;
                    text-align: center;
                    transition: all 0.3s;
                }

                .feature-item:hover {
                    border-color: rgba(139, 92, 246, 0.5);
                    background: rgba(30, 41, 59, 0.6);
                }

                .feature-icon {
                    font-size: 2.5rem;
                    margin-bottom: 1rem;
                    display: block;
                }

                .feature-title {
                    font-size: 1.1rem;
                    font-weight: 600;
                    color: #E2E8F0;
                    margin-bottom: 0.5rem;
                }

                .feature-text {
                    font-size: 0.875rem;
                    color: #94A3B8;
                    line-height: 1.5;
                }

                @media (max-width: 768px) {
                    .hero-title {
                        font-size: 2.5rem;
                    }

                    .hero-subtitle {
                        font-size: 1.2rem;
                    }

                    .stats-container {
                        gap: 1rem;
                    }

                    .nav-cards {
                        grid-template-columns: 1fr;
                        grid-template-rows: auto;
                    }
                }

                @media (min-width: 769px) and (max-width: 1024px) {
                    .nav-cards {
                        gap: 1.5rem;
                    }
                }

                /* Auth Styles */
                .auth-buttons {
                    display: flex;
                    gap: 1rem;
                    margin: 2rem 0;
                    justify-content: center;
                }

                .auth-btn {
                    padding: 12px 24px;
                    border: none;
                    border-radius: 12px;
                    font-size: 1rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s;
                    text-decoration: none;
                    display: inline-block;
                }

                .login-btn {
                    background: rgba(99, 102, 241, 0.2);
                    color: #6366F1;
                    border: 2px solid #6366F1;
                }

                .login-btn:hover {
                    background: #6366F1;
                    color: white;
                    transform: translateY(-2px);
                }

                .signup-btn {
                    background: #6366F1;
                    color: white;
                    border: 2px solid #6366F1;
                }

                .signup-btn:hover {
                    background: #5B21B6;
                    border-color: #5B21B6;
                    transform: translateY(-2px);
                }

                .test-login-btn {
                    background: linear-gradient(135deg, #10B981, #059669);
                    color: white;
                    border: 2px solid #10B981;
                    font-weight: 600;
                }

                .test-login-btn:hover {
                    background: linear-gradient(135deg, #059669, #047857);
                    border-color: #059669;
                    transform: translateY(-2px);
                    box-shadow: 0 10px 25px rgba(16, 185, 129, 0.4);
                }

                .account-btn {
                    background: rgba(139, 92, 246, 0.2);
                    color: #8B5CF6;
                    border: 2px solid #8B5CF6;
                    padding: 8px 16px;
                    font-size: 0.9rem;
                }

                .account-btn:hover {
                    background: #8B5CF6;
                    color: white;
                }

                .logout-btn {
                    background: rgba(239, 68, 68, 0.2);
                    color: #EF4444;
                    border: 2px solid #EF4444;
                    padding: 8px 16px;
                    font-size: 0.9rem;
                }

                .logout-btn:hover {
                    background: #EF4444;
                    color: white;
                }

                .user-info {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    margin: 2rem 0;
                    justify-content: center;
                }

                .user-greeting {
                    color: #F8FAFC;
                    font-size: 1.1rem;
                    font-weight: 500;
                }

                /* Modal Styles */
                .auth-modal {
                    display: none;
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.8);
                    z-index: 1000;
                    justify-content: center;
                    align-items: center;
                }

                .auth-modal.show {
                    display: flex;
                }

                .modal-content {
                    background: rgba(30, 41, 59, 0.95);
                    backdrop-filter: blur(20px);
                    border: 2px solid rgba(99, 102, 241, 0.3);
                    border-radius: 24px;
                    padding: 2.5rem;
                    width: 90%;
                    max-width: 400px;
                    position: relative;
                }

                .modal-header {
                    text-align: center;
                    margin-bottom: 2rem;
                }

                .modal-title {
                    color: #F8FAFC;
                    font-size: 1.5rem;
                    font-weight: 600;
                    margin: 0;
                }

                .modal-close {
                    position: absolute;
                    top: 1rem;
                    right: 1rem;
                    background: none;
                    border: none;
                    color: #94A3B8;
                    font-size: 1.5rem;
                    cursor: pointer;
                    transition: color 0.3s;
                }

                .modal-close:hover {
                    color: #F8FAFC;
                }

                .form-group {
                    margin-bottom: 1.5rem;
                }

                .form-label {
                    display: block;
                    color: #F8FAFC;
                    font-weight: 500;
                    margin-bottom: 0.5rem;
                }

                .form-input {
                    width: 100%;
                    padding: 12px 16px;
                    border: 2px solid rgba(99, 102, 241, 0.3);
                    border-radius: 12px;
                    background: rgba(15, 23, 42, 0.8);
                    color: #F8FAFC;
                    font-size: 1rem;
                    transition: border-color 0.3s;
                    box-sizing: border-box;
                }

                .form-input:focus {
                    outline: none;
                    border-color: #6366F1;
                }

                .form-submit {
                    width: 100%;
                    padding: 12px;
                    background: #6366F1;
                    color: white;
                    border: none;
                    border-radius: 12px;
                    font-size: 1rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: background 0.3s;
                }

                .form-submit:hover {
                    background: #5B21B6;
                }

                .form-submit:disabled {
                    background: #64748B;
                    cursor: not-allowed;
                }

                .error-message {
                    color: #EF4444;
                    font-size: 0.9rem;
                    margin-top: 0.5rem;
                    display: none;
                }

                .success-message {
                    color: #10B981;
                    font-size: 0.9rem;
                    margin-top: 0.5rem;
                    display: none;
                }

                /* Login Required Popup */
                .login-required-modal {
                    display: none;
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.8);
                    z-index: 1100;
                    justify-content: center;
                    align-items: center;
                }

                .login-required-modal.show {
                    display: flex;
                }

                .login-required-content {
                    background: rgba(30, 41, 59, 0.95);
                    backdrop-filter: blur(20px);
                    border: 2px solid rgba(239, 68, 68, 0.5);
                    border-radius: 24px;
                    padding: 2.5rem;
                    width: 90%;
                    max-width: 450px;
                    text-align: center;
                    position: relative;
                }

                .login-required-icon {
                    font-size: 3rem;
                    color: #EF4444;
                    margin-bottom: 1rem;
                }

                .login-required-title {
                    color: #F8FAFC;
                    font-size: 1.5rem;
                    font-weight: 600;
                    margin: 0 0 1rem 0;
                }

                .login-required-message {
                    color: #CBD5E1;
                    font-size: 1rem;
                    line-height: 1.6;
                    margin-bottom: 2rem;
                }

                .login-required-buttons {
                    display: flex;
                    gap: 1rem;
                    justify-content: center;
                }

                .login-required-btn {
                    padding: 12px 24px;
                    border: none;
                    border-radius: 12px;
                    font-size: 1rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s;
                }

                .login-required-primary {
                    background: #6366F1;
                    color: white;
                    border: 2px solid #6366F1;
                }

                .login-required-primary:hover {
                    background: #5B21B6;
                    border-color: #5B21B6;
                    transform: translateY(-2px);
                }

                .login-required-secondary {
                    background: transparent;
                    color: #CBD5E1;
                    border: 2px solid #64748B;
                }

                .login-required-secondary:hover {
                    background: rgba(100, 116, 139, 0.2);
                    color: #F8FAFC;
                    border-color: #94A3B8;
                }

                @media (max-width: 768px) {
                    .login-required-content {
                        width: 95%;
                        padding: 2rem;
                    }

                    .login-required-buttons {
                        flex-direction: column;
                    }
                }

                @media (max-width: 768px) {
                    .auth-buttons {
                        flex-direction: column;
                        align-items: center;
                    }

                    .user-info {
                        flex-direction: column;
                        gap: 0.5rem;
                    }

                    .modal-content {
                        width: 95%;
                        padding: 2rem;
                    }
                }

                /* User Guide Styles */
                .user-guide-section {
                    margin: 4rem 0;
                    padding: 3rem;
                    background: rgba(30, 41, 59, 0.4);
                    border: 1px solid rgba(99, 102, 241, 0.3);
                    border-radius: 24px;
                }

                .guide-main-title {
                    font-size: 2.5rem;
                    font-weight: 800;
                    text-align: center;
                    background: linear-gradient(135deg, #6366F1, #A855F7);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    margin-bottom: 1rem;
                }

                .guide-subtitle {
                    text-align: center;
                    font-size: 1.2rem;
                    color: #CBD5E1;
                    margin-bottom: 3rem;
                }

                .guide-container {
                    max-width: 900px;
                    margin: 0 auto;
                }

                .guide-item {
                    background: rgba(15, 23, 42, 0.6);
                    border: 2px solid rgba(99, 102, 241, 0.2);
                    border-radius: 16px;
                    margin-bottom: 1.5rem;
                    overflow: hidden;
                    transition: all 0.3s;
                }

                .guide-item:hover {
                    border-color: rgba(99, 102, 241, 0.4);
                }

                .guide-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 1.5rem 2rem;
                    cursor: pointer;
                    user-select: none;
                    transition: background 0.3s;
                }

                .guide-header:hover {
                    background: rgba(99, 102, 241, 0.1);
                }

                .guide-title-row {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                }

                .guide-number {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    width: 40px;
                    height: 40px;
                    background: linear-gradient(135deg, #6366F1, #8B5CF6);
                    border-radius: 50%;
                    font-weight: 700;
                    font-size: 1rem;
                    color: white;
                    flex-shrink: 0;
                }

                .guide-title {
                    font-size: 1.3rem;
                    font-weight: 600;
                    color: #F8FAFC;
                    margin: 0;
                }

                .guide-toggle {
                    font-size: 1.2rem;
                    color: #6366F1;
                    transition: transform 0.3s;
                }

                .guide-item.active .guide-toggle {
                    transform: rotate(180deg);
                }

                .guide-content {
                    max-height: 0;
                    overflow: hidden;
                    transition: max-height 0.3s ease-out;
                }

                .guide-item.active .guide-content {
                    max-height: 3000px;
                    transition: max-height 0.5s ease-in;
                }

                .guide-step {
                    padding: 2rem;
                    color: #CBD5E1;
                    line-height: 1.8;
                }

                .guide-step h4 {
                    color: #F8FAFC;
                    font-size: 1.2rem;
                    font-weight: 600;
                    margin-bottom: 1rem;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }

                .guide-step h5 {
                    color: #E2E8F0;
                    font-size: 1.1rem;
                    font-weight: 600;
                    margin-top: 1.5rem;
                    margin-bottom: 0.8rem;
                }

                .guide-step ul, .guide-step ol {
                    margin: 1rem 0;
                    padding-left: 2rem;
                }

                .guide-step li {
                    margin-bottom: 0.8rem;
                    color: #CBD5E1;
                }

                .guide-step li strong {
                    color: #F8FAFC;
                    font-weight: 600;
                }

                .guide-step ul ul {
                    margin-top: 0.5rem;
                }

                .guide-step code {
                    background: rgba(99, 102, 241, 0.2);
                    color: #A5B4FC;
                    padding: 0.2rem 0.6rem;
                    border-radius: 6px;
                    font-family: 'Courier New', monospace;
                    font-size: 0.9rem;
                }

                .guide-note {
                    background: rgba(99, 102, 241, 0.1);
                    border-left: 4px solid #6366F1;
                    padding: 1rem 1.5rem;
                    margin-top: 1.5rem;
                    border-radius: 8px;
                    color: #E2E8F0;
                    line-height: 1.6;
                }

                .guide-example {
                    background: rgba(139, 92, 246, 0.15);
                    border-left: 4px solid #8B5CF6;
                    padding: 1rem 1.5rem;
                    margin: 1rem 0;
                    border-radius: 8px;
                    color: #E9D5FF;
                    font-style: italic;
                }

                @media (max-width: 768px) {
                    .user-guide-section {
                        padding: 2rem 1rem;
                        margin: 2rem 0;
                    }

                    .guide-main-title {
                        font-size: 2rem;
                    }

                    .guide-subtitle {
                        font-size: 1rem;
                    }

                    .guide-header {
                        padding: 1rem 1.5rem;
                    }

                    .guide-title {
                        font-size: 1.1rem;
                    }

                    .guide-number {
                        width: 35px;
                        height: 35px;
                        font-size: 0.9rem;
                    }

                    .guide-step {
                        padding: 1.5rem;
                    }

                    .guide-step h4 {
                        font-size: 1.1rem;
                    }

                    .guide-step ul, .guide-step ol {
                        padding-left: 1.5rem;
                    }
                }
            </style>
        `;

        const content = `
            <div class="landing-container">
                <!-- Hero Section -->
                <div class="hero">
                    <h1 class="hero-title">${title}</h1>
                    <p class="hero-subtitle">🎮 모바일 센서로 새로운 게임 경험을</p>

                    <!-- Auth Buttons -->
                    <div class="auth-buttons" id="authButtons">
                        <button class="auth-btn login-btn" onclick="showLoginModal()">로그인</button>
                        <button class="auth-btn signup-btn" onclick="showSignupModal()">회원가입</button>
                        <button class="auth-btn test-login-btn" onclick="testAccountLogin()">🚀 테스트 계정으로 로그인</button>
                    </div>

                    <!-- User Info (hidden by default) -->
                    <div class="user-info" id="userInfo" style="display: none;">
                        <span class="user-greeting">안녕하세요, <span id="userName"></span>님!</span>
                        <button class="auth-btn account-btn" onclick="navigateToAccount()">계정 관리</button>
                        <button class="auth-btn logout-btn" onclick="logout()">로그아웃</button>
                    </div>

                    <!-- Stats -->
                    <div class="stats-container">
                        <div class="stat-item">
                            <span class="stat-number">${stats.games}</span>
                            <span class="stat-label">게임</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-number">${stats.documents}</span>
                            <span class="stat-label">문서</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-number">${stats.vectors}</span>
                            <span class="stat-label">AI 벡터</span>
                        </div>
                    </div>
                </div>

                <!-- Navigation Cards -->
                <div class="nav-cards">
                    <a href="/games" class="nav-card">
                        <span class="nav-card-icon">🎮</span>
                        <h2 class="nav-card-title">게임 목록</h2>
                        <p class="nav-card-description">
                            ${stats.games}개의 센서 게임을 즐겨보세요
                        </p>
                        <span class="nav-card-badge">${stats.games} Games Available</span>
                    </a>

                    <a href="/sensor.html" class="nav-card">
                        <span class="nav-card-icon">📱</span>
                        <h2 class="nav-card-title">센서 클라이언트</h2>
                        <p class="nav-card-description">
                            핸드폰을 컨트롤러로 사용하세요
                        </p>
                        <span class="nav-card-badge">Mobile Controller</span>
                    </a>

                    <a href="javascript:void(0)" onclick="navigateToAIGenerator()" class="nav-card">
                        <span class="nav-card-icon">🤖</span>
                        <h2 class="nav-card-title">AI 게임 생성기</h2>
                        <p class="nav-card-description">
                            Multi-Stage Generation으로 A+ 게임 자동 생성
                        </p>
                        <span class="nav-card-badge">95% Quality Guaranteed</span>
                    </a>

                    <!-- 게임 관리 섹션 숨김 - 개발자 센터에 통합됨
                    <a href="/game-manager" class="nav-card">
                        <span class="nav-card-icon">🛠️</span>
                        <h2 class="nav-card-title">게임 관리</h2>
                        <p class="nav-card-description">
                            버그 리포트, 기능 추가, 수정 이력 관리
                        </p>
                        <span class="nav-card-badge">Game Maintenance</span>
                    </a>
                    -->

                    <a href="javascript:void(0)" onclick="navigateToDeveloper()" class="nav-card">
                        <span class="nav-card-icon">👨‍💻</span>
                        <h2 class="nav-card-title">개발자 센터</h2>
                        <p class="nav-card-description">
                            문서, AI 챗봇, 개발 도구 제공
                        </p>
                        <span class="nav-card-badge">${stats.documents} Docs + AI Tools</span>
                    </a>
                </div>

                <!-- User Guide Section -->
                <div class="user-guide-section">
                    <h2 class="guide-main-title">📖 사용자 가이드</h2>
                    <p class="guide-subtitle">센서 게임 허브를 처음 사용하시나요? 단계별로 따라해보세요!</p>

                    <div class="guide-container">
                        <!-- Guide Item 1: 회원가입 및 로그인 -->
                        <div class="guide-item">
                            <div class="guide-header" onclick="toggleGuide(this)">
                                <div class="guide-title-row">
                                    <span class="guide-number">01</span>
                                    <h3 class="guide-title">회원가입 및 로그인</h3>
                                </div>
                                <span class="guide-toggle">▼</span>
                            </div>
                            <div class="guide-content">
                                <div class="guide-step">
                                    <h4>🔑 로그인 방법</h4>
                                    <ul>
                                        <li><strong>일반 로그인:</strong> 상단의 "로그인" 버튼을 클릭하여 이메일과 비밀번호를 입력하세요.</li>
                                        <li><strong>회원가입:</strong> "회원가입" 버튼을 클릭하여 이름, 닉네임, 이메일, 비밀번호를 입력하세요.</li>
                                        <li><strong>테스트 계정:</strong> "🚀 테스트 계정으로 로그인" 버튼을 클릭하면 별도의 입력 없이 즉시 체험할 수 있습니다.</li>
                                    </ul>
                                    <div class="guide-note">
                                        💡 <strong>Tip:</strong> 테스트 계정(test@test.com)으로 먼저 플랫폼을 체험해보세요!
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Guide Item 2: 게임 플레이 -->
                        <div class="guide-item">
                            <div class="guide-header" onclick="toggleGuide(this)">
                                <div class="guide-title-row">
                                    <span class="guide-number">02</span>
                                    <h3 class="guide-title">게임 플레이 방법</h3>
                                </div>
                                <span class="guide-toggle">▼</span>
                            </div>
                            <div class="guide-content">
                                <div class="guide-step">
                                    <h4>🎮 게임 목록에서 게임 선택하기</h4>
                                    <ol>
                                        <li><strong>게임 목록 페이지 접속:</strong> 메인 화면에서 "🎮 게임 목록" 카드를 클릭하세요.</li>
                                        <li><strong>게임 선택:</strong> 원하는 게임 카드를 클릭하여 게임 페이지로 이동합니다.</li>
                                        <li><strong>QR 코드 스캔:</strong> 게임 화면에 표시되는 QR 코드를 스마트폰으로 스캔하세요.</li>
                                        <li><strong>센서 연결:</strong> QR 코드를 스캔하면 센서 클라이언트 페이지로 이동하고, 자동으로 PC와 연결됩니다.</li>
                                        <li><strong>게임 시작:</strong> 연결이 완료되면 스마트폰을 기울이거나 움직여 게임을 플레이하세요!</li>
                                    </ol>
                                    <div class="guide-note">
                                        ⚠️ <strong>주의:</strong> iOS 기기는 센서 권한을 허용해야 합니다. 센서 클라이언트 페이지에서 권한 요청 팝업이 나타나면 "허용"을 선택하세요.
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Guide Item 3: 센서 클라이언트 -->
                        <div class="guide-item">
                            <div class="guide-header" onclick="toggleGuide(this)">
                                <div class="guide-title-row">
                                    <span class="guide-number">03</span>
                                    <h3 class="guide-title">센서 클라이언트 사용법</h3>
                                </div>
                                <span class="guide-toggle">▼</span>
                            </div>
                            <div class="guide-content">
                                <div class="guide-step">
                                    <h4>📱 스마트폰을 컨트롤러로 변신!</h4>
                                    <ul>
                                        <li><strong>직접 접속:</strong> 메인 화면에서 "📱 센서 클라이언트" 카드를 클릭하거나, 스마트폰에서 직접 <code>/sensor.html</code>로 접속하세요.</li>
                                        <li><strong>세션 코드 입력:</strong> PC 게임 화면에 표시된 6자리 세션 코드를 입력하고 "연결하기" 버튼을 누르세요.</li>
                                        <li><strong>센서 데이터 전송:</strong> 연결이 완료되면 스마트폰의 기울기, 가속도 센서 데이터가 실시간으로 PC로 전송됩니다.</li>
                                        <li><strong>센서 정보 확인:</strong> 센서 클라이언트 화면에서 현재 센서 값(기울기, 가속도 등)을 실시간으로 확인할 수 있습니다.</li>
                                    </ul>
                                    <div class="guide-note">
                                        💡 <strong>Tip:</strong> QR 코드를 스캔하면 세션 코드가 자동으로 입력되므로 더 편리합니다!
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Guide Item 4: AI 게임 생성기 -->
                        <div class="guide-item">
                            <div class="guide-header" onclick="toggleGuide(this)">
                                <div class="guide-title-row">
                                    <span class="guide-number">04</span>
                                    <h3 class="guide-title">AI 게임 생성기 사용법</h3>
                                </div>
                                <span class="guide-toggle">▼</span>
                            </div>
                            <div class="guide-content">
                                <div class="guide-step">
                                    <h4>🤖 나만의 센서 게임을 만들어보세요!</h4>
                                    <ol>
                                        <li><strong>AI 게임 생성기 접속:</strong> 메인 화면에서 "🤖 AI 게임 생성기" 카드를 클릭하세요. (로그인 필요)</li>
                                        <li><strong>게임 아이디어 입력:</strong> 만들고 싶은 게임에 대해 자연어로 설명하세요.
                                            <div class="guide-example">
                                                예시: "스마트폰을 기울여 공을 굴려 미로를 탈출하는 게임을 만들어줘"
                                            </div>
                                        </li>
                                        <li><strong>대화형 생성 과정:</strong> AI와 대화하며 게임을 구체화하세요. AI가 질문하면 답변하여 게임을 정교하게 다듬을 수 있습니다.</li>
                                        <li><strong>5단계 생성 프로세스:</strong>
                                            <ul>
                                                <li>Stage 1: 게임 아이디어 분석 (0-20%)</li>
                                                <li>Stage 2: 유사 게임 검색 (20-40%)</li>
                                                <li>Stage 3: AI 코드 생성 (40-80%)</li>
                                                <li>Stage 4: 코드 품질 검증 (80-90%)</li>
                                                <li>Stage 5: 게임 등록 및 완성 (90-100%)</li>
                                            </ul>
                                        </li>
                                        <li><strong>게임 완성:</strong> 생성이 완료되면 게임 목록에 자동으로 추가되며, 바로 플레이할 수 있습니다!</li>
                                    </ol>
                                    <div class="guide-note">
                                        ✨ <strong>품질 보장:</strong> 모든 생성된 게임은 최소 95점 이상의 품질 점수를 보장합니다!
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Guide Item 5: 개발자 센터 -->
                        <div class="guide-item">
                            <div class="guide-header" onclick="toggleGuide(this)">
                                <div class="guide-title-row">
                                    <span class="guide-number">05</span>
                                    <h3 class="guide-title">개발자 센터 활용하기</h3>
                                </div>
                                <span class="guide-toggle">▼</span>
                            </div>
                            <div class="guide-content">
                                <div class="guide-step">
                                    <h4>👨‍💻 고급 개발 도구 및 문서</h4>
                                    <p>개발자 센터에서는 다양한 개발 도구와 문서를 제공합니다. (로그인 필요)</p>

                                    <h5>📚 문서 섹션</h5>
                                    <ul>
                                        <li><strong>카테고리별 문서:</strong> API, 게임 개발, 센서, SessionSDK 등 35개 이상의 문서를 제공합니다.</li>
                                        <li><strong>검색 기능:</strong> 필요한 문서를 빠르게 찾을 수 있습니다.</li>
                                    </ul>

                                    <h5>🤖 AI 어시스턴트</h5>
                                    <ul>
                                        <li><strong>RAG 기반 챗봇:</strong> 616개의 벡터 임베딩을 활용한 지능형 AI가 개발 관련 질문에 답변합니다.</li>
                                        <li><strong>문서 기반 답변:</strong> 프로젝트 문서를 기반으로 정확한 정보를 제공합니다.</li>
                                    </ul>

                                    <h5>🛠️ 게임 관리</h5>
                                    <ul>
                                        <li><strong>버그 리포트:</strong> 생성된 게임에 버그가 있다면 AI가 자동으로 수정합니다.</li>
                                        <li><strong>기능 추가:</strong> 기존 게임에 새로운 기능을 추가할 수 있습니다.</li>
                                        <li><strong>버전 관리:</strong> 모든 수정 이력이 자동으로 관리되며, 버전별로 롤백 가능합니다.</li>
                                        <li><strong>권한 관리:</strong> 본인이 만든 게임만 수정할 수 있습니다. (admin@admin.com은 모든 게임 접근 가능)</li>
                                    </ul>

                                    <h5>📊 통계 대시보드</h5>
                                    <ul>
                                        <li><strong>실시간 통계:</strong> 총 게임 수, 문서 수, AI 벡터 수 등을 확인할 수 있습니다.</li>
                                        <li><strong>게임 성능:</strong> 각 게임의 품질 점수와 버전 정보를 확인할 수 있습니다.</li>
                                    </ul>

                                    <div class="guide-note">
                                        💼 <strong>권한:</strong> 개발자 센터의 일부 기능(AI 게임 생성기, 게임 관리)은 로그인이 필요합니다. 문서와 AI 어시스턴트는 비로그인 상태에서도 사용 가능합니다.
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Guide Item 6: 공개/비공개 설정 -->
                        <div class="guide-item">
                            <div class="guide-header" onclick="toggleGuide(this)">
                                <div class="guide-title-row">
                                    <span class="guide-number">06</span>
                                    <h3 class="guide-title">게임 공개/비공개 설정</h3>
                                </div>
                                <span class="guide-toggle">▼</span>
                            </div>
                            <div class="guide-content">
                                <div class="guide-step">
                                    <h4>🔒 내 게임 관리하기</h4>
                                    <ul>
                                        <li><strong>공개 게임:</strong> 모든 사용자가 게임 목록에서 볼 수 있고 플레이할 수 있습니다.</li>
                                        <li><strong>비공개 게임:</strong> 게임 소유자만 게임 목록에서 볼 수 있습니다. 다른 사용자에게는 표시되지 않습니다.</li>
                                        <li><strong>권한 배지:</strong> 게임 카드에 권한 상태가 표시됩니다.
                                            <ul>
                                                <li>👑 관리자 권한 (admin@admin.com)</li>
                                                <li>✓ 내가 만든 게임</li>
                                                <li>🔒 읽기 전용 (다른 사람이 만든 공개 게임)</li>
                                            </ul>
                                        </li>
                                        <li><strong>권한 제어:</strong> 본인이 만든 게임과 관리자(admin@admin.com)만 게임을 수정하거나 삭제할 수 있습니다.</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Platform Features -->
                <div class="features">
                    <div class="feature-item">
                        <span class="feature-icon">⚡</span>
                        <h3 class="feature-title">실시간 센서</h3>
                        <p class="feature-text">50ms 간격 고속 센서 데이터 전송</p>
                    </div>

                    <div class="feature-item">
                        <span class="feature-icon">🔗</span>
                        <h3 class="feature-title">즉시 연결</h3>
                        <p class="feature-text">QR 코드로 빠른 세션 연결</p>
                    </div>

                    <div class="feature-item">
                        <span class="feature-icon">🤖</span>
                        <h3 class="feature-title">AI 지원</h3>
                        <p class="feature-text">${stats.vectors}개 벡터 기반 챗봇</p>
                    </div>

                    <div class="feature-item">
                        <span class="feature-icon">🎨</span>
                        <h3 class="feature-title">게임 생성기</h3>
                        <p class="feature-text">대화형 AI 게임 개발 도구</p>
                    </div>
                </div>

                <!-- Login Modal -->
                <div id="loginModal" class="auth-modal">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h2 class="modal-title">로그인</h2>
                            <button class="modal-close" onclick="closeAuthModals()">&times;</button>
                        </div>
                        <form id="loginForm">
                            <div class="form-group">
                                <label class="form-label" for="loginEmail">이메일</label>
                                <input type="email" id="loginEmail" class="form-input" required>
                            </div>
                            <div class="form-group">
                                <label class="form-label" for="loginPassword">비밀번호</label>
                                <input type="password" id="loginPassword" class="form-input" required>
                            </div>
                            <button type="submit" class="form-submit" id="loginSubmit">로그인</button>
                            <div id="loginError" class="error-message"></div>
                            <div id="loginSuccess" class="success-message"></div>
                        </form>
                    </div>
                </div>

                <!-- Signup Modal -->
                <div id="signupModal" class="auth-modal">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h2 class="modal-title">회원가입</h2>
                            <button class="modal-close" onclick="closeAuthModals()">&times;</button>
                        </div>
                        <form id="signupForm">
                            <div class="form-group">
                                <label class="form-label" for="signupName">이름</label>
                                <input type="text" id="signupName" class="form-input" required>
                            </div>
                            <div class="form-group">
                                <label class="form-label" for="signupNickname">닉네임</label>
                                <input type="text" id="signupNickname" class="form-input" required>
                            </div>
                            <div class="form-group">
                                <label class="form-label" for="signupEmail">이메일</label>
                                <input type="email" id="signupEmail" class="form-input" required>
                            </div>
                            <div class="form-group">
                                <label class="form-label" for="signupPassword">비밀번호</label>
                                <input type="password" id="signupPassword" class="form-input" required>
                            </div>
                            <button type="submit" class="form-submit" id="signupSubmit">회원가입</button>
                            <div id="signupError" class="error-message"></div>
                            <div id="signupSuccess" class="success-message"></div>
                        </form>
                    </div>
                </div>

                <!-- Login Required Modal -->
                <div id="loginRequiredModal" class="login-required-modal">
                    <div class="login-required-content">
                        <div class="login-required-icon">🔐</div>
                        <h2 class="login-required-title">로그인이 필요합니다</h2>
                        <p class="login-required-message" id="loginRequiredMessage">
                            이 기능을 사용하려면 로그인이 필요합니다.<br>
                            로그인하시겠습니까?
                        </p>
                        <div class="login-required-buttons">
                            <button class="login-required-btn login-required-primary" onclick="proceedToLogin()">
                                로그인하기
                            </button>
                            <button class="login-required-btn login-required-secondary" onclick="closeLoginRequiredModal()">
                                취소
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        const scripts = `
            console.log('🎮 Sensor Game Hub v6.0 - Landing Page');
            console.log('📊 Stats:', ${JSON.stringify(stats)});

            // 인증 상태 관리
            let currentUser = null;
            let authToken = localStorage.getItem('authToken');

            // 페이지 로드 시 인증 상태 확인
            document.addEventListener('DOMContentLoaded', async () => {
                console.log('✅ Landing page loaded successfully');
                await checkAuthStatus();
            });

            // 가이드 토글 함수
            function toggleGuide(headerElement) {
                const guideItem = headerElement.parentElement;
                guideItem.classList.toggle('active');
            }

            // 인증 상태 확인
            async function checkAuthStatus() {
                if (!authToken) {
                    showAuthButtons();
                    return;
                }

                try {
                    const response = await fetch('/api/auth/user', {
                        headers: {
                            'Authorization': 'Bearer ' + authToken
                        }
                    });

                    if (response.ok) {
                        const data = await response.json();
                        currentUser = data.user;
                        showUserInfo();
                    } else {
                        localStorage.removeItem('authToken');
                        authToken = null;
                        showAuthButtons();
                    }
                } catch (error) {
                    console.error('Auth check error:', error);
                    showAuthButtons();
                }
            }

            // 인증 버튼 표시
            function showAuthButtons() {
                document.getElementById('authButtons').style.display = 'flex';
                document.getElementById('userInfo').style.display = 'none';
            }

            // 사용자 정보 표시
            function showUserInfo() {
                document.getElementById('authButtons').style.display = 'none';
                document.getElementById('userInfo').style.display = 'flex';
                document.getElementById('userName').textContent = currentUser.nickname || currentUser.name;
            }

            // 로그인 모달 표시
            function showLoginModal() {
                document.getElementById('loginModal').classList.add('show');
            }

            // 회원가입 모달 표시
            function showSignupModal() {
                document.getElementById('signupModal').classList.add('show');
            }

            // 모달 닫기
            function closeAuthModals() {
                document.getElementById('loginModal').classList.remove('show');
                document.getElementById('signupModal').classList.remove('show');
                clearMessages();
            }

            // 에러/성공 메시지 초기화
            function clearMessages() {
                const messages = document.querySelectorAll('.error-message, .success-message');
                messages.forEach(msg => {
                    msg.style.display = 'none';
                    msg.textContent = '';
                });
            }

            // 에러 메시지 표시
            function showError(elementId, message) {
                const element = document.getElementById(elementId);
                element.textContent = message;
                element.style.display = 'block';
            }

            // 성공 메시지 표시
            function showSuccess(elementId, message) {
                const element = document.getElementById(elementId);
                element.textContent = message;
                element.style.display = 'block';
            }

            // 테스트 계정 로그인
            async function testAccountLogin() {
                try {
                    console.log('🚀 테스트 계정으로 로그인 시도...');

                    const response = await fetch('/api/auth/login', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            email: 'test@test.com',
                            password: 'test1234'
                        })
                    });

                    const data = await response.json();

                    if (response.ok) {
                        authToken = data.session.access_token;
                        localStorage.setItem('authToken', authToken);
                        currentUser = data.user;

                        console.log('✅ 테스트 계정 로그인 성공:', currentUser);

                        // 성공 알림 (간단한 알림 후 바로 사용자 정보 표시)
                        showUserInfo();

                        // 환영 메시지 (옵션)
                        setTimeout(() => {
                            alert('테스트 계정으로 로그인되었습니다!\\n\\n이메일: test@test.com\\n\\n이제 모든 기능을 자유롭게 사용해보세요! 🎮');
                        }, 500);
                    } else {
                        console.error('❌ 테스트 계정 로그인 실패:', data.error);
                        alert('테스트 계정 로그인에 실패했습니다.\\n\\n오류: ' + (data.error || '알 수 없는 오류'));
                    }
                } catch (error) {
                    console.error('❌ 테스트 로그인 오류:', error);
                    alert('네트워크 오류가 발생했습니다.\\n\\n잠시 후 다시 시도해주세요.');
                }
            }

            // 로그인 폼 처리
            document.getElementById('loginForm').addEventListener('submit', async (e) => {
                e.preventDefault();
                clearMessages();

                const submitButton = document.getElementById('loginSubmit');
                submitButton.disabled = true;
                submitButton.textContent = '로그인 중...';

                const email = document.getElementById('loginEmail').value;
                const password = document.getElementById('loginPassword').value;

                try {
                    const response = await fetch('/api/auth/login', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ email, password })
                    });

                    const data = await response.json();

                    if (response.ok) {
                        authToken = data.session.access_token;
                        localStorage.setItem('authToken', authToken);
                        currentUser = data.user;

                        showSuccess('loginSuccess', '로그인되었습니다!');

                        setTimeout(() => {
                            closeAuthModals();
                            showUserInfo();
                        }, 1000);
                    } else {
                        showError('loginError', data.error || '로그인에 실패했습니다.');
                    }
                } catch (error) {
                    console.error('Login error:', error);
                    showError('loginError', '네트워크 오류가 발생했습니다.');
                } finally {
                    submitButton.disabled = false;
                    submitButton.textContent = '로그인';
                }
            });

            // 회원가입 폼 처리
            document.getElementById('signupForm').addEventListener('submit', async (e) => {
                e.preventDefault();
                clearMessages();

                const submitButton = document.getElementById('signupSubmit');
                submitButton.disabled = true;
                submitButton.textContent = '가입 중...';

                const name = document.getElementById('signupName').value;
                const nickname = document.getElementById('signupNickname').value;
                const email = document.getElementById('signupEmail').value;
                const password = document.getElementById('signupPassword').value;

                try {
                    const response = await fetch('/api/auth/signup', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ name, nickname, email, password })
                    });

                    const data = await response.json();

                    if (response.ok) {
                        authToken = data.session.access_token;
                        localStorage.setItem('authToken', authToken);
                        currentUser = data.user;

                        showSuccess('signupSuccess', '회원가입이 완료되었습니다!');

                        setTimeout(() => {
                            closeAuthModals();
                            showUserInfo();
                        }, 1000);
                    } else {
                        showError('signupError', data.error || '회원가입에 실패했습니다.');
                    }
                } catch (error) {
                    console.error('Signup error:', error);
                    showError('signupError', '네트워크 오류가 발생했습니다.');
                } finally {
                    submitButton.disabled = false;
                    submitButton.textContent = '회원가입';
                }
            });

            // 계정 관리 페이지로 이동
            function navigateToAccount() {
                window.location.href = '/account-management';
            }

            // 로그아웃
            async function logout() {
                try {
                    if (authToken) {
                        await fetch('/api/auth/logout', {
                            method: 'POST',
                            headers: {
                                'Authorization': 'Bearer ' + authToken
                            }
                        });
                    }
                } catch (error) {
                    console.error('Logout error:', error);
                } finally {
                    localStorage.removeItem('authToken');
                    authToken = null;
                    currentUser = null;
                    showAuthButtons();
                }
            }

            // 모달 외부 클릭 시 닫기
            document.addEventListener('click', (e) => {
                if (e.target.classList.contains('auth-modal')) {
                    closeAuthModals();
                }
                if (e.target.classList.contains('login-required-modal')) {
                    closeLoginRequiredModal();
                }
            });

            // 네비게이션 함수들
            let pendingNavigation = null;

            // AI 게임 생성기 접근
            function navigateToAIGenerator() {
                if (currentUser) {
                    // 로그인된 경우 바로 이동
                    window.location.href = '/interactive-game-generator';
                } else {
                    // 로그인 필요 팝업 표시
                    showLoginRequiredModal(
                        'AI 게임 생성기',
                        'AI 게임 생성기를 사용하려면 로그인이 필요합니다.<br>게임 제작자 계정으로 로그인해주세요.'
                    );
                    pendingNavigation = '/interactive-game-generator';
                }
            }

            // 개발자 센터 접근
            function navigateToDeveloper() {
                if (currentUser) {
                    // 로그인된 경우 바로 이동
                    window.location.href = '/developer';
                } else {
                    // 로그인 필요 팝업 표시
                    showLoginRequiredModal(
                        '개발자 센터',
                        '개발자 센터를 사용하려면 로그인이 필요합니다.<br>문서, AI 챗봇, 개발 도구에 접근하려면 로그인해주세요.'
                    );
                    pendingNavigation = '/developer';
                }
            }

            // 로그인 필요 모달 표시
            function showLoginRequiredModal(feature, message) {
                document.getElementById('loginRequiredMessage').innerHTML = message;
                document.getElementById('loginRequiredModal').classList.add('show');
            }

            // 로그인 필요 모달 닫기
            function closeLoginRequiredModal() {
                document.getElementById('loginRequiredModal').classList.remove('show');
                pendingNavigation = null;
            }

            // 로그인 진행
            function proceedToLogin() {
                closeLoginRequiredModal();
                showLoginModal();
            }

            // 로그인 성공 후 처리 수정
            const originalLoginSuccess = showUserInfo;
            showUserInfo = function() {
                originalLoginSuccess();

                // 대기 중인 네비게이션이 있으면 실행
                if (pendingNavigation) {
                    setTimeout(() => {
                        window.location.href = pendingNavigation;
                        pendingNavigation = null;
                    }, 500);
                }
            };
        `;

        return this.getBaseTemplate(title, content + styles, scripts);
    }

    /**
     * 게임 목록 페이지 생성
     */
    generateGamesListPage(options = {}) {
        const {
            title = '게임 목록 - Sensor Game Hub',
            games = []
        } = options;

        const styles = `
            <style>
                body {
                    background: linear-gradient(135deg, #0F172A 0%, #581C87 50%, #0F172A 100%);
                    min-height: 100vh;
                    margin: 0;
                    padding: 0;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                }

                .games-container {
                    max-width: 1400px;
                    margin: 0 auto;
                    padding: 3rem 2rem;
                }

                .header {
                    text-align: center;
                    margin-bottom: 4rem;
                }

                .header h1 {
                    font-size: 3.5rem;
                    font-weight: 800;
                    background: linear-gradient(135deg, #60A5FA 0%, #A78BFA 50%, #F472B6 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    margin-bottom: 1rem;
                }

                .header p {
                    font-size: 1.25rem;
                    color: rgba(255, 255, 255, 0.7);
                }

                .back-button {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.75rem 1.5rem;
                    background: rgba(255, 255, 255, 0.1);
                    backdrop-filter: blur(10px);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    border-radius: 12px;
                    color: white;
                    text-decoration: none;
                    font-weight: 600;
                    transition: all 0.3s;
                    margin-bottom: 2rem;
                }

                .back-button:hover {
                    background: rgba(255, 255, 255, 0.2);
                    transform: translateY(-2px);
                }

                .games-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
                    gap: 2rem;
                    margin-top: 2rem;
                }

                .game-card {
                    background: rgba(255, 255, 255, 0.1);
                    backdrop-filter: blur(20px);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    border-radius: 20px;
                    padding: 2rem;
                    transition: all 0.3s;
                    cursor: pointer;
                    text-decoration: none;
                    color: white;
                    display: block;
                }

                .game-card:hover {
                    transform: translateY(-5px);
                    background: rgba(255, 255, 255, 0.15);
                    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                }

                .game-icon {
                    font-size: 4rem;
                    margin-bottom: 1rem;
                    display: block;
                }

                .game-title {
                    font-size: 1.75rem;
                    font-weight: 700;
                    margin-bottom: 0.5rem;
                    color: white;
                }

                .game-id {
                    font-size: 0.9rem;
                    color: rgba(255, 255, 255, 0.5);
                    font-family: 'Courier New', monospace;
                    margin-bottom: 1rem;
                }

                .game-type {
                    display: inline-block;
                    padding: 0.5rem 1rem;
                    background: rgba(96, 165, 250, 0.2);
                    border: 1px solid rgba(96, 165, 250, 0.4);
                    border-radius: 8px;
                    font-size: 0.875rem;
                    font-weight: 600;
                    color: #60A5FA;
                    margin-bottom: 1rem;
                }

                .game-description {
                    color: rgba(255, 255, 255, 0.7);
                    line-height: 1.6;
                    margin-bottom: 1.5rem;
                }

                .play-button {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.75rem 1.5rem;
                    background: linear-gradient(135deg, #3B82F6, #8B5CF6);
                    border-radius: 12px;
                    color: white;
                    font-weight: 600;
                    border: none;
                    cursor: pointer;
                    transition: all 0.3s;
                }

                .play-button:hover {
                    transform: scale(1.05);
                    box-shadow: 0 10px 30px rgba(59, 130, 246, 0.3);
                }

                /* 검색/정렬 바 */
                .search-filter-bar {
                    display: flex;
                    gap: 1rem;
                    margin: 2rem 0;
                    padding: 1.5rem;
                    background: rgba(255, 255, 255, 0.05);
                    backdrop-filter: blur(20px);
                    border-radius: 1rem;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                }

                #game-search {
                    flex: 1;
                    padding: 0.75rem 1rem;
                    background: rgba(255, 255, 255, 0.1);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    border-radius: 0.5rem;
                    color: white;
                    font-size: 1rem;
                    outline: none;
                    transition: all 0.3s;
                }

                #game-search::placeholder {
                    color: rgba(255, 255, 255, 0.5);
                }

                #game-search:focus {
                    background: rgba(255, 255, 255, 0.15);
                    border-color: rgba(96, 165, 250, 0.5);
                }

                #game-sort {
                    padding: 0.75rem 1rem;
                    background: rgba(255, 255, 255, 0.1);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    border-radius: 0.5rem;
                    color: white;
                    cursor: pointer;
                    outline: none;
                    transition: all 0.3s;
                    font-size: 1rem;
                }

                #game-sort:hover {
                    background: rgba(255, 255, 255, 0.15);
                    border-color: rgba(96, 165, 250, 0.5);
                }

                #game-sort option {
                    background: #1E293B;
                    color: white;
                }

                /* 결과 카운트 */
                .result-count {
                    text-align: center;
                    color: rgba(255, 255, 255, 0.7);
                    font-size: 1rem;
                    margin: 1rem 0;
                }

                /* 필터 버튼 바 (기존 stats-bar 개선) */
                .filter-bar {
                    display: flex;
                    justify-content: center;
                    gap: 1rem;
                    margin: 2rem 0;
                    flex-wrap: wrap;
                }

                .filter-btn {
                    padding: 0.75rem 1.5rem;
                    background: rgba(255, 255, 255, 0.1);
                    border: 2px solid rgba(255, 255, 255, 0.2);
                    border-radius: 0.75rem;
                    color: white;
                    cursor: pointer;
                    transition: all 0.3s;
                    font-size: 1rem;
                    font-weight: 600;
                    outline: none;
                }

                .filter-btn:hover {
                    background: rgba(255, 255, 255, 0.15);
                    border-color: rgba(96, 165, 250, 0.5);
                    transform: translateY(-2px);
                }

                .filter-btn.active {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    border-color: #667eea;
                    transform: scale(1.05);
                    box-shadow: 0 10px 30px rgba(102, 126, 234, 0.4);
                }

                .filter-btn .count {
                    display: inline-block;
                    margin-left: 0.5rem;
                    font-weight: 800;
                    color: #60A5FA;
                }

                .filter-btn.active .count {
                    color: white;
                }

                .stats-bar {
                    display: flex;
                    justify-content: center;
                    gap: 3rem;
                    margin: 3rem 0;
                    padding: 2rem;
                    background: rgba(255, 255, 255, 0.05);
                    backdrop-filter: blur(10px);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 16px;
                }

                .stat-item {
                    text-align: center;
                    padding: 1.5rem 2rem;
                    background: rgba(59, 130, 246, 0.1);
                    border: 1px solid rgba(96, 165, 250, 0.3);
                    border-radius: 12px;
                    min-width: 150px;
                    transition: all 0.3s;
                }

                .stat-item:hover {
                    background: rgba(59, 130, 246, 0.2);
                    border-color: rgba(96, 165, 250, 0.5);
                    transform: translateY(-3px);
                }

                .stat-value {
                    font-size: 2.5rem;
                    font-weight: 800;
                    color: #60A5FA;
                    text-shadow: 0 0 20px rgba(96, 165, 250, 0.5);
                }

                .stat-label {
                    color: rgba(255, 255, 255, 0.8);
                    font-size: 0.9rem;
                    font-weight: 600;
                    margin-top: 0.5rem;
                }

                @media (max-width: 768px) {
                    .games-grid {
                        grid-template-columns: 1fr;
                    }

                    .header h1 {
                        font-size: 2.5rem;
                    }

                    .stats-bar {
                        flex-direction: column;
                        gap: 1.5rem;
                    }

                    .search-filter-bar {
                        flex-direction: column;
                    }

                    .filter-bar {
                        gap: 0.5rem;
                    }

                    .filter-btn {
                        flex: 1;
                        min-width: calc(50% - 0.25rem);
                    }
                }
            </style>
        `;

        const content = `
            <div class="games-container">
                <a href="/" class="back-button">
                    ← 홈으로 돌아가기
                </a>

                <div class="header">
                    <h1>🎮 게임 목록</h1>
                    <p>모바일 센서로 즐기는 다양한 게임을 만나보세요</p>
                </div>

                <!-- 검색/정렬 바 -->
                <div class="search-filter-bar">
                    <input
                        type="text"
                        id="game-search"
                        placeholder="🔍 게임 제목 또는 ID로 검색..."
                        autocomplete="off"
                    />
                    <select id="game-sort">
                        <option value="latest">최신순</option>
                        <option value="oldest">오래된순</option>
                        <option value="popular">인기순</option>
                    </select>
                </div>

                <!-- 필터 버튼 바 -->
                <div class="filter-bar">
                    <button class="filter-btn active" data-filter="all">
                        전체<span class="count">${games.length}</span>
                    </button>
                    <button class="filter-btn" data-filter="solo">
                        Solo<span class="count">${games.filter(g => g.category === 'solo').length}</span>
                    </button>
                    <button class="filter-btn" data-filter="dual">
                        Dual<span class="count">${games.filter(g => g.category === 'dual').length}</span>
                    </button>
                    <button class="filter-btn" data-filter="multi">
                        Multi<span class="count">${games.filter(g => g.category === 'multi').length}</span>
                    </button>
                </div>

                <!-- 결과 카운트 -->
                <div class="result-count" id="result-count">
                    ${games.length}개 게임
                </div>

                <div class="games-grid" id="games-grid">
                    ${games.map(game => `
                        <a href="/games/${game.id}/"
                           class="game-card"
                           data-title="${(game.title || game.name || game.id).toLowerCase()}"
                           data-id="${game.id.toLowerCase()}"
                           data-type="${game.category || 'solo'}"
                           data-created-at="${game.created_at || new Date().toISOString()}"
                           data-play-count="${game.play_count || 0}">
                            <span class="game-icon">${game.icon || '🎮'}</span>
                            <h2 class="game-title">${game.title || game.name || game.id}</h2>
                            <div class="game-id">${game.id}</div>
                            <div class="game-type">${this.getGameTypeLabel(game.category)}</div>
                            <p class="game-description">
                                ${game.description || '센서를 이용한 재미있는 게임입니다.'}
                            </p>
                            <button class="play-button">
                                ▶ 게임 시작
                            </button>
                        </a>
                    `).join('')}
                </div>
            </div>
        `;

        const scripts = `
            console.log('🎮 게임 목록 페이지 로드 완료');
            console.log('📊 총 게임 수:', ${games.length});

            // 검색/필터/정렬 기능
            (function() {
                const searchInput = document.getElementById('game-search');
                const sortSelect = document.getElementById('game-sort');
                const filterBtns = document.querySelectorAll('.filter-btn');
                const gameCards = document.querySelectorAll('.game-card');
                const resultCount = document.getElementById('result-count');

                let currentFilter = 'all';
                let currentSearchQuery = '';

                // 결과 카운트 업데이트
                function updateResultCount() {
                    const visibleCards = Array.from(gameCards).filter(card =>
                        card.style.display !== 'none'
                    );
                    resultCount.textContent = visibleCards.length + '개 게임';
                }

                // 게임 필터링 함수
                function filterGames() {
                    const query = currentSearchQuery.toLowerCase();

                    gameCards.forEach(card => {
                        const title = card.dataset.title;
                        const id = card.dataset.id;
                        const type = card.dataset.type;

                        // 검색어 매칭 (제목 또는 ID)
                        const matchesSearch = query === '' ||
                            title.includes(query) ||
                            id.includes(query);

                        // 타입 필터 매칭
                        const matchesFilter = currentFilter === 'all' ||
                            type === currentFilter;

                        // 표시/숨김
                        if (matchesSearch && matchesFilter) {
                            card.style.display = 'block';
                        } else {
                            card.style.display = 'none';
                        }
                    });

                    updateResultCount();
                }

                // 게임 정렬 함수
                function sortGames(sortBy) {
                    const grid = document.getElementById('games-grid');
                    const cardsArray = Array.from(gameCards);

                    cardsArray.sort((a, b) => {
                        if (sortBy === 'latest') {
                            return new Date(b.dataset.createdAt) -
                                   new Date(a.dataset.createdAt);
                        } else if (sortBy === 'oldest') {
                            return new Date(a.dataset.createdAt) -
                                   new Date(b.dataset.createdAt);
                        } else if (sortBy === 'popular') {
                            return parseInt(b.dataset.playCount) -
                                   parseInt(a.dataset.playCount);
                        }
                        return 0;
                    });

                    // 정렬된 순서대로 DOM에 다시 추가
                    cardsArray.forEach(card => grid.appendChild(card));

                    console.log('✅ 정렬 완료:', sortBy);
                }

                // 검색 입력 이벤트 (실시간)
                searchInput.addEventListener('input', function(e) {
                    currentSearchQuery = e.target.value;
                    filterGames();
                });

                // 필터 버튼 클릭 이벤트
                filterBtns.forEach(btn => {
                    btn.addEventListener('click', function() {
                        // 활성 버튼 전환
                        filterBtns.forEach(b => b.classList.remove('active'));
                        this.classList.add('active');

                        // 현재 필터 업데이트
                        currentFilter = this.dataset.filter;
                        filterGames();

                        console.log('🔍 필터 변경:', currentFilter);
                    });
                });

                // 정렬 선택 이벤트
                sortSelect.addEventListener('change', function() {
                    sortGames(this.value);
                });

                console.log('✅ 검색/필터/정렬 기능 초기화 완료');
            })();
        `;

        return this.getBaseTemplate(title, content + styles, scripts);
    }

    /**
     * 게임 타입 라벨 반환
     */
    getGameTypeLabel(type) {
        const labels = {
            'solo': '솔로 게임 (1인)',
            'dual': '듀얼 게임 (2인)',
            'multi': '멀티 게임 (다인)',
            'cooperative': '협동 게임',
            'competitive': '경쟁 게임'
        };
        return labels[type] || type || '일반 게임';
    }

    /**
     * 게임 관리 대시보드 페이지 생성
     */
    generateGameManagerPage(options = {}) {
        const {
            title = '게임 관리 - Sensor Game Hub',
            games = []
        } = options;

        const styles = `
            <style>
                body {
                    background: linear-gradient(135deg, #0F172A 0%, #581C87 50%, #0F172A 100%);
                    min-height: 100vh;
                    margin: 0;
                    padding: 0;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    color: #F8FAFC;
                }

                .manager-container {
                    max-width: 1400px;
                    margin: 0 auto;
                    padding: 3rem 2rem;
                }

                .header {
                    text-align: center;
                    margin-bottom: 3rem;
                }

                .header h1 {
                    font-size: 2.5rem;
                    font-weight: 700;
                    margin-bottom: 0.5rem;
                    background: linear-gradient(135deg, #A78BFA, #EC4899);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }

                .header p {
                    font-size: 1.125rem;
                    color: #94A3B8;
                }

                .search-bar {
                    margin-bottom: 2rem;
                    display: flex;
                    gap: 1rem;
                    flex-wrap: wrap;
                }

                .search-bar input {
                    flex: 1;
                    min-width: 250px;
                    padding: 0.75rem 1rem;
                    border-radius: 8px;
                    border: 1px solid rgba(100, 116, 139, 0.3);
                    background: rgba(30, 41, 59, 0.6);
                    color: #F8FAFC;
                    font-size: 1rem;
                }

                .games-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
                    gap: 1.5rem;
                }

                .game-card {
                    background: rgba(30, 41, 59, 0.6);
                    border: 1px solid rgba(100, 116, 139, 0.3);
                    border-radius: 16px;
                    padding: 1.5rem;
                    transition: all 0.3s;
                }

                .game-card:hover {
                    border-color: rgba(139, 92, 246, 0.5);
                    transform: translateY(-4px);
                    box-shadow: 0 10px 30px rgba(139, 92, 246, 0.2);
                }

                .game-card-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: start;
                    margin-bottom: 1rem;
                }

                .game-title {
                    font-size: 1.25rem;
                    font-weight: 600;
                    color: #E2E8F0;
                    margin-bottom: 0.25rem;
                }

                .game-id {
                    font-size: 0.875rem;
                    color: #94A3B8;
                }

                .game-badge {
                    padding: 0.25rem 0.75rem;
                    border-radius: 12px;
                    font-size: 0.75rem;
                    font-weight: 600;
                }

                .badge-success {
                    background: rgba(16, 185, 129, 0.2);
                    color: #10B981;
                    border: 1px solid #10B981;
                }

                .game-actions {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 0.5rem;
                    margin-top: 1rem;
                }

                .btn {
                    padding: 0.5rem 1rem;
                    border-radius: 8px;
                    border: none;
                    font-size: 0.875rem;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.2s;
                    text-align: center;
                    text-decoration: none;
                    display: inline-block;
                }

                .btn-primary {
                    background: linear-gradient(135deg, #8B5CF6, #7C3AED);
                    color: white;
                }

                .btn-secondary {
                    background: rgba(71, 85, 105, 0.5);
                    color: #E2E8F0;
                    border: 1px solid rgba(100, 116, 139, 0.5);
                }

                .btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
                }

                /* 모달 스타일 */
                .modal {
                    display: none;
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.7);
                    backdrop-filter: blur(4px);
                    z-index: 1000;
                    align-items: center;
                    justify-content: center;
                }

                .modal.active {
                    display: flex;
                }

                .modal-content {
                    background: rgba(30, 41, 59, 0.95);
                    border: 1px solid rgba(139, 92, 246, 0.5);
                    border-radius: 16px;
                    padding: 2rem;
                    max-width: 500px;
                    width: 90%;
                    animation: slideUp 0.3s ease-out;
                }

                @keyframes slideUp {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                .modal-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 1.5rem;
                }

                .modal-title {
                    font-size: 1.5rem;
                    font-weight: 600;
                    color: #E2E8F0;
                }

                .modal-close {
                    background: none;
                    border: none;
                    font-size: 1.5rem;
                    color: #94A3B8;
                    cursor: pointer;
                }

                textarea {
                    width: 100%;
                    min-height: 120px;
                    padding: 0.75rem;
                    border-radius: 8px;
                    border: 1px solid rgba(100, 116, 139, 0.3);
                    background: rgba(15, 23, 42, 0.6);
                    color: #F8FAFC;
                    font-family: inherit;
                    font-size: 0.95rem;
                    resize: vertical;
                    margin-bottom: 1rem;
                }

                .loading {
                    display: none;
                    text-align: center;
                    color: #8B5CF6;
                    margin-top: 1rem;
                }

                .loading.active {
                    display: block;
                }

                @media (max-width: 768px) {
                    .games-grid {
                        grid-template-columns: 1fr;
                    }
                }
            </style>
        `;

        const gamesHTML = games.map(game => `
            <div class="game-card" data-game-id="${game.id || game.path}">
                <div class="game-card-header">
                    <div>
                        <div class="game-title">${game.title || game.id}</div>
                        <div class="game-id">${game.id || game.path}</div>
                    </div>
                    <span class="game-badge badge-success game-version" data-game="${game.id || game.path}">v1.0</span>
                </div>
                <div class="game-actions">
                    <button class="btn btn-primary" onclick="playGame('${game.id || game.path}')">▶️ 플레이</button>
                    <button class="btn btn-secondary" onclick="openBugModal('${game.id || game.path}')">🐛 버그 신고</button>
                    <button class="btn btn-secondary" onclick="openFeatureModal('${game.id || game.path}')">✨ 기능 추가</button>
                    <button class="btn btn-secondary" onclick="viewHistory('${game.id || game.path}')">📜 이력</button>
                </div>
            </div>
        `).join('');

        const content = `
            <div class="manager-container">
                <div class="header">
                    <h1>🛠️ ${title}</h1>
                    <p>생성된 게임을 관리하고 개선하세요</p>
                </div>

                <div class="search-bar">
                    <input type="text" id="searchInput" placeholder="🔍 게임 검색 (제목 또는 ID)..." onkeyup="filterGames()">
                </div>

                <div class="games-grid" id="gamesGrid">
                    ${gamesHTML || '<p style="text-align: center; color: #94A3B8;">생성된 게임이 없습니다.</p>'}
                </div>
            </div>

            <!-- 버그 리포트 모달 -->
            <div id="bugModal" class="modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3 class="modal-title">🐛 버그 신고</h3>
                        <button class="modal-close" onclick="closeBugModal()">×</button>
                    </div>
                    <textarea id="bugDescription" placeholder="버그 설명을 입력하세요...&#10;예: 공이 패들에 붙어서 떨어지지 않습니다."></textarea>
                    <textarea id="bugContext" placeholder="재현 방법 (선택사항)...&#10;예: 센서 연결 후 게임 시작 시 발생"></textarea>
                    <button class="btn btn-primary" onclick="submitBugReport()" style="width: 100%;">제출</button>
                    <div class="loading" id="bugLoading">처리 중...</div>
                </div>
            </div>

            <!-- 기능 추가 모달 -->
            <div id="featureModal" class="modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3 class="modal-title">✨ 기능 추가</h3>
                        <button class="modal-close" onclick="closeFeatureModal()">×</button>
                    </div>
                    <textarea id="featureDescription" placeholder="추가할 기능을 설명하세요...&#10;예: 60초 타이머를 추가해주세요"></textarea>
                    <textarea id="featureContext" placeholder="추가 요구사항 (선택사항)..."></textarea>
                    <button class="btn btn-primary" onclick="submitFeatureRequest()" style="width: 100%;">제출</button>
                    <div class="loading" id="featureLoading">처리 중...</div>
                </div>
            </div>
        `;

        const scripts = `
            let currentGameId = null;

            function playGame(gameId) {
                window.open('/games/' + gameId, '_blank');
            }

            function openBugModal(gameId) {
                currentGameId = gameId;
                document.getElementById('bugModal').classList.add('active');
            }

            function closeBugModal() {
                document.getElementById('bugModal').classList.remove('active');
                document.getElementById('bugDescription').value = '';
                document.getElementById('bugContext').value = '';
            }

            function openFeatureModal(gameId) {
                currentGameId = gameId;
                document.getElementById('featureModal').classList.add('active');
            }

            function closeFeatureModal() {
                document.getElementById('featureModal').classList.remove('active');
                document.getElementById('featureDescription').value = '';
                document.getElementById('featureContext').value = '';
            }

            async function submitBugReport() {
                const description = document.getElementById('bugDescription').value;
                const context = document.getElementById('bugContext').value;

                if (!description.trim()) {
                    alert('버그 설명을 입력해주세요.');
                    return;
                }

                document.getElementById('bugLoading').classList.add('active');

                try {
                    const response = await fetch('/api/maintenance/report-bug', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            gameId: currentGameId,
                            bugDescription: description,
                            userContext: context
                        })
                    });

                    const result = await response.json();

                    if (result.success) {
                        alert('✅ 버그가 수정되었습니다!\\n버전: ' + result.version);
                        closeBugModal();
                        location.reload();
                    } else {
                        alert('❌ 오류: ' + result.message);
                    }
                } catch (error) {
                    alert('❌ 요청 실패: ' + error.message);
                } finally {
                    document.getElementById('bugLoading').classList.remove('active');
                }
            }

            async function submitFeatureRequest() {
                const description = document.getElementById('featureDescription').value;
                const context = document.getElementById('featureContext').value;

                if (!description.trim()) {
                    alert('기능 설명을 입력해주세요.');
                    return;
                }

                document.getElementById('featureLoading').classList.add('active');

                try {
                    const response = await fetch('/api/maintenance/add-feature', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            gameId: currentGameId,
                            featureDescription: description,
                            userContext: context
                        })
                    });

                    const result = await response.json();

                    if (result.success) {
                        alert('✅ 기능이 추가되었습니다!\\n버전: ' + result.version);
                        closeFeatureModal();
                        location.reload();
                    } else {
                        alert('❌ 오류: ' + result.message);
                    }
                } catch (error) {
                    alert('❌ 요청 실패: ' + error.message);
                } finally {
                    document.getElementById('featureLoading').classList.remove('active');
                }
            }

            async function viewHistory(gameId) {
                try {
                    const response = await fetch('/api/maintenance/history/' + gameId);
                    const result = await response.json();

                    if (result.success && result.history.length > 0) {
                        const historyText = result.history.map(h =>
                            h.type + '\\n' + h.description + '\\n버전: ' + h.version + '\\n시간: ' + new Date(h.timestamp).toLocaleString()
                        ).join('\\n\\n---\\n\\n');
                        alert('📜 수정 이력:\\n\\n' + historyText);
                    } else {
                        alert('수정 이력이 없습니다.');
                    }
                } catch (error) {
                    alert('이력 조회 실패: ' + error.message);
                }
            }

            function filterGames() {
                const searchTerm = document.getElementById('searchInput').value.toLowerCase();
                const cards = document.querySelectorAll('.game-card');

                cards.forEach(card => {
                    const title = card.querySelector('.game-title').textContent.toLowerCase();
                    const id = card.querySelector('.game-id').textContent.toLowerCase();

                    if (title.includes(searchTerm) || id.includes(searchTerm)) {
                        card.style.display = 'block';
                    } else {
                        card.style.display = 'none';
                    }
                });
            }

            // ESC 키로 모달 닫기
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    closeBugModal();
                    closeFeatureModal();
                }
            });

            // 페이지 로드 시 실시간 버전 업데이트
            async function loadGameVersions() {
                const versionBadges = document.querySelectorAll('.game-version');
                for (const badge of versionBadges) {
                    const gameId = badge.getAttribute('data-game');
                    try {
                        const response = await fetch('/api/maintenance/version/' + gameId);
                        const result = await response.json();
                        if (result.success && result.version) {
                            badge.textContent = 'v' + result.version;
                        }
                    } catch (e) {
                        // 기본값 v1.0 유지
                    }
                }
            }

            // 페이지 로드 시 버전 업데이트 실행
            window.addEventListener('DOMContentLoaded', loadGameVersions);

            console.log('🛠️ Game Manager loaded. Total games: ${games.length}');
        `;

        return this.getBaseTemplate(title, content + styles, scripts);
    }

    /**
     * 계정 관리 페이지 생성
     */
    generateAccountManagementPage(options = {}) {
        const { title = '계정 관리 - Sensor Game Hub' } = options;

        const styles = `
            <style>
                body {
                    background: linear-gradient(135deg, #0F172A 0%, #581C87 50%, #0F172A 100%);
                    min-height: 100vh;
                    margin: 0;
                    padding: 0;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    color: #F8FAFC;
                }

                .account-page-container {
                    max-width: 800px;
                    margin: 0 auto;
                    padding: 3rem 2rem;
                }

                .page-header {
                    text-align: center;
                    margin-bottom: 3rem;
                }

                .page-header h1 {
                    font-size: 2.5rem;
                    font-weight: 700;
                    margin-bottom: 0.5rem;
                    background: linear-gradient(135deg, #6366F1, #EC4899);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }

                .page-header p {
                    font-size: 1.125rem;
                    color: #94A3B8;
                }

                .back-button {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.75rem 1.5rem;
                    background: rgba(100, 116, 139, 0.2);
                    border: 1px solid rgba(100, 116, 139, 0.3);
                    border-radius: 8px;
                    color: #E2E8F0;
                    text-decoration: none;
                    transition: all 0.2s;
                    margin-bottom: 2rem;
                }

                .back-button:hover {
                    background: rgba(100, 116, 139, 0.3);
                    border-color: rgba(100, 116, 139, 0.5);
                }

                .account-section {
                    background: rgba(30, 41, 59, 0.6);
                    border: 1px solid rgba(100, 116, 139, 0.3);
                    border-radius: 16px;
                    padding: 2rem;
                    margin-bottom: 1.5rem;
                }

                .account-section h3 {
                    font-size: 1.25rem;
                    font-weight: 600;
                    color: #E2E8F0;
                    margin-bottom: 1.5rem;
                    border-bottom: 1px solid rgba(100, 116, 139, 0.3);
                    padding-bottom: 0.75rem;
                }

                .form-group {
                    margin-bottom: 1rem;
                }

                .form-group label {
                    display: block;
                    color: #94A3B8;
                    font-size: 0.875rem;
                    margin-bottom: 0.5rem;
                }

                .form-group input {
                    width: 100%;
                    padding: 0.75rem 1rem;
                    background: rgba(15, 23, 42, 0.6);
                    border: 1px solid rgba(100, 116, 139, 0.3);
                    border-radius: 8px;
                    color: #F8FAFC;
                    font-size: 1rem;
                    box-sizing: border-box;
                }

                .form-group input:focus {
                    outline: none;
                    border-color: #8B5CF6;
                }

                .info-display {
                    padding: 0.75rem 1rem;
                    background: rgba(15, 23, 42, 0.6);
                    border: 1px solid rgba(100, 116, 139, 0.3);
                    border-radius: 8px;
                    color: #E2E8F0;
                }

                .submit-button {
                    width: 100%;
                    padding: 0.75rem 1.5rem;
                    background: linear-gradient(135deg, #8B5CF6, #7C3AED);
                    color: white;
                    border: none;
                    border-radius: 8px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .submit-button:hover {
                    transform: translateY(-1px);
                    box-shadow: 0 4px 12px rgba(139, 92, 246, 0.4);
                }

                .message {
                    margin-top: 1rem;
                    text-align: center;
                    display: none;
                }

                .message.success {
                    color: #10B981;
                }

                .message.error {
                    color: #EF4444;
                }

                .message.info {
                    color: #8B5CF6;
                }
            </style>
        `;

        const content = `
            <div class="account-page-container">
                <a href="/" class="back-button">
                    ← 홈으로 돌아가기
                </a>

                <div class="page-header">
                    <h1>👤 계정 관리</h1>
                    <p>사용자 정보를 관리하고 수정하세요</p>
                </div>

                <div id="account-loading" style="text-align: center; color: #94A3B8; padding: 2rem;">
                    사용자 정보를 불러오는 중...
                </div>

                <div id="account-content" style="display: none;">
                    <!-- 기본 정보 -->
                    <div class="account-section">
                        <h3>📋 기본 정보</h3>

                        <div class="form-group">
                            <label>사용자 이름</label>
                            <div id="account-name" class="info-display">-</div>
                        </div>

                        <div class="form-group">
                            <label>닉네임</label>
                            <div id="account-nickname" class="info-display">-</div>
                        </div>

                        <div class="form-group">
                            <label>이메일</label>
                            <div id="account-email" class="info-display">-</div>
                        </div>

                        <div class="form-group">
                            <label>비밀번호</label>
                            <div class="info-display">••••••••</div>
                        </div>
                    </div>

                    <!-- 닉네임 변경 -->
                    <div class="account-section">
                        <h3>✏️ 닉네임 변경</h3>

                        <div class="form-group">
                            <label>새 닉네임</label>
                            <input
                                type="text"
                                id="new-nickname-input"
                                placeholder="새 닉네임을 입력하세요"
                            >
                        </div>

                        <div class="form-group">
                            <label>현재 비밀번호</label>
                            <input
                                type="password"
                                id="nickname-password-input"
                                placeholder="비밀번호를 입력하세요"
                            >
                        </div>

                        <button onclick="changeNickname()" class="submit-button">
                            닉네임 변경
                        </button>
                        <div id="nickname-change-message" class="message"></div>
                    </div>

                    <!-- 비밀번호 변경 -->
                    <div class="account-section">
                        <h3>🔒 비밀번호 변경</h3>

                        <div class="form-group">
                            <label>현재 비밀번호</label>
                            <input
                                type="password"
                                id="current-password-input"
                                placeholder="현재 비밀번호를 입력하세요"
                            >
                        </div>

                        <div class="form-group">
                            <label>새 비밀번호</label>
                            <input
                                type="password"
                                id="new-password-input"
                                placeholder="새 비밀번호를 입력하세요"
                            >
                        </div>

                        <div class="form-group">
                            <label>새 비밀번호 확인</label>
                            <input
                                type="password"
                                id="confirm-password-input"
                                placeholder="새 비밀번호를 다시 입력하세요"
                            >
                        </div>

                        <button onclick="changePassword()" class="submit-button">
                            비밀번호 변경
                        </button>
                        <div id="password-change-message" class="message"></div>
                    </div>
                </div>

                <div id="account-error" style="display: none; text-align: center; color: #EF4444; padding: 2rem;">
                    사용자 정보를 불러올 수 없습니다. 로그인이 필요합니다.
                </div>
            </div>
        `;

        const scripts = `
                // 인증 토큰 관리
                let authToken = localStorage.getItem('authToken');

                // 페이지 로드 시 인증 확인 및 사용자 정보 로드
                window.addEventListener('DOMContentLoaded', () => {
                    console.log('🔐 계정 관리 페이지 로드');
                    console.log('📌 토큰 확인:', authToken ? '있음' : '없음');

                    // 토큰이 없으면 로그인 필요 메시지 표시
                    if (!authToken) {
                        console.log('❌ 토큰 없음 - 로그인 필요');
                        document.getElementById('account-loading').style.display = 'none';
                        document.getElementById('account-error').style.display = 'block';
                        document.getElementById('account-error').innerHTML =
                            '사용자 정보를 불러올 수 없습니다. 로그인이 필요합니다.<br><br>' +
                            '<a href="/" style="color: #8B5CF6; text-decoration: underline;">홈으로 돌아가기</a>';
                        return;
                    }

                    loadAccountInfo();
                });

                // 사용자 정보 로드
                async function loadAccountInfo() {
                    try {
                        console.log('📡 계정 정보 로딩 시작...');
                        document.getElementById('account-loading').style.display = 'block';
                        document.getElementById('account-content').style.display = 'none';
                        document.getElementById('account-error').style.display = 'none';

                        const response = await fetch('/developer/api/account/info', {
                            headers: {
                                'Authorization': 'Bearer ' + authToken
                            }
                        });

                        console.log('📡 API 응답 상태:', response.status);

                        if (!response.ok) {
                            if (response.status === 401) {
                                // 토큰이 만료되었거나 유효하지 않음
                                console.log('❌ 인증 실패 - 토큰 만료 또는 유효하지 않음');
                                localStorage.removeItem('authToken');
                                authToken = null;
                                throw new Error('로그인이 만료되었습니다. 다시 로그인해주세요.');
                            }
                            throw new Error('Failed to load account info');
                        }

                        const data = await response.json();
                        console.log('✅ 계정 정보 로드 성공:', data);

                        if (data.success) {
                            document.getElementById('account-name').textContent = data.user.name || '-';
                            document.getElementById('account-nickname').textContent = data.user.nickname || '-';
                            document.getElementById('account-email').textContent = data.user.email || '-';

                            document.getElementById('account-loading').style.display = 'none';
                            document.getElementById('account-content').style.display = 'block';
                        } else {
                            throw new Error(data.error || 'Failed to load account info');
                        }
                    } catch (error) {
                        console.error('❌ 계정 정보 로드 실패:', error);
                        document.getElementById('account-loading').style.display = 'none';
                        document.getElementById('account-error').style.display = 'block';
                        document.getElementById('account-error').innerHTML =
                            error.message + '<br><br>' +
                            '<a href="/" style="color: #8B5CF6; text-decoration: underline;">홈으로 돌아가기</a>';
                    }
                }

                // 닉네임 변경
                async function changeNickname() {
                    const newNickname = document.getElementById('new-nickname-input').value.trim();
                    const password = document.getElementById('nickname-password-input').value;
                    const messageDiv = document.getElementById('nickname-change-message');

                    if (!newNickname) {
                        messageDiv.style.display = 'block';
                        messageDiv.className = 'message error';
                        messageDiv.textContent = '새 닉네임을 입력하세요.';
                        return;
                    }

                    if (!password) {
                        messageDiv.style.display = 'block';
                        messageDiv.className = 'message error';
                        messageDiv.textContent = '비밀번호를 입력하세요.';
                        return;
                    }

                    try {
                        messageDiv.style.display = 'block';
                        messageDiv.className = 'message info';
                        messageDiv.textContent = '처리 중...';

                        const response = await fetch('/developer/api/account/change-nickname', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': 'Bearer ' + authToken
                            },
                            body: JSON.stringify({
                                newNickname: newNickname,
                                password: password
                            })
                        });

                        const data = await response.json();

                        if (data.success) {
                            messageDiv.className = 'message success';
                            messageDiv.textContent = '✅ 닉네임이 성공적으로 변경되었습니다.';
                            document.getElementById('account-nickname').textContent = newNickname;
                            document.getElementById('new-nickname-input').value = '';
                            document.getElementById('nickname-password-input').value = '';
                        } else {
                            messageDiv.className = 'message error';
                            messageDiv.textContent = '❌ ' + (data.error || '닉네임 변경에 실패했습니다.');
                        }
                    } catch (error) {
                        console.error('닉네임 변경 실패:', error);
                        messageDiv.style.display = 'block';
                        messageDiv.className = 'message error';
                        messageDiv.textContent = '❌ 닉네임 변경 중 오류가 발생했습니다.';
                    }
                }

                // 비밀번호 변경
                async function changePassword() {
                    const currentPassword = document.getElementById('current-password-input').value;
                    const newPassword = document.getElementById('new-password-input').value;
                    const confirmPassword = document.getElementById('confirm-password-input').value;
                    const messageDiv = document.getElementById('password-change-message');

                    if (!currentPassword) {
                        messageDiv.style.display = 'block';
                        messageDiv.className = 'message error';
                        messageDiv.textContent = '현재 비밀번호를 입력하세요.';
                        return;
                    }

                    if (!newPassword) {
                        messageDiv.style.display = 'block';
                        messageDiv.className = 'message error';
                        messageDiv.textContent = '새 비밀번호를 입력하세요.';
                        return;
                    }

                    if (newPassword !== confirmPassword) {
                        messageDiv.style.display = 'block';
                        messageDiv.className = 'message error';
                        messageDiv.textContent = '새 비밀번호가 일치하지 않습니다.';
                        return;
                    }

                    if (newPassword.length < 6) {
                        messageDiv.style.display = 'block';
                        messageDiv.className = 'message error';
                        messageDiv.textContent = '비밀번호는 최소 6자 이상이어야 합니다.';
                        return;
                    }

                    try {
                        messageDiv.style.display = 'block';
                        messageDiv.className = 'message info';
                        messageDiv.textContent = '처리 중...';

                        const response = await fetch('/developer/api/account/change-password', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': 'Bearer ' + authToken
                            },
                            body: JSON.stringify({
                                currentPassword: currentPassword,
                                newPassword: newPassword
                            })
                        });

                        const data = await response.json();

                        if (data.success) {
                            // 새 세션 토큰이 있으면 localStorage에 저장
                            if (data.session && data.session.access_token) {
                                console.log('🔐 새 토큰 저장 중...');
                                localStorage.setItem('authToken', data.session.access_token);
                                authToken = data.session.access_token; // 전역 변수도 업데이트
                                console.log('✅ 새 토큰 저장 완료');
                            }

                            // 재로그인 필요한 경우
                            if (data.requireRelogin) {
                                messageDiv.className = 'message success';
                                messageDiv.textContent = '✅ 비밀번호가 변경되었습니다. 다시 로그인해주세요.';
                                document.getElementById('current-password-input').value = '';
                                document.getElementById('new-password-input').value = '';
                                document.getElementById('confirm-password-input').value = '';

                                // 3초 후 홈으로 이동
                                setTimeout(() => {
                                    localStorage.removeItem('authToken');
                                    window.location.href = '/';
                                }, 3000);
                            } else {
                                messageDiv.className = 'message success';
                                messageDiv.textContent = '✅ 비밀번호가 성공적으로 변경되었습니다.';
                                document.getElementById('current-password-input').value = '';
                                document.getElementById('new-password-input').value = '';
                                document.getElementById('confirm-password-input').value = '';
                            }
                        } else {
                            messageDiv.className = 'message error';
                            messageDiv.textContent = '❌ ' + (data.error || '비밀번호 변경에 실패했습니다.');
                        }
                    } catch (error) {
                        console.error('비밀번호 변경 실패:', error);
                        messageDiv.style.display = 'block';
                        messageDiv.className = 'message error';
                        messageDiv.textContent = '❌ 비밀번호 변경 중 오류가 발생했습니다.';
                    }
                }
        `;

        return this.getBaseTemplate(title, content + styles, scripts);
    }
}

module.exports = HtmlGenerator;