/* ============================================================
   RUMBO — shared UI primitives & shell chrome
   ============================================================ */
const { useState, useEffect, useRef, useMemo } = React;

/* ---------- Mobile breakpoint hook ----------
   window.__forceMobile lets us force the mobile layout for design QA
   even on a wide viewport: true/false override, undefined = real matchMedia. */
function useIsMobile() {
  const query = '(max-width: 860px)';
  const compute = () => (typeof window.__forceMobile === 'boolean' ? window.__forceMobile : window.matchMedia(query).matches);
  const [mobile, setMobile] = useState(compute);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const update = () => setMobile(compute());
    mq.addEventListener('change', update);
    window.addEventListener('resize', update);
    window.addEventListener('rumbo-force-mobile', update);
    return () => { mq.removeEventListener('change', update); window.removeEventListener('resize', update); window.removeEventListener('rumbo-force-mobile', update); };
  }, []);
  return mobile;
}

/* ---------- Suscripción a datos del BFF ----------
   Devuelve un contador que se incrementa en cada 'rumbo-data' (lo dispara
   window.rumboRefresh tras una mutación). Una pantalla que lee window.RUMBO_DATA
   lo llama arriba de todo para re-renderizar con los datos frescos de la DB. */
function useRumboVersion() {
  const [v, setV] = useState(0);
  useEffect(() => {
    const h = () => setV(x => x + 1);
    window.addEventListener('rumbo-data', h);
    return () => window.removeEventListener('rumbo-data', h);
  }, []);
  return v;
}

/* ---------- Identidad de la sesión ----------
   Deriva nombre/iniciales/org/rol reales desde window.RUMBO_USER (usuario de la
   sesión, seteado en app.jsx) y window.RUMBO_DATA.ORG/ME (del BFF). Con fallback
   a labels genéricos si todavía no cargó (nunca los nombres demo hardcodeados). */
function rumboIdentity() {
  const u = window.RUMBO_USER || {};
  const d = window.RUMBO_DATA || {};
  const org = d.ORG || {};
  const me = d.ME || {};
  const name = u.name || (u.email ? u.email.split('@')[0] : 'Usuario');
  const initials =
    (name.replace(/,/g, '').split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('') || 'U').toUpperCase();
  return {
    name,
    initials,
    email: u.email || '',
    image: u.image || null,
    orgName: org.name || 'Mi organización',
    matricula: org.matricula || null,
    roleLabel: me.roleLabel || 'Productor',
  };
}

/* ---------- Brand mark ---------- */
/* Con onClick, el logo lleva al inicio (index). Se renderiza como <button> para
   que sea accesible (teclado + foco). */
function BrandMark({ size = 30, onClick }) {
  const inner = (
    <>
      <img
        src="assets/symbol-ondark.png"
        width={size} height={size} alt="Rumbo"
        style={{ objectFit: 'contain', display: 'block' }}
      />
      <span className="font-display" style={{ fontSize: 21, fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--ink)' }}>Rumbo</span>
    </>
  );
  const style = { display: 'flex', alignItems: 'center', gap: 10 };
  if (onClick) {
    return (
      <button type="button" onClick={onClick} aria-label="Ir al inicio"
        style={{ ...style, cursor: 'pointer', background: 'none', border: 'none', padding: 0 }}>
        {inner}
      </button>
    );
  }
  return <div style={style}>{inner}</div>;
}

/* ---------- Badge / pill ---------- */
function Pill({ tone = 'neutral', children, dot = false, style = {} }) {
  const tones = {
    neutral: { bg: 'var(--panel-2)', fg: 'var(--ink-2)', bd: 'var(--hair)' },
    orange: { bg: 'var(--orange-soft)', fg: 'var(--orange-ink)', bd: 'transparent' },
    emerald: { bg: 'var(--emerald-soft)', fg: 'var(--emerald-ink)', bd: 'transparent' },
    red: { bg: 'var(--red-soft)', fg: 'var(--red-ink)', bd: 'transparent' },
    amber: { bg: 'var(--amber-soft)', fg: 'var(--amber-ink)', bd: 'transparent' },
  };
  const t = tones[tone] || tones.neutral;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6, padding: '3px 9px',
      fontSize: 11.5, fontWeight: 600, borderRadius: 99, background: t.bg, color: t.fg,
      border: `1px solid ${t.bd}`, whiteSpace: 'nowrap', lineHeight: 1.3, ...style,
    }}>
      {dot && <span style={{ width: 6, height: 6, borderRadius: 99, background: 'currentColor', flexShrink: 0 }} />}
      {children}
    </span>
  );
}

