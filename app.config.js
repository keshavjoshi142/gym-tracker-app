// Dynamic Expo configuration based on environment
const path = require('path');
const fs = require('fs');

const IS_PRODUCTION = process.env.NODE_ENV === 'production';

// Manually load environment file if variables aren't set
if (!process.env.EXPO_PUBLIC_API_URL || !process.env.EXPO_PUBLIC_ENVIRONMENT) {
  const envFile = IS_PRODUCTION ? '.env.production' : '.env.development';
  const envPath = path.join(__dirname, envFile);
  
  if (fs.existsSync(envPath)) {
    console.log(`📂 Loading environment from: ${envFile}`);
    const envContent = fs.readFileSync(envPath, 'utf8');
    
    // Parse environment variables
    const lines = envContent.split('\n');
    lines.forEach(line => {
      line = line.trim();
      if (line && !line.startsWith('#') && line.includes('=')) {
        const [key, ...valueParts] = line.split('=');
        const value = valueParts.join('=').trim();
        const cleanKey = key.trim();
        
        // Only set if not already defined and it's an EXPO_PUBLIC_ variable
        if (cleanKey.startsWith('EXPO_PUBLIC_') && !process.env[cleanKey]) {
          process.env[cleanKey] = value;
          console.log(`✅ Set ${cleanKey}=${value}`);
        }
      }
    });
  }
}

// Debug environment loading
console.log('🔧 NODE_ENV:', process.env.NODE_ENV);
console.log('🏭 Is Production:', IS_PRODUCTION);
console.log('📡 EXPO_PUBLIC_API_URL:', process.env.EXPO_PUBLIC_API_URL);
console.log('🌍 EXPO_PUBLIC_ENVIRONMENT:', process.env.EXPO_PUBLIC_ENVIRONMENT);

// Determine the correct values based on environment
const apiUrl = IS_PRODUCTION 
  ? (process.env.EXPO_PUBLIC_API_URL || 'https://gymtracker-api.onrender.com')
  : (process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001');
  
const environment = IS_PRODUCTION 
  ? (process.env.EXPO_PUBLIC_ENVIRONMENT || 'production')
  : (process.env.EXPO_PUBLIC_ENVIRONMENT || 'development');

console.log('🎯 Final API URL:', apiUrl);
console.log('🎯 Final Environment:', environment);
console.log('📋 App config extra will be:', {
  apiUrl: apiUrl,
  environment: environment,
});

export default {
  expo: {
    name: 'GymTracker',
    slug: 'gym-tracker',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    newArchEnabled: true,
    splash: {
      image: './assets/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#6750A4',
    },
    assetBundlePatterns: ['**/*'],
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.keshavjoshi142.gymtracker',
      buildNumber: '1.0.0',
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#6750A4',
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      package: 'com.keshavjoshi142.gymtracker',
      versionCode: 1,
    },
    web: {
      favicon: './assets/favicon.png',
      bundler: 'metro',
    },
    plugins: ['expo-font'],
    extra: {
      eas: {
        projectId: '955691e7-07e9-4483-865c-f3a3db937eec',
      },
      // Pass environment variables to the app with fallbacks
      apiUrl: apiUrl,
      environment: environment,
    },
  },
};