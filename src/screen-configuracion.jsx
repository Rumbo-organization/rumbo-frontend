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

/* 2FA TOTP real (Slice 3): activar (password → secret/URI + backup codes →
   verificar primer código) y desactivar (password). Better Auth twoFactor. */
function TwoFactorDrawer({ open, onClose, enabled, onChanged }) {
  const [step, setStep] = useState('password'); // password | setup
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [setup, setSetup] = useState(null); // { totpURI, backupCodes }
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  useEffect(() => {
    if (open) { setStep('password'); setPassword(''); setCode(''); setSetup(null); setError(null); }
  }, [open]);

  const start = () => {
    if (!password || busy) return;
    setBusy(true); setError(null);
    const p = enabled ? rumboAuth.twoFactorDisable(password) : rumboAuth.twoFactorEnable(password);
    p.then((d) => {
      if (enabled) {
        window.rumboUI?.toast?.('Verificación en dos pasos desactivada');
        onChanged(false); onClose();
      } else {
        setSetup(d); setStep('setup');
      }
    }).catch(e => setError(e.message || 'Contraseña incorrecta.')).finally(() => setBusy(false));
  };

  const confirm = () => {
    if (!code.trim() || busy) return;
    setBusy(true); setError(null);
    rumboAuth.twoFactorVerifyTotp(code.trim(), true)
      .then(() => { window.rumboUI?.toast?.('Verificación en dos pasos activada'); onChanged(true); onClose(); })
      .catch(() => setError('Código inválido. Probá de nuevo.'))
      .finally(() => setBusy(false));
  };

  const secret = setup?.totpURI ? (new URLSearchParams(setup.totpURI.split('?')[1] || '').get('secret') || '') : '';

  return (
    <Drawer open={open} onClose={onClose} eyebrow="Seguridad" width={500}
      title={enabled ? 'Desactivar verificación en dos pasos' : 'Activar verificación en dos pasos'}
      footer={step === 'password' ? (
        <>
          <Btn variant="ghost" onClick={onClose}>Cancelar</Btn>
          <Btn variant="primary" icon="check" onClick={start} style={{ opacity: password && !busy ? 1 : 0.5, pointerEvents: password && !busy ? 'auto' : 'none' }}>
            {enabled ? 'Desactivar' : 'Continuar'}
          </Btn>
        </>
      ) : (
        <>
          <Btn variant="ghost" onClick={onClose}>Cancelar</Btn>
          <Btn variant="primary" icon="check" onClick={confirm} style={{ opacity: code.trim() && !busy ? 1 : 0.5, pointerEvents: code.trim() && !busy ? 'auto' : 'none' }}>Verificar y activar</Btn>
        </>
      )}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {step === 'password' && (
          <>
            <div style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.5 }}>
              {enabled
                ? 'Confirmá tu contraseña para desactivar el segundo factor.'
                : 'Confirmá tu contraseña para generar el secreto TOTP de tu app de autenticación (Google Authenticator, 1Password, Aegis…).'}
            </div>
            <Field label="Contraseña" required>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} style={inputStyle} autoFocus />
            </Field>
          </>
        )}
        {step === 'setup' && setup && (
          <>
            <div style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.5 }}>
              Cargá esta clave en tu app de autenticación (o abrí el link desde el teléfono) y después ingresá el código de 6 dígitos.
            </div>
            <Field label="Clave secreta (carga manual)">
              <div className="font-mono" style={{ ...inputStyle, userSelect: 'all', wordBreak: 'break-all', fontSize: 13 }}>{secret || '—'}</div>
            </Field>
            {setup.totpURI && (
              <a href={setup.totpURI} style={{ fontSize: 12.5, color: 'var(--orange-ink)', fontWeight: 600 }}>Abrir en la app de autenticación</a>
            )}
            {Array.isArray(setup.backupCodes) && setup.backupCodes.length > 0 && (
              <Field label="Códigos de respaldo · guardalos en un lugar seguro">
                <div className="font-mono" style={{ ...inputStyle, userSelect: 'all', fontSize: 12, lineHeight: 1.8 }}>
                  {setup.backupCodes.join('  ')}
                </div>
              </Field>
            )}
            <Field label="Código de 6 dígitos" required>
              <input value={code} onChange={e => setCode(e.target.value)} inputMode="numeric" placeholder="123456"
                className="font-mono" style={{ ...inputStyle, letterSpacing: '0.15em' }} />
            </Field>
          </>
        )}
        {error && <div style={{ fontSize: 12.5, color: 'var(--red-ink)' }}>{error}</div>}
      </div>
    </Drawer>
  );
}

/* Plantillas de mensajes propias del PAS (Slice 6): CRUD real contra
   /message-templates. Las 4 built-in (saludo/vencimiento/cobranza/siniestro)
   viven en el diálogo de WhatsApp y no se editan acá. */
