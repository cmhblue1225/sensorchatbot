import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://vzmvgyxsscfyflgxcpnq.supabase.co',
  process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ6bXZneXhzc2NmeWZsZ3hjcG5xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ0MDI4NzgsImV4cCI6MjA1OTk3ODg3OH0.-hQSBKVvPUX_KpbOp0zT25xMEjmky3WR-STC06kP0n4'
);

// 익명 ID 생성 (사용자당 고정)
function generateAnonymousId(userId) {
  const hash = crypto.createHash('sha256').update(userId + 'anonymous_salt_2025').digest('hex');
  return 'anon_' + hash.substring(0, 12);
}

// AI로 게시물 내용 분석 및 태그 생성
async function analyzePostContent(content, emotion) {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `당신은 익명 감정 커뮤니티의 콘텐츠 분석 전문가입니다. 게시물을 분석하여 다음을 제공해주세요:

1. 적절한 해시태그 (3-5개)
2. 내용 요약 (30자 이내)
3. 도움 요청 여부 판단
4. 감정 강도 (0-100)
5. 주제 카테고리 분류
6. 부적절한 내용 필터링

응답은 반드시 다음 JSON 형식으로 해주세요:
{
  "tags": ["태그1", "태그2", "태그3"],
  "summary": "내용 요약",
  "seeking_advice": true,
  "emotion_intensity": 75,
  "category": "일상/관계/직장/학업/건강/기타",
  "is_appropriate": true,
  "mood_tone": "긍정적/중립적/부정적",
  "support_level_needed": "low/medium/high"
}`
          },
          {
            role: 'user',
            content: `감정: ${emotion}\n내용: "${content}"\n\n위 게시물을 분석해주세요.`
          }
        ],
        temperature: 0.3,
        max_tokens: 500
      })
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error?.message || 'GPT-4 API 오류');
    }

    return JSON.parse(result.choices[0].message.content);
  } catch (error) {
    console.error('게시물 분석 오류:', error);
    return {
      tags: ['일반'],
      summary: content.substring(0, 30),
      seeking_advice: false,
      emotion_intensity: 50,
      category: '기타',
      is_appropriate: true,
      mood_tone: '중립적',
      support_level_needed: 'low'
    };
  }
}

// AI로 지지적 댓글인지 판단
async function analyzeCommentTone(content, postEmotion) {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `당신은 댓글의 감정적 톤을 분석하는 전문가입니다. 댓글이 원글 작성자에게 얼마나 지지적이고 도움이 되는지 판단해주세요.

응답은 반드시 다음 JSON 형식으로 해주세요:
{
  "is_supportive": true,
  "emotion_tone": "empathetic",
  "helpfulness_score": 0.85,
  "tone_category": "격려/공감/조언/중립/비판",
  "appropriateness": true
}`
          },
          {
            role: 'user',
            content: `원글 감정: ${postEmotion}\n댓글 내용: "${content}"\n\n이 댓글의 톤을 분석해주세요.`
          }
        ],
        temperature: 0.3,
        max_tokens: 300
      })
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error?.message || 'GPT-4 API 오류');
    }

    return JSON.parse(result.choices[0].message.content);
  } catch (error) {
    console.error('댓글 톤 분석 오류:', error);
    return {
      is_supportive: true,
      emotion_tone: 'neutral',
      helpfulness_score: 0.5,
      tone_category: '중립',
      appropriateness: true
    };
  }
}

