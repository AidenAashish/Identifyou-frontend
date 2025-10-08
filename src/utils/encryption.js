import CryptoJS from 'crypto-js'

export function encryptData(data) {
  if (!data) return null;
  try {
    const encrypted = CryptoJS.AES.encrypt(data, import.meta.env.VITE_ENCRYPTION_KEY).toString();
    return encrypted;
  } catch (error) {
    console.error('Encryption error:', error);
    return null;
  }
}

export function decryptData(encryptedData) {
  if (!encryptedData) return null;
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedData, import.meta.env.VITE_ENCRYPTION_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    console.error('Decryption error:', error);
    return null;
  }
}

// Utility functions for localStorage with encryption
export function setEncryptedItem(key, value) {
  if (value === null || value === undefined) {
    localStorage.removeItem(key);
    return;
  }
  const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
  const encrypted = encryptData(stringValue);
  if (encrypted) {
    localStorage.setItem(key, encrypted);
  }
}

export function getEncryptedItem(key, defaultValue = null) {
  try {
    const encrypted = localStorage.getItem(key);
    if (!encrypted) return defaultValue;
    const decrypted = decryptData(encrypted);
    return decrypted || defaultValue;
  } catch (error) {
    console.error('Error getting encrypted item:', error);
    return defaultValue;
  }
}

export function getEncryptedJSON(key, defaultValue = null) {
  try {
    const decrypted = getEncryptedItem(key);
    if (!decrypted) return defaultValue;
    return JSON.parse(decrypted);
  } catch (error) {
    console.error('Error parsing encrypted JSON:', error);
    return defaultValue;
  }
}

export function removeEncryptedItem(key) {
  localStorage.removeItem(key);
}