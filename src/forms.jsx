/* ============================================================
   RUMBO — Modal shell + form controls + form modals
   ============================================================ */

/* ---------- Modal (right-side drawer; full-screen sheet on mobile) ---------- */
function Drawer({ open, onClose, title, eyebrow, footer, width = 540, children }) {
  const isMobile = useIsMobile();
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);
  if (!open) return null;
  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 70, background: 'oklch(0.2 0.01 50 / 0.42)',
      backdropFilter: 'blur(3px)', display: 'flex', justifyContent: 'flex-end', animation: 'rumbo-fade .14s ease',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: isMobile ? '100%' : width, maxWidth: '100vw', height: '100%', background: 'var(--paper)', borderLeft: isMobile ? 'none' : '1px solid var(--hair)',
        boxShadow: 'var(--shadow-pop)', display: 'flex', flexDirection: 'column',
        animation: isMobile ? 'rumbo-sheet .24s cubic-bezier(0.16,1,0.3,1)' : 'rumbo-slide .26s cubic-bezier(0.16,1,0.3,1)',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, padding: isMobile ? '16px 16px' : '20px 24px', borderBottom: '1px solid var(--hair)' }}>
          <div style={{ flex: 1 }}>
            {eyebrow && <div className="eyebrow" style={{ marginBottom: 6 }}>{eyebrow}</div>}
            <h2 className="font-display" style={{ fontSize: isMobile ? 20 : 23, letterSpacing: '-0.02em', lineHeight: 1.05 }}>{title}</h2>
          </div>
          <button onClick={onClose} style={{ width: 34, height: 34, borderRadius: 8, border: '1px solid var(--hair)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-2)', background: 'var(--panel)', flexShrink: 0 }}>
            <Icon name="x" size={17} />
          </button>
        </div>
        <div className="scroll" style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '18px 16px' : '22px 24px' }}>{children}</div>
        {footer && <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', padding: isMobile ? '14px 16px' : '16px 24px', borderTop: '1px solid var(--hair)', background: 'var(--panel)', flexWrap: 'wrap' }}>{footer}</div>}
      </div>
    </div>
  );
}

/* ---------- Field wrapper ---------- */
function Field({ label, hint, children, span = 2, required }) {
  const isMobile = useIsMobile();
  return (
    <div style={{ gridColumn: isMobile ? 'span 2' : `span ${span}` }}>
      <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600, color: 'var(--ink-2)', marginBottom: 7 }}>
        {label}{required && <span style={{ color: 'var(--orange-ink)' }}>*</span>}
        {hint && <span style={{ fontWeight: 400, color: 'var(--ink-3)' }}>· {hint}</span>}
      </label>
      {children}
    </div>
  );
}

const inputStyle = {
  width: '100%', padding: '10px 12px', fontSize: 13.5, color: 'var(--ink)',
  background: 'var(--panel)', border: '1px solid var(--hair)', borderRadius: 9, outline: 'none',
  fontFamily: 'var(--font-sans)', transition: 'border-color .14s',
};

function TextInput({ value, onChange, placeholder, mono, prefix }) {
  const [foc, setFoc] = useState(false);
  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
      {prefix && <span className="font-mono" style={{ position: 'absolute', left: 12, fontSize: 13, color: 'var(--ink-3)', pointerEvents: 'none' }}>{prefix}</span>}
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        onFocus={() => setFoc(true)} onBlur={() => setFoc(false)}
        className={mono ? 'font-mono' : ''}
        style={{ ...inputStyle, paddingLeft: prefix ? 28 : 12, borderColor: foc ? 'var(--orange)' : 'var(--hair)' }} />
    </div>
  );
}

function SelectInput({ value, onChange, options, placeholder }) {
  const [foc, setFoc] = useState(false);
  return (
    <div style={{ position: 'relative' }}>
      <select value={value} onChange={e => onChange(e.target.value)} onFocus={() => setFoc(true)} onBlur={() => setFoc(false)}
        style={{ ...inputStyle, borderColor: foc ? 'var(--orange)' : 'var(--hair)', appearance: 'none', cursor: 'pointer', paddingRight: 34 }}>
        {placeholder && <option value="">{placeholder}</option>}
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
      <Icon name="chevronDown" size={15} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-3)', pointerEvents: 'none' }} />
    </div>
  );
}

