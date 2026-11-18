-- ==============================================================================
-- Cognito Assessment & Online Examination Platform - Database Schema
-- Database: u297467125_contest
-- Domain: contest.cognitoinsights.tech
-- Hostinger MySQL / MariaDB Compatible
-- ==============================================================================

SET FOREIGN_KEY_CHECKS = 1;

-- ------------------------------------------------------------------------------
-- 1. Admins (Recruiters & System Administrators)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `admins` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(150) NOT NULL,
  `email` VARCHAR(191) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `role` ENUM('super_admin', 'exam_admin', 'evaluator') DEFAULT 'super_admin',
  `status` ENUM('active', 'inactive') DEFAULT 'active',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `admins` (`name`, `email`, `password_hash`, `role`, `status`) VALUES
('Lead Recruiter', 'admin@cognitoinsights.tech', 'Admin@2026', 'super_admin', 'active'),
('Quantex Admin', 'admin@quantex.com', 'Admin@2026', 'exam_admin', 'active')
ON DUPLICATE KEY UPDATE `password_hash` = VALUES(`password_hash`), `status` = 'active';

-- ------------------------------------------------------------------------------
-- 2. Curated Andhra Pradesh Colleges Database
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `colleges` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `code` VARCHAR(50) DEFAULT NULL,
  `district` VARCHAR(100) NOT NULL,
  `type` ENUM('University', 'Autonomous Engineering', 'Affiliated Engineering', 'Degree & PG College', 'Deemed University') DEFAULT 'Autonomous Engineering',
  `qualification_level` VARCHAR(50) DEFAULT 'UG,PG',
  `is_active` TINYINT(1) DEFAULT 1,
  INDEX `idx_college_district` (`district`),
  INDEX `idx_college_type` (`type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `colleges` (`name`, `code`, `district`, `type`, `qualification_level`) VALUES
  ('Andhra University College of Engineering (AUCE Autonomous), Visakhapatnam', 'AP001', 'Visakhapatnam', 'University', 'UG,PG'),
  ('University College of Engineering Kakinada (UCEK - JNTUK)', 'AP002', 'Kakinada', 'University', 'UG,PG'),
  ('Sri Venkateswara University College of Engineering (SVUCE), Tirupati', 'AP003', 'Tirupati', 'University', 'UG,PG'),
  ('JNTUA College of Engineering, Anantapur', 'AP004', 'Anantapur', 'University', 'UG,PG'),
  ('JNTU-GV College of Engineering Vizianagaram (UCEV)', 'AP005', 'Vizianagaram', 'University', 'UG,PG'),
  ('Acharya Nagarjuna University College of Engineering, Guntur', 'AP006', 'Guntur', 'University', 'UG,PG'),
  ('Adikavi Nannaya University College of Engineering, Rajahmundry', 'AP007', 'East Godavari', 'University', 'UG,PG'),
  ('Krishna University College of Engineering & Technology, Machilipatnam', 'AP008', 'Krishna', 'University', 'UG,PG'),
  ('Yogi Vemana University College of Engineering, Proddatur', 'AP009', 'YSR Kadapa', 'University', 'UG,PG'),
  ('Rayalaseema University College of Engineering, Kurnool', 'AP010', 'Kurnool', 'University', 'UG,PG'),
  ('Vikrama Simhapuri University College, Nellore', 'AP011', 'Nellore', 'University', 'UG,PG'),
  ('Dr. B.R. Ambedkar University College of Engineering, Srikakulam', 'AP012', 'Srikakulam', 'University', 'UG,PG'),
  ('Sri Padmavati Mahila Visvavidyalayam (SPMVV Women''s University), Tirupati', 'AP013', 'Tirupati', 'University', 'UG,PG'),
  ('Indian Institute of Technology Tirupati (IIT Tirupati)', 'AP014', 'Tirupati', 'University', 'UG,PG'),
  ('Indian Institute of Information Technology Sri City (IIIT Sri City)', 'AP015', 'Tirupati', 'University', 'UG,PG'),
  ('IIITDM Kurnool - Indian Institute of Information Technology', 'AP016', 'Kurnool', 'University', 'UG,PG'),
  ('National Institute of Technology Andhra Pradesh (NIT AP), Tadepalligudem', 'AP017', 'West Godavari', 'University', 'UG,PG'),
  ('KL University (Koneru Lakshmaiah Education Foundation Deemed University), Vaddeswaram', 'AP018', 'Guntur', 'Deemed University', 'UG,PG'),
  ('Vignan''s Foundation for Science, Technology & Research (VFSTR Deemed University), Vadlamudi', 'AP019', 'Guntur', 'Deemed University', 'UG,PG'),
  ('GITAM Deemed to be University, Rushikonda, Visakhapatnam', 'AP020', 'Visakhapatnam', 'Deemed University', 'UG,PG'),
  ('Mohan Babu University (Sree Vidyanikethan), A. Rangampet, Tirupati', 'AP021', 'Tirupati', 'University', 'UG,PG'),
  ('Aditya Engineering College (AEC Autonomous), Surampalem', 'AP022', 'Kakinada', 'Autonomous Engineering', 'UG,PG'),
  ('Aditya College of Engineering & Technology (ACET Autonomous), Surampalem', 'AP023', 'Kakinada', 'Autonomous Engineering', 'UG,PG'),
  ('Aditya College of Engineering (ACE), Surampalem', 'AP024', 'Kakinada', 'Affiliated Engineering', 'UG,PG'),
  ('Aditya Pharmacy College, Surampalem', 'AP025', 'Kakinada', 'Affiliated Engineering', 'UG,PG'),
  ('Aditya Degree & PG College, Kakinada / Rajahmundry', 'AP026', 'Kakinada', 'Degree & PG College', 'UG,PG'),
  ('Pragati Engineering College (PEC Autonomous), Surampalem', 'AP027', 'Kakinada', 'Autonomous Engineering', 'UG,PG'),
  ('Godavari Institute of Engineering & Technology (GIET Autonomous), Rajahmundry', 'AP028', 'East Godavari', 'Autonomous Engineering', 'UG,PG'),
  ('GIET College of Engineering, Rajahmundry', 'AP029', 'East Godavari', 'Affiliated Engineering', 'UG,PG'),
  ('GIET Engineering College, Rajahmundry', 'AP030', 'East Godavari', 'Affiliated Engineering', 'UG,PG'),
  ('BVC Engineering College (Autonomous), Odalarevu', 'AP031', 'Dr. B.R. Ambedkar Konaseema', 'Autonomous Engineering', 'UG,PG'),
  ('BVC Institute of Technology & Science, Batlapalem / Amalapuram', 'AP032', 'Dr. B.R. Ambedkar Konaseema', 'Affiliated Engineering', 'UG,PG'),
  ('BVC College of Engineering, Rajahmundry', 'AP033', 'East Godavari', 'Affiliated Engineering', 'UG,PG'),
  ('Kakinada Institute of Engineering & Technology (KIET), Kakinada', 'AP034', 'Kakinada', 'Affiliated Engineering', 'UG,PG'),
  ('KIET Engineering College for Women, Korangi', 'AP035', 'Kakinada', 'Affiliated Engineering', 'UG,PG'),
  ('KIET-II (Kakinada Institute of Engineering & Technology-II)', 'AP036', 'Kakinada', 'Affiliated Engineering', 'UG,PG'),
  ('Ideal Institute of Technology, Vidyut Nagar, Kakinada', 'AP037', 'Kakinada', 'Affiliated Engineering', 'UG,PG'),
  ('Chaitanya Institute of Science & Technology (CIST), Kakinada', 'AP038', 'Kakinada', 'Affiliated Engineering', 'UG,PG'),
  ('VS Lakshmi Engineering College for Women, Kakinada', 'AP039', 'Kakinada', 'Affiliated Engineering', 'UG,PG'),
  ('International School of Technology & Sciences (ISTS) for Women, Rajanagaram', 'AP040', 'East Godavari', 'Affiliated Engineering', 'UG,PG'),
  ('Rajamahendri Institute of Engineering & Technology (RIET), Rajahmundry', 'AP041', 'East Godavari', 'Affiliated Engineering', 'UG,PG'),
  ('Lenora College of Engineering, Rampachodavaram', 'AP042', 'Alluri Sitharama Raju', 'Affiliated Engineering', 'UG,PG'),
  ('Swarnandhra Institute of Engineering & Technology, Seethanagaram', 'AP043', 'East Godavari', 'Affiliated Engineering', 'UG,PG'),
  ('PR Government College (Autonomous), Kakinada', 'AP044', 'Kakinada', 'Degree & PG College', 'UG,PG'),
  ('Government College (Autonomous), Rajahmundry', 'AP045', 'East Godavari', 'Degree & PG College', 'UG,PG'),
  ('MSN Degree College, Kakinada', 'AP046', 'Kakinada', 'Degree & PG College', 'UG'),
  ('Gayatri Vidya Parishad College of Engineering (GVPCOE Autonomous), Madhurawada', 'AP047', 'Visakhapatnam', 'Autonomous Engineering', 'UG,PG'),
  ('Gayatri Vidya Parishad College of Engineering for Women (GVPW), Kommadi', 'AP048', 'Visakhapatnam', 'Autonomous Engineering', 'UG,PG'),
  ('ANITS - Anil Neerukonda Institute of Technology & Sciences (Autonomous)', 'AP049', 'Visakhapatnam', 'Autonomous Engineering', 'UG,PG'),
  ('Raghu Engineering College (Autonomous), Dakamarri', 'AP050', 'Visakhapatnam', 'Autonomous Engineering', 'UG,PG'),
  ('Raghu Institute of Technology (Autonomous), Dakamarri', 'AP051', 'Visakhapatnam', 'Autonomous Engineering', 'UG,PG'),
  ('Vignan''s Institute of Information Technology (VIIT Autonomous), Duvvada', 'AP052', 'Visakhapatnam', 'Autonomous Engineering', 'UG,PG'),
  ('NSRIT - Nadimpalli Satyanarayana Raju Institute of Technology, Sontyam', 'AP053', 'Visakhapatnam', 'Autonomous Engineering', 'UG,PG'),
  ('Dadi Institute of Engineering & Technology (DIET Autonomous), Anakapalli', 'AP054', 'Anakapalli', 'Autonomous Engineering', 'UG,PG'),
  ('Chaitanya Engineering College, Kommadi', 'AP055', 'Visakhapatnam', 'Affiliated Engineering', 'UG,PG'),
  ('Sanketika Vidya Parishad Engineering College, Pothinamallayyapalem', 'AP056', 'Visakhapatnam', 'Affiliated Engineering', 'UG,PG'),
  ('Visakha Institute of Engineering & Technology, Narava', 'AP057', 'Visakhapatnam', 'Affiliated Engineering', 'UG,PG'),
  ('Wellfare Institute of Science, Technology & Management, Pinagadi', 'AP058', 'Visakhapatnam', 'Affiliated Engineering', 'UG,PG'),
  ('Al-Aman College of Engineering, Visakhapatnam', 'AP059', 'Visakhapatnam', 'Affiliated Engineering', 'UG,PG'),
  ('Gayatri Vidya Parishad College for Degree and PG Courses, MVP Colony', 'AP060', 'Visakhapatnam', 'Degree & PG College', 'UG,PG'),
  ('Dr. Lankapalli Bullayya College, Visakhapatnam', 'AP061', 'Visakhapatnam', 'Degree & PG College', 'UG,PG'),
  ('Dr. V.S. Krishna Government Degree College, Visakhapatnam', 'AP062', 'Visakhapatnam', 'Degree & PG College', 'UG,PG'),
  ('MVGR College of Engineering (Maharaj Vijayaram Gajapathi Raj - Autonomous)', 'AP063', 'Vizianagaram', 'Autonomous Engineering', 'UG,PG'),
  ('Lendi Institute of Engineering & Technology (Autonomous), Jonnada', 'AP064', 'Vizianagaram', 'Autonomous Engineering', 'UG,PG'),
  ('AITAM - Aditya Institute of Technology & Management (Autonomous), Tekkali', 'AP065', 'Srikakulam', 'Autonomous Engineering', 'UG,PG'),
  ('GMR Institute of Technology (GMRIT Autonomous), Rajam', 'AP066', 'Vizianagaram', 'Autonomous Engineering', 'UG,PG'),
  ('Satya Institute of Technology and Management (SITAM), Vizianagaram', 'AP067', 'Vizianagaram', 'Affiliated Engineering', 'UG,PG'),
  ('Avanthi Institute of Engineering & Technology, Cherukupally', 'AP068', 'Vizianagaram', 'Affiliated Engineering', 'UG,PG'),
  ('Gokul Group of Institutions, Bobbili', 'AP069', 'Vizianagaram', 'Affiliated Engineering', 'UG,PG'),
  ('Sri Sivani College of Engineering, Chilakapalem, Srikakulam', 'AP070', 'Srikakulam', 'Affiliated Engineering', 'UG,PG'),
  ('Praveenya Institute of Marine Engineering & Maritime Studies, Modavalasa', 'AP071', 'Vizianagaram', 'Affiliated Engineering', 'UG,PG'),
  ('Government Degree College (Men), Srikakulam', 'AP072', 'Srikakulam', 'Degree & PG College', 'UG'),
  ('MR Degree College (Mansas), Vizianagaram', 'AP073', 'Vizianagaram', 'Degree & PG College', 'UG'),
  ('SRKR Engineering College (Autonomous), Bhimavaram', 'AP074', 'West Godavari', 'Autonomous Engineering', 'UG,PG'),
  ('Shri Vishnu Engineering College for Women (SVECW Autonomous), Bhimavaram', 'AP075', 'West Godavari', 'Autonomous Engineering', 'UG,PG'),
  ('Vishnu Institute of Technology (VIT Autonomous), Bhimavaram', 'AP076', 'West Godavari', 'Autonomous Engineering', 'UG,PG'),
  ('Sir C.R. Reddy College of Engineering (Autonomous), Eluru', 'AP077', 'Eluru', 'Autonomous Engineering', 'UG,PG'),
  ('Sri Vasavi Engineering College (Autonomous), Pedatadepalli, Tadepalligudem', 'AP078', 'West Godavari', 'Autonomous Engineering', 'UG,PG'),
  ('Swarnandhra College of Engineering & Technology (Autonomous), Narsapur', 'AP079', 'West Godavari', 'Autonomous Engineering', 'UG,PG'),
  ('Ramachandra College of Engineering (Autonomous), Vatluru, Eluru', 'AP080', 'Eluru', 'Autonomous Engineering', 'UG,PG'),
  ('DNR College of Engineering & Technology, Bhimavaram', 'AP081', 'West Godavari', 'Affiliated Engineering', 'UG,PG'),
  ('Grandhi Varalakshmi Venkatarao Institute of Technology (GVIT), Bhimavaram', 'AP082', 'West Godavari', 'Affiliated Engineering', 'UG,PG'),
  ('Eluru College of Engineering & Technology (ECET), Eluru', 'AP083', 'Eluru', 'Affiliated Engineering', 'UG,PG'),
  ('Helapuri Institute of Technology and Science, Eluru', 'AP084', 'Eluru', 'Affiliated Engineering', 'UG,PG'),
  ('Sir C R Reddy Degree College, Eluru', 'AP085', 'Eluru', 'Degree & PG College', 'UG,PG'),
  ('DNR Degree College (Autonomous), Bhimavaram', 'AP086', 'West Godavari', 'Degree & PG College', 'UG,PG'),
  ('KGRL College (Autonomous), Bhimavaram', 'AP087', 'West Godavari', 'Degree & PG College', 'UG,PG'),
  ('Velagapudi Ramakrishna Siddhartha Engineering College (VRSEC Autonomous), Vijayawada', 'AP088', 'Krishna', 'Autonomous Engineering', 'UG,PG'),
  ('Prasad V. Potluri Siddhartha Institute of Technology (PVPSIT Autonomous), Vijayawada', 'AP089', 'Krishna', 'Autonomous Engineering', 'UG,PG'),
  ('Gudlavalleru Engineering College (Seshadri Rao GEC Autonomous), Gudlavalleru', 'AP090', 'Krishna', 'Autonomous Engineering', 'UG,PG'),
  ('Lakireddy Bali Reddy College of Engineering (LBRCE Autonomous), Mylavaram', 'AP091', 'NTR', 'Autonomous Engineering', 'UG,PG'),
  ('MIC College of Technology (DVR & Dr. HS MIC Autonomous), Kanchikacherla', 'AP092', 'NTR', 'Autonomous Engineering', 'UG,PG'),
  ('Andhra Loyola Institute of Engineering & Technology (ALIET), Vijayawada', 'AP093', 'NTR', 'Affiliated Engineering', 'UG,PG'),
  ('Dhanekula Institute of Engineering & Technology (DIET), Ganguru, Vijayawada', 'AP094', 'Krishna', 'Affiliated Engineering', 'UG,PG'),
  ('PSCMR College of Engineering and Technology, Vijayawada', 'AP095', 'NTR', 'Affiliated Engineering', 'UG,PG'),
  ('SRK Institute of Technology, Enikepadu, Vijayawada', 'AP096', 'Krishna', 'Affiliated Engineering', 'UG,PG'),
  ('Usha Rama College of Engineering and Technology, Telaprolu', 'AP097', 'Krishna', 'Affiliated Engineering', 'UG,PG'),
  ('Vikas College of Engineering and Technology, Nunna', 'AP098', 'Krishna', 'Affiliated Engineering', 'UG,PG'),
  ('Amrita Sai Institute of Science & Technology, Paritala', 'AP099', 'NTR', 'Affiliated Engineering', 'UG,PG'),
  ('Nimra College of Engineering and Technology, Ibrahimpatnam', 'AP100', 'NTR', 'Affiliated Engineering', 'UG,PG'),
  ('Andhra Loyola College (Autonomous), Vijayawada', 'AP101', 'NTR', 'Degree & PG College', 'UG,PG'),
  ('PB Siddhartha College of Arts & Science (Autonomous), Vijayawada', 'AP102', 'Krishna', 'Degree & PG College', 'UG,PG'),
  ('RVR & JC College of Engineering (Autonomous), Chowdavaram, Guntur', 'AP103', 'Guntur', 'Autonomous Engineering', 'UG,PG'),
  ('Vasireddy Venkatadri Institute of Technology (VVIT Autonomous), Nambur', 'AP104', 'Guntur', 'Autonomous Engineering', 'UG,PG'),
  ('Bapatla Engineering College (BEC Autonomous), Bapatla', 'AP105', 'Bapatla', 'Autonomous Engineering', 'UG,PG'),
  ('Narasaraopeta Engineering College (NEC Autonomous), Narasaraopet', 'AP106', 'Palnadu', 'Autonomous Engineering', 'UG,PG'),
  ('Tirumala Engineering College (TEC Autonomous), Jonnalagadda, Narasaraopet', 'AP107', 'Palnadu', 'Autonomous Engineering', 'UG,PG'),
  ('Chalapathi Institute of Engineering and Technology (CIET Autonomous), Lam, Guntur', 'AP108', 'Guntur', 'Autonomous Engineering', 'UG,PG'),
  ('Kallam Haranadhareddy Institute of Technology (KHIT Autonomous), Chowdavaram', 'AP109', 'Guntur', 'Autonomous Engineering', 'UG,PG'),
  ('Vignan''s Nirula Institute of Technology and Science for Women, Palakaluru, Guntur', 'AP110', 'Guntur', 'Affiliated Engineering', 'UG,PG'),
  ('Vignan''s Lara Institute of Technology & Science, Vadlamudi', 'AP111', 'Guntur', 'Affiliated Engineering', 'UG,PG'),
  ('Bapatla Women''s Engineering College, Bapatla', 'AP112', 'Bapatla', 'Affiliated Engineering', 'UG,PG'),
  ('Narasaraopeta Institute of Technology (NIT), Narasaraopet', 'AP113', 'Palnadu', 'Affiliated Engineering', 'UG,PG'),
  ('Chalapathi Institute of Technology (CIT), Mothadaka, Guntur', 'AP114', 'Guntur', 'Affiliated Engineering', 'UG,PG'),
  ('Loyola Institute of Technology and Management, Sattenapalle', 'AP115', 'Palnadu', 'Affiliated Engineering', 'UG,PG'),
  ('Malineni Perumallu Educational Society Group of Institutions, Pulladigunta', 'AP116', 'Guntur', 'Affiliated Engineering', 'UG,PG'),
  ('Priyadarshini Institute of Technology and Science, Tenali', 'AP117', 'Guntur', 'Affiliated Engineering', 'UG,PG'),
  ('Chebrolu Engineering College, Chebrolu', 'AP118', 'Guntur', 'Affiliated Engineering', 'UG,PG'),
  ('JKC College (Autonomous), Guntur', 'AP119', 'Guntur', 'Degree & PG College', 'UG,PG'),
  ('Hindu College, Guntur', 'AP120', 'Guntur', 'Degree & PG College', 'UG,PG'),
  ('QIS College of Engineering and Technology (Autonomous), Ongole', 'AP121', 'Prakasam', 'Autonomous Engineering', 'UG,PG'),
  ('Pace Institute of Technology and Sciences (Autonomous), Ongole', 'AP122', 'Prakasam', 'Autonomous Engineering', 'UG,PG'),
  ('St. Ann''s College of Engineering & Technology (SACET Autonomous), Chirala', 'AP123', 'Bapatla', 'Autonomous Engineering', 'UG,PG'),
  ('NBKR Institute of Science & Technology (NBKRIST Autonomous), Vidyanagar', 'AP124', 'Tirupati', 'Autonomous Engineering', 'UG,PG'),
  ('Narayana Engineering College (Autonomous), Nellore', 'AP125', 'Nellore', 'Autonomous Engineering', 'UG,PG'),
  ('Narayana Engineering College (Autonomous), Gudur', 'AP126', 'Tirupati', 'Autonomous Engineering', 'UG,PG'),
  ('Audisankara College of Engineering & Technology (ASCET Autonomous), Gudur', 'AP127', 'Tirupati', 'Autonomous Engineering', 'UG,PG'),
  ('Geethanjali Institute of Science & Technology (GIST), Nellore', 'AP128', 'Nellore', 'Affiliated Engineering', 'UG,PG'),
  ('QIS Institute of Technology, Ongole', 'AP129', 'Prakasam', 'Affiliated Engineering', 'UG,PG'),
  ('RISE Krishna Sai Prakasam Group of Institutions, Ongole', 'AP130', 'Prakasam', 'Affiliated Engineering', 'UG,PG'),
  ('RISE Krishna Sai Gandhi Group of Institutions, Ongole', 'AP131', 'Prakasam', 'Affiliated Engineering', 'UG,PG'),
  ('Prakasam Engineering College, Kandukur', 'AP132', 'Nellore', 'Affiliated Engineering', 'UG,PG'),
  ('Chirala Engineering College, Chirala', 'AP133', 'Bapatla', 'Affiliated Engineering', 'UG,PG'),
  ('PBR VITS - Visvodaya Institute of Technology and Science, Kavali', 'AP134', 'Nellore', 'Affiliated Engineering', 'UG,PG'),
  ('Jawahar Bharati Degree College, Kavali', 'AP135', 'Nellore', 'Degree & PG College', 'UG'),
  ('Madanapalle Institute of Technology & Science (MITS Autonomous)', 'AP136', 'Annamayya', 'Autonomous Engineering', 'UG,PG'),
  ('Annamacharya Institute of Technology & Sciences (AITS Autonomous), Rajampet', 'AP137', 'Annamayya', 'Autonomous Engineering', 'UG,PG'),
  ('Chadalawada Ramanamma Engineering College (Autonomous), Tirupati', 'AP138', 'Tirupati', 'Autonomous Engineering', 'UG,PG'),
  ('Siddhartha Institute of Engineering and Technology (SIETK Autonomous), Puttur', 'AP139', 'Tirupati', 'Autonomous Engineering', 'UG,PG'),
  ('Siddhartha Institute of Science and Technology (SISTK Autonomous), Puttur', 'AP140', 'Tirupati', 'Autonomous Engineering', 'UG,PG'),
  ('Sreenivasa Institute of Technology and Management Studies (SITAMS Autonomous), Chittoor', 'AP141', 'Chittoor', 'Autonomous Engineering', 'UG,PG'),
  ('Sri Venkateswara College of Engineering (SVCE), Tirupati', 'AP142', 'Tirupati', 'Affiliated Engineering', 'UG,PG'),
  ('Annamacharya Institute of Technology & Sciences (AITS), Tirupati', 'AP143', 'Tirupati', 'Affiliated Engineering', 'UG,PG'),
  ('Vemu Institute of Technology, P. Kothakota, Chittoor', 'AP144', 'Chittoor', 'Affiliated Engineering', 'UG,PG'),
  ('Kuppam Engineering College, Kuppam', 'AP145', 'Chittoor', 'Affiliated Engineering', 'UG,PG'),
  ('Sree Rama Engineering College, Tirupati', 'AP146', 'Tirupati', 'Affiliated Engineering', 'UG,PG'),
  ('Sri Venkatesa Perumal College of Engineering and Technology (SVPCET), Puttur', 'AP147', 'Tirupati', 'Affiliated Engineering', 'UG,PG'),
  ('SV Arts & Science College, Tirupati', 'AP148', 'Tirupati', 'Degree & PG College', 'UG,PG'),
  ('G. Pulla Reddy Engineering College (GPREC Autonomous), Kurnool', 'AP149', 'Kurnool', 'Autonomous Engineering', 'UG,PG'),
  ('Rajeev Gandhi Memorial College of Engineering & Technology (RGMCET Autonomous), Nandyal', 'AP150', 'Nandyal', 'Autonomous Engineering', 'UG,PG'),
  ('G. Pullaiah College of Engineering and Technology (GPCET Autonomous), Kurnool', 'AP151', 'Kurnool', 'Autonomous Engineering', 'UG,PG'),
  ('Santhiram Engineering College, Nandyal', 'AP152', 'Nandyal', 'Affiliated Engineering', 'UG,PG'),
  ('Ravindra College of Engineering for Women, Kurnool', 'AP153', 'Kurnool', 'Affiliated Engineering', 'UG,PG'),
  ('Brindavan Institute of Technology and Science (BITS), Kurnool', 'AP154', 'Kurnool', 'Affiliated Engineering', 'UG,PG'),
  ('Dr. K.V. Subba Reddy Institute of Technology (KVSRIT), Kurnool', 'AP155', 'Kurnool', 'Affiliated Engineering', 'UG,PG'),
  ('Bheema Institute of Technology and Science, Adoni', 'AP156', 'Kurnool', 'Affiliated Engineering', 'UG,PG'),
  ('Silver Jubilee Government College (Autonomous), Kurnool', 'AP157', 'Kurnool', 'Degree & PG College', 'UG,PG'),
  ('Srinivasa Ramanujan Institute of Technology (SRIT Autonomous), Rotarypuram', 'AP158', 'Anantapur', 'Autonomous Engineering', 'UG,PG'),
  ('Gates Institute of Technology (Autonomous), Gooty', 'AP159', 'Anantapur', 'Autonomous Engineering', 'UG,PG'),
  ('Anantha Lakshmi Institute of Technology & Sciences, Anantapur', 'AP160', 'Anantapur', 'Affiliated Engineering', 'UG,PG'),
  ('Intell Engineering College, Anantapur', 'AP161', 'Anantapur', 'Affiliated Engineering', 'UG,PG'),
  ('BIT Institute of Technology, Hindupur', 'AP162', 'Sri Sathya Sai', 'Affiliated Engineering', 'UG,PG'),
  ('Sir C.V. Raman Institute of Technology, Tadipatri', 'AP163', 'Anantapur', 'Affiliated Engineering', 'UG,PG'),
  ('Tadipatri Engineering College, Tadipatri', 'AP164', 'Anantapur', 'Affiliated Engineering', 'UG,PG'),
  ('Chiranjeevi Reddy Institute of Engineering & Technology, Anantapur', 'AP165', 'Anantapur', 'Affiliated Engineering', 'UG,PG'),
  ('Government Degree College (Men Autonomous), Anantapur', 'AP166', 'Anantapur', 'Degree & PG College', 'UG,PG'),
  ('KSRM College of Engineering (Autonomous), Kadapa', 'AP167', 'YSR Kadapa', 'Autonomous Engineering', 'UG,PG'),
  ('Kandula Obul Reddy Memorial College of Engineering (KORM), Kadapa', 'AP168', 'YSR Kadapa', 'Affiliated Engineering', 'UG,PG'),
  ('KLM College of Engineering for Women, Kadapa', 'AP169', 'YSR Kadapa', 'Affiliated Engineering', 'UG,PG'),
  ('Sri Venkateswara College of Engineering (SVEC), Kadapa', 'AP170', 'YSR Kadapa', 'Affiliated Engineering', 'UG,PG'),
  ('Srinivasa Institute of Technology & Science, Kadapa', 'AP171', 'YSR Kadapa', 'Affiliated Engineering', 'UG,PG'),
  ('Global College of Engineering & Technology, Kadapa', 'AP172', 'YSR Kadapa', 'Affiliated Engineering', 'UG,PG'),
  ('Bharath College of Engineering and Technology for Women, Kadapa', 'AP173', 'YSR Kadapa', 'Affiliated Engineering', 'UG,PG'),
  ('Government College for Men (Autonomous), Kadapa', 'AP174', 'YSR Kadapa', 'Degree & PG College', 'UG,PG');

-- ------------------------------------------------------------------------------
-- 3. Qualifications, Courses & Dynamic Branches
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `courses` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `qualification` ENUM('Undergraduate', 'Postgraduate') NOT NULL,
  `code` VARCHAR(20) NOT NULL UNIQUE,
  `name` VARCHAR(150) NOT NULL,
  `sort_order` INT DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `courses` (`qualification`, `code`, `name`, `sort_order`) VALUES
('Undergraduate', 'B.Tech', 'B.Tech (Bachelor of Technology / B.E.)', 1),
('Postgraduate', 'M.Tech', 'M.Tech (Master of Technology / M.E.)', 2),
('Undergraduate', 'BCA', 'BCA (Bachelor of Computer Applications)', 3),
('Postgraduate', 'MCA', 'MCA (Master of Computer Applications)', 4),
('Undergraduate', 'B.Sc', 'B.Sc (Bachelor of Science)', 5),
('Postgraduate', 'M.Sc', 'M.Sc (Master of Science)', 6),
('Undergraduate', 'B.Com', 'B.Com (Bachelor of Commerce)', 7);

CREATE TABLE IF NOT EXISTS `course_branches` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `course_code` VARCHAR(20) NOT NULL,
  `branch_name` VARCHAR(150) NOT NULL,
  `technical_stream` VARCHAR(50) DEFAULT 'CS',
  INDEX `idx_branch_course` (`course_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `course_branches` (`course_code`, `branch_name`, `technical_stream`) VALUES
-- B.Tech Branches
('B.Tech', 'Computer Science and Engineering', 'CSE'),
('B.Tech', 'Artificial Intelligence and Data Science', 'AIDS'),
('B.Tech', 'Artificial Intelligence and Machine Learning', 'AIML'),
('B.Tech', 'Information Technology', 'IT'),
('B.Tech', 'Electronics and Communication Engineering', 'ECE'),
('B.Tech', 'Electrical and Electronics Engineering', 'EEE'),
('B.Tech', 'Mechanical Engineering', 'ME'),
('B.Tech', 'Civil Engineering', 'CE'),
('B.Tech', 'Cyber Security', 'CYBER'),
('B.Tech', 'Data Science', 'DS'),
('B.Tech', 'Agricultural Engineering', 'AGRI'),
-- M.Tech Branches
('M.Tech', 'Computer Science and Engineering', 'CSE'),
('M.Tech', 'Artificial Intelligence', 'AIML'),
('M.Tech', 'Data Science', 'DS'),
('M.Tech', 'Cyber Security', 'CYBER'),
('M.Tech', 'VLSI', 'ECE'),
('M.Tech', 'Software Engineering', 'CSE'),
('M.Tech', 'Machine Learning', 'AIML'),
-- B.Sc Branches
('B.Sc', 'Computer Science', 'CSE'),
('B.Sc', 'Mathematics', 'MATH'),
('B.Sc', 'Statistics', 'STAT'),
('B.Sc', 'Physics', 'CORE'),
('B.Sc', 'Chemistry', 'CORE'),
('B.Sc', 'Biotechnology', 'BIO'),
('B.Sc', 'Electronics', 'ECE'),
-- BCA Branches
('BCA', 'Computer Applications', 'CSE'),
('BCA', 'Data Science', 'DS'),
('BCA', 'Artificial Intelligence', 'AIML'),
-- MCA Branches
('MCA', 'Computer Applications', 'CSE'),
('MCA', 'Artificial Intelligence', 'AIML'),
('MCA', 'Data Science', 'DS'),
-- B.Com Branches
('B.Com', 'General', 'COMMERCE'),
('B.Com', 'Computer Applications', 'CSE'),
('B.Com', 'Accounting and Finance', 'FINANCE'),
-- M.Sc Branches
('M.Sc', 'Computer Science', 'CSE'),
('M.Sc', 'Mathematics', 'MATH'),
('M.Sc', 'Statistics', 'STAT'),
('M.Sc', 'Data Science', 'DS'),
('M.Sc', 'Artificial Intelligence', 'AIML');

-- ------------------------------------------------------------------------------
-- 4. Students Table
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `students` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `registration_id` VARCHAR(50) NOT NULL UNIQUE,
  `full_name` VARCHAR(150) NOT NULL,
  `email` VARCHAR(191) NOT NULL UNIQUE,
  `mobile` VARCHAR(30) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `qualification` VARCHAR(50) NOT NULL DEFAULT 'Undergraduate',
  `course` VARCHAR(50) NOT NULL,
  `stream` VARCHAR(150) NOT NULL,
  `college` VARCHAR(255) NOT NULL,
  `college_district` VARCHAR(100) DEFAULT 'Andhra Pradesh',
  `college_type` VARCHAR(100) DEFAULT 'Autonomous Engineering',
  `graduation_year` INT NOT NULL,
  `cgpa` VARCHAR(20) NOT NULL,
  `current_semester` VARCHAR(20) DEFAULT 'Final Year',
  `has_backlogs` TINYINT(1) DEFAULT 0,
  `backlogs_count` INT DEFAULT 0,
  `backlog_subjects` TEXT DEFAULT NULL,
  `has_exam_clash` TINYINT(1) DEFAULT 0,
  `exam_dates` VARCHAR(255) DEFAULT NULL,
  `skills` TEXT DEFAULT NULL,
  `domain_interest` VARCHAR(100) DEFAULT 'Full Stack Engineering',
  `resume_name` VARCHAR(255) DEFAULT NULL,
  `college_id_name` VARCHAR(255) DEFAULT NULL,
  `status` ENUM('Registered', 'Test Assigned', 'In Progress', 'Completed', 'Interrupted', 'Cancelled', 'Shortlisted', 'Waitlisted', 'Rejected') DEFAULT 'Test Assigned',
  `is_verified` TINYINT(1) DEFAULT 1,
  `is_blocked` TINYINT(1) DEFAULT 0,
  `is_active` TINYINT(1) DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_student_reg` (`registration_id`),
  INDEX `idx_student_email` (`email`),
  INDEX `idx_student_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 5. Student Work Preferences (All 8 Mandatory Questions)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `student_work_preferences` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `student_id` INT NOT NULL UNIQUE,
  `day_shift` ENUM('Yes', 'No') NOT NULL DEFAULT 'Yes',
  `night_shift` ENUM('Yes', 'No') NOT NULL DEFAULT 'Yes',
  `preferred_shift` ENUM('Day Shift', 'Night Shift', 'Both') NOT NULL DEFAULT 'Both',
  `relocate` ENUM('Yes', 'No') NOT NULL DEFAULT 'Yes',
  `own_accommodation` ENUM('Yes', 'No', 'Depends on the location') NOT NULL DEFAULT 'Yes',
  `manage_travel_expenses` ENUM('Yes', 'No', 'Depends on the company') NOT NULL DEFAULT 'Yes',
  `work_from_office` ENUM('Yes', 'No', 'Hybrid only') NOT NULL DEFAULT 'Yes',
  `technical_training` ENUM('Yes', 'No') NOT NULL DEFAULT 'Yes',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 6. Email OTP Verification Table
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `email_otps` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `email` VARCHAR(191) NOT NULL,
  `otp_code` VARCHAR(10) NOT NULL,
  `candidate_name` VARCHAR(150) DEFAULT 'Candidate',
  `is_used` TINYINT(1) DEFAULT 0,
  `resend_message_id` VARCHAR(100) DEFAULT NULL,
  `expires_at` DATETIME NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_otp_lookup` (`email`, `otp_code`, `is_used`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 7. Exams & Structure Configuration
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `exams` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `course` VARCHAR(50) DEFAULT 'ALL',
  `branch` VARCHAR(150) DEFAULT 'ALL',
  `college` VARCHAR(255) DEFAULT 'ALL',
  `batch` VARCHAR(50) DEFAULT '2026',
  `start_date` DATETIME DEFAULT NULL,
  `end_date` DATETIME DEFAULT NULL,
  `total_duration_minutes` INT NOT NULL DEFAULT 90,
  `total_marks` INT NOT NULL DEFAULT 100,
  `passing_marks` INT NOT NULL DEFAULT 40,
  `is_active` TINYINT(1) DEFAULT 1,
  `status` ENUM('Upcoming', 'Ongoing', 'Completed', 'Cancelled', 'Archived') DEFAULT 'Ongoing',
  `tab_switch_limit` INT DEFAULT 3,
  `min_screen_width` INT DEFAULT 1280,
  `result_announcement_date` DATETIME DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `exams` (`id`, `title`, `description`, `course`, `branch`, `college`, `batch`, `total_duration_minutes`, `total_marks`, `passing_marks`, `status`, `tab_switch_limit`) VALUES
(1, 'Cognito Tech Hub & Quantex GET Assessment 2026', 'Comprehensive 3-Section Online Examination: Q&A&V (40M), Core Technical (20M), and Coding Sandbox (40M)', 'ALL', 'ALL', 'ALL', '2026', 90, 100, 40, 'Ongoing', 3)
ON DUPLICATE KEY UPDATE `title` = VALUES(`title`);

CREATE TABLE IF NOT EXISTS `exam_sections` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `exam_id` INT NOT NULL,
  `section_order` INT NOT NULL,
  `section_code` VARCHAR(50) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `duration_minutes` INT NOT NULL,
  `total_marks` INT NOT NULL,
  `total_questions` INT NOT NULL,
  `question_type` ENUM('mcq', 'coding', 'subjective') DEFAULT 'mcq',
  `negative_marking` DECIMAL(3,2) DEFAULT 0.00,
  FOREIGN KEY (`exam_id`) REFERENCES `exams`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `exam_sections` (`exam_id`, `section_order`, `section_code`, `title`, `duration_minutes`, `total_marks`, `total_questions`, `question_type`, `negative_marking`) VALUES
(1, 1, 'sec-1', 'Section 1: Quantitative Aptitude, Analytical Reasoning & Verbal Ability (Q&A&V)', 35, 40, 40, 'mcq', 0.00),
(1, 2, 'sec-2', 'Section 2: Technical Core Knowledge (Branch-Specific)', 25, 20, 20, 'mcq', 0.00),
(1, 3, 'sec-3', 'Section 3: Technical Coding Round (2 Problems x 10 Test Cases)', 30, 40, 2, 'coding', 0.00);

-- ------------------------------------------------------------------------------
-- 8. Question Bank (Aptitude, Verbal, Technical)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `questions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `section_code` VARCHAR(50) NOT NULL DEFAULT 'sec-2',
  `category` VARCHAR(100) NOT NULL DEFAULT 'Technical-CSE',
  `subject` VARCHAR(100) DEFAULT 'Technical Core Knowledge',
  `topic` VARCHAR(100) DEFAULT 'General',
  `question_text` TEXT NOT NULL,
  `option_a` TEXT NOT NULL,
  `option_b` TEXT NOT NULL,
  `option_c` TEXT NOT NULL,
  `option_d` TEXT NOT NULL,
  `correct_option` CHAR(1) NOT NULL, -- 'A', 'B', 'C', 'D'
  `marks` DECIMAL(3,1) DEFAULT 1.0,
  `difficulty` ENUM('Easy', 'Medium', 'Hard') DEFAULT 'Medium',
  `branch_target` VARCHAR(50) DEFAULT 'ALL',
  `explanation` TEXT DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 9. Coding Questions & Test Cases (10 Test Cases per Question = 20 Marks each)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `coding_questions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `slug` VARCHAR(100) NOT NULL UNIQUE,
  `difficulty` ENUM('Easy', 'Medium', 'Hard') DEFAULT 'Medium',
  `marks` INT DEFAULT 20,
  `description` TEXT NOT NULL,
  `input_format` TEXT,
  `output_format` TEXT,
  `constraints` TEXT,
  `function_name` VARCHAR(100) NOT NULL,
  `starter_python` TEXT,
  `starter_java` TEXT,
  `starter_cpp` TEXT,
  `starter_c` TEXT,
  `starter_csharp` TEXT,
  `starter_go` TEXT,
  `starter_php` TEXT,
  `starter_js` TEXT,
  `time_limit_ms` INT DEFAULT 2000,
  `memory_limit_mb` INT DEFAULT 256
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `coding_test_cases` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `question_id` INT NOT NULL,
  `test_case_num` INT NOT NULL,
  `input_data` MEDIUMTEXT NOT NULL,
  `expected_output` MEDIUMTEXT NOT NULL,
  `is_hidden` TINYINT(1) DEFAULT 1, -- 1=Hidden, 0=Sample visible
  `marks` DECIMAL(3,1) DEFAULT 2.0, -- 2 marks per test case x 10 = 20 marks
  FOREIGN KEY (`question_id`) REFERENCES `coding_questions`(`id`) ON DELETE CASCADE,
  INDEX `idx_tc_question` (`question_id`, `test_case_num`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 10. Exam Attempts & Session Tracking (Supports Interruption & Recovery)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `exam_attempts` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `student_id` INT NOT NULL,
  `exam_id` INT NOT NULL,
  `session_token` VARCHAR(100) NOT NULL UNIQUE,
  `start_time` DATETIME NOT NULL,
  `end_time` DATETIME DEFAULT NULL,
  `duration_seconds_left` INT NOT NULL DEFAULT 5400,
  `status` ENUM('In Progress', 'Completed', 'Interrupted', 'Cancelled', 'Recovered') DEFAULT 'In Progress',
  `interruption_reason` VARCHAR(255) DEFAULT NULL,
  `last_heartbeat` DATETIME NOT NULL,
  `tab_switch_count` INT DEFAULT 0,
  `violations_count` INT DEFAULT 0,
  `sec_1_score` DECIMAL(5,2) DEFAULT 0.00,
  `sec_2_score` DECIMAL(5,2) DEFAULT 0.00,
  `sec_3_score` DECIMAL(5,2) DEFAULT 0.00,
  `total_score` DECIMAL(5,2) DEFAULT 0.00,
  `percentage` DECIMAL(5,2) DEFAULT 0.00,
  `is_passed` TINYINT(1) DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`exam_id`) REFERENCES `exams`(`id`) ON DELETE CASCADE,
  INDEX `idx_attempt_student` (`student_id`),
  INDEX `idx_attempt_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 11. Exam Violations Audit Log
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `exam_violations` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `attempt_id` INT NOT NULL,
  `student_id` INT NOT NULL,
  `violation_type` VARCHAR(100) NOT NULL, -- Tab Switch, Window Blur, Fullscreen Exit, DevTools, Copy/Paste, Screenshot
  `details` TEXT,
  `strike_number` INT NOT NULL,
  `timestamp` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`attempt_id`) REFERENCES `exam_attempts`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE CASCADE,
  INDEX `idx_violation_attempt` (`attempt_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 12. Admin-Controlled Exam Recovery Codes
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `exam_recovery_codes` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `attempt_id` INT NOT NULL,
  `student_id` INT NOT NULL,
  `code_hash` VARCHAR(255) NOT NULL,
  `plain_prefix` VARCHAR(20) NOT NULL,
  `generated_by_admin` VARCHAR(150) NOT NULL,
  `reason` TEXT NOT NULL,
  `permitted_uses` INT DEFAULT 1,
  `used_count` INT DEFAULT 0,
  `is_active` TINYINT(1) DEFAULT 1,
  `expires_at` DATETIME NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`attempt_id`) REFERENCES `exam_attempts`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE CASCADE,
  INDEX `idx_recovery_lookup` (`attempt_id`, `is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `exam_recovery_history` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `recovery_code_id` INT NOT NULL,
  `attempt_id` INT NOT NULL,
  `student_id` INT NOT NULL,
  `action` VARCHAR(50) NOT NULL, -- 'GENERATED', 'USED', 'EXPIRED', 'REVOKED'
  `admin_name` VARCHAR(150) NOT NULL,
  `ip_address` VARCHAR(50) DEFAULT NULL,
  `notes` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`recovery_code_id`) REFERENCES `exam_recovery_codes`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 13. Coding Submissions & Test Case Results
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `coding_submissions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `attempt_id` INT NOT NULL,
  `question_id` INT NOT NULL,
  `language` VARCHAR(30) NOT NULL,
  `source_code` MEDIUMTEXT NOT NULL,
  `passed_test_cases` INT DEFAULT 0,
  `total_test_cases` INT DEFAULT 10,
  `score_awarded` DECIMAL(5,2) DEFAULT 0.00,
  `all_passed` TINYINT(1) DEFAULT 0,
  `execution_time_ms` INT DEFAULT 0,
  `submitted_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`attempt_id`) REFERENCES `exam_attempts`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`question_id`) REFERENCES `coding_questions`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 14. Assessments Compatibility View / Legacy Bridge Table
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `assessments` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `student_id` INT NOT NULL,
  `student_email` VARCHAR(191) NOT NULL,
  `section_1_score` DECIMAL(5,2) DEFAULT 0.00,
  `section_2_score` DECIMAL(5,2) DEFAULT 0.00,
  `section_3_score` DECIMAL(5,2) DEFAULT 0.00,
  `section_4_score` DECIMAL(5,2) DEFAULT 0.00,
  `section_5_score` DECIMAL(5,2) DEFAULT 0.00,
  `total_score` DECIMAL(5,2) DEFAULT 0.00,
  `max_score` DECIMAL(5,2) DEFAULT 100.00,
  `percentage` DECIMAL(5,2) DEFAULT 0.00,
  `proctoring_violations` INT DEFAULT 0,
  `violation_details` TEXT DEFAULT NULL,
  `coding_q1_code` MEDIUMTEXT DEFAULT NULL,
  `coding_q1_lang` VARCHAR(30) DEFAULT 'javascript',
  `coding_q1_score` INT DEFAULT 0,
  `coding_q2_code` MEDIUMTEXT DEFAULT NULL,
  `coding_q2_lang` VARCHAR(30) DEFAULT 'javascript',
  `coding_q2_score` INT DEFAULT 0,
  `scenario_architecture_answer` MEDIUMTEXT DEFAULT NULL,
  `behavioral_answers` MEDIUMTEXT DEFAULT NULL,
  `answers_json` LONGTEXT DEFAULT NULL,
  `recruiter_status` ENUM('Under Review', 'Shortlisted', 'Waitlisted', 'Rejected') DEFAULT 'Under Review',
  `recruiter_notes` TEXT DEFAULT NULL,
  `submitted_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE CASCADE,
  INDEX `idx_assessment_student` (`student_id`),
  INDEX `idx_assessment_email` (`student_email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- Seed Default Coding Questions & 10 Test Cases Each (40 Marks total)
