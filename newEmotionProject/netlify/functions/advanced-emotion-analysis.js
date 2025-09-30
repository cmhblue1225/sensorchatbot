import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://vzmvgyxsscfyflgxcpnq.supabase.co',
  process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ6bXZneXhzc2NmeWZsZ3hjcG5xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ0MDI4NzgsImV4cCI6MjA1OTk3ODg3OH0.-hQSBKVvPUX_KpbOp0zT25xMEjmky3WR-STC06kP0n4'
);

// 24가지 확장된 감정 타입
const EMOTION_TYPES = {
  // 긍정 감정
  joy: { label: '기쁨', intensity: 'high', category: 'positive' },
  contentment: { label: '만족', intensity: 'medium', category: 'positive' },
  gratitude: { label: '감사', intensity: 'medium', category: 'positive' },
  love: { label: '사랑', intensity: 'high', category: 'positive' },
  excitement: { label: '흥분/설렘', intensity: 'high', category: 'positive' },
  pride: { label: '자부심', intensity: 'medium', category: 'positive' },
  hope: { label: '희망', intensity: 'medium', category: 'positive' },
  relief: { label: '안도', intensity: 'medium', category: 'positive' },

  // 부정 감정
  sadness: { label: '슬픔', intensity: 'medium', category: 'negative' },
  grief: { label: '비탄', intensity: 'high', category: 'negative' },
  anger: { label: '분노', intensity: 'high', category: 'negative' },
  frustration: { label: '좌절', intensity: 'medium', category: 'negative' },
  anxiety: { label: '불안', intensity: 'high', category: 'negative' },
  fear: { label: '두려움', intensity: 'high', category: 'negative' },
  guilt: { label: '죄책감', intensity: 'medium', category: 'negative' },
  shame: { label: '수치심', intensity: 'high', category: 'negative' },
  loneliness: { label: '외로움', intensity: 'medium', category: 'negative' },
  disappointment: { label: '실망', intensity: 'medium', category: 'negative' },

  // 중성 감정
  calm: { label: '평온', intensity: 'low', category: 'neutral' },
  contemplative: { label: '사색적', intensity: 'low', category: 'neutral' },
  curious: { label: '호기심', intensity: 'medium', category: 'neutral' },
  nostalgic: { label: '그리움', intensity: 'medium', category: 'neutral' },
  confused: { label: '혼란', intensity: 'medium', category: 'neutral' },
  indifferent: { label: '무관심', intensity: 'low', category: 'neutral' }
};

// 확장 감정을 표준 5가지 감정으로 매핑
function mapToStandardEmotion(advancedEmotion) {
  const emotionMapping = {
    // 긍정 감정들을 happy로 매핑
    'joy': 'happy',
    'contentment': 'happy',
    'gratitude': 'happy',
    'love': 'happy',
    'excitement': 'happy',
    'pride': 'happy',
    'hope': 'happy',
    'relief': 'happy',

    // 부정 감정들을 각각 해당하는 표준 감정으로 매핑
    'sadness': 'sad',
    'grief': 'sad',
    'anger': 'angry',
    'frustration': 'angry',
    'anxiety': 'anxious',
    'fear': 'anxious',
    'guilt': 'anxious',
    'shame': 'anxious',
    'loneliness': 'sad',
    'disappointment': 'sad',

    // 중성 감정들을 neutral로 매핑
    'calm': 'neutral',
    'contemplative': 'neutral',
    'curious': 'neutral',
    'nostalgic': 'neutral',
    'confused': 'neutral',
    'indifferent': 'neutral'
  };

  return emotionMapping[advancedEmotion] || 'neutral';
}

// 캐시에서 분석 결과 확인
async function getCachedAnalysis(contentHash, analysisType) {
  try {
    const { data } = await supabase
      .from('ai_analysis_cache')
      .select('output_data, confidence_score')
      .eq('content_hash', contentHash)
      .eq('analysis_type', analysisType)
      .gt('expires_at', new Date().toISOString())
      .single();

    return data;
  } catch (error) {
    return null;
  }
}

// 분석 결과를 캐시에 저장
async function setCachedAnalysis(contentHash, analysisType, inputData, outputData, modelUsed, confidenceScore) {
  try {
    await supabase
      .from('ai_analysis_cache')
      .insert({
        content_hash: contentHash,
        analysis_type: analysisType,
        input_data: inputData,
        output_data: outputData,
        model_used: modelUsed,
        confidence_score: confidenceScore
      });
  } catch (error) {
    console.error('Cache save error:', error);
  }
}

