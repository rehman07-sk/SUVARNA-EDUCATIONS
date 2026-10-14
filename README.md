<<<<<<< HEAD
# School Management System — MERN Stack

A semester-project starter built with MongoDB, Express, React, and Node.js. Includes a dashboard, student CRUD, teacher CRUD, search, and a REST API.

## Features
- Dashboard summary (total students, teachers, classes)
- Add, view, edit, and delete students
- Add, view, edit, and delete teachers
- Search students and teachers
- Responsive React UI
- Express REST API with Mongoose models
- Environment-based MongoDB connection

## Requirements
- Node.js 18+ (20+ recommended)
- MongoDB Community Server running locally OR a MongoDB Atlas connection string
- VS Code

## 1. Open in VS Code
Extract the ZIP, then open the `mern-school-management` folder in VS Code.

## 2. Configure MongoDB
Create `server/.env` by copying `server/.env.example` to `.env`.

For local MongoDB:
```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/school_management
CLIENT_URL=http://localhost:5173
```

For MongoDB Atlas, replace `MONGODB_URI` with your Atlas connection string. Do not share your `.env` file or commit it to Git.

## 3. Start the backend
Open a VS Code terminal:
```bash
cd server
npm install
npm run dev
```
Expected message: `MongoDB connected` and `API running on http://localhost:5000`.

## 4. Start the frontend
Open a SECOND VS Code terminal:
```bash
cd client
npm install
npm run dev
```
Open the local URL Vite prints, usually `http://localhost:5173`.

## API endpoints
- `GET /api/health`
- `GET /api/dashboard`
- `GET /api/students`
- `POST /api/students`
- `GET /api/students/:id`
- `PUT /api/students/:id`
- `DELETE /api/students/:id`
- `GET /api/teachers`
- `POST /api/teachers`
- `GET /api/teachers/:id`
- `PUT /api/teachers/:id`
- `DELETE /api/teachers/:id`

## Suggested development plan
1. Run the starter and understand the folder structure.
2. Test create/edit/delete flows for students and teachers.
3. Add classes and subjects.
4. Add attendance records.
5. Add login and role-based access (admin/teacher/student).
6. Add form validation and server-side pagination.
7. Prepare screenshots, ER diagram, use-case diagram, and a short demo for evaluation.

## Common errors
- **MongoDB connection refused:** start MongoDB locally or check the Atlas URI/network access.
- **Port already in use:** change `PORT` in `server/.env` or stop the process using that port.
- **CORS error:** make sure `CLIENT_URL=http://localhost:5173` matches the frontend URL.
- **npm not recognized:** install Node.js LTS, restart VS Code, and run `node -v` and `npm -v`.

## Important
This is a learning/college project starter, not a production-ready school information system. Before using real student data, add authentication, authorization, audit logs, backups, validation, and privacy/security controls.
=======
# SUVARNA-EDUCATIONS
SCHOOL MANAGEMENT SYSTEM FOR SUVARNA EDUCATIONS
>>>>>>> 66f7edbb40a5cf1d259a71be79c28fc28e0fb2c5
