# PadelClub

**PadelClub** is a comprehensive solution for managing padel clubs, offering court bookings, billing, and member management. It features a modern React frontend and a robust Node.js/Express backend with PostgreSQL.

## 🚀 Features

- **Court Booking**: Interactive calendar for reserving courts.
- **Billing**: Automated invoice generation and payment tracking (Bizum integration logic).
- **Membership**: User management with roles (Admin/User).
- **Mobile First**: PWA-ready design for easy access on mobile devices.

## 🛠️ Tech Stack

- **Frontend**: React, Vite, TailwindCSS, Framer Motion.
- **Backend**: Node.js, Express, Prisma ORM.
- **Database**: PostgreSQL.

## 📦 Installation

1. **Clone the repository**:

   ```bash
   git clone <repository-url>
   cd ClubManager_Pro
   ```

2. **Install dependencies** (Root, Client, and Server):

   ```bash
   npm install
   npm run install:all # If script exists, otherwise:
   cd client && npm install
   cd ../server && npm install
   ```

## ⚙️ Configuration

### Server (`server/.env`)

Create a `.env` file in the `server` directory based on `.env.example`:

```env
PORT=3000
NODE_ENV=development
DATABASE_URL="postgresql://user:password@host:port/db?schema=public"
JWT_SECRET="your_secret_key"
CORS_ORIGIN="*"
```

### Client (`client/.env`)

Create a `.env` file in the `client` directory:

```env
VITE_API_BASE_URL=http://localhost:3000/api
```

## 🏃‍♂️ Running Locally

To start both client and server in development mode:

```bash
npm run dev
```

- **Frontend**: [http://localhost:5173](http://localhost:5173)
- **Backend**: [http://localhost:3000](http://localhost:3000)

## 🏗️ Build for Production

To build both client and server:

```bash
npm run build
```

- **Client Build**: Output in `client/dist`
- **Server Build**: Output in `server/dist`

## 🚢 Deployment (Railway/Vercel)

1. **Database**: Ensure migrations are applied (`npx prisma migrate deploy` in server).
2. **Environment Variables**: Set all production variables in your hosting provider.
3. **Start Command**: `npm start` (runs the compiled server).

## 🛠️ Maintenance & Scripts

Maintenance scripts are located in `server/scripts/`. Useful ones include:

- `apply_indexes_prisma.ts`: Applies recommended database indexes for performance.
- `diagnose_db.ts`: Checks for data consistency and common database issues.
- `fix-rls.ts`: Ensures Row Level Security is correctly configured (when using Supabase/Postgres).
- `backup-db.sh`: Utility to perform a local database backup.

To run a script (from the server directory):

```bash
npx ts-node scripts/diagnose_db.ts
```

## 📄 License

Private - PadelClub System.
