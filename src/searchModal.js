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
 * Copyright (c) 2020 (original work) Open Assessment Technologies SA ;
 */
import $ from 'jquery';
import _ from 'lodash';
import __ from 'i18n';
import context from 'context';
import layoutTpl from 'ui/searchModal/tpl/layout';
import infoMessageTpl from 'ui/searchModal/tpl/info-message';
import textCriteriaTpl from 'ui/searchModal/tpl/text-criteria';
import invalidCriteriaWarningTpl from 'ui/searchModal/tpl/invalid-criteria-warning';
import listCheckboxCriteriaTpl from 'ui/searchModal/tpl/list-checkbox-criteria';
import listSelectCriteriaTpl from 'ui/searchModal/tpl/list-select-criteria';
import 'ui/searchModal/css/searchModal.css';
import component from 'ui/component';
import 'ui/modal';
import 'ui/datatable';
import store from 'core/store';
import resourceSelectorFactory from 'ui/resource/selector';
import request from 'core/dataProvider/request';
import urlUtil from 'util/url';
import 'select2';

/**
 * Creates a searchModal instance
 *
 * @param {object} config
 * @param {object} config.renderTo - DOM element where component will be rendered to
 * @param {string} config.criterias - Search criterias to be set on component creation
 * @param {boolean} config.searchOnInit - if init search must be triggered or not (stored results are used instead)
 * @param {string} config.url - search endpoint to be set on datatable
 * @param {string} config.rootClassUri - Uri for the root class of current context, required to init the class filter
 * @returns {searchModal}
 */
