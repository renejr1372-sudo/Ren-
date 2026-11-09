import type { Appointment, Clinic, Doctor, Patient } from '../types'
import { formatLongDate, formatTime } from './dates'

const firstName = (name: string) => name.split(' ')[0]

export function confirmationMessage(p: Patient, a: Appointment, d: Doctor | undefined, clinic: Clinic): string {
  return [
    `Hola ${firstName(p.name)} 👋`,
    ``,
    `Te escribimos de *${clinic.name}* para confirmar tu cita:`,
    ``,
    `🦷 ${a.treatment}`,
    `📅 ${formatLongDate(a.date).replace(/^./, (c) => c.toUpperCase())}`,
    `🕐 ${formatTime(a.start)}`,
    d ? `🧑‍⚕️ ${d.name}` : '',
    `📍 ${clinic.address}`,
    ``,
    `Por favor responde *SÍ* para confirmar o avísanos si necesitas reprogramar. ¡Gracias!`,
  ]
    .filter((l, i, arr) => !(l === '' && arr[i - 1] === ''))
    .join('\n')
}

export function reminderMessage(p: Patient, a: Appointment, clinic: Clinic): string {
  return `Hola ${firstName(p.name)}, te recordamos tu cita de ${a.treatment.toLowerCase()} el ${formatLongDate(a.date)} a las ${formatTime(a.start)} en ${clinic.name}. ¡Te esperamos! 😊`
}

export function genericMessage(p: Patient, clinic: Clinic): string {
  return `Hola ${firstName(p.name)}, te saludamos de ${clinic.name}. `
}

/** wa.me funciona igual en iPhone (abre la app) y en escritorio (WhatsApp Web / Desktop). */
export function whatsappUrl(phone: string, text: string): string {
  return `https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`
}
