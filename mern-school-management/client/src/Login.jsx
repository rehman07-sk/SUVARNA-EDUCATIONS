
import { useState } from "react";
import { GraduationCap, Eye, EyeOff, ShieldCheck, BookOpen, UserRound } from "lucide-react";
import "./Login.css";
import { API_BASE_URL } from "./config";

const API = API_BASE_URL;

const roles = [
  {
    value: "student",
    label: "Student",
    description: "Access your academic records",
    icon: BookOpen,
  },
  {
    value: "teacher",
    label: "Teacher",
    description: "Manage your classroom",
    icon: UserRound,
  },
  {
    value: "admin",
    label: "Principal",
    description: "Manage school administration",
    icon: ShieldCheck,
  },
];

export default function Login({ onLogin }) {
  const [role, setRole] = useState("student");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${API}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, role }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Login failed.");
      }

      if (!data.token || !data.user) {
        throw new Error("The server did not return a valid login response.");
      }

      // Keep the login active for this browser tab.
      sessionStorage.setItem("schoolToken", data.token);
      sessionStorage.setItem("schoolUser", JSON.stringify(data.user));

console.log("Logged-in user:", data.user);
console.log("Selected role:", role);
      onLogin(data.user, data.token);
    } catch (err) {
      setError(err.message || "Cannot connect to the server.");
    } finally {
      setLoading(false);
    }
  }

  const selectedRole = roles.find((item) => item.value === role);

  return (
    <main className="login-page">
      <section className="login-brand-panel">
        <div className="login-brand">
          <div className="login-brand-icon">
            <GraduationCap size={30} />
          </div>
          <div>
            <strong>School Management System</strong>
            <span>Student, Teacher &amp; Principal Portal</span>
          </div>
        </div>

        <div className="login-brand-content">
          <span className="login-eyebrow">YOUR SCHOOL. ONE PLATFORM.</span>
          <h1>Better school management starts here.</h1>
          <p>
            A single place to access school information, manage academic
            activities, and stay connected.
          </p>

          <div className="login-feature">
            <ShieldCheck size={21} />
            <div>
              <strong>Role-based access</strong>
              <span>Dedicated access for students, teachers and principals.</span>
            </div>
          </div>
        </div>

        <div className="login-brand-footer">
          © 2026 School Management System
        </div>
      </section>

      <section className="login-form-panel">
        <div className="login-form-wrap">
          <div className="login-mobile-logo">
            <GraduationCap size={27} />
            <strong>School Management System</strong>
          </div>

          <span className="login-eyebrow">WELCOME BACK</span>
          <h2>Sign in to your account</h2>
          <p className="login-subtitle">
            Choose your role and enter your registered credentials.
          </p>

          <div className="role-options">
            {roles.map((item) => {
              const Icon = item.icon;

              return (
                <button
                  key={item.value}
                  type="button"
                  className={`role-option ${role === item.value ? "selected" : ""}`}
                  onClick={() => {
                    setRole(item.value);
                    setError("");
                  }}
                  aria-pressed={role === item.value}
                >
                  <Icon size={21} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          <div className="selected-role-note">
            <strong>{selectedRole.label} login</strong>
            <span>{selectedRole.description}</span>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            <label htmlFor="login-email">Email address</label>
            <input
              id="login-email"
              type="email"
              autoComplete="username"
              placeholder="you@school.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <div className="password-label-row">
              <label htmlFor="login-password">Password</label>
            </div>

            <div className="password-input-wrap">
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword((value) => !value)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {error && (
              <div className="login-error" role="alert">
                {error}
              </div>
            )}

            <button className="login-submit" type="submit" disabled={loading}>
              {loading ? "Signing in..." : `Sign in as ${selectedRole.label}`}
            </button>
          </form>

          <p className="login-security-note">
            <ShieldCheck size={15} />
            Your account is verified by the school server.
          </p>
        </div>
      </section>
    </main>
  );
}
