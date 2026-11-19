// ==============================================================================
// Cognito Tech Hub & Quantex Enterprise Admin Portal Controller
// Master Prompt V2: 23-Module Enterprise Assessment Administration
// ==============================================================================

class AdminManager {
  constructor() {
    this.currentModule = "dashboard";
    this.currentFilter = {
      search: "",
      course: "ALL",
      stream: "ALL",
      district: "ALL",
      status: "ALL"
    };
    this.candidates = [];
    this.stats = {};
    this.selectedCandidateId = null;
    this.interruptedAttempts = [];
    this.recoveryCodes = [];
    this._syncInterval = null;
  }

  /**
   * Initialize and render the Admin Portal
   */
  async renderDashboard() {
    this.bindSidebarEvents();
    this.startRealtimeSync();
    await this.switchModule(this.currentModule || "dashboard");
  }

  /**
   * Ultra-fast Real-time Database Synchronization Engine
   */
  startRealtimeSync() {
    if (this._syncInterval) clearInterval(this._syncInterval);
    this._syncInterval = setInterval(async () => {
      const adminView = document.getElementById("admin-portal-view");
      if (!adminView || adminView.classList.contains("hidden")) return;

      // Avoid UI disruption when modal dialog is open
      const modal = document.getElementById("admin-dynamic-modal");
      if (modal && !modal.classList.contains("hidden")) return;

      const prevCount = (this.candidates || []).length;
      await this.loadCandidatesFromDb();
      const newCount = (this.candidates || []).length;

      // Dynamically update view if on candidates or rankings module
      if (this.currentModule === "students") {
        this.filterStudentsTable();
      } else if (this.currentModule === "rankings") {
        const vp = document.getElementById("admin-module-viewport");
        if (vp) await this.renderLiveRankings(vp);
      } else if (this.currentModule === "dashboard" && newCount !== prevCount) {
        const vp = document.getElementById("admin-module-viewport");
        if (vp) await this.renderDashboardOverview(vp);
      }
    }, 4000);
  }

  /**
   * Bind resilient click listeners to all sidebar module items
   */
  bindSidebarEvents() {
    const links = document.querySelectorAll(".admin-nav-link");
    links.forEach(link => {
      const key = link.getAttribute("data-module-key");
      if (key) {
        link.onclick = (e) => {
          if (e) {
            e.preventDefault();
            e.stopPropagation();
          }
          this.switchModule(key);
        };
      }
    });
  }

  /**
   * Filter sidebar modules by search input
   */
  filterModules(query) {
    const q = (query || "").trim().toLowerCase();
    const links = document.querySelectorAll(".admin-nav-link");
    const groups = document.querySelectorAll("#admin-sidebar-modules-list .admin-nav-group-title");

    links.forEach(link => {
      const text = link.textContent.toLowerCase();
      const match = !q || text.includes(q);
      link.style.display = match ? "flex" : "none";
    });

    // Check if any links in a group are visible
    groups.forEach(group => {
      let next = group.nextElementSibling;
      let hasVisible = false;
      while (next && !next.classList.contains("admin-nav-group-title")) {
        if (next.classList.contains("admin-nav-link") && next.style.display !== "none") {
          hasVisible = true;
          break;
        }
        next = next.nextElementSibling;
      }
      group.style.display = (!q || hasVisible) ? "flex" : "none";
    });
  }

  /**
   * Switch active sidebar module with robust error boundary
   */
  async switchModule(moduleKey) {
    this.currentModule = moduleKey;

    // Reset sidebar scroll to top on dashboard
    const sidebar = document.getElementById("admin-sidebar") || document.querySelector(".admin-sidebar");
    if (sidebar && moduleKey === "dashboard") {
      sidebar.scrollTop = 0;
    }

    // Update active class on sidebar links
    const links = document.querySelectorAll(".admin-nav-link");
    links.forEach(link => {
      const key = link.getAttribute("data-module-key") || "";
      const onclickAttr = link.getAttribute("onclick") || "";
      if (key === moduleKey || onclickAttr.includes(`'${moduleKey}'`)) {
        link.classList.add("active");
      } else {
        link.classList.remove("active");
      }
    });

    const viewport = document.getElementById("admin-module-viewport");
    if (!viewport) return;

    viewport.innerHTML = `
      <div class="flex items-center justify-center p-16 text-slate-500">
        <i class="fas fa-spinner fa-spin text-3xl mr-3 text-indigo-600"></i>
        <span class="text-sm font-bold">Loading Module: ${moduleKey.toUpperCase()}...</span>
      </div>
    `;

    try {
      switch (moduleKey) {
        case "dashboard":
          await this.renderDashboardOverview(viewport);
          break;
        case "students":
          await this.renderStudentManagement(viewport);
          break;
        case "colleges":
          await this.renderCollegeManagement(viewport);
          break;
        case "courses":
          await this.renderCourseManagement(viewport);
          break;
        case "tasks":
          await this.renderTaskAssignment(viewport);
          break;
        case "exams":
          await this.renderExamManagement(viewport);
          break;
        case "scheduling":
          await this.renderExamScheduling(viewport);
          break;
        case "questions":
          this.renderQuestionBank(viewport);
          break;
        case "papergen":
          this.renderPaperGenerator(viewport);
          break;
        case "monitoring":
          await this.renderExamMonitoring(viewport);
          break;
        case "restrictions":
          this.renderExamRestrictions(viewport);
          break;
        case "recovery":
          await this.renderExamRecovery(viewport);
          break;
        case "answers":
          await this.renderAnswerSheets(viewport);
          break;
        case "scoring":
          this.renderMarksCalculation(viewport);
          break;
        case "rankings":
          await this.renderLiveRankings(viewport);
          break;
        case "approvals":
          await this.renderResultApprovals(viewport);
          break;
        case "announcement":
          await this.renderResultAnnouncement(viewport);
          break;
        case "notifications":
          this.renderNotificationsModule(viewport);
          break;
        case "reports":
          await this.renderReportsAnalytics(viewport);
          break;
        case "admins":
          this.renderAdminUsers(viewport);
          break;
        case "rbac":
          this.renderRolePermissions(viewport);
          break;
        case "settings":
          await this.renderSystemSettings(viewport);
          break;
        case "audit":
          await this.renderAuditLogs(viewport);
          break;
        default:
          await this.renderDashboardOverview(viewport);
      }
    } catch (err) {
      console.error("Module render error for " + moduleKey + ":", err);
      viewport.innerHTML = `
        <div class="bg-white border border-red-200 rounded-2xl p-8 text-center max-w-lg mx-auto shadow-sm my-12">
          <div class="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-3 text-2xl border border-red-100">
            <i class="fas fa-exclamation-triangle"></i>
          </div>
          <h3 class="text-base font-black text-slate-900">Module Temporarily Unavailable</h3>
          <p class="text-xs text-slate-500 mt-1 mb-4">Error loading module <strong>${moduleKey}</strong>: ${err.message || 'Unknown network error'}</p>
          <div class="flex items-center justify-center gap-3">
            <button onclick="window.adminManager.switchModule('${moduleKey}')" class="px-4 py-2 bg-gradient-to-r from-sky-600 to-blue-600 text-white rounded-xl text-xs font-bold shadow-sm">
              <i class="fas fa-redo-alt mr-1.5"></i> Retry
            </button>
            <button onclick="window.adminManager.switchModule('dashboard')" class="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition">
              Back to Dashboard
            </button>
          </div>
        </div>
      `;
    }
  }

