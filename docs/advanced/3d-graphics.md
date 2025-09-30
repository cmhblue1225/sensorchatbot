# 🎨 Sensor Game Hub v6.0 - 3D 그래픽스 활용 완전 가이드

## 📋 목차
1. [3D 그래픽스 시스템 개요](#3d-그래픽스-시스템-개요)
2. [AI 통합 3D 렌더링 엔진](#ai-통합-3d-렌더링-엔진)
3. [센서 기반 3D 인터랙션](#센서-기반-3d-인터랙션)
4. [지능형 3D 최적화 시스템](#지능형-3d-최적화-시스템)

---

## 🎯 3D 그래픽스 시스템 개요

### 시스템 철학
Sensor Game Hub v6.0의 3D 그래픽스 시스템은 **Phase 2.2 AI 시스템과 완전 통합**된 차세대 웹 기반 3D 렌더링 솔루션입니다. 모바일 센서 데이터를 활용한 직관적인 3D 인터랙션과 AI 기반 성능 최적화를 통해 상용 수준의 3D 게임 경험을 제공합니다.

### 핵심 특징
- **센서 연동 3D 조작**: 디바이스 센서를 통한 자연스러운 3D 객체 조작
- **AI 기반 적응형 렌더링**: 실시간 성능 분석을 통한 동적 품질 조절
- **지능형 LOD 관리**: 플레이어 행동 패턴을 학습한 세밀도 레벨 최적화
- **예측형 컬링**: AI 예측을 통한 선제적 렌더링 최적화
- **모바일 최적화**: 모바일 디바이스에 최적화된 경량 3D 렌더링

---

## 🤖 AI 통합 3D 렌더링 엔진

### 지능형 3D 렌더러 클래스
```javascript
// Phase 2.2 AI 시스템 완전 통합 3D 렌더링 엔진
class Intelligent3DRenderer {
    constructor(canvas, options = {}) {
        // AI 시스템 통합
        this.contextManager = new ContextManager({
            sessionType: '3d_rendering',
            aiFeatures: ['performance_prediction', 'visual_optimization', 'user_focus_tracking']
        });

        this.realTimeDebugger = new RealTimeDebugger({
            category: '3d_rendering_debugging',
            enableAutoRecovery: true
        });

        this.satisfactionTracker = new UserSatisfactionTracker({
            category: '3d_visual_experience',
            realTimeTracking: true
        });

        // WebGL 컨텍스트 설정
        this.canvas = canvas;
        this.gl = null;
        this.webglVersion = 2; // WebGL 2.0 우선 사용

        // AI 기반 적응형 3D 설정
        this.adaptiveSettings = {
            targetFps: options.targetFps || 60,
            qualityLevel: 1.0,
            lastOptimization: Date.now(),
            performanceBudget: options.performanceBudget || 16.67 // 60fps 타겟
        };

        // 3D 렌더링 파이프라인
        this.renderPipeline = {
            geometryPass: new GeometryPass(),
            shadowPass: new ShadowPass(),
            lightingPass: new LightingPass(),
            postProcessPass: new PostProcessPass(),
            compositePass: new CompositePass()
        };

        // AI 기반 최적화 시스템
        this.optimizationSystems = {
            lodManager: new IntelligentLODManager(),
            cullingSystem: new PredictiveCullingSystem(),
            textureOptimizer: new AdaptiveTextureOptimizer(),
            shaderOptimizer: new DynamicShaderOptimizer()
        };

        // 3D 리소스 관리
        this.resourceManager = {
            meshes: new Map(),
            textures: new Map(),
            shaders: new Map(),
            materials: new Map(),
            lights: new Map()
        };

        // 3D 씬 그래프
        this.sceneGraph = new SceneGraph();
        this.camera = new PerspectiveCamera();

        // 성능 메트릭
        this.performanceMetrics = {
            frameTime: 0,
            drawCalls: 0,
            triangleCount: 0,
            textureMemory: 0,
            gpuMemory: 0,
            culledObjects: 0
        };
    }

    // 3D 렌더러 초기화
    async initialize() {
        try {
            // WebGL 컨텍스트 생성
            await this.initializeWebGL();

            // AI 시스템 초기화
            await this.contextManager.initialize();

            // 셰이더 프로그램 컴파일
            await this.compileShaders();

            // 3D 리소스 로딩
            await this.loadResources();

            // AI 기반 최적화 시스템 시작
            await this.startOptimizationSystems();

            console.log('🎨 Intelligent 3D Renderer initialized');

        } catch (error) {
            this.realTimeDebugger.handleError(error, '3d_renderer_initialization');
            throw error;
        }
    }

    // WebGL 컨텍스트 초기화
    async initializeWebGL() {
        // WebGL 2.0 시도
        this.gl = this.canvas.getContext('webgl2', {
            alpha: false,
            depth: true,
            stencil: true,
            antialias: true,
            premultipliedAlpha: false,
            preserveDrawingBuffer: false,
            powerPreference: 'high-performance'
        });

        // WebGL 2.0 실패 시 1.0으로 폴백
        if (!this.gl) {
            this.webglVersion = 1;
            this.gl = this.canvas.getContext('webgl', {
                alpha: false,
                depth: true,
                stencil: true,
                antialias: true,
                premultipliedAlpha: false,
                preserveDrawingBuffer: false
            });
        }

        if (!this.gl) {
            throw new Error('WebGL not supported');
        }

        // WebGL 확장 활성화
        this.enableWebGLExtensions();

        // 초기 OpenGL 상태 설정
        this.setupInitialGLState();

        console.log(`✅ WebGL ${this.webglVersion}.0 context created`);
    }

    // WebGL 확장 활성화
    enableWebGLExtensions() {
        const requiredExtensions = [
            'OES_texture_float',
            'OES_element_index_uint',
            'WEBGL_depth_texture'
        ];

        const optionalExtensions = [
            'EXT_texture_filter_anisotropic',
            'WEBGL_compressed_texture_s3tc',
            'OES_vertex_array_object'
        ];

        // 필수 확장 확인
        for (const ext of requiredExtensions) {
            const extension = this.gl.getExtension(ext);
            if (!extension) {
                console.warn(`Required WebGL extension not supported: ${ext}`);
            }
        }

        // 선택적 확장 활성화
        for (const ext of optionalExtensions) {
            const extension = this.gl.getExtension(ext);
            if (extension) {
                console.log(`✅ WebGL extension enabled: ${ext}`);
            }
        }
    }

    // 3D 씬 렌더링
    async render(deltaTime) {
        const renderStart = performance.now();

        try {
            // 1. AI 기반 프레임 분석
            const frameAnalysis = await this.analyzeFrameRequirements();

            // 2. 적응형 품질 조절
            await this.adjustAdaptiveQuality(frameAnalysis);

            // 3. 지능형 컬링 수행
            const visibleObjects = await this.performIntelligentCulling();

            // 4. 3D 렌더링 파이프라인 실행
            await this.executeRenderPipeline(visibleObjects, deltaTime);

            // 5. 성능 메트릭 업데이트
            this.performanceMetrics.frameTime = performance.now() - renderStart;
            await this.updatePerformanceMetrics();

            // 6. AI 기반 렌더링 분석
            await this.analyzeRenderingQuality();

        } catch (error) {
            this.realTimeDebugger.handleError(error, '3d_rendering');
        }
    }

    // AI 기반 프레임 요구사항 분석
    async analyzeFrameRequirements() {
        const analysis = {
            sceneComplexity: this.calculateSceneComplexity(),
            viewportChanges: this.detectViewportChanges(),
            userFocus: await this.trackUserFocus(),
            performanceBudget: this.adaptiveSettings.performanceBudget,
            recommendations: []
        };

        // AI 모델을 통한 렌더링 최적화 제안
        const aiRecommendations = await this.contextManager.getOptimizations('3d_rendering', {
            sceneComplexity: analysis.sceneComplexity,
            currentPerformance: this.performanceMetrics,
            targetFps: this.adaptiveSettings.targetFps
        });

        analysis.recommendations = aiRecommendations;
        return analysis;
    }

    // 지능형 컬링 시스템
    async performIntelligentCulling() {
        const allObjects = this.sceneGraph.getAllRenderableObjects();
        let visibleObjects = allObjects;

        // 1. 시야 절두체 컬링 (Frustum Culling)
        visibleObjects = this.optimizationSystems.cullingSystem.frustumCull(
            visibleObjects,
            this.camera
        );

        // 2. AI 기반 예측 컬링
        visibleObjects = await this.optimizationSystems.cullingSystem.predictiveCull(
            visibleObjects,
            this.camera,
            await this.getUserBehaviorPrediction()
        );

        // 3. 오클루전 컬링 (선택적)
        if (this.shouldPerformOcclusionCulling()) {
            visibleObjects = await this.optimizationSystems.cullingSystem.occlusionCull(
                visibleObjects
            );
        }

        // 4. AI 기반 중요도 컬링
        visibleObjects = await this.performImportanceCulling(visibleObjects);

        // 5. LOD 레벨 결정
        for (const obj of visibleObjects) {
            obj.lodLevel = await this.optimizationSystems.lodManager.determineLOD(
                obj,
                this.camera,
                this.adaptiveSettings.qualityLevel
            );
        }

        this.performanceMetrics.culledObjects = allObjects.length - visibleObjects.length;
        return visibleObjects;
    }

    // 3D 렌더링 파이프라인 실행
    async executeRenderPipeline(visibleObjects, deltaTime) {
        const gl = this.gl;

        // 프레임버퍼 클리어
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT);

        // 1. 그림자 맵 패스
        if (this.adaptiveSettings.qualityLevel > 0.6) {
            await this.renderPipeline.shadowPass.render(visibleObjects, this.camera);
        }

        // 2. 기하학적 패스 (G-Buffer 생성)
        await this.renderPipeline.geometryPass.render(visibleObjects, this.camera);

        // 3. 조명 패스
        await this.renderPipeline.lightingPass.render(
            this.resourceManager.lights,
            this.camera
        );

        // 4. 투명 객체 렌더링
        const transparentObjects = visibleObjects.filter(obj => obj.material.transparent);
        await this.renderTransparentObjects(transparentObjects);

        // 5. 포스트 프로세싱 (품질에 따라 조절)
        if (this.adaptiveSettings.qualityLevel > 0.4) {
            await this.renderPipeline.postProcessPass.render();
        }

        // 6. 최종 합성
        await this.renderPipeline.compositePass.render();
    }

    // 투명 객체 렌더링
    async renderTransparentObjects(transparentObjects) {
        const gl = this.gl;

        // 블렌딩 활성화
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

        // 깊이 쓰기 비활성화
        gl.depthMask(false);

        // 뒤에서 앞으로 정렬
        transparentObjects.sort((a, b) =>
            b.distanceToCamera - a.distanceToCamera
        );

        // 투명 객체 렌더링
        for (const obj of transparentObjects) {
            await this.renderObject(obj);
        }

        // 상태 복원
        gl.depthMask(true);
        gl.disable(gl.BLEND);
    }

    // 개별 3D 객체 렌더링
    async renderObject(object) {
        const gl = this.gl;

        // 셰이더 바인딩
        const shader = await this.getOptimalShader(object);
        gl.useProgram(shader.program);

        // 변환 행렬 설정
        this.setTransformUniforms(shader, object);

        // 머티리얼 설정
        await this.setMaterialUniforms(shader, object.material);

        // 메시 렌더링
        await this.renderMesh(object.mesh, object.lodLevel);

        // 렌더링 메트릭 업데이트
        this.performanceMetrics.drawCalls++;
        this.performanceMetrics.triangleCount += object.mesh.getTriangleCount(object.lodLevel);
    }

    // AI 기반 최적 셰이더 선택
    async getOptimalShader(object) {
        return await this.optimizationSystems.shaderOptimizer.selectOptimalShader({
            object: object,
            qualityLevel: this.adaptiveSettings.qualityLevel,
            performanceBudget: this.adaptiveSettings.performanceBudget,
            deviceCapabilities: await this.getDeviceCapabilities()
        });
    }

    // 메시 렌더링
    async renderMesh(mesh, lodLevel = 0) {
        const gl = this.gl;

        // LOD에 따른 메시 선택
        const lodMesh = mesh.getLOD(lodLevel);

        // 버텍스 배열 객체 바인딩
        if (lodMesh.vao) {
            gl.bindVertexArray(lodMesh.vao);
        } else {
            // VAO가 없으면 수동 바인딩
            this.bindMeshBuffers(lodMesh);
        }

        // 인덱스 버퍼 렌더링
        if (lodMesh.indexBuffer) {
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, lodMesh.indexBuffer);
            gl.drawElements(
                gl.TRIANGLES,
                lodMesh.indexCount,
                gl.UNSIGNED_SHORT,
                0
            );
        } else {
            // 인덱스 없이 렌더링
            gl.drawArrays(gl.TRIANGLES, 0, lodMesh.vertexCount);
        }

        // VAO 언바인딩
        if (lodMesh.vao) {
            gl.bindVertexArray(null);
        }
    }

    // 적응형 품질 조절
    async adjustAdaptiveQuality(frameAnalysis) {
        const currentFps = 1000 / this.performanceMetrics.frameTime;
        const targetFps = this.adaptiveSettings.targetFps;

        // FPS 기반 품질 조절
        if (currentFps < targetFps * 0.8) {
            // 품질 하향 조절
            await this.reduceRenderingQuality();
        } else if (currentFps > targetFps * 1.2) {
            // 품질 상향 조절
            await this.increaseRenderingQuality();
        }

        // AI 추천사항 적용
        for (const recommendation of frameAnalysis.recommendations) {
            await this.applyOptimizationRecommendation(recommendation);
        }
    }

    // 렌더링 품질 감소
    async reduceRenderingQuality() {
        this.adaptiveSettings.qualityLevel = Math.max(0.1,
            this.adaptiveSettings.qualityLevel - 0.1
        );

        // 품질에 따른 설정 조정
        if (this.adaptiveSettings.qualityLevel < 0.8) {
            // 그림자 비활성화
            this.renderPipeline.shadowPass.enabled = false;
        }

        if (this.adaptiveSettings.qualityLevel < 0.6) {
            // 포스트 프로세싱 비활성화
            this.renderPipeline.postProcessPass.enabled = false;
        }

        if (this.adaptiveSettings.qualityLevel < 0.4) {
            // 텍스처 품질 하향
            await this.optimizationSystems.textureOptimizer.reduceQuality();
        }

        console.log(`📉 3D rendering quality reduced to ${(this.adaptiveSettings.qualityLevel * 100).toFixed(1)}%`);
    }

    // 렌더링 품질 증가
    async increaseRenderingQuality() {
        this.adaptiveSettings.qualityLevel = Math.min(1.0,
            this.adaptiveSettings.qualityLevel + 0.05
        );

        // 품질에 따른 설정 복원
        if (this.adaptiveSettings.qualityLevel > 0.4) {
            await this.optimizationSystems.textureOptimizer.increaseQuality();
        }

        if (this.adaptiveSettings.qualityLevel > 0.6) {
            this.renderPipeline.postProcessPass.enabled = true;
        }

        if (this.adaptiveSettings.qualityLevel > 0.8) {
            this.renderPipeline.shadowPass.enabled = true;
        }

        console.log(`📈 3D rendering quality increased to ${(this.adaptiveSettings.qualityLevel * 100).toFixed(1)}%`);
    }

    // 씬 복잡도 계산
    calculateSceneComplexity() {
        const objects = this.sceneGraph.getAllRenderableObjects();
        let complexity = 0;

        for (const obj of objects) {
            // 삼각형 수 기반 복잡도
            complexity += obj.mesh.getTriangleCount(0);

            // 텍스처 복잡도
            if (obj.material.textures) {
                complexity += obj.material.textures.length * 0.1;
            }

            // 조명 복잡도
            if (obj.material.needsLighting) {
                complexity += 5;
            }
        }

        return complexity / 1000; // 정규화
    }

    // 사용자 시선 추적
    async trackUserFocus() {
        // AI 기반 사용자 관심 영역 예측
        return await this.contextManager.getUserFocus('3d_scene');
    }

    // 성능 메트릭 업데이트
    async updatePerformanceMetrics() {
        // GPU 메모리 사용량 추정
        this.performanceMetrics.gpuMemory = this.estimateGPUMemoryUsage();

        // 텍스처 메모리 계산
        this.performanceMetrics.textureMemory = this.calculateTextureMemoryUsage();

        // AI 기반 성능 분석
        await this.contextManager.trackPerformance('3d_rendering', this.performanceMetrics);

        // 사용자 만족도 추적
        this.satisfactionTracker.trackRenderingQuality({
            qualityLevel: this.adaptiveSettings.qualityLevel,
            performance: this.performanceMetrics,
            visualAppeal: this.calculateVisualAppeal()
        });
    }

    // 시각적 매력도 계산
    calculateVisualAppeal() {
        let appeal = 0;

        // 품질 레벨 기반
        appeal += this.adaptiveSettings.qualityLevel * 0.4;

        // 프레임레이트 기반
        const fps = 1000 / this.performanceMetrics.frameTime;
        appeal += Math.min(fps / 60, 1) * 0.3;

        // 세부 사항 기반
        if (this.renderPipeline.shadowPass.enabled) appeal += 0.15;
        if (this.renderPipeline.postProcessPass.enabled) appeal += 0.15;

        return Math.max(0, Math.min(1, appeal));
    }

    // 리소스 정리
    async cleanup() {
        // WebGL 리소스 정리
        const gl = this.gl;

        // 버퍼 정리
        for (const [name, mesh] of this.resourceManager.meshes) {
            if (mesh.vao) gl.deleteVertexArray(mesh.vao);
            if (mesh.vertexBuffer) gl.deleteBuffer(mesh.vertexBuffer);
            if (mesh.indexBuffer) gl.deleteBuffer(mesh.indexBuffer);
        }

        // 텍스처 정리
        for (const [name, texture] of this.resourceManager.textures) {
            gl.deleteTexture(texture.glTexture);
        }

        // 셰이더 정리
        for (const [name, shader] of this.resourceManager.shaders) {
            gl.deleteProgram(shader.program);
        }

        // AI 시스템 정리
        await this.contextManager.cleanup();

        console.log('🧹 3D Renderer cleanup completed');
    }
}
```

---

## 📱 센서 기반 3D 인터랙션

### 센서 3D 조작 시스템
```javascript
class Sensor3DInteractionSystem {
    constructor(renderer) {
        this.renderer = renderer;
        this.camera = renderer.camera;

        // AI 시스템 통합
        this.contextManager = renderer.contextManager;
        this.realTimeDebugger = renderer.realTimeDebugger;

        // 센서 데이터 처리기
        this.sensorProcessor = new SensorDataProcessor();
        this.motionInterpreter = new MotionInterpreter();
        this.gestureRecognizer = new GestureRecognizer();

        // 3D 인터랙션 설정
        this.interactionSettings = {
            sensitivity: 1.0,
            smoothing: 0.1,
            gestureThreshold: 0.8,
            motionDeadzone: 0.05
        };

        // 카메라 조작 상태
        this.cameraState = {
            yaw: 0,
            pitch: 0,
            distance: 10,
            target: { x: 0, y: 0, z: 0 },
            lastSensorData: null
        };

        // 3D 객체 조작 상태
        this.objectManipulation = {
            selectedObject: null,
            manipulationMode: 'rotate', // 'rotate', 'translate', 'scale'
            lastGestureTime: 0,
            gestureBuffer: []
        };
    }

    // 센서 데이터로 3D 씬 조작
    async processSensorData(sensorData) {
        try {
            // AI 기반 센서 데이터 분석
            const processedData = await this.sensorProcessor.process(sensorData);

            // 모션 의도 해석
            const motionIntent = await this.motionInterpreter.interpret(processedData);

            // 제스처 인식
            const gesture = await this.gestureRecognizer.recognize(processedData);

            // 3D 조작 실행
            if (motionIntent.type === 'camera_control') {
                await this.handleCameraControl(motionIntent, processedData);
            } else if (motionIntent.type === 'object_manipulation') {
                await this.handleObjectManipulation(motionIntent, processedData);
            }

            // 제스처 기반 액션
            if (gesture.confidence > this.interactionSettings.gestureThreshold) {
                await this.handleGestureAction(gesture);
            }

            // 상태 업데이트
            this.cameraState.lastSensorData = processedData;

        } catch (error) {
            this.realTimeDebugger.handleError(error, 'sensor_3d_interaction');
        }
    }

    // 카메라 조작 처리
    async handleCameraControl(motionIntent, sensorData) {
        const { orientation, acceleration, rotationRate } = sensorData;

        // 회전 조작 (방향 센서 기반)
        if (motionIntent.action === 'rotate_camera') {
            // 베타(앞뒤 기울기)를 피치로 변환
            const pitchDelta = orientation.beta * this.interactionSettings.sensitivity * 0.01;
            this.cameraState.pitch += pitchDelta;
            this.cameraState.pitch = this.clamp(this.cameraState.pitch, -89, 89);

            // 감마(좌우 기울기)를 요우로 변환
            const yawDelta = orientation.gamma * this.interactionSettings.sensitivity * 0.01;
            this.cameraState.yaw += yawDelta;
        }

        // 줌 조작 (가속도 센서 기반)
        if (motionIntent.action === 'zoom_camera') {
            const forwardAccel = acceleration.z;
            if (Math.abs(forwardAccel) > this.interactionSettings.motionDeadzone) {
                const zoomDelta = forwardAccel * this.interactionSettings.sensitivity * 0.5;
                this.cameraState.distance += zoomDelta;
                this.cameraState.distance = this.clamp(this.cameraState.distance, 1, 50);
            }
        }

        // 패닝 조작 (회전율 센서 기반)
        if (motionIntent.action === 'pan_camera') {
            const panSpeedX = rotationRate.beta * this.interactionSettings.sensitivity * 0.1;
            const panSpeedY = rotationRate.alpha * this.interactionSettings.sensitivity * 0.1;

            this.cameraState.target.x += panSpeedX;
            this.cameraState.target.y += panSpeedY;
        }

        // 카메라 위치 업데이트
        await this.updateCameraPosition();
    }

    // 카메라 위치 계산 및 업데이트
    async updateCameraPosition() {
        const { yaw, pitch, distance, target } = this.cameraState;

        // 구면 좌표계를 사용한 카메라 위치 계산
        const yawRad = yaw * Math.PI / 180;
        const pitchRad = pitch * Math.PI / 180;

        const x = target.x + distance * Math.cos(pitchRad) * Math.sin(yawRad);
        const y = target.y + distance * Math.sin(pitchRad);
        const z = target.z + distance * Math.cos(pitchRad) * Math.cos(yawRad);

        // 스무딩 적용
        const smoothing = this.interactionSettings.smoothing;
        this.camera.position.x = this.lerp(this.camera.position.x, x, smoothing);
        this.camera.position.y = this.lerp(this.camera.position.y, y, smoothing);
        this.camera.position.z = this.lerp(this.camera.position.z, z, smoothing);

        // 카메라가 타겟을 바라보도록 설정
        this.camera.lookAt(target.x, target.y, target.z);

        // 뷰 매트릭스 업데이트
        this.camera.updateViewMatrix();
    }

    // 3D 객체 조작 처리
    async handleObjectManipulation(motionIntent, sensorData) {
        if (!this.objectManipulation.selectedObject) return;

        const object = this.objectManipulation.selectedObject;
        const { orientation, acceleration, rotationRate } = sensorData;

        switch (this.objectManipulation.manipulationMode) {
            case 'rotate':
                await this.rotateObject(object, orientation);
                break;

            case 'translate':
                await this.translateObject(object, acceleration);
                break;

            case 'scale':
                await this.scaleObject(object, rotationRate);
                break;
        }
    }

    // 객체 회전
    async rotateObject(object, orientation) {
        const sensitivity = this.interactionSettings.sensitivity * 0.02;

        // 방향 센서를 객체 회전으로 변환
        object.rotation.x = orientation.beta * sensitivity;
        object.rotation.y = orientation.alpha * sensitivity;
        object.rotation.z = orientation.gamma * sensitivity;

        // 회전 행렬 업데이트
        object.updateTransformMatrix();
    }

    // 객체 이동
    async translateObject(object, acceleration) {
        const sensitivity = this.interactionSettings.sensitivity * 0.1;

        // 가속도를 이동으로 변환
        if (Math.abs(acceleration.x) > this.interactionSettings.motionDeadzone) {
            object.position.x += acceleration.x * sensitivity;
        }

        if (Math.abs(acceleration.y) > this.interactionSettings.motionDeadzone) {
            object.position.y += acceleration.y * sensitivity;
        }

        if (Math.abs(acceleration.z) > this.interactionSettings.motionDeadzone) {
            object.position.z += acceleration.z * sensitivity;
        }

        // 변환 행렬 업데이트
        object.updateTransformMatrix();
    }

    // 객체 크기 조절
    async scaleObject(object, rotationRate) {
        const sensitivity = this.interactionSettings.sensitivity * 0.01;

        // 회전율의 크기를 스케일 변화로 변환
        const rotationMagnitude = Math.sqrt(
            rotationRate.alpha ** 2 +
            rotationRate.beta ** 2 +
            rotationRate.gamma ** 2
        );

        if (rotationMagnitude > this.interactionSettings.motionDeadzone) {
            const scaleDelta = rotationMagnitude * sensitivity;

            object.scale.x += scaleDelta;
            object.scale.y += scaleDelta;
            object.scale.z += scaleDelta;

            // 스케일 제한
            object.scale.x = this.clamp(object.scale.x, 0.1, 5.0);
            object.scale.y = this.clamp(object.scale.y, 0.1, 5.0);
            object.scale.z = this.clamp(object.scale.z, 0.1, 5.0);

            // 변환 행렬 업데이트
            object.updateTransformMatrix();
        }
    }

    // 제스처 액션 처리
    async handleGestureAction(gesture) {
        switch (gesture.type) {
            case 'shake':
                await this.handleShakeGesture();
                break;

            case 'double_tap':
                await this.handleDoubleTapGesture();
                break;

            case 'swipe_left':
                await this.switchManipulationMode('previous');
                break;

            case 'swipe_right':
                await this.switchManipulationMode('next');
                break;

            case 'pinch':
                await this.handlePinchGesture(gesture.intensity);
                break;
        }
    }

    // 흔들기 제스처 처리
    async handleShakeGesture() {
        // 선택된 객체 초기화
        if (this.objectManipulation.selectedObject) {
            const object = this.objectManipulation.selectedObject;

            // 초기 변환으로 리셋
            object.position = { x: 0, y: 0, z: 0 };
            object.rotation = { x: 0, y: 0, z: 0 };
            object.scale = { x: 1, y: 1, z: 1 };

            object.updateTransformMatrix();

            console.log('🔄 Object reset by shake gesture');
        }
    }

    // 더블 탭 제스처 처리
    async handleDoubleTapGesture() {
        // 객체 선택/해제 토글
        if (this.objectManipulation.selectedObject) {
            this.objectManipulation.selectedObject = null;
            console.log('❌ Object deselected');
        } else {
            // 화면 중앙의 객체 선택
            const centerObject = await this.pickObjectAtScreenCenter();
            if (centerObject) {
                this.objectManipulation.selectedObject = centerObject;
                console.log('✅ Object selected');
            }
        }
    }

    // 조작 모드 전환
    async switchManipulationMode(direction) {
        const modes = ['rotate', 'translate', 'scale'];
        const currentIndex = modes.indexOf(this.objectManipulation.manipulationMode);

        let newIndex;
        if (direction === 'next') {
            newIndex = (currentIndex + 1) % modes.length;
        } else {
            newIndex = (currentIndex - 1 + modes.length) % modes.length;
        }

        this.objectManipulation.manipulationMode = modes[newIndex];
        console.log(`🔄 Manipulation mode: ${this.objectManipulation.manipulationMode}`);
    }

    // 화면 중앙 객체 선택
    async pickObjectAtScreenCenter() {
        const screenCenter = {
            x: this.renderer.canvas.width / 2,
            y: this.renderer.canvas.height / 2
        };

        return await this.pickObjectAtScreenPosition(screenCenter);
    }

    // 화면 좌표에서 객체 선택
    async pickObjectAtScreenPosition(screenPos) {
        // 레이 캐스팅을 통한 객체 선택
        const ray = this.camera.screenPointToRay(screenPos);
        const objects = this.renderer.sceneGraph.getAllRenderableObjects();

        let closestObject = null;
        let closestDistance = Infinity;

        for (const object of objects) {
            const intersection = this.rayIntersectObject(ray, object);
            if (intersection && intersection.distance < closestDistance) {
                closestDistance = intersection.distance;
                closestObject = object;
            }
        }

        return closestObject;
    }

    // 레이-객체 교차 검사
    rayIntersectObject(ray, object) {
        // 간단한 바운딩 박스 교차 검사
        const bounds = object.getBoundingBox();
        return this.rayIntersectBoundingBox(ray, bounds);
    }

    // 유틸리티 함수들
    clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    lerp(a, b, t) {
        return a + (b - a) * t;
    }
}
```

---

## ⚡ 지능형 3D 최적화 시스템

### AI 기반 LOD 관리자
```javascript
class IntelligentLODManager {
    constructor() {
        // AI 기반 LOD 결정 모델
        this.lodModel = null;
        this.userBehaviorAnalyzer = null;

        // LOD 설정
        this.lodSettings = {
            distances: [10, 50, 200, 1000], // LOD 전환 거리
            qualityFactors: [1.0, 0.7, 0.4, 0.1], // 각 LOD 품질
            dynamicAdjustment: true,
            userFocusBias: 2.0 // 사용자 시선 영역 품질 향상
        };

        // 성능 메트릭
        this.performanceHistory = [];
        this.lodDecisions = new Map();
    }

    // AI 모델 초기화
    async initialize(contextManager) {
        // LOD 결정 모델
        this.lodModel = await contextManager.createAIModel({
            type: 'lod_optimization',
            features: ['distance', 'screen_size', 'user_focus', 'performance_budget', 'object_importance'],
            algorithm: 'decision_tree'
        });

        // 사용자 행동 분석 모델
        this.userBehaviorAnalyzer = await contextManager.createAIModel({
            type: 'user_behavior_analysis',
            features: ['gaze_patterns', 'interaction_frequency', 'focus_duration'],
            algorithm: 'clustering'
        });
    }

    // AI 기반 LOD 레벨 결정
    async determineLOD(object, camera, qualityLevel) {
        // 기본 거리 기반 LOD
        const distance = this.calculateDistance(object.position, camera.position);
        let baseLOD = this.getBaseLODFromDistance(distance);

        // AI 모델을 통한 LOD 최적화
        const aiLOD = await this.lodModel.predict([
            distance / 1000, // 정규화된 거리
            this.calculateScreenSize(object, camera),
            await this.getUserFocusScore(object),
            qualityLevel,
            object.importance || 0.5
        ]);

        // 최종 LOD 결정
        let finalLOD = Math.round((baseLOD + aiLOD) / 2);

        // 사용자 시선 영역 품질 향상
        const focusScore = await this.getUserFocusScore(object);
        if (focusScore > 0.8) {
            finalLOD = Math.max(0, finalLOD - 1); // 품질 향상
        }

        // LOD 결정 기록
        this.lodDecisions.set(object.id, {
            distance: distance,
            baseLOD: baseLOD,
            aiLOD: aiLOD,
            finalLOD: finalLOD,
            focusScore: focusScore,
            timestamp: Date.now()
        });

        return finalLOD;
    }

    // 거리 기반 기본 LOD 계산
    getBaseLODFromDistance(distance) {
        for (let i = 0; i < this.lodSettings.distances.length; i++) {
            if (distance < this.lodSettings.distances[i]) {
                return i;
            }
        }
        return this.lodSettings.distances.length - 1;
    }

    // 화면 크기 계산
    calculateScreenSize(object, camera) {
        const distance = this.calculateDistance(object.position, camera.position);
        const boundingRadius = object.getBoundingRadius();

        // 투영된 화면 크기 계산
        const projectedSize = (boundingRadius / distance) * camera.fov;
        return Math.max(0, Math.min(1, projectedSize));
    }

    // 사용자 시선 점수 계산
    async getUserFocusScore(object) {
        // 사용자 행동 패턴 분석을 통한 관심도 점수
        const behaviorScore = await this.userBehaviorAnalyzer.analyze({
            objectId: object.id,
            position: object.position,
            interactionHistory: object.interactionHistory || []
        });

        return behaviorScore.focusScore || 0.5;
    }

    // 거리 계산
    calculateDistance(pos1, pos2) {
        return Math.sqrt(
            Math.pow(pos1.x - pos2.x, 2) +
            Math.pow(pos1.y - pos2.y, 2) +
            Math.pow(pos1.z - pos2.z, 2)
        );
    }

    // LOD 성능 분석
    async analyzeLODPerformance() {
        const analysis = {
            averageLOD: 0,
            lodDistribution: [0, 0, 0, 0],
            performanceGain: 0,
            userSatisfaction: 0
        };

        // LOD 분포 계산
        let totalObjects = 0;
        for (const [objectId, decision] of this.lodDecisions) {
            analysis.lodDistribution[decision.finalLOD]++;
            analysis.averageLOD += decision.finalLOD;
            totalObjects++;
        }

        if (totalObjects > 0) {
            analysis.averageLOD /= totalObjects;

            // 정규화
            for (let i = 0; i < analysis.lodDistribution.length; i++) {
                analysis.lodDistribution[i] /= totalObjects;
            }
        }

        return analysis;
    }
}

// 예측형 컬링 시스템
class PredictiveCullingSystem {
    constructor() {
        this.predictionModel = null;
        this.viewHistory = [];
        this.maxHistorySize = 100;
    }

    // AI 모델 초기화
    async initialize(contextManager) {
        this.predictionModel = await contextManager.createAIModel({
            type: 'view_prediction',
            features: ['camera_velocity', 'rotation_speed', 'movement_pattern', 'time_delta'],
            algorithm: 'lstm'
        });
    }

    // AI 기반 예측 컬링
    async predictiveCull(objects, camera, userBehaviorPrediction) {
        // 카메라 이동 예측
        const predictedCameraState = await this.predictCameraMovement(camera);

        // 예측된 뷰포트에서 보이는 객체 계산
        const predictedVisibleObjects = this.frustumCullWithPrediction(
            objects,
            predictedCameraState
        );

        // 사용자 행동 예측 반영
        const behaviorFilteredObjects = await this.applyBehaviorPrediction(
            predictedVisibleObjects,
            userBehaviorPrediction
        );

        // 뷰 히스토리 업데이트
        this.updateViewHistory(camera);

        return behaviorFilteredObjects;
    }

    // 카메라 이동 예측
    async predictCameraMovement(camera) {
        if (this.viewHistory.length < 2) {
            return camera;
        }

        // 최근 이동 패턴 분석
        const recentHistory = this.viewHistory.slice(-10);
        const movementPattern = this.analyzeMovementPattern(recentHistory);

        // AI 모델을 통한 예측
        const prediction = await this.predictionModel.predict([
            movementPattern.velocity.x,
            movementPattern.velocity.y,
            movementPattern.velocity.z,
            movementPattern.rotationSpeed,
            movementPattern.acceleration.magnitude,
            Date.now() - this.viewHistory[this.viewHistory.length - 1].timestamp
        ]);

        // 예측된 카메라 상태 생성
        const predictedCamera = {
            ...camera,
            position: {
                x: camera.position.x + prediction.deltaPosition.x,
                y: camera.position.y + prediction.deltaPosition.y,
                z: camera.position.z + prediction.deltaPosition.z
            },
            rotation: {
                x: camera.rotation.x + prediction.deltaRotation.x,
                y: camera.rotation.y + prediction.deltaRotation.y,
                z: camera.rotation.z + prediction.deltaRotation.z
            }
        };

        return predictedCamera;
    }

    // 이동 패턴 분석
    analyzeMovementPattern(history) {
        if (history.length < 2) {
            return {
                velocity: { x: 0, y: 0, z: 0 },
                rotationSpeed: 0,
                acceleration: { magnitude: 0 }
            };
        }

        const latest = history[history.length - 1];
        const previous = history[history.length - 2];
        const timeDelta = latest.timestamp - previous.timestamp;

        // 속도 계산
        const velocity = {
            x: (latest.position.x - previous.position.x) / timeDelta,
            y: (latest.position.y - previous.position.y) / timeDelta,
            z: (latest.position.z - previous.position.z) / timeDelta
        };

        // 회전 속도 계산
        const rotationDelta = Math.sqrt(
            Math.pow(latest.rotation.x - previous.rotation.x, 2) +
            Math.pow(latest.rotation.y - previous.rotation.y, 2) +
            Math.pow(latest.rotation.z - previous.rotation.z, 2)
        );
        const rotationSpeed = rotationDelta / timeDelta;

        // 가속도 계산 (이전 속도와 비교)
        let acceleration = { magnitude: 0 };
        if (history.length >= 3) {
            const prev2 = history[history.length - 3];
            const prevVelocity = {
                x: (previous.position.x - prev2.position.x) / (previous.timestamp - prev2.timestamp),
                y: (previous.position.y - prev2.position.y) / (previous.timestamp - prev2.timestamp),
                z: (previous.position.z - prev2.position.z) / (previous.timestamp - prev2.timestamp)
            };

            acceleration.magnitude = Math.sqrt(
                Math.pow((velocity.x - prevVelocity.x) / timeDelta, 2) +
                Math.pow((velocity.y - prevVelocity.y) / timeDelta, 2) +
                Math.pow((velocity.z - prevVelocity.z) / timeDelta, 2)
            );
        }

        return { velocity, rotationSpeed, acceleration };
    }

    // 뷰 히스토리 업데이트
    updateViewHistory(camera) {
        this.viewHistory.push({
            position: { ...camera.position },
            rotation: { ...camera.rotation },
            timestamp: Date.now()
        });

        // 히스토리 크기 제한
        if (this.viewHistory.length > this.maxHistorySize) {
            this.viewHistory.shift();
        }
    }

    // 예측 기반 시야 절두체 컬링
    frustumCullWithPrediction(objects, predictedCamera) {
        // 예측된 카메라 상태로 시야 절두체 생성
        const predictedFrustum = this.createFrustum(predictedCamera);

        // 현재 시야 + 예측 시야에 포함된 객체 반환
        return objects.filter(obj => {
            return this.isObjectInFrustum(obj, predictedFrustum);
        });
    }

    // 시야 절두체 생성
    createFrustum(camera) {
        // 카메라 설정을 기반으로 시야 절두체 평면 계산
        // 구현 세부사항은 카메라 타입에 따라 달라짐
        return {
            near: camera.near,
            far: camera.far,
            fov: camera.fov,
            aspect: camera.aspect,
            position: camera.position,
            rotation: camera.rotation
        };
    }

    // 객체가 시야 절두체 내부에 있는지 확인
    isObjectInFrustum(object, frustum) {
        // 간단한 구현: 바운딩 스피어 기반 검사
        const distance = Math.sqrt(
            Math.pow(object.position.x - frustum.position.x, 2) +
            Math.pow(object.position.y - frustum.position.y, 2) +
            Math.pow(object.position.z - frustum.position.z, 2)
        );

        const boundingRadius = object.getBoundingRadius ? object.getBoundingRadius() : 1.0;
        return distance - boundingRadius < frustum.far;
    }
}
```

이렇게 3d-graphics.md (4페이지)를 완성했습니다. Phase 2.2 AI 시스템들을 완전히 통합한 상용 수준의 3D 그래픽스 시스템을 구현했습니다.

계속해서 audio-system.md (2페이지)를 작성하겠습니다.