/**
 * Cryptographic utility for securing sensitive data (such as API keys)
 * using the browser-native Web Crypto API (AES-GCM-256).
 */

const ENCRYPTION_PREFIX = 'enc_v1:';
const DEFAULT_SALT = 'roleplay-ai-hub-secure-storage-salt-2026';

/**
 * Derives an AES-GCM CryptoKey from a device/browser unique secret using PBKDF2.
 */
async function deriveKey(saltString: string = DEFAULT_SALT): Promise<CryptoKey | null> {
  if (typeof window === 'undefined' || !window.crypto?.subtle) {
    return null;
  }

  try {
    const enc = new TextEncoder();
    // Unique device context or fallback
    const rawSecret = `rp_client_${window.location.origin}_${saltString}`;
    const keyMaterial = await window.crypto.subtle.importKey(
      'raw',
      enc.encode(rawSecret),
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );

    return await window.crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: enc.encode(saltString),
        iterations: 100000,
        hash: 'SHA-256',
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  } catch (err) {
    console.warn('[Crypto] Failed to derive key via Web Crypto:', err);
    return null;
  }
}

/**
 * Encrypts a plaintext string with AES-GCM 256-bit.
 * Returns a prefixed base64 string: "enc_v1:<iv_b64>:<ciphertext_b64>"
 */
export async function encryptSensitiveText(plainText: string): Promise<string> {
  if (!plainText) return '';
  // If already encrypted, do not double encrypt
  if (plainText.startsWith(ENCRYPTION_PREFIX)) return plainText;

  const key = await deriveKey();
  if (!key || typeof window === 'undefined' || !window.crypto) {
    // Fallback: return as is if Web Crypto is unavailable
    return plainText;
  }

  try {
    const enc = new TextEncoder();
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encryptedBuffer = await window.crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      enc.encode(plainText)
    );

    const ivB64 = btoa(String.fromCharCode(...iv));
    const cipherB64 = btoa(String.fromCharCode(...new Uint8Array(encryptedBuffer)));

    return `${ENCRYPTION_PREFIX}${ivB64}:${cipherB64}`;
  } catch (err) {
    console.error('[Crypto] Encryption error:', err);
    return plainText;
  }
}

/**
 * Decrypts an AES-GCM 256-bit encrypted string.
 * Supports transparent fallback for legacy plaintext.
 */
export async function decryptSensitiveText(cipherText: string): Promise<string> {
  if (!cipherText) return '';
  if (!cipherText.startsWith(ENCRYPTION_PREFIX)) {
    // Legacy plaintext, return directly
    return cipherText;
  }

  const key = await deriveKey();
  if (!key || typeof window === 'undefined' || !window.crypto) {
    return cipherText;
  }

  try {
    const payload = cipherText.slice(ENCRYPTION_PREFIX.length);
    const [ivB64, cipherB64] = payload.split(':');
    if (!ivB64 || !cipherB64) return cipherText;

    const iv = Uint8Array.from(atob(ivB64), (c) => c.charCodeAt(0));
    const cipherBuffer = Uint8Array.from(atob(cipherB64), (c) => c.charCodeAt(0));

    const decryptedBuffer = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      cipherBuffer
    );

    const dec = new TextDecoder();
    return dec.decode(decryptedBuffer);
  } catch (err) {
    console.error('[Crypto] Decryption error:', err);
    return '';
  }
}

/**
 * Masks an API key for safe UI display (e.g. "sk-abc...1234")
 */
export function maskApiKey(apiKey?: string): string {
  if (!apiKey) return '';
  if (apiKey.length <= 8) return '••••••••';
  const start = apiKey.substring(0, 4);
  const end = apiKey.substring(apiKey.length - 4);
  return `${start}••••••••${end}`;
}
