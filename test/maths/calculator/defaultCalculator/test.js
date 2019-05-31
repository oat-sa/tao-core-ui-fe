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
    'ui/maths/calculator/core/plugin',
    'ui/maths/calculator/defaultCalculator',
    'css!taoCss/tao-3.css',
    'css!taoCss/tao-main-style.css'
], function($, _, pluginFactory, defaultCalculatorFactory) {
    'use strict';

    QUnit.module('Factory');

    QUnit.test('module', function(assert) {
        assert.expect(3);
        assert.equal(typeof defaultCalculatorFactory, 'function', 'The module exposes a function');
        assert.equal(typeof defaultCalculatorFactory(), 'object', 'The factory produces an object');
        assert.notStrictEqual(
            defaultCalculatorFactory(),
            defaultCalculatorFactory(),
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
        .test('inherited API ', function(data, assert) {
            var instance = defaultCalculatorFactory();
            assert.expect(1);
            assert.equal(
                typeof instance[data.title],
                'function',
                'The instance exposes a "' + data.title + '" function'
            );
        });

    QUnit.cases
        .init([{ title: 'on' }, { title: 'off' }, { title: 'trigger' }, { title: 'spread' }])
        .test('event API ', function(data, assert) {
            var instance = defaultCalculatorFactory();
            assert.expect(1);
            assert.equal(
                typeof instance[data.title],
                'function',
                'The instance exposes a "' + data.title + '" function'
            );
        });

    QUnit.module('Life cycle');

    QUnit.test('init', function(assert) {
        var ready = assert.async();
        var instance;
        assert.expect(1);

        instance = defaultCalculatorFactory()
            .after('init', function() {
                assert.equal(this, instance, 'The instance has been initialized');
                this.destroy();
            })
            .on('destroy', function() {
                ready();
            })
            .on('error', function(err) {
                console.error(err);
                assert.ok(false, 'The operation should not fail!');
                ready();
            });
    });

    QUnit.test('render', function(assert) {
        var ready = assert.async();
        var $container = $('#fixture-render');
        var instance;

        assert.expect(3);

        assert.equal($container.children().length, 0, 'The container is empty');

        instance = defaultCalculatorFactory({ renderTo: $container })
            .on('init', function() {
                assert.equal(this, instance, 'The instance has been initialized');
            })
            .on('ready', function() {
                assert.equal($container.children().length, 1, 'The container contains an element');

                this.destroy();
            })
            .on('destroy', function() {
                ready();
            })
            .on('error', function(err) {
                console.error(err);
                assert.ok(false, 'The operation should not fail!');
                ready();
            });
    });

    QUnit.test('render templates', function(assert) {
        var ready = assert.async();
        var $container = $('#fixture-template');
        var instance;

        function keyboardTpl() {
            return '<div class="calculator-keyboard mock-keyboard"></div>';
        }
        function screenTpl() {
            return '<div class="calculator-keyboard mock-screen"></div>';
        }

        assert.expect(5);

        assert.equal($container.children().length, 0, 'The container is empty');

        instance = defaultCalculatorFactory({
            keyboardLayout: keyboardTpl,
            screenLayout: screenTpl,
            renderTo: $container
        })
            .on('init', function() {
                assert.equal(this, instance, 'The instance has been initialized');
            })
            .on('ready', function() {
                assert.equal($container.children().length, 1, 'The container contains an element');

                assert.equal(
                    $container.find('.mock-keyboard').length,
                    1,
                    'The provided keyboard layout has been utilized'
                );
                assert.equal($container.find('.mock-screen').length, 1, 'The provided screen layout has been utilized');

                this.destroy();
            })
            .on('destroy', function() {
                ready();
            })
            .on('error', function(err) {
                console.error(err);
                assert.ok(false, 'The operation should not fail!');
                ready();
            });
    });

    QUnit.test('additional plugins', function(assert) {
        var ready = assert.async();
        var $container = $('#fixture-plugin');
        var instance;

        var plugin1 = pluginFactory({
            name: 'plugin1',
            install: function install() {
                assert.ok(true, 'The plugin1 is installed');
            },
            init: function init() {
                assert.ok(true, 'The plugin1 is initialized');
            }
        });
        var plugin2 = pluginFactory({
            name: 'plugin2',
            install: function install() {
                assert.ok(true, 'The plugin2 is installed');
            },
            init: function init() {
                assert.ok(true, 'The plugin2 is initialized');
            }
        });

        assert.expect(7);

        assert.equal($container.children().length, 0, 'The container is empty');

        instance = defaultCalculatorFactory({
            loadedPlugins: {
                additional: [plugin1, plugin2]
            },
            renderTo: $container
        })
            .on('init', function() {
                assert.equal(this, instance, 'The instance has been initialized');
            })
            .on('ready', function() {
                assert.equal($container.children().length, 1, 'The container contains an element');

                this.destroy();
            })
            .on('destroy', function() {
                ready();
            })
            .on('error', function(err) {
                console.error(err);
                assert.ok(false, 'The operation should not fail!');
                ready();
            });
    });

    QUnit.test('destroy', function(assert) {
        var ready = assert.async();
        var $container = $('#fixture-destroy');
        var instance;

        assert.expect(4);

        assert.equal($container.children().length, 0, 'The container is empty');

        instance = defaultCalculatorFactory({ renderTo: $container })
            .on('init', function() {
                assert.equal(this, instance, 'The instance has been initialized');
            })
            .on('ready', function() {
                assert.equal($container.children().length, 1, 'The container contains an element');

                this.destroy();
            })
            .after('destroy', function() {
                assert.equal($container.children().length, 0, 'The container is now empty');

                ready();
            })
            .on('error', function(err) {
                console.error(err);
                assert.ok(false, 'The operation should not fail!');
                ready();
            });
    });

    QUnit.module('visual test');

    QUnit.test('defaultCalculator', function(assert) {
        var ready = assert.async();
        var $container = $('#visual-test');
        var instance;

        assert.expect(3);

        assert.equal($container.children().length, 0, 'The container is empty');

        instance = defaultCalculatorFactory({ renderTo: $container })
            .on('init', function() {
                assert.equal(this, instance, 'The instance has been initialized');
            })
            .on('ready', function() {
                assert.equal($container.children().length, 1, 'The container contains an element');

                ready();
            })
            .on('error', function(err) {
                console.error(err);
                assert.ok(false, 'The operation should not fail!');
                ready();
            });
    });
});
