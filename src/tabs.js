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
 * Copyright (c) 2019 (original work) Open Assessment Technologies SA ;
 */
/**
 * @author Martin Nicholson <martin@taotesting.com>
 */
/**
 * @example
 * const instance = tabs({
 *   renderTo: $container,
 *   tabs: [
 *     { label: 'TAO Local', name: 'local-delivery' },
 *     { label: 'TAO Remote', name: 'remote-delivery' },
 *     { label: 'LTI-based', name: 'lti-delivery', disabled: true }
 *   ],
 *   activeTabIndex: 1
 * });
 *
 */
import $ from 'jquery';
import component from 'ui/component';
import tabsTpl from 'ui/tabs/tpl/tabs';
import 'ui/tabs/css/tabs.css';

const ns = 'tabs';

/**
 * Default config
 * @param {Integer} activeTabIndex - the index of the tab to start on
 * @param {Boolean} showHideTargets - if true, no need to wire up tabs to content, it's automatic
 */
const tabsDefaults = {
    activeTabIndex: 0,
    showHideTargets: true
};

/**
 * In-memory data
 */
let tabs = [];

/**
 * API of the tabs component
 * @exports ui/tabs
 */
const tabsApi = {
    /**
     * Set new values for the tabs
     * @param {Array} newTabs
     * @returns {tabs} instance
     * @throws {TypeError} on non-Array tabs
     */
    setTabs(newTabs) {
        if (!Array.isArray(newTabs)) {
            throw new TypeError('The provided tabs are not a valid array');
        }
        tabs = [...newTabs];
        return this;
    },

    /**
     * Retrieve internal tabs array
     * @returns {Array} tabs list
     */
    getTabs() {
        return tabs;
    },

    /**
     * Wires up the onClick functions of the received tabs
     * @returns {tabs} instance
     */
    connectTabs() {
        const $tabBar = this.getElement();

        for (let tab of tabs) {
            $tabBar.find(`[data-tab-name="${tab.name}"]`)
                .off('click')
                .on('click', () => {
                    this.activateTabByName(tab.name);
                });
        }
        return this;
    },


    /**
     * Activates a single tab by its name
     * (pass-through method to activateTabByIndex)
     * @param {String} name - human-readable identifier
     * @param {Boolean} [callOnClick=true] - if false, skips the onClick call
     * @returns {tabs} instance
     * @throws {TypeError} on invalid name param
     */
    activateTabByName(name, callOnClick = true) {
        const index = tabs.findIndex(t => t.name === name);
        if (index === -1) {
            throw new TypeError(`No tab exists with the name: ${name}`);
        }
        else {
            return this.activateTabByIndex(index, callOnClick);
        }
    },

    /**
     * Activates a single tab (deactivating others)
     * Triggers the automatic showing & hiding of target tab-contents
     * Triggers onClick functions of the tabs
     * @param {Number} index - zero-based
     * @param {Boolean} [callOnClick=true] - if false, skips the onClick call
     * @returns {tabs} instance
     * @fires activate-tab
     * @throws {TypeError} on invalid index param
     */
    activateTabByIndex(index, callOnClick = true) {
        const $tabBar = this.getElement();

        if (typeof index !== 'number' || index < 0 || index >= tabs.length) {
            throw new TypeError(`No tab exists at index: ${index}`);
        }

        // set/unset active
        for (let j of Object.keys(tabs)) {
            tabs[j].active = false;
            $tabBar.find('.tab').removeClass('active');
        }
        tabs[index].active = true;
        $tabBar.find(`.tab[data-tab-name="${tabs[index].name}"]`).addClass('active');

        // toggle targets
        if (this.config.showHideTargets) {
            this.showTabContent(tabs[index].name);
        }

        // call its onClick
        if (callOnClick && typeof tabs[index].onClick === 'function') {
            tabs[index].onClick.call();
        }

        this.trigger(`activate-tab.${ns}`, index);
        return this;
    },

    /**
     * Shows one tab content, hides the rest
     * The tab content elements are not tied to any template and can be located anywhere in the DOM
     * @param {String} name - human-readable identifier
     * @fires show-tab-content
     */
    showTabContent(name) {
        if (!name || name.length === 0) {
            return;
        }
        $(`[data-tab-content]`).addClass('hidden');
        $(`[data-tab-content="${name}"]`).removeClass('hidden');

        this.trigger(`show-tab-content.${ns}`, name);
    },

    /**
     * Gets the current active tab (if any)
     * @returns {Object|null} name and index of tab
     */
    getActiveTab() {
        const activeIndex = tabs.findIndex(t => t.active === true);
        if (activeIndex === -1) {
            return null;
        }
        return {
            name: tabs[activeIndex].name,
            index: activeIndex
        };
    }
};

/**
 * Builds an instance of the tabs component
 * @param {Object} config
 * @param {Array} [config.tabs] - The list of tabs to create
 * @param {jQuery|HTMLElement|String} [config.renderTo] - An optional container in which renders the component
 * @param {Boolean} [config.replace] - When the component is appended to its container, clears the place before
 * @returns {tabs}
 */

const tabsFactory = function(config) {
    return component(tabsApi, tabsDefaults)
        .setTemplate(tabsTpl)
        .on('init', function() {
            if (this.config && this.config.tabs) {
                this.setTabs(this.config.tabs);
            }
        })
        .on('render', function() {
            this.connectTabs();
            if (typeof this.config.activeTabIndex === 'number') {
                this.activateTabByIndex(this.config.activeTabIndex, false);
            }
        })
        .init(config);
};

export default tabsFactory;
