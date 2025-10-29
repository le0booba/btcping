import CryptoJS from 'crypto-js';

const secretKey = process.env.ENCRYPTION_KEY;

if (!secretKey) {
  throw new Error('ENCRYPTION_KEY environment variable is not set.');
}

export function encrypt(text: string): string {
  return CryptoJS.AES.encrypt(text, secretKey).toString();
}

export function decrypt(ciphertext: string): string {
  const bytes = CryptoJS.AES.decrypt(ciphertext, secretKey);
  return bytes.toString(CryptoJS.enc.Utf8);
}
