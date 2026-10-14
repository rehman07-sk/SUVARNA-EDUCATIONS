
import express from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Student from "../models/Student.js";
import Teacher from "../models/Teacher.js";

const router = express.Router();

function createToken(user) {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured.");
  }

  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );
}

// Register students and teachers only.
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, role, rollNumber, className, section = "A", employeeId, subject, phone = "" } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({
        message: "Please provide name, email, password and role.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (!["student", "teacher"].includes(role)) {
      return res.status(403).json({
        message: "Public registration is allowed only for students and teachers.",
      });
    }

    if (typeof password !== "string" || password.length < 8) {
      return res.status(400).json({
        message: "Password must contain at least 8 characters.",
      });
    }

    if (role === "student" && (!String(rollNumber || "").trim() || !/^Class (?:[1-9]|10)$/.test(String(className || "")))) return res.status(400).json({ message: "Student registration also requires a roll number and class from 1 to 10." });
    if (role === "teacher" && (!String(employeeId || "").trim() || !String(subject || "").trim())) return res.status(400).json({ message: "Teacher registration also requires an employee ID and subject." });

    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      return res.status(409).json({
        message: "An account with this email already exists.",
      });
    }

    let user;
    let profile;
    try {
      user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password,
      role,
      });
      profile = role === "student"
        ? await Student.create({ fullName: name.trim(), rollNumber: String(rollNumber).trim(), className: String(className).trim(), section, email: normalizedEmail, phone })
        : await Teacher.create({ fullName: name.trim(), employeeId: String(employeeId).trim(), subject: String(subject).trim(), email: normalizedEmail, phone });
    } catch (profileError) {
      if (user) await User.findByIdAndDelete(user._id).catch(() => {});
      throw profileError;
    }

    return res.status(201).json({
      message: "Account created successfully.",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      profile,
    });
  } catch (error) {
    console.error("Registration error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        message: "An account or profile with this email or ID already exists.",
      });
    }

    return res.status(500).json({
      message: "Unable to register account.",
    });
  }
});

// Login for students, teachers and principal/admin.
router.post("/login", async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({
        message: "Email, password and role are required.",
      });
    }

    if (!["admin", "teacher", "student"].includes(role)) {
      return res.status(400).json({ message: "Invalid role." });
    }

    const user = await User.findOne({
      email: email.trim().toLowerCase(),
      role,
    }).select("+password");

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({
        message: "Invalid email, password or role.",
      });
    }

    const token = createToken(user);

    return res.json({
      message: "Login successful.",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      message: "Unable to log in.",
    });
  }
});

router.post("/logout", (_req, res) => {
  res.json({
    message: "Logged out. Please discard your authentication token.",
  });
});

export default router;
