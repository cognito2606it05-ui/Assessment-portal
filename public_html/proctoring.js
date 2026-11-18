// ==============================================================================
// Enterprise Assessment Proctoring, Integrity & Interruption Recovery Engine
// - Tab-switch & defocus detection with 3-strike threshold
// - Anti-copy / cut / paste & context menu restrictions
// - Best-effort screenshot interception & anti-capture blur shield
// - Dynamic security watermark (Registration ID & Session ID)
// - Adaptive hardware webcam attention indicator (local only, zero storage)
// - BeforeUnload & browser interruption tracking with Admin Recovery System
// ==============================================================================

class ProctoringManager {
  constructor() {
    this.violations = 0;
    this.maxViolations = 3;
    this.logs = [];
    this.isActive = false;
    this.mediaStream = null;
    this.hasHardwareCamera = false;
    this.onViolationCallback = null;
    this.onAutoSubmitCallback = null;
    this.onInterruptionCallback = null;
    this.lastViolationTime = 0;
    this.candidateInfo = { registrationId: "COG-2026", email: "", attemptId: 0, sessionToken: "" };
    this.watermarkElement = null;
    this.watermarkInterval = null;
    this.heartbeatInterval = null;
  }

  /**
   * Check if host PC has a connected webcam
   */
  async checkCameraAvailability() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
      return { available: false, reason: "Media device enumeration unsupported" };
    }
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const hasCam = devices.some(d => d.kind === "videoinput");
      return { available: hasCam };
    } catch (e) {
      console.warn("Camera enumeration error:", e);
      return { available: false, error: e.message };
    }
  }

  /**
   * Start camera feed if PC has webcam; gracefully ignore if no webcam on PC/monitor
   */
  async startCamera(videoElement, statusIndicatorElement) {
    const check = await this.checkCameraAvailability();

    // 1. If NO webcam hardware exists on this PC/monitor -> IGNORE CAMERA
    if (!check.available) {
      this.hasHardwareCamera = false;
      this.logEvent("CAMERA_IGNORED", "No webcam hardware detected on PC/monitor. Proceeding without camera in external display mode.");
      if (videoElement) {
        const card = videoElement.closest(".proctor-camera-card");
        if (card) {
          card.style.display = "none";
        }
      }
      if (statusIndicatorElement) {
        statusIndicatorElement.innerHTML = `<span class="inline-block w-2 h-2 rounded-full bg-blue-400 mr-1.5"></span>Proctoring Active (No Camera Detected)`;
      }
      return { success: true, hardware: false, ignored: true };
    }

    // Reuse existing stream if active
    if (this.mediaStream && this.mediaStream.active) {
      this.hasHardwareCamera = true;
      if (videoElement) {
        videoElement.srcObject = this.mediaStream;
        videoElement.play().catch(e => console.warn("Video play error:", e));
        const card = videoElement.closest(".proctor-camera-card");
        if (card) {
          card.style.display = "block";
        }
      }
      return { success: true, hardware: true };
    }

    // 2. PC has a webcam -> Request access and stream video locally
    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 320 }, height: { ideal: 240 }, facingMode: "user" },
        audio: false
      });
      this.hasHardwareCamera = true;
      if (videoElement) {
        videoElement.srcObject = this.mediaStream;
        videoElement.play().catch(e => console.warn("Video play error:", e));
        const card = videoElement.closest(".proctor-camera-card");
        if (card) {
          card.style.display = "block";
        }
      }
      if (statusIndicatorElement) {
        statusIndicatorElement.innerHTML = `<span class="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse mr-1.5"></span>Live Webcam Attention Active`;
      }
      this.logEvent("CAMERA_ENABLED", "Local hardware webcam attention indicator active.");
      return { success: true, hardware: true };
    } catch (err) {
      console.warn("Webcam access denied or unavailable, continuing exam:", err.message);
      this.hasHardwareCamera = false;
      this.logEvent("CAMERA_BYPASS", `Camera access failed (${err.message}), continuing in external display mode.`);
      if (videoElement) {
        const card = videoElement.closest(".proctor-camera-card");
        if (card) {
          card.style.display = "none";
        }
      }
      if (statusIndicatorElement) {
        statusIndicatorElement.innerHTML = `<span class="inline-block w-2 h-2 rounded-full bg-amber-400 mr-1.5"></span>Proctoring Active (Camera Bypassed)`;
      }
      return { success: true, hardware: false, ignored: true };
    }
  }

  /**
   * Initialize examination security monitoring
   */
  init(candidateInfo, onViolation, onAutoSubmit, onInterruption) {
    this.candidateInfo = { ...this.candidateInfo, ...candidateInfo };
    this.onViolationCallback = onViolation;
    this.onAutoSubmitCallback = onAutoSubmit;
    this.onInterruptionCallback = onInterruption;
    this.violations = 0;
    this.logs = [];
    this.isActive = true;

    this.bindEvents();
    this.mountSecurityWatermark();
    this.startHeartbeat();
    this.logEvent("EXAM_INITIALIZED", "Candidate launched proctored examination session.");
  }

  bindEvents() {
    // 1. Tab Switching & Browser Minimization Detection
    this.visibilityHandler = () => {
      if (!this.isActive) return;
      if (document.hidden) {
        this.recordViolation("Tab switch or browser minimization detected.");
      }
    };

    // 2. Window Blur (Application Switching, Alt+Tab, Second Screen, Snipping Tool)
    this.blurHandler = () => {
      if (!this.isActive) return;
      // Apply privacy blur shield to deter screen capture of question content
      document.body.classList.add("exam-blur-shield");
      this.recordViolation("Window focus lost (switched application or clicked outside test window).");
    };

    this.focusHandler = () => {
      if (!this.isActive) return;
      document.body.classList.remove("exam-blur-shield");
    };

    // 3. Fullscreen Exit Detection
    this.fullscreenHandler = () => {
      if (!this.isActive) return;
      if (!document.fullscreenElement) {
        this.recordViolation("Exited fullscreen mode. Fullscreen is mandatory.");
      }
    };

    // 4. Anti-Copying: Block Copy, Cut, Paste, Drag-and-Drop & Context Menu
    this.copyHandler = (e) => {
      if (!this.isActive) return;
      e.preventDefault();
      this.recordViolation("Copying test content is strictly prohibited.");
      if (window.appState) window.appState.showToast("Copying content is disabled during examination.", "warning");
    };

    this.pasteHandler = (e) => {
      if (!this.isActive) return;
      e.preventDefault();
      this.recordViolation("Pasting external content is strictly prohibited.");
      if (window.appState) window.appState.showToast("Pasting content is disabled during examination.", "warning");
    };

    this.cutHandler = (e) => {
      if (!this.isActive) return;
      e.preventDefault();
    };

    this.dragHandler = (e) => {
      if (!this.isActive) return;
      e.preventDefault();
    };

    this.contextMenuHandler = (e) => {
      if (!this.isActive) return;
      e.preventDefault();
      this.recordViolation("Right-click context menu is restricted.");
    };

    // 5. Screenshot & Restricted Shortcut Interception
    this.keydownHandler = (e) => {
      if (!this.isActive) return;

      // PrintScreen / Screenshot key
      if (e.key === "PrintScreen" || e.keyCode === 44 || e.code === "PrintScreen" || e.key === "Snapshot") {
        e.preventDefault();
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText("").catch(() => {});
        }
        this.recordViolation("Screenshot attempt detected (PrintScreen is strictly prohibited).");
        return false;
      }

      // Windows Snipping Tool (Win + Shift + S), Mac Screen Capture (Cmd + Shift + 3/4)
      if (
        (e.shiftKey && (e.metaKey || e.ctrlKey) && (e.key === "S" || e.key === "s")) ||
        (e.metaKey && e.shiftKey && (e.key === "3" || e.key === "4" || e.key === "5"))
      ) {
        e.preventDefault();
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText("").catch(() => {});
        }
        this.recordViolation("Screen capture shortcut detected.");
        return false;
      }

      // Prevent Copy / Paste keyboard shortcuts
      if (e.ctrlKey || e.metaKey) {
        const k = e.key.toLowerCase();
        if (k === 'c') {
          e.preventDefault();
          this.recordViolation("Ctrl+C (Copy) is blocked.");
          return false;
        }
        if (k === 'v') {
          e.preventDefault();
          this.recordViolation("Ctrl+V (Paste) is blocked.");
          return false;
        }
        if (k === 'x' || k === 'u' || k === 'p' || k === 's') {
          e.preventDefault();
          this.recordViolation(`Key combination Ctrl+${k.toUpperCase()} is restricted.`);
          return false;
        }
      }

      // Developer Tools (F12, Ctrl+Shift+I/J/C)
      if (
        e.key === "F12" ||
        (e.ctrlKey && e.shiftKey && (e.key === "I" || e.key === "i" || e.key === "J" || e.key === "j" || e.key === "C" || e.key === "c"))
      ) {
        e.preventDefault();
        this.recordViolation("Developer inspection tools are blocked.");
        return false;
      }
    };

    // 6. BeforeUnload: Detect browser close, reload, or navigation interruption
    this.beforeUnloadHandler = (e) => {
      if (!this.isActive) return;
      // Notify server of sudden interruption via sendBeacon
      if (navigator.sendBeacon) {
        const payload = JSON.stringify({
          action: "record_interruption",
          studentId: this.candidateInfo.studentId || 0,
          attemptId: this.candidateInfo.attemptId || 0,
          reason: "Candidate refreshed or closed the browser window before completing examination."
        });
        navigator.sendBeacon("./security-api.php", payload);
      }
      e.preventDefault();
      e.returnValue = "Are you sure you want to exit the exam? Your attempt will be marked as interrupted and require an Admin Recovery Code to resume.";
      return e.returnValue;
    };

    // Attach listeners
    document.addEventListener("visibilitychange", this.visibilityHandler);
    window.addEventListener("blur", this.blurHandler);
    window.addEventListener("focus", this.focusHandler);
    document.addEventListener("fullscreenchange", this.fullscreenHandler);
    document.addEventListener("copy", this.copyHandler);
    document.addEventListener("paste", this.pasteHandler);
    document.addEventListener("cut", this.cutHandler);
    document.addEventListener("dragstart", this.dragHandler);
    document.addEventListener("drop", this.dragHandler);
    document.addEventListener("contextmenu", this.contextMenuHandler);
    window.addEventListener("keydown", this.keydownHandler, true);
    window.addEventListener("beforeunload", this.beforeUnloadHandler);
  }

  /**
   * Mount Subtle Dynamic Watermark with Student Registration ID & Session Token
   */
  mountSecurityWatermark() {
    this.removeSecurityWatermark();

    const regId = this.candidateInfo.registrationId || "COG-2026";
    const sessionToken = this.candidateInfo.sessionToken ? this.candidateInfo.sessionToken.slice(-8) : "SESSION";

    const watermark = document.createElement("div");
    watermark.id = "exam-dynamic-watermark";
    watermark.className = "exam-watermark-overlay";
    watermark.innerHTML = `
      <div class="watermark-pattern">
        <span>${regId} • ${sessionToken}</span>
        <span>${regId} • ${sessionToken}</span>
        <span>${regId} • ${sessionToken}</span>
        <span>${regId} • ${sessionToken}</span>
      </div>
    `;
    document.body.appendChild(watermark);
    this.watermarkElement = watermark;

    // Slowly shift position to deter fixed screenshot crops
    let posX = 0;
    this.watermarkInterval = setInterval(() => {
      posX = (posX + 1) % 40;
      if (this.watermarkElement) {
        this.watermarkElement.style.transform = `translate(${posX}px, ${posX}px)`;
      }
    }, 3000);
  }

  removeSecurityWatermark() {
    if (this.watermarkInterval) {
      clearInterval(this.watermarkInterval);
      this.watermarkInterval = null;
    }
    const existing = document.getElementById("exam-dynamic-watermark");
    if (existing) existing.remove();
  }

  /**
   * Heartbeat to sync active exam session and time left
   */
  startHeartbeat() {
    if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
    this.heartbeatInterval = setInterval(() => {
      if (!this.isActive) return;
      const timeLeft = window.appState ? window.appState.totalExamTimeRemaining : 5400;
      fetch("./security-api.php?action=heartbeat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attemptId: this.candidateInfo.attemptId || 0,
          durationLeft: timeLeft
        })
      }).catch(() => {});
    }, 15000); // sync every 15 seconds
  }

  recordViolation(reason) {
    // Debounce rapid duplicate triggers (within 1 second)
    const now = Date.now();
    if (now - this.lastViolationTime < 1000) return;
    this.lastViolationTime = now;

    this.violations++;
    this.logEvent("PROCTOR_VIOLATION", `${reason} (Strike #${this.violations}/${this.maxViolations})`);

    // Log to server
    fetch("./security-api.php?action=record_violation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        studentId: this.candidateInfo.studentId || 0,
        attemptId: this.candidateInfo.attemptId || 0,
        type: reason.includes("Tab") ? "Tab Switch" : (reason.includes("Screenshot") ? "Screenshot" : "Window Focus"),
        details: reason
      })
    }).catch(() => {});

    if (typeof this.onViolationCallback === "function") {
      this.onViolationCallback(this.violations, this.maxViolations, reason);
    }

    if (this.violations >= this.maxViolations) {
      this.logEvent("AUTO_TERMINATION", "Maximum violation threshold reached (3 strikes). Assessment terminated.");
      if (typeof this.onAutoSubmitCallback === "function") {
        this.onAutoSubmitCallback("Exceeded maximum allowed security violations (3 strikes). Your assessment has been terminated and locked.");
      }
    }
  }

  logEvent(type, message) {
    this.logs.push({
      timestamp: new Date().toISOString(),
      type,
      message
    });
  }

  async requestFullscreen() {
    try {
      const docEl = document.documentElement;
      if (docEl.requestFullscreen) {
        await docEl.requestFullscreen();
        return true;
      } else if (docEl.webkitRequestFullscreen) {
        await docEl.webkitRequestFullscreen();
        return true;
      }
    } catch (err) {
      console.warn("Fullscreen request error:", err);
      return false;
    }
    return false;
  }

  async exitFullscreen() {
    try {
      if (document.fullscreenElement) {
        if (document.exitFullscreen) await document.exitFullscreen();
        else if (document.webkitExitFullscreen) await document.webkitExitFullscreen();
      }
    } catch (err) {}
  }

  stopCamera() {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }
  }

  cleanup() {
    this.isActive = false;
    this.stopCamera();
    this.exitFullscreen();
    this.removeSecurityWatermark();
    if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
    document.body.classList.remove("exam-blur-shield");

    document.removeEventListener("visibilitychange", this.visibilityHandler);
    window.removeEventListener("blur", this.blurHandler);
    window.removeEventListener("focus", this.focusHandler);
    document.removeEventListener("fullscreenchange", this.fullscreenHandler);
    document.removeEventListener("copy", this.copyHandler);
    document.removeEventListener("paste", this.pasteHandler);
    document.removeEventListener("cut", this.cutHandler);
    document.removeEventListener("dragstart", this.dragHandler);
    document.removeEventListener("drop", this.dragHandler);
    document.removeEventListener("contextmenu", this.contextMenuHandler);
    window.removeEventListener("keydown", this.keydownHandler, true);
    window.removeEventListener("beforeunload", this.beforeUnloadHandler);
  }
}

window.proctoring = new ProctoringManager();
