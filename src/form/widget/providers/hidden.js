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
 * Defines a textBox widget
 * @author Jean-Sébastien Conan <jean-sebastien@taotesting.com>
 */

import hiddenTpl from 'ui/form/widget/tpl/hidden';

/**
 * Defines the provider for a hidden field widget.
 *
 * @example
 * import widgetHiddenProvider from 'ui/form/widget/providers/hidden';
 * widgetFactory.registerProvider('hidden', widgetHiddenProvider);
 * const widget = widgetFactory(container, {
 *     widget: 'hidden'
 *     uri: 'hiddenText',
 *     value: 'hidden value'
 * });
 *
 */
const widgetHiddenProvider = {
    /**
     * Initialize the widget.
     * @param {widgetConfig} config
     */
    init(config) {
        // Simply set the type.
        config.widgetType = 'hidden';
    },

    /**
     * Gets access to the actual form element
     * @returns {jQuery}
     */
    getWidgetElement() {
        return this.getElement();
    },

    /**
     * Expose the template to the factory and it will apply it
     */
    template: hiddenTpl
};

export default widgetHiddenProvider;
