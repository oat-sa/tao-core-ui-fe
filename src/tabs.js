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
 * A simple Tabs component that:
 * - manage a list of tabs
 * - each tab is represented by an identifier and a label
 * - only one tab can be activated at a time
 * - when a tab is being activated, a `tabactivate` event is emitted, with the tab identifier as parameter
 * - when a tab has been activated, a `tabchange` event is emitted, with the tab identifier as parameter
 * - a panel can be linked to each tab, based a data attribute `data-tab-content` that should match the tab name
 * - a tab can be disabled
 *
 * @author Martin Nicholson <martin@taotesting.com>
 * @author Ricardo Proença, <ricardo@taotesting.com>
 */
import $ from 'jquery';
import _ from 'lodash';
import hider from 'ui/hider';
import componentFactory from 'ui/component';
import tabsTpl from 'ui/tabs/tpl/tabs';
import 'ui/tabs/css/tabs.css';

/**
 * @typedef {Object} tabsBarConfig
 * @property {String} [activeTab] - The name of the active tab
 * @property {Integer} [activeTabIndex] - the index of the tab to start on
 * @property {tabConfig[]} [tabs] - The list of tabs
 * @property {Boolean} [hideLoneTab] - Prevent to show the tabs when only one is registered
 * @property {jQuery|HTMLElement|String|Boolean} [showHideTarget] - Defines the container where to wire up tabs to
 * content, the link will be automatic, based on the data attribute `data-tab-content` that should match the tab name.
 * If the value is `true` the component's container will be used to find the panels.
 */

/**
 * @typedef {Object} tabConfig
 * @property {Boolean} disabled - The tab is disabled
 * @property {String} name - The tab identifier
 * @property {String} label - The tab label
 * @property {String} [icon] - An optional tab icon
 * @property {String} [cls] - An optional CSS class name
 */

/**
 * CSS class for the active tab
 * @type {String}
 */
const activeTabCls = 'active';

/**
 * CSS selector for the tabs
 * @type {String}
 */
const tabSelector = '.tab';

/**
 * CSS selector for the tab actions
 * @type {String}
 */
const actionSelector = '.action';

/**
 * Name of the attribute that contain the tab identifier
 * @type {String}
 */
const tabNameAttr = 'data-tab-name';

/**
 * Name of the attribute that contain the panel identifier
 * @type {String}
 */
const panelNameAttr = 'data-tab-content';

/**
 * Builds an instance of the tabs component.
 *
 * @example
 *  // activate by index
 *  const instance = tabsFactory($container, {
 *      tabs: [
 *          { label: 'TAO Local', name: 'local-delivery' },
 *          { label: 'TAO Remote', name: 'remote-delivery' },
 *          { label: 'LTI-based', name: 'lti-delivery', disabled: true }
 *      ],
 *      activeTabIndex: 1
 *  });
 *
 *  // activate by name
 *  const instance = tabsFactory($container, {
 *      tabs: [
 *          { label: 'TAO Local', name: 'local-delivery' },
 *          { label: 'TAO Remote', name: 'remote-delivery' },
 *          { label: 'LTI-based', name: 'lti-delivery', disabled: true }
 *      ],
 *      activeTab: 'remote-delivery'
 *  });
 *
 *  // link to panels
 *  const instance = tabsFactory($container, {
 *      showHideTarget: $panelContainer,
 *      tabs: [
 *          { label: 'TAO Local', name: 'local-delivery' },
 *          { label: 'TAO Remote', name: 'remote-delivery' },
 *          { label: 'LTI-based', name: 'lti-delivery', disabled: true }
 *      ]
 *  });
 *
 *  instance
 *      .on('ready', function onReady() {
 *          // the component is ready
 *      })
 *      .before('tabactivate', function beforeTabChange(e, name) {
 *          // a tab is being activated
 *          // it is possible to prevent its activation by returning a rejected promise
 *          if (name === 'lti-delivery') {
 *              return Promise.reject();
 *          }
 *      })
 *      .on('tabchange', function onTabChange(name) {
 *          // a tab has been activated
 *      });
 *
 * @param {HTMLElement|String} container
 * @param {tabsBarConfig} config
 * @param {String} [config.activeTab] - The name of the active tab
 * @param {Integer} [config.activeTabIndex] - the index of the tab to start on
 * @param {tabConfig[]} [config.tabs] - The list of tabs
 * @param {Boolean} [config.hideLoneTab] - Prevent to show the tabs when only one is registered
 * @param {jQuery|HTMLElement|String|Boolean} [config.showHideTarget] - Defines the container where to wire up tabs to
 * content, the link will be automatic, based on the data attribute `data-tab-content` that should match the tab name.
 * If the value is `true` the component's container will be used to find the panels.
 * @returns {tabsBarComponent}
 * @fires ready - When the component is ready to work
 * @fires error - When the component encounters issue
 * @fires tabactivate - Each time a tab must be activated
 * @fires tabchange - Each time a tab has been activated
 * @fires tabchange-${name} - Each time the named tab has been activated
 * @fires tabsupdate - Each time the tabs are updated
 */
