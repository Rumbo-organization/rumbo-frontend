/* ============================================================
   RUMBO — cliente del BFF (API Express, /api/v1)
   Publica window.rumboApi. Mismas cookies de sesión que auth-client
   (credentials: include). Base URL compartida con auth-client.
   ============================================================ */

// Mismo criterio que auth-client.js: VITE_API_URL vacío ⇒ same-origin (rutas
// relativas /api/...). En dev Vite proxea /api → Express :4000; en prod la API
// vive en el mismo dominio.
const API = import.meta.env.VITE_API_URL || '';

async function get(path) {
  const r = await fetch(API + path, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!r.ok) {
    const err = new Error(`API ${r.status} en ${path}`);
    err.status = r.status;
    throw err;
  }
  // Si el proxy de Vite no está (server viejo sin la config de proxy), /api/*
  // cae al fallback SPA y devuelve el index.html con status 200. Detectarlo
  // explícitamente en vez de reventar en r.json() con un error críptico.
  const ct = r.headers.get('content-type') || '';
  if (!ct.includes('application/json')) {
    throw new Error(
      `Respuesta no-JSON en ${path} (content-type: ${ct || 'vacío'}). ` +
      `Probable proxy de Vite caído: reiniciá 'pnpm dev' en rumbo-frontend.`,
    );
  }
  return r.json();
}

const rumboApi = {
  apiBase: API,

  // BFF del cockpit: el payload completo con la forma de window.RUMBO_DATA.
  bootstrap: () => get('/api/v1/bootstrap'),

  // Lecturas REST individuales (base de la API pública, D-026).
  contacts: () => get('/api/v1/contacts'),
  policies: () => get('/api/v1/policies'),
  claims: () => get('/api/v1/claims'),
  insurers: () => get('/api/v1/insurers'),
};

// Hidrata window.RUMBO_DATA con los datos reales del backend, preservando lo
// que el BFF no provee (ramoMeta para los íconos, TODAY como Date para los
// cálculos de data.jsx). Los datos estáticos de data.jsx quedan de fallback si
// el fetch falla (demo offline).
async function hydrateRumboData() {
  const server = await rumboApi.bootstrap();
  const base = window.RUMBO_DATA ?? {};
  window.RUMBO_DATA = {
    ...base, // ramoMeta y cualquier default de data.jsx
    ...server, // CONTACTS, POLICIES, VENCIMIENTOS, … reales de la org
    // TODAY real del server (Date, no string). El del demo (base) solo si falta.
    TODAY: server.TODAY ? new Date(server.TODAY) : base.TODAY,
  };
  return window.RUMBO_DATA;
}

Object.assign(window, { rumboApi, hydrateRumboData });
