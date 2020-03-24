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
    'ui/keyNavigation/navigableDomElement'
], function (
    $,
    _,
    navigableDomElement
) {
    'use strict';

    var fixtureSelector = '#qunit-fixture .test-element';

    QUnit.module('navigableDomElement');

    QUnit.test('factory', function (assert) {
        assert.expect(4);
        assert.equal(typeof navigableDomElement, 'function', 'The module exposes a function');
        assert.equal(typeof navigableDomElement(), 'object', 'The factory creates an object');
        assert.notDeepEqual(navigableDomElement(), navigableDomElement(), 'The factory creates new objects');
        assert.equal(typeof navigableDomElement.createFromDoms, 'function', 'The factory exposes the function createFromDoms');
    });

    QUnit.cases.init([
        {title: 'init'},
        {title: 'destroy'},
        {title: 'getElement'},
        {title: 'isVisible'},
        {title: 'isEnabled'},
        {title: 'focus'}
    ]).test('api ', function (data, assert) {
        var instance = navigableDomElement();
        assert.expect(1);
        assert.equal(typeof instance[data.title], 'function', 'The navigator exposes a "' + data.title + '" function');
    });


    QUnit.test('init parameter / getElement', function (assert) {
        var expected = document.querySelector(fixtureSelector);
        var instance;

        assert.expect(6);

        instance = navigableDomElement(expected);
        assert.ok(instance.getElement() instanceof $, 'Element: The instance has a jQuery selection for the represented element');
        assert.equal(instance.getElement().get(0), expected, 'Element: The instance has selected the right element');

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

        assert.throws(function() {
            navigableDomElement().init();
        }, 'An error is raised if no element was provided');

        assert.throws(function() {
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

    QUnit.test('focus', function (assert) {
        var fixture = document.querySelector(fixtureSelector);
        var instance = navigableDomElement(fixture);

        assert.expect(3);

        if (document.activeElement) {
            document.activeElement.blur();
        }

        assert.equal(document.activeElement, document.body, 'No element in focus');

        assert.equal(instance.focus(), instance, 'The focus method is fluent');

        assert.equal(document.activeElement, instance.getElement().get(0), 'The element got the focus');
    });

    QUnit.test('createFromDoms', function (assert) {
        var $fixtures = $('#qunit-fixture [data-fixture]');
        var instances = navigableDomElement.createFromDoms($fixtures);

        assert.expect(4 + $fixtures.length);

        assert.deepEqual(navigableDomElement.createFromDoms(), [], 'No list, no instances');
        assert.deepEqual(navigableDomElement.createFromDoms([]), [], 'Empty list, no instances');
        assert.deepEqual(navigableDomElement.createFromDoms($()), [], 'Empty collection, no instances');

        assert.equal(instances.length, $fixtures.length, 'The expected number of instances has been created');
        $fixtures.each(function(i){
            assert.equal(instances[i].getElement().is(this), true, 'The instance relates to the expected element');
        });
    });

});
