/* ============================================================
   RUMBO — Configuración (cuenta, PAS, seguridad, datos)
   ============================================================ */
function SettingRow({ label, sub, control, last }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '15px 0', borderBottom: last ? 'none' : '1px solid var(--hair-2)' }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ink)' }}>{label}</div>
        {sub && <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2 }}>{sub}</div>}
      </div>
      {control}
    </div>
  );
}

function Toggle({ on, onClick }) {
  return (
    <button onClick={onClick} style={{
      width: 42, height: 24, borderRadius: 99, padding: 2, flexShrink: 0,
      background: on ? 'var(--emerald)' : 'var(--hair)', transition: 'background .18s', display: 'flex',
      justifyContent: on ? 'flex-end' : 'flex-start',
    }}>
      <span style={{ width: 20, height: 20, borderRadius: 99, background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,.2)', transition: 'all .18s' }} />
    </button>
  );
}

function ScreenConfiguracion({ go, dark, setDark }) {
  const isMobile = useIsMobile();
  const [twofa, setTwofa] = useState(true);
  const [alerts, setAlerts] = useState(true);
  const [wsp, setWsp] = useState(true);
  const [tpl, setTpl] = useState('renovacion');
  const [confirmDel, setConfirmDel] = useState(false);
  const [delText, setDelText] = useState('');

  const TEMPLATES = {
    renovacion: { label: 'Renovación', body: 'Hola {cliente}, te escribo de Méndez Seguros 👋 Tu póliza de {ramo} ({poliza}) vence el {vencimiento}. ¿Avanzamos con la renovación? Cualquier duda quedo a disposición.' },
    cobranza: { label: 'Cuota vencida', body: 'Hola {cliente}, te recuerdo que la cuota {cuota} de tu póliza {poliza} venció el {fecha} por {monto}. Podés abonarla por transferencia o link de pago. ¡Gracias!' },
    siniestro: { label: 'Siniestro', body: 'Hola {cliente}, recibimos tu denuncia de siniestro {siniestro}. Ya iniciamos la gestión con {aseguradora} y te mantengo al tanto de cada novedad.' },
    bienvenida: { label: 'Bienvenida', body: '¡Bienvenido/a, {cliente}! Soy tu productor/a de seguros. Ante cualquier consulta sobre tus coberturas, escribime directamente por acá.' },
  };

  return (
    <div className="scroll rise" style={{ overflowY: 'auto', height: '100%', padding: isMobile ? '18px 16px 40px' : '30px 34px 60px' }}>
      <div style={{ maxWidth: 760, margin: '0 auto' }}>
        <PageHead eyebrow="Sistema" tick={5} title="Configuración"
          sub="Los ajustes de tu cuenta, tu organización y tus datos." />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* cuenta */}
          <Panel>
            <SectionHead label="Tu cuenta" />
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '4px 0 16px', borderBottom: '1px solid var(--hair-2)' }}>
              <Avatar initials={rumboIdentity().initials} size={48} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 600 }}>{rumboIdentity().name}</div>
                <div style={{ fontSize: 12.5, color: 'var(--ink-3)', overflow: 'hidden', textOverflow: 'ellipsis' }}>{rumboIdentity().email || '—'}</div>
              </div>
              <Pill tone="orange">Beta privada</Pill>
            </div>
            <SettingRow label="Plan" sub="Gratis durante la beta, sin permanencia." control={<Btn size="sm" variant="ghost">Ver planes</Btn>} last />
          </Panel>

          {/* datos del PAS */}
          <Panel>
            <SectionHead label="Datos del PAS" sub="Aparecen en tus comprobantes y comunicaciones cuando corresponde." />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <Field label="Razón social"><TextInput value={window.RUMBO_DATA?.ORG?.name ?? ''} onChange={() => {}} /></Field>
              <Field label="CUIT"><TextInput value={window.RUMBO_DATA?.ORG?.cuit ?? ''} onChange={() => {}} mono /></Field>
              <Field label="Matrícula SSN"><TextInput value={window.RUMBO_DATA?.ORG?.matricula ?? ''} onChange={() => {}} mono /></Field>
              <Field label="Condición fiscal"><SelectInput value="Responsable Inscripto" onChange={() => {}} options={['Responsable Inscripto', 'Monotributo', 'Exento']} /></Field>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}><Btn variant="primary" size="sm" icon="check">Guardar datos</Btn></div>
          </Panel>

          {/* seguridad y preferencias */}
          <Panel>
            <SectionHead label="Seguridad y preferencias" />
            <SettingRow label="Verificación en dos pasos" sub="Protegé el acceso con un código TOTP." control={<Toggle on={twofa} onClick={() => setTwofa(!twofa)} />} />
            <SettingRow label="Alertas de vencimientos y siniestros" sub="Avisos cuando una póliza o un caso pierde el rumbo." control={<Toggle on={alerts} onClick={() => setAlerts(!alerts)} />} />
            <SettingRow label="Plantillas de WhatsApp" sub="Mensajes prearmados para renovaciones y cobranzas." control={<Toggle on={wsp} onClick={() => setWsp(!wsp)} />} />
            <SettingRow label="Tema oscuro" sub="Cambia la apariencia de toda la app." control={<Toggle on={dark} onClick={() => setDark(!dark)} />} last />
          </Panel>

          {/* plantillas de mensajes */}
          <Panel>
            <SectionHead label="Plantillas de mensajes" sub="Editá los textos que Rumbo usa al escribirle a tus clientes por WhatsApp."
              action={<Pill tone="emerald" dot>WhatsApp conectado</Pill>} />
            <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginBottom: 16 }}>
              {Object.entries(TEMPLATES).map(([k, v]) => {
                const active = tpl === k;
                return (
                  <button key={k} onClick={() => setTpl(k)} style={{
                    padding: '7px 13px', borderRadius: 99, fontSize: 12.5, fontWeight: 600,
                    border: `1px solid ${active ? 'var(--orange)' : 'var(--hair)'}`,
                    background: active ? 'var(--orange-soft)' : 'var(--panel)',
                    color: active ? 'var(--orange-ink)' : 'var(--ink-2)', transition: 'all .14s',
                  }}>{v.label}</button>
                );
              })}
              <button style={{ padding: '7px 11px', borderRadius: 99, fontSize: 12.5, fontWeight: 600, border: '1px dashed var(--hair)', color: 'var(--ink-3)', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                <Icon name="plus" size={13} stroke={2.2} /> Nueva
              </button>
            </div>
            <textarea value={TEMPLATES[tpl].body} onChange={() => {}} rows={4}
              style={{ ...inputStyle, resize: 'vertical', minHeight: 96, lineHeight: 1.5 }} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, gap: 12, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>Variables:</span>
                {['{cliente}', '{poliza}', '{ramo}', '{vencimiento}', '{monto}'].map(v => (
                  <code key={v} className="font-mono" style={{ fontSize: 11, padding: '2px 7px', borderRadius: 5, background: 'var(--panel-2)', border: '1px solid var(--hair)', color: 'var(--ink-2)', cursor: 'pointer' }}>{v}</code>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <Btn size="sm" variant="soft" icon="whatsapp">Vista previa</Btn>
                <Btn size="sm" variant="primary" icon="check">Guardar plantilla</Btn>
              </div>
            </div>
          </Panel>

          {/* export */}
          <Panel>
            <SectionHead label="Exportá tus datos" sub="Tu información es tuya. Descargala cuando quieras." />
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <Btn variant="soft" icon="fileJson">Descargar todo (JSON)</Btn>
              <Btn variant="soft" icon="download">Contactos (CSV)</Btn>
              <Btn variant="soft" icon="download">Pólizas (CSV)</Btn>
            </div>
          </Panel>

          {/* zona de peligro */}
          <div style={{ border: '1px solid var(--red)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', background: 'var(--red-soft)', borderBottom: '1px solid var(--red)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                <Icon name="alert" size={17} style={{ color: 'var(--red-ink)' }} />
                <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--red-ink)' }}>Zona de peligro</span>
              </div>
            </div>
            <div style={{ padding: 18, background: 'var(--panel)' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--red-ink)' }}>Eliminar cuenta</div>
                  <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2 }}>Se borran de forma permanente tus pólizas, contactos y cotizaciones. Esta acción no se puede deshacer.</div>
                </div>
                {!confirmDel && <Btn size="sm" variant="ghost" icon="x" style={{ color: 'var(--red-ink)', borderColor: 'var(--red)' }} onClick={() => setConfirmDel(true)}>Eliminar cuenta</Btn>}
              </div>
              {confirmDel && (
                <div style={{ marginTop: 14, padding: 16, borderRadius: 10, background: 'var(--red-soft)', border: '1px solid var(--red)' }}>
                  <div style={{ fontSize: 12.5, color: 'var(--ink)', marginBottom: 10 }}>Para confirmar, escribí <strong className="font-mono">ELIMINAR</strong> abajo.</div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <input value={delText} onChange={e => setDelText(e.target.value)} placeholder="ELIMINAR" className="font-mono"
                      style={{ ...inputStyle, flex: 1, borderColor: 'var(--red)' }} />
                    <Btn size="md" variant="ghost" onClick={() => { setConfirmDel(false); setDelText(''); }}>Cancelar</Btn>
                    <Btn size="md" variant="solid" icon="alert" style={{ background: 'var(--red)', opacity: delText === 'ELIMINAR' ? 1 : 0.45, pointerEvents: delText === 'ELIMINAR' ? 'auto' : 'none' }}>Eliminar definitivamente</Btn>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* footer / session */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 4px 0' }}>
            <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>Rumbo · beta privada · v0.4</span>
            <Btn variant="ghost" icon="logout" style={{ color: 'var(--ink-2)', borderColor: 'var(--hair)' }}
              onClick={() => window.rumboAuth?.signOut().finally(() => window.location.reload())}>Cerrar sesión</Btn>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { ScreenConfiguracion });