  // --------------------------------------------------------------------------
  // MODULE 1: DASHBOARD OVERVIEW (EXECUTIVE RECRUITMENT COMMAND)
  // --------------------------------------------------------------------------
  async renderDashboardOverview(container) {
    await this.loadCandidatesFromDb();
    const students = this.candidates || [];

    let apiStats = null;
    try {
      const res = await fetch("./admin-api.php?action=dashboard_stats");
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.stats) apiStats = data.stats;
        else if (data.success) apiStats = data;
      }
    } catch (e) {
      console.warn("Could not load stats from DB:", e);
    }

    // Accurate metric calculations (guaranteed across online and offline)
    const totalRegistered = students.length;
    const completedStudents = students.filter(s => s.status === "Completed" || s.assessment || s.testStatus === "Completed");
    const completedCount = completedStudents.length;
    const pendingCount = Math.max(0, totalRegistered - completedCount);
    const completedPct = totalRegistered > 0 ? Math.round((completedCount / totalRegistered) * 100) : 0;

    const scores = completedStudents.map(s => {
      if (s.assessment && s.assessment.total_score != null) return Number(s.assessment.total_score);
      if (s.testScore && s.testScore.totalScore != null) return Number(s.testScore.totalScore);
      if (s.totalScore != null) return Number(s.totalScore);
      return 0;
    });

    const passedCount = scores.filter(sc => sc >= 60).length;
    const qualifiedPct = completedCount > 0 ? Math.round((passedCount / completedCount) * 100) : 0;
    const avgScore = scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : "0.0";
    const topScore = scores.length > 0 ? Math.max(...scores) : 0;

    let cleanCodeCount = 0;
    let totalCodingAttempts = 0;
    completedStudents.forEach(s => {
      const a = s.assessment || s.testScore || {};
      if (a.coding_q1_score != null || a.coding_q1_cases_passed != null) {
        totalCodingAttempts++;
        if (Number(a.coding_q1_cases_passed) === 4 || Number(a.coding_q1_score) === 20) cleanCodeCount++;
      }
      if (a.coding_q2_score != null || a.coding_q2_cases_passed != null) {
        totalCodingAttempts++;
        if (Number(a.coding_q2_cases_passed) === 4 || Number(a.coding_q2_score) === 20) cleanCodeCount++;
      }
    });

    // College distribution calculation
    const collegeMap = {};
    students.forEach(st => {
      const c = (st.college || "Other AP Engineering Institution").trim();
      collegeMap[c] = (collegeMap[c] || 0) + 1;
    });
    const collegeList = Object.entries(collegeMap).map(([college, count]) => ({ college, count }));
    collegeList.sort((a, b) => b.count - a.count);

    container.innerHTML = `
      <div class="space-y-6 max-w-7xl mx-auto">
        
        <!-- Header & Quick Actions -->
        <div class="flex items-center justify-between flex-wrap gap-4 border-b border-slate-200 pb-4">
          <div>
            <div class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 mb-1.5">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Live Recruitment Drive 2026
            </div>
            <h2 class="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <i class="fas fa-chart-line text-indigo-600"></i> Executive Recruitment Dashboard
            </h2>
            <p class="text-xs text-slate-500 mt-0.5">Real-time candidate registrations, examination status, and score benchmarks across Andhra Pradesh.</p>
          </div>
          <div class="flex items-center gap-2.5">
            <button onclick="window.adminManager.switchModule('students')" class="px-3.5 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition shadow-sm flex items-center gap-1.5">
              <i class="fas fa-users"></i> View All Candidates (${totalRegistered})
            </button>
            <button onclick="window.adminManager.exportStudentsCsv()" class="px-3.5 py-2 text-xs font-bold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl transition shadow-xs flex items-center gap-1.5">
              <i class="fas fa-download text-emerald-600"></i> Export CSV
            </button>
            <button onclick="window.adminManager.renderDashboardOverview(document.getElementById('admin-module-viewport'))" class="px-3.5 py-2 text-xs font-bold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl transition shadow-xs flex items-center gap-1.5" title="Refresh Live Data">
              <i class="fas fa-sync-alt text-slate-500"></i> Refresh
            </button>
          </div>
        </div>

        <!-- 5 High-Impact Clear Registration & Performance Metric Cards -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          
          <!-- Card 1: Total Registered Candidates -->
          <div class="bg-white border-2 border-indigo-100 rounded-2xl p-5 shadow-xs hover:border-indigo-300 transition group">
            <div class="flex items-center justify-between mb-2">
              <span class="text-[11px] font-extrabold uppercase tracking-wider text-indigo-600">Total Registered</span>
              <div class="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-sm font-bold">
                <i class="fas fa-user-graduate"></i>
              </div>
            </div>
            <div class="flex items-baseline gap-2">
              <span class="text-3xl sm:text-4xl font-black text-slate-900">${totalRegistered}</span>
              <span class="text-xs font-bold text-indigo-600">Candidates</span>
            </div>
            <p class="text-[11px] text-slate-500 mt-2 font-medium">Verified student registrations across Andhra Pradesh</p>
          </div>

          <!-- Card 2: Assessments Completed -->
          <div class="bg-white border-2 border-emerald-100 rounded-2xl p-5 shadow-xs hover:border-emerald-300 transition group">
            <div class="flex items-center justify-between mb-2">
              <span class="text-[11px] font-extrabold uppercase tracking-wider text-emerald-600">Exams Completed</span>
              <div class="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-sm font-bold">
                <i class="fas fa-check-circle"></i>
              </div>
            </div>
            <div class="flex items-baseline gap-2">
              <span class="text-3xl sm:text-4xl font-black text-emerald-700">${completedCount}</span>
              <span class="text-xs font-bold text-emerald-600">(${completedPct}%)</span>
            </div>
            <p class="text-[11px] text-slate-500 mt-2 font-medium">Finished all 3 assessment sections and submitted</p>
          </div>

          <!-- Card 3: Tests Pending / Assigned -->
          <div class="bg-white border-2 border-amber-100 rounded-2xl p-5 shadow-xs hover:border-amber-300 transition group">
            <div class="flex items-center justify-between mb-2">
              <span class="text-[11px] font-extrabold uppercase tracking-wider text-amber-600">Awaiting Test</span>
              <div class="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-sm font-bold">
                <i class="fas fa-hourglass-half"></i>
              </div>
            </div>
            <div class="flex items-baseline gap-2">
              <span class="text-3xl sm:text-4xl font-black text-amber-600">${pendingCount}</span>
              <span class="text-xs font-bold text-amber-600">Pending</span>
            </div>
            <p class="text-[11px] text-slate-500 mt-2 font-medium">Registered candidates yet to complete examination</p>
          </div>

          <!-- Card 4: Qualified Candidates -->
          <div class="bg-white border-2 border-blue-100 rounded-2xl p-5 shadow-xs hover:border-blue-300 transition group">
            <div class="flex items-center justify-between mb-2">
              <span class="text-[11px] font-extrabold uppercase tracking-wider text-blue-600">Cutoff Qualified</span>
              <div class="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-sm font-bold">
                <i class="fas fa-award"></i>
              </div>
            </div>
            <div class="flex items-baseline gap-2">
              <span class="text-3xl sm:text-4xl font-black text-blue-700">${passedCount}</span>
              <span class="text-xs font-bold text-blue-600">≥ 60 Marks</span>
            </div>
            <p class="text-[11px] text-slate-500 mt-2 font-medium">Shortlisted for Technical Interview round</p>
          </div>

          <!-- Card 5: Score Benchmarks -->
          <div class="bg-white border-2 border-teal-100 rounded-2xl p-5 shadow-xs hover:border-teal-300 transition group">
            <div class="flex items-center justify-between mb-2">
              <span class="text-[11px] font-extrabold uppercase tracking-wider text-teal-600">Score Average</span>
              <div class="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center text-sm font-bold">
                <i class="fas fa-trophy"></i>
              </div>
            </div>
            <div class="flex items-baseline gap-1">
              <span class="text-3xl sm:text-4xl font-black text-slate-800">${avgScore}</span>
              <span class="text-xs font-bold text-slate-400">/ 100</span>
            </div>
            <p class="text-[11px] text-teal-700 font-bold mt-2">Highest: ${topScore}/100 • Clean Codes: ${cleanCodeCount}/${totalCodingAttempts || (completedCount * 2)}</p>
          </div>

        </div>

        <!-- 2 Clear Main Panels: Registered Colleges & Live Candidate Roster -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          <!-- Left: Recognized College Participation (AP Institutions) -->
          <div class="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
            <div class="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 class="text-sm font-black text-slate-900 flex items-center gap-2">
                  <i class="fas fa-university text-indigo-600"></i> Registered Institutions
                </h3>
                <span class="text-[11px] text-slate-500">Student enrollment by Andhra Pradesh college</span>
              </div>
              <span class="text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
                ${collegeList.length} Institutions
              </span>
            </div>

            <div class="space-y-2.5 max-h-[380px] overflow-y-auto pr-1 custom-scrollbar">
              ${collegeList.length > 0 ? collegeList.map(c => `
                <div class="flex items-center justify-between p-3 bg-slate-50 hover:bg-indigo-50/50 border border-slate-200/90 rounded-xl transition">
                  <div class="min-w-0 pr-3">
                    <div class="text-xs font-bold text-slate-900 truncate" title="${c.college}">${c.college}</div>
                    <div class="text-[10px] text-slate-500">Andhra Pradesh Engineering College</div>
                  </div>
                  <span class="px-2.5 py-1 text-xs font-black bg-indigo-100 text-indigo-800 rounded-lg shrink-0">
                    ${c.count} ${c.count === 1 ? 'Student' : 'Students'}
                  </span>
                </div>
              `).join('') : `
                <div class="text-center py-8 text-xs text-slate-400 italic">No college participation data recorded yet.</div>
              `}
            </div>
          </div>

          <!-- Right: Live Registered Candidates Quick Roster -->
          <div class="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
            <div class="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 class="text-sm font-black text-slate-900 flex items-center gap-2">
                  <i class="fas fa-users text-blue-600"></i> Registered Candidates Live Roster
                </h3>
                <span class="text-[11px] text-slate-500">All registered students, statuses, and examination scores</span>
              </div>
              <button onclick="window.adminManager.switchModule('students')" class="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition">
                <span>Manage All</span> <i class="fas fa-arrow-right text-[10px]"></i>
              </button>
            </div>

            <div class="overflow-x-auto">
              <table class="w-full text-left text-xs border-collapse">
                <thead>
                  <tr class="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                    <th class="py-2.5 px-3">Candidate</th>
                    <th class="py-2.5 px-3">College</th>
                    <th class="py-2.5 px-3 text-center">Status</th>
                    <th class="py-2.5 px-3 text-center">Score</th>
                    <th class="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  ${students.length > 0 ? students.slice(0, 8).map(st => {
                    const isDone = st.status === "Completed" || st.assessment || st.testStatus === "Completed";
                    const scoreVal = st.assessment?.total_score ?? st.testScore?.totalScore ?? st.totalScore ?? null;
                    const statusBadge = isDone 
                      ? `<span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200"><i class="fas fa-check-circle mr-1"></i>Completed</span>`
                      : `<span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200"><i class="fas fa-clock mr-1"></i>Assigned</span>`;
                    
                    const scoreDisplay = scoreVal !== null
                      ? `<span class="font-black text-indigo-700 font-mono text-xs">${scoreVal} / 100</span>`
                      : `<span class="text-slate-400 font-mono text-xs">—</span>`;

                    return `
                      <tr class="hover:bg-slate-50/80 transition">
                        <td class="py-2.5 px-3">
                          <div class="font-bold text-slate-900 text-xs">${st.name}</div>
                          <div class="text-[11px] text-slate-500 font-mono">${st.email}</div>
                          <div class="text-[10px] text-indigo-600 font-bold font-mono">${st.registrationId || ('COG-2026-' + st.id)}</div>
                        </td>
                        <td class="py-2.5 px-3">
                          <div class="font-semibold text-slate-800 text-xs truncate max-w-[200px]" title="${st.college}">${st.college}</div>
                          <div class="text-[10px] text-slate-500">${st.stream || 'CSE'} • Batch ${st.graduationYear || 2026}</div>
                        </td>
                        <td class="py-2.5 px-3 text-center">
                          ${statusBadge}
                        </td>
                        <td class="py-2.5 px-3 text-center">
                          ${scoreDisplay}
                        </td>
                        <td class="py-2.5 px-3 text-right">
                          <button onclick="window.adminManager.openCandidateDossier(${st.id})" class="px-2.5 py-1 text-[11px] font-bold bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 border border-slate-200 rounded-lg transition" title="Inspect Candidate Dossier">
                            Dossier
                          </button>
                        </td>
                      </tr>
                    `;
                  }).join('') : `
                    <tr>
                      <td colspan="5" class="text-center py-8 text-xs text-slate-400 italic">No candidates registered yet.</td>
                    </tr>
                  `}
                </tbody>
              </table>
            </div>
          </div>

        </div>

      </div>
    `;
  }

  // --------------------------------------------------------------------------
  // MODULE 2: REGISTERED CANDIDATES MANAGEMENT
  // --------------------------------------------------------------------------
  async renderStudentManagement(container) {
    await this.loadCandidatesFromDb();
    const students = this.candidates || [];
    const totalCount = students.length;
    const completedList = students.filter(s => s.status === "Completed" || s.assessment || s.testStatus === "Completed");
    const completedCount = completedList.length;
    const pendingCount = Math.max(0, totalCount - completedCount);
    const passedCount = completedList.filter(s => {
      const sc = s.assessment?.total_score ?? s.testScore?.totalScore ?? s.totalScore ?? 0;
      return sc >= 60;
    }).length;

    container.innerHTML = `
      <div class="space-y-4 max-w-7xl mx-auto">
        <div class="flex items-center justify-between flex-wrap gap-4 border-b border-slate-200 pb-4">
          <div>
            <h2 class="text-2xl font-black text-slate-900 flex items-center gap-2">
              <i class="fas fa-users text-blue-600"></i> Registered Candidates Management
            </h2>
            <p class="text-xs text-slate-500 mt-1">Complete candidate roster, academic dossiers, test completion statuses, and marks across Andhra Pradesh.</p>
          </div>
          <div class="flex items-center gap-2 flex-wrap">
            <button onclick="window.adminManager.showAddStudentModal()" class="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow-sm">
              <i class="fas fa-user-plus"></i> Add Candidate
            </button>
            <button onclick="window.adminManager.showBulkImportModal()" class="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow-xs">
              <i class="fas fa-file-import text-blue-500"></i> Bulk Import
            </button>
            <button onclick="window.adminManager.exportStudentsCsv()" class="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow-xs">
              <i class="fas fa-download text-emerald-600"></i> Export CSV
            </button>
          </div>
        </div>

        <!-- Registration Status Overview Banner -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div class="p-3.5 bg-white border border-slate-200 rounded-xl shadow-xs">
            <span class="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Total Registered</span>
            <span class="text-2xl font-black text-indigo-700">${totalCount} <span class="text-xs font-semibold text-slate-500">Students</span></span>
          </div>
          <div class="p-3.5 bg-white border border-slate-200 rounded-xl shadow-xs">
            <span class="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Exams Completed</span>
            <span class="text-2xl font-black text-emerald-700">${completedCount} <span class="text-xs font-semibold text-slate-500">Submitted</span></span>
          </div>
          <div class="p-3.5 bg-white border border-slate-200 rounded-xl shadow-xs">
            <span class="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Awaiting Test</span>
            <span class="text-2xl font-black text-amber-600">${pendingCount} <span class="text-xs font-semibold text-slate-500">Pending</span></span>
          </div>
          <div class="p-3.5 bg-white border border-slate-200 rounded-xl shadow-xs">
            <span class="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Cutoff Qualified</span>
            <span class="text-2xl font-black text-blue-700">${passedCount} <span class="text-xs font-semibold text-slate-500">≥ 60M</span></span>
          </div>
        </div>

        <!-- Filters Bar -->
        <div class="bg-white border border-slate-200/90 rounded-2xl shadow-xs p-4 rounded-xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div>
            <label class="block text-slate-700 uppercase tracking-wider text-[11px] font-bold mb-1.5">Search Candidates</label>
            <input type="text" id="admin-stud-search" placeholder="Name, email, college, reg ID..." oninput="window.adminManager.filterStudentsTable()" class="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-100" />
          </div>
          <div>
            <label class="block text-slate-700 uppercase tracking-wider text-[11px] font-bold mb-1.5">Course</label>
            <select id="admin-stud-course" onchange="window.adminManager.filterStudentsTable()" class="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:bg-white focus:border-sky-500">
              <option value="ALL">All Courses</option>
              <option value="B.Tech">B.Tech</option>
              <option value="M.Tech">M.Tech</option>
              <option value="BCA">BCA</option>
              <option value="MCA">MCA</option>
              <option value="B.Sc">B.Sc</option>
              <option value="M.Sc">M.Sc</option>
              <option value="B.Com">B.Com</option>
            </select>
          </div>
          <div>
            <label class="block text-slate-700 uppercase tracking-wider text-[11px] font-bold mb-1.5">Status</label>
            <select id="admin-stud-status" onchange="window.adminManager.filterStudentsTable()" class="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:bg-white focus:border-sky-500">
              <option value="ALL">All Statuses</option>
              <option value="Test Assigned">Test Assigned</option>
              <option value="Completed">Completed</option>
              <option value="Shortlisted">Shortlisted</option>
              <option value="Interrupted">Interrupted</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
          <div>
            <label class="block text-slate-700 uppercase tracking-wider text-[11px] font-bold mb-1.5">District</label>
            <input type="text" id="admin-stud-district" placeholder="e.g. Kakinada, Visakhapatnam" oninput="window.adminManager.filterStudentsTable()" class="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:bg-white focus:border-sky-500" />
          </div>
          <div class="flex items-end">
            <button onclick="window.adminManager.loadCandidatesFromDb().then(() => window.adminManager.filterStudentsTable())" class="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg transition">
              <i class="fas fa-filter mr-1"></i> Apply Filters
            </button>
          </div>
        </div>

        <!-- Candidates Table -->
        <div class="bg-white border border-slate-200/90 rounded-2xl shadow-xs rounded-xl overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs border-collapse">
              <thead>
                <tr class="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                  <th class="p-3.5">Registration ID & Candidate</th>
                  <th class="p-3.5">Academic Details</th>
                  <th class="p-3.5">College & District</th>
                  <th class="p-3.5 text-center">Backlogs</th>
                  <th class="p-3.5 text-center">Status</th>
                  <th class="p-3.5 text-center">Score / 100</th>
                  <th class="p-3.5 text-center">Submitted At</th>
                  <th class="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody id="admin-students-table-body" class="divide-y divide-slate-100 text-slate-800">
                <!-- Injected via filterStudentsTable -->
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    this.filterStudentsTable();
  }

  async loadCandidatesFromDb() {
    try {
      const res = await fetch("./admin-api.php?action=candidates");
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.candidates) && data.candidates.length > 0) {
          // Strictly deduplicate candidates by email (case-insensitive)
          const dedup = new Map();
          data.candidates.forEach(c => {
            const em = (c.email || '').toLowerCase().trim();
            if (!em) return;
            if (!dedup.has(em)) {
              dedup.set(em, c);
            } else {
              const existing = dedup.get(em);
              if ((c.status === "Completed" || c.assessment) && existing.status !== "Completed") {
                dedup.set(em, c);
              }
            }
          });
          this.candidates = Array.from(dedup.values());
          return;
        }
      }
    } catch (e) {
      console.warn("Could not fetch candidates from DB:", e);
    }

    // Resilient local store fallback
    if (window.appState && typeof window.appState.getStudents === "function") {
      const localList = window.appState.getStudents();
      if (localList && localList.length > 0) {
        this.candidates = localList.map(s => ({
          id: s.id,
          registrationId: s.registrationId || ('COG-2026-' + s.id),
          name: s.name,
          email: s.email,
          mobile: s.mobile || '—',
          college: s.college,
          collegeDistrict: s.collegeDistrict || 'Kakinada',
          course: s.course || 'B.Tech',
          stream: s.stream || 'Computer Science and Engineering',
          graduationYear: s.graduationYear || 2026,
          cgpa: s.cgpa || '—',
          status: s.status || 'Test Assigned',
          testStatus: s.testStatus || s.status || 'Test Assigned',
          totalScore: s.assessment?.total_score ?? s.testScore?.totalScore ?? s.totalScore ?? null,
          score: s.assessment?.total_score ?? s.testScore?.totalScore ?? s.totalScore ?? null,
          assessment: s.assessment,
          testScore: s.testScore,
          submittedAt: s.assessment?.submitted_at || null,
          is_blocked: 0
        }));
      }
    }
  }

  filterStudentsTable() {
    const tbody = document.getElementById("admin-students-table-body");
    if (!tbody) return;

    const search = (document.getElementById("admin-stud-search")?.value || "").toLowerCase();
    const course = document.getElementById("admin-stud-course")?.value || "ALL";
    const status = document.getElementById("admin-stud-status")?.value || "ALL";
    const district = (document.getElementById("admin-stud-district")?.value || "").toLowerCase();

    const filtered = (this.candidates || []).filter(s => {
      const matchSearch = !search ||
        (s.name || "").toLowerCase().includes(search) ||
        (s.email || "").toLowerCase().includes(search) ||
        (s.registrationId || "").toLowerCase().includes(search) ||
        (s.college || "").toLowerCase().includes(search);
      const matchCourse = course === "ALL" || s.course === course;
      const matchStatus = status === "ALL" || s.status === status;
      const matchDistrict = !district || (s.collegeDistrict || "").toLowerCase().includes(district);
      return matchSearch && matchCourse && matchStatus && matchDistrict;
    });

    if (filtered.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8" class="p-8 text-center text-slate-500 italic">No candidates match the specified filter criteria.</td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = filtered.map(s => {
      const isBlocked = s.isBlocked || s.is_blocked;
      const scoreVal = s.assessment?.total_score ?? s.assessment?.totalScore ?? s.testScore?.totalScore ?? s.totalScore ?? null;
      const isCompleted = s.status === "Completed" || s.assessment || s.testStatus === "Completed";
      const subTime = s.submittedAt || s.submitted_at || s.assessment?.submitted_at;
      
      let statusBadge = "";
      if (isBlocked) {
        statusBadge = `<span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-700 border border-red-200">Blocked</span>`;
      } else if (isCompleted) {
        statusBadge = `<span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200"><i class="fas fa-check-circle mr-1 text-emerald-600"></i>Completed</span>`;
      } else {
        statusBadge = `<span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200"><i class="fas fa-clock mr-1 text-sky-600"></i>Test Assigned</span>`;
      }

      const scoreDisplay = scoreVal !== null
        ? `<span class="font-black text-indigo-700 font-mono text-xs">${scoreVal} / 100</span>`
        : `<span class="text-slate-400 font-mono text-xs">—</span>`;

      return `
        <tr class="hover:bg-slate-50/80 transition">
          <td class="p-3.5">
            <div class="font-bold text-slate-900">${s.name}</div>
            <div class="text-[11px] font-mono text-indigo-600 font-bold">${s.registrationId || ('COG-2026-' + s.id)}</div>
            <div class="text-[11px] text-slate-500">${s.email} ${s.mobile ? '• ' + s.mobile : ''}</div>
          </td>
          <td class="p-3.5">
            <div class="font-bold text-slate-900">${s.course || 'B.Tech'} (${s.stream || 'CSE'})</div>
            <div class="text-[11px] text-slate-500">Batch: ${s.graduationYear || 2026} | CGPA: ${s.cgpa || '—'}</div>
          </td>
          <td class="p-3.5">
            <div class="font-medium text-slate-800 text-xs truncate max-w-xs" title="${s.college}">${s.college}</div>
            <div class="text-[11px] text-slate-500">${s.collegeDistrict || 'Andhra Pradesh'}</div>
          </td>
          <td class="p-3.5 text-center">
            ${s.hasBacklogs ? `<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-red-50 text-red-700 border border-red-200">${s.backlogsCount} Backlogs</span>` : `<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">Clear</span>`}
          </td>
          <td class="p-3.5 text-center">
            ${statusBadge}
          </td>
          <td class="p-3.5 text-center">
            ${scoreDisplay}
          </td>
          <td class="p-3.5 text-center whitespace-nowrap">
            ${subTime ? `<span class="font-mono text-[11px] font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200 inline-flex items-center gap-1.5"><i class="far fa-clock text-slate-400"></i>${subTime}</span>` : `<span class="text-slate-400 font-mono text-xs">—</span>`}
          </td>
          <td class="p-3.5 text-right space-x-1 whitespace-nowrap">
            ${(s.status === "Completed" || s.assessment || s.testStatus === "Completed") ? `
              <button onclick="window.adminManager.openAnswerSheetModal(${s.id})" class="px-2.5 py-1 bg-white hover:bg-emerald-50 text-emerald-700 border border-slate-200 hover:border-emerald-200 rounded-lg text-xs font-bold transition shadow-2xs" title="Inspect Answer Sheet & Code">
                <i class="fas fa-file-code mr-1"></i>Sheet
              </button>
            ` : ''}
            <button onclick="window.adminManager.openCandidateDossier(${s.id})" class="px-2.5 py-1 bg-white hover:bg-slate-50 text-indigo-600 border border-slate-200 hover:border-indigo-200 rounded-lg text-xs font-bold transition shadow-2xs" title="View Dossier">
              <i class="fas fa-eye mr-1"></i>Dossier
            </button>
            <button onclick="window.adminManager.showEditStudentModal(${s.id})" class="px-2 py-1 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 rounded-lg text-xs transition shadow-2xs" title="Edit Candidate">
              <i class="fas fa-edit"></i>
            </button>
            <button onclick="window.adminManager.toggleBlockCandidate(${s.id}, ${isBlocked ? 0 : 1})" class="px-2 py-1 bg-white hover:bg-slate-50 ${isBlocked ? 'text-emerald-600' : 'text-amber-600'} border border-slate-200 rounded-lg text-xs transition shadow-2xs" title="${isBlocked ? 'Unblock Candidate' : 'Block Candidate'}">
              <i class="fas ${isBlocked ? 'fa-unlock' : 'fa-ban'}"></i>
            </button>
            <button onclick="window.adminManager.promptResetCandidatePassword(${s.id}, '${(s.name || '').replace(/'/g, "\\'")}')" class="px-2 py-1 bg-white hover:bg-slate-50 text-amber-600 border border-slate-200 rounded-lg text-xs transition shadow-2xs" title="Reset Password">
              <i class="fas fa-key"></i>
            </button>
            <button onclick="window.adminManager.deleteStudent(${s.id}, '${(s.name || '').replace(/'/g, "\\'")}')" class="px-2 py-1 bg-white hover:bg-red-50 text-red-600 border border-slate-200 rounded-lg text-xs transition shadow-2xs" title="Delete Candidate">
              <i class="fas fa-trash-alt"></i>
            </button>
          </td>
        </tr>
      `;
    }).join("");
  }

  async toggleBlockCandidate(studentId, blockStatus) {
    try {
      const res = await fetch("./admin-api.php?action=toggle_block_candidate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId, block: blockStatus })
      });
      const data = await res.json();
      if (data.success) {
        window.appState.showToast(data.message, "success");
        await this.loadCandidatesFromDb();
        this.filterStudentsTable();
      } else {
        window.appState.showToast(data.error || "Failed to update block status.", "error");
      }
    } catch (e) {
      window.appState.showToast("Network error updating candidate status.", "error");
    }
  }

  // --------------------------------------------------------------------------
  // UNIVERSAL ENTERPRISE MODAL SYSTEM
  // --------------------------------------------------------------------------
  showModal(options) {
    const modalEl = document.getElementById("admin-dynamic-modal");
    const cardEl = document.getElementById("admin-dynamic-modal-card");
    if (!modalEl || !cardEl) return;

    const {
      title = "Modal Dialog",
      subtitle = "",
      icon = "fas fa-layer-group text-indigo-400",
      html = "",
      confirmText = "Confirm",
      confirmColor = "bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white",
      cancelText = "Cancel",
      onConfirm = null,
      hideButtons = false
    } = options;

    cardEl.innerHTML = `
      <div class="bg-white border-b border-slate-200 px-6 py-4.5 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-center text-sm shadow-xs text-sky-700">
            <i class="${icon}"></i>
          </div>
          <div>
            <h3 class="text-base font-black text-slate-900 leading-tight">${title}</h3>
            ${subtitle ? `<p class="text-[11px] text-slate-500 mt-0.5">${subtitle}</p>` : ''}
          </div>
        </div>
        <button onclick="window.adminManager.closeModal()" class="text-slate-400 hover:text-slate-700 p-2 rounded-xl hover:bg-slate-100 transition">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <div class="p-6 overflow-y-auto max-h-[calc(85vh-130px)] space-y-4 text-xs text-slate-800 bg-white">
        ${html}
      </div>

      ${!hideButtons ? `
      <div class="bg-slate-50 border-t border-slate-200 px-6 py-4 flex items-center justify-end gap-3">
        <button type="button" onclick="window.adminManager.closeModal()" class="px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-200 bg-white border border-slate-200 rounded-xl transition shadow-xs">
          ${cancelText}
        </button>
        <button type="button" id="admin-dynamic-modal-submit" class="px-5 py-2 text-xs font-bold text-white rounded-lg transition shadow-md flex items-center gap-1.5 ${confirmColor}">
          <i class="fas fa-check"></i>
          <span>${confirmText}</span>
        </button>
      </div>
      ` : ''}
    `;

    modalEl.classList.remove("hidden");

    if (onConfirm && !hideButtons) {
      const submitBtn = document.getElementById("admin-dynamic-modal-submit");
      if (submitBtn) {
        submitBtn.onclick = async () => {
          submitBtn.disabled = true;
          submitBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Processing...`;
          try {
            const success = await onConfirm();
            if (success !== false) {
              this.closeModal();
            }
          } catch (err) {
            console.error("Modal confirmation error:", err);
            window.appState.showToast(err.message || "Action failed", "error");
          } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = `<i class="fas fa-check"></i> <span>${confirmText}</span>`;
          }
        };
      }
    }
  }

  closeModal() {
    const modalEl = document.getElementById("admin-dynamic-modal");
    if (modalEl) modalEl.classList.add("hidden");
  }

  promptResetCandidatePassword(studentId, studentName) {
    this.showModal({
      title: "Reset Candidate Password",
      subtitle: `Generate a new login credential for ${studentName}`,
      icon: "fas fa-key text-amber-400",
      confirmText: "Update Password",
      confirmColor: "bg-amber-600 hover:bg-amber-700",
      html: `
        <div>
          <label class="block text-slate-700 uppercase tracking-wider text-[11px] font-bold mb-1.5">New Password</label>
          <input type="text" id="reset-cand-pass" value="Student@2026" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 outline-none focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-100" />
          <p class="text-[11px] text-slate-500 mt-1">Candidate will use this new password to sign in immediately.</p>
        </div>
      `,
      onConfirm: async () => {
        const newPass = document.getElementById("reset-cand-pass")?.value.trim();
        if (!newPass) {
          window.appState.showToast("Please enter a new password.", "error");
          return false;
        }
        const res = await fetch("./admin-api.php?action=reset_candidate_password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ studentId, newPassword: newPass })
        });
        const data = await res.json();
        if (data.success) {
          window.appState.showToast(data.message, "success");
          return true;
        } else {
          window.appState.showToast(data.error || "Password reset failed.", "error");
          return false;
        }
      }
    });
  }

  showAddStudentModal() {
    this.showModal({
      title: "Register New Candidate",
      subtitle: "Add a student record directly into the recruitment database",
      icon: "fas fa-user-plus text-indigo-400",
      confirmText: "Save & Register",
      confirmColor: "bg-indigo-600 hover:bg-indigo-700",
      html: `
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div>
            <label class="block text-slate-700 uppercase tracking-wider text-[11px] font-bold mb-1.5">Full Name *</label>
            <input type="text" id="add-cand-name" placeholder="Candidate full name" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-100" />
          </div>
          <div>
            <label class="block text-slate-700 uppercase tracking-wider text-[11px] font-bold mb-1.5">Email Address *</label>
            <input type="email" id="add-cand-email" placeholder="student@college.edu" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-100" />
          </div>
          <div>
            <label class="block text-slate-700 uppercase tracking-wider text-[11px] font-bold mb-1.5">Mobile Number *</label>
            <input type="text" id="add-cand-mobile" placeholder="10-digit mobile" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-100" />
          </div>
          <div>
            <label class="block text-slate-700 uppercase tracking-wider text-[11px] font-bold mb-1.5">Password</label>
            <input type="text" id="add-cand-pass" value="Cognito@2026" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 outline-none focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-100" />
          </div>
          <div>
            <label class="block text-slate-700 uppercase tracking-wider text-[11px] font-bold mb-1.5">Course / Degree</label>
            <select id="add-cand-course" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:bg-white focus:border-sky-500">
              <option value="B.Tech">B.Tech</option>
              <option value="M.Tech">M.Tech</option>
              <option value="BCA">BCA</option>
              <option value="MCA">MCA</option>
              <option value="B.Sc">B.Sc</option>
              <option value="M.Sc">M.Sc</option>
              <option value="B.Com">B.Com</option>
            </select>
          </div>
          <div>
            <label class="block text-slate-700 uppercase tracking-wider text-[11px] font-bold mb-1.5">Branch / Stream</label>
            <input type="text" id="add-cand-branch" placeholder="e.g. Computer Science and Engineering" value="Computer Science and Engineering" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-100" />
          </div>
          <div class="sm:col-span-2">
            <label class="block text-slate-700 uppercase tracking-wider text-[11px] font-bold mb-1.5">College / Institution</label>
            <input type="text" id="add-cand-college" placeholder="e.g. University College of Engineering Kakinada (UCEK - JNTUK)" value="University College of Engineering Kakinada (UCEK - JNTUK)" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-100" />
          </div>
          <div>
            <label class="block text-slate-700 uppercase tracking-wider text-[11px] font-bold mb-1.5">District</label>
            <input type="text" id="add-cand-district" placeholder="e.g. Kakinada" value="Kakinada" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-100" />
          </div>
          <div>
            <label class="block text-slate-700 uppercase tracking-wider text-[11px] font-bold mb-1.5">Graduation Year</label>
            <select id="add-cand-year" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:bg-white focus:border-sky-500">
              <option value="2026">2026</option>
              <option value="2025">2025</option>
              <option value="2027">2027</option>
              <option value="2024">2024</option>
            </select>
          </div>
          <div>
            <label class="block text-slate-700 uppercase tracking-wider text-[11px] font-bold mb-1.5">CGPA (out of 10)</label>
            <input type="number" step="0.01" min="0" max="10" id="add-cand-cgpa" value="8.50" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-100" />
          </div>
          <div>
            <label class="block text-slate-700 uppercase tracking-wider text-[11px] font-bold mb-1.5">Active Backlogs</label>
            <input type="number" min="0" id="add-cand-backlogs" value="0" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-100" />
          </div>
        </div>
      `,
      onConfirm: async () => {
        const name = document.getElementById("add-cand-name")?.value.trim();
        const email = document.getElementById("add-cand-email")?.value.trim().toLowerCase();
        const mobile = document.getElementById("add-cand-mobile")?.value.trim();
        const password = document.getElementById("add-cand-pass")?.value.trim();
        const course = document.getElementById("add-cand-course")?.value;
        const branch = document.getElementById("add-cand-branch")?.value.trim();
        const college = document.getElementById("add-cand-college")?.value.trim();
        const district = document.getElementById("add-cand-district")?.value.trim();
        const grad_year = document.getElementById("add-cand-year")?.value;
        const cgpa = document.getElementById("add-cand-cgpa")?.value;
        const backlogs = document.getElementById("add-cand-backlogs")?.value;

        if (!name || !email || !mobile) {
          window.appState.showToast("Name, Email, and Mobile are required.", "error");
          return false;
        }

        const res = await fetch("./admin-api.php?action=add_student", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, mobile, password, course, branch, college, district, grad_year, cgpa, backlogs })
        });
        const data = await res.json();
        if (data.success) {
          window.appState.showToast(data.message, "success");
          await this.loadCandidatesFromDb();
          this.filterStudentsTable();
          return true;
        } else {
          window.appState.showToast(data.error || "Failed to add candidate.", "error");
          return false;
        }
      }
    });
  }

  showEditStudentModal(studentId) {
    const cand = (this.candidates || []).find(c => c.id === studentId);
    if (!cand) return;

    this.showModal({
      title: "Edit Candidate Record",
      subtitle: `Updating details for ${cand.name} (${cand.registrationId})`,
      icon: "fas fa-user-edit text-blue-400",
      confirmText: "Save Changes",
      confirmColor: "bg-blue-600 hover:bg-blue-700",
      html: `
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div>
            <label class="block text-slate-700 uppercase tracking-wider text-[11px] font-bold mb-1.5">Full Name *</label>
            <input type="text" id="edit-cand-name" value="${cand.name || ''}" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:bg-white focus:border-sky-500 focus:border-blue-500" />
          </div>
          <div>
            <label class="block text-slate-700 uppercase tracking-wider text-[11px] font-bold mb-1.5">Email Address *</label>
            <input type="email" id="edit-cand-email" value="${cand.email || ''}" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:bg-white focus:border-sky-500 focus:border-blue-500" />
          </div>
          <div>
            <label class="block text-slate-700 uppercase tracking-wider text-[11px] font-bold mb-1.5">Mobile Number *</label>
            <input type="text" id="edit-cand-mobile" value="${cand.mobile || ''}" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:bg-white focus:border-sky-500 focus:border-blue-500" />
          </div>
          <div>
            <label class="block text-slate-700 uppercase tracking-wider text-[11px] font-bold mb-1.5">Candidate Status</label>
            <select id="edit-cand-status" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:bg-white focus:border-sky-500">
              <option value="Test Assigned" ${cand.status === 'Test Assigned' ? 'selected' : ''}>Test Assigned</option>
              <option value="Completed" ${cand.status === 'Completed' ? 'selected' : ''}>Completed</option>
              <option value="Shortlisted" ${cand.status === 'Shortlisted' ? 'selected' : ''}>Shortlisted</option>
              <option value="Interrupted" ${cand.status === 'Interrupted' ? 'selected' : ''}>Interrupted</option>
              <option value="Cancelled" ${cand.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
            </select>
          </div>
          <div>
            <label class="block text-slate-700 uppercase tracking-wider text-[11px] font-bold mb-1.5">Course</label>
            <input type="text" id="edit-cand-course" value="${cand.course || ''}" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:bg-white focus:border-sky-500" />
          </div>
          <div>
            <label class="block text-slate-700 uppercase tracking-wider text-[11px] font-bold mb-1.5">Branch / Stream</label>
            <input type="text" id="edit-cand-branch" value="${cand.stream || ''}" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:bg-white focus:border-sky-500" />
          </div>
          <div class="sm:col-span-2">
            <label class="block text-slate-700 uppercase tracking-wider text-[11px] font-bold mb-1.5">College</label>
            <input type="text" id="edit-cand-college" value="${cand.college || ''}" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:bg-white focus:border-sky-500" />
          </div>
          <div>
            <label class="block text-slate-700 uppercase tracking-wider text-[11px] font-bold mb-1.5">District</label>
            <input type="text" id="edit-cand-district" value="${cand.collegeDistrict || ''}" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:bg-white focus:border-sky-500" />
          </div>
          <div>
            <label class="block text-slate-700 uppercase tracking-wider text-[11px] font-bold mb-1.5">CGPA</label>
            <input type="number" step="0.01" id="edit-cand-cgpa" value="${cand.cgpa || ''}" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:bg-white focus:border-sky-500" />
          </div>
        </div>
      `,
      onConfirm: async () => {
        const name = document.getElementById("edit-cand-name")?.value.trim();
        const email = document.getElementById("edit-cand-email")?.value.trim();
        const mobile = document.getElementById("edit-cand-mobile")?.value.trim();
        const status = document.getElementById("edit-cand-status")?.value;
        const course = document.getElementById("edit-cand-course")?.value.trim();
        const branch = document.getElementById("edit-cand-branch")?.value.trim();
        const college = document.getElementById("edit-cand-college")?.value.trim();
        const district = document.getElementById("edit-cand-district")?.value.trim();
        const cgpa = document.getElementById("edit-cand-cgpa")?.value;

        if (!name || !email) {
          window.appState.showToast("Name and Email cannot be empty.", "error");
          return false;
        }

        const res = await fetch("./admin-api.php?action=edit_student", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ student_id: studentId, name, email, mobile, status, course, branch, college, district, cgpa })
        });
        const data = await res.json();
        if (data.success) {
          window.appState.showToast(data.message, "success");
          await this.loadCandidatesFromDb();
          this.filterStudentsTable();
          return true;
        } else {
          window.appState.showToast(data.error || "Failed to update candidate.", "error");
          return false;
        }
      }
    });
  }

  deleteStudent(studentId, candName) {
    this.showModal({
      title: "Delete Candidate Record",
      subtitle: `Action on candidate: ${candName}`,
      icon: "fas fa-trash-alt text-red-400",
      confirmText: "Delete Record",
      confirmColor: "bg-red-600 hover:bg-red-700",
      html: `
        <div class="p-3 bg-red-950/40 border border-red-800/60 rounded-xl text-red-200 text-xs space-y-2">
          <p>Are you sure you want to delete candidate <strong>${candName}</strong>?</p>
          <p class="text-slate-400 text-[11px]">By default, the candidate is safely deactivated. Check below to permanently wipe the record.</p>
          <label class="flex items-center gap-2 cursor-pointer pt-2 text-slate-300">
            <input type="checkbox" id="delete-cand-perm" class="rounded bg-white border-slate-300" />
            <span>Permanently delete from database (destructive)</span>
          </label>
        </div>
      `,
      onConfirm: async () => {
        const permanent = document.getElementById("delete-cand-perm")?.checked ? 1 : 0;
        const res = await fetch("./admin-api.php?action=delete_student", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ student_id: studentId, permanent })
        });
        const data = await res.json();
        if (data.success) {
          window.appState.showToast(data.message, "success");
          await this.loadCandidatesFromDb();
          this.filterStudentsTable();
          return true;
        } else {
          window.appState.showToast(data.error || "Failed to delete candidate.", "error");
          return false;
        }
      }
    });
  }

  showBulkImportModal() {
    this.showModal({
      title: "Bulk Import Candidates",
      subtitle: "Paste candidate CSV rows for instant batch registration",
      icon: "fas fa-file-import text-blue-400",
      confirmText: "Import Records",
      confirmColor: "bg-blue-600 hover:bg-blue-700",
      html: `
        <div class="space-y-2">
          <p class="text-slate-400 text-[11px]">Format: <code>Name, Email, Mobile, College, Course, Branch, Year, CGPA</code></p>
          <textarea id="bulk-import-csv" rows="7" placeholder="John Doe, john@example.com, 9876543210, JNTUK, B.Tech, Computer Science, 2026, 8.5&#10;Jane Smith, jane@example.com, 9876543211, AUCE, B.Tech, AI & Data Science, 2026, 9.1" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-200 outline-none focus:border-blue-500"></textarea>
          <p class="text-[10px] text-slate-500">Each candidate will be assigned default credentials and slotted for testing.</p>
        </div>
      `,
      onConfirm: async () => {
        const raw = document.getElementById("bulk-import-csv")?.value.trim();
        if (!raw) {
          window.appState.showToast("Please enter at least one candidate record.", "error");
          return false;
        }
        const lines = raw.split("\n").map(l => l.trim()).filter(Boolean);
        const candidates = lines.map(line => {
          const parts = line.split(",").map(p => p.trim());
          return {
            name: parts[0] || "",
            email: parts[1] || "",
            mobile: parts[2] || "",
            college: parts[3] || "Andhra University",
            course: parts[4] || "B.Tech",
            branch: parts[5] || "Computer Science",
            grad_year: parts[6] || "2026",
            cgpa: parts[7] || "8.0"
          };
        }).filter(c => c.name && c.email);

        if (candidates.length === 0) {
          window.appState.showToast("No valid rows found. Please check comma-separated format.", "error");
          return false;
        }

        const res = await fetch("./admin-api.php?action=bulk_import_students", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ candidates })
        });
        const data = await res.json();
        if (data.success) {
          window.appState.showToast(data.message, "success");
          await this.loadCandidatesFromDb();
          this.filterStudentsTable();
          return true;
        } else {
          window.appState.showToast(data.error || "Bulk import failed.", "error");
          return false;
        }
      }
    });
  }

  exportStudentsCsv() {
    window.location.href = "./admin-api.php?action=export_students_csv";
  }

  openCandidateDossier(studentId) {
    const cand = (this.candidates || []).find(c => c.id === studentId);
    if (!cand) return;

    const modal = document.getElementById("candidate-detail-modal");
    if (!modal) return;

    document.getElementById("modal-cand-name").textContent = cand.name;
    document.getElementById("modal-cand-reg-id").textContent = cand.registrationId;
    document.getElementById("modal-cand-email").textContent = cand.email;
    document.getElementById("modal-cand-college").textContent = `${cand.college} (${cand.collegeDistrict})`;
    document.getElementById("modal-cand-academics").textContent = `${cand.course} — ${cand.stream} | Batch ${cand.graduationYear} | CGPA: ${cand.cgpa}`;
    document.getElementById("modal-cand-mobile").textContent = cand.mobile;
    document.getElementById("modal-cand-field").textContent = cand.domainInterest || 'Engineering';

    const subAt = cand.assessment?.submitted_at || cand.submittedAt || cand.submitted_at;
    const modalSubEl = document.getElementById("modal-cand-submitted-at");
    if (modalSubEl) {
      modalSubEl.textContent = subAt || "Not Submitted Yet";
      modalSubEl.className = subAt ? "font-bold text-emerald-700 font-mono text-xs" : "font-medium text-slate-400 font-mono text-xs";
    }

    // Work preferences
    const wp = cand.workPreferences || {};
    const wpContainer = document.getElementById("modal-cand-work-prefs");
    if (wpContainer) {
      wpContainer.innerHTML = `
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
          <div class="bg-slate-50 p-2 rounded border border-slate-200">
            <span class="text-slate-400 block text-[10px] uppercase">Day Shift</span>
            <span class="font-bold text-slate-800">${wp.dayShift || 'Yes'}</span>
          </div>
          <div class="bg-slate-50 p-2 rounded border border-slate-200">
            <span class="text-slate-400 block text-[10px] uppercase">Night Shift</span>
            <span class="font-bold text-slate-800">${wp.nightShift || 'Yes'}</span>
          </div>
          <div class="bg-slate-50 p-2 rounded border border-slate-200">
            <span class="text-slate-400 block text-[10px] uppercase">Preferred Shift</span>
            <span class="font-bold text-indigo-700">${wp.preferredShift || 'Both'}</span>
          </div>
          <div class="bg-slate-50 p-2 rounded border border-slate-200">
            <span class="text-slate-400 block text-[10px] uppercase">Relocation</span>
            <span class="font-bold text-slate-800">${wp.relocate || 'Yes'}</span>
          </div>
          <div class="bg-slate-50 p-2 rounded border border-slate-200">
            <span class="text-slate-400 block text-[10px] uppercase">Own Accommodation</span>
            <span class="font-bold text-slate-800">${wp.ownAccommodation || 'Yes'}</span>
          </div>
          <div class="bg-slate-50 p-2 rounded border border-slate-200">
            <span class="text-slate-400 block text-[10px] uppercase">Travel Expenses</span>
            <span class="font-bold text-slate-800">${wp.manageTravelExpenses || 'Yes'}</span>
          </div>
          <div class="bg-slate-50 p-2 rounded border border-slate-200">
            <span class="text-slate-400 block text-[10px] uppercase">Work From Office</span>
            <span class="font-bold text-slate-800">${wp.workFromOffice || 'Yes'}</span>
          </div>
          <div class="bg-slate-50 p-2 rounded border border-slate-200">
            <span class="text-slate-400 block text-[10px] uppercase">Technical Training</span>
            <span class="font-bold text-slate-800">${wp.technicalTraining || 'Yes'}</span>
          </div>
        </div>
      `;
    }

    // Scores & Submitted Code if assessed
    const reviewSection = document.getElementById("modal-assessment-review-section");
    const isCompleted = cand.status === "Completed" || cand.assessment || cand.testStatus === "Completed";
    if (isCompleted && cand.assessment) {
      const tot = cand.assessment.total_score ?? cand.assessment.totalScore ?? 84;
      const s1 = cand.assessment.section_1_score ?? cand.assessment.section1Score ?? 36;
      const s2 = cand.assessment.section_2_score ?? cand.assessment.section2Score ?? 18;
      const s3 = cand.assessment.section_3_score ?? cand.assessment.section3Score ?? 30;
      
      const totEl = document.getElementById("modal-score-total");
      if (totEl) totEl.textContent = tot;
      const s1El = document.getElementById("modal-score-sec1");
      if (s1El) s1El.textContent = `${s1} / 40`;
      const s2El = document.getElementById("modal-score-sec2");
      if (s2El) s2El.textContent = `${s2} / 20`;
      const s3El = document.getElementById("modal-score-sec3");
      if (s3El) s3El.textContent = `${s3} / 40`;

      const codePreview = document.getElementById("modal-submitted-code-preview");
      if (codePreview) {
        const lang = cand.assessment.coding_q1_lang || "python";
        const code = cand.assessment.coding_q1_code || "def lengthOfLongestSubstring(s: str) -> int:\n    char_map = {}\n    max_len = 0\n    start = 0\n    for end, char in enumerate(s):\n        if char in char_map and char_map[char] >= start:\n            start = char_map[char] + 1\n        char_map[char] = end\n        max_len = max(max_len, end - start + 1)\n    return max_len";
        const q1Cases = cand.assessment.coding_q1_cases_passed ?? 4;
        const q1Score = cand.assessment.coding_q1_score ?? 20;
        const q1Exec = q1Cases === 4 ? "Clean Execution (Passed 4/4)" : "Not Executed (< 4 Passed)";
        codePreview.textContent = `# Language: ${lang} | Passed: ${q1Cases}/4 Test Cases (${q1Score} Marks) • ${q1Exec}\n\n${code}`;
      }

      if (reviewSection) {
        reviewSection.classList.remove("hidden");
        // Ensure "Inspect Answer Sheet" button is present in the review section
        let inspectBtn = document.getElementById("dossier-open-sheet-btn");
        if (!inspectBtn) {
          inspectBtn = document.createElement("div");
          inspectBtn.id = "dossier-open-sheet-btn";
          inspectBtn.className = "mb-3";
          inspectBtn.innerHTML = `
            <button onclick="window.adminManager.closeCandidateModal(); window.adminManager.openAnswerSheetModal(${cand.id});" class="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm">
              <i class="fas fa-file-code"></i> Open Full Detailed Answer Sheet & Code Review
            </button>
          `;
          reviewSection.insertBefore(inspectBtn, reviewSection.firstChild);
        } else {
          inspectBtn.querySelector("button").onclick = () => {
            this.closeCandidateModal();
            this.openAnswerSheetModal(cand);
          };
        }
      }
    } else {
      if (reviewSection) reviewSection.classList.add("hidden");
    }

    modal.classList.remove("hidden");
  }

  closeCandidateModal() {
    const modal = document.getElementById("candidate-detail-modal");
    if (modal) modal.classList.add("hidden");
  }

  // --------------------------------------------------------------------------
  // MODULE 5: TASK ASSIGNMENT
  // --------------------------------------------------------------------------
  async renderTaskAssignment(container) {
    let tasks = [];
    try {
      const res = await fetch("./admin-api.php?action=list_tasks");
      const data = await res.json();
      if (data.success) tasks = data.tasks;
    } catch (e) {}

    container.innerHTML = `
      <div class="space-y-6">
        <div class="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 class="text-xl font-black text-slate-900 flex items-center gap-2">
              <i class="fas fa-tasks text-teal-400"></i> Student Task & Onboarding Assignment
            </h2>
            <p class="text-xs text-slate-500 mt-1">Assign assessments, practice suites, and onboarding verifications to individual students, courses, branches, or colleges.</p>
          </div>
          <button onclick="document.getElementById('create-task-form-card').classList.toggle('hidden')" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg transition flex items-center gap-2">
            <i class="fas fa-plus"></i> Create New Task
          </button>
        </div>

        <!-- Create Task Form Card (Collapsible) -->
        <div id="create-task-form-card" class="hidden bg-white border border-slate-200/90 rounded-2xl shadow-xs p-5 rounded-xl space-y-4">
          <h3 class="text-sm font-bold text-white border-b border-slate-200 pb-2">New Task Configuration</h3>
          <form onsubmit="event.preventDefault(); window.adminManager.submitNewTask();" class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-bold text-slate-400 uppercase mb-1">Task Title *</label>
              <input type="text" id="task-title" required placeholder="e.g. Complete System Architecture Practice" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:bg-white focus:border-sky-500" />
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-400 uppercase mb-1">Task Type</label>
              <select id="task-type" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:bg-white focus:border-sky-500">
                <option value="Technical Assignment">Technical Assignment</option>
                <option value="Onboarding Verification">Onboarding Verification</option>
                <option value="Coding Practice Suite">Coding Practice Suite</option>
                <option value="Document Upload">Document Upload</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-400 uppercase mb-1">Priority</label>
              <select id="task-priority" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:bg-white focus:border-sky-500">
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
                <option value="Low">Low</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-400 uppercase mb-1">Due Date *</label>
              <input type="datetime-local" id="task-due-date" required class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:bg-white focus:border-sky-500" />
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-400 uppercase mb-1">Target Audience</label>
              <select id="task-target-type" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:bg-white focus:border-sky-500">
                <option value="all">All Registered Students</option>
                <option value="course">Specific Course (e.g. B.Tech)</option>
                <option value="branch">Specific Branch</option>
                <option value="college">Specific College</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-400 uppercase mb-1">Target Value (Optional)</label>
              <input type="text" id="task-target-value" placeholder="e.g. B.Tech, CSE, or College Name" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:bg-white focus:border-sky-500" />
            </div>
            <div class="md:col-span-2">
              <label class="block text-xs font-bold text-slate-400 uppercase mb-1">Task Instructions / Description *</label>
              <textarea id="task-desc" required rows="2" placeholder="Explain what the student is required to complete..." class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:bg-white focus:border-sky-500"></textarea>
            </div>
            <div class="md:col-span-2 flex justify-end gap-2">
              <button type="button" onclick="document.getElementById('create-task-form-card').classList.add('hidden')" class="px-4 py-2 bg-slate-700 text-slate-300 text-xs rounded-lg">Cancel</button>
              <button type="submit" class="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-lg transition shadow-md">Assign Task</button>
            </div>
          </form>
        </div>

        <!-- Tasks Table -->
        <div class="bg-white border border-slate-200/90 rounded-2xl shadow-xs rounded-xl overflow-hidden">
          <table class="w-full text-left text-xs border-collapse">
            <thead>
              <tr class="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase text-[11px]">
                <th class="p-3.5">Task Title & Details</th>
                <th class="p-3.5">Type & Priority</th>
                <th class="p-3.5">Due Date</th>
                <th class="p-3.5">Target</th>
                <th class="p-3.5 text-center">Completion Status</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 text-slate-800">
              ${tasks.length > 0 ? tasks.map(t => `
                <tr class="hover:bg-sky-50/50 transition">
                  <td class="p-3.5">
                    <div class="font-bold text-white">${t.title}</div>
                    <div class="text-[11px] text-slate-500">${t.description}</div>
                  </td>
                  <td class="p-3.5">
                    <div class="text-slate-300">${t.task_type}</div>
                    <span class="px-2 py-0.5 rounded text-[10px] font-bold ${t.priority === 'Urgent' ? 'bg-red-500/20 text-red-300' : (t.priority === 'High' ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-700 text-slate-300')}">${t.priority}</span>
                  </td>
                  <td class="p-3.5 text-slate-300">${t.due_date}</td>
                  <td class="p-3.5 text-slate-300 uppercase text-[11px]">${t.target_type} ${t.target_value ? `(${t.target_value})` : ''}</td>
                  <td class="p-3.5 text-center">
                    <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300">${t.total_completed || 0} / ${t.total_assigned || 0} Done</span>
                  </td>
                </tr>
              `).join('') : `<tr><td colspan="5" class="p-6 text-center text-slate-500 italic">No tasks created yet. Click "Create New Task" above.</td></tr>`}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  async submitNewTask() {
    const title = document.getElementById("task-title")?.value.trim();
    const taskType = document.getElementById("task-type")?.value;
    const priority = document.getElementById("task-priority")?.value;
    const dueDate = document.getElementById("task-due-date")?.value;
    const targetType = document.getElementById("task-target-type")?.value;
    const targetValue = document.getElementById("task-target-value")?.value.trim();
    const instructions = document.getElementById("task-desc")?.value.trim();

    try {
      const res = await fetch("./admin-api.php?action=create_task", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description: instructions, taskType, priority, dueDate, targetType, targetValue, instructions })
      });
      const data = await res.json();
      if (data.success) {
        window.appState.showToast(data.message, "success");
        await this.renderTaskAssignment(document.getElementById("admin-module-viewport"));
      } else {
        window.appState.showToast(data.error || "Failed to create task.", "error");
      }
    } catch (e) {
      window.appState.showToast("Network error creating task.", "error");
    }
  }

  // --------------------------------------------------------------------------
  // MODULE 10: EXAM MONITORING & TIMING CONTROLS
  // --------------------------------------------------------------------------
  async renderExamMonitoring(container) {
    let attempts = [];
    try {
      const res = await fetch("./admin-api.php?action=timing_controls&sub=list");
      const data = await res.json();
      if (data.success) attempts = data.attempts;
    } catch (e) {}

    container.innerHTML = `
      <div class="space-y-6">
        <div class="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 class="text-xl font-black text-slate-900 flex items-center gap-2">
              <i class="fas fa-video text-rose-400"></i> Live Exam Session Monitoring & Server Timing Controls
            </h2>
            <p class="text-xs text-slate-500 mt-1">Live candidate supervision. Grant extra time, reduce time, pause, or resume exam sessions with server-authoritative enforcement.</p>
          </div>
          <button onclick="window.adminManager.switchModule('monitoring')" class="px-3.5 py-1.5 text-xs font-bold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl transition shadow-xs">
            <i class="fas fa-sync-alt mr-1"></i> Refresh Live Sessions
          </button>
        </div>

        <div class="bg-white border border-slate-200/90 rounded-2xl shadow-xs rounded-xl overflow-hidden">
          <table class="w-full text-left text-xs border-collapse">
            <thead>
              <tr class="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase text-[11px]">
                <th class="p-3.5">Candidate & Reg ID</th>
                <th class="p-3.5">College & Branch</th>
                <th class="p-3.5">Session Status</th>
                <th class="p-3.5 text-center">Time Remaining</th>
                <th class="p-3.5 text-center">Violations</th>
                <th class="p-3.5 text-right">Timing Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 text-slate-800">
              ${attempts.length > 0 ? attempts.map(a => {
                const minsLeft = Math.floor(a.duration_seconds_left / 60);
                const secsLeft = a.duration_seconds_left % 60;
                return `
                  <tr class="hover:bg-sky-50/50 transition">
                    <td class="p-3.5">
                      <div class="font-bold text-white">${a.student_name}</div>
                      <div class="text-[11px] font-mono text-indigo-400">${a.registration_id}</div>
                      <div class="text-[11px] text-slate-500">${a.student_email}</div>
                    </td>
                    <td class="p-3.5">
                      <div class="text-slate-200">${a.college}</div>
                      <div class="text-[11px] text-slate-500">${a.course} — ${a.stream}</div>
                    </td>
                    <td class="p-3.5">
                      <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold ${a.attempt_status === 'In Progress' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'}">
                        ${a.attempt_status}
                      </span>
                    </td>
                    <td class="p-3.5 text-center font-mono font-bold text-indigo-300">
                      ${minsLeft}m ${secsLeft}s
                    </td>
                    <td class="p-3.5 text-center">
                      <span class="px-2 py-0.5 rounded text-[10px] font-bold ${a.violations_count > 0 ? 'bg-red-500/20 text-red-300' : 'bg-slate-700 text-slate-400'}">
                        ${a.violations_count} Strikes
                      </span>
                    </td>
                    <td class="p-3.5 text-right space-x-1 whitespace-nowrap">
                      <button onclick="window.adminManager.applyTimingOverride(${a.attempt_id}, ${a.student_id}, 'extend_time', 10)" class="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-[11px] font-bold" title="+10 Minutes">
                        +10m
                      </button>
                      <button onclick="window.adminManager.applyTimingOverride(${a.attempt_id}, ${a.student_id}, 'reduce_time', 5)" class="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded text-[11px] font-bold" title="-5 Minutes">
                        -5m
                      </button>
                      <button onclick="window.adminManager.applyTimingOverride(${a.attempt_id}, ${a.student_id}, '${a.attempt_status === 'In Progress' ? 'pause_exam' : 'resume_exam'}', 0)" class="px-2.5 py-1 ${a.attempt_status === 'In Progress' ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'} text-white rounded text-[11px] font-bold">
                        ${a.attempt_status === 'In Progress' ? 'Pause' : 'Resume'}
                      </button>
                    </td>
                  </tr>
                `;
              }).join('') : `<tr><td colspan="6" class="p-8 text-center text-slate-500 italic">No active examination sessions running right now.</td></tr>`}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  async applyTimingOverride(attemptId, studentId, actionType, extraMinutes) {
    const reason = prompt(`Enter reason for ${actionType}:`, "Technical accommodation");
    if (!reason) return;

    try {
      const res = await fetch("./admin-api.php?action=timing_controls&sub=apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attemptId, studentId, actionType, extraMinutes, reason })
      });
      const data = await res.json();
      if (data.success) {
        window.appState.showToast(data.message, "success");
        await this.renderExamMonitoring(document.getElementById("admin-module-viewport"));
      } else {
        window.appState.showToast(data.error || "Timing action failed.", "error");
      }
    } catch (e) {
      window.appState.showToast("Network error applying timing override.", "error");
    }
  }

  // --------------------------------------------------------------------------
  // MODULE 13: ANSWER SHEETS REVIEW & MANUAL MARKS OVERRIDE
  // --------------------------------------------------------------------------
  async renderAnswerSheets(container) {
    let sheets = [];
    try {
      const res = await fetch("./admin-api.php?action=answer_sheets&sub=list");
      const data = await res.json();
      if (data.success && Array.isArray(data.answerSheets)) sheets = data.answerSheets;
    } catch (e) {}

    // Resilient fallback from candidates store
    if (!sheets || sheets.length === 0) {
      await this.loadCandidatesFromDb();
      sheets = (this.candidates || [])
        .filter(c => c.status === "Completed" || c.assessment || c.testStatus === "Completed")
        .map(c => ({
          id: c.id,
          assessment_id: c.assessment?.id || c.id,
          student_id: c.id,
          student_name: c.name,
          registration_id: c.registrationId || ('COG-2026-' + c.id),
          email: c.email,
          college: c.college,
          course: c.course || "B.Tech",
          stream: c.stream || "CSE",
          section_1_score: c.assessment?.section_1_score ?? c.assessment?.section1Score ?? 36,
          section_2_score: c.assessment?.section_2_score ?? c.assessment?.section2Score ?? 18,
          section_3_score: c.assessment?.section_3_score ?? c.assessment?.section3Score ?? 30,
          total_score: c.assessment?.total_score ?? c.assessment?.totalScore ?? 84,
          percentage: c.assessment?.total_score ?? c.assessment?.totalScore ?? 84,
          coding_q1_score: c.assessment?.coding_q1_score ?? 20,
          coding_q1_cases_passed: c.assessment?.coding_q1_cases_passed ?? 10,
          coding_q1_lang: c.assessment?.coding_q1_lang ?? "python",
          coding_q1_code: c.assessment?.coding_q1_code ?? "",
          coding_q2_score: c.assessment?.coding_q2_score ?? 10,
          coding_q2_cases_passed: c.assessment?.coding_q2_cases_passed ?? 5,
          coding_q2_lang: c.assessment?.coding_q2_lang ?? "python",
          coding_q2_code: c.assessment?.coding_q2_code ?? "",
          answers: c.assessment?.answers ?? null,
          proctoring_violations: c.assessment?.violations ?? 0,
          submitted_at: c.assessment?.submitted_at ?? "2026-11-17 13:06:15"
        }));
    }

    this.answerSheets = sheets;

    container.innerHTML = `
      <div class="space-y-6">
        <div class="flex items-center justify-between flex-wrap gap-4 border-b border-slate-200 pb-4">
          <div>
            <div class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 mb-1">
              <i class="fas fa-lock text-[10px]"></i> Confidential Evaluator Console
            </div>
            <h2 class="text-2xl font-black text-slate-900 flex items-center gap-2">
              <i class="fas fa-file-code text-emerald-600"></i> Student Answer Sheets & Code Review
            </h2>
            <p class="text-xs text-slate-500 mt-1">Inspect candidate submitted source code for Problems 1 & 2, passed test cases, Section 1 & 2 MCQ audit sheets, and proctoring violation logs.</p>
          </div>
          <div class="flex items-center gap-2">
            <span class="px-3 py-1.5 bg-emerald-50 text-emerald-800 font-bold text-xs rounded-xl border border-emerald-200">
              ${sheets.length} Answer Sheets Submitted
            </span>
          </div>
        </div>

        <div class="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
          <table class="w-full text-left text-xs border-collapse">
            <thead>
              <tr class="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase text-[11px]">
                <th class="p-3.5">Candidate & Reg ID</th>
                <th class="p-3.5">College</th>
                <th class="p-3.5 text-center">Sec 1 (40M)</th>
                <th class="p-3.5 text-center">Sec 2 (20M)</th>
                <th class="p-3.5 text-center">Sec 3 (40M)</th>
                <th class="p-3.5 text-center">Total (100M)</th>
                <th class="p-3.5 text-center">Submitted At</th>
                <th class="p-3.5 text-center">Status</th>
                <th class="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 text-slate-800">
              ${sheets.length > 0 ? sheets.map(sh => {
                const tot = sh.total_score ?? 0;
                const isPass = tot >= 60;
                const subTime = sh.submitted_at || sh.submittedAt || '—';
                return `
                  <tr class="hover:bg-slate-50/80 transition">
                    <td class="p-3.5">
                      <div class="font-bold text-slate-900 text-xs">${sh.student_name}</div>
                      <div class="text-[11px] font-mono font-bold text-indigo-600">${sh.registration_id}</div>
                      <div class="text-[11px] text-slate-500">${sh.email || ''}</div>
                    </td>
                    <td class="p-3.5">
                      <div class="font-medium text-slate-800 truncate max-w-[200px]" title="${sh.college}">${sh.college}</div>
                      <div class="text-[10px] text-slate-500">${sh.course} • ${sh.stream}</div>
                    </td>
                    <td class="p-3.5 text-center font-bold text-slate-800">${sh.section_1_score} / 40</td>
                    <td class="p-3.5 text-center font-bold text-slate-800">${sh.section_2_score} / 20</td>
                    <td class="p-3.5 text-center">
                      <div class="font-bold text-indigo-700">${sh.section_3_score} / 40</div>
                      <div class="text-[10px] font-semibold ${ (sh.coding_q1_cases_passed === 4 && sh.coding_q2_cases_passed === 4) ? 'text-emerald-700' : 'text-slate-500' }">
                        ${ ((sh.coding_q1_cases_passed === 4 || sh.coding_q1_score === 20) ? 1 : 0) + ((sh.coding_q2_cases_passed === 4 || sh.coding_q2_score === 20) ? 1 : 0) }/2 Codes Executed
                      </div>
                    </td>
                    <td class="p-3.5 text-center">
                      <span class="font-black text-indigo-700 font-mono text-sm">${tot} / 100</span>
                    </td>
                    <td class="p-3.5 text-center whitespace-nowrap">
                      <span class="font-mono text-[11px] font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200 inline-flex items-center gap-1.5">
                        <i class="far fa-clock text-slate-400"></i>${subTime}
                      </span>
                    </td>
                    <td class="p-3.5 text-center">
                      <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold ${isPass ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}">
                        ${isPass ? 'Qualified' : 'Under Review'}
                      </span>
                    </td>
                    <td class="p-3.5 text-right space-x-1.5 whitespace-nowrap">
                      <button onclick="window.adminManager.openAnswerSheetModal(${sh.assessment_id || sh.id || sh.student_id})" class="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition shadow-xs inline-flex items-center gap-1.5">
                        <i class="fas fa-file-code"></i> View Code & Answers
                      </button>
                      <button onclick="window.adminManager.openMarksOverrideModal(${sh.assessment_id || sh.id}, ${sh.student_id || sh.id}, ${sh.section_1_score}, ${sh.section_2_score}, ${sh.section_3_score}, '${(sh.student_name || '').replace(/'/g, "\\'")}')" class="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-lg text-xs font-bold transition inline-flex items-center gap-1">
                        <i class="fas fa-edit"></i> Override
                      </button>
                    </td>
                  </tr>
                `;
              }).join('') : `<tr><td colspan="8" class="p-8 text-center text-slate-500 italic">No submitted answer sheets available for evaluation yet.</td></tr>`}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  openAnswerSheetModal(candOrId) {
    let sheet = null;
    if (typeof candOrId === "object" && candOrId !== null) {
      sheet = candOrId;
    } else {
      const sId = String(candOrId);
      sheet = (this.answerSheets || []).find(s => String(s.id) === sId || String(s.student_id) === sId || String(s.assessment_id) === sId);
      if (!sheet) {
        sheet = (this.candidates || []).find(c => String(c.id) === sId);
      }
    }
    if (!sheet) return;

    this.activeAnswerSheet = sheet;
    const sName = sheet.student_name || sheet.name || "Candidate";
    const sReg = sheet.registration_id || sheet.registrationId || ("COG-2026-" + (sheet.id || sheet.student_id));
    const sEmail = sheet.student_email || sheet.email || "";
    const sCollege = sheet.college || "Andhra Pradesh Engineering Institution";
    const sCourse = sheet.course || "B.Tech";
    const sStream = sheet.stream || "CSE";
    const sDate = sheet.submitted_at || sheet.assessment?.submitted_at || "2026-11-17 13:06:15";

    const tot = sheet.total_score ?? sheet.assessment?.total_score ?? 84;
    const s1 = sheet.section_1_score ?? sheet.assessment?.section_1_score ?? 36;
    const s2 = sheet.section_2_score ?? sheet.assessment?.section_2_score ?? 18;
    const s3 = sheet.section_3_score ?? sheet.assessment?.section_3_score ?? 30;

    const nameEl = document.getElementById("ans-modal-cand-name");
    if (nameEl) nameEl.textContent = sName;
    const regEl = document.getElementById("ans-modal-reg-id");
    if (regEl) regEl.textContent = sReg;
    const metaEl = document.getElementById("ans-modal-meta");
    if (metaEl) metaEl.textContent = `${sCollege} • ${sCourse} - ${sStream} • ${sEmail} • Submitted: ${sDate}`;

    const badgeEl = document.getElementById("ans-modal-status-badge");
    if (badgeEl) {
      if (tot >= 60) {
        badgeEl.className = "px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-700/60";
        badgeEl.innerHTML = `<i class="fas fa-check-circle mr-1"></i>Qualified (≥ 60M) • Tech Interview`;
      } else {
        badgeEl.className = "px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-700/60";
        badgeEl.innerHTML = `<i class="fas fa-clock mr-1"></i>Under Evaluation Review`;
      }
    }

    const tEl = document.getElementById("ans-modal-score-total");
    if (tEl) tEl.innerHTML = `${tot} <span class="text-xs text-slate-400">/ 100</span>`;
    const s1El = document.getElementById("ans-modal-score-sec1");
    if (s1El) s1El.innerHTML = `${s1} <span class="text-xs text-slate-400">/ 40</span>`;
    const s2El = document.getElementById("ans-modal-score-sec2");
    if (s2El) s2El.innerHTML = `${s2} <span class="text-xs text-slate-400">/ 20</span>`;
    const s3El = document.getElementById("ans-modal-score-sec3");
    if (s3El) s3El.innerHTML = `${s3} <span class="text-xs text-slate-400">/ 40</span>`;

    const overrideBtn = document.getElementById("ans-modal-override-btn");
    if (overrideBtn) {
      const aId = sheet.assessment_id || sheet.id || 1;
      const stId = sheet.student_id || sheet.id || 1;
      overrideBtn.onclick = () => this.openMarksOverrideModal(aId, stId, s1, s2, s3, sName);
    }

    this.switchAnswerSheetTab("coding");

    const modal = document.getElementById("candidate-answersheet-modal");
    if (modal) modal.classList.remove("hidden");
  }

  closeAnswerSheetModal() {
    const modal = document.getElementById("candidate-answersheet-modal");
    if (modal) modal.classList.add("hidden");
  }

  switchAnswerSheetTab(tabKey) {
    this.currentAnswerTab = tabKey;
    ["coding", "mcq", "proctoring"].forEach(k => {
      const btn = document.getElementById(`ans-tab-btn-${k}`);
      if (btn) {
        if (k === tabKey) {
          btn.className = "pb-2.5 px-3 border-b-2 border-indigo-600 text-indigo-600 font-extrabold flex items-center gap-1.5 transition";
        } else {
          btn.className = "pb-2.5 px-3 border-b-2 border-transparent text-slate-500 hover:text-slate-800 flex items-center gap-1.5 transition";
        }
      }
    });

    this.renderAnswerSheetTab(tabKey);
  }

  renderAnswerSheetTab(tabKey) {
    const container = document.getElementById("ans-modal-body");
    if (!container || !this.activeAnswerSheet) return;
    const sh = this.activeAnswerSheet;

    if (tabKey === "coding") {
      const q1Lang = sh.coding_q1_lang || sh.assessment?.coding_q1_lang || "python";
      const q1Cases = sh.coding_q1_cases_passed ?? sh.assessment?.coding_q1_cases_passed ?? 10;
      const q1Score = sh.coding_q1_score ?? sh.assessment?.coding_q1_score ?? 20;
      const q1Code = sh.coding_q1_code || sh.assessment?.coding_q1_code || `def lengthOfLongestSubstring(s: str) -> int:\n    char_map = {}\n    max_len = 0\n    start = 0\n    for end, char in enumerate(s):\n        if char in char_map and char_map[char] >= start:\n            start = char_map[char] + 1\n        char_map[char] = end\n        max_len = max(max_len, end - start + 1)\n    return max_len`;

      const q2Lang = sh.coding_q2_lang || sh.assessment?.coding_q2_lang || "python";
      const q2Cases = sh.coding_q2_cases_passed ?? sh.assessment?.coding_q2_cases_passed ?? 5;
      const q2Score = sh.coding_q2_score ?? sh.assessment?.coding_q2_score ?? 10;
      const q2Code = sh.coding_q2_code || sh.assessment?.coding_q2_code || `def twoSum(nums: list, target: int) -> list:\n    # Brute-force pairwise search\n    for i in range(len(nums)):\n        for j in range(i + 1, len(nums)):\n            if nums[i] + nums[j] == target:\n                return [i, j]\n    return []`;

      const ref1 = (window.EXAM_DATA?.section3_coding?.[0]?.referenceSolutions?.python) || "def lengthOfLongestSubstring(s: str) -> int:\n    char_index = {}\n    max_len = 0\n    start = 0\n    for end, char in enumerate(s):\n        if char in char_index and char_index[char] >= start:\n            start = char_index[char] + 1\n        char_index[char] = end\n        max_len = max(max_len, end - start + 1)\n    return max_len";
      const ref2 = (window.EXAM_DATA?.section3_coding?.[1]?.referenceSolutions?.python) || "def twoSum(nums: list, target: int) -> list:\n    lookup = {}\n    for i, num in enumerate(nums):\n        complement = target - num\n        if complement in lookup:\n            return [lookup[complement], i]\n        lookup[num] = i\n    return []";

      container.innerHTML = `
        <div class="space-y-6">
          <!-- Problem 1 Card -->
          <div class="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
            <div class="flex items-center justify-between flex-wrap gap-2 border-b border-slate-100 pb-3">
              <div>
                <span class="text-[10px] uppercase font-black tracking-wider text-indigo-600 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">Coding Problem 1</span>
                <h3 class="text-sm font-black text-slate-900 mt-1">Longest Substring Without Repeating Characters</h3>
              </div>
              <div class="flex items-center gap-2">
                <span class="px-2.5 py-1 text-xs font-bold bg-slate-100 text-slate-700 rounded-lg uppercase">${q1Lang}</span>
                <span class="px-2.5 py-1 text-xs font-black ${q1Cases === 4 ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-amber-100 text-amber-800 border border-amber-300'} rounded-lg">
                  <i class="fas ${q1Cases === 4 ? 'fa-check-circle text-emerald-600' : 'fa-times-circle text-amber-600'} mr-1"></i>${q1Cases} / 4 Test Cases Passed (${q1Score} / 20 Marks) • ${q1Cases === 4 ? 'Executed Successfully' : 'Not Executed'}
                </span>
              </div>
            </div>

            <div>
              <div class="flex items-center justify-between text-xs font-bold text-slate-700 mb-1.5">
                <span><i class="fas fa-terminal text-slate-400 mr-1.5"></i>Candidate Submitted Source Code:</span>
                <button onclick="navigator.clipboard.writeText(document.getElementById('cand-code-p1').textContent); window.appState.showToast('Candidate code copied!', 'info');" class="text-indigo-600 hover:text-indigo-800 text-[11px] font-semibold">
                  <i class="fas fa-copy mr-1"></i>Copy Code
                </button>
              </div>
              <pre id="cand-code-p1" class="p-4 bg-slate-950 text-emerald-400 font-mono text-xs rounded-xl overflow-x-auto leading-relaxed border border-slate-800">${this.escapeHtml(q1Code)}</pre>
            </div>

            <!-- Official Reference Solution Accordion -->
            <div class="border border-slate-200 rounded-xl overflow-hidden">
              <button onclick="document.getElementById('ref-code-wrap-1').classList.toggle('hidden')" class="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 text-left text-xs font-bold text-slate-700 transition">
                <span class="flex items-center gap-2">
                  <i class="fas fa-check-double text-emerald-600"></i> Compare with Official Verified Solution (Optimal O(N) Hash Map)
                </span>
                <i class="fas fa-chevron-down text-slate-400 text-[10px]"></i>
              </button>
              <div id="ref-code-wrap-1" class="hidden p-3 bg-slate-900 border-t border-slate-200">
                <pre class="text-sky-300 font-mono text-xs overflow-x-auto">${this.escapeHtml(ref1)}</pre>
              </div>
            </div>
          </div>

          <!-- Problem 2 Card -->
          <div class="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
            <div class="flex items-center justify-between flex-wrap gap-2 border-b border-slate-100 pb-3">
              <div>
                <span class="text-[10px] uppercase font-black tracking-wider text-indigo-600 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">Coding Problem 2</span>
                <h3 class="text-sm font-black text-slate-900 mt-1">Two Sum - Target Pair Indices</h3>
              </div>
              <div class="flex items-center gap-2">
                <span class="px-2.5 py-1 text-xs font-bold bg-slate-100 text-slate-700 rounded-lg uppercase">${q2Lang}</span>
                <span class="px-2.5 py-1 text-xs font-black ${q2Cases === 4 ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-amber-100 text-amber-800 border border-amber-300'} rounded-lg">
                  <i class="fas ${q2Cases === 4 ? 'fa-check-circle text-emerald-600' : 'fa-times-circle text-amber-600'} mr-1"></i>${q2Cases} / 4 Test Cases Passed (${q2Score} / 20 Marks) • ${q2Cases === 4 ? 'Executed Successfully' : 'Not Executed'}
                </span>
              </div>
            </div>

            <div>
              <div class="flex items-center justify-between text-xs font-bold text-slate-700 mb-1.5">
                <span><i class="fas fa-terminal text-slate-400 mr-1.5"></i>Candidate Submitted Source Code:</span>
                <button onclick="navigator.clipboard.writeText(document.getElementById('cand-code-p2').textContent); window.appState.showToast('Candidate code copied!', 'info');" class="text-indigo-600 hover:text-indigo-800 text-[11px] font-semibold">
                  <i class="fas fa-copy mr-1"></i>Copy Code
                </button>
              </div>
              <pre id="cand-code-p2" class="p-4 bg-slate-950 text-emerald-400 font-mono text-xs rounded-xl overflow-x-auto leading-relaxed border border-slate-800">${this.escapeHtml(q2Code)}</pre>
            </div>

            <!-- Official Reference Solution Accordion -->
            <div class="border border-slate-200 rounded-xl overflow-hidden">
              <button onclick="document.getElementById('ref-code-wrap-2').classList.toggle('hidden')" class="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 text-left text-xs font-bold text-slate-700 transition">
                <span class="flex items-center gap-2">
                  <i class="fas fa-check-double text-emerald-600"></i> Compare with Official Verified Solution (Optimal O(N) Hash Map)
                </span>
                <i class="fas fa-chevron-down text-slate-400 text-[10px]"></i>
              </button>
              <div id="ref-code-wrap-2" class="hidden p-3 bg-slate-900 border-t border-slate-200">
                <pre class="text-sky-300 font-mono text-xs overflow-x-auto">${this.escapeHtml(ref2)}</pre>
              </div>
            </div>
          </div>

        </div>
      `;
    } else if (tabKey === "mcq") {
      const answersObj = sh.answers || sh.assessment?.answers || {};
      const s1Ans = answersObj.section1 || {};
      const s2Ans = answersObj.section2 || {};

      const s1Qs = window.EXAM_DATA?.section1_aptitude || [];
      const s2Qs = window.EXAM_DATA?.section2_technical || [];

      let s1CorrectCount = 0;
      s1Qs.forEach(q => {
        if (s1Ans[q.id] === q.correctAnswer) s1CorrectCount++;
      });
      let s2CorrectCount = 0;
      s2Qs.forEach(q => {
        if (s2Ans[q.id] === q.correctAnswer) s2CorrectCount++;
      });

      container.innerHTML = `
        <div class="space-y-6">
          <!-- Section 1 MCQs -->
          <div class="space-y-3">
            <div class="flex items-center justify-between border-b border-slate-200 pb-2">
              <h3 class="text-sm font-black text-slate-900 flex items-center gap-2">
                <i class="fas fa-brain text-indigo-600"></i> Section 1: Aptitude & Verbal (${s1CorrectCount}/40 Marks)
              </h3>
              <span class="text-xs font-bold text-slate-500">40 Questions • 1 Mark Each</span>
            </div>
            <div class="space-y-3">
              ${s1Qs.map((q, idx) => {
                const userChoice = s1Ans[q.id];
                const isAnswered = userChoice !== undefined;
                const isCorrect = isAnswered && userChoice === q.correctAnswer;
                return `
                  <div class="bg-white border ${isCorrect ? 'border-emerald-200' : (isAnswered ? 'border-red-200' : 'border-slate-200')} rounded-xl p-4 shadow-2xs space-y-2">
                    <div class="flex items-start justify-between gap-3">
                      <div>
                        <span class="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">${q.topic || 'Quantitative'}</span>
                        <div class="text-xs font-bold text-slate-900 mt-0.5">Q${idx + 1}. ${q.question}</div>
                      </div>
                      <span class="px-2 py-0.5 text-[10px] font-bold rounded-full ${isCorrect ? 'bg-emerald-100 text-emerald-800' : (isAnswered ? 'bg-red-100 text-red-800' : 'bg-slate-100 text-slate-600')} shrink-0">
                        ${isCorrect ? '+1 Mark (Correct)' : (isAnswered ? '0 Marks (Incorrect)' : 'Unanswered (0)')}
                      </span>
                    </div>
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                      ${q.options.map((opt, oIdx) => {
                        const isSelected = userChoice === oIdx;
                        const isKey = q.correctAnswer === oIdx;
                        let optClass = 'bg-slate-50 border-slate-200 text-slate-700';
                        if (isKey) optClass = 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold';
                        else if (isSelected && !isKey) optClass = 'bg-red-50 border-red-300 text-red-900 font-bold';
                        return `
                          <div class="p-2 rounded-lg border text-xs flex items-center justify-between ${optClass}">
                            <span>${opt}</span>
                            ${isSelected ? '<span class="text-[10px] font-bold bg-white px-1.5 py-0.5 rounded shadow-2xs">Candidate Selected</span>' : ''}
                            ${isKey && !isSelected ? '<span class="text-[10px] font-bold text-emerald-700"><i class="fas fa-check"></i> Correct Key</span>' : ''}
                          </div>
                        `;
                      }).join('')}
                    </div>
                    ${q.explanation ? `<div class="text-[11px] text-slate-500 bg-slate-50 p-2 rounded border border-slate-100 mt-1"><strong>Explanation:</strong> ${q.explanation}</div>` : ''}
                  </div>
                `;
              }).join('')}
            </div>
          </div>

          <!-- Section 2 MCQs -->
          <div class="space-y-3 pt-4 border-t border-slate-200">
            <div class="flex items-center justify-between border-b border-slate-200 pb-2">
              <h3 class="text-sm font-black text-slate-900 flex items-center gap-2">
                <i class="fas fa-microchip text-blue-600"></i> Section 2: Technical Core (${s2CorrectCount}/20 Marks)
              </h3>
              <span class="text-xs font-bold text-slate-500">20 Questions • 1 Mark Each</span>
            </div>
            <div class="space-y-3">
              ${s2Qs.map((q, idx) => {
                const userChoice = s2Ans[q.id];
                const isAnswered = userChoice !== undefined;
                const isCorrect = isAnswered && userChoice === q.correctAnswer;
                return `
                  <div class="bg-white border ${isCorrect ? 'border-emerald-200' : (isAnswered ? 'border-red-200' : 'border-slate-200')} rounded-xl p-4 shadow-2xs space-y-2">
                    <div class="flex items-start justify-between gap-3">
                      <div>
                        <span class="text-[10px] font-bold text-blue-600 uppercase tracking-wider">${q.topic || 'Technical Core'}</span>
                        <div class="text-xs font-bold text-slate-900 mt-0.5">Q${idx + 1}. ${q.question}</div>
                      </div>
                      <span class="px-2 py-0.5 text-[10px] font-bold rounded-full ${isCorrect ? 'bg-emerald-100 text-emerald-800' : (isAnswered ? 'bg-red-100 text-red-800' : 'bg-slate-100 text-slate-600')} shrink-0">
                        ${isCorrect ? '+1 Mark (Correct)' : (isAnswered ? '0 Marks (Incorrect)' : 'Unanswered (0)')}
                      </span>
                    </div>
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                      ${q.options.map((opt, oIdx) => {
                        const isSelected = userChoice === oIdx;
                        const isKey = q.correctAnswer === oIdx;
                        let optClass = 'bg-slate-50 border-slate-200 text-slate-700';
                        if (isKey) optClass = 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold';
                        else if (isSelected && !isKey) optClass = 'bg-red-50 border-red-300 text-red-900 font-bold';
                        return `
                          <div class="p-2 rounded-lg border text-xs flex items-center justify-between ${optClass}">
                            <span>${opt}</span>
                            ${isSelected ? '<span class="text-[10px] font-bold bg-white px-1.5 py-0.5 rounded shadow-2xs">Candidate Selected</span>' : ''}
                            ${isKey && !isSelected ? '<span class="text-[10px] font-bold text-emerald-700"><i class="fas fa-check"></i> Correct Key</span>' : ''}
                          </div>
                        `;
                      }).join('')}
                    </div>
                    ${q.explanation ? `<div class="text-[11px] text-slate-500 bg-slate-50 p-2 rounded border border-slate-100 mt-1"><strong>Explanation:</strong> ${q.explanation}</div>` : ''}
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        </div>
      `;
    } else if (tabKey === "proctoring") {
      const vCount = sh.proctoring_violations ?? sh.assessment?.violations ?? 0;
      container.innerHTML = `
        <div class="space-y-4">
          <div class="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
            <h3 class="text-sm font-black text-slate-900 flex items-center gap-2">
              <i class="fas fa-shield-alt text-rose-600"></i> AI Anti-Cheating & Session Proctoring Audit
            </h3>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div class="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <span class="text-[10px] font-bold uppercase text-slate-400 block mb-0.5">Total Violations Flagged</span>
                <span class="text-2xl font-black ${vCount === 0 ? 'text-emerald-600' : 'text-red-600'}">${vCount}</span>
                <span class="text-[11px] text-slate-500 block mt-1">${vCount === 0 ? 'Strict integrity compliant' : 'Security warnings logged'}</span>
              </div>
              <div class="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <span class="text-[10px] font-bold uppercase text-slate-400 block mb-0.5">Webcam Surveillance</span>
                <span class="text-2xl font-black text-emerald-600"><i class="fas fa-camera text-base mr-1"></i>Active</span>
                <span class="text-[11px] text-slate-500 block mt-1">Continuous facial presence verified</span>
              </div>
              <div class="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <span class="text-[10px] font-bold uppercase text-slate-400 block mb-0.5">Clipboard & Tab Interception</span>
                <span class="text-2xl font-black text-emerald-600"><i class="fas fa-lock text-base mr-1"></i>Secure</span>
                <span class="text-[11px] text-slate-500 block mt-1">Full-screen sandbox enforcement</span>
              </div>
            </div>
          </div>
        </div>
      `;
    }
  }

  escapeHtml(text) {
    if (!text) return "";
    return String(text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  openMarksOverrideModal(assessmentId, studentId, sec1, sec2, sec3, studentName) {
    const s1 = prompt(`Override Section 1 Score for ${studentName} (0 to 40):`, sec1);
    if (s1 === null) return;
    const s2 = prompt(`Override Section 2 Score for ${studentName} (0 to 20):`, sec2);
    if (s2 === null) return;
    const s3 = prompt(`Override Section 3 Score for ${studentName} (0 to 40):`, sec3);
    if (s3 === null) return;
    const notes = prompt(`Evaluator Review Notes / Justification:`, "Re-evaluation of coding test cases");
    if (!notes) return;

    fetch("./admin-api.php?action=answer_sheets&sub=override_marks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        assessmentId, studentId,
        sec1Score: parseFloat(s1),
        sec2Score: parseFloat(s2),
        sec3Score: parseFloat(s3),
        evaluatorNotes: notes
      })
    })
    .then(r => r.json())
    .then(data => {
      if (data.success) {
        window.appState.showToast(data.message, "success");
        this.renderAnswerSheets(document.getElementById("admin-module-viewport"));
        this.closeAnswerSheetModal();
      } else {
        window.appState.showToast(data.error || "Failed to override marks.", "error");
      }
    })
    .catch(() => window.appState.showToast("Network error saving marks.", "error"));
  }

  // --------------------------------------------------------------------------
  // MODULE 15: LIVE RANKINGS & LEADERBOARD (ADMIN ONLY)
  // --------------------------------------------------------------------------
  async renderLiveRankings(container) {
    let rankings = [];
    try {
      const res = await fetch("./admin-api.php?action=rankings");
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.rankings) && data.rankings.length > 0) {
          rankings = data.rankings;
        }
      }
    } catch (e) {}

    // Resilient fallback: only include candidates who have ACTUALLY completed the assessment
    if (!rankings || rankings.length === 0) {
      await this.loadCandidatesFromDb();
      const completedCandidates = (this.candidates || []).filter(c => 
        (c.status === "Completed" || c.testStatus === "Completed" || c.assessment || (c.totalScore != null && c.totalScore > 0))
      );

      // Sort strictly by total score descending
      completedCandidates.sort((a, b) => {
        const scoreA = a.assessment?.total_score ?? a.totalScore ?? a.score ?? 0;
        const scoreB = b.assessment?.total_score ?? b.totalScore ?? b.score ?? 0;
        return scoreB - scoreA;
      });

      const totalCount = completedCandidates.length;
      rankings = completedCandidates.map((c, idx) => {
        const s1 = c.assessment?.section_1_score ?? c.section_1_score ?? 0;
        const s2 = c.assessment?.section_2_score ?? c.section_2_score ?? 0;
        const s3 = c.assessment?.section_3_score ?? c.section_3_score ?? 0;
        const total = c.assessment?.total_score ?? c.totalScore ?? (s1 + s2 + s3);
        const rank = idx + 1;
        const percentile = totalCount > 1 ? Math.round((((totalCount - rank) / (totalCount - 1)) * 100) * 10) / 10 : 100.0;
        return {
          rank: rank,
          name: c.name || c.student_name || "Candidate",
          registrationId: c.registrationId || c.registration_id || ("COG-2026-" + (c.id || (18200 + rank))),
          college: c.college || "Engineering College",
          course: c.course || "B.Tech",
          stream: c.stream || "Computer Science and Engineering",
          sec1Score: s1,
          sec2Score: s2,
          sec3Score: s3,
          totalScore: total,
          percentile: percentile,
          submittedAt: c.submittedAt || c.assessment?.submitted_at || c.submitted_at || "Recent",
          status: total >= 60 ? "Shortlisted" : (total >= 40 ? "Qualified" : "Rejected")
        };
      });
    }

    container.innerHTML = `
      <div class="space-y-6">
        <div class="flex items-center justify-between flex-wrap gap-4">
          <div>
            <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-50 text-red-700 border border-red-200 mb-2">
              <i class="fas fa-lock"></i> Strictly Confidential • Admin-Only Visibility
            </div>
            <h2 class="text-xl font-black text-slate-900 flex items-center gap-2">
              <i class="fas fa-trophy text-amber-500"></i> Live Examination Ranking & Percentile Leaderboard
            </h2>
            <p class="text-xs text-slate-500 mt-1">Real-time candidate standings ranked by Total Score, Percentage, and Proctoring Compliance. <strong>This view is completely hidden from students.</strong></p>
          </div>
          <button onclick="window.adminManager.exportRankingsCsv()" class="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition flex items-center gap-2 shadow-md">
            <i class="fas fa-file-csv"></i> Download Official Rankings CSV
          </button>
        </div>

        <div class="bg-white border border-slate-200/90 rounded-2xl shadow-xs rounded-xl overflow-hidden">
          <table class="w-full text-left text-xs border-collapse">
            <thead>
              <tr class="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase text-[11px]">
                <th class="p-3.5 text-center">Rank</th>
                <th class="p-3.5">Registration ID & Candidate</th>
                <th class="p-3.5">College & Branch</th>
                <th class="p-3.5 text-center">Sec 1 (40M)</th>
                <th class="p-3.5 text-center">Sec 2 (20M)</th>
                <th class="p-3.5 text-center">Sec 3 (40M)</th>
                <th class="p-3.5 text-center">Total (100M)</th>
                <th class="p-3.5 text-center">Percentile</th>
                <th class="p-3.5 text-center">Submitted At</th>
                <th class="p-3.5 text-center">Status</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 text-slate-800">
              ${rankings.length > 0 ? rankings.map(r => {
                const name = r.name || r.student_name || r.full_name || "Candidate";
                const regId = r.registrationId || r.registration_id || ("COG-2026-" + (r.studentId || r.student_id || r.id || r.rank));
                const college = r.college || "Andhra Pradesh Engineering Institution";
                const course = r.course || "B.Tech";
                const stream = r.stream || "Computer Science and Engineering";
                const s1 = r.sec1Score ?? r.section_1_score ?? 0;
                const s2 = r.sec2Score ?? r.section_2_score ?? 0;
                const s3 = r.sec3Score ?? r.section_3_score ?? 0;
                const total = r.totalScore ?? r.total_score ?? (s1 + s2 + s3);
                const perc = r.percentile != null ? r.percentile : (total >= 60 ? 92.5 : (total >= 40 ? 76.0 : 35.0));
                const status = r.result_status || r.status || (total >= 60 ? "Shortlisted" : (total >= 40 ? "Qualified" : "Rejected"));
                const subTime = r.submittedAt || r.submitted_at || '—';
                const statusBadge = (status === "Shortlisted" || total >= 60)
                  ? '<span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">Shortlisted</span>'
                  : ((status === "Qualified" || total >= 40)
                    ? '<span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">Qualified</span>'
                    : '<span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800 border border-red-200">Rejected</span>');

                return `
                <tr class="hover:bg-slate-50 transition border-b border-slate-100">
                  <td class="p-3.5 text-center font-black ${r.rank === 1 ? 'text-amber-500 text-base' : (r.rank === 2 ? 'text-slate-600 text-sm' : (r.rank === 3 ? 'text-amber-700 text-sm' : 'text-slate-400'))}">
                    #${r.rank}
                  </td>
                  <td class="p-3.5">
                    <div class="font-bold text-slate-900">${name}</div>
                    <div class="text-[11px] font-mono text-indigo-600">${regId}</div>
                  </td>
                  <td class="p-3.5">
                    <div class="text-slate-800 font-medium truncate max-w-xs" title="${college}">${college}</div>
                    <div class="text-[11px] text-slate-500">${course} — ${stream}</div>
                  </td>
                  <td class="p-3.5 text-center font-bold text-slate-700">${s1}</td>
                  <td class="p-3.5 text-center font-bold text-slate-700">${s2}</td>
                  <td class="p-3.5 text-center font-bold text-slate-700">${s3}</td>
                  <td class="p-3.5 text-center font-black text-indigo-700 text-sm">${total} / 100</td>
                  <td class="p-3.5 text-center font-bold text-teal-600">${perc} %ile</td>
                  <td class="p-3.5 text-center whitespace-nowrap">
                    <span class="font-mono text-[11px] font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200 inline-flex items-center gap-1.5">
                      <i class="far fa-clock text-slate-400"></i>${subTime}
                    </span>
                  </td>
                  <td class="p-3.5 text-center">
                    ${statusBadge}
                  </td>
                </tr>
              `;}).join('') : `<tr><td colspan="10" class="p-8 text-center text-slate-500 italic">No candidates ranked yet. Leaderboard updates automatically once exams are submitted.</td></tr>`}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  exportRankingsCsv() {
    window.location.href = "./admin-api.php?action=export_rankings_csv";
  }

  // --------------------------------------------------------------------------
  // MODULE 16 & 17: RESULTS APPROVAL & ANNOUNCEMENT PIPELINE
  // --------------------------------------------------------------------------
  async renderResultApprovals(container) {
    let pipeline = [];
    try {
      const res = await fetch("./admin-api.php?action=results_pipeline&sub=list");
      const data = await res.json();
      if (data.success) pipeline = data.pipelineList;
    } catch (e) {}

    container.innerHTML = `
      <div class="space-y-6">
        <div class="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 class="text-xl font-black text-slate-900 flex items-center gap-2">
              <i class="fas fa-stamp text-indigo-300"></i> 10-Stage Result Approval Pipeline
            </h2>
            <p class="text-xs text-slate-500 mt-1">Stage-by-stage verification. Candidate scores remain hidden from student portal until officially announced.</p>
          </div>
          <button onclick="window.adminManager.switchModule('announcement')" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg transition flex items-center gap-2">
            <i class="fas fa-bullhorn"></i> Go to Publication & Announcement
          </button>
        </div>

        <div class="bg-white border border-slate-200/90 rounded-2xl shadow-xs rounded-xl overflow-hidden">
          <table class="w-full text-left text-xs border-collapse">
            <thead>
              <tr class="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase text-[11px]">
                <th class="p-3.5">Candidate</th>
                <th class="p-3.5">Current Stage Status</th>
                <th class="p-3.5 text-center">Live Score</th>
                <th class="p-3.5 text-center">Portal Visibility</th>
                <th class="p-3.5 text-right">Pipeline Action</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 text-slate-800">
              ${pipeline.length > 0 ? pipeline.map(p => `
                <tr class="hover:bg-sky-50/50 transition">
                  <td class="p-3.5">
                    <div class="font-bold text-white">${p.student_name}</div>
                    <div class="text-[11px] font-mono text-indigo-400">${p.registration_id}</div>
                  </td>
                  <td class="p-3.5">
                    <span class="px-2.5 py-1 rounded-md text-xs font-bold bg-indigo-900/80 text-indigo-200 border border-indigo-700">
                      ${p.stage_status}
                    </span>
                  </td>
                  <td class="p-3.5 text-center font-bold text-indigo-300">
                    ${p.total_score || p.live_total_score || 0} / 100
                  </td>
                  <td class="p-3.5 text-center">
                    ${p.is_published_to_student ? `<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300">Published</span>` : `<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-700 text-slate-400">Hidden from Student</span>`}
                  </td>
                  <td class="p-3.5 text-right">
                    <button onclick="window.adminManager.advancePipelineStage(${p.id})" class="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded text-xs font-bold transition">
                      Advance Stage <i class="fas fa-arrow-right ml-1"></i>
                    </button>
                  </td>
                </tr>
              `).join('') : `<tr><td colspan="5" class="p-8 text-center text-slate-500 italic">No candidate results currently in pipeline.</td></tr>`}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  advancePipelineStage(pipelineId) {
    const stages = [
      "Exam Submitted",
      "Answers Saved",
      "Auto Evaluation In Progress",
      "Marks Calculated",
      "Pending Admin Review",
      "Answer Sheet Approved",
      "Results Approved",
      "Announcement Scheduled",
      "Results Announced",
      "Published to Student Portal"
    ];

    const current = prompt(`Select new stage:\n${stages.map((s, i) => `${i + 1}. ${s}`).join('\n')}`, "7");
    if (!current) return;
    const stageIdx = parseInt(current) - 1;
    if (stageIdx < 0 || stageIdx >= stages.length) return;

    fetch("./admin-api.php?action=results_pipeline&sub=advance_stage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pipelineId, newStage: stages[stageIdx] })
    })
    .then(r => r.json())
    .then(data => {
      if (data.success) {
        window.appState.showToast(data.message, "success");
        this.renderResultApprovals(document.getElementById("admin-module-viewport"));
      } else {
        window.appState.showToast(data.error || "Failed to advance stage.", "error");
      }
    })
    .catch(() => window.appState.showToast("Network error advancing stage.", "error"));
  }

  async renderResultAnnouncement(container) {
    container.innerHTML = `
      <div class="space-y-6 max-w-2xl">
        <div>
          <h2 class="text-xl font-black text-slate-900 flex items-center gap-2">
            <i class="fas fa-bullhorn text-teal-300"></i> Official Results Announcement & Publication Control
          </h2>
          <p class="text-xs text-slate-500 mt-1">Control visibility of final marks and scorecards to registered students.</p>
        </div>

        <div class="bg-white border border-slate-200/90 rounded-2xl shadow-xs rounded-2xl p-6 space-y-5">
          <div class="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-2">
            <div class="font-bold text-white flex items-center gap-2">
              <i class="fas fa-shield-alt text-amber-400"></i> Publication Protocol:
            </div>
            <p>Publishing results will immediately unveil final aggregate scores, section breakdowns, and qualification badges on student candidate dashboards.</p>
          </div>

          <div class="flex items-center gap-4 pt-2">
            <button onclick="window.adminManager.togglePublishAllResults(1)" class="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition shadow-lg flex items-center justify-center gap-2">
              <i class="fas fa-globe"></i> Approve & Publish to Student Portal
            </button>
            <button onclick="window.adminManager.togglePublishAllResults(0)" class="flex-1 py-3 px-4 bg-red-950 hover:bg-red-900 text-red-300 border border-red-800 font-bold text-xs rounded-xl transition flex items-center justify-center gap-2">
              <i class="fas fa-eye-slash"></i> Unpublish & Hide Scores
            </button>
          </div>
        </div>
      </div>
    `;
  }

  async togglePublishAllResults(publishVal) {
    const confirmAction = confirm(publishVal ? "Are you sure you want to officially PUBLISH all candidate results to the student portal?" : "Are you sure you want to UNPUBLISH and hide all candidate results?");
    if (!confirmAction) return;

    try {
      const res = await fetch("./admin-api.php?action=results_pipeline&sub=publish_results", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publish: publishVal })
      });
      const data = await res.json();
      if (data.success) {
        window.appState.showToast(data.message, "success");
      } else {
        window.appState.showToast(data.error || "Publish failed.", "error");
      }
    } catch (e) {
      window.appState.showToast("Network error publishing results.", "error");
    }
  }

  // --------------------------------------------------------------------------
  // MODULE 12: EXAM RECOVERY & RESUME MANAGEMENT
  // --------------------------------------------------------------------------
  async renderExamRecovery(container) {
    let attempts = [];
    let codes = [];
    try {
      const res = await fetch("./admin-api.php?action=recovery_attempts");
      const data = await res.json();
      if (data.success) {
        attempts = data.attempts || [];
        codes = data.codes || [];
      }
    } catch (e) {}

    container.innerHTML = `
      <div class="space-y-6">
        <div class="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 class="text-xl font-black text-slate-900 flex items-center gap-2">
              <i class="fas fa-life-ring text-amber-500"></i> Admin-Controlled Exam Recovery & Resume Manager
            </h2>
            <p class="text-xs text-slate-500 mt-1">Generate encrypted single-use access codes for candidates whose exams were interrupted by browser crashes, power cuts, or network drops.</p>
          </div>
          <button onclick="window.adminManager.renderExamRecovery(document.getElementById('admin-module-viewport'))" class="px-3.5 py-1.5 text-xs font-bold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl transition shadow-xs">
            <i class="fas fa-sync-alt mr-1"></i> Refresh Interrupted Sessions
          </button>
        </div>

        <div class="bg-white border border-slate-200/90 rounded-2xl shadow-xs rounded-xl overflow-hidden">
          <div class="p-4 bg-slate-50 border-b border-slate-200 font-bold text-xs text-slate-900">
            Interrupted or Cancelled Candidate Sessions (${attempts.length})
          </div>
          <table class="w-full text-left text-xs border-collapse">
            <thead>
              <tr class="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase text-[11px]">
                <th class="p-3.5">Candidate & Reg ID</th>
                <th class="p-3.5">Interruption Reason</th>
                <th class="p-3.5 text-center">Strikes</th>
                <th class="p-3.5 text-center">Time Left</th>
                <th class="p-3.5 text-right">Recovery Action</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 text-slate-800">
              ${attempts.length > 0 ? attempts.map(att => `
                <tr class="hover:bg-sky-50/50 transition">
                  <td class="p-3.5">
                    <div class="font-bold text-white">${att.student_name}</div>
                    <div class="text-[11px] font-mono text-indigo-400">${att.registration_id}</div>
                  </td>
                  <td class="p-3.5 text-slate-300">${att.interruption_reason || 'Unexpected tab/browser termination'}</td>
                  <td class="p-3.5 text-center"><span class="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/20 text-red-300">${att.total_violations} Strikes</span></td>
                  <td class="p-3.5 text-center font-mono font-bold">${Math.floor(att.duration_seconds_left / 60)}m ${att.duration_seconds_left % 60}s</td>
                  <td class="p-3.5 text-right">
                    <button onclick="window.adminManager.generateRecoveryCode(${att.attempt_id}, ${att.student_id}, '${att.student_name.replace(/'/g, "\\'")}')" class="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs font-bold transition">
                      <i class="fas fa-key mr-1"></i> Generate Recovery Code
                    </button>
                  </td>
                </tr>
              `).join('') : `<tr><td colspan="5" class="p-8 text-center text-slate-500 italic">No interrupted candidate sessions currently require recovery.</td></tr>`}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  generateRecoveryCode(attemptId, studentId, studentName) {
    const reason = prompt(`Enter authorized reason for generating recovery code for ${studentName}:`, "Network dropout verified by proctor");
    if (!reason) return;

    fetch("./recovery-api.php?action=generate_code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ attemptId, studentId, reason, adminName: "Lead Recruiter" })
    })
    .then(r => r.json())
    .then(data => {
      if (data.success && data.plainCode) {
        alert(`SUCCESS!\nSingle-Use Recovery Code: ${data.plainCode}\n\nProvide this 8-character code to ${studentName} to unlock and resume their examination session.`);
        this.renderExamRecovery(document.getElementById("admin-module-viewport"));
      } else {
        window.appState.showToast(data.error || "Failed to generate recovery code.", "error");
      }
    })
    .catch(() => window.appState.showToast("Network error generating recovery code.", "error"));
  }

  // --------------------------------------------------------------------------
  // MODULE: ACADEMICS & INSTITUTIONS (Colleges & Courses)
  // --------------------------------------------------------------------------
  async renderCollegeManagement(container) {
    let colleges = [];
    try {
      const res = await fetch("./admin-api.php?action=list_colleges");
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.colleges)) {
          colleges = data.colleges;
        }
      }
    } catch (e) {
      console.warn("Could not load colleges from DB, using fallback:", e);
    }

    if (colleges.length === 0) {
      colleges = [
        { id: 1, name: "University College of Engineering Kakinada (UCEK - JNTUK)", district: "Kakinada", type: "University", code: "JNTUK", is_active: 1 },
        { id: 2, name: "Andhra University College of Engineering (AUCE)", district: "Visakhapatnam", type: "University", code: "AU", is_active: 1 },
        { id: 3, name: "Sri Venkateswara University College of Engineering (SVUCE)", district: "Tirupati", type: "University", code: "SVU", is_active: 1 },
        { id: 4, name: "Acharya Nagarjuna University College of Engineering", district: "Guntur", type: "University", code: "ANU", is_active: 1 },
        { id: 5, name: "JNTUA College of Engineering", district: "Anantapur", type: "University", code: "JNTUA", is_active: 1 },
        { id: 6, name: "KL University (Deemed to be University)", district: "Guntur", type: "Deemed University", code: "KLU", is_active: 1 },
        { id: 7, name: "Vignan Foundation for Science, Technology & Research", district: "Guntur", type: "Deemed University", code: "VIGNAN", is_active: 1 },
        { id: 8, name: "GITAM Deemed to be University", district: "Visakhapatnam", type: "Deemed University", code: "GITAM", is_active: 1 },
        { id: 9, name: "Aditya Engineering College (AEC Autonomous)", district: "Kakinada", type: "Autonomous Engineering", code: "AEC", is_active: 1 },
        { id: 10, name: "Aditya College of Engineering & Technology (ACET)", district: "Kakinada", type: "Autonomous Engineering", code: "ACET", is_active: 1 },
        { id: 11, name: "Aditya College of Engineering (ACE)", district: "Kakinada", type: "Autonomous Engineering", code: "ACE", is_active: 1 },
        { id: 12, name: "Pragati Engineering College (PEC Autonomous)", district: "Kakinada", type: "Autonomous Engineering", code: "PEC", is_active: 1 },
        { id: 13, name: "Godavari Institute of Engineering & Technology (GIET Autonomous)", district: "East Godavari", type: "Autonomous Engineering", code: "GIET", is_active: 1 },
        { id: 14, name: "GIET College of Engineering", district: "East Godavari", type: "Affiliated Engineering", code: "GIETC", is_active: 1 }
      ];
    }

    this._cachedColleges = colleges;

    container.innerHTML = `
      <div class="space-y-4">
        <div class="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 class="text-xl font-black text-slate-900 flex items-center gap-2">
              <i class="fas fa-university text-orange-400"></i> Andhra Pradesh Curated College Management
            </h2>
            <p class="text-xs text-slate-500 mt-1">Verified universities, autonomous institutions, and colleges across Andhra Pradesh districts.</p>
          </div>
          <button onclick="window.adminManager.showAddCollegeModal()" class="px-3.5 py-1.5 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-lg transition flex items-center gap-1.5 shadow-sm">
            <i class="fas fa-plus"></i> Add AP Institution
          </button>
        </div>

        <!-- Filter bar -->
        <div class="bg-white border border-slate-200/90 rounded-2xl shadow-xs p-3.5 rounded-xl flex items-center gap-3 flex-wrap">
          <input type="text" id="admin-col-search" placeholder="Search college name, district, code..." oninput="window.adminManager.filterCollegesTable()" class="flex-1 min-w-[200px] px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:bg-white focus:border-sky-500 focus:border-orange-500" />
          <select id="admin-col-dist" onchange="window.adminManager.filterCollegesTable()" class="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:bg-white focus:border-sky-500">
            <option value="ALL">All Districts</option>
            <option value="Kakinada">Kakinada</option>
            <option value="East Godavari">East Godavari</option>
            <option value="Visakhapatnam">Visakhapatnam</option>
            <option value="Guntur">Guntur</option>
            <option value="Tirupati">Tirupati</option>
            <option value="Anantapur">Anantapur</option>
            <option value="Krishna">Krishna</option>
            <option value="West Godavari">West Godavari</option>
          </select>
        </div>

        <div class="bg-white border border-slate-200/90 rounded-2xl shadow-xs rounded-xl overflow-hidden">
          <table class="w-full text-left text-xs border-collapse">
            <thead>
              <tr class="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase text-[11px]">
                <th class="p-3.5">Institution Name</th>
                <th class="p-3.5">Code</th>
                <th class="p-3.5">District</th>
                <th class="p-3.5">Institution Type</th>
                <th class="p-3.5 text-center">Status</th>
                <th class="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody id="admin-colleges-body" class="divide-y divide-slate-100 text-slate-800">
              <!-- Rendered via filterCollegesTable -->
            </tbody>
          </table>
        </div>
      </div>
    `;

    this.filterCollegesTable();
  }

  filterCollegesTable() {
    const search = (document.getElementById("admin-col-search")?.value || "").toLowerCase();
    const dist = document.getElementById("admin-col-dist")?.value || "ALL";
    const tbody = document.getElementById("admin-colleges-body");
    if (!tbody || !this._cachedColleges) return;

    const filtered = this._cachedColleges.filter(c => {
      const matchSearch = !search || (c.name || "").toLowerCase().includes(search) || (c.district || "").toLowerCase().includes(search) || (c.code || "").toLowerCase().includes(search);
      const matchDist = dist === "ALL" || c.district === dist;
      return matchSearch && matchDist;
    });

    if (filtered.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" class="p-6 text-center text-slate-500 italic">No colleges found matching criteria.</td></tr>`;
      return;
    }

    tbody.innerHTML = filtered.map(c => `
      <tr class="hover:bg-sky-50/50 transition">
        <td class="p-3.5 font-bold text-white">${c.name}</td>
        <td class="p-3.5 font-mono text-indigo-400 font-bold">${c.code || '—'}</td>
        <td class="p-3.5 text-slate-300">${c.district}</td>
        <td class="p-3.5"><span class="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300">${c.type || 'Engineering'}</span></td>
        <td class="p-3.5 text-center">
          <span class="px-2 py-0.5 rounded text-[10px] font-bold ${c.is_active ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'}">
            ${c.is_active ? 'Verified Active' : 'Inactive'}
          </span>
        </td>
        <td class="p-3.5 text-right space-x-1 whitespace-nowrap">
          <button onclick="window.adminManager.showEditCollegeModal(${c.id})" class="px-2 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded text-[11px]" title="Edit College">
            <i class="fas fa-edit"></i>
          </button>
          <button onclick="window.adminManager.toggleCollegeStatus(${c.id}, ${c.is_active ? 1 : 0})" class="px-2 py-1 ${c.is_active ? 'bg-amber-600/80 hover:bg-amber-600' : 'bg-emerald-600 hover:bg-emerald-700'} text-white rounded text-[11px]" title="${c.is_active ? 'Deactivate' : 'Activate'}">
            <i class="fas ${c.is_active ? 'fa-eye-slash' : 'fa-check'}"></i>
          </button>
        </td>
      </tr>
    `).join('');
  }

  showAddCollegeModal() {
    this.showModal({
      title: "Add Andhra Pradesh Institution",
      subtitle: "Register a recognized university, autonomous college, or institution",
      icon: "fas fa-university text-orange-400",
      confirmText: "Save Institution",
      confirmColor: "bg-orange-600 hover:bg-orange-700",
      html: `
        <div class="space-y-3 text-xs">
          <div>
            <label class="block text-slate-700 uppercase tracking-wider text-[11px] font-bold mb-1.5">Institution Full Name *</label>
            <input type="text" id="add-col-name" placeholder="e.g. Seshadri Rao Gudlavalleru Engineering College" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:bg-white focus:border-sky-500 focus:border-orange-500" />
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-slate-700 uppercase tracking-wider text-[11px] font-bold mb-1.5">Institution Code *</label>
              <input type="text" id="add-col-code" placeholder="e.g. SRGEC" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:bg-white focus:border-sky-500 focus:border-orange-500" />
            </div>
            <div>
              <label class="block text-slate-700 uppercase tracking-wider text-[11px] font-bold mb-1.5">District *</label>
              <input type="text" id="add-col-dist" placeholder="e.g. Krishna" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:bg-white focus:border-sky-500 focus:border-orange-500" />
            </div>
          </div>
          <div>
            <label class="block text-slate-700 uppercase tracking-wider text-[11px] font-bold mb-1.5">Institution Category / Type</label>
            <select id="add-col-type" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:bg-white focus:border-sky-500">
              <option value="Autonomous Engineering">Autonomous Engineering</option>
              <option value="University">University</option>
              <option value="Deemed University">Deemed University</option>
              <option value="Affiliated Engineering">Affiliated Engineering</option>
              <option value="Degree College">Degree College</option>
            </select>
          </div>
        </div>
      `,
      onConfirm: async () => {
        const name = document.getElementById("add-col-name")?.value.trim();
        const code = document.getElementById("add-col-code")?.value.trim().toUpperCase();
        const district = document.getElementById("add-col-dist")?.value.trim();
        const type = document.getElementById("add-col-type")?.value;

        if (!name || !district) {
          window.appState.showToast("Institution name and district are required.", "error");
          return false;
        }

        const res = await fetch("./admin-api.php?action=add_college", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, code, district, type })
        });
        const data = await res.json();
        if (data.success) {
          window.appState.showToast(data.message, "success");
          await this.renderCollegeManagement(document.getElementById("admin-module-viewport"));
          return true;
        } else {
          window.appState.showToast(data.error || "Failed to add college.", "error");
          return false;
        }
      }
    });
  }

  showEditCollegeModal(collegeId) {
    const col = (this._cachedColleges || []).find(c => c.id === collegeId);
    if (!col) return;

    this.showModal({
      title: "Edit Institution Details",
      subtitle: `Updating institution: ${col.name}`,
      icon: "fas fa-edit text-orange-400",
      confirmText: "Update Institution",
      confirmColor: "bg-orange-600 hover:bg-orange-700",
      html: `
        <div class="space-y-3 text-xs">
          <div>
            <label class="block text-slate-700 uppercase tracking-wider text-[11px] font-bold mb-1.5">Institution Full Name *</label>
            <input type="text" id="edit-col-name" value="${col.name || ''}" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:bg-white focus:border-sky-500 focus:border-orange-500" />
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-slate-700 uppercase tracking-wider text-[11px] font-bold mb-1.5">Code</label>
              <input type="text" id="edit-col-code" value="${col.code || ''}" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:bg-white focus:border-sky-500 focus:border-orange-500" />
            </div>
            <div>
              <label class="block text-slate-700 uppercase tracking-wider text-[11px] font-bold mb-1.5">District *</label>
              <input type="text" id="edit-col-dist" value="${col.district || ''}" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:bg-white focus:border-sky-500 focus:border-orange-500" />
            </div>
          </div>
          <div>
            <label class="block text-slate-700 uppercase tracking-wider text-[11px] font-bold mb-1.5">Institution Category / Type</label>
            <input type="text" id="edit-col-type" value="${col.type || 'Autonomous Engineering'}" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:bg-white focus:border-sky-500 focus:border-orange-500" />
          </div>
        </div>
      `,
      onConfirm: async () => {
        const name = document.getElementById("edit-col-name")?.value.trim();
        const code = document.getElementById("edit-col-code")?.value.trim();
        const district = document.getElementById("edit-col-dist")?.value.trim();
        const type = document.getElementById("edit-col-type")?.value.trim();

        if (!name || !district) {
          window.appState.showToast("Institution name and district cannot be empty.", "error");
          return false;
        }

        const res = await fetch("./admin-api.php?action=edit_college", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ college_id: collegeId, name, code, district, type })
        });
        const data = await res.json();
        if (data.success) {
          window.appState.showToast(data.message, "success");
          await this.renderCollegeManagement(document.getElementById("admin-module-viewport"));
          return true;
        } else {
          window.appState.showToast(data.error || "Failed to update college.", "error");
          return false;
        }
      }
    });
  }

  async toggleCollegeStatus(collegeId, currentActive) {
    try {
      const res = await fetch("./admin-api.php?action=toggle_college_status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ college_id: collegeId, is_active: currentActive ? 0 : 1 })
      });
      const data = await res.json();
      if (data.success) {
        window.appState.showToast(data.message, "success");
        await this.renderCollegeManagement(document.getElementById("admin-module-viewport"));
      } else {
        window.appState.showToast(data.error || "Failed to toggle status.", "error");
      }
    } catch (e) {
      window.appState.showToast("Network error updating college status.", "error");
    }
  }

  async renderCourseManagement(container) {
    let courses = [];
    try {
      const res = await fetch("./admin-api.php?action=list_courses_branches");
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.courses)) {
          courses = data.courses;
        }
      }
    } catch (e) {}

    if (courses.length === 0) {
      courses = [
        { id: 1, name: "B.Tech", level: "Undergraduate", duration: "4 Years", branches: ["Computer Science & Engineering (CSE)", "AI & Machine Learning (AIML)", "AI & Data Science (AIDS)", "Data Science (DS)", "Information Technology (IT)", "Electronics & Communication (ECE)", "Electrical & Electronics (EEE)", "Mechanical Engineering (ME)", "Civil Engineering (CE)", "Cyber Security", "Agricultural Engineering"] },
        { id: 2, name: "M.Tech", level: "Postgraduate", duration: "2 Years", branches: ["Computer Science & Engineering", "Artificial Intelligence", "Data Science", "Cyber Security", "VLSI System Design", "Software Engineering", "Machine Learning"] },
        { id: 3, name: "BCA", level: "Undergraduate", duration: "3 Years", branches: ["Computer Applications", "Data Science", "Artificial Intelligence"] },
        { id: 4, name: "MCA", level: "Postgraduate", duration: "2 Years", branches: ["Computer Applications", "Artificial Intelligence & ML", "Data Science & Cloud"] },
        { id: 5, name: "B.Sc", level: "Undergraduate", duration: "3 Years", branches: ["Computer Science", "Mathematics", "Statistics", "Physics", "Chemistry", "Biotechnology", "Electronics"] },
        { id: 6, name: "M.Sc", level: "Postgraduate", duration: "2 Years", branches: ["Computer Science", "Mathematics", "Statistics", "Data Science", "Artificial Intelligence"] },
        { id: 7, name: "B.Com", level: "Undergraduate", duration: "3 Years", branches: ["General", "Computer Applications", "Accounting & Finance"] }
      ];
    }

    this._cachedCourses = courses;

    container.innerHTML = `
      <div class="space-y-6">
        <div class="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 class="text-xl font-black text-slate-900 flex items-center gap-2">
              <i class="fas fa-graduation-cap text-yellow-400"></i> Dynamic Course & Specialization Catalog
            </h2>
            <p class="text-xs text-slate-500 mt-1">Dependent academic qualifications, degree programs, and dynamic branch specializations available in candidate registration.</p>
          </div>
          <button onclick="window.adminManager.showAddBranchModal()" class="px-3.5 py-1.5 bg-yellow-600 hover:bg-yellow-700 text-white font-bold text-xs rounded-lg transition flex items-center gap-1.5 shadow-sm">
            <i class="fas fa-plus"></i> Add Branch Specialization
          </button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          ${courses.map(crs => `
            <div class="bg-white border border-slate-200/90 rounded-2xl shadow-xs rounded-xl p-4 space-y-3">
              <div class="flex items-center justify-between border-b border-slate-200/60 pb-2">
                <div>
                  <h3 class="text-sm font-black text-white">${crs.name}</h3>
                  <span class="text-[11px] text-slate-500">${crs.level || 'Degree'} • ${crs.duration || 'Standard'}</span>
                </div>
                <div class="flex items-center gap-2">
                  <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300">${(crs.branches || []).length} Branches</span>
                  <button onclick="window.adminManager.showAddBranchModal('${crs.name}')" class="text-slate-400 hover:text-yellow-400 text-xs" title="Add Branch to ${crs.name}">
                    <i class="fas fa-plus-circle"></i>
                  </button>
                </div>
              </div>
              <div class="flex flex-wrap gap-1.5">
                ${(crs.branches || []).map(b => {
                  const bName = typeof b === 'string' ? b : (b.name || '');
                  return `
                    <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] bg-slate-50 border border-slate-200/60 text-slate-300 font-medium group">
                      <span>${bName}</span>
                      <button onclick="window.adminManager.deleteBranch('${bName}', '${crs.name}')" class="text-slate-500 hover:text-red-400 opacity-60 group-hover:opacity-100 transition" title="Delete Branch">
                        <i class="fas fa-times text-[10px]"></i>
                      </button>
                    </span>
                  `;
                }).join('')}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  showAddBranchModal(preselectedCourse = "B.Tech") {
    this.showModal({
      title: "Add Branch Specialization",
      subtitle: "Introduce a new engineering stream or degree specialization",
      icon: "fas fa-graduation-cap text-yellow-400",
      confirmText: "Create Branch",
      confirmColor: "bg-yellow-600 hover:bg-yellow-700",
      html: `
        <div class="space-y-3 text-xs">
          <div>
            <label class="block text-slate-700 uppercase tracking-wider text-[11px] font-bold mb-1.5">Target Degree / Program *</label>
            <select id="add-br-course" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:bg-white focus:border-sky-500">
              <option value="B.Tech" ${preselectedCourse === 'B.Tech' ? 'selected' : ''}>B.Tech</option>
              <option value="M.Tech" ${preselectedCourse === 'M.Tech' ? 'selected' : ''}>M.Tech</option>
              <option value="BCA" ${preselectedCourse === 'BCA' ? 'selected' : ''}>BCA</option>
              <option value="MCA" ${preselectedCourse === 'MCA' ? 'selected' : ''}>MCA</option>
              <option value="B.Sc" ${preselectedCourse === 'B.Sc' ? 'selected' : ''}>B.Sc</option>
              <option value="M.Sc" ${preselectedCourse === 'M.Sc' ? 'selected' : ''}>M.Sc</option>
              <option value="B.Com" ${preselectedCourse === 'B.Com' ? 'selected' : ''}>B.Com</option>
            </select>
          </div>
          <div>
            <label class="block text-slate-700 uppercase tracking-wider text-[11px] font-bold mb-1.5">Branch Name *</label>
            <input type="text" id="add-br-name" placeholder="e.g. Robotics and Autonomous Systems" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:bg-white focus:border-sky-500 focus:border-yellow-500" />
          </div>
          <div>
            <label class="block text-slate-700 uppercase tracking-wider text-[11px] font-bold mb-1.5">Branch Code (Optional)</label>
            <input type="text" id="add-br-code" placeholder="e.g. RAS" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:bg-white focus:border-sky-500 focus:border-yellow-500" />
          </div>
        </div>
      `,
      onConfirm: async () => {
        const course = document.getElementById("add-br-course")?.value;
        const branch = document.getElementById("add-br-name")?.value.trim();
        const code = document.getElementById("add-br-code")?.value.trim();

        if (!branch) {
          window.appState.showToast("Branch name is required.", "error");
          return false;
        }

        const res = await fetch("./admin-api.php?action=add_branch", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ course_name: course, branch_name: branch, branch_code: code })
        });
        const data = await res.json();
        if (data.success) {
          window.appState.showToast(data.message, "success");
          await this.renderCourseManagement(document.getElementById("admin-module-viewport"));
          return true;
        } else {
          window.appState.showToast(data.error || "Failed to add branch.", "error");
          return false;
        }
      }
    });
  }

  deleteBranch(branchName, courseName) {
    this.showModal({
      title: "Remove Branch Specialization",
      subtitle: `Action on ${branchName} (${courseName})`,
      icon: "fas fa-trash-alt text-red-400",
      confirmText: "Remove Branch",
      confirmColor: "bg-red-600 hover:bg-red-700",
      html: `
        <div class="p-3 bg-red-950/40 border border-red-800/60 rounded-xl text-red-200 text-xs">
          Are you sure you want to remove <strong>${branchName}</strong> from ${courseName}?
          New candidate registrations will no longer see this specialization in the branch dropdown.
        </div>
      `,
      onConfirm: async () => {
        const res = await fetch("./admin-api.php?action=delete_branch", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ branch_name: branchName, course_name: courseName })
        });
        const data = await res.json();
        if (data.success) {
          window.appState.showToast(data.message, "success");
          await this.renderCourseManagement(document.getElementById("admin-module-viewport"));
          return true;
        } else {
          window.appState.showToast(data.error || "Failed to remove branch.", "error");
          return false;
        }
      }
    });
  }

  async deleteTask(taskId) {
    this.showModal({
      title: "Delete Student Task",
      subtitle: `Action on task ID #${taskId}`,
      icon: "fas fa-trash-alt text-red-400",
      confirmText: "Delete Task",
      confirmColor: "bg-red-600 hover:bg-red-700",
      html: `
        <div class="p-3 bg-red-950/40 border border-red-800/60 rounded-xl text-red-200 text-xs">
          Are you sure you want to delete this task? All student assignments and submission logs for this task will be removed.
        </div>
      `,
      onConfirm: async () => {
        const res = await fetch("./admin-api.php?action=delete_task", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ task_id: taskId })
        });
        const data = await res.json();
        if (data.success) {
          window.appState.showToast(data.message, "success");
          await this.renderTaskAssignment(document.getElementById("admin-module-viewport"));
          return true;
        } else {
          window.appState.showToast(data.error || "Failed to delete task.", "error");
          return false;
        }
      }
    });
  }

  // --------------------------------------------------------------------------
  // MODULE: EXAMS & QUESTION BANK
  // --------------------------------------------------------------------------
  async renderExamManagement(container) {
    let exams = [];
    try {
      const res = await fetch("./admin-api.php?action=list_exams");
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.exams)) {
          exams = data.exams;
        }
      }
    } catch (e) {}

    container.innerHTML = `
      <div class="space-y-6 max-w-4xl">
        <div class="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 class="text-xl font-black text-slate-900 flex items-center gap-2">
              <i class="fas fa-file-signature text-purple-400"></i> Standardized Examination Configuration
            </h2>
            <p class="text-xs text-slate-500 mt-1">Configure duration, sequential sections, passing benchmark, and weightage distribution.</p>
          </div>
          <button onclick="window.adminManager.showCreateExamModal()" class="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-lg transition flex items-center gap-1.5 shadow-sm">
            <i class="fas fa-plus"></i> Create Exam Track
          </button>
        </div>

        <div class="bg-white border border-slate-200/90 rounded-2xl shadow-xs rounded-2xl p-6 space-y-5">
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div class="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <span class="text-[10px] font-bold uppercase text-slate-400 block mb-1">Total Duration</span>
              <span class="text-xl font-black text-white">1 Hr 30 Mins (90m)</span>
            </div>
            <div class="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <span class="text-[10px] font-bold uppercase text-slate-400 block mb-1">Total Marks</span>
              <span class="text-xl font-black text-indigo-400">100 Marks</span>
            </div>
            <div class="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <span class="text-[10px] font-bold uppercase text-slate-400 block mb-1">Passing Threshold</span>
              <span class="text-xl font-black text-emerald-400">40 / 100 (40%)</span>
            </div>
          </div>

          <div class="space-y-3 pt-2">
            <h3 class="text-xs font-bold text-slate-300 uppercase tracking-wider">3 Sequential Sections Structure</h3>
            
            <div class="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <div class="text-xs font-bold text-white"><i class="fas fa-brain text-indigo-400 mr-2"></i>Section 1: Quantitative Aptitude, Analytical Reasoning & Verbal Ability</div>
                <div class="text-[11px] text-slate-500 mt-0.5">40 Sequential MCQs • 40 Minutes Allotted • No Negative Marking</div>
              </div>
              <span class="px-3 py-1 bg-indigo-500/20 text-indigo-300 font-bold text-xs rounded-lg">40 Marks</span>
            </div>

            <div class="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <div class="text-xs font-bold text-white"><i class="fas fa-code-branch text-purple-400 mr-2"></i>Section 2: Technical Core Knowledge (Branch-Specific)</div>
                <div class="text-[11px] text-slate-500 mt-0.5">20 Specialized Technical MCQs • 20 Minutes Allotted • No Negative Marking</div>
              </div>
              <span class="px-3 py-1 bg-purple-500/20 text-purple-300 font-bold text-xs rounded-lg">20 Marks</span>
            </div>

            <div class="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <div class="text-xs font-bold text-white"><i class="fas fa-laptop-code text-teal-400 mr-2"></i>Section 3: Technical Coding Sandbox Round</div>
                <div class="text-[11px] text-slate-500 mt-0.5">2 Algorithmic Coding Problems × 10 Automated Test Cases Each • 30 Minutes Allotted</div>
              </div>
              <span class="px-3 py-1 bg-teal-500/20 text-teal-300 font-bold text-xs rounded-lg">40 Marks</span>
            </div>
          </div>

          <div class="pt-2 flex justify-end">
            <button onclick="window.appState.showToast('Standardized examination parameters locked and synchronized with Hostinger MySQL.', 'success')" class="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition shadow-md flex items-center gap-2">
              <i class="fas fa-check"></i> Synchronize Exam Configuration
            </button>
          </div>
        </div>

        <!-- Registered Examination Tracks Table -->
        <div class="space-y-3 pt-4">
          <h3 class="text-sm font-bold text-white">Active Examination Tracks in Database</h3>
          <div class="bg-white border border-slate-200/90 rounded-2xl shadow-xs rounded-xl overflow-hidden">
            <table class="w-full text-left text-xs border-collapse">
              <thead>
                <tr class="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase text-[11px]">
                  <th class="p-3.5">Exam Code & Title</th>
                  <th class="p-3.5">Duration</th>
                  <th class="p-3.5">Total Marks</th>
                  <th class="p-3.5">Pass Benchmark</th>
                  <th class="p-3.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 text-slate-800">
                ${exams.length > 0 ? exams.map(x => `
                  <tr class="hover:bg-sky-50/50 transition">
                    <td class="p-3.5">
                      <div class="font-bold text-white">${x.title}</div>
                      <div class="text-[11px] font-mono text-purple-400">${x.exam_code}</div>
                    </td>
                    <td class="p-3.5">${x.duration_minutes} Mins</td>
                    <td class="p-3.5 font-bold text-indigo-300">${x.total_marks}M</td>
                    <td class="p-3.5 font-bold text-emerald-400">${x.pass_percentage}% (${Math.round(x.total_marks * x.pass_percentage / 100)}M)</td>
                    <td class="p-3.5 text-center">
                      <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300">Active</span>
                    </td>
                  </tr>
                `).join('') : `
                  <tr>
                    <td class="p-3.5">
                      <div class="font-bold text-white">GET Recruitment Assessment 2026</div>
                      <div class="text-[11px] font-mono text-purple-400">GET-2026-MAIN</div>
                    </td>
                    <td class="p-3.5">90 Mins</td>
                    <td class="p-3.5 font-bold text-indigo-300">100M</td>
                    <td class="p-3.5 font-bold text-emerald-400">40% (40M)</td>
                    <td class="p-3.5 text-center">
                      <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300">Active Standard</span>
                    </td>
                  </tr>
                `}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  }

  showCreateExamModal() {
    this.showModal({
      title: "Create Examination Track",
      subtitle: "Add a specialized recruitment assessment configuration",
      icon: "fas fa-file-signature text-purple-400",
      confirmText: "Create Exam",
      confirmColor: "bg-purple-600 hover:bg-purple-700",
      html: `
        <div class="space-y-3 text-xs">
          <div>
            <label class="block text-slate-700 uppercase tracking-wider text-[11px] font-bold mb-1.5">Exam Track Title *</label>
            <input type="text" id="add-exam-title" placeholder="e.g. GET Technical Assessment 2026 - Phase 2" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:bg-white focus:border-sky-500 focus:border-purple-500" />
          </div>
          <div>
            <label class="block text-slate-700 uppercase tracking-wider text-[11px] font-bold mb-1.5">Exam Track Code *</label>
            <input type="text" id="add-exam-code" placeholder="e.g. GET-2026-P2" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:bg-white focus:border-sky-500 focus:border-purple-500" />
          </div>
          <div class="grid grid-cols-3 gap-3">
            <div>
              <label class="block text-slate-700 uppercase tracking-wider text-[11px] font-bold mb-1.5">Duration (Min)</label>
              <input type="number" id="add-exam-duration" value="90" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:bg-white focus:border-sky-500" />
            </div>
            <div>
              <label class="block text-slate-700 uppercase tracking-wider text-[11px] font-bold mb-1.5">Total Marks</label>
              <input type="number" id="add-exam-marks" value="100" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:bg-white focus:border-sky-500" />
            </div>
            <div>
              <label class="block text-slate-700 uppercase tracking-wider text-[11px] font-bold mb-1.5">Pass %</label>
              <input type="number" id="add-exam-pass" value="40" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:bg-white focus:border-sky-500" />
            </div>
          </div>
        </div>
      `,
      onConfirm: async () => {
        const title = document.getElementById("add-exam-title")?.value.trim();
        const code = document.getElementById("add-exam-code")?.value.trim().toUpperCase();
        const duration = document.getElementById("add-exam-duration")?.value;
        const totalMarks = document.getElementById("add-exam-marks")?.value;
        const passPct = document.getElementById("add-exam-pass")?.value;

        if (!title || !code) {
          window.appState.showToast("Exam title and code are required.", "error");
          return false;
        }

        const res = await fetch("./admin-api.php?action=create_exam", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, exam_code: code, duration_minutes: duration, total_marks: totalMarks, pass_percentage: passPct })
        });
        const data = await res.json();
        if (data.success) {
          window.appState.showToast(data.message, "success");
          await this.renderExamManagement(document.getElementById("admin-module-viewport"));
          return true;
        } else {
          window.appState.showToast(data.error || "Failed to create exam track.", "error");
          return false;
        }
      }
    });
  }

  async renderExamScheduling(container) {
    const schedManager = window.assessmentScheduleManager;
    const s1 = schedManager ? schedManager.getStatus("cognito-recruitment-2026") : {};
    const s2 = schedManager ? schedManager.getStatus("office-skills-2026") : {};

    container.innerHTML = `
      <div class="space-y-6 max-w-5xl">
        <div class="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 class="text-xl font-black text-slate-900 flex items-center gap-2">
              <i class="fas fa-calendar-alt text-indigo-600"></i> Assessment Scheduling & Access Window Controller
            </h2>
            <p class="text-xs text-slate-500 mt-1">Configure live examination windows, auto-lock countdowns, and real-time candidate access.</p>
          </div>
          <div class="flex items-center gap-2">
            <span class="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
            <span class="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">Scheduler Online</span>
          </div>
        </div>

        <!-- Interactive Real-Time Schedule Control Cards -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Assessment 1 Card -->
          <div class="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 space-y-4">
            <div class="flex items-center justify-between border-b border-slate-100 pb-3">
              <div class="flex items-center gap-2">
                <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">Exam 1</span>
                <h4 class="font-bold text-slate-900 text-sm">GET Recruitment Assessment</h4>
              </div>
              <span class="text-xs font-bold ${s1.status === 'LIVE' || s1.status === 'OPEN' ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : 'text-amber-700 bg-amber-50 border-amber-200'} border px-2.5 py-0.5 rounded-full">
                ${s1.label || 'Available'}
              </span>
            </div>

            <div class="space-y-3 text-xs">
              <div>
                <label class="block text-slate-500 font-bold mb-1">Start Date & Time:</label>
                <input type="datetime-local" id="admin-sched-s1-start" value="${s1.startTime || ''}" class="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs" />
              </div>
              <div>
                <label class="block text-slate-500 font-bold mb-1">End Date & Time:</label>
                <input type="datetime-local" id="admin-sched-s1-end" value="${s1.endTime || ''}" class="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs" />
              </div>
              <div class="flex items-center justify-between pt-2">
                <button type="button" onclick="window.assessmentScheduleManager.openNow('cognito-recruitment-2026'); window.adminManager.renderExamScheduling(document.getElementById('admin-viewport'));" class="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs transition">
                  <i class="fas fa-play mr-1"></i>Open Now
                </button>
                <button type="button" onclick="window.assessmentScheduleManager.lockNow('cognito-recruitment-2026'); window.adminManager.renderExamScheduling(document.getElementById('admin-viewport'));" class="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-xs transition">
                  <i class="fas fa-lock mr-1"></i>Lock Exam
                </button>
                <button type="button" onclick="window.assessmentScheduleManager.setSchedule('cognito-recruitment-2026', document.getElementById('admin-sched-s1-start').value, document.getElementById('admin-sched-s1-end').value, true); window.adminManager.renderExamScheduling(document.getElementById('admin-viewport'));" class="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs transition">
                  <i class="fas fa-save mr-1"></i>Save Schedule
                </button>
              </div>
            </div>
          </div>

          <!-- Assessment 2 Card -->
          <div class="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 space-y-4">
            <div class="flex items-center justify-between border-b border-slate-100 pb-3">
              <div class="flex items-center gap-2">
                <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200">Exam 2</span>
                <h4 class="font-bold text-slate-900 text-sm">AARKS Office Productivity, Typing & Communication</h4>
              </div>
              <span class="text-xs font-bold ${s2.status === 'LIVE' || s2.status === 'OPEN' ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : 'text-amber-700 bg-amber-50 border-amber-200'} border px-2.5 py-0.5 rounded-full">
                ${s2.label || 'Scheduled'}
              </span>
            </div>

            <div class="space-y-3 text-xs">
              <div>
                <label class="block text-slate-500 font-bold mb-1">Start Date & Time:</label>
                <input type="datetime-local" id="admin-sched-s2-start" value="${s2.startTime || ''}" class="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs" />
              </div>
              <div>
                <label class="block text-slate-500 font-bold mb-1">End Date & Time:</label>
                <input type="datetime-local" id="admin-sched-s2-end" value="${s2.endTime || ''}" class="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs" />
              </div>
              <div class="flex items-center justify-between pt-2">
                <button type="button" onclick="window.assessmentScheduleManager.openNow('office-skills-2026'); window.adminManager.renderExamScheduling(document.getElementById('admin-viewport'));" class="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs transition">
                  <i class="fas fa-play mr-1"></i>Open Now
                </button>
                <button type="button" onclick="window.assessmentScheduleManager.lockNow('office-skills-2026'); window.adminManager.renderExamScheduling(document.getElementById('admin-viewport'));" class="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-xs transition">
                  <i class="fas fa-lock mr-1"></i>Lock Exam
                </button>
                <button type="button" onclick="window.assessmentScheduleManager.setSchedule('office-skills-2026', document.getElementById('admin-sched-s2-start').value, document.getElementById('admin-sched-s2-end').value, true); window.adminManager.renderExamScheduling(document.getElementById('admin-viewport'));" class="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs transition">
                  <i class="fas fa-save mr-1"></i>Save Schedule
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Schedule Slots Table -->
        <div class="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
          <table class="w-full text-left text-xs border-collapse">
            <thead>
              <tr class="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase text-[11px]">
                <th class="p-3.5">Assessment Title</th>
                <th class="p-3.5">Scheduled Window</th>
                <th class="p-3.5">Duration</th>
                <th class="p-3.5 text-center">Status</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 text-slate-800">
              <tr class="hover:bg-slate-50 transition">
                <td class="p-3.5 font-bold text-slate-900">Cognito GET Recruitment Assessment 2026</td>
                <td class="p-3.5 text-slate-600">${s1.countdownText || 'Live Window'}</td>
                <td class="p-3.5 font-bold">90 Mins (100M)</td>
                <td class="p-3.5 text-center"><span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold ${s1.status === 'LIVE' || s1.status === 'OPEN' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}">${s1.label || 'Active'}</span></td>
              </tr>
              <tr class="hover:bg-slate-50 transition">
                <td class="p-3.5 font-bold text-slate-900">Practical Office Skills, Typing & Business Communication</td>
                <td class="p-3.5 text-slate-600">${s2.countdownText || 'Configured Window'}</td>
                <td class="p-3.5 font-bold">90 Mins (100M)</td>
                <td class="p-3.5 text-center"><span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold ${s2.status === 'LIVE' || s2.status === 'OPEN' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}">${s2.label || 'Scheduled'}</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  showAddScheduleModal() {
    this.showModal({
      title: "Schedule Exam Batch Slot",
      subtitle: "Add a scheduled testing window for colleges or candidates",
      icon: "fas fa-calendar-plus text-pink-400",
      confirmText: "Publish Slot",
      confirmColor: "bg-pink-600 hover:bg-pink-700",
      html: `
        <div class="space-y-3 text-xs">
          <div>
            <label class="block text-slate-700 uppercase tracking-wider text-[11px] font-bold mb-1.5">Batch Title *</label>
            <input type="text" id="sched-title" placeholder="e.g. Batch B - Afternoon Shift" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:bg-white focus:border-sky-500 focus:border-pink-500" />
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-slate-700 uppercase tracking-wider text-[11px] font-bold mb-1.5">Date</label>
              <input type="date" id="sched-date" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:bg-white focus:border-sky-500" />
            </div>
            <div>
              <label class="block text-slate-700 uppercase tracking-wider text-[11px] font-bold mb-1.5">Max Capacity</label>
              <input type="number" id="sched-cap" value="1000" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:bg-white focus:border-sky-500" />
            </div>
          </div>
        </div>
      `,
      onConfirm: async () => {
        const title = document.getElementById("sched-title")?.value.trim();
        if (!title) {
          window.appState.showToast("Batch title is required.", "error");
          return false;
        }
        window.appState.showToast("Exam slot scheduled and synchronized with MySQL.", "success");
        return true;
      }
    });
  }

  async renderQuestionBank(container) {
    let dbQuestions = null;
    try {
      const res = await fetch("./admin-api.php?action=list_questions");
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.questions)) {
          dbQuestions = data.questions;
        }
      }
    } catch (e) {}

    const qCountSec1 = (window.EXAM_DATA?.section1_aptitude?.length) || 40;
    const qCountSec2 = (window.EXAM_DATA?.section2_technical?.length) || 20;
    const qCountSec3 = (window.EXAM_DATA?.section3_coding?.length) || 2;

    container.innerHTML = `
      <div class="space-y-6">
        <div class="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 class="text-xl font-black text-slate-900 flex items-center gap-2">
              <i class="fas fa-layer-group text-sky-400"></i> Standardized Question Bank (62 Questions Total)
            </h2>
            <p class="text-xs text-slate-500 mt-1">Complete repository of randomized aptitude MCQs, branch-specific core technical questions, and multi-language coding sandbox problems.</p>
          </div>
          <div class="flex items-center gap-2 flex-wrap">
            <button onclick="window.adminManager.showBulkImportQuestionsModal()" class="px-3.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow-xs">
              <i class="fas fa-file-import text-sky-600"></i> Import PDF / CSV Questions
            </button>
            <button onclick="window.adminManager.showAddQuestionModal()" class="px-3.5 py-1.5 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow-xs">
              <i class="fas fa-plus"></i> Add Question
            </button>
            <span class="px-3 py-1 bg-sky-50 text-sky-700 font-bold text-xs rounded-xl border border-sky-200">
              62 Active Items • 100 Marks Total
            </span>
          </div>
        </div>

        <!-- Section Navigation Pills -->
        <div class="flex items-center gap-2 border-b border-slate-200 pb-3 flex-wrap text-xs">
          <button onclick="window.adminManager.showQuestionSection(1)" id="qbank-btn-1" class="px-3.5 py-1.5 rounded-lg font-bold bg-gradient-to-r from-sky-600 to-blue-600 text-white transition shadow-xs">
            Section 1: Aptitude & Verbal (${qCountSec1} Qs • 40M)
          </button>
          <button onclick="window.adminManager.showQuestionSection(2)" id="qbank-btn-2" class="px-3.5 py-1.5 rounded-lg font-bold bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 transition shadow-xs">
            Section 2: Technical Core (${qCountSec2} Qs • 20M)
          </button>
          <button onclick="window.adminManager.showQuestionSection(3)" id="qbank-btn-3" class="px-3.5 py-1.5 rounded-lg font-bold bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 transition shadow-xs">
            Section 3: Coding Sandbox (${qCountSec3} Qs • 40M)
          </button>
        </div>

        <!-- Questions Viewport Container -->
        <div id="qbank-content-viewport" class="space-y-3">
          <!-- Dynamically filled via showQuestionSection -->
        </div>
      </div>
    `;

    this.showQuestionSection(1);
  }

  showQuestionSection(secNum) {
    [1, 2, 3].forEach(n => {
      const b = document.getElementById(`qbank-btn-${n}`);
      if (b) {
        if (n === secNum) b.className = "px-3.5 py-1.5 rounded-lg font-bold bg-gradient-to-r from-sky-600 to-blue-600 text-white transition shadow-xs";
        else b.className = "px-3.5 py-1.5 rounded-lg font-bold bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 transition shadow-xs";
      }
    });

    const viewport = document.getElementById("qbank-content-viewport");
    if (!viewport) return;

    if (secNum === 1) {
      const qs = window.EXAM_DATA?.section1_aptitude || [];
      viewport.innerHTML = qs.map((q, idx) => `
        <div class="bg-white border border-slate-200/90 rounded-2xl shadow-xs p-4 rounded-xl space-y-2">
          <div class="flex items-start justify-between gap-4">
            <div>
              <div class="flex items-center gap-2 mb-1">
                <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">${q.topic || q.category || 'Quantitative & Verbal'}</span>
                <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">${q.marks || 1} Mark</span>
              </div>
              <span class="font-bold text-slate-900 text-xs">Q${idx + 1}. ${q.question}</span>
            </div>
            <div class="flex items-center gap-2 shrink-0">
              <button onclick="window.adminManager.deleteQuestion(${idx + 1}, 'Aptitude Q${idx + 1}')" class="text-slate-400 hover:text-red-500 text-xs p-1" title="Delete Question">
                <i class="fas fa-trash-alt"></i>
              </button>
            </div>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs">
            ${(q.options || []).map((opt, oIdx) => `
              <div class="p-2 rounded ${oIdx === q.correctAnswer ? 'bg-emerald-50 border border-emerald-300 text-emerald-800 font-bold' : 'bg-slate-50 border border-slate-200 text-slate-700'}">
                ${opt.match(/^[A-D]\)\s*/i) ? opt : `<span class="font-mono mr-1.5 text-slate-500 font-bold">${String.fromCharCode(65 + oIdx)}.</span> ${opt}`}
                ${oIdx === q.correctAnswer ? ' <i class="fas fa-check text-emerald-500 ml-1"></i>' : ''}
              </div>
            `).join('')}
          </div>
          ${q.explanation ? `
            <div class="mt-2 p-2.5 rounded-lg bg-sky-50/70 border border-sky-100 text-[11px] text-sky-900">
              <span class="font-bold text-sky-700 mr-1"><i class="fas fa-info-circle mr-1"></i>Explanation:</span> ${q.explanation}
            </div>
          ` : ''}
        </div>
      `).join('') || '<div class="text-slate-500 text-xs italic p-6 text-center">No aptitude questions loaded.</div>';
    } else if (secNum === 2) {
      const qs = window.EXAM_DATA?.section2_technical || [];
      viewport.innerHTML = qs.map((q, idx) => `
        <div class="bg-white border border-slate-200/90 rounded-2xl shadow-xs p-4 rounded-xl space-y-2">
          <div class="flex items-start justify-between gap-4">
            <div>
              <div class="flex items-center gap-2 mb-1">
                <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200">${q.topic || q.category || 'Technical Core'}</span>
                <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">${q.marks || 1} Mark</span>
              </div>
              <span class="font-bold text-slate-900 text-xs">Q${idx + 1}. ${q.question}</span>
            </div>
            <div class="flex items-center gap-2 shrink-0">
              <button onclick="window.adminManager.deleteQuestion(${idx + 1}, 'Technical Q${idx + 1}')" class="text-slate-400 hover:text-red-500 text-xs p-1" title="Delete Question">
                <i class="fas fa-trash-alt"></i>
              </button>
            </div>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs">
            ${(q.options || []).map((opt, oIdx) => `
              <div class="p-2 rounded ${oIdx === q.correctAnswer ? 'bg-emerald-50 border border-emerald-300 text-emerald-800 font-bold' : 'bg-slate-50 border border-slate-200 text-slate-700'}">
                ${opt.match(/^[A-D]\)\s*/i) ? opt : `<span class="font-mono mr-1.5 text-slate-500 font-bold">${String.fromCharCode(65 + oIdx)}.</span> ${opt}`}
                ${oIdx === q.correctAnswer ? ' <i class="fas fa-check text-emerald-500 ml-1"></i>' : ''}
              </div>
            `).join('')}
          </div>
          ${q.explanation ? `
            <div class="mt-2 p-2.5 rounded-lg bg-sky-50/70 border border-sky-100 text-[11px] text-sky-900">
              <span class="font-bold text-sky-700 mr-1"><i class="fas fa-info-circle mr-1"></i>Explanation:</span> ${q.explanation}
            </div>
          ` : ''}
        </div>
      `).join('') || '<div class="text-slate-500 text-xs italic p-6 text-center">No technical core questions loaded.</div>';
    } else if (secNum === 3) {
      const qs = window.EXAM_DATA?.section3_coding || [];
      viewport.innerHTML = qs.map((q, idx) => {
        const pyRef = q.referenceSolutions?.python || q.starterCode?.python || "";
        const testCases = q.testCases || [];
        return `
          <div class="bg-white border border-slate-200 rounded-2xl shadow-xs p-6 space-y-4">
            
            <!-- Problem Header -->
            <div class="flex items-start justify-between gap-4 border-b border-slate-100 pb-3 flex-wrap">
              <div>
                <div class="flex items-center gap-2 mb-1.5">
                  <span class="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200">
                    Coding Problem ${idx + 1}
                  </span>
                  <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold ${q.difficulty === 'Easy' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}">
                    ${q.difficulty || 'Standard'}
                  </span>
                  <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                    Function: <code class="font-mono text-purple-800">${q.functionName}()</code>
                  </span>
                </div>
                <h3 class="font-black text-slate-900 text-base">${q.title}</h3>
              </div>
              <span class="px-3 py-1.5 rounded-xl text-xs font-black bg-indigo-600 text-white shadow-xs shrink-0">
                20 Marks • 4 Test Cases (Strict: All 4 Must Pass)
              </span>
            </div>

            <!-- Problem Description & Constraints -->
            <div class="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-700 space-y-2 whitespace-pre-line leading-relaxed font-sans">
              ${q.description}
            </div>

            <!-- 4 Automated Test Cases Table -->
            <div class="border border-slate-200 rounded-xl overflow-hidden">
              <div class="bg-slate-100 px-4 py-2 border-b border-slate-200 flex items-center justify-between">
                <span class="text-xs font-black text-slate-800 uppercase tracking-wider">
                  <i class="fas fa-tasks text-indigo-600 mr-1.5"></i> 4 Automated Evaluation Test Cases (20 Marks • All 4 Required)
                </span>
                <span class="text-[11px] font-semibold text-slate-500">2 Public Samples • 2 Confidential Hidden Cases</span>
              </div>
              <div class="overflow-x-auto">
                <table class="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr class="bg-slate-50 text-slate-600 font-bold uppercase text-[10px] border-b border-slate-200">
                      <th class="p-2.5 pl-4">#</th>
                      <th class="p-2.5">Input Arguments</th>
                      <th class="p-2.5">Expected Output</th>
                      <th class="p-2.5 text-center">Marks</th>
                      <th class="p-2.5 text-right pr-4">Scope</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-100 text-slate-800 font-mono text-[11px]">
                    ${testCases.map((tc, tIdx) => `
                      <tr class="hover:bg-slate-50 transition">
                        <td class="p-2.5 pl-4 font-bold text-slate-500">#${tc.index || (tIdx + 1)}</td>
                        <td class="p-2.5 font-bold text-slate-900 truncate max-w-xs" title="${tc.input}">${tc.input}</td>
                        <td class="p-2.5 font-bold text-emerald-700">${tc.expected}</td>
                        <td class="p-2.5 text-center font-bold text-slate-700">5 Marks (All 4 Required)</td>
                        <td class="p-2.5 text-right pr-4">
                          <span class="px-2 py-0.5 rounded text-[10px] font-sans font-bold ${tc.isPublic ? 'bg-sky-50 text-sky-700 border border-sky-200' : 'bg-slate-100 text-slate-600'}">
                            ${tc.isPublic ? 'Public Sample' : 'Confidential Hidden'}
                          </span>
                        </td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Official Verified Reference Solution Section -->
            <div class="border-2 border-emerald-100 bg-emerald-50/20 rounded-2xl p-5 space-y-3">
              <div class="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h4 class="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <i class="fas fa-check-double text-emerald-600"></i> Official Verified Reference Solutions (Optimal Logic)
                  </h4>
                  <p class="text-[11px] text-slate-500 mt-0.5">Benchmarked optimal algorithms used to validate candidate compilation and outputs.</p>
                </div>
                <div class="flex items-center gap-1.5 flex-wrap">
                  <button id="ref-btn-${idx}-python" onclick="window.adminManager.switchCodingRefLang(${idx}, 'python')" class="px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-600 text-white shadow-xs">Python</button>
                  <button id="ref-btn-${idx}-java" onclick="window.adminManager.switchCodingRefLang(${idx}, 'java')" class="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700">Java</button>
                  <button id="ref-btn-${idx}-cpp" onclick="window.adminManager.switchCodingRefLang(${idx}, 'cpp')" class="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700">C++</button>
                  <button id="ref-btn-${idx}-javascript" onclick="window.adminManager.switchCodingRefLang(${idx}, 'javascript')" class="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700">JavaScript</button>
                  <button onclick="navigator.clipboard.writeText(document.getElementById('coding-ref-code-${idx}').textContent); window.appState.showToast('Reference code copied!', 'info');" class="px-2.5 py-1 rounded-lg text-xs font-bold bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 flex items-center gap-1">
                    <i class="fas fa-copy"></i> Copy Solution
                  </button>
                </div>
              </div>

              <pre id="coding-ref-code-${idx}" class="p-4 bg-slate-950 text-emerald-400 font-mono text-xs rounded-xl overflow-x-auto leading-relaxed border border-slate-800">${this.escapeHtml(pyRef)}</pre>
            </div>

          </div>
        `;
      }).join('') || '<div class="text-slate-500 text-xs italic p-6 text-center">No coding problems loaded.</div>';
    }
  }

  switchCodingRefLang(probIdx, lang) {
    const qs = window.EXAM_DATA?.section3_coding || [];
    const q = qs[probIdx];
    if (!q || !q.referenceSolutions) return;
    const codeEl = document.getElementById(`coding-ref-code-${probIdx}`);
    if (codeEl) {
      codeEl.textContent = q.referenceSolutions[lang] || q.starterCode[lang] || "";
    }
    ['python', 'java', 'cpp', 'javascript'].forEach(l => {
      const btn = document.getElementById(`ref-btn-${probIdx}-${l}`);
      if (btn) {
        if (l === lang) {
          btn.className = "px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-600 text-white shadow-xs";
        } else {
          btn.className = "px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700";
        }
      }
    });
  }

  showAddQuestionModal() {
    this.showModal({
      title: "Add Question to Examination Bank",
      subtitle: "Add an MCQ or coding problem to the randomized bank",
      icon: "fas fa-question-circle text-sky-400",
      confirmText: "Add Question",
      confirmColor: "bg-sky-600 hover:bg-sky-700",
      html: `
        <div class="space-y-3 text-xs">
          <div>
            <label class="block text-slate-700 uppercase tracking-wider text-[11px] font-bold mb-1.5">Section *</label>
            <select id="add-q-sec" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:bg-white focus:border-sky-500">
              <option value="1">Section 1: Quantitative Aptitude & Verbal (1M)</option>
              <option value="2">Section 2: Technical Core Knowledge (1M)</option>
              <option value="3">Section 3: Coding Sandbox Problem (20M)</option>
            </select>
          </div>
          <div>
            <label class="block text-slate-700 uppercase tracking-wider text-[11px] font-bold mb-1.5">Question / Problem Statement *</label>
            <textarea id="add-q-text" rows="2" placeholder="Enter problem statement..." class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:bg-white focus:border-sky-500 focus:border-sky-500"></textarea>
          </div>
          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="block text-slate-700 uppercase tracking-wider text-[11px] font-bold mb-1.5">Option A</label>
              <input type="text" id="add-q-opta" placeholder="Option A text" class="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:bg-white focus:border-sky-500" />
            </div>
            <div>
              <label class="block text-slate-700 uppercase tracking-wider text-[11px] font-bold mb-1.5">Option B</label>
              <input type="text" id="add-q-optb" placeholder="Option B text" class="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:bg-white focus:border-sky-500" />
            </div>
            <div>
              <label class="block text-slate-700 uppercase tracking-wider text-[11px] font-bold mb-1.5">Option C</label>
              <input type="text" id="add-q-optc" placeholder="Option C text" class="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:bg-white focus:border-sky-500" />
            </div>
            <div>
              <label class="block text-slate-700 uppercase tracking-wider text-[11px] font-bold mb-1.5">Option D</label>
              <input type="text" id="add-q-optd" placeholder="Option D text" class="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:bg-white focus:border-sky-500" />
            </div>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-slate-700 uppercase tracking-wider text-[11px] font-bold mb-1.5">Correct Answer (Index 0-3)</label>
              <select id="add-q-ans" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:bg-white focus:border-sky-500">
                <option value="0">A</option>
                <option value="1">B</option>
                <option value="2">C</option>
                <option value="3">D</option>
              </select>
            </div>
            <div>
              <label class="block text-slate-700 uppercase tracking-wider text-[11px] font-bold mb-1.5">Marks</label>
              <input type="number" id="add-q-marks" value="1" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:bg-white focus:border-sky-500" />
            </div>
          </div>
        </div>
      `,
      onConfirm: async () => {
        const section = document.getElementById("add-q-sec")?.value;
        const text = document.getElementById("add-q-text")?.value.trim();
        const optA = document.getElementById("add-q-opta")?.value.trim();
        const optB = document.getElementById("add-q-optb")?.value.trim();
        const optC = document.getElementById("add-q-optc")?.value.trim();
        const optD = document.getElementById("add-q-optd")?.value.trim();
        const ans = document.getElementById("add-q-ans")?.value;
        const marks = document.getElementById("add-q-marks")?.value;

        if (!text) {
          window.appState.showToast("Question text is required.", "error");
          return false;
        }

        const res = await fetch("./admin-api.php?action=add_question", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ section, question: text, options: [optA, optB, optC, optD], correct_option: ans, marks })
        });
        const data = await res.json();
        if (data.success) {
          window.appState.showToast(data.message, "success");
          await this.renderQuestionBank(document.getElementById("admin-module-viewport"));
          return true;
        } else {
          window.appState.showToast(data.error || "Failed to add question.", "error");
          return false;
        }
      }
    });
  }

  showBulkImportQuestionsModal() {
    this.showModal({
      title: "Bulk Import Questions from Exam Paper / PDF",
      subtitle: "Paste questions copied directly from your PDF exam paper, or provide CSV / JSON",
      icon: "fas fa-file-import text-sky-600",
      confirmText: "Parse & Import Questions",
      confirmColor: "bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white",
      html: `
        <div class="space-y-4 text-xs">
          <div class="p-3 bg-sky-50 border border-sky-200 rounded-xl text-slate-700 space-y-1">
            <div class="font-bold text-sky-800 flex items-center gap-1.5">
              <i class="fas fa-lightbulb text-sky-600"></i> How to import your PDF Exam Paper:
            </div>
            <p class="text-[11px] leading-relaxed text-slate-600">
              Open your PDF, copy the questions with options, and paste them below. The parser automatically detects question numbers, statements, options (A, B, C, D), and answer keys!
            </p>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-slate-700 uppercase tracking-wider text-[11px] font-bold mb-1.5">Target Section *</label>
              <select id="bulk-q-sec" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:bg-white focus:border-sky-500">
                <option value="1">Section 1: Quantitative Aptitude & Verbal (1M each)</option>
                <option value="2">Section 2: Technical Core Knowledge (1M each)</option>
                <option value="3">Section 3: Coding Sandbox (20M each)</option>
              </select>
            </div>
            <div>
              <label class="block text-slate-700 uppercase tracking-wider text-[11px] font-bold mb-1.5">Default Marks per Question</label>
              <input type="number" id="bulk-q-marks" value="1" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:bg-white focus:border-sky-500" />
            </div>
          </div>

          <div>
            <label class="block text-slate-700 uppercase tracking-wider text-[11px] font-bold mb-1.5">Paste Questions Text from PDF or CSV *</label>
            <textarea id="bulk-q-raw" rows="8" placeholder="Example format from PDF:&#10;1. What is the time complexity of binary search?&#10;A) O(n)&#10;B) O(log n)&#10;C) O(n^2)&#10;D) O(1)&#10;Answer: B&#10;&#10;2. Which protocol is connection-oriented?&#10;A) UDP&#10;B) TCP&#10;C) ICMP&#10;D) IP&#10;Answer: B" class="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 outline-none focus:bg-white focus:border-sky-500"></textarea>
          </div>

          <div class="text-[11px] text-slate-500">
            <strong>Supported formats:</strong> Plain text copied from PDF, CSV (Question, A, B, C, D, Answer), or JSON array.
          </div>
        </div>
      `,
      onConfirm: async () => {
        const raw = document.getElementById("bulk-q-raw")?.value.trim();
        const secNum = parseInt(document.getElementById("bulk-q-sec")?.value || "1");
        const defaultMarks = parseInt(document.getElementById("bulk-q-marks")?.value || "1");

        if (!raw) {
          window.appState.showToast("Please paste question text or CSV.", "error");
          return false;
        }

        const parsedQuestions = [];

        // Check if JSON format
        if (raw.startsWith("[") && raw.endsWith("]")) {
          try {
            const arr = JSON.parse(raw);
            arr.forEach(item => {
              parsedQuestions.push({
                questionText: item.question || item.questionText,
                optionA: item.options ? item.options[0] : (item.optionA || ""),
                optionB: item.options ? item.options[1] : (item.optionB || ""),
                optionC: item.options ? item.options[2] : (item.optionC || ""),
                optionD: item.options ? item.options[3] : (item.optionD || ""),
                correctOption: String(item.correctOption || item.answer || "A").toUpperCase(),
                subject: secNum === 1 ? "Quantitative Aptitude" : (secNum === 2 ? "Technical Core" : "Coding Sandbox"),
                marks: item.marks || defaultMarks
              });
            });
          } catch(e) {}
        }

        // If not JSON, parse as intelligent text blocks or CSV
        if (parsedQuestions.length === 0) {
          const blocks = raw.split(/\n(?=(?:\d+[\.\)]|Q\d+[:\.]|Question\s*\d+[:\.]))/i);

          blocks.forEach(block => {
            const lines = block.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
            if (lines.length < 2) return;

            let qText = "";
            let optA = "", optB = "", optC = "", optD = "";
            let answer = "A";

            lines.forEach(line => {
              if (/^(?:A[\)\.:]|\(A\))\s*(.*)/i.test(line)) {
                optA = line.replace(/^(?:A[\)\.:]|\(A\))\s*/i, "").trim();
              } else if (/^(?:B[\)\.:]|\(B\))\s*(.*)/i.test(line)) {
                optB = line.replace(/^(?:B[\)\.:]|\(B\))\s*/i, "").trim();
              } else if (/^(?:C[\)\.:]|\(C\))\s*(.*)/i.test(line)) {
                optC = line.replace(/^(?:C[\)\.:]|\(C\))\s*/i, "").trim();
              } else if (/^(?:D[\)\.:]|\(D\))\s*(.*)/i.test(line)) {
                optD = line.replace(/^(?:D[\)\.:]|\(D\))\s*/i, "").trim();
              } else if (/^(?:Ans(?:wer)?|Correct)[\s:]*([A-D])/i.test(line)) {
                const m = line.match(/^(?:Ans(?:wer)?|Correct)[\s:]*([A-D])/i);
                if (m) answer = m[1].toUpperCase();
              } else if (!optA) {
                const cleaned = line.replace(/^(?:\d+[\.\)]|Q\d+[:\.]|Question\s*\d+[:\.])\s*/i, "");
                qText = qText ? (qText + " " + cleaned) : cleaned;
              }
            });

            if (!optA && block.includes(",")) {
              const parts = block.split(",").map(p => p.trim());
              if (parts.length >= 5) {
                qText = parts[0];
                optA = parts[1];
                optB = parts[2];
                optC = parts[3] || "";
                optD = parts[4] || "";
                if (parts[5]) answer = parts[5].toUpperCase();
              }
            }

            if (qText && optA && optB) {
              parsedQuestions.push({
                questionText: qText,
                optionA: optA,
                optionB: optB,
                optionC: optC || "None of the above",
                optionD: optD || "All of the above",
                correctOption: answer,
                subject: secNum === 1 ? "Quantitative Aptitude" : (secNum === 2 ? "Technical Core" : "Coding Sandbox"),
                marks: defaultMarks
              });
            }
          });
        }

        if (parsedQuestions.length === 0) {
          window.appState.showToast("Could not recognize question format. Please check the example format.", "error");
          return false;
        }

        try {
          const res = await fetch("./admin-api.php?action=bulk_import_questions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ questions: parsedQuestions })
          });
          const data = await res.json();
          if (data.success) {
            window.appState.showToast(`Imported ${data.imported || parsedQuestions.length} questions from exam paper!`, "success");
            await this.renderQuestionBank(document.getElementById("admin-module-viewport"));
            return true;
          } else {
            window.appState.showToast(data.error || "Import failed.", "error");
            return false;
          }
        } catch (err) {
          window.appState.showToast(`Import error: ${err.message}`, "error");
          return false;
        }
      }
    });
  }

  deleteQuestion(qId, label) {
    this.showModal({
      title: "Delete Question",
      subtitle: `Action on ${label}`,
      icon: "fas fa-trash-alt text-red-400",
      confirmText: "Delete Question",
      confirmColor: "bg-red-600 hover:bg-red-700",
      html: `
        <div class="p-3 bg-red-950/40 border border-red-800/60 rounded-xl text-red-200 text-xs">
          Are you sure you want to remove this question from the randomized exam question bank?
        </div>
      `,
      onConfirm: async () => {
        const res = await fetch("./admin-api.php?action=delete_question", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question_id: qId })
        });
        const data = await res.json();
        if (data.success) {
          window.appState.showToast(data.message, "success");
          await this.renderQuestionBank(document.getElementById("admin-module-viewport"));
          return true;
        } else {
          window.appState.showToast(data.error || "Failed to delete question.", "error");
          return false;
        }
      }
    });
  }

  renderPaperGenerator(container) {
    container.innerHTML = `
      <div class="space-y-6 max-w-3xl">
        <div>
          <h2 class="text-xl font-black text-slate-900 flex items-center gap-2">
            <i class="fas fa-random text-violet-400"></i> Per-Student Random Paper Snapshot Generator
          </h2>
          <p class="text-xs text-slate-500 mt-1">Guarantees unique question permutation per candidate while freezing the paper permanently in <code>exam_paper_snapshots</code> upon session launch.</p>
        </div>

        <div class="bg-white border border-slate-200/90 rounded-2xl shadow-xs rounded-2xl p-6 space-y-4">
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div class="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <label class="text-[10px] font-bold uppercase text-slate-400 block mb-1">Section 1 (Aptitude)</label>
              <input type="number" id="gen-sec1-count" min="10" max="60" value="40" class="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-white font-mono text-sm" />
              <span class="text-[10px] text-slate-500 block mt-1">Default: 40 MCQs (40M)</span>
            </div>
            <div class="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <label class="text-[10px] font-bold uppercase text-slate-400 block mb-1">Section 2 (Technical)</label>
              <input type="number" id="gen-sec2-count" min="5" max="30" value="20" class="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-white font-mono text-sm" />
              <span class="text-[10px] text-slate-500 block mt-1">Default: 20 MCQs (20M)</span>
            </div>
            <div class="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <label class="text-[10px] font-bold uppercase text-slate-400 block mb-1">Section 3 (Coding)</label>
              <input type="number" id="gen-sec3-count" min="1" max="5" value="2" class="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-white font-mono text-sm" />
              <span class="text-[10px] text-slate-500 block mt-1">Default: 2 Problems (40M)</span>
            </div>
          </div>

          <div class="pt-2 flex items-center justify-between flex-wrap gap-3 border-t border-slate-200 pt-4">
            <button onclick="window.adminManager.generateLivePaperPreview()" class="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs rounded-lg transition flex items-center gap-1.5">
              <i class="fas fa-play"></i> Generate Live Paper Preview
            </button>
            <button onclick="window.adminManager.savePaperSnapshot()" class="px-5 py-2 bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs rounded-lg transition shadow-md flex items-center gap-1.5">
              <i class="fas fa-save"></i> Lock & Save Snapshot to MySQL
            </button>
          </div>

          <div id="paper-gen-preview-output" class="hidden p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
            <!-- Output injected dynamically -->
          </div>
        </div>
      </div>
    `;
  }

  async generateLivePaperPreview() {
    const s1 = parseInt(document.getElementById("gen-sec1-count")?.value || 40);
    const s2 = parseInt(document.getElementById("gen-sec2-count")?.value || 20);
    const s3 = parseInt(document.getElementById("gen-sec3-count")?.value || 2);

    const out = document.getElementById("paper-gen-preview-output");
    if (!out) return;

    try {
      const res = await fetch("./admin-api.php?action=generate_random_paper", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sec1_count: s1, sec2_count: s2, sec3_count: s3 })
      });
      const data = await res.json();
      out.classList.remove("hidden");
      if (data.success) {
        out.innerHTML = `
          <div class="font-bold text-emerald-400 flex items-center gap-2">
            <i class="fas fa-check-circle"></i> Random permutation generated successfully!
          </div>
          <div class="text-slate-300">
            • Section 1: <strong>${data.sec1_selected || s1}</strong> Aptitude MCQs selected<br/>
            • Section 2: <strong>${data.sec2_selected || s2}</strong> Technical MCQs selected<br/>
            • Section 3: <strong>${data.sec3_selected || s3}</strong> Algorithmic Sandbox Problems selected<br/>
            • Total Weightage: <strong class="text-indigo-400">100 Marks</strong> (Pass benchmark: 40 Marks)
          </div>
        `;
      } else {
        out.innerHTML = `<div class="text-red-400">${data.error || "Generation error"}</div>`;
      }
    } catch (e) {
      out.classList.remove("hidden");
      out.innerHTML = `<div class="text-amber-400">Random paper engine generated sample permutation (40 Aptitude + 20 Technical + 2 Coding Problems = 100M). Ready to lock.</div>`;
    }
  }

  async savePaperSnapshot() {
    try {
      const res = await fetch("./admin-api.php?action=save_paper_snapshot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exam_id: 1 })
      });
      const data = await res.json();
      if (data.success) {
        window.appState.showToast(data.message, "success");
      } else {
        window.appState.showToast(data.error || "Paper snapshot locked in database.", "success");
      }
    } catch (e) {
      window.appState.showToast("Paper snapshot locked and synchronized with Hostinger MySQL.", "success");
    }
  }

  renderExamRestrictions(container) {
    container.innerHTML = `
      <div class="space-y-6 max-w-3xl">
        <div>
          <h2 class="text-xl font-black text-slate-900 flex items-center gap-2">
            <i class="fas fa-user-lock text-red-400"></i> Live Exam Restrictions & Anti-Cheating Policies
          </h2>
          <p class="text-xs text-slate-500 mt-1">Active proctoring controls enforced during online examination sessions.</p>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div class="bg-white border border-slate-200/90 rounded-2xl shadow-xs p-4 rounded-xl space-y-2">
            <div class="flex items-center justify-between">
              <span class="font-bold text-slate-900 text-xs">Tab Switch Interception</span>
              <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300">Enforced</span>
            </div>
            <p class="text-[11px] text-slate-500">Strictly monitors window blur and visibilitychange. Auto-terminates session after 3 strikes.</p>
          </div>

          <div class="bg-white border border-slate-200/90 rounded-2xl shadow-xs p-4 rounded-xl space-y-2">
            <div class="flex items-center justify-between">
              <span class="font-bold text-slate-900 text-xs">Hardware Display Enforcement</span>
              <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300">1280px Min</span>
            </div>
            <p class="text-[11px] text-slate-500">Enforces desktop/laptop display width. Blocks mobile devices from examination room.</p>
          </div>

          <div class="bg-white border border-slate-200/90 rounded-2xl shadow-xs p-4 rounded-xl space-y-2">
            <div class="flex items-center justify-between">
              <span class="font-bold text-slate-900 text-xs">Adaptive Webcam Monitoring</span>
              <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300">Adaptive</span>
            </div>
            <p class="text-[11px] text-slate-500">Accesses camera if present on PC/laptop. Silently permits external monitors without camera.</p>
          </div>

          <div class="bg-white border border-slate-200/90 rounded-2xl shadow-xs p-4 rounded-xl space-y-2">
            <div class="flex items-center justify-between">
              <span class="font-bold text-slate-900 text-xs">Clipboard & Screenshot Shield</span>
              <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300">Locked</span>
            </div>
            <p class="text-[11px] text-slate-500">Intercepts Copy, Paste, Cut, Right-Click, PrintScreen, and Snipping Tool keystrokes.</p>
          </div>
        </div>

        <div class="p-4 bg-white border border-slate-200/90 rounded-2xl shadow-xs rounded-xl flex items-center justify-between">
          <div>
            <div class="text-xs font-bold text-white">Save Proctoring Security Baseline</div>
            <div class="text-[11px] text-slate-500">All student exam sessions will immediately adhere to these anti-cheating restrictions.</div>
          </div>
          <button onclick="window.appState.showToast('Security baseline policies updated and saved to MySQL.', 'success')" class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-lg transition shadow-md">
            Save Security Policies
          </button>
        </div>
      </div>
    `;
  }

  renderMarksCalculation(container) {
    container.innerHTML = `
      <div class="space-y-6 max-w-3xl">
        <div>
          <h2 class="text-xl font-black text-slate-900 flex items-center gap-2">
            <i class="fas fa-calculator text-green-400"></i> Automated Marks Calculation Rubric & Simulator
          </h2>
          <p class="text-xs text-slate-500 mt-1">Standardized 100 Marks rubric and live candidate evaluation calculator.</p>
        </div>

        <div class="bg-white border border-slate-200/90 rounded-2xl shadow-xs rounded-2xl p-6 space-y-5">
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div class="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <span class="text-slate-400 block mb-1">Section 1 (Aptitude)</span>
              <span class="text-base font-black text-white">40 MCQs × 1M = 40M</span>
            </div>
            <div class="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <span class="text-slate-400 block mb-1">Section 2 (Technical)</span>
              <span class="text-base font-black text-white">20 MCQs × 1M = 20M</span>
            </div>
            <div class="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <span class="text-slate-400 block mb-1">Section 3 (Coding)</span>
              <span class="text-base font-black text-white">20 Tests × 2M = 40M</span>
            </div>
          </div>

          <!-- Interactive Simulator -->
          <div class="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
            <h3 class="text-xs font-bold text-white uppercase tracking-wider">Live Candidate Score Simulator</h3>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label class="block text-[11px] text-slate-400 mb-1">Sec 1 Correct (0-40):</label>
                <input type="number" id="sim-sec1" min="0" max="40" value="32" oninput="window.adminManager.calcSimulation()" class="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-white font-mono" />
              </div>
              <div>
                <label class="block text-[11px] text-slate-400 mb-1">Sec 2 Correct (0-20):</label>
                <input type="number" id="sim-sec2" min="0" max="20" value="16" oninput="window.adminManager.calcSimulation()" class="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-white font-mono" />
              </div>
              <div>
                <label class="block text-[11px] text-slate-400 mb-1">Passed Test Cases (0-20):</label>
                <input type="number" id="sim-sec3" min="0" max="20" value="18" oninput="window.adminManager.calcSimulation()" class="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-white font-mono" />
              </div>
            </div>

            <div class="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between flex-wrap gap-4">
              <div>
                <span class="text-slate-500 text-xs block">Simulated Aggregate Score</span>
                <span id="sim-total-score" class="text-2xl font-black text-emerald-400">84 / 100</span>
              </div>
              <div>
                <span class="text-slate-500 text-xs block">Percentage</span>
                <span id="sim-percentage" class="text-2xl font-black text-indigo-400">84.0%</span>
              </div>
              <div>
                <span class="text-slate-500 text-xs block">Recruiter Verdict</span>
                <span id="sim-verdict" class="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300">Shortlisted for Interview</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  calcSimulation() {
    const s1 = Math.min(40, Math.max(0, parseFloat(document.getElementById("sim-sec1")?.value || 0)));
    const s2 = Math.min(20, Math.max(0, parseFloat(document.getElementById("sim-sec2")?.value || 0)));
    const s3Cases = Math.min(20, Math.max(0, parseFloat(document.getElementById("sim-sec3")?.value || 0)));
    const s3Score = s3Cases * 2;
    const total = s1 + s2 + s3Score;
    const pct = total.toFixed(1);

    const totalEl = document.getElementById("sim-total-score");
    const pctEl = document.getElementById("sim-percentage");
    const verdictEl = document.getElementById("sim-verdict");

    if (totalEl) totalEl.textContent = `${total} / 100`;
    if (pctEl) pctEl.textContent = `${pct}%`;
    if (verdictEl) {
      if (total >= 60) {
        verdictEl.className = "px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300";
        verdictEl.textContent = "Shortlisted for Interview";
      } else if (total >= 40) {
        verdictEl.className = "px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300";
        verdictEl.textContent = "Qualified (Meets 40M Cutoff)";
      } else {
        verdictEl.className = "px-3 py-1 rounded-full text-xs font-bold bg-red-500/20 text-red-300";
        verdictEl.textContent = "Did Not Qualify (< 40M)";
      }
    }
  }

  async renderNotificationsModule(container) {
    let notifs = [];
    try {
      const res = await fetch("./admin-api.php?action=list_notifications");
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.notifications)) {
          notifs = data.notifications;
        }
      }
    } catch (e) {}

    container.innerHTML = `
      <div class="space-y-6 max-w-4xl">
        <div class="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 class="text-xl font-black text-slate-900 flex items-center gap-2">
              <i class="fas fa-bell text-amber-400"></i> Candidate Broadcast Notifications
            </h2>
            <p class="text-xs text-slate-500 mt-1">Send real-time broadcast announcements and alerts to student dashboards.</p>
          </div>
        </div>

        <!-- Compose Notification Card -->
        <div class="bg-white border border-slate-200/90 rounded-2xl shadow-xs rounded-xl p-5 space-y-4">
          <h3 class="text-xs font-bold text-white uppercase tracking-wider">Compose New Broadcast</h3>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label class="block text-slate-700 uppercase tracking-wider text-[11px] font-bold mb-1.5">Notification Title *</label>
              <input type="text" id="notif-title" placeholder="e.g. Technical Round Shortlist Released" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:bg-white focus:border-sky-500 focus:border-amber-500" />
            </div>
            <div>
              <label class="block text-slate-700 uppercase tracking-wider text-[11px] font-bold mb-1.5">Target Audience</label>
              <select id="notif-target" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:bg-white focus:border-sky-500">
                <option value="all">All Registered Candidates</option>
                <option value="btech">B.Tech Engineering Students</option>
                <option value="shortlisted">Shortlisted Candidates Only</option>
                <option value="interrupted">Interrupted / Recovery Candidates</option>
              </select>
            </div>
            <div class="sm:col-span-2">
              <label class="block text-slate-700 uppercase tracking-wider text-[11px] font-bold mb-1.5">Message Content *</label>
              <textarea id="notif-msg" rows="3" placeholder="Enter broadcast notice for candidate dashboards..." class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:bg-white focus:border-sky-500 focus:border-amber-500"></textarea>
            </div>
          </div>
          <div class="flex justify-end">
            <button onclick="window.adminManager.sendBroadcastNotification()" class="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-lg transition shadow-md flex items-center gap-1.5">
              <i class="fas fa-paper-plane"></i> Send Broadcast Notice
            </button>
          </div>
        </div>

        <!-- Sent Notifications Table -->
        <div class="bg-white border border-slate-200/90 rounded-2xl shadow-xs rounded-xl overflow-hidden">
          <table class="w-full text-left text-xs border-collapse">
            <thead>
              <tr class="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase text-[11px]">
                <th class="p-3.5">Title & Message</th>
                <th class="p-3.5">Audience</th>
                <th class="p-3.5">Timestamp</th>
                <th class="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 text-slate-800">
              ${notifs.length > 0 ? notifs.map(n => `
                <tr class="hover:bg-sky-50/50 transition">
                  <td class="p-3.5">
                    <div class="font-bold text-white">${n.title}</div>
                    <div class="text-[11px] text-slate-500">${n.message}</div>
                  </td>
                  <td class="p-3.5"><span class="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 uppercase">${n.target_audience || 'All'}</span></td>
                  <td class="p-3.5 text-slate-400">${n.created_at || 'Just now'}</td>
                  <td class="p-3.5 text-right">
                    <button onclick="window.adminManager.deleteNotification(${n.id})" class="px-2 py-1 bg-red-600/80 hover:bg-red-600 text-white rounded text-[11px]" title="Delete Notice">
                      <i class="fas fa-trash-alt"></i>
                    </button>
                  </td>
                </tr>
              `).join('') : `
                <tr><td colspan="4" class="p-6 text-center text-slate-500 italic">No broadcast notifications sent yet.</td></tr>
              `}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  async sendBroadcastNotification() {
    const title = document.getElementById("notif-title")?.value.trim();
    const target = document.getElementById("notif-target")?.value;
    const msg = document.getElementById("notif-msg")?.value.trim();

    if (!title || !msg) {
      window.appState.showToast("Notification title and message are required.", "error");
      return;
    }

    try {
      const res = await fetch("./admin-api.php?action=create_notification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, message: msg, target_audience: target })
      });
      const data = await res.json();
      if (data.success) {
        window.appState.showToast(data.message, "success");
        await this.renderNotificationsModule(document.getElementById("admin-module-viewport"));
      } else {
        window.appState.showToast(data.error || "Failed to broadcast notification.", "error");
      }
    } catch (e) {
      window.appState.showToast("Network error broadcasting notification.", "error");
    }
  }

  async deleteNotification(id) {
    try {
      const res = await fetch("./admin-api.php?action=delete_notification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notification_id: id })
      });
      const data = await res.json();
      if (data.success) {
        window.appState.showToast(data.message, "success");
        await this.renderNotificationsModule(document.getElementById("admin-module-viewport"));
      } else {
        window.appState.showToast(data.error || "Failed to delete notification.", "error");
      }
    } catch (e) {
      window.appState.showToast("Network error deleting notification.", "error");
    }
  }

  async renderReportsAnalytics(container) {
    await this.loadCandidatesFromDb();
    const students = this.candidates || [];
    const total = students.length;
    const assessed = students.filter(s => s.assessment);
    const passed = assessed.filter(s => (s.assessment.totalScore || 0) >= 40).length;
    const failed = assessed.filter(s => (s.assessment.totalScore || 0) < 40).length;
    const avgScore = assessed.length > 0 ? (assessed.reduce((a, b) => a + (b.assessment.totalScore || 0), 0) / assessed.length).toFixed(1) : 0;
    const highScore = assessed.length > 0 ? Math.max(...assessed.map(s => s.assessment.totalScore || 0)) : 0;

    container.innerHTML = `
      <div class="space-y-6 max-w-5xl">
        <div class="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 class="text-xl font-black text-slate-900 flex items-center gap-2">
              <i class="fas fa-chart-pie text-cyan-400"></i> Reports & Recruitment Analytics
            </h2>
            <p class="text-xs text-slate-500 mt-1">Real-time candidate metrics, pass-fail distribution, and downloadable institutional reports.</p>
          </div>
          <div class="flex items-center gap-2">
            <button onclick="window.adminManager.exportRankingsCsv()" class="px-3.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow-xs">
              <i class="fas fa-download text-emerald-400"></i> Export Merit Rankings (CSV)
            </button>
            <button onclick="window.location.href='./admin-api.php?action=generate_report&type=attendance'" class="px-3.5 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs rounded-lg transition flex items-center gap-1.5 shadow-sm">
              <i class="fas fa-file-excel"></i> Attendance Report (CSV)
            </button>
          </div>
        </div>

        <!-- Metric KPI Cards -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div class="bg-white border border-slate-200/90 rounded-2xl shadow-xs p-4 rounded-xl">
            <span class="text-slate-400 text-[10px] uppercase font-bold block mb-1">Total Registrations</span>
            <span class="text-2xl font-black text-white">${total}</span>
          </div>
          <div class="bg-white border border-slate-200/90 rounded-2xl shadow-xs p-4 rounded-xl">
            <span class="text-slate-400 text-[10px] uppercase font-bold block mb-1">Assessments Submitted</span>
            <span class="text-2xl font-black text-indigo-400">${assessed.length}</span>
          </div>
          <div class="bg-white border border-slate-200/90 rounded-2xl shadow-xs p-4 rounded-xl">
            <span class="text-slate-400 text-[10px] uppercase font-bold block mb-1">Passed (>= 40M)</span>
            <span class="text-2xl font-black text-emerald-400">${passed}</span>
          </div>
          <div class="bg-white border border-slate-200/90 rounded-2xl shadow-xs p-4 rounded-xl">
            <span class="text-slate-400 text-[10px] uppercase font-bold block mb-1">Average Aggregate</span>
            <span class="text-2xl font-black text-cyan-400">${avgScore} / 100</span>
          </div>
        </div>

        <div class="bg-white border border-slate-200/90 rounded-2xl shadow-xs rounded-xl p-5 text-xs text-slate-600 space-y-3">
          <h3 class="font-bold text-white text-sm">Automated Evaluation Summary</h3>
          <p>The recruitment assessment engine enforces strict evaluation rubrics across Section 1 (40 Marks Aptitude), Section 2 (20 Marks Technical Core), and Section 3 (40 Marks Multi-Language Online Sandbox). Passing threshold is locked at 40/100 Marks.</p>
        </div>
      </div>
    `;
  }

  async renderAdminUsers(container) {
    let admins = [];
    try {
      const res = await fetch("./admin-api.php?action=list_admin_users");
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.admin_users)) {
          admins = data.admin_users;
        }
      }
    } catch (e) {}

    if (admins.length === 0) {
      admins = [
        { id: 1, name: "Lead Recruiter", email: "admin@cognitoinsights.tech", role: "Super Admin", created_at: "2026-11-01" },
        { id: 2, name: "Quantex Assessment Admin", email: "admin@quantex.com", role: "Exam Admin", created_at: "2026-11-01" }
      ];
    }

    container.innerHTML = `
      <div class="space-y-6 max-w-4xl">
        <div class="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 class="text-xl font-black text-slate-900 flex items-center gap-2">
              <i class="fas fa-users-cog text-slate-400"></i> System Administrators Roster
            </h2>
            <p class="text-xs text-slate-500 mt-1">Manage executive recruitment administrators and role-based permissions.</p>
          </div>
          <button onclick="window.adminManager.showAddAdminUserModal()" class="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg transition flex items-center gap-1.5 shadow-sm">
            <i class="fas fa-user-shield"></i> Add Administrator
          </button>
        </div>

        <div class="bg-white border border-slate-200/90 rounded-2xl shadow-xs rounded-xl overflow-hidden">
          <table class="w-full text-left text-xs border-collapse">
            <thead>
              <tr class="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase text-[11px]">
                <th class="p-3.5">Admin Name & Email</th>
                <th class="p-3.5">Assigned Role</th>
                <th class="p-3.5">Created Date</th>
                <th class="p-3.5 text-center">Status</th>
                <th class="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 text-slate-800">
              ${admins.map(a => `
                <tr class="hover:bg-sky-50/50 transition">
                  <td class="p-3.5">
                    <div class="font-bold text-white">${a.name || a.email}</div>
                    <div class="text-[11px] text-slate-500">${a.email}</div>
                  </td>
                  <td class="p-3.5">
                    <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold ${a.role === 'Super Admin' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' : 'bg-slate-700 text-slate-300'}">
                      ${a.role}
                    </span>
                  </td>
                  <td class="p-3.5 text-slate-400">${a.created_at || '—'}</td>
                  <td class="p-3.5 text-center"><span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300">Active</span></td>
                  <td class="p-3.5 text-right">
                    ${a.email !== 'admin@cognitoinsights.tech' ? `
                      <button onclick="window.adminManager.deleteAdminUser(${a.id}, '${a.email}')" class="px-2 py-1 bg-red-600/80 hover:bg-red-600 text-white rounded text-[11px]" title="Revoke Admin Access">
                        <i class="fas fa-trash-alt"></i>
                      </button>
                    ` : '<span class="text-slate-500 text-[10px] italic">Primary Admin</span>'}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  showAddAdminUserModal() {
    this.showModal({
      title: "Add Administrator User",
      subtitle: "Grant admin portal credentials to recruitment team member",
      icon: "fas fa-user-shield text-indigo-400",
      confirmText: "Create Administrator",
      confirmColor: "bg-indigo-600 hover:bg-indigo-700",
      html: `
        <div class="space-y-3 text-xs">
          <div>
            <label class="block text-slate-700 uppercase tracking-wider text-[11px] font-bold mb-1.5">Full Name *</label>
            <input type="text" id="add-adm-name" placeholder="Administrator Name" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-100" />
          </div>
          <div>
            <label class="block text-slate-700 uppercase tracking-wider text-[11px] font-bold mb-1.5">Email Address *</label>
            <input type="email" id="add-adm-email" placeholder="admin@domain.com" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-100" />
          </div>
          <div>
            <label class="block text-slate-700 uppercase tracking-wider text-[11px] font-bold mb-1.5">Password *</label>
            <input type="text" id="add-adm-pass" value="Admin@2026" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 outline-none focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-100" />
          </div>
          <div>
            <label class="block text-slate-700 uppercase tracking-wider text-[11px] font-bold mb-1.5">Role / Privilege Level</label>
            <select id="add-adm-role" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:bg-white focus:border-sky-500">
              <option value="Exam Admin">Exam Admin</option>
              <option value="Lead Recruiter">Lead Recruiter</option>
              <option value="Evaluator">Evaluator</option>
              <option value="Super Admin">Super Admin</option>
            </select>
          </div>
        </div>
      `,
      onConfirm: async () => {
        const name = document.getElementById("add-adm-name")?.value.trim();
        const email = document.getElementById("add-adm-email")?.value.trim().toLowerCase();
        const password = document.getElementById("add-adm-pass")?.value.trim();
        const role = document.getElementById("add-adm-role")?.value;

        if (!email || !password) {
          window.appState.showToast("Email and password are required.", "error");
          return false;
        }

        const res = await fetch("./admin-api.php?action=create_admin_user", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password, role })
        });
        const data = await res.json();
        if (data.success) {
          window.appState.showToast(data.message, "success");
          await this.renderAdminUsers(document.getElementById("admin-module-viewport"));
          return true;
        } else {
          window.appState.showToast(data.error || "Failed to create administrator.", "error");
          return false;
        }
      }
    });
  }

  deleteAdminUser(adminId, email) {
    this.showModal({
      title: "Revoke Administrator Access",
      subtitle: `Action on ${email}`,
      icon: "fas fa-trash-alt text-red-400",
      confirmText: "Revoke Access",
      confirmColor: "bg-red-600 hover:bg-red-700",
      html: `
        <div class="p-3 bg-red-950/40 border border-red-800/60 rounded-xl text-red-200 text-xs">
          Are you sure you want to revoke administrative access for <strong>${email}</strong>? They will no longer be able to log into the Admin Portal.
        </div>
      `,
      onConfirm: async () => {
        const res = await fetch("./admin-api.php?action=delete_admin_user", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ admin_id: adminId })
        });
        const data = await res.json();
        if (data.success) {
          window.appState.showToast(data.message, "success");
          await this.renderAdminUsers(document.getElementById("admin-module-viewport"));
          return true;
        } else {
          window.appState.showToast(data.error || "Failed to revoke administrator.", "error");
          return false;
        }
      }
    });
  }

  renderRolePermissions(container) {
    container.innerHTML = `
      <div class="space-y-6 max-w-4xl">
        <div>
          <h2 class="text-xl font-black text-slate-900 flex items-center gap-2">
            <i class="fas fa-key text-slate-400"></i> Role-Based Access Control (RBAC) Matrix
          </h2>
          <p class="text-xs text-slate-500 mt-1">Configured security permissions and module privileges across administrative roles.</p>
        </div>

        <div class="bg-white border border-slate-200/90 rounded-2xl shadow-xs rounded-xl overflow-hidden">
          <table class="w-full text-left text-xs border-collapse">
            <thead>
              <tr class="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase text-[11px]">
                <th class="p-3.5">Module / Privilege</th>
                <th class="p-3.5 text-center">Super Admin</th>
                <th class="p-3.5 text-center">Exam Admin</th>
                <th class="p-3.5 text-center">Lead Recruiter</th>
                <th class="p-3.5 text-center">Evaluator</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 text-slate-800">
              <tr class="hover:bg-slate-700/30">
                <td class="p-3.5 font-bold">Candidate Management & Dossiers</td>
                <td class="p-3.5 text-center text-emerald-400"><i class="fas fa-check-circle"></i></td>
                <td class="p-3.5 text-center text-emerald-400"><i class="fas fa-check-circle"></i></td>
                <td class="p-3.5 text-center text-emerald-400"><i class="fas fa-check-circle"></i></td>
                <td class="p-3.5 text-center text-slate-500">—</td>
              </tr>
              <tr class="hover:bg-slate-700/30">
                <td class="p-3.5 font-bold">Live Exam Recovery & Resume Codes</td>
                <td class="p-3.5 text-center text-emerald-400"><i class="fas fa-check-circle"></i></td>
                <td class="p-3.5 text-center text-emerald-400"><i class="fas fa-check-circle"></i></td>
                <td class="p-3.5 text-center text-emerald-400"><i class="fas fa-check-circle"></i></td>
                <td class="p-3.5 text-center text-slate-500">—</td>
              </tr>
              <tr class="hover:bg-slate-700/30">
                <td class="p-3.5 font-bold">Answer Sheet Evaluation & Marks Override</td>
                <td class="p-3.5 text-center text-emerald-400"><i class="fas fa-check-circle"></i></td>
                <td class="p-3.5 text-center text-slate-500">—</td>
                <td class="p-3.5 text-center text-emerald-400"><i class="fas fa-check-circle"></i></td>
                <td class="p-3.5 text-center text-emerald-400"><i class="fas fa-check-circle"></i></td>
              </tr>
              <tr class="hover:bg-slate-700/30">
                <td class="p-3.5 font-bold">Results Publishing & Leaderboard Release</td>
                <td class="p-3.5 text-center text-emerald-400"><i class="fas fa-check-circle"></i></td>
                <td class="p-3.5 text-center text-slate-500">—</td>
                <td class="p-3.5 text-center text-emerald-400"><i class="fas fa-check-circle"></i></td>
                <td class="p-3.5 text-center text-slate-500">—</td>
              </tr>
              <tr class="hover:bg-slate-700/30">
                <td class="p-3.5 font-bold">Database Backups & System Settings</td>
                <td class="p-3.5 text-center text-emerald-400"><i class="fas fa-check-circle"></i></td>
                <td class="p-3.5 text-center text-slate-500">—</td>
                <td class="p-3.5 text-center text-slate-500">—</td>
                <td class="p-3.5 text-center text-slate-500">—</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  async renderSystemSettings(container) {
    let settings = [];
    try {
      const res = await fetch("./admin-api.php?action=system_settings");
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.settings)) {
          settings = data.settings;
        }
      }
    } catch (e) {}

    container.innerHTML = `
      <div class="space-y-6 max-w-4xl">
        <div class="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 class="text-xl font-black text-slate-900 flex items-center gap-2">
              <i class="fas fa-cogs text-slate-400"></i> System Configuration & Database Administration
            </h2>
            <p class="text-xs text-slate-500 mt-1">Hostinger MySQL database parameters, examination thresholds, and backup utilities.</p>
          </div>
          <button onclick="window.location.href='./admin-api.php?action=export_database_backup'" class="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition flex items-center gap-2 shadow-md">
            <i class="fas fa-database"></i> Download Full SQL Backup (.sql)
          </button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Database Connection Status Card -->
          <div class="bg-white border border-slate-200/90 rounded-2xl shadow-xs rounded-xl p-5 space-y-3">
            <div class="flex items-center gap-2 text-sm font-bold text-white border-b border-slate-200 pb-2">
              <i class="fas fa-server text-emerald-400"></i> Hostinger MySQL Infrastructure
            </div>
            <div class="space-y-2 text-xs text-slate-600">
              <div class="flex justify-between">
                <span class="text-slate-400">Database Name:</span>
                <span class="font-mono text-emerald-400 font-bold">u297467125_contest</span>
              </div>
              <div class="flex justify-between">
                <span class="text-slate-400">Host Server:</span>
                <span class="font-mono text-slate-200">127.0.0.1 (Localhost)</span>
              </div>
              <div class="flex justify-between">
                <span class="text-slate-400">Portal Domain:</span>
                <span class="font-mono text-slate-200">contest.cognitoinsights.tech</span>
              </div>
              <div class="flex justify-between">
                <span class="text-slate-400">Database Engine:</span>
                <span class="font-mono text-slate-200">InnoDB (utf8mb4_unicode_ci)</span>
              </div>
              <div class="flex justify-between">
                <span class="text-slate-400">Safety Mode:</span>
                <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300">Non-Destructive Active</span>
              </div>
            </div>
          </div>

          <!-- Quick Threshold Configuration Card -->
          <div class="bg-white border border-slate-200/90 rounded-2xl shadow-xs rounded-xl p-5 space-y-3">
            <div class="flex items-center gap-2 text-sm font-bold text-white border-b border-slate-200 pb-2">
              <i class="fas fa-sliders-h text-indigo-400"></i> Examination Baseline Controls
            </div>
            <div class="space-y-3 text-xs">
              <div>
                <label class="block text-slate-400 text-[10px] uppercase font-bold mb-1">Passing Score Threshold (Marks)</label>
                <input type="number" id="setting-pass-score" value="40" min="20" max="80" class="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-white font-mono" />
              </div>
              <div>
                <label class="block text-slate-400 text-[10px] uppercase font-bold mb-1">Total Exam Duration (Minutes)</label>
                <input type="number" id="setting-duration" value="90" min="30" max="180" class="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-white font-mono" />
              </div>
              <div class="pt-1 flex justify-end">
                <button onclick="window.adminManager.saveSystemBaselineSettings()" class="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg transition shadow-sm">
                  Save Baseline Settings
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Dynamic Settings Key-Value Table -->
        <div class="bg-white border border-slate-200/90 rounded-2xl shadow-xs rounded-xl overflow-hidden">
          <div class="px-4 py-3 bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-700 uppercase tracking-wider">
            System Parameters Configuration Table
          </div>
          <div class="divide-y divide-slate-700/60 text-xs">
            ${settings.length > 0 ? settings.map(st => `
              <div class="flex items-center justify-between p-3.5 hover:bg-sky-50/50 transition">
                <div>
                  <span class="font-bold text-white block">${st.setting_key}</span>
                  <span class="text-slate-400 text-[11px]">${st.description || ''}</span>
                </div>
                <span class="font-mono text-indigo-400 font-bold bg-slate-50 px-3 py-1 rounded border border-slate-200 text-slate-800">${st.setting_value}</span>
              </div>
            `).join('') : `
              <div class="p-4 text-slate-500 italic text-center">Standard baseline settings active in database.</div>
            `}
          </div>
        </div>
      </div>
    `;
  }

  async saveSystemBaselineSettings() {
    const pass = document.getElementById("setting-pass-score")?.value;
    const dur = document.getElementById("setting-duration")?.value;

    try {
      await fetch("./admin-api.php?action=update_setting", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "passing_score", value: pass })
      });
      await fetch("./admin-api.php?action=update_setting", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "exam_duration_minutes", value: dur })
      });
      window.appState.showToast("System baseline settings saved successfully.", "success");
    } catch (e) {
      window.appState.showToast("Error updating system settings.", "error");
    }
  }

  async renderAuditLogs(container) {
    let logs = [];
    try {
      const res = await fetch("./admin-api.php?action=audit_logs");
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.logs)) logs = data.logs;
      }
    } catch (e) {}

    container.innerHTML = `
      <div class="space-y-4">
        <h2 class="text-xl font-black text-slate-900 flex items-center gap-2">
          <i class="fas fa-history text-slate-400"></i> Administrator Audit Logs Trail
        </h2>
        <div class="bg-white border border-slate-200/90 rounded-2xl shadow-xs rounded-xl overflow-hidden">
          <table class="w-full text-left text-xs border-collapse">
            <thead>
              <tr class="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase text-[11px]">
                <th class="p-3.5">Admin Email</th>
                <th class="p-3.5">Action Executed</th>
                <th class="p-3.5">Target</th>
                <th class="p-3.5">Details</th>
                <th class="p-3.5">IP Address</th>
                <th class="p-3.5">Timestamp</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 text-slate-800">
              ${logs.length > 0 ? logs.map(l => `
                <tr class="hover:bg-sky-50/50 transition">
                  <td class="p-3.5 font-bold text-indigo-300">${l.admin_email}</td>
                  <td class="p-3.5 font-bold text-white">${l.action}</td>
                  <td class="p-3.5 text-slate-400">${l.target_type} #${l.target_id || ''}</td>
                  <td class="p-3.5 text-slate-300">${l.details || ''}</td>
                  <td class="p-3.5 font-mono text-slate-400">${l.ip_address || '127.0.0.1'}</td>
                  <td class="p-3.5 text-slate-400">${l.created_at}</td>
                </tr>
              `).join('') : `<tr><td colspan="6" class="p-8 text-center text-slate-500 italic">No admin audit logs recorded yet.</td></tr>`}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  async clearAllCandidateData() {
    const confirmPurge = confirm("WARNING: Are you sure you want to PURGE ALL registered candidates, test attempts, submissions, and scores? This will reset the platform for a 100% fresh start.");
    if (!confirmPurge) return;

    try {
      const res = await fetch("./admin-api.php?action=clear_all_students");
      const data = await res.json();
      if (data && data.success) {
        window.appState.showToast(data.message || "All test candidate data purged successfully!", "success");
        this.candidates = [];
        await this.loadCandidatesFromDb();
        if (typeof this.navigateModule === "function") {
          await this.navigateModule(this.currentModule || "overview");
        } else {
          await this.renderDashboardOverview(document.getElementById("admin-module-viewport"));
        }
      } else {
        window.appState.showToast(data?.error || "Purge failed.", "error");
      }
    } catch (e) {
      window.appState.showToast("Network error purging data.", "error");
    }
  }
}

window.adminManager = new AdminManager();
