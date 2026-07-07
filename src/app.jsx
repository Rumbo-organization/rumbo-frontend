/* ============================================================
   RUMBO — app shell, routing, theme + tweaks
   ============================================================ */
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "theme": "light",
  "density": "regular",
  "accent": "#d4622f",
  "monoFigures": true
}/*EDITMODE-END*/;

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [route, setRoute] = useState({ name: 'inicio', params: {} });
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [siniestroOpen, setSiniestroOpen] = useState(false);
  const [contactoOpen, setContactoOpen] = useState(false);
  const [claimId, setClaimId] = useState(null);
  const [toast, setToast] = useState(null);
  const [legal, setLegal] = useState(null);
  const [moreOpen, setMoreOpen] = useState(false);
  const isMobile = useIsMobile();

  const flash = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3200); };

  const dark = t.theme === 'dark';

  // apply theme + density to <html>
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    document.documentElement.setAttribute('data-density', t.density);
  }, [dark, t.density]);

  // keep a DOM-level mirror of isMobile so CSS (not just JS-rendered chrome) can react
  useEffect(() => {
    document.documentElement.setAttribute('data-mobile', isMobile ? 'true' : 'false');
  }, [isMobile]);

  // accent override
  useEffect(() => {
    if (t.accent) {
      document.documentElement.style.setProperty('--orange', t.accent);
    }
  }, [t.accent]);

  // ⌘K
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen(o => !o);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const go = (name, params = {}) => {
    setPaletteOpen(false);
    setMoreOpen(false);
    setRoute({ name, params });
  };

  // expose form openers globally so any screen button can trigger them
  useEffect(() => {
    window.rumboUI = {
      // Pólizas: no se crean a mano (se importan de las aseguradoras). Solo edición.
      newSiniestro: () => setSiniestroOpen(true),
      newContacto: () => setContactoOpen(true),
      openClaim: (id) => setClaimId(id),
      cotizar: () => go('cotizador'),
      legal: (k) => setLegal(k),
      toast: (msg) => flash(msg),
    };
  }, []);

  const setDark = (v) => setTweak('theme', v ? 'dark' : 'light');

  // build chrome per route
  let content, bar;
  const openP = () => setPaletteOpen(true);

  if (route.name === 'inicio') {
    bar = <InstrumentBar title="Inicio" openPalette={openP} isMobile={isMobile} onMenu={() => setMoreOpen(true)} right={<HeadingRight go={go} isMobile={isMobile} />} />;
    content = <ScreenInicio go={go} />;
  } else if (route.name === 'polizas') {
    bar = <InstrumentBar crumbs={[{ label: 'Cartera' }, { label: 'Pólizas' }]} openPalette={openP} isMobile={isMobile} onMenu={() => setMoreOpen(true)} right={<HeadingRight go={go} isMobile={isMobile} />} />;
    content = <ScreenPolizas go={go} />;
  } else if (route.name === 'detail') {
    const p = window.RUMBO_DATA.POLICIES.find(x => x.id === route.params.id) || window.RUMBO_DATA.POLICIES[0];
    bar = <InstrumentBar crumbs={[{ label: 'Pólizas', onClick: () => go('polizas') }, { label: p.num }]} openPalette={openP} isMobile={isMobile} onMenu={() => setMoreOpen(true)} right={<HeadingRight go={go} isMobile={isMobile} />} />;
    content = <ScreenDetail go={go} params={route.params} />;
  } else if (route.name === 'contactos') {
    bar = <InstrumentBar crumbs={[{ label: 'Cartera' }, { label: 'Contactos' }]} openPalette={openP} isMobile={isMobile} onMenu={() => setMoreOpen(true)} right={<HeadingRight go={go} isMobile={isMobile} />} />;
    content = <ScreenContactos go={go} params={route.params} />;
  } else if (route.name === 'contacto') {
    bar = <InstrumentBar crumbs={[{ label: 'Contactos', onClick: () => go('contactos') }, { label: 'Ficha' }]} openPalette={openP} isMobile={isMobile} onMenu={() => setMoreOpen(true)} right={<HeadingRight go={go} isMobile={isMobile} />} />;
    content = <ScreenContacto go={go} params={route.params} />;
  } else if (route.name === 'vencimientos') {
    bar = <InstrumentBar crumbs={[{ label: 'Cartera' }, { label: 'Vencimientos' }]} openPalette={openP} isMobile={isMobile} onMenu={() => setMoreOpen(true)} right={<HeadingRight go={go} isMobile={isMobile} />} />;
    content = <ScreenVencimientos go={go} />;
  } else if (route.name === 'siniestros') {
    bar = <InstrumentBar crumbs={[{ label: 'Cartera' }, { label: 'Siniestros' }]} openPalette={openP} isMobile={isMobile} onMenu={() => setMoreOpen(true)} right={<HeadingRight go={go} isMobile={isMobile} />} />;
    content = <ScreenSiniestros go={go} />;
  } else if (route.name === 'crossselling') {
    bar = <InstrumentBar crumbs={[{ label: 'Análisis' }, { label: 'Cross-selling' }]} openPalette={openP} isMobile={isMobile} onMenu={() => setMoreOpen(true)} right={<HeadingRight go={go} isMobile={isMobile} />} />;
    content = <ScreenCrossselling go={go} />;
  } else if (route.name === 'prospectos') {
    bar = <InstrumentBar crumbs={[{ label: 'Cartera' }, { label: 'Prospectos' }]} openPalette={openP} isMobile={isMobile} onMenu={() => setMoreOpen(true)} right={<HeadingRight go={go} isMobile={isMobile} />} />;
    content = <ScreenProspectos go={go} />;
  } else if (route.name === 'cotizaciones') {
    bar = <InstrumentBar crumbs={[{ label: 'Cartera' }, { label: 'Cotizaciones' }]} openPalette={openP} isMobile={isMobile} onMenu={() => setMoreOpen(true)} right={<HeadingRight go={go} isMobile={isMobile} />} />;
    content = <ScreenCotizaciones go={go} />;
  } else if (route.name === 'productores') {
    bar = <InstrumentBar crumbs={[{ label: 'Análisis' }, { label: 'Productores' }]} openPalette={openP} isMobile={isMobile} onMenu={() => setMoreOpen(true)} right={<HeadingRight go={go} isMobile={isMobile} />} />;
    content = <ScreenProductores go={go} />;
  } else if (route.name === 'actividad') {
    bar = <InstrumentBar crumbs={[{ label: 'Sistema' }, { label: 'Actividad' }]} openPalette={openP} isMobile={isMobile} onMenu={() => setMoreOpen(true)} right={<HeadingRight go={go} isMobile={isMobile} />} />;
    content = <ScreenActividad go={go} />;
  } else if (route.name === 'configuracion') {
    bar = <InstrumentBar crumbs={[{ label: 'Sistema' }, { label: 'Configuración' }]} openPalette={openP} isMobile={isMobile} onMenu={() => setMoreOpen(true)} right={<HeadingRight go={go} isMobile={isMobile} />} />;
    content = <ScreenConfiguracion go={go} dark={dark} setDark={setDark} />;
  } else if (route.name === 'cotizador') {
    bar = <InstrumentBar crumbs={[{ label: 'Herramientas' }, { label: 'Cotizador' }]} openPalette={openP} isMobile={isMobile} onMenu={() => setMoreOpen(true)} right={<HeadingRight go={go} isMobile={isMobile} />} />;
    content = <ScreenCotizador go={go} onEmit={(d) => flash(`Póliza emitida en ${d.insurer} · ${rumboFmt.ars(d.monthly)}/mes`)} />;
  } else if (route.name === 'calendario') {
    bar = <InstrumentBar crumbs={[{ label: 'Operación' }, { label: 'Calendario' }]} openPalette={openP} isMobile={isMobile} onMenu={() => setMoreOpen(true)} right={<HeadingRight go={go} isMobile={isMobile} />} />;
    content = <ScreenCalendario go={go} />;
  } else {
    // fallback placeholder
    bar = <InstrumentBar crumbs={[{ label: NAV.find(n => n.id === route.name)?.label || 'Módulo' }]} openPalette={openP} isMobile={isMobile} onMenu={() => setMoreOpen(true)} right={<HeadingRight go={go} isMobile={isMobile} />} />;
    content = <ModulePlaceholder route={route} go={go} />;
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {!isMobile && <Rail route={route} go={go} dark={dark} setDark={setDark} />}
      <main style={{
        flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, background: 'var(--paper)',
        paddingBottom: isMobile ? 'var(--tabbar-h)' : 0, boxSizing: 'border-box',
      }}>
        {bar}
        <div style={{ flex: 1, minHeight: 0 }}>{content}</div>
        <AppFooter go={go} isMobile={isMobile} />
      </main>

      {isMobile && <MobileTabBar route={route} go={go} onMore={() => setMoreOpen(true)} />}
      {isMobile && <MobileMoreSheet open={moreOpen} onClose={() => setMoreOpen(false)} route={route} go={go} dark={dark} setDark={setDark} />}

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} go={go} />
      <NuevoSiniestroForm open={siniestroOpen} onClose={() => setSiniestroOpen(false)} />
      <NuevoContactoForm open={contactoOpen} onClose={() => setContactoOpen(false)} />
      <ClaimDrawer id={claimId} onClose={() => setClaimId(null)} />
      <Toast msg={toast} />
      <LegalDrawer which={legal} onClose={() => setLegal(null)} />

      <TweaksPanel title="Tweaks">
        <TweakSection label="Tema" />
        <TweakRadio label="Modo" value={t.theme} options={['light', 'dark']} onChange={v => setTweak('theme', v)} />
        <TweakColor label="Acento" value={t.accent}
          options={['#d4622f', '#c2410c', '#b45309', '#0e7490', '#4338ca', '#15803d']}
          onChange={v => setTweak('accent', v)} />
        <TweakSection label="Densidad" />
        <TweakRadio label="Filas" value={t.density} options={['compact', 'regular']} onChange={v => setTweak('density', v)} />
      </TweaksPanel>
    </div>
  );
}

