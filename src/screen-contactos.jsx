/* ============================================================
   RUMBO — Contactos (agenda de clientes y prospectos)
   ============================================================ */
function ScreenContactos({ go }) {
  const isMobile = useIsMobile();
  const { CONTACTS, POLICIES, SINIESTROS } = window.RUMBO_DATA;
  const { ars, arsShort, daysFrom } = window.rumboFmt;
  const [seg, setSeg] = useState('todos');
  const [q, setQ] = useState('');
  const [sel, setSel] = useState(CONTACTS[0].id);

  // enrich
  const enriched = CONTACTS.map(c => {
    const pols = POLICIES.filter(p => p.contactId === c.id);
    const prima = pols.reduce((a, p) => a + p.prima * (p.freq === 'Mensual' ? 12 : p.freq === 'Trimestral' ? 4 : 1), 0);
    const claims = SINIESTROS.filter(s => pols.some(p => p.id === s.policyId)).length;
    const nextRenew = pols.length ? Math.min(...pols.map(p => daysFrom(p.renew))) : null;
    return { ...c, pols, prima, claims, nextRenew };
  });

  const segs = [
    { id: 'todos', label: 'Todos', n: enriched.length },
    { id: 'clientes', label: 'Clientes', n: enriched.filter(c => c.tags.includes('Cliente')).length },
    { id: 'prospectos', label: 'Prospectos', n: enriched.filter(c => c.tags.includes('Prospecto')).length },
    { id: 'empresas', label: 'Empresas', n: enriched.filter(c => c.kind === 'Empresa').length },
  ];

  let list = enriched;
  if (seg === 'clientes') list = list.filter(c => c.tags.includes('Cliente'));
  if (seg === 'prospectos') list = list.filter(c => c.tags.includes('Prospecto'));
  if (seg === 'empresas') list = list.filter(c => c.kind === 'Empresa');
  if (q.trim()) { const t = q.toLowerCase(); list = list.filter(c => (c.name + c.city).toLowerCase().includes(t)); }

  const current = enriched.find(c => c.id === sel) || list[0] || enriched[0];

  return (
    <div className="scroll rise" style={{ overflowY: 'auto', height: '100%', padding: isMobile ? '18px 16px 40px' : '30px 34px 60px' }}>
      <div style={{ maxWidth: 1240, margin: '0 auto' }}>
        <PageHead eyebrow="Cartera" tick={1} title="Contactos"
          sub={<><strong className="font-mono tnum" style={{ color: 'var(--ink)' }}>{enriched.filter(c=>c.tags.includes('Cliente')).length}</strong> clientes · <strong className="font-mono tnum" style={{ color: 'var(--ink)' }}>{enriched.filter(c=>c.tags.includes('Prospecto')).length}</strong> prospectos en seguimiento</>}
          actions={<><Btn variant="ghost" icon="download">Exportar</Btn><Btn variant="primary" icon="plus">Nuevo contacto</Btn></>} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
          <Segmented segs={segs} value={seg} onChange={setSeg} />
          <SearchBox q={q} setQ={setQ} placeholder="Buscar contacto…" />
        </div>

        <div className="rgrid" style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 24, alignItems: 'start' }}>
          {/* list */}
          <Panel pad={false} style={{ overflow: 'hidden' }}>
            {list.map((c, i) => {
              const active = c.id === sel;
              return (
                <div key={c.id} onClick={() => setSel(c.id)} style={{
                  display: 'flex', alignItems: 'center', gap: 13, padding: '13px 16px',
                  borderBottom: i === list.length - 1 ? 'none' : '1px solid var(--hair-2)',
                  cursor: 'pointer', background: active ? 'var(--orange-soft)' : 'transparent',
                  borderLeft: `3px solid ${active ? 'var(--orange)' : 'transparent'}`, transition: 'background .12s',
                }}
                  onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'var(--panel-2)'; }}
                  onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}>
                  <Avatar initials={c.initials} size={38} tone={c.tags.includes('Prospecto') ? 'neutral' : 'orange'} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</span>
                      {c.tags.includes('Prospecto') && <Pill tone="amber" style={{ fontSize: 9.5, padding: '1px 6px', flexShrink: 0 }}>Prospecto</Pill>}
                    </div>
                    <div style={{ fontSize: 11.5, color: 'var(--ink-3)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      <Icon name="mapPin" size={12} style={{ flexShrink: 0 }} />{c.city} · {c.kind}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div className="font-mono tnum" style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ink)', whiteSpace: 'nowrap' }}>{c.pols.length} pól.</div>
                    {c.nextRenew != null && c.nextRenew <= 30 && <Pill tone={urgencyTone(c.nextRenew)} style={{ fontSize: 9.5, marginTop: 4, whiteSpace: 'nowrap' }}>Vence {c.nextRenew}d</Pill>}
                  </div>
                </div>
              );
            })}
            {list.length === 0 && <div style={{ padding: 50, textAlign: 'center', color: 'var(--ink-3)', fontSize: 14 }}>Sin contactos.</div>}
          </Panel>

          {/* detail card */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24, position: 'sticky', top: 0 }}>
            <Panel>
              <div style={{ display: 'flex', alignItems: 'center', gap: 13, marginBottom: 16 }}>
                <Avatar initials={current.initials} size={50} tone={current.tags.includes('Prospecto') ? 'neutral' : 'orange'} />
                <div style={{ flex: 1 }}>
                  <h2 className="font-display" style={{ fontSize: 21, letterSpacing: '-0.02em', lineHeight: 1.1 }}>{current.name}</h2>
                  <div style={{ fontSize: 12.5, color: 'var(--ink-3)', marginTop: 3 }}>{current.kind} · cliente desde {current.since}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                <Btn size="sm" variant="primary" icon="whatsapp" style={{ flex: 1 }}>WhatsApp</Btn>
                <Btn size="sm" variant="soft" icon="phone" style={{ flex: 1 }}>Llamar</Btn>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: 'var(--hair-2)', border: '1px solid var(--hair)', borderRadius: 10, overflow: 'hidden' }}>
                <MiniStat label="Prima anual" value={arsShort(current.prima)} />
                <MiniStat label="Pólizas" value={current.pols.length} />
                <MiniStat label="Siniestros" value={current.claims} tone={current.claims ? 'var(--amber-ink)' : undefined} />
                <MiniStat label="Teléfono" value={current.phone} small />
              </div>
            </Panel>

            <Panel>
              <SectionHead label="Pólizas del contacto" action={<Btn size="sm" variant="bare" iconRight="arrowRight" onClick={() => go('polizas')}>Cartera</Btn>} />
              {current.pols.length === 0 ? (
                <div style={{ padding: '6px 0', fontSize: 13, color: 'var(--ink-3)' }}>Sin pólizas. Oportunidad de primera venta.</div>
              ) : current.pols.map((p, i) => (
                <div key={p.id} onClick={() => go('detail', { id: p.id })} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 0', borderBottom: i === current.pols.length - 1 ? 'none' : '1px solid var(--hair-2)', cursor: 'pointer' }}
                  onMouseEnter={e => e.currentTarget.style.opacity = 0.7} onMouseLeave={e => e.currentTarget.style.opacity = 1}>
                  <RamoGlyph ramo={p.ramo} size={32} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{p.ramo} · {p.insurer}</div>
                    <div className="font-mono" style={{ fontSize: 11, color: 'var(--ink-3)' }}>{p.num}</div>
                  </div>
                  <Pill tone={urgencyTone(daysFrom(p.renew))} style={{ fontSize: 10 }}>{daysFrom(p.renew) <= 30 ? `${daysFrom(p.renew)}d` : 'Vigente'}</Pill>
                </div>
              ))}
            </Panel>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { ScreenContactos });
