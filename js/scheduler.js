// CAT Prep Buddy Scheduler Engine
window.CAT_SCHEDULER = {
  // Database of easy tips & tricks for every combination of CAT questions
  getTipsAndTricks: function(section, subtopic) {
    const defaultTips = {
      'QA': "Substitution shortcut: Solve algebraic/arithmetic equations quickly by substituting variables with clean numbers like 0, 1, or 2 to eliminate wrong options instantly.",
      'DILR': "Venn diagram shortcut: For 3-variable sets, always write the formula: Total = sum(Single) - sum(Exactly 2) - 2*(Exactly 3) + None. Solve from the core intersection outwards.",
      'VARC': "Elimination shortcut: Eliminate options containing extreme words ('only', 'never', 'always') or options that go beyond the scope of the passage."
    };

    const tipsMap = {
      // QA Section Specifics
      'Algebra': "When solving polynomials or quadratic expressions, use value substitution (e.g., x = 2 or x = 3) to test all options in 15 seconds.",
      'Sequence & Series': "For AP/GP summation series, find the sum for n=1, n=2, and n=3, then substitute these n values in the options to see which matches.",
      'Equations': "Use option back-solving: plug the option values back into the equation instead of solving complex quadratic/cubic steps.",
      'Percentages': "Base 100 approach: Assume the initial value is 100. If price rises by 25% and consumption drops by 20%, final = 100 * 1.25 * 0.8 = 100 (0% change).",
      'Profit & Loss': "Use CP-SP ratio calculations. If profit is 20%, the CP:SP ratio is 5:6. This simplifies complex compounding profit equations.",
      'Ratios': "Substitute proportion constant k with 1 to evaluate complex equations immediately.",
      'Time & Work': "LCM trick: Assume the total work is the LCM of the days taken. If A takes 10 days and B takes 15 days, assume work is 30 units (A=3u/day, B=2u/day).",
      'Time Speed Distance': "Average speed shortcut: For equal distances, average speed is the Harmonic Mean of speeds: 2*S1*S2 / (S1 + S2). Avoid calculating distances.",
      'Numbers': "Divisibility checks: Eliminate large number options by checking prime divisibility rules (e.g., for 11, difference of odd-even position sums).",
      
      // DILR Section Specifics
      'Arrangements': "Circular arrangements: Always fix the position of the person with the most relative details first, then place others clock/counter-clockwise.",
      'Grid Arrangements': "Matrix rule: Set up a grid with fixed entities (names) as rows, and attributes as columns. Mark positive tick marks and cross out negative relationships.",
      'Venn Diagrams': "Venn intersections: Fill the innermost 'All 3' region first. Use the formula: Total = sum(only 1) + sum(only 2) + All 3 + None.",
      'Games & Tournaments': "Knockout rule: In a knockout tournament of N players, the total number of matches required to find 1 winner is always N - 1.",
      'Logical Graphs': "Data Interpretation shortcut: Focus on absolute values first rather than growth percentages unless explicitly asked. Check the scale units carefully.",
      'Routes & Networks': "Critical path: Start backwards from the destination node to the source node to find the shortest/longest routes efficiently.",
      
      // VARC Section Specifics
      'Reading Comprehension': "Inference questions: If the option states something not explicitly mentioned but logical, ensure it aligns with the author's primary thesis statement.",
      'Parajumbles': "Mandatory pairs: Identify noun-pronoun links (e.g. 'Albert Einstein' in sentence B -> 'He' in sentence D indicates B-D is a mandatory pair).",
      'Odd One Out': "Theme matching: Read the sentences and identify the central subject. The odd sentence will share keywords but discuss a different aspect or scale.",
      'Summary': "Main theme check: The correct summary must cover the entire passage, not just one paragraph. Avoid options that add external information."
    };

    // Lookup subtopic first, then fall back to section defaults
    for (let key in tipsMap) {
      if (subtopic && subtopic.includes(key)) {
        return tipsMap[key];
      }
    }
    return defaultTips[section] || "Focus on speed, eliminate options with extreme values, and mark key concepts in your Error Notebook.";
  },

  // Helper to generate the study schedule
  generateSchedule: function(config) {
    const startDate = new Date(config.startDate || "2026-07-18");
    const endDate = new Date(config.examDate || "2026-11-29");
    const dailyHours = parseFloat(config.dailyHours || 3);
    const weaknesses = config.weaknesses || [];
    const strengths = config.strengths || [];
    const level = config.aspirantLevel || "Beginner"; // Beginner, Intermediate, Advanced
    
    // Calculate difference in days
    const diffTime = Math.abs(endDate - startDate);
    const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    
    // Fallback if dates are invalid
    if (isNaN(totalDays) || totalDays <= 0) {
      return [];
    }

    const schedule = [];
    
    // Get all subtopics to distribute
    const syllabusPool = [];
    const sections = ['QA', 'DILR', 'VARC'];
    
    sections.forEach(sec => {
      const topics = window.CAT_SYLLABUS[sec].topics;
      for (let topicName in topics) {
        topics[topicName].forEach(subtopic => {
          syllabusPool.push({
            section: sec,
            topic: topicName,
            subtopic: subtopic
          });
        });
      }
    });

    // Sort syllabusPool such that weak sections are covered earlier and get more focus
    syllabusPool.sort((a, b) => {
      const aIsWeak = weaknesses.includes(a.section) ? 1 : 0;
      const bIsWeak = weaknesses.includes(b.section) ? 1 : 0;
      return bIsWeak - aIsWeak; // Put weak sections first
    });

    let syllabusIndex = 0;
    const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

    for (let dayOffset = 0; dayOffset < totalDays; dayOffset++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + dayOffset);
      
      const dateStr = currentDate.toISOString().split('T')[0];
      const dayName = daysOfWeek[currentDate.getDay()];
      const isSunday = currentDate.getDay() === 0;
      const isSaturday = currentDate.getDay() === 6;
      
      const dayTasks = [];
      let taskIdCounter = 1;

      // Generate Level-Specific Sunday/Saturday Mock tasks
      if (isSunday) {
        let detailsText = "";
        if (level === "Beginner") {
          detailsText = "Review fundamental theories and core definitions from this week. Re-solve incorrect exercises slowly in the Error Notebook.";
        } else if (level === "Intermediate") {
          detailsText = "Audit basic formula parameters, analyze mistake patterns in last mock, and re-attempt errors under a 2-minute timer.";
        } else {
          detailsText = "Analyze advanced mock traps. Drill down on skipped complex DILR sets and QA equations. Log conceptual shortcuts.";
        }

        dayTasks.push({
          id: `task_${dateStr}_${taskIdCounter++}`,
          time: "09:00 AM",
          title: `Sunday Revision Hub (${level} Track)`,
          category: "Revision",
          details: detailsText,
          tips: "Sunday Tip: When reviewing mistakes, don't look at the solution immediately. Re-read the question, identify the topic, and try to write down the first step again.",
          completed: false
        });

        dayTasks.push({
          id: `task_${dateStr}_${taskIdCounter++}`,
          time: "03:00 PM",
          title: "Weekly Mock Review & Audit",
          category: "Revision",
          details: `Re-evaluate yesterday's mock. ${level === 'Advanced' ? 'Identify why tricky questions were skipped.' : 'Ensure basic questions had 100% accuracy.'}`,
          tips: "Review Tip: Maintain a specific folder of solutions for questions that took you more than 3 minutes to solve, and write down the shortcut step.",
          completed: false
        });

      } else if (isSaturday) {
        let mockTitle = "CAT Full-Length Mock Exam";
        let mockDetails = "";

        if (level === "Beginner") {
          mockTitle = "Baseline Practice Mock (Foundation Level)";
          mockDetails = "Attempt mock focused on accuracy. Don't worry about speed; focus on correctly identifying and solving basic Level 1 and Level 2 questions.";
        } else if (level === "Intermediate") {
          mockTitle = "Sectional Mock & Speed Assessment";
          mockDetails = "Attempt timed sectional mocks. Practice time allocation techniques (e.g. 10 mins reading, 30 mins answering for VARC).";
        } else {
          mockTitle = "Advanced CAT-Level Mock Challenge";
          mockDetails = "Attempt strict 2-hour full mock. Target advanced Level 4/5 questions. Practice question selection: skip complex calculations within 30 seconds.";
        }

        dayTasks.push({
          id: `task_${dateStr}_${taskIdCounter++}`,
          time: "09:00 AM",
          title: mockTitle,
          category: "Mock",
          details: mockDetails,
          tips: "Mock Tip: Spend the first 2 minutes of the section scanning questions. Mark easy/direct questions first and solve them in Round 1 before tackling long calculations.",
          completed: false
        });

        dayTasks.push({
          id: `task_${dateStr}_${taskIdCounter++}`,
          time: "04:00 PM",
          title: "In-App Mock Diagnostics Analysis",
          category: "Analysis",
          details: "Submit your scorecard inside the app. Review section accuracy graphs and log mistake categories (Silly vs Conceptual).",
          tips: "Analysis Tip: If your accuracy in a section is below 70%, it means you are guessing. Stop guessing and focus on attempting fewer questions with higher precision.",
          completed: false
        });

      } else {
        // Weekday Syllabus Progression Tasks (Level Specific)
        const primaryStudy = syllabusPool[syllabusIndex % syllabusPool.length];
        syllabusIndex++;

        const isWeak = weaknesses.includes(primaryStudy.section);
        const studyTimeStr = dailyHours > 3 ? "09:00 AM" : "10:00 AM";
        const primaryHours = isWeak ? Math.ceil(dailyHours * 0.6) : Math.floor(dailyHours * 0.5) || 1;
        
        let primaryTitle = "";
        let primaryDetails = "";
        let secondaryTitle = "";
        let secondaryDetails = "";

        const tipsText = this.getTipsAndTricks(primaryStudy.section, primaryStudy.subtopic);

        if (level === "Beginner") {
          // Focus: Prior knowledge of basics to advanced, and relevant assignments
          primaryTitle = `Learn Concepts: ${primaryStudy.section} - ${primaryStudy.subtopic}`;
          primaryDetails = `Read theoretical foundations of ${primaryStudy.subtopic}. Write down formulas and solve 5 basic solved examples. (${primaryHours} hrs)`;
          
          secondaryTitle = `Basic Assignment: ${primaryStudy.section} Practice`;
          secondaryDetails = `Solve 10 elementary assignments on ${primaryStudy.subtopic} to test conceptual retention. (Allocated: ${Math.max(1, Math.round(dailyHours - primaryHours))} hrs)`;

        } else if (level === "Intermediate") {
          // Focus: Basics revision, then advanced level, and relevant assessments
          primaryTitle = `Revision & Basics Recapitulation: ${primaryStudy.section}`;
          primaryDetails = `Quickly revise basic formulas for ${primaryStudy.subtopic}. Re-solve 3 past incorrect error logs. (${primaryHours} hrs)`;
          
          secondaryTitle = `Advanced Level Assessment: ${primaryStudy.subtopic}`;
          secondaryDetails = `Take a 10-question timed assessment on ${primaryStudy.subtopic}. Target Level 3/4 questions. (Allocated: ${Math.max(1, Math.round(dailyHours - primaryHours))} hrs)`;

        } else {
          // Focus: Tricky assessments, high difficulty of questions (CAT level)
          primaryTitle = `Tricky Assessment Challenge: ${primaryStudy.subtopic}`;
          primaryDetails = `Attempt 12 high-difficulty (Level 4/5) questions on ${primaryStudy.subtopic} under a strict 20-minute timer. (${primaryHours} hrs)`;
          
          secondaryTitle = `CAT-Level Challenger Drill: ${primaryStudy.section}`;
          secondaryDetails = `Solve actual past CAT papers and complex caselets on ${primaryStudy.subtopic}. Examine traps. (Allocated: ${Math.max(1, Math.round(dailyHours - primaryHours))} hrs)`;
        }

        dayTasks.push({
          id: `task_${dateStr}_${taskIdCounter++}`,
          time: studyTimeStr,
          title: primaryTitle,
          category: primaryStudy.section,
          details: primaryDetails,
          tips: tipsText,
          completed: false,
          referenceSubtopic: primaryStudy.subtopic,
          referenceSection: primaryStudy.section
        });

        // Add a secondary support task (alternating sections)
        const secondarySection = sections.find(s => s !== primaryStudy.section) || 'QA';
        const secTopics = window.CAT_SYLLABUS[secondarySection].topics;
        const keys = Object.keys(secTopics);
        const randomTopic = keys[Math.floor(Math.random() * keys.length)];
        const randomSub = secTopics[randomTopic][Math.floor(Math.random() * secTopics[randomTopic].length)];
        
        const secondaryTimeStr = dailyHours > 3 ? "03:00 PM" : "05:00 PM";
        const secondaryHours = Math.max(1, Math.round(dailyHours - primaryHours));
        const secondaryTips = this.getTipsAndTricks(secondarySection, randomSub);

        dayTasks.push({
          id: `task_${dateStr}_${taskIdCounter++}`,
          time: secondaryTimeStr,
          title: secondaryTitle || `Practice: ${secondarySection} - ${randomSub}`,
          category: secondarySection,
          details: secondaryDetails || `Solve 5 standard difficulty problems. (Allocated: ${secondaryHours} hrs)`,
          tips: secondaryTips,
          completed: false,
          referenceSubtopic: randomSub,
          referenceSection: secondarySection
        });

        // Add VARC reading load for higher capacity study plans
        if (dailyHours >= 4) {
          dayTasks.push({
            id: `task_${dateStr}_${taskIdCounter++}`,
            time: "08:00 PM",
            title: "Daily RC Reading & Vocabulary",
            category: "VARC",
            details: "Read 1 long editorial piece from AEON Essays or The Guardian. Summarize the central argument in 3 bullet points.",
            tips: "Reading Tip: Do not read out loud or sub-vocalize words. Force your eyes to glide over the text to increase speed.",
            completed: false
          });
        }
      }

      schedule.push({
        date: dateStr,
        dayName: dayName,
        completed: false,
        tasks: dayTasks
      });
    }

    return schedule;
  }
};
