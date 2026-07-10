/* ============================================================
   RUMBO — Vencimientos (todos los waypoints de la cartera)
   Fase 4 escalabilidad: la lista se pagina server-side vía
   window.rumboApi.vencimientosPage (ventana/forma de pago en SQL). Ya no lee la
   array capada del bootstrap. Ver roadmap/PLAN-ESCALABILIDAD.md.
   ============================================================ */
const VENC_LIMIT = 50;
const VENC_PAY_OPTIONS = ['Todas las formas', 'Cupón', 'Débito bancario', 'Tarjeta de crédito', 'Sin especificar'];
const VENC_PAY_ENUM = {
  Cupón: 'cupon',
  'Débito bancario': 'debito_bancario',
  'Tarjeta de crédito': 'tarjeta_credito',
  'Sin especificar': '__none__',
};

function ScreenVencimientos({ go }) {
  const isMobile = useIsMobile();
  const version = useRumboVersion();
  const { ars, arsShort, daysFrom } = window.rumboFmt;
  const [seg, setSeg] = useState('todos');
  const [pay, setPay] = useState('Todas las formas');
  const [producer, setProducer] = useState('');
  const PRODUCTORES_LIST = window.RUMBO_DATA?.PRODUCTORES ?? [];
  const [offset, setOffset] = useState(0);

  const MES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  const MESL = [
    'Enero',
    'Febrero',
    'Marzo',
    'Abril',
    'Mayo',
    'Junio',
    'Julio',
    'Agosto',
    'Septiembre',
    'Octubre',
    'Noviembre',
    'Diciembre',
  ];

  // Lista paginada vía TanStack Query (rumboRefresh invalida tras mutaciones).
  const listQ = useApiQuery(
    ['vencimientos', { seg, pay, producer, offset }],
    () =>
      window.rumboApi.vencimientosPage({
        window: seg === 'todos' ? '' : seg,
        pay: pay === 'Todas las formas' ? '' : VENC_PAY_ENUM[pay] || '',
        producer,
        limit: VENC_LIMIT,
        offset,
      }),
    { keepPrevious: true },
  );
  const data = listQ.data?.data ?? [];
  const total = listQ.data?.total ?? 0;
  const totalPrima = listQ.data?.totalPrima ?? 0;
  const counts = listQ.data?.counts ?? { d30: 0, d90: 0, all: 0 };
  const loading = listQ.isPending;
  const error = listQ.error;

  const setFilter = fn => {
    fn();
    setOffset(0);
  };

  const segs = [
    { id: '30', label: 'Próximos 30 días', n: counts.d30 },
    { id: '90', label: '90 días', n: counts.d90 },
    { id: 'todos', label: 'Todo el año', n: counts.all },
  ];

  // Ítems de la página actual con días + agrupados por año-mes (para el timeline).
  const items = data.map(p => ({ ...p, days: daysFrom(p.renew), d: new Date(p.renew) }));
  const groups = [];
  items.forEach(p => {
    const key = `${p.d.getFullYear()}-${p.d.getMonth()}`;
    let g = groups.find(x => x.key === key);
    if (!g) {
      g = { key, year: p.d.getFullYear(), month: p.d.getMonth(), items: [] };
      groups.push(g);
    }
    g.items.push(p);
  });

  const from = total === 0 ? 0 : offset + 1;
  const to = Math.min(offset + VENC_LIMIT, total);

  return (
    <div
      className="scroll rise"
      style={{ overflowY: 'auto', height: '100%', padding: isMobile ? '18px 16px 40px' : '30px 34px 60px' }}
    >
      <div style={{ maxWidth: 1080, margin: '0 auto' }}>
        <PageHead
          eyebrow="El rumbo · timeline"
          tick={3}
          title="Vencimientos"
          sub={
            <>
              Cada renovación es un waypoint.{' '}
              <strong className="font-mono tnum" style={{ color: 'var(--ink)' }}>
                {total.toLocaleString('es-AR')}
              </strong>{' '}
              por delante ·{' '}
              <strong className="font-mono tnum" style={{ color: 'var(--ink)' }}>
                {arsShort(totalPrima)}
              </strong>{' '}
              en prima a renovar
            </>
          }
          actions={
            <>
              <Btn variant="ghost" icon="download">
                Exportar
              </Btn>
              <Btn variant="primary" icon="bell">
                Recordatorios
              </Btn>
            </>
          }
        />

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 22, flexWrap: 'wrap' }}>
          <Segmented segs={segs} value={seg} onChange={v => setFilter(() => setSeg(v))} />
          <div style={{ minWidth: 200, width: isMobile ? '100%' : undefined }}>
            <SelectInput value={pay} onChange={v => setFilter(() => setPay(v))} options={VENC_PAY_OPTIONS} />
          </div>
          {PRODUCTORES_LIST.length > 1 && (
            <div style={{ minWidth: 200, width: isMobile ? '100%' : undefined }}>
              <select
                value={producer}
                onChange={e => setFilter(() => setProducer(e.target.value))}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  fontSize: 13.5,
                  color: 'var(--ink)',
                  background: 'var(--panel)',
                  border: '1px solid var(--hair)',
                  borderRadius: 9,
                  appearance: 'none',
                  cursor: 'pointer',
                }}
              >
                <option value="">Todos los productores</option>
                {PRODUCTORES_LIST.map(pr => (
                  <option key={pr.id} value={pr.id}>
                    {pr.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <span key={i} className="skel" style={{ width: '100%', height: 64, borderRadius: 'var(--radius)' }} />
            ))}
          </div>
        ) : error ? (
          <div style={{ padding: 50, textAlign: 'center', color: 'var(--red-ink)', fontSize: 13.5 }}>
            No pudimos cargar los vencimientos.{' '}
            <button onClick={() => listQ.refetch()} style={{ color: 'var(--orange-ink)', fontWeight: 600 }}>
              Reintentar
            </button>
          </div>
        ) : total === 0 ? (
          <div style={{ padding: 60, textAlign: 'center', color: 'var(--ink-3)', fontSize: 14 }}>
            Sin vencimientos en este filtro. Horizonte despejado.
          </div>
        ) : (
          <div style={{ position: 'relative' }}>
            {/* the course spine */}
            <div
              style={{
                position: 'absolute',
                left: isMobile ? 39 : 71,
                top: 10,
                bottom: 10,
                width: 2,
                background: 'linear-gradient(var(--hair), var(--hair-2))',
              }}
            />

            {groups.map(g => (
              <div key={g.key} style={{ marginBottom: 8 }}>
                {/* month marker */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: isMobile ? 10 : 18,
                    marginBottom: 4,
                    marginTop: 14,
                  }}
                >
                  <div style={{ width: isMobile ? 40 : 54, textAlign: 'right', flexShrink: 0 }}>
                    <div
                      className="font-display"
                      style={{ fontSize: isMobile ? 16 : 20, lineHeight: 1, color: 'var(--ink)' }}
                    >
                      {MES[g.month]}
                    </div>
                    <div className="font-mono" style={{ fontSize: 10, color: 'var(--ink-3)' }}>
                      {g.year}
                    </div>
                  </div>
                  <div
                    style={{
                      width: 14,
                      height: 14,
                      borderRadius: 99,
                      background: 'var(--panel)',
                      border: '2px solid var(--ink-3)',
                      flexShrink: 0,
                      zIndex: 2,
                    }}
                  />
                  <div style={{ flex: 1, height: 1, background: 'var(--hair-2)' }} />
                  {!isMobile && (
                    <span className="eyebrow">
                      {MESL[g.month]} · {g.items.length} {g.items.length === 1 ? 'póliza' : 'pólizas'}
                    </span>
                  )}
                </div>

                {/* waypoints */}
                <div style={{ paddingLeft: isMobile ? 50 : 90 }}>
                  {g.items.map(p => {
                    const tone = urgencyTone(p.days);
                    const dotColor = {
                      red: 'var(--red)',
                      orange: 'var(--orange)',
                      amber: 'var(--amber)',
                      emerald: 'var(--emerald)',
                    }[tone];
                    if (isMobile) {
                      return (
                        <div
                          key={p.id}
                          onClick={() => go('detail', { id: p.id })}
                          style={{
                            padding: 13,
                            margin: '8px 0',
                            background: 'var(--panel)',
                            border: '1px solid var(--hair)',
                            borderRadius: 'var(--radius)',
                            boxShadow: 'var(--shadow-sm)',
                            cursor: 'pointer',
                            position: 'relative',
                          }}
                        >
                          <span
                            style={{
                              position: 'absolute',
                              left: -22,
                              top: 20,
                              width: 9,
                              height: 9,
                              borderRadius: 99,
                              background: dotColor,
                              zIndex: 2,
                              boxShadow: '0 0 0 3px var(--paper)',
                            }}
                          />
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 9 }}>
                            <RamoGlyph ramo={p.ramo} size={32} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ink)' }}>{p.client}</div>
                              <div className="font-mono" style={{ fontSize: 11, color: 'var(--ink-3)' }}>
                                {p.insurer} · {p.ramo}
                              </div>
                            </div>
                          </div>
                          <div
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}
                          >
                            <Pill tone={tone} dot>
                              {p.days <= 0 ? 'Vencida' : `en ${p.days} d`}
                            </Pill>
                            <span className="font-mono tnum" style={{ fontSize: 12, color: 'var(--ink-2)' }}>
                              {ars(p.prima)}
                            </span>
                          </div>
                        </div>
                      );
                    }
                    return (
                      <div
                        key={p.id}
                        onClick={() => go('detail', { id: p.id })}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 14,
                          padding: '12px 16px',
                          margin: '8px 0',
                          background: 'var(--panel)',
                          border: '1px solid var(--hair)',
                          borderRadius: 'var(--radius)',
                          boxShadow: 'var(--shadow-sm)',
                          cursor: 'pointer',
                          position: 'relative',
                          transition: 'transform .14s, border-color .14s',
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.transform = 'translateX(3px)';
                          e.currentTarget.style.borderColor = dotColor;
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.transform = 'none';
                          e.currentTarget.style.borderColor = 'var(--hair)';
                        }}
                      >
                        <span
                          style={{
                            position: 'absolute',
                            left: -25,
                            top: '50%',
                            marginTop: -5,
                            width: 10,
                            height: 10,
                            borderRadius: 99,
                            background: dotColor,
                            zIndex: 2,
                            boxShadow: '0 0 0 3px var(--paper)',
                          }}
                        />
                        <RamoGlyph ramo={p.ramo} size={38} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>{p.client}</div>
                          <div className="font-mono" style={{ fontSize: 11.5, color: 'var(--ink-3)', marginTop: 2 }}>
                            {p.num} · {p.insurer} · {p.ramo}
                            {p.paymentMethod ? ` · ${p.paymentMethod}` : ''}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right', width: 130 }}>
                          <div className="font-mono tnum" style={{ fontSize: 12.5, color: 'var(--ink-2)' }}>
                            {p.renew}
                          </div>
                          <div className="font-mono tnum" style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>
                            {ars(p.prima)}
                          </div>
                        </div>
                        <Pill tone={tone} dot style={{ width: 96, justifyContent: 'center' }}>
                          {p.days <= 0 ? 'Vencida' : `en ${p.days} d`}
                        </Pill>
                        {/* La renovación se gestiona en el portal de cada compañía: acá solo se navega a la póliza. */}
                        <Btn
                          size="sm"
                          variant="ghost"
                          iconRight="arrowRight"
                          onClick={e => {
                            e.stopPropagation();
                            go('detail', { id: p.id });
                          }}
                        >
                          Ver póliza
                        </Btn>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* paginación */}
        {!loading && !error && total > 0 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              marginTop: 20,
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
                onClick={() => setOffset(o => Math.max(0, o - VENC_LIMIT))}
                style={{ opacity: offset <= 0 ? 0.4 : 1, pointerEvents: offset <= 0 ? 'none' : 'auto' }}
              >
                Anterior
              </Btn>
              <Btn
                size="sm"
                variant="ghost"
                iconRight="chevronRight"
                onClick={() => setOffset(o => o + VENC_LIMIT)}
                style={{ opacity: to >= total ? 0.4 : 1, pointerEvents: to >= total ? 'none' : 'auto' }}
              >
                Siguiente
              </Btn>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

Object.assign(window, { ScreenVencimientos });
