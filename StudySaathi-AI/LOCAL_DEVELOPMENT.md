# Local Development Guide

## Quick Start

### 1. Start Backend (Terminal 1)

```bash
cd StudySaathi-AI/backend
npm install
npm run dev
```

You should see:
```
🚀 StudySaathi API running on port 5000
🔑 Gemini API Key: ✓ Configured
🔥 Firebase: ✓ Configured
```

### 2. Start Frontend (Terminal 2)

```bash
cd StudySaathi-AI/frontend
npm install
npm run dev
```

Frontend will run at: http://localhost:5173

---

## Environment Files

### Backend (`backend/.env`)
```env
PORT=5000
NODE_ENV=development
GEMINI_API_KEY=your_gemini_key
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}
```

### Frontend (`frontend/.env.local`)
```env
VITE_API_URL=http://localhost:5000
VITE_FIREBASE_API_KEY=your_key
VITE_FIREBASE_PROJECT_ID=your_project
```

**Note:** `.env.local` is used for local development, `.env.production` for production builds.

---

## Troubleshooting

### Backend not starting?
- Check if port 5000 is available
- Verify `GEMINI_API_KEY` is set in `backend/.env`
- Check Firebase service account JSON is valid

### Frontend calling wrong API?
- Check browser console for API URL: `🔧 API Configuration`
- Restart frontend dev server after changing `.env.local`
- Clear browser cache (Ctrl+Shift+Delete)

### CORS errors?
- Backend CORS is configured for `localhost`
- Make sure backend is running on port 5000
- Check browser console for exact error

---

## Logs to Watch

### Backend Logs
```
[2026-03-10T05:08:36.463Z] GET /api/ai/smart-learning
  Origin: http://localhost:5173
  User-Agent: Mozilla/5.0...
```

### Frontend Logs (Browser Console)
```
🔧 API Configuration: { url: 'http://localhost:5000', mode: 'development' }
📡 POST http://localhost:5000/api/ai/smart-learning
```

---

## Switching Between Local & Production

### For Local Development:
```bash
# Frontend uses .env.local automatically in dev mode
npm run dev
```

### For Production Build:
```bash
# Frontend uses .env.production
npm run build
```

---

## Common Commands

```bash
# Backend
npm run dev          # Start with hot reload
npm start            # Start production mode

# Frontend  
npm run dev          # Start dev server
npm run build        # Build for production
npm run preview      # Preview production build
```
