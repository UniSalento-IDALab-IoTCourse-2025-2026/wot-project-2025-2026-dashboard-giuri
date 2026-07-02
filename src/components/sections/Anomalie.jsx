import { formatDurataEpisodio, formatIntervalloEpisodio, temperaturaPillClass } from '../../utils/format.js'
import { LabelPaziente } from './Panoramica.jsx'

export default function Anomalie({ episodi, onRefresh, onValida }) {
  return (
    <div className="section active">
      <div className="section-header">
        <div className="section-title">Anomalie da validare</div>
        <div className="section-sub">Clicca su "Valida" per classificare ogni evento</div>
      </div>

      <div className="live-panel">
        <div className="panel-header">
          <div className="panel-title">
            <div className="live-dot" />
            In attesa di validazione medica
          </div>
          <button className="btn btn-ghost" style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }} onClick={onRefresh}>
            ⟳ Aggiorna
          </button>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Paziente ID</th>
                <th>ECG Score</th>
                <th>Postura</th>
                <th>Temperatura</th>
                <th>Rilevata</th>
                <th>Azione</th>
              </tr>
            </thead>
            <tbody>
              {episodi.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <div className="empty-state">
                      <div className="empty-icon">✓</div>
                      Nessuna anomalia in attesa
                    </div>
                  </td>
                </tr>
              ) : (
                episodi.map((ep) => (
                  <tr key={ep.annotation_ids.join(',')}>
                    <td><LabelPaziente ep={ep} /></td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span className="pill pill-red">anomalo</span>
                        <span style={{ fontFamily: 'var(--mono)', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          {(ep.ecg_score_max * 100).toFixed(0)}% picco
                        </span>
                      </div>
                      {ep.numero_letture > 1 && (
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                          {formatDurataEpisodio(ep)} · media {(ep.ecg_score_medio * 100).toFixed(0)}%
                        </div>
                      )}
                    </td>
                    <td><span className="pill pill-muted">{ep.postura_label || '—'}</span></td>
                    <td><span className={`pill ${temperaturaPillClass(ep.temperatura_label)}`}>{ep.temperatura_label || '—'}</span></td>
                    <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--mono)' }}>
                      {formatIntervalloEpisodio(ep)}
                    </td>
                    <td>
                      <button className="btn btn-teal" style={{ fontSize: '0.72rem', padding: '0.3rem 0.7rem' }} onClick={() => onValida(ep)}>
                        Valida{ep.numero_letture > 1 ? ` (${ep.numero_letture})` : ''}
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
