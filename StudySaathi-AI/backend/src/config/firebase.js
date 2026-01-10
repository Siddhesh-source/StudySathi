const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');

let serviceAccount = null;
let db = null;
let auth = null;

try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
    const app = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    
    // Connect to the 'siddhesh' named database
    db = getFirestore(app, 'siddhesh');
    auth = admin.auth();
    console.log('Firebase Admin SDK initialized successfully with database: siddhesh');
  } else {
    console.warn('Firebase Admin SDK not initialized: Missing FIREBASE_SERVICE_ACCOUNT_KEY');
  }
} catch (error) {
  console.error('Firebase initialization error:', error.message);
  console.warn('Make sure FIREBASE_SERVICE_ACCOUNT_KEY is valid JSON in your .env file');
}

module.exports = { admin, db, auth };
