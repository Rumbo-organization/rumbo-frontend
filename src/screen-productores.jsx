/* ============================================================
   RUMBO — Productores (análisis del equipo)
   ============================================================ */
function ScreenProductores({ go }) {
  const { PRODUCTORES } = window.RUMBO_DATA;
  const { ars, arsShort } = window.rumboFmt;

  const annual = (m) => m * 12;
  const ranked = [...PRODUCTORES].sort((a, b) => b.prima - a.prima);
  const maxPrima = Math.max(...ranked.map(p => p.prima), 1);
  const totalPrima = ranked.reduce((a, p) => a + p.prima, 0);
  const totalPol = ranked.reduce((a, p) => a + p.polizas, 0);
  const avgConv = Math.round(ranked.filter(p => p.conversion > 0).reduce((a, p) => a + p.conversion, 0) / ranked.filter(p => p.conversion > 0).length);

  // monthly production sparkline data
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'];
  const prod = [2.1, 2.6, 2.4, 3.0, 3.3, 3.8]; // M$ gestionado
  const maxProd = Math.max(...prod);
  const isMobile = useIsMobile();

  return (
    <div className="scroll rise" style={{ overflowY: 'auto', height: '100%', padding: isMobile ? '18px 16px 40px' : '30px 34px 60px' }}>
      <div style={{ maxWidth: 1180, margin: '0 auto' }}>
        <PageHead eyebrow="Análisis" tick={3} title="Productores"
          sub="Rendimiento del equipo: producción, conversión y cartera por productor."
          actions={<Btn variant="ghost" icon="download">Exportar reporte</Btn>} />

        {/* KPI strip */}
        <Panel pad={false} style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', padding: '18px 0' }}>
            <InfoCell label="Prima anual del equipo" value={arsShort(annual(totalPrima))} tone="var(--ink)" />
            <InfoCell label="Pólizas gestionadas" value={totalPol} />
            <InfoCell label="Conversión promedio" value={`${avgConv}%`} tone="var(--emerald-ink)" />
            <InfoCell label="Productores activos" value={ranked.filter(p => p.polizas > 0).length} />
          </div>
        </Panel>

        <div className="rgrid" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 24, alignItems: 'start' }}>
          {/* ranking */}
          <Panel>
            <SectionHead label="Ranking por prima gestionada" sub="Prima mensual de cartera asignada" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {ranked.map((p, i) => (
                <div key={p.id}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8, flexWrap: 'wrap' }}>
                    <span className="font-mono" style={{ fontSize: 12, color: 'var(--ink-3)', width: 16 }}>{i + 1}</span>
                    <Avatar initials={p.initials} size={34} tone={i === 0 ? 'orange' : 'neutral'} />
                    <div style={{ flex: '1 1 140px', minWidth: 0 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ink)' }}>{p.name}</div>
                      <div style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>{p.role} · {p.polizas} pólizas · {p.conversion}% conv.</div>
                    </div>
                    <div className="font-mono tnum" style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ink)' }}>{p.prima > 0 ? arsShort(p.prima) : '—'}</div>
                  </div>
                  <div style={{ height: 7, borderRadius: 99, background: 'var(--panel-2)', overflow: 'hidden', marginLeft: 28 }}>
                    <div style={{ height: '100%', width: `${(p.prima / maxPrima) * 100}%`, borderRadius: 99, background: i === 0 ? 'var(--orange)' : 'var(--ink-3)', transition: 'width .4s' }} />
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          {/* production chart */}
          <Panel>
            <SectionHead label="Producción mensual" sub="Prima nueva gestionada · 6 meses" action={<Pill tone="emerald" dot>+18% vs. ene</Pill>} />
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 14, height: 180, padding: '12px 0 0' }}>
              {prod.map((v, i) => (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, height: '100%', justifyContent: 'flex-end' }}>
                  <span className="font-mono tnum" style={{ fontSize: 11, color: 'var(--ink-2)', fontWeight: 600 }}>{v}M</span>
                  <div style={{ width: '100%', maxWidth: 42, height: `${(v / maxProd) * 100}%`, borderRadius: '7px 7px 3px 3px', background: i === prod.length - 1 ? 'var(--orange)' : 'var(--orange-soft2)', transition: 'height .4s' }} />
                  <span style={{ fontSize: 11, color: 'var(--ink-3)', fontWeight: 600 }}>{months[i]}</span>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 18, paddingTop: 16, borderTop: '1px solid var(--hair-2)', display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <div className="eyebrow" style={{ marginBottom: 5 }}>Mejor mes</div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>Junio · $ 3,8M</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className="eyebrow" style={{ marginBottom: 5 }}>Promedio</div>
                <div className="font-mono tnum" style={{ fontSize: 14, fontWeight: 600 }}>$ 2,9M</div>
              </div>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { ScreenProductores });

function InfoCell({ label, value, tone }) {
  return (
    <div style={{ flex: '1 1 45%', minWidth: 130, padding: '0 22px 12px', borderRight: '1px solid var(--hair)' }}>
      <div className="eyebrow" style={{ marginBottom: 7 }}>{label}</div>
      <div className="font-display tnum" style={{ fontSize: 24, color: tone || 'var(--ink)' }}>{value}</div>
    </div>
  );
}
