/* ============================================================
   RUMBO — Pólizas (the book of business)
   ============================================================ */
function ScreenPolizas({ go }) {
  const { POLICIES, VENCIMIENTOS, SINIESTROS = [] } = window.RUMBO_DATA;
  const { ars, arsShort, daysFrom } = window.rumboFmt;
  const [seg, setSeg] = useState('todas');
  const [pay, setPay] = useState('todos');
  const [sort, setSort] = useState({ key: 'renew', dir: 'asc' });
  const [q, setQ] = useState('');

  // Pólizas con siniestro = las referenciadas por algún siniestro del BFF.
  const policiesWithClaim = new Set(SINIESTROS.map(s => s.policyId).filter(Boolean));

  // Formas de pago del filtro: las canónicas (etiquetas del BFF) siempre visibles,
  // más cualquier otra presente en la cartera. Así el filtro es descubrible aunque
  // ninguna póliza tenga forma de pago cargada todavía.
  const PAY_CANON = ['Cupón', 'Débito bancario', 'Tarjeta de crédito'];
  const payExtra = [...new Set(POLICIES.map(p => p.paymentMethod).filter(Boolean))].filter(m => !PAY_CANON.includes(m));
  const payMethods = [...PAY_CANON, ...payExtra];

  const annual = POLICIES.reduce((a, p) => a + p.prima * (p.freq === 'Mensual' ? 12 : p.freq === 'Trimestral' ? 4 : 1), 0);

  const segs = [
    { id: 'todas', label: 'Todas', n: POLICIES.length },
    { id: 'porvencer', label: 'Por vencer (30d)', n: POLICIES.filter(p => daysFrom(p.renew) <= 30).length },
    { id: 'siniestro', label: 'Con siniestro', n: POLICIES.filter(p => policiesWithClaim.has(p.id)).length },
    { id: 'flota', label: 'Flota', n: POLICIES.filter(p => p.detail.toLowerCase().includes('flota')).length },
  ];

  let rows = POLICIES.map(p => ({ ...p, days: daysFrom(p.renew) }));
  if (seg === 'porvencer') rows = rows.filter(p => p.days <= 30);
  if (seg === 'siniestro') rows = rows.filter(p => policiesWithClaim.has(p.id));
  if (seg === 'flota') rows = rows.filter(p => p.detail.toLowerCase().includes('flota'));
  if (pay !== 'todos') rows = rows.filter(p => p.paymentMethod === pay);
  if (q.trim()) {
    const t = q.toLowerCase();
    rows = rows.filter(p => (p.client + p.num + p.insurer + p.ramo + p.detail).toLowerCase().includes(t));
  }
  rows.sort((a, b) => {
    let av = a[sort.key], bv = b[sort.key];
    if (typeof av === 'string') { av = av.toLowerCase(); bv = bv.toLowerCase(); }
    const r = av < bv ? -1 : av > bv ? 1 : 0;
    return sort.dir === 'asc' ? r : -r;
  });

  const Th = ({ k, children, align = 'left', w }) => (
    <th style={{ width: w, textAlign: align, padding: '0 14px 11px', position: 'sticky', top: 0, background: 'var(--panel)', zIndex: 1 }}>
      <button onClick={() => setSort(s => ({ key: k, dir: s.key === k && s.dir === 'asc' ? 'desc' : 'asc' }))}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 5, justifyContent: align === 'right' ? 'flex-end' : 'flex-start' }}
        className="eyebrow">
        {children}
        <Icon name="sort" size={12} style={{ opacity: sort.key === k ? 1 : 0.35, color: sort.key === k ? 'var(--orange)' : 'currentColor' }} />
      </button>
    </th>
  );

  const isMobile = useIsMobile();

  return (
    <div className="scroll rise" style={{ overflowY: 'auto', height: '100%', padding: isMobile ? '18px 16px 40px' : '30px 34px 60px' }}>
      <div style={{ maxWidth: 1240, margin: '0 auto' }}>

        <PageHead eyebrow="Cartera" tick={1} title="Pólizas"
          sub={<><strong className="font-mono tnum" style={{ color: 'var(--ink)' }}>{POLICIES.length}</strong> pólizas vigentes · <strong className="font-mono tnum" style={{ color: 'var(--ink)' }}>{arsShort(annual)}</strong> de prima anual gestionada</>}
          actions={<Btn variant="ghost" icon="download">Exportar</Btn>} />

        {/* toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
          <div className="scroll" style={{ display: 'flex', gap: 4, background: 'var(--panel-2)', border: '1px solid var(--hair)', borderRadius: 10, padding: 4, overflowX: 'auto', maxWidth: '100%' }}>
            {segs.map(s => (
              <button key={s.id} onClick={() => setSeg(s.id)} style={{
                display: 'flex', alignItems: 'center', gap: 7, padding: '6px 12px', borderRadius: 7, fontSize: 13, fontWeight: 600,
                color: seg === s.id ? 'var(--ink)' : 'var(--ink-3)', background: seg === s.id ? 'var(--panel)' : 'transparent',
                boxShadow: seg === s.id ? 'var(--shadow-sm)' : 'none', transition: 'all .14s', whiteSpace: 'nowrap', flexShrink: 0,
              }}>
                {s.label}
                <span className="font-mono tnum" style={{ fontSize: 11, color: 'var(--ink-3)', background: 'var(--paper-2)', padding: '1px 6px', borderRadius: 99 }}>{s.n}</span>
              </button>
            ))}
          </div>
          {payMethods.length > 0 && (
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8, padding: '0 12px', height: 38, borderRadius: 9, border: '1px solid var(--hair)', background: 'var(--panel)', flexShrink: 0 }}>
              <Icon name="filter" size={15} stroke={2} style={{ color: 'var(--ink-3)' }} />
              <select value={pay} onChange={e => setPay(e.target.value)}
                style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: 13, fontWeight: 500, color: 'var(--ink-2)', cursor: 'pointer', appearance: 'none', paddingRight: 4 }}>
                <option value="todos">Toda forma de pago</option>
                {payMethods.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
              <Icon name="chevronDown" size={13} style={{ color: 'var(--ink-3)' }} />
            </div>
          )}
          <div style={{ marginLeft: payMethods.length > 0 ? 0 : 'auto', display: 'flex', alignItems: 'center', gap: 9, padding: '8px 12px', borderRadius: 9, border: '1px solid var(--hair)', background: 'var(--panel)', width: 250, flex: '1 1 220px', maxWidth: 320 }}>
            <Icon name="search" size={16} stroke={2} style={{ color: 'var(--ink-3)' }} />
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Filtrar pólizas…"
              style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: 13, flex: 1, minWidth: 0 }} />
          </div>
        </div>

        {/* table */}
        <Panel pad={false} style={{ overflow: 'hidden' }}>
          <div className="rtable-wrap">
          <table className="rtable" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--hair)' }}>
                <Th k="client">Cliente</Th>
                <Th k="num" w={140}>Póliza</Th>
                <Th k="insurer">Aseguradora</Th>
                <Th k="ramo">Ramo</Th>
                <Th k="prima" align="right" w={130}>Prima</Th>
                <Th k="renew" align="right" w={170}>Renueva</Th>
                <Th k="status" w={110}>Estado</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p, i) => (
                <tr key={p.id} onClick={() => go('detail', { id: p.id })} style={{
                  borderBottom: i === rows.length - 1 ? 'none' : '1px solid var(--hair-2)', cursor: 'pointer', transition: 'background .12s',
                }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--panel-2)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding: 'var(--row-pad) 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                      <Avatar initials={p.client.split(',')[0].slice(0, 2).toUpperCase()} size={32} tone="neutral" />
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ink)', whiteSpace: 'nowrap' }}>{p.client}</div>
                        <div style={{ fontSize: 11.5, color: 'var(--ink-3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 200 }}>{p.detail}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: 'var(--row-pad) 14px' }}><span className="font-mono" style={{ fontSize: 12.5, color: 'var(--ink-2)' }}>{p.num}</span></td>
                  <td style={{ padding: 'var(--row-pad) 14px', fontSize: 13, color: 'var(--ink-2)' }}>{p.insurer}</td>
                  <td style={{ padding: 'var(--row-pad) 14px' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 13, color: 'var(--ink-2)' }}>
                      <Icon name={ramoIcon[p.ramo] || 'shield'} size={15} stroke={1.9} style={{ color: 'var(--ink-3)' }} />{p.ramo}
                    </span>
                  </td>
                  <td style={{ padding: 'var(--row-pad) 14px', textAlign: 'right' }}>
                    <div className="font-mono tnum" style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>{ars(p.prima)}</div>
                    <div style={{ fontSize: 10.5, color: 'var(--ink-3)' }}>{p.freq}</div>
                  </td>
                  <td style={{ padding: 'var(--row-pad) 14px', textAlign: 'right' }}>
                    <div className="font-mono tnum" style={{ fontSize: 12.5, color: 'var(--ink-2)' }}>{p.renew}</div>
                    <div style={{ marginTop: 4, display: 'flex', justifyContent: 'flex-end' }}>
                      <Pill tone={urgencyTone(p.days)} style={{ fontSize: 10 }}>{p.days <= 30 ? `en ${p.days} d` : `${Math.round(p.days / 30)} meses`}</Pill>
                    </div>
                  </td>
                  <td style={{ padding: 'var(--row-pad) 14px' }}><Pill tone="emerald" dot>{p.status}</Pill></td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
          {rows.length === 0 && <div style={{ padding: '50px', textAlign: 'center', color: 'var(--ink-3)', fontSize: 14 }}>No hay pólizas que coincidan con el filtro.</div>}
        </Panel>
      </div>
    </div>
  );
}

Object.assign(window, { ScreenPolizas });