export default function searchModalFactory(config) {
    const defaults = {
        renderTo: 'body',
        criterias: {},
        searchOnInit: true
    };
    // Private properties to be easily accessible by instance methods
    let $container = null;
    let $searchInput = null;
    let $searchButton = null;
    let $clearButton = null;
    let running = false;
    let searchStore = null;
    let resourceSelector = null;
    let $classFilterContainer = null;
    let $classFilterInput = null;
    let $classTreeContainer = null;
    let $addCriteriaInput = null;
    let $criteriaSelect = null;
    let $advancedCriteriasContainer = null;
    let criteriasState = null;

    /**
     * Creates search modal, inits template selectors, inits search store, and once is created triggers initial search
     */
    function renderModal() {
        const promises = [];
        initModal();
        initUiSelectors();
        initAddCriteriaSelector();
        initCriteriasState();
        promises.push(initClassFilter());
        promises.push(initSearchStore());
        Promise.all(promises)
            .then(() => {
                instance.trigger('ready');
                $searchButton.trigger('click');
            })
            .catch(e => instance.trigger('error', e));
    }

    /**
     * inis criteriasState loading the one from the store (if present) or empty object.
     * If there is a stored criteriasState, those criterias that were rendered
     * but with undefined value are updated to not being rendered
     */
    function initCriteriasState() {
        if (instance.config.criterias.advancedCriterias) {
            _.forEach(instance.config.criterias.advancedCriterias, criteria => {
                if (criteria.rendered === true && criteria.value === undefined) {
                    criteria.rendered = false;
                }
            });
        }
        criteriasState = instance.config.criterias.advancedCriterias || {};
    }

    /**
     * Removes search modal
     */
    function destroyModal() {
        $container.removeClass('modal').modal('destroy');
        $('.modal-bg').remove();
    }

    // Creates new component
    const instance = component({}, defaults)
        .setTemplate(layoutTpl)
        .on('render', renderModal)
        .on('destroy', destroyModal);

    /**
     * Creates search modal
     */
    function initModal() {
        $container = instance.getElement();
        $container
            .addClass('modal')
            .on('closed.modal', () => instance.destroy())
            .modal({
                disableEscape: true,
                width: $(window).width(),
                minHeight: $(window).height(),
                modalCloseClass: 'modal-close-left'
            })
            .focus();
    }

    /**
     * Inits class filter selector
     */
    function initClassFilter() {
        return new Promise(resolve => {
            const rootClassUri = instance.config.rootClassUri;
            const initialClassUri =
                instance.config.criterias && instance.config.criterias.class
                    ? instance.config.criterias.class
                    : rootClassUri;
            resourceSelector = resourceSelectorFactory($('.class-tree', $container), {
                //set up the inner resource selector
                selectionMode: 'single',
                selectClass: true,
                classUri: rootClassUri,
                showContext: false,
                showSelection: false
            });

            // when a class query is triggered, update selector options with received resources
            resourceSelector.on('query', params => {
                const classOnlyParams = { ...params, classOnly: true };
                const route = urlUtil.route('getAll', 'RestResource', 'tao');
                request(route, classOnlyParams)
                    .then(response => {
                        resourceSelector.update(response.resources, classOnlyParams);
                    })
                    .catch(e => instance.trigger('error', e));
            });

            /*
             * the first time selector opions are updated the root class is selected. Promise is
             * resolved so init process continues only when class input value has been set
             */
            resourceSelector.on('update', () => {
                resourceSelector.off('update');

                resourceSelector.select(initialClassUri);
                resolve();
            });

            // then new class is selected, set its label into class filter input and hide filter container, then request class properties
            resourceSelector.on('change', selectedValue => {
                /*
                 * on searchModal init we set manually the selector to the provided config.rootClassUri. When a selector
                 * is set manually Selector component execs @clearSelection which triggers a change event
                 * with an empty object as param. We catch this undesired behaviour here
                 */
                if (_.isEmpty(selectedValue)) {
                    return;
                }
                $classFilterInput.val(_.map(selectedValue, 'label')[0]);
                $classTreeContainer.hide();
                // TODO - once BE is implemented, this might be moved to select2 ajax constructor property and using minimumInputLength: 0
                const availableCriterias = requestAvailableCriterias(selectedValue);
                updateAvailableCriteriasList(availableCriterias);
            });

            setResourceSelectorUIBehaviour();
        });
    }

    /**
     * Request properties of selected class (and children) schemas
     * @param {object} selectedValue - class to retreieve its properties from
     * @returns {array} - array of class properties
     */
    function requestAvailableCriterias(selectedValue) {
        /**
         * TODO - Implement ajax request once is implemented on BE. This conditional is
         * just to check the logic of replacing/removing criterias on class change
         */
        if (_.map(selectedValue, 'label')[0] === 'Item') {
            return [
                {
                    label: 'in-both-text',
                    type: 'text'
                },
                {
                    label: 'in-both-list',
                    type: 'list',
                    values: ['value0', 'value1', 'value2', 'value3']
                },
                {
                    label: 'in-both-select',
                    type: 'list',
                    values: ['value0', 'value1', 'value2', 'value3', 'value4']
                },
                {
                    label: 'only-in-root',
                    type: 'text'
                }
            ];
        } else if (_.map(selectedValue, 'label')[0] === 'QTI Interactions') {
            return [
                {
                    label: 'in-both-text',
                    type: 'text'
                },
                {
                    label: 'in-both-list',
                    type: 'list',
                    values: ['value0', 'value1', 'value2', 'value3']
                },
                {
                    label: 'in-both-select',
                    type: 'list',
                    values: ['value0', 'value1', 'value2', 'value3', 'value4']
                },
                {
                    label: 'only-in-child',
                    type: 'text'
                }
            ];
        }
    }

    /**
     * Manages the new set of available criterias. To do so, removes warning container and every
     * selectable criteria. Then removes from criteriasState and view every deprecated criteria,
     * updates criteriasState with the new available criterias set, and renders new warning
     * message if required
     * @param {array} availableCriterias - array of class properties
     */
    function updateAvailableCriteriasList(availableCriterias) {
        $('.invalid-criteria-warning-container').remove();
        $criteriaSelect.find('option:not(:first-child)').remove();
        const invalidCriteria = deleteDeprecatedCriterias(availableCriterias);
        extendNewCriterias(availableCriterias);
        renderWarningMessage(invalidCriteria);
    }

    /**
     * If there is any invalid criteria, renders an explanatory warning message
     * @param {array} invalidCriteria - array of string containing the label of every invalid criteria (those that were rendered but are no longer available)
     */
    function renderWarningMessage(invalidCriteria) {
        if (invalidCriteria.length > 0) {
            const invalidCriteriaWarning = invalidCriteriaWarningTpl({ invalidCriteria });
            $advancedCriteriasContainer.prepend(invalidCriteriaWarning);
            $('.invalid-criteria-warning-container .select2-search-choice-close', $advancedCriteriasContainer).on(
                'click',
                function () {
                    $(this).parent().remove();
                }
            );
        }
    }
    /**
     * Loops through current criteriasState so every criteria that is no longer available in the new
     * available criteria set is removed from criteriasState and from view, in case it had been
     * rendered. In that case it is also pushed into invalidCriteria array to be latter
     * included in the warning message
     * @param {array} availableCriterias - array containing new set of criterias for current class
     * @returns {array} - array of strings with each deprecated criteria that was being displayed
     */
    function deleteDeprecatedCriterias(availableCriterias) {
        const invalidCriteria = [];

        _.forEach(criteriasState, oldCriteria => {
            const deprecatedCriteria = !availableCriterias.find(newCriteria => newCriteria.label === oldCriteria.label);
            if (deprecatedCriteria) {
                if (criteriasState[oldCriteria.label].rendered) {
                    $advancedCriteriasContainer.find(`.${oldCriteria.label}-filter`).remove();
                    invalidCriteria.push(oldCriteria.label);
                }
                delete criteriasState[oldCriteria.label];
            }
        });

        return invalidCriteria;
    }

    /**
     * Loops through new criterias set and checks if each new criteria was already present or not on criteriasState
     * and updates view and selectable criterias list accordingly
     * @param {array} availableCriterias - array containing new set of criterias for current class
     */
    function extendNewCriterias(availableCriterias) {
        availableCriterias.forEach(criteria => {
            let createOption = true;

            // if new criteria was already on criteriasState and had to be rendered, we avoid creating an option for it and render it if it was not
            if (criteriasState[criteria.label] && criteriasState[criteria.label].rendered === true) {
                createOption = false;
                if ($advancedCriteriasContainer.find(`.${criteria.label}-filter`).length === 0) {
                    addNewCriteria(criteria.label);
                }
            } else {
                // if new criteria was not on criteriaState we add it
                criteriasState[criteria.label] = criteria;
                criteriasState[criteria.label].rendered = false;
                criteriasState[criteria.label].value = undefined;
            }

            // create new option element to criterias select
            if (createOption) {
                const newOption = new Option(criteria.label, criteria.label, false, false);
                $criteriaSelect.append(newOption);
            }
        });
    }

    /**
     * Inits template selectors, buttons behaviour, scroll animation,
     * and sets initial search query on search input
     */
    function initUiSelectors() {
        $searchButton = $('.btn-search', $container);
        $clearButton = $('.btn-clear', $container);
        $searchInput = $('.generic-search-input', $container);
        $classFilterInput = $('.class-filter', $container);
        $classTreeContainer = $('.class-tree', $container);
        $classFilterContainer = $('.class-filter-container', $container);
        $addCriteriaInput = $('.add-criteria-container a', $container);
        $criteriaSelect = $('.add-criteria-container select', $container);
        $advancedCriteriasContainer = $('.advanced-criterias-container', $container);

        $advancedCriteriasContainer.on('scroll', animateScroll);
        $searchButton.on('click', search);
        $clearButton.on('click', clear);
        $searchInput.val(
            instance.config.criterias && instance.config.criterias.search ? instance.config.criterias.search : ''
        );
    }

    /**
     * Styles scrolling on $advancedCriteriasContainer
     */
    function animateScroll() {
        const scrollPercentage =
            $advancedCriteriasContainer.get(0).scrollTop /
            ($advancedCriteriasContainer.get(0).scrollHeight - $advancedCriteriasContainer.get(0).clientHeight);
        if (scrollPercentage > 0.1) {
            $advancedCriteriasContainer.addClass('scroll-separator-top');
        } else {
            $advancedCriteriasContainer.removeClass('scroll-separator-top');
        }
        if (scrollPercentage < 0.9) {
            $advancedCriteriasContainer.addClass('scroll-separator-bottom');
        } else {
            $advancedCriteriasContainer.removeClass('scroll-separator-bottom');
        }
    }

    /**
     * Inits select2 on criteria select and its UX logic
     */
    function initAddCriteriaSelector() {
        $criteriaSelect.select2({
            containerCssClass: 'criteria-select2',
            dropdownCssClass: 'criteria-dropdown-select2',
            sortResults: results => _.sortBy(results, ['text'])
        });

        // open dropdown when user clicks on add criteria input
        $addCriteriaInput.on('click', () => {
            $criteriaSelect.select2('open');
            // if dropdown is opened above addCriteria input, top property is slightly decreased to avoid overlapping with addCriteria icon
            if ($('.criteria-dropdown-select2').hasClass('select2-drop-above')) {
                $('.criteria-dropdown-select2').css(
                    'top',
                    $('.criteria-dropdown-select2').css('top').split('px')[0] - 10 + 'px'
                );
            }
        });

        // when a criteria is selected add it to criterias container, remove it from dropdown options and reset select
        $criteriaSelect.on('change', () => {
            const criteriaToAdd = $criteriaSelect.children('option:selected').val();
            addNewCriteria(criteriaToAdd);
            $criteriaSelect.children('option:selected').remove();
            $criteriaSelect.select2('val', '');
        });
    }

    /**
     * Renders new criteria to criterias container so it can be used on advanced search filtering
     * @param {string} criteriaToAdd - new criteria to be added
     */
    function addNewCriteria(criteriaToAdd) {
        // remove deprecated warning message
        $('.invalid-criteria-warning-container').remove();

        // render new criteria
        const criteria = criteriasState[criteriaToAdd];
        const $criteriaContainer = renderCriteria(criteria);

        // set logic to remove criteria
        $('.select2-search-choice-close', $criteriaContainer).on('click', { criteria }, removeCriteria);

        // set initial value and manage value changes
        bindCriteriaValue(criteria, $criteriaContainer);

        // update styles if scroll is enabled
        if ($advancedCriteriasContainer.get(0).scrollHeight > $advancedCriteriasContainer.height()) {
            $advancedCriteriasContainer.addClass('scrollable');
        }

        criteria.rendered = true;
    }

    /**
     * Sets intial value for rendered criteria and sets binding between view and state
     * @param {object} criteria - criteria to be managed
     * @param {object} $criteriaContainer - rendered criteria
     */
    function bindCriteriaValue(criteria, $criteriaContainer) {
        if (criteria.type === 'text') {
            // set initial value
            $('input', $criteriaContainer).val(criteria.value);
            // set event to bind input value to critariaState
            $('input', $criteriaContainer).on('change', function () {
                criteria.value = $(this).val() || undefined;
            });
        } else if (criteria.type === 'list' && criteria.values.length >= 5) {
            // set initial value
            if (criteria.value) {
                $(`input[name=${criteria.label}-select]`, $criteriaContainer).select2('val', criteria.value);
            }
            // set event to bind input value to critariaState
            $(`input[name=${criteria.label}-select]`, $criteriaContainer).on('change', event => {
                criteria.value = event.val;
            });
        } else {
            // set initial value
            if (criteria.value) {
                criteria.value.forEach(selectedValue => {
                    $(`input[value=${selectedValue}]`, $criteriaContainer).prop('checked', true);
                });
            }
            // set event to bind input value to critariaState
            $('input[type="checkbox"]', $criteriaContainer).on('change', function () {
                criteria.value = $(this)
                    .closest('.filter-container')
                    .find('input[type=checkbox]:checked')
                    .get()
                    .map(function (element) {
                        return element.value;
                    });
            });
        }
    }

    /**
     * Renders the new criteria selecting the appropiate handlebars template and prepending to advanced criterias container.
     * If criteria is of type list with more than give options, select2 is also init
     * @param {object} criteriaData - criteria to render
     * @returns - the rendered container
     */
    function renderCriteria(criteriaData) {
        let templateToUse = null;

        if (criteriaData.type === 'text') {
            templateToUse = textCriteriaTpl;
        } else if (criteriaData.type === 'list' && criteriaData.values.length < 5) {
            templateToUse = listCheckboxCriteriaTpl;
        } else {
            templateToUse = listSelectCriteriaTpl;
        }

        $advancedCriteriasContainer.prepend(templateToUse({ criteriaData }));
        const $criteriaContainer = $(`.${criteriaData.label}-filter`, $container);

        /**
         * On criterias of type list with more than five options, template includes a select
         * that is managed with select2, so we init it here
         */
        if (criteriaData.type === 'list' && criteriaData.values.length >= 5) {
            $(`input[name=${criteriaData.label}-select]`, $criteriaContainer).select2({
                multiple: true,
                data: criteriaData.values.map(value => {
                    return { id: value, text: value };
                })
            });
        }

        return $criteriaContainer;
    }

    /**
     * Removes a criteria from advanced criterias container when user clicks on the criteria close icon.
     * It also adds the option element to criteria select so removed criteria can be rendered again
     * @param {object} event - click event triggered on closing icon
     */
    function removeCriteria(event) {
        const criteriaData = event.data.criteriaData;
        const newOption = new Option(criteriaData.label, criteriaData.label, false, false);

        // remove criteria and append new criteria to select options
        $(this).parent().remove();
        $criteriaSelect.append(newOption);

        // reset criteria values on criteriaState
        criteriasState[criteriaData.label].rendered = false;
        criteriasState[criteriaData.label].value = undefined;

        // check if advanced criterias container is no longer scrollable
        if ($advancedCriteriasContainer.get(0).scrollHeight === $advancedCriteriasContainer.height()) {
            $advancedCriteriasContainer.removeClass('scrollable');
        }
    }

    /**
     * Sets required listeners to properly manage resourceSelector visualization
     */
    function setResourceSelectorUIBehaviour() {
        $container.on('mousedown', () => {
            $classTreeContainer.hide();
        });

        /**
         * clicking on class filter input will toggle resource selector,
         * will preventDefault to avoid focus on input field,
         * and will stopPropagation to prevent be closed
         * by searchModal.mouseDown listener
         */
        $classFilterContainer.on('mousedown', e => {
            e.preventDefault();
            e.stopPropagation();
            $classTreeContainer.toggle();
        });

        // clicking on resource selector will stopPropagation to prevent be closed by searchModal.mouseDown listener
        $classTreeContainer.on('mousedown', e => {
            e.stopPropagation();
        });
    }

    /**
     * Loads search store so it is accessible in the component
     * @returns {Promise}
     */
    function initSearchStore() {
        return store('search')
            .then(function (store) {
                searchStore = store;
            })
            .catch(e => instance.trigger('error', e));
    }

    /**
     * Request search results and manages its results
     */
    function search() {
        // if query is empty just clear datatable
        if ($searchInput.val() === '') {
            clear();
            return;
        }

        // build complex query
        const query = buildComplexQuery();

        //throttle and control to prevent sending too many requests
        const searchHandler = _.throttle(query => {
            if (running === false) {
                running = true;
                $.ajax({
                    url: instance.config.url,
                    type: 'POST',
                    data: { query: query },
                    dataType: 'json'
                })
                    .done(data => {
                        appendDefaultDatasetToDatatable(data)
                            .then(() => buildSearchResultsDatatable(data))
                            .catch(e => instance.trigger('error', e));
                    })
                    .always(() => (running = false));
            }
        }, 100);

        searchHandler(query);
    }

    /**
     * build final complex query appending every filter
     */
    function buildComplexQuery() {
        const $searchInputValue = $searchInput.val().trim();
        const classFilterValue = $classFilterInput.val().trim();
        let query = `class:${classFilterValue} AND ${$searchInputValue}`;
        console.dir(criteriasState);
        const advancedSearchCriterias = _.filter(criteriasState, criteria => criteria.rendered === true);
        advancedSearchCriterias.forEach(renderedCriteria => {
            if (renderedCriteria.type === 'text') {
                if (renderedCriteria.value && renderedCriteria.value.trim() !== '') {
                    query += ` AND ${renderedCriteria.label}:${renderedCriteria.value.trim()}`;
                }
            } else if (renderedCriteria.type === 'list') {
                if (renderedCriteria.value && renderedCriteria.value.length > 0) {
                    query += ` AND ${renderedCriteria.label}:(${renderedCriteria.value.join(' OR ')})`;
                }
            }
        });
        return query;
    }

    /*
     * If search on init is not required, extends data with stored dataset
     * @param {object} data - search configuration including model and endpoint for datatable
     * @returns {Promise}
     */
    function appendDefaultDatasetToDatatable(data) {
        return new Promise(function (resolve, reject) {
            // If no search on init, get dataset from searchStore
            if (instance.config.searchOnInit === false) {
                searchStore
                    .getItem('results')
                    .then(storedSearchResults => {
                        instance.config.searchOnInit = true;
                        data.storedSearchResults = storedSearchResults;
                        resolve();
                    })
                    .catch(e => {
                        instance.trigger('error', e);
                        reject(new Error('Error appending default dataset from searchStore to datatable'));
                    });
            } else {
                resolve();
            }
        });
    }

    /**
     * Creates a datatable with search results
     * @param {object} data - search configuration including model and endpoint for datatable
     */
    function buildSearchResultsDatatable(data) {
        //update the section container
        const $tableContainer = $('<div class="flex-container-full"></div>');
        const section = $('.content-container', $container);
        section.empty();
        section.append($tableContainer);
        $tableContainer.on('load.datatable', searchResultsLoaded);

        //create datatable
        $tableContainer.datatable(
            {
                url: data.url,
                model: _.values(data.model),
                labels: {
                    actions: ''
                },
                actions: [
                    {
                        id: 'go-to-item',
                        label: __('Go to item'),
                        action: function openResource(uri) {
                            instance.trigger('refresh', uri);
                            instance.destroy();
                        }
                    }
                ],
                params: {
                    params: data.params,
                    filters: data.filters,
                    rows: 20
                }
            },
            data.storedSearchResults
        );
    }

    /**
     * Triggered on load.datatable event, it updates searchStore and manages possible exceptions
     * @param {object} e - load.datatable event
     * @param {object} dataset - datatable dataset
     */
    function searchResultsLoaded(e, dataset) {
        if (dataset.records === 0) {
            replaceSearchResultsDatatableWithMessage('no-matches');
        }
        instance.trigger(`datatable-loaded`);
        updateSearchStore({
            action: 'update',
            dataset,
            context: context.shownStructure,
            criterias: {
                search: $searchInput.val(),
                class: _.map(resourceSelector.getSelection(), 'uri')[0],
                advancedCriterias: criteriasState
            }
        });
    }

    /**
     * Updates searchStore. If action is 'clear', searchStore is claread. If not, received
     * data is assigned to searchStore. Once all actions have been done,
     * store-updated event is triggered
     * @param {object} data - data to store
     */
    function updateSearchStore(data) {
        const promises = [];
        if (data.action === 'clear') {
            promises.push(searchStore.clear());
        } else if (data.action === 'update') {
            promises.push(searchStore.setItem('criterias', data.criterias));
            promises.push(searchStore.setItem('context', data.context));
            promises.push(
                data.dataset.records === 0
                    ? searchStore.removeItem('results')
                    : searchStore.setItem('results', data.dataset)
            );
        }

        Promise.all(promises)
            .then(() => instance.trigger(`store-updated`))
            .catch(e => instance.trigger('error', e));
    }

    /**
     * Clear search input, criterias and results from both, view and store
     */
    function clear() {
        $searchInput.val('');
        $advancedCriteriasContainer.removeClass('scrollable');
        $advancedCriteriasContainer.empty();
        resourceSelector.select(instance.config.rootClassUri);
        replaceSearchResultsDatatableWithMessage('no-query');
        updateSearchStore({ action: 'clear' });
    }

    /**
     * Removes datatable container and displays a message instead
     * @param {string} reason - reason why datatable is not rendered, to display appropiate message
     */
    function replaceSearchResultsDatatableWithMessage(reason) {
        const section = $('.content-container', $container);
        section.empty();
        let message = '';
        let icon = '';

        if (reason === 'no-query') {
            message = __('Please define your search in the search panel.');
            icon = 'icon-find';
        } else if (reason === 'no-matches') {
            message = __('No item found. Please try other search criteria.');
            icon = 'icon-info';
        }

        const infoMessage = infoMessageTpl({ message, icon });
        section.append(infoMessage);
    }

    // return initialized instance of searchModal
    return instance.init(config);
}
