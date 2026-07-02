import { useEffect, useState } from 'react'
import EcgChart from './EcgChart.jsx'
import { formatIntervalloEpisodio, formatDurataEpisodio, formatTs, scegliDocumentoPerGrafico } from '../utils/format.js'
import { apiFetch } from '../api/client.js'
import { useAuth } from '../context/AuthContext.jsx'

/**
 * modalita: 'valida' (da sezione Anomalie, non ancora validato) | 'storico' (dettaglio/modifica)
 */
export default function ValidationModal({ episodio, modalita, onClose, onConferma }) {
  const { token, logout } = useAuth()
  const [esitoSelezionato, setEsitoSelezionato] = useState(episodio?.esito_medico || null)
  const [note, setNote] = useState(episodio?.note_medico || '')
  const [salvataggio, setSalvataggio] = useState(false)
  const [documentoGrafico, setDocumentoGrafico] = useState(() => scegliDocumentoPerGrafico(episodio))

  useEffect(() => {
    setEsitoSelezionato(episodio?.esito_medico || null)
    setNote(episodio?.note_medico || '')
    setDocumentoGrafico(scegliDocumentoPerGrafico(episodio))
  }, [episodio])

  if (!episodio) return null

  const giaValidato = Boolean(episodio.esito_medico)
  const intestazionePaziente =
    episodio.paziente_nome && episodio.paziente_cognome
      ? `${episodio.paziente_nome} ${episodio.paziente_cognome} (${episodio.paziente_id})`
      : episodio.paziente_id

  async function aggiornaTracciaEcg(annotationId) {
    const res = await apiFetch(`/annotazioni/${annotationId}`, token, {}, logout)
    if (!res || !res.ok) return
    const fresca = await res.json()
    setDocumentoGrafico((prev) => ({ ...prev, ...fresca }))
  }

  async function handleConferma() {
    if (!esitoSelezionato) return
    setSalvataggio(true)
    try {
      await onConferma({
        annotation_ids: episodio.annotation_ids,
        esito: esitoSelezionato,
        note: note.trim() || null,
        numeroLetture: episodio.annotation_ids.length,
        eraGiaValidato: giaValidato,
        modalita
      })
    } finally {
      setSalvataggio(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-title">
          {modalita === 'storico' ? 'Dettaglio episodio ECG' : 'Valida anomalia ECG'}
        </div>
        <div className="modal-sub">Paziente: {intestazionePaziente}</div>

        {modalita === 'storico' && (
          <BannerEsito esito={episodio.esito_medico} validatoAt={episodio.validato_at} />
        )}

        <div id="modal-ecg-esteso">
          <EcgChart data={documentoGrafico} onRiprova={aggiornaTracciaEcg} />
        </div>

        {episodio.numero_letture > 1 && (
          <div className="modal-info-row">
            <span className="modal-info-key">Episodio</span>
            <span>{episodio.numero_letture} letture consecutive · {formatDurataEpisodio(episodio)}</span>
          </div>
        )}
        <div className="modal-info-row">
          <span className="modal-info-key">
            ECG Score{episodio.numero_letture > 1 ? ' (picco / medio)' : ''}
          </span>
          <span className="pill pill-red">
            {(episodio.ecg_score_max * 100).toFixed(1)}%
            {episodio.numero_letture > 1 ? ` / ${(episodio.ecg_score_medio * 100).toFixed(1)}%` : ''}
          </span>
        </div>
        <div className="modal-info-row">
          <span className="modal-info-key">Postura</span>
          <span>{episodio.postura_label || '—'}</span>
        </div>
        <div className="modal-info-row">
          <span className="modal-info-key">Temperatura</span>
          <span>{episodio.temperatura_valore}°C — {episodio.temperatura_label}</span>
        </div>
        <div className="modal-info-row">
          <span className="modal-info-key">{episodio.numero_letture > 1 ? 'Periodo' : 'Timestamp'}</span>
          <span style={{ fontFamily: 'var(--mono)', fontSize: '0.78rem' }}>
            {formatIntervalloEpisodio(episodio)}
          </span>
        </div>

        <div className="modal-esito-row">
          <button
            className={`esito-btn${esitoSelezionato === 'vero_positivo' ? ' selected-vp' : ''}`}
            onClick={() => setEsitoSelezionato('vero_positivo')}
          >
            ✅ Vero positivo
            <small>Anomalia confermata</small>
          </button>
          <button
            className={`esito-btn${esitoSelezionato === 'falso_allarme' ? ' selected-fa' : ''}`}
            onClick={() => setEsitoSelezionato('falso_allarme')}
          >
            ❌ Falso allarme
            <small>Parametri nella norma</small>
          </button>
        </div>

        <textarea
          className="modal-note"
          rows={3}
          placeholder="Note cliniche (opzionale)..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />

        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={onClose}>Annulla</button>
          <button className="btn btn-primary" onClick={handleConferma} disabled={!esitoSelezionato || salvataggio}>
            {salvataggio ? 'Salvataggio...' : giaValidato ? 'Aggiorna validazione' : 'Conferma validazione'}
          </button>
        </div>
      </div>
    </div>
  )
}

function BannerEsito({ esito, validatoAt }) {
  if (esito === 'vero_positivo') {
    return (
      <div className="esito-banner vp">
        <div>
          <div>✅ Anomalia confermata come vero positivo</div>
          {validatoAt && <div className="esito-banner-note">Validato il {formatTs(validatoAt)}</div>}
        </div>
      </div>
    )
  }
  if (esito === 'falso_allarme') {
    return (
      <div className="esito-banner fa">
        <div>
          <div>❌ Classificato come falso allarme</div>
          {validatoAt && <div className="esito-banner-note">Validato il {formatTs(validatoAt)}</div>}
        </div>
      </div>
    )
  }
  return (
    <div className="esito-banner attesa">
      <div>⏳ In attesa di validazione medica</div>
    </div>
  )
}
