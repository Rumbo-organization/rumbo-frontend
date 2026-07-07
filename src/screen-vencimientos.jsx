/* ============================================================
   RUMBO — Vencimientos (todos los waypoints de la cartera)
   ============================================================ */
function ScreenVencimientos({ go }) {
  const isMobile = useIsMobile();
  const { POLICIES } = window.RUMBO_DATA;
  const { ars, arsShort, daysFrom } = window.rumboFmt;
  const [seg, setSeg] = useState('todos');
  const [pay, setPay] = useState('Todas las formas');
  const PAY_OPTIONS = ['Todas las formas', 'Cupón', 'Débito bancario', 'Tarjeta de crédito', 'Sin especificar'];

  const MES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  const MESL = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

  let items = POLICIES.map(p => ({ ...p, days: daysFrom(p.renew), d: new Date(p.renew) }))
    .sort((a, b) => a.days - b.days);

  if (seg === '30') items = items.filter(p => p.days <= 30);
  if (seg === '90') items = items.filter(p => p.days <= 90);
  // Forma de pago (del BFF; null = "Sin especificar"). Útil para separar débito
  // automático (renueva solo) de cupón (requiere gestión de cobro).
  if (pay !== 'Todas las formas') items = items.filter(p => (p.paymentMethod || 'Sin especificar') === pay);

  const segs = [
    { id: '30', label: 'Próximos 30 días', n: POLICIES.filter(p => daysFrom(p.renew) <= 30).length },
    { id: '90', label: '90 días', n: POLICIES.filter(p => daysFrom(p.renew) <= 90).length },
    { id: 'todos', label: 'Todo el año', n: POLICIES.length },
  ];

  // group by year-month
  const groups = [];
  items.forEach(p => {
    const key = `${p.d.getFullYear()}-${p.d.getMonth()}`;
    let g = groups.find(x => x.key === key);
    if (!g) { g = { key, year: p.d.getFullYear(), month: p.d.getMonth(), items: [] }; groups.push(g); }
    g.items.push(p);
  });

  const totalPrima = items.reduce((a, p) => a + p.prima, 0);

  return (
    <div className="scroll rise" style={{ overflowY: 'auto', height: '100%', padding: isMobile ? '18px 16px 40px' : '30px 34px 60px' }}>
      <div style={{ maxWidth: 1080, margin: '0 auto' }}>
        <PageHead eyebrow="El rumbo · timeline" tick={3} title="Vencimientos"
          sub={<>Cada renovación es un waypoint. <strong className="font-mono tnum" style={{ color: 'var(--ink)' }}>{items.length}</strong> por delante · <strong className="font-mono tnum" style={{ color: 'var(--ink)' }}>{arsShort(totalPrima)}</strong> en prima a renovar</>}
          actions={<><Btn variant="ghost" icon="download">Exportar</Btn><Btn variant="primary" icon="bell">Recordatorios</Btn></>} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 22, flexWrap: 'wrap' }}>
          <Segmented segs={segs} value={seg} onChange={setSeg} />
          <div style={{ minWidth: 200 }}><SelectInput value={pay} onChange={setPay} options={PAY_OPTIONS} /></div>
        </div>

        {/* timeline */}
        <div style={{ position: 'relative' }}>
          {/* the course spine */}
          <div style={{ position: 'absolute', left: isMobile ? 39 : 71, top: 10, bottom: 10, width: 2, background: 'linear-gradient(var(--hair), var(--hair-2))' }} />

          {groups.map((g) => (
            <div key={g.key} style={{ marginBottom: 8 }}>
              {/* month marker */}
              <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 10 : 18, marginBottom: 4, marginTop: 14 }}>
                <div style={{ width: isMobile ? 40 : 54, textAlign: 'right', flexShrink: 0 }}>
                  <div className="font-display" style={{ fontSize: isMobile ? 16 : 20, lineHeight: 1, color: 'var(--ink)' }}>{MES[g.month]}</div>
                  <div className="font-mono" style={{ fontSize: 10, color: 'var(--ink-3)' }}>{g.year}</div>
                </div>
                <div style={{ width: 14, height: 14, borderRadius: 99, background: 'var(--panel)', border: '2px solid var(--ink-3)', flexShrink: 0, zIndex: 2 }} />
                <div style={{ flex: 1, height: 1, background: 'var(--hair-2)' }} />
                {!isMobile && <span className="eyebrow">{MESL[g.month]} · {g.items.length} {g.items.length === 1 ? 'póliza' : 'pólizas'}</span>}
              </div>

              {/* waypoints */}
              <div style={{ paddingLeft: isMobile ? 50 : 90 }}>
                {g.items.map((p) => {
                  const tone = urgencyTone(p.days);
                  const dotColor = { red: 'var(--red)', orange: 'var(--orange)', amber: 'var(--amber)', emerald: 'var(--emerald)' }[tone];
                  if (isMobile) {
                    return (
                      <div key={p.id} onClick={() => go('detail', { id: p.id })} style={{
                        padding: 13, margin: '8px 0', background: 'var(--panel)', border: '1px solid var(--hair)',
                        borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-sm)', cursor: 'pointer', position: 'relative',
                      }}>
                        <span style={{ position: 'absolute', left: -22, top: 20, width: 9, height: 9, borderRadius: 99, background: dotColor, zIndex: 2, boxShadow: '0 0 0 3px var(--paper)' }} />
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 9 }}>
                          <RamoGlyph ramo={p.ramo} size={32} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ink)' }}>{p.client}</div>
                            <div className="font-mono" style={{ fontSize: 11, color: 'var(--ink-3)' }}>{p.insurer} · {p.ramo}</div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                          <Pill tone={tone} dot>{p.days <= 0 ? 'Vencida' : `en ${p.days} d`}</Pill>
                          <span className="font-mono tnum" style={{ fontSize: 12, color: 'var(--ink-2)' }}>{ars(p.prima)}</span>
                        </div>
                      </div>
                    );
                  }
                  return (
                    <div key={p.id} onClick={() => go('detail', { id: p.id })} style={{
                      display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', margin: '8px 0',
                      background: 'var(--panel)', border: '1px solid var(--hair)', borderRadius: 'var(--radius)',
                      boxShadow: 'var(--shadow-sm)', cursor: 'pointer', position: 'relative', transition: 'transform .14s, border-color .14s',
                    }}
                      onMouseEnter={e => { e.currentTarget.style.transform = 'translateX(3px)'; e.currentTarget.style.borderColor = dotColor; }}
                      onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.borderColor = 'var(--hair)'; }}>
                      {/* connector dot onto spine */}
                      <span style={{ position: 'absolute', left: -25, top: '50%', marginTop: -5, width: 10, height: 10, borderRadius: 99, background: dotColor, zIndex: 2, boxShadow: '0 0 0 3px var(--paper)' }} />
                      <RamoGlyph ramo={p.ramo} size={38} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>{p.client}</div>
                        <div className="font-mono" style={{ fontSize: 11.5, color: 'var(--ink-3)', marginTop: 2 }}>{p.num} · {p.insurer} · {p.ramo}{p.paymentMethod ? ` · ${p.paymentMethod}` : ''}</div>
                      </div>
                      <div style={{ textAlign: 'right', width: 130 }}>
                        <div className="font-mono tnum" style={{ fontSize: 12.5, color: 'var(--ink-2)' }}>{p.renew}</div>
                        <div className="font-mono tnum" style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>{ars(p.prima)}</div>
                      </div>
                      <Pill tone={tone} dot style={{ width: 96, justifyContent: 'center' }}>{p.days <= 0 ? 'Vencida' : `en ${p.days} d`}</Pill>
                      <Btn size="sm" variant="ghost" iconRight="refresh" onClick={(e) => { e.stopPropagation(); go('detail', { id: p.id }); }}>Renovar</Btn>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* horizon end-cap */}
          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 10 : 18, marginTop: 14 }}>
            <div style={{ width: isMobile ? 40 : 54 }} />
            <div style={{ width: 14, height: 14, borderRadius: 99, background: 'var(--paper)', border: '2px dashed var(--hair)', flexShrink: 0, zIndex: 2 }} />
            <span className="eyebrow" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Icon name="flag" size={13} style={{ color: 'var(--emerald)' }} /> Horizonte despejado</span>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { ScreenVencimientos });
