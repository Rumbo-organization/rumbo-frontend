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

/* ramo chooser — visual segmented chips */
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

/* ============================================================
   NUEVA PÓLIZA
   ============================================================ */
function NuevaPolizaForm({ open, onClose, onCreated }) {
  const { CONTACTS, INSURERS } = window.RUMBO_DATA;
  const [f, setF] = useState({ cliente: '', ramo: 'Automotor', insurer: '', detalle: '', prima: '', freq: 'Mensual', start: '2026-06-23', suma: '', cobertura: '' });
  const set = (k, v) => setF(s => ({ ...s, [k]: v }));
  const valid = f.cliente && f.ramo && f.insurer && f.prima;

  useEffect(() => { if (open) setF({ cliente: '', ramo: 'Automotor', insurer: '', detalle: '', prima: '', freq: 'Mensual', start: '2026-06-23', suma: '', cobertura: '' }); }, [open]);

  return (
    <Drawer open={open} onClose={onClose} eyebrow="Cartera · alta" title="Nueva póliza"
      footer={<>
        <Btn variant="ghost" onClick={onClose}>Cancelar</Btn>
        <Btn variant="primary" icon="check" onClick={() => { onCreated && onCreated(f); onClose(); }} style={{ opacity: valid ? 1 : 0.5, pointerEvents: valid ? 'auto' : 'none' }}>Emitir póliza</Btn>
      </>}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
        <div>
          <div className="eyebrow" style={{ marginBottom: 10 }}>Ramo</div>
          <RamoPicker value={f.ramo} onChange={v => set('ramo', v)} />
        </div>

        <div style={useFormGrid()}>
          <Field label="Cliente" required span={2}>
            <SelectInput value={f.cliente} onChange={v => set('cliente', v)} options={CONTACTS.map(c => c.name)} placeholder="Seleccionar contacto…" />
          </Field>
          <Field label="Aseguradora" required>
            <SelectInput value={f.insurer} onChange={v => set('insurer', v)} options={INSURERS} placeholder="Elegir…" />
          </Field>
          <Field label="Vigencia desde">
            <TextInput value={f.start} onChange={v => set('start', v)} mono placeholder="AAAA-MM-DD" />
          </Field>
          <Field label="Detalle del riesgo" span={2} hint="vehículo, domicilio, etc.">
            <TextInput value={f.detalle} onChange={v => set('detalle', v)} placeholder="Ej: Peugeot 208 · AB 442 KQ" />
          </Field>
          <Field label="Prima" required hint="por período">
            <TextInput value={f.prima} onChange={v => set('prima', v.replace(/[^0-9]/g, ''))} mono prefix="$" placeholder="0" />
          </Field>
          <Field label="Frecuencia">
            <SelectInput value={f.freq} onChange={v => set('freq', v)} options={['Mensual', 'Trimestral', 'Semestral', 'Anual']} />
          </Field>
          <Field label="Suma asegurada" hint="opcional">
            <TextInput value={f.suma} onChange={v => set('suma', v.replace(/[^0-9]/g, ''))} mono prefix="$" placeholder="0" />
          </Field>
          <Field label="Cobertura">
            <TextInput value={f.cobertura} onChange={v => set('cobertura', v)} placeholder="Ej: Todo riesgo" />
          </Field>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '12px 14px', borderRadius: 10, background: 'var(--panel-2)', border: '1px solid var(--hair)' }}>
          <Icon name="compass" size={18} style={{ color: 'var(--emerald)' }} />
          <div style={{ fontSize: 12, color: 'var(--ink-2)' }}>¿No tenés la prima cerrada? <strong style={{ color: 'var(--orange-ink)' }}>Cotizá primero</strong> y emití la mejor opción con un clic.</div>
        </div>
      </div>
    </Drawer>
  );
}

/* ============================================================
   NUEVO SINIESTRO
   ============================================================ */
