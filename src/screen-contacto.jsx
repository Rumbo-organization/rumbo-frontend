/* ============================================================
   RUMBO — Ficha del asegurado (client detail 360°)
   Portado del legacy asegurados/[id]. Datos en vivo por id vía
   window.rumboApi.contactById → RLS: un id ajeno devuelve 404, así la ficha
   solo muestra datos de la propia org/cartera (nunca de otro).
   ============================================================ */
function ScreenContacto({ go, params }) {
  const isMobile = useIsMobile();
  const { ars, arsShort, daysFrom } = window.rumboFmt;
  const id = params && params.id;
  const [c, setC] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    if (!id) { setError({ status: 400, message: 'Falta el asegurado.' }); setLoading(false); return; }
    window.rumboApi.contactById(id)
      .then((d) => { if (alive) { setC(d); setLoading(false); } })
      .catch((e) => { if (alive) { setError(e); setLoading(false); } });
    return () => { alive = false; };
  }, [id]);

  if (loading) {
    return (
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-3)' }}>
        <div style={{ textAlign: 'center' }}>
          <Icon name="compass" size={26} stroke={1.8} style={{ color: 'var(--ink-3)' }} />
          <div style={{ fontSize: 13, marginTop: 10 }}>Cargando la ficha…</div>
        </div>
      </div>
    );
  }
  if (error || !c) {
    const notFound = error && error.status === 404;
    return (
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40, color: 'var(--ink-3)' }}>
        <div style={{ textAlign: 'center', maxWidth: 420 }}>
          <Icon name="users" size={26} stroke={1.7} style={{ color: 'var(--ink-3)' }} />
          <div style={{ fontSize: 14, color: 'var(--ink-2)', marginTop: 10 }}>
            {notFound ? 'Asegurado no encontrado en tu cartera.' : (error && error.message) || 'No pudimos cargar la ficha.'}
          </div>
          <Btn size="sm" variant="ghost" onClick={() => go('contactos')} style={{ margin: '14px auto 0' }}>Ver contactos</Btn>
        </div>
      </div>
    );
  }

  const prospecto = c.tags && c.tags.includes('Prospecto');
  const statusTone = c.status === 'Cliente' ? 'emerald' : c.status === 'Prospecto' ? 'amber' : 'neutral';
  const waHref = c.phone ? `https://wa.me/${String(c.phone).replace(/[^0-9]/g, '')}` : null;

  return (
    <div className="scroll rise" style={{ overflowY: 'auto', height: '100%', padding: isMobile ? '18px 16px 40px' : '30px 34px 60px' }}>
      <div style={{ maxWidth: 1180, margin: '0 auto' }}>

        {/* header */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', gap: 16, marginBottom: 22 }}>
          <Avatar initials={c.initials} size={54} tone={prospecto ? 'neutral' : 'orange'} />
          <div style={{ flex: '1 1 240px', minWidth: 0 }}>
            <div className="tick-row" style={{ marginBottom: 8, gap: 8, display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
              <Pill tone="neutral">{c.kind}</Pill>
              <Pill tone={statusTone} dot>{c.status}</Pill>
            </div>
            <h1 className="font-display" style={{ fontSize: isMobile ? 26 : 32, letterSpacing: '-0.02em', color: 'var(--ink)', lineHeight: 1.05 }}>{c.name}</h1>
            <div style={{ fontSize: 13.5, color: 'var(--ink-2)', marginTop: 5 }}>{c.document}{c.since ? ` · desde ${c.since}` : ''}</div>
          </div>
          <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap' }}>
            {waHref && <Btn variant="ghost" icon="whatsapp" onClick={() => window.open(waHref, '_blank')}>WhatsApp</Btn>}
            <Btn variant="ghost" icon="users" onClick={() => go('contactos', { id: c.id })}>En lista</Btn>
          </div>
        </div>

        {/* stat strip */}
        <Panel pad={false} style={{ marginBottom: 24 }}>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: 1, background: 'var(--hair-2)' }}>
            <MiniStat label="Prima anual" value={arsShort(c.stats.primaAnual)} />
            <MiniStat label="Pólizas" value={c.stats.polizas} />
            <MiniStat label="Siniestros" value={c.stats.siniestros} tone={c.stats.siniestros ? 'var(--amber-ink)' : undefined} />
            <MiniStat label="Teléfono" value={c.phone || '—'} small />
          </div>
        </Panel>

        <div className="rgrid" style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.5fr 1fr', gap: 24, alignItems: 'start' }}>
          {/* left */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

            {/* datos */}
            <Panel>
              <SectionHead label="Datos" />
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16, fontSize: 13.5 }}>
                <div>
                  <div className="eyebrow" style={{ marginBottom: 5 }}>Documento</div>
                  <div className="font-mono">{c.document}</div>
                </div>
                <div>
                  <div className="eyebrow" style={{ marginBottom: 5 }}>Ciudad</div>
                  <div>{c.city || '—'}</div>
                </div>
                <div style={{ gridColumn: isMobile ? 'auto' : '1 / -1' }}>
                  <div className="eyebrow" style={{ marginBottom: 5 }}>Domicilio</div>
                  <div style={{ color: c.address ? 'var(--ink)' : 'var(--ink-3)' }}>{c.address || 'Sin domicilio cargado.'}</div>
                </div>
                {c.notes && (
                  <div style={{ gridColumn: isMobile ? 'auto' : '1 / -1' }}>
                    <div className="eyebrow" style={{ marginBottom: 5 }}>Observaciones</div>
                    <div style={{ whiteSpace: 'pre-wrap' }}>{c.notes}</div>
                  </div>
                )}
              </div>
            </Panel>

            {/* pólizas */}
            <Panel>
              <SectionHead label="Pólizas del asegurado" sub={c.polizas.length ? `${c.polizas.length} en cartera` : 'Sin pólizas'} />
              {c.polizas.length === 0 ? (
                <div style={{ padding: '6px 0', fontSize: 13, color: 'var(--ink-3)' }}>Sin pólizas. Oportunidad de primera venta.</div>
              ) : c.polizas.map((p, i) => (
                <div key={p.id} onClick={() => go('detail', { id: p.id })} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 0', borderBottom: i === c.polizas.length - 1 ? 'none' : '1px solid var(--hair-2)', cursor: 'pointer' }}
                  onMouseEnter={e => e.currentTarget.style.opacity = 0.7} onMouseLeave={e => e.currentTarget.style.opacity = 1}>
                  <RamoGlyph ramo={p.ramo} size={32} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{p.ramo} · {p.insurer}</div>
                    <div className="font-mono" style={{ fontSize: 11, color: 'var(--ink-3)' }}>{p.num}</div>
                  </div>
                  <span className="font-mono tnum" style={{ fontSize: 12, color: 'var(--ink-2)' }}>{ars(p.prima)}</span>
                  <Pill tone={urgencyTone(daysFrom(p.renew))} style={{ fontSize: 10 }}>{daysFrom(p.renew) <= 30 ? `${daysFrom(p.renew)}d` : 'Vigente'}</Pill>
                </div>
              ))}
            </Panel>

            {/* siniestros */}
            <Panel>
              <SectionHead label="Siniestros" sub={c.siniestros.length ? `${c.siniestros.length} vinculados` : 'Sin siniestros'} />
              {c.siniestros.length === 0 ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', color: 'var(--emerald-ink)', fontSize: 13.5 }}>
                  <Icon name="check" size={16} /> Sin siniestros. Rumbo despejado.
                </div>
              ) : c.siniestros.map((s, i) => (
                <div key={s.id} onClick={() => go('siniestros')} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 0', borderBottom: i === c.siniestros.length - 1 ? 'none' : '1px solid var(--hair-2)', cursor: 'pointer' }}>
                  <span style={{ width: 32, height: 32, borderRadius: 9, flexShrink: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: s.stale >= 10 ? 'var(--red-soft)' : 'var(--panel-2)', color: s.stale >= 10 ? 'var(--red-ink)' : 'var(--ink-2)', border: '1px solid var(--hair)' }}>
                    <Icon name={s.stale >= 10 ? 'alert' : 'shield'} size={15} stroke={2} />
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{s.tipo}</div>
                    <div className="font-mono" style={{ fontSize: 11, color: 'var(--ink-3)' }}>{s.num}</div>
                  </div>
                  <Pill tone={s.status === 'Abierto' ? 'amber' : s.status === 'Cerrado' ? 'emerald' : 'neutral'}>{s.status}</Pill>
                </div>
              ))}
            </Panel>
          </div>

          {/* right */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

            {/* medios de contacto */}
            <Panel>
              <SectionHead label="Medios de contacto" />
              {(!c.contactMethods || c.contactMethods.length === 0) ? (
                <div style={{ fontSize: 13, color: 'var(--ink-3)' }}>Sin medios de contacto cargados.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {c.contactMethods.map((m, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 }}>
                      <span className="eyebrow" style={{ width: 64, flexShrink: 0 }}>{m.type}</span>
                      <span className="font-mono" style={{ minWidth: 0, wordBreak: 'break-all', color: 'var(--ink)' }}>{m.value}</span>
                      {m.primary && <Pill tone="neutral" style={{ fontSize: 9.5 }}>Principal</Pill>}
                    </div>
                  ))}
                </div>
              )}
            </Panel>

            {/* cross-sell */}
            {c.crosssell && c.crosssell.length > 0 && (
              <Panel>
                <SectionHead label="Cross-selling sugerido" action={<Icon name="sparkles" size={16} style={{ color: 'var(--orange)' }} />} />
                {c.crosssell.map((x, i) => (
                  <div key={x.id || i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: i === c.crosssell.length - 1 ? 'none' : '1px solid var(--hair-2)' }}>
                    <RamoGlyph ramo={x.suggest} size={32} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 600 }}>Seguro de {x.suggest}</div>
                      <div style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>{x.reason}</div>
                    </div>
                    <Pill tone={x.score === 'Alta' ? 'emerald' : 'neutral'} style={{ fontSize: 10 }}>{x.score}</Pill>
                  </div>
                ))}
              </Panel>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { ScreenContacto });
