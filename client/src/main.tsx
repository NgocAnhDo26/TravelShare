// import { StrictMode } from 'react'
import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { GoogleOAuthProvider } from '@react-oauth/google';
import config, { GOOGLE_CONFIG } from '@/config/env';

// Validate configuration on app startup
try {
  const validation = config.validate();
  if (!validation.isValid && config.isProduction()) {
    throw new Error(
      `Critical configuration error: ${validation.missingVars.join(', ')}`,
    );
  }
} catch (error) {
  console.error('Configuration validation failed:', error);
  if (config.isProduction()) {
    throw error; // Don't start the app in production if config is invalid
  }
}

if (!GOOGLE_CONFIG.CLIENT_ID) {
  console.error(
    'Fatal Error: VITE_GOOGLE_CLIENT_ID is not defined in .env. Google authentication will not work.',
  );
}

const root = createRoot(document.getElementById('root')!);

root.render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CONFIG.CLIENT_ID}>
      <App />
    </GoogleOAuthProvider>
  </React.StrictMode>,
);
