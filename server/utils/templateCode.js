// 안전한 JavaScript 함수 코드
const templateCode = `
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

module.exports = templateCode;