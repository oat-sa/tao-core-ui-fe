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
 * Copyright (c) 2018-2023 Open Assessment Technologies SA ;
 */
import _ from 'lodash';
import calculatorComponent from 'ui/maths/calculator/calculatorComponent';
import pluginKeyboardFactory from 'ui/maths/calculator/plugins/keyboard/templateKeyboard/templateKeyboard';
import pluginScreenFactory from 'ui/maths/calculator/plugins/screen/simpleScreen/simpleScreen';

/**
 * Creates a simple calculator component. Screen and keyboard layout are replaceable.
 * @param {Object} config - Some config entries (@see ui/dynamicComponent)
 * @param {Function} [config.keyboardLayout] - A Handlebars template for the keyboard
 * @param {Function} [config.screenLayout] - A Handlebars template for the screen
 * @param {Object} [config.calculator] - Config for the calculator (@see ui/maths/calculator/core/board)
 * @returns {dynamicComponent}
 */
export default function defaultCalculatorFactory(config) {
    const defaultPluginsConfig = {};
    const { keyboardLayout, screenLayout } = config || {};

    if (keyboardLayout) {
        defaultPluginsConfig.templateKeyboard = {
            layout: keyboardLayout
        };
    }

    if (screenLayout) {
        defaultPluginsConfig.simpleScreen = {
            layout: screenLayout
        };
    }

    config = _.merge(
        {
            // The list of default plugins is directly built here instead of using a module variable to ensure the
            // object is unique to the instance. This wil avoid global polluting by successive instances, as nested
            // objects and arrays might be simply copied.
            loadedPlugins: {
                keyboard: [pluginKeyboardFactory],
                screen: [pluginScreenFactory]
            },
            calculator: {
                plugins: defaultPluginsConfig
            }
        },
        _.omit(config, ['keyboardLayout', 'screenLayout'])
    );

    return calculatorComponent(config);
}
