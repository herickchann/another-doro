import { Storage } from '../../utils/storage.js';
import { DOM_IDS, CSS_CLASSES, getElementById } from '../../utils/domConstants.js';

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
        // Goals functionality - Note: Add Goal button is now created dynamically in updateDisplay()
        const goalInput = getElementById(DOM_IDS.GOAL_INPUT);
        const saveGoalBtn = getElementById(DOM_IDS.SAVE_GOAL_BTN);
        const cancelGoalBtn = getElementById(DOM_IDS.CANCEL_GOAL_BTN);

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
        const addGoalForm = getElementById(DOM_IDS.ADD_GOAL_FORM);
        const goalInput = getElementById(DOM_IDS.GOAL_INPUT);

        if (addGoalForm) {
            addGoalForm.style.display = 'block';
            if (goalInput) {
                goalInput.focus();
            }
        }
    }

    hideAddGoalForm() {
        const addGoalForm = getElementById(DOM_IDS.ADD_GOAL_FORM);
        const goalInput = getElementById(DOM_IDS.GOAL_INPUT);

        if (addGoalForm) {
            addGoalForm.style.display = 'none';
            if (goalInput) {
                goalInput.value = '';
            }
        }
    }

    saveGoal() {
        const goalInput = getElementById(DOM_IDS.GOAL_INPUT);
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
        const goalsList = getElementById(DOM_IDS.GOALS_LIST);
        const noGoalsMessage = getElementById(DOM_IDS.NO_GOALS_MESSAGE);

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
                goalElement.className = `${CSS_CLASSES.GOAL_ITEM} ${goal.completed ? CSS_CLASSES.COMPLETED : ''}`;
                goalElement.innerHTML = `
                    <div class="${CSS_CLASSES.GOAL_CHECKBOX} ${goal.completed ? CSS_CLASSES.COMPLETED : ''}" onclick="window.goalsManager?.toggleGoalCompletion(${goal.id})" title="Toggle completion"></div>
                    <span class="${CSS_CLASSES.GOAL_TEXT}">${goal.text}</span>
                    <button class="${CSS_CLASSES.GOAL_DELETE}" onclick="window.goalsManager?.removeGoal(${goal.id})" title="Remove goal">&times;</button>
                `;
                goalsList.appendChild(goalElement);
            });
        }

        // Always add the "Add Goal" button at the bottom
        this.addAddGoalButton(goalsList);
    }

    addAddGoalButton(goalsList) {
        const addGoalButton = document.createElement('button');
        addGoalButton.className = 'btn-add-goal-inline';
        addGoalButton.id = DOM_IDS.ADD_GOAL_BTN;

        // Get the hotkey hint
        const hotkeyHint = this.getHotkeyHint();

        addGoalButton.innerHTML = `
            <div class="add-goal-content">
                <span class="add-goal-plus">+</span>
                <span class="add-goal-text">Add another goal</span>
                ${hotkeyHint ? `<span class="add-goal-hotkey">${hotkeyHint}</span>` : ''}
            </div>
        `;

        addGoalButton.addEventListener('click', () => {
            this.showAddGoalForm();
        });

        goalsList.appendChild(addGoalButton);
    }

    getHotkeyHint() {
        // Try to get the hotkey from current settings
        if (window.currentSettings && window.currentSettings.hotkeys && window.currentSettings.hotkeys.addGoal) {
            return window.currentSettings.hotkeys.addGoal;
        }

        // Try to get from app instance if available
        if (window.app && window.app.currentSettings && window.app.currentSettings.hotkeys && window.app.currentSettings.hotkeys.addGoal) {
            return window.app.currentSettings.hotkeys.addGoal;
        }

        return null; // No hotkey set
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