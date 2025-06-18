import { Storage } from '../../utils/storage.js';
import { DOM_IDS, CSS_CLASSES, getElementById } from '../../utils/domConstants.js';
import { MarkdownParser } from '../../utils/markdown.js';

export class GoalsManager {
    constructor() {
        this.goals = [];
        this.editingGoalId = null;
        this.currentHotkey = null;
        this.setupEventListeners();
    }

    initialize(goals = []) {
        this.goals = goals;
        this.updateDisplay();
    }

    // Update hotkey and refresh button display
    updateHotkey(newHotkey) {
        this.currentHotkey = newHotkey;
        this.refreshAddGoalButton();
    }

    // Refresh just the add goal button without rebuilding the entire display
    refreshAddGoalButton() {
        const existingButton = getElementById(DOM_IDS.ADD_GOAL_BTN);
        if (existingButton) {
            this.addAddGoalButton();
        }
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
            goalInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.saveGoal();
                } else if (e.key === 'Escape') {
                    this.hideAddGoalForm();
                }
            });

            // Auto-resize textarea as user types
            goalInput.addEventListener('input', () => {
                goalInput.style.height = 'auto';
                goalInput.style.height = Math.max(80, goalInput.scrollHeight) + 'px';
            });
        }
    }

    showAddGoalForm() {
        const addGoalForm = getElementById(DOM_IDS.ADD_GOAL_FORM);
        const goalInput = getElementById(DOM_IDS.GOAL_INPUT);
        const addGoalBtn = getElementById(DOM_IDS.ADD_GOAL_BTN);

        // Hide the add goal button and show the form
        if (addGoalBtn) {
            addGoalBtn.style.display = 'none';
        }

        if (addGoalForm) {
            addGoalForm.style.display = 'block';
            if (goalInput) {
                goalInput.focus();
                // Auto-resize textarea to fit content
                goalInput.style.height = 'auto';
                goalInput.style.height = Math.max(80, goalInput.scrollHeight) + 'px';
            }
        }
    }

    hideAddGoalForm() {
        const addGoalForm = getElementById(DOM_IDS.ADD_GOAL_FORM);
        const goalInput = getElementById(DOM_IDS.GOAL_INPUT);
        const addGoalBtn = getElementById(DOM_IDS.ADD_GOAL_BTN);

        if (addGoalForm) {
            addGoalForm.style.display = 'none';
            if (goalInput) {
                goalInput.value = '';
                goalInput.style.height = '80px'; // Reset height
            }
        }

        // Show the add goal button again
        if (addGoalBtn) {
            addGoalBtn.style.display = 'block';
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

    editGoal(goalId) {
        // Cancel any existing edit
        this.cancelEdit();

        const goal = this.goals.find(g => g.id === goalId);
        if (!goal) return;

        this.editingGoalId = goalId;
        const goalElement = document.querySelector(`[data-goal-id="${goalId}"]`);
        if (!goalElement) return;

        const goalTextElement = goalElement.querySelector('.goal-text');
        if (!goalTextElement) return;

        // Create inline edit textarea
        const textarea = document.createElement('textarea');
        textarea.className = 'goal-edit-input';
        textarea.value = goal.text;
        textarea.rows = Math.max(1, goal.text.split('\n').length);

        // Style the textarea
        textarea.style.cssText = `
            width: 100%;
            background: var(--surface-color);
            border: 1px solid var(--primary-color);
            border-radius: 4px;
            padding: 8px;
            color: var(--text-primary);
            font-size: 14px;
            font-family: inherit;
            line-height: 1.4;
            resize: vertical;
            min-height: 32px;
            outline: none;
            box-shadow: 0 0 0 2px rgba(var(--primary-color-rgb), 0.2);
        `;

        // Auto-resize function
        const autoResize = () => {
            textarea.style.height = 'auto';
            textarea.style.height = Math.max(32, textarea.scrollHeight) + 'px';
        };

        // Event handlers
        textarea.addEventListener('input', autoResize);
        textarea.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.saveEdit(goalId, textarea.value);
            } else if (e.key === 'Escape') {
                this.cancelEdit();
            }
        });

        // Handle clicking outside to save
        textarea.addEventListener('blur', () => {
            // Small delay to allow for button clicks
            setTimeout(() => {
                if (this.editingGoalId === goalId) {
                    this.saveEdit(goalId, textarea.value);
                }
            }, 100);
        });

        // Replace goal text with textarea
        goalTextElement.style.display = 'none';
        goalTextElement.parentNode.insertBefore(textarea, goalTextElement.nextSibling);

        // Focus and select all text
        textarea.focus();
        textarea.select();
        autoResize();
    }

    saveEdit(goalId, newText) {
        if (!newText.trim()) {
            this.cancelEdit();
            return;
        }

        const goal = this.goals.find(g => g.id === goalId);
        if (goal) {
            goal.text = newText.trim();
            goal.updatedAt = new Date().toISOString();
            this.saveToStorage();
        }

        this.cancelEdit();
        this.updateDisplay();
    }

    cancelEdit() {
        if (this.editingGoalId) {
            const goalElement = document.querySelector(`[data-goal-id="${this.editingGoalId}"]`);
            if (goalElement) {
                const textarea = goalElement.querySelector('.goal-edit-input');
                const goalTextElement = goalElement.querySelector('.goal-text');

                if (textarea) {
                    textarea.remove();
                }
                if (goalTextElement) {
                    goalTextElement.style.display = '';
                }
            }
            this.editingGoalId = null;
        }
    }

    removeGoal(goalId) {
        // Cancel edit if we're editing this goal
        if (this.editingGoalId === goalId) {
            this.cancelEdit();
        }

        this.goals = this.goals.filter(goal => goal.id !== goalId);
        this.saveToStorage();
        this.updateDisplay();
    }

    toggleGoalCompletion(goalId) {
        // Cancel edit if we're editing this goal
        if (this.editingGoalId === goalId) {
            this.cancelEdit();
        }

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
        const goalsHeader = document.querySelector('.goals-header');

        if (!goalsList) return;

        // Clear current goals
        goalsList.innerHTML = '';

        if (this.goals.length === 0) {
            // Hide only the goals list when there are no goals
            if (goalsList) {
                goalsList.style.display = 'none';
            }
        } else {
            // Show the goals list when there are goals
            if (goalsList) {
                goalsList.style.display = 'block';
            }

            if (noGoalsMessage) {
                noGoalsMessage.style.display = 'none';
            }

            this.goals.forEach(goal => {
                const goalElement = document.createElement('div');
                goalElement.className = `${CSS_CLASSES.GOAL_ITEM} ${goal.completed ? CSS_CLASSES.COMPLETED : ''}`;
                goalElement.setAttribute('data-goal-id', goal.id);

                // Parse markdown for display
                const parsedText = MarkdownParser.parse(goal.text);

                goalElement.innerHTML = `
                    <div class="${CSS_CLASSES.GOAL_CHECKBOX} ${goal.completed ? CSS_CLASSES.COMPLETED : ''}" onclick="window.goalsManager?.toggleGoalCompletion(${goal.id})" title="Toggle completion"></div>
                    <span class="${CSS_CLASSES.GOAL_TEXT}" ondblclick="window.goalsManager?.editGoal(${goal.id})" title="Double-click to edit">${parsedText}</span>
                    <button class="${CSS_CLASSES.GOAL_DELETE}" onclick="window.goalsManager?.removeGoal(${goal.id})" title="Remove goal">&times;</button>
                `;
                goalsList.appendChild(goalElement);
            });
        }

        // Always add the "Add Goal" button at the bottom of the goals section
        this.addAddGoalButton();
    }

    addAddGoalButton() {
        const goalsSection = document.querySelector('.goals-section');
        const addGoalForm = getElementById(DOM_IDS.ADD_GOAL_FORM);

        if (!goalsSection || !addGoalForm) return;

        // Remove any existing add goal button
        const existingButton = getElementById(DOM_IDS.ADD_GOAL_BTN);
        if (existingButton) {
            existingButton.remove();
        }

        const addGoalButton = document.createElement('button');
        addGoalButton.className = 'btn-add-goal-inline';
        addGoalButton.id = DOM_IDS.ADD_GOAL_BTN;

        // Get the current hotkey hint
        const hotkeyHint = this.getHotkeyHint();

        addGoalButton.innerHTML = `
            <div class="add-goal-content">
                <span class="add-goal-plus">+</span>
                <span class="add-goal-text">Add goal</span>
                ${hotkeyHint ? `<span class="add-goal-hotkey">${hotkeyHint}</span>` : ''}
            </div>
        `;

        addGoalButton.addEventListener('click', () => {
            this.showAddGoalForm();
        });

        // Insert the button right before the add-goal-form
        goalsSection.insertBefore(addGoalButton, addGoalForm);
    }



    getHotkeyHint() {
        // First check our stored hotkey
        if (this.currentHotkey) {
            return this.currentHotkey;
        }

        // Try to get the hotkey from current settings via multiple paths
        let hotkey = null;

        // Try window.app first (most reliable)
        if (window.app && window.app.currentSettings && window.app.currentSettings.hotkeys) {
            hotkey = window.app.currentSettings.hotkeys.addGoal;
        }

        // Fallback to window.currentSettings
        if (!hotkey && window.currentSettings && window.currentSettings.hotkeys) {
            hotkey = window.currentSettings.hotkeys.addGoal;
        }

        // Cache the hotkey for future use
        if (hotkey) {
            this.currentHotkey = hotkey;
        }

        return hotkey || null;
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
        // Clear any ongoing edits
        this.cancelEdit();

        // Clear goals
        this.goals = [];

        // Clear hotkey cache
        this.currentHotkey = null;
    }
} 