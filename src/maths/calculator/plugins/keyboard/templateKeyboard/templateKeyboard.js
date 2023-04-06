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
/**
 * Plugin that manages a keyboard for the calculator, with configurable layout.
 * Each key must declare the target command, using DOM attributes:
 * - data-command: the name of the command to call
 * - data-param: the optional parameter to apply to the command
 */
import $ from 'jquery';
import nsHelper from 'util/namespace';
import pluginFactory from 'ui/maths/calculator/core/plugin';
import labels from 'ui/maths/calculator/core/labels';
import defaultKeyboardTpl from 'ui/maths/calculator/plugins/keyboard/templateKeyboard/defaultTemplate';

const pluginName = 'templateKeyboard';

const defaultConfig = {
    layout: defaultKeyboardTpl
};

export default pluginFactory(
    {
        name: pluginName,

        /**
         * Called when the plugin should be initialized.
         */
        init() {
            // required by the plugin factory to validate this plugin
        },

        /**
         * Called when the plugin should be rendered.
         */
        render() {
            const calculator = this.getCalculator();
            const areaBroker = calculator.getAreaBroker();
            const pluginConfig = this.getConfig();
            const templateConfig = Object.assign({ labels }, pluginConfig);

            if ('function' !== typeof pluginConfig.layout) {
                throw new TypeError('The keyboard plugin requires a template to render!');
            }

            this.$layout = $(pluginConfig.layout(templateConfig)).on(
                nsHelper.namespaceAll('click', pluginName),
                '.key',
                function onClick() {
                    const $key = $(this).closest('.key');
                    const command = $key.data('command');
                    const param = $key.data('param');
                    if (command) {
                        calculator.useCommand(command, param);
                    }
                }
            );

            areaBroker.getKeyboardArea().append(this.$layout);
        },

        /**
         * Called when the plugin is destroyed. Mostly when the host is destroyed itself.
         */
        destroy() {
            if (this.$layout) {
                this.$layout.off(`.${pluginName}`).remove();
                this.$layout = null;
            }
            this.getCalculator().off(`.${pluginName}`);
        }
    },
    defaultConfig
);
