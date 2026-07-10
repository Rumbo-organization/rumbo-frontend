/* ============================================================
   RUMBO — Póliza detail
   ============================================================ */
function StatChip({ label, value, mono = true, tone }) {
  return (
    <div style={{ padding: '0 18px 12px', borderLeft: '1px solid var(--hair)', flex: '1 1 45%', minWidth: 130 }}>
      <div className="eyebrow" style={{ marginBottom: 6 }}>
        {label}
      </div>
      <div
        className={mono ? 'font-mono tnum' : ''}
        style={{ fontSize: 15, fontWeight: 600, color: tone || 'var(--ink)' }}
      >
        {value}
      </div>
    </div>
  );
}

function CuotaRow({ c, last, onToggle }) {
  const { ars } = window.rumboFmt;
  const isMobile = useIsMobile();
  const map = {
    Pagada: { tone: 'emerald', icon: 'check' },
    Vencida: { tone: 'red', icon: 'alert' },
    'Por vencer': { tone: 'orange', icon: 'clock' },
    Programada: { tone: 'neutral', icon: 'dot' },
  };
  const m = map[c.status];
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: isMobile ? 8 : 14,
        padding: '11px 0',
        borderBottom: last ? 'none' : '1px solid var(--hair-2)',
      }}
    >
      <button
        onClick={onToggle}
        title={c.paid ? 'Marcar impaga' : 'Marcar pagada'}
        style={{
          width: 26,
          height: 26,
          borderRadius: 7,
          flexShrink: 0,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: onToggle ? 'pointer' : 'default',
          background:
            c.status === 'Vencida'
              ? 'var(--red-soft)'
              : c.status === 'Pagada'
                ? 'var(--emerald-soft)'
                : 'var(--panel-2)',
          color:
            c.status === 'Vencida' ? 'var(--red-ink)' : c.status === 'Pagada' ? 'var(--emerald-ink)' : 'var(--ink-3)',
          border: '1px solid var(--hair)',
        }}
      >
        <Icon name={m.icon} size={13} stroke={2.2} />
      </button>
      <span
        className="font-mono tnum"
        style={{ fontSize: 12, color: 'var(--ink-3)', width: isMobile ? 44 : 56, flexShrink: 0 }}
      >
        {isMobile ? c.cuota : `Cuota ${c.cuota}`}
      </span>
      <span className="font-mono tnum" style={{ fontSize: 12, color: 'var(--ink-2)', flex: 1, minWidth: 0 }}>
        {c.date}
      </span>
      {!isMobile && (
        <Pill tone={m.tone} style={{ fontSize: 10.5 }}>
          {c.status}
        </Pill>
      )}
      <span
        className="font-mono tnum"
        style={{
          fontSize: 12.5,
          fontWeight: 600,
          color: c.status === 'Vencida' ? 'var(--red-ink)' : 'var(--ink)',
          width: isMobile ? 84 : 120,
          textAlign: 'right',
          flexShrink: 0,
        }}
      >
        {ars(c.amount)}
      </span>
    </div>
  );
}

/* Editar la póliza: SOLO observaciones y forma de pago (el resto se importa de
   la aseguradora, read-only). PATCH /policies/:id → rumboRefresh re-hidrata. */
const PAYMENT_OPTIONS = [
  ['', 'Sin dato'],
  ['cupon', 'Cupón'],
  ['debito_bancario', 'Débito bancario'],
  ['tarjeta_credito', 'Tarjeta de crédito'],
];
// El BFF manda la forma de pago como label de display: volver al valor de enum
// para precargar el select.
const PAYMENT_LABEL_TO_VALUE = {
  Cupón: 'cupon',
  'Débito bancario': 'debito_bancario',
  'Tarjeta de crédito': 'tarjeta_credito',
};