// GPT-4o를 사용한 고급 감정 분석
async function analyzeWithGPT4(content, userContext = {}) {
  const messages = [
    {
      role: "system",
      content: `당신은 전문적인 감정 분석 심리학자입니다. 일기 내용을 분석하여 다음을 제공하세요:

1. 주요 감정 (최대 3개): ${Object.keys(EMOTION_TYPES).join(', ')} 중에서 선택
2. 감정 강도 (0-100): 각 감정의 세기
3. 전체 기분 점수 (-100 ~ +100): 부정(-) ~ 긍정(+)
4. 핵심 키워드 (3-5개): 감정을 나타내는 중요 단어들
5. AI 인사이트: 감정 상태에 대한 전문가 분석 (50자 이내)
6. 맞춤 조언: 현재 감정에 도움되는 구체적 조언

응답은 반드시 다음 JSON 형식으로 해주세요:
{
  "emotions": [
    {"type": "emotion_key", "intensity": 85, "confidence": 0.95}
  ],
  "overall_mood_score": 45,
  "keywords": ["키워드1", "키워드2"],
  "ai_insights": "전문가 분석 내용",
  "personalized_advice": "맞춤형 조언",
  "complexity_score": 0.7
}`
    },
    {
      role: "user",
      content: `다음 일기를 분석해주세요:\n\n"${content}"\n\n${userContext.previousEmotions ? `최근 감정 패턴: ${userContext.previousEmotions}` : ''}`
    }
  ];

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages,
        temperature: 0.3,
        max_tokens: 1000
      })
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error?.message || 'GPT-4 API 오류');
    }

    const analysis = JSON.parse(result.choices[0].message.content);
    return { ...analysis, model_used: 'gpt-4o-mini' };

  } catch (error) {
    console.error('GPT-4 분석 오류:', error);
    return null;
  }
}

// 임베딩 벡터 생성
async function generateEmbedding(text) {
  try {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: text
      })
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error?.message || 'Embedding API 오류');
    }

    return result.data[0].embedding;
  } catch (error) {
    console.error('Embedding 생성 오류:', error);
    return null;
  }
}

// 유사한 감정의 일기 찾기 (벡터 검색)
async function findSimilarEmotions(diaryId, userId, limit = 5) {
  try {
    // 현재 일기의 임베딩 벡터 가져오기
    const { data: embeddingData } = await supabase
      .from('emotion_embeddings')
      .select('embedding')
      .eq('diary_id', diaryId)
      .single();

    if (!embeddingData) return [];

    // 벡터 유사도 검색 (PostgreSQL + pgvector)
    const { data: similarEntries } = await supabase
      .rpc('find_similar_emotions', {
        query_embedding: embeddingData.embedding,
        user_id: userId,
        similarity_threshold: 0.7,
        match_count: limit
      });

    return similarEntries || [];
  } catch (error) {
    console.error('유사 감정 검색 오류:', error);
    return [];
  }
}

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  try {
    const { content, diaryId, analysisType = 'comprehensive' } = JSON.parse(event.body || '{}');

    if (!content) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: '분석할 내용이 필요합니다.' })
      };
    }

    // 인증 확인
    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (!authHeader) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: '인증이 필요합니다.' })
      };
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: '유효하지 않은 토큰입니다.' })
      };
    }

    // 캐시 키 생성
    const contentHash = crypto.createHash('sha256').update(content + user.id).digest('hex');

    // 캐시에서 확인
    const cached = await getCachedAnalysis(contentHash, analysisType);
    if (cached) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          ...cached.output_data,
          cached: true,
          confidence: cached.confidence_score
        })
      };
    }

    // 사용자의 이전 감정 패턴 가져오기 (개인화를 위해)
    const { data: recentEmotions } = await supabase
      .from('diaries')
      .select('emotion, mood_score, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5);

    const userContext = {
      previousEmotions: recentEmotions?.map(e => `${e.emotion}(${e.mood_score})`).join(', ')
    };

    // GPT-4o로 고급 감정 분석
    const analysis = await analyzeWithGPT4(content, userContext);

    if (!analysis) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'AI 분석 실패' })
      };
    }

    // 임베딩 벡터 생성 및 저장
    if (diaryId) {
      const embedding = await generateEmbedding(content);
      if (embedding) {
        await supabase
          .from('emotion_embeddings')
          .insert({
            diary_id: diaryId,
            embedding: embedding,
            model_version: 'text-embedding-3-small'
          });
      }

      // 유사한 감정의 일기 찾기
      const similarEmotions = await findSimilarEmotions(diaryId, user.id);
      analysis.similar_entries = similarEmotions;
    }

    // 분석 결과를 캐시에 저장
    await setCachedAnalysis(
      contentHash,
      analysisType,
      { content, user_id: user.id },
      analysis,
      analysis.model_used,
      0.95
    );

    // 사용자 감정 패턴 업데이트
    if (analysis.emotions && analysis.emotions.length > 0) {
      const patternData = {
        primary_emotion: analysis.emotions[0].type,
        mood_score: analysis.overall_mood_score,
        complexity: analysis.complexity_score,
        timestamp: new Date().toISOString()
      };

      await supabase
        .from('emotion_patterns')
        .upsert({
          user_id: user.id,
          pattern_type: 'daily',
          pattern_data: patternData,
          confidence_score: analysis.emotions[0].confidence
        }, { onConflict: 'user_id,pattern_type' });
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        ...analysis,
        cached: false,
        processing_time: Date.now() - parseInt(context.awsRequestId?.slice(-13) || '0', 16)
      })
    };

  } catch (error) {
    console.error('Advanced emotion analysis error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: '고급 감정 분석 중 오류가 발생했습니다.',
        detail: error.message
      })
    };
  }
};