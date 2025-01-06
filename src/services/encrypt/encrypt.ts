import CryptoJS from 'crypto-js';

const ENCRYPTION_SECRET = process.env.DATA_ENCRYPTION_SECRET;

if (!ENCRYPTION_SECRET) {
  throw new Error('DATA_ENCRYPTION_SECRET is not defined in environment variables.');
}

export const encryptData = <T>(data: T): string => {
  const stringifiedData = JSON.stringify(data);
  return CryptoJS.AES.encrypt(stringifiedData, ENCRYPTION_SECRET).toString();
};

export const decryptData = <T>(encryptedData: string): T => {
  const bytes = CryptoJS.AES.decrypt(encryptedData, ENCRYPTION_SECRET);
  const decryptedData = bytes.toString(CryptoJS.enc.Utf8);

  try {
    return JSON.parse(decryptedData) as T;
  } catch {
    throw new Error('Failed to parse decrypted data. Ensure the data is properly encrypted and formatted.');
  }
};