-- ------------------------------------------------------------------------------
INSERT INTO `coding_questions` (`id`, `title`, `slug`, `difficulty`, `marks`, `description`, `input_format`, `output_format`, `constraints`, `function_name`, `starter_python`, `starter_java`, `starter_cpp`, `starter_js`, `time_limit_ms`, `memory_limit_mb`) VALUES
(1, 'Longest Substring Without Repeating Characters', 'longest-unique-substring', 'Medium', 20, 
'Given a string `s`, find the length of the longest substring without repeating characters.\n\nA substring is a contiguous non-empty sequence of characters within a string.', 
'A single line containing the string s.', 
'An integer representing the length of the longest unique substring.', 
'0 <= s.length <= 5 * 10^4\ns consists of English letters, digits, symbols and spaces.', 
'lengthOfLongestSubstring',
'def lengthOfLongestSubstring(s: str) -> int:\n    # Write your solution here\n    char_set = set()\n    left = 0\n    max_len = 0\n    for right in range(len(s)):\n        while s[right] in char_set:\n            char_set.remove(s[left])\n            left += 1\n        char_set.add(s[right])\n        max_len = max(max_len, right - left + 1)\n    return max_len\n',
'import java.util.*;\n\nclass Solution {\n    public int lengthOfLongestSubstring(String s) {\n        // Write your solution here\n        Set<Character> set = new HashSet<>();\n        int left = 0, maxLen = 0;\n        for (int right = 0; right < s.length(); right++) {\n            while (set.contains(s.charAt(right))) {\n                set.remove(s.charAt(left++));\n            }\n            set.add(s.charAt(right));\n            maxLen = Math.max(maxLen, right - left + 1);\n        }\n        return maxLen;\n    }\n}\n',
'#include <iostream>\n#include <string>\n#include <unordered_set>\nusing namespace std;\n\nclass Solution {\npublic:\n    int lengthOfLongestSubstring(string s) {\n        unordered_set<char> chars;\n        int left = 0, maxLen = 0;\n        for (int right = 0; right < s.length(); right++) {\n            while (chars.count(s[right])) {\n                chars.erase(s[left++]);\n            }\n            chars.insert(s[right]);\n            maxLen = max(maxLen, right - left + 1);\n        }\n        return maxLen;\n    }\n};\n',
'function lengthOfLongestSubstring(s) {\n  const set = new Set();\n  let left = 0, maxLen = 0;\n  for (let right = 0; right < s.length; right++) {\n    while (set.has(s[right])) {\n      set.delete(s[left]);\n      left++;\n    }\n    set.add(s[right]);\n    maxLen = Math.max(maxLen, right - left + 1);\n  }\n  return maxLen;\n}\n',
2000, 256),

