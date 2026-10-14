
import React, { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Clock3,
  ChartNoAxesColumn,
  Download,
  Filter,
  FileSpreadsheet,
} from "lucide-react";
import "./Attendance.css";
import { API_BASE_URL } from "../config";

const API = `${API_BASE_URL}/attendance/my`;
const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function dateKey(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function getRecordDateKey(value) {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return [
    date.getUTCFullYear(),
    String(date.getUTCMonth() + 1).padStart(2, "0"),
    String(date.getUTCDate()).padStart(2, "0"),
  ].join("-");
}

function AttendanceCalendar({
  year,
  month,
  attendance,
  onSelectDate,
  selectedDate,
  statusFilter,
}) {
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const offset = (firstDay.getDay() + 6) % 7;

  const cells = [
    ...Array(offset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
  ];

  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="attendance-calendar">
      <h3>
        {new Date(year, month).toLocaleDateString("en-IN", {
          month: "long",
          year: "numeric",
        })}
      </h3>

      <div className="attendance-weekdays">
        {weekdays.map((day) => (
          <span key={day}>{day}</span>
        ))}
      </div>

      <div className="attendance-calendar-grid">
        {cells.map((day, index) => {
          if (!day) {
            return (
              <span
                className="attendance-empty-day"
                key={`empty-${index}`}
              />
            );
          }

          const key = dateKey(year, month, day);
          const status = attendance[key] || "unrecorded";
          const isWeekend = [5, 6].includes(index % 7);
          const matchesFilter =
            statusFilter === "all" || status === statusFilter;

          return (
            <button
              type="button"
              key={key}
              className={`attendance-day ${status} ${
                selectedDate === key ? "day-selected" : ""
              } ${isWeekend ? "weekend" : ""} ${
                !matchesFilter && statusFilter !== "all"
                  ? "day-filtered-out"
                  : ""
              }`}
              title={`${key}: ${status}`}
              onClick={() => onSelectDate(key)}
              aria-label={`${key}, ${status}`}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function Attendance({ user }) {
  const today = new Date();

  const [month, setMonth] = useState(today.getMonth());
  const [year, setYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("calendar");

  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [attendanceError, setAttendanceError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadAttendance() {
      setLoading(true);
      setAttendanceError("");

      try {
        const token = sessionStorage.getItem("schoolToken");

        if (!token) {
          throw new Error("Please sign in again to view attendance.");
        }

        const response = await fetch(API, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          signal: controller.signal,
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Unable to load attendance records."
          );
        }

        if (!Array.isArray(data)) {
          throw new Error("The attendance API returned an unexpected response.");
        }

        setAttendanceRecords(data);
      } catch (error) {
        if (error.name !== "AbortError") {
          setAttendanceError(
            error.message || "Unable to load attendance records."
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadAttendance();

    return () => controller.abort();
  }, []);

  const attendance = useMemo(() => {
    const result = {};

    for (const record of attendanceRecords) {
      const key = getRecordDateKey(record.date);
      const status = String(record.status || "").toLowerCase();

      if (!key || !["present", "absent", "late"].includes(status)) {
        continue;
      }

      result[key] = status;
    }

    return result;
  }, [attendanceRecords]);

  const summary = useMemo(() => {
    const result = { present: 0, absent: 0, late: 0 };

    for (const [key, status] of Object.entries(attendance)) {
      const [recordYear, recordMonth] = key.split("-").map(Number);

      if (recordYear === year && recordMonth === month + 1) {
        result[status] += 1;
      }
    }

    return result;
  }, [attendance, month, year]);

  const recordedDays =
    summary.present + summary.absent + summary.late;

  const attendanceRate = recordedDays
    ? Math.round((summary.present / recordedDays) * 100)
    : 0;

  const moveMonth = (amount) => {
    const next = new Date(year, month + amount, 1);
    setYear(next.getFullYear());
    setMonth(next.getMonth());
    setSelectedDate("");
  };

  const selectedStatus = selectedDate
    ? attendance[selectedDate] || "unrecorded"
    : "";

  const trend = useMemo(() => {
    return Array.from({ length: 6 }, (_, index) => {
      const date = new Date(year, month - 5 + index, 1);

      const counts = {
        label: date.toLocaleDateString("en-IN", {
          month: "short",
          year: "2-digit",
        }),
        present: 0,
        absent: 0,
        late: 0,
      };

      for (const [key, status] of Object.entries(attendance)) {
        const [recordYear, recordMonth] = key.split("-").map(Number);

        if (
          recordYear === date.getFullYear() &&
          recordMonth === date.getMonth() + 1
        ) {
          counts[status] += 1;
        }
      }

      return counts;
    });
  }, [attendance, month, year]);

  const handleExportCSV = () => {
    const rows = [
      ["Date", "Status"],
      ...Object.entries(attendance)
        .filter(([key]) => {
          const [recordYear, recordMonth] = key.split("-").map(Number);
          return recordYear === year && recordMonth === month + 1;
        })
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, status]) => [date, status]),
    ];

    const csvContent = rows
      .map((row) =>
        row
          .map((value) => `"${String(value).replace(/"/g, '""')}"`)
          .join(",")
      )
      .join("\r\n");

    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `attendance_report_${year}_${String(month + 1).padStart(2, "0")}.csv`;

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
  };

  return (
    <div className="attendance-page">
      <header className="attendance-page-header">
        <div>
          <span className="attendance-eyebrow">
            STUDENT PORTAL · ACADEMIC SESSION 2026–27
          </span>
          <h1>Attendance Management</h1>
          <p>
            Welcome back, {user?.name || "Student"}. Monitor your daily
            attendance and records.
          </p>
        </div>

        <div className="attendance-header-actions">
          <button
            className="attendance-outline-button"
            type="button"
            onClick={handleExportCSV}
            disabled={loading || Boolean(attendanceError)}
          >
            <FileSpreadsheet size={16} />
            Export CSV
          </button>

          <button
            className="attendance-outline-button"
            type="button"
            onClick={() => window.print()}
          >
            <Download size={16} />
            Print Report
          </button>
        </div>
      </header>

      {loading && (
        <div className="attendance-demo-notice" role="status">
          Loading your attendance records...
        </div>
      )}

      {attendanceError && (
        <div className="attendance-demo-notice" role="alert">
          <strong>Unable to load attendance:</strong> {attendanceError}
        </div>
      )}

      {!loading && !attendanceError && attendanceRecords.length === 0 && (
        <div className="attendance-demo-notice" role="status">
          No attendance records have been added to your account yet. Your
          calendar will update when your school records your attendance.
        </div>
      )}

      <div className="attendance-nav-tabs">
        <button
          type="button"
          className={`attendance-tab-btn ${
            activeTab === "calendar" ? "active" : ""
          }`}
          onClick={() => setActiveTab("calendar")}
        >
          Calendar &amp; Records
        </button>

        <button
          type="button"
          className={`attendance-tab-btn ${
            activeTab === "analytics" ? "active" : ""
          }`}
          onClick={() => setActiveTab("analytics")}
        >
          Detailed Analytics
        </button>
      </div>

      <section className="attendance-legend">
        <span><i className="legend-dot present-dot" /> Present</span>
        <span><i className="legend-dot absent-dot" /> Absent</span>
        <span><i className="legend-dot late-dot" /> Late</span>
        <span><i className="legend-dot unrecorded-dot" /> Not recorded</span>
      </section>

      {activeTab === "calendar" && (
        <section className="attendance-calendar-panel">
          <div className="attendance-panel-toolbar">
            <div>
              <h2><CalendarDays size={20} /> Monthly calendar</h2>
              <p>Select a date to inspect its attendance status.</p>
            </div>

            <div className="attendance-toolbar-controls">
              <div className="attendance-filter-dropdown">
                <Filter size={14} />
                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  aria-label="Filter attendance status"
                >
                  <option value="all">All Statuses</option>
                  <option value="present">Present Only</option>
                  <option value="absent">Absent Only</option>
                  <option value="late">Late Only</option>
                  <option value="unrecorded">Not Recorded</option>
                </select>
              </div>

              <div className="attendance-month-controls">
                <button
                  type="button"
                  onClick={() => moveMonth(-1)}
                  aria-label="Previous month"
                >
                  <ChevronLeft size={18} />
                </button>

                <strong>
                  {new Date(year, month).toLocaleDateString("en-IN", {
                    month: "short",
                    year: "numeric",
                  })}
                </strong>

                <button
                  type="button"
                  onClick={() => moveMonth(1)}
                  aria-label="Next month"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          </div>

          <div className="attendance-calendars">
            <AttendanceCalendar
              year={year}
              month={month}
              attendance={attendance}
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
              statusFilter={statusFilter}
            />

            <AttendanceCalendar
              year={month === 11 ? year + 1 : year}
              month={(month + 1) % 12}
              attendance={attendance}
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
              statusFilter={statusFilter}
            />
          </div>

          {selectedDate && (
            <div className="attendance-selected-date">
              <div>
                <small>Selected Date</small>
                <strong>{selectedDate}</strong>
              </div>
              <span className={`status-pill ${selectedStatus}`}>
                {selectedStatus === "unrecorded"
                  ? "No record"
                  : selectedStatus}
              </span>
            </div>
          )}
        </section>
      )}

      <section className="attendance-stat-grid">
        <div className="attendance-stat-card stat-present">
          <div className="attendance-stat-icon"><CheckCircle2 /></div>
          <span>Days Present</span>
          <strong>{loading ? "…" : summary.present}</strong>
          <small>Selected month</small>
        </div>

        <div className="attendance-stat-card stat-absent">
          <div className="attendance-stat-icon"><XCircle /></div>
          <span>Days Absent</span>
          <strong>{loading ? "…" : summary.absent}</strong>
          <small>Selected month</small>
        </div>

        <div className="attendance-stat-card stat-late">
          <div className="attendance-stat-icon"><Clock3 /></div>
          <span>Days Late</span>
          <strong>{loading ? "…" : summary.late}</strong>
          <small>Selected month</small>
        </div>

        <div className="attendance-stat-card stat-rate">
          <div className="attendance-stat-icon"><ChartNoAxesColumn /></div>
          <span>Attendance Rate</span>
          <strong>
            {loading ? "…" : recordedDays ? `${attendanceRate}%` : "—"}
          </strong>
          <small>Present ÷ recorded days</small>
        </div>
      </section>

      {activeTab === "analytics" && (
        <section className="attendance-analytics-grid">
          <div className="attendance-analytics-card">
            <div className="attendance-section-heading">
              <div>
                <h2>Attendance breakdown</h2>
                <p>Selected month status records</p>
              </div>
            </div>

            <div className="attendance-donut-layout">
              <div
                className="attendance-donut"
                style={{
                  background: recordedDays
                    ? `conic-gradient(#15803d 0 ${summary.present / recordedDays * 100}%, #b91c1c ${summary.present / recordedDays * 100}% ${(summary.present + summary.absent) / recordedDays * 100}%, #ca8a04 ${(summary.present + summary.absent) / recordedDays * 100}% 100%)`
                    : "#f1f5f9",
                }}
              >
                <div className="attendance-donut-center">
                  <span>Rate</span>
                  <strong>
                    {recordedDays ? `${attendanceRate}%` : "—"}
                  </strong>
                </div>
              </div>

              <div className="attendance-breakdown-list">
                <p><i className="legend-dot present-dot" /> Present <strong>{summary.present}</strong></p>
                <p><i className="legend-dot absent-dot" /> Absent <strong>{summary.absent}</strong></p>
                <p><i className="legend-dot late-dot" /> Late <strong>{summary.late}</strong></p>
              </div>
            </div>
          </div>

          <div className="attendance-analytics-card">
            <div className="attendance-section-heading">
              <div>
                <h2>Monthly attendance trend</h2>
                <p>Based on records retrieved from the server</p>
              </div>
            </div>

            <div className="attendance-chart-legend">
              <span><i className="legend-dot present-dot" /> Present</span>
              <span><i className="legend-dot absent-dot" /> Absent</span>
              <span><i className="legend-dot late-dot" /> Late</span>
            </div>

            <div className="attendance-bar-chart">
              {trend.map((item) => {
                const max = Math.max(
                  ...trend.map((entry) =>
                    entry.present + entry.absent + entry.late
                  ),
                  1
                );

                return (
                  <div className="attendance-bar-group" key={item.label}>
                    <div className="attendance-bars">
                      <span
                        className="bar-present"
                        style={{ height: `${(item.present / max) * 100}%` }}
                        title={`${item.present} present`}
                      />
                      <span
                        className="bar-absent"
                        style={{ height: `${(item.absent / max) * 100}%` }}
                        title={`${item.absent} absent`}
                      />
                      <span
                        className="bar-late"
                        style={{ height: `${(item.late / max) * 100}%` }}
                        title={`${item.late} late`}
                      />
                    </div>
                    <small>{item.label}</small>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      <footer className="attendance-page-footer">
        School Management System · Authorized Student Portal
      </footer>
    </div>
  );
}
