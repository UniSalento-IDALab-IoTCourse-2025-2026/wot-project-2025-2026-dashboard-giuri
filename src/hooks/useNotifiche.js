import { useCallback, useState } from 'react'

/**
 * Gestisce il permesso del browser (Notification API) e il toggle
 * lato JS (notificheAbilitate). Il permesso OS non è revocabile via
 * JS per scelta del browser: il toggle interno serve solo a
 * sopprimere le chiamate a new Notification() quando l'utente
 * "disattiva" dal bottone in Topbar — stessa strategia di Slack/Gmail.
 */
export function useNotifiche(onClickNotifica) {
  const [abilitate, setAbilitate] = useState(false)

  const supportate = typeof window !== 'undefined' && 'Notification' in window
  const permesso = supportate ? Notification.permission : 'denied'

  const mostra = useCallback(
    (titolo, corpo, tagFisso = null, ignoraAbilitato = false) => {
      if (!supportate || Notification.permission !== 'granted') return
      // ignoraAbilitato serve per la notifica di conferma mostrata subito
      // dopo l'attivazione: in quel momento lo stato "abilitate" del
      // render corrente è ancora false (setState è asincrono), quindi il
      // controllo normale bloccherebbe sempre la prima notifica di test.
      if (!ignoraAbilitato && !abilitate) return
      try {
        const notif = new Notification(titolo, {
          body: corpo,
          tag: tagFisso || `smartcare-${Date.now()}`,
          requireInteraction: true
        })
        notif.onclick = () => {
          window.focus()
          onClickNotifica?.()
          notif.close()
        }
      } catch (e) {
        console.error('Eccezione creando la notifica:', e)
      }
    },
    [abilitate, supportate, onClickNotifica]
  )

  const richiediPermesso = useCallback(async () => {
    if (!supportate) return { esito: 'non-supportate' }
    if (Notification.permission === 'denied') return { esito: 'bloccate' }

    if (Notification.permission === 'granted' && abilitate) {
      setAbilitate(false)
      return { esito: 'disattivate' }
    }

    if (Notification.permission === 'default') {
      await Notification.requestPermission()
    }

    if (Notification.permission === 'granted') {
      setAbilitate(true)
      // true = ignora il gate su "abilitate" (vedi commento sopra):
      // senza questo la notifica di test non partirebbe mai, perché
      // lo stato "abilitate" non è ancora aggiornato in questo render.
      mostra(
        '✓ Notifiche desktop attive',
        'Riceverai una notifica per ogni nuovo episodio di anomalia rilevato.',
        null,
        true
      )
      return { esito: 'attivate' }
    }

    return { esito: 'negato' }
  }, [abilitate, supportate, mostra])

  return { abilitate, permesso, supportate, mostra, richiediPermesso }
}

export function suonaAllarme() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const beep = (freq, start, dur) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.frequency.value = freq
      osc.type = 'sine'
      gain.gain.setValueAtTime(0.3, ctx.currentTime + start)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + dur)
      osc.start(ctx.currentTime + start)
      osc.stop(ctx.currentTime + start + dur)
    }
    beep(880, 0, 0.15)
    beep(880, 0.2, 0.15)
    beep(1100, 0.4, 0.3)
  } catch (e) {
    // AudioContext non disponibile (es. tab in background)
  }
}