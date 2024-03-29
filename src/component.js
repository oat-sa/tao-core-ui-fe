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
 * Copyright (c) 2015 (original work) Open Assessment Technologies SA ;
 */
/**
 * @author Jean-Sébastien Conan <jean-sebastien.conan@vesperiagroup.com>
 */
import $ from 'jquery';
import _ from 'lodash';
import eventifier from 'core/eventifier';
import defaultTpl from 'ui/component/tpl/component';
import 'ui/component/css/components.css';

var _slice = [].slice;

/**
 * Handles the resize of the component regarding the config set
 */
function delegatedResize() {
    let width = this.config.width;
    let height = this.config.height;
    const $container = this.getContainer();
    const $element = this.getElement();

    if ($container) {
        if ('auto' === width) {
            width = $container.width();
        }
        if ('auto' === height) {
            height = $container.height();
        }
    }

    if ($element) {
        if (_.isNumber(width)) {
            $element.css({ width: `${width}px` });
        }
        if (_.isNumber(height)) {
            $element.css({ height: `${height}px` });
        }
    }

    this._width = width;
    this._height = height;
}

/**
 * Builds a component from a base skeleton
 * @param {Object} [specs] - Some extra methods to assign to the component instance
 * @param {Object} [defaults] - Some default config entries
 * @returns {component}
 */
