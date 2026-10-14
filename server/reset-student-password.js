
import "dotenv/config";
import mongoose from "mongoose";
import User from "./src/models/User.js";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

const rl = readline.createInterface({ input, output });

try {
  const email = (await rl.question("Student account email: "))
    .trim()
    .toLowerCase();

  const newPassword = await rl.question(
    "Enter a new password (minimum 8 characters): "
  );

  if (newPassword.length < 8) {
    throw new Error("Password must contain at least 8 characters.");
  }

  await mongoose.connect(process.env.MONGODB_URI);

  const user = await User.findOne({
    email,
    role: "student",
  }).select("+password");

  if (!user) {
    throw new Error(
      "No student login account found for this email. No password was changed."
    );
  }

  user.password = newPassword;
  await user.save();

  console.log("Student password reset successfully.");
  console.log("Account:", user.email);
  console.log("Role:", user.role);
} catch (error) {
  console.error("Password reset failed:", error.message);
  process.exitCode = 1;
} finally {
  rl.close();
  await mongoose.disconnect().catch(() => {});
}
