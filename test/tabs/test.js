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
 * Copyright (c) 2019 (original work) Open Assessment Technologies SA ;
 */
/**
 * @author Jean-Sébastien Conan <jean-sebastien.conan@vesperiagroup.com>
 */
define([
    'jquery',
    'lodash',
    'ui/tabs'
], function($, _, tabs) {
    'use strict';

    QUnit.module('tabs');

    QUnit.test('module', function(assert) {
        assert.equal(typeof tabs, 'function', 'The tabs module exposes a function');
        assert.equal(typeof tabs(), 'object', 'The tabs factory produces an object');
        assert.notStrictEqual(
            tabs(),
            tabs(),
            'The tabs factory provides a different object on each call'
        );
    });

    var testTabsApi = [
        { name: 'init' },
        { name: 'destroy' },
        { name: 'render' },
        { name: 'show' },
        { name: 'hide' },
        { name: 'enable' },
        { name: 'disable' },
        { name: 'is' },
        { name: 'setState' },
        { name: 'getElement' },
        { name: 'getContainer' },
        { name: 'getTemplate' },
        { name: 'setTemplate' },
        { name: 'setTabs' }
    ];

    QUnit.cases.init(testTabsApi).test('instance API ', function(data, assert) {
        var instance = tabs();
        assert.equal(
            typeof instance[data.name],
            'function',
            'The tabs instance exposes a "' + data.name + '" function'
        );
        instance.destroy();
    });

    QUnit.test('init', function(assert) {
        var config = {
            nothing: undefined,
            dummy: null,
            title: 'My Title',
            textEmpty: 'Nothing to list',
            textNumber: 'Number',
            textLoading: 'Please wait'
        };
        var instance = tabs(config);

        assert.equal(instance.is('rendered'), false, 'The tabs instance must not be rendered');

        instance.destroy();
    });

    QUnit.test('visual', function(assert) {
        var $container = $('#fixture-1 nav');
        var config = {
            renderTo: $container,
            tabs: [
                { label: 'TAO Local', id: 'tao-local', onClick: () => console.log('1st') },
                { label: 'TAO Remote', id: 'tao-remote', onClick: () => console.log('2nd') },
                { label: 'LTI-based', id: 'lti-based', onClick: () => console.log('3rd') }
            ]
        };

        tabs(config);
        assert.ok(true, 'visual test ran');
    });

});