function PolicyEditDrawer({ open, onClose, policy }) {
  const [notes, setNotes] = useState('');
  const [payment, setPayment] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  useEffect(() => {
    if (open) {
      setNotes(policy.coverage && policy.coverage !== '—' ? policy.coverage : '');
      setPayment(PAYMENT_LABEL_TO_VALUE[policy.paymentMethod] || '');
      setError(null);
    }
  }, [open, policy]);
  const submit = () => {
    if (saving) return;
    setSaving(true);
    setError(null);
    window.rumboApi
      .updatePolicy(policy.id, { notes, paymentMethod: payment || null })
      .then(() => {
        window.rumboUI?.toast?.('Póliza actualizada');
        if (window.rumboRefresh) window.rumboRefresh();
        onClose();
      })
      .catch(e => setError(e.message))
      .finally(() => setSaving(false));
  };
  return (
    <Drawer
      open={open}
      onClose={onClose}
      eyebrow="Póliza"
      title="Editar póliza"
      width={480}
      footer={
        <>
          <Btn variant="ghost" onClick={onClose}>
            Cancelar
          </Btn>
          <Btn
            variant="primary"
            icon="check"
            onClick={submit}
            style={{ opacity: saving ? 0.5 : 1, pointerEvents: saving ? 'none' : 'auto' }}
          >
            Guardar
          </Btn>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ fontSize: 12.5, color: 'var(--ink-3)' }}>
          Las pólizas se importan de las aseguradoras. Acá editás tus observaciones internas y la forma de pago.
        </div>
        <Field label="Forma de pago">
          <select
            value={payment}
            onChange={e => setPayment(e.target.value)}
            style={{ ...inputStyle, appearance: 'none', cursor: 'pointer' }}
          >
            {PAYMENT_OPTIONS.map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Observaciones">
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={6}
            maxLength={4000}
            style={{ ...inputStyle, resize: 'vertical', minHeight: 140 }}
            placeholder="Notas internas de la póliza…"
          />
        </Field>
        {error && <div style={{ fontSize: 12.5, color: 'var(--red-ink)' }}>{error}</div>}
      </div>
    </Drawer>
  );
}

