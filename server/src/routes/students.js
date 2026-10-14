import { Router } from "express";
import mongoose from "mongoose";
import Student from "../models/Student.js";
import User from "../models/User.js";
import { authenticateToken, allowRoles } from "../middleware/auth.js";
const router = Router();

// Teacher classroom roster. Student profiles are joined to login accounts by email.
router.get("/teacher-roster", authenticateToken, allowRoles("teacher"), async (req, res, next) => {
  try {
    const className = String(req.query.className || "").trim();
    if (!/^Class (?:[1-9]|10)$/.test(className)) {
      return res.status(400).json({ message: "Choose a class from 1 to 10." });
    }
    const classNumber = className.match(/\d+/)[0];
    const profiles = await Student.find({ status: "Active" }).sort({ fullName: 1 }).lean();
    const roster = profiles.filter((student) => {
      const match = String(student.className).match(/\d+/);
      return match && Number(match[0]) === Number(classNumber);
    });
    const emails = roster.map((student) => student.email).filter(Boolean);
    const accounts = await User.find({ email: { $in: emails }, role: "student" }).select("name email").lean();
    const accountByEmail = new Map(accounts.map((account) => [account.email.toLowerCase(), account]));
    return res.json(roster.map((student) => {
      const account = accountByEmail.get(String(student.email || "").toLowerCase());
      return { ...student, accountId: account?._id || null, accountLinked: Boolean(account) };
    }));
  } catch (error) { next(error); }
});

router.get("/", authenticateToken, allowRoles("admin"), async (req, res, next) => {
  try {
    const q = (req.query.search || "").trim();
    const filter = q ? { $or: [
      { fullName: { $regex: q, $options: "i" } },
      { rollNumber: { $regex: q, $options: "i" } },
      { className: { $regex: q, $options: "i" } }
    ] } : {};
    res.json(await Student.find(filter).sort({ createdAt: -1 }));
  } catch (err) { next(err); }
});
router.post("/", authenticateToken, allowRoles("admin", "teacher"), async (req, res, next) => {
  let createdAccount;
  try {
    const { fullName, rollNumber, className, section = "A", email, phone = "", status = "Active", password } = req.body;
    const normalizedEmail = String(email || "").trim().toLowerCase();
    const normalizedClass = String(className || "").trim();
    if (!String(fullName || "").trim() || !String(rollNumber || "").trim() || !normalizedClass || !normalizedEmail || !password) {
      return res.status(400).json({ message: "Name, roll number, class, email and password are required." });
    }
    if (!/^Class (?:[1-9]|10)$/.test(normalizedClass)) return res.status(400).json({ message: "Choose a class from 1 to 10." });
    if (typeof password !== "string" || password.length < 8) return res.status(400).json({ message: "Student password must contain at least 8 characters." });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) return res.status(400).json({ message: "Enter a valid student email address." });
    if (await User.exists({ email: normalizedEmail })) return res.status(409).json({ message: "An account with this email already exists." });

    createdAccount = await User.create({ name: String(fullName).trim(), email: normalizedEmail, password, role: "student" });
    const profile = await Student.create({ fullName: String(fullName).trim(), rollNumber: String(rollNumber).trim(), className: normalizedClass, section, email: normalizedEmail, phone, status });
    return res.status(201).json({ message: "Student profile and login account created.", student: { ...profile.toObject(), accountId: createdAccount._id, accountLinked: true } });
  } catch (err) {
    if (createdAccount) await User.findByIdAndDelete(createdAccount._id).catch(() => {});
    next(err);
  }
});
router.get("/:id", authenticateToken, allowRoles("admin"), async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: "Invalid student ID" });
    const item = await Student.findById(req.params.id);
    if (!item) return res.status(404).json({ message: "Student not found" });
    res.json(item);
  } catch (err) { next(err); }
});
router.put("/:id", authenticateToken, allowRoles("admin"), async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: "Invalid student ID" });
    const current = await Student.findById(req.params.id);
    if (!current) return res.status(404).json({ message: "Student not found" });
    const allowed = ["fullName", "rollNumber", "className", "section", "email", "phone", "status"];
    const changes = Object.fromEntries(allowed.filter(key => req.body[key] !== undefined).map(key => [key, req.body[key]]));
    const normalizedEmail = String(changes.email ?? current.email ?? "").trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) return res.status(400).json({ message: "Enter a valid student email address." });
    changes.email = normalizedEmail;
    const linkedUser = current.email ? await User.findOne({ email: current.email.toLowerCase(), role: "student" }) : null;
    if (linkedUser && await User.exists({ email: normalizedEmail, _id: { $ne: linkedUser._id } })) return res.status(409).json({ message: "An account with this email already exists." });
    const item = await Student.findByIdAndUpdate(req.params.id, changes, { new: true, runValidators: true });
    if (linkedUser) await User.findByIdAndUpdate(linkedUser._id, { email: normalizedEmail, name: item.fullName }, { runValidators: true });
    res.json(item);
  } catch (err) { next(err); }
});
router.delete("/:id", authenticateToken, allowRoles("admin"), async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: "Invalid student ID" });
    const item = await Student.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ message: "Student not found" });
    res.json({ message: "Student deleted" });
  } catch (err) { next(err); }
});
export default router;
