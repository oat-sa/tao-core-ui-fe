/*
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
 * Copyright (c) 2017-2020 (original work) Open Assessment Technologies SA;
 *
 */

/**
 * From an instance of keyNavigator, create a navigable element compatible with ui/KeyNavigator/navigator
 * It enables navigating within a group of keyNavigator
 */
import $ from 'jquery';
import _ from 'lodash';
import eventifier from 'core/eventifier';

const eventNS = '.navigable-group-element';

/**
 * From an instance of keyNavigator, create a navigable element compatible with ui/KeyNavigator/navigator
 * @param {keyNavigator} keyNavigator
 * @returns {navigableGroupElement}
 */
export default function navigableGroupElementFactory(keyNavigator) {

    if (!keyNavigator) {
        throw new TypeError('the navigation group does not exist');
    }

    const $group = keyNavigator.getGroup();
    if (!$group.length || !$.contains(document, $group[0])) {
        throw new TypeError('the group dom element does not exist');
    }

    /**
     * @typedef navigableGroupElement
     */
    return eventifier({
        /**
         * Init the navigableGroupElement instance
         * @returns {navigableGroupElement}
         */
        init() {
            //add the focusin and focus out class for group highlighting
            $group
                .on(`focusin${eventNS}`, () => $group.addClass('focusin'))
                .on(`focusout${eventNS}`, () => {
                    _.defer(() => {
                        if (!document.activeElement || !$.contains($group.get(0), document.activeElement)) {
                            $group.removeClass('focusin');
                        }
                    });
                });

            return this;
        },

        /**
         * Destroy the navigableGroupElement instance
         * @returns {navigableGroupElement}
         */
        destroy() {
            $group.removeClass('focusin').off(eventNS);

            return this;
        },

        /**
         * Get the dom element
         * @returns {JQuery}
         */
        getElement() {
            return $group;
        },

        /**
         * Check if the navigable element is visible
         * @returns {boolean}
         */
        isVisible() {
            if ($group.is(':visible')) {
                return keyNavigator.getNavigables().some(nav => nav.isVisible());
            }
            return false;
        },

        /**
         * Check if the navigable element is not disabled
         * @returns {Boolean}
         */
        isEnabled() {
            if (!$group.is(':disabled')) {
                return keyNavigator.getNavigables().some(nav => nav.isEnabled());
            }
            return false;
        },

        /**
         * Set focus on the navigable element
         * @returns {navigableGroupElement}
         */
        focus() {
            keyNavigator.focus(this);
            return this;
        },

        /**
         * Return an instance of keyNavigator
         * @returns {keyNavigator} keyNavigator
         */
        getKeyNavigator() {
            return keyNavigator;
        }
    });
};

/**
 *
 * @param {Array} keyNavigators - the array of navigators to be transformed into an array or navigableGroupElement
 * @returns {Array}
 */
navigableGroupElementFactory.createFromNavigators = keyNavigators => {
    if (Array.isArray(keyNavigators)) {
        return keyNavigators.map(navigableGroupElementFactory);
    }
    return [];
};
