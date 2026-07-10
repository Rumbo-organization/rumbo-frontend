/* ============================================================
   RUMBO — Calendario (la vista temporal única de la operación)
   Portado de app/src/app/(app)/calendario/* (Next+tRPC) a la SPA plana.
   Vencimientos, cuotas y siniestros son DERIVADOS (solo lectura); la agenda
   propia (eventos) es lo único que se crea/edita/borra desde acá. Datos en
   vivo por mes vía window.rumboApi.calendarMonth (RLS por org/cartera).
   ============================================================ */

/* ---------- Meta por tipo (color + label; fuente única) ---------- */
const CAL_META = {
  vencimiento: { plural: 'Vencimientos', pill: 'amber', dot: 'var(--amber)' },
  cuota: { plural: 'Cuotas', pill: 'red', dot: 'var(--red)' },
  siniestro: { plural: 'Siniestros', pill: 'neutral', dot: 'var(--ink-3)' },
  evento: { plural: 'Agenda', pill: 'orange', dot: 'var(--orange)' },
};
const CAL_TYPES = ['vencimiento', 'cuota', 'siniestro', 'evento'];
const EVENT_KIND_LABELS = { llamada: 'Llamada', reunion: 'Reunión', tramite: 'Trámite', otro: 'Otro' };
const EVENT_KINDS = ['llamada', 'reunion', 'tramite', 'otro'];

