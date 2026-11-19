<?php
// ==============================================================================
// Metadata API: Curated Andhra Pradesh Colleges, Courses & Dynamic Branches
// ==============================================================================

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/db.php';

$action = $_GET['action'] ?? 'all';
$course = $_GET['course'] ?? '';
$qualification = $_GET['qualification'] ?? '';
$search = trim($_GET['search'] ?? '');

$pdo = getDbConnection();

// Fallback in-memory curated data if DB is temporarily offline
$fallbackCourses = [
    [
        "code" => "B.Tech",
        "name" => "B.Tech (Bachelor of Technology / B.E.)",
        "qualification" => "Undergraduate",
        "branches" => [
            "Computer Science and Engineering",
            "Artificial Intelligence and Data Science",
            "Artificial Intelligence and Machine Learning",
            "Information Technology",
            "Electronics and Communication Engineering",
            "Electrical and Electronics Engineering",
            "Mechanical Engineering",
            "Civil Engineering",
            "Cyber Security",
            "Data Science",
            "Agricultural Engineering"
        ]
    ],
    [
        "code" => "M.Tech",
        "name" => "M.Tech (Master of Technology / M.E.)",
        "qualification" => "Postgraduate",
        "branches" => [
            "Computer Science and Engineering",
            "Artificial Intelligence",
            "Data Science",
            "Cyber Security",
            "VLSI",
            "Software Engineering",
            "Machine Learning"
        ]
    ],
    [
        "code" => "BCA",
        "name" => "BCA (Bachelor of Computer Applications)",
        "qualification" => "Undergraduate",
        "branches" => [
            "Computer Applications",
            "Data Science",
            "Artificial Intelligence"
        ]
    ],
    [
        "code" => "MCA",
        "name" => "MCA (Master of Computer Applications)",
        "qualification" => "Postgraduate",
        "branches" => [
            "Computer Applications",
            "Artificial Intelligence",
            "Data Science"
        ]
    ],
    [
        "code" => "B.Sc",
        "name" => "B.Sc (Bachelor of Science)",
        "qualification" => "Undergraduate",
        "branches" => [
            "Computer Science",
            "Mathematics",
            "Statistics",
            "Physics",
            "Chemistry",
            "Biotechnology",
            "Electronics"
        ]
    ],
    [
        "code" => "M.Sc",
        "name" => "M.Sc (Master of Science)",
        "qualification" => "Postgraduate",
        "branches" => [
            "Computer Science",
            "Mathematics",
            "Statistics",
            "Data Science",
            "Artificial Intelligence"
        ]
    ],
    [
        "code" => "B.Com",
        "name" => "B.Com (Bachelor of Commerce)",
        "qualification" => "Undergraduate",
        "branches" => [
            "General",
            "Computer Applications",
            "Accounting and Finance"
        ]
    ]
];

