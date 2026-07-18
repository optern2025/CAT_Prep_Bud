// CAT Syllabus & Question Bank Database
window.CAT_SYLLABUS = {
  QA: {
    title: "Quantitative Aptitude",
    topics: {
      "Arithmetic": [
        "Percentages & Successive Changes",
        "Profit, Loss & Discount",
        "Simple & Compound Interest",
        "Ratio, Proportion & Variation",
        "Partnership & Averages",
        "Mixtures & Alligations",
        "Time & Work",
        "Pipes & Cisterns",
        "Time, Speed & Distance",
        "Boats & Streams",
        "Relative Speed & Races"
      ],
      "Algebra": [
        "Linear & Quadratic Equations",
        "Polynomials",
        "Inequalities & Modulus",
        "Logarithms & Exponents",
        "Progressions (AP, GP, HP)",
        "Functions & Graphs",
        "Maxima & Minima",
        "Surds, Indices & Identities"
      ],
      "Number Systems": [
        "Divisibility & Factors",
        "Multiples, HCF & LCM",
        "Remainders (Euler, Fermat)",
        "Modular Arithmetic & Cyclicity",
        "Last Digit & Units Digit",
        "Base System & Conversion",
        "Digital Root & Prime Properties",
        "Perfect Squares, Cubes & Factorials"
      ],
      "Geometry": [
        "Lines, Angles & Polygons",
        "Triangles (Congruence & Similarity)",
        "Circles & Quadrilaterals",
        "Coordinate Geometry",
        "Mensuration 2D & 3D",
        "Trigonometric Basics",
        "Area & Perimeter Theorems"
      ],
      "Modern Math": [
        "Permutations & Combinations",
        "Probability & Independent Events",
        "Set Theory & Venn Diagrams",
        "Sequence, Series & Binomial Basics"
      ],
      "Miscellaneous": [
        "Data Sufficiency",
        "Mathematical Reasoning",
        "Logical Quant",
        "Mixed Concept Questions"
      ]
    }
  },
  DILR: {
    title: "Data Interpretation & Logical Reasoning",
    topics: {
      "Data Interpretation": [
        "Tables & Caselets",
        "Bar Graphs & Line Graphs",
        "Pie Charts",
        "Mixed Graphs",
        "Radar & Bubble Charts",
        "Scatter Plots",
        "Network DI & Flow Charts",
        "Venn Diagram Data & Missing Data",
        "Growth, Profit & Ratio Analysis"
      ],
      "Logical Reasoning": [
        "Linear & Circular Arrangements",
        "Matrix & Floor Arrangements",
        "Distribution & Grouping",
        "Selection, Matching & Ranking",
        "Ordering & Scheduling",
        "Games & Tournaments",
        "Team Formation & Networks",
        "Binary Logic (Truth Tellers & Liars)",
        "Family Tree & Blood Relations",
        "Direction Sense & Venn Logic",
        "Conditional Logic & Syllogisms"
      ],
      "Hybrid DILR Sets": [
        "Table + Arrangement",
        "Graph + Scheduling",
        "Tournament + Statistics",
        "Caselet + Distribution",
        "Network + Flow",
        "Matrix + Data Sets"
      ]
    }
  },
  VARC: {
    title: "Verbal Ability & Reading Comprehension",
    topics: {
      "Reading Comprehension": [
        "Philosophy & Psychology",
        "Science & Technology",
        "History, Sociology & Anthropology",
        "Economics & Business",
        "Art, Literature & Culture",
        "Politics & Environment"
      ],
      "Verbal Ability": [
        "Parajumbles (TITA)",
        "Paragraph Summary",
        "Odd Sentence Out",
        "Sentence Insertion & Para Completion"
      ]
    }
  }
};

window.SEEDED_QUESTIONS = [];
window.DEFAULT_MOCKS = [
  {
    id: "mock_1",
    name: "CAT Prime Mock 1",
    type: "Full Mock",
    date: "2026-06-15",
    qaScore: 36,
    dilrScore: 24,
    varcScore: 42,
    totalScore: 102,
    percentile: 98.4,
    errors: { conceptual: 4, silly: 5, time: 3, guessed: 2 },
    actionItems: "Improve speed in TSD; practice 4-set Venn diagrams; focus on RC tone questions."
  },
  {
    id: "mock_2",
    name: "VARC Sectional 1",
    type: "Sectional",
    date: "2026-06-28",
    qaScore: null,
    dilrScore: null,
    varcScore: 48,
    totalScore: 48,
    percentile: 99.1,
    errors: { conceptual: 1, silly: 2, time: 1, guessed: 0 },
    actionItems: "Analyze dense science passages carefully; watch out for extreme qualifiers in options."
  }
];

window.DEFAULT_ERRORS = [
  {
    id: "err_1",
    section: "QA",
    topic: "Arithmetic",
    subtopic: "Percentages & Successive Changes",
    question: "A company's sales decreased by 20% in 2024 and then increased by 25% in 2025. What was the net percentage change in sales over the two years?",
    yourAnswer: "5% Increase",
    correctAnswer: "0% Change (No change)",
    errorCategory: "Conceptual",
    learningPoint: "Net successive percentage change is calculated using a + b + ab/100, not by simple addition. Here, -20 + 25 + (-20*25)/100 = 5 - 5 = 0%.",
    dateAdded: "2026-07-12"
  }
];

window.SECTIONALS_DATA = [
  { id: "sec_qa_1", name: "QA Sectional 1", section: "QA", duration: 40 },
  { id: "sec_dilr_1", name: "DILR Sectional 1", section: "DILR", duration: 40 },
  { id: "sec_varc_1", name: "VARC Sectional 1", section: "VARC", duration: 40 }
];

window.FULL_MOCKS_DATA = [
  { id: "mock_full_3", name: "CAT Prime Mock 3", duration: 120 },
  { id: "mock_full_4", name: "CAT Prime Mock 4", duration: 120 }
];

