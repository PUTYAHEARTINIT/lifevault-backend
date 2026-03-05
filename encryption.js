const CryptoJS = require('crypto-js');
const fs = require('fs');
const path = require('path');

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default_key_change_this';

// Encrypt file content
function encryptFile(filePath) {
  const fileData = fs.readFileSync(filePath);
  const encrypted = CryptoJS.AES.encrypt(
    fileData.toString('base64'),
    ENCRYPTION_KEY
  ).toString();
  return encrypted;
}

// Decrypt file content
function decryptFile(encryptedData) {
  const decrypted = CryptoJS.AES.decrypt(encryptedData, ENCRYPTION_KEY);
  return Buffer.from(decrypted.toString(CryptoJS.enc.Utf8), 'base64');
}

// Encrypt text (for messages, notes, etc.)
function encryptText(text) {
  return CryptoJS.AES.encrypt(text, ENCRYPTION_KEY).toString();
}

// Decrypt text
function decryptText(encryptedText) {
  const bytes = CryptoJS.AES.decrypt(encryptedText, ENCRYPTION_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
}

// Generate secure file path
function generateSecureFileName(originalName) {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(7);
  const ext = path.extname(originalName);
  return `${timestamp}_${random}${ext}`;
}

module.exports = {
  encryptFile,
  decryptFile,
  encryptText,
  decryptText,
  generateSecureFileName
};
