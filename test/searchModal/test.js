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
 * Copyright (c) 2021 (original work) Open Assessment Technologies SA;
 */

define([
    'jquery',
    'ui/searchModal',
    'core/store',
    'json!test/ui/searchModal/mocks/mocks.json',
    'jquery.mockjax'
], function ($, searchModalFactory, store, mocks) {
    let advancedSearchEnabled = false;

    // Prevent the AJAX mocks to pollute the logs
    $.mockjaxSettings.logger = null;
    $.mockjaxSettings.responseTime = 1;
    $.mockjax({
        url: 'undefined/tao/RestResource/getAll',
        dataType: 'json',
        responseText: mocks.mockedClassTree
    });
    $.mockjax({
        url: new RegExp(/.+ClassMetadata.+/),
        dataType: 'json',
        responseText: mocks.mockedAdvancedCriteria
    });
    $.mockjax({
        url: 'undefined/tao/AdvancedSearch/status',
        dataType: 'json',
        response() {
            this.responseText = advancedSearchEnabled ? mocks.mockedStatusEnabled : mocks.mockedStatusDisabled;
        }
    });

    QUnit.module('searchModal');
    QUnit.test('module', function (assert) {
        assert.expect(1);
        assert.ok(typeof searchModalFactory === 'function', 'The module expose a function');
    });

    QUnit.module('init', {
        beforeEach() {
            advancedSearchEnabled = false;
        }
    });
    QUnit.test('searchModal component is correctly initialized using stored search results', function (assert) {
        const ready = assert.async();
        assert.expect(7);
        // before creating component instance, manipulate searchStore to store a mocked dataset to check on datatable-loaded event
        Promise.all([store('search'), store('selectedColumns')]).then(stores => {
            const searchStore = stores[0];
            const selectedColumnsStore = stores[1];
            selectedColumnsStore
                .setItem('http://www.tao.lu/Ontologies/TAOItem.rdf#Item', ['label', 'custom_prop'])
                .then(() => searchStore.setItem('results', mocks.mockedResults))
                .then(() => {
                    const instance = searchModalFactory({
                        criterias: { search: 'example' },
                        url: '/test/searchModal/mocks/with-occurrences/search.json',
                        renderTo: '#testable-container',
                        searchOnInit: false,
                        rootClassUri: 'http://www.tao.lu/Ontologies/TAOItem.rdf#Item'
                    });

                    instance.on('ready', function () {
                        const $container = $('.search-modal');
                        const $searchInput = $container.find('.generic-search-input');
                        assert.equal(
                            $('#testable-container')[0],
                            instance.getContainer()[0],
                            'searchModal component is created'
                        );
                        assert.equal($searchInput.val(), 'example', 'search input value is correctly initialized');
                        assert.ok(!instance.isAdvancedSearchEnabled(), 'the advanced search is disabled');
                    });

                    instance.on('datatable-loaded', function () {
                        const $datatable = $('table.datatable');
                        assert.equal($datatable.length, 1, 'datatable has been created');
                        assert.equal(
                            $datatable.find('tbody tr').length,
                            1,
                            'datatable display the correct number of matches'
                        );
                        assert.equal(
                            $datatable.find('th').length,
                            3,
                            'datatable displays all selected props + actions column'
                        );

                        assert.equal(
                            $datatable.find('.toggle-modal-button').length,
                            0,
                            'The columns manager is not added'
                        );

                        instance.destroy();
                        ready();
                    });
                });
        });
    });
    QUnit.test('searchModal component is correctly initialized triggering initial search', function (assert) {
        const ready = assert.async();
        assert.expect(18);

        Promise.all([store('search'), store('selectedColumns')]).then(stores => {
            const searchStore = stores[0];
            const selectedColumnsStore = stores[1];
            selectedColumnsStore
                .setItem('http://www.tao.lu/Ontologies/TAOItem.rdf#Item', ['label', 'custom_prop', 'custom_label'])
                .then(() => searchStore.setItem('results', mocks.mockedResults))
                .then(() => {
                    const instance = searchModalFactory({
                        criterias: { search: 'example' },
                        url: '/test/searchModal/mocks/with-occurrences/search.json',
                        renderTo: '#testable-container',
                        rootClassUri: 'http://www.tao.lu/Ontologies/TAOItem.rdf#Item'
                    });

                    instance.on('ready', function () {
                        const $container = $('.search-modal');
                        const $searchInput = $container.find('.generic-search-input');

                        assert.equal(
                            $('#testable-container')[0],
                            instance.getContainer()[0],
                            'searchModal component is created'
                        );
                        assert.equal($searchInput.val(), 'example', 'search input value is correctly initialized');
                        assert.ok(!instance.isAdvancedSearchEnabled(), 'the advanced search is disabled');
                    });

                    instance.on('datatable-loaded', function () {
                        const $datatable = $('table.datatable');
                        assert.equal($datatable.length, 1, 'datatable has been created');
                        assert.equal(
                            $datatable.find('thead th').length,
                            4,
                            'datatable display the correct number of columns'
                        );
                        assert.equal(
                            $datatable.find('thead [data-sort-by="label.raw"]').length,
                            1,
                            'The default column is displayed'
                        );
                        assert.equal(
                            $datatable.find('thead [data-sort-by="label.raw"] .alias').length,
                            0,
                            'The default column has no alias'
                        );
                        assert.equal(
                            $datatable.find('thead [data-sort-by="custom_prop"]').length,
                            1,
                            'The additional column for the custom property is displayed'
                        );
                        assert.equal(
                            $datatable.find('thead [data-sort-by="custom_prop"] .alias').length,
                            0,
                            'The alias for the custom property is not displayed because it is not duplicated'
                        );
                        assert.equal(
                            $datatable.find('thead [data-sort-by="custom_prop"] .comment').length,
                            0,
                            'The class name for the custom property is not displayed because it is not duplicated'
                        );
                        assert.equal(
                            $datatable.find('thead [data-sort-by="custom_label"]').length,
                            1,
                            'The additional column for the custom label is displayed'
                        );
                        assert.equal(
                            $datatable.find('thead [data-sort-by="custom_label"] .alias').length,
                            1,
                            'The alias for the custom label is displayed'
                        );
                        assert.equal(
                            $datatable.find('thead [data-sort-by="custom_label"] .comment').length,
                            1,
                            'The class name for the custom label is displayed'
                        );
                        assert.equal(
                            $datatable.find('tbody tr').length,
                            9,
                            'datatable display the correct number of matches'
                        );
                        assert.equal(
                            $datatable.find('tbody tr:eq(5) td.custom_prop').text().trim(),
                            '-',
                            'the missing column is filled with a placeholder'
                        );
                        assert.equal(
                            $datatable.find('tbody tr:eq(6) td.custom_prop').text().trim(),
                            '-',
                            'the empty column is filled with a placeholder'
                        );
                        assert.equal(
                            $datatable.find('tbody tr:eq(8) td.custom_prop').text().trim(),
                            '-',
                            'the column with an empty array is filled with a placeholder'
                        );

                        assert.equal(
                            $datatable.find('.toggle-modal-button').length,
                            0,
                            'The columns manager is not added'
                        );

                        instance.destroy();
                        ready();
                    });
                });
        });
    });

    QUnit.test('searchModal component is correctly set with advanced search enabled', function (assert) {
        const ready = assert.async();
        assert.expect(15);

        Promise.all([store('search'), store('selectedColumns')]).then(stores => {
            const searchStore = stores[0];
            const selectedColumnsStore = stores[1];
            selectedColumnsStore
                .setItem('http://www.tao.lu/Ontologies/TAOItem.rdf#Item', ['label', 'custom_prop', 'custom_label'])
                .then(() => searchStore.setItem('results', mocks.mockedResults))
                .then(() => {
                    const $container = $('#testable-container');
                    advancedSearchEnabled = true;
                    const instance = searchModalFactory({
                        criterias: { search: 'example' },
                        url: '/test/searchModal/mocks/with-occurrences/search.json',
                        renderTo: $container,
                        rootClassUri: 'http://www.tao.lu/Ontologies/TAOItem.rdf#Item'
                    });

                    instance.on('ready', function () {
                        const $searchInput = $container.find('.search-modal .generic-search-input');

                        assert.equal(
                            $('#testable-container')[0],
                            instance.getContainer()[0],
                            'searchModal component is created'
                        );
                        assert.equal($searchInput.val(), 'example', 'search input value is correctly initialized');
                        assert.ok(instance.isAdvancedSearchEnabled(), 'the advanced search is enabled');
                    });

                    instance.on('datatable-loaded', function () {
                        const $datatable = $container.find('table.datatable');
                        assert.equal($datatable.length, 1, 'datatable has been created');
                        assert.equal(
                            $datatable.find('thead th').length,
                            4,
                            'datatable display the correct number of columns'
                        );
                        assert.equal(
                            $datatable.find('thead [data-sort-by="label.raw"]').length,
                            1,
                            'The default column is displayed'
                        );
                        assert.equal(
                            $datatable.find('thead [data-sort-by="label.raw"] .alias').length,
                            0,
                            'The default column has no alias'
                        );
                        assert.equal(
                            $datatable.find('thead [data-sort-by="custom_prop"]').length,
                            1,
                            'The additional column for the custom property is displayed'
                        );
                        assert.equal(
                            $datatable.find('thead [data-sort-by="custom_prop"] .alias').length,
                            0,
                            'The alias for the custom property is not displayed because it is not duplicated'
                        );
                        assert.equal(
                            $datatable.find('thead [data-sort-by="custom_prop"] .comment').length,
                            0,
                            'The class name for the custom property is not displayed because it is not duplicated'
                        );
                        assert.equal(
                            $datatable.find('thead [data-sort-by="custom_label"]').length,
                            1,
                            'The additional column for the custom label is displayed'
                        );
                        assert.equal(
                            $datatable.find('thead [data-sort-by="custom_label"] .alias').length,
                            1,
                            'The alias for the custom label is displayed'
                        );
                        assert.equal(
                            $datatable.find('thead [data-sort-by="custom_label"] .comment').length,
                            1,
                            'The class name for the custom label is displayed'
                        );
                        assert.equal(
                            $datatable.find('tbody tr').length,
                            9,
                            'datatable display the correct number of matches'
                        );

                        assert.equal(
                            $container.find('.content-toolbar .toggle-modal-button').length,
                            1,
                            'The columns manager is reachable'
                        );

                        instance.destroy();
                        ready();
                    });
                });
        });
    });

    QUnit.module('destroy', {
        beforeEach() {
            advancedSearchEnabled = false;
        }
    });
    QUnit.test('searchModal component is correctly destroyed on close button click', function (assert) {
        searchModalFactory({
            criterias: { search: '' },
            url: '',
            renderTo: '#testable-container',
            rootClassUri: 'http://www.tao.lu/Ontologies/TAOItem.rdf#Item'
        });
        const ready = assert.async();
        assert.expect(1);

        $('body').one('opened.modal', function () {
            const $container = $('.search-modal');
            const $closeButton = $container.find('.modal-close-left');
            $closeButton.trigger('click.modal');
        });
        $('body').one('closed.modal', function () {
            const $container = $('.search-modal');
            assert.equal($container.length, 0, 'search component modal is destroyed');
            ready();
        });
    });
    QUnit.test('searchModal component is correctly destroyed on resource selected', function (assert) {
        const instance = searchModalFactory({
            criterias: { search: 'example' },
            url: '/test/searchModal/mocks/with-occurrences/search.json',
            renderTo: '#testable-container',
            rootClassUri: 'http://www.tao.lu/Ontologies/TAOItem.rdf#Item',
            events: {
                //eslint-disable-next-line no-console
                trigger: () => console.log('user has been redirected to clicked resource')
            }
        });
        const ready = assert.async();
        assert.expect(3);

        instance.on('datatable-loaded', function () {
            const $datatable = $('table.datatable');
            assert.equal($datatable.length, 1, 'datatable has been created');
            assert.equal($datatable.find('tbody tr').length, 9, 'datatable display the correct number of matches');
            $datatable.find('tbody .go-to-item').first().trigger('click');
            const $container = $('.search-modal');
            assert.equal($container.length, 0, 'search component modal is destroyed');
            ready();
        });
    });

    QUnit.module('clear button', {
        beforeEach() {
            advancedSearchEnabled = false;
        }
    });
    QUnit.test('Clear button work as expected', function (assert) {
        const instance = searchModalFactory({
            criterias: { search: 'example' },
            url: '/test/searchModal/mocks/with-occurrences/search.json',
            renderTo: '#testable-container',
            rootClassUri: 'http://www.tao.lu/Ontologies/TAOItem.rdf#Item'
        });
        const ready = assert.async();
        assert.expect(4);

        instance.on('ready', function () {
            const $searchButton = $('.btn-search');
            $searchButton.trigger('click');
        });

        instance.on('datatable-loaded', function () {
            const $container = $('.search-modal');
            const $searchInput = $container.find('.generic-search-input');
            const $clearButton = $('.btn-clear');
            const $datatable = $('table.datatable');

            assert.equal($searchInput.val(), 'example', 'search input value is correctly initialized');
            assert.equal($datatable.length, 1, 'datatable has been created');

            $clearButton.trigger('click');
            const $resultContainer = $('.no-datatable-container');
            assert.equal($searchInput.val(), '', 'search input value is correctly cleaned');
            assert.equal($resultContainer.length, 1, 'info message is displayed');

            instance.destroy();
            ready();
        });
    });

    QUnit.module('search button', {
        beforeEach() {
            advancedSearchEnabled = false;
        }
    });
    QUnit.test('Search button work as expected when there are occurrences', function (assert) {
        const instance = searchModalFactory({
            criterias: { search: '' },
            url: '/test/searchModal/mocks/with-occurrences/search.json',
            renderTo: '#testable-container',
            rootClassUri: 'http://www.tao.lu/Ontologies/TAOItem.rdf#Item'
        });
        const ready = assert.async();
        assert.expect(3);

        instance.on('ready', function () {
            const $container = $('.search-modal');
            const $searchInput = $container.find('.generic-search-input');
            const $searchButton = $('.btn-search');

            $searchInput.val('example');
            assert.equal($searchInput.val(), 'example', 'search input value is correctly set');
            $searchButton.trigger('click');
        });

        instance.on('datatable-loaded', function () {
            const $datatable = $('table.datatable');
            assert.equal($datatable.length, 1, 'datatable has been created');
            assert.equal($datatable.find('tbody tr').length, 9, 'datatable display the correct number of matches');

            instance.destroy();
            ready();
        });
    });
    QUnit.test('Search button work as expected when results have no occurrences', function (assert) {
        const instance = searchModalFactory({
            criterias: { search: '' },
            url: '/test/searchModal/mocks/with-no-occurrences/search.json',
            renderTo: '#testable-container',
            rootClassUri: 'http://www.tao.lu/Ontologies/TAOItem.rdf#Item'
        });
        const ready = assert.async();
        assert.expect(3);

        instance.on('ready', function () {
            const $container = $('.search-modal');
            const $searchInput = $container.find('.generic-search-input');
            const $searchButton = $('.btn-search');

            $searchInput.val('example');
            assert.equal($searchInput.val(), 'example', 'search input value is correctly set');
            $searchButton.trigger('click');
        });

        instance.on('datatable-loaded', function () {
            const $datatable = $('table.datatable');
            const $resultContainer = $('.no-datatable-container');

            assert.equal($datatable.length, 0, 'datatable has not been created');
            assert.equal($resultContainer.length, 1, 'info message is displayed');

            instance.destroy();
            ready();
        });
    });

    QUnit.module('class filter', {
        beforeEach() {
            advancedSearchEnabled = false;
        }
    });
    QUnit.test('class filter workflow is correct', function (assert) {
        const ready = assert.async();
        assert.expect(7);
        const instance = searchModalFactory({
            criterias: { search: 'example' },
            url: '/test/searchModal/mocks/with-occurrences/search.json',
            renderTo: '#testable-container',
            rootClassUri: 'http://www.tao.lu/Ontologies/TAOItem.rdf#Item'
        });

        instance.on('ready', function () {
            const $container = $('.search-modal');
            const $classInput = $container.find('.class-filter');
            const $clearButton = $('.btn-clear');
            const $classTree = $('.class-tree');

            assert.equal($classTree.css('display'), 'none', 'class tree is initially hidden');
            $classInput.trigger('click');
            assert.equal($classTree.css('display'), 'block', 'class tree is visible on click');
            $classTree.trigger('mousedown');
            assert.equal($classTree.css('display'), 'block', 'class tree is not hidden when clicking on it');
            $container.trigger('mousedown');
            assert.equal($classTree.css('display'), 'none', 'class tree is hidden clicking outside of it');

            const $qtiInteractionsClassNode = $('.class-tree [title="QTI Interactions"]');

            assert.equal($classInput.val(), 'Item', 'class input value is correctly initialized');

            $qtiInteractionsClassNode.trigger('click');
            assert.equal($classInput.val(), 'QTI Interactions', 'class input value is correctly updated');

            $clearButton.trigger('click');
            assert.equal($classInput.val(), 'Item', 'class input value is correctly reset');

            instance.destroy();
            ready();
        });
    });
    QUnit.test('class filter disables private classes', function (assert) {
        const ready = assert.async();
        $.mockjax.handler(0).responseText = mocks.mockedClassTreeWithPermissions;
        assert.expect(1);
        const instance = searchModalFactory({
            criterias: { search: 'example' },
            url: '/test/searchModal/mocks/with-occurrences/search.json',
            renderTo: '#testable-container',
            rootClassUri: 'http://www.tao.lu/Ontologies/TAOItem.rdf#Item'
        });

        instance.on('ready', function () {
            assert.equal($('.resource-tree').find('[data-access="denied"]').length, 1, 'private class is disabled');
            instance.destroy();
            ready();
            $.mockjax.handler(0).responseText = mocks.mockedClassTree;
        });
    });

    QUnit.module('searchStore', {
        beforeEach() {
            advancedSearchEnabled = false;
        }
    });
    QUnit.test('searchStore saves all required information', function (assert) {
        const instance = searchModalFactory({
            criterias: { search: 'query to be stored' },
            url: '/test/searchModal/mocks/with-occurrences/search.json',
            renderTo: '#testable-container',
            rootClassUri: 'http://www.tao.lu/Ontologies/TAOItem.rdf#Item'
        });
        const ready = assert.async();
        assert.expect(8);

        instance.on('ready', function () {
            assert.ok(!instance.isAdvancedSearchEnabled(), 'the advanced search is disabled');
            instance.on('store-updated', function () {
                const $datatable = $('table.datatable');
                assert.equal($datatable.length, 1, 'datatable has been created');
                assert.equal($datatable.find('tbody tr').length, 9, 'datatable display the correct number of matches');
                store('search').then(searchStore => {
                    const promises = [];
                    promises.push(searchStore.getItem('criterias'));
                    promises.push(searchStore.getItem('results'));
                    promises.push(searchStore.getItem('options'));
                    Promise.all(promises).then(function (resolutions) {
                        const criterias = resolutions[0];
                        const results = resolutions[1];
                        const options = resolutions[2];

                        assert.equal(criterias.search, 'query to be stored', 'query correctly stored');
                        assert.equal(options.sortby, 'label.raw', 'sorted column correctly stored');
                        assert.equal(options.sortorder, 'asc', 'sort order correctly stored');
                        assert.equal(results.totalCount, 9, 'results correctly stored');
                        assert.equal(
                            criterias.class,
                            'http://www.tao.lu/Ontologies/TAOItem.rdf#Item',
                            'class correctly stored'
                        );

                        instance.destroy();
                        ready();
                    });
                });
            });
        });
    });

    QUnit.module('visual', {
        beforeEach() {
            advancedSearchEnabled = false;
        }
    });
    QUnit.test('Visual test', function (assert) {
        const instance = searchModalFactory({
            criterias: { search: 'example' },
            url: '/test/searchModal/mocks/with-occurrences/search.json',
            renderTo: '#testable-container',
            rootClassUri: 'http://www.tao.lu/Ontologies/TAOItem.rdf#Item',
            events: {
                //eslint-disable-next-line no-console
                trigger: () => console.log('user has been redirected to clicked resource')
            }
        });
        const ready = assert.async();
        assert.expect(1);

        instance.on('ready', function () {
            assert.ok(true, 'Visual test initialized');
            ready();
        });
    });
});
