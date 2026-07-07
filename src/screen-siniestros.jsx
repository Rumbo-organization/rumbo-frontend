/* ============================================================
   RUMBO — Siniestros (seguimiento de denuncias)
   ============================================================ */
function ScreenSiniestros({ go }) {
  const isMobile = useIsMobile();
  useRumboVersion(); // re-render tras crear/gestionar un siniestro
  const { SINIESTROS } = window.RUMBO_DATA;
  const { daysFrom } = window.rumboFmt;

  const all = SINIESTROS;

  const cols = [
    { id: 'Abierto', label: 'Abiertos', tone: 'amber', hint: 'Denuncia cargada, sin gestión' },
    { id: 'En curso', label: 'En curso', tone: 'orange', hint: 'En análisis de la aseguradora' },
    { id: 'Cerrado', label: 'Cerrados', tone: 'emerald', hint: 'Resueltos · últimos 90 días' },
  ];

  const staleCount = all.filter(s => s.stale >= 10).length;

  return (
    <div className="scroll rise" style={{ overflowY: 'auto', height: '100%', padding: isMobile ? '18px 16px 40px' : '30px 34px 60px' }}>
      <div style={{ maxWidth: 1240, margin: '0 auto' }}>
        <PageHead eyebrow="Cartera" tick={4} title="Siniestros"
          sub={<><strong className="font-mono tnum" style={{ color: 'var(--ink)' }}>{all.filter(s=>s.status!=='Cerrado').length}</strong> activos · {staleCount > 0 ? <strong style={{ color: 'var(--red-ink)' }}>{staleCount} perdiendo rumbo</strong> : 'todos al día'}</>}
          actions={<><Btn variant="ghost" icon="download">Exportar</Btn><Btn variant="primary" icon="plus" onClick={() => window.rumboUI?.newSiniestro()}>Reportar siniestro</Btn></>} />

        {/* stale alert banner */}
        {staleCount > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '13px 18px', borderRadius: 'var(--radius)', background: 'var(--red-soft)', border: '1px solid var(--red)', marginBottom: 22 }}>
            <Icon name="alert" size={20} style={{ color: 'var(--red-ink)' }} />
            <div style={{ flex: 1, fontSize: 13.5, color: 'var(--red-ink)' }}>
              <strong>{staleCount} siniestro{staleCount > 1 ? 's' : ''} sin movimiento hace más de 10 días.</strong> Reactivá la gestión antes de que el cliente lo note.
            </div>
            <Btn size="sm" variant="ghost" style={{ borderColor: 'var(--red)', color: 'var(--red-ink)' }}>Ver atrasados</Btn>
          </div>
        )}

        {/* board */}
        <div className="rgrid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, alignItems: 'start' }}>
          {cols.map(col => {
            const cards = all.filter(s => s.status === col.id);
            return (
              <div key={col.id} style={{ background: 'var(--paper-2)', border: '1px solid var(--hair)', borderRadius: 'var(--radius)', padding: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'nowrap' }}>
                  <span style={{ width: 8, height: 8, borderRadius: 99, flexShrink: 0, background: `var(--${col.tone === 'emerald' ? 'emerald' : col.tone === 'orange' ? 'orange' : 'amber'})` }} />
                  <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--ink)', whiteSpace: 'nowrap' }}>{col.label}</span>
                  <span className="font-mono tnum" style={{ fontSize: 11, color: 'var(--ink-3)', background: 'var(--panel)', border: '1px solid var(--hair)', padding: '1px 7px', borderRadius: 99 }}>{cards.length}</span>
                </div>
                <div style={{ fontSize: 11, color: 'var(--ink-3)', marginBottom: 12 }}>{col.hint}</div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {cards.length === 0 && <div style={{ padding: '20px 8px', textAlign: 'center', fontSize: 12.5, color: 'var(--ink-3)' }}>Sin siniestros.</div>}
                  {cards.map(s => {
                    const stale = s.stale >= 10;
                    return (
                      <div key={s.id} onClick={() => window.rumboUI?.openClaim(s.id)} style={{
                        background: 'var(--panel)', border: `1px solid ${stale ? 'var(--red)' : 'var(--hair)'}`, borderRadius: 10, padding: 13, cursor: 'pointer', boxShadow: 'var(--shadow-sm)', transition: 'transform .14s',
                      }}
                        onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                        onMouseLeave={e => e.currentTarget.style.transform = 'none'}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 9 }}>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                              <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>{s.tipo}</span>
                              {s.importance && <Pill tone={s.importance === 'Alta' ? 'red' : s.importance === 'Media' ? 'amber' : 'neutral'} style={{ fontSize: 9.5, padding: '1px 6px' }}>{s.importance}</Pill>}
                            </div>
                            <div className="font-mono" style={{ fontSize: 10.5, color: 'var(--ink-3)', marginTop: 2 }}>{s.num}</div>
                          </div>
                          <RamoGlyph ramo={s.ramo || 'Automotor'} size={30} />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 9, borderTop: '1px solid var(--hair-2)' }}>
                          <Avatar initials={s.client.split(',')[0].slice(0, 2).toUpperCase()} size={24} tone="neutral" />
                          <span style={{ fontSize: 12, color: 'var(--ink-2)', flex: 1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.client}</span>
                        </div>
                        <div style={{ marginTop: 9 }}>
                          {s.status === 'Cerrado'
                            ? <Pill tone="emerald" dot>Resuelto</Pill>
                            : <Pill tone={stale ? 'red' : 'neutral'} dot={stale}>{stale ? `Sin mov. ${s.stale}d` : `Activo ${s.stale}d`}</Pill>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { ScreenSiniestros });
