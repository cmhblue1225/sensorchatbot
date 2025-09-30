// 알림 시스템
import { offlineStorage } from './offline-storage.js';

export class NotificationSystem {
  constructor() {
    this.permission = 'default';
    this.reminderInterval = null;
  }

  // 알림 권한 요청
  async requestPermission() {
    if ('Notification' in window) {
      this.permission = await Notification.requestPermission();
      return this.permission === 'granted';
    }
    return false;
  }

  // 일기 작성 리마인더 설정
  async setupDailyReminder() {
    const reminderEnabled = await offlineStorage.getSetting('reminder_enabled', false);
    const reminderTime = await offlineStorage.getSetting('reminder_time', '20:00');

    if (!reminderEnabled) return;

    // 기존 리마인더 취소
    this.cancelReminder();

    // 새 리마인더 설정
    const [hours, minutes] = reminderTime.split(':').map(Number);
    const now = new Date();
    const reminderDate = new Date();
    reminderDate.setHours(hours, minutes, 0, 0);

    // 오늘 시간이 지났으면 내일로 설정
    if (reminderDate <= now) {
      reminderDate.setDate(reminderDate.getDate() + 1);
    }

    const delay = reminderDate.getTime() - now.getTime();

    this.reminderInterval = setTimeout(() => {
      this.showDailyReminder();
      // 24시간마다 반복
      this.reminderInterval = setInterval(() => {
        this.showDailyReminder();
      }, 24 * 60 * 60 * 1000);
    }, delay);
  }

  // 일기 작성 리마인더 취소
  cancelReminder() {
    if (this.reminderInterval) {
      clearTimeout(this.reminderInterval);
      clearInterval(this.reminderInterval);
      this.reminderInterval = null;
    }
  }

  // 일기 작성 리마인더 알림 표시
  async showDailyReminder() {
    // 오늘 이미 일기를 작성했는지 확인
    const today = new Date().toISOString().split('T')[0];
    const hasWrittenToday = await this.checkTodayEntry(today);

    if (!hasWrittenToday && this.permission === 'granted') {
      const notification = new Notification('📝 일기 작성 시간이에요!', {
        body: '오늘 하루는 어떠셨나요? 감정을 기록해보세요.',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        tag: 'daily-reminder',
        requireInteraction: true,
        actions: [
          { action: 'write', title: '일기 쓰기' },
          { action: 'later', title: '나중에' }
        ]
      });

      notification.onclick = () => {
        window.open('/write-diary.html', '_blank');
        notification.close();
      };
    }
  }

