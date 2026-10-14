import dns from "node:dns";
dns.setServers(["8.8.8.8", "1.1.1.1"]);

import dotenv from "dotenv";
import mongoose from "mongoose";
import User from "./models/User.js";
import Teacher from "./models/Teacher.js";



dotenv.config();

const demoUsers = [
  {
    name: "Demo Principal",
    email: "admin.demo@example.com",
    password: "AdminDemo@2026",
    role: "admin",
  },
  {
    name: "Demo Teacher",
    email: "teacher.demo@example.com",
    password: "TeacherDemo@2026",
    role: "teacher",
  },
];

async function seedDemoUsers() {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI is missing from server/.env");
    }

    await mongoose.connect(process.env.MONGODB_URI);

    for (const details of demoUsers) {
      let user = await User.findOne({ email: details.email });

      if (user) {
        user.name = details.name;
        user.role = details.role;
        user.password = details.password;
        await user.save();
        console.log(`Demo account updated: ${details.email}`);
      } else {
        await User.create(details);
        console.log(`Demo account created: ${details.email}`);
      }
      if (details.role === "teacher") {
        await Teacher.findOneAndUpdate(
          { email: details.email },
          { $set: { fullName: details.name, employeeId: "DEMO-TCH-001", subject: "General", email: details.email } },
          { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
        );
      }
    }
  } catch (error) {
    console.error("Could not create demo users:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

seedDemoUsers();
