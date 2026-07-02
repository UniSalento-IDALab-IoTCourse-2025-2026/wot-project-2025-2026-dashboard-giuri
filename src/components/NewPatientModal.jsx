import { useState } from 'react'

export default function NewPatientModal({ onClose, onCrea }) {
  const [nome, setNome] = useState('')
  const [cognome, setCognome] = useState('')
  const [pazienteCreato, setPazienteCreato] = useState(null)
  const [creazione, setCreazione] = useState(false)
  const [errore, setErrore] = useState('')

  async function handleCrea() {
    if (!nome.trim() || !cognome.trim()) {
      setErrore('Inserisci nome e cognome del paziente')
      return
    }
    setErrore('')
    setCreazione(true)
    try {
      const paziente = await onCrea({ nome: nome.trim(), cognome: cognome.trim() })
      setPazienteCreato(paziente)
    } catch (e) {
      setErrore('Impossibile creare il paziente')
    } finally {
      setCreazione(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-title">Aggiungi paziente</div>
        <div className="modal-sub">Il sistema genererà un codice di accesso univoco</div>

        <div className="form-row">
          <div className="form-field">
            <label htmlFor="nome-paziente">Nome</label>
            <input
              id="nome-paziente"
              type="text"
              placeholder="Mario"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              disabled={Boolean(pazienteCreato)}
            />
          </div>
          <div className="form-field">
            <label htmlFor="cognome-paziente">Cognome</label>
            <input
              id="cognome-paziente"
              type="text"
              placeholder="Rossi"
              value={cognome}
              onChange={(e) => setCognome(e.target.value)}
              disabled={Boolean(pazienteCreato)}
            />
          </div>
        </div>

        {errore && <div className="error" style={{ marginBottom: '1rem' }}>{errore}</div>}

        {pazienteCreato && (
          <div style={{ marginBottom: '1.25rem' }}>
            <div
              style={{
                fontSize: '0.72rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: 'var(--text-muted)',
                marginBottom: '0.4rem'
              }}
            >
              Codice di accesso
            </div>
            <div
              style={{
                fontFamily: 'var(--mono)',
                fontSize: '1.5rem',
                fontWeight: 700,
                color: 'var(--teal)',
                letterSpacing: '0.15em'
              }}
            >
              {pazienteCreato.codice_accesso}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              Comunica questo codice al paziente per l'app
            </div>
          </div>
        )}

        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={onClose}>Chiudi</button>
          {!pazienteCreato && (
            <button className="btn btn-primary" onClick={handleCrea} disabled={creazione}>
              {creazione ? 'Creazione...' : 'Crea paziente'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
