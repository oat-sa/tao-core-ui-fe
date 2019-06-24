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

/**
 * Defines the provider for a textBox widget.
 *
 * @example
 * import widgetTextBoxProvider from 'ui/form/widget/providers/textBox';
 * widgetFactory.registerProvider('textBox', widgetTextBoxProvider);
 * const widget = widgetFactory(container, {
 *     widget: 'textBox'
 *     uri: 'text',
 *     label: 'Text'
 * });
 *
 */
const widgetTextBoxProvider = {
    /**
     * Initialize the widget.
     * @param {widgetConfig} config
     */
    init(config) {
        // Simply set the type.
        // The default template is already a text input.
        config.widgetType = 'text-box';
    }
};

export default widgetTextBoxProvider;
