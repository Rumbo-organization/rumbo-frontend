/* ============================================================
   RUMBO — Pre-denuncia PÚBLICA (/d/:slug) — Slice 1
   La completa el asegurado (o un tercero) desde el link del productor,
   SIN login ni bootstrap: se monta desde app.jsx ANTES del gate de sesión.
   Wizard de 3 pasos, mobile-first. Habla con /api/public/pre-denuncia/:slug
   (fetch propio, sin api-client autenticado).

   Reglas del doc 17 que esta pantalla respeta:
   - El lookup por DNI muestra "✓ Te identificamos: R*** P***" (enmascarado;
     jamás nombre completo, teléfono ni email
     de la cartera); si no matchea, pide el nombre sin decir "no encontrado".
   - Teléfono y email SIEMPRE se piden (dato declarado fresco para el PAS).
   - Consentimiento (Ley 25.326) obligatorio junto al Enviar.
   ============================================================ */

const PD_PROVINCIAS = [
  'Buenos Aires',
  'CABA',
  'Catamarca',
  'Chaco',
  'Chubut',
  'Córdoba',
  'Corrientes',
  'Entre Ríos',
  'Formosa',
  'Jujuy',
  'La Pampa',
  'La Rioja',
  'Mendoza',
  'Misiones',
  'Neuquén',
  'Río Negro',
  'Salta',
  'San Juan',
  'San Luis',
  'Santa Cruz',
  'Santa Fe',
  'Santiago del Estero',
  'Tierra del Fuego',
  'Tucumán',
];

const PD_STEP_LABELS = ['Identificación', 'Incidente', 'Confirmación'];

async function pdFetch(path, opts) {
  const r = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
  });
  const body = await r.json().catch(() => ({}));
  if (!r.ok) {
    const err = new Error(body.error || 'Error de conexión.');
    err.status = r.status;
    throw err;
  }
  return body;
}

/* hoy en formato YYYY-MM-DD (para max del date input) */
function pdToday() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Cordoba' });
}

function PdProgress({ step }) {
  return (
    <div style={{ textAlign: 'center', margin: '14px 0 22px' }}>
      <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 7 }}>
        {[1, 2, 3].map(n => (
          <span
            key={n}
            style={{
              width: 54,
              height: 5,
              borderRadius: 99,
              background: n <= step ? 'var(--orange)' : 'var(--hair)',
              transition: 'background .2s',
            }}
          />
        ))}
      </div>
      <span className="eyebrow">
        Paso {step} de 3 — {PD_STEP_LABELS[step - 1]}
      </span>
    </div>
  );
}

/* Slots de adjuntos por ramo (Slice 3): a diferencia de la competencia (slots
   fijos de carrocería para todo), acá se adaptan al bien asegurado. */
function pdSlots(ramo) {
  if (ramo === 'automotor' || ramo === 'motovehiculo')
    return ['Frente', 'Lado izquierdo', 'Lado derecho', 'Trasero', 'Detalle del daño'];
  if (ramo === 'hogar' || ramo === 'comercio' || ramo === 'consorcio' || ramo === 'incendio')
    return ['Foto del daño', 'Foto del lugar'];
  if (ramo === 'agro') return ['Lote / cultivo'];
  if (ramo === 'art') return ['Documentación (certificado, acta)'];
  return [];
}

const PD_MAX_ATTACH = 8;
const PD_MAX_BYTES = 4 * 1024 * 1024; // techo real del body en Vercel (~4.5 MB)

/* Compresión client-side de imágenes (canvas, máx 1600px, JPEG 0.8): una foto
   de celular de 5 MB queda en ~400 KB y entra en el límite. PDF pasa directo. */
async function pdCompress(file) {
  if (!file.type.startsWith('image/')) return file;
  try {
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, 1600 / Math.max(bmp.width, bmp.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bmp.width * scale));
    canvas.height = Math.max(1, Math.round(bmp.height * scale));
    canvas.getContext('2d').drawImage(bmp, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise(r => canvas.toBlob(r, 'image/jpeg', 0.8));
    if (blob && blob.size < file.size) {
      return new File([blob], file.name.replace(/\.\w+$/, '') + '.jpg', { type: 'image/jpeg' });
    }
    return file;
  } catch {
    return file;
  }
}

