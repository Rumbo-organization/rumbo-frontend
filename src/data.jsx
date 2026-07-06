/* ============================================================
   RUMBO — demo data (Argentine insurance brokerage)
   Builds on the real demo: García Marta, Benítez Jorge,
   Transporte El Litoral SRL, Ferreyra Lucía, San Cristóbal,
   Federación Patronal, etc.
   ============================================================ */

const TODAY = new Date('2026-06-22');

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

// money formatting (AR$)
function ars(n) {
  return '$ ' + n.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function arsShort(n) {
  if (n >= 1e6) return '$ ' + (n / 1e6).toLocaleString('es-AR', { maximumFractionDigits: 1 }) + 'M';
  if (n >= 1e3) return '$ ' + Math.round(n / 1e3) + 'k';
  return '$ ' + n;
}
function daysFrom(dateStr) {
  const d = new Date(dateStr);
  return Math.round((d - TODAY) / 86400000);
}

const CONTACTS = [
  { id: 'c1', name: 'García, Marta', kind: 'Persona', city: 'Córdoba', initials: 'MG', phone: '+54 351 244-1180', since: '2021', tags: ['Cliente'] },
  { id: 'c2', name: 'Benítez, Jorge', kind: 'Persona', city: 'Río Cuarto', initials: 'JB', phone: '+54 358 415-9023', since: '2019', tags: ['Cliente'] },
  { id: 'c3', name: 'Transporte El Litoral SRL', kind: 'Empresa', city: 'Rosario', initials: 'TL', phone: '+54 341 489-7710', since: '2018', tags: ['Cliente', 'Flota'] },
  { id: 'c4', name: 'Ferreyra, Lucía', kind: 'Persona', city: 'Córdoba', initials: 'LF', phone: '+54 351 677-3402', since: '2022', tags: ['Cliente'] },
  { id: 'c5', name: 'Molinos del Centro SA', kind: 'Empresa', city: 'Villa María', initials: 'MC', phone: '+54 353 421-0098', since: '2020', tags: ['Cliente', 'ART'] },
  { id: 'c6', name: 'Sosa, Raúl', kind: 'Persona', city: 'Alta Gracia', initials: 'RS', phone: '+54 351 902-5512', since: '2023', tags: ['Prospecto'] },
];

const INSURERS = ['San Cristóbal', 'Federación Patronal', 'Sancor Seguros', 'La Segunda', 'Mercantil Andina', 'Rivadavia'];

// Policies — vigencia is renewal date
const POLICIES = [
  {
    id: 'p1', num: 'AUT-0048213', contactId: 'c1', client: 'García, Marta',
    insurer: 'San Cristóbal', ramo: 'Automotor', detail: 'Peugeot 208 · AB 442 KQ',
    prima: 184200, freq: 'Mensual', status: 'Vigente', start: '2025-06-28', renew: '2026-06-28',
    coverage: 'Todo riesgo c/ franquicia', sumaAseg: 18400000,
  },
  {
    id: 'p2', num: 'AUT-0051907', contactId: 'c2', client: 'Benítez, Jorge',
    insurer: 'San Cristóbal', ramo: 'Automotor', detail: 'Toyota Hilux SRX · AD 901 LM',
    prima: 289200, freq: 'Mensual', status: 'Vigente', start: '2025-07-06', renew: '2026-07-06',
    coverage: 'Todo riesgo', sumaAseg: 41200000,
  },
  {
    id: 'p3', num: 'COM-0030418', contactId: 'c3', client: 'Transporte El Litoral SRL',
    insurer: 'Federación Patronal', ramo: 'Comercio', detail: 'Depósito y oficinas · Rosario',
    prima: 412800, freq: 'Trimestral', status: 'Vigente', start: '2025-07-19', renew: '2026-07-19',
    coverage: 'Integral de comercio', sumaAseg: 96000000,
  },
  {
    id: 'p4', num: 'HOG-0019655', contactId: 'c4', client: 'Ferreyra, Lucía',
    insurer: 'La Segunda', ramo: 'Hogar', detail: 'Departamento · Nueva Córdoba',
    prima: 61250, freq: 'Mensual', status: 'Vigente', start: '2025-09-09', renew: '2026-09-09',
    coverage: 'Incendio + robo + RC', sumaAseg: 22000000,
  },
  {
    id: 'p5', num: 'ART-0007731', contactId: 'c5', client: 'Molinos del Centro SA',
    insurer: 'Sancor Seguros', ramo: 'ART', detail: '34 empleados · Molienda',
    prima: 968400, freq: 'Mensual', status: 'Vigente', start: '2026-01-15', renew: '2027-01-15',
    coverage: 'ART Ley 24.557', sumaAseg: null,
  },
  {
    id: 'p6', num: 'AUT-0052240', contactId: 'c3', client: 'Transporte El Litoral SRL',
    insurer: 'Mercantil Andina', ramo: 'Automotor', detail: 'Flota · 6 unidades',
    prima: 1240500, freq: 'Mensual', status: 'Vigente', start: '2025-11-02', renew: '2026-11-02',
    coverage: 'Todo riesgo flota', sumaAseg: 184000000,
  },
];

// Vencimientos derived: who renews soon (the "course" waypoints)
const VENCIMIENTOS = [
  { id: 'v1', policyId: 'p1', client: 'García, Marta', insurer: 'San Cristóbal', ramo: 'Automotor', date: '2026-06-28', prima: 184200 },
  { id: 'v2', policyId: 'p2', client: 'Benítez, Jorge', insurer: 'San Cristóbal', ramo: 'Automotor', date: '2026-07-06', prima: 289200 },
  { id: 'v3', policyId: 'p3', client: 'Transporte El Litoral SRL', insurer: 'Federación Patronal', ramo: 'Comercio', date: '2026-07-19', prima: 412800 },
].map(v => ({ ...v, days: daysFrom(v.date) }));

const SINIESTROS = [
  { id: 's1', tipo: 'Granizo', client: 'García, Marta', policyId: 'p1', num: 'SIN-2026-0118', status: 'Abierto', stale: 16, opened: '2026-05-30', insurer: 'San Cristóbal' },
  { id: 's2', tipo: 'Incendio', client: 'Transporte El Litoral SRL', policyId: 'p3', num: 'SIN-2026-0121', status: 'En curso', stale: 3, opened: '2026-06-12', insurer: 'Federación Patronal' },
];

const CUOTAS = [
  { id: 'q1', client: 'Benítez, Jorge', policyId: 'p2', cuota: 3, due: '2026-06-03', amount: 96400, days: daysFrom('2026-06-03') },
  { id: 'q2', client: 'Ferreyra, Lucía', policyId: 'p4', cuota: 2, due: '2026-06-09', amount: 61250, days: daysFrom('2026-06-09') },
];

// Cross-selling opportunities — gaps in each client's coverage
const CROSSSELL = [
  { id: 'x1', client: 'García, Marta', contactId: 'c1', has: ['Automotor'], suggest: 'Hogar', reason: 'Propietaria sin cobertura de vivienda', score: 'Alta' },
  { id: 'x2', client: 'Benítez, Jorge', contactId: 'c2', has: ['Automotor'], suggest: 'Vida', reason: 'Titular 48a, sin seguro de vida', score: 'Media' },
  { id: 'x3', client: 'Molinos del Centro SA', contactId: 'c5', has: ['ART'], suggest: 'Integral', reason: 'Planta sin cobertura de incendio', score: 'Alta' },
];

// Cuotas schedule for a policy (used in detail)
function scheduleFor(policy) {
  const start = new Date(policy.start);
  const n = policy.freq === 'Mensual' ? 12 : policy.freq === 'Trimestral' ? 4 : 1;
  const per = Math.round(policy.prima);
  const rows = [];
  for (let i = 0; i < n; i++) {
    const d = new Date(start);
    if (policy.freq === 'Mensual') d.setMonth(d.getMonth() + i);
    else if (policy.freq === 'Trimestral') d.setMonth(d.getMonth() + i * 3);
    const dd = daysFrom(d.toISOString().slice(0, 10));
    let status = 'Programada';
    if (dd < -2) status = 'Pagada';
    else if (dd < 0) status = 'Vencida';
    else if (dd <= 8) status = 'Por vencer';
    rows.push({ cuota: i + 1, date: d.toISOString().slice(0, 10), amount: per, status, days: dd });
  }
  return rows;
}

// Activity feed for a policy
const ACTIVITY = {
  p1: [
    { when: 'hace 16 días', who: 'Sistema', text: 'Siniestro SIN-2026-0118 (Granizo) sin movimiento', kind: 'alert' },
    { when: 'hace 23 días', who: 'Carolina M.', text: 'Llamado al cliente — confirma daños en techo y capot', kind: 'note' },
    { when: 'hace 24 días', who: 'Carolina M.', text: 'Denuncia de siniestro cargada', kind: 'event' },
    { when: 'hace 3 meses', who: 'San Cristóbal', text: 'Endoso — cambio de uso a particular', kind: 'event' },
  ],
};

// Pipeline comercial de prospectos (kanban por etapa)
const PROSPECTOS = [
  { id: 'pr1', name: 'Sosa, Raúl', stage: 'nuevo', ramo: 'Automotor', city: 'Alta Gracia', estim: 175000, since: 'hace 2 días', initials: 'RS', note: 'Pidió cotización por VW Amarok' },
  { id: 'pr2', name: 'Logística Andina SRL', stage: 'contactado', ramo: 'Comercio', city: 'Córdoba', estim: 520000, since: 'hace 5 días', initials: 'LA', note: 'Reunión agendada para el viernes' },
  { id: 'pr3', name: 'Quiroga, Daniela', stage: 'contactado', ramo: 'Hogar', city: 'Villa Allende', estim: 68000, since: 'hace 1 sem.', initials: 'DQ', note: 'Compara con su banco' },
  { id: 'pr4', name: 'Constructora del Sur SA', stage: 'cotizado', ramo: 'ART', city: 'Río Cuarto', estim: 1240000, since: 'hace 3 días', initials: 'CS', note: '22 empleados · enviada cotización SC' },
  { id: 'pr5', name: 'Peralta, Hernán', stage: 'cotizado', ramo: 'Automotor', city: 'Córdoba', estim: 198000, since: 'hace 4 días', initials: 'HP', note: 'Espera respuesta sobre franquicia' },
  { id: 'pr6', name: 'Distribuidora Centro', stage: 'negociacion', ramo: 'Integral', city: 'Córdoba', estim: 2100000, since: 'hace 6 días', initials: 'DC', note: 'Negociando bonificación por flota' },
];

// Cotizaciones guardadas (lista)
const COTIZACIONES = [
  { id: 'qz1', num: 'COT-2026-0188', client: 'Sosa, Raúl', ramo: 'Automotor', status: 'Enviada', best: 'Rivadavia', monthly: 157400, options: 6, date: '2026-06-20', valid: 8 },
  { id: 'qz2', num: 'COT-2026-0186', client: 'Constructora del Sur SA', ramo: 'ART', status: 'Aceptada', best: 'Sancor Seguros', monthly: 1180000, options: 4, date: '2026-06-18', valid: 0 },
  { id: 'qz3', num: 'COT-2026-0184', client: 'Quiroga, Daniela', ramo: 'Hogar', status: 'Borrador', best: '—', monthly: 0, options: 0, date: '2026-06-17', valid: 15 },
  { id: 'qz4', num: 'COT-2026-0181', client: 'Peralta, Hernán', ramo: 'Automotor', status: 'Enviada', best: 'La Segunda', monthly: 169700, options: 6, date: '2026-06-15', valid: 3 },
  { id: 'qz5', num: 'COT-2026-0177', client: 'García, Marta', ramo: 'Hogar', status: 'Vencida', best: 'Federación Patronal', monthly: 54000, options: 5, date: '2026-05-28', valid: -4 },
];

// Productores / equipo (análisis)
const PRODUCTORES = [
  { id: 'u1', name: 'Carolina Méndez', role: 'Titular', initials: 'CM', polizas: 4, prima: 2126500, conversion: 38, siniestros: 1 },
  { id: 'u2', name: 'Diego Ferrán', role: 'Productor', initials: 'DF', polizas: 2, prima: 1653300, conversion: 31, siniestros: 1 },
  { id: 'u3', name: 'Lucía Otero', role: 'Asistente', initials: 'LO', polizas: 0, prima: 0, conversion: 0, siniestros: 0 },
];

// Audit log
const AUDIT = [
  { id: 'a1', when: 'Hoy 09:14', action: 'Renovó póliza', entity: 'AUT-0048213', detail: 'García, Marta', user: 'Carolina M.', kind: 'event' },
  { id: 'a2', when: 'Hoy 08:52', action: 'Envió cotización', entity: 'COT-2026-0188', detail: 'Sosa, Raúl · 6 opciones', user: 'Carolina M.', kind: 'event' },
  { id: 'a3', when: 'Ayer 18:30', action: 'Cargó siniestro', entity: 'SIN-2026-0121', detail: 'Incendio · Transporte El Litoral', user: 'Diego F.', kind: 'alert' },
  { id: 'a4', when: 'Ayer 16:05', action: 'Movió prospecto', entity: 'Distribuidora Centro', detail: 'Cotizado → Negociación', user: 'Carolina M.', kind: 'note' },
  { id: 'a5', when: 'Ayer 11:20', action: 'Registró pago', entity: 'AUT-0051907 · Cuota 2', detail: 'Benítez, Jorge', user: 'Lucía O.', kind: 'event' },
  { id: 'a6', when: '20 jun 15:48', action: 'Creó contacto', entity: 'Logística Andina SRL', detail: 'Prospecto · Comercio', user: 'Diego F.', kind: 'event' },
  { id: 'a7', when: '20 jun 10:12', action: 'Emitió póliza', entity: 'AUT-0052240', detail: 'Transporte El Litoral · flota', user: 'Carolina M.', kind: 'event' },
  { id: 'a8', when: '19 jun 17:33', action: 'Exportó cartera', entity: 'JSON completo', detail: '6 pólizas · 6 contactos', user: 'Carolina M.', kind: 'note' },
];

const BOOK = {
  primaTotal: POLICIES.reduce((a, p) => a + p.prima, 0),
  vigentes: POLICIES.length,
  contactos: CONTACTS.filter(c => c.tags.includes('Cliente')).length,
  vence30: VENCIMIENTOS.filter(v => v.days <= 30).length,
  siniestros: SINIESTROS.length,
  cuotasVencidas: CUOTAS.length,
  cuotasMonto: CUOTAS.reduce((a, c) => a + c.amount, 0),
  // book health: 0-100 composite
  health: 82,
};

Object.assign(window, {
  RUMBO_DATA: {
    TODAY, CONTACTS, INSURERS, POLICIES, VENCIMIENTOS, SINIESTROS,
    CUOTAS, CROSSSELL, ACTIVITY, BOOK, ramoMeta,
    PROSPECTOS, COTIZACIONES, PRODUCTORES, AUDIT,
  },
  rumboFmt: { ars, arsShort, daysFrom, scheduleFor },
});
