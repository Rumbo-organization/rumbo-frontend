// Registración del service worker + banner de actualización de la PWA.
//
// registerType 'prompt' (vite.config.js): cuando hay un deploy nuevo, el SW
// queda "waiting" y acá mostramos el banner con el botón Actualizar —
// updateSW(true) hace skipWaiting + reload con la versión nueva. Vanilla DOM
// a propósito: funciona igual en el cockpit y en la página pública (/d/:slug),
// sin depender del árbol de React ni del gate de sesión.
//
// El chequeo de updates corre al cargar y después cada 30 minutos (las
// pestañas longevas del PAS también se enteran del deploy).

import { registerSW } from 'virtual:pwa-register';

function showUpdateBanner(onUpdate) {
  if (document.getElementById('pwa-update-banner')) return;

  const banner = document.createElement('div');
  banner.id = 'pwa-update-banner';
  banner.setAttribute('role', 'status');
  banner.style.cssText = [
    'position:fixed',
    'left:50%',
    'bottom:18px',
    'transform:translateX(-50%)',
    'z-index:9999',
    'display:flex',
    'align-items:center',
    'gap:12px',
    'max-width:calc(100vw - 32px)',
    'padding:12px 14px 12px 16px',
    'border-radius:12px',
    'background:var(--panel, #fff)',
    'border:1px solid var(--hair, #e5e0d8)',
    'box-shadow:0 12px 32px rgba(0,0,0,.18)',
    'font-size:13px',
    'color:var(--ink, #1c1a17)',
  ].join(';');

  const text = document.createElement('span');
  text.textContent = 'Hay una versión nueva de la app.';

  const btn = document.createElement('button');
  btn.textContent = 'Actualizar';
  btn.style.cssText = [
    'padding:7px 14px',
    'border-radius:9px',
    'border:none',
    'background:var(--orange, #d4622f)',
    'color:#fff',
    'font-weight:600',
    'font-size:12.5px',
    'cursor:pointer',
    'flex-shrink:0',
  ].join(';');
  btn.onclick = () => {
    btn.textContent = 'Actualizando…';
    btn.disabled = true;
    onUpdate();
  };

  const close = document.createElement('button');
  close.textContent = '✕';
  close.setAttribute('aria-label', 'Más tarde');
  close.title = 'Más tarde';
  close.style.cssText = [
    'border:none',
    'background:transparent',
    'color:var(--ink-3, #8a8378)',
    'font-size:13px',
    'cursor:pointer',
    'padding:4px',
    'flex-shrink:0',
  ].join(';');
  close.onclick = () => banner.remove();

  banner.append(text, btn, close);
  document.body.appendChild(banner);
}

const updateSW = registerSW({
  onNeedRefresh() {
    showUpdateBanner(() => updateSW(true));
  },
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
