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
 * Namespace used in events and shortcuts
 * @type {String}
 * @private
 */
const _ns = 'search-modal';

/**
 * Creates a searchModal instance
 *
 * @param {object} config
 * @param {object} config.renderTo - DOM element where component will be rendered to
 * @param {string} config.query - search query to be set on component creation
 * @param {boolean} config.searchOnInit - if init search must be triggered or not (stored results are used instead)
 * @param {string} config.url - search endpoint to be set on datatable
 * @param {object} config.events - events hub
 * @returns {searchModal}
 */
export default function searchModalFactory(config) {
    // Private properties to be easily accessible by instance methods
    let searchInput = null;
    let searchButton = null;
    let clearButton = null;
    let running = false;
    let searchStore = null;
    let resourceSelector = null;

    // Create new component
    const instance = component().setTemplate(layoutTpl).on('render', renderModal).on('destroy', destroyModal);

    /**
     * Creates search modal, inits template selectors, inits search store, and once is created triggers initial search
     */
    function renderModal() {
        initModal();
        initClassFilter();
        initUiSelectors();
        initSearchStore().then(function () {
            instance.trigger(`${_ns}.init`);
            searchButton.trigger('click');
        });
    }

    /**
     * Removes search modal
     */
    function destroyModal() {
        instance.getElement().removeClass('modal').modal('destroy');
        $('.modal-bg').remove();
    }

    /**
     * Creates search modal
     */
    function initModal() {
        instance
            .getElement()
            .addClass('modal')
            .on('closed.modal', function () {
                instance.destroy();
            })
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
        const classUri = config.events.getResourceContext().rootClassUri;
        resourceSelector = resourceSelectorFactory($('.class-tree', instance.getElement()), {
            //set up the inner resource selector
            selectionMode: 'single',
            selectClass: true,
            classUri: classUri,
            showContext: false,
            showSelection: false
        });

        resourceSelector.on('query', function (params) {
            params.classOnly = true;
            // TODO - check if correct endpoint should be urlUtil.route('getAll', 'RestClass', 'tao')
            const route = urlUtil.route('getAll', 'RestResource', 'tao');
            request(route, params).then(response => {
                const resources = response.resources;
                resourceSelector.update(resources, params);
            });
        });

        setResourceSelectorUIBehaviour();
    }

    /**
     * Inits template selectors and sets initial search query on search input
     */
    function initUiSelectors() {
        searchButton = $('.btn-search', instance.getElement());
        clearButton = $('.btn-clear', instance.getElement());
        searchInput = $('.generic-search-input', instance.getElement());
        searchButton.on('click', search);
        clearButton.on('click', clear);
        searchInput.val(config.query);
    }

    /**
     * Sets required listeners to properly manage resourceSelector visualization
     */
    function setResourceSelectorUIBehaviour() {
        const classFilterInput = $('.class-filter', instance.getElement());
        const classFilterContainer = $('.class-tree', instance.getElement());

        // Clicking on searchModal will hide the resource selector
        instance.getElement().on('mousedown', () => {
            classFilterContainer.css('display', 'none');
        });

        /**
         * clicking on class filter input will toggle resource selector,
         * will preventDefault to avoid focus on input field,
         * and will stopPropagation to prevent be closed
         * by searchModal.mouseDown listener
         */
        classFilterInput.on('mousedown', e => {
            e.preventDefault();
            e.stopPropagation();
            classFilterContainer.toggle();
        });

        // clicking on resource selector will stopPropagation to prevent be closed by searchModal.mouseDown listener
        classFilterContainer.on('mousedown', e => {
            e.stopPropagation();
        });
    }

    /**
     * Loads search store so it is accessible in the component
     */
    function initSearchStore() {
        return store('search').then(function (store) {
            searchStore = store;
        });
    }

    /**
     * Request search results and manages its results
     */
    function search() {
        const query = searchInput.val();

        // if query is empty just clear datatable
        if (query === '') {
            clear();
            return;
        }

        //throttle and control to prevent sending too many requests
        const searchHandler = _.throttle(query => {
            if (running === false) {
                running = true;
                $.ajax({
                    url: config.url,
                    type: 'POST',
                    data: { query: query },
                    dataType: 'json'
                })
                    .done(buildSearchResultsDatatable)
                    .always(function () {
                        running = false;
                    });
            }
        }, 100);

        searchHandler(query);
    }

    /**
     * Creates a datatable with search results
     * @param {object} data - search configuration including model and endpoint for datatable
     */
    function buildSearchResultsDatatable(data) {
        // If no search on init, get dataset from searchStore and recursively recall
        if (config.searchOnInit === false) {
            searchStore.getItem('results').then(storedSearchResults => {
                config.searchOnInit = true;
                data.storedSearchResults = storedSearchResults;
                buildSearchResultsDatatable(data);
            });
            return;
        }

        //update the section container
        const $tableContainer = $('<div class="flex-container-full"></div>');
        const section = $('.content-container', instance.getElement());
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
                        action: function openResource(id) {
                            config.events.trigger('refresh', {
                                uri: id
                            });
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
        instance.trigger(`${_ns}.datatable-loaded`);
        updateSearchStore({
            action: 'update',
            dataset,
            context: context.shownStructure,
            query: searchInput.val()
        });
    }

    /**
     * Updates searchStore. If action is 'clear', searchStore is claread. If not, received
     * data is assigned to searchStore. Once all actions have been done,
     * search-modal.store-updated event is triggered
     * @param {object} data - data to store
     */
    function updateSearchStore(data) {
        const promises = [];
        if (data.action === 'clear') {
            promises.push(searchStore.clear());
        } else if (data.action === 'update') {
            promises.push(searchStore.setItem('query', data.query));
            promises.push(searchStore.setItem('context', data.context));
            promises.push(
                data.dataset.records === 0
                    ? searchStore.removeItem('results')
                    : searchStore.setItem('results', data.dataset)
            );
        }

        Promise.all(promises).then(() => instance.trigger(`${_ns}.store-updated`));
    }

    /**
     * Clear search input and search results from both, view and store
     */
    function clear() {
        searchInput.val('');
        replaceSearchResultsDatatableWithMessage('no-query');
        updateSearchStore({ action: 'clear' });
    }

    /**
     * Removes datatable container and displays a message instead
     * @param {string} reason - reason why datatable is not rendered, to display appropiate message
     */
    function replaceSearchResultsDatatableWithMessage(reason) {
        const section = $('.content-container', instance.getElement());
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
    return instance.init(
        _.defaults(config, {
            renderTo: 'body',
            query: '',
            searchOnInit: true
        })
    );
}
