import { useEffect, useMemo, useState } from "react";
import { GraduationCap, LayoutDashboard, Users, UserRound, Search, Plus, Pencil, Trash2, X, Menu, BookOpen, Bell, ChevronDown, ArrowUpRight } from "lucide-react";
import Login from "./Login";
import StudentDashboard from "./StudentDashboard";
import TeacherDashboard from "./TeacherDashboard";
import FeePaymentModal from "./FeePaymentModal";
import { API_BASE_URL } from "./config";

const API = API_BASE_URL;
const emptyStudent = { fullName:"", rollNumber:"", className:"Class 1", section:"A", email:"", phone:"", status:"Active", password:"" };
const emptyTeacher = { fullName:"", employeeId:"", subject:"", email:"", phone:"", password:"" };
const money = value => new Intl.NumberFormat("en-IN", { style:"currency", currency:"INR", maximumFractionDigits:0 }).format(Number(value)||0);

async function request(path, options = {}) {
  const token = sessionStorage.getItem("schoolToken");

  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.message || "Request failed");
  }

  return data;
}
export default function App() {
  const [page, setPage] = useState("Dashboard");
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [stats, setStats] = useState({ students:0, teachers:0, classes:0, feesCollected:0, studentsPresent:0, teachersPresent:0, classStudents:[] });
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [feeStudent, setFeeStudent] = useState(null);
  const [mobileNav, setMobileNav] = useState(false);
  const [user, setUser] = useState(() => {
  try {
    return JSON.parse(sessionStorage.getItem("schoolUser")) || null;
  } catch {
    return null;
  }
});

  async function refresh() {
    setLoading(true); setError("");
    try {
      const [s, t, d] = await Promise.all([
        request(`/students?search=${encodeURIComponent(search)}`),
        request(`/teachers?search=${encodeURIComponent(search)}`),
        request("/dashboard")
      ]);
      setStudents(s); setTeachers(t); setStats(d);
    } catch (e) { setError(`${e.message}. Check that the backend and MongoDB are running.`); }
    finally { setLoading(false); }
  }
 useEffect(() => {
  if (user) {
    refresh();
  } else {
    setLoading(false);
  }
}, [search, user]);
  const rows = page === "Teachers" ? teachers : students;
  const visibleStudents = useMemo(() => students.slice(0, 5), [students]);

  function openAdd(type) {
    setEditing(null); setForm(type === "student" ? {...emptyStudent} : {...emptyTeacher});
    setModal(type); setError("");
  }
  function openEdit(type, item) {
    setEditing(item._id); setForm({...item}); setModal(type); setError("");
  }
  async function save(e) {
    e.preventDefault(); setError("");
    try {
      const type = modal;
      const path = type === "student" ? "/students" : "/teachers";
      await request(editing ? `${path}/${editing}` : path, {
        method: editing ? "PUT" : "POST", body: JSON.stringify(form)
      });
      setModal(null); setNotice(`${type === "student" ? "Student" : "Teacher"} ${editing ? "updated" : "added"} successfully.`);
      await refresh();
      setTimeout(() => setNotice(""), 3000);
    } catch (e) { setError(e.message); }
  }
  async function remove(type, item) {
    if (!window.confirm(`Delete ${item.fullName}? This cannot be undone.`)) return;
    try {
      await request(`/${type === "student" ? "students" : "teachers"}/${item._id}`, {method:"DELETE"});
      setNotice(`${type === "student" ? "Student" : "Teacher"} deleted.`);
      await refresh(); setTimeout(() => setNotice(""), 3000);
    } catch (e) { setError(e.message); }
  }

  const nav = [
    { label:"Dashboard", icon:LayoutDashboard },
    { label:"Students", icon:Users },
    { label:"Teachers", icon:UserRound },
    { label:"Classes", icon:BookOpen }
  ];
if (!user) {
  return (
    <Login
      onLogin={(loggedInUser, token) => {
        sessionStorage.setItem(
          "schoolUser",
          JSON.stringify(loggedInUser)
        );

        if (token) {
          sessionStorage.setItem("schoolToken", token);
        }

        setUser(loggedInUser);
      }}
    />
  );
}

const currentRole = String(user?.role || "").trim().toLowerCase();

if (currentRole === "student") {
  return (
    <StudentDashboard
      user={user}
      onLogout={() => {
        sessionStorage.removeItem("schoolToken");
        sessionStorage.removeItem("schoolUser");
        setUser(null);
      }}
    />
  );
}

if (currentRole === "teacher") {
  return (
    <TeacherDashboard
      user={user}
      onLogout={() => {
        sessionStorage.removeItem("schoolToken");
        sessionStorage.removeItem("schoolUser");
        setUser(null);
      }}
    />
  );
}

if (currentRole !== "admin") {
  sessionStorage.removeItem("schoolToken");
  sessionStorage.removeItem("schoolUser");
  return <Login onLogin={(loggedInUser, token) => {
    sessionStorage.setItem("schoolUser", JSON.stringify(loggedInUser));

    if (token) {
      sessionStorage.setItem("schoolToken", token);
    }

    setUser(loggedInUser);
  }} />;
}

// Only the admin role reaches the existing admin panel.
  return <div className="app-shell">
    <aside className={`sidebar ${mobileNav ? "show" : ""}`}>
      <div className="brand"><div className="brand-icon"><GraduationCap size={24}/></div><div><strong>School Management System</strong><span>School Administration</span></div><button className="mobile-close" onClick={()=>setMobileNav(false)}><X size={18}/></button></div>
      <div className="nav-label">WORKSPACE</div>
      <nav>{nav.map(item => <button key={item.label} className={`nav-item ${page===item.label ? "active" : ""}`} onClick={()=>{ setPage(item.label);setSearch("");setMobileNav(false); }}>
        <item.icon size={18}/><span>{item.label}</span>{item.soon && <span className="soon">Soon</span>}
      </button>)}</nav>
      <div className="sidebar-bottom"><div className="help-card"><div className="help-icon"><BookOpen size={18}/></div><strong>Need help?</strong><p>Manage your school records from one place.</p><span>Student Admin Portal <ArrowUpRight size={13}/></span></div><div className="profile"><div className="avatar">AD</div><div className="profile-info"><strong>School Admin</strong><span>Administrator</span></div><ChevronDown size={16}/></div></div>
    </aside>
    {mobileNav && <div className="scrim" onClick={()=>setMobileNav(false)} />}
    <main className="main">
      <header className="topbar"><button className="mobile-menu" onClick={()=>setMobileNav(true)}><Menu/></button><div className="breadcrumb">Workspace <span>/</span> <strong>{page}</strong></div><div className="top-actions"><span className="date-label">Academic Year 2026–27</span><button className="icon-button" aria-label="Notifications"><Bell size={18}/><i/></button><div className="top-avatar">AD</div></div></header>
      <div className="content">
        {notice && <div className="toast">{notice}</div>}
        {error && <div className="alert"><span>{error}</span><button onClick={()=>setError("")}><X size={16}/></button></div>}
        {page==="Dashboard" ? <>
          <section className="welcome-row"><div><div className="eyebrow">OVERVIEW</div><h1>Good morning, Admin <span>✦</span></h1><p>Here’s what’s happening at your school today.</p></div><button className="primary" onClick={()=>openAdd("student")}><Plus size={17}/> Add new student</button></section>
          <section className="stats-grid">
            <Stat icon={Users} label="Total Students" value={stats.students} note="Registered students" color="blue"/>
            <Stat icon={UserRound} label="Total Teachers" value={stats.teachers} note="Teaching staff" color="purple"/>
            <Stat icon={BookOpen} label="Total Classes" value={stats.classes} note="Configured classes" color="orange"/>
            <Stat icon={GraduationCap} label="Academic Year" value="2026–27" note="Current session" color="green" text/>
          </section>
          <section className="stats-grid">
            <Stat icon={GraduationCap} label="Fees collected" value={money(stats.feesCollected)} note="Total payments recorded" color="blue" text/>
            <Stat icon={Users} label="Students present today" value={stats.studentsPresent} note="Present or late" color="purple"/>
            <Stat icon={UserRound} label="Teachers present today" value={stats.teachersPresent} note="Teacher attendance not set up" color="orange"/>
          </section>
          <section className="panel recent-panel"><div className="panel-head"><div><h2>Recently added students</h2><p>Keep track of your latest student records.</p></div><button className="text-button" onClick={()=>setPage("Students")}>View all students <ArrowUpRight size={15}/></button></div>
            <StudentTable rows={visibleStudents} loading={loading} onEdit={item=>openEdit("student",item)} onDelete={item=>remove("student",item)} compact/>
          </section>
          <section className="bottom-grid"><div className="panel quick-panel"><h2>Quick actions</h2><p>Common tasks to help you get started.</p><div className="quick-actions"><button onClick={()=>openAdd("student")}><span className="quick-icon blue-bg"><Users size={18}/></span><span><strong>Add student</strong><small>Create a student profile</small></span><Plus size={17}/></button><button onClick={()=>openAdd("teacher")}><span className="quick-icon purple-bg"><UserRound size={18}/></span><span><strong>Add teacher</strong><small>Register a staff member</small></span><Plus size={17}/></button></div></div><div className="panel tip-panel"><div className="tip-mark">✦</div><div><div className="eyebrow">PROJECT TIP</div><h2>Build it one module at a time</h2><p>Next, add attendance tracking and class assignments to make your system more useful.</p></div></div></section>
        </> : page==="Classes" ? <><section className="welcome-row"><div><div className="eyebrow">MANAGEMENT</div><h1>Classes</h1><p>Class and section enrollment with today's recorded attendance.</p></div></section><section className="panel directory-panel"><div className="directory-toolbar"><div><h2>Class roster overview</h2><p>{(stats.classStudents||[]).length} active class sections</p></div></div><div className="table-wrap"><table><thead><tr><th>CLASS</th><th>SECTION</th><th>ENROLLED</th><th>PRESENT TODAY</th></tr></thead><tbody>{(stats.classStudents||[]).length===0 ? <tr><td colSpan="4" className="empty">No active student enrollments yet.</td></tr> : stats.classStudents.map((c,index)=><tr key={`${c.className}-${c.section}-${index}`}><td><strong>{c.className}</strong></td><td>{c.section||"—"}</td><td>{c.students}</td><td>{c.present}</td></tr>)}</tbody></table></div></section></> : <><section className="welcome-row"><div><div className="eyebrow">MANAGEMENT</div><h1>{page}</h1><p>{page==="Students" ? "Manage student profiles, enrollment details, and status." : "Manage teacher profiles and subject assignments."}</p></div><button className="primary" onClick={()=>openAdd(page==="Students"?"student":"teacher")}><Plus size={17}/> Add {page==="Students"?"student":"teacher"}</button></section>
          <section className="panel directory-panel"><div className="directory-toolbar"><div><h2>All {page.toLowerCase()}</h2><p>{rows.length} record{rows.length===1?"":"s"} found</p></div><div className="search-box"><Search size={17}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder={`Search ${page.toLowerCase()}...`}/>{search && <button onClick={()=>setSearch("")}><X size={14}/></button>}</div></div>
          {page==="Students" ? <StudentTable rows={students} loading={loading} onEdit={item=>openEdit("student",item)} onDelete={item=>remove("student",item)}/> : <TeacherTable rows={teachers} loading={loading} onEdit={item=>openEdit("teacher",item)} onDelete={item=>remove("teacher",item)}/>}
          </section></>}
        <footer>© 2026 School Management System <span>Built with MERN stack</span></footer>
      </div>
    </main>
    {modal && <div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setModal(null)}}><div className="modal"><div className="modal-head"><div><h2>{editing?"Edit":"Add"} {modal==="student"?"student":"teacher"}</h2><p>Enter the details below to save the record.</p></div><button className="icon-button" onClick={()=>setModal(null)}><X size={19}/></button></div>
      <form onSubmit={save}><div className="form-grid">
        <Field label="Full name" required value={form.fullName||""} onChange={v=>setForm({...form,fullName:v})} placeholder="e.g. Aanya Sharma"/>
        {modal==="student" ? <><Field label="Roll number" required value={form.rollNumber||""} onChange={v=>setForm({...form,rollNumber:v})} placeholder="e.g. STU-1024"/><div className="field"><label>Class<em> *</em></label><select required value={form.className||"Class 1"} onChange={e=>setForm({...form,className:e.target.value})}>{Array.from({length:10},(_,i)=><option key={i+1}>Class {i+1}</option>)}</select></div><Field label="Section" value={form.section||"A"} onChange={v=>setForm({...form,section:v})} placeholder="e.g. A"/></> : <><Field label="Employee ID" required value={form.employeeId||""} onChange={v=>setForm({...form,employeeId:v})} placeholder="e.g. TCH-021"/><Field label="Subject" required value={form.subject||""} onChange={v=>setForm({...form,subject:v})} placeholder="e.g. Mathematics"/></>}
        <Field label="Email" type="email" required value={form.email||""} onChange={v=>setForm({...form,email:v})} placeholder="name@example.com"/><Field label="Phone" value={form.phone||""} onChange={v=>setForm({...form,phone:v})} placeholder="Phone number"/>
        {modal==="student" && !editing && <div className="field"><label>Student login password<em> *</em></label><input type="password" minLength={8} required autoComplete="new-password" value={form.password||""} onChange={e=>setForm({...form,password:e.target.value})} placeholder="At least 8 characters"/><small>Give this password to the student so they can sign in with their email.</small></div>}
        {modal==="teacher" && !editing && <div className="field"><label>Teacher login password<em> *</em></label><input type="password" minLength={8} required autoComplete="new-password" value={form.password||""} onChange={e=>setForm({...form,password:e.target.value})} placeholder="At least 8 characters"/><small>The teacher will sign in using this email and password.</small></div>}
        {modal==="student" && <div className="field"><label>Status</label><select value={form.status||"Active"} onChange={e=>setForm({...form,status:e.target.value})}><option>Active</option><option>Inactive</option></select></div>}
      </div><div className="modal-footer">{modal==="student" && editing && <button type="button" className="secondary" onClick={()=>setFeeStudent(form)}>Pay fee</button>}<button type="button" className="secondary" onClick={()=>setModal(null)}>Cancel</button><button className="primary" type="submit">{editing?"Save changes":"Create record"}</button></div></form>
    </div></div>}
    {feeStudent && <FeePaymentModal student={feeStudent} onClose={()=>setFeeStudent(null)} onPaid={refresh}/>}
  </div>;
}

