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
 * Copyright (c) 2017 (original work) Open Assessment Technologies SA ;
 */
define([
    'jquery',
    'lodash',
    'ui/keyNavigation/navigator',
    'ui/keyNavigation/navigableDomElement',
    'ui/keyNavigation/navigableGroupElement',
    'lib/simulator/jquery.simulate'
], function (
    $,
    _,
    keyNavigatorFactory,
    navigableDomElement,
    navigableGroupElement
) {
    'use strict';

    QUnit.module('API');

    QUnit.test('factory', function (assert) {
        assert.equal(typeof keyNavigatorFactory, 'function', 'The module exposes a function');
        assert.equal(typeof keyNavigatorFactory(), 'object', 'The factory creates an object');
        assert.notDeepEqual(keyNavigatorFactory(), keyNavigatorFactory(), 'The factory creates new objects');
    });

    QUnit.cases.init([
        {title: 'on'},
        {title: 'off'},
        {title: 'trigger'},
        {title: 'spread'}
    ]).test('event API ', function (data, assert) {
        var keyNavigator = keyNavigatorFactory();
        assert.expect(1);
        assert.equal(typeof keyNavigator[data.title], 'function', 'The navigator exposes a "' + data.title + '" function');
    });

    QUnit.cases.init([
        {title: 'getId'},
        {title: 'getGroup'},
        {title: 'getCursor'},
        {title: 'getNavigables'},
        {title: 'isFocused'},
        {title: 'first'},
        {title: 'last'},
        {title: 'next'},
        {title: 'previous'},
        {title: 'activate'},
        {title: 'blur'},
        {title: 'focus'},
        {title: 'focusPosition'},
        {title: 'destroy'}
    ]).test('component API ', function (data, assert) {
        var keyNavigator = keyNavigatorFactory();
        assert.expect(1);
        assert.equal(typeof keyNavigator[data.title], 'function', 'The navigator exposes a "' + data.title + '" function');
    });

    QUnit.module('Dom navigable element');

    QUnit.test('activate', function (assert) {
        var ready = assert.async();
        var keyNavigator;
        var $container = $('#qunit-fixture .nav-1');
        var $elements = $container.find('.nav');
        var elements = navigableDomElement.createFromDoms($elements);

        assert.expect(6);
        assert.equal(elements.length, 3, 'navigable element created');

        keyNavigator = keyNavigatorFactory({
            elements: elements,
            defaultPosition: elements.length - 1
        })
            .on('activate', function (cursor) {
                assert.ok(true, 'activated');
                assert.equal(cursor.position, 2, 'activated position is ok');
                assert.ok(cursor.navigable.getElement() instanceof $, 'navigable element in cursor');
                assert.equal(cursor.navigable.getElement().data('id'), 'C', 'navigable element in cursor is correct');
                ready();
            });

        keyNavigator.focus();
        assert.equal($(document.activeElement).data('id'), 'C', 'focus on last');
        $(document.activeElement).simulate('keydown', {keyCode: 13}); //Enter
    });

    QUnit.test('navigate with API', function (assert) {
        var ready = assert.async();
        var keyNavigator;
        var $container = $('#qunit-fixture .nav-1');
        var $elements = $container.find('.nav');
        var elements = navigableDomElement.createFromDoms($elements);

        assert.equal(elements.length, 3, 'navigable element created');

        keyNavigator = keyNavigatorFactory({
            id: 'bottom-toolbar',
            group: $container,
            elements: elements,
            defaultPosition: elements.length - 1
        })
            .on('right down', function () {
                this.next();
            })
            .on('left up', function () {
                this.previous();
            })
            .on('activate', function (cursor) {
                ready();
                assert.ok(true, 'activated');
                assert.equal(cursor.position, 0, 'activated position is ok');
                assert.ok(cursor.navigable.getElement() instanceof $, 'navigable element in cursor');
                assert.equal(cursor.navigable.getElement().data('id'), 'A', 'navigable element in cursor is correct');
            });

        keyNavigator.focus();
        assert.equal($(document.activeElement).data('id'), 'C', 'default focus on last');
        keyNavigator.next();
        assert.equal($(document.activeElement).data('id'), 'C', 'stay on last');
        keyNavigator.previous();
        assert.equal($(document.activeElement).data('id'), 'B', 'focus on second');
        keyNavigator.previous();
        assert.equal($(document.activeElement).data('id'), 'A', 'focus on first');
        keyNavigator.previous();
        assert.equal($(document.activeElement).data('id'), 'A', 'stay on first');
        keyNavigator.activate();
    });

    QUnit.test('navigate with keyboard', function (assert) {
        var ready = assert.async();
        var keyNavigator;
        var $container = $('#qunit-fixture .nav-1');
        var $elements = $container.find('.nav');
        var elements = navigableDomElement.createFromDoms($elements);

        assert.expect(16);

        assert.equal(elements.length, 3, 'navigable element created');

        keyNavigator = keyNavigatorFactory({
            elements: elements,
            defaultPosition: elements.length - 1
        })
            .on('right down', function () {
                this.next();
                assert.ok(true, 'go next');
            })
            .on('left up', function () {
                this.previous();
                assert.ok(true, 'go previous');
            })
            .on('activate', function (cursor) {
                ready();
                assert.ok(true, 'activated');
                assert.equal(cursor.position, 1, 'activated position is ok');
                assert.ok(cursor.navigable.getElement() instanceof $, 'navigable element in cursor');
                assert.equal(cursor.navigable.getElement().data('id'), 'B', 'navigable element in cursor is correct');
            });

        keyNavigator.focus();
        assert.equal($(document.activeElement).data('id'), 'C', 'default focus on last');

        $(document.activeElement).simulate('keydown', {keyCode: 40}); //Down
        assert.equal($(document.activeElement).data('id'), 'C', 'stay on last');

        $(document.activeElement).simulate('keydown', {keyCode: 38}); //Up
        assert.equal($(document.activeElement).data('id'), 'B', 'focus on second');

        $(document.activeElement).simulate('keydown', {keyCode: 37}); //Left
        assert.equal($(document.activeElement).data('id'), 'A', 'focus on first');

        $(document.activeElement).simulate('keydown', {keyCode: 38}); //Up
        assert.equal($(document.activeElement).data('id'), 'A', 'stay on first');

        $(document.activeElement).simulate('keydown', {keyCode: 39}); //Right
        assert.equal($(document.activeElement).data('id'), 'B', 'focus on second');

        $(document.activeElement).simulate('keydown', {keyCode: 13}); //Enter
    });

    QUnit.test('isFocused', function (assert) {
        var keyNavigator;
        var $container = $('#qunit-fixture .nav-1');
        var $navigables = $container.find('.nav');
        var navigables = navigableDomElement.createFromDoms($navigables);

        assert.expect(4);

        assert.equal(navigables.length, 3, 'navigable element created');

        keyNavigator = keyNavigatorFactory({elements: navigables});

        assert.ok(!keyNavigator.isFocused(), 'the navigator is not on focus');
        keyNavigator.focus();
        assert.ok(keyNavigator.isFocused(), 'the keyNavigator is now on focus');
        keyNavigator.blur();
        assert.ok(!keyNavigator.isFocused(), 'the navigator is now blurred');
    });

    QUnit.test('loop', function (assert) {
        var ready = assert.async();
        var keyNavigator;
        var $container = $('#qunit-fixture .nav-1');
        var $elements = $container.find('.nav');
        var elements = navigableDomElement.createFromDoms($elements);

        assert.expect(10);

        assert.equal(elements.length, 3, 'navigable element created');

        keyNavigator = keyNavigatorFactory({
            loop: true,
            elements: elements
        })
            .on('right down', function () {
                this.next();
            })
            .on('left up', function () {
                this.previous();
            })
            .on('activate', function (cursor) {
                ready();
                assert.ok(true, 'activated');
                assert.equal(cursor.position, 2, 'activated position is ok');
                assert.ok(cursor.navigable.getElement() instanceof $, 'navigable element in cursor');
                assert.equal(cursor.navigable.getElement().data('id'), 'C', 'navigable element in cursor is correct');
            });

        keyNavigator.focus();
        assert.equal($(document.activeElement).data('id'), 'A', 'focus on first');

        keyNavigator.next();
        assert.equal($(document.activeElement).data('id'), 'B', 'focus on second');

        keyNavigator.next();
        assert.equal($(document.activeElement).data('id'), 'C', 'focus on last');

        keyNavigator.next();
        assert.equal($(document.activeElement).data('id'), 'A', 'loop to first');

        keyNavigator.previous();
        assert.equal($(document.activeElement).data('id'), 'C', 'loop to last');

        keyNavigator.activate();
    });

    QUnit.test('keep state off', function (assert) {
        var ready = assert.async();
        var keyNavigator;
        var $container = $('#qunit-fixture .nav-1');
        var $elements = $container.find('.nav');
        var elements = navigableDomElement.createFromDoms($elements);

        assert.expect(9);

        assert.equal(elements.length, 3, 'navigable element created');

        keyNavigator = keyNavigatorFactory({
            elements: elements
        })
            .on('right down', function () {
                this.next();
            })
            .on('left up', function () {
                this.previous();
            })
            .on('activate', function (cursor) {
                ready();
                assert.ok(true, 'activated');
                assert.equal(cursor.position, 0, 'activated position is ok');
                assert.ok(cursor.navigable.getElement() instanceof $, 'navigable element in cursor');
                assert.equal(cursor.navigable.getElement().data('id'), 'A', 'navigable element in cursor is correct');
            });

        keyNavigator.focus();
        assert.equal($(document.activeElement).data('id'), 'A', 'focus on first');

        keyNavigator.next();
        assert.equal($(document.activeElement).data('id'), 'B', 'focus on second');

        $(document.activeElement).blur();
        assert.equal(document.activeElement, $('body').get(0), 'focus out');

        keyNavigator.focus();
        assert.equal(
            $(document.activeElement).data('id'),
            'A',
            'focus on a a navigator with keep state on should reset the cursor'
        );

        keyNavigator.activate();
    });

    QUnit.test('keep state on', function (assert) {
        var ready = assert.async();
        var keyNavigator;
        var $container = $('#qunit-fixture .nav-1');
        var $elements = $container.find('.nav');
        var elements = navigableDomElement.createFromDoms($elements);

        assert.expect(9);

        assert.equal(elements.length, 3, 'navigable element created');

        keyNavigator = keyNavigatorFactory({
            keepState: true,
            elements: elements
        })
            .on('right down', function () {
                this.next();
            })
            .on('left up', function () {
                this.previous();
            })
            .on('activate', function (cursor) {
                ready();
                assert.ok(true, 'activated');
                assert.equal(cursor.position, 1, 'activated position is ok');
                assert.ok(cursor.navigable.getElement() instanceof $, 'navigable element in cursor');
                assert.equal(cursor.navigable.getElement().data('id'), 'B', 'navigable element in cursor is correct');
            });

        keyNavigator.focus();
        assert.equal($(document.activeElement).data('id'), 'A', 'focus on first');

        keyNavigator.next();
        assert.equal($(document.activeElement).data('id'), 'B', 'focus on second');

        $(document.activeElement).blur();
        assert.equal(document.activeElement, $('body').get(0), 'focus out');

        keyNavigator.focus();
        assert.equal(
            $(document.activeElement).data('id'),
            'B',
            'focus on a a navigator with keep state on should restore the cursor in memory'
        );

        keyNavigator.activate();
    });

    QUnit.test('activate with space', function (assert) {
        var ready = assert.async();
        var keyNavigator;
        var $container = $('#qunit-fixture .nav-2');
        var $elements = $container.find('.nav');
        var elements = navigableDomElement.createFromDoms($elements);

        var $textarea = $('textarea', $container);
        assert.expect(7);

        assert.equal(elements.length, 3, 'navigable element created');

        var keyNavigator = keyNavigatorFactory({
            keepState: true,
            elements: elements
        })
            .on('right', function () {
                this.next();
            })
            .on('activate', function (cursor) {
                assert.equal(cursor.position, 2, 'activated position is ok');
                assert.equal(cursor.navigable.getElement().data('id'), 'C', 'navigable element in cursor is correct');

                assert.equal($textarea.length, 1, 'The textarea element exists');

                this.on('blur', function () {
                    assert.ok(false, 'Hitting the space key should not blur the active element');
                    ready();
                });

                $textarea.simulate('keydown', {keyCode: 32}); //Space-> should not blur
                $textarea.simulate('keyup', {keyCode: 32}); //Space

                setTimeout(function () {
                    keyNavigator.off('blur');
                    ready();
                }, 100);
            });

        keyNavigator.focus();
        assert.equal($(document.activeElement).data('id'), 'A', 'focus on first');

        $(document.activeElement).simulate('keydown', {keyCode: 39}); //Right
        assert.equal($(document.activeElement).data('id'), 'B', 'focus on second');

        $(document.activeElement).simulate('keydown', {keyCode: 39}); //Right
        assert.equal($(document.activeElement).data('id'), 'C', 'focus on third');

        $(document.activeElement).simulate('keyup', {keyCode: 32}); //Space -> activate
    });

    QUnit.module('Group navigable element');

    QUnit.test('isVisible', function (assert) {
        var $container = $('#qunit-fixture .inputable');
        var keyNavigator = keyNavigatorFactory({
            id: 'A',
            elements: navigableDomElement.createFromDoms($container.find('input')),
            group: $container
        });
        var groupNavigable = navigableGroupElement(keyNavigator);

        assert.ok(groupNavigable.isVisible(), 'group element is visible');

        $container.find('input[data-id=A]').hide();
        assert.ok(groupNavigable.isVisible(), 'group element is still visible');

        $container.find('input[data-id=B]').hide();
        assert.ok(groupNavigable.isVisible(), 'group element is still visible');

        $container.find('input[data-id=C]').hide();
        assert.ok(!groupNavigable.isVisible(), 'group element is hidden');

        $container.find('input[data-id=C]').show();
        assert.ok(groupNavigable.isVisible(), 'group element is visible again');
    });

    QUnit.test('isEnabled', function (assert) {
        var $container = $('#qunit-fixture .inputable');
        var keyNavigator = keyNavigatorFactory({
            id: 'A',
            elements: navigableDomElement.createFromDoms($container.find('input')),
            group: $container
        });
        var groupNavigable = navigableGroupElement(keyNavigator);

        assert.ok(groupNavigable.isEnabled(), 'group element is enabled');

        $container.find('input[data-id=A]').attr('disabled', 'disabled');
        assert.ok(groupNavigable.isEnabled(), 'group element is still enabled');

        $container.find('input[data-id=B]').attr('disabled', 'disabled');
        assert.ok(groupNavigable.isEnabled(), 'group element is still enabled');

        $container.find('input[data-id=C]').attr('disabled', 'disabled');
        assert.ok(!groupNavigable.isEnabled(), 'group element is disabled');

        $container.find('input[data-id=C]').removeAttr('disabled');
        assert.ok(groupNavigable.isEnabled(), 'group element is enabled again');
    });

    QUnit.test('navigate between navigable areas', function (assert) {
        var ready = assert.async();
        var keyNavigator;
        var $container = $('#qunit-fixture');
        var keyNavigators = [
            keyNavigatorFactory({
                id: 'A',
                elements: navigableDomElement.createFromDoms($container.find('[data-id=A]')),
                group: $container.find('[data-id=A]')
            }),
            keyNavigatorFactory({
                id: 'B',
                elements: navigableDomElement.createFromDoms($container.find('[data-id=B]')),
                group: $container.find('[data-id=B]')
            }),
            keyNavigatorFactory({
                id: 'C',
                elements: navigableDomElement.createFromDoms($container.find('[data-id=C]')),
                group: $container.find('[data-id=C]')
            })
        ];

        var elements = navigableGroupElement.createFromNavigators(keyNavigators);

        assert.expect(8);

        assert.equal(elements.length, 3, 'navigable element created');

        keyNavigator = keyNavigatorFactory({
            elements: elements
        })
            .on('right down', function () {
                this.next();
            })
            .on('left up', function () {
                this.previous();
            })
            .on('activate', function (cursor) {
                ready();
                assert.ok(true, 'activated');
                assert.equal(cursor.position, 2, 'activated position is ok');
                assert.ok(cursor.navigable.getElement() instanceof $, 'navigable element in cursor');
                assert.equal(cursor.navigable.getElement().data('id'), 'C', 'navigable element in cursor is correct');
            });

        keyNavigator.focus();
        assert.equal($(document.activeElement).data('id'), 'A', 'focus on first');

        keyNavigator.next();
        assert.equal($(document.activeElement).data('id'), 'B', 'focus on second');

        keyNavigator.next();
        assert.equal($(document.activeElement).data('id'), 'C', 'focus on last');

        keyNavigator.activate();
    });
});