function ScreenPreDenunciaPublica({ slug }) {
  const [meta, setMeta] = useState(null); // { producer, org, catalog } | 'notfound'
  const [step, setStep] = useState(1);
  const [error, setError] = useState(null);
  const [sending, setSending] = useState(false);
  const [doneNumber, setDoneNumber] = useState(null);

  // Paso 1
  const [kind, setKind] = useState('asegurado');
  const [tercero, setTercero] = useState({ nombre: '', apellido: '', dni: '', telefono: '', email: '' });
  const [doc, setDoc] = useState('');
  const [matched, setMatched] = useState(false);
  // Nombre ENMASCARADO que devuelve el lookup ("R*** P***"): feedback de que
  // el match es la persona correcta, sin ecoar PII (doc 17, regla #2).
  const [matchedNombre, setMatchedNombre] = useState('');
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');

  // Paso 2
  const [ramo, setRamo] = useState('');
  const [tipo, setTipo] = useState('');
  const [fecha, setFecha] = useState('');
  const [hora, setHora] = useState('');
  const [provincia, setProvincia] = useState('');
  const [localidad, setLocalidad] = useState('');
  const [direccion, setDireccion] = useState('');
  const [bien, setBien] = useState('');
  const [relato, setRelato] = useState('');

  // Paso 3
  const [consent, setConsent] = useState(false);
  const [files, setFiles] = useState([]); // [{ slot, file, name, sizeKb }]
  const [uploadNote, setUploadNote] = useState('');
  const [doneAtt, setDoneAtt] = useState(null); // { sent, total } tras el envío

  // La página pública siempre en claro (no hereda tweaks del cockpit).
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'light');
  }, []);

  useEffect(() => {
    pdFetch(`/api/public/pre-denuncia/${slug}`)
      .then(setMeta)
      .catch(err => setMeta(err.status === 410 ? 'yaEnviada' : 'notfound'));
  }, [slug]);

  const isPolicyLink = Boolean(meta && meta !== 'notfound' && meta !== 'yaEnviada' && meta.mode === 'policy_link');

  // Prefill del Modo B (Slice 4): el link es privado (el PAS se lo mandó al
  // titular), así que la identidad y el bien vienen completos y visibles.
  useEffect(() => {
    if (!isPolicyLink || !meta.prefill) return;
    const p = meta.prefill;
    setDoc((p.doc || '').replace(/\D/g, ''));
    setNombre(p.nombre || '');
    setTelefono(p.telefono || '');
    setEmail(p.email || '');
    if (p.ramo) setRamo(p.ramo);
    setBien(p.bien || '');
  }, [isPolicyLink, meta]);

  // Lookup silencioso por documento (debounce; solo Modo A). Si matchea
  // mostramos el nombre enmascarado; si no, pedimos el nombre sin anunciar nada.
  useEffect(() => {
    if (isPolicyLink) return;
    const d = doc.replace(/\D/g, '');
    if (d.length < 7) {
      setMatched(false);
      setMatchedNombre('');
      return;
    }
    const t = setTimeout(() => {
      pdFetch(`/api/public/pre-denuncia/${slug}/lookup`, { method: 'POST', body: JSON.stringify({ doc: d }) })
        .then(r => {
          setMatched(Boolean(r.matched));
          setMatchedNombre(r.nombre || '');
        })
        .catch(() => {
          setMatched(false);
          setMatchedNombre('');
        });
    }, 400);
    return () => clearTimeout(t);
  }, [doc, slug, isPolicyLink]);

  const catalog = (meta && meta !== 'notfound' && meta !== 'yaEnviada' && meta.catalog) || [];
  const ramoSel = catalog.find(r => r.code === ramo) || null;
  const esVehiculo = ramo === 'automotor' || ramo === 'motovehiculo';

  const emailOk = s => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
  const step1Ok =
    doc.replace(/\D/g, '').length >= 6 &&
    (matched || isPolicyLink || nombre.trim()) &&
    telefono.trim().length >= 6 &&
    emailOk(email.trim()) &&
    (kind === 'asegurado' ||
      (tercero.nombre.trim() &&
        tercero.apellido.trim() &&
        tercero.dni.replace(/\D/g, '').length >= 6 &&
        emailOk(tercero.email.trim())));
  const step2Ok =
    ramo && tipo && fecha && fecha <= pdToday() && hora && provincia && localidad.trim() && relato.trim().length >= 10;

  const submit = () => {
    if (!consent || sending) return;
    setSending(true);
    setError(null);
    const body = {
      declaranteKind: kind,
      ...(kind === 'tercero'
        ? {
            tercero: {
              nombre: tercero.nombre.trim(),
              apellido: tercero.apellido.trim(),
              dni: tercero.dni.replace(/\D/g, ''),
              email: tercero.email.trim(),
              ...(tercero.telefono.trim() ? { telefono: tercero.telefono.trim() } : {}),
            },
          }
        : {}),
      asegurado: {
        doc: doc.replace(/\D/g, ''),
        ...(nombre.trim() ? { nombre: nombre.trim() } : {}),
        telefono: telefono.trim(),
        email: email.trim(),
      },
      incidente: {
        ramo,
        tipo,
        fecha,
        hora,
        provincia,
        localidad: localidad.trim(),
        ...(direccion.trim() ? { direccion: direccion.trim() } : {}),
        ...(bien.trim() ? { bien: bien.trim() } : {}),
        relato: relato.trim(),
      },
      consent: true,
    };
    (async () => {
      try {
        const r = await pdFetch(`/api/public/pre-denuncia/${slug}`, { method: 'POST', body: JSON.stringify(body) });
        // Adjuntos DESPUÉS del submit, de a uno (límite de body de Vercel):
        // una falla parcial no rompe el envío — la pre-denuncia ya existe.
        let sent = 0;
        for (let i = 0; i < files.length; i++) {
          setUploadNote(`Enviando adjuntos (${i + 1}/${files.length})…`);
          try {
            const fd = new FormData();
            fd.append('token', r.uploadToken);
            fd.append('slot', files[i].slot);
            fd.append('file', files[i].file, files[i].name);
            const up = await fetch(`/api/public/pre-denuncia/attachments/${r.intakeId}`, {
              method: 'POST',
              body: fd,
            });
            if (up.ok) sent++;
          } catch {
            /* parcial */
          }
        }
        setDoneAtt(files.length > 0 ? { sent, total: files.length } : null);
        setDoneNumber(r.number);
      } catch (e) {
        setError(e.message);
      } finally {
        setSending(false);
        setUploadNote('');
      }
    })();
  };

  // Adjuntos: los slots fijos reemplazan su archivo; "Adicional" acumula.
  const addFile = async (slot, raw) => {
    if (!raw || files.length >= PD_MAX_ATTACH) return;
    const file = await pdCompress(raw);
    if (file.size > PD_MAX_BYTES) {
      setError('Ese archivo supera los 4 MB incluso comprimido. Probá con una foto más liviana.');
      return;
    }
    setError(null);
    setFiles(fs => [
      ...fs.filter(f => f.slot !== slot || slot === 'Adicional'),
      { slot, file, name: file.name, sizeKb: Math.max(1, Math.round(file.size / 1024)) },
    ]);
  };
  const removeFile = idx => setFiles(fs => fs.filter((_, i) => i !== idx));

  const shell = children => (
    <div
      className="scroll"
      style={{ minHeight: '100vh', overflowY: 'auto', background: 'var(--paper)', padding: '26px 16px 60px' }}
    >
      <div
        style={{
          maxWidth: 560,
          margin: '0 auto',
          background: 'var(--panel)',
          border: '1px solid var(--hair)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-sm)',
          padding: '26px 22px 28px',
        }}
      >
        {children}
      </div>
      <div style={{ textAlign: 'center', marginTop: 16, fontSize: 11.5, color: 'var(--ink-3)' }}>
        Formulario seguro de pre-denuncia · no compartas este link con desconocidos
      </div>
    </div>
  );

  if (meta === null) {
    return shell(
      <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--ink-3)', fontSize: 13.5 }}>Cargando…</div>,
    );
  }
  if (meta === 'notfound') {
    return shell(
      <div style={{ padding: '30px 0', textAlign: 'center' }}>
        <Icon name="alert" size={26} style={{ color: 'var(--amber-ink)' }} />
        <div style={{ fontSize: 15, fontWeight: 600, marginTop: 12 }}>Este link no está disponible</div>
        <div style={{ fontSize: 13, color: 'var(--ink-2)', marginTop: 6 }}>
          Puede haber vencido o cambiado. Pedile a tu productor de seguros el link actualizado.
        </div>
      </div>,
    );
  }
  if (meta === 'yaEnviada') {
    return shell(
      <div style={{ padding: '30px 0', textAlign: 'center' }}>
        <Icon name="check" size={26} style={{ color: 'var(--emerald-ink)' }} />
        <div style={{ fontSize: 15, fontWeight: 600, marginTop: 12 }}>Esta pre-denuncia ya fue enviada</div>
        <div style={{ fontSize: 13, color: 'var(--ink-2)', marginTop: 6 }}>
          Tu productor la está gestionando y se va a contactar con vos. Si necesitás agregar algo, escribile directo.
        </div>
      </div>,
    );
  }
  if (doneNumber != null) {
    return shell(
      <div style={{ padding: '26px 0', textAlign: 'center' }}>
        <span
          style={{
            width: 52,
            height: 52,
            borderRadius: 99,
            background: 'var(--emerald-soft)',
            color: 'var(--emerald-ink)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name="check" size={26} stroke={2.4} />
        </span>
        <h1 className="font-display" style={{ fontSize: 24, marginTop: 14 }}>
          Pre-denuncia enviada
        </h1>
        <div className="font-mono tnum" style={{ fontSize: 14, color: 'var(--ink-2)', marginTop: 8 }}>
          Tu número de referencia: <strong style={{ color: 'var(--ink)' }}>N° {doneNumber}</strong>
        </div>
        {doneAtt && (
          <div
            style={{
              fontSize: 12.5,
              marginTop: 8,
              color: doneAtt.sent === doneAtt.total ? 'var(--emerald-ink)' : 'var(--amber-ink)',
            }}
          >
            {doneAtt.sent === doneAtt.total
              ? `${doneAtt.sent} adjunto${doneAtt.sent === 1 ? '' : 's'} enviado${doneAtt.sent === 1 ? '' : 's'} ✓`
              : `Se enviaron ${doneAtt.sent} de ${doneAtt.total} adjuntos — tu productor puede pedirte el resto por WhatsApp.`}
          </div>
        )}
        <div style={{ fontSize: 13.5, color: 'var(--ink-2)', marginTop: 14, lineHeight: 1.55 }}>
          Te enviamos un correo con el detalle. <strong>{meta.producer}</strong> va a gestionar la denuncia formal en la
          compañía de seguros y se va a contactar con vos.
        </div>
        <div style={{ fontSize: 12.5, color: 'var(--ink-3)', marginTop: 14 }}>Ya podés cerrar esta ventana.</div>
      </div>,
    );
  }

  return shell(
    <>
      <div style={{ textAlign: 'center' }}>
        <span
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: 'var(--orange-soft)',
            color: 'var(--orange-ink)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name="shield" size={22} stroke={2} />
        </span>
        <h1 className="font-display" style={{ fontSize: 24, marginTop: 10, letterSpacing: '-0.02em' }}>
          Pre-denuncia de siniestro
        </h1>
        <div style={{ fontSize: 12.5, color: 'var(--ink-3)', marginTop: 4 }}>
          {meta.producer} · {meta.org}
        </div>
      </div>

      <PdProgress step={step} />

      {step === 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ink-2)', marginBottom: 7 }}>
              ¿Quién completa esta pre-denuncia?
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {[
                ['asegurado', 'El asegurado'],
                ['tercero', 'Otra persona'],
              ].map(([v, l]) => (
                <button
                  key={v}
                  onClick={() => setKind(v)}
                  style={{
                    flex: 1,
                    padding: 11,
                    borderRadius: 9,
                    border: `1px solid ${kind === v ? 'var(--orange)' : 'var(--hair)'}`,
                    background: kind === v ? 'var(--orange-soft)' : 'var(--panel)',
                    color: kind === v ? 'var(--orange-ink)' : 'var(--ink-2)',
                    fontWeight: 600,
                    fontSize: 13.5,
                    cursor: 'pointer',
                  }}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          {kind === 'tercero' && (
            <div
              style={{
                padding: '14px 14px 16px',
                borderRadius: 10,
                background: 'var(--panel-2)',
                border: '1px solid var(--hair)',
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
              }}
            >
              <span className="eyebrow">Tus datos (quien completa)</span>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <Field label="Nombre" required span={1}>
                  <TextInput value={tercero.nombre} onChange={v => setTercero(s => ({ ...s, nombre: v }))} />
                </Field>
                <Field label="Apellido" required span={1}>
                  <TextInput value={tercero.apellido} onChange={v => setTercero(s => ({ ...s, apellido: v }))} />
                </Field>
              </div>
              <Field label="DNI" required>
                <TextInput
                  value={tercero.dni}
                  onChange={v => setTercero(s => ({ ...s, dni: v.replace(/[^0-9]/g, '') }))}
                  mono
                />
              </Field>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <Field label="Teléfono" hint="opcional" span={1}>
                  <TextInput value={tercero.telefono} onChange={v => setTercero(s => ({ ...s, telefono: v }))} mono />
                </Field>
                <Field label="Email" required span={1}>
                  <TextInput value={tercero.email} onChange={v => setTercero(s => ({ ...s, email: v }))} mono />
                </Field>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {kind === 'tercero' && <span className="eyebrow">Datos del asegurado</span>}
            {isPolicyLink ? (
              /* Modo B: identidad conocida (el link es privado, enviado por tu
                 productor) — solo confirmás teléfono y email. */
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '11px 14px',
                  borderRadius: 10,
                  background: 'var(--panel-2)',
                  border: '1px solid var(--hair)',
                }}
              >
                <Icon name="users" size={18} style={{ color: 'var(--ink-3)', flexShrink: 0 }} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600 }}>{nombre || 'Asegurado'}</div>
                  <div className="font-mono" style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>
                    {doc ? `doc ${doc}` : ''}
                    {meta.prefill?.policyNumber ? `${doc ? ' · ' : ''}póliza ${meta.prefill.policyNumber}` : ''}
                  </div>
                </div>
              </div>
            ) : (
              <Field label="DNI o CUIT del asegurado" required hint="solo números">
                <TextInput value={doc} onChange={v => setDoc(v.replace(/[^0-9]/g, ''))} mono placeholder="12345678" />
              </Field>
            )}
            {isPolicyLink && !doc && (
              <Field label="DNI o CUIT del asegurado" required hint="solo números">
                <TextInput value={doc} onChange={v => setDoc(v.replace(/[^0-9]/g, ''))} mono placeholder="12345678" />
              </Field>
            )}
            {!isPolicyLink &&
              (matched ? (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '9px 12px',
                    borderRadius: 9,
                    background: 'var(--emerald-soft)',
                    color: 'var(--emerald-ink)',
                    fontSize: 12.5,
                    fontWeight: 600,
                  }}
                >
                  <Icon name="check" size={15} stroke={2.2} style={{ flexShrink: 0 }} />
                  <span>
                    Te identificamos{matchedNombre ? ': ' : ' en la cartera'}
                    {matchedNombre && <strong>{matchedNombre}</strong>} — no hace falta que cargues tu nombre.
                    {matchedNombre ? ' Si no sos vos, revisá el número.' : ''}
                  </span>
                </div>
              ) : (
                <Field label="Nombre completo o razón social" required>
                  <TextInput value={nombre} onChange={setNombre} placeholder="Como figura en la póliza" />
                </Field>
              ))}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <Field label="Teléfono de contacto" required span={1}>
                <TextInput value={telefono} onChange={setTelefono} mono placeholder="+54 9 …" />
              </Field>
              <Field label="Email" required span={1}>
                <TextInput value={email} onChange={setEmail} mono placeholder="tu@correo.com" />
              </Field>
            </div>
          </div>

          <Btn
            variant="primary"
            iconRight="arrowRight"
            onClick={() => step1Ok && setStep(2)}
            style={{
              width: '100%',
              justifyContent: 'center',
              opacity: step1Ok ? 1 : 0.5,
              pointerEvents: step1Ok ? 'auto' : 'none',
            }}
          >
            Continuar
          </Btn>
        </div>
      )}

      {step === 2 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {isPolicyLink && ramoSel ? (
            /* Modo B: el bien viene de la póliza del link — no se pregunta. */
            <div
              style={{
                padding: '10px 13px',
                borderRadius: 9,
                background: 'var(--panel-2)',
                border: '1px solid var(--hair)',
                fontSize: 13,
                color: 'var(--ink-2)',
              }}
            >
              Bien asegurado: <strong style={{ color: 'var(--ink)' }}>{ramoSel.publicLabel}</strong>
              {bien ? (
                <span className="font-mono" style={{ fontSize: 12 }}>
                  {' '}
                  · {bien}
                </span>
              ) : null}
            </div>
          ) : (
            <Field label="¿Qué bien está asegurado?" required>
              <select
                value={ramo}
                onChange={e => {
                  setRamo(e.target.value);
                  setTipo('');
                }}
                style={{ ...inputStyle, appearance: 'none', cursor: 'pointer' }}
              >
                <option value="">Elegí una opción…</option>
                {catalog.map(r => (
                  <option key={r.code} value={r.code}>
                    {r.publicLabel}
                  </option>
                ))}
              </select>
            </Field>
          )}
          {ramoSel && (
            <Field label="¿Qué pasó?" required>
              <select
                value={tipo}
                onChange={e => setTipo(e.target.value)}
                style={{ ...inputStyle, appearance: 'none', cursor: 'pointer' }}
              >
                <option value="">Elegí una opción…</option>
                {ramoSel.tipos.map(t => (
                  <option key={t.code} value={t.code}>
                    {t.label}
                  </option>
                ))}
              </select>
            </Field>
          )}
          {esVehiculo && !isPolicyLink && (
            <Field label="Patente" hint="si la sabés, ayuda a encontrar tu póliza">
              <TextInput value={bien} onChange={v => setBien(v.toUpperCase())} mono placeholder="AB123CD" />
            </Field>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Field label="Fecha del siniestro" required span={1}>
              <input
                type="date"
                value={fecha}
                max={pdToday()}
                onChange={e => setFecha(e.target.value)}
                style={inputStyle}
              />
            </Field>
            <Field label="Hora" required span={1}>
              <input type="time" value={hora} onChange={e => setHora(e.target.value)} style={inputStyle} />
            </Field>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Field label="Provincia" required span={1}>
              <select
                value={provincia}
                onChange={e => setProvincia(e.target.value)}
                style={{ ...inputStyle, appearance: 'none', cursor: 'pointer' }}
              >
                <option value="">Elegí…</option>
                {PD_PROVINCIAS.map(p => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Localidad" required span={1}>
              <TextInput value={localidad} onChange={setLocalidad} placeholder="Ciudad" />
            </Field>
          </div>
          <Field label="Dirección o referencia del lugar" hint="opcional">
            <TextInput value={direccion} onChange={setDireccion} placeholder="Calle y altura, ruta y km, etc." />
          </Field>
          <Field label="Contanos qué pasó" required>
            <textarea
              value={relato}
              onChange={e => setRelato(e.target.value)}
              rows={5}
              maxLength={4000}
              placeholder="Describí lo ocurrido con tus palabras…"
              style={{ ...inputStyle, resize: 'vertical', minHeight: 110 }}
            />
          </Field>
          <div style={{ display: 'flex', gap: 10 }}>
            <Btn variant="ghost" onClick={() => setStep(1)} style={{ flex: 1, justifyContent: 'center' }}>
              Anterior
            </Btn>
            <Btn
              variant="primary"
              iconRight="arrowRight"
              onClick={() => step2Ok && setStep(3)}
              style={{
                flex: 2,
                justifyContent: 'center',
                opacity: step2Ok ? 1 : 0.5,
                pointerEvents: step2Ok ? 'auto' : 'none',
              }}
            >
              Continuar
            </Btn>
          </div>
        </div>
      )}

      {step === 3 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div
            style={{
              padding: '14px 16px',
              borderRadius: 10,
              background: 'var(--panel-2)',
              border: '1px solid var(--hair)',
              fontSize: 13,
              color: 'var(--ink-2)',
              lineHeight: 1.6,
            }}
          >
            <div>
              <strong style={{ color: 'var(--ink)' }}>{ramoSel?.tipos.find(t => t.code === tipo)?.label}</strong> ·{' '}
              {ramoSel?.publicLabel}
            </div>
            <div>
              {fecha} a las {hora} · {[direccion, localidad, provincia].filter(Boolean).join(', ')}
            </div>
            {bien && <div className="font-mono">{bien}</div>}
            <div style={{ marginTop: 6, fontSize: 12.5, color: 'var(--ink-3)' }}>{relato}</div>
          </div>

          {/* Adjuntos (Slice 3): opcionales, slots según el bien + adicionales.
              Se comprimen en el navegador y suben DESPUÉS del envío, de a uno. */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <span className="eyebrow">Fotos y documentos (opcional)</span>
            {files.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {files.map((f, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5 }}>
                    <Icon name="check" size={13} style={{ color: 'var(--emerald-ink)', flexShrink: 0 }} />
                    <span style={{ color: 'var(--ink-3)', flexShrink: 0 }}>{f.slot}:</span>
                    <span
                      style={{
                        minWidth: 0,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        fontWeight: 600,
                      }}
                    >
                      {f.name}
                    </span>
                    <span className="font-mono" style={{ fontSize: 10.5, color: 'var(--ink-3)', flexShrink: 0 }}>
                      {f.sizeKb} KB
                    </span>
                    <button
                      onClick={() => removeFile(i)}
                      title="Quitar"
                      style={{ color: 'var(--red-ink)', fontSize: 12, fontWeight: 700, flexShrink: 0 }}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {[...pdSlots(ramo).filter(s => !files.some(f => f.slot === s)), 'Adicional'].map(slot => (
                <label
                  key={slot}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '8px 12px',
                    borderRadius: 9,
                    border: '1px dashed var(--hair)',
                    background: 'var(--panel)',
                    fontSize: 12.5,
                    fontWeight: 600,
                    color: 'var(--ink-2)',
                    cursor: files.length >= PD_MAX_ATTACH ? 'not-allowed' : 'pointer',
                    opacity: files.length >= PD_MAX_ATTACH ? 0.45 : 1,
                  }}
                >
                  <Icon name="plus" size={13} />
                  {slot}
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    capture="environment"
                    disabled={files.length >= PD_MAX_ATTACH}
                    onChange={e => {
                      addFile(slot, e.target.files && e.target.files[0]);
                      e.target.value = '';
                    }}
                    style={{ display: 'none' }}
                  />
                </label>
              ))}
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>
              Hasta {PD_MAX_ATTACH} archivos (fotos o PDF). Las fotos se comprimen solas.
            </div>
          </div>

          <label
            style={{
              display: 'flex',
              gap: 10,
              alignItems: 'flex-start',
              cursor: 'pointer',
              fontSize: 12.5,
              color: 'var(--ink-2)',
              lineHeight: 1.5,
            }}
          >
            <input
              type="checkbox"
              checked={consent}
              onChange={e => setConsent(e.target.checked)}
              style={{ marginTop: 2, width: 16, height: 16, accentColor: 'var(--orange)', flexShrink: 0 }}
            />
            <span>
              Presto consentimiento para que estos datos sean tratados por mi productor de seguros con la única
              finalidad de gestionar este siniestro (Ley 25.326 de Protección de Datos Personales).
            </span>
          </label>

          {error && <div style={{ fontSize: 12.5, color: 'var(--red-ink)' }}>{error}</div>}

          <div style={{ display: 'flex', gap: 10 }}>
            <Btn variant="ghost" onClick={() => setStep(2)} style={{ flex: 1, justifyContent: 'center' }}>
              Anterior
            </Btn>
            <Btn
              variant="primary"
              icon="check"
              onClick={submit}
              style={{
                flex: 2,
                justifyContent: 'center',
                opacity: consent && !sending ? 1 : 0.5,
                pointerEvents: consent && !sending ? 'auto' : 'none',
              }}
            >
              {sending ? uploadNote || 'Enviando…' : 'Enviar pre-denuncia'}
            </Btn>
          </div>
        </div>
      )}
    </>,
  );
}

Object.assign(window, { ScreenPreDenunciaPublica });
