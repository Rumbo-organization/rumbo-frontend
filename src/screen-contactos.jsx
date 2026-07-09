/* ============================================================
   RUMBO — Asegurados (agenda de la cartera)
   Fase 2 escalabilidad: la lista se pagina server-side vía
   window.rumboApi.contactsPage (búsqueda/segmento en SQL). El resumen se pide
   por contacto con contactById. Ya no lee las arrays del bootstrap.
   Ver roadmap/PLAN-ESCALABILIDAD.md.
   ============================================================ */
const CONTACTOS_LIMIT = 50;

function ScreenContactos({ go, params }) {
  const isMobile = useIsMobile();
  const { ars, arsShort, daysFrom } = window.rumboFmt;

  const [seg, setSeg] = useState('todos');
  const [importOpen, setImportOpen] = useState(false);
  const [q, setQ] = useState('');
  const [qDebounced, setQDebounced] = useState('');
  const [offset, setOffset] = useState(0);

  const pid = params && params.id;
  const [sel, setSel] = useState(pid || null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => { if (pid) { setSel(pid); if (isMobile) setDrawerOpen(true); } }, [pid]);

  // Debounce de la búsqueda + volver a la pág. 1.
  useEffect(() => {
    const t = setTimeout(() => { setQDebounced(q.trim()); setOffset(0); }, 300);
    return () => clearTimeout(t);
  }, [q]);

  // Lista paginada vía TanStack Query (rumboRefresh invalida tras mutaciones).
  const listQ = useApiQuery(
    ['contacts', { q: qDebounced, seg, offset }],
    () => window.rumboApi.contactsPage({ q: qDebounced, seg: seg === 'todos' ? '' : seg, limit: CONTACTOS_LIMIT, offset }),
    { keepPrevious: true },
  );
  const rows = listQ.data?.data ?? [];
  const total = listQ.data?.total ?? 0;
  const loading = listQ.isPending;
  const error = listQ.error;

  // Selección default: primera fila de la página cuando no hay elegido.
  useEffect(() => {
    if (rows.length) setSel(s => s || rows[0].id);
  }, [rows]);

  // Detalle del contacto seleccionado (misma key ['contact', id] que la ficha
  // completa → cache compartida entre lista y ScreenContacto).
  const detailQ = useApiQuery(['contact', sel], () => window.rumboApi.contactById(sel), { enabled: Boolean(sel) });
  const detail = detailQ.data ?? null;
  const detailLoading = detailQ.isLoading;

  const setFilter = (fn) => { fn(); setOffset(0); };
  const selectContact = (id) => { setSel(id); if (isMobile) setDrawerOpen(true); };

  const segs = [
    { id: 'todos', label: 'Todos' },
    { id: 'clientes', label: 'Asegurados' },
    { id: 'prospectos', label: 'Prospectos' },
    { id: 'empresas', label: 'Empresas' },
  ];

  const from = total === 0 ? 0 : offset + 1;
  const to = Math.min(offset + CONTACTOS_LIMIT, total);

  // Resumen — desde contactById (detail). Skeleton mientras carga.
  const resumen = detailLoading || !detail ? (
    <>
      <Panel>
        <div style={{ display: 'flex', alignItems: 'center', gap: 13, marginBottom: 16 }}>
          <span className="skel" style={{ width: 50, height: 50, borderRadius: 13, flexShrink: 0 }} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span className="skel" style={{ width: '70%', height: 18 }} />
            <span className="skel" style={{ width: '45%', height: 12 }} />
          </div>
        </div>
        <span className="skel" style={{ display: 'block', width: '100%', height: 74, borderRadius: 10 }} />
      </Panel>
      <Panel><span className="skel" style={{ display: 'block', width: '100%', height: 120, borderRadius: 10 }} /></Panel>
    </>
  ) : (
    <>
      <Panel>
        <div style={{ display: 'flex', alignItems: 'center', gap: 13, marginBottom: 16 }}>
          <Avatar initials={detail.initials} size={50} tone={detail.tags && detail.tags.includes('Prospecto') ? 'neutral' : 'orange'} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 className="font-display" style={{ fontSize: 21, letterSpacing: '-0.02em', lineHeight: 1.1 }}>{detail.name}</h2>
            <div style={{ fontSize: 12.5, color: 'var(--ink-3)', marginTop: 3 }}>{detail.kind} · desde {detail.since}</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
          <Btn size="sm" variant="primary" icon="whatsapp" style={{ flex: 1 }}>WhatsApp</Btn>
          <Btn size="sm" variant="soft" icon="phone" style={{ flex: 1 }}>Llamar</Btn>
        </div>
        <Btn size="sm" variant="ghost" icon="users" style={{ width: '100%', marginBottom: 16 }} onClick={() => go('contacto', { id: detail.id })}>Ver ficha completa</Btn>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: 'var(--hair-2)', border: '1px solid var(--hair)', borderRadius: 10, overflow: 'hidden' }}>
          <MiniStat label="Prima anual" value={arsShort(detail.stats.primaAnual)} />
          <MiniStat label="Pólizas" value={detail.stats.polizas} />
          <MiniStat label="Siniestros" value={detail.stats.siniestros} tone={detail.stats.siniestros ? 'var(--amber-ink)' : undefined} />
          <MiniStat label="Teléfono" value={detail.phone || '—'} small />
        </div>
      </Panel>

      <Panel>
        <SectionHead label="Pólizas del contacto" action={<Btn size="sm" variant="bare" iconRight="arrowRight" onClick={() => go('polizas')}>Cartera</Btn>} />
        {(!detail.polizas || detail.polizas.length === 0) ? (
          <div style={{ padding: '6px 0', fontSize: 13, color: 'var(--ink-3)' }}>Sin pólizas. Oportunidad de primera venta.</div>
        ) : detail.polizas.map((p, i) => (
          <div key={p.id} onClick={() => go('detail', { id: p.id })} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 0', borderBottom: i === detail.polizas.length - 1 ? 'none' : '1px solid var(--hair-2)', cursor: 'pointer' }}
            onMouseEnter={e => e.currentTarget.style.opacity = 0.7} onMouseLeave={e => e.currentTarget.style.opacity = 1}>
            <RamoGlyph ramo={p.ramo} size={32} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{p.ramo} · {p.insurer}</div>
              <div className="font-mono" style={{ fontSize: 11, color: 'var(--ink-3)' }}>{p.num}</div>
            </div>
            <Pill tone={urgencyTone(daysFrom(p.renew))} style={{ fontSize: 10 }}>{daysFrom(p.renew) <= 30 ? `${daysFrom(p.renew)}d` : 'Vigente'}</Pill>
          </div>
        ))}
      </Panel>
    </>
  );

  return (
    <div className="scroll rise" style={{ overflowY: 'auto', height: '100%', padding: isMobile ? '18px 16px 40px' : '30px 34px 60px' }}>
      <div style={{ maxWidth: 1240, margin: '0 auto' }}>
        <PageHead eyebrow="Cartera" tick={1} title="Asegurados"
          sub={<><strong className="font-mono tnum" style={{ color: 'var(--ink)' }}>{total.toLocaleString('es-AR')}</strong> {seg === 'todos' && !qDebounced ? 'en tu cartera' : 'en el filtro actual'}</>}
          actions={<><Btn variant="ghost" icon="download" onClick={() => setImportOpen(true)}>Importar</Btn><Btn variant="ghost" icon="external" onClick={() => window.open(window.rumboApi.contactsExportUrl(), '_blank')}>Exportar</Btn><Btn variant="primary" icon="plus" onClick={() => window.rumboUI?.newContacto()}>Nuevo contacto</Btn></>} />

        <ImportContactsDrawer open={importOpen} onClose={() => setImportOpen(false)} onDone={() => window.queryClient.invalidateQueries({ queryKey: ['contacts'] })} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
          <Segmented segs={segs} value={seg} onChange={(v) => setFilter(() => setSeg(v))} />
          <SearchBox q={q} setQ={setQ} placeholder="Buscar por nombre o DNI…" />
        </div>

        <div className="rgrid" style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 24, alignItems: 'start' }}>
          {/* list */}
          <Panel pad={false} style={{ overflow: 'hidden' }}>
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '13px 16px', borderBottom: '1px solid var(--hair-2)' }}>
                  <span className="skel" style={{ width: 38, height: 38, borderRadius: 10, flexShrink: 0 }} />
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 7 }}>
                    <span className="skel" style={{ width: '55%', height: 13 }} />
                    <span className="skel" style={{ width: '35%', height: 11 }} />
                  </div>
                  <span className="skel" style={{ width: 44, height: 12 }} />
                </div>
              ))
            ) : error ? (
              <div style={{ padding: 50, textAlign: 'center', color: 'var(--red-ink)', fontSize: 13.5 }}>
                No pudimos cargar los asegurados. <button onClick={() => listQ.refetch()} style={{ color: 'var(--orange-ink)', fontWeight: 600 }}>Reintentar</button>
              </div>
            ) : rows.length === 0 ? (
              <div style={{ padding: 50, textAlign: 'center', color: 'var(--ink-3)', fontSize: 14 }}>Sin asegurados que coincidan.</div>
            ) : rows.map((c, i) => {
              const active = c.id === sel && !isMobile;
              const prospecto = c.tags && c.tags.includes('Prospecto');
              return (
                <div key={c.id} onClick={() => selectContact(c.id)} style={{
                  display: 'flex', alignItems: 'center', gap: 13, padding: '13px 16px',
                  borderBottom: i === rows.length - 1 ? 'none' : '1px solid var(--hair-2)',
                  cursor: 'pointer', background: active ? 'var(--orange-soft)' : 'transparent',
                  borderLeft: `3px solid ${active ? 'var(--orange)' : 'transparent'}`, transition: 'background .12s',
                }}
                  onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'var(--panel-2)'; }}
                  onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}>
                  <Avatar initials={c.initials} size={38} tone={prospecto ? 'neutral' : 'orange'} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</span>
                      {prospecto && <Pill tone="amber" style={{ fontSize: 9.5, padding: '1px 6px', flexShrink: 0 }}>Prospecto</Pill>}
                    </div>
                    <div style={{ fontSize: 11.5, color: 'var(--ink-3)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      <Icon name="mapPin" size={12} style={{ flexShrink: 0 }} />{c.city} · {c.kind}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div className="font-mono tnum" style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ink)', whiteSpace: 'nowrap' }}>{c.polCount} pól.</div>
                    {c.nextRenewDays != null && c.nextRenewDays <= 30 && <Pill tone={urgencyTone(c.nextRenewDays)} style={{ fontSize: 9.5, marginTop: 4, whiteSpace: 'nowrap' }}>Vence {c.nextRenewDays}d</Pill>}
                  </div>
                  {isMobile && <Icon name="chevronRight" size={16} style={{ color: 'var(--ink-3)', flexShrink: 0 }} />}
                </div>
              );
            })}
          </Panel>

          {/* detail card — inline solo en desktop; en mobile va en el drawer */}
          {!isMobile && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24, position: 'sticky', top: 0 }}>
              {sel ? resumen : <Panel><div style={{ padding: '30px 0', textAlign: 'center', color: 'var(--ink-3)', fontSize: 13.5 }}>Elegí un asegurado para ver su resumen.</div></Panel>}
            </div>
          )}
        </div>

        {/* paginación */}
        {!loading && !error && total > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 14, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12.5, color: 'var(--ink-3)' }}>
              Mostrando <strong className="font-mono tnum" style={{ color: 'var(--ink-2)' }}>{from.toLocaleString('es-AR')}–{to.toLocaleString('es-AR')}</strong> de <strong className="font-mono tnum" style={{ color: 'var(--ink-2)' }}>{total.toLocaleString('es-AR')}</strong>
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Btn size="sm" variant="ghost" onClick={() => setOffset(o => Math.max(0, o - CONTACTOS_LIMIT))}
                style={{ opacity: offset <= 0 ? 0.4 : 1, pointerEvents: offset <= 0 ? 'none' : 'auto' }}>Anterior</Btn>
              <Btn size="sm" variant="ghost" iconRight="chevronRight" onClick={() => setOffset(o => o + CONTACTOS_LIMIT)}
                style={{ opacity: to >= total ? 0.4 : 1, pointerEvents: to >= total ? 'none' : 'auto' }}>Siguiente</Btn>
            </div>
          </div>
        )}
      </div>

      {/* Resumen del contacto en drawer (solo mobile) */}
      {isMobile && (
        <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} eyebrow="Resumen del asegurado" title={detail ? detail.name : 'Asegurado'}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>{resumen}</div>
        </Drawer>
      )}
    </div>
  );
}

Object.assign(window, { ScreenContactos });