function TemplatesEditor() {
  const [rows, setRows] = useState([]);
  const [editing, setEditing] = useState(null); // null | 'new' | {id,name,body}
  const [f, setF] = useState({ name: '', body: '' });
  const [busy, setBusy] = useState(false);
  const [reload, setReload] = useState(0);
  useEffect(() => {
    let alive = true;
    window.rumboApi.messageTemplates().then(d => { if (alive) setRows(d.data || []); }).catch(() => {});
    return () => { alive = false; };
  }, [reload]);

  const startNew = () => { setEditing('new'); setF({ name: '', body: '' }); };
  const startEdit = (t) => { setEditing(t); setF({ name: t.name, body: t.body }); };
  const save = () => {
    if (busy || !f.name.trim() || !f.body.trim()) return;
    setBusy(true);
    const p = editing === 'new'
      ? window.rumboApi.createMessageTemplate(f)
      : window.rumboApi.updateMessageTemplate(editing.id, f);
    p.then(() => { window.rumboUI?.toast?.('Plantilla guardada'); setEditing(null); setReload(r => r + 1); })
      .catch(e => window.rumboUI?.toast?.(e.message)).finally(() => setBusy(false));
  };
  const del = (t) => {
    window.rumboApi.deleteMessageTemplate(t.id)
      .then(() => { window.rumboUI?.toast?.('Plantilla eliminada'); setReload(r => r + 1); })
      .catch(e => window.rumboUI?.toast?.(e.message));
  };

  return (
    <>
      <SectionHead label="Plantillas de mensajes" sub="Tus textos propios para WhatsApp; se suman a los 4 prearmados."
        action={<Btn size="sm" variant="soft" icon={editing ? 'x' : 'plus'} onClick={() => (editing ? setEditing(null) : startNew())}>{editing ? 'Cerrar' : 'Nueva'}</Btn>} />
      {editing && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '4px 0 14px', borderBottom: '1px solid var(--hair-2)', marginBottom: 10 }}>
          <TextInput value={f.name} onChange={v => setF(s => ({ ...s, name: v }))} placeholder="Nombre (ej: Cobranza amable)" />
          <textarea value={f.body} onChange={e => setF(s => ({ ...s, body: e.target.value }))} rows={4} maxLength={2000}
            style={{ ...inputStyle, resize: 'vertical', minHeight: 96, lineHeight: 1.5 }} placeholder="Hola {nombre}, …" />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>Variable disponible: <code className="font-mono" style={{ fontSize: 11 }}>{'{nombre}'}</code> (se reemplaza al enviar)</span>
            <Btn size="sm" variant="primary" icon="check" onClick={save} style={{ opacity: f.name.trim() && f.body.trim() && !busy ? 1 : 0.5 }}>Guardar</Btn>
          </div>
        </div>
      )}
      {rows.length === 0 && !editing ? (
        <div style={{ fontSize: 13, color: 'var(--ink-3)' }}>Todavía no creaste plantillas propias.</div>
      ) : rows.map((t, i) => (
        <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: i === rows.length - 1 ? 'none' : '1px solid var(--hair-2)' }}>
          <div style={{ flex: 1, minWidth: 0, cursor: 'pointer' }} onClick={() => startEdit(t)}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{t.name}</div>
            <div style={{ fontSize: 11.5, color: 'var(--ink-3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.body}</div>
          </div>
          <Btn size="sm" variant="ghost" onClick={() => startEdit(t)}>Editar</Btn>
          <button title="Eliminar" onClick={() => del(t)} style={{ width: 26, height: 26, borderRadius: 7, border: '1px solid var(--hair)', background: 'var(--panel-2)', color: 'var(--ink-3)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <Icon name="x" size={12} />
          </button>
        </div>
      ))}
    </>
  );
}

