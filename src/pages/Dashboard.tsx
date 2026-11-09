import { useMemo, useState } from 'react'
import { useStore } from '../store/AppStore'
import { addDays, capitalize, formatLongDate, nowMinutes, todayISO, toMinutes, formatTime } from '../lib/dates'
import { navigate } from '../lib/router'
import { AppointmentDetail, AppointmentRow, WhatsAppButton } from '../components/Appointments'
import { Avatar, EmptyState } from '../components/ui'
import { IconAlert, IconArrowRight, IconCalendar, IconCheck, IconClock, IconPlus, IconWhatsApp } from '../components/Icons'

export function Dashboard() {
  const { appointments, patientById, setStatus, notify } = useStore()
  const [open, setOpen] = useState<string | null>(null)
  const today = todayISO()
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches'

  const data = useMemo(() => {
    const todays = appointments.filter((a) => a.date === today)
    const active = todays.filter((a) => a.status !== 'cancelada')
    const pending = appointments.filter((a) => a.status === 'pendiente' && a.date >= today && a.date <= addDays(today, 7))
    const now = nowMinutes()
    const next = active.find((a) => toMinutes(a.start) + a.duration > now && a.status !== 'completada')
    const upcoming = appointments.filter((a) => a.date > today && a.status !== 'cancelada').slice(0, 8)
    const weekEnd = addDays(today, 6)
    const week = appointments.filter((a) => a.date >= today && a.date <= weekEnd && a.status !== 'cancelada')
    const confirmedRate = week.length ? Math.round((week.filter((a) => a.status === 'confirmada').length / week.length) * 100) : 0
    return {
      todays, active, pending, next, upcoming, week, confirmedRate,
      todayConfirmed: active.filter((a) => a.status === 'confirmada').length,
      todayDone: active.filter((a) => a.status === 'completada').length,
    }
  }, [appointments, today])

  const nextPatient = data.next && patientById(data.next.patientId)

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="eyebrow">{capitalize(formatLongDate(today))}</div>
          <h1>{greeting}, Dra. Mónica</h1>
        </div>
        <button className="btn btn-primary hide-mobile" onClick={() => navigate('/nueva')}><IconPlus size={18} /> Nueva cita</button>
      </div>

      <div className="kpis">
        <button className="kpi" onClick={() => navigate('/agenda')}>
          <div className="kpi-icon teal"><IconCalendar size={18} /></div>
          <div className="kpi-value">{data.active.length}</div>
          <div className="kpi-label">Citas hoy</div>
          <div className="kpi-foot">{data.todayDone} {data.todayDone === 1 ? "atendida" : "atendidas"}</div>
        </button>
        <button className="kpi" onClick={() => navigate('/confirmaciones')}>
          <div className="kpi-icon amber"><IconAlert size={18} /></div>
          <div className="kpi-value">{data.pending.length}</div>
          <div className="kpi-label">Por confirmar</div>
          <div className="kpi-foot">próximos 7 días</div>
        </button>
        <button className="kpi" onClick={() => navigate('/agenda')}>
          <div className="kpi-icon green"><IconCheck size={18} /></div>
          <div className="kpi-value">{data.todayConfirmed}</div>
          <div className="kpi-label">Confirmadas hoy</div>
          <div className="kpi-foot">de {data.active.length - data.todayDone} restantes</div>
        </button>
        <button className="kpi" onClick={() => navigate('/agenda', { view: 'week' })}>
          <div className="kpi-icon indigo"><IconClock size={18} /></div>
          <div className="kpi-value">{data.week.length}</div>
          <div className="kpi-label">Esta semana</div>
          <div className="kpi-foot"><span className="meter"><span style={{ width: `${data.confirmedRate}%` }} /></span>{data.confirmedRate}% conf.</div>
        </button>
      </div>

      {data.next && nextPatient && (
        <div className="next-card" onClick={() => setOpen(data.next!.id)} role="button">
          <div className="next-label">Siguiente paciente</div>
          <div className="next-body">
            <Avatar name={nextPatient.name} size={46} />
            <div className="next-info">
              <div className="next-name">{nextPatient.name}</div>
              <div className="next-meta">{formatTime(data.next.start)} · {data.next.treatment} · {data.next.duration} min</div>
            </div>
            <IconArrowRight size={20} />
          </div>
        </div>
      )}

      <div className="grid-2">
        <section className="card">
          <div className="card-head">
            <h2>Citas de hoy</h2>
            <a className="link" href="#/agenda">Ver agenda <IconArrowRight size={14} /></a>
          </div>
          {data.todays.length ? (
            <div className="list">{data.todays.map((a) => <AppointmentRow key={a.id} a={a} onOpen={setOpen} />)}</div>
          ) : (
            <EmptyState icon={<IconCalendar />} title="Sin citas hoy" text="Disfruta el día o agenda una nueva cita." />
          )}
        </section>

        <div className="col">
          <section className="card">
            <div className="card-head">
              <h2>Pendientes de confirmar</h2>
              <a className="link" href="#/confirmaciones">Ver todas <IconArrowRight size={14} /></a>
            </div>
            {data.pending.length ? (
              <div className="list">
                {data.pending.slice(0, 5).map((a) => {
                  const p = patientById(a.patientId)
                  return (
                    <div key={a.id} className="pending-row" onClick={() => setOpen(a.id)} role="button">
                      <Avatar name={p?.name ?? ''} size={36} />
                      <div className="pending-main">
                        <div className="appt-name">{p?.name}</div>
                        <div className="appt-meta">{a.date === today ? 'Hoy' : capitalize(formatLongDate(a.date))} · {formatTime(a.start)}</div>
                      </div>
                      <WhatsAppButton appointment={a} compact />
                      <button className="icon-btn ok" aria-label="Marcar confirmada"
                        onClick={(e) => { e.stopPropagation(); setStatus(a.id, 'confirmada'); notify('Cita confirmada') }}>
                        <IconCheck size={18} />
                      </button>
                    </div>
                  )
                })}
              </div>
            ) : (
              <EmptyState icon={<IconWhatsApp />} title="¡Todo confirmado!" text="No hay citas pendientes de confirmar." />
            )}
          </section>

          <section className="card">
            <div className="card-head">
              <h2>Próximas citas</h2>
            </div>
            <div className="list">{data.upcoming.map((a) => <AppointmentRow key={a.id} a={a} onOpen={setOpen} showDate actions={false} />)}</div>
          </section>
        </div>
      </div>

      <AppointmentDetail id={open} onClose={() => setOpen(null)} />
    </div>
  )
}
