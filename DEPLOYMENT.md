# GymTracker Deployment Guide

## Deployment Options

### 1. Web Deployment (Render/Vercel/Netlify)

**For Render:**
- **Source Directory:** `.` (root)
- **Build Command:** `npm install && npm run build:web`
- **Start Command:** `npx serve dist`
- **Publish Directory:** `dist`

**For Vercel:**
- **Build Command:** `npm run build:web`
- **Output Directory:** `dist`

### 2. Backend API (Render/Railway/Heroku)

**For Render:**
- **Source Directory:** `server`
- **Build Command:** `npm install`
- **Start Command:** `npm start`

### 3. Mobile App Distribution

#### Android:
```bash
# Development build
npm run build:android

# Production build  
eas build --platform android --profile production
```

#### iOS:
```bash
# Development build
npm run build:ios

# Production build
eas build --platform ios --profile production
```

#### Both platforms:
```bash
npm run build:all
```

## Environment Variables

### Frontend (.env):
```
EXPO_PUBLIC_API_URL=https://your-backend-url.render.com
EXPO_PUBLIC_ENVIRONMENT=production
```

### Backend (.env):
```
NODE_ENV=production
PORT=3001
DATABASE_URL=your-database-url
CORS_ORIGIN=https://your-frontend-url.com
```

## Pre-deployment Checklist

1. [ ] Create Expo account: `npx expo register`
2. [ ] Configure EAS: `eas configure`
3. [ ] Set up project: `eas update --branch production`
4. [ ] Test web build: `npm run build:web && npm run preview:web`
5. [ ] Update API URLs in storage.ts
6. [ ] Configure environment variables
7. [ ] Test mobile builds locally

## Deployment Commands

```bash
# Web build and preview
npm run build:web
npm run preview:web

# Mobile builds
npm run build:android
npm run build:ios

# Server
cd server && npm start
```

## App Store Distribution

### Google Play Store:
1. Build production AAB: `eas build --platform android --profile production`
2. Download the .aab file
3. Upload to Google Play Console

### Apple App Store:
1. Build production IPA: `eas build --platform ios --profile production`
2. Download the .ipa file
3. Upload to App Store Connect via Xcode or Transporter

## URLs

- **Web App:** https://your-app.render.com
- **API Backend:** https://your-api.render.com
- **Health Check:** https://your-api.render.com/api/health
- **Android Download:** Via Google Play Store or direct APK
- **iOS Download:** Via Apple App Store or TestFlight