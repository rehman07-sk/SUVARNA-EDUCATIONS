import { useEffect, useState } from "react";
import { Check, CheckCircle2, Clock3, LoaderCircle, ShieldCheck, Wallet } from "lucide-react";
import "./Fees.css";
import { API_BASE_URL } from "../config";

const API = API_BASE_URL;
const money = amount => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(amount || 0));

async function feeRequest(path) {
  const response = await fetch(`${API}${path}`, { headers: { Authorization: `Bearer ${sessionStorage.getItem("schoolToken")}` } });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || "Unable to load fee details.");
  return data;
}

export default function Fees() {
  const [fee, setFee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    feeRequest("/fees/my").then(setFee).catch(loadError => setError(loadError.message)).finally(() => setLoading(false));
  }, []);

  if (loading) return <main className="role-content fees-page"><section className="fee-loading"><LoaderCircle className="fee-spin" size={25} /><span>Loading your fee statement…</span></section></main>;

  return <main className="role-content fees-page">
    <header className="fee-page-heading"><div><span className="fee-eyebrow">STUDENT ACCOUNT</span><h1>Fees &amp; Payments</h1><p>View payments recorded for your student account.</p></div><div className="fee-secure"><ShieldCheck size={17} /> View only</div></header>
    {error && <div className="fee-alert" role="alert">{error}</div>}
    {fee && <>
      <section className="fee-overview fee-readonly-overview">
        <div className="fee-balance-card"><div className="fee-balance-top"><div><span>TOTAL FEES RECORDED</span><div className="fee-balance-amount">{money(fee.paid)}</div></div><div className="fee-balance-icon"><Wallet size={21} /></div></div><p className="fee-readonly-note">Fee amounts are entered by your school. Contact the office if you have a question about your fees.</p></div>
        <div className="fee-metrics fee-readonly-metrics"><article><div className="fee-metric-icon green"><CheckCircle2 size={18} /></div><span>Payments recorded</span><strong>{fee.paymentCount}</strong></article><article><div className="fee-metric-icon violet"><Clock3 size={18} /></div><span>Latest payment</span><strong>{fee.payments[0] ? new Date(fee.payments[0].paidAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}</strong></article></div>
      </section>
      <section className="fee-history-card"><div className="fee-history-heading"><div><span className="fee-eyebrow">ACCOUNT ACTIVITY</span><h2>Payment history</h2></div><span className="fee-count">{fee.paymentCount} payment{fee.paymentCount === 1 ? "" : "s"}</span></div>
        {fee.payments.length ? <div className="fee-history-list">{fee.payments.map(payment => <article className="fee-history-row" key={payment.reference}><div className="fee-history-check"><Check size={16} /></div><div className="fee-history-info"><strong>School fee payment</strong><span>{new Date(payment.paidAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} · {payment.reference}</span></div><strong className="fee-history-amount">{money(payment.amount)}</strong><span className="fee-paid-pill">Paid</span></article>)}</div> : <div className="fee-history-empty"><div className="fee-empty-icon"><Wallet size={21} /></div><strong>No payments recorded</strong><p>Your fee payments will appear here after the school records them.</p></div>}
      </section>
    </>}
  </main>;
}
