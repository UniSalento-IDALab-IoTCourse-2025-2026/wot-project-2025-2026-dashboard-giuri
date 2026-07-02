export default function Pazienti({ pazienti, onNuovoPaziente }) {
  return (
    <div className="section active">
      <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div className="section-title">Pazienti</div>
          <div className="section-sub">Gestisci i tuoi pazienti monitorati</div>
        </div>
        <button className="btn btn-primary" onClick={onNuovoPaziente}>+ Nuovo paziente</button>
      </div>

      <div className="patient-grid">
        {pazienti.length === 0 ? (
          <div className="empty-state" style={{ gridColumn: '1 / -1' }}>
            <div className="empty-icon">◎</div>
            Nessun paziente registrato
          </div>
        ) : (
          pazienti.map((p) => (
            <div className="patient-card" key={p.id}>
              <div className="patient-header">
                <div className="patient-avatar">
                  {p.nome.charAt(0)}{p.cognome.charAt(0)}
                </div>
                <div>
                  <div className="patient-name">{p.nome} {p.cognome}</div>
                  <div className="patient-code">{p.codice_accesso}</div>
                </div>
              </div>
              <div className="patient-meta">
                <div className="patient-meta-row">
                  <span className="patient-meta-key">Codice accesso</span>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: '0.78rem', color: 'var(--teal)' }}>
                    {p.codice_accesso}
                  </span>
                </div>
                <div className="patient-meta-row">
                  <span className="patient-meta-key">ID interno</span>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    #{p.id}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
