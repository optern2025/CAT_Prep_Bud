// CAT Prep Buddy Revision Hub System
window.CAT_REVISION = {
  // Generate dynamically tailored Sunday revision checklists
  getSundayRevisionList: function() {
    const syllabusProgress = JSON.parse(localStorage.getItem('cat_syllabus_progress') || '{}');
    const syllabusConfidence = JSON.parse(localStorage.getItem('cat_syllabus_confidence') || '{}');
    const errors = window.CAT_ERRORBOOK.getErrors();
    const unresolvedErrors = errors.filter(e => !e.resolved);

    // Identify weak subtopics (Confidence is 'Low' or progress is 'In Progress')
    const weakSubtopics = [];
    const sections = ['QA', 'DILR', 'VARC'];
    
    sections.forEach(sec => {
      const topics = window.CAT_SYLLABUS[sec].topics;
      for (let topicName in topics) {
        topics[topicName].forEach(sub => {
          const progress = syllabusProgress[sub] || 'Not Started';
          const confidence = syllabusConfidence[sub] || 'Medium';
          
          if (confidence === 'Low' || progress === 'In Progress') {
            weakSubtopics.push({ section: sec, subtopic: sub, confidence: confidence, progress: progress });
          }
        });
      }
    });

    const checklist = [
      { id: 'rev_mock', text: "Analyze yesterday's Saturday mock exam (Review skipped and wrong answers).", category: "Mock Review", completed: false },
      { id: 'rev_formula', text: "Revise core formulas: Arithmetic percentages, SI/CI, Algebra progressions, and Geometry properties.", category: "Formulas", completed: false }
    ];

    // Dynamically insert active errors checklist item
    if (unresolvedErrors.length > 0) {
      checklist.push({
        id: 'rev_errors',
        text: `Re-attempt at least 3 questions from your Error Notebook (Current active errors: ${unresolvedErrors.length}).`,
        category: "Error Notebook",
        completed: false
      });
    } else {
      checklist.push({
        id: 'rev_errors',
        text: "Error Notebook is clean! Review past resolved items to keep them fresh.",
        category: "Error Notebook",
        completed: true // Pre-completed since no active errors
      });
    }

    // Dynamically insert weak subtopics items (up to 3 items)
    if (weakSubtopics.length > 0) {
      // Pick up to 3 weak items
      const itemsToReview = weakSubtopics.slice(0, 3);
      itemsToReview.forEach((item, index) => {
        checklist.push({
          id: `rev_weak_${index}`,
          text: `Revisit weak subtopic: [${item.section}] ${item.subtopic} (${item.confidence === 'Low' ? 'Low Confidence' : 'In Progress'}).`,
          category: "Syllabus Revisit",
          completed: false,
          referenceSubtopic: item.subtopic
        });
      });
    } else {
      checklist.push({
        id: 'rev_weak_none',
        text: "All studied syllabus subtopics are at High/Medium confidence. Excellent work!",
        category: "Syllabus Revisit",
        completed: true
      });
    }

    // Add a general speed drill
    checklist.push({ id: 'rev_drill', text: "Take a 15-minute high-speed sectional drill on your weakest area.", category: "Speed Drill", completed: false });

    return checklist;
  },

  // Generate monthly checklist
  getMonthlyRevisionList: function() {
    const mocks = JSON.parse(localStorage.getItem('cat_mocks') || '[]');
    const errors = window.CAT_ERRORBOOK.getErrors();
    const resolvedErrors = errors.filter(e => e.resolved);

    const checklist = [
      { id: 'm_rev_trend', text: "Evaluate Mock Performance Trend lines. Are your scores climbing? Identify plateau triggers.", category: "Strategy", completed: false },
      { id: 'm_rev_purge', text: `Purge resolved Error Notebook questions (Archive/Delete ${resolvedErrors.length} resolved items).`, category: "Maintenance", completed: false },
      { id: 'm_rev_varc', text: "VARC Strategy check: Re-verify passage reading speed. (Target: Read 450 words in under 2.5 minutes).", category: "VARC Focus", completed: false },
      { id: 'm_rev_dilr', text: "DILR Strategy check: Review selection speed. Did you pick the easiest sets first in your last 3 mocks?", category: "DILR Focus", completed: false },
      { id: 'm_rev_qa', text: "QA Speed Test: Attempt 20 mixed Algebra & Geometry questions with a strict 30-minute timer.", category: "QA Focus", completed: false }
    ];

    return checklist;
  }
};