$fallbackColleges = [
    ['name' => 'Adarsh College of Engineering, Chebrolu, Kakinada', 'district' => 'Kakinada', 'type' => 'Private Engineering', 'level' => 'UG,PG'],
    ['name' => 'Kakinada Institute of Technology and Science (KITS), Divili', 'district' => 'Kakinada', 'type' => 'Private Engineering', 'level' => 'UG,PG'],
    ['name' => 'KKR & KSR Institute of Technology & Sciences (KITS Autonomous), Guntur', 'district' => 'Guntur', 'type' => 'Autonomous Engineering', 'level' => 'UG,PG'],
    ['name' => 'Chebrolu Engineering College, Chebrolu', 'district' => 'Guntur', 'type' => 'Private Engineering', 'level' => 'UG,PG'],
    ['name' => 'Andhra University College of Engineering (AUCE Autonomous), Visakhapatnam', 'district' => 'Visakhapatnam', 'type' => 'State University / Premier', 'level' => 'UG,PG'],
    ['name' => 'University College of Engineering Kakinada (UCEK - JNTUK)', 'district' => 'Kakinada', 'type' => 'State University / Premier', 'level' => 'UG,PG'],
    ['name' => 'Sri Venkateswara University College of Engineering (SVUCE), Tirupati', 'district' => 'Tirupati', 'type' => 'State University / Premier', 'level' => 'UG,PG'],
    ['name' => 'JNTUA College of Engineering, Anantapur', 'district' => 'Anantapur', 'type' => 'State University / Premier', 'level' => 'UG,PG'],
    ['name' => 'JNTU-GV College of Engineering Vizianagaram (UCEV)', 'district' => 'Vizianagaram', 'type' => 'State University / Premier', 'level' => 'UG,PG'],
    ['name' => 'Acharya Nagarjuna University College of Engineering, Guntur', 'district' => 'Guntur', 'type' => 'State University', 'level' => 'UG,PG'],
    ['name' => 'Adikavi Nannaya University College of Engineering, Rajahmundry', 'district' => 'East Godavari', 'type' => 'State University', 'level' => 'UG,PG'],
    ['name' => 'Krishna University College of Engineering & Technology, Machilipatnam', 'district' => 'Krishna', 'type' => 'State University', 'level' => 'UG,PG'],
    ['name' => 'Yogi Vemana University College of Engineering, Proddatur', 'district' => 'YSR Kadapa', 'type' => 'State University', 'level' => 'UG,PG'],
    ['name' => 'Rayalaseema University College of Engineering, Kurnool', 'district' => 'Kurnool', 'type' => 'State University', 'level' => 'UG,PG'],
    ['name' => 'Vikrama Simhapuri University College, Nellore', 'district' => 'Nellore', 'type' => 'State University', 'level' => 'UG,PG'],
    ['name' => 'Dr. B.R. Ambedkar University College of Engineering, Srikakulam', 'district' => 'Srikakulam', 'type' => 'State University', 'level' => 'UG,PG'],
    ['name' => 'Sri Padmavati Mahila Visvavidyalayam (SPMVV Women\'s University), Tirupati', 'district' => 'Tirupati', 'type' => 'State University', 'level' => 'UG,PG'],
    ['name' => 'Indian Institute of Technology Tirupati (IIT Tirupati)', 'district' => 'Tirupati', 'type' => 'Institute of National Importance', 'level' => 'UG,PG'],
    ['name' => 'Indian Institute of Information Technology Sri City (IIIT Sri City)', 'district' => 'Tirupati', 'type' => 'Institute of National Importance', 'level' => 'UG,PG'],
    ['name' => 'IIITDM Kurnool - Indian Institute of Information Technology', 'district' => 'Kurnool', 'type' => 'Institute of National Importance', 'level' => 'UG,PG'],
    ['name' => 'National Institute of Technology Andhra Pradesh (NIT AP), Tadepalligudem', 'district' => 'West Godavari', 'type' => 'Institute of National Importance', 'level' => 'UG,PG'],
    ['name' => 'KL University (Koneru Lakshmaiah Education Foundation Deemed University), Vaddeswaram', 'district' => 'Guntur', 'type' => 'Deemed University', 'level' => 'UG,PG'],
    ['name' => 'Vignan\'s Foundation for Science, Technology & Research (VFSTR Deemed University), Vadlamudi', 'district' => 'Guntur', 'type' => 'Deemed University', 'level' => 'UG,PG'],
    ['name' => 'GITAM Deemed to be University, Rushikonda, Visakhapatnam', 'district' => 'Visakhapatnam', 'type' => 'Deemed University', 'level' => 'UG,PG'],
    ['name' => 'Mohan Babu University (Sree Vidyanikethan), A. Rangampet, Tirupati', 'district' => 'Tirupati', 'type' => 'State Private University', 'level' => 'UG,PG'],
    ['name' => 'Aditya Engineering College (AEC Autonomous), Surampalem', 'district' => 'Kakinada', 'type' => 'Autonomous Engineering', 'level' => 'UG,PG'],
    ['name' => 'Aditya College of Engineering & Technology (ACET Autonomous), Surampalem', 'district' => 'Kakinada', 'type' => 'Autonomous Engineering', 'level' => 'UG,PG'],
    ['name' => 'Aditya College of Engineering (ACE), Surampalem', 'district' => 'Kakinada', 'type' => 'Private Engineering', 'level' => 'UG,PG'],
    ['name' => 'Aditya Pharmacy College, Surampalem', 'district' => 'Kakinada', 'type' => 'Pharmacy College', 'level' => 'UG,PG'],
    ['name' => 'Aditya Degree & PG College, Kakinada / Rajahmundry', 'district' => 'Kakinada', 'type' => 'Degree & PG College', 'level' => 'UG,PG'],
    ['name' => 'Pragati Engineering College (PEC Autonomous), Surampalem', 'district' => 'Kakinada', 'type' => 'Autonomous Engineering', 'level' => 'UG,PG'],
    ['name' => 'Godavari Institute of Engineering & Technology (GIET Autonomous), Rajahmundry', 'district' => 'East Godavari', 'type' => 'Autonomous Engineering', 'level' => 'UG,PG'],
    ['name' => 'GIET College of Engineering, Rajahmundry', 'district' => 'East Godavari', 'type' => 'Private Engineering', 'level' => 'UG,PG'],
    ['name' => 'GIET Engineering College, Rajahmundry', 'district' => 'East Godavari', 'type' => 'Private Engineering', 'level' => 'UG,PG'],
    ['name' => 'BVC Engineering College (Autonomous), Odalarevu', 'district' => 'Dr. B.R. Ambedkar Konaseema', 'type' => 'Autonomous Engineering', 'level' => 'UG,PG'],
    ['name' => 'BVC Institute of Technology & Science, Batlapalem / Amalapuram', 'district' => 'Dr. B.R. Ambedkar Konaseema', 'type' => 'Private Engineering', 'level' => 'UG,PG'],
    ['name' => 'BVC College of Engineering, Rajahmundry', 'district' => 'East Godavari', 'type' => 'Private Engineering', 'level' => 'UG,PG'],
    ['name' => 'Kakinada Institute of Engineering & Technology (KIET), Kakinada', 'district' => 'Kakinada', 'type' => 'Private Engineering', 'level' => 'UG,PG'],
    ['name' => 'KIET Engineering College for Women, Korangi', 'district' => 'Kakinada', 'type' => 'Private Engineering', 'level' => 'UG,PG'],
    ['name' => 'KIET-II (Kakinada Institute of Engineering & Technology-II)', 'district' => 'Kakinada', 'type' => 'Private Engineering', 'level' => 'UG,PG'],
    ['name' => 'Ideal Institute of Technology, Vidyut Nagar, Kakinada', 'district' => 'Kakinada', 'type' => 'Private Engineering', 'level' => 'UG,PG'],
    ['name' => 'Chaitanya Institute of Science & Technology (CIST), Kakinada', 'district' => 'Kakinada', 'type' => 'Private Engineering', 'level' => 'UG,PG'],
    ['name' => 'VS Lakshmi Engineering College for Women, Kakinada', 'district' => 'Kakinada', 'type' => 'Private Engineering', 'level' => 'UG,PG'],
    ['name' => 'International School of Technology & Sciences (ISTS) for Women, Rajanagaram', 'district' => 'East Godavari', 'type' => 'Private Engineering', 'level' => 'UG,PG'],
    ['name' => 'Rajamahendri Institute of Engineering & Technology (RIET), Rajahmundry', 'district' => 'East Godavari', 'type' => 'Private Engineering', 'level' => 'UG,PG'],
    ['name' => 'Lenora College of Engineering, Rampachodavaram', 'district' => 'Alluri Sitharama Raju', 'type' => 'Private Engineering', 'level' => 'UG,PG'],
    ['name' => 'Swarnandhra Institute of Engineering & Technology, Seethanagaram', 'district' => 'East Godavari', 'type' => 'Private Engineering', 'level' => 'UG,PG'],
    ['name' => 'PR Government College (Autonomous), Kakinada', 'district' => 'Kakinada', 'type' => 'Degree & PG College', 'level' => 'UG,PG'],
    ['name' => 'Government College (Autonomous), Rajahmundry', 'district' => 'East Godavari', 'type' => 'Degree & PG College', 'level' => 'UG,PG'],
    ['name' => 'MSN Degree College, Kakinada', 'district' => 'Kakinada', 'type' => 'Degree College', 'level' => 'UG'],
    ['name' => 'Gayatri Vidya Parishad College of Engineering (GVPCOE Autonomous), Madhurawada', 'district' => 'Visakhapatnam', 'type' => 'Autonomous Engineering', 'level' => 'UG,PG'],
    ['name' => 'Gayatri Vidya Parishad College of Engineering for Women (GVPW), Kommadi', 'district' => 'Visakhapatnam', 'type' => 'Autonomous Engineering', 'level' => 'UG,PG'],
    ['name' => 'ANITS - Anil Neerukonda Institute of Technology & Sciences (Autonomous)', 'district' => 'Visakhapatnam', 'type' => 'Autonomous Engineering', 'level' => 'UG,PG'],
    ['name' => 'Raghu Engineering College (Autonomous), Dakamarri', 'district' => 'Visakhapatnam', 'type' => 'Autonomous Engineering', 'level' => 'UG,PG'],
    ['name' => 'Raghu Institute of Technology (Autonomous), Dakamarri', 'district' => 'Visakhapatnam', 'type' => 'Autonomous Engineering', 'level' => 'UG,PG'],
    ['name' => 'Vignan\'s Institute of Information Technology (VIIT Autonomous), Duvvada', 'district' => 'Visakhapatnam', 'type' => 'Autonomous Engineering', 'level' => 'UG,PG'],
    ['name' => 'NSRIT - Nadimpalli Satyanarayana Raju Institute of Technology, Sontyam', 'district' => 'Visakhapatnam', 'type' => 'Autonomous Engineering', 'level' => 'UG,PG'],
    ['name' => 'Dadi Institute of Engineering & Technology (DIET Autonomous), Anakapalli', 'district' => 'Anakapalli', 'type' => 'Autonomous Engineering', 'level' => 'UG,PG'],
    ['name' => 'Chaitanya Engineering College, Kommadi', 'district' => 'Visakhapatnam', 'type' => 'Private Engineering', 'level' => 'UG,PG'],
    ['name' => 'Sanketika Vidya Parishad Engineering College, Pothinamallayyapalem', 'district' => 'Visakhapatnam', 'type' => 'Private Engineering', 'level' => 'UG,PG'],
    ['name' => 'Visakha Institute of Engineering & Technology, Narava', 'district' => 'Visakhapatnam', 'type' => 'Private Engineering', 'level' => 'UG,PG'],
    ['name' => 'Wellfare Institute of Science, Technology & Management, Pinagadi', 'district' => 'Visakhapatnam', 'type' => 'Private Engineering', 'level' => 'UG,PG'],
    ['name' => 'Al-Aman College of Engineering, Visakhapatnam', 'district' => 'Visakhapatnam', 'type' => 'Private Engineering', 'level' => 'UG,PG'],
    ['name' => 'Gayatri Vidya Parishad College for Degree and PG Courses, MVP Colony', 'district' => 'Visakhapatnam', 'type' => 'Degree & PG College', 'level' => 'UG,PG'],
    ['name' => 'Dr. Lankapalli Bullayya College, Visakhapatnam', 'district' => 'Visakhapatnam', 'type' => 'Degree & PG College', 'level' => 'UG,PG'],
    ['name' => 'Dr. V.S. Krishna Government Degree College, Visakhapatnam', 'district' => 'Visakhapatnam', 'type' => 'Degree & PG College', 'level' => 'UG,PG'],
    ['name' => 'MVGR College of Engineering (Maharaj Vijayaram Gajapathi Raj - Autonomous)', 'district' => 'Vizianagaram', 'type' => 'Autonomous Engineering', 'level' => 'UG,PG'],
    ['name' => 'Lendi Institute of Engineering & Technology (Autonomous), Jonnada', 'district' => 'Vizianagaram', 'type' => 'Autonomous Engineering', 'level' => 'UG,PG'],
    ['name' => 'AITAM - Aditya Institute of Technology & Management (Autonomous), Tekkali', 'district' => 'Srikakulam', 'type' => 'Autonomous Engineering', 'level' => 'UG,PG'],
    ['name' => 'GMR Institute of Technology (GMRIT Autonomous), Rajam', 'district' => 'Vizianagaram', 'type' => 'Autonomous Engineering', 'level' => 'UG,PG'],
    ['name' => 'Satya Institute of Technology and Management (SITAM), Vizianagaram', 'district' => 'Vizianagaram', 'type' => 'Private Engineering', 'level' => 'UG,PG'],
    ['name' => 'Avanthi Institute of Engineering & Technology, Cherukupally', 'district' => 'Vizianagaram', 'type' => 'Private Engineering', 'level' => 'UG,PG'],
    ['name' => 'Gokul Group of Institutions, Bobbili', 'district' => 'Vizianagaram', 'type' => 'Private Engineering', 'level' => 'UG,PG'],
    ['name' => 'Sri Sivani College of Engineering, Chilakapalem, Srikakulam', 'district' => 'Srikakulam', 'type' => 'Private Engineering', 'level' => 'UG,PG'],
    ['name' => 'Praveenya Institute of Marine Engineering & Maritime Studies, Modavalasa', 'district' => 'Vizianagaram', 'type' => 'Private Engineering', 'level' => 'UG,PG'],
    ['name' => 'Government Degree College (Men), Srikakulam', 'district' => 'Srikakulam', 'type' => 'Degree College', 'level' => 'UG'],
    ['name' => 'MR Degree College (Mansas), Vizianagaram', 'district' => 'Vizianagaram', 'type' => 'Degree College', 'level' => 'UG'],
    ['name' => 'SRKR Engineering College (Autonomous), Bhimavaram', 'district' => 'West Godavari', 'type' => 'Autonomous Engineering', 'level' => 'UG,PG'],
    ['name' => 'Shri Vishnu Engineering College for Women (SVECW Autonomous), Bhimavaram', 'district' => 'West Godavari', 'type' => 'Autonomous Engineering', 'level' => 'UG,PG'],
    ['name' => 'Vishnu Institute of Technology (VIT Autonomous), Bhimavaram', 'district' => 'West Godavari', 'type' => 'Autonomous Engineering', 'level' => 'UG,PG'],
    ['name' => 'Sir C.R. Reddy College of Engineering (Autonomous), Eluru', 'district' => 'Eluru', 'type' => 'Autonomous Engineering', 'level' => 'UG,PG'],
    ['name' => 'Sri Vasavi Engineering College (Autonomous), Pedatadepalli, Tadepalligudem', 'district' => 'West Godavari', 'type' => 'Autonomous Engineering', 'level' => 'UG,PG'],
    ['name' => 'Swarnandhra College of Engineering & Technology (Autonomous), Narsapur', 'district' => 'West Godavari', 'type' => 'Autonomous Engineering', 'level' => 'UG,PG'],
    ['name' => 'Ramachandra College of Engineering (Autonomous), Vatluru, Eluru', 'district' => 'Eluru', 'type' => 'Autonomous Engineering', 'level' => 'UG,PG'],
    ['name' => 'DNR College of Engineering & Technology, Bhimavaram', 'district' => 'West Godavari', 'type' => 'Private Engineering', 'level' => 'UG,PG'],
    ['name' => 'Grandhi Varalakshmi Venkatarao Institute of Technology (GVIT), Bhimavaram', 'district' => 'West Godavari', 'type' => 'Private Engineering', 'level' => 'UG,PG'],
    ['name' => 'Eluru College of Engineering & Technology (ECET), Eluru', 'district' => 'Eluru', 'type' => 'Private Engineering', 'level' => 'UG,PG'],
    ['name' => 'Helapuri Institute of Technology and Science, Eluru', 'district' => 'Eluru', 'type' => 'Private Engineering', 'level' => 'UG,PG'],
    ['name' => 'Sir C R Reddy Degree College, Eluru', 'district' => 'Eluru', 'type' => 'Degree & PG College', 'level' => 'UG,PG'],
    ['name' => 'DNR Degree College (Autonomous), Bhimavaram', 'district' => 'West Godavari', 'type' => 'Degree & PG College', 'level' => 'UG,PG'],
    ['name' => 'KGRL College (Autonomous), Bhimavaram', 'district' => 'West Godavari', 'type' => 'Degree & PG College', 'level' => 'UG,PG'],
    ['name' => 'Velagapudi Ramakrishna Siddhartha Engineering College (VRSEC Autonomous), Vijayawada', 'district' => 'Krishna', 'type' => 'Autonomous Engineering', 'level' => 'UG,PG'],
    ['name' => 'Prasad V. Potluri Siddhartha Institute of Technology (PVPSIT Autonomous), Vijayawada', 'district' => 'Krishna', 'type' => 'Autonomous Engineering', 'level' => 'UG,PG'],
    ['name' => 'Gudlavalleru Engineering College (Seshadri Rao GEC Autonomous), Gudlavalleru', 'district' => 'Krishna', 'type' => 'Autonomous Engineering', 'level' => 'UG,PG'],
    ['name' => 'Lakireddy Bali Reddy College of Engineering (LBRCE Autonomous), Mylavaram', 'district' => 'NTR', 'type' => 'Autonomous Engineering', 'level' => 'UG,PG'],
    ['name' => 'MIC College of Technology (DVR & Dr. HS MIC Autonomous), Kanchikacherla', 'district' => 'NTR', 'type' => 'Autonomous Engineering', 'level' => 'UG,PG'],
    ['name' => 'Andhra Loyola Institute of Engineering & Technology (ALIET), Vijayawada', 'district' => 'NTR', 'type' => 'Private Engineering', 'level' => 'UG,PG'],
    ['name' => 'Dhanekula Institute of Engineering & Technology (DIET), Ganguru, Vijayawada', 'district' => 'Krishna', 'type' => 'Private Engineering', 'level' => 'UG,PG'],
    ['name' => 'PSCMR College of Engineering and Technology, Vijayawada', 'district' => 'NTR', 'type' => 'Private Engineering', 'level' => 'UG,PG'],
    ['name' => 'SRK Institute of Technology, Enikepadu, Vijayawada', 'district' => 'Krishna', 'type' => 'Private Engineering', 'level' => 'UG,PG'],
    ['name' => 'Usha Rama College of Engineering and Technology, Telaprolu', 'district' => 'Krishna', 'type' => 'Private Engineering', 'level' => 'UG,PG'],
    ['name' => 'Vikas College of Engineering and Technology, Nunna', 'district' => 'Krishna', 'type' => 'Private Engineering', 'level' => 'UG,PG'],
    ['name' => 'Amrita Sai Institute of Science & Technology, Paritala', 'district' => 'NTR', 'type' => 'Private Engineering', 'level' => 'UG,PG'],
    ['name' => 'Nimra College of Engineering and Technology, Ibrahimpatnam', 'district' => 'NTR', 'type' => 'Private Engineering', 'level' => 'UG,PG'],
    ['name' => 'Andhra Loyola College (Autonomous), Vijayawada', 'district' => 'NTR', 'type' => 'Degree & PG College', 'level' => 'UG,PG'],
    ['name' => 'PB Siddhartha College of Arts & Science (Autonomous), Vijayawada', 'district' => 'Krishna', 'type' => 'Degree & PG College', 'level' => 'UG,PG'],
    ['name' => 'RVR & JC College of Engineering (Autonomous), Chowdavaram, Guntur', 'district' => 'Guntur', 'type' => 'Autonomous Engineering', 'level' => 'UG,PG'],
    ['name' => 'Vasireddy Venkatadri Institute of Technology (VVIT Autonomous), Nambur', 'district' => 'Guntur', 'type' => 'Autonomous Engineering', 'level' => 'UG,PG'],
    ['name' => 'Bapatla Engineering College (BEC Autonomous), Bapatla', 'district' => 'Bapatla', 'type' => 'Autonomous Engineering', 'level' => 'UG,PG'],
    ['name' => 'Narasaraopeta Engineering College (NEC Autonomous), Narasaraopet', 'district' => 'Palnadu', 'type' => 'Autonomous Engineering', 'level' => 'UG,PG'],
    ['name' => 'Tirumala Engineering College (TEC Autonomous), Jonnalagadda, Narasaraopet', 'district' => 'Palnadu', 'type' => 'Autonomous Engineering', 'level' => 'UG,PG'],
    ['name' => 'Chalapathi Institute of Engineering and Technology (CIET Autonomous), Lam, Guntur', 'district' => 'Guntur', 'type' => 'Autonomous Engineering', 'level' => 'UG,PG'],
    ['name' => 'Kallam Haranadhareddy Institute of Technology (KHIT Autonomous), Chowdavaram', 'district' => 'Guntur', 'type' => 'Autonomous Engineering', 'level' => 'UG,PG'],
    ['name' => 'Vignan\'s Nirula Institute of Technology and Science for Women, Palakaluru, Guntur', 'district' => 'Guntur', 'type' => 'Private Engineering', 'level' => 'UG,PG'],
    ['name' => 'Vignan\'s Lara Institute of Technology & Science, Vadlamudi', 'district' => 'Guntur', 'type' => 'Private Engineering', 'level' => 'UG,PG'],
    ['name' => 'Bapatla Women\'s Engineering College, Bapatla', 'district' => 'Bapatla', 'type' => 'Private Engineering', 'level' => 'UG,PG'],
    ['name' => 'Narasaraopeta Institute of Technology (NIT), Narasaraopet', 'district' => 'Palnadu', 'type' => 'Private Engineering', 'level' => 'UG,PG'],
    ['name' => 'Chalapathi Institute of Technology (CIT), Mothadaka, Guntur', 'district' => 'Guntur', 'type' => 'Private Engineering', 'level' => 'UG,PG'],
    ['name' => 'Loyola Institute of Technology and Management, Sattenapalle', 'district' => 'Palnadu', 'type' => 'Private Engineering', 'level' => 'UG,PG'],
    ['name' => 'Malineni Perumallu Educational Society Group of Institutions, Pulladigunta', 'district' => 'Guntur', 'type' => 'Private Engineering', 'level' => 'UG,PG'],
    ['name' => 'Priyadarshini Institute of Technology and Science, Tenali', 'district' => 'Guntur', 'type' => 'Private Engineering', 'level' => 'UG,PG'],
    ['name' => 'Chebrolu Engineering College, Chebrolu', 'district' => 'Guntur', 'type' => 'Private Engineering', 'level' => 'UG,PG'],
    ['name' => 'JKC College (Autonomous), Guntur', 'district' => 'Guntur', 'type' => 'Degree & PG College', 'level' => 'UG,PG'],
    ['name' => 'Hindu College, Guntur', 'district' => 'Guntur', 'type' => 'Degree & PG College', 'level' => 'UG,PG'],
    ['name' => 'QIS College of Engineering and Technology (Autonomous), Ongole', 'district' => 'Prakasam', 'type' => 'Autonomous Engineering', 'level' => 'UG,PG'],
    ['name' => 'Pace Institute of Technology and Sciences (Autonomous), Ongole', 'district' => 'Prakasam', 'type' => 'Autonomous Engineering', 'level' => 'UG,PG'],
    ['name' => 'St. Ann\'s College of Engineering & Technology (SACET Autonomous), Chirala', 'district' => 'Bapatla', 'type' => 'Autonomous Engineering', 'level' => 'UG,PG'],
    ['name' => 'NBKR Institute of Science & Technology (NBKRIST Autonomous), Vidyanagar', 'district' => 'Tirupati', 'type' => 'Autonomous Engineering', 'level' => 'UG,PG'],
    ['name' => 'Narayana Engineering College (Autonomous), Nellore', 'district' => 'Nellore', 'type' => 'Autonomous Engineering', 'level' => 'UG,PG'],
    ['name' => 'Narayana Engineering College (Autonomous), Gudur', 'district' => 'Tirupati', 'type' => 'Autonomous Engineering', 'level' => 'UG,PG'],
    ['name' => 'Audisankara College of Engineering & Technology (ASCET Autonomous), Gudur', 'district' => 'Tirupati', 'type' => 'Autonomous Engineering', 'level' => 'UG,PG'],
    ['name' => 'Geethanjali Institute of Science & Technology (GIST), Nellore', 'district' => 'Nellore', 'type' => 'Private Engineering', 'level' => 'UG,PG'],
    ['name' => 'QIS Institute of Technology, Ongole', 'district' => 'Prakasam', 'type' => 'Private Engineering', 'level' => 'UG,PG'],
    ['name' => 'RISE Krishna Sai Prakasam Group of Institutions, Ongole', 'district' => 'Prakasam', 'type' => 'Private Engineering', 'level' => 'UG,PG'],
    ['name' => 'RISE Krishna Sai Gandhi Group of Institutions, Ongole', 'district' => 'Prakasam', 'type' => 'Private Engineering', 'level' => 'UG,PG'],
    ['name' => 'Prakasam Engineering College, Kandukur', 'district' => 'Nellore', 'type' => 'Private Engineering', 'level' => 'UG,PG'],
    ['name' => 'Chirala Engineering College, Chirala', 'district' => 'Bapatla', 'type' => 'Private Engineering', 'level' => 'UG,PG'],
    ['name' => 'PBR VITS - Visvodaya Institute of Technology and Science, Kavali', 'district' => 'Nellore', 'type' => 'Private Engineering', 'level' => 'UG,PG'],
    ['name' => 'Jawahar Bharati Degree College, Kavali', 'district' => 'Nellore', 'type' => 'Degree College', 'level' => 'UG'],
    ['name' => 'Madanapalle Institute of Technology & Science (MITS Autonomous)', 'district' => 'Annamayya', 'type' => 'Autonomous Engineering', 'level' => 'UG,PG'],
    ['name' => 'Annamacharya Institute of Technology & Sciences (AITS Autonomous), Rajampet', 'district' => 'Annamayya', 'type' => 'Autonomous Engineering', 'level' => 'UG,PG'],
    ['name' => 'Chadalawada Ramanamma Engineering College (Autonomous), Tirupati', 'district' => 'Tirupati', 'type' => 'Autonomous Engineering', 'level' => 'UG,PG'],
    ['name' => 'Siddhartha Institute of Engineering and Technology (SIETK Autonomous), Puttur', 'district' => 'Tirupati', 'type' => 'Autonomous Engineering', 'level' => 'UG,PG'],
    ['name' => 'Siddhartha Institute of Science and Technology (SISTK Autonomous), Puttur', 'district' => 'Tirupati', 'type' => 'Autonomous Engineering', 'level' => 'UG,PG'],
    ['name' => 'Sreenivasa Institute of Technology and Management Studies (SITAMS Autonomous), Chittoor', 'district' => 'Chittoor', 'type' => 'Autonomous Engineering', 'level' => 'UG,PG'],
    ['name' => 'Sri Venkateswara College of Engineering (SVCE), Tirupati', 'district' => 'Tirupati', 'type' => 'Private Engineering', 'level' => 'UG,PG'],
    ['name' => 'Annamacharya Institute of Technology & Sciences (AITS), Tirupati', 'district' => 'Tirupati', 'type' => 'Private Engineering', 'level' => 'UG,PG'],
    ['name' => 'Vemu Institute of Technology, P. Kothakota, Chittoor', 'district' => 'Chittoor', 'type' => 'Private Engineering', 'level' => 'UG,PG'],
    ['name' => 'Kuppam Engineering College, Kuppam', 'district' => 'Chittoor', 'type' => 'Private Engineering', 'level' => 'UG,PG'],
    ['name' => 'Sree Rama Engineering College, Tirupati', 'district' => 'Tirupati', 'type' => 'Private Engineering', 'level' => 'UG,PG'],
    ['name' => 'Sri Venkatesa Perumal College of Engineering and Technology (SVPCET), Puttur', 'district' => 'Tirupati', 'type' => 'Private Engineering', 'level' => 'UG,PG'],
    ['name' => 'SV Arts & Science College, Tirupati', 'district' => 'Tirupati', 'type' => 'Degree College', 'level' => 'UG,PG'],
    ['name' => 'G. Pulla Reddy Engineering College (GPREC Autonomous), Kurnool', 'district' => 'Kurnool', 'type' => 'Autonomous Engineering', 'level' => 'UG,PG'],
    ['name' => 'Rajeev Gandhi Memorial College of Engineering & Technology (RGMCET Autonomous), Nandyal', 'district' => 'Nandyal', 'type' => 'Autonomous Engineering', 'level' => 'UG,PG'],
    ['name' => 'G. Pullaiah College of Engineering and Technology (GPCET Autonomous), Kurnool', 'district' => 'Kurnool', 'type' => 'Autonomous Engineering', 'level' => 'UG,PG'],
    ['name' => 'Santhiram Engineering College, Nandyal', 'district' => 'Nandyal', 'type' => 'Private Engineering', 'level' => 'UG,PG'],
    ['name' => 'Ravindra College of Engineering for Women, Kurnool', 'district' => 'Kurnool', 'type' => 'Private Engineering', 'level' => 'UG,PG'],
    ['name' => 'Brindavan Institute of Technology and Science (BITS), Kurnool', 'district' => 'Kurnool', 'type' => 'Private Engineering', 'level' => 'UG,PG'],
    ['name' => 'Dr. K.V. Subba Reddy Institute of Technology (KVSRIT), Kurnool', 'district' => 'Kurnool', 'type' => 'Private Engineering', 'level' => 'UG,PG'],
    ['name' => 'Bheema Institute of Technology and Science, Adoni', 'district' => 'Kurnool', 'type' => 'Private Engineering', 'level' => 'UG,PG'],
    ['name' => 'Silver Jubilee Government College (Autonomous), Kurnool', 'district' => 'Kurnool', 'type' => 'Degree & PG College', 'level' => 'UG,PG'],
    ['name' => 'Srinivasa Ramanujan Institute of Technology (SRIT Autonomous), Rotarypuram', 'district' => 'Anantapur', 'type' => 'Autonomous Engineering', 'level' => 'UG,PG'],
    ['name' => 'Gates Institute of Technology (Autonomous), Gooty', 'district' => 'Anantapur', 'type' => 'Autonomous Engineering', 'level' => 'UG,PG'],
    ['name' => 'Anantha Lakshmi Institute of Technology & Sciences, Anantapur', 'district' => 'Anantapur', 'type' => 'Private Engineering', 'level' => 'UG,PG'],
    ['name' => 'Intell Engineering College, Anantapur', 'district' => 'Anantapur', 'type' => 'Private Engineering', 'level' => 'UG,PG'],
    ['name' => 'BIT Institute of Technology, Hindupur', 'district' => 'Sri Sathya Sai', 'type' => 'Private Engineering', 'level' => 'UG,PG'],
    ['name' => 'Sir C.V. Raman Institute of Technology, Tadipatri', 'district' => 'Anantapur', 'type' => 'Private Engineering', 'level' => 'UG,PG'],
    ['name' => 'Tadipatri Engineering College, Tadipatri', 'district' => 'Anantapur', 'type' => 'Private Engineering', 'level' => 'UG,PG'],
    ['name' => 'Chiranjeevi Reddy Institute of Engineering & Technology, Anantapur', 'district' => 'Anantapur', 'type' => 'Private Engineering', 'level' => 'UG,PG'],
    ['name' => 'Government Degree College (Men Autonomous), Anantapur', 'district' => 'Anantapur', 'type' => 'Degree College', 'level' => 'UG,PG'],
    ['name' => 'KSRM College of Engineering (Autonomous), Kadapa', 'district' => 'YSR Kadapa', 'type' => 'Autonomous Engineering', 'level' => 'UG,PG'],
    ['name' => 'Kandula Obul Reddy Memorial College of Engineering (KORM), Kadapa', 'district' => 'YSR Kadapa', 'type' => 'Private Engineering', 'level' => 'UG,PG'],
    ['name' => 'KLM College of Engineering for Women, Kadapa', 'district' => 'YSR Kadapa', 'type' => 'Private Engineering', 'level' => 'UG,PG'],
    ['name' => 'Sri Venkateswara College of Engineering (SVEC), Kadapa', 'district' => 'YSR Kadapa', 'type' => 'Private Engineering', 'level' => 'UG,PG'],
    ['name' => 'Srinivasa Institute of Technology & Science, Kadapa', 'district' => 'YSR Kadapa', 'type' => 'Private Engineering', 'level' => 'UG,PG'],
    ['name' => 'Global College of Engineering & Technology, Kadapa', 'district' => 'YSR Kadapa', 'type' => 'Private Engineering', 'level' => 'UG,PG'],
    ['name' => 'Bharath College of Engineering and Technology for Women, Kadapa', 'district' => 'YSR Kadapa', 'type' => 'Private Engineering', 'level' => 'UG,PG'],
    ['name' => 'Government College for Men (Autonomous), Kadapa', 'district' => 'YSR Kadapa', 'type' => 'Degree College', 'level' => 'UG,PG'],
];


