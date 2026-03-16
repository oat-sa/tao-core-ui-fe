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
 * Copyright (c) 2026 (original work) Open Assessment Technologies SA ;
 */
import $ from 'jquery';

let callbacks;
let resizeObserver;

/**
 * Use the single ResizeObserver instance
 * @returns {Object}
 */
export default {
    /**
     * @param {jQuery|Element} elem
     * @param {(entry: ResizeObserverEntry, observer: ResizeObserver) => {}} callback
     * @param {Object?} observeOptions - see https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver/observe#options
     */
    observe: function (elem, callback = () => {}, observeOptions) {
        const node = elem && $(elem).get(0);
        if (!node) {
            return;
        }

        ensureResizeObserverInstance();
        resizeObserver.observe(node, observeOptions);

        let nodeCallbacks = callbacks.get(node);
        if (!nodeCallbacks) {
            callbacks.set(node, new Set());
            nodeCallbacks = callbacks.get(node);
        }
        nodeCallbacks.add(callback);
    },

    /**
     * @param {jQuery|Element} elem
     * @param {Function} callback
     */
    unobserve: function (elem, callback) {
        const node = elem && $(elem).get(0);
        if (!node) {
            return;
        }

        ensureResizeObserverInstance();
        resizeObserver.unobserve(node);

        const nodeCallbacks = callbacks.get(node);
        nodeCallbacks.delete(callback);
        if (nodeCallbacks.size < 1) {
            callbacks.delete(node);
        }
    }
};

function ensureResizeObserverInstance() {
    if (!resizeObserver) {
        callbacks = new WeakMap();
        resizeObserver = new ResizeObserver((entries, observer) => {
            for (const entry of entries) {
                const entryCallbacks = callbacks.get(entry.target);
                if (!entryCallbacks) {
                    return;
                }
                for (const entryCallback of entryCallbacks) {
                    entryCallback(entry, observer);
                }
            }
        });
    }
}
