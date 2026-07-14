/* ============================================================
   RUMBO — Ficha de gestión del siniestro (drawer)
   Estado + prioridad (triage AR) + timeline + comentario. Fuente:
   GET /api/v1/claims/:id. Tras cada mutación: refetch + rumboRefresh
   (board y detalle se actualizan solos). Se abre con window.rumboUI.openClaim(id).
   ============================================================ */
function ClaimMeta({ label, value, mono }) {
  return (
    <div>
      <div className="eyebrow" style={{ marginBottom: 4 }}>
        {label}
      </div>
      <div className={mono ? 'font-mono' : ''} style={{ fontSize: 13, color: 'var(--ink)' }}>
        {value || '—'}
      </div>
    </div>
  );
}

function ClaimDrawer({ id, onClose }) {
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);

  const flash = m => window.rumboUI && window.rumboUI.toast && window.rumboUI.toast(m);

  // Ficha vía TanStack Query (key por siniestro: reabrir el mismo id sale de cache).
  const claimQ = useApiQuery(['claim', id], () => window.rumboApi.claimById(id), { enabled: Boolean(id) });
  const c = claimQ.data ?? null;
  const loading = claimQ.isLoading;
  const error = claimQ.error;

  // Usuarios de la org, para (re)asignar responsable. El selector aparece solo si
  // hay 2+ personas (con una sola, el responsable es siempre esa persona).
  const usersQ = useApiQuery(['orgUsers'], () => window.rumboApi.orgUsers(), { enabled: Boolean(id) });
  const orgUsers = usersQ.data?.data ?? [];
  const meId = window.RUMBO_USER?.id || '';
  useEffect(() => {
    setComment('');
  }, [id]);

  // Refresca la ficha (para el timeline/estado) y el cockpit (board/detalle).
  const after = () => {
    claimQ.refetch();
    if (window.rumboRefresh) window.rumboRefresh();
  };

  const setStatus = status => {
    setBusy(true);
    window.rumboApi
      .updateClaimStatus(id, status)
      .then(() => {
        flash('Estado actualizado');
        after();
      })
      .catch(e => flash(e.message))
      .finally(() => setBusy(false));
  };
  const setImportance = importance => {
    setBusy(true);
    window.rumboApi
      .updateClaimImportance(id, importance || null)
      .then(() => {
        flash('Prioridad actualizada');
        after();
      })
      .catch(e => flash(e.message))
      .finally(() => setBusy(false));
  };
  const setAssignee = assignedUserId => {
    setBusy(true);
    window.rumboApi
      .updateClaimAssignee(id, assignedUserId)
      .then(() => {
        flash('Responsable actualizado');
        after();
      })
      .catch(e => flash(e.message))
      .finally(() => setBusy(false));
  };
  const addComment = () => {
    const b = comment.trim();
    if (!b || busy) return;
    setBusy(true);
    window.rumboApi
      .addClaimComment(id, b)
      .then(() => {
        setComment('');
        flash('Comentario agregado');
        after();
      })
      .catch(e => flash(e.message))
      .finally(() => setBusy(false));
  };

  const STATUS_ENUM = { Abierto: 'abierto', 'En curso': 'en_curso', Cerrado: 'cerrado' };
  const IMP_ENUM = { Alta: 'alta', Media: 'media', Baja: 'baja' };
  const sel = { ...inputStyle, appearance: 'none', cursor: 'pointer' };

  return (
    <Drawer
      open={!!id}
      onClose={onClose}
      width={560}
      eyebrow="Siniestro · gestión"
      title={c ? `${c.tipo} · ${c.client}` : 'Siniestro'}
    >
      {loading && (
        <div style={{ padding: 30, textAlign: 'center', color: 'var(--ink-3)', fontSize: 13 }}>Cargando…</div>
      )}
      {error && (
        <div style={{ padding: 20, color: 'var(--red-ink)', fontSize: 13 }}>
          {error.status === 404 ? 'Siniestro no encontrado.' : error.message}
        </div>
      )}
      {c && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
            opacity: busy ? 0.6 : 1,
            transition: 'opacity .12s',
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <ClaimMeta label="Nº de siniestro" value={c.num} mono />
            <ClaimMeta label="Póliza" value={c.policyNumber} mono />
            <ClaimMeta label="Denunciante" value={c.reportedBy} />
            <ClaimMeta label="Fecha del hecho" value={c.opened} mono />
            <ClaimMeta label="Aseguradora" value={c.insurer} />
            <ClaimMeta label="Sin movimiento" value={`${c.stale} d`} />
            {c.tipoDetalle && <ClaimMeta label="Tipo específico" value={c.tipoDetalle} />}
            {c.location && <ClaimMeta label="Lugar" value={c.location} />}
          </div>
          {c.description && (
            <div>
              <div className="eyebrow" style={{ marginBottom: 5 }}>
                Descripción
              </div>
              <div style={{ fontSize: 13, whiteSpace: 'pre-wrap' }}>{c.description}</div>
            </div>
          )}

          {/* Adjuntos promovidos desde la pre-denuncia (Slice 3) */}
          {c.documentos && c.documentos.length > 0 && (
            <div>
              <div className="eyebrow" style={{ marginBottom: 8 }}>
                Adjuntos
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {c.documentos.map(doc => (
                  <a
                    key={doc.id}
                    href={window.rumboApi.documentUrl(doc.id)}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      fontSize: 12.5,
                      color: 'var(--orange-ink)',
                      fontWeight: 600,
                      textDecoration: 'none',
                    }}
                  >
                    <Icon name="download" size={14} style={{ flexShrink: 0 }} />
                    <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {doc.fileName}
                    </span>
                    <span className="font-mono" style={{ fontSize: 10.5, color: 'var(--ink-3)', flexShrink: 0 }}>
                      {Math.max(1, Math.round((doc.sizeBytes || 0) / 1024))} KB
                    </span>
                  </a>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <Field label="Estado">
              <select
                value={STATUS_ENUM[c.status] || 'abierto'}
                onChange={e => setStatus(e.target.value)}
                disabled={busy}
                style={sel}
              >
                <option value="abierto">Abierto</option>
                <option value="en_curso">En curso</option>
                <option value="cerrado">Cerrado</option>
              </select>
            </Field>
            <Field label="Prioridad">
              <select
                value={IMP_ENUM[c.importance] || ''}
                onChange={e => setImportance(e.target.value)}
                disabled={busy}
                style={sel}
              >
                <option value="">Sin priorizar</option>
                <option value="alta">Alta</option>
                <option value="media">Media</option>
                <option value="baja">Baja</option>
              </select>
            </Field>
            {orgUsers.length >= 2 && (
              <Field label="Responsable">
                <select
                  value={c.assigneeId || ''}
                  onChange={e => setAssignee(e.target.value)}
                  disabled={busy}
                  style={sel}
                >
                  <option value="">Sin asignar</option>
                  {orgUsers.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                      {u.id === meId ? ' (yo)' : ''}
                    </option>
                  ))}
                </select>
              </Field>
            )}
          </div>

          <div>
            <div className="eyebrow" style={{ marginBottom: 10 }}>
              Historial de gestión
            </div>
            {!c.events || c.events.length === 0 ? (
              <div style={{ fontSize: 13, color: 'var(--ink-3)' }}>Sin movimientos aún.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {c.events.map(ev => (
                  <div key={ev.id} style={{ display: 'flex', gap: 10 }}>
                    <span
                      style={{
                        width: 7,
                        height: 7,
                        borderRadius: 99,
                        marginTop: 6,
                        flexShrink: 0,
                        background: ev.kind === 'status_change' ? 'var(--orange)' : 'var(--ink-3)',
                      }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, color: 'var(--ink)' }}>{ev.text}</div>
                      <div className="font-mono" style={{ fontSize: 10.5, color: 'var(--ink-3)', marginTop: 2 }}>
                        {ev.who} · {ev.when}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <Field label="Registrar gestión">
              <textarea
                value={comment}
                onChange={e => setComment(e.target.value)}
                rows={2}
                maxLength={2000}
                placeholder="Ej: llamé a la aseguradora, falta el informe del perito"
                style={{ ...inputStyle, resize: 'vertical', minHeight: 56 }}
              />
            </Field>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
              <Btn
                size="sm"
                variant="primary"
                icon="message"
                onClick={addComment}
                style={{
                  opacity: comment.trim() && !busy ? 1 : 0.5,
                  pointerEvents: comment.trim() && !busy ? 'auto' : 'none',
                }}
              >
                Comentar
              </Btn>
            </div>
          </div>
        </div>
      )}
    </Drawer>
  );
}

Object.assign(window, { ClaimDrawer });
