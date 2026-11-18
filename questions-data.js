// ==============================================================================
// Assessment Question Bank: 3-Section Examination Architecture (100 Marks Total)
// Section 1: Quantitative Aptitude, Analytical Reasoning & Verbal Ability (40 Qs - 40 Marks)
// Section 2: Technical Core Knowledge - Branch Specific (20 Qs - 20 Marks)
// Section 3: Technical Coding Round - 2 Problems × 10 Test Cases (40 Marks)
// Total Duration: 90 Minutes (1 Hour 30 Minutes) | Total Marks: 100 Marks
// ==============================================================================

const RECRUITMENT_ASSESSMENT = {
  id: "cognito-recruitment-2026",
  title: "Cognito Tech Hub & Quantex GET Assessment 2026",
  totalDurationMinutes: 90,
  totalMarks: 100,
  passingMarks: 60,
  instructions: [
    "Duration: Exactly 1 Hour 30 Minutes (90 Minutes) | Total Marks: 100 Marks.",
    "Section 1: Quantitative, Analytical Reasoning & Verbal Ability (40 Questions - 1 Mark each - 40 Marks).",
    "Section 2: Technical Core Knowledge (20 Questions - 1 Mark each - 20 Marks, branch-tailored).",
    "Section 3: Technical Coding Sandbox (2 Problems - 4 Test Cases each - All 4 test cases must pass without error to execute successfully and earn 20 Marks per problem - 40 Marks total).",
    "Security Policy: Fullscreen is mandatory. Tab-switching, window defocus, copy-paste, and screenshot attempts are monitored. 3 security violations will automatically terminate the assessment.",
    "Interruption Recovery: If an unexpected system or network disconnection occurs, an Admin Recovery Access Code is required to unlock your session."
  ],
  sections: [
    // --------------------------------------------------------------------------
    // SECTION 1: Quantitative Aptitude, Analytical Reasoning & Verbal Ability (40 Marks)
    // --------------------------------------------------------------------------
    {
      id: "sec-1",
      name: "Section 1: Quantitative Aptitude, Analytical Reasoning & Verbal Ability (Q&A&V)",
      description: "Numerical computation, logical reasoning patterns, data deduction, and verbal comprehension.",
      durationMinutes: 35,
      totalMarks: 40,
      totalQuestions: 40,
      type: "mcq",
      questions: [
        // =====================================================================
        // PART 1: ARITHMETIC APTITUDE (Q1 - Q10)
        // =====================================================================
        {
          id: "apt-1",
          category: "Quantitative",
          subject: "Quantitative Aptitude",
          topic: "Time and Distance",
          question: "A train 180 m long crosses a 270 m platform in 18 seconds. What is its speed?",
          options: ["A) 80 km/h", "B) 85 km/h", "C) 90 km/h", "D) 100 km/h"],
          correctAnswer: 2, // C) 90 km/h
          explanation: "Total distance = 180 + 270 = 450 m. Speed = 450/18 = 25 m/s. In km/h: 25 × 18/5 = 90 km/h.",
          marks: 1
        },
        {
          id: "apt-2",
          category: "Quantitative",
          subject: "Quantitative Aptitude",
          topic: "Time and Work",
          question: "A can finish a job in 12 days and B in 18 days. How long will they take working together?",
          options: ["A) 6 days", "B) 7.2 days", "C) 8 days", "D) 9 days"],
          correctAnswer: 1, // B) 7.2 days
          explanation: "Combined daily work = 1/12 + 1/18 = 3/36 + 2/36 = 5/36. Time = 36/5 = 7.2 days.",
          marks: 1
        },
        {
          id: "apt-3",
          category: "Quantitative",
          subject: "Quantitative Aptitude",
          topic: "Profit and Loss",
          question: "An item marked 40% above cost price is sold after successive discounts of 10% and 5%. Find the profit percentage.",
          options: ["A) 19.7%", "B) 20%", "C) 21%", "D) 22%"],
          correctAnswer: 0, // A) 19.7%
          explanation: "Assume CP = 100. Marked price = 140. Selling price = 140 × 0.90 × 0.95 = 119.70. Profit = 19.70, so profit % = 19.7%.",
          marks: 1
        },
        {
          id: "apt-4",
          category: "Quantitative",
          subject: "Quantitative Aptitude",
          topic: "Averages",
          question: "The average of 8 numbers is 24. If 32 is removed, what is the average of the remaining numbers?",
          options: ["A) 22", "B) 22 6/7", "C) 23", "D) 23 1/7"],
          correctAnswer: 1, // B) 22 6/7
          explanation: "Original total = 8 × 24 = 192. Remaining total = 192 − 32 = 160. New average = 160/7 = 22 6/7.",
          marks: 1
        },
        {
          id: "apt-5",
          category: "Quantitative",
          subject: "Quantitative Aptitude",
          topic: "Compound Interest",
          question: "A sum amounts to ₹12,100 in 2 years at 10% compound interest per annum. What was the principal?",
          options: ["A) ₹9,000", "B) ₹10,000", "C) ₹10,500", "D) ₹11,000"],
          correctAnswer: 1, // B) ₹10,000
          explanation: "A = P(1 + 10/100)² = 1.21P. Therefore P = 12,100/1.21 = ₹10,000.",
          marks: 1
        },
        {
          id: "apt-6",
          category: "Quantitative",
          subject: "Quantitative Aptitude",
          topic: "Ratios & Mixtures",
          question: "A 30-litre mixture has milk and water in the ratio 2:1. How much water must be added to make the ratio 1:1?",
          options: ["A) 5 L", "B) 10 L", "C) 15 L", "D) 20 L"],
          correctAnswer: 1, // B) 10 L
          explanation: "Milk = 30 × 2/3 = 20 L; water = 10 L. For a 1:1 ratio, water must become 20 L. Add 10 L.",
          marks: 1
        },
        {
          id: "apt-7",
          category: "Quantitative",
          subject: "Quantitative Aptitude",
          topic: "Number Systems",
          question: "A number leaves remainder 5 when divided by 8. What remainder will three times the number leave when divided by 8?",
          options: ["A) 1", "B) 3", "C) 5", "D) 7"],
          correctAnswer: 3, // D) 7
          explanation: "Write n = 8k + 5. Then 3n = 24k + 15 = 8(3k + 1) + 7. Remainder = 7.",
          marks: 1
        },
        {
          id: "apt-8",
          category: "Quantitative",
          subject: "Quantitative Aptitude",
          topic: "Ratio & Proportion",
          question: "The incomes of A and B are in the ratio 3:4 and their expenses are in the ratio 2:3. If each saves ₹6,000, find A's income.",
          options: ["A) ₹12,000", "B) ₹15,000", "C) ₹18,000", "D) ₹20,000"],
          correctAnswer: 2, // C) ₹18,000
          explanation: "Let incomes be 3k and 4k. Expenses are (3k − 6000) and (4k − 6000) in ratio 2:3, so 3(3k − 6000) = 2(4k − 6000) → 9k − 18000 = 8k − 12000 → k = 6000. A's income = 3k = ₹18,000.",
          marks: 1
        },
        {
          id: "apt-9",
          category: "Quantitative",
          subject: "Quantitative Aptitude",
          topic: "Speed & Distance",
          question: "A car travels equal distances at 40 km/h and 60 km/h. What is its average speed for the whole journey?",
          options: ["A) 45 km/h", "B) 48 km/h", "C) 50 km/h", "D) 52 km/h"],
          correctAnswer: 1, // B) 48 km/h
          explanation: "For equal distances, average speed = 2uv/(u+v) = 2×40×60/(40+60) = 4,800/100 = 48 km/h.",
          marks: 1
        },
        {
          id: "apt-10",
          category: "Quantitative",
          subject: "Quantitative Aptitude",
          topic: "Probability",
          question: "Two dice are rolled. What is the probability that their sum is 9?",
          options: ["A) 1/6", "B) 1/9", "C) 1/12", "D) 5/36"],
          correctAnswer: 1, // B) 1/9
          explanation: "There are 36 equally likely outcomes. Sum 9 occurs in (3,6), (4,5), (5,4), (6,3): 4 outcomes. Probability = 4/36 = 1/9.",
          marks: 1
        },

        // =====================================================================
        // PART 2: LOGICAL REASONING (Q11 - Q20)
        // =====================================================================
        {
          id: "apt-11",
          category: "Analytical",
          subject: "Logical Reasoning",
          topic: "Number Series",
          question: "Find the next number: 3, 8, 15, 24, 35, __",
          options: ["A) 46", "B) 48", "C) 50", "D) 52"],
          correctAnswer: 1, // B) 48
          explanation: "Differences are 5, 7, 9, 11. The next difference is 13. So 35 + 13 = 48.",
          marks: 1
        },
        {
          id: "apt-12",
          category: "Analytical",
          subject: "Logical Reasoning",
          topic: "Coding-Decoding",
          question: "If TABLE is coded as UBCMF (each letter shifted one place forward), how is CHAIR coded?",
          options: ["A) DIBJS", "B) DIBIR", "C) BGZHQ", "D) DHCJS"],
          correctAnswer: 0, // A) DIBJS
          explanation: "Shift each letter forward by one: C→D, H→I, A→B, I→J, R→S. Code = DIBJS.",
          marks: 1
        },
        {
          id: "apt-13",
          category: "Analytical",
          subject: "Logical Reasoning",
          topic: "Direction Sense",
          question: "Ravi is facing north. He turns right, walks 10 m, turns right and walks 5 m, then turns left and walks 3 m. Which direction is he facing?",
          options: ["A) North", "B) South", "C) East", "D) West"],
          correctAnswer: 2, // C) East
          explanation: "From north, a right turn = east. Second right = south. A left turn from south = east.",
          marks: 1
        },
        {
          id: "apt-14",
          category: "Analytical",
          subject: "Logical Reasoning",
          topic: "Blood Relations",
          question: "Pointing to a woman, Arun says, 'She is the daughter of my father's only son.' How is the woman related to Arun?",
          options: ["A) Sister", "B) Daughter", "C) Niece", "D) Mother"],
          correctAnswer: 1, // B) Daughter
          explanation: "Arun's father's only son is Arun himself. The woman's parent is Arun, so she is his daughter.",
          marks: 1
        },
        {
          id: "apt-15",
          category: "Analytical",
          subject: "Logical Reasoning",
          topic: "Odd One Out",
          question: "Choose the odd one out.",
          options: ["A) 16", "B) 25", "C) 49", "D) 63"],
          correctAnswer: 3, // D) 63
          explanation: "16, 25 and 49 are perfect squares (4², 5², 7²). 63 is not a perfect square.",
          marks: 1
        },
        {
          id: "apt-16",
          category: "Analytical",
          subject: "Logical Reasoning",
          topic: "Syllogism",
          question: "Statements: All engineers are graduates. Some graduates are artists. Conclusion I: Some engineers are artists. Conclusion II: All engineers are graduates.",
          options: ["A) Only I follows", "B) Only II follows", "C) Both follow", "D) Neither follows"],
          correctAnswer: 1, // B) Only II follows
          explanation: "Conclusion II repeats the first statement, so it follows. The artists may or may not be engineers, so Conclusion I does not necessarily follow.",
          marks: 1
        },
        {
          id: "apt-17",
          category: "Analytical",
          subject: "Logical Reasoning",
          topic: "Seating Arrangement",
          question: "Five people P, Q, R, S and T sit in a row. P is left of Q. R is right of Q. S is left of P. T is right of R. Who sits in the middle?",
          options: ["A) P", "B) Q", "C) R", "D) S"],
          correctAnswer: 1, // B) Q
          explanation: "The order is S, P, Q, R, T. The third (middle) position is Q.",
          marks: 1
        },
        {
          id: "apt-18",
          category: "Analytical",
          subject: "Logical Reasoning",
          topic: "Letter Series",
          question: "Find the missing term: AZ, BY, CX, DW, __",
          options: ["A) EU", "B) EV", "C) FU", "D) EX"],
          correctAnswer: 1, // B) EV
          explanation: "First letters move forward A, B, C, D, E. Second letters move backward Z, Y, X, W, V. Missing pair = EV.",
          marks: 1
        },
        {
          id: "apt-19",
          category: "Analytical",
          subject: "Logical Reasoning",
          topic: "Calendar",
          question: "If 1 January is a Monday, what day will 1 February be in a non-leap year?",
          options: ["A) Tuesday", "B) Wednesday", "C) Thursday", "D) Friday"],
          correctAnswer: 2, // C) Thursday
          explanation: "January has 31 days. 31 ÷ 7 leaves remainder 3. Moving 3 days forward from Monday gives Thursday.",
          marks: 1
        },
        {
          id: "apt-20",
          category: "Analytical",
          subject: "Logical Reasoning",
          topic: "Order & Ranking",
          question: "A is taller than B. C is taller than A. D is shorter than B. Who is the tallest?",
          options: ["A) A", "B) B", "C) C", "D) D"],
          correctAnswer: 2, // C) C
          explanation: "The relationships are C > A > B > D. Therefore C is tallest.",
          marks: 1
        },

        // =====================================================================
        // PART 3: VERBAL ABILITY (Q21 - Q40)
        // =====================================================================
        {
          id: "apt-21",
          category: "Verbal",
          subject: "Verbal Ability",
          topic: "Grammar & Subject-Verb Agreement",
          question: "Choose the grammatically correct sentence.",
          options: [
            "A) Each of the students have submitted the assignment.",
            "B) Each of the students has submitted the assignment.",
            "C) Each students has submitted the assignment.",
            "D) Each of students have submitted assignment."
          ],
          correctAnswer: 1, // B
          explanation: "'Each' is singular and takes a singular verb, so 'has' is correct.",
          marks: 1
        },
        {
          id: "apt-22",
          category: "Verbal",
          subject: "Verbal Ability",
          topic: "Synonyms",
          question: "Choose the synonym of 'Meticulous'.",
          options: ["A) Careless", "B) Thorough", "C) Hasty", "D) Ordinary"],
          correctAnswer: 1, // B) Thorough
          explanation: "Meticulous means very careful and precise, paying attention to detail. 'Thorough' is the closest synonym.",
          marks: 1
        },
        {
          id: "apt-23",
          category: "Verbal",
          subject: "Verbal Ability",
          topic: "Antonyms",
          question: "Choose the antonym of 'Scarce'.",
          options: ["A) Rare", "B) Limited", "C) Abundant", "D) Insufficient"],
          correctAnswer: 2, // C) Abundant
          explanation: "'Scarce' means not enough or available in small quantities. 'Abundant' means plentiful.",
          marks: 1
        },
        {
          id: "apt-24",
          category: "Verbal",
          subject: "Verbal Ability",
          topic: "Subject-Verb Agreement",
          question: "Fill in the blank: Neither the manager nor the employees ____ willing to postpone the meeting.",
          options: ["A) is", "B) was", "C) are", "D) has"],
          correctAnswer: 2, // C) are
          explanation: "With 'neither…nor', the verb agrees with the nearer subject. 'Employees' is plural, so use 'are'.",
          marks: 1
        },
        {
          id: "apt-25",
          category: "Verbal",
          subject: "Verbal Ability",
          topic: "Punctuation",
          question: "Choose the correctly punctuated sentence.",
          options: [
            "A) Its raining, take an umbrella.",
            "B) It's raining; take an umbrella.",
            "C) Its raining; take an umbrella.",
            "D) It's raining take, an umbrella."
          ],
          correctAnswer: 1, // B) It's raining; take an umbrella.
          explanation: "'It's' means 'it is'. A semicolon correctly joins two closely related independent clauses.",
          marks: 1
        },
        {
          id: "apt-26",
          category: "Verbal",
          subject: "Verbal Ability",
          topic: "Voice Transformation",
          question: "Choose the correct passive voice: 'The team completed the project.'",
          options: [
            "A) The project is completed by the team.",
            "B) The project was completed by the team.",
            "C) The project has complete by the team.",
            "D) The team was completed by the project."
          ],
          correctAnswer: 1, // B) The project was completed by the team.
          explanation: "The active sentence is in simple past tense. Passive: object + was/were + past participle + by + subject.",
          marks: 1
        },
        {
          id: "apt-27",
          category: "Verbal",
          subject: "Verbal Ability",
          topic: "Idioms & Phrases",
          question: "Choose the correct meaning of the idiom 'Break the ice'.",
          options: ["A) Damage something", "B) Start a friendly conversation", "C) End a relationship", "D) Reveal a secret"],
          correctAnswer: 1, // B) Start a friendly conversation
          explanation: "'Break the ice' means to reduce initial awkwardness and help people begin interacting comfortably.",
          marks: 1
        },
        {
          id: "apt-28",
          category: "Verbal",
          subject: "Verbal Ability",
          topic: "Error Spotting",
          question: "Identify the error: 'One of my friends are working in Bengaluru.'",
          options: ["A) One of", "B) my friends", "C) are working", "D) in Bengaluru"],
          correctAnswer: 2, // C) are working
          explanation: "'One of my friends' takes a singular verb. Correct sentence: 'One of my friends is working in Bengaluru.'",
          marks: 1
        },
        {
          id: "apt-29",
          category: "Verbal",
          subject: "Verbal Ability",
          topic: "Sentence Connectors",
          question: "Choose the best connector: The software was expensive; ____, the company decided to purchase it because of its reliability.",
          options: ["A) however", "B) therefore", "C) similarly", "D) moreover"],
          correctAnswer: 0, // A) however
          explanation: "The second clause contrasts with the expectation created by the first. 'However' signals contrast.",
          marks: 1
        },
        {
          id: "apt-30",
          category: "Verbal",
          subject: "Verbal Ability",
          topic: "Reading Comprehension",
          question: "Read the statement: 'Regular practice improves accuracy because it helps learners recognize patterns and avoid repeated mistakes.' What is the main idea?",
          options: [
            "A) Accuracy depends only on talent.",
            "B) Pattern recognition is unnecessary.",
            "C) Regular practice can improve accuracy.",
            "D) Mistakes cannot be avoided."
          ],
          correctAnswer: 2, // C) Regular practice can improve accuracy.
          explanation: "The sentence states that regular practice improves accuracy by building pattern recognition and reducing repeated errors.",
          marks: 1
        },
        {
          id: "apt-31",
          category: "Verbal",
          subject: "Verbal Ability",
          topic: "Sentence Completion",
          question: "[Sentence completion] The manager appreciated Ravi because he was always ______ in completing his assignments before the deadline.",
          options: ["A) reluctant", "B) punctual", "C) careless", "D) hesitant"],
          correctAnswer: 1, // B) punctual
          explanation: "Punctual means doing something at the expected or agreed time. It fits the context of completing assignments before the deadline.",
          marks: 1
        },
        {
          id: "apt-32",
          category: "Verbal",
          subject: "Verbal Ability",
          topic: "Cloze Test",
          question: "[Cloze test] Although the project was difficult, the team worked ______ and successfully completed it ______ time.",
          options: ["A) lazily, at", "B) efficiently, on", "C) carelessly, in", "D) slowly, by"],
          correctAnswer: 1, // B) efficiently, on
          explanation: "'Efficiently' means working effectively, and the correct expression is 'on time'.",
          marks: 1
        },
        {
          id: "apt-33",
          category: "Verbal",
          subject: "Verbal Ability",
          topic: "Phrasal Verbs",
          question: "[Phrasal verbs] What does the phrasal verb 'look into' mean?",
          options: ["A) Ignore something", "B) Investigate something", "C) Look at something quickly", "D) Reject something"],
          correctAnswer: 1, // B) Investigate something
          explanation: "'Look into' means to examine or investigate a situation.",
          marks: 1
        },
        {
          id: "apt-34",
          category: "Verbal",
          subject: "Verbal Ability",
          topic: "Conjunctions",
          question: "[Conjunctions] ______ he was tired, he continued working on the project.",
          options: ["A) Because", "B) Although", "C) Unless", "D) Therefore"],
          correctAnswer: 1, // B) Although
          explanation: "'Although' shows contrast: despite being tired, he continued working.",
          marks: 1
        },
        {
          id: "apt-35",
          category: "Verbal",
          subject: "Verbal Ability",
          topic: "Parallelism",
          question: "[Parallelism] Choose the grammatically correct sentence.",
          options: [
            "A) She likes reading, writing and to dance.",
            "B) She likes to read, writing and dancing.",
            "C) She likes reading, writing and dancing.",
            "D) She likes read, write and dancing."
          ],
          correctAnswer: 2, // C) She likes reading, writing and dancing.
          explanation: "Parallelism means keeping the same grammatical structure in a list. All three activities use the -ing form.",
          marks: 1
        },
        {
          id: "apt-36",
          category: "Verbal",
          subject: "Verbal Ability",
          topic: "Modifiers",
          question: "[Modifiers] Choose the sentence with the correct modifier placement.",
          options: [
            "A) Walking to college, the rain started heavily.",
            "B) Walking to college, I saw a beautiful garden.",
            "C) Walking to college, the road looked crowded.",
            "D) Walking to college, the traffic was heavy."
          ],
          correctAnswer: 1, // B) Walking to college, I saw a beautiful garden.
          explanation: "The person doing the walking must be the subject of the main clause. In option B, 'I' am walking.",
          marks: 1
        },
        {
          id: "apt-37",
          category: "Verbal",
          subject: "Verbal Ability",
          topic: "Homophones",
          question: "[Homophones] The students were asked to ______ their assignments before Friday.",
          options: ["A) submit", "B) summit", "C) some it", "D) summet"],
          correctAnswer: 0, // A) submit
          explanation: "'Submit' means to hand over or present something. 'Summit' means the highest point of a mountain or a high-level meeting.",
          marks: 1
        },
        {
          id: "apt-38",
          category: "Verbal",
          subject: "Verbal Ability",
          topic: "Vocabulary",
          question: "[Vocabulary] Choose the word closest in meaning to 'Mitigate'.",
          options: ["A) Increase", "B) Reduce", "C) Ignore", "D) Create"],
          correctAnswer: 1, // B) Reduce
          explanation: "Mitigate means to make something less severe, serious or harmful.",
          marks: 1
        },
        {
          id: "apt-39",
          category: "Verbal",
          subject: "Verbal Ability",
          topic: "Reading Comprehension - Inference",
          question: "[Reading comprehension – Inference] \"Many companies have adopted automated systems to improve productivity. However, automation does not eliminate the need for employees. Instead, workers are expected to develop new skills to manage and work alongside these systems.\" What can be inferred from the passage?",
          options: [
            "A) Automation completely replaces employees.",
            "B) Employees do not need technical skills.",
            "C) Workers need to adapt to changing technology.",
            "D) Companies should avoid automation."
          ],
          correctAnswer: 2, // C) Workers need to adapt to changing technology.
          explanation: "The passage explains that employees must develop new skills to work with automated systems.",
          marks: 1
        },
        {
          id: "apt-40",
          category: "Verbal",
          subject: "Verbal Ability",
          topic: "Sentence Ordering",
          question: "[Sentence ordering] Arrange in the correct logical order. P. Finally, the company launched its new product. Q. The team first identified customer requirements. R. After that, a prototype was developed. S. The prototype was tested and improved.",
          options: ["A) Q-R-S-P", "B) R-Q-P-S", "C) S-R-Q-P", "D) P-Q-R-S"],
          correctAnswer: 0, // A) Q-R-S-P
          explanation: "Logical sequence: identify customer requirements (Q) → develop a prototype (R) → test and improve it (S) → launch the product (P).",
          marks: 1
        }
      ]
    },

    // --------------------------------------------------------------------------
    // SECTION 2: Technical Core Knowledge (20 Questions - 1 Mark each - 20 Marks)
    // Dynamic branch-tailored question set
    // --------------------------------------------------------------------------
    {
      id: "sec-2",
      name: "Section 2: Technical Core Knowledge (Branch-Specific)",
      description: "Data Structures, Database Management Systems, Operating Systems, Computer Networks, and Architecture.",
      durationMinutes: 25,
      totalMarks: 20,
      totalQuestions: 20,
      type: "mcq",
      questions: [
        // =====================================================================
        // SECTION 2: TECHNICAL PRACTICE – PYTHON, C, C++, SQL, JAVA (20 Questions - 1 Mark each = 20 Marks)
        // Source: Technical Practice – Python, C, C++, SQL, Java (Verbatim PDF Edition)
        // =====================================================================

        // === Topic 1: Python (Q1 - Q4) ===
        {
          id: "tech-py-1",
          category: "Technical-Python",
          subject: "Technical Core Knowledge",
          topic: "Python",
          question: "Which feature allows Python to support multiple programming paradigms?",
          options: [
            "A) Only procedural programming",
            "B) Object-oriented, procedural and functional programming",
            "C) Only object-oriented programming",
            "D) Only functional programming"
          ],
          correctAnswer: 1, // B
          explanation: "Python supports object-oriented, procedural and functional styles, so it is a multi-paradigm language.",
          marks: 1
        },
        {
          id: "tech-py-2",
          category: "Technical-Python",
          subject: "Technical Core Knowledge",
          topic: "Python",
          question: "What is the primary purpose of decorators in Python?",
          options: [
            "A) To delete objects",
            "B) To modify or extend function or class behavior without directly changing their implementation",
            "C) To create database tables",
            "D) To allocate memory"
          ],
          correctAnswer: 1, // B
          explanation: "A decorator wraps a function or class to add behavior (logging, caching, access checks) without editing its source.",
          marks: 1
        },
        {
          id: "tech-py-3",
          category: "Technical-Python",
          subject: "Technical Core Knowledge",
          topic: "Python",
          question: "Which of the following best describes Python's garbage collection?",
          options: [
            "A) It manually deletes all variables",
            "B) It automatically manages memory and reclaims unreachable objects",
            "C) It prevents memory allocation",
            "D) It stores all objects permanently"
          ],
          correctAnswer: 1, // B
          explanation: "CPython uses reference counting plus a cyclic garbage collector to free objects that can no longer be reached.",
          marks: 1
        },
        {
          id: "tech-py-4",
          category: "Technical-Python",
          subject: "Technical Core Knowledge",
          topic: "Python",
          question: "What is the primary difference between an iterator and an iterable in Python?",
          options: [
            "A) Both are exactly the same",
            "B) An iterable can provide an iterator, while an iterator produces elements one at a time",
            "C) An iterator stores only strings",
            "D) An iterable cannot be used in loops"
          ],
          correctAnswer: 1, // B
          explanation: "An iterable (list, tuple, str) implements __iter__ and returns an iterator; the iterator implements __next__ to yield items one by one.",
          marks: 1
        },

        // === Topic 2: C Programming (Q5 - Q8) ===
        {
          id: "tech-c-5",
          category: "Technical-C",
          subject: "Technical Core Knowledge",
          topic: "C Programming",
          question: "What is the main difference between call by value and call by reference concepts?",
          options: [
            "A) Both always modify the original variable",
            "B) Call by value passes a copy, while reference-based approaches allow modification of the original object",
            "C) Call by value uses pointers only",
            "D) Both are used only for arrays"
          ],
          correctAnswer: 1, // B
          explanation: "Call by value gives the function a copy, so the caller's variable is unchanged. Passing an address (pointer) lets the function modify the original. C itself is strictly pass-by-value.",
          marks: 1
        },
        {
          id: "tech-c-6",
          category: "Technical-C",
          subject: "Technical Core Knowledge",
          topic: "C Programming",
          question: "Which of the following is the main purpose of a function pointer in C?",
          options: [
            "A) To store integer values",
            "B) To store the address of a function and enable indirect function calls",
            "C) To allocate memory",
            "D) To declare global variables"
          ],
          correctAnswer: 1, // B
          explanation: "A function pointer holds a function's address, enabling callbacks and dispatch tables.",
          marks: 1
        },
        {
          id: "tech-c-7",
          category: "Technical-C",
          subject: "Technical Core Knowledge",
          topic: "C Programming",
          question: "What is the main difference between stack and heap memory?",
          options: [
            "A) Stack is generally used for automatic local storage, while heap supports dynamic memory allocation",
            "B) Both are used only for global variables",
            "C) Heap memory is always faster than stack memory",
            "D) Stack memory is dynamically allocated using malloc()"
          ],
          correctAnswer: 0, // A
          explanation: "The stack holds local variables and call frames automatically. The heap is used for dynamic allocation (malloc/free) and is usually slower to manage.",
          marks: 1
        },
        {
          id: "tech-c-8",
          category: "Technical-C",
          subject: "Technical Core Knowledge",
          topic: "C Programming",
          question: "What is the purpose of a preprocessor directive in C?",
          options: [
            "A) To execute machine instructions",
            "B) To perform preprocessing tasks such as including headers and defining macros",
            "C) To allocate heap memory",
            "D) To execute database queries"
          ],
          correctAnswer: 1, // B
          explanation: "Directives like #include and #define are handled before compilation to include files and expand macros.",
          marks: 1
        },

        // === Topic 3: C++ (Q9 - Q12) ===
        {
          id: "tech-cpp-9",
          category: "Technical-CPP",
          subject: "Technical Core Knowledge",
          topic: "C++",
          question: "Which OOP principle allows a class to acquire properties and methods from another class?",
          options: [
            "A) Encapsulation",
            "B) Abstraction",
            "C) Inheritance",
            "D) Polymorphism"
          ],
          correctAnswer: 2, // C
          explanation: "Inheritance lets a derived class reuse and extend the members of a base class.",
          marks: 1
        },
        {
          id: "tech-cpp-10",
          category: "Technical-CPP",
          subject: "Technical Core Knowledge",
          topic: "C++",
          question: "What is the main advantage of using constructors in C++?",
          options: [
            "A) They destroy objects automatically",
            "B) They initialize objects when they are created",
            "C) They prevent inheritance",
            "D) They execute only when a program terminates"
          ],
          correctAnswer: 1, // B
          explanation: "A constructor runs automatically at object creation to put the object in a valid initial state. Destructors handle cleanup.",
          marks: 1
        },
        {
          id: "tech-cpp-11",
          category: "Technical-CPP",
          subject: "Technical Core Knowledge",
          topic: "C++",
          question: "What is the diamond problem in C++?",
          options: [
            "A) A memory allocation error",
            "B) An ambiguity that can arise when a class inherits from two classes that share a common base class",
            "C) A problem with function overloading",
            "D) An error caused by pointers"
          ],
          correctAnswer: 1, // B
          explanation: "With multiple inheritance, the shared base can be inherited twice, making member access ambiguous. Virtual inheritance resolves it.",
          marks: 1
        },
        {
          id: "tech-cpp-12",
          category: "Technical-CPP",
          subject: "Technical Core Knowledge",
          topic: "C++",
          question: "Which feature of C++ allows generic programming?",
          options: [
            "A) Templates",
            "B) Destructors",
            "C) Friend functions",
            "D) Namespaces"
          ],
          correctAnswer: 0, // A
          explanation: "Templates let functions and classes work with any data type, with the type fixed at compile time.",
          marks: 1
        },

        // === Topic 4: SQL (Q13 - Q16) ===
        {
          id: "tech-sql-13",
          category: "Technical-SQL",
          subject: "Technical Core Knowledge",
          topic: "SQL",
          question: "What is the main purpose of a database view?",
          options: [
            "A) To permanently delete records",
            "B) To provide a virtual table based on a query",
            "C) To allocate memory",
            "D) To create a physical backup automatically"
          ],
          correctAnswer: 1, // B
          explanation: "A view is a stored query that behaves like a table, useful for simplifying queries and restricting access.",
          marks: 1
        },
        {
          id: "tech-sql-14",
          category: "Technical-SQL",
          subject: "Technical Core Knowledge",
          topic: "SQL",
          question: "Which SQL constraint ensures that a column cannot contain NULL values?",
          options: [
            "A) UNIQUE",
            "B) CHECK",
            "C) NOT NULL",
            "D) DEFAULT"
          ],
          correctAnswer: 2, // C
          explanation: "NOT NULL forces every row to have a value in that column.",
          marks: 1
        },
        {
          id: "tech-sql-15",
          category: "Technical-SQL",
          subject: "Technical Core Knowledge",
          topic: "SQL",
          question: "What is the main purpose of database normalization?",
          options: [
            "A) To increase data duplication",
            "B) To reduce data redundancy and improve data integrity",
            "C) To delete all duplicate tables",
            "D) To increase the number of columns"
          ],
          correctAnswer: 1, // B
          explanation: "Normalization organizes data into related tables to remove redundancy and avoid update, insert and delete anomalies.",
          marks: 1
        },
        {
          id: "tech-sql-16",
          category: "Technical-SQL",
          subject: "Technical Core Knowledge",
          topic: "SQL",
          question: "Which SQL command is used to modify the structure of an existing table?",
          options: [
            "A) UPDATE",
            "B) INSERT",
            "C) ALTER",
            "D) SELECT"
          ],
          correctAnswer: 2, // C
          explanation: "ALTER TABLE adds, drops or changes columns and constraints. UPDATE and INSERT change data, not structure.",
          marks: 1
        },

        // === Topic 5: Java (Q17 - Q20) ===
        {
          id: "tech-java-17",
          category: "Technical-Java",
          subject: "Technical Core Knowledge",
          topic: "Java",
          question: "What is the main difference between an abstract class and an interface in Java?",
          options: [
            "A) Both cannot contain methods",
            "B) An abstract class can maintain instance state and constructors, while an interface defines a contract and can also contain default and static methods",
            "C) An interface can be instantiated directly",
            "D) An abstract class cannot have implemented methods"
          ],
          correctAnswer: 1, // B
          explanation: "Abstract classes can have instance fields and constructors. Interfaces define a contract (with default and static methods since Java 8) and cannot hold instance state. Neither can be instantiated directly.",
          marks: 1
        },
        {
          id: "tech-java-18",
          category: "Technical-Java",
          subject: "Technical Core Knowledge",
          topic: "Java",
          question: "Which Java collection is best suited for storing key-value pairs?",
          options: [
            "A) ArrayList",
            "B) HashMap",
            "C) HashSet",
            "D) LinkedList"
          ],
          correctAnswer: 1, // B
          explanation: "HashMap stores key-value pairs with average O(1) lookup by key.",
          marks: 1
        },
        {
          id: "tech-java-19",
          category: "Technical-Java",
          subject: "Technical Core Knowledge",
          topic: "Java",
          question: "What is the purpose of the finally block in Java exception handling?",
          options: [
            "A) To declare variables",
            "B) To execute cleanup code after try/catch processing, subject to JVM termination conditions",
            "C) To create exceptions",
            "D) To stop program execution permanently"
          ],
          correctAnswer: 1, // B
          explanation: "finally runs whether or not an exception occurs, typically for cleanup. It may not run if the JVM exits (e.g. System.exit) or crashes.",
          marks: 1
        },
        {
          id: "tech-java-20",
          category: "Technical-Java",
          subject: "Technical Core Knowledge",
          topic: "Java",
          question: "What is the primary purpose of the synchronized keyword in Java?",
          options: [
            "A) To create new classes",
            "B) To control concurrent access to shared resources",
            "C) To improve database connectivity",
            "D) To stop inheritance"
          ],
          correctAnswer: 1, // B
          explanation: "synchronized lets only one thread at a time execute a block or method guarded by the same lock, preventing race conditions.",
          marks: 1
        }
      ]
    },

    // --------------------------------------------------------------------------
    // SECTION 3: Technical Coding Round (2 Problems × 10 Test Cases - 40 Marks)
    // --------------------------------------------------------------------------
    {
      id: "sec-3",
      name: "Section 3: Technical Coding Round (Online Coding Sandbox)",
      description: "Write, compile, and submit robust algorithms in Python, Java, C, C++, C#, Go, PHP, or JavaScript. Evaluated against 4 standardized test cases. All 4 test cases must pass without error to execute successfully and earn 20 Marks per problem (40 Marks max).",
      durationMinutes: 30,
      totalMarks: 40,
      totalQuestions: 2,
      type: "coding",
      questions: [
        {
          id: "code-1",
          slug: "longest-unique-substring",
          title: "Problem 1: Longest Substring Without Repeating Characters",
          difficulty: "Medium",
          marks: 20,
          description: `Given a string \`s\`, find the length of the longest substring without repeating characters.

A substring is a contiguous non-empty sequence of characters within a string.

### Examples:
**Example 1:**
- Input: \`s = "abcabcbb"\`
- Output: \`3\`
- Explanation: The answer is "abc", with the length of 3.

**Example 2:**
- Input: \`s = "bbbbb"\`
- Output: \`1\`
- Explanation: The answer is "b", with the length of 1.

**Example 3:**
- Input: \`s = "pwwkew"\`
- Output: \`3\`
- Explanation: The answer is "wke", with the length of 3. Notice that "pwke" is a subsequence, not a substring.

### Constraints:
- \`0 <= s.length <= 5 * 10^4\`
- \`s\` consists of English letters, digits, symbols and spaces.`,
          functionName: "lengthOfLongestSubstring",
          starterCode: {
            python: `def lengthOfLongestSubstring(s: str) -> int:
    # Write your solution below:
    pass
`,
            javascript: `function lengthOfLongestSubstring(s) {
  // Write your solution below:
  
}
`,
            java: `import java.util.*;

class Solution {
    public int lengthOfLongestSubstring(String s) {
        // Write your solution below:
        return 0;
    }
}
`,
            cpp: `#include <iostream>
#include <string>
#include <unordered_set>
using namespace std;

class Solution {
public:
    int lengthOfLongestSubstring(string s) {
        // Write your solution below:
        return 0;
    }
};
`,
            c: `#include <stdio.h>
#include <string.h>

int lengthOfLongestSubstring(char *s) {
    // Write your solution below:
    return 0;
}
`,
            csharp: `using System;
using System.Collections.Generic;

public class Solution {
    public int LengthOfLongestSubstring(string s) {
        // Write your solution below:
        return 0;
    }
}
`,
            go: `package main

func lengthOfLongestSubstring(s string) int {
    // Write your solution below:
    return 0
}
`,
            php: `<?php
function lengthOfLongestSubstring($s) {
    // Write your solution below:
    return 0;
}
?>`
          },
          testCases: [
            { index: 1, isPublic: true, input: '"abcabcbb"', expected: "3" },
            { index: 2, isPublic: true, input: '"bbbbb"', expected: "1" },
            { index: 3, isPublic: false, input: '"pwwkew"', expected: "3" },
            { index: 4, isPublic: false, input: '""', expected: "0" }
          ],
          referenceSolutions: {
            python: `def lengthOfLongestSubstring(s: str) -> int:
    char_index = {}
    max_len = 0
    start = 0
    for end, char in enumerate(s):
        if char in char_index and char_index[char] >= start:
            start = char_index[char] + 1
        char_index[char] = end
        max_len = max(max_len, end - start + 1)
    return max_len`,
            javascript: `function lengthOfLongestSubstring(s) {
  const map = new Map();
  let maxLen = 0, start = 0;
  for (let end = 0; end < s.length; end++) {
    if (map.has(s[end]) && map.get(s[end]) >= start) {
      start = map.get(s[end]) + 1;
    }
    map.set(s[end], end);
    maxLen = Math.max(maxLen, end - start + 1);
  }
  return maxLen;
}`,
            java: `import java.util.*;

class Solution {
    public int lengthOfLongestSubstring(String s) {
        Map<Character, Integer> map = new HashMap<>();
        int maxLen = 0, start = 0;
        for (int end = 0; end < s.length(); end++) {
            char c = s.charAt(end);
            if (map.containsKey(c) && map.get(c) >= start) {
                start = map.get(c) + 1;
            }
            map.put(c, end);
            maxLen = Math.max(maxLen, end - start + 1);
        }
        return maxLen;
    }
}`,
            cpp: `#include <string>
#include <unordered_map>
#include <algorithm>
using namespace std;

class Solution {
public:
    int lengthOfLongestSubstring(string s) {
        unordered_map<char, int> map;
        int maxLen = 0, start = 0;
        for (int end = 0; end < s.length(); end++) {
            if (map.find(s[end]) != map.end() && map[s[end]] >= start) {
                start = map[s[end]] + 1;
            }
            map[s[end]] = end;
            maxLen = max(maxLen, end - start + 1);
        }
        return maxLen;
    }
};`
          }
        },
        {
          id: "code-2",
          slug: "two-sum-target",
          title: "Problem 2: Two Sum - Target Pair Indices",
          difficulty: "Easy",
          marks: 20,
          description: `Given an array of integers \`nums\` and an integer \`target\`, return indices of the two numbers such that they add up to \`target\`.

You may assume that each input would have exactly one solution, and you may not use the same element twice. You can return the answer in any order.

### Examples:
**Example 1:**
- Input: \`nums = [2,7,11,15], target = 9\`
- Output: \`[0,1]\`
- Explanation: Because nums[0] + nums[1] == 9, we return [0, 1].

**Example 2:**
- Input: \`nums = [3,2,4], target = 6\`
- Output: \`[1,2]\`

**Example 3:**
- Input: \`nums = [3,3], target = 6\`
- Output: \`[0,1]\`

### Constraints:
- \`2 <= nums.length <= 10^4\`
- \`-10^9 <= nums[i] <= 10^9\`
- \`-10^9 <= target <= 10^9\`
- Only one valid answer exists.`,
          functionName: "twoSum",
          starterCode: {
            python: `def twoSum(nums: list, target: int) -> list:
    # Write your solution below:
    pass
`,
            javascript: `function twoSum(nums, target) {
  // Write your solution below:
  
}
`,
            java: `import java.util.*;

class Solution {
    public int[] twoSum(int[] nums, int target) {
        // Write your solution below:
        return new int[]{};
    }
}
`,
            cpp: `#include <vector>
#include <unordered_map>
using namespace std;

class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        // Write your solution below:
        return {};
    }
};
`,
            c: `#include <stdlib.h>

int* twoSum(int* nums, int numsSize, int target, int* returnSize) {
    // Write your solution below:
    *returnSize = 0;
    return NULL;
}
`,
            csharp: `using System;
using System.Collections.Generic;

public class Solution {
    public int[] TwoSum(int[] nums, int target) {
        // Write your solution below:
        return new int[] { };
    }
}
`,
            go: `package main

func twoSum(nums []int, target int) []int {
    // Write your solution below:
    return []int{}
}
`,
            php: `<?php
function twoSum($nums, $target) {
    // Write your solution below:
    return [];
}
?>`
          },
          testCases: [
            { index: 1, isPublic: true, input: "[2,7,11,15], 9", expected: "[0,1]" },
            { index: 2, isPublic: true, input: "[3,2,4], 6", expected: "[1,2]" },
            { index: 3, isPublic: false, input: "[3,3], 6", expected: "[0,1]" },
            { index: 4, isPublic: false, input: "[1,5,8,12,19], 20", expected: "[0,4]" }
          ],
          referenceSolutions: {
            python: `def twoSum(nums: list, target: int) -> list:
    lookup = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in lookup:
            return [lookup[complement], i]
        lookup[num] = i
    return []`,
            javascript: `function twoSum(nums, target) {
  const map = new Map();
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (map.has(complement)) {
      return [map.get(complement), i];
    }
    map.set(nums[i], i);
  }
  return [];
}`,
            java: `import java.util.*;

class Solution {
    public int[] twoSum(int[] nums, int target) {
        Map<Integer, Integer> map = new HashMap<>();
        for (int i = 0; i < nums.length; i++) {
            int complement = target - nums[i];
            if (map.containsKey(complement)) {
                return new int[] { map.get(complement), i };
            }
            map.put(nums[i], i);
        }
        return new int[]{};
    }
}`,
            cpp: `#include <vector>
#include <unordered_map>
using namespace std;

class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        unordered_map<int, int> map;
        for (int i = 0; i < nums.size(); i++) {
            int complement = target - nums[i];
            if (map.find(complement) != map.end()) {
                return { map[complement], i };
            }
            map[nums[i]] = i;
        }
        return {};
    }
};`
          }
        }
      ]
    }
  ]
};

