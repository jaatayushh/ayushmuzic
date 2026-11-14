/**
 * AyushMuzic Web — IndexedDB Local Database
 * Manages user profiles (Guest, Ayush, Rohan, etc.), favorites, playlists,
 * playback history, play counts (for "Most Played"), and listening analytics.
 */

window.DB = {
  db: null,

  // Active user profile state (defaults to 'Ayush' or 'Guest')
  activeUser: localStorage.getItem('ayushmuzic_active_user') || 'ayush',
  activeUserName: localStorage.getItem('ayushmuzic_active_user_name') || 'Ayush',

  // Available profiles
  profiles: [
    { id: 'ayush', name: 'Ayush' },
    { id: 'guest', name: 'Guest' },
    { id: 'rohan_verma', name: 'Rohan Verma' },
    { id: 'kiran_kumar', name: 'Kiran Kumar' },
    { id: 'goli_baba', name: 'Goli Baba' }
  ],

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('AyushMuzicDB', 2);

      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains('favorites')) {
          db.createObjectStore('favorites', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('history')) {
          const store = db.createObjectStore('history', { keyPath: 'id' });
          store.createIndex('userId', 'userId');
          store.createIndex('timestamp', 'timestamp');
        }
        if (!db.objectStoreNames.contains('playCounts')) {
          const store = db.createObjectStore('playCounts', { keyPath: 'id' });
          store.createIndex('userId', 'userId');
          store.createIndex('count', 'count');
        }
        if (!db.objectStoreNames.contains('playlists')) {
          db.createObjectStore('playlists', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('analytics')) {
          db.createObjectStore('analytics', { keyPath: 'id' });
        }
      };

      request.onsuccess = (e) => {
        DB.db = e.target.result;
        resolve();
      };

      request.onerror = (e) => {
        console.error('IndexedDB error:', e);
        reject(e);
      };
    });
  },

  setActiveUser(userId, userName) {
    DB.activeUser = userId;
    DB.activeUserName = userName;
    localStorage.setItem('ayushmuzic_active_user', userId);
    localStorage.setItem('ayushmuzic_active_user_name', userName);
  },

  async getAll(storeName) {
    if (!DB.db) await DB.init();
    return new Promise((resolve, reject) => {
      const tx = DB.db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = reject;
    });
  },

  async get(storeName, key) {
    if (!DB.db) await DB.init();
    return new Promise((resolve, reject) => {
      const tx = DB.db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result);
      req.onerror = reject;
    });
  },

  async put(storeName, value) {
    if (!DB.db) await DB.init();
    return new Promise((resolve, reject) => {
      const tx = DB.db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.put(value);
      req.onsuccess = () => resolve(req.result);
      req.onerror = reject;
    });
  },

  async delete(storeName, key) {
    if (!DB.db) await DB.init();
    return new Promise((resolve, reject) => {
      const tx = DB.db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.delete(key);
      req.onsuccess = () => resolve();
      req.onerror = reject;
    });
  }
};
