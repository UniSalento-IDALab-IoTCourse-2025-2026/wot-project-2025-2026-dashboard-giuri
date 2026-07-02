export const API_URL = import.meta.env.VITE_API_URL || 'https://localhost:8443'

/**
 * Fetch autenticata verso il backend FastAPI. Se il token non è più
 * valido (401), invoca onUnauthorized (tipicamente: logout + redirect
 * al login) e restituisce null, così i chiamanti non devono ripetere
 * questa gestione in ogni punto di chiamata.
 */
export async function apiFetch(path, token, options = {}, onUnauthorized) {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  })

  if (res.status === 401) {
    onUnauthorized?.()
    return null
  }

  return res
}

/** Fetch pubblica (non autenticata) verso il backend — usata dagli endpoint /pazienti/by-codice/... */
export async function publicFetch(path, options = {}) {
  return fetch(`${API_URL}${path}`, options)
}