/* ramo chooser — visual segmented chips (usado por el cotizador) */
function RamoPicker({ value, onChange }) {
  const ramos = ['Automotor', 'Hogar', 'Comercio', 'Vida', 'ART', 'Integral'];
  const isMobile = useIsMobile();
  return (
    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)', gap: 8 }}>
      {ramos.map(r => {
        const active = value === r;
        return (
          <button key={r} onClick={() => onChange(r)} style={{
            display: 'flex', alignItems: 'center', gap: 9, padding: '11px 12px', borderRadius: 10, textAlign: 'left',
            border: `1px solid ${active ? 'var(--orange)' : 'var(--hair)'}`,
            background: active ? 'var(--orange-soft)' : 'var(--panel)', transition: 'all .14s',
          }}>
            <Icon name={ramoIcon[r] || 'shield'} size={18} stroke={1.9} style={{ color: active ? 'var(--orange-ink)' : 'var(--ink-3)' }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: active ? 'var(--orange-ink)' : 'var(--ink-2)' }}>{r}</span>
          </button>
        );
      })}
    </div>
  );
}

const FORM_GRID_BASE = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 };
function useFormGrid() {
  const isMobile = useIsMobile();
  return isMobile ? { display: 'grid', gridTemplateColumns: '1fr', gap: 16 } : FORM_GRID_BASE;
}
const FORM_GRID = FORM_GRID_BASE;

const selectStyle = { ...inputStyle, appearance: 'none', cursor: 'pointer' };

/* ---------- WhatsApp: "marqué que envié" (Slice 2 de paridad) ----------
   No hay API de WhatsApp Business en v0.1: abre wa.me con el texto elegido y
   registra la comunicación en el backend (POST /communications → audit). */
const WSP_TEMPLATES = [
  ['saludo', 'Saludo', 'Hola {nombre}, ¿cómo estás? Soy tu productor/a de seguros. Quedo a disposición por cualquier consulta sobre tus coberturas.'],
  ['vencimiento', 'Vencimiento', 'Hola {nombre}, te escribo porque se acerca el vencimiento de tu póliza. ¿Coordinamos la renovación?'],
  ['pago', 'Cobranza', 'Hola {nombre}, te recuerdo que tenés una cuota pendiente de pago. Cualquier duda me avisás por acá.'],
  ['siniestro', 'Siniestro', 'Hola {nombre}, recibimos tu denuncia de siniestro. Ya iniciamos la gestión con la aseguradora y te mantengo al tanto.'],
];

