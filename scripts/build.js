#!/usr/bin/env node

// Build script to ensure correct environment variables are loaded
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Ensure we're running from the project root
const projectRoot = path.join(__dirname, '..');
process.chdir(projectRoot);

const isProduction = process.argv.includes('--production') || process.env.NODE_ENV === 'production';

console.log(`🏗️  Building for ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'}`);
console.log(`📁 Working directory: ${process.cwd()}`);

// Load the correct environment file
const envFile = isProduction ? '.env.production' : '.env.development';
const envPath = path.join(process.cwd(), envFile);

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  console.log(`📂 Loading environment from: ${envFile}`);
  
  // Parse environment variables
  const lines = envContent.split('\n');
  const envVars = {};
  
  lines.forEach(line => {
    line = line.trim();
    if (line && !line.startsWith('#') && line.includes('=')) {
      const [key, ...valueParts] = line.split('=');
      const value = valueParts.join('=');
      envVars[key.trim()] = value.trim();
    }
  });
  
  // Set environment variables
  Object.entries(envVars).forEach(([key, value]) => {
    process.env[key] = value;
    console.log(`✅ ${key}=${value}`);
  });
} else {
  console.warn(`⚠️  Environment file ${envFile} not found at ${envPath}`);
}

// Set NODE_ENV explicitly
process.env.NODE_ENV = isProduction ? 'production' : 'development';

// Determine platform and build command
let buildCommand;
let outputDir = 'dist';

if (process.argv.includes('--android')) {
  // For Android, we need to use EAS Build
  console.log('🤖 Building for Android...');
  buildCommand = 'npx eas build --platform android --local';
  outputDir = '.'; // EAS builds output to current directory
} else if (process.argv.includes('--web')) {
  console.log('🌐 Building for Web...');
  const sourceMapFlag = process.argv.includes('--debug') ? '-s' : '';
  buildCommand = `npx expo export -p web ${sourceMapFlag} --output-dir dist`;
} else {
  console.log('📱 Building for all platforms...');
  const sourceMapFlag = process.argv.includes('--debug') ? '-s' : '';
  buildCommand = `npx expo export ${sourceMapFlag} --output-dir dist`;
}

console.log(`🚀 Running: ${buildCommand}`);
console.log(`🔧 Final environment for build:`, {
  NODE_ENV: process.env.NODE_ENV,
  EXPO_PUBLIC_API_URL: process.env.EXPO_PUBLIC_API_URL,
  EXPO_PUBLIC_ENVIRONMENT: process.env.EXPO_PUBLIC_ENVIRONMENT
});

try {
  execSync(buildCommand, { 
    stdio: 'inherit', 
    env: process.env,
    cwd: process.cwd()
  });
  
  // Post-build verification
  console.log('📋 Post-build verification...');
  const fs = require('fs');
  const path = require('path');
  
  // Check if the environment values were properly embedded
  const distPath = path.join(process.cwd(), 'dist');
  const metadataPath = path.join(distPath, 'metadata.json');
  
  if (fs.existsSync(metadataPath)) {
    const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
    console.log('📊 Build metadata:', metadata);
  }
  
  console.log('✅ Build completed successfully!');
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}