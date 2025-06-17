export class EventEmitter {
    constructor() {
        this.events = {};
    }

    on(event, listener) {
        if (!this.events[event]) {
            this.events[event] = [];
        }
        this.events[event].push(listener);
        return this;
    }

    off(event, listenerToRemove) {
        if (!this.events[event]) return this;

        if (!listenerToRemove) {
            // Remove all listeners for event
            delete this.events[event];
        } else {
            // Remove specific listener
            this.events[event] = this.events[event].filter(
                listener => listener !== listenerToRemove
            );

            // Clean up empty arrays
            if (this.events[event].length === 0) {
                delete this.events[event];
            }
        }

        return this;
    }

    once(event, listener) {
        const onceWrapper = (...args) => {
            this.off(event, onceWrapper);
            listener.apply(this, args);
        };
        this.on(event, onceWrapper);
        return this;
    }

    emit(event, ...args) {
        if (!this.events[event]) return false;

        // Create a copy of listeners to avoid issues if listeners are modified during emission
        const listeners = [...this.events[event]];

        listeners.forEach(listener => {
            try {
                listener.apply(this, args);
            } catch (error) {
                console.error(`Error in event listener for '${event}':`, error);
            }
        });

        return true;
    }

    listenerCount(event) {
        return this.events[event] ? this.events[event].length : 0;
    }

    eventNames() {
        return Object.keys(this.events);
    }

    removeAllListeners(event) {
        if (event) {
            delete this.events[event];
        } else {
            this.events = {};
        }
        return this;
    }
} 