function ScreenDetail({ go, params }) {
  const { ars, daysFrom } = window.rumboFmt;
  const isMobile = useIsMobile();
  // Datos en vivo por id vía GET /policies/:id/detail (Fase 3: sin RUMBO_DATA.
  // POLICIES/CONTACTS, que vienen capados a 1000/500 en el bootstrap). RLS: un
  // id ajeno devuelve 404. TanStack Query: rumboRefresh() invalida tras
  // gestionar un siniestro / editar observaciones; los paneles usan refetch().
  const id = params && params.id;
  const [editOpen, setEditOpen] = useState(false);
  const [wspOpen, setWspOpen] = useState(false);

  const detailQ = useApiQuery(['policy-detail', id], () => window.rumboApi.policyDetail(id), { enabled: Boolean(id) });
  const data = detailQ.data ?? null;
  const loading = detailQ.isLoading;
  const error = detailQ.error || (!id ? { status: 400, message: 'Falta la póliza.' } : null);
  const refetch = () => detailQ.refetch();

  if (loading) return <DetailSkeleton isMobile={isMobile} />;
  if (error || !data) {
    const notFound = error && error.status === 404;
    return (
      <div
        className="scroll rise"
        style={{
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 40,
          color: 'var(--ink-3)',
        }}
      >
        <div style={{ textAlign: 'center', maxWidth: 420 }}>
          <Icon name="scroll" size={26} stroke={1.7} style={{ color: 'var(--ink-3)' }} />
          <div style={{ fontSize: 14, marginTop: 10 }}>
            {notFound ? 'Póliza no encontrada.' : (error && error.message) || 'No pudimos cargar la póliza.'}
          </div>
          <Btn size="sm" variant="ghost" onClick={() => go('polizas')} style={{ margin: '12px auto 0' }}>
            Ver pólizas
          </Btn>
        </div>
      </div>
    );
  }

  const p = data.policy;
  // El contacto puede faltar (póliza sin contactId): derivamos un fallback
  // desde el nombre de la póliza en vez de crashear.
  const contact = data.contact || {
    initials:
      (p.client || '—')
        .replace(/,/g, '')
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map(w => w[0])
        .join('')
        .toUpperCase() || '—',
    name: p.client || '—',
    kind: '—',
    since: '—',
    phone: '—',
    city: '—',
  };
  // Plan de pagos REAL (policy_installments del backend). Antes se proyectaba
  // desde prima/frecuencia: números inventados con cartera real.
  const sched = data.installments || [];
  const days = daysFrom(p.renew);
  const claims = data.siniestros;
  const cross = data.crosssell;
  const acts = data.activity;
  const paid = sched.filter(c => c.status === 'Pagada').length;
  const overdue = sched.filter(c => c.status === 'Vencida');

  return (
    <div
      className="scroll rise"
      style={{ overflowY: 'auto', height: '100%', padding: isMobile ? '18px 16px 40px' : '30px 34px 60px' }}
    >
      <div style={{ maxWidth: 1180, margin: '0 auto' }}>
        <PolicyEditDrawer open={editOpen} onClose={() => setEditOpen(false)} policy={p} />
        <WhatsAppDialog
          open={wspOpen}
          onClose={() => setWspOpen(false)}
          policyId={p.id}
          contact={data.contact ? { id: data.contact.id, name: data.contact.name, phone: data.contact.phone } : null}
        />

        {/* renewal banner */}
        {days <= 30 && (
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              gap: 14,
              padding: '14px 18px',
              borderRadius: 'var(--radius)',
              background: 'var(--orange-soft)',
              border: '1px solid var(--orange-soft2)',
              marginBottom: 20,
            }}
          >
            <Icon name="compass" size={22} style={{ color: 'var(--orange-ink)' }} />
            <div style={{ flex: '1 1 200px' }}>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--orange-ink)' }}>
                Renovación en {days} días
              </div>
              <div style={{ fontSize: 12.5, color: 'var(--orange-ink)', opacity: 0.85 }}>
                Esta póliza renueva el {p.renew}. La renovación se gestiona en el portal de {p.insurer}.
              </div>
            </div>
          </div>
        )}

        {/* header */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', gap: 18, marginBottom: 20 }}>
          <RamoGlyph ramo={p.ramo} size={54} />
          <div style={{ flex: '1 1 240px', minWidth: 0 }}>
            <div className="tick-row" style={{ marginBottom: 8 }}>
              <span className="font-mono" style={{ fontSize: 12, color: 'var(--ink-3)' }}>
                {p.num}
              </span>
              <Pill tone="emerald" dot>
                {p.status}
              </Pill>
            </div>
            <h1
              className="font-display"
              style={{ fontSize: isMobile ? 26 : 30, letterSpacing: '-0.02em', color: 'var(--ink)', lineHeight: 1.05 }}
            >
              {p.client}
            </h1>
            <div style={{ fontSize: 14, color: 'var(--ink-2)', marginTop: 5 }}>
              {p.detail} · {p.coverage}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap' }}>
            {data.contact && (
              <Btn variant="ghost" icon="whatsapp" onClick={() => setWspOpen(true)}>
                WhatsApp
              </Btn>
            )}
            <Btn variant="ghost" onClick={() => setEditOpen(true)}>
              Editar
            </Btn>
          </div>
        </div>

        {/* stat strip */}
        <Panel pad={false} style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', padding: '18px 0' }}>
            <div style={{ padding: '0 18px 12px 22px', flex: '1 1 45%', minWidth: 130 }}>
              <div className="eyebrow" style={{ marginBottom: 6 }}>
                Aseguradora
              </div>
              <div style={{ fontSize: 15, fontWeight: 600 }}>{p.insurer}</div>
            </div>
            <StatChip label="Ramo" value={p.ramo} mono={false} />
            <StatChip label="Prima" value={`${ars(p.prima)} / ${p.freq.toLowerCase()}`} />
            {p.sumaAseg && <StatChip label="Suma asegurada" value={ars(p.sumaAseg)} />}
            <StatChip label="Forma de pago" value={p.paymentMethod || 'Sin dato'} mono={false} />
            <StatChip label="Vigencia" value={`${p.start} → ${p.renew}`} />
          </div>
        </Panel>

        {/* body grid */}
        <div
          className="rgrid"
          style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 24, alignItems: 'start' }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* cuotas */}
            <Panel>
              <SectionHead
                label="Plan de pagos"
                sub={
                  sched.length === 0 ? (
                    'Sin plan de pagos cargado'
                  ) : (
                    <span>
                      <strong style={{ color: 'var(--emerald-ink)' }}>{paid} pagadas</strong>
                      {overdue.length > 0 && (
                        <>
                          {' '}
                          ·{' '}
                          <strong style={{ color: 'var(--red-ink)' }}>
                            {overdue.length} vencida{overdue.length > 1 ? 's' : ''}
                          </strong>
                        </>
                      )}
                    </span>
                  )
                }
                action={
                  <div style={{ display: 'flex', gap: 8 }}>
                    {overdue.length > 0 && data.contact && (
                      <Btn size="sm" variant="primary" icon="whatsapp" onClick={() => setWspOpen(true)}>
                        Reclamar
                      </Btn>
                    )}
                    <InstallmentsActions policyId={p.id} hasPlan={sched.length > 0} onChanged={refetch} />
                  </div>
                }
              />
              {sched.length === 0 ? (
                <div style={{ fontSize: 13, color: 'var(--ink-3)', padding: '6px 0' }}>
                  Las cuotas llegan con el import de la aseguradora, o generá el plan a mano.
                </div>
              ) : (
                <div style={{ maxHeight: 320, overflowY: 'auto' }} className="scroll">
                  {sched.map((c, i) => (
                    <CuotaRow
                      key={c.id || i}
                      c={c}
                      last={i === sched.length - 1}
                      onToggle={() =>
                        window.rumboApi
                          .setInstallmentPaid(c.id, !c.paid)
                          .then(refetch)
                          .catch(e => window.rumboUI?.toast?.(e.message))
                      }
                    />
                  ))}
                </div>
              )}
            </Panel>

            {/* endosos (Slice 4) */}
            <EndososPanel endosos={data.endosos || []} policyId={p.id} onChanged={refetch} />

            {/* linked claims */}
            <Panel>
              <SectionHead
                label="Siniestros vinculados"
                sub={claims.length ? `${claims.length} en esta póliza` : 'Sin siniestros'}
              />
              {claims.length === 0 ? (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '8px 0',
                    color: 'var(--emerald-ink)',
                    fontSize: 13.5,
                  }}
                >
                  <Icon name="check" size={16} /> Sin siniestros registrados. Rumbo despejado.
                </div>
              ) : (
                claims.map((s, i) => {
                  const stale = s.stale >= 10;
                  return (
                    <div
                      key={s.id}
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        alignItems: 'center',
                        gap: 13,
                        padding: '12px 0',
                        borderBottom: i === claims.length - 1 ? 'none' : '1px solid var(--hair-2)',
                      }}
                    >
                      <span
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: 9,
                          flexShrink: 0,
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: stale ? 'var(--red-soft)' : 'var(--panel-2)',
                          color: stale ? 'var(--red-ink)' : 'var(--ink-2)',
                          border: '1px solid var(--hair)',
                        }}
                      >
                        <Icon name={stale ? 'alert' : 'shield'} size={16} stroke={2} />
                      </span>
                      <div style={{ flex: '1 1 140px', minWidth: 0 }}>
                        <div style={{ fontSize: 13.5, fontWeight: 600 }}>{s.tipo}</div>
                        <div
                          className="font-mono"
                          style={{ fontSize: 11, color: stale ? 'var(--red-ink)' : 'var(--ink-3)', marginTop: 2 }}
                        >
                          {s.num} · {stale ? `sin movimiento ${s.stale} d` : 'abierto ' + s.opened}
                        </div>
                      </div>
                      <Pill tone={s.status === 'Abierto' ? 'amber' : s.status === 'Cerrado' ? 'emerald' : 'neutral'}>
                        {s.status}
                      </Pill>
                      {s.importance && (
                        <Pill
                          tone={s.importance === 'Alta' ? 'red' : s.importance === 'Media' ? 'amber' : 'neutral'}
                          style={{ fontSize: 10 }}
                        >
                          {s.importance}
                        </Pill>
                      )}
                      <Btn size="sm" variant="ghost" onClick={() => window.rumboUI?.openClaim(s.id)}>
                        Gestionar
                      </Btn>
                    </div>
                  );
                })
              )}
            </Panel>
          </div>

          {/* right */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* client */}
            <Panel>
              <SectionHead label="Asegurado" />
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                <Avatar initials={contact.initials} size={42} />
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600 }}>{contact.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>
                    {contact.kind} · asegurado desde {contact.since}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13, color: 'var(--ink-2)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                  <Icon name="phone" size={15} style={{ color: 'var(--ink-3)' }} />
                  <span className="font-mono">{contact.phone}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                  <Icon name="mapPin" size={15} style={{ color: 'var(--ink-3)' }} />
                  {contact.city}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                {data.contact && (
                  <Btn size="sm" variant="soft" icon="whatsapp" style={{ flex: 1 }} onClick={() => setWspOpen(true)}>
                    Mensaje
                  </Btn>
                )}
                <Btn
                  size="sm"
                  variant="soft"
                  icon="users"
                  style={{ flex: 1 }}
                  onClick={() => go('contacto', { id: p.contactId })}
                >
                  Ver ficha
                </Btn>
              </div>
            </Panel>

            {/* bien asegurado + personas + documentos (Slice 4) */}
            <RisksPanel risks={data.risks} />
            <PersonasPanel personas={data.personas || []} policyId={p.id} onChanged={refetch} />
            <DocumentsPanel docs={data.documentos || []} target={{ policyId: p.id }} onChanged={refetch} />

            {/* cross-sell */}
            {cross.length > 0 && (
              <Panel>
                <SectionHead
                  label="Cross-selling sugerido"
                  action={<Icon name="sparkles" size={16} style={{ color: 'var(--orange)' }} />}
                />
                {cross.map((x, i) => (
                  <div
                    key={x.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '10px 0',
                      borderBottom: i === cross.length - 1 ? 'none' : '1px solid var(--hair-2)',
                    }}
                  >
                    <RamoGlyph ramo={x.suggest} size={32} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 600 }}>Seguro de {x.suggest}</div>
                      <div style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>{x.reason}</div>
                    </div>
                    <Pill tone={x.score === 'Alta' ? 'emerald' : 'neutral'} style={{ fontSize: 10 }}>
                      {x.score}
                    </Pill>
                  </div>
                ))}
                <Btn size="sm" variant="soft" iconRight="arrowRight" style={{ marginTop: 14, width: '100%' }}>
                  Cotizar oportunidad
                </Btn>
              </Panel>
            )}

            {/* activity */}
            <Panel>
              <SectionHead label="Actividad" />
              <div style={{ position: 'relative', paddingLeft: 6 }}>
                {acts.length === 0 && (
                  <div style={{ fontSize: 13, color: 'var(--ink-3)' }}>Sin actividad registrada.</div>
                )}
                {acts.length > 0 && (
                  <div
                    style={{ position: 'absolute', left: 9, top: 6, bottom: 6, width: 2, background: 'var(--hair-2)' }}
                  />
                )}
                {acts.map((a, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      gap: 14,
                      paddingBottom: i === acts.length - 1 ? 0 : 16,
                      position: 'relative',
                    }}
                  >
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 99,
                        marginTop: 5,
                        flexShrink: 0,
                        zIndex: 1,
                        background:
                          a.kind === 'alert' ? 'var(--red)' : a.kind === 'note' ? 'var(--orange)' : 'var(--ink-3)',
                        boxShadow: '0 0 0 3px var(--panel)',
                      }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12.5, color: 'var(--ink)', lineHeight: 1.4 }}>{a.text}</div>
                      <div className="font-mono" style={{ fontSize: 10.5, color: 'var(--ink-3)', marginTop: 2 }}>
                        {a.who} · {a.when}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Panel>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Skeleton del detalle (con la forma del contenido real) ---------- */
