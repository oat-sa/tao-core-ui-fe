/**
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License
 * as published by the Free Software Foundation; under version 2
 * of the License (non-upgradable).
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
 *
 * Copyright (c) 2021 (original work) Open Assessment Technologies SA ;
 */

/**
 * Creates a reminder manager.
 *
 * A reminder manager allows to register callback functions that will be called after a particular amount of time.
 * The schedule can be created and cancelled at any time.
 *
 * @example
 * // Create a reminder manager
 * const manager = reminderManagerFactory();
 *
 * // Add a reminder that will be called after 2s (delay is given in milliseconds)
 * manager.remind(() => console.log('Hello!'), 2000);
 *
 * // Start the schedule
 * manager.start();
 *
 * // We can know how many time elapsed since the last schedule
 * const elapsed = manager.elapsed;
 *
 * // The schedule can be cancelled
 * if (needToCancel) {
 *     manager.stop();
 * }
 *
 * // The schedule should be cancelled
 * console.log('schedule running:', manager.running)
 *
 * @returns {reminderManager}
 */
export default function reminderManagerFactory() {
    // Keep track of the running state
    let running = false;

    // Timestamp of the last start
    let last = 0;

    // A list of reminders to callback
    const reminders = new Map();

    /**
     * Cancels a schedule for a particular reminder.
     * @param {object} state - A sate object containing the timeout handler for the reminder.
     * @private
     */
    const stopReminder = state => {
        if (state && state.timeout) {
            clearTimeout(state.timeout);
            state.timeout = null;
        }
    };

    /**
     * Cancel the schedule for all reminders.
     * @private
     */
    const stopAllReminders = () => reminders.forEach(stopReminder);

    /**
     * Schedule all reminders.
     * @private
     */
    const startAllReminders = () => {
        reminders.forEach((state, reminder) => {
            stopReminder(state);
            state.timeout = setTimeout(reminder, state.delay);
        });
    };

    /**
     * Defines the API of a reminder manager.
     *
     * A reminder manager allows to register callback functions that will be called after a particular amount of time.
     * The schedule can be created and cancelled at any time.
     *
     * @namespace reminderManager
     */
    return {
        /**
         * Tells whether or not the schedule is running.
         * @type {boolean}
         * @member running
         * @memberOf reminderManager
         */
        get running() {
            return running;
        },

        /**
         * Gives the amount of time elapsed since the start of the schedule. It is given in milliseconds.
         * If the schedule is not running, it will always be 0.
         * @type {number}
         * @member running
         * @memberOf reminderManager
         */
        get elapsed() {
            if (!running) {
                return 0;
            }
            return performance.now() - last;
        },

        /**
         * Schedules all reminders from now on.
         *
         * @returns {reminderManager}
         * @function start
         * @memberOf reminderManager
         */
        start() {
            running = true;
            last = performance.now();
            startAllReminders();
            return this;
        },

        /**
         * Cancels all scheduled reminders.
         *
         * @returns {reminderManager}
         * @function stop
         * @memberOf reminderManager
         */
        stop() {
            running = false;
            stopAllReminders();
            return this;
        },

        /**
         * Adds a callback to be scheduled.
         * It won't be scheduled until the schedule is restarted.
         *
         * @param {Function} cb - A function to call after the delay elapsed.
         * @param {number} delay - The delay after what call back the reminder. It is given in milliseconds.
         * @returns {reminderManager}
         * @function remind
         * @memberOf reminderManager
         */
        remind(cb, delay) {
            if ('function' === typeof cb && delay) {
                stopReminder(reminders.get(cb));
                reminders.set(cb, { delay });
            }
            return this;
        },

        /**
         * Removes a scheduled callback. If a schedule was running, it will be cancelled first.
         *
         * @param {Function} [cb] - The callback function to remove. If omitted, all reminders will be removed.
         * @returns {reminderManager}
         * @function forget
         * @memberOf reminderManager
         */
        forget(cb) {
            if ('undefined' !== typeof cb) {
                stopReminder(reminders.get(cb));
                reminders.delete(cb);
            } else {
                stopAllReminders();
                reminders.clear();
            }
            return this;
        }
    };
}
