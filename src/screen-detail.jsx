/* ============================================================
   RUMBO — Póliza detail
   ============================================================ */
function StatChip({ label, value, mono = true, tone }) {
  return (
    <div style={{ padding: '0 18px 12px', borderLeft: '1px solid var(--hair)', flex: '1 1 45%', minWidth: 130 }}>
      <div className="eyebrow" style={{ marginBottom: 6 }}>{label}</div>
      <div className={mono ? 'font-mono tnum' : ''} style={{ fontSize: 15, fontWeight: 600, color: tone || 'var(--ink)' }}>{value}</div>
    </div>
  );
}

function CuotaRow({ c, last }) {
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
    <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 14, padding: '11px 0', borderBottom: last ? 'none' : '1px solid var(--hair-2)' }}>
      <span style={{ width: 26, height: 26, borderRadius: 7, flexShrink: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        background: c.status === 'Vencida' ? 'var(--red-soft)' : c.status === 'Pagada' ? 'var(--emerald-soft)' : 'var(--panel-2)',
        color: c.status === 'Vencida' ? 'var(--red-ink)' : c.status === 'Pagada' ? 'var(--emerald-ink)' : 'var(--ink-3)',
        border: '1px solid var(--hair)' }}>
        <Icon name={m.icon} size={13} stroke={2.2} />
      </span>
      <span className="font-mono tnum" style={{ fontSize: 12, color: 'var(--ink-3)', width: isMobile ? 44 : 56, flexShrink: 0 }}>{isMobile ? c.cuota : `Cuota ${c.cuota}`}</span>
      <span className="font-mono tnum" style={{ fontSize: 12, color: 'var(--ink-2)', flex: 1, minWidth: 0 }}>{c.date}</span>
      {!isMobile && <Pill tone={m.tone} style={{ fontSize: 10.5 }}>{c.status}</Pill>}
      <span className="font-mono tnum" style={{ fontSize: 12.5, fontWeight: 600, color: c.status === 'Vencida' ? 'var(--red-ink)' : 'var(--ink)', width: isMobile ? 84 : 120, textAlign: 'right', flexShrink: 0 }}>{ars(c.amount)}</span>
    </div>
  );
}

/* Editar observaciones de la póliza (única edición: se importan de la
   aseguradora). PATCH /policies/:id → rumboRefresh re-hidrata el detalle. */
function PolicyNotesDrawer({ open, onClose, policy }) {
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  useEffect(() => {
    if (open) { setNotes(policy.coverage && policy.coverage !== '—' ? policy.coverage : ''); setError(null); }
  }, [open, policy]);
  const submit = () => {
    if (saving) return;
    setSaving(true); setError(null);
    window.rumboApi.updatePolicyNotes(policy.id, notes)
      .then(() => { window.rumboUI?.toast?.('Observaciones guardadas'); if (window.rumboRefresh) window.rumboRefresh(); onClose(); })
      .catch(e => setError(e.message)).finally(() => setSaving(false));
  };
  return (
    <Drawer open={open} onClose={onClose} eyebrow="Póliza" title="Editar observaciones" width={480}
      footer={<>
        <Btn variant="ghost" onClick={onClose}>Cancelar</Btn>
        <Btn variant="primary" icon="check" onClick={submit} style={{ opacity: saving ? 0.5 : 1, pointerEvents: saving ? 'none' : 'auto' }}>Guardar</Btn>
      </>}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ fontSize: 12.5, color: 'var(--ink-3)' }}>Las pólizas se importan de las aseguradoras. Acá solo editás tus observaciones internas.</div>
        <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={6} maxLength={4000} style={{ ...inputStyle, resize: 'vertical', minHeight: 140 }} placeholder="Notas internas de la póliza…" />
        {error && <div style={{ fontSize: 12.5, color: 'var(--red-ink)' }}>{error}</div>}
      </div>
    </Drawer>
  );
}

