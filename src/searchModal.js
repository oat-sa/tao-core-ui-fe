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

/**
 * Creates a search modal instance
 * @param {object} config - search modal configuration
 * @param {string} config.query - search query to be set and triggered on component creation
 * @param {string} config.url - search endpoint
 * @param {object} config.events - events hub
 * @param {boolean} config.updateResults - if datatable mast request results to endpoint, or use the stored results instead
 */
export default function searchModalFactory(config) {
    const instance = component().setTemplate(layoutTpl);
    let searchInput = null;
    let searchButton = null;
    let clearButton = null;
    let running = false;
    let searchStore = null;
    instance.on('render', renderModal);
    instance.on('destroy', destroyModal);

    /**
     * Creates search modal, inits template selectors, inits search store, and once is created triggers initial search
     */
    function renderModal() {
        initModal();
        initUiSelectors();
        initSearchStore().then(function () {
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
     * Loads search store so it is accessible in the component
     */
    function initSearchStore() {
        return store('search').then(function (store) {
            searchStore = store;
        });
    }

    /**
     * Inits template selectors and sets initial search query on search input
     */
    function initUiSelectors() {
        searchButton = $('.btn-search', instance.getElement());
        clearButton = $('.btn-clear', instance.getElement());
        searchInput = $('.search-bar-container input', instance.getElement());
        searchButton.on('click', search);
        clearButton.on('click', clear);
        searchInput.val(config.query);
    }

    /**
     * Request search results and manages its results
     */
    function search() {
        const query = searchInput.val();
        if (query === '') {
            clear();
            return;
        }

        searchStore
            .setItem('query', query)
            .then(() => searchStore.setItem('location', context.shownStructure).then(notifySearchStoreUpdate));

        //throttle and control to prevent sending too many requests
        const searchHandler = _.throttle(function searchHandlerThrottled(query) {
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
     * @param {object} storedSearchResults - search query results to be used on first datatable request
     */
    function buildSearchResultsDatatable(data) {
        // If saved results will be used, recoger them from searchStore, append to data, and recursively recall
        if (config.updateResults === false) {
            searchStore.getItem('results').then(function (storedSearchResults) {
                config.updateResults = true;
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
                            destroyModal();
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
     * Saves search results on searchStore and manage possible exceptions
     * @param {object} e - load.datatable event
     * @param {object} dataset - datatable dataset
     */
    function searchResultsLoaded(e, dataset) {
        if (dataset.records === 0) {
            searchStore.removeItem('results').then(notifySearchStoreUpdate);
            replaceSearchResultsDatatableWithMessage('no-matches');
        } else {
            searchStore.setItem('results', dataset).then(notifySearchStoreUpdate);
        }
    }

    /**
     * Clear search input and search results
     */
    function clear() {
        searchStore.clear().then(notifySearchStoreUpdate);
        searchInput.val('');
        replaceSearchResultsDatatableWithMessage('no-query');
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

    function notifySearchStoreUpdate() {
        instance.trigger('searchStoreUpdate');
    }

    return instance.init({ renderTo: 'body' });
}