function Stat({icon:Icon,label,value,note,color,text}) { return <div className="stat-card"><div className={`stat-icon ${color}`}><Icon size={20}/></div><div className="stat-label">{label}</div><div className={`stat-value ${text?"stat-text":""}`}>{value}</div><div className="stat-note"><span className="dot"/> {note}</div></div>; }
function Field({label,value,onChange,placeholder,type="text",required}) { return <div className="field"><label>{label}{required&&<em> *</em>}</label><input type={type} required={required} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}/></div>; }
function StudentTable({rows,loading,onEdit,onDelete,compact=false}) {
  return <div className="table-wrap"><table><thead><tr><th>STUDENT</th><th>ROLL NUMBER</th><th>CLASS</th><th>STATUS</th><th className="action-col">ACTIONS</th></tr></thead><tbody>
  {loading ? <tr><td colSpan="5" className="empty">Loading records…</td></tr> : rows.length===0 ? <tr><td colSpan="5" className="empty">No students yet. Add your first student to get started.</td></tr> : rows.map(s=><tr key={s._id}><td><div className="person-cell"><div className="person-avatar">{s.fullName.split(" ").map(n=>n[0]).slice(0,2).join("").toUpperCase()}</div><div><strong>{s.fullName}</strong><small>{s.email||"No email added"}</small></div></div></td><td><span className="code-pill">{s.rollNumber}</span></td><td>{s.className}{s.section?` · ${s.section}`:""}</td><td><span className={`status ${s.status==="Inactive"?"inactive":""}`}><i/>{s.status||"Active"}</span></td><td><div className="row-actions"><button aria-label="Edit student" onClick={()=>onEdit(s)}><Pencil size={15}/></button><button aria-label="Delete student" className="delete" onClick={()=>onDelete(s)}><Trash2 size={15}/></button></div></td></tr>)}
  </tbody></table></div>;
}
function TeacherTable({rows,loading,onEdit,onDelete}) {
  return <div className="table-wrap"><table><thead><tr><th>TEACHER</th><th>EMPLOYEE ID</th><th>SUBJECT</th><th>PHONE</th><th className="action-col">ACTIONS</th></tr></thead><tbody>
  {loading ? <tr><td colSpan="5" className="empty">Loading records…</td></tr> : rows.length===0 ? <tr><td colSpan="5" className="empty">No teachers yet. Add your first teacher to get started.</td></tr> : rows.map(t=><tr key={t._id}><td><div className="person-cell"><div className="person-avatar purple-avatar">{t.fullName.split(" ").map(n=>n[0]).slice(0,2).join("").toUpperCase()}</div><div><strong>{t.fullName}</strong><small>{t.email||"No email added"}</small></div></div></td><td><span className="code-pill">{t.employeeId}</span></td><td>{t.subject}</td><td>{t.phone||"—"}</td><td><div className="row-actions"><button aria-label="Edit teacher" onClick={()=>onEdit(t)}><Pencil size={15}/></button><button aria-label="Delete teacher" className="delete" onClick={()=>onDelete(t)}><Trash2 size={15}/></button></div></td></tr>)}
  </tbody></table></div>;
}
