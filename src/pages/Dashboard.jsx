import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { apiFetch } from '../api/client.js'
import { useMqtt } from '../hooks/useMqtt.js'
import { useToast } from '../hooks/useToast.js'
import { useNotifiche, suonaAllarme } from '../hooks/useNotifiche.js'
import { formatOraBreve } from '../utils/format.js'

import Sidebar from '../components/Sidebar.jsx'
import Topbar from '../components/Topbar.jsx'
import ToastContainer from '../components/ToastContainer.jsx'
import ValidationModal from '../components/ValidationModal.jsx'
import NewPatientModal from '../components/NewPatientModal.jsx'
import Panoramica from '../components/sections/Panoramica.jsx'
import Anomalie from '../components/sections/Anomalie.jsx'
import Pazienti from '../components/sections/Pazienti.jsx'
import Storico from '../components/sections/Storico.jsx'

const POLLING_EPISODI_MS = 8000
const POLLING_PAZIENTI_MS = 30000
const DEBOUNCE_ALLARME_MS = 15000 // coerente col gap di clustering lato backend

export default function Dashboard() {
  const { token, logout } = useAuth()
  const { toasts, showToast } = useToast()

  const [sezioneAttiva, setSezioneAttiva] = useState('panoramica')
  const [episodi, setEpisodi] = useState([])
  const [pazienti, setPazienti] = useState([])
  const [kpiValidateOggi, setKpiValidateOggi] = useState(0)
  const [ultimoAllarme, setUltimoAllarme] = useState(null)

  const [modalEpisodio, setModalEpisodio] = useState(null) // { episodio, modalita }
  const [modalNuovoPaziente, setModalNuovoPaziente] = useState(false)
  const [storicoRefreshSignal, setStoricoRefreshSignal] = useState(0)

  const ultimoAllarmePerPaziente = useRef({})

  // ── Profilo medico dal JWT (stesso approccio di caricaProfiloMedico) ──
  const medicoNome = (() => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      const local = (payload.sub || '').split('@')[0]
      return local.charAt(0).toUpperCase() + local.slice(1)
    } catch {
      return ''
    }
  })()

  // ── Caricamento episodi non validati ──────────────────────────────
  const caricaEpisodi = useCallback(async () => {
    const res = await apiFetch('/anomalie/episodi', token, {}, logout)
    if (!res || !res.ok) return
    const dati = await res.json()
    setEpisodi(dati)
  }, [token, logout])

  // ── Caricamento pazienti ───────────────────────────────────────────
  const caricaPazienti = useCallback(async () => {
    const res = await apiFetch('/pazienti', token, {}, logout)
    if (!res || !res.ok) return
    const dati = await res.json()
    setPazienti(dati)
  }, [token, logout])

  useEffect(() => {
    caricaEpisodi()
    caricaPazienti()

    const t1 = setInterval(caricaEpisodi, POLLING_EPISODI_MS)
    const t2 = setInterval(caricaPazienti, POLLING_PAZIENTI_MS)
    return () => {
      clearInterval(t1)
      clearInterval(t2)
    }
  }, [caricaEpisodi, caricaPazienti])

  // ── Notifiche desktop ───────────────────────────────────────────────
  const notifiche = useNotifiche(() => setSezioneAttiva('anomalie'))

  // Collega il toggle del bottone in Topbar ai toast in-app: la notifica
  // di sistema del SO parte già da dentro richiediPermesso() (vedi
  // useNotifiche.js), qui gestiamo solo il feedback per gli altri esiti.
  async function toggleNotifiche() {
    const { esito } = await notifiche.richiediPermesso()

    if (esito === 'disattivate') {
      showToast('success', 'Notifiche disattivate', 'Non riceverai più notifiche di sistema per le anomalie')
    } else if (esito === 'bloccate') {
      showToast('alarm', 'Notifiche bloccate', 'Sbloccale dalle impostazioni del browser per riattivarle')
    } else if (esito === 'negato') {
      showToast('alarm', 'Permesso negato', 'Non è stato possibile attivare le notifiche desktop')
    }
    // 'attivate' non genera un toast in-app: la conferma è già la
    // notifica di sistema mostrata da richiediPermesso() stesso
  }

  // ── MQTT: allarmi in tempo reale ────────────────────────────────────
  const gestisciAllarme = useCallback(
    (msg) => {
      const ora = msg.timestamp ? formatOraBreve(msg.timestamp) : 'adesso'
      const pazienteId = msg.paziente_id || 'sconosciuto'
      const adesso = Date.now()
      const ultimo = ultimoAllarmePerPaziente.current[pazienteId] || 0
      const nuovoEpisodio = adesso - ultimo > DEBOUNCE_ALLARME_MS
      ultimoAllarmePerPaziente.current[pazienteId] = adesso

      if (nuovoEpisodio) {
        suonaAllarme()
        notifiche.mostra(
          `⚠ Anomalia ECG — Paziente ${pazienteId}`,
          `Score: ${(msg.ecg_score * 100).toFixed(0)}% · Temp: ${msg.temperatura_label} · ${ora}`,
          `smartcare-episodio-${pazienteId}`
        )
      }

      showToast(
        'alarm',
        `⚠ Anomalia ECG — Paziente ${pazienteId}`,
        `Score: ${(msg.ecg_score * 100).toFixed(0)}% · Temp: ${msg.temperatura_label} · ${ora}`,
        3000
      )

      setUltimoAllarme({ ora, pazienteId })

      if (sezioneAttiva === 'anomalie' || sezioneAttiva === 'panoramica') {
        setTimeout(caricaEpisodi, 800)
      }
    },
    [notifiche, showToast, sezioneAttiva, caricaEpisodi]
  )

  const statoMqtt = useMqtt(gestisciAllarme)

  // ── Navigazione sezioni ──────────────────────────────────────────────
  function naviga(sezione) {
    setSezioneAttiva(sezione)
    if (sezione === 'anomalie') caricaEpisodi()
    if (sezione === 'pazienti') caricaPazienti()
  }

  // ── Validazione episodio (usata sia da 'valida' che da 'storico') ──
  async function confermaValidazione({ annotation_ids, esito, note, numeroLetture, eraGiaValidato, modalita }) {
    const res = await apiFetch(
      '/anomalie/episodi/valida',
      token,
      { method: 'PATCH', body: JSON.stringify({ annotation_ids, esito, note }) },
      logout
    )

    if (!res || !res.ok) {
      showToast('alarm', 'Errore', 'Impossibile salvare la validazione')
      return
    }

    setModalEpisodio(null)

    if (!eraGiaValidato) {
      setKpiValidateOggi((n) => n + 1)
    }

    const messaggioBase = esito === 'vero_positivo' ? 'Anomalia confermata' : 'Falso allarme registrato'
    const suffissoEpisodio = numeroLetture > 1 ? ` (${numeroLetture} letture validate in un'unica azione)` : ''
    const suffissoModifica = eraGiaValidato ? ' (aggiornato)' : ''
    showToast('success', 'Validazione salvata', messaggioBase + suffissoEpisodio + suffissoModifica)

    if (modalita === 'storico') {
      setStoricoRefreshSignal((n) => n + 1)
    }

    await caricaEpisodi()
  }

  // ── Creazione paziente ───────────────────────────────────────────────
  async function creaPaziente({ nome, cognome }) {
    const res = await apiFetch(
      '/pazienti',
      token,
      { method: 'POST', body: JSON.stringify({ nome, cognome }) },
      logout
    )
    if (!res || !res.ok) throw new Error('Errore creazione paziente')
    const paziente = await res.json()
    showToast('success', 'Paziente creato', `${paziente.nome} ${paziente.cognome} — codice: ${paziente.codice_accesso}`)
    await caricaPazienti()
    return paziente
  }

  const numeroAnomalie = episodi.length

  return (
    <div className="app">
      <Sidebar
        sezioneAttiva={sezioneAttiva}
        onNaviga={naviga}
        numeroAnomalie={numeroAnomalie}
        medicoNome={medicoNome}
        onLogout={logout}
      />

      <div className="main">
        <Topbar
          sezioneAttiva={sezioneAttiva}
          statoMqtt={statoMqtt}
          notifiche={notifiche}
          onToggleNotifiche={toggleNotifiche}
        />

        <div className="content">
          {sezioneAttiva === 'panoramica' && (
            <Panoramica
              episodi={episodi}
              pazienti={pazienti}
              kpiValidateOggi={kpiValidateOggi}
              ultimoAllarme={ultimoAllarme}
              onVediTutte={() => naviga('anomalie')}
              onValida={(ep) => setModalEpisodio({ episodio: ep, modalita: 'valida' })}
            />
          )}

          {sezioneAttiva === 'anomalie' && (
            <Anomalie
              episodi={episodi}
              onRefresh={caricaEpisodi}
              onValida={(ep) => setModalEpisodio({ episodio: ep, modalita: 'valida' })}
            />
          )}

          {sezioneAttiva === 'pazienti' && (
            <Pazienti pazienti={pazienti} onNuovoPaziente={() => setModalNuovoPaziente(true)} />
          )}

          {sezioneAttiva === 'storico' && (
            <Storico
              pazienti={pazienti}
              refreshSignal={storicoRefreshSignal}
              onApriEpisodio={(ep) => setModalEpisodio({ episodio: ep, modalita: 'storico' })}
            />
          )}
        </div>
      </div>

      {modalEpisodio && (
        <ValidationModal
          episodio={modalEpisodio.episodio}
          modalita={modalEpisodio.modalita}
          onClose={() => setModalEpisodio(null)}
          onConferma={confermaValidazione}
        />
      )}

      {modalNuovoPaziente && (
        <NewPatientModal onClose={() => setModalNuovoPaziente(false)} onCrea={creaPaziente} />
      )}

      <ToastContainer toasts={toasts} />
    </div>
  )
}