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
 * Copyright (c) 2021 (original work) Open Assessment Technologies SA ;
 */

import $ from 'jquery';
import _ from 'lodash';
import __ from 'i18n';
import context from 'context';
import layoutTpl from 'ui/searchModal/tpl/layout';
import resultsContainerTpl from 'ui/searchModal/tpl/results-container';
import infoMessageTpl from 'ui/searchModal/tpl/info-message';
import propertySelectButtonTpl from 'ui/searchModal/tpl/property-select-button';
import 'ui/searchModal/css/searchModal.css';
import component from 'ui/component';
import 'ui/modal';
import 'ui/datatable';
import store from 'core/store';
import resourceSelectorFactory from 'ui/resource/selector';
import propertySelectorFactory from 'ui/propertySelector/propertySelector';
import advancedSearchFactory from 'ui/searchModal/advancedSearch';
import request from 'core/dataProvider/request';
import urlUtil from 'util/url';
import 'select2';
import shortcutRegistry from 'util/shortcut/registry';

/**
 * Creates a searchModal instance
 *
 * @param {object} config
 * @param {object} config.renderTo - DOM element where component will be rendered to
 * @param {string} config.criterias - Search criteria to be set on component creation
 * @param {boolean} config.searchOnInit - if init search must be triggered or not (stored results are used instead)
 * @param {string} config.url - search endpoint to be set on datatable
 * @param {string} config.rootClassUri - Uri for the root class of current context, required to init the class filter
 * @param {bool} config.hideResourceSelector - if resourceSelector must be hidden
 * @param {bool} config.hideCriteria - if the criteria must be hidden
 * @param {string} config.placeholder - placeholder for input in template
 * @param {string} config.classesUrl - the URL to the classes API (usually '/tao/RestResource/getAll')
 * @param {string} config.classMappingUrl - the URL to the class mapping API (usually '/tao/ClassMetadata/getWithMapping')
 * @param {string} config.statusUrl - the URL to the status API (usually '/tao/AdvancedSearch/status')
 * @param {string} config.sortby - the default sorted column (usually 'label')
 * @param {string} config.sortorder - the default sort order (usually 'asc')
 * @returns {searchModal}
 */
