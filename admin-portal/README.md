# Healthcare Admin Portal

React + Vite web portal to manage doctors, receptionists, and view live queues.

## Prerequisites
- Node.js 18+
- Backend API running (ASP.NET Core)

## Configure backend (Admin seed)

To create the first Admin user, set these **backend** config values (recommended via environment variables):
- `Admin:SeedEmail`
- `Admin:SeedPassword`
- `Admin:SeedName` (optional)

On backend startup, if `Admins` table is empty and `Admin:SeedEmail` + `Admin:SeedPassword` are provided, it will insert the admin (idempotent by email).

### Default admin (development)
If you do **not** provide seed config and the backend is running in **Development**, the backend will create:
- Email: `admin@clinic.com`
- Password: `admin123`

Change it after first login.

Admin login endpoint:
- `POST /api/auth/admin/login` `{ "email": "...", "password": "..." }`

## Configure portal API URL

Create `admin-portal/.env`:

```bash
VITE_API_BASE_URL=http://localhost:5000
```

## Run

```bash
cd admin-portal
npm install
npm run dev
```

Then open the portal at `http://localhost:5173`.

## Features (v1)
- Admin login
- Admins: list, create, activate/deactivate, reset password
- Doctors: list, create, edit, activate/deactivate, reset password
- Receptionists: list, create, edit, activate/deactivate, reset password
- Queue: view active queue entries across doctors