function tabsFactory(container, config) {
    // the list of displayed tabs
    let tabs = [];

    // the current active tab
    let activeTabName = null;

    // enable/disable elements
    const enableElement = $el => $el.prop('disabled', false);
    const disableElement = $el => $el.prop('disabled', true);

    /**
     * Gets a tab by its name
     * @param {String} name
     * @returns {tabConfig}
     */
    const findTabByName = name => tabs.find(tab => tab.name === name);

    /**
     * Gets a tab by its name, throw a TypeError if the tab does not exist
     * @param {String} name - human-readable identifier
     * @returns {tabConfig}
     * @throws {TypeError} on invalid name param
     */
    const findTabByNameOrThrow = name => {
        const tab = findTabByName(name);
        if (!tab) {
            throw new TypeError(`No tab exists with the name: ${name}`);
        }
        return tab;
    };

    /**
     * Initializes the tabs
     * @param {tabsBarComponent} component
     */
    const initTabs = component => {
        if (activeTabName) {
            const activeTab = activeTabName;
            activeTabName = null;
            component.setActiveTab(activeTab);
        }

        if (component.getConfig().hideLoneTab && tabs.length === 1) {
            hider.hide(component.getElement().find(tabSelector));
        }
    };

    /**
     * API of the tabs component
     * @exports ui/tabs
     */
    const tabsApi = {
        /**
         * Set new values for the tabs
         * @param {Array} newTabs
         * @returns {tabsBarComponent} instance
         * @throws {TypeError} on non-Array tabs
         * @fires tabsupdate once the tabs have been updated
         * @fires tabactivate once the active tab is updated
         */
        setTabs(newTabs) {
            if (!Array.isArray(newTabs)) {
                throw new TypeError('The provided tabs are not a valid array');
            }

            tabs = [...newTabs];

            // reset tab to default if needed
            if (!activeTabName || !findTabByName(activeTabName)) {
                activeTabName = this.getDefaultActiveTab();
            }

            // replace the displayed tabs if already rendered
            if (this.is('rendered')) {
                const template = this.getTemplate();
                this.getElement().html(
                    $(template({tabs})).html()
                );

                // make sure the tab is selected and hide lone tab if needed
                initTabs(this);
            }

            /**
             * @event tabsupdate - Tabs have been updated
             * @param {Array} newTabs
             */
            this.trigger('tabsupdate', newTabs);

            return this;
        },

        /**
         * Retrieve internal tabs array
         * @returns {Array} tabs list
         */
        getTabs() {
            return [...tabs];
        },

        /**
         * Gets the name of the active tab (if any)
         * @returns {String}
         */
        getActiveTab() {
            return activeTabName;
        },

        /**
         * Gets the index of the current active tab (if any)
         * @returns {Number}
         */
        getActiveTabIndex() {
            return tabs.findIndex(tab => tab.name === activeTabName);
        },

        /**
         * Gets the name of the default active tab
         * @returns {String|null}
         */
        getDefaultActiveTab() {
            const {activeTab, activeTabIndex} = this.getConfig();

            if (activeTab && findTabByName(activeTab)) {
                return activeTab;
            }

            if (typeof activeTabIndex === 'number' && tabs[activeTabIndex]) {
                return tabs[activeTabIndex].name;
            }

            return tabs.length && tabs[0].name || null;
        },

        /**
         * Activates a single tab by its name (deactivating others)
         * @param {String} name - human-readable identifier
         * @returns {tabsBarComponent} instance
         * @throws {TypeError} on invalid name param
         * @fires tabactivate
         */
        setActiveTab(name) {
            const tab = findTabByNameOrThrow(name);

            if (!tab.disabled) {
                /**
                 * @event tabactivate - A tab is being activated
                 * @param {String} - name
                 */
                this.trigger('tabactivate', tab.name);
            }

            return this;
        },

        /**
         * Activates a single tab by its index (deactivating others)
         * Triggers the automatic showing & hiding of target tab-contents
         * @param {Number} index - zero-based
         * @returns {tabsBarComponent} instance
         * @throws {TypeError} on invalid index param
         * @fires tabactivate
         */
        setActiveTabIndex(index) {
            if (typeof index !== 'number' || index < 0 || index >= tabs.length) {
                throw new TypeError(`No tab exists at index: ${index}`);
            }
            const tab = tabs[index];
            if (!tab.disabled) {
                /**
                 * @event tabactivate - A tab is being activated
                 * @param {String} - name
                 */
                this.trigger('tabactivate', tab.name);
            }

            return this;
        },

        /**
         * Enables a single tab by its name
         * @param {String} name - human-readable identifier
         * @returns {tabsBarComponent} instance
         * @throws {TypeError} on invalid name param
         * @fires tabenable
         */
        enableTab(name) {
            const tab = findTabByNameOrThrow(name);

            tab.disabled = false;

            if (this.is('rendered')) {
                enableElement(this.getElement().find(`[${tabNameAttr}="${name}"] ${actionSelector}`));
            }

            /**
             * @event tabenable - A tab is enabled
             * @param {String} - name
             */
            this.trigger('tabenable', name);

            return this;
        },

        /**
         * Disables a single tab by its name
         * @param {String} name - human-readable identifier
         * @returns {tabsBarComponent} instance
         * @throws {TypeError} on invalid name param
         * @fires tabdisable
         */
        disableTab(name) {
            const tab = findTabByNameOrThrow(name);

            tab.disabled = true;

            if (this.is('rendered')) {
                disableElement(this.getElement().find(`[${tabNameAttr}="${name}"] ${actionSelector}`));
            }

            /**
             * @event tabdisable - A tab is disabled
             * @param {String} - name
             */
            this.trigger('tabdisable', name);
        },

        /**
         * Shows one tab content, hides the rest
         * The tab content elements are not tied to any template and can be located anywhere in the DOM
         * @param {String} name - human-readable identifier
         * @throws {TypeError} on invalid name param
         * @fires tabshowcontent
         */
        showTabContent(name) {
            findTabByNameOrThrow(name);

            const {showHideTarget} = this.getConfig();
            if (showHideTarget) {
                (showHideTarget === true ? this.getContainer() : $(showHideTarget))
                    .find(`[${panelNameAttr}]`)
                    .addClass('hidden')
                    .filter(`[${panelNameAttr}="${name}"]`)
                    .removeClass('hidden');
            }

            /**
             * @event tabshowcontent - A tab panel is displayed
             * @param {String} - name
             */
            this.trigger('tabshowcontent', name);
        }
    };

    /**
     * @typedef {component} tabsBarComponent
     */
    const tabsBarComponent = componentFactory(tabsApi)
        // set the component's layout
        .setTemplate(tabsTpl)

        // auto render on init
        .on('init', function onTabsBarInit() {
            try {
                // extract the tabs from the config
                if (this.config && this.config.tabs) {
                    this.setTabs(this.config.tabs);
                }

                // auto render on init (defer the call to give a chance to the init event to be completed before)
                _.defer(() => this.render(container));
            } catch (err) {
                /**
                 * @event error
                 * @param {Error} err
                 */
                this.trigger('error', err);
            }
        })

        // renders the component
        .on('render', function onTabsBarRender() {
            try {
                // make sure the tab is selected and hide lone tab if needed
                initTabs(this);
            } catch (err) {
                /**
                 * @event error
                 * @param {Error} err
                 */
                this.trigger('error', err);
            }

            // delegate the click on tabs
            this.getElement().on('click', tabSelector, e => {
                try {
                    this.setActiveTab(e.currentTarget.getAttribute(tabNameAttr));
                } catch (err) {
                    /**
                     * @event error
                     * @param {Error} err
                     */
                    this.trigger('error', err);
                }
            });

            /**
             * @event ready - The component is ready to work
             */
            this.trigger('ready');
        })

        // take care of the disable state
        .on('disable', function onButtonDisable() {
            if (this.is('rendered')) {
                disableElement(this.getElement().find(`[${tabNameAttr}] ${actionSelector}`));
            }
        })
        .on('enable', function onButtonEnable() {
            if (this.is('rendered')) {
                this.getElement()
                    .find(`[${tabNameAttr}] ${actionSelector}`)
                    .each((index, el) => {
                        const tab = findTabByName(el.parentNode.getAttribute(tabNameAttr));
                        if (!tab || !tab.disabled) {
                            el.disabled = false;
                        }
                    });
            }
        })

        // reacts to tab activate
        .on('tabactivate', function onTabActivate(name) {
            const tab = findTabByName(name);
            if (tab && !tab.disabled && name !== activeTabName) {
                activeTabName = name;

                if (this.is('rendered')) {
                    this.getElement()
                        .find(tabSelector)
                        .removeClass(activeTabCls)
                        .filter(`[${tabNameAttr}="${name}"]`)
                        .addClass(activeTabCls);
                }

                /**
                 * @event tabchange - A tab is activated
                 * @param {String} - name
                 */
                this.trigger('tabchange', name);
            }
        })

        // reacts to tab change
        .on('tabchange', function onTabChange(name) {
            // auto show the linked panel
            if (this.getConfig().showHideTarget) {
                this.showTabContent(name);
            }

            /**
             * @event tabchange-${name} - The tab is activated
             */
            this.trigger(`tabchange-${name}`);
        });

    // initialize the component with the provided config
    // defer the call to allow to listen to the init event
    _.defer(() => tabsBarComponent.init(config));

    return tabsBarComponent;
}

export default tabsFactory;
