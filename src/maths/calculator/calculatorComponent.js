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
import dynamicComponent from 'ui/dynamicComponent';
import calculatorBoardFactory from 'ui/maths/calculator/core/board';
import pluginsLoader from 'ui/maths/calculator/pluginsLoader';
import 'ui/maths/calculator/css/calculator.css';

/**
 * Default config values
 * @type {Object}
 */
const defaultConfig = {
    preserveAspectRatio: false,
    width: 240,
    height: 360,
    minWidth: 190,
    minHeight: 240,
    alternativeTemplate: null
};

/**
 * Creates a dynamic panel containing a calculator.
 * @param {Object} config - Some config entries (@see ui/dynamicComponent)
 * @param {Object} [config.calculator] - Config for the calculator (@see ui/maths/calculator/core/board)
 * @param {Object} [config.loadedPlugins] - a collection of already loaded plugins
 * @param {Object} [config.dynamicPlugins] - a collection of plugins to load
 * @returns {dynamicComponent}
 */
export default function calculatorComponentFactory(config) {
    let calculator;

    const api = {
        /**
         * Gets the nested calculator
         * @returns {calculator}
         */
        getCalculator() {
            return calculator;
        }
    };

    const calculatorComponent = dynamicComponent(api, defaultConfig)
        .on('rendercontent', function onRenderContent($content) {
            const initialWidth = this.getElement().width();
            const initialHeight = this.getElement().height();

            return pluginsLoader(this.getConfig().loadedPlugins, this.getConfig().dynamicPlugins).then(
                loadedPlugins => {
                    return new Promise(resolve => {
                        calculator = calculatorBoardFactory($content, loadedPlugins, this.getConfig().calculator).on(
                            'ready',
                            () => {
                                var initialFontSize =
                                    parseInt(this.getCalculator().getElement().css('fontSize'), 10) || 10;
                                this.on('resize', () => {
                                    if (this.getElement()) {
                                        this.getCalculator()
                                            .getElement()
                                            .css(
                                                'fontSize',
                                                initialFontSize *
                                                    Math.min(
                                                        this.getElement().width() / initialWidth,
                                                        this.getElement().height() / initialHeight
                                                    )
                                            );
                                    }
                                })
                                    .setContentSize(
                                        calculator.getElement().outerWidth(),
                                        calculator.getElement().outerHeight()
                                    )
                                    .setState('ready')
                                    .trigger('ready');
                                resolve();
                            }
                        );
                    });
                }
            );
        })
        .on('destroy', () => {
            return new Promise(resolve => {
                if (calculator) {
                    calculator
                        .after('destroy', () => {
                            calculator = null;
                            resolve();
                        })
                        .destroy();
                } else {
                    resolve();
                }
            });
        });

    setTimeout(() => calculatorComponent.init(config), 0);

    return calculatorComponent;
}
