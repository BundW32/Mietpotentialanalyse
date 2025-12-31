
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // base: './' sorgt dafür, dass die App auch unter www.beispiel.de/unterordner/ funktioniert
  base: './', 
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'terser',
  },
  server: {
    port: 3000,
    strictPort: true,
  }
});
