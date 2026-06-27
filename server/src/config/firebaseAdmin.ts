import admin from 'firebase-admin';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

if (!admin.apps.length) {
  const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

  if (credentialsPath) {
    // Resolve relative to the server directory (for Render Secret File)
    const resolvedPath = path.resolve(process.cwd(), credentialsPath);

    if (fs.existsSync(resolvedPath)) {
      try {
        const serviceAccount = JSON.parse(fs.readFileSync(resolvedPath, 'utf8'));
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
        console.log('[Firebase Admin] Initialized using service account file.');
      } catch (err) {
        console.error('[Firebase Admin] Failed to parse service account file:', err);
        process.exit(1);
      }
    } else {
      console.error(`[Firebase Admin] Service account file not found at: ${resolvedPath}`);
      process.exit(1);
    }
  } else {
    // Fallback to Application Default Credentials (GCP / Cloud Run)
    admin.initializeApp();
    console.log('[Firebase Admin] Initialized using Application Default Credentials.');
  }
}

export default admin;
