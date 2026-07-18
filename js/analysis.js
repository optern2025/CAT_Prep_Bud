// CAT Prep Buddy Mock & Sectional Pattern Analyzer
window.CAT_ANALYSIS = {
  // Add a mock or sectional record
  addMockRecord: function(mock) {
    const mocks = JSON.parse(localStorage.getItem('cat_mocks') || '[]');
    mock.id = mock.id || 'mock_' + Date.now();
    mocks.push(mock);
    localStorage.setItem('cat_mocks', JSON.stringify(mocks));
    
    // Proactively refresh KPI statistics
    if (window.CAT_KPI) {
      window.CAT_KPI.initCharts();
    }
  },

  // Automatically analyze and log a practice drill once completed
  autoLogPracticeSession: function(subtopic, section, attemptedQuestions, answers) {
    let correctCount = 0;
    let incorrectCount = 0;
    let score = 0;
    const errorsBreakdown = { conceptual: 0, silly: 0, time: 0, guessed: 0 };
    
    // Standard error category mapping for automated mocks
    // Users will select these, or we allocate a default
    attemptedQuestions.forEach(q => {
      const userAnswer = answers[q.id];
      const isCorrect = userAnswer === q.correctAnswer;
      
      if (isCorrect) {
        correctCount++;
        score += 3; // CAT MCQ/TITA correct
      } else {
        incorrectCount++;
        if (q.type === 'MCQ') {
          score -= 1; // Negative marking for MCQs
        }
        
        // Push this directly to the Error Notebook
        const userErrCat = q.userErrorCategory || (q.difficulty === 'CAT Level' || q.difficulty === 'Advanced' ? 'Conceptual' : 'Silly Mistake');
        
        if (userErrCat === 'Conceptual') errorsBreakdown.conceptual++;
        else if (userErrCat === 'Silly Mistake') errorsBreakdown.silly++;
        else if (userErrCat === 'Time Pressure') errorsBreakdown.time++;
        else errorsBreakdown.guessed++;

        window.CAT_ERRORBOOK.addError({
          section: section,
          topic: q.topic,
          subtopic: subtopic,
          question: q.question,
          yourAnswer: userAnswer || "Unanswered",
          correctAnswer: q.correctAnswer,
          errorCategory: userErrCat,
          learningPoint: `Identified during ${subtopic} practice drill. Solutions: ${q.explanation.replace(/<[^>]*>/g, '')}`,
          dateAdded: new Date().toISOString().split('T')[0]
        });
      }
    });

    const accuracy = attemptedQuestions.length > 0 ? Math.round((correctCount / attemptedQuestions.length) * 100) : 0;
    
    // Approximate percentile based on accuracy
    let calculatedPercentile = 50;
    if (accuracy >= 90) calculatedPercentile = 99.2;
    else if (accuracy >= 75) calculatedPercentile = 95.5;
    else if (accuracy >= 50) calculatedPercentile = 85.0;
    else if (accuracy >= 25) calculatedPercentile = 60.0;

    // Generate personalized Action Item
    let actionItem = "";
    if (accuracy < 50) {
      actionItem = `Critical: Conceptual clarity needed in ${subtopic}. Re-read formulas and attempt Easy/Moderate questions again before trying Advanced items.`;
    } else if (accuracy < 80) {
      actionItem = `Moderate: Strengthen speed in ${subtopic}. Solve 10 more sectional problems. Work on reducing Silly Mistakes.`;
    } else {
      actionItem = `Excellent: Mastered ${subtopic} with ${accuracy}% accuracy. Ready for full-mock application. Keep it up!`;
    }

    // Prepare mock log payload
    const mockRecord = {
      id: 'practice_' + Date.now(),
      name: `${subtopic} (Drill)`,
      type: "Sectional",
      date: new Date().toISOString().split('T')[0],
      qaScore: section === 'QA' ? score : null,
      dilrScore: section === 'DILR' ? score : null,
      varcScore: section === 'VARC' ? score : null,
      totalScore: score,
      percentile: calculatedPercentile,
      errors: errorsBreakdown,
      actionItems: actionItem
    };

    this.addMockRecord(mockRecord);
    return mockRecord;
  },

  // Perform diagnostic pattern analysis across all mock records
  analyzePatterns: function() {
    const mocks = JSON.parse(localStorage.getItem('cat_mocks') || '[]');
    if (mocks.length === 0) {
      return {
        hasData: false,
        summary: "No mocks or sectionals attempted yet. Start practicing or log a mock to see your pattern diagnostics.",
        warnings: [],
        strengths: [],
        actionPlan: []
      };
    }

    let totalConceptual = 0;
    let totalSilly = 0;
    let totalTime = 0;
    let totalGuessed = 0;
    
    let totalScoreQA = 0, countQA = 0;
    let totalScoreDILR = 0, countDILR = 0;
    let totalScoreVARC = 0, countVARC = 0;

    mocks.forEach(m => {
      if (m.errors) {
        totalConceptual += (m.errors.conceptual || 0);
        totalSilly += (m.errors.silly || 0);
        totalTime += (m.errors.time || 0);
        totalGuessed += (m.errors.guessed || 0);
      }
      if (m.qaScore !== null && m.qaScore !== undefined) { totalScoreQA += m.qaScore; countQA++; }
      if (m.dilrScore !== null && m.dilrScore !== undefined) { totalScoreDILR += m.dilrScore; countDILR++; }
      if (m.varcScore !== null && m.varcScore !== undefined) { totalScoreVARC += m.varcScore; countVARC++; }
    });

    const totalErrors = totalConceptual + totalSilly + totalTime + totalGuessed;
    const warnings = [];
    const strengths = [];
    const actionPlan = [];

    // Analyze error distribution
    if (totalErrors > 0) {
      const sillyPercentage = (totalSilly / totalErrors) * 100;
      const conceptualPercentage = (totalConceptual / totalErrors) * 100;
      const timePercentage = (totalTime / totalErrors) * 100;

      if (sillyPercentage > 35) {
        warnings.push(`High rate of Silly Mistakes (${Math.round(sillyPercentage)}% of errors). This indicates rushing or skipping verification checks.`);
        actionPlan.push("Develop a 'double-check' habit for simple calculation steps, particularly in QA.");
      }
      if (conceptualPercentage > 40) {
        warnings.push(`Conceptual Gaps detected (${Math.round(conceptualPercentage)}% of errors). You are attempting advanced topics without solid foundations.`);
        actionPlan.push("Halt taking intensive tests for a week. Revisit theory notes for topics where accuracy is below 60%.");
      }
      if (timePercentage > 30) {
        warnings.push(`Time Pressure constraints (${Math.round(timePercentage)}% of errors). You are spending excessive time on difficult questions, leading to a scramble in the end.`);
        actionPlan.push("Implement the 'Two-Round Strategy': Skip any question that takes >2 minutes on first read. Return to them in round two.");
      }
    }

    // Analyze section scores
    const avgQA = countQA > 0 ? (totalScoreQA / countQA) : 0;
    const avgDILR = countDILR > 0 ? (totalScoreDILR / countDILR) : 0;
    const avgVARC = countVARC > 0 ? (totalScoreVARC / countVARC) : 0;

    // Identify weak and strong sections
    const averages = [
      { section: 'Quantitative Aptitude (QA)', avg: avgQA },
      { section: 'Data Interpretation & LR (DILR)', avg: avgDILR },
      { section: 'Verbal Ability & RC (VARC)', avg: avgVARC }
    ];

    averages.sort((a, b) => b.avg - a.avg);
    
    if (averages[0].avg > 15) {
      strengths.push(`${averages[0].section} is currently your strongest section, averaging ${Math.round(averages[0].avg)} marks.`);
    } else {
      strengths.push("Establishing base performance. Focus on core topics to build your first strong section.");
    }

    const weakest = averages[averages.length - 1];
    if (weakest.avg < 15 && (countQA || countDILR || countVARC)) {
      warnings.push(`Vulnerable in ${weakest.section}, averaging only ${Math.round(weakest.avg)} marks per attempt.`);
      actionPlan.push(`Dedicate the first 2 hours of your daily study block exclusively to ${weakest.section.split(' ')[0]}.`);
    }

    // Default actions if list is short
    if (actionPlan.length === 0) {
      actionPlan.push("Continue standard syllabus progression. Practice at least 2 DILR sets and 2 RCs daily.");
      actionPlan.push("Maintain a mock frequency of 1 exam every Saturday, followed by Sunday analysis.");
    }

    return {
      hasData: true,
      summary: `Analyzed over ${mocks.length} attempts. Main error driver is ${
        totalSilly >= totalConceptual && totalSilly >= totalTime ? 'Silly Mistakes' :
        totalConceptual >= totalSilly && totalConceptual >= totalTime ? 'Conceptual gaps' : 'Time management'
      }.`,
      warnings: warnings,
      strengths: strengths,
      actionPlan: actionPlan
    };
  }
};
