import dotenv from 'dotenv';
import path from 'path';

// Load .env file from tools directory
dotenv.config({ path: path.join(__dirname, '../../.env') });

export const env = {
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
  FIRESTORE_EMULATOR_HOST: process.env.FIRESTORE_EMULATOR_HOST || '',
  FIREBASE_AUTH_EMULATOR_HOST: process.env.FIREBASE_AUTH_EMULATOR_HOST || '',
  FIREBASE_STORAGE_EMULATOR_HOST: process.env.FIREBASE_STORAGE_EMULATOR_HOST || '',
  FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID || 'demo-makerkit',
  FIREBASE_STORAGE_BUCKET: process.env.FIREBASE_STORAGE_BUCKET || 'demo-makerkit.appspot.com',
  GOOGLE_APPLICATION_CREDENTIALS: process.env.GOOGLE_APPLICATION_CREDENTIALS || '',
};

export function validateEnv(): void {
  const required = ['OPENAI_API_KEY'];
  const missing = required.filter(key => !env[key as keyof typeof env]);

  if (missing.length > 0) {
    console.warn(`⚠️  Missing environment variables: ${missing.join(', ')}`);
    console.warn(`⚠️  Please set them in tools/.env file`);
  }
}

export function isUsingEmulator(): boolean {
  return !!(
    process.env.FIRESTORE_EMULATOR_HOST ||
    process.env.FIREBASE_AUTH_EMULATOR_HOST ||
    process.env.FIREBASE_STORAGE_EMULATOR_HOST
  );
}
