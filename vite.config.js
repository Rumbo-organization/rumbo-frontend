import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const appName = env.VITE_APP_NAME ?? 'Rumbo';

  return {
    plugins: [
      react(),
      // PWA: instalable en desktop/mobile. El SW precachea solo el shell estático
      // (JS/CSS/íconos); /api/* nunca se cachea ni se intercepta (auth y datos
      // siempre van a la red — cookie de sesión intacta). prompt: al deployar
      // una versión nueva, src/pwa-update.js muestra el banner "hay una versión
      // nueva" con botón Actualizar (antes autoUpdate: el usuario quedaba viendo
      // la versión vieja sin enterarse hasta la próxima visita).
      VitePWA({
        registerType: 'prompt',
        // La registración vive en src/pwa-update.js (virtual:pwa-register), que
        // además maneja el banner; sin esto el plugin inyectaría una propia.
        injectRegister: false,
        // OJO: no usar includeAssets acá — duplica los PNG que globPatterns ya
        // precachea y workbox aborta el SW entero (conflicting-entries) al evaluar.
        manifest: {
          name: appName,
          short_name: appName,
          description:
            'El sistema para Productores Asesores de Seguros: asegurados, pólizas, vencimientos y siniestros en un solo lugar.',
          lang: 'es-AR',
          start_url: '/',
          scope: '/',
          display: 'standalone',
          background_color: '#F9F5ED',
          theme_color: '#F9F5ED',
          icons: [
            { src: '/pwa-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
            { src: '/pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
            { src: '/pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          ],
        },
        workbox: {
          // Runtime de workbox embebido en sw.js: el loader AMD externo registra
          // los listeners (install/fetch) en un microtask y Chrome los ignora si
          // no están en la evaluación inicial → SW "activo" pero sin precache.
          inlineWorkboxRuntime: true,
          globPatterns: ['**/*.{js,css,html,png,svg,woff2}'],
          // El fallback SPA no aplica a /api/*: los redirects de auth (Google
          // OAuth callback) y los endpoints deben llegar al servidor, no al shell.
          navigateFallbackDenylist: [/^\/api\//],
        },
      }),
    ],
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
  };
});
