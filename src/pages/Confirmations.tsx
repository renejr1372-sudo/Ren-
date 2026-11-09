import { useMemo, useState } from 'react'
import { useStore } from '../store/AppStore'
import { addDays, capitalize, formatLongDate, formatTime, todayISO } from '../lib/dates'
import { formatPhone } from '../lib/phone'
import { AppointmentDetail, WhatsAppButton } from '../components/Appointments'
import { Avatar, EmptyState } from '../components/ui'
import { IconCheck, IconWhatsApp } from '../components/Icons'

const RANGES = [
  { key: '1', label: 'Hoy y mañana', days: 1 },
  { key: '7', label: '7 días', days: 7 },
  { key: '30', label: 'Todas', days: 60 },
]

export function Confirmations() {
  const { appointments, patientById, doctorById, setStatus, notify } = useStore()
  const [range, setRange] = useState('7')
  const [open, setOpen] = useState<string | null>(null)
  const today = todayISO()
  const days = RANGES.find((r) => r.key === range)!.days

  const groups = useMemo(() => {
    const list = appointments.filter((a) => a.status === 'pendiente' && a.date >= today && a.date <= addDays(today, days))
    const map = new Map<string, typeof list>()
    list.forEach((a) => map.set(a.date, [...(map.get(a.date) ?? []), a]))
    return [...map.entries()]
  }, [appointments, today, days])
  const total = groups.reduce((n, [, l]) => n + l.length, 0)

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="eyebrow">WhatsApp</div>
          <h1>Confirmaciones</h1>
          <p className="muted">{total} citas esperando confirmación. Envía el mensaje y márcala como confirmada cuando el paciente responda.</p>
        </div>
      </div>

      <div className="segmented">
        {RANGES.map((r) => (
          <button key={r.key} className={range === r.key ? 'active' : ''} onClick={() => setRange(r.key)}>{r.label}</button>
        ))}
      </div>

      {groups.length === 0 && (
        <div className="card"><EmptyState icon={<IconWhatsApp />} title="¡Todo confirmado!" text="No hay citas pendientes en este periodo." /></div>
      )}

      {groups.map(([date, list]) => (
        <section key={date} className="card">
          <div className="card-head">
            <h2>{date === today ? 'Hoy' : date === addDays(today, 1) ? 'Mañana' : capitalize(formatLongDate(date))}</h2>
            <span className="muted small">{list.length} pendientes</span>
          </div>
          <div className="list">
            {list.map((a) => {
              const p = patientById(a.patientId)!
              const d = doctorById(a.doctorId)
              return (
                <div key={a.id} className="confirm-row" onClick={() => setOpen(a.id)} role="button">
                  <Avatar name={p.name} size={40} />
                  <div className="confirm-main">
                    <div className="appt-name">{p.name}</div>
                    <div className="appt-meta">{formatTime(a.start)} · {a.treatment} · {d?.name}</div>
                    <div className="appt-meta">{formatPhone(p.phone)}</div>
                  </div>
                  <div className="confirm-actions">
                    <WhatsAppButton appointment={a} label="Enviar WhatsApp" />
                    <button className="btn btn-secondary" onClick={(e) => { e.stopPropagation(); setStatus(a.id, 'confirmada'); notify(`${p.name.split(' ')[0]} confirmó su cita`) }}>
                      <IconCheck size={18} /> Confirmada
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      ))}

      <AppointmentDetail id={open} onClose={() => setOpen(null)} />
    </div>
  )
}
