# StudySaathi AI - Deployment Guide

## Prerequisites

1. Node.js 18+ installed
2. Firebase CLI installed: `npm install -g firebase-tools`
3. Firebase project created at [Firebase Console](https://console.firebase.google.com)
4. Gemini API key from [Google AI Studio](https://aistudio.google.com/apikey)

---

## Step 1: Firebase Setup

### 1.1 Login to Firebase
```bash
firebase login
```

### 1.2 Initialize Firebase (if not done)
```bash
firebase init
```
Select:
- Firestore
- Hosting
- Set `frontend/dist` as public directory
- Configure as single-page app: Yes

### 1.3 Get Firebase Service Account Key
1. Go to Firebase Console → Project Settings → Service Accounts
2. Click "Generate new private key"
3. Save the JSON file

---

## Step 2: Environment Configuration

### 2.1 Backend (.env)
Create `backend/.env`:
```env
PORT=5000
NODE_ENV=production
GEMINI_API_KEY=your_gemini_api_key_here
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"...paste entire JSON as single line..."}
```

**Important:** The service account JSON must be on a single line with no line breaks.

### 2.2 Frontend (.env)
Create `frontend/.env`:
```env
VITE_API_URL=https://your-backend-url.com
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

Get these values from Firebase Console → Project Settings → General → Your apps → Web app

---

## Step 3: Firestore Security Rules

In Firebase Console → Firestore → Rules, add:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      match /topicProgress/{topicId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
      
      match /streaks/{streakId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
    
    // Study plans
    match /studyPlans/{planId} {
      allow read: if request.auth != null && resource.data.userId == request.auth.uid;
      allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
    }
    
    // Notes
    match /notes/{noteId} {
      allow read: if request.auth != null && resource.data.userId == request.auth.uid;
      allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
    }
  }
}
```

---

## Step 4: Build & Deploy Frontend

### 4.1 Install dependencies
```bash
cd frontend
npm install
```

### 4.2 Build for production
```bash
npm run build
```

### 4.3 Deploy to Firebase Hosting
```bash
cd ..
firebase deploy --only hosting
```

Your frontend will be live at: `https://your-project-id.web.app`

---

## Step 5: Deploy Backend

### Option A: Deploy to Railway (Recommended)

1. Create account at [railway.app](https://railway.app)
2. Connect your GitHub repo
3. Add environment variables in Railway dashboard
4. Deploy automatically on push

### Option B: Deploy to Render

1. Create account at [render.com](https://render.com)
2. Create new Web Service
3. Connect GitHub repo, select `backend` folder
4. Set build command: `npm install`
5. Set start command: `npm start`
6. Add environment variables

### Option C: Deploy to Google Cloud Run

```bash
cd backend

# Build container
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/studysaathi-backend

# Deploy
gcloud run deploy studysaathi-backend \
  --image gcr.io/YOUR_PROJECT_ID/studysaathi-backend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars "GEMINI_API_KEY=your_key,FIREBASE_SERVICE_ACCOUNT_KEY=your_json"
```

---

## Step 6: Update Frontend API URL

After deploying backend, update `frontend/.env`:
```env
VITE_API_URL=https://your-backend-url.com
```

Rebuild and redeploy frontend:
```bash
cd frontend
npm run build
cd ..
firebase deploy --only hosting
```

---

## Step 7: Enable Firebase Authentication

1. Firebase Console → Authentication → Sign-in method
2. Enable Email/Password
3. (Optional) Enable Google Sign-in

---

## Local Development

### Run Backend
```bash
cd backend
npm install
npm run dev
```
Backend runs at: http://localhost:5000

### Run Frontend
```bash
cd frontend
npm install
npm run dev
```
Frontend runs at: http://localhost:5173

---

## Troubleshooting

### Firebase Service Account Error
- Ensure JSON is on single line in .env
- No extra spaces or quotes around the JSON
- All special characters properly escaped

### CORS Errors
Backend already has CORS enabled. If issues persist, check your `VITE_API_URL` matches exactly.

### Firestore Permission Denied
- Check security rules are deployed
- Ensure user is authenticated
- Verify userId matches in requests

### Gemini API Errors
- Verify API key is valid
- Check quota limits at Google AI Studio
- Ensure key has Gemini API access enabled

---

## Production Checklist

- [ ] Firebase project created
- [ ] Firestore security rules deployed
- [ ] Authentication enabled
- [ ] Backend deployed with env vars
- [ ] Frontend built with production API URL
- [ ] Frontend deployed to Firebase Hosting
- [ ] Test full flow: signup → onboarding → dashboard → features
