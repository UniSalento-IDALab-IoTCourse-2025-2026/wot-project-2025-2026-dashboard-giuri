const VOCI_NAV = [
  { sezione: 'panoramica', icona: '⬡', label: 'Panoramica', gruppo: 'Monitor' },
  { sezione: 'anomalie', icona: '⚠', label: 'Anomalie', gruppo: 'Monitor', badge: true },
  { sezione: 'pazienti', icona: '◎', label: 'Pazienti', gruppo: 'Gestione' },
  { sezione: 'storico', icona: '▤', label: 'Storico', gruppo: 'Gestione' }
]

export default function Sidebar({ sezioneAttiva, onNaviga, numeroAnomalie, medicoNome, onLogout }) {
  const iniziale = medicoNome ? medicoNome.charAt(0).toUpperCase() : '?'
  let gruppoCorrente = null

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-icon" style={{ width: 32, height: 32, borderRadius: 8 }}>
          <img src="/favicon.svg" alt="CardioSense Logo" style={{ height: '1em', width: 'auto' }} />
        </div>
        <div className="brand-name" style={{ fontSize: '1rem' }}>Cardio<span>Sense</span></div>
      </div>

      <nav className="sidebar-nav">
        {VOCI_NAV.map((voce) => {
          const mostraLabelGruppo = voce.gruppo !== gruppoCorrente
          gruppoCorrente = voce.gruppo
          return (
            <div key={voce.sezione}>
              {mostraLabelGruppo && <div className="nav-label">{voce.gruppo}</div>}
              <button
                className={`nav-item${sezioneAttiva === voce.sezione ? ' active' : ''}`}
                onClick={() => onNaviga(voce.sezione)}
              >
                <span className="nav-icon">{voce.icona}</span>
                {voce.label}
                {voce.badge && (
                  <span className={`nav-badge${numeroAnomalie > 0 ? ' visible' : ''}`}>
                    {numeroAnomalie}
                  </span>
                )}
              </button>
            </div>
          )
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="medico-info">
          <div className="avatar">{iniziale}</div>
          <div>
            <div className="medico-name">{medicoNome ? `Dr. ${medicoNome}` : 'Caricamento...'}</div>
            <div className="medico-role">Cardiologo</div>
          </div>
        </div>
        <button className="btn-logout" onClick={onLogout}>Esci dall'account</button>
      </div>
    </aside>
  )
}