/* top-bar right cluster: notifications + quick actions */
function HeadingRight({ go, isMobile }) {
  if (isMobile) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button title="Notificaciones" style={{ width: 34, height: 34, borderRadius: 9, border: '1px solid var(--hair)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-2)', position: 'relative', background: 'var(--panel)' }}>
          <Icon name="bell" size={16} stroke={1.9} />
          <span style={{ position: 'absolute', top: 7, right: 8, width: 6, height: 6, borderRadius: 99, background: 'var(--orange)', border: '1.5px solid var(--panel)' }} />
        </button>
        <button title="Cotizar" onClick={() => go('cotizador')} style={{ width: 34, height: 34, borderRadius: 9, background: 'var(--orange)', color: 'var(--paper)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="calc" size={17} stroke={2.2} />
        </button>
      </div>
    );
  }
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <button title="Notificaciones" style={{ width: 38, height: 38, borderRadius: 9, border: '1px solid var(--hair)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-2)', position: 'relative', background: 'var(--panel)' }}>
        <Icon name="bell" size={17} stroke={1.9} />
        <span style={{ position: 'absolute', top: 8, right: 9, width: 7, height: 7, borderRadius: 99, background: 'var(--orange)', border: '1.5px solid var(--panel)' }} />
      </button>
      <Btn variant="primary" size="md" icon="calc" onClick={() => go('cotizador')}>Cotizar</Btn>
    </div>
  );
}

