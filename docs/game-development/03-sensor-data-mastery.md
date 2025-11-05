# 🎯 센서 데이터 마스터리 - 완벽한 센서 활용 가이드

## 📚 목차
1. [센서 데이터 이해하기](#센서-데이터-이해하기)
2. [센서 데이터 전처리](#센서-데이터-전처리)
3. [노이즈 필터링](#노이즈-필터링)
4. [제스처 인식](#제스처-인식)
5. [센서 캘리브레이션](#센서-캘리브레이션)
6. [고급 센서 처리 기법](#고급-센서-처리-기법)
7. [크로스 플랫폼 호환성](#크로스-플랫폼-호환성)
8. [성능 최적화](#성능-최적화)

---

## 🎯 센서 데이터 이해하기

### 1. 방향 센서 (DeviceOrientation)

```javascript
// 센서 데이터 구조
const orientationData = {
    alpha: 45.0,    // Z축 회전 (나침반, 0-360°)
    beta: 15.0,     // X축 회전 (앞뒤 기울기, -180~180°)
    gamma: -30.0    // Y축 회전 (좌우 기울기, -90~90°)
};

// 실제 활용 예제
class OrientationProcessor {
    constructor() {
        this.calibration = { alpha: 0, beta: 0, gamma: 0 };
    }

    process(rawData) {
        return {
            // 보정된 값
            heading: this.normalizeAngle(rawData.alpha - this.calibration.alpha),
            pitch: this.clamp(rawData.beta - this.calibration.beta, -90, 90),
            roll: this.clamp(rawData.gamma - this.calibration.gamma, -90, 90)
        };
    }

    normalizeAngle(angle) {
        // 0-360도 범위로 정규화
        angle = angle % 360;
        if (angle < 0) angle += 360;
        return angle;
    }

    clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }

    // 현재 방향을 기준점으로 설정
    calibrate(currentData) {
        this.calibration = {
            alpha: currentData.alpha,
            beta: currentData.beta,
            gamma: currentData.gamma
        };
    }
}
```

### 2. 가속도 센서 (DeviceMotion)

```javascript
// 센서 데이터 구조
const accelerationData = {
    x: 0.1,         // 좌우 가속도
    y: -9.8,        // 상하 가속도 (중력 포함)
    z: 0.2          // 앞뒤 가속도
};

// 중력 제거 (Linear Acceleration)
class AccelerationProcessor {
    constructor() {
        this.gravity = { x: 0, y: -9.8, z: 0 };
        this.alpha = 0.8; // 저역 통과 필터 계수
    }

    removeGravity(acceleration) {
        // 저역 통과 필터로 중력 추정
        this.gravity.x = this.alpha * this.gravity.x + (1 - this.alpha) * acceleration.x;
        this.gravity.y = this.alpha * this.gravity.y + (1 - this.alpha) * acceleration.y;
        this.gravity.z = this.alpha * this.gravity.z + (1 - this.alpha) * acceleration.z;

        // 선형 가속도 계산
        return {
            x: acceleration.x - this.gravity.x,
            y: acceleration.y - this.gravity.y,
            z: acceleration.z - this.gravity.z
        };
    }

    getMagnitude(acceleration) {
        return Math.sqrt(
            acceleration.x ** 2 +
            acceleration.y ** 2 +
            acceleration.z ** 2
        );
    }

    // 흔들기 감지
    detectShake(acceleration, threshold = 15) {
        const magnitude = this.getMagnitude(acceleration);
        return magnitude > threshold;
    }
}
```

### 3. 회전 속도 센서 (RotationRate)

```javascript
// 센서 데이터 구조
const rotationRateData = {
    alpha: 0.0,     // Z축 회전 속도 (°/s)
    beta: 0.5,      // X축 회전 속도 (°/s)
    gamma: -0.3     // Y축 회전 속도 (°/s)
};

// 회전 속도 분석
class RotationRateProcessor {
    constructor() {
        this.history = [];
        this.maxHistorySize = 10;
    }

    process(rotationRate) {
        // 히스토리 저장
        this.history.push({
            data: { ...rotationRate },
            timestamp: Date.now()
        });

        if (this.history.length > this.maxHistorySize) {
            this.history.shift();
        }

        return {
            current: rotationRate,
            average: this.getAverage(),
            peak: this.getPeak()
        };
    }

    getAverage() {
        if (this.history.length === 0) return { alpha: 0, beta: 0, gamma: 0 };

        const sum = this.history.reduce((acc, item) => ({
            alpha: acc.alpha + item.data.alpha,
            beta: acc.beta + item.data.beta,
            gamma: acc.gamma + item.data.gamma
        }), { alpha: 0, beta: 0, gamma: 0 });

        return {
            alpha: sum.alpha / this.history.length,
            beta: sum.beta / this.history.length,
            gamma: sum.gamma / this.history.length
        };
    }

    getPeak() {
        if (this.history.length === 0) return 0;

        return Math.max(...this.history.map(item => {
            const { alpha, beta, gamma } = item.data;
            return Math.sqrt(alpha ** 2 + beta ** 2 + gamma ** 2);
        }));
    }

    // 빠른 회전 감지
    detectSpin(threshold = 100) {
        return this.getPeak() > threshold;
    }
}
```

---

## 🔧 센서 데이터 전처리

### 1. 저역 통과 필터 (Low-Pass Filter)

```javascript
class LowPassFilter {
    constructor(alpha = 0.8) {
        this.alpha = alpha;
        this.output = null;
    }

    filter(input) {
        if (this.output === null) {
            this.output = { ...input };
            return this.output;
        }

        // 지수 이동 평균
        this.output = {
            alpha: this.alpha * this.output.alpha + (1 - this.alpha) * input.alpha,
            beta: this.alpha * this.output.beta + (1 - this.alpha) * input.beta,
            gamma: this.alpha * this.output.gamma + (1 - this.alpha) * input.gamma
        };

        return { ...this.output };
    }

    reset() {
        this.output = null;
    }
}

// 사용 예
const filter = new LowPassFilter(0.9); // 높은 alpha = 더 부드러움

sdk.on('sensor-data', (event) => {
    const data = event.detail || event;
    const rawOrientation = data.data.orientation;

    // 필터 적용
    const smoothOrientation = filter.filter(rawOrientation);

    updateGameObject(smoothOrientation);
});
```

### 2. 칼만 필터 (Kalman Filter)

```javascript
class KalmanFilter {
    constructor(processNoise = 0.01, measurementNoise = 0.1) {
        this.processNoise = processNoise;
        this.measurementNoise = measurementNoise;

        this.estimate = 0;
        this.errorCovariance = 1;
    }

    filter(measurement) {
        // 예측 단계
        const predictedErrorCovariance = this.errorCovariance + this.processNoise;

        // 업데이트 단계
        const kalmanGain = predictedErrorCovariance /
                          (predictedErrorCovariance + this.measurementNoise);

        this.estimate = this.estimate + kalmanGain * (measurement - this.estimate);
        this.errorCovariance = (1 - kalmanGain) * predictedErrorCovariance;

        return this.estimate;
    }

    reset() {
        this.estimate = 0;
        this.errorCovariance = 1;
    }
}

// 다차원 칼만 필터
class MultiDimensionalKalmanFilter {
    constructor(dimensions = 3) {
        this.filters = Array(dimensions).fill(null).map(() => new KalmanFilter());
    }

    filter(measurements) {
        return measurements.map((value, index) => {
            return this.filters[index].filter(value);
        });
    }
}

// 사용 예
const kalmanFilter = new MultiDimensionalKalmanFilter(3);

sdk.on('sensor-data', (event) => {
    const data = event.detail || event;
    const orientation = data.data.orientation;

    const filtered = kalmanFilter.filter([
        orientation.alpha,
        orientation.beta,
        orientation.gamma
    ]);

    updateGameObject({
        alpha: filtered[0],
        beta: filtered[1],
        gamma: filtered[2]
    });
});
```

### 3. 데드존 (Dead Zone)

```javascript
class DeadZoneProcessor {
    constructor(threshold = 2.0) {
        this.threshold = threshold;
        this.center = { alpha: 0, beta: 0, gamma: 0 };
    }

    setCenter(orientation) {
        this.center = { ...orientation };
    }

    process(orientation) {
        return {
            alpha: this.applyDeadZone(orientation.alpha, this.center.alpha),
            beta: this.applyDeadZone(orientation.beta, this.center.beta),
            gamma: this.applyDeadZone(orientation.gamma, this.center.gamma)
        };
    }

    applyDeadZone(value, center) {
        const diff = value - center;

        if (Math.abs(diff) < this.threshold) {
            return center; // 데드존 내부
        }

        // 데드존 외부: 연속성 유지
        return center + (diff - Math.sign(diff) * this.threshold);
    }
}

// 사용 예
const deadZone = new DeadZoneProcessor(3.0);

// 게임 시작 시 중심점 설정
sdk.on('session-created', () => {
    // 첫 센서 데이터를 중심점으로 설정
    sdk.once('sensor-data', (event) => {
        const data = event.detail || event;
        deadZone.setCenter(data.data.orientation);
    });
});

sdk.on('sensor-data', (event) => {
    const data = event.detail || event;
    const processed = deadZone.process(data.data.orientation);
    updateGameObject(processed);
});
```

---

## 🎨 제스처 인식

### 1. 기본 제스처

```javascript
class GestureRecognizer {
    constructor() {
        this.gestureHistory = [];
        this.maxHistorySize = 30; // 약 0.5초 (60fps 기준)

        this.gestures = {
            shake: new ShakeGesture(),
            tilt: new TiltGesture(),
            rotate: new RotateGesture(),
            tap: new TapGesture()
        };
    }

    processData(sensorData) {
        // 히스토리에 추가
        this.gestureHistory.push({
            orientation: sensorData.orientation,
            acceleration: sensorData.acceleration,
            rotationRate: sensorData.rotationRate,
            timestamp: Date.now()
        });

        if (this.gestureHistory.length > this.maxHistorySize) {
            this.gestureHistory.shift();
        }

        // 각 제스처 검사
        const detectedGestures = [];

        for (const [name, gesture] of Object.entries(this.gestures)) {
            if (gesture.recognize(this.gestureHistory)) {
                detectedGestures.push({
                    name,
                    confidence: gesture.getConfidence(),
                    data: gesture.getData()
                });
            }
        }

        return detectedGestures;
    }
}

// 흔들기 제스처
class ShakeGesture {
    constructor() {
        this.threshold = 15;
        this.minShakes = 2;
        this.detected = false;
    }

    recognize(history) {
        if (history.length < 10) return false;

        let shakeCount = 0;
        let lastPeak = 0;

        for (let i = 1; i < history.length; i++) {
            const prev = history[i - 1].acceleration;
            const curr = history[i].acceleration;

            const magnitude = Math.sqrt(
                curr.x ** 2 + curr.y ** 2 + curr.z ** 2
            );

            if (magnitude > this.threshold) {
                const timeDiff = history[i].timestamp - lastPeak;

                if (timeDiff > 100) { // 최소 100ms 간격
                    shakeCount++;
                    lastPeak = history[i].timestamp;
                }
            }
        }

        this.detected = shakeCount >= this.minShakes;
        return this.detected;
    }

    getConfidence() {
        return this.detected ? 0.9 : 0.0;
    }

    getData() {
        return { type: 'shake' };
    }
}

// 기울기 제스처
class TiltGesture {
    constructor() {
        this.threshold = 30; // 30도
        this.direction = null;
    }

    recognize(history) {
        if (history.length < 5) return false;

        const latest = history[history.length - 1].orientation;

        // 4방향 기울기 감지
        if (latest.beta > this.threshold) {
            this.direction = 'forward';
            return true;
        } else if (latest.beta < -this.threshold) {
            this.direction = 'backward';
            return true;
        } else if (latest.gamma > this.threshold) {
            this.direction = 'right';
            return true;
        } else if (latest.gamma < -this.threshold) {
            this.direction = 'left';
            return true;
        }

        this.direction = null;
        return false;
    }

    getConfidence() {
        return this.direction ? 0.85 : 0.0;
    }

    getData() {
        return {
            type: 'tilt',
            direction: this.direction
        };
    }
}

// 회전 제스처
class RotateGesture {
    constructor() {
        this.threshold = 90; // 90도 회전
        this.totalRotation = 0;
        this.direction = null;
    }

    recognize(history) {
        if (history.length < 10) return false;

        const start = history[0].orientation.alpha;
        const end = history[history.length - 1].orientation.alpha;

        let angleDiff = end - start;

        // -180 ~ 180 범위로 정규화
        if (angleDiff > 180) angleDiff -= 360;
        if (angleDiff < -180) angleDiff += 360;

        this.totalRotation = Math.abs(angleDiff);

        if (this.totalRotation > this.threshold) {
            this.direction = angleDiff > 0 ? 'clockwise' : 'counterclockwise';
            return true;
        }

        this.direction = null;
        return false;
    }

    getConfidence() {
        const confidence = Math.min(this.totalRotation / 180, 1.0);
        return this.direction ? confidence : 0.0;
    }

    getData() {
        return {
            type: 'rotate',
            direction: this.direction,
            angle: this.totalRotation
        };
    }
}

// 사용 예
const gestureRecognizer = new GestureRecognizer();

sdk.on('sensor-data', (event) => {
    const data = event.detail || event;
    const gestures = gestureRecognizer.processData(data.data);

    gestures.forEach(gesture => {
        console.log(`제스처 감지: ${gesture.name}`, gesture.data);

        switch(gesture.name) {
            case 'shake':
                onShake();
                break;
            case 'tilt':
                onTilt(gesture.data.direction);
                break;
            case 'rotate':
                onRotate(gesture.data.direction, gesture.data.angle);
                break;
        }
    });
});
```

---

## 🎯 센서 캘리브레이션

### 자동 캘리브레이션 시스템

```javascript
class SensorCalibration {
    constructor() {
        this.samples = [];
        this.maxSamples = 60; // 1초 동안 (60fps 기준)
        this.calibrated = false;

        this.baseline = {
            orientation: { alpha: 0, beta: 0, gamma: 0 },
            acceleration: { x: 0, y: -9.8, z: 0 }
        };
    }

    addSample(sensorData) {
        this.samples.push({
            orientation: { ...sensorData.orientation },
            acceleration: { ...sensorData.acceleration }
        });

        if (this.samples.length > this.maxSamples) {
            this.samples.shift();
        }

        // 충분한 샘플이 모이면 캘리브레이션
        if (this.samples.length === this.maxSamples && !this.calibrated) {
            this.calibrate();
        }
    }

    calibrate() {
        // 평균 계산
        const sum = this.samples.reduce((acc, sample) => ({
            orientation: {
                alpha: acc.orientation.alpha + sample.orientation.alpha,
                beta: acc.orientation.beta + sample.orientation.beta,
                gamma: acc.orientation.gamma + sample.orientation.gamma
            },
            acceleration: {
                x: acc.acceleration.x + sample.acceleration.x,
                y: acc.acceleration.y + sample.acceleration.y,
                z: acc.acceleration.z + sample.acceleration.z
            }
        }), {
            orientation: { alpha: 0, beta: 0, gamma: 0 },
            acceleration: { x: 0, y: 0, z: 0 }
        });

        const count = this.samples.length;

        this.baseline = {
            orientation: {
                alpha: sum.orientation.alpha / count,
                beta: sum.orientation.beta / count,
                gamma: sum.orientation.gamma / count
            },
            acceleration: {
                x: sum.acceleration.x / count,
                y: sum.acceleration.y / count,
                z: sum.acceleration.z / count
            }
        };

        this.calibrated = true;
        console.log('센서 캘리브레이션 완료:', this.baseline);
    }

    apply(sensorData) {
        if (!this.calibrated) return sensorData;

        return {
            orientation: {
                alpha: sensorData.orientation.alpha - this.baseline.orientation.alpha,
                beta: sensorData.orientation.beta - this.baseline.orientation.beta,
                gamma: sensorData.orientation.gamma - this.baseline.orientation.gamma
            },
            acceleration: {
                x: sensorData.acceleration.x - this.baseline.acceleration.x,
                y: sensorData.acceleration.y - this.baseline.acceleration.y,
                z: sensorData.acceleration.z - this.baseline.acceleration.z
            },
            rotationRate: sensorData.rotationRate // 회전 속도는 보정 불필요
        };
    }

    reset() {
        this.samples = [];
        this.calibrated = false;
    }

    isCalibrated() {
        return this.calibrated;
    }
}

// 사용 예
const calibration = new SensorCalibration();

// 캘리브레이션 UI
function showCalibrationUI() {
    const overlay = document.createElement('div');
    overlay.innerHTML = `
        <div style="text-align: center; padding: 2rem;">
            <h2>센서 캘리브레이션</h2>
            <p>핸드폰을 평평한 곳에 놓고 잠시 기다려주세요...</p>
            <div class="progress-bar">
                <div id="calibration-progress"></div>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
}

sdk.on('connected', () => {
    sdk.createSession();
    showCalibrationUI();
});

sdk.on('sensor-data', (event) => {
    const data = event.detail || event;

    if (!calibration.isCalibrated()) {
        calibration.addSample(data.data);

        // 진행률 표시
        const progress = (calibration.samples.length / calibration.maxSamples) * 100;
        document.getElementById('calibration-progress').style.width = `${progress}%`;

        if (calibration.isCalibrated()) {
            hideCalibrationUI();
            startGame();
        }
    } else {
        // 보정된 데이터 사용
        const calibratedData = calibration.apply(data.data);
        updateGame(calibratedData);
    }
});
```

---

## 🚀 고급 센서 처리 기법

### 1. 센서 퓨전 (Sensor Fusion)

```javascript
class SensorFusion {
    constructor() {
        this.orientation = { alpha: 0, beta: 0, gamma: 0 };
        this.gyroWeight = 0.98;
        this.accelWeight = 0.02;
    }

    // 자이로스코프와 가속도계 데이터 융합
    fuse(gyroData, accelData, deltaTime) {
        // 자이로스코프로 방향 업데이트 (드리프트 발생)
        this.orientation.alpha += gyroData.alpha * deltaTime;
        this.orientation.beta += gyroData.beta * deltaTime;
        this.orientation.gamma += gyroData.gamma * deltaTime;

        // 가속도계로 방향 계산 (노이즈 있지만 드리프트 없음)
        const accelOrientation = this.calculateOrientationFromAccel(accelData);

        // 상호 보완 필터 (Complementary Filter)
        this.orientation.alpha = this.gyroWeight * this.orientation.alpha +
                                 this.accelWeight * accelOrientation.alpha;
        this.orientation.beta = this.gyroWeight * this.orientation.beta +
                                this.accelWeight * accelOrientation.beta;
        this.orientation.gamma = this.gyroWeight * this.orientation.gamma +
                                 this.accelWeight * accelOrientation.gamma;

        return { ...this.orientation };
    }

    calculateOrientationFromAccel(accel) {
        // 가속도계로부터 pitch(beta)와 roll(gamma) 계산
        const pitch = Math.atan2(-accel.x, Math.sqrt(accel.y ** 2 + accel.z ** 2)) *
                     (180 / Math.PI);
        const roll = Math.atan2(accel.y, accel.z) * (180 / Math.PI);

        return {
            alpha: this.orientation.alpha, // 가속도계로는 방위각 계산 불가
            beta: pitch,
            gamma: roll
        };
    }
}
```

### 2. 예측 및 보간 (Prediction & Interpolation)

```javascript
class SensorPredictor {
    constructor() {
        this.history = [];
        this.maxHistory = 3;
    }

    addSample(data, timestamp) {
        this.history.push({ data: { ...data }, timestamp });

        if (this.history.length > this.maxHistory) {
            this.history.shift();
        }
    }

    // 선형 예측
    predict(futureTime) {
        if (this.history.length < 2) {
            return this.history[this.history.length - 1]?.data || null;
        }

        const latest = this.history[this.history.length - 1];
        const previous = this.history[this.history.length - 2];

        const timeDiff = latest.timestamp - previous.timestamp;
        const predictDiff = futureTime - latest.timestamp;

        const ratio = predictDiff / timeDiff;

        // 각 축에 대해 선형 예측
        return {
            alpha: latest.data.alpha + (latest.data.alpha - previous.data.alpha) * ratio,
            beta: latest.data.beta + (latest.data.beta - previous.data.beta) * ratio,
            gamma: latest.data.gamma + (latest.data.gamma - previous.data.gamma) * ratio
        };
    }

    // 부드러운 보간
    interpolate(t) {
        if (this.history.length < 2) {
            return this.history[this.history.length - 1]?.data || null;
        }

        const latest = this.history[this.history.length - 1];
        const previous = this.history[this.history.length - 2];

        // Cubic 보간으로 부드러운 전환
        const smoothT = this.smoothstep(t);

        return {
            alpha: this.lerp(previous.data.alpha, latest.data.alpha, smoothT),
            beta: this.lerp(previous.data.beta, latest.data.beta, smoothT),
            gamma: this.lerp(previous.data.gamma, latest.data.gamma, smoothT)
        };
    }

    lerp(a, b, t) {
        return a + (b - a) * t;
    }

    smoothstep(t) {
        return t * t * (3 - 2 * t);
    }
}
```

---

## 📱 크로스 플랫폼 호환성

```javascript
class CrossPlatformSensorHandler {
    constructor() {
        this.platform = this.detectPlatform();
        this.sensorAvailable = this.checkSensorAvailability();
    }

    detectPlatform() {
        const ua = navigator.userAgent;

        if (/iPhone|iPad|iPod/.test(ua)) {
            return 'ios';
        } else if (/Android/.test(ua)) {
            return 'android';
        } else {
            return 'unknown';
        }
    }

    checkSensorAvailability() {
        return {
            orientation: 'DeviceOrientationEvent' in window,
            motion: 'DeviceMotionEvent' in window,
            accelerometer: 'Accelerometer' in window,
            gyroscope: 'Gyroscope' in window
        };
    }

    // iOS 13+ 권한 요청
    async requestPermission() {
        if (this.platform === 'ios' &&
            typeof DeviceOrientationEvent.requestPermission === 'function') {

            try {
                const permission = await DeviceOrientationEvent.requestPermission();

                if (permission === 'granted') {
                    console.log('센서 권한 승인됨');
                    return true;
                } else {
                    console.warn('센서 권한 거부됨');
                    return false;
                }
            } catch (error) {
                console.error('권한 요청 실패:', error);
                return false;
            }
        }

        // Android는 권한 불필요
        return true;
    }

    // 플랫폼별 센서 데이터 정규화
    normalizeSensorData(rawData) {
        if (this.platform === 'android') {
            // Android는 beta 값이 반대
            return {
                alpha: rawData.alpha,
                beta: -rawData.beta,
                gamma: rawData.gamma
            };
        }

        return rawData;
    }
}
```

---

## 🎓 핵심 원칙 요약

1. **노이즈 제거**: 저역 통과 필터, 칼만 필터 적용
2. **제스처 인식**: 센서 히스토리 기반 패턴 매칭
3. **캘리브레이션**: 자동 보정으로 정확도 향상
4. **센서 퓨전**: 여러 센서 데이터 융합으로 정확도 향상
5. **플랫폼 호환**: iOS/Android 차이 고려

---

## 📖 다음 단계

- [물리 엔진 구현](./04-physics-engine.md)
- [UI/UX 패턴](./05-ui-ux-patterns.md)
- [성능 최적화](./06-performance-optimization.md)
