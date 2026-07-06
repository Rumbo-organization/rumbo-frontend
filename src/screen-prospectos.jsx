/* ============================================================
   RUMBO — Prospectos (pipeline comercial / kanban)
   ============================================================ */
function ScreenProspectos({ go }) {
  const isMobile = useIsMobile();
  const { PROSPECTOS } = window.RUMBO_DATA;
  const { arsShort } = window.rumboFmt;

  const stages = [
    { id: 'nuevo', label: 'Nuevo', tone: 'neutral' },
    { id: 'contactado', label: 'Contactado', tone: 'amber' },
    { id: 'cotizado', label: 'Cotizado', tone: 'orange' },
    { id: 'negociacion', label: 'Negociación', tone: 'emerald' },
  ];
  const dot = { neutral: 'var(--ink-3)', amber: 'var(--amber)', orange: 'var(--orange)', emerald: 'var(--emerald)' };

  const totalPot = PROSPECTOS.reduce((a, p) => a + p.estim, 0);

  return (
    <div className="scroll rise" style={{ overflowY: 'auto', height: '100%', padding: isMobile ? '18px 16px 40px' : '30px 34px 60px' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        <PageHead eyebrow="Cartera · embudo" tick={1} title="Prospectos"
          sub={<>Tu embudo comercial · <strong className="font-mono tnum" style={{ color: 'var(--emerald-ink)' }}>{arsShort(totalPot)}</strong> en prima potencial · movelos de etapa y cerralos como ganados o perdidos</>}
          actions={<><Btn variant="ghost" icon="calc" onClick={() => go('cotizador')}>Cotizar</Btn><Btn variant="primary" icon="plus">Nuevo prospecto</Btn></>} />

        <div className="rgrid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, alignItems: 'start' }}>
          {stages.map(st => {
            const cards = PROSPECTOS.filter(p => p.stage === st.id);
            const sum = cards.reduce((a, c) => a + c.estim, 0);
            return (
              <div key={st.id} style={{ background: 'var(--paper-2)', border: '1px solid var(--hair)', borderRadius: 'var(--radius)', padding: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 99, background: dot[st.tone] }} />
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>{st.label}</span>
                  <span className="font-mono tnum" style={{ fontSize: 11, color: 'var(--ink-3)', background: 'var(--panel)', border: '1px solid var(--hair)', padding: '1px 7px', borderRadius: 99 }}>{cards.length}</span>
                </div>
                <div className="font-mono tnum" style={{ fontSize: 11, color: 'var(--ink-3)', marginBottom: 12, paddingLeft: 16 }}>{arsShort(sum)} potencial</div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {cards.length === 0 && <div style={{ padding: '24px 8px', textAlign: 'center', fontSize: 12, color: 'var(--ink-3)', border: '1px dashed var(--hair)', borderRadius: 10 }}>Soltá un prospecto acá</div>}
                  {cards.map(p => (
                    <div key={p.id} style={{
                      background: 'var(--panel)', border: '1px solid var(--hair)', borderRadius: 11, padding: 13,
                      boxShadow: 'var(--shadow-sm)', cursor: 'grab', transition: 'transform .14s',
                    }}
                      onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                      onMouseLeave={e => e.currentTarget.style.transform = 'none'}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                        <Avatar initials={p.initials} size={30} tone="neutral" />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
                          <div style={{ fontSize: 10.5, color: 'var(--ink-3)' }}>{p.city}</div>
                        </div>
                      </div>
                      <div style={{ fontSize: 11.5, color: 'var(--ink-2)', lineHeight: 1.4, marginBottom: 11, minHeight: 32 }}>{p.note}</div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 10, borderTop: '1px solid var(--hair-2)' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--ink-3)' }}>
                          <Icon name={ramoIcon[p.ramo] || 'shield'} size={13} />{p.ramo}
                        </span>
                        <span className="font-mono tnum" style={{ fontSize: 12, fontWeight: 600, color: 'var(--emerald-ink)' }}>{arsShort(p.estim)}</span>
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