function NuevoSiniestroForm({ open, onClose, onCreated }) {
  const { POLICIES } = window.RUMBO_DATA;
  const tipos = ['Choque / colisión', 'Granizo', 'Robo total', 'Robo parcial', 'Incendio', 'Cristales', 'Daños por agua', 'Responsabilidad civil'];
  const [f, setF] = useState({ poliza: '', tipo: '', fecha: '2026-06-22', lugar: '', desc: '', urgente: false });
  const set = (k, v) => setF(s => ({ ...s, [k]: v }));
  const valid = f.poliza && f.tipo && f.fecha;

  useEffect(() => { if (open) setF({ poliza: '', tipo: '', fecha: '2026-06-22', lugar: '', desc: '', urgente: false }); }, [open]);

  const pol = POLICIES.find(p => p.num === f.poliza);

  return (
    <Drawer open={open} onClose={onClose} eyebrow="Siniestros · denuncia" title="Reportar siniestro" width={520}
      footer={<>
        <Btn variant="ghost" onClick={onClose}>Cancelar</Btn>
        <Btn variant="primary" icon="check" onClick={() => { onCreated && onCreated(f); onClose(); }} style={{ opacity: valid ? 1 : 0.5, pointerEvents: valid ? 'auto' : 'none' }}>Cargar denuncia</Btn>
      </>}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <Field label="Póliza afectada" required span={2}>
          <SelectInput value={f.poliza} onChange={v => set('poliza', v)} options={POLICIES.map(p => `${p.num} — ${p.client}`)} placeholder="Buscar póliza…" />
        </Field>

        {pol && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', borderRadius: 10, background: 'var(--panel-2)', border: '1px solid var(--hair)' }}>
            <RamoGlyph ramo={pol.ramo} size={34} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{pol.client}</div>
              <div className="font-mono" style={{ fontSize: 11, color: 'var(--ink-3)' }}>{pol.insurer} · {pol.detail}</div>
            </div>
            <Pill tone="emerald" dot>Vigente</Pill>
          </div>
        )}

        <div style={useFormGrid()}>
          <Field label="Tipo de siniestro" required>
            <SelectInput value={f.tipo} onChange={v => set('tipo', v)} options={tipos} placeholder="Elegir…" />
          </Field>
          <Field label="Fecha del hecho" required>
            <TextInput value={f.fecha} onChange={v => set('fecha', v)} mono placeholder="AAAA-MM-DD" />
          </Field>
          <Field label="Lugar" span={2}>
            <TextInput value={f.lugar} onChange={v => set('lugar', v)} placeholder="Dirección o referencia" />
          </Field>
          <Field label="Descripción del hecho" span={2}>
            <textarea value={f.desc} onChange={e => set('desc', e.target.value)} placeholder="Detalle de lo ocurrido…" rows={4}
              style={{ ...inputStyle, resize: 'vertical', minHeight: 88 }} />
          </Field>
        </div>

        <button onClick={() => set('urgente', !f.urgente)} style={{
          display: 'flex', alignItems: 'center', gap: 11, padding: '12px 14px', borderRadius: 10, width: '100%', textAlign: 'left',
          border: `1px solid ${f.urgente ? 'var(--red)' : 'var(--hair)'}`, background: f.urgente ? 'var(--red-soft)' : 'var(--panel)',
        }}>
          <span style={{ width: 20, height: 20, borderRadius: 6, border: `1.5px solid ${f.urgente ? 'var(--red)' : 'var(--hair)'}`, background: f.urgente ? 'var(--red)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {f.urgente && <Icon name="check" size={13} stroke={3} style={{ color: '#fff' }} />}
          </span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: f.urgente ? 'var(--red-ink)' : 'var(--ink)' }}>Marcar como urgente</div>
            <div style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>Prioriza la gestión y avisa a la aseguradora hoy.</div>
          </div>
        </button>
      </div>
    </Drawer>
  );
}

Object.assign(window, { Drawer, Field, TextInput, SelectInput, RamoPicker, inputStyle, FORM_GRID, NuevaPolizaForm, NuevoSiniestroForm });
