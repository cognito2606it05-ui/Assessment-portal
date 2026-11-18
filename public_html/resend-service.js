// ==============================================================================
// Resend Email Service Integration (resend.com)
// Domain: contest.cognitoinsights.tech
// Verified Sender: noreply@cognitoinsights.tech
// ==============================================================================

class ResendService {
  constructor() {
    this.storageKey = "COGNITO_RESEND_CONFIG_V2";
    // Clean legacy storage key if present
    try { localStorage.removeItem("QUANTEX_RESEND_CONFIG_V1"); } catch(e) {}

    const isHttp = typeof window !== 'undefined' && window.location && window.location.protocol.startsWith('http');
    const defaultRelay = isHttp ? (window.location.origin + "/send-otp.php") : "http://localhost:5500/api/send-otp";

    this.defaultConfig = {
      apiKey: "",
      senderEmail: "noreply@cognitoinsights.tech",
      senderName: "Cognito Tech Hub",
      relayEndpoint: defaultRelay
    };
    this.config = this.loadConfig();
  }

  loadConfig() {
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.senderEmail === "onboarding@resend.dev") {
          parsed.senderEmail = "noreply@cognitoinsights.tech";
        }
        return { ...this.defaultConfig, ...parsed };
      }
      return { ...this.defaultConfig };
    } catch (e) {
      return { ...this.defaultConfig };
    }
  }

  saveConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.config));
    } catch (e) {
      console.error("Failed to save Resend config:", e);
    }
  }

  /**
   * Dispatch candidate OTP email in real-time via Resend Server Relay
   */
  async sendOtpEmail(recipientEmail, otpCode, candidateName = "Candidate") {
    const startTime = performance.now();

    // Prepare list of relay endpoints
    const origin = (typeof window !== 'undefined' && window.location && window.location.origin) ? window.location.origin : '';
    const endpointsToTry = [
      "./send-otp.php",
      "send-otp.php",
      "/send-otp.php",
      "./api/send-otp.php",
      "/api/send-otp.php",
      "/api/send-otp"
    ];

    if (origin) {
      endpointsToTry.unshift(origin + "/send-otp.php");
      endpointsToTry.push(origin + "/api/send-otp.php");
      endpointsToTry.push(origin + "/api/send-otp");
    }

    if (this.config.relayEndpoint && !endpointsToTry.includes(this.config.relayEndpoint)) {
      endpointsToTry.unshift(this.config.relayEndpoint);
    }

    // Filter unique endpoints
    const uniqueEndpoints = [...new Set(endpointsToTry)];
    let lastError = "Unable to reach server email relay.";

    for (const endpoint of uniqueEndpoints) {
      try {
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: recipientEmail,
            otp: otpCode,
            name: candidateName
          })
        });

        if (res.ok) {
          const data = await res.json();
          const durationMs = Math.round(performance.now() - startTime);

          if (data.success) {
            return {
              success: true,
              provider: "Resend API (cognitoinsights.tech)",
              messageId: data.id || "OK",
              durationMs
            };
          } else {
            lastError = data.error || "Resend email dispatch rejected.";
            return {
              success: false,
              code: data.code || "RESEND_ERROR",
              error: lastError,
              durationMs
            };
          }
        } else {
          lastError = `Server responded with HTTP ${res.status}`;
        }
      } catch (err) {
        lastError = err.message || "Network error";
        // Continue trying alternate endpoint
      }
    }

    return {
      success: false,
      code: "RELAY_UNAVAILABLE",
      error: lastError,
      durationMs: Math.round(performance.now() - startTime)
    };
  }
}

window.resendService = new ResendService();
