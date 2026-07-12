/* ============================================================
   RUMBO — Pre-denuncias (sección interna) — Slice 1
   Lo que entra por el formulario público (/d/:slug) aterriza acá:
   KPIs por estado, lista filtrable, detalle con Convertir (pólizas
   sugeridas rankeadas) / Rechazar (motivo opcional), y el modal
   "Compartir link" con el link público de cada productor (copiar/rotar).
   ============================================================ */

const INTAKE_STATUS_TONE = { pendiente: 'amber', convertida: 'emerald', rechazada: 'red', vencida: 'neutral' };

function pdFechaHora(iso) {
  const d = new Date(iso);
  return (
    d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' }) +
    ' ' +
    d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
  );
}

/* ---------- Modal compartir links por productor ---------- */
function ShareIntakeLinksDrawer({ open, onClose }) {
  const linksQ = useApiQuery(['intake-links'], () => window.rumboApi.intakeLinks(), { enabled: open });
  const rows = linksQ.data?.data ?? [];
  const [busy, setBusy] = useState(false);
  const refetch = () => linksQ.refetch();

  const publicUrl = slug => `${window.location.origin}/d/${slug}`;
  const copy = slug => {
    navigator.clipboard
      .writeText(publicUrl(slug))
      .then(() => window.rumboUI?.toast?.('Link copiado'))
      .catch(() => window.rumboUI?.toast?.('No se pudo copiar'));
  };
  const generar = producerId => {
    setBusy(true);
    window.rumboApi
      .createIntakeLink(producerId)
      .then(() => {
        window.rumboUI?.toast?.('Link generado');
        refetch();
      })
      .catch(e => window.rumboUI?.toast?.(e.message))
      .finally(() => setBusy(false));
  };
  const rotar = linkId => {
    if (!window.confirm('¿Rotar el link? El link actual deja de funcionar al instante.')) return;
    setBusy(true);
    window.rumboApi
      .rotateIntakeLink(linkId)
      .then(() => {
        window.rumboUI?.toast?.('Link rotado — el anterior quedó inválido');
        refetch();
      })
      .catch(e => window.rumboUI?.toast?.(e.message))
      .finally(() => setBusy(false));
  };

  return (
    <Drawer open={open} onClose={onClose} eyebrow="Pre-denuncias" title="Compartir link" width={560}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, opacity: busy ? 0.6 : 1 }}>
        <div style={{ fontSize: 12.5, color: 'var(--ink-3)', lineHeight: 1.55 }}>
          Cada productor tiene un link público permanente: compartilo con tus asegurados (WhatsApp, firma del email) y
          las pre-denuncias entran solas a su cartera. Si un link se filtra, rotalo y el anterior muere al instante.
        </div>
        {linksQ.isPending ? (
          <span className="skel" style={{ display: 'block', width: '100%', height: 120, borderRadius: 10 }} />
        ) : rows.length === 0 ? (
          <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--ink-3)', fontSize: 13 }}>
            Sin productores.
          </div>
        ) : (
          rows.map((r, i) => (
            <div
              key={r.producerId}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '11px 0',
                borderBottom: i === rows.length - 1 ? 'none' : '1px solid var(--hair-2)',
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 600 }}>
                  {r.producerName}
                  {r.isSelf && (
                    <Pill tone="orange" style={{ fontSize: 9.5, padding: '1px 6px', marginLeft: 8 }}>
                      Organizador
                    </Pill>
                  )}
                </div>
                {r.slug ? (
                  <div
                    className="font-mono"
                    style={{
                      fontSize: 11,
                      color: 'var(--ink-3)',
                      marginTop: 3,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {publicUrl(r.slug)}
                  </div>
                ) : (
                  <div style={{ fontSize: 11.5, color: 'var(--ink-3)', marginTop: 3 }}>Sin link todavía.</div>
                )}
              </div>
              {r.slug ? (
                <>
                  <Btn size="sm" variant="soft" icon="copy" onClick={() => copy(r.slug)}>
                    Copiar
                  </Btn>
                  <Btn size="sm" variant="ghost" icon="refresh" onClick={() => rotar(r.linkId)}>
                    Rotar
                  </Btn>
                </>
              ) : (
                <Btn size="sm" variant="primary" icon="plus" onClick={() => generar(r.producerId)}>
                  Generar
                </Btn>
              )}
            </div>
          ))
        )}
      </div>
    </Drawer>
  );
}

