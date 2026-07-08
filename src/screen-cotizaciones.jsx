/* ============================================================
   RUMBO — Cotizaciones (multicotizador real, Slice 5 de paridad)
   Historial server-side (GET /cotizaciones) + detalle con opciones por
   aseguradora (vistas Lista/Matriz, resalta mejor precio) + alta manual de
   opciones. El rating en vivo queda gated por integración.
   ============================================================ */

const COVERAGES = [
  ['rc', 'Responsabilidad civil'],
  ['rc_grua', 'RC con grúa'],
  ['rc_robo_incendio', 'RC + robo + incendio total'],
  ['incendio_robo_garage', 'Incendio y robo en garage'],
  ['terceros_completo', 'Tercero completo'],
  ['terceros_completo_full', 'Tercero completo full'],
  ['todo_riesgo_franquicia', 'Todo riesgo con franquicia'],
  ['todo_riesgo_sin_franquicia', 'Todo riesgo sin franquicia'],
];
const QUOTE_RAMOS = [
  ['automotor', 'Automotor'], ['motovehiculo', 'Motovehículo'], ['hogar', 'Hogar'],
  ['comercio', 'Comercio'], ['vida', 'Vida'], ['art', 'ART'], ['otros', 'Otros'],
];

/* Alta de cotización: vínculo opcional a asegurado + referencia + vehículo. */
function NuevaCotizacionDrawer({ open, onClose, onCreated }) {
  const [who, setWho] = useState(null);
  const [f, setF] = useState({ ramo: 'automotor', reference: '', marca: '', modelo: '', anio: '', notes: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  useEffect(() => { if (open) { setWho(null); setF({ ramo: 'automotor', reference: '', marca: '', modelo: '', anio: '', notes: '' }); setError(null); } }, [open]);
  const set = (k, v) => setF(s => ({ ...s, [k]: v }));
  const submit = () => {
    if (busy) return;
    setBusy(true); setError(null);
    window.rumboApi.createQuote({
      contactId: who ? who.id : undefined, ramo: f.ramo, reference: f.reference,
      vehicleMarca: f.marca, vehicleModelo: f.modelo, vehicleAnio: f.anio, notes: f.notes,
    })
      .then((d) => { window.rumboUI?.toast?.('Cotización creada'); onCreated(d.id); onClose(); })
      .catch(e => setError(e.message)).finally(() => setBusy(false));
  };
  return (
    <Drawer open={open} onClose={onClose} eyebrow="Cotizaciones" title="Nueva cotización" width={500}
      footer={<>
        <Btn variant="ghost" onClick={onClose}>Cancelar</Btn>
        <Btn variant="primary" icon="check" onClick={submit} style={{ opacity: busy ? 0.5 : 1 }}>Crear</Btn>
      </>}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Field label="Asegurado" hint="opcional">
          <SearchPicker value={who} onChange={setWho} fetcher={window.rumboApi.contactsPicker}
            format={c => c.name} sub={c => `${c.kind} · ${c.city}`} placeholder="Buscar asegurado…" />
        </Field>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="Ramo" span={1}>
            <select value={f.ramo} onChange={e => set('ramo', e.target.value)} style={{ ...inputStyle, appearance: 'none', cursor: 'pointer' }}>
              {QUOTE_RAMOS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </Field>
          <Field label="Referencia" span={1} hint="si no hay asegurado"><TextInput value={f.reference} onChange={v => set('reference', v)} placeholder="Ej: Sr. Gómez" /></Field>
          <Field label="Marca" span={1}><TextInput value={f.marca} onChange={v => set('marca', v)} placeholder="opcional" /></Field>
          <Field label="Modelo" span={1}><TextInput value={f.modelo} onChange={v => set('modelo', v)} placeholder="opcional" /></Field>
          <Field label="Año" span={1}><TextInput value={f.anio} onChange={v => set('anio', v.replace(/[^0-9]/g, ''))} mono placeholder="opcional" /></Field>
        </div>
        <Field label="Notas"><textarea value={f.notes} onChange={e => set('notes', e.target.value)} rows={2} style={{ ...inputStyle, resize: 'vertical' }} placeholder="opcional" /></Field>
        {error && <div style={{ fontSize: 12.5, color: 'var(--red-ink)' }}>{error}</div>}
      </div>
    </Drawer>
  );
}

/* Detalle: titular + opciones (Lista/Matriz) + agregar/quitar opciones. */
function QuoteDetailDrawer({ open, onClose, quoteId, onChanged }) {
  const { ars } = window.rumboFmt;
  const [q, setQ] = useState(null);
  const [view, setView] = useState('lista'); // lista | matriz
  const [adding, setAdding] = useState(false);
  const [insurersList, setInsurersList] = useState([]);
  const [item, setItem] = useState({ insurerId: '', coverage: 'terceros_completo', cuota: '', sumaAsegurada: '' });
  const [busy, setBusy] = useState(false);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    if (!open || !quoteId) return;
    let alive = true;
    window.rumboApi.quoteById(quoteId).then(d => { if (alive) setQ(d); }).catch(() => {});
    return () => { alive = false; };
  }, [open, quoteId, reload]);
  useEffect(() => {
    if (!adding) return;
    window.rumboApi.insurersPicker().then(d => {
      setInsurersList(d.data);
      if (d.data[0]) setItem(s => ({ ...s, insurerId: s.insurerId || d.data[0].id }));
    }).catch(() => {});
  }, [adding]);

  const refetch = () => { setReload(r => r + 1); onChanged(); };
  const addItem = () => {
    if (busy || !item.insurerId || (!item.cuota && !item.sumaAsegurada)) return;
    setBusy(true);
    window.rumboApi.addQuoteItem(quoteId, item)
      .then(() => { window.rumboUI?.toast?.('Opción cargada'); setItem(s => ({ ...s, cuota: '', sumaAsegurada: '' })); refetch(); })
      .catch(e => window.rumboUI?.toast?.(e.message)).finally(() => setBusy(false));
  };
  const delItem = (id) => {
    window.rumboApi.deleteQuoteItem(id).then(() => refetch()).catch(e => window.rumboUI?.toast?.(e.message));
  };
  const delQuote = () => {
    if (!window.confirm('¿Eliminar la cotización y sus opciones?')) return;
    window.rumboApi.deleteQuote(quoteId)
      .then(() => { window.rumboUI?.toast?.('Cotización eliminada'); onChanged(); onClose(); })
      .catch(e => window.rumboUI?.toast?.(e.message));
  };

  if (!q) return open ? <Drawer open onClose={onClose} eyebrow="Cotización" title="Cargando…" width={640}><span className="skel" style={{ display: 'block', width: '100%', height: 200, borderRadius: 10 }} /></Drawer> : null;

  const best = q.items.reduce((acc, it) => (it.cuota != null && (acc == null || it.cuota < acc.cuota) ? it : acc), null);
  // Matriz: filas = coberturas presentes; columnas = aseguradoras presentes.
  const covs = [...new Set(q.items.map(it => it.coverage).filter(Boolean))];
  const insCols = [...new Set(q.items.map(it => it.insurer))];
  const cell = (cov, ins) => q.items.find(it => it.coverage === cov && it.insurer === ins) ?? null;

  return (
    <Drawer open={open} onClose={onClose} eyebrow={`Cotización ${q.num}`} title={q.client} width={680}
      footer={<>
        <Btn variant="ghost" onClick={delQuote} style={{ color: 'var(--red-ink)' }}>Eliminar</Btn>
        <Btn variant="primary" onClick={onClose}>Listo</Btn>
      </>}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', fontSize: 12.5, color: 'var(--ink-2)' }}>
          <Pill tone="neutral">{q.ramo}</Pill>
          {q.vehicle && <Pill tone="neutral"><span className="font-mono">{q.vehicle}</span></Pill>}
          <Pill tone="neutral">{q.date}</Pill>
        </div>
        {q.notes && <div style={{ fontSize: 12.5, color: 'var(--ink-3)' }}>{q.notes}</div>}

        <SectionHead label={`Opciones (${q.items.length})`}
          action={
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ display: 'flex', gap: 4, background: 'var(--panel-2)', border: '1px solid var(--hair)', borderRadius: 9, padding: 3 }}>
                {[['lista', 'Lista'], ['matriz', 'Matriz']].map(([v, l]) => (
                  <button key={v} onClick={() => setView(v)} style={{ padding: '4px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600, color: view === v ? 'var(--ink)' : 'var(--ink-3)', background: view === v ? 'var(--panel)' : 'transparent' }}>{l}</button>
                ))}
              </div>
              <Btn size="sm" variant="soft" icon={adding ? 'x' : 'plus'} onClick={() => setAdding(a => !a)}>{adding ? 'Cerrar' : 'Cargar opción'}</Btn>
            </div>
          } />

        {adding && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, padding: 14, borderRadius: 10, background: 'var(--panel-2)', border: '1px solid var(--hair)' }}>
            <select value={item.insurerId} onChange={e => setItem(s => ({ ...s, insurerId: e.target.value }))} style={{ ...inputStyle, appearance: 'none', cursor: 'pointer' }}>
              {insurersList.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
            </select>
            <select value={item.coverage} onChange={e => setItem(s => ({ ...s, coverage: e.target.value }))} style={{ ...inputStyle, appearance: 'none', cursor: 'pointer' }}>
              {COVERAGES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
            <TextInput value={item.cuota} onChange={v => setItem(s => ({ ...s, cuota: v.replace(/[^0-9.]/g, '') }))} mono prefix="$" placeholder="Cuota mensual" />
            <TextInput value={item.sumaAsegurada} onChange={v => setItem(s => ({ ...s, sumaAsegurada: v.replace(/[^0-9.]/g, '') }))} mono prefix="$" placeholder="Suma asegurada" />
            <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end' }}>
              <Btn size="sm" variant="primary" icon="check" onClick={addItem}
                style={{ opacity: item.insurerId && (item.cuota || item.sumaAsegurada) && !busy ? 1 : 0.5 }}>Agregar</Btn>
            </div>
          </div>
        )}

        {q.items.length === 0 && !adding && (
          <div style={{ fontSize: 13, color: 'var(--ink-3)' }}>Cargá las opciones que te pasó cada aseguradora para compararlas.</div>
        )}

        {view === 'lista' && q.items.map((it) => (
          <div key={it.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 10, border: `1px solid ${best && it.id === best.id ? 'var(--emerald)' : 'var(--hair)'}`, background: best && it.id === best.id ? 'var(--emerald-soft)' : 'var(--panel)' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13.5, fontWeight: 600 }}>{it.insurer}{best && it.id === best.id && <span style={{ fontSize: 10.5, color: 'var(--emerald-ink)', marginLeft: 8, fontWeight: 700 }}>MEJOR PRECIO</span>}</div>
              <div style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>{it.coverageLabel || 'Sin cobertura normalizada'}{it.sumaAsegurada ? ` · SA ${ars(it.sumaAsegurada)}` : ''}</div>
            </div>
            {it.cuota != null && <span className="font-mono tnum" style={{ fontSize: 14, fontWeight: 700 }}>{ars(it.cuota)}<span style={{ fontSize: 11, color: 'var(--ink-3)', fontWeight: 400 }}>/mes</span></span>}
            <button title="Quitar" onClick={() => delItem(it.id)} style={{ width: 26, height: 26, borderRadius: 7, border: '1px solid var(--hair)', background: 'var(--panel-2)', color: 'var(--ink-3)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><Icon name="x" size={12} /></button>
          </div>
        ))}

        {view === 'matriz' && (covs.length === 0 ? (
          <div style={{ fontSize: 13, color: 'var(--ink-3)' }}>La matriz necesita opciones con cobertura normalizada.</div>
        ) : (
          <div style={{ overflowX: 'auto' }} className="scroll">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '6px 8px' }} className="eyebrow">Cobertura</th>
                  {insCols.map(ins => <th key={ins} style={{ textAlign: 'right', padding: '6px 8px' }} className="eyebrow">{ins}</th>)}
                </tr>
              </thead>
              <tbody>
                {covs.map(cov => (
                  <tr key={cov} style={{ borderTop: '1px solid var(--hair-2)' }}>
                    <td style={{ padding: '9px 8px', fontWeight: 600 }}>{COVERAGES.find(([v]) => v === cov)?.[1] ?? cov}</td>
                    {insCols.map(ins => {
                      const it = cell(cov, ins);
                      const isBest = it && best && it.id === best.id;
                      return (
                        <td key={ins} className="font-mono tnum" style={{ padding: '9px 8px', textAlign: 'right', fontWeight: isBest ? 700 : 400, color: isBest ? 'var(--emerald-ink)' : 'var(--ink)' }}>
                          {it && it.cuota != null ? ars(it.cuota) : <span style={{ color: 'var(--hair)' }}>·</span>}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </Drawer>
  );
}

function ScreenCotizaciones({ go }) {
  const isMobile = useIsMobile();
  const { ars } = window.rumboFmt;
  const version = useRumboVersion();
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [reload, setReload] = useState(0);
  const [seg, setSeg] = useState('todas');
  const [openId, setOpenId] = useState(null);
  const [newOpen, setNewOpen] = useState(false);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    window.rumboApi.cotizacionesPage({ limit: 100 })
      .then(d => { if (alive) { setRows(d.data); setTotal(d.total); setLoading(false); } })
      .catch(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [version, reload]);

  const statusTone = { Borrador: 'neutral', Enviada: 'amber', Aceptada: 'emerald', Vencida: 'red' };
  const segs = [
    { id: 'todas', label: 'Todas', n: rows.length },
    { id: 'Enviada', label: 'Enviadas', n: rows.filter(c => c.status === 'Enviada').length },
    { id: 'Borrador', label: 'Borradores', n: rows.filter(c => c.status === 'Borrador').length },
    { id: 'Vencida', label: 'Vencidas', n: rows.filter(c => c.status === 'Vencida').length },
  ];
  const shown = seg === 'todas' ? rows : rows.filter(c => c.status === seg);

  return (
    <div className="scroll rise" style={{ overflowY: 'auto', height: '100%', padding: isMobile ? '18px 16px 40px' : '30px 34px 60px' }}>
      <div style={{ maxWidth: 1180, margin: '0 auto' }}>
        <PageHead eyebrow="Cartera" tick={2} title="Cotizaciones"
          sub={<><strong className="font-mono tnum" style={{ color: 'var(--ink)' }}>{total}</strong> cotizaciones · compará coberturas y precios entre aseguradoras</>}
          actions={<><Btn variant="ghost" icon="calc" onClick={() => go('cotizador')}>Estimador</Btn><Btn variant="primary" icon="plus" onClick={() => setNewOpen(true)}>Nueva cotización</Btn></>} />

        <NuevaCotizacionDrawer open={newOpen} onClose={() => setNewOpen(false)}
          onCreated={(id) => { setReload(r => r + 1); setOpenId(id); }} />
        <QuoteDetailDrawer open={Boolean(openId)} onClose={() => setOpenId(null)} quoteId={openId}
          onChanged={() => setReload(r => r + 1)} />

        <div style={{ marginBottom: 16 }}><Segmented segs={segs} value={seg} onChange={setSeg} /></div>

        <Panel pad={false} style={{ overflow: 'hidden' }}>
          <div className="rtable-wrap">
          <table className="rtable" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--hair)' }}>
                {['Cotización', 'Asegurado', 'Ramo', 'Mejor opción', 'Prima', 'Estado', 'Vigencia'].map((h, i) => (
                  <th key={h} className="eyebrow" style={{ textAlign: i === 4 ? 'right' : 'left', padding: '13px 16px' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={7} style={{ padding: 16 }}><span className="skel" style={{ display: 'block', width: '100%', height: 60, borderRadius: 8 }} /></td></tr>}
              {!loading && shown.length === 0 && (
                <tr><td colSpan={7} style={{ padding: '40px 16px', textAlign: 'center', color: 'var(--ink-3)', fontSize: 13.5 }}>Sin cotizaciones. Creá la primera.</td></tr>
              )}
              {!loading && shown.map((c, i) => (
                <tr key={c.id} onClick={() => setOpenId(c.id)} style={{ borderBottom: i === shown.length - 1 ? 'none' : '1px solid var(--hair-2)', cursor: 'pointer', transition: 'background .12s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--panel-2)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding: '13px 16px' }}><span className="font-mono" style={{ fontSize: 12.5, color: 'var(--ink-2)' }}>{c.num}</span></td>
                  <td style={{ padding: '13px 16px', fontSize: 13.5, fontWeight: 600 }}>{c.client}</td>
                  <td style={{ padding: '13px 16px' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 13, color: 'var(--ink-2)' }}>
                      <Icon name={ramoIcon[c.ramo] || 'shield'} size={15} stroke={1.9} style={{ color: 'var(--ink-3)' }} />{c.ramo}
                    </span>
                  </td>
                  <td style={{ padding: '13px 16px', fontSize: 13, color: 'var(--ink-2)' }}>
                    {c.best === '—' ? <span style={{ color: 'var(--ink-3)' }}>Sin opciones</span> : <>{c.best} <span style={{ color: 'var(--ink-3)', fontSize: 11.5 }}>· {c.options} opc.</span></>}
                  </td>
                  <td style={{ padding: '13px 16px', textAlign: 'right' }}>
                    {c.monthly > 0 ? <span className="font-mono tnum" style={{ fontSize: 13, fontWeight: 600 }}>{ars(c.monthly)}<span style={{ color: 'var(--ink-3)', fontWeight: 400 }}>/mes</span></span> : <span style={{ color: 'var(--ink-3)' }}>—</span>}
                  </td>
                  <td style={{ padding: '13px 16px' }}><Pill tone={statusTone[c.status]} dot>{c.status}</Pill></td>
                  <td style={{ padding: '13px 16px' }}>
                    {c.valid < 0 ? <span style={{ fontSize: 12, color: 'var(--red-ink)' }}>Venció hace {Math.abs(c.valid)} d</span>
                      : <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>Vence en {c.valid} d</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </Panel>
      </div>
    </div>
  );
}

Object.assign(window, { ScreenCotizaciones });
