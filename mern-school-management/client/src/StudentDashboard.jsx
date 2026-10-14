import React, { useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  CalendarCheck,
  Clock3,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Wallet,
  Bell,
  TrendingUp,
} from "lucide-react";
import "./RoleDashboards.css";
import Attendance from "./student-pages/Attendance.jsx";
import Fees from "./student-pages/Fees.jsx";
import { API_BASE_URL } from "./config";

const studentNav = [
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "My Marks", icon: BookOpen },
  { label: "Attendance", icon: CalendarCheck },
  { label: "Fees & Payments", icon: Wallet },
];

const examGroups = [
  { title: "Unit Exams", exams: ["Unit Exam 1", "Unit Exam 2", "Unit Exam 3"] },
  { title: "SA Exams", exams: ["SA Exam 1", "SA Exam 2"] },
];

function MarksPage({ marks, loading, error }) {
  const allExamNames = useMemo(
    () => [...new Set(marks.map((mark) => mark.examName).filter(Boolean))],
    [marks]
  );

  return (
    <section className="role-content" aria-labelledby="marks-title">
      <section className="role-panel">
        <div className="role-panel-heading">
          <div>
            <h2 id="marks-title">My Marks</h2>
            <p>Your published subject marks for unit and SA examinations.</p>
          </div>
          <BookOpen size={21} />
        </div>

        {loading ? (
          <div className="role-empty"><strong>Loading examination results...</strong></div>
        ) : error ? (
          <div className="role-empty">
            <strong>Unable to load marks</strong>
            <p>{error}</p>
          </div>
        ) : (
          <div className="marks-exam-groups">
            {examGroups.map((group) => (
              <section className="marks-exam-group" key={group.title}>
                <h3>{group.title}</h3>
                <div className="marks-exam-grid">
                  {group.exams.map((examName) => {
                    const examMarks = marks.filter((mark) => mark.examName === examName);
                    const obtained = examMarks.reduce((sum, mark) => sum + Number(mark.marksObtained || 0), 0);
                    const maximum = examMarks.reduce((sum, mark) => sum + Number(mark.maxMarks || 0), 0);
                    return (
                      <article className="marks-exam-card" key={examName}>
                        <div className="marks-exam-card-heading">
                          <BookOpen size={18} />
                          <h4>{examName}</h4>
                        </div>
                        {examMarks.length ? (
                          <>
                            <p className="marks-exam-total">{obtained} / {maximum} marks</p>
                            <div className="marks-table-wrap">
                              <table className="marks-table">
                                <thead><tr><th>Subject</th><th>Marks</th><th>Year</th></tr></thead>
                                <tbody>{examMarks.map((mark) => (
                                  <tr key={mark._id || `${mark.subject}-${mark.academicYear}`}>
                                    <td>{mark.subject}</td>
                                    <td>{mark.marksObtained} / {mark.maxMarks}</td>
                                    <td>{mark.academicYear}</td>
                                  </tr>
                                ))}</tbody>
                              </table>
                            </div>
                          </>
                        ) : <p className="marks-exam-pending">No published marks yet</p>}
                      </article>
                    );
                  })}
                </div>
              </section>
            ))}
            {allExamNames.some((name) => !examGroups.some((group) => group.exams.includes(name))) && (
              <section className="marks-exam-group">
                <h3>Other Examinations</h3>
                <div className="marks-exam-grid">
                  {allExamNames.filter((name) => !examGroups.some((group) => group.exams.includes(name))).map((examName) => (
                    <article className="marks-exam-card" key={examName}>
                      <div className="marks-exam-card-heading"><BookOpen size={18} /><h4>{examName}</h4></div>
                      <div className="marks-table-wrap"><table className="marks-table">
                        <thead><tr><th>Subject</th><th>Marks</th><th>Year</th></tr></thead>
                        <tbody>{marks.filter((mark) => mark.examName === examName).map((mark) => (
                          <tr key={mark._id || `${mark.subject}-${mark.academicYear}`}><td>{mark.subject}</td><td>{mark.marksObtained} / {mark.maxMarks}</td><td>{mark.academicYear}</td></tr>
                        ))}</tbody>
                      </table></div>
                    </article>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </section>
    </section>
  );
}

export default function StudentDashboard({ user, onLogout }) {
  const name = user?.name || "Student";
  const [activeSection, setActiveSection] = useState("Dashboard");
  const [marks, setMarks] = useState([]);
  const [loadingMarks, setLoadingMarks] = useState(true);
  const [marksError, setMarksError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    async function loadMarks() {
      try {
        const token = sessionStorage.getItem("schoolToken");
        if (!token) throw new Error("Please sign in again to view your marks.");
        const response = await fetch(`${API_BASE_URL}/marks/my`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Unable to load examination results.");
        setMarks(Array.isArray(data) ? data : []);
      } catch (loadError) {
        if (loadError.name !== "AbortError") setMarksError(loadError.message || "Unable to load examination results.");
      } finally {
        if (!controller.signal.aborted) setLoadingMarks(false);
      }
    }
    loadMarks();
    return () => controller.abort();
  }, []);

  const totalObtained = marks.reduce((sum, mark) => sum + Number(mark.marksObtained || 0), 0);
  const totalMaximum = marks.reduce((sum, mark) => sum + Number(mark.maxMarks || 0), 0);
  const percentage = totalMaximum ? `${((totalObtained / totalMaximum) * 100).toFixed(1)}%` : "—";

  return (
    <div className="role-layout">
      <aside className="role-sidebar">
        <div className="role-brand"><div className="role-brand-icon"><GraduationCap size={25} /></div><div><strong>School Management System</strong><span>Student Portal</span></div></div>
        <div className="role-nav-label">STUDENT MENU</div>
        <nav className="role-nav">{studentNav.map((item) => (
          <button key={item.label} className={`role-nav-item ${activeSection === item.label ? "selected" : ""}`} onClick={() => setActiveSection(item.label)}>
            <item.icon size={19} /><span>{item.label}</span>
          </button>
        ))}</nav>
        <div className="role-sidebar-bottom">
          <div className="role-help"><div className="role-help-icon"><Bell size={18} /></div><strong>Stay updated</strong><p>Check your academic progress and school updates here.</p></div>
          <button className="role-logout" onClick={onLogout}><LogOut size={18} />Sign out</button>
        </div>
      </aside>
      <main className="role-main">
        <header className="role-topbar">
          <div className="role-breadcrumb">Workspace <span>/</span> <strong>{activeSection === "Dashboard" ? "Student Dashboard" : activeSection}</strong></div>
          <div className="role-user"><div className="role-avatar">{name.charAt(0).toUpperCase()}</div><div><strong>{name}</strong><span>Student</span></div></div>
        </header>

        {activeSection === "My Marks" ? <MarksPage marks={marks} loading={loadingMarks} error={marksError} /> :
          activeSection === "Attendance" ? <Attendance user={user} /> :
          activeSection === "Fees & Payments" ? <Fees user={user} /> :
          <div className="role-content">
            <section className="role-welcome"><div><span className="role-eyebrow">STUDENT PORTAL</span><h1>Welcome back, {name.split(" ")[0]} <span>✦</span></h1><p>Your academic progress, attendance and fee information in one place.</p></div><div className="role-welcome-icon"><GraduationCap size={32} /></div></section>
            <section className="role-stat-grid">
              <div className="role-stat-card"><div className="role-stat-icon purple"><BookOpen size={21} /></div><span>Exam Results</span><strong>{loadingMarks ? "..." : marks.length}</strong><small>Published subject results</small></div>
              <div className="role-stat-card"><div className="role-stat-icon blue"><CalendarCheck size={21} /></div><span>Attendance</span><strong>—</strong><small>Attendance records not connected yet</small></div>
              <div className="role-stat-card"><div className="role-stat-icon green"><Wallet size={21} /></div><span>Fee Balance</span><strong>—</strong><small>Fee records not connected yet</small></div>
              <div className="role-stat-card"><div className="role-stat-icon orange"><TrendingUp size={21} /></div><span>Academic Progress</span><strong>{loadingMarks ? "..." : percentage}</strong><small>{totalObtained} of {totalMaximum} marks</small></div>
            </section>
            <section className="role-two-column">
              <section className="role-panel"><div className="role-panel-heading"><div><h2>Attendance overview</h2><p>Your daily attendance summary</p></div><CalendarCheck size={21} /></div><div className="role-empty compact"><CalendarCheck size={25} /><strong>Attendance records pending</strong><p>Your attendance summary will appear here.</p></div></section>
              <section className="role-panel"><div className="role-panel-heading"><div><h2>Fee information</h2><p>Payments and outstanding fees</p></div><Wallet size={21} /></div><div className="role-empty compact"><Clock3 size={25} /><strong>No fee records loaded</strong><p>Your school fee statement will appear here.</p></div></section>
            </section>
            <footer className="role-footer">© 2026 School Management System · Student Portal</footer>
          </div>
        }
      </main>
    </div>
  );
}
