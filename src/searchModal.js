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
import 'ui/searchModal/css/searchModal.css';
import component from 'ui/component';
import 'ui/modal';
import 'ui/datatable';
import store from 'core/store';
import resourceSelectorFactory from 'ui/resource/selector';
import request from 'core/dataProvider/request';
import urlUtil from 'util/url';
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

    /**
     * Creates search modal, inits template selectors, inits search store, and once is created triggers initial search
     */
    function renderModal() {
        const promises = [];
        initModal();
        initUiSelectors();
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

            // then new class is selected, set its label into class filter input and hide filter container
            resourceSelector.on('change', selectedValue => {
                $classFilterInput.val(_.map(selectedValue, 'label')[0]);
                $classTreeContainer.hide();
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
            resources.forEach((resource, index, array) => {
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
     * Inits template selectors and sets initial search query on search input
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
        const $searchInputValue = $searchInput.val();
        const classFilterValue = $classFilterInput.val();

        return `class:${classFilterValue} AND ${$searchInputValue}`;
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
                class: _.map(resourceSelector.getSelection(), 'uri')[0]
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
     * Clear search input and search results from both, view and store
     */
    function clear() {
        $searchInput.val('');
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