function WhatsAppDialog({ open, onClose, contact, policyId, onLogged }) {
  const [tpl, setTpl] = useState('saludo');
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  // Plantillas propias del PAS (Slice 6): se suman a las built-in. Misma key
  // ['message-templates'] que el editor de Configuración → cache compartida.
  const templatesQ = useApiQuery(['message-templates'], () => window.rumboApi.messageTemplates(), { enabled: open });
  const custom = templatesQ.data?.data ?? [];
  const firstName = (contact?.name || '').split(',').pop()?.trim().split(' ')[0] || contact?.name || '';
  const phone = contact?.phone ? String(contact.phone).replace(/[^0-9]/g, '') : '';

  useEffect(() => {
    if (open) {
      setTpl('saludo'); setBody(WSP_TEMPLATES[0][2].replace('{nombre}', firstName)); setError(null);
    }
  }, [open, contact]);

  const pickTpl = (k) => {
    setTpl(k);
    const t = WSP_TEMPLATES.find(([id]) => id === k);
    if (t) { setBody(t[2].replace('{nombre}', firstName)); return; }
    const c = custom.find(x => x.id === k);
    if (c) setBody(c.body.replace(/\{nombre\}/g, firstName));
  };

  const log = (thenOpen) => {
    if (busy) return;
    setBusy(true); setError(null);
    window.rumboApi.logCommunication({ contactId: contact.id, policyId: policyId || undefined, channel: 'whatsapp', templateId: tpl, body })
      .then(() => {
        if (thenOpen && phone) window.open(`https://wa.me/${phone}?text=${encodeURIComponent(body)}`, '_blank');
        window.rumboUI?.toast?.('Comunicación registrada');
        if (onLogged) onLogged();
        onClose();
      })
      .catch(e => setError(e.message)).finally(() => setBusy(false));
  };

  if (!contact) return null;
  return (
    <Drawer open={open} onClose={onClose} eyebrow="WhatsApp" title={`Escribirle a ${contact.name}`} width={520}
      footer={<>
        <Btn variant="ghost" onClick={() => log(false)} style={{ opacity: busy ? 0.5 : 1 }}>Solo registrar</Btn>
        <Btn variant="primary" icon="whatsapp" onClick={() => log(true)}
          style={{ opacity: busy || !phone ? 0.5 : 1, pointerEvents: busy || !phone ? 'none' : 'auto' }}>
          Abrir WhatsApp y registrar
        </Btn>
      </>}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {!phone && <div style={{ fontSize: 12.5, color: 'var(--ink-2)', padding: '9px 12px', borderRadius: 9, background: 'var(--panel-2)', border: '1px solid var(--hair)' }}>Este asegurado no tiene teléfono cargado: solo se puede registrar la comunicación.</div>}
        <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
          {[...WSP_TEMPLATES.map(([k, label]) => [k, label]), ...custom.map(c => [c.id, c.name])].map(([k, label]) => (
            <button key={k} onClick={() => pickTpl(k)} style={{
              fontSize: 12, fontWeight: 600, padding: '6px 12px', borderRadius: 99, cursor: 'pointer',
              border: `1px solid ${tpl === k ? 'var(--orange)' : 'var(--hair)'}`,
              background: tpl === k ? 'var(--orange-soft)' : 'var(--panel)',
              color: tpl === k ? 'var(--orange-ink)' : 'var(--ink-2)',
            }}>{label}</button>
          ))}
        </div>
        <textarea value={body} onChange={e => setBody(e.target.value)} rows={6} maxLength={2000}
          style={{ ...inputStyle, resize: 'vertical', minHeight: 130 }} />
        <div style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>Se abre WhatsApp con el texto listo y la comunicación queda registrada en la ficha del asegurado.</div>
        {error && <div style={{ fontSize: 12.5, color: 'var(--red-ink)' }}>{error}</div>}
      </div>
    </Drawer>
  );
}

/* ---------- Typeahead server-side (Fase 3 escalabilidad) ----------
   Reemplaza los <select> que iteraban RUMBO_DATA.POLICIES/CONTACTS (capados a
   1000/500 en el bootstrap). Busca contra un picker liviano del backend.
   - fetcher(q) → Promise<{ data: [...] }>  (rumboApi.policiesPicker / contactsPicker)
   - format(row) → string de la opción y del valor elegido
   - value: fila elegida (o null). onChange(row|null). */
