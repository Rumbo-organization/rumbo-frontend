/* ============================================================
   RUMBO — Cross-selling (oportunidades en la cartera)
   ============================================================ */
function ScreenCrossselling({ go }) {
  const isMobile = useIsMobile();
  const { CROSSSELL, CONTACTS, POLICIES, ramoMeta } = window.RUMBO_DATA;
  const { arsShort } = window.rumboFmt;

  // estimate premium for each suggested ramo
  const ESTIM = { Hogar: 720000, Vida: 540000, Integral: 1850000, Automotor: 2100000, ART: 9600000, Comercio: 4200000 };

  const ops = CROSSSELL.map(x => {
    const c = CONTACTS.find(k => k.id === x.contactId);
    return { ...x, contact: c, estim: ESTIM[x.suggest] || 600000 };
  });

  const totalPot = ops.reduce((a, o) => a + o.estim, 0);
  const altas = ops.filter(o => o.score === 'Alta').length;

  // coverage gap matrix
  const RAMOS = ['Automotor', 'Hogar', 'Vida', 'Comercio', 'ART'];
  const clients = CONTACTS.filter(c => c.tags.includes('Cliente'));
  const hasRamo = (cid, ramo) => POLICIES.some(p => p.contactId === cid && p.ramo === ramo);
  const suggestedRamo = (cid, ramo) => CROSSSELL.some(x => x.contactId === cid && x.suggest === ramo);

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
                <div className="font-display tnum" style={{ fontSize: 26, color: 'var(--ink)' }}>{ops.length}</div>
              </div>
            </div>
            <InfoCell label="Prima potencial / año" value={arsShort(totalPot)} tone="var(--emerald-ink)" />
            <InfoCell label="Probabilidad alta" value={`${altas} de ${ops.length}`} />
            <InfoCell label="Clientes alcanzados" value={new Set(ops.map(o => o.contactId)).size} />
          </div>
        </Panel>

        <div className="rgrid" style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 24, alignItems: 'start' }}>
          {/* opportunity cards */}
          <div>
            <SectionHead label="Oportunidades priorizadas" sub="Ordenadas por probabilidad de cierre" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {ops.sort((a, b) => (b.score === 'Alta' ? 1 : 0) - (a.score === 'Alta' ? 1 : 0)).map(o => (
                <div key={o.id} style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 14, padding: 16, background: 'var(--panel)', border: '1px solid var(--hair)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-sm)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Avatar initials={o.contact.initials} size={40} tone="neutral" />
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
                        const has = hasRamo(c.id, r);
                        const sug = suggestedRamo(c.id, r);
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