(2, 'Two Sum - Target Pair Indices', 'two-sum-target', 'Easy', 20, 
'Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to target.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice. You can return the answer in any order.', 
'nums array on line 1, target integer on line 2.', 
'Array of two indices [i, j].', 
'2 <= nums.length <= 10^4\n-10^9 <= nums[i] <= 10^9\n-10^9 <= target <= 10^9', 
'twoSum',
'def twoSum(nums: list, target: int) -> list:\n    seen = {}\n    for i, num in enumerate(nums):\n        diff = target - num\n        if diff in seen:\n            return [seen[diff], i]\n        seen[num] = i\n    return []\n',
'import java.util.*;\n\nclass Solution {\n    public int[] twoSum(int[] nums, int target) {\n        Map<Integer, Integer> map = new HashMap<>();\n        for (int i = 0; i < nums.length; i++) {\n            int complement = target - nums[i];\n            if (map.containsKey(complement)) {\n                return new int[] { map.get(complement), i };\n            }\n            map.put(nums[i], i);\n        }\n        return new int[]{};\n    }\n}\n',
'#include <vector>\n#include <unordered_map>\nusing namespace std;\n\nclass Solution {\npublic:\n    vector<int> twoSum(vector<int>& nums, int target) {\n        unordered_map<int, int> seen;\n        for (int i = 0; i < nums.size(); i++) {\n            int diff = target - nums[i];\n            if (seen.count(diff)) return {seen[diff], i};\n            seen[nums[i]] = i;\n        }\n        return {};\n    }\n};\n',
'function twoSum(nums, target) {\n  const map = new Map();\n  for (let i = 0; i < nums.length; i++) {\n    const complement = target - nums[i];\n    if (map.has(complement)) {\n      return [map.get(complement), i];\n    }\n    map.set(nums[i], i);\n  }\n  return [];\n}\n',
2000, 256);

