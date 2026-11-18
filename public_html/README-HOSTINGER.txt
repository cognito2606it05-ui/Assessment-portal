================================================================================
COGNITO TECH HUB & QUANTEX RECRUITMENT ASSESSMENT PLATFORM
PRODUCTION UPGRADE & HOSTINGER DEPLOYMENT GUIDE (MASTER PROMPT V2)
Domain: https://contest.cognitoinsights.tech
Verified Resend Sender: noreply@cognitoinsights.tech
Database: u297467125_contest (Host: localhost, User: u297467125_contest)
================================================================================

EXAMINATION ARCHITECTURE & KEY UPGRADES (MASTER PROMPT V2):
--------------------------------------------------------------------------------
1. COMPLETE 23-MODULE ENTERPRISE ADMIN PORTAL:
   - Modern enterprise layout with a responsive left navigation sidebar.
   - Modules:
     1. Dashboard Overview (12 real DB aggregate metrics, branch/college charts)
     2. Student Management (Filtering, search, dossier, block/unblock, reset password)
     3. College Management (AP engineering & degree institutions database)
     4. Course & Branch Management (UG/PG dependent courses & branches)
     5. Task Assignment (Create onboarding/technical tasks, target audience, tracking)
     6. Examination Management (Standardized 3 sections: 100M total • 90 mins)
     7. Exam Scheduling (Batch windows & eligibility mapping)
     8. Question Bank (62 questions across Aptitude, Verbal, Technical, Coding)
     9. Random Paper Generator (Per-attempt snapshot locked in DB for consistency)
     10. Exam Monitoring (Live proctoring supervision & server timing overrides)
     11. Exam Restrictions (Tab switch limit 3, clipboard shield, min 1280px width)
     12. Exam Recovery & Resume Management (Single-use encrypted recovery codes)
     13. Student Answer Sheets (Review MCQ + Coding submissions & test case execution)
     14. Marks Calculation (Sec 1: 40M + Sec 2: 20M + Sec 3: 40M = 100M total)
     15. Live Rankings & Leaderboard (STRICTLY ADMIN-ONLY, percentile, CSV download)
     16. Results Approval (10-Stage result review pipeline)
     17. Results Announcement (One-click "Approve & Publish to Student Portal" toggle)
     18. Candidate Notifications (Broadcast & targeted notices)
     19. Reports & Recruitment Analytics (CSV/PDF performance exports)
     20. Admin User Management (Manage administrator accounts)
     21. Role-Based Access Control (Super Admin, Exam Admin, Evaluator, Student)
     22. System Settings (Exam duration, passing cutoff, webcam policy)
     23. Administrator Audit Logs (Real-time tracking with IP and timestamps)

2. CLEANED LOGIN SCREEN & STRICT RBAC:
   - Zero hardcoded credentials, hints, demo text, or "Fill Admin" buttons.
   - Clean, elevated glass card with password visibility toggle.
   - Strict server-side verification against `admins` and `students` MySQL tables.

3. FIXED COMPLETE REGISTRATION BUTTON END-TO-END:
   - Form input validation with active loading spinner state (`Registering Candidate...`).
   - Prevents double submissions.
   - Inserts into `students`, saves all 8 work preferences, assigns onboarding tasks,
     and initializes the 10-stage result approval tracker.
   - Never claims success without backend confirmation: shows a dedicated Error Modal
     if insertion fails (e.g., duplicate email) and opens the animated Glassmorphism
     Success Popup with confetti upon confirmed database save.

4. MOBILE DEVICE RESTRICTION & FULL MOBILE STUDENT DASHBOARD:
   - Screen width >= 1280px enforced for entering or launching examinations.
   - Displays clear "Desktop or Laptop Required" hardware compliance modal on mobile.
   - Mobile users retain 100% functional access to the Student Dashboard:
     * Candidate profile & academic records
     * Assigned onboarding & practice tasks with due dates
     * 10-Stage Result Announcement Pipeline tracker
     * Official notices & exam schedule

5. OFFLINE EXAMINATION DATA SYNCHRONIZATION:
   - Client-side answers locally cached in IndexedDB / LocalStorage queue.
   - Auto-syncs to `security-api.php?action=sync_offline_answers` when connection restores.
   - Examination timer continues uninterrupted locally during brief drops.

6. CONFIDENTIAL RANKINGS & RESULT PIPELINE:
   - Students NEVER see live marks or provisional rankings before official publication.
   - Candidate dashboard displays current pipeline progress (Stage 1 to 10).
   - Final marks and qualification badges only appear once Super Admin clicks
     "Approve & Publish to Student Portal".

--------------------------------------------------------------------------------
STEP 1: IMPORT DATABASE SCHEMA IN PHPMYADMIN
--------------------------------------------------------------------------------
1. Log in to Hostinger hPanel -> Databases -> Management -> phpMyAdmin.
2. Select database: u297467125_contest
3. Click the "Import" tab on the top navigation bar.
4. Click "Choose File" -> select 'database.sql' from this package.
5. Click "Import" / "Go" at the bottom of the page.
   -> All 26 tables will be created/updated with indexes and initial configurations!

--------------------------------------------------------------------------------
STEP 2: UPLOAD & EXTRACT FILES TO HOSTINGER PUBLIC_HTML
--------------------------------------------------------------------------------
1. In Hostinger hPanel -> Files -> File Manager.
2. Navigate to the root 'public_html' folder of contest.cognitoinsights.tech.
3. Upload 'public_html.zip'.
4. Right-click 'public_html.zip' -> click "Extract" (Extract into the current directory).
5. Ensure the extracted files (index.html, styles.css, app.js, admin.js, etc.) reside
   directly inside 'public_html'.

--------------------------------------------------------------------------------
STEP 3: TEST HEALTH & RUN PORTAL
--------------------------------------------------------------------------------
- Test Database Connection:
  Visit: https://contest.cognitoinsights.tech/db-test.php
- Live Student Portal:
  Visit: https://contest.cognitoinsights.tech/
- Recruiter / Super Admin Portal:
  Email:    admin@cognitoinsights.tech
  Password: Satya@9890

================================================================================
