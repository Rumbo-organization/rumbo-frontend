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

// Escrituras (POST/PATCH/DELETE). Primer camino mutante del cliente — el resto
// del cockpit es solo lectura del BFF. Mismo manejo de cookies/errores que get();
// el body de error { error } del backend se propaga como Error.message.
async function send(method, path, body) {
  const r = await fetch(API + path, {
    method,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: body != null ? JSON.stringify(body) : undefined,
  });
  if (!r.ok) {
    let msg = `API ${r.status} en ${path}`;
    try {
      const j = await r.json();
      if (j && j.error) msg = j.error;
    } catch { /* respuesta sin JSON: dejamos el mensaje genérico */ }
    const err = new Error(msg);
    err.status = r.status;
    throw err;
  }
  if (r.status === 204) return null;
  return r.json();
}

const rumboApi = {
  apiBase: API,

  // BFF del cockpit: el payload completo con la forma de window.RUMBO_DATA.
  bootstrap: () => get('/api/v1/bootstrap'),

  // Lecturas REST individuales (base de la API pública, D-026).
  contacts: () => get('/api/v1/contacts'),
  // Asegurados paginado server-side (Fase 2): { q, seg, sort, dir, limit, offset }
  // → { data, total, limit, offset }.
  contactsPage: (params = {}) => {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (v != null && v !== '') qs.set(k, v);
    return get('/api/v1/contacts?' + qs.toString());
  },
  contactById: (id) => get('/api/v1/contacts/' + id),
  // Vencimientos paginado server-side (Fase 4): { window, pay, limit, offset } →
  // { data, total, totalPrima, counts, limit, offset }.
  vencimientosPage: (params = {}) => {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (v != null && v !== '') qs.set(k, v);
    return get('/api/v1/vencimientos?' + qs.toString());
  },
  policies: () => get('/api/v1/policies'),
  // Detalle 360° de una póliza (Fase 3): { policy, contact, siniestros, crosssell, activity }.
  policyDetail: (id) => get('/api/v1/policies/' + id + '/detail'),
  // Pickers livianos (Fase 3): typeahead de dropdowns y palette. q opcional.
  // → { data: [{id, num, client, ramo, insurer, detail}] } / { data: [{id, name, initials, kind, city}] }.
  policiesPicker: (q = '') => get('/api/v1/policies/picker' + (q ? '?q=' + encodeURIComponent(q) : '')),
  contactsPicker: (q = '') => get('/api/v1/contacts/picker' + (q ? '?q=' + encodeURIComponent(q) : '')),
  // Cross-selling server-side (Fase 3): { ops, total, limit, offset,
  // counts: { altas, bySuggest }, matrix, matrixTotal }.
  crosssell: (params = {}) => {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (v != null && v !== '') qs.set(k, v);
    const s = qs.toString();
    return get('/api/v1/crosssell' + (s ? '?' + s : ''));
  },
  // Pólizas paginado server-side (Fase 1 escalabilidad): { q, seg, pay, sort, dir,
  // limit, offset } → { data, total, limit, offset }.
  policiesPage: (params = {}) => {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (v != null && v !== '') qs.set(k, v);
    return get('/api/v1/policies?' + qs.toString());
  },
  claims: () => get('/api/v1/claims'),
  // Siniestros paginado server-side (Slice 2): { q, estado, limit, offset } →
  // { data, total, counts: { abiertos, enCurso, cerrados, stale }, limit, offset }.
  claimsPage: (params = {}) => {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (v != null && v !== '') qs.set(k, v);
    const s = qs.toString();
    return get('/api/v1/siniestros' + (s ? '?' + s : ''));
  },
  claimsPicker: (q = '') => get('/api/v1/claims/picker' + (q ? '?q=' + encodeURIComponent(q) : '')),
  // Prospectos server-side (uncapped) + mover de etapa (advanceProspect).
  prospectos: () => get('/api/v1/prospectos'),
  advanceProspect: (id, to) => send('PATCH', `/api/v1/contacts/${id}/pipeline`, { to }),
  // Actividad (audit) paginada server-side.
  actividadPage: (params = {}) => {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (v != null && v !== '') qs.set(k, v);
    const s = qs.toString();
    return get('/api/v1/actividad' + (s ? '?' + s : ''));
  },
  // Log de comunicaciones ("marqué que envié" del WhatsApp wa.me).
  logCommunication: (data) => send('POST', '/api/v1/communications', data),

  // ── Slice 5: cotizaciones reales, cuenta, exports, resumen ─────────────────
  cotizacionesPage: (params = {}) => {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (v != null && v !== '') qs.set(k, v);
    const s = qs.toString();
    return get('/api/v1/cotizaciones' + (s ? '?' + s : ''));
  },
  quoteById: (id) => get('/api/v1/quotes/' + id),
  createQuote: (data) => send('POST', '/api/v1/quotes', data),
  deleteQuote: (id) => send('DELETE', '/api/v1/quotes/' + id),
  addQuoteItem: (quoteId, data) => send('POST', `/api/v1/quotes/${quoteId}/items`, data),
  deleteQuoteItem: (id) => send('DELETE', '/api/v1/quote-items/' + id),
  insurersPicker: () => get('/api/v1/insurers/picker'),
  createInsurer: (name) => send('POST', '/api/v1/insurers', { name }),

  // Plantillas de mensajes propias del PAS (Slice 6).
  messageTemplates: () => get('/api/v1/message-templates'),
  createMessageTemplate: (data) => send('POST', '/api/v1/message-templates', data),
  updateMessageTemplate: (id, data) => send('PATCH', '/api/v1/message-templates/' + id, data),
  deleteMessageTemplate: (id) => send('DELETE', '/api/v1/message-templates/' + id),
  // Import de asegurados por CSV (Slice 6): rows ya mapeadas por la UI.
  importContacts: (rows) => send('POST', '/api/v1/contacts/import', { rows }),

  updateOrgProfile: (data) => send('PATCH', '/api/v1/org', data),
  deleteAccount: () => send('DELETE', '/api/v1/account'),
  accountExportUrl: () => API + '/api/v1/account/export',
  policiesExportUrl: () => API + '/api/v1/policies/export.csv',
  contactsExportUrl: () => API + '/api/v1/contacts/export.csv',
  policiesSummary: (by = 'ramo') => get('/api/v1/policies/summary?by=' + by),
  insurers: () => get('/api/v1/insurers'),

  // Calendario (jul-2026): month view (lectura) + CRUD de la agenda (escritura).
  calendarMonth: (year, month) => get(`/api/v1/calendar?year=${year}&month=${month}`),
  createCalendarEvent: (data) => send('POST', '/api/v1/calendar/events', data),
  updateCalendarEvent: (id, data) => send('PATCH', `/api/v1/calendar/events/${id}`, data),
  deleteCalendarEvent: (id) => send('DELETE', `/api/v1/calendar/events/${id}`),
  toggleCalendarEvent: (id) => send('POST', `/api/v1/calendar/events/${id}/toggle`),

  // Siniestros — gestión (escritura).
  createClaim: (data) => send('POST', '/api/v1/claims', data),
  claimById: (id) => get('/api/v1/claims/' + id),
  updateClaimStatus: (id, status) => send('PATCH', `/api/v1/claims/${id}/status`, { status }),
  updateClaimImportance: (id, importance) => send('PATCH', `/api/v1/claims/${id}/importance`, { importance }),
  addClaimComment: (id, body) => send('POST', `/api/v1/claims/${id}/comments`, { body }),

  // Contactos — alta (siempre nace prospecto, sin selector de estado).
  createContact: (data) => send('POST', '/api/v1/contacts', data),
  updateContact: (id, data) => send('PATCH', '/api/v1/contacts/' + id, data),

  // Pólizas — editable solo observaciones y forma de pago (el resto se importa).
  updatePolicyNotes: (id, notes) => send('PATCH', `/api/v1/policies/${id}`, { notes }),
  updatePolicy: (id, data) => send('PATCH', `/api/v1/policies/${id}`, data),

  // Aceptación de Términos y Privacidad (Ley 25.326): registro o modal de
  // única vez. Idempotente en el backend.
  acceptTerms: () => send('POST', '/api/v1/me/accept-terms'),

  // ── Slice 4: plan de pagos, endosos, personas, relaciones, direcciones,
  //    responsables y documentos. Lecturas: viajan en policyDetail/contactById.
  generateInstallments: (policyId, data) => send('POST', `/api/v1/policies/${policyId}/installments`, data),
  setInstallmentPaid: (id, paid) => send('PATCH', `/api/v1/installments/${id}`, { paid }),
  clearInstallments: (policyId) => send('DELETE', `/api/v1/policies/${policyId}/installments`),
  createEndorsement: (policyId, data) => send('POST', `/api/v1/policies/${policyId}/endorsements`, data),
  deleteEndorsement: (id) => send('DELETE', `/api/v1/endorsements/${id}`),
  createPolicyParty: (policyId, data) => send('POST', `/api/v1/policies/${policyId}/parties`, data),
  deletePolicyParty: (id) => send('DELETE', `/api/v1/parties/${id}`),
  createRelationship: (contactId, data) => send('POST', `/api/v1/contacts/${contactId}/relationships`, data),
  deleteRelationship: (id) => send('DELETE', `/api/v1/relationships/${id}`),
  createContactAddress: (contactId, data) => send('POST', `/api/v1/contacts/${contactId}/addresses`, data),
  deleteContactAddress: (id) => send('DELETE', `/api/v1/addresses/${id}`),
  orgUsers: () => get('/api/v1/org/users'),
  createAssignee: (contactId, data) => send('POST', `/api/v1/contacts/${contactId}/assignees`, data),
  deleteAssignee: (id) => send('DELETE', `/api/v1/assignees/${id}`),
  // Documentos: multipart (policyId XOR contactId). documentUrl para <a href>.
  uploadDocument: async (file, target) => {
    const fd = new FormData();
    fd.append('file', file);
    if (target.policyId) fd.append('policyId', target.policyId);
    if (target.contactId) fd.append('contactId', target.contactId);
    const r = await fetch(API + '/api/v1/documents/upload', { method: 'POST', credentials: 'include', body: fd });
    if (!r.ok) {
      let msg = `API ${r.status}`;
      try { const j = await r.json(); if (j && j.error) msg = j.error; } catch { /* sin JSON */ }
      const err = new Error(msg); err.status = r.status; throw err;
    }
    return r.json();
  },
  documentUrl: (id) => API + '/api/v1/documents/' + id,
  deleteDocument: (id) => send('DELETE', `/api/v1/documents/${id}`),
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

// Tras una mutación (crear siniestro, cambiar estado/prioridad, comentar, editar
// observaciones, alta de contacto…) re-hidrata RUMBO_DATA desde el BFF y avisa a
// las pantallas montadas (evento 'rumbo-data' → useRumboVersion re-renderiza).
// Fuente única de verdad = la DB; sin merges optimistas por pantalla.
async function rumboRefresh() {
  try {
    await hydrateRumboData();
  } catch (e) {
    console.error('[rumbo] refresh falló:', e.message);
  }
  window.dispatchEvent(new Event('rumbo-data'));
}

Object.assign(window, { rumboApi, hydrateRumboData, rumboRefresh });
