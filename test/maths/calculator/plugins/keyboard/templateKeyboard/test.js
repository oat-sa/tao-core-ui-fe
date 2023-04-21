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
    'ui/maths/calculator/core/board',
    'ui/maths/calculator/plugins/keyboard/templateKeyboard/templateKeyboard'
], function ($, calculatorBoardFactory, templateKeyboardPluginFactory) {
    'use strict';

    QUnit.module('module');

    QUnit.test('templateKeyboard', assert => {
        const calculator = calculatorBoardFactory();

        assert.expect(3);

        assert.equal(typeof templateKeyboardPluginFactory, 'function', 'The plugin module exposes a function');
        assert.equal(
            typeof templateKeyboardPluginFactory(calculator),
            'object',
            'The plugin factory produces an instance'
        );
        assert.notStrictEqual(
            templateKeyboardPluginFactory(calculator),
            templateKeyboardPluginFactory(calculator),
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
            const plugin = templateKeyboardPluginFactory(calculator);
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
                const plugin = templateKeyboardPluginFactory(calculator, areaBroker);

                assert.expect(1);

                calculator
                    .on('plugin-install.templateKeyboard', () => {
                        assert.ok(true, 'The plugin has been installed');
                    })
                    .on('destroy', ready);

                plugin
                    .install()
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

    QUnit.test('init', assert => {
        const ready = assert.async();
        const $container = $('#fixture-init');
        const calculator = calculatorBoardFactory($container)
            .on('ready', () => {
                const areaBroker = calculator.getAreaBroker();
                const plugin = templateKeyboardPluginFactory(calculator, areaBroker);

                assert.expect(1);

                calculator
                    .on('plugin-init.templateKeyboard', () => {
                        assert.ok(plugin.getState('init'), 'The plugin has been initialized');
                    })
                    .on('destroy', ready);

                plugin
                    .install()
                    .then(() => plugin.init())
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

    QUnit.test('render', assert => {
        const ready = assert.async();
        const $container = $('#fixture-render');
        const calculator = calculatorBoardFactory($container)
            .on('ready', () => {
                const areaBroker = calculator.getAreaBroker();
                const plugin = templateKeyboardPluginFactory(calculator, areaBroker);

                assert.expect(29);

                calculator
                    .on('plugin-render.templateKeyboard', () => {
                        assert.ok(plugin.getState('ready'), 'The plugin has been rendered');
                    })
                    .on('destroy', ready);

                plugin
                    .install()
                    .then(() => plugin.init())
                    .then(() => plugin.render())
                    .then(() => {
                        assert.equal(
                            areaBroker.getKeyboardArea().find('.calculator-keyboard').length,
                            1,
                            'The keyboard layout has been inserted'
                        );
                        assert.equal(
                            areaBroker.getKeyboardArea().find('.calculator-keyboard .key').length,
                            25,
                            'The expected number of keyboard keys have been inserted'
                        );

                        assert.equal(
                            areaBroker.getKeyboardArea().find('.calculator-keyboard .key[data-param="NUM0"]').length,
                            1,
                            'The layout contains a key for NUM0'
                        );
                        assert.equal(
                            areaBroker.getKeyboardArea().find('.calculator-keyboard .key[data-param="NUM1"]').length,
                            1,
                            'The layout contains a key for NUM1'
                        );
                        assert.equal(
                            areaBroker.getKeyboardArea().find('.calculator-keyboard .key[data-param="NUM2"]').length,
                            1,
                            'The layout contains a key for NUM2'
                        );
                        assert.equal(
                            areaBroker.getKeyboardArea().find('.calculator-keyboard .key[data-param="NUM3"]').length,
                            1,
                            'The layout contains a key for NUM3'
                        );
                        assert.equal(
                            areaBroker.getKeyboardArea().find('.calculator-keyboard .key[data-param="NUM4"]').length,
                            1,
                            'The layout contains a key for NUM4'
                        );
                        assert.equal(
                            areaBroker.getKeyboardArea().find('.calculator-keyboard .key[data-param="NUM5"]').length,
                            1,
                            'The layout contains a key for NUM5'
                        );
                        assert.equal(
                            areaBroker.getKeyboardArea().find('.calculator-keyboard .key[data-param="NUM6"]').length,
                            1,
                            'The layout contains a key for NUM6'
                        );
                        assert.equal(
                            areaBroker.getKeyboardArea().find('.calculator-keyboard .key[data-param="NUM7"]').length,
                            1,
                            'The layout contains a key for NUM7'
                        );
                        assert.equal(
                            areaBroker.getKeyboardArea().find('.calculator-keyboard .key[data-param="NUM8"]').length,
                            1,
                            'The layout contains a key for NUM8'
                        );
                        assert.equal(
                            areaBroker.getKeyboardArea().find('.calculator-keyboard .key[data-param="NUM8"]').length,
                            1,
                            'The layout contains a key for NUM8'
                        );
                        assert.equal(
                            areaBroker.getKeyboardArea().find('.calculator-keyboard .key[data-param="NUM9"]').length,
                            1,
                            'The layout contains a key for NUM9'
                        );

                        assert.equal(
                            areaBroker.getKeyboardArea().find('.calculator-keyboard .key[data-param="LPAR"]').length,
                            1,
                            'The layout contains a key for LPAR'
                        );
                        assert.equal(
                            areaBroker.getKeyboardArea().find('.calculator-keyboard .key[data-param="RPAR"]').length,
                            1,
                            'The layout contains a key for RPAR'
                        );
                        assert.equal(
                            areaBroker.getKeyboardArea().find('.calculator-keyboard .key[data-param="DOT"]').length,
                            1,
                            'The layout contains a key for DOT'
                        );
                        assert.equal(
                            areaBroker.getKeyboardArea().find('.calculator-keyboard .key[data-param="ADD"]').length,
                            1,
                            'The layout contains a key for ADD'
                        );
                        assert.equal(
                            areaBroker.getKeyboardArea().find('.calculator-keyboard .key[data-param="SUB"]').length,
                            1,
                            'The layout contains a key for SUB'
                        );
                        assert.equal(
                            areaBroker.getKeyboardArea().find('.calculator-keyboard .key[data-param="MUL"]').length,
                            1,
                            'The layout contains a key for MUL'
                        );
                        assert.equal(
                            areaBroker.getKeyboardArea().find('.calculator-keyboard .key[data-param="DIV"]').length,
                            1,
                            'The layout contains a key for DIV'
                        );

                        assert.equal(
                            areaBroker.getKeyboardArea().find('.calculator-keyboard .key[data-param="POW"]').length,
                            1,
                            'The layout contains a key for POW'
                        );
                        assert.equal(
                            areaBroker.getKeyboardArea().find('.calculator-keyboard .key[data-param="POW NUM2"]')
                                .length,
                            1,
                            'The layout contains a key for POW NUM2'
                        );
                        assert.equal(
                            areaBroker.getKeyboardArea().find('.calculator-keyboard .key[data-param="POW NUM3"]')
                                .length,
                            1,
                            'The layout contains a key for POW NUM3'
                        );
                        assert.equal(
                            areaBroker.getKeyboardArea().find('.calculator-keyboard .key[data-param="SQRT"]').length,
                            1,
                            'The layout contains a key for SQRT'
                        );
                        assert.equal(
                            areaBroker.getKeyboardArea().find('.calculator-keyboard .key[data-param="CBRT"]').length,
                            1,
                            'The layout contains a key for CBRT'
                        );

                        assert.equal(
                            areaBroker.getKeyboardArea().find('.calculator-keyboard .key[data-command="clear"]').length,
                            1,
                            'The layout contains a key for clear'
                        );
                        assert.equal(
                            areaBroker.getKeyboardArea().find('.calculator-keyboard .key[data-command="reset"]').length,
                            1,
                            'The layout contains a key for reset'
                        );
                        assert.equal(
                            areaBroker.getKeyboardArea().find('.calculator-keyboard .key[data-command="execute"]')
                                .length,
                            1,
                            'The layout contains a key for execute'
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

    QUnit.test('render - failure', assert => {
        const ready = assert.async();
        const $container = $('#fixture-render');
        const calculator = calculatorBoardFactory($container)
            .on('ready', () => {
                const areaBroker = calculator.getAreaBroker();
                const plugin = templateKeyboardPluginFactory(calculator, areaBroker);
                plugin.setConfig({ layout: 'foo' });

                assert.expect(1);

                calculator
                    .on('plugin-render.templateKeyboard', () => {
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
                const plugin = templateKeyboardPluginFactory(calculator, areaBroker);

                assert.expect(3);

                calculator
                    .on('plugin-render.templateKeyboard', () => {
                        assert.ok(plugin.getState('ready'), 'The plugin has been rendered');
                    })
                    .on('destroy', ready);

                plugin
                    .install()
                    .then(() => plugin.init())
                    .then(() => plugin.render())
                    .then(() => {
                        assert.equal(
                            areaBroker.getKeyboardArea().find('.calculator-keyboard').length,
                            1,
                            'The keyboard layout has been inserted'
                        );

                        return plugin.destroy();
                    })
                    .then(() => {
                        assert.equal(
                            areaBroker.getKeyboardArea().find('.calculator-keyboard').length,
                            0,
                            'The keyboard layout has been removed'
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

    QUnit.test('use keys', assert => {
        const ready = assert.async();
        const $container = $('#fixture-keys');
        const calculator = calculatorBoardFactory($container)
            .on('ready', () => {
                const areaBroker = calculator.getAreaBroker();
                const plugin = templateKeyboardPluginFactory(calculator, areaBroker);

                assert.expect(15);

                calculator
                    .on('plugin-render.templateKeyboard', () => {
                        assert.ok(plugin.getState('ready'), 'The plugin has been rendered');
                    })
                    .on('destroy', ready);

                plugin
                    .install()
                    .then(() => plugin.init())
                    .then(() => plugin.render())
                    .then(() => {
                        assert.equal(
                            areaBroker.getKeyboardArea().find('.calculator-keyboard').length,
                            1,
                            'The keyboard layout has been inserted'
                        );
                        assert.equal(
                            areaBroker.getKeyboardArea().find('.calculator-keyboard .key').length,
                            25,
                            'The expected number of keyboard keys have been inserted'
                        );

                        assert.equal(calculator.getExpression(), '', 'The expression is empty');
                    })
                    .then(
                        () =>
                            new Promise(resolve => {
                                calculator
                                    .on('command-term', term => {
                                        calculator.off('command-term');

                                        assert.equal(term, 'NUM4', 'The term NUM4 has been used');
                                    })
                                    .on('expressionchange', expression => {
                                        calculator.off('expressionchange');

                                        assert.equal(expression, '4', 'The expression contains 4');

                                        resolve();
                                    });
                                areaBroker
                                    .getKeyboardArea()
                                    .find('.calculator-keyboard .key[data-param="NUM4"]')
                                    .click();
                            })
                    )
                    .then(
                        () =>
                            new Promise(resolve => {
                                calculator
                                    .on('command-term', term => {
                                        calculator.off('command-term');

                                        assert.equal(term, 'NUM2', 'The term NUM2 has been used');
                                    })
                                    .on('expressionchange', expression => {
                                        calculator.off('expressionchange');
                                        assert.equal(expression, '42', 'The expression contains 42');

                                        resolve();
                                    });
                                areaBroker
                                    .getKeyboardArea()
                                    .find('.calculator-keyboard .key[data-param="NUM2"]')
                                    .click();
                            })
                    )
                    .then(
                        () =>
                            new Promise(resolve => {
                                calculator
                                    .on('command-term', term => {
                                        calculator.off('command-term');

                                        assert.equal(term, 'ADD', 'The term ADD has been used');
                                    })
                                    .on('expressionchange', expression => {
                                        calculator.off('expressionchange');
                                        assert.equal(expression, '42+', 'The expression contains 42+');

                                        resolve();
                                    });
                                areaBroker
                                    .getKeyboardArea()
                                    .find('.calculator-keyboard .key[data-param="ADD"]')
                                    .click();
                            })
                    )
                    .then(
                        () =>
                            new Promise(resolve => {
                                calculator
                                    .on('command-term', term => {
                                        calculator.off('command-term');

                                        assert.equal(term, 'NUM3', 'The term NUM3 has been used');
                                    })
                                    .on('expressionchange', expression => {
                                        calculator.off('expressionchange');
                                        assert.equal(expression, '42+3', 'The expression contains 42+3');

                                        resolve();
                                    });
                                areaBroker
                                    .getKeyboardArea()
                                    .find('.calculator-keyboard .key[data-param="NUM3"]')
                                    .click();
                            })
                    )
                    .then(
                        () =>
                            new Promise(resolve => {
                                calculator.on('evaluate', result => {
                                    calculator.off('evaluate');

                                    assert.equal(
                                        result.value,
                                        '45',
                                        'The expression has been computed and the result is 45'
                                    );
                                    assert.equal(
                                        calculator.getExpression(),
                                        '42+3',
                                        'The expression still contains 42+3'
                                    );

                                    resolve();
                                });
                                areaBroker
                                    .getKeyboardArea()
                                    .find('.calculator-keyboard .key[data-command="execute"]')
                                    .click();
                            })
                    )
                    .then(
                        () =>
                            new Promise(resolve => {
                                calculator.on('clear', () => {
                                    calculator.off('clear');

                                    assert.equal(calculator.getExpression(), '', 'The expression has been cleared');

                                    resolve();
                                });
                                areaBroker
                                    .getKeyboardArea()
                                    .find('.calculator-keyboard .key[data-command="clear"]')
                                    .click();
                            })
                    )
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

    QUnit.module('visual test');

    $.fn.setCursorPosition = function setCursorPosition(pos) {
        if (this.setSelectionRange) {
            this.setSelectionRange(pos, pos);
        } else if (this.createTextRange) {
            const range = this.createTextRange();
            range.collapse(true);
            if (pos < 0) {
                pos = $(this).val().length + pos;
            }
            range.moveEnd('character', pos);
            range.moveStart('character', pos);
            range.select();
        }
    };

    QUnit.test('keyboard', assert => {
        const ready = assert.async();
        const $container = $('#visual-test');
        const $output = $('#visual-test .output input');
        const $input = $('#visual-test .input input');
        calculatorBoardFactory($container, [templateKeyboardPluginFactory])
            .on('ready', function onReady() {
                this.on('expressionchange', expression => $input.val(expression))
                    .on('positionchange', position => $input.setCursorPosition(position))
                    .on('result', result => $output.val(result.value))
                    .on('syntaxerror', err => $output.val(err))
                    .on('clear', () => $output.val(''));

                const areaBroker = this.getAreaBroker();
                assert.equal(
                    areaBroker.getKeyboardArea().find('.calculator-keyboard').length,
                    1,
                    'The keyboard layout has been inserted'
                );

                ready();
            })
            .on('error', err => {
                //eslint-disable-next-line no-console
                console.error(err);
                assert.ok(false, 'The operation should not fail!');
                ready();
            })
            .clear();
    });
});
