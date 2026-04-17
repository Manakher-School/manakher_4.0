# 🔐 Login Credentials & Testing Guide

## Quick Reference

Use these credentials to login to the Manakher School Platform:

### Admin Account
```
Email:    admin@school.edu
Password: Admin@12345
Role:     Admin
```

### Teacher Account
```
Email:    teacher@school.edu
Password: Teacher@12345
Role:     Teacher
```

### Student Account
```
Email:    student@school.edu
Password: Student@12345
Role:     Student
```

## Access Instructions

1. **Open Browser**: Navigate to `http://localhost:3000`
2. **Choose Language**: Select Arabic (العربية) or English
3. **Enter Credentials**: Use one of the accounts above
4. **Login**: Click the login button
5. **Dashboard**: You should be redirected to your role-specific dashboard

## Role Dashboards

### Admin Dashboard
Access: `http://localhost:3000/ar/dashboard/admin`
- Manage all users (teachers and students)
- Manage classes and sections
- Manage subjects and exam schedules
- View system monitoring metrics
- Content moderation
- Platform settings

### Teacher Dashboard
Access: `http://localhost:3000/ar/dashboard/teacher`
- View assigned sections and students
- Create and manage materials
- Assign and grade homework
- Create and manage quizzes
- Post announcements
- View student submissions

### Student Dashboard
Access: `http://localhost:3000/ar/dashboard/student`
- View announcements and materials
- Submit homework
- Take quizzes
- View exam schedules
- Check grades

## Adding More Users

### Via PocketBase Admin UI
1. Go to `http://127.0.0.1:8090`
2. Login with: `admin@manakher.com` / `Admin@12345`
3. Navigate to the `users` collection
4. Click "New Record"
5. Fill in the form:
   - Email
   - Password (and confirm)
   - Name (Arabic & English)
   - Role (admin, teacher, or student)
6. Save the record

### Via API (curl)
```bash
ADMIN_TOKEN="<your-token-here>"

curl -X POST "http://127.0.0.1:8090/api/collections/users/records" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@school.edu",
    "password": "Password@12345",
    "passwordConfirm": "Password@12345",
    "name_ar": "اسم المستخدم",
    "name_en": "User Name",
    "role": "student",
    "verified": true
  }'
```

## Troubleshooting

### Login Page Not Loading
- Clear browser cache (Ctrl+Shift+Delete)
- Verify frontend is running: `curl http://localhost:3000`
- Check browser console (F12) for errors

### Authentication Failed
- Verify PocketBase is running: `curl http://127.0.0.1:8090/api/health`
- Check email spelling (case-insensitive but must match exactly)
- Ensure password is entered correctly
- Clear browser cache and retry

### Dashboard Not Displaying
- Check browser console (F12) for errors
- Verify you're logged in (check URL for `/dashboard/` prefix)
- Try refreshing the page
- Try logging out and logging back in

## System Requirements

- **Backend**: PocketBase v0.23+ running at `http://127.0.0.1:8090`
- **Frontend**: Next.js 16.2.1 running at `http://localhost:3000`
- **Browser**: Modern browser with JavaScript enabled
- **Network**: Local network access (127.0.0.1)

## Starting the Application

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

Both services should be running for the application to work properly.

## Session Details

- **Last Updated**: 2026-04-17
- **Test Data Status**: 3 users seeded and verified
- **Build Status**: All 56 pages compile (zero errors)
- **Backend Status**: Operational and verified
- **Frontend Status**: Running and optimized

---

**Need help?** Check the browser console (F12) for detailed error messages, or review the project documentation.
