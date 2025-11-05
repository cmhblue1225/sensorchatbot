/**
 * 📄 MarkdownRenderer v1.0
 *
 * Markdown → HTML 렌더러
 * - marked 라이브러리 사용
 * - highlight.js로 코드 신택스 하이라이팅
 * - 안전한 HTML 렌더링
 */

const { marked } = require('marked');
const hljs = require('highlight.js');

class MarkdownRenderer {
    constructor() {
        // marked 설정
        marked.setOptions({
            highlight: function(code, lang) {
                if (lang && hljs.getLanguage(lang)) {
                    try {
                        return hljs.highlight(code, { language: lang }).value;
                    } catch (err) {
                        console.error('하이라이트 오류:', err);
                    }
                }
                return hljs.highlightAuto(code).value;
            },
            langPrefix: 'hljs language-',
            breaks: true,
            gfm: true,
            headerIds: true  // 헤더 ID 자동 생성 활성화
        });

        // 커스텀 렌더러 설정 (헤더에 ID 추가)
        const renderer = new marked.Renderer();

        renderer.heading = function({text, depth}) {
            // 헤더 텍스트에서 HTML 태그 제거하여 ID 생성
            const plainText = text.replace(/<[^>]*>/g, '');

            // 헤더 텍스트를 ID로 변환 (한글 지원)
            const id = plainText
                .toLowerCase()
                .trim()
                .replace(/[^\w\uAC00-\uD7AF\s]+/g, '')  // 한글, 영문, 숫자, 공백만 허용
                .replace(/\s+/g, '-')  // 공백을 하이픈으로
                .replace(/^-+|-+$/g, '');  // 앞뒤 하이픈 제거

            return `<h${depth} id="${id}">${text}</h${depth}>\n`;
        };

        marked.setOptions({ renderer });

        console.log('📄 MarkdownRenderer 초기화 완료');
    }

    /**
     * 마크다운을 HTML로 변환
     */
    render(markdown) {
        try {
            return marked.parse(markdown);
        } catch (error) {
            console.error('마크다운 렌더링 오류:', error);
            return `<p class="error">마크다운 렌더링 중 오류가 발생했습니다.</p>`;
        }
    }

    /**
     * 완전한 HTML 페이지 생성 (스타일 포함)
     */
    renderFullPage(markdown, title = '문서') {
        const htmlContent = this.render(markdown);

        return `
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} - Sensor Game Hub</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/atom-one-dark.min.css">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #E2E8F0;
            background: linear-gradient(135deg, #0F172A 0%, #1E293B 100%);
            min-height: 100vh;
            padding: 2rem;
        }

        .markdown-body {
            max-width: 900px;
            margin: 0 auto;
            background: rgba(30, 41, 59, 0.6);
            backdrop-filter: blur(10px);
            padding: 3rem;
            border-radius: 1rem;
            border: 1px solid rgba(100, 116, 139, 0.3);
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        }

        .markdown-body h1 {
            font-size: 2.5rem;
            font-weight: 700;
            margin-bottom: 1.5rem;
            padding-bottom: 1rem;
            border-bottom: 2px solid #6366F1;
            background: linear-gradient(135deg, #6366F1, #A855F7);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }

        .markdown-body h2 {
            font-size: 2rem;
            font-weight: 600;
            margin-top: 2.5rem;
            margin-bottom: 1rem;
            color: #A855F7;
        }

        .markdown-body h3 {
            font-size: 1.5rem;
            font-weight: 600;
            margin-top: 2rem;
            margin-bottom: 0.75rem;
            color: #EC4899;
        }

        .markdown-body h4 {
            font-size: 1.25rem;
            font-weight: 600;
            margin-top: 1.5rem;
            margin-bottom: 0.5rem;
            color: #06B6D4;
        }

        .markdown-body p {
            margin-bottom: 1rem;
            color: #CBD5E1;
        }

        .markdown-body ul, .markdown-body ol {
            margin-bottom: 1rem;
            margin-left: 2rem;
            color: #CBD5E1;
        }

        .markdown-body li {
            margin-bottom: 0.5rem;
        }

        .markdown-body code {
            background: rgba(99, 102, 241, 0.2);
            padding: 0.2rem 0.4rem;
            border-radius: 0.25rem;
            font-family: 'Monaco', 'Menlo', monospace;
            font-size: 0.9em;
            color: #A5B4FC;
        }

        .markdown-body pre {
            background: #1E293B;
            padding: 1.5rem;
            border-radius: 0.5rem;
            overflow-x: auto;
            margin-bottom: 1.5rem;
            border: 1px solid rgba(100, 116, 139, 0.3);
        }

        .markdown-body pre code {
            background: none;
            padding: 0;
            color: inherit;
            font-size: 0.875rem;
            line-height: 1.7;
        }

        .markdown-body blockquote {
            border-left: 4px solid #6366F1;
            padding-left: 1.5rem;
            margin: 1.5rem 0;
            color: #94A3B8;
            font-style: italic;
        }

        .markdown-body table {
            width: 100%;
            border-collapse: collapse;
            margin: 1.5rem 0;
        }

        .markdown-body th, .markdown-body td {
            padding: 0.75rem;
            border: 1px solid rgba(100, 116, 139, 0.3);
            text-align: left;
        }

        .markdown-body th {
            background: rgba(99, 102, 241, 0.2);
            font-weight: 600;
            color: #E2E8F0;
        }

        .markdown-body td {
            color: #CBD5E1;
        }

        .markdown-body a {
            color: #6366F1;
            text-decoration: none;
            border-bottom: 1px solid transparent;
            transition: all 0.2s;
        }

        .markdown-body a:hover {
            color: #A855F7;
            border-bottom-color: #A855F7;
        }

        .markdown-body img {
            max-width: 100%;
            height: auto;
            border-radius: 0.5rem;
            margin: 1.5rem 0;
        }

        .markdown-body hr {
            border: none;
            border-top: 2px solid rgba(100, 116, 139, 0.3);
            margin: 2rem 0;
        }

        .error {
            color: #EF4444;
            background: rgba(239, 68, 68, 0.1);
            padding: 1rem;
            border-radius: 0.5rem;
            border-left: 4px solid #EF4444;
        }

        @media (max-width: 768px) {
            body {
                padding: 1rem;
            }

            .markdown-body {
                padding: 1.5rem;
            }

            .markdown-body h1 {
                font-size: 2rem;
            }

            .markdown-body h2 {
                font-size: 1.5rem;
            }

            .markdown-body h3 {
                font-size: 1.25rem;
            }
        }
    </style>
</head>
<body>
    <div class="markdown-body">
        ${htmlContent}
    </div>
</body>
</html>
        `;
    }
}

module.exports = MarkdownRenderer;
