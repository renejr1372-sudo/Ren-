import { useMemo, useState, type FormEvent } from 'react'
import type { Appointment } from '../types'
import { useStore } from '../store/AppStore'
import { treatments, isOverlapping } from '../data/mock'
import { addDays, capitalize, dayNum, dayShort, endTime, formatLongDate, formatTime, fromMinutes, nowMinutes, parseISODate, todayISO } from '../lib/dates'
import { formatPhone } from '../lib/phone'
import { confirmationMessage, whatsappUrl } from '../lib/whatsapp'
import { navigate } from '../lib/router'
import { Avatar } from '../components/ui'
import { IconAlert, IconCalendar, IconCheck, IconSearch, IconWhatsApp } from '../components/Icons'

const DURATIONS = [15, 30, 45, 60, 90, 120]

export function NewAppointment({ params }: { params: URLSearchParams }) {
  const { patients, doctors, appointments, addAppointment, patientById, doctorById, clinic, setStatus, notify } = useStore()
  const today = todayISO()

  const [patientId, setPatientId] = useState(params.get('patient') ?? '')
  const [search, setSearch] = useState('')
  const [doctorId, setDoctorId] = useState(params.get('doctor') ?? doctors[0].id)
  const [date, setDate] = useState(params.get('date') ?? today)
  const [start, setStart] = useState(params.get('start') ?? '')
  const [duration, setDuration] = useState(30)
  const [treatment, setTreatment] = useState(treatments[1].name)
  const [notes, setNotes] = useState('')
  const [created, setCreated] = useState<Appointment | null>(null)
  const [error, setError] = useState('')

  const dow = parseISODate(date).getDay()
  const close = dow === 6 ? 14 * 60 : 19 * 60

  const slots = useMemo(() => {
    if (dow === 0) return []
    const out: { time: string; busy: boolean; past: boolean }[] = []
    const dayAppts = appointments.filter((a) => a.date === date && a.doctorId === doctorId && a.status !== 'cancelada')
    for (let m = 9 * 60; m + duration <= close; m += 30) {
      const time = fromMinutes(m)
      out.push({
        time,
        busy: dayAppts.some((a) => isOverlapping(a, { date, start: time, duration })),
        past: date === today && m < nowMinutes(),
      })
    }
    return out
  }, [appointments, date, doctorId, duration, close, dow, today])

  const conflict = start && appointments.find((a) => a.doctorId === doctorId && a.status !== 'cancelada' && isOverlapping(a, { date, start, duration }))

  const dates = Array.from({ length: 21 }, (_, i) => addDays(today, i)).filter((d) => parseISODate(d).getDay() !== 0)

  const filteredPatients = useMemo(() => {
    const t = search.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    return [...patients].sort((a, b) => a.name.localeCompare(b.name))
      .filter((p) => !t || p.name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').includes(t))
  }, [patients, search])

  const patient = patientById(patientId)

  const pickTreatment = (name: string) => {
    setTreatment(name)
    const t = treatments.find((x) => x.name === name)
    if (t) setDuration(t.duration)
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!patientId) return setError('Selecciona un paciente.')
    if (!start) return setError('Selecciona una hora.')
    if (conflict) return setError('Ese horario se traslapa con otra cita del doctor.')
    setError('')
    const appt = addAppointment({ patientId, doctorId, date, start, duration, treatment, status: 'pendiente', notes: notes || undefined })
    setCreated(appt)
    notify('Cita agendada')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (created) {
    const p = patientById(created.patientId)!
    const d = doctorById(created.doctorId)
    return (
      <div className="page narrow">
        <div className="card success">
          <div className="success-icon"><IconCheck size={28} /></div>
          <h1>¡Cita agendada!</h1>
          <p className="muted">{p.name} · {capitalize(formatLongDate(created.date))} · {formatTime(created.start)}</p>
          <div className="summary">
            <div><span>Tratamiento</span>{created.treatment}</div>
            <div><span>Duración</span>{created.duration} min</div>
            <div><span>Doctor(a)</span>{d?.name}</div>
            <div><span>Teléfono</span>{formatPhone(p.phone)}</div>
          </div>
          <a className="btn btn-wa btn-block btn-lg" href={whatsappUrl(p.phone, confirmationMessage(p, created, d, clinic))} target="_blank" rel="noopener noreferrer">
            <IconWhatsApp size={20} /> Confirmar por WhatsApp
          </a>
          <div className="row-actions">
            <button className="btn btn-secondary" onClick={() => { setStatus(created.id, 'confirmada'); notify('Marcada como confirmada'); navigate('/agenda', { date: created.date }) }}>
              <IconCheck size={18} /> Ya confirmó
            </button>
            <button className="btn btn-secondary" onClick={() => navigate('/agenda', { date: created.date })}>
              <IconCalendar size={18} /> Ver en agenda
            </button>
          </div>
          <button className="link center" onClick={() => { setCreated(null); setStart(''); setPatientId(''); setNotes('') }}>Agendar otra cita</button>
        </div>
      </div>
    )
  }

  return (
    <div className="page narrow">
      <div className="page-head">
        <div>
          <div className="eyebrow">Agenda</div>
          <h1>Nueva cita</h1>
        </div>
      </div>

      <form className="form" onSubmit={submit}>
        <section className="card form-section">
          <h2><span className="step">1</span> Paciente</h2>
          {patient ? (
            <div className="selected-patient">
              <Avatar name={patient.name} size={42} />
              <div className="grow">
                <div className="appt-name">{patient.name}</div>
                <div className="appt-meta">{formatPhone(patient.phone)}</div>
              </div>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setPatientId('')}>Cambiar</button>
            </div>
          ) : (
            <>
              <label className="search">
                <IconSearch size={18} />
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar paciente" type="search" />
              </label>
              <div className="patient-picker">
                {filteredPatients.map((p) => (
                  <button type="button" key={p.id} className="picker-row" onClick={() => { setPatientId(p.id); setSearch('') }}>
                    <Avatar name={p.name} size={34} />
                    <span className="grow">{p.name}</span>
                    <span className="muted small">{formatPhone(p.phone)}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </section>

        <section className="card form-section">
          <h2><span className="step">2</span> Tratamiento y doctor</h2>
          <div className="two">
            <label className="field"><span>Tratamiento</span>
              <select value={treatment} onChange={(e) => pickTreatment(e.target.value)}>
                {treatments.map((t) => <option key={t.name}>{t.name}</option>)}
              </select>
            </label>
            <label className="field"><span>Doctor(a)</span>
              <select value={doctorId} onChange={(e) => { setDoctorId(e.target.value); setStart('') }}>
                {doctors.map((d) => <option key={d.id} value={d.id}>{d.name} — {d.specialty}</option>)}
              </select>
            </label>
          </div>
          <div className="field"><span>Duración</span>
            <div className="chips">
              {DURATIONS.map((m) => (
                <button type="button" key={m} className={`chip ${duration === m ? 'active' : ''}`} onClick={() => setDuration(m)}>
                  {m < 60 ? `${m} min` : `${m / 60} h${m % 60 ? ' 30' : ''}`}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="card form-section">
          <h2><span className="step">3</span> Fecha y hora</h2>
          <div className="date-scroller">
            {dates.map((d) => (
              <button type="button" key={d} className={`day-pill ${d === date ? 'active' : ''} ${d === today ? 'is-today' : ''}`} onClick={() => { setDate(d); setStart('') }}>
                <span>{dayShort(d)}</span><b>{dayNum(d)}</b>
              </button>
            ))}
          </div>
          <label className="field"><span>U otra fecha</span>
            <input type="date" value={date} min={today} onChange={(e) => { setDate(e.target.value); setStart('') }} />
          </label>
          <div className="field"><span>Horarios disponibles · {capitalize(formatLongDate(date))}</span>
            {dow === 0 ? <p className="muted small">La clínica no abre los domingos.</p> : (
              <div className="slots">
                {slots.map((s) => (
                  <button type="button" key={s.time} disabled={s.busy || s.past}
                    className={`slot ${start === s.time ? 'active' : ''} ${s.busy ? 'busy' : ''}`} onClick={() => setStart(s.time)}>
                    {formatTime(s.time)}
                  </button>
                ))}
              </div>
            )}
          </div>
          {start && !slots.some((s) => s.time === start) && (
            <p className="muted small">Hora seleccionada: {formatTime(start)} – {formatTime(endTime(start, duration))}</p>
          )}
          {conflict && <div className="alert"><IconAlert size={16} /> Se traslapa con la cita de {patientById(conflict.patientId)?.name} a las {formatTime(conflict.start)}.</div>}
        </section>

        <section className="card form-section">
          <h2><span className="step">4</span> Notas <span className="muted small">(opcional)</span></h2>
          <label className="field">
            <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Ej. Paciente prefiere anestesia tópica" />
          </label>
        </section>

        {error && <div className="alert">{error}</div>}

        <div className="form-submit">
          <div className="submit-summary">
            {patient && start ? (
              <><b>{patient.name.split(' ')[0]}</b> · {dayShort(date)} {dayNum(date)} · {formatTime(start)} · {duration} min</>
            ) : <span className="muted">Completa paciente y hora</span>}
          </div>
          <button type="submit" className="btn btn-primary btn-lg" disabled={!patient || !start || !!conflict}>
            <IconCheck size={18} /> Agendar cita
          </button>
        </div>
      </form>
    </div>
  )
}

