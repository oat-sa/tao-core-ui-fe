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
 * Defines the base component that will host the calculator UI and link it to the engine.
 */

import { engineFactory, historyPlugin } from '@oat-sa/tao-calculator/dist';
import areaBrokerFactory from 'ui/areaBroker';
import componentFactory from 'ui/component';
import boardTpl from 'ui/maths/calculator/core/tpl/board';

/**
 * Default config values
 * @type {Object}
 */
const defaultConfig = {
    expression: '',
    position: 0
};

/**
 * The list of areas that should be provided by the calculator.
 * @type {string[]}
 */
const calculatorAreas = [
    'screen', // where the expressions and their result are rendered
    'input', // where the expressions are input
    'keyboard' // the keyboard area that should provide a way to interact with the calculator
];

/**
 * Creates a calculator instance.
 * @param {object} config
 * @param {string} [config.expression=''] - The current expression.
 * @param {number} [config.position=0] - The current position in the expression (i.e. the position of the caret).
 * @param {boolean} [config.instant=false] - Whether the calculator should be in instant mode or not.
 * @param {boolean} [config.corrector=true] - Whether the calculator should be in corrector mode or not.
 * @param {object} [config.variables] - An optional list of variables.
 * @param {object} [config.commands] - An optional list of commands.
 * @param {object} [config.maths] - An optional config for the maths evaluator (@see mathsEvaluator).
 * @returns {calculator}
 */
function calculatorFactory({
    expression = '',
    position = 0,
    instant = false,
    corrector = true,
    variables = {},
    commands = {},
    maths = {}
} = {}) {
    const plugins = { history: historyPlugin };
    return engineFactory({ expression, position, instant, corrector, variables, commands, maths, plugins });
}

/**
 * Build the basic UI for a calculator
 * @param {jQuery|HTMLElement|string} $container
 * @param {function[]} pluginFactories
 * @param {object} [config]
 * @param {string} [config.expression=''] - The initial expression
 * @param {number} [config.position=0] - The initial position in the expression
 * @param {boolean} [config.instant=false] - Whether the calculator should be in instant mode or not.
 * @param {boolean} [config.corrector=true] - Whether the calculator should be in corrector mode or not.
 * @param {object} [config.variables] - An optional list of variables.
 * @param {object} [config.commands] - An optional list of commands.
 * @param {object} [config.maths] - Optional config for the maths evaluator (@see util/mathsEvaluator)
 * @param {object} [config.plugins] - Optional config for each plugins
 * @returns {calculator}
 */
