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
 * Browse mode remains the default; non-empty query text and/or metadata
 * filters switches to search mode when the user clicks Search or presses
 * Enter. Metadata filters reuse ui/searchModal/advancedSearch
 * (add-criteria-container) and are sent as structured `metadata` params.
 *
 * @exports ui/resourcemgr/assetSearch
 */
import $ from 'jquery';
import __ from 'i18n';
import paginationComponent from 'ui/pagination';
import advancedSearchFactory from 'ui/searchModal/advancedSearch';
import rmAdvancedSearchTpl from 'ui/resourcemgr/tpl/advanced-search';
import urlUtil from 'util/url';
import shortcutRegistry from 'util/shortcut/registry';
import {
    DEFAULT_PAGE_SIZE,
    DEFAULT_SORT,
    applyLocalSearchFallback,
    buildMetadataFromCriteriaState,
    buildSearchRequestParams,
    isBrowseShapedSearchPayload,
    normalizeSearchResponse
} from 'ui/resourcemgr/assetSearchContract';
import 'ui/searchModal/css/advancedSearch.css';

const ns = 'resourcemgr';
const EVENT_NS = 'resourcemgrAssetSearch';
const DEFAULT_AJAX_TIMEOUT_MS = 10000;
const DEFAULT_ROOT_CLASS_URI = 'http://www.tao.lu/Ontologies/TAOMedia.rdf#Media';

/**
 * Encode a URI the TAO way (same as views/js/uri.encode / tao_helpers_Uri::encode).
 * ClassMetadata expects this form; searchModal gets it from the resource tree.
 * @param {string} uri
 * @returns {string}
 */
