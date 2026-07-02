const TITOLI = {
  panoramica: 'Panoramica',
  anomalie: 'Anomalie da validare',
  pazienti: 'Pazienti',
  storico: 'Storico anomalie'
}

const LABEL_STATO = {
  connected: 'MQTT connesso',
  connecting: 'Connessione MQTT...',
  disconnected: 'MQTT disconnesso'
}

export default function Topbar({ sezioneAttiva, statoMqtt, notifiche, onToggleNotifiche }) {
  const { supportate, permesso, abilitate } = notifiche

  let testoBottone = '🔔 Attiva notifiche desktop'
  let disabilitato = false
  if (!supportate) {
    testoBottone = '🔕 Non supportate'
    disabilitato = true
  } else if (permesso === 'denied') {
    testoBottone = '🔕 Bloccate (sblocca dal browser)'
  } else if (permesso === 'granted' && abilitate) {
    testoBottone = '🔔 Notifiche attive — clicca per disattivare'
  }

  return (
    <div className="topbar">
      <div className="topbar-title">{TITOLI[sezioneAttiva] || sezioneAttiva}</div>
      <div className="topbar-right">
        <button
          className="btn btn-ghost"
          style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}
          onClick={onToggleNotifiche}
          disabled={disabilitato}
        >
          {testoBottone}
        </button>
        <div className="connection-status">
          <div className={`status-dot ${statoMqtt}`} />
          <span>{LABEL_STATO[statoMqtt] || statoMqtt}</span>
        </div>
      </div>
    </div>
  )
}