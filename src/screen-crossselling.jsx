/* ============================================================
   RUMBO — Cross-selling (oportunidades en la cartera)
   ============================================================ */
function ScreenCrossselling({ go }) {
  const isMobile = useIsMobile();
  const { ramoMeta } = window.RUMBO_DATA;
  const { arsShort } = window.rumboFmt;
  // Server-side (Fase 3): ops + matriz de cobertura salen de GET /crosssell
  // (agregados por contacto en SQL, uncapped) — no de las arrays capadas del
  // bootstrap. Refetch tras mutaciones (rumboRefresh → version).
  const version = useRumboVersion();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    window.rumboApi.crosssell({ limit: 100 })
      .then((d) => { if (alive) { setData(d); setLoading(false); } })
      .catch((e) => { if (alive) { setError(e); setLoading(false); } });
    return () => { alive = false; };
  }, [version]);

  // estimate premium for each suggested ramo
  const ESTIM = { Hogar: 720000, Vida: 540000, Integral: 1850000, Automotor: 2100000, ART: 9600000, Comercio: 4200000 };

  if (loading) {
    return (
      <div className="scroll" style={{ overflowY: 'auto', height: '100%', padding: isMobile ? '18px 16px 40px' : '30px 34px 60px' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
          <span className="skel" style={{ display: 'block', width: 320, height: 34 }} />
          <span className="skel" style={{ display: 'block', width: '100%', height: 90, borderRadius: 'var(--radius-lg)' }} />
          <div className="rgrid" style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.3fr 1fr', gap: 24 }}>
            <span className="skel" style={{ display: 'block', width: '100%', height: 300, borderRadius: 'var(--radius-lg)' }} />
            <span className="skel" style={{ display: 'block', width: '100%', height: 300, borderRadius: 'var(--radius-lg)' }} />
          </div>
        </div>
      </div>
    );
  }
  if (error || !data) {
    return (
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40, color: 'var(--ink-3)' }}>
        <div style={{ textAlign: 'center', maxWidth: 420 }}>
          <Icon name="sparkles" size={26} stroke={1.7} style={{ color: 'var(--ink-3)' }} />
          <div style={{ fontSize: 14, color: 'var(--ink-2)', marginTop: 10 }}>{(error && error.message) || 'No pudimos cargar las oportunidades.'}</div>
        </div>
      </div>
    );
  }

  const ops = data.ops.map(x => ({ ...x, estim: ESTIM[x.suggest] || 600000 }));
  // Prima potencial TOTAL (no solo la página): counts.bySuggest × estimación.
  const totalPot = Object.entries(data.counts.bySuggest || {}).reduce((a, [ramo, n]) => a + (ESTIM[ramo] || 600000) * n, 0);
  const altas = data.counts.altas;
  const totalOps = data.total;

  // coverage gap matrix (filas que manda el server: con oportunidad primero)
  const RAMOS = ['Automotor', 'Hogar', 'Vida', 'Comercio', 'ART'];
  const clients = data.matrix;
  const hasRamo = (row, ramo) => row.ramos.includes(ramo);
  const suggestedRamo = (row, ramo) => row.suggest === ramo;

  return (
    <div className="scroll rise" style={{ overflowY: 'auto', height: '100%', padding: isMobile ? '18px 16px 40px' : '30px 34px 60px' }}>
      <div style={{ maxWidth: 1180, margin: '0 auto' }}>
        <PageHead eyebrow="Crecimiento" tick={5} title="Cross-selling"
          sub={<>Gaps de cobertura detectados en tu cartera · <strong className="font-mono tnum" style={{ color: 'var(--emerald-ink)' }}>{arsShort(totalPot)}</strong> de prima potencial</>}
          actions={<Btn variant="primary" icon="sparkles">Generar cotizaciones</Btn>} />

        {/* potential strip */}
        <Panel pad={false} style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', padding: '18px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '0 22px 12px', borderRight: '1px solid var(--hair)', flex: '1 1 45%', minWidth: 160 }}>
              <span style={{ width: 44, height: 44, borderRadius: 11, background: 'var(--orange-soft)', color: 'var(--orange-ink)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon name="sparkles" size={22} />
              </span>
              <div>
                <div className="eyebrow" style={{ marginBottom: 5 }}>Oportunidades</div>
                <div className="font-display tnum" style={{ fontSize: 26, color: 'var(--ink)' }}>{totalOps}</div>
              </div>
            </div>
            <InfoCell label="Prima potencial / año" value={arsShort(totalPot)} tone="var(--emerald-ink)" />
            <InfoCell label="Probabilidad alta" value={`${altas} de ${totalOps}`} />
            <InfoCell label="Clientes alcanzados" value={totalOps} />
          </div>
        </Panel>

        <div className="rgrid" style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 24, alignItems: 'start' }}>
          {/* opportunity cards */}
          <div>
            <SectionHead label="Oportunidades priorizadas"
              sub={ops.length < totalOps ? `Mostrando ${ops.length} de ${totalOps} · ordenadas por probabilidad` : 'Ordenadas por probabilidad de cierre'} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {ops.map(o => (
                <div key={o.id} style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 14, padding: 16, background: 'var(--panel)', border: '1px solid var(--hair)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-sm)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Avatar initials={o.initials} size={40} tone="neutral" />
                    <Icon name="arrowRight" size={16} style={{ color: 'var(--ink-3)' }} />
                    <RamoGlyph ramo={o.suggest} size={40} />
                  </div>
                  <div style={{ flex: '1 1 180px', minWidth: 0 }}>
                    <div style={{ fontSize: 14.5, fontWeight: 600, color: 'var(--ink)' }}>{o.client}</div>
                    <div style={{ fontSize: 12.5, color: 'var(--ink-2)', marginTop: 2 }}>Sumar <strong style={{ color: 'var(--orange-ink)' }}>{o.suggest}</strong> — {o.reason}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="font-mono tnum" style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--emerald-ink)' }}>+{arsShort(o.estim)}</div>
                    <Pill tone={o.score === 'Alta' ? 'emerald' : 'amber'} style={{ fontSize: 10, marginTop: 5 }}>{o.score} prob.</Pill>
                  </div>
                  <Btn size="sm" variant="primary" icon="whatsapp" onClick={() => go('contactos')} style={{ marginLeft: 'auto' }}>Contactar</Btn>
                </div>
              ))}
            </div>
          </div>

          {/* coverage gap matrix */}
          <Panel>
            <SectionHead label="Mapa de cobertura" sub="Qué tiene y qué le falta a cada cliente" />
            <div style={{ overflowX: 'auto' }} className="scroll">
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', padding: '0 8px 10px 0' }}></th>
                    {RAMOS.map(r => (
                      <th key={r} style={{ padding: '0 4px 10px', textAlign: 'center' }}>
                        <Icon name={ramoMeta[r]?.icon || 'shield'} size={15} style={{ color: 'var(--ink-3)' }} />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {clients.map((c, i) => (
                    <tr key={c.id} style={{ borderTop: '1px solid var(--hair-2)' }}>
                      <td style={{ padding: '9px 8px 9px 0', fontSize: 12.5, fontWeight: 600, color: 'var(--ink)', whiteSpace: 'nowrap' }}>{c.name.split(' ')[0].replace(',', '')}</td>
                      {RAMOS.map(r => {
                        const has = hasRamo(c, r);
                        const sug = suggestedRamo(c, r);
                        return (
                          <td key={r} style={{ textAlign: 'center', padding: '9px 4px' }}>
                            {has ? (
                              <span title="Cubierto" style={{ display: 'inline-flex', width: 22, height: 22, borderRadius: 6, background: 'var(--emerald-soft)', color: 'var(--emerald-ink)', alignItems: 'center', justifyContent: 'center' }}><Icon name="check" size={13} stroke={2.6} /></span>
                            ) : sug ? (
                              <span title="Oportunidad" style={{ display: 'inline-flex', width: 22, height: 22, borderRadius: 6, background: 'var(--orange-soft)', color: 'var(--orange-ink)', alignItems: 'center', justifyContent: 'center' }}><Icon name="plus" size={13} stroke={2.6} /></span>
                            ) : (
                              <span style={{ display: 'inline-block', width: 5, height: 5, borderRadius: 99, background: 'var(--hair)' }} />
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ display: 'flex', gap: 16, marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--hair-2)', fontSize: 11.5, color: 'var(--ink-3)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 14, height: 14, borderRadius: 4, background: 'var(--emerald-soft)', color: 'var(--emerald-ink)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="check" size={9} stroke={3} /></span> Cubierto</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 14, height: 14, borderRadius: 4, background: 'var(--orange-soft)', color: 'var(--orange-ink)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="plus" size={9} stroke={3} /></span> Oportunidad</span>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}

function InfoCell({ label, value, tone }) {
  return (
    <div style={{ flex: '1 1 45%', minWidth: 130, padding: '0 22px 12px', borderRight: '1px solid var(--hair)' }}>
      <div className="eyebrow" style={{ marginBottom: 7 }}>{label}</div>
      <div className="font-display tnum" style={{ fontSize: 24, color: tone || 'var(--ink)' }}>{value}</div>
    </div>
  );
}

Object.assign(window, { ScreenCrossselling });
