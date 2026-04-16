# Milestone 12: Manual Testing Setup Guide

**Status:** ✅ Code Ready | ⏳ Awaiting Test Data Population

---

## 📋 Quick Start for Manual Browser Testing

### Step 1: Start PocketBase Locally
```bash
cd /home/halraggad/my_work/coding_stuff/manakher_deployed_1/backend
./pocketbase serve
```
- PocketBase admin UI: http://127.0.0.1:8090
- API endpoint: http://127.0.0.1:8090/api

### Step 2: Start Next.js Frontend (in another terminal)
```bash
cd /home/halraggad/my_work/coding_stuff/manakher_deployed_1/frontend
npm run dev
```
- Frontend: http://localhost:3000
- Automatically redirects to http://localhost:3000/ar (Arabic)

### Step 3: Populate Test Data via PocketBase Admin UI

1. Go to http://127.0.0.1:8090 in your browser
2. **Create initial Admin user:**
   - Email: `admin@manakher.com`
   - Password: (your choice)
   - Role: Admin/Superuser
3. **Login** with the admin user
4. **Create test users** in the `users` collection:
   - At least 1 **Teacher** (role: teacher)
   - At least 3-5 **Students** (role: student)
   - Assign students to class sections
5. **Create test data** in other collections:
   - Add some **Homework** assignments (via teacher)
   - Add some **Materials** (via teacher)
   - Create **Announcements** (global scope)
   - Create **Quizzes** (if testing assessments)

### Step 4: Execute Manual Testing Plan

Follow the 8-section testing checklist in `M12_COMPLETION_REPORT.md`:

1. ✅ **Admin Dashboard** - Access all admin pages
2. ✅ **Teacher Dashboard** - Create/manage assignments
3. ✅ **Student Dashboard** - View assignments/grades
4. ✅ **Accessibility** - Test keyboard navigation
5. ✅ **RTL/Arabic** - Verify Arabic display and right-to-left layout
6. ✅ **Mobile** - Test responsiveness on mobile devices
7. ✅ **Error Handling** - Trigger errors and verify graceful handling
8. ✅ **Performance** - Check page load times and interactions

---

## 📁 Important Notes

### Test Data Storage
- **Local:** Test data stored in `backend/pb_data/` (excluded from git)
- **Production:** Real data stays on hosted system (untouched)
- **Clean Separation:** No conflicts between development and production

### Architecture
- **Frontend:** Next.js (28 Arabic + 28 English pages)
- **Backend:** PocketBase (SQLite database)
- **Data:** Kept local during development, pushed to remote when needed

### Committing Work
- ✅ Code changes automatically tracked by git
- ✅ Test data NOT committed (in `.gitignore`)
- ✅ Documentation updated as needed

---

## 🐛 Testing Scenarios

### Admin User Journey
1. Login with admin credentials
2. Navigate to Users page → Create new user
3. Navigate to Settings → Edit school settings
4. Navigate to Subjects/Exams → Create new subject
5. View analytics/reports

### Teacher User Journey
1. Login with teacher credentials
2. Navigate to Homework → Create assignment
3. Navigate to Materials → Upload learning material
4. Navigate to Quizzes → Create quiz
5. View student submissions

### Student User Journey
1. Login with student credentials
2. Navigate to Assessments → View grades
3. Navigate to Quizzes → Take a quiz
4. Navigate to Materials → View class materials
5. Submit homework (if available)

---

## ✅ Success Criteria

All tests pass when:
- ✅ No JavaScript errors in browser console
- ✅ All pages load in < 2 seconds
- ✅ Forms submit successfully
- ✅ CRUD operations work (create, read, update, delete)
- ✅ Keyboard navigation works (Tab, Enter, Escape)
- ✅ RTL layout displays correctly
- ✅ Mobile view is readable and functional
- ✅ Errors show helpful messages

---

## 📞 Troubleshooting

### PocketBase won't start
```bash
# Check if port 8090 is in use
lsof -i :8090
# Kill the process if needed and try again
```

### Frontend shows 404
```bash
# Make sure you're at http://localhost:3000/ar (Arabic)
# Or http://localhost:3000/en (English)
# Default redirects to /ar
```

### Database changes not appearing
```bash
# Clear browser cache (Ctrl+Shift+Delete)
# Reload the page
```

---

**Ready to test!** 🚀

For detailed testing checklist, see: `M12_COMPLETION_REPORT.md`
