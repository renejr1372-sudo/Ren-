import type { ReactNode } from 'react'
import { useStore } from '../store/AppStore'
import { navigate } from '../lib/router'
import { IconCalendar, IconCheck, IconHome, IconPlus, IconRefresh, IconUsers, IconWhatsApp } from './Icons'
import { addDays, todayISO } from '../lib/dates'
import { Avatar } from './ui'

const NAV = [
  { path: '/', label: 'Inicio', icon: IconHome },
  { path: '/agenda', label: 'Agenda', icon: IconCalendar },
  { path: '/pacientes', label: 'Pacientes', icon: IconUsers },
  { path: '/confirmaciones', label: 'Confirmar', icon: IconWhatsApp },
]

function Brand() {
  return (
    <div className="brand">
      <span className="brand-mark">M</span>
      <span className="brand-name">Mónica</span>
    </div>
  )
}

export function Layout({ path, children }: { path: string; children: ReactNode }) {
  const { clinic, toasts, resetDemo, notify, appointments } = useStore()
  const today = todayISO()
  const pending = appointments.filter((a) => a.status === 'pendiente' && a.date >= today && a.date <= addDays(today, 7)).length
  const isActive = (p: string) => (p === '/' ? path === '/' : path.startsWith(p))

  return (
    <div className="app">
      <aside className="sidebar">
        <Brand />
        <button className="btn btn-primary btn-block" onClick={() => navigate('/nueva')}>
          <IconPlus size={18} /> Nueva cita
        </button>
        <nav className="side-nav">
          {NAV.map(({ path: p, label, icon: Icon }) => (
            <a key={p} href={`#${p}`} className={isActive(p) ? 'active' : ''}>
              <Icon size={19} /> {p === '/confirmaciones' ? 'Confirmaciones' : label}
              {p === '/confirmaciones' && pending > 0 && <span className="nav-count">{pending}</span>}
            </a>
          ))}
        </nav>
        <div className="sidebar-foot">
          <button className="side-link" onClick={() => { resetDemo(); notify('Datos de demostración restablecidos', 'info') }}>
            <IconRefresh size={16} /> Restablecer demo
          </button>
          <div className="clinic-card">
            <Avatar name="Mónica Herrera" size={34} />
            <div>
              <div className="clinic-user">Dra. Mónica Herrera</div>
              <div className="clinic-name">{clinic.name}</div>
            </div>
          </div>
        </div>
      </aside>

      <header className="mobile-top">
        <Brand />
        <button className="icon-btn" onClick={() => { resetDemo(); notify('Datos de demostración restablecidos', 'info') }} aria-label="Restablecer demo">
          <IconRefresh size={18} />
        </button>
      </header>

      <main className="main">{children}</main>

      <nav className="tabbar">
        {NAV.slice(0, 2).map(({ path: p, label, icon: Icon }) => (
          <a key={p} href={`#${p}`} className={isActive(p) ? 'active' : ''}><Icon size={22} /><span>{label}</span></a>
        ))}
        <a href="#/nueva" className={`tab-cta ${isActive('/nueva') ? 'active' : ''}`} aria-label="Nueva cita">
          <span className="tab-cta-btn"><IconPlus size={24} /></span>
        </a>
        {NAV.slice(2).map(({ path: p, label, icon: Icon }) => (
          <a key={p} href={`#${p}`} className={isActive(p) ? 'active' : ''}>
            <span className="tab-icon"><Icon size={22} />{p === '/confirmaciones' && pending > 0 && <span className="tab-badge">{pending > 99 ? '99+' : pending}</span>}</span>
            <span>{label}</span>
          </a>
        ))}
      </nav>

      <div className="toasts">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.tone}`}><IconCheck size={16} /> {t.message}</div>
        ))}
      </div>
    </div>
  )
}
