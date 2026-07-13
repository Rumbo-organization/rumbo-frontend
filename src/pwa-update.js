// Registración del service worker de la PWA.
//
// registerType 'autoUpdate' (vite.config.js): cuando hay un deploy nuevo, el
// SW hace skipWaiting solo y la página se recarga con la versión nueva, sin
// banner ni intervención del usuario. Vanilla a propósito: funciona igual en
// el cockpit y en la página pública (/d/:slug), sin depender del árbol de
// React ni del gate de sesión.
//
// El chequeo de updates corre al cargar y después cada 30 minutos (las
// pestañas longevas del PAS también se enteran del deploy).

import { registerSW } from 'virtual:pwa-register';

registerSW({
  onRegisteredSW(_url, registration) {
    if (!registration) return;
    setInterval(
      () => {
        registration.update().catch(() => {});
      },
      30 * 60 * 1000,
    );
  },
});
