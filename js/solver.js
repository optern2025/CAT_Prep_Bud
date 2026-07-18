// CAT Prep Buddy AI Problem Solver Module
window.CAT_SOLVER = {
  // Preloaded Sample Files content
  SAMPLES: {
    "percentages_trap.txt": "QUESTION: The price of a commodity increases by 40%. By what percentage must a household reduce its consumption so that the total expenditure remains unchanged?",
    "venn_diagram_set.txt": "QUESTION: In a survey of 120 sports enthusiasts, 75 play Cricket, 60 play Football, and 45 play Tennis. 30 play both Cricket and Football, 25 play Football and Tennis, and 20 play Cricket and Tennis. If 12 play all three games, how many enthusiasts play exactly two games?",
    "logarithms_equation.txt": "QUESTION: Solve for x: log_2(x) + log_2(x - 6) = 4. What are the real roots of this equation?"
  },

  // Solver logic: analyzes keyword matches or dynamically structures generic question solutions
  solveQuestion: function(text) {
    const query = text.toLowerCase();
    
    // 1. Check for Percentages / Successive Changes
    if (query.includes("percent") || query.includes("price") || query.includes("consumption") || query.includes("expenditure")) {
      return {
        topic: "Arithmetic - Percentages & Proportions",
        shortcut: "<b>🚀 The 100-Percentiler Shortcut (Solve in 20s):</b><br>" +
                  "Use the Product Consistency Rule: Price × Consumption = Expenditure.<br>" +
                  "If Price increases by 40% (ratio increases from 5 to 7, i.e., +2/5), " +
                  "Consumption must decrease by 2 / (5 + 2) = 2/7 to keep expenditure constant.<br>" +
                  "2/7 in percentage = <b>28.57%</b>. No formulas needed, just fraction scaling!",
        conventional: "<b>📝 Conventional Formulaic Solution:</b><br>" +
                      "Let initial price = Rs. 100, consumption = 100 units. Initial Expenditure = 100 × 100 = 10,000.<br>" +
                      "New Price = Rs. 140. New Consumption = C. New Expenditure = 14,000 × C / 100 = 10,000.<br>" +
                      "=> 140 × C = 10,000 => C = 10,000 / 140 = 71.43 units.<br>" +
                      "Reduction in consumption = 100 - 71.43 = <b>28.57%</b>.",
        trap: "<b>⚠️ The Examiner Trap:</b><br>" +
              "Students often think: 'If price increases by 40%, we must decrease consumption by 40% to balance.' This is a classic trap. " +
              "The base changes from 100 to 140. Always scale the denominator!",
        strategy: "<b>⏱️ Time & Round Strategy:</b><br>" +
                  "<b>Round 1 (Absolute Must-Solve).</b> This is a standard formula-free question. Should take under 45 seconds."
      };
    }

    // 2. Check for Venn Diagram / Set Theory
    if (query.includes("venn") || query.includes("survey") || query.includes("play") || query.includes("cricket") || query.includes("three")) {
      return {
        topic: "Modern Math - Set Theory (3-Variables)",
        shortcut: "<b>🚀 The 100-Percentiler Shortcut (Solve in 45s):</b><br>" +
                  "Apply the standard 3-set cardinal equations:<br>" +
                  "Let Exactly 1 game = I, Exactly 2 games = II, Exactly 3 games = III.<br>" +
                  "Formula 1: I + II + III = Total - Neither. (If Neither is 0, then 120)<br>" +
                  "Formula 2: I + 2*II + 3*III = Sum of singles (75 + 60 + 45 = 180)<br>" +
                  "Formula 3: II + 3*III = Sum of doubles (30 + 25 + 20 = 75)<br>" +
                  "Given III (all three) = 12.<br>" +
                  "From Formula 3: II + 3(12) = 75 => II + 36 = 75 => II = <b>39</b>.<br>" +
                  "Exactly two games = <b>39</b>. You don't even need to draw the Venn circles!",
        conventional: "<b>📝 Conventional Formulaic Solution:</b><br>" +
                      "Draw three intersecting circles: Cricket (C), Football (F), Tennis (T).<br>" +
                      "Start from center: C ∩ F ∩ T = 12.<br>" +
                      "Only C ∩ F = (C ∩ F) - Center = 30 - 12 = 18.<br>" +
                      "Only F ∩ T = 25 - 12 = 13.<br>" +
                      "Only C ∩ T = 20 - 12 = 8.<br>" +
                      "Total playing exactly two games = (Only C ∩ F) + (Only F ∩ T) + (Only C ∩ T)<br>" +
                      "=> 18 + 13 + 8 = <b>39</b>.",
        trap: "<b>⚠️ The Examiner Trap:</b><br>" +
              "Pay close attention to wording! '30 play Cricket and Football' refers to the entire intersection (including all three). " +
              "If it says '30 play <i>only</i> Cricket and Football', do not subtract the center 12. Skipping this check is the #1 DILR mistake.",
        strategy: "<b>⏱️ Time & Round Strategy:</b><br>" +
                  "<b>Round 2 (Standard Puzzle).</b> Venn diagram calculation sets are highly scoring but require drawing accuracy. " +
                  "Do not rush this in Round 1 if the values are nested."
      };
    }

    // 3. Check for Logarithms
    if (query.includes("log") || query.includes("equation") || query.includes("roots")) {
      return {
        topic: "Algebra - Logarithmic Equations",
        shortcut: "<b>🚀 The 100-Percentiler Shortcut (Solve in 30s):</b><br>" +
                  "Instead of solving the quadratic, plug in the options directly! <br>" +
                  "Look at log_2(x - 6). For x - 6 to be positive, x must be > 6. This eliminates any options <= 6.<br>" +
                  "Let's test x = 8: log_2(8) + log_2(8 - 6) = 3 + log_2(2) = 3 + 1 = 4. Satisfies immediately!<br>" +
                  "Root is <b>x = 8</b>. Plugging numbers is twice as fast as quadratic factorization.",
        conventional: "<b>📝 Conventional Formulaic Solution:</b><br>" +
                      "log_2(x) + log_2(x - 6) = 4<br>" +
                      "=> log_2(x(x - 6)) = 4<br>" +
                      "=> x(x - 6) = 2^4 = 16<br>" +
                      "=> x^2 - 6x - 16 = 0<br>" +
                      "=> (x - 8)(x + 2) = 0<br>" +
                      "=> x = 8 or x = -2.<br>" +
                      "However, log_2(x) is only defined for x > 0 and x - 6 > 0 (x > 6). Therefore, x = -2 is extraneous.<br>" +
                      "Real root: <b>x = 8</b>.",
        trap: "<b>⚠️ The Examiner Trap:</b><br>" +
              "Failing to check the domain boundary! The quadratic equation yields x = -2 as a root, and the examiner will definitely include -2 in the options. " +
              "Always substitute roots back into the original logs to ensure inputs remain strictly positive (> 0).",
        strategy: "<b>⏱️ Time & Round Strategy:</b><br>" +
                  "<b>Round 1.</b> Log equations are quick to solve. If you check domain bounds first, you can eliminate options instantly."
      };
    }

    // 4. Fallback Generic Solver (Structured parsing)
    return {
      topic: "General CAT Aptitude Check",
      shortcut: "<b>🚀 The 100-Percentiler Shortcut (Solve in 45s):</b><br>" +
                "Try substituting simple values (0, 1, 2, or 100 for percentages) or use options back-substitution. " +
                "In CAT, 40% of multiple-choice algebra can be solved purely by substituting values and eliminating extreme options.",
      conventional: "<b>📝 Conventional Formulaic Solution:</b><br>" +
                    "1. Translate word constraints into algebraic symbols.<br>" +
                    "2. Set up boundary conditions (domain, integer constraints).<br>" +
                    "3. Solve sequentially, verifying calculation signs at each step.",
      trap: "<b>⚠️ The Examiner Trap:</b><br>" +
            "Look out for constraints like 'x is a positive integer' or 'distinct roots'. If you miss these qualifiers, " +
            "you will calculate correct mathematical roots that violate the logical constraints of the question.",
      strategy: "<b>⏱️ Time & Round Strategy:</b><br>" +
                "Analyze the question length. If it takes more than 3 lines of reading, park it for <b>Round 2</b>. " +
                "Never spend more than 2 minutes on a single question in the first pass."
    };
  }
};
