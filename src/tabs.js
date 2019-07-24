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
import $ from 'jquery';
import _ from 'lodash';
import component from 'ui/component';
import tabsTpl from 'ui/tabs/tpl/tabs';
import 'ui/tabs/css/tabs.css';

const ns = 'tabs';

/**
 * Default config
 * @param {Integer} activeTabIndex - the index of the tab to start on
 * @param {Boolean} showHideTargets - if true, no need to wire up tabs to panels, it's automatic
 * @param {String} targetDataAttr - the data attribute suffix used to connect tabs to panels
 */
const tabsDefaults = {
    activeTabIndex: 0,
    showHideTargets: true,
    targetDataAttr: 'panel'
};

/**
 * Shows one panel, hides the rest
 * The data panels can be located anywhere in the DOM
 * You could even have multiple targets toggled by one tab
 * @param {String} name - human-readable identifier
 * @param {String} attr - the data attribute suffix used to connect tabs to panels
 */
const showDataPanel = function(name, attr) {
    $(`[data-${attr}]`).addClass('hidden');
    $(`[data-${attr}="${attr}-${name}"]`).removeClass('hidden');
};

/**
 * In-memory data
 */
let tabs = []; // NECESSARY? config.tabs ok?

/**
 * API of the tabs component
 * @exports ui/tabs
 */
const tabsApi = {
    /**
     * Set new values for the tabs
     * @param {Array} newTabs
     * @returns {tabs} instance
     */
    setTabs(newTabs) {
        tabs = newTabs;
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
        const attr = this.config.targetDataAttr;

        for (let tab of tabs) {
            $tabBar.find(`[data-controlled-${attr}="${attr}-${tab.name}"]`)
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
     * Triggers the automatic showing & hiding of target panels
     * Triggers onClick functions of the tabs
     * @param {Number} index - zero-based
     * @param {Boolean} [callOnClick=true] - if false, skips the onClick call
     * @returns {tabs} instance
     * @fires activate-tab
     * @throws {TypeError} on invalid index param
     */
    activateTabByIndex(index, callOnClick = true) {
        const $tabBar = this.getElement();
        const attr = this.config.targetDataAttr;

        if (!_.isNumber(index) || index < 0 || index >= tabs.length) {
            throw new TypeError(`No tab exists at index: ${index}`);
        }

        // set/unset active
        for (let j of Object.keys(tabs)) {
            tabs[j].active = false;
            $tabBar.find('.tab').removeClass('active');
        }
        tabs[index].active = true;
        $tabBar.find(`.tab[data-controlled-${attr}=${attr}-${tabs[index].name}]`).addClass('active');

        // toggle targets
        if (this.config.showHideTargets) {
            showDataPanel(tabs[index].name, this.config.targetDataAttr);
        }

        // call its onClick
        if (callOnClick && _.isFunction(tabs[index].onClick)) {
            tabs[index].onClick.call();
        }

        this.trigger(`activate-tab.${ns}`, index);
        return this;
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
            if (_.isNumber(this.config.activeTabIndex)) {
                this.activateTabByIndex(this.config.activeTabIndex, false);
            }
        })
        .init(config);
};

export default tabsFactory;
