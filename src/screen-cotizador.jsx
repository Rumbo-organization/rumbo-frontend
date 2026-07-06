/* ============================================================
   RUMBO — Cotizador (comparador de aseguradoras)
   Flagship: 1 Datos → 2 Comparar → 3 Emitir
   ============================================================ */
function ScreenCotizador({ go, onEmit }) {
  const isMobile = useIsMobile();
  const { CONTACTS, INSURERS } = window.RUMBO_DATA;
  const { ars, arsShort } = window.rumboFmt;
  const [step, setStep] = useState(1);
  const [ramo, setRamo] = useState('Automotor');
  const [f, setF] = useState({ cliente: '', marca: '', anio: '2022', uso: 'Particular', cp: '5000', suma: '18000000' });
  const [picked, setPicked] = useState(null);
  const set = (k, v) => setF(s => ({ ...s, [k]: v }));

  // deterministic quote generation
  const baseByRamo = { Automotor: 165000, Hogar: 52000, Comercio: 320000, Vida: 38000, ART: 740000, Integral: 280000 };
  const insurerFactor = { 'San Cristóbal': 0.94, 'Federación Patronal': 1.0, 'Sancor Seguros': 1.08, 'La Segunda': 0.97, 'Mercantil Andina': 1.12, 'Rivadavia': 0.9 };
  const coverPerks = {
    'San Cristóbal': ['Todo riesgo c/ franquicia', 'Auxilio 24h', 'Auto sustituto 15 días'],
    'Federación Patronal': ['Todo riesgo', 'Auxilio 24h', 'Granizo incluido', 'Cobertura nacional'],
    'Sancor Seguros': ['Todo riesgo premium', 'Auto sustituto 30 días', 'Cristales sin límite'],
    'La Segunda': ['Todo riesgo c/ franquicia', 'Auxilio 24h', 'App de gestión'],
    'Mercantil Andina': ['Todo riesgo', 'Granizo incluido', 'Conductor adicional'],
    'Rivadavia': ['Terceros completo +', 'Auxilio 24h', 'Económico'],
  };

  const base = baseByRamo[ramo] || 150000;
  const ageF = 1 + (2026 - parseInt(f.anio || '2022')) * 0.015;
  const useF = f.uso === 'Comercial' ? 1.18 : 1;
  const quotes = INSURERS.map((ins, i) => {
    const monthly = Math.round((base * (insurerFactor[ins] || 1) * ageF * useF) / 100) * 100;
    return {
      insurer: ins, monthly, annual: monthly * 12,
      perks: coverPerks[ins] || ['Cobertura estándar'],
      rating: (4.1 + ((i * 7) % 9) / 10).toFixed(1),
      recommended: false,
    };
  }).sort((a, b) => a.monthly - b.monthly);
  if (quotes.length) { quotes[0].best = true; quotes[1] && (quotes[1].recommended = true); }

  const Stepper = () => {
    const steps = [{ n: 1, l: 'Datos del riesgo' }, { n: 2, l: 'Comparar' }, { n: 3, l: 'Emitir' }];
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: isMobile ? 18 : 26 }}>
        {steps.map((s, i) => (
          <React.Fragment key={s.n}>
            <button onClick={() => s.n < step && setStep(s.n)} style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 6 : 10, cursor: s.n < step ? 'pointer' : 'default' }}>
              <span style={{
                width: isMobile ? 26 : 30, height: isMobile ? 26 : 30, borderRadius: 99, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-mono)',
                background: step > s.n ? 'var(--emerald)' : step === s.n ? 'var(--orange)' : 'var(--panel-2)',
                color: step >= s.n ? '#fff' : 'var(--ink-3)', border: step >= s.n ? 'none' : '1px solid var(--hair)', transition: 'all .2s',
              }}>{step > s.n ? <Icon name="check" size={14} stroke={3} /> : s.n}</span>
              {(!isMobile || step === s.n) && <span style={{ fontSize: isMobile ? 12 : 13.5, fontWeight: 600, color: step >= s.n ? 'var(--ink)' : 'var(--ink-3)', whiteSpace: 'nowrap' }}>{s.l}</span>}
            </button>
            {i < steps.length - 1 && <div style={{ flex: 1, height: 2, margin: isMobile ? '0 8px' : '0 16px', background: step > s.n ? 'var(--emerald)' : 'var(--hair)', borderRadius: 2, transition: 'background .2s' }} />}
          </React.Fragment>
        ))}
      </div>
    );
  };

  return (
    <div className="scroll rise" style={{ overflowY: 'auto', height: '100%', padding: isMobile ? '18px 16px 40px' : '30px 34px 60px' }}>
      <div style={{ maxWidth: 1080, margin: '0 auto' }}>
        <PageHead eyebrow="Herramientas" tick={2} title="Cotizador"
          sub="Compará primas de todas tus aseguradoras y emití la mejor opción sin salir de Rumbo." />

        <Panel style={{ marginBottom: 24, padding: isMobile ? '14px 16px' : '22px 26px' }}><Stepper /></Panel>

        {/* STEP 1 — datos */}
        {step === 1 && (
          <div className="rgrid" style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24, alignItems: 'start' }}>
            <Panel>
              <div style={{ marginBottom: 22 }}>
                <div className="eyebrow" style={{ marginBottom: 10 }}>¿Qué querés asegurar?</div>
                <RamoPicker value={ramo} onChange={setRamo} />
              </div>
              <div className="rgrid" style={FORM_GRID}>
                <Field label="Cliente / prospecto" required span={2}>
                  <SelectInput value={f.cliente} onChange={v => set('cliente', v)} options={CONTACTS.map(c => c.name)} placeholder="Seleccionar…" />
                </Field>
                {ramo === 'Automotor' ? (
                  <>
                    <Field label="Marca y modelo" required span={2}>
                      <TextInput value={f.marca} onChange={v => set('marca', v)} placeholder="Ej: Toyota Corolla XEI" />
                    </Field>
                    <Field label="Año">
                      <SelectInput value={f.anio} onChange={v => set('anio', v)} options={['2026', '2025', '2024', '2023', '2022', '2021', '2020', '2019', '2018']} />
                    </Field>
                    <Field label="Uso">
                      <SelectInput value={f.uso} onChange={v => set('uso', v)} options={['Particular', 'Comercial']} />
                    </Field>
                    <Field label="Código postal">
                      <TextInput value={f.cp} onChange={v => set('cp', v.replace(/[^0-9]/g, ''))} mono placeholder="5000" />
                    </Field>
                    <Field label="Suma asegurada">
                      <TextInput value={f.suma} onChange={v => set('suma', v.replace(/[^0-9]/g, ''))} mono prefix="$" placeholder="0" />
                    </Field>
                  </>
                ) : (
                  <>
                    <Field label="Detalle del riesgo" span={2}>
                      <TextInput value={f.marca} onChange={v => set('marca', v)} placeholder="Domicilio, rubro o datos del riesgo" />
                    </Field>
                    <Field label="Código postal">
                      <TextInput value={f.cp} onChange={v => set('cp', v.replace(/[^0-9]/g, ''))} mono placeholder="5000" />
                    </Field>
                    <Field label="Suma asegurada">
                      <TextInput value={f.suma} onChange={v => set('suma', v.replace(/[^0-9]/g, ''))} mono prefix="$" placeholder="0" />
                    </Field>
                  </>
                )}
              </div>
            </Panel>

            <Panel style={{ position: 'sticky', top: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <span style={{ width: 38, height: 38, borderRadius: 10, background: 'var(--orange-soft)', color: 'var(--orange-ink)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><RamoGlyph ramo={ramo} size={38} /></span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>{ramo}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>{INSURERS.length} aseguradoras conectadas</div>
                </div>
              </div>
              <p style={{ fontSize: 12.5, color: 'var(--ink-2)', lineHeight: 1.5, marginBottom: 18 }}>
                Rumbo consulta tus aseguradoras en paralelo y te ordena las primas de menor a mayor. Vos elegís el rumbo.
              </p>
              <Btn variant="primary" icon="compass" onClick={() => setStep(2)} style={{ width: '100%' }}>Cotizar en {INSURERS.length} aseguradoras</Btn>
            </Panel>
          </div>
        )}

        {/* STEP 2 — comparar */}
        {step === 2 && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <SectionHead label={`${quotes.length} cotizaciones · ${ramo}`} sub={f.marca || f.cliente || 'Riesgo a cotizar'} />
              <Btn size="sm" variant="ghost" icon="chevronRight" onClick={() => setStep(1)} style={{ flexDirection: 'row-reverse' }}>Editar datos</Btn>
            </div>
            <div className="rgrid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
              {quotes.map((qt) => (
                <div key={qt.insurer} style={{
                  position: 'relative', padding: 20, borderRadius: 'var(--radius-lg)',
                  background: 'var(--panel)', border: `1.5px solid ${qt.best ? 'var(--emerald)' : 'var(--hair)'}`,
                  boxShadow: qt.best ? '0 8px 28px -10px var(--emerald)' : 'var(--shadow-sm)',
                }}>
                  {qt.best && <div style={{ position: 'absolute', top: -11, left: 20 }}><Pill tone="emerald" dot>Mejor prima</Pill></div>}
                  {qt.recommended && <div style={{ position: 'absolute', top: -11, left: 20 }}><Pill tone="orange" dot>Recomendada</Pill></div>}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16, marginTop: 4 }}>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)' }}>{qt.insurer}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 4, fontSize: 11.5, color: 'var(--ink-3)' }}>
                        <Icon name="compass" size={13} style={{ color: 'var(--amber)' }} /> {qt.rating} · valoración PAS
                      </div>
                    </div>
                  </div>
                  <div style={{ marginBottom: 16 }}>
                    <div className="font-display tnum" style={{ fontSize: 30, lineHeight: 1, color: 'var(--ink)' }}>{ars(qt.monthly)}<span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-3)', fontFamily: 'var(--font-sans)' }}> /mes</span></div>
                    <div className="font-mono tnum" style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 4 }}>{ars(qt.annual)} anual</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginBottom: 18 }}>
                    {qt.perks.map(p => (
                      <div key={p} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: 'var(--ink-2)' }}>
                        <Icon name="check" size={14} stroke={2.4} style={{ color: 'var(--emerald)', flexShrink: 0 }} />{p}
                      </div>
                    ))}
                  </div>
                  <Btn variant={qt.best ? 'primary' : 'soft'} icon="arrowRight" onClick={() => { setPicked(qt); setStep(3); }} style={{ width: '100%', flexDirection: 'row-reverse' }}>Seleccionar</Btn>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 3 — emitir */}
        {step === 3 && picked && (
          <div style={{ maxWidth: 620, margin: '0 auto' }}>
            <Panel style={{ padding: 28, textAlign: 'center' }}>
              <div style={{ width: 60, height: 60, borderRadius: 16, margin: '0 auto 18px', background: 'var(--emerald-soft)', color: 'var(--emerald-ink)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="compass" size={30} />
              </div>
              <h2 className="font-display" style={{ fontSize: 24, letterSpacing: '-0.02em', marginBottom: 6 }}>Confirmar emisión</h2>
              <p style={{ fontSize: 13.5, color: 'var(--ink-2)', marginBottom: 22 }}>Revisá los datos y emití la póliza en {picked.insurer}.</p>

              <div style={{ textAlign: 'left', border: '1px solid var(--hair)', borderRadius: 'var(--radius)', overflow: 'hidden', marginBottom: 22 }}>
                <SummaryRow label="Cliente" value={f.cliente || '—'} />
                <SummaryRow label="Ramo" value={ramo} />
                <SummaryRow label="Riesgo" value={f.marca || '—'} />
                <SummaryRow label="Aseguradora" value={picked.insurer} />
                <SummaryRow label="Prima mensual" value={ars(picked.monthly)} strong />
                <SummaryRow label="Prima anual" value={ars(picked.annual)} last />
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                <Btn variant="ghost" icon="chevronRight" onClick={() => setStep(2)} style={{ flexDirection: 'row-reverse' }}>Volver a comparar</Btn>
                <Btn variant="primary" icon="check" onClick={() => { onEmit && onEmit({ ...f, ramo, ...picked }); go('polizas'); }}>Emitir póliza</Btn>
              </div>
            </Panel>
          </div>
        )}
      </div>
    </div>
  );
}

function SummaryRow({ label, value, strong, last }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 16px', borderBottom: last ? 'none' : '1px solid var(--hair-2)', background: strong ? 'var(--panel-2)' : 'transparent' }}>
      <span style={{ fontSize: 12.5, color: 'var(--ink-3)', fontWeight: 600 }}>{label}</span>
      <span className={typeof value === 'string' && value.startsWith('$') ? 'font-mono tnum' : ''} style={{ fontSize: strong ? 15 : 13.5, fontWeight: strong ? 700 : 500, color: strong ? 'var(--orange-ink)' : 'var(--ink)' }}>{value}</span>
    </div>
  );
}

Object.assign(window, { ScreenCotizador });
