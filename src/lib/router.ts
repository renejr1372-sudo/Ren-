import { useEffect, useState } from 'react'

// Router mínimo basado en hash (#/agenda). Funciona en cualquier hosting estático
// y puede reemplazarse por un router completo más adelante.

export type Route = { path: string; params: URLSearchParams }

function parse(): Route {
  const raw = window.location.hash.replace(/^#/, '') || '/'
  const [path, query] = raw.split('?')
  return { path: path || '/', params: new URLSearchParams(query) }
}

export function useRoute(): Route {
  const [route, setRoute] = useState(parse)
  useEffect(() => {
    const on = () => {
      setRoute(parse())
      window.scrollTo({ top: 0 })
    }
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])
  return route
}

export function navigate(path: string, params?: Record<string, string | undefined>) {
  const q = new URLSearchParams()
  Object.entries(params ?? {}).forEach(([k, v]) => v && q.set(k, v))
  const qs = q.toString()
  window.location.hash = qs ? `${path}?${qs}` : path
}
