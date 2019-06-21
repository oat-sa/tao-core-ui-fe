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

import __ from 'i18n';

/**
 * Default implementation of a form widget.
 * @type {Object}
 */
const defaultWidgetProvider = {
    /**
     * Gets the value of the widget
     * @returns {String}
     */
    getValue() {
        if (this.is('rendered')) {
            return this.getWidgetElement().val() || '';
        }

        return this.getConfig().value || '';
    },

    /**
     * Sets the value of the widget
     * @param {String} value
     */
    setValue(value) {
        if (this.is('rendered')) {
            this.getWidgetElement().val(value);
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
                predicate: /\S+/,
                precedence: 1
            });
        }
    },

    /**
     * Resets the widget to its default value
     */
    reset() {
        this.setValue('');
    },

    /**
     * Serializes the value of the widget
     * @returns {widgetValue}
     */
    serializeValue() {
        return {
            name: this.getUri(),
            value: this.getValue()
        };
    },

    /**
     * Gets access to the actual form element
     * @returns {jQuery}
     */
    getWidgetElement() {
        return this.getElement().find(`[name="${this.getUri()}"]`);
    }
};

export default defaultWidgetProvider;
