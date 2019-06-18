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
 * Defines a hiddenBox widget
 * @author Jean-Sébastien Conan <jean-sebastien@taotesting.com>
 */

import _ from 'lodash';
import __ from 'i18n';
import hiddenBoxTpl from 'ui/form/widget/tpl/hiddenBox';

/**
 * @typedef {widgetConfig} hiddenBoxConfig Defines the config entries available to setup a hiddenBox form widget
 * @property {Object} [confirmation] - confirmation label, uri and value
 */

/**
 * Defines the provider for a hiddenBox widget.
 *
 * @example
 * import widgetHiddenBoxProvider from 'ui/form/widget/providers/hiddenBox';
 * widgetFactory.registerProvider('hiddenBox', widgetHiddenBoxProvider);
 * const widget = widgetFactory(container, {
 *     widget: 'hiddenBox'
 *     uri: 'hb',
 *     label: 'Password',
 *     confirmation: {
 *         label: 'Please confirm'
 *     }
 * });
 */
const widgetHiddenBoxProvider = {
    /**
     * Initialize the widget.
     * @param {hiddenBoxConfig} config
     */
    init(config) {
        // the type will be reflected to the HTML markup
        config.widgetType = 'hidden-box';

        // config for the confirmation field
        config.confirmation = _.defaults(config.confirmation || {}, {
            label: __('%s Confirmation', config.label),
            uri: config.uri + '_confirmation',
            value: config.value || ''
        });
    },

    /**
     * Resets the widget to the default validators
     */
    setDefaultValidators() {
        // set default validator if the field is required
        if (this.getConfig().required) {
            this.getValidator().addValidation({
                id: 'required',
                message: __('This field is required'),
                predicate: value => /\S+/.test(value.value),
                precedence: 1
            });
        }

        // add validation for the confirmation field
        this.getValidator().addValidation({
            id: 'confirmation',
            message: __('Fields must match'),
            predicate: value => value.value === value.confirmation,
            precedence: 2
        });
    },

    /**
     * Gets the value of the widget
     * @returns {Object}
     */
    getValue() {
        const value = {
            value: this.getConfig().value,
            confirmation: this.getConfig().confirmation.value
        };

        if (this.is('rendered')) {
            value.value = this.getElement().find(`[name="${this.getUri()}"]`).val();
            value.confirmation = this.getElement().find(`[name="${this.getConfig().confirmation.uri}"]`).val();
        }

        return value;
    },

    /**
     * Sets the value of the widget
     * @param {String} value
     */
    setValue(value) {
        this.getConfig().value = value;
        this.getConfig().confirmation.value = value;

        if (this.is('rendered')) {
            this.getElement().find(`[name="${this.getUri()}"]`).val(value);
            this.getElement().find(`[name="${this.getConfig().confirmation.uri}"]`).val(value);
        }
    },

    /**
     * Overrides serialize method
     * @returns {Object}
     */
    serialize() {
        return {
            name: this.getUri(),
            value: this.getValue().value
        };
    },

    /**
     * Gets access to the actual form element
     * @returns {jQuery|null}
     */
    getWidgetElement() {
        return this.getElement()
            .find('input');
    },

    /**
     * Expose the template to the factory and it will apply it
     */
    template: hiddenBoxTpl
};

export default widgetHiddenBoxProvider;