/* legal drawer — términos, privacidad, etc. */
function LegalDrawer({ which, onClose }) {
  const CONTENT = {
    terminos: {
      title: 'Términos y Condiciones', eyebrow: 'Legal · última actualización 06/2026',
      body: [
        ['1. Aceptación', 'Al utilizar Rumbo, el usuario acepta estos Términos y Condiciones. Rumbo es una herramienta de gestión para Productores Asesores de Seguros (PAS) matriculados ante la Superintendencia de Seguros de la Nación.'],
        ['2. Alcance del servicio', 'Rumbo provee software de organización de cartera, vencimientos, siniestros y cotizaciones. No emite pólizas ni opera como aseguradora; la relación contractual del riesgo se mantiene entre el asegurado y la compañía.'],
        ['3. Responsabilidad del PAS', 'El productor es responsable del asesoramiento, la veracidad de los datos cargados y el cumplimiento de la normativa vigente (Ley 22.400 y Res. SSN aplicables).'],
        ['4. Disponibilidad', 'El servicio se ofrece "tal cual", en beta privada. Procuramos disponibilidad continua pero no garantizamos la ausencia de interrupciones.'],
        ['5. Modificaciones', 'Podemos actualizar estos términos notificando con razonable antelación dentro de la aplicación.'],
      ],
    },
    privacidad: {
      title: 'Política de Privacidad', eyebrow: 'Legal · Ley 25.326 de Protección de Datos',
      body: [
        ['Datos que tratamos', 'Datos de contacto del PAS y de su cartera (clientes, pólizas, siniestros) cargados por el usuario, con la única finalidad de prestar el servicio.'],
        ['Titularidad', 'Los datos son propiedad del PAS. Rumbo actúa como encargado del tratamiento y no los comercializa ni cede a terceros.'],
        ['Derechos', 'El titular puede acceder, rectificar y suprimir sus datos en cualquier momento desde Configuración → Exportá tus datos, o solicitando la baja de la cuenta.'],
        ['Seguridad', 'Aplicamos cifrado en tránsito y en reposo, y controles de acceso por organización.'],
      ],
    },
    defensa: {
      title: 'Defensa del Asegurado', eyebrow: 'Superintendencia de Seguros de la Nación',
      body: [
        ['Tus derechos', 'Ante un conflicto con una aseguradora, el asegurado puede recurrir al Departamento de Orientación y Asistencia del Asegurado (DOAA) de la SSN.'],
        ['Canales', 'Teléfono gratuito 0800-666-8400 · www.argentina.gob.ar/ssn · Av. Julio A. Roca 721, CABA.'],
        ['Rol de Rumbo', 'Rumbo facilita la gestión documental del reclamo pero no sustituye los canales oficiales de defensa del consumidor de seguros.'],
      ],
    },
  };
  const c = CONTENT[which];
  return (
    <Drawer open={!!which} onClose={onClose} eyebrow={c?.eyebrow} title={c?.title || ''} width={560}
      footer={<Btn variant="primary" icon="check" onClick={onClose}>Entendido</Btn>}>
      {c && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {c.body.map(([h, p], i) => (
            <div key={i}>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)', marginBottom: 6 }}>{h}</div>
              <p style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.6 }}>{p}</p>
            </div>
          ))}
          <p style={{ fontSize: 11.5, color: 'var(--ink-3)', paddingTop: 8, borderTop: '1px solid var(--hair-2)' }}>
            Este texto es una muestra demostrativa y no constituye asesoramiento legal.
          </p>
        </div>
      )}
    </Drawer>
  );
}