/* ---------- urgency helpers ---------- */
function urgencyTone(days) {
  if (days <= 7) return 'red';
  if (days <= 14) return 'orange';
  if (days <= 30) return 'amber';
  return 'emerald';
}

/* ---------- Ramo glyph ---------- */
function RamoGlyph({ ramo, size = 34 }) {
  return (
    <span style={{
      width: size, height: size, borderRadius: 9, flexShrink: 0,
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--panel-2)', border: '1px solid var(--hair)', color: 'var(--ink-2)',
    }}>
      <Icon name={ramoIcon[ramo] || 'shield'} size={size * 0.5} stroke={1.9} />
    </span>
  );
}

/* ---------- Avatar ---------- */
function Avatar({ initials, size = 30, tone = 'orange' }) {
  return (
    <span style={{
      width: size, height: size, borderRadius: 8, flexShrink: 0, fontSize: size * 0.38,
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700,
      background: tone === 'orange' ? 'var(--orange)' : 'var(--panel-2)',
      color: tone === 'orange' ? 'var(--paper)' : 'var(--ink-2)',
      border: tone === 'orange' ? 'none' : '1px solid var(--hair)',
      fontFamily: 'var(--font-sans)', letterSpacing: '0.01em',
    }}>{initials}</span>
  );
}

/* ---------- Compass tick ornament (subtle metaphor) ---------- */
function Ticks({ n = 5, active = -1 }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 12 }}>
      {Array.from({ length: n }).map((_, i) => (
        <span key={i} style={{
          width: 2, height: i === Math.floor(n / 2) ? 12 : 7, borderRadius: 2,
          background: i === active ? 'var(--orange)' : 'var(--hair)',
        }} />
      ))}
    </div>
  );
}

/* ---------- Section header ---------- */
function SectionHead({ label, sub, action }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 14, gap: 12 }}>
      <div>
        <div className="eyebrow" style={{ marginBottom: 5 }}>{label}</div>
        {sub && <div style={{ fontSize: 13, color: 'var(--ink-3)' }}>{sub}</div>}
      </div>
      {action}
    </div>
  );
}

/* ---------- Page header (shared across module screens) ---------- */
function PageHead({ eyebrow, title, sub, actions, tick = 3 }) {
  const isMobile = useIsMobile();
  return (
    <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'stretch' : 'flex-start', justifyContent: 'space-between', gap: isMobile ? 16 : 24, marginBottom: isMobile ? 18 : 22 }}>
      <div>
        <div className="tick-row" style={{ marginBottom: 10 }}><Ticks n={7} active={tick} /><span className="eyebrow">{eyebrow}</span></div>
        <h1 className="font-display" style={{ fontSize: isMobile ? 26 : 34, letterSpacing: '-0.03em', color: 'var(--ink)', lineHeight: 1.04 }}>{title}</h1>
        {sub && <p style={{ fontSize: isMobile ? 13 : 14, color: 'var(--ink-2)', marginTop: 6 }}>{sub}</p>}
      </div>
      {actions && <div style={{ display: 'flex', gap: 10, flexShrink: 0, flexWrap: 'wrap' }}>{actions}</div>}
    </div>
  );
}

