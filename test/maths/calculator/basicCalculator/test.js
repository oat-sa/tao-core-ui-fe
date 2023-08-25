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
define(['jquery', 'ui/maths/calculator/basicCalculator'], function ($, basicCalculatorFactory) {
    'use strict';

    QUnit.module('Factory');

    QUnit.test('module', assert => {
        assert.expect(3);
        assert.equal(typeof basicCalculatorFactory, 'function', 'The module exposes a function');
        assert.equal(typeof basicCalculatorFactory(), 'object', 'The factory produces an object');
        assert.notStrictEqual(
            basicCalculatorFactory(),
            basicCalculatorFactory(),
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
            const instance = basicCalculatorFactory();
            assert.expect(1);
            assert.equal(typeof instance[data.title], 'function', `The instance exposes a "${data.title}" function`);
        });

    QUnit.cases
        .init([{ title: 'on' }, { title: 'off' }, { title: 'trigger' }, { title: 'spread' }])
        .test('event API ', (data, assert) => {
            const instance = basicCalculatorFactory();
            assert.expect(1);
            assert.equal(typeof instance[data.title], 'function', `The instance exposes a "${data.title}" function`);
        });

    QUnit.module('Life cycle');

    QUnit.test('init', assert => {
        const ready = assert.async();
        assert.expect(1);

        const instance = basicCalculatorFactory()
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

        assert.expect(3);

        assert.equal($container.children().length, 0, 'The container is empty');

        const instance = basicCalculatorFactory({ renderTo: $container })
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

        const instance = basicCalculatorFactory({ renderTo: $container })
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

    QUnit.test('basicCalculator', assert => {
        const ready = assert.async();
        const $container = $('#visual-test');

        assert.expect(3);

        assert.equal($container.children().length, 0, 'The container is empty');

        const instance = basicCalculatorFactory({ renderTo: $container })
            .on('init', function onInit() {
                assert.equal(this, instance, 'The instance has been initialized');
            })
            .on('ready', () => {
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
