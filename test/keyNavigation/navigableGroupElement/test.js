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
    'ui/keyNavigation/navigableGroupElement'
], function (
    $,
    _,
    keyNavigatorFactory,
    navigableDomElement,
    navigableGroupElement
) {
    'use strict';

    var fixtureSelector = '#qunit-fixture';
    var fixtureGroup1 = '#qunit-fixture .group-1';
    var fixtureGroup2 = '#qunit-fixture .group-2';
    var testDelay = 2;

    QUnit.module('navigableGroupElement');

    QUnit.test('factory', function (assert) {
        var elements = navigableDomElement.createFromDoms($(fixtureGroup1));
        var keyNavigator = keyNavigatorFactory({
            group: $(fixtureSelector),
            elements: elements
        });

        assert.expect(4);
        assert.equal(typeof navigableGroupElement, 'function', 'The module exposes a function');
        assert.equal(typeof navigableGroupElement(keyNavigator), 'object', 'The factory creates an object');
        assert.notDeepEqual(navigableGroupElement(keyNavigator), navigableGroupElement(keyNavigator), 'The factory creates new objects');
        assert.equal(typeof navigableGroupElement.createFromNavigators, 'function', 'The factory exposes the function createFromNavigators');

        keyNavigator.destroy();
    });

    QUnit.cases.init([
        {title: 'init'},
        {title: 'destroy'},
        {title: 'getElement'},
        {title: 'isVisible'},
        {title: 'isEnabled'},
        {title: 'isFocused'},
        {title: 'blur'},
        {title: 'focus'},
        {title: 'getKeyNavigator'}
    ]).test('api ', function (data, assert) {
        var elements = navigableDomElement.createFromDoms($(fixtureGroup1));
        var keyNavigator = keyNavigatorFactory({
            group: $(fixtureSelector),
            elements: elements
        });
        var instance = navigableGroupElement(keyNavigator);
        assert.expect(1);
        assert.equal(typeof instance[data.title], 'function', 'The navigator exposes a "' + data.title + '" function');
        keyNavigator.destroy();
    });

    QUnit.test('init parameter / getElement / getKeyNavigator', function (assert) {
        var expected = document.querySelector(fixtureSelector);
        var elements = navigableDomElement.createFromDoms($(fixtureGroup1));
        var keyNavigator = keyNavigatorFactory({
            group: $(fixtureSelector),
            elements: elements
        });
        var instance = navigableGroupElement(keyNavigator);

        assert.expect(6);

        assert.ok(instance.getElement() instanceof $, 'The instance has a jQuery selection for the represented element');
        assert.equal(instance.getElement().get(0), expected, 'The instance has selected the right element');

        assert.equal(instance.getKeyNavigator(), keyNavigator, 'The instance exposes the keyNavigator');

        assert.throws(function () {
            navigableGroupElement();
        }, 'The keyNavigator is mandatory');

        assert.throws(function () {
            navigableGroupElement(keyNavigatorFactory({
                group: $(),
                elements: elements
            }));
        }, 'The group must be valid');

        assert.throws(function () {
            navigableGroupElement(keyNavigatorFactory({
                group: $('<div />'),
                elements: elements
            }));
        }, 'The group must exist');

        keyNavigator.destroy();
    });

    QUnit.test('init / destroy / focus', function (assert) {
        var ready = assert.async();
        var elements = navigableDomElement.createFromDoms($(fixtureGroup1));
        var keyNavigator = keyNavigatorFactory({
            group: $(fixtureSelector),
            elements: elements
        });
        var fixture = document.querySelector(fixtureSelector);
        var instance = navigableGroupElement(keyNavigator);

        assert.expect(21);

        Promise
            .resolve()
            .then(function() {
                return new Promise(function (resolve) {
                    if (document.activeElement) {
                        document.activeElement.blur();
                    }

                    assert.equal(document.activeElement, document.body, 'No element in focus');
                    assert.equal(fixture.className, 'key-navigation-group', 'The fixture has the initial CSS class');
                    assert.equal(instance.init(), instance, 'The init method is fluent');
                    assert.equal(instance.focus(), instance, 'The focus method is fluent');

                    setTimeout(resolve, testDelay);
                });
            })
            .then(function() {
                return new Promise(function (resolve) {
                    assert.equal(document.activeElement, $(fixtureGroup1).first().get(0), 'The first element got the focus');
                    assert.equal(fixture.classList.contains('focusin'), true, 'The fixture got the focusin CSS class');

                    document.activeElement.blur();

                    setTimeout(resolve, testDelay);
                });
            })
            .then(function() {
                return new Promise(function (resolve) {
                    assert.equal(document.activeElement, document.body, 'No element in focus');
                    assert.equal(fixture.classList.contains('focusin'), false, 'The fixture loose the focusin CSS class');

                    assert.equal(instance.focus(), instance, 'The focus method is fluent');

                    setTimeout(resolve, testDelay);
                });
            })
            .then(function() {
                return new Promise(function (resolve) {
                    assert.equal(document.activeElement, $(fixtureGroup1).first().get(0), 'The first element got the focus');
                    assert.equal(fixture.classList.contains('focusin'), true, 'The fixture got the focusin CSS class');
                    assert.equal(instance.isFocused(), true, 'The group is focused');

                    $(fixtureGroup2).first().focus();

                    setTimeout(resolve, testDelay);
                });
            })
            .then(function() {
                return new Promise(function (resolve) {
                    assert.equal(document.activeElement, $(fixtureGroup2).first().get(0), 'The first element of another group got the focus');
                    assert.equal(fixture.classList.contains('focusin'), false, 'The fixture loose the focusin CSS class');
                    assert.equal(instance.isFocused(), false, 'The group is not focused');

                    $(fixtureGroup1).last().focus();

                    setTimeout(resolve, testDelay);
                });
            })
            .then(function() {
                return new Promise(function (resolve) {
                    assert.equal(document.activeElement, $(fixtureGroup1).last().get(0), 'The last element of the group got the focus');
                    assert.equal(fixture.classList.contains('focusin'), true, 'The fixture got the focusin CSS class');
                    assert.equal(instance.isFocused(), true, 'The group is focused');

                    assert.equal(instance.destroy(), instance, 'The destroy method is fluent');

                    setTimeout(resolve, testDelay);
                });
            })
            .then(function() {
                assert.equal(document.activeElement, $(fixtureGroup1).last().get(0), 'The element still has the focus');
                assert.equal(fixture.classList.contains('focusin'), false, 'The fixture loose the focusin CSS class');

                keyNavigator.destroy();
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
        var elements = navigableDomElement.createFromDoms($(fixtureGroup1));
        var keyNavigator = keyNavigatorFactory({
            group: $(fixtureSelector),
            elements: elements
        });
        var instance = navigableGroupElement(keyNavigator);

        assert.expect(3);

        assert.equal(instance.isVisible(), true, 'The group is visible');

        $(fixtureGroup1).hide();

        assert.equal(instance.isVisible(), false, 'The group is not visible anymore');

        $(fixtureGroup1).first().show();

        assert.equal(instance.isVisible(), true, 'One element of the group is visible');

        keyNavigator.destroy();
    });

    QUnit.test('isEnabled', function (assert) {
        var $elements = $(fixtureGroup2);
        var elements = navigableDomElement.createFromDoms($elements);
        var keyNavigator = keyNavigatorFactory({
            group: $(fixtureSelector),
            elements: elements
        });
        var instance = navigableGroupElement(keyNavigator);

        assert.expect(3);

        assert.equal(instance.isEnabled(), true, 'The group is enabled');

        $elements.attr('disabled', 'true');

        assert.equal(instance.isEnabled(), false, 'The group is disabled');

        $elements.first().removeAttr('disabled');

        assert.equal(instance.isEnabled(), true, 'One element of the group is enabled');

        keyNavigator.destroy();
    });

    QUnit.test('isFocused', function (assert) {
        var ready = assert.async();
        var fixture = document.querySelector(fixtureSelector);
        var keyNavigator = keyNavigatorFactory({
            group: $(fixtureSelector),
            elements: navigableDomElement.createFromDoms($(fixtureGroup1))
        });
        var instance = navigableGroupElement(keyNavigator);

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
                    assert.equal(document.activeElement, $(fixtureGroup1).first().get(0), 'The first element got the focus');
                    assert.equal(fixture.classList.contains('focusin'), true, 'The fixture got the focusin CSS class');
                    assert.equal(instance.isFocused(), true, 'The group is focused');

                    document.activeElement.blur();

                    setTimeout(resolve, testDelay);
                });
            })
            .then(function() {
                return new Promise(function (resolve) {
                    assert.equal(document.activeElement, document.body, 'No element in focus');
                    assert.equal(fixture.classList.contains('focusin'), false, 'The fixture loose the focusin CSS class');
                    assert.equal(instance.isFocused(), false, 'The group is not focused');

                    $(fixtureGroup2).first().focus();

                    setTimeout(resolve, testDelay);
                });
            })
            .then(function() {
                return new Promise(function (resolve) {
                    assert.equal(document.activeElement, $(fixtureGroup2).first().get(0), 'The first element of another group got the focus');
                    assert.equal(fixture.classList.contains('focusin'), false, 'The fixture still doesn\'t have the focusin CSS class');
                    assert.equal(instance.isFocused(), false, 'The group is not focused');

                    instance.focus();

                    setTimeout(resolve, testDelay);
                });
            })
            .then(function() {
                return new Promise(function (resolve) {
                    assert.equal(document.activeElement, $(fixtureGroup1).first().get(0), 'The first element got the focus');
                    assert.equal(fixture.classList.contains('focusin'), true, 'The fixture got the focusin CSS class');
                    assert.equal(instance.isFocused(), true, 'The group is focused');

                    $(fixtureGroup2).first().focus();

                    setTimeout(resolve, testDelay);
                });
            })
            .then(function() {
                return new Promise(function (resolve) {
                    assert.equal(document.activeElement, $(fixtureGroup2).first().get(0), 'The first element of another group got the focus');
                    assert.equal(fixture.classList.contains('focusin'), false, 'The fixture loose the focusin CSS class');
                    assert.equal(instance.isFocused(), false, 'The group is not focused');

                    $(fixtureGroup1).last().focus();

                    setTimeout(resolve, testDelay);
                });
            })
            .then(function() {
                return new Promise(function (resolve) {
                    assert.equal(document.activeElement, $(fixtureGroup1).last().get(0), 'The last element of the group got the focus');
                    assert.equal(fixture.classList.contains('focusin'), true, 'The fixture got the focusin CSS class');
                    assert.equal(instance.isFocused(), true, 'The group is focused');

                    instance.destroy();

                    setTimeout(resolve, testDelay);
                });
            })
            .then(function() {
                assert.equal(document.activeElement, $(fixtureGroup1).last().get(0), 'The element still has the focus');
                assert.equal(fixture.classList.contains('focusin'), false, 'The fixture loose the focusin CSS class');
                assert.equal(instance.isFocused(), true, 'The group is focused');

                keyNavigator.destroy();
            })
            .catch(function(err) {
                assert.pushResult({
                    result: false,
                    message: err
                });
            })
            .then(ready);
    });

    QUnit.test('createFromNavigators', function (assert) {
        var navigators = [
            keyNavigatorFactory({
                group: $(fixtureSelector),
                elements: navigableDomElement.createFromDoms($(fixtureGroup1))
            }),
            keyNavigatorFactory({
                group: $(fixtureSelector),
                elements: navigableDomElement.createFromDoms($(fixtureGroup2))
            })
        ];
        var instances = navigableGroupElement.createFromNavigators(navigators);

        assert.expect(4 + navigators.length);

        assert.deepEqual(navigableGroupElement.createFromNavigators(), [], 'No list, no instances');
        assert.deepEqual(navigableGroupElement.createFromNavigators([]), [], 'Empty list, no instances');
        assert.deepEqual(navigableGroupElement.createFromNavigators($()), [], 'Empty collection, no instances');

        assert.equal(instances.length, navigators.length, 'The expected number of instances has been created');
        navigators.forEach(function (navigator, i) {
            assert.equal(instances[i].getKeyNavigator(), navigator, 'The instance relates to the expected navigator');
        });

        navigators.forEach(function (navigator) {
            navigator.destroy();
        });
    });

});
