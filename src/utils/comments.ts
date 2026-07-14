const key = (userId: string) => `pasantias_comments_seen_${userId}`

export function getCommentsSeenAt(userId: string): string | null {
  try {
    return localStorage.getItem(key(userId))
  } catch {
    return null
  }
}

export function markCommentsSeen(userId: string, at = new Date().toISOString()) {
  try {
    localStorage.setItem(key(userId), at)
  } catch {
    /* ignore */
  }
}

export function isCommentUnread(
  professorCommentAt: string | undefined,
  seenAt: string | null,
): boolean {
  if (!professorCommentAt) return false
  if (!seenAt) return true
  return new Date(professorCommentAt).getTime() > new Date(seenAt).getTime()
}

export function todayISO(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Solo se puede editar el reporte cuya fecha es hoy (día calendario local). */
export function canEditReport(reportDate: string): boolean {
  return reportDate === todayISO()
}
