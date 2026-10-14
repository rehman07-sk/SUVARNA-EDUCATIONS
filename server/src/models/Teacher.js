import mongoose from "mongoose";

const teacherSchema = new mongoose.Schema({
  fullName: { type: String, required: true, trim: true },
  employeeId: { type: String, required: true, unique: true, trim: true },
  subject: { type: String, required: true, trim: true },
  email: { type: String, trim: true, lowercase: true, default: "" },
  phone: { type: String, trim: true, default: "" }
}, { timestamps: true });

export default mongoose.model("Teacher", teacherSchema);