// CAT Prep Buddy Scheduler Engine
window.CAT_SCHEDULER = {
  // Helper to generate the study schedule
  generateSchedule: function(config) {
    const startDate = new Date(config.startDate || "2026-07-18");
    const endDate = new Date(config.examDate || "2026-11-29");
    const dailyHours = parseFloat(config.dailyHours || 3);
    const weaknesses = config.weaknesses || [];
    const strengths = config.strengths || [];
    
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

    // Let's sort syllabusPool such that weak sections are covered earlier and get more focus
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

      if (isSunday) {
        // Revision Day
        dayTasks.push({
          id: `task_${dateStr}_${taskIdCounter++}`,
          time: "09:00 AM",
          title: "Sunday Revision Hub",
          category: "Revision",
          details: "Review formulas sheet, revisit notes, and re-attempt items from the Error Notebook.",
          completed: false
        });
        dayTasks.push({
          id: `task_${dateStr}_${taskIdCounter++}`,
          time: "03:00 PM",
          title: "Weekly Mock Review",
          category: "Revision",
          details: "Thoroughly analyze yesterday's Mock Test. Re-solve incorrect/skipped questions.",
          completed: false
        });
      } else if (isSaturday) {
        // Mock Day
        dayTasks.push({
          id: `task_${dateStr}_${taskIdCounter++}`,
          time: "09:00 AM",
          title: "CAT Full-Length Mock Exam",
          category: "Mock",
          details: "Attempt a 2-hour full-length mock under strict exam conditions (VARC -> DILR -> QA).",
          completed: false
        });
        dayTasks.push({
          id: `task_${dateStr}_${taskIdCounter++}`,
          time: "04:00 PM",
          title: "In-App Mock Analysis Submission",
          category: "Analysis",
          details: "Submit and review mock patterns, times spent per section, and classify errors.",
          completed: false
        });
      } else {
        // Weekday Syllabus Progression
        // Assign a syllabus item
        const primaryStudy = syllabusPool[syllabusIndex % syllabusPool.length];
        syllabusIndex++;

        // Add primary task
        const isWeak = weaknesses.includes(primaryStudy.section);
        const studyTimeStr = dailyHours > 3 ? "09:00 AM" : "10:00 AM";
        const primaryHours = isWeak ? Math.ceil(dailyHours * 0.6) : Math.floor(dailyHours * 0.5) || 1;
        
        dayTasks.push({
          id: `task_${dateStr}_${taskIdCounter++}`,
          time: studyTimeStr,
          title: `Learn: ${primaryStudy.section} - ${primaryStudy.subtopic}`,
          category: primaryStudy.section,
          details: `Read theory, solve 10 practice questions. Focus: ${primaryStudy.topic}. (Allocated: ${primaryHours} hrs)`,
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

        dayTasks.push({
          id: `task_${dateStr}_${taskIdCounter++}`,
          time: secondaryTimeStr,
          title: `Practice: ${secondarySection} - ${randomSub}`,
          category: secondarySection,
          details: `Solve 5 standard difficulty problems. (Allocated: ${secondaryHours} hrs)`,
          completed: false,
          referenceSubtopic: randomSub,
          referenceSection: secondarySection
        });

        // If daily hours are high, add an extra quick reading / logic practice task
        if (dailyHours >= 4) {
          dayTasks.push({
            id: `task_${dateStr}_${taskIdCounter++}`,
            time: "08:00 PM",
            title: "Verbal Drill: 1 RC Passage + 2 Parajumbles",
            category: "VARC",
            details: "Read an article (Aeon/The Hindu) and solve 1 RC and 2 PJ questions. (Allocated: 1 hr)",
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
