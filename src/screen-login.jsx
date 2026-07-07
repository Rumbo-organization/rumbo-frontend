/* ============================================================
   RUMBO — Login (split-screen de marca, D-025)
   Google OAuth (F-002) como flujo primario + email/password.
   ============================================================ */

function GoogleG({ size = 17 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}

function ScreenLogin({ onAuthed }) {
  const isMobile = useIsMobile();
  const [mode, setMode] = useState('login'); // login | signup
  const [f, setF] = useState({ name: '', email: '', password: '' });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const set = (k, v) => setF(s => ({ ...s, [k]: v }));

  const doGoogle = async () => {
    setErr(null); setBusy(true);
    try { await rumboAuth.signInGoogle(); }
    catch (e) { setErr(e.message); setBusy(false); }
  };

  const doEmail = async (e) => {
    e.preventDefault();
    setErr(null); setBusy(true);
    try {
      if (mode === 'signup') await rumboAuth.signUpEmail(f.name, f.email, f.password);
      else await rumboAuth.signInEmail(f.email, f.password);
      const s = await rumboAuth.getSession();
      if (!s) throw new Error('No se pudo crear la sesión');
      onAuthed(s);
    } catch (e2) { setErr(e2.message); setBusy(false); }
  };

  const label = { fontSize: 12, fontWeight: 600, color: 'var(--ink-2)', marginBottom: 7, display: 'block' };

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--paper)' }}>

      {/* IZQUIERDA — panel de marca (solo desktop; en mobile el form ocupa todo) */}
      {!isMobile && <div style={{
        flex: '1.15 1 0', background: 'var(--paper-2)', borderRight: '1px solid var(--hair)',
        display: 'flex', flexDirection: 'column', padding: '40px 48px', minWidth: 0,
      }}>
        <BrandMark size={34} />

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', maxWidth: 520 }}>
          <div className="tick-row" style={{ marginBottom: 16 }}>
            <Ticks n={7} active={3} />
            <span className="eyebrow">Gestión para Productores Asesores de Seguros</span>
          </div>
          <h1 className="font-display" style={{ fontSize: 44, lineHeight: 1.04, letterSpacing: '-0.03em', color: 'var(--ink)' }}>
            Marcá el rumbo de tu cartera.
          </h1>
          <p style={{ fontSize: 15.5, color: 'var(--ink-2)', marginTop: 14, lineHeight: 1.55 }}>
            Pólizas, vencimientos, siniestros y cotizaciones en un solo cockpit.
            Sin permanencia, con tus datos siempre exportables.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 30 }}>
            {[
              ['calendar', 'Ninguna renovación fuera del radar'],
              ['shield', 'Siniestros con alertas cuando pierden rumbo'],
              ['calc', 'Cotizá y compará todas tus aseguradoras'],
            ].map(([ic, tx]) => (
              <div key={ic} style={{ display: 'flex', alignItems: 'center', gap: 11, fontSize: 13.5, color: 'var(--ink-2)' }}>
                <span style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--panel)', border: '1px solid var(--hair)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'var(--orange-ink)', flexShrink: 0 }}>
                  <Icon name={ic} size={15} stroke={2} />
                </span>
                {tx}
              </div>
            ))}
          </div>
        </div>

        <div style={{ fontSize: 11.5, color: 'var(--ink-3)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Icon name="compass" size={13} style={{ color: 'var(--emerald)' }} />
          © 2026 Rumbo · beta privada
        </div>
      </div>}

      {/* DERECHA — formulario */}
      <div className="scroll" style={{ flex: '1 1 0', display: 'flex', alignItems: isMobile ? 'flex-start' : 'center', justifyContent: 'center', padding: isMobile ? '30px 20px 44px' : 32, overflowY: 'auto' }}>
        <div style={{ width: 380, maxWidth: '100%' }}>
          {isMobile && (
            <div style={{ marginBottom: 8 }}>
              <BrandMark size={30} />
              <div className="tick-row" style={{ margin: '18px 0 20px' }}>
                <Ticks n={7} active={3} />
                <span className="eyebrow">Gestión para PAS</span>
              </div>
            </div>
          )}
          <div className="eyebrow" style={{ marginBottom: 8 }}>{mode === 'signup' ? 'Crear cuenta' : 'Bienvenido de vuelta'}</div>
          <h2 className="font-display" style={{ fontSize: 27, letterSpacing: '-0.02em', marginBottom: 22 }}>
            {mode === 'signup' ? 'Empezá con Rumbo' : 'Iniciá sesión'}
          </h2>

          <button onClick={doGoogle} disabled={busy} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, width: '100%',
            padding: '11px 14px', borderRadius: 10, border: '1px solid var(--hair)', background: 'var(--panel)',
            fontSize: 14, fontWeight: 600, color: 'var(--ink)', boxShadow: 'var(--shadow-sm)',
            opacity: busy ? 0.6 : 1, transition: 'all .14s',
          }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--ink-3)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--hair)'}>
            <GoogleG /> Continuar con Google
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' }}>
            <span style={{ flex: 1, height: 1, background: 'var(--hair-2)' }} />
            <span style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>o con tu email</span>
            <span style={{ flex: 1, height: 1, background: 'var(--hair-2)' }} />
          </div>

          <form onSubmit={doEmail} style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
            {mode === 'signup' && (
              <div>
                <label style={label}>Nombre y apellido</label>
                <input value={f.name} onChange={e => set('name', e.target.value)} required
                  placeholder="Nombre y apellido" style={inputStyle} />
              </div>
            )}
            <div>
              <label style={label}>Email</label>
              <input type="email" value={f.email} onChange={e => set('email', e.target.value)} required
                placeholder="vos@tuestudio.com.ar" style={inputStyle} />
            </div>
            <div>
              <label style={label}>Contraseña</label>
              <input type="password" value={f.password} onChange={e => set('password', e.target.value)} required
                minLength={8} placeholder="Mínimo 8 caracteres" style={inputStyle} />
            </div>

            {err && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '10px 13px', borderRadius: 9, background: 'var(--red-soft)', border: '1px solid var(--red)', fontSize: 12.5, color: 'var(--red-ink)' }}>
                <Icon name="alert" size={15} style={{ flexShrink: 0 }} />{err}
              </div>
            )}

            {/* Btn renderiza <button> sin type → submit por defecto dentro del form */}
            <Btn variant="primary" size="md" iconRight="arrowRight" style={{ width: '100%', opacity: busy ? 0.6 : 1, pointerEvents: busy ? 'none' : 'auto' }}>
              {busy ? 'Un momento…' : mode === 'signup' ? 'Crear cuenta' : 'Entrar'}
            </Btn>
          </form>

          <div style={{ marginTop: 20, fontSize: 13, color: 'var(--ink-2)', textAlign: 'center' }}>
            {mode === 'signup' ? (
              <>¿Ya tenés cuenta?{' '}
                <a href="#" onClick={e => { e.preventDefault(); setErr(null); setMode('login'); }} style={{ color: 'var(--orange-ink)', fontWeight: 600, textDecoration: 'none' }}>Iniciá sesión</a></>
            ) : (
              <>¿Primera vez?{' '}
                <a href="#" onClick={e => { e.preventDefault(); setErr(null); setMode('signup'); }} style={{ color: 'var(--orange-ink)', fontWeight: 600, textDecoration: 'none' }}>Creá tu cuenta</a></>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { ScreenLogin });
