document.addEventListener('DOMContentLoaded', function() {
  let isPremium = false;
  let isWorkoutActive = false;
  let timer = null;
  let seconds = 0;
  let currentWorkout = null;
  
  const PAYMENT_LINK = "https://dub.sh/profitness";
  const UNLOCK_CODE = "xyz";

  const workouts = [
    {
      id: 1,
      name: 'Quick HIIT',
      duration: 180, // 3 minutes
      free: true,
      exercises: [
        { name: 'Jumping Jacks', duration: 30 },
        { name: 'Push-ups', duration: 30 },
        { name: 'Rest', duration: 30 },
        { name: 'Mountain Climbers', duration: 30 },
        { name: 'Squats', duration: 30 },
        { name: 'Final Rest', duration: 30 }
      ]
    },
    {
      id: 2,
      name: 'Premium Full Body',
      duration: 300, // 5 minutes
      free: false,
      exercises: [
        { name: 'Burpees', duration: 45 },
        { name: 'Rest', duration: 15 },
        { name: 'Diamond Push-ups', duration: 45 },
        { name: 'Rest', duration: 15 },
        { name: 'Jump Squats', duration: 45 },
        { name: 'Rest', duration: 15 },
        { name: 'Plank Hold', duration: 45 },
        { name: 'Final Rest', duration: 15 }
      ]
    }
  ];

  // Initialize
  chrome.storage.sync.get(['premiumStatus', 'workoutStats'], function(result) {
    isPremium = result.premiumStatus || false;
    updateUI();
    updateStats(result.workoutStats || {});
  });

  // UI Update Functions
  function updateUI() {
    updatePremiumStatus();
    renderWorkouts();
    updateTimerDisplay();
  }

  function updatePremiumStatus() {
    const statusDiv = document.getElementById('premiumStatus');
    const premiumSection = document.getElementById('premiumSection');
    
    if (isPremium) {
      statusDiv.innerHTML = '<p style="color: #6366f1;">Premium Active ✨</p>';
      premiumSection.style.display = 'none';
    } else {
      statusDiv.innerHTML = '<p>Free Version</p>';
      premiumSection.style.display = 'block';
    }
  }

  function renderWorkouts() {
    const workoutsList = document.getElementById('workoutsList');
    workoutsList.innerHTML = workouts.map(workout => `
      <div class="workout-card ${currentWorkout?.id === workout.id ? 'active' : ''} 
           ${!workout.free && !isPremium ? 'locked' : ''}"
           onclick="selectWorkout(${workout.id})">
        <h3>${workout.name}</h3>
        <p>Duration: ${Math.floor(workout.duration / 60)}:${(workout.duration % 60).toString().padStart(2, '0')}</p>
        <p>Exercises: ${workout.exercises.length}</p>
      </div>
    `).join('');
  }

  function updateTimerDisplay() {
    const display = document.getElementById('timerDisplay');
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    display.textContent = `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  function updateExerciseList() {
    if (!currentWorkout) return;
    
    const exerciseList = document.getElementById('exerciseList');
    let totalTime = 0;
    
    exerciseList.innerHTML = currentWorkout.exercises.map((exercise, index) => {
      const isActive = totalTime <= seconds && seconds < (totalTime + exercise.duration);
      totalTime += exercise.duration;
      return `
        <div class="exercise-item ${totalTime <= seconds ? 'completed' : ''} ${isActive ? 'active' : ''}">
          ${exercise.name} (${exercise.duration}s)
        </div>
      `;
    }).join('');

    // Update progress bar
    const progressFill = document.getElementById('progressFill');
    const progress = (seconds / currentWorkout.duration) * 100;
    progressFill.style.width = `${Math.min(progress, 100)}%`;
  }

  // Timer Functions
  function startTimer() {
    if (!timer) {
      timer = setInterval(() => {
        seconds++;
        updateTimerDisplay();
        updateExerciseList();
        
        if (seconds >= currentWorkout.duration) {
          completeWorkout();
        }
      }, 1000);
      
      document.getElementById('startStopBtn').textContent = 'Pause';
      isWorkoutActive = true;
    } else {
      clearInterval(timer);
      timer = null;
      document.getElementById('startStopBtn').textContent = 'Resume';
      isWorkoutActive = false;
    }
  }

  function resetTimer() {
    clearInterval(timer);
    timer = null;
    seconds = 0;
    isWorkoutActive = false;
    document.getElementById('startStopBtn').textContent = 'Start Workout';
    updateTimerDisplay();
    updateExerciseList();
  }

  function completeWorkout() {
    clearInterval(timer);
    timer = null;
    
    // Update stats
    chrome.storage.sync.get(['workoutStats'], function(result) {
      const stats = result.workoutStats || {};
      const today = new Date().toISOString().split('T')[0];
      
      stats[today] = (stats[today] || 0) + 1;
      chrome.storage.sync.set({ workoutStats: stats });
      updateStats(stats);
    });

    // Show completion notification
    chrome.runtime.sendMessage({
      action: 'showNotification',
      title: 'Workout Complete!',
      message: `You completed ${currentWorkout.name}!`
    });

    resetTimer();
  }

  // Event Listeners
  document.getElementById('startStopBtn').addEventListener('click', startTimer);
  document.getElementById('resetBtn').addEventListener('click', resetTimer);

  // Global Functions
  window.selectWorkout = function(workoutId) {
    const workout = workouts.find(w => w.id === workoutId);
    if (!workout || (!workout.free && !isPremium)) return;

    currentWorkout = workout;
    seconds = 0;
    document.getElementById('timerSection').style.display = 'block';
    resetTimer();
    renderWorkouts();
    updateExerciseList();
  };

  window.checkCode = function() {
    const code = document.getElementById('unlockCode').value.toLowerCase();
    if (code === UNLOCK_CODE) {
      isPremium = true;
      chrome.storage.sync.set({ premiumStatus: true });
      updateUI();
    }
  };

  window.goToPayment = function() {
    window.open(PAYMENT_LINK, '_blank');
  };

  function updateStats(stats) {
    const statsContent = document.getElementById('statsContent');
    const today = new Date().toISOString().split('T')[0];
    const workoutsToday = stats[today] || 0;
    const totalWorkouts = Object.values(stats).reduce((a, b) => a + b, 0);
    
    statsContent.innerHTML = `
      <p>Today's Workouts: ${workoutsToday}</p>
      <p>Total Workouts: ${totalWorkouts}</p>
    `;
  }
});
