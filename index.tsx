import React from 'react';
import ReactDOM from 'react-dom/client';
// IMPORTING { App } with curly braces to match the Named Export
import { App } from './App';
import './index.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
  console.error("Critical: Could not find root element!");
} else {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
