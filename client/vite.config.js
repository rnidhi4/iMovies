import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The backend only accepts browser requests from http://localhost:5173 (CLIENT_URL in server/.env),
// so the port is fixed. If 5173 is busy, Vite stops instead of silently picking another port.
export default defineConfig({
  plugins: [react()],
  server: { port: 5173, strictPort: true },
});
