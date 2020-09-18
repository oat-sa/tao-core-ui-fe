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
import textCriterionTpl from 'ui/searchModal/tpl/text-criterion';
import invalidCriteriaWarningTpl from 'ui/searchModal/tpl/invalid-criteria-warning';
import listCheckboxCriterionTpl from 'ui/searchModal/tpl/list-checkbox-criterion';
import listSelectCriterionTpl from 'ui/searchModal/tpl/list-select-criterion';
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
 * @param {string} config.criterias - Search criteria to be set on component creation
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
    let $advancedCriteriaContainer = null;
    let criteriaState = null;

    /**
     * Creates search modal, inits template selectors, inits search store, and once is created triggers initial search
     */
    function renderModal() {
        const promises = [];
        initModal();
        initUiSelectors();
        initAddCriteriaSelector();
        initcriteriaState();
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
     * inits criteriaState loading it from the store (if present) or empty object.
     * If there is a stored criteriaState, those criteria that were rendered
     * but with undefined value are updated to not being rendered
     */
    function initcriteriaState() {
        if (instance.config.criterias.advancedCriteria) {
            _.forEach(instance.config.criterias.advancedCriteria, criterion => {
                if (criterion.rendered === true && criterion.value === undefined) {
                    criterion.rendered = false;
                }
            });
        }
        criteriaState = instance.config.criterias.advancedCriteria || {};
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
                const criteria = requestCriteria(selectedValue);
                updateCriteria(criteria);
            });

            setResourceSelectorUIBehaviour();
        });
    }

    /**
     * Request criteria for selected class (and children) schemas
     * @param {object} selectedValue - class to retreieve its properties from
     * @returns {array} - array of class properties
     */
    function requestCriteria(selectedValue) {
        /**
         * TODO - Implement ajax request once is implemented on BE. This conditional is
         * just to check the logic of replacing/removing criteria on class change
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
     * Manages the new set of available criteria. To do so, removes warning container and every
     * selectable criterion. Then removes from criteriaState and view every deprecated criterion,
     * updates criteriaState with the new available criteria set, and renders new warning
     * message if required
     * @param {array} criteria - array of class properties
     */
    function updateCriteria(criteria) {
        $('.invalid-criteria-warning-container').remove();
        $criteriaSelect.find('option:not(:first-child)').remove();
        const invalidCriteria = deleteDeprecatedCriteria(criteria);
        extendCriteria(criteria);
        renderWarningMessage(invalidCriteria);
    }

    /**
     * If there is any invalid criterion, renders an explanatory warning message
     * @param {array} invalidCriteria - array of string containing the label of every invalid criterion (those that were rendered but are no longer available)
     */
    function renderWarningMessage(invalidCriteria) {
        if (invalidCriteria.length > 0) {
            const invalidCriteriaWarning = invalidCriteriaWarningTpl({ invalidCriteria });
            $advancedCriteriaContainer.prepend(invalidCriteriaWarning);
            $('.invalid-criteria-warning-container .select2-search-choice-close', $advancedCriteriaContainer).on(
                'click',
                function () {
                    $(this).parent().remove();
                }
            );
        }
    }
    /**
     * Loops through current criteriaState so every criterion that is no longer available in the new
     * available criteria set is removed from criteriaState and from view, in case it had been
     * rendered. In that case it is also pushed into invalidCriteria array to be latter
     * included in the warning message
     * @param {array} criteria - array containing new set of criteria for current class
     * @returns {array} - array of strings with each deprecated criterion that was being displayed
     */
    function deleteDeprecatedCriteria(criteria) {
        const invalidCriteria = [];

        _.forEach(criteriaState, oldCriterion => {
            const deprecatedCriterion = !criteria.find(newCriterion => newCriterion.label === oldCriterion.label);
            if (deprecatedCriterion) {
                if (criteriaState[oldCriterion.label].rendered) {
                    $advancedCriteriaContainer.find(`.${oldCriterion.label}-filter`).remove();
                    invalidCriteria.push(oldCriterion.label);
                }
                delete criteriaState[oldCriterion.label];
            }
        });

        return invalidCriteria;
    }

    /**
     * Loops through new criteria set and checks if each new criterion was already present or not on criteriaState
     * and updates view and selectable criteria list accordingly
     * @param {array} criteria - array containing new set of criteria for current class
     */
    function extendCriteria(criteria) {
        criteria.forEach(criterion => {
            let createOption = true;

            // if new criterion was already on criteriaState and had to be rendered, we avoid creating an option for it and render it if it was not
            if (criteriaState[criterion.label] && criteriaState[criterion.label].rendered === true) {
                createOption = false;
                if ($advancedCriteriaContainer.find(`.${criterion.label}-filter`).length === 0) {
                    addNewCriterion(criterion.label);
                }
            } else {
                // if new criterion was not on criteriaState we add it
                criteriaState[criterion.label] = criterion;
                criteriaState[criterion.label].rendered = false;
                criteriaState[criterion.label].value = undefined;
            }

            // create new option element to criteria select
            if (createOption) {
                const newOption = new Option(criterion.label, criterion.label, false, false);
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
        $advancedCriteriaContainer = $('.advanced-criteria-container', $container);

        $advancedCriteriaContainer.on('scroll', animateScroll);
        $searchButton.on('click', search);
        $clearButton.on('click', clear);
        $searchInput.val(
            instance.config.criterias && instance.config.criterias.search ? instance.config.criterias.search : ''
        );
    }

    /**
     * Styles scrolling on $advancedCriteriaContainer
     */
    function animateScroll() {
        const scrollPercentage =
            $advancedCriteriaContainer.get(0).scrollTop /
            ($advancedCriteriaContainer.get(0).scrollHeight - $advancedCriteriaContainer.get(0).clientHeight);
        if (scrollPercentage > 0.1) {
            $advancedCriteriaContainer.addClass('scroll-separator-top');
        } else {
            $advancedCriteriaContainer.removeClass('scroll-separator-top');
        }
        if (scrollPercentage < 0.9) {
            $advancedCriteriaContainer.addClass('scroll-separator-bottom');
        } else {
            $advancedCriteriaContainer.removeClass('scroll-separator-bottom');
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

        // when a criterion is selected add it to criteria container, remove it from dropdown options and reset select
        $criteriaSelect.on('change', () => {
            const criterionToAdd = $criteriaSelect.children('option:selected').val();
            addNewCriterion(criterionToAdd);
            $criteriaSelect.children('option:selected').remove();
            $criteriaSelect.select2('val', '');
        });
    }

    /**
     * Renders new criterion to criteria container so it can be used on advanced search filtering
     * @param {string} criterionToAdd - new criterion to be added
     */
    function addNewCriterion(criterionToAdd) {
        // remove deprecated warning message
        $('.invalid-criteria-warning-container').remove();

        // render new criterion
        const criterion = criteriaState[criterionToAdd];
        const $criterionContainer = renderCriterion(criterion);

        // set logic to remove criterion
        $('.select2-search-choice-close', $criterionContainer).on('click', { criterion }, removeCriterion);

        // set initial value and manage value changes
        bindCriterionValue(criterion, $criterionContainer);

        // update styles if scroll is enabled
        if ($advancedCriteriaContainer.get(0).scrollHeight > $advancedCriteriaContainer.height()) {
            $advancedCriteriaContainer.addClass('scrollable');
        }

        criterion.rendered = true;
    }

    /**
     * Sets intial value for rendered criterion and sets binding between view and state
     * @param {object} criterion - criterion to be managed
     * @param {object} $criterionContainer - rendered criterion
     */
    function bindCriterionValue(criterion, $criterionContainer) {
        if (criterion.type === 'text') {
            // set initial value
            $('input', $criterionContainer).val(criterion.value);
            // set event to bind input value to critariaState
            $('input', $criterionContainer).on('change', function () {
                criterion.value = $(this).val() || undefined;
            });
        } else if (criterion.type === 'list' && criterion.values.length >= 5) {
            // set initial value
            if (criterion.value) {
                $(`input[name=${criterion.label}-select]`, $criterionContainer).select2('val', criterion.value);
            }
            // set event to bind input value to critariaState
            $(`input[name=${criterion.label}-select]`, $criterionContainer).on('change', event => {
                criterion.value = event.val;
            });
        } else {
            // set initial value
            if (criterion.value) {
                criterion.value.forEach(selectedValue => {
                    $(`input[value=${selectedValue}]`, $criterionContainer).prop('checked', true);
                });
            }
            // set event to bind input value to critariaState
            $('input[type="checkbox"]', $criterionContainer).on('change', function () {
                criterion.value = $(this)
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
     * Renders the new criterion selecting the appropiate handlebars template and prepending to advanced criteria container.
     * If criterion is of type list with more than give options, select2 is also init
     * @param {object} criterion - criterion to render
     * @returns - the rendered container
     */
    function renderCriterion(criterion) {
        let templateToUse = null;

        if (criterion.type === 'text') {
            templateToUse = textCriterionTpl;
        } else if (criterion.type === 'list' && criterion.values.length < 5) {
            templateToUse = listCheckboxCriterionTpl;
        } else {
            templateToUse = listSelectCriterionTpl;
        }

        $advancedCriteriaContainer.prepend(templateToUse({ criterion }));
        const $criterionContainer = $(`.${criterion.label}-filter`, $container);

        /**
         * On criterion of type list with more than five options, template includes a select
         * that is managed with select2, so we init it here
         */
        if (criterion.type === 'list' && criterion.values.length >= 5) {
            $(`input[name=${criterion.label}-select]`, $criterionContainer).select2({
                multiple: true,
                data: criterion.values.map(value => {
                    return { id: value, text: value };
                })
            });
        }

        return $criterionContainer;
    }

    /**
     * Removes a criterion from advanced criteria container when user clicks on the criterion close icon.
     * It also adds the option element to criteria select so removed criterion can be rendered again
     * @param {object} event - click event triggered on closing icon
     */
    function removeCriterion(event) {
        const criterion = event.data.criterion;
        const newOption = new Option(criterion.label, criterion.label, false, false);

        // remove criterion and append new criterion to select options
        $(this).parent().remove();
        $criteriaSelect.append(newOption);

        // reset criterion values on criteriaState
        criteriaState[criterion.label].rendered = false;
        criteriaState[criterion.label].value = undefined;

        // check if advanced criteria container is no longer scrollable
        if ($advancedCriteriaContainer.get(0).scrollHeight === $advancedCriteriaContainer.height()) {
            $advancedCriteriaContainer.removeClass('scrollable');
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
        const advancedSearchCriteria = _.filter(criteriaState, criterion => criterion.rendered === true);
        advancedSearchCriteria.forEach(renderedCriterion => {
            if (renderedCriterion.type === 'text') {
                if (renderedCriterion.value && renderedCriterion.value.trim() !== '') {
                    query += ` AND ${renderedCriterion.label}:${renderedCriterion.value.trim()}`;
                }
            } else if (renderedCriterion.type === 'list') {
                if (renderedCriterion.value && renderedCriterion.value.length > 0) {
                    query += ` AND ${renderedCriterion.label}:(${renderedCriterion.value.join(' OR ')})`;
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
                advancedCriteria: criteriaState
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
     * Clear search input, criteria and results from both, view and store.
     * Also sets every criterion on criteriaState to unredered and
     * undefined value
     */
    function clear() {
        $searchInput.val('');
        $advancedCriteriaContainer.removeClass('scrollable');
        $advancedCriteriaContainer.empty();
        _.forEach(criteriaState, criterion => {
            criterion.rendered = false;
            criterion.value = undefined;
        });
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