/* ---------- Drawer detalle + Convertir / Rechazar (Slice 2) ---------- */
function IntakeDetailDrawer({ id, onClose }) {
  const q = useApiQuery(['intake', id], () => window.rumboApi.intakeById(id), { enabled: Boolean(id) });
  const d = q.data ?? null;
  const dec = d?.declarante ?? {};
  const ase = d?.aseguradoDeclarado ?? {};
  const inc = d?.incidente ?? {};
  const tercero = dec.tercero;

  // Modo del pie del drawer: ver | convertir (elegir póliza) | rechazar (motivo).
  const [mode, setMode] = useState('view');
  const [polSel, setPolSel] = useState(null); // póliza sugerida elegida (id)
  const [polPicker, setPolPicker] = useState(null); // fila del SearchPicker (fallback)
  const [importance, setImportance] = useState('');
  const [motivo, setMotivo] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    setMode('view');
    setPolSel(null);
    setPolPicker(null);
    setImportance('');
    setMotivo('');
  }, [id]);

  const refreshAll = () => {
    window.queryClient.invalidateQueries({ queryKey: ['intakes'] });
    q.refetch();
  };
  const policyId = polSel || (polPicker && polPicker.id) || '';
  const convertir = () => {
    if (!policyId || busy) return;
    setBusy(true);
    window.rumboApi
      .convertIntake(id, { policyId, ...(importance ? { importance } : {}) })
      .then(r => {
        window.rumboUI?.toast?.('Siniestro creado desde la pre-denuncia');
        refreshAll();
        setMode('view');
        if (r.claimId) window.rumboUI?.openClaim?.(r.claimId);
      })
      .catch(e => window.rumboUI?.toast?.(e.message))
      .finally(() => setBusy(false));
  };
  const rechazar = () => {
    if (busy) return;
    setBusy(true);
    window.rumboApi
      .rejectIntake(id, motivo.trim())
      .then(() => {
        window.rumboUI?.toast?.('Pre-denuncia rechazada');
        refreshAll();
        setMode('view');
      })
      .catch(e => window.rumboUI?.toast?.(e.message))
      .finally(() => setBusy(false));
  };
  // Alta rápida del declarado como prospecto (glue sobre el alta existente):
  // útil cuando no hubo match y el PAS quiere quedarse con el contacto.
  const crearEnCartera = () => {
    if (busy) return;
    setBusy(true);
    const docStr = String(ase.doc || '');
    window.rumboApi
      .createContact({
        kind: 'PERSONA_FISICA',
        lastName: ase.nombre || 'Sin nombre',
        firstName: '',
        ...(docStr.length === 11 ? { cuit: docStr } : { dni: docStr }),
        phone: ase.telefono || '',
        city: '',
        notes: `Creado desde la pre-denuncia N° ${d?.number}`,
      })
      .then(() => window.rumboUI?.toast?.('Prospecto creado en la cartera'))
      .catch(e => window.rumboUI?.toast?.(e.message))
      .finally(() => setBusy(false));
  };

  const row = (label, value) =>
    value ? (
      <div style={{ display: 'flex', gap: 10, fontSize: 13, padding: '5px 0' }}>
        <span style={{ width: 120, flexShrink: 0, color: 'var(--ink-3)', fontSize: 12 }}>{label}</span>
        <span style={{ color: 'var(--ink)', minWidth: 0 }}>{value}</span>
      </div>
    ) : null;

  return (
    <Drawer
      open={Boolean(id)}
      onClose={onClose}
      eyebrow="Pre-denuncia"
      title={d ? `N° ${d.number} · ${d.statusLabel}` : 'Cargando…'}
      width={560}
    >
      {!d ? (
        <span className="skel" style={{ display: 'block', width: '100%', height: 200, borderRadius: 10 }} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Pill tone={INTAKE_STATUS_TONE[d.status] || 'neutral'} dot>
              {d.statusLabel}
            </Pill>
            <Pill tone="neutral">{inc.ramoLabel}</Pill>
            {d.matchedContactId ? (
              <Pill tone="emerald" style={{ fontSize: 10.5 }}>
                Contacto en cartera ✓
              </Pill>
            ) : (
              <Pill tone="amber" style={{ fontSize: 10.5 }}>
                Sin match en cartera
              </Pill>
            )}
            {d.matchedPolicyId && (
              <Pill tone="emerald" style={{ fontSize: 10.5 }}>
                Póliza sugerida ✓
              </Pill>
            )}
          </div>

          <div>
            <SectionHead label="Asegurado (declarado)" />
            {row('Nombre', ase.nombre || d.matchedContactName || '—')}
            {row('Documento', ase.doc)}
            {row('Teléfono', ase.telefono)}
            {row('Email', ase.email)}
            {d.matchedContactName && ase.nombre && row('En cartera como', d.matchedContactName)}
          </div>

          <div>
            <SectionHead label="Quién completó" />
            {tercero
              ? row(
                  'Un tercero',
                  `${tercero.nombre} ${tercero.apellido} · DNI ${tercero.dni} · ${tercero.email}${tercero.telefono ? ` · ${tercero.telefono}` : ''}`,
                )
              : row('Declarante', 'El asegurado')}
          </div>

          <div>
            <SectionHead label="Incidente" />
            {row('Qué pasó', `${inc.tipoLabel} (${inc.ramoLabel})`)}
            {row('Cuándo', `${inc.fecha} ${inc.hora}`)}
            {row('Dónde', [inc.direccion, inc.localidad, inc.provincia].filter(Boolean).join(', '))}
            {row('Bien / patente', inc.bien)}
            {row('Productor', d.producerName)}
            {row('Recibida', pdFechaHora(d.submittedAt))}
          </div>

          <div>
            <SectionHead label="Relato" />
            <div style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
              {inc.relato}
            </div>
          </div>

          {/* Acciones según estado */}
          {d.status === 'convertida' && d.convertedClaimId && (
            <Btn
              variant="soft"
              icon="shield"
              onClick={() => window.rumboUI?.openClaim?.(d.convertedClaimId)}
              style={{ width: '100%', justifyContent: 'center' }}
            >
              Ver siniestro creado
            </Btn>
          )}
          {d.status === 'rechazada' && d.rejectReason && row('Motivo del rechazo', d.rejectReason)}

          {d.status === 'pendiente' && mode === 'view' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {!d.matchedContactId && (
                <Btn
                  size="sm"
                  variant="ghost"
                  icon="plus"
                  onClick={crearEnCartera}
                  style={{ width: '100%', justifyContent: 'center', opacity: busy ? 0.5 : 1 }}
                >
                  Crear al declarado como prospecto en la cartera
                </Btn>
              )}
              <div style={{ display: 'flex', gap: 10 }}>
                <Btn variant="ghost" onClick={() => setMode('reject')} style={{ flex: 1, justifyContent: 'center' }}>
                  Rechazar
                </Btn>
                <Btn
                  variant="primary"
                  iconRight="arrowRight"
                  onClick={() => setMode('convert')}
                  style={{ flex: 2, justifyContent: 'center' }}
                >
                  Convertir a siniestro
                </Btn>
              </div>
            </div>
          )}

          {d.status === 'pendiente' && mode === 'convert' && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
                padding: '14px 14px 16px',
                borderRadius: 10,
                background: 'var(--panel-2)',
                border: '1px solid var(--hair)',
              }}
            >
              <span className="eyebrow">Póliza del siniestro</span>
              {(d.suggestedPolicies || []).length > 0 ? (
                (d.suggestedPolicies || []).map(p => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setPolSel(p.id);
                      setPolPicker(null);
                    }}
                    style={{
                      textAlign: 'left',
                      padding: '10px 12px',
                      borderRadius: 9,
                      border: `1px solid ${polSel === p.id ? 'var(--orange)' : 'var(--hair)'}`,
                      background: polSel === p.id ? 'var(--orange-soft)' : 'var(--panel)',
                      cursor: 'pointer',
                    }}
                  >
                    <div className="font-mono" style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ink)' }}>
                      {p.insurer} — {p.num || 'sin nº'}
                    </div>
                    <div
                      style={{
                        fontSize: 11.5,
                        color: 'var(--ink-3)',
                        marginTop: 2,
                        display: 'flex',
                        gap: 6,
                        alignItems: 'center',
                      }}
                    >
                      {p.ramo} · {p.status}
                      {p.byPatente && (
                        <Pill tone="emerald" style={{ fontSize: 9.5, padding: '1px 6px' }}>
                          patente ✓
                        </Pill>
                      )}
                      {!p.byPatente && p.sameRamo && (
                        <Pill tone="amber" style={{ fontSize: 9.5, padding: '1px 6px' }}>
                          mismo ramo
                        </Pill>
                      )}
                    </div>
                  </button>
                ))
              ) : (
                <div style={{ fontSize: 12.5, color: 'var(--ink-3)' }}>
                  Sin pólizas sugeridas (no hubo match por documento ni patente). Buscala a mano:
                </div>
              )}
              <SearchPicker
                value={polPicker}
                onChange={row2 => {
                  setPolPicker(row2);
                  if (row2) setPolSel(null);
                }}
                fetcher={window.rumboApi.policiesPicker}
                format={p => `${p.num} · ${p.client}`}
                sub={p => `${p.insurer} · ${p.ramo}`}
                placeholder="Buscar otra póliza…"
              />
              <Field label="Prioridad" hint="opcional">
                <select
                  value={importance}
                  onChange={e => setImportance(e.target.value)}
                  style={{ ...inputStyle, appearance: 'none', cursor: 'pointer' }}
                >
                  <option value="">Sin priorizar</option>
                  <option value="alta">Alta</option>
                  <option value="media">Media</option>
                  <option value="baja">Baja</option>
                </select>
              </Field>
              <div style={{ display: 'flex', gap: 10 }}>
                <Btn variant="ghost" onClick={() => setMode('view')} style={{ flex: 1, justifyContent: 'center' }}>
                  Cancelar
                </Btn>
                <Btn
                  variant="primary"
                  icon="check"
                  onClick={convertir}
                  style={{
                    flex: 2,
                    justifyContent: 'center',
                    opacity: policyId && !busy ? 1 : 0.5,
                    pointerEvents: policyId && !busy ? 'auto' : 'none',
                  }}
                >
                  Crear siniestro
                </Btn>
              </div>
            </div>
          )}

          {d.status === 'pendiente' && mode === 'reject' && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
                padding: '14px 14px 16px',
                borderRadius: 10,
                background: 'var(--panel-2)',
                border: '1px solid var(--hair)',
              }}
            >
              <span className="eyebrow">Rechazar pre-denuncia</span>
              <div style={{ fontSize: 12.5, color: 'var(--ink-3)' }}>
                Es definitivo (no se puede deshacer). El motivo es opcional pero ayuda a medir la calidad del canal.
              </div>
              <textarea
                value={motivo}
                onChange={e => setMotivo(e.target.value)}
                rows={2}
                maxLength={500}
                placeholder="Duplicada, prueba, no corresponde…"
                style={{ ...inputStyle, resize: 'vertical', minHeight: 56 }}
              />
              <div style={{ display: 'flex', gap: 10 }}>
                <Btn variant="ghost" onClick={() => setMode('view')} style={{ flex: 1, justifyContent: 'center' }}>
                  Cancelar
                </Btn>
                <Btn
                  variant="primary"
                  onClick={rechazar}
                  style={{ flex: 1, justifyContent: 'center', background: 'var(--red)', opacity: busy ? 0.5 : 1 }}
                >
                  Rechazar
                </Btn>
              </div>
            </div>
          )}
        </div>
      )}
    </Drawer>
  );
}

