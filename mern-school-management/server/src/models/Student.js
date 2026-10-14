import mongoose from "mongoose";
const studentSchema = new mongoose.Schema({
  fullName: { type: String, required: true, trim: true },
  rollNumber: { type: String, required: true, unique: true, trim: true },
  className: { type: String, required: true, trim: true },
  section: { type: String, default: "A", trim: true },
  email: { type: String, trim: true, lowercase: true, default: "" },
  phone: { type: String, trim: true, default: "" },
  status: { type: String, enum: ["Active", "Inactive"], default: "Active" }
}, { timestamps: true });
export default mongoose.model("Student", studentSchema);
