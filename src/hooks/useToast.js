import { useCallback, useRef, useState } from 'react'

let contatore = 0

export function useToast() {
  const [toasts, setToasts] = useState([])
  const timersRef = useRef({})

  const showToast = useCallback((tipo, titolo, messaggio, durata = 6000) => {
    const id = ++contatore
    setToasts((prev) => [...prev, { id, tipo, titolo, messaggio }])

    timersRef.current[id] = setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
      delete timersRef.current[id]
    }, durata)
  }, [])

  return { toasts, showToast }
}
