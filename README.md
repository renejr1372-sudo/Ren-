# Mónica — Agenda para consultorios odontológicos

Prototipo **frontend** del SaaS Mónica. Funciona 100 % en el navegador: sin backend, sin Supabase y sin autenticación real.
Los datos son ficticios y se guardan en el `localStorage` del navegador (cada dispositivo tiene su propia copia).

## Qué incluye

| Sección | Ruta | Qué puedes hacer |
|---|---|---|
| Dashboard | `#/` | Citas de hoy, pendientes de confirmar, próximas citas, siguiente paciente |
| Agenda | `#/agenda` | Vista **diaria** (columnas por doctor) y **semanal**, filtro por doctor, toca un hueco para agendar ahí |
| Pacientes | `#/pacientes` | Lista con nombre y teléfono, búsqueda, alta de paciente, llamar, WhatsApp, agendar |
| Nueva cita | `#/nueva` | Paciente, tratamiento, doctor, fecha, hora (con horarios ocupados bloqueados) y duración |
| Confirmaciones | `#/confirmaciones` | Citas pendientes con botón de WhatsApp y mensaje de confirmación prellenado |

El botón ↻ (o "Restablecer demo") regenera los datos de prueba.

## Ejecutar

```bash
npm install
npm run dev        # servidor de desarrollo expuesto en la red local (puerto 5173)
npm run build      # build de producción en dist/
npm run preview    # sirve dist/ en la red local (puerto 4173)
```

## Abrirlo en el iPhone (misma red Wi-Fi)

1. En la computadora ejecuta `npm run dev`. En la terminal verás algo como
   `Network: http://192.168.1.25:5173/` — esa es la dirección.
2. Si no aparece la línea `Network`, busca la IP de tu computadora:
   - macOS: `ipconfig getifaddr en0`
   - Windows: `ipconfig` → "Dirección IPv4"
3. En el iPhone (conectado al mismo Wi-Fi) abre Safari y escribe `http://<IP>:5173` (con `http`, no `https`).
4. Opcional: Compartir → **Agregar a pantalla de inicio** para abrirlo como app a pantalla completa.

Si no carga: permite Node.js en el firewall (macOS: Ajustes → Red → Firewall; Windows: acepta el aviso de "redes privadas"),
verifica que el iPhone no esté en datos móviles o en una red de invitados, y desactiva temporalmente VPNs.

## Estructura

```
src/
  types.ts            Modelos (Patient, Doctor, Appointment) — pensados para mapear a tablas futuras
  data/mock.ts        Datos ficticios (se generan relativos a la fecha actual)
  store/AppStore.tsx  Capa de datos local (Context + localStorage). Es el único punto a reemplazar al conectar el backend
  lib/                Fechas, teléfonos, WhatsApp (wa.me) y router por hash
  components/         Layout (sidebar + tab bar iOS), hojas modales, filas de cita, íconos
  pages/              Dashboard, Agenda, Pacientes, NuevaCita, Confirmaciones
```

Stack: Vite + React + TypeScript, CSS propio (sin librerías de UI). Sin dependencias adicionales.
