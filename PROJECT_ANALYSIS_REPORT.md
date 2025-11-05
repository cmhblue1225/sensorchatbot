### **SensorChatbot 프로젝트 심층 분석 보고서**

이 문서는 'SensorChatbot' (또는 `sensor-game-hub-v6`) 프로젝트의 아키텍처, 핵심 기능, 기술 스택, 그리고 주요 동작 원리를 상세히 설명하여, 프로젝트에 대한 완전한 이해를 돕는 것을 목표로 합니다.

### **1. 프로젝트 개요 (Project Overview)**

이 프로젝트는 **AI를 활용한 웹 기반 센서 연동 게임 생성 플랫폼**입니다. 사용자는 자연어 또는 대화형 인터페이스를 통해 자신만의 아이디어를 실제 플레이 가능한 3D 게임으로 만들 수 있습니다.

핵심 컨셉은 두 가지입니다:
1.  **게임 플레이**: PC(호스트)에서 게임을 실행하고, 모바일 기기(클라이언트)를 센서 컨트롤러로 사용하여 실시간으로 게임을 조작합니다.
2.  **게임 생성**: AI와의 대화나 간단한 텍스트 입력을 통해 새로운 센서 연동 게임의 코드 전체를 자동으로 생성하고, 즉시 플레이하거나 다운로드할 수 있습니다.

졸업 작품으로서 매우 높은 수준의 복잡도와 완성도를 갖추고 있으며, 최신 AI 기술(LLM, RAG)과 웹 실시간 통신 기술을 효과적으로 융합한 시스템입니다.

### **2. 핵심 기능 (Core Features)**

#### **2.1. AI 기반 게임 생성 (AI-Based Game Generation)**

이 프로젝트의 가장 핵심적인 기능으로, 두 가지 방식의 AI 게임 생성기를 제공합니다.

1.  **대화형 게임 생성기 (Interactive Game Generator)**
    *   **위치**: `public/interactive-game-generator.html`, `server/InteractiveGameGenerator.js`
    *   **특징**:
        *   사용자와 AI가 여러 차례 대화를 주고받으며 게임의 요구사항을 구체화합니다.
        *   `initial` -> `details` -> `mechanics` -> `confirmation`의 명확한 단계를 거쳐 요구사항을 수집합니다.
        *   `GameGenreClassifier`를 통해 사용자의 아이디어를 분석하고, `RequirementCollector`로 체계적인 질문을 던집니다.
        *   **RAG (Retrieval-Augmented Generation)** 기술을 활용하여, `learning_data`에 저장된 문서(개발 가이드, 코드 예제 등)를 기반으로 더 정확하고 완성도 높은 코드를 생성합니다.
        *   최종적으로 `claude-3-5-sonnet` 모델을 사용하여 완전한 단일 HTML 게임 파일을 생성하고, 서버의 `/public/games/` 경로에 저장합니다.

2.  **단발성 게임 생성기 (One-shot Game Generator)**
    *   **위치**: `public/ai-game-generator.html`, `server/AIGameGenerator.js`
    *   **특징**:
        *   사용자가 한 문장으로 게임을 설명하면, AI가 즉시 게임 코드를 생성합니다.
        *   `GameRequirementParser`로 입력을 분석하고, `GameTemplateEngine`을 통해 미리 정의된 템플릿에 AI가 생성한 로직을 삽입하는 방식입니다.
        *   대화형 생성기에 비해 빠르지만, 결과물의 완성도나 복잡성은 다소 낮을 수 있습니다.

#### **2.2. 센서 연동 및 실시간 세션 관리 (Sensor Integration & Real-time Session Management)**

