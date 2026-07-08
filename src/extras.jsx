/* ============================================================
   RUMBO — Paneles extra del detalle de póliza y la ficha del asegurado
   (Slice 4 de paridad): bien asegurado, plan de pagos (CRUD), endosos,
   personas, relaciones, direcciones, responsables y documentos.
   Lecturas: vienen en policyDetail/contactById; acá mutaciones + refetch
   vía onChanged (el screen re-pide el detalle/la ficha).
   ============================================================ */

/* ---------- helpers compartidos ---------- */
function ExtraRow({ children, last }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: last ? 'none' : '1px solid var(--hair-2)' }}>
      {children}
    </div>
  );
}
function DelBtn({ onClick, title = 'Eliminar' }) {
  return (
    <button title={title} onClick={onClick} style={{ width: 26, height: 26, borderRadius: 7, border: '1px solid var(--hair)', background: 'var(--panel-2)', color: 'var(--ink-3)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
      <Icon name="x" size={12} />
    </button>
  );
}
function fmtBytes(n) {
  if (n >= 1e6) return (n / 1e6).toFixed(1) + ' MB';
  if (n >= 1e3) return Math.round(n / 1e3) + ' KB';
  return n + ' B';
}
// Muta con toast de error y refetch al éxito.
function runMut(promise, okMsg, onChanged) {
  return promise
    .then(() => { window.rumboUI?.toast?.(okMsg); onChanged(); })
    .catch(e => window.rumboUI?.toast?.(e.message));
}

/* ---------- Documentos (póliza o asegurado) ---------- */
function DocumentsPanel({ docs, target, onChanged }) {
  const [busy, setBusy] = useState(false);
  const inputRef = useRef(null);
  const pick = () => inputRef.current?.click();
  const onFile = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || busy) return;
    setBusy(true);
    window.rumboApi.uploadDocument(file, target)
      .then(() => { window.rumboUI?.toast?.('Documento subido'); onChanged(); })
      .catch(err => window.rumboUI?.toast?.(err.message))
      .finally(() => setBusy(false));
  };
  return (
    <Panel>
      <SectionHead label="Documentos" sub={docs.length ? `${docs.length} adjuntos` : 'Sin documentos'}
        action={<Btn size="sm" variant="soft" icon="plus" onClick={pick} style={{ opacity: busy ? 0.5 : 1 }}>{busy ? 'Subiendo…' : 'Subir'}</Btn>} />
      <input ref={inputRef} type="file" accept="application/pdf,image/png,image/jpeg,image/webp" style={{ display: 'none' }} onChange={onFile} />
      {docs.length === 0 ? (
        <div style={{ fontSize: 13, color: 'var(--ink-3)' }}>PDF o imagen, hasta 10 MB.</div>
      ) : docs.map((d, i) => (
        <ExtraRow key={d.id} last={i === docs.length - 1}>
          <span style={{ width: 30, height: 30, borderRadius: 8, flexShrink: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'var(--panel-2)', color: 'var(--ink-2)', border: '1px solid var(--hair)' }}>
            <Icon name={d.contentType === 'application/pdf' ? 'scroll' : 'download'} size={14} />
          </span>
          <a href={window.rumboApi.documentUrl(d.id)} target="_blank" rel="noreferrer" style={{ flex: 1, minWidth: 0, fontSize: 13, fontWeight: 600, color: 'var(--ink)', textDecoration: 'none', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.fileName}</a>
          <span className="font-mono" style={{ fontSize: 11, color: 'var(--ink-3)' }}>{fmtBytes(d.sizeBytes)}</span>
          <DelBtn onClick={() => runMut(window.rumboApi.deleteDocument(d.id), 'Documento eliminado', onChanged)} />
        </ExtraRow>
      ))}
    </Panel>
  );
}

/* ---------- Detalle de póliza: bien asegurado / endosos / personas ---------- */
function RisksPanel({ risks }) {
  if (!risks || risks.length === 0) return null;
  return (
    <Panel>
      <SectionHead label="Bien asegurado" sub={`${risks.length} ${risks.length === 1 ? 'riesgo' : 'riesgos'}`} />
      {risks.map((r, i) => (
        <ExtraRow key={r.id} last={i === risks.length - 1}>
          <div style={{ flex: 1, minWidth: 0, fontSize: 13.5 }}>{r.descripcion || '—'}</div>
          {r.patente && <Pill tone="neutral" style={{ fontSize: 10.5 }}><span className="font-mono">{r.patente}</span></Pill>}
        </ExtraRow>
      ))}
    </Panel>
  );
}

const ENDOSO_TYPES = [['emision', 'Emisión'], ['refacturacion', 'Refacturación'], ['endoso', 'Endoso'], ['anulacion', 'Anulación']];

function EndosoDrawer({ open, onClose, policyId, onChanged }) {
  const [f, setF] = useState({ number: '', type: 'endoso', issuedAt: '', premio: '', description: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  useEffect(() => { if (open) { setF({ number: '', type: 'endoso', issuedAt: '', premio: '', description: '' }); setError(null); } }, [open]);
  const set = (k, v) => setF(s => ({ ...s, [k]: v }));
  const valid = f.number !== '' && Number.isInteger(Number(f.number)) && Number(f.number) >= 0;
  const submit = () => {
    if (!valid || busy) return;
    setBusy(true); setError(null);
    const data = { number: Number(f.number), type: f.type };
    if (f.issuedAt) data.issuedAt = f.issuedAt;
    if (f.premio) data.premio = Number(f.premio);
    if (f.description.trim()) data.description = f.description.trim();
    window.rumboApi.createEndorsement(policyId, data)
      .then(() => { window.rumboUI?.toast?.('Movimiento cargado'); onChanged(); onClose(); })
      .catch(e => setError(e.message)).finally(() => setBusy(false));
  };
  return (
    <Drawer open={open} onClose={onClose} eyebrow="Póliza · endosos" title="Cargar movimiento" width={480}
      footer={<>
        <Btn variant="ghost" onClick={onClose}>Cancelar</Btn>
        <Btn variant="primary" icon="check" onClick={submit} style={{ opacity: valid && !busy ? 1 : 0.5, pointerEvents: valid && !busy ? 'auto' : 'none' }}>Cargar</Btn>
      </>}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <Field label="Número" required span={1}><TextInput value={f.number} onChange={v => set('number', v.replace(/[^0-9]/g, ''))} mono placeholder="0 = emisión" /></Field>
        <Field label="Tipo" span={1}>
          <select value={f.type} onChange={e => set('type', e.target.value)} style={{ ...inputStyle, appearance: 'none', cursor: 'pointer' }}>
            {ENDOSO_TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </Field>
        <Field label="Fecha de emisión" span={1}><input type="date" value={f.issuedAt} onChange={e => set('issuedAt', e.target.value)} style={inputStyle} /></Field>
        <Field label="Premio" span={1}><TextInput value={f.premio} onChange={v => set('premio', v.replace(/[^0-9.]/g, ''))} mono prefix="$" placeholder="opcional" /></Field>
        <Field label="Descripción" span={2}><textarea value={f.description} onChange={e => set('description', e.target.value)} rows={3} style={{ ...inputStyle, resize: 'vertical' }} placeholder="opcional" /></Field>
        {error && <div style={{ gridColumn: '1 / -1', fontSize: 12.5, color: 'var(--red-ink)' }}>{error}</div>}
      </div>
    </Drawer>
  );
}

function EndososPanel({ endosos, policyId, onChanged }) {
  const { ars } = window.rumboFmt;
  const [open, setOpen] = useState(false);
  return (
    <Panel>
      <EndosoDrawer open={open} onClose={() => setOpen(false)} policyId={policyId} onChanged={onChanged} />
      <SectionHead label="Endosos y movimientos" sub={endosos.length ? `${endosos.length} en la póliza` : 'Sin movimientos cargados'}
        action={<Btn size="sm" variant="soft" icon="plus" onClick={() => setOpen(true)}>Cargar</Btn>} />
      {endosos.length === 0 ? (
        <div style={{ fontSize: 13, color: 'var(--ink-3)' }}>La póliza es la secuencia de sus movimientos. Cargalos a mano hasta que llegue la sync.</div>
      ) : endosos.map((e, i) => (
        <ExtraRow key={e.id} last={i === endosos.length - 1}>
          <span className="font-mono tnum" style={{ width: 28, fontSize: 12, color: 'var(--ink-3)', flexShrink: 0 }}>#{e.number}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{e.type}{e.description ? ` · ${e.description}` : ''}</div>
            <div className="font-mono" style={{ fontSize: 11, color: 'var(--ink-3)' }}>{e.issuedAt || 'sin fecha'}</div>
          </div>
          {e.premio != null && <span className="font-mono tnum" style={{ fontSize: 12.5, fontWeight: 600 }}>{ars(e.premio)}</span>}
          <DelBtn onClick={() => runMut(window.rumboApi.deleteEndorsement(e.id), 'Movimiento eliminado', onChanged)} />
        </ExtraRow>
      ))}
    </Panel>
  );
}

const PARTY_ROLES = [['asegurado', 'Asegurado'], ['tomador', 'Tomador'], ['beneficiario', 'Beneficiario'], ['conductor', 'Conductor'], ['acreedor_prendario', 'Acreedor prendario'], ['otro', 'Otro']];

function PersonasPanel({ personas, policyId, onChanged }) {
  const [adding, setAdding] = useState(false);
  const [who, setWho] = useState(null);
  const [role, setRole] = useState('conductor');
  const [busy, setBusy] = useState(false);
  const submit = () => {
    if (!who || busy) return;
    setBusy(true);
    window.rumboApi.createPolicyParty(policyId, { contactId: who.id, role })
      .then(() => { window.rumboUI?.toast?.('Persona agregada'); setAdding(false); setWho(null); onChanged(); })
      .catch(e => window.rumboUI?.toast?.(e.message))
      .finally(() => setBusy(false));
  };
  return (
    <Panel>
      <SectionHead label="Personas de la póliza" sub={personas.length ? `${personas.length} además del titular` : 'Solo el titular'}
        action={<Btn size="sm" variant="soft" icon={adding ? 'x' : 'plus'} onClick={() => setAdding(a => !a)}>{adding ? 'Cerrar' : 'Agregar'}</Btn>} />
      {adding && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '4px 0 14px', borderBottom: '1px solid var(--hair-2)', marginBottom: 6 }}>
          <SearchPicker value={who} onChange={setWho} fetcher={window.rumboApi.contactsPicker}
            format={c => c.name} sub={c => `${c.kind} · ${c.city}`} placeholder="Buscar asegurado…" />
          <div style={{ display: 'flex', gap: 8 }}>
            <select value={role} onChange={e => setRole(e.target.value)} style={{ ...inputStyle, appearance: 'none', cursor: 'pointer', flex: 1 }}>
              {PARTY_ROLES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
            <Btn size="sm" variant="primary" icon="check" onClick={submit} style={{ opacity: who && !busy ? 1 : 0.5, pointerEvents: who && !busy ? 'auto' : 'none' }}>Agregar</Btn>
          </div>
        </div>
      )}
      {personas.length === 0 && !adding ? (
        <div style={{ fontSize: 13, color: 'var(--ink-3)' }}>Tomador, beneficiario, conductor y demás roles de la póliza.</div>
      ) : personas.map((p, i) => (
        <ExtraRow key={p.id} last={i === personas.length - 1}>
          <Avatar initials={(p.name || '—').replace(/,/g, '').split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase()} size={28} tone="neutral" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
            <div className="font-mono" style={{ fontSize: 11, color: 'var(--ink-3)' }}>{p.document}</div>
          </div>
          <Pill tone="neutral" style={{ fontSize: 10.5 }}>{p.role}</Pill>
          <DelBtn onClick={() => runMut(window.rumboApi.deletePolicyParty(p.id), 'Persona quitada', onChanged)} />
        </ExtraRow>
      ))}
    </Panel>
  );
}

/* Plan de pagos: acciones (generar si está vacío, marcar pagada, rehacer). */
function InstallmentsActions({ policyId, hasPlan, onChanged }) {
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ count: '12', firstDueDate: '', totalAmount: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const set = (k, v) => setF(s => ({ ...s, [k]: v }));
  const valid = Number(f.count) >= 1 && /^\d{4}-\d{2}-\d{2}$/.test(f.firstDueDate) && Number(f.totalAmount) > 0;
  const submit = () => {
    if (!valid || busy) return;
    setBusy(true); setError(null);
    window.rumboApi.generateInstallments(policyId, { count: Number(f.count), firstDueDate: f.firstDueDate, totalAmount: Number(f.totalAmount) })
      .then(() => { window.rumboUI?.toast?.('Plan de pagos generado'); setOpen(false); onChanged(); })
      .catch(e => setError(e.message)).finally(() => setBusy(false));
  };
  const redo = () => {
    if (busy) return;
    if (!window.confirm('¿Borrar el plan de pagos para rehacerlo?')) return;
    runMut(window.rumboApi.clearInstallments(policyId), 'Plan de pagos borrado', onChanged);
  };
  return (
    <>
      <Drawer open={open} onClose={() => setOpen(false)} eyebrow="Póliza · plan de pagos" title="Generar plan de pagos" width={440}
        footer={<>
          <Btn variant="ghost" onClick={() => setOpen(false)}>Cancelar</Btn>
          <Btn variant="primary" icon="check" onClick={submit} style={{ opacity: valid && !busy ? 1 : 0.5, pointerEvents: valid && !busy ? 'auto' : 'none' }}>Generar</Btn>
        </>}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ fontSize: 12.5, color: 'var(--ink-3)' }}>Reparte el total en cuotas mensuales desde la primera fecha.</div>
          <Field label="Cantidad de cuotas" required><TextInput value={f.count} onChange={v => set('count', v.replace(/[^0-9]/g, ''))} mono /></Field>
          <Field label="Primer vencimiento" required><input type="date" value={f.firstDueDate} onChange={e => set('firstDueDate', e.target.value)} style={inputStyle} /></Field>
          <Field label="Importe total" required><TextInput value={f.totalAmount} onChange={v => set('totalAmount', v.replace(/[^0-9.]/g, ''))} mono prefix="$" /></Field>
          {error && <div style={{ fontSize: 12.5, color: 'var(--red-ink)' }}>{error}</div>}
        </div>
      </Drawer>
      {hasPlan
        ? <Btn size="sm" variant="ghost" onClick={redo}>Rehacer</Btn>
        : <Btn size="sm" variant="soft" icon="plus" onClick={() => setOpen(true)}>Generar plan</Btn>}
    </>
  );
}

