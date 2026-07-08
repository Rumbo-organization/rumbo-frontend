/* ============================================================
   RUMBO — Command palette (⌘K)
   Quick lookup of contacts/policies + quick actions.
   ============================================================ */
function CommandPalette({ open, onClose, go }) {
  const [q, setQ] = useState('');
  const [sel, setSel] = useState(0);
  const [items, setItems] = useState([]);
  const inputRef = useRef(null);
  const seqRef = useRef(0);

  useEffect(() => {
    if (open) { setQ(''); setSel(0); setItems([]); setTimeout(() => inputRef.current?.focus(), 30); }
  }, [open]);

  // Búsqueda server-side (Fase 3): pólizas y contactos salen de los pickers
  // livianos del backend, no de las arrays capadas del bootstrap. Debounce +
  // guard de secuencia contra respuestas fuera de orden.
  useEffect(() => {
    if (!open) return;
    const seq = ++seqRef.current;
    const term = q.trim();
    const t = setTimeout(() => {
      Promise.all([window.rumboApi.policiesPicker(term), window.rumboApi.contactsPicker(term)])
        .then(([pr, cr]) => {
          if (seq !== seqRef.current) return;
          const its = [];
          (pr.data || []).forEach(p => its.push({
            id: 'p-' + p.id, kind: 'Póliza', label: p.client, meta: `${p.num} · ${p.insurer} · ${p.ramo}`,
            ramo: p.ramo, run: () => go('detail', { id: p.id }),
          }));
          (cr.data || []).forEach(c => its.push({
            id: 'c-' + c.id, kind: 'Asegurado', label: c.name, meta: `${c.kind} · ${c.city}`,
            initials: c.initials, run: () => go('contacto', { id: c.id }),
          }));
          setItems(its);
        })
        .catch(() => { if (seq === seqRef.current) setItems([]); });
    }, term ? 250 : 0);
    return () => clearTimeout(t);
  }, [q, open]);

  const actions = [
    { id: 'a-cotizar', kind: 'Acción', label: 'Cotizar nueva póliza', icon: 'calc', run: () => go('cotizador') },
    { id: 'a-siniestro', kind: 'Acción', label: 'Reportar siniestro', icon: 'shield', run: () => window.rumboUI?.newSiniestro() },
    { id: 'a-wsp', kind: 'Acción', label: 'Enviar WhatsApp a asegurado', icon: 'whatsapp', run: () => go('contactos') },
    { id: 'a-venc', kind: 'Acción', label: 'Ver vencimientos del mes', icon: 'calendar', run: () => go('vencimientos') },
  ];

  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    const acts = term ? actions.filter(a => a.label.toLowerCase().includes(term)) : actions;
    return [...acts, ...items].slice(0, term ? 9 : 8);
  }, [q, items]);

  useEffect(() => { setSel(0); }, [q]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') { onClose(); }
      else if (e.key === 'ArrowDown') { e.preventDefault(); setSel(s => Math.min(s + 1, results.length - 1)); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); setSel(s => Math.max(s - 1, 0)); }
      else if (e.key === 'Enter') { e.preventDefault(); const r = results[sel]; if (r) { r.run(); onClose(); } }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, results, sel]);

  if (!open) return null;

  const kindTone = { 'Acción': 'orange', 'Póliza': 'neutral', 'Asegurado': 'neutral' };

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 80, background: 'oklch(0.2 0.01 50 / 0.42)',
      backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
      paddingTop: '12vh', animation: 'rumbo-fade .12s ease',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: 620, maxWidth: '92vw', background: 'var(--panel)', borderRadius: 16,
        border: '1px solid var(--hair)', boxShadow: 'var(--shadow-pop)', overflow: 'hidden',
        animation: 'rumbo-rise .18s cubic-bezier(0.16,1,0.3,1)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 18px', borderBottom: '1px solid var(--hair)' }}>
          <Icon name="search" size={19} stroke={2} style={{ color: 'var(--ink-3)' }} />
          <input ref={inputRef} value={q} onChange={e => setQ(e.target.value)}
            placeholder="Buscar asegurados, pólizas o ejecutar una acción…"
            style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: 15.5, color: 'var(--ink)' }} />
          <kbd style={{ fontFamily: 'var(--font-mono)', fontSize: 11, padding: '3px 7px', borderRadius: 5, background: 'var(--panel-2)', border: '1px solid var(--hair)', color: 'var(--ink-3)' }}>esc</kbd>
        </div>

        <div className="scroll" style={{ maxHeight: 380, overflowY: 'auto', padding: 8 }}>
          {results.length === 0 && (
            <div style={{ padding: '36px 18px', textAlign: 'center', color: 'var(--ink-3)', fontSize: 13.5 }}>Sin resultados para “{q}”.</div>
          )}
          {results.map((r, i) => (
            <button key={r.id} onClick={() => { r.run(); onClose(); }} onMouseEnter={() => setSel(i)}
              style={{
                display: 'flex', alignItems: 'center', gap: 12, width: '100%', textAlign: 'left',
                padding: '10px 12px', borderRadius: 9,
                background: i === sel ? 'var(--orange-soft)' : 'transparent',
              }}>
              <span style={{
                width: 32, height: 32, borderRadius: 8, flexShrink: 0, display: 'inline-flex',
                alignItems: 'center', justifyContent: 'center',
                background: r.kind === 'Acción' ? 'var(--orange)' : 'var(--panel-2)',
                color: r.kind === 'Acción' ? 'var(--paper)' : 'var(--ink-2)',
                border: r.kind === 'Acción' ? 'none' : '1px solid var(--hair)',
                fontSize: 12, fontWeight: 700,
              }}>
                {r.icon ? <Icon name={r.icon} size={16} stroke={2.1} /> : r.ramo ? <Icon name={ramoIcon[r.ramo]} size={16} stroke={1.9} /> : r.initials}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.label}</div>
                {r.meta && <div className="font-mono" style={{ fontSize: 11.5, color: 'var(--ink-3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.meta}</div>}
              </div>
              <Pill tone={kindTone[r.kind]} style={{ fontSize: 10.5 }}>{r.kind}</Pill>
              {i === sel && <Icon name="arrowRight" size={15} style={{ color: 'var(--orange-ink)' }} />}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '10px 18px', borderTop: '1px solid var(--hair)', fontSize: 11.5, color: 'var(--ink-3)' }}>
          <span className="tick-row"><kbd className="font-mono" style={{ fontSize: 10.5 }}>↑↓</kbd> navegar</span>
          <span className="tick-row"><kbd className="font-mono" style={{ fontSize: 10.5 }}>↵</kbd> abrir</span>
          <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Icon name="compass" size={13} style={{ color: 'var(--emerald)' }} /> Rumbo
          </span>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { CommandPalette });
