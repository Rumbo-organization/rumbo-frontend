/* ============================================================
   RUMBO — Prospectos (pipeline comercial / kanban)
   Server-side (Slice 2): GET /prospectos (uncapped) + mover de etapa /
   cerrar ganado→asegurado / perdido→ex asegurado (advanceProspect).
   ============================================================ */
function ScreenProspectos({ go }) {
  const isMobile = useIsMobile();
  const version = useRumboVersion();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reload, setReload] = useState(0);
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    window.rumboApi.prospectos()
      .then((d) => { if (alive) { setRows(d.data); setLoading(false); } })
      .catch((e) => { if (alive) { setError(e); setLoading(false); } });
    return () => { alive = false; };
  }, [version, reload]);

  const stages = [
    { id: 'nuevo', label: 'Nuevo', tone: 'neutral' },
    { id: 'contactado', label: 'Contactado', tone: 'amber' },
    { id: 'cotizado', label: 'Cotizado', tone: 'orange' },
    { id: 'negociacion', label: 'Negociación', tone: 'emerald' },
  ];
  const dot = { neutral: 'var(--ink-3)', amber: 'var(--amber)', orange: 'var(--orange)', emerald: 'var(--emerald)' };
  const nextOf = (stage) => {
    const i = stages.findIndex(s => s.id === stage);
    return i >= 0 && i < stages.length - 1 ? stages[i + 1] : null;
  };

  const move = (p, to, msg) => {
    if (busyId) return;
    setBusyId(p.id);
    window.rumboApi.advanceProspect(p.id, to)
      .then(() => { window.rumboUI?.toast?.(msg); setReload(r => r + 1); })
      .catch((e) => window.rumboUI?.toast?.(e.message))
      .finally(() => setBusyId(null));
  };

  const actBtn = (label, title, onClick, tone) => (
    <button title={title} onClick={onClick} style={{
      fontSize: 10.5, fontWeight: 700, padding: '3px 8px', borderRadius: 7, cursor: 'pointer',
      border: '1px solid var(--hair)', background: 'var(--panel-2)',
      color: tone === 'ok' ? 'var(--emerald-ink)' : tone === 'bad' ? 'var(--red-ink)' : 'var(--ink-2)',
    }}>{label}</button>
  );

  return (
    <div className="scroll rise" style={{ overflowY: 'auto', height: '100%', padding: isMobile ? '18px 16px 40px' : '30px 34px 60px' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        <PageHead eyebrow="Cartera · embudo" tick={1} title="Prospectos"
          sub={<>Tu embudo comercial · <strong className="font-mono tnum" style={{ color: 'var(--ink)' }}>{rows.length}</strong> en pipeline · movelos de etapa y cerralos como ganados o perdidos</>}
          actions={<><Btn variant="ghost" icon="calc" onClick={() => go('cotizador')}>Cotizar</Btn><Btn variant="primary" icon="plus" onClick={() => window.rumboUI?.newContacto?.()}>Nuevo prospecto</Btn></>} />

        {error && <div style={{ padding: '14px 18px', borderRadius: 'var(--radius)', background: 'var(--red-soft)', border: '1px solid var(--red)', fontSize: 13, color: 'var(--red-ink)', marginBottom: 18 }}>{error.message}</div>}

        <div className="rgrid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, alignItems: 'start' }}>
          {stages.map(st => {
            const cards = rows.filter(p => p.stage === st.id);
            const next = nextOf(st.id);
            return (
              <div key={st.id} style={{ background: 'var(--paper-2)', border: '1px solid var(--hair)', borderRadius: 'var(--radius)', padding: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 99, background: dot[st.tone] }} />
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>{st.label}</span>
                  <span className="font-mono tnum" style={{ fontSize: 11, color: 'var(--ink-3)', background: 'var(--panel)', border: '1px solid var(--hair)', padding: '1px 7px', borderRadius: 99 }}>{cards.length}</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {loading && <span className="skel" style={{ display: 'block', width: '100%', height: 120, borderRadius: 11 }} />}
                  {!loading && cards.length === 0 && <div style={{ padding: '24px 8px', textAlign: 'center', fontSize: 12, color: 'var(--ink-3)', border: '1px dashed var(--hair)', borderRadius: 10 }}>Sin prospectos en esta etapa.</div>}
                  {!loading && cards.map(p => (
                    <div key={p.id} style={{
                      background: 'var(--panel)', border: '1px solid var(--hair)', borderRadius: 11, padding: 13,
                      boxShadow: 'var(--shadow-sm)', opacity: busyId === p.id ? 0.5 : 1, transition: 'transform .14s, opacity .14s',
                    }}
                      onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                      onMouseLeave={e => e.currentTarget.style.transform = 'none'}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, cursor: 'pointer' }} onClick={() => go('contacto', { id: p.id })}>
                        <Avatar initials={p.initials} size={30} tone="neutral" />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
                          <div style={{ fontSize: 10.5, color: 'var(--ink-3)' }}>{p.city} · {p.since}</div>
                        </div>
                      </div>
                      {p.note && <div style={{ fontSize: 11.5, color: 'var(--ink-2)', lineHeight: 1.4, marginBottom: 11 }}>{p.note}</div>}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 10, borderTop: '1px solid var(--hair-2)', gap: 6, flexWrap: 'wrap' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--ink-3)' }}>
                          <Icon name={ramoIcon[p.ramo] || 'shield'} size={13} />{p.ramo}
                        </span>
                        <div style={{ display: 'flex', gap: 5 }}>
                          {next && actBtn(`→ ${next.label}`, `Pasar a ${next.label}`, () => move(p, next.id, `${p.name} pasó a ${next.label}`))}
                          {actBtn('✓', 'Cerrar ganado (pasa a asegurado)', () => move(p, 'ganado', `${p.name} ganado: ya es asegurado`), 'ok')}
                          {actBtn('✕', 'Cerrar perdido (pasa a ex asegurado)', () => move(p, 'perdido', `${p.name} marcado como perdido`), 'bad')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { ScreenProspectos });