  // 오늘 일기 작성 여부 확인
  async checkTodayEntry(today) {
    try {
      // Supabase에서 오늘 작성한 일기 확인
      const { supabase } = await import('./supabase.js');
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) return false;

      const { data, error } = await supabase
        .from('diaries')
        .select('id')
        .eq('user_id', user.id)
        .gte('created_at', `${today}T00:00:00`)
        .lt('created_at', `${today}T23:59:59`)
        .limit(1);

      return !error && data && data.length > 0;
    } catch (error) {
      console.log('오늘 일기 확인 실패:', error);
      return false;
    }
  }

  // 감정 기반 격려 메시지
  showEncouragementNotification(emotion) {
    if (this.permission !== 'granted') return;

    const messages = {
      sad: {
        title: '💙 괜찮아요',
        body: '힘든 시간이지만, 당신은 충분히 강합니다. 한 걸음씩 나아가세요.',
        icon: '💙'
      },
      angry: {
        title: '🌿 마음을 진정시켜요',
        body: '화가 날 때일수록 깊게 숨을 쉬어보세요. 이 감정도 지나갈 거예요.',
        icon: '🌿'
      },
      anxious: {
        title: '🤗 걱정마세요',
        body: '불안한 마음, 충분히 이해해요. 지금 이 순간에 집중해보세요.',
        icon: '🤗'
      },
      happy: {
        title: '🎉 좋은 하루네요!',
        body: '행복한 순간을 만끽하세요! 이런 기분을 오래 기억해두세요.',
        icon: '🎉'
      },
      neutral: {
        title: '🌱 평온한 시간',
        body: '고요한 마음도 소중한 시간이에요. 자신을 돌아보는 기회로 만들어보세요.',
        icon: '🌱'
      }
    };

    const message = messages[emotion] || messages.neutral;

    const notification = new Notification(message.title, {
      body: message.body,
      icon: '/icons/icon-192x192.png',
      tag: 'encouragement',
      silent: true
    });

    // 5초 후 자동 닫기
    setTimeout(() => notification.close(), 5000);
  }

  // 성과 알림 (연속 작성, 목표 달성 등)
  showAchievementNotification(achievement) {
    if (this.permission !== 'granted') return;

    const achievements = {
      streak_3: {
        title: '🔥 3일 연속 작성!',
        body: '꾸준한 기록, 정말 대단해요! 이 습관을 계속 유지해보세요.'
      },
      streak_7: {
        title: '⭐ 일주일 연속 작성!',
        body: '일주일 동안 매일 기록하셨네요! 감정 관리 습관이 자리잡고 있어요.'
      },
      streak_30: {
        title: '👑 한 달 연속 작성!',
        body: '30일 연속 기록! 당신은 진정한 감정 일기 마스터입니다!'
      },
      first_share: {
        title: '🤝 첫 공유 완료!',
        body: '용기내어 일기를 공유해주셨네요. 다른 사람들에게도 위로가 될 거예요.'
      },
      emotion_variety: {
        title: '🌈 다양한 감정 표현',
        body: '여러 가지 감정을 솔직하게 기록하고 계시네요. 자기 이해가 깊어지고 있어요!'
      }
    };

    const data = achievements[achievement];
    if (!data) return;

    const notification = new Notification(data.title, {
      body: data.body,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      tag: 'achievement',
      requireInteraction: true
    });

    // 축하 사운드 재생 (가능한 경우)
    this.playAchievementSound();
  }

  // 축하 사운드 재생
  playAchievementSound() {
    try {
      // Web Audio API를 사용한 간단한 축하 사운드
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 523.25; // C5
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
      // 사운드 재생 실패는 무시
      console.log('Achievement sound failed:', error);
    }
  }

  // 리마인더 설정 저장
  async saveReminderSettings(enabled, time) {
    await offlineStorage.saveSetting('reminder_enabled', enabled);
    await offlineStorage.saveSetting('reminder_time', time);

    if (enabled) {
      await this.setupDailyReminder();
    } else {
      this.cancelReminder();
    }
  }

  // 알림 설정 UI 생성
  createNotificationSettingsUI() {
    return `
      <div class="notification-settings">
        <h3>알림 설정</h3>

        <div class="setting-item">
          <label>
            <input type="checkbox" id="reminder-enabled">
            일기 작성 리마인더
          </label>
          <p class="setting-description">매일 정해진 시간에 일기 작성을 알려드려요</p>
        </div>

        <div class="setting-item">
          <label for="reminder-time">리마인더 시간</label>
          <input type="time" id="reminder-time" value="20:00">
        </div>

        <div class="setting-item">
          <label>
            <input type="checkbox" id="encouragement-enabled">
            감정 격려 메시지
          </label>
          <p class="setting-description">일기 작성 후 감정에 맞는 격려 메시지를 보내드려요</p>
        </div>

        <div class="setting-item">
          <label>
            <input type="checkbox" id="achievement-enabled">
            성과 알림
          </label>
          <p class="setting-description">연속 작성 등의 성과를 달성했을 때 알려드려요</p>
        </div>

        <button onclick="notificationSystem.saveNotificationSettings()">
          설정 저장
        </button>
      </div>
    `;
  }

  // 알림 설정 저장
  async saveNotificationSettings() {
    const reminderEnabled = document.getElementById('reminder-enabled').checked;
    const reminderTime = document.getElementById('reminder-time').value;
    const encouragementEnabled = document.getElementById('encouragement-enabled').checked;
    const achievementEnabled = document.getElementById('achievement-enabled').checked;

    await Promise.all([
      this.saveReminderSettings(reminderEnabled, reminderTime),
      offlineStorage.saveSetting('encouragement_enabled', encouragementEnabled),
      offlineStorage.saveSetting('achievement_enabled', achievementEnabled)
    ]);

    // 권한이 없다면 요청
    if ((reminderEnabled || encouragementEnabled || achievementEnabled) &&
        this.permission !== 'granted') {
      await this.requestPermission();
    }

    alert('알림 설정이 저장되었습니다!');
  }

  // 알림 설정 로드
  async loadNotificationSettings() {
    const reminderEnabled = await offlineStorage.getSetting('reminder_enabled', false);
    const reminderTime = await offlineStorage.getSetting('reminder_time', '20:00');
    const encouragementEnabled = await offlineStorage.getSetting('encouragement_enabled', true);
    const achievementEnabled = await offlineStorage.getSetting('achievement_enabled', true);

    // UI 업데이트
    const reminderEnabledEl = document.getElementById('reminder-enabled');
    const reminderTimeEl = document.getElementById('reminder-time');
    const encouragementEnabledEl = document.getElementById('encouragement-enabled');
    const achievementEnabledEl = document.getElementById('achievement-enabled');

    if (reminderEnabledEl) reminderEnabledEl.checked = reminderEnabled;
    if (reminderTimeEl) reminderTimeEl.value = reminderTime;
    if (encouragementEnabledEl) encouragementEnabledEl.checked = encouragementEnabled;
    if (achievementEnabledEl) achievementEnabledEl.checked = achievementEnabled;
  }
}

// 전역 인스턴스
export const notificationSystem = new NotificationSystem();