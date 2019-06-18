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
 * @author Jean-Sébastien Conan <jean-sebastien@taotesting.com>
 */
define([
    'lodash',
    'ui/form/widget/definitions',
    'ui/form/widget/loader'
], function (
    _,
    widgetDefinitions,
    widgetFactory
) {
    'use strict';

    QUnit.module('Factory');

    QUnit.test('module', function (assert) {
        function getInstance() {
            return widgetFactory('#fixture-api', {widget: widgetDefinitions.DEFAULT, uri: 'foo'})
                .on('ready', function () {
                    this.destroy();
                });
        }

        assert.expect(3);

        assert.equal(typeof widgetFactory, 'function', 'The module exposes a function');
        assert.equal(typeof getInstance(), 'object', 'The factory produces an object');
        assert.notStrictEqual(getInstance(), getInstance(), 'The factory provides a different object on each call');
    });

    QUnit.cases.init([
        {title: 'registerProvider'},
        {title: 'getProvider'},
        {title: 'getAvailableProviders'},
        {title: 'clearProviders'}
    ]).test('provider registry API ', function (data, assert) {
        assert.expect(1);
        assert.equal(typeof widgetFactory[data.title], 'function', 'The factory exposes a "' + data.title + '" function');
    });

    QUnit.module('Definitions');

    QUnit.cases.init([
        {title: 'DEFAULT'},
        {title: 'TEXTBOX'},
        {title: 'TEXTAREA'},
        {title: 'HIDDEN'},
        {title: 'HIDDENBOX'},
        {title: 'RADIOBOX'},
        {title: 'COMBOBOX'},
        {title: 'CHECKBOX'}
    ]).test('constant ', function (data, assert) {
        const widget = widgetDefinitions[data.title];
        const provider = widgetFactory.getProvider(widget);
        assert.expect(2);
        assert.equal(typeof provider, 'object', 'The widget registry contains the widget "' + data.title + '"');
        assert.equal(typeof provider.init, 'function', 'The widget registry contains a valid widget provider for "' + data.title + '"');
    });
});