/* ---------- Pantalla ---------- */
function ScreenPreDenuncias({ go }) {
  const isMobile = useIsMobile();
  const [status, setStatus] = useState('');
  const [producer, setProducer] = useState('');
  const [offset, setOffset] = useState(0);
  const [sel, setSel] = useState(null);
  const [shareOpen, setShareOpen] = useState(false);
  const PRODUCTORES_LIST = window.RUMBO_DATA?.PRODUCTORES ?? [];

  const listQ = useApiQuery(
    ['intakes', { status, producer, offset }],
    () => window.rumboApi.intakesPage({ status, producer, limit: 50, offset }),
    { keepPrevious: true },
  );
  const rows = listQ.data?.data ?? [];
  const total = listQ.data?.total ?? 0;
  const counts = listQ.data?.counts ?? { total: 0, pendientes: 0, convertidas: 0, rechazadas: 0 };

  const kpis = [
    { id: '', label: 'Total', n: counts.total, tone: 'var(--ink)' },
    { id: 'pendiente', label: 'Pendientes', n: counts.pendientes, tone: 'var(--amber-ink)' },
    { id: 'convertida', label: 'Convertidas', n: counts.convertidas, tone: 'var(--emerald-ink)' },
    { id: 'rechazada', label: 'Rechazadas', n: counts.rechazadas, tone: 'var(--red-ink)' },
  ];

  return (
    <div
      className="scroll rise"
      style={{ overflowY: 'auto', height: '100%', padding: isMobile ? '18px 16px 40px' : '30px 34px 60px' }}
    >
      <div style={{ maxWidth: 1080, margin: '0 auto' }}>
        <PageHead
          eyebrow="Siniestros · intake"
          tick={2}
          title="Pre-denuncias"
          sub="Lo que tus asegurados completan desde el link público, listo para revisar."
          actions={
            <>
              <Btn variant="ghost" icon="scroll" onClick={() => go('siniestros')}>
                Siniestros
              </Btn>
              <Btn variant="primary" icon="external" onClick={() => setShareOpen(true)}>
                Compartir link
              </Btn>
            </>
          }
        />

        {/* KPI cards = filtro por estado */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)',
            gap: 12,
            marginBottom: 18,
          }}
        >
          {kpis.map(k => {
            const active = status === k.id;
            return (
              <button
                key={k.label}
                onClick={() => {
                  setStatus(k.id);
                  setOffset(0);
                }}
                style={{
                  textAlign: 'left',
                  padding: '14px 16px',
                  borderRadius: 'var(--radius)',
                  border: `1px solid ${active ? 'var(--orange)' : 'var(--hair)'}`,
                  background: active ? 'var(--orange-soft)' : 'var(--panel)',
                  boxShadow: 'var(--shadow-sm)',
                  cursor: 'pointer',
                }}
              >
                <div className="font-display tnum" style={{ fontSize: 24, color: k.tone }}>
                  {k.n}
                </div>
                <div className="eyebrow" style={{ marginTop: 4 }}>
                  {k.label}
                </div>
              </button>
            );
          })}
        </div>

        {PRODUCTORES_LIST.length > 1 && (
          <div style={{ marginBottom: 14, maxWidth: 260 }}>
            <select
              value={producer}
              onChange={e => {
                setProducer(e.target.value);
                setOffset(0);
              }}
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

        <Panel pad={false} style={{ overflow: 'hidden' }}>
          {listQ.isPending ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} style={{ padding: '14px 16px', borderBottom: '1px solid var(--hair-2)' }}>
                <span className="skel" style={{ display: 'block', width: '70%', height: 14 }} />
              </div>
            ))
          ) : listQ.error ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--red-ink)', fontSize: 13.5 }}>
              No pudimos cargar las pre-denuncias.{' '}
              <button onClick={() => listQ.refetch()} style={{ color: 'var(--orange-ink)', fontWeight: 600 }}>
                Reintentar
              </button>
            </div>
          ) : rows.length === 0 ? (
            <div style={{ padding: 50, textAlign: 'center', color: 'var(--ink-3)' }}>
              <Icon name="shield" size={24} stroke={1.7} />
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink-2)', marginTop: 10 }}>
                Sin pre-denuncias en este filtro
              </div>
              <div style={{ fontSize: 12.5, marginTop: 4, marginBottom: 14 }}>
                Compartí el link público con tus asegurados y lo que completen aparece acá.
              </div>
              <Btn
                size="sm"
                variant="primary"
                icon="external"
                onClick={() => setShareOpen(true)}
                style={{ margin: '0 auto' }}
              >
                Compartir link
              </Btn>
            </div>
          ) : (
            rows.map((r, i) => (
              <div
                key={r.id}
                onClick={() => setSel(r.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '13px 16px',
                  borderBottom: i === rows.length - 1 ? 'none' : '1px solid var(--hair-2)',
                  cursor: 'pointer',
                  transition: 'background .12s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--panel-2)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <Pill
                  tone={INTAKE_STATUS_TONE[r.status] || 'neutral'}
                  dot
                  style={{ width: 104, justifyContent: 'center', flexShrink: 0 }}
                >
                  {r.statusLabel}
                </Pill>
                <span
                  className="font-mono tnum"
                  style={{ fontSize: 12.5, color: 'var(--ink-3)', width: 52, flexShrink: 0 }}
                >
                  N° {r.number}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 13.5,
                      fontWeight: 600,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {r.nombre}
                  </div>
                  <div className="font-mono" style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>
                    {r.tipoLabel} · {r.ramoLabel}
                    {r.producerName ? ` · ${r.producerName}` : ''}
                  </div>
                </div>
                {!isMobile && (
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div className="font-mono tnum" style={{ fontSize: 12, color: 'var(--ink-2)' }}>
                      {pdFechaHora(r.submittedAt)}
                    </div>
                    <div className="font-mono tnum" style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>
                      siniestro: {r.fechaSiniestro || '—'}
                    </div>
                  </div>
                )}
                <Icon name="chevronRight" size={16} style={{ color: 'var(--ink-3)', flexShrink: 0 }} />
              </div>
            ))
          )}
        </Panel>

        {total > 50 && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 14 }}>
            <Btn
              size="sm"
              variant="ghost"
              onClick={() => setOffset(o => Math.max(0, o - 50))}
              style={{ opacity: offset <= 0 ? 0.4 : 1, pointerEvents: offset <= 0 ? 'none' : 'auto' }}
            >
              Anterior
            </Btn>
            <Btn
              size="sm"
              variant="ghost"
              iconRight="chevronRight"
              onClick={() => setOffset(o => o + 50)}
              style={{ opacity: offset + 50 >= total ? 0.4 : 1, pointerEvents: offset + 50 >= total ? 'none' : 'auto' }}
            >
              Siguiente
            </Btn>
          </div>
        )}
      </div>

      <ShareIntakeLinksDrawer open={shareOpen} onClose={() => setShareOpen(false)} />
      <IntakeDetailDrawer id={sel} onClose={() => setSel(null)} />
    </div>
  );
}

Object.assign(window, { ScreenPreDenuncias });
