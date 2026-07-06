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
};

Object.assign(window, { rumboAuth });