function calculatorBoardFactory($container, pluginFactories, config) {
    /**
     * @type {calculator} The calculator engine.
     */
    const calculator = calculatorFactory(config);

    /**
     * @type {Map} The registered plugins
     */
    const plugins = new Map();

    /**
     * Keep the area broker instance
     * @see ui/maths/calculator/areaBroker
     */
    let areaBroker;

    /**
     * The component API.
     * @type {Object}
     */
    const calculatorApi = {
        /**
         * Gets the calculator's engine
         * @returns {calculator}
         */
        getCalculator() {
            return calculator;
        },

        /**
         * Returns the current expression
         * @returns {String}
         */
        getExpression() {
            return calculator.getExpression();
        },

        /**
         * Changes the current expression
         * @param {String} expression
         * @returns {calculator}
         * @fires expressionchange after the expression has been changed
         */
        setExpression(expression) {
            calculator.setExpression(expression);
            return this;
        },

        /**
         * Gets the current position inside the expression
         * @returns {Number}
         */
        getPosition() {
            return calculator.getPosition();
        },

        /**
         * Sets the current position inside the expression
         * @param {Number|String} position
         * @returns {calculator}
         * @fires positionchange after the position has been changed
         */
        setPosition(position) {
            calculator.setPosition(position);
            return this;
        },

        /**
         * Gets the tokens from the current expression
         * @returns {token[]}
         */
        getTokens() {
            return calculator.getTokens();
        },

        /**
         * Gets the token at the current position from the current expression
         * @returns {token|null} Returns the token at the current position, or null if none
         */
        getToken() {
            return calculator.getToken();
        },

        /**
         * Gets token index from the current position in the expression.
         * @returns {Number} Returns the index of the token at the current position.
         */
        getTokenIndex() {
            return calculator.getTokenIndex();
        },

        /**
         * Gets access to the tokenizer
         * @returns {calculatorTokenizer}
         */
        getTokenizer() {
            return calculator.getTokenizer();
        },

        /**
         * Gets a variable defined for the expression.
         * @param {String} name - The variable name
         * @returns {mathsExpression} The value. Can be another expression.
         */
        getVariable(name) {
            return calculator.getVariable(name);
        },

        /**
         * Checks if a variable is registered
         * @param {String} name
         * @returns {Boolean}
         */
        hasVariable(name) {
            return calculator.hasVariable(name);
        },

        /**
         * Sets a variable that can be used by the expression.
         * @param {String} name - The variable name
         * @param {String|Number|mathsExpression} value - The value. Can be another expression.
         * @returns {calculator}
         * @fires variableadd after the variable has been set
         */
        setVariable(name, value) {
            calculator.setVariable(name, value);
            return this;
        },

        /**
         * Deletes a variable defined for the expression.
         * @param {String} name - The variable name
         * @returns {calculator}
         * @fires variabledelete after the variable has been deleted
         */
        deleteVariable(name) {
            calculator.deleteVariable(name);
            return this;
        },

        /**
         * Gets the list of variables defined for the expression.
         * @returns {Object} The list of defined variables.
         */
        getVariables() {
            return calculator.getAllVariables();
        },

        /**
         * Sets a list of variables that can be used by the expression.
         * @param {Object} defs - A list variables to set.
         * @returns {calculator}
         * @fires variableadd after each variable has been set
         */
        setVariables(defs) {
            calculator.setVariableList(defs);
            return this;
        },

        /**
         * Deletes all variables defined for the expression.
         * @returns {calculator}
         * @fires variabledelete after the variables has been deleted
         */
        deleteVariables() {
            calculator.clearVariables();
            return this;
        },

        /**
         * Sets the value of the last result
         * @param {String|Number|mathsExpression} [result='0']
         * @returns {calculator}
         */
        setLastResult(result) {
            calculator.setLastResult(result);
            return this;
        },

        /**
         * Gets the value of the last result
         * @returns {mathsExpression}
         */
        getLastResult() {
            return calculator.getLastResult();
        },

        /**
         * Registers a command
         * @param {string} name
         * @param {function} action
         * @returns {calculator}
         * @fires commandadd after the command has been set
         */
        setCommand(name, action) {
            calculator.setCommand(name, action);
            return this;
        },

        /**
         * Gets the definition of a registered command
         * @returns {Object} The registered command
         */
        getCommand(name) {
            return calculator.getCommand(name);
        },

        /**
         * Gets the list of registered commands
         * @returns {Object} The list of registered commands
         */
        getCommands() {
            return calculator.getAllCommands();
        },

        /**
         * Checks if a command is registered
         * @param {String} name
         * @returns {Boolean}
         */
        hasCommand(name) {
            return calculator.hasCommand(name);
        },

        /**
         * Delete a registered command
         * @param {String} name
         * @returns {calculator}
         * @fires commanddelete after the command has been deleted
         */
        deleteCommand(name) {
            calculator.deleteCommand(name);
            return this;
        },

        /**
         * Inserts a term in the expression at the current position
         * @param {String} name - The name of the term to insert
         * @returns {calculator}
         * @fires error if the term to add is invalid
         * @fires termadd when the term has been added
         */
        useTerm(name) {
            calculator.insertTerm(name);
            return this;
        },

        /**
         * Inserts a list of terms in the expression at the current position
         * @param {String|String[]} names - The names of the terms to insert.
         *                                  Could be either an array of names or a list separated by spaces.
         * @returns {calculator}
         * @fires error if the term to add is invalid
         * @fires termadd when a term has been added
         */
        useTerms(names) {
            calculator.insertTermList(names);
            return this;
        },

        /**
         * Inserts a variable as a term in the expression at the current position
         * @param {String} name - The name of the variable to insert
         * @returns {calculator}
         * @fires error if the term to add is invalid
         * @fires termadd when the term has been added
         */
        useVariable(name) {
            calculator.insertVariable(name);
            return this;
        },

        /**
         * Calls a command
         * @param {String} name - The name of the called command
         * @param {...*} args - additional params for the command
         * @returns {calculator}
         * @fires command with the name and the parameters of the command
         * @fires command-<name> with the parameters of the command
         * @fires error if the command is invalid
         */
        useCommand(name, ...args) {
            calculator.invoke(name, ...args);
            return this;
        },

        /**
         * Replaces the expression and move the cursor at the end.
         * @param {String} expression - The new expression to set
         * @param {Number|String} [position=newExpression.length] - The new position to set
         * @returns {calculator}
         * @fires replace after the expression has been replaced
         */
        replace(expression, position) {
            calculator.replace(expression, position);
            return this;
        },

        /**
         * Inserts a sub-expression in the current expression and move the cursor.
         * @param {String} expression - The sub-expression to insert
         * @returns {calculator}
         * @fires insert after the expression has been inserted
         */
        insert(expression) {
            calculator.insert(expression);
            return this;
        },

        /**
         * Clears the expression
         * @returns {calculator}
         * @fires clear after the expression has been cleared
         */
        clear() {
            calculator.clear();
            return this;
        },

        /**
         * Evaluates the current expression
         * @returns {mathsExpression|null}
         * @fires evaluate when the expression has been evaluated
         * @fires result when the result is available
         * @fires syntaxerror when the expression contains an error
         */
        evaluate() {
            return calculator.evaluate();
        },

        /**
         * Runs a method in all plugins
         *
         * @param {String} method - the method to run
         * @returns {Promise} once that resolve when all plugins are done
         */
        runPlugins(method) {
            const execStack = [];

            plugins.forEach(plugin => {
                if ('function' === typeof plugin[method]) {
                    execStack.push(plugin[method]());
                }
            });

            return Promise.all(execStack);
        },

        /**
         * Gets the calculator plugins
         * @returns {plugin[]} the plugins
         */
        getPlugins() {
            return [...plugins.values()];
        },

        /**
         * Gets a plugin
         * @param {String} name - the plugin name
         * @returns {plugin} the plugin
         */
        getPlugin(name) {
            return plugins.get(name);
        },

        /**
         * Gets access to the areaBroker
         * @returns {areaBroker}
         */
        getAreaBroker() {
            return areaBroker;
        },

        /**
         * Setups the maths evaluator
         * @returns {calculator}
         */
        setupMathsEvaluator() {
            calculator.configureMathsEvaluator(this.getConfig().maths);
            return this;
        },

        /**
         * Gets access to the mathsEvaluator
         * @returns {function}
         */
        getMathsEvaluator() {
            return calculator.getMathsEvaluator();
        },

        /**
         * Sync the component state with the calculator state.
         * @returns {calculator}
         */
        syncCalculatorState() {
            const degree = calculator.isDegreeMode();
            this.setState('degree', degree);
            this.setState('radian', !degree);
            return this;
        }
    };

    /**
     * The calculator component
     * @type {component}
     */
    const calculatorComponent = componentFactory(calculatorApi, defaultConfig)
        .setTemplate(boardTpl)
        .before('init', function beforeInit() {
            calculator
                .configureMathsEvaluator(this.config.maths)
                .on('configure', () => this.syncCalculatorState())
                .on('expression', expression => this.trigger('expressionchange', expression))
                .on('position', position => this.trigger('positionchange', position))
                .on('variableadd', (name, value) => this.trigger('variableadd', name, value))
                .on('variabledelete', name => this.trigger('variabledelete', name))
                .on('variableclear', () => this.trigger('variableclear'))
                .on('commandadd', name => this.trigger('commandadd', name))
                .on('commanddelete', name => this.trigger('commanddelete', name))
                .on('term', (name, term) => {
                    this.trigger('termadd', name, term);
                    this.trigger(`termadd-${name}`, term);
                })
                .on('command', (name, ...args) => {
                    this.trigger('command', name, ...args);
                    this.trigger(`command-${name}`, ...args);
                })
                .on('replace', (expression, position) => this.trigger('replace', expression, position))
                .on('insert', (expression, position) => this.trigger('insert', expression, position))
                .on('clear', () => this.trigger('clear'))
                .on('reset', () => this.trigger('reset'))
                .on('correct', () => this.trigger('correct'))
                .on('evaluate', result => this.trigger('evaluate', result))
                .on('result', result => this.trigger('result', result))
                .on('syntaxerror', error => this.trigger('syntaxerror', error))
                .on('error', error => this.trigger('error', error));
        })
        .after('init', function afterInit() {
            this.render($container);
        })
        .before('render', function onRender() {
            const $element = this.getElement();
            areaBroker = areaBrokerFactory(calculatorAreas, $element, {
                screen: $element.find('.screen'), // where the expressions and their result are rendered
                input: $element.find('.input'), // where the expressions are input
                keyboard: $element.find('.keyboard') // the keyboard area that should provide a way to interact with the calculator
            });

            const pluginsConfig = this.getConfig().plugins || {};
            if (Array.isArray(pluginFactories)) {
                pluginFactories.forEach(pluginFactory => {
                    const plugin = pluginFactory(this, this.getAreaBroker());
                    const pluginName = plugin.getName();
                    if (pluginsConfig[pluginName]) {
                        plugin.setConfig(pluginsConfig[pluginName]);
                    }
                    plugins.set(plugin.getName(), plugin);
                });
            }

            this.syncCalculatorState();

            return this.runPlugins('install')
                .then(() => this.runPlugins('init'))
                .then(() => this.runPlugins('render'))
                .then(() => this.trigger('ready'))
                .catch(err => this.trigger('error', err));
        })
        .on('destroy', function onDestroy() {
            return this.runPlugins('destroy').then(() => {
                plugins.clear();
                calculator.off();
                this.removeAllListeners();
                areaBroker = null;
            });
        });

    setTimeout(() => calculatorComponent.init(config), 0);

    return calculatorComponent;
}

