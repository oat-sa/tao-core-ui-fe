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
 * Copyright (c) 2019 Open Assessment Technologies SA ;
 */
/**
 * @author Jean-Sébastien Conan <jean-sebastien@taotesting.com>
 */

import _ from 'lodash';
import __ from 'i18n';
import Handlebars from 'handlebars';
import providerRegistry from 'core/providerRegistry';
import componentFactory from 'ui/component';
import validatorFactory from 'ui/form/validator/validator';
import validatorRendererFactory from 'ui/form/validator/renderer';
import defaultProvider from 'ui/form/widget/providers/default';
import widgetTpl from 'ui/form/widget/tpl/widget';
import labelTpl from 'ui/form/widget/tpl/label';
import  'ui/form/widget/css/widget.css';

/**
 * @typedef {Object} widgetConfig Defines the config entries available to setup a form widget
 * @property {String} widget - The type of widget.
 *                             It will be used by the main factory to retrieve
 *                             the implementation from the internal registry.
 * @property {String} widgetType - The internal type of widget
 * @property {String} uri - The identifier of the widget
 * @property {String} [label] - The label of the widget
 * @property {String|String[]} [value] - The value of the widget. Depending on the widget's type,
 *                                       it can be a single or a multiple value
 * @property {widgetRangeValue[]} [range] - Array of values used in multi-elements widgets (like combo or checkbox)
 * @property {Boolean} [required] - Tells if the value is required
 * @property {validationRule|validationRule[]|validator} [validation] - Optional validators to add
 */

/**
 * @typedef {Object} widgetRangeValue Defines a value to use in a widget range
 * @property {String} uri - The identifier of the value
 * @property {String} label - The label for the value
 */

/**
 * @typedef {Object} widgetValue Defines the value serialized from a widget
 * @property {String} name - The identifier of the widget
 * @property {String} value - The value of the widget
 */

/**
 * Some default config
 * @type {widgetConfig}
 */
const defaults = {
    widgetType: 'input-box',
    required: false,
    label: __('Label'),
    value: '',
    range: []
};

/**
 * Gets the provider with respect to the provided config
 * @param {widgetConfig} config
 * @returns {Object}
 * @throws {TypeError} if the config is not valid or if the provider does not exist
 */
function getWidgetProvider(config) {
    if (!_.isPlainObject(config)) {
        throw new TypeError('The config must be an object');
    }
    if (!_.isString(config.uri) || !config.uri) {
        throw new TypeError('The config must contain an uri');
    }
    if (!_.isString(config.widget) || !config.widget) {
        throw new TypeError('The config must declare a type of widget');
    }

    return widgetFactory.getProvider(config.widget);
}

/**
 * Makes sure a value is an array
 * @param {*} value
 * @returns {Array}
 */
function forceArray(value) {
    if (value && !_.isArray(value)) {
        value = [value];
    } else {
        value = value || [];
    }
    return value;
}

/**
 * Factory that builds a form element based on its config.
 *
 * * @example
 *  const container = $('.my-container', $container);
 *
 *  widgetFactory.registerProvider('textinput', widgetTextInputProvider);
 *
 *  const config = {
 *          widget: 'textinput'
 *          uri: 'text',
 *          label: 'Text',
 *          required: true
 *  };
 *
 *  const widget = widgetFactory(container, config)
 *      .on('change', function(value) {
 *          // ...
 *      });
 *
 * @param {HTMLElement|String} container
 * @param {widgetConfig} config
 * @param {String} config.widget - The type of widget.
 *                                 It will be used by the main factory to retrieve
 *                                 the implementation from the internal registry.
 * @param {String} config.uri - The identifier of the widget
 * @param {String} [config.label] - The label of the widget
 * @param {String|String[]} [config.value] - The value of the widget. Depending on the widget's type,
 *                                           it can be a single or a multiple value
 * @param {widgetRangeValue[]} [config.range] - Array of values used in multi-elements widgets (like combo or checkbox)
 * @param {Boolean} [config.required] - Tells if the value is required
 * @param {validationRule|validationRule[]|validator} [config.validation] - Optional validators to add
 * @returns {widgetForm}
 * @fires ready - When the component is ready to work
 */
