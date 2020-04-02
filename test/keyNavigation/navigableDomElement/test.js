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
    'ui/keyNavigation/navigableDomElement',
    'lib/simulator/jquery.simulate'
], function (
    $,
    _,
    navigableDomElement
) {
    'use strict';

    var fixtureSelector = '#qunit-fixture .test-element';

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

    QUnit.module('navigableDomElement');

    QUnit.test('factory', function (assert) {
        assert.expect(5);
        assert.equal(typeof navigableDomElement, 'function', 'The module exposes a function');
        assert.equal(typeof navigableDomElement(), 'object', 'The factory creates an object');
        assert.notDeepEqual(navigableDomElement(), navigableDomElement(), 'The factory creates new objects');
        assert.equal(typeof navigableDomElement.createFromDoms, 'function', 'The factory exposes the function createFromDoms');
        assert.equal(typeof navigableDomElement.isNavigableElement, 'function', 'The factory exposes the function isNavigableElement');
    });

    QUnit.cases.init([
        {title: 'on'},
        {title: 'off'},
        {title: 'trigger'},
        {title: 'spread'}
    ]).test('event API ', function (data, assert) {
        var instance = navigableDomElement();
        assert.expect(1);
        assert.equal(typeof instance[data.title], 'function', 'The navigator exposes a "' + data.title + '" function');
    });

    QUnit.cases.init([
        {title: 'init'},
        {title: 'destroy'},
        {title: 'getType'},
        {title: 'getElement'},
        {title: 'isVisible'},
        {title: 'isEnabled'},
        {title: 'isFocused'},
        {title: 'blur'},
        {title: 'focus'}
    ]).test('component API ', function (data, assert) {
        var instance = navigableDomElement();
        assert.expect(1);
        assert.equal(typeof instance[data.title], 'function', 'The navigator exposes a "' + data.title + '" function');
    });

    QUnit.test('init parameter / getElement', function (assert) {
        var expected = document.querySelector(fixtureSelector);
        var instance;

        assert.expect(7);

        instance = navigableDomElement(expected);
        assert.ok(instance.getElement() instanceof $, 'Element: The instance has a jQuery selection for the represented element');
        assert.equal(instance.getElement().get(0), expected, 'Element: The instance has selected the right element');
        assert.equal(instance.getType(), 'element', 'This is a navigable element');

        instance = navigableDomElement(fixtureSelector);
        assert.ok(instance.getElement() instanceof $, 'CSS Selector: The instance has a jQuery selection for the represented element');
        assert.equal(instance.getElement().get(0), expected, 'CSS Selector: The instance has selected the right element');

        instance = navigableDomElement($(fixtureSelector));
        assert.ok(instance.getElement() instanceof $, 'jQuery: The instance has a jQuery selection for the represented element');
        assert.equal(instance.getElement().get(0), expected, 'jQuery: The instance has selected the right element');
    });

    QUnit.test('init / destroy', function (assert) {
        var fixture = document.querySelector(fixtureSelector);
        var instance = navigableDomElement(fixture);

        assert.expect(10);

        assert.equal(fixture.className, 'test-element', 'The fixture has the initial CSS class');
        assert.equal(fixture.getAttribute('tabindex'), undefined, 'The fixture doesn\'t have a tabindex');

        assert.equal(instance.init(), instance, 'The init method is fluent');
        assert.equal(fixture.classList.contains('key-navigation-highlight'), true, 'The fixture got the navigable CSS class');
        assert.equal(fixture.getAttribute('tabindex'), '-1', 'The fixture now has a disabled tabindex');

        assert.equal(instance.destroy(), instance, 'The destroy method is fluent');
        assert.equal(fixture.className, 'test-element', 'The fixture has the initial CSS class');
        assert.equal(fixture.getAttribute('tabindex'), undefined, 'The fixture doesn\'t have a tabindex');

        assert.throws(function () {
            navigableDomElement().init();
        }, 'An error is raised if no element was provided');

        assert.throws(function () {
            navigableDomElement().init('.dummy');
        }, 'An error is raised if the element does not exist');
    });

    QUnit.test('isVisible', function (assert) {
        var fixture = document.querySelector(fixtureSelector);
        var instance = navigableDomElement(fixture);

        assert.expect(2);

        assert.equal(instance.isVisible(), true, 'The element is visible');

        fixture.style.display = 'none';

        assert.equal(instance.isVisible(), false, 'The element is not visible anymore');
    });

    QUnit.test('isEnabled', function (assert) {
        var fixture = document.querySelector(fixtureSelector);
        var instance = navigableDomElement(fixture);

        assert.expect(2);

        assert.equal(instance.isEnabled(), true, 'The element is enabled');

        fixture.setAttribute('disabled', 'true');

        assert.equal(instance.isEnabled(), false, 'The element is disabled');
    });

    QUnit.test('focus / isFocused', function (assert) {
        var ready = assert.async();
        var fixture = document.querySelector(fixtureSelector);
        var inner = fixture.querySelector('.inner-element');
        var instance = navigableDomElement(fixture);

        function promiseFocus(event, expectedEl) {
            return promiseEvent(instance, event)
                .then(function (args) {
                    assert.ok(true, 'The ' + event + ' event has been triggered');
                    assert.equal(args[0], expectedEl, 'The expected element has been supplied');
                })
                .catch(function () {
                    assert.ok(false, 'The ' + event + ' event has not been triggered!');
                });
        }

        assert.expect(16);

        Promise.resolve()
            .then(function () {
                if (document.activeElement) {
                    document.activeElement.blur();
                }

                instance.init();

                assert.equal(document.activeElement, document.body, 'No element in focus');
                assert.equal(instance.isFocused(), false, 'The element is not focused');
            })
            .then(function () {
                var p = promiseFocus('focus', fixture);
                assert.equal(instance.focus(), instance, 'The focus method is fluent');
                return p;
            })
            .then(function () {
                var p = promiseFocus('blur', fixture);

                assert.equal(document.activeElement, instance.getElement().get(0), 'The element got the focus');
                assert.equal(instance.isFocused(), true, 'The element is focused');

                assert.equal(instance.blur(), instance, 'The blur method is fluent');

                return p;
            })
            .then(function () {
                var p = promiseFocus('focus', inner);

                assert.equal(document.activeElement, document.body, 'No element in focus');
                assert.equal(instance.isFocused(), false, 'The element is not focused');

                inner.focus();

                return p;
            })
            .then(function () {
                assert.equal(document.activeElement, inner, 'The inner element got the focus');
                assert.equal(instance.isFocused(), true, 'The element is focused');

                instance.destroy();
            })
            .catch(function (err) {
                assert.pushResult({
                    result: false,
                    message: err
                });
            })
            .then(ready);
    });

    QUnit.test('keyboard', function (assert) {
        var ready = assert.async();
        var container = document.querySelector('#qunit-fixture');
        var fixture = document.querySelector(fixtureSelector);
        var inner = fixture.querySelector('.inner-element');
        var instance = navigableDomElement(fixture);

        function promiseKeyboard(expectedKey, expectedEl) {
            return promiseEvent(instance, 'key')
                .then(function (args) {
                    assert.ok(true, 'The key event has been triggered');
                    assert.equal(args[0], expectedKey, 'The key ' + expectedKey + ' has been pressed');
                    assert.equal(args[1], expectedEl, 'The expected element has been supplied');
                })
                .catch(function () {
                    assert.ok(false, 'The key event has not been triggered!');
                });
        }

        function promisePropagateTab(shiftKey) {
            return promiseEvent($(container), 'keydown')
                .then(function(args) {
                    assert.equal(args[0].keyCode, 9, 'The TAB key has been forwarded!');
                    assert.equal(args[0].shiftKey, shiftKey, 'The Shift key has been forwarded!');
                })
                .catch(function() {
                    assert.ok(false, 'The TAB key has not been forwarded!');
                })
        }

        function promiseNotPropagateTab() {
            return promiseEvent($(container), 'keydown')
                .then(function() {
                    assert.ok(false, 'The TAB key has been forwarded while it should not!');
                })
                .catch(function() {
                    assert.ok(true, 'The TAB key has not been forwarded!');
                })
        }

        assert.expect(44);

        Promise.resolve()
            .then(function () {
                if (document.activeElement) {
                    document.activeElement.blur();
                }

                instance.init({propagateTab: true});

                assert.equal(document.activeElement, document.body, 'No element in focus');
                assert.equal(instance.isFocused(), false, 'The element is not focused');

                instance.focus();

                assert.equal(document.activeElement, instance.getElement().get(0), 'The element got the focus');
                assert.equal(instance.isFocused(), true, 'The element is focused');
            })
            .then(function () {
                var p = Promise.all([
                    promiseKeyboard('tab', inner),
                    promisePropagateTab(false),
                ]);

                $(inner).simulate('keydown', {keyCode: 9}); //Tab

                return p;
            })
            .then(function () {
                var p = Promise.all([
                    promiseKeyboard('shift+tab', inner),
                    promisePropagateTab(true)
                ]);

                $(inner).simulate('keydown', {keyCode: 9, shiftKey: true}); //Shift+Tab

                return p;
            })
            .then(function () {
                if (document.activeElement) {
                    document.activeElement.blur();
                }

                instance.destroy();
                instance.init({propagateTab: false});

                assert.equal(document.activeElement, document.body, 'No element in focus');
                assert.equal(instance.isFocused(), false, 'The element is not focused');

                instance.focus();

                assert.equal(document.activeElement, instance.getElement().get(0), 'The element got the focus');
                assert.equal(instance.isFocused(), true, 'The element is focused');
            })
            .then(function () {
                var p = Promise.all([
                    promiseKeyboard('tab', inner),
                    promiseNotPropagateTab()
                ]);

                $(inner).simulate('keydown', {keyCode: 9}); //Tab

                return p;
            })
            .then(function () {
                var p = Promise.all([
                    promiseKeyboard('shift+tab', inner),
                    promiseNotPropagateTab()
                ]);

                $(inner).simulate('keydown', {keyCode: 9, shiftKey: true}); //Shift+Tab

                return p;
            })
            .then(function () {
                var p = promiseKeyboard('left', inner);

                $(container).off('.test');
                $(inner).simulate('keydown', {keyCode: 37}); //Left

                return p;
            })
            .then(function () {
                var p = promiseKeyboard('up', inner);

                $(inner).simulate('keydown', {keyCode: 38}); //Up

                return p;
            })
            .then(function () {
                var p = promiseKeyboard('right', inner);

                $(inner).simulate('keydown', {keyCode: 39}); //Right

                return p;
            })
            .then(function () {
                var p = promiseKeyboard('down', inner);

                $(inner).simulate('keydown', {keyCode: 40}); //Down

                return p;
            })
            .then(function () {
                var p = promiseKeyboard('space', inner);

                $(inner).simulate('keyup', {keyCode: 32}); //Space

                return p;
            })
            .then(function () {
                var p = promiseKeyboard('enter', inner);

                $(inner).simulate('keydown', {keyCode: 13}); //Enter

                return p;
            })
            .then(function () {
                instance.destroy();
            })
            .catch(function (err) {
                assert.pushResult({
                    result: false,
                    message: err
                });
            })
            .then(ready);
    });

    QUnit.test('keyboard on input field', function (assert) {
        var ready = assert.async();
        var fixture = document.querySelector('#qunit-fixture [data-fixture="input"]');
        var instance = navigableDomElement(fixture);

        function promiseKeyboard(expectedKey, expectedEl) {
            return promiseEvent(instance, 'key')
                .then(function (args) {
                    assert.ok(true, 'The key event has been triggered');
                    assert.equal(args[0], expectedKey, 'The key ' + expectedKey + ' has been pressed');
                    assert.equal(args[1], expectedEl, 'The expected element has been supplied');
                })
                .catch(function () {
                    assert.ok(false, 'The key event has not been triggered!');
                });
        }

        function promisePrevented() {
            return promiseEvent(instance, 'key')
                .then(function () {
                    assert.ok(false, 'The key event has been triggered');
                })
                .catch(function () {
                    assert.ok(true, 'The key event has not been triggered!');
                });
        }

        assert.expect(16);

        Promise.resolve()
            .then(function () {
                if (document.activeElement) {
                    document.activeElement.blur();
                }

                instance.init();

                assert.equal(document.activeElement, document.body, 'No element in focus');
                assert.equal(instance.isFocused(), false, 'The element is not focused');

                instance.focus();

                assert.equal(document.activeElement, instance.getElement().get(0), 'The element got the focus');
                assert.equal(instance.isFocused(), true, 'The element is focused');
            })
            .then(function () {
                var p = promiseKeyboard('tab', fixture);

                $(fixture).simulate('keydown', {keyCode: 9}); //Tab

                return p;
            })
            .then(function () {
                var p = promiseKeyboard('shift+tab', fixture);

                $(fixture).simulate('keydown', {keyCode: 9, shiftKey: true}); //Shift+Tab

                return p;
            })
            .then(function () {
                var p = promisePrevented();

                $(fixture).simulate('keydown', {keyCode: 37}); //Left

                return p;
            })
            .then(function () {
                var p = promisePrevented();

                $(fixture).simulate('keydown', {keyCode: 38}); //Up

                return p;
            })
            .then(function () {
                var p = promisePrevented();

                $(fixture).simulate('keydown', {keyCode: 39}); //Right

                return p;
            })
            .then(function () {
                var p = promisePrevented();

                $(fixture).simulate('keydown', {keyCode: 40}); //Down

                return p;
            })
            .then(function () {
                var p = promisePrevented();

                $(document.activeElement).simulate('keyup', {keyCode: 32}); //Space

                return p;
            })
            .then(function () {
                var p = promisePrevented();

                $(fixture).simulate('keydown', {keyCode: 13}); //Enter

                return p;
            })
            .then(function () {
                instance.destroy();
            })
            .catch(function (err) {
                assert.pushResult({
                    result: false,
                    message: err
                });
            })
            .then(ready);
    });

    QUnit.cases.init([
        {
            title: 'jQuery',
            fixtures: $('#qunit-fixture [data-fixture]')
        },
        {
            title: 'Elements',
            fixtures: document.querySelectorAll('#qunit-fixture [data-fixture]')
        }
    ]).test('createFromDoms ', function (data, assert) {
        var instances = navigableDomElement.createFromDoms(data.fixtures);

        assert.expect(4 + data.fixtures.length);

        assert.deepEqual(navigableDomElement.createFromDoms(), [], 'No list, no instances');
        assert.deepEqual(navigableDomElement.createFromDoms([]), [], 'Empty list, no instances');
        assert.deepEqual(navigableDomElement.createFromDoms($()), [], 'Empty collection, no instances');

        assert.equal(instances.length, data.fixtures.length, 'The expected number of instances has been created');

        instances.forEach(function (instance, i) {
            assert.equal(instance.getElement().is(data.fixtures[i]), true, 'The instance relates to the expected element');
        });
    });

    QUnit.test('isNavigableElement', function (assert) {
        var fixture = document.querySelector(fixtureSelector);
        var instance = navigableDomElement(fixture);

        assert.expect(4);

        assert.equal(navigableDomElement.isNavigableElement(instance), true, 'The instance is a navigable element');
        assert.equal(navigableDomElement.isNavigableElement(null), false, 'A null object is not a navigable element');
        assert.equal(navigableDomElement.isNavigableElement({}), false, 'An empty object is not a navigable element');

        instance.focus = null;
        assert.equal(navigableDomElement.isNavigableElement(instance), false, 'The instance is not a navigable element if it misses API');
    });

});