export default calculatorBoardFactory;

/**
 * Notifies the expression has changed.
 * @event expressionchange
 * @param {string} expression - The new expression.
 */

/**
 * Notifies the position inside the expression has changed.
 * @event positionchange
 * @param {number} position - The new position.
 */

/**
 * Notifies a variable has been added.
 * @event variableadd
 * @param {string} name - The name of the new variable.
 * @param {string} value - The value of the new variable.
 */

/**
 * Notifies a variable has been removed.
 * @event variabledelete
 * @param {string} name - The name of the removed variable.
 */

/**
 * Notifies all variables have been removed.
 * @event variableclear
 */

/**
 * Notifies a command has been registered.
 * @event commandadd
 * @param {string} name - The name of the new command.
 */

/**
 * Notifies a command has been removed.
 * @event commanddelete
 * @param {string} name - The name of the removed command.
 */

/**
 * Notifies a command has been invoked.
 * @event command
 * @param {string} name - The name of the called command
 * @param {...*} args - Additional params for the command
 */

/**
 * Notifies a particular command has been invoked.
 * @event command-<name>
 * @param {...*} args - Additional params for the command
 */

/**
 * Notifies a term has been added to the expression.
 * @event termadd
 * @param {string} name - The name of the added term
 * @param {term} term - The descriptor of the added term
 */

