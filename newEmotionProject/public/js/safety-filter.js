// 자살 예방 안전 필터 시스템
export class SafetyFilter {

  // 위험 키워드 목록 (변형 표현 포함)
  static DANGER_KEYWORDS = [
    // 직접적인 표현
    '죽고 싶어', '죽고싶어', '죽고시펑', '죽고시퍼', '자살', '자해', '목숨', '죽을래', '죽을거야',
    '자살할래', '자살하고싶어', '죽음', '죽자', '살기 싫어', '살기싫어', '죽어버리고',

    // 간접적인 표현
    '죽을정도로', '죽을만큼', '더 이상 못 살겠어', '더이상 못살겠어',
    '세상이 무너져', '모든 걸 포기', '희망이 없어', '견딜 수 없어',
    '너무 힘들어서 죽', '고통스러워서 죽', '괴로워서 죽',

    // 구체적인 방법 언급
    '뛰어내리', '목을 매', '칼로', '약을 많이', '가스', '독',

    // 절망 표현
    '살 이유가 없어', '존재 이유', '의미가 없어', '모든 게 끝', '끝내버릴게',

    // 변형 표현 추가
    '죽고십어', '죽고싶다', '죽어버려', '죽었으면', '사라지고싶어',
    '그냥 죽', '진짜 죽', '정말 죽', '죽는게 나아', '죽는게 낫겠'
  ];

  // 위험도 점수 계산
  static calculateRiskScore(message) {
    const lowerMessage = message.toLowerCase().replace(/\s/g, '');
    let riskScore = 0;

    for (const keyword of this.DANGER_KEYWORDS) {
      const lowerKeyword = keyword.toLowerCase().replace(/\s/g, '');
      if (lowerMessage.includes(lowerKeyword)) {
        // 직접적인 표현은 높은 점수
        if (['죽고싶어', '자살', '자해', '죽을래'].includes(lowerKeyword)) {
          riskScore += 10;
        } else {
          riskScore += 5;
        }
      }
    }

    return riskScore;
  }

  // 위험 메시지 감지
  static isDangerousMessage(message) {
    const riskScore = this.calculateRiskScore(message);
    return riskScore >= 5; // 임계값: 5 이상이면 위험
  }

  // 안전 응답 메시지 생성
  static getSafetyResponse() {
    return {
      isSafetyResponse: true,
      message: `🆘 **도움을 받으세요**

소중한 당신의 마음이 많이 힘드시군요. 혼자 견디지 마시고 전문가의 도움을 받아보세요.

📞 **자살예방상담전화**
• **전화번호**: 109 (24시간 무료 상담)
• **언어**: 한국어, 영어
• **운영 시간**: 24시간 연중무휴

🌐 **온라인 상담**
• 생명의전화: https://www.lifeline.or.kr
• 청소년 전화: 1388

💙 **당신은 혼자가 아닙니다**
지금 이 순간이 힘들더라도, 반드시 좋아질 날이 올 것입니다. 전문 상담사와 이야기해보세요.`,

      showEmergencyContacts: true,
      emergencyContacts: [
        {
          name: "자살예방상담전화",
          number: "109",
          description: "24시간 무료 상담"
        },
        {
          name: "정신건강위기상담전화",
          number: "1577-0199",
          description: "정신건강 전문상담"
        },
        {
          name: "청소년 전화",
          number: "1388",
          description: "청소년 전문상담"
        }
      ]
    };
  }

  // 클라이언트 측 사전 검사
  static preCheckMessage(message) {
    if (this.isDangerousMessage(message)) {
      console.warn('⚠️ 위험 메시지 감지:', message);
      return this.getSafetyResponse();
    }
    return null;
  }
}

// 안전 응답 UI 렌더링 함수
export function renderSafetyResponse(response, container) {
  const safetyDiv = document.createElement('div');
  safetyDiv.className = 'safety-response bg-red-50 border-2 border-red-200 rounded-xl p-6 mb-4 animate-fade-in';

  safetyDiv.innerHTML = `
    <div class="flex items-start space-x-3">
      <div class="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
        🆘
      </div>
      <div class="flex-1">
        <div class="text-red-800 font-bold text-lg mb-3">긴급 도움 요청</div>
        <div class="text-red-700 leading-relaxed whitespace-pre-line mb-4">${response.message}</div>

        <div class="grid gap-3">
          ${response.emergencyContacts.map(contact => `
            <div class="bg-white rounded-lg p-4 border border-red-200">
              <div class="flex items-center justify-between">
                <div>
                  <div class="font-semibold text-red-800">${contact.name}</div>
                  <div class="text-sm text-red-600">${contact.description}</div>
                </div>
                <a href="tel:${contact.number}"
                   class="px-4 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors">
                  📞 ${contact.number}
                </a>
              </div>
            </div>
          `).join('')}
        </div>

        <div class="mt-4 p-4 bg-red-100 rounded-lg">
          <div class="text-red-800 font-medium mb-2">💙 당신은 소중합니다</div>
          <div class="text-red-700 text-sm">
            지금 이 순간이 어려우셔도, 전문가의 도움을 받으시면 분명히 좋아질 것입니다.
            혼자 견디지 마시고 위의 상담전화로 연락해 주세요.
          </div>
        </div>
      </div>
    </div>
  `;

  container.appendChild(safetyDiv);

  // 자동 스크롤
  safetyDiv.scrollIntoView({ behavior: 'smooth' });

  return safetyDiv;
}