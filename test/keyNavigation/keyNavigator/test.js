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
    'lib/simulator/jquery.simulate'
], function ($, _, keyNavigatorFactory, navigableDomElement) {
    'use strict';

    const testDelay = 2;

    QUnit.module('API');

    QUnit.test('factory', function (assert) {
        assert.equal(typeof keyNavigatorFactory, 'function', 'The module exposes a function');
        assert.equal(typeof keyNavigatorFactory(), 'object', 'The factory creates an object');
        assert.notDeepEqual(keyNavigatorFactory(), keyNavigatorFactory(), 'The factory creates new objects');
    });

    QUnit.cases
        .init([{ title: 'on' }, { title: 'off' }, { title: 'trigger' }, { title: 'spread' }])
        .test('event API ', function (data, assert) {
            const keyNavigator = keyNavigatorFactory();
            assert.expect(1);
            assert.equal(
                typeof keyNavigator[data.title],
                'function',
                `The navigator exposes a "${data.title}" function`
            );
        });

    QUnit.cases
        .init([
            { title: 'init' },
            { title: 'destroy' },
            { title: 'getId' },
            { title: 'getType' },
            { title: 'getElement' },
            { title: 'getCursor' },
            { title: 'getNavigableAt' },
            { title: 'getCursorAt' },
            { title: 'setCursorAt' },
            { title: 'getCurrentPosition' },
            { title: 'getCurrentNavigable' },
            { title: 'getNavigableElements' },
            { title: 'isVisible' },
            { title: 'isEnabled' },
            { title: 'isFocused' },
            { title: 'first' },
            { title: 'last' },
            { title: 'next' },
            { title: 'previous' },
            { title: 'activate' },
            { title: 'blur' },
            { title: 'focus' }
        ])
        .test('component API ', function (data, assert) {
            var keyNavigator = keyNavigatorFactory();
            assert.expect(1);
            assert.equal(
                typeof keyNavigator[data.title],
                'function',
                `The navigator exposes a "${data.title}" function`
            );
        });

    QUnit.module('Behavior');

    QUnit.test('init parameter / getElement / getNavigableElements', function (assert) {
        var group = document.querySelector('#qunit-fixture .interleaved');
        var elements = document.querySelectorAll('#qunit-fixture .interleaved .nav');
        var navElements = navigableDomElement.createFromDoms(elements);
        var instance = keyNavigatorFactory({
            group: $(group),
            elements: navElements
        });

        assert.expect(13 + elements.length * 2);

        assert.ok(instance.getElement() instanceof $, 'The instance has a jQuery selection for the represented group');
        assert.equal(instance.getElement().get(0), group, 'The instance has selected the right group');
        assert.equal(instance.getType(), 'navigator', 'This a navigator instance');

        assert.equal(typeof instance.getId(), 'string', 'The identifier is a string');
        assert.notEqual(instance.getId(), '', 'The identifier is set');
        assert.equal(instance.getId().substring(0, 10), 'navigator_', 'The identifier is set with the expected prefix');

        assert.notEqual(keyNavigatorFactory().getId(), keyNavigatorFactory().getId(), 'Automatic ID are differents');
        assert.equal(keyNavigatorFactory({ id: 'foo' }).getId(), 'foo', 'Specific ID is taken into account');

        assert.ok(
            instance.getNavigableElements() instanceof Array,
            'The instance has a collection of navigable elements'
        );
        assert.equal(
            instance.getNavigableElements().length,
            elements.length,
            'The instance has the expected number of navigable elements'
        );
        instance.getNavigableElements().forEach(function (navigable, i) {
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
                group: $('<div><ul><li></li></ul></div>'),
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

        Promise.resolve()
            .then(function () {
                return new Promise(function (resolve) {
                    if (document.activeElement) {
                        document.activeElement.blur();
                    }

                    assert.equal(document.activeElement, document.body, 'No element in focus');
                    assert.equal(
                        group.className,
                        'interleaved key-navigation-group',
                        'The fixture has the initial CSS class'
                    );
                    assert.equal(instance.init(), instance, 'The init method is fluent');
                    assert.equal(instance.focus(), instance, 'The focus method is fluent');

                    setTimeout(resolve, testDelay);
                });
            })
            .then(function () {
                return new Promise(function (resolve) {
                    assert.equal(document.activeElement, first, 'The first element got the focus');
                    assert.equal(group.classList.contains('focusin'), true, 'The fixture got the focusin CSS class');

                    document.activeElement.blur();

                    setTimeout(resolve, testDelay);
                });
            })
            .then(function () {
                return new Promise(function (resolve) {
                    assert.equal(document.activeElement, document.body, 'No element in focus');
                    assert.equal(group.classList.contains('focusin'), false, 'The fixture loose the focusin CSS class');

                    assert.equal(instance.focus(), instance, 'The focus method is fluent');

                    setTimeout(resolve, testDelay);
                });
            })
            .then(function () {
                return new Promise(function (resolve) {
                    assert.equal(document.activeElement, first, 'The first element got the focus');
                    assert.equal(group.classList.contains('focusin'), true, 'The fixture got the focusin CSS class');
                    assert.equal(instance.isFocused(), true, 'The group is focused');

                    elements2[0].focus();

                    setTimeout(resolve, testDelay);
                });
            })
            .then(function () {
                return new Promise(function (resolve) {
                    assert.equal(
                        document.activeElement,
                        elements2[0],
                        'The first element of another group got the focus'
                    );
                    assert.equal(group.classList.contains('focusin'), false, 'The fixture loose the focusin CSS class');
                    assert.equal(instance.isFocused(), false, 'The group is not focused');

                    last.focus();

                    setTimeout(resolve, testDelay);
                });
            })
            .then(function () {
                return new Promise(function (resolve) {
                    assert.equal(document.activeElement, last, 'The last element of the group got the focus');
                    assert.equal(group.classList.contains('focusin'), true, 'The fixture got the focusin CSS class');
                    assert.equal(instance.isFocused(), true, 'The group is focused');

                    assert.equal(instance.destroy(), instance, 'The destroy method is fluent');

                    setTimeout(resolve, testDelay);
                });
            })
            .then(function () {
                assert.equal(document.activeElement, document.body, 'No element in focus');
                assert.equal(group.classList.contains('focusin'), false, 'The fixture loose the focusin CSS class');

                instance2.destroy();
            })
            .catch(function (err) {
                assert.pushResult({
                    result: false,
                    message: err
                });
            })
            .then(ready);
    });

    QUnit.test('getNavigableAt', function (assert) {
        var group = document.querySelector('#qunit-fixture .interleaved');
        var elements = document.querySelectorAll('#qunit-fixture .interleaved .nav.group-1');
        var navElements = navigableDomElement.createFromDoms(elements);
        var instance = keyNavigatorFactory({
            group: $(group),
            elements: navElements
        });

        assert.expect(6);

        assert.equal(instance.getNavigableAt(), null, 'Undefined position');
        assert.equal(instance.getNavigableAt(-1), null, 'Negative position');
        assert.equal(instance.getNavigableAt(0), navElements[0], 'First position');
        assert.equal(instance.getNavigableAt(1), navElements[1], 'Second position');
        assert.equal(instance.getNavigableAt(2), navElements[2], 'Third position');
        assert.equal(instance.getNavigableAt(10), null, 'Not existing position');

        instance.destroy();
    });

    QUnit.test('getCursorAt', function (assert) {
        var group = document.querySelector('#qunit-fixture .interleaved');
        var elements = document.querySelectorAll('#qunit-fixture .interleaved .nav.group-1');
        var navElements = navigableDomElement.createFromDoms(elements);
        var instance = keyNavigatorFactory({
            group: $(group),
            elements: navElements
        });

        assert.expect(6);

        assert.deepEqual(instance.getCursorAt(), { position: -1, navigable: null }, 'Undefined position');
        assert.deepEqual(instance.getCursorAt(-1), { position: -1, navigable: null }, 'Negative position');
        assert.deepEqual(instance.getCursorAt(0), { position: 0, navigable: navElements[0] }, 'First position');
        assert.deepEqual(instance.getCursorAt(1), { position: 1, navigable: navElements[1] }, 'Second position');
        assert.deepEqual(instance.getCursorAt(2), { position: 2, navigable: navElements[2] }, 'Third position');
        assert.deepEqual(instance.getCursorAt(10), { position: -1, navigable: null }, 'Not existing position');

        instance.destroy();
    });

    QUnit.test('getCursor', function (assert) {
        var ready = assert.async();
        var group = document.querySelector('#qunit-fixture .interleaved');
        var elements = document.querySelectorAll('#qunit-fixture .interleaved .nav.group-1');
        var elements2 = document.querySelectorAll('#qunit-fixture .interleaved .nav.group-2');
        var navElements = navigableDomElement.createFromDoms(elements);
        var instance = keyNavigatorFactory({
            group: $(group),
            elements: navElements
        });

        assert.expect(17);

        Promise.resolve()
            .then(function () {
                return new Promise(function (resolve) {
                    if (document.activeElement) {
                        document.activeElement.blur();
                    }

                    assert.equal(document.activeElement, document.body, 'No element in focus');
                    assert.deepEqual(
                        instance.getCursor(),
                        { position: -1, navigable: null },
                        'There is no current element yet'
                    );
                    assert.notEqual(
                        instance.getCursor(),
                        instance.getCursor(),
                        'Different copies of the cursor are returned'
                    );

                    instance.focus();

                    setTimeout(resolve, testDelay);
                });
            })
            .then(function () {
                return new Promise(function (resolve) {
                    assert.equal(document.activeElement, elements[0], 'The first element got the focus');
                    assert.deepEqual(
                        instance.getCursor(),
                        { position: 0, navigable: navElements[0] },
                        'The current element is the first navigable'
                    );

                    document.activeElement.blur();

                    setTimeout(resolve, testDelay);
                });
            })
            .then(function () {
                return new Promise(function (resolve) {
                    assert.equal(document.activeElement, document.body, 'No element in focus');
                    assert.deepEqual(
                        instance.getCursor(),
                        { position: -1, navigable: null },
                        'There is no current element again'
                    );

                    instance.focus();

                    setTimeout(resolve, testDelay);
                });
            })
            .then(function () {
                return new Promise(function (resolve) {
                    assert.equal(document.activeElement, elements[0], 'The first element got the focus back');
                    assert.deepEqual(
                        instance.getCursor(),
                        { position: 0, navigable: navElements[0] },
                        'The current element is the first navigable'
                    );

                    elements[1].focus();

                    setTimeout(resolve, testDelay);
                });
            })
            .then(function () {
                return new Promise(function (resolve) {
                    assert.equal(document.activeElement, elements[1], 'The second element got the focus back');
                    assert.deepEqual(
                        instance.getCursor(),
                        { position: 1, navigable: navElements[1] },
                        'The current element is the second navigable'
                    );

                    elements2[0].focus();

                    setTimeout(resolve, testDelay);
                });
            })
            .then(function () {
                return new Promise(function (resolve) {
                    assert.equal(
                        document.activeElement,
                        elements2[0],
                        'The first element of another group got the focus'
                    );
                    assert.deepEqual(
                        instance.getCursor(),
                        { position: -1, navigable: null },
                        'There is no current element again'
                    );

                    elements[elements.length - 1].focus();

                    setTimeout(resolve, testDelay);
                });
            })
            .then(function () {
                return new Promise(function (resolve) {
                    assert.equal(
                        document.activeElement,
                        elements[elements.length - 1],
                        'The last element of the group got the focus'
                    );
                    assert.deepEqual(
                        instance.getCursor(),
                        { position: elements.length - 1, navigable: navElements[navElements.length - 1] },
                        'The current element is the last navigable'
                    );

                    instance.destroy();

                    setTimeout(resolve, testDelay);
                });
            })
            .then(function () {
                assert.equal(document.activeElement, document.body, 'No element in focus');
                assert.deepEqual(
                    instance.getCursor(),
                    { position: -1, navigable: null },
                    'There is no current element now'
                );
            })
            .catch(function (err) {
                assert.pushResult({
                    result: false,
                    message: err
                });
            })
            .then(ready);
    });

    QUnit.test('getCurrentPosition', function (assert) {
        var ready = assert.async();
        var group = document.querySelector('#qunit-fixture .interleaved');
        var elements = document.querySelectorAll('#qunit-fixture .interleaved .nav.group-1');
        var elements2 = document.querySelectorAll('#qunit-fixture .interleaved .nav.group-2');
        var navElements = navigableDomElement.createFromDoms(elements);
        var instance = keyNavigatorFactory({
            group: $(group),
            elements: navElements
        });

        assert.expect(16);

        Promise.resolve()
            .then(function () {
                return new Promise(function (resolve) {
                    if (document.activeElement) {
                        document.activeElement.blur();
                    }

                    assert.equal(document.activeElement, document.body, 'No element in focus');
                    assert.equal(instance.getCurrentPosition(), -1, 'There is no current element yet');

                    instance.focus();

                    setTimeout(resolve, testDelay);
                });
            })
            .then(function () {
                return new Promise(function (resolve) {
                    assert.equal(document.activeElement, elements[0], 'The first element got the focus');
                    assert.equal(instance.getCurrentPosition(), 0, 'The current element is the first navigable');

                    document.activeElement.blur();

                    setTimeout(resolve, testDelay);
                });
            })
            .then(function () {
                return new Promise(function (resolve) {
                    assert.equal(document.activeElement, document.body, 'No element in focus');
                    assert.equal(instance.getCurrentPosition(), -1, 'There is no current element again');

                    instance.focus();

                    setTimeout(resolve, testDelay);
                });
            })
            .then(function () {
                return new Promise(function (resolve) {
                    assert.equal(document.activeElement, elements[0], 'The first element got the focus back');
                    assert.equal(instance.getCurrentPosition(), 0, 'The current element is the first navigable');

                    elements[1].focus();

                    setTimeout(resolve, testDelay);
                });
            })
            .then(function () {
                return new Promise(function (resolve) {
                    assert.equal(document.activeElement, elements[1], 'The second element got the focus back');
                    assert.equal(instance.getCurrentPosition(), 1, 'The current element is the second navigable');

                    elements2[0].focus();

                    setTimeout(resolve, testDelay);
                });
            })
            .then(function () {
                return new Promise(function (resolve) {
                    assert.equal(
                        document.activeElement,
                        elements2[0],
                        'The first element of another group got the focus'
                    );
                    assert.equal(instance.getCurrentPosition(), -1, 'There is no current element again');

                    elements[elements.length - 1].focus();

                    setTimeout(resolve, testDelay);
                });
            })
            .then(function () {
                return new Promise(function (resolve) {
                    assert.equal(
                        document.activeElement,
                        elements[elements.length - 1],
                        'The last element of the group got the focus'
                    );
                    assert.equal(
                        instance.getCurrentPosition(),
                        elements.length - 1,
                        'The current element is the last navigable'
                    );

                    instance.destroy();

                    setTimeout(resolve, testDelay);
                });
            })
            .then(function () {
                assert.equal(document.activeElement, document.body, 'No element in focus');
                assert.deepEqual(instance.getCurrentPosition(), -1, 'There is no current element now');
            })
            .catch(function (err) {
                assert.pushResult({
                    result: false,
                    message: err
                });
            })
            .then(ready);
    });

    QUnit.test('getCurrentNavigable', function (assert) {
        var ready = assert.async();
        var group = document.querySelector('#qunit-fixture .interleaved');
        var elements = document.querySelectorAll('#qunit-fixture .interleaved .nav.group-1');
        var elements2 = document.querySelectorAll('#qunit-fixture .interleaved .nav.group-2');
        var navElements = navigableDomElement.createFromDoms(elements);
        var instance = keyNavigatorFactory({
            group: $(group),
            elements: navElements
        });

        assert.expect(16);

        Promise.resolve()
            .then(function () {
                return new Promise(function (resolve) {
                    if (document.activeElement) {
                        document.activeElement.blur();
                    }

                    assert.equal(document.activeElement, document.body, 'No element in focus');
                    assert.equal(instance.getCurrentNavigable(), null, 'There is no current element yet');

                    instance.focus();

                    setTimeout(resolve, testDelay);
                });
            })
            .then(function () {
                return new Promise(function (resolve) {
                    assert.equal(document.activeElement, elements[0], 'The first element got the focus');
                    assert.equal(
                        instance.getCurrentNavigable(),
                        navElements[0],
                        'The current element is the first navigable'
                    );

                    document.activeElement.blur();

                    setTimeout(resolve, testDelay);
                });
            })
            .then(function () {
                return new Promise(function (resolve) {
                    assert.equal(document.activeElement, document.body, 'No element in focus');
                    assert.equal(instance.getCurrentNavigable(), null, 'There is no current element again');

                    instance.focus();

                    setTimeout(resolve, testDelay);
                });
            })
            .then(function () {
                return new Promise(function (resolve) {
                    assert.equal(document.activeElement, elements[0], 'The first element got the focus back');
                    assert.equal(
                        instance.getCurrentNavigable(),
                        navElements[0],
                        'The current element is the first navigable'
                    );

                    elements[1].focus();

                    setTimeout(resolve, testDelay);
                });
            })
            .then(function () {
                return new Promise(function (resolve) {
                    assert.equal(document.activeElement, elements[1], 'The second element got the focus back');
                    assert.equal(
                        instance.getCurrentNavigable(),
                        navElements[1],
                        'The current element is the second navigable'
                    );

                    elements2[0].focus();

                    setTimeout(resolve, testDelay);
                });
            })
            .then(function () {
                return new Promise(function (resolve) {
                    assert.equal(
                        document.activeElement,
                        elements2[0],
                        'The first element of another group got the focus'
                    );
                    assert.equal(instance.getCurrentNavigable(), null, 'There is no current element again');

                    elements[elements.length - 1].focus();

                    setTimeout(resolve, testDelay);
                });
            })
            .then(function () {
                return new Promise(function (resolve) {
                    assert.equal(
                        document.activeElement,
                        elements[elements.length - 1],
                        'The last element of the group got the focus'
                    );
                    assert.equal(
                        instance.getCurrentNavigable(),
                        navElements[navElements.length - 1],
                        'The current element is the last navigable'
                    );

                    instance.destroy();

                    setTimeout(resolve, testDelay);
                });
            })
            .then(function () {
                assert.equal(document.activeElement, document.body, 'No element in focus');
                assert.deepEqual(instance.getCurrentNavigable(), null, 'There is no current element now');
            })
            .catch(function (err) {
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

        Promise.resolve()
            .then(function () {
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
            .then(function () {
                return new Promise(function (resolve) {
                    assert.equal(document.activeElement, first, 'The first element got the focus');
                    assert.equal(group.classList.contains('focusin'), true, 'The fixture got the focusin CSS class');
                    assert.equal(instance.isFocused(), true, 'The group is focused');

                    document.activeElement.blur();

                    setTimeout(resolve, testDelay);
                });
            })
            .then(function () {
                return new Promise(function (resolve) {
                    assert.equal(document.activeElement, document.body, 'No element in focus');
                    assert.equal(group.classList.contains('focusin'), false, 'The fixture loose the focusin CSS class');
                    assert.equal(instance.isFocused(), false, 'The group is not focused');

                    elements2[0].focus();

                    setTimeout(resolve, testDelay);
                });
            })
            .then(function () {
                return new Promise(function (resolve) {
                    assert.equal(
                        document.activeElement,
                        elements2[0],
                        'The first element of another group got the focus'
                    );
                    assert.equal(
                        group.classList.contains('focusin'),
                        false,
                        "The fixture still doesn't have the focusin CSS class"
                    );
                    assert.equal(instance.isFocused(), false, 'The group is not focused');

                    instance.focus();

                    setTimeout(resolve, testDelay);
                });
            })
            .then(function () {
                return new Promise(function (resolve) {
                    assert.equal(document.activeElement, first, 'The first element got the focus');
                    assert.equal(group.classList.contains('focusin'), true, 'The fixture got the focusin CSS class');
                    assert.equal(instance.isFocused(), true, 'The group is focused');

                    elements2[0].focus();

                    setTimeout(resolve, testDelay);
                });
            })
            .then(function () {
                return new Promise(function (resolve) {
                    assert.equal(
                        document.activeElement,
                        elements2[0],
                        'The first element of another group got the focus'
                    );
                    assert.equal(group.classList.contains('focusin'), false, 'The fixture loose the focusin CSS class');
                    assert.equal(instance.isFocused(), false, 'The group is not focused');

                    last.focus();

                    setTimeout(resolve, testDelay);
                });
            })
            .then(function () {
                return new Promise(function (resolve) {
                    assert.equal(document.activeElement, last, 'The last element of the group got the focus');
                    assert.equal(group.classList.contains('focusin'), true, 'The fixture got the focusin CSS class');
                    assert.equal(instance.isFocused(), true, 'The group is focused');

                    instance.destroy();

                    setTimeout(resolve, testDelay);
                });
            })
            .then(function () {
                assert.equal(document.activeElement, document.body, 'No element in focus');
                assert.equal(group.classList.contains('focusin'), false, 'The fixture loose the focusin CSS class');
                assert.equal(instance.isFocused(), false, 'The group is not focused anymore');

                instance2.destroy();
            })
            .catch(function (err) {
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
        }).on('activate', function (cursor) {
            assert.ok(true, 'activated');
            assert.equal(cursor.position, 2, 'activated position is ok');
            assert.ok(cursor.navigable.getElement() instanceof $, 'navigable element in cursor');
            assert.equal(cursor.navigable.getElement().data('id'), 'C', 'navigable element in cursor is correct');
            ready();
        });

        keyNavigator.focus();
        assert.equal($(document.activeElement).data('id'), 'C', 'focus on last');
        $(document.activeElement).simulate('keydown', { keyCode: 13 }); //Enter
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

        $(document.activeElement).simulate('keydown', { keyCode: 40 }); //Down
        assert.equal($(document.activeElement).data('id'), 'C', 'stay on last');

        $(document.activeElement).simulate('keydown', { keyCode: 38 }); //Up
        assert.equal($(document.activeElement).data('id'), 'B', 'focus on second');

        $(document.activeElement).simulate('keydown', { keyCode: 37 }); //Left
        assert.equal($(document.activeElement).data('id'), 'A', 'focus on first');

        $(document.activeElement).simulate('keydown', { keyCode: 38 }); //Up
        assert.equal($(document.activeElement).data('id'), 'A', 'stay on first');

        $(document.activeElement).simulate('keydown', { keyCode: 39 }); //Right
        assert.equal($(document.activeElement).data('id'), 'B', 'focus on second');

        $(document.activeElement).simulate('keydown', { keyCode: 13 }); //Enter
    });

    QUnit.test('isFocused', function (assert) {
        var keyNavigator;
        var $container = $('#qunit-fixture .nav-1');
        var $elements = $container.find('.nav');
        var elements = navigableDomElement.createFromDoms($elements);

        assert.expect(4);

        assert.equal(elements.length, 3, 'navigable element created');

        keyNavigator = keyNavigatorFactory({ elements: elements });

        assert.ok(!keyNavigator.isFocused(), 'the navigator is not on focus');
        keyNavigator.focus();
        assert.ok(keyNavigator.isFocused(), 'the keyNavigator is now on focus');
        keyNavigator.blur();
        assert.ok(!keyNavigator.isFocused(), 'the navigator is now blurred');
    });

    QUnit.test('isFocused when nav is deleted', function (assert) {
        var ready = assert.async();
        var keyNavigator;
        var $container = $('#qunit-fixture .nav-4');
        var $elements = $container.find('.nav');
        var elements = navigableDomElement.createFromDoms($elements);

        assert.expect(2);

        keyNavigator = keyNavigatorFactory({ elements: elements, group: $container });
        keyNavigator.focus();

        new Promise(function (resolve) {
            setTimeout(resolve, testDelay);
        })
            .then(function () {
                return new Promise(function (resolve) {
                    assert.ok($container.hasClass('focusin'), 'container has focusin class');
                    $elements.remove();
                    setTimeout(resolve, testDelay);
                });
            })
            .then(function () {
                assert.ok(!$container.hasClass('focusin'), 'container has no focusin class anymore');
                ready();
            });
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
            'focus on a navigator with keep state on should reset the cursor'
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
            'focus on a navigator with keep state on should restore the cursor in memory'
        );

        keyNavigator.activate();
    });

    QUnit.test('activate with space', function (assert) {
        const ready = assert.async();
        const $container = $('#qunit-fixture .nav-2');
        const $elements = $container.find('.nav');
        const elements = navigableDomElement.createFromDoms($elements);

        const $textarea = $('textarea', $container);
        assert.expect(7);

        assert.equal(elements.length, 3, 'navigable element created');

        const keyNavigator = keyNavigatorFactory({
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

                $textarea.simulate('keydown', { keyCode: 32 }); //Space-> should not blur
                $textarea.simulate('keyup', { keyCode: 32 }); //Space

                setTimeout(function () {
                    keyNavigator.off('blur');
                    ready();
                }, 100);
            });

        keyNavigator.focus();
        assert.equal($(document.activeElement).data('id'), 'A', 'focus on first');

        $(document.activeElement).simulate('keydown', { keyCode: 39 }); //Right
        assert.equal($(document.activeElement).data('id'), 'B', 'focus on second');

        $(document.activeElement).simulate('keydown', { keyCode: 39 }); //Right
        assert.equal($(document.activeElement).data('id'), 'C', 'focus on third');

        $(document.activeElement).simulate('keyup', { keyCode: 32 }); //Space -> activate
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

    QUnit.test('position based on movement', function (assert) {
        var keyNavigator;
        var $container = $('#qunit-fixture');
        var navigatorSelectors = ['.nav-1', '.nav-2', '.nav-3'];

        function createNavigator(selector) {
            var $group = $container.find(selector);
            return keyNavigatorFactory({
                elements: navigableDomElement.createFromDoms($group.find('[data-id]')),
                group: $group
            });
        }

        assert.expect(8);

        keyNavigator = keyNavigatorFactory({
            elements: navigatorSelectors.map(createNavigator),
            group: $container
        });

        keyNavigator.focus();
        assert.equal(
            document.activeElement,
            $container.find('.nav-1 [data-id=A]').get(0),
            'focus on first group, first element'
        );

        keyNavigator.next();
        assert.equal(
            document.activeElement,
            $container.find('.nav-2 [data-id=A]').get(0),
            'focus on second group, first element'
        );

        keyNavigator.next();
        assert.equal(
            document.activeElement,
            $container.find('.nav-3 [data-id=A]').get(0),
            'focus on third group, first element'
        );

        keyNavigator.previous();
        assert.equal(
            document.activeElement,
            $container.find('.nav-2 [data-id=C]').get(0),
            'focus on second group, last element'
        );

        keyNavigator.previous();
        assert.equal(
            document.activeElement,
            $container.find('.nav-1 [data-id=C]').get(0),
            'focus on first group, last element'
        );

        keyNavigator.next();
        assert.equal(
            document.activeElement,
            $container.find('.nav-2 [data-id=A]').get(0),
            'focus on second group, first element'
        );

        keyNavigator.blur();
        assert.notEqual(document.activeElement, $container.find('.nav-2 [data-id=A]').get(0), 'focus loss');

        keyNavigator.focus();
        assert.equal(
            document.activeElement,
            $container.find('.nav-1 [data-id=A]').get(0),
            'focus on first group, first element'
        );
    });

    QUnit.test('position based on movement and default', function (assert) {
        var keyNavigator;
        var $container = $('#qunit-fixture');
        var navigators = [];
        var expectedDirection = 1;

        function createNavigator(selector) {
            var $group = $container.find(selector);
            var $elements = $group.find('[data-id]');
            var elements = navigableDomElement.createFromDoms($elements);
            return keyNavigatorFactory({
                elements: elements,
                group: $group,
                defaultPosition: function (navigableElements, direction) {
                    var position = -1;
                    assert.deepEqual(navigableElements, elements, 'The list of focusable elements has been supplied');
                    assert.equal(direction, expectedDirection, 'The expected movement direction has been given');
                    $elements.each(function (index, input) {
                        if (input.checked) {
                            position = index;
                        }
                    });
                    return position;
                }
            });
        }

        navigators.push(createNavigator('.nav-1'));
        navigators.push(createNavigator('.nav-2'));
        navigators.push(createNavigator('.nav-3'));

        $container.find('.nav-3 input[data-id=B]').attr('checked', true);

        assert.expect(22);

        keyNavigator = keyNavigatorFactory({
            elements: navigators,
            group: $container
        });

        keyNavigator.focus();
        assert.equal(
            document.activeElement,
            $container.find('.nav-1 [data-id=A]').get(0),
            'focus on first group, first element'
        );

        keyNavigator.next();
        assert.equal(
            document.activeElement,
            $container.find('.nav-2 [data-id=A]').get(0),
            'focus on second group, first element'
        );

        keyNavigator.next();
        assert.equal(
            document.activeElement,
            $container.find('.nav-3 [data-id=B]').get(0),
            'focus on third group, checked element'
        );

        expectedDirection = -1;
        keyNavigator.previous();
        assert.equal(
            document.activeElement,
            $container.find('.nav-2 [data-id=C]').get(0),
            'focus on second group, last element'
        );

        keyNavigator.previous();
        assert.equal(
            document.activeElement,
            $container.find('.nav-1 [data-id=C]').get(0),
            'focus on first group, last element'
        );

        expectedDirection = 1;
        keyNavigator.next();
        assert.equal(
            document.activeElement,
            $container.find('.nav-2 [data-id=A]').get(0),
            'focus on second group, first element'
        );

        keyNavigator.blur();
        assert.notEqual(document.activeElement, $container.find('.nav-2 [data-id=A]').get(0), 'focus loss');

        keyNavigator.focus();
        assert.equal(
            document.activeElement,
            $container.find('.nav-1 [data-id=A]').get(0),
            'focus on first group, first element'
        );
    });
});
