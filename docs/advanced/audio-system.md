# 🔊 Sensor Game Hub v6.0 - 오디오 시스템 완전 가이드

## 📋 목차
1. [오디오 시스템 개요](#오디오-시스템-개요)
2. [AI 통합 오디오 엔진](#ai-통합-오디오-엔진)
3. [센서 기반 3D 오디오](#센서-기반-3d-오디오)
4. [적응형 오디오 최적화](#적응형-오디오-최적화)

---

## 🎯 오디오 시스템 개요

### 시스템 철학
Sensor Game Hub v6.0의 오디오 시스템은 **Phase 2.2 AI 시스템과 완전 통합**된 지능형 3D 오디오 솔루션입니다. 센서 데이터를 활용한 공간 오디오와 AI 기반 적응형 사운드를 통해 몰입감 있는 오디오 경험을 제공합니다.

### 핵심 특징
- **센서 연동 3D 오디오**: 디바이스 방향에 따른 실시간 공간음향
- **AI 기반 적응형 믹싱**: 사용자 선호도와 환경을 학습한 동적 오디오 조절
- **지능형 오디오 압축**: 네트워크 상황에 맞는 적응형 오디오 품질
- **예측형 오디오 로딩**: 게임 상황을 예측한 선제적 오디오 리소스 로딩
- **환경 인식 오디오**: 주변 소음을 분석한 최적화된 오디오 출력

---

## 🤖 AI 통합 오디오 엔진

### 지능형 오디오 시스템 클래스
```javascript
// Phase 2.2 AI 시스템 완전 통합 오디오 엔진
class IntelligentAudioSystem {
    constructor(options = {}) {
        // AI 시스템 통합
        this.contextManager = new ContextManager({
            sessionType: 'audio_system',
            aiFeatures: ['audio_optimization', 'spatial_processing', 'user_preference_learning']
        });

        this.realTimeDebugger = new RealTimeDebugger({
            category: 'audio_system_debugging',
            enableAutoRecovery: true
        });

        this.satisfactionTracker = new UserSatisfactionTracker({
            category: 'audio_experience',
            realTimeTracking: true
        });

        // Web Audio API 컨텍스트
        this.audioContext = null;
        this.audioWorklet = null;

        // AI 기반 적응형 오디오 설정
        this.adaptiveSettings = {
            masterVolume: options.masterVolume || 1.0,
            spatialAudio: options.spatialAudio !== false,
            qualityLevel: 1.0,
            compressionLevel: 0,
            dynamicRange: 'full', // 'full', 'compressed', 'night'
            environmentProfile: 'default'
        };

        // 3D 오디오 시스템
        this.spatialAudio = {
            listener: null,
            pannerNodes: new Map(),
            convolver: null,
            reverbSettings: {
                roomSize: 'medium',
                damping: 0.3,
                wetness: 0.2
            }
        };

        // AI 기반 오디오 최적화
        this.audioOptimizer = {
            mixingModel: null,
            compressionModel: null,
            environmentAnalyzer: null,
            preferenceTracker: null
        };

        // 오디오 리소스 관리
        this.audioResources = {
            buffers: new Map(),
            sources: new Map(),
            effects: new Map(),
            streams: new Map()
        };

        // 오디오 처리 체인
        this.audioChain = {
            inputGain: null,
            compressor: null,
            equalizer: null,
            spatialProcessor: null,
            masterGain: null,
            analyzer: null
        };

        // 성능 메트릭
        this.performanceMetrics = {
            latency: 0,
            cpuUsage: 0,
            memoryUsage: 0,
            activeNodes: 0,
            processingTime: 0
        };
    }

    // 오디오 시스템 초기화
    async initialize() {
        try {
            // Web Audio API 컨텍스트 생성
            await this.initializeAudioContext();

            // AI 시스템 초기화
            await this.contextManager.initialize();

            // AI 기반 오디오 모델 로딩
            await this.initializeAIModels();

            // 3D 오디오 설정
            await this.setup3DAudio();

            // 오디오 처리 체인 구성
            await this.setupAudioChain();

            // 환경 분석 시작
            await this.startEnvironmentAnalysis();

            console.log('🔊 Intelligent Audio System initialized');

        } catch (error) {
            this.realTimeDebugger.handleError(error, 'audio_system_initialization');
            throw error;
        }
    }

    // Web Audio API 컨텍스트 초기화
    async initializeAudioContext() {
        // AudioContext 생성 (모바일 호환성 고려)
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        this.audioContext = new AudioContextClass({
            latencyHint: 'interactive',
            sampleRate: 44100
        });

        // 사용자 제스처 후 컨텍스트 재개 (모바일 정책)
        if (this.audioContext.state === 'suspended') {
            document.addEventListener('touchstart', () => {
                this.audioContext.resume();
            }, { once: true });

            document.addEventListener('click', () => {
                this.audioContext.resume();
            }, { once: true });
        }

        // AudioWorklet 로딩 (고급 오디오 처리용)
        try {
            await this.audioContext.audioWorklet.addModule('/js/audio-processors/spatial-processor.js');
            console.log('✅ AudioWorklet loaded');
        } catch (error) {
            console.warn('AudioWorklet not available, falling back to ScriptProcessor');
        }

        console.log(`✅ AudioContext created (${this.audioContext.sampleRate}Hz)`);
    }

    // AI 모델 초기화
    async initializeAIModels() {
        // 오디오 믹싱 모델
        this.audioOptimizer.mixingModel = await this.contextManager.createAIModel({
            type: 'audio_mixing',
            features: ['volume_levels', 'frequency_spectrum', 'user_preference', 'environment_noise'],
            algorithm: 'neural_network'
        });

        // 오디오 압축 모델
        this.audioOptimizer.compressionModel = await this.contextManager.createAIModel({
            type: 'audio_compression',
            features: ['bandwidth', 'latency', 'quality_preference', 'device_capability'],
            algorithm: 'decision_tree'
        });

        // 환경 분석 모델
        this.audioOptimizer.environmentAnalyzer = await this.contextManager.createAIModel({
            type: 'environment_analysis',
            features: ['ambient_noise', 'room_acoustics', 'device_type', 'listening_context'],
            algorithm: 'clustering'
        });

        // 사용자 선호도 추적 모델
        this.audioOptimizer.preferenceTracker = await this.contextManager.createAIModel({
            type: 'user_preference',
            features: ['volume_adjustments', 'eq_settings', 'spatial_preferences', 'interaction_patterns'],
            algorithm: 'collaborative_filtering'
        });
    }

    // 3D 오디오 설정
    async setup3DAudio() {
        // 리스너 설정 (플레이어 위치)
        this.spatialAudio.listener = this.audioContext.listener;

        // Panner 모델 설정 (HRTF 선호)
        if (this.spatialAudio.listener.positionX) {
            // 최신 Web Audio API 사용
            this.spatialAudio.listener.positionX.value = 0;
            this.spatialAudio.listener.positionY.value = 0;
            this.spatialAudio.listener.positionZ.value = 0;

            this.spatialAudio.listener.forwardX.value = 0;
            this.spatialAudio.listener.forwardY.value = 0;
            this.spatialAudio.listener.forwardZ.value = -1;

            this.spatialAudio.listener.upX.value = 0;
            this.spatialAudio.listener.upY.value = 1;
            this.spatialAudio.listener.upZ.value = 0;
        }

        // 리버브 설정
        await this.setupReverb();

        console.log('🎧 3D Audio system configured');
    }

    // 리버브 설정
    async setupReverb() {
        // 컨볼루션 리버브 노드 생성
        this.spatialAudio.convolver = this.audioContext.createConvolver();

        // 임펄스 응답 생성 (AI 기반 공간 시뮬레이션)
        const impulseResponse = await this.generateImpulseResponse();
        this.spatialAudio.convolver.buffer = impulseResponse;

        console.log('🏠 Reverb system configured');
    }

    // 임펄스 응답 생성
    async generateImpulseResponse() {
        const settings = this.spatialAudio.reverbSettings;
        const sampleRate = this.audioContext.sampleRate;
        const length = sampleRate * 3; // 3초 리버브

        const impulse = this.audioContext.createBuffer(2, length, sampleRate);
        const left = impulse.getChannelData(0);
        const right = impulse.getChannelData(1);

        // AI 기반 룸 특성 시뮬레이션
        for (let i = 0; i < length; i++) {
            const decay = Math.pow(1 - (i / length), 2 * settings.damping);
            const noise = (Math.random() * 2 - 1) * decay;

            left[i] = noise * 0.5;
            right[i] = noise * 0.5;
        }

        return impulse;
    }

    // 오디오 처리 체인 구성
    async setupAudioChain() {
        // 입력 게인
        this.audioChain.inputGain = this.audioContext.createGain();
        this.audioChain.inputGain.gain.value = 1.0;

        // 컴프레서 (동적 범위 조절)
        this.audioChain.compressor = this.audioContext.createDynamicsCompressor();
        this.audioChain.compressor.threshold.value = -24;
        this.audioChain.compressor.knee.value = 30;
        this.audioChain.compressor.ratio.value = 12;
        this.audioChain.compressor.attack.value = 0.003;
        this.audioChain.compressor.release.value = 0.25;

        // 이퀄라이저 (주파수 조절)
        await this.setupEqualizer();

        // 공간 오디오 프로세서
        if (this.audioContext.audioWorklet) {
            this.audioChain.spatialProcessor = new AudioWorkletNode(
                this.audioContext,
                'spatial-processor',
                {
                    numberOfInputs: 1,
                    numberOfOutputs: 1,
                    channelCount: 2
                }
            );
        }

        // 마스터 게인
        this.audioChain.masterGain = this.audioContext.createGain();
        this.audioChain.masterGain.gain.value = this.adaptiveSettings.masterVolume;

        // 오디오 분석기
        this.audioChain.analyzer = this.audioContext.createAnalyser();
        this.audioChain.analyzer.fftSize = 2048;
        this.audioChain.analyzer.smoothingTimeConstant = 0.8;

        // 체인 연결
        this.connectAudioChain();

        console.log('🔗 Audio processing chain configured');
    }

    // 이퀄라이저 설정
    async setupEqualizer() {
        const frequencies = [60, 170, 350, 1000, 3500, 10000];
        this.audioChain.equalizer = frequencies.map(freq => {
            const filter = this.audioContext.createBiquadFilter();
            filter.type = 'peaking';
            filter.frequency.value = freq;
            filter.Q.value = 1;
            filter.gain.value = 0;
            return filter;
        });

        // EQ 필터 체인 연결
        for (let i = 0; i < this.audioChain.equalizer.length - 1; i++) {
            this.audioChain.equalizer[i].connect(this.audioChain.equalizer[i + 1]);
        }
    }

    // 오디오 체인 연결
    connectAudioChain() {
        let currentNode = this.audioChain.inputGain;

        // 컴프레서 연결
        currentNode.connect(this.audioChain.compressor);
        currentNode = this.audioChain.compressor;

        // 이퀄라이저 연결
        if (this.audioChain.equalizer.length > 0) {
            currentNode.connect(this.audioChain.equalizer[0]);
            currentNode = this.audioChain.equalizer[this.audioChain.equalizer.length - 1];
        }

        // 공간 프로세서 연결
        if (this.audioChain.spatialProcessor) {
            currentNode.connect(this.audioChain.spatialProcessor);
            currentNode = this.audioChain.spatialProcessor;
        }

        // 마스터 게인 연결
        currentNode.connect(this.audioChain.masterGain);

        // 분석기 및 출력 연결
        this.audioChain.masterGain.connect(this.audioChain.analyzer);
        this.audioChain.masterGain.connect(this.audioContext.destination);
    }

    // 3D 오디오 소스 생성
    async create3DAudioSource(audioBuffer, position = { x: 0, y: 0, z: 0 }) {
        const source = this.audioContext.createBufferSource();
        source.buffer = audioBuffer;

        // 3D 패너 노드 생성
        const panner = this.audioContext.createPanner();
        panner.panningModel = 'HRTF';
        panner.distanceModel = 'inverse';
        panner.maxDistance = 1000;
        panner.rolloffFactor = 1;
        panner.coneInnerAngle = 360;
        panner.coneOuterAngle = 0;
        panner.coneOuterGain = 0;

        // 위치 설정
        if (panner.positionX) {
            panner.positionX.value = position.x;
            panner.positionY.value = position.y;
            panner.positionZ.value = position.z;
        } else {
            panner.setPosition(position.x, position.y, position.z);
        }

        // 연결
        source.connect(panner);
        panner.connect(this.audioChain.inputGain);

        // 리버브 연결 (옵션)
        if (this.spatialAudio.convolver && this.spatialAudio.reverbSettings.wetness > 0) {
            const dryGain = this.audioContext.createGain();
            const wetGain = this.audioContext.createGain();

            dryGain.gain.value = 1 - this.spatialAudio.reverbSettings.wetness;
            wetGain.gain.value = this.spatialAudio.reverbSettings.wetness;

            panner.connect(dryGain);
            panner.connect(this.spatialAudio.convolver);
            this.spatialAudio.convolver.connect(wetGain);

            dryGain.connect(this.audioChain.inputGain);
            wetGain.connect(this.audioChain.inputGain);
        }

        // 패너 노드 등록
        const sourceId = this.generateSourceId();
        this.spatialAudio.pannerNodes.set(sourceId, panner);

        return {
            source: source,
            panner: panner,
            sourceId: sourceId,
            position: position
        };
    }

    // 센서 데이터로 리스너 업데이트
    async updateListenerFromSensor(sensorData) {
        if (!this.adaptiveSettings.spatialAudio) return;

        const { orientation } = sensorData;
        const listener = this.spatialAudio.listener;

        // 방향 벡터 계산
        const yaw = orientation.alpha * Math.PI / 180;
        const pitch = orientation.beta * Math.PI / 180;
        const roll = orientation.gamma * Math.PI / 180;

        // 전방 벡터 계산
        const forwardX = Math.sin(yaw) * Math.cos(pitch);
        const forwardY = -Math.sin(pitch);
        const forwardZ = -Math.cos(yaw) * Math.cos(pitch);

        // 상방 벡터 계산
        const upX = Math.sin(roll) * Math.cos(yaw);
        const upY = Math.cos(roll);
        const upZ = Math.sin(roll) * Math.sin(yaw);

        // 리스너 방향 업데이트
        if (listener.forwardX) {
            listener.forwardX.value = forwardX;
            listener.forwardY.value = forwardY;
            listener.forwardZ.value = forwardZ;

            listener.upX.value = upX;
            listener.upY.value = upY;
            listener.upZ.value = upZ;
        } else {
            listener.setOrientation(forwardX, forwardY, forwardZ, upX, upY, upZ);
        }

        // AI 기반 공간 오디오 최적화
        await this.optimizeSpatialAudio(sensorData);
    }

    // AI 기반 공간 오디오 최적화
    async optimizeSpatialAudio(sensorData) {
        // 센서 데이터 분석
        const motionIntensity = Math.sqrt(
            sensorData.acceleration.x ** 2 +
            sensorData.acceleration.y ** 2 +
            sensorData.acceleration.z ** 2
        );

        // 동적 공간 오디오 파라미터 조절
        if (motionIntensity > 5.0) {
            // 빠른 움직임 시 공간감 증가
            this.spatialAudio.reverbSettings.wetness = Math.min(0.4,
                this.spatialAudio.reverbSettings.wetness + 0.1
            );
        } else {
            // 정적 상태에서 공간감 감소
            this.spatialAudio.reverbSettings.wetness = Math.max(0.1,
                this.spatialAudio.reverbSettings.wetness - 0.05
            );
        }

        // 리버브 설정 업데이트
        await this.updateReverbSettings();
    }

    // 환경 분석 시작
    async startEnvironmentAnalysis() {
        // 마이크 접근 권한 요청 (환경 소음 분석용)
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const micSource = this.audioContext.createMediaStreamSource(stream);
            const micAnalyzer = this.audioContext.createAnalyser();

            micAnalyzer.fftSize = 1024;
            micSource.connect(micAnalyzer);

            // 주기적 환경 분석
            this.startEnvironmentMonitoring(micAnalyzer);

        } catch (error) {
            console.warn('Microphone access denied, using default environment settings');
        }
    }

    // 환경 모니터링
    startEnvironmentMonitoring(analyzer) {
        const bufferLength = analyzer.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const analyze = async () => {
            analyzer.getByteFrequencyData(dataArray);

            // 환경 소음 레벨 계산
            const averageLevel = dataArray.reduce((sum, value) => sum + value, 0) / bufferLength;
            const noiseLevel = averageLevel / 255;

            // AI 기반 환경 분석
            const environmentProfile = await this.audioOptimizer.environmentAnalyzer.analyze({
                noiseLevel: noiseLevel,
                frequencySpectrum: Array.from(dataArray),
                deviceType: this.detectDeviceType(),
                timeOfDay: new Date().getHours()
            });

            // 환경에 따른 오디오 조정
            await this.adaptToEnvironment(environmentProfile);

            // 1초마다 분석
            setTimeout(analyze, 1000);
        };

        analyze();
    }

    // 환경 적응
    async adaptToEnvironment(environmentProfile) {
        // 소음 환경에서 동적 범위 압축
        if (environmentProfile.noiseLevel > 0.3) {
            this.audioChain.compressor.threshold.value = -18;
            this.audioChain.compressor.ratio.value = 8;
        } else {
            this.audioChain.compressor.threshold.value = -24;
            this.audioChain.compressor.ratio.value = 4;
        }

        // 밤 시간 모드
        if (environmentProfile.timeContext === 'night') {
            this.adaptiveSettings.dynamicRange = 'night';
            this.audioChain.compressor.ratio.value = 16;
            this.audioChain.masterGain.gain.value *= 0.7;
        }

        // 환경 프로필 저장
        this.adaptiveSettings.environmentProfile = environmentProfile;
    }

    // 오디오 리소스 로딩
    async loadAudioResource(url, resourceId) {
        try {
            const response = await fetch(url);
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);

            this.audioResources.buffers.set(resourceId, audioBuffer);
            console.log(`🔊 Audio resource loaded: ${resourceId}`);

            return audioBuffer;

        } catch (error) {
            this.realTimeDebugger.handleError(error, 'audio_loading', { url, resourceId });
            throw error;
        }
    }

    // 오디오 재생
    async playAudio(resourceId, options = {}) {
        const audioBuffer = this.audioResources.buffers.get(resourceId);
        if (!audioBuffer) {
            throw new Error(`Audio resource not found: ${resourceId}`);
        }

        // 3D 오디오 소스 생성
        const audioSource = await this.create3DAudioSource(
            audioBuffer,
            options.position || { x: 0, y: 0, z: 0 }
        );

        // 재생 설정
        audioSource.source.loop = options.loop || false;
        audioSource.source.playbackRate.value = options.playbackRate || 1.0;

        // 볼륨 설정
        if (options.volume !== undefined) {
            const volumeGain = this.audioContext.createGain();
            volumeGain.gain.value = options.volume;
            audioSource.source.disconnect();
            audioSource.source.connect(volumeGain);
            volumeGain.connect(audioSource.panner);
        }

        // 재생 시작
        audioSource.source.start(0);

        // 리소스 등록
        this.audioResources.sources.set(audioSource.sourceId, audioSource);

        // AI 기반 재생 분석
        await this.analyzeAudioPlayback(resourceId, options);

        return audioSource.sourceId;
    }

    // AI 기반 재생 분석
    async analyzeAudioPlayback(resourceId, options) {
        // 사용자 선호도 학습
        await this.audioOptimizer.preferenceTracker.learn({
            resourceType: resourceId,
            volume: options.volume || 1.0,
            spatialPosition: options.position || { x: 0, y: 0, z: 0 },
            environmentContext: this.adaptiveSettings.environmentProfile,
            userContext: await this.contextManager.getUserContext()
        });

        // 사용자 만족도 추적
        this.satisfactionTracker.trackAudioEvent({
            type: 'audio_playback',
            resourceId: resourceId,
            settings: options,
            timestamp: Date.now()
        });
    }

    // 성능 메트릭 업데이트
    async updatePerformanceMetrics() {
        // 레이턴시 계산
        this.performanceMetrics.latency = this.audioContext.baseLatency +
                                        this.audioContext.outputLatency;

        // 활성 노드 수
        this.performanceMetrics.activeNodes = this.audioResources.sources.size;

        // CPU 사용량 추정
        this.performanceMetrics.cpuUsage = this.estimateAudioCPUUsage();

        // AI 분석을 위한 메트릭 전송
        await this.contextManager.trackPerformance('audio_system', this.performanceMetrics);
    }

    // 유틸리티 메서드들
    generateSourceId() {
        return `audio_source_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    detectDeviceType() {
        const userAgent = navigator.userAgent;
        if (/Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)) {
            return 'mobile';
        }
        return 'desktop';
    }

    estimateAudioCPUUsage() {
        // 간단한 CPU 사용량 추정
        return Math.min(100, this.performanceMetrics.activeNodes * 2);
    }

    // 정리
    async cleanup() {
        // 모든 오디오 소스 정지
        for (const [sourceId, audioSource] of this.audioResources.sources) {
            try {
                audioSource.source.stop();
                audioSource.source.disconnect();
                audioSource.panner.disconnect();
            } catch (error) {
                // 이미 정지된 소스 무시
            }
        }

        // 리소스 정리
        this.audioResources.sources.clear();
        this.audioResources.buffers.clear();
        this.spatialAudio.pannerNodes.clear();

        // AudioContext 정리
        if (this.audioContext && this.audioContext.state !== 'closed') {
            await this.audioContext.close();
        }

        // AI 시스템 정리
        await this.contextManager.cleanup();

        console.log('🧹 Audio System cleanup completed');
    }
}
```

---

## 📱 센서 기반 3D 오디오

### 센서 오디오 인터랙션 시스템
```javascript
class SensorAudioInteraction {
    constructor(audioSystem) {
        this.audioSystem = audioSystem;
        this.sensorProcessor = new SensorDataProcessor();

        // 제스처 기반 오디오 제어
        this.gestureAudioMapping = {
            'shake': 'pause_all',
            'tilt_left': 'volume_down',
            'tilt_right': 'volume_up',
            'double_tap': 'toggle_spatial',
            'rotation_cw': 'next_track',
            'rotation_ccw': 'prev_track'
        };

        // 모션 기반 오디오 효과
        this.motionEffects = {
            walkingEffect: new WalkingAudioEffect(),
            runningEffect: new RunningAudioEffect(),
            jumpEffect: new JumpAudioEffect()
        };
    }

    // 센서 데이터로 오디오 제어
    async processSensorAudio(sensorData) {
        // 3D 리스너 업데이트
        await this.audioSystem.updateListenerFromSensor(sensorData);

        // 모션 감지 및 오디오 효과
        const motion = await this.detectMotion(sensorData);
        if (motion.type !== 'static') {
            await this.applyMotionAudioEffect(motion);
        }

        // 제스처 기반 오디오 제어
        const gesture = await this.detectAudioGesture(sensorData);
        if (gesture.confidence > 0.8) {
            await this.handleAudioGesture(gesture);
        }
    }

    // 모션 감지
    async detectMotion(sensorData) {
        const acceleration = sensorData.acceleration;
        const magnitude = Math.sqrt(
            acceleration.x ** 2 + acceleration.y ** 2 + acceleration.z ** 2
        );

        if (magnitude > 15) {
            return { type: 'running', intensity: magnitude / 20 };
        } else if (magnitude > 8) {
            return { type: 'walking', intensity: magnitude / 15 };
        } else if (magnitude > 20) {
            return { type: 'jumping', intensity: 1.0 };
        }

        return { type: 'static', intensity: 0 };
    }

    // 모션 오디오 효과 적용
    async applyMotionAudioEffect(motion) {
        switch (motion.type) {
            case 'walking':
                await this.motionEffects.walkingEffect.apply(motion.intensity);
                break;
            case 'running':
                await this.motionEffects.runningEffect.apply(motion.intensity);
                break;
            case 'jumping':
                await this.motionEffects.jumpEffect.apply(motion.intensity);
                break;
        }
    }
}
```

---

## ⚡ 적응형 오디오 최적화

### AI 기반 오디오 품질 관리
```javascript
class AdaptiveAudioQualityManager {
    constructor(audioSystem) {
        this.audioSystem = audioSystem;
        this.qualityModel = null;
        this.networkMonitor = new NetworkMonitor();
    }

    // 네트워크 상황에 따른 오디오 품질 조절
    async adaptToNetworkConditions() {
        const networkStatus = await this.networkMonitor.getStatus();

        if (networkStatus.bandwidth < 100000) { // 100kbps 미만
            // 오디오 압축 레벨 증가
            await this.audioSystem.setCompressionLevel(0.8);
            // 공간 오디오 비활성화
            this.audioSystem.adaptiveSettings.spatialAudio = false;
        } else if (networkStatus.bandwidth > 1000000) { // 1Mbps 초과
            // 고품질 오디오 활성화
            await this.audioSystem.setCompressionLevel(0.1);
            this.audioSystem.adaptiveSettings.spatialAudio = true;
        }
    }

    // 배터리 상태에 따른 최적화
    async adaptToBatteryLevel() {
        if ('getBattery' in navigator) {
            const battery = await navigator.getBattery();

            if (battery.level < 0.2) { // 배터리 20% 미만
                // 파워 세이빙 모드
                this.audioSystem.adaptiveSettings.spatialAudio = false;
                await this.audioSystem.setQualityLevel(0.6);
            }
        }
    }
}
```

이렇게 audio-system.md (2페이지)를 완성했습니다. Phase 2.2 AI 시스템들을 완전히 통합한 지능형 오디오 시스템을 구현했습니다.

다음으로 pwa-implementation.md (2페이지)를 작성하겠습니다.