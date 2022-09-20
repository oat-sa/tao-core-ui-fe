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

define(['jquery', 'ui/propertySelector/propertySelector', 'json!test/ui/propertySelector/mocks/mocks.json'], function (
    $,
    propertySelectorFactory,
    mockData
) {
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
            renderTo: '#testable-container',
            data: mockData
        });

        instance.on('ready', () => {
            const $container = $('.property-selector-container');
            const $searchInput = $container.find('input.search-property');
            const $listContainer = $container.find('.property-list-container');
            const $buttonContainer = $container.find('.control-buttons-container');
            assert.equal(
                $('#testable-container')[0],
                instance.getContainer()[0],
                'propertySelector component is created'
            );
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
                'list of properties is initialized with correct aount of entries'
            );
            assert.equal(
                $listContainer.find('input:checked').size(),
                mockData.selected.length,
                'list of selected properties is initialized correctly'
            );
            assert.equal($buttonContainer.find('button').size(), 2, 'control buttons are rendered');

            instance.destroy();
            ready();
        });
    });

    QUnit.module('search operation');
    QUnit.test('propertySelector list is filtered by search input', function (assert) {
        const ready = assert.async();
        assert.expect(1);

        const instance = propertySelectorFactory({
            renderTo: '#testable-container',
            data: mockData
        });

        instance.on('ready', () => {
            const $container = $('.property-selector-container');
            const $searchInput = $container.find('input.search-property');
            const $listContainer = $container.find('.property-list-container');

            $searchInput.val('prop');
            $searchInput.trigger('input');

            instance.on('redraw', () => {
                assert.equal($listContainer.children().size(), 4, 'list of properties is filtered by search input value');
                instance.destroy();
                ready();
            })
        });
    });

    QUnit.module('button operation');
    QUnit.test('propertySelector buttons trigger events', function (assert) {
        const ready = assert.async();
        assert.expect(2);

        const instance = propertySelectorFactory({
            renderTo: '#testable-container',
            data: mockData
        });

        instance.on('ready', () => {
            const $container = $('.property-selector-container');
            const $buttonContainer = $container.find('.control-buttons-container');
            const $buttons = $buttonContainer.find('button');
            const $cancelButton = $buttons[0];
            const $saveButton = $buttons[1];

            instance.on('select', e => {
                assert.equal(e.length, mockData.selected.length, 'Select event fired with correct selected');
            });
            $saveButton.click();

            instance.on('cancel', () => {
                assert.ok(true, 'Cancel event fired');
            });
            $cancelButton.click();

            instance.destroy();
            ready();
        });
    });

    QUnit.module('visual');
    QUnit.test('Visual test', function (assert) {
        const instance = propertySelectorFactory({
            renderTo: '#testable-container',
            data: mockData
        });
        const ready = assert.async();
        assert.expect(1);

        instance.on('ready', function () {
            assert.ok(true, 'Visual test initialized');
            ready();
        });
    });
});