// ==============================================================================
// ASSESSMENT 2: Practical Office Skills, Typing & Business Communication (100 Marks Total)
// Section 1: Practical Computer & Office Tasks Sandbox (6 Tasks - 40 Marks)
// Section 2: Timed Typing Speed & Accuracy Sandbox (10 Minutes - 25 Marks)
// Section 3: English Language, Business Communication & Comprehension (35 Marks)
//   Part A: Sentence Correction (5 Qs × 2 Marks = 10 Marks)
//   Part B: Professional Email Writing (1 Task = 10 Marks)
//   Part C: Reading Comprehension (5 Qs × 2 Marks = 10 Marks)
//   Part D: Verbal / Spoken English Introduction (1 Task = 5 Marks)
// Total Marks: 40 + 25 + 35 = 100 Marks
// ==============================================================================

const OFFICE_PRODUCTIVITY_ASSESSMENT = {
  id: "office-skills-2026",
  title: "Practical Office Skills, Typing & Business Communication Assessment 2026",
  subtitle: "Computer Applications, Typing Speed & Accuracy, and Business Language Proficiency",
  totalDurationMinutes: 90,
  totalMarks: 100,
  passingMarks: 50,
  badgeText: "Office Skills • 100 Marks",
  logoUrl: "office_skills_logo.png",
  sections: [
    {
      id: "sec-practical",
      name: "Section 1: Practical Computer & Office Tasks Sandbox",
      description: "Hands-on desktop productivity tasks: file organization, word processing, spreadsheets, and email management.",
      totalMarks: 40,
      totalQuestions: 6,
      type: "practical_tasks",
      tasks: [
        {
          id: "task-1",
          taskType: "folder_structure",
          title: "Folder Structure & Organization",
          instruction: "Create a folder 'Candidate Assessment' and a subfolder with your name.",
          marks: 5,
          evaluationNotes: "Folder structure correct (root 'Candidate Assessment' + subfolder with candidate name)",
          targetFolder: "Candidate Assessment"
        },
        {
          id: "task-2",
          taskType: "word_document",
          title: "Word Document Formatting & Composition",
          instruction: "Create and save a Word document with proper formatting.",
          marks: 5,
          evaluationNotes: "File saved; basic formatting (headings, bold, alignment, styling applied)",
          defaultDocTitle: "Candidate_Report.docx"
        },
        {
          id: "task-3",
          taskType: "excel_spreadsheet",
          title: "Employee Payroll Spreadsheet & SUM Formula",
          instruction: "Create Excel sheet for five employees, salaries and SUM formula.",
          marks: 10,
          evaluationNotes: "Data accuracy and formula (=SUM calculation of salaries)",
          requiredRows: 5,
          requiredFormula: "SUM"
        },
        {
          id: "task-4",
          taskType: "email_drafting",
          title: "Professional Email Composition with Attachment",
          instruction: "Draft professional email with subject and attachment.",
          marks: 10,
          evaluationNotes: "Subject line, professional tone, and correct attachment",
          requiredElements: ["subject", "attachment", "professional_body"]
        },
        {
          id: "task-5",
          taskType: "pdf_download",
          title: "PDF File Retrieval & Directory Placement",
          instruction: "Download PDF and save in correct folder.",
          marks: 5,
          evaluationNotes: "Correct folder and filename preservation",
          targetFilename: "Company_Policy_2026.pdf"
        },
        {
          id: "task-6",
          taskType: "file_rename",
          title: "File Renaming & File Explorer Navigation",
          instruction: "Rename a file and locate it using File Explorer.",
          marks: 5,
          evaluationNotes: "Successful rename and retrieval in folder hierarchy",
          sourceFile: "draft_unnamed.docx",
          targetName: "Final_Candidate_Submission.docx"
        }
      ]
    },
    {
      id: "sec-typing",
      name: "Section 2: Timed Typing Speed & Accuracy Assessment",
      description: "Timed professional typing test measuring Words Per Minute (WPM), percentage accuracy, and punctuation precision.",
      totalMarks: 25,
      durationMinutes: 10,
      type: "typing_test",
      metrics: [
        { id: "wpm", name: "Typing speed (WPM)", marks: 10, notes: "Record measured Words Per Minute" },
        { id: "accuracy", name: "Typing accuracy (%)", marks: 10, notes: "Record percentage accuracy against reference text" },
        { id: "formatting", name: "Formatting and punctuation", marks: 5, notes: "Check punctuation, capitalization, and spacing" }
      ],
      passage: "Accurate data entry and clear communication are essential in a professional office. Employees must carefully review names, dates, amounts, and account details before submitting their work. Proper organization, attention to detail, and following instructions help reduce errors and improve productivity. Every employee is responsible for completing assigned tasks on time and informing their supervisor whenever clarification is required."
    },
    {
      id: "sec-communication",
      name: "Section 3: English Language, Business Communication & Comprehension",
      description: "Sentence correction, formal email request writing, reading comprehension, and spoken self-introduction.",
      totalMarks: 35,
      type: "communication",
      parts: [
        {
          id: "part-a",
          name: "Part A: Sentence Correction",
          marks: 10,
          questions: [
            {
              id: "sc-1",
              qNum: 1,
              incorrectSentence: "Please sent me the documents yesterday.",
              instruction: "Rewrite the sentence with correct grammatical tense.",
              suggestedCorrection: "Please send me the documents from yesterday. (or: Please send me yesterday's documents.)",
              marks: 2
            },
            {
              id: "sc-2",
              qNum: 2,
              incorrectSentence: "I am working in this company since two years.",
              instruction: "Rewrite the sentence with correct present perfect continuous form.",
              suggestedCorrection: "I have been working in this company for two years.",
              marks: 2
            },
            {
              id: "sc-3",
              qNum: 3,
              incorrectSentence: "She don't know how to use Excel.",
              instruction: "Rewrite the sentence with correct third-person singular agreement.",
              suggestedCorrection: "She doesn't know how to use Excel.",
              marks: 2
            },
            {
              id: "sc-4",
              qNum: 4,
              incorrectSentence: "We has completed the assigned work.",
              instruction: "Rewrite the sentence with correct subject-verb agreement.",
              suggestedCorrection: "We have completed the assigned work.",
              marks: 2
            },
            {
              id: "sc-5",
              qNum: 5,
              incorrectSentence: "Kindly confirm me once you received the email.",
              instruction: "Rewrite the sentence with professional phrasing.",
              suggestedCorrection: "Kindly confirm once you have received the email. (or: Kindly confirm receipt of the email.)",
              marks: 2
            }
          ]
        },
        {
          id: "part-b",
          name: "Part B: Email Writing",
          marks: 10,
          prompt: "Write a professional email requesting September and October 2026 bank statements.",
          instruction: "Include a formal subject line, appropriate salutation, polite and clear request specifying the exact months (September & October 2026), and professional closing with your signature block.",
          evaluationCriteria: "Subject, tone, format, and accuracy of requested details."
        },
        {
          id: "part-c",
          name: "Part C: Reading Comprehension",
          marks: 10,
          passage: "An employee received a client document containing several missing details. Instead of making assumptions, the employee contacted the supervisor, clarified the missing information, and completed the task accurately before the deadline.",
          questions: [
            { id: "rc-1", qNum: 1, question: "What was missing from the document?", marks: 2, modelAnswer: "Several missing details / key client information." },
            { id: "rc-2", qNum: 2, question: "What did the employee do before completing the task?", marks: 2, modelAnswer: "The employee contacted the supervisor and clarified the missing information instead of making assumptions." },
            { id: "rc-3", qNum: 3, question: "Why is it important to avoid assumptions?", marks: 2, modelAnswer: "Making assumptions can lead to errors, inaccurate work, and misunderstandings; clarifying ensures high accuracy." },
            { id: "rc-4", qNum: 4, question: "Was the task completed on time?", marks: 2, modelAnswer: "Yes, the task was completed accurately before the deadline." },
            { id: "rc-5", qNum: 5, question: "What lesson can you learn from this situation?", marks: 2, modelAnswer: "Always seek clarification when information is missing rather than guessing, ensuring work is accurate and submitted on time." }
          ]
        },
        {
          id: "part-d",
          name: "Part D: Verbal / Self-Introduction & Career Intent",
          marks: 5,
          prompt: "Introduce yourself and explain why you want to work in an accounting or tax preparation office.",
          instruction: "Speak or record a structured 1-2 minute introduction covering your educational background, attention to detail, interest in finance/accounting, and motivation to excel in an accounting or tax office environment.",
          marks: 5
        }
      ]
    }
  ]
};

// Seed admin data for recruitment assessment portal
const INITIAL_DATABASE = {
  admin: {
    email: "admin@cognitoinsights.tech",
    password: "admin",
    name: "Lead Recruiter",
    role: "Admin / Head of Recruitment"
  },
  students: []
};

// Expose to window
window.RECRUITMENT_ASSESSMENT = RECRUITMENT_ASSESSMENT;
window.OFFICE_PRODUCTIVITY_ASSESSMENT = OFFICE_PRODUCTIVITY_ASSESSMENT;
window.ALL_ASSESSMENTS = {
  "cognito-recruitment-2026": RECRUITMENT_ASSESSMENT,
  "office-skills-2026": OFFICE_PRODUCTIVITY_ASSESSMENT
};
window.INITIAL_DATABASE = INITIAL_DATABASE;

// Expose Question Bank to window.EXAM_DATA for Admin and Candidate runtimes
window.EXAM_DATA = {
  section1_aptitude: RECRUITMENT_ASSESSMENT.sections[0].questions,
  section2_technical: RECRUITMENT_ASSESSMENT.sections[1].questions,
  section3_coding: RECRUITMENT_ASSESSMENT.sections[2].questions,
  office_productivity: OFFICE_PRODUCTIVITY_ASSESSMENT
};
