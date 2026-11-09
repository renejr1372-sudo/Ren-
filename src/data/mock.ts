import type { Appointment, AppointmentStatus, Clinic, Doctor, Patient } from '../types'
import { addDays, fromMinutes, nowMinutes, parseISODate, toMinutes, todayISO } from '../lib/dates'

// Datos ficticios. Las citas se generan relativas a la fecha actual
// para que la demo siempre se vea llena y realista.

export const clinic: Clinic = {
  name: 'Clínica Dental Sonríe',
  address: 'Av. Insurgentes Sur 1458, Col. Del Valle, CDMX',
  phone: '525555551234',
}

export const doctors: Doctor[] = [
  { id: 'd1', name: 'Dra. Mónica Herrera', specialty: 'Odontología general', color: '#0f766e' },
  { id: 'd2', name: 'Dr. Alejandro Ruiz', specialty: 'Ortodoncia', color: '#6366f1' },
  { id: 'd3', name: 'Dra. Sofía Navarro', specialty: 'Endodoncia', color: '#e11d48' },
]

export const treatments = [
  { name: 'Limpieza dental', duration: 45 },
  { name: 'Revisión general', duration: 30 },
  { name: 'Resina', duration: 60 },
  { name: 'Ajuste de ortodoncia', duration: 30 },
  { name: 'Endodoncia', duration: 90 },
  { name: 'Extracción', duration: 45 },
  { name: 'Blanqueamiento', duration: 60 },
  { name: 'Valoración inicial', duration: 30 },
  { name: 'Corona', duration: 60 },
  { name: 'Urgencia', duration: 30 },
]

const NAMES = [
  'María Fernanda López', 'José Luis Martínez', 'Ana Sofía Ramírez', 'Carlos Hernández', 'Valeria Gómez',
  'Diego Torres', 'Lucía Morales', 'Jorge Castillo', 'Camila Vargas', 'Ricardo Mendoza',
  'Daniela Rojas', 'Fernando Aguilar', 'Paola Jiménez', 'Andrés Salinas', 'Gabriela Ortiz',
  'Miguel Ángel Cruz', 'Regina Fuentes', 'Emilio Navarro', 'Ximena Delgado', 'Santiago Ríos',
  'Natalia Peña', 'Héctor Domínguez', 'Renata Cabrera', 'Luis Enrique Vega', 'Mariana Silva',
  'Pablo Guerrero', 'Isabela Romero', 'Roberto Medina', 'Fernanda Castro', 'Tomás Ibarra',
]

// Generador pseudoaleatorio determinista para que los datos no cambien en cada carga.
function rng(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296
    return seed / 4294967296
  }
}

export function buildPatients(): Patient[] {
  const r = rng(42)
  return NAMES.map((name, i) => {
    const lada = ['55', '55', '55', '33', '81', '222'][Math.floor(r() * 6)]
    const rest = String(Math.floor(r() * 1e8)).padStart(10 - lada.length, '0').slice(0, 10 - lada.length)
    const [first, last] = [name.split(' ')[0], name.split(' ').slice(-1)[0]]
    const email = `${first}.${last}`.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase() + '@gmail.com'
    return {
      id: `p${i + 1}`,
      name,
      phone: `52${lada}${rest}`,
      email,
      createdAt: addDays(todayISO(), -Math.floor(r() * 400) - 10),
    }
  })
}

export function buildAppointments(patients: Patient[]): Appointment[] {
  const r = rng(7)
  const today = todayISO()
  const nowMin = nowMinutes()
  const list: Appointment[] = []
  let id = 1

  for (let offset = -10; offset <= 21; offset++) {
    const date = addDays(today, offset)
    const dow = parseISODate(date).getDay()
    if (dow === 0) continue // domingo cerrado
    const closeMin = dow === 6 ? 14 * 60 : 19 * 60

    for (const doc of doctors) {
      // Cada doctor tiene su propia línea del tiempo del día.
      let cursor = 9 * 60 + (doc.id === 'd2' ? 30 : doc.id === 'd3' ? 60 : 0)
      const density = offset === 0 ? 0.55 : offset < 0 ? 0.45 : Math.max(0.12, 0.4 - offset * 0.015)
      while (cursor < closeMin - 30) {
        if (cursor >= 14 * 60 && cursor < 15 * 60 && dow !== 6) { cursor = 15 * 60; continue } // comida
        if (r() > density) { cursor += 30; continue }
        const pool = doc.id === 'd2' ? [3, 7, 1] : doc.id === 'd3' ? [4, 5, 8, 9] : [0, 1, 2, 5, 6, 7, 9]
        const t = treatments[pool[Math.floor(r() * pool.length)]]
        if (cursor + t.duration > closeMin) break
        const patient = patients[Math.floor(r() * patients.length)]

        let status: AppointmentStatus
        const startMin = cursor
        if (offset < 0 || (offset === 0 && startMin + t.duration <= nowMin)) {
          status = r() < 0.9 ? 'completada' : 'cancelada'
        } else if (offset <= 1) {
          status = r() < 0.6 ? 'confirmada' : 'pendiente'
        } else if (offset <= 4) {
          status = r() < 0.45 ? 'confirmada' : r() < 0.95 ? 'pendiente' : 'cancelada'
        } else {
          status = r() < 0.15 ? 'confirmada' : 'pendiente'
        }

        list.push({
          id: `a${id++}`,
          patientId: patient.id,
          doctorId: doc.id,
          date,
          start: fromMinutes(cursor),
          duration: t.duration,
          treatment: t.name,
          status,
          notes: r() < 0.15 ? 'Paciente con sensibilidad, usar anestesia tópica.' : undefined,
        })
        cursor += t.duration + (r() < 0.3 ? 15 : 0)
        cursor = Math.ceil(cursor / 15) * 15
      }
    }
  }
  return list.sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start))
}

export const isOverlapping = (a: { date: string; start: string; duration: number }, b: { date: string; start: string; duration: number }) =>
  a.date === b.date && toMinutes(a.start) < toMinutes(b.start) + b.duration && toMinutes(b.start) < toMinutes(a.start) + a.duration
