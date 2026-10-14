
import express from "express";
import mongoose from "mongoose";
import Mark from "../models/Marks.js";
import Student from "../models/Student.js";
import User from "../models/User.js";
import {
  authenticateToken,
  allowRoles,
} from "../middleware/auth.js";

const router = express.Router();

router.post("/class", authenticateToken, allowRoles("teacher"), async (req, res, next) => {
  try {
    const { className, subject, examName, academicYear, maxMarks, entries } = req.body;
    if (!/^Class (?:[1-9]|10)$/.test(String(className || ""))) return res.status(400).json({ message: "Choose a class from 1 to 10." });
    if (!String(subject || "").trim() || !String(examName || "").trim() || !String(academicYear || "").trim()) return res.status(400).json({ message: "Subject, examination and academic year are required." });
    const maximum = Number(maxMarks);
    if (!Number.isFinite(maximum) || maximum < 1) return res.status(400).json({ message: "Maximum marks must be at least 1." });
    if (!Array.isArray(entries) || entries.length === 0 || entries.some((entry) => !mongoose.isValidObjectId(entry.studentId) || !Number.isFinite(Number(entry.marksObtained)) || Number(entry.marksObtained) < 0 || Number(entry.marksObtained) > maximum)) return res.status(400).json({ message: "Enter valid marks for each linked student, within the maximum marks." });

    const classNumber = Number(String(className).match(/\d+/)[0]);
    const profiles = await Student.find({ status: "Active" }).lean();
    const classProfiles = profiles.filter((student) => Number(String(student.className).match(/\d+/)?.[0]) === classNumber);
    const accounts = await User.find({ email: { $in: classProfiles.map((student) => student.email).filter(Boolean) }, role: "student" }).select("_id email").lean();
    const allowedIds = new Set(accounts.map((account) => String(account._id)));
    if (entries.some((entry) => !allowedIds.has(String(entry.studentId)))) return res.status(403).json({ message: "Marks can only be entered for linked students in the selected class." });

    await Mark.bulkWrite(entries.map((entry) => ({ updateOne: {
      filter: { student: entry.studentId, subject: String(subject).trim(), examName: String(examName).trim(), academicYear: String(academicYear).trim() },
      update: { $set: { marksObtained: Number(entry.marksObtained), maxMarks: maximum, published: true } },
      upsert: true,
    } })));
    return res.json({ message: `Marks saved for ${entries.length} students.` });
  } catch (error) { next(error); }
});

// Students can view only their own published marks.
router.get(
  "/my",
  authenticateToken,
  allowRoles("student"),
  async (req, res, next) => {
    try {
      if (!mongoose.isValidObjectId(req.user.id)) {
        return res.status(401).json({
          message: "Invalid user ID.",
        });
      }

      const marks = await Mark.find({
        student: req.user.id,
        published: true,
      })
        .select("subject examName academicYear marksObtained maxMarks")
        .sort({ academicYear: -1, examName: 1, subject: 1 })
        .lean();

      return res.json(marks);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