try {
    if ($pdo) {
        if ($action === 'courses' || $action === 'all') {
            $coursesStmt = $pdo->query("SELECT * FROM `courses` ORDER BY `sort_order` ASC");
            $dbCourses = $coursesStmt->fetchAll();

            $branchesStmt = $pdo->query("SELECT * FROM `course_branches` ORDER BY `id` ASC");
            $dbBranches = $branchesStmt->fetchAll();

            $branchesByCourse = [];
            foreach ($dbBranches as $b) {
                $branchesByCourse[$b['course_code']][] = $b['branch_name'];
            }

            $coursesList = [];
            foreach ($dbCourses as $c) {
                $coursesList[] = [
                    "code" => $c['code'],
                    "name" => $c['name'],
                    "qualification" => $c['qualification'],
                    "branches" => $branchesByCourse[$c['code']] ?? []
                ];
            }
            if (!empty($coursesList)) {
                $fallbackCourses = $coursesList;
            }
        }

        if ($action === 'colleges' || $action === 'all') {
            $collegesStmt = $pdo->query("SELECT `id`, `name`, `code`, `district`, `type`, `qualification_level` as level FROM `colleges` WHERE `is_active` = 1 ORDER BY `name` ASC");
            $dbColleges = $collegesStmt->fetchAll();
            if (!empty($dbColleges)) {
                $existing = [];
                foreach ($dbColleges as $c) {
                    $existing[strtolower(trim($c['name']))] = true;
                }
                $guaranteed = [
                    ['name' => 'Adarsh College of Engineering, Chebrolu, Kakinada', 'district' => 'Kakinada', 'type' => 'Private Engineering', 'level' => 'UG,PG'],
                    ['name' => 'Kakinada Institute of Technology and Science (KITS), Divili', 'district' => 'Kakinada', 'type' => 'Private Engineering', 'level' => 'UG,PG'],
                    ['name' => 'KKR & KSR Institute of Technology & Sciences (KITS Autonomous), Guntur', 'district' => 'Guntur', 'type' => 'Autonomous Engineering', 'level' => 'UG,PG'],
                    ['name' => 'Chebrolu Engineering College, Chebrolu', 'district' => 'Guntur', 'type' => 'Private Engineering', 'level' => 'UG,PG']
                ];
                foreach ($guaranteed as $gc) {
                    if (!isset($existing[strtolower(trim($gc['name']))])) {
                        $dbColleges[] = $gc;
                    }
                }
                $fallbackColleges = $dbColleges;
            }
        }
    }
} catch (Exception $e) {
    error_log("Metadata API Error: " . $e->getMessage());
}

