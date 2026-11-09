// Modelos de dominio. Están pensados para mapear 1:1 con tablas futuras
// (patients, doctors, appointments) cuando se conecte el backend.

export type AppointmentStatus = 'pendiente' | 'confirmada' | 'completada' | 'cancelada'

export interface Patient {
  id: string
  name: string
  phone: string // formato E.164 sin "+", ej. 525512345678
  email?: string
  birthDate?: string
  notes?: string
  createdAt: string
}

export interface Doctor {
  id: string
  name: string
  specialty: string
  color: string
}

export interface Appointment {
  id: string
  patientId: string
  doctorId: string
  date: string // YYYY-MM-DD
  start: string // HH:mm
  duration: number // minutos
  treatment: string
  status: AppointmentStatus
  notes?: string
}

export interface Clinic {
  name: string
  address: string
  phone: string
}
