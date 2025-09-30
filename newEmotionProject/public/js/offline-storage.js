// 오프라인 저장소 관리 (IndexedDB)
class OfflineStorage {
  constructor() {
    this.dbName = 'AiDiaryDB';
    this.version = 1;
    this.db = null;
  }

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // 오프라인 일기 저장소
        if (!db.objectStoreNames.contains('offline_diaries')) {
          const diaryStore = db.createObjectStore('offline_diaries', {
            keyPath: 'id',
            autoIncrement: true
          });
          diaryStore.createIndex('timestamp', 'timestamp', { unique: false });
          diaryStore.createIndex('synced', 'synced', { unique: false });
        }

        // 감정 분석 캐시
        if (!db.objectStoreNames.contains('emotion_cache')) {
          const emotionStore = db.createObjectStore('emotion_cache', {
            keyPath: 'content_hash'
          });
          emotionStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // 사용자 설정
        if (!db.objectStoreNames.contains('user_settings')) {
          db.createObjectStore('user_settings', { keyPath: 'key' });
        }
      };
    });
  }

  // 오프라인 일기 저장
  async saveOfflineDiary(diary) {
    const transaction = this.db.transaction(['offline_diaries'], 'readwrite');
    const store = transaction.objectStore('offline_diaries');

    const offlineDiary = {
      ...diary,
      timestamp: Date.now(),
      synced: false
    };

    return new Promise((resolve, reject) => {
      const request = store.add(offlineDiary);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // 동기화되지 않은 일기 가져오기
  async getUnsyncedDiaries() {
    const transaction = this.db.transaction(['offline_diaries'], 'readonly');
    const store = transaction.objectStore('offline_diaries');
    const index = store.index('synced');

    return new Promise((resolve, reject) => {
      const request = index.getAll(false);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // 일기 동기화 완료 표시
  async markDiarySynced(id) {
    const transaction = this.db.transaction(['offline_diaries'], 'readwrite');
    const store = transaction.objectStore('offline_diaries');

    return new Promise((resolve, reject) => {
      const getRequest = store.get(id);
      getRequest.onsuccess = () => {
        const diary = getRequest.result;
        if (diary) {
          diary.synced = true;
          const putRequest = store.put(diary);
          putRequest.onsuccess = () => resolve();
          putRequest.onerror = () => reject(putRequest.error);
        } else {
          resolve();
        }
      };
      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  // 감정 분석 결과 캐시
  async cacheEmotionAnalysis(content, emotion) {
    const transaction = this.db.transaction(['emotion_cache'], 'readwrite');
    const store = transaction.objectStore('emotion_cache');

    const hash = await this.hashContent(content);
    const cache = {
      content_hash: hash,
      content,
      emotion,
      timestamp: Date.now()
    };

    return new Promise((resolve, reject) => {
      const request = store.put(cache);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // 캐시된 감정 분석 결과 가져오기
  async getCachedEmotion(content) {
    const transaction = this.db.transaction(['emotion_cache'], 'readonly');
    const store = transaction.objectStore('emotion_cache');

    const hash = await this.hashContent(content);

    return new Promise((resolve, reject) => {
      const request = store.get(hash);
      request.onsuccess = () => {
        const result = request.result;
        // 24시간 이내 캐시만 유효
        if (result && (Date.now() - result.timestamp) < 24 * 60 * 60 * 1000) {
          resolve(result.emotion);
        } else {
          resolve(null);
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  // 사용자 설정 저장
  async saveSetting(key, value) {
    const transaction = this.db.transaction(['user_settings'], 'readwrite');
    const store = transaction.objectStore('user_settings');

    return new Promise((resolve, reject) => {
      const request = store.put({ key, value });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // 사용자 설정 가져오기
  async getSetting(key, defaultValue = null) {
    const transaction = this.db.transaction(['user_settings'], 'readonly');
    const store = transaction.objectStore('user_settings');

    return new Promise((resolve, reject) => {
      const request = store.get(key);
      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? result.value : defaultValue);
      };
      request.onerror = () => reject(request.error);
    });
  }

  // 콘텐츠 해시 생성
  async hashContent(content) {
    const encoder = new TextEncoder();
    const data = encoder.encode(content);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // 오래된 캐시 정리
  async cleanOldCache() {
    const transaction = this.db.transaction(['emotion_cache'], 'readwrite');
    const store = transaction.objectStore('emotion_cache');
    const index = store.index('timestamp');

    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

    return new Promise((resolve, reject) => {
      const request = index.openCursor(IDBKeyRange.upperBound(oneWeekAgo));
      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        } else {
          resolve();
        }
      };
      request.onerror = () => reject(request.error);
    });
  }
}

// 전역 인스턴스
export const offlineStorage = new OfflineStorage();