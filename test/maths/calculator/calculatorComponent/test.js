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
define(['jquery', 'ui/maths/calculator/core/plugin', 'ui/maths/calculator/calculatorComponent'], function (
    $,
    pluginFactory,
    calculatorComponentFactory
) {
    'use strict';

    QUnit.module('Factory');

    QUnit.test('module', assert => {
        assert.expect(3);
        assert.equal(typeof calculatorComponentFactory, 'function', 'The module exposes a function');
        assert.equal(typeof calculatorComponentFactory(), 'object', 'The factory produces an object');
        assert.notStrictEqual(
            calculatorComponentFactory(),
            calculatorComponentFactory(),
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
            const instance = calculatorComponentFactory();
            assert.expect(1);
            assert.equal(typeof instance[data.title], 'function', `The instance exposes a "${data.title}" function`);
        });

    QUnit.cases
        .init([{ title: 'on' }, { title: 'off' }, { title: 'trigger' }, { title: 'spread' }])
        .test('event API ', (data, assert) => {
            const instance = calculatorComponentFactory();
            assert.expect(1);
            assert.equal(typeof instance[data.title], 'function', `The instance exposes a "${data.title}" function`);
        });

    QUnit.cases.init([{ title: 'getCalculator' }]).test('calculatorComponentFactory API ', (data, assert) => {
        const instance = calculatorComponentFactory();
        assert.expect(1);
        assert.equal(typeof instance[data.title], 'function', `The instance exposes a "${data.title}" function`);
    });

    QUnit.module('Life cycle');

    QUnit.test('init', assert => {
        const ready = assert.async();
        assert.expect(1);

        const instance = calculatorComponentFactory()
            .after('init', function onInit() {
                assert.equal(this, instance, 'The instance has been initialized');
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

        assert.expect(5);

        assert.equal($container.children().length, 0, 'The container is empty');

        const instance = calculatorComponentFactory({
            renderTo: $container,
            dynamicPlugins: [
                {
                    category: 'keyboard',
                    module: 'ui/maths/calculator/plugins/keyboard/templateKeyboard/templateKeyboard',
                    bundle: 'loader/tao.min'
                },
                {
                    category: 'screen',
                    module: 'ui/maths/calculator/plugins/screen/simpleScreen/simpleScreen',
                    bundle: 'loader/tao.min'
                }
            ]
        })
            .on('init', function onInit() {
                assert.equal(this, instance, 'The instance has been initialized');
            })
            .on('ready', function onReady() {
                assert.equal($container.children().length, 1, 'The container contains an element');

                assert.equal(typeof instance.getCalculator(), 'object', 'The calculator component is reachable');
                assert.equal(typeof instance.getCalculator().evaluate, 'function', 'The calculator component is valid');

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

    QUnit.test('additional plugins', assert => {
        const ready = assert.async();
        const $container = $('#fixture-plugin');

        const plugin1 = pluginFactory({
            name: 'plugin1',
            install() {
                assert.ok(true, 'The plugin1 is installed');
            },
            init() {
                assert.ok(true, 'The plugin1 is initialized');
            }
        });
        const plugin2 = pluginFactory({
            name: 'plugin2',
            install() {
                assert.ok(true, 'The plugin2 is installed');
            },
            init() {
                assert.ok(true, 'The plugin2 is initialized');
            }
        });

        assert.expect(7);

        assert.equal($container.children().length, 0, 'The container is empty');

        const instance = calculatorComponentFactory({
            loadedPlugins: {
                additional: [plugin1, plugin2]
            },
            renderTo: $container
        })
            .on('init', function onInit() {
                assert.equal(this, instance, 'The instance has been initialized');
            })
            .on('ready', function onReady() {
                assert.equal($container.children().length, 1, 'The container contains an element');

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

        assert.expect(4);

        assert.equal($container.children().length, 0, 'The container is empty');

        const instance = calculatorComponentFactory({ renderTo: $container })
            .on('init', function onInit() {
                assert.equal(this, instance, 'The instance has been initialized');
            })
            .on('ready', function onReady() {
                assert.equal($container.children().length, 1, 'The container contains an element');

                this.destroy();
            })
            .after('destroy', () => {
                assert.equal($container.children().length, 0, 'The container is now empty');

                ready();
            })
            .on('error', err => {
                //eslint-disable-next-line no-console
                console.error(err);
                assert.ok(false, 'The operation should not fail!');
                ready();
            });
    });

    QUnit.module('visual test');

    QUnit.test('calculatorComponent', assert => {
        const ready = assert.async();
        const $container = $('#visual-test');

        assert.expect(3);

        assert.equal($container.children().length, 0, 'The container is empty');

        const instance = calculatorComponentFactory({
            renderTo: $container,
            dynamicPlugins: [
                {
                    category: 'keyboard',
                    module: 'ui/maths/calculator/plugins/keyboard/templateKeyboard/templateKeyboard',
                    bundle: 'loader/tao.min'
                },
                {
                    category: 'screen',
                    module: 'ui/maths/calculator/plugins/screen/simpleScreen/simpleScreen',
                    bundle: 'loader/tao.min'
                }
            ]
        })
            .on('init', function onInit() {
                assert.equal(this, instance, 'The instance has been initialized');
            })
            .on('ready', function onReady() {
                assert.equal($container.children().length, 1, 'The container contains an element');

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
