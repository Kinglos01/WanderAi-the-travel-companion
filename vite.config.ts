import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '');

  const geminiKey = env.GEMINI_API_KEY || env.GOOGLE_API_KEY || env.API_KEY || '';

  // Debugging: Log key detection status during build
  console.log("----------------------------------------------------------");
  console.log("Build Environment Check:");
  console.log(`GEMINI_API_KEY found: ${geminiKey ? 'YES (Length: ' + geminiKey.length + ')' : 'NO'}`);
  console.log(`FIREBASE_API_KEY found: ${env.FIREBASE_API_KEY ? 'YES' : 'NO'}`);
  console.log("----------------------------------------------------------");
  
  return {
    plugins: [react()],
    define: {
      // Inject API_KEY for Gemini using both process.env and a global constant for safety
      'process.env.API_KEY': JSON.stringify(geminiKey),
      '__GEMINI_API_KEY__': JSON.stringify(geminiKey),
      
      // Inject Firebase Configuration
      'process.env.FIREBASE_API_KEY': JSON.stringify(env.FIREBASE_API_KEY || ''),
      'process.env.FIREBASE_AUTH_DOMAIN': JSON.stringify(env.FIREBASE_AUTH_DOMAIN || ''),
      'process.env.FIREBASE_PROJECT_ID': JSON.stringify(env.FIREBASE_PROJECT_ID || ''),
      'process.env.FIREBASE_STORAGE_BUCKET': JSON.stringify(env.FIREBASE_STORAGE_BUCKET || ''),
      'process.env.FIREBASE_MESSAGING_SENDER_ID': JSON.stringify(env.FIREBASE_MESSAGING_SENDER_ID || ''),
      'process.env.FIREBASE_APP_ID': JSON.stringify(env.FIREBASE_APP_ID || ''),
    }
  };
});