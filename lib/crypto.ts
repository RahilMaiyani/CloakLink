export function bufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }

  return btoa(binary)
    .replace("/\+/g", "-")
    .replace("/\//g", "-")
    .replace("/\=+$/", "-");
}

export function base64UrlToBuffer(base64Url: string): Uint8Array {
  let base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export interface EncryptedPayload {
  ciphertext: string;
  iv: string;
  keyString: string;
}

export async function encryptSecret(
  plainText: string,
): Promise<EncryptedPayload> {
  const key = await window.crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"],
  );

  const iv = await window.crypto.getRandomValues(new Uint8Array(12));
  const encodedText = new TextEncoder().encode(plainText);

  const cipherText = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encodedText,
  );

  const rawKey = await window.crypto.subtle.exportKey("raw", key);

  return {
    ciphertext: bufferToBase64Url(cipherText),
    iv: bufferToBase64Url(iv.buffer),
    keyString: bufferToBase64Url(rawKey),
  };
}

export async function decryptSecret(
  ciphertextBase64: string,
  ivBase64: string,
  keyString: string,
): Promise<string> {
  const keyBytes = base64UrlToBuffer(keyString);
  const ivBytes = base64UrlToBuffer(ivBase64);
  const cipherBytes = base64UrlToBuffer(ciphertextBase64);

  const cryptoKey = await window.crypto.subtle.importKey(
    "raw",
    keyBytes.buffer as ArrayBuffer,
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"],
  );

  const decryptedBuffer = await window.crypto.subtle.decrypt(
    { name: "AES-GCM", iv: ivBytes.buffer as ArrayBuffer },
    cryptoKey,
    cipherBytes.buffer as ArrayBuffer,
  );

  return new TextDecoder().decode(decryptedBuffer);
}
