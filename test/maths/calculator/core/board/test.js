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
define(['jquery', 'ui/maths/calculator/core/plugin', 'ui/maths/calculator/core/board'], function (
    $,
    pluginFactory,
    calculatorBoardFactory
) {
    'use strict';

    const builtInCommands = [
        'clear',
        'reset',
        'execute',
        'var',
        'term',
        'sign',
        'degree',
        'radian',
        'remind',
        'memorize',
        'forget',
        'moveLeft',
        'moveRight',
        'deleteLeft',
        'deleteRight',
        'historyClear',
        'historyUp',
        'historyDown'
    ];

    QUnit.module('Factory');

    QUnit.test('module', assert => {
        assert.expect(3);
        assert.equal(typeof calculatorBoardFactory, 'function', 'The module exposes a function');
        assert.equal(typeof calculatorBoardFactory('#fixture-api'), 'object', 'The factory produces an object');
        assert.notStrictEqual(
            calculatorBoardFactory('#fixture-api'),
            calculatorBoardFactory('#fixture-api'),
            'The factory provides a different object on each call'
        );
    });

    QUnit.cases
        .init([
            { title: 'init' },
            { title: 'destroy' },
            { title: 'render' },
            { title: 'setSize' },
            { title: 'show' },
            { title: 'hide' },
            { title: 'enable' },
            { title: 'disable' },
            { title: 'is' },
            { title: 'setState' },
            { title: 'getContainer' },
            { title: 'getElement' },
            { title: 'getTemplate' },
            { title: 'setTemplate' },
            { title: 'getConfig' }
        ])
        .test('inherited API ', (data, assert) => {
            const instance = calculatorBoardFactory('#fixture-api');
            assert.expect(1);
            assert.equal(typeof instance[data.title], 'function', `The instance exposes a "${data.title}" function`);
        });

    QUnit.cases
        .init([{ title: 'on' }, { title: 'off' }, { title: 'trigger' }, { title: 'spread' }])
        .test('event API ', (data, assert) => {
            const instance = calculatorBoardFactory('#fixture-api');
            assert.expect(1);
            assert.equal(typeof instance[data.title], 'function', `The instance exposes a "${data.title}" function`);
        });

    QUnit.cases
        .init([
            { title: 'getExpression' },
            { title: 'setExpression' },
            { title: 'getPosition' },
            { title: 'setPosition' },
            { title: 'getTokens' },
            { title: 'getToken' },
            { title: 'getTokenIndex' },
            { title: 'getTokenizer' },
            { title: 'getVariable' },
            { title: 'hasVariable' },
            { title: 'setVariable' },
            { title: 'deleteVariable' },
            { title: 'getVariables' },
            { title: 'setVariables' },
            { title: 'deleteVariables' },
            { title: 'setLastResult' },
            { title: 'getLastResult' },
            { title: 'getCommand' },
            { title: 'hasCommand' },
            { title: 'getCommands' },
            { title: 'setCommand' },
            { title: 'deleteCommand' },
            { title: 'useTerm' },
            { title: 'useTerms' },
            { title: 'useVariable' },
            { title: 'useCommand' },
            { title: 'replace' },
            { title: 'insert' },
            { title: 'clear' },
            { title: 'evaluate' },
            { title: 'runPlugins' },
            { title: 'getPlugins' },
            { title: 'getPlugin' },
            { title: 'getAreaBroker' },
            { title: 'setupMathsEvaluator' },
            { title: 'getMathsEvaluator' }
        ])
        .test('calculatorBoard API ', (data, assert) => {
            const instance = calculatorBoardFactory('#fixture-api');
            assert.expect(1);
            assert.equal(typeof instance[data.title], 'function', `The instance exposes a "${data.title}" function`);
        });

    QUnit.module('Life cycle');

    QUnit.test('init', assert => {
        const ready = assert.async();
        const $container = $('#fixture-init');
        const expression = '.1+.2';
        const position = expression.length;
        const instance = calculatorBoardFactory($container, null, { expression, position });

        assert.expect(3);

        instance
            .after('init', function onInit() {
                assert.equal(this, instance, 'The instance has been initialized');
                assert.equal(this.getExpression(), expression, 'The expression is initialized');
                assert.equal(this.getPosition(), position, 'The expression is initialized');
            })
            .after('render', function onRender() {
                this.destroy();
            })
            .on('destroy', ready)
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

        const plugin1 = pluginFactory({
            name: 'plugin1',
            install() {
                assert.ok(true, 'Plugin1 has been installed');
            },
            init() {
                assert.ok(true, 'Plugin1 has been initialized');
            },
            render() {
                assert.ok(true, 'Plugin1 has been rendered');
            }
        });

        assert.expect(17);

        assert.equal($container.children().length, 0, 'The container is empty');

        const instance = calculatorBoardFactory($container, [plugin1]);
        instance
            .on('init', function onInit() {
                assert.equal(this, instance, 'The instance has been initialized');
                assert.equal(typeof areaBroker, 'undefined', 'The area broker is not yet created');
            })
            .on('ready', function onReady() {
                const areaBroker = this.getAreaBroker();

                assert.equal($container.children().length, 1, 'The container contains an element');
                assert.ok($container.children().first().is('.calculator'), 'The expected element is rendered');
                assert.equal(
                    $container.children().get(0),
                    this.getElement().get(0),
                    'The container contains the right element'
                );

                assert.equal(typeof areaBroker, 'object', 'The area broker is created');
                assert.equal(
                    areaBroker.getContainer(),
                    this.getElement(),
                    'The area broker is built on top of the element'
                );

                assert.equal(
                    typeof areaBroker.getScreenArea,
                    'function',
                    'The area broker has a getScreenArea() method'
                );
                assert.equal(typeof areaBroker.getInputArea, 'function', 'The area broker has a getInputArea() method');
                assert.equal(
                    typeof areaBroker.getKeyboardArea,
                    'function',
                    'The area broker has a getKeyboardArea() method'
                );

                assert.equal(
                    areaBroker.getScreenArea().get(0),
                    $container.find('.screen').get(0),
                    'The screen area is rendered'
                );
                assert.equal(
                    areaBroker.getInputArea().get(0),
                    $container.find('.input').get(0),
                    'The input area is rendered'
                );
                assert.equal(
                    areaBroker.getKeyboardArea().get(0),
                    $container.find('.keyboard').get(0),
                    'The keyboard area is rendered'
                );

                this.destroy();
            })
            .on('destroy', ready)
            .on('error', err => {
                //eslint-disable-next-line no-console
                console.error(err);
                assert.ok(false, 'The operation should not fail!');
                ready();
            });
    });

    QUnit.test('destroy', assert => {
        const ready = assert.async();
        const $container = $('#fixture-destroy');
        const plugin1 = pluginFactory({
            name: 'plugin1',
            install() {
                assert.ok(true, 'Plugin1 has been installed');
            },
            init() {
                assert.ok(true, 'Plugin1 has been initialized');
            },
            render() {
                assert.ok(true, 'Plugin1 has been rendered');
            },
            destroy() {
                assert.ok(true, 'Plugin1 has been destroyed');
            }
        });

        assert.expect(11);

        assert.equal($container.children().length, 0, 'The container is empty');

        const instance = calculatorBoardFactory($container, [plugin1]);
        instance
            .on('init', function onInit() {
                assert.equal(this, instance, 'The instance has been initialized');
                assert.equal(typeof areaBroker, 'undefined', 'The area broker is not yet created');
            })
            .after('ready', function onReady() {
                assert.equal($container.children().length, 1, 'The container contains an element');
                assert.equal(typeof this.getAreaBroker(), 'object', 'The area broker is created');

                this.destroy();
            })
            .after('destroy', function onDestroy() {
                assert.equal($container.children().length, 0, 'The container is now empty');
                assert.equal(this.getAreaBroker(), null, 'The area broker is destroyed');

                ready();
            })
            .on('error', err => {
                //eslint-disable-next-line no-console
                console.error(err);
                assert.ok(false, 'The operation should not fail!');
                ready();
            });
    });

    QUnit.module('API');

    QUnit.test('plugins', assert => {
        const ready = assert.async();
        const $container = $('#fixture-plugins');
        const config = {
            plugins: {
                plugin1: {
                    foo: 'bar'
                },
                plugin2: {
                    bar: 'foo'
                }
            }
        };
        const plugins = [
            pluginFactory({
                name: 'plugin1',
                install() {
                    assert.ok(true, 'Plugin1 has been installed');
                },
                init() {
                    assert.ok(true, 'Plugin1 has been initialized');
                },
                render() {
                    assert.ok(true, 'Plugin1 has been rendered');
                },
                destroy() {
                    assert.ok(true, 'Plugin1 has been destroyed');
                },
                enable() {
                    assert.ok(true, 'Plugin1 has been enabled');
                },
                disable() {
                    assert.ok(true, 'Plugin1 has been disabled');
                }
            }),
            pluginFactory({
                name: 'plugin2',
                install() {
                    assert.ok(true, 'Plugin2 has been installed');
                },
                init() {
                    assert.ok(true, 'Plugin2 has been initialized');
                },
                render() {
                    assert.ok(true, 'Plugin2 has been rendered');
                },
                destroy() {
                    assert.ok(true, 'Plugin2 has been destroyed');
                },
                enable() {
                    assert.ok(true, 'Plugin2 has been enabled');
                },
                disable() {
                    assert.ok(true, 'Plugin2 has been disabled');
                }
            })
        ];

        assert.expect(22);

        assert.equal($container.children().length, 0, 'The container is empty');

        const instance = calculatorBoardFactory($container, plugins, config);
        instance
            .on('init', function onInit() {
                assert.equal(this, instance, 'The instance has been initialized');
            })
            .on('ready', function onReady() {
                assert.equal($container.children().length, 1, 'The container contains an element');
                assert.equal(this.getPlugins().length, 2, 'Plugins are registered');
                assert.equal(this.getPlugin('plugin1').getName(), 'plugin1', 'Plugin1 is registered');
                assert.equal(this.getPlugin('plugin2').getName(), 'plugin2', 'Plugin2 is registered');
                assert.deepEqual(
                    this.getPlugin('plugin1').getConfig(),
                    config.plugins.plugin1,
                    'Plugin1 has the expected config'
                );
                assert.deepEqual(
                    this.getPlugin('plugin2').getConfig(),
                    config.plugins.plugin2,
                    'Plugin2 has the expected config'
                );

                this.runPlugins('disable')
                    .then(() => {
                        assert.ok(
                            this.getPlugins().every(plugin => !plugin.getState('enabled')),
                            'Plugins have been disabled'
                        );
                        return this.runPlugins('enable');
                    })
                    .then(() => {
                        assert.ok(
                            this.getPlugins().every(plugin => plugin.getState('enabled')),
                            'Plugins have been enabled'
                        );
                        return this.destroy();
                    });
            })
            .after('destroy', ready)
            .on('error', err => {
                //eslint-disable-next-line no-console
                console.error(err);
                assert.ok(false, 'The operation should not fail!');
                ready();
            });
    });

    QUnit.test('plugins - failure', assert => {
        const ready = assert.async();
        const $container = $('#fixture-plugins');
        const pluginError = new TypeError('Should break here');
        const plugins = [
            pluginFactory({
                name: 'plugin1',
                install() {
                    assert.ok(true, 'Plugin1 has been installed');
                },
                init() {
                    assert.ok(true, 'Plugin1 has been initialized');
                },
                render() {
                    throw pluginError;
                },
                destroy() {
                    assert.ok(true, 'Plugin1 has been destroyed');
                }
            }),
            pluginFactory({
                name: 'plugin2',
                install() {
                    assert.ok(true, 'Plugin2 has been installed');
                },
                init() {
                    assert.ok(true, 'Plugin2 has been initialized');
                },
                render() {
                    assert.ok(false, 'Should not reach that point!');
                },
                destroy() {
                    assert.ok(true, 'Plugin2 has been destroyed');
                }
            })
        ];

        assert.expect(9);

        assert.equal($container.children().length, 0, 'The container is empty');

        const instance = calculatorBoardFactory($container, plugins);
        instance
            .on('init', function onInit() {
                assert.equal(this, instance, 'The instance has been initialized');
            })
            .on('error', function onError(err) {
                assert.equal(err, pluginError, 'The error has been caught!');
                this.destroy();
            })
            .after('destroy', ready);
    });

    QUnit.test('expression', assert => {
        const ready = assert.async();
        const $container = $('#fixture-expression');

        assert.expect(7);

        assert.equal($container.children().length, 0, 'The container is empty');

        const instance = calculatorBoardFactory($container);
        instance
            .on('init', function onInit() {
                const newExpression = '3+1';
                assert.equal(this, instance, 'The instance has been initialized');
                assert.equal(this.getExpression(), '', 'The expression is empty');
                this.setExpression();
                assert.equal(this.getExpression(), '', 'The expression is still empty');
                return new Promise(resolve => {
                    this.on('expressionchange', expression => {
                        assert.equal(expression, newExpression, 'New expression as been provided');
                        assert.equal(this.getExpression(), newExpression, 'New expression has been set');
                        resolve();
                    });
                    this.setExpression(newExpression);
                });
            })
            .after('ready', function onReady() {
                assert.equal($container.children().length, 1, 'The container contains an element');
                this.destroy();
            })
            .after('destroy', ready)
            .on('error', err => {
                //eslint-disable-next-line no-console
                console.error(err);
                assert.ok(false, 'The operation should not fail!');
                ready();
            });
    });

    QUnit.test('position', assert => {
        const ready = assert.async();
        const $container = $('#fixture-position');

        assert.expect(10);

        assert.equal($container.children().length, 0, 'The container is empty');

        const instance = calculatorBoardFactory($container);
        instance
            .on('init', function onInit() {
                const newExpression = '3+1';
                const newPosition = 2;
                assert.equal(this, instance, 'The instance has been initialized');
                assert.equal(this.getExpression(), '', 'The expression is empty');
                assert.equal(this.getPosition(), 0, 'The position is 0');
                this.setPosition();
                assert.equal(this.getPosition(), 0, 'The position is still 0');
                return new Promise(resolve => {
                    this.on('positionchange', position => {
                        this.off('positionchange');

                        assert.equal(position, newPosition, 'New position has been provided');
                        assert.equal(this.getPosition(), newPosition, 'New position has been set');

                        this.setPosition(-1);
                        assert.equal(this.getPosition(), 0, 'Negative position has been fixed');

                        this.setPosition(10);
                        assert.equal(this.getPosition(), newExpression.length, 'Too big position has been fixed');

                        resolve();
                    });
                    this.replace(newExpression, newPosition);
                });
            })
            .after('ready', function onReady() {
                assert.equal($container.children().length, 1, 'The container contains an element');
                this.destroy();
            })
            .after('destroy', ready)
            .on('error', err => {
                //eslint-disable-next-line no-console
                console.error(err);
                assert.ok(false, 'The operation should not fail!');
                ready();
            });
    });

    QUnit.test('tokens', assert => {
        const ready = assert.async();
        const $container = $('#fixture-tokens');

        assert.expect(50);

        assert.equal($container.children().length, 0, 'The container is empty');

        const instance = calculatorBoardFactory($container);
        instance
            .on('init', function onInit() {
                assert.equal(this, instance, 'The instance has been initialized');
                assert.equal(this.getExpression(), '', 'The expression is empty');
                assert.equal(this.getPosition(), 0, 'The position is 0');

                assert.deepEqual(this.getTokens(), [], 'No token for now');
                assert.equal(this.getTokenIndex(), 0, 'Token index is 0');
                assert.equal(this.getToken(), null, 'There is no token for now');

                this.setExpression('(.1 + .2) * 10^8');

                let tokens = this.getTokens();
                assert.ok(Array.isArray(tokens), 'Got a lis of tokens');
                assert.equal(tokens.length, 12, 'Found the expected number of tokens');
                assert.equal(tokens[0].type, 'LPAR', 'The expected term is found at position 0');
                assert.equal(tokens[0].offset, 0, 'The expected term is found at offset 0');
                assert.equal(tokens[1].type, 'DOT', 'The expected term is found at position 1');
                assert.equal(tokens[1].offset, 1, 'The expected term is found at offset 1');
                assert.equal(tokens[2].type, 'NUM1', 'The expected term is found at position 2');
                assert.equal(tokens[2].offset, 2, 'The expected term is found at offset 2');
                assert.equal(tokens[3].type, 'ADD', 'The expected term is found at position 3');
                assert.equal(tokens[3].offset, 4, 'The expected term is found at offset 4');
                assert.equal(tokens[4].type, 'DOT', 'The expected term is found at position 4');
                assert.equal(tokens[4].offset, 6, 'The expected term is found at offset 6');
                assert.equal(tokens[5].type, 'NUM2', 'The expected term is found at position 5');
                assert.equal(tokens[5].offset, 7, 'The expected term is found at offset 7');
                assert.equal(tokens[6].type, 'RPAR', 'The expected term is found at position 6');
                assert.equal(tokens[6].offset, 8, 'The expected term is found at offset 8');
                assert.equal(tokens[7].type, 'MUL', 'The expected term is found at position 7');
                assert.equal(tokens[7].offset, 10, 'The expected term is found at offset 10');
                assert.equal(tokens[8].type, 'NUM1', 'The expected term is found at position 8');
                assert.equal(tokens[8].offset, 12, 'The expected term is found at offset 12');
                assert.equal(tokens[9].type, 'NUM0', 'The expected term is found at position 9');
                assert.equal(tokens[9].offset, 13, 'The expected term is found at offset 13');
                assert.equal(tokens[10].type, 'POW', 'The expected term is found at position 10');
                assert.equal(tokens[10].offset, 14, 'The expected term is found at offset 14');
                assert.equal(tokens[11].type, 'NUM8', 'The expected term is found at position 11');
                assert.equal(tokens[11].offset, 15, 'The expected term is found at offset 15');

                assert.equal(typeof this.getTokenizer(), 'object', 'The tokenizer is provided');
                assert.equal(typeof this.getTokenizer().tokenize, 'function', 'The provided tokenizer is valid');
                assert.deepEqual(
                    this.getTokens(),
                    this.getTokenizer().tokenize(this.getExpression()),
                    'The tokenizer works as expected'
                );

                this.setPosition(7);
                assert.equal(this.getTokenIndex(), 5, 'Token index at position 7 is 5');
                assert.equal(this.getToken().type, 'NUM2', 'Token is NUM2');

                this.setPosition(0);
                assert.equal(this.getTokenIndex(), 0, 'Token index at position 0 is 0');
                assert.equal(this.getToken().type, 'LPAR', 'Token is LPAR');

                this.setPosition(16);
                assert.equal(this.getTokenIndex(), 11, 'Token index at position 16 is 11');
                assert.equal(this.getToken().type, 'NUM8', 'Token is NUM8');

                this.setExpression(' 3+4 *$foo + sinh 1');
                tokens = this.getTokens();
                assert.ok(Array.isArray(tokens), 'Got a lis of terms');
                assert.equal(tokens.length, 5, 'The expression has been tokenized in 5 terms');
                assert.equal(tokens[4].type, 'syntaxError', 'The expected error has been found');
                assert.equal(tokens[4].offset, 6, 'The expected error has been found at offset 6');

                this.setPosition(7);
                assert.equal(this.getTokenIndex(), 4, 'Token index at position 7 is 4');
                assert.equal(this.getToken().type, 'syntaxError', 'Token is syntaxError');

                this.setPosition(0);
                assert.equal(this.getTokenIndex(), 0, 'Token index at position 0 is 0');
                assert.equal(this.getToken().type, 'NUM3', 'Token is NUM3');
            })
            .after('ready', function onReady() {
                this.destroy();
            })
            .after('destroy', ready)
            .on('error', err => {
                //eslint-disable-next-line no-console
                console.error(err);
                assert.ok(false, 'The operation should not fail!');
                ready();
            });
    });

    QUnit.test('command', assert => {
        const ready = assert.async();
        const $container = $('#fixture-command');
        const commandName = 'FOO';
        const commandAction = () => {};

        assert.expect(15);

        assert.equal($container.children().length, 0, 'The container is empty');

        const instance = calculatorBoardFactory($container);
        instance
            .on('init', function onInit() {
                assert.equal(this, instance, 'The instance has been initialized');
                assert.equal(this.getExpression(), '', 'The expression is empty');
                return new Promise(resolve => {
                    assert.equal(
                        typeof this.getCommand(commandName),
                        'undefined',
                        `The command ${commandName} does not exist`
                    );
                    assert.ok(!this.hasCommand(commandName), `The command ${commandName} is not registered`);
                    assert.deepEqual(
                        Object.keys(this.getCommands()),
                        builtInCommands,
                        'Only builtin commands registered'
                    );
                    this.on('command', name => {
                        assert.equal(name, commandName, `Command ${commandName} called`);
                    });
                    this.on('commandadd', name => {
                        assert.equal(name, commandName, `Command ${commandName} added`);
                        assert.ok(this.hasCommand(commandName), `The command ${commandName} is now registered`);
                        assert.deepEqual(
                            this.getCommand(commandName),
                            commandAction,
                            `A descriptor is defined for command ${commandName}`
                        );
                        assert.deepEqual(
                            Object.keys(this.getCommands()),
                            [...builtInCommands, commandName],
                            'Can get the list of registered commands'
                        );
                    });
                    this.on('commanddelete', name => {
                        assert.equal(name, commandName, `Command ${commandName} deleted`);
                        assert.equal(
                            typeof this.getCommand(commandName),
                            'undefined',
                            `The command ${commandName} does not exist anymore`
                        );
                        assert.ok(!this.hasCommand(commandName), `The command ${commandName} is not registered`);

                        resolve();
                    });
                    this.setCommand(commandName, commandAction);
                    this.useCommand(commandName);
                    this.deleteCommand(commandName);
                });
            })
            .after('ready', function onReady() {
                assert.equal($container.children().length, 1, 'The container contains an element');
                this.destroy();
            })
            .after('destroy', ready)
            .on('error', err => {
                //eslint-disable-next-line no-console
                console.error(err);
                assert.ok(false, 'The operation should not fail!');
                ready();
            });
    });

    QUnit.test('variable', assert => {
        const ready = assert.async();
        const $container = $('#fixture-variable');
        const variableName = 'x';
        const variableValue = '42';

        assert.expect(17);

        assert.equal($container.children().length, 0, 'The container is empty');

        const instance = calculatorBoardFactory($container);
        instance
            .on('init', function onInit() {
                assert.equal(this, instance, 'The instance has been initialized');
                assert.equal(this.getExpression(), '', 'The expression is empty');
                return new Promise(resolve => {
                    assert.ok(!this.hasVariable(variableName), `The variable ${variableName} is not registered`);
                    assert.equal(
                        typeof this.getVariable(variableName),
                        'undefined',
                        `The variable ${variableName} does not exist`
                    );
                    this.on('variableadd', (name, value) => {
                        assert.equal(name, variableName, `Variable ${variableName} added`);
                        assert.equal(typeof value, 'object', `Value descriptor of variable ${variableName} provided`);
                        assert.equal(
                            value.expression,
                            variableValue,
                            `Expression of variable ${variableName} provided`
                        );
                        assert.equal(value.value, variableValue, `Value of variable ${variableName} provided`);
                        assert.equal(
                            typeof this.getVariable(variableName),
                            'object',
                            `The variable now ${variableName} exists`
                        );
                        assert.equal(
                            this.getVariable(variableName).expression,
                            variableValue,
                            `The expression of variable ${variableName} is available`
                        );
                        assert.equal(
                            this.getVariable(variableName).value,
                            variableValue,
                            `The value of variable ${variableName} is available`
                        );
                        assert.ok(this.hasVariable(variableName), `The variable ${variableName} is registered`);
                    });
                    this.on('variabledelete', name => {
                        assert.equal(name, variableName, `Variable ${variableName} deleted`);
                        assert.equal(
                            typeof this.getVariable(variableName),
                            'undefined',
                            `The variable ${variableName} does not exist anymore`
                        );
                        assert.ok(
                            !this.hasVariable(variableName),
                            `The variable ${variableName} is not registered anymore`
                        );

                        resolve();
                    });
                    this.setVariable(variableName, variableValue);
                    this.deleteVariable(variableName);
                });
            })
            .after('ready', function onReady() {
                assert.equal($container.children().length, 1, 'The container contains an element');
                this.destroy();
            })
            .after('destroy', ready)
            .on('error', err => {
                //eslint-disable-next-line no-console
                console.error(err);
                assert.ok(false, 'The operation should not fail!');
                ready();
            });
    });

    QUnit.test('variables', assert => {
        const ready = assert.async();
        const defaultVariables = {
            ans: {
                expression: '0',
                result: 0,
                value: 0,
                variables: void 0
            },
            mem: {
                expression: '0',
                result: 0,
                value: 0,
                variables: void 0
            }
        };
        const expectedVariables = {
            foo: 'bar',
            x: '42',
            y: '3'
        };
        const expectedResults = {
            ans: {
                expression: '0',
                result: 0,
                value: 0,
                variables: void 0
            },
            mem: {
                expression: '0',
                result: 0,
                value: 0,
                variables: void 0
            },
            foo: {
                expression: 'bar',
                result: 0,
                value: 0,
                variables: void 0
            },
            x: {
                expression: '42',
                result: 42,
                value: 42,
                variables: void 0
            },
            y: {
                expression: '3',
                result: 3,
                value: 3,
                variables: void 0
            }
        };
        const $container = $('#fixture-variables');

        assert.expect(17);

        assert.equal($container.children().length, 0, 'The container is empty');

        const instance = calculatorBoardFactory($container);
        instance
            .on('init', function onInit() {
                assert.equal(this, instance, 'The instance has been initialized');
                assert.equal(this.getExpression(), '', 'The expression is empty');
                return new Promise(resolve => {
                    assert.deepEqual(this.getVariables(), defaultVariables, 'Only default variables set for now');
                    this.on('variableadd.set', (name, value) => {
                        assert.equal(typeof expectedVariables[name], 'string', `Variable ${name} added`);
                        assert.equal(value.expression, expectedVariables[name], `Value of variable ${name} provided`);
                        assert.equal(
                            this.getVariable(name).expression,
                            expectedVariables[name],
                            `The variable ${name} now exists`
                        );
                    });
                    this.on('variableclear', name => {
                        this.off('.set');
                        assert.equal(name, null, 'Variables deleted');
                        assert.deepEqual(this.getVariables(), {}, 'No variable set anymore');

                        resolve();
                    });
                    this.setVariables(expectedVariables);

                    assert.deepEqual(this.getVariables(), expectedResults, 'All expected variables now set');
                    this.deleteVariables();
                });
            })
            .after('ready', function onReady() {
                assert.equal($container.children().length, 1, 'The container contains an element');
                this.destroy();
            })
            .after('destroy', ready)
            .on('error', err => {
                //eslint-disable-next-line no-console
                console.error(err);
                assert.ok(false, 'The operation should not fail!');
                ready();
            });
    });

    QUnit.test('useTerm - success', assert => {
        const ready = assert.async();
        const $container = $('#fixture-useterm');

        assert.expect(22);

        assert.equal($container.children().length, 0, 'The container is empty');

        const instance = calculatorBoardFactory($container);
        instance
            .on('init', function onInit() {
                assert.equal(this, instance, 'The instance has been initialized');
            })
            .after('ready', function onReady() {
                assert.equal($container.children().length, 1, 'The container contains an element');

                assert.equal(this.getExpression(), '', 'The expression is empty');

                const assertTerm = (term, position, expression) =>
                    new Promise(resolve => {
                        this.on(`termadd-${term}`, () => {
                            this.off(`termadd-${term}`);
                            assert.ok(true, `The term ${term} has been added`);
                            assert.equal(this.getExpression(), expression, `The expression is ${expression}`);
                            assert.equal(this.getPosition(), position, `The position is ${position}`);
                            resolve();
                        });
                        this.useTerm(term);
                    });

                return Promise.resolve()
                    .then(() => assertTerm('NUM3', 1, '3'))
                    .then(() => assertTerm('ADD', 2, '3+'))
                    .then(() => assertTerm('SIN', 5, '3+sin'))
                    .then(() => assertTerm('NUM4', 7, '3+sin 4'))
                    .then(() => assertTerm('NUM2', 8, '3+sin 42'))
                    .then(() => this.setPosition(6))
                    .then(() => assertTerm('SUB', 7, '3+sin -42'))
                    .then(() => this.destroy());
            })
            .after('destroy', ready)
            .on('error', err => {
                //eslint-disable-next-line no-console
                console.error(err);
                assert.ok(false, 'The operation should not fail!');
                ready();
            });
    });

    QUnit.test('useTerm - failure', assert => {
        const ready = assert.async();
        const $container = $('#fixture-useterm');

        assert.expect(10);

        assert.equal($container.children().length, 0, 'The container is empty');

        const instance = calculatorBoardFactory($container);
        instance
            .on('init', function onInit() {
                assert.equal(this, instance, 'The instance has been initialized');
                assert.equal(this.getExpression(), '', 'The expression is empty');
            })
            .after('ready', function onReady() {
                assert.equal($container.children().length, 1, 'The container contains an element');

                const expression = '4';
                const position = 1;

                return Promise.resolve()
                    .then(
                        () =>
                            new Promise(resolve => {
                                const term = 'NUM4';

                                this.on(`termadd-${term}`, () => {
                                    this.off(`termadd-${term}`);
                                    assert.ok(true, `The term ${term} has been added`);
                                    assert.equal(this.getExpression(), expression, `The expression is ${expression}`);
                                    assert.equal(this.getPosition(), position, `The position is ${position}`);
                                    resolve();
                                });
                                this.useTerm(term);
                            })
                    )
                    .then(
                        () =>
                            new Promise(resolve => {
                                const term = 'foo';
                                this.on(`termadd-${term}`, () => {
                                    this.off(`termadd-${term}`);
                                    assert.ok(false, `The term ${term} should not be added`);
                                    resolve();
                                });
                                this.off('error');
                                this.on('error', err => {
                                    this.off('error');
                                    assert.ok(err instanceof TypeError, 'The term cannot be added');
                                    assert.equal(this.getExpression(), expression, 'Expression did not change');
                                    assert.equal(this.getPosition(), position, 'Position did not change');
                                    resolve();
                                });
                                this.useTerm(term);
                            })
                    )
                    .then(() => this.destroy());
            })
            .after('destroy', ready)
            .on('error', err => {
                //eslint-disable-next-line no-console
                console.error(err);
                assert.ok(false, 'The operation should not fail!');
                ready();
            });
    });

    QUnit.test('useTerms - success', assert => {
        const ready = assert.async();
        const $container = $('#fixture-useterms');

        assert.expect(6);

        assert.equal($container.children().length, 0, 'The container is empty');

        const instance = calculatorBoardFactory($container);
        instance
            .on('init', function onInit() {
                assert.equal(this, instance, 'The instance has been initialized');
            })
            .after('ready', function onReady() {
                assert.equal($container.children().length, 1, 'The container contains an element');
                assert.equal(this.getExpression(), '', 'The expression is empty');

                this.useTerms('NUM4 SUB NUM2');
                assert.equal(this.getExpression(), '4-2', 'The expression is updated');
                assert.equal(this.getPosition(), '3', 'The position is updated');
                this.destroy();
            })
            .after('destroy', ready)
            .on('error ', err => {
                //eslint-disable-next-line no-console
                console.error(err);
                assert.ok(false, 'The operation should not fail!');
                ready();
            });
    });

    QUnit.test('useTerms - failure', assert => {
        const ready = assert.async();
        const $container = $('#fixture-useterms');

        assert.expect(9);

        assert.equal($container.children().length, 0, 'The container is empty');

        const instance = calculatorBoardFactory($container);
        instance
            .on('init', function onInit() {
                assert.equal(this, instance, 'The instance has been initialized');
            })
            .after('ready', function onReady() {
                assert.equal($container.children().length, 1, 'The container contains an element');
                assert.equal(this.getExpression(), '', 'The expression is empty');

                return Promise.resolve()
                    .then(
                        () =>
                            new Promise(resolve => {
                                this.off('error');
                                this.on('error.foo', function (e) {
                                    this.off('.foo');

                                    assert.ok(e instanceof TypeError, 'The term foo cannot be added');
                                    assert.equal(this.getExpression(), '4', 'Expression did not change');
                                    assert.equal(this.getPosition(), 1, 'Position did not change');

                                    resolve();
                                });
                                this.useTerms('NUM4 foo');
                            })
                    )
                    .then(() => {
                        assert.equal(this.getExpression(), '4', 'The expression is updated');
                        assert.equal(this.getPosition(), '1', 'The position is updated');
                        this.destroy();
                    });
            })
            .after('destroy', ready)
            .on('error', err => {
                //eslint-disable-next-line no-console
                console.error(err);
                assert.ok(false, 'The operation should not fail!');
                ready();
            });
    });

    QUnit.test('useVariable - success', assert => {
        const ready = assert.async();
        const defaultVariables = {
            ans: {
                expression: '0',
                result: 0,
                value: 0,
                variables: void 0
            },
            mem: {
                expression: '0',
                result: 0,
                value: 0,
                variables: void 0
            }
        };
        const expectedVariables = {
            foo: 'bar',
            x: '42',
            y: '3'
        };
        const expectedResults = {
            ans: {
                expression: '0',
                result: 0,
                value: 0,
                variables: void 0
            },
            mem: {
                expression: '0',
                result: 0,
                value: 0,
                variables: void 0
            },
            foo: {
                expression: 'bar',
                result: 0,
                value: 0,
                variables: void 0
            },
            x: {
                expression: '42',
                result: 42,
                value: 42,
                variables: void 0
            },
            y: {
                expression: '3',
                result: 3,
                value: 3,
                variables: void 0
            }
        };
        const $container = $('#fixture-usevariable');

        assert.expect(24);

        assert.equal($container.children().length, 0, 'The container is empty');

        const instance = calculatorBoardFactory($container);
        instance
            .on('init', function onInit() {
                assert.equal(this, instance, 'The instance has been initialized');
            })
            .after('ready', function onReady() {
                assert.equal($container.children().length, 1, 'The container contains an element');
                assert.equal(this.getExpression(), '', 'The expression is empty');
                assert.deepEqual(this.getVariables(), defaultVariables, 'Only default variables set for now');

                this.setVariables(expectedVariables);
                assert.deepEqual(this.getVariables(), expectedResults, 'All expected variables now set');

                const assertVariable = (variable, position, expression) =>
                    new Promise(resolve => {
                        this.on(`termadd-VAR_${variable.toUpperCase()}`, term => {
                            this.off(`termadd-VAR_${variable.toUpperCase()}`);
                            assert.ok(true, `The variable ${variable} has been added`);
                            assert.equal(typeof term, 'object', 'A term has been added');
                            assert.equal(term.label, variable, 'The expected term has been added');
                            assert.equal(term.value, variable, 'The expected value has been added');
                            assert.equal(this.getExpression(), expression, `The expression is ${expression}`);
                            assert.equal(this.getPosition(), position, `The position is ${position}`);
                            resolve();
                        });
                        this.useVariable(variable);
                    });

                return Promise.resolve()
                    .then(() => assertVariable('x', 1, 'x'))
                    .then(() => this.useTerm('ADD'))
                    .then(() => assertVariable('y', 3, 'x+y'))
                    .then(() => this.useTerm('MUL'))
                    .then(() => assertVariable('foo', 7, 'x+y*foo'))
                    .then(() => this.destroy());
            })
            .after('destroy', ready)
            .on('error', err => {
                //eslint-disable-next-line no-console
                console.error(err);
                assert.ok(false, 'The operation should not fail!');
                ready();
            });
    });

    QUnit.test('useVariable - failure', assert => {
        const ready = assert.async();
        const defaultVariables = {
            ans: {
                expression: '0',
                result: 0,
                value: 0,
                variables: void 0
            },
            mem: {
                expression: '0',
                result: 0,
                value: 0,
                variables: void 0
            }
        };
        const $container = $('#fixture-usevariable');

        assert.expect(8);

        assert.equal($container.children().length, 0, 'The container is empty');

        const instance = calculatorBoardFactory($container);
        instance
            .on('init', function onInit() {
                assert.equal(this, instance, 'The instance has been initialized');
            })
            .after('ready', function onReady() {
                assert.equal($container.children().length, 1, 'The container contains an element');
                assert.equal(this.getExpression(), '', 'The expression is empty');
                assert.deepEqual(this.getVariables(), defaultVariables, 'Only default variables set for now');

                return Promise.resolve()
                    .then(
                        () =>
                            new Promise(resolve => {
                                this.on('termadd-VAR_X', name => {
                                    assert.equal(name, 'VAR_X', 'The term foo has been received');
                                    assert.ok(false, 'The term VAR_X should not be added!');

                                    resolve();
                                });
                                this.off('error')
                                    .on('error', e => {
                                        assert.ok(e instanceof TypeError, 'The term cannot be added');
                                        assert.equal(this.getExpression(), '', 'Expression did not change');
                                        assert.equal(this.getPosition(), 0, 'Position did not change');

                                        resolve();
                                    })
                                    .useVariable('x');
                            })
                    )
                    .then(() => this.destroy());
            })
            .after('destroy', ready)
            .on('error', err => {
                //eslint-disable-next-line no-console
                console.error(err);
                assert.ok(false, 'The operation should not fail!');
                ready();
            });
    });

    QUnit.test('useCommand - success', assert => {
        const ready = assert.async();
        const $container = $('#fixture-command');

        assert.expect(13);

        assert.equal($container.children().length, 0, 'The container is empty');

        const instance = calculatorBoardFactory($container);
        instance
            .on('init', function onInit() {
                assert.equal(this, instance, 'The instance has been initialized');
            })
            .after('ready', function onReady() {
                assert.equal($container.children().length, 1, 'The container contains an element');
                assert.equal(this.getExpression(), '', 'The expression is empty');
                assert.equal(this.getPosition(), 0, 'Position is at beginning');

                const assertCommand = (command, ...args) =>
                    new Promise(resolve => {
                        this.on(`command-${command}`, (...prms) => {
                            this.off(`command-${command}`);
                            assert.deepEqual(
                                prms,
                                args,
                                `The expected parameters have been received for the command ${command}`
                            );
                            assert.equal(this.getExpression(), '', 'The expression is still empty');
                            assert.equal(this.getPosition(), 0, 'Position did not change');
                            resolve();
                        });
                        this.useCommand(command, ...args);
                    });

                this.setCommand('foo', () => {
                    assert.ok(true, 'The command foo has been invoked');
                });
                this.setCommand('bar', () => {
                    assert.ok(true, 'The command bar has been invoked');
                });

                return Promise.resolve()
                    .then(() => assertCommand('foo'))
                    .then(() => assertCommand('bar', 'tip', 'top', 42))
                    .then(() => this.destroy());
            })
            .after('destroy', ready)
            .on('error', err => {
                //eslint-disable-next-line no-console
                console.error(err);
                assert.ok(false, 'The operation should not fail!');
                ready();
            });
    });

    QUnit.test('useCommand - failure', assert => {
        const ready = assert.async();
        const $container = $('#fixture-command');

        assert.expect(8);

        assert.equal($container.children().length, 0, 'The container is empty');

        const instance = calculatorBoardFactory($container);
        instance
            .on('init', function onInit() {
                assert.equal(this, instance, 'The instance has been initialized');
            })
            .after('ready', function onReady() {
                assert.equal($container.children().length, 1, 'The container contains an element');

                assert.equal(this.getExpression(), '', 'The expression is empty');
                assert.equal(this.getPosition(), 0, 'Position is at beginning');

                return Promise.resolve()
                    .then(
                        () =>
                            new Promise(resolve => {
                                this.on('command-test', name => {
                                    assert.equal(name, 'foo', 'The command foo should not be received!');
                                    assert.ok(false, 'The command foo should not be called!');

                                    resolve();
                                });
                                this.off('error')
                                    .on('error', e => {
                                        assert.ok(e instanceof TypeError, 'The command cannot be called');
                                        assert.equal(this.getExpression(), '', 'Expression did not change');
                                        assert.equal(this.getPosition(), 0, 'Position did not change');

                                        resolve();
                                    })
                                    .useCommand('foo');
                            })
                    )
                    .then(() => this.destroy());
            })
            .after('destroy', ready)
            .on('error', err => {
                //eslint-disable-next-line no-console
                console.error(err);
                assert.ok(false, 'The operation should not fail!');
                ready();
            });
    });

    QUnit.test('clear', assert => {
        const ready = assert.async();
        const $container = $('#fixture-clear');

        assert.expect(10);

        assert.equal($container.children().length, 0, 'The container is empty');

        const instance = calculatorBoardFactory($container);
        instance
            .on('init', function onInit() {
                assert.equal(this, instance, 'The instance has been initialized');
            })
            .after('ready', function onReady() {
                assert.equal($container.children().length, 1, 'The container contains an element');
                assert.equal(this.getExpression(), '', 'The expression is empty');
                assert.equal(this.getPosition(), 0, 'The position is 0');

                const newExpression = '3+1';
                this.setExpression(newExpression);
                this.setPosition(newExpression.length);

                assert.equal(this.getExpression(), newExpression, 'The expression is set');
                assert.equal(this.getPosition(), newExpression.length, 'The position is set');

                return Promise.resolve()
                    .then(
                        () =>
                            new Promise(resolve => {
                                this.on('clear', () => {
                                    assert.ok(true, 'The expression is cleared');
                                    assert.equal(this.getExpression(), '', 'The expression is empty');
                                    assert.equal(this.getPosition(), 0, 'The position is 0');
                                    resolve();
                                }).clear();
                            })
                    )
                    .then(() => this.destroy());
            })
            .after('destroy', ready)
            .on('error', err => {
                //eslint-disable-next-line no-console
                console.error(err);
                assert.ok(false, 'The operation should not fail!');
                ready();
            });
    });

    QUnit.test('replace', assert => {
        const ready = assert.async();
        const $container = $('#fixture-replace');

        assert.expect(21);

        assert.equal($container.children().length, 0, 'The container is empty');

        const instance = calculatorBoardFactory($container);
        instance
            .on('init', function onInit() {
                const oldExpression = '3+1';
                const newExpression = '4*(4+1)';
                assert.equal(this, instance, 'The instance has been initialized');
                assert.equal(this.getExpression(), '', 'The expression is empty');
                assert.equal(this.getPosition(), 0, 'The position is 0');

                this.setExpression(oldExpression);
                this.setPosition(oldExpression.length);

                assert.equal(this.getExpression(), oldExpression, 'The old expression is set');
                assert.equal(this.getPosition(), oldExpression.length, 'The old position is set');

                return Promise.resolve()
                    .then(
                        () =>
                            new Promise(resolve => {
                                this.on('expressionchange.test', expr => {
                                    this.off('expressionchange.test');
                                    assert.equal(expr, newExpression, 'The new expression is set');
                                })
                                    .on('positionchange.test', pos => {
                                        this.off('positionchange.test');
                                        assert.equal(pos, newExpression.length, 'The new position is set');
                                    })
                                    .on('replace.test', (oldExpr, oldPos) => {
                                        this.off('replace.test');

                                        assert.ok(true, 'The expression is replaced');
                                        assert.equal(this.getExpression(), newExpression, 'The new expression is set');
                                        assert.equal(
                                            this.getPosition(),
                                            newExpression.length,
                                            'The new position is set'
                                        );

                                        assert.equal(oldExpr, oldExpression, 'The previous expression is provided');
                                        assert.equal(oldPos, oldExpression.length, 'The previous position is provided');
                                        resolve();
                                    })
                                    .replace(newExpression);
                            })
                    )
                    .then(
                        () =>
                            new Promise(resolve => {
                                this.on('expressionchange.test', expr => {
                                    this.off('expressionchange.test');
                                    assert.equal(expr, oldExpression, 'The old expression is set');
                                })
                                    .on('positionchange.test', pos => {
                                        this.off('positionchange.test');
                                        assert.equal(pos, 1, 'The arbitrary position is set');
                                    })
                                    .on('replace.test', (oldExpr, oldPos) => {
                                        this.off('replace.test');

                                        assert.ok(true, 'The expression is replaced');
                                        assert.equal(this.getExpression(), oldExpression, 'The old expression is set');
                                        assert.equal(this.getPosition(), 1, 'The arbitrary position is set');

                                        assert.equal(oldExpr, newExpression, 'The previous expression is provided');
                                        assert.equal(oldPos, newExpression.length, 'The previous position is provided');
                                        resolve();
                                    })
                                    .replace(oldExpression, 1);
                            })
                    );
            })
            .after('ready', function onReady() {
                assert.equal($container.children().length, 1, 'The container contains an element');
                this.destroy();
            })
            .after('destroy', ready)
            .on('error', err => {
                //eslint-disable-next-line no-console
                console.error(err);
                assert.ok(false, 'The operation should not fail!');
                ready();
            });
    });

    QUnit.test('insert', assert => {
        const ready = assert.async();
        const $container = $('#fixture-insert');

        assert.expect(14);

        assert.equal($container.children().length, 0, 'The container is empty');

        const instance = calculatorBoardFactory($container);
        instance
            .on('init', function onInit() {
                const oldExpression = '3+1';
                const oldPosition = oldExpression.length - 1;
                const insertedExpression = '2*(5-4)-';
                const newExpression = '3+2*(5-4)-1';
                assert.equal(this, instance, 'The instance has been initialized');
                assert.equal(this.getExpression(), '', 'The expression is empty');
                assert.equal(this.getPosition(), 0, 'The position is 0');

                this.setExpression(oldExpression);
                this.setPosition(oldPosition);

                assert.equal(this.getExpression(), oldExpression, 'The old expression is set');
                assert.equal(this.getPosition(), oldPosition, 'The old position is set');

                return new Promise(resolve => {
                    this.on('expressionchange.test', expr => {
                        assert.equal(expr, newExpression, 'The new expression is set');
                    })
                        .on('positionchange.test', pos => {
                            assert.equal(pos, oldPosition + insertedExpression.length, 'The new position is set');
                        })
                        .on('insert.test', (oldExpr, oldPos) => {
                            this.off('insert.test');

                            assert.ok(true, 'The expression is inserted');
                            assert.equal(this.getExpression(), newExpression, 'The new expression is set');
                            assert.equal(
                                this.getPosition(),
                                oldPosition + insertedExpression.length,
                                'new The position is set'
                            );

                            assert.equal(oldExpr, oldExpression, 'The previous expression is provided');
                            assert.equal(oldPos, oldPosition, 'The previous position is provided');
                            resolve();
                        })
                        .insert(insertedExpression);
                });
            })
            .after('ready', function onReady() {
                assert.equal($container.children().length, 1, 'The container contains an element');
                this.destroy();
            })
            .after('destroy', ready)
            .on('error', err => {
                //eslint-disable-next-line no-console
                console.error(err);
                assert.ok(false, 'The operation should not fail!');
                ready();
            });
    });

    QUnit.test('evaluate - success', assert => {
        const ready = assert.async();
        const $container = $('#fixture-evaluate');
        const initExpression = '.1+.2';
        const expectedResult = '0.3';

        assert.expect(10);

        assert.equal($container.children().length, 0, 'The container is empty');

        const instance = calculatorBoardFactory($container, null, {
            expression: initExpression,
            position: initExpression.length
        });
        instance
            .on('init', function onInit() {
                assert.equal(this, instance, 'The instance has been initialized');
                assert.equal(this.getExpression(), initExpression, 'The expression is initialized');
                assert.equal(this.getPosition(), initExpression.length, 'The expression is initialized');
                return Promise.resolve()
                    .then(
                        () =>
                            new Promise(resolve => {
                                this.on('evaluate.expr', result => {
                                    this.off('evaluate.expr');
                                    assert.equal(
                                        result.value,
                                        expectedResult,
                                        'The expression has been properly evaluated'
                                    );
                                    resolve();
                                });
                                assert.equal(
                                    this.evaluate().value,
                                    expectedResult,
                                    'The expression is successfully evaluated'
                                );
                            })
                    )
                    .then(
                        () =>
                            new Promise(resolve => {
                                this.clear();
                                assert.equal(this.getExpression(), '', 'The expression is cleared');
                                this.on('evaluate.empty', result => {
                                    this.off('evaluate.empty');
                                    assert.equal(result.value, '0', 'An empty expression should be evaluated as 0');
                                    resolve();
                                });
                                assert.equal(this.evaluate().value, '0', 'The empty expression is evaluated to 0');
                            })
                    );
            })
            .after('ready', function onReady() {
                assert.equal($container.children().length, 1, 'The container contains an element');
                this.destroy();
            })
            .after('destroy', ready)
            .on('error syntaxerror', err => {
                //eslint-disable-next-line no-console
                console.error(err);
                assert.ok(false, 'The operation should not fail!');
                ready();
            });
    });

    QUnit.test('evaluate - error', assert => {
        const ready = assert.async();
        const $container = $('#fixture-evaluate');
        const initExpression = '.1+*.2';

        assert.expect(7);

        assert.equal($container.children().length, 0, 'The container is empty');

        const instance = calculatorBoardFactory($container, null, {
            expression: initExpression,
            position: initExpression.length
        });
        instance
            .on('init', function onInit() {
                assert.equal(this, instance, 'The instance has been initialized');
                assert.equal(this.getExpression(), initExpression, 'The expression is initialized');
                assert.equal(this.getPosition(), initExpression.length, 'The expression is initialized');
                return new Promise(resolve => {
                    this.on('evaluate', () => {
                        assert.ok(false, 'The expression should not be evaluated');
                        resolve();
                    }).on('syntaxerror', e => {
                        assert.ok(e instanceof Error, 'The evaluation of the expression has failed');
                        resolve();
                    });
                    assert.equal(this.evaluate(), null, 'The expression cannot be evaluated');
                });
            })
            .after('ready', function onReady() {
                assert.equal($container.children().length, 1, 'The container contains an element');
                this.destroy();
            })
            .after('destroy', ready)
            .on('error', err => {
                //eslint-disable-next-line no-console
                console.error(err);
                assert.ok(false, 'The operation should not fail!');
                ready();
            });
    });

    QUnit.test('evaluate variable - success', assert => {
        const ready = assert.async();
        const $container = $('#fixture-evaluate');
        const initExpression = '(.1+.2)*x';
        const expectedResult = '0.9';

        assert.expect(7);

        assert.equal($container.children().length, 0, 'The container is empty');

        const instance = calculatorBoardFactory($container, null, {
            expression: initExpression,
            position: initExpression.length
        });
        instance
            .on('init', function onInit() {
                assert.equal(this, instance, 'The instance has been initialized');
                assert.equal(this.getExpression(), initExpression, 'The expression is initialized');
                assert.equal(this.getPosition(), initExpression.length, 'The expression is initialized');
                return new Promise(resolve => {
                    this.on('evaluate', result => {
                        assert.equal(result.value, expectedResult, 'The expression has been properly evaluated');
                        resolve();
                    });
                    this.setVariable('x', '3');
                    assert.equal(this.evaluate().value, expectedResult, 'The expression is successfully evaluated');
                });
            })
            .after('ready', function onReady() {
                assert.equal($container.children().length, 1, 'The container contains an element');
                this.destroy();
            })
            .after('destroy', ready)
            .on('error syntaxerror', err => {
                //eslint-disable-next-line no-console
                console.error(err);
                assert.ok(false, 'The operation should not fail!');
                ready();
            });
    });

    QUnit.test('evaluate variable - failure', assert => {
        const ready = assert.async();
        const $container = $('#fixture-evaluate');
        const initExpression = '(.1+.2)*x';

        assert.expect(7);

        assert.equal($container.children().length, 0, 'The container is empty');

        const instance = calculatorBoardFactory($container, null, {
            expression: initExpression,
            position: initExpression.length
        });
        instance
            .on('init', function onInit() {
                assert.equal(this, instance, 'The instance has been initialized');
                assert.equal(this.getExpression(), initExpression, 'The expression is initialized');
                assert.equal(this.getPosition(), initExpression.length, 'The expression is initialized');
                return new Promise(resolve => {
                    this.on('evaluate', () => {
                        assert.ok(false, 'The expression should not be evaluated');
                        resolve();
                    }).on('syntaxerror', e => {
                        assert.ok(e instanceof Error, 'The evaluation of the expression has failed');
                        resolve();
                    });
                    assert.equal(this.evaluate(), null, 'The expression cannot be evaluated');
                });
            })
            .after('ready', function onReady() {
                assert.equal($container.children().length, 1, 'The container contains an element');
                this.destroy();
            })
            .after('destroy', ready)
            .on('error', err => {
                //eslint-disable-next-line no-console
                console.error(err);
                assert.ok(false, 'The operation should not fail!');
                ready();
            });
    });

    QUnit.test('ans variable', assert => {
        const ready = assert.async();
        const $container = $('#fixture-ans');
        const calculator = calculatorBoardFactory($container)
            .on('ready', function onReady() {
                function evaluatePromise(expression) {
                    return new Promise((resolve, reject) => {
                        calculator
                            .on('error.test', err => {
                                calculator.off('.test');
                                reject(err);
                            })
                            .after('result.test', result => {
                                calculator.off('.test');
                                resolve(result);
                            })
                            .replace(expression)
                            .evaluate();
                    });
                }

                Promise.resolve()
                    .then(() => {
                        assert.equal(calculator.hasVariable('ans'), true, 'The variable ans is defined');
                        assert.equal(calculator.getVariable('ans').value, '0', 'The variable ans contains 0');
                        assert.equal(calculator.getLastResult().value, '0', 'The last result contains 0');

                        return evaluatePromise('ans');
                    })
                    .then(result => {
                        assert.equal(result.value, '0', 'The expression "ans" is evaluated to 0');
                        assert.equal(calculator.getVariable('ans').value, '0', 'The variable ans now contains 0');
                        assert.equal(calculator.getLastResult().value, '0', 'The last result now contains 0');

                        return evaluatePromise('40+2');
                    })
                    .then(result => {
                        assert.equal(result.value, '42', 'The expression "40+2" is evaluated to 42');
                        assert.equal(calculator.getVariable('ans').value, '42', 'The variable ans now contains 42');
                        assert.equal(calculator.getLastResult().value, '42', 'The last result now contains 42');

                        return evaluatePromise('ans*2');
                    })
                    .then(result => {
                        assert.equal(result.value, '84', 'The expression "ans*2" is evaluated to 84');
                        assert.equal(calculator.getVariable('ans').value, '84', 'The variable ans now contains 84');
                        assert.equal(calculator.getLastResult().value, '84', 'The last result now contains 84');

                        return evaluatePromise('3*2');
                    })
                    .then(result => {
                        assert.equal(result.value, '6', 'The expression "3*2" is evaluated to 6');
                        assert.equal(calculator.getVariable('ans').value, '6', 'The variable ans now contains 6');
                        assert.equal(calculator.getLastResult().value, '6', 'The last result now contains 6');

                        return evaluatePromise('sqrt -2');
                    })
                    .then(result => {
                        assert.equal(String(result.value), 'NaN', 'The expression "sqrt -2" is evaluated to NaN');
                        assert.equal(calculator.getVariable('ans').value, '6', 'The variable ans now contains 6');
                        assert.equal(calculator.getLastResult().value, '6', 'The last result now contains 6');
                    })
                    .then(() => {
                        calculator.setLastResult('42');
                        assert.equal(calculator.getVariable('ans').value, '42', 'The variable ans now contains 42');
                        assert.equal(calculator.getLastResult().value, '42', 'The last result now contains 42');
                    })
                    .then(() => {
                        calculator.setLastResult('Infinity');
                        assert.equal(calculator.getVariable('ans').value, '0', 'The variable ans now contains 0');
                        assert.equal(calculator.getLastResult().value, '0', 'The last result now contains 0');
                    })
                    .then(() => {
                        calculator.setLastResult('NaN');
                        assert.equal(calculator.getVariable('ans').value, '0', 'The variable ans now contains 0');
                        assert.equal(calculator.getLastResult().value, '0', 'The last result now contains 0');
                    })
                    .catch(err => {
                        assert.ok(false, `Unexpected failure : ${err.message}`);
                    })
                    .then(() => {
                        calculator.destroy();
                    });
            })
            .on('error', err => {
                //eslint-disable-next-line no-console
                console.error(err);
                assert.ok(false, 'The operation should not fail!');
                ready();
            })
            .after('destroy', ready);

        assert.expect(24);
    });

    QUnit.test('built-in commands - clear', assert => {
        const ready = assert.async();
        const $container = $('#fixture-builtin');

        assert.expect(10);

        assert.equal($container.children().length, 0, 'The container is empty');

        const instance = calculatorBoardFactory($container);
        instance
            .on('init', function onInit() {
                const newExpression = '3+1';
                assert.equal(this, instance, 'The instance has been initialized');
                assert.equal(this.getExpression(), '', 'The expression is empty');
                assert.equal(this.getPosition(), 0, 'The position is 0');

                this.setExpression(newExpression);
                this.setPosition(newExpression.length);

                assert.equal(this.getExpression(), newExpression, 'The expression is set');
                assert.equal(this.getPosition(), newExpression.length, 'The position is set');

                return new Promise(resolve => {
                    this.on('clear.test', () => {
                        this.off('clear.test');

                        assert.ok(true, 'The expression is cleared');
                        assert.equal(this.getExpression(), '', 'The expression is empty');
                        assert.equal(this.getPosition(), 0, 'The position is 0');
                        resolve();
                    }).useCommand('clear');
                });
            })
            .after('ready', function onReady() {
                assert.equal($container.children().length, 1, 'The container contains an element');
                this.destroy();
            })
            .after('destroy', ready)
            .on('error', err => {
                //eslint-disable-next-line no-console
                console.error(err);
                assert.ok(false, 'The operation should not fail!');
                ready();
            });
    });

    QUnit.test('built-in commands - reset', assert => {
        const ready = assert.async();
        const $container = $('#fixture-builtin');

        assert.expect(10);

        assert.equal($container.children().length, 0, 'The container is empty');

        const instance = calculatorBoardFactory($container);
        instance
            .on('init', function onInit() {
                const newExpression = '3+1';
                assert.equal(this, instance, 'The instance has been initialized');
                assert.equal(this.getExpression(), '', 'The expression is empty');
                assert.equal(this.getPosition(), 0, 'The position is 0');

                this.setExpression(newExpression);
                this.setPosition(newExpression.length);

                assert.equal(this.getExpression(), newExpression, 'The expression is set');
                assert.equal(this.getPosition(), newExpression.length, 'The position is set');

                return new Promise(resolve => {
                    this.on('reset.test', () => {
                        this.off('reset.test');

                        assert.ok(true, 'The expression is cleared');
                        assert.equal(this.getExpression(), '', 'The expression is empty');
                        assert.equal(this.getPosition(), 0, 'The position is 0');
                        resolve();
                    }).useCommand('reset');
                });
            })
            .after('ready', function onReady() {
                assert.equal($container.children().length, 1, 'The container contains an element');
                this.destroy();
            })
            .after('destroy', ready)
            .on('error', err => {
                //eslint-disable-next-line no-console
                console.error(err);
                assert.ok(false, 'The operation should not fail!');
                ready();
            });
    });

    QUnit.test('built-in commands - execute', assert => {
        const ready = assert.async();
        const $container = $('#fixture-builtin');
        const initExpression = '.1+.2';
        const expectedResult = '0.3';

        assert.expect(6);

        assert.equal($container.children().length, 0, 'The container is empty');

        const instance = calculatorBoardFactory($container, null, {
            expression: initExpression,
            position: initExpression.length
        });
        instance
            .on('init', function onInit() {
                assert.equal(this, instance, 'The instance has been initialized');
                assert.equal(this.getExpression(), initExpression, 'The expression is initialized');
                assert.equal(this.getPosition(), initExpression.length, 'The expression is initialized');
                return new Promise(resolve => {
                    this.on('evaluate', result => {
                        assert.equal(result.value, expectedResult, 'The expression has been properly evaluated');
                        resolve();
                    }).useCommand('execute');
                });
            })
            .after('ready', function onReady() {
                assert.equal($container.children().length, 1, 'The container contains an element');
                this.destroy();
            })
            .after('destroy', ready)
            .on('error syntaxerror', err => {
                //eslint-disable-next-line no-console
                console.error(err);
                assert.ok(false, 'The operation should not fail!');
                ready();
            });
    });

    QUnit.test('built-in commands - const and term', assert => {
        const ready = assert.async();
        const $container = $('#fixture-builtin');
        const initExpression = '.1+.2';
        const expectedExpression = '.1+.2+x^2';
        const expectedResult = '9.3';

        assert.expect(8);

        assert.equal($container.children().length, 0, 'The container is empty');

        const instance = calculatorBoardFactory($container, null, {
            expression: initExpression,
            position: initExpression.length
        });
        instance
            .on('init', function onInit() {
                assert.equal(this, instance, 'The instance has been initialized');
                assert.equal(this.getExpression(), initExpression, 'The expression is initialized');
                assert.equal(this.getPosition(), initExpression.length, 'The expression is initialized');
                return new Promise(resolve => {
                    this.after('evaluate.test', result => {
                        this.off('evaluate.test');
                        assert.equal(this.getExpression(), expectedExpression, 'The expression has been updated');
                        assert.equal(this.getPosition(), expectedExpression.length, 'The position has been updated');
                        assert.equal(result.value, expectedResult, 'The expression has been properly evaluated');
                        resolve();
                    })
                        .setVariable('x', '3')
                        .useCommand('term', 'ADD')
                        .useCommand('var', 'x')
                        .useCommand('term', 'POW NUM2')
                        .evaluate();
                });
            })
            .after('ready', function onReady() {
                assert.equal($container.children().length, 1, 'The container contains an element');
                this.destroy();
            })
            .after('destroy', ready)
            .on('error syntaxerror', err => {
                //eslint-disable-next-line no-console
                console.error(err);
                assert.ok(false, 'The operation should not fail!');
                ready();
            });
    });

    QUnit.test('mathsEvaluator', assert => {
        const ready = assert.async();
        const $container = $('#fixture-evaluator');

        assert.expect(11);

        assert.equal($container.children().length, 0, 'The container is empty');

        const instance = calculatorBoardFactory($container);
        instance
            .on('init', function onInit() {
                let mathsEvaluator = this.getMathsEvaluator();
                assert.equal(this, instance, 'The instance has been initialized');
                assert.equal(this.getExpression(), '', 'The expression is initialized');
                assert.equal(this.getPosition(), 0, 'The expression is initialized');
                assert.equal(typeof mathsEvaluator, 'function', 'The mathsEvaluator is provided');
                assert.equal(mathsEvaluator('sin(PI/2)').value, '1', 'The mathsEvaluator works in radian');

                this.getConfig().maths = { degree: true };
                assert.equal(this.setupMathsEvaluator(), this, 'setupMathsEvaluator returns the instance');
                assert.notEqual(
                    this.getMathsEvaluator(),
                    mathsEvaluator,
                    'The mathsEvaluator should have been replaced'
                );
                mathsEvaluator = this.getMathsEvaluator();
                assert.notEqual(
                    mathsEvaluator('sin(PI/2)').value,
                    '1',
                    'The mathsEvaluator should not work in radian anymore'
                );
                assert.equal(mathsEvaluator('sin 90').value, '1', 'The mathsEvaluator now works in degree');
            })
            .after('ready', function onReady() {
                assert.equal($container.children().length, 1, 'The container contains an element');
                this.destroy();
            })
            .after('destroy', ready)
            .on('error syntaxerror', err => {
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
            .on('ready', function onReady() {
                function addTermPromise(term) {
                    return new Promise((resolve, reject) => {
                        calculator
                            .on('error.test', err => {
                                calculator.off('.test');
                                reject(err);
                            })
                            .after('termadd.test', () => {
                                calculator.off('.test');
                                resolve();
                            })
                            .useTerm(term);
                    });
                }

                calculator.replace('0');

                Promise.resolve()
                    .then(() => {
                        assert.equal(calculator.getExpression(), '0', 'The expression should be set to 0');
                        assert.equal(calculator.getPosition(), 1, 'The position should be set to 1');
                        return addTermPromise('NUM0');
                    })
                    .then(() => {
                        assert.equal(calculator.getExpression(), '0', 'The expression should still be 0');
                        assert.equal(calculator.getPosition(), 1, 'The position should still be 1');
                        return addTermPromise('ADD');
                    })
                    .then(() => {
                        assert.equal(calculator.getExpression(), '0+', 'The expression should be now 0+');
                        assert.equal(calculator.getPosition(), 2, 'The position should be now 2');
                        return addTermPromise('NUM5');
                    })
                    .then(() => {
                        assert.equal(calculator.getExpression(), '0+5', 'The expression should be now 0+5');
                        assert.equal(calculator.getPosition(), 3, 'The position should be now 3');
                    })
                    .catch(err => {
                        assert.ok(false, `Unexpected failure : ${err.message}`);
                    })
                    .then(() => {
                        calculator.destroy();
                    });
            })
            .on('error', err => {
                //eslint-disable-next-line no-console
                console.error(err);
                assert.ok(false, 'The operation should not fail!');
                ready();
            })
            .on('destroy', function () {
                ready();
            });

        assert.expect(8);
    });

    QUnit.cases
        .init([
            {
                title: 'PI',
                term: 'PI',
                expression: 'PI',
                value: 'PI',
                type: 'constant'
            },
            {
                title: '3',
                term: 'NUM3',
                expression: '3',
                value: '3',
                type: 'digit'
            },
            {
                title: '(',
                term: 'LPAR',
                expression: '(',
                value: '(',
                type: 'aggregator'
            },
            {
                title: 'sqrt',
                term: 'SQRT',
                expression: 'sqrt',
                value: 'sqrt',
                type: 'function'
            },
            {
                title: 'nthrt',
                term: '@NTHRT',
                expression: '0@nthrt',
                value: '@nthrt',
                type: 'function'
            }
        ])
        .test('0 and const', (data, assert) => {
            const ready = assert.async();
            const $container = $('#fixture-zero-const');
            const calculator = calculatorBoardFactory($container)
                .on('ready', function onReady() {
                    function addTermPromise(term) {
                        return new Promise((resolve, reject) => {
                            calculator
                                .on('error.test', err => {
                                    calculator.off('.test');
                                    reject(err);
                                })
                                .after('termadd.test', () => {
                                    calculator.off('.test');
                                    resolve();
                                })
                                .useTerm(term);
                        });
                    }

                    calculator.replace('0');

                    Promise.resolve()
                        .then(() => {
                            assert.equal(calculator.getExpression(), '0', 'The expression should be set to 0');
                            assert.equal(calculator.getPosition(), 1, 'The position should be set to 1');
                            return addTermPromise('NUM0');
                        })
                        .then(() => {
                            assert.equal(calculator.getExpression(), '0', 'The expression should still be 0');
                            assert.equal(calculator.getPosition(), 1, 'The position should still be 1');
                            return addTermPromise(data.term);
                        })
                        .then(() => {
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
                        })
                        .catch(err => {
                            assert.ok(false, `Unexpected failure : ${err.message}`);
                        })
                        .then(() => {
                            calculator.destroy();
                        });
                })
                .on('error', runtimeErr => {
                    //eslint-disable-next-line no-console
                    console.error(runtimeErr);
                    assert.ok(false, 'The operation should not fail!');
                    ready();
                })
                .on('destroy', ready);

            assert.expect(6);
        });

    QUnit.test('ans and operator', assert => {
        const ready = assert.async();
        const $container = $('#fixture-ans-op');
        const calculator = calculatorBoardFactory($container)
            .on('ready', function onReady() {
                function termPromise(call) {
                    return new Promise((resolve, reject) => {
                        calculator
                            .on('error.test', err => {
                                calculator.off('.test');
                                reject(err);
                            })
                            .after('termadd.test', () => {
                                calculator.off('.test');
                                resolve();
                            });
                        call();
                    });
                }

                calculator.replace('ans');

                Promise.resolve()
                    .then(() => {
                        assert.equal(calculator.getExpression(), 'ans', 'The expression should be set to ans');
                        assert.equal(calculator.getPosition(), 3, 'The position should be set to 3');
                        return termPromise(() => this.useVariable('ans'));
                    })
                    .then(() => {
                        assert.equal(calculator.getExpression(), 'ans', 'The expression should still be ans');
                        assert.equal(calculator.getPosition(), 3, 'The position should still be 3');
                        return termPromise(() => this.useTerm('ADD'));
                    })
                    .then(() => {
                        assert.equal(calculator.getExpression(), 'ans+', 'The expression should be now ans+');
                        assert.equal(calculator.getPosition(), 4, 'The position should be now 4');
                        return termPromise(() => this.useTerm('NUM8'));
                    })
                    .then(() => {
                        assert.equal(calculator.getExpression(), 'ans+8', 'The expression should be now ans+8');
                        assert.equal(calculator.getPosition(), 5, 'The position should be now 5');
                    })
                    .catch(err => {
                        assert.ok(false, `Unexpected failure : ${err.message}`);
                    })
                    .then(() => {
                        calculator.destroy();
                    });
            })
            .on('error', err => {
                //eslint-disable-next-line no-console
                console.error(err);
                assert.ok(false, 'The operation should not fail!');
                ready();
            })
            .on('destroy', ready);

        assert.expect(8);
    });

    QUnit.cases
        .init([
            {
                title: 'PI',
                term: 'PI',
                expression: 'PI',
                value: 'PI',
                type: 'constant'
            },
            {
                title: '3',
                term: 'NUM3',
                expression: '3',
                value: '3',
                type: 'digit'
            },
            {
                title: '(',
                term: 'LPAR',
                expression: '(',
                value: '(',
                type: 'aggregator'
            },
            {
                title: 'sqrt',
                term: 'SQRT',
                expression: 'sqrt',
                value: 'sqrt',
                type: 'function'
            },
            {
                title: 'nthrt',
                term: '@NTHRT',
                expression: 'ans@nthrt',
                value: '@nthrt',
                type: 'function'
            }
        ])
        .test('ans and const', (data, assert) => {
            const ready = assert.async();
            const $container = $('#fixture-ans-const');
            const calculator = calculatorBoardFactory($container)
                .on('ready', function onReady() {
                    function termPromise(call) {
                        return new Promise((resolve, reject) => {
                            calculator
                                .on('error.test', err => {
                                    calculator.off('.test');
                                    reject(err);
                                })
                                .after('termadd.test', () => {
                                    calculator.off('.test');
                                    resolve();
                                });
                            call();
                        });
                    }

                    calculator.replace('ans');

                    Promise.resolve()
                        .then(() => {
                            assert.equal(calculator.getExpression(), 'ans', 'The expression should be set to ans');
                            assert.equal(calculator.getPosition(), 3, 'The position should be set to 3');
                            return termPromise(() => this.useVariable('ans'));
                        })
                        .then(() => {
                            assert.equal(calculator.getExpression(), 'ans', 'The expression should still be ans');
                            assert.equal(calculator.getPosition(), 3, 'The position should still be 3');
                            return termPromise(() => this.useTerm(data.term));
                        })
                        .then(() => {
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
                        })
                        .catch(err => {
                            assert.ok(false, `Unexpected failure : ${err.message}`);
                        })
                        .then(() => {
                            calculator.destroy();
                        });
                })
                .on('error', err => {
                    //eslint-disable-next-line no-console
                    console.error(err);
                    assert.ok(false, 'The operation should not fail!');
                    ready();
                })
                .on('destroy', ready);

            assert.expect(6);
        });
});
