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
 * @param {string} config.placeholder - placeholder for input in template
 * @param {string} config.classesUrl - the URL to the classes API (usually '/tao/RestResource/getAll')
 * @param {string} config.classMappingUrl - the URL to the class mapping API (usually '/tao/ClassMetadata/getWithMapping')
 * @param {string} config.statusUrl - the URL to the status API (usually '/tao/AdvancedSearch/status')
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
        maxListSize: 5
    };
    // Private properties to be easily accessible by instance methods
    let $container = null;
    let $searchInput = null;
    let $searchButton = null;
    let $clearButton = null;
    let running = false;
    let searchStore = null;
    let selectedColumnsStore = null;
    let resourceSelector = null;
    let $classFilterContainer = null;
    let $classFilterInput = null;
    let $classTreeContainer = null;
    let advancedSearch = null;
    let propertySelectorInstance;
    let propertySelectorInstanceHidden;
    let availableColumns = [];
    let selectedColumns = [];

    // resorce selector
    const isResourceSelector = !config.hideResourceSelector;
    const rootClassUri = config.rootClassUri;
    const defaultSelectedColumns = ['http://www.w3.org/2000/01/rdf-schema#label', 'location', 'updated_at'];

    /**
     * Creates search modal, inits template selectors, inits search store, and once is created triggers initial search
     * rootClassUri is sent to advancedSearch factory for disabling in whitelisted sections
     */
    function renderModal() {
        const promises = [];
        initModal();
        initUiSelectors();
        advancedSearch = advancedSearchFactory({
            renderTo: $('.filters-container', $container),
            advancedCriteria: instance.config.criterias.advancedCriteria,
            statusUrl: instance.config.statusUrl,
            rootClassUri: rootClassUri
        });
        promises.push(initClassFilter());
        promises.push(initStores());
        Promise.all(promises)
            .then(() => {
                instance.trigger('ready');
                $searchButton.trigger('click');
            })
            .catch(e => instance.trigger('error', e));
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
                $classFilterContainer.hide();
                return resolve();
            }
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
                $classFilterInput.html(label);
                $classFilterInput.data('uri', uri);
                $classTreeContainer.hide();
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
        $searchButton = $('.btn-search', $container);
        $clearButton = $('.btn-clear', $container);
        $searchInput = $('.generic-search-input', $container);
        $classFilterInput = $('.class-filter', $container);
        $classTreeContainer = $('.class-tree', $container);
        $classFilterContainer = $('.class-filter-container', $container);

        $searchButton.on('click', search);
        $clearButton.on('click', clear);
        const shortcuts = shortcutRegistry($searchInput);
        shortcuts.clear().add('enter', search);
        $searchInput.val(
            instance.config.criterias && instance.config.criterias.search ? instance.config.criterias.search : ''
        );
    }

    /**
     * Sets required listeners to properly manage resourceSelector visualization
     */
    function setResourceSelectorUIBehaviour() {
        $container.on('mousedown', () => {
            $classTreeContainer.hide();
        });

        /**
         * Pressing space, enter, esc, backspace
         * on class filter input will toggle resource selector
         */
        const shortcuts = shortcutRegistry($classFilterInput);
        shortcuts.add('enter', () => $classTreeContainer.show());
        shortcuts.add('space', () => $classTreeContainer.show());
        shortcuts.add('backspace', () => $classTreeContainer.hide());
        shortcuts.add('escape', () => $classTreeContainer.hide(), { propagate: false });

        /**
         * clicking on class filter container will toggle resource selector
         */
        $classFilterContainer.on('click', e => {
            $classTreeContainer.toggle();
        });

        /**
         * clicking on class filter container will
         * stopPropagation to prevent be closed
         * by searchModal.mouseDown listener
         */
        $classFilterContainer.on('mousedown', e => {
            e.stopPropagation();
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
    function initStores() {
        return Promise.all([
            store('search')
                .then(function (store) {
                    searchStore = store;
                })
                .catch(e => instance.trigger('error', e)),
            store('selectedColumns')
                .then(function (store) {
                    selectedColumnsStore = store;
                })
                .catch(e => instance.trigger('error', e))
        ]);
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
                .then(data => appendDefaultDatasetToDatatable(data.data))
                .then(data => buildDataModel(classFilterUri, data))
                .then(buildSearchResultsDatatable)
                .catch(e => instance.trigger('error', e))
                .then(() => (running = false));
        }
    };

    /**
     * Request search results and manages its results
     */
    function search() {
        const query = buildComplexQuery();
        searchHandler(query, getClassFilterUri());
    }

    /**
     * Returns selected class filter of rootClassUri
     */
    function getClassFilterUri() {
        return isResourceSelector ? $classFilterInput.data('uri').trim() : rootClassUri;
    }

    /**
     * build final complex query appending every filter
     */
    function buildComplexQuery() {
        const $searchInputValue = $searchInput.val().trim();

        let query = $searchInputValue;
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
                searchStore
                    .getItem('results')
                    .then(storedSearchResults => {
                        instance.config.searchOnInit = true;
                        data.storedSearchResults = storedSearchResults;
                        resolve(data);
                    })
                    .catch(e => {
                        instance.trigger('error', e);
                        reject(new Error('Error appending default dataset from searchStore to datatable'));
                    });
            } else {
                resolve(data);
            }
        });
    }

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
            const { id, sortId, label, alias, classLabel, type: dataType, sortable } = column;
            return { id, sortId, label, alias, classLabel, dataType, sortable };
        });
    }

    /**
     * Refines the data model for the datatable
     * @param {object} data - search configuration including model and endpoint for datatable
     * @returns {object} The data configuration refined with the data model for the datatrable
     */
    function buildDataModel(classFilterUri, data) {
        if (data.settings) {
            //save availableColumns to memory
            availableColumns = data.settings.availableColumns;
            // @todo: use the selected columns instead. It can use a promise as it takes place insise a promise chain
            return selectedColumnsStore
                .getItem(classFilterUri)
                .then(storedSelectedColumnIds => {
                    //save selectedColumns to memory
                    if (storedSelectedColumnIds) {
                        selectedColumns = [...defaultSelectedColumns, ...storedSelectedColumnIds];
                    } else {
                        selectedColumns = [...defaultSelectedColumns];
                    }
                    data.model = columnsToModel(
                        data.settings.availableColumns.filter(column => selectedColumns.includes(column.id))
                    );
                    return data;
                })
                .catch(e => {
                    instance.trigger('error', e);
                    reject(new Error('Error getting selected columns'));
                });
        } else {
            data.model = columnsToModel(_.values(data.model));
            return data;
        }
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
                model: data.model,
                labels: {
                    actions: ''
                },
                actions: [
                    {
                        id: 'go-to-item',
                        label: __('View'),
                        action: function openResource(uri, data) {
                            instance.trigger('refresh', uri, data);
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
        const $actionsHeader = $('th.actions', $container);
        const $manageColumnsBtn = $(propertySelectButtonTpl());
        $actionsHeader.append($manageColumnsBtn);
        $manageColumnsBtn.on('click', handleManageColumnsBtnClick);

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
                class: isResourceSelector ? _.map(resourceSelector.getSelection(), 'uri')[0] : rootClassUri,
                advancedCriteria: advancedSearch.getState()
            }
        });
    }

    /**
     * Handler for manage columns button click
     * @param {Event} e
     */
    function handleManageColumnsBtnClick(e) {
        const { bottom: btnBottom, right: btnRight } = $(this).get(0).getBoundingClientRect();
        const { top: containerTop, right: containerRight } = $container.get(0).getBoundingClientRect();

        if (!propertySelectorInstance) {
            propertySelectorInstance = propertySelectorFactory({
                renderTo: $container,
                data: {
                    position: {
                        top: btnBottom - containerTop,
                        right: containerRight - btnRight
                    },
                    available: availableColumns,
                    selected: selectedColumns
                }
            });
            propertySelectorInstance.on('cancel', propertySelectorInstance.hide);
            propertySelectorInstance.on('hide', () => {
                propertySelectorInstanceHidden = true;
            });
            propertySelectorInstance.on('show', () => {
                propertySelectorInstanceHidden = false;
            });

            propertySelectorInstance.on('select', e => {
                updateSelectedStore(getClassFilterUri(), e);
                propertySelectorInstance.hide();
            });
        } else {
            if (propertySelectorInstanceHidden) {
                propertySelectorInstance.show();
            } else {
                propertySelectorInstance.hide();
            }
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

    function updateSelectedStore(classFilterUri, selected) {
        return selectedColumnsStore
            .setItem(getClassFilterUri(), selected)
            .then(() => instance.trigger(`selected-store-updated`))
            .catch(e => instance.trigger('error', e));
    }

    /**
     * Clear search input, criteria and results from both, view and store.
     * Also sets every criterion on criteriaState to unredered and
     * undefined value
     */
    function clear() {
        $searchInput.val('');
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
