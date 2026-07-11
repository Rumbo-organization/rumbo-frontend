/* ============================================================
   RUMBO — Siniestros (seguimiento de denuncias)
   ============================================================ */
function ScreenSiniestros({ go }) {
  const isMobile = useIsMobile();

  // Server-side (Slice 2 de paridad): la lista sale de GET /siniestros paginado
  // (antes: array SINIESTROS capada a 500 en el bootstrap). Búsqueda con
  // debounce (nº siniestro / nº póliza / titular, insensible a acentos).
  // TanStack Query: rumboRefresh() invalida tras crear/gestionar un siniestro.
  const [q, setQ] = useState('');
  const [qDebounced, setQDebounced] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setQDebounced(q.trim()), q ? 300 : 0);
    return () => clearTimeout(t);
  }, [q]);

  const listQ = useApiQuery(
    ['claims', { q: qDebounced }],
    () => window.rumboApi.claimsPage({ q: qDebounced, limit: 200 }),
    { keepPrevious: true },
  );
  const data = listQ.data ?? null;
  const loading = listQ.isPending;
  const error = listQ.error;

  const cols = [
    { id: 'Abierto', label: 'Abiertos', tone: 'amber', hint: 'Denuncia cargada, sin gestión' },
    { id: 'En curso', label: 'En curso', tone: 'orange', hint: 'En análisis de la aseguradora' },
    { id: 'Cerrado', label: 'Cerrados', tone: 'emerald', hint: 'Resueltos' },
  ];

  const all = data ? data.data : [];
  const counts = data ? data.counts : { abiertos: 0, enCurso: 0, cerrados: 0, stale: 0 };
  const activos = counts.abiertos + counts.enCurso;
  const staleCount = counts.stale;
  const truncado = data && data.total > all.length;

  return (
    <div
      className="scroll rise"
      style={{ overflowY: 'auto', height: '100%', padding: isMobile ? '18px 16px 40px' : '30px 34px 60px' }}
    >
      <div style={{ maxWidth: 1240, margin: '0 auto' }}>
        <PageHead
          eyebrow="Cartera"
          tick={4}
          title="Siniestros"
          sub={
            <>
              <strong className="font-mono tnum" style={{ color: 'var(--ink)' }}>
                {activos}
              </strong>{' '}
              activos ·{' '}
              {staleCount > 0 ? (
                <strong style={{ color: 'var(--red-ink)' }}>{staleCount} perdiendo rumbo</strong>
              ) : (
                'todos al día'
              )}
            </>
          }
          actions={
            <>
              <Btn variant="ghost" icon="download">
                Exportar
              </Btn>
              <Btn variant="ghost" icon="scroll" onClick={() => go('pre-denuncias')}>
                Pre-denuncias
              </Btn>
              <Btn variant="primary" icon="plus" onClick={() => window.rumboUI?.newSiniestro()}>
                Reportar siniestro
              </Btn>
            </>
          }
        />

        {/* búsqueda server-side */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', marginBottom: 18, maxWidth: 420 }}>
          <Icon
            name="search"
            size={15}
            style={{ position: 'absolute', left: 13, color: 'var(--ink-3)', pointerEvents: 'none' }}
          />
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Buscar nº de siniestro, póliza o asegurado…"
            style={{
              width: '100%',
              padding: '10px 12px 10px 36px',
              fontSize: 13.5,
              color: 'var(--ink)',
              background: 'var(--panel)',
              border: '1px solid var(--hair)',
              borderRadius: 10,
              outline: 'none',
            }}
          />
        </div>

        {staleCount > 0 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 13,
              padding: '13px 18px',
              borderRadius: 'var(--radius)',
              background: 'var(--red-soft)',
              border: '1px solid var(--red)',
              marginBottom: 22,
            }}
          >
            <Icon name="alert" size={20} style={{ color: 'var(--red-ink)' }} />
            <div style={{ flex: 1, fontSize: 13.5, color: 'var(--red-ink)' }}>
              <strong>
                {staleCount} siniestro{staleCount > 1 ? 's' : ''} sin movimiento hace más de 14 días.
              </strong>{' '}
              Reactivá la gestión antes de que el asegurado lo note.
            </div>
          </div>
        )}

        {error && (
          <div
            style={{
              padding: '14px 18px',
              borderRadius: 'var(--radius)',
              background: 'var(--red-soft)',
              border: '1px solid var(--red)',
              fontSize: 13,
              color: 'var(--red-ink)',
              marginBottom: 18,
            }}
          >
            {error.message}
          </div>
        )}
        {truncado && (
          <div style={{ fontSize: 12.5, color: 'var(--ink-3)', marginBottom: 14 }}>
            Mostrando {all.length} de {data.total} siniestros. Afiná la búsqueda para ver el resto.
          </div>
        )}

        <div
          className="rgrid"
          style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, alignItems: 'start' }}
        >
          {cols.map(col => {
            const cards = all.filter(s => s.status === col.id);
            return (
              <div
                key={col.id}
                style={{
                  background: 'var(--paper-2)',
                  border: '1px solid var(--hair)',
                  borderRadius: 'var(--radius)',
                  padding: 14,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'nowrap' }}>
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 99,
                      flexShrink: 0,
                      background: `var(--${col.tone === 'emerald' ? 'emerald' : col.tone === 'orange' ? 'orange' : 'amber'})`,
                    }}
                  />
                  <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--ink)', whiteSpace: 'nowrap' }}>
                    {col.label}
                  </span>
                  <span
                    className="font-mono tnum"
                    style={{
                      fontSize: 11,
                      color: 'var(--ink-3)',
                      background: 'var(--panel)',
                      border: '1px solid var(--hair)',
                      padding: '1px 7px',
                      borderRadius: 99,
                    }}
                  >
                    {col.id === 'Abierto' ? counts.abiertos : col.id === 'En curso' ? counts.enCurso : counts.cerrados}
                  </span>
                </div>
                <div style={{ fontSize: 11, color: 'var(--ink-3)', marginBottom: 12 }}>{col.hint}</div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {loading && (
                    <span className="skel" style={{ display: 'block', width: '100%', height: 110, borderRadius: 10 }} />
                  )}
                  {!loading && cards.length === 0 && (
                    <div style={{ padding: '20px 8px', textAlign: 'center', fontSize: 12.5, color: 'var(--ink-3)' }}>
                      Sin siniestros.
                    </div>
                  )}
                  {!loading &&
                    cards.map(s => {
                      const stale = s.stale >= 10 && s.status !== 'Cerrado';
                      return (
                        <div
                          key={s.id}
                          onClick={() => window.rumboUI?.openClaim(s.id)}
                          style={{
                            background: 'var(--panel)',
                            border: `1px solid ${stale ? 'var(--red)' : 'var(--hair)'}`,
                            borderRadius: 10,
                            padding: 13,
                            cursor: 'pointer',
                            boxShadow: 'var(--shadow-sm)',
                            transition: 'transform .14s',
                          }}
                          onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-2px)')}
                          onMouseLeave={e => (e.currentTarget.style.transform = 'none')}
                        >
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'flex-start',
                              justifyContent: 'space-between',
                              gap: 8,
                              marginBottom: 9,
                            }}
                          >
                            <div style={{ minWidth: 0 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                                <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>{s.tipo}</span>
                                {s.importance && (
                                  <Pill
                                    tone={
                                      s.importance === 'Alta' ? 'red' : s.importance === 'Media' ? 'amber' : 'neutral'
                                    }
                                    style={{ fontSize: 9.5, padding: '1px 6px' }}
                                  >
                                    {s.importance}
                                  </Pill>
                                )}
                              </div>
                              <div
                                className="font-mono"
                                style={{ fontSize: 10.5, color: 'var(--ink-3)', marginTop: 2 }}
                              >
                                {s.num}
                              </div>
                            </div>
                            <RamoGlyph ramo={s.ramo || 'Automotor'} size={30} />
                          </div>
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 8,
                              paddingTop: 9,
                              borderTop: '1px solid var(--hair-2)',
                            }}
                          >
                            <Avatar
                              initials={s.client.split(',')[0].slice(0, 2).toUpperCase()}
                              size={24}
                              tone="neutral"
                            />
                            <span
                              style={{
                                fontSize: 12,
                                color: 'var(--ink-2)',
                                flex: 1,
                                minWidth: 0,
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}
                            >
                              {s.client}
                            </span>
                          </div>
                          <div style={{ marginTop: 9 }}>
                            {s.status === 'Cerrado' ? (
                              <Pill tone="emerald" dot>
                                Resuelto
                              </Pill>
                            ) : (
                              <Pill tone={stale ? 'red' : 'neutral'} dot={stale}>
                                {stale ? `Sin mov. ${s.stale}d` : `Activo ${s.stale}d`}
                              </Pill>
                            )}
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
