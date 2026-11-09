import { useMemo, useState, type FormEvent } from 'react'
import { useStore } from '../store/AppStore'
import { formatPhone, normalizePhone } from '../lib/phone'
import { formatTime, relativeDay, todayISO } from '../lib/dates'
import { genericMessage, openWhatsApp } from '../lib/whatsapp'
import { navigate } from '../lib/router'
import { Avatar, EmptyState, Sheet } from '../components/ui'
import { IconCalendar, IconPhone, IconPlus, IconSearch, IconUsers, IconWhatsApp } from '../components/Icons'

export function Patients() {
  const { patients, appointments, clinic, addPatient, notify } = useStore()
  const [q, setQ] = useState('')
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ name: '', phone: '', email: '' })
  const today = todayISO()

  const nextByPatient = useMemo(() => {
    const m = new Map<string, (typeof appointments)[number]>()
    appointments.forEach((a) => {
      if (a.date >= today && a.status !== 'cancelada' && a.status !== 'completada' && !m.has(a.patientId)) m.set(a.patientId, a)
    })
    return m
  }, [appointments, today])

  const visitsByPatient = useMemo(() => {
    const m = new Map<string, number>()
    appointments.forEach((a) => a.status === 'completada' && m.set(a.patientId, (m.get(a.patientId) ?? 0) + 1))
    return m
  }, [appointments])

  const list = useMemo(() => {
    const term = q.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    const digits = q.replace(/\D/g, '')
    return [...patients]
      .sort((a, b) => a.name.localeCompare(b.name))
      .filter((p) => !term
        || p.name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').includes(term)
        || (digits.length > 2 && p.phone.includes(digits)))
  }, [patients, q])

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!form.name.trim() || form.phone.replace(/\D/g, '').length < 10) return
    const p = addPatient({ name: form.name.trim(), phone: normalizePhone(form.phone), email: form.email || undefined })
    notify(`${p.name} agregado`)
    setForm({ name: '', phone: '', email: '' })
    setAdding(false)
  }

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="eyebrow">Directorio</div>
          <h1>Pacientes</h1>
          <p className="muted">{patients.length} pacientes registrados</p>
        </div>
        <button className="btn btn-primary" onClick={() => setAdding(true)}><IconPlus size={18} /> <span className="hide-xs">Nuevo paciente</span></button>
      </div>

      <label className="search">
        <IconSearch size={18} />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nombre o teléfono" type="search" inputMode="search" />
      </label>

      <div className="card patients">
        <div className="patients-head">
          <span>Paciente</span><span>Teléfono</span><span>Próxima cita</span><span>Visitas</span><span />
        </div>
        {list.length === 0 && <EmptyState icon={<IconUsers />} title="Sin resultados" text={`No encontramos pacientes para “${q}”.`} />}
        {list.map((p) => {
          const next = nextByPatient.get(p.id)
          return (
            <div key={p.id} className="patient-row">
              <div className="patient-id">
                <Avatar name={p.name} size={40} />
                <div>
                  <div className="appt-name">{p.name}</div>
                  <div className="appt-meta show-mobile">{formatPhone(p.phone)}</div>
                  <div className="appt-meta hide-mobile">{p.email}</div>
                </div>
              </div>
              <div className="hide-mobile mono">{formatPhone(p.phone)}</div>
              <div className="hide-mobile">
                {next ? <span className="next-pill">{relativeDay(next.date)} · {formatTime(next.start)}</span> : <span className="muted small">—</span>}
              </div>
              <div className="hide-mobile muted">{visitsByPatient.get(p.id) ?? 0}</div>
              <div className="patient-actions">
                <a className="icon-btn" href={`tel:+${p.phone}`} aria-label="Llamar"><IconPhone size={18} /></a>
                <button className="icon-btn wa" aria-label="WhatsApp" onClick={() => openWhatsApp(p.phone, genericMessage(p, clinic))}><IconWhatsApp size={18} /></button>
                <button className="icon-btn" aria-label="Agendar" onClick={() => navigate('/nueva', { patient: p.id })}><IconCalendar size={18} /></button>
              </div>
            </div>
          )
        })}
      </div>

      <Sheet open={adding} onClose={() => setAdding(false)} title="Nuevo paciente"
        footer={<button className="btn btn-primary btn-block" form="new-patient" type="submit">Guardar paciente</button>}>
        <form id="new-patient" className="form" onSubmit={submit}>
          <label className="field"><span>Nombre completo</span>
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ej. Laura Méndez" autoComplete="name" />
          </label>
          <label className="field"><span>Teléfono (WhatsApp)</span>
            <input required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="55 1234 5678" inputMode="tel" autoComplete="tel" />
            <small>10 dígitos. Se usará para enviar confirmaciones.</small>
          </label>
          <label className="field"><span>Correo (opcional)</span>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="laura@correo.com" autoComplete="email" />
          </label>
        </form>
      </Sheet>
    </div>
  )
}
