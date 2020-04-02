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
import shortcutRegistry from 'util/shortcut/registry';

const navigableCls = 'key-navigation-highlight';
const eventNS = '.ui-key-navigator';

/**
 * The list of mandatory methods a navigable element must expose.
 * @type {String[]}
 */
const navigableApi = [
    'init',
    'destroy',
    'getElement',
    'isVisible',
    'isEnabled',
    'isFocused',
    'blur',
    'focus'
];

/**
 * From a dom element, create a navigable element compatible with ui/KeyNavigator/navigator
 * @param {String|Element|jQuery} element
 * @returns {navigableDomElement}
 * @fires key
 * @fires blur
 * @fires focus
 */
export default function navigableDomElement(element) {
    const $element = $(element);
    const shortcuts = shortcutRegistry($element);
    let initialTabIndex = null;

    /**
     * @typedef navigableDomElement
     */
    return eventifier({
        /**
         * Inits the navigableDomElement instance
         * @param {Boolean} propagateTab
         * @returns {navigableDomElement}
         */
        init({propagateTab = false} = {}) {
            const keyboard = (key, el) => {
                /**
                 * @event key
                 * @param {String} key
                 * @param {Element} el
                 */
                this.trigger('key', key, el);
            };

            const isInput = $el => $el.is(':text,textarea');

            if (!$element.length) {
                throw new TypeError('dom element does not exist');
            }

            initialTabIndex = $element.attr('tabindex');

            // add a tabindex to enable focusing, this tabindex is not actually used in tabbing order
            $element
                .addClass(navigableCls)
                .attr('tabindex', -1)
                .on(`focusin${eventNS}`, e => {
                    /**
                     * @event focus
                     * @param {Element} el
                     */
                    this.trigger('focus', e.target);
                })
                .on(`focusout${eventNS}`, e => {
                    /**
                     * @event blur
                     * @param {Element} el
                     */
                    this.trigger('blur', e.target);
                })

                // requires a keyup event to make unselecting radio button work with space bar
                .on(`keyup${eventNS}`, e => {
                    const keyCode = e.keyCode ? e.keyCode : e.charCode;
                    if (keyCode === 32) {
                        // if the inner element is an input we let the space work
                        if (isInput($(e.target))) {
                            e.stopPropagation();
                        } else {
                            e.preventDefault();
                            keyboard('space', e.target);
                        }
                    }
                });

            // init standard key bindings
            shortcuts.clear()
                .add(
                    'tab shift+tab',
                    (e, key) => keyboard(key, e.target),
                    {
                        propagate: !!propagateTab,
                        prevent: true
                    }
                )
                .add(
                    'up down left right',
                    (e, key) => {
                        const $target = $(e.target);
                        if (!isInput($target)) {
                            if (!$target.is('img') && !$target.hasClass('key-navigation-scrollable')) {
                                // prevent scrolling of parent element
                                e.preventDefault();
                            }
                            keyboard(key, e.target)
                        }
                    },
                    {
                        propagate: false
                    }
                )
                .add(
                    'enter',
                    e => {
                        if (!isInput($(e.target))) {
                            //prevent activating the element when typing a text
                            e.preventDefault();
                            keyboard('enter', e.target);
                        }
                    },
                    {
                        propagate: false
                    }
                );

            return this;
        },

        /**
         * Destroys the navigableDomElement instance
         * @returns {navigableDomElement}
         */
        destroy() {
            $element
                .removeClass(navigableCls)
                .off(eventNS);

            if (initialTabIndex || initialTabIndex === 0) {
                $element.attr('tabindex', initialTabIndex);
            } else {
                $element.removeAttr('tabindex');
            }

            shortcuts.clear();

            return this;
        },

        /**
         * Gets the dom element
         * @returns {jQuery}
         */
        getElement() {
            return $element;
        },

        /**
         * Checks if the navigable element is visible
         * @returns {Boolean}
         */
        isVisible() {
            return $element.is(':visible');
        },

        /**
         * Checks if the navigable element is not disabled
         * @returns {Boolean}
         */
        isEnabled() {
            return !$element.is(':disabled');
        },

        /**
         * Checks if the navigable element is focused
         * @returns {Boolean}
         */
        isFocused() {
            const el = $element.get(0);
            return document.activeElement && (el === document.activeElement || $.contains(el, document.activeElement));
        },

        /**
         * Removes focus from the navigable element
         * @returns {navigableDomElement}
         */
        blur() {
            $element.blur();

            return this;
        },

        /**
         * Sets focus on the navigable element
         * @returns {navigableDomElement}
         */
        focus() {
            $element.focus();

            return this;
        }
    });
};

/**
 * From a jQuery container, returns an array of navigableDomElement
 * @param {jQuery|Element[]} $elements
 * @returns {Array}
 */
navigableDomElement.createFromDoms = $elements => {
    const list = [];
    const addElement = element => list.push(navigableDomElement(element));

    if ($elements) {
        if ($elements instanceof $) {
            $elements.each((i, element) => addElement(element));
        } else {
            $elements.forEach(addElement);
        }
    }

    return list;
};

/**
 * Checks if the provided object is a valid navigable element
 *
 * @param {Object} navigable
 * @returns {Boolean}
 */
navigableDomElement.isNavigableElement = navigable => !!navigable && navigableApi.every(n => 'function' === typeof navigable[n]);
