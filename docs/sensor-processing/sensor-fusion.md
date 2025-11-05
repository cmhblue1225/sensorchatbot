# 🔄 센서 융합 기법 - 다중 센서 통합 활용

## 📚 목차
1. [센서 융합 기초 이론](#센서-융합-기초-이론)
2. [AI 기반 융합 알고리즘](#ai-기반-융합-알고리즘)
3. [실시간 통합 처리 시스템](#실시간-통합-처리-시스템)
4. [고급 융합 기법](#고급-융합-기법)

---

## 🧬 센서 융합 기초 이론

### 1. 다중 센서 통합 관리자
```javascript
class SensorFusionManager {
    constructor(sessionSDK, contextManager, satisfactionTracker) {
        this.sdk = sessionSDK;
        this.contextManager = contextManager;
        this.satisfactionTracker = satisfactionTracker;

        // 센서 데이터 스트림
        this.sensorStreams = {
            orientation: new OrientationSensorStream(),
            acceleration: new AccelerationSensorStream(),
            rotationRate: new RotationRateSensorStream()
        };

        // 융합 엔진들
        this.fusionEngines = {
            complementary: new ComplementaryFusionEngine(),
            kalman: new KalmanFusionEngine(),
            particle: new ParticleFilterFusionEngine(),
            neural: new NeuralFusionEngine()
        };

        // AI 기반 융합 최적화
        this.fusionOptimizer = new AIFusionOptimizer();
        this.qualityController = new FusionQualityController();
        this.adaptiveSelector = new AdaptiveFusionSelector();

        this.fusedData = {
            orientation: { alpha: 0, beta: 0, gamma: 0 },
            motion: { velocity: { x: 0, y: 0, z: 0 }, acceleration: { x: 0, y: 0, z: 0 } },
            rotation: { angular_velocity: { x: 0, y: 0, z: 0 } },
            confidence: { overall: 0.5, breakdown: {} }
        };

        this.initializeFusion();
    }

    async initializeFusion() {
        console.log('센서 융합 시스템 초기화 시작...');

        try {
            // 1. 모든 센서 스트림 초기화
            await this.initializeSensorStreams();

            // 2. 센서 간 상관관계 분석
            await this.analyzeSensorCorrelations();

            // 3. 최적 융합 전략 결정
            await this.determineFusionStrategy();

            // 4. 실시간 융합 시작
            this.startRealTimeFusion();

            console.log('센서 융합 시스템 초기화 완료');
            return { success: true };

        } catch (error) {
            console.error('센서 융합 초기화 실패:', error);
            return { success: false, error: error.message };
        }
    }

    async initializeSensorStreams() {
        const results = await Promise.all([
            this.sensorStreams.orientation.initialize(),
            this.sensorStreams.acceleration.initialize(),
            this.sensorStreams.rotationRate.initialize()
        ]);

        // 사용 가능한 센서 확인
        this.availableSensors = {
            orientation: results[0].success,
            acceleration: results[1].success,
            rotationRate: results[2].success
        };

        console.log('사용 가능한 센서:', this.availableSensors);

        if (!results.some(r => r.success)) {
            throw new Error('사용 가능한 센서가 없습니다.');
        }
    }

    async analyzeSensorCorrelations() {
        console.log('센서 간 상관관계 분석 시작...');

        const correlationData = [];
        const analysisTime = 3000; // 3초간 분석

        return new Promise((resolve) => {
            const startTime = Date.now();

            const analysisInterval = setInterval(() => {
                const currentData = this.collectCurrentSensorData();

                if (currentData) {
                    correlationData.push(currentData);
                }

                if (Date.now() - startTime > analysisTime) {
                    clearInterval(analysisInterval);

                    this.sensorCorrelations = this.calculateCorrelations(correlationData);
                    console.log('센서 상관관계 분석 완료:', this.sensorCorrelations);

                    resolve(this.sensorCorrelations);
                }
            }, 50); // 20Hz 샘플링
        });
    }

    collectCurrentSensorData() {
        const data = {};

        if (this.availableSensors.orientation) {
            data.orientation = this.sensorStreams.orientation.getLatestData();
        }

        if (this.availableSensors.acceleration) {
            data.acceleration = this.sensorStreams.acceleration.getLatestData();
        }

        if (this.availableSensors.rotationRate) {
            data.rotationRate = this.sensorStreams.rotationRate.getLatestData();
        }

        return Object.keys(data).length > 0 ? data : null;
    }

    calculateCorrelations(correlationData) {
        if (correlationData.length < 20) {
            return { insufficient_data: true };
        }

        const correlations = {};

        // Orientation vs Acceleration 상관관계
        if (this.availableSensors.orientation && this.availableSensors.acceleration) {
            correlations.orientation_acceleration = this.calculateCrossCorrelation(
                correlationData.map(d => d.orientation),
                correlationData.map(d => d.acceleration)
            );
        }

        // Orientation vs RotationRate 상관관계
        if (this.availableSensors.orientation && this.availableSensors.rotationRate) {
            correlations.orientation_rotation = this.calculateCrossCorrelation(
                correlationData.map(d => d.orientation),
                correlationData.map(d => d.rotationRate)
            );
        }

        // Acceleration vs RotationRate 상관관계
        if (this.availableSensors.acceleration && this.availableSensors.rotationRate) {
            correlations.acceleration_rotation = this.calculateCrossCorrelation(
                correlationData.map(d => d.acceleration),
                correlationData.map(d => d.rotationRate)
            );
        }

        return correlations;
    }

    calculateCrossCorrelation(dataA, dataB) {
        // 간단한 상관계수 계산 (Pearson correlation)
        const validPairs = [];

        for (let i = 0; i < Math.min(dataA.length, dataB.length); i++) {
            if (dataA[i] && dataB[i]) {
                validPairs.push({ a: dataA[i], b: dataB[i] });
            }
        }

        if (validPairs.length < 10) {
            return { correlation: 0, reliability: 'low' };
        }

        // 각 축별 상관계수 계산
        const axes = ['x', 'y', 'z'];
        const correlationsByAxis = {};

        axes.forEach(axis => {
            const valuesA = validPairs.map(p => this.extractAxisValue(p.a, axis)).filter(v => v !== null);
            const valuesB = validPairs.map(p => this.extractAxisValue(p.b, axis)).filter(v => v !== null);

            if (valuesA.length > 5 && valuesB.length > 5) {
                correlationsByAxis[axis] = this.pearsonCorrelation(valuesA.slice(0, valuesB.length), valuesB.slice(0, valuesA.length));
            }
        });

        const avgCorrelation = Object.values(correlationsByAxis).reduce((sum, corr) => sum + Math.abs(corr), 0) / Object.keys(correlationsByAxis).length;

        return {
            correlation: avgCorrelation,
            breakdown: correlationsByAxis,
            reliability: avgCorrelation > 0.7 ? 'high' : avgCorrelation > 0.4 ? 'medium' : 'low'
        };
    }

    extractAxisValue(sensorData, axis) {
        // 센서별로 적절한 축 값 추출
        if (sensorData.alpha !== undefined) {
            // Orientation 데이터
            return axis === 'x' ? sensorData.gamma : axis === 'y' ? sensorData.beta : sensorData.alpha;
        } else if (sensorData.x !== undefined) {
            // Acceleration 또는 RotationRate 데이터
            return sensorData[axis];
        }
        return null;
    }

    pearsonCorrelation(x, y) {
        const n = Math.min(x.length, y.length);
        if (n < 2) return 0;

        const sumX = x.slice(0, n).reduce((sum, val) => sum + val, 0);
        const sumY = y.slice(0, n).reduce((sum, val) => sum + val, 0);
        const sumXY = x.slice(0, n).reduce((sum, val, i) => sum + val * y[i], 0);
        const sumX2 = x.slice(0, n).reduce((sum, val) => sum + val * val, 0);
        const sumY2 = y.slice(0, n).reduce((sum, val) => sum + val * val, 0);

        const numerator = n * sumXY - sumX * sumY;
        const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

        return denominator === 0 ? 0 : numerator / denominator;
    }

    async determineFusionStrategy() {
        const strategy = {
            primary_engine: 'complementary',
            secondary_engine: null,
            sensor_weights: {},
            fusion_rate: 50, // Hz
            quality_threshold: 0.7
        };

        // 사용 가능한 센서 수에 따른 전략 결정
        const availableCount = Object.values(this.availableSensors).filter(Boolean).length;

        if (availableCount >= 3) {
            strategy.primary_engine = 'kalman';
            strategy.secondary_engine = 'complementary';
        } else if (availableCount === 2) {
            strategy.primary_engine = 'complementary';
        } else {
            strategy.primary_engine = 'simple';
        }

        // 센서별 가중치 계산
        if (this.sensorCorrelations && !this.sensorCorrelations.insufficient_data) {
            strategy.sensor_weights = this.calculateSensorWeights();
        } else {
            // 기본 가중치
            strategy.sensor_weights = {
                orientation: 0.4,
                acceleration: 0.35,
                rotationRate: 0.25
            };
        }

        this.fusionStrategy = strategy;
        console.log('융합 전략 결정:', strategy);

        return strategy;
    }

    calculateSensorWeights() {
        const weights = {
            orientation: 0.33,
            acceleration: 0.33,
            rotationRate: 0.33
        };

        // 상관관계가 높은 센서에 더 높은 가중치 부여
        if (this.sensorCorrelations.orientation_acceleration?.reliability === 'high') {
            weights.orientation += 0.1;
            weights.acceleration += 0.1;
            weights.rotationRate -= 0.2;
        }

        if (this.sensorCorrelations.orientation_rotation?.reliability === 'high') {
            weights.orientation += 0.05;
            weights.rotationRate += 0.05;
            weights.acceleration -= 0.1;
        }

        // 가중치 정규화
        const totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0);
        Object.keys(weights).forEach(key => {
            weights[key] /= totalWeight;
        });

        return weights;
    }

    startRealTimeFusion() {
        console.log('실시간 센서 융합 시작');

        this.fusionInterval = setInterval(() => {
            this.performSensorFusion();
        }, 1000 / this.fusionStrategy.fusion_rate);
    }

    performSensorFusion() {
        // 1. 현재 센서 데이터 수집
        const currentSensorData = this.collectCurrentSensorData();

        if (!currentSensorData) return;

        // 2. 데이터 품질 평가
        const qualityMetrics = this.qualityController.evaluate(currentSensorData);

        // 3. 적응형 융합 엔진 선택
        const selectedEngine = this.adaptiveSelector.selectEngine(qualityMetrics, this.fusionStrategy);

        // 4. 선택된 엔진으로 융합 수행
        const fusedResult = this.fusionEngines[selectedEngine].fuse(
            currentSensorData,
            this.fusionStrategy.sensor_weights,
            qualityMetrics
        );

        // 5. AI 기반 후처리 최적화
        const optimizedResult = this.fusionOptimizer.optimize(fusedResult, qualityMetrics);

        // 6. 결과 검증 및 신뢰도 계산
        const validatedResult = this.validateFusionResult(optimizedResult);

        // 7. 융합 데이터 업데이트
        this.updateFusedData(validatedResult);

        // 8. SessionSDK에 이벤트 전송
        this.sdk.emit('sensor-fusion-update', {
            data: this.fusedData,
            quality: qualityMetrics,
            engine: selectedEngine,
            timestamp: Date.now()
        });
    }

    updateFusedData(validatedResult) {
        this.fusedData = {
            ...validatedResult,
            timestamp: Date.now(),
            fusion_engine: this.adaptiveSelector.lastSelectedEngine,
            quality_score: validatedResult.confidence.overall
        };

        // 사용자 만족도 추적
        if (validatedResult.confidence.overall > 0.8) {
            this.satisfactionTracker.addPositiveEvent('high_quality_fusion', 0.05);
        }
    }

    validateFusionResult(result) {
        // 결과 검증 및 신뢰도 계산
        const validation = {
            data_integrity: this.checkDataIntegrity(result),
            physical_consistency: this.checkPhysicalConsistency(result),
            temporal_consistency: this.checkTemporalConsistency(result)
        };

        const overallConfidence = (
            validation.data_integrity * 0.4 +
            validation.physical_consistency * 0.4 +
            validation.temporal_consistency * 0.2
        );

        return {
            ...result,
            confidence: {
                overall: overallConfidence,
                breakdown: validation
            },
            validated: true
        };
    }

    checkDataIntegrity(result) {
        // 데이터 무결성 검사
        let integrity = 1.0;

        // 값의 유효성 검사
        Object.values(result).forEach(value => {
            if (typeof value === 'object' && value !== null) {
                Object.values(value).forEach(subValue => {
                    if (!isFinite(subValue)) {
                        integrity -= 0.2;
                    }
                });
            } else if (!isFinite(value)) {
                integrity -= 0.1;
            }
        });

        return Math.max(0, integrity);
    }

    checkPhysicalConsistency(result) {
        // 물리적 일관성 검사
        let consistency = 1.0;

        // 회전과 방향의 일관성 검사
        if (result.orientation && result.rotation) {
            const orientationChange = this.calculateOrientationChange(result.orientation);
            const rotationMagnitude = this.calculateRotationMagnitude(result.rotation);

            const expectedChange = rotationMagnitude * 0.016; // 60fps 기준
            const actualChange = orientationChange;

            if (Math.abs(expectedChange - actualChange) > expectedChange * 0.5) {
                consistency -= 0.3;
            }
        }

        // 가속도와 속도의 일관성 검사
        if (result.motion && this.previousFusedData) {
            const expectedVelocityChange = {
                x: result.motion.acceleration.x * 0.016,
                y: result.motion.acceleration.y * 0.016,
                z: result.motion.acceleration.z * 0.016
            };

            const actualVelocityChange = {
                x: result.motion.velocity.x - (this.previousFusedData.motion?.velocity.x || 0),
                y: result.motion.velocity.y - (this.previousFusedData.motion?.velocity.y || 0),
                z: result.motion.velocity.z - (this.previousFusedData.motion?.velocity.z || 0)
            };

            const velocityError = Math.sqrt(
                Math.pow(expectedVelocityChange.x - actualVelocityChange.x, 2) +
                Math.pow(expectedVelocityChange.y - actualVelocityChange.y, 2) +
                Math.pow(expectedVelocityChange.z - actualVelocityChange.z, 2)
            );

            if (velocityError > 2.0) { // 2 m/s 오차 허용
                consistency -= 0.2;
            }
        }

        this.previousFusedData = result;
        return Math.max(0, consistency);
    }

    checkTemporalConsistency(result) {
        // 시간적 일관성 검사
        if (!this.fusionHistory) {
            this.fusionHistory = [];
        }

        this.fusionHistory.push(result);

        // 최근 5개 결과만 유지
        if (this.fusionHistory.length > 5) {
            this.fusionHistory.shift();
        }

        if (this.fusionHistory.length < 3) {
            return 0.7; // 기본값
        }

        // 변화율 분석
        const changes = [];
        for (let i = 1; i < this.fusionHistory.length; i++) {
            const prev = this.fusionHistory[i - 1];
            const curr = this.fusionHistory[i];

            changes.push(this.calculateOverallChange(prev, curr));
        }

        const avgChange = changes.reduce((sum, c) => sum + c, 0) / changes.length;
        const changeVariance = changes.reduce((sum, c) => sum + Math.pow(c - avgChange, 2), 0) / changes.length;

        // 변화가 일정하면 높은 점수, 급격한 변화가 있으면 낮은 점수
        const consistency = Math.max(0, 1 - Math.sqrt(changeVariance) / 10);

        return consistency;
    }

    calculateOverallChange(prev, curr) {
        let totalChange = 0;
        let changeCount = 0;

        // 방향 변화
        if (prev.orientation && curr.orientation) {
            totalChange += Math.abs(curr.orientation.alpha - prev.orientation.alpha);
            totalChange += Math.abs(curr.orientation.beta - prev.orientation.beta);
            totalChange += Math.abs(curr.orientation.gamma - prev.orientation.gamma);
            changeCount += 3;
        }

        // 가속도 변화
        if (prev.motion && curr.motion) {
            totalChange += Math.abs(curr.motion.acceleration.x - prev.motion.acceleration.x);
            totalChange += Math.abs(curr.motion.acceleration.y - prev.motion.acceleration.y);
            totalChange += Math.abs(curr.motion.acceleration.z - prev.motion.acceleration.z);
            changeCount += 3;
        }

        return changeCount > 0 ? totalChange / changeCount : 0;
    }

    // 융합 엔진 인터페이스
    getFusedData() {
        return { ...this.fusedData };
    }

    getSensorCorrelations() {
        return { ...this.sensorCorrelations };
    }

    getFusionStrategy() {
        return { ...this.fusionStrategy };
    }

    getPerformanceMetrics() {
        return {
            available_sensors: this.availableSensors,
            fusion_rate: this.fusionStrategy.fusion_rate,
            average_confidence: this.fusedData.confidence?.overall || 0,
            selected_engine: this.adaptiveSelector.lastSelectedEngine
        };
    }
}
```

---

## 🤖 AI 기반 융합 알고리즘

### 1. 지능형 융합 최적화 엔진
```javascript
class AIFusionOptimizer {
    constructor() {
        this.optimizationHistory = [];
        this.learningModel = new FusionLearningModel();
        this.contextProcessor = new FusionContextProcessor();
        this.performancePredictor = new FusionPerformancePredictor();
    }

    optimize(fusionResult, qualityMetrics) {
        // 1. 컨텍스트 분석
        const context = this.contextProcessor.analyzeContext(qualityMetrics);

        // 2. 성능 예측
        const performancePrediction = this.performancePredictor.predict(fusionResult, context);

        // 3. 적응형 최적화 적용
        const optimized = this.applyAdaptiveOptimization(fusionResult, performancePrediction);

        // 4. 학습 데이터 수집
        this.collectOptimizationData(fusionResult, optimized, qualityMetrics);

        return optimized;
    }

    applyAdaptiveOptimization(result, prediction) {
        const optimized = { ...result };

        // 예측된 성능이 낮으면 보정 적용
        if (prediction.confidence < 0.7) {
            optimized.orientation = this.applyOrientationCorrection(optimized.orientation, prediction);
            optimized.motion = this.applyMotionCorrection(optimized.motion, prediction);
            optimized.rotation = this.applyRotationCorrection(optimized.rotation, prediction);
        }

        // 노이즈 제거
        if (prediction.noise_level > 0.5) {
            optimized.orientation = this.applyNoiseReduction(optimized.orientation);
            optimized.motion = this.applyNoiseReduction(optimized.motion);
        }

        return optimized;
    }

    applyOrientationCorrection(orientation, prediction) {
        if (!orientation) return orientation;

        const correctionFactor = Math.max(0.1, 1 - prediction.error_estimate);

        return {
            alpha: this.smoothValue(orientation.alpha, this.previousOrientation?.alpha, correctionFactor),
            beta: this.smoothValue(orientation.beta, this.previousOrientation?.beta, correctionFactor),
            gamma: this.smoothValue(orientation.gamma, this.previousOrientation?.gamma, correctionFactor)
        };
    }

    smoothValue(current, previous, factor) {
        if (previous === undefined) return current;
        return previous * (1 - factor) + current * factor;
    }

    collectOptimizationData(original, optimized, quality) {
        const data = {
            timestamp: Date.now(),
            original: { ...original },
            optimized: { ...optimized },
            quality: { ...quality },
            improvement: this.calculateImprovement(original, optimized)
        };

        this.optimizationHistory.push(data);

        // 최근 200개만 유지
        if (this.optimizationHistory.length > 200) {
            this.optimizationHistory.shift();
        }

        // 학습 모델 업데이트
        this.learningModel.updateModel(data);
    }
}

// 적응형 융합 엔진 선택기
class AdaptiveFusionSelector {
    constructor() {
        this.enginePerformance = {
            complementary: { success_rate: 0.8, avg_latency: 2, quality_score: 0.7 },
            kalman: { success_rate: 0.9, avg_latency: 5, quality_score: 0.85 },
            particle: { success_rate: 0.75, avg_latency: 10, quality_score: 0.9 },
            neural: { success_rate: 0.85, avg_latency: 8, quality_score: 0.88 }
        };

        this.lastSelectedEngine = 'complementary';
        this.selectionHistory = [];
    }

    selectEngine(qualityMetrics, fusionStrategy) {
        const requirements = this.analyzeRequirements(qualityMetrics, fusionStrategy);
        const bestEngine = this.findBestEngine(requirements);

        this.lastSelectedEngine = bestEngine;
        this.recordSelection(bestEngine, requirements, qualityMetrics);

        return bestEngine;
    }

    analyzeRequirements(qualityMetrics, strategy) {
        return {
            latency_priority: qualityMetrics.realtime_requirement || false,
            quality_priority: qualityMetrics.precision_requirement === 'high',
            reliability_priority: qualityMetrics.stability_requirement === 'high',
            complexity: this.assessComplexity(qualityMetrics),
            sensor_count: Object.values(qualityMetrics.sensor_availability || {}).filter(Boolean).length
        };
    }

    findBestEngine(requirements) {
        let bestEngine = 'complementary';
        let bestScore = 0;

        Object.keys(this.enginePerformance).forEach(engine => {
            const score = this.calculateEngineScore(engine, requirements);
            if (score > bestScore) {
                bestScore = score;
                bestEngine = engine;
            }
        });

        return bestEngine;
    }

    calculateEngineScore(engine, requirements) {
        const perf = this.enginePerformance[engine];
        let score = 0;

        // 기본 성능 점수
        score += perf.success_rate * 0.3;
        score += perf.quality_score * 0.4;

        // 지연 시간 고려 (낮을수록 좋음)
        const latencyScore = Math.max(0, 1 - (perf.avg_latency / 20));
        score += latencyScore * (requirements.latency_priority ? 0.4 : 0.2);

        // 요구사항별 가중치 적용
        if (requirements.quality_priority && perf.quality_score > 0.8) {
            score += 0.1;
        }

        if (requirements.reliability_priority && perf.success_rate > 0.85) {
            score += 0.1;
        }

        // 복잡도 고려
        if (requirements.complexity === 'high' && (engine === 'kalman' || engine === 'particle')) {
            score += 0.05;
        } else if (requirements.complexity === 'low' && engine === 'complementary') {
            score += 0.05;
        }

        return score;
    }

    assessComplexity(qualityMetrics) {
        let complexity = 'medium';

        const noiseLevel = qualityMetrics.noise_level || 0.5;
        const sensorCount = Object.values(qualityMetrics.sensor_availability || {}).filter(Boolean).length;

        if (noiseLevel > 0.7 || sensorCount >= 3) {
            complexity = 'high';
        } else if (noiseLevel < 0.3 && sensorCount <= 1) {
            complexity = 'low';
        }

        return complexity;
    }

    recordSelection(engine, requirements, qualityMetrics) {
        this.selectionHistory.push({
            timestamp: Date.now(),
            engine: engine,
            requirements: requirements,
            quality: qualityMetrics,
            performance: { ...this.enginePerformance[engine] }
        });

        // 최근 100개만 유지
        if (this.selectionHistory.length > 100) {
            this.selectionHistory.shift();
        }

        // 성능 통계 업데이트
        this.updateEnginePerformance();
    }

    updateEnginePerformance() {
        // 각 엔진의 실제 성능 추적 및 업데이트
        const recentSelections = this.selectionHistory.slice(-50);

        Object.keys(this.enginePerformance).forEach(engine => {
            const engineSelections = recentSelections.filter(s => s.engine === engine);

            if (engineSelections.length > 5) {
                // 성공률 업데이트 (실제 성공 여부는 별도 추적 필요)
                // 여기서는 품질 점수를 기반으로 추정
                const avgQuality = engineSelections.reduce((sum, s) =>
                    sum + (s.quality.overall_quality || 0.5), 0) / engineSelections.length;

                this.enginePerformance[engine].success_rate =
                    this.enginePerformance[engine].success_rate * 0.9 + avgQuality * 0.1;

                this.enginePerformance[engine].quality_score =
                    this.enginePerformance[engine].quality_score * 0.9 + avgQuality * 0.1;
            }
        });
    }
}
```

---

## ⚡ 실시간 통합 처리 시스템

### 1. 고성능 융합 파이프라인
```javascript
class HighPerformanceFusionPipeline {
    constructor() {
        this.processingQueue = [];
        this.workers = [];
        this.resultCache = new Map();
        this.performanceMonitor = new FusionPerformanceMonitor();

        this.setupWorkerPool();
    }

    setupWorkerPool() {
        const workerCount = Math.min(4, navigator.hardwareConcurrency || 2);

        for (let i = 0; i < workerCount; i++) {
            // 웹 워커는 실제 환경에서만 사용 가능
            if (typeof Worker !== 'undefined') {
                const worker = new Worker('/js/fusion-worker.js');
                worker.onmessage = (event) => this.handleWorkerResult(event);
                this.workers.push(worker);
            }
        }

        console.log(`융합 워커 풀 설정 완료: ${this.workers.length}개 워커`);
    }

    processFusionAsync(sensorData, strategy) {
        return new Promise((resolve, reject) => {
            const taskId = Date.now() + Math.random();

            const task = {
                id: taskId,
                data: sensorData,
                strategy: strategy,
                timestamp: Date.now(),
                resolve: resolve,
                reject: reject
            };

            // 우선순위 큐에 추가
            this.addToProcessingQueue(task);

            // 워커에 할당
            this.assignToWorker(task);
        });
    }

    addToProcessingQueue(task) {
        this.processingQueue.push(task);

        // 우선순위 정렬 (최신 데이터 우선)
        this.processingQueue.sort((a, b) => b.timestamp - a.timestamp);

        // 큐 크기 제한
        if (this.processingQueue.length > 50) {
            const removedTask = this.processingQueue.pop();
            removedTask.reject(new Error('Processing queue overflow'));
        }
    }

    assignToWorker(task) {
        if (this.workers.length === 0) {
            // 웹 워커를 사용할 수 없는 경우 메인 스레드에서 처리
            this.processOnMainThread(task);
            return;
        }

        // 가장 부하가 적은 워커 선택
        const availableWorker = this.findLeastBusyWorker();

        if (availableWorker) {
            availableWorker.busy = true;
            availableWorker.currentTask = task.id;
            availableWorker.postMessage({
                type: 'fusion_task',
                task: {
                    id: task.id,
                    data: task.data,
                    strategy: task.strategy
                }
            });
        } else {
            // 모든 워커가 바쁘면 큐에서 대기
            setTimeout(() => this.assignToWorker(task), 10);
        }
    }

    findLeastBusyWorker() {
        return this.workers.find(worker => !worker.busy) || null;
    }

    handleWorkerResult(event) {
        const { taskId, result, error } = event.data;

        // 워커 상태 업데이트
        const worker = this.workers.find(w => w.currentTask === taskId);
        if (worker) {
            worker.busy = false;
            worker.currentTask = null;
        }

        // 대기 중인 태스크 찾기
        const taskIndex = this.processingQueue.findIndex(t => t.id === taskId);

        if (taskIndex !== -1) {
            const task = this.processingQueue.splice(taskIndex, 1)[0];

            if (error) {
                task.reject(new Error(error));
            } else {
                // 결과 캐싱
                this.cacheResult(task.data, result);

                // 성능 모니터링
                this.performanceMonitor.recordProcessing(task, result);

                task.resolve(result);
            }
        }
    }

    processOnMainThread(task) {
        try {
            // 간단한 동기 융합 처리 (워커 대신)
            const result = this.performSyncFusion(task.data, task.strategy);

            this.cacheResult(task.data, result);
            this.performanceMonitor.recordProcessing(task, result);

            task.resolve(result);

        } catch (error) {
            task.reject(error);
        }
    }

    performSyncFusion(sensorData, strategy) {
        // 기본 융합 알고리즘 (간단한 가중 평균)
        const weights = strategy.sensor_weights;
        const result = {
            orientation: { alpha: 0, beta: 0, gamma: 0 },
            motion: {
                velocity: { x: 0, y: 0, z: 0 },
                acceleration: { x: 0, y: 0, z: 0 }
            },
            confidence: { overall: 0.7 }
        };

        // 방향 데이터 융합
        if (sensorData.orientation) {
            result.orientation = {
                alpha: sensorData.orientation.alpha * (weights.orientation || 1),
                beta: sensorData.orientation.beta * (weights.orientation || 1),
                gamma: sensorData.orientation.gamma * (weights.orientation || 1)
            };
        }

        // 가속도 데이터 융합
        if (sensorData.acceleration) {
            result.motion.acceleration = {
                x: sensorData.acceleration.x * (weights.acceleration || 1),
                y: sensorData.acceleration.y * (weights.acceleration || 1),
                z: sensorData.acceleration.z * (weights.acceleration || 1)
            };
        }

        return result;
    }

    cacheResult(inputData, result) {
        const cacheKey = this.generateCacheKey(inputData);

        this.resultCache.set(cacheKey, {
            result: { ...result },
            timestamp: Date.now()
        });

        // 캐시 크기 제한
        if (this.resultCache.size > 100) {
            const oldestKey = [...this.resultCache.keys()][0];
            this.resultCache.delete(oldestKey);
        }
    }

    generateCacheKey(data) {
        // 입력 데이터의 해시값 생성 (간단한 구현)
        const str = JSON.stringify(data);
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // 32비트 정수로 변환
        }
        return hash.toString(36);
    }

    getCachedResult(inputData) {
        const cacheKey = this.generateCacheKey(inputData);
        const cached = this.resultCache.get(cacheKey);

        if (cached && Date.now() - cached.timestamp < 100) { // 100ms 캐시 유효
            return cached.result;
        }

        return null;
    }

    getPerformanceStats() {
        return {
            queue_length: this.processingQueue.length,
            cache_size: this.resultCache.size,
            active_workers: this.workers.filter(w => w.busy).length,
            total_workers: this.workers.length,
            processing_stats: this.performanceMonitor.getStats()
        };
    }
}

// 융합 성능 모니터
class FusionPerformanceMonitor {
    constructor() {
        this.processingTimes = [];
        this.errorRates = [];
        this.qualityScores = [];
    }

    recordProcessing(task, result) {
        const processingTime = Date.now() - task.timestamp;
        this.processingTimes.push(processingTime);

        const qualityScore = result.confidence?.overall || 0.5;
        this.qualityScores.push(qualityScore);

        // 에러율 계산 (품질이 낮으면 에러로 간주)
        this.errorRates.push(qualityScore < 0.3 ? 1 : 0);

        // 최근 100개만 유지
        [this.processingTimes, this.errorRates, this.qualityScores].forEach(array => {
            if (array.length > 100) {
                array.shift();
            }
        });
    }

    getStats() {
        if (this.processingTimes.length === 0) {
            return { insufficient_data: true };
        }

        const avgProcessingTime = this.processingTimes.reduce((sum, time) => sum + time, 0) / this.processingTimes.length;
        const avgQuality = this.qualityScores.reduce((sum, quality) => sum + quality, 0) / this.qualityScores.length;
        const errorRate = this.errorRates.reduce((sum, error) => sum + error, 0) / this.errorRates.length;

        return {
            avg_processing_time: avgProcessingTime,
            avg_quality_score: avgQuality,
            error_rate: errorRate,
            throughput: 1000 / avgProcessingTime, // 초당 처리량
            sample_count: this.processingTimes.length
        };
    }
}
```

---

## 🏁 마무리

이 센서 융합 기법 가이드는 다중 센서 데이터를 지능적으로 통합하여 더욱 정확하고 신뢰할 수 있는 센서 정보를 생성하는 고급 기법들을 다루었습니다:

### ✅ 학습한 핵심 기술
1. **다중 센서 통합** - Orientation, Acceleration, RotationRate 센서의 실시간 융합
2. **AI 기반 융합 알고리즘** - 지능형 최적화 및 적응형 엔진 선택
3. **실시간 처리 시스템** - 고성능 파이프라인 및 워커 풀 활용
4. **품질 관리** - 데이터 무결성, 물리적/시간적 일관성 검증
5. **성능 최적화** - 캐싱, 큐 관리, 비동기 처리
6. **적응형 시스템** - 컨텍스트 기반 전략 조정 및 학습

### 🎯 실무 적용 가이드
- **단계적 구현**: 단일 센서 → 두 센서 융합 → 전체 센서 통합 → AI 최적화
- **품질 우선**: 센서 상관관계 분석을 통한 신뢰할 수 있는 융합 전략
- **성능 균형**: 정확도와 실시간 처리 성능의 최적 균형점 찾기
- **사용자 중심**: 융합 품질이 사용자 경험에 미치는 영향 지속 모니터링

### 💡 중요 포인트
> **센서 융합은 단순한 데이터 결합이 아닌 지능적인 정보 통합 과정입니다. AI 기반 융합 시스템은 각 센서의 특성과 한계를 이해하고, 상황에 맞는 최적의 융합 전략을 자동으로 선택하여 더욱 정확하고 안정적인 센서 데이터를 제공합니다.**

### 🔧 다음 단계 권장사항
- **고급 융합 모델**: 딥러닝 기반 센서 융합 네트워크 구축
- **예측 융합**: 센서 데이터 예측을 통한 지연 시간 보상
- **자가 진단**: 센서 오류 자동 감지 및 복구 시스템
- **개인화 학습**: 사용자별 센서 특성 학습 및 맞춤형 융합

---

**📚 관련 문서**
- [Orientation 센서 완전 활용법](orientation-sensor.md)
- [Acceleration 센서 완전 활용법](acceleration-sensor.md)
- [RotationRate 센서 완전 활용법](rotation-rate-sensor.md)
- [SessionSDK 심화 사용법](../game-development/02-sessionsdk-advanced.md)