import { useEffect, useMemo, useRef, useState, type MouseEvent } from 'react'
import type { Appointment } from '../types'
import { useStore } from '../store/AppStore'
import {
  addDays, capitalize, dayNum, dayShort, formatLongDate, formatMonthRange, formatTimeShort, fromMinutes,
  nowMinutes, startOfWeek, todayISO, toMinutes,
} from '../lib/dates'
import { navigate } from '../lib/router'
import { AppointmentDetail } from '../components/Appointments'
import { IconChevronLeft, IconChevronRight, IconPlus } from '../components/Icons'

const START_H = 8
const END_H = 20
const HOUR_PX = 64
const HOURS = Array.from({ length: END_H - START_H }, (_, i) => START_H + i)

type Placed = Appointment & { lane: number; lanes: number }

/** Distribuye citas que se traslapan en carriles lado a lado. */
function layout(list: Appointment[]): Placed[] {
  const sorted = [...list].sort((a, b) => toMinutes(a.start) - toMinutes(b.start))
  const out: Placed[] = []
  let cluster: Placed[] = []
  let clusterEnd = -1
  const flush = () => {
    const lanes = Math.max(1, ...cluster.map((c) => c.lane + 1))
    cluster.forEach((c) => (c.lanes = lanes))
    out.push(...cluster)
    cluster = []
  }
  for (const a of sorted) {
    const s = toMinutes(a.start)
    if (s >= clusterEnd && cluster.length) flush()
    const laneEnds: number[] = []
    cluster.forEach((c) => (laneEnds[c.lane] = Math.max(laneEnds[c.lane] ?? 0, toMinutes(c.start) + c.duration)))
    let lane = laneEnds.findIndex((end) => end <= s)
    if (lane === -1) lane = laneEnds.length
    cluster.push({ ...a, lane, lanes: 1 })
    clusterEnd = Math.max(clusterEnd, s + a.duration)
  }
  if (cluster.length) flush()
  return out
}

function Block({ a, onOpen, compact }: { a: Placed; onOpen: (id: string) => void; compact?: boolean }) {
  const { patientById, doctorById } = useStore()
  const p = patientById(a.patientId)
  const d = doctorById(a.doctorId)
  const top = ((toMinutes(a.start) - START_H * 60) / 60) * HOUR_PX
  const height = Math.max((a.duration / 60) * HOUR_PX - 3, 22)
  const width = 100 / a.lanes
  const tight = compact && a.lanes > 1
  return (
    <button
      title={`${p?.name} · ${formatTimeShort(a.start)} · ${a.treatment}`}
      className={`block status-${a.status} ${height < 44 && !tight ? 'short' : ''} ${tight ? 'tight' : ''}`}
      style={{ top, height, left: `calc(${a.lane * width}% + 2px)`, width: `calc(${width}% - 4px)`, ['--c' as string]: d?.color }}
      onClick={(e) => { e.stopPropagation(); onOpen(a.id) }}
    >
      <span className="block-name">{compact ? p?.name.split(' ')[0] : p?.name}</span>
      {!tight && <span className="block-meta">{formatTimeShort(a.start)} · {a.treatment}</span>}
    </button>
  )
}

