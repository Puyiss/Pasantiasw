import type { DailyReport } from '../types'

export interface ReportExportRow {
  alumno: string
  email?: string
  fecha: string
  contenido: string
  comentarioProfesor?: string
}

function escapeCsv(value: string) {
  const needsQuotes = /[",\n\r]/.test(value)
  const escaped = value.replace(/"/g, '""')
  return needsQuotes ? `"${escaped}"` : escaped
}

export function downloadCsv(filename: string, headers: string[], rows: string[][]) {
  const lines = [headers, ...rows].map((row) => row.map(escapeCsv).join(','))
  const csv = `\uFEFF${lines.join('\r\n')}`
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename.endsWith('.csv') ? filename : `${filename}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export function exportReportsCsv(filename: string, rows: ReportExportRow[]) {
  downloadCsv(
    filename,
    ['Alumno', 'Email', 'Fecha', 'Contenido', 'Comentario profesor'],
    rows.map((r) => [
      r.alumno,
      r.email ?? '',
      r.fecha,
      r.contenido,
      r.comentarioProfesor ?? '',
    ]),
  )
}

export function reportsToExportRows(
  reports: DailyReport[],
  meta: { name: string; email?: string },
): ReportExportRow[] {
  return reports.map((r) => ({
    alumno: meta.name,
    email: meta.email,
    fecha: r.date,
    contenido: r.content,
    comentarioProfesor: r.professorComment,
  }))
}