/* ---------- Segmented control ---------- */
function Segmented({ segs, value, onChange }) {
  return (
    <div className="scroll" style={{ display: 'flex', gap: 4, background: 'var(--panel-2)', border: '1px solid var(--hair)', borderRadius: 10, padding: 4, overflowX: 'auto', maxWidth: '100%' }}>
      {segs.map(s => (
        <button key={s.id} onClick={() => onChange(s.id)} style={{
          display: 'flex', alignItems: 'center', gap: 7, padding: '6px 12px', borderRadius: 7, fontSize: 13, fontWeight: 600,
          color: value === s.id ? 'var(--ink)' : 'var(--ink-3)', background: value === s.id ? 'var(--panel)' : 'transparent',
          boxShadow: value === s.id ? 'var(--shadow-sm)' : 'none', transition: 'all .14s', whiteSpace: 'nowrap', flexShrink: 0,
        }}>
          {s.label}
          {s.n != null && <span className="font-mono tnum" style={{ fontSize: 11, color: 'var(--ink-3)', background: 'var(--paper-2)', padding: '1px 6px', borderRadius: 99 }}>{s.n}</span>}
        </button>
      ))}
    </div>
  );
}

/* ---------- Search box ---------- */
function SearchBox({ q, setQ, placeholder = 'Buscar…', width = 250 }) {
  const isMobile = useIsMobile();
  return (
    <div style={{ marginLeft: isMobile ? 0 : 'auto', display: 'flex', alignItems: 'center', gap: 9, padding: '8px 12px', borderRadius: 9, border: '1px solid var(--hair)', background: 'var(--panel)', width: isMobile ? '100%' : width }}>
      <Icon name="search" size={16} stroke={2} style={{ color: 'var(--ink-3)' }} />
      <input value={q} onChange={e => setQ(e.target.value)} placeholder={placeholder}
        style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: 13, flex: 1, minWidth: 0 }} />
    </div>
  );
}

/* ---------- Mini stat cell (grid) ---------- */
function MiniStat({ label, value, tone, small }) {
  return (
    <div style={{ background: 'var(--panel)', padding: '12px 14px' }}>
      <div className="eyebrow" style={{ marginBottom: 5 }}>{label}</div>
      <div className={small ? 'font-mono' : 'font-mono tnum'} style={{ fontSize: small ? 12 : 17, fontWeight: 600, color: tone || 'var(--ink)' }}>{value}</div>
    </div>
  );
}

/* ---------- Panel ---------- */
function Panel({ children, style = {}, pad = true, className = '' }) {
  return (
    <div className={className} style={{
      background: 'var(--panel)', border: '1px solid var(--hair)', borderRadius: 'var(--radius)',
      padding: pad ? 18 : 0, boxShadow: 'var(--shadow-sm)', ...style,
    }}>{children}</div>
  );
}

/* ---------- Button ---------- */
function Btn({ children, variant = 'ghost', size = 'md', icon, iconRight, onClick, style = {}, title }) {
  const sizes = { sm: { p: '6px 11px', fs: 12.5, gap: 6 }, md: { p: '9px 14px', fs: 13.5, gap: 7 } };
  const s = sizes[size];
  const variants = {
    primary: { background: 'var(--orange)', color: 'var(--paper)', border: '1px solid transparent' },
    solid: { background: 'var(--ink)', color: 'var(--paper)', border: '1px solid transparent' },
    ghost: { background: 'transparent', color: 'var(--ink-2)', border: '1px solid var(--hair)' },
    soft: { background: 'var(--panel-2)', color: 'var(--ink)', border: '1px solid var(--hair)' },
    bare: { background: 'transparent', color: 'var(--ink-2)', border: '1px solid transparent' },
  };
  const [hov, setHov] = useState(false);
  const v = variants[variant];
  return (
    <button title={title} onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: s.gap,
        padding: s.p, fontSize: s.fs, fontWeight: 600, borderRadius: 'var(--radius-sm)',
        transition: 'all .14s ease', whiteSpace: 'nowrap', ...v,
        filter: hov ? 'brightness(0.96)' : 'none',
        transform: hov ? 'translateY(-1px)' : 'none', ...style,
      }}>
      {icon && <Icon name={icon} size={s.fs + 2} stroke={2.1} />}
      {children}
      {iconRight && <Icon name={iconRight} size={s.fs + 1} stroke={2.1} />}
    </button>
  );
}