export default function searchModalFactory(config) {
    // @TODO: The consumer must be responsible for supplying the routes. The component must not hardcode endpoints.
    const defaults = {
        classesUrl: urlUtil.route('getAll', 'RestResource', 'tao'),
        classMappingUrl: urlUtil.route('getWithMapping', 'ClassMetadata', 'tao'),
        statusUrl: urlUtil.route('status', 'AdvancedSearch', 'tao'),
        renderTo: 'body',
        criterias: {},
        searchOnInit: true,
        maxListSize: 5,
        sortby: 'label',
        sortorder: 'asc'
    };
    // Private properties to be easily accessible by instance methods
    let $container = null;
    let controls = {};
    let running = false;
    let searchStore = null;
    let selectedColumnsStore = null;
    let resourceSelector = null;
    let advancedSearch = null;
    let propertySelectorInstance;
    let availableColumns = [];
    let availableIdentifiers = {};
    let selectedColumns = [];
    let dataCache;

    // resorce selector
    const isResourceSelector = !config.hideResourceSelector;
    const rootClassUri = config.rootClassUri;

    // Creates new component
    const instance = component(
        {
            /**
             * Tells if the advanced search is enabled.
             * @returns {boolean}
             */
            isAdvancedSearchEnabled() {
                return advancedSearch && advancedSearch.isEnabled();
            }
        },
        defaults
    )
        .setTemplate(layoutTpl)
        .on('selected-store-updated', recreateDatatable)
        .on('render', renderModal)
        .on('destroy', destroyModal);

    /**
     * Creates search modal, inits template selectors, inits search store, and once is created triggers initial search
     * rootClassUri is sent to advancedSearch factory for disabling in whitelisted sections
     */
    function renderModal() {
        const promises = [];
        initModal();
        initUiSelectors();
        advancedSearch = advancedSearchFactory({
            renderTo: controls.$filtersContainer,
            advancedCriteria: instance.config.criterias.advancedCriteria,
            hideCriteria: instance.config.hideCriteria,
            statusUrl: instance.config.statusUrl,
            rootClassUri: rootClassUri
        });
        promises.push(initClassFilter());
        promises.push(initStores());
        Promise.all(promises)
            .then(() => {
                instance.trigger('ready');
                controls.$searchButton.trigger('click');
            })
            .catch(e => instance.trigger('error', e));
    }

    /**
     * Removes search modal
     */
    function destroyModal() {
        $container.removeClass('modal').modal('destroy');
        if (propertySelectorInstance) {
            propertySelectorInstance.destroy();
        }
        $('.modal-bg').remove();
        controls = {};
    }

    /**
     * Creates search modal
     */
    function initModal() {
        $container = instance.getElement();
        $container
            .addClass('modal')
            .on('closed.modal', () => instance.destroy())
            .modal({
                disableEscape: false,
                width: $(window).width(),
                modalCloseClass: 'modal-close-left'
            })
            .focus();
    }

    /**
     * Inits class filter selector
     */
    function initClassFilter() {
        return new Promise(resolve => {
            if (!isResourceSelector) {
                controls.$classFilterContainer.hide();
                return resolve();
            }
            const initialClassUri =
                instance.config.criterias && instance.config.criterias.class
                    ? instance.config.criterias.class
                    : rootClassUri;
            resourceSelector = resourceSelectorFactory(controls.$classTreeContainer, {
                //set up the inner resource selector
                selectionMode: 'single',
                selectClass: true,
                classUri: initialClassUri,
                showContext: false,
                showSelection: false
            });

            // when a class query is triggered, update selector options with received resources
            resourceSelector.on('query', params => {
                const classOnlyParams = { ...params, classOnly: true };
                const route = instance.config.classesUrl;
                request(route, classOnlyParams)
                    .then(response => {
                        if (
                            response.permissions &&
                            response.permissions.data &&
                            response.permissions.supportedRights &&
                            response.permissions.supportedRights.length > 0
                        ) {
                            manageClassTreePermissions(response);
                        }
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
                const classUri = _.map(selectedValue, 'classUri')[0];
                const label = _.map(selectedValue, 'label')[0];
                const uri = _.map(selectedValue, 'uri')[0];
                const route = urlUtil.build(instance.config.classMappingUrl, {
                    classUri,
                    maxListSize: instance.config.maxListSize
                });
                controls.$classFilterInput.html(label);
                controls.$classFilterInput.data('uri', uri);
                controls.$classTreeContainer.hide();
                advancedSearch
                    .updateCriteria(route)
                    .then(() => instance.trigger('criteriaListUpdated'))
                    .catch(e => instance.trigger('error', e));
            });

            setResourceSelectorUIBehaviour();
        });
    }

    /**
     * Loops through each class in received class tree and sets access mode to 'denied' on private classes
     * so are disabled on class tree
     * @param {object} classTree - class tree received by server, containing resources (classes) and permissions
     */
    function manageClassTreePermissions(classTree) {
        const disableBlockedClasses = function (resources) {
            _.forEach(resources, (resource, index, array) => {
                if (
                    classTree.permissions.data[resource.uri] &&
                    classTree.permissions.data[resource.uri].find(permission => permission === 'READ')
                ) {
                    if (resource.children) {
                        disableBlockedClasses(resource.children);
                    }
                } else {
                    array[index].accessMode = 'denied';
                }
            });
        };
        disableBlockedClasses(classTree.resources);
    }

    /**
     * Inits template selectors, buttons behaviour, scroll animation,
     * and sets initial search query on search input
     */
    function initUiSelectors() {
        controls = {
            $searchButton: $('.btn-search', $container),
            $clearButton: $('.btn-clear', $container),
            $searchInput: $('.generic-search-input', $container),
            $classFilterInput: $('.class-filter', $container),
            $classTreeContainer: $('.class-tree', $container),
            $classFilterContainer: $('.class-filter-container', $container),
            $filtersContainer: $('.filters-container', $container),
            $contentArea: $('.content-area', $container),
            $contentToolbar: $('.content-toolbar', $container)
        };

        controls.$searchButton.on('click', search);
        controls.$clearButton.on('click', clear);
        const shortcuts = shortcutRegistry(controls.$searchInput);
        shortcuts.clear().add('enter', search);
        controls.$searchInput.val(
            instance.config.criterias && instance.config.criterias.search ? instance.config.criterias.search : ''
        );
    }

    /**
     * Sets required listeners to properly manage resourceSelector visualization
     */
    function setResourceSelectorUIBehaviour() {
        $container.on('mousedown', () => {
            controls.$classTreeContainer.hide();
        });

        /**
         * Pressing space, enter, esc, backspace
         * on class filter input will toggle resource selector
         */
        const shortcuts = shortcutRegistry(controls.$classFilterInput);
        shortcuts.add('enter', () => controls.$classTreeContainer.show());
        shortcuts.add('space', () => controls.$classTreeContainer.show());
        shortcuts.add('backspace', () => controls.$classTreeContainer.hide());
        shortcuts.add('escape', () => controls.$classTreeContainer.hide(), { propagate: false });

        /**
         * clicking on class filter container will toggle resource selector
         */
        controls.$classFilterContainer.on('click', () => {
            controls.$classTreeContainer.toggle();
        });

        /**
         * clicking on class filter container will
         * stopPropagation to prevent be closed
         * by searchModal.mouseDown listener
         */
        controls.$classFilterContainer.on('mousedown', e => {
            e.stopPropagation();
        });

        // clicking on resource selector will stopPropagation to prevent be closed by searchModal.mouseDown listener
        controls.$classTreeContainer.on('mousedown', e => {
            e.stopPropagation();
        });
    }

    /**
     * Loads search store so it is accessible in the component
     * @returns {Promise}
     */
    function initStores() {
        return Promise.all([
            store('search').then(updatedStore => (searchStore = updatedStore)),
            store('selectedColumns').then(updatedStore => (selectedColumnsStore = updatedStore))
        ]).catch(e => instance.trigger('error', e));
    }

    /**
     * Performs a search query
     * @param query - The searched terms
     * @param classFilterUri - The URI of the node class
     * @param [params] - Additional parameters
     * @returns {Promise}
     */
    const searchQuery = (query, classFilterUri, params = {}) => {
        return new Promise((resolve, reject) => {
            $.ajax({
                url: instance.config.url,
                type: 'POST',
                data: { ...params, query: query, parentNode: classFilterUri, structure: context.shownStructure },
                dataType: 'json'
            })
                .done(resolve)
                .fail(reject);
        });
    };

    /**
     * Performs the search query, preventing to send too many requests
     * @param query - The searched terms
     * @param classFilterUri - The URI of the node class
     * @param [params] - Additional parameters
     */
    const searchHandler = (query, classFilterUri, params = {}) => {
        if (running === false) {
            running = true;
            searchQuery(query, classFilterUri, params)
                .then(data => data.data)
                .then(buildDataModel)
                .then(filterSelectedColumns)
                .then(appendDefaultDatasetToDatatable)
                .then(buildSearchResultsDatatable)
                .catch(e => instance.trigger('error', e))
                .then(() => (running = false));
        }
    };

    /**
     * Request search results and manages its results
     */
    function search() {
        searchHandler(buildComplexQuery(), getClassFilterUri());
    }

    /**
     * Returns selected class filter of rootClassUri
     */
    function getClassFilterUri() {
        return isResourceSelector ? controls.$classFilterInput.data('uri').trim() : rootClassUri;
    }

    /**
     * build final complex query appending every filter
     */
    function buildComplexQuery() {
        let query = controls.$searchInput.val().trim();
        query += advancedSearch.getAdvancedCriteriaQuery(query !== '');

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
                Promise.all([searchStore.getItem('results'), searchStore.getItem('options')])
                    .then(fromStore => {
                        instance.config.searchOnInit = true;
                        data.storedSearchResults = fromStore[0];
                        data.storedSearchOptions = fromStore[1];
                        resolve(data);
                    })
                    .catch(e => {
                        reject(
                            new Error('Error appending default dataset from searchStore to datatable', { cause: e })
                        );
                    });
            } else {
                resolve(data);
            }
        });
    }

    /**
     * Replaces empty value by a placeholder.
     * @param value
     * @returns {string|*}
     */
    const emptyValueTransform = value => {
        let testedValue = value;
        if (Array.isArray(testedValue)) {
            testedValue = testedValue[0];
        }
        if ('string' === typeof testedValue) {
            testedValue = testedValue.trim();
        }
        return testedValue === '' || testedValue === null || typeof testedValue === 'undefined' ? '-' : value;
    };

    /**
     * Refines the columns to be compatible with the datatable model
     * @param {object[]} columns
     * @returns {object[]}
     */
    function columnsToModel(columns) {
        if (!Array.isArray(columns)) {
            return [];
        }

        return columns.map(column => {
            const { id, sortId, label, sortable, isDuplicated } = column;
            let alias, comment, classLabel;
            if (isDuplicated) {
                alias = column.alias;
                classLabel = column.classLabel; // needed by the property selector
                comment = column.classLabel; // needed by the datatable
            }
            return { id, sortId, label, alias, classLabel, comment, sortable, transform: emptyValueTransform };
        });
    }

    /**
     * Refines the data model for the datatable
     * @param {object} data - search configuration including model and endpoint for datatable
     * @returns {object} The data configuration refined with the data model for the datatrable
     */
    function buildDataModel(data) {
        //save availableColumns to memory
        availableIdentifiers = {};
        availableColumns = data.settings.availableColumns;

        // The support for the old data.model coming from the server has been removed from the commit
        // https://github.com/oat-sa/tao-core-ui-fe/commit/ae6c16a9199f9fc808bc8a37d2ddfce437a62e9c
        // The data model is now coming from the settings carried on by the searchParams request.
        data.model = columnsToModel(availableColumns);
        data.model.forEach(column => (availableIdentifiers[column.id] = true));

        // adjust the default sorting and pagination
        let { sortby, sortorder, page } = instance.config;

        if (!sortorder || !['asc', 'desc'].includes(sortorder)) {
            sortorder = 'asc';
        }

        const sortIdentifiers = [];
        data.model.forEach(column => {
            sortIdentifiers.push(column.sortId || column.id);
            if (column.sortId && column.id === sortby) {
                sortby = column.sortId;
            }
        });
        if (!sortIdentifiers.includes(sortby)) {
            // unknown sort identifier is rejected for safety
            sortby = void 0;
            sortorder = void 0;
        }

        data.pageConfig = { sortby, sortorder, page };

        dataCache = _.cloneDeep(data);
        return data;
    }

    /**
     * Filters datatble model based on stored selected columns
     * @param {Object} data data containing available columns and model for datatable
     * @returns {Promise} promise which resolves with filtered data.model
     */
    function filterSelectedColumns(data) {
        return selectedColumnsStore
            .getItem(rootClassUri)
            .then(storedSelectedColumnIds => {
                selectedColumns = [];

                if (storedSelectedColumnIds && storedSelectedColumnIds.length) {
                    storedSelectedColumnIds.forEach(id => {
                        if (availableIdentifiers[id]) {
                            selectedColumns.push(id);
                        }
                    });
                }

                if (!selectedColumns.length) {
                    selectedColumns = data.settings.availableColumns.reduce((acc, column) => {
                        if (column.default) {
                            acc.push(column.id);
                        }
                        return acc;
                    }, []);
                }

                data.model = data.model.filter(column => selectedColumns.includes(column.id));
                return data;
            })
            .catch(e => {
                instance.trigger('error', e);
            });
    }

    /**
     * Creates a datatable with search results
     * @param {object} data - search configuration including model and endpoint for datatable
     */
    function buildSearchResultsDatatable(data) {
        // Note: the table container needs to be recreated because datatable is storing data in it.
        // Keeping the table container introduces a DOM pollution.
        // It is faster and cleaner to recreate the container than cleaning it explicitly.
        const $tableContainer = $(resultsContainerTpl());
        const $contentContainer = controls.$contentArea.empty();
        $contentContainer.append($tableContainer);
        $tableContainer.on('load.datatable', searchResultsLoaded);

        const { sortby, sortorder, page } = data.storedSearchOptions || data.pageConfig;

        //create datatable
        $tableContainer.datatable(
            {
                url: data.url,
                model: data.model,
                sortby,
                sortorder,
                page,
                labels: {
                    actions: ''
                },
                actions: [
                    {
                        id: 'go-to-item',
                        label: __('View'),
                        action: function openResource(uri, updatedData) {
                            instance.trigger('refresh', uri, updatedData);
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

    function getTableOptions() {
        const $tableContainer = $('.results-container', $container);
        return _.cloneDeep($tableContainer.data('ui.datatable') || {});
    }

    /**
     * Filters data from cache by selected and recreates datatable
     * @params {object} options - Additional options to be given to the datatable
     */
    function recreateDatatable(options = {}) {
        const data = Object.assign(_.cloneDeep(dataCache), options);
        filterSelectedColumns(data).then(buildSearchResultsDatatable);
    }

    /**
     * Triggered on load.datatable event, it updates searchStore and manages possible exceptions
     * @param {object} e - load.datatable event
     * @param {object} dataset - datatable dataset
     */
    function searchResultsLoaded(e, dataset) {
        const $contentToolbar = controls.$contentToolbar.empty();
        if (instance.isAdvancedSearchEnabled()) {
            const $manageColumnsBtn = $(propertySelectButtonTpl());
            $contentToolbar.append($manageColumnsBtn);
            $manageColumnsBtn.on('click', handleManageColumnsBtnClick);
        }

        const { sortby, sortorder } = getTableOptions();

        if (dataset.records === 0) {
            replaceSearchResultsDatatableWithMessage('no-matches');
        }
        instance.trigger('datatable-loaded');
        updateSearchStore({
            action: 'update',
            dataset,
            options: { sortby, sortorder },
            context: context.shownStructure,
            criterias: {
                search: controls.$searchInput && controls.$searchInput.val(),
                class: isResourceSelector ? _.map(resourceSelector.getSelection(), 'uri')[0] : rootClassUri,
                advancedCriteria: advancedSearch.getState()
            }
        });
    }

    /**
     * Handler for manage columns button click
     */
    function handleManageColumnsBtnClick() {
        const selected = selectedColumns;
        const available = columnsToModel(availableColumns);

        if (!propertySelectorInstance) {
            const { bottom: btnBottom, right: btnRight } = this.getBoundingClientRect();
            const { top: containerTop, right: containerRight } = $container.get(0).getBoundingClientRect();
            const position = {
                top: btnBottom - containerTop,
                right: containerRight - btnRight
            };
            propertySelectorInstance = propertySelectorFactory({
                renderTo: $container,
                data: {
                    position,
                    available,
                    selected
                }
            });
            propertySelectorInstance.on('select', selection => {
                if (
                    selection.length !== selectedColumns.length ||
                    selection.some(columnId => !selectedColumns.includes(columnId))
                ) {
                    //update table
                    selectedColumns = selection;
                    const { sortby, sortorder, page } = getTableOptions();
                    updateSelectedStore({ selection, sortby, sortorder, page });
                }
            });
        } else {
            propertySelectorInstance.setData({ available, selected });
            propertySelectorInstance.toggle();
        }
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
            promises.push(searchStore.setItem('options', data.options));
            promises.push(
                data.dataset.records === 0
                    ? searchStore.removeItem('results')
                    : searchStore.setItem('results', data.dataset)
            );
        }

        Promise.all(promises)
            .then(() => instance.trigger('store-updated'))
            .catch(e => instance.trigger('error', e));
    }

    /**
     *
     * @param {object} update - The changed configuration
     * @param {Array<string>} update.selection - array of column ids to display
     * @param {string} update.sortby - The sorted column
     * @param {string} update.sortorder - The sort order
     * @param {number} update.page - The current page
     * @returns
     */
    function updateSelectedStore({ selection = [], sortby = 'id', sortorder = 'asc', page = 1 } = {}) {
        const storedSearchOptions = { sortby, sortorder, page };
        return selectedColumnsStore
            .setItem(rootClassUri, selection)
            .then(() => instance.trigger('selected-store-updated', { storedSearchOptions }))
            .catch(e => instance.trigger('error', e));
    }

    /**
     * Clear search input, criteria and results from both, view and store.
     * Also sets every criterion on criteriaState to unredered and
     * undefined value
     */
    function clear() {
        controls.$searchInput.val('');
        advancedSearch.clear();
        isResourceSelector && resourceSelector.select(rootClassUri);
        replaceSearchResultsDatatableWithMessage('no-query');
        updateSearchStore({ action: 'clear' });
    }

    /**
     * Removes datatable container and displays a message instead
     * @param {string} reason - reason why datatable is not rendered, to display appropiate message
     */
    function replaceSearchResultsDatatableWithMessage(reason) {
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
        controls.$contentToolbar.empty();
        controls.$contentArea.empty().append(infoMessage);
    }

    // return initialized instance of searchModal
    return instance.init(config);
}
