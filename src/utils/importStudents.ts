import { downloadCsv } from './exportCsv'

export interface StudentImportRow {
  nombre: string
  apellido: string
  email: string
  password: string
  professorEmail: string
  courseName: string
}

function splitCsvLine(line: string): string[] {
  const cells: string[] = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          current += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        current += ch
      }
    } else if (ch === '"') {
      inQuotes = true
    } else if (ch === ',' || ch === ';') {
      cells.push(current.trim())
      current = ''
    } else {
      current += ch
    }
  }
  cells.push(current.trim())
  return cells
}

function normalizeHeader(h: string) {
  return h
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '')
}

const HEADER_MAP: Record<string, keyof StudentImportRow> = {
  nombre: 'nombre',
  apellido: 'apellido',
  email: 'email',
  correo: 'email',
  password: 'password',
  contrasena: 'password',
  clave: 'password',
  professoremail: 'professorEmail',
  emailprofesor: 'professorEmail',
  profesor: 'professorEmail',
  coursename: 'courseName',
  curso: 'courseName',
}

export function parseStudentsCsv(text: string): StudentImportRow[] {
  const lines = text
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
  if (lines.length < 2) throw new Error('El archivo está vacío o no tiene filas de datos.')

  const headers = splitCsvLine(lines[0]).map(normalizeHeader)
  const indexes: Partial<Record<keyof StudentImportRow, number>> = {}
  headers.forEach((h, i) => {
    const key = HEADER_MAP[h]
    if (key) indexes[key] = i
  })

  if (indexes.nombre === undefined || indexes.apellido === undefined) {
    throw new Error('Faltan columnas obligatorias: nombre y apellido.')
  }
  if (indexes.professorEmail === undefined) {
    throw new Error('Falta la columna profesor (email del profesor).')
  }
  if (indexes.courseName === undefined) {
    throw new Error('Falta la columna curso.')
  }

  const rows: StudentImportRow[] = []
  for (let i = 1; i < lines.length; i++) {
    const cells = splitCsvLine(lines[i])
    const nombre = cells[indexes.nombre!] ?? ''
    const apellido = cells[indexes.apellido!] ?? ''
    if (!nombre && !apellido) continue
    const emailRaw =
      indexes.email !== undefined ? cells[indexes.email] ?? '' : ''
    const email =
      emailRaw.trim() ||
      `${nombre}.${apellido}@lujan.edu`.toLowerCase().replace(/\s+/g, '')
    rows.push({
      nombre: nombre.trim(),
      apellido: apellido.trim(),
      email: email.toLowerCase().trim(),
      password:
        (indexes.password !== undefined ? cells[indexes.password] : '')?.trim() ||
        'alu123',
      professorEmail: (cells[indexes.professorEmail!] ?? '').toLowerCase().trim(),
      courseName: (cells[indexes.courseName!] ?? '').trim(),
    })
  }

  if (!rows.length) throw new Error('No se encontraron alumnos válidos en el archivo.')
  return rows
}

export function downloadStudentsTemplate() {
  downloadCsv(
    'plantilla-alumnos.csv',
    ['nombre', 'apellido', 'email', 'password', 'profesor', 'curso'],
    [
      [
        'Lucía',
        'Pérez',
        'lucia.perez@lujan.edu',
        'alu123',
        'profesor@lujan.edu',
        '6to Economía',
      ],
      [
        'Juan',
        'Martínez',
        '',
        'alu123',
        'profesor@lujan.edu',
        '6to Economía',
      ],
    ],
  )
}