/* ---------- Helpers de fecha (aritmética UTC sobre strings) ---------- */
const pad2 = n => String(n).padStart(2, '0');
function todayAr() {
  // 'YYYY-MM-DD' en huso AR (en-CA da ese formato).
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Cordoba' });
}
function monthRange(year, month) {
  const last = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return { from: `${year}-${pad2(month)}-01`, to: `${year}-${pad2(month)}-${pad2(last)}` };
}
function monthGridDays(year, month) {
  const first = new Date(Date.UTC(year, month - 1, 1));
  const lead = (first.getUTCDay() + 6) % 7; // lunes = 0
  const start = new Date(first);
  start.setUTCDate(start.getUTCDate() - lead);
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const cells = Math.ceil((lead + daysInMonth) / 7) * 7;
  const out = [];
  const cursor = new Date(start);
  for (let i = 0; i < cells; i++) {
    out.push({
      date: cursor.toISOString().slice(0, 10),
      day: cursor.getUTCDate(),
      inMonth: cursor.getUTCMonth() === month - 1,
    });
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return out;
}
function shiftMonth(year, month, delta) {
  const m = month + delta;
  if (m < 1) return { year: year - 1, month: 12 };
  if (m > 12) return { year: year + 1, month: 1 };
  return { year, month: m };
}
function monthTitle(year, month) {
  const raw = new Intl.DateTimeFormat('es-AR', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(
    new Date(Date.UTC(year, month - 1, 1)),
  );
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}
function dayTitle(date) {
  return new Intl.DateTimeFormat('es-AR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' }).format(
    new Date(`${date}T00:00:00Z`),
  );
}
function weekdayShort(date) {
  return new Intl.DateTimeFormat('es-AR', { weekday: 'short', timeZone: 'UTC' }).format(new Date(`${date}T00:00:00Z`));
}
const flash = msg => (window.rumboUI && window.rumboUI.toast ? window.rumboUI.toast(msg) : null);

const NAV_BTN = {
  width: 34,
  height: 34,
  borderRadius: 'var(--radius-sm)',
  border: '1px solid var(--hair)',
  background: 'var(--panel)',
  color: 'var(--ink-2)',
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
};

/* ---------- Lista de ítems de un día (compartida panel + agenda) ---------- */
function DayItemsList({ items, onEditEvent, onMutated, go }) {
  const { ars } = window.rumboFmt;
  const [busy, setBusy] = useState(false);

  const toggle = (id, wasDone) => {
    setBusy(true);
    window.rumboApi
      .toggleCalendarEvent(id)
      .then(() => {
        flash(wasDone ? 'Evento marcado pendiente' : 'Evento completado');
        onMutated();
      })
      .catch(e => flash(e.message))
      .finally(() => setBusy(false));
  };
  const del = ev => {
    if (!confirm(`¿Eliminar "${ev.title}"?`)) return;
    setBusy(true);
    window.rumboApi
      .deleteCalendarEvent(ev.id)
      .then(() => {
        flash('Evento eliminado');
        onMutated();
      })
      .catch(e => flash(e.message))
      .finally(() => setBusy(false));
  };

  const row = { display: 'flex', alignItems: 'flex-start', gap: 10 };
  const linkRow = { ...row, cursor: 'pointer', textDecoration: 'none' };

  return (
    <div
      style={{ display: 'flex', flexDirection: 'column', gap: 12, opacity: busy ? 0.6 : 1, transition: 'opacity .12s' }}
    >
      {/* Agenda propia — editable */}
      {items.eventos.map(e => {
        const done = e.completedAt !== null;
        return (
          <div key={e.id} style={row}>
            <input
              type="checkbox"
              checked={done}
              onChange={() => toggle(e.id, done)}
              aria-label={done ? 'Marcar pendiente' : 'Marcar hecho'}
              style={{
                marginTop: 3,
                width: 16,
                height: 16,
                accentColor: 'var(--orange)',
                cursor: 'pointer',
                flexShrink: 0,
              }}
            />
            <div style={{ minWidth: 0, flex: 1 }}>
              <div
                style={{
                  fontSize: 13.5,
                  fontWeight: 600,
                  color: done ? 'var(--ink-3)' : 'var(--ink)',
                  textDecoration: done ? 'line-through' : 'none',
                }}
              >
                {e.time ? `${e.time} · ` : ''}
                {e.title}
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>
                {EVENT_KIND_LABELS[e.kind] || e.kind}
                {e.notes ? ` · ${e.notes}` : ''}
              </div>
            </div>
            <button
              onClick={() => onEditEvent(e)}
              title="Editar"
              style={{
                fontSize: 11.5,
                fontWeight: 600,
                color: 'var(--ink-3)',
                padding: '3px 7px',
                borderRadius: 6,
                border: '1px solid var(--hair)',
                background: 'var(--panel)',
                flexShrink: 0,
              }}
            >
              Editar
            </button>
            <button
              onClick={() => del(e)}
              title="Eliminar"
              style={{
                fontSize: 11.5,
                fontWeight: 600,
                color: 'var(--red-ink)',
                padding: '3px 7px',
                borderRadius: 6,
                border: '1px solid var(--hair)',
                background: 'var(--panel)',
                flexShrink: 0,
              }}
            >
              Borrar
            </button>
          </div>
        );
      })}

      {/* Derivados — solo lectura, linkean a la póliza / siniestros */}
      {items.vencimientos.map(v => (
        <div key={v.id} style={linkRow} onClick={() => go('detail', { id: v.id })}>
          <Pill tone={CAL_META.vencimiento.pill} dot>
            Vence
          </Pill>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div
              style={{
                fontSize: 13.5,
                fontWeight: 600,
                color: 'var(--ink)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {v.client}
            </div>
            <div
              style={{
                fontSize: 11.5,
                color: 'var(--ink-3)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {v.ramo}
              {v.policyNumber ? ` · ${v.policyNumber}` : ''}
              {v.paymentMethod ? ` · ${v.paymentMethod}` : ''}
            </div>
          </div>
        </div>
      ))}

      {items.cuotas.map(c => (
        <div key={c.id} style={linkRow} onClick={() => go('detail', { id: c.policyId })}>
          <Pill tone={CAL_META.cuota.pill} dot>
            Cuota
          </Pill>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div
              style={{
                fontSize: 13.5,
                fontWeight: 600,
                color: 'var(--ink)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {c.client}
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>
              Cuota {c.number} · {ars(c.amount)}
              {c.paymentMethod ? ` · ${c.paymentMethod}` : ''}
            </div>
          </div>
        </div>
      ))}

      {items.siniestros.map(s => (
        <div key={s.id} style={linkRow} onClick={() => go('siniestros')}>
          <Pill tone={CAL_META.siniestro.pill} dot>
            Siniestro
          </Pill>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div
              style={{
                fontSize: 13.5,
                fontWeight: 600,
                color: 'var(--ink)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {s.tipo} · {s.client}
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>{s.status}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ---------- Drawer de alta/edición de evento de agenda ---------- */
function EventDrawer({ open, onClose, defaultDate, event, onSaved }) {
  const editing = !!event;
  const [title, setTitle] = useState('');
  const [kind, setKind] = useState('llamada');
  const [date, setDate] = useState(defaultDate);
  const [time, setTime] = useState('');
  // Asegurado vinculado: fila del picker {id, name} o null (Fase 3: typeahead
  // server-side, sin RUMBO_DATA.CONTACTS). Al editar se precarga con el
  // contactName que ahora manda el month view.
  const [contact, setContact] = useState(null);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Remonta limpio en cada apertura (o precarga el evento a editar).
  useEffect(() => {
    if (!open) return;
    setError(null);
    setTitle(event ? event.title : '');
    setKind(event ? event.kind : 'llamada');
    setDate(event ? event.date : defaultDate);
    setTime(event && event.time ? event.time : '');
    setContact(
      event && event.contactId ? { id: event.contactId, name: event.contactName || 'Asegurado vinculado' } : null,
    );
    setNotes(event && event.notes ? event.notes : '');
  }, [open, event, defaultDate]);

  const valid = title.trim().length > 0 && /^\d{4}-\d{2}-\d{2}$/.test(date);

  const submit = () => {
    if (!valid || saving) return;
    const data = { kind, title: title.trim(), date };
    if (time) data.time = time;
    if (notes.trim()) data.notes = notes.trim();
    if (contact) data.contactId = contact.id;
    setSaving(true);
    setError(null);
    const p = editing ? window.rumboApi.updateCalendarEvent(event.id, data) : window.rumboApi.createCalendarEvent(data);
    p.then(() => {
      flash(editing ? 'Evento actualizado' : 'Evento agendado');
      onSaved();
      onClose();
    })
      .catch(e => setError(e.message))
      .finally(() => setSaving(false));
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width={520}
      eyebrow="Agenda"
      title={editing ? 'Editar evento' : 'Agendar evento'}
      footer={
        <>
          <Btn variant="ghost" onClick={onClose}>
            Cancelar
          </Btn>
          <Btn
            variant="primary"
            icon="check"
            onClick={submit}
            style={{ opacity: valid && !saving ? 1 : 0.5, pointerEvents: valid && !saving ? 'auto' : 'none' }}
          >
            {editing ? 'Guardar cambios' : 'Agendar'}
          </Btn>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <Field label="Título" required span={2}>
          <TextInput value={title} onChange={setTitle} placeholder="Ej: Llamar por la renovación del auto" />
        </Field>

        <div style={FORM_GRID}>
          <Field label="Tipo">
            <select
              value={kind}
              onChange={e => setKind(e.target.value)}
              style={{ ...inputStyle, appearance: 'none', cursor: 'pointer' }}
            >
              {EVENT_KINDS.map(k => (
                <option key={k} value={k}>
                  {EVENT_KIND_LABELS[k]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Fecha" required>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} style={inputStyle} />
          </Field>
          <Field label="Hora" hint="opcional">
            <input type="time" value={time} onChange={e => setTime(e.target.value)} style={inputStyle} />
          </Field>
          <Field label="Asegurado" hint="opcional">
            <SearchPicker
              value={contact}
              onChange={setContact}
              fetcher={window.rumboApi.contactsPicker}
              format={c => c.name}
              sub={c => `${c.kind || ''}${c.city ? ' · ' + c.city : ''}`}
              placeholder="Buscar asegurado…"
            />
          </Field>
        </div>

        <Field label="Notas" hint="opcional" span={2}>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={3}
            maxLength={2000}
            placeholder="Detalles del evento"
            style={{ ...inputStyle, resize: 'vertical', minHeight: 80 }}
          />
        </Field>

        {error && <div style={{ fontSize: 12.5, color: 'var(--red-ink)' }}>{error}</div>}
      </div>
    </Drawer>
  );
}

/* ---------- Pantalla ---------- */
function ScreenCalendario({ go }) {
  const isMobile = useIsMobile();
  const hoy = todayAr();
  const [year, setYear] = useState(Number(hoy.slice(0, 4)));
  const [month, setMonth] = useState(Number(hoy.slice(5, 7)));
  const [selected, setSelected] = useState(hoy);
  const [viewChoice, setViewChoice] = useState(null);
  const view = viewChoice || (isMobile ? 'agenda' : 'mes');

  const [eventOpen, setEventOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  // Datos en vivo del mes (4 fuentes) vía TanStack Query: cache por mes
  // (navegar y volver no re-pide dentro del staleTime); mutar → refetch().
  const monthQ = useApiQuery(['calendar', year, month], () => window.rumboApi.calendarMonth(year, month), {
    keepPrevious: true,
  });
  const data = monthQ.data ?? null;
  const loading = monthQ.isPending;
  const error = monthQ.error;
  const refetch = () => monthQ.refetch();

  const byDay = useMemo(() => {
    const map = new Map();
    const get = d => {
      let e = map.get(d);
      if (!e) {
        e = { vencimientos: [], cuotas: [], siniestros: [], eventos: [] };
        map.set(d, e);
      }
      return e;
    };
    if (data) {
      for (const v of data.vencimientos || []) if (v.date) get(v.date).vencimientos.push(v);
      for (const c of data.cuotas || []) if (c.date) get(c.date).cuotas.push(c);
      for (const s of data.siniestros || []) if (s.date) get(s.date).siniestros.push(s);
      for (const e of data.eventos || []) if (e.date) get(e.date).eventos.push(e);
    }
    return map;
  }, [data]);

  const counts = {
    vencimiento: (data && data.vencimientos.length) || 0,
    cuota: (data && data.cuotas.length) || 0,
    siniestro: (data && data.siniestros.length) || 0,
    evento: (data && data.eventos.length) || 0,
  };

  const grid = useMemo(() => monthGridDays(year, month), [year, month]);
  const emptyDay = { vencimientos: [], cuotas: [], siniestros: [], eventos: [] };

  const nav = delta => {
    const next = shiftMonth(year, month, delta);
    setYear(next.year);
    setMonth(next.month);
    setSelected(monthRange(next.year, next.month).from);
  };
  const goToday = () => {
    setYear(Number(hoy.slice(0, 4)));
    setMonth(Number(hoy.slice(5, 7)));
    setSelected(hoy);
  };
  const openNew = () => {
    setEditing(null);
    setEventOpen(true);
  };
  const openEdit = e => {
    setEditing(e);
    setEventOpen(true);
  };

  const segs = [
    { id: 'mes', label: 'Mes' },
    { id: 'agenda', label: 'Agenda' },
  ];
  const pad = isMobile ? '18px 16px 40px' : '30px 34px 60px';

  return (
    <div className="scroll rise" style={{ overflowY: 'auto', height: '100%', padding: pad }}>
      <div style={{ maxWidth: 1160, margin: '0 auto' }}>
        <PageHead
          eyebrow="Operación"
          tick={3}
          title="Calendario"
          sub="Tu mes de un vistazo: renovaciones, cuotas, siniestros y tu agenda, en un solo lugar."
          actions={
            <Btn variant="primary" icon="plus" onClick={openNew}>
              Agendar
            </Btn>
          }
        />

        {/* Controles: navegación + vista */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button onClick={() => nav(-1)} title="Mes anterior" style={NAV_BTN}>
              <Icon name="chevronRight" size={16} stroke={2.1} style={{ transform: 'scaleX(-1)' }} />
            </button>
            <button onClick={() => nav(1)} title="Mes siguiente" style={NAV_BTN}>
              <Icon name="chevronRight" size={16} stroke={2.1} />
            </button>
            <button
              onClick={goToday}
              style={{ ...NAV_BTN, width: 'auto', padding: '0 14px', fontSize: 13, fontWeight: 600 }}
            >
              Hoy
            </button>
          </div>
          <h2
            className="font-display"
            style={{
              flex: 1,
              minWidth: 0,
              fontSize: isMobile ? 18 : 20,
              letterSpacing: '-0.02em',
              color: 'var(--ink)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {monthTitle(year, month)}
          </h2>
          <Segmented segs={segs} value={view} onChange={setViewChoice} />
        </div>

        {/* Leyenda + conteos */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: '6px 16px',
            marginBottom: 18,
            fontSize: 12,
            color: 'var(--ink-3)',
          }}
        >
          {CAL_TYPES.map(t => (
            <span key={t} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: 99, background: CAL_META[t].dot }} />
              {CAL_META[t].plural}
              <span className="font-mono tnum" style={{ color: 'var(--ink-2)' }}>
                {counts[t]}
              </span>
            </span>
          ))}
        </div>

        {loading ? (
          <CalendarSkeleton view={view} isMobile={isMobile} />
        ) : error ? (
          <CalendarError error={error} onRetry={refetch} />
        ) : view === 'mes' && !isMobile ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 20, alignItems: 'start' }}>
            <MonthGrid
              grid={grid}
              byDay={byDay}
              hoy={hoy}
              selected={selected}
              onSelect={cell => {
                setSelected(cell.date);
                if (!cell.inMonth) {
                  setYear(Number(cell.date.slice(0, 4)));
                  setMonth(Number(cell.date.slice(5, 7)));
                }
              }}
            />
            <DayPanel
              date={selected}
              items={byDay.get(selected) || emptyDay}
              onNewEvent={openNew}
              onNewClaim={() => window.rumboUI && window.rumboUI.newSiniestro()}
              onEditEvent={openEdit}
              onMutated={refetch}
              go={go}
            />
          </div>
        ) : (
          <AgendaView
            grid={grid}
            byDay={byDay}
            hoy={hoy}
            selected={selected}
            onSelect={setSelected}
            onNewEvent={openNew}
            onEditEvent={openEdit}
            onMutated={refetch}
            go={go}
          />
        )}
      </div>

      <EventDrawer
        open={eventOpen}
        onClose={() => setEventOpen(false)}
        defaultDate={selected}
        event={editing}
        onSaved={refetch}
      />
    </div>
  );
}

/* ---------- Skeleton de carga (con la forma del calendario real) ---------- */
function CalendarSkeleton({ view, isMobile }) {
  const heads = ['lun', 'mar', 'mié', 'jue', 'vie', 'sáb', 'dom'];
  const monthGrid = (
    <div
      style={{
        background: 'var(--panel)',
        border: '1px solid var(--hair)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
      }}
    >
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid var(--hair)' }}>
        {heads.map(h => (
          <div key={h} className="eyebrow" style={{ padding: '10px 8px', textAlign: 'center' }}>
            {h}
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
        {Array.from({ length: 42 }).map((_, i) => (
          <div
            key={i}
            style={{
              height: 104,
              display: 'flex',
              flexDirection: 'column',
              gap: 7,
              padding: 8,
              overflow: 'hidden',
              borderRight: i % 7 !== 6 ? '1px solid var(--hair)' : 'none',
              borderBottom: i < 35 ? '1px solid var(--hair)' : 'none',
            }}
          >
            <span className="skel" style={{ width: 18, height: 18, borderRadius: 99 }} />
            {(i * 7) % 5 === 0 && <span className="skel" style={{ width: '80%', height: 9 }} />}
            {(i * 3) % 4 === 0 && <span className="skel" style={{ width: '60%', height: 9 }} />}
          </div>
        ))}
      </div>
    </div>
  );

  const dayPanel = (
    <div
      style={{
        background: 'var(--panel)',
        border: '1px solid var(--hair)',
        borderRadius: 'var(--radius-lg)',
        padding: 18,
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
      }}
    >
      <span className="skel" style={{ width: 140, height: 13 }} />
      <div style={{ display: 'flex', gap: 8 }}>
        <span className="skel" style={{ width: 92, height: 30, borderRadius: 9 }} />
        <span className="skel" style={{ width: 92, height: 30, borderRadius: 9 }} />
      </div>
      {Array.from({ length: 3 }).map((_, i) => (
        <span key={i} className="skel" style={{ width: '100%', height: 44, borderRadius: 10 }} />
      ))}
    </div>
  );

  const agenda = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {Array.from({ length: 6 }).map((_, i) => (
        <span key={i} className="skel" style={{ width: '100%', height: 58, borderRadius: 12 }} />
      ))}
    </div>
  );

  if (view === 'mes' && !isMobile) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 20, alignItems: 'start' }}>
        {monthGrid}
        {dayPanel}
      </div>
    );
  }
  return agenda;
}

/* ---------- Grid mensual (desktop) ---------- */
function MonthGrid({ grid, byDay, hoy, selected, onSelect }) {
  const emptyDay = { vencimientos: [], cuotas: [], siniestros: [], eventos: [] };
  const heads = ['lun', 'mar', 'mié', 'jue', 'vie', 'sáb', 'dom'];
  return (
    <div
      style={{
        background: 'var(--panel)',
        border: '1px solid var(--hair)',
        borderRadius: 'var(--radius)',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid var(--hair)' }}>
        {heads.map(d => (
          <div key={d} className="eyebrow" style={{ textAlign: 'center', padding: '8px 0', fontSize: 10 }}>
            {d}
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
        {grid.map((cell, i) => {
          const items = byDay.get(cell.date) || emptyDay;
          const chips = [
            ...items.vencimientos.map(v => ({ key: `v-${v.id}`, dot: CAL_META.vencimiento.dot, text: v.client })),
            ...items.cuotas.map(c => ({
              key: `c-${c.id}`,
              dot: CAL_META.cuota.dot,
              text: `Cuota ${c.number} ${c.client}`,
            })),
            ...items.siniestros.map(s => ({ key: `s-${s.id}`, dot: CAL_META.siniestro.dot, text: s.tipo })),
            ...items.eventos.map(e => ({
              key: `e-${e.id}`,
              dot: CAL_META.evento.dot,
              text: e.title,
              done: e.completedAt !== null,
            })),
          ];
          const isToday = cell.date === hoy;
          const isSel = cell.date === selected;
          // Todas las celdas miden igual (height fijo + overflow hidden). Lo que no
          // entra se resume en "+N más"; el título nativo lista todo al pasar el mouse.
          const cellTitle = chips.length ? chips.map(ch => ch.text).join('\n') : undefined;
          return (
            <div
              key={cell.date}
              onClick={() => onSelect(cell)}
              title={cellTitle}
              style={{
                height: 104,
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
                padding: 6,
                cursor: 'pointer',
                overflow: 'hidden',
                borderRight: i % 7 !== 6 ? '1px solid var(--hair)' : 'none',
                borderBottom: i < grid.length - 7 ? '1px solid var(--hair)' : 'none',
                background: isSel ? 'var(--orange-soft)' : 'transparent',
                transition: 'background .12s',
              }}
            >
              <span
                style={{
                  width: 22,
                  height: 22,
                  flexShrink: 0,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 99,
                  fontSize: 11.5,
                  fontWeight: 600,
                  fontFamily: 'var(--font-mono)',
                  background: isToday ? 'var(--orange)' : 'transparent',
                  color: isToday ? 'var(--paper)' : !cell.inMonth ? 'var(--ink-3)' : 'var(--ink-2)',
                }}
              >
                {cell.day}
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                {chips.slice(0, 3).map(ch => (
                  <span
                    key={ch.key}
                    title={ch.text}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 5,
                      fontSize: 10.5,
                      lineHeight: 1.3,
                      color: 'var(--ink-2)',
                      textDecoration: ch.done ? 'line-through' : 'none',
                      opacity: ch.done ? 0.6 : 1,
                    }}
                  >
                    <span style={{ width: 5, height: 5, borderRadius: 99, background: ch.dot, flexShrink: 0 }} />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {ch.text}
                    </span>
                  </span>
                ))}
                {chips.length > 3 && (
                  <span style={{ fontSize: 10, color: 'var(--ink-3)' }}>+{chips.length - 3} más</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- Panel del día (desktop) ---------- */
function DayPanel({ date, items, onNewEvent, onNewClaim, onEditEvent, onMutated, go }) {
  const empty = items.vencimientos.length + items.cuotas.length + items.siniestros.length + items.eventos.length === 0;
  return (
    <Panel style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
        <div
          className="eyebrow"
          style={{ textTransform: 'none', fontSize: 12.5, color: 'var(--ink)', fontWeight: 600 }}
        >
          {dayTitle(date)}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <Btn size="sm" variant="soft" icon="plus" onClick={onNewEvent}>
          Agendar
        </Btn>
        <Btn size="sm" variant="ghost" icon="shield" onClick={onNewClaim}>
          Siniestro
        </Btn>
      </div>
      {empty ? (
        <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--ink-3)' }}>
          <Icon name="calendar" size={22} stroke={1.7} style={{ color: 'var(--ink-3)' }} />
          <div style={{ fontSize: 12.5, marginTop: 8 }}>Nada para este día.</div>
          <div style={{ fontSize: 11.5, marginTop: 2 }}>Agendá un evento o reportá un siniestro.</div>
        </div>
      ) : (
        <DayItemsList items={items} onEditEvent={onEditEvent} onMutated={onMutated} go={go} />
      )}
    </Panel>
  );
}

/* ---------- Vista Agenda (default mobile): lista del mes por día ---------- */
function AgendaView({ grid, byDay, hoy, selected, onSelect, onNewEvent, onEditEvent, onMutated, go }) {
  const days = grid.filter(g => g.inMonth && byDay.has(g.date));
  if (days.length === 0) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: 'var(--ink-3)' }}>
        <Icon name="calendar" size={26} stroke={1.7} style={{ color: 'var(--ink-3)' }} />
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink-2)', marginTop: 12 }}>Mes despejado</div>
        <div style={{ fontSize: 12.5, marginTop: 4, marginBottom: 16 }}>
          Ni vencimientos ni cuotas ni siniestros ni eventos este mes.
        </div>
        <Btn size="sm" variant="primary" icon="plus" onClick={onNewEvent} style={{ margin: '0 auto' }}>
          Agendar evento
        </Btn>
      </div>
    );
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {days.map(g => {
        const items = byDay.get(g.date);
        const isToday = g.date === hoy;
        return (
          <div
            key={g.date}
            onClick={() => onSelect(g.date)}
            style={{
              display: 'flex',
              gap: 14,
              padding: 14,
              background: 'var(--panel)',
              border: '1px solid var(--hair)',
              borderRadius: 'var(--radius)',
              boxShadow: 'var(--shadow-sm)',
              outline: g.date === selected ? '2px solid var(--orange)' : 'none',
              outlineOffset: -1,
            }}
          >
            <div style={{ width: 44, flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span className="eyebrow" style={{ fontSize: 10 }}>
                {weekdayShort(g.date)}
              </span>
              <span
                style={{
                  width: 32,
                  height: 32,
                  marginTop: 2,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 99,
                  fontFamily: 'var(--font-mono)',
                  fontSize: 15,
                  fontWeight: 700,
                  background: isToday ? 'var(--orange)' : 'transparent',
                  color: isToday ? 'var(--paper)' : 'var(--ink)',
                }}
              >
                {g.day}
              </span>
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <DayItemsList items={items} onEditEvent={onEditEvent} onMutated={onMutated} go={go} />
            </div>
          </div>
        );
      })}
      <div style={{ display: 'flex', gap: 8, marginTop: 2 }}>
        <Btn size="sm" variant="soft" icon="plus" onClick={onNewEvent}>
          Agendar
        </Btn>
        <Btn size="sm" variant="ghost" icon="shield" onClick={() => window.rumboUI && window.rumboUI.newSiniestro()}>
          Siniestro
        </Btn>
      </div>
    </div>
  );
}

/* ---------- Estado de error de carga ---------- */
function CalendarError({ error, onRetry }) {
  const auth = error && (error.status === 401 || error.status === 403);
  const msg = auth
    ? 'El calendario usa datos en vivo de tu cartera. Entrá con tu cuenta para verlo y agendar.'
    : (error && error.message) || 'No pudimos cargar el calendario.';
  return (
    <div style={{ padding: 40, textAlign: 'center', color: 'var(--ink-3)' }}>
      <Icon name="calendar" size={26} stroke={1.7} style={{ color: 'var(--ink-3)' }} />
      <div style={{ fontSize: 13.5, color: 'var(--ink-2)', margin: '12px auto 16px', maxWidth: 420 }}>{msg}</div>
      {!auth && (
        <Btn size="sm" variant="ghost" icon="refresh" onClick={onRetry} style={{ margin: '0 auto' }}>
          Reintentar
        </Btn>
      )}
    </div>
  );
}

Object.assign(window, { ScreenCalendario });
