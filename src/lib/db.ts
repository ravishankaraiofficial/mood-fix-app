import { generateLocalKey, encryptData, decryptData } from './crypto';

const DB_NAME = 'mood_relief_db';
const STORE_NAME = 'mood_logs';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    // V3: Bump DB version to 3 to add 'meals' store
    const request = indexedDB.open(DB_NAME, 3);
    request.onupgradeneeded = (e: any) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains('journals')) {
        db.createObjectStore('journals', { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains('meals')) {
        db.createObjectStore('meals', { keyPath: 'id', autoIncrement: true });
      }
    };
    request.onsuccess = (e: any) => resolve(e.target.result);
    request.onerror = (e) => reject(e);
  });
}

export async function saveMoodLog(logData: any) {
  try {
    const key = await generateLocalKey();
    const { iv, ciphertext } = await encryptData(logData, key);
    
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const record = {
        timestamp: Date.now(),
        iv,
        ciphertext
      };
      const req = store.add(record);
      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    console.warn("DB save failed (Quota/Private Mode?)", e);
    // Graceful degradation: fail silently so UI isn't blocked
    return false;
  }
}

export async function getRecentMoodLogs(hours: number = 24) {
  try {
    const key = await generateLocalKey();
    const db = await openDB();
    
    return new Promise<any[]>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      
      req.onsuccess = async (e: any) => {
        const records = e.target.result;
        const now = Date.now();
        const cutoff = now - (hours * 60 * 60 * 1000);
        
        const recent = records.filter((r: any) => r.timestamp >= cutoff);
        
        const decrypted = [];
        for (const record of recent) {
          const data = await decryptData(record.ciphertext, record.iv, key);
          if (data) {
            decrypted.push({ timestamp: record.timestamp, data });
          }
        }
        resolve(decrypted);
      };
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    console.warn("DB read failed", e);
    return [];
  }
}

// Journals API
export async function saveJournal(text: string, tags: string[], embedding?: number[]) {
  try {
    const key = await generateLocalKey();
    const payload = { text, tags, embedding };
    const { iv, ciphertext } = await encryptData(payload, key);
    
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('journals', 'readwrite');
      const store = tx.objectStore('journals');
      const record = { timestamp: Date.now(), iv, ciphertext };
      const req = store.add(record);
      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    console.warn("DB save journal failed", e);
    return false;
  }
}

export async function getRecentJournals(hours: number = 24) {
  try {
    const key = await generateLocalKey();
    const db = await openDB();
    
    return new Promise<any[]>((resolve, reject) => {
      const tx = db.transaction('journals', 'readonly');
      const store = tx.objectStore('journals');
      const req = store.getAll();
      
      req.onsuccess = async (e: any) => {
        const records = e.target.result;
        const now = Date.now();
        const cutoff = now - (hours * 60 * 60 * 1000);
        
        const recent = records.filter((r: any) => r.timestamp >= cutoff);
        
        const decrypted = [];
        for (const record of recent) {
          const data = await decryptData(record.ciphertext, record.iv, key);
          if (data) {
            decrypted.push({ timestamp: record.timestamp, data });
          }
        }
        resolve(decrypted);
      };
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    console.warn("DB read journals failed", e);
    return [];
  }
}

// Nutrition & Dietary Logging
export async function saveMeal(mealName: string) {
  try {
    const key = await generateLocalKey();
    const { iv, ciphertext } = await encryptData({ mealName }, key);
    
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('meals', 'readwrite');
      const store = tx.objectStore('meals');
      const record = { timestamp: Date.now(), iv, ciphertext };
      const req = store.add(record);
      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    console.warn("DB save meal failed", e);
    return false;
  }
}

export async function getRecentMeals(hours: number = 12) {
  try {
    const key = await generateLocalKey();
    const db = await openDB();
    
    return new Promise<string[]>((resolve, reject) => {
      const tx = db.transaction('meals', 'readonly');
      const store = tx.objectStore('meals');
      const req = store.getAll();
      
      req.onsuccess = async (e: any) => {
        const records = e.target.result;
        const now = Date.now();
        const cutoff = now - (hours * 60 * 60 * 1000);
        
        const recent = records.filter((r: any) => r.timestamp >= cutoff);
        
        const decrypted = [];
        for (const record of recent) {
          const data = await decryptData(record.ciphertext, record.iv, key);
          if (data && data.mealName) {
            decrypted.push(data.mealName);
          }
        }
        resolve(decrypted);
      };
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    console.warn("DB read meals failed", e);
    return [];
  }
}
