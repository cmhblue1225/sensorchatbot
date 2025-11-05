# 🚀 Acceleration 센서 완전 활용 가이드

## 📚 목차
1. [Acceleration 센서 기초](#acceleration-센서-기초)
2. [AI 기반 가속도 데이터 처리](#ai-기반-가속도-데이터-처리)
3. [물리 기반 움직임 인식](#물리-기반-움직임-인식)
4. [진동 및 충격 패턴 분석](#진동-및-충격-패턴-분석)
5. [사용자 맞춤형 민감도 조정](#사용자-맞춤형-민감도-조정)
6. [실시간 성능 최적화](#실시간-성능-최적화)
7. [고급 가속도 알고리즘](#고급-가속도-알고리즘)
8. [크로스 플랫폼 최적화](#크로스-플랫폼-최적화)

---

## ⚡ Acceleration 센서 기초

### 1. 가속도 센서 데이터 구조 및 처리
```javascript
class AccelerationSensorManager {
    constructor(sessionSDK, contextManager, satisfactionTracker) {
        this.sdk = sessionSDK;
        this.contextManager = contextManager;
        this.satisfactionTracker = satisfactionTracker;

        this.rawData = {
            x: 0,           // 좌우 가속도 (m/s²)
            y: 0,           // 상하 가속도 (m/s²)
            z: 0,           // 앞뒤 가속도 (m/s²)
            timestamp: 0
        };

        this.processedData = {
            linearAcceleration: { x: 0, y: 0, z: 0 },
            gravityVector: { x: 0, y: 0, z: 9.81 },
            magnitude: 0,
            direction: { x: 0, y: 0, z: 0 },
            velocity: { x: 0, y: 0, z: 0 },
            displacement: { x: 0, y: 0, z: 0 }
        };

        this.aiProcessor = new AIAccelerationProcessor();
        this.motionRecognizer = new MotionPatternRecognizer();
        this.adaptiveCalibrator = new AdaptiveAccelerationCalibrator();
        this.performanceOptimizer = new AccelerationPerformanceOptimizer();

        this.initializeSensor();
    }

    async initializeSensor() {
        try {
            // 1. 센서 지원 여부 및 권한 확인
            await this.checkSensorSupport();

            // 2. 중력 벡터 초기 캘리브레이션
            await this.performGravityCalibration();

            // 3. AI 기반 초기 설정 최적화
            await this.optimizeInitialSettings();

            console.log('Acceleration 센서 초기화 완료');

            return {
                success: true,
                capabilities: this.getSensorCapabilities(),
                calibration: this.getCalibrationStatus()
            };

        } catch (error) {
            console.error('Acceleration 센서 초기화 실패:', error);
            return { success: false, error: error.message };
        }
    }

    async checkSensorSupport() {
        const support = {
            deviceMotion: 'DeviceMotionEvent' in window,
            acceleration: false,
            accelerationIncludingGravity: false,
            permissions: 'DeviceMotionEvent' in window &&
                        'requestPermission' in DeviceMotionEvent
        };

        // 실제 센서 데이터 가용성 테스트
        if (support.deviceMotion) {
            const testResult = await this.testSensorData();
            support.acceleration = testResult.hasAcceleration;
            support.accelerationIncludingGravity = testResult.hasAccelerationIncludingGravity;
        }

        this.sensorSupport = support;

        if (!support.deviceMotion || (!support.acceleration && !support.accelerationIncludingGravity)) {
            throw new Error('가속도 센서가 지원되지 않거나 사용할 수 없습니다.');
        }

        // iOS 권한 요청
        if (support.permissions) {
            const permission = await DeviceMotionEvent.requestPermission();
            if (permission !== 'granted') {
                throw new Error('가속도 센서 접근 권한이 거부되었습니다.');
            }
        }
    }

    async testSensorData() {
        return new Promise((resolve) => {
            let hasAcceleration = false;
            let hasAccelerationIncludingGravity = false;

            const testListener = (event) => {
                if (event.acceleration &&
                    (event.acceleration.x !== null ||
                     event.acceleration.y !== null ||
                     event.acceleration.z !== null)) {
                    hasAcceleration = true;
                }

                if (event.accelerationIncludingGravity &&
                    (event.accelerationIncludingGravity.x !== null ||
                     event.accelerationIncludingGravity.y !== null ||
                     event.accelerationIncludingGravity.z !== null)) {
                    hasAccelerationIncludingGravity = true;
                }

                window.removeEventListener('devicemotion', testListener);
                resolve({ hasAcceleration, hasAccelerationIncludingGravity });
            };

            window.addEventListener('devicemotion', testListener);

            // 2초 후 타임아웃
            setTimeout(() => {
                window.removeEventListener('devicemotion', testListener);
                resolve({ hasAcceleration, hasAccelerationIncludingGravity });
            }, 2000);
        });
    }

    async performGravityCalibration() {
        console.log('중력 벡터 캘리브레이션 시작...');

        return new Promise((resolve) => {
            const calibrationData = [];
            let sampleCount = 0;
            const targetSamples = 60; // 1초간 샘플링 (60Hz 기준)

            const calibrationListener = (event) => {
                const acceleration = this.extractAccelerationData(event);

                if (acceleration && sampleCount < targetSamples) {
                    calibrationData.push(acceleration);
                    sampleCount++;
                } else if (sampleCount >= targetSamples) {
                    window.removeEventListener('devicemotion', calibrationListener);

                    // 평균 중력 벡터 계산
                    this.gravityVector = this.calculateAverageGravity(calibrationData);
                    console.log('중력 벡터 캘리브레이션 완료:', this.gravityVector);

                    resolve(this.gravityVector);
                }
            };

            window.addEventListener('devicemotion', calibrationListener);
        });
    }

    extractAccelerationData(event) {
        // acceleration 우선, 없으면 accelerationIncludingGravity 사용
        if (event.acceleration &&
            event.acceleration.x !== null &&
            event.acceleration.y !== null &&
            event.acceleration.z !== null) {
            return {
                x: event.acceleration.x,
                y: event.acceleration.y,
                z: event.acceleration.z,
                includesGravity: false,
                timestamp: Date.now()
            };
        } else if (event.accelerationIncludingGravity &&
                   event.accelerationIncludingGravity.x !== null &&
                   event.accelerationIncludingGravity.y !== null &&
                   event.accelerationIncludingGravity.z !== null) {
            return {
                x: event.accelerationIncludingGravity.x,
                y: event.accelerationIncludingGravity.y,
                z: event.accelerationIncludingGravity.z,
                includesGravity: true,
                timestamp: Date.now()
            };
        }

        return null;
    }

    calculateAverageGravity(calibrationData) {
        // 중력이 포함된 데이터에서 평균 중력 벡터 추출
        const gravityData = calibrationData.filter(d => d.includesGravity);

        if (gravityData.length === 0) {
            return { x: 0, y: 9.81, z: 0 }; // 기본 중력 벡터
        }

        const avgGravity = {
            x: gravityData.reduce((sum, d) => sum + d.x, 0) / gravityData.length,
            y: gravityData.reduce((sum, d) => sum + d.y, 0) / gravityData.length,
            z: gravityData.reduce((sum, d) => sum + d.z, 0) / gravityData.length
        };

        // 중력 벡터 크기 정규화 (9.81 m/s²)
        const magnitude = Math.sqrt(avgGravity.x**2 + avgGravity.y**2 + avgGravity.z**2);
        const scale = 9.81 / magnitude;

        return {
            x: avgGravity.x * scale,
            y: avgGravity.y * scale,
            z: avgGravity.z * scale
        };
    }

    // 실시간 가속도 데이터 처리
    processAccelerationData(rawAcceleration) {
        // 1. AI 기반 노이즈 제거 및 필터링
        const filtered = this.aiProcessor.applyIntelligentFiltering(rawAcceleration);

        // 2. 중력 분리 (필요한 경우)
        const linearAcceleration = this.separateGravity(filtered);

        // 3. 물리적 특성 계산
        const physicalProperties = this.calculatePhysicalProperties(linearAcceleration);

        // 4. 움직임 패턴 인식
        const motionPattern = this.motionRecognizer.analyzeMotion(linearAcceleration);

        // 5. 게임 컨텍스트에 맞는 처리
        const gameProcessed = this.processForGameContext(physicalProperties, motionPattern);

        // 6. 성능 최적화 적용
        const optimized = this.performanceOptimizer.optimize(gameProcessed);

        return {
            raw: rawAcceleration,
            filtered: filtered,
            linear: linearAcceleration,
            physical: physicalProperties,
            motion: motionPattern,
            game: gameProcessed,
            optimized: optimized,
            timestamp: Date.now()
        };
    }

    separateGravity(acceleration) {
        if (!acceleration.includesGravity) {
            // 이미 중력이 제거된 데이터
            return {
                x: acceleration.x,
                y: acceleration.y,
                z: acceleration.z,
                magnitude: Math.sqrt(acceleration.x**2 + acceleration.y**2 + acceleration.z**2)
            };
        }

        // 중력 벡터 제거
        const linear = {
            x: acceleration.x - this.gravityVector.x,
            y: acceleration.y - this.gravityVector.y,
            z: acceleration.z - this.gravityVector.z
        };

        linear.magnitude = Math.sqrt(linear.x**2 + linear.y**2 + linear.z**2);

        return linear;
    }

    calculatePhysicalProperties(linearAcceleration) {
        const deltaTime = this.getTimeDelta();

        // 속도 적분 (간단한 오일러 적분)
        this.velocity = {
            x: this.velocity.x + linearAcceleration.x * deltaTime,
            y: this.velocity.y + linearAcceleration.y * deltaTime,
            z: this.velocity.z + linearAcceleration.z * deltaTime
        };

        // 변위 적분
        this.displacement = {
            x: this.displacement.x + this.velocity.x * deltaTime,
            y: this.displacement.y + this.velocity.y * deltaTime,
            z: this.displacement.z + this.velocity.z * deltaTime
        };

        // 가속도 방향
        const direction = linearAcceleration.magnitude > 0.01 ? {
            x: linearAcceleration.x / linearAcceleration.magnitude,
            y: linearAcceleration.y / linearAcceleration.magnitude,
            z: linearAcceleration.z / linearAcceleration.magnitude
        } : { x: 0, y: 0, z: 0 };

        return {
            acceleration: linearAcceleration,
            velocity: { ...this.velocity },
            displacement: { ...this.displacement },
            direction: direction,
            jerk: this.calculateJerk(linearAcceleration),
            energy: this.calculateKineticEnergy()
        };
    }

    calculateJerk(currentAcceleration) {
        if (!this.previousAcceleration) {
            this.previousAcceleration = currentAcceleration;
            return { x: 0, y: 0, z: 0, magnitude: 0 };
        }

        const deltaTime = this.getTimeDelta();
        const jerk = {
            x: (currentAcceleration.x - this.previousAcceleration.x) / deltaTime,
            y: (currentAcceleration.y - this.previousAcceleration.y) / deltaTime,
            z: (currentAcceleration.z - this.previousAcceleration.z) / deltaTime
        };

        jerk.magnitude = Math.sqrt(jerk.x**2 + jerk.y**2 + jerk.z**2);

        this.previousAcceleration = currentAcceleration;
        return jerk;
    }

    calculateKineticEnergy() {
        const velocityMagnitude = Math.sqrt(
            this.velocity.x**2 + this.velocity.y**2 + this.velocity.z**2
        );

        // 단위 질량당 운동 에너지 (1/2 * v²)
        return 0.5 * velocityMagnitude**2;
    }

    getTimeDelta() {
        const now = Date.now();
        const delta = this.lastTimestamp ? (now - this.lastTimestamp) / 1000 : 0.016; // 기본 60fps
        this.lastTimestamp = now;
        return Math.min(delta, 0.1); // 최대 100ms로 제한
    }

    processForGameContext(physicalProperties, motionPattern) {
        const context = this.contextManager.getCurrentContext();
        const gameSettings = this.getGameSpecificSettings(context);

        return {
            // 게임용 정규화된 값들
            tiltIntensity: this.mapToGameRange(physicalProperties.acceleration.magnitude, 0, 20, 0, 1),

            // 방향별 강도
            directions: {
                left: Math.max(0, -physicalProperties.acceleration.x) * gameSettings.sensitivity.x,
                right: Math.max(0, physicalProperties.acceleration.x) * gameSettings.sensitivity.x,
                up: Math.max(0, -physicalProperties.acceleration.y) * gameSettings.sensitivity.y,
                down: Math.max(0, physicalProperties.acceleration.y) * gameSettings.sensitivity.y,
                forward: Math.max(0, physicalProperties.acceleration.z) * gameSettings.sensitivity.z,
                backward: Math.max(0, -physicalProperties.acceleration.z) * gameSettings.sensitivity.z
            },

            // 움직임 상태
            state: {
                isMoving: physicalProperties.acceleration.magnitude > gameSettings.movementThreshold,
                isShaking: motionPattern.type === 'shake',
                isImpact: motionPattern.type === 'impact',
                movementType: motionPattern.type,
                intensity: motionPattern.intensity
            },

            // 물리적 특성
            physics: {
                force: physicalProperties.acceleration.magnitude,
                velocity: Math.sqrt(
                    physicalProperties.velocity.x**2 +
                    physicalProperties.velocity.y**2 +
                    physicalProperties.velocity.z**2
                ),
                energy: physicalProperties.energy
            }
        };
    }

    getGameSpecificSettings(context) {
        const defaultSettings = {
            sensitivity: { x: 1.0, y: 1.0, z: 1.0 },
            movementThreshold: 1.0,
            impactThreshold: 10.0,
            shakeThreshold: 5.0
        };

        if (!context || !context.gameType) {
            return defaultSettings;
        }

        // 게임 타입별 최적화된 설정
        const gameSettings = {
            'racing': {
                sensitivity: { x: 2.0, y: 0.5, z: 1.0 }, // 좌우 민감도 높음
                movementThreshold: 0.5,
                impactThreshold: 15.0,
                shakeThreshold: 8.0
            },
            'platformer': {
                sensitivity: { x: 1.5, y: 2.0, z: 0.8 }, // 상하 민감도 높음
                movementThreshold: 1.5,
                impactThreshold: 12.0,
                shakeThreshold: 6.0
            },
            'puzzle': {
                sensitivity: { x: 0.8, y: 0.8, z: 0.8 }, // 전체적으로 낮은 민감도
                movementThreshold: 2.0,
                impactThreshold: 8.0,
                shakeThreshold: 10.0
            },
            'action': {
                sensitivity: { x: 1.8, y: 1.8, z: 1.5 }, // 높은 반응성
                movementThreshold: 0.8,
                impactThreshold: 20.0,
                shakeThreshold: 4.0
            }
        };

        return gameSettings[context.gameType] || defaultSettings;
    }

    mapToGameRange(value, inMin, inMax, outMin, outMax) {
        const clamped = Math.max(inMin, Math.min(inMax, value));
        const normalized = (clamped - inMin) / (inMax - inMin);
        return outMin + normalized * (outMax - outMin);
    }
}
```

---

## 🤖 AI 기반 가속도 데이터 처리

### 1. 지능형 필터링 및 노이즈 제거
```javascript
class AIAccelerationProcessor {
    constructor() {
        this.adaptiveFilter = new AdaptiveAccelerationFilter();
        this.outlierDetector = new AccelerationOutlierDetector();
        this.predictionModel = new AccelerationPredictionModel();
        this.qualityAssessor = new AccelerationQualityAssessor();

        this.processingHistory = [];
        this.filteringStrategies = new Map();

        this.initializeFilteringStrategies();
    }

    initializeFilteringStrategies() {
        // 컨텍스트별 필터링 전략
        this.filteringStrategies.set('high_noise', {
            primaryFilter: 'kalman',
            secondaryFilter: 'median',
            windowSize: 5,
            adaptationRate: 0.02
        });

        this.filteringStrategies.set('normal', {
            primaryFilter: 'complementary',
            secondaryFilter: 'lowpass',
            windowSize: 3,
            adaptationRate: 0.01
        });

        this.filteringStrategies.set('low_latency', {
            primaryFilter: 'simple_average',
            secondaryFilter: null,
            windowSize: 2,
            adaptationRate: 0.005
        });

        this.filteringStrategies.set('precision', {
            primaryFilter: 'butterworth',
            secondaryFilter: 'savgol',
            windowSize: 7,
            adaptationRate: 0.015
        });
    }

    applyIntelligentFiltering(rawData) {
        // 1. 데이터 품질 평가
        const qualityMetrics = this.qualityAssessor.evaluate(rawData);

        // 2. 이상치 감지 및 처리
        const outlierResult = this.outlierDetector.detect(rawData);
        if (outlierResult.isOutlier) {
            return this.handleOutlier(rawData, outlierResult);
        }

        // 3. 최적 필터링 전략 선택
        const strategy = this.selectFilteringStrategy(qualityMetrics);

        // 4. 주 필터 적용
        let filtered = this.applyPrimaryFilter(rawData, strategy);

        // 5. 보조 필터 적용 (필요한 경우)
        if (strategy.secondaryFilter) {
            filtered = this.applySecondaryFilter(filtered, strategy);
        }

        // 6. 예측 모델을 통한 보정
        const predicted = this.predictionModel.enhance(filtered);

        // 7. 적응형 조정
        this.adaptiveFilter.updateParameters(qualityMetrics, strategy);

        // 8. 처리 이력 저장
        this.recordProcessingHistory(rawData, filtered, predicted, qualityMetrics);

        return predicted;
    }

    selectFilteringStrategy(qualityMetrics) {
        let strategyKey = 'normal';

        // 노이즈 레벨 기반 전략 선택
        if (qualityMetrics.noiseLevel > 0.8) {
            strategyKey = 'high_noise';
        } else if (qualityMetrics.latencyRequirement === 'low') {
            strategyKey = 'low_latency';
        } else if (qualityMetrics.precisionRequirement === 'high') {
            strategyKey = 'precision';
        }

        const strategy = this.filteringStrategies.get(strategyKey);

        // 동적 파라미터 조정
        return this.adaptStrategyParameters(strategy, qualityMetrics);
    }

    adaptStrategyParameters(baseStrategy, qualityMetrics) {
        const adaptedStrategy = { ...baseStrategy };

        // 노이즈 레벨에 따른 윈도우 크기 조정
        if (qualityMetrics.noiseLevel > 0.6) {
            adaptedStrategy.windowSize = Math.min(adaptedStrategy.windowSize + 2, 10);
        } else if (qualityMetrics.noiseLevel < 0.3) {
            adaptedStrategy.windowSize = Math.max(adaptedStrategy.windowSize - 1, 2);
        }

        // 움직임 패턴에 따른 적응율 조정
        if (qualityMetrics.movementPattern === 'rapid') {
            adaptedStrategy.adaptationRate *= 1.5;
        } else if (qualityMetrics.movementPattern === 'stable') {
            adaptedStrategy.adaptationRate *= 0.7;
        }

        return adaptedStrategy;
    }

    applyPrimaryFilter(data, strategy) {
        switch (strategy.primaryFilter) {
            case 'kalman':
                return this.applyKalmanFilter(data, strategy);
            case 'complementary':
                return this.applyComplementaryFilter(data, strategy);
            case 'butterworth':
                return this.applyButterworthFilter(data, strategy);
            case 'simple_average':
                return this.applySimpleAverageFilter(data, strategy);
            default:
                return data;
        }
    }

    applyKalmanFilter(data, strategy) {
        // 3축 칼만 필터 구현
        if (!this.kalmanStates) {
            this.kalmanStates = {
                x: { estimate: 0, errorCovariance: 1 },
                y: { estimate: 0, errorCovariance: 1 },
                z: { estimate: 0, errorCovariance: 1 }
            };
        }

        const processNoise = 0.01;
        const measurementNoise = qualityMetrics?.noiseLevel || 0.1;

        ['x', 'y', 'z'].forEach(axis => {
            const state = this.kalmanStates[axis];

            // Prediction step
            state.errorCovariance += processNoise;

            // Update step
            const kalmanGain = state.errorCovariance / (state.errorCovariance + measurementNoise);
            state.estimate = state.estimate + kalmanGain * (data[axis] - state.estimate);
            state.errorCovariance = (1 - kalmanGain) * state.errorCovariance;
        });

        return {
            x: this.kalmanStates.x.estimate,
            y: this.kalmanStates.y.estimate,
            z: this.kalmanStates.z.estimate,
            timestamp: data.timestamp,
            includesGravity: data.includesGravity,
            confidence: Math.max(0.1, 1 - measurementNoise)
        };
    }

    applyComplementaryFilter(data, strategy) {
        if (!this.complementaryState) {
            this.complementaryState = { x: data.x, y: data.y, z: data.z };
        }

        const alpha = 0.8; // 고주파 차단 계수

        const filtered = {
            x: alpha * this.complementaryState.x + (1 - alpha) * data.x,
            y: alpha * this.complementaryState.y + (1 - alpha) * data.y,
            z: alpha * this.complementaryState.z + (1 - alpha) * data.z,
            timestamp: data.timestamp,
            includesGravity: data.includesGravity,
            confidence: 0.85
        };

        this.complementaryState = filtered;
        return filtered;
    }

    applyButterworthFilter(data, strategy) {
        // 2차 Butterworth 저역통과 필터 구현
        if (!this.butterworthState) {
            this.butterworthState = {
                x: { x1: 0, x2: 0, y1: 0, y2: 0 },
                y: { x1: 0, x2: 0, y1: 0, y2: 0 },
                z: { x1: 0, x2: 0, y1: 0, y2: 0 }
            };
        }

        const cutoffFreq = 10; // 10Hz 차단 주파수
        const sampleRate = 60; // 60Hz 샘플링
        const nyquist = sampleRate / 2;
        const normalizedCutoff = cutoffFreq / nyquist;

        // Butterworth 계수 계산
        const wc = Math.tan((Math.PI * normalizedCutoff) / 2);
        const k1 = Math.sqrt(2) * wc;
        const k2 = wc * wc;
        const a = k2 + k1 + 1;
        const b1 = (2 * (k2 - 1)) / a;
        const b2 = (k2 - k1 + 1) / a;
        const a1 = (2 * k2) / a;
        const a2 = k2 / a;

        const filtered = {};

        ['x', 'y', 'z'].forEach(axis => {
            const state = this.butterworthState[axis];

            const output = a1 * data[axis] + a2 * state.x1 + a1 * state.x2 - b1 * state.y1 - b2 * state.y2;

            // 상태 업데이트
            state.x2 = state.x1;
            state.x1 = data[axis];
            state.y2 = state.y1;
            state.y1 = output;

            filtered[axis] = output;
        });

        return {
            ...filtered,
            timestamp: data.timestamp,
            includesGravity: data.includesGravity,
            confidence: 0.9
        };
    }

    handleOutlier(data, outlierResult) {
        console.warn('가속도 데이터 이상치 감지:', outlierResult.reason);

        // 이전 유효한 데이터로 대체
        if (this.lastValidData) {
            return {
                ...this.lastValidData,
                timestamp: data.timestamp,
                confidence: 0.3, // 낮은 신뢰도
                interpolated: true
            };
        }

        // 이전 데이터가 없으면 영벡터 반환
        return {
            x: 0, y: 0, z: 0,
            timestamp: data.timestamp,
            includesGravity: data.includesGravity,
            confidence: 0.1,
            interpolated: true
        };
    }

    recordProcessingHistory(raw, filtered, predicted, quality) {
        const record = {
            timestamp: Date.now(),
            raw: { ...raw },
            filtered: { ...filtered },
            predicted: { ...predicted },
            quality: { ...quality }
        };

        this.processingHistory.push(record);

        // 최근 100개 기록만 유지
        if (this.processingHistory.length > 100) {
            this.processingHistory.shift();
        }

        // 필터 성능 분석
        this.analyzeFilterPerformance();
    }

    analyzeFilterPerformance() {
        if (this.processingHistory.length < 20) return;

        const recent = this.processingHistory.slice(-20);

        // 노이즈 감소율 계산
        const noiseReduction = this.calculateNoiseReduction(recent);

        // 지연 시간 분석
        const latencyAnalysis = this.analyzeProcessingLatency(recent);

        // 정확도 평가
        const accuracyMetrics = this.evaluateFilterAccuracy(recent);

        // 성능 메트릭 업데이트
        this.updatePerformanceMetrics({
            noiseReduction,
            latencyAnalysis,
            accuracyMetrics
        });
    }

    calculateNoiseReduction(records) {
        const rawVariances = this.calculateVariances(records.map(r => r.raw));
        const filteredVariances = this.calculateVariances(records.map(r => r.filtered));

        return {
            x: Math.max(0, (rawVariances.x - filteredVariances.x) / rawVariances.x),
            y: Math.max(0, (rawVariances.y - filteredVariances.y) / rawVariances.y),
            z: Math.max(0, (rawVariances.z - filteredVariances.z) / rawVariances.z)
        };
    }

    calculateVariances(dataArray) {
        const means = {
            x: dataArray.reduce((sum, d) => sum + d.x, 0) / dataArray.length,
            y: dataArray.reduce((sum, d) => sum + d.y, 0) / dataArray.length,
            z: dataArray.reduce((sum, d) => sum + d.z, 0) / dataArray.length
        };

        return {
            x: dataArray.reduce((sum, d) => sum + Math.pow(d.x - means.x, 2), 0) / dataArray.length,
            y: dataArray.reduce((sum, d) => sum + Math.pow(d.y - means.y, 2), 0) / dataArray.length,
            z: dataArray.reduce((sum, d) => sum + Math.pow(d.z - means.z, 2), 0) / dataArray.length
        };
    }
}

// 가속도 데이터 품질 평가기
class AccelerationQualityAssessor {
    evaluate(data) {
        return {
            noiseLevel: this.assessNoiseLevel(data),
            dataIntegrity: this.assessDataIntegrity(data),
            movementPattern: this.identifyMovementPattern(data),
            precisionRequirement: this.determinePrecisionRequirement(),
            latencyRequirement: this.determineLatencyRequirement(),
            overallQuality: this.calculateOverallQuality(data)
        };
    }

    assessNoiseLevel(data) {
        // 최근 데이터와의 변화율 기반 노이즈 평가
        if (!this.previousData) {
            this.previousData = data;
            return 0.5; // 기본값
        }

        const change = Math.sqrt(
            Math.pow(data.x - this.previousData.x, 2) +
            Math.pow(data.y - this.previousData.y, 2) +
            Math.pow(data.z - this.previousData.z, 2)
        );

        this.previousData = data;

        // 변화율을 0-1 범위로 정규화
        return Math.min(1.0, change / 20); // 20 m/s² 기준
    }

    assessDataIntegrity(data) {
        // 데이터 무결성 검사
        let integrity = 1.0;

        // NaN 또는 무한대 값 검사
        if (!isFinite(data.x) || !isFinite(data.y) || !isFinite(data.z)) {
            integrity -= 0.5;
        }

        // 비현실적인 값 검사 (±50g 제한)
        const maxAcceleration = 50 * 9.81; // 50g
        if (Math.abs(data.x) > maxAcceleration ||
            Math.abs(data.y) > maxAcceleration ||
            Math.abs(data.z) > maxAcceleration) {
            integrity -= 0.3;
        }

        // 시간 스탬프 검사
        if (!data.timestamp || data.timestamp <= 0) {
            integrity -= 0.2;
        }

        return Math.max(0, integrity);
    }

    identifyMovementPattern(data) {
        const magnitude = Math.sqrt(data.x**2 + data.y**2 + data.z**2);

        if (magnitude < 2) return 'stable';
        if (magnitude < 10) return 'moderate';
        if (magnitude < 30) return 'rapid';
        return 'extreme';
    }
}
```

---

## 🎯 물리 기반 움직임 인식

### 1. 실시간 움직임 패턴 분석
```javascript
class MotionPatternRecognizer {
    constructor(userSatisfactionTracker) {
        this.satisfactionTracker = userSatisfactionTracker;
        this.patternBuffer = [];
        this.knownPatterns = new Map();
        this.learningEngine = new MotionLearningEngine();

        this.initializeKnownPatterns();
    }

    initializeKnownPatterns() {
        // 기본 움직임 패턴 정의
        this.knownPatterns.set('shake', {
            characteristics: {
                oscillationFreq: { min: 2, max: 8 }, // Hz
                amplitude: { min: 5, max: 50 }, // m/s²
                duration: { min: 0.5, max: 3 }, // seconds
                axes: ['x', 'y', 'z'], // 모든 축에서 발생 가능
                symmetry: 'high' // 대칭적 움직임
            },
            confidence: 0.85,
            gameActions: ['special_move', 'reset', 'power_up']
        });

        this.knownPatterns.set('tap', {
            characteristics: {
                peakIntensity: { min: 10, max: 100 }, // m/s²
                duration: { min: 0.05, max: 0.3 }, // seconds
                sharpness: 'high', // 급격한 변화
                recovery: 'fast' // 빠른 원상복구
            },
            confidence: 0.9,
            gameActions: ['select', 'attack', 'jump']
        });

        this.knownPatterns.set('tilt', {
            characteristics: {
                sustainedForce: { min: 2, max: 20 }, // m/s²
                duration: { min: 0.2, max: 5 }, // seconds
                direction: 'consistent', // 일관된 방향
                gradual: true // 점진적 변화
            },
            confidence: 0.8,
            gameActions: ['steer', 'balance', 'aim']
        });

        this.knownPatterns.set('impact', {
            characteristics: {
                peakIntensity: { min: 20, max: 200 }, // m/s²
                duration: { min: 0.01, max: 0.2 }, // seconds
                sharpness: 'extreme', // 매우 급격한 변화
                aftershock: true // 여진 존재
            },
            confidence: 0.75,
            gameActions: ['collision', 'explosion', 'destruction']
        });

        this.knownPatterns.set('rotate', {
            characteristics: {
                circularMotion: true,
                centripetal: { min: 3, max: 30 }, // m/s²
                duration: { min: 0.5, max: 10 }, // seconds
                rhythm: 'consistent' // 일정한 리듬
            },
            confidence: 0.7,
            gameActions: ['spin', 'drill', 'tornado']
        });
    }

    analyzeMotion(accelerationData) {
        // 1. 패턴 버퍼에 데이터 추가
        this.addToPatternBuffer(accelerationData);

        // 2. 실시간 패턴 매칭
        const detectedPatterns = this.detectPatterns();

        // 3. 신뢰도 기반 패턴 선택
        const bestPattern = this.selectBestPattern(detectedPatterns);

        // 4. 패턴 정제 및 보강
        const refinedPattern = this.refinePattern(bestPattern);

        // 5. 학습 데이터 수집
        this.collectLearningData(refinedPattern);

        return refinedPattern;
    }

    addToPatternBuffer(data) {
        this.patternBuffer.push({
            ...data,
            magnitude: Math.sqrt(data.x**2 + data.y**2 + data.z**2),
            timestamp: Date.now()
        });

        // 3초간의 데이터만 유지
        const cutoff = Date.now() - 3000;
        this.patternBuffer = this.patternBuffer.filter(item => item.timestamp > cutoff);
    }

    detectPatterns() {
        const detectedPatterns = [];

        this.knownPatterns.forEach((pattern, patternName) => {
            const match = this.matchPattern(patternName, pattern);
            if (match.confidence > 0.6) {
                detectedPatterns.push({
                    name: patternName,
                    ...match
                });
            }
        });

        return detectedPatterns;
    }

    matchPattern(patternName, patternDef) {
        if (this.patternBuffer.length < 5) {
            return { confidence: 0, characteristics: {} };
        }

        switch (patternName) {
            case 'shake':
                return this.matchShakePattern(patternDef);
            case 'tap':
                return this.matchTapPattern(patternDef);
            case 'tilt':
                return this.matchTiltPattern(patternDef);
            case 'impact':
                return this.matchImpactPattern(patternDef);
            case 'rotate':
                return this.matchRotatePattern(patternDef);
            default:
                return { confidence: 0, characteristics: {} };
        }
    }

    matchShakePattern(patternDef) {
        const magnitudes = this.patternBuffer.map(d => d.magnitude);

        // 진동 주파수 분석
        const oscillations = this.countOscillations(magnitudes);
        const duration = (this.patternBuffer[this.patternBuffer.length - 1].timestamp -
                         this.patternBuffer[0].timestamp) / 1000;
        const frequency = oscillations / duration;

        // 진폭 분석
        const maxMagnitude = Math.max(...magnitudes);
        const avgMagnitude = magnitudes.reduce((sum, m) => sum + m, 0) / magnitudes.length;

        // 대칭성 분석
        const symmetry = this.analyzeSymmetry(this.patternBuffer);

        // 패턴 매칭 점수 계산
        let confidence = 0;

        if (frequency >= patternDef.characteristics.oscillationFreq.min &&
            frequency <= patternDef.characteristics.oscillationFreq.max) {
            confidence += 0.3;
        }

        if (maxMagnitude >= patternDef.characteristics.amplitude.min &&
            maxMagnitude <= patternDef.characteristics.amplitude.max) {
            confidence += 0.3;
        }

        if (duration >= patternDef.characteristics.duration.min &&
            duration <= patternDef.characteristics.duration.max) {
            confidence += 0.2;
        }

        if (symmetry > 0.7) {
            confidence += 0.2;
        }

        return {
            confidence: Math.min(1.0, confidence),
            characteristics: {
                frequency: frequency,
                amplitude: maxMagnitude,
                duration: duration,
                symmetry: symmetry,
                oscillations: oscillations
            },
            intensity: avgMagnitude / 20, // 정규화
            gameActions: patternDef.gameActions
        };
    }

    matchTapPattern(patternDef) {
        if (this.patternBuffer.length < 3) {
            return { confidence: 0, characteristics: {} };
        }

        const recent = this.patternBuffer.slice(-10); // 최근 10개 데이터
        const magnitudes = recent.map(d => d.magnitude);

        // 피크 강도 감지
        const peakIntensity = Math.max(...magnitudes);
        const peakIndex = magnitudes.indexOf(peakIntensity);

        // 급격한 증가와 감소 확인
        const beforePeak = magnitudes.slice(0, peakIndex);
        const afterPeak = magnitudes.slice(peakIndex + 1);

        const sharpnessScore = this.calculateSharpness(beforePeak, peakIntensity, afterPeak);
        const recoverySpeed = this.calculateRecoverySpeed(afterPeak);

        // 지속 시간 계산
        const duration = (recent[recent.length - 1].timestamp - recent[0].timestamp) / 1000;

        let confidence = 0;

        if (peakIntensity >= patternDef.characteristics.peakIntensity.min &&
            peakIntensity <= patternDef.characteristics.peakIntensity.max) {
            confidence += 0.4;
        }

        if (duration >= patternDef.characteristics.duration.min &&
            duration <= patternDef.characteristics.duration.max) {
            confidence += 0.3;
        }

        if (sharpnessScore > 0.7) {
            confidence += 0.2;
        }

        if (recoverySpeed > 0.6) {
            confidence += 0.1;
        }

        return {
            confidence: Math.min(1.0, confidence),
            characteristics: {
                peakIntensity: peakIntensity,
                sharpness: sharpnessScore,
                recovery: recoverySpeed,
                duration: duration
            },
            intensity: peakIntensity / 50, // 정규화
            gameActions: patternDef.gameActions
        };
    }

    matchTiltPattern(patternDef) {
        const magnitudes = this.patternBuffer.map(d => d.magnitude);
        const avgMagnitude = magnitudes.reduce((sum, m) => sum + m, 0) / magnitudes.length;

        // 방향 일관성 분석
        const directions = this.patternBuffer.map(d => ({
            x: d.x / (d.magnitude || 1),
            y: d.y / (d.magnitude || 1),
            z: d.z / (d.magnitude || 1)
        }));

        const directionConsistency = this.calculateDirectionConsistency(directions);

        // 점진적 변화 분석
        const gradualness = this.analyzeGradualness(magnitudes);

        const duration = (this.patternBuffer[this.patternBuffer.length - 1].timestamp -
                         this.patternBuffer[0].timestamp) / 1000;

        let confidence = 0;

        if (avgMagnitude >= patternDef.characteristics.sustainedForce.min &&
            avgMagnitude <= patternDef.characteristics.sustainedForce.max) {
            confidence += 0.3;
        }

        if (duration >= patternDef.characteristics.duration.min &&
            duration <= patternDef.characteristics.duration.max) {
            confidence += 0.3;
        }

        if (directionConsistency > 0.7) {
            confidence += 0.2;
        }

        if (gradualness > 0.6) {
            confidence += 0.2;
        }

        return {
            confidence: Math.min(1.0, confidence),
            characteristics: {
                sustainedForce: avgMagnitude,
                directionConsistency: directionConsistency,
                gradualness: gradualness,
                duration: duration
            },
            intensity: avgMagnitude / 10, // 정규화
            gameActions: patternDef.gameActions
        };
    }

    matchImpactPattern(patternDef) {
        const magnitudes = this.patternBuffer.map(d => d.magnitude);
        const peakIntensity = Math.max(...magnitudes);

        // 충격 이후 여진 분석
        const peakIndex = magnitudes.indexOf(peakIntensity);
        const aftershock = this.analyzeAftershock(magnitudes.slice(peakIndex));

        // 극도의 급격함 분석
        const extremeSharpness = this.calculateExtremeSharpness(magnitudes, peakIndex);

        const duration = (this.patternBuffer[this.patternBuffer.length - 1].timestamp -
                         this.patternBuffer[0].timestamp) / 1000;

        let confidence = 0;

        if (peakIntensity >= patternDef.characteristics.peakIntensity.min &&
            peakIntensity <= patternDef.characteristics.peakIntensity.max) {
            confidence += 0.4;
        }

        if (duration >= patternDef.characteristics.duration.min &&
            duration <= patternDef.characteristics.duration.max) {
            confidence += 0.2;
        }

        if (extremeSharpness > 0.8) {
            confidence += 0.3;
        }

        if (aftershock.detected) {
            confidence += 0.1;
        }

        return {
            confidence: Math.min(1.0, confidence),
            characteristics: {
                peakIntensity: peakIntensity,
                extremeSharpness: extremeSharpness,
                aftershock: aftershock,
                duration: duration
            },
            intensity: Math.min(1.0, peakIntensity / 100), // 정규화
            gameActions: patternDef.gameActions
        };
    }

    // 유틸리티 메서드들
    countOscillations(magnitudes, threshold = 2) {
        let oscillations = 0;
        let direction = 0; // 1 for increasing, -1 for decreasing

        for (let i = 1; i < magnitudes.length; i++) {
            const diff = magnitudes[i] - magnitudes[i - 1];

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

    analyzeSymmetry(buffer) {
        if (buffer.length < 6) return 0;

        const midPoint = Math.floor(buffer.length / 2);
        const firstHalf = buffer.slice(0, midPoint);
        const secondHalf = buffer.slice(-midPoint).reverse();

        const differences = firstHalf.map((first, index) => {
            const second = secondHalf[index];
            return Math.abs(first.magnitude - second.magnitude);
        });

        const avgDifference = differences.reduce((sum, diff) => sum + diff, 0) / differences.length;
        const maxMagnitude = Math.max(...buffer.map(d => d.magnitude));

        return Math.max(0, 1 - (avgDifference / maxMagnitude));
    }

    calculateSharpness(before, peak, after) {
        const increaseRate = before.length > 0 ?
            (peak - Math.max(...before)) / before.length : 0;
        const decreaseRate = after.length > 0 ?
            (peak - Math.min(...after)) / after.length : 0;

        return Math.min(1.0, (increaseRate + decreaseRate) / 20);
    }

    calculateRecoverySpeed(afterPeak) {
        if (afterPeak.length < 2) return 0;

        const initialLevel = afterPeak[0];
        const finalLevel = afterPeak[afterPeak.length - 1];
        const recoveryRatio = (initialLevel - finalLevel) / initialLevel;

        return Math.max(0, Math.min(1, recoveryRatio));
    }

    selectBestPattern(patterns) {
        if (patterns.length === 0) {
            return {
                type: 'none',
                confidence: 0,
                characteristics: {},
                intensity: 0,
                gameActions: []
            };
        }

        // 신뢰도가 가장 높은 패턴 선택
        const bestPattern = patterns.reduce((best, current) =>
            current.confidence > best.confidence ? current : best
        );

        return {
            type: bestPattern.name,
            confidence: bestPattern.confidence,
            characteristics: bestPattern.characteristics,
            intensity: bestPattern.intensity,
            gameActions: bestPattern.gameActions
        };
    }

    refinePattern(pattern) {
        if (pattern.type === 'none') return pattern;

        // 사용자 만족도를 고려한 패턴 정제
        const satisfactionScore = this.satisfactionTracker.getCurrentScore();

        // 만족도가 높으면 인식 민감도 증가
        if (satisfactionScore > 0.8) {
            pattern.confidence *= 1.1;
            pattern.intensity *= 1.05;
        } else if (satisfactionScore < 0.6) {
            // 만족도가 낮으면 더 엄격한 기준 적용
            pattern.confidence *= 0.9;
        }

        // 신뢰도 범위 제한
        pattern.confidence = Math.max(0, Math.min(1, pattern.confidence));
        pattern.intensity = Math.max(0, Math.min(1, pattern.intensity));

        return pattern;
    }

    collectLearningData(pattern) {
        if (pattern.type === 'none') return;

        const learningData = {
            pattern: pattern.type,
            confidence: pattern.confidence,
            characteristics: pattern.characteristics,
            bufferData: [...this.patternBuffer],
            userSatisfaction: this.satisfactionTracker.getCurrentScore(),
            timestamp: Date.now()
        };

        this.learningEngine.addTrainingData(learningData);
    }
}
```

---

## 🏁 마무리

이 Acceleration 센서 완전 활용 가이드는 가속도 센서 데이터를 통해 지능적이고 정확한 움직임 인식 시스템을 구현하는 포괄적인 방법들을 다루었습니다:

### ✅ 학습한 핵심 기술
1. **가속도 센서 기초** - DeviceMotion API 완전 이해 및 중력 분리
2. **AI 기반 데이터 처리** - 지능형 필터링, 이상치 감지, 적응형 처리
3. **물리 기반 움직임 인식** - 실시간 패턴 분석 및 물리적 특성 계산
4. **진동 및 충격 감지** - 정밀한 패턴 매칭 및 분류 시스템
5. **사용자 맞춤형 조정** - 만족도 기반 민감도 및 임계값 자동 조정
6. **실시간 성능 최적화** - 지연 시간 최소화 및 정확도 향상
7. **크로스 플랫폼 호환성** - iOS/Android 플랫폼별 최적화

### 🎯 실무 적용 가이드
- **단계적 구현**: 기본 센서 → 중력 분리 → AI 필터링 → 패턴 인식 → 개인화
- **품질 우선**: 데이터 품질 평가를 통한 신뢰할 수 있는 처리 파이프라인
- **사용자 중심**: 실시간 만족도 추적을 통한 지속적인 시스템 개선
- **성능 최적화**: 모바일 환경에 최적화된 효율적인 알고리즘 적용

### 💡 중요 포인트
> **AI 통합 가속도 센서 시스템은 사용자의 물리적 움직임을 정확하게 해석하고 게임 액션으로 변환합니다. 지능형 필터링과 패턴 인식을 통해 노이즈가 많은 환경에서도 안정적인 성능을 제공하며, 개인별 움직임 특성에 맞춘 최적화된 경험을 선사합니다.**

### 🔧 다음 단계 권장사항
- **고급 패턴 개발**: 복합 움직임 조합 및 연속 동작 인식
- **센서 융합 활용**: Orientation, RotationRate와의 통합 분석
- **머신러닝 모델**: 개인화된 움직임 학습 및 예측 시스템
- **햅틱 피드백**: 움직임 인식 결과에 따른 촉각 반응 시스템

---

**📚 관련 문서**
- [Orientation 센서 완전 활용법](orientation-sensor.md)
- [RotationRate 센서 완전 활용법](rotation-rate-sensor.md)
- [센서 융합 기법](sensor-fusion.md)
- [물리 엔진 활용 가이드](../game-development/04-physics-engine.md)