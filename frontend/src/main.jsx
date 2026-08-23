// frontend/src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { App as AntApp } from 'antd';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import './index.css';

// =============================================
// ✅ ثبت Service Worker فقط در حالت Production
// =============================================
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('✅ Service Worker registered:', registration);
      })
      .catch(error => {
        console.error('❌ Service Worker registration failed:', error);
      });
  });
} else {
  console.log('ℹ️ Service Worker only enabled in production mode');
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <SocketProvider>
        <AntApp>
          <App />
        </AntApp>
      </SocketProvider>
    </AuthProvider>
  </React.StrictMode>
);