function component(specs, defaults) {
    // the template is a private property
    var componentTpl = defaultTpl;

    //contains the states of the components
    var componentState = {};

    //where the component is added
    var $container;

    // base skeleton
    /**
     * @typedef {Object} Component
     */
    var componentApi = {
        /**
         * Initializes the component
         * @param {Object} config
         * @param {jQuery|HTMLElement|String} [config.renderTo] - An optional container in which renders the component
         * @param {Boolean} [config.replace] - When the component is appended to its container, clears the place before
         * @param {Number|String} [config.width] - The width in pixels, or 'auto' to use the container's width
         * @param {Number|String} [config.height] - The height in pixels, or 'auto' to use the container's height
         * @returns {component}
         * @fires component#init
         */
        init: function init(config) {
            this.config = _(config || {})
                .omitBy(function(value) {
                    return value === null || typeof value === 'undefined';
                })
                .defaults(defaults || {})
                .value();

            componentState = {};

            /**
             * Executes extra init tasks
             * @event component#init
             */
            this.trigger('init');

            if (this.config.renderTo) {
                $container = $(this.config.renderTo);
                this.render();
            }

            return this;
        },

        /**
         * Uninstalls the component
         * @returns {component}
         * @fires component#destroy
         */
        destroy: function destroy() {
            /**
             * Executes extra destroy tasks
             * @event component#destroy
             */
            this.trigger('destroy');

            if (this.$component) {
                this.$component.remove();
            }

            this.$component = null;
            componentState = {};

            return this;
        },

        /**
         * Renders the component
         * @param {jQuery|HTMLElement|String} [container] - where the component is rendered
         * @returns {component}
         * @fires component#render
         */
        render: function render(container) {
            if (container) {
                $container = $(container);
            }
            this.$component = $(componentTpl(this.config));

            if ($container) {
                if (this.config.replace) {
                    $container.empty();
                }
                $container.append(this.$component);
            }

            this.setState('rendered', true);

            delegatedResize.call(this);

            /**
             * Executes extra render tasks
             * @event component#render
             * @param {jQuery} $component
             */
            this.trigger('render', this.$component);

            return this;
        },

        /**
         * Sets the component's size
         * @param {Number|String} width - The width in pixels, or 'auto' to use the container's width
         * @param {Number|String} height - The height in pixels, or 'auto' to use the container's height
         * @returns {component}
         * @fires component#setsize
         */
        setSize: function setSize(width, height) {
            this.config.width = width;
            this.config.height = height;

            if (this.is('rendered')) {
                delegatedResize.call(this);
            }

            /**
             * Executes extra resize tasks
             * @event component#setsize
             * @param {Number|String} width
             * @param {Number|String} height
             */
            this.trigger('setsize', width, height);

            return this;
        },

        /**
         * Get the component's size
         * @returns {Object}
         * @fires component#setsize
         */
        getSize: function getSize() {
            if (this.is('rendered')) {
                return {
                    width: this._width || 0,
                    height: this._height || 0
                };
            }
        },

        /**
         * Get the component rendered size
         * @param {Boolean} includeMargin - include the margins in the returned size
         * @returns {{width: number, height: number}}
         */
        getOuterSize: function getOuterSize(includeMargin) {
            var $component;
            if (this.is('rendered')) {
                $component = this.getElement();
                includeMargin = includeMargin || false;

                return {
                    width: Math.round($component.outerWidth(includeMargin)),
                    height: Math.round($component.outerHeight(includeMargin))
                };
            }
        },

        /**
         * Shows the component
         * @returns {component}
         * @fires component#show
         */
        show: function show() {
            /**
             * Executes extra tasks on show
             * @event component#show
             * @param {component} component
             */
            this.trigger('show', this);

            return this.setState('hidden', false);
        },

        /**
         * Hides the component
         * @returns {component}
         * @fires component#hide
         */
        hide: function hide() {
            /**
             * Executes extra tasks on hide
             * @event component#hide
             * @param {component} component
             */
            this.trigger('hide', this);

            return this.setState('hidden', true);
        },

        /**
         * Enables the component
         * @returns {component}
         * @fires component#enable
         */
        enable: function enable() {
            /**
             * Executes extra tasks on enable
             * @event component#enable
             * @param {component} component
             */
            this.trigger('enable', this);

            return this.setState('disabled', false);
        },

        /**
         * Disables the component
         * @returns {component}
         * @fires component#disable
         */
        disable: function disable() {
            /**
             * Executes extra tasks on disable
             * @event component#disable
             * @param {component} component
             */
            this.trigger('disable', this);

            return this.setState('disabled', true);
        },

        /**
         * Checks if the component has a particular state
         * @param {String} state
         * @returns {Boolean}
         */
        is: function is(state) {
            return !!componentState[state];
        },

        /**
         * Sets the component to a particular state
         * @param {String} state
         * @param {Boolean} flag
         * @returns {component}
         * @fires component#state
         */
        setState: function setState(state, flag) {
            flag = !!flag;
            componentState[state] = flag;

            if (this.$component) {
                this.$component.toggleClass(state, flag);
            }

            /**
             * Executes extra tasks on state change
             * @event component#state
             * @param {String} state
             * @param {Boolean} flag
             * @param {component} component
             */
            this.trigger('state', state, flag, this);

            return this;
        },

        /**
         * Gets the underlying DOM element
         * @returns {jQuery}
         */
        getContainer: function getContainer() {
            return $container;
        },

        /**
         * Gets the underlying DOM element
         * @returns {jQuery}
         */
        getElement: function getElement() {
            return this.$component;
        },

        /**
         * Gets the template used to render this component
         * @returns {Function}
         */
        getTemplate: function getTemplate() {
            return componentTpl;
        },

        /**
         * Sets the template used to render this component
         * @param {Function} template
         * @returns {componentApi}
         * @fires component#template
         */
        setTemplate: function setTemplate(template) {
            var tpl = template || defaultTpl;
            componentTpl = tpl;

            // ensure the template is defined as a function
            if (!_.isFunction(componentTpl)) {
                componentTpl = function() {
                    return tpl;
                };
            }

            /**
             * Executes extra tasks on template change
             * @event component#template
             * @param {function} componentTpl
             */
            this.trigger('template', componentTpl);

            return this;
        },

        /**
         * Get the component's configuration
         */
        getConfig: function getConfig() {
            return this.config || defaults || {};
        }
    };

    // let's extend the instance with extra methods
    if (specs) {
        _(specs)
            .functions()
            .forEach(function(method) {
                componentApi[method] = function delegate() {
                    return specs[method].apply(componentApi, _slice.call(arguments));
                };
            });
    }

    return eventifier(componentApi);
}

export default component;
