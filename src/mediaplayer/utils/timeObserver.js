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

import eventifier from 'core/eventifier';

/**
 * Creates a time observer.
 *
 * It observes the updates applied to a timeline, raising a flag when an irregularity occurs.
 *
 * It works as follow:
 * - an initial state is defined (example: current: 0, duration: 100)
 * - each time a position is forced (say the position is changed outside of the regular time update), the observer needs
 *   to be notified.
 * - each time the position is updated (say regular time update), the observer needs to be called.
 * - if the difference between the last regular update and the last one is too high, an event is triggered
 *
 * @example
 * // Create a time observer with an expected interval of 2 seconds
 * const observer = timeObserverFactory(2);
 *
 * // Init the state
 * observer.start(player.position, player.duration);
 *
 * // Update on a regular basis
 * player.on('timeupdate', () => observer.update(player.position));
 *
 * // Notify any position change outside of the regular update
 * player.on('seek', () => observer.seek(player.position));
 *
 * // Gets informed from any irregularity
 * observer.on('irregularity', () => console.log('irregular jump in time');
 *
 * @param {number} interval - The typical interval expected between two updates. It is given in seconds.
 * @returns {timeObserver}
 */
export default function timeObserverFactory(interval = 1) {
    // Current time position
    let position = 0;

    // Total duration expected
    let duration = 0;

    // Last position forced
    let seek = 0;

    /**
     * Defines the API of a time observer.
     *
     * It observes the updates applied to a timeline, raising a flag when an irregularity occurs.
     *
     * @namespace timeObserver
     */
    return eventifier({
        /**
         * Gets the current time position reported to the observer.
         *
         * @returns {number}
         * @type {number}
         * @member position
         * @memberOf timeObserver
         */
        get position() {
            return position;
        },

        /**
         * Gets the total duration reported to the observer.
         *
         * @returns {number}
         * @type {number}
         * @member duration
         * @memberOf timeObserver
         */
        get duration() {
            return duration;
        },

        /**
         * Initialises the time state.
         *
         * @param {number} initPosition - The initial time position
         * @param {number} initDuration - The total duration expected
         * @returns {timeObserver}
         * @function init
         * @memberOf timeObserver
         */
        init(initPosition, initDuration) {
            position = seek = initPosition;
            duration = initDuration;
            return this;
        },

        /**
         * Updates the time position. If the difference with the previous update is too high, an `irregularity` event
         * will be emitted.
         *
         * @param {number} newPosition - The new time position
         * @returns {timeObserver}
         *
         * @fires irregularity
         */
        update(newPosition) {
            if (newPosition > seek && newPosition - position > interval) {
                /**
                 * Notifies an irregularity in in the time update
                 * @event irregularity
                 */
                this.trigger('irregularity');
            }
            position = newPosition;
            return this;
        },

        /**
         * Notifies the observer about a change in the position outside of the regular update.
         *
         * @param {number} seekPosition
         * @returns {timeObserver}
         */
        seek(seekPosition) {
            position = seek = seekPosition;
            return this;
        }
    });
}
