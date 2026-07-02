export default function EcgChart({ data, onRiprova }) {
  if (!data?.ecg_window_pronta || !data?.ecg_window || data.ecg_window.length === 0) {
    return (
      <div
        style={{
          margin: '0.5rem 0 1.25rem',
          padding: '1rem',
          background: 'var(--surface2)',
          borderRadius: 8,
          border: '1px solid var(--border)',
          textAlign: 'center'
        }}
      >
        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.6rem' }}>
          ⏳ Traccia ECG (30s) in elaborazione — attendo i campioni successivi all'anomalia
        </div>
        <button className="btn btn-ghost" style={{ fontSize: '0.72rem' }} onClick={() => onRiprova?.(data._id)}>
          Riprova
        </button>
      </div>
    )
  }

  const campioni = data.ecg_window
  const sampleRate = data.ecg_window_sample_rate || 250
  const indiceAnomalia = data.ecg_window_anomalia_index ?? Math.floor(campioni.length / 2)

  const width = 420
  const height = 150
  const padding = 18
  const n = campioni.length
  const min = Math.min(...campioni, -1)
  const max = Math.max(...campioni, 1)
  const range = max - min || 1

  const x = (i) => padding + (n <= 1 ? 0 : (i / (n - 1)) * (width - padding * 2))
  const y = (v) => height - padding - ((v - min) / range) * (height - padding * 2)

  const polyline = campioni.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ')
  const xAnomalia = x(Math.min(indiceAnomalia, n - 1))
  const durataSec = Math.round(n / sampleRate)

  return (
    <div style={{ margin: '0.5rem 0 1.25rem' }}>
      <div
        style={{
          fontSize: '0.72rem',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: 'var(--text-muted)',
          marginBottom: '0.5rem'
        }}
      >
        Traccia ECG · {durataSec}s (prima e dopo l'evento di picco)
      </div>
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        style={{
          width: '100%',
          maxWidth: width,
          background: 'var(--surface2)',
          borderRadius: 8,
          border: '1px solid var(--border)',
          display: 'block'
        }}
      >
        <rect x={(xAnomalia - 2).toFixed(1)} y="0" width="4" height={height} fill="var(--red)" opacity="0.25" />
        <polyline points={polyline} fill="none" stroke="var(--teal)" strokeWidth="1.3" />
        <line
          x1={xAnomalia.toFixed(1)}
          y1="0"
          x2={xAnomalia.toFixed(1)}
          y2={height}
          stroke="var(--red)"
          strokeWidth="1.5"
          strokeDasharray="4,3"
        />
      </svg>
      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
        Linea rossa = istante di score più alto nell'episodio
      </div>
    </div>
  )
}
