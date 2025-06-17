import { Storage } from '../../utils/storage.js';

export class GoalsManager {
    constructor() {
        this.goals = [];
        this.setupEventListeners();
    }

    initialize(goals = []) {
        this.goals = goals;
        this.updateDisplay();
    }

    setupEventListeners() {
        // Goals functionality
        const addGoalBtn = document.getElementById('addGoalBtn');
        const goalInput = document.getElementById('goalInput');
        const saveGoalBtn = document.getElementById('saveGoalBtn');
        const cancelGoalBtn = document.getElementById('cancelGoalBtn');

        if (addGoalBtn) {
            addGoalBtn.addEventListener('click', () => {
                this.showAddGoalForm();
            });
        }

        if (saveGoalBtn) {
            saveGoalBtn.addEventListener('click', () => {
                this.saveGoal();
            });
        }

        if (cancelGoalBtn) {
            cancelGoalBtn.addEventListener('click', () => {
                this.hideAddGoalForm();
            });
        }

        if (goalInput) {
            goalInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.saveGoal();
                }
            });
        }
    }

    showAddGoalForm() {
        const addGoalForm = document.getElementById('addGoalForm');
        const goalInput = document.getElementById('goalInput');

        if (addGoalForm) {
            addGoalForm.style.display = 'block';
            if (goalInput) {
                goalInput.focus();
            }
        }
    }

    hideAddGoalForm() {
        const addGoalForm = document.getElementById('addGoalForm');
        const goalInput = document.getElementById('goalInput');

        if (addGoalForm) {
            addGoalForm.style.display = 'none';
            if (goalInput) {
                goalInput.value = '';
            }
        }
    }

    saveGoal() {
        const goalInput = document.getElementById('goalInput');
        if (goalInput && goalInput.value.trim()) {
            const newGoal = {
                id: Date.now(),
                text: goalInput.value.trim(),
                completed: false,
                createdAt: new Date().toISOString()
            };

            this.goals.push(newGoal);
            this.saveToStorage();
            this.updateDisplay();
            this.hideAddGoalForm();

            return newGoal;
        }
        return null;
    }

    removeGoal(goalId) {
        this.goals = this.goals.filter(goal => goal.id !== goalId);
        this.saveToStorage();
        this.updateDisplay();
    }

    toggleGoalCompletion(goalId) {
        const goal = this.goals.find(g => g.id === goalId);
        if (goal) {
            goal.completed = !goal.completed;
            this.saveToStorage();
            this.updateDisplay();
        }
    }

    updateDisplay() {
        const goalsList = document.getElementById('goalsList');
        const noGoalsMessage = document.getElementById('noGoalsMessage');

        if (!goalsList) return;

        // Clear current goals
        goalsList.innerHTML = '';

        if (this.goals.length === 0) {
            if (noGoalsMessage) {
                noGoalsMessage.style.display = 'block';
            }
        } else {
            if (noGoalsMessage) {
                noGoalsMessage.style.display = 'none';
            }

            this.goals.forEach(goal => {
                const goalElement = document.createElement('div');
                goalElement.className = 'goal-item';
                goalElement.innerHTML = `
                    <span class="goal-text ${goal.completed ? 'completed' : ''}">${goal.text}</span>
                    <div class="goal-actions">
                        <button class="btn-toggle-goal" onclick="window.goalsManager?.toggleGoalCompletion(${goal.id})" title="Toggle completion">
                            ${goal.completed ? '✓' : '○'}
                        </button>
                        <button class="btn-remove-goal" onclick="window.goalsManager?.removeGoal(${goal.id})" title="Remove goal">&times;</button>
                    </div>
                `;
                goalsList.appendChild(goalElement);
            });
        }
    }

    saveToStorage() {
        Storage.saveGoals(this.goals);
    }

    // Getters
    getGoals() {
        return [...this.goals];
    }

    getCompletedGoals() {
        return this.goals.filter(goal => goal.completed);
    }

    getPendingGoals() {
        return this.goals.filter(goal => !goal.completed);
    }

    getGoalCount() {
        return this.goals.length;
    }

    // Bulk operations
    clearCompleted() {
        this.goals = this.goals.filter(goal => !goal.completed);
        this.saveToStorage();
        this.updateDisplay();
    }

    clearAll() {
        this.goals = [];
        this.saveToStorage();
        this.updateDisplay();
    }

    // Export/Import
    exportGoals() {
        return {
            goals: this.goals,
            exportDate: new Date().toISOString(),
            totalCount: this.goals.length,
            completedCount: this.getCompletedGoals().length
        };
    }

    importGoals(goalsData) {
        if (goalsData && Array.isArray(goalsData.goals)) {
            this.goals = goalsData.goals;
            this.saveToStorage();
            this.updateDisplay();
            return true;
        }
        return false;
    }

    destroy() {
        // Cleanup if needed
        this.goals = [];
    }
} 