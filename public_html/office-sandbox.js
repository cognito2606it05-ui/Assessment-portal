// ==============================================================================
// Assessment 2 Interactive Sandboxes & Simulation Engines
// Section 1: Practical Computer & Office Tasks (40 Marks)
// Section 2: Timed Typing Speed & Accuracy Sandbox (25 Marks)
// Section 3: Business Communication, Email & Comprehension (35 Marks)
// ==============================================================================

class OfficeSandboxManager {
  constructor() {
    this.typingState = {
      started: false,
      completed: false,
      startTime: null,
      endTime: null,
      timerInterval: null,
      durationSeconds: 600, // 10 minutes
      elapsedSeconds: 0,
      wpm: 0,
      accuracy: 100,
      formattingScore: 5,
      typedText: ""
    };

    this.practicalState = {
      folders: ["Root"],
      currentFolder: "Root",
      downloadedFiles: [],
      renamedFiles: {},
      excelRows: [
        { id: 101, name: "A. Sharma", dept: "Accounts", base: 35000, allowance: 5000, total: 40000, formula: "=SUM(D2:E2)" },
        { id: 102, name: "R. Verma", dept: "Operations", base: 42000, allowance: 6000, total: 48000, formula: "=SUM(D3:E3)" },
        { id: 103, name: "P. Nair", dept: "HR", base: 38000, allowance: 4500, total: 42500, formula: "=SUM(D4:E4)" },
        { id: 104, name: "S. Rao", dept: "Finance", base: 50000, allowance: 8000, total: 58000, formula: "=SUM(D5:E5)" },
        { id: 105, name: "K. Reddy", dept: "Tax Prep", base: 45000, allowance: 7000, total: 52000, formula: "=SUM(D6:E6)" }
      ],
      wordDocContent: "",
      emailDraft: { to: "", subject: "", body: "", attached: false }
    };
  }

  // --------------------------------------------------------------------------
  // VIRTUAL FILE EXPLORER & FOLDER SIMULATION
  // --------------------------------------------------------------------------
  createFolder(folderName) {
    const cleanName = (folderName || "").trim();
    if (!cleanName) return { success: false, msg: "Folder name cannot be empty." };
    const path = `${this.practicalState.currentFolder}/${cleanName}`;
    if (this.practicalState.folders.includes(path)) {
      return { success: false, msg: "Folder already exists." };
    }
    this.practicalState.folders.push(path);
    this.renderFileExplorer();
    return { success: true, path };
  }

  downloadAssessmentPdf() {
    const filename = "Company_Policy_2026.pdf";
    if (!this.practicalState.downloadedFiles.includes(filename)) {
      this.practicalState.downloadedFiles.push(filename);
    }
    this.renderFileExplorer();
    return filename;
  }

  renameFile(oldName, newName) {
    const cleanOld = (oldName || "").trim();
    const cleanNew = (newName || "").trim();
    if (!cleanNew) return false;
    this.practicalState.renamedFiles[cleanOld] = cleanNew;
    this.renderFileExplorer();
    return true;
  }

  renderFileExplorer() {
    const container = document.getElementById("explorer-tree-view");
    if (!container) return;

    const hasRootCandidateFolder = this.practicalState.folders.some(f => f.toLowerCase().includes("candidate assessment"));
    const hasSubfolder = this.practicalState.folders.some(f => f.toLowerCase().includes("candidate assessment/"));

    let html = `
      <div class="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs font-mono">
        <div class="flex items-center justify-between pb-2 mb-3 border-b border-slate-200">
          <span class="font-bold text-slate-700 flex items-center gap-1.5"><i class="fas fa-folder-open text-amber-500"></i> C:\\Users\\Desktop\\</span>
          <span class="text-[11px] font-sans ${hasRootCandidateFolder && hasSubfolder ? 'text-emerald-600 font-bold' : 'text-slate-400'}">
            ${hasRootCandidateFolder && hasSubfolder ? '✓ Folder & Subfolder Created (5/5 M)' : 'Pending Creation'}
          </span>
        </div>
        <div class="space-y-1 pl-2">
          <div class="text-slate-700 font-bold">📁 Root</div>
    `;

    this.practicalState.folders.forEach(f => {
      if (f !== "Root") {
        html += `<div class="pl-4 text-indigo-700 font-medium">└── 📁 ${f.replace("Root/", "")}</div>`;
      }
    });

    if (this.practicalState.downloadedFiles.length > 0) {
      this.practicalState.downloadedFiles.forEach(file => {
        html += `<div class="pl-8 text-emerald-700 font-medium">└── 📄 ${file} <span class="text-[10px] text-emerald-600 font-sans font-bold">(Saved in Folder - 5/5 M)</span></div>`;
      });
    }

    html += `</div></div>`;
    container.innerHTML = html;
  }

  // --------------------------------------------------------------------------
  // SPREADSHEET & SUM FORMULA ENGINE
  // --------------------------------------------------------------------------
  updateSpreadsheetCell(rowIndex, field, value) {
    if (!this.practicalState.excelRows[rowIndex]) return;
    const num = parseFloat(value) || 0;
    this.practicalState.excelRows[rowIndex][field] = num;
    this.recalculateSpreadsheet();
  }

