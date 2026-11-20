import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import './index.css';

if (window.top !== window.self) document.documentElement.classList.add('plugin');

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
