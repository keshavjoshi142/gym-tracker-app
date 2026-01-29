# GymTracker Web & Backend Deployment Guide

## Render Deployment

### 1. Backend API Service

**Configuration:**
- **Service Type:** Web Service
- **Source Directory:** `server`
- **Build Command:** `npm install`
- **Start Command:** `npm start`
- **Environment Variables:**
  - `NODE_ENV=production`
  - `PORT=3001`
  - `CORS_ORIGIN=https://gymtracker-web.onrender.com`

### 2. Web Frontend Service

**Configuration:**
- **Service Type:** Static Site
- **Source Directory:** `.` (root)
- **Build Command:** `npm install && npm run build:web`
- **Publish Directory:** `dist`
- **Environment Variables:**
  - `EXPO_PUBLIC_API_URL=https://gymtracker-api.onrender.com`
  - `EXPO_PUBLIC_ENVIRONMENT=production`

## Local Development & Testing

### Test Web Build:
```bash
# Build and preview web version
npm run build:web
npm run preview:web
```

### Test Backend:
```bash
# Start backend server
npm run server:dev
```

### Test Full Stack:
```bash
# Terminal 1: Start backend
cd server && npm start

# Terminal 2: Start web frontend
npm run web
```

## Deployment Steps

1. **Push code to GitHub**
2. **Create two Render services:**
   - Backend API (Web Service)
   - Web Frontend (Static Site)
3. **Set environment variables** in Render dashboard
4. **Deploy both services**

## URLs After Deployment

- **Web App:** https://gymtracker-web.onrender.com
- **API Backend:** https://gymtracker-api.onrender.com
- **API Health Check:** https://gymtracker-api.onrender.com/api/health

## Environment Variables

Copy these to your Render services:

### Backend Service:
```
NODE_ENV=production
PORT=3001
CORS_ORIGIN=https://gymtracker-web.onrender.com
```

### Frontend Service:
```
EXPO_PUBLIC_API_URL=https://gymtracker-api.onrender.com
EXPO_PUBLIC_ENVIRONMENT=production
```