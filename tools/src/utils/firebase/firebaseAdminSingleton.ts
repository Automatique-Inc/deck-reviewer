import admin from 'firebase-admin';
import { env, isUsingEmulator } from '../env';

let firebaseApp: admin.app.App | null = null;

export function initializeFirebaseAdmin(): admin.app.App {
  if (firebaseApp) {
    return firebaseApp;
  }

  const usingEmulator = isUsingEmulator();

  if (usingEmulator) {
    console.log('🔧 Initializing Firebase Admin for EMULATOR');
    console.log(`   Firestore: ${env.FIRESTORE_EMULATOR_HOST}`);
    console.log(`   Auth: ${env.FIREBASE_AUTH_EMULATOR_HOST}`);
    console.log(`   Storage: ${env.FIREBASE_STORAGE_EMULATOR_HOST}`);

    // Emulator mode - no credentials needed
    firebaseApp = admin.initializeApp({
      projectId: env.FIREBASE_PROJECT_ID,
      storageBucket: env.FIREBASE_STORAGE_BUCKET,
    });
  } else {
    console.log('🚀 Initializing Firebase Admin for PRODUCTION');

    if (env.GOOGLE_APPLICATION_CREDENTIALS) {
      // Use service account credentials
      const serviceAccount = require(env.GOOGLE_APPLICATION_CREDENTIALS);
      firebaseApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: env.FIREBASE_STORAGE_BUCKET,
      });
    } else {
      // Use default credentials (ADC)
      firebaseApp = admin.initializeApp({
        storageBucket: env.FIREBASE_STORAGE_BUCKET,
      });
    }
  }

  return firebaseApp;
}

// Initialize and export instances
const app = initializeFirebaseAdmin();
export const db = admin.firestore();
export const storage = admin.storage();
export const auth = admin.auth();

// Export timestamp helper
export const Timestamp = admin.firestore.Timestamp;
export const FieldValue = admin.firestore.FieldValue;

export default app;
