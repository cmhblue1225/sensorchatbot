/**
 * 🔍 GameValidator v1.0
 * 
 * AI가 생성한 게임의 완성도와 작동 가능성을 자동 검증
 * - HTML 구조 검증
 * - JavaScript 문법 검증  
 * - SessionSDK 통합 패턴 검증
 * - 필수 요소 존재 여부 검증
 */

const fs = require('fs').promises;
const path = require('path');
const { JSDOM } = require('jsdom');

class GameValidator {
    constructor() {
        this.genreSpecificRules = {
            'physics': {
                requiredPatterns: [
                    /gravity/i,
                    /friction/i,
                    /velocity|vx.*vy|speed/i,
                    /collision|bounce|reflect/i,
                    /Math\.(sin|cos|atan2)/,
                ],
                recommendedElements: ['physics engine', 'collision detection', 'momentum'],
                keyFeatures: ['중력 시뮬레이션', '물체 충돌', '관성 적용']
            },
            'cooking': {
                requiredPatterns: [
                    /stir|mix|shake|flip/i,
                    /recipe|ingredient|cooking/i,
                    /timer|time|duration/i,
                    /temperature|heat|cook/i,
                    /progress|quality|done/i,
                ],
                recommendedElements: ['gesture recognition', 'timer system', 'progress tracking'],
                keyFeatures: ['제스처 인식', '타이밍 시스템', '요리 진행도']
            },
            'action': {
                requiredPatterns: [
                    /combo|score|points/i,
                    /speed|fast|quick/i,
                    /enemy|obstacle|avoid/i,
                    /powerup|bonus/i,
                    /level|difficulty/i,
                ],
                recommendedElements: ['combo system', 'difficulty scaling', 'score system'],
                keyFeatures: ['콤보 시스템', '점수 경쟁', '난이도 증가']
            },
            'puzzle': {
                requiredPatterns: [
                    /solve|solution|puzzle/i,
                    /hint|help|guide/i,
                    /level|stage|challenge/i,
                    /logic|think|strategy/i,
                    /complete|finish|success/i,
                ],
                recommendedElements: ['hint system', 'level progression', 'solution validation'],
                keyFeatures: ['문제 해결', '힌트 시스템', '단계적 진행']
            },
            'racing': {
                requiredPatterns: [
                    /steering|turn|control/i,
                    /track|road|path/i,
                    /speed|acceleration|brake/i,
                    /lap|time|record/i,
                    /car|vehicle|drive/i,
                ],
                recommendedElements: ['steering control', 'speed management', 'track system'],
                keyFeatures: ['조향 제어', '속도 관리', '경주 트랙']
            }
        };

        this.validationRules = {
            // 필수 HTML 요소들
            requiredElements: [
                'canvas#game-canvas',
                '#session-panel',
                '#session-code-display', 
                '#qr-container',
                '#start-game-btn',
                '#game-overlay'
            ],
            
            // 필수 JavaScript 패턴들
            requiredPatterns: [
                /new SessionSDK\(\{/,                    // SessionSDK 초기화
                /sdk\.on\('connected'/,                  // connected 이벤트 리스너
                /sdk\.on\('session-created'/,            // session-created 이벤트 리스너
                /sdk\.on\('sensor-data'/,                // sensor-data 이벤트 리스너
                /event\.detail \|\| event/,              // CustomEvent 처리 패턴
                /createSession\(\)/,                     // 세션 생성 호출
                /QRCodeGenerator/,                       // QR 코드 생성
                /requestAnimationFrame/,                 // 애니메이션 루프
                /getContext\('2d'\)/                     // 캔버스 2D 컨텍스트
            ],
            
            // 금지된 안티패턴들
            forbiddenPatterns: [
                /sdk\.createSession\(\).*sdk\.on\('connected'/s,  // 연결 전 세션 생성 시도
                /session\.sessionCode.*undefined/,                // undefined 세션 코드 접근
                /QRCode\.toCanvas.*without.*try.*catch/           // QR 코드 에러 처리 누락
            ],
            
            // 필수 스크립트 태그들
            requiredScripts: [
                '/socket.io/socket.io.js',
                '/js/SessionSDK.js'
            ]
        };
    }

    /**
     * 게임 파일 전체 검증
     */
    async validateGame(gameId, gamePath, gameMetadata = null) {
        const results = {
            gameId,
            gamePath,
            isValid: true,
            score: 0,
            maxScore: 130, // 장르별 검증 30점 추가
            errors: [],
            warnings: [],
            suggestions: [],
            details: {},
            genreCompliance: null
        };

        try {
            console.log(`🔍 게임 검증 시작: ${gameId}`);
            
            // 게임 장르 정보 추출
            const genre = this.extractGenreInfo(gameMetadata, gameId);
            if (genre) {
                console.log(`🎯 장르별 검증 활성화: ${genre}`);
                results.genre = genre;
            }
            
            // 1. 파일 존재성 검증
            const fileValidation = await this.validateFileStructure(gamePath);
            results.details.files = fileValidation;
            results.score += fileValidation.score;
            
            if (fileValidation.errors.length > 0) {
                results.errors.push(...fileValidation.errors);
                results.isValid = false;
            }

            // 2. HTML 구조 검증
            const htmlPath = path.join(gamePath, 'index.html');
            const htmlValidation = await this.validateHTML(htmlPath);
            results.details.html = htmlValidation;
            results.score += htmlValidation.score;
            
            if (htmlValidation.errors.length > 0) {
                results.errors.push(...htmlValidation.errors);
                results.isValid = false;
            }
            results.warnings.push(...htmlValidation.warnings);

            // 2.5. 장르별 특화 검증 (메타데이터 기반)
            if (results.genre) {
                const genreValidation = await this.validateGenreSpecifics(
                    await fs.readFile(htmlPath, 'utf-8'), 
                    results.genre
                );
                results.details.genreCompliance = genreValidation;
                results.genreCompliance = genreValidation.compliance;
                results.score += genreValidation.score;
                
                console.log(`🎯 ${results.genre} 장르 검증 점수: ${genreValidation.score}/${genreValidation.maxScore}`);
                
                // 장르 특화 개선 제안을 전체 제안에 추가
                if (genreValidation.compliance.recommendations.length > 0) {
                    results.suggestions.push('=== 장르별 특화 개선 제안 ===');
                    genreValidation.compliance.recommendations.forEach(rec => {
                        results.suggestions.push(`${rec.category}:`);
                        rec.items.forEach(item => results.suggestions.push(`  - ${item}`));
                    });
                }
            }

            // 3. JavaScript 코드 검증
            const jsValidation = await this.validateJavaScript(htmlPath);
            results.details.javascript = jsValidation;
            results.score += jsValidation.score;
            
            if (jsValidation.errors.length > 0) {
                results.errors.push(...jsValidation.errors);
                results.isValid = false;
            }
            results.warnings.push(...jsValidation.warnings);
            results.suggestions.push(...jsValidation.suggestions);

            // 4. SessionSDK 통합 패턴 검증
            const sdkValidation = await this.validateSDKIntegration(htmlPath);
            results.details.sdk = sdkValidation;
            results.score += sdkValidation.score;
            
            if (sdkValidation.errors.length > 0) {
                results.errors.push(...sdkValidation.errors);
                results.isValid = false;
            }
            results.suggestions.push(...sdkValidation.suggestions);

            // 5. 성능 및 최적화 검증
            const performanceValidation = await this.validatePerformance(htmlPath);
            results.details.performance = performanceValidation;
            results.score += performanceValidation.score;
            results.suggestions.push(...performanceValidation.suggestions);

            // 최종 점수 계산
            results.score = Math.round(results.score);
            results.grade = this.calculateGrade(results.score);

            console.log(`✅ 검증 완료: ${gameId} - 점수: ${results.score}/100 (${results.grade})`);
            
            return results;

        } catch (error) {
            console.error(`❌ 게임 검증 실패: ${gameId}`, error);
            results.isValid = false;
            results.errors.push(`검증 프로세스 오류: ${error.message}`);
            return results;
        }
    }

    /**
     * 파일 구조 검증
     */
    async validateFileStructure(gamePath) {
        const result = { score: 0, maxScore: 10, errors: [], warnings: [] };

        try {
            // index.html 존재 확인
            const indexPath = path.join(gamePath, 'index.html');
            await fs.access(indexPath);
            result.score += 7;

            // game.json 존재 확인 (선택사항)
            try {
                const metadataPath = path.join(gamePath, 'game.json');
                await fs.access(metadataPath);
                result.score += 3;
                
                // JSON 유효성 검사
                const metadata = JSON.parse(await fs.readFile(metadataPath, 'utf-8'));
                if (!metadata.title || !metadata.description) {
                    result.warnings.push('game.json에 title 또는 description이 누락됨');
                }
            } catch (jsonError) {
                result.warnings.push('game.json 파일이 없거나 유효하지 않음');
            }

        } catch (error) {
            result.errors.push('index.html 파일이 존재하지 않음');
        }

        return result;
    }

    /**
     * HTML 구조 검증
     */
    async validateHTML(htmlPath) {
        const result = { score: 0, maxScore: 25, errors: [], warnings: [] };

        try {
            const htmlContent = await fs.readFile(htmlPath, 'utf-8');
            const dom = new JSDOM(htmlContent);
            const document = dom.window.document;

            // 필수 HTML 요소 존재 확인
            let foundElements = 0;
            for (const selector of this.validationRules.requiredElements) {
                const element = document.querySelector(selector);
                if (element) {
                    foundElements++;
                } else {
                    result.errors.push(`필수 요소 누락: ${selector}`);
                }
            }
            
            result.score += Math.round((foundElements / this.validationRules.requiredElements.length) * 20);

            // 필수 스크립트 태그 확인
            let foundScripts = 0;
            for (const scriptSrc of this.validationRules.requiredScripts) {
                const scriptElement = document.querySelector(`script[src="${scriptSrc}"]`);
                if (scriptElement) {
                    foundScripts++;
                } else {
                    result.errors.push(`필수 스크립트 누락: ${scriptSrc}`);
                }
            }
            
            result.score += Math.round((foundScripts / this.validationRules.requiredScripts.length) * 5);

            // 메타 태그 검증 (모바일 최적화)
            const viewport = document.querySelector('meta[name="viewport"]');
            if (!viewport || !viewport.content.includes('user-scalable=no')) {
                result.warnings.push('모바일 최적화를 위한 viewport 설정이 불완전함');
            }

            // 캔버스 크기 확인
            const canvas = document.querySelector('#game-canvas');
            if (canvas && (!canvas.width || !canvas.height)) {
                result.warnings.push('캔버스 크기가 설정되지 않음');
            }

        } catch (error) {
            result.errors.push(`HTML 파싱 오류: ${error.message}`);
        }

        return result;
    }

    /**
     * JavaScript 코드 검증
     */
    async validateJavaScript(htmlPath) {
        const result = { 
            score: 0, 
            maxScore: 35, 
            errors: [], 
            warnings: [], 
            suggestions: [] 
        };

        try {
            const htmlContent = await fs.readFile(htmlPath, 'utf-8');
            const jsCode = this.extractJavaScriptFromHTML(htmlContent);

            if (!jsCode || jsCode.trim().length === 0) {
                result.errors.push('JavaScript 코드가 없음');
                return result;
            }

            // 필수 패턴 검증
            let foundPatterns = 0;
            for (const pattern of this.validationRules.requiredPatterns) {
                if (pattern.test(jsCode)) {
                    foundPatterns++;
                } else {
                    const patternName = this.getPatternName(pattern);
                    result.errors.push(`필수 패턴 누락: ${patternName}`);
                }
            }
            
            result.score += Math.round((foundPatterns / this.validationRules.requiredPatterns.length) * 25);

            // 금지된 안티패턴 검증
            for (const antiPattern of this.validationRules.forbiddenPatterns) {
                if (antiPattern.test(jsCode)) {
                    const patternName = this.getPatternName(antiPattern);
                    result.errors.push(`금지된 패턴 발견: ${patternName}`);
                    result.score -= 5;
                }
            }

            // 문법 오류 기본 검사
            const syntaxCheck = this.basicSyntaxCheck(jsCode);
            if (syntaxCheck.errors.length > 0) {
                result.errors.push(...syntaxCheck.errors);
                result.score -= syntaxCheck.errors.length * 2;
            }
            result.warnings.push(...syntaxCheck.warnings);

            // 추가 점수 (고급 패턴)
            if (/try\s*\{[\s\S]*\}\s*catch/.test(jsCode)) {
                result.score += 3;
                result.suggestions.push('✅ 적절한 에러 처리가 구현됨');
            }

            if (/requestAnimationFrame/.test(jsCode)) {
                result.score += 2;
                result.suggestions.push('✅ 최적화된 애니메이션 루프 사용');
            }

            if (/Math\.max.*Math\.min/.test(jsCode)) {
                result.score += 2;
                result.suggestions.push('✅ 센서 데이터 범위 제한 구현됨');
            }

            // 점수 하한선 설정
            result.score = Math.max(0, result.score);

        } catch (error) {
            result.errors.push(`JavaScript 검증 오류: ${error.message}`);
        }

        return result;
    }

    /**
     * SessionSDK 통합 패턴 검증
     */
    async validateSDKIntegration(htmlPath) {
        const result = { 
            score: 0, 
            maxScore: 20, 
            errors: [], 
            suggestions: [] 
        };

        try {
            const htmlContent = await fs.readFile(htmlPath, 'utf-8');
            const jsCode = this.extractJavaScriptFromHTML(htmlContent);

            // SDK 초기화 패턴 검증
            const sdkInitPattern = /new SessionSDK\(\{[\s\S]*gameId:\s*['"`]([^'"`]+)['"`][\s\S]*gameType:\s*['"`](\w+)['"`]/;
            const sdkMatch = jsCode.match(sdkInitPattern);
            
            if (sdkMatch) {
                result.score += 5;
                result.suggestions.push(`✅ SessionSDK 초기화됨: ${sdkMatch[1]} (${sdkMatch[2]})`);
            } else {
                result.errors.push('SessionSDK 초기화 패턴이 올바르지 않음');
            }

            // 이벤트 리스너 순서 검증
            const eventListenerOrder = this.checkEventListenerOrder(jsCode);
            if (eventListenerOrder.isValid) {
                result.score += 8;
                result.suggestions.push('✅ 올바른 이벤트 리스너 순서');
            } else {
                result.errors.push(...eventListenerOrder.errors);
            }

            // CustomEvent 처리 패턴 검증
            const customEventPattern = /sdk\.on\([^,]+,\s*(?:\([^)]*\)\s*=>\s*\{|\function\s*\([^)]*\)\s*\{)[\s\S]*?(?:event\.detail\s*\|\|\s*event|const\s+\w+\s*=\s*event\.detail\s*\|\|\s*event)/;
            if (customEventPattern.test(jsCode)) {
                result.score += 5;
                result.suggestions.push('✅ CustomEvent 처리 패턴 올바름');
            } else {
                result.errors.push('CustomEvent 처리 패턴이 누락됨 (event.detail || event)');
            }

            // QR 코드 생성 및 폴백 검증
            const qrPattern = /QRCodeGenerator[\s\S]*try[\s\S]*catch[\s\S]*fallback/i;
            if (qrPattern.test(jsCode)) {
                result.score += 2;
                result.suggestions.push('✅ QR 코드 생성 폴백 처리 구현됨');
            } else {
                result.suggestions.push('⚠️ QR 코드 생성 폴백 처리 추가 권장');
            }

        } catch (error) {
            result.errors.push(`SDK 통합 검증 오류: ${error.message}`);
        }

        return result;
    }

    /**
     * 성능 및 최적화 검증
     */
    async validatePerformance(htmlPath) {
        const result = { 
            score: 0, 
            maxScore: 10, 
            suggestions: [] 
        };

        try {
            const htmlContent = await fs.readFile(htmlPath, 'utf-8');
            const jsCode = this.extractJavaScriptFromHTML(htmlContent);

            // 애니메이션 루프 최적화
            if (/requestAnimationFrame/.test(jsCode) && /deltaTime|elapsed/.test(jsCode)) {
                result.score += 3;
                result.suggestions.push('✅ 시간 기반 애니메이션 루프 사용');
            }

            // 센서 데이터 처리 최적화
            if (/if\s*\(\s*!gameState\.isRunning/.test(jsCode)) {
                result.score += 2;
                result.suggestions.push('✅ 게임 상태 기반 센서 데이터 처리');
            }

            // 캔버스 렌더링 최적화
            if (/clearRect/.test(jsCode) && /fillRect|drawImage/.test(jsCode)) {
                result.score += 2;
                result.suggestions.push('✅ 기본적인 캔버스 렌더링 구현');
            }

            // 메모리 관리
            if (/removeEventListener|cleanup|destroy/.test(jsCode)) {
                result.score += 2;
                result.suggestions.push('✅ 메모리 관리 고려됨');
            }

            // 반응형 처리
            if (/window\.addEventListener.*resize/.test(jsCode)) {
                result.score += 1;
                result.suggestions.push('✅ 반응형 화면 크기 처리');
            }

        } catch (error) {
            result.suggestions.push(`성능 검증 오류: ${error.message}`);
        }

        return result;
    }

    /**
     * HTML에서 JavaScript 추출
     */
    extractJavaScriptFromHTML(htmlContent) {
        const scriptRegex = /<script[^>]*>([\s\S]*?)<\/script>/gi;
        let jsContent = '';
        let match;

        while ((match = scriptRegex.exec(htmlContent)) !== null) {
            // 외부 스크립트 제외
            if (!match[0].includes('src=')) {
                jsContent += match[1] + '\n\n';
            }
        }

        return jsContent.trim();
    }

    /**
     * 이벤트 리스너 순서 검증
     */
    checkEventListenerOrder(jsCode) {
        const result = { isValid: true, errors: [] };

        // connected 이벤트 리스너 위치
        const connectedMatch = jsCode.match(/sdk\.on\s*\(\s*['"`]connected['"`]/);
        const createSessionMatch = jsCode.match(/createSession\s*\(\s*\)/);

        if (connectedMatch && createSessionMatch) {
            const connectedIndex = connectedMatch.index;
            const createSessionIndex = createSessionMatch.index;

            if (createSessionIndex < connectedIndex) {
                result.isValid = false;
                result.errors.push('createSession()이 connected 이벤트 리스너보다 먼저 호출됨');
            }
        }

        return result;
    }

    /**
     * 기본 문법 검사
     */
    basicSyntaxCheck(jsCode) {
        const result = { errors: [], warnings: [] };

        // 괄호 균형 검사
        const openBraces = (jsCode.match(/\{/g) || []).length;
        const closeBraces = (jsCode.match(/\}/g) || []).length;
        if (openBraces !== closeBraces) {
            result.errors.push(`중괄호 불균형: { ${openBraces}개, } ${closeBraces}개`);
        }

        // 일반적인 오타 검사
        const commonTypos = [
            { pattern: /sesion/gi, correct: 'session' },
            { pattern: /sensot/gi, correct: 'sensor' },
            { pattern: /conected/gi, correct: 'connected' },
            { pattern: /undifined/gi, correct: 'undefined' }
        ];

        commonTypos.forEach(typo => {
            if (typo.pattern.test(jsCode)) {
                result.warnings.push(`오타 가능성: "${typo.pattern.source}" -> "${typo.correct}"`);
            }
        });

        return result;
    }

    /**
     * 패턴 이름 추출
     */
    getPatternName(pattern) {
        const patternMap = {
            '/new SessionSDK\\(\\{/': 'SessionSDK 초기화',
            '/sdk\\.on\\(\'connected\'/': 'connected 이벤트 리스너',
            '/sdk\\.on\\(\'session-created\'/': 'session-created 이벤트 리스너',
            '/sdk\\.on\\(\'sensor-data\'/': 'sensor-data 이벤트 리스너',
            '/event\\.detail \\|\\| event/': 'CustomEvent 처리 패턴',
            '/createSession\\(\\)/': '세션 생성 호출',
            '/QRCodeGenerator/': 'QR 코드 생성',
            '/requestAnimationFrame/': '애니메이션 루프',
            '/getContext\\(\'2d\'\\)/': '캔버스 2D 컨텍스트'
        };

        const patternStr = pattern.toString();
        return patternMap[patternStr] || patternStr;
    }

    /**
     * 등급 계산
     */
    calculateGrade(score) {
        if (score >= 90) return 'A+';
        if (score >= 80) return 'A';
        if (score >= 70) return 'B+';
        if (score >= 60) return 'B';
        if (score >= 50) return 'C';
        return 'F';
    }

    /**
     * 게임 장르 정보 추출
     */
    extractGenreInfo(gameMetadata, gameId) {
        // 메타데이터에서 장르 정보 추출
        if (gameMetadata && gameMetadata.genre) {
            return gameMetadata.genre.toLowerCase();
        }
        
        // 게임 ID에서 장르 추론
        const genreKeywords = {
            'physics': ['physics', 'ball', 'gravity', 'bounce'],
            'cooking': ['cooking', 'cook', 'recipe', 'kitchen'],
            'action': ['action', 'fight', 'battle', 'shoot'],
            'puzzle': ['puzzle', 'maze', 'solve', 'logic'],
            'racing': ['racing', 'race', 'car', 'speed', 'drive']
        };

        for (const [genre, keywords] of Object.entries(genreKeywords)) {
            if (keywords.some(keyword => gameId.toLowerCase().includes(keyword))) {
                return genre;
            }
        }

        return null;
    }

    /**
     * 장르별 특화 검증
     */
    async validateGenreSpecifics(htmlContent, genre) {
        const results = {
            score: 0,
            maxScore: 30,
            compliance: {
                requiredPatterns: { found: 0, total: 0, details: [] },
                keyFeatures: { found: 0, total: 0, details: [] },
                recommendations: []
            }
        };

        if (!genre || !this.genreSpecificRules[genre]) {
            console.log(`⚠️ 장르별 검증 규칙이 없음: ${genre}`);
            return results;
        }

        const rules = this.genreSpecificRules[genre];
        console.log(`🎯 ${genre} 장르 특화 검증 시작`);

        // 1. 필수 패턴 검증 (20점)
        const patternResults = this.validateGenrePatterns(htmlContent, rules.requiredPatterns);
        results.compliance.requiredPatterns = patternResults;
        results.score += Math.round((patternResults.found / patternResults.total) * 20);

        // 2. 핵심 기능 검증 (10점)  
        const featureResults = this.validateKeyFeatures(htmlContent, rules.keyFeatures);
        results.compliance.keyFeatures = featureResults;
        results.score += Math.round((featureResults.found / featureResults.total) * 10);

        // 3. 개선 제안 생성
        results.compliance.recommendations = this.generateGenreRecommendations(
            rules, 
            patternResults, 
            featureResults
        );

        console.log(`✅ ${genre} 장르 검증 완료: ${results.score}/${results.maxScore}점`);
        return results;
    }

    /**
     * 장르별 패턴 검증
     */
    validateGenrePatterns(htmlContent, patterns) {
        const results = {
            found: 0,
            total: patterns.length,
            details: []
        };

        for (const pattern of patterns) {
            const matches = htmlContent.match(pattern);
            const found = matches && matches.length > 0;
            
            results.details.push({
                pattern: pattern.toString(),
                found: found,
                matches: found ? matches.length : 0,
                description: this.getPatternDescription(pattern)
            });

            if (found) {
                results.found++;
            }
        }

        return results;
    }

    /**
     * 핵심 기능 검증
     */
    validateKeyFeatures(htmlContent, keyFeatures) {
        const results = {
            found: 0,
            total: keyFeatures.length,
            details: []
        };

        for (const feature of keyFeatures) {
            // 각 핵심 기능에 대한 키워드 검색
            const keywords = this.getFeatureKeywords(feature);
            let featureFound = false;

            for (const keyword of keywords) {
                if (htmlContent.toLowerCase().includes(keyword.toLowerCase())) {
                    featureFound = true;
                    break;
                }
            }

            results.details.push({
                feature: feature,
                found: featureFound,
                keywords: keywords
            });

            if (featureFound) {
                results.found++;
            }
        }

        return results;
    }

    /**
     * 패턴 설명 생성
     */
    getPatternDescription(pattern) {
        const descriptions = {
            '/gravity/i': '중력 관련 코드',
            '/friction/i': '마찰력 구현',
            '/velocity|vx.*vy|speed/i': '속도 및 운동 벡터',
            '/collision|bounce|reflect/i': '충돌 및 반사 처리',
            '/Math\\.(sin|cos|atan2)/': '수학적 계산 (삼각함수)',
            '/stir|mix|shake|flip/i': '요리 동작 (저어주기, 섞기 등)',
            '/recipe|ingredient|cooking/i': '레시피 및 재료 시스템',
            '/timer|time|duration/i': '타이머 시스템',
            '/combo|score|points/i': '점수 및 콤보 시스템',
            '/speed|fast|quick/i': '속도 및 빠른 반응',
            '/solve|solution|puzzle/i': '문제 해결 및 퍼즐',
            '/steering|turn|control/i': '조향 및 제어 시스템'
        };

        return descriptions[pattern.toString()] || '특화 기능 패턴';
    }

    /**
     * 기능별 키워드 매핑
     */
    getFeatureKeywords(feature) {
        const keywordMap = {
            '중력 시뮬레이션': ['gravity', '중력', 'fall', 'drop'],
            '물체 충돌': ['collision', 'hit', 'bounce', '충돌', '반사'],
            '관성 적용': ['momentum', 'inertia', 'velocity', '관성', '속도'],
            '제스처 인식': ['gesture', 'shake', 'stir', '제스처', '흔들기'],
            '타이밍 시스템': ['timer', 'timing', 'duration', '타이밍', '시간'],
            '요리 진행도': ['progress', 'cooking', 'done', '진행도', '완성도'],
            '콤보 시스템': ['combo', 'chain', 'streak', '콤보', '연속'],
            '점수 경쟁': ['score', 'point', 'highscore', '점수', '경쟁'],
            '난이도 증가': ['difficulty', 'level', 'hard', '난이도', '레벨'],
            '문제 해결': ['solve', 'solution', 'puzzle', '해결', '퍼즐'],
            '힌트 시스템': ['hint', 'help', 'guide', '힌트', '도움말'],
            '단계적 진행': ['stage', 'level', 'progress', '단계', '진행'],
            '조향 제어': ['steering', 'control', 'turn', '조향', '제어'],
            '속도 관리': ['speed', 'acceleration', 'brake', '속도', '가속'],
            '경주 트랙': ['track', 'road', 'course', '트랙', '코스']
        };

        return keywordMap[feature] || [feature];
    }

    /**
     * 장르별 개선 제안 생성
     */
    generateGenreRecommendations(rules, patternResults, featureResults) {
        const recommendations = [];

        // 누락된 패턴에 대한 제안
        const missingPatterns = patternResults.details.filter(p => !p.found);
        if (missingPatterns.length > 0) {
            recommendations.push({
                category: '누락된 핵심 기능',
                items: missingPatterns.map(p => `${p.description} 구현 필요`)
            });
        }

        // 누락된 핵심 기능에 대한 제안
        const missingFeatures = featureResults.details.filter(f => !f.found);
        if (missingFeatures.length > 0) {
            recommendations.push({
                category: '추천 기능 추가',
                items: missingFeatures.map(f => `${f.feature} 기능 구현 권장`)
            });
        }

        // 장르별 추천 요소 제안
        if (rules.recommendedElements) {
            recommendations.push({
                category: '장르 특화 개선',
                items: rules.recommendedElements.map(elem => `${elem} 최적화 권장`)
            });
        }

        return recommendations;
    }

    /**
     * 검증 보고서 생성
     */
    generateReport(validationResult) {
        const { gameId, score, maxScore, grade, errors, warnings, suggestions, genre, genreCompliance } = validationResult;
        
        let report = `
🎮 게임 검증 보고서: ${gameId}
==================================

📊 총점: ${score}/${maxScore || 100} (등급: ${grade})
🎯 게임 상태: ${validationResult.isValid ? '✅ 플레이 가능' : '❌ 수정 필요'}
${genre ? `🎮 장르: ${genre.toUpperCase()}` : ''}

`;

        if (errors.length > 0) {
            report += `\n❌ 오류 (${errors.length}개):\n`;
            errors.forEach((error, index) => {
                report += `  ${index + 1}. ${error}\n`;
            });
        }

        if (warnings.length > 0) {
            report += `\n⚠️ 경고 (${warnings.length}개):\n`;
            warnings.forEach((warning, index) => {
                report += `  ${index + 1}. ${warning}\n`;
            });
        }

        if (suggestions.length > 0) {
            report += `\n💡 제안 및 개선사항 (${suggestions.length}개):\n`;
            suggestions.forEach((suggestion, index) => {
                report += `  ${index + 1}. ${suggestion}\n`;
            });
        }

        // 장르별 특화 검증 결과 추가
        if (genre && genreCompliance) {
            report += `\n🎯 ${genre.toUpperCase()} 장르 특화 검증:\n`;
            report += `==================================\n`;
            
            // 필수 패턴 검증 결과
            if (genreCompliance.requiredPatterns) {
                const { found, total, details } = genreCompliance.requiredPatterns;
                report += `\n📋 핵심 패턴 검증: ${found}/${total}개 발견\n`;
                details.forEach(detail => {
                    const icon = detail.found ? '✅' : '❌';
                    report += `  ${icon} ${detail.description}${detail.found ? ` (${detail.matches}개 발견)` : ''}\n`;
                });
            }

            // 핵심 기능 검증 결과
            if (genreCompliance.keyFeatures) {
                const { found, total, details } = genreCompliance.keyFeatures;
                report += `\n🔧 핵심 기능 검증: ${found}/${total}개 구현\n`;
                details.forEach(detail => {
                    const icon = detail.found ? '✅' : '❌';
                    report += `  ${icon} ${detail.feature}\n`;
                });
            }

            // 개선 제안
            if (genreCompliance.recommendations.length > 0) {
                report += `\n🚀 장르별 개선 제안:\n`;
                genreCompliance.recommendations.forEach(rec => {
                    report += `\n${rec.category}:\n`;
                    rec.items.forEach(item => {
                        report += `  • ${item}\n`;
                    });
                });
            }
        }

        report += '\n==================================\n';

        return report;
    }
}

module.exports = GameValidator;