/* ============================================================
   RUMBO — Actividad (audit log de la organización)
   Server-side paginado (Slice 2): GET /actividad con "cargar más" real.
   El productor ve solo lo suyo y el organizador todo (policy RLS de audit_log).
   ============================================================ */
function ScreenActividad({ go }) {
  const isMobile = useIsMobile();
  const PAGE = 50;

  // "Cargar más" acumulativo vía useInfiniteQuery (offset como pageParam).
  // rumboRefresh() invalida tras cualquier mutación → recarga desde la pág. 1.
  const actQ = useInfiniteQuery({
    queryKey: ['actividad'],
    queryFn: ({ pageParam }) => window.rumboApi.actividadPage({ limit: PAGE, offset: pageParam }),
    initialPageParam: 0,
    getNextPageParam: (last, pages) => {
      const loaded = pages.reduce((a, p) => a + p.data.length, 0);
      return loaded < last.total ? loaded : undefined;
    },
  });
  const rows = (actQ.data?.pages ?? []).flatMap(p => p.data);
  const total = actQ.data?.pages?.[0]?.total ?? 0;
  const loading = actQ.isPending || actQ.isFetchingNextPage;
  const error = actQ.error;

  const kindColor = { event: 'var(--ink-3)', alert: 'var(--red)', note: 'var(--orange)' };
  const kindIcon = { event: 'check', alert: 'alert', note: 'message' };

  return (
    <div
      className="scroll rise"
      style={{ overflowY: 'auto', height: '100%', padding: isMobile ? '18px 16px 40px' : '30px 34px 60px' }}
    >
      <div style={{ maxWidth: 880, margin: '0 auto' }}>
        <PageHead
          eyebrow="Sistema"
          tick={4}
          title="Actividad"
          sub="Todo lo que pasó en tu cuenta, en orden. Cada acción importante queda registrada automáticamente."
          actions={
            <Btn variant="ghost" icon="download">
              Exportar
            </Btn>
          }
        />

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

        <Panel pad={false} style={{ overflow: 'hidden' }}>
          <div className="rtable-wrap">
            <table className="rtable" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--hair)' }}>
                  <th className="eyebrow" style={{ textAlign: 'left', padding: '13px 18px', width: 130 }}>
                    Fecha
                  </th>
                  <th className="eyebrow" style={{ textAlign: 'left', padding: '13px 18px' }}>
                    Acción
                  </th>
                  <th className="eyebrow" style={{ textAlign: 'left', padding: '13px 18px' }}>
                    Entidad
                  </th>
                  <th className="eyebrow" style={{ textAlign: 'left', padding: '13px 18px', width: 130 }}>
                    Usuario
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && !loading && (
                  <tr>
                    <td
                      colSpan={4}
                      style={{ padding: '28px 18px', textAlign: 'center', fontSize: 13, color: 'var(--ink-3)' }}
                    >
                      Sin actividad registrada.
                    </td>
                  </tr>
                )}
                {rows.map((a, i) => (
                  <tr
                    key={a.id}
                    style={{
                      borderBottom: i === rows.length - 1 ? 'none' : '1px solid var(--hair-2)',
                      transition: 'background .12s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--panel-2)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td style={{ padding: '13px 18px' }}>
                      <span className="font-mono" style={{ fontSize: 12, color: 'var(--ink-3)' }}>
                        {a.when}
                      </span>
                    </td>
                    <td style={{ padding: '13px 18px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span
                          style={{
                            width: 26,
                            height: 26,
                            borderRadius: 7,
                            flexShrink: 0,
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background:
                              a.kind === 'alert'
                                ? 'var(--red-soft)'
                                : a.kind === 'note'
                                  ? 'var(--orange-soft)'
                                  : 'var(--panel-2)',
                            color: kindColor[a.kind],
                            border: '1px solid var(--hair)',
                          }}
                        >
                          <Icon name={kindIcon[a.kind]} size={13} stroke={2.2} />
                        </span>
                        <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ink)' }}>{a.action}</span>
                      </div>
                    </td>
                    <td style={{ padding: '13px 18px' }}>
                      <div className="font-mono" style={{ fontSize: 12.5, color: 'var(--ink-2)' }}>
                        {a.entity}
                      </div>
                      <div style={{ fontSize: 11.5, color: 'var(--ink-3)', marginTop: 1 }}>{a.detail}</div>
                    </td>
                    <td style={{ padding: '13px 18px', fontSize: 13, color: 'var(--ink-2)' }}>{a.user}</td>
                  </tr>
                ))}
                {loading && (
                  <tr>
                    <td colSpan={4} style={{ padding: '16px 18px' }}>
                      <span className="skel" style={{ display: 'block', width: '100%', height: 40, borderRadius: 8 }} />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Panel>
        {rows.length < total && !loading && (
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 18 }}>
            <Btn variant="ghost" size="sm" onClick={() => actQ.fetchNextPage()}>
              Cargar más actividad · {rows.length} de {total}
            </Btn>
          </div>
        )}
      </div>
    </div>
  );
}

Object.assign(window, { ScreenActividad });
