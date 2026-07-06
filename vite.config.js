import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Un solo origen en dev: el SPA vive en :3000 y Vite proxea /api/* al Express
  // interno (:4000). Así el browser solo ve :3000 → el redirect_uri de Google es
  // http://localhost:3000/api/auth/callback/google (coincide con GCP) y la cookie
  // de sesión es same-origin (sin CORS). Espeja el deploy en Vercel (SPA + API
  // bajo el mismo dominio). changeOrigin:false preserva Host=localhost:3000 =
  // BETTER_AUTH_URL, que Better Auth usa para validar la request.
  server: {
    port: 3000,
    strictPort: true,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: false,
      },
    },
  },
});
