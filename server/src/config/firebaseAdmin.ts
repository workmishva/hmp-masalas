import admin from 'firebase-admin';
import dotenv from 'dotenv';
dotenv.config();

// Normally you would load a serviceAccountKey.json, e.g.:
// const serviceAccount = require('../../serviceAccountKey.json');
// admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });

// If deployed on GCP/Firebase or providing GOOGLE_APPLICATION_CREDENTIALS in .env:
if (!admin.apps.length) {
  admin.initializeApp({
      // We fall back to application default credentials
  });
}

export default admin;
