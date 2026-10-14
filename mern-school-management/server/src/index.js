
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import dns from "node:dns";

import studentRoutes from "./routes/students.js";
import teacherRoutes from "./routes/teachers.js";
import authRoutes from "./routes/auth.js";

import Student from "./models/Student.js";
import Teacher from "./models/Teacher.js";
import FeePayment from "./models/FeePayment.js";
import Attendance from "./models/Attendance.js";
import { authenticateToken, allowRoles } from "./middleware/auth.js";

import markRoutes from "./routes/marks.js";

import attendanceRoutes from "./routes/attendance.js";
import feeRoutes from "./routes/fees.js";

dns.setServers(["8.8.8.8", "1.1.1.1"]);
dotenv.config();

const app = express();

const allowedClientOrigins = (process.env.CLIENT_URL || "http://localhost:5173,https://localhost")
  .split(",").map((origin) => origin.trim()).filter(Boolean);
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedClientOrigins.includes(origin)) return callback(null, true);
    return callback(new Error("This client origin is not allowed by CORS."));
  },
}));

app.use(express.json());
app.use("/api/marks", markRoutes);

app.use("/api/auth", authRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/teachers", teacherRoutes);

app.use("/api/attendance", attendanceRoutes);
app.use("/api/fees", feeRoutes);
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "school-management-api" });
});

app.get("/api/dashboard", authenticateToken, allowRoles("admin"), async (_req, res, next) => {
  try {
    const now = new Date();
    const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const tomorrow = new Date(today); tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    const [students, teachers, classes, feesCollected, studentAttendance, teacherAttendance, classStudents] = await Promise.all([
      Student.countDocuments(),
      Teacher.countDocuments(),
      Student.distinct("className", { status: "Active" }),
      FeePayment.aggregate([{ $group: { _id: null, total: { $sum: "$amount" } } }]),
      Attendance.aggregate([{ $match: { date: { $gte: today, $lt: tomorrow }, isTeacher: { $ne: true }, status: { $in: ["present", "late"] } } }, { $count: "total" }]),
      Attendance.countDocuments({ date: { $gte: today, $lt: tomorrow }, isTeacher: true, status: "present" }),
      Student.aggregate([{ $match: { status: "Active" } }, { $group: { _id: { className: "$className", section: "$section" }, students: { $sum: 1 } } }, { $sort: { "_id.className": 1, "_id.section": 1 } }]),
    ]);
    const attendanceByClass = await Attendance.aggregate([{ $match: { date: { $gte: today, $lt: tomorrow }, isTeacher: { $ne: true }, status: { $in: ["present", "late"] } } }, { $group: { _id: "$className", present: { $sum: 1 } } }]);
    const presentByClass = new Map(attendanceByClass.map((row) => [row._id, row.present]));
    res.json({ students, teachers, classes: classes.length, feesCollected: feesCollected[0]?.total || 0, studentsPresent: studentAttendance[0]?.total || 0, teachersPresent: teacherAttendance, classStudents: classStudents.map(({ _id, students: count }) => ({ className: _id.className, section: _id.section, students: count, present: presentByClass.get(_id.className) || 0 })) });
  } catch (err) {
    next(err);
  }
});

// Keep your existing 404 handler, error handler,
// MongoDB connection and app.listen code below this point.

app.use("/api/students", studentRoutes);
app.use("/api/teachers", teacherRoutes);

app.use((req, res) => res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` }));
app.use((err, _req, res, _next) => {
  console.error(err);
  if (err.name === "ValidationError") return res.status(400).json({ message: err.message });
  if (err.code === 11000) return res.status(409).json({ message: "A record with this unique value already exists." });
  res.status(500).json({ message: "Server error. Check the backend terminal." });
});

const PORT = process.env.PORT || 5000;
mongoose.connect(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/school_management")
  .then(() => {
    console.log("MongoDB connected");
    app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error("MongoDB connection failed:", err.message);
    process.exit(1);
  });