/* footer — copyright + legales */
function AppFooter({ go, isMobile }) {
  const links = [
    { label: 'Términos y Condiciones', k: 'terminos' },
    { label: 'Política de Privacidad', k: 'privacidad' },
    { label: 'Defensa del Asegurado', k: 'defensa' },
  ];
  return (
    <footer style={{
      flexShrink: 0, borderTop: '1px solid var(--hair)', background: 'var(--paper)',
      padding: isMobile ? '10px 14px' : '12px 26px', display: 'flex',
      flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'flex-start' : 'center',
      gap: isMobile ? 8 : 16, flexWrap: 'wrap',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 11, color: 'var(--ink-3)' }}>
        <img src="assets/symbol-ondark.png" width={16} height={16} alt="" style={{ objectFit: 'contain', opacity: 0.8 }} />
        <span>© 2026 Rumbo{isMobile ? '' : ` · ${window.RUMBO_DATA?.ORG?.name ?? 'Rumbo'} — Productora Asesora de Seguros`}</span>
      </div>
      <nav style={{ marginLeft: isMobile ? 0 : 'auto', display: 'flex', alignItems: 'center', gap: isMobile ? 12 : 18, flexWrap: 'wrap' }}>
        {links.map(l => (
          <a key={l.k} href="#" onClick={(e) => { e.preventDefault(); window.rumboUI?.legal(l.k); }}
            style={{ fontSize: 11, color: 'var(--ink-3)', textDecoration: 'none', transition: 'color .14s' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--ink)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--ink-3)'}>{l.label}</a>
        ))}
        {!isMobile && window.RUMBO_DATA?.ORG?.matricula && <span className="font-mono" style={{ fontSize: 11, color: 'var(--ink-3)', opacity: 0.7 }}>Matrícula SSN {window.RUMBO_DATA.ORG.matricula}</span>}
      </nav>
    </footer>
  );
}

