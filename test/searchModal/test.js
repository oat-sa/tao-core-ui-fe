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
 * Copyright (c) 2020 (original work) Open Assessment Technologies SA;
 */
define([
    'jquery',
    'ui/searchModal',
    'core/store',
    'json!test/ui/searchModal/mocks/mocks.json',
    'jquery.mockjax'
], function ($, searchModalFactory, store, mocks) {
    $.mockjaxSettings.responseTime = 1;
    $.mockjax({
        url: 'undefined/tao/RestResource/getAll',
        dataType: 'json',
        responseText: mocks.mockedClassTree
    });

    QUnit.module('searchModal');
    QUnit.test('module', function (assert) {
        assert.expect(1);
        assert.ok(typeof searchModalFactory === 'function', 'The module expose a function');
    });

    QUnit.module('init');
    QUnit.test('searchModal component is correctly initialized using stored search results', function (assert) {
        const ready = assert.async();
        assert.expect(4);
        // before creating component instance, manipulate searchStore to store a mocked dataset to check on datatable-loaded event
        store('search').then(searchStore => {
            searchStore.setItem('results', mocks.mockedResults).then(() => {
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
                });

                instance.on('datatable-loaded', function () {
                    const $datatable = $('table.datatable');
                    assert.equal($datatable.length, 1, 'datatable has been created');
                    assert.equal(
                        $datatable.find('tbody tr').length,
                        1,
                        'datatable display the correct number of matches'
                    );

                    instance.destroy();
                    ready();
                });
            });
        });
    });
    QUnit.test('searchModal component is correctly initialized triggering initial search', function (assert) {
        const instance = searchModalFactory({
            criterias: { search: 'example' },
            url: '/test/searchModal/mocks/with-occurrences/search.json',
            renderTo: '#testable-container',
            rootClassUri: 'http://www.tao.lu/Ontologies/TAOItem.rdf#Item'
        });
        const ready = assert.async();
        assert.expect(4);

        instance.on('ready', function () {
            const $container = $('.search-modal');
            const $searchInput = $container.find('.generic-search-input');

            assert.equal($('#testable-container')[0], instance.getContainer()[0], 'searchModal component is created');
            assert.equal($searchInput.val(), 'example', 'search input value is correctly initialized');
        });

        instance.on('datatable-loaded', function () {
            const $datatable = $('table.datatable');
            assert.equal($datatable.length, 1, 'datatable has been created');
            assert.equal($datatable.find('tbody tr').length, 9, 'datatable display the correct number of matches');

            instance.destroy();
            ready();
        });
    });

    QUnit.module('destroy');
    QUnit.test('searchModal component is correctly destroyed on close button click', function (assert) {
        const instance = searchModalFactory({
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

    QUnit.module('clear button');
    QUnit.test('Clear button work as expected', function (assert) {
        const instance = searchModalFactory({
            criterias: { search: 'example' },
            url: '/test/searchModal/mocks/with-occurrences/search.json',
            renderTo: '#testable-container',
            rootClassUri: 'http://www.tao.lu/Ontologies/TAOItem.rdf#Item'
        });
        const ready = assert.async();
        assert.expect(4);

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

    QUnit.module('search button');
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

    QUnit.module('class filter');
    QUnit.test('class filter workflow is correct', function (assert) {
        const ready = assert.async();
        assert.expect(3);
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

    QUnit.module('searchStore');
    QUnit.test('searchStore saves all required information', function (assert) {
        const instance = searchModalFactory({
            criterias: { search: 'query to be stored' },
            url: '/test/searchModal/mocks/with-occurrences/search.json',
            renderTo: '#testable-container',
            rootClassUri: 'http://www.tao.lu/Ontologies/TAOItem.rdf#Item'
        });
        const ready = assert.async();
        assert.expect(6);

        instance.on('store-updated', function () {
            const $datatable = $('table.datatable');
            assert.equal($datatable.length, 1, 'datatable has been created');
            assert.equal($datatable.find('tbody tr').length, 9, 'datatable display the correct number of matches');
            store('search').then(searchStore => {
                const promises = [];
                promises.push(searchStore.getItem('criterias'));
                promises.push(searchStore.getItem('results'));
                promises.push(searchStore.getItem('context'));
                Promise.all(promises).then(function (resolutions) {
                    const criterias = resolutions[0];
                    const results = resolutions[1];
                    const context = resolutions[2];

                    assert.equal(criterias.search, 'query to be stored', 'query correctly stored');
                    assert.equal(results.totalCount, 9, 'results correctly stored');
                    assert.equal(context.key, 'context', 'context correctly stored');
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

    QUnit.module('visual');
    QUnit.test('Visual test', function (assert) {
        const instance = searchModalFactory({
            criterias: { search: 'example' },
            url: '/test/searchModal/mocks/with-occurrences/search.json',
            renderTo: '#testable-container',
            rootClassUri: 'http://www.tao.lu/Ontologies/TAOItem.rdf#Item',
            events: {
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
