import { useEffect, type ReactNode } from 'react'
import type { AppointmentStatus } from '../types'
import { IconX } from './Icons'

const PALETTE = ['#0f766e', '#6366f1', '#e11d48', '#d97706', '#0284c7', '#7c3aed', '#059669', '#db2777']

export function Avatar({ name, size = 40 }: { name: string; size?: number }) {
  const parts = name.split(' ')
  const initials = (parts[0][0] + (parts[parts.length - 1][0] ?? '')).toUpperCase()
  const hash = [...name].reduce((h, c) => h + c.charCodeAt(0), 0)
  const color = PALETTE[hash % PALETTE.length]
  return (
    <span className="avatar" style={{ width: size, height: size, fontSize: size * 0.38, color, background: `${color}14` }}>
      {initials}
    </span>
  )
}

const STATUS_LABEL: Record<AppointmentStatus, string> = {
  pendiente: 'Por confirmar',
  confirmada: 'Confirmada',
  completada: 'Completada',
  cancelada: 'Cancelada',
}

export function StatusBadge({ status }: { status: AppointmentStatus }) {
  return <span className={`badge badge-${status}`}><span className="dot" />{STATUS_LABEL[status]}</span>
}

export function Sheet({ open, onClose, title, children, footer }: {
  open: boolean; onClose: () => void; title?: ReactNode; children: ReactNode; footer?: ReactNode
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    document.body.classList.add('no-scroll')
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.classList.remove('no-scroll')
    }
  }, [open, onClose])
  if (!open) return null
  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-grabber" />
        <div className="sheet-header">
          <div className="sheet-title">{title}</div>
          <button className="icon-btn" onClick={onClose} aria-label="Cerrar"><IconX size={18} /></button>
        </div>
        <div className="sheet-body">{children}</div>
        {footer && <div className="sheet-footer">{footer}</div>}
      </div>
    </div>
  )
}

export function EmptyState({ icon, title, text, action }: { icon: ReactNode; title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="empty">
      <div className="empty-icon">{icon}</div>
      <div className="empty-title">{title}</div>
      {text && <div className="empty-text">{text}</div>}
      {action}
    </div>
  )
}
