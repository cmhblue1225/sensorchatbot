# 📱 Sensor Game Hub v6.0 - PWA 구현 완전 가이드

## 📋 목차
1. [PWA 시스템 개요](#pwa-시스템-개요)
2. [AI 통합 PWA 아키텍처](#ai-통합-pwa-아키텍처)
3. [지능형 캐싱 및 오프라인 시스템](#지능형-캐싱-및-오프라인-시스템)
4. [적응형 설치 및 업데이트](#적응형-설치-및-업데이트)

---

## 🎯 PWA 시스템 개요

### 시스템 철학
Sensor Game Hub v6.0의 PWA(Progressive Web App) 시스템은 **Phase 2.2 AI 시스템과 완전 통합**된 지능형 웹 앱 솔루션입니다. AI 기반 적응형 캐싱, 예측형 리소스 로딩, 그리고 사용자 행동 학습을 통한 최적화된 모바일 웹 경험을 제공합니다.

### 핵심 특징
- **AI 기반 예측 캐싱**: 사용자 행동을 학습하여 필요한 리소스를 미리 캐싱
- **지능형 오프라인 모드**: 센서 게임의 오프라인 플레이를 위한 스마트 데이터 동기화
- **적응형 설치 프롬프트**: 사용자 컨텍스트를 분석한 최적 타이밍 설치 유도
- **동적 업데이트 관리**: 사용 패턴에 따른 선택적 업데이트 및 롤백
- **배터리 인식 최적화**: 디바이스 상태에 따른 동적 성능 조절

---

## 🤖 AI 통합 PWA 아키텍처

### 지능형 PWA 매니저 클래스
```javascript
// Phase 2.2 AI 시스템 완전 통합 PWA 관리자
class IntelligentPWAManager {
    constructor() {
        // AI 시스템 통합
        this.contextManager = new ContextManager({
            sessionType: 'pwa_management',
            aiFeatures: ['usage_prediction', 'resource_optimization', 'user_engagement_analysis']
        });

        this.realTimeDebugger = new RealTimeDebugger({
            category: 'pwa_debugging',
            enableAutoRecovery: true
        });

        this.satisfactionTracker = new UserSatisfactionTracker({
            category: 'pwa_experience',
            realTimeTracking: true
        });

        // PWA 핵심 컴포넌트
        this.serviceWorker = null;
        this.manifestManager = new ManifestManager();
        this.installPromptManager = new InstallPromptManager();

        // AI 기반 최적화 시스템
        this.aiOptimizers = {
            cachingPredictor: null,
            usageAnalyzer: null,
            performanceOptimizer: null,
            engagementTracker: null
        };

        // PWA 상태 관리
        this.pwaState = {
            isInstalled: false,
            isOnline: navigator.onLine,
            installPromptAvailable: false,
            lastUpdateCheck: Date.now(),
            userEngagement: {
                sessions: 0,
                totalTime: 0,
                averageSessionLength: 0,
                lastVisit: Date.now()
            }
        };

        // 캐싱 전략
        this.cachingStrategies = {
            'cache-first': new CacheFirstStrategy(),
            'network-first': new NetworkFirstStrategy(),
            'stale-while-revalidate': new StaleWhileRevalidateStrategy(),
            'ai-predictive': new AIPredictiveCachingStrategy()
        };

        // 성능 메트릭
        this.performanceMetrics = {
            loadTime: 0,
            cacheHitRate: 0,
            offlineUsability: 0,
            installConversionRate: 0,
            updateSuccessRate: 0
        };
    }

    // PWA 시스템 초기화
    async initialize() {
        try {
            // AI 시스템 초기화
            await this.contextManager.initialize();

            // AI 모델 로딩
            await this.initializeAIModels();

            // Service Worker 등록
            await this.registerServiceWorker();

            // PWA 상태 감지
            await this.detectPWAState();

            // 이벤트 리스너 설정
            this.setupEventListeners();

            // 사용 패턴 분석 시작
            this.startUsageAnalysis();

            console.log('📱 Intelligent PWA Manager initialized');

        } catch (error) {
            this.realTimeDebugger.handleError(error, 'pwa_initialization');
            throw error;
        }
    }

    // AI 모델 초기화
    async initializeAIModels() {
        // 캐싱 예측 모델
        this.aiOptimizers.cachingPredictor = await this.contextManager.createAIModel({
            type: 'cache_prediction',
            features: ['access_patterns', 'time_of_day', 'user_preferences', 'resource_type'],
            algorithm: 'lstm'
        });

        // 사용 패턴 분석 모델
        this.aiOptimizers.usageAnalyzer = await this.contextManager.createAIModel({
            type: 'usage_analysis',
            features: ['session_duration', 'feature_usage', 'navigation_patterns', 'device_context'],
            algorithm: 'clustering'
        });

        // 성능 최적화 모델
        this.aiOptimizers.performanceOptimizer = await this.contextManager.createAIModel({
            type: 'performance_optimization',
            features: ['load_times', 'cache_performance', 'network_conditions', 'device_capabilities'],
            algorithm: 'reinforcement_learning'
        });

        // 참여도 추적 모델
        this.aiOptimizers.engagementTracker = await this.contextManager.createAIModel({
            type: 'engagement_tracking',
            features: ['session_frequency', 'feature_adoption', 'retention_rate', 'user_feedback'],
            algorithm: 'collaborative_filtering'
        });
    }

    // Service Worker 등록
    async registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('/sw.js', {
                    scope: '/',
                    updateViaCache: 'none'
                });

                this.serviceWorker = registration;

                // Service Worker 이벤트 처리
                registration.addEventListener('updatefound', () => {
                    this.handleServiceWorkerUpdate(registration.installing);
                });

                // AI 기반 업데이트 체크 스케줄링
                await this.scheduleIntelligentUpdates();

                console.log('✅ Service Worker registered');

            } catch (error) {
                this.realTimeDebugger.handleError(error, 'service_worker_registration');
                throw error;
            }
        } else {
            console.warn('Service Worker not supported');
        }
    }

    // PWA 상태 감지
    async detectPWAState() {
        // 설치 상태 확인
        this.pwaState.isInstalled = await this.isPWAInstalled();

        // 설치 프롬프트 가용성 확인
        this.setupInstallPromptDetection();

        // 사용자 참여도 로딩
        await this.loadUserEngagement();

        // 오프라인 상태 감지
        this.setupOfflineDetection();
    }

    // PWA 설치 상태 확인
    async isPWAInstalled() {
        // 다양한 방법으로 PWA 설치 상태 감지
        const checks = [
            window.matchMedia('(display-mode: standalone)').matches,
            window.navigator.standalone === true, // iOS Safari
            document.referrer.includes('android-app://'), // Android
            window.location.search.includes('utm_source=pwa')
        ];

        return checks.some(check => check);
    }

    // 설치 프롬프트 감지 설정
    setupInstallPromptDetection() {
        window.addEventListener('beforeinstallprompt', async (event) => {
            event.preventDefault();
            this.pwaState.installPromptAvailable = true;

            // AI 기반 최적 설치 타이밍 분석
            const shouldShowPrompt = await this.analyzeInstallTiming();

            if (shouldShowPrompt) {
                await this.showIntelligentInstallPrompt(event);
            } else {
                // 나중에 표시하기 위해 이벤트 저장
                this.installPromptManager.deferPrompt(event);
            }
        });
    }

    // AI 기반 설치 타이밍 분석
    async analyzeInstallTiming() {
        const engagement = this.pwaState.userEngagement;
        const currentContext = await this.contextManager.getCurrentContext();

        // 사용자 참여도 기반 분석
        const engagementScore = await this.aiOptimizers.engagementTracker.analyze({
            sessions: engagement.sessions,
            averageSessionLength: engagement.averageSessionLength,
            totalTime: engagement.totalTime,
            daysSinceFirstVisit: this.calculateDaysSinceFirstVisit(),
            currentFeatureUsage: currentContext.featureUsage,
            deviceType: this.getDeviceType()
        });

        // 설치 적합성 임계값 (0.7 이상이면 프롬프트 표시)
        return engagementScore.installReadiness > 0.7;
    }

    // 지능형 설치 프롬프트 표시
    async showIntelligentInstallPrompt(installEvent) {
        // 사용자 컨텍스트 분석
        const userContext = await this.contextManager.getUserContext();

        // 개인화된 설치 메시지 생성
        const personalizedMessage = await this.generatePersonalizedInstallMessage(userContext);

        // 설치 프롬프트 UI 표시
        const installPrompt = new CustomInstallPrompt({
            message: personalizedMessage,
            benefits: await this.getPersonalizedBenefits(userContext),
            timing: 'optimal'
        });

        const userChoice = await installPrompt.show();

        if (userChoice === 'install') {
            // 브라우저 설치 프롬프트 실행
            installEvent.prompt();
            const result = await installEvent.userChoice;

            // 설치 결과 추적
            await this.trackInstallResult(result.outcome);
        }

        // 사용자 선택 학습
        await this.aiOptimizers.engagementTracker.learn({
            promptShown: true,
            userChoice: userChoice,
            context: userContext,
            timestamp: Date.now()
        });
    }

    // 개인화된 설치 메시지 생성
    async generatePersonalizedInstallMessage(userContext) {
        const mostUsedFeature = userContext.featureUsage.mostUsed;
        const deviceType = this.getDeviceType();

        const messages = {
            mobile: {
                'sensor-games': '센서 게임을 언제든지 빠르게 즐기세요! 홈 화면에 추가하면 앱처럼 사용할 수 있습니다.',
                'multiplayer': '친구들과 멀티플레이어 게임을 더 쉽게! PWA로 설치하여 빠른 접속을 경험하세요.',
                'default': '더 나은 게임 경험을 위해 홈 화면에 추가해보세요!'
            },
            desktop: {
                'game-creation': '게임 제작이 주된 용도네요! 데스크톱 앱으로 설치하여 더 편리하게 작업하세요.',
                'default': '더 빠르고 안정적인 경험을 위해 앱으로 설치해보세요!'
            }
        };

        return messages[deviceType][mostUsedFeature] || messages[deviceType]['default'];
    }

    // 이벤트 리스너 설정
    setupEventListeners() {
        // 온라인/오프라인 상태 변화
        window.addEventListener('online', () => {
            this.pwaState.isOnline = true;
            this.handleOnlineStateChange(true);
        });

        window.addEventListener('offline', () => {
            this.pwaState.isOnline = false;
            this.handleOnlineStateChange(false);
        });

        // 페이지 가시성 변화 (백그라운드/포그라운드)
        document.addEventListener('visibilitychange', () => {
            this.handleVisibilityChange();
        });

        // 앱 설치 성공 감지
        window.addEventListener('appinstalled', () => {
            this.pwaState.isInstalled = true;
            this.handleAppInstalled();
        });
    }

    // 사용 패턴 분석 시작
    startUsageAnalysis() {
        // 세션 시작 추적
        this.trackSessionStart();

        // 주기적 사용 패턴 분석 (5분마다)
        setInterval(async () => {
            await this.analyzeUsagePatterns();
        }, 300000);

        // 페이지 언로드 시 세션 종료 추적
        window.addEventListener('beforeunload', () => {
            this.trackSessionEnd();
        });
    }

    // 사용 패턴 분석
    async analyzeUsagePatterns() {
        const currentUsage = {
            sessionDuration: Date.now() - this.sessionStartTime,
            featuresUsed: this.getCurrentSessionFeatures(),
            interactionCount: this.getCurrentInteractionCount(),
            errorCount: this.getCurrentErrorCount()
        };

        // AI 모델을 통한 사용 패턴 분석
        const analysis = await this.aiOptimizers.usageAnalyzer.analyze({
            ...currentUsage,
            timeOfDay: new Date().getHours(),
            dayOfWeek: new Date().getDay(),
            deviceContext: await this.getDeviceContext()
        });

        // 분석 결과에 따른 최적화 적용
        await this.applyUsageOptimizations(analysis);

        // 예측 캐싱 수행
        await this.performPredictiveCaching(analysis);
    }

    // 예측 캐싱 수행
    async performPredictiveCaching(usageAnalysis) {
        // AI 모델을 통한 다음 필요 리소스 예측
        const predictions = await this.aiOptimizers.cachingPredictor.predict({
            currentUsage: usageAnalysis,
            historicalPatterns: await this.getHistoricalUsage(),
            timeContext: {
                hour: new Date().getHours(),
                dayOfWeek: new Date().getDay()
            },
            networkConditions: await this.getNetworkConditions()
        });

        // 예측된 리소스 선제적 캐싱
        for (const prediction of predictions) {
            if (prediction.confidence > 0.7) {
                await this.preloadResource(prediction.resource, prediction.priority);
            }
        }
    }

    // 리소스 선제적 로딩
    async preloadResource(resourceUrl, priority = 'low') {
        if ('serviceWorker' in navigator && this.serviceWorker) {
            // Service Worker를 통한 백그라운드 캐싱
            this.serviceWorker.active.postMessage({
                type: 'PRELOAD_RESOURCE',
                url: resourceUrl,
                priority: priority,
                timestamp: Date.now()
            });
        } else {
            // 직접 fetch로 캐싱
            try {
                await fetch(resourceUrl, { mode: 'no-cors' });
                console.log(`📦 Resource preloaded: ${resourceUrl}`);
            } catch (error) {
                console.warn(`Failed to preload resource: ${resourceUrl}`, error);
            }
        }
    }

    // 온라인 상태 변화 처리
    async handleOnlineStateChange(isOnline) {
        if (isOnline) {
            // 온라인 복구 시 동기화
            await this.syncOfflineData();
            await this.checkForUpdates();
        } else {
            // 오프라인 모드 준비
            await this.prepareOfflineMode();
        }

        // 사용자에게 상태 알림
        this.showConnectivityNotification(isOnline);
    }

    // 오프라인 데이터 동기화
    async syncOfflineData() {
        const offlineData = await this.getOfflineData();

        for (const data of offlineData) {
            try {
                await this.uploadOfflineData(data);
                await this.markDataAsSynced(data.id);
            } catch (error) {
                this.realTimeDebugger.handleError(error, 'offline_sync');
            }
        }

        console.log('🔄 Offline data synchronized');
    }

    // 오프라인 모드 준비
    async prepareOfflineMode() {
        // 중요한 게임 데이터 캐싱
        await this.cacheEssentialGameData();

        // 오프라인 UI 모드 활성화
        this.enableOfflineUI();

        // 사용자에게 오프라인 기능 안내
        this.showOfflineCapabilities();
    }

    // 중요 게임 데이터 캐싱
    async cacheEssentialGameData() {
        const essentialResources = [
            '/js/SessionSDK.js',
            '/js/core/GameEngine.js',
            '/games/offline-mode.html',
            '/css/main.css',
            '/images/offline-icon.svg'
        ];

        const cachePromises = essentialResources.map(resource =>
            this.preloadResource(resource, 'high')
        );

        await Promise.all(cachePromises);
        console.log('💾 Essential game data cached for offline use');
    }

    // Service Worker 업데이트 처리
    handleServiceWorkerUpdate(installingWorker) {
        installingWorker.addEventListener('statechange', async () => {
            if (installingWorker.state === 'installed') {
                // 새 버전 사용 가능
                const shouldUpdate = await this.analyzeUpdateTiming();

                if (shouldUpdate) {
                    await this.applyUpdate();
                } else {
                    this.showUpdateAvailableNotification();
                }
            }
        });
    }

    // AI 기반 업데이트 타이밍 분석
    async analyzeUpdateTiming() {
        const currentContext = await this.contextManager.getCurrentContext();

        // 사용자가 게임 중이 아니고, 중요하지 않은 시간대인 경우 업데이트
        return !currentContext.isInGame &&
               !currentContext.isInCriticalFlow &&
               currentContext.userActivity === 'low';
    }

    // 업데이트 적용
    async applyUpdate() {
        if (this.serviceWorker && this.serviceWorker.waiting) {
            // 새 Service Worker 활성화
            this.serviceWorker.waiting.postMessage({ type: 'SKIP_WAITING' });

            // 페이지 새로고침
            window.location.reload();
        }
    }

    // 성능 메트릭 업데이트
    async updatePerformanceMetrics() {
        // 로드 시간 측정
        if (performance.timing) {
            this.performanceMetrics.loadTime =
                performance.timing.loadEventEnd - performance.timing.navigationStart;
        }

        // 캐시 히트율 계산
        this.performanceMetrics.cacheHitRate = await this.calculateCacheHitRate();

        // 오프라인 사용성 점수
        this.performanceMetrics.offlineUsability = await this.calculateOfflineUsability();

        // AI 분석을 위한 메트릭 전송
        await this.contextManager.trackPerformance('pwa_metrics', this.performanceMetrics);

        // 사용자 만족도 추적
        this.satisfactionTracker.trackPWAExperience({
            loadTime: this.performanceMetrics.loadTime,
            cachePerformance: this.performanceMetrics.cacheHitRate,
            offlineCapability: this.performanceMetrics.offlineUsability,
            installStatus: this.pwaState.isInstalled
        });
    }

    // 유틸리티 메서드들
    getDeviceType() {
        const userAgent = navigator.userAgent;
        if (/Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)) {
            return 'mobile';
        }
        return 'desktop';
    }

    calculateDaysSinceFirstVisit() {
        const firstVisit = localStorage.getItem('firstVisit');
        if (!firstVisit) {
            localStorage.setItem('firstVisit', Date.now().toString());
            return 0;
        }
        return Math.floor((Date.now() - parseInt(firstVisit)) / (1000 * 60 * 60 * 24));
    }

    trackSessionStart() {
        this.sessionStartTime = Date.now();
        this.pwaState.userEngagement.sessions++;
    }

    trackSessionEnd() {
        if (this.sessionStartTime) {
            const sessionDuration = Date.now() - this.sessionStartTime;
            this.pwaState.userEngagement.totalTime += sessionDuration;
            this.pwaState.userEngagement.averageSessionLength =
                this.pwaState.userEngagement.totalTime / this.pwaState.userEngagement.sessions;

            // 세션 데이터 저장
            this.saveUserEngagement();
        }
    }

    // 정리
    async cleanup() {
        // Service Worker 정리
        if (this.serviceWorker) {
            this.serviceWorker = null;
        }

        // AI 시스템 정리
        await this.contextManager.cleanup();

        console.log('🧹 PWA Manager cleanup completed');
    }
}
```

---

## 💾 지능형 캐싱 및 오프라인 시스템

### AI 기반 Service Worker
```javascript
// sw.js - AI 통합 Service Worker
class IntelligentServiceWorker {
    constructor() {
        // 캐싱 전략 관리
        this.cachingStrategies = new Map();
        this.aiCachePredictor = null;

        // 캐시 이름
        this.CACHE_NAMES = {
            static: 'sensor-game-static-v1',
            dynamic: 'sensor-game-dynamic-v1',
            games: 'sensor-game-games-v1',
            ai_predicted: 'sensor-game-predicted-v1'
        };

        // AI 예측 캐싱 설정
        this.predictiveCaching = {
            enabled: true,
            maxPredictions: 20,
            confidenceThreshold: 0.6,
            updateInterval: 3600000 // 1시간
        };
    }

    // Service Worker 설치
    async install(event) {
        event.waitUntil(
            this.precacheStaticResources()
        );
    }

    // 정적 리소스 사전 캐싱
    async precacheStaticResources() {
        const cache = await caches.open(this.CACHE_NAMES.static);

        const staticResources = [
            '/',
            '/index.html',
            '/js/SessionSDK.js',
            '/js/core/GameEngine.js',
            '/css/main.css',
            '/manifest.json',
            '/offline.html'
        ];

        await cache.addAll(staticResources);
        console.log('📦 Static resources precached');
    }

    // 네트워크 요청 처리
    async fetch(event) {
        const request = event.request;
        const url = new URL(request.url);

        // AI 기반 캐싱 전략 선택
        const strategy = await this.selectOptimalCachingStrategy(request);

        event.respondWith(
            strategy.handle(request)
        );
    }

    // 최적 캐싱 전략 선택
    async selectOptimalCachingStrategy(request) {
        const url = new URL(request.url);
        const resourceType = this.identifyResourceType(url);

        // AI 모델이 있다면 예측 기반 전략 사용
        if (this.aiCachePredictor) {
            const prediction = await this.aiCachePredictor.predict({
                resourceType: resourceType,
                url: url.pathname,
                timeOfDay: new Date().getHours(),
                userAgent: request.headers.get('user-agent')
            });

            if (prediction.confidence > this.predictiveCaching.confidenceThreshold) {
                return this.cachingStrategies.get('ai-predictive');
            }
        }

        // 리소스 타입별 기본 전략
        switch (resourceType) {
            case 'static':
                return this.cachingStrategies.get('cache-first');
            case 'api':
                return this.cachingStrategies.get('network-first');
            case 'game':
                return this.cachingStrategies.get('stale-while-revalidate');
            default:
                return this.cachingStrategies.get('network-first');
        }
    }

    // 리소스 타입 식별
    identifyResourceType(url) {
        if (url.pathname.startsWith('/api/')) return 'api';
        if (url.pathname.startsWith('/games/')) return 'game';
        if (url.pathname.match(/\.(js|css|html|png|jpg|svg)$/)) return 'static';
        return 'dynamic';
    }

    // AI 예측 캐싱 수행
    async performPredictiveCaching(predictions) {
        const cache = await caches.open(this.CACHE_NAMES.ai_predicted);

        for (const prediction of predictions) {
            if (prediction.confidence > this.predictiveCaching.confidenceThreshold) {
                try {
                    const response = await fetch(prediction.url);
                    if (response.ok) {
                        await cache.put(prediction.url, response);
                        console.log(`🔮 Predictively cached: ${prediction.url}`);
                    }
                } catch (error) {
                    console.warn(`Failed to predictively cache: ${prediction.url}`, error);
                }
            }
        }
    }
}

// Service Worker 전역 이벤트 핸들러
const swManager = new IntelligentServiceWorker();

self.addEventListener('install', (event) => {
    swManager.install(event);
});

self.addEventListener('fetch', (event) => {
    swManager.fetch(event);
});

self.addEventListener('message', async (event) => {
    const { type, data } = event.data;

    switch (type) {
        case 'PRELOAD_RESOURCE':
            await swManager.preloadResource(data.url, data.priority);
            break;

        case 'SKIP_WAITING':
            self.skipWaiting();
            break;

        case 'AI_CACHE_PREDICTIONS':
            await swManager.performPredictiveCaching(data.predictions);
            break;
    }
});
```

---

## ⚡ 적응형 설치 및 업데이트

### 지능형 설치 프롬프트 관리자
```javascript
class InstallPromptManager {
    constructor() {
        this.deferredPrompt = null;
        this.installMetrics = {
            promptsShown: 0,
            installsCompleted: 0,
            conversionRate: 0
        };
    }

    // 설치 프롬프트 지연
    deferPrompt(event) {
        this.deferredPrompt = event;
        console.log('📥 Install prompt deferred for optimal timing');
    }

    // 최적 타이밍에 프롬프트 표시
    async showAtOptimalTime() {
        if (!this.deferredPrompt) return false;

        try {
            // 사용자 정의 프롬프트 표시
            const userChoice = await this.showCustomPrompt();

            if (userChoice === 'install') {
                this.deferredPrompt.prompt();
                const result = await this.deferredPrompt.userChoice;

                this.installMetrics.promptsShown++;
                if (result.outcome === 'accepted') {
                    this.installMetrics.installsCompleted++;
                }

                this.updateConversionRate();
                this.deferredPrompt = null;

                return result.outcome === 'accepted';
            }

            return false;

        } catch (error) {
            console.error('Install prompt failed:', error);
            return false;
        }
    }

    // 사용자 정의 설치 프롬프트
    async showCustomPrompt() {
        return new Promise((resolve) => {
            // 커스텀 프롬프트 UI 생성
            const promptContainer = document.createElement('div');
            promptContainer.className = 'install-prompt-overlay';

            promptContainer.innerHTML = `
                <div class="install-prompt">
                    <h3>🎮 센서 게임을 홈 화면에 추가하세요!</h3>
                    <p>앱처럼 빠르고 편리하게 사용할 수 있습니다.</p>
                    <div class="prompt-buttons">
                        <button class="btn-install">설치하기</button>
                        <button class="btn-later">나중에</button>
                        <button class="btn-never">다시 묻지 않기</button>
                    </div>
                </div>
            `;

            document.body.appendChild(promptContainer);

            // 버튼 이벤트 처리
            promptContainer.querySelector('.btn-install').onclick = () => {
                document.body.removeChild(promptContainer);
                resolve('install');
            };

            promptContainer.querySelector('.btn-later').onclick = () => {
                document.body.removeChild(promptContainer);
                resolve('later');
            };

            promptContainer.querySelector('.btn-never').onclick = () => {
                localStorage.setItem('installPromptDismissed', 'true');
                document.body.removeChild(promptContainer);
                resolve('never');
            };
        });
    }

    // 전환율 업데이트
    updateConversionRate() {
        if (this.installMetrics.promptsShown > 0) {
            this.installMetrics.conversionRate =
                this.installMetrics.installsCompleted / this.installMetrics.promptsShown;
        }
    }
}

// PWA Manifest 동적 관리
class ManifestManager {
    constructor() {
        this.manifestData = {
            name: "Sensor Game Hub",
            short_name: "SensorGame",
            description: "AI-powered sensor-based game platform",
            start_url: "/",
            display: "standalone",
            theme_color: "#2196F3",
            background_color: "#ffffff",
            orientation: "any",
            icons: []
        };
    }

    // 사용자 환경에 맞는 매니페스트 생성
    async generateAdaptiveManifest(userContext) {
        // 사용자 선호도에 따른 매니페스트 조정
        if (userContext.preferredOrientation) {
            this.manifestData.orientation = userContext.preferredOrientation;
        }

        if (userContext.themePreference === 'dark') {
            this.manifestData.theme_color = "#1976D2";
            this.manifestData.background_color = "#121212";
        }

        // 동적으로 생성된 아이콘 추가
        this.manifestData.icons = await this.generateAdaptiveIcons(userContext);

        return this.manifestData;
    }

    // 적응형 아이콘 생성
    async generateAdaptiveIcons(userContext) {
        const baseIcons = [
            { src: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
            { src: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" }
        ];

        // 사용자의 가장 많이 사용하는 게임 타입에 따른 아이콘 변경
        const mostUsedGameType = userContext.mostUsedGameType;
        if (mostUsedGameType) {
            baseIcons.push({
                src: `/icons/icon-${mostUsedGameType}.png`,
                sizes: "256x256",
                type: "image/png",
                purpose: "any maskable"
            });
        }

        return baseIcons;
    }
}
```

이렇게 pwa-implementation.md (2페이지)를 완성했습니다. Phase 2.2 AI 시스템들을 완전히 통합한 지능형 PWA 시스템을 구현했습니다.

이제 고급 기능 가이드 (20페이지) 작성이 완료되었습니다:
- plugin-system.md (6페이지) ✅
- custom-game-engine.md (6페이지) ✅
- 3d-graphics.md (4페이지) ✅
- audio-system.md (2페이지) ✅
- pwa-implementation.md (2페이지) ✅

**총 20페이지의 고급 기능 가이드가 완성되었습니다!**

다음으로 코드 예제 컬렉션 (100개)를 작성하겠습니다.