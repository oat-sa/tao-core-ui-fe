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
 *
 * Create a navigator group to enable keyboard navigation between elements
 *
 * @example
 * const $navigationBar = $('#navigation-bar');
 * const $buttons = $navigationBar.find('li');
 * const navigableElements = domNavigableElement.createFromDoms($buttons);
 * keyNavigator({
 *       id : 'navigation-toolbar',
 *       group : $navigationBar,
 *       elements : navigableElements,
 *       defaultPosition : 0
 *   }).on('right down', function(){
 *       this.next();
 *   }).on('left up', function(){
 *       this.previous();
 *   }).on('activate', function(cursor){
 *       cursor.navigable.getElement().click();
 *   });
 *
 * @author Sam <sam@taotesting.com>
 */
import $ from 'jquery';
import _ from 'lodash';
import eventifier from 'core/eventifier';
import navigableDomElement from 'ui/keyNavigation/navigableDomElement';

const defaults = {
    defaultPosition: 0,
    keepState: false,
    loop: false,
    propagateTab: true
};

/**
 * Create a keyNavigator
 *
 * @param config - the config
 * @param {String} config.id - global unique id to define this group
 * @param {jQuery} config.elements - the group of element to be keyboard-navigated
 * @param {jQuery} [config.group] - the container the group of elements belong to
 * @param {Number|Function} [config.defaultPosition=0] - the default position the group should set the focus on (could be a function to compute the position)
 * @param {Boolean} [config.keepState=false] - define if the position should be saved in memory after the group blurs and re-focuses
 * @param {Boolean} [config.loop=false] - define if the navigation should loop after reaching the last or the first element
 * @returns {keyNavigator}
 */
