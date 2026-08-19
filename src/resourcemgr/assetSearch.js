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
 * Foundation, Inc., 31 Milk St # 960789 Boston, MA 02196 USA.
 *
 * Copyright (c) 2026 (original work) Open Assessment Technologies SA;
 */

/**
 * Scoped asset search UI + client for Resource Manager.
 * Browse mode remains the default; non-empty query switches to search mode.
 *
 * @exports ui/resourcemgr/assetSearch
 */
import $ from 'jquery';
import _ from 'lodash';
import __ from 'i18n';
import paginationComponent from 'ui/pagination';
import {
    DEFAULT_PAGE_SIZE,
    DEFAULT_SORT,
    applyLocalSearchFallback,
    buildSearchRequestParams,
    isBrowseShapedSearchPayload,
    normalizeSearchResponse
} from 'ui/resourcemgr/assetSearchContract';

const ns = 'resourcemgr';
const EVENT_NS = 'resourcemgrAssetSearch';
const DEFAULT_DEBOUNCE_MS = 300;
const DEFAULT_AJAX_TIMEOUT_MS = 10000;

/**
 * @param {Object} options - Resource Manager options
 */
export default function assetSearch(options) {
    if (!options || !options.searchUrl) {
        return;
    }

    const $container = options.$target;
    const $fileSelector = $('.file-selector', $container);
    const $searchRoot = $('.asset-search', $container);
    const $input = $('.asset-search-input', $searchRoot);
    const $status = $('.asset-search-status', $searchRoot);
    const $loading = $('.asset-search-loading', $fileSelector);
    const $error = $('.asset-search-error', $fileSelector);
    const $errorMessage = $('.asset-search-error-message', $error);
    const $retry = $('.asset-search-retry', $error);
    const $resultsRegion = $('.files-wrapper', $fileSelector);
    const $paginationContainer = $('.pagination-bottom', $container);
    const $uploadSwitcher = $('.upload-switcher', $fileSelector);

    let scopePath = options.initialPath || options.path || '/';
    let query = '';
    let sort = Object.assign({}, DEFAULT_SORT);
    let page = 1;
    let pageSize = DEFAULT_PAGE_SIZE;
    let total = 0;
    let searchMode = false;
    let requestSeq = 0;

    const previousTeardown = $container.data('assetSearchTeardown');
    if (typeof previousTeardown === 'function') {
        previousTeardown();
    }

    $searchRoot.removeClass('hidden').removeAttr('hidden');

    /**
     * Keep the search field focused whenever the picker opens.
     */
    function focusSearchInput() {
        window.setTimeout(function () {
            if ($input.is(':visible') && !$input.prop('disabled')) {
                $input.trigger('focus');
            }
        }, 0);
    }

    $container.on(`opened.modal.${EVENT_NS}`, focusSearchInput);
    focusSearchInput();

    $container.on(`folderselect.${ns}.${EVENT_NS}`, function (e, label, files, folderPath) {
        if (searchMode) {
            return;
        }
        scopePath = folderPath || label || scopePath;
        page = 1;
    });

    $container.on(`folderpath.${ns}.${EVENT_NS}`, function (e, folderPath) {
        scopePath = folderPath || scopePath;
    });

    const debounceMs = Number.isFinite(Number(options.searchDebounceMs))
        ? Number(options.searchDebounceMs)
        : DEFAULT_DEBOUNCE_MS;
    const ajaxTimeoutMs = Number.isFinite(Number(options.ajaxTimeoutMs)) && Number(options.ajaxTimeoutMs) > 0
        ? Number(options.ajaxTimeoutMs)
        : DEFAULT_AJAX_TIMEOUT_MS;
    const runSearchDebounced =
        debounceMs > 0
            ? _.debounce(function () {
                runSearch();
            }, debounceMs)
            : runSearch;

    function teardown() {
        requestSeq += 1;
        if (typeof runSearchDebounced.cancel === 'function') {
            runSearchDebounced.cancel();
        }
        $container.off(`.${EVENT_NS}`);
        $input.off(`.${EVENT_NS}`);
        $retry.off(`.${EVENT_NS}`);
    }

    $container.data('assetSearchTeardown', teardown);
    $container.on(`destroy.${ns}.${EVENT_NS}`, teardown);

    $input.on(`input.${EVENT_NS}`, function () {
        query = String($input.val() || '').trim();
        page = 1;
        if (!query) {
            exitSearchMode();
            return;
        }
        enterSearchMode();
        runSearchDebounced();
    });

    $retry.on(`click.${EVENT_NS}`, function (e) {
        e.preventDefault();
        runSearch();
    });

    $container.on(`sortchange.${ns}.${EVENT_NS}`, function (e, nextSort) {
        sort = Object.assign({}, DEFAULT_SORT, nextSort || {});
        if (!searchMode || !query) {
            return;
        }
        page = 1;
        runSearch();
    });

    /**
     * Enter search mode UI.
     */
    function enterSearchMode() {
        searchMode = true;
        $fileSelector.addClass('search-mode');
        $uploadSwitcher.addClass('hidden');
        $container.trigger(`searchmode.${ns}`, [true]);
    }

    /**
     * Leave search mode and reload the browse listing with the current sort.
     */
    function exitSearchMode() {
        const wasSearch = searchMode;
        searchMode = false;
        requestSeq += 1;
        $fileSelector.removeClass('search-mode');
        $uploadSwitcher.removeClass('hidden');
        hideLoading();
        hideError();
        setStatus('');
        $paginationContainer.empty();
        $container.trigger(`searchmode.${ns}`, [false]);

        if (wasSearch) {
            $container.trigger(`searchclear.${ns}`, [scopePath]);
        }
    }

    /**
     * Execute the scoped search request.
     */
    function runSearch() {
        if (!query) {
            exitSearchMode();
            return;
        }

        const seq = ++requestSeq;
        showLoading();
        hideError();
        setStatus(__('Searching…'));

        const data = buildSearchRequestParams({
            path: scopePath,
            query,
            sort,
            page,
            pageSize,
            pathParam: options.pathParam || 'path',
            params: options.params
        });

        $.ajax({
            url: options.searchUrl,
            method: 'GET',
            dataType: 'json',
            timeout: ajaxTimeoutMs,
            data
        })
            .done(function (response) {
                if (seq !== requestSeq) {
                    return;
                }
                hideLoading();
                let normalized = normalizeSearchResponse(response);
                // Browse-shaped payloads (`children`, no `items`) are filtered locally.
                // Search payloads with `items` are used as returned by the service.
                if (isBrowseShapedSearchPayload(response)) {
                    normalized = applyLocalSearchFallback(normalized, {
                        query,
                        sort,
                        page,
                        pageSize,
                        filters: options.params && options.params.filters
                    });
                }
                total = normalized.total;
                page = normalized.page;
                pageSize = normalized.pageSize;

                // Render search rows as-is (no client MIME/auth filtering).
                $container.trigger(`searchresults.${ns}`, [
                    {
                        query,
                        path: scopePath,
                        items: normalized.items,
                        total: normalized.total,
                        page: normalized.page,
                        pageSize: normalized.pageSize,
                        sort: Object.assign({}, sort),
                        initialSelection: options.initialSelection
                    }
                ]);

                if (normalized.total === 0) {
                    setStatus(__('No assets match your search.'));
                } else {
                    setStatus(__('Found %s asset(s)', String(normalized.total)));
                }
                renderPagination();
            })
            .fail(function () {
                if (seq !== requestSeq) {
                    return;
                }
                hideLoading();
                page = 1;
                const message = __('Unable to search assets. Please try again.');
                showError(message);
                setStatus(message);
                $container.trigger(`searchresults.${ns}`, [
                    {
                        query,
                        path: scopePath,
                        items: [],
                        total: 0,
                        page: 1,
                        pageSize,
                        sort: Object.assign({}, sort),
                        error: true
                    }
                ]);
            });
    }

    /**
     * Render search pagination when more than one page is available.
     */
    function renderPagination() {
        $paginationContainer.empty();
        const totalPages = Math.ceil(total / pageSize);
        if (!(total > 0 && totalPages > 1)) {
            return;
        }

        paginationComponent({
            mode: 'simple',
            activePage: page,
            totalPages
        })
            .on('prev', function () {
                page -= 1;
                runSearch();
            })
            .on('next', function () {
                page += 1;
                runSearch();
            })
            .render($paginationContainer);
    }

    /**
     * Show the search loading indicator.
     */
    function showLoading() {
        $loading.removeClass('hidden').removeAttr('hidden');
        $resultsRegion.attr('aria-busy', 'true');
    }

    /**
     * Hide the search loading indicator.
     */
    function hideLoading() {
        $loading.addClass('hidden').attr('hidden', 'hidden');
        $resultsRegion.attr('aria-busy', 'false');
    }

    /**
     * Show a recoverable search error.
     * @param {string} message
     */
    function showError(message) {
        $error.removeClass('hidden').removeAttr('hidden');
        $errorMessage.text(message);
    }

    /**
     * Hide the search error UI.
     */
    function hideError() {
        $error.addClass('hidden').attr('hidden', 'hidden');
        $errorMessage.text('');
    }

    /**
     * Update the live search status text.
     * @param {string} message
     */
    function setStatus(message) {
        $status.text(message || '');
    }
}