-- 4 Test Cases for Question 1 (2 sample visible, 2 hidden; 5 marks each = 20 Marks, all 4 required)
INSERT INTO `coding_test_cases` (`question_id`, `test_case_num`, `input_data`, `expected_output`, `is_hidden`, `marks`) VALUES
(1, 1, '"abcabcbb"', '3', 0, 5.0),
(1, 2, '"bbbbb"', '1', 0, 5.0),
(1, 3, '"pwwkew"', '3', 1, 5.0),
(1, 4, '""', '0', 1, 5.0);

-- 4 Test Cases for Question 2 (2 sample visible, 2 hidden; 5 marks each = 20 Marks, all 4 required)
INSERT INTO `coding_test_cases` (`question_id`, `test_case_num`, `input_data`, `expected_output`, `is_hidden`, `marks`) VALUES
(2, 1, '[2,7,11,15], 9', '[0,1]', 0, 5.0),
(2, 2, '[3,2,4], 6', '[1,2]', 0, 5.0),
(2, 3, '[3,3], 6', '[0,1]', 1, 5.0),
(2, 4, '[1,5,8,12,19], 20', '[0,4]', 1, 5.0);

-- ------------------------------------------------------------------------------
-- 18. Student Tasks & Assignments (Module 5 & 6)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `student_tasks` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(200) NOT NULL,
  `description` TEXT NOT NULL,
  `task_type` VARCHAR(50) DEFAULT 'Technical Assignment',
  `priority` ENUM('Low', 'Medium', 'High', 'Urgent') DEFAULT 'Medium',
  `due_date` DATETIME NOT NULL,
  `target_type` ENUM('all', 'course', 'branch', 'college', 'student') DEFAULT 'all',
  `target_value` VARCHAR(255) DEFAULT NULL,
  `instructions` TEXT DEFAULT NULL,
  `status` ENUM('Assigned', 'Pending', 'In Progress', 'Submitted', 'Completed', 'Overdue', 'Cancelled') DEFAULT 'Assigned',
  `created_by` INT DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_task_target` (`target_type`, `target_value`),
  INDEX `idx_task_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `student_task_assignments` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `task_id` INT NOT NULL,
  `student_id` INT NOT NULL,
  `status` ENUM('Assigned', 'Pending', 'In Progress', 'Submitted', 'Completed', 'Overdue', 'Cancelled') DEFAULT 'Assigned',
  `submission_content` TEXT DEFAULT NULL,
  `submission_url` VARCHAR(255) DEFAULT NULL,
  `submitted_at` DATETIME DEFAULT NULL,
  `marks_awarded` DECIMAL(5,2) DEFAULT NULL,
  `feedback` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`task_id`) REFERENCES `student_tasks`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE CASCADE,
  INDEX `idx_assignment_student` (`student_id`),
  INDEX `idx_assignment_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 19. Exam Paper Snapshots (Module 7 & 9 - Unique Per-Student Paper Snapshot)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `exam_paper_snapshots` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `attempt_id` INT NOT NULL,
  `student_id` INT NOT NULL,
  `exam_id` INT DEFAULT 1,
  `paper_json` LONGTEXT NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_paper_attempt` (`attempt_id`),
  INDEX `idx_paper_student` (`student_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 20. Server-Authoritative Exam Timing Overrides (Module 8 & 11)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `exam_timing_overrides` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `attempt_id` INT NOT NULL,
  `student_id` INT NOT NULL,
  `admin_id` INT DEFAULT 1,
  `action_type` ENUM('extend_time', 'reduce_time', 'pause_exam', 'resume_exam', 'block_student', 'unlock_student', 'grant_extra_time') NOT NULL,
  `extra_seconds` INT DEFAULT 0,
  `reason` VARCHAR(255) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_timing_attempt` (`attempt_id`),
  INDEX `idx_timing_student` (`student_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 21. Student Answer Sheets & Manual Evaluation Overrides (Module 10 & 13)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `answer_sheet_evaluations` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `assessment_id` INT DEFAULT NULL,
  `student_id` INT NOT NULL,
  `section_key` VARCHAR(50) NOT NULL,
  `question_id` VARCHAR(50) NOT NULL,
  `original_marks` DECIMAL(5,2) DEFAULT 0.00,
  `overridden_marks` DECIMAL(5,2) DEFAULT 0.00,
  `evaluator_id` INT DEFAULT 1,
  `evaluator_notes` TEXT DEFAULT NULL,
  `approval_status` ENUM('Pending', 'Approved', 'Flagged', 'Rejected') DEFAULT 'Pending',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_eval_student` (`student_id`),
  INDEX `idx_eval_status` (`approval_status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 22. 10-Stage Result Approvals & Announcement Pipeline (Module 13 & 14)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `result_approvals` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `student_id` INT NOT NULL,
  `attempt_id` INT DEFAULT NULL,
  `assessment_id` INT DEFAULT NULL,
  `stage_status` ENUM(
    'Exam Submitted',
    'Answers Saved',
    'Auto Evaluation In Progress',
    'Marks Calculated',
    'Pending Admin Review',
    'Answer Sheet Approved',
    'Results Approved',
    'Announcement Scheduled',
    'Results Announced',
    'Published to Student Portal'
  ) NOT NULL DEFAULT 'Exam Submitted',
  `section_1_score` DECIMAL(5,2) DEFAULT 0.00,
  `section_2_score` DECIMAL(5,2) DEFAULT 0.00,
  `section_3_score` DECIMAL(5,2) DEFAULT 0.00,
  `total_score` DECIMAL(5,2) DEFAULT 0.00,
  `rank_position` INT DEFAULT NULL,
  `grade` VARCHAR(10) DEFAULT 'P',
  `is_approved` TINYINT(1) DEFAULT 0,
  `approved_by` INT DEFAULT NULL,
  `is_published_to_student` TINYINT(1) DEFAULT 0,
  `announcement_time` DATETIME DEFAULT NULL,
  `remarks` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE CASCADE,
  INDEX `idx_res_student` (`student_id`),
  INDEX `idx_res_stage` (`stage_status`),
  INDEX `idx_res_published` (`is_published_to_student`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 23. Candidate Notifications (Module 18)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `notifications` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `student_id` INT DEFAULT NULL, -- NULL indicates broadcast to all students
  `title` VARCHAR(200) NOT NULL,
  `message` TEXT NOT NULL,
  `type` ENUM('info', 'alert', 'exam', 'result', 'task') DEFAULT 'info',
  `is_read` TINYINT(1) DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_notif_student` (`student_id`),
  INDEX `idx_notif_type` (`type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 24. Audit Logs (Module 20, 21, 23)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `audit_logs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `admin_id` INT DEFAULT 1,
  `admin_email` VARCHAR(150) DEFAULT 'admin@cognitoinsights.tech',
  `action` VARCHAR(100) NOT NULL,
  `target_type` VARCHAR(50) DEFAULT NULL,
  `target_id` VARCHAR(50) DEFAULT NULL,
  `details` TEXT DEFAULT NULL,
  `ip_address` VARCHAR(45) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_audit_admin` (`admin_id`),
  INDEX `idx_audit_action` (`action`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 25. System Settings (Module 22)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `system_settings` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `setting_key` VARCHAR(100) NOT NULL UNIQUE,
  `setting_value` TEXT NOT NULL,
  `description` VARCHAR(255) DEFAULT NULL,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed Default Enterprise System Settings
INSERT INTO `system_settings` (`setting_key`, `setting_value`, `description`) VALUES
('platform_title', 'Cognito Tech Hub & Quantex Assessment Portal', 'Main platform branding title'),
('exam_duration_mins', '90', 'Default examination duration in minutes (1 Hr 30 Mins)'),
('exam_total_marks', '100', 'Total score across all 3 sections'),
('exam_passing_marks', '40', 'Minimum aggregate score required for passing and shortlisting'),
('min_screen_width_px', '1280', 'Minimum browser viewport width required for desktop examination access'),
('proctor_webcam_mode', 'adaptive', 'Webcam enforcement mode: adaptive (fallback to external monitor if no cam)'),
('max_proctor_violations', '3', 'Strike threshold before examination session is auto-terminated'),
('results_auto_announce', '0', 'Zero automatic announcement; requires explicit admin approval and publish action')
ON DUPLICATE KEY UPDATE `setting_value` = VALUES(`setting_value`);

-- ------------------------------------------------------------------------------
-- 26. Offline Exam Answers & Sync Synchronization (Module 14)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `student_answers` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `attempt_id` INT NOT NULL,
  `student_id` INT NOT NULL,
  `section_id` VARCHAR(50) NOT NULL,
  `question_id` VARCHAR(50) NOT NULL,
  `selected_option` VARCHAR(100) DEFAULT NULL,
  `code_content` LONGTEXT DEFAULT NULL,
  `code_lang` VARCHAR(30) DEFAULT NULL,
  `is_synced` TINYINT(1) DEFAULT 1,
  `client_timestamp` BIGINT DEFAULT NULL,
  `server_timestamp` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_ans_attempt` (`attempt_id`),
  INDEX `idx_ans_student` (`student_id`),
  INDEX `idx_ans_question` (`question_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `offline_sync_logs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `attempt_id` INT NOT NULL,
  `student_id` INT NOT NULL,
  `sync_batch_id` VARCHAR(64) NOT NULL,
  `synced_items_count` INT NOT NULL DEFAULT 0,
  `client_time` VARCHAR(50) DEFAULT NULL,
  `status` ENUM('success', 'conflict', 'failed') DEFAULT 'success',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_sync_attempt` (`attempt_id`),
  INDEX `idx_sync_student` (`student_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- Seed Sample Tasks for Candidates
-- ------------------------------------------------------------------------------
INSERT INTO `student_tasks` (`id`, `title`, `description`, `task_type`, `priority`, `due_date`, `target_type`, `instructions`, `status`) VALUES
(1, 'Complete Profile & Academic Verification', 'Verify registered college, branch, current semester, backlogs status, and all 8 work preference responses.', 'Onboarding', 'High', DATE_ADD(NOW(), INTERVAL 3 DAY), 'all', 'Ensure your uploaded resume and college details match official university records.', 'Assigned'),
(2, 'Practice Coding Sandbox Test Suite', 'Launch the multi-language online coding sandbox to familiarize yourself with test case execution and language syntax.', 'Technical Assignment', 'Medium', DATE_ADD(NOW(), INTERVAL 5 DAY), 'all', 'Run sample test cases in Python, JavaScript, Java or C++ prior to the scheduled GET examination.', 'Assigned')
ON DUPLICATE KEY UPDATE `title` = VALUES(`title`);


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

