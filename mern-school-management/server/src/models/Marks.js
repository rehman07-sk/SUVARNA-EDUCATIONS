
import mongoose from "mongoose";


const markSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    examName: {
      type: String,
      required: true,
      trim: true,
    },
    academicYear: {
      type: String,
      required: true,
      trim: true,
    },
    marksObtained: {
      type: Number,
      required: true,
      min: 0,
    },
    maxMarks: {
      type: Number,
      required: true,
      min: 1,
    },
    published: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

markSchema.pre("validate", function () {
  if (
    Number.isFinite(this.marksObtained) &&
    Number.isFinite(this.maxMarks) &&
    this.marksObtained > this.maxMarks
  ) {
    this.invalidate(
      "marksObtained",
      "Marks obtained cannot exceed maximum marks."
    );
  }
});

markSchema.index({
  student: 1,
  examName: 1,
  subject: 1,
  academicYear: 1,
});

const Mark = mongoose.model("Mark", markSchema);

export default Mark;
