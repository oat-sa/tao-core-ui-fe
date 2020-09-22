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
    'lodash',
    'ui/searchModal',
    'ui/searchModal/advancedSearch',
    'core/store',
    'json!test/ui/searchModal/mocks/mocks.json',
    'jquery.mockjax'
], function ($, _, searchModalFactory, advancedSearchFactory, store, mocks) {
    $.mockjaxSettings.responseTime = 1;
    $.mockjax({
        url: 'undefined/tao/RestResource/getAll',
        dataType: 'json',
        responseText: mocks.mockedClassTree
    });
    QUnit.module('advancedSearch');
    QUnit.test('module', function (assert) {
        assert.expect(1);
        assert.ok(typeof advancedSearchFactory === 'function', 'The module expose a function');
    });

    QUnit.module('init');
    QUnit.test('advancedSearch component is correctly initialized using stored criteria', function (assert) {
        const ready = assert.async();
        // before creating component instance, manipulate searchStore to store a mocked dataset to check on datatable-loaded event
        store('search').then(searchStore => {
            searchStore.setItem('results', mocks.mockedResults).then(() => {
                const instance = searchModalFactory({
                    criterias: { search: 'example', advancedCriteria: mocks.mockedAdvancedCriteria },
                    url: '/test/searchModal/mocks/with-occurrences/search.json',
                    renderTo: '#testable-container',
                    searchOnInit: false,
                    rootClassUri: 'http://www.tao.lu/Ontologies/TAOItem.rdf#Item'
                });

                instance.on('ready', function () {
                    const $container = $('.advanced-search-container');
                    const $invalidCriteriaContainer = $container.find('.invalid-criteria-warning-container');

                    assert.equal($invalidCriteriaContainer.length, 0, 'invalid criteira is not initially rendered');
                    _.forEach(mocks.mockedAdvancedCriteria, criterionToRender => {
                        // check for each stored criterion if it is rendered when criterion.rendered is true, and viceversa
                        assert.equal(
                            $container.find(`.${criterionToRender.label}-filter`).length,
                            criterionToRender.rendered,
                            `${criterionToRender.label} criterion is ${
                                criterionToRender.rendered ? '' : 'not'
                            } rendered on init`
                        );
                    });
                    instance.destroy();
                    ready();
                });
            });
        });
    });
    QUnit.test('advancedSearch component is correctly initialized with no stored criteria', function (assert) {
        const instance = searchModalFactory({
            criterias: { search: 'example' },
            url: '/test/searchModal/mocks/with-occurrences/search.json',
            renderTo: '#testable-container',
            rootClassUri: 'http://www.tao.lu/Ontologies/TAOItem.rdf#Item'
        });
        const ready = assert.async();
        assert.expect(2);

        instance.on('ready', function () {
            const $container = $('.advanced-search-container');
            const $criteriaContainer = $container.find('.advanced-criteria-container');

            assert.equal($criteriaContainer.length, 1, 'container for criteria is rendered');
            assert.equal($criteriaContainer.children().length, 0, 'container for criteria is empty');
            instance.destroy();
            ready();
        });
    });

    QUnit.module('advanced search logic');
    QUnit.test('advancedSearch criteria manipulation', function (assert) {
        const instance = searchModalFactory({
            criterias: { search: 'example' },
            url: '/test/searchModal/mocks/with-occurrences/search.json',
            renderTo: '#testable-container',
            rootClassUri: 'http://www.tao.lu/Ontologies/TAOItem.rdf#Item'
        });
        const ready = assert.async();
        assert.expect(14);

        instance.on('ready', function () {
            const $container = $('.advanced-search-container');
            const $criteriaContainer = $container.find('.advanced-criteria-container');
            const $addCriteriaInput = $('.add-criteria-container a', $container);
            const $criteriaSelect = $('.add-criteria-container select', $container);
            let $optionToSelect = $criteriaSelect.find('option[value="in-both-text"]');

            // check initial state
            assert.equal($criteriaSelect.select2('opened'), false, 'critera select is initially closed');
            assert.equal($optionToSelect.length, 1, 'criterion to select is initially on select options');

            // select a criterion
            $addCriteriaInput.trigger('click');
            assert.equal($criteriaSelect.select2('opened'), true, 'critera select is opened on click');
            $criteriaSelect.select2('val', 'in-both-text').trigger('change');

            // check state after criterion is select
            $optionToSelect = $criteriaSelect.find('option[value="in-both-text"]');
            assert.equal($criteriaContainer.find('.in-both-text-filter').length, 1, 'criterion is added to DOM');
            assert.equal($criteriaSelect.select2('opened'), false, 'critera select is closed after adding a criteria');
            assert.equal($optionToSelect.length, 0, 'selected criterion is not longer on select options');

            // close added criterion
            $criteriaContainer.find('.in-both-text-filter .select2-search-choice-close').trigger('click');
            $optionToSelect = $criteriaSelect.find('option[value="in-both-text"]');
            assert.equal($criteriaContainer.find('.in-both-text-filter').length, 0, 'criterion was removed');
            assert.equal($optionToSelect.length, 1, 'criterion is selectable again');

            // add a criterion that is not available on child class
            $criteriaSelect.select2('val', 'only-in-root').trigger('change');
            assert.equal($criteriaContainer.find('.only-in-root-filter').length, 1, 'criterion is added to DOM');

            // change current class and check that unavailable criterion has been removed
            const $qtiInteractionsClassNode = $('.class-tree [title="QTI Interactions"]');
            $qtiInteractionsClassNode.trigger('click');
            assert.equal($criteriaContainer.find('.only-in-root').length, 0, 'criterion was removed');
            assert.equal($container.find('.invalid-criteria-warning-container').length, 1, 'warning rendered');

            // add a new criterion
            $criteriaSelect.select2('val', 'only-in-child').trigger('change');
            assert.equal($criteriaContainer.find('.only-in-child-filter').length, 1, 'criterion is added to DOM');
            assert.equal($container.find('.invalid-criteria-warning-container').length, 0, 'warning removed');

            // clear current search
            $('.btn-clear').trigger('click');
            assert.equal($criteriaContainer.children().length, 0, 'container for criteria is empty');
            instance.destroy();
            ready();
        });
    });
    QUnit.test('bind between view and model is correctly set', function (assert) {
        const instance = advancedSearchFactory({
            renderTo: '#testable-container'
        });
        instance.updateCriteria([{ label: 'Item' }]);
        const ready = assert.async();
        assert.expect(8);

        const $container = $('.advanced-search-container');
        const $criteriaContainer = $container.find('.advanced-criteria-container');
        const $criteriaSelect = $('.add-criteria-container select', $container);
        // check initial state
        assert.equal($criteriaContainer.length, 1, 'container for criteria is rendered');
        assert.equal($criteriaContainer.children().length, 0, 'container for criteria is empty');

        // set a default value for each criterion
        instance.getState()['in-both-text'].value = 'default value0';
        instance.getState()['in-both-select'].value = ['value0'];
        instance.getState()['in-both-list'].value = ['value1'];

        // render a criterion from each type
        $criteriaSelect.select2('val', 'in-both-text').trigger('change');
        $criteriaSelect.select2('val', 'in-both-select').trigger('change');
        $criteriaSelect.select2('val', 'in-both-list').trigger('change');
        const $criterionTextInput = $criteriaContainer.find('.in-both-text-filter input');
        const $criterionSelectInput = $criteriaContainer.find('.in-both-select-filter input');
        const $criterionListSelected = $criteriaContainer
            .find('.in-both-list-filter input[type=checkbox]:checked')
            .get()
            .map(checkbox => {
                return checkbox.value;
            });

        // check default value on each criterion type
        assert.equal($criterionTextInput.val(), 'default value0', 'text criterion correctly initialized');
        assert.deepEqual($criterionSelectInput.select2('val'), ['value0'], 'select criterion correctly initialized');
        assert.deepEqual($criterionListSelected, ['value1'], 'list criterion correctly initialized');

        // update value on each criterion
        $criterionTextInput.val('foo0').trigger('change');
        $criteriaContainer
            .find('.in-both-list-filter input[type=checkbox][value=value2]')
            .prop('checked', true)
            .trigger('change');

        // check updated value on each criterion
        assert.equal(instance.getState()['in-both-text'].value, 'foo0', 'text criterion correctly updated');
        assert.deepEqual(
            instance.getState()['in-both-list'].value,
            ['value1', 'value2'],
            'list criteria correctly updated'
        );

        const query = instance.getAdvancedCriteriaQuery();
        assert.equal(
            query,
            ' AND in-both-text:foo0 AND in-both-list:(value1 OR value2) AND in-both-select:(value0)',
            'advanced search query is correctly built'
        );
        instance.destroy();
        ready();
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
