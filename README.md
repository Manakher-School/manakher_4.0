# Manakher Educational Platform

A comprehensive, bilingual (Arabic and English) educational platform designed to centralize school activities, resources, and communication. Built to serve students from Kindergarten to higher grades, this platform provides a calm, structured, and professional digital environment for the entire school community.

[![Netlify Status](https://api.netlify.com/api/v1/badges/04b89d8d-5a50-4649-b974-80e192c0ef60/deploy-status)](https://app.netlify.com/projects/manakherschool/deploys)

---

## 🌟 Platform Overview

The Manakher platform bridges the gap between the classroom and home by providing specialized, role-based tools:

### Core Features

* **Homework Management:** A complete system to assign, submit, and track homework with automatic grading for interactive tasks.
* **Educational Materials:** A centralized resource library where study files, videos, and documents can be accessed by subject and grade level.
* **Interactive Quizzes:** Timed, multiple-choice quizzes featuring automated grading and progress tracking.
* **News & Announcements:** A central feed for school-wide or section-specific updates, events, and notices, complete with a community commenting system.
* **Exam Schedules:** Clear, accessible timetables for upcoming midterm, final, and practical exams.
* **Offline Access:** Core content remains accessible even without an active internet connection.

### User Roles & Capabilities

* **🎓 Students:** Access a personalized, grade-specific dashboard. Students can view and download study materials, submit online or on-site homework, take timed interactive quizzes, view exam schedules, and engage with school announcements.
* **👩‍🏫 Teachers:** Manage assigned subjects and class sections. Teachers can create and publish rich-text educational materials, assign homework, build interactive quizzes, review and grade student submissions, and post announcements for their specific classes.
* **🛡️ Administrators:** Maintain ultimate global control over the platform. Administrators can manage all user accounts, structure the academic year (creating grades, sections, and subjects), unconditionally moderate all content and communications, and monitor system-wide engagement metrics.

---

## 🛠️ Tech Stack

This project utilizes a modern, decoupled architecture designed for speed, reliability, and strict design adherence:

* **Frontend:** Next.js (App Router) & React
* **Backend & Database:** PocketBase (Single-file SQLite database, authentication, and file storage)
* **Styling:** Tailwind CSS v4 (using native CSS variables for a strict, minimalistic design system)
* **Rich Text Editing:** Tiptap v3 (with DOMPurify for secure HTML rendering)
* **Typography:** Cairo font (optimized for Arabic-First RTL layout and English LTR fallback)

---

## 🚀 Cross-Platform Setup Guide

Because the backend relies on PocketBase, spinning up the development environment is incredibly fast and native to any operating system (Linux, macOS, or Windows) without needing Docker.

### 1. Prerequisites

Ensure you have the following installed on your machine:

* **Node.js** (v18.x or higher (I recommend v20))
* **Git**
* **PocketBase Executable** (Download the single binary for your specific OS from the [PocketBase website](https://pocketbase.io/docs/))

### 2. Clone the Repository

```bash
git clone [https://github.com/AhmedHodiani/manakher.git](https://github.com/AhmedHodiani/manakher.git)
cd manakher
git checkout hussam_2.0
```

### 3. Start the Backend (PocketBase)

Navigate to the backend directory where your PocketBase executable is located. 

```bash
cd backend
```

**Run the server command based on your Operating System:**

* **Linux / macOS:**

  ```bash
  ./pocketbase serve
  ```

* **Windows (Command Prompt / PowerShell):**

  ```cmd
  pocketbase.exe serve
  ```
*The backend API and Admin Dashboard will now be running at `http://127.0.0.1:8090`.*

### 4. Start the Frontend (Next.js)
Open a **new** terminal window, leave the backend running, and navigate to the frontend directory:

```bash
cd frontend

# Install all required React/Next.js dependencies
npm install

# Or install the v20 of it
npm install 20

# Start the Next.js development server
npm run dev
```

*The web application will now be running at `http://localhost:3000`.*

---

## 🧪 Testing & Exploration

The database is pre-seeded with test accounts across all roles. The routing engine automatically enforces role-based access control (RBAC) and directs users to their designated dashboards.

Navigate to `http://localhost:3000/login` and use the following credentials to explore the platform:

| Role | Email | Password |
| :--- | :--- | :--- |
| **Admin** | `admin@school.edu` | `Admin@12345` |
| **Teacher** | `teacher@school.edu` | `Teacher@12345` |
| **Student** | `student@school.edu` | `Student@12345` |

*(Note: To access the raw PocketBase database interface, navigate to `http://127.0.0.1:8090/_/` and log in with the superuser credentials: `admin@manakher.com` / `Admin@12345`), or create a new one with given credentials here*

---

## 🏗️ Contribution & Development Rules

If you are developing or running AI agents on this codebase, you **must** adhere to the following strict guidelines:

1. **Single Source of Truth:** Always refer to `journal.md` for project milestones, completed tasks, and iteration history.
2. **Design System:** Maintain a minimal, gentle, and clean aesthetic. No playful naming conventions, no emojis, and no heavy animations.
3. **Iteration Logging:** Every completed task or bug fix must be manually logged in the `journal.md` file, including details on what was fixed and any issues encountered to preserve context for future development.
