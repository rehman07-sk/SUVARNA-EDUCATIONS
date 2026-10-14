import { Router } from "express";
import mongoose from "mongoose";
import Teacher from "../models/Teacher.js";
import User from "../models/User.js";
import { authenticateToken, allowRoles } from "../middleware/auth.js";
const router = Router();

router.use(authenticateToken, allowRoles("admin"));

router.get("/", async (req, res, next) => {
  try {
    const q = (req.query.search || "").trim();
    const filter = q ? { $or: [
      { fullName: { $regex: q, $options: "i" } },
      { employeeId: { $regex: q, $options: "i" } },
      { subject: { $regex: q, $options: "i" } }
    ] } : {};
    res.json(await Teacher.find(filter).sort({ createdAt: -1 }));
  } catch (err) { next(err); }
});
router.post("/", async (req, res, next) => {
  let user;
  try {
    const { fullName, employeeId, subject, email, phone = "", password } = req.body;
    const normalizedEmail = String(email || "").trim().toLowerCase();
    if (!fullName?.trim() || !employeeId?.trim() || !subject?.trim() || !normalizedEmail || !password) return res.status(400).json({ message: "Name, employee ID, subject, email and password are required." });
    if (typeof password !== "string" || password.length < 8) return res.status(400).json({ message: "Teacher password must contain at least 8 characters." });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) return res.status(400).json({ message: "Enter a valid teacher email address." });
    if (await User.exists({ email: normalizedEmail })) return res.status(409).json({ message: "An account with this email already exists." });
    user = await User.create({ name: fullName.trim(), email: normalizedEmail, password, role: "teacher" });
    const teacher = await Teacher.create({ fullName: fullName.trim(), employeeId: employeeId.trim(), subject: subject.trim(), email: normalizedEmail, phone });
    res.status(201).json(teacher);
  } catch (err) { if (user) await User.findByIdAndDelete(user._id).catch(() => {}); next(err); }
});
router.get("/:id", async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: "Invalid teacher ID" });
    const item = await Teacher.findById(req.params.id);
    if (!item) return res.status(404).json({ message: "Teacher not found" });
    res.json(item);
  } catch (err) { next(err); }
});
router.put("/:id", async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: "Invalid teacher ID" });
    const current = await Teacher.findById(req.params.id);
    if (!current) return res.status(404).json({ message: "Teacher not found" });
    const allowed = ["fullName", "employeeId", "subject", "email", "phone"];
    const changes = Object.fromEntries(allowed.filter(key => req.body[key] !== undefined).map(key => [key, req.body[key]]));
    const normalizedEmail = String(changes.email ?? current.email).trim().toLowerCase();
    if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) return res.status(400).json({ message: "Enter a valid teacher email address." });
    changes.email = normalizedEmail;
    const linkedUser = current.email ? await User.findOne({ email: current.email.toLowerCase(), role: "teacher" }) : null;
    if (linkedUser && await User.exists({ email: normalizedEmail, _id: { $ne: linkedUser._id } })) return res.status(409).json({ message: "An account with this email already exists." });
    const item = await Teacher.findByIdAndUpdate(req.params.id, changes, { new: true, runValidators: true });
    if (linkedUser) await User.findByIdAndUpdate(linkedUser._id, { email: normalizedEmail, name: item.fullName }, { runValidators: true });
    res.json(item);
  } catch (err) { next(err); }
});
router.delete("/:id", async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: "Invalid teacher ID" });
    const item = await Teacher.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ message: "Teacher not found" });
    res.json({ message: "Teacher deleted" });
  } catch (err) { next(err); }
});
export default router;
