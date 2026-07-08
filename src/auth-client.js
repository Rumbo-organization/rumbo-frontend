/* ============================================================
   RUMBO — cliente de auth (Better Auth vía fetch, sin SDK)
   Publica window.rumboAuth. Cookies de sesión: credentials include.
   Same-origin: el SPA y la API comparten origen (:3000 en dev vía proxy de
   Vite; el mismo dominio en Vercel), así la cookie de sesión es first-party.
   ============================================================ */

// VITE_API_URL vacío ⇒ same-origin: los fetch usan rutas relativas (/api/...).
// En dev, Vite proxea /api → Express :4000; en prod, la API vive en el mismo
// dominio. Solo setear una URL absoluta si alguna vez viven en hosts distintos.
const API = import.meta.env.VITE_API_URL || '';

async function req(path, opts = {}) {
  const r = await fetch(API + path, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...opts,
  });
  let data = null;
  try { data = await r.json(); } catch { /* respuestas vacías */ }
  if (!r.ok) throw new Error(data?.message || `Error ${r.status}`);
  return data;
}

const rumboAuth = {
  apiBase: API,

  // null si no hay sesión; { session, user } si la hay
  getSession: () => req('/api/auth/get-session'),

  signInGoogle: async () => {
    const d = await req('/api/auth/sign-in/social', {
      method: 'POST',
      body: JSON.stringify({ provider: 'google', callbackURL: window.location.origin + '/' }),
    });
    if (!d?.url) throw new Error('No se pudo iniciar el flujo de Google');
    window.location.href = d.url;
  },

  signInEmail: (email, password) => req('/api/auth/sign-in/email', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  }),

  signUpEmail: (name, email, password) => req('/api/auth/sign-up/email', {
    method: 'POST',
    body: JSON.stringify({ name, email, password }),
  }),

  signOut: () => req('/api/auth/sign-out', { method: 'POST', body: '{}' }),

  // ── Slice 3: reset de contraseña + 2FA TOTP (Better Auth) ──────────────────
  // El link del email vuelve a la SPA con ?mode=reset&token=… (ScreenLogin lo
  // detecta y muestra el form de contraseña nueva).
  forgotPassword: (email) => req('/api/auth/request-password-reset', {
    method: 'POST',
    body: JSON.stringify({ email, redirectTo: window.location.origin + '/?mode=reset' }),
  }),
  resetPassword: (newPassword, token) => req('/api/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ newPassword, token }),
  }),
  // enable devuelve { totpURI, backupCodes }; el 2FA queda ACTIVO recién al
  // verificar el primer código (verify-totp).
  twoFactorEnable: (password) => req('/api/auth/two-factor/enable', {
    method: 'POST',
    body: JSON.stringify({ password }),
  }),
  twoFactorDisable: (password) => req('/api/auth/two-factor/disable', {
    method: 'POST',
    body: JSON.stringify({ password }),
  }),
  twoFactorVerifyTotp: (code, trustDevice = false) => req('/api/auth/two-factor/verify-totp', {
    method: 'POST',
    body: JSON.stringify({ code, trustDevice }),
  }),
  twoFactorVerifyBackup: (code) => req('/api/auth/two-factor/verify-backup-code', {
    method: 'POST',
    body: JSON.stringify({ code }),
  }),
};

Object.assign(window, { rumboAuth });
