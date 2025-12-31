
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App'; // Import ohne Endung ist Standard für Vite bei TSX

const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error("Critical Error: Root element not found.");
} else {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
