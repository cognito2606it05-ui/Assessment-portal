-- ==============================================================================
-- Cognito Tech Hub × Quantex Assessment Platform
-- Safe Database Migration Script v2026.4
-- Target DB: u297467125_contest | Safe, Non-Destructive, Idempotent
-- ==============================================================================

SET FOREIGN_KEY_CHECKS = 1;

-- 1. Ensure students table has all necessary tracking columns
ALTER TABLE `students` 
  ADD COLUMN IF NOT EXISTS `is_blocked` TINYINT(1) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS `is_active` TINYINT(1) DEFAULT 1,
  ADD COLUMN IF NOT EXISTS `college_district` VARCHAR(100) DEFAULT 'Andhra Pradesh',
  ADD COLUMN IF NOT EXISTS `college_type` VARCHAR(100) DEFAULT 'Autonomous Engineering',
  ADD COLUMN IF NOT EXISTS `current_semester` VARCHAR(20) DEFAULT 'Final Year',
  ADD COLUMN IF NOT EXISTS `domain_interest` VARCHAR(100) DEFAULT 'Full Stack Engineering';

-- 2. Ensure assessments table has rubric tracking columns
ALTER TABLE `assessments`
  ADD COLUMN IF NOT EXISTS `coding_q1_score` DECIMAL(5,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS `coding_q2_score` DECIMAL(5,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS `coding_q1_lang` VARCHAR(20) DEFAULT 'python',
  ADD COLUMN IF NOT EXISTS `coding_q2_lang` VARCHAR(20) DEFAULT 'python',
  ADD COLUMN IF NOT EXISTS `coding_q1_code` LONGTEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `coding_q2_code` LONGTEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `test_cases_passed` INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS `recruiter_status` VARCHAR(50) DEFAULT 'Evaluated',
  ADD COLUMN IF NOT EXISTS `recruiter_notes` TEXT DEFAULT NULL;

-- 3. Ensure student tasks and task assignments tables exist
CREATE TABLE IF NOT EXISTS `student_tasks` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT NOT NULL,
  `task_type` VARCHAR(100) DEFAULT 'Technical Assignment',
  `priority` ENUM('Low', 'Medium', 'High', 'Urgent') DEFAULT 'Medium',
  `due_date` DATETIME NOT NULL,
  `target_type` ENUM('all', 'course', 'branch', 'college', 'student') DEFAULT 'all',
  `target_value` VARCHAR(255) DEFAULT '',
  `instructions` TEXT DEFAULT NULL,
  `status` ENUM('Draft', 'Assigned', 'In Progress', 'Completed', 'Closed') DEFAULT 'Assigned',
  `created_by` VARCHAR(100) DEFAULT 'Lead Recruiter',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `student_task_assignments` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `task_id` INT NOT NULL,
  `student_id` INT NOT NULL,
  `status` ENUM('Assigned', 'In Progress', 'Submitted', 'Completed', 'Overdue') DEFAULT 'Assigned',
  `submission_url` VARCHAR(500) DEFAULT NULL,
  `notes` TEXT DEFAULT NULL,
  `assigned_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `completed_at` DATETIME DEFAULT NULL,
  UNIQUE KEY `idx_task_student` (`task_id`, `student_id`),
  FOREIGN KEY (`task_id`) REFERENCES `student_tasks`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Ensure exam paper snapshots table exists
CREATE TABLE IF NOT EXISTS `exam_paper_snapshots` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `exam_id` INT NOT NULL,
  `student_id` INT NOT NULL,
  `paper_hash` VARCHAR(64) NOT NULL,
  `question_ids_json` LONGTEXT NOT NULL,
  `section_1_qids` TEXT DEFAULT NULL,
  `section_2_qids` TEXT DEFAULT NULL,
  `section_3_qids` TEXT DEFAULT NULL,
  `is_locked` TINYINT(1) DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `idx_exam_student_snap` (`exam_id`, `student_id`),
  FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Ensure exam timing overrides table exists
CREATE TABLE IF NOT EXISTS `exam_timing_overrides` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `attempt_id` INT NOT NULL,
  `student_id` INT NOT NULL,
  `admin_id` INT DEFAULT 1,
  `action_type` ENUM('extend_time', 'reduce_time', 'pause_exam', 'resume_exam') NOT NULL,
  `extra_seconds` INT NOT NULL DEFAULT 0,
  `reason` VARCHAR(255) NOT NULL,
  `authorized_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Ensure answer sheet evaluations table exists
CREATE TABLE IF NOT EXISTS `answer_sheet_evaluations` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `assessment_id` INT NOT NULL,
  `student_id` INT NOT NULL,
  `evaluator_id` INT DEFAULT 1,
  `sec1_manual_marks` DECIMAL(5,2) DEFAULT NULL,
  `sec2_manual_marks` DECIMAL(5,2) DEFAULT NULL,
  `sec3_manual_marks` DECIMAL(5,2) DEFAULT NULL,
  `total_override_marks` DECIMAL(5,2) DEFAULT NULL,
  `evaluation_status` ENUM('Pending Review', 'Under Review', 'Verified', 'Flagged', 'Approved') DEFAULT 'Pending Review',
  `evaluator_comments` TEXT DEFAULT NULL,
  `code_quality_rating` ENUM('1 - Poor', '2 - Fair', '3 - Good', '4 - Very Good', '5 - Exceptional') DEFAULT '4 - Very Good',
  `evaluated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `idx_eval_assessment` (`assessment_id`),
  FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Ensure result approvals table exists
CREATE TABLE IF NOT EXISTS `result_approvals` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `student_id` INT NOT NULL UNIQUE,
  `section_1_score` DECIMAL(5,2) DEFAULT 0,
  `section_2_score` DECIMAL(5,2) DEFAULT 0,
  `section_3_score` DECIMAL(5,2) DEFAULT 0,
  `total_score` DECIMAL(5,2) DEFAULT 0,
  `is_qualified` TINYINT(1) DEFAULT 0,
  `stage_status` ENUM(
    '1. Registered',
    '2. Identity Verified',
    '3. Assessment Submitted',
    '4. Auto-Scored',
    '5. Proctoring Audited',
    '6. Code Evaluated',
    '7. Committee Reviewed',
    '8. Recruiter Approved',
    '9. Board Finalized',
    '10. Published to Student Portal'
  ) DEFAULT '3. Assessment Submitted',
  `approver_id` INT DEFAULT 1,
  `is_published_to_student` TINYINT(1) DEFAULT 0,
  `remarks` TEXT DEFAULT NULL,
  `announcement_time` DATETIME DEFAULT NULL,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Ensure notifications table exists
CREATE TABLE IF NOT EXISTS `notifications` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `message` TEXT NOT NULL,
  `target_type` ENUM('all', 'course', 'branch', 'college', 'student') DEFAULT 'all',
  `target_value` VARCHAR(255) DEFAULT '',
  `priority` ENUM('Normal', 'Urgent', 'Critical') DEFAULT 'Normal',
  `created_by` VARCHAR(100) DEFAULT 'Lead Recruiter',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Ensure audit logs table exists
CREATE TABLE IF NOT EXISTS `audit_logs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `admin_id` INT DEFAULT 1,
  `admin_email` VARCHAR(191) NOT NULL,
  `action` VARCHAR(100) NOT NULL,
  `target_type` VARCHAR(50) NOT NULL,
  `target_id` VARCHAR(100) DEFAULT NULL,
  `details` TEXT DEFAULT NULL,
  `ip_address` VARCHAR(45) DEFAULT '127.0.0.1',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. Ensure system settings table exists
CREATE TABLE IF NOT EXISTS `system_settings` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `setting_key` VARCHAR(100) NOT NULL UNIQUE,
  `setting_value` TEXT NOT NULL,
  `category` VARCHAR(50) DEFAULT 'general',
  `description` VARCHAR(255) DEFAULT NULL,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed system settings idempotently
INSERT INTO `system_settings` (`setting_key`, `setting_value`, `category`, `description`) VALUES
('exam_duration_mins', '90', 'exam', 'Default duration for assessment in minutes'),
('passing_marks_threshold', '40', 'evaluation', 'Minimum passing marks out of 100'),
('tab_switch_strike_limit', '3', 'security', 'Maximum allowed tab switches before auto-submit'),
('min_screen_width_px', '1280', 'security', 'Minimum required display width in pixels'),
('adaptive_webcam_enforced', '1', 'security', 'Enforce adaptive webcam detection with fallback'),
('clipboard_shield_active', '1', 'security', 'Block clipboard copying, cut, paste, and screenshots'),
('maintenance_mode', '0', 'general', 'Portal maintenance mode (1=enabled, 0=disabled)')
ON DUPLICATE KEY UPDATE `description` = VALUES(`description`);

-- 11. Ensure Admins table exists and administrator credentials are functional
CREATE TABLE IF NOT EXISTS `admins` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(150) NOT NULL,
  `email` VARCHAR(191) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `role` ENUM('super_admin', 'exam_admin', 'evaluator') DEFAULT 'super_admin',
  `status` ENUM('active', 'inactive') DEFAULT 'active',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Idempotent Admin Accounts Seed (supports Admin@2026 and Satya@9890)
INSERT INTO `admins` (`name`, `email`, `password_hash`, `role`, `status`) VALUES
('Lead Recruiter', 'admin@cognitoinsights.tech', 'Admin@2026', 'super_admin', 'active'),
('Quantex Admin', 'admin@quantex.com', 'Admin@2026', 'exam_admin', 'active')
ON DUPLICATE KEY UPDATE 
  `password_hash` = VALUES(`password_hash`),
  `status` = 'active';

-- Add subject, topic, explanation columns if missing
ALTER TABLE `questions` ADD COLUMN IF NOT EXISTS `subject` VARCHAR(100) DEFAULT 'Technical Core Knowledge' AFTER `category`;
ALTER TABLE `questions` ADD COLUMN IF NOT EXISTS `topic` VARCHAR(100) DEFAULT 'General' AFTER `subject`;
ALTER TABLE `questions` ADD COLUMN IF NOT EXISTS `explanation` TEXT DEFAULT NULL AFTER `branch_target`;
ALTER TABLE `questions` MODIFY COLUMN `category` VARCHAR(100) NOT NULL DEFAULT 'Technical-CSE';


-- ------------------------------------------------------------------------------
-- Official Assessment Exam Paper (20 Technical Questions across Python, C, C++, SQL, Java)
-- Source: Technical_Practice_Python_C_Cpp_SQL_Java.pdf
-- ------------------------------------------------------------------------------
INSERT INTO `questions` (`id`, `section_code`, `category`, `subject`, `topic`, `question_text`, `option_a`, `option_b`, `option_c`, `option_d`, `correct_option`, `marks`, `difficulty`, `branch_target`, `explanation`) VALUES
(1, 'sec-2', 'Technical-Python', 'Technical Core Knowledge', 'Python', 'Which feature allows Python to support multiple programming paradigms?', 'Only procedural programming', 'Object-oriented, procedural and functional programming', 'Only object-oriented programming', 'Only functional programming', 'B', 1.0, 'Easy', 'ALL', 'Python supports object-oriented, procedural and functional styles, so it is a multi-paradigm language.'),
(2, 'sec-2', 'Technical-Python', 'Technical Core Knowledge', 'Python', 'What is the primary purpose of decorators in Python?', 'To delete objects', 'To modify or extend function or class behavior without directly changing their implementation', 'To create database tables', 'To allocate memory', 'B', 1.0, 'Medium', 'ALL', 'A decorator wraps a function or class to add behavior (logging, caching, access checks) without editing its source.'),
(3, 'sec-2', 'Technical-Python', 'Technical Core Knowledge', 'Python', 'Which of the following best describes Python''s garbage collection?', 'It manually deletes all variables', 'It automatically manages memory and reclaims unreachable objects', 'It prevents memory allocation', 'It stores all objects permanently', 'B', 1.0, 'Medium', 'ALL', 'CPython uses reference counting plus a cyclic garbage collector to free objects that can no longer be reached.'),
(4, 'sec-2', 'Technical-Python', 'Technical Core Knowledge', 'Python', 'What is the primary difference between an iterator and an iterable in Python?', 'Both are exactly the same', 'An iterable can provide an iterator, while an iterator produces elements one at a time', 'An iterator stores only strings', 'An iterable cannot be used in loops', 'B', 1.0, 'Medium', 'ALL', 'An iterable (list, tuple, str) implements __iter__ and returns an iterator; the iterator implements __next__ to yield items one by one.'),
(5, 'sec-2', 'Technical-C', 'Technical Core Knowledge', 'C Programming', 'What is the main difference between call by value and call by reference concepts?', 'Both always modify the original variable', 'Call by value passes a copy, while reference-based approaches allow modification of the original object', 'Call by value uses pointers only', 'Both are used only for arrays', 'B', 1.0, 'Easy', 'ALL', 'Call by value gives the function a copy, so the caller''s variable is unchanged. Passing an address (pointer) lets the function modify the original. C itself is strictly pass-by-value.'),
(6, 'sec-2', 'Technical-C', 'Technical Core Knowledge', 'C Programming', 'Which of the following is the main purpose of a function pointer in C?', 'To store integer values', 'To store the address of a function and enable indirect function calls', 'To allocate memory', 'To declare global variables', 'B', 1.0, 'Medium', 'ALL', 'A function pointer holds a function''s address, enabling callbacks and dispatch tables.'),
(7, 'sec-2', 'Technical-C', 'Technical Core Knowledge', 'C Programming', 'What is the main difference between stack and heap memory?', 'Stack is generally used for automatic local storage, while heap supports dynamic memory allocation', 'Both are used only for global variables', 'Heap memory is always faster than stack memory', 'Stack memory is dynamically allocated using malloc()', 'A', 1.0, 'Easy', 'ALL', 'The stack holds local variables and call frames automatically. The heap is used for dynamic allocation (malloc/free) and is usually slower to manage.'),
(8, 'sec-2', 'Technical-C', 'Technical Core Knowledge', 'C Programming', 'What is the purpose of a preprocessor directive in C?', 'To execute machine instructions', 'To perform preprocessing tasks such as including headers and defining macros', 'To allocate heap memory', 'To execute database queries', 'B', 1.0, 'Easy', 'ALL', 'Directives like #include and #define are handled before compilation to include files and expand macros.'),
(9, 'sec-2', 'Technical-CPP', 'Technical Core Knowledge', 'C++', 'Which OOP principle allows a class to acquire properties and methods from another class?', 'Encapsulation', 'Abstraction', 'Inheritance', 'Polymorphism', 'C', 1.0, 'Easy', 'ALL', 'Inheritance lets a derived class reuse and extend the members of a base class.'),
(10, 'sec-2', 'Technical-CPP', 'Technical Core Knowledge', 'C++', 'What is the main advantage of using constructors in C++?', 'They destroy objects automatically', 'They initialize objects when they are created', 'They prevent inheritance', 'They execute only when a program terminates', 'B', 1.0, 'Easy', 'ALL', 'A constructor runs automatically at object creation to put the object in a valid initial state. Destructors handle cleanup.'),
(11, 'sec-2', 'Technical-CPP', 'Technical Core Knowledge', 'C++', 'What is the diamond problem in C++?', 'A memory allocation error', 'An ambiguity that can arise when a class inherits from two classes that share a common base class', 'A problem with function overloading', 'An error caused by pointers', 'B', 1.0, 'Medium', 'ALL', 'With multiple inheritance, the shared base can be inherited twice, making member access ambiguous. Virtual inheritance resolves it.'),
(12, 'sec-2', 'Technical-CPP', 'Technical Core Knowledge', 'C++', 'Which feature of C++ allows generic programming?', 'Templates', 'Destructors', 'Friend functions', 'Namespaces', 'A', 1.0, 'Easy', 'ALL', 'Templates let functions and classes work with any data type, with the type fixed at compile time.'),
(13, 'sec-2', 'Technical-SQL', 'Technical Core Knowledge', 'SQL', 'What is the main purpose of a database view?', 'To permanently delete records', 'To provide a virtual table based on a query', 'To allocate memory', 'To create a physical backup automatically', 'B', 1.0, 'Easy', 'ALL', 'A view is a stored query that behaves like a table, useful for simplifying queries and restricting access.'),
(14, 'sec-2', 'Technical-SQL', 'Technical Core Knowledge', 'SQL', 'Which SQL constraint ensures that a column cannot contain NULL values?', 'UNIQUE', 'CHECK', 'NOT NULL', 'DEFAULT', 'C', 1.0, 'Easy', 'ALL', 'NOT NULL forces every row to have a value in that column.'),
(15, 'sec-2', 'Technical-SQL', 'Technical Core Knowledge', 'SQL', 'What is the main purpose of database normalization?', 'To increase data duplication', 'To reduce data redundancy and improve data integrity', 'To delete all duplicate tables', 'To increase the number of columns', 'B', 1.0, 'Easy', 'ALL', 'Normalization organizes data into related tables to remove redundancy and avoid update, insert and delete anomalies.'),
(16, 'sec-2', 'Technical-SQL', 'Technical Core Knowledge', 'SQL', 'Which SQL command is used to modify the structure of an existing table?', 'UPDATE', 'INSERT', 'ALTER', 'SELECT', 'C', 1.0, 'Easy', 'ALL', 'ALTER TABLE adds, drops or changes columns and constraints. UPDATE and INSERT change data, not structure.'),
(17, 'sec-2', 'Technical-Java', 'Technical Core Knowledge', 'Java', 'What is the main difference between an abstract class and an interface in Java?', 'Both cannot contain methods', 'An abstract class can maintain instance state and constructors, while an interface defines a contract and can also contain default and static methods', 'An interface can be instantiated directly', 'An abstract class cannot have implemented methods', 'B', 1.0, 'Medium', 'ALL', 'Abstract classes can have instance fields and constructors. Interfaces define a contract (with default and static methods since Java 8) and cannot hold instance state. Neither can be instantiated directly.'),
(18, 'sec-2', 'Technical-Java', 'Technical Core Knowledge', 'Java', 'Which Java collection is best suited for storing key-value pairs?', 'ArrayList', 'HashMap', 'HashSet', 'LinkedList', 'B', 1.0, 'Easy', 'ALL', 'HashMap stores key-value pairs with average O(1) lookup by key.'),
(19, 'sec-2', 'Technical-Java', 'Technical Core Knowledge', 'Java', 'What is the purpose of the finally block in Java exception handling?', 'To declare variables', 'To execute cleanup code after try/catch processing, subject to JVM termination conditions', 'To create exceptions', 'To stop program execution permanently', 'B', 1.0, 'Easy', 'ALL', 'finally runs whether or not an exception occurs, typically for cleanup. It may not run if the JVM exits (e.g. System.exit) or crashes.'),
(20, 'sec-2', 'Technical-Java', 'Technical Core Knowledge', 'Java', 'What is the primary purpose of the synchronized keyword in Java?', 'To create new classes', 'To control concurrent access to shared resources', 'To improve database connectivity', 'To stop inheritance', 'B', 1.0, 'Medium', 'ALL', 'synchronized lets only one thread at a time execute a block or method guarded by the same lock, preventing race conditions.')
ON DUPLICATE KEY UPDATE
  `question_text` = VALUES(`question_text`),
  `option_a` = VALUES(`option_a`),
  `option_b` = VALUES(`option_b`),
  `option_c` = VALUES(`option_c`),
  `option_d` = VALUES(`option_d`),
  `correct_option` = VALUES(`correct_option`),
  `explanation` = VALUES(`explanation`);


-- ------------------------------------------------------------------------------
-- Official Section 1 Question Bank: 40 Questions (Quantitative, Logical, Verbal)
-- Source: B.Tech Placement Aptitude Practice – Combined Edition
-- ------------------------------------------------------------------------------
INSERT INTO `questions` (`id`, `section_code`, `category`, `subject`, `topic`, `question_text`, `option_a`, `option_b`, `option_c`, `option_d`, `correct_option`, `marks`, `difficulty`, `branch_target`, `explanation`) VALUES
-- PART 1: ARITHMETIC APTITUDE (1 - 10)
(101, 'sec-1', 'Quantitative', 'Quantitative Aptitude', 'Time and Distance', 'A train 180 m long crosses a 270 m platform in 18 seconds. What is its speed?', '80 km/h', '85 km/h', '90 km/h', '100 km/h', 'C', 1.0, 'Easy', 'ALL', 'Total distance = 180 + 270 = 450 m. Speed = 450/18 = 25 m/s. In km/h: 25 × 18/5 = 90 km/h.'),
(102, 'sec-1', 'Quantitative', 'Quantitative Aptitude', 'Time and Work', 'A can finish a job in 12 days and B in 18 days. How long will they take working together?', '6 days', '7.2 days', '8 days', '9 days', 'B', 1.0, 'Easy', 'ALL', 'Combined daily work = 1/12 + 1/18 = 3/36 + 2/36 = 5/36. Time = 36/5 = 7.2 days.'),
(103, 'sec-1', 'Quantitative', 'Quantitative Aptitude', 'Profit and Loss', 'An item marked 40% above cost price is sold after successive discounts of 10% and 5%. Find the profit percentage.', '19.7%', '20%', '21%', '22%', 'A', 1.0, 'Medium', 'ALL', 'Assume CP = 100. Marked price = 140. Selling price = 140 × 0.90 × 0.95 = 119.70. Profit = 19.70, so profit % = 19.7%.'),
(104, 'sec-1', 'Quantitative', 'Quantitative Aptitude', 'Averages', 'The average of 8 numbers is 24. If 32 is removed, what is the average of the remaining numbers?', '22', '22 6/7', '23', '23 1/7', 'B', 1.0, 'Medium', 'ALL', 'Original total = 8 × 24 = 192. Remaining total = 192 − 32 = 160. New average = 160/7 = 22 6/7.'),
(105, 'sec-1', 'Quantitative', 'Quantitative Aptitude', 'Compound Interest', 'A sum amounts to ₹12,100 in 2 years at 10% compound interest per annum. What was the principal?', '₹9,000', '₹10,000', '₹10,500', '₹11,000', 'B', 1.0, 'Easy', 'ALL', 'A = P(1 + 10/100)² = 1.21P. Therefore P = 12,100/1.21 = ₹10,000.'),
(106, 'sec-1', 'Quantitative', 'Quantitative Aptitude', 'Ratios & Mixtures', 'A 30-litre mixture has milk and water in the ratio 2:1. How much water must be added to make the ratio 1:1?', '5 L', '10 L', '15 L', '20 L', 'B', 1.0, 'Easy', 'ALL', 'Milk = 30 × 2/3 = 20 L; water = 10 L. For a 1:1 ratio, water must become 20 L. Add 10 L.'),
(107, 'sec-1', 'Quantitative', 'Quantitative Aptitude', 'Number Systems', 'A number leaves remainder 5 when divided by 8. What remainder will three times the number leave when divided by 8?', '1', '3', '5', '7', 'D', 1.0, 'Easy', 'ALL', 'Write n = 8k + 5. Then 3n = 24k + 15 = 8(3k + 1) + 7. Remainder = 7.'),
(108, 'sec-1', 'Quantitative', 'Quantitative Aptitude', 'Ratio & Proportion', 'The incomes of A and B are in the ratio 3:4 and their expenses are in the ratio 2:3. If each saves ₹6,000, find A''s income.', '₹12,000', '₹15,000', '₹18,000', '₹20,000', 'C', 1.0, 'Medium', 'ALL', 'Let incomes be 3k and 4k. Expenses are (3k − 6000) and (4k − 6000) in ratio 2:3, so 3(3k − 6000) = 2(4k − 6000) → 9k − 18000 = 8k − 12000 → k = 6000. A''s income = 3k = ₹18,000.'),
(109, 'sec-1', 'Quantitative', 'Quantitative Aptitude', 'Speed & Distance', 'A car travels equal distances at 40 km/h and 60 km/h. What is its average speed for the whole journey?', '45 km/h', '48 km/h', '50 km/h', '52 km/h', 'B', 1.0, 'Easy', 'ALL', 'For equal distances, average speed = 2uv/(u+v) = 2×40×60/(40+60) = 4,800/100 = 48 km/h.'),
(110, 'sec-1', 'Quantitative', 'Quantitative Aptitude', 'Probability', 'Two dice are rolled. What is the probability that their sum is 9?', '1/6', '1/9', '1/12', '5/36', 'B', 1.0, 'Easy', 'ALL', 'There are 36 equally likely outcomes. Sum 9 occurs in (3,6), (4,5), (5,4), (6,3): 4 outcomes. Probability = 4/36 = 1/9.'),

-- PART 2: LOGICAL REASONING (11 - 20)
(111, 'sec-1', 'Analytical', 'Logical Reasoning', 'Number Series', 'Find the next number: 3, 8, 15, 24, 35, __', '46', '48', '50', '52', 'B', 1.0, 'Easy', 'ALL', 'Differences are 5, 7, 9, 11. The next difference is 13. So 35 + 13 = 48.'),
(112, 'sec-1', 'Analytical', 'Logical Reasoning', 'Coding-Decoding', 'If TABLE is coded as UBCMF (each letter shifted one place forward), how is CHAIR coded?', 'DIBJS', 'DIBIR', 'BGZHQ', 'DHCJS', 'A', 1.0, 'Easy', 'ALL', 'Shift each letter forward by one: C→D, H→I, A→B, I→J, R→S. Code = DIBJS.'),
(113, 'sec-1', 'Analytical', 'Logical Reasoning', 'Direction Sense', 'Ravi is facing north. He turns right, walks 10 m, turns right and walks 5 m, then turns left and walks 3 m. Which direction is he facing?', 'North', 'South', 'East', 'West', 'C', 1.0, 'Easy', 'ALL', 'From north, a right turn = east. Second right = south. A left turn from south = east.'),
(114, 'sec-1', 'Analytical', 'Logical Reasoning', 'Blood Relations', 'Pointing to a woman, Arun says, ''She is the daughter of my father''s only son.'' How is the woman related to Arun?', 'Sister', 'Daughter', 'Niece', 'Mother', 'B', 1.0, 'Easy', 'ALL', 'Arun''s father''s only son is Arun himself. The woman''s parent is Arun, so she is his daughter.'),
(115, 'sec-1', 'Analytical', 'Logical Reasoning', 'Odd One Out', 'Choose the odd one out.', '16', '25', '49', '63', 'D', 1.0, 'Easy', 'ALL', '16, 25 and 49 are perfect squares (4², 5², 7²). 63 is not a perfect square.'),
(116, 'sec-1', 'Analytical', 'Logical Reasoning', 'Syllogism', 'Statements: All engineers are graduates. Some graduates are artists. Conclusion I: Some engineers are artists. Conclusion II: All engineers are graduates.', 'Only I follows', 'Only II follows', 'Both follow', 'Neither follows', 'B', 1.0, 'Medium', 'ALL', 'Conclusion II repeats the first statement, so it follows. The artists may or may not be engineers, so Conclusion I does not necessarily follow.'),
(117, 'sec-1', 'Analytical', 'Logical Reasoning', 'Seating Arrangement', 'Five people P, Q, R, S and T sit in a row. P is left of Q. R is right of Q. S is left of P. T is right of R. Who sits in the middle?', 'P', 'Q', 'R', 'S', 'B', 1.0, 'Medium', 'ALL', 'The order is S, P, Q, R, T. The third (middle) position is Q.'),
(118, 'sec-1', 'Analytical', 'Logical Reasoning', 'Letter Series', 'Find the missing term: AZ, BY, CX, DW, __', 'EU', 'EV', 'FU', 'EX', 'B', 1.0, 'Easy', 'ALL', 'First letters move forward A, B, C, D, E. Second letters move backward Z, Y, X, W, V. Missing pair = EV.'),
(119, 'sec-1', 'Analytical', 'Logical Reasoning', 'Calendar', 'If 1 January is a Monday, what day will 1 February be in a non-leap year?', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'C', 1.0, 'Medium', 'ALL', 'January has 31 days. 31 ÷ 7 leaves remainder 3. Moving 3 days forward from Monday gives Thursday.'),
(120, 'sec-1', 'Analytical', 'Logical Reasoning', 'Order & Ranking', 'A is taller than B. C is taller than A. D is shorter than B. Who is the tallest?', 'A', 'B', 'C', 'D', 'C', 1.0, 'Easy', 'ALL', 'The relationships are C > A > B > D. Therefore C is tallest.'),

-- PART 3: VERBAL ABILITY (21 - 40)
(121, 'sec-1', 'Verbal', 'Verbal Ability', 'Grammar & Subject-Verb Agreement', 'Choose the grammatically correct sentence.', 'Each of the students have submitted the assignment.', 'Each of the students has submitted the assignment.', 'Each students has submitted the assignment.', 'Each of students have submitted assignment.', 'B', 1.0, 'Easy', 'ALL', '''Each'' is singular and takes a singular verb, so ''has'' is correct.'),
(122, 'sec-1', 'Verbal', 'Verbal Ability', 'Synonyms', 'Choose the synonym of ''Meticulous''.', 'Careless', 'Thorough', 'Hasty', 'Ordinary', 'B', 1.0, 'Easy', 'ALL', 'Meticulous means very careful and precise, paying attention to detail. ''Thorough'' is the closest synonym.'),
(123, 'sec-1', 'Verbal', 'Verbal Ability', 'Antonyms', 'Choose the antonym of ''Scarce''.', 'Rare', 'Limited', 'Abundant', 'Insufficient', 'C', 1.0, 'Easy', 'ALL', '''Scarce'' means not enough or available in small quantities. ''Abundant'' means plentiful.'),
(124, 'sec-1', 'Verbal', 'Verbal Ability', 'Subject-Verb Agreement', 'Fill in the blank: Neither the manager nor the employees ____ willing to postpone the meeting.', 'is', 'was', 'are', 'has', 'C', 1.0, 'Easy', 'ALL', 'With ''neither…nor'', the verb agrees with the nearer subject. ''Employees'' is plural, so use ''are''.'),
(125, 'sec-1', 'Verbal', 'Verbal Ability', 'Punctuation', 'Choose the correctly punctuated sentence.', 'Its raining, take an umbrella.', 'It''s raining; take an umbrella.', 'Its raining; take an umbrella.', 'It''s raining take, an umbrella.', 'B', 1.0, 'Easy', 'ALL', '''It''s'' means ''it is''. A semicolon correctly joins two closely related independent clauses.'),
(126, 'sec-1', 'Verbal', 'Verbal Ability', 'Voice Transformation', 'Choose the correct passive voice: ''The team completed the project.''', 'The project is completed by the team.', 'The project was completed by the team.', 'The project has complete by the team.', 'The team was completed by the project.', 'B', 1.0, 'Easy', 'ALL', 'The active sentence is in simple past tense. Passive: object + was/were + past participle + by + subject.'),
(127, 'sec-1', 'Verbal', 'Verbal Ability', 'Idioms & Phrases', 'Choose the correct meaning of the idiom ''Break the ice''.', 'Damage something', 'Start a friendly conversation', 'End a relationship', 'Reveal a secret', 'B', 1.0, 'Easy', 'ALL', '''Break the ice'' means to reduce initial awkwardness and help people begin interacting comfortably.'),
(128, 'sec-1', 'Verbal', 'Verbal Ability', 'Error Spotting', 'Identify the error: ''One of my friends are working in Bengaluru.''', 'One of', 'my friends', 'are working', 'in Bengaluru', 'C', 1.0, 'Easy', 'ALL', '''One of my friends'' takes a singular verb. Correct sentence: ''One of my friends is working in Bengaluru.'''),
(129, 'sec-1', 'Verbal', 'Verbal Ability', 'Sentence Connectors', 'Choose the best connector: The software was expensive; ____, the company decided to purchase it because of its reliability.', 'however', 'therefore', 'similarly', 'moreover', 'A', 1.0, 'Easy', 'ALL', 'The second clause contrasts with the expectation created by the first. ''However'' signals contrast.'),
(130, 'sec-1', 'Verbal', 'Verbal Ability', 'Reading Comprehension', 'Read the statement: ''Regular practice improves accuracy because it helps learners recognize patterns and avoid repeated mistakes.'' What is the main idea?', 'Accuracy depends only on talent.', 'Pattern recognition is unnecessary.', 'Regular practice can improve accuracy.', 'Mistakes cannot be avoided.', 'C', 1.0, 'Easy', 'ALL', 'The sentence states that regular practice improves accuracy by building pattern recognition and reducing repeated errors.'),
(131, 'sec-1', 'Verbal', 'Verbal Ability', 'Sentence Completion', '[Sentence completion] The manager appreciated Ravi because he was always ______ in completing his assignments before the deadline.', 'reluctant', 'punctual', 'careless', 'hesitant', 'B', 1.0, 'Easy', 'ALL', 'Punctual means doing something at the expected or agreed time. It fits the context of completing assignments before the deadline.'),
(132, 'sec-1', 'Verbal', 'Verbal Ability', 'Cloze Test', '[Cloze test] Although the project was difficult, the team worked ______ and successfully completed it ______ time.', 'lazily, at', 'efficiently, on', 'carelessly, in', 'slowly, by', 'B', 1.0, 'Easy', 'ALL', '''Efficiently'' means working effectively, and the correct expression is ''on time''.'),
(133, 'sec-1', 'Verbal', 'Verbal Ability', 'Phrasal Verbs', '[Phrasal verbs] What does the phrasal verb ''look into'' mean?', 'Ignore something', 'Investigate something', 'Look at something quickly', 'Reject something', 'B', 1.0, 'Easy', 'ALL', '''Look into'' means to examine or investigate a situation.'),
(134, 'sec-1', 'Verbal', 'Verbal Ability', 'Conjunctions', '[Conjunctions] ______ he was tired, he continued working on the project.', 'Because', 'Although', 'Unless', 'Therefore', 'B', 1.0, 'Easy', 'ALL', '''Although'' shows contrast: despite being tired, he continued working.'),
(135, 'sec-1', 'Verbal', 'Verbal Ability', 'Parallelism', '[Parallelism] Choose the grammatically correct sentence.', 'She likes reading, writing and to dance.', 'She likes to read, writing and dancing.', 'She likes reading, writing and dancing.', 'She likes read, write and dancing.', 'C', 1.0, 'Easy', 'ALL', 'Parallelism means keeping the same grammatical structure in a list. All three activities use the -ing form.'),
(136, 'sec-1', 'Verbal', 'Verbal Ability', 'Modifiers', '[Modifiers] Choose the sentence with the correct modifier placement.', 'Walking to college, the rain started heavily.', 'Walking to college, I saw a beautiful garden.', 'Walking to college, the road looked crowded.', 'Walking to college, the traffic was heavy.', 'B', 1.0, 'Easy', 'ALL', 'The person doing the walking must be the subject of the main clause. In option B, ''I'' am walking.'),
(137, 'sec-1', 'Verbal', 'Verbal Ability', 'Homophones', '[Homophones] The students were asked to ______ their assignments before Friday.', 'submit', 'summit', 'some it', 'summet', 'A', 1.0, 'Easy', 'ALL', '''Submit'' means to hand over or present something. ''Summit'' means the highest point of a mountain or a high-level meeting.'),
(138, 'sec-1', 'Verbal', 'Verbal Ability', 'Vocabulary', '[Vocabulary] Choose the word closest in meaning to ''Mitigate''.', 'Increase', 'Reduce', 'Ignore', 'Create', 'B', 1.0, 'Easy', 'ALL', 'Mitigate means to make something less severe, serious or harmful.'),
(139, 'sec-1', 'Verbal', 'Verbal Ability', 'Reading Comprehension - Inference', '[Reading comprehension – Inference] "Many companies have adopted automated systems to improve productivity. However, automation does not eliminate the need for employees. Instead, workers are expected to develop new skills to manage and work alongside these systems." What can be inferred from the passage?', 'Automation completely replaces employees.', 'Employees do not need technical skills.', 'Workers need to adapt to changing technology.', 'Companies should avoid automation.', 'C', 1.0, 'Easy', 'ALL', 'The passage explains that employees must develop new skills to work with automated systems.'),
(140, 'sec-1', 'Verbal', 'Verbal Ability', 'Sentence Ordering', '[Sentence ordering] Arrange in the correct logical order. P. Finally, the company launched its new product. Q. The team first identified customer requirements. R. After that, a prototype was developed. S. The prototype was tested and improved.', 'Q-R-S-P', 'R-Q-P-S', 'S-R-Q-P', 'P-Q-R-S', 'A', 1.0, 'Medium', 'ALL', 'Logical sequence: identify customer requirements (Q) → develop a prototype (R) → test and improve it (S) → launch the product (P).')
ON DUPLICATE KEY UPDATE
  `question_text` = VALUES(`question_text`),
  `option_a` = VALUES(`option_a`),
  `option_b` = VALUES(`option_b`),
  `option_c` = VALUES(`option_c`),
  `option_d` = VALUES(`option_d`),
  `correct_option` = VALUES(`correct_option`),
  `explanation` = VALUES(`explanation`);