/* toast */
function Toast({ msg }) {
  if (!msg) return null;
  return (
    <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 90, animation: 'rumbo-rise .3s cubic-bezier(0.16,1,0.3,1)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '12px 18px', borderRadius: 12, background: 'var(--ink)', color: 'var(--paper)', boxShadow: 'var(--shadow-pop)', fontSize: 13.5, fontWeight: 500 }}>
        <span style={{ width: 22, height: 22, borderRadius: 99, background: 'var(--emerald)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon name="check" size={14} stroke={3} style={{ color: '#fff' }} /></span>
        {msg}
      </div>
    </div>
  );
}

/* placeholder for not-yet-built modules — keeps the tool feeling whole */
function ModulePlaceholder({ route, go }) {
  const meta = {
    contactos: { title: 'Asegurados', body: 'Tu base de asegurados y prospectos, con historial y pólizas vinculadas.', icon: 'users' },
    vencimientos: { title: 'Vencimientos', body: 'El calendario completo de renovaciones — cada waypoint de tu cartera en una sola vista.', icon: 'calendar' },
    siniestros: { title: 'Siniestros', body: 'Seguimiento de denuncias activas, con alertas cuando un caso pierde el rumbo.', icon: 'shield' },
    crossselling: { title: 'Cross-selling', body: 'Oportunidades detectadas en tu cartera para sumar coberturas.', icon: 'sparkles' },
  }[route.name] || { title: 'Módulo', body: '', icon: 'compass' };
  return (
    <div className="rise" style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
      <div style={{ textAlign: 'center', maxWidth: 440 }}>
        <div style={{ width: 64, height: 64, borderRadius: 16, margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--panel)', border: '1px solid var(--hair)', color: 'var(--orange)' }}>
          <Icon name={meta.icon} size={28} stroke={1.8} />
        </div>
        <div className="tick-row" style={{ justifyContent: 'center', marginBottom: 12 }}><Ticks n={7} active={3} /></div>
        <h2 className="font-display" style={{ fontSize: 26, letterSpacing: '-0.02em', marginBottom: 8 }}>{meta.title}</h2>
        <p style={{ fontSize: 14, color: 'var(--ink-2)', lineHeight: 1.5, marginBottom: 22 }}>{meta.body}</p>
        <Btn variant="ghost" iconRight="arrowRight" onClick={() => go('inicio')} style={{ margin: '0 auto' }}>Volver al inicio</Btn>
      </div>
    </div>
  );
}

/* splash mientras se resuelve la sesión */
function BootSplash() {
  return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--paper)' }}>
      <div style={{ animation: 'rumbo-pop .3s ease' }}><BrandMark size={36} /></div>
    </div>
  );
}

/* pantalla de error de carga de datos: en vez de mostrar el demo en silencio
   (que se confunde con "no tengo mi organización"), decimos qué falló y damos
   reintentar. `demo` deja entrar con los datos estáticos a propósito. */
function DataLoadError({ message, onRetry }) {
  return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--paper)', padding: 24 }}>
      <div style={{ maxWidth: 460, textAlign: 'center' }}>
        <div style={{ marginBottom: 18 }}><BrandMark size={32} /></div>
        <h2 className="font-display" style={{ fontSize: 22, letterSpacing: '-0.02em', marginBottom: 10 }}>No pudimos cargar tu cartera</h2>
        <p style={{ fontSize: 13.5, color: 'var(--ink-2)', lineHeight: 1.5, marginBottom: 20 }}>{message}</p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <Btn variant="primary" icon="refresh" onClick={onRetry}>Reintentar</Btn>
        </div>
      </div>
    </div>
  );
}

/* gate de sesión: splash → login → (carga de datos) → cockpit */
function Root() {
  const [session, setSession] = useState(undefined); // undefined=cargando, null=sin sesión
  const [phase, setPhase] = useState('loading');      // loading | ready | error | demo
  const [error, setError] = useState(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    rumboAuth.getSession().then(s => setSession(s ?? null)).catch(() => setSession(null));
  }, []);

  // Con sesión, hidratar window.RUMBO_DATA desde el BFF antes de montar el
  // cockpit. Si el fetch falla NO caemos al demo en silencio: mostramos el error
  // (la causa más común es cookie vieja pre-migración → 401, o el proxy de Vite
  // caído). El usuario reintenta o entra al demo explícitamente.
  useEffect(() => {
    if (!session) return;
    let alive = true;
    setPhase('loading');
    // Exponer el usuario de la sesión para el chrome (rail, sheet, footer).
    window.RUMBO_USER = session.user ?? session;
    hydrateRumboData()
      .then(() => { if (alive) setPhase('ready'); })
      .catch(err => {
        console.error('[rumbo] no se pudo hidratar el BFF:', err.message);
        if (alive) { setError(err); setPhase('error'); }
      });
    return () => { alive = false; };
  }, [session, attempt]);

  if (session === undefined) return <BootSplash />;
  if (!session) return <ScreenLogin onAuthed={setSession} />;
  if (phase === 'loading') return <BootSplash />;
  if (phase === 'error') {
    const msg = error?.status === 401 || error?.status === 403
      ? 'Tu sesión no es válida para esta cuenta (suele ser una cookie vieja de antes de la migración). Cerrá sesión / borrá las cookies de localhost y volvé a entrar.'
      : (error?.message || 'Error desconocido al contactar la API.');
    return (
      <DataLoadError
        message={msg}
        onRetry={() => setAttempt(a => a + 1)}
      />
    );
  }
  return <App />; // 'ready' — datos reales del BFF (ya no hay modo demo)
}

ReactDOM.createRoot(document.getElementById('root')).render(<Root />);
