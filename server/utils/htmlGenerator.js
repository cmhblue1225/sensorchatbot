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
}

module.exports = HtmlGenerator;