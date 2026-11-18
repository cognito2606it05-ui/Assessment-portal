# Quantex Recruitment & Exam Portal 2026

A modern, full-stack proctored recruitment and examination portal tailored for campus and lateral student hiring.

---

## 🌟 Key Features

### 1. Unified Role Auto-Detect Sign-In
- Single unified login interface for both **Students** and **Admin Recruiters**.
- System dynamically detects credentials:
  - Entering Admin credentials routes straight into the **Recruiter Talent Acquisition Dashboard**.
  - Entering Student credentials routes straight into the **Student Exam & Assessment Dashboard**.
- Features one-click **Quick-Fill Demo Credentials** on the login card for instantaneous testing.

### 2. Comprehensive Candidate Registration & Eligibility Consent Form
Captures all required candidate details:
- **Personal & Academic**: Full Name, College/University, Course (B.Tech, M.Tech, MCA, etc.), Stream/Branch, Graduation Year, CGPA.
- **Documents**: Resume upload (PDF/DOCX) + College ID Card upload (Optional).
- **Interactive Email OTP Verification**: Real working OTP workflow with a 6-digit code generator, 60-second resend countdown timer, and verification checkmark.
- **Mobile Number**: Standard contact field (no OTP required).
- **Technical Profiling**: Skills tag input and Domain of Interest (Full Stack, Backend, Data Science & AI, DevOps, QA, etc.).
- **Consent & Screening Questionnaire**:
  - Full-time employment interest (Yes / Open to both / No).
  - **3-Month Unpaid Internship (Work From Office) Consent**: Structured scenario choices (Agreed to WFO to upskill for absorption, Hybrid/Remote preference, or Declined).
  - **Academic Backlogs Screening**: Conditional disclosure of active backlogs count and subject details.
  - **Semester Exam Clash**: Disclosure of university semester exam dates that fall during the internship window.
  - **Scenario-Based Screening Question**: Learning agility assessment on how the candidate ramps up on a new tech stack in 14 days.

### 3. Strictly Sequential Proctored Examination (5 Sections)
Candidates proceed through 5 sections **one after another**. Once a section is submitted, it locks to maintain test integrity:
1. **Section 1: Quantitative & Logical Aptitude (5 MCQs - 12 mins)**: Data pipelines, percentage set theory, sequences, compensation math, logical conclusions.
2. **Section 2: Technical Core Knowledge (5 MCQs - 13 mins)**: Balanced trees, ACID atomicity, OS threads vs processes, HTTP multiplexing, JavaScript microtasks/event loop.
3. **Section 3: Real-World Scenario Engineering Problem (1 Case Study - 15 mins)**:
   - High-traffic flash sale failure & overselling bug triage under 200k concurrent users.
   - Candidate writes structured architectural solution (Redis DECR, Kafka message queue, customer remediation).
   - Word counter and automated keyword heuristics evaluation.
4. **Section 4: Technical Coding Challenge (2 Problems - 25 mins)**:
   - **Problem 1**: Longest Substring with At Most K Distinct Characters.
   - **Problem 2**: Meeting Room Conflict & Interval Consolidation.
   - Interactive Monaco-style code editor with line numbers, reset template, and multi-language support (**JavaScript, Python 3, Java 17, C++ 20**).
   - Live **Run Code** against visible test cases and **Submit Code** against hidden edge cases with real runtime metrics.
5. **Section 5: Situational & Behavioral Assessment (3 Questions - 10 mins)**:
   - Workplace scenarios on security vs tight deadlines, STAR method tech learning, and peer code review criticism.

### 4. Enterprise Proctoring Engine
- Fullscreen enforcement.
- Tab-switch and window defocus detection (logs warnings with a 3-strike limit).
- Live webcam integration with floating PIP video feed and recording pulse indicator.
- Inspection shortcut blocking (F12, Ctrl+Shift+I, right-click context menu).

### 5. Recruiter & Admin Management Portal
- **Talent Acquisition KPIs**: Total Registered, Assigned Tests, Completed, Shortlisted, Backlogs, WFO Consent rate.
- **Dynamic Filters & Search**: Search by name, college, email, or skills; filter by Backlogs, Exam Clash, and 3-Month Unpaid Internship consent.
- **One-Click Test Assignment & Bulk Assignment**.
- **Candidate Dossier Modal**:
  - Academic history and downloadable resume.
  - Full consent questionnaire responses.
  - Detailed score breakdown across all 5 sections.
  - Submitted source code inspection for Coding Q1 & Q2.
  - Submitted architecture scenario answer.
  - Recruiter rubric evaluation and status management (Shortlist, Waitlist, Reject).
  - Print/Export official candidate assessment scorecard.
- **Assessment Question Bank Explorer**: View and manage all 5 sections.
- **CSV Data Export**: One-click download of the candidate roster and results.

---

## 🚀 Quick Start / How to Run

1. Open [index.html](file:///c:/Users/udaya/OneDrive/Desktop/ASSESSMENT%20PORTAL/index.html) directly in any modern web browser (Edge, Chrome, Firefox, Brave).
2. Demo Accounts:
   - **Admin Recruiter**: `admin@quantex.com` / `admin` (or click "Admin Recruiter" quick button).
   - **Student (Assigned Test ready to take)**: `ananya.sen@example.com` / `password123` (or click "Student Test Ready" quick button).
   - **Student (Completed with Scorecard)**: `rahul.verma@example.com` / `password123`.
   - **New Student**: Click "Student Registration" to register a candidate with live OTP email verification.

---

## 📧 Resend API Email Integration & Testing

The portal integrates Resend REST API (`https://api.resend.com/emails`) for real-time candidate email verification and OTP delivery:
- **Configured Master Key**: Set via `.env` (`RESEND_API_KEY=your_resend_api_key_here`)
- **Default Sender**: `Quantex Assessment Portal <onboarding@resend.dev>`
- **Verified Account Email**: `cognito.2603it01@gmail.com`
- **Local Relay Server**: Runs on `http://localhost:5500/api/send-otp` (`server.ps1`).
- **Live Web UI Tester**:
  1. Sign in as Admin (`admin@quantex.com` / `admin`).
  2. Navigate to the **"Resend Email API & Live Tester"** tab.
  3. Enter recipient email address (e.g. `cognito.2603it01@gmail.com`) and click **"Send Test Email"**.
  4. View live HTTP response status, round-trip latency, and Resend delivery message ID in the console.
- **Command-Line Testing**:
  - Run `./test-resend.ps1 -Recipient "cognito.2603it01@gmail.com"` to test immediate delivery to your verified email.
- **Domain Verification**:
  - Resend's free tier sender `onboarding@resend.dev` delivers live emails directly to your Resend account email (`cognito.2603it01@gmail.com`).
  - To deliver to any student email address across different domains (Gmail, college domains, etc.), verify a custom domain at [resend.com/domains](https://resend.com/domains).