function ScreenConfiguracion({ go, dark, setDark }) {
  const isMobile = useIsMobile();
  // Estado real del 2FA: viene del user de la sesión (Better Auth).
  const [twofa, setTwofa] = useState(() => Boolean(window.RUMBO_USER?.twoFactorEnabled));
  const [twofaOpen, setTwofaOpen] = useState(false);
  const [alerts, setAlerts] = useState(true);
  const [wsp, setWsp] = useState(true);
  const [tpl, setTpl] = useState('renovacion');
  const [confirmDel, setConfirmDel] = useState(false);
  const [delText, setDelText] = useState('');

  // Datos del PAS (perfil fiscal de la org) — editable solo por el owner.
  const FISCAL = [['responsable_inscripto', 'Responsable Inscripto'], ['monotributo', 'Monotributo'], ['exento', 'Exento'], ['otro', 'Otro']];
  const org = window.RUMBO_DATA?.ORG ?? {};
  const [pas, setPas] = useState({ cuit: org.cuit ?? '', matricula: org.matricula ?? '', fiscal: org.fiscalCondition ?? 'responsable_inscripto' });
  const [pasBusy, setPasBusy] = useState(false);
  const savePas = () => {
    if (pasBusy) return;
    setPasBusy(true);
    window.rumboApi.updateOrgProfile({ cuit: pas.cuit, ssnMatricula: pas.matricula, fiscalCondition: pas.fiscal })
      .then(() => { window.rumboUI?.toast?.('Datos del PAS guardados'); if (window.rumboRefresh) window.rumboRefresh(); })
      .catch(e => window.rumboUI?.toast?.(e.message))
      .finally(() => setPasBusy(false));
  };

  // Borrado de cuenta (Ley 25.326): irreversible; el backend exige owner.
  const [deleting, setDeleting] = useState(false);
  const doDeleteAccount = () => {
    if (deleting || delText !== 'ELIMINAR') return;
    setDeleting(true);
    window.rumboApi.deleteAccount()
      .then(() => rumboAuth.signOut().catch(() => {}))
      .then(() => { window.location.href = '/'; })
      .catch(e => { window.rumboUI?.toast?.(e.message); setDeleting(false); });
  };

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

        <TwoFactorDrawer open={twofaOpen} onClose={() => setTwofaOpen(false)} enabled={twofa}
          onChanged={(on) => { setTwofa(on); if (window.RUMBO_USER) window.RUMBO_USER.twoFactorEnabled = on; }} />

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

          {/* datos del PAS — sección del organizador (paridad organizadorProcedure) */}
          {window.RUMBO_DATA?.ME?.role === 'owner' && (
          <Panel>
            <SectionHead label="Datos del PAS" sub="Aparecen en tus comprobantes y comunicaciones cuando corresponde." />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <Field label="Razón social"><div style={{ ...inputStyle, background: 'var(--panel-2)', color: 'var(--ink-2)' }}>{org.name ?? '—'}</div></Field>
              <Field label="CUIT"><TextInput value={pas.cuit} onChange={v => setPas(s => ({ ...s, cuit: v.replace(/[^0-9]/g, '') }))} mono placeholder="11 dígitos" /></Field>
              <Field label="Matrícula SSN"><TextInput value={pas.matricula} onChange={v => setPas(s => ({ ...s, matricula: v }))} mono /></Field>
              <Field label="Condición fiscal">
                <select value={pas.fiscal} onChange={e => setPas(s => ({ ...s, fiscal: e.target.value }))} style={{ ...inputStyle, appearance: 'none', cursor: 'pointer' }}>
                  {FISCAL.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </Field>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
              <Btn variant="primary" size="sm" icon="check" onClick={savePas} style={{ opacity: pasBusy ? 0.5 : 1 }}>Guardar datos</Btn>
            </div>
          </Panel>
          )}

          {/* seguridad y preferencias */}
          <Panel>
            <SectionHead label="Seguridad y preferencias" />
            <SettingRow label="Verificación en dos pasos" sub={twofa ? 'Activada. Se pide un código TOTP al ingresar.' : 'Protegé el acceso con un código TOTP.'}
              control={<Toggle on={twofa} onClick={() => setTwofaOpen(true)} />} />
            <SettingRow label="Alertas de vencimientos y siniestros" sub="Avisos cuando una póliza o un caso pierde el rumbo." control={<Toggle on={alerts} onClick={() => setAlerts(!alerts)} />} />
            <SettingRow label="Plantillas de WhatsApp" sub="Mensajes prearmados para renovaciones y cobranzas." control={<Toggle on={wsp} onClick={() => setWsp(!wsp)} />} />
            <SettingRow label="Tema oscuro" sub="Cambia la apariencia de toda la app." control={<Toggle on={dark} onClick={() => setDark(!dark)} />} last />
          </Panel>

          {/* plantillas de mensajes */}
          <Panel>
            <TemplatesEditor />
          </Panel>

          {/* export */}
          <Panel>
            <SectionHead label="Exportá tus datos" sub="Tu información es tuya. Descargala cuando quieras." />
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <Btn variant="soft" icon="fileJson" onClick={() => window.open(window.rumboApi.accountExportUrl(), '_blank')}>Descargar todo (JSON)</Btn>
              <Btn variant="soft" icon="download" onClick={() => window.open(window.rumboApi.contactsExportUrl(), '_blank')}>Asegurados (CSV)</Btn>
              <Btn variant="soft" icon="download" onClick={() => window.open(window.rumboApi.policiesExportUrl(), '_blank')}>Pólizas (CSV)</Btn>
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
                    <Btn size="md" variant="solid" icon="alert" onClick={doDeleteAccount} style={{ background: 'var(--red)', opacity: delText === 'ELIMINAR' ? 1 : 0.45, pointerEvents: delText === 'ELIMINAR' ? 'auto' : 'none' }}>Eliminar definitivamente</Btn>
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
