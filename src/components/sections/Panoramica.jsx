import { formatDurataEpisodio, formatIntervalloEpisodio, temperaturaPillClass } from '../../utils/format.js'

export default function Panoramica({ episodi, pazienti, kpiValidateOggi, ultimoAllarme, onVediTutte, onValida }) {
  const cinque = episodi.slice(0, 5)

  return (
    <div className="section active">
      <div className="section-header">
        <div className="section-title">Situazione attuale</div>
        <div className="section-sub">Aggiornamento in tempo reale</div>
      </div>

      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-label">Pazienti monitorati</div>
          <div className="kpi-value teal">{pazienti.length}</div>
          <div className="kpi-meta">registrati nel sistema</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Anomalie in attesa</div>
          <div className="kpi-value red">{episodi.length}</div>
          <div className="kpi-meta">da validare</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Validate oggi</div>
          <div className="kpi-value green">{kpiValidateOggi}</div>
          <div className="kpi-meta">validazioni completate</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Ultimo allarme</div>
          <div className="kpi-value amber">{ultimoAllarme?.ora || '—'}</div>
          <div className="kpi-meta">
            {ultimoAllarme ? `Paziente ${ultimoAllarme.pazienteId}` : 'nessun allarme recente'}
          </div>
        </div>
      </div>

      <div className="live-panel">
        <div className="panel-header">
          <div className="panel-title">
            <div className="live-dot" />
            Anomalie recenti
          </div>
          <button className="panel-action" onClick={onVediTutte}>Vedi tutte →</button>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Paziente</th>
                <th>ECG</th>
                <th>Postura</th>
                <th>Temperatura</th>
                <th>Timestamp</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {cinque.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <div className="empty-state">
                      <div className="empty-icon">◎</div>
                      Nessuna anomalia in attesa
                    </div>
                  </td>
                </tr>
              ) : (
                cinque.map((ep) => (
                  <tr key={ep.annotation_ids.join(',')}>
                    <td>
                      <LabelPaziente ep={ep} />
                    </td>
                    <td>
                      <span className="pill pill-red">anomalo</span>
                      {ep.numero_letture > 1 && (
                        <span style={{ display: 'block', fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                          {formatDurataEpisodio(ep)}
                        </span>
                      )}
                    </td>
                    <td><span className="pill pill-muted">{ep.postura_label || '—'}</span></td>
                    <td><span className={`pill ${temperaturaPillClass(ep.temperatura_label)}`}>{ep.temperatura_label || '—'}</span></td>
                    <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--mono)' }}>
                      {formatIntervalloEpisodio(ep)}
                    </td>
                    <td>
                      <button className="btn btn-teal" style={{ fontSize: '0.72rem', padding: '0.3rem 0.7rem' }} onClick={() => onValida(ep)}>
                        Valida
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function LabelPaziente({ ep }) {
  if (ep.paziente_nome && ep.paziente_cognome) {
    return (
      <>
        {ep.paziente_nome} {ep.paziente_cognome}
        <span style={{ display: 'block', fontFamily: 'var(--mono)', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
          {ep.paziente_id}
        </span>
      </>
    )
  }
  return <span style={{ fontFamily: 'var(--mono)', fontSize: '0.8rem' }}>{ep.paziente_id}</span>
}

export { LabelPaziente }