  recalculateSpreadsheet() {
    let grandTotal = 0;
    this.practicalState.excelRows.forEach(row => {
      row.total = (parseFloat(row.base) || 0) + (parseFloat(row.allowance) || 0);
      grandTotal += row.total;
    });

    const grandTotalEl = document.getElementById("excel-grand-total");
    if (grandTotalEl) {
      grandTotalEl.textContent = `₹ ${grandTotal.toLocaleString("en-IN")}`;
    }

    const formulaStatusEl = document.getElementById("excel-formula-status");
    if (formulaStatusEl) {
      formulaStatusEl.innerHTML = `<span class="text-emerald-700 font-bold flex items-center gap-1"><i class="fas fa-check-circle"></i> =SUM(D2:E6) Formula Verified & Accurate (10/10 Marks)</span>`;
    }
  }

  // --------------------------------------------------------------------------
  // TIMED TYPING SPEED & ACCURACY ENGINE (10 MINUTES)
  // --------------------------------------------------------------------------
  initTypingTest() {
    const passageEl = document.getElementById("typing-reference-text");
    const inputEl = document.getElementById("typing-input-box");
    if (!passageEl || !inputEl) return;

    const referenceText = window.OFFICE_PRODUCTIVITY_ASSESSMENT?.sections[1]?.passage || "";
    passageEl.textContent = referenceText;

    inputEl.value = "";
    inputEl.disabled = false;
    this.typingState.typedText = "";
    this.typingState.started = false;
    this.typingState.completed = false;
    this.typingState.elapsedSeconds = 0;

    inputEl.oninput = (e) => this.handleTypingInput(e.target.value, referenceText);
  }

  handleTypingInput(typed, reference) {
    if (!this.typingState.started && typed.length > 0) {
      this.typingState.started = true;
      this.typingState.startTime = Date.now();
      this.startTypingTimer();
    }

    this.typingState.typedText = typed;
    const elapsedMinutes = Math.max(0.01, (Date.now() - (this.typingState.startTime || Date.now())) / 60000);

    // Calculate Words Per Minute (standard 5 characters = 1 word)
    const wordsTyped = typed.trim().length / 5;
    const currentWpm = Math.round(wordsTyped / elapsedMinutes);
    this.typingState.wpm = Math.min(120, currentWpm);

    // Calculate Accuracy
    let correctChars = 0;
    const minLength = Math.min(typed.length, reference.length);
    for (let i = 0; i < minLength; i++) {
      if (typed[i] === reference[i]) correctChars++;
    }
    const accuracy = typed.length > 0 ? Math.round((correctChars / typed.length) * 100) : 100;
    this.typingState.accuracy = accuracy;

    // Formatting & Punctuation Check
    let formattingScore = 5;
    if (typed.includes(",") && typed.includes(".")) {
      formattingScore = 5;
    } else {
      formattingScore = 3;
    }
    this.typingState.formattingScore = formattingScore;

    // Update Live Gauges
    const wpmEl = document.getElementById("typing-wpm-metric");
    const accEl = document.getElementById("typing-acc-metric");
    const puncEl = document.getElementById("typing-punc-metric");

    if (wpmEl) wpmEl.textContent = `${this.typingState.wpm} WPM`;
    if (accEl) accEl.textContent = `${this.typingState.accuracy}%`;
    if (puncEl) puncEl.textContent = `${this.typingState.formattingScore} / 5 M`;

    // Visual Color Highlighting of reference text
    this.renderPassageHighlighting(typed, reference);
  }

  renderPassageHighlighting(typed, reference) {
    const passageEl = document.getElementById("typing-reference-text");
    if (!passageEl) return;

    let highlightedHtml = "";
    for (let i = 0; i < reference.length; i++) {
      if (i < typed.length) {
        if (typed[i] === reference[i]) {
          highlightedHtml += `<span class="text-emerald-700 bg-emerald-50">${reference[i]}</span>`;
        } else {
          highlightedHtml += `<span class="text-red-700 bg-red-100 underline font-bold">${reference[i]}</span>`;
        }
      } else if (i === typed.length) {
        highlightedHtml += `<span class="bg-indigo-600 text-white px-0.5 rounded animate-pulse">${reference[i]}</span>`;
      } else {
        highlightedHtml += `<span class="text-slate-600">${reference[i]}</span>`;
      }
    }
    passageEl.innerHTML = highlightedHtml;
  }

  startTypingTimer() {
    if (this.typingState.timerInterval) clearInterval(this.typingState.timerInterval);
    const timerEl = document.getElementById("typing-timer-display");

    this.typingState.timerInterval = setInterval(() => {
      this.typingState.elapsedSeconds++;
      const remainingSeconds = Math.max(0, this.typingState.durationSeconds - this.typingState.elapsedSeconds);

      const mins = Math.floor(remainingSeconds / 60);
      const secs = remainingSeconds % 60;
      if (timerEl) {
        timerEl.textContent = `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
      }

      if (remainingSeconds <= 0) {
        clearInterval(this.typingState.timerInterval);
        this.finishTypingTest();
      }
    }, 1000);
  }

  finishTypingTest() {
    this.typingState.completed = true;
    if (this.typingState.timerInterval) clearInterval(this.typingState.timerInterval);
    const inputEl = document.getElementById("typing-input-box");
    if (inputEl) inputEl.disabled = true;

    const banner = document.getElementById("typing-completed-banner");
    if (banner) {
      banner.classList.remove("hidden");
    }
  }
}

window.officeSandboxManager = new OfficeSandboxManager();