function ScreenDetail({ go, params }) {
  const { ars, scheduleFor, daysFrom } = window.rumboFmt;
  const isMobile = useIsMobile();
  // Datos en vivo por id vía GET /policies/:id/detail (Fase 3: sin RUMBO_DATA.
  // POLICIES/CONTACTS, que vienen capados a 1000/500 en el bootstrap). RLS: un
  // id ajeno devuelve 404. La versión bump-ea tras gestionar un siniestro /
  // editar observaciones (rumboRefresh) → refetch.
  const version = useRumboVersion();
  const id = params && params.id;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editOpen, setEditOpen] = useState(false);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    if (!id) { setError({ status: 400, message: 'Falta la póliza.' }); setLoading(false); return; }
    window.rumboApi.policyDetail(id)
      .then((d) => { if (alive) { setData(d); setLoading(false); } })
      .catch((e) => { if (alive) { setError(e); setLoading(false); } });
    return () => { alive = false; };
  }, [id, version]);

  if (loading) return <DetailSkeleton isMobile={isMobile} />;
  if (error || !data) {
    const notFound = error && error.status === 404;
    return (
      <div className="scroll rise" style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40, color: 'var(--ink-3)' }}>
        <div style={{ textAlign: 'center', maxWidth: 420 }}>
          <Icon name="scroll" size={26} stroke={1.7} style={{ color: 'var(--ink-3)' }} />
          <div style={{ fontSize: 14, marginTop: 10 }}>
            {notFound ? 'Póliza no encontrada.' : (error && error.message) || 'No pudimos cargar la póliza.'}
          </div>
          <Btn size="sm" variant="ghost" onClick={() => go('polizas')} style={{ margin: '12px auto 0' }}>Ver pólizas</Btn>
        </div>
      </div>
    );
  }

  const p = data.policy;
  // El contacto puede faltar (póliza sin contactId): derivamos un fallback
  // desde el nombre de la póliza en vez de crashear.
  const contact = data.contact || {
    initials: (p.client || '—').replace(/,/g, '').split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase() || '—',
    name: p.client || '—', kind: '—', since: '—', phone: '—', city: '—',
  };
  const sched = scheduleFor(p);
  const days = daysFrom(p.renew);
  const claims = data.siniestros;
  const cross = data.crosssell;
  const acts = data.activity;
  const paid = sched.filter(c => c.status === 'Pagada').length;
  const overdue = sched.filter(c => c.status === 'Vencida');

  return (
    <div className="scroll rise" style={{ overflowY: 'auto', height: '100%', padding: isMobile ? '16px 16px 40px' : '26px 34px 60px' }}>
      <div style={{ maxWidth: 1180, margin: '0 auto' }}>
        <PolicyNotesDrawer open={editOpen} onClose={() => setEditOpen(false)} policy={p} />

        {/* renewal banner */}
        {days <= 30 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 14, padding: '14px 18px', borderRadius: 'var(--radius)', background: 'var(--orange-soft)', border: '1px solid var(--orange-soft2)', marginBottom: 20 }}>
            <Icon name="compass" size={22} style={{ color: 'var(--orange-ink)' }} />
            <div style={{ flex: '1 1 200px' }}>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--orange-ink)' }}>Renovación en {days} días</div>
              <div style={{ fontSize: 12.5, color: 'var(--orange-ink)', opacity: 0.85 }}>Esta póliza renueva el {p.renew}. Marcá el rumbo antes de que venza.</div>
            </div>
            <Btn variant="primary" icon="refresh">Renovar póliza</Btn>
          </div>
        )}

        {/* header */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', gap: 18, marginBottom: 20 }}>
          <RamoGlyph ramo={p.ramo} size={54} />
          <div style={{ flex: '1 1 240px', minWidth: 0 }}>
            <div className="tick-row" style={{ marginBottom: 8 }}>
              <span className="font-mono" style={{ fontSize: 12, color: 'var(--ink-3)' }}>{p.num}</span>
              <Pill tone="emerald" dot>{p.status}</Pill>
            </div>
            <h1 className="font-display" style={{ fontSize: 30, letterSpacing: '-0.02em', color: 'var(--ink)', lineHeight: 1.05 }}>{p.client}</h1>
            <div style={{ fontSize: 14, color: 'var(--ink-2)', marginTop: 5 }}>{p.detail} · {p.coverage}</div>
          </div>
          <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap' }}>
            <Btn variant="ghost" icon="whatsapp">WhatsApp</Btn>
            <Btn variant="ghost" onClick={() => setEditOpen(true)}>Editar observaciones</Btn>
          </div>
        </div>

        {/* stat strip */}
        <Panel pad={false} style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', padding: '18px 0' }}>
            <div style={{ padding: '0 18px 12px 22px', flex: '1 1 45%', minWidth: 130 }}>
              <div className="eyebrow" style={{ marginBottom: 6 }}>Aseguradora</div>
              <div style={{ fontSize: 15, fontWeight: 600 }}>{p.insurer}</div>
            </div>
            <StatChip label="Ramo" value={p.ramo} mono={false} />
            <StatChip label="Prima" value={`${ars(p.prima)} / ${p.freq.toLowerCase()}`} />
            {p.sumaAseg && <StatChip label="Suma asegurada" value={ars(p.sumaAseg)} />}
            <StatChip label="Vigencia" value={`${p.start} → ${p.renew}`} />
          </div>
        </Panel>

        {/* body grid */}
        <div className="rgrid" style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 24, alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

            {/* cuotas */}
            <Panel>
              <SectionHead
                label="Cronograma de cuotas"
                sub={<span><strong style={{ color: 'var(--emerald-ink)' }}>{paid} pagadas</strong>{overdue.length > 0 && <> · <strong style={{ color: 'var(--red-ink)' }}>{overdue.length} vencida{overdue.length > 1 ? 's' : ''}</strong></>}</span>}
                action={overdue.length > 0 ? <Btn size="sm" variant="primary" icon="whatsapp">Reclamar</Btn> : null}
              />
              <div style={{ maxHeight: 320, overflowY: 'auto' }} className="scroll">
                {sched.map((c, i) => <CuotaRow key={i} c={c} last={i === sched.length - 1} />)}
              </div>
            </Panel>

            {/* linked claims */}
            <Panel>
              <SectionHead label="Siniestros vinculados" sub={claims.length ? `${claims.length} en esta póliza` : 'Sin siniestros'} />
              {claims.length === 0 ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', color: 'var(--emerald-ink)', fontSize: 13.5 }}>
                  <Icon name="check" size={16} /> Sin siniestros registrados. Rumbo despejado.
                </div>
              ) : claims.map((s, i) => {
                const stale = s.stale >= 10;
                return (
                  <div key={s.id} style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 13, padding: '12px 0', borderBottom: i === claims.length - 1 ? 'none' : '1px solid var(--hair-2)' }}>
                    <span style={{ width: 34, height: 34, borderRadius: 9, flexShrink: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: stale ? 'var(--red-soft)' : 'var(--panel-2)', color: stale ? 'var(--red-ink)' : 'var(--ink-2)', border: '1px solid var(--hair)' }}>
                      <Icon name={stale ? 'alert' : 'shield'} size={16} stroke={2} />
                    </span>
                    <div style={{ flex: '1 1 140px', minWidth: 0 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 600 }}>{s.tipo}</div>
                      <div className="font-mono" style={{ fontSize: 11, color: stale ? 'var(--red-ink)' : 'var(--ink-3)', marginTop: 2 }}>{s.num} · {stale ? `sin movimiento ${s.stale} d` : 'abierto ' + s.opened}</div>
                    </div>
                    <Pill tone={s.status === 'Abierto' ? 'amber' : s.status === 'Cerrado' ? 'emerald' : 'neutral'}>{s.status}</Pill>
                    {s.importance && <Pill tone={s.importance === 'Alta' ? 'red' : s.importance === 'Media' ? 'amber' : 'neutral'} style={{ fontSize: 10 }}>{s.importance}</Pill>}
                    <Btn size="sm" variant="ghost" onClick={() => window.rumboUI?.openClaim(s.id)}>Gestionar</Btn>
                  </div>
                );
              })}
            </Panel>
          </div>

          {/* right */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

            {/* client */}
            <Panel>
              <SectionHead label="Cliente" />
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                <Avatar initials={contact.initials} size={42} />
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600 }}>{contact.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>{contact.kind} · cliente desde {contact.since}</div>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13, color: 'var(--ink-2)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}><Icon name="phone" size={15} style={{ color: 'var(--ink-3)' }} /><span className="font-mono">{contact.phone}</span></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}><Icon name="mapPin" size={15} style={{ color: 'var(--ink-3)' }} />{contact.city}</div>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                <Btn size="sm" variant="soft" icon="whatsapp" style={{ flex: 1 }}>Mensaje</Btn>
                <Btn size="sm" variant="soft" icon="users" style={{ flex: 1 }} onClick={() => go('contacto', { id: p.contactId })}>Ver ficha</Btn>
              </div>
            </Panel>

            {/* cross-sell */}
            {cross.length > 0 && (
              <Panel>
                <SectionHead label="Cross-selling sugerido" action={<Icon name="sparkles" size={16} style={{ color: 'var(--orange)' }} />} />
                {cross.map((x, i) => (
                  <div key={x.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: i === cross.length - 1 ? 'none' : '1px solid var(--hair-2)' }}>
                    <RamoGlyph ramo={x.suggest} size={32} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 600 }}>Seguro de {x.suggest}</div>
                      <div style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>{x.reason}</div>
                    </div>
                    <Pill tone={x.score === 'Alta' ? 'emerald' : 'neutral'} style={{ fontSize: 10 }}>{x.score}</Pill>
                  </div>
                ))}
                <Btn size="sm" variant="soft" iconRight="arrowRight" style={{ marginTop: 14, width: '100%' }}>Cotizar oportunidad</Btn>
              </Panel>
            )}

            {/* activity */}
            <Panel>
              <SectionHead label="Actividad" />
              <div style={{ position: 'relative', paddingLeft: 6 }}>
                {acts.length === 0 && <div style={{ fontSize: 13, color: 'var(--ink-3)' }}>Sin actividad registrada.</div>}
                {acts.length > 0 && <div style={{ position: 'absolute', left: 9, top: 6, bottom: 6, width: 2, background: 'var(--hair-2)' }} />}
                {acts.map((a, i) => (
                  <div key={i} style={{ display: 'flex', gap: 14, paddingBottom: i === acts.length - 1 ? 0 : 16, position: 'relative' }}>
                    <span style={{ width: 8, height: 8, borderRadius: 99, marginTop: 5, flexShrink: 0, zIndex: 1,
                      background: a.kind === 'alert' ? 'var(--red)' : a.kind === 'note' ? 'var(--orange)' : 'var(--ink-3)',
                      boxShadow: '0 0 0 3px var(--panel)' }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12.5, color: 'var(--ink)', lineHeight: 1.4 }}>{a.text}</div>
                      <div className="font-mono" style={{ fontSize: 10.5, color: 'var(--ink-3)', marginTop: 2 }}>{a.who} · {a.when}</div>
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
  const card = (h) => <span className="skel" style={{ display: 'block', width: '100%', height: h, borderRadius: 'var(--radius-lg)' }} />;
  return (
    <div className="scroll" style={{ overflowY: 'auto', height: '100%', padding: isMobile ? '16px 16px 40px' : '26px 34px 60px' }}>
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
        <div className="rgrid" style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.5fr 1fr', gap: 24, alignItems: 'start', marginTop: 24 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>{card(280)}{card(140)}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>{card(200)}{card(160)}</div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { ScreenDetail });
