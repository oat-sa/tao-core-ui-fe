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
 * Copyright (c) 2018-2019 Open Assessment Technologies SA ;
 */
/**
 * @author Jean-Sébastien Conan <jean-sebastien@taotesting.com>
 */
import _ from 'lodash';
import dynamicComponent from 'ui/dynamicComponent';
import calculatorBoardFactory from 'ui/maths/calculator/core/board';
import pluginsLoader from 'ui/maths/calculator/pluginsLoader';
import 'ui/maths/calculator/css/calculator.css';

/**
 * Default config values
 * @type {Object}
 */
var defaultConfig = {
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
    var calculator, calculatorComponent;

    var api = {
        /**
         * Gets the nested calculator
         * @returns {calculator}
         */
        getCalculator: function getCalculator() {
            return calculator;
        }
    };

    calculatorComponent = dynamicComponent(api, defaultConfig)
        .on('rendercontent', function($content) {
            const self = this;
            const initialWidth = self.getElement().width();
            const initialHeight = self.getElement().height();

            return pluginsLoader(this.getConfig().loadedPlugins, this.getConfig().dynamicPlugins).then(function(
                loadedPlugins
            ) {
                return new Promise(function(resolve) {
                    calculator = calculatorBoardFactory($content, loadedPlugins, self.getConfig().calculator).on(
                        'ready',
                        function() {
                            var initialFontSize =
                                parseInt(
                                    self
                                        .getCalculator()
                                        .getElement()
                                        .css('fontSize'),
                                    10
                                ) || 10;
                            self.on('resize', function() {
                                if (self.getElement()) {
                                    self.getCalculator()
                                        .getElement()
                                        .css(
                                            'fontSize',
                                            initialFontSize *
                                                Math.min(
                                                    self.getElement().width() / initialWidth,
                                                    self.getElement().height() / initialHeight
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
            });
        })
        .on('destroy', function() {
            return new Promise(function(resolve) {
                if (calculator) {
                    calculator
                        .after('destroy', function() {
                            calculator = null;
                            resolve();
                        })
                        .destroy();
                } else {
                    resolve();
                }
            });
        });

    _.defer(function() {
        calculatorComponent.init(config);
    });

    return calculatorComponent;
}
