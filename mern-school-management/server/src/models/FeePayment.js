import mongoose from "mongoose";

const feePaymentSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null, index: true },
  method: { type: String, enum: ["manual"], default: "manual" },
  amount: { type: Number, required: true, min: 1 },
  reference: { type: String, required: true, unique: true },
  paidAt: { type: Date, default: Date.now },
}, { timestamps: true });

export default mongoose.model("FeePayment", feePaymentSchema);