/**
 * Notifies the expression has been replaced.
 * @event replace
 * @param {string} expression - The replaced expression
 * @param {number} position - The replaced position
 */

/**
 * Notifies a sub-expression has been inserted.
 * @event insert
 * @param {string} expression - The replaced expression
 * @param {number} position - The replaced position
 */

/**
 * Notifies the expression has been cleared.
 * @event clear
 */

/**
 * Notifies the calculator has been reset.
 * @event reset
 */

/**
 * Notifies the expression has been corrected.
 * @event correct
 */

/**
 * Notifies the expression has been evaluated.
 * @event evaluate
 * @param {mathsExpression} result - The result of the expression.
 */

/**
 * Notifies the result is available.
 * @event result
 * @param {mathsExpression} result - The result of the expression.
 */

/**
 * Notifies the expression has a syntax error.
 * @event syntaxerror
 * @param {Error} err - The error object.
 */

/**
 * Notifies an error occurred.
 * @event error
 * @param {Error} err - The error object.
 */

/**
 * @typedef {import('@oat-sa/tao-calculator/src/core/terms.js').term} term
 */

/**
 * @typedef {import('@oat-sa/tao-calculator/src/core/tokenizer.js').token} token
 */

/**
 * @typedef {import('@oat-sa/tao-calculator/src/core/mathsEvaluator.js').mathsExpression} mathsExpression
 */

/**
 * @typedef {import('@oat-sa/tao-calculator/src/core/expression.js').renderTerm} renderTerm
 */
