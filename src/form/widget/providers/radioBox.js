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
 * Defines a radioBox widget
 * @author Jean-Sébastien Conan <jean-sebastien@taotesting.com>
 */

import radioBoxTpl from 'ui/form/widget/tpl/radioBox';

/**
 * Defines the provider for a radioBox widget.
 *
 * @example
 * import widgetRadioBoxProvider from 'ui/form/widget/providers/radioBox';
 * widgetFactory.registerProvider('radioBox', widgetRadioBoxProvider);
 * const widget = widgetFactory(container, {
 *     widget: 'radioBox'
 *     uri: 'rb',
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
const widgetRadioBoxProvider = {
    /**
     * Initialize the widget.
     * @param {widgetConfig} config
     */
    init(config) {
        // the type will be reflected to the HTML markup
        config.widgetType = 'radio-box';
    },

    /**
     * Gets the value of the widget, which will be either an empty string or an URI from the range.
     * @returns {String}
     */
    getValue() {
        let value = this.getConfig().value || '';

        if (this.is('rendered')) {
            value = this.getElement()
                .find(`.option input:checked`)
                .val() || '';
        }

        return value;
    },

    /**
     * Sets the value of the widget, which can be either an empty string or an URI from the range.
     * @param {String} value
     */
    setValue(value) {
        if (this.is('rendered')) {
            this.getWidgetElement()
                .prop('checked', false);
            this.getElement()
                .find(`.option input[value="${value}"]`)
                .prop('checked', true);
        }
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
    template: radioBoxTpl
};

export default widgetRadioBoxProvider;
