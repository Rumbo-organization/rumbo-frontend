/* ============================================================
   RUMBO — Cotizaciones (lista de cotizaciones guardadas)
   ============================================================ */
function ScreenCotizaciones({ go }) {
  const isMobile = useIsMobile();
  const { COTIZACIONES } = window.RUMBO_DATA;
  const { ars, daysFrom } = window.rumboFmt;
  const [seg, setSeg] = useState('todas');

  const statusTone = { Borrador: 'neutral', Enviada: 'amber', Aceptada: 'emerald', Vencida: 'red' };
  const segs = [
    { id: 'todas', label: 'Todas', n: COTIZACIONES.length },
    { id: 'Enviada', label: 'Enviadas', n: COTIZACIONES.filter(c => c.status === 'Enviada').length },
    { id: 'Aceptada', label: 'Aceptadas', n: COTIZACIONES.filter(c => c.status === 'Aceptada').length },
    { id: 'Borrador', label: 'Borradores', n: COTIZACIONES.filter(c => c.status === 'Borrador').length },
  ];
  let rows = COTIZACIONES;
  if (seg !== 'todas') rows = rows.filter(c => c.status === seg);

  return (
    <div className="scroll rise" style={{ overflowY: 'auto', height: '100%', padding: isMobile ? '18px 16px 40px' : '30px 34px 60px' }}>
      <div style={{ maxWidth: 1180, margin: '0 auto' }}>
        <PageHead eyebrow="Cartera" tick={2} title="Cotizaciones"
          sub="Armá una cotización para comparar coberturas y precios entre aseguradoras."
          actions={<Btn variant="primary" icon="calc" onClick={() => go('cotizador')}>Nueva cotización</Btn>} />

        <div style={{ marginBottom: 16 }}><Segmented segs={segs} value={seg} onChange={setSeg} /></div>

        <Panel pad={false} style={{ overflow: 'hidden' }}>
          <div className="rtable-wrap">
          <table className="rtable" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--hair)' }}>
                {['Cotización', 'Cliente', 'Ramo', 'Mejor opción', 'Prima', 'Estado', 'Vigencia'].map((h, i) => (
                  <th key={h} className="eyebrow" style={{ textAlign: i >= 4 && i <= 4 ? 'right' : 'left', padding: '13px 16px' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((c, i) => (
                <tr key={c.id} onClick={() => go('cotizador')} style={{ borderBottom: i === rows.length - 1 ? 'none' : '1px solid var(--hair-2)', cursor: 'pointer', transition: 'background .12s' }}
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
                    {c.status === 'Aceptada' ? <span style={{ fontSize: 12, color: 'var(--emerald-ink)', fontWeight: 600 }}>Convertida</span>
                      : c.valid < 0 ? <span style={{ fontSize: 12, color: 'var(--red-ink)' }}>Venció hace {Math.abs(c.valid)} d</span>
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
