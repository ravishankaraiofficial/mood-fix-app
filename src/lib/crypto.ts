export async function generateLocalKey(): Promise<CryptoKey> {
  if (typeof window === 'undefined') throw new Error("Crypto only available in browser");
  
  let keyBuffer = localStorage.getItem('local_db_key');
  if (!keyBuffer) {
    const key = await crypto.subtle.generateKey(
      { name: "AES-GCM", length: 256 },
      true,
      ["encrypt", "decrypt"]
    );
    const exported = await crypto.subtle.exportKey("raw", key);
    const b64 = btoa(String.fromCharCode(...new Uint8Array(exported)));
    localStorage.setItem('local_db_key', b64);
    return key;
  }
  
  const raw = Uint8Array.from(atob(keyBuffer), c => c.charCodeAt(0));
  return await crypto.subtle.importKey(
    "raw",
    raw,
    "AES-GCM",
    true,
    ["encrypt", "decrypt"]
  );
}

export async function encryptData(data: any, key: CryptoKey) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(JSON.stringify(data));
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoded
  );
  return {
    iv: Array.from(iv),
    ciphertext: Array.from(new Uint8Array(ciphertext))
  };
}

export async function decryptData(ciphertextArray: number[], ivArray: number[], key: CryptoKey) {
  const ciphertext = new Uint8Array(ciphertextArray);
  const iv = new Uint8Array(ivArray);
  try {
    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      ciphertext
    );
    const decoded = new TextDecoder().decode(decrypted);
    return JSON.parse(decoded);
  } catch (e) {
    console.error("Decryption failed", e);
    return null;
  }
}
