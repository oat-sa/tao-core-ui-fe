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
 * Copyright (c) 2022 (original work) Open Assessment Technologies SA;
 */

define([
    'jquery',
    'ui/propertySelector/propertySelector',
    'json!test/ui/propertySelector/mocks/mocks.json',
    'lodash'
], function ($, propertySelectorFactory, mockData, _) {
    QUnit.module('propertySelector');
    QUnit.test('module', function (assert) {
        assert.expect(1);
        assert.ok(typeof propertySelectorFactory === 'function', 'The module expose a function');
    });

    QUnit.module('init');
    QUnit.test('propertySelector component is correctly initialized using mock data', function (assert) {
        const ready = assert.async();
        assert.expect(7);

        const instance = propertySelectorFactory({
            renderTo: '#qunit-fixture',
            data: mockData
        });

        instance.on('ready', () => {
            const $container = $('.property-selector-container');
            const $searchInput = $container.find('input.search-property');
            const $listContainer = $container.find('.property-list-container');
            const $buttonContainer = $container.find('.control-buttons-container');
            assert.equal($('#qunit-fixture')[0], instance.getContainer()[0], 'propertySelector component is created');
            assert.equal(
                $container.css('top'),
                `${mockData.position.top}px`,
                'position props are applied to container'
            );
            assert.equal(
                $container.css('left'),
                `${mockData.position.left}px`,
                'position props are applied to container'
            );
            assert.equal($searchInput.val(), '', 'search input value is correctly initialized');
            assert.equal(
                $listContainer.children().size(),
                Object.keys(mockData.available).length,
                'list of properties is initialized with the correct count of entries'
            );
            assert.equal(
                $listContainer.find('input:checked').size(),
                mockData.selected ? mockData.selected.length : 0,
                'list of selected properties is initialized correctly'
            );
            assert.equal($buttonContainer.find('button').size(), 2, 'control buttons are rendered');

            instance.destroy();
            ready();
        });
    });

    QUnit.module('api');
    QUnit.test('propertySelector component as setData and redrawList api', function (assert) {
        const instance = propertySelectorFactory({
            renderTo: '#qunit-fixture',
            data: mockData
        });

        const ready = assert.async();
        assert.expect(2);

        instance.on('ready', () => {
            assert.ok(typeof instance.setData === 'function', 'The component api has setData a function');
            assert.ok(typeof instance.redrawList === 'function', 'The component api has redrawList a function');
            instance.destroy();
            ready();
        });
    });

    QUnit.test('propertySelector component can be managed by setting data from outside', function (assert) {
        const ready = assert.async();
        assert.expect(2);

        const instance = propertySelectorFactory({
            renderTo: '#qunit-fixture',
            data: mockData
        });

        instance.on('ready', () => {
            const $container = $('.property-selector-container');
            const $listContainer = $container.find('.property-list-container');

            const mockDataCopy = _.cloneDeep(mockData);
            mockDataCopy.selected = [];
            mockDataCopy.available = [
                {
                    id: 'label',
                    label: 'Label',
                    alias: null
                }
            ];

            instance.on('redraw', () => {
                assert.equal($listContainer.find('input:checked').size(), 0, 'Selected props are updated');
                assert.equal($listContainer.find('li').size(), 1, 'List items are updated');

                instance.destroy();
                ready();
            });

            instance.setData(mockDataCopy);
        });
    });

    QUnit.module('search operation');
    QUnit.test('propertySelector list is filtered by search input', function (assert) {
        const ready = assert.async();
        assert.expect(2);

        const instance = propertySelectorFactory({
            renderTo: '#qunit-fixture',
            data: mockData
        });
        instance.on('ready', () => {
            const $container = $('.property-selector-container');
            const $searchInput = $container.find('input.search-property');
            const $listContainer = $container.find('.property-list-container');

            instance.on('redraw', () => {
                assert.equal(
                    $listContainer.children().size(),
                    4,
                    'list of properties is filtered by search input value'
                );
                assert.equal($listContainer.find('b').size(), 6, 'the found properties highlight the searched terms');
                instance.destroy();
                ready();
            });

            $searchInput.val('prop');
            $searchInput.trigger('input');
        });
    });

    QUnit.module('button operation');
    QUnit.test('propertySelector buttons trigger events', function (assert) {
        const ready = assert.async();
        assert.expect(2);

        const instance = propertySelectorFactory({
            renderTo: '#qunit-fixture',
            data: mockData
        });

        instance.on('ready', () => {
            const $container = $('.property-selector-container');
            const $buttonContainer = $container.find('.control-buttons-container');
            const $buttons = $buttonContainer.find('button');
            const $cancelButton = $buttons[0];
            const $saveButton = $buttons[1];

            const selectPromise = new Promise(selectHandled => {
                instance.on('select', selection => {
                    assert.equal(
                        selection.length,
                        mockData.selected.length,
                        'Select event fired with correct selected'
                    );
                    selectHandled();
                });
                $saveButton.click();
            });
            const cancelPromise = new Promise(cancelHandled => {
                instance.on('cancel', () => {
                    assert.ok(true, 'Cancel event fired');
                    cancelHandled();
                });
                $cancelButton.click();
            });

            Promise.all([selectPromise, cancelPromise]).then(() => {
                instance.destroy();
                ready();
            });
        });
    });

    QUnit.test('a click outside propertySelector triggers cancel', function (assert) {
        const ready = assert.async();
        assert.expect(1);

        const instance = propertySelectorFactory({
            renderTo: '#qunit-fixture',
            data: mockData
        });

        instance
            .on('ready', () => {
                setTimeout(() => document.dispatchEvent(new Event('click')), 0);
            })
            .on('cancel', () => {
                assert.ok(true, 'Cancel event fired');
                instance.destroy();
            })
            .on('destroy', ready);
    });

    QUnit.module('visual');
    QUnit.test('Visual test', function (assert) {
        const $container = $('#visual-test');
        const instance = propertySelectorFactory({
            renderTo: $('.testable-container', $container),
            data: mockData
        });
        const ready = assert.async();
        assert.expect(1);

        $('[name=toggle]', $container).on('click', () => instance.toggle());

        instance.on('ready', function () {
            assert.ok(true, 'Visual test initialized');
            ready();
        });
    });
});
