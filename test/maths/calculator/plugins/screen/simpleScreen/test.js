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
 * Copyright (c) 2018 Open Assessment Technologies SA ;
 */
/**
 * @author Jean-Sébastien Conan <jean-sebastien@taotesting.com>
 */
define([
    'jquery',
    'lodash',
    'ui/maths/calculator/core/board',
    'ui/maths/calculator/core/terms',
    'ui/maths/calculator/core/expression',
    'ui/maths/calculator/plugins/screen/simpleScreen/simpleScreen',
    'util/mathsEvaluator'
], function (
    $,
    _,
    calculatorBoardFactory,
    registeredTerms,
    expressionHelper,
    simpleScreenPluginFactory,
    mathsEvaluatorFactory
) {
    'use strict';

    var mathsEvaluator = mathsEvaluatorFactory();

    QUnit.module('module');

    QUnit.test('simpleScreen', function (assert) {
        var calculator = calculatorBoardFactory();

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
        .test('plugin API ', function (data, assert) {
            var calculator = calculatorBoardFactory();
            var plugin = simpleScreenPluginFactory(calculator);
            assert.expect(1);
            assert.equal(
                typeof plugin[data.title],
                'function',
                `The plugin instances expose a "${data.title}" function`
            );
        });

    QUnit.module('behavior');

    QUnit.test('install', function (assert) {
        var ready = assert.async();
        var $container = $('#fixture-install');
        var calculator = calculatorBoardFactory($container)
            .on('ready', function () {
                var areaBroker = calculator.getAreaBroker();
                var plugin = simpleScreenPluginFactory(calculator, areaBroker);

                assert.expect(1);

                calculator
                    .on('plugin-install.simpleScreen', function () {
                        assert.ok(true, 'The plugin has been installed');
                    })
                    .on('destroy', function () {
                        ready();
                    });

                plugin
                    .install()
                    .catch(function (err) {
                        assert.ok(false, `Unexpected failure : ${err.message}`);
                    })
                    .then(function () {
                        plugin.destroy();
                        calculator.destroy();
                    });
            })
            .on('error', function (err) {
                //eslint-disable-next-line no-console
                console.error(err);
                assert.ok(false, 'The operation should not fail!');
                ready();
            });
    });

    QUnit.test('init', function (assert) {
        var ready = assert.async();
        var $container = $('#fixture-init');
        var calculator = calculatorBoardFactory($container)
            .on('ready', function () {
                var areaBroker = calculator.getAreaBroker();
                var plugin = simpleScreenPluginFactory(calculator, areaBroker);

                assert.expect(1);

                calculator
                    .on('plugin-init.simpleScreen', function () {
                        assert.ok(plugin.getState('init'), 'The plugin has been initialized');
                    })
                    .on('destroy', function () {
                        ready();
                    });

                plugin
                    .install()
                    .then(function () {
                        return plugin.init();
                    })
                    .catch(function (err) {
                        assert.ok(false, `Unexpected failure : ${err.message}`);
                    })
                    .then(function () {
                        plugin.destroy();
                        calculator.destroy();
                    });
            })
            .on('error', function (err) {
                //eslint-disable-next-line no-console
                console.error(err);
                assert.ok(false, 'The operation should not fail!');
                ready();
            });
    });

    QUnit.test('render', function (assert) {
        var ready = assert.async();
        var $container = $('#fixture-render');
        var calculator = calculatorBoardFactory($container)
            .on('ready', function () {
                var areaBroker = calculator.getAreaBroker();
                var plugin = simpleScreenPluginFactory(calculator, areaBroker);

                assert.expect(10);

                calculator
                    .on('plugin-render.simpleScreen', function () {
                        assert.ok(plugin.getState('ready'), 'The plugin has been rendered');
                    })
                    .on('destroy', function () {
                        ready();
                    });

                plugin
                    .install()
                    .then(function () {
                        return plugin.init();
                    })
                    .then(function () {
                        return plugin.render();
                    })
                    .then(function () {
                        var $screen = $container.find('.calculator-screen');
                        assert.equal(
                            areaBroker.getScreenArea().find('.calculator-screen').length,
                            1,
                            'The screen layout has been inserted'
                        );
                        assert.equal(
                            areaBroker.getScreenArea().find('.calculator-screen .history').length,
                            1,
                            'The screen layout contains area for history'
                        );
                        assert.equal(
                            areaBroker.getScreenArea().find('.calculator-screen .expression').length,
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

                        assert.equal(
                            $screen.find('.term:eq(0)').data('value'),
                            '0',
                            'the first operand is transformed - data-value'
                        );
                        assert.equal(
                            $screen.find('.term:eq(0)').data('token'),
                            'NUM0',
                            'the first operand is transformed - data-token'
                        );
                        assert.equal(
                            $screen.find('.term:eq(0)').text().trim(),
                            '0',
                            'the first operand is transformed - content'
                        );
                    })
                    .catch(function (err) {
                        assert.ok(false, `Unexpected failure : ${err.message}`);
                    })
                    .then(function () {
                        plugin.destroy();
                        calculator.destroy();
                    });
            })
            .on('error', function (err) {
                //eslint-disable-next-line no-console
                console.error(err);
                assert.ok(false, 'The operation should not fail!');
                ready();
            });
    });

    QUnit.test('render - failure', function (assert) {
        var ready = assert.async();
        var $container = $('#fixture-render');
        var calculator = calculatorBoardFactory($container)
            .on('ready', function () {
                var areaBroker = calculator.getAreaBroker();
                var plugin = simpleScreenPluginFactory(calculator, areaBroker);
                plugin.setConfig({ layout: 'foo' });

                assert.expect(1);

                calculator
                    .on('plugin-render.templateScreen', function () {
                        assert.ok(false, 'Should not reach that point!');
                    })
                    .on('destroy', function () {
                        ready();
                    });

                plugin
                    .install()
                    .then(function () {
                        return plugin.init();
                    })
                    .then(function () {
                        return plugin.render();
                    })
                    .then(function () {
                        assert.ok(false, 'Should not reach that point!');
                    })
                    .catch(function () {
                        assert.ok(true, 'The operation should fail!');
                    })
                    .then(function () {
                        calculator.destroy();
                    });
            })
            .on('error', function () {
                assert.ok(true, 'The operation should fail!');
                calculator.destroy();
            });
    });

    QUnit.test('destroy', function (assert) {
        var ready = assert.async();
        var $container = $('#fixture-destroy');
        var calculator = calculatorBoardFactory($container)
            .on('ready', function () {
                var areaBroker = calculator.getAreaBroker();
                var plugin = simpleScreenPluginFactory(calculator, areaBroker);

                assert.expect(3);

                calculator
                    .on('plugin-render.simpleScreen', function () {
                        assert.ok(plugin.getState('ready'), 'The plugin has been rendered');
                    })
                    .on('destroy', function () {
                        ready();
                    });

                plugin
                    .install()
                    .then(function () {
                        return plugin.init();
                    })
                    .then(function () {
                        return plugin.render();
                    })
                    .then(function () {
                        assert.equal(
                            areaBroker.getScreenArea().find('.calculator-screen').length,
                            1,
                            'The screen layout has been inserted'
                        );

                        return plugin.destroy();
                    })
                    .then(function () {
                        assert.equal(
                            areaBroker.getScreenArea().find('.calculator-screen').length,
                            0,
                            'The screen layout has been removed'
                        );
                    })
                    .catch(function (err) {
                        assert.ok(false, `Unexpected failure : ${err.message}`);
                    })
                    .then(function () {
                        calculator.destroy();
                    });
            })
            .on('error', function (err) {
                //eslint-disable-next-line no-console
                console.error(err);
                assert.ok(false, 'The operation should not fail!');
                ready();
            });
    });

    QUnit.test('transform expression', function (assert) {
        var ready = assert.async();
        var $container = $('#fixture-transform');
        var calculator = calculatorBoardFactory($container)
            .on('ready', function () {
                var areaBroker = calculator.getAreaBroker();
                var plugin = simpleScreenPluginFactory(calculator, areaBroker);

                assert.expect(51);

                calculator
                    .on('plugin-render.simpleScreen', function () {
                        assert.ok(plugin.getState('ready'), 'The plugin has been rendered');
                    })
                    .on('destroy', function () {
                        ready();
                    });

                plugin
                    .install()
                    .then(function () {
                        return plugin.init();
                    })
                    .then(function () {
                        return plugin.render();
                    })
                    .then(function () {
                        assert.equal(
                            areaBroker.getScreenArea().find('.calculator-screen').length,
                            1,
                            'The screen layout has been inserted'
                        );

                        assert.equal(calculator.getExpression(), '0', 'The expression should be set to 0');
                        assert.equal(calculator.getPosition(), 1, 'The position should be set to 1');
                    })
                    .then(function () {
                        var $screen = $container.find('.calculator-screen');
                        return new Promise(function (resolve) {
                            calculator
                                .after('expressionchange.test', function () {
                                    calculator.off('expressionchange.test');
                                    assert.equal(
                                        $screen.find('.term').length,
                                        3,
                                        'The expected number of terms has been transformed'
                                    );

                                    assert.equal(
                                        $screen.find('.expression .term:eq(0)').data('value'),
                                        '3',
                                        'the first operand is transformed - data-value'
                                    );
                                    assert.equal(
                                        $screen.find('.expression .term:eq(0)').data('token'),
                                        'NUM3',
                                        'the first operand is transformed - data-token'
                                    );
                                    assert.equal(
                                        $screen.find('.expression .term:eq(0)').data('type'),
                                        'digit',
                                        'the first operand is transformed - data-type'
                                    );
                                    assert.equal(
                                        $screen.find('.expression .term:eq(0)').text().trim(),
                                        '3',
                                        'the first operand is transformed - content'
                                    );

                                    assert.equal(
                                        $screen.find('.expression .term:eq(1)').data('value'),
                                        '+',
                                        'the operator is transformed - data-value'
                                    );
                                    assert.equal(
                                        $screen.find('.expression .term:eq(1)').data('token'),
                                        'ADD',
                                        'the operator is transformed - data-token'
                                    );
                                    assert.equal(
                                        $screen.find('.expression .term:eq(1)').data('type'),
                                        'operator',
                                        'the operator is transformed - data-type'
                                    );
                                    assert.equal(
                                        $screen.find('.expression .term:eq(1)').text().trim(),
                                        '+',
                                        'the operator is transformed - content'
                                    );

                                    assert.equal(
                                        $screen.find('.expression .term:eq(2)').data('value'),
                                        '2',
                                        'the second operand is transformed - data-value'
                                    );
                                    assert.equal(
                                        $screen.find('.expression .term:eq(2)').data('token'),
                                        'NUM2',
                                        'the second operand is transformed - data-token'
                                    );
                                    assert.equal(
                                        $screen.find('.expression .term:eq(2)').data('type'),
                                        'digit',
                                        'the first operand is transformed - data-type'
                                    );
                                    assert.equal(
                                        $screen.find('.expression .term:eq(2)').html().trim(),
                                        '2',
                                        'the second operand is transformed - content'
                                    );

                                    resolve();
                                })
                                .replace('3+2');
                        });
                    })
                    .then(function () {
                        var $screen = $container.find('.calculator-screen');
                        return new Promise(function (resolve) {
                            calculator
                                .after('expressionchange.test', function () {
                                    calculator.off('expressionchange.test');
                                    assert.equal(
                                        $screen.find('.term').length,
                                        3,
                                        'The expected number of terms has been transformed'
                                    );

                                    assert.equal(
                                        $screen.find('.expression .term:eq(0)').data('value'),
                                        '3',
                                        'the first operand is transformed - data-value'
                                    );
                                    assert.equal(
                                        $screen.find('.expression .term:eq(0)').data('token'),
                                        'NUM3',
                                        'the first operand is transformed - data-token'
                                    );
                                    assert.equal(
                                        $screen.find('.expression .term:eq(0)').data('type'),
                                        'digit',
                                        'the first operand is transformed - data-type'
                                    );
                                    assert.equal(
                                        $screen.find('.expression .term:eq(0)').text().trim(),
                                        '3',
                                        'the first operand is transformed - content'
                                    );

                                    assert.equal(
                                        $screen.find('.expression .term:eq(1)').data('value'),
                                        '+',
                                        'the operator is transformed - data-value'
                                    );
                                    assert.equal(
                                        $screen.find('.expression .term:eq(1)').data('token'),
                                        'ADD',
                                        'the operator is transformed - data-token'
                                    );
                                    assert.equal(
                                        $screen.find('.expression .term:eq(1)').data('type'),
                                        'operator',
                                        'the operator is transformed - data-type'
                                    );
                                    assert.equal(
                                        $screen.find('.expression .term:eq(1)').text().trim(),
                                        '+',
                                        'the operator is transformed - content'
                                    );

                                    assert.equal(
                                        $screen.find('.expression .term:eq(2)').data('value'),
                                        'x',
                                        'the second operand is transformed - data-value'
                                    );
                                    assert.equal(
                                        $screen.find('.expression .term:eq(2)').data('token'),
                                        'term',
                                        'the second operand is transformed - data-token'
                                    );
                                    assert.equal(
                                        $screen.find('.expression .term:eq(2)').data('type'),
                                        'unknown',
                                        'the second operand is transformed - data-type'
                                    );
                                    assert.equal(
                                        $screen.find('.expression .term:eq(2)').html().trim(),
                                        'x',
                                        'the second operand is transformed - content'
                                    );

                                    resolve();
                                })
                                .replace('3+x');
                        });
                    })
                    .then(function () {
                        var $screen = $container.find('.calculator-screen');
                        return new Promise(function (resolve) {
                            calculator
                                .after('expressionchange.test', function () {
                                    calculator.off('expressionchange.test');
                                    assert.equal(
                                        $screen.find('.term').length,
                                        5,
                                        'The expected number of terms has been transformed'
                                    );

                                    assert.equal(
                                        $screen.find('.expression .term:eq(0)').data('value'),
                                        'sqrt',
                                        'the term SQRT is transformed - data-value'
                                    );
                                    assert.equal(
                                        $screen.find('.expression .term:eq(0)').data('token'),
                                        'SQRT',
                                        'the term SQRT is transformed - data-token'
                                    );
                                    assert.equal(
                                        $screen.find('.expression .term:eq(0)').data('type'),
                                        'function',
                                        'the first operand is transformed - data-type'
                                    );
                                    assert.equal(
                                        $screen.find('.expression .term:eq(0)').text().trim(),
                                        '\u221A',
                                        'the term SQRT is transformed - content'
                                    );

                                    assert.equal(
                                        $screen.find('.expression .term:eq(1)').data('value'),
                                        '3',
                                        'the term NUM3 is transformed - data-value'
                                    );
                                    assert.equal(
                                        $screen.find('.expression .term:eq(1)').data('token'),
                                        'NUM3',
                                        'the term NUM3 is transformed - data-token'
                                    );
                                    assert.equal(
                                        $screen.find('.expression .term:eq(1)').data('type'),
                                        'digit',
                                        'the first operand is transformed - data-type'
                                    );
                                    assert.equal(
                                        $screen.find('.expression .term:eq(1)').text().trim(),
                                        '3',
                                        'the term NUM3 is transformed - content'
                                    );

                                    assert.equal(
                                        $screen.find('.expression .term:eq(2)').data('value'),
                                        '+',
                                        'the term ADD is transformed - data-value'
                                    );
                                    assert.equal(
                                        $screen.find('.expression .term:eq(2)').data('token'),
                                        'ADD',
                                        'the term ADD is transformed - data-token'
                                    );
                                    assert.equal(
                                        $screen.find('.expression .term:eq(2)').data('type'),
                                        'operator',
                                        'the first operand is transformed - data-type'
                                    );
                                    assert.equal(
                                        $screen.find('.expression .term:eq(2)').text().trim(),
                                        '+',
                                        'the term ADD is transformed - content'
                                    );

                                    assert.equal(
                                        $screen.find('.expression .term:eq(3)').data('value'),
                                        'sin',
                                        'the term SIN is transformed - data-value'
                                    );
                                    assert.equal(
                                        $screen.find('.expression .term:eq(3)').data('token'),
                                        'SIN',
                                        'the term SIN is transformed - data-token'
                                    );
                                    assert.equal(
                                        $screen.find('.expression .term:eq(3)').data('type'),
                                        'function',
                                        'the first operand is transformed - data-type'
                                    );
                                    assert.equal(
                                        $screen.find('.expression .term:eq(3)').text().trim(),
                                        'sin',
                                        'the term SIN is transformed - content'
                                    );

                                    assert.equal(
                                        $screen.find('.expression .term:eq(4)').data('value'),
                                        'PI',
                                        'the term PI is transformed - data-value'
                                    );
                                    assert.equal(
                                        $screen.find('.expression .term:eq(4)').data('token'),
                                        'PI',
                                        'the term PI is transformed - data-token'
                                    );
                                    assert.equal(
                                        $screen.find('.expression .term:eq(4)').data('type'),
                                        'constant',
                                        'the first operand is transformed - data-type'
                                    );
                                    assert.equal(
                                        $screen.find('.expression .term:eq(4)').html().trim(),
                                        '\u03C0',
                                        'the term PI is transformed - content'
                                    );

                                    resolve();
                                })
                                .replace('sqrt 3+sin PI');
                        });
                    })
                    .catch(function (err) {
                        assert.ok(false, `Unexpected failure : ${err.message}`);
                    })
                    .then(function () {
                        plugin.destroy();
                        calculator.destroy();
                    });
            })
            .on('error', function (err) {
                //eslint-disable-next-line no-console
                console.error(err);
                assert.ok(false, 'The operation should not fail!');
                ready();
            });
    });

    QUnit.test('transform all', function (assert) {
        var ready = assert.async();
        var $container = $('#fixture-transform-all');
        var expectedTokens = [];
        var expression = '';
        var calculator = calculatorBoardFactory($container)
            .on('ready', function () {
                var areaBroker = calculator.getAreaBroker();
                var plugin = simpleScreenPluginFactory(calculator, areaBroker);

                calculator
                    .on('plugin-render.simpleScreen', function () {
                        assert.ok(plugin.getState('ready'), 'The plugin has been rendered');
                    })
                    .on('destroy', function () {
                        ready();
                    });

                plugin
                    .install()
                    .then(function () {
                        return plugin.init();
                    })
                    .then(function () {
                        return plugin.render();
                    })
                    .then(function () {
                        assert.equal(
                            areaBroker.getScreenArea().find('.calculator-screen').length,
                            1,
                            'The screen layout has been inserted'
                        );

                        assert.equal(calculator.getExpression(), '0', 'The expression should be set to 0');
                        assert.equal(calculator.getPosition(), 1, 'The position should be set to 1');
                    })
                    .then(function () {
                        var $screen = $container.find('.calculator-screen');
                        return new Promise(function (resolve) {
                            calculator
                                .after('expressionchange.test', function () {
                                    calculator.off('expressionchange.test');
                                    assert.equal(
                                        $screen.find('.term').length,
                                        expectedTokens.length + 1,
                                        'The expected number of terms has been transformed'
                                    );

                                    _.forEach(expectedTokens, function (term, index) {
                                        var el = $screen.find(`.expression .term[data-token="${term.token}"]`).get(0);
                                        if (term.token === 'ANS') {
                                            term.label = expressionHelper.render(calculator.getLastResult());
                                        }
                                        assert.equal(
                                            el.dataset.value,
                                            term.value,
                                            `the term ${index} is transformed - data-value`
                                        );
                                        assert.equal(
                                            el.dataset.token,
                                            term.token,
                                            `the term ${index} is transformed - data-token`
                                        );
                                        assert.equal(
                                            el.dataset.type,
                                            term.type,
                                            `the term ${index} is transformed - data-type`
                                        );
                                        assert.equal(
                                            el.innerHTML.trim(),
                                            term.label,
                                            `the term ${index} is transformed - content`
                                        );
                                    });

                                    resolve();
                                })
                                .replace(expression);
                        });
                    })
                    .catch(function (err) {
                        assert.ok(false, `Unexpected failure : ${err.message}`);
                    })
                    .then(function () {
                        plugin.destroy();
                        calculator.destroy();
                    });
            })
            .on('error', function (err) {
                //eslint-disable-next-line no-console
                console.error(err);
                assert.ok(false, 'The operation should not fail!');
                ready();
            });

        _.forEach(registeredTerms, function (term, token) {
            if (token === 'ADD') {
                // append a digit just before the ADD operator
                // otherwise the operator will be displayed as positive sign change and the test will fail
                expectedTokens.push({
                    value: registeredTerms.NUM1.value,
                    label: registeredTerms.NUM1.label,
                    type: registeredTerms.NUM1.type,
                    token: 'NUM1'
                });
                expression += `${registeredTerms.NUM1.value} `;
            }
            expression += `${term.value} `;
            expectedTokens.push({
                value: term.value,
                label: term.label,
                type: term.type,
                token: token
            });
        });

        assert.expect(expectedTokens.length * 4 + 5);
    });

    QUnit.test('evaluate expression', function (assert) {
        var ready = assert.async();
        var $container = $('#fixture-evaluate');
        var calculator = calculatorBoardFactory($container)
            .on('ready', function () {
                var areaBroker = calculator.getAreaBroker();
                var plugin = simpleScreenPluginFactory(calculator, areaBroker);

                assert.expect(135);

                calculator
                    .on('plugin-render.simpleScreen', function () {
                        assert.ok(plugin.getState('ready'), 'The plugin has been rendered');
                    })
                    .on('destroy', function () {
                        ready();
                    });

                plugin
                    .install()
                    .then(function () {
                        return plugin.init();
                    })
                    .then(function () {
                        return plugin.render();
                    })
                    .then(function () {
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
                    .then(function () {
                        var $screen = $container.find('.calculator-screen');
                        return new Promise(function (resolve) {
                            calculator
                                .after('expressionchange.test', function () {
                                    calculator.off('expressionchange.test');
                                    assert.equal(
                                        $screen.find('.expression .term').length,
                                        3,
                                        'The expected number of terms has been transformed'
                                    );

                                    assert.equal(
                                        $screen.find('.expression .term:eq(0)').data('value'),
                                        '3',
                                        'the first operand is transformed - data-value'
                                    );
                                    assert.equal(
                                        $screen.find('.expression .term:eq(0)').data('token'),
                                        'NUM3',
                                        'the first operand is transformed - data-token'
                                    );
                                    assert.equal(
                                        $screen.find('.expression .term:eq(0)').data('type'),
                                        'digit',
                                        'the first operand is transformed - data-type'
                                    );
                                    assert.equal(
                                        $screen.find('.expression .term:eq(0)').text().trim(),
                                        '3',
                                        'the first operand is transformed - content'
                                    );

                                    assert.equal(
                                        $screen.find('.expression .term:eq(1)').data('value'),
                                        '+',
                                        'the operator is transformed - data-value'
                                    );
                                    assert.equal(
                                        $screen.find('.expression .term:eq(1)').data('token'),
                                        'ADD',
                                        'the operator is transformed - data-token'
                                    );
                                    assert.equal(
                                        $screen.find('.expression .term:eq(1)').data('type'),
                                        'operator',
                                        'the operator is transformed - data-type'
                                    );
                                    assert.equal(
                                        $screen.find('.expression .term:eq(1)').text().trim(),
                                        '+',
                                        'the operator is transformed - content'
                                    );

                                    assert.equal(
                                        $screen.find('.expression .term:eq(2)').data('value'),
                                        '2',
                                        'the second operand is transformed - data-value'
                                    );
                                    assert.equal(
                                        $screen.find('.expression .term:eq(2)').data('token'),
                                        'NUM2',
                                        'the second operand is transformed - data-token'
                                    );
                                    assert.equal(
                                        $screen.find('.expression .term:eq(2)').data('type'),
                                        'digit',
                                        'the first operand is transformed - data-type'
                                    );
                                    assert.equal(
                                        $screen.find('.expression .term:eq(2)').html().trim(),
                                        '2',
                                        'the second operand is transformed - content'
                                    );

                                    assert.equal(calculator.is('error'), false, 'There is no error');

                                    resolve();
                                })
                                .replace('3+2');
                        });
                    })
                    .then(function () {
                        var $screen = $container.find('.calculator-screen');
                        return new Promise(function (resolve) {
                            calculator
                                .after('evaluate.test', function () {
                                    calculator.off('evaluate.test');

                                    assert.equal(
                                        calculator.getExpression(),
                                        'ans',
                                        'The expression should be set with the last result variable'
                                    );
                                    assert.equal(calculator.getPosition(), 3, 'The position should be set to 3');
                                    assert.equal(calculator.is('error'), false, 'There is no error');

                                    assert.equal(calculator.getVariable('ans').value, '5', 'The last result is 5');

                                    assert.equal(
                                        $screen.find('.expression .term').length,
                                        2,
                                        'The expected number of terms has been transformed in the expression'
                                    );

                                    assert.equal(
                                        $screen.find('.expression .term:eq(0)').data('value'),
                                        'ans',
                                        'the expression is transformed - data-value'
                                    );
                                    assert.equal(
                                        $screen.find('.expression .term:eq(0)').data('token'),
                                        'ANS',
                                        'the expression is transformed - data-token'
                                    );
                                    assert.equal(
                                        $screen.find('.expression .term:eq(0)').data('type'),
                                        'variable',
                                        'the expression is transformed - data-type'
                                    );
                                    assert.equal(
                                        $screen.find('.expression .term:eq(0)').text().trim(),
                                        '5',
                                        'the expression is transformed - content'
                                    );

                                    assert.equal(
                                        $screen.find('.expression .term:eq(1)').data('value'),
                                        '5',
                                        'the expression is transformed - data-value'
                                    );
                                    assert.equal(
                                        $screen.find('.expression .term:eq(1)').data('token'),
                                        'NUM5',
                                        'the expression is transformed - data-token'
                                    );
                                    assert.equal(
                                        $screen.find('.expression .term:eq(1)').data('type'),
                                        'digit',
                                        'the expression is transformed - data-type'
                                    );
                                    assert.equal(
                                        $screen.find('.expression .term:eq(1)').text().trim(),
                                        '5',
                                        'the expression is transformed - content'
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
                                    assert.equal(
                                        $screen.find('.history .history-expression .term').length,
                                        3,
                                        'The expected number of terms has been transformed in the history expression'
                                    );
                                    assert.equal(
                                        $screen.find('.history .history-result .term').length,
                                        1,
                                        'The expected number of terms has been transformed in the history result'
                                    );

                                    assert.equal(
                                        $screen.find('.history .history-expression .term:eq(0)').data('value'),
                                        '3',
                                        'the first operand is transformed - data-value'
                                    );
                                    assert.equal(
                                        $screen.find('.history .history-expression .term:eq(0)').data('token'),
                                        'NUM3',
                                        'the first operand is transformed - data-token'
                                    );
                                    assert.equal(
                                        $screen.find('.history .history-expression .term:eq(0)').data('type'),
                                        'digit',
                                        'the first operand is transformed - data-type'
                                    );
                                    assert.equal(
                                        $screen.find('.history .history-expression .term:eq(0)').text().trim(),
                                        '3',
                                        'the first operand is transformed - content'
                                    );

                                    assert.equal(
                                        $screen.find('.history .history-expression .term:eq(1)').data('value'),
                                        '+',
                                        'the operator is transformed - data-value'
                                    );
                                    assert.equal(
                                        $screen.find('.history .history-expression .term:eq(1)').data('token'),
                                        'ADD',
                                        'the operator is transformed - data-token'
                                    );
                                    assert.equal(
                                        $screen.find('.history .history-expression .term:eq(1)').data('type'),
                                        'operator',
                                        'the operator is transformed - data-type'
                                    );
                                    assert.equal(
                                        $screen.find('.history .history-expression .term:eq(1)').text().trim(),
                                        '+',
                                        'the operator is transformed - content'
                                    );

                                    assert.equal(
                                        $screen.find('.history .history-expression .term:eq(2)').data('value'),
                                        '2',
                                        'the second operand is transformed - data-value'
                                    );
                                    assert.equal(
                                        $screen.find('.history .history-expression .term:eq(2)').data('token'),
                                        'NUM2',
                                        'the second operand is transformed - data-token'
                                    );
                                    assert.equal(
                                        $screen.find('.history .history-expression .term:eq(2)').data('type'),
                                        'digit',
                                        'the first operand is transformed - data-type'
                                    );
                                    assert.equal(
                                        $screen.find('.history .history-expression .term:eq(2)').html().trim(),
                                        '2',
                                        'the second operand is transformed - content'
                                    );

                                    assert.equal(
                                        $screen.find('.history .history-result .term:eq(0)').data('value'),
                                        '5',
                                        'the result term is transformed - data-value'
                                    );
                                    assert.equal(
                                        $screen.find('.history .history-result .term:eq(0)').data('token'),
                                        'NUM5',
                                        'the result term is transformed - data-token'
                                    );
                                    assert.equal(
                                        $screen.find('.history .history-result .term:eq(0)').data('type'),
                                        'digit',
                                        'the result term is transformed - data-type'
                                    );
                                    assert.equal(
                                        $screen.find('.history .history-result .term:eq(0)').html().trim(),
                                        '5',
                                        'the result term is transformed - content'
                                    );

                                    resolve();
                                })
                                .evaluate();
                        });
                    })
                    .then(function () {
                        var $screen = $container.find('.calculator-screen');
                        return new Promise(function (resolve) {
                            calculator
                                .after('termadd.test', function () {
                                    calculator.off('termadd.test');

                                    assert.equal(calculator.getExpression(), 'ans+', 'The expression should be ans+');
                                    assert.equal(calculator.getPosition(), 4, 'The position should be set to 4');

                                    assert.equal(
                                        $screen.find('.expression .term').length,
                                        3,
                                        'The expected number of terms has been transformed in the expression'
                                    );

                                    assert.equal(
                                        $screen.find('.expression .term:eq(0)').data('value'),
                                        'ans',
                                        'the variable is transformed - data-value'
                                    );
                                    assert.equal(
                                        $screen.find('.expression .term:eq(0)').data('token'),
                                        'ANS',
                                        'the variable is transformed - data-token'
                                    );
                                    assert.equal(
                                        $screen.find('.expression .term:eq(0)').data('type'),
                                        'variable',
                                        'the variable is transformed - data-type'
                                    );
                                    assert.equal(
                                        $screen.find('.expression .term:eq(0)').text().trim(),
                                        '5',
                                        'the variable is transformed - content'
                                    );

                                    assert.equal(
                                        $screen.find('.expression .term:eq(1)').data('value'),
                                        '5',
                                        'the variable is transformed - data-value'
                                    );
                                    assert.equal(
                                        $screen.find('.expression .term:eq(1)').data('token'),
                                        'NUM5',
                                        'the variable is transformed - data-token'
                                    );
                                    assert.equal(
                                        $screen.find('.expression .term:eq(1)').data('type'),
                                        'digit',
                                        'the variable is transformed - data-type'
                                    );
                                    assert.equal(
                                        $screen.find('.expression .term:eq(1)').text().trim(),
                                        '5',
                                        'the variable is transformed - content'
                                    );

                                    assert.equal(
                                        $screen.find('.expression .term:eq(2)').data('value'),
                                        '+',
                                        'the operator is transformed - data-value'
                                    );
                                    assert.equal(
                                        $screen.find('.expression .term:eq(2)').data('token'),
                                        'ADD',
                                        'the operator is transformed - data-token'
                                    );
                                    assert.equal(
                                        $screen.find('.expression .term:eq(2)').data('type'),
                                        'operator',
                                        'the operator is transformed - data-type'
                                    );
                                    assert.equal(
                                        $screen.find('.expression .term:eq(2)').text().trim(),
                                        '+',
                                        'the operator is transformed - content'
                                    );

                                    resolve();
                                })
                                .useTerm('ADD');
                        });
                    })
                    .then(function () {
                        var $screen = $container.find('.calculator-screen');
                        return new Promise(function (resolve) {
                            calculator
                                .after('termadd.test', function () {
                                    calculator.off('termadd.test');

                                    assert.equal(calculator.getExpression(), 'ans+3', 'The expression should be ans+');
                                    assert.equal(calculator.getPosition(), 5, 'The position should be set to 5');

                                    assert.equal(
                                        $screen.find('.expression .term').length,
                                        4,
                                        'The expected number of terms has been transformed in the expression'
                                    );

                                    assert.equal(
                                        $screen.find('.expression .term:eq(0)').data('value'),
                                        'ans',
                                        'the variable is transformed - data-value'
                                    );
                                    assert.equal(
                                        $screen.find('.expression .term:eq(0)').data('token'),
                                        'ANS',
                                        'the variable is transformed - data-token'
                                    );
                                    assert.equal(
                                        $screen.find('.expression .term:eq(0)').data('type'),
                                        'variable',
                                        'the variable is transformed - data-type'
                                    );
                                    assert.equal(
                                        $screen.find('.expression .term:eq(0)').text().trim(),
                                        '5',
                                        'the variable is transformed - content'
                                    );

                                    assert.equal(
                                        $screen.find('.expression .term:eq(1)').data('value'),
                                        '5',
                                        'the variable is transformed - data-value'
                                    );
                                    assert.equal(
                                        $screen.find('.expression .term:eq(1)').data('token'),
                                        'NUM5',
                                        'the variable is transformed - data-token'
                                    );
                                    assert.equal(
                                        $screen.find('.expression .term:eq(1)').data('type'),
                                        'digit',
                                        'the variable is transformed - data-type'
                                    );
                                    assert.equal(
                                        $screen.find('.expression .term:eq(1)').text().trim(),
                                        '5',
                                        'the variable is transformed - content'
                                    );

                                    assert.equal(
                                        $screen.find('.expression .term:eq(2)').data('value'),
                                        '+',
                                        'the operator is transformed - data-value'
                                    );
                                    assert.equal(
                                        $screen.find('.expression .term:eq(2)').data('token'),
                                        'ADD',
                                        'the operator is transformed - data-token'
                                    );
                                    assert.equal(
                                        $screen.find('.expression .term:eq(2)').data('type'),
                                        'operator',
                                        'the operator is transformed - data-type'
                                    );
                                    assert.equal(
                                        $screen.find('.expression .term:eq(2)').text().trim(),
                                        '+',
                                        'the operator is transformed - content'
                                    );

                                    assert.equal(
                                        $screen.find('.expression .term:eq(3)').data('value'),
                                        '3',
                                        'the second operand is transformed - data-value'
                                    );
                                    assert.equal(
                                        $screen.find('.expression .term:eq(3)').data('token'),
                                        'NUM3',
                                        'the second operand is transformed - data-token'
                                    );
                                    assert.equal(
                                        $screen.find('.expression .term:eq(3)').data('type'),
                                        'digit',
                                        'the first operand is transformed - data-type'
                                    );
                                    assert.equal(
                                        $screen.find('.expression .term:eq(3)').html().trim(),
                                        '3',
                                        'the second operand is transformed - content'
                                    );

                                    resolve();
                                })
                                .useTerm('NUM3');
                        });
                    })
                    .then(function () {
                        var $screen = $container.find('.calculator-screen');
                        return new Promise(function (resolve) {
                            calculator
                                .after('evaluate.test', function () {
                                    calculator.off('evaluate.test');

                                    assert.equal(
                                        calculator.getExpression(),
                                        'ans',
                                        'The expression should be set with the last result variable'
                                    );
                                    assert.equal(calculator.getPosition(), 3, 'The position should be set to 3');
                                    assert.equal(calculator.is('error'), false, 'There is no error');

                                    assert.equal(calculator.getVariable('ans').value, '8', 'The last result is 8');

                                    assert.equal(
                                        $screen.find('.expression .term').length,
                                        2,
                                        'The expected number of terms has been transformed in the expression'
                                    );

                                    assert.equal(
                                        $screen.find('.expression .term:eq(0)').data('value'),
                                        'ans',
                                        'the expression is transformed - data-value'
                                    );
                                    assert.equal(
                                        $screen.find('.expression .term:eq(0)').data('token'),
                                        'ANS',
                                        'the expression is transformed - data-token'
                                    );
                                    assert.equal(
                                        $screen.find('.expression .term:eq(0)').data('type'),
                                        'variable',
                                        'the expression is transformed - data-type'
                                    );
                                    assert.equal(
                                        $screen.find('.expression .term:eq(0)').text().trim(),
                                        '8',
                                        'the expression is transformed - content'
                                    );

                                    assert.equal(
                                        $screen.find('.expression .term:eq(1)').data('value'),
                                        '8',
                                        'the expression is transformed - data-value'
                                    );
                                    assert.equal(
                                        $screen.find('.expression .term:eq(1)').data('token'),
                                        'NUM8',
                                        'the expression is transformed - data-token'
                                    );
                                    assert.equal(
                                        $screen.find('.expression .term:eq(1)').data('type'),
                                        'digit',
                                        'the expression is transformed - data-type'
                                    );
                                    assert.equal(
                                        $screen.find('.expression .term:eq(1)').text().trim(),
                                        '8',
                                        'the expression is transformed - content'
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
                                    assert.equal(
                                        $screen.find('.history .history-expression .term').length,
                                        4,
                                        'The expected number of terms has been transformed in the history expression'
                                    );
                                    assert.equal(
                                        $screen.find('.history .history-result .term').length,
                                        1,
                                        'The expected number of terms has been transformed in the history result'
                                    );

                                    assert.equal(
                                        $screen.find('.history .history-expression .term:eq(0)').data('value'),
                                        'ans',
                                        'the first operand is transformed - data-value'
                                    );
                                    assert.equal(
                                        $screen.find('.history .history-expression .term:eq(0)').data('token'),
                                        'ANS',
                                        'the first operand is transformed - data-token'
                                    );
                                    assert.equal(
                                        $screen.find('.history .history-expression .term:eq(0)').data('type'),
                                        'variable',
                                        'the first operand is transformed - data-type'
                                    );
                                    assert.equal(
                                        $screen.find('.history .history-expression .term:eq(0)').text().trim(),
                                        '5',
                                        'the first operand is transformed - content'
                                    );

                                    assert.equal(
                                        $screen.find('.history .history-expression .term:eq(1)').data('value'),
                                        '5',
                                        'the first operand is transformed - data-value'
                                    );
                                    assert.equal(
                                        $screen.find('.history .history-expression .term:eq(1)').data('token'),
                                        'NUM5',
                                        'the first operand is transformed - data-token'
                                    );
                                    assert.equal(
                                        $screen.find('.history .history-expression .term:eq(1)').data('type'),
                                        'digit',
                                        'the first operand is transformed - data-type'
                                    );
                                    assert.equal(
                                        $screen.find('.history .history-expression .term:eq(1)').text().trim(),
                                        '5',
                                        'the first operand is transformed - content'
                                    );

                                    assert.equal(
                                        $screen.find('.history .history-expression .term:eq(2)').data('value'),
                                        '+',
                                        'the operator is transformed - data-value'
                                    );
                                    assert.equal(
                                        $screen.find('.history .history-expression .term:eq(2)').data('token'),
                                        'ADD',
                                        'the operator is transformed - data-token'
                                    );
                                    assert.equal(
                                        $screen.find('.history .history-expression .term:eq(2)').data('type'),
                                        'operator',
                                        'the operator is transformed - data-type'
                                    );
                                    assert.equal(
                                        $screen.find('.history .history-expression .term:eq(2)').text().trim(),
                                        '+',
                                        'the operator is transformed - content'
                                    );

                                    assert.equal(
                                        $screen.find('.history .history-expression .term:eq(3)').data('value'),
                                        '3',
                                        'the second operand is transformed - data-value'
                                    );
                                    assert.equal(
                                        $screen.find('.history .history-expression .term:eq(3)').data('token'),
                                        'NUM3',
                                        'the second operand is transformed - data-token'
                                    );
                                    assert.equal(
                                        $screen.find('.history .history-expression .term:eq(3)').data('type'),
                                        'digit',
                                        'the first operand is transformed - data-type'
                                    );
                                    assert.equal(
                                        $screen.find('.history .history-expression .term:eq(3)').html().trim(),
                                        '3',
                                        'the second operand is transformed - content'
                                    );

                                    assert.equal(
                                        $screen.find('.history .history-result .term:eq(0)').data('value'),
                                        '8',
                                        'the result term is transformed - data-value'
                                    );
                                    assert.equal(
                                        $screen.find('.history .history-result .term:eq(0)').data('token'),
                                        'NUM8',
                                        'the result term is transformed - data-token'
                                    );
                                    assert.equal(
                                        $screen.find('.history .history-result .term:eq(0)').data('type'),
                                        'digit',
                                        'the result term is transformed - data-type'
                                    );
                                    assert.equal(
                                        $screen.find('.history .history-result .term:eq(0)').html().trim(),
                                        '8',
                                        'the result term is transformed - content'
                                    );

                                    resolve();
                                })
                                .evaluate();
                        });
                    })
                    .then(function () {
                        var $screen = $container.find('.calculator-screen');
                        return new Promise(function (resolve) {
                            calculator
                                .after('command-clearAll.test', function () {
                                    calculator.off('command-clearAll.test');

                                    assert.equal(
                                        calculator.getExpression(),
                                        '0',
                                        'The expression should be reset to 0'
                                    );
                                    assert.equal(calculator.getPosition(), 1, 'The position should be reset to 1');
                                    assert.equal(calculator.getVariable('ans').value, '0', 'The last result is 0');

                                    assert.equal(
                                        $screen.find('.expression .term').length,
                                        1,
                                        'The expected number of terms has been transformed in the expression'
                                    );

                                    assert.equal(
                                        $screen.find('.expression .term:eq(0)').data('value'),
                                        '0',
                                        'the expression is transformed - data-value'
                                    );
                                    assert.equal(
                                        $screen.find('.expression .term:eq(0)').data('token'),
                                        'NUM0',
                                        'the expression is transformed - data-token'
                                    );
                                    assert.equal(
                                        $screen.find('.expression .term:eq(0)').data('type'),
                                        'digit',
                                        'the expression is transformed - data-type'
                                    );
                                    assert.equal(
                                        $screen.find('.expression .term:eq(0)').text().trim(),
                                        '0',
                                        'the expression is transformed - content'
                                    );

                                    assert.equal($screen.find('.history .term').length, 0, 'The history is cleared');

                                    resolve();
                                })
                                .useCommand('clearAll');
                        });
                    })
                    .catch(function (err) {
                        assert.ok(false, `Unexpected failure : ${err.message}`);
                    })
                    .then(function () {
                        plugin.destroy();
                        calculator.destroy();
                    });
            })
            .on('error', function (err) {
                //eslint-disable-next-line no-console
                console.error(err);
                assert.ok(false, 'The operation should not fail!');
                ready();
            });
    });

    QUnit.test('evaluate NaN', function (assert) {
        var ready = assert.async();
        var $container = $('#fixture-error-nan');
        var calculator = calculatorBoardFactory($container)
            .on('ready', function () {
                var areaBroker = calculator.getAreaBroker();
                var plugin = simpleScreenPluginFactory(calculator, areaBroker);

                assert.expect(74);

                calculator
                    .on('plugin-render.simpleScreen', function () {
                        assert.ok(plugin.getState('ready'), 'The plugin has been rendered');
                    })
                    .on('destroy', function () {
                        ready();
                    });

                plugin
                    .install()
                    .then(function () {
                        return plugin.init();
                    })
                    .then(function () {
                        return plugin.render();
                    })
                    .then(function () {
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
                    .then(function () {
                        var $screen = $container.find('.calculator-screen');
                        return new Promise(function (resolve) {
                            calculator
                                .after('expressionchange.test', function () {
                                    calculator.off('expressionchange.test');
                                    assert.equal(
                                        $screen.find('.expression .term').length,
                                        3,
                                        'The expected number of terms has been transformed'
                                    );

                                    assert.equal(
                                        $screen.find('.expression .term:eq(0)').data('value'),
                                        'sqrt',
                                        'the first operand is transformed - data-value'
                                    );
                                    assert.equal(
                                        $screen.find('.expression .term:eq(0)').data('token'),
                                        'SQRT',
                                        'the first operand is transformed - data-token'
                                    );
                                    assert.equal(
                                        $screen.find('.expression .term:eq(0)').data('type'),
                                        'function',
                                        'the first operand is transformed - data-type'
                                    );
                                    assert.equal(
                                        $screen.find('.expression .term:eq(0)').text().trim(),
                                        registeredTerms.SQRT.label,
                                        'the first operand is transformed - content'
                                    );

                                    assert.equal(
                                        $screen.find('.expression .term:eq(1)').data('value'),
                                        '-',
                                        'the operator is transformed - data-value'
                                    );
                                    assert.equal(
                                        $screen.find('.expression .term:eq(1)').data('token'),
                                        'NEG',
                                        'the operator is transformed - data-token'
                                    );
                                    assert.equal(
                                        $screen.find('.expression .term:eq(1)').data('type'),
                                        'operator',
                                        'the operator is transformed - data-type'
                                    );
                                    assert.equal(
                                        $screen.find('.expression .term:eq(1)').text().trim(),
                                        registeredTerms.NEG.label,
                                        'the operator is transformed - content'
                                    );

                                    assert.equal(
                                        $screen.find('.expression .term:eq(2)').data('value'),
                                        '2',
                                        'the second operand is transformed - data-value'
                                    );
                                    assert.equal(
                                        $screen.find('.expression .term:eq(2)').data('token'),
                                        'NUM2',
                                        'the second operand is transformed - data-token'
                                    );
                                    assert.equal(
                                        $screen.find('.expression .term:eq(2)').data('type'),
                                        'digit',
                                        'the first operand is transformed - data-type'
                                    );
                                    assert.equal(
                                        $screen.find('.expression .term:eq(2)').html().trim(),
                                        '2',
                                        'the second operand is transformed - content'
                                    );

                                    assert.equal(calculator.is('error'), false, 'There is no error');

                                    resolve();
                                })
                                .replace('sqrt -2');
                        });
                    })
                    .then(function () {
                        var $screen = $container.find('.calculator-screen');
                        return new Promise(function (resolve) {
                            calculator
                                .after('evaluate.test', function () {
                                    calculator.off('evaluate.test');

                                    assert.equal(
                                        calculator.getExpression(),
                                        'ans',
                                        'The expression should be set with the last result variable'
                                    );
                                    assert.equal(calculator.getPosition(), 3, 'The position should be set to 3');
                                    assert.equal(calculator.is('error'), false, 'There is no error');

                                    assert.equal(calculator.getVariable('ans').value, '0', 'The last result is 0');

                                    assert.equal(
                                        $screen.find('.expression .term').length,
                                        1,
                                        'The expected number of terms has been transformed in the expression'
                                    );

                                    assert.equal(
                                        $screen.find('.expression .term:eq(0)').get(0).dataset.value,
                                        'NaN',
                                        'the expression is transformed - data-value'
                                    );
                                    assert.equal(
                                        $screen.find('.expression .term:eq(0)').data('token'),
                                        'NAN',
                                        'the expression is transformed - data-token'
                                    );
                                    assert.equal(
                                        $screen.find('.expression .term:eq(0)').data('type'),
                                        'error',
                                        'the expression is transformed - data-type'
                                    );
                                    assert.equal(
                                        $screen.find('.expression .term:eq(0)').text().trim(),
                                        registeredTerms.NAN.label,
                                        'the expression is transformed - content'
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
                                    assert.equal(
                                        $screen.find('.history .history-expression .term').length,
                                        3,
                                        'The expected number of terms has been transformed in the history expression'
                                    );
                                    assert.equal(
                                        $screen.find('.history .history-result .term').length,
                                        1,
                                        'The expected number of terms has been transformed in the history result'
                                    );

                                    assert.equal(
                                        $screen.find('.history .history-expression .term:eq(0)').data('value'),
                                        'sqrt',
                                        'the first operand is transformed - data-value'
                                    );
                                    assert.equal(
                                        $screen.find('.history .history-expression .term:eq(0)').data('token'),
                                        'SQRT',
                                        'the first operand is transformed - data-token'
                                    );
                                    assert.equal(
                                        $screen.find('.history .history-expression .term:eq(0)').data('type'),
                                        'function',
                                        'the first operand is transformed - data-type'
                                    );
                                    assert.equal(
                                        $screen.find('.history .history-expression .term:eq(0)').text().trim(),
                                        registeredTerms.SQRT.label,
                                        'the first operand is transformed - content'
                                    );

                                    assert.equal(
                                        $screen.find('.history .history-expression .term:eq(1)').data('value'),
                                        '-',
                                        'the operator is transformed - data-value'
                                    );
                                    assert.equal(
                                        $screen.find('.history .history-expression .term:eq(1)').data('token'),
                                        'NEG',
                                        'the operator is transformed - data-token'
                                    );
                                    assert.equal(
                                        $screen.find('.history .history-expression .term:eq(1)').data('type'),
                                        'operator',
                                        'the operator is transformed - data-type'
                                    );
                                    assert.equal(
                                        $screen.find('.history .history-expression .term:eq(1)').text().trim(),
                                        registeredTerms.NEG.label,
                                        'the operator is transformed - content'
                                    );

                                    assert.equal(
                                        $screen.find('.history .history-expression .term:eq(2)').data('value'),
                                        '2',
                                        'the second operand is transformed - data-value'
                                    );
                                    assert.equal(
                                        $screen.find('.history .history-expression .term:eq(2)').data('token'),
                                        'NUM2',
                                        'the second operand is transformed - data-token'
                                    );
                                    assert.equal(
                                        $screen.find('.history .history-expression .term:eq(2)').data('type'),
                                        'digit',
                                        'the first operand is transformed - data-type'
                                    );
                                    assert.equal(
                                        $screen.find('.history .history-expression .term:eq(2)').html().trim(),
                                        '2',
                                        'the second operand is transformed - content'
                                    );

                                    assert.equal(
                                        $screen.find('.history .history-result .term:eq(0)').get(0).dataset.value,
                                        'NaN',
                                        'the result term is transformed - data-value'
                                    );
                                    assert.equal(
                                        $screen.find('.history .history-result .term:eq(0)').data('token'),
                                        'NAN',
                                        'the result term is transformed - data-token'
                                    );
                                    assert.equal(
                                        $screen.find('.history .history-result .term:eq(0)').data('type'),
                                        'error',
                                        'the result term is transformed - data-type'
                                    );
                                    assert.equal(
                                        $screen.find('.history .history-result .term:eq(0)').html().trim(),
                                        registeredTerms.NAN.label,
                                        'the result term is transformed - content'
                                    );

                                    resolve();
                                })
                                .evaluate();
                        });
                    })
                    .then(function () {
                        var $screen = $container.find('.calculator-screen');
                        return new Promise(function (resolve) {
                            calculator
                                .after('termadd.test', function () {
                                    calculator.off('termadd.test');

                                    assert.equal(calculator.getExpression(), 'ans+', 'The expression should be ans+');
                                    assert.equal(calculator.getPosition(), 4, 'The position should be set to 4');

                                    assert.equal(
                                        $screen.find('.expression .term').length,
                                        3,
                                        'The expected number of terms has been transformed in the expression'
                                    );

                                    assert.equal(
                                        $screen.find('.expression .term:eq(0)').data('value'),
                                        'ans',
                                        'the variable is transformed - data-value'
                                    );
                                    assert.equal(
                                        $screen.find('.expression .term:eq(0)').data('token'),
                                        'ANS',
                                        'the variable is transformed - data-token'
                                    );
                                    assert.equal(
                                        $screen.find('.expression .term:eq(0)').data('type'),
                                        'variable',
                                        'the variable is transformed - data-type'
                                    );
                                    assert.equal(
                                        $screen.find('.expression .term:eq(0)').text().trim(),
                                        '0',
                                        'the variable is transformed - content'
                                    );

                                    assert.equal(
                                        $screen.find('.expression .term:eq(1)').data('value'),
                                        '0',
                                        'the variable is transformed - data-value'
                                    );
                                    assert.equal(
                                        $screen.find('.expression .term:eq(1)').data('token'),
                                        'NUM0',
                                        'the variable is transformed - data-token'
                                    );
                                    assert.equal(
                                        $screen.find('.expression .term:eq(1)').data('type'),
                                        'digit',
                                        'the variable is transformed - data-type'
                                    );
                                    assert.equal(
                                        $screen.find('.expression .term:eq(1)').text().trim(),
                                        '0',
                                        'the variable is transformed - content'
                                    );

                                    assert.equal(
                                        $screen.find('.expression .term:eq(2)').data('value'),
                                        '+',
                                        'the operator is transformed - data-value'
                                    );
                                    assert.equal(
                                        $screen.find('.expression .term:eq(2)').data('token'),
                                        'ADD',
                                        'the operator is transformed - data-token'
                                    );
                                    assert.equal(
                                        $screen.find('.expression .term:eq(2)').data('type'),
                                        'operator',
                                        'the operator is transformed - data-type'
                                    );
                                    assert.equal(
                                        $screen.find('.expression .term:eq(2)').text().trim(),
                                        '+',
                                        'the operator is transformed - content'
                                    );

                                    resolve();
                                })
                                .useTerm('ADD');
                        });
                    })
                    .then(function () {
                        var $screen = $container.find('.calculator-screen');
                        return new Promise(function (resolve) {
                            calculator
                                .after('command-clearAll.test', function () {
                                    calculator.off('command-clearAll.test');

                                    assert.equal(
                                        calculator.getExpression(),
                                        '0',
                                        'The expression should be reset to 0'
                                    );
                                    assert.equal(calculator.getPosition(), 1, 'The position should be reset to 1');
                                    assert.equal(calculator.getVariable('ans').value, '0', 'The last result is 0');

                                    assert.equal(
                                        $screen.find('.expression .term').length,
                                        1,
                                        'The expected number of terms has been transformed in the expression'
                                    );

                                    assert.equal(
                                        $screen.find('.expression .term:eq(0)').data('value'),
                                        '0',
                                        'the expression is transformed - data-value'
                                    );
                                    assert.equal(
                                        $screen.find('.expression .term:eq(0)').data('token'),
                                        'NUM0',
                                        'the expression is transformed - data-token'
                                    );
                                    assert.equal(
                                        $screen.find('.expression .term:eq(0)').data('type'),
                                        'digit',
                                        'the expression is transformed - data-type'
                                    );
                                    assert.equal(
                                        $screen.find('.expression .term:eq(0)').text().trim(),
                                        '0',
                                        'the expression is transformed - content'
                                    );

                                    assert.equal($screen.find('.history .term').length, 0, 'The history is cleared');

                                    resolve();
                                })
                                .useCommand('clearAll');
                        });
                    })
                    .catch(function (err) {
                        assert.ok(false, `Unexpected failure : ${err.message}`);
                    })
                    .then(function () {
                        plugin.destroy();
                        calculator.destroy();
                    });
            })
            .on('error', function (err) {
                //eslint-disable-next-line no-console
                console.error(err);
                assert.ok(false, 'The operation should not fail!');
                ready();
            });
    });

    QUnit.test('evaluate Infinity', function (assert) {
        var ready = assert.async();
        var $container = $('#fixture-error-infinity');
        var calculator = calculatorBoardFactory($container)
            .on('ready', function () {
                var areaBroker = calculator.getAreaBroker();
                var plugin = simpleScreenPluginFactory(calculator, areaBroker);

                assert.expect(74);

                calculator
                    .on('plugin-render.simpleScreen', function () {
                        assert.ok(plugin.getState('ready'), 'The plugin has been rendered');
                    })
                    .on('destroy', function () {
                        ready();
                    });

                plugin
                    .install()
                    .then(function () {
                        return plugin.init();
                    })
                    .then(function () {
                        return plugin.render();
                    })
                    .then(function () {
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
                    .then(function () {
                        var $screen = $container.find('.calculator-screen');
                        return new Promise(function (resolve) {
                            calculator
                                .after('expressionchange.test', function () {
                                    calculator.off('expressionchange.test');
                                    assert.equal(
                                        $screen.find('.expression .term').length,
                                        3,
                                        'The expected number of terms has been transformed'
                                    );

                                    assert.equal(
                                        $screen.find('.expression .term:eq(0)').data('value'),
                                        '3',
                                        'the first operand is transformed - data-value'
                                    );
                                    assert.equal(
                                        $screen.find('.expression .term:eq(0)').data('token'),
                                        'NUM3',
                                        'the first operand is transformed - data-token'
                                    );
                                    assert.equal(
                                        $screen.find('.expression .term:eq(0)').data('type'),
                                        'digit',
                                        'the first operand is transformed - data-type'
                                    );
                                    assert.equal(
                                        $screen.find('.expression .term:eq(0)').text().trim(),
                                        '3',
                                        'the first operand is transformed - content'
                                    );

                                    assert.equal(
                                        $screen.find('.expression .term:eq(1)').data('value'),
                                        '/',
                                        'the operator is transformed - data-value'
                                    );
                                    assert.equal(
                                        $screen.find('.expression .term:eq(1)').data('token'),
                                        'DIV',
                                        'the operator is transformed - data-token'
                                    );
                                    assert.equal(
                                        $screen.find('.expression .term:eq(1)').data('type'),
                                        'operator',
                                        'the operator is transformed - data-type'
                                    );
                                    assert.equal(
                                        $screen.find('.expression .term:eq(1)').text().trim(),
                                        registeredTerms.DIV.label,
                                        'the operator is transformed - content'
                                    );

                                    assert.equal(
                                        $screen.find('.expression .term:eq(2)').data('value'),
                                        '0',
                                        'the second operand is transformed - data-value'
                                    );
                                    assert.equal(
                                        $screen.find('.expression .term:eq(2)').data('token'),
                                        'NUM0',
                                        'the second operand is transformed - data-token'
                                    );
                                    assert.equal(
                                        $screen.find('.expression .term:eq(2)').data('type'),
                                        'digit',
                                        'the first operand is transformed - data-type'
                                    );
                                    assert.equal(
                                        $screen.find('.expression .term:eq(2)').html().trim(),
                                        '0',
                                        'the second operand is transformed - content'
                                    );

                                    assert.equal(calculator.is('error'), false, 'There is no error');

                                    resolve();
                                })
                                .replace('3/0');
                        });
                    })
                    .then(function () {
                        var $screen = $container.find('.calculator-screen');
                        return new Promise(function (resolve) {
                            calculator
                                .after('evaluate.test', function () {
                                    calculator.off('evaluate.test');

                                    assert.equal(
                                        calculator.getExpression(),
                                        'ans',
                                        'The expression should be set with the last result variable'
                                    );
                                    assert.equal(calculator.getPosition(), 3, 'The position should be set to 3');
                                    assert.equal(calculator.is('error'), false, 'There is no error');

                                    assert.equal(calculator.getVariable('ans').value, '0', 'The last result is 0');

                                    assert.equal(
                                        $screen.find('.expression .term').length,
                                        1,
                                        'The expected number of terms has been transformed in the expression'
                                    );

                                    assert.equal(
                                        $screen.find('.expression .term:eq(0)').get(0).dataset.value,
                                        'Infinity',
                                        'the expression is transformed - data-value'
                                    );
                                    assert.equal(
                                        $screen.find('.expression .term:eq(0)').data('token'),
                                        'INFINITY',
                                        'the expression is transformed - data-token'
                                    );
                                    assert.equal(
                                        $screen.find('.expression .term:eq(0)').data('type'),
                                        'error',
                                        'the expression is transformed - data-type'
                                    );
                                    assert.equal(
                                        $screen.find('.expression .term:eq(0)').text().trim(),
                                        registeredTerms.INFINITY.label,
                                        'the expression is transformed - content'
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
                                    assert.equal(
                                        $screen.find('.history .history-expression .term').length,
                                        3,
                                        'The expected number of terms has been transformed in the history expression'
                                    );
                                    assert.equal(
                                        $screen.find('.history .history-result .term').length,
                                        1,
                                        'The expected number of terms has been transformed in the history result'
                                    );

                                    assert.equal(
                                        $screen.find('.history .history-expression .term:eq(0)').data('value'),
                                        '3',
                                        'the first operand is transformed - data-value'
                                    );
                                    assert.equal(
                                        $screen.find('.history .history-expression .term:eq(0)').data('token'),
                                        'NUM3',
                                        'the first operand is transformed - data-token'
                                    );
                                    assert.equal(
                                        $screen.find('.history .history-expression .term:eq(0)').data('type'),
                                        'digit',
                                        'the first operand is transformed - data-type'
                                    );
                                    assert.equal(
                                        $screen.find('.history .history-expression .term:eq(0)').text().trim(),
                                        '3',
                                        'the first operand is transformed - content'
                                    );

                                    assert.equal(
                                        $screen.find('.history .history-expression .term:eq(1)').data('value'),
                                        '/',
                                        'the operator is transformed - data-value'
                                    );
                                    assert.equal(
                                        $screen.find('.history .history-expression .term:eq(1)').data('token'),
                                        'DIV',
                                        'the operator is transformed - data-token'
                                    );
                                    assert.equal(
                                        $screen.find('.history .history-expression .term:eq(1)').data('type'),
                                        'operator',
                                        'the operator is transformed - data-type'
                                    );
                                    assert.equal(
                                        $screen.find('.history .history-expression .term:eq(1)').text().trim(),
                                        registeredTerms.DIV.label,
                                        'the operator is transformed - content'
                                    );

                                    assert.equal(
                                        $screen.find('.history .history-expression .term:eq(2)').data('value'),
                                        '0',
                                        'the second operand is transformed - data-value'
                                    );
                                    assert.equal(
                                        $screen.find('.history .history-expression .term:eq(2)').data('token'),
                                        'NUM0',
                                        'the second operand is transformed - data-token'
                                    );
                                    assert.equal(
                                        $screen.find('.history .history-expression .term:eq(2)').data('type'),
                                        'digit',
                                        'the first operand is transformed - data-type'
                                    );
                                    assert.equal(
                                        $screen.find('.history .history-expression .term:eq(2)').html().trim(),
                                        '0',
                                        'the second operand is transformed - content'
                                    );

                                    assert.equal(
                                        $screen.find('.history .history-result .term:eq(0)').get(0).dataset.value,
                                        'Infinity',
                                        'the result term is transformed - data-value'
                                    );
                                    assert.equal(
                                        $screen.find('.history .history-result .term:eq(0)').data('token'),
                                        'INFINITY',
                                        'the result term is transformed - data-token'
                                    );
                                    assert.equal(
                                        $screen.find('.history .history-result .term:eq(0)').data('type'),
                                        'error',
                                        'the result term is transformed - data-type'
                                    );
                                    assert.equal(
                                        $screen.find('.history .history-result .term:eq(0)').html().trim(),
                                        registeredTerms.INFINITY.label,
                                        'the result term is transformed - content'
                                    );

                                    resolve();
                                })
                                .evaluate();
                        });
                    })
                    .then(function () {
                        var $screen = $container.find('.calculator-screen');
                        return new Promise(function (resolve) {
                            calculator
                                .after('termadd.test', function () {
                                    calculator.off('termadd.test');

                                    assert.equal(calculator.getExpression(), 'ans+', 'The expression should be ans+');
                                    assert.equal(calculator.getPosition(), 4, 'The position should be set to 4');

                                    assert.equal(
                                        $screen.find('.expression .term').length,
                                        3,
                                        'The expected number of terms has been transformed in the expression'
                                    );

                                    assert.equal(
                                        $screen.find('.expression .term:eq(0)').data('value'),
                                        'ans',
                                        'the variable is transformed - data-value'
                                    );
                                    assert.equal(
                                        $screen.find('.expression .term:eq(0)').data('token'),
                                        'ANS',
                                        'the variable is transformed - data-token'
                                    );
                                    assert.equal(
                                        $screen.find('.expression .term:eq(0)').data('type'),
                                        'variable',
                                        'the variable is transformed - data-type'
                                    );
                                    assert.equal(
                                        $screen.find('.expression .term:eq(0)').text().trim(),
                                        '0',
                                        'the variable is transformed - content'
                                    );

                                    assert.equal(
                                        $screen.find('.expression .term:eq(1)').data('value'),
                                        '0',
                                        'the variable is transformed - data-value'
                                    );
                                    assert.equal(
                                        $screen.find('.expression .term:eq(1)').data('token'),
                                        'NUM0',
                                        'the variable is transformed - data-token'
                                    );
                                    assert.equal(
                                        $screen.find('.expression .term:eq(1)').data('type'),
                                        'digit',
                                        'the variable is transformed - data-type'
                                    );
                                    assert.equal(
                                        $screen.find('.expression .term:eq(1)').text().trim(),
                                        '0',
                                        'the variable is transformed - content'
                                    );

                                    assert.equal(
                                        $screen.find('.expression .term:eq(2)').data('value'),
                                        '+',
                                        'the operator is transformed - data-value'
                                    );
                                    assert.equal(
                                        $screen.find('.expression .term:eq(2)').data('token'),
                                        'ADD',
                                        'the operator is transformed - data-token'
                                    );
                                    assert.equal(
                                        $screen.find('.expression .term:eq(2)').data('type'),
                                        'operator',
                                        'the operator is transformed - data-type'
                                    );
                                    assert.equal(
                                        $screen.find('.expression .term:eq(2)').text().trim(),
                                        '+',
                                        'the operator is transformed - content'
                                    );

                                    resolve();
                                })
                                .useTerm('ADD');
                        });
                    })
                    .then(function () {
                        var $screen = $container.find('.calculator-screen');
                        return new Promise(function (resolve) {
                            calculator
                                .after('command-clearAll.test', function () {
                                    calculator.off('command-clearAll.test');

                                    assert.equal(
                                        calculator.getExpression(),
                                        '0',
                                        'The expression should be reset to 0'
                                    );
                                    assert.equal(calculator.getPosition(), 1, 'The position should be reset to 1');
                                    assert.equal(calculator.getVariable('ans').value, '0', 'The last result is 0');

                                    assert.equal(
                                        $screen.find('.expression .term').length,
                                        1,
                                        'The expected number of terms has been transformed in the expression'
                                    );

                                    assert.equal(
                                        $screen.find('.expression .term:eq(0)').data('value'),
                                        '0',
                                        'the expression is transformed - data-value'
                                    );
                                    assert.equal(
                                        $screen.find('.expression .term:eq(0)').data('token'),
                                        'NUM0',
                                        'the expression is transformed - data-token'
                                    );
                                    assert.equal(
                                        $screen.find('.expression .term:eq(0)').data('type'),
                                        'digit',
                                        'the expression is transformed - data-type'
                                    );
                                    assert.equal(
                                        $screen.find('.expression .term:eq(0)').text().trim(),
                                        '0',
                                        'the expression is transformed - content'
                                    );

                                    assert.equal($screen.find('.history .term').length, 0, 'The history is cleared');

                                    resolve();
                                })
                                .useCommand('clearAll');
                        });
                    })
                    .catch(function (err) {
                        assert.ok(false, `Unexpected failure : ${err.message}`);
                    })
                    .then(function () {
                        plugin.destroy();
                        calculator.destroy();
                    });
            })
            .on('error', function (err) {
                //eslint-disable-next-line no-console
                console.error(err);
                assert.ok(false, 'The operation should not fail!');
                ready();
            });
    });

    QUnit.test('evaluate syntax error', function (assert) {
        var ready = assert.async();
        var $container = $('#fixture-error-syntax');
        var calculator = calculatorBoardFactory($container)
            .on('ready', function () {
                var areaBroker = calculator.getAreaBroker();
                var plugin = simpleScreenPluginFactory(calculator, areaBroker);

                assert.expect(82);

                calculator
                    .on('plugin-render.simpleScreen', function () {
                        assert.ok(plugin.getState('ready'), 'The plugin has been rendered');
                    })
                    .on('destroy', function () {
                        ready();
                    });

                plugin
                    .install()
                    .then(function () {
                        return plugin.init();
                    })
                    .then(function () {
                        return plugin.render();
                    })
                    .then(function () {
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
                    .then(function () {
                        var $screen = $container.find('.calculator-screen');
                        return new Promise(function (resolve) {
                            calculator
                                .after('expressionchange.test', function () {
                                    calculator.off('expressionchange.test');
                                    assert.equal(
                                        $screen.find('.expression .term').length,
                                        2,
                                        'The expected number of terms has been transformed'
                                    );

                                    assert.equal(
                                        $screen.find('.expression .term:eq(0)').data('value'),
                                        '3',
                                        'the first operand is transformed - data-value'
                                    );
                                    assert.equal(
                                        $screen.find('.expression .term:eq(0)').data('token'),
                                        'NUM3',
                                        'the first operand is transformed - data-token'
                                    );
                                    assert.equal(
                                        $screen.find('.expression .term:eq(0)').data('type'),
                                        'digit',
                                        'the first operand is transformed - data-type'
                                    );
                                    assert.equal(
                                        $screen.find('.expression .term:eq(0)').text().trim(),
                                        '3',
                                        'the first operand is transformed - content'
                                    );

                                    assert.equal(
                                        $screen.find('.expression .term:eq(1)').data('value'),
                                        '+',
                                        'the operator is transformed - data-value'
                                    );
                                    assert.equal(
                                        $screen.find('.expression .term:eq(1)').data('token'),
                                        'ADD',
                                        'the operator is transformed - data-token'
                                    );
                                    assert.equal(
                                        $screen.find('.expression .term:eq(1)').data('type'),
                                        'operator',
                                        'the operator is transformed - data-type'
                                    );
                                    assert.equal(
                                        $screen.find('.expression .term:eq(1)').text().trim(),
                                        '+',
                                        'the operator is transformed - content'
                                    );

                                    assert.equal(calculator.is('error'), false, 'There is no error');

                                    resolve();
                                })
                                .replace('3+');
                        });
                    })
                    .then(function () {
                        var $screen = $container.find('.calculator-screen');
                        return new Promise(function (resolve) {
                            calculator
                                .after('evaluate.test', function () {
                                    assert.ok(false, 'The expresion should raise a syntax error!');
                                })
                                .after('syntaxerror.test', function () {
                                    calculator.off('evaluate.test');
                                    calculator.off('syntaxerror.test');
                                    assert.equal(calculator.getExpression(), '3+', 'The expression should not change');
                                    assert.equal(calculator.getPosition(), 2, 'The position should be set to 2');
                                    assert.equal(calculator.is('error'), true, 'There is an error');

                                    assert.equal(calculator.getVariable('ans').value, '0', 'The last result is 0');

                                    assert.equal(
                                        $screen.find('.expression .term').length,
                                        3,
                                        'The expected number of terms has been transformed'
                                    );

                                    assert.equal(
                                        $screen.find('.expression .term:eq(0)').data('value'),
                                        '3',
                                        'the first operand is transformed - data-value'
                                    );
                                    assert.equal(
                                        $screen.find('.expression .term:eq(0)').data('token'),
                                        'NUM3',
                                        'the first operand is transformed - data-token'
                                    );
                                    assert.equal(
                                        $screen.find('.expression .term:eq(0)').data('type'),
                                        'digit',
                                        'the first operand is transformed - data-type'
                                    );
                                    assert.equal(
                                        $screen.find('.expression .term:eq(0)').text().trim(),
                                        '3',
                                        'the first operand is transformed - content'
                                    );

                                    assert.equal(
                                        $screen.find('.expression .term:eq(1)').data('value'),
                                        '+',
                                        'the operator is transformed - data-value'
                                    );
                                    assert.equal(
                                        $screen.find('.expression .term:eq(1)').data('token'),
                                        'ADD',
                                        'the operator is transformed - data-token'
                                    );
                                    assert.equal(
                                        $screen.find('.expression .term:eq(1)').data('type'),
                                        'operator',
                                        'the operator is transformed - data-type'
                                    );
                                    assert.equal(
                                        $screen.find('.expression .term:eq(1)').text().trim(),
                                        '+',
                                        'the operator is transformed - content'
                                    );

                                    assert.equal(
                                        $screen.find('.expression .term:eq(2)').data('value'),
                                        '#',
                                        'the error is added - data-value'
                                    );
                                    assert.equal(
                                        $screen.find('.expression .term:eq(2)').data('token'),
                                        'ERROR',
                                        'the error is added - data-token'
                                    );
                                    assert.equal(
                                        $screen.find('.expression .term:eq(2)').data('type'),
                                        'error',
                                        'the error is added - data-type'
                                    );
                                    assert.equal(
                                        $screen.find('.expression .term:eq(2)').text().trim(),
                                        registeredTerms.ERROR.label,
                                        'the expression is transformed - content'
                                    );

                                    assert.equal($screen.find('.history .term').length, 0, 'The history is empty');

                                    resolve();
                                })
                                .evaluate();
                        });
                    })
                    .then(function () {
                        var $screen = $container.find('.calculator-screen');
                        return new Promise(function (resolve) {
                            calculator
                                .after('termadd.test', function () {
                                    calculator.off('termadd.test');

                                    assert.equal(calculator.getExpression(), '3+2', 'The expression should be ans+');
                                    assert.equal(calculator.getPosition(), 3, 'The position should be set to 3');

                                    assert.equal(
                                        $screen.find('.expression .term').length,
                                        3,
                                        'The expected number of terms has been transformed in the expression'
                                    );

                                    assert.equal(
                                        $screen.find('.expression .term:eq(0)').data('value'),
                                        '3',
                                        'the first operand is transformed - data-value'
                                    );
                                    assert.equal(
                                        $screen.find('.expression .term:eq(0)').data('token'),
                                        'NUM3',
                                        'the first operand is transformed - data-token'
                                    );
                                    assert.equal(
                                        $screen.find('.expression .term:eq(0)').data('type'),
                                        'digit',
                                        'the first operand is transformed - data-type'
                                    );
                                    assert.equal(
                                        $screen.find('.expression .term:eq(0)').text().trim(),
                                        '3',
                                        'the first operand is transformed - content'
                                    );

                                    assert.equal(
                                        $screen.find('.expression .term:eq(1)').data('value'),
                                        '+',
                                        'the operator is transformed - data-value'
                                    );
                                    assert.equal(
                                        $screen.find('.expression .term:eq(1)').data('token'),
                                        'ADD',
                                        'the operator is transformed - data-token'
                                    );
                                    assert.equal(
                                        $screen.find('.expression .term:eq(1)').data('type'),
                                        'operator',
                                        'the operator is transformed - data-type'
                                    );
                                    assert.equal(
                                        $screen.find('.expression .term:eq(1)').text().trim(),
                                        '+',
                                        'the operator is transformed - content'
                                    );

                                    assert.equal(
                                        $screen.find('.expression .term:eq(2)').data('value'),
                                        '2',
                                        'the second operand is transformed - data-value'
                                    );
                                    assert.equal(
                                        $screen.find('.expression .term:eq(2)').data('token'),
                                        'NUM2',
                                        'the second operand is transformed - data-token'
                                    );
                                    assert.equal(
                                        $screen.find('.expression .term:eq(2)').data('type'),
                                        'digit',
                                        'the first operand is transformed - data-type'
                                    );
                                    assert.equal(
                                        $screen.find('.expression .term:eq(2)').html().trim(),
                                        '2',
                                        'the second operand is transformed - content'
                                    );

                                    resolve();
                                })
                                .useTerm('NUM2');
                        });
                    })
                    .then(function () {
                        var $screen = $container.find('.calculator-screen');
                        return new Promise(function (resolve) {
                            calculator
                                .after('evaluate.test', function () {
                                    calculator.off('evaluate.test');

                                    assert.equal(
                                        calculator.getExpression(),
                                        'ans',
                                        'The expression should be set with the last result variable'
                                    );
                                    assert.equal(calculator.getPosition(), 3, 'The position should be set to 3');

                                    assert.equal(calculator.getVariable('ans').value, '5', 'The last result is 5');

                                    assert.equal(
                                        $screen.find('.expression .term').length,
                                        2,
                                        'The expected number of terms has been transformed in the expression'
                                    );

                                    assert.equal(
                                        $screen.find('.expression .term:eq(0)').data('value'),
                                        'ans',
                                        'the expression is transformed - data-value'
                                    );
                                    assert.equal(
                                        $screen.find('.expression .term:eq(0)').data('token'),
                                        'ANS',
                                        'the expression is transformed - data-token'
                                    );
                                    assert.equal(
                                        $screen.find('.expression .term:eq(0)').data('type'),
                                        'variable',
                                        'the expression is transformed - data-type'
                                    );
                                    assert.equal(
                                        $screen.find('.expression .term:eq(0)').text().trim(),
                                        '5',
                                        'the expression is transformed - content'
                                    );

                                    assert.equal(
                                        $screen.find('.expression .term:eq(1)').data('value'),
                                        '5',
                                        'the expression is transformed - data-value'
                                    );
                                    assert.equal(
                                        $screen.find('.expression .term:eq(1)').data('token'),
                                        'NUM5',
                                        'the expression is transformed - data-token'
                                    );
                                    assert.equal(
                                        $screen.find('.expression .term:eq(1)').data('type'),
                                        'digit',
                                        'the expression is transformed - data-type'
                                    );
                                    assert.equal(
                                        $screen.find('.expression .term:eq(1)').text().trim(),
                                        '5',
                                        'the expression is transformed - content'
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
                                    assert.equal(
                                        $screen.find('.history .history-expression .term').length,
                                        3,
                                        'The expected number of terms has been transformed in the history expression'
                                    );
                                    assert.equal(
                                        $screen.find('.history .history-result .term').length,
                                        1,
                                        'The expected number of terms has been transformed in the history result'
                                    );

                                    assert.equal(
                                        $screen.find('.history .history-expression .term:eq(0)').data('value'),
                                        '3',
                                        'the first operand is transformed - data-value'
                                    );
                                    assert.equal(
                                        $screen.find('.history .history-expression .term:eq(0)').data('token'),
                                        'NUM3',
                                        'the first operand is transformed - data-token'
                                    );
                                    assert.equal(
                                        $screen.find('.history .history-expression .term:eq(0)').data('type'),
                                        'digit',
                                        'the first operand is transformed - data-type'
                                    );
                                    assert.equal(
                                        $screen.find('.history .history-expression .term:eq(0)').text().trim(),
                                        '3',
                                        'the first operand is transformed - content'
                                    );

                                    assert.equal(
                                        $screen.find('.history .history-expression .term:eq(1)').data('value'),
                                        '+',
                                        'the operator is transformed - data-value'
                                    );
                                    assert.equal(
                                        $screen.find('.history .history-expression .term:eq(1)').data('token'),
                                        'ADD',
                                        'the operator is transformed - data-token'
                                    );
                                    assert.equal(
                                        $screen.find('.history .history-expression .term:eq(1)').data('type'),
                                        'operator',
                                        'the operator is transformed - data-type'
                                    );
                                    assert.equal(
                                        $screen.find('.history .history-expression .term:eq(1)').text().trim(),
                                        '+',
                                        'the operator is transformed - content'
                                    );

                                    assert.equal(
                                        $screen.find('.history .history-expression .term:eq(2)').data('value'),
                                        '2',
                                        'the second operand is transformed - data-value'
                                    );
                                    assert.equal(
                                        $screen.find('.history .history-expression .term:eq(2)').data('token'),
                                        'NUM2',
                                        'the second operand is transformed - data-token'
                                    );
                                    assert.equal(
                                        $screen.find('.history .history-expression .term:eq(2)').data('type'),
                                        'digit',
                                        'the first operand is transformed - data-type'
                                    );
                                    assert.equal(
                                        $screen.find('.history .history-expression .term:eq(2)').html().trim(),
                                        '2',
                                        'the second operand is transformed - content'
                                    );

                                    assert.equal(
                                        $screen.find('.history .history-result .term:eq(0)').data('value'),
                                        '5',
                                        'the result term is transformed - data-value'
                                    );
                                    assert.equal(
                                        $screen.find('.history .history-result .term:eq(0)').data('token'),
                                        'NUM5',
                                        'the result term is transformed - data-token'
                                    );
                                    assert.equal(
                                        $screen.find('.history .history-result .term:eq(0)').data('type'),
                                        'digit',
                                        'the result term is transformed - data-type'
                                    );
                                    assert.equal(
                                        $screen.find('.history .history-result .term:eq(0)').html().trim(),
                                        '5',
                                        'the result term is transformed - content'
                                    );

                                    resolve();
                                })
                                .evaluate();
                        });
                    })
                    .catch(function (err) {
                        assert.ok(false, `Unexpected failure : ${err.message}`);
                    })
                    .then(function () {
                        plugin.destroy();
                        calculator.destroy();
                    });
            })
            .on('error', function (err) {
                //eslint-disable-next-line no-console
                console.error(err);
                assert.ok(false, 'The operation should not fail!');
                ready();
            });
    });

    QUnit.test('0 and operator', function (assert) {
        var ready = assert.async();
        var $container = $('#fixture-zero-op');
        var calculator = calculatorBoardFactory($container)
            .on('ready', function () {
                var areaBroker = calculator.getAreaBroker();
                var plugin = simpleScreenPluginFactory(calculator, areaBroker);

                assert.expect(40);

                calculator
                    .on('plugin-render.simpleScreen', function () {
                        assert.ok(plugin.getState('ready'), 'The plugin has been rendered');
                    })
                    .on('destroy', function () {
                        ready();
                    });

                plugin
                    .install()
                    .then(function () {
                        return plugin.init();
                    })
                    .then(function () {
                        return plugin.render();
                    })
                    .then(function () {
                        var $screen = $container.find('.calculator-screen');
                        assert.equal(
                            areaBroker.getScreenArea().find('.calculator-screen').length,
                            1,
                            'The screen layout has been inserted'
                        );

                        assert.equal(calculator.getExpression(), '0', 'The expression should be set to 0');
                        assert.equal(calculator.getPosition(), 1, 'The position should be set to 1');

                        assert.equal(
                            $screen.find('.term').length,
                            1,
                            'The expected number of terms has been transformed'
                        );

                        assert.equal(
                            $screen.find('.term:eq(0)').data('value'),
                            '0',
                            'the first operand is transformed - data-value'
                        );
                        assert.equal(
                            $screen.find('.term:eq(0)').data('token'),
                            'NUM0',
                            'the first operand is transformed - data-token'
                        );
                        assert.equal(
                            $screen.find('.term:eq(0)').text().trim(),
                            '0',
                            'the first operand is transformed - content'
                        );
                    })
                    .then(function () {
                        var $screen = $container.find('.calculator-screen');
                        return new Promise(function (resolve) {
                            calculator
                                .after('termadd.test', function () {
                                    calculator.off('termadd.test');

                                    assert.equal(calculator.getExpression(), '0', 'The expression should still be 0');
                                    assert.equal(calculator.getPosition(), 1, 'The position should still be 1');

                                    assert.equal(
                                        $screen.find('.term').length,
                                        1,
                                        'The expected number of terms should remain the same'
                                    );

                                    assert.equal(
                                        $screen.find('.term:eq(0)').data('value'),
                                        '0',
                                        'the operand is unchanged - data-value'
                                    );
                                    assert.equal(
                                        $screen.find('.term:eq(0)').data('token'),
                                        'NUM0',
                                        'the operand is unchanged - data-token'
                                    );
                                    assert.equal(
                                        $screen.find('.term:eq(0)').text().trim(),
                                        '0',
                                        'the operand is unchanged - content'
                                    );

                                    resolve();
                                })
                                .useTerm('NUM0');
                        });
                    })
                    .then(function () {
                        var $screen = $container.find('.calculator-screen');
                        return new Promise(function (resolve) {
                            calculator
                                .after('termadd.ADD', function () {
                                    calculator.off('termadd.ADD');

                                    assert.equal(calculator.getExpression(), '0+', 'The expression should be 0+');
                                    assert.equal(calculator.getPosition(), 2, 'The position should be set to 2');

                                    assert.equal(
                                        $screen.find('.expression .term').length,
                                        2,
                                        'The expected number of terms has been transformed in the expression'
                                    );

                                    assert.equal(
                                        $screen.find('.expression .term:eq(0)').data('value'),
                                        '0',
                                        'the operand is transformed - data-value'
                                    );
                                    assert.equal(
                                        $screen.find('.expression .term:eq(0)').data('token'),
                                        'NUM0',
                                        'the operand is transformed - data-token'
                                    );
                                    assert.equal(
                                        $screen.find('.expression .term:eq(0)').data('type'),
                                        'digit',
                                        'the operand is transformed - data-type'
                                    );
                                    assert.equal(
                                        $screen.find('.expression .term:eq(0)').text().trim(),
                                        '0',
                                        'the operand is transformed - content'
                                    );

                                    assert.equal(
                                        $screen.find('.expression .term:eq(1)').data('value'),
                                        '+',
                                        'the operator is transformed - data-value'
                                    );
                                    assert.equal(
                                        $screen.find('.expression .term:eq(1)').data('token'),
                                        'ADD',
                                        'the operator is transformed - data-token'
                                    );
                                    assert.equal(
                                        $screen.find('.expression .term:eq(1)').data('type'),
                                        'operator',
                                        'the operator is transformed - data-type'
                                    );
                                    assert.equal(
                                        $screen.find('.expression .term:eq(1)').text().trim(),
                                        '+',
                                        'the operator is transformed - content'
                                    );

                                    calculator
                                        .after('termadd.NUM5', function () {
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

                                            assert.equal(
                                                $screen.find('.expression .term').length,
                                                3,
                                                'The expected number of terms has been transformed in the expression'
                                            );

                                            assert.equal(
                                                $screen.find('.expression .term:eq(0)').data('value'),
                                                '0',
                                                'the operand is transformed - data-value'
                                            );
                                            assert.equal(
                                                $screen.find('.expression .term:eq(0)').data('token'),
                                                'NUM0',
                                                'the operand is transformed - data-token'
                                            );
                                            assert.equal(
                                                $screen.find('.expression .term:eq(0)').data('type'),
                                                'digit',
                                                'the operand is transformed - data-type'
                                            );
                                            assert.equal(
                                                $screen.find('.expression .term:eq(0)').text().trim(),
                                                '0',
                                                'the operand is transformed - content'
                                            );

                                            assert.equal(
                                                $screen.find('.expression .term:eq(1)').data('value'),
                                                '+',
                                                'the operator is transformed - data-value'
                                            );
                                            assert.equal(
                                                $screen.find('.expression .term:eq(1)').data('token'),
                                                'ADD',
                                                'the operator is transformed - data-token'
                                            );
                                            assert.equal(
                                                $screen.find('.expression .term:eq(1)').data('type'),
                                                'operator',
                                                'the operator is transformed - data-type'
                                            );
                                            assert.equal(
                                                $screen.find('.expression .term:eq(1)').text().trim(),
                                                '+',
                                                'the operator is transformed - content'
                                            );

                                            assert.equal(
                                                $screen.find('.expression .term:eq(2)').data('value'),
                                                '5',
                                                'the operand is transformed - data-value'
                                            );
                                            assert.equal(
                                                $screen.find('.expression .term:eq(2)').data('token'),
                                                'NUM5',
                                                'the operand is transformed - data-token'
                                            );
                                            assert.equal(
                                                $screen.find('.expression .term:eq(2)').data('type'),
                                                'digit',
                                                'the operand is transformed - data-type'
                                            );
                                            assert.equal(
                                                $screen.find('.expression .term:eq(2)').text().trim(),
                                                '5',
                                                'the operand is transformed - content'
                                            );

                                            resolve();
                                        })
                                        .useTerm('NUM5');
                                })
                                .useTerm('ADD');
                        });
                    })
                    .catch(function (err) {
                        assert.ok(false, `Unexpected failure : ${err.message}`);
                    })
                    .then(function () {
                        plugin.destroy();
                        calculator.destroy();
                    });
            })
            .on('error', function (err) {
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
                label: registeredTerms.PI.label
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
                label: registeredTerms.SQRT.label
            }
        ])
        .test('0 and const', function (data, assert) {
            var ready = assert.async();
            var $container = $('#fixture-zero-const');
            var calculator = calculatorBoardFactory($container)
                .on('ready', function () {
                    var areaBroker = calculator.getAreaBroker();
                    var plugin = simpleScreenPluginFactory(calculator, areaBroker);

                    assert.expect(21);

                    calculator
                        .on('plugin-render.simpleScreen', function () {
                            assert.ok(plugin.getState('ready'), 'The plugin has been rendered');
                        })
                        .on('destroy', function () {
                            ready();
                        });

                    plugin
                        .install()
                        .then(function () {
                            return plugin.init();
                        })
                        .then(function () {
                            return plugin.render();
                        })
                        .then(function () {
                            var $screen = $container.find('.calculator-screen');
                            assert.equal(
                                areaBroker.getScreenArea().find('.calculator-screen').length,
                                1,
                                'The screen layout has been inserted'
                            );

                            assert.equal(calculator.getExpression(), '0', 'The expression should be set to 0');
                            assert.equal(calculator.getPosition(), 1, 'The position should be set to 1');

                            assert.equal(
                                $screen.find('.term').length,
                                1,
                                'The expected number of terms has been transformed'
                            );

                            assert.equal(
                                $screen.find('.term:eq(0)').data('value'),
                                '0',
                                'the first operand is transformed - data-value'
                            );
                            assert.equal(
                                $screen.find('.term:eq(0)').data('token'),
                                'NUM0',
                                'the first operand is transformed - data-token'
                            );
                            assert.equal(
                                $screen.find('.term:eq(0)').text().trim(),
                                '0',
                                'the first operand is transformed - content'
                            );
                        })
                        .then(function () {
                            var $screen = $container.find('.calculator-screen');
                            return new Promise(function (resolve) {
                                calculator
                                    .after('termadd.test', function () {
                                        calculator.off('termadd.test');

                                        assert.equal(
                                            calculator.getExpression(),
                                            '0',
                                            'The expression should still be 0'
                                        );
                                        assert.equal(calculator.getPosition(), 1, 'The position should still be 1');

                                        assert.equal(
                                            $screen.find('.term').length,
                                            1,
                                            'The expected number of terms should remain the same'
                                        );

                                        assert.equal(
                                            $screen.find('.term:eq(0)').data('value'),
                                            '0',
                                            'the operand is unchanged - data-value'
                                        );
                                        assert.equal(
                                            $screen.find('.term:eq(0)').data('token'),
                                            'NUM0',
                                            'the operand is unchanged - data-token'
                                        );
                                        assert.equal(
                                            $screen.find('.term:eq(0)').text().trim(),
                                            '0',
                                            'the operand is unchanged - content'
                                        );

                                        resolve();
                                    })
                                    .useTerm('NUM0');
                            });
                        })
                        .then(function () {
                            var $screen = $container.find('.calculator-screen');
                            return new Promise(function (resolve) {
                                calculator
                                    .after('termadd.test', function () {
                                        calculator.off('termadd.test');

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

                                        assert.equal(
                                            $screen.find('.expression .term').length,
                                            1,
                                            'The expected number of terms has been transformed in the expression'
                                        );

                                        assert.equal(
                                            $screen.find('.expression .term:eq(0)').data('value'),
                                            data.value,
                                            'the operand is transformed - data-value'
                                        );
                                        assert.equal(
                                            $screen.find('.expression .term:eq(0)').data('token'),
                                            data.term,
                                            'the operand is transformed - data-token'
                                        );
                                        assert.equal(
                                            $screen.find('.expression .term:eq(0)').data('type'),
                                            data.type,
                                            'the operand is transformed - data-type'
                                        );
                                        assert.equal(
                                            $screen.find('.expression .term:eq(0)').text().trim(),
                                            data.label,
                                            'the operand is transformed - content'
                                        );

                                        resolve();
                                    })
                                    .useTerm(data.term);
                            });
                        })
                        .catch(function (err) {
                            assert.ok(false, `Unexpected failure : ${err.message}`);
                        })
                        .then(function () {
                            plugin.destroy();
                            calculator.destroy();
                        });
                })
                .on('error', function (err) {
                    //eslint-disable-next-line no-console
                    console.error(err);
                    assert.ok(false, 'The operation should not fail!');
                    ready();
                });
        });

    QUnit.test('ans and operator', function (assert) {
        var ready = assert.async();
        var $container = $('#fixture-ans-op');
        var calculator = calculatorBoardFactory($container)
            .on('ready', function () {
                var areaBroker = calculator.getAreaBroker();
                var plugin = simpleScreenPluginFactory(calculator, areaBroker);

                assert.expect(41);

                calculator
                    .on('plugin-render.simpleScreen', function () {
                        assert.ok(plugin.getState('ready'), 'The plugin has been rendered');
                    })
                    .on('destroy', function () {
                        ready();
                    });

                plugin
                    .install()
                    .then(function () {
                        return plugin.init();
                    })
                    .then(function () {
                        return plugin.render();
                    })
                    .then(function () {
                        var $screen = $container.find('.calculator-screen');
                        assert.equal(
                            areaBroker.getScreenArea().find('.calculator-screen').length,
                            1,
                            'The screen layout has been inserted'
                        );

                        calculator.replace('ans');

                        assert.equal(calculator.getExpression(), 'ans', 'The expression should be set to ans');
                        assert.equal(calculator.getPosition(), 3, 'The position should be set to 3');

                        assert.equal(
                            $screen.find('.term').length,
                            2,
                            'The expected number of terms has been transformed'
                        );

                        assert.equal(
                            $screen.find('.term:eq(0)').data('value'),
                            'ans',
                            'the first operand is transformed - data-value'
                        );
                        assert.equal(
                            $screen.find('.term:eq(0)').data('token'),
                            'ANS',
                            'the first operand is transformed - data-token'
                        );
                        assert.equal(
                            $screen.find('.term:eq(0)').text().trim(),
                            '0',
                            'the first operand is transformed - content'
                        );

                        assert.equal(
                            $screen.find('.term:eq(1)').data('value'),
                            '0',
                            'the first operand is transformed - data-value'
                        );
                        assert.equal(
                            $screen.find('.term:eq(1)').data('token'),
                            'NUM0',
                            'the first operand is transformed - data-token'
                        );
                        assert.equal(
                            $screen.find('.term:eq(1)').text().trim(),
                            '0',
                            'the first operand is transformed - content'
                        );
                    })
                    .then(function () {
                        var $screen = $container.find('.calculator-screen');
                        return new Promise(function (resolve) {
                            calculator
                                .after('termadd.ADD', function () {
                                    calculator.off('termadd.ADD');

                                    assert.equal(calculator.getExpression(), 'ans+', 'The expression should be ans+');
                                    assert.equal(calculator.getPosition(), 4, 'The position should be set to 4');

                                    assert.equal(
                                        $screen.find('.expression .term').length,
                                        3,
                                        'The expected number of terms has been transformed in the expression'
                                    );

                                    assert.equal(
                                        $screen.find('.expression .term:eq(0)').data('value'),
                                        'ans',
                                        'the variable is transformed - data-value'
                                    );
                                    assert.equal(
                                        $screen.find('.expression .term:eq(0)').data('token'),
                                        'ANS',
                                        'the variable is transformed - data-token'
                                    );
                                    assert.equal(
                                        $screen.find('.expression .term:eq(0)').data('type'),
                                        'variable',
                                        'the variable is transformed - data-type'
                                    );
                                    assert.equal(
                                        $screen.find('.expression .term:eq(0)').text().trim(),
                                        '0',
                                        'the variable is transformed - content'
                                    );

                                    assert.equal(
                                        $screen.find('.expression .term:eq(1)').data('value'),
                                        '0',
                                        'the variable is transformed - data-value'
                                    );
                                    assert.equal(
                                        $screen.find('.expression .term:eq(1)').data('token'),
                                        'NUM0',
                                        'the variable is transformed - data-token'
                                    );
                                    assert.equal(
                                        $screen.find('.expression .term:eq(1)').data('type'),
                                        'digit',
                                        'the variable is transformed - data-type'
                                    );
                                    assert.equal(
                                        $screen.find('.expression .term:eq(1)').text().trim(),
                                        '0',
                                        'the variable is transformed - content'
                                    );

                                    assert.equal(
                                        $screen.find('.expression .term:eq(2)').data('value'),
                                        '+',
                                        'the operator is transformed - data-value'
                                    );
                                    assert.equal(
                                        $screen.find('.expression .term:eq(2)').data('token'),
                                        'ADD',
                                        'the operator is transformed - data-token'
                                    );
                                    assert.equal(
                                        $screen.find('.expression .term:eq(2)').data('type'),
                                        'operator',
                                        'the operator is transformed - data-type'
                                    );
                                    assert.equal(
                                        $screen.find('.expression .term:eq(2)').text().trim(),
                                        '+',
                                        'the operator is transformed - content'
                                    );

                                    calculator
                                        .after('termadd.NUM8', function () {
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

                                            assert.equal(
                                                $screen.find('.expression .term').length,
                                                4,
                                                'The expected number of terms has been transformed in the expression'
                                            );

                                            assert.equal(
                                                $screen.find('.expression .term:eq(0)').data('value'),
                                                'ans',
                                                'the variable is transformed - data-value'
                                            );
                                            assert.equal(
                                                $screen.find('.expression .term:eq(0)').data('token'),
                                                'ANS',
                                                'the variable is transformed - data-token'
                                            );
                                            assert.equal(
                                                $screen.find('.expression .term:eq(0)').data('type'),
                                                'variable',
                                                'the variable is transformed - data-type'
                                            );
                                            assert.equal(
                                                $screen.find('.expression .term:eq(0)').text().trim(),
                                                '0',
                                                'the variable is transformed - content'
                                            );

                                            assert.equal(
                                                $screen.find('.expression .term:eq(2)').data('value'),
                                                '+',
                                                'the operator is transformed - data-value'
                                            );
                                            assert.equal(
                                                $screen.find('.expression .term:eq(2)').data('token'),
                                                'ADD',
                                                'the operator is transformed - data-token'
                                            );
                                            assert.equal(
                                                $screen.find('.expression .term:eq(2)').data('type'),
                                                'operator',
                                                'the operator is transformed - data-type'
                                            );
                                            assert.equal(
                                                $screen.find('.expression .term:eq(2)').text().trim(),
                                                '+',
                                                'the operator is transformed - content'
                                            );

                                            assert.equal(
                                                $screen.find('.expression .term:eq(3)').data('value'),
                                                '8',
                                                'the operand is transformed - data-value'
                                            );
                                            assert.equal(
                                                $screen.find('.expression .term:eq(3)').data('token'),
                                                'NUM8',
                                                'the operand is transformed - data-token'
                                            );
                                            assert.equal(
                                                $screen.find('.expression .term:eq(3)').data('type'),
                                                'digit',
                                                'the operand is transformed - data-type'
                                            );
                                            assert.equal(
                                                $screen.find('.expression .term:eq(3)').text().trim(),
                                                '8',
                                                'the operand is transformed - content'
                                            );

                                            resolve();
                                        })
                                        .useTerm('NUM8');
                                })
                                .useTerm('ADD');
                        });
                    })
                    .catch(function (err) {
                        assert.ok(false, `Unexpected failure : ${err.message}`);
                    })
                    .then(function () {
                        plugin.destroy();
                        calculator.destroy();
                    });
            })
            .on('error', function (err) {
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
                label: registeredTerms.PI.label
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
                label: registeredTerms.SQRT.label
            }
        ])
        .test('ans and const', function (data, assert) {
            var ready = assert.async();
            var $container = $('#fixture-ans-const');
            var calculator = calculatorBoardFactory($container)
                .on('ready', function () {
                    var areaBroker = calculator.getAreaBroker();
                    var plugin = simpleScreenPluginFactory(calculator, areaBroker);

                    assert.expect(18);

                    calculator
                        .on('plugin-render.simpleScreen', function () {
                            assert.ok(plugin.getState('ready'), 'The plugin has been rendered');
                        })
                        .on('destroy', function () {
                            ready();
                        });

                    plugin
                        .install()
                        .then(function () {
                            return plugin.init();
                        })
                        .then(function () {
                            return plugin.render();
                        })
                        .then(function () {
                            var $screen = $container.find('.calculator-screen');
                            assert.equal(
                                areaBroker.getScreenArea().find('.calculator-screen').length,
                                1,
                                'The screen layout has been inserted'
                            );

                            calculator.replace('ans');

                            assert.equal(calculator.getExpression(), 'ans', 'The expression should be set to ans');
                            assert.equal(calculator.getPosition(), 3, 'The position should be set to 3');

                            assert.equal(
                                $screen.find('.term').length,
                                2,
                                'The expected number of terms has been transformed'
                            );

                            assert.equal(
                                $screen.find('.term:eq(0)').data('value'),
                                'ans',
                                'the first operand is transformed - data-value'
                            );
                            assert.equal(
                                $screen.find('.term:eq(0)').data('token'),
                                'ANS',
                                'the first operand is transformed - data-token'
                            );
                            assert.equal(
                                $screen.find('.term:eq(0)').text().trim(),
                                '0',
                                'the first operand is transformed - content'
                            );

                            assert.equal(
                                $screen.find('.term:eq(1)').data('value'),
                                '0',
                                'the first operand is transformed - data-value'
                            );
                            assert.equal(
                                $screen.find('.term:eq(1)').data('token'),
                                'NUM0',
                                'the first operand is transformed - data-token'
                            );
                            assert.equal(
                                $screen.find('.term:eq(1)').text().trim(),
                                '0',
                                'the first operand is transformed - content'
                            );
                        })
                        .then(function () {
                            var $screen = $container.find('.calculator-screen');
                            return new Promise(function (resolve) {
                                calculator
                                    .after('termadd.test', function () {
                                        calculator.off('termadd.test');

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

                                        assert.equal(
                                            $screen.find('.expression .term').length,
                                            1,
                                            'The expected number of terms has been transformed in the expression'
                                        );

                                        assert.equal(
                                            $screen.find('.expression .term:eq(0)').data('value'),
                                            data.value,
                                            'the operand is transformed - data-value'
                                        );
                                        assert.equal(
                                            $screen.find('.expression .term:eq(0)').data('token'),
                                            data.term,
                                            'the operand is transformed - data-token'
                                        );
                                        assert.equal(
                                            $screen.find('.expression .term:eq(0)').data('type'),
                                            data.type,
                                            'the operand is transformed - data-type'
                                        );
                                        assert.equal(
                                            $screen.find('.expression .term:eq(0)').text().trim(),
                                            data.label,
                                            'the operand is transformed - content'
                                        );

                                        resolve();
                                    })
                                    .useTerm(data.term);
                            });
                        })
                        .catch(function (err) {
                            assert.ok(false, `Unexpected failure : ${err.message}`);
                        })
                        .then(function () {
                            plugin.destroy();
                            calculator.destroy();
                        });
                })
                .on('error', function (err) {
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
                text: `${registeredTerms.NEG.label}3`
            },
            {
                title: '-PI',
                expression: '-PI',
                text: `${registeredTerms.NEG.label}${registeredTerms.PI.label}`
            },
            {
                title: 'PI-3',
                expression: 'PI-3',
                text: `${registeredTerms.PI.label}-3`
            },
            {
                title: '4*-3',
                expression: '4*-3',
                text: `4${registeredTerms.MUL.label}${registeredTerms.NEG.label}3`
            },
            {
                title: '4-3',
                expression: '4-3',
                text: '4-3'
            },
            {
                title: '4*(-3+2)',
                expression: '4*(-3+2)',
                text: `4${registeredTerms.MUL.label}(${registeredTerms.NEG.label}3+2)`
            },
            {
                title: '4*(3+2)-5',
                expression: '4*(3+2)-5',
                text: `4${registeredTerms.MUL.label}(3+2)-5`
            },
            {
                title: 'sin-5',
                expression: 'sin-5',
                text: `sin${registeredTerms.NEG.label}5`
            }
        ])
        .test('treatment of minus operator', function (data, assert) {
            var ready = assert.async();
            var $container = $('#fixture-minus-operator');
            var calculator = calculatorBoardFactory($container)
                .on('ready', function () {
                    var areaBroker = calculator.getAreaBroker();
                    var plugin = simpleScreenPluginFactory(calculator, areaBroker);

                    assert.expect(5);

                    calculator
                        .on('plugin-render.simpleScreen', function () {
                            assert.ok(plugin.getState('ready'), 'The plugin has been rendered');
                        })
                        .on('destroy', function () {
                            ready();
                        });

                    plugin
                        .install()
                        .then(function () {
                            return plugin.init();
                        })
                        .then(function () {
                            return plugin.render();
                        })
                        .then(function () {
                            var $screen = $container.find('.calculator-screen .expression');
                            var termsCount = calculator.getTokenizer().tokenize(data.expression).length;
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
                        .catch(function (err) {
                            assert.ok(false, `Unexpected failure : ${err.message}`);
                        })
                        .then(function () {
                            plugin.destroy();
                            calculator.destroy();
                        });
                })
                .on('error', function (err) {
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
                variables: {
                    ans: mathsEvaluator('42')
                },
                text: '42'
            },
            {
                title: '1/3',
                expression: 'ans',
                variables: {
                    ans: mathsEvaluator('1/3')
                },
                text: `0.33333${registeredTerms.ELLIPSIS.label}`
            },
            {
                title: '2/3',
                expression: 'ans',
                variables: {
                    ans: mathsEvaluator('2/3')
                },
                text: `0.66667${registeredTerms.ELLIPSIS.label}`
            },
            {
                title: 'PI',
                expression: 'ans',
                variables: {
                    ans: mathsEvaluator('PI')
                },
                text: `3.14159${registeredTerms.ELLIPSIS.label}`
            }
        ])
        .test('treatment of ellipsis', function (data, assert) {
            var ready = assert.async();
            var $container = $('#fixture-ellipsis');
            var calculator = calculatorBoardFactory($container)
                .on('ready', function () {
                    var areaBroker = calculator.getAreaBroker();
                    var plugin = simpleScreenPluginFactory(calculator, areaBroker);

                    assert.expect(4);

                    calculator
                        .on('plugin-render.simpleScreen', function () {
                            assert.ok(plugin.getState('ready'), 'The plugin has been rendered');
                        })
                        .on('destroy', function () {
                            ready();
                        });

                    plugin
                        .install()
                        .then(function () {
                            return plugin.init();
                        })
                        .then(function () {
                            return plugin.render();
                        })
                        .then(function () {
                            var $screen = $container.find('.calculator-screen .expression');
                            assert.equal(
                                areaBroker.getScreenArea().find('.calculator-screen .expression').length,
                                1,
                                'The screen layout has been inserted'
                            );

                            calculator.setVariables(data.variables);
                            calculator.replace(data.expression);

                            assert.equal(
                                calculator.getExpression(),
                                data.expression,
                                `The expression should be set to ${data.expression}`
                            );
                            assert.equal($screen.text(), data.text, 'the expected text is set');
                        })
                        .catch(function (err) {
                            assert.ok(false, `Unexpected failure : ${err.message}`);
                        })
                        .then(function () {
                            plugin.destroy();
                            calculator.destroy();
                        });
                })
                .on('error', function (err) {
                    //eslint-disable-next-line no-console
                    console.error(err);
                    assert.ok(false, 'The operation should not fail!');
                    ready();
                });
        });

    QUnit.module('visual test');

    QUnit.test('screen', function (assert) {
        var ready = assert.async();
        var expression = '3*sqrt 3/2+(-2+x)*4-sin PI/2';
        var $container = $('#visual-test .calculator');
        var $input = $('#visual-test .input');
        calculatorBoardFactory($container, [simpleScreenPluginFactory])
            .on('ready', function () {
                var self = this;
                var areaBroker = this.getAreaBroker();
                assert.equal(
                    areaBroker.getScreenArea().find('.calculator-screen').length,
                    1,
                    'The screen layout has been inserted'
                );

                $input.val(expression);
                self.setVariable('x', '1').setExpression(expression);

                $('#visual-test').on('click', 'button', function () {
                    if (this.classList.contains('set')) {
                        self.setExpression($input.val());
                    } else if (this.classList.contains('execute')) {
                        self.evaluate();
                    }
                });

                ready();
            })
            .on('error', function (err) {
                //eslint-disable-next-line no-console
                console.error(err);
                assert.ok(false, 'The operation should not fail!');
                ready();
            });
    });
});