export function Agenda({ params }: { params: URLSearchParams }) {
  const { appointments, doctors } = useStore()
  const today = todayISO()
  const [view, setView] = useState<'day' | 'week'>(params.get('view') === 'week' ? 'week' : 'day')
  const [date, setDate] = useState(params.get('date') ?? today)
  const [doctor, setDoctor] = useState<string>('all')
  const [open, setOpen] = useState<string | null>(null)
  const scroller = useRef<HTMLDivElement>(null)
  const [now, setNow] = useState(nowMinutes())

  useEffect(() => {
    if (params.get('view') === 'week') setView('week')
    if (params.get('date')) setDate(params.get('date')!)
  }, [params])

  useEffect(() => {
    const t = setInterval(() => setNow(nowMinutes()), 60_000)
    return () => clearInterval(t)
  }, [])

  // Desplaza la vista hacia la hora actual (o 9:00) al entrar.
  useEffect(() => {
    const target = Math.max(0, ((Math.min(Math.max(now, 9 * 60), 18 * 60) - START_H * 60) / 60) * HOUR_PX - 40)
    scroller.current?.scrollTo({ top: target })
  }, [view]) // eslint-disable-line react-hooks/exhaustive-deps

  const weekStart = startOfWeek(date)
  const weekDays = Array.from({ length: 6 }, (_, i) => addDays(weekStart, i)) // lunes a sábado

  const visible = useMemo(
    () => appointments.filter((a) => a.status !== 'cancelada' && (doctor === 'all' || a.doctorId === doctor)),
    [appointments, doctor],
  )
  const countByDay = useMemo(() => {
    const m = new Map<string, number>()
    visible.forEach((a) => m.set(a.date, (m.get(a.date) ?? 0) + 1))
    return m
  }, [visible])

  const step = (dir: number) => setDate(addDays(date, dir * (view === 'week' ? 7 : 1)))

  const columns = view === 'day'
    ? (doctor === 'all' ? doctors : doctors.filter((d) => d.id === doctor)).map((d) => ({
        key: d.id, date, doctorId: d.id, head: <><span className="doc-dot" style={{ background: d.color }} />{d.name.replace(/^Dra?\. /, '')}</>,
        items: layout(visible.filter((a) => a.date === date && a.doctorId === d.id)),
      }))
    : weekDays.map((day) => ({
        key: day, date: day, doctorId: doctor === 'all' ? undefined : doctor,
        head: <span className={`wk-head ${day === today ? 'today' : ''}`}><span>{dayShort(day)}</span><b>{dayNum(day)}</b></span>,
        items: layout(visible.filter((a) => a.date === day)),
      }))

  const onSlot = (e: MouseEvent<HTMLDivElement>, colDate: string, doctorId?: string) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const min = START_H * 60 + Math.floor(((e.clientY - rect.top) / HOUR_PX) * 2) * 30
    navigate('/nueva', { date: colDate, start: fromMinutes(min), doctor: doctorId })
  }

  const title = view === 'day' ? capitalize(formatLongDate(date)) : formatMonthRange(weekDays[0], weekDays[5])
  const nowTop = ((now - START_H * 60) / 60) * HOUR_PX
  const showNow = now >= START_H * 60 && now <= END_H * 60

  return (
    <div className="page page-agenda">
      <div className="page-head">
        <div>
          <div className="eyebrow">Agenda</div>
          <h1 className="agenda-title">{title}</h1>
        </div>
        <button className="btn btn-primary hide-mobile" onClick={() => navigate('/nueva', { date })}><IconPlus size={18} /> Nueva cita</button>
      </div>

      <div className="agenda-toolbar">
        <div className="segmented">
          <button className={view === 'day' ? 'active' : ''} onClick={() => setView('day')}>Día</button>
          <button className={view === 'week' ? 'active' : ''} onClick={() => setView('week')}>Semana</button>
        </div>
        <div className="nav-group">
          <button className="icon-btn bordered" onClick={() => step(-1)} aria-label="Anterior"><IconChevronLeft size={18} /></button>
          <button className="btn btn-secondary btn-sm" onClick={() => setDate(today)}>Hoy</button>
          <button className="icon-btn bordered" onClick={() => step(1)} aria-label="Siguiente"><IconChevronRight size={18} /></button>
        </div>
      </div>

      <div className="chips">
        <button className={`chip ${doctor === 'all' ? 'active' : ''}`} onClick={() => setDoctor('all')}>Todos</button>
        {doctors.map((d) => (
          <button key={d.id} className={`chip ${doctor === d.id ? 'active' : ''}`} onClick={() => setDoctor(d.id)}>
            <span className="doc-dot" style={{ background: d.color }} />{d.name.replace(/^Dra?\. /, '')}
          </button>
        ))}
      </div>

      {view === 'day' && (
        <div className="day-strip">
          {weekDays.map((d) => (
            <button key={d} className={`day-pill ${d === date ? 'active' : ''} ${d === today ? 'is-today' : ''}`} onClick={() => setDate(d)}>
              <span>{dayShort(d)}</span>
              <b>{dayNum(d)}</b>
              <i>{countByDay.get(d) ?? 0}</i>
            </button>
          ))}
        </div>
      )}

      <div className="calendar card">
        <div className="cal-scroll" ref={scroller}>
          <div className={`cal-inner ${view}`} style={{ ['--cols' as string]: columns.length }}>
            <div className="cal-head">
              <div className="cal-gutter" />
              {columns.map((c) => <div key={c.key} className="cal-col-head">{c.head}</div>)}
            </div>
            <div className="cal-body" style={{ height: HOURS.length * HOUR_PX }}>
              <div className="cal-gutter">
                {HOURS.map((h) => <div key={h} className="cal-hour" style={{ height: HOUR_PX }}><span>{h === 12 ? '12 pm' : h > 12 ? `${h - 12} pm` : `${h} am`}</span></div>)}
              </div>
              {columns.map((c) => (
                <div key={c.key} className={`cal-col ${c.date === today && view === 'week' ? 'is-today' : ''}`} onClick={(e) => onSlot(e, c.date, c.doctorId)}>
                  {HOURS.map((h) => <div key={h} className="cal-line" style={{ top: (h - START_H) * HOUR_PX }} />)}
                  {c.date === today && showNow && <div className="now-line" style={{ top: nowTop }} />}
                  {c.items.map((a) => <Block key={a.id} a={a} onOpen={setOpen} compact={view === 'week'} />)}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <p className="muted small hint">Toca un espacio vacío del calendario para agendar en ese horario.</p>

      <AppointmentDetail id={open} onClose={() => setOpen(null)} />
    </div>
  )
}
