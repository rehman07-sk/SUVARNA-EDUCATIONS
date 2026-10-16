# SUVARNA EDUCATIONS — School Management System (MERN Stack)

A school management system starter built with MongoDB, Express, React, and Node.js for SUVARNA EDUCATIONS. Includes a dashboard, student management, teacher management, search, and a REST API.

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
- MongoDB Community Server or MongoDB Atlas
- VS Code

## 1. Open in VS Code

Open the `mern-school-management` project folder in VS Code.

## 2. Configure MongoDB

Create `server/.env` using `server/.env.example` as a reference.

For local MongoDB:

```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/school_management
CLIENT_URL=http://localhost:5173
```

For MongoDB Atlas, use your Atlas connection string for `MONGODB_URI`. Never commit or share your `.env` file.

## 3. Start the backend

Open a VS Code terminal:

```bash
cd server
npm install
npm run dev
```

The expected output should indicate that MongoDB is connected and the API is running on port 5000.

## 4. Start the frontend

Open a second VS Code terminal:

```bash
cd client
npm install
npm run dev
```

Open the local URL printed by Vite, usually `http://localhost:5173`.

## API Endpoints

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

## Suggested Development Plan

1. Run the project and understand the folder structure.
2. Test student and teacher create, edit, and delete operations.
3. Add classes and subjects.
4. Add attendance records.
5. Add authentication and role-based access for administrators, teachers, and students.
6. Add form validation and server-side pagination.
7. Prepare screenshots, diagrams, and a project demonstration.

## Common Errors

- **MongoDB connection refused:** Start local MongoDB or check your Atlas connection string and network access.
- **Port already in use:** Change the backend port or stop the process using it.
- **CORS error:** Check that `CLIENT_URL` matches your frontend URL.
- **npm not recognized:** Install Node.js LTS, restart VS Code, and check `node -v` and `npm -v`.

## Important

This project is a learning starter and is not production-ready. Before using real student data, implement authentication, authorization, audit logs, backups, server-side validation, and appropriate privacy and security controls.
