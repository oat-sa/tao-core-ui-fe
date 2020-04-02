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

    var testDelay = 2;

    /**
     * Capture an event, fail if it takes too much time to occur
     * @param {eventifier} instance
     * @param {String} event
     * @returns {Promise<arguments>} When resolved, the promise returns the received arguments
     */
    function promiseEvent(instance, event) {
        return new Promise(function (resolve, reject) {
            var fail = window.setTimeout(function () {
                reject();
            }, 50);

            instance
                .off('.test')
                .on(event + '.test', function () {
                    window.clearTimeout(fail);
                    resolve(arguments);
                });
        });
    }

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
        {title: 'init'},
        {title: 'destroy'},
        {title: 'getId'},
        {title: 'getElement'},
        {title: 'getCursor'},
        {title: 'getNavigables'},
        {title: 'isVisible'},
        {title: 'isEnabled'},
        {title: 'isFocused'},
        {title: 'first'},
        {title: 'last'},
        {title: 'next'},
        {title: 'previous'},
        {title: 'activate'},
        {title: 'blur'},
        {title: 'focus'},
        {title: 'focusPosition'}
    ]).test('component API ', function (data, assert) {
        var keyNavigator = keyNavigatorFactory();
        assert.expect(1);
        assert.equal(typeof keyNavigator[data.title], 'function', 'The navigator exposes a "' + data.title + '" function');
    });

    QUnit.module('Behavior');

    QUnit.test('init parameter / getElement / getNavigables', function (assert) {
        var group = document.querySelector('#qunit-fixture .interleaved');
        var elements = document.querySelectorAll('#qunit-fixture .interleaved .nav');
        var navElements = navigableDomElement.createFromDoms(elements);
        var instance = keyNavigatorFactory({
            group: $(group),
            elements: navElements
        });

        assert.expect(12 + elements.length * 2);

        assert.ok(instance.getElement() instanceof $, 'The instance has a jQuery selection for the represented group');
        assert.equal(instance.getElement().get(0), group, 'The instance has selected the right group');

        assert.equal(typeof instance.getId(), 'string', 'The identifier is a string');
        assert.notEqual(instance.getId(), '', 'The identifier is set');
        assert.equal(instance.getId().substring(0, 10), 'navigator_', 'The identifier is set with the expected prefix');

        assert.notEqual(keyNavigatorFactory().getId(), keyNavigatorFactory().getId(), 'Automatic ID are differents');
        assert.equal(keyNavigatorFactory({id: 'foo'}).getId(), 'foo', 'Specific ID is taken into account');

        assert.ok(instance.getNavigables() instanceof Array, 'The instance has a collection of navigable elements');
        assert.equal(instance.getNavigables().length, elements.length, 'The instance has the expected number of navigable elements');
        instance.getNavigables().forEach(function(navigable, i) {
            assert.ok(navigableDomElement.isNavigableElement(navigable), 'This is a navigable element');
            assert.equal(navigable.getElement().get(0), elements[i], 'The navigable relates to the expected element');
        });

        assert.equal(keyNavigatorFactory().getElement(), null, 'Group can be null');

        assert.throws(function () {
            keyNavigatorFactory({
                group: $(),
                elements: elements
            });
        }, 'The group must be valid');

        assert.throws(function () {
            keyNavigatorFactory({
                group: $('<div />'),
                elements: elements
            });
        }, 'The group must exist');

        instance.destroy();
    });

    QUnit.test('init / destroy / focus', function (assert) {
        var ready = assert.async();
        var group = document.querySelector('#qunit-fixture .interleaved');
        var elements = document.querySelectorAll('#qunit-fixture .interleaved .nav.group-1');
        var elements2 = document.querySelectorAll('#qunit-fixture .interleaved .nav.group-2');
        var first = elements[0];
        var last = elements[elements.length - 1];
        var navElements = navigableDomElement.createFromDoms(elements);
        var instance = keyNavigatorFactory({
            group: $(group),
            elements: navElements
        });
        var instance2 = keyNavigatorFactory({
           elements: navigableDomElement.createFromDoms(elements2)
        });

        assert.expect(21);

        Promise
            .resolve()
            .then(function() {
                return new Promise(function (resolve) {
                    if (document.activeElement) {
                        document.activeElement.blur();
                    }

                    assert.equal(document.activeElement, document.body, 'No element in focus');
                    assert.equal(group.className, 'interleaved key-navigation-group', 'The fixture has the initial CSS class');
                    assert.equal(instance.init(), instance, 'The init method is fluent');
                    assert.equal(instance.focus(), instance, 'The focus method is fluent');

                    setTimeout(resolve, testDelay);
                });
            })
            .then(function() {
                return new Promise(function (resolve) {
                    assert.equal(document.activeElement, first, 'The first element got the focus');
                    assert.equal(group.classList.contains('focusin'), true, 'The fixture got the focusin CSS class');

                    document.activeElement.blur();

                    setTimeout(resolve, testDelay);
                });
            })
            .then(function() {
                return new Promise(function (resolve) {
                    assert.equal(document.activeElement, document.body, 'No element in focus');
                    assert.equal(group.classList.contains('focusin'), false, 'The fixture loose the focusin CSS class');

                    assert.equal(instance.focus(), instance, 'The focus method is fluent');

                    setTimeout(resolve, testDelay);
                });
            })
            .then(function() {
                return new Promise(function (resolve) {
                    assert.equal(document.activeElement, first, 'The first element got the focus');
                    assert.equal(group.classList.contains('focusin'), true, 'The fixture got the focusin CSS class');
                    assert.equal(instance.isFocused(), true, 'The group is focused');

                    elements2[0].focus();

                    setTimeout(resolve, testDelay);
                });
            })
            .then(function() {
                return new Promise(function (resolve) {
                    assert.equal(document.activeElement, elements2[0], 'The first element of another group got the focus');
                    assert.equal(group.classList.contains('focusin'), false, 'The fixture loose the focusin CSS class');
                    assert.equal(instance.isFocused(), false, 'The group is not focused');

                    last.focus();

                    setTimeout(resolve, testDelay);
                });
            })
            .then(function() {
                return new Promise(function (resolve) {
                    assert.equal(document.activeElement, last, 'The last element of the group got the focus');
                    assert.equal(group.classList.contains('focusin'), true, 'The fixture got the focusin CSS class');
                    assert.equal(instance.isFocused(), true, 'The group is focused');

                    assert.equal(instance.destroy(), instance, 'The destroy method is fluent');

                    setTimeout(resolve, testDelay);
                });
            })
            .then(function() {
                assert.equal(document.activeElement, last, 'The element still has the focus');
                assert.equal(group.classList.contains('focusin'), false, 'The fixture loose the focusin CSS class');

                instance2.destroy();
            })
            .catch(function(err) {
                assert.pushResult({
                    result: false,
                    message: err
                });
            })
            .then(ready);
    });

    QUnit.test('isVisible', function (assert) {
        var group = document.querySelector('#qunit-fixture .inputable');
        var elements = document.querySelectorAll('#qunit-fixture .inputable input');
        var navElements = navigableDomElement.createFromDoms(elements);
        var instance = keyNavigatorFactory({
            group: $(group),
            elements: navElements
        });

        assert.expect(7);

        assert.equal(instance.isVisible(), true, 'The group is visible');

        $(group).hide();

        assert.equal(instance.isVisible(), false, 'The group is not visible anymore');

        $(group).show();

        assert.equal(instance.isVisible(), true, 'The group is visible again');

        $(elements[0]).hide();

        assert.equal(instance.isVisible(), true, 'One element of the group is hidden but other are visible');

        $(elements[1]).hide();

        assert.equal(instance.isVisible(), true, 'One element of the group is still visible');

        $(elements[2]).hide();

        assert.equal(instance.isVisible(), false, 'All elements of the group are hidden');

        $(elements[2]).show();

        assert.equal(instance.isVisible(), true, 'One element of the group is visible again');

        instance.destroy();
    });

    QUnit.test('isEnabled', function (assert) {
        var group = document.querySelector('#qunit-fixture .inputable');
        var elements = document.querySelectorAll('#qunit-fixture .inputable input');
        var navElements = navigableDomElement.createFromDoms(elements);
        var instance = keyNavigatorFactory({
            group: $(group),
            elements: navElements
        });

        assert.expect(5);

        assert.equal(instance.isEnabled(), true, 'The group is enabled');

        elements[0].setAttribute('disabled', 'disabled');

        assert.equal(instance.isEnabled(), true, 'One element of the group is disabled but other are enabled');

        elements[1].setAttribute('disabled', 'disabled');

        assert.equal(instance.isEnabled(), true, 'One element of the group is still enabled');

        elements[2].setAttribute('disabled', 'disabled');

        assert.equal(instance.isEnabled(), false, 'All elements of the group are disabled');

        elements[1].removeAttribute('disabled');

        assert.equal(instance.isEnabled(), true, 'One element of the group is enabled again');

        instance.destroy();
    });

    QUnit.test('isFocused', function (assert) {
        var ready = assert.async();
        var group = document.querySelector('#qunit-fixture .interleaved');
        var elements = document.querySelectorAll('#qunit-fixture .interleaved .nav.group-1');
        var elements2 = document.querySelectorAll('#qunit-fixture .interleaved .nav.group-2');
        var first = elements[0];
        var last = elements[elements.length - 1];
        var navElements = navigableDomElement.createFromDoms(elements);
        var instance = keyNavigatorFactory({
            group: $(group),
            elements: navElements
        });
        var instance2 = keyNavigatorFactory({
            elements: navigableDomElement.createFromDoms(elements2)
        });

        assert.expect(23);

        Promise
            .resolve()
            .then(function() {
                return new Promise(function (resolve) {
                    if (document.activeElement) {
                        document.activeElement.blur();
                    }

                    assert.equal(document.activeElement, document.body, 'No element in focus');
                    assert.equal(instance.isFocused(), false, 'The group is not focused');

                    instance.init();
                    instance.focus();

                    setTimeout(resolve, testDelay);
                });
            })
            .then(function() {
                return new Promise(function (resolve) {
                    assert.equal(document.activeElement, first, 'The first element got the focus');
                    assert.equal(group.classList.contains('focusin'), true, 'The fixture got the focusin CSS class');
                    assert.equal(instance.isFocused(), true, 'The group is focused');

                    document.activeElement.blur();

                    setTimeout(resolve, testDelay);
                });
            })
            .then(function() {
                return new Promise(function (resolve) {
                    assert.equal(document.activeElement, document.body, 'No element in focus');
                    assert.equal(group.classList.contains('focusin'), false, 'The fixture loose the focusin CSS class');
                    assert.equal(instance.isFocused(), false, 'The group is not focused');

                    elements2[0].focus();

                    setTimeout(resolve, testDelay);
                });
            })
            .then(function() {
                return new Promise(function (resolve) {
                    assert.equal(document.activeElement, elements2[0], 'The first element of another group got the focus');
                    assert.equal(group.classList.contains('focusin'), false, 'The fixture still doesn\'t have the focusin CSS class');
                    assert.equal(instance.isFocused(), false, 'The group is not focused');

                    instance.focus();

                    setTimeout(resolve, testDelay);
                });
            })
            .then(function() {
                return new Promise(function (resolve) {
                    assert.equal(document.activeElement, first, 'The first element got the focus');
                    assert.equal(group.classList.contains('focusin'), true, 'The fixture got the focusin CSS class');
                    assert.equal(instance.isFocused(), true, 'The group is focused');

                    elements2[0].focus();

                    setTimeout(resolve, testDelay);
                });
            })
            .then(function() {
                return new Promise(function (resolve) {
                    assert.equal(document.activeElement, elements2[0], 'The first element of another group got the focus');
                    assert.equal(group.classList.contains('focusin'), false, 'The fixture loose the focusin CSS class');
                    assert.equal(instance.isFocused(), false, 'The group is not focused');

                    last.focus();

                    setTimeout(resolve, testDelay);
                });
            })
            .then(function() {
                return new Promise(function (resolve) {
                    assert.equal(document.activeElement, last, 'The last element of the group got the focus');
                    assert.equal(group.classList.contains('focusin'), true, 'The fixture got the focusin CSS class');
                    assert.equal(instance.isFocused(), true, 'The group is focused');

                    instance.destroy();

                    setTimeout(resolve, testDelay);
                });
            })
            .then(function() {
                assert.equal(document.activeElement, last, 'The element still has the focus');
                assert.equal(group.classList.contains('focusin'), false, 'The fixture loose the focusin CSS class');
                assert.equal(instance.isFocused(), true, 'The group is focused');

                instance2.destroy();
            })
            .catch(function(err) {
                assert.pushResult({
                    result: false,
                    message: err
                });
            })
            .then(ready);
    });

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

        assert.expect(7);

        keyNavigator = keyNavigatorFactory({
            elements: keyNavigators
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
