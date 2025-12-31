import React from 'react';
import ReactDOM from 'react-dom/client';
// FIX: Curly braces { } import the Named Export
import { App } from './App';
import './index.css';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error("Root element not found");

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
