
import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema(
  {
    // The student whose attendance is being recorded
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    isTeacher: { type: Boolean, default: false, index: true },

    // Attendance date, stored consistently at UTC midnight
    date: {
      type: Date,
      required: true,
      index: true,
    },

    // Daily attendance status
    status: {
      type: String,
      enum: ["present", "absent", "late"],
      required: true,
    },

    // Optional teacher note
    remarks: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },

    // Academic session, for example 2026-27
    academicYear: {
      type: String,
      required: true,
      trim: true,
      default: "2026-27",
    },

    // Optional class or section information
    className: {
      type: String,
      trim: true,
      default: "",
    },

    section: {
      type: String,
      trim: true,
      default: "",
    },

    // User who recorded the attendance, when available
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// One attendance record per student per calendar day
attendanceSchema.index(
  { student: 1, date: 1 },
  { unique: true }
);

// Efficient student attendance history queries
attendanceSchema.index({ student: 1, date: -1 });

// Efficient academic-session filtering
attendanceSchema.index({ student: 1, academicYear: 1, date: -1 });

const Attendance = mongoose.model("Attendance", attendanceSchema);

export default Attendance;
