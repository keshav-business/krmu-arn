// RSA Encryption/Decryption using Web Crypto API
// Uses hybrid encryption: RSA-OAEP for key exchange, AES-GCM for message encryption

export const encryptMessage = async (message, publicKeyPem) => {
  try {
    // Generate a random AES key
    const aesKey = await window.crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );

    // Encrypt the message with AES-GCM
    const encoder = new TextEncoder();
    const messageData = encoder.encode(message);
    const iv = window.crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV for GCM

    const encryptedMessage = await window.crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      aesKey,
      messageData
    );

    // Export the AES key to raw format
    const rawAesKey = await window.crypto.subtle.exportKey('raw', aesKey);

    // Import and use the RSA public key to encrypt the AES key
    const binaryDer = pemToBinary(publicKeyPem);
    const publicKey = await window.crypto.subtle.importKey(
      'spki',
      binaryDer,
      {
        name: 'RSA-OAEP',
        hash: 'SHA-256',
      },
      true,
      ['encrypt']
    );

    const encryptedAesKey = await window.crypto.subtle.encrypt(
      { name: 'RSA-OAEP' },
      publicKey,
      rawAesKey
    );

    // Combine: IV + encrypted AES key + encrypted message
    const ivB64 = arrayBufferToBase64(iv);
    const encryptedAesKeyB64 = arrayBufferToBase64(encryptedAesKey);
    const encryptedMessageB64 = arrayBufferToBase64(encryptedMessage);

    // Return as JSON so backend knows it's hybrid encrypted
    return JSON.stringify({
      type: 'hybrid',
      iv: ivB64,
      encryptedKey: encryptedAesKeyB64,
      encryptedMessage: encryptedMessageB64
    });
  } catch (error) {
    console.error('Encryption error:', error);
    throw error;
  }
};

export const decryptMessage = async (encryptedDataJson, privateKeyPem) => {
  try {
    const encryptedData = JSON.parse(encryptedDataJson);

    if (encryptedData.type === 'hybrid') {
      // Hybrid decryption
      const iv = base64ToArrayBuffer(encryptedData.iv);
      const encryptedAesKey = base64ToArrayBuffer(encryptedData.encryptedKey);
      const encryptedMessage = base64ToArrayBuffer(encryptedData.encryptedMessage);

      // Decrypt the AES key using RSA private key
      const binaryDer = pemToBinary(privateKeyPem);
      const privateKey = await window.crypto.subtle.importKey(
        'pkcs8',
        binaryDer,
        {
          name: 'RSA-OAEP',
          hash: 'SHA-256',
        },
        true,
        ['decrypt']
      );

      const decryptedAesKey = await window.crypto.subtle.decrypt(
        { name: 'RSA-OAEP' },
        privateKey,
        encryptedAesKey
      );

      // Import the decrypted AES key
      const aesKey = await window.crypto.subtle.importKey(
        'raw',
        decryptedAesKey,
        { name: 'AES-GCM' },
        true,
        ['decrypt']
      );

      // Decrypt the message
      const decryptedMessage = await window.crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        aesKey,
        encryptedMessage
      );

      const decoder = new TextDecoder();
      return decoder.decode(decryptedMessage);
    } else {
      // Fallback for old format (simple RSA)
      return '[Encrypted Message - Old Format]';
    }
  } catch (error) {
    console.error('Decryption error:', error);
    return '[Encrypted Message]';
  }
};

function pemToBinary(pem) {
  const lines = pem.split('\n');
  const encoded = lines
    .filter(line => !line.startsWith('-----'))
    .join('');
  const binary = atob(encoded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}