function widgetFactory(container, config) {
    let widget;
    let validator;
    let validatorRenderer;
    const provider = getWidgetProvider(config);

    /**
     * Reflects the invalid state to the component
     * @param {Boolean} invalid
     * @param {String[]} [messages]
     */
    const setInvalidState = (invalid, messages) => {
        widget.setState('invalid', invalid);
        if (validatorRenderer) {
            if (invalid) {
                validatorRenderer.display(messages);
            } else {
                validatorRenderer.clear();
            }
        }
    };

    /**
     * Delegate a call to the provider, or fallback to the default implementation
     * @param {String} method - The name of the method to call.
     * @param {...} args - Extra parameters
     * @returns {*}
     */
    const delegate = (method, ...args) => {
        if (_.isFunction(provider[method])) {
            return provider[method].apply(widget, args);
        }
        return defaultProvider[method].apply(widget, args);
    };

    /**
     * Triggers the change event
     * @returns {widgetForm}
     * @fires change
     */
    const notifyChange = () => {
        /**
         * @event change
         * @param {String|String[]} value
         * @param {String} uri
         */
        widget.trigger('change', widget.getValue(), widget.getUri());
    };

    /**
     * @typedef {component} widgetForm
     */
    const widgetApi = {
        /**
         * Gets the widget's URI
         * @returns {String}
         */
        getUri() {
            return this.getConfig().uri;
        },

        /**
         * Gets the value of the widget
         * @returns {String|String[]}
         */
        getValue() {
            return delegate('getValue');
        },

        /**
         * Sets the value of the widget
         * @param {String|String[]} value
         * @returns {widgetForm}
         * @fires change after the value has been changed
         */
        setValue(value) {
            this.getConfig().value = value;
            delegate('setValue', value);
            notifyChange();

            return this;
        },

        /**
         * Gets access to the validation engine
         * @returns {validator}
         */
        getValidator() {
            return validator;
        },

        /**
         * Sets the validation engine
         * @param {validationRule|validationRule[]|validator} validation
         * @returns {widgetForm}
         */
        setValidator(validation) {
            if (validation && _.isFunction(validation.validate)) {
                validator = validation;
            } else {
                if (validation && !validation.validations) {
                    if (!_.isArray(validation)) {
                        validation = [validation];
                    }
                    validation = {
                        validations: validation
                    };
                }

                validator = validatorFactory(validation);
            }

            return this;
        },

        /**
         * Resets the widget to the default validators
         * @returns {widgetForm}
         */
        setDefaultValidators() {
            // restore factory default validators
            this.setValidator(this.getConfig().validator);

            // then apply provider default validators
            delegate('setDefaultValidators');

            return this;
        },

        /**
         * Resets the widget to its default value
         * @returns {widgetForm}
         */
        reset() {
            delegate('reset');
            setInvalidState(false);
            return this;
        },

        /**
         * Serializes the value of the widget
         * @returns {widgetValue}
         */
        serializeValue() {
            return delegate('serializeValue');
        },

        /**
         * Validates the widget
         * @returns {Promise}
         */
        validate() {
            return this.getValidator()
                .validate(this.getValue())
                .then(res => {
                    setInvalidState(false);
                    return res;
                })
                .catch(err => {
                    setInvalidState(true, err);
                    return Promise.reject(err);
                });
        },

        /**
         * Gets access to the actual form element
         * @returns {jQuery|null}
         */
        getWidgetElement() {
            if (this.is('rendered')) {
                return delegate('getWidgetElement');
            }
            return null;
        }
    };

    widget = componentFactory(widgetApi, defaults)
        .setTemplate(provider.template || widgetTpl)
        .on('init', function onWidgetInit() {
            this.setDefaultValidators();

            _.defer(() => this.render(container));
        })
        .on('render', function onWidgetRender() {
            // reflect the type of widget
            this.setState(this.getConfig().widgetType, true);

            // react to data change
            this.getWidgetElement().on('change blur', () => {
                const value = this.getValue();
                if (value !== this.getConfig().value) {
                    this.getConfig().value = value;
                    notifyChange();
                }
            });

            /**
             * @event ready
             */
            validatorRenderer = validatorRendererFactory(this.getElement())
                .spread(this, 'error ready');
        })
        .on('disable', function onWidgetDisable() {
            if (this.is('rendered')) {
                this.getWidgetElement().prop('disabled', true);
            }
        })
        .on('enable', function onWidgetEnable() {
            if (this.is('rendered')) {
                this.getWidgetElement().prop('disabled', false);
            }
        })
        .on('destroy', function onWidgetDestroy() {
            if (validatorRenderer) {
                validatorRenderer.destroy();
                validatorRenderer = null;
            }
        });

    if (config) {
        // the range must be an array
        config.range = forceArray(config.range);
    }

    _.defer(() => widget.init(provider.init.call(widget, config || {}) || config));

    return widget;
}

// expose a partial that can be used by every form widget to inject the label markup
Handlebars.registerPartial('ui-form-widget-label', labelTpl);

// the widgetFactory is also a providers registry
providerRegistry(widgetFactory);

export default widgetFactory;
