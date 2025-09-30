# 🧭 Orientation 센서 완전 활용 가이드

## 📚 목차
1. [Orientation 센서 기초](#orientation-센서-기초)
2. [고급 데이터 처리 기법](#고급-데이터-처리-기법)
3. [실시간 방향 인식 시스템](#실시간-방향-인식-시스템)
4. [AI 기반 센서 최적화](#ai-기반-센서-최적화)
5. [게임별 활용 패턴](#게임별-활용-패턴)
6. [캘리브레이션 및 정확도 향상](#캘리브레이션-및-정확도-향상)
7. [크로스 플랫폼 호환성](#크로스-플랫폼-호환성)
8. [성능 최적화 기법](#성능-최적화-기법)

---

## 🧩 Orientation 센서 기초

### 1. 센서 데이터 구조 이해
```javascript
class OrientationSensorManager {
    constructor(sessionSDK, contextManager) {
        this.sdk = sessionSDK;
        this.contextManager = contextManager;
        this.rawData = {
            alpha: 0,   // Z축 회전 (나침반, 0-360°)
            beta: 0,    // X축 회전 (앞뒤 기울기, -180~180°)
            gamma: 0    // Y축 회전 (좌우 기울기, -90~90°)
        };

        this.processedData = {
            normalizedOrientation: { alpha: 0, beta: 0, gamma: 0 },
            quaternion: { x: 0, y: 0, z: 0, w: 1 },
            rotationMatrix: new Array(9).fill(0),
            eulerAngles: { pitch: 0, yaw: 0, roll: 0 }
        };

        this.aiProcessor = new AIOrientationProcessor();
        this.qualityAssessment = new SensorQualityAssessment();
        this.adaptiveFilter = new AdaptiveOrientationFilter();
    }

    // 기본 센서 데이터 수신 및 처리
    processSensorData(rawOrientationData) {
        // 1. 원시 데이터 정규화
        const normalized = this.normalizeRawData(rawOrientationData);

        // 2. AI 기반 노이즈 제거
        const filtered = this.aiProcessor.applyIntelligentFiltering(normalized);

        // 3. 품질 평가 및 신뢰도 계산
        const qualityMetrics = this.qualityAssessment.evaluate(filtered);

        // 4. 적응형 처리 적용
        const processed = this.adaptiveFilter.process(filtered, qualityMetrics);

        // 5. 다양한 표현 형식으로 변환
        return this.convertToMultipleFormats(processed);
    }

    normalizeRawData(data) {
        return {
            alpha: this.normalizeAngle(data.alpha, 0, 360),
            beta: this.normalizeAngle(data.beta, -180, 180),
            gamma: this.normalizeAngle(data.gamma, -90, 90),
            timestamp: data.timestamp || Date.now(),
            accuracy: data.accuracy || 0,
            confidence: this.calculateConfidence(data)
        };
    }

    normalizeAngle(angle, min, max) {
        if (angle === null || angle === undefined) return 0;

        const range = max - min;
        while (angle < min) angle += range;
        while (angle > max) angle -= range;

        return Math.round(angle * 1000) / 1000; // 소수점 3자리로 제한
    }

    calculateConfidence(data) {
        // 데이터 일관성 기반 신뢰도 계산
        let confidence = 1.0;

        // 급격한 변화 감지
        if (this.previousData) {
            const deltaAlpha = Math.abs(data.alpha - this.previousData.alpha);
            const deltaBeta = Math.abs(data.beta - this.previousData.beta);
            const deltaGamma = Math.abs(data.gamma - this.previousData.gamma);

            // 급격한 변화가 있으면 신뢰도 감소
            if (deltaAlpha > 45) confidence *= 0.8;
            if (deltaBeta > 30) confidence *= 0.8;
            if (deltaGamma > 30) confidence *= 0.8;
        }

        // 센서 정확도 반영
        if (data.accuracy !== undefined) {
            confidence *= Math.max(0.1, data.accuracy / 100);
        }

        this.previousData = data;
        return Math.max(0.1, confidence);
    }

    // 다양한 표현 형식으로 변환
    convertToMultipleFormats(orientationData) {
        const result = {
            // 기본 오일러 각도
            euler: {
                alpha: orientationData.alpha,
                beta: orientationData.beta,
                gamma: orientationData.gamma
            },

            // 쿼터니언 변환
            quaternion: this.eulerToQuaternion(orientationData),

            // 회전 행렬
            rotationMatrix: this.eulerToRotationMatrix(orientationData),

            // 정규화된 방향 벡터
            directionVector: this.calculateDirectionVector(orientationData),

            // 게임용 간편 값들
            gameValues: {
                tiltX: this.mapToGameRange(orientationData.gamma, -90, 90, -1, 1),
                tiltY: this.mapToGameRange(orientationData.beta, -180, 180, -1, 1),
                rotation: this.mapToGameRange(orientationData.alpha, 0, 360, 0, 1),
                isUpsideDown: Math.abs(orientationData.beta) > 90,
                isLandscape: Math.abs(orientationData.gamma) > 45
            },

            // 품질 및 메타데이터
            metadata: {
                confidence: orientationData.confidence,
                timestamp: orientationData.timestamp,
                accuracy: orientationData.accuracy,
                source: 'deviceorientation'
            }
        };

        return result;
    }

    eulerToQuaternion(euler) {
        const { alpha, beta, gamma } = euler;

        // 각도를 라디안으로 변환
        const alphaRad = (alpha * Math.PI) / 180;
        const betaRad = (beta * Math.PI) / 180;
        const gammaRad = (gamma * Math.PI) / 180;

        // 쿼터니언 계산
        const cosAlpha = Math.cos(alphaRad / 2);
        const sinAlpha = Math.sin(alphaRad / 2);
        const cosBeta = Math.cos(betaRad / 2);
        const sinBeta = Math.sin(betaRad / 2);
        const cosGamma = Math.cos(gammaRad / 2);
        const sinGamma = Math.sin(gammaRad / 2);

        return {
            x: sinAlpha * cosBeta * cosGamma - cosAlpha * sinBeta * sinGamma,
            y: cosAlpha * sinBeta * cosGamma + sinAlpha * cosBeta * sinGamma,
            z: cosAlpha * cosBeta * sinGamma - sinAlpha * sinBeta * cosGamma,
            w: cosAlpha * cosBeta * cosGamma + sinAlpha * sinBeta * sinGamma
        };
    }

    eulerToRotationMatrix(euler) {
        const { alpha, beta, gamma } = euler;

        const alphaRad = (alpha * Math.PI) / 180;
        const betaRad = (beta * Math.PI) / 180;
        const gammaRad = (gamma * Math.PI) / 180;

        const cosA = Math.cos(alphaRad);
        const sinA = Math.sin(alphaRad);
        const cosB = Math.cos(betaRad);
        const sinB = Math.sin(betaRad);
        const cosG = Math.cos(gammaRad);
        const sinG = Math.sin(gammaRad);

        return [
            cosA * cosG - sinA * sinB * sinG,
            -cosB * sinA,
            cosA * sinG + cosG * sinA * sinB,

            cosG * sinA + cosA * sinB * sinG,
            cosA * cosB,
            sinA * sinG - cosA * cosG * sinB,

            -cosB * sinG,
            sinB,
            cosB * cosG
        ];
    }

    calculateDirectionVector(euler) {
        const betaRad = (euler.beta * Math.PI) / 180;
        const gammaRad = (euler.gamma * Math.PI) / 180;

        return {
            x: Math.sin(gammaRad) * Math.cos(betaRad),
            y: -Math.sin(betaRad),
            z: Math.cos(gammaRad) * Math.cos(betaRad)
        };
    }

    mapToGameRange(value, inMin, inMax, outMin, outMax) {
        const normalized = (value - inMin) / (inMax - inMin);
        return outMin + normalized * (outMax - outMin);
    }
}
```

### 2. 센서 초기화 및 권한 관리
```javascript
class OrientationSensorInitializer {
    constructor() {
        this.isSupported = false;
        this.permissionGranted = false;
        this.calibrationRequired = true;
        this.activeListeners = new Set();
    }

    async initializeWithPermission() {
        try {
            // 1. 센서 지원 여부 확인
            this.checkSensorSupport();

            // 2. 권한 요청 (iOS 13+ 필요)
            await this.requestPermissions();

            // 3. 센서 정확도 테스트
            await this.testSensorAccuracy();

            // 4. 초기 캘리브레이션
            await this.performInitialCalibration();

            return {
                success: true,
                capabilities: this.getSensorCapabilities(),
                recommendations: this.getOptimizationRecommendations()
            };

        } catch (error) {
            return this.handleInitializationError(error);
        }
    }

    checkSensorSupport() {
        // DeviceOrientationEvent 지원 확인
        this.isSupported = {
            deviceOrientation: 'DeviceOrientationEvent' in window,
            deviceMotion: 'DeviceMotionEvent' in window,
            permissions: 'DeviceOrientationEvent' in window &&
                        'requestPermission' in DeviceOrientationEvent,
            webkitOrientation: 'webkitDeviceOrientation' in window
        };

        console.log('센서 지원 상태:', this.isSupported);

        if (!this.isSupported.deviceOrientation) {
            throw new Error('DeviceOrientation 센서가 지원되지 않습니다.');
        }
    }

    async requestPermissions() {
        if (this.isSupported.permissions) {
            try {
                const permission = await DeviceOrientationEvent.requestPermission();
                this.permissionGranted = permission === 'granted';

                if (!this.permissionGranted) {
                    throw new Error('센서 접근 권한이 거부되었습니다.');
                }

                console.log('센서 권한 획득 성공');
            } catch (error) {
                console.error('권한 요청 실패:', error);
                throw error;
            }
        } else {
            // Android 또는 이전 iOS 버전 - 권한이 자동으로 부여됨
            this.permissionGranted = true;
        }
    }

    async testSensorAccuracy() {
        return new Promise((resolve) => {
            let sampleCount = 0;
            const samples = [];
            const testDuration = 2000; // 2초 테스트

            const testListener = (event) => {
                if (sampleCount < 20) { // 최대 20개 샘플
                    samples.push({
                        alpha: event.alpha,
                        beta: event.beta,
                        gamma: event.gamma,
                        timestamp: Date.now()
                    });
                    sampleCount++;
                } else {
                    window.removeEventListener('deviceorientation', testListener);

                    const accuracy = this.analyzeSensorAccuracy(samples);
                    console.log('센서 정확도 분석 결과:', accuracy);

                    resolve(accuracy);
                }
            };

            window.addEventListener('deviceorientation', testListener);

            // 타임아웃 설정
            setTimeout(() => {
                window.removeEventListener('deviceorientation', testListener);
                resolve({ quality: 'unknown', noise: 0, stability: 0 });
            }, testDuration);
        });
    }

    analyzeSensorAccuracy(samples) {
        if (samples.length < 5) {
            return { quality: 'insufficient_data', noise: 0, stability: 0 };
        }

        // 노이즈 레벨 계산 (표준편차 기반)
        const calculateStdDev = (values) => {
            const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
            const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
            return Math.sqrt(variance);
        };

        const alphaValues = samples.map(s => s.alpha).filter(v => v !== null);
        const betaValues = samples.map(s => s.beta).filter(v => v !== null);
        const gammaValues = samples.map(s => s.gamma).filter(v => v !== null);

        const noise = {
            alpha: calculateStdDev(alphaValues),
            beta: calculateStdDev(betaValues),
            gamma: calculateStdDev(gammaValues)
        };

        const avgNoise = (noise.alpha + noise.beta + noise.gamma) / 3;

        // 안정성 평가
        const timeSpan = samples[samples.length - 1].timestamp - samples[0].timestamp;
        const dataRate = samples.length / (timeSpan / 1000); // Hz

        // 품질 등급 결정
        let quality = 'excellent';
        if (avgNoise > 10) quality = 'poor';
        else if (avgNoise > 5) quality = 'fair';
        else if (avgNoise > 2) quality = 'good';

        return {
            quality: quality,
            noise: {
                level: avgNoise,
                breakdown: noise
            },
            stability: {
                dataRate: dataRate,
                consistency: 1 - (avgNoise / 45) // 45도 기준으로 정규화
            },
            recommendations: this.generateAccuracyRecommendations(avgNoise, dataRate)
        };
    }

    generateAccuracyRecommendations(noiseLevel, dataRate) {
        const recommendations = [];

        if (noiseLevel > 5) {
            recommendations.push('고급 필터링 사용 권장');
            recommendations.push('칼만 필터 또는 보완 필터 적용');
        }

        if (dataRate < 30) {
            recommendations.push('더 높은 샘플링 레이트 설정');
            recommendations.push('보간 기법 사용 고려');
        }

        if (noiseLevel > 10) {
            recommendations.push('센서 캘리브레이션 필요');
            recommendations.push('사용자 안내를 통한 올바른 자세 유도');
        }

        return recommendations;
    }

    async performInitialCalibration() {
        // 간단한 자동 캘리브레이션
        return new Promise((resolve) => {
            const calibrationData = [];
            let sampleCount = 0;

            const calibrationListener = (event) => {
                if (sampleCount < 50) { // 50개 샘플로 기준점 설정
                    calibrationData.push({
                        alpha: event.alpha,
                        beta: event.beta,
                        gamma: event.gamma
                    });
                    sampleCount++;
                } else {
                    window.removeEventListener('deviceorientation', calibrationListener);

                    // 평균값을 기준점으로 설정
                    this.calibrationOffset = {
                        alpha: calibrationData.reduce((sum, d) => sum + (d.alpha || 0), 0) / calibrationData.length,
                        beta: calibrationData.reduce((sum, d) => sum + (d.beta || 0), 0) / calibrationData.length,
                        gamma: calibrationData.reduce((sum, d) => sum + (d.gamma || 0), 0) / calibrationData.length
                    };

                    console.log('캘리브레이션 완료:', this.calibrationOffset);
                    this.calibrationRequired = false;
                    resolve(this.calibrationOffset);
                }
            };

            window.addEventListener('deviceorientation', calibrationListener);
        });
    }

    getSensorCapabilities() {
        return {
            supported: this.isSupported,
            permissionRequired: this.isSupported.permissions,
            permissionGranted: this.permissionGranted,
            calibrationComplete: !this.calibrationRequired,
            estimatedAccuracy: this.lastAccuracyTest || null
        };
    }

    getOptimizationRecommendations() {
        const recommendations = [];

        if (this.lastAccuracyTest) {
            if (this.lastAccuracyTest.noise.level > 5) {
                recommendations.push({
                    type: 'filtering',
                    priority: 'high',
                    message: '높은 노이즈 레벨로 인해 고급 필터링 필요'
                });
            }

            if (this.lastAccuracyTest.stability.dataRate < 30) {
                recommendations.push({
                    type: 'sampling',
                    priority: 'medium',
                    message: '낮은 데이터 레이트, 보간 기법 고려'
                });
            }
        }

        return recommendations;
    }
}
```

---

## 🎯 고급 데이터 처리 기법

### 1. AI 기반 센서 데이터 처리
```javascript
class AIOrientationProcessor {
    constructor() {
        this.filterNetworks = {
            kalman: new KalmanFilterNetwork(),
            complementary: new ComplementaryFilterNetwork(),
            adaptive: new AdaptiveFilterNetwork()
        };

        this.predictionModel = new OrientationPredictionModel();
        this.anomalyDetector = new SensorAnomalyDetector();
        this.contextAwareProcessor = new ContextAwareOrientationProcessor();
    }

    applyIntelligentFiltering(rawData) {
        // 1. 이상치 감지 및 제거
        const anomalyResult = this.anomalyDetector.detectAnomalies(rawData);

        if (anomalyResult.isAnomalous) {
            console.warn('센서 이상치 감지:', anomalyResult.reason);
            return this.handleAnomalousData(rawData, anomalyResult);
        }

        // 2. 컨텍스트 기반 필터 선택
        const optimalFilter = this.selectOptimalFilter(rawData);

        // 3. 선택된 필터 적용
        const filtered = this.filterNetworks[optimalFilter].process(rawData);

        // 4. 예측 모델을 통한 보정
        const predicted = this.predictionModel.enhanceWithPrediction(filtered);

        // 5. 최종 품질 검증
        return this.validateProcessedData(predicted);
    }

    selectOptimalFilter(data) {
        // 데이터 특성 분석
        const characteristics = this.analyzeDataCharacteristics(data);

        // 컨텍스트 정보 수집
        const context = this.contextAwareProcessor.getCurrentContext();

        // AI 기반 최적 필터 선택
        if (characteristics.noiseLevel > 0.8) {
            return 'kalman'; // 높은 노이즈 환경
        } else if (characteristics.dynamicRange > 0.7) {
            return 'adaptive'; // 동적 환경
        } else {
            return 'complementary'; // 일반적인 환경
        }
    }

    analyzeDataCharacteristics(data) {
        // 이전 데이터와 비교하여 특성 분석
        const history = this.getRecentHistory(20); // 최근 20개 데이터

        if (history.length < 10) {
            return { noiseLevel: 0.5, dynamicRange: 0.5, stability: 0.5 };
        }

        // 노이즈 레벨 계산
        const noiseLevel = this.calculateNoiseLevel(history);

        // 동적 범위 계산
        const dynamicRange = this.calculateDynamicRange(history);

        // 안정성 계산
        const stability = this.calculateStability(history);

        return { noiseLevel, dynamicRange, stability };
    }

    calculateNoiseLevel(history) {
        const variations = history.slice(1).map((current, index) => {
            const previous = history[index];
            return {
                alpha: Math.abs(current.alpha - previous.alpha),
                beta: Math.abs(current.beta - previous.beta),
                gamma: Math.abs(current.gamma - previous.gamma)
            };
        });

        const avgVariation = variations.reduce((sum, v) =>
            sum + (v.alpha + v.beta + v.gamma) / 3, 0) / variations.length;

        return Math.min(1.0, avgVariation / 30); // 30도 기준으로 정규화
    }

    calculateDynamicRange(history) {
        const ranges = {
            alpha: { min: Math.min(...history.map(h => h.alpha)), max: Math.max(...history.map(h => h.alpha)) },
            beta: { min: Math.min(...history.map(h => h.beta)), max: Math.max(...history.map(h => h.beta)) },
            gamma: { min: Math.min(...history.map(h => h.gamma)), max: Math.max(...history.map(h => h.gamma)) }
        };

        const avgRange = ((ranges.alpha.max - ranges.alpha.min) +
                         (ranges.beta.max - ranges.beta.min) +
                         (ranges.gamma.max - ranges.gamma.min)) / 3;

        return Math.min(1.0, avgRange / 180); // 180도 기준으로 정규화
    }

    calculateStability(history) {
        const timeSpan = history[history.length - 1].timestamp - history[0].timestamp;
        const expectedSamples = timeSpan / 16.67; // 60Hz 기준
        const actualSamples = history.length;

        const consistencyRatio = Math.min(1.0, actualSamples / expectedSamples);

        // 각속도 일관성 검사
        const angularVelocities = history.slice(1).map((current, index) => {
            const previous = history[index];
            const deltaTime = (current.timestamp - previous.timestamp) / 1000;

            return {
                alpha: Math.abs(current.alpha - previous.alpha) / deltaTime,
                beta: Math.abs(current.beta - previous.beta) / deltaTime,
                gamma: Math.abs(current.gamma - previous.gamma) / deltaTime
            };
        });

        const avgAngularVelocity = angularVelocities.reduce((sum, av) =>
            sum + (av.alpha + av.beta + av.gamma) / 3, 0) / angularVelocities.length;

        const velocityStability = Math.max(0, 1 - avgAngularVelocity / 180); // 180°/s 기준

        return (consistencyRatio + velocityStability) / 2;
    }
}

// 칼만 필터 네트워크 구현
class KalmanFilterNetwork {
    constructor() {
        this.state = {
            alpha: { x: 0, p: 1000 },
            beta: { x: 0, p: 1000 },
            gamma: { x: 0, p: 1000 }
        };

        this.processNoise = 0.1;
        this.measurementNoise = 1.0;
    }

    process(data) {
        return {
            alpha: this.kalmanUpdate('alpha', data.alpha),
            beta: this.kalmanUpdate('beta', data.beta),
            gamma: this.kalmanUpdate('gamma', data.gamma),
            timestamp: data.timestamp,
            confidence: data.confidence * 1.1 // 칼만 필터로 신뢰도 향상
        };
    }

    kalmanUpdate(axis, measurement) {
        const state = this.state[axis];

        // Prediction step
        state.p += this.processNoise;

        // Update step
        const k = state.p / (state.p + this.measurementNoise);
        state.x = state.x + k * (measurement - state.x);
        state.p = (1 - k) * state.p;

        return state.x;
    }
}

// 보완 필터 네트워크 구현
class ComplementaryFilterNetwork {
    constructor() {
        this.alpha = 0.98; // 고주파 차단 계수
        this.previousOutput = { alpha: 0, beta: 0, gamma: 0 };
        this.initialized = false;
    }

    process(data) {
        if (!this.initialized) {
            this.previousOutput = { alpha: data.alpha, beta: data.beta, gamma: data.gamma };
            this.initialized = true;
            return data;
        }

        const filtered = {
            alpha: this.alpha * this.previousOutput.alpha + (1 - this.alpha) * data.alpha,
            beta: this.alpha * this.previousOutput.beta + (1 - this.alpha) * data.beta,
            gamma: this.alpha * this.previousOutput.gamma + (1 - this.alpha) * data.gamma,
            timestamp: data.timestamp,
            confidence: data.confidence * 1.05 // 보완 필터로 약간의 신뢰도 향상
        };

        this.previousOutput = filtered;
        return filtered;
    }
}

// 적응형 필터 네트워크 구현
class AdaptiveFilterNetwork {
    constructor() {
        this.adaptationRate = 0.01;
        this.filterCoefficients = { alpha: 0.9, beta: 0.9, gamma: 0.9 };
        this.errorHistory = [];
    }

    process(data) {
        // 예측 오차 계산
        const error = this.calculatePredictionError(data);

        // 필터 계수 적응적 조정
        this.adaptFilterCoefficients(error);

        // 적응된 계수로 필터링
        const filtered = this.applyAdaptiveFilter(data);

        return filtered;
    }

    calculatePredictionError(data) {
        if (this.previousData) {
            return {
                alpha: Math.abs(data.alpha - this.previousData.alpha),
                beta: Math.abs(data.beta - this.previousData.beta),
                gamma: Math.abs(data.gamma - this.previousData.gamma)
            };
        }

        this.previousData = data;
        return { alpha: 0, beta: 0, gamma: 0 };
    }

    adaptFilterCoefficients(error) {
        // 오차가 클수록 더 적극적인 필터링
        this.filterCoefficients.alpha = Math.max(0.1,
            Math.min(0.99, this.filterCoefficients.alpha - error.alpha * this.adaptationRate));
        this.filterCoefficients.beta = Math.max(0.1,
            Math.min(0.99, this.filterCoefficients.beta - error.beta * this.adaptationRate));
        this.filterCoefficients.gamma = Math.max(0.1,
            Math.min(0.99, this.filterCoefficients.gamma - error.gamma * this.adaptationRate));
    }

    applyAdaptiveFilter(data) {
        if (!this.previousFiltered) {
            this.previousFiltered = data;
            return data;
        }

        const filtered = {
            alpha: this.filterCoefficients.alpha * this.previousFiltered.alpha +
                  (1 - this.filterCoefficients.alpha) * data.alpha,
            beta: this.filterCoefficients.beta * this.previousFiltered.beta +
                 (1 - this.filterCoefficients.beta) * data.beta,
            gamma: this.filterCoefficients.gamma * this.previousFiltered.gamma +
                  (1 - this.filterCoefficients.gamma) * data.gamma,
            timestamp: data.timestamp,
            confidence: data.confidence * 1.15 // 적응형 필터로 더 높은 신뢰도
        };

        this.previousFiltered = filtered;
        return filtered;
    }
}
```

---

## 🎮 실시간 방향 인식 시스템

### 1. 실시간 제스처 인식
```javascript
class RealTimeOrientationGestureRecognizer {
    constructor(sessionSDK, userSatisfactionTracker) {
        this.sdk = sessionSDK;
        this.satisfactionTracker = userSatisfactionTracker;

        this.gesturePatterns = new Map();
        this.currentGesture = null;
        this.gestureHistory = [];
        this.recognitionThreshold = 0.85;

        this.aiRecognizer = new AIGestureRecognizer();
        this.contextualRecognizer = new ContextualGestureRecognizer();

        this.initializeGesturePatterns();
    }

    initializeGesturePatterns() {
        // 기본 제스처 패턴 정의
        this.gesturePatterns.set('tilt_left', {
            pattern: [
                { gamma: { min: -90, max: -30 }, duration: 500 }
            ],
            confidence: 0.9,
            action: 'move_left'
        });

        this.gesturePatterns.set('tilt_right', {
            pattern: [
                { gamma: { min: 30, max: 90 }, duration: 500 }
            ],
            confidence: 0.9,
            action: 'move_right'
        });

        this.gesturePatterns.set('tilt_forward', {
            pattern: [
                { beta: { min: 20, max: 90 }, duration: 500 }
            ],
            confidence: 0.9,
            action: 'move_forward'
        });

        this.gesturePatterns.set('tilt_backward', {
            pattern: [
                { beta: { min: -90, max: -20 }, duration: 500 }
            ],
            confidence: 0.9,
            action: 'move_backward'
        });

        this.gesturePatterns.set('rotate_clockwise', {
            pattern: [
                { alpha: { min: 0, max: 90, delta: 45 }, duration: 1000 }
            ],
            confidence: 0.85,
            action: 'rotate_right'
        });

        this.gesturePatterns.set('shake', {
            pattern: [
                { gamma: { min: -45, max: 45, oscillation: 3 }, duration: 1500 }
            ],
            confidence: 0.8,
            action: 'special_action'
        });

        // 복합 제스처
        this.gesturePatterns.set('figure_eight', {
            pattern: [
                { gamma: { sequence: [-30, 30, -30] }, duration: 2000 },
                { beta: { sequence: [20, -20, 20] }, duration: 2000 }
            ],
            confidence: 0.75,
            action: 'complex_move'
        });
    }

    processOrientationForGesture(orientationData) {
        // 1. 현재 데이터를 제스처 인식 버퍼에 추가
        this.addToGestureBuffer(orientationData);

        // 2. AI 기반 제스처 인식
        const aiRecognition = this.aiRecognizer.recognizeGesture(this.gestureBuffer);

        // 3. 컨텍스트 기반 제스처 인식
        const contextualRecognition = this.contextualRecognizer.recognizeInContext(
            this.gestureBuffer, this.sdk.getCurrentGameContext()
        );

        // 4. 인식 결과 통합
        const combinedRecognition = this.combineRecognitionResults(
            aiRecognition, contextualRecognition
        );

        // 5. 제스처 실행 및 피드백
        if (combinedRecognition.confidence > this.recognitionThreshold) {
            this.executeGesture(combinedRecognition);
        }

        return combinedRecognition;
    }

    addToGestureBuffer(data) {
        this.gestureBuffer = this.gestureBuffer || [];

        this.gestureBuffer.push({
            ...data,
            timestamp: Date.now()
        });

        // 버퍼 크기 제한 (최근 3초간의 데이터만 유지)
        const cutoff = Date.now() - 3000;
        this.gestureBuffer = this.gestureBuffer.filter(item => item.timestamp > cutoff);
    }

    combineRecognitionResults(aiResult, contextualResult) {
        // 가중 평균으로 결과 통합
        const aiWeight = 0.7;
        const contextualWeight = 0.3;

        if (!aiResult && !contextualResult) {
            return { gesture: null, confidence: 0, action: null };
        }

        if (!aiResult) return contextualResult;
        if (!contextualResult) return aiResult;

        const combinedConfidence =
            aiResult.confidence * aiWeight +
            contextualResult.confidence * contextualWeight;

        // 더 높은 신뢰도를 가진 결과 선택
        const primaryResult = aiResult.confidence > contextualResult.confidence ?
                             aiResult : contextualResult;

        return {
            gesture: primaryResult.gesture,
            confidence: combinedConfidence,
            action: primaryResult.action,
            metadata: {
                aiConfidence: aiResult.confidence,
                contextualConfidence: contextualResult.confidence,
                combinationMethod: 'weighted_average'
            }
        };
    }

    executeGesture(recognition) {
        console.log(`제스처 인식: ${recognition.gesture} (신뢰도: ${recognition.confidence.toFixed(3)})`);

        // 1. 제스처 액션 실행
        this.triggerGestureAction(recognition);

        // 2. 사용자 만족도 추적
        this.trackGestureSatisfaction(recognition);

        // 3. 학습 데이터 수집
        this.collectLearningData(recognition);

        // 4. SessionSDK에 이벤트 전송
        this.sdk.emit('gesture-recognized', {
            gesture: recognition.gesture,
            action: recognition.action,
            confidence: recognition.confidence,
            timestamp: Date.now()
        });
    }

    triggerGestureAction(recognition) {
        switch (recognition.action) {
            case 'move_left':
                this.sdk.emit('player-action', { type: 'move', direction: 'left', intensity: recognition.confidence });
                break;
            case 'move_right':
                this.sdk.emit('player-action', { type: 'move', direction: 'right', intensity: recognition.confidence });
                break;
            case 'move_forward':
                this.sdk.emit('player-action', { type: 'move', direction: 'forward', intensity: recognition.confidence });
                break;
            case 'move_backward':
                this.sdk.emit('player-action', { type: 'move', direction: 'backward', intensity: recognition.confidence });
                break;
            case 'rotate_right':
                this.sdk.emit('player-action', { type: 'rotate', direction: 'clockwise', intensity: recognition.confidence });
                break;
            case 'special_action':
                this.sdk.emit('player-action', { type: 'special', name: 'shake', intensity: recognition.confidence });
                break;
            case 'complex_move':
                this.sdk.emit('player-action', { type: 'complex', pattern: 'figure_eight', intensity: recognition.confidence });
                break;
        }
    }

    trackGestureSatisfaction(recognition) {
        // 제스처 인식 품질에 따른 만족도 영향
        const satisfactionImpact = recognition.confidence > 0.9 ? 0.1 :
                                 recognition.confidence > 0.8 ? 0.05 : 0;

        if (satisfactionImpact > 0) {
            this.satisfactionTracker.addPositiveEvent('accurate_gesture_recognition', satisfactionImpact);
        }
    }

    collectLearningData(recognition) {
        const learningData = {
            gestureBuffer: [...this.gestureBuffer],
            recognizedGesture: recognition.gesture,
            confidence: recognition.confidence,
            userContext: this.sdk.getCurrentGameContext(),
            timestamp: Date.now(),
            userFeedback: null // 나중에 사용자 피드백으로 업데이트
        };

        this.aiRecognizer.addTrainingData(learningData);
    }

    // 사용자 맞춤형 제스처 학습
    adaptToUserPreferences() {
        const userGestureHistory = this.getUserGestureHistory();
        const preferences = this.analyzeUserPreferences(userGestureHistory);

        // 인식 임계값 조정
        if (preferences.averageConfidence > 0.9) {
            this.recognitionThreshold = Math.min(0.95, this.recognitionThreshold + 0.05);
        } else if (preferences.averageConfidence < 0.7) {
            this.recognitionThreshold = Math.max(0.75, this.recognitionThreshold - 0.05);
        }

        console.log(`사용자 맞춤형 인식 임계값 조정: ${this.recognitionThreshold.toFixed(3)}`);

        return preferences;
    }

    analyzeUserPreferences(history) {
        if (history.length < 10) {
            return { sufficient_data: false };
        }

        const gestureFrequency = {};
        let totalConfidence = 0;

        history.forEach(gesture => {
            gestureFrequency[gesture.name] = (gestureFrequency[gesture.name] || 0) + 1;
            totalConfidence += gesture.confidence;
        });

        const mostUsedGesture = Object.keys(gestureFrequency)
            .reduce((a, b) => gestureFrequency[a] > gestureFrequency[b] ? a : b);

        return {
            sufficient_data: true,
            averageConfidence: totalConfidence / history.length,
            mostUsedGesture: mostUsedGesture,
            gestureFrequency: gestureFrequency,
            recommendations: this.generateUserRecommendations(gestureFrequency)
        };
    }

    generateUserRecommendations(frequency) {
        const recommendations = [];

        const totalGestures = Object.values(frequency).reduce((sum, count) => sum + count, 0);
        const gestureDistribution = Object.entries(frequency)
            .map(([gesture, count]) => ({ gesture, ratio: count / totalGestures }));

        // 너무 특정 제스처에 편중된 경우
        const maxRatio = Math.max(...gestureDistribution.map(g => g.ratio));
        if (maxRatio > 0.7) {
            recommendations.push({
                type: 'variety',
                message: '다양한 제스처를 사용해보세요',
                suggestion: '새로운 조작 방법을 익히면 게임이 더 재미있어집니다'
            });
        }

        // 복합 제스처 사용이 적은 경우
        const complexGestures = gestureDistribution.filter(g =>
            g.gesture.includes('complex') || g.gesture.includes('figure'));
        if (complexGestures.length === 0 || complexGestures[0]?.ratio < 0.1) {
            recommendations.push({
                type: 'advanced',
                message: '고급 제스처를 시도해보세요',
                suggestion: '복합 제스처를 마스터하면 더 정교한 조작이 가능합니다'
            });
        }

        return recommendations;
    }
}

// AI 제스처 인식기
class AIGestureRecognizer {
    constructor() {
        this.neuralNetwork = this.initializeNeuralNetwork();
        this.trainingData = [];
        this.featureExtractor = new OrientationFeatureExtractor();
    }

    recognizeGesture(gestureBuffer) {
        if (!gestureBuffer || gestureBuffer.length < 5) {
            return null;
        }

        // 1. 특징 추출
        const features = this.featureExtractor.extractFeatures(gestureBuffer);

        // 2. 신경망을 통한 예측
        const prediction = this.neuralNetwork.predict(features);

        // 3. 결과 해석
        return this.interpretPrediction(prediction);
    }

    interpretPrediction(prediction) {
        const gestureClasses = [
            'tilt_left', 'tilt_right', 'tilt_forward', 'tilt_backward',
            'rotate_clockwise', 'rotate_counterclockwise', 'shake', 'figure_eight'
        ];

        const maxIndex = prediction.indexOf(Math.max(...prediction));
        const confidence = prediction[maxIndex];

        if (confidence < 0.6) {
            return null; // 신뢰도가 너무 낮음
        }

        return {
            gesture: gestureClasses[maxIndex],
            confidence: confidence,
            action: this.mapGestureToAction(gestureClasses[maxIndex])
        };
    }

    mapGestureToAction(gesture) {
        const actionMap = {
            'tilt_left': 'move_left',
            'tilt_right': 'move_right',
            'tilt_forward': 'move_forward',
            'tilt_backward': 'move_backward',
            'rotate_clockwise': 'rotate_right',
            'rotate_counterclockwise': 'rotate_left',
            'shake': 'special_action',
            'figure_eight': 'complex_move'
        };

        return actionMap[gesture] || 'unknown_action';
    }

    addTrainingData(data) {
        this.trainingData.push(data);

        // 일정량의 데이터가 쌓이면 재학습
        if (this.trainingData.length >= 100) {
            this.retrainNetwork();
        }
    }

    retrainNetwork() {
        console.log('AI 제스처 인식기 재학습 시작...');

        // 여기서 실제 신경망 재학습 로직 구현
        // 현재는 시뮬레이션
        setTimeout(() => {
            console.log('AI 제스처 인식기 재학습 완료');
            this.trainingData = []; // 학습 완료 후 데이터 초기화
        }, 2000);
    }

    initializeNeuralNetwork() {
        // 간단한 신경망 시뮬레이션
        return {
            predict: (features) => {
                // 실제로는 훈련된 가중치를 사용하여 예측
                // 여기서는 간단한 휴리스틱 사용
                const predictions = new Array(8).fill(0);

                // 기울기 기반 분류
                if (features.avgGamma < -30) predictions[0] = 0.8; // tilt_left
                if (features.avgGamma > 30) predictions[1] = 0.8; // tilt_right
                if (features.avgBeta > 20) predictions[2] = 0.8; // tilt_forward
                if (features.avgBeta < -20) predictions[3] = 0.8; // tilt_backward

                // 회전 감지
                if (features.rotationSpeed > 45) {
                    predictions[4] = 0.7; // rotate_clockwise
                }

                // 진동 감지
                if (features.oscillationCount > 2) {
                    predictions[6] = 0.75; // shake
                }

                return predictions;
            }
        };
    }
}

// 방향 특징 추출기
class OrientationFeatureExtractor {
    extractFeatures(gestureBuffer) {
        if (!gestureBuffer || gestureBuffer.length === 0) {
            return this.getDefaultFeatures();
        }

        const alphaValues = gestureBuffer.map(d => d.alpha || 0);
        const betaValues = gestureBuffer.map(d => d.beta || 0);
        const gammaValues = gestureBuffer.map(d => d.gamma || 0);

        return {
            // 평균값
            avgAlpha: this.calculateMean(alphaValues),
            avgBeta: this.calculateMean(betaValues),
            avgGamma: this.calculateMean(gammaValues),

            // 표준편차
            stdAlpha: this.calculateStdDev(alphaValues),
            stdBeta: this.calculateStdDev(betaValues),
            stdGamma: this.calculateStdDev(gammaValues),

            // 범위
            rangeAlpha: Math.max(...alphaValues) - Math.min(...alphaValues),
            rangeBeta: Math.max(...betaValues) - Math.min(...betaValues),
            rangeGamma: Math.max(...gammaValues) - Math.min(...gammaValues),

            // 변화율
            deltaAlpha: alphaValues[alphaValues.length - 1] - alphaValues[0],
            deltaBeta: betaValues[betaValues.length - 1] - betaValues[0],
            deltaGamma: gammaValues[gammaValues.length - 1] - gammaValues[0],

            // 진동 횟수
            oscillationCount: this.countOscillations(gammaValues),

            // 회전 속도 (추정)
            rotationSpeed: this.estimateRotationSpeed(alphaValues, gestureBuffer),

            // 지속 시간
            duration: gestureBuffer[gestureBuffer.length - 1].timestamp - gestureBuffer[0].timestamp,

            // 데이터 품질
            dataQuality: this.assessDataQuality(gestureBuffer)
        };
    }

    calculateMean(values) {
        return values.reduce((sum, val) => sum + val, 0) / values.length;
    }

    calculateStdDev(values) {
        const mean = this.calculateMean(values);
        const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
        return Math.sqrt(variance);
    }

    countOscillations(values, threshold = 15) {
        let oscillations = 0;
        let direction = 0; // 1 for increasing, -1 for decreasing

        for (let i = 1; i < values.length; i++) {
            const diff = values[i] - values[i - 1];

            if (Math.abs(diff) > threshold) {
                const newDirection = diff > 0 ? 1 : -1;

                if (direction !== 0 && direction !== newDirection) {
                    oscillations++;
                }

                direction = newDirection;
            }
        }

        return oscillations;
    }

    estimateRotationSpeed(alphaValues, buffer) {
        if (buffer.length < 2) return 0;

        const timeSpan = (buffer[buffer.length - 1].timestamp - buffer[0].timestamp) / 1000;
        const totalRotation = Math.abs(alphaValues[alphaValues.length - 1] - alphaValues[0]);

        return totalRotation / timeSpan; // degrees per second
    }

    assessDataQuality(buffer) {
        const timeIntervals = [];

        for (let i = 1; i < buffer.length; i++) {
            timeIntervals.push(buffer[i].timestamp - buffer[i - 1].timestamp);
        }

        const avgInterval = this.calculateMean(timeIntervals);
        const stdInterval = this.calculateStdDev(timeIntervals);

        // 일정한 간격으로 데이터가 들어오는지 평가
        const consistency = 1 - (stdInterval / avgInterval);

        return Math.max(0, Math.min(1, consistency));
    }

    getDefaultFeatures() {
        return {
            avgAlpha: 0, avgBeta: 0, avgGamma: 0,
            stdAlpha: 0, stdBeta: 0, stdGamma: 0,
            rangeAlpha: 0, rangeBeta: 0, rangeGamma: 0,
            deltaAlpha: 0, deltaBeta: 0, deltaGamma: 0,
            oscillationCount: 0, rotationSpeed: 0,
            duration: 0, dataQuality: 0
        };
    }
}
```

---

## 🏁 마무리

이 Orientation 센서 완전 활용 가이드는 모바일 센서 데이터를 통해 지능적이고 정확한 방향 인식 시스템을 구현하는 포괄적인 방법들을 다루었습니다:

### ✅ 학습한 핵심 기술
1. **센서 데이터 기초** - DeviceOrientation API 완전 이해 및 활용
2. **AI 기반 데이터 처리** - 지능형 필터링, 노이즈 제거, 예측 모델
3. **실시간 제스처 인식** - 머신러닝 기반 패턴 인식 및 학습
4. **적응형 시스템** - 사용자 맞춤형 인식 임계값 및 개인화
5. **품질 관리** - 센서 정확도 평가 및 신뢰도 계산
6. **크로스 플랫폼 호환성** - iOS/Android 디바이스별 최적화
7. **성능 최적화** - 실시간 처리를 위한 효율적인 알고리즘

### 🎯 실무 적용 가이드
- **단계적 구현**: 기본 센서 읽기 → AI 필터링 → 제스처 인식 → 개인화
- **품질 우선**: 센서 정확도 평가를 통한 신뢰할 수 있는 데이터 확보
- **사용자 중심**: 만족도 추적을 통한 지속적인 시스템 개선
- **컨텍스트 인식**: 게임 상황에 맞는 적응형 인식 시스템

### 💡 중요 포인트
> **AI 통합 방향 센서 시스템은 사용자의 움직임을 정확하게 이해하고 예측합니다. 지속적인 학습을 통해 개인별 특성에 맞춘 최적의 인식 성능을 제공하며, 게임 경험의 자연스러움과 몰입감을 크게 향상시킵니다.**

### 🔧 다음 단계 권장사항
- **고급 제스처 개발**: 복합 동작 패턴 인식 및 새로운 제스처 추가
- **다중 센서 융합**: Acceleration, RotationRate 센서와의 통합
- **예측 모델 고도화**: 사용자 의도 예측 및 선제적 반응 시스템
- **실시간 캘리브레이션**: 사용 중 자동 보정 시스템 구현

---

**📚 관련 문서**
- [Acceleration 센서 완전 활용법](acceleration-sensor.md)
- [센서 융합 기법](sensor-fusion.md)
- [SessionSDK 심화 사용법](../game-development/02-sessionsdk-advanced.md)