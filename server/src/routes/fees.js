import express from "express";
import mongoose from "mongoose";
import FeePayment from "../models/FeePayment.js";
import Student from "../models/Student.js";
import User from "../models/User.js";
import { authenticateToken, allowRoles } from "../middleware/auth.js";

const router = express.Router();
async function studentAccount(studentProfileId) {
  if (!mongoose.isValidObjectId(studentProfileId)) return null;
  const profile = await Student.findById(studentProfileId).lean();
  if (!profile?.email) return null;
  const account = await User.findOne({ email: profile.email.toLowerCase(), role: "student" }).select("_id name email").lean();
  return account ? { profile, account } : null;
}

router.get("/student/:studentId", authenticateToken, allowRoles("admin", "teacher"), async (req, res, next) => {
  try {
    const linked = await studentAccount(req.params.studentId);
    if (!linked) return res.status(404).json({ message: "Student login account not found. Link an email account before collecting a payment." });
    if (req.user.role === "teacher" && !(await Student.exists({ _id: linked.profile._id, status: "Active" }))) return res.status(403).json({ message: "You can only access active students in your roster." });
    const payments = await FeePayment.find({ student: linked.account._id }).sort({ paidAt: -1 }).select("amount reference paidAt recordedBy method").lean();
    const paid = payments.reduce((total, payment) => total + payment.amount, 0);
    return res.json({ student: { id: linked.profile._id, name: linked.profile.fullName, className: linked.profile.className, section: linked.profile.section }, paid, paymentCount: payments.length, payments });
  } catch (error) { next(error); }
});

router.post("/student/:studentId/payments", authenticateToken, allowRoles("admin", "teacher"), async (req, res, next) => {
  try {
    const linked = await studentAccount(req.params.studentId);
    if (!linked) return res.status(404).json({ message: "Student login account not found. Link an email account before collecting a payment." });
    if (req.user.role === "teacher" && !(await Student.exists({ _id: linked.profile._id, status: "Active" }))) return res.status(403).json({ message: "You can only access active students in your roster." });
    const amount = Number(req.body.amount);
    if (!Number.isFinite(amount) || amount < 1) return res.status(400).json({ message: "Enter a valid payment amount of at least ₹1." });
    const payment = await FeePayment.create({ student: linked.account._id, recordedBy: req.user.id, method: "manual", amount: Math.round(amount * 100) / 100, reference: `FEE-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}` });
    return res.status(201).json({ message: "Payment recorded successfully.", payment: { amount: payment.amount, reference: payment.reference, paidAt: payment.paidAt, recordedBy: payment.recordedBy, method: payment.method } });
  } catch (error) { next(error); }
});

router.get("/my", authenticateToken, allowRoles("student"), async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.user.id)) return res.status(401).json({ message: "Invalid user ID." });
    const payments = await FeePayment.find({ student: req.user.id }).sort({ paidAt: -1 }).select("amount reference paidAt").lean();
    const paid = payments.reduce((total, payment) => total + payment.amount, 0);
    return res.json({ paid, paymentCount: payments.length, payments });
  } catch (error) { next(error); }
});

router.post("/my/payments", authenticateToken, allowRoles("student"), (_req, res) => res.status(403).json({ message: "Students can view fee status only. An admin or teacher must record payments." }));

export default router;