/* ---------- Left rail ---------- */
const NAV = [
  { id: 'inicio', label: 'Inicio', icon: 'layout' },
  { id: 'contactos', label: 'Asegurados', icon: 'users' },
  { id: 'polizas', label: 'Pólizas', icon: 'scroll' },
  { id: 'cotizaciones', label: 'Cotizaciones', icon: 'calc' },
  { id: 'calendario', label: 'Calendario', icon: 'clock' },
  { id: 'vencimientos', label: 'Vencimientos', icon: 'calendar' },
  { id: 'siniestros', label: 'Siniestros', icon: 'shield' },
  { id: 'crossselling', label: 'Cross-selling', icon: 'sparkles' },
  { id: 'prospectos', label: 'Prospectos', icon: 'kanban' },
  { id: 'productores', label: 'Productores', icon: 'barchart' },
  { id: 'actividad', label: 'Actividad', icon: 'history' },
  { id: 'configuracion', label: 'Configuración', icon: 'settings' },
];

// grouped by category, matching the product's IA
const NAV_GROUPS = [
  { label: null, items: [{ id: 'inicio', label: 'Inicio', icon: 'layout' }] },
  { label: 'Cartera', items: [
    { id: 'contactos', label: 'Asegurados', icon: 'users' },
    { id: 'prospectos', label: 'Prospectos', icon: 'kanban' },
    { id: 'polizas', label: 'Pólizas', icon: 'scroll' },
    { id: 'cotizaciones', label: 'Cotizaciones', icon: 'calc' },
  ] },
  { label: 'Operación', items: [
    { id: 'calendario', label: 'Calendario', icon: 'clock' },
    { id: 'vencimientos', label: 'Vencimientos', icon: 'calendar' },
    { id: 'siniestros', label: 'Siniestros', icon: 'shield' },
  ] },
  { label: 'Análisis', items: [
    { id: 'productores', label: 'Productores', icon: 'barchart' },
    { id: 'crossselling', label: 'Cross-selling', icon: 'sparkles' },
  ] },
  { label: 'Sistema', items: [
    { id: 'actividad', label: 'Actividad', icon: 'history' },
    { id: 'configuracion', label: 'Configuración', icon: 'settings' },
  ] },
];