export default function keyNavigatorFactory(config) {
    const navigatorConfig = Object.assign({}, defaults, config || {});

    const id = navigatorConfig.id || _.uniqueId('navigator_');
    const $group = navigatorConfig.group && $(navigatorConfig.group).addClass('key-navigation-group').attr('data-navigation-id', id);
    if (navigatorConfig.group && (!$group.length || !$.contains(document.body, $group.get(0)))) {
        throw new TypeError('group element does not exist');
    }

    const navigableElements = navigatorConfig.elements || [];
    let lastPosition = -1;

    /**
     * Checks if the navigable element is available
     * @param {navigableDomElement} navigable
     * @returns {Boolean}
     */
    const isNavigableAvailable = navigable => navigable && navigable.isVisible() && navigable.isEnabled();

    /**
     * Checks if the navigable element is focused
     * @param {navigableDomElement} navigable
     * @returns {Boolean}
     */
    const isNavigableFocused = navigable => isNavigableAvailable(navigable) && navigable.isFocused();

    /**
     * Gets the closest allowed position to the right
     *
     * @param {Number} fromPosition - the starting position
     * @returns {Number}
     */
    const getClosestPositionRight = fromPosition => {
        for (let pos = fromPosition; pos < navigableElements.length; pos++) {
            if (isNavigableAvailable(navigableElements[pos])) {
                return pos;
            }
        }
        return -1;
    };

    /**
     * Gets the closest allowed position to the left
     *
     * @param {Number} fromPosition - the starting position
     * @returns {Number}
     */
    const getClosestPositionLeft = fromPosition => {
        for (let pos = fromPosition; pos >= 0; pos--) {
            if (isNavigableAvailable(navigableElements[pos])) {
                return pos;
            }
        }
        return -1;
    };

    /**
     * The navigation group object
     *
     * @typedef keyNavigator
     */
    const keyNavigator = eventifier({
        /**
         * Setups the navigator
         * @returns {keyNavigator}
         */
        init() {
            if ($group) {
                //add the focusin and focus out class for group highlighting
                $group
                    .on(`focusin.${this.getId()}`, () => {
                        if (this.isFocused()) {
                            $group.addClass('focusin');
                        }
                    })
                    .on(`focusout.${this.getId()}`, () => {
                        _.defer(() => {
                            if (!this.isFocused()) {
                                $group.removeClass('focusin');
                            }
                        });
                    });
            }

            navigableElements.forEach(navigable => {
                if (!navigableDomElement.isNavigableElement(navigable)) {
                    throw new TypeError('not a valid navigable element');
                }

                if (navigable.getType() === 'element') {
                    navigable.init({propagateTab: navigatorConfig.propagateTab});
                }

                navigable
                    .off(`.${this.getId()}`)
                    .on(`key.${this.getId()}`, (key, el) => this.trigger('key', key, el))
                    .on(`focus.${this.getId()}`, () => {
                        lastPosition = this.getCurrentPosition();
                    })
                    .on(`blur.${this.getId()}`, () => {
                        const cursor = this.getCursorAt(lastPosition);
                        if (cursor.navigable) {
                            this.trigger('blur', cursor);
                        }
                    });
            });

            return this;
        },

        /**
         * Destroys and cleanup
         * @returns {keyNavigator}
         */
        destroy() {
            if ($group) {
                $group
                    .off(`.${this.getId()}`)
                    .removeClass('focusin');
            }

            navigableElements.forEach(navigable => {
                navigable.off(`.${this.getId}`);

                if (navigable.getType() === 'element') {
                    navigable.destroy();
                }
            });

            lastPosition = -1;

            return this;
        },

        /**
         * Gets the navigation group id
         * @returns {String}
         */
        getId() {
            return id;
        },

        /**
         * Gets the type of navigable element
         * @returns {String}
         */
        getType() {
            return 'navigator';
        },

        /**
         * Gets the defined group the navigator group belongs to
         * @returns {jQuery}
         */
        getElement() {
            return $group;
        },

        /**
         * Returns the current cursor of the navigator
         * @returns {Object}
         */
        getCursor() {
            return this.getCursorAt(this.getCurrentPosition());
        },

        /**
         * Gets a navigable at a given position
         * @param {Number} position
         * @returns {navigableDomElement}
         */
        getNavigableAt(position) {
            if (position >= 0 && navigableElements[position]) {
                return navigableElements[position];
            }
            return null;
        },

        /**
         * Gets the cursor at a given position
         * @param {Number} position
         * @returns {Object}
         */
        getCursorAt(position) {
            const navigable = this.getNavigableAt(position);
            return {position: navigable ? position : -1, navigable};
        },

        /**
         * Sets the focus to the element at the given position
         *
         * @param {Number} position
         * @returns {keyNavigator}
         * @fires blur on the previous cursor
         * @fires focus on the new cursor
         */
        setCursorAt(position) {
            if (navigableElements[position]) {
                const cursor = this.getCursorAt(lastPosition);
                if (cursor.navigable) {
                    /**
                     * @event blur
                     * @param {Object} cursor
                     */
                    this.trigger('blur', cursor);
                }

                lastPosition = position;
                navigableElements[position].focus();

                /**
                 * @event focus
                 * @param {Object} cursor
                 */
                this.trigger('focus', this.getCursor());
            }
            return this;
        },

        /**
         * Returns the current position in the navigator
         * @returns {Number}
         */
        getCurrentPosition() {
            if (document.activeElement) {
                return _.findIndex(navigableElements, isNavigableFocused);
            }
            return -1;
        },

        /**
         * Returns the current navigable in the navigator
         * @returns {Object}
         */
        getCurrentNavigable() {
            const position = this.getCurrentPosition();
            if (position >= 0) {
                return navigableElements[position];
            }
            return null;
        },

        /**
         * Returns the array of navigable objects composing the navigator
         * @returns {Array}
         */
        getNavigableElements() {
            return navigableElements.slice();
        },

        /**
         * Checks if the group and at least one navigable element is visible
         * @returns {boolean}
         */
        isVisible() {
            if (!$group || $group.is(':visible')) {
                return navigableElements.some(navigable => navigable.isVisible());
            }
            return false;
        },

        /**
         * Checks if the group and at least one navigable element is enabled
         * @returns {Boolean}
         */
        isEnabled() {
            if (!$group || !$group.is(':disabled')) {
                return navigableElements.some(navigable => navigable.isEnabled());
            }
            return false;
        },

        /**
         * Checks if at least one navigable element is focused
         * @returns {Boolean}
         */
        isFocused() {
            if (document.activeElement) {
                return navigableElements.some(navigable => navigable.isFocused());
            }
            return false;
        },

        /**
         * Sets the focus on the first available focusable element
         * @returns {keyNavigator}
         */
        first() {
            this.setCursorAt(
                getClosestPositionRight(0)
            );
            return this;
        },

        /**
         * Sets the focus on the last available focusable element
         * @returns {keyNavigator}
         */
        last() {
            this.setCursorAt(
                getClosestPositionLeft(navigableElements.length - 1)
            );
            return this;
        },

        /**
         * Moves the cursor to the next position
         *
         * @returns {keyNavigator}
         * @fires upperbound when we cannot move further
         * @fires next when the cursor successfully moved to the next position
         */
        next() {
            let position = this.getCurrentPosition();
            if (position >= 0) {
                position = getClosestPositionRight(position + 1);
                if (position >= 0) {
                    this.setCursorAt(position);
                } else if (navigatorConfig.loop) {
                    this.first();
                } else {
                    /**
                     * reaching the end of the list
                     * @event upperbound
                     */
                    this.trigger('upperbound');
                }

                const cursor = this.getCursor();

                /**
                 * @event next
                 * @param {Object} cursor
                 */
                this.trigger('next', cursor);
            } else {
                this.first();
            }
            return this;
        },

        /**
         * Moves the cursor to the previous position
         *
         * @returns {keyNavigator}
         * @fires lowerbound when we cannot move lower
         * @fires previous when the cursor successfully moved to the previous position
         */
        previous() {
            let position = this.getCurrentPosition();
            if (position >= 0) {
                position = getClosestPositionLeft(position - 1);
                if (position >= 0) {
                    this.setCursorAt(position);
                } else if (navigatorConfig.loop) {
                    this.last();
                } else {
                    /**
                     * reaching the end of the list
                     * @event lowerbound
                     */
                    this.trigger('lowerbound');
                }

                const cursor = this.getCursor();

                /**
                 * @event previous
                 * @param {Object} cursor
                 */
                this.trigger('previous', cursor);
            } else {
                this.first();
            }
            return this;
        },

        /**
         * Activates the focused element, if any
         *
         * @param {Object} target
         * @returns {keyNavigator}
         * @fires activate
         */
        activate(target) {
            const cursor = this.getCursor();
            if (cursor.navigable) {
                /**
                 * @event activate
                 * @param {Object} cursor
                 * @param {Object} target
                 */
                this.trigger('activate', cursor, target);
            }
            return this;
        },

        /**
         * Blurs the focused element, if any
         * @returns {keyNavigator}
         */
        blur() {
            const cursor = this.getCursorAt(lastPosition);
            if (cursor.navigable) {
                cursor.navigable.blur();
            }
            return this;
        },

        /**
         * Sets the focus to the current element
         * @returns {keyNavigator}
         */
        focus() {
            let position;
            if (navigatorConfig.keepState && this.getNavigableAt(lastPosition)) {
                position = lastPosition;
            } else if (_.isFunction(navigatorConfig.defaultPosition)) {
                position = Math.max(0, navigatorConfig.defaultPosition(navigableElements));
            } else {
                position = navigatorConfig.defaultPosition;
            }
            this.setCursorAt(
                getClosestPositionRight(position)
            );
            return this;
        }
    });

    return keyNavigator
        .init()
        .on('key', (key, el) => {
            if (key === 'space' || key === 'enter') {
                keyNavigator.activate(el);
            } else {
                keyNavigator.trigger(key, el);
            }
        });
};
