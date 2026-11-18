export const fmtMinutes = (val?: number | null): string => {
  if (val == null) return '—'
  if (val < 1) return `${Math.round(val * 60)}s`
  return `${val.toFixed(1)} min`
}

export const fmtDate = (d?: string | null): string => {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

export const fmtDateTime = (d?: string | null): string => {
  if (!d) return '—'
  return new Date(d).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export const fmtRelative = (d?: string | null): string => {
  if (!d) return '—'
  const diff = Date.now() - new Date(d).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export const fmtPct = (val?: number | null): string =>
  val == null ? '—' : `${val.toFixed(1)}%`