function Rail({ route, go, dark, setDark }) {
  const base = route.name;
  const activeFor = (id) => base === id
    || (id === 'polizas' && base === 'detail')
    || (id === 'cotizaciones' && base === 'cotizador');
  return (
    <aside style={{
      width: 'var(--rail-w)', flexShrink: 0, height: '100vh', background: 'var(--paper-2)',
      borderRight: '1px solid var(--hair)', display: 'flex', flexDirection: 'column',
      padding: '20px 14px 14px',
    }}>
      <div style={{ padding: '4px 8px 16px' }}><BrandMark onClick={() => go('inicio')} /></div>

      {/* org badge — v0.1 es single-org (F-005). Identidad estática, no switcher:
         sin chevron ni afronto de botón hasta que multi-org llegue en v0.2+. */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 10,
        border: '1px solid var(--hair)', background: 'var(--panel)', width: '100%', marginBottom: 14,
      }}>
        <span style={{ width: 26, height: 26, borderRadius: 7, background: 'var(--ink)', color: 'var(--paper)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon name="building2" size={15} stroke={2} />
        </span>
        <div style={{ flex: 1, minWidth: 0, lineHeight: 1.2 }}>
          <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{rumboIdentity().orgName}</div>
          <div style={{ fontSize: 10.5, color: 'var(--ink-3)' }}>Organización</div>
        </div>
      </div>

      <nav className="scroll" style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1, overflowY: 'auto', marginRight: -6, paddingRight: 6 }}>
        {NAV_GROUPS.map((group, gi) => (
          <div key={group.label || `g${gi}`} style={{ display: 'flex', flexDirection: 'column', gap: 2, marginBottom: group.label ? 8 : 4 }}>
            {group.label && (
              <div className="eyebrow" style={{ padding: '8px 11px 4px', fontSize: 10 }}>{group.label}</div>
            )}
            {group.items.map(item => {
              const active = activeFor(item.id);
              return (
                <button key={item.id} onClick={() => go(item.id)} style={{
                  display: 'flex', alignItems: 'center', gap: 11, padding: '8px 11px', borderRadius: 9,
                  fontSize: 13.5, fontWeight: active ? 600 : 500, textAlign: 'left', position: 'relative',
                  color: active ? 'var(--orange-ink)' : 'var(--ink-2)',
                  background: active ? 'var(--orange-soft)' : 'transparent',
                  transition: 'all .14s ease',
                }}
                  onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'var(--panel-2)'; }}
                  onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
                >
                  {active && <span style={{ position: 'absolute', left: -14, top: 8, bottom: 8, width: 3, borderRadius: 3, background: 'var(--orange)' }} />}
                  <Icon name={item.icon} size={17} stroke={active ? 2.2 : 1.9} />
                  {item.label}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* heading mini-status */}
        <div style={{
          padding: '11px 12px', borderRadius: 10, border: '1px solid var(--hair)',
          background: 'var(--panel)', display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <div style={{ position: 'relative', color: 'var(--emerald)' }}>
            <Icon name="compass" size={22} stroke={1.9} />
          </div>
          <div style={{ lineHeight: 1.25 }}>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ink)' }}>Rumbo despejado</div>
            <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>Salud de cartera {window.RUMBO_DATA?.BOOK?.health ?? 82}</div>
          </div>
        </div>

        <button onClick={() => setDark(!dark)} style={{
          display: 'flex', alignItems: 'center', gap: 11, padding: '9px 11px', borderRadius: 9,
          fontSize: 13.5, fontWeight: 500, color: 'var(--ink-2)', width: '100%',
        }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--panel-2)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
          <Icon name={dark ? 'sun' : 'moon'} size={18} stroke={1.9} />
          {dark ? 'Modo claro' : 'Modo oscuro'}
        </button>

        {(() => {
          const me = rumboIdentity();
          return (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 8px 2px', borderTop: '1px solid var(--hair-2)' }}>
              <Avatar initials={me.initials} size={32} />
              <div style={{ flex: 1, lineHeight: 1.25, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{me.name}</div>
                <div style={{ fontSize: 11, color: 'var(--ink-3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{me.roleLabel}{me.matricula ? ` · Matrícula ${me.matricula}` : ''}</div>
              </div>
            </div>
          );
        })()}
      </div>
    </aside>
  );
}

/* ---------- Top instrument bar ---------- */
function InstrumentBar({ title, crumbs, openPalette, right, isMobile, onMenu }) {
  return (
    <header style={{
      height: isMobile ? 56 : 'var(--bar-h)', flexShrink: 0, borderBottom: '1px solid var(--hair)',
      display: 'flex', alignItems: 'center', gap: isMobile ? 10 : 16, padding: isMobile ? '0 14px' : '0 26px', background: 'var(--paper)',
    }}>
      {isMobile && (
        <button onClick={onMenu} style={{ width: 36, height: 36, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-2)', flexShrink: 0 }}>
          <Icon name="menu" size={20} stroke={1.9} />
        </button>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flex: 1 }}>
        {crumbs ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: isMobile ? 13 : 13.5, color: 'var(--ink-3)', minWidth: 0, overflow: 'hidden' }}>
            {(isMobile ? crumbs.slice(-1) : crumbs).map((c, i, arr) => (
              <React.Fragment key={i}>
                {i > 0 && <Icon name="chevronRight" size={14} style={{ opacity: 0.5, flexShrink: 0 }} />}
                <span onClick={c.onClick} style={{ cursor: c.onClick ? 'pointer' : 'default', color: i === arr.length - 1 ? 'var(--ink)' : 'var(--ink-3)', fontWeight: i === arr.length - 1 ? 600 : 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.label}</span>
              </React.Fragment>
            ))}
          </div>
        ) : <div style={{ fontSize: isMobile ? 15 : 14, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</div>}
      </div>

      {!isMobile && (
        <button onClick={openPalette} style={{
          display: 'none', alignItems: 'center', gap: 9, padding: '8px 12px', borderRadius: 9,
          border: '1px solid var(--hair)', background: 'var(--panel)', color: 'var(--ink-3)',
          fontSize: 13, width: 280, transition: 'all .14s',
        }}
          onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--ink-3)'}
          onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--hair)'}>
          <Icon name="search" size={16} stroke={2} />
          <span style={{ flex: 1, textAlign: 'left' }}>Buscar o ejecutar…</span>
          <kbd style={{
            fontFamily: 'var(--font-mono)', fontSize: 11, padding: '2px 6px', borderRadius: 5,
            background: 'var(--panel-2)', border: '1px solid var(--hair)', color: 'var(--ink-3)',
          }}>⌘K</kbd>
        </button>
      )}

      {right}

      {!isMobile && (
        <button title="Cerrar sesión" aria-label="Cerrar sesión"
          onClick={() => window.rumboAuth?.signOut().finally(() => window.location.reload())}
          style={{ width: 34, height: 34, borderRadius: 9, border: '1px solid var(--hair)', background: 'var(--panel)', color: 'var(--ink-3)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all .14s' }}
          onMouseEnter={e => { e.currentTarget.style.color = 'var(--red-ink)'; e.currentTarget.style.borderColor = 'var(--red)'; }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--ink-3)'; e.currentTarget.style.borderColor = 'var(--hair)'; }}>
          <Icon name="logout" size={16} stroke={1.9} />
        </button>
      )}
    </header>
  );
}

/* ---------- Mobile bottom tab bar ---------- */
const MOBILE_TABS = [
  { id: 'inicio', label: 'Inicio', icon: 'layout' },
  { id: 'polizas', label: 'Pólizas', icon: 'scroll' },
  { id: 'vencimientos', label: 'Vencim.', icon: 'calendar' },
  { id: 'siniestros', label: 'Siniestros', icon: 'shield' },
];

function MobileTabBar({ route, go, onMore }) {
  const base = route.name;
  const activeFor = (id) => base === id || (id === 'polizas' && base === 'detail') || (id === 'cotizaciones' && base === 'cotizador');
  const moreActive = !MOBILE_TABS.some(t => activeFor(t.id));
  return (
    <nav style={{
      position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 40, height: 'var(--tabbar-h)',
      background: 'var(--paper-2)', borderTop: '1px solid var(--hair)',
      display: 'flex', alignItems: 'stretch', paddingBottom: 'env(safe-area-inset-bottom, 0px)',
    }}>
      {MOBILE_TABS.map(t => {
        const active = activeFor(t.id);
        return (
          <button key={t.id} onClick={() => go(t.id)} style={{
            flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3,
            color: active ? 'var(--orange-ink)' : 'var(--ink-3)', paddingTop: 6,
          }}>
            <Icon name={t.icon} size={20} stroke={active ? 2.2 : 1.8} />
            <span style={{ fontSize: 10.5, fontWeight: active ? 700 : 500 }}>{t.label}</span>
          </button>
        );
      })}
      <button onClick={onMore} style={{
        flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3,
        color: moreActive ? 'var(--orange-ink)' : 'var(--ink-3)', paddingTop: 6,
      }}>
        <Icon name="kanban" size={20} stroke={moreActive ? 2.2 : 1.8} />
        <span style={{ fontSize: 10.5, fontWeight: moreActive ? 700 : 500 }}>Más</span>
      </button>
    </nav>
  );
}

/* ---------- Mobile "more" sheet — full grouped nav ---------- */
function MobileMoreSheet({ open, onClose, route, go, dark, setDark }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);
  if (!open) return null;
  const base = route.name;
  const activeFor = (id) => base === id || (id === 'polizas' && base === 'detail') || (id === 'cotizaciones' && base === 'cotizador');
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 75, background: 'oklch(0.2 0.01 50 / 0.42)', backdropFilter: 'blur(3px)', animation: 'rumbo-fade .14s ease' }}>
      <div onClick={e => e.stopPropagation()} style={{
        position: 'absolute', left: 0, right: 0, bottom: 0, maxHeight: '86vh', background: 'var(--paper)',
        borderRadius: '20px 20px 0 0', border: '1px solid var(--hair)', borderBottom: 'none',
        display: 'flex', flexDirection: 'column', animation: 'rumbo-sheet .24s cubic-bezier(0.16,1,0.3,1)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 4px' }}>
          <span style={{ width: 36, height: 4, borderRadius: 99, background: 'var(--hair)' }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 18px 14px', borderBottom: '1px solid var(--hair)' }}>
          <BrandMark size={26} onClick={() => { go('inicio'); onClose(); }} />
        </div>

        {/* org badge — single-org (F-005), identidad estática sin switcher */}
        <div style={{ padding: '14px 18px 4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 11px', borderRadius: 10, border: '1px solid var(--hair)', background: 'var(--panel)', width: '100%' }}>
            <span style={{ width: 26, height: 26, borderRadius: 7, background: 'var(--ink)', color: 'var(--paper)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon name="building2" size={15} stroke={2} />
            </span>
            <div style={{ flex: 1, minWidth: 0, lineHeight: 1.2 }}>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{rumboIdentity().orgName}</div>
              <div style={{ fontSize: 10.5, color: 'var(--ink-3)' }}>Organización</div>
            </div>
          </div>
        </div>

        <div className="scroll" style={{ flex: 1, overflowY: 'auto', padding: '10px 18px 8px' }}>
          {NAV_GROUPS.map((group, gi) => (
            <div key={group.label || `g${gi}`} style={{ marginBottom: 10 }}>
              {group.label && <div className="eyebrow" style={{ padding: '8px 4px 6px' }}>{group.label}</div>}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {group.items.map(item => {
                  const active = activeFor(item.id);
                  return (
                    <button key={item.id} onClick={() => { go(item.id); onClose(); }} style={{
                      display: 'flex', alignItems: 'center', gap: 10, padding: '12px 12px', borderRadius: 11,
                      border: `1px solid ${active ? 'var(--orange)' : 'var(--hair)'}`,
                      background: active ? 'var(--orange-soft)' : 'var(--panel)',
                      color: active ? 'var(--orange-ink)' : 'var(--ink-2)', fontSize: 13, fontWeight: active ? 600 : 500, textAlign: 'left',
                    }}>
                      <Icon name={item.icon} size={17} stroke={active ? 2.2 : 1.9} />{item.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div style={{ padding: '10px 18px', borderTop: '1px solid var(--hair)', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button onClick={() => setDark(!dark)} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '10px 11px', borderRadius: 9, fontSize: 13.5, fontWeight: 500, color: 'var(--ink-2)', background: 'var(--panel-2)' }}>
            <Icon name={dark ? 'sun' : 'moon'} size={18} stroke={1.9} />
            {dark ? 'Modo claro' : 'Modo oscuro'}
          </button>
          {(() => {
            const me = rumboIdentity();
            return (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 4px' }}>
                <Avatar initials={me.initials} size={32} />
                <div style={{ flex: 1, lineHeight: 1.25, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{me.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--ink-3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{me.roleLabel}{me.matricula ? ` · Matrícula ${me.matricula}` : ''}</div>
                </div>
                <button title="Cerrar sesión" aria-label="Cerrar sesión"
                  onClick={() => window.rumboAuth?.signOut().finally(() => window.location.reload())}
                  style={{ width: 34, height: 34, borderRadius: 8, border: '1px solid var(--hair)', background: 'var(--panel)', color: 'var(--ink-3)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon name="logout" size={16} stroke={1.9} />
                </button>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, {
  BrandMark, Pill, RamoGlyph, Avatar, Ticks, SectionHead, Panel, Btn, Rail, InstrumentBar,
  urgencyTone, NAV, NAV_GROUPS, PageHead, Segmented, SearchBox, MiniStat,
  useIsMobile, MobileTabBar, MobileMoreSheet, MOBILE_TABS, rumboIdentity, useRumboVersion,
});