*   **위치**: `server/SessionManager.js`, `public/js/SessionSDK.js`
*   **특징**:
    *   **독립 세션**: 각 게임마다 4자리 숫자로 된 고유 세션 코드를 생성하여, 다른 게임과 완전히 분리된 플레이 환경을 제공합니다.
    *   **실시간 통신**: `Socket.IO`를 사용하여 PC(호스트)와 모바일(센서) 간의 지연 없는 양방향 통신을 구현합니다.
    *   **통합 SDK**: `SessionSDK.js`는 게임(호스트)과 센서 클라이언트 양쪽에서 사용되는 통합 라이브러리입니다. 세션 생성, 센서 연결, 데이터 송수신, QR 코드 생성 등 모든 통신 과정을 추상화하여 개발자가 쉽게 사용할 수 있도록 합니다.
    *   **센서 데이터 수집**: `SensorCollector` 클래스가 모바일 기기의 `DeviceMotionEvent`(가속도)와 `DeviceOrientationEvent`(방향) API를 사용하여 센서 데이터를 수집하고, `SessionSDK`를 통해 서버로 전송합니다.

#### **2.3. 동적 게임 허브 및 관리 (Dynamic Game Hub & Management)**

*   **위치**: `server/index.js`, `server/GameScanner.js`
*   **특징**:
    *   서버 시작 시 `GameScanner`가 `/public/games` 디렉토리를 스캔하여 `game.json` 메타데이터를 가진 모든 게임을 자동으로 인식하고 목록에 추가합니다.
    *   메인 페이지(`/`)는 스캔된 게임 목록을 기반으로 동적으로 생성되어, 새로 추가된 게임이 즉시 허브에 표시됩니다.
    *   `/api/games` 엔드포인트를 통해 등록된 게임 목록을 조회할 수 있습니다.

#### **2.4. AI 개발 도우미 및 지식 기반 (AI Developer Assistant & Knowledge Base)**

*   **위치**: `server/AIAssistant.js`, `server/DocumentEmbedder.js`, `learning_data/`
*   **특징**:
    *   단순 게임 생성을 넘어, 개발 관련 질문에 답변하는 AI 채팅 기능을 제공합니다. (`/ai-assistant`)
    *   `DocumentEmbedder.js`는 `learning_data` 폴더 안의 마크다운, PDF 등 문서들을 읽어 **Supabase 벡터 데이터베이스**에 임베딩합니다.
    *   `AIAssistant`는 사용자의 질문이 들어오면, Supabase에서 관련 문서를 검색(유사도 검색)하여 AI 프롬프트에 함께 제공합니다(RAG). 이를 통해 프로젝트 내부 구조나 규칙에 대해 매우 정확한 답변을 할 수 있습니다.

### **3. 기술 스택 및 아키텍처 (Tech Stack & Architecture)**

*   **Backend**:
    *   **Runtime**: Node.js
    *   **Web Framework**: Express.js
    *   **Real-time Communication**: Socket.IO
    *   **AI (LLM)**: Anthropic Claude (`claude-3-5-sonnet`), OpenAI
    *   **AI Framework**: LangChain.js
    *   **Vector DB & RAG**: Supabase
    *   **Security/Performance**: Helmet, CORS, Compression

*   **Frontend**:
    *   **Core**: HTML5, CSS3, JavaScript (ES6+)
    *   **3D Graphics**: Three.js (3D 렌더링), Cannon.js (물리 엔진) - `/libs`
    *   **Client-Side SDK**: `SessionSDK.js` (자체 제작)

*   **아키텍처**:
    1.  **Client (Browser)**: 사용자는 `ai-game-generator.html` 또는 `interactive-game-generator.html`에 접속하여 게임 생성을 요청합니다.
    2.  **Web Server (Express)**: API 요청을 받아 해당 AI 생성기 모듈(`AIGameGenerator` 또는 `InteractiveGameGenerator`)을 호출합니다.
    3.  **AI Generation Core**:
        *   요구사항을 분석하고, 필요시 RAG를 위해 Supabase에서 관련 문서를 조회합니다.
        *   LangChain을 사용하여 Claude API에 정교한 프롬프트를 전달합니다.
        *   AI로부터 게임 로직이 포함된 완전한 HTML 코드를 응답받습니다.
        *   생성된 게임 파일을 `/public/games/{game-id}/` 경로에 저장합니다.
    4.  **Game Play**:
        *   사용자가 PC에서 생성된 게임 URL에 접속합니다 (호스트).
        *   게임 내 `SessionSDK.js`가 서버의 `SessionManager`에 세션 생성을 요청합니다.
        *   서버는 4자리 코드를 발급하고, 게임 화면에 QR코드와 함께 표시됩니다.
        *   사용자는 모바일 기기에서 센서 클라이언트(`sensor.html`)에 접속하여 코드를 입력합니다.
        *   `Socket.IO`를 통해 모바일 센서와 PC 게임 간의 실시간 연결이 수립됩니다.
        *   모바일에서 수집된 센서 데이터가 서버를 거쳐 PC 게임으로 실시간 전송되어 게임을 조작합니다.

