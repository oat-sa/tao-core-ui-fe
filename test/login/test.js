/*
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
 * Copyright (c) 2019 (original work) Open Assessment Technologies SA (under the project TAO-PRODUCT);
 */

/**
 * @author Ilya Yarkavets <ilya.yarkavets@1pt.com>
 */
define(['jquery', 'ui/login/login'], function($, loginFactory) {
    'use strict';

    const passwordRevealConfig = {
        enablePasswordReveal: true,
        disableAutocomplete: false
    };

    const disableAutocompleteConfig = {
        enablePasswordReveal: false,
        disableAutocomplete: true
    };

    const bothOptionsConfig = {
        enablePasswordReveal: true,
        disableAutocomplete: true
    };

    const disableAutofocusConfig = {
        disableAutofocus: true,
    };

    const enableAutofocusConfig = {
        disableAutofocus: false,
    };

    QUnit.module('API');

    QUnit.test('module', function(assert) {
        assert.expect(3);

        assert.equal(typeof loginFactory, 'function', 'The loginFactory module exposes a function');
        assert.equal(typeof loginFactory(), 'object', 'The loginFactory produces an object');
        assert.notStrictEqual(
            loginFactory(),
            loginFactory(),
            'The loginFactory provides a different object on each call'
        );
    });

    QUnit.cases
        .init([
            { title: 'init' },
            { title: 'destroy' },
            { title: 'render' },
            { title: 'show' },
            { title: 'hide' },
            { title: 'enable' },
            { title: 'disable' },
            { title: 'is' },
            { title: 'setState' },
            { title: 'getContainer' },
            { title: 'getElement' },
            { title: 'getTemplate' },
            { title: 'setTemplate' }
        ])
        .test('Component API ', function(data, assert) {
            var instance = loginFactory();
            assert.equal(
                typeof instance[data.title],
                'function',
                'The login exposes the component method "' + data.title
            );
        });

    QUnit.cases
        .init([{ title: 'on' }, { title: 'off' }, { title: 'trigger' }, { title: 'before' }, { title: 'after' }])
        .test('Eventifier API ', function(data, assert) {
            var instance = loginFactory();
            assert.equal(
                typeof instance[data.title],
                'function',
                'The login exposes the eventifier method "' + data.title
            );
        });

    QUnit.cases
        .init([
            { title: 'isAutocompleteDisabled' },
            { title: 'isPasswordRevealEnabled' },
            { title: 'getMessages' },
            { title: 'getFieldMessages' },
            { title: 'createFakeForm' },
            { title: 'getRealForm' },
            { title: 'getFakeForm' },
            { title: 'getForm' },
            { title: 'manipulateFormDom' },
            { title: 'attachPasswordRevealEvents' },
            { title: 'displayMessages' }
        ])
        .test('Instance API ', function(data, assert) {
            var instance = loginFactory();
            assert.equal(typeof instance[data.title], 'function', 'The login exposes the method "' + data.title);
        });

    QUnit.module('Behavior');

    QUnit.test('Lifecycle', function(assert) {
        var ready = assert.async();
        var $container = $('#qunit-fixture');

        assert.expect(2);

        loginFactory($container)
            .on('init', function() {
                assert.ok(!this.is('rendered'), 'The component is not yet rendered');
            })
            .on('render', function() {
                assert.ok(this.is('rendered'), 'The component is now rendered');

                this.destroy();
            })
            .on('destroy', function() {
                ready();
            });
    });

    QUnit.test('Rendering', function(assert) {
        var ready = assert.async();
        var $container = $('#qunit-fixture');

        assert.expect(3);

        assert.equal($('.login-component', $container).length, 0, 'No resource tree in the container');

        loginFactory($container, passwordRevealConfig).after('render', function() {
            var $element = this.getElement();

            assert.equal($('.login-component', $container).length, 1, 'The component has been inserted');
            assert.equal($('.login-component', $container)[0], $element[0], 'The component element is correct');

            ready();
        });
    });

    QUnit.test('Password reveal enabled', function(assert) {
        var ready = assert.async();
        var $container = $('#qunit-fixture');

        assert.expect(7);

        assert.equal($('.login-component', $container).length, 0, 'No resource tree in the container');

        loginFactory($container, passwordRevealConfig).after('render', function() {
            var $element = this.getElement();

            assert.equal($('.login-component', $container).length, 1, 'The component has been inserted');
            assert.equal($('.login-component', $container)[0], $element[0], 'The component element is correct');

            assert.equal(
                $('.viewable-hiddenbox-toggle', $element).length,
                1,
                'The component has the password reveal button'
            );
            assert.equal(
                $('.icon-preview', $element).attr('tabindex'),
                0,
                'Show password button can be accessed from keyboard'
            );
            assert.equal(
                $('.icon-eye-slash', $element).attr('tabindex'),
                0,
                'Hide password button can be accessed from keyboard'
            );
            assert.equal(
                $('.viewable-hiddenbox-toggle span.icon-preview', $element).is(':visible'),
                true,
                'The component is rendered with password hidden'
            );

            ready();
        });
    });

    QUnit.test('Autocomplete disabled', function(assert) {
        var ready = assert.async();
        var $container = $('#qunit-fixture');

        assert.expect(8);

        assert.equal($('.login-component', $container).length, 0, 'No resource tree in the container');

        loginFactory($container, disableAutocompleteConfig).after('render', function() {
            var $element = this.getElement();

            assert.equal(
                $('.login-component', $container).length,
                2,
                'The component has been inserted and created real form (hidden) and fake to disable autocomplete'
            );
            assert.equal($('.login-component .fakeForm', $container).is(':visible'), true, 'Fake form is visible');
            assert.equal(
                $('.login-component', $container)
                    .eq('1')
                    .hasClass('hidden'),
                true,
                'Real form is hidden'
            );

            assert.equal(
                $('input[type=text]', $element).attr('autocomplete'),
                'off',
                'The component has autocomplete disabled for login field'
            );
            assert.equal(
                $('input[type=password]', $element).attr('autocomplete'),
                'off',
                'The component has autocomplete disabled for password field'
            );

            assert.equal(
                $('.loginForm:not(.fakeForm) label', $container).length,
                0,
                'The component remover labels from real form'
            );

            assert.equal(
                $('.loginForm.fakeForm label', $container).length,
                2,
                'The component keeps labels in fake form'
            );

            ready();
        });
    });

    QUnit.test('Autocomplete disabled and password reveal enabled', function(assert) {
        var ready = assert.async();
        var $container = $('#qunit-fixture');

        assert.expect(10);

        assert.equal($('.login-component', $container).length, 0, 'No resource tree in the container');

        loginFactory($container, bothOptionsConfig).after('render', function() {
            var $element = this.getElement();

            assert.equal(
                $('.login-component', $container).length,
                2,
                'The component has been inserted and created real form (hidden) and fake to disable autocomplete'
            );
            assert.equal($('.login-component .fakeForm', $container).is(':visible'), true, 'Fake form is visible');
            assert.equal(
                $('.login-component', $container)
                    .eq('1')
                    .hasClass('hidden'),
                true,
                'Real form is hidden'
            );

            assert.equal(
                $('input[type=text]', $element).attr('autocomplete'),
                'off',
                'The component has autocomplete disabled for login field'
            );
            assert.equal(
                $('input[type=password]', $element).attr('autocomplete'),
                'off',
                'The component has autocomplete disabled for password field'
            );

            assert.equal(
                $('.viewable-hiddenbox-toggle', $container).length,
                1,
                'The component has the password reveal button'
            );
            assert.equal(
                $('.icon-preview', $container).attr('tabindex'),
                0,
                'Show password button can be accessed from keyboard'
            );
            assert.equal(
                $('.icon-eye-slash', $container).attr('tabindex'),
                0,
                'Hide password button can be accessed from keyboard'
            );
            assert.equal(
                $('.viewable-hiddenbox-toggle span.icon-preview', $container).is(':visible'),
                true,
                'The component is rendered with password hidden'
            );

            ready();
        });
    });

    QUnit.test('Autofocus disabled', (assert) => {
        const ready = assert.async();
        const $container = $('#qunit-fixture');

        assert.expect(2);

        loginFactory($container, enableAutofocusConfig).after('render', function() {
            const $element = this.getElement();

            assert.equal(
                $('input[type=text]', $element).attr('autofocus'),
                'autofocus',
                'Autofocus is enabled'
            );

            loginFactory($container, disableAutofocusConfig).after('render', function() {
                const $elementWitoutAutofocus = this.getElement();

                assert.equal(
                    $('input[type=text]', $elementWitoutAutofocus).attr('autofocus'),
                    undefined,
                    'Autofocus is disabled'
                );

                ready();
            });
        });
  });
});
