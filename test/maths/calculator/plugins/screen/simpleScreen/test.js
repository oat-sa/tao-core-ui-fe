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
define([
    'jquery',
    'lodash',
    'ui/maths/calculator/core/board',
    'ui/maths/calculator/core/labels',
    'ui/maths/calculator/plugins/screen/simpleScreen/simpleScreen'
], function ($, _, calculatorBoardFactory, labels, simpleScreenPluginFactory) {
    'use strict';

    function assertToken(assert, $container, index, token, type, value, label) {
        const element = $container.find(`.term:eq(${index})`).get(0);
        assert.equal(element.dataset.token, token, `the term ${index} has the token ${token}`);
        assert.equal(element.dataset.type, type, `the term ${index} has the type ${type}`);
        assert.equal(element.dataset.value, value, `the term ${index} has the value ${value}`);
        assert.equal(element.innerHTML.trim(), label, `the term ${index} has the label ${label}`);
    }

    function assertTokenNumber(assert, $container, count) {
        assert.equal($container.find('.term').length, count, `${count} terms has been transformed`);
    }

    QUnit.module('module');

    QUnit.test('simpleScreen', assert => {
        const calculator = calculatorBoardFactory();

        assert.expect(3);

        assert.equal(typeof simpleScreenPluginFactory, 'function', 'The plugin module exposes a function');
        assert.equal(typeof simpleScreenPluginFactory(calculator), 'object', 'The plugin factory produces an instance');
        assert.notStrictEqual(
            simpleScreenPluginFactory(calculator),
            simpleScreenPluginFactory(calculator),
            'The plugin factory provides a different instance on each call'
        );
    });

    QUnit.module('api');

    QUnit.cases
        .init([
            { title: 'install' },
            { title: 'init' },
            { title: 'render' },
            { title: 'destroy' },
            { title: 'trigger' },
            { title: 'getCalculator' },
            { title: 'getAreaBroker' },
            { title: 'getConfig' },
            { title: 'setConfig' },
            { title: 'getState' },
            { title: 'setState' },
            { title: 'show' },
            { title: 'hide' },
            { title: 'enable' },
            { title: 'disable' }
        ])
        .test('plugin API ', (data, assert) => {
            const calculator = calculatorBoardFactory();
            const plugin = simpleScreenPluginFactory(calculator);
            assert.expect(1);
            assert.equal(
                typeof plugin[data.title],
                'function',
                `The plugin instances expose a "${data.title}" function`
            );
        });

    QUnit.module('behavior');

    QUnit.test('install', assert => {
        const ready = assert.async();
        const $container = $('#fixture-install');
        const calculator = calculatorBoardFactory($container)
            .on('ready', () => {
                const areaBroker = calculator.getAreaBroker();
                const plugin = simpleScreenPluginFactory(calculator, areaBroker);

                assert.expect(1);

                calculator
                    .on('plugin-install.simpleScreen', () => {
                        assert.ok(true, 'The plugin has been installed');
                    })
                    .on('destroy', ready);

                plugin
                    .install()
                    .catch(err => {
                        assert.ok(false, `Unexpected failure : ${err.message}`);
                    })
                    .then(() => {
                        plugin.destroy();
                        calculator.destroy();
                    });
            })
            .on('error', err => {
                //eslint-disable-next-line no-console
                console.error(err);
                assert.ok(false, 'The operation should not fail!');
                ready();
            });
    });

    QUnit.test('init', assert => {
        const ready = assert.async();
        const $container = $('#fixture-init');
        const calculator = calculatorBoardFactory($container)
            .on('ready', () => {
                const areaBroker = calculator.getAreaBroker();
                const plugin = simpleScreenPluginFactory(calculator, areaBroker);

                assert.expect(1);

                calculator
                    .on('plugin-init.simpleScreen', () => {
                        assert.ok(plugin.getState('init'), 'The plugin has been initialized');
                    })
                    .on('destroy', ready);

                plugin
                    .install()
                    .then(() => plugin.init())
                    .catch(err => {
                        assert.ok(false, `Unexpected failure : ${err.message}`);
                    })
                    .then(() => {
                        plugin.destroy();
                        calculator.destroy();
                    });
            })
            .on('error', err => {
                //eslint-disable-next-line no-console
                console.error(err);
                assert.ok(false, 'The operation should not fail!');
                ready();
            });
    });

    QUnit.test('render', assert => {
        const ready = assert.async();
        const $container = $('#fixture-render');
        const calculator = calculatorBoardFactory($container)
            .on('ready', () => {
                const areaBroker = calculator.getAreaBroker();
                const plugin = simpleScreenPluginFactory(calculator, areaBroker);

                assert.expect(11);

                calculator
                    .on('plugin-render.simpleScreen', () => {
                        assert.ok(plugin.getState('ready'), 'The plugin has been rendered');
                    })
                    .on('destroy', ready);

                plugin
                    .install()
                    .then(() => plugin.init())
                    .then(() => plugin.render())
                    .then(() => {
                        const $screen = areaBroker.getScreenArea().find('.calculator-screen');
                        assert.equal($screen.length, 1, 'The screen layout has been inserted');
                        assert.equal($screen.find('.history').length, 1, 'The screen layout contains area for history');
                        assert.equal(
                            $screen.find('.expression').length,
                            1,
                            'The screen layout contains area for expression'
                        );

                        assert.equal(calculator.getExpression(), '0', 'The expression should be set to 0');
                        assert.equal(calculator.getPosition(), 1, 'The position should be set to 1');

                        assert.equal(
                            $screen.find('.term').length,
                            1,
                            'The expected number of terms has been transformed'
                        );

                        assertToken(assert, $screen, 0, 'NUM0', 'digit', '0', '0');
                    })
                    .catch(err => {
                        assert.ok(false, `Unexpected failure : ${err.message}`);
                    })
                    .then(() => {
                        plugin.destroy();
                        calculator.destroy();
                    });
            })
            .on('error', err => {
                //eslint-disable-next-line no-console
                console.error(err);
                assert.ok(false, 'The operation should not fail!');
                ready();
            });
    });

    QUnit.test('render - failure', assert => {
        const ready = assert.async();
        const $container = $('#fixture-render');
        const calculator = calculatorBoardFactory($container)
            .on('ready', () => {
                const areaBroker = calculator.getAreaBroker();
                const plugin = simpleScreenPluginFactory(calculator, areaBroker);
                plugin.setConfig({ layout: 'foo' });

                assert.expect(1);

                calculator
                    .on('plugin-render.templateScreen', () => {
                        assert.ok(false, 'Should not reach that point!');
                    })
                    .on('destroy', ready);

                plugin
                    .install()
                    .then(() => plugin.init())
                    .then(() => plugin.render())
                    .then(() => {
                        assert.ok(false, 'Should not reach that point!');
                    })
                    .catch(() => {
                        assert.ok(true, 'The operation should fail!');
                    })
                    .then(() => calculator.destroy());
            })
            .on('error', () => {
                assert.ok(true, 'The operation should fail!');
                calculator.destroy();
            });
    });

    QUnit.test('destroy', assert => {
        const ready = assert.async();
        const $container = $('#fixture-destroy');
        const calculator = calculatorBoardFactory($container)
            .on('ready', () => {
                const areaBroker = calculator.getAreaBroker();
                const plugin = simpleScreenPluginFactory(calculator, areaBroker);

                assert.expect(3);

                calculator
                    .on('plugin-render.simpleScreen', () => {
                        assert.ok(plugin.getState('ready'), 'The plugin has been rendered');
                    })
                    .on('destroy', ready);

                plugin
                    .install()
                    .then(() => plugin.init())
                    .then(() => plugin.render())
                    .then(() => {
                        assert.equal(
                            areaBroker.getScreenArea().find('.calculator-screen').length,
                            1,
                            'The screen layout has been inserted'
                        );

                        return plugin.destroy();
                    })
                    .then(() => {
                        assert.equal(
                            areaBroker.getScreenArea().find('.calculator-screen').length,
                            0,
                            'The screen layout has been removed'
                        );
                    })
                    .catch(err => {
                        assert.ok(false, `Unexpected failure : ${err.message}`);
                    })
                    .then(() => calculator.destroy());
            })
            .on('error', err => {
                //eslint-disable-next-line no-console
                console.error(err);
                assert.ok(false, 'The operation should not fail!');
                ready();
            });
    });

    QUnit.test('transform expression', assert => {
        const ready = assert.async();
        const $container = $('#fixture-transform');
        const calculator = calculatorBoardFactory($container)
            .on('ready', () => {
                const areaBroker = calculator.getAreaBroker();
                const plugin = simpleScreenPluginFactory(calculator, areaBroker);

                assert.expect(51);

                calculator
                    .on('plugin-render.simpleScreen', () => {
                        assert.ok(plugin.getState('ready'), 'The plugin has been rendered');
                    })
                    .on('destroy', ready);

                plugin
                    .install()
                    .then(() => plugin.init())
                    .then(() => plugin.render())
                    .then(() => {
                        assert.equal(
                            areaBroker.getScreenArea().find('.calculator-screen').length,
                            1,
                            'The screen layout has been inserted'
                        );

                        assert.equal(calculator.getExpression(), '0', 'The expression should be set to 0');
                        assert.equal(calculator.getPosition(), 1, 'The position should be set to 1');
                    })
                    .then(
                        () =>
                            new Promise(resolve => {
                                calculator
                                    .after('expressionchange.test', () => {
                                        calculator.off('expressionchange.test');
                                        const $screen = $container.find('.calculator-screen .expression');

                                        assertTokenNumber(assert, $screen, 3);
                                        assertToken(assert, $screen, 0, 'NUM3', 'digit', '3', '3');
                                        assertToken(assert, $screen, 1, 'ADD', 'operator', '+', '+');
                                        assertToken(assert, $screen, 2, 'NUM2', 'digit', '2', '2');

                                        resolve();
                                    })
                                    .replace('3+2');
                            })
                    )
                    .then(
                        () =>
                            new Promise(resolve => {
                                calculator
                                    .after('expressionchange.test', () => {
                                        calculator.off('expressionchange.test');
                                        const $screen = $container.find('.calculator-screen .expression');

                                        assertTokenNumber(assert, $screen, 3);
                                        assertToken(assert, $screen, 0, 'NUM3', 'digit', '3', '3');
                                        assertToken(assert, $screen, 1, 'ADD', 'operator', '+', '+');
                                        assertToken(assert, $screen, 2, 'term', 'unknown', 'x', 'x');

                                        resolve();
                                    })
                                    .replace('3+x');
                            })
                    )
                    .then(
                        () =>
                            new Promise(resolve => {
                                calculator
                                    .after('expressionchange.test', () => {
                                        calculator.off('expressionchange.test');
                                        const $screen = $container.find('.calculator-screen .expression');

                                        assertTokenNumber(assert, $screen, 5);
                                        assertToken(assert, $screen, 0, 'SQRT', 'function', 'sqrt', labels.SQRT);
                                        assertToken(assert, $screen, 1, 'NUM3', 'digit', '3', '3');
                                        assertToken(assert, $screen, 2, 'ADD', 'operator', '+', '+');
                                        assertToken(assert, $screen, 3, 'SIN', 'function', 'sin', labels.SIN);
                                        assertToken(assert, $screen, 4, 'PI', 'constant', 'PI', labels.PI);

                                        resolve();
                                    })
                                    .replace('sqrt 3+sin PI');
                            })
                    )
                    .catch(err => {
                        assert.ok(false, `Unexpected failure : ${err.message}`);
                    })
                    .then(() => {
                        plugin.destroy();
                        calculator.destroy();
                    });
            })
            .on('error', err => {
                //eslint-disable-next-line no-console
                console.error(err);
                assert.ok(false, 'The operation should not fail!');
                ready();
            });
    });

    QUnit.test('evaluate expression', assert => {
        const ready = assert.async();
        const $container = $('#fixture-evaluate');
        const calculator = calculatorBoardFactory($container)
            .on('ready', () => {
                const areaBroker = calculator.getAreaBroker();
                const plugin = simpleScreenPluginFactory(calculator, areaBroker);

                assert.expect(135);

                calculator
                    .on('plugin-render.simpleScreen', () => {
                        assert.ok(plugin.getState('ready'), 'The plugin has been rendered');
                    })
                    .on('destroy', ready);

                plugin
                    .install()
                    .then(() => plugin.init())
                    .then(() => plugin.render())
                    .then(() => {
                        assert.equal(
                            areaBroker.getScreenArea().find('.calculator-screen').length,
                            1,
                            'The screen layout has been inserted'
                        );

                        assert.equal(calculator.getExpression(), '0', 'The expression should be set to 0');
                        assert.equal(calculator.getPosition(), 1, 'The position should be set to 1');

                        assert.ok(calculator.hasVariable('ans'), 'A variable exists to store the last result');
                        assert.equal(calculator.getVariable('ans').value, '0', 'The last result is 0');
                    })
                    .then(
                        () =>
                            new Promise(resolve => {
                                const $screen = $container.find('.calculator-screen .expression');
                                calculator
                                    .after('expressionchange.test', () => {
                                        calculator.off('expressionchange.test');

                                        assertTokenNumber(assert, $screen, 3);
                                        assertToken(assert, $screen, 0, 'NUM3', 'digit', '3', '3');
                                        assertToken(assert, $screen, 1, 'ADD', 'operator', '+', '+');
                                        assertToken(assert, $screen, 2, 'NUM2', 'digit', '2', '2');

                                        assert.equal(calculator.is('error'), false, 'There is no error');

                                        resolve();
                                    })
                                    .replace('3+2');
                            })
                    )
                    .then(
                        () =>
                            new Promise(resolve => {
                                calculator
                                    .after('result.test', () => {
                                        calculator.off('result.test');
                                        const $screen = $container.find('.calculator-screen');
                                        const $expression = $screen.find('.expression');
                                        const $history = $screen.find('.history .history-expression');
                                        const $result = $screen.find('.history .history-result');

                                        assert.equal(
                                            calculator.getExpression(),
                                            'ans',
                                            'The expression should be set with the last result variable'
                                        );
                                        assert.equal(calculator.getPosition(), 3, 'The position should be set to 3');
                                        assert.equal(calculator.is('error'), false, 'There is no error');

                                        assert.equal(calculator.getVariable('ans').value, '5', 'The last result is 5');

                                        assertTokenNumber(assert, $expression, 2);
                                        assertToken(
                                            assert,
                                            $expression,
                                            0,
                                            'VAR_ANS',
                                            'variable',
                                            'ans',
                                            calculator.renderExpression('5')
                                        );
                                        assertToken(assert, $expression, 1, 'NUM5', 'digit', '5', '5');

                                        assert.equal(
                                            $screen.find('.history .history-line').length,
                                            1,
                                            'The expected number of history lines has been added in the history'
                                        );
                                        assert.equal(
                                            $screen.find('.history .history-expression').length,
                                            1,
                                            'The history contains an expression'
                                        );
                                        assert.equal(
                                            $screen.find('.history .history-result').length,
                                            1,
                                            'The history contains a result'
                                        );

                                        assertTokenNumber(assert, $history, 3);
                                        assertToken(assert, $history, 0, 'NUM3', 'digit', '3', '3');
                                        assertToken(assert, $history, 1, 'ADD', 'operator', '+', '+');
                                        assertToken(assert, $history, 2, 'NUM2', 'digit', '2', '2');

                                        assertTokenNumber(assert, $result, 1);
                                        assertToken(assert, $result, 0, 'NUM5', 'digit', '5', '5');

                                        resolve();
                                    })
                                    .evaluate();
                            })
                    )
                    .then(
                        () =>
                            new Promise(resolve => {
                                calculator
                                    .after('termadd.test', () => {
                                        calculator.off('termadd.test');
                                        const $screen = $container.find('.calculator-screen .expression');

                                        assert.equal(
                                            calculator.getExpression(),
                                            'ans+',
                                            'The expression should be ans+'
                                        );
                                        assert.equal(calculator.getPosition(), 4, 'The position should be set to 4');

                                        assertTokenNumber(assert, $screen, 3);
                                        assertToken(
                                            assert,
                                            $screen,
                                            0,
                                            'VAR_ANS',
                                            'variable',
                                            'ans',
                                            calculator.renderExpression('5')
                                        );
                                        assertToken(assert, $screen, 1, 'NUM5', 'digit', '5', '5');
                                        assertToken(assert, $screen, 2, 'ADD', 'operator', '+', '+');

                                        resolve();
                                    })
                                    .useTerm('ADD');
                            })
                    )
                    .then(
                        () =>
                            new Promise(resolve => {
                                calculator
                                    .after('termadd.test', () => {
                                        calculator.off('termadd.test');
                                        const $screen = $container.find('.calculator-screen .expression');

                                        assert.equal(
                                            calculator.getExpression(),
                                            'ans+3',
                                            'The expression should be ans+'
                                        );
                                        assert.equal(calculator.getPosition(), 5, 'The position should be set to 5');

                                        assertTokenNumber(assert, $screen, 4);
                                        assertToken(
                                            assert,
                                            $screen,
                                            0,
                                            'VAR_ANS',
                                            'variable',
                                            'ans',
                                            calculator.renderExpression('5')
                                        );
                                        assertToken(assert, $screen, 1, 'NUM5', 'digit', '5', '5');
                                        assertToken(assert, $screen, 2, 'ADD', 'operator', '+', '+');
                                        assertToken(assert, $screen, 3, 'NUM3', 'digit', '3', '3');

                                        resolve();
                                    })
                                    .useTerm('NUM3');
                            })
                    )
                    .then(
                        () =>
                            new Promise(resolve => {
                                calculator
                                    .after('result.test', () => {
                                        calculator.off('result.test');
                                        const $screen = $container.find('.calculator-screen');
                                        const $expression = $screen.find('.expression');
                                        const $history = $screen.find('.history .history-expression');
                                        const $result = $screen.find('.history .history-result');

                                        assert.equal(
                                            calculator.getExpression(),
                                            'ans',
                                            'The expression should be set with the last result variable'
                                        );
                                        assert.equal(calculator.getPosition(), 3, 'The position should be set to 3');
                                        assert.equal(calculator.is('error'), false, 'There is no error');

                                        assert.equal(calculator.getVariable('ans').value, '8', 'The last result is 8');

                                        assertTokenNumber(assert, $expression, 2);
                                        assertToken(
                                            assert,
                                            $expression,
                                            0,
                                            'VAR_ANS',
                                            'variable',
                                            'ans',
                                            calculator.renderExpression('8')
                                        );
                                        assertToken(assert, $expression, 1, 'NUM8', 'digit', '8', '8');

                                        assert.equal(
                                            $screen.find('.history .history-line').length,
                                            1,
                                            'The expected number of history lines has been added in the history'
                                        );
                                        assert.equal(
                                            $screen.find('.history .history-expression').length,
                                            1,
                                            'The history contains an expression'
                                        );
                                        assert.equal(
                                            $screen.find('.history .history-result').length,
                                            1,
                                            'The history contains a result'
                                        );

                                        assertTokenNumber(assert, $history, 4);
                                        assertToken(
                                            assert,
                                            $history,
                                            0,
                                            'VAR_ANS',
                                            'variable',
                                            'ans',
                                            calculator.renderExpression('8')
                                        );
                                        assertToken(assert, $history, 1, 'NUM8', 'digit', '8', '8');
                                        assertToken(assert, $history, 2, 'ADD', 'operator', '+', '+');
                                        assertToken(assert, $history, 3, 'NUM3', 'digit', '3', '3');

                                        assertTokenNumber(assert, $result, 1);
                                        assertToken(assert, $result, 0, 'NUM8', 'digit', '8', '8');

                                        resolve();
                                    })
                                    .evaluate();
                            })
                    )
                    .then(
                        () =>
                            new Promise(resolve => {
                                calculator
                                    .after('command-reset.test', () => {
                                        calculator.off('command-reset.test');
                                        const $screen = $container.find('.calculator-screen');
                                        const $expression = $screen.find('.expression');
                                        const $history = $screen.find('.history');

                                        assert.equal(
                                            calculator.getExpression(),
                                            '0',
                                            'The expression should be clear to 0'
                                        );
                                        assert.equal(calculator.getPosition(), 1, 'The position should be clear to 1');
                                        assert.equal(calculator.getVariable('ans').value, '0', 'The last result is 0');

                                        assertTokenNumber(assert, $expression, 1);
                                        assertToken(assert, $expression, 0, 'NUM0', 'digit', '0', '0');
                                        assertTokenNumber(assert, $history, 0);

                                        resolve();
                                    })
                                    .useCommand('reset');
                            })
                    )
                    .catch(err => {
                        assert.ok(false, `Unexpected failure : ${err.message}`);
                    })
                    .then(() => {
                        plugin.destroy();
                        calculator.destroy();
                    });
            })
            .on('error', err => {
                //eslint-disable-next-line no-console
                console.error(err);
                assert.ok(false, 'The operation should not fail!');
                ready();
            });
    });

    QUnit.test('evaluate NaN', assert => {
        const ready = assert.async();
        const $container = $('#fixture-error-nan');
        const calculator = calculatorBoardFactory($container)
            .on('ready', () => {
                const areaBroker = calculator.getAreaBroker();
                const plugin = simpleScreenPluginFactory(calculator, areaBroker);

                assert.expect(74);

                calculator
                    .on('plugin-render.simpleScreen', () => {
                        assert.ok(plugin.getState('ready'), 'The plugin has been rendered');
                    })
                    .on('destroy', ready);

                plugin
                    .install()
                    .then(() => plugin.init())
                    .then(() => plugin.render())
                    .then(() => {
                        assert.equal(
                            areaBroker.getScreenArea().find('.calculator-screen').length,
                            1,
                            'The screen layout has been inserted'
                        );

                        assert.equal(calculator.getExpression(), '0', 'The expression should be set to 0');
                        assert.equal(calculator.getPosition(), 1, 'The position should be set to 1');

                        assert.ok(calculator.hasVariable('ans'), 'A variable exists to store the last result');
                        assert.equal(calculator.getVariable('ans').value, '0', 'The last result is 0');
                    })
                    .then(
                        () =>
                            new Promise(resolve => {
                                calculator
                                    .after('expressionchange.test', () => {
                                        calculator.off('expressionchange.test');
                                        const $screen = $container.find('.calculator-screen .expression');

                                        assertTokenNumber(assert, $screen, 3);
                                        assertToken(assert, $screen, 0, 'SQRT', 'function', 'sqrt', labels.SQRT);
                                        assertToken(assert, $screen, 1, 'NEG', 'operator', '-', labels.NEG);
                                        assertToken(assert, $screen, 2, 'NUM2', 'digit', '2', '2');

                                        assert.equal(calculator.is('error'), false, 'There is no error');

                                        resolve();
                                    })
                                    .replace('sqrt -2');
                            })
                    )
                    .then(
                        () =>
                            new Promise(resolve => {
                                calculator
                                    .after('result.test', () => {
                                        calculator.off('result.test');
                                        const $screen = $container.find('.calculator-screen');
                                        const $expression = $screen.find('.expression');
                                        const $history = $screen.find('.history .history-expression');
                                        const $result = $screen.find('.history .history-result');

                                        assert.equal(
                                            calculator.getExpression(),
                                            'ans',
                                            'The expression should be set with the last result variable'
                                        );
                                        assert.equal(calculator.getPosition(), 3, 'The position should be set to 3');
                                        assert.equal(calculator.is('error'), true, 'There is an error');

                                        assert.equal(calculator.getVariable('ans').value, '0', 'The last result is 0');

                                        assertTokenNumber(assert, $expression, 1);
                                        assertToken(assert, $expression, 0, 'NAN', 'error', 'NaN', labels.NAN);

                                        assert.equal(
                                            $screen.find('.history .history-line').length,
                                            1,
                                            'The expected number of history lines has been added in the history'
                                        );
                                        assert.equal(
                                            $screen.find('.history .history-expression').length,
                                            1,
                                            'The history contains an expression'
                                        );
                                        assert.equal(
                                            $screen.find('.history .history-result').length,
                                            1,
                                            'The history contains a result'
                                        );

                                        assertTokenNumber(assert, $history, 3);
                                        assertToken(assert, $history, 0, 'SQRT', 'function', 'sqrt', labels.SQRT);
                                        assertToken(assert, $history, 1, 'NEG', 'operator', '-', labels.NEG);
                                        assertToken(assert, $history, 2, 'NUM2', 'digit', '2', '2');

                                        assertTokenNumber(assert, $result, 1);
                                        assertToken(assert, $result, 0, 'NAN', 'error', 'NaN', labels.NAN);

                                        resolve();
                                    })
                                    .evaluate();
                            })
                    )
                    .then(
                        () =>
                            new Promise(resolve => {
                                calculator
                                    .after('termadd.test', () => {
                                        calculator.off('termadd.test');
                                        const $screen = $container.find('.calculator-screen .expression');

                                        assert.equal(
                                            calculator.getExpression(),
                                            'ans+',
                                            'The expression should be ans+'
                                        );
                                        assert.equal(calculator.getPosition(), 4, 'The position should be set to 4');

                                        assertTokenNumber(assert, $screen, 3);
                                        assertToken(
                                            assert,
                                            $screen,
                                            0,
                                            'VAR_ANS',
                                            'variable',
                                            'ans',
                                            calculator.renderExpression('0')
                                        );
                                        assertToken(assert, $screen, 1, 'NUM0', 'digit', '0', '0');
                                        assertToken(assert, $screen, 2, 'ADD', 'operator', '+', labels.ADD);

                                        resolve();
                                    })
                                    .useTerm('ADD');
                            })
                    )
                    .then(
                        () =>
                            new Promise(resolve => {
                                calculator
                                    .after('command-clear.test', () => {
                                        calculator.off('command-clear.test');
                                        const $screen = $container.find('.calculator-screen');
                                        const $expression = $screen.find('.expression');
                                        const $history = $screen.find('.history');

                                        assert.equal(
                                            calculator.getExpression(),
                                            '0',
                                            'The expression should be clear to 0'
                                        );
                                        assert.equal(calculator.getPosition(), 1, 'The position should be clear to 1');
                                        assert.equal(calculator.getVariable('ans').value, '0', 'The last result is 0');

                                        assertTokenNumber(assert, $expression, 1);
                                        assertToken(assert, $expression, 0, 'NUM0', 'digit', '0', '0');

                                        assertTokenNumber(assert, $history, 0);

                                        resolve();
                                    })
                                    .useCommand('clear');
                            })
                    )
                    .catch(err => {
                        assert.ok(false, `Unexpected failure : ${err.message}`);
                    })
                    .then(() => {
                        plugin.destroy();
                        calculator.destroy();
                    });
            })
            .on('error', err => {
                //eslint-disable-next-line no-console
                console.error(err);
                assert.ok(false, 'The operation should not fail!');
                ready();
            });
    });

    QUnit.test('evaluate Infinity', assert => {
        const ready = assert.async();
        const $container = $('#fixture-error-infinity');
        const calculator = calculatorBoardFactory($container)
            .on('ready', () => {
                const areaBroker = calculator.getAreaBroker();
                const plugin = simpleScreenPluginFactory(calculator, areaBroker);

                assert.expect(74);

                calculator
                    .on('plugin-render.simpleScreen', () => {
                        assert.ok(plugin.getState('ready'), 'The plugin has been rendered');
                    })
                    .on('destroy', ready);

                plugin
                    .install()
                    .then(() => plugin.init())
                    .then(() => plugin.render())
                    .then(() => {
                        assert.equal(
                            areaBroker.getScreenArea().find('.calculator-screen').length,
                            1,
                            'The screen layout has been inserted'
                        );

                        assert.equal(calculator.getExpression(), '0', 'The expression should be set to 0');
                        assert.equal(calculator.getPosition(), 1, 'The position should be set to 1');

                        assert.ok(calculator.hasVariable('ans'), 'A variable exists to store the last result');
                        assert.equal(calculator.getVariable('ans').value, '0', 'The last result is 0');
                    })
                    .then(
                        () =>
                            new Promise(resolve => {
                                calculator
                                    .after('expressionchange.test', () => {
                                        calculator.off('expressionchange.test');
                                        const $screen = $container.find('.calculator-screen .expression');

                                        assertTokenNumber(assert, $screen, 3);
                                        assertToken(assert, $screen, 0, 'NUM3', 'digit', '3', '3');
                                        assertToken(assert, $screen, 1, 'DIV', 'operator', '/', labels.DIV);
                                        assertToken(assert, $screen, 2, 'NUM0', 'digit', '0', '0');

                                        assert.equal(calculator.is('error'), false, 'There is no error');

                                        resolve();
                                    })
                                    .replace('3/0');
                            })
                    )
                    .then(
                        () =>
                            new Promise(resolve => {
                                calculator
                                    .after('result.test', () => {
                                        calculator.off('result.test');
                                        const $screen = $container.find('.calculator-screen');
                                        const $expression = $screen.find('.expression');
                                        const $history = $screen.find('.history .history-expression');
                                        const $result = $screen.find('.history .history-result');

                                        assert.equal(
                                            calculator.getExpression(),
                                            'ans',
                                            'The expression should be set with the last result variable'
                                        );
                                        assert.equal(calculator.getPosition(), 3, 'The position should be set to 3');
                                        assert.equal(calculator.is('error'), true, 'There is an error');

                                        assert.equal(calculator.getVariable('ans').value, '0', 'The last result is 0');

                                        assertTokenNumber(assert, $expression, 1);
                                        assertToken(
                                            assert,
                                            $expression,
                                            0,
                                            'INFINITY',
                                            'error',
                                            'Infinity',
                                            labels.INFINITY
                                        );

                                        assert.equal(
                                            $screen.find('.history .history-line').length,
                                            1,
                                            'The expected number of history lines has been added in the history'
                                        );
                                        assert.equal(
                                            $screen.find('.history .history-expression').length,
                                            1,
                                            'The history contains an expression'
                                        );
                                        assert.equal(
                                            $screen.find('.history .history-result').length,
                                            1,
                                            'The history contains a result'
                                        );

                                        assertTokenNumber(assert, $history, 3);

                                        assertToken(assert, $history, 0, 'NUM3', 'digit', '3', '3');
                                        assertToken(assert, $history, 1, 'DIV', 'operator', '/', labels.DIV);
                                        assertToken(assert, $history, 2, 'NUM0', 'digit', '0', '0');

                                        assertTokenNumber(assert, $result, 1);
                                        assertToken(
                                            assert,
                                            $result,
                                            0,
                                            'INFINITY',
                                            'error',
                                            'Infinity',
                                            labels.INFINITY
                                        );

                                        resolve();
                                    })
                                    .evaluate();
                            })
                    )
                    .then(
                        () =>
                            new Promise(resolve => {
                                calculator
                                    .after('termadd.test', () => {
                                        calculator.off('termadd.test');
                                        const $screen = $container.find('.calculator-screen .expression');

                                        assert.equal(
                                            calculator.getExpression(),
                                            'ans+',
                                            'The expression should be ans+'
                                        );
                                        assert.equal(calculator.getPosition(), 4, 'The position should be set to 4');

                                        assertTokenNumber(assert, $screen, 3);
                                        assertToken(
                                            assert,
                                            $screen,
                                            0,
                                            'VAR_ANS',
                                            'variable',
                                            'ans',
                                            calculator.renderExpression('0')
                                        );
                                        assertToken(assert, $screen, 1, 'NUM0', 'digit', '0', '0');
                                        assertToken(assert, $screen, 2, 'ADD', 'operator', '+', labels.ADD);

                                        resolve();
                                    })
                                    .useTerm('ADD');
                            })
                    )
                    .then(
                        () =>
                            new Promise(resolve => {
                                calculator
                                    .after('command-clear.test', () => {
                                        calculator.off('command-clear.test');
                                        const $screen = $container.find('.calculator-screen');
                                        const $expression = $screen.find('.expression');
                                        const $history = $screen.find('.history');

                                        assert.equal(
                                            calculator.getExpression(),
                                            '0',
                                            'The expression should be clear to 0'
                                        );
                                        assert.equal(calculator.getPosition(), 1, 'The position should be clear to 1');
                                        assert.equal(calculator.getVariable('ans').value, '0', 'The last result is 0');

                                        assertTokenNumber(assert, $expression, 1);
                                        assertToken(assert, $expression, 0, 'NUM0', 'digit', '0', '0');

                                        assertTokenNumber(assert, $history, 0);

                                        resolve();
                                    })
                                    .useCommand('clear');
                            })
                    )
                    .catch(err => {
                        assert.ok(false, `Unexpected failure : ${err.message}`);
                    })
                    .then(() => {
                        plugin.destroy();
                        calculator.destroy();
                    });
            })
            .on('error', err => {
                //eslint-disable-next-line no-console
                console.error(err);
                assert.ok(false, 'The operation should not fail!');
                ready();
            });
    });

    QUnit.test('evaluate syntax error', assert => {
        const ready = assert.async();
        const $container = $('#fixture-error-syntax');
        const calculator = calculatorBoardFactory($container)
            .on('ready', () => {
                const areaBroker = calculator.getAreaBroker();
                const plugin = simpleScreenPluginFactory(calculator, areaBroker);

                assert.expect(82);

                calculator
                    .on('plugin-render.simpleScreen', () => {
                        assert.ok(plugin.getState('ready'), 'The plugin has been rendered');
                    })
                    .on('destroy', ready);
                // calculator.getCalculator().setCorrectorMode(false);
                plugin
                    .install()
                    .then(() => plugin.init())
                    .then(() => plugin.render())
                    .then(() => {
                        assert.equal(
                            areaBroker.getScreenArea().find('.calculator-screen').length,
                            1,
                            'The screen layout has been inserted'
                        );

                        assert.equal(calculator.getExpression(), '0', 'The expression should be set to 0');
                        assert.equal(calculator.getPosition(), 1, 'The position should be set to 1');

                        assert.ok(calculator.hasVariable('ans'), 'A variable exists to store the last result');
                        assert.equal(calculator.getVariable('ans').value, '0', 'The last result is 0');
                    })
                    .then(
                        () =>
                            new Promise(resolve => {
                                calculator
                                    .after('expressionchange.test', () => {
                                        calculator.off('expressionchange.test');
                                        const $screen = $container.find('.calculator-screen .expression');

                                        assertTokenNumber(assert, $screen, 2);
                                        assertToken(assert, $screen, 0, 'NUM3', 'digit', '3', '3');
                                        assertToken(assert, $screen, 1, 'ADD', 'operator', '+', labels.ADD);

                                        assert.equal(calculator.is('error'), false, 'There is no error');

                                        resolve();
                                    })
                                    .replace('3+');
                            })
                    )
                    .then(
                        () =>
                            new Promise(resolve => {
                                calculator
                                    .after('result.test', () => {
                                        assert.ok(false, 'The expresion should raise a syntax error!');
                                    })
                                    .after('syntaxerror.test', () => {
                                        calculator.off('result.test');
                                        calculator.off('syntaxerror.test');
                                        assert.equal(
                                            calculator.getExpression(),
                                            '3+',
                                            'The expression should not change'
                                        );
                                        assert.equal(calculator.getPosition(), 2, 'The position should be set to 2');
                                        assert.equal(calculator.is('error'), true, 'There is an error');

                                        assert.equal(calculator.getVariable('ans').value, '0', 'The last result is 0');

                                        const $screen = $container.find('.calculator-screen');
                                        const $expression = $screen.find('.expression');
                                        const $history = $screen.find('.history');

                                        assertTokenNumber(assert, $expression, 3);
                                        assertToken(assert, $expression, 0, 'NUM3', 'digit', '3', '3');
                                        assertToken(assert, $expression, 1, 'ADD', 'operator', '+', labels.ADD);
                                        assertToken(assert, $expression, 2, 'ERROR', 'error', 'Syntax', labels.ERROR);

                                        assertTokenNumber(assert, $history, 0);

                                        resolve();
                                    })
                                    .evaluate();
                            })
                    )
                    .then(
                        () =>
                            new Promise(resolve => {
                                calculator
                                    .after('termadd.test', () => {
                                        calculator.off('termadd.test');
                                        const $screen = $container.find('.calculator-screen .expression');

                                        assert.equal(
                                            calculator.getExpression(),
                                            '3+2',
                                            'The expression should be ans+'
                                        );
                                        assert.equal(calculator.getPosition(), 3, 'The position should be set to 3');

                                        assertTokenNumber(assert, $screen, 3);
                                        assertToken(assert, $screen, 0, 'NUM3', 'digit', '3', '3');
                                        assertToken(assert, $screen, 1, 'ADD', 'operator', '+', labels.ADD);
                                        assertToken(assert, $screen, 2, 'NUM2', 'digit', '2', '2');

                                        resolve();
                                    })
                                    .useTerm('NUM2');
                            })
                    )
                    .then(
                        () =>
                            new Promise(resolve => {
                                calculator
                                    .after('result.test', () => {
                                        calculator.off('result.test');
                                        const $screen = $container.find('.calculator-screen');
                                        const $expression = $screen.find('.expression');
                                        const $history = $screen.find('.history .history-expression');
                                        const $result = $screen.find('.history .history-result');

                                        assert.equal(
                                            calculator.getExpression(),
                                            'ans',
                                            'The expression should be set with the last result variable'
                                        );
                                        assert.equal(calculator.getPosition(), 3, 'The position should be set to 3');

                                        assert.equal(calculator.getVariable('ans').value, '5', 'The last result is 5');

                                        assertTokenNumber(assert, $expression, 2);
                                        assertToken(
                                            assert,
                                            $expression,
                                            0,
                                            'VAR_ANS',
                                            'variable',
                                            'ans',
                                            calculator.renderExpression('5')
                                        );
                                        assertToken(assert, $expression, 1, 'NUM5', 'digit', '5', '5');

                                        assert.equal(
                                            $screen.find('.history .history-line').length,
                                            1,
                                            'The expected number of history lines has been added in the history'
                                        );
                                        assert.equal(
                                            $screen.find('.history .history-expression').length,
                                            1,
                                            'The history contains an expression'
                                        );
                                        assert.equal(
                                            $screen.find('.history .history-result').length,
                                            1,
                                            'The history contains a result'
                                        );

                                        assertTokenNumber(assert, $history, 3);
                                        assertToken(assert, $history, 0, 'NUM3', 'digit', '3', '3');
                                        assertToken(assert, $history, 1, 'ADD', 'operator', '+', labels.ADD);
                                        assertToken(assert, $history, 2, 'NUM2', 'digit', '2', '2');

                                        assertTokenNumber(assert, $result, 1);
                                        assertToken(assert, $result, 0, 'NUM5', 'digit', '5', '5');

                                        resolve();
                                    })
                                    .evaluate();
                            })
                    )
                    .catch(err => {
                        assert.ok(false, `Unexpected failure : ${err.message}`);
                    })
                    .then(() => {
                        plugin.destroy();
                        calculator.destroy();
                    });
            })
            .on('error', err => {
                //eslint-disable-next-line no-console
                console.error(err);
                assert.ok(false, 'The operation should not fail!');
                ready();
            });
    });

    QUnit.test('0 and operator', assert => {
        const ready = assert.async();
        const $container = $('#fixture-zero-op');
        const calculator = calculatorBoardFactory($container)
            .on('ready', () => {
                const areaBroker = calculator.getAreaBroker();
                const plugin = simpleScreenPluginFactory(calculator, areaBroker);

                assert.expect(42);

                calculator
                    .on('plugin-render.simpleScreen', () => {
                        assert.ok(plugin.getState('ready'), 'The plugin has been rendered');
                    })
                    .on('destroy', ready);

                plugin
                    .install()
                    .then(() => plugin.init())
                    .then(() => plugin.render())
                    .then(() => {
                        const $screen = $container.find('.calculator-screen');
                        assert.equal(
                            areaBroker.getScreenArea().find('.calculator-screen').length,
                            1,
                            'The screen layout has been inserted'
                        );

                        assert.equal(calculator.getExpression(), '0', 'The expression should be set to 0');
                        assert.equal(calculator.getPosition(), 1, 'The position should be set to 1');

                        assertTokenNumber(assert, $screen, 1);
                        assertToken(assert, $screen, 0, 'NUM0', 'digit', '0', '0');
                    })
                    .then(
                        () =>
                            new Promise(resolve => {
                                calculator
                                    .after('termadd.test', () => {
                                        calculator.off('termadd.test');
                                        const $screen = $container.find('.calculator-screen');

                                        assert.equal(
                                            calculator.getExpression(),
                                            '0',
                                            'The expression should still be 0'
                                        );
                                        assert.equal(calculator.getPosition(), 1, 'The position should still be 1');

                                        assertTokenNumber(assert, $screen, 1);
                                        assertToken(assert, $screen, 0, 'NUM0', 'digit', '0', '0');

                                        resolve();
                                    })
                                    .useTerm('NUM0');
                            })
                    )
                    .then(
                        () =>
                            new Promise(resolve => {
                                calculator
                                    .after('termadd.ADD', () => {
                                        calculator.off('termadd.ADD');
                                        const $screen = $container.find('.calculator-screen .expression');

                                        assert.equal(calculator.getExpression(), '0+', 'The expression should be 0+');
                                        assert.equal(calculator.getPosition(), 2, 'The position should be set to 2');

                                        assertTokenNumber(assert, $screen, 2);
                                        assertToken(assert, $screen, 0, 'NUM0', 'digit', '0', '0');
                                        assertToken(assert, $screen, 1, 'ADD', 'operator', '+', labels.ADD);

                                        calculator
                                            .after('termadd.NUM5', () => {
                                                calculator.off('termadd.NUM5');

                                                assert.equal(
                                                    calculator.getExpression(),
                                                    '0+5',
                                                    'The expression should be 0+5'
                                                );
                                                assert.equal(
                                                    calculator.getPosition(),
                                                    3,
                                                    'The position should be set to 3'
                                                );

                                                assertTokenNumber(assert, $screen, 3);
                                                assertToken(assert, $screen, 0, 'NUM0', 'digit', '0', '0');
                                                assertToken(assert, $screen, 1, 'ADD', 'operator', '+', labels.ADD);
                                                assertToken(assert, $screen, 2, 'NUM5', 'digit', '5', '5');

                                                resolve();
                                            })
                                            .useTerm('NUM5');
                                    })
                                    .useTerm('ADD');
                            })
                    )
                    .catch(err => {
                        assert.ok(false, `Unexpected failure : ${err.message}`);
                    })
                    .then(() => {
                        plugin.destroy();
                        calculator.destroy();
                    });
            })
            .on('error', err => {
                //eslint-disable-next-line no-console
                console.error(err);
                assert.ok(false, 'The operation should not fail!');
                ready();
            });
    });

    QUnit.cases
        .init([
            {
                title: 'PI',
                term: 'PI',
                expression: 'PI',
                value: 'PI',
                type: 'constant',
                label: labels.PI
            },
            {
                title: '3',
                term: 'NUM3',
                expression: '3',
                value: '3',
                type: 'digit',
                label: '3'
            },
            {
                title: '(',
                term: 'LPAR',
                expression: '(',
                value: '(',
                type: 'aggregator',
                label: '('
            },
            {
                title: 'sqrt',
                term: 'SQRT',
                expression: 'sqrt',
                value: 'sqrt',
                type: 'function',
                label: labels.SQRT
            }
        ])
        .test('0 and const', (data, assert) => {
            const ready = assert.async();
            const $container = $('#fixture-zero-const');
            const calculator = calculatorBoardFactory($container)
                .on('ready', () => {
                    const areaBroker = calculator.getAreaBroker();
                    const plugin = simpleScreenPluginFactory(calculator, areaBroker);

                    assert.expect(23);

                    calculator
                        .on('plugin-render.simpleScreen', () => {
                            assert.ok(plugin.getState('ready'), 'The plugin has been rendered');
                        })
                        .on('destroy', ready());

                    plugin
                        .install()
                        .then(() => plugin.init())
                        .then(() => plugin.render())
                        .then(() => {
                            const $screen = $container.find('.calculator-screen');
                            assert.equal(
                                areaBroker.getScreenArea().find('.calculator-screen').length,
                                1,
                                'The screen layout has been inserted'
                            );

                            assert.equal(calculator.getExpression(), '0', 'The expression should be set to 0');
                            assert.equal(calculator.getPosition(), 1, 'The position should be set to 1');

                            assertTokenNumber(assert, $screen, 1);
                            assertToken(assert, $screen, 0, 'NUM0', 'digit', '0', '0');
                        })
                        .then(
                            () =>
                                new Promise(resolve => {
                                    calculator
                                        .after('termadd.test', () => {
                                            calculator.off('termadd.test');
                                            const $screen = $container.find('.calculator-screen');

                                            assert.equal(
                                                calculator.getExpression(),
                                                '0',
                                                'The expression should still be 0'
                                            );
                                            assert.equal(calculator.getPosition(), 1, 'The position should still be 1');

                                            assertTokenNumber(assert, $screen, 1);
                                            assertToken(assert, $screen, 0, 'NUM0', 'digit', '0', '0');

                                            resolve();
                                        })
                                        .useTerm('NUM0');
                                })
                        )
                        .then(
                            () =>
                                new Promise(resolve => {
                                    calculator
                                        .after('termadd.test', () => {
                                            calculator.off('termadd.test');
                                            const $screen = $container.find('.calculator-screen .expression');

                                            assert.equal(
                                                calculator.getExpression(),
                                                data.expression,
                                                `The expression should be ${data.expression}`
                                            );
                                            assert.equal(
                                                calculator.getPosition(),
                                                data.expression.length,
                                                `The position should be ${data.expression.length}`
                                            );

                                            assertTokenNumber(assert, $screen, 1);
                                            assertToken(
                                                assert,
                                                $screen,
                                                0,
                                                data.term,
                                                data.type,
                                                data.value,
                                                data.label
                                            );

                                            resolve();
                                        })
                                        .useTerm(data.term);
                                })
                        )
                        .catch(err => {
                            assert.ok(false, `Unexpected failure : ${err.message}`);
                        })
                        .then(() => {
                            plugin.destroy();
                            calculator.destroy();
                        });
                })
                .on('error', err => {
                    //eslint-disable-next-line no-console
                    console.error(err);
                    assert.ok(false, 'The operation should not fail!');
                    ready();
                });
        });

    QUnit.test('ans and operator', assert => {
        const ready = assert.async();
        const $container = $('#fixture-ans-op');
        const calculator = calculatorBoardFactory($container)
            .on('ready', () => {
                const areaBroker = calculator.getAreaBroker();
                const plugin = simpleScreenPluginFactory(calculator, areaBroker);

                assert.expect(47);

                calculator
                    .on('plugin-render.simpleScreen', () => {
                        assert.ok(plugin.getState('ready'), 'The plugin has been rendered');
                    })
                    .on('destroy', ready);

                plugin
                    .install()
                    .then(() => plugin.init())
                    .then(() => plugin.render())
                    .then(() => {
                        const $screen = $container.find('.calculator-screen');
                        assert.equal(
                            areaBroker.getScreenArea().find('.calculator-screen').length,
                            1,
                            'The screen layout has been inserted'
                        );

                        calculator.replace('ans');

                        assert.equal(calculator.getExpression(), 'ans', 'The expression should be set to ans');
                        assert.equal(calculator.getPosition(), 3, 'The position should be set to 3');

                        assertTokenNumber(assert, $screen, 2);
                        assertToken(assert, $screen, 0, 'VAR_ANS', 'variable', 'ans', calculator.renderExpression('0'));
                        assertToken(assert, $screen, 1, 'NUM0', 'digit', '0', '0');
                    })
                    .then(
                        () =>
                            new Promise(resolve => {
                                calculator
                                    .after('termadd.ADD', () => {
                                        calculator.off('termadd.ADD');
                                        const $screen = $container.find('.calculator-screen .expression');

                                        assert.equal(
                                            calculator.getExpression(),
                                            'ans+',
                                            'The expression should be ans+'
                                        );
                                        assert.equal(calculator.getPosition(), 4, 'The position should be set to 4');

                                        assertTokenNumber(assert, $screen, 3);
                                        assertToken(
                                            assert,
                                            $screen,
                                            0,
                                            'VAR_ANS',
                                            'variable',
                                            'ans',
                                            calculator.renderExpression('0')
                                        );
                                        assertToken(assert, $screen, 1, 'NUM0', 'digit', '0', '0');
                                        assertToken(assert, $screen, 2, 'ADD', 'operator', '+', '+');

                                        calculator
                                            .after('termadd.NUM8', () => {
                                                calculator.off('termadd.NUM8');

                                                assert.equal(
                                                    calculator.getExpression(),
                                                    'ans+8',
                                                    'The expression should be ans+8'
                                                );
                                                assert.equal(
                                                    calculator.getPosition(),
                                                    5,
                                                    'The position should be set to 5'
                                                );

                                                assertTokenNumber(assert, $screen, 4);
                                                assertToken(
                                                    assert,
                                                    $screen,
                                                    0,
                                                    'VAR_ANS',
                                                    'variable',
                                                    'ans',
                                                    calculator.renderExpression('0')
                                                );
                                                assertToken(assert, $screen, 1, 'NUM0', 'digit', '0', '0');
                                                assertToken(assert, $screen, 2, 'ADD', 'operator', '+', '+');
                                                assertToken(assert, $screen, 3, 'NUM8', 'digit', '8', '8');

                                                resolve();
                                            })
                                            .useTerm('NUM8');
                                    })
                                    .useTerm('ADD');
                            })
                    )
                    .catch(err => {
                        assert.ok(false, `Unexpected failure : ${err.message}`);
                    })
                    .then(() => {
                        plugin.destroy();
                        calculator.destroy();
                    });
            })
            .on('error', err => {
                //eslint-disable-next-line no-console
                console.error(err);
                assert.ok(false, 'The operation should not fail!');
                ready();
            });
    });

    QUnit.cases
        .init([
            {
                title: 'PI',
                term: 'PI',
                expression: 'PI',
                value: 'PI',
                type: 'constant',
                label: labels.PI
            },
            {
                title: '3',
                term: 'NUM3',
                expression: '3',
                value: '3',
                type: 'digit',
                label: '3'
            },
            {
                title: '(',
                term: 'LPAR',
                expression: '(',
                value: '(',
                type: 'aggregator',
                label: '('
            },
            {
                title: 'sqrt',
                term: 'SQRT',
                expression: 'sqrt',
                value: 'sqrt',
                type: 'function',
                label: labels.SQRT
            }
        ])
        .test('ans and const', (data, assert) => {
            const ready = assert.async();
            const $container = $('#fixture-ans-const');
            const calculator = calculatorBoardFactory($container)
                .on('ready', () => {
                    const areaBroker = calculator.getAreaBroker();
                    const plugin = simpleScreenPluginFactory(calculator, areaBroker);

                    assert.expect(20);

                    calculator
                        .on('plugin-render.simpleScreen', () => {
                            assert.ok(plugin.getState('ready'), 'The plugin has been rendered');
                        })
                        .on('destroy', ready);

                    plugin
                        .install()
                        .then(() => plugin.init())
                        .then(() => plugin.render())
                        .then(() => {
                            const $screen = $container.find('.calculator-screen');
                            assert.equal(
                                areaBroker.getScreenArea().find('.calculator-screen').length,
                                1,
                                'The screen layout has been inserted'
                            );

                            calculator.replace('ans');

                            assert.equal(calculator.getExpression(), 'ans', 'The expression should be set to ans');
                            assert.equal(calculator.getPosition(), 3, 'The position should be set to 3');

                            assertTokenNumber(assert, $screen, 2);
                            assertToken(
                                assert,
                                $screen,
                                0,
                                'VAR_ANS',
                                'variable',
                                'ans',
                                calculator.renderExpression('0')
                            );
                            assertToken(assert, $screen, 1, 'NUM0', 'digit', '0', '0');
                        })
                        .then(
                            () =>
                                new Promise(resolve => {
                                    calculator
                                        .after('termadd.test', () => {
                                            calculator.off('termadd.test');
                                            const $screen = $container.find('.calculator-screen .expression');

                                            assert.equal(
                                                calculator.getExpression(),
                                                data.expression,
                                                `The expression should be ${data.expression}`
                                            );
                                            assert.equal(
                                                calculator.getPosition(),
                                                data.expression.length,
                                                `The position should be ${data.expression.length}`
                                            );

                                            assertTokenNumber(assert, $screen, 1);
                                            assertToken(
                                                assert,
                                                $screen,
                                                0,
                                                data.term,
                                                data.type,
                                                data.value,
                                                data.label
                                            );

                                            resolve();
                                        })
                                        .useTerm(data.term);
                                })
                        )
                        .catch(err => {
                            assert.ok(false, `Unexpected failure : ${err.message}`);
                        })
                        .then(() => {
                            plugin.destroy();
                            calculator.destroy();
                        });
                })
                .on('error', err => {
                    //eslint-disable-next-line no-console
                    console.error(err);
                    assert.ok(false, 'The operation should not fail!');
                    ready();
                });
        });

    QUnit.cases
        .init([
            {
                title: '-3',
                expression: '-3',
                text: `${labels.NEG}3`
            },
            {
                title: '-PI',
                expression: '-PI',
                text: `${labels.NEG}${labels.PI}`
            },
            {
                title: 'PI-3',
                expression: 'PI-3',
                text: `${labels.PI}${labels.SUB}3`
            },
            {
                title: '4*-3',
                expression: '4*-3',
                text: `4${labels.MUL}${labels.NEG}3`
            },
            {
                title: '4-3',
                expression: '4-3',
                text: `4${labels.SUB}3`
            },
            {
                title: '4*(-3+2)',
                expression: '4*(-3+2)',
                text: `4${labels.MUL}(${labels.NEG}3${labels.ADD}2)`
            },
            {
                title: '4*(3+2)-5',
                expression: '4*(3+2)-5',
                text: `4${labels.MUL}(3${labels.ADD}2)${labels.SUB}5`
            },
            {
                title: 'sin-5',
                expression: 'sin-5',
                text: `sin${labels.NEG}5`
            }
        ])
        .test('treatment of minus operator', (data, assert) => {
            const ready = assert.async();
            const $container = $('#fixture-minus-operator');
            const calculator = calculatorBoardFactory($container)
                .on('ready', () => {
                    const areaBroker = calculator.getAreaBroker();
                    const plugin = simpleScreenPluginFactory(calculator, areaBroker);

                    assert.expect(5);

                    calculator
                        .on('plugin-render.simpleScreen', () => {
                            assert.ok(plugin.getState('ready'), 'The plugin has been rendered');
                        })
                        .on('destroy', ready);

                    plugin
                        .install()
                        .then(() => plugin.init())
                        .then(() => plugin.render())
                        .then(() => {
                            const $screen = $container.find('.calculator-screen .expression');
                            const termsCount = calculator.getTokenizer().tokenize(data.expression).length;
                            assert.equal(
                                areaBroker.getScreenArea().find('.calculator-screen .expression').length,
                                1,
                                'The screen layout has been inserted'
                            );

                            calculator.replace(data.expression);

                            assert.equal(
                                calculator.getExpression(),
                                data.expression,
                                `The expression should be set to ${data.expression}`
                            );
                            assert.equal(
                                $screen.find('.term').length,
                                termsCount,
                                `The expression has been splitted in ${termsCount} tokens`
                            );
                            assert.equal($screen.text(), data.text, 'the expected text is set');
                        })
                        .catch(err => {
                            assert.ok(false, `Unexpected failure : ${err.message}`);
                        })
                        .then(() => {
                            plugin.destroy();
                            calculator.destroy();
                        });
                })
                .on('error', err => {
                    //eslint-disable-next-line no-console
                    console.error(err);
                    assert.ok(false, 'The operation should not fail!');
                    ready();
                });
        });

    QUnit.cases
        .init([
            {
                title: '42',
                expression: 'ans',
                value: '42',
                text: '42'
            },
            {
                title: '1/3',
                expression: 'ans',
                value: '1/3',
                text: `0.33333${labels.ELLIPSIS}`
            },
            {
                title: '2/3',
                expression: 'ans',
                value: '2/3',
                text: `0.66667${labels.ELLIPSIS}`
            },
            {
                title: 'PI',
                expression: 'ans',
                value: 'PI',
                text: `3.14159${labels.ELLIPSIS}`
            }
        ])
        .test('treatment of ellipsis', (data, assert) => {
            const ready = assert.async();
            const $container = $('#fixture-ellipsis');
            const calculator = calculatorBoardFactory($container)
                .on('ready', () => {
                    const areaBroker = calculator.getAreaBroker();
                    const plugin = simpleScreenPluginFactory(calculator, areaBroker);

                    assert.expect(4);

                    calculator
                        .on('plugin-render.simpleScreen', () => {
                            assert.ok(plugin.getState('ready'), 'The plugin has been rendered');
                        })
                        .on('destroy', ready);

                    plugin
                        .install()
                        .then(() => plugin.init())
                        .then(() => plugin.render())
                        .then(() => {
                            const $screen = $container.find('.calculator-screen .expression');
                            assert.equal(
                                areaBroker.getScreenArea().find('.calculator-screen .expression').length,
                                1,
                                'The screen layout has been inserted'
                            );

                            const mathsEvaluator = calculator.getMathsEvaluator();
                            calculator.setVariable('ans', mathsEvaluator(data.value));
                            calculator.replace(data.expression);

                            assert.equal(
                                calculator.getExpression(),
                                data.expression,
                                `The expression should be set to ${data.expression}`
                            );
                            assert.equal($screen.text(), data.text, 'the expected text is set');
                        })
                        .catch(err => {
                            assert.ok(false, `Unexpected failure : ${err.message}`);
                        })
                        .then(() => {
                            plugin.destroy();
                            calculator.destroy();
                        });
                })
                .on('error', err => {
                    //eslint-disable-next-line no-console
                    console.error(err);
                    assert.ok(false, 'The operation should not fail!');
                    ready();
                });
        });

    QUnit.module('visual test');

    QUnit.test('screen', assert => {
        const ready = assert.async();
        const expression = '3*sqrt 3/2+(-2+x)*4-sin PI/2';
        const $container = $('#visual-test .calculator');
        const $input = $('#visual-test .input');
        const calculator = calculatorBoardFactory($container, [simpleScreenPluginFactory])
            .on('ready', () => {
                const areaBroker = calculator.getAreaBroker();
                assert.equal(
                    areaBroker.getScreenArea().find('.calculator-screen').length,
                    1,
                    'The screen layout has been inserted'
                );

                $input.val(expression);
                calculator.setVariable('x', '1').replace(expression);

                $('#visual-test').on('click', 'button', function onClick() {
                    if (this.classList.contains('set')) {
                        calculator.replace($input.val());
                    } else if (this.classList.contains('execute')) {
                        calculator.evaluate();
                    }
                });

                ready();
            })
            .on('error', err => {
                //eslint-disable-next-line no-console
                console.error(err);
                assert.ok(false, 'The operation should not fail!');
                ready();
            });
    });
});
