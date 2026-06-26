import { generateLocalKey, encryptData, decryptData } from './crypto';

const DB_NAME = 'mood_relief_db';
const STORE_NAME = 'mood_logs';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = (e: any) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
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
