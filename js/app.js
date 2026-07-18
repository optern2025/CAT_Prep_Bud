// CAT Prep Buddy Main Application Controller
document.addEventListener('DOMContentLoaded', function() {
  window.CAT_APP = {
    // 1. Initial State Setup
    init: function() {
      // Seed default storage databases if not already present
      if (!localStorage.getItem('cat_mocks')) {
        localStorage.setItem('cat_mocks', JSON.stringify(window.DEFAULT_MOCKS));
      }
      if (!localStorage.getItem('cat_errors')) {
        localStorage.setItem('cat_errors', JSON.stringify(window.DEFAULT_ERRORS));
      }
      if (!localStorage.getItem('cat_practice_history')) {
        localStorage.setItem('cat_practice_history', JSON.stringify([]));
      }
      if (!localStorage.getItem('cat_syllabus_progress')) {
        localStorage.setItem('cat_syllabus_progress', JSON.stringify({}));
      }
      if (!localStorage.getItem('cat_syllabus_confidence')) {
        localStorage.setItem('cat_syllabus_confidence', JSON.stringify({}));
      }
      if (!localStorage.getItem('cat_registered_exams')) {
        localStorage.setItem('cat_registered_exams', JSON.stringify([]));
      }
      
      this.currentDateStr = "2026-07-18"; // Base system date anchor
      
      if (!localStorage.getItem('cat_scheduler_config')) {
        const defaultConfig = {
          startDate: "2026-07-18",
          examDate: "2026-11-29",
          dailyHours: 3,
          strengths: ["VARC"],
          weaknesses: ["QA"]
        };
        localStorage.setItem('cat_scheduler_config', JSON.stringify(defaultConfig));
        const schedule = window.CAT_SCHEDULER.generateSchedule(defaultConfig);
        localStorage.setItem('cat_daily_schedule', JSON.stringify(schedule));
      }

      // Initialize state variables
      this.activeTest = null;
      this.testTimerInterval = null;
      this.testAnswers = {};
      this.testVisited = {};
      this.testMarked = {};
      this.currentQuestionIndex = 0;

      // Register daily tests for starting date
      this.updateDailyExamsList();

      // Setup Supabase and auth bindings
      this.initSupabaseClient();
      this.bindAuthEvents();

      this.bindNavigation();
      this.bindSharedEvents();
      this.bindSolverEvents();
      this.bindSyllabusTabs();
      this.bindProfileEvents();
      this.initBSchoolPredictor();

      // Check current session state
      this.checkUserSession();
    },

    // ==================== SUPABASE INITIALIZATION & AUTH ====================
    initSupabaseClient: function() {
      // Prioritize keys from supabase-config.js, fallback to localStorage
      const url = window.SUPABASE_CONFIG?.url || localStorage.getItem('cat_supabase_url') || "";
      const anonKey = window.SUPABASE_CONFIG?.anonKey || localStorage.getItem('cat_supabase_key') || "";

      if (url && anonKey) {
        try {
          window.supabaseClient = supabase.createClient(url, anonKey);
          console.log("Supabase Client initialized successfully.");
        } catch (e) {
          console.error("Failed to initialize Supabase client:", e);
        }
      } else {
        console.warn("Supabase connection details missing. Offline mode active.");
      }
    },

    checkUserSession: function() {
      const self = this;
      if (!window.supabaseClient) {
        // Enforce registration locally if offline
        const localSession = localStorage.getItem('cat_local_user_session');
        if (localSession) {
          self.onUserAuthenticated(JSON.parse(localSession));
        } else {
          document.getElementById('authPage').classList.remove('hidden');
          self.authMode = 'register';
          self.updateAuthUI();
        }
        return;
      }

      window.supabaseClient.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          self.onUserAuthenticated(session.user);
        } else {
          document.getElementById('authPage').classList.remove('hidden');
          self.authMode = 'register';
          self.updateAuthUI();
        }
      });
    },

    bindAuthEvents: function() {
      const self = this;
      this.authMode = 'register'; // Default is Register first

      const tabRegister = document.getElementById('tabRegister');
      const tabLogin = document.getElementById('tabLogin');
      const btnSubmit = document.getElementById('btnSubmitAuth');

      if (tabRegister) {
        tabRegister.addEventListener('click', () => {
          self.authMode = 'register';
          self.updateAuthUI();
        });
      }

      if (tabLogin) {
        tabLogin.addEventListener('click', () => {
          self.authMode = 'login';
          self.updateAuthUI();
        });
      }

      if (btnSubmit) {
        btnSubmit.addEventListener('click', () => {
          self.handleAuthAction(self.authMode);
        });
      }
    },

    updateAuthUI: function() {
      const tabRegister = document.getElementById('tabRegister');
      const tabLogin = document.getElementById('tabLogin');
      const confirmGroup = document.getElementById('confirmPassGroup');
      const btnSubmit = document.getElementById('btnSubmitAuth');
      const subtitle = document.getElementById('authSubtitle');
      const statusMsg = document.getElementById('authStatusMsg');

      if (statusMsg) statusMsg.innerText = '';

      if (this.authMode === 'register') {
        if (tabRegister) {
          tabRegister.style.color = 'white';
          tabRegister.style.borderBottom = '2px solid var(--color-indigo)';
        }
        if (tabLogin) {
          tabLogin.style.color = 'var(--text-muted)';
          tabLogin.style.borderBottom = '2px solid transparent';
        }
        if (confirmGroup) confirmGroup.style.display = 'block';
        if (btnSubmit) btnSubmit.innerText = 'Register & Access Prep Portal';
        if (subtitle) subtitle.innerText = 'Aspirant Registration Gate';
      } else {
        if (tabRegister) {
          tabRegister.style.color = 'var(--text-muted)';
          tabRegister.style.borderBottom = '2px solid transparent';
        }
        if (tabLogin) {
          tabLogin.style.color = 'white';
          tabLogin.style.borderBottom = '2px solid var(--color-indigo)';
        }
        if (confirmGroup) confirmGroup.style.display = 'none';
        if (btnSubmit) btnSubmit.innerText = 'Log In & Access Prep Portal';
        if (subtitle) subtitle.innerText = 'Aspirant Login Gate';
      }
    },

    handleAuthAction: function(mode) {
      const self = this;
      const email = document.getElementById('authEmail').value.trim();
      const password = document.getElementById('authPassword').value;
      const confirmPass = document.getElementById('authConfirmPassword')?.value;
      const statusMsg = document.getElementById('authStatusMsg');
      const btnSubmit = document.getElementById('btnSubmitAuth');

      if (statusMsg) statusMsg.innerText = '';

      if (!email || !password) {
        if (statusMsg) statusMsg.innerText = "Please enter both email and password.";
        return;
      }

      if (mode === 'register' && password !== confirmPass) {
        if (statusMsg) statusMsg.innerText = "Passwords do not match.";
        return;
      }

      if (btnSubmit) btnSubmit.disabled = true;

      // Local Fallback simulation when no client exists
      if (!window.supabaseClient) {
        setTimeout(() => {
          if (btnSubmit) btnSubmit.disabled = false;
          let users = JSON.parse(localStorage.getItem('cat_local_users') || '{}');

          if (mode === 'register') {
            if (users[email]) {
              if (statusMsg) statusMsg.innerText = "Email already registered. Try logging in.";
              return;
            }
            users[email] = password;
            localStorage.setItem('cat_local_users', JSON.stringify(users));

            const localUser = { email, id: 'local_' + Date.now() };
            localStorage.setItem('cat_local_user_session', JSON.stringify(localUser));
            
            // Seed profile
            localStorage.setItem('cat_user_profile_details', JSON.stringify({ name: "", email: email, dob: "", workEx: "", field: "Engineering", targetPct: "99.00" }));

            alert("Registration successful! Entering offline session.");
            self.onUserAuthenticated(localUser);
          } else {
            // Login mode
            if (users[email] && users[email] === password) {
              const localUser = { email, id: 'local_' + Date.now() };
              localStorage.setItem('cat_local_user_session', JSON.stringify(localUser));
              self.onUserAuthenticated(localUser);
            } else {
              if (statusMsg) statusMsg.innerText = "Invalid credentials. Please register first.";
            }
          }
        }, 600);
        return;
      }

      // Supabase cloud handling
      if (mode === 'register') {
        window.supabaseClient.auth.signUp({ email, password })
          .then(({ data, error }) => {
            if (btnSubmit) btnSubmit.disabled = false;
            if (error) {
              if (statusMsg) statusMsg.innerText = "Sign up failed: " + error.message;
            } else {
              alert("Registration successful! Check your confirmation email.");
              if (data.user) {
                // Seed profile
                localStorage.setItem('cat_user_profile_details', JSON.stringify({ name: "", email: email, dob: "", workEx: "", field: "Engineering", targetPct: "99.00" }));
                self.onUserAuthenticated(data.user);
                self.uploadDataToSupabase(true);
              }
            }
          });
      } else {
        window.supabaseClient.auth.signInWithPassword({ email, password })
          .then(({ data, error }) => {
            if (btnSubmit) btnSubmit.disabled = false;
            if (error) {
              if (statusMsg) statusMsg.innerText = "Login failed: " + error.message;
            } else {
              self.onUserAuthenticated(data.user);
              self.downloadDataFromSupabase(true);
            }
          });
      }
    },

    onUserAuthenticated: function(user) {
      document.getElementById('authPage').classList.add('hidden');
      
      const badge = document.getElementById('syncStatusBadge');
      const modeText = document.getElementById('syncModeText');
      const userText = document.getElementById('syncUserEmail');

      if (userText) userText.innerText = user.email;

      if (!window.supabaseClient) {
        if (badge) {
          badge.innerText = "Offline Mode";
          badge.className = "tag tag-rose";
        }
        if (modeText) modeText.innerText = "Offline (Local-Only)";
      } else {
        if (badge) {
          badge.innerText = "Cloud Synced";
          badge.className = "tag tag-indigo";
        }
        if (modeText) modeText.innerText = "Connected to Supabase";
      }
      
      this.currentUser = user;
      this.switchPage('dashboard');
    },

    // ==================== CLOUD DATABASE SYNC SERVICES ====================
    uploadDataToSupabase: async function(silent) {
      if (!window.supabaseClient || !this.currentUser) {
        if (!silent) alert("Supabase client not active or not logged in.");
        return;
      }

      const uid = this.currentUser.id;
      
      // A. Sync profiles settings
      const name = document.getElementById('profileName').value.trim();
      const email = document.getElementById('profileEmail').value.trim();
      const dob = document.getElementById('profileDOB').value || null;
      const workEx = parseInt(document.getElementById('profileWorkExp').value) || 0;
      const field = document.getElementById('profileFieldOfStudy').value;
      const targetPct = parseFloat(document.getElementById('profileTargetPercentile').value) || 99.0;
      const schedConfig = JSON.parse(localStorage.getItem('cat_scheduler_config') || '{}');
      
      // Save locally
      localStorage.setItem('cat_user_profile_details', JSON.stringify({ name, email, dob, workEx, field, targetPct }));

      await window.supabaseClient.from('user_profiles').upsert({
        id: uid,
        full_name: name,
        email: email,
        dob: dob,
        work_experience: workEx,
        field_of_study: field,
        target_percentile: targetPct,
        daily_hours: schedConfig.dailyHours || 3,
        strengths: schedConfig.strengths || [],
        weaknesses: schedConfig.weaknesses || [],
        exam_date: schedConfig.examDate || '2026-11-29',
        updated_at: new Date()
      });

      // B. Sync syllabus progress
      const progress = JSON.parse(localStorage.getItem('cat_syllabus_progress') || '{}');
      const progressInserts = Object.keys(progress).map(sub => ({
        user_id: uid,
        subtopic: sub,
        status: progress[sub],
        updated_at: new Date()
      }));
      if (progressInserts.length > 0) {
        await window.supabaseClient.from('user_syllabus_progress').upsert(progressInserts);
      }

      // C. Sync syllabus confidence
      const confidence = JSON.parse(localStorage.getItem('cat_syllabus_confidence') || '{}');
      const confidenceInserts = Object.keys(confidence).map(sub => ({
        user_id: uid,
        subtopic: sub,
        confidence: confidence[sub],
        updated_at: new Date()
      }));
      if (confidenceInserts.length > 0) {
        await window.supabaseClient.from('user_syllabus_confidence').upsert(confidenceInserts);
      }

      // D. Sync mocks history (Only upload custom simulated logged attempts)
      const mocks = JSON.parse(localStorage.getItem('cat_mocks') || '[]');
      const simMocks = mocks.filter(m => m.id.startsWith('mock_sim_'));
      const mockInserts = simMocks.map(m => ({
        user_id: uid,
        exam_id: m.examId,
        name: m.name,
        type: m.type,
        date: m.date,
        qa_score: m.qaScore,
        dilr_score: m.dilrScore,
        varc_score: m.varcScore,
        total_score: m.totalScore,
        percentile: m.percentile,
        errors: m.errors || {},
        action_items: m.actionItems || "",
        questions: m.questions || [],
        answers: m.answers || {}
      }));
      
      if (mockInserts.length > 0) {
        // Clear old cloud records to avoid duplicating UUID keys or do individual upserts
        await window.supabaseClient.from('user_mocks').delete().eq('user_id', uid);
        await window.supabaseClient.from('user_mocks').insert(mockInserts);
      }

      // E. Sync error notebook
      const errors = JSON.parse(localStorage.getItem('cat_errors') || '[]');
      const simErrors = errors.filter(e => e.id && !e.id.startsWith('err_1')); // Filter baseline seed
      const errorInserts = simErrors.map(e => ({
        user_id: uid,
        section: e.section,
        topic: e.topic,
        subtopic: e.subtopic,
        question: e.question,
        your_answer: e.yourAnswer,
        correct_answer: e.correctAnswer,
        error_category: e.errorCategory,
        learning_point: e.learningPoint,
        resolved: e.resolved || false,
        date_added: e.dateAdded
      }));

      if (errorInserts.length > 0) {
        await window.supabaseClient.from('user_errors').delete().eq('user_id', uid);
        await window.supabaseClient.from('user_errors').insert(errorInserts);
      }

      if (!silent) {
        alert("Backup complete! All local diagnostics and syllabus statuses saved to Supabase.");
      }
    },

    downloadDataFromSupabase: async function(silent) {
      if (!window.supabaseClient || !this.currentUser) {
        if (!silent) alert("Supabase client not active or not logged in.");
        return;
      }

      const uid = this.currentUser.id;

      // A. Pull Profile config
      const { data: profileData } = await window.supabaseClient
        .from('user_profiles')
        .select('*')
        .eq('id', uid)
        .single();
      
      if (profileData) {
        const profileDetails = {
          name: profileData.full_name || "",
          email: profileData.email || "",
          dob: profileData.dob || "",
          workEx: profileData.work_experience || 0,
          field: profileData.field_of_study || "Engineering",
          targetPct: profileData.target_percentile || 99.0
        };
        localStorage.setItem('cat_user_profile_details', JSON.stringify(profileDetails));

        const config = {
          startDate: "2026-07-18",
          examDate: profileData.exam_date,
          dailyHours: profileData.daily_hours,
          strengths: profileData.strengths || [],
          weaknesses: profileData.weaknesses || []
        };
        localStorage.setItem('cat_scheduler_config', JSON.stringify(config));
        const cal = window.CAT_SCHEDULER.generateSchedule(config);
        localStorage.setItem('cat_daily_schedule', JSON.stringify(cal));

        // Populate fields immediately if user is on Profile tab
        const pName = document.getElementById('profileName');
        if (pName) {
          pName.value = profileDetails.name;
          document.getElementById('profileEmail').value = profileDetails.email;
          document.getElementById('profileDOB').value = profileDetails.dob;
          document.getElementById('profileWorkExp').value = profileDetails.workEx;
          document.getElementById('profileFieldOfStudy').value = profileDetails.field;
          document.getElementById('profileTargetPercentile').value = profileDetails.targetPct;
        }
      }

      // B. Pull Progress
      const { data: progData } = await window.supabaseClient
        .from('user_syllabus_progress')
        .select('subtopic, status')
        .eq('user_id', uid);
      
      if (progData) {
        const store = {};
        progData.forEach(p => { store[p.subtopic] = p.status; });
        localStorage.setItem('cat_syllabus_progress', JSON.stringify(store));
      }

      // C. Pull Confidence
      const { data: confData } = await window.supabaseClient
        .from('user_syllabus_confidence')
        .select('subtopic, confidence')
        .eq('user_id', uid);
      
      if (confData) {
        const store = {};
        confData.forEach(c => { store[c.subtopic] = c.confidence; });
        localStorage.setItem('cat_syllabus_confidence', JSON.stringify(store));
      }

      // D. Pull Mocks (Merge dynamic mock attempts with default baseline mocks)
      const { data: dbMocks } = await window.supabaseClient
        .from('user_mocks')
        .select('*')
        .eq('user_id', uid);
      
      if (dbMocks) {
        const localMocks = [...window.DEFAULT_MOCKS];
        dbMocks.forEach(m => {
          localMocks.push({
            id: m.id,
            examId: m.exam_id,
            name: m.name,
            type: m.type,
            date: m.date,
            qaScore: m.qa_score,
            dilrScore: m.dilr_score,
            varcScore: m.varc_score,
            totalScore: m.total_score,
            percentile: parseFloat(m.percentile),
            errors: m.errors,
            actionItems: m.action_items,
            questions: m.questions,
            answers: m.answers
          });
        });
        localStorage.setItem('cat_mocks', JSON.stringify(localMocks));
      }

      // E. Pull Errors
      const { data: dbErrors } = await window.supabaseClient
        .from('user_errors')
        .select('*')
        .eq('user_id', uid);
      
      if (dbErrors) {
        const localErrors = [...window.DEFAULT_ERRORS];
        dbErrors.forEach(e => {
          localErrors.push({
            id: e.id,
            section: e.section,
            topic: e.topic,
            subtopic: e.subtopic,
            question: e.question,
            yourAnswer: e.your_answer,
            correctAnswer: e.correct_answer,
            errorCategory: e.error_category,
            learningPoint: e.learning_point,
            resolved: e.resolved,
            dateAdded: e.date_added
          });
        });
        localStorage.setItem('cat_errors', JSON.stringify(localErrors));
      }

      // Refresh current page renders
      this.renderDashboard();
      this.renderSyllabusTracker();
      this.renderExecutionSheet();
      this.renderErrorNotebook();
      this.renderMockAnalysis();

      if (!silent) {
        alert("Restoration complete! Cloud databases synced with local storage successfully.");
      }
    },

    // ==================== PROFILE SECTION CONFIGS ====================
    bindProfileEvents: function() {
      const self = this;
      const btnSave = document.getElementById('btnSaveProfileSettings');
      const btnUpload = document.getElementById('btnUploadSync');
      const btnDownload = document.getElementById('btnDownloadSync');
      const btnLogout = document.getElementById('btnUserLogout');

      if (btnSave) {
        btnSave.addEventListener('click', () => {
          const name = document.getElementById('profileName').value.trim();
          const email = document.getElementById('profileEmail').value.trim();
          const dob = document.getElementById('profileDOB').value;
          const workEx = parseInt(document.getElementById('profileWorkExp').value) || 0;
          const field = document.getElementById('profileFieldOfStudy').value;
          const targetPct = parseFloat(document.getElementById('profileTargetPercentile').value) || 99.0;
          const dateVal = document.getElementById('profileExamDate').value;
          const hoursVal = parseFloat(document.getElementById('profileDailyHours').value || 3);
          
          localStorage.setItem('cat_user_profile_details', JSON.stringify({ name, email, dob, workEx, field, targetPct }));
          
          const config = JSON.parse(localStorage.getItem('cat_scheduler_config') || '{}');
          config.examDate = dateVal;
          config.dailyHours = hoursVal;
          
          localStorage.setItem('cat_scheduler_config', JSON.stringify(config));
          const schedule = window.CAT_SCHEDULER.generateSchedule(config);
          localStorage.setItem('cat_daily_schedule', JSON.stringify(schedule));
          
          alert("Preferences updated locally! Starting background cloud sync...");
          self.uploadDataToSupabase(true);
        });
      }

      if (btnUpload) {
        btnUpload.addEventListener('click', () => {
          self.uploadDataToSupabase(false);
        });
      }

      if (btnDownload) {
        btnDownload.addEventListener('click', () => {
          self.downloadDataFromSupabase(false);
        });
      }

      if (btnLogout) {
        btnLogout.addEventListener('click', () => {
          if (confirm("Are you sure you want to sign out?")) {
            const doSignOutRedirect = () => {
              self.currentUser = null;
              localStorage.removeItem('cat_user_profile_details');
              localStorage.removeItem('cat_scheduler_config');
              localStorage.removeItem('cat_daily_schedule');
              
              // Hide page views and show authPage overlay
              document.querySelectorAll('.page-view').forEach(view => view.classList.add('hidden'));
              document.getElementById('authPage').classList.remove('hidden');
              document.getElementById('authEmail').value = '';
              document.getElementById('authPassword').value = '';
            };

            if (window.supabaseClient) {
              window.supabaseClient.auth.signOut().then(() => {
                doSignOutRedirect();
              });
            } else {
              doSignOutRedirect();
            }
          }
        });
      }
    },

    // ==================== CLIENT SIDE ROUTING ====================
    switchPage: function(pageId) {
      this.endActiveExamTimer();

      document.querySelectorAll('.sidebar-nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('data-target') === pageId) {
          item.classList.add('active');
        }
      });

      document.querySelectorAll('.page-view').forEach(view => {
        view.classList.add('hidden');
        if (view.id === pageId + 'Page') {
          view.classList.remove('hidden');
        }
      });

      if (pageId === 'dashboard') {
        this.renderDashboard();
      } else if (pageId === 'syllabus') {
        this.renderSyllabusTracker();
        this.switchSyllabusTab('qa');
      } else if (pageId === 'execution') {
        this.renderExecutionSheet();
      } else if (pageId === 'mocks') {
        this.renderMockAnalysis();
      } else if (pageId === 'errors') {
        this.renderErrorNotebook();
      } else if (pageId === 'revision') {
        this.renderRevisionHub();
      } else if (pageId === 'solver') {
        this.renderProblemSolver();
      } else if (pageId === 'profile') {
        const config = JSON.parse(localStorage.getItem('cat_scheduler_config') || '{}');
        document.getElementById('profileExamDate').value = config.examDate || "2026-11-29";
        document.getElementById('profileDailyHours').value = config.dailyHours || 3;

        const details = JSON.parse(localStorage.getItem('cat_user_profile_details') || '{}');
        document.getElementById('profileName').value = details.name || "";
        document.getElementById('profileEmail').value = details.email || (this.currentUser ? this.currentUser.email : "");
        document.getElementById('profileDOB').value = details.dob || "";
        document.getElementById('profileWorkExp').value = details.workEx !== undefined ? details.workEx : "";
        document.getElementById('profileFieldOfStudy').value = details.field || "Engineering";
        document.getElementById('profileTargetPercentile').value = details.targetPct !== undefined ? details.targetPct : "99.00";
      }
    },

    bindNavigation: function() {
      const self = this;
      document.querySelectorAll('.sidebar-nav-item').forEach(item => {
        item.addEventListener('click', function() {
          const target = this.getAttribute('data-target');
          self.switchPage(target);
        });
      });
    },

    bindSharedEvents: function() {
      const self = this;
      document.querySelectorAll('.modal-close-btn, .modal-overlay, #testCancelBtn').forEach(btn => {
        btn.addEventListener('click', function() {
          self.endActiveExamTimer();
          document.querySelectorAll('.modal-container').forEach(modal => {
            modal.classList.add('hidden');
          });
        });
      });
    },

    // ==================== DAILY EXAMS LOGISTICS ====================
    updateDailyExamsList: function() {
      const reg = JSON.parse(localStorage.getItem('cat_registered_exams') || '[]');
      const dateStr = this.currentDateStr;
      const formattedDate = this.formatDatePretty(dateStr);
      const dailyKey = dateStr.replace(/-/g, '_');
      
      const hasMock = reg.some(x => x.id === `mock_daily_${dailyKey}`);
      if (!hasMock) {
        reg.push(
          { id: `mock_daily_${dailyKey}`, name: `Daily Full Mock - ${formattedDate}`, duration: 120, type: "Mock", date: dateStr },
          { id: `sec_qa_${dailyKey}`, name: `Daily QA Sectional - ${formattedDate}`, duration: 40, type: "Sectional", section: "QA", date: dateStr },
          { id: `sec_dilr_${dailyKey}`, name: `Daily DILR Sectional - ${formattedDate}`, duration: 40, type: "Sectional", section: "DILR", date: dateStr },
          { id: `sec_varc_${dailyKey}`, name: `Daily VARC Sectional - ${formattedDate}`, duration: 40, type: "Sectional", section: "VARC", date: dateStr }
        );
        localStorage.setItem('cat_registered_exams', JSON.stringify(reg));
      }
    },

    renderDashboard: function() {
      const stats = window.CAT_KPI.getStats();
      
      document.getElementById('dashAccuracyVal').innerText = `${stats.accuracy}%`;
      document.getElementById('dashAttemptedCount').innerText = stats.totalAttempted;
      document.getElementById('dashRcCount').innerText = stats.rcCount;
      document.getElementById('dashDilrCount').innerText = stats.dilrSets;
      document.getElementById('dashMocksCount').innerText = stats.mocksCount;
      document.getElementById('dashSyllabusPercent').innerText = `${stats.syllabus.percentage}% Completed`;
      document.getElementById('dashSyllabusProgressBar').style.width = `${stats.syllabus.percentage}%`;

      const schedule = JSON.parse(localStorage.getItem('cat_daily_schedule') || '[]');
      const activeDay = schedule.find(d => d.date === this.currentDateStr);
      const taskPreviewContainer = document.getElementById('dashTaskPreviewList');
      taskPreviewContainer.innerHTML = '';

      if (activeDay && activeDay.tasks && activeDay.tasks.length > 0) {
        activeDay.tasks.forEach(task => {
          const div = document.createElement('div');
          div.className = `task-preview-card ${task.completed ? 'completed' : ''}`;
          div.innerHTML = `
            <div class="task-preview-header">
              <span class="task-preview-time">${task.time}</span>
              <span class="tag tag-${task.category.toLowerCase()}">${task.category}</span>
            </div>
            <div class="task-preview-title">${task.title}</div>
            <div class="task-preview-desc">${task.details}</div>
          `;
          taskPreviewContainer.appendChild(div);
        });
      } else {
        taskPreviewContainer.innerHTML = `<div class="empty-state">No scheduled tasks for today. Go to the Execution tab to plan.</div>`;
      }

      setTimeout(() => {
        window.CAT_KPI.initCharts();
      }, 50);
    },

    bindSyllabusTabs: function() {
      const self = this;
      const tabMap = {
        'tab-btn-qa': 'qa',
        'tab-btn-dilr': 'dilr',
        'tab-btn-varc': 'varc',
        'tab-btn-sectionals': 'sectionals',
        'tab-btn-mocks': 'mocks'
      };

      for (let btnId in tabMap) {
        document.getElementById(btnId).addEventListener('click', function() {
          document.querySelectorAll('.syllabus-tab-btn').forEach(b => b.classList.remove('active'));
          this.classList.add('active');
          self.switchSyllabusTab(tabMap[btnId]);
        });
      }
    },

    switchSyllabusTab: function(tabId) {
      document.querySelectorAll('.syllabus-panel').forEach(p => p.classList.add('hidden'));
      document.getElementById(`panel-${tabId}`).classList.remove('hidden');
      
      if (tabId === 'sectionals') {
        this.renderSectionalsList();
      } else if (tabId === 'mocks') {
        this.renderMocksList();
      }
    },

    renderSyllabusTracker: function() {
      const self = this;
      const progressStore = JSON.parse(localStorage.getItem('cat_syllabus_progress') || '{}');
      const confidenceStore = JSON.parse(localStorage.getItem('cat_syllabus_confidence') || '{}');
      
      const sections = ['QA', 'DILR', 'VARC'];
      sections.forEach(sec => {
        const container = document.getElementById(`syllabus-${sec.toLowerCase()}-list`);
        container.innerHTML = '';

        const sectionData = window.CAT_SYLLABUS[sec];
        
        for (let topicName in sectionData.topics) {
          const topicCard = document.createElement('div');
          topicCard.className = 'syllabus-topic-card';
          
          let subtopicsHtml = '';
          sectionData.topics[topicName].forEach(sub => {
            const currentProgress = progressStore[sub] || 'Not Started';
            const currentConfidence = confidenceStore[sub] || 'Medium';
            
            subtopicsHtml += `
              <div class="syllabus-subtopic-row">
                <div class="subtopic-name-col">
                  <span class="bullet">•</span> ${sub}
                </div>
                <div class="subtopic-status-col">
                  <select class="status-select" data-subtopic="${sub}">
                    <option value="Not Started" ${currentProgress === 'Not Started' ? 'selected' : ''}>Not Started</option>
                    <option value="In Progress" ${currentProgress === 'In Progress' ? 'selected' : ''}>In Progress</option>
                    <option value="Completed" ${currentProgress === 'Completed' ? 'selected' : ''}>Completed</option>
                  </select>
                </div>
                <div class="subtopic-confidence-col">
                  <div class="confidence-selector">
                    <button class="conf-btn conf-low ${currentConfidence === 'Low' ? 'active' : ''}" data-subtopic="${sub}" data-value="Low">Low</button>
                    <button class="conf-btn conf-medium ${currentConfidence === 'Medium' ? 'active' : ''}" data-subtopic="${sub}" data-value="Medium">Med</button>
                    <button class="conf-btn conf-high ${currentConfidence === 'High' ? 'active' : ''}" data-subtopic="${sub}" data-value="High">High</button>
                  </div>
                </div>
                <div class="subtopic-practice-col">
                  <button class="practice-btn" data-section="${sec}" data-topic="${topicName}" data-subtopic="${sub}">
                    Practice Drill
                  </button>
                </div>
              </div>
            `;
          });

          topicCard.innerHTML = `
            <div class="topic-header" onclick="this.parentElement.classList.toggle('expanded')">
              <span class="topic-title-text">${topicName}</span>
              <span class="expand-icon">▼</span>
            </div>
            <div class="topic-body">
              ${subtopicsHtml}
            </div>
          `;
          container.appendChild(topicCard);
        }
      });

      document.querySelectorAll('.status-select').forEach(select => {
        select.addEventListener('change', function() {
          const subtopic = this.getAttribute('data-subtopic');
          const value = this.value;
          const store = JSON.parse(localStorage.getItem('cat_syllabus_progress') || '{}');
          store[subtopic] = value;
          localStorage.setItem('cat_syllabus_progress', JSON.stringify(store));

          // Background sync progress updates
          self.uploadDataToSupabase(true);
        });
      });

      document.querySelectorAll('.conf-btn').forEach(btn => {
        btn.addEventListener('click', function() {
          const subtopic = this.getAttribute('data-subtopic');
          const val = this.getAttribute('data-value');
          const store = JSON.parse(localStorage.getItem('cat_syllabus_confidence') || '{}');
          store[subtopic] = val;
          localStorage.setItem('cat_syllabus_confidence', JSON.stringify(store));
          
          this.parentElement.querySelectorAll('.conf-btn').forEach(b => b.classList.remove('active'));
          this.classList.add('active');

          // Background sync confidence updates
          self.uploadDataToSupabase(true);
        });
      });

      document.querySelectorAll('.practice-btn').forEach(btn => {
        btn.addEventListener('click', function() {
          const sec = this.getAttribute('data-section');
          const topic = this.getAttribute('data-topic');
          const sub = this.getAttribute('data-subtopic');
          self.openPracticeDrill(sec, topic, sub);
        });
      });
    },

    renderSectionalsList: function() {
      const self = this;
      const container = document.getElementById('syllabus-sectionals-list');
      container.innerHTML = '';
      
      const loggedMocks = JSON.parse(localStorage.getItem('cat_mocks') || '[]');
      const registered = JSON.parse(localStorage.getItem('cat_registered_exams') || '[]');

      const baseline = window.SECTIONALS_DATA.map(s => ({ ...s, type: "Sectional" }));
      const dailies = registered.filter(r => r.type === "Sectional");
      const allSectionals = [...baseline, ...dailies];

      allSectionals.forEach(sec => {
        const hasAttempted = loggedMocks.some(m => m.examId === sec.id);
        const card = document.createElement('div');
        card.className = 'syllabus-topic-card expanded';
        const qCount = sec.section === 'VARC' ? 24 : 22;

        card.innerHTML = `
          <div class="topic-header" style="cursor: default;">
            <div>
              <span class="topic-title-text">${sec.name}</span>
              <span class="tag tag-${sec.section.toLowerCase()}" style="margin-left: 0.75rem;">${sec.section}</span>
            </div>
            <span class="status-indicator ${hasAttempted ? 'resolved' : 'unresolved'}">
              ${hasAttempted ? '✓ Attempted' : '✗ Unattempted'}
            </span>
          </div>
          <div class="topic-body" style="padding-top: 1.25rem;">
            <div style="display: flex; align-items: center; justify-content: space-between;">
              <span style="font-size: 0.85rem; color: var(--text-muted);">
                <b>Duration:</b> ${sec.duration} Minutes | <b>Total Questions:</b> ${qCount} Questions (Level 1 to Level 5)
              </span>
              <button class="btn btn-primary attempt-test-btn" data-test-id="${sec.id}" data-type="Sectional" ${hasAttempted ? 'style="background-color: var(--color-green);"' : ''}>
                ${hasAttempted ? 'Re-attempt Test' : 'Attempt Sectional'}
              </button>
            </div>
          </div>
        `;
        container.appendChild(card);
      });

      container.querySelectorAll('.attempt-test-btn').forEach(btn => {
        btn.onclick = () => {
          const id = btn.getAttribute('data-test-id');
          self.openMockAttemptModal(id, "Sectional");
        };
      });
    },

    renderMocksList: function() {
      const self = this;
      const container = document.getElementById('syllabus-mocks-list');
      container.innerHTML = '';
      
      const loggedMocks = JSON.parse(localStorage.getItem('cat_mocks') || '[]');
      const registered = JSON.parse(localStorage.getItem('cat_registered_exams') || '[]');

      const baseline = window.FULL_MOCKS_DATA.map(m => ({ ...m, type: "Mock" }));
      const dailies = registered.filter(r => r.type === "Mock");
      const allMocks = [...baseline, ...dailies];

      allMocks.forEach(mock => {
        const hasAttempted = loggedMocks.some(m => m.examId === mock.id);
        const card = document.createElement('div');
        card.className = 'syllabus-topic-card expanded';
        card.innerHTML = `
          <div class="topic-header" style="cursor: default;">
            <div>
              <span class="topic-title-text">${mock.name}</span>
              <span class="tag tag-mock" style="margin-left: 0.75rem;">Simulated CAT</span>
            </div>
            <span class="status-indicator ${hasAttempted ? 'resolved' : 'unresolved'}">
              ${hasAttempted ? '✓ Attempted' : '✗ Unattempted'}
            </span>
          </div>
          <div class="topic-body" style="padding-top: 1.25rem;">
            <div style="display: flex; align-items: center; justify-content: space-between;">
              <span style="font-size: 0.85rem; color: var(--text-muted);">
                <b>Duration:</b> ${mock.duration} Minutes | <b>Total Questions:</b> 68 Questions (QA 22, DILR 22, VARC 24)
              </span>
              <button class="btn btn-primary attempt-test-btn" data-test-id="${mock.id}" data-type="Mock" ${hasAttempted ? 'style="background-color: var(--color-green);"' : ''}>
                ${hasAttempted ? 'Re-attempt Test' : 'Attempt Full Mock'}
              </button>
            </div>
          </div>
        `;
        container.appendChild(card);
      });

      container.querySelectorAll('.attempt-test-btn').forEach(btn => {
        btn.onclick = () => {
          const id = btn.getAttribute('data-test-id');
          self.openMockAttemptModal(id, "Mock");
        };
      });
    },

    // 9. Standard Practice Drills Overlay
    openPracticeDrill: function(section, topic, subtopic) {
      const modal = document.getElementById('practiceModal');
      const title = document.getElementById('practiceModalTitle');
      const questionsContainer = document.getElementById('practiceQuestionsContainer');
      const resultsContainer = document.getElementById('practiceResultsContainer');
      const submitBtn = document.getElementById('submitPracticeBtn');
      const headerTimer = document.getElementById('testHeaderTimer');
      const testSplitBody = document.getElementById('testSplitBody');
      const standardModalBody = document.getElementById('standardModalBody');
      const cancelBtn = document.getElementById('testCancelBtn');

      title.innerHTML = `Practice Drill: ${subtopic} <span class="tag tag-${section.toLowerCase()}">${section}</span>`;
      resultsContainer.classList.add('hidden');
      questionsContainer.classList.remove('hidden');
      submitBtn.classList.remove('hidden');
      headerTimer.classList.add('hidden');
      testSplitBody.style.display = 'none';
      standardModalBody.style.display = 'block';
      cancelBtn.style.display = 'inline-block';

      const confidenceStore = JSON.parse(localStorage.getItem('cat_syllabus_confidence') || '{}');
      const confidence = confidenceStore[subtopic] || 'Medium';

      const quiz = window.QUESTION_ENGINE.generatePracticeDrill(section, topic, subtopic, confidence);

      questionsContainer.innerHTML = '';
      quiz.forEach((q, index) => {
        const qCard = document.createElement('div');
        qCard.className = 'drill-question-card';
        
        let answersHtml = '';
        if (q.type === 'MCQ') {
          q.options.forEach(opt => {
            answersHtml += `
              <label class="drill-option-label">
                <input type="radio" name="practice_q_${q.id}" value="${opt}">
                <span>${opt}</span>
              </label>
            `;
          });
        } else {
          answersHtml += `
            <div class="drill-tita-wrapper">
              <input type="text" class="tita-input" id="practice_q_${q.id}" placeholder="Type answer here...">
            </div>
          `;
        }

        qCard.innerHTML = `
          <div class="drill-question-meta">
            <span class="question-number">Question ${index + 1} of 15</span>
            <span class="difficulty-badge badge-${q.difficulty.toLowerCase().replace(' ', '-')}">${q.difficulty}</span>
          </div>
          <div class="drill-question-text">${q.question}</div>
          <div class="drill-answers-group">
            ${answersHtml}
          </div>
          <div class="drill-error-selection hidden" id="error_select_wrapper_${q.id}">
            <label class="error-category-label">Mistake Pattern:
              <select id="practice_err_cat_${q.id}">
                <option value="Silly Mistake">Silly Calculation Mistake</option>
                <option value="Conceptual">Conceptual Gap (Didn't know theory)</option>
                <option value="Time Pressure">Time Pressure (Rushed/Guessed)</option>
                <option value="Guessed">Pure Guesswork</option>
              </select>
            </label>
          </div>
          <div class="drill-explanation-card hidden" id="explanation_${q.id}">
            <div class="explanation-title">Explanation & Solution:</div>
            <div class="explanation-content">${q.explanation}</div>
          </div>
        `;
        questionsContainer.appendChild(qCard);
      });

      submitBtn.onclick = null;
      submitBtn.onclick = () => {
        const answers = {};
        quiz.forEach(q => {
          if (q.type === 'MCQ') {
            const checked = document.querySelector(`input[name="practice_q_${q.id}"]:checked`);
            answers[q.id] = checked ? checked.value : "";
          } else {
            answers[q.id] = document.getElementById(`practice_q_${q.id}`).value;
          }
          
          const errorSelector = document.getElementById(`practice_err_cat_${q.id}`);
          if (errorSelector) {
            q.userErrorCategory = errorSelector.value;
          }
        });

        const record = window.CAT_ANALYSIS.autoLogPracticeSession(subtopic, section, quiz, answers);
        window.QUESTION_ENGINE.flagQuestionsAsUsed(quiz);
        
        const hist = JSON.parse(localStorage.getItem('cat_practice_history') || '[]');
        quiz.forEach(q => {
          hist.push({
            id: q.id,
            subtopic: subtopic,
            section: section,
            correct: answers[q.id] === q.correctAnswer,
            date: new Date().toISOString().split('T')[0]
          });
        });
        localStorage.setItem('cat_practice_history', JSON.stringify(hist));

        // Push updates to cloud
        self.uploadDataToSupabase(true);

        quiz.forEach(q => {
          const explanationCard = document.getElementById(`explanation_${q.id}`);
          explanationCard.classList.remove('hidden');
          
          const isCorrect = answers[q.id] === q.correctAnswer;
          const statusDiv = document.createElement('div');
          statusDiv.className = `attempt-feedback-tag ${isCorrect ? 'correct' : 'incorrect'}`;
          statusDiv.innerHTML = isCorrect ? '✓ Correct Answer' : `✗ Incorrect (Correct: <b>${q.correctAnswer}</b>)`;
          explanationCard.parentNode.insertBefore(statusDiv, explanationCard);

          if (!isCorrect) {
            const errorSelWrapper = document.getElementById(`error_select_wrapper_${q.id}`);
            if (errorSelWrapper) {
              errorSelWrapper.classList.remove('hidden');
              const errorSelector = document.getElementById(`practice_err_cat_${q.id}`);
              errorSelector.addEventListener('change', function() {
                const errors = window.CAT_ERRORBOOK.getErrors();
                const errIdx = errors.findIndex(e => e.question === q.question);
                if (errIdx !== -1) {
                  errors[errIdx].errorCategory = this.value;
                  window.CAT_ERRORBOOK.saveErrors(errors);
                  self.uploadDataToSupabase(true); // upload edited error category
                }
              });
            }
          }
        });

        submitBtn.classList.add('hidden');
        resultsContainer.innerHTML = `
          <div class="drill-results-banner">
            <h3>Drill Submitted!</h3>
            <p>Score: <b>${record.totalScore}</b> marks | Accuracy: <b>${Math.round((quiz.filter(q => answers[q.id] === q.correctAnswer).length / quiz.length) * 100)}%</b></p>
            <p class="drill-action-call"><b>Pattern Recommendation:</b> ${record.actionItems}</p>
          </div>
        `;
        resultsContainer.classList.remove('hidden');
      };

      modal.classList.remove('hidden');
    },

    // ==================== TIMED EXAM PLAYBACK PANEL ====================
    openMockAttemptModal: function(examId, examType) {
      const self = this;
      this.endActiveExamTimer();

      let questions = [];
      let name = "";
      let durationMins = 40;
      let sectionVal = null;

      const registered = JSON.parse(localStorage.getItem('cat_registered_exams') || '[]');
      const baselineSectionals = window.SECTIONALS_DATA;
      const baselineMocks = window.FULL_MOCKS_DATA;

      if (examType === "Sectional") {
        let secDef = baselineSectionals.find(s => s.id === examId) || registered.find(r => r.id === examId);
        if (!secDef) return;

        name = secDef.name;
        durationMins = secDef.duration;
        sectionVal = secDef.section;
        questions = window.QUESTION_ENGINE.generateSectional(secDef.section, examId);
      } else {
        let mockDef = baselineMocks.find(m => m.id === examId) || registered.find(r => r.id === examId);
        if (!mockDef) return;

        name = mockDef.name;
        durationMins = mockDef.duration;
        questions = window.QUESTION_ENGINE.generateMock(examId);
      }

      this.activeTest = {
        id: examId,
        name: name,
        type: examType,
        section: sectionVal,
        duration: durationMins,
        questions: questions
      };

      this.testAnswers = {};
      this.testVisited = {};
      this.testMarked = {};
      this.currentQuestionIndex = 0;

      const modal = document.getElementById('practiceModal');
      const title = document.getElementById('practiceModalTitle');
      const headerTimer = document.getElementById('testHeaderTimer');
      const testSplitBody = document.getElementById('testSplitBody');
      const standardModalBody = document.getElementById('standardModalBody');
      const submitBtn = document.getElementById('submitPracticeBtn');
      const cancelBtn = document.getElementById('testCancelBtn');

      title.innerHTML = `${name} <span class="tag tag-mock">${examType} Mode</span>`;
      headerTimer.classList.remove('hidden');
      testSplitBody.style.display = 'grid';
      standardModalBody.style.display = 'none';
      submitBtn.classList.remove('hidden');
      submitBtn.innerText = "Submit Exam";
      cancelBtn.style.display = 'none';

      this.renderExamQuestion(0);
      this.renderExamNavigatorGrid();

      let secondsLeft = durationMins * 60;
      const updateTimerText = () => {
        const mins = Math.floor(secondsLeft / 60);
        const secs = secondsLeft % 60;
        document.getElementById('testTimerText').innerText = `Time Remaining: ${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
      };
      
      updateTimerText();
      this.testTimerInterval = setInterval(() => {
        secondsLeft--;
        updateTimerText();
        if (secondsLeft <= 0) {
          self.submitActiveExam();
        }
      }, 1000);

      document.getElementById('testNextBtn').onclick = () => {
        self.saveCurrentAnswer();
        if (self.currentQuestionIndex < self.activeTest.questions.length - 1) {
          self.currentQuestionIndex++;
          self.renderExamQuestion(self.currentQuestionIndex);
          self.renderExamNavigatorGrid();
        }
      };

      document.getElementById('testPrevBtn').onclick = () => {
        self.saveCurrentAnswer();
        if (self.currentQuestionIndex > 0) {
          self.currentQuestionIndex--;
          self.renderExamQuestion(self.currentQuestionIndex);
          self.renderExamNavigatorGrid();
        }
      };

      document.getElementById('testMarkBtn').onclick = () => {
        self.saveCurrentAnswer();
        const currentQ = self.activeTest.questions[self.currentQuestionIndex];
        self.testMarked[currentQ.id] = true;
        
        if (self.currentQuestionIndex < self.activeTest.questions.length - 1) {
          self.currentQuestionIndex++;
          self.renderExamQuestion(self.currentQuestionIndex);
        }
        self.renderExamNavigatorGrid();
      };

      submitBtn.onclick = null;
      submitBtn.onclick = () => {
        if (confirm("Are you sure you want to submit your exam? All responses will be graded.")) {
          self.submitActiveExam();
        }
      };

      modal.classList.remove('hidden');
    },

    renderExamQuestion: function(index) {
      const q = this.activeTest.questions[index];
      this.testVisited[q.id] = true;

      let secPrefix = "";
      if (this.activeTest.type === "Mock") {
        if (index < 24) secPrefix = "[VARC Section] ";
        else if (index < 46) secPrefix = "[DILR Section] ";
        else secPrefix = "[QA Section] ";
      }

      document.getElementById('testQuestionIndex').innerText = `${secPrefix}Question ${index + 1} of ${this.activeTest.questions.length}`;
      
      const diffBadge = document.getElementById('testQuestionDifficulty');
      diffBadge.innerText = q.difficulty;
      diffBadge.className = `difficulty-badge badge-${q.difficulty.toLowerCase().replace(' ', '-')}`;

      document.getElementById('testQuestionContent').innerHTML = q.question;

      const optionsGroup = document.getElementById('testOptionsGroup');
      optionsGroup.innerHTML = '';

      const savedAnswer = this.testAnswers[q.id] || "";

      if (q.type === 'MCQ') {
        q.options.forEach(opt => {
          const checked = savedAnswer === opt ? 'checked' : '';
          optionsGroup.innerHTML += `
            <label class="drill-option-label">
              <input type="radio" name="mock_q" value="${opt}" ${checked}>
              <span>${opt}</span>
            </label>
          `;
        });
      } else {
        optionsGroup.innerHTML = `
          <div class="drill-tita-wrapper">
            <input type="text" class="tita-input" id="mock_tita_ans" placeholder="Type TITA Answer here..." value="${savedAnswer}">
          </div>
        `;
      }
    },

    renderExamNavigatorGrid: function() {
      const self = this;
      const grid = document.getElementById('testNavigatorGrid');
      grid.innerHTML = '';

      this.activeTest.questions.forEach((q, index) => {
        const isCurrent = index === self.currentQuestionIndex;
        const isAnswered = self.testAnswers[q.id] !== undefined && self.testAnswers[q.id] !== "";
        const isMarked = self.testMarked[q.id];
        const isVisited = self.testVisited[q.id];

        let stateClass = '';
        if (isCurrent) stateClass = 'active';
        else if (isMarked) stateClass = 'marked';
        else if (isAnswered) stateClass = 'answered';
        else if (isVisited) stateClass = 'visited';

        const btn = document.createElement('button');
        btn.className = `nav-num-btn ${stateClass}`;
        btn.innerText = index + 1;
        btn.onclick = () => {
          self.saveCurrentAnswer();
          self.currentQuestionIndex = index;
          self.renderExamQuestion(index);
          self.renderExamNavigatorGrid();
        };

        grid.appendChild(btn);
      });
    },

    saveCurrentAnswer: function() {
      const q = this.activeTest.questions[this.currentQuestionIndex];
      if (q.type === 'MCQ') {
        const checked = document.querySelector('input[name="mock_q"]:checked');
        if (checked) {
          this.testAnswers[q.id] = checked.value;
        }
      } else {
        const textVal = document.getElementById('mock_tita_ans');
        if (textVal) {
          this.testAnswers[q.id] = textVal.value.trim();
        }
      }
    },

    submitActiveExam: function() {
      this.saveCurrentAnswer();
      this.endActiveExamTimer();

      const self = this;
      const quiz = this.activeTest.questions;
      let correct = 0;
      let incorrect = 0;
      let score = 0;

      let qaScore = 0, dilrScore = 0, varcScore = 0;
      const errorsBreakdown = { conceptual: 0, silly: 0, time: 0, guessed: 0 };
      const incorrectItemsHtml = [];

      quiz.forEach((q, index) => {
        const userAns = self.testAnswers[q.id] || "";
        const isCorrect = userAns.toLowerCase() === q.correctAnswer.toLowerCase();

        let questionScore = 0;
        if (isCorrect) {
          correct++;
          questionScore = 3;
        } else {
          incorrect++;
          if (q.type === 'MCQ') {
            questionScore = -1;
          }

          const defaultCategory = (q.difficulty === 'Level 4' || q.difficulty === 'Level 5') ? 'Conceptual' : 'Time Pressure';
          if (defaultCategory === 'Conceptual') errorsBreakdown.conceptual++;
          else errorsBreakdown.time++;

          window.CAT_ERRORBOOK.addError({
            section: q.section,
            topic: q.topic,
            subtopic: q.subtopic,
            question: q.question,
            yourAnswer: userAns || "Skipped",
            correctAnswer: q.correctAnswer,
            errorCategory: defaultCategory,
            learningPoint: `Recorded from simulated mock attempt (${self.activeTest.name}). Solution: ${q.explanation}`,
            dateAdded: new Date().toISOString().split('T')[0]
          });

          incorrectItemsHtml.push(`
            <div class="drill-question-card" style="border-left: 4px solid var(--color-rose); margin-top: 1rem;">
              <div class="drill-question-meta">
                <span><b>${q.section} Section: ${q.subtopic}</b> (${q.difficulty})</span>
                <span class="tag tag-rose" style="background-color: var(--color-rose-light); color: var(--color-rose);">Incorrect</span>
              </div>
              <div style="font-size:0.85rem; margin-top: 0.5rem; font-weight: 500;">${q.question}</div>
              <div style="font-size: 0.8rem; color: var(--color-rose); margin-top: 0.5rem;">Your Answer: <b>${userAns || 'Skipped'}</b> | Correct: <b>${q.correctAnswer}</b></div>
              <div class="drill-explanation-card" style="margin-top: 0.5rem;">
                <b>Solution Explanation:</b><br>${q.explanation}
              </div>
            </div>
          `);
        }

        if (self.activeTest.type === "Mock") {
          if (index < 24) varcScore += questionScore;
          else if (index < 46) dilrScore += questionScore;
          else qaScore += questionScore;
        } else {
          score += questionScore;
        }
      });

      if (self.activeTest.type === "Mock") {
        score = varcScore + dilrScore + qaScore;
      } else {
        if (self.activeTest.section === 'QA') { qaScore = score; dilrScore = null; varcScore = null; }
        else if (self.activeTest.section === 'DILR') { qaScore = null; dilrScore = score; varcScore = null; }
        else { qaScore = null; dilrScore = null; varcScore = score; }
      }

      const accuracy = quiz.length > 0 ? Math.round((correct / quiz.length) * 100) : 0;
      
      let pct = 70;
      if (accuracy >= 80) pct = 99.4;
      else if (accuracy >= 60) pct = 97.2;
      else if (accuracy >= 40) pct = 89.5;

      const mockRecord = {
        id: 'mock_sim_' + Date.now(),
        examId: self.activeTest.id,
        name: self.activeTest.name,
        type: self.activeTest.type === "Sectional" ? "Sectional" : "Full Mock",
        date: new Date().toISOString().split('T')[0],
        qaScore: qaScore,
        dilrScore: dilrScore,
        varcScore: varcScore,
        totalScore: score,
        percentile: pct,
        errors: errorsBreakdown,
        actionItems: accuracy < 60 ? "Improve speed. Focus on Sunday formula sheets and re-attempt errors." : "Ready for actual CAT. Continue with mixed sectional drills.",
        questions: quiz,
        answers: self.testAnswers
      };

      window.CAT_ANALYSIS.addMockRecord(mockRecord);
      window.QUESTION_ENGINE.flagQuestionsAsUsed(quiz);

      // Cloud database sync mock & error additions
      self.uploadDataToSupabase(true);

      const standardModalBody = document.getElementById('standardModalBody');
      const testSplitBody = document.getElementById('testSplitBody');
      const resultsContainer = document.getElementById('practiceResultsContainer');
      const questionsContainer = document.getElementById('practiceQuestionsContainer');
      const submitBtn = document.getElementById('submitPracticeBtn');
      const cancelBtn = document.getElementById('testCancelBtn');

      testSplitBody.style.display = 'none';
      standardModalBody.style.display = 'block';
      submitBtn.classList.add('hidden');
      cancelBtn.style.display = 'inline-block';
      cancelBtn.innerText = "Close Review";

      let scoreBreakdownHtml = "";
      if (self.activeTest.type === "Mock") {
        scoreBreakdownHtml = `<p style="font-size: 0.9rem; color: var(--text-muted); margin-top: 0.5rem;">Section Scores: VARC: <b>${varcScore}</b> | DILR: <b>${dilrScore}</b> | QA: <b>${qaScore}</b></p>`;
      }

      resultsContainer.innerHTML = `
        <div class="drill-results-banner" style="border-color: var(--color-indigo);">
          <h3 style="color: var(--color-indigo);">Exam Scorecard Summary</h3>
          <p style="font-size: 1.15rem; margin-top: 0.5rem;">Total Score: <b>${score}</b> Marks | Accuracy: <b>${accuracy}%</b> | Percentile: <b>${pct}%</b></p>
          ${scoreBreakdownHtml}
          <p style="font-size: 0.85rem; color: var(--text-muted); margin-top: 0.25rem;">Correct Answers: <b>${correct}</b> | Incorrect: <b>${incorrect}</b> | Total: <b>${quiz.length}</b></p>
        </div>
      `;
      resultsContainer.classList.remove('hidden');

      questionsContainer.innerHTML = '';
      if (incorrectItemsHtml.length > 0) {
        questionsContainer.innerHTML = `<h4>Reviewing Incorrect Responses (${incorrect}):</h4>` + incorrectItemsHtml.join('');
      } else {
        questionsContainer.innerHTML = `<div class="empty-state">✓ 100% Accuracy! You solved all questions without mistakes. Excellent!</div>`;
      }

      this.renderSectionalsList();
      this.renderMocksList();
    },

    openMockReviewModal: function(attemptId) {
      const mocks = JSON.parse(localStorage.getItem('cat_mocks') || '[]');
      const attempt = mocks.find(m => m.id === attemptId);
      if (!attempt || !attempt.questions) {
        alert("This record does not contain question-level data. (Baseline seeding mocks cannot be reviewed).");
        return;
      }

      const modal = document.getElementById('practiceModal');
      const title = document.getElementById('practiceModalTitle');
      const questionsContainer = document.getElementById('practiceQuestionsContainer');
      const resultsContainer = document.getElementById('practiceResultsContainer');
      const submitBtn = document.getElementById('submitPracticeBtn');
      const headerTimer = document.getElementById('testHeaderTimer');
      const testSplitBody = document.getElementById('testSplitBody');
      const standardModalBody = document.getElementById('standardModalBody');
      const cancelBtn = document.getElementById('testCancelBtn');

      title.innerHTML = `Attempt Review: ${attempt.name}`;
      headerTimer.classList.add('hidden');
      testSplitBody.style.display = 'none';
      standardModalBody.style.display = 'block';
      submitBtn.classList.add('hidden');
      cancelBtn.style.display = 'inline-block';
      cancelBtn.innerText = "Close Review";

      let scoreBreakdownHtml = "";
      if (attempt.type === "Full Mock" || attempt.qaScore !== null && attempt.dilrScore !== null && attempt.varcScore !== null) {
        scoreBreakdownHtml = `<p style="font-size: 0.9rem; color: var(--text-muted); margin-top: 0.5rem;">Section Scores: VARC: <b>${attempt.varcScore || 0}</b> | DILR: <b>${attempt.dilrScore || 0}</b> | QA: <b>${attempt.qaScore || 0}</b></p>`;
      }

      resultsContainer.innerHTML = `
        <div class="drill-results-banner" style="border-color: var(--color-indigo);">
          <h3 style="color: var(--color-indigo);">Attempt Review Sheet</h3>
          <p style="font-size: 1.15rem; margin-top: 0.5rem;">Total Score: <b>${attempt.totalScore}</b> Marks | Percentile: <b>${attempt.percentile}%</b></p>
          ${scoreBreakdownHtml}
          <p style="font-size: 0.85rem; color: var(--text-muted); margin-top: 0.25rem;">Attempt Date: <b>${attempt.date}</b></p>
        </div>
      `;
      resultsContainer.classList.remove('hidden');

      questionsContainer.innerHTML = '';
      attempt.questions.forEach((q, index) => {
        const userAns = attempt.answers[q.id] || "";
        const isCorrect = userAns.toLowerCase() === q.correctAnswer.toLowerCase();
        
        const qCard = document.createElement('div');
        qCard.className = 'drill-question-card';
        qCard.style.borderLeft = isCorrect ? '4px solid var(--color-green)' : '4px solid var(--color-rose)';

        qCard.innerHTML = `
          <div class="drill-question-meta">
            <span class="question-number">Question ${index + 1} of ${attempt.questions.length} [${q.section}]</span>
            <span class="difficulty-badge badge-${q.difficulty.toLowerCase().replace(' ', '-')}">${q.difficulty}</span>
          </div>
          <div class="drill-question-text">${q.question}</div>
          <div style="font-size: 0.85rem; padding: 0.5rem; background: #fff; border-radius: 4px; margin-bottom: 0.5rem;">
            Your Answer: <b style="color: ${isCorrect ? 'var(--color-green)' : 'var(--color-rose)'};">${userAns || 'Skipped'}</b><br>
            Correct Answer: <b>${q.correctAnswer}</b>
          </div>
          <div class="drill-explanation-card">
            <div class="explanation-title">Explanation:</div>
            <div class="explanation-content">${q.explanation}</div>
          </div>
        `;
        questionsContainer.appendChild(qCard);
      });

      modal.classList.remove('hidden');
    },

    endActiveExamTimer: function() {
      if (this.testTimerInterval) {
        clearInterval(this.testTimerInterval);
        this.testTimerInterval = null;
      }
      document.getElementById('testHeaderTimer').classList.add('hidden');
    },

    // ==================== PROBLEM SOLVER PAGE EVENT HANDLERS ====================
    renderProblemSolver: function() {
      document.getElementById('solverTerminal').innerHTML = `
        <div class="terminal-line"><span class="line-prompt">></span> System Initialized. Awaiting question sheet upload or text input...</div>
      `;
      document.getElementById('solverTextArea').value = '';
    },

    bindSolverEvents: function() {
      const self = this;
      const dropZone = document.getElementById('solverDropZone');
      const fileInput = document.getElementById('solverFileInput');
      const solveBtn = document.getElementById('triggerSolveBtn');
      const clearBtn = document.getElementById('clearSolverBtn');
      const textVal = document.getElementById('solverTextArea');

      dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
      });

      dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('dragover');
      });

      dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        const files = e.dataTransfer.files;
        if (files.length > 0) {
          self.handleSolverFileLoad(files[0]);
        }
      });

      dropZone.addEventListener('click', () => {
        fileInput.click();
      });

      fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
          self.handleSolverFileLoad(e.target.files[0]);
        }
      });

      clearBtn.addEventListener('click', () => {
        textVal.value = '';
        self.renderProblemSolver();
      });

      document.querySelectorAll('.preset-btn').forEach(btn => {
        btn.addEventListener('click', function() {
          const filename = this.getAttribute('data-file');
          const content = window.CAT_SOLVER.SAMPLES[filename];
          textVal.value = content;
          self.runSolverExecution(content, filename);
        });
      });

      solveBtn.addEventListener('click', () => {
        const text = textVal.value.trim();
        if (!text) {
          alert("Please input your question statement or upload a file first.");
          return;
        }
        self.runSolverExecution(text, "custom_input.txt");
      });
    },

    handleSolverFileLoad: function(file) {
      const self = this;
      const reader = new FileReader();

      const allowed = ['text/plain', 'text/markdown', 'application/json', 'text/csv'];
      if (!allowed.includes(file.type) && !file.name.endsWith('.md') && !file.name.endsWith('.txt')) {
        alert("Invalid file format. Please upload a .txt or .md question sheet.");
        return;
      }

      reader.onload = function(e) {
        const text = e.target.result;
        document.getElementById('solverTextArea').value = text;
        self.runSolverExecution(text, file.name);
      };

      reader.readAsText(file);
    },

    runSolverExecution: function(text, filename) {
      const terminal = document.getElementById('solverTerminal');
      terminal.innerHTML = '';

      const lines = [
        `Reading File: ${filename}... Done.`,
        `Analyzing question statement (UTF-8 encoding detected)...`,
        `Invoking CAT 100-Percentiler NLP Reasoning model...`,
        `Generating optimal shortcuts & timing strategies...`
      ];

      let lineIdx = 0;
      const typeNextLoader = () => {
        if (lineIdx < lines.length) {
          terminal.innerHTML += `
            <div class="terminal-line"><span class="line-prompt">></span> ${lines[lineIdx]}</div>
          `;
          terminal.scrollTop = terminal.scrollHeight;
          lineIdx++;
          setTimeout(typeNextLoader, 400);
        } else {
          const result = window.CAT_SOLVER.solveQuestion(text);
          terminal.innerHTML += `
            <div class="terminal-response-card">
              <div class="terminal-topic-title">📚 Topic: ${result.topic}</div>
              <div class="terminal-sub-section"><div class="terminal-sub-section-title">${result.shortcut}</div></div>
              <div class="terminal-sub-section"><div class="terminal-sub-section-title">${result.conventional}</div></div>
              <div class="terminal-sub-section"><div class="terminal-sub-section-title">${result.trap}</div></div>
              <div class="terminal-sub-section"><div class="terminal-sub-section-title">${result.strategy}</div></div>
            </div>
            <div class="terminal-line"><span class="line-prompt">></span> Execution complete. Solver ready.</div>
          `;
          terminal.scrollTop = terminal.scrollHeight;
        }
      };

      typeNextLoader();
    },

    // ==================== DAILY EXECUTION Timetables ====================
    renderExecutionSheet: function() {
      const self = this;
      const schedule = JSON.parse(localStorage.getItem('cat_daily_schedule') || '[]');
      const dayData = schedule.find(d => d.date === this.currentDateStr);
      const headerTitle = document.getElementById('executionDayTitle');
      const tasksContainer = document.getElementById('executionTasksList');

      headerTitle.innerText = `${this.formatDatePretty(this.currentDateStr)} (${dayData ? dayData.dayName : 'Unscheduled'})`;
      tasksContainer.innerHTML = '';

      if (dayData && dayData.tasks && dayData.tasks.length > 0) {
        dayData.tasks.forEach(task => {
          const div = document.createElement('div');
          div.className = `execution-task-card ${task.completed ? 'completed' : ''}`;
          div.innerHTML = `
            <div class="task-checkbox-col">
              <input type="checkbox" class="task-complete-checkbox" data-task-id="${task.id}" ${task.completed ? 'checked' : ''}>
            </div>
            <div class="task-content-col">
              <div class="task-meta-info">
                <span class="task-time">${task.time}</span>
                <span class="tag tag-${task.category.toLowerCase()}">${task.category}</span>
              </div>
              <div class="task-title-text">${task.title}</div>
              <div class="task-details-text">${task.details}</div>
            </div>
          `;
          tasksContainer.appendChild(div);
        });

        document.querySelectorAll('.task-complete-checkbox').forEach(cb => {
          cb.addEventListener('change', function() {
            const taskId = this.getAttribute('data-task-id');
            const isChecked = this.checked;
            
            const updatedSchedule = schedule.map(d => {
              if (d.date === self.currentDateStr) {
                d.tasks = d.tasks.map(t => {
                  if (t.id === taskId) {
                    t.completed = isChecked;
                  }
                  return t;
                });
              }
              return d;
            });
            
            localStorage.setItem('cat_daily_schedule', JSON.stringify(updatedSchedule));
            self.renderExecutionSheet();
            self.uploadDataToSupabase(true); // background sync timetable checks
          });
        });
      } else {
        tasksContainer.innerHTML = `
          <div class="empty-state">
            <p>No study tasks scheduled for today.</p>
            <button class="scheduler-trigger-btn" onclick="document.getElementById('schedulerModal').classList.remove('hidden')">
              Auto-Schedule Prep Cycle
            </button>
          </div>
        `;
      }

      document.getElementById('execPrevDayBtn').onclick = () => {
        const cur = new Date(self.currentDateStr);
        cur.setDate(cur.getDate() - 1);
        self.currentDateStr = cur.toISOString().split('T')[0];
        self.updateDailyExamsList();
        self.renderExecutionSheet();
      };

      document.getElementById('execNextDayBtn').onclick = () => {
        const cur = new Date(self.currentDateStr);
        cur.setDate(cur.getDate() + 1);
        self.currentDateStr = cur.toISOString().split('T')[0];
        self.updateDailyExamsList();
        self.renderExecutionSheet();
      };

      document.getElementById('openSchedulerModalBtn').onclick = () => {
        const config = JSON.parse(localStorage.getItem('cat_scheduler_config') || '{}');
        document.getElementById('schedDailyHours').value = config.dailyHours || 3;
        document.getElementById('schedExamDate').value = config.examDate || "2026-11-29";
        
        document.querySelectorAll('.sched-strength-cb').forEach(cb => {
          cb.checked = (config.strengths || []).includes(cb.value);
        });
        document.querySelectorAll('.sched-weakness-cb').forEach(cb => {
          cb.checked = (config.weaknesses || []).includes(cb.value);
        });

        document.getElementById('schedulerModal').classList.remove('hidden');
      };

      document.getElementById('saveSchedulerConfigBtn').onclick = () => {
        const hours = parseFloat(document.getElementById('schedDailyHours').value);
        const examDate = document.getElementById('schedExamDate').value;
        const strengths = [];
        document.querySelectorAll('.sched-strength-cb:checked').forEach(cb => strengths.push(cb.value));
        const weaknesses = [];
        document.querySelectorAll('.sched-weakness-cb:checked').forEach(cb => weaknesses.push(cb.value));

        const newConfig = {
          startDate: "2026-07-18",
          examDate: examDate,
          dailyHours: hours,
          strengths: strengths,
          weaknesses: weaknesses
        };

        localStorage.setItem('cat_scheduler_config', JSON.stringify(newConfig));
        const calendar = window.CAT_SCHEDULER.generateSchedule(newConfig);
        localStorage.setItem('cat_daily_schedule', JSON.stringify(calendar));

        document.getElementById('schedulerModal').classList.add('hidden');
        self.renderExecutionSheet();
        self.uploadDataToSupabase(true); // upload fresh timetable preferences
      };
    },

    // ==================== MOCK DIAGNOSTICS & LOGGING ====================
    renderMockAnalysis: function() {
      const self = this;
      const listContainer = document.getElementById('mockHistoryList');
      const diagnosticsContainer = document.getElementById('mockDiagnosticsContainer');
      const logModal = document.getElementById('mockLogModal');

      const diagnosis = window.CAT_ANALYSIS.analyzePatterns();
      diagnosticsContainer.innerHTML = '';

      if (diagnosis.hasData) {
        let warningsHtml = diagnosis.warnings.map(w => `<div class="warn-item">⚠️ ${w}</div>`).join('');
        let strengthsHtml = diagnosis.strengths.map(s => `<div class="strength-item">✓ ${s}</div>`).join('');
        let actionsHtml = diagnosis.actionPlan.map(a => `<li>${a}</li>`).join('');

        diagnosticsContainer.innerHTML = `
          <div class="diagnosis-summary-box">${diagnosis.summary}</div>
          <div class="diagnosis-grid">
            <div class="diagnosis-warn-card">
              <div class="diagnosis-card-title">Warnings & Patterns Detected</div>
              ${warningsHtml || '<div class="empty-state">No warning patterns detected yet. Good pace!</div>'}
            </div>
            <div class="diagnosis-strength-card">
              <div class="diagnosis-card-title">Identified Strengths</div>
              ${strengthsHtml}
            </div>
          </div>
          <div class="diagnosis-actions-card">
            <div class="diagnosis-card-title">Dynamic Action Items</div>
            <ul>${actionsHtml}</ul>
          </div>
        `;
      } else {
        diagnosticsContainer.innerHTML = `<div class="empty-state">No mock details recorded. Log a mock test below to check diagnostic analysis.</div>`;
      }

      const mocks = JSON.parse(localStorage.getItem('cat_mocks') || '[]');
      mocks.sort((a, b) => new Date(b.date) - new Date(a.date));

      listContainer.innerHTML = '';
      if (mocks.length > 0) {
        mocks.forEach(m => {
          const qaTxt = m.qaScore !== null ? m.qaScore : '-';
          const dilrTxt = m.dilrScore !== null ? m.dilrScore : '-';
          const varcTxt = m.varcScore !== null ? m.varcScore : '-';
          const isReviewable = m.questions !== undefined;

          const card = document.createElement('div');
          card.className = 'mock-record-card';
          card.innerHTML = `
            <div class="mock-record-header">
              <span class="mock-record-name">${m.name}</span>
              <span class="mock-record-date">${m.date}</span>
            </div>
            <div class="mock-record-stats-row">
              <div class="mock-stat-col">Score: <b>${m.totalScore}</b></div>
              <div class="mock-stat-col">Percentile: <b>${m.percentile}%</b></div>
              <div class="mock-stat-col">QA: <b>${qaTxt}</b></div>
              <div class="mock-stat-col">DILR: <b>${dilrTxt}</b></div>
              <div class="mock-stat-col">VARC: <b>${varcTxt}</b></div>
            </div>
            <div class="mock-record-errors-row">
              <span class="error-badge error-badge-silly">Silly: ${m.errors ? m.errors.silly || 0 : 0}</span>
              <span class="error-badge error-badge-concept">Conceptual: ${m.errors ? m.errors.conceptual || 0 : 0}</span>
              <span class="error-badge error-badge-time">Time: ${m.errors ? m.errors.time || 0 : 0}</span>
              <span class="error-badge error-badge-guess">Guessed: ${m.errors ? m.errors.guessed || 0 : 0}</span>
            </div>
            <div class="mock-record-actions" style="margin-bottom: 0.5rem;">
              <b>Action Items:</b> ${m.actionItems || 'None logged.'}
            </div>
            ${isReviewable ? `
              <button class="btn btn-secondary review-paper-btn" data-attempt-id="${m.id}" style="font-size: 0.75rem; padding: 0.25rem 0.5rem; width: 100%; display: block; text-align: center;">
                Review Attempt Paper & Solutions
              </button>
            ` : ''}
          `;
          listContainer.appendChild(card);
        });

        listContainer.querySelectorAll('.review-paper-btn').forEach(btn => {
          btn.onclick = () => {
            const attemptId = btn.getAttribute('data-attempt-id');
            self.openMockReviewModal(attemptId);
          };
        });
      } else {
        listContainer.innerHTML = `<div class="empty-state">No mocks or sectional tests have been recorded.</div>`;
      }

      document.getElementById('openLogMockModalBtn').onclick = () => {
        logModal.classList.remove('hidden');
      };

      document.getElementById('saveMockLogBtn').onclick = () => {
        const name = document.getElementById('mockLogName').value || 'CAT Practice Mock';
        const type = document.getElementById('mockLogType').value;
        const date = document.getElementById('mockLogDate').value || new Date().toISOString().split('T')[0];
        const qa = document.getElementById('mockLogQA').value ? parseInt(document.getElementById('mockLogQA').value) : null;
        const dilr = document.getElementById('mockLogDILR').value ? parseInt(document.getElementById('mockLogDILR').value) : null;
        const varc = document.getElementById('mockLogVARC').value ? parseInt(document.getElementById('mockLogVARC').value) : null;
        const total = (qa || 0) + (dilr || 0) + (varc || 0);
        const percentileVal = parseFloat(document.getElementById('mockLogPercentile').value || 90.0);

        const silly = parseInt(document.getElementById('mockLogSilly').value || 0);
        const concept = parseInt(document.getElementById('mockLogConcept').value || 0);
        const time = parseInt(document.getElementById('mockLogTime').value || 0);
        const guess = parseInt(document.getElementById('mockLogGuess').value || 0);
        const actionItems = document.getElementById('mockLogActionItems').value || "";

        const mockRecord = {
          id: 'mock_manual_' + Date.now(),
          examId: 'mock_manual',
          name: name,
          type: type,
          date: date,
          qaScore: qa,
          dilrScore: dilr,
          varcScore: varc,
          totalScore: total,
          percentile: percentileVal,
          errors: { silly, conceptual: concept, time, guessed: guess },
          actionItems: actionItems
        };

        window.CAT_ANALYSIS.addMockRecord(mockRecord);
        logModal.classList.add('hidden');
        self.renderMockAnalysis();
        self.uploadDataToSupabase(true); // upload manually logged mock
      };
    },

    // ==================== ERROR NOTEBOOK PAGE ====================
    renderErrorNotebook: function() {
      const self = this;
      const tableBody = document.getElementById('errorNotebookBody');
      const sectionFilter = document.getElementById('errorSectionFilter');
      const searchInput = document.getElementById('errorSearchInput');

      const renderList = () => {
        const errors = window.CAT_ERRORBOOK.getErrors();
        const filterVal = sectionFilter.value;
        const query = searchInput.value.toLowerCase().trim();

        tableBody.innerHTML = '';
        const filtered = errors.filter(e => {
          const matchSection = filterVal === 'All' || e.section === filterVal;
          const matchSearch = e.question.toLowerCase().includes(query) || 
                              e.topic.toLowerCase().includes(query) || 
                              e.subtopic.toLowerCase().includes(query);
          return matchSection && matchSearch;
        });

        if (filtered.length > 0) {
          filtered.forEach(e => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
              <td><span class="tag tag-${e.section.toLowerCase()}">${e.section}</span></td>
              <td><b>${e.topic}</b><br><small>${e.subtopic}</small></td>
              <td class="table-question-preview">${e.question.replace(/<[^>]*>/g, '').substring(0, 75)}...</td>
              <td><span class="badge badge-${e.errorCategory.toLowerCase().replace(' ', '-')}">${e.errorCategory}</span></td>
              <td><span class="status-indicator ${e.resolved ? 'resolved' : 'unresolved'}">${e.resolved ? '✓ Corrected' : '✗ Unresolved'}</span></td>
              <td>
                <button class="err-action-btn err-attempt-btn" data-id="${e.id}">Re-attempt</button>
                <button class="err-action-btn err-delete-btn" data-id="${e.id}">Delete</button>
              </td>
            `;
            tableBody.appendChild(tr);
          });

          document.querySelectorAll('.err-delete-btn').forEach(btn => {
            btn.addEventListener('click', function() {
              const id = this.getAttribute('data-id');
              if (confirm("Are you sure you want to remove this question from your Error Notebook?")) {
                window.CAT_ERRORBOOK.deleteError(id);
                renderList();
                self.uploadDataToSupabase(true); // upload deletion
              }
            });
          });

          document.querySelectorAll('.err-attempt-btn').forEach(btn => {
            btn.addEventListener('click', function() {
              const id = this.getAttribute('data-id');
              self.openErrorReattempt(id, () => {
                renderList();
                self.uploadDataToSupabase(true); // upload corrected resolution
              });
            });
          });
        } else {
          tableBody.innerHTML = `<tr><td colspan="6" class="empty-state">No error notebook entries match the criteria.</td></tr>`;
        }
      };

      sectionFilter.onchange = renderList;
      searchInput.oninput = renderList;
      renderList();
    },

    openErrorReattempt: function(id, callback) {
      const modal = document.getElementById('reattemptModal');
      const qText = document.getElementById('reattemptQuestionText');
      const submitBtn = document.getElementById('submitReattemptBtn');
      const solutionCard = document.getElementById('reattemptSolutionCard');
      const userText = document.getElementById('reattemptAnswerInput');

      const errors = window.CAT_ERRORBOOK.getErrors();
      const err = errors.find(e => e.id === id);

      if (!err) return;

      qText.innerHTML = `
        <div class="reattempt-meta-header">
          <span class="tag tag-${err.section.toLowerCase()}">${err.section}</span>
          <span><b>Topic:</b> ${err.topic} | <b>Mistake Type:</b> ${err.errorCategory}</span>
        </div>
        <div class="reattempt-body-text">${err.question}</div>
      `;

      userText.value = '';
      solutionCard.classList.add('hidden');
      submitBtn.classList.remove('hidden');

      submitBtn.onclick = null;
      submitBtn.onclick = () => {
        const answerVal = userText.value.trim();
        const check = window.CAT_ERRORBOOK.attemptError(id, answerVal);
        if (check) {
          submitBtn.classList.add('hidden');
          solutionCard.innerHTML = `
            <div class="reattempt-result-badge ${check.correct ? 'correct' : 'incorrect'}">
              ${check.correct ? '✓ Excellent! You solved it correctly.' : `✗ Incorrect (Correct Answer was: <b>${check.correctAnswer}</b>)`}
            </div>
            <div class="reattempt-explanation-content">
              <b>Learning Point captured:</b><br>
              ${check.explanation}
            </div>
          `;
          solutionCard.classList.remove('hidden');
          if (callback) callback();
        }
      };
      modal.classList.remove('hidden');
    },

    // ==================== REVISION CHECKLISTS ====================
    renderRevisionHub: function() {
      const sundayList = window.CAT_REVISION.getSundayRevisionList();
      const monthlyList = window.CAT_REVISION.getMonthlyRevisionList();
      const sundayContainer = document.getElementById('sundayRevisionList');
      const monthlyContainer = document.getElementById('monthlyRevisionList');

      sundayContainer.innerHTML = '';
      monthlyContainer.innerHTML = '';

      sundayList.forEach(task => {
        const div = document.createElement('div');
        div.className = `revision-card ${task.completed ? 'completed' : ''}`;
        div.innerHTML = `
          <div class="revision-check-col">
            <input type="checkbox" class="revision-cb" data-task-id="${task.id}" ${task.completed ? 'checked' : ''}>
          </div>
          <div class="revision-details-col">
            <div class="revision-card-tag">${task.category}</div>
            <div class="revision-card-text">${task.text}</div>
          </div>
        `;
        sundayContainer.appendChild(div);
      });

      monthlyList.forEach(task => {
        const div = document.createElement('div');
        div.className = `revision-card ${task.completed ? 'completed' : ''}`;
        div.innerHTML = `
          <div class="revision-check-col">
            <input type="checkbox" class="revision-cb" data-task-id="${task.id}" ${task.completed ? 'checked' : ''}>
          </div>
          <div class="revision-details-col">
            <div class="revision-card-tag">${task.category}</div>
            <div class="revision-card-text">${task.text}</div>
          </div>
        `;
        monthlyContainer.appendChild(div);
      });

      document.querySelectorAll('.revision-cb').forEach(cb => {
        cb.addEventListener('change', function() {
          const card = this.closest('.revision-card');
          if (this.checked) {
            card.classList.add('completed');
          } else {
            card.classList.remove('completed');
          }
        });
      });
    },

    // ==================== B-SCHOOL CALL PREDICTOR ====================
    initBSchoolPredictor: function() {
      const self = this;
      const sliderOverall = document.getElementById('sliderOverall');
      const sliderVARC = document.getElementById('sliderVARC');
      const sliderDILR = document.getElementById('sliderDILR');
      const sliderQA = document.getElementById('sliderQA');
      const loadBtn = document.getElementById('loadLatestScoresBtn');

      if (!sliderOverall) return;

      const updateValues = () => {
        document.getElementById('valOverall').innerText = parseFloat(sliderOverall.value).toFixed(2) + '%';
        document.getElementById('valVARC').innerText = parseFloat(sliderVARC.value).toFixed(2) + '%';
        document.getElementById('valDILR').innerText = parseFloat(sliderDILR.value).toFixed(2) + '%';
        document.getElementById('valQA').innerText = parseFloat(sliderQA.value).toFixed(2) + '%';
        self.recalculateBSchoolCalls();
      };

      [sliderOverall, sliderVARC, sliderDILR, sliderQA].forEach(slider => {
        slider.addEventListener('input', updateValues);
      });

      if (loadBtn) {
        loadBtn.addEventListener('click', () => {
          self.loadPredictorFromLatestMock(false);
        });
      }

      this.loadPredictorFromLatestMock(true);
    },

    loadPredictorFromLatestMock: function(silent) {
      const mocks = JSON.parse(localStorage.getItem('cat_mocks') || '[]');
      const activeAttempts = mocks.filter(m => m.examId !== undefined || m.percentile !== undefined);
      
      if (activeAttempts.length > 0) {
        activeAttempts.sort((a, b) => b.id.localeCompare(a.id));
        const latest = activeAttempts[0];

        const overall = latest.percentile;
        let qa = overall;
        let dilr = overall;
        let varc = overall;

        if (latest.qaScore !== null && latest.dilrScore !== null && latest.varcScore !== null) {
          const total = (latest.qaScore || 0) + (latest.dilrScore || 0) + (latest.varcScore || 0);
          if (total > 0) {
            qa = Math.min(99.99, Math.max(70.0, Math.round(overall * (latest.qaScore / (total / 3)) * 100) / 100));
            dilr = Math.min(99.99, Math.max(70.0, Math.round(overall * (latest.dilrScore / (total / 3)) * 100) / 100));
            varc = Math.min(99.99, Math.max(70.0, Math.round(overall * (latest.varcScore / (total / 3)) * 100) / 100));
          }
        }

        document.getElementById('sliderOverall').value = overall;
        document.getElementById('sliderVARC').value = varc;
        document.getElementById('sliderDILR').value = dilr;
        document.getElementById('sliderQA').value = qa;

        if (!silent) {
          alert(`Loaded latest mock scores: Overall ${overall}%, VARC ${varc}%, DILR ${dilr}%, QA ${qa}%`);
        }
      } else {
        if (!silent) {
          alert("No mock exam attempts logged yet. Drag sliders to simulate cutoffs.");
        }
      }

      document.getElementById('valOverall').innerText = parseFloat(document.getElementById('sliderOverall').value).toFixed(2) + '%';
      document.getElementById('valVARC').innerText = parseFloat(document.getElementById('sliderVARC').value).toFixed(2) + '%';
      document.getElementById('valDILR').innerText = parseFloat(document.getElementById('sliderDILR').value).toFixed(2) + '%';
      document.getElementById('valQA').innerText = parseFloat(document.getElementById('sliderQA').value).toFixed(2) + '%';
      this.recalculateBSchoolCalls();
    },

    recalculateBSchoolCalls: function() {
      const overall = parseFloat(document.getElementById('sliderOverall').value);
      const varc = parseFloat(document.getElementById('sliderVARC').value);
      const dilr = parseFloat(document.getElementById('sliderDILR').value);
      const qa = parseFloat(document.getElementById('sliderQA').value);

      const colleges = [
        { name: "IIM Ahmedabad (IIM-A)", criteria: { overall: 99.5, sectional: 85 } },
        { name: "IIM Bangalore (IIM-B)", criteria: { overall: 99.0, sectional: 80 } },
        { name: "IIM Calcutta (IIM-C)", criteria: { overall: 99.3, sectional: 80 } },
        { name: "IIM Lucknow (IIM-L)", criteria: { overall: 98.0, sectional: 85 } },
        { name: "IIM Kozhikode (IIM-K)", criteria: { overall: 98.0, sectional: 80 } },
        { name: "IIM Indore (IIM-I)", criteria: { overall: 97.5, sectional: 80 } },
        { name: "IIM Mumbai (IIM-M)", criteria: { overall: 98.0, sectional: 80 } },
        { name: "IIM Shillong", criteria: { overall: 96.0, sectional: 75 } },
        { name: "IIM CAP / New IIMs", criteria: { overall: 92.0, sectional: 70 } },
        { name: "FMS Delhi", criteria: { overall: 98.5, sectional: 80, varcSpecial: 85 } },
        { name: "SPJIMR Mumbai", criteria: { overall: 97.0, sectional: 80 } },
        { name: "MDI Gurgaon", criteria: { overall: 96.0, sectional: 75 } },
        { name: "IIT Bombay (SJMSOM)", criteria: { overall: 98.5, sectional: 80 } },
        { name: "IIT Delhi (DMS)", criteria: { overall: 98.0, sectional: 80 } },
        { name: "IIT Kharagpur (VGSoM)", criteria: { overall: 95.0, sectional: 75 } },
        { name: "IMT Ghaziabad", criteria: { overall: 90.0, sectional: 0 } },
        { name: "IMI New Delhi", criteria: { overall: 88.0, sectional: 0 } },
        { name: "TAPMI Manipal", criteria: { overall: 85.0, sectional: 0 } },
        { name: "GIM Goa", criteria: { overall: 85.0, sectional: 0 } },
        { name: "Great Lakes", criteria: { overall: 85.0, sectional: 0 } }
      ];

      const eligible = [];
      const missed = [];

      colleges.forEach(col => {
        const checkSectional = (varc >= col.criteria.sectional && dilr >= col.criteria.sectional && qa >= col.criteria.sectional);
        const checkSpecialVarc = col.criteria.varcSpecial ? (varc >= col.criteria.varcSpecial) : true;
        const checkOverall = overall >= col.criteria.overall;

        if (checkOverall && checkSectional && checkSpecialVarc) {
          eligible.push(col);
        } else {
          const reasons = [];
          if (!checkOverall) reasons.push("Overall");
          if (!checkSectional) {
            const lowSec = [];
            if (varc < col.criteria.sectional) lowSec.push("VARC");
            if (dilr < col.criteria.sectional) lowSec.push("DILR");
            if (qa < col.criteria.sectional) lowSec.push("QA");
            reasons.push(lowSec.join("/") + " sectional");
          }
          if (!checkSpecialVarc) {
            reasons.push("VARC sectional");
          }
          missed.push({ name: col.name, reason: reasons.join(", ") });
        }
      });

      document.getElementById('eligibleCallsCount').innerText = eligible.length;
      document.getElementById('missedCallsCount').innerText = missed.length;

      const eligibleGrid = document.getElementById('eligibleCallsGrid');
      eligibleGrid.innerHTML = '';
      if (eligible.length > 0) {
        eligible.forEach(col => {
          eligibleGrid.innerHTML += `<span class="college-chip eligible">✓ ${col.name}</span>`;
        });
      } else {
        eligibleGrid.innerHTML = `<div style="font-size:0.8rem; color:var(--text-light); font-style:italic; padding:0.5rem 0; width:100%;">No eligible calls. Simulatate higher scores.</div>`;
      }

      const missedGrid = document.getElementById('missedCallsGrid');
      missedGrid.innerHTML = '';
      if (missed.length > 0) {
        missed.forEach(col => {
          missedGrid.innerHTML += `<span class="college-chip missed" title="Missed due to: ${col.reason}">✗ ${col.name} <small style="display:block; font-size:0.65rem; opacity:0.85; margin-top: 0.15rem;">(Missed ${col.reason})</small></span>`;
        });
      } else {
        missedGrid.innerHTML = `<div style="font-size:0.8rem; color:var(--text-light); font-style:italic; padding:0.5rem 0; width:100%;">No missed cutoffs! Balanced scoring.</div>`;
      }

      const guidanceBox = document.getElementById('predictorGuidanceBox');
      const scoresMap = [
        { name: "Quantitative Aptitude (QA)", val: qa, code: "QA" },
        { name: "Data Interpretation & LR (DILR)", val: dilr, code: "DILR" },
        { name: "Verbal Ability & RC (VARC)", val: varc, code: "VARC" }
      ];
      scoresMap.sort((a, b) => a.val - b.val);
      const weak = scoresMap[0];

      if (qa >= 95 && dilr >= 95 && varc >= 95) {
        guidanceBox.innerHTML = `
          <h4>🏆 Mastery Prep Strategy: Balanced Profile</h4>
          <p>Your sectional scores are exceptionally strong and balanced at <b>${weak.val.toFixed(2)}%+</b>. To convert calls at top programs like IIM Ahmedabad and Bangalore, maintain this rhythm by completing 1 full mock every 3 days. Focus heavily on reading editorials (Guardian, AEON) to sustain VARC speed and begin review sessions for current affairs and past projects for your Personal Interviews (PI).</p>
        `;
      } else {
        let adviceText = "";
        if (weak.code === "QA") {
          adviceText = `Your <b>Quantitative Aptitude (QA)</b> is your weakest sectional at <b>${qa.toFixed(2)}%</b>. Because top-tier IIMs (like IIM-A/B/C) mandate a minimum 80-85% sectional cutoff, this gap will block interview calls even with a 99.5%+ overall percentile. Focus on Arithmetic (Time & Work, Races) and Algebra basics. Target: Solve 15 Level 4/5 questions daily in the Syllabus tracker and review Sunday formula sheets.`;
        } else if (weak.code === "DILR") {
          adviceText = `Your <b>Logical Reasoning & DI (DILR)</b> is your weakest sectional at <b>${dilr.toFixed(2)}%</b>. DILR thresholds are high and the section is highly unpredictable. Focus on solving 4-set Venn diagrams and linear/circular arrangements. Target: Solve 2 mixed DILR sets (Level 3/4) daily, document all mistakes in your Error Notebook, and re-attempt them every Sunday.`;
        } else {
          adviceText = `Your <b>Verbal Ability & RC (VARC)</b> is your weakest sectional at <b>${varc.toFixed(2)}%</b>. FMS Delhi and IIM-C place huge weightage on VARC scores. Focus on dense philosophical and sociological passages. Target: Practice 1 RC passage daily, focusing on Inference and EXCEPT question types, aiming for at least 80% accuracy in practice drills.`;
        }

        guidanceBox.innerHTML = `
          <h4>💡 Weaker Section Analysis: Focus on ${weak.name}</h4>
          <p>${adviceText}</p>
        `;
      }
    },

    // 11. Helper formatting utilities
    formatDatePretty: function(dateString) {
      const parts = dateString.split('-');
      const d = new Date(parts[0], parts[1] - 1, parts[2]);
      const options = { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' };
      return d.toLocaleDateString('en-US', options);
    }
  };

  window.CAT_APP.init();
});
