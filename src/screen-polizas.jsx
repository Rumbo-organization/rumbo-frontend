/* ============================================================
   RUMBO — Pólizas (the book of business)
   Fase 1 escalabilidad: la lista se pagina server-side vía
   window.rumboApi.policiesPage (búsqueda/filtro/orden en SQL). Ya no lee la
   array capada del bootstrap. Ver roadmap/PLAN-ESCALABILIDAD.md.
   ============================================================ */
const POLIZAS_LIMIT = 50;
const PAY_OPTIONS = [
  ['cupon', 'Cupón'],
  ['debito_bancario', 'Débito bancario'],
  ['tarjeta_credito', 'Tarjeta de crédito'],
];

function ScreenPolizas({ go }) {
  const { ars, daysFrom } = window.rumboFmt;
  const isMobile = useIsMobile();

  const [seg, setSeg] = useState('todas');
  const [pay, setPay] = useState(''); // '' = toda forma de pago
  const [producer, setProducer] = useState(''); // '' = todos (visible si la org tiene >1)
  const PRODUCTORES_LIST = window.RUMBO_DATA?.PRODUCTORES ?? [];
  // Vista Resumen (Slice 5): agrupado por ramo/estado con subtotales de premio.
  // TanStack Query: solo consulta con el panel abierto (enabled).
  const [showSummary, setShowSummary] = useState(false);
  const [summaryBy, setSummaryBy] = useState('ramo');
  const summaryQ = useApiQuery(['policies-summary', summaryBy], () => window.rumboApi.policiesSummary(summaryBy), {
    enabled: showSummary,
  });
  const summary = summaryQ.data ?? null;
  const [sort, setSort] = useState({ key: 'renew', dir: 'asc' });
  const [q, setQ] = useState('');
  const [qDebounced, setQDebounced] = useState('');
  const [offset, setOffset] = useState(0);

  // Debounce de la búsqueda (evita un request por tecla) + vuelve a la pág. 1.
  useEffect(() => {
    const t = setTimeout(() => {
      setQDebounced(q.trim());
      setOffset(0);
    }, 300);
    return () => clearTimeout(t);
  }, [q]);

  // Página actual server-side vía TanStack Query: cache por combinación de
  // filtros, keepPrevious sin flash al paginar. rumboRefresh() invalida.
  const listQ = useApiQuery(
    ['policies', { q: qDebounced, seg, pay, producer, sort: sort.key, dir: sort.dir, offset }],
    () =>
      window.rumboApi.policiesPage({
        q: qDebounced,
        seg: seg === 'todas' ? '' : seg,
        pay,
        producer,
        sort: sort.key,
        dir: sort.dir,
        limit: POLIZAS_LIMIT,
        offset,
      }),
    { keepPrevious: true },
  );
  const data = listQ.data?.data ?? [];
  const total = listQ.data?.total ?? 0;
  const loading = listQ.isPending;
  const error = listQ.error;

  const setFilter = fn => {
    fn();
    setOffset(0);
  };
  const changeSort = k =>
    setFilter(() => setSort(s => ({ key: k, dir: s.key === k && s.dir === 'asc' ? 'desc' : 'asc' })));

  const segs = [
    { id: 'todas', label: 'Todas' },
    { id: 'porvencer', label: 'Por vencer (30d)' },
    { id: 'siniestro', label: 'Con siniestro' },
    { id: 'flota', label: 'Flota' },
  ];

  const from = total === 0 ? 0 : offset + 1;
  const to = Math.min(offset + POLIZAS_LIMIT, total);

  const Th = ({ k, children, align = 'left', w }) => (
    <th
      style={{
        width: w,
        textAlign: align,
        padding: '0 14px 11px',
        position: 'sticky',
        top: 0,
        background: 'var(--panel)',
        zIndex: 1,
      }}
    >
      <button
        onClick={() => changeSort(k)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 5,
          justifyContent: align === 'right' ? 'flex-end' : 'flex-start',
        }}
        className="eyebrow"
      >
        {children}
        <Icon
          name="sort"
          size={12}
          style={{ opacity: sort.key === k ? 1 : 0.35, color: sort.key === k ? 'var(--orange)' : 'currentColor' }}
        />
      </button>
    </th>
  );

  return (
    <div
      className="scroll rise"
      style={{ overflowY: 'auto', height: '100%', padding: isMobile ? '18px 16px 40px' : '30px 34px 60px' }}
    >
      <div style={{ maxWidth: 1240, margin: '0 auto' }}>
        <PageHead
          eyebrow="Cartera"
          tick={1}
          title="Pólizas"
          sub={
            <>
              <strong className="font-mono tnum" style={{ color: 'var(--ink)' }}>
                {total.toLocaleString('es-AR')}
              </strong>{' '}
              pólizas {seg !== 'todas' || pay || qDebounced ? 'en el filtro actual' : 'en tu cartera'}
            </>
          }
          actions={
            <>
              <Btn variant="ghost" icon="barchart" onClick={() => setShowSummary(v => !v)}>
                {showSummary ? 'Listado' : 'Resumen'}
              </Btn>
              <Btn
                variant="ghost"
                icon="download"
                onClick={() => window.open(window.rumboApi.policiesExportUrl(), '_blank')}
              >
                Exportar
              </Btn>
            </>
          }
        />

        {/* vista Resumen (Slice 5): subtotales por ramo o estado, uncapped */}
        {showSummary && (
          <Panel style={{ marginBottom: 24 }}>
            <SectionHead
              label="Resumen de cartera"
              sub="Cantidad y premio anual por grupo"
              action={
                <div
                  style={{
                    display: 'flex',
                    gap: 4,
                    background: 'var(--panel-2)',
                    border: '1px solid var(--hair)',
                    borderRadius: 9,
                    padding: 3,
                  }}
                >
                  {[
                    ['ramo', 'Por ramo'],
                    ['estado', 'Por estado'],
                  ].map(([v, l]) => (
                    <button
                      key={v}
                      onClick={() => setSummaryBy(v)}
                      style={{
                        padding: '4px 10px',
                        borderRadius: 6,
                        fontSize: 12,
                        fontWeight: 600,
                        color: summaryBy === v ? 'var(--ink)' : 'var(--ink-3)',
                        background: summaryBy === v ? 'var(--panel)' : 'transparent',
                      }}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              }
            />
            {!summary ? (
              <span className="skel" style={{ display: 'block', width: '100%', height: 120, borderRadius: 10 }} />
            ) : summary.data.length === 0 ? (
              <div style={{ fontSize: 13, color: 'var(--ink-3)' }}>Sin pólizas.</div>
            ) : (
              (() => {
                const totPremio = summary.data.reduce((a, r) => a + r.premio, 0);
                const totCount = summary.data.reduce((a, r) => a + r.count, 0);
                const max = Math.max(...summary.data.map(r => r.premio), 1);
                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {summary.data.map(r => (
                      <div key={r.key}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 5 }}>
                          <span style={{ fontSize: 13, fontWeight: 600, flex: 1 }}>{r.label}</span>
                          <span className="font-mono tnum" style={{ fontSize: 12, color: 'var(--ink-3)' }}>
                            {r.count.toLocaleString('es-AR')} pól.
                          </span>
                          <span
                            className="font-mono tnum"
                            style={{ fontSize: 12.5, fontWeight: 600, width: 120, textAlign: 'right' }}
                          >
                            {ars(r.premio)}
                          </span>
                        </div>
                        <div style={{ height: 6, borderRadius: 99, background: 'var(--panel-2)', overflow: 'hidden' }}>
                          <div
                            style={{
                              height: '100%',
                              width: `${(r.premio / max) * 100}%`,
                              borderRadius: 99,
                              background: 'var(--orange)',
                            }}
                          />
                        </div>
                      </div>
                    ))}
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        paddingTop: 10,
                        borderTop: '1px solid var(--hair-2)',
                        fontSize: 12.5,
                      }}
                    >
                      <span style={{ color: 'var(--ink-3)' }}>Total</span>
                      <span className="font-mono tnum" style={{ fontWeight: 700 }}>
                        {totCount.toLocaleString('es-AR')} pólizas · {ars(totPremio)}
                      </span>
                    </div>
                  </div>
                );
              })()
            )}
          </Panel>
        )}

        {/* toolbar */}
        {!showSummary && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
              <div
                className="scroll"
                style={{
                  display: 'flex',
                  gap: 4,
                  background: 'var(--panel-2)',
                  border: '1px solid var(--hair)',
                  borderRadius: 10,
                  padding: 4,
                  overflowX: 'auto',
                  maxWidth: '100%',
                }}
              >
                {segs.map(s => (
                  <button
                    key={s.id}
                    onClick={() => setFilter(() => setSeg(s.id))}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 7,
                      padding: '6px 12px',
                      borderRadius: 7,
                      fontSize: 13,
                      fontWeight: 600,
                      color: seg === s.id ? 'var(--ink)' : 'var(--ink-3)',
                      background: seg === s.id ? 'var(--panel)' : 'transparent',
                      boxShadow: seg === s.id ? 'var(--shadow-sm)' : 'none',
                      transition: 'all .14s',
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                    }}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
              <div
                style={{
                  marginLeft: isMobile ? 0 : 'auto',
                  width: isMobile ? '100%' : undefined,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '0 12px',
                  height: 38,
                  borderRadius: 9,
                  border: '1px solid var(--hair)',
                  background: 'var(--panel)',
                  flexShrink: 0,
                }}
              >
                <Icon name="filter" size={15} stroke={2} style={{ color: 'var(--ink-3)' }} />
                <select
                  value={pay}
                  onChange={e => setFilter(() => setPay(e.target.value))}
                  style={{
                    border: 'none',
                    outline: 'none',
                    background: 'transparent',
                    fontSize: 13,
                    fontWeight: 500,
                    color: 'var(--ink-2)',
                    cursor: 'pointer',
                    appearance: 'none',
                    paddingRight: 4,
                    flex: 1,
                    minWidth: 0,
                  }}
                >
                  <option value="">Toda forma de pago</option>
                  {PAY_OPTIONS.map(([v, l]) => (
                    <option key={v} value={v}>
                      {l}
                    </option>
                  ))}
                </select>
                <Icon name="chevronDown" size={13} style={{ color: 'var(--ink-3)' }} />
              </div>
              {PRODUCTORES_LIST.length > 1 && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '0 12px',
                    height: 38,
                    borderRadius: 9,
                    border: '1px solid var(--hair)',
                    background: 'var(--panel)',
                    flexShrink: 0,
                    width: isMobile ? '100%' : undefined,
                  }}
                >
                  <Icon name="users" size={15} stroke={2} style={{ color: 'var(--ink-3)' }} />
                  <select
                    value={producer}
                    onChange={e => setFilter(() => setProducer(e.target.value))}
                    style={{
                      border: 'none',
                      outline: 'none',
                      background: 'transparent',
                      fontSize: 13,
                      fontWeight: 500,
                      color: 'var(--ink-2)',
                      cursor: 'pointer',
                      appearance: 'none',
                      paddingRight: 4,
                      flex: 1,
                      minWidth: 0,
                    }}
                  >
                    <option value="">Todos los productores</option>
                    {PRODUCTORES_LIST.map(pr => (
                      <option key={pr.id} value={pr.id}>
                        {pr.name}
                      </option>
                    ))}
                  </select>
                  <Icon name="chevronDown" size={13} style={{ color: 'var(--ink-3)' }} />
                </div>
              )}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 9,
                  padding: '8px 12px',
                  borderRadius: 9,
                  border: '1px solid var(--hair)',
                  background: 'var(--panel)',
                  width: isMobile ? '100%' : 250,
                  flex: '1 1 220px',
                  maxWidth: isMobile ? '100%' : 320,
                }}
              >
                <Icon name="search" size={16} stroke={2} style={{ color: 'var(--ink-3)' }} />
                <input
                  value={q}
                  onChange={e => setQ(e.target.value)}
                  placeholder="Buscar nº, asegurado, aseguradora…"
                  style={{
                    border: 'none',
                    outline: 'none',
                    background: 'transparent',
                    fontSize: 13,
                    flex: 1,
                    minWidth: 0,
                  }}
                />
              </div>
            </div>

            {/* table */}
            <Panel pad={false} style={{ overflow: 'hidden' }}>
              <div className="rtable-wrap">
                <table className="rtable" style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--hair)' }}>
                      <Th k="client">Cliente</Th>
                      <Th k="num" w={140}>
                        Póliza
                      </Th>
                      <Th k="insurer">Aseguradora</Th>
                      <Th k="ramo">Ramo</Th>
                      <Th k="prima" align="right" w={130}>
                        Prima
                      </Th>
                      <Th k="renew" align="right" w={170}>
                        Renueva
                      </Th>
                      <Th k="status" w={110}>
                        Estado
                      </Th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading
                      ? Array.from({ length: 8 }).map((_, i) => (
                          <tr key={i} style={{ borderBottom: '1px solid var(--hair-2)' }}>
                            <td style={{ padding: 'var(--row-pad) 14px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                                <span
                                  className="skel"
                                  style={{ width: 32, height: 32, borderRadius: 8, flexShrink: 0 }}
                                />
                                <span className="skel" style={{ width: 150, height: 13 }} />
                              </div>
                            </td>
                            <td style={{ padding: 'var(--row-pad) 14px' }}>
                              <span className="skel" style={{ width: 90, height: 12 }} />
                            </td>
                            <td style={{ padding: 'var(--row-pad) 14px' }}>
                              <span className="skel" style={{ width: 100, height: 12 }} />
                            </td>
                            <td style={{ padding: 'var(--row-pad) 14px' }}>
                              <span className="skel" style={{ width: 80, height: 12 }} />
                            </td>
                            <td style={{ padding: 'var(--row-pad) 14px', textAlign: 'right' }}>
                              <span className="skel" style={{ width: 70, height: 12, display: 'inline-block' }} />
                            </td>
                            <td style={{ padding: 'var(--row-pad) 14px', textAlign: 'right' }}>
                              <span className="skel" style={{ width: 90, height: 12, display: 'inline-block' }} />
                            </td>
                            <td style={{ padding: 'var(--row-pad) 14px' }}>
                              <span className="skel" style={{ width: 66, height: 18, borderRadius: 99 }} />
                            </td>
                          </tr>
                        ))
                      : data.map((p, i) => {
                          const days = daysFrom(p.renew);
                          return (
                            <tr
                              key={p.id}
                              onClick={() => go('detail', { id: p.id })}
                              style={{
                                borderBottom: i === data.length - 1 ? 'none' : '1px solid var(--hair-2)',
                                cursor: 'pointer',
                                transition: 'background .12s',
                              }}
                              onMouseEnter={e => (e.currentTarget.style.background = 'var(--panel-2)')}
                              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                            >
                              <td style={{ padding: 'var(--row-pad) 14px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                                  <Avatar
                                    initials={p.client.split(',')[0].slice(0, 2).toUpperCase()}
                                    size={32}
                                    tone="neutral"
                                  />
                                  <div style={{ minWidth: 0 }}>
                                    <div
                                      style={{
                                        fontSize: 13.5,
                                        fontWeight: 600,
                                        color: 'var(--ink)',
                                        whiteSpace: 'nowrap',
                                      }}
                                    >
                                      {p.client}
                                    </div>
                                    <div
                                      style={{
                                        fontSize: 11.5,
                                        color: 'var(--ink-3)',
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        maxWidth: 200,
                                      }}
                                    >
                                      {p.detail}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td style={{ padding: 'var(--row-pad) 14px' }}>
                                <span className="font-mono" style={{ fontSize: 12.5, color: 'var(--ink-2)' }}>
                                  {p.num}
                                </span>
                              </td>
                              <td style={{ padding: 'var(--row-pad) 14px', fontSize: 13, color: 'var(--ink-2)' }}>
                                {p.insurer}
                              </td>
                              <td style={{ padding: 'var(--row-pad) 14px' }}>
                                <span
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 7,
                                    fontSize: 13,
                                    color: 'var(--ink-2)',
                                  }}
                                >
                                  <Icon
                                    name={ramoIcon[p.ramo] || 'shield'}
                                    size={15}
                                    stroke={1.9}
                                    style={{ color: 'var(--ink-3)' }}
                                  />
                                  {p.ramo}
                                </span>
                              </td>
                              <td style={{ padding: 'var(--row-pad) 14px', textAlign: 'right' }}>
                                <div
                                  className="font-mono tnum"
                                  style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}
                                >
                                  {ars(p.prima)}
                                </div>
                                <div style={{ fontSize: 10.5, color: 'var(--ink-3)' }}>{p.freq}</div>
                              </td>
                              <td style={{ padding: 'var(--row-pad) 14px', textAlign: 'right' }}>
                                <div className="font-mono tnum" style={{ fontSize: 12.5, color: 'var(--ink-2)' }}>
                                  {p.renew}
                                </div>
                                <div style={{ marginTop: 4, display: 'flex', justifyContent: 'flex-end' }}>
                                  <Pill tone={urgencyTone(days)} style={{ fontSize: 10 }}>
                                    {days <= 30 ? `en ${days} d` : `${Math.round(days / 30)} meses`}
                                  </Pill>
                                </div>
                              </td>
                              <td style={{ padding: 'var(--row-pad) 14px' }}>
                                <Pill tone="emerald" dot>
                                  {p.status}
                                </Pill>
                              </td>
                            </tr>
                          );
                        })}
                  </tbody>
                </table>
              </div>
              {!loading && error && (
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--red-ink)', fontSize: 13.5 }}>
                  No pudimos cargar las pólizas.{' '}
                  <button onClick={() => listQ.refetch()} style={{ color: 'var(--orange-ink)', fontWeight: 600 }}>
                    Reintentar
                  </button>
                </div>
              )}
              {!loading && !error && data.length === 0 && (
                <div style={{ padding: '50px', textAlign: 'center', color: 'var(--ink-3)', fontSize: 14 }}>
                  No hay pólizas que coincidan con el filtro.
                </div>
              )}
            </Panel>

            {/* paginación */}
            {!error && total > 0 && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  marginTop: 14,
                  flexWrap: 'wrap',
                }}
              >
                <span style={{ fontSize: 12.5, color: 'var(--ink-3)' }}>
                  Mostrando{' '}
                  <strong className="font-mono tnum" style={{ color: 'var(--ink-2)' }}>
                    {from.toLocaleString('es-AR')}–{to.toLocaleString('es-AR')}
                  </strong>{' '}
                  de{' '}
                  <strong className="font-mono tnum" style={{ color: 'var(--ink-2)' }}>
                    {total.toLocaleString('es-AR')}
                  </strong>
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Btn
                    size="sm"
                    variant="ghost"
                    onClick={() => setOffset(o => Math.max(0, o - POLIZAS_LIMIT))}
                    style={{ opacity: offset <= 0 ? 0.4 : 1, pointerEvents: offset <= 0 ? 'none' : 'auto' }}
                  >
                    Anterior
                  </Btn>
                  <Btn
                    size="sm"
                    variant="ghost"
                    iconRight="chevronRight"
                    onClick={() => setOffset(o => o + POLIZAS_LIMIT)}
                    style={{ opacity: to >= total ? 0.4 : 1, pointerEvents: to >= total ? 'none' : 'auto' }}
                  >
                    Siguiente
                  </Btn>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

Object.assign(window, { ScreenPolizas });
