# Firebase Setup Instructions for StudySaathi AI

## 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project"
3. Enter project name: `studysaathi-ai`
4. Enable/disable Google Analytics as preferred
5. Click "Create project"

## 2. Enable Authentication

1. In Firebase Console, go to **Authentication** > **Sign-in method**
2. Click on **Email/Password**
3. Toggle **Enable** and click **Save**

## 3. Create Firestore Database

1. Go to **Firestore Database** in the sidebar
2. Click **Create database**
3. Choose **Start in test mode** (for development)
4. Select your preferred region
5. Click **Enable**

### Firestore Security Rules (Production)

Replace test rules with:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## 4. Get Frontend Config

1. Go to **Project Settings** (gear icon)
2. Under **Your apps**, click the web icon (`</>`)
3. Register app with nickname: `studysaathi-web`
4. Copy the config values to `frontend/.env`:

```env
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=studysaathi-ai.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=studysaathi-ai
VITE_FIREBASE_STORAGE_BUCKET=studysaathi-ai.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
```

## 5. Get Backend Service Account Key

1. Go to **Project Settings** > **Service accounts**
2. Click **Generate new private key**
3. Download the JSON file
4. Convert JSON to single line and paste in `backend/.env`:

```env
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"...","private_key":"..."}
```

**Tip:** Use this command to convert JSON to single line:
```bash
cat serviceAccountKey.json | tr -d '\n' | tr -s ' '
```

## 6. Setup Firebase Hosting

1. Install Firebase CLI globally:
```bash
npm install -g firebase-tools
```

2. Login to Firebase:
```bash
firebase login
```

3. Update `.firebaserc` with your project ID:
```json
{
  "projects": {
    "default": "studysaathi-ai"
  }
}
```

4. Build and deploy:
```bash
cd frontend
npm run build
cd ..
firebase deploy --only hosting
```

## 7. Usage Examples

### Frontend - Authentication
```javascript
import { signUp, signIn, logOut, subscribeToAuthChanges } from './firebase';

// Sign up
const user = await signUp('email@example.com', 'password123', 'John Doe');

// Sign in
const user = await signIn('email@example.com', 'password123');

// Sign out
await logOut();

// Listen to auth state
subscribeToAuthChanges((user) => {
  if (user) console.log('Logged in:', user.email);
  else console.log('Logged out');
});
```

### Frontend - Firestore
```javascript
import { addDocument, getDocument, getDocuments, where } from './firebase';

// Add document
const id = await addDocument('notes', { title: 'My Note', content: '...' });

// Get document
const note = await getDocument('notes', id);

// Query documents
const notes = await getDocuments('notes', [where('userId', '==', 'abc123')]);
```

### Backend - Verify Token
```javascript
const { verifyToken } = require('./middleware/authMiddleware');

app.get('/api/protected', verifyToken, (req, res) => {
  res.json({ message: 'Authenticated!', user: req.user });
});
```

## File Structure

```
StudySaathi-AI/
├── firebase.json          # Hosting config
├── .firebaserc            # Project alias
├── frontend/
│   ├── .env               # Firebase client config
│   └── src/firebase/
│       ├── config.js      # Firebase initialization
│       ├── auth.js        # Authentication helpers
│       ├── firestore.js   # Firestore helpers
│       └── index.js       # Exports
└── backend/
    ├── .env               # Service account key
    └── src/
        ├── config/firebase.js      # Admin SDK init
        └── middleware/authMiddleware.js
```
