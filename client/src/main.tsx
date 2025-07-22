// import { StrictMode } from 'react'
import React from 'react';
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { GoogleOAuthProvider } from '@react-oauth/google';
const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

if (!googleClientId) {
  console.error("Fatal Error: VITE_GOOGLE_CLIENT_ID is not defined in .env Google authentication will not work.");
}   

const root = createRoot(document.getElementById('root')!);

root.render(
  <React.StrictMode>

    <GoogleOAuthProvider clientId={googleClientId!}>
      <App />
    </GoogleOAuthProvider>
  </React.StrictMode>,
);