/* ---------- Ficha del asegurado: relaciones / direcciones / responsables ---------- */
const RELATION_TYPES = [['conyuge', 'Cónyuge'], ['conviviente', 'Conviviente'], ['hijo', 'Hijo/a'], ['padre_madre', 'Padre/Madre'], ['hermano', 'Hermano/a'], ['socio', 'Socio/a'], ['empleado', 'Empleado/a'], ['empleador', 'Empleador/a'], ['familiar', 'Familiar'], ['otro', 'Otro']];

function RelacionesPanel({ relaciones, contactId, onChanged, go }) {
  const [adding, setAdding] = useState(false);
  const [who, setWho] = useState(null);
  const [type, setType] = useState('familiar');
  const [busy, setBusy] = useState(false);
  const submit = () => {
    if (!who || busy) return;
    setBusy(true);
    window.rumboApi.createRelationship(contactId, { relatedContactId: who.id, type })
      .then(() => { window.rumboUI?.toast?.('Relación creada'); setAdding(false); setWho(null); onChanged(); })
      .catch(e => window.rumboUI?.toast?.(e.message))
      .finally(() => setBusy(false));
  };
  return (
    <Panel>
      <SectionHead label="Relaciones" sub={relaciones.length ? `${relaciones.length} vinculadas` : 'Sin relaciones'}
        action={<Btn size="sm" variant="soft" icon={adding ? 'x' : 'plus'} onClick={() => setAdding(a => !a)}>{adding ? 'Cerrar' : 'Vincular'}</Btn>} />
      {adding && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '4px 0 14px', borderBottom: '1px solid var(--hair-2)', marginBottom: 6 }}>
          <SearchPicker value={who} onChange={setWho} fetcher={window.rumboApi.contactsPicker}
            format={c => c.name} sub={c => `${c.kind} · ${c.city}`} placeholder="Buscar asegurado…" />
          <div style={{ display: 'flex', gap: 8 }}>
            <select value={type} onChange={e => setType(e.target.value)} style={{ ...inputStyle, appearance: 'none', cursor: 'pointer', flex: 1 }}>
              {RELATION_TYPES.map(([v, l]) => <option key={v} value={v}>{`Es ${l.toLowerCase()} de este asegurado`}</option>)}
            </select>
            <Btn size="sm" variant="primary" icon="check" onClick={submit} style={{ opacity: who && !busy ? 1 : 0.5, pointerEvents: who && !busy ? 'auto' : 'none' }}>Vincular</Btn>
          </div>
        </div>
      )}
      {relaciones.length === 0 && !adding ? (
        <div style={{ fontSize: 13, color: 'var(--ink-3)' }}>Cónyuge, hijos, socios: el mapa familiar y comercial de la cartera.</div>
      ) : relaciones.map((r, i) => (
        <ExtraRow key={r.id} last={i === relaciones.length - 1}>
          <div style={{ flex: 1, minWidth: 0, cursor: 'pointer' }} onClick={() => go && go('contacto', { id: r.otherContactId })}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{r.otherName}</div>
            <div style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>{r.type}{r.note ? ` · ${r.note}` : ''}</div>
          </div>
          <DelBtn onClick={() => runMut(window.rumboApi.deleteRelationship(r.id), 'Relación eliminada', onChanged)} />
        </ExtraRow>
      ))}
    </Panel>
  );
}

