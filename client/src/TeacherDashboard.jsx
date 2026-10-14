import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Bell, BookOpen, CalendarCheck, ClipboardList, GraduationCap,
  LayoutDashboard, LogOut, Users, Plus, X,
} from "lucide-react";
import "./RoleDashboards.css";
import FeePaymentModal from "./FeePaymentModal";
import { API_BASE_URL } from "./config";

const API = API_BASE_URL;
const classes = Array.from({ length: 10 }, (_, index) => `Class ${index + 1}`);
const examNames = ["Unit Exam 1", "Unit Exam 2", "Unit Exam 3", "SA Exam 1", "SA Exam 2"];
const teacherNav = [
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "My Students", icon: Users },
  { label: "Attendance", icon: CalendarCheck },
  { label: "Enter Marks", icon: ClipboardList },
];

function localDate() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

async function apiRequest(path, options = {}) {
  const token = sessionStorage.getItem("schoolToken");
  const response = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || "Request failed.");
  return data;
}

export default function TeacherDashboard({ user, onLogout }) {
  const name = user?.name || "Teacher";
  const [section, setSection] = useState("Dashboard");
  const [className, setClassName] = useState(classes[0]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [attendanceDate, setAttendanceDate] = useState(localDate);
  const [attendance, setAttendance] = useState({});
  const [subject, setSubject] = useState("");
  const [examName, setExamName] = useState(examNames[0]);
  const [academicYear, setAcademicYear] = useState("2026-27");
  const [maxMarks, setMaxMarks] = useState("100");
  const [scores, setScores] = useState({});
  const [saving, setSaving] = useState(false);
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [feeStudent, setFeeStudent] = useState(null);
  const [studentDraft, setStudentDraft] = useState({ fullName: "", rollNumber: "", email: "", section: "A", phone: "", password: "" });

  const linkedStudents = useMemo(() => students.filter((student) => student.accountLinked), [students]);
  const loadRoster = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const roster = await apiRequest(`/students/teacher-roster?className=${encodeURIComponent(className)}`);
      setStudents(Array.isArray(roster) ? roster : []);
      setAttendance(Object.fromEntries((roster || []).filter((student) => student.accountId).map((student) => [student.accountId, "present"])));
      setScores({});
    } catch (loadError) {
      setStudents([]);
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  }, [className]);

  useEffect(() => { loadRoster(); }, [loadRoster]);

  async function saveAttendance(event) {
    event.preventDefault();
    setError(""); setNotice(""); setSaving(true);
    try {
      const result = await apiRequest("/attendance/class", {
        method: "POST",
        body: JSON.stringify({
          className, date: attendanceDate, academicYear,
          entries: linkedStudents.map((student) => ({ studentId: student.accountId, status: attendance[student.accountId] || "present" })),
        }),
      });
      setNotice(result.message);
    } catch (saveError) { setError(saveError.message); }
    finally { setSaving(false); }
  }

  async function markTeacherPresent() {
    setError(""); setNotice("");
    try {
      const result = await apiRequest("/attendance/teacher", { method: "POST", body: JSON.stringify({ date: localDate() }) });
      setNotice(result.message);
    } catch (markError) { setError(markError.message); }
  }

  async function saveMarks(event) {
    event.preventDefault();
    setError(""); setNotice("");
    if (!subject.trim()) { setError("Enter the subject before saving marks."); return; }
    const entries = linkedStudents.map((student) => ({ studentId: student.accountId, marksObtained: scores[student.accountId] }));
    if (entries.some((entry) => entry.marksObtained === undefined || entry.marksObtained === "")) {
      setError("Enter marks for each linked student."); return;
    }
    setSaving(true);
    try {
      const result = await apiRequest("/marks/class", {
        method: "POST",
        body: JSON.stringify({ className, subject, examName, academicYear, maxMarks, entries }),
      });
      setNotice(result.message);
    } catch (saveError) { setError(saveError.message); }
    finally { setSaving(false); }
  }

  async function addStudent(event) {
    event.preventDefault();
    setError(""); setNotice(""); setSaving(true);
    try {
      const result = await apiRequest("/students", {
        method: "POST",
        body: JSON.stringify({ ...studentDraft, className, status: "Active" }),
      });
      setNotice(`${result.message} Sign-in email: ${studentDraft.email}. Share the password with the student directly.`);
      setStudentDraft({ fullName: "", rollNumber: "", email: "", section: "A", phone: "", password: "" });
      setShowAddStudent(false);
      await loadRoster();
    } catch (saveError) { setError(saveError.message); }
    finally { setSaving(false); }
  }

  function selectSection(nextSection) {
    setSection(nextSection);
    setError(""); setNotice("");
  }

  function renderRosterTable({ mode }) {
    if (loading) return <div className="role-empty"><strong>Loading {className} roster…</strong></div>;
    if (error) return <div className="role-empty"><strong>Could not load class roster</strong><p>{error}</p><button type="button" onClick={loadRoster}>Try again</button></div>;
    if (!students.length) return <div className="role-empty"><strong>No students found in {className}</strong><p>Add a student here to create their student login account.</p><button type="button" className="teacher-submit teacher-add-empty" onClick={() => setShowAddStudent(true)}><Plus size={16} /> Add student</button></div>;
    return (
      <div className="teacher-roster-wrap">
        <table className="teacher-roster-table">
          <thead><tr><th>Student</th><th>Roll number</th><th>Section</th>{mode === "attendance" ? <th>Attendance</th> : mode === "marks" ? <th>Marks / {maxMarks || "max"}</th> : <><th>Account</th><th>Fees</th></>}</tr></thead>
          <tbody>{students.map((student) => (
            <tr key={student._id}>
              <td><strong>{student.fullName}</strong><small>{student.email || "No email on profile"}</small></td>
              <td>{student.rollNumber}</td><td>{student.section || "—"}</td>
              {mode === "attendance" ? <td>{student.accountLinked ? <select value={attendance[student.accountId] || "present"} onChange={(event) => setAttendance((current) => ({ ...current, [student.accountId]: event.target.value }))}><option value="present">Present</option><option value="absent">Absent</option><option value="late">Late</option></select> : <span className="teacher-unlinked">Link student account</span>}</td> :
                mode === "marks" ? <td>{student.accountLinked ? <input type="number" min="0" max={Number(maxMarks) || undefined} value={scores[student.accountId] ?? ""} onChange={(event) => setScores((current) => ({ ...current, [student.accountId]: event.target.value }))} aria-label={`${student.fullName} marks`} /> : <span className="teacher-unlinked">Link student account</span>}</td> :
                <><td><span className={`teacher-link-status ${student.accountLinked ? "linked" : "unlinked"}`}>{student.accountLinked ? "Account linked" : "No student login"}</span></td><td><button type="button" className="teacher-submit" disabled={!student.accountLinked} onClick={() => setFeeStudent(student)}>Pay fee</button></td></>}
            </tr>
          ))}</tbody>
        </table>
      </div>
    );
  }

  const linkedCount = linkedStudents.length;
  return (
    <div className="role-layout">
      <aside className="role-sidebar">
        <div className="role-brand"><div className="role-brand-icon"><GraduationCap size={25} /></div><div><strong>School Management System</strong><span>Teacher Portal</span></div></div>
        <div className="role-nav-label">TEACHER MENU</div>
        <nav className="role-nav">{teacherNav.map((item) => <button key={item.label} className={`role-nav-item ${section === item.label ? "selected" : ""}`} onClick={() => selectSection(item.label)}><item.icon size={19} /><span>{item.label}</span></button>)}</nav>
        <div className="role-sidebar-bottom"><div className="role-help"><div className="role-help-icon"><Bell size={18} /></div><strong>Teaching workspace</strong><p>Manage classes, student attendance and examination marks.</p></div><button className="role-logout" onClick={onLogout}><LogOut size={18} />Sign out</button></div>
      </aside>
      <main className="role-main">
        <header className="role-topbar"><div className="role-breadcrumb">Workspace <span>/</span> <strong>{section === "Dashboard" ? "Teacher Dashboard" : section}</strong></div><button type="button" className="teacher-submit" onClick={markTeacherPresent}>Mark me present today</button><div className="role-user"><div className="role-avatar">{name.charAt(0).toUpperCase()}</div><div><strong>{name}</strong><span>Teacher</span></div></div></header>

        <div className="role-content">
          <div className="teacher-page-heading"><div><span className="role-eyebrow">TEACHER WORKSPACE</span><h1>{section === "Dashboard" ? `Welcome back, ${name.split(" ")[0]}` : section}</h1><p>Manage students and records for classes 1 through 10.</p></div><label className="teacher-class-picker"><span>Class</span><select value={className} onChange={(event) => setClassName(event.target.value)}>{classes.map((item) => <option key={item}>{item}</option>)}</select></label></div>

          {error && <div className="teacher-message error" role="alert">{error}</div>}
          {notice && <div className="teacher-message success" role="status">{notice}</div>}

          {section === "Dashboard" ? <>
            <section className="role-stat-grid">
              <div className="role-stat-card"><div className="role-stat-icon purple"><Users size={21} /></div><span>Students in {className}</span><strong>{loading ? "…" : students.length}</strong><small>{linkedCount} linked to student accounts</small></div>
              <div className="role-stat-card"><div className="role-stat-icon blue"><CalendarCheck size={21} /></div><span>Attendance</span><strong>Ready</strong><small>Record a daily class register</small></div>
              <div className="role-stat-card"><div className="role-stat-icon green"><ClipboardList size={21} /></div><span>Exam Marks</span><strong>Ready</strong><small>Enter and publish subject marks</small></div>
              <div className="role-stat-card"><div className="role-stat-icon orange"><BookOpen size={21} /></div><span>Classes</span><strong>10</strong><small>Choose any class from 1 to 10</small></div>
            </section>
            <section className="role-panel"><div className="role-panel-heading"><div><h2>Classroom tools</h2><p>Choose a task for {className}.</p></div><ClipboardList size={21} /></div><div className="teacher-action-grid"><button className="teacher-action" onClick={() => selectSection("My Students")}><span className="role-stat-icon purple"><Users size={21} /></span><strong>View students</strong><small>See class roster and linked accounts</small></button><button className="teacher-action" onClick={() => selectSection("Attendance")}><span className="role-stat-icon blue"><CalendarCheck size={21} /></span><strong>Mark attendance</strong><small>Record present, absent or late status</small></button><button className="teacher-action" onClick={() => selectSection("Enter Marks")}><span className="role-stat-icon green"><BookOpen size={21} /></span><strong>Enter exam marks</strong><small>Save subject and exam results</small></button></div></section>
            <section className="role-panel"><div className="role-panel-heading"><div><h2>{className} roster</h2><p>Students available for attendance and marks entry</p></div><Users size={21} /></div>{renderRosterTable({ mode: "view" })}</section>
          </> : section === "My Students" ? <section className="role-panel"><div className="role-panel-heading"><div><h2>{className} students</h2><p>Adding a student here creates their student portal login.</p></div><button type="button" className="teacher-submit teacher-add-button" onClick={() => setShowAddStudent(true)}><Plus size={16} /> Add student</button></div>{renderRosterTable({ mode: "view" })}</section> :
            section === "Attendance" ? <section className="role-panel"><div className="role-panel-heading"><div><h2>Take attendance · {className}</h2><p>Set each linked student's status, then save the register for the selected date.</p></div><CalendarCheck size={21} /></div><form onSubmit={saveAttendance}><div className="teacher-form-controls"><label>Date<input type="date" value={attendanceDate} onChange={(event) => setAttendanceDate(event.target.value)} required /></label><label>Academic year<input value={academicYear} onChange={(event) => setAcademicYear(event.target.value)} required /></label></div>{renderRosterTable({ mode: "attendance" })}<div className="teacher-form-actions"><span>{linkedCount} linked student{linkedCount === 1 ? "" : "s"} will be saved</span><button className="teacher-submit" disabled={saving || loading || !linkedCount}>{saving ? "Saving…" : "Save attendance"}</button></div></form></section> :
              <section className="role-panel"><div className="role-panel-heading"><div><h2>Enter marks · {className}</h2><p>Saved marks are published to each student's My Marks page.</p></div><ClipboardList size={21} /></div><form onSubmit={saveMarks}><div className="teacher-form-controls marks-controls"><label>Subject<input value={subject} onChange={(event) => setSubject(event.target.value)} placeholder="e.g. Mathematics" required /></label><label>Exam<select value={examName} onChange={(event) => setExamName(event.target.value)}>{examNames.map((exam) => <option key={exam}>{exam}</option>)}</select></label><label>Academic year<input value={academicYear} onChange={(event) => setAcademicYear(event.target.value)} required /></label><label>Maximum marks<input type="number" min="1" value={maxMarks} onChange={(event) => setMaxMarks(event.target.value)} required /></label></div>{renderRosterTable({ mode: "marks" })}<div className="teacher-form-actions"><span>{linkedCount} linked student{linkedCount === 1 ? "" : "s"} will receive results</span><button className="teacher-submit" disabled={saving || loading || !linkedCount}>{saving ? "Saving…" : "Save and publish marks"}</button></div></form></section>}

          <footer className="role-footer">© 2026 School Management System · Teacher Portal</footer>
        </div>
      </main>
      {showAddStudent && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowAddStudent(false); }}><section className="modal teacher-student-modal" role="dialog" aria-modal="true" aria-labelledby="add-student-title"><div className="modal-head"><div><h2 id="add-student-title">Add student to {className}</h2><p>Create the profile and student sign-in together.</p></div><button type="button" className="icon-button" aria-label="Close" onClick={() => setShowAddStudent(false)}><X size={19} /></button></div><form onSubmit={addStudent}><div className="form-grid"><label className="field">Full name<input required value={studentDraft.fullName} onChange={(event) => setStudentDraft({ ...studentDraft, fullName: event.target.value })} placeholder="Student full name" /></label><label className="field">Roll number<input required value={studentDraft.rollNumber} onChange={(event) => setStudentDraft({ ...studentDraft, rollNumber: event.target.value })} placeholder="e.g. STU-1024" /></label><label className="field">Email<input type="email" required value={studentDraft.email} onChange={(event) => setStudentDraft({ ...studentDraft, email: event.target.value })} placeholder="student@example.com" /></label><label className="field">Section<input value={studentDraft.section} onChange={(event) => setStudentDraft({ ...studentDraft, section: event.target.value })} placeholder="A" /></label><label className="field">Phone<input value={studentDraft.phone} onChange={(event) => setStudentDraft({ ...studentDraft, phone: event.target.value })} placeholder="Phone number" /></label><label className="field">Student login password<input type="password" required minLength={8} autoComplete="new-password" value={studentDraft.password} onChange={(event) => setStudentDraft({ ...studentDraft, password: event.target.value })} placeholder="At least 8 characters" /></label></div><p className="teacher-password-hint">The student signs in by choosing Student and using this email and password. Share the password with them directly.</p><div className="modal-footer"><button type="button" className="secondary" onClick={() => setShowAddStudent(false)}>Cancel</button><button type="submit" className="primary" disabled={saving}>{saving ? "Creating account…" : "Create student account"}</button></div></form></section></div>}
      {feeStudent && <FeePaymentModal student={feeStudent} onClose={() => setFeeStudent(null)} onPaid={loadRoster} />}
    </div>
  );
}