function DetailSkeleton({ isMobile }) {
  const card = h => (
    <span className="skel" style={{ display: 'block', width: '100%', height: h, borderRadius: 'var(--radius-lg)' }} />
  );
  return (
    <div
      className="scroll"
      style={{ overflowY: 'auto', height: '100%', padding: isMobile ? '18px 16px 40px' : '30px 34px 60px' }}
    >
      <div style={{ maxWidth: 1180, margin: '0 auto' }}>
        {/* header */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', gap: 18, marginBottom: 20 }}>
          <span className="skel" style={{ width: 54, height: 54, borderRadius: 14, flexShrink: 0 }} />
          <div style={{ flex: '1 1 240px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <span className="skel" style={{ width: 120, height: 18, borderRadius: 99 }} />
              <span className="skel" style={{ width: 70, height: 18, borderRadius: 99 }} />
            </div>
            <span className="skel" style={{ width: isMobile ? 220 : 320, height: 30 }} />
            <span className="skel" style={{ width: 240, height: 14 }} />
          </div>
          {!isMobile && (
            <div style={{ display: 'flex', gap: 9 }}>
              <span className="skel" style={{ width: 110, height: 36, borderRadius: 9 }} />
              <span className="skel" style={{ width: 160, height: 36, borderRadius: 9 }} />
            </div>
          )}
        </div>
        {/* stat strip */}
        {card(86)}
        {/* body grid */}
        <div
          className="rgrid"
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '1.5fr 1fr',
            gap: 24,
            alignItems: 'start',
            marginTop: 24,
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {card(280)}
            {card(140)}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {card(200)}
            {card(160)}
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { ScreenDetail });