function DireccionesPanel({ direcciones, contactId, onChanged }) {
  const [adding, setAdding] = useState(false);
  const [f, setF] = useState({ label: '', street: '', number: '', city: '', province: '' });
  const [busy, setBusy] = useState(false);
  const set = (k, v) => setF(s => ({ ...s, [k]: v }));
  const submit = () => {
    if (!f.street.trim() || busy) return;
    setBusy(true);
    window.rumboApi.createContactAddress(contactId, f)
      .then(() => { window.rumboUI?.toast?.('Dirección agregada'); setAdding(false); setF({ label: '', street: '', number: '', city: '', province: '' }); onChanged(); })
      .catch(e => window.rumboUI?.toast?.(e.message))
      .finally(() => setBusy(false));
  };
  return (
    <Panel>
      <SectionHead label="Otras direcciones" sub={direcciones.length ? `${direcciones.length} además del domicilio` : 'Solo el domicilio'}
        action={<Btn size="sm" variant="soft" icon={adding ? 'x' : 'plus'} onClick={() => setAdding(a => !a)}>{adding ? 'Cerrar' : 'Agregar'}</Btn>} />
      {adding && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, padding: '4px 0 14px', borderBottom: '1px solid var(--hair-2)', marginBottom: 6 }}>
          <TextInput value={f.label} onChange={v => set('label', v)} placeholder="Etiqueta (Trabajo…)" />
          <TextInput value={f.street} onChange={v => set('street', v)} placeholder="Calle *" />
          <TextInput value={f.number} onChange={v => set('number', v)} mono placeholder="Número" />
          <TextInput value={f.city} onChange={v => set('city', v)} placeholder="Ciudad" />
          <TextInput value={f.province} onChange={v => set('province', v)} placeholder="Provincia" />
          <Btn size="sm" variant="primary" icon="check" onClick={submit} style={{ opacity: f.street.trim() && !busy ? 1 : 0.5, pointerEvents: f.street.trim() && !busy ? 'auto' : 'none' }}>Agregar</Btn>
        </div>
      )}
      {direcciones.length === 0 && !adding ? (
        <div style={{ fontSize: 13, color: 'var(--ink-3)' }}>Domicilios laborales, quintas, depósitos.</div>
      ) : direcciones.map((d, i) => (
        <ExtraRow key={d.id} last={i === direcciones.length - 1}>
          <span style={{ width: 28, height: 28, borderRadius: 8, flexShrink: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'var(--panel-2)', color: 'var(--ink-3)', border: '1px solid var(--hair)' }}>
            <Icon name="mapPin" size={13} />
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-3)' }}>{d.label}</div>
            <div style={{ fontSize: 13, color: 'var(--ink)' }}>{d.line}</div>
          </div>
          <DelBtn onClick={() => runMut(window.rumboApi.deleteContactAddress(d.id), 'Dirección eliminada', onChanged)} />
        </ExtraRow>
      ))}
    </Panel>
  );
}

