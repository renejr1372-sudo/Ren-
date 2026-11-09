import type { MouseEvent } from 'react'
import type { Appointment } from '../types'
import { useStore } from '../store/AppStore'
import { capitalize, endTime, formatLongDate, formatTime, formatTimeShort, relativeDay } from '../lib/dates'
import { formatPhone } from '../lib/phone'
import { confirmationMessage, openWhatsApp, reminderMessage } from '../lib/whatsapp'
import { navigate } from '../lib/router'
import { Avatar, Sheet, StatusBadge } from './ui'
import { IconCalendar, IconCheck, IconClock, IconPhone, IconTooth, IconWhatsApp, IconX } from './Icons'

export function WhatsAppButton({ appointment, compact, variant = 'confirm', label }: {
  appointment: Appointment; compact?: boolean; variant?: 'confirm' | 'reminder'; label?: string
}) {
  const { patientById, doctorById, clinic, notify } = useStore()
  const p = patientById(appointment.patientId)
  if (!p) return null
  const onClick = (e: MouseEvent) => {
    e.stopPropagation()
    const msg = variant === 'confirm'
      ? confirmationMessage(p, appointment, doctorById(appointment.doctorId), clinic)
      : reminderMessage(p, appointment, clinic)
    openWhatsApp(p.phone, msg)
    notify(`Abriendo WhatsApp con ${p.name.split(' ')[0]}…`, 'info')
  }
  return compact ? (
    <button className="icon-btn wa" onClick={onClick} aria-label="Enviar WhatsApp" title="Enviar confirmación por WhatsApp">
      <IconWhatsApp size={18} />
    </button>
  ) : (
    <button className="btn btn-wa" onClick={onClick}>
      <IconWhatsApp size={18} /> {label ?? (variant === 'confirm' ? 'Confirmar por WhatsApp' : 'Enviar recordatorio')}
    </button>
  )
}

export function AppointmentRow({ a, onOpen, showDate, actions = true }: {
  a: Appointment; onOpen: (id: string) => void; showDate?: boolean; actions?: boolean
}) {
  const { patientById, doctorById } = useStore()
  const p = patientById(a.patientId)
  const d = doctorById(a.doctorId)
  return (
    <div className={`appt-row ${a.status === 'cancelada' ? 'is-cancelled' : ''}`} onClick={() => onOpen(a.id)} role="button" tabIndex={0}>
      <div className="appt-time">
        {showDate && <span className="appt-date">{relativeDay(a.date)}</span>}
        <span className="appt-start">{formatTimeShort(a.start)}</span>
        <span className="appt-dur">{a.duration} min</span>
      </div>
      <span className="appt-bar" style={{ background: d?.color }} />
      <div className="appt-main">
        <div className="appt-name">{p?.name}</div>
        <div className="appt-meta">{a.treatment} · {d?.name.replace(/^Dra?\. /, '')}</div>
      </div>
      <div className="appt-side">
        <StatusBadge status={a.status} />
        {actions && a.status === 'pendiente' && <WhatsAppButton appointment={a} compact />}
      </div>
    </div>
  )
}

export function AppointmentDetail({ id, onClose }: { id: string | null; onClose: () => void }) {
  const { appointments, patientById, doctorById, setStatus, notify } = useStore()
  const a = appointments.find((x) => x.id === id)
  const p = a && patientById(a.patientId)
  const d = a && doctorById(a.doctorId)

  return (
    <Sheet open={!!a} onClose={onClose} title="Detalle de la cita"
      footer={a && p && (
        <div className="stack-actions">
          {(a.status === 'pendiente' || a.status === 'confirmada') && (
            <WhatsAppButton appointment={a} variant={a.status === 'pendiente' ? 'confirm' : 'reminder'} />
          )}
          <div className="row-actions">
            {a.status === 'pendiente' && (
              <button className="btn btn-primary" onClick={() => { setStatus(a.id, 'confirmada'); notify('Cita marcada como confirmada') }}>
                <IconCheck size={18} /> Marcar confirmada
              </button>
            )}
            {a.status === 'confirmada' && (
              <button className="btn btn-primary" onClick={() => { setStatus(a.id, 'completada'); notify('Cita completada') }}>
                <IconCheck size={18} /> Marcar completada
              </button>
            )}
            {(a.status === 'pendiente' || a.status === 'confirmada') && (
              <button className="btn btn-ghost danger" onClick={() => { setStatus(a.id, 'cancelada'); notify('Cita cancelada', 'info') }}>
                <IconX size={18} /> Cancelar
              </button>
            )}
            {(a.status === 'cancelada' || a.status === 'completada') && (
              <button className="btn btn-secondary" onClick={() => { onClose(); navigate('/nueva', { patient: a.patientId }) }}>
                <IconCalendar size={18} /> Agendar nueva cita
              </button>
            )}
          </div>
        </div>
      )}
    >
      {a && p && (
        <div className="detail">
          <div className="detail-head">
            <Avatar name={p.name} size={52} />
            <div>
              <div className="detail-name">{p.name}</div>
              <a className="detail-phone" href={`tel:+${p.phone}`}><IconPhone size={14} /> {formatPhone(p.phone)}</a>
            </div>
          </div>
          <div className="detail-grid">
            <div className="detail-item"><IconCalendar size={18} /><div><span>Fecha</span>{capitalize(formatLongDate(a.date))}</div></div>
            <div className="detail-item"><IconClock size={18} /><div><span>Horario</span>{formatTime(a.start)} – {formatTime(endTime(a.start, a.duration))} · {a.duration} min</div></div>
            <div className="detail-item"><IconTooth size={18} /><div><span>Tratamiento</span>{a.treatment}</div></div>
            <div className="detail-item"><span className="doc-dot" style={{ background: d?.color }} /><div><span>Doctor(a)</span>{d?.name}</div></div>
          </div>
          <div className="detail-status"><span>Estado</span><StatusBadge status={a.status} /></div>
          {a.notes && <div className="detail-notes"><span>Notas</span>{a.notes}</div>}
        </div>
      )}
    </Sheet>
  )
}