function SearchPicker({ value, onChange, fetcher, format, placeholder, sub }) {
  const [q, setQ] = useState('');
  const [rows, setRows] = useState([]);
  const [open, setOpen] = useState(false);
  const [sel, setSel] = useState(0);
  const [loading, setLoading] = useState(false);
  const [foc, setFoc] = useState(false);
  const boxRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    const t = setTimeout(() => {
      fetcher(q.trim())
        .then(r => { setRows(r.data || []); setSel(0); })
        .catch(() => setRows([]))
        .finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(t);
  }, [q, open]);

  useEffect(() => {
    if (!open) return;
    const h = (e) => { if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);

  const pick = (row) => { onChange(row); setOpen(false); setQ(''); };

  if (value) {
    return (
      <div style={{ ...inputStyle, display: 'flex', alignItems: 'center', gap: 8, padding: '7px 7px 7px 12px' }}>
        <span style={{ flex: 1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{format(value)}</span>
        <button onClick={() => { onChange(null); setQ(''); }} title="Cambiar"
          style={{ width: 26, height: 26, borderRadius: 7, border: '1px solid var(--hair)', background: 'var(--panel-2)', color: 'var(--ink-3)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, cursor: 'pointer' }}>
          <Icon name="x" size={13} />
        </button>
      </div>
    );
  }

  return (
    <div ref={boxRef} style={{ position: 'relative' }}>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <Icon name="search" size={14} style={{ position: 'absolute', left: 11, color: 'var(--ink-3)', pointerEvents: 'none' }} />
        <input value={q} placeholder={placeholder}
          onChange={e => { setQ(e.target.value); setOpen(true); }}
          onFocus={() => { setFoc(true); setOpen(true); }}
          onBlur={() => setFoc(false)}
          onKeyDown={e => {
            if (!open) return;
            if (e.key === 'ArrowDown') { e.preventDefault(); setSel(s => Math.min(s + 1, rows.length - 1)); }
            else if (e.key === 'ArrowUp') { e.preventDefault(); setSel(s => Math.max(s - 1, 0)); }
            else if (e.key === 'Enter') { e.preventDefault(); if (rows[sel]) pick(rows[sel]); }
            else if (e.key === 'Escape') { setOpen(false); }
          }}
          style={{ ...inputStyle, paddingLeft: 32, borderColor: foc ? 'var(--orange)' : 'var(--hair)' }} />
      </div>
      {open && (
        <div className="scroll" style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 30,
          maxHeight: 240, overflowY: 'auto', background: 'var(--panel)', border: '1px solid var(--hair)',
          borderRadius: 10, boxShadow: 'var(--shadow-pop)', padding: 4,
        }}>
          {loading && rows.length === 0 && <div style={{ padding: '10px 12px', fontSize: 12.5, color: 'var(--ink-3)' }}>Buscando…</div>}
          {!loading && rows.length === 0 && <div style={{ padding: '10px 12px', fontSize: 12.5, color: 'var(--ink-3)' }}>Sin resultados{q ? ` para “${q}”` : ''}.</div>}
          {rows.map((r, i) => (
            <button key={r.id} onMouseDown={e => e.preventDefault()} onClick={() => pick(r)} onMouseEnter={() => setSel(i)}
              style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 10px', borderRadius: 7, background: i === sel ? 'var(--orange-soft)' : 'transparent', cursor: 'pointer' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{format(r)}</div>
              {sub && <div className="font-mono" style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sub(r)}</div>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ============================================================
   NUEVO SINIESTRO — denuncia real (persiste vía POST /api/v1/claims)
   Campos del modelo AR: póliza, tipo, fecha+hora del hecho, denunciante
   (obligatorio), nº de siniestro de la aseguradora, prioridad, lugar, detalle.
   ============================================================ */
const CLAIM_TIPOS = [
  ['choque', 'Choque / colisión'], ['granizo', 'Granizo'], ['robo', 'Robo'],
  ['incendio', 'Incendio'], ['cristales', 'Cristales'], ['danos_agua', 'Daños por agua'],
  ['resp_civil', 'Responsabilidad civil'], ['otros', 'Otro'],
];
const EMPTY_SINIESTRO = { policyId: '', tipo: 'choque', occurredAt: '', reportedBy: '', claimNumber: '', location: '', description: '', importance: '' };

function NuevoSiniestroForm({ open, onClose }) {
  const [f, setF] = useState(EMPTY_SINIESTRO);
  // Póliza elegida en el typeahead (fila del picker: num/client/ramo/insurer/
  // detail). Fase 3: sin RUMBO_DATA.POLICIES (capada a 1000 en el bootstrap).
  const [pol, setPol] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  useEffect(() => { if (open) { setF(EMPTY_SINIESTRO); setPol(null); setError(null); } }, [open]);

  const set = (k, v) => setF(s => ({ ...s, [k]: v }));
  const valid = f.policyId && f.tipo && f.occurredAt && f.reportedBy.trim();

  const submit = () => {
    if (!valid || saving) return;
    setSaving(true); setError(null);
    const data = { policyId: f.policyId, tipo: f.tipo, occurredAt: f.occurredAt, reportedBy: f.reportedBy.trim() };
    if (f.claimNumber.trim()) data.claimNumber = f.claimNumber.trim();
    if (f.location.trim()) data.location = f.location.trim();
    if (f.description.trim()) data.description = f.description.trim();
    if (f.importance) data.importance = f.importance;
    window.rumboApi.createClaim(data)
      .then(() => { window.rumboUI?.toast?.('Siniestro cargado'); if (window.rumboRefresh) window.rumboRefresh(); onClose(); })
      .catch(e => setError(e.message)).finally(() => setSaving(false));
  };

  return (
    <Drawer open={open} onClose={onClose} eyebrow="Siniestros · denuncia" title="Reportar siniestro" width={560}
      footer={<>
        <Btn variant="ghost" onClick={onClose}>Cancelar</Btn>
        <Btn variant="primary" icon="check" onClick={submit} style={{ opacity: valid && !saving ? 1 : 0.5, pointerEvents: valid && !saving ? 'auto' : 'none' }}>Cargar denuncia</Btn>
      </>}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <Field label="Póliza afectada" required span={2}>
          <SearchPicker value={pol} onChange={row => { setPol(row); set('policyId', row ? row.id : ''); }}
            fetcher={window.rumboApi.policiesPicker}
            format={p => `${p.num} · ${p.client}`} sub={p => `${p.insurer} · ${p.ramo}`}
            placeholder="Buscar por nº, asegurado o aseguradora…" />
        </Field>

        {pol && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', borderRadius: 10, background: 'var(--panel-2)', border: '1px solid var(--hair)' }}>
            <RamoGlyph ramo={pol.ramo} size={34} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{pol.client}</div>
              <div className="font-mono" style={{ fontSize: 11, color: 'var(--ink-3)' }}>{pol.insurer} · {pol.detail}</div>
            </div>
          </div>
        )}

        <div style={useFormGrid()}>
          <Field label="Tipo de siniestro" required>
            <select value={f.tipo} onChange={e => set('tipo', e.target.value)} style={selectStyle}>
              {CLAIM_TIPOS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </Field>
          <Field label="Fecha y hora del hecho" required>
            <input type="datetime-local" value={f.occurredAt} onChange={e => set('occurredAt', e.target.value)} style={inputStyle} />
          </Field>
          <Field label="Denunciante" required hint="quién reporta">
            <TextInput value={f.reportedBy} onChange={v => set('reportedBy', v)} placeholder="Ej: el asegurado" />
          </Field>
          <Field label="Nº de siniestro" hint="de la aseguradora">
            <TextInput value={f.claimNumber} onChange={v => set('claimNumber', v)} mono placeholder="opcional" />
          </Field>
          <Field label="Prioridad" hint="triage">
            <select value={f.importance} onChange={e => set('importance', e.target.value)} style={selectStyle}>
              <option value="">Sin priorizar</option>
              <option value="alta">Alta</option>
              <option value="media">Media</option>
              <option value="baja">Baja</option>
            </select>
          </Field>
          <Field label="Lugar del hecho">
            <TextInput value={f.location} onChange={v => set('location', v)} placeholder="Dirección o referencia" />
          </Field>
          <Field label="Descripción del hecho" span={2}>
            <textarea value={f.description} onChange={e => set('description', e.target.value)} rows={4}
              style={{ ...inputStyle, resize: 'vertical', minHeight: 88 }} placeholder="Detalle de lo ocurrido…" />
          </Field>
        </div>

        {error && <div style={{ fontSize: 12.5, color: 'var(--red-ink)' }}>{error}</div>}
      </div>
    </Drawer>
  );
}

/* ============================================================
   NUEVO CONTACTO — alta real (POST /api/v1/contacts). Regla de negocio:
   nace SIEMPRE como prospecto (sin selector de estado). Pasa a asegurado cuando
   se importa su primera póliza.
   ============================================================ */
const EMPTY_CONTACTO = { kind: 'PERSONA_FISICA', firstName: '', lastName: '', legalName: '', dni: '', cuit: '', city: '', phone: '', notes: '' };

function NuevoContactoForm({ open, onClose }) {
  const [f, setF] = useState(EMPTY_CONTACTO);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  useEffect(() => { if (open) { setF(EMPTY_CONTACTO); setError(null); } }, [open]);

  const set = (k, v) => setF(s => ({ ...s, [k]: v }));
  const juridica = f.kind === 'PERSONA_JURIDICA';
  const valid = juridica ? f.legalName.trim() : (f.firstName.trim() || f.lastName.trim());

  const submit = () => {
    if (!valid || saving) return;
    setSaving(true); setError(null);
    const data = { kind: f.kind, city: f.city, phone: f.phone, notes: f.notes, cuit: f.cuit };
    if (juridica) data.legalName = f.legalName;
    else { data.firstName = f.firstName; data.lastName = f.lastName; data.dni = f.dni; }
    window.rumboApi.createContact(data)
      .then(() => { window.rumboUI?.toast?.('Contacto creado como prospecto'); if (window.rumboRefresh) window.rumboRefresh(); onClose(); })
      .catch(e => setError(e.message)).finally(() => setSaving(false));
  };

  return (
    <Drawer open={open} onClose={onClose} eyebrow="Cartera · alta" title="Nuevo contacto" width={540}
      footer={<>
        <Btn variant="ghost" onClick={onClose}>Cancelar</Btn>
        <Btn variant="primary" icon="check" onClick={submit} style={{ opacity: valid && !saving ? 1 : 0.5, pointerEvents: valid && !saving ? 'auto' : 'none' }}>Crear prospecto</Btn>
      </>}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          {[['PERSONA_FISICA', 'Persona'], ['PERSONA_JURIDICA', 'Empresa']].map(([v, l]) => (
            <button key={v} onClick={() => set('kind', v)} style={{
              flex: 1, padding: 10, borderRadius: 9, border: `1px solid ${f.kind === v ? 'var(--orange)' : 'var(--hair)'}`,
              background: f.kind === v ? 'var(--orange-soft)' : 'var(--panel)', color: f.kind === v ? 'var(--orange-ink)' : 'var(--ink-2)', fontWeight: 600, fontSize: 13,
            }}>{l}</button>
          ))}
        </div>

        <div style={useFormGrid()}>
          {juridica ? (
            <Field label="Razón social" required span={2}><TextInput value={f.legalName} onChange={v => set('legalName', v)} placeholder="Razón social de la empresa" /></Field>
          ) : (
            <>
              <Field label="Nombre"><TextInput value={f.firstName} onChange={v => set('firstName', v)} /></Field>
              <Field label="Apellido"><TextInput value={f.lastName} onChange={v => set('lastName', v)} /></Field>
            </>
          )}
          {juridica
            ? <Field label="CUIT"><TextInput value={f.cuit} onChange={v => set('cuit', v.replace(/[^0-9]/g, ''))} mono placeholder="opcional" /></Field>
            : <Field label="DNI"><TextInput value={f.dni} onChange={v => set('dni', v.replace(/[^0-9]/g, ''))} mono placeholder="opcional" /></Field>}
          <Field label="Ciudad"><TextInput value={f.city} onChange={v => set('city', v)} placeholder="opcional" /></Field>
          <Field label="Teléfono" span={2}><TextInput value={f.phone} onChange={v => set('phone', v)} mono placeholder="+54 9 ..." /></Field>
          <Field label="Observaciones" span={2}>
            <textarea value={f.notes} onChange={e => set('notes', e.target.value)} rows={2} style={{ ...inputStyle, resize: 'vertical', minHeight: 56 }} placeholder="opcional" />
          </Field>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', borderRadius: 10, background: 'var(--panel-2)', border: '1px solid var(--hair)', fontSize: 12, color: 'var(--ink-2)' }}>
          <Icon name="compass" size={16} style={{ color: 'var(--emerald)', flexShrink: 0 }} />
          <span>Nace como <strong style={{ color: 'var(--orange-ink)' }}>prospecto</strong>. Pasa a asegurado cuando importás su primera póliza.</span>
        </div>

        {error && <div style={{ fontSize: 12.5, color: 'var(--red-ink)' }}>{error}</div>}
      </div>
    </Drawer>
  );
}

/* ============================================================
   EDITAR ASEGURADO — datos, domicilio y medios de contacto múltiples
   (F-010 / F-020). Persiste vía PATCH /api/v1/contacts/:id. Se prefila con
   `contact` = el objeto `form` crudo que devuelve GET /contacts/:id.
   ============================================================ */
const METHOD_TYPES = [
  ['celular', 'Celular'], ['telefono', 'Teléfono'], ['whatsapp', 'WhatsApp'], ['email', 'Email'],
];

function fromContact(contact) {
  const c = contact || {};
  const methods = Array.isArray(c.contactMethods) && c.contactMethods.length
    ? c.contactMethods.map(m => ({ type: m.type || 'celular', value: m.value || '', primary: !!m.primary }))
    : [];
  return {
    kind: c.kind || 'PERSONA_FISICA',
    firstName: c.firstName || '', lastName: c.lastName || '', legalName: c.legalName || '',
    dni: c.dni || '', cuit: c.cuit || '', notes: c.notes || '',
    addressStreet: c.addressStreet || '', addressNumber: c.addressNumber || '',
    addressFloor: c.addressFloor || '', addressApartment: c.addressApartment || '',
    addressCity: c.addressCity || '', addressProvince: c.addressProvince || '', addressPostalCode: c.addressPostalCode || '',
    methods,
  };
}

function EditContactoForm({ open, onClose, contact, onSaved }) {
  const [f, setF] = useState(() => fromContact(contact));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  useEffect(() => { if (open) { setF(fromContact(contact)); setError(null); } }, [open, contact]);

  const set = (k, v) => setF(s => ({ ...s, [k]: v }));
  const juridica = f.kind === 'PERSONA_JURIDICA';

  const setMethod = (i, k, v) => setF(s => ({ ...s, methods: s.methods.map((m, j) => j === i ? { ...m, [k]: v } : m) }));
  const setPrimary = (i) => setF(s => ({ ...s, methods: s.methods.map((m, j) => ({ ...m, primary: j === i })) }));
  const addMethod = () => setF(s => ({ ...s, methods: [...s.methods, { type: 'celular', value: '', primary: s.methods.length === 0 }] }));
  const removeMethod = (i) => setF(s => ({ ...s, methods: s.methods.filter((_, j) => j !== i) }));

  const valid = juridica ? f.legalName.trim() : (f.firstName.trim() || f.lastName.trim());

  const submit = () => {
    if (!valid || saving) return;
    setSaving(true); setError(null);
    const data = {
      notes: f.notes,
      addressStreet: f.addressStreet, addressNumber: f.addressNumber,
      addressFloor: f.addressFloor, addressApartment: f.addressApartment,
      addressCity: f.addressCity, addressProvince: f.addressProvince, addressPostalCode: f.addressPostalCode,
      contactMethods: f.methods.filter(m => m.value.trim()).map(m => ({ type: m.type, value: m.value.trim(), primary: !!m.primary })),
    };
    if (juridica) { data.legalName = f.legalName; data.cuit = f.cuit; }
    else { data.firstName = f.firstName; data.lastName = f.lastName; data.dni = f.dni; data.cuit = f.cuit; }
    window.rumboApi.updateContact(contact.id, data)
      .then(() => { window.rumboUI?.toast?.('Asegurado actualizado'); if (window.rumboRefresh) window.rumboRefresh(); onSaved && onSaved(); onClose(); })
      .catch(e => setError(e.message)).finally(() => setSaving(false));
  };

  return (
    <Drawer open={open} onClose={onClose} eyebrow="Cartera · edición" title="Editar asegurado" width={560}
      footer={<>
        <Btn variant="ghost" onClick={onClose}>Cancelar</Btn>
        <Btn variant="primary" icon="check" onClick={submit} style={{ opacity: valid && !saving ? 1 : 0.5, pointerEvents: valid && !saving ? 'auto' : 'none' }}>Guardar cambios</Btn>
      </>}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* datos */}
        <div style={useFormGrid()}>
          {juridica ? (
            <Field label="Razón social" required span={2}><TextInput value={f.legalName} onChange={v => set('legalName', v)} /></Field>
          ) : (
            <>
              <Field label="Nombre"><TextInput value={f.firstName} onChange={v => set('firstName', v)} /></Field>
              <Field label="Apellido"><TextInput value={f.lastName} onChange={v => set('lastName', v)} /></Field>
            </>
          )}
          {juridica
            ? <Field label="CUIT" span={2}><TextInput value={f.cuit} onChange={v => set('cuit', v.replace(/[^0-9]/g, ''))} mono placeholder="opcional" /></Field>
            : <Field label="DNI" span={2}><TextInput value={f.dni} onChange={v => set('dni', v.replace(/[^0-9]/g, ''))} mono placeholder="opcional" /></Field>}
        </div>

        {/* domicilio */}
        <div>
          <div className="eyebrow" style={{ marginBottom: 10 }}>Domicilio</div>
          <div style={useFormGrid()}>
            <Field label="Calle" span={1}><TextInput value={f.addressStreet} onChange={v => set('addressStreet', v)} placeholder="Av. Colón" /></Field>
            <Field label="Número" span={1}><TextInput value={f.addressNumber} onChange={v => set('addressNumber', v)} mono /></Field>
            <Field label="Piso" span={1}><TextInput value={f.addressFloor} onChange={v => set('addressFloor', v)} mono placeholder="opcional" /></Field>
            <Field label="Depto" span={1}><TextInput value={f.addressApartment} onChange={v => set('addressApartment', v)} mono placeholder="opcional" /></Field>
            <Field label="Ciudad" span={1}><TextInput value={f.addressCity} onChange={v => set('addressCity', v)} /></Field>
            <Field label="Provincia" span={1}><TextInput value={f.addressProvince} onChange={v => set('addressProvince', v)} /></Field>
            <Field label="Código postal" span={2}><TextInput value={f.addressPostalCode} onChange={v => set('addressPostalCode', v)} mono placeholder="opcional" /></Field>
          </div>
        </div>

        {/* medios de contacto múltiples */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <span className="eyebrow">Medios de contacto</span>
            <Btn size="sm" variant="ghost" icon="plus" onClick={addMethod}>Agregar</Btn>
          </div>
          {f.methods.length === 0 ? (
            <div style={{ fontSize: 12.5, color: 'var(--ink-3)' }}>Sin medios. Agregá teléfono, celular, WhatsApp o email.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {f.methods.map((m, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <select value={m.type} onChange={e => setMethod(i, 'type', e.target.value)}
                    style={{ ...inputStyle, width: 118, flexShrink: 0, appearance: 'none', cursor: 'pointer', paddingRight: 12 }}>
                    {METHOD_TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <TextInput value={m.value} onChange={v => setMethod(i, 'value', v)} mono
                      placeholder={m.type === 'email' ? 'vos@correo.com' : '+54 9 ...'} />
                  </div>
                  <button title="Marcar como principal" onClick={() => setPrimary(i)} style={{
                    flexShrink: 0, height: 38, padding: '0 10px', borderRadius: 9, fontSize: 11, fontWeight: 600,
                    border: `1px solid ${m.primary ? 'var(--orange)' : 'var(--hair)'}`,
                    background: m.primary ? 'var(--orange-soft)' : 'var(--panel)',
                    color: m.primary ? 'var(--orange-ink)' : 'var(--ink-3)', cursor: 'pointer',
                  }}>Principal</button>
                  <button title="Quitar" onClick={() => removeMethod(i)} style={{
                    flexShrink: 0, width: 38, height: 38, borderRadius: 9, border: '1px solid var(--hair)',
                    background: 'var(--panel)', color: 'var(--ink-3)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  }}><Icon name="x" size={15} /></button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* observaciones */}
        <Field label="Observaciones" span={2}>
          <textarea value={f.notes} onChange={e => set('notes', e.target.value)} rows={2} style={{ ...inputStyle, resize: 'vertical', minHeight: 56 }} placeholder="opcional" />
        </Field>

        {error && <div style={{ fontSize: 12.5, color: 'var(--red-ink)' }}>{error}</div>}
      </div>
    </Drawer>
  );
}

Object.assign(window, { Drawer, Field, TextInput, SelectInput, SearchPicker, RamoPicker, WhatsAppDialog, inputStyle, FORM_GRID, useFormGrid, NuevoSiniestroForm, NuevoContactoForm, EditContactoForm });
