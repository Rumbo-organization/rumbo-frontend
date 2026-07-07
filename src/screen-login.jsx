/* ============================================================
   RUMBO — Login (split-screen de marca, D-025)
   Izquierda: panel de marca naranja (gradiente + grilla) fijo en ambos temas.
   Derecha: formulario theme-aware (oscuro en dark, crema en light).
   Google OAuth (F-002) + email/password. Email-first.
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

/* Lockup de marca en blanco — para el panel naranja (símbolo blanco + wordmark). */
function BrandWhite({ size = 30 }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
      <img src="assets/symbol-white.png" width={size} height={size} alt="Rumbo"
        style={{ objectFit: 'contain', display: 'block' }} />
      <span className="font-display" style={{ fontSize: 21, fontWeight: 800, letterSpacing: '-0.03em', color: '#fff' }}>Rumbo</span>
    </div>
  );
}

function ScreenLogin({ onAuthed }) {
  const isMobile = useIsMobile();
  const [mode, setMode] = useState('login'); // login | signup
  const [f, setF] = useState({ name: '', email: '', password: '' });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const [note, setNote] = useState(null); // hint neutral (ej: reset asistido)
  const set = (k, v) => setF(s => ({ ...s, [k]: v }));

  const doGoogle = async () => {
    setErr(null); setNote(null); setBusy(true);
    try { await rumboAuth.signInGoogle(); }
    catch (e) { setErr(e.message); setBusy(false); }
  };

  const doEmail = async (e) => {
    e.preventDefault();
    setErr(null); setNote(null); setBusy(true);
    try {
      if (mode === 'signup') await rumboAuth.signUpEmail(f.name, f.email, f.password);
      else await rumboAuth.signInEmail(f.email, f.password);
      const s = await rumboAuth.getSession();
      if (!s) throw new Error('No se pudo crear la sesión');
      onAuthed(s);
    } catch (e2) { setErr(e2.message); setBusy(false); }
  };

  const label = { fontSize: 12.5, fontWeight: 600, color: 'var(--ink)', marginBottom: 7, display: 'block' };
  const signup = mode === 'signup';

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--paper)' }}>

      {/* IZQUIERDA — panel de marca naranja (solo desktop) */}
      {!isMobile && (
        <div style={{
          flex: '1.1 1 0', position: 'relative', overflow: 'hidden', minWidth: 0,
          background: 'radial-gradient(130% 130% at 78% 8%, oklch(0.66 0.185 48) 0%, oklch(0.54 0.195 35) 46%, oklch(0.44 0.165 30) 100%)',
          display: 'flex', flexDirection: 'column', padding: '44px 52px', color: '#fff',
        }}>
          {/* grilla técnica, se desvanece hacia abajo/izquierda */}
          <div aria-hidden="true" style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            backgroundImage: 'linear-gradient(oklch(1 0 0 / 0.07) 1px, transparent 1px), linear-gradient(90deg, oklch(1 0 0 / 0.07) 1px, transparent 1px)',
            backgroundSize: '56px 56px',
            WebkitMaskImage: 'radial-gradient(120% 105% at 72% 0%, #000 28%, transparent 100%)',
            maskImage: 'radial-gradient(120% 105% at 72% 0%, #000 28%, transparent 100%)',
          }} />

          <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
            <BrandWhite size={34} />

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', maxWidth: 500 }}>
              <h1 className="font-display" style={{ fontSize: 46, lineHeight: 1.04, letterSpacing: '-0.03em', color: '#fff' }}>
                Marcá el rumbo<br />de tu cartera.
              </h1>
              <p style={{ fontSize: 16, color: 'oklch(1 0 0 / 0.82)', marginTop: 20, lineHeight: 1.55, maxWidth: 420 }}>
                El sistema para Productores Asesores de Seguros: asegurados, pólizas,
                vencimientos y siniestros en un solo lugar.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                'Precios transparentes, sin letra chica',
                'Sin permanencia',
                'Tus datos, siempre exportables',
              ].map((tx) => (
                <div key={tx} style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 14.5, color: 'oklch(1 0 0 / 0.92)' }}>
                  <span style={{ width: 26, height: 26, borderRadius: 99, background: 'oklch(1 0 0 / 0.15)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon name="check" size={14} stroke={2.6} />
                  </span>
                  {tx}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* DERECHA — formulario (theme-aware) */}
      <div className="scroll" style={{ flex: '1 1 0', display: 'flex', alignItems: isMobile ? 'flex-start' : 'center', justifyContent: 'center', padding: isMobile ? '30px 20px 44px' : 40, overflowY: 'auto' }}>
        <div style={{ width: 384, maxWidth: '100%' }}>
          {isMobile && (
            <div style={{ marginBottom: 22 }}><BrandMark size={30} /></div>
          )}

          <h2 className="font-display" style={{ fontSize: 30, letterSpacing: '-0.02em', color: 'var(--ink)' }}>
            {signup ? 'Crear cuenta' : 'Ingresar'}
          </h2>
          <p style={{ fontSize: 14, color: 'var(--ink-3)', marginTop: 6, marginBottom: 26 }}>
            {signup ? 'Empezá con Rumbo en un minuto.' : 'Accedé a tu cartera.'}
          </p>

          <form onSubmit={doEmail} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {signup && (
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
                minLength={8} placeholder={signup ? 'Mínimo 8 caracteres' : '••••••••'} style={inputStyle} />
              {!signup && (
                <div style={{ textAlign: 'right', marginTop: 8 }}>
                  <a href="#" onClick={e => { e.preventDefault(); setErr(null); setNote('Por ahora el reset es asistido: escribinos a hola@rumbo.app y te la restablecemos.'); }}
                    style={{ fontSize: 12.5, color: 'var(--orange-ink)', fontWeight: 600, textDecoration: 'none' }}>¿La olvidaste?</a>
                </div>
              )}
            </div>

            {err && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '10px 13px', borderRadius: 9, background: 'var(--red-soft)', border: '1px solid var(--red)', fontSize: 12.5, color: 'var(--red-ink)' }}>
                <Icon name="alert" size={15} style={{ flexShrink: 0 }} />{err}
              </div>
            )}
            {note && (
              <div style={{ padding: '10px 13px', borderRadius: 9, background: 'var(--panel-2)', border: '1px solid var(--hair)', fontSize: 12.5, color: 'var(--ink-2)', lineHeight: 1.45 }}>
                {note}
              </div>
            )}

            {/* Btn renderiza <button> sin type → submit por defecto dentro del form */}
            <Btn variant="primary" size="md" style={{ width: '100%', justifyContent: 'center', opacity: busy ? 0.6 : 1, pointerEvents: busy ? 'none' : 'auto' }}>
              {busy ? 'Un momento…' : signup ? 'Crear cuenta' : 'Ingresar'}
            </Btn>
          </form>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '22px 0' }}>
            <span style={{ flex: 1, height: 1, background: 'var(--hair-2)' }} />
            <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>o</span>
            <span style={{ flex: 1, height: 1, background: 'var(--hair-2)' }} />
          </div>

          <button onClick={doGoogle} disabled={busy} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, width: '100%',
            padding: '12px 14px', borderRadius: 10, border: '1px solid var(--hair)', background: 'var(--panel)',
            fontSize: 14, fontWeight: 600, color: 'var(--ink)', boxShadow: 'var(--shadow-sm)',
            opacity: busy ? 0.6 : 1, transition: 'all .14s',
          }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--ink-3)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--hair)'}>
            <GoogleG /> Continuar con Google
          </button>

          <div style={{ marginTop: 24, fontSize: 13.5, color: 'var(--ink-2)', textAlign: 'center' }}>
            {signup ? (
              <>¿Ya tenés cuenta?{' '}
                <a href="#" onClick={e => { e.preventDefault(); setErr(null); setNote(null); setMode('login'); }} style={{ color: 'var(--orange-ink)', fontWeight: 600, textDecoration: 'none' }}>Ingresá</a></>
            ) : (
              <>¿No tenés cuenta?{' '}
                <a href="#" onClick={e => { e.preventDefault(); setErr(null); setNote(null); setMode('signup'); }} style={{ color: 'var(--orange-ink)', fontWeight: 600, textDecoration: 'none' }}>Registrate</a></>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { ScreenLogin });
