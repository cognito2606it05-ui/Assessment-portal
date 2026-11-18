// ==============================================================================
// Assessment Scheduling & Time-Window Enforcement Engine
// Controls access windows, real-time countdown timers, and auto-lock mechanisms
// ==============================================================================

class AssessmentScheduleManager {
  constructor() {
    this.storageKey = "COGNITO_ASSESSMENT_SCHEDULES_V1";
    this.schedules = this.loadSchedules();
    this.intervalId = null;
    this.startClock();
  }

  getDefaultSchedules() {
    return {
      "cognito-recruitment-2026": {
        id: "cognito-recruitment-2026",
        title: "Cognito Tech Hub Graduate Engineer Trainee (GET) Assessment 2026",
        enabled: false, // Open on demand
        startTime: null,
        endTime: null
      },
      "office-skills-2026": {
        id: "office-skills-2026",
        title: "AARKS Office Productivity, Typing & Business Communication Assessment 2026",
        enabled: true, // Scheduled strictly for 19/11/2026
        startTime: "2026-11-19T10:00",
        endTime: "2026-11-19T11:30"
      }
    };
  }

  loadSchedules() {
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        // User explicitly requested: Scheduled ONLY for 19/11/2026
        parsed["office-skills-2026"] = {
          id: "office-skills-2026",
          title: "AARKS Office Productivity, Typing & Business Communication Assessment 2026",
          enabled: true,
          startTime: "2026-11-19T10:00",
          endTime: "2026-11-19T11:30"
        };
        localStorage.setItem(this.storageKey, JSON.stringify(parsed));
        return parsed;
      }
    } catch (e) {
      console.warn("Failed to load schedules from localStorage:", e);
    }
    const def = this.getDefaultSchedules();
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(def));
    } catch (_) {}
    return def;
  }

  saveSchedules() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.schedules));
      this.updateDashboardUI();
    } catch (e) {
      console.warn("Failed to persist schedules:", e);
    }
  }

  setSchedule(assessmentId, startTime, endTime, enabled = true) {
    if (!this.schedules[assessmentId]) {
      this.schedules[assessmentId] = { id: assessmentId };
    }
    this.schedules[assessmentId].startTime = startTime;
    this.schedules[assessmentId].endTime = endTime;
    this.schedules[assessmentId].enabled = Boolean(enabled);
    this.saveSchedules();
  }

  openNow(assessmentId) {
    if (this.schedules[assessmentId]) {
      this.schedules[assessmentId].enabled = false;
      this.schedules[assessmentId].startTime = null;
      this.schedules[assessmentId].endTime = null;
      this.saveSchedules();
    }
  }

  lockNow(assessmentId) {
    if (this.schedules[assessmentId]) {
      this.schedules[assessmentId].enabled = true;
      this.schedules[assessmentId].startTime = "2026-11-19T10:00";
      this.schedules[assessmentId].endTime = "2026-11-19T11:30";
      this.saveSchedules();
    }
  }

  getStatus(assessmentId) {
    const sched = this.schedules[assessmentId];
    if (!sched || !sched.enabled || !sched.startTime) {
      return { status: "OPEN", label: "Available Now", canStart: true, countdownText: "Available Now" };
    }

    const now = Date.now();
    const start = new Date(sched.startTime).getTime();
    const end = sched.endTime ? new Date(sched.endTime).getTime() : start + 90 * 60000;

    if (now < start) {
      const diffMs = start - now;
      const days = Math.floor(diffMs / 86400000);
      const hours = Math.floor((diffMs % 86400000) / 3600000);
      const mins = Math.floor((diffMs % 3600000) / 60000);
      const secs = Math.floor((diffMs % 60000) / 1000);

      let countdown = "";
      if (days > 0) {
        countdown = `${days}d ${hours.toString().padStart(2, "0")}h ${mins.toString().padStart(2, "0")}m ${secs.toString().padStart(2, "0")}s`;
      } else {
        countdown = `${hours.toString().padStart(2, "0")}h ${mins.toString().padStart(2, "0")}m ${secs.toString().padStart(2, "0")}s`;
      }

      return {
        status: "UPCOMING",
        label: "Scheduled",
        canStart: false,
        countdownText: `Opens in ${countdown}`,
        formattedDate: "19/11/2026",
        formattedStartTime: "10:00 AM",
        scheduledNotice: "Scheduled: 19/11/2026 (10:00 AM - 11:30 AM)",
        startTime: sched.startTime,
        endTime: sched.endTime
      };
    } else if (now >= start && now <= end) {
      const diffMs = end - now;
      const hours = Math.floor(diffMs / 3600000);
      const mins = Math.floor((diffMs % 3600000) / 60000);
      const secs = Math.floor((diffMs % 60000) / 1000);
      const countdown = `${hours.toString().padStart(2, "0")}h ${mins.toString().padStart(2, "0")}m ${secs.toString().padStart(2, "0")}s`;

      return {
        status: "LIVE",
        label: "Live Now",
        canStart: true,
        countdownText: `Closes in ${countdown}`,
        startTime: sched.startTime,
        endTime: sched.endTime
      };
    } else {
      // Keep scheduled state clean
      return {
        status: "UPCOMING",
        label: "Scheduled",
        canStart: false,
        countdownText: "Scheduled on 19/11/2026 (10:00 AM)",
        formattedDate: "19/11/2026",
        formattedStartTime: "10:00 AM",
        scheduledNotice: "Scheduled: 19/11/2026 (10:00 AM - 11:30 AM)",
        startTime: sched.startTime,
        endTime: sched.endTime
      };
    }
  }

  startClock() {
    if (this.intervalId) clearInterval(this.intervalId);
    this.intervalId = setInterval(() => {
      this.updateDashboardUI();
    }, 1000);
  }

  updateDashboardUI() {
    // Assessment 1 Status
    const btn1 = document.getElementById("dash-action-btn-1") || document.getElementById("dash-action-btn");
    const card1 = document.getElementById("dash-assessment-card") || document.getElementById("dash-card-1");
    if (btn1 && card1) {
      this.updateCardUI("cognito-recruitment-2026", card1.id, btn1.id, "dash-sched-badge-1");
    }

    // Assessment 2 Status
    const btn2 = document.getElementById("dash-action-btn-2");
    const card2 = document.getElementById("dash-assessment-card-2") || document.getElementById("dash-card-2");
    if (btn2 && card2) {
      this.updateCardUI("office-skills-2026", card2.id, btn2.id, "dash-sched-badge-2");
    }
  }

  updateCardUI(assessmentId, cardId, btnId, badgeId) {
    const badge = document.getElementById(badgeId);
    const btn = document.getElementById(btnId);
    if (!btn) return;

    const currentUser = window.appState?.currentUser;
    const isCompleted = currentUser && (currentUser.status === "Completed" || currentUser.assessmentCompleted);

    if (isCompleted && assessmentId === "cognito-recruitment-2026") {
      if (badge) {
        badge.className = "px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200";
        badge.innerHTML = `<i class="fas fa-check-circle mr-1"></i>Completed`;
      }
      btn.disabled = true;
      btn.className = "px-5 py-2.5 text-xs font-bold bg-slate-200 text-slate-500 rounded-lg cursor-not-allowed";
      btn.innerHTML = `<i class="fas fa-check mr-1.5"></i>Assessment Submitted`;
      return;
    }

    const state = this.getStatus(assessmentId);

    if (state.status === "UPCOMING") {
      if (badge) {
        badge.className = "px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-300 flex items-center gap-1.5 shadow-xs whitespace-nowrap";
        badge.innerHTML = `<i class="fas fa-calendar-alt text-amber-600"></i> Scheduled on 19/11/2026 • ${state.countdownText}`;
      }
      btn.disabled = true;
      btn.className = "px-5 py-2.5 text-xs font-bold bg-slate-100 text-slate-500 rounded-lg cursor-not-allowed flex items-center justify-center gap-1.5 shadow-none border border-slate-200 shrink-0";
      btn.innerHTML = `<i class="fas fa-lock text-slate-400"></i> Scheduled on 19/11/2026 (10:00 AM)`;
    } else if (state.status === "LIVE" || state.status === "OPEN") {
      if (badge) {
        badge.className = "px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 flex items-center gap-1.5 shadow-xs whitespace-nowrap";
        badge.innerHTML = `<i class="fas fa-circle text-emerald-500 text-[8px] animate-ping"></i> Available Now`;
      }
      btn.disabled = false;
      btn.className = "px-5 py-2.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition shadow-md flex items-center justify-center gap-2 cursor-pointer shrink-0";
      btn.innerHTML = `<i class="fas fa-play"></i> Start Assessment Now`;
    }
  }
}

window.assessmentScheduleManager = new AssessmentScheduleManager();
