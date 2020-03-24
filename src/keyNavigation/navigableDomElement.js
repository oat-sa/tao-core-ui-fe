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
 * From a dom element, create a navigable element compatible with ui/KeyNavigator/navigator
 */
import $ from 'jquery';
import eventifier from 'core/eventifier';

const navigableCls = 'key-navigation-highlight';

/**
 * From a dom element, create a navigable element compatible with ui/KeyNavigator/navigator
 * @param {String|Element|jQuery} element
 * @returns {navigableDomElement}
 */
export default function navigableDomElement(element) {
    const $element = $(element);
    let initialTabIndex = null;

    /**
     * @typedef navigableDomElement
     */
    return eventifier({
        /**
         * Init the navigableDomElement instance
         * @returns {navigableDomElement}
         */
        init() {
            if (!$element.length) {
                throw new TypeError('dom element does not exist');
            }

            initialTabIndex = $element.attr('tabindex');

            // add a tabindex to enable focusing, this tabindex is not actually used in tabbing order
            $element
                .addClass(navigableCls)
                .attr('tabindex', -1);

            return this;
        },

        /**
         * Destroy the navigableDomElement instance
         * @returns {navigableDomElement}
         */
        destroy() {
            $element.removeClass(navigableCls);

            if (initialTabIndex || initialTabIndex === 0) {
                $element.attr('tabindex', initialTabIndex);
            } else {
                $element.removeAttr('tabindex');
            }

            return this;
        },

        /**
         * Get the dom element
         * @returns {jQuery}
         */
        getElement() {
            return $element;
        },

        /**
         * Check if the navigable element is visible
         * @returns {boolean}
         */
        isVisible() {
            return $element.is(':visible');
        },

        /**
         * Check if the navigable element is not disabled
         * @returns {boolean}
         */
        isEnabled() {
            return !$element.is(':disabled');
        },

        /**
         * Set focus on the navigable element
         * @returns {navigableGroupElement}
         */
        focus() {
            $element.focus();

            return this;
        }
    });
};

/**
 * From a jQuery container, returns an array of navigableDomElement
 * @param {jQuery} $elements
 * @returns {Array}
 */
navigableDomElement.createFromDoms = $elements => {
    const list = [];

    if ($elements && $elements instanceof $) {
        $elements.each(
            (i, element) => list.push(navigableDomElement(element))
        );
    }

    return list;
};
