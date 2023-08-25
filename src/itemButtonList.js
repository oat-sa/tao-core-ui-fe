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
 * Copyright (c) 2022 Open Assessment Technologies SA ;
 */
import $ from 'jquery';
import autoscroll from 'ui/autoscroll';
import componentFactory from 'ui/component';
import itemButtonListTpl from 'ui/itemButtonList/tpl/itemButtonList';
import 'ui/itemButtonList/css/item-button-list.css';

/**
 * CSS classes involved in the component
 * @type {Object}
 */
const cssClasses = {
    active: 'buttonlist-item-active',
    keyfocused: 'buttonlist-btn-focus'
};

/**
 * CSS selectors that match some particular elements
 * @type {Object}
 */
const cssSelectors = {
    active: `.${cssClasses.active}`,
    keyfocused: `.${cssClasses.keyfocused}`,
    navigable: '.buttonlist-btn',
    itemById: (id) => `.buttonlist-item[data-id="${id}"]`,
    navigableById: (id) => `.buttonlist-btn[data-id="${id}"]`
};

/**
 * @typedef {Object} ItemButton
 * @property {String} id - item id
 * @property {Number} position - 0-based list index
 * @property {String} numericLabel - displayed number
 * @property {String} ariaLabel
 * @property {String} status - 'answered'/'viewed'/'unseen'
 * @property {String} scoreType - 'correct'/'incorrect'/'score-pending'/'score-partial'/null
 * @property {String} icon - 'info'/'flagged'/null
 * @property {Boolean} disabled
 * @property {String} [title] - optional tooltip
 */
/**
 * Item Button List
 * Ordered list of buttons representing items from a testMap section
 * Mostly presentational component
 *
 * @param {Object} config
 * @param {ItemButton[]} [config.items] - The list of entries to display
 * @param {String|jQuery|HTMLElement} [scrollContainer] - scroll container element, for autoscroll
 * @returns {component}
 * @fires ready - When the component is ready to work
 * @fires click When an item is selected by the user
 */
function itemButtonListFactory(config = {}) {
    let component;
    let activeItemId = null;

    //jQuery or HTMLElement!
    /**
     * Get scroll container element
     * @returns {HTMLElement}
     */
    const getScrollContainer = () => {
        return config.scrollContainer || component.getElement();
    };

    /**
     * Selects the active item
     * @param {String|null} itemId
     */
    const selectItem = itemId => {
        // first deactivate already active elements
        component.getElement().find(cssSelectors.active)
            .removeClass(cssClasses.active);
        component.getElement().find(`${cssSelectors.navigable}[aria-current]`)
            .removeAttr('aria-current');

        // activate element
        if (itemId) {
            const $target = component.getElement().find(cssSelectors.itemById(itemId));
            if ($target.length) {
                $target.addClass(cssClasses.active);
                // finally make sure the item is visible
                autoscroll($target, getScrollContainer());

                const $ariaTarget = component.getElement().find(cssSelectors.navigableById(itemId));
                $ariaTarget.attr('aria-current', 'location');
            }
        }
    };

    /**
     * Update single item properties:
     * Only `icon`, `numericLabel`, `ariaLabel` are supported
     * @param {String} itemId
     * @param {Object} itemData
     */
    const updateItemData = (itemId, itemData) => {
        const $target = component.getElement().find(cssSelectors.itemById(itemId));
        if ($target.length) {
            if (typeof itemData.icon !== 'undefined') {
                const iconElem = $target.find('.buttonlist-icon').get(0);
                for (let i = 0; i < iconElem.classList.length; i++) {
                    if (iconElem.classList[i].startsWith('icon-')) {
                        iconElem.classList.remove(iconElem.classList[i]);
                    }
                }
                if (itemData.icon) {
                    iconElem.classList.add(`icon-${itemData.icon}`);
                }
            }
            if (typeof itemData.numericLabel !== 'undefined') {
                $target.find('.buttonlist-label').text(itemData.numericLabel !== null ? itemData.numericLabel : '');
            }
            if (typeof itemData.ariaLabel !== 'undefined') {
                $target.find('.buttonlist-btn').attr('aria-label', itemData.ariaLabel);
            }
        }
    };

    /**
     * 'tabfocus' styling, for Safari until :focus-visible supported
     * @param {jQuery|null}  $target
     */
    const setFocusStyle = $target => {
        component.getElement()
            .find(cssSelectors.keyfocused)
            .removeClass(cssClasses.keyfocused);

        if ($target && $target.length) {
            $target.addClass(cssClasses.keyfocused);
        }
    };

    /**
     * Apply a callback on each navigable element
     * @param {*} callback
     */
    const eachNavigable = callback => {
        component.getElement()
            .find(cssSelectors.navigable)
            .each(callback);
    };

    /**
     * Enables the keyboard navigation using 'tab' keys
     */
    const enableKeyboard = () => {
        eachNavigable((index, el) => el.removeAttribute('tabindex'));
    };

    /**
     * Disables the keyboard navigation using 'tab' keys
     */
    const disableKeyboard = () => {
        eachNavigable((index, el) => el.setAttribute('tabindex', -1));
        setFocusStyle(null);
    };

    /**
     * Emits the click event detailing the clicked item
     * The active item change should be handled by the consumer through the API, in case it is conditional or asynchronous
     * @param {String} itemId
     */
    const onClick = (itemId) => {
        /**
         * @event click
         * @param {String} itemId
         */
        component.trigger('click', { id: itemId });
    };

    /**
     * Defines the buttonList API
     * @type {buttonList}
     */
    const api = {
        /**
         * Sets the active item
         * @param {String} itemId
         * @returns {buttonList}
         */
        setActiveItem(itemId) {
            activeItemId = itemId;
            if (this.is('rendered')) {
                selectItem(itemId);
            }
            return this;
        },

        /**
         * Update single item properties:
         * Only `icon`, `numericLabel`, `ariaLabel` are supported
         * @param {String} itemId
         * @param {Object} itemData
         * @returns {buttonList}
         */
        updateItem(itemId, itemData) {
            if (this.is('rendered')) {
                updateItemData(itemId, itemData);
            }
            return this;
        }
    };

    /**
     * @typedef {component} buttonList
     */
    component = componentFactory(api, {})
        // set the component's layout
        .setTemplate(itemButtonListTpl)
        // renders the component
        .on('render', function onItemButtonListRender() {
            // 'tabfocus' detection, for Safari until :focus-visible supported
            this.getElement().on('keydown', cssSelectors.navigable, e => {
                if (e.key === 'Tab') {
                    setFocusStyle(null);
                }
            });
            this.getElement().on('keyup', cssSelectors.navigable, e => {
                if (e.key === 'Tab') {
                    setFocusStyle($(e.target));
                }
            });

            component.getElement().on('click', cssSelectors.navigable, e => {
                //does not check `disabled` property of clicked item, should be checked by consumer
                if (!this.is('disabled')) {
                    onClick(e.currentTarget.dataset.id);
                }
            });

            selectItem(activeItemId);

            if (!this.is('disabled')) {
                enableKeyboard();
            } else {
                disableKeyboard();
            }

            /**
             * @event ready
             */
            this.setState('ready', true)
                .trigger('ready');
        })

        // reflect enable/disabled state
        .on('enable', () => enableKeyboard)
        .on('disable', () => disableKeyboard);

    // initialize the component with the provided config:
    // config also contains data passed to template when rendering
    component.init(config);

    return component;
}

export default itemButtonListFactory;