// 맞춤형 게시물 추천
async function getPersonalizedPosts(userId, limit = 10) {
  try {
    // 사용자의 최근 감정 패턴 조회
    const { data: userEmotions } = await supabase
      .from('diaries')
      .select('emotion, mood_score')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5);

    const userEmotionTypes = userEmotions?.map(d => d.emotion) || [];
    const avgMoodScore = userEmotions?.length > 0
      ? userEmotions.reduce((sum, d) => sum + (d.mood_score || 0), 0) / userEmotions.length
      : 0;

    // 유사한 감정의 게시물 우선 추천
    let query = supabase
      .from('anonymous_posts')
      .select(`
        *,
        comment_count,
        like_count
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    // 사용자가 우울한 상태라면 긍정적인 게시물 우선 추천
    if (avgMoodScore < -20) {
      query = query.or(`emotion_category.in.(happy,neutral),is_featured.eq.true`);
    } else if (userEmotionTypes.length > 0) {
      // 유사한 감정의 게시물 추천
      query = query.in('emotion_category', userEmotionTypes);
    }

    const { data: posts } = await query;

    // 참여도 기반 정렬
    const sortedPosts = posts?.sort((a, b) => {
      const scoreA = (a.like_count || 0) * 2 + (a.comment_count || 0) * 3 + (a.view_count || 0) * 0.1;
      const scoreB = (b.like_count || 0) * 2 + (b.comment_count || 0) * 3 + (b.view_count || 0) * 0.1;
      return scoreB - scoreA;
    }) || [];

    return sortedPosts;
  } catch (error) {
    console.error('맞춤형 게시물 추천 오류:', error);
    return [];
  }
}

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
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

    const anonymousId = generateAnonymousId(user.id);

    if (event.httpMethod === 'GET') {
      const urlParams = new URLSearchParams(event.queryStringParameters || '');
      const action = urlParams.get('action') || 'posts';
      const postId = urlParams.get('postId');
      const limit = parseInt(urlParams.get('limit') || '10');
      const emotion = urlParams.get('emotion');

      if (action === 'posts') {
        let posts;

        if (emotion) {
          // 특정 감정의 게시물 조회
          const { data } = await supabase
            .from('anonymous_posts')
            .select('*')
            .eq('emotion_category', emotion)
            .order('created_at', { ascending: false })
            .limit(limit);
          posts = data || [];
        } else {
          // 맞춤형 게시물 추천
          posts = await getPersonalizedPosts(user.id, limit);
        }

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            posts: posts,
            user_anonymous_id: anonymousId
          })
        };
      }

      if (action === 'comments' && postId) {
        // 특정 게시물의 댓글 조회
        const { data: comments } = await supabase
          .from('anonymous_comments')
          .select('*')
          .eq('post_id', postId)
          .order('created_at', { ascending: true });

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            comments: comments || [],
            user_anonymous_id: anonymousId
          })
        };
      }

      if (action === 'my_posts') {
        // 내가 작성한 게시물 조회
        const { data: myPosts } = await supabase
          .from('anonymous_posts')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            posts: myPosts || [],
            user_anonymous_id: anonymousId
          })
        };
      }
    }

    if (event.httpMethod === 'POST') {
      const { action, content, emotion_category, postId, mood_score } = JSON.parse(event.body || '{}');

      if (action === 'create_post') {
        if (!content || !emotion_category) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: '내용과 감정 카테고리가 필요합니다.' })
          };
        }

        // AI로 게시물 분석
        const analysis = await analyzePostContent(content, emotion_category);

        if (!analysis.is_appropriate) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: '부적절한 내용이 포함되어 있습니다.' })
          };
        }

        // 새 게시물 생성
        const newPost = {
          user_id: user.id,
          anonymous_id: anonymousId,
          emotion_category: emotion_category,
          content: content,
          mood_score: mood_score || 0,
          tags: analysis.tags,
          ai_generated_summary: analysis.summary,
          is_seeking_advice: analysis.seeking_advice
        };

        const { data: insertedPost, error: insertError } = await supabase
          .from('anonymous_posts')
          .insert(newPost)
          .select()
          .single();

        if (insertError) {
          throw new Error('게시물 생성 실패: ' + insertError.message);
        }

        return {
          statusCode: 201,
          headers,
          body: JSON.stringify({
            success: true,
            post: insertedPost,
            analysis: analysis
          })
        };
      }

      if (action === 'create_comment') {
        if (!content || !postId) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: '댓글 내용과 게시물 ID가 필요합니다.' })
          };
        }

        // 원글 조회
        const { data: originalPost } = await supabase
          .from('anonymous_posts')
          .select('emotion_category')
          .eq('id', postId)
          .single();

        if (!originalPost) {
          return {
            statusCode: 404,
            headers,
            body: JSON.stringify({ error: '게시물을 찾을 수 없습니다.' })
          };
        }

        // AI로 댓글 톤 분석
        const toneAnalysis = await analyzeCommentTone(content, originalPost.emotion_category);

        if (!toneAnalysis.appropriateness) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: '부적절한 댓글입니다.' })
          };
        }

        // 새 댓글 생성
        const newComment = {
          post_id: postId,
          user_id: user.id,
          anonymous_id: anonymousId,
          content: content,
          emotion_tone: toneAnalysis.emotion_tone,
          is_supportive: toneAnalysis.is_supportive
        };

        const { data: insertedComment, error: commentError } = await supabase
          .from('anonymous_comments')
          .insert(newComment)
          .select()
          .single();

        if (commentError) {
          throw new Error('댓글 생성 실패: ' + commentError.message);
        }

        // 게시물 댓글 수 업데이트
        await supabase
          .from('anonymous_posts')
          .update({ comment_count: supabase.sql`comment_count + 1` })
          .eq('id', postId);

        return {
          statusCode: 201,
          headers,
          body: JSON.stringify({
            success: true,
            comment: insertedComment,
            tone_analysis: toneAnalysis
          })
        };
      }

      if (action === 'like_post') {
        if (!postId) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: '게시물 ID가 필요합니다.' })
          };
        }

        // 좋아요 토글 (실제로는 좋아요 기록 테이블이 있어야 하지만 간단히 카운트만 증가)
        const { data: updatedPost } = await supabase
          .from('anonymous_posts')
          .update({ like_count: supabase.sql`like_count + 1` })
          .eq('id', postId)
          .select()
          .single();

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            new_like_count: updatedPost.like_count
          })
        };
      }
    }

    if (event.httpMethod === 'PUT') {
      const urlParams = new URLSearchParams(event.queryStringParameters || '');
      const action = urlParams.get('action');
      const postId = urlParams.get('postId');

      if (action === 'view_post' && postId) {
        // 조회수 증가
        await supabase
          .from('anonymous_posts')
          .update({ view_count: supabase.sql`view_count + 1` })
          .eq('id', postId);

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ success: true })
        };
      }
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };

  } catch (error) {
    console.error('익명 커뮤니티 오류:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: '익명 커뮤니티 처리 중 오류가 발생했습니다.',
        detail: error.message
      })
    };
  }
};