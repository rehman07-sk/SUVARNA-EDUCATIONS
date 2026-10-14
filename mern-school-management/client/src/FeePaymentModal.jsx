import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, CreditCard, LoaderCircle, QrCode, X } from "lucide-react";
import "./FeePaymentModal.css";
import { API_BASE_URL } from "./config";

const API = API_BASE_URL;
const UPI_ID = import.meta.env.VITE_SCHOOL_UPI_ID || "school@upi";
const money = value => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(value) || 0);

async function feeRequest(path, options = {}) {
  const response = await fetch(`${API}${path}`, { ...options, headers: { "Content-Type": "application/json", Authorization: `Bearer ${sessionStorage.getItem("schoolToken")}`, ...(options.headers || {}) } });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || "Unable to load fee details.");
  return data;
}

export default function FeePaymentModal({ student, onClose, onPaid }) {
  const [fee, setFee] = useState(null);
  const [amount, setAmount] = useState("");
  const [step, setStep] = useState("details");
  const [receipt, setReceipt] = useState(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    feeRequest(`/fees/student/${student._id}`).then(data => { setFee(data); setAmount(""); }).catch(err => setError(err.message));
  }, [student._id]);

  const upiUri = useMemo(() => `upi://pay?${new URLSearchParams({ pa: UPI_ID, pn: "School Management System", am: String(amount || 0), cu: "INR", tn: `School fee ${student.fullName}` })}`, [amount, student.fullName]);
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=12&data=${encodeURIComponent(upiUri)}`;

  async function confirmPayment() {
    setSaving(true); setError("");
    try {
      const result = await feeRequest(`/fees/student/${student._id}/payments`, { method: "POST", body: JSON.stringify({ amount: Number(amount) }) });
      setReceipt(result.payment); setStep("success"); onPaid?.();
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  }

  return <div className="fee-modal-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}><section className="fee-modal" role="dialog" aria-modal="true" aria-labelledby="fee-modal-title">
    <header className="fee-modal-header"><div><span>STUDENT FEE</span><h2 id="fee-modal-title">{student.fullName}</h2><p>{student.className}{student.section ? ` · ${student.section}` : ""}</p></div><button aria-label="Close fee payment" onClick={onClose}><X size={19}/></button></header>
    {error && <div className="fee-modal-error">{error}</div>}
    {step === "success" ? <div className="fee-modal-success"><CheckCircle2 size={42}/><span>PAYMENT SUCCESSFUL</span><h3>Payment recorded</h3><p>{money(receipt?.amount)} added to this student's fee account.</p><code>{receipt?.reference}</code><button onClick={onClose}>Done</button></div> : !fee ? <div className="fee-modal-loading"><LoaderCircle size={22}/> Loading fee account…</div> : step === "qr" ? <div className="fee-modal-checkout"><div className="fee-modal-payee"><span>Amount to record</span><strong>{money(amount)}</strong><label>UPI ID<input readOnly value={UPI_ID}/></label></div><div className="fee-modal-qr"><img src={qrUrl} alt={`Fee payment QR for ${student.fullName}`}/><span><QrCode size={15}/> Scan with UPI app</span></div><a className="fee-modal-upi" href={upiUri}><CreditCard size={16}/> Open UPI app</a><p>After receiving the payment, record it below.</p><button className="fee-modal-primary" onClick={confirmPayment} disabled={saving}>{saving ? "Recording payment…" : "Payment successful"}</button></div> : <div className="fee-modal-details"><div className="fee-modal-balance"><span>Total fees recorded</span><strong>{money(fee.paid)}</strong><small>{fee.paymentCount} payment{fee.paymentCount === 1 ? "" : "s"} recorded so far</small></div><label>Payment amount<input type="number" min="1" step="1" value={amount} onChange={event => setAmount(event.target.value)} /></label><div className="fee-modal-history">Enter the amount received from this student.</div><button className="fee-modal-primary" onClick={() => { if (Number(amount) >= 1) { setError(""); setStep("qr"); } else setError("Enter a payment amount of at least ₹1."); }}><QrCode size={17}/> Pay fee · Show scanner</button></div>}
  </section></div>;
}