// ==================== DYNAMIC SOLVER AND TIMED QUESTION ENGINE ====================
window.QUESTION_ENGINE = {
  
  shuffle: function(array) {
    let currentIndex = array.length, randomIndex;
    while (currentIndex !== 0) {
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;
      [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    }
    return array;
  },

  // 1. Used Questions Registry Engine
  getSignature: function(questionText) {
    if (!questionText) return "";
    return questionText.replace(/<[^>]*>/g, "").replace(/\s+/g, "").substring(0, 100);
  },

  isQuestionUsed: function(questionText) {
    const used = JSON.parse(localStorage.getItem('cat_used_questions') || '[]');
    const sig = this.getSignature(questionText);
    return used.includes(sig);
  },

  flagQuestionsAsUsed: function(questions) {
    const used = JSON.parse(localStorage.getItem('cat_used_questions') || '[]');
    questions.forEach(q => {
      const sig = this.getSignature(q.question);
      if (sig && !used.includes(sig)) {
        used.push(sig);
      }
    });
    localStorage.setItem('cat_used_questions', JSON.stringify(used));
  },

  // 2. Procedural Reading Comprehension Synthesizer
  generateProceduralRC: function(idPrefix) {
    const randId = Math.floor(Math.random() * 100000);
    const genres = ["Philosophy", "Science & Tech", "Economics & Business", "History & Sociology"];
    const genre = genres[Math.floor(Math.random() * genres.length)];
    
    let title = "";
    let passage = "";
    let qPool = [];
    
    if (genre === "Philosophy") {
      const terms = ["Existentialism", "Phenomenology", "Skepticism", "Rationalism", "Stoicism", "Epistemology"];
      const authors = ["Sartre", "Heidegger", "Descartes", "Marcus Aurelius", "Kierkegaard", "Nietzsche"];
      const term1 = terms[Math.floor(Math.random() * terms.length)];
      const term2 = terms.find(t => t !== term1) || "Metaphysics";
      const author = authors[Math.floor(Math.random() * authors.length)];
      
      title = `${genre} (Procedural Set ${randId})`;
      passage = `<b>RC Passage: Thoughts on ${term1} and ${term2}</b><br>
        In modern ${genre.toLowerCase()} scholarship, the inquiry into ${term1} remains tethered to the legacy of ${author}. 
        The foundational premise suggests that human beings occupy a space of cognitive latency, where traditional structures fail to explain the relationship between consciousness and physical reality. 
        Critics argue that by prioritizing ${term2}, ${author} neglected the empirical foundations of scientific realism. 
        However, a closer reading reveals that ${author} did not intend to dismantle rational thought; rather, the objective was to reframe the boundaries of logical perception. 
        In our hyper-connected contemporary landscape, this philosophical tension manifests in the digital divide, where users substitute structural inquiry with brief confirmation bias, undermining the depth of classical reflection.`;
        
      qPool = [
        {
          type: "Main Idea",
          question: `Which of the following statements best captures the core focus of the passage regarding ${term1}?`,
          options: [
            `The critical re-evaluation of ${term1} within modern frameworks, balancing the legacy of ${author} against realistic critiques.`,
            `The absolute rejection of ${term2} as an unscientific concept proposed by ${author}.`,
            `A historical biography detailing the life of ${author} and their achievements.`,
            `An argument that ${term1} has been completely solved by modern neural sciences.`
          ],
          correctAnswer: `The critical re-evaluation of ${term1} within modern frameworks, balancing the legacy of ${author} against realistic critiques.`,
          explanation: `The passage introduces ${term1}, discusses ${author}'s impact, integrates critiques regarding ${term2}, and links it to contemporary challenges.`
        },
        {
          type: "Author Intent",
          question: `What can be inferred about the author's attitude towards the contemporary landscape's adoption of ${term1}?`,
          options: [
            `The author is critical of the shift towards superficial confirmation bias rather than deep structural inquiry.`,
            `The author is highly optimistic that digital connectivity enhances classical philosophical understanding.`,
            `The author believes ${author} would have fully endorsed contemporary internet forums.`,
            `The author is indifferent to the modern transitions of ${term2}.`
          ],
          correctAnswer: `The author is critical of the shift towards superficial confirmation bias rather than deep structural inquiry.`,
          explanation: `The final sentence explicitly states that the contemporary landscape substitutes structural inquiry with brief confirmation bias, 'undermining the depth of classical reflection'.`
        },
        {
          type: "Critical Evaluation",
          question: `According to the passage, the primary critique leveled against ${author}'s framework was that it:`,
          options: [
            `Neglected the empirical foundations of scientific realism in favor of ${term2}.`,
            `Failed to gain traction during the philosopher's lifetime.`,
            `Was overly dependent on modern digital networks and communication tools.`,
            `Directly contradicted the basic laws of stoic physics.`
          ],
          correctAnswer: `Neglected the empirical foundations of scientific realism in favor of ${term2}.`,
          explanation: `The passage states: 'Critics argue that by prioritizing ${term2}, ${author} neglected the empirical foundations of scientific realism.'`
        },
        {
          type: "Vocabulary in Context",
          question: `In the context of the passage, the word 'latency' in the second paragraph most nearly means:`,
          options: [
            "A state of inactive potential or unseen processing.",
            "Complete cognitive malfunction.",
            "High speed calculations.",
            "Emotional stability under pressure."
          ],
          correctAnswer: "A state of inactive potential or unseen processing.",
          explanation: "In this philosophical framework, cognitive latency implies a state of hidden potential or processing that hasn't fully manifested."
        }
      ];
    } else if (genre === "Science & Tech") {
      const domains = ["Quantum Mechanics", "Astrobiology", "Genetic Editing", "Neural Networks", "Entropy Laws"];
      const elements = ["Chirality", "Homochirality", "Quantum Entanglement", "CRISPR Sequences", "Synaptic Weights"];
      const dom = domains[Math.floor(Math.random() * domains.length)];
      const elem = elements[Math.floor(Math.random() * elements.length)];
      
      title = `${genre} (Procedural Set ${randId})`;
      passage = `<b>RC Passage: Research in ${dom} and ${elem}</b><br>
        The development of ${dom} has revolutionized our understanding of biological systems. 
        Recent experiments targeting ${elem} demonstrate that microscopic physical interactions have macroscopic manifestations in thermodynamics. 
        However, the search for biosignatures using these tools is complicated by abiotic noise. 
        Non-biological chemical pathways can mimic biological structures under extreme hydrothermal temperatures, rendering simple carbon detection insufficient as proof of past life. 
        To establish clear verification, researchers must confirm that the molecular distributions exhibit a high concentration of ${elem} that cannot be replicated by non-living decay.`;
        
      qPool = [
        {
          type: "Main Idea",
          question: `What is the primary scientific concern raised by the author regarding the discovery of organic signatures?`,
          options: [
            `The difficulty in differentiating between abiotic chemical reactions and actual astrobiological biosignatures.`,
            `The physical limitations of modern rovers to detect molecular structures of ${elem}.`,
            `A lack of consensus on the thermodynamic laws of ${dom}.`,
            `The complete absence of carbon elements in biological systems.`
          ],
          correctAnswer: `The difficulty in differentiating between abiotic chemical reactions and actual astrobiological biosignatures.`,
          explanation: `The author highlights that abiotic noise (non-biological pathways) can mimic organic signatures, making identification difficult without confirming ${elem}.`
        },
        {
          type: "Inference",
          question: `Based on the passage, the presence of a high concentration of ${elem} in a Martian soil sample would suggest:`,
          options: [
            `A higher probability of biological origin, as non-living decay cannot easily replicate this distribution.`,
            `That the sample has been contaminated by modern laboratory rovers.`,
            `That the thermodynamic laws of ${dom} do not apply outside Earth.`,
            `An immediate physical danger to potential human colonizers.`
          ],
          correctAnswer: `A higher probability of biological origin, as non-living decay cannot easily replicate this distribution.`,
          explanation: `The passage notes that researchers look for concentrations of ${elem} that 'cannot be replicated by non-living decay' to establish biological proof.`
        },
        {
          type: "Author Assertion",
          question: `According to the passage, abiotic noise can mimic biological structures under what conditions?`,
          options: [
            `Extreme hydrothermal temperatures.`,
            `Deep polar freeze zones.`,
            `Vacuum environments in space.`,
            `High-pressure gravitational collapsers.`
          ],
          correctAnswer: `Extreme hydrothermal temperatures.`,
          explanation: `The passage states: 'Non-biological chemical pathways can mimic biological structures under extreme hydrothermal temperatures...'`
        },
        {
          type: "EXCEPT",
          question: `According to the passage, which of the following is NOT a challenge in verifying organic Martian biosignatures?`,
          options: [
            `The total lack of carbon detection equipment on modern rovers.`,
            `The mimicking potential of non-biological pathways.`,
            `Abiotic noise mimicking thermodynamics.`,
            `Distinguishing homochirality from abiotic thermodynamic decay.`
          ],
          correctAnswer: `The total lack of carbon detection equipment on modern rovers.`,
          explanation: `The passage states that simple carbon detection *is* possible but *insufficient* as proof due to abiotic mimicry, not that rovers lack the equipment.`
        }
      ];
    } else if (genre === "Economics & Business") {
      const theories = ["Keynesian Models", "Monetarist Policies", "Behavioral Biases", "Marginal Utility Theory", "Game Theory Nash Equilibrium"];
      const metrics = ["Inflation Spikes", "Loss Aversion", "Market Liquidity", "GDP Multipliers", "Asset Allocation"];
      const theory = theories[Math.floor(Math.random() * theories.length)];
      const metric = metrics[Math.floor(Math.random() * metrics.length)];
      
      title = `${genre} (Procedural Set ${randId})`;
      passage = `<b>RC Passage: Analyzing ${theory} and ${metric}</b><br>
        Classical macroeconomics long assumed that agents behaved as rational utility-maximizing calculators. 
        However, the introduction of ${theory} challenged this orthodox paradigm, highlighting how psychological elements like ${metric} skew financial decisions. 
        In periods of market volatility, individual choice is driven by heuristic anchors rather than mathematical expectations. 
        For instance, when facing losses, investors demonstrate a disproportionate risk-seeking behavior to break even, a direct violation of expected utility. 
        Thus, policy interventions that fail to account for the cognitive models of market participants are bound to result in unintended liquidity traps.`;
        
      qPool = [
        {
          type: "Main Idea",
          question: `Which of the following best sums up the author's primary argument?`,
          options: [
            `Economic models must incorporate cognitive and behavioral biases like ${metric} to accurately predict agent behavior and avoid policy failures.`,
            `Investors are mathematically rational and classical economic expectations are always valid.`,
            `The complete replacement of ${theory} with classical monetary controls.`,
            `That utility calculations are too complex for any human computing platform.`
          ],
          correctAnswer: `Economic models must incorporate cognitive and behavioral biases like ${metric} to accurately predict agent behavior and avoid policy failures.`,
          explanation: `The author contrasts classical rationality with behavioral models like ${theory} and warns that policies ignoring these psychological heuristics fail.`
        },
        {
          type: "Inference",
          question: `According to the passage, an investor experiencing a financial loss is most likely to:`,
          options: [
            `Engage in risk-seeking behaviors in an attempt to recover their losses.`,
            `Immediately withdraw all assets and convert them to liquid currency.`,
            `Rationally re-allocate assets using standard expected utility calculations.`,
            `Consult classical macroeconomic textbooks for guidance.`
          ],
          correctAnswer: `Engage in risk-seeking behaviors in an attempt to recover their losses.`,
          explanation: `The text states: 'when facing losses, investors demonstrate a disproportionate risk-seeking behavior to break even'.`
        },
        {
          type: "Critical Terminology",
          question: `What does the term 'heuristic anchors' in the third sentence refer to?`,
          options: [
            `Cognitive shortcuts and reference points that individuals rely on when making decisions.`,
            `The physical anchoring of shipping lines in maritime trade.`,
            `Mathematical computations executed by macroeconomics professors.`,
            `Formal interest rates set by national central banks.`
          ],
          correctAnswer: `Cognitive shortcuts and reference points that individuals rely on when making decisions.`,
          explanation: `Heuristics are mental shortcuts, and anchoring is a psychological bias where decisions are heavily influenced by initial reference values.`
        },
        {
          type: "Author Assumption",
          question: `The author assumes that economic policy makers should:`,
          options: [
            `Acknowledge and model the non-rational behavior of market agents.`,
            `Rely strictly on traditional classical computer simulations.`,
            `Encourage higher levels of investor risk-taking during downturns.`,
            `Abolish the use of central banking controls.`
          ],
          correctAnswer: `Acknowledge and model the non-rational behavior of market agents.`,
          explanation: `The author asserts that 'policy interventions that fail to account for the cognitive models of market participants are bound to result in unintended liquidity traps.'`
        }
      ];
    } else {
      const eras = ["The Industrial Revolution", "Post-Colonial Reconstruction", "The Gilded Age", "Classical Antiquity Hegemonies"];
      const factors = ["Class Mobility", "Urban Migration", "Agrarian Collectivization", "Labor Specialization"];
      const era = eras[Math.floor(Math.random() * eras.length)];
      const factor = factors[Math.floor(Math.random() * factors.length)];
      
      title = `${genre} (Procedural Set ${randId})`;
      passage = `<b>RC Passage: Historical Dynamics of ${era}</b><br>
        Sociological historiography of ${era} often focuses on structural transitions in power. 
        A central driver of these changes was the rapid expansion of ${factor}, which reorganized agrarian communities into dense urban centers. 
        While traditional historians argue that this migration was entirely voluntary, modern archival research reveals that state-enforced land consolidations played a critical coercive role. 
        The resulting social tension created an alienation that fueled class organization. 
        Thus, the progress of ${era} was not a simple linear rise in living standards, but a dialectical struggle between community sovereignty and institutional state control.`;
        
      qPool = [
        {
          type: "Main Idea",
          question: `Which of the following best represents the author's primary revisionist argument regarding ${era}?`,
          options: [
            `The structural shift of ${factor} was driven by state-enforced coercion rather than purely voluntary migration, resulting in dialectical class tensions.`,
            `The transition to urban living was a seamless, peaceful process that immediately elevated average household incomes.`,
            `Traditional historians were entirely accurate in their representation of rural class mobility.`,
            `Agrarian collectivization was a failure caused by poor technology.`
          ],
          correctAnswer: `The structural shift of ${factor} was driven by state-enforced coercion rather than purely voluntary migration, resulting in dialectical class tensions.`,
          explanation: `The author contrasts 'traditional historians' (voluntary migration view) with 'modern archival research' showing coercion and dialectical struggle.`
        },
        {
          type: "Detail Evaluation",
          question: `According to the passage, modern archival research reveals that land consolidation was:`,
          options: [
            `Coercive and state-enforced.`,
            `Entirely voluntary and initiated by farmers.`,
            `Highly dependent on international trade agreements.`,
            `A minor historical event with no sociological significance.`
          ],
          correctAnswer: `Coercive and state-enforced.`,
          explanation: `The passage states that modern archival research reveals 'state-enforced land consolidations played a critical coercive role.'`
        },
        {
          type: "Historiographical Concept",
          question: `In the passage, the term 'dialectical struggle' implies that historical progress is:`,
          options: [
            `The result of conflicting forces and opposing social interests resolving over time.`,
            `A simple, straight line of constant technological improvement.`,
            `Entirely random and dictated by environmental disasters.`,
            `Driven exclusively by the decisions of individual emperors.`
          ],
          correctAnswer: `The result of conflicting forces and opposing social interests resolving over time.`,
          explanation: `A dialectical process involves contradictions (rural sovereignty vs. state control) clashing to produce new social realities.`
        },
        {
          type: "EXCEPT",
          question: `According to the passage, which of the following is NOT a challenge in verifying organic Martian biosignatures?`,
          options: [
            `The total lack of carbon detection equipment on modern rovers.`,
            `The mimicking potential of non-biological pathways.`,
            `Abiotic noise mimicking thermodynamics.`,
            `Distinguishing homochirality from abiotic thermodynamic decay.`
          ],
          correctAnswer: `The total lack of carbon detection equipment on modern rovers.`,
          explanation: `The passage states that simple carbon detection *is* possible but *insufficient* as proof due to abiotic mimicry, not that rovers lack the equipment.`
        }
      ];
    }
    
    return qPool.map((q, idx) => ({
      id: `${idPrefix}_procrc_${idx}`,
      section: "VARC",
      topic: "Reading Comprehension",
      subtopic: title,
      difficulty: idx % 2 === 0 ? "Level 3" : "Level 4",
      type: "MCQ",
      question: `${passage}<br><br><b>Question ${idx + 1} [${q.type}]:</b> ${q.question}`,
      options: this.shuffle([...q.options]),
      correctAnswer: q.correctAnswer,
      explanation: q.explanation
    }));
  },

  // 3. QA Engine with Zero-Reuse Retry Loop
  generateQA: function(subtopic, difficulty, id) {
    let attempts = 0;
    let finalQuestion = null;

    while (attempts < 20) {
      const names = ["Aman", "Rahul", "Priya", "Vikram", "Sneha", "Karan", "Arjun", "Anjali", "Kabir", "Meera"];
      const name1 = names[Math.floor(Math.random() * names.length)];
      const name2 = names.find(n => n !== name1) || "Bhim";
      let candidate = null;

      // Level 1: Very Easy
      if (difficulty === "Level 1") {
        const base = [100, 150, 200, 250, 300, 400][Math.floor(Math.random() * 6)];
        const percent = [10, 15, 20, 25, 30][Math.floor(Math.random() * 5)];
        const val = (base * percent) / 100;
        candidate = {
          id: id,
          section: "QA",
          topic: "Arithmetic",
          subtopic: subtopic,
          difficulty: "Level 1",
          type: "MCQ",
          question: `If ${name1} has a score of ${base} marks in a diagnostic test, and ${name2} scores ${percent}% of ${name1}'s marks, find ${name2}'s absolute score.`,
          options: this.shuffle([`${val}`, `${val + 10}`, `${val - 5}`, `${val * 1.2}`]),
          correctAnswer: `${val}`,
          explanation: `Simple percentage application:<br>Value = (${percent} / 100) * ${base} = ${val} marks.`
        };
      }
      // Level 2: Easy
      else if (difficulty === "Level 2") {
        if (subtopic.includes("Geometry") || subtopic.includes("Perimeter")) {
          const r = [7, 14, 21][Math.floor(Math.random() * 3)];
          const area = Math.round((22/7) * r * r);
          candidate = {
            id: id,
            section: "QA",
            topic: "Geometry",
            subtopic: subtopic,
            difficulty: "Level 2",
            type: "MCQ",
            question: `Find the area of a circle (in cm²) whose radius is ${r} cm. (Use π = 22/7)`,
            options: this.shuffle([`${area} cm²`, `${area + 44} cm²`, `${area - 28} cm²`, `${area * 1.1} cm²`]),
            correctAnswer: `${area} cm²`,
            explanation: `Direct Geometry formula:<br>Area = π * r² = (22/7) * ${r} * ${r} = ${area} cm².`
          };
        } else {
          const cp = [120, 240, 360, 480][Math.floor(Math.random() * 4)];
          const profit = [10, 20, 25, 30][Math.floor(Math.random() * 4)];
          const sp = Math.round(cp * (1 + profit / 100));
          candidate = {
            id: id,
            section: "QA",
            topic: "Arithmetic",
            subtopic: subtopic,
            difficulty: "Level 2",
            type: "MCQ",
            question: `${name1} purchases a textbook for Rs. ${cp} and sells it to ${name2} at a profit of ${profit}%. What is the selling price (in Rs.)?`,
            options: this.shuffle([`${sp}`, `${cp + profit}`, `${sp - 12}`, `${sp + 18}`]),
            correctAnswer: `${sp}`,
            explanation: `Basic profit equation:<br>Selling Price = CP * (1 + Profit/100) = ${cp} * (1 + ${profit}/100) = Rs. ${sp}.`
          };
        }
      }
      // Level 3: Moderate
      else if (difficulty === "Level 3") {
        if (subtopic.includes("Races") || subtopic.includes("Speed")) {
          const dist = [1000, 2000, 3000][Math.floor(Math.random() * 3)];
          const beat1 = [100, 200][Math.floor(Math.random() * 2)];
          const beat2 = [50, 100][Math.floor(Math.random() * 2)];
          const c_dist = ((dist - beat2) / dist) * (dist - beat1);
          const beat3 = Math.round(dist - c_dist);
          candidate = {
            id: id,
            section: "QA",
            topic: "Arithmetic",
            subtopic: subtopic,
            difficulty: "Level 3",
            type: "TITA",
            question: `In a linear race of ${dist} meters, ${name1} beats ${name2} by ${beat1} meters, and ${name2} beats Bhim by ${beat2} meters. By how many meters does ${name1} beat Bhim in the same race?`,
            options: null,
            correctAnswer: `${beat3}`,
            explanation: `Relative speeds in races:<br>Ratio of speeds:<br>S_A / S_B = ${dist} / ${dist - beat1}<br>S_B / S_C = ${dist} / ${dist - beat2}<br>=> S_A / S_C = (S_A / S_B) * (S_B / S_C) = (${dist} * ${dist}) / (${dist - beat1} * ${dist - beat2}).<br>Distance covered by C when A covers ${dist}m = ${dist} * (${dist - beat1}) * (${dist - beat2}) / (${dist * dist}) = ${c_dist}m.<br>A beats C by = ${dist} - ${c_dist} = ${beat3} meters.`
          };
        } else if (subtopic.includes("Number") || subtopic.includes("Remainders") || subtopic.includes("Divisibility")) {
          const primes = [17, 29, 37];
          const p = primes[Math.floor(Math.random() * 3)];
          const exponent = p - 1;
          const multiplier = [2, 3, 5][Math.floor(Math.random() * 3)];
          const queryExp = (exponent * multiplier) + 2;
          const baseVal = [2, 3, 5][Math.floor(Math.random() * 3)];
          const rem = (Math.pow(baseVal, 2)) % p;
          candidate = {
            id: id,
            section: "QA",
            topic: "Number Systems",
            subtopic: subtopic,
            difficulty: "Level 3",
            type: "MCQ",
            question: `Find the remainder when ${baseVal}<sup>${queryExp}</sup> is divided by the prime number ${p}.`,
            options: this.shuffle([`${rem}`, `${rem + 1}`, `${p - 1}`, `${Math.round(rem * 1.5)}`]),
            correctAnswer: `${rem}`,
            explanation: `By Fermat's Little Theorem, ${baseVal}<sup>${p-1}</sup> ≡ 1 (mod ${p}).<br>Here, the exponent is ${queryExp} = ${multiplier} * ${exponent} + 2.<br>Thus, ${baseVal}<sup>${queryExp}</sup> ≡ (${baseVal}<sup>${exponent}</sup>)<sup>${multiplier}</sup> * ${baseVal}² ≡ 1 * ${baseVal * baseVal} ≡ ${baseVal * baseVal} ≡ ${rem} (mod ${p}).`
          };
        } else {
          const sum = [5, 6, 7, 8][Math.floor(Math.random() * 4)];
          const prod = [4, 6, 8, 9][Math.floor(Math.random() * 4)];
          const sq = sum * sum - 2 * prod;
          candidate = {
            id: id,
            section: "QA",
            topic: "Algebra",
            subtopic: subtopic,
            difficulty: "Level 3",
            type: "TITA",
            question: `If the roots of the quadratic equation x² - ${sum}x + ${prod} = 0 are α and β, find the value of (α² + β²).`,
            options: null,
            correctAnswer: `${sq}`,
            explanation: `Algebraic identity:<br>α + β = ${sum}, αβ = ${prod}.<br>α² + β² = (α + β)² - 2αβ = ${sum}² - 2(${prod}) = ${sum * sum} - ${2 * prod} = ${sq}.`
          };
        }
      }
      // Level 4: Difficult
      else if (difficulty === "Level 4") {
        if (subtopic.includes("Interest")) {
          const p = [5000, 10000, 15000, 20000][Math.floor(Math.random() * 4)];
          const r = [5, 10, 12, 15][Math.floor(Math.random() * 4)];
          const diff = Math.round(p * (r / 100) * (r / 100));
          candidate = {
            id: id,
            section: "QA",
            topic: "Arithmetic",
            subtopic: subtopic,
            difficulty: "Level 4",
            type: "TITA",
            question: `Find the difference (in Rs.) between the Simple Interest and Compound Interest (compounded annually) on Rs. ${p} at ${r}% per annum for a period of 2 years.`,
            options: null,
            correctAnswer: `${diff}`,
            explanation: `Difference between CI and SI for 2 years is:<br>Difference = P * (R / 100)² = ${p} * (${r} / 100)² = ${p} * ${r * r / 10000} = Rs. ${diff}.`
          };
        } else if (subtopic.includes("Geometry") || subtopic.includes("Triangles")) {
          const mult = [1, 2, 3][Math.floor(Math.random() * 3)];
          const a = 13 * mult, b = 14 * mult, c = 15 * mult;
          const area = 84 * mult * mult;
          candidate = {
            id: id,
            section: "QA",
            topic: "Geometry",
            subtopic: subtopic,
            difficulty: "Level 4",
            type: "MCQ",
            question: `Find the area of a triangle (in cm²) whose sides measure ${a} cm, ${b} cm, and ${c} cm.`,
            options: this.shuffle([`${area} cm²`, `${area + 12} cm²`, `${area - 10} cm²`, `${area * 1.25} cm²`]),
            correctAnswer: `${area} cm²`,
            explanation: `Using Heron's Formula:<br>Semi-perimeter s = (${a} + ${b} + ${c})/2 = ${21 * mult} cm.<br>Area = √(s(s-a)(s-b)(s-c)) = √(${21*mult} * ${8*mult} * ${7*mult} * ${6*mult}) = ${area} cm².`
          };
        } else {
          const a = [2, 3, 5][Math.floor(Math.random() * 3)];
          const d = [3, 4, 5][Math.floor(Math.random() * 3)];
          const n = 10;
          const sum = (n / 2) * (2 * a + (n - 1) * d);
          candidate = {
            id: id,
            section: "QA",
            topic: "Algebra",
            subtopic: subtopic,
            difficulty: "Level 4",
            type: "TITA",
            question: `An Arithmetic Progression (AP) has its first term as ${a} and common difference as ${d}. Calculate the sum of its first ${n} terms.`,
            options: null,
            correctAnswer: `${sum}`,
            explanation: `AP Sum formula: S_n = (n/2) * [2a + (n-1)d].<br>S_10 = (${n}/2) * [2(${a}) + (${n}-1)*${d}] = 5 * [${2*a} + ${9*d}] = ${sum}.`
          };
        }
      }
      // Level 5: Very Difficult
      else {
        const baseVal = [2, 3][Math.floor(Math.random() * 2)];
        const val = baseVal === 2 ? 8 : 9;
        candidate = {
          id: id,
          section: "QA",
          topic: "Algebra",
          subtopic: subtopic,
          difficulty: "Level 5",
          type: "TITA",
          question: `Determine the positive real value of x that satisfies the logarithmic boundary equation: log_${baseVal}(x) + log_${baseVal}(x - 6) = ${baseVal === 2 ? 4 : 3}.`,
          options: null,
          correctAnswer: `${val}`,
          explanation: `Log properties and domain constraint check:<br>log_${baseVal}(x(x - 6)) = ${baseVal === 2 ? 4 : 3} => x(x - 6) = ${baseVal === 2 ? '2^4 = 16' : '3^3 = 27'}.<br>x² - 6x - ${baseVal === 2 ? 16 : 27} = 0. Solving gives x = ${val} or x = -${baseVal === 2 ? 2 : 3}.<br>Since x must be > 6, the negative root is rejected. Thus, x = ${val}.`
        };
      }

      if (candidate && !this.isQuestionUsed(candidate.question)) {
        finalQuestion = candidate;
        break;
      }
      attempts++;
    }

    // Fallback if registry fully saturated
    if (!finalQuestion) {
      finalQuestion = {
        id: id,
        section: "QA",
        topic: "Arithmetic",
        subtopic: subtopic,
        difficulty: difficulty,
        type: "MCQ",
        question: `Solve: What is the sum of angles of a standard polygon with 6 sides? (Dynamic set ${attempts})`,
        options: ["720", "540", "360", "180"],
        correctAnswer: "720",
        explanation: "Sum of interior angles = (n-2)*180 = 4*180 = 720."
      };
    }
    return finalQuestion;
  },

  // 4. DILR Set Engine with Zero-Reuse Retry Loop
  generateDILRSet: function(type, idPrefix) {
    let attempts = 0;
    let finalSet = [];

    while (attempts < 20) {
      const qList = [];
      const randId = Math.floor(Math.random() * 10000);

      if (type === "Arrangement") {
        const names = this.shuffle(["Aman", "Rahul", "Priya", "Vikram", "Sneha", "Karan"]);
        const [n1, n2, n3, n4, n5, n6] = names;
        const passage = `<b>DILR Caselet (Circular Arrangement - Set ${randId}):</b><br>Six friends (${n1}, ${n2}, ${n3}, ${n4}, ${n5}, and ${n6}) are sitting around a circular table facing the center.<br>1. ${n1} sits opposite to ${n3} and adjacent to ${n2}.<br>2. ${n4} sits to the immediate left of ${n3}.<br>3. ${n5} is not adjacent to ${n2}.`;

        qList.push({
          id: `${idPrefix}_q1`,
          section: "DILR",
          topic: "Logical Reasoning",
          subtopic: "Linear & Circular Arrangements",
          difficulty: "Level 3",
          type: "MCQ",
          question: `${passage}<br><br><b>Question 1:</b> Who sits to the immediate right of ${n1}?`,
          options: this.shuffle([`${n2}`, `${n5}`, `${n4}`, `${n6}`]),
          correctAnswer: `${n2}`,
          explanation: `Clockwise order from ${n1} is ${n1} -> ${n2} -> ${n6} -> ${n3} -> ${n4} -> ${n5}. Hence, ${n2} sits to the immediate right of ${n1}.`
        });
        qList.push({
          id: `${idPrefix}_q2`,
          section: "DILR",
          topic: "Logical Reasoning",
          subtopic: "Linear & Circular Arrangements",
          difficulty: "Level 3",
          type: "MCQ",
          question: `${passage}<br><br><b>Question 2:</b> Who sits opposite to ${n4}?`,
          options: this.shuffle([`${n2}`, `${n1}`, `${n5}`, `${n6}`]),
          correctAnswer: `${n2}`,
          explanation: `${n4} is at seat 5 and ${n2} is at seat 2. They sit opposite to each other.`
        });
        qList.push({
          id: `${idPrefix}_q3`,
          section: "DILR",
          topic: "Logical Reasoning",
          subtopic: "Linear & Circular Arrangements",
          difficulty: "Level 4",
          type: "MCQ",
          question: `${passage}<br><br><b>Question 3:</b> Who sits adjacent to ${n6}?`,
          options: this.shuffle([`${n2} and ${n3}`, `${n1} and ${n4}`, `${n5} and ${n3}`, `${n4} and ${n2}`]),
          correctAnswer: `${n2} and ${n3}`,
          explanation: `${n6} sits between ${n2} and ${n3}.`
        });
        qList.push({
          id: `${idPrefix}_q4`,
          section: "DILR",
          topic: "Logical Reasoning",
          subtopic: "Linear & Circular Arrangements",
          difficulty: "Level 4",
          type: "TITA",
          question: `${passage}<br><br><b>Question 4:</b> If ${n5} and ${n2} swap their positions, who sits opposite to ${n5}? (Enter name)`,
          options: null,
          correctAnswer: `${n4}`,
          explanation: `Originally ${n4} sits opposite to ${n2}. If ${n5} swaps with ${n2}, ${n5} occupies the seat opposite to ${n4}.`
        });
        qList.push({
          id: `${idPrefix}_q5`,
          section: "DILR",
          topic: "Logical Reasoning",
          subtopic: "Linear & Circular Arrangements",
          difficulty: "Level 5",
          type: "MCQ",
          question: `${passage}<br><br><b>Question 5:</b> How many people sit between ${n1} and ${n3} when moving anti-clockwise?`,
          options: this.shuffle(["2", "1", "3", "0"]),
          correctAnswer: "2",
          explanation: `Anti-clockwise from ${n1}: ${n1} -> ${n5} -> ${n4} -> ${n3}. There are 2 people in between (${n5} and ${n4}).`
        });
      } else if (type === "Venn") {
        const total = [100, 120, 150][Math.floor(Math.random() * 3)];
        const c = Math.round(total * 0.54);
        const f = Math.round(total * 0.42);
        const h = Math.round(total * 0.38);
        const all3 = 10;
        const bothCF = 20;
        const bothFH = 15;
        const bothCH = 25;

        const onlyCF = bothCF - all3;
        const onlyFH = bothFH - all3;
        const onlyCH = bothCH - all3;

        const onlyC = c - onlyCF - onlyCH - all3;
        const onlyF = f - onlyCF - onlyFH - all3;
        const onlyH = h - onlyCH - onlyFH - all3;

        const exactly1 = onlyC + onlyF + onlyH;
        const exactly2 = onlyCF + onlyFH + onlyCH;
        const active = exactly1 + exactly2 + all3;
        const none = total - active;

        const passage = `<b>DILR Caselet (Venn Diagram - Set ${randId}):</b><br>In a corporate department of ${total} employees, ${c} play Cricket, ${f} play Football, and ${h} play Hockey. 20 play both Cricket and Football, 15 play Football and Hockey, and 25 play Cricket and Hockey. 10 employees play all three sports.`;

        qList.push({
          id: `${idPrefix}_q1`,
          section: "DILR",
          topic: "Logical Reasoning",
          subtopic: "Venn Logic",
          difficulty: "Level 3",
          type: "MCQ",
          question: `${passage}<br><br><b>Question 1:</b> How many employees play exactly two sports?`,
          options: this.shuffle([`${exactly2}`, `${exactly2 + 5}`, `${exactly2 - 5}`, `${exactly2 * 1.2}`]),
          correctAnswer: `${exactly2}`,
          explanation: `Exactly 2 sports = (C&F only) + (F&H only) + (C&H only) = (${bothCF}-10) + (${bothFH}-10) + (${bothCH}-10) = ${onlyCF} + ${onlyFH} + ${onlyCH} = ${exactly2}.`
        });
        qList.push({
          id: `${idPrefix}_q2`,
          section: "DILR",
          topic: "Logical Reasoning",
          subtopic: "Venn Logic",
          difficulty: "Level 3",
          type: "MCQ",
          question: `${passage}<br><br><b>Question 2:</b> How many employees play only Cricket?`,
          options: this.shuffle([`${onlyC}`, `${onlyC + 5}`, `${onlyC - 5}`, `${onlyC * 1.5}`]),
          correctAnswer: `${onlyC}`,
          explanation: `Only Cricket = Total Cricket - (Only C&F) - (Only C&H) - (All Three) = ${c} - ${onlyCF} - ${onlyCH} - 10 = ${onlyC}.`
        });
        qList.push({
          id: `${idPrefix}_q3`,
          section: "DILR",
          topic: "Logical Reasoning",
          subtopic: "Venn Logic",
          difficulty: "Level 4",
          type: "MCQ",
          question: `${passage}<br><br><b>Question 3:</b> How many employees play exactly one sport?`,
          options: this.shuffle([`${exactly1}`, `${exactly1 + 10}`, `${exactly1 - 10}`, `${exactly1 * 1.1}`]),
          correctAnswer: `${exactly1}`,
          explanation: `Only C = ${onlyC}, Only F = ${onlyF}, Only H = ${onlyH}. Sum = ${exactly1}.`
        });
        qList.push({
          id: `${idPrefix}_q4`,
          section: "DILR",
          topic: "Logical Reasoning",
          subtopic: "Venn Logic",
          difficulty: "Level 4",
          type: "TITA",
          question: `${passage}<br><br><b>Question 4:</b> How many employees do not play any of the three sports?`,
          options: null,
          correctAnswer: `${none}`,
          explanation: `None = Total (${total}) - Active playing (${active}) = ${none}.`
        });
        qList.push({
          id: `${idPrefix}_q5`,
          section: "DILR",
          topic: "Logical Reasoning",
          subtopic: "Venn Logic",
          difficulty: "Level 5",
          type: "MCQ",
          question: `${passage}<br><br><b>Question 5:</b> What is the ratio of employees playing only Football to employees playing only Hockey?`,
          options: this.shuffle([`${onlyF}:${onlyH}`, `3:5`, `4:3`, `3:4`]),
          correctAnswer: `${onlyF}:${onlyH}`,
          explanation: `Only Football = ${onlyF}. Only Hockey = ${onlyH}. Ratio = ${onlyF}:${onlyH}.`
        });
      } else {
        const baseVal = [100, 200, 300][Math.floor(Math.random() * 3)];
        const q1 = baseVal + 20;
        const q2 = baseVal + 50;
        const q3 = baseVal + 60;
        const q4 = baseVal + 100;
        const sum = q1 + q2 + q3 + q4;
        const avg = sum / 4;
        const pctGrowth = Math.round(((q2 - q1) / q1) * 100);

        const passage = `<b>DILR Caselet (Data Interpretation Table - Set ${randId}):</b><br>The table shows sales revenue of four quarters (in millions Rs.) for Company X:<br>Q1: ${q1} | Q2: ${q2} | Q3: ${q3} | Q4: ${q4}.`;

        qList.push({
          id: `${idPrefix}_q1`,
          section: "DILR",
          topic: "Data Interpretation",
          subtopic: "Tables & Caselets",
          difficulty: "Level 2",
          type: "MCQ",
          question: `${passage}<br><br><b>Question 1:</b> What is the percentage increase in sales from Q1 to Q2 (rounded)?`,
          options: this.shuffle([`${pctGrowth}%`, `${pctGrowth - 5}%`, `${pctGrowth + 10}%`, `20%`]),
          correctAnswer: `${pctGrowth}%`,
          explanation: `Increase = (${q2} - ${q1})/${q1} * 100 = ${pctGrowth}%.`
        });
        qList.push({
          id: `${idPrefix}_q2`,
          section: "DILR",
          topic: "Data Interpretation",
          subtopic: "Tables & Caselets",
          difficulty: "Level 2",
          type: "TITA",
          question: `${passage}<br><br><b>Question 2:</b> Calculate the total annual revenue (in millions Rs.).`,
          options: null,
          correctAnswer: `${sum}`,
          explanation: `Sum = ${q1} + ${q2} + ${q3} + ${q4} = ${sum} million.`
        });
        qList.push({
          id: `${idPrefix}_q3`,
          section: "DILR",
          topic: "Data Interpretation",
          subtopic: "Tables & Caselets",
          difficulty: "Level 3",
          type: "MCQ",
          question: `${passage}<br><br><b>Question 3:</b> What is the average quarter sales revenue (in millions)?`,
          options: this.shuffle([`${avg}`, `${avg + 10}`, `${avg - 15}`, `${avg * 1.1}`]),
          correctAnswer: `${avg}`,
          explanation: `Average = Total (${sum}) / 4 = ${avg} million.`
        });
        qList.push({
          id: `${idPrefix}_q4`,
          section: "DILR",
          topic: "Data Interpretation",
          subtopic: "Tables & Caselets",
          difficulty: "Level 3",
          type: "MCQ",
          question: `${passage}<br><br><b>Question 4:</b> In which quarter was the percentage growth rate the highest?`,
          options: this.shuffle(["Q2", "Q3", "Q4", "Both Q2 and Q4"]),
          correctAnswer: "Q2",
          explanation: `Growth rates: Q2 = ${pctGrowth}%. Q3 = ${Math.round((q3-q2)/q2 * 100)}%. Q4 = ${Math.round((q4-q3)/q3 * 100)}%. The highest is Q2.`
        });
      }

      if (qList.length > 0 && !this.isQuestionUsed(qList[0].question)) {
        finalSet = qList;
        break;
      }
      attempts++;
    }

    if (finalSet.length === 0) {
      // Fallback
      finalSet = [{
        id: `${idPrefix}_fallback`,
        section: "DILR",
        topic: "Data Interpretation",
        subtopic: "Tables & Caselets",
        difficulty: "Level 3",
        type: "MCQ",
        question: `Diagnostic DI Table (Set ${attempts}): Day 1 sales was 100. Day 2 sales was 120. Find percentage growth.`,
        options: ["20%", "10%", "30%", "15%"],
        correctAnswer: "20%",
        explanation: "Growth = (120-100)/100 = 20%."
      }];
    }
    return finalSet;
  },

  // 5. VARC Engine with Zero-Reuse Retry Loop (Calls dynamic procedural RCs)
  generateVARC: function(type, idPrefix) {
    let attempts = 0;
    let finalSet = [];

    while (attempts < 20) {
      if (type === "RC") {
        const rcSet = this.generateProceduralRC(idPrefix);
        if (rcSet.length > 0 && !this.isQuestionUsed(rcSet[0].question)) {
          finalSet = rcSet;
          break;
        }
      } else {
        // VA Verbal Ability
        const randVal = Math.floor(Math.random() * 10000);
        const optionsVA = [
          {
            type: "Parajumbles (TITA)",
            question: `Arrange the sentences in logical order (Set ${randVal}):<br>1. Similarly, sleep debt impairs concentration.<br>2. Studies show skipping sleep reduces brain glucose.<br>3. This reduction directly damages problem solving.<br>4. Cognitive decline is a consequence of sleep deprivation.`,
            correctAnswer: "4231",
            explanation: "4 establishes decline. 2 details research. 3 connects glucose reduction. 1 bridges to sleep debt."
          },
          {
            type: "Paragraph Summary",
            question: `<b>Summary Context (Set ${randVal})</b>: "Classical physicists viewed the world as a deterministic clockwork. Quantum mechanics shattered this, introducing fundamental uncertainty at the particle scale."<br>Select best summary:`,
            options: [
              "Quantum physics replaced the deterministic clockwork model of classical physics with particle uncertainty.",
              "Classical physics is completely wrong about macro scale objects.",
              "Uncertainty is a minor math error in equations.",
              "Determism has been fully proved by quantum science."
            ],
            correctAnswer: "Quantum physics replaced the deterministic clockwork model of classical physics with particle uncertainty.",
            explanation: "Choice 1 captures both the deterministic assumption and the quantum shift."
          }
        ];
        
        const chosen = optionsVA[Math.floor(Math.random() * optionsVA.length)];
        const qObj = {
          id: `${idPrefix}_va_${randVal}`,
          section: "VARC",
          topic: "Verbal Ability",
          subtopic: chosen.type,
          difficulty: "Level 3",
          type: chosen.options ? "MCQ" : "TITA",
          question: chosen.question,
          options: chosen.options ? this.shuffle([...chosen.options]) : null,
          correctAnswer: chosen.correctAnswer,
          explanation: chosen.explanation
        };

        if (!this.isQuestionUsed(qObj.question)) {
          finalSet = [qObj];
          break;
        }
      }
      attempts++;
    }

    if (finalSet.length === 0) {
      finalSet = [{
        id: `${idPrefix}_fallback_va`,
        section: "VARC",
        topic: "Verbal Ability",
        subtopic: "Odd Sentence Out",
        difficulty: "Level 3",
        type: "TITA",
        question: `Odd Sentence Out: 1. Trees use chlorophyll. 2. Solar light turns to sugars. 3. Rocks contain minerals. 4. Solar absorption is key.`,
        options: null,
        correctAnswer: "3",
        explanation: "1, 2, 4 focus on photosynthesis. 3 focuses on geology."
      }];
    }
    return finalSet;
  },

  // 6. Practice Drill Generator
  generatePracticeDrill: function(section, topic, subtopic, confidence) {
    const list = [];
    const count = 15;
    
    let l45Count = 4;
    if (confidence === 'Medium' || confidence === 'Med') l45Count = 12;
    else if (confidence === 'High') l45Count = 15;

    for (let i = 0; i < count; i++) {
      let diff = "Level 3";
      if (i < l45Count) {
        diff = i % 2 === 0 ? "Level 4" : "Level 5";
      } else {
        diff = i % 3 === 0 ? "Level 1" : (i % 3 === 1 ? "Level 2" : "Level 3");
      }

      if (section === 'QA') {
        list.push(this.generateQA(subtopic, diff, `drill_${section}_${Date.now()}_q${i}`));
      } else if (section === 'DILR') {
        const setType = i < 5 ? "Arrangement" : (i < 10 ? "Venn" : "DI");
        const setQs = this.generateDILRSet(setType, `drill_${section}_${Date.now()}_s_${i}`);
        const chosen = setQs[i % setQs.length];
        chosen.difficulty = diff;
        list.push(chosen);
      } else {
        if (i < 10) {
          const rcQs = this.generateVARC("RC", `drill_${section}_${Date.now()}_rc_${i}`);
          const chosen = rcQs[i % rcQs.length];
          chosen.difficulty = diff;
          list.push(chosen);
        } else {
          const vaQs = this.generateVARC("VA", `drill_${section}_${Date.now()}_va_${i}`);
          const chosen = vaQs[i % vaQs.length];
          chosen.difficulty = diff;
          list.push(chosen);
        }
      }
    }
    return list;
  },

  // 7. Generate Sectional Exams
  generateSectional: function(section, testId) {
    const list = [];
    if (section === 'QA') {
      const arith = window.CAT_SYLLABUS.QA.topics["Arithmetic"];
      const arithDiffs = ["Level 1", "Level 2", "Level 2", "Level 3", "Level 3", "Level 3", "Level 3", "Level 3", "Level 4", "Level 4"];
      for (let i = 0; i < 10; i++) {
        const sub = arith[i % arith.length];
        list.push(this.generateQA(sub, arithDiffs[i], `sec_qa_${testId}_a${i}`));
      }
      const alg = window.CAT_SYLLABUS.QA.topics["Algebra"];
      const algDiffs = ["Level 1", "Level 2", "Level 3", "Level 3", "Level 4", "Level 5"];
      for (let i = 0; i < 6; i++) {
        const sub = alg[i % alg.length];
        list.push(this.generateQA(sub, algDiffs[i], `sec_qa_${testId}_g${i}`));
      }
      const geom = window.CAT_SYLLABUS.QA.topics["Geometry"];
      const geomDiffs = ["Level 2", "Level 3", "Level 4"];
      for (let i = 0; i < 3; i++) {
        const sub = geom[i % geom.length];
        list.push(this.generateQA(sub, geomDiffs[i], `sec_qa_${testId}_e${i}`));
      }
      const num = window.CAT_SYLLABUS.QA.topics["Number Systems"];
      const numDiffs = ["Level 2", "Level 3"];
      for (let i = 0; i < 2; i++) {
        const sub = num[i % num.length];
        list.push(this.generateQA(sub, numDiffs[i], `sec_qa_${testId}_n${i}`));
      }
      const mm = window.CAT_SYLLABUS.QA.topics["Modern Math"];
      list.push(this.generateQA(mm[0], "Level 3", `sec_qa_${testId}_m0`));

    } else if (section === 'DILR') {
      const s1 = this.generateDILRSet("Arrangement", `sec_dilr_${testId}_s1`).slice(0, 4);
      s1.forEach(q => q.difficulty = "Level 2");
      list.push(...s1);

      const s2 = this.generateDILRSet("Venn", `sec_dilr_${testId}_s2`).slice(0, 4);
      s2.forEach(q => q.difficulty = "Level 3");
      list.push(...s2);

      const s3 = this.generateDILRSet("DI", `sec_dilr_${testId}_s3`).slice(0, 4);
      s3.forEach(q => q.difficulty = "Level 3");
      list.push(...s3);

      const s4 = this.generateDILRSet("Arrangement", `sec_dilr_${testId}_s4`);
      s4.forEach(q => q.difficulty = "Level 4");
      list.push(...s4);

      const s5 = this.generateDILRSet("Venn", `sec_dilr_${testId}_s5`);
      s5.forEach(q => q.difficulty = "Level 5");
      list.push(...s5);

    } else {
      for (let pass = 1; pass <= 4; pass++) {
        const rcSet = this.generateVARC("RC", `sec_varc_${testId}_p${pass}`);
        list.push(...rcSet);
      }
      for (let va = 1; va <= 8; va++) {
        const vaQ = this.generateVARC("VA", `sec_varc_${testId}_va${va}`);
        list.push(vaQ[0]);
      }
    }
    return list;
  },

  // 8. Generate Full Mock Exams
  generateMock: function(testId) {
    const list = [];
    list.push(...this.generateSectional("VARC", `${testId}_varc`));
    list.push(...this.generateSectional("DILR", `${testId}_dilr`));
    list.push(...this.generateSectional("QA", `${testId}_qa`));
    return list;
  }
};
