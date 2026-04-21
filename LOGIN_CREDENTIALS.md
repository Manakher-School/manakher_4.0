# Login Credentials & Testing Guide

## Quick Reference

Use these credentials to login to the Manakher School Platform:

### Admin Account
```
Email:    admin@manakher.edu.jo
Password: Admin123!
Role:     Admin
```

### Teacher Accounts
```
Email:    rania@manakher.edu.jo
Email:    hanadi@manakher.edu.jo
Email:    isra@manakher.edu.jo
Email:    amani@manakher.edu.jo
Email:    kawthar@manakher.edu.jo
Email:    maysa@manakher.edu.jo
Email:    dua@manakher.edu.jo
Email:    heba@manakher.edu.jo
Email:    aseel@manakher.edu.jo
Email:    wejdan@manakher.edu.jo
Email:    asma@manakher.edu.jo
Email:    riham@manakher.edu.jo
Email:    duha@manakher.edu.jo
Email:    izdehar@manajher.edu.jo   (note: manajher, not manakher)
Password: (set individually per teacher)
Role:     Teacher
```

### Student Accounts
```
Note: Student accounts do NOT have email addresses in the database.
They cannot log in via email/password authentication until emails are assigned.
```

## Access Instructions

1. **Open Browser**: Navigate to the production URL or `http://localhost:3000`
2. **Choose Language**: Select Arabic or English
3. **Enter Credentials**: Use one of the accounts above
4. **Login**: Click the login button
5. **Dashboard**: You should be redirected to your role-specific dashboard

## Role Dashboards

### Admin Dashboard
- Manage all users (teachers and students)
- Manage classes and sections
- Manage subjects and exam schedules
- View system monitoring metrics
- Content moderation
- Platform settings

### Teacher Dashboard
- View assigned sections and students
- Create and manage materials
- Assign and grade homework
- Create and manage quizzes
- Post announcements
- View student submissions

### Student Dashboard
- View announcements and materials
- Submit homework
- Take quizzes
- View exam schedules
- Check grades

## PocketBase Admin UI

### Production
- URL: `https://pocketbase-production-882e.up.railway.app/_/`
- Login with your PocketBase superuser credentials

### Adding More Users

Via PocketBase Admin UI:
1. Go to the PocketBase admin URL above
2. Navigate to the `users` collection
3. Click "New Record"
4. Fill in: Email, Password, name_ar, name_en, role, and set `verified = true`
5. Save the record

Via API (curl):
```bash
ADMIN_TOKEN="<your-admin-auth-token>"

curl -X POST "https://pocketbase-production-882e.up.railway.app/api/collections/users/records" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@manakher.edu.jo",
    "password": "Password123!",
    "passwordConfirm": "Password123!",
    "name_ar": "اسم المستخدم",
    "name_en": "User Name",
    "role": "teacher",
    "verified": true
  }'
```

## Troubleshooting

### Authentication Failed (400 Error)
- **Double-check the email domain**: It must end in `@manakher.edu.jo` (not `@school.edu`)
- Verify PocketBase is accessible: `curl https://pocketbase-production-882e.up.railway.app/api/health`
- Check email spelling carefully (case-insensitive but must match exactly)
- Ensure password is entered correctly
- Clear browser cache and retry

### Teacher Cannot Login
- Teachers must have `verified: true` in the database. If login fails, check the `verified` field in PocketBase admin.
- If "Require email verification" is enabled on the users collection, all users need `verified: true` to authenticate.

### Student Cannot Login
- Student accounts currently have no email addresses assigned. They need emails before they can log in.
- Assign emails via PocketBase admin or API, and set `verified: true`.

### Dashboard Not Displaying
- Check browser console (F12) for errors
- Verify you're logged in (check URL for `/dashboard/` prefix)
- Try refreshing the page
- Try logging out and logging back in

## Known Issues

1. **Teacher accounts are `verified: false`** — If PocketBase requires email verification for auth, teachers cannot log in. Fix: set `verified: true` for each teacher in PocketBase admin, or disable "Require email verification" on the users collection.
2. **Student accounts have no emails** — Students cannot log in until emails are assigned.
3. **One teacher has a typo in their email domain**: `izdehar@manajher.edu.jo` (should be `manakher`).

## System Requirements

- **Backend**: PocketBase hosted on Railway at `https://pocketbase-production-882e.up.railway.app`
- **Frontend**: Next.js 16.2.1 (local dev: `http://localhost:3000`, production: Netlify)
- **Browser**: Modern browser with JavaScript enabled

## Starting the Application (Local Development)

### Start Backend (PocketBase)
```bash
cd backend
./pocketbase serve
```

### Start Frontend (Next.js)
```bash
cd frontend
npm run dev
```

Both services should be running for local development. The frontend connects to the production PocketBase by default (via `NEXT_PUBLIC_POCKETBASE_URL` in `.env`).

---

**Need help?** Check the browser console (F12) for detailed error messages, or review the project documentation.