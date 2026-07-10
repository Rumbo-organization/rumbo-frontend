/* ============================================================
   RUMBO — formato + metadatos de ramo (SIN datos demo)
   El cockpit se hidrata 100% desde el BFF (api-client.js →
   window.RUMBO_DATA). Este módulo ya NO trae cartera de ejemplo:
   solo aporta helpers de formato (rumboFmt) + el mapa de íconos
   por ramo, y un esqueleto vacío para no reventar si una pantalla
   se renderiza antes de la hidratación.
   ============================================================ */

const ramoMeta = {
  Automotor: { icon: 'car' },
  Comercio: { icon: 'store' },
  Hogar: { icon: 'home' },
  Vida: { icon: 'heart' },
  ART: { icon: 'hardhat' },
  Caución: { icon: 'shield' },
  Integral: { icon: 'building' },
  Accidentes: { icon: 'cross' },
};

// "Hoy" real: lo publica el BFF en RUMBO_DATA.TODAY (Date). Fallback a ahora si
// todavía no hidrató. Antes esto era una constante fija (2026-06-22) del demo.
function today() {
  const t = window.RUMBO_DATA && window.RUMBO_DATA.TODAY;
  return t instanceof Date ? t : new Date();
}

// money formatting (AR$)
function ars(n) {
  return '$ ' + Number(n || 0).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function arsShort(n) {
  n = Number(n || 0);
  if (n >= 1e6) return '$ ' + (n / 1e6).toLocaleString('es-AR', { maximumFractionDigits: 1 }) + 'M';
  if (n >= 1e3) return '$ ' + Math.round(n / 1e3) + 'k';
  return '$ ' + n;
}
function daysFrom(dateStr) {
  const d = new Date(dateStr);
  return Math.round((d - today()) / 86400000);
}

// Cronograma de cuotas proyectado desde los términos reales de la póliza
// (prima / frecuencia / inicio del BFF). No es dato demo: es una derivación de
// campos de la DB mientras el BFF no exponga el plan de cuotas real por póliza.
function scheduleFor(policy) {
  const start = new Date(policy.start);
  const n = policy.freq === 'Mensual' ? 12 : policy.freq === 'Trimestral' ? 4 : policy.freq === 'Semestral' ? 2 : 1;
  const per = Math.round(policy.prima || 0);
  const rows = [];
  for (let i = 0; i < n; i++) {
    const d = new Date(start);
    if (policy.freq === 'Mensual') d.setMonth(d.getMonth() + i);
    else if (policy.freq === 'Trimestral') d.setMonth(d.getMonth() + i * 3);
    else if (policy.freq === 'Semestral') d.setMonth(d.getMonth() + i * 6);
    else d.setFullYear(d.getFullYear() + i);
    const dd = daysFrom(d.toISOString().slice(0, 10));
    let status = 'Programada';
    if (dd < -2) status = 'Pagada';
    else if (dd < 0) status = 'Vencida';
    else if (dd <= 8) status = 'Por vencer';
    rows.push({ cuota: i + 1, date: d.toISOString().slice(0, 10), amount: per, status, days: dd });
  }
  return rows;
}

// Esqueleto vacío: lo reemplaza hydrateRumboData() con los datos reales del BFF
// tras el login. Sin cartera de ejemplo — si el fetch falla, se muestra el error
// (app.jsx), nunca datos ficticios.
const EMPTY_DATA = {
  TODAY: new Date(),
  CONTACTS: [],
  INSURERS: [],
  POLICIES: [],
  VENCIMIENTOS: [],
  SINIESTROS: [],
  CUOTAS: [],
  CROSSSELL: [],
  ACTIVITY: {},
  PROSPECTOS: [],
  COTIZACIONES: [],
  PRODUCTORES: [],
  AUDIT: [],
  BOOK: {
    primaTotal: 0,
    vigentes: 0,
    contactos: 0,
    vence30: 0,
    siniestros: 0,
    cuotasVencidas: 0,
    cuotasMonto: 0,
    health: 0,
  },
  ramoMeta,
};

Object.assign(window, {
  RUMBO_DATA: EMPTY_DATA,
  rumboFmt: { ars, arsShort, daysFrom, scheduleFor },
});
