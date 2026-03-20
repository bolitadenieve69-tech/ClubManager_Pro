# ClubManager Pro — Guía del Proyecto

## Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | React 18 + TypeScript, Vite, TailwindCSS, Framer Motion, React Router 6 |
| Backend | Node.js 20+, Express 4, TypeScript |
| ORM / DB | Prisma 5 + PostgreSQL (Supabase) |
| Auth | JWT (7d expiry) — payload: `{ userId, clubId, role, email }` |
| Push | Web Push (VAPID) via `web-push` |
| PDF | pdfkit |
| Excel | exceljs |
| Validación | Zod (cliente y servidor) |
| Hosting FE | Vercel |
| Hosting BE | Render (`clubmanager-pro.onrender.com`) |
| DB | Supabase PostgreSQL |

---

## Estructura del proyecto

```
ClubManager_Pro/
├── client/src/
│   ├── pages/          # Pantallas admin y móvil (40+ componentes)
│   ├── components/ui/  # Componentes reutilizables
│   ├── lib/            # apiFetch, auth, utils (fmtSlot, etc.)
│   └── App.tsx         # Router principal
├── server/src/
│   ├── routes/         # 22 archivos de rutas API
│   ├── middleware/     # authMiddleware, adminOnly, errorHandler
│   ├── utils/          # pricing, validation (timezone), pdf, push
│   ├── db/             # Cliente Prisma
│   └── index.ts        # Servidor Express
├── server/prisma/
│   ├── schema.prisma   # Modelos y enums
│   └── migrations/     # Migraciones aplicadas
├── vercel.json         # Reescribe /api/* → Render
└── CLAUDE.md           # Este archivo
```

---

## Variables de entorno

### Backend (`server/.env`)
```env
PORT=3000
NODE_ENV=production
DATABASE_URL="postgresql://..."       # Supabase (pooler)
DIRECT_URL="postgresql://..."         # Supabase (directo, para migraciones)
JWT_SECRET="..."
CORS_ORIGIN="https://tu-app.vercel.app"
VAPID_EMAIL="mailto:admin@tupadelclub.com"
VAPID_PUBLIC_KEY="..."
VAPID_PRIVATE_KEY="..."
REGISTER_SECRET="..."                 # Opcional: código para registrarse
```

### Frontend (`client/.env`)
```env
VITE_API_BASE_URL=https://clubmanager-pro.onrender.com/api
```

---

## Multi-tenancy

- **Cada admin pertenece a un club** (`club_id` en el JWT).
- Todo query filtra por `req.user?.clubId` — cero visibilidad cruzada entre clubs.
- Al registrarse, se crea automáticamente un `Club` vacío y el user como `ADMIN`.
- Login devuelve `needsSetup: !club.display_name` → redirige a `/setup` si el club no está configurado.
- Roles: `ADMIN` (acceso total al panel) | `USER` (acceso móvil PWA).

---

## Rutas API principales

| Ruta | Función |
|------|---------|
| `POST /auth/register` | Crea user + club vacío, devuelve JWT |
| `POST /auth/login` | Devuelve JWT + `needsSetup` |
| `PATCH /club` | Configura nombre, logo, fiscal, pagos |
| `GET /reservations/availability` | Huecos libres por fecha y duración |
| `POST /bookings` | Crea reserva (admin) |
| `GET /bookings/new-count?since=` | Reservas nuevas desde timestamp (badge admin) |
| `POST /announcements/quick-send` | Envía mensaje a todos los socios (URLs WhatsApp) |
| `POST /push/subscribe` | Guarda endpoint Web Push del admin |
| `GET /members` | Listado de socios del club |
| `GET /invoices` | Facturas del club |
| `GET /tournaments` | Torneos del club |

> **Importante:** rutas con nombre fijo (p.ej. `/new-count`) deben declararse ANTES de rutas paramétricas (`/:id`).

---

## Timezone

- **Todo se almacena en UTC** en la BD.
- **Todo se muestra en Europe/Madrid** (UTC+1 invierno / UTC+2 verano DST).
- Utilidades en `server/src/utils/validation.ts`:
  - `getSpainHHMM(date)` → `"HH:MM"` en hora española
  - `getSpainDay(date)` → índice día semana (0=dom) en hora española
  - `spainLocalToUtc(dateStr, timeStr)` → convierte hora local española a UTC para guardar en BD
- En el cliente: `fmtSlot(isoStr)` en `client/src/lib/utils.ts` usa `date-fns` con el navegador en hora local (España).

---

## Flujo de reservas

1. Cliente llama `GET /reservations/availability?date=&duration=` → lista de huecos libres
2. Crea reserva → `POST /bookings` → estado `HOLD` (expira en 15 min por defecto)
3. Procesa pago → estado `CONFIRMED`
4. Estrategias de pago: `SINGLE` (un pagador) | `SPLIT` (por jugador → `PaymentShare`)
5. Reservas PWA (socios) → aparecen en badge del admin sidebar

---

## Notificaciones al admin

### Badge in-app (implementado)
- Polling cada 30s a `/bookings/new-count?since=<localStorage>`
- Badge rojo animado en nav "Reservas"
- Se limpia al visitar `/reservations`

### Web Push nativo (implementado)
- VAPID keys en variables de entorno del servidor
- Admin se suscribe al cargar el panel (`/push/subscribe`)
- Al crear reserva PWA, servidor llama `webpush.sendNotification()`
- Limpieza automática de suscripciones caducadas (410/404)

---

## Pantallas frontend

### Panel Admin
`/dashboard` · `/courts` · `/rates` · `/prices` · `/reservations` · `/schedule` · `/invoices` · `/billing` · `/accounting` · `/closeouts` · `/movements` · `/tournaments` · `/members` · `/settings` · `/comunicaciones` · `/analytics` · `/insights` · `/reports` · `/expenses`

### Móvil / PWA (socios)
`/m` · `/m/book` · `/m/booking/:id` · `/m/history` · `/m/profile`

### Auth / Onboarding
`/login` · `/setup` (wizard 3 pasos: identidad, fiscal, pagos)

### Pública
`/join/:token` · `/m/accept/:token` — aceptar invitación

---

## Convenciones de código

- `asyncHandler(fn)` envuelve todas las rutas para capturar errores async.
- `ApiError(statusCode, code, message)` para errores de negocio.
- Zod parsea y valida el body antes de cualquier lógica.
- `apiFetch()` en el cliente inyecta Bearer token automáticamente.
- Transacciones Prisma para operaciones multi-paso (reserva + shares).
- Mensajes de error en **español (es-ES)**.
- Commits en inglés con `Co-Authored-By: Claude Sonnet 4.6`.

---

## Despliegue

- **Frontend:** `cd client && npm run build` → Vercel auto-deploy en push a `main`
- **Backend:** Render auto-deploy en push a `main`, corre `entrypoint.sh` (migraciones → servidor)
- **Migraciones:** `npx prisma migrate deploy` (nunca `migrate dev` en producción)
- **Docker:** multi-stage build disponible en `server/Dockerfile`
