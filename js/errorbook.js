// CAT Prep Buddy Error Notebook Manager
window.CAT_ERRORBOOK = {
  // Retrieve list of errors
  getErrors: function() {
    return JSON.parse(localStorage.getItem('cat_errors') || '[]');
  },

  // Save errors array
  saveErrors: function(errors) {
    localStorage.setItem('cat_errors', JSON.stringify(errors));
  },

  // Log a new error
  addError: function(err) {
    const errors = this.getErrors();
    
    // Check if error already logged (prevent duplicate entries of same question)
    const isDuplicate = errors.some(e => e.question === err.question);
    if (isDuplicate) return;

    err.id = err.id || 'err_' + Date.now();
    err.resolved = false;
    err.attempts = err.attempts || 0;
    err.resolvedAttempts = err.resolvedAttempts || 0;
    errors.push(err);
    this.saveErrors(errors);
  },

  // Delete an error from the notebook
  deleteError: function(id) {
    let errors = this.getErrors();
    errors = errors.filter(e => e.id !== id);
    this.saveErrors(errors);
  },

  // Attempt to resolve an error question
  attemptError: function(id, userAnswer) {
    const errors = this.getErrors();
    const errorIndex = errors.findIndex(e => e.id === id);
    
    if (errorIndex === -1) return null;

    const error = errors[errorIndex];
    error.attempts = (error.attempts || 0) + 1;
    
    const isCorrect = userAnswer.trim().toLowerCase() === error.correctAnswer.trim().toLowerCase();
    
    if (isCorrect) {
      error.resolvedAttempts = (error.resolvedAttempts || 0) + 1;
      // If correct, let's mark it as resolved
      error.resolved = true;
    } else {
      error.resolved = false;
    }

    errors[errorIndex] = error;
    this.saveErrors(errors);
    
    return {
      correct: isCorrect,
      correctAnswer: error.correctAnswer,
      explanation: error.learningPoint
    };
  },

  // Re-open an error (mark unresolved)
  resetErrorStatus: function(id) {
    const errors = this.getErrors();
    const errorIndex = errors.findIndex(e => e.id === id);
    if (errorIndex !== -1) {
      errors[errorIndex].resolved = false;
      this.saveErrors(errors);
    }
  }
};
