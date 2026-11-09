import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Appointment, AppointmentStatus, Patient } from '../types'
import { buildAppointments, buildPatients, clinic, doctors } from '../data/mock'

// Capa de datos local (localStorage). En la versión SaaS esta capa se reemplaza
// por llamadas al backend sin tocar las pantallas: los componentes solo usan useStore().

const STORAGE_KEY = 'monica.demo.v2'

interface Persisted {
  patients: Patient[]
  appointments: Appointment[]
  seededOn: string
}

function seed(): Persisted {
  const patients = buildPatients()
  return { patients, appointments: buildAppointments(patients), seededOn: new Date().toDateString() }
}

function load(): Persisted {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const data = JSON.parse(raw) as Persisted
      // Si la demo es de otro día, se regenera para que "hoy" siempre tenga citas.
      if (data.seededOn === new Date().toDateString()) return data
    }
  } catch {
    /* almacenamiento no disponible */
  }
  return seed()
}

interface Toast { id: number; message: string; tone?: 'success' | 'info' }

interface StoreValue {
  clinic: typeof clinic
  doctors: typeof doctors
  patients: Patient[]
  appointments: Appointment[]
  patientById: (id: string) => Patient | undefined
  doctorById: (id: string) => (typeof doctors)[number] | undefined
  addAppointment: (a: Omit<Appointment, 'id'>) => Appointment
  updateAppointment: (id: string, patch: Partial<Appointment>) => void
  setStatus: (id: string, status: AppointmentStatus) => void
  addPatient: (p: Omit<Patient, 'id' | 'createdAt'>) => Patient
  resetDemo: () => void
  toasts: Toast[]
  notify: (message: string, tone?: Toast['tone']) => void
}

const Ctx = createContext<StoreValue | null>(null)

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<Persisted>(load)
  const [toasts, setToasts] = useState<Toast[]>([])

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)) } catch { /* ignore */ }
  }, [data])

  const notify = useCallback((message: string, tone: Toast['tone'] = 'success') => {
    const id = Date.now() + Math.random()
    setToasts((t) => [...t, { id, message, tone }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2800)
  }, [])

  const value = useMemo<StoreValue>(() => {
    const pMap = new Map(data.patients.map((p) => [p.id, p]))
    const dMap = new Map(doctors.map((d) => [d.id, d]))
    return {
      clinic,
      doctors,
      patients: data.patients,
      appointments: data.appointments,
      patientById: (id) => pMap.get(id),
      doctorById: (id) => dMap.get(id),
      addAppointment: (a) => {
        const appt: Appointment = { ...a, id: `a${Date.now()}` }
        setData((d) => ({
          ...d,
          appointments: [...d.appointments, appt].sort((x, y) => (x.date + x.start).localeCompare(y.date + y.start)),
        }))
        return appt
      },
      updateAppointment: (id, patch) =>
        setData((d) => ({ ...d, appointments: d.appointments.map((a) => (a.id === id ? { ...a, ...patch } : a)) })),
      setStatus: (id, status) =>
        setData((d) => ({ ...d, appointments: d.appointments.map((a) => (a.id === id ? { ...a, status } : a)) })),
      addPatient: (p) => {
        const patient: Patient = { ...p, id: `p${Date.now()}`, createdAt: new Date().toISOString().slice(0, 10) }
        setData((d) => ({ ...d, patients: [...d.patients, patient].sort((a, b) => a.name.localeCompare(b.name)) }))
        return patient
      },
      resetDemo: () => setData(seed()),
      toasts,
      notify,
    }
  }, [data, toasts, notify])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useStore() {
  const v = useContext(Ctx)
  if (!v) throw new Error('useStore debe usarse dentro de AppStoreProvider')
  return v
}