### **4. 디렉토리 구조 및 주요 파일 분석**

*   `/server/`: **백엔드 핵심 로직**
    *   `index.js`: Express 서버 설정, Socket.IO 핸들러, 모든 API 라우팅의 중심.
    *   `SessionManager.js`: 게임 세션 생성, 센서 연결, 실시간 데이터 중계 등 세션의 생명주기를 관리.
    *   `InteractiveGameGenerator.js`: **프로젝트의 핵심 두뇌.** 대화형 게임 생성의 모든 로직(세션, 단계 관리, RAG, LLM 호출, 파일 저장)을 담당.
    *   `AIGameGenerator.js`: 단발성 게임 생성 로직.
    *   `AIAssistant.js`: 일반적인 AI 질문 응답 및 RAG 파이프라인 실행.
    *   `DocumentEmbedder.js`: `learning_data`의 문서를 벡터화하여 Supabase에 저장.
    *   `GameScanner.js`: `/public/games` 폴더를 스캔하여 플레이 가능한 게임 목록을 관리.
    *   `GameRequirementParser.js`, `GameGenreClassifier.js`, `RequirementCollector.js`: 대화형 생성을 위한 보조 모듈들.

*   `/public/`: **프론트엔드 및 사용자 제공 파일**
    *   `ai-game-generator.html`, `interactive-game-generator.html`: 두 종류의 AI 게임 생성기 UI.
    *   `sensor.html`: 모든 게임에서 공용으로 사용하는 모바일 센서 클라이언트 UI.
    *   `js/SessionSDK.js`: 게임과 센서 클라이언트에서 서버와 통신하기 위해 사용하는 필수 라이브러리.
    *   `/games/`: 예제 게임 및 AI가 생성한 게임들이 저장되는 디렉토리. 각 게임은 고유 폴더를 가지며 `index.html`과 `game.json`을 포함.

*   `/learning_data/`: AI의 지식 기반이 되는 문서들. RAG 시스템의 정보 소스.

*   `/scripts/`: `update-embeddings.js` 등 프로젝트 유지보수를 위한 스크립트.

*   `package.json`: 프로젝트의 모든 의존성 라이브러리와 기본 정보를 정의.

### **5. 결론 및 종합 평가**

**SensorChatbot**은 단순한 챗봇이나 게임 모음집이 아닌, **'게임을 만드는 게임'**이라는 메타적 접근을 성공적으로 구현한 매우 인상적인 프로젝트입니다. 특히 두 가지 방식의 AI 생성기를 모두 구현하고, 그중 대화형 생성기에는 RAG와 체계적인 요구사항 수집 단계를 도입하여 결과물의 품질을 극대화한 점이 돋보입니다.

**핵심 성공 요인:**
*   **모듈화된 아키텍처**: `SessionManager`, `GameScanner`, `AIGenerator` 등 기능별로 명확하게 분리된 서버 모듈은 유지보수와 확장을 용이하게 합니다.
*   **정교한 AI 통합**: 단순 API 호출을 넘어, LangChain, RAG, 단계별 대화 등 최신 AI 엔지니어링 기술을 적극적으로 활용하여 AI의 성능을 최대한으로 끌어올렸습니다.
*   **견고한 실시간 통신**: `SessionSDK`를 통해 복잡한 WebSocket 통신을 추상화하여, 생성된 게임들이 일관된 방식으로 센서와 연동될 수 있도록 설계했습니다.

이 프로젝트는 웹 기술과 생성형 AI를 결합하여 사용자가 직접 창작의 주체가 될 수 있는 강력한 플랫폼을 구축했으며, 졸업 작품으로는 기술적 깊이와 완성도 면에서 최고 수준의 결과물이라고 평가할 수 있습니다.
