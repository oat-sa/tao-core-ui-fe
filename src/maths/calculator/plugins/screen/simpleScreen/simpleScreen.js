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
 * Plugin that manages a simple screen for the calculator, with configurable layout.
 */
import $ from 'jquery';
import nsHelper from 'util/namespace';
import scrollHelper from 'ui/scroller';
import { terms, tokensHelper } from '@oat-sa/tao-calculator/dist';
import pluginFactory from 'ui/maths/calculator/core/plugin';
import historyTpl from 'ui/maths/calculator/plugins/screen/simpleScreen/history';
import defaultScreenTpl from 'ui/maths/calculator/plugins/screen/simpleScreen/defaultTemplate';

const pluginName = 'simpleScreen';
const lastResultVariable = terms.VAR_ANS.value;
const errorValue = terms.ERROR.value;
const defaultExpression = '0';

/**
 * Default plugin config
 * @type {object}
 */
const defaultConfig = {
    // the layout of the screen
    layout: defaultScreenTpl,

    // number of decimal digits shown for decimal numbers
    decimalDigits: 5
};

/**
 * Auto scroll to the last child of a container
 * @param {jQuery} $container
 * @param {string} [sel]
 */
function autoScroll($container, sel) {
    scrollHelper.scrollTo($container.find(':last-child ' + (sel || '')), $container);
}

/**
 * Renders HTML into a container and make sure the last child is visible.
 * @param {jQuery} $container
 * @param {string} html
 * @param {string} [sel]
 */
function renderHtml($container, html, sel) {
    $container.html(html);
    autoScroll($container, sel);
}

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
            const engine = calculator.getCalculator();
            const areaBroker = calculator.getAreaBroker();
            const pluginConfig = this.getConfig();

            if ('function' !== typeof pluginConfig.layout) {
                throw new TypeError('The screen plugin requires a template to render!');
            }

            if (!calculator.getExpression().trim()) {
                calculator.replace(defaultExpression);
            }

            this.$layout = $(
                pluginConfig.layout(
                    Object.assign({}, pluginConfig, {
                        expression: calculator.renderExpression()
                    })
                )
            );
            areaBroker.getScreenArea().append(this.$layout);

            const $history = this.$layout.find('.history');
            const $expression = this.$layout.find('.expression');
            const showExpression = tokens => renderHtml($expression, calculator.renderExpression(tokens));
            let active = false;

            calculator
                .on(nsHelper.namespaceAll('expressionchange', pluginName), () => {
                    showExpression(calculator.getTokens());
                })
                .on(nsHelper.namespaceAll('result', pluginName), result => {
                    const { error } = engine;
                    calculator.setState('error', error);
                    active = false;

                    renderHtml(
                        $history,
                        historyTpl({
                            expression: calculator.renderExpression(),
                            result: calculator.renderExpression(result)
                        }),
                        '.history-result'
                    );
                    calculator.replace(lastResultVariable);

                    if (error) {
                        showExpression(result);
                    }
                })
                .on(nsHelper.namespaceAll('command', pluginName), (name, parameter) => {
                    if (active || calculator.is('error')) {
                        return;
                    }

                    if (engine.isInstantMode()) {
                        if (name === 'execute') {
                            calculator.replace(lastResultVariable);
                        }
                        return;
                    }

                    // The expression is inactive.
                    // The result was just calculated, any command invoked now would start a new expression.
                    let expr = '';

                    if (name === 'term') {
                        // If the invoked command introduces an operator, we want to apply it on the last result.
                        const [token] = parameter.split(/\s+/);
                        if (tokensHelper.isOperator(terms[token])) {
                            expr = lastResultVariable;
                        }
                    }

                    calculator.replace(expr);
                })
                .on(nsHelper.namespaceAll('clear', pluginName), () => {
                    $history.empty();
                    calculator.replace(defaultExpression);
                })
                .on(nsHelper.namespaceAll('command clear', pluginName), () => {
                    calculator.setState('error', false);
                    active = true;
                })
                .on(nsHelper.namespaceAll('syntaxerror', pluginName), () => {
                    showExpression(calculator.getExpression() + errorValue);
                    calculator.setState('error', true);
                    active = false;
                });
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
