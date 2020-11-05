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
    $.mockjax({
        url: new RegExp(/.+ClassMetadata.+/),
        dataType: 'json',
        responseText: mocks.mockedAdvancedCriteria
    });
    $.mockjax({
        url: 'undefined/tao/AdvancedSearch/status',
        dataType: 'json',
        responseText: {
            success: true,
            data: {
                enabled: true
            }
        }
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
                    criterias: { search: 'example', advancedCriteria: mocks.mockedCriteriaStore },
                    url: '/test/searchModal/mocks/with-occurrences/search.json',
                    renderTo: '#testable-container',
                    searchOnInit: false,
                    rootClassUri: 'http://www.tao.lu/Ontologies/TAOItem.rdf#Item'
                });

                instance.on('criteriaListUpdated', function () {
                    const $container = $('.advanced-search-container');
                    const $invalidCriteriaContainer = $container.find('.invalid-criteria-warning-container');

                    assert.equal($invalidCriteriaContainer.length, 0, 'invalid criteira is not initially rendered');
                    _.forEach(mocks.mockedCriteriaStore, criterionToRender => {
                        // check for each stored criterion if it is rendered when criterion.rendered is true, and viceversa
                        assert.equal(
                            $container.find(`.${criterionToRender.id}-filter`).length,
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
    QUnit.cases.init([
        {
            response: {
                enabled: true
            },
        },
        {
            response: {
                enabled: false
            },
        }
    ]).test('advancedSearch criteria manipulation', function (data, assert) {
        const instance = searchModalFactory({
            criterias: { search: 'example' },
            url: '/test/searchModal/mocks/with-occurrences/search.json',
            renderTo: '#testable-container',
            rootClassUri: 'http://www.tao.lu/Ontologies/TAOItem.rdf#Item'
        });

        const ready = assert.async();
        assert.expect(13);

        $.mockjax({
            url: 'undefined/tao/AdvancedSearch/status',
            dataType: 'json',
            responseText: {
                success: true,
                data: data.response
            }
        });

        instance.on('criteriaListUpdated', function () {
            const $container = $('.advanced-search-container');
            const $criteriaContainer = $container.find('.advanced-criteria-container');
            const $addCriteria = $('.add-criteria-container', $container);
            const $addCriteriaInput = $('.add-criteria-container a', $container);
            const $criteriaSelect = $('.add-criteria-container select', $container);
            let $optionToSelect = $criteriaSelect.find('option[value="in-both-text"]');

            // check initial state
            assert.equal($optionToSelect.length, 1, 'criterion to select is initially on select options');

            // select a criterion
            $addCriteriaInput.trigger('click');
            assert.equal($criteriaSelect.select2('opened'), true, 'critera select is opened on click');
            $criteriaSelect.select2('val', 'in-both-text').trigger('change');

            // check state after criterion is select
            $optionToSelect = $criteriaSelect.find('option[value="in-both-text"]');
            assert.equal($criteriaContainer.find('.inbothtext-filter').length, 1, 'criterion is added to DOM');
            assert.equal($criteriaSelect.select2('opened'), false, 'critera select is closed after adding a criteria');
            assert.equal($optionToSelect.length, 0, 'selected criterion is not longer on select options');

            // close added criterion
            $criteriaContainer.find('.inbothtext-filter .icon-result-nok').trigger('click');
            $optionToSelect = $criteriaSelect.find('option[value="in-both-text"]');
            assert.equal($criteriaContainer.find('.inbothtext-filter').length, 0, 'criterion was removed');
            assert.equal($optionToSelect.length, 1, 'criterion is selectable again');

            // add a criterion that is not available on child class
            $criteriaSelect.select2('val', 'in-parent-text').trigger('change');
            assert.equal($criteriaContainer.find('.inparenttext-filter').length, 1, 'criterion is added to DOM');

            // change current class and check that unavailable criterion has been removed
            const $qtiInteractionsClassNode = $('.class-tree [title="QTI Interactions"]');
            $qtiInteractionsClassNode.trigger('click');
            $.mockjax.handler(1).responseText = mocks.mockedAdvancedCriteriaInChildClass;
            instance.off('criteriaListUpdated').on('criteriaListUpdated', function () {
                instance.off('criteriaListUpdated');
                assert.equal($criteriaContainer.find('.in-parent-text').length, 0, 'criterion was removed');
                assert.equal($container.find('.invalid-criteria-warning-container').length, 1, 'warning rendered');

                // add a new criterion
                $criteriaSelect.select2('val', 'in-child-text').trigger('change');
                assert.equal($criteriaContainer.find('.inchildtext-filter').length, 1, 'criterion is added to DOM');
                assert.equal($container.find('.invalid-criteria-warning-container').length, 0, 'warning removed');

                // clear current search
                $('.btn-clear').trigger('click');
                assert.equal($criteriaContainer.children().length, 0, 'container for criteria is empty');
                instance.destroy();
                ready();
                $.mockjax.handler(1).responseText = mocks.mockedAdvancedCriteria;
            });

            instance.off('ready').on('ready', function () {
                if (data.enabled) {
                    assert.equal(!$addCriteria.hasClass('disabled'), data.enabled, 'critera select is enabled because status is enabled');
                    return;
                }
                assert.equal($addCriteria.hasClass('disabled'), data.enabled, 'critera select is disabled because status is disabled');
            });
        });
    });
    QUnit.test('bind between view and model is correctly set', function (assert) {
        const instance = advancedSearchFactory({
            renderTo: '#testable-container'
        });
        const ready = assert.async();
        assert.expect(8);
        instance.updateCriteria('undefined/tao/ClassMetadata/').then(function () {
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
            const $criterionTextInput = $criteriaContainer.find('.inbothtext-filter input');
            const $criterionSelectInput = $criteriaContainer.find('.inbothselect-filter input');
            const $criterionListSelected = $criteriaContainer
                .find('.inbothlist-filter input[type=checkbox]:checked')
                .get()
                .map(checkbox => {
                    return checkbox.value;
                });

            // check default value on each criterion type
            assert.equal($criterionTextInput.val(), 'default value0', 'text criterion correctly initialized');
            assert.deepEqual(
                $criterionSelectInput.select2('val'),
                ['value0'],
                'select criterion correctly initialized'
            );
            assert.deepEqual($criterionListSelected, ['value1'], 'list criterion correctly initialized');

            // update value on each criterion
            $criterionTextInput.val('foo0').trigger('change');
            $criteriaContainer
                .find('.inbothlist-filter input[type=checkbox][value=value2]')
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
                ' AND in-both-text:foo0 AND in-both-list:value1 OR value2 AND in-both-select:value0',
                'advanced search query is correctly built'
            );
            instance.destroy();
            ready();
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
