
import express from "express";
import mongoose from "mongoose";
import Attendance from "../models/Attendance.js";
import Student from "../models/Student.js";
import User from "../models/User.js";
import { authenticateToken, allowRoles } from "../middleware/auth.js";

const router = express.Router();

router.post("/teacher", authenticateToken, allowRoles("teacher"), async (req, res, next) => {
  try {
    const date = String(req.body.date || "");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(`${date}T00:00:00.000Z`))) return res.status(400).json({ message: "Provide a valid attendance date." });
    const day = new Date(`${date}T00:00:00.000Z`);
    await Attendance.findOneAndUpdate({ student: req.user.id, date: day }, { $set: { isTeacher: true, status: "present", className: "", section: "", academicYear: "2026-27", recordedBy: req.user.id } }, { upsert: true, new: true, setDefaultsOnInsert: true });
    return res.json({ message: "Your attendance is marked present." });
  } catch (error) { next(error); }
});

// Teachers save a full class register for one calendar day.
router.post("/class", authenticateToken, allowRoles("teacher"), async (req, res, next) => {
  try {
    const { className, date, academicYear = "2026-27", entries } = req.body;
    if (!/^Class (?:[1-9]|10)$/.test(String(className || ""))) return res.status(400).json({ message: "Choose a class from 1 to 10." });
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(date || "")) || Number.isNaN(Date.parse(`${date}T00:00:00.000Z`))) return res.status(400).json({ message: "Provide a valid attendance date." });
    if (!Array.isArray(entries) || entries.length === 0) return res.status(400).json({ message: "No linked students were provided." });
    if (entries.some((entry) => !mongoose.isValidObjectId(entry.studentId) || !["present", "absent", "late"].includes(entry.status))) return res.status(400).json({ message: "Each student needs a valid attendance status." });

    const classNumber = Number(String(className).match(/\d+/)[0]);
    const profiles = await Student.find({ status: "Active" }).lean();
    const classProfiles = profiles.filter((student) => Number(String(student.className).match(/\d+/)?.[0]) === classNumber);
    const accounts = await User.find({ email: { $in: classProfiles.map((student) => student.email).filter(Boolean) }, role: "student" }).select("_id email").lean();
    const profileByEmail = new Map(classProfiles.map(profile => [String(profile.email || "").toLowerCase(), profile]));
    const profileByAccountId = new Map(accounts.map(account => [String(account._id), profileByEmail.get(String(account.email || "").toLowerCase())]));
    const allowedIds = new Set(accounts.map((account) => String(account._id)));
    if (entries.some((entry) => !allowedIds.has(String(entry.studentId)))) return res.status(403).json({ message: "Attendance can only be recorded for linked students in the selected class." });

    const day = new Date(`${date}T00:00:00.000Z`);
    await Attendance.bulkWrite(entries.map((entry) => ({ updateOne: {
      filter: { student: entry.studentId, date: day },
      update: { $set: { status: entry.status, isTeacher: false, className, section: profileByAccountId.get(String(entry.studentId))?.section || "", academicYear, recordedBy: req.user.id } },
      upsert: true,
    } })));
    return res.json({ message: `Attendance saved for ${entries.length} students.` });
  } catch (error) { next(error); }
});

// Student: retrieve only their own attendance records.
// Admin/teacher: access is reserved for future management endpoints.
router.get(
  "/my",
  authenticateToken,
  allowRoles("student"),
  async (req, res, next) => {
    try {
      const studentId = req.user.id;

      const { month, year, academicYear } = req.query;
      const filter = { student: studentId, isTeacher: { $ne: true } };

      if (academicYear) {
        filter.academicYear = academicYear;
      }

      // Optional month/year filter, e.g. ?month=10&year=2026
      if (month !== undefined || year !== undefined) {
        const parsedMonth = Number(month);
        const parsedYear = Number(year);

        if (
          !Number.isInteger(parsedMonth) ||
          parsedMonth < 1 ||
          parsedMonth > 12 ||
          !Number.isInteger(parsedYear) ||
          parsedYear < 2000 ||
          parsedYear > 2100
        ) {
          return res.status(400).json({
            message: "Provide a valid month (1-12) and year.",
          });
        }

        filter.date = {
          $gte: new Date(Date.UTC(parsedYear, parsedMonth - 1, 1)),
          $lt: new Date(Date.UTC(parsedYear, parsedMonth, 1)),
        };
      }

      const records = await Attendance.find(filter)
        .sort({ date: -1 })
        .lean();

      return res.json(records);
    } catch (error) {
      next(error);
    }
  }
);

// Admin/teacher: list records for management.
// This endpoint does not allow students to retrieve other students' records.
router.get(
  "/",
  authenticateToken,
  allowRoles("admin", "teacher"),
  async (req, res, next) => {
    try {
      const { studentId, month, year, academicYear } = req.query;
      const filter = { isTeacher: { $ne: true } };

      if (studentId) {
        if (!mongoose.isValidObjectId(studentId)) {
          return res.status(400).json({
            message: "Invalid student ID.",
          });
        }
        filter.student = studentId;
      }

      if (academicYear) {
        filter.academicYear = academicYear;
      }

      if (month !== undefined || year !== undefined) {
        const parsedMonth = Number(month);
        const parsedYear = Number(year);

        if (
          !Number.isInteger(parsedMonth) ||
          parsedMonth < 1 ||
          parsedMonth > 12 ||
          !Number.isInteger(parsedYear) ||
          parsedYear < 2000 ||
          parsedYear > 2100
        ) {
          return res.status(400).json({
            message: "Provide a valid month (1-12) and year.",
          });
        }

        filter.date = {
          $gte: new Date(Date.UTC(parsedYear, parsedMonth - 1, 1)),
          $lt: new Date(Date.UTC(parsedYear, parsedMonth, 1)),
        };
      }

      const records = await Attendance.find(filter)
        .sort({ date: -1 })
        .lean();

      return res.json(records);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
