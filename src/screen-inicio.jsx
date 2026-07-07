/* ============================================================
   RUMBO — Inicio (the daily cockpit)
   ============================================================ */

/* fecha de hoy legible (es-AR) desde RUMBO_DATA.TODAY (real del BFF) o ahora. */
function todayLabel() {
  const raw = window.RUMBO_DATA?.TODAY;
  const d = raw ? new Date(raw) : new Date();
  return d.toLocaleDateString('es-AR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  }).replace(/^\w/, (c) => c.toUpperCase());
}

/* --- radial book-health gauge --- */
function HealthGauge({ value = 82, size = 64 }) {
  const r = size / 2 - 6;
  const c = size / 2;
  const start = 135, sweep = 270;
  const polar = (deg) => {
    const a = (deg - 90) * Math.PI / 180;
    return [c + r * Math.cos(a), c + r * Math.sin(a)];
  };
  const arcPath = (from, to) => {
    const [x1, y1] = polar(from), [x2, y2] = polar(to);
    const large = (to - from) > 180 ? 1 : 0;
    return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`;
  };
  const valDeg = start + (value / 100) * sweep;
  const tone = value >= 75 ? 'var(--emerald)' : value >= 50 ? 'var(--amber)' : 'var(--red)';
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: 'block' }}>
      <path d={arcPath(start, start + sweep)} fill="none" stroke="var(--hair)" strokeWidth="5" strokeLinecap="round" />
      <path d={arcPath(start, valDeg)} fill="none" stroke={tone} strokeWidth="5" strokeLinecap="round" />
      <text x={c} y={c + 2} textAnchor="middle" dominantBaseline="middle"
        style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: size * 0.34, fill: 'var(--ink)' }}>{value}</text>
      <text x={c} y={c + size * 0.27} textAnchor="middle"
        style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 8.5, fill: 'var(--ink-3)', letterSpacing: '0.08em' }}>SALUD</text>
    </svg>
  );
}

function InstrumentCell({ label, value, sub, tone, accent, first }) {
  return (
    <div style={{
      flex: 1, padding: '4px 22px', borderLeft: first ? 'none' : '1px solid var(--hair)', minWidth: 0,
    }}>
      <div className="eyebrow" style={{ marginBottom: 9 }}>{label}</div>
      <div className="font-display tnum" style={{ fontSize: 30, lineHeight: 1, color: tone || 'var(--ink)', display: 'flex', alignItems: 'baseline', gap: 4 }}>
        {value}
        {accent && <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-3)', fontFamily: 'var(--font-sans)' }}>{accent}</span>}
      </div>
      {sub && <div style={{ marginTop: 8, fontSize: 11.5, color: 'var(--ink-3)', display: 'flex', alignItems: 'center', gap: 5 }}>{sub}</div>}
    </div>
  );
}

/* --- the vencimientos "course": waypoints along a route --- */
function CourseRow({ v, go, idx, isNext, isMobile }) {
  const tone = urgencyTone(v.days);
  const dotColor = { red: 'var(--red)', orange: 'var(--orange)', amber: 'var(--amber)', emerald: 'var(--emerald)' }[tone];
  if (isMobile) {
    return (
      <div style={{ display: 'flex', gap: 12, position: 'relative' }}>
        <div style={{ width: 14, flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <span style={{ width: isNext ? 12 : 10, height: isNext ? 12 : 10, borderRadius: 99, background: dotColor, marginTop: 14, zIndex: 2, boxShadow: isNext ? '0 0 0 4px var(--orange-soft)' : 'none', flexShrink: 0 }} />
        </div>
        <div onClick={() => go('detail', { id: v.policyId })} style={{ flex: 1, padding: '12px 0', borderBottom: '1px solid var(--hair-2)', cursor: 'pointer' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <RamoGlyph ramo={v.ramo} size={32} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ink)' }}>{v.client}</div>
              <div className="font-mono" style={{ fontSize: 11, color: 'var(--ink-3)' }}>{v.insurer} · vence {v.date}</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <Pill tone={tone} dot>Vence en {v.days} d</Pill>
            <span className="font-mono tnum" style={{ fontSize: 12, color: 'var(--ink-2)' }}>{rumboFmt.ars(v.prima)}</span>
          </div>
          {isNext && <Pill tone="orange" style={{ fontSize: 9.5, padding: '2px 7px', marginTop: 8 }}>PRÓXIMA RENOVACIÓN</Pill>}
        </div>
      </div>
    );
  }
  return (
    <div style={{ display: 'flex', gap: 16, position: 'relative' }}>
      {/* route spine */}
      <div style={{ width: 18, flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
        <span style={{
          width: isNext ? 14 : 11, height: isNext ? 14 : 11, borderRadius: 99, background: dotColor,
          marginTop: 16, zIndex: 2, boxShadow: isNext ? `0 0 0 4px var(--orange-soft)` : 'none', flexShrink: 0,
        }} />
      </div>
      <div onClick={() => go('detail', { id: v.policyId })} style={{
        flex: 1, display: 'flex', alignItems: 'center', gap: 13, padding: '13px 0',
        borderBottom: '1px solid var(--hair-2)', cursor: 'pointer',
      }}
        onMouseEnter={e => e.currentTarget.style.opacity = 0.72}
        onMouseLeave={e => e.currentTarget.style.opacity = 1}>
        <RamoGlyph ramo={v.ramo} size={36} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>{v.client}</span>
            {isNext && <Pill tone="orange" style={{ fontSize: 9.5, padding: '2px 7px' }}>PRÓXIMA RENOVACIÓN</Pill>}
          </div>
          <div className="font-mono" style={{ fontSize: 11.5, color: 'var(--ink-3)', marginTop: 2 }}>{v.insurer} · {v.ramo} · vence {v.date}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <Pill tone={tone} dot>Vence en {v.days} d</Pill>
          <div className="font-mono tnum" style={{ fontSize: 12, color: 'var(--ink-2)', marginTop: 6 }}>{rumboFmt.ars(v.prima)}</div>
        </div>
        <Btn size="sm" variant="ghost" iconRight="refresh" onClick={(e) => { e.stopPropagation(); go('detail', { id: v.policyId }); }}>Renovar</Btn>
      </div>
    </div>
  );
}

function MiniRow({ children, onClick, last }) {
  return (
    <div onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0',
      borderBottom: last ? 'none' : '1px solid var(--hair-2)', cursor: onClick ? 'pointer' : 'default',
    }}
      onMouseEnter={e => { if (onClick) e.currentTarget.style.opacity = 0.72; }}
      onMouseLeave={e => { if (onClick) e.currentTarget.style.opacity = 1; }}>
      {children}
    </div>
  );
}

function ScreenInicio({ go }) {
  const { VENCIMIENTOS, SINIESTROS, CUOTAS, CROSSSELL, BOOK } = window.RUMBO_DATA;
  const { ars, arsShort } = window.rumboFmt;
  const isMobile = useIsMobile();
  // Prima anual y conteo desde agregados server-side (BOOK), no de la array capada.
  const annual = BOOK.primaAnual ?? 0;
  const nextV = VENCIMIENTOS.length ? VENCIMIENTOS.reduce((m, v) => (v.days < m.days ? v : m), VENCIMIENTOS[0]) : null;
  const cuotasTotal = CUOTAS.reduce((a, c) => a + c.amount, 0);
  // KPIs reales derivados de los datos del BFF (antes literales del mock).
  const vence30 = BOOK.vence30 ?? VENCIMIENTOS.filter(v => v.days <= 30).length;
  const openClaims = SINIESTROS.filter(s => s.status !== 'Cerrado');
  const staleClaims = openClaims.filter(s => s.stale >= 10).length;

  return (
    <div className="scroll rise" style={{ overflowY: 'auto', height: '100%', padding: isMobile ? '18px 16px 40px' : '30px 34px 60px' }}>
      <div style={{ maxWidth: 1240, margin: '0 auto' }}>

        {/* hero */}
        <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'stretch' : 'flex-start', justifyContent: 'space-between', gap: isMobile ? 16 : 24, marginBottom: isMobile ? 18 : 24 }}>
          <div>
            <div className="tick-row" style={{ marginBottom: 12 }}>
              <Ticks n={7} active={3} />
              <span className="eyebrow">{todayLabel()}</span>
            </div>
            <h1 className="font-display" style={{ fontSize: isMobile ? 28 : 40, lineHeight: 1.02, letterSpacing: '-0.03em', color: 'var(--ink)' }}>
              Hola, {rumboIdentity().name.split(/\s+/)[0]}.
            </h1>
            <p style={{ fontSize: isMobile ? 13.5 : 15, color: 'var(--ink-2)', marginTop: 8, maxWidth: 560 }}>
              Tu cartera está <strong style={{ color: 'var(--emerald-ink)' }}>en buen rumbo</strong>. Hay <strong style={{ color: 'var(--ink)' }}>{vence30} {vence30 === 1 ? 'renovación' : 'renovaciones'}</strong> en los próximos 30 días y <strong style={{ color: 'var(--red-ink)' }}>{ars(cuotasTotal)}</strong> en cuotas vencidas por recuperar.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10, flexShrink: 0, flexWrap: 'wrap' }}>
            {!isMobile && <Btn variant="ghost" icon="download">Exportar</Btn>}
            <Btn variant="primary" icon="calc" onClick={() => go('cotizador')} style={isMobile ? { flex: 1 } : {}}>Cotizar</Btn>
          </div>
        </div>

        {/* instrument cluster */}
        <Panel pad={false} style={{ marginBottom: isMobile ? 20 : 26 }}>
          {isMobile ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: 'var(--hair-2)' }}>
              <div style={{ gridColumn: 'span 2', background: 'var(--panel)', padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
                <HealthGauge value={BOOK.health} size={54} />
                <div>
                  <div className="eyebrow" style={{ marginBottom: 5, whiteSpace: 'nowrap' }}>Salud de cartera</div>
                  <Pill tone="emerald" dot>Buen rumbo</Pill>
                </div>
              </div>
              <MobileStat label="Prima anual" value={arsShort(annual)} />
              <MobileStat label="Vencen 30d" value={String(vence30)} tone="var(--orange-ink)" />
              <MobileStat label="Siniestros" value={String(openClaims.length)} />
              <MobileStat label="Cuotas vencidas" value={arsShort(cuotasTotal)} tone="var(--red-ink)" />
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'stretch', padding: '20px 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '0 24px', borderRight: '1px solid var(--hair)' }}>
                <HealthGauge value={BOOK.health} />
                <div>
                  <div className="eyebrow" style={{ marginBottom: 6 }}>Salud de cartera</div>
                  <Pill tone="emerald" dot>Buen rumbo</Pill>
                  <div style={{ fontSize: 11.5, color: 'var(--ink-3)', marginTop: 7, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Icon name="trending" size={13} style={{ color: 'var(--emerald)' }} /> +3 vs. mes anterior
                  </div>
                </div>
              </div>
              <InstrumentCell label="Prima anual gestionada" value={arsShort(annual)} sub={<><Icon name="trending" size={13} style={{ color: 'var(--emerald)' }} /> {(BOOK.polizas ?? 0).toLocaleString('es-AR')} pólizas activas</>} />
              <InstrumentCell label="Vencen en 30 días" value={String(vence30)} tone="var(--orange-ink)" sub={nextV ? <>Próximo en {nextV.days} días</> : 'Sin vencimientos'} />
              <InstrumentCell label="Siniestros abiertos" value={String(openClaims.length)} sub={staleClaims > 0 ? <><span style={{ color: 'var(--red-ink)', fontWeight: 600 }}>{staleClaims}</span> sin movimiento</> : 'Todos al día'} />
              <InstrumentCell label="Cuotas vencidas" value={arsShort(cuotasTotal)} tone="var(--red-ink)" sub={<>{CUOTAS.length} cuotas por cobrar</>} />
            </div>
          )}
        </Panel>

        {/* main grid */}
        <div className="rgrid" style={{ display: 'grid', gridTemplateColumns: '1.45fr 1fr', gap: isMobile ? 20 : 24, alignItems: 'start' }}>

          {/* LEFT — the course */}
          <Panel style={isMobile ? { padding: 16 } : {}}>
            <SectionHead
              label="El rumbo · próximos vencimientos"
              sub="Tus próximas renovaciones, ordenadas por urgencia. No pierdas ninguna de vista."
              action={!isMobile && <Btn size="sm" variant="bare" iconRight="arrowRight" onClick={() => go('vencimientos')}>Ver todos</Btn>}
            />
            {/* course header tick */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 1, marginBottom: 2, color: 'var(--ink-3)' }}>
              <span style={{ width: 17, display: 'flex', justifyContent: 'center' }}><Icon name="flag" size={13} /></span>
              <span style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Tu posición · hoy</span>
            </div>
            <div style={{ position: 'relative' }}>
              {/* continuous spine */}
              <div style={{ position: 'absolute', left: isMobile ? 6 : 8, top: 6, bottom: 24, width: 2, background: 'linear-gradient(var(--hair), var(--hair-2))' }} />
              {[...VENCIMIENTOS].sort((a, b) => a.days - b.days).map((v, i) => (
                <CourseRow key={v.id} v={v} go={go} idx={i} isNext={v.id === nextV.id} isMobile={isMobile} />
              ))}
            </div>
            {isMobile && <Btn size="sm" variant="soft" iconRight="arrowRight" onClick={() => go('vencimientos')} style={{ width: '100%', marginTop: 14 }}>Ver todos los vencimientos</Btn>}
          </Panel>

          {/* RIGHT — stacked */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 20 : 24 }}>

            {/* stale claims */}
            <Panel style={isMobile ? { padding: 16 } : {}}>
              <SectionHead label="Siniestros que pierden rumbo" action={!isMobile && <Btn size="sm" variant="bare" iconRight="arrowRight" onClick={() => go('siniestros')}>Ver</Btn>} />
              {SINIESTROS.map((s, i) => {
                const stale = s.stale >= 10;
                return (
                  <MiniRow key={s.id} last={i === SINIESTROS.length - 1} onClick={() => go('detail', { id: s.policyId })}>
                    <span style={{ width: 34, height: 34, borderRadius: 9, flexShrink: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: stale ? 'var(--red-soft)' : 'var(--panel-2)', color: stale ? 'var(--red-ink)' : 'var(--ink-2)', border: '1px solid var(--hair)' }}>
                      <Icon name={stale ? 'alert' : 'clock'} size={16} stroke={2} />
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ink)' }}>{s.tipo} — {s.client}</div>
                      <div className="font-mono" style={{ fontSize: 11, color: stale ? 'var(--red-ink)' : 'var(--ink-3)', marginTop: 2 }}>
                        {stale ? `Sin movimiento hace ${s.stale} días` : `${s.num} · activo`}
                      </div>
                    </div>
                    {!isMobile && <Pill tone={s.status === 'Abierto' ? 'amber' : 'neutral'}>{s.status}</Pill>}
                  </MiniRow>
                );
              })}
            </Panel>

            {/* overdue money */}
            <Panel style={isMobile ? { padding: 16 } : {}}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14, gap: 10 }}>
                <div>
                  <div className="eyebrow" style={{ marginBottom: 6 }}>Cuotas vencidas</div>
                  <div className="font-display tnum" style={{ fontSize: isMobile ? 22 : 26, color: 'var(--red-ink)' }}>{ars(cuotasTotal)}</div>
                </div>
                <Btn size="sm" variant="primary" icon="whatsapp">Reclamar</Btn>
              </div>
              {CUOTAS.map((c, i) => (
                <MiniRow key={c.id} last={i === CUOTAS.length - 1} onClick={() => go('detail', { id: c.policyId })}>
                  <Avatar initials={c.client.split(',')[0].slice(0, 2).toUpperCase()} size={32} tone="neutral" />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ink)' }}>{c.client}</div>
                    <div className="font-mono" style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>Cuota {c.cuota} · venció {c.due} · {Math.abs(c.days)} d</div>
                  </div>
                  <div className="font-mono tnum" style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--red-ink)' }}>{ars(c.amount)}</div>
                </MiniRow>
              ))}
            </Panel>

            {/* cross-sell */}
            <Panel style={isMobile ? { padding: 16 } : {}}>
              <SectionHead label="Oportunidades de cross-selling" action={<Icon name="sparkles" size={16} style={{ color: 'var(--orange)' }} />} />
              {CROSSSELL.map((x, i) => (
                <MiniRow key={x.id} last={i === CROSSSELL.length - 1} onClick={() => go('polizas')}>
                  <RamoGlyph ramo={x.suggest} size={32} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ink)' }}>{x.client}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--ink-3)', marginTop: 2 }}>{x.reason}</div>
                  </div>
                  <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5 }}>
                    <Pill tone="neutral" style={{ fontSize: 10.5 }}>+ {x.suggest}</Pill>
                    {!isMobile && <span style={{ fontSize: 10.5, fontWeight: 600, color: x.score === 'Alta' ? 'var(--emerald-ink)' : 'var(--ink-3)' }}>{x.score} prob.</span>}
                  </div>
                </MiniRow>
              ))}
            </Panel>
          </div>
        </div>
      </div>
    </div>
  );
}

function MobileStat({ label, value, tone }) {
  return (
    <div style={{ background: 'var(--panel)', padding: '12px 16px' }}>
      <div className="eyebrow" style={{ marginBottom: 5, fontSize: 9.5 }}>{label}</div>
      <div className="font-display tnum" style={{ fontSize: 19, color: tone || 'var(--ink)' }}>{value}</div>
    </div>
  );
}

Object.assign(window, { ScreenInicio });
