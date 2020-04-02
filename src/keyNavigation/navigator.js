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
 * const navigables = domNavigableElement.createFromDoms($buttons);
 * keyNavigator({
 *       id : 'navigation-toolbar',
 *       group : $navigationBar,
 *       elements : navigables,
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
    const _cursor = {
        position: -1,
        navigable: null
    };

    config = _.defaults(config || {}, defaults);

    const id = config.id || _.uniqueId('navigator_');
    const navigableElements = config.elements || [];
    const $group = config.group && $(config.group).addClass('key-navigation-group').attr('data-navigation-id', id);
    if (config.group && (!$group.length || !$.contains(document.body, $group.get(0)))) {
        throw new TypeError('group element does not exist');
    }

    /**
     * Get the current focused element within the key navigation group
     *
     * @returns {Object} the cursor
     */
    const getCurrentCursor = () => {
        let isFocused = false;

        if (document.activeElement) {
            // try to find the focused element within the known list of focusable elements
            navigableElements.forEach((navigable, index) => {
                if (
                    navigable.isVisible() &&
                    navigable.isEnabled() &&
                    navigable.isFocused()
                ) {
                    _cursor.position = index;
                    _cursor.navigable = navigable;
                    isFocused = true;
                    return false;
                }
            });
        }

        if (isFocused) {
            return _cursor;
        }

        return null;
    };

    /**
     * Get the closest allowed position in the right
     *
     * @param {Number} fromPosition - the starting position
     * @returns {Number}
     */
    const getClosestPositionRight = fromPosition => {
        for (let pos = fromPosition; pos < navigableElements.length; pos++) {
            if (navigableElements[pos] && navigableElements[pos].isVisible() && navigableElements[pos].isEnabled()) {
                return pos;
            }
        }
        return -1;
    };

    /**
     * Get the closest allowed position in the left
     *
     * @param {Number} fromPosition - the starting position
     * @returns {Number}
     */
    const getClosestPositionLeft = fromPosition => {
        for (let pos = fromPosition; pos >= 0; pos--) {
            if (navigableElements[pos] && navigableElements[pos].isVisible() && navigableElements[pos].isEnabled()) {
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
         * Setup the navigator
         * @returns {keyNavigator}
         */
        init() {
            if ($group) {
                //add the focusin and focus out class for group highlighting
                $group
                    .on(`focusin.${keyNavigator.getId()}`, () => {
                        if (this.isFocused()) {
                            $group.addClass('focusin');
                        }
                    })
                    .on(`focusout.${keyNavigator.getId()}`, e => {
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
                    navigable.init({propagateTab: config.propagateTab});
                }

                navigable
                    .off(`.${keyNavigator.getId()}`)
                    .on(`key.${keyNavigator.getId()}`, (key, el) => keyNavigator.trigger('key', key, el))
                    .on(`blur.${keyNavigator.getId()}`, () => {
                        const cursor = keyNavigator.getCursor();
                        if (cursor && cursor.navigable) {
                            keyNavigator.trigger('blur', cursor);
                        }
                    });
            });

            return this;
        },

        /**
         * Destroy and cleanup
         * @returns {keyNavigator}
         */
        destroy() {
            if ($group) {
                $group
                    .off(`.${keyNavigator.getId()}`)
                    .removeClass('focusin');
            }

            navigableElements.forEach(navigable => {
                navigable.off(`.${keyNavigator.getId}`);

                if (navigable.getType() === 'element') {
                    navigable.destroy();
                }
            });

            return this;
        },

        /**
         * Get the navigation group id
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
         * Get the defined group the navigator group belongs to
         * @returns {jQuery}
         */
        getElement() {
            return $group;
        },

        /**
         * Return the current cursor of the navigator
         * @returns {Object}
         */
        getCursor() {
            //clone the return cursor to protect this private variable
            return _.clone(_cursor);
        },

        /**
         * Return the current position in the navigator
         * @returns {Number}
         */
        getCurrentPosition() {
            const cursor = getCurrentCursor();
            if (cursor) {
                return cursor.position;
            }
            return -1;
        },

        /**
         * Return the current navigable in the navigator
         * @returns {Object}
         */
        getCurrentNavigable() {
            const cursor = getCurrentCursor();
            if (cursor) {
                return cursor.navigable;
            }
            return null;
        },

        /**
         * Return the array of navigable objects composing the navigator
         * @returns {Array}
         */
        getNavigables() {
            return _.clone(navigableElements);
        },

        /**
         * Check if the group and at least one navigable element is visible
         * @returns {boolean}
         */
        isVisible() {
            if (!$group || $group.is(':visible')) {
                return navigableElements.some(nav => nav.isVisible());
            }
            return false;
        },

        /**
         * Check if the group and at least one navigable element is enabled
         * @returns {Boolean}
         */
        isEnabled() {
            if (!$group || !$group.is(':disabled')) {
                return navigableElements.some(nav => nav.isEnabled());
            }
            return false;
        },

        /**
         * Check if at least one navigable element is focused
         * @returns {Boolean}
         */
        isFocused() {
            if (document.activeElement) {
                return navigableElements.some(nav => nav.isFocused());
            }
            return false;
        },

        /**
         * Set focus on the first available focusable element
         * @returns {keyNavigator}
         */
        first() {
            this.focusPosition(getClosestPositionRight(0));
            return this;
        },

        /**
         * Set focus on the last available focusable element
         * @returns {keyNavigator}
         */
        last() {
            this.focusPosition(getClosestPositionLeft(navigableElements.length - 1));
            return this;
        },

        /**
         * Move cursor to next position
         *
         * @returns {keyNavigator}
         * @fires upperbound when we cannot move further
         * @fires next when the cursor successfully moved to the next position
         */
        next() {
            let pos = this.getCurrentPosition();
            if (pos > -1) {
                pos = getClosestPositionRight(pos + 1);
                if (pos >= 0) {
                    this.focusPosition(pos);
                } else if (config.loop) {
                    //loop allowed, so returns to the first element
                    this.focusPosition(getClosestPositionRight(0));
                } else {
                    /**
                     * reaching the end of the list
                     * @event upperbound
                     */
                    this.trigger('upperbound');
                }
                /**
                 * @event next
                 * @param {Object} cursor
                 */
                this.trigger('next', getCurrentCursor());
            } else {
                //no cursor, might be blurred, so attempt resuming navigation from cursor in memory
                this.focusPosition(getClosestPositionRight(0));
            }
            return this;
        },

        /**
         * Move cursor to previous position
         *
         * @returns {keyNavigator}
         * @fires lowerbound when we cannot move lower
         * @fires previous when the cursor successfully moved to the previous position
         */
        previous() {
            let pos = this.getCurrentPosition();
            if (pos > -1) {
                pos = getClosestPositionLeft(pos - 1);
                if (pos >= 0) {
                    this.focusPosition(pos);
                } else if (config.loop) {
                    //loop allowed, so returns to the first element
                    this.focusPosition(getClosestPositionLeft(navigableElements.length - 1));
                } else {
                    /**
                     * reaching the end of the list
                     * @event lowerbound
                     */
                    this.trigger('lowerbound');
                }
                /**
                 * @event previous
                 * @param {Object} cursor
                 */
                this.trigger('previous', getCurrentCursor());
            } else {
                //no cursor, might be blurred, so attempt resuming navigation from cursor in memory
                this.focusPosition(getClosestPositionRight(0));
            }
            return this;
        },

        /**
         * Focus to a position defined by its index
         *
         * @param {Object} target
         * @returns {keyNavigator}
         * @fires activate
         */
        activate(target) {
            const cursor = getCurrentCursor();
            if (cursor) {
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
         * Blur the current cursor
         * @returns {keyNavigator}
         */
        blur() {
            const navigable = this.getCurrentNavigable();
            if (navigable) {
                navigable.blur();
            }
            return this;
        },

        /**
         * Focus the cursor position in memory is keepState is activated, or the default position otherwise
         * @returns {keyNavigator}
         */
        focus() {
            let pos;
            if (config.keepState && _cursor && _cursor.position >= 0) {
                pos = _cursor.position;
            } else if (_.isFunction(config.defaultPosition)) {
                pos = config.defaultPosition(navigableElements);
                if (pos < 0) {
                    pos = 0;
                }
            } else {
                pos = config.defaultPosition;
            }
            this.focusPosition(getClosestPositionRight(pos));
            return this;
        },

        /**
         * Focus to a position defined by its index
         *
         * @param {Number} position
         * @returns {keyNavigator}
         * @fires blur on the previous cursor
         * @fires focus on the new cursor
         */
        focusPosition(position) {
            if (navigableElements[position]) {
                if (_cursor.navigable) {
                    /**
                     * @event blur
                     * @param {Object} cursor
                     */
                    this.trigger('blur', this.getCursor());
                }

                _cursor.position = position;
                navigableElements[_cursor.position].focus();
                _cursor.navigable = navigableElements[_cursor.position];

                /**
                 * @event focus
                 * @param {Object} cursor
                 */
                this.trigger('focus', this.getCursor());
            }
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
