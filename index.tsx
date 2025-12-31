import React from 'react';
import ReactDOM from 'react-dom/client';
// FIX: Curly braces { } import the Named Export from App.tsx
import { App } from './App';
import './index.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error("Failed to find the root element");
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