function encodeTaoUri(uri) {
    if (!uri || typeof uri !== 'string') {
        return uri;
    }
    if (/^[a-z]+_2_/i.test(uri)) {
        return uri;
    }
    if (!/^http/.test(uri)) {
        return uri;
    }
    return uri
        .replace(/:\/\//g, '_2_')
        .replace(/#/g, '_3_')
        .replace(/:/g, '_4_')
        .replace(/\//g, '_1_')
        .replace(/\./g, '_0_');
}

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
    const $searchToggle = $('.asset-search-toggle', $searchRoot);
    const $scopeName = $('.asset-search-scope-name', $searchRoot);
    const $scopeSubfolders = $('.asset-search-scope-subfolders', $searchRoot);
    const $scope = $('.asset-search-scope', $searchRoot);
    const $appliedCount = $('.asset-search-applied-count', $searchRoot);
    const $input = $('.asset-search-input', $searchRoot);
    const $filtersMount = $('.asset-search-filters', $searchRoot);
    const $clearButton = $('.asset-search-clear', $searchRoot);
    const $searchButton = $('.asset-search-submit', $searchRoot);
    const $searchButtonSpinner = $('.asset-search-submit-spinner', $searchButton);
    const $searchButtonLabel = $('.asset-search-submit-label', $searchButton);
    const $error = $('.asset-search-error', $fileSelector);
    const $errorMessage = $('.asset-search-error-message', $error);
    const $retry = $('.asset-search-retry', $error);
    const $resultsRegion = $('.files-wrapper', $fileSelector);
    const $paginationContainer = $('.pagination-bottom', $container);
    const $uploadSwitcher = $('.upload-switcher', $fileSelector);

    const rootClassUri = options.rootClassUri || DEFAULT_ROOT_CLASS_URI;
    const classMappingUrl = options.classMappingUrl;
    const statusUrl = options.statusUrl;
    const maxListSize = options.maxListSize || 5;

    let scopePath = options.initialPath || options.path || '/';
    let scopeLabel = '';
    let query = '';
    let metadata = {};
    let sort = Object.assign({}, DEFAULT_SORT);
    let page = 1;
    let pageSize = DEFAULT_PAGE_SIZE;
    let total = 0;
    let searchMode = false;
    let searchCollapsed = false;
    let appliedFilterCount = 0;
    let requestSeq = 0;
    let searchInFlight = false;
    let advancedSearch = null;
    let shortcuts = null;

    const previousTeardown = $container.data('assetSearchTeardown');
    if (typeof previousTeardown === 'function') {
        previousTeardown();
    }

    $searchRoot.removeClass('hidden').removeAttr('hidden');

    /**
     * Whether browse tree content already lists directory children.
     * Conservative: only true when FE knows dirs exist; omit phrase when unknown/leaf.
     * @param {Object} [content]
     * @returns {boolean}
     */
    function folderHasSubfolders(content) {
        if (!content || content.empty === true) {
            return false;
        }
        if (!Array.isArray(content.children)) {
            return false;
        }
        return content.children.some(function (child) {
            return Boolean(child && child.path);
        });
    }

    /**
     * Whether a value is a human folder name (not a browse path / media URI).
     * Mediamanager initialPath is often `taomedia://…`; never show that in U8.
     * @param {*} value
     * @returns {boolean}
     */
    function isFolderDisplayLabel(value) {
        if (value === null || typeof value === 'undefined') {
            return false;
        }
        const text = String(value).trim();
        if (!text) {
            return false;
        }
        // URI / scheme browse keys (taomedia://…, http(s)://…, asset://…)
        if (/^[a-z][a-z0-9+.-]*:/i.test(text)) {
            return false;
        }
        return true;
    }

    /**
     * Render U8/U9 scope line from folder label + optional browse payload.
     * Keeps the previous display name until a real label arrives (avoids URI flash).
     * @param {string} [folderLabel]
     * @param {Object} [content]
     */
    function updateScopeDisplay(folderLabel, content) {
        if (isFolderDisplayLabel(folderLabel)) {
            scopeLabel = String(folderLabel).trim();
        }
        const label = isFolderDisplayLabel(scopeLabel) ? scopeLabel : '';
        $scopeName.text(label);
        if (label) {
            $scopeName.attr('title', label);
        } else {
            $scopeName.removeAttr('title');
        }
        if (folderHasSubfolders(content)) {
            $scopeSubfolders.removeClass('hidden').removeAttr('hidden');
        } else {
            $scopeSubfolders.addClass('hidden').attr('hidden', 'hidden');
        }
    }

    /**
     * Count rendered metadata filter cards (U11 — text query is never included).
     * @returns {number}
     */
    function countRenderedFilters() {
        return $('.advanced-criteria-container > .filter-container', $filtersMount).not(
            '.invalid-criteria-warning-container'
        ).length;
    }

    /**
     * Whether the author has typed a query or added filters (Clear all / Search enable).
     * @returns {boolean}
     */
    function hasPendingSearchParams() {
        return Boolean(String($input.val() || '').trim()) || countRenderedFilters() > 0;
    }

    /**
     * Clear all is hidden until params change; Search is disabled (grey) until then.
     */
    function updateSearchActionState() {
        const pending = hasPendingSearchParams();
        if (pending) {
            $clearButton.removeClass('hidden').removeAttr('hidden');
        } else {
            $clearButton.addClass('hidden').attr('hidden', 'hidden');
        }
        if (searchInFlight) {
            $searchButton.prop('disabled', true);
            return;
        }
        if (pending) {
            $searchButton.prop('disabled', false);
        } else {
            $searchButton.prop('disabled', true);
        }
    }

    /**
     * Collapsed-header applied-filter count (U11). Text query is never counted.
     * When collapsed with filters, replace "Searching in" with applied-filters-summary text.
     */
    function updateCollapsedAppliedCount() {
        appliedFilterCount = countRenderedFilters();
        if (searchCollapsed && appliedFilterCount > 0) {
            const $summary = $('.applied-filters-summary', $filtersMount);
            const summaryText = String(($summary.length && $summary.text()) || '').trim();
            const countText =
                summaryText ||
                (appliedFilterCount === 1
                    ? __('1 filter applied')
                    : __('%s filters applied').replace('%s', String(appliedFilterCount)));

            $scope.addClass('hidden').prop('hidden', true);
            $appliedCount.text(countText).removeClass('hidden').prop('hidden', false);
        } else {
            $scope.removeClass('hidden').prop('hidden', false);
            $appliedCount.addClass('hidden').prop('hidden', true).text('');
        }
        updateSearchActionState();
    }

    /**
     * Expand or collapse the Search section (U10). Session-only; default expanded.
     * @param {boolean} collapsed
     */
    function setSearchCollapsed(collapsed) {
        searchCollapsed = Boolean(collapsed);
        $searchRoot.toggleClass('is-collapsed', searchCollapsed);
        $searchToggle.attr('aria-expanded', searchCollapsed ? 'false' : 'true');
        $searchToggle
            .find('.asset-search-chevron')
            .toggleClass('icon-up', !searchCollapsed)
            .toggleClass('icon-down', searchCollapsed);
        updateCollapsedAppliedCount();
    }

    /**
     * Push pending text-criterion DOM values into advancedSearch state
     * (covers Search click before blur when only change was bound historically).
     */
    function syncCriteriaFromDom() {
        $('.advanced-criteria-container .filter-container[data-type="text"] input', $filtersMount).trigger(
            'change'
        );
    }

    /**
     * Universal text from the search input (metadata is sent separately).
     * @returns {string}
     */
    function buildTextQuery() {
        return String($input.val() || '').trim();
    }

    /**
     * Structured metadata map from Advanced Search state.
     * @returns {Object.<string, string>}
     */
    function buildMetadata() {
        syncCriteriaFromDom();
        if (!advancedSearch || typeof advancedSearch.getState !== 'function') {
            return {};
        }
        return buildMetadataFromCriteriaState(advancedSearch.getState());
    }

    /**
     * @returns {boolean}
     */
    function hasActiveSearch() {
        return Boolean(query) || Object.keys(metadata).length > 0;
    }

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
    setSearchCollapsed(false);
    // Do not seed the scope name from scopePath: mediamanager paths are URIs
    // (taomedia://…) and flash into the header before folderselect brings a label.
    updateScopeDisplay(scopeLabel);
    updateSearchActionState();

    $input.on(`input.${EVENT_NS}`, updateSearchActionState);

    $searchToggle.on(`click.${EVENT_NS}`, function (e) {
        e.preventDefault();
        setSearchCollapsed(!searchCollapsed);
    });

    $container.on(`folderselect.${ns}.${EVENT_NS}`, function (e, label, files, folderPath, content) {
        if (!searchMode) {
            scopePath = folderPath || label || scopePath;
            page = 1;
        }
        updateScopeDisplay(label || (content && content.label), content);
    });

    $container.on(`folderpath.${ns}.${EVENT_NS}`, function (e, folderPath, folderLabel) {
        if (!searchMode) {
            scopePath = folderPath || scopePath;
        }
        if (folderLabel) {
            updateScopeDisplay(folderLabel);
        }
    });

    const ajaxTimeoutMs = Number.isFinite(Number(options.ajaxTimeoutMs)) && Number(options.ajaxTimeoutMs) > 0
        ? Number(options.ajaxTimeoutMs)
        : DEFAULT_AJAX_TIMEOUT_MS;

    /**
     * Relabel shared advancedSearch "add criteria" control to match RM UX.
     */
    function applyAddFilterLabel() {
        const $link = $('.add-criteria-container a', $filtersMount);
        if (!$link.length) {
            return;
        }
        $link.find('.icon-add').removeClass('icon-add').addClass('icon-plus');
        $link.contents().filter(function () {
            return this.nodeType === 3;
        }).remove();
        $link.append(document.createTextNode(` ${__('Add filter')}`));
    }

    /**
     * Whether the Add filter select currently has selectable criteria.
     * @returns {boolean}
     */
    function hasCriteriaOptions() {
        return (
            $('.add-criteria-container select option', $filtersMount).filter(function () {
                return Boolean(this.value);
            }).length > 0
        );
    }

    /**
     * Keep Add filter hidden when Advanced Search is off or criteria are unavailable.
     * @param {boolean} ready
     */
    function setAddFilterReady(ready) {
        const $addCriteria = $('.add-criteria-container', $filtersMount);
        if (!$addCriteria.length) {
            return;
        }
        if (!advancedSearch || !advancedSearch.isEnabled()) {
            $addCriteria.addClass('disabled');
            return;
        }
        $addCriteria.toggleClass('disabled', !ready);
        if (ready) {
            applyAddFilterLabel();
        }
    }

    /**
     * Mount Advanced Search criteria UI and load Asset-class metadata.
     */
    function initAdvancedSearch() {
        if (!statusUrl) {
            return;
        }

        advancedSearch = advancedSearchFactory({
            renderTo: $filtersMount,
            statusUrl: statusUrl,
            rootClassUri: rootClassUri,
            hideCriteria: options.hideCriteria,
            collapsibleCriteria: true,
            layoutTemplate: rmAdvancedSearchTpl
        });

        advancedSearch
            .on('ready', function () {
                applyAddFilterLabel();
                if (!rootClassUri || !classMappingUrl || !advancedSearch.isEnabled()) {
                    setAddFilterReady(false);
                    return;
                }
                // Visible while ClassMetadata loads (icon-loop); click is a no-op until options exist.
                setAddFilterReady(true);
                const route = urlUtil.build(classMappingUrl, {
                    classUri: encodeTaoUri(rootClassUri),
                    maxListSize: maxListSize
                });
                advancedSearch
                    .updateCriteria(route)
                    .then(function () {
                        applyAddFilterLabel();
                        // Only keep Add filter if ClassMetadata returned selectable criteria.
                        // Opening select2 with zero options only shows an empty drop mask.
                        setAddFilterReady(hasCriteriaOptions());
                    })
                    .catch(function () {
                        applyAddFilterLabel();
                        setAddFilterReady(false);
                    });
            })
            .on('criteriachange', function () {
                updateCollapsedAppliedCount();
            })
            .on('error', function () {
                setAddFilterReady(false);
            });

        // Label override even if status request fails before ready
        window.setTimeout(applyAddFilterLabel, 0);
        window.setTimeout(applyAddFilterLabel, 300);
    }

    initAdvancedSearch();

    /**
     * Detach asset-search handlers and destroy Advanced Search.
     */
    function teardown() {
        requestSeq += 1;
        $container.off(`.${EVENT_NS}`);
        $input.off(`.${EVENT_NS}`);
        $retry.off(`.${EVENT_NS}`);
        $clearButton.off(`.${EVENT_NS}`);
        $searchButton.off(`.${EVENT_NS}`);
        $searchToggle.off(`.${EVENT_NS}`);
        if (shortcuts && typeof shortcuts.clear === 'function') {
            shortcuts.clear();
        }
        shortcuts = null;
        if (advancedSearch && typeof advancedSearch.destroy === 'function') {
            advancedSearch.destroy();
        }
        advancedSearch = null;
        appliedFilterCount = 0;
        searchCollapsed = false;
    }

    $container.data('assetSearchTeardown', teardown);
    $container.on(`destroy.${ns}.${EVENT_NS}`, teardown);

    /**
     * Apply the current input/criteria and run search, or exit when empty.
     * Primary triggers: Search button and Enter (same as ui/searchModal).
     */
    function submitSearch() {
        query = buildTextQuery();
        metadata = buildMetadata();
        page = 1;
        if (!hasActiveSearch()) {
            exitSearchMode();
            return;
        }
        enterSearchMode();
        runSearch();
    }

    $searchButton.on(`click.${EVENT_NS}`, function (e) {
        e.preventDefault();
        submitSearch();
    });

    $clearButton.on(`click.${EVENT_NS}`, function (e) {
        e.preventDefault();
        clearSearch();
    });

    shortcuts = shortcutRegistry($input);
    shortcuts.clear().add('enter', function () {
        submitSearch();
    });

    /**
     * Clear text, criteria, and return to browse mode.
     */
    function clearSearch() {
        $input.val('');
        if (advancedSearch && typeof advancedSearch.clear === 'function') {
            advancedSearch.clear();
        }
        // clear() restores select options; keep Add filter when criteria exist
        if (advancedSearch && advancedSearch.isEnabled()) {
            setAddFilterReady(hasCriteriaOptions());
        }
        query = '';
        metadata = {};
        appliedFilterCount = 0;
        updateCollapsedAppliedCount();
        exitSearchMode();
        focusSearchInput();
    }

    /**
     * Retry the last failed search request.
     * @param {jQuery.Event} e
     */
    $retry.on(`click.${EVENT_NS}`, function (e) {
        e.preventDefault();
        runSearch();
    });

    /**
     * Re-run search when the table sort changes in search mode.
     * @param {jQuery.Event} e
     * @param {{field: string, direction: string}} nextSort
     */
    $container.on(`sortchange.${ns}.${EVENT_NS}`, function (e, nextSort) {
        sort = Object.assign({}, DEFAULT_SORT, nextSort || {});
        if (!searchMode || !hasActiveSearch()) {
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
        if (!hasActiveSearch()) {
            exitSearchMode();
            return;
        }

        const seq = ++requestSeq;
        showLoading();
        hideError();

        const data = buildSearchRequestParams({
            path: scopePath,
            query,
            metadata,
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
                // Browse-shaped payloads (`children`, no `items`) are filtered locally when
                // browseSearchFallback is enabled (PoC / dev). Real search APIs return `items`.
                // Metadata filters require indexed search and cannot use this fallback.
                if (isBrowseShapedSearchPayload(response)) {
                    if (options.browseSearchFallback === false) {
                        normalized = {
                            items: [],
                            total: 0,
                            page: 1,
                            pageSize
                        };
                    } else {
                        normalized = applyLocalSearchFallback(normalized, {
                            query,
                            metadata,
                            sort,
                            page,
                            pageSize,
                            filters: options.params && options.params.filters
                        });
                    }
                }
                total = normalized.total;
                page = normalized.page;
                pageSize = normalized.pageSize;

                let emptyMessage = '';
                if (normalized.total === 0) {
                    if (normalized.metadataUnsupported) {
                        emptyMessage = __('Metadata filters require indexed search.');
                    } else if (isBrowseShapedSearchPayload(response) && options.browseSearchFallback === false) {
                        emptyMessage = __('Search is unavailable for this endpoint.');
                    } else {
                        emptyMessage = __('No assets match your search.');
                    }
                }

                // Render search rows as-is (no client MIME/auth filtering).
                $container.trigger(`searchresults.${ns}`, [
                    {
                        query,
                        metadata,
                        path: scopePath,
                        items: normalized.items,
                        total: normalized.total,
                        page: normalized.page,
                        pageSize: normalized.pageSize,
                        sort: Object.assign({}, sort),
                        initialSelection: options.initialSelection,
                        emptyMessage
                    }
                ]);

                renderPagination();
            })
            .fail(function () {
                if (seq !== requestSeq) {
                    return;
                }
                hideLoading();
                page = 1;
                total = 0;
                $paginationContainer.empty();
                const message = __('Unable to search assets. Please try again.');
                showError(message);
                $container.trigger(`searchresults.${ns}`, [
                    {
                        query,
                        metadata,
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
     * Show in-button search progress (spinner + Searching label).
     */
    function showLoading() {
        searchInFlight = true;
        $searchButton.prop('disabled', true).addClass('is-searching').attr('aria-busy', 'true');
        $searchButtonSpinner.removeClass('hidden').removeAttr('hidden');
        $searchButtonLabel.text(__('Searching'));
        $resultsRegion.attr('aria-busy', 'true');
    }

    /**
     * Restore Search button after request completes.
     */
    function hideLoading() {
        searchInFlight = false;
        $searchButton.removeClass('is-searching').attr('aria-busy', 'false');
        $searchButtonSpinner.addClass('hidden').attr('hidden', 'hidden');
        $searchButtonLabel.text(__('Search'));
        $resultsRegion.attr('aria-busy', 'false');
        updateSearchActionState();
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
}
