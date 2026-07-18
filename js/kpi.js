// CAT Prep Buddy Weekly KPI & Chart Manager
window.CAT_KPI = {
  charts: {},

  // Aggregate user statistics
  getStats: function() {
    const mocks = JSON.parse(localStorage.getItem('cat_mocks') || '[]');
    const errors = JSON.parse(localStorage.getItem('cat_errors') || '[]');
    const practiceHistory = JSON.parse(localStorage.getItem('cat_practice_history') || '[]');
    const syllabusProgress = JSON.parse(localStorage.getItem('cat_syllabus_progress') || '{}');

    // Questions attempted: practice history + mocks
    let totalPracticed = practiceHistory.length;
    let totalCorrect = practiceHistory.filter(p => p.correct).length;
    
    let rcCount = practiceHistory.filter(p => p.subtopic && p.subtopic.toLowerCase().includes('comprehension')).length;
    let dilrSets = practiceHistory.filter(p => p.section === 'DILR').length;

    // Add mock questions count (QA = 22, DILR = 20, VARC = 24 total 66 per mock)
    mocks.forEach(m => {
      // If it is a full mock, add 66 questions. If sectional, add 22.
      if (m.type === 'Full Mock') {
        totalPracticed += 66;
        // Estimate correct questions based on scores (roughly: Score = 3*Correct - Incorrect, so correct = (Score + Incorrect)/3. Let's make an approximation)
        const estCorrect = Math.round((m.qaScore || 0) / 3 + (m.dilrScore || 0) / 3 + (m.varcScore || 0) / 3 + 10);
        totalCorrect += Math.max(0, Math.min(66, estCorrect));
        
        rcCount += 4; // Approx 4 RCs per full mock
        dilrSets += 4; // Approx 4 DILR sets per full mock
      } else {
        totalPracticed += 22;
        const estCorrect = Math.round((m.totalScore || 0) / 3 + 3);
        totalCorrect += Math.max(0, Math.min(22, estCorrect));
        if (m.varcScore) rcCount += 4;
        if (m.dilrScore) dilrSets += 4;
      }
    });

    const accuracy = totalPracticed > 0 ? Math.round((totalCorrect / totalPracticed) * 100) : 0;

    // Syllabus counts
    let totalSubtopics = 0;
    let completedSubtopics = 0;
    let inProgressSubtopics = 0;

    const sections = ['QA', 'DILR', 'VARC'];
    sections.forEach(sec => {
      const topics = window.CAT_SYLLABUS[sec].topics;
      for (let topicName in topics) {
        topics[topicName].forEach(sub => {
          totalSubtopics++;
          const progress = syllabusProgress[sub] || 'Not Started';
          if (progress === 'Completed') completedSubtopics++;
          else if (progress === 'In Progress') inProgressSubtopics++;
        });
      });
    });

    return {
      totalAttempted: totalPracticed,
      accuracy: accuracy,
      rcCount: rcCount,
      dilrSets: dilrSets,
      mocksCount: mocks.length,
      syllabus: {
        total: totalSubtopics,
        completed: completedSubtopics,
        inProgress: inProgressSubtopics,
        notStarted: totalSubtopics - completedSubtopics - inProgressSubtopics,
        percentage: totalSubtopics > 0 ? Math.round((completedSubtopics / totalSubtopics) * 100) : 0
      }
    };
  },

  // Initialize KPI charts
  initCharts: function() {
    const stats = this.getStats();
    
    // Destroy previous instances to prevent overlays
    this.destroyCharts();

    // 1. Mock Performance Trend Chart
    const trendCtx = document.getElementById('mockTrendChart');
    if (trendCtx) {
      const mocks = JSON.parse(localStorage.getItem('cat_mocks') || '[]');
      // Sort by date
      mocks.sort((a, b) => new Date(a.date) - new Date(b.date));
      
      const labels = mocks.map(m => m.name);
      const percentiles = mocks.map(m => m.percentile || 0);
      const scores = mocks.map(m => m.totalScore || 0);

      this.charts.trend = new Chart(trendCtx.getContext('2d'), {
        type: 'line',
        data: {
          labels: labels.length > 0 ? labels : ["No Mocks Logged"],
          datasets: [
            {
              label: 'Percentile',
              data: percentiles.length > 0 ? percentiles : [0],
              borderColor: '#4f46e5',
              backgroundColor: 'rgba(79, 70, 229, 0.1)',
              yAxisID: 'y-percentile',
              tension: 0.3,
              fill: true,
              borderWidth: 2
            },
            {
              label: 'Total Score',
              data: scores.length > 0 ? scores : [0],
              borderColor: '#10b981',
              backgroundColor: 'rgba(16, 185, 129, 0.05)',
              yAxisID: 'y-score',
              tension: 0.3,
              fill: false,
              borderWidth: 2,
              borderDash: [5, 5]
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'top' }
          },
          scales: {
            'y-percentile': {
              type: 'linear',
              position: 'left',
              min: 0,
              max: 100,
              title: { display: true, text: 'Percentile (%)', color: '#4f46e5' },
              grid: { drawOnChartArea: true }
            },
            'y-score': {
              type: 'linear',
              position: 'right',
              min: 0,
              max: 198, // CAT Max Score is 198
              title: { display: true, text: 'Score', color: '#10b981' },
              grid: { drawOnChartArea: false }
            }
          }
        }
      });
    }

    // 2. Error Categorization Chart
    const errorCtx = document.getElementById('errorCategoryChart');
    if (errorCtx) {
      const mocks = JSON.parse(localStorage.getItem('cat_mocks') || '[]');
      const errors = JSON.parse(localStorage.getItem('cat_errors') || '[]');
      
      let conceptual = 0;
      let silly = 0;
      let time = 0;
      let guessed = 0;

      // Add errors from mock analysis logs
      mocks.forEach(m => {
        if (m.errors) {
          conceptual += (m.errors.conceptual || 0);
          silly += (m.errors.silly || 0);
          time += (m.errors.time || 0);
          guessed += (m.errors.guessed || 0);
        }
      });

      // Add errors from individual error notebook logs
      errors.forEach(e => {
        const cat = e.errorCategory || 'Other';
        if (cat.toLowerCase().includes('concept')) conceptual++;
        else if (cat.toLowerCase().includes('silly') || cat.toLowerCase().includes('careless')) silly++;
        else if (cat.toLowerCase().includes('time') || cat.toLowerCase().includes('speed')) time++;
        else if (cat.toLowerCase().includes('guess')) guessed++;
      });

      const totalErrors = conceptual + silly + time + guessed;

      this.charts.errors = new Chart(errorCtx.getContext('2d'), {
        type: 'doughnut',
        data: {
          labels: ['Conceptual', 'Silly Mistakes', 'Time Pressure', 'Guessed / Unsure'],
          datasets: [{
            data: totalErrors > 0 ? [conceptual, silly, time, guessed] : [1, 1, 1, 1],
            backgroundColor: ['#f59e0b', '#f43f5e', '#3b82f6', '#94a3b8'],
            borderWidth: 2,
            borderColor: '#ffffff'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'bottom' }
          },
          cutout: '60%'
        }
      });
    }

    // 3. Syllabus Tracker Progress Chart
    const syllabusCtx = document.getElementById('syllabusProgressChart');
    if (syllabusCtx) {
      this.charts.syllabus = new Chart(syllabusCtx.getContext('2d'), {
        type: 'bar',
        data: {
          labels: ['Syllabus Topics'],
          datasets: [
            {
              label: 'Completed',
              data: [stats.syllabus.completed],
              backgroundColor: '#10b981'
            },
            {
              label: 'In Progress',
              data: [stats.syllabus.inProgress],
              backgroundColor: '#f59e0b'
            },
            {
              label: 'Not Started',
              data: [stats.syllabus.notStarted],
              backgroundColor: '#e2e8f0'
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          indexAxis: 'y',
          plugins: {
            legend: { position: 'bottom' }
          },
          scales: {
            x: { stacked: true, max: stats.syllabus.total, display: false },
            y: { stacked: true, display: false }
          }
        }
      });
    }
  },

  destroyCharts: function() {
    for (let key in this.charts) {
      if (this.charts[key]) {
        this.charts[key].destroy();
      }
    }
    this.charts = {};
  }
};
