import { useEffect, useState } from 'react'
import { publicFetch } from '../../api/client.js'
import { formatDurataEpisodio, formatIntervalloEpisodio } from '../../utils/format.js'

export default function Storico({ pazienti, onApriEpisodio, refreshSignal }) {
  const [pazienteId, setPazienteId] = useState('')
  const [episodi, setEpisodi] = useState(null) // null = non ancora caricato
  const [caricamento, setCaricamento] = useState(false)

  async function caricaStorico(codice = pazienteId) {
    if (!codice) return
    setCaricamento(true)
    try {
      const res = await publicFetch(`/pazienti/by-codice/${codice}/episodi`)
      if (!res.ok) throw new Error('Errore risposta')
      const dati = await res.json()
      setEpisodi(dati)
    } catch (e) {
      setEpisodi([])
    } finally {
      setCaricamento(false)
    }
  }

  // Dopo una validazione fatta dal modal in modalità "storico", ricarica
  // automaticamente la lista se un paziente era già selezionato.
  useEffect(() => {
    if (refreshSignal && pazienteId) {
      caricaStorico(pazienteId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshSignal])

  const paziente = pazienti.find((p) => p.codice_accesso === pazienteId)
  const nomePaziente = paziente ? `${paziente.nome} ${paziente.cognome}` : pazienteId

  const ordinati = episodi
    ? [...episodi].sort((a, b) => new Date(b.timestamp_fine) - new Date(a.timestamp_fine))
    : []

  return (
    <div className="section active">
      <div className="section-header">
        <div className="section-title">Storico anomalie</div>
        <div className="section-sub">
          Episodi anomali per paziente — validati e in attesa. Clicca per aprire il dettaglio o modificare la valutazione.
        </div>
      </div>

      <div className="storico-toolbar">
        <select value={pazienteId} onChange={(e) => setPazienteId(e.target.value)}>
          <option value="">— Seleziona paziente —</option>
          {pazienti.map((p) => (
            <option key={p.id} value={p.codice_accesso}>
              {p.nome} {p.cognome} ({p.codice_accesso})
            </option>
          ))}
        </select>
        <button className="btn btn-ghost" onClick={caricaStorico} disabled={!pazienteId || caricamento}>
          {caricamento ? 'Caricamento...' : 'Carica'}
        </button>
        {episodi !== null && (
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '0.25rem' }}>
            {episodi.length > 0 ? `${episodi.length} ${episodi.length === 1 ? 'episodio trovato' : 'episodi trovati'}` : ''}
          </span>
        )}
      </div>

      {episodi === null ? (
        <div className="live-panel">
          <div className="table-wrap">
            <div className="empty-state">
              <div className="empty-icon">▤</div>
              Seleziona un paziente per vedere lo storico anomalie
            </div>
          </div>
        </div>
      ) : episodi.length === 0 ? (
        <div className="live-panel">
          <div className="table-wrap">
            <div className="empty-state">
              <div className="empty-icon">✓</div>
              Nessuna anomalia registrata per {nomePaziente}
            </div>
          </div>
        </div>
      ) : (
        <div className="storico-lista">
          {ordinati.map((ep) => (
            <EpisodioStorico key={ep.annotation_ids.join(',')} ep={ep} onClick={() => onApriEpisodio(ep)} />
          ))}
        </div>
      )}
    </div>
  )
}

function EpisodioStorico({ ep, onClick }) {
  let classeEsito = 'in-attesa'
  let iconaEsito = '⏳'
  let testoEsito = <span className="pill pill-amber">In attesa</span>

  if (ep.esito_medico === 'vero_positivo') {
    classeEsito = 'validato-vp'
    iconaEsito = '✅'
    testoEsito = <span className="pill pill-red">Vero positivo</span>
  } else if (ep.esito_medico === 'falso_allarme') {
    classeEsito = 'validato-fa'
    iconaEsito = '❌'
    testoEsito = <span className="pill pill-teal">Falso allarme</span>
  }

  return (
    <button className={`storico-episodio ${classeEsito}`} onClick={onClick}>
      <div style={{ fontSize: '1.1rem', flexShrink: 0 }}>{iconaEsito}</div>
      <div className="storico-ep-info">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <span className="pill pill-red" style={{ fontSize: '0.68rem' }}>anomalo</span>
          <span style={{ fontFamily: 'var(--mono)', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            {(ep.ecg_score_max * 100).toFixed(0)}% picco
          </span>
          {ep.numero_letture > 1 && (
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{formatDurataEpisodio(ep)}</span>
          )}
        </div>
        <div className="storico-ep-ts">{formatIntervalloEpisodio(ep)}</div>
        {ep.note_medico && (
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.1rem', fontStyle: 'italic' }}>
            "{ep.note_medico}"
          </div>
        )}
      </div>
      <div className="storico-ep-esito">{testoEsito}</div>
      <div className="storico-ep-arrow">›</div>
    </button>
  )
}