// Filter colleges if course or qualification specified
$filteredColleges = $fallbackColleges;
if ($course) {
    $isEngineering = in_array($course, ['B.Tech', 'M.Tech']);
    $filteredColleges = array_filter($fallbackColleges, function($c) use ($isEngineering) {
        $type = $c['type'] ?? '';
        if ($isEngineering) {
            return stripos($type, 'Engineering') !== false || stripos($type, 'University') !== false || stripos($type, 'National') !== false || stripos($type, 'Autonomous') !== false;
        } else {
            return stripos($type, 'Degree') !== false || stripos($type, 'University') !== false || stripos($type, 'College') !== false;
        }
    });
    $filteredColleges = array_values($filteredColleges);
}

if ($search) {
    $searchLower = strtolower($search);
    $filteredColleges = array_filter($filteredColleges, function($c) use ($searchLower) {
        return strpos(strtolower($c['name']), $searchLower) !== false ||
               strpos(strtolower($c['district']), $searchLower) !== false ||
               strpos(strtolower($c['type']), $searchLower) !== false;
    });
    $filteredColleges = array_values($filteredColleges);
}

echo json_encode([
    "success" => true,
    "courses" => $fallbackCourses,
    "colleges" => $filteredColleges,
    "totalColleges" => count($filteredColleges)
]);
?>

