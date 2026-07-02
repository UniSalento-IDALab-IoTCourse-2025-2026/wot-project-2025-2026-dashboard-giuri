export function formatTs(ts) {
  if (!ts) return '—'
  try {
    const d = new Date(ts)
    return d.toLocaleString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  } catch {
    return ts
  }
}

export function formatOraBreve(ts) {
  if (!ts) return '—'
  return new Date(ts).toLocaleTimeString('it-IT', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

export function formatIntervalloEpisodio(ep) {
  const inizio = formatTs(ep.timestamp_inizio)
  if (ep.numero_letture <= 1) return inizio
  return `${inizio} → ${formatOraBreve(ep.timestamp_fine)}`
}

export function formatDurataEpisodio(ep) {
  if (ep.numero_letture <= 1) return ''
  const secondi = Math.round(
    (new Date(ep.timestamp_fine) - new Date(ep.timestamp_inizio)) / 1000
  )
  return `${secondi}s · ${ep.numero_letture} letture`
}

const TEMP_PILL_CLASS = {
  ipotermia: 'pill-amber',
  normale: 'pill-teal',
  febbre: 'pill-amber',
  febbre_alta: 'pill-red',
  sconosciuta: 'pill-muted'
}

export function temperaturaPillClass(label) {
  return TEMP_PILL_CLASS[label] || 'pill-muted'
}

/**
 * Sceglie il documento del cluster con lo score ECG più alto — il
 * momento clinicamente più rilevante dell'episodio — da usare per il
 * grafico ECG esteso nel modal.
 */
export function scegliDocumentoPerGrafico(ep) {
  const documenti = ep.documenti || []
  if (documenti.length === 0) return ep
  return documenti.reduce(
    (migliore, doc) => (doc.ecg_score > migliore.ecg_score ? doc : migliore),
    documenti[0]
  )
}
