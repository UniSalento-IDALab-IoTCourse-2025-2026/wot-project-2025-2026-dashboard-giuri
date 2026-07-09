import { useEffect, useRef, useState } from 'react'
import mqtt from 'mqtt'

const BROKER_URL = import.meta.env.VITE_BROKER_URL || 'wss://localhost:9002'
const TOPIC_ALLARMI = 'smartcare/allarmi'

/**
 * Si connette al broker Mosquitto via WebSocket e si sottoscrive al
 * topic degli allarmi. onAllarme viene invocata per ogni messaggio
 * ricevuto già parsato da JSON.
 *
 * Ritorna lo stato della connessione ('connecting' | 'connected' | 'disconnected'),
 * usato dal pallino di stato in Topbar.
 */
export function useMqtt(onAllarme) {
  const [stato, setStato] = useState('connecting')
  const callbackRef = useRef(onAllarme)
  callbackRef.current = onAllarme

  useEffect(() => {
    const client = mqtt.connect(BROKER_URL, {
      clientId: `dashboard_${Math.random().toString(16).slice(2, 8)}`,
      clean: true,
      reconnectPeriod: 3000
    })

    client.on('connect', () => {
      setStato('connected')
      client.subscribe(TOPIC_ALLARMI, { qos: 1 })
    })

    client.on('error', () => setStato('disconnected'))
    client.on('offline', () => setStato('disconnected'))
    client.on('reconnect', () => setStato('connecting'))

    client.on('message', (topic, payload) => {
      if (topic !== TOPIC_ALLARMI) return
      try {
        const msg = JSON.parse(payload.toString())
        callbackRef.current?.(msg)
      } catch (e) {
        console.error('Errore parsing MQTT:', e)
      }
    })

    return () => {
      client.end(true)
    }
  }, [])

  return stato
}
