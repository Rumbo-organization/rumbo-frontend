/* ============================================================
   RUMBO — Ficha de gestión del siniestro (drawer)
   Estado + prioridad (triage AR) + timeline + comentario. Fuente:
   GET /api/v1/claims/:id. Tras cada mutación: refetch + rumboRefresh
   (board y detalle se actualizan solos). Se abre con window.rumboUI.openClaim(id).
   ============================================================ */
function ClaimMeta({ label, value, mono }) {
  return (
    <div>
      <div className="eyebrow" style={{ marginBottom: 4 }}>{label}</div>
      <div className={mono ? 'font-mono' : ''} style={{ fontSize: 13, color: 'var(--ink)' }}>{value || '—'}</div>
    </div>
  );
}

function ClaimDrawer({ id, onClose }) {
  const [c, setC] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);

  const flash = (m) => window.rumboUI && window.rumboUI.toast && window.rumboUI.toast(m);

  const load = () => {
    if (!id) return;
    setLoading(true); setError(null);
    window.rumboApi.claimById(id)
      .then((d) => setC(d))
      .catch((e) => setError(e))
      .finally(() => setLoading(false));
  };
  useEffect(() => { setC(null); setComment(''); setError(null); if (id) load(); }, [id]);

  // Refresca la ficha (para el timeline/estado) y el cockpit (board/detalle).
  const after = () => { load(); if (window.rumboRefresh) window.rumboRefresh(); };

  const setStatus = (status) => {
    setBusy(true);
    window.rumboApi.updateClaimStatus(id, status)
      .then(() => { flash('Estado actualizado'); after(); })
      .catch((e) => flash(e.message)).finally(() => setBusy(false));
  };
  const setImportance = (importance) => {
    setBusy(true);
    window.rumboApi.updateClaimImportance(id, importance || null)
      .then(() => { flash('Prioridad actualizada'); after(); })
      .catch((e) => flash(e.message)).finally(() => setBusy(false));
  };
  const addComment = () => {
    const b = comment.trim();
    if (!b || busy) return;
    setBusy(true);
    window.rumboApi.addClaimComment(id, b)
      .then(() => { setComment(''); flash('Comentario agregado'); after(); })
      .catch((e) => flash(e.message)).finally(() => setBusy(false));
  };

  const STATUS_ENUM = { 'Abierto': 'abierto', 'En curso': 'en_curso', 'Cerrado': 'cerrado' };
  const IMP_ENUM = { 'Alta': 'alta', 'Media': 'media', 'Baja': 'baja' };
  const sel = { ...inputStyle, appearance: 'none', cursor: 'pointer' };

  return (
    <Drawer open={!!id} onClose={onClose} width={560}
      eyebrow="Siniestro · gestión" title={c ? `${c.tipo} · ${c.client}` : 'Siniestro'}>
      {loading && <div style={{ padding: 30, textAlign: 'center', color: 'var(--ink-3)', fontSize: 13 }}>Cargando…</div>}
      {error && <div style={{ padding: 20, color: 'var(--red-ink)', fontSize: 13 }}>{error.status === 404 ? 'Siniestro no encontrado.' : error.message}</div>}
      {c && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, opacity: busy ? 0.6 : 1, transition: 'opacity .12s' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <ClaimMeta label="Nº de siniestro" value={c.num} mono />
            <ClaimMeta label="Póliza" value={c.policyNumber} mono />
            <ClaimMeta label="Denunciante" value={c.reportedBy} />
            <ClaimMeta label="Fecha del hecho" value={c.opened} mono />
            <ClaimMeta label="Aseguradora" value={c.insurer} />
            <ClaimMeta label="Sin movimiento" value={`${c.stale} d`} />
            {c.location && <ClaimMeta label="Lugar" value={c.location} />}
          </div>
          {c.description && (
            <div>
              <div className="eyebrow" style={{ marginBottom: 5 }}>Descripción</div>
              <div style={{ fontSize: 13, whiteSpace: 'pre-wrap' }}>{c.description}</div>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <Field label="Estado">
              <select value={STATUS_ENUM[c.status] || 'abierto'} onChange={(e) => setStatus(e.target.value)} disabled={busy} style={sel}>
                <option value="abierto">Abierto</option>
                <option value="en_curso">En curso</option>
                <option value="cerrado">Cerrado</option>
              </select>
            </Field>
            <Field label="Prioridad">
              <select value={IMP_ENUM[c.importance] || ''} onChange={(e) => setImportance(e.target.value)} disabled={busy} style={sel}>
                <option value="">Sin priorizar</option>
                <option value="alta">Alta</option>
                <option value="media">Media</option>
                <option value="baja">Baja</option>
              </select>
            </Field>
          </div>

          <div>
            <div className="eyebrow" style={{ marginBottom: 10 }}>Historial de gestión</div>
            {(!c.events || c.events.length === 0) ? (
              <div style={{ fontSize: 13, color: 'var(--ink-3)' }}>Sin movimientos aún.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {c.events.map((ev) => (
                  <div key={ev.id} style={{ display: 'flex', gap: 10 }}>
                    <span style={{ width: 7, height: 7, borderRadius: 99, marginTop: 6, flexShrink: 0, background: ev.kind === 'status_change' ? 'var(--orange)' : 'var(--ink-3)' }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, color: 'var(--ink)' }}>{ev.text}</div>
                      <div className="font-mono" style={{ fontSize: 10.5, color: 'var(--ink-3)', marginTop: 2 }}>{ev.who} · {ev.when}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <Field label="Registrar gestión">
              <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={2} maxLength={2000}
                placeholder="Ej: llamé a la aseguradora, falta el informe del perito" style={{ ...inputStyle, resize: 'vertical', minHeight: 56 }} />
            </Field>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
              <Btn size="sm" variant="primary" icon="message" onClick={addComment}
                style={{ opacity: comment.trim() && !busy ? 1 : 0.5, pointerEvents: comment.trim() && !busy ? 'auto' : 'none' }}>Comentar</Btn>
            </div>
          </div>
        </div>
      )}
    </Drawer>
  );
}

Object.assign(window, { ClaimDrawer });
