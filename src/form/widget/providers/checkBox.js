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
 * Defines a checkBox widget
 * @author Jean-Sébastien Conan <jean-sebastien@taotesting.com>
 */

import $ from 'jquery';
import _ from 'lodash';
import __ from 'i18n';
import checkBoxTpl from 'ui/form/widget/tpl/checkBox';

/**
 * Defines the provider for a checkBox widget.
 *
 * @example
 * import widgetCheckBoxProvider from 'ui/form/widget/providers/checkBox';
 * widgetFactory.registerProvider('checkBox', widgetCheckBoxProvider);
 * const widget = widgetFactory(container, {
 *     widget: 'checkBox'
 *     uri: 'cb',
 *     label: 'All good?',
 *     range: [{
 *         uri: 'yes',
 *         label: 'Yes'
 *     }, {
 *         uri: 'no',
 *         label: 'No'
 *     }]
 * });
 */
const widgetCheckBoxProvider = {
    /**
     * Initialize the widget.
     * @param {widgetConfig} config
     */
    init(config) {
        // the type will be reflected to the HTML markup
        config.widgetType = 'check-box';

        // the value must be an array
        if (config.value && !_.isArray(config.value)) {
            config.value = [config.value];
        } else {
            config.value = config.value || [];
        }
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
                predicate: value => value.length > 0,
                precedence: 1
            });
        }
    },

    /**
     * Gets the value of the widget, which will be either an empty array or a list of URI from the range
     * @returns {String[]}
     */
    getValue() {
        let value = this.getConfig().value || [];

        if (this.is('rendered')) {
            value = [];
            this.getElement()
                .find('.option input:checked')
                .map(function mapElement() {
                    value.push($(this).val());
                });
        }

        return value;
    },

    /**
     * Sets the value of the widget, which can be either an empty array or a list of URI from the range
     * @param {String[]} value
     */
    setValue(value) {
        if (this.is('rendered')) {
            this.getWidgetElement()
                .prop('checked', false);
            _.forEach(value, v => {
                this.getElement()
                    .find(`input[name="${v}"]`)
                    .prop('checked', true);
            });
        }
    },

    /**
     * Resets the widget to its default value
     * @returns {widgetForm}
     */
    reset() {
        this.setValue([]);
        return this;
    },

    /**
     * Gets access to the actual form element
     * @returns {jQuery|null}
     */
    getWidgetElement() {
        return this.getElement()
            .find('.option input');
    },

    /**
     * Expose the template to the factory and it will apply it
     */
    template: checkBoxTpl
};

export default widgetCheckBoxProvider;
