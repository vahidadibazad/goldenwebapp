// frontend/src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// حذف StrictMode برای جلوگیری از خطاهای ناشی از رندر دوگانه
ReactDOM.createRoot(document.getElementById('root')).render(<App />);