const ASSIGNEE_ROLES = [['responsable', 'Responsable'], ['comercial', 'Comercial'], ['cobranzas', 'Cobranzas'], ['siniestros', 'Siniestros']];

function ResponsablesPanel({ responsables, contactId, onChanged }) {
  const [adding, setAdding] = useState(false);
  const [users, setUsers] = useState([]);
  const [userId, setUserId] = useState('');
  const [role, setRole] = useState('responsable');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!adding) return;
    window.rumboApi.orgUsers().then(d => { setUsers(d.data); if (d.data[0]) setUserId(d.data[0].id); }).catch(() => setUsers([]));
  }, [adding]);
  const submit = () => {
    if (!userId || busy) return;
    setBusy(true);
    window.rumboApi.createAssignee(contactId, { userId, role })
      .then(() => { window.rumboUI?.toast?.('Responsable asignado'); setAdding(false); onChanged(); })
      .catch(e => window.rumboUI?.toast?.(e.message))
      .finally(() => setBusy(false));
  };
  return (
    <Panel>
      <SectionHead label="Responsables" sub={responsables.length ? `${responsables.length} asignados` : 'Sin responsables'}
        action={<Btn size="sm" variant="soft" icon={adding ? 'x' : 'plus'} onClick={() => setAdding(a => !a)}>{adding ? 'Cerrar' : 'Asignar'}</Btn>} />
      {adding && (
        <div style={{ display: 'flex', gap: 8, padding: '4px 0 14px', borderBottom: '1px solid var(--hair-2)', marginBottom: 6, flexWrap: 'wrap' }}>
          <select value={userId} onChange={e => setUserId(e.target.value)} style={{ ...inputStyle, appearance: 'none', cursor: 'pointer', flex: 2, minWidth: 140 }}>
            {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
          <select value={role} onChange={e => setRole(e.target.value)} style={{ ...inputStyle, appearance: 'none', cursor: 'pointer', flex: 1, minWidth: 110 }}>
            {ASSIGNEE_ROLES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <Btn size="sm" variant="primary" icon="check" onClick={submit} style={{ opacity: userId && !busy ? 1 : 0.5, pointerEvents: userId && !busy ? 'auto' : 'none' }}>Asignar</Btn>
        </div>
      )}
      {responsables.length === 0 && !adding ? (
        <div style={{ fontSize: 13, color: 'var(--ink-3)' }}>Quién atiende a este asegurado: comercial, cobranzas, siniestros.</div>
      ) : responsables.map((r, i) => (
        <ExtraRow key={r.id} last={i === responsables.length - 1}>
          <Avatar initials={(r.name || '—').split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase()} size={28} tone="neutral" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{r.name}</div>
            <div style={{ fontSize: 11, color: 'var(--ink-3)', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.email}</div>
          </div>
          <Pill tone="neutral" style={{ fontSize: 10.5 }}>{r.role}</Pill>
          <DelBtn onClick={() => runMut(window.rumboApi.deleteAssignee(r.id), 'Responsable quitado', onChanged)} />
        </ExtraRow>
      ))}
    </Panel>
  );
}

Object.assign(window, {
  DocumentsPanel, RisksPanel, EndososPanel, PersonasPanel, InstallmentsActions,
  RelacionesPanel, DireccionesPanel, ResponsablesPanel,
});
