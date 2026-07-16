# Contrato API — Pasantías

El frontend llama a `VITE_API_URL` con **POST** y body JSON:

```json
{ "action": "login", "email": "...", "password": "..." }
```

Respuesta esperada:

```json
{ "ok": true, "data": { ... } }
```

o

```json
{ "ok": false, "error": "mensaje" }
```

Con `VITE_USE_MOCK=true` el frontend no llama a la red y usa datos en memoria (`src/api/mock.ts`).

## Acciones

| action | Payload principal | `data` |
|--------|-------------------|--------|
| `register` | `nombre`, `apellido`, `email`, `password`, `role=responsable` | `SessionUser` |
| `listMentors` | — | mentores (`responsable`) |
| `updateProfile` | incluye `responsableNombre`, `mentorId`, `horariosSemana` (Lun–Vie entrada/salida) | `StudentProfile` |
| `listUsers` | — | `User[]` |
| `listProfessors` | — | `User[]` (role=profesor) |
| `listStudents` | `professorId?` | alumnos + `profile` opcional |
| `createUser` | `name`, `email`, `password`, `role`, `professorId?`, `courseId?`, `courseName?` | `User` |
| `updateUser` | `id`, `name?`, `email?`, `password?` | `User` |
| `deleteUser` | `id` | `{ deleted }` |
| `listCourses` | — | `Course[]` |
| `getCourseByProfessor` | `professorId` | `Course \| null` |
| `createCourse` | `name`, `professorId` | `Course` |
| `updateCourse` | `id`, `name?`, `professorId?` | `Course` |
| `getProfile` | `studentId` | `StudentProfile` |
| `updateProfile` | `studentId`, `empresa?`, `lugarPasantia?`, `horarios?` (formato `Lun-Vie 9:00-13:00`), `professorId?` (solo si aún no estaba asignado), `courseId?`, `setupCompleted?` | `StudentProfile` |
| `assignStudent` | `studentId`, `professorId`, `courseId` | `StudentProfile` |
| `listReports` | `studentId?`, `professorId?` | `DailyReport[]` |
| `createReport` | `studentId`, `date`, `content` — **un solo reporte por alumno/día** | `DailyReport` |
| `updateReport` | `reportId`, `studentId`, `content` — **solo si la fecha del reporte es hoy** | `DailyReport` |
| `commentReport` | `reportId`, `professorId`, `comment` | `DailyReport` (con `professorComment`) |
| `getStudentDetail` | `studentId` | `{ user, profile, reports, course }` |
| `getStats` | — | `AdminStats` (alumnos activos, reportes hoy/semana, etc.) |

## Tipos

### User
`id`, `email`, `role` (`admin` \| `profesor` \| `alumno`), `name`  
(`password` solo en create/login del lado servidor; no devolverlo en listados)

### Course
`id`, `name`, `professorId`

### StudentProfile
`studentId`, `empresa`, `lugarPasantia`, `horarios`, `courseId`, `professorId`, `setupCompleted`

### DailyReport
`id`, `studentId`, `date` (YYYY-MM-DD), `content`, `createdAt` (ISO),  
opcionales: `editedAt`, `professorComment`, `professorCommentAt`, `professorCommentBy`, `professorCommentByName`

### AdminStats
`professors`, `students`, `studentsActive`, `studentsPendingSetup`, `courses`,  
`reportsToday`, `reportsThisWeek`, `commentsThisWeek`, `weekStart`, `weekEnd`
