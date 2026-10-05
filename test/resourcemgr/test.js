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
define([
    'jquery',
    'ui/resourcemgr',
    'ui/resourcemgr/assetSearchContract',
    'json!test/ui/resourcemgr/mocks/fixtures.json',
    'json!test/ui/searchModal/mocks/mocks.json',
    'jquery.mockjax'
], function ($, resourceMgr, contract, fixtures, searchModalMocks) {
    'use strict';

    const browseUrl = '/mock/resourcemgr/browse';
    const searchUrl = '/mock/resourcemgr/search';
    const downloadUrl = '/mock/resourcemgr/download';
    const assetClassUri = 'http://www.tao.lu/Ontologies/TAOMedia.rdf#Media';
    let advancedSearchEnabled = true;

    $.mockjaxSettings.logger = null;
    $.mockjaxSettings.responseTime = 1;

    /**
     * Remove residual Resource Manager DOM and mockjax handlers between tests.
     * @returns {void}
     */
    function clearDom() {
        $('#outside-container .resourcemgr').remove();
        $('#outside-container .modal-bg').remove();
        $('.criteria-dropdown-select2').remove();
        const $launcher = $('#launcher');
        $launcher.off();
        $launcher.removeData('ui.resourcemgr');
        $launcher.removeData();
        $.mockjax.clear();
    }

    /**
     * Register mockjax endpoints for Advanced Search status and ClassMetadata.
     * @returns {void}
     */
    function mockAdvancedSearchApis() {
        $.mockjax({
            url: '/mock/resourcemgr/advanced-search-status',
            dataType: 'json',
            response: function () {
                this.responseText = advancedSearchEnabled
                    ? searchModalMocks.mockedStatusEnabled
                    : searchModalMocks.mockedStatusDisabled;
            }
        });
        $.mockjax({
            url: /^\/mock\/resourcemgr\/class-metadata/,
            dataType: 'json',
            responseText: searchModalMocks.mockedAdvancedCriteria
        });
        // Fallback for default urlUtil.route endpoints used outside createManager overrides
        $.mockjax({
            url: new RegExp('AdvancedSearch'),
            dataType: 'json',
            response: function () {
                this.responseText = advancedSearchEnabled
                    ? searchModalMocks.mockedStatusEnabled
                    : searchModalMocks.mockedStatusDisabled;
            }
        });
        $.mockjax({
            url: new RegExp('ClassMetadata'),
            dataType: 'json',
            responseText: searchModalMocks.mockedAdvancedCriteria
        });
    }

    /**
     * Register a browse mock that returns root or /images fixtures by path.
     * @returns {void}
     */
    function mockBrowse() {
        $.mockjax({
            url: browseUrl,
            dataType: 'json',
            response: function (settings) {
                const path = settings.data && settings.data.path;
                this.responseText = path === '/images' ? fixtures.browseImages : fixtures.browseRoot;
            }
        });
    }

    /**
     * Register a search mockjax endpoint.
     * @param {function(Object): Object} responseFactory - Builds responseText from the mockjax settings
     * @returns {void}
     */
    function mockSearch(responseFactory) {
        $.mockjax({
            url: searchUrl,
            dataType: 'json',
            response: function (settings) {
                this.responseText = responseFactory(settings);
            }
        });
    }

    /**
     * Create a Resource Manager instance on #launcher with default test options.
     * @param {Object} [extra] - Optional overrides merged into the default options
     * @returns {jQuery} The launcher element with the plugin attached
     */
    function createManager(extra) {
        const $launcher = $('#launcher');
        const options = $.extend(
            true,
            {
                params: {
                    filters: 'image/png,audio/mpeg',
                    uri: 'http://myUri',
                    lang: 'en-US'
                },
                open: false,
                browseUrl: browseUrl,
                searchUrl: searchUrl,
                downloadUrl: downloadUrl,
                pathParam: 'path',
                root: 'local',
                path: '/',
                rootClassUri: assetClassUri,
                statusUrl: '/mock/resourcemgr/advanced-search-status',
                classMappingUrl: '/mock/resourcemgr/class-metadata',
                appendContainer: '#outside-container .tao-scope'
            },
            extra || {}
        );
        $launcher.resourcemgr(options);
        return $launcher;
    }

    /**
     * Fill the search input and click Search.
     * @param {jQuery} $modal - Resource Manager modal root
     * @param {string} text - Query text
     * @returns {void}
     */
    function runSearchFromUi($modal, text) {
        $modal.find('.asset-search-input').val(text);
        $modal.find('.asset-search-submit').trigger('click');
    }

    /**
     * Poll until the file table has rows or timeout.
     * @param {jQuery} $modal - Resource Manager modal root
     * @param {function(): void} callback
     * @returns {void}
     */
    function whenTableRows($modal, callback) {
        const started = Date.now();
        (function poll() {
            if ($modal.find('.files-list tr').length) {
                callback();
                return;
            }
            if (Date.now() - started > 2000) {
                callback();
                return;
            }
            window.setTimeout(poll, 20);
        })();
    }

    /**
     * Browse mock that resolves currentAsset context payloads.
     * @param {function(Object): Object} resolveFactory - Builds resolve response from mockjax settings
     * @returns {void}
     */
    function mockBrowseWithCurrentAssetResolve(resolveFactory) {
        $.mockjax({
            url: browseUrl,
            dataType: 'json',
            response: function (settings) {
                if (settings.data && settings.data.currentAsset) {
                    const payload = resolveFactory.call(this, settings);
                    if (typeof payload !== 'undefined') {
                        this.responseText = payload;
                    }
                    return;
                }
                const path = settings.data && settings.data.path;
                this.responseText = path === '/images' ? fixtures.browseImages : fixtures.browseRoot;
            }
        });
    }

    QUnit.module('assetSearchContract');

    QUnit.test('builds request params and normalizes responses', function (assert) {
        assert.expect(12);

        const params = contract.buildSearchRequestParams({
            path: '/images',
            query: 'cat',
            sort: contract.DEFAULT_SORT,
            page: 2,
            pageSize: 10,
            pathParam: 'path',
            params: { uri: 'item-1', filters: 'image/png' }
        });

        assert.equal(params.path, '/images', 'scope path is set');
        assert.equal(params.query, 'cat', 'query is set');
        assert.equal(params.sortBy, 'label', 'default sort field is label');
        assert.equal(params.page, 2, 'page is set');
        assert.equal(typeof params.metadata, 'undefined', 'metadata omitted when empty');

        const withMetadata = contract.buildSearchRequestParams({
            path: '/images',
            query: '',
            metadata: { 'http://example/Language': 'http://example/Langja-JP' },
            sort: contract.DEFAULT_SORT,
            page: 1
        });
        assert.equal(withMetadata.query, '', 'query can be empty when metadata is set');
        assert.equal(
            withMetadata.metadata['http://example/Language'],
            'http://example/Langja-JP',
            'metadata map is attached'
        );

        const fromState = contract.buildMetadataFromCriteriaState({
            textProp: {
                propertyUri: 'inBothTextParentUri',
                type: 'text',
                rendered: true,
                value: 'alpha'
            },
            listProp: {
                propertyUri: 'inBothListParentUri',
                type: 'list',
                rendered: true,
                value: ['value1', 'value2']
            },
            idle: { propertyUri: 'x', type: 'text', rendered: false, value: 'nope' }
        });
        assert.deepEqual(
            fromState,
            { inBothTextParentUri: 'alpha', inBothListParentUri: 'value1' },
            'criteria state maps to metadata (list uses first value)'
        );

        const normalized = contract.normalizeSearchResponse(fixtures.searchResults);
        assert.equal(normalized.items.length, 2, 'items are normalized');
        assert.equal(normalized.total, 2, 'total is preserved');
        assert.equal(
            contract.normalizeSearchResponse({ items: [{ uri: 'a' }], total: null }).total,
            1,
            'null total falls back to items length'
        );

        const sorted = contract.sortAssetItems(
            [{ name: 'banner.png' }, { name: 'intro.mp3' }],
            { field: 'label', direction: 'desc' }
        );
        assert.equal(sorted[0].name, 'intro.mp3', 'label desc puts intro first');
    });

    QUnit.test('canSubmitScopedAssetSearch gates text length and incomplete metadata', function (assert) {
        assert.expect(6);

        assert.ok(!contract.canSubmitScopedAssetSearch('ab', null), 'short query alone is blocked');
        assert.ok(contract.canSubmitScopedAssetSearch('abc', null), 'query with 3 chars is allowed');
        assert.ok(
            !contract.canSubmitScopedAssetSearch('', {
                lang: { type: 'text', rendered: true, propertyUri: 'p', value: '   ' }
            }),
            'rendered text filter without value blocks search'
        );
        assert.ok(
            contract.canSubmitScopedAssetSearch('', {
                lang: { type: 'text', rendered: true, propertyUri: 'p', value: 'ja' }
            }),
            'metadata-only search is allowed when values are complete'
        );
        assert.ok(
            contract.canSubmitScopedAssetSearch('ab', {
                lang: { type: 'text', rendered: true, propertyUri: 'p', value: 'ja' }
            }),
            'short query does not block when metadata is complete'
        );
        assert.ok(
            !contract.canSubmitScopedAssetSearch('abc', {
                lang: { type: 'text', rendered: true, propertyUri: 'p', value: '' }
            }),
            'valid query is blocked while an empty filter card remains'
        );
    });

    QUnit.test('local fallback matches BE token prefix rules', function (assert) {
        assert.expect(5);

        const base = {
            items: [
                { uri: 'asset://colorbars', name: 'colorbars.mp4', mime: 'video/mp4' },
                { uri: 'asset://mycolor', name: 'mycolor.mp4', mime: 'video/mp4' },
                { uri: 'asset://grade', name: 'color-grade.png', mime: 'image/png' }
            ],
            total: 3,
            page: 1,
            pageSize: 10
        };

        const color = contract.applyLocalSearchFallback(base, { query: 'color' });
        assert.deepEqual(
            color.items.map(function (item) {
                return item.uri;
            }),
            ['asset://grade', 'asset://colorbars'],
            'prefix match keeps color-grade and colorbars (label asc), not mycolor'
        );

        const multi = contract.applyLocalSearchFallback(base, { query: 'color grade' });
        assert.equal(multi.total, 1, 'all tokens required (AND)');
        assert.equal(multi.items[0].uri, 'asset://grade', 'color-grade matches both tokens');

        const delimiterOnly = contract.applyLocalSearchFallback(base, { query: '---' });
        assert.equal(delimiterOnly.total, 0, 'delimiter-only query yields empty like BE');

        const substring = contract.applyLocalSearchFallback(base, { query: 'olor' });
        assert.equal(substring.total, 0, 'mid-token substring does not match (prefix only)');
    });

    QUnit.test('local fallback rejects metadata filters (indexed search required)', function (assert) {
        assert.expect(3);

        const base = {
            items: [{ uri: 'asset://cat', name: 'cat.png', mime: 'image/png' }],
            total: 1,
            page: 1,
            pageSize: 10
        };

        const result = contract.applyLocalSearchFallback(base, {
            query: '',
            metadata: { 'http://example/Language': 'http://example/Langja-JP' }
        });

        assert.equal(result.total, 0, 'metadata filters yield empty results');
        assert.equal(result.items.length, 0, 'no items pass through silently');
        assert.ok(result.metadataUnsupported, 'caller can detect unsupported metadata fallback');
    });

    QUnit.module('Resource Manager search', {
        beforeEach: function () {
            clearDom();
            advancedSearchEnabled = true;
            mockAdvancedSearchApis();
            mockBrowse();
        },
        afterEach: function () {
            clearDom();
        }
    });

    QUnit.test('browse-only mode hides search controls without searchUrl', function (assert) {
        const ready = assert.async();
        assert.expect(2);

        const $launcher = $('#launcher');
        $launcher.on('create.resourcemgr', function () {
            const $modal = $('#outside-container .resourcemgr');
            assert.equal($modal.length, 1, 'modal is created');
            assert.equal($modal.find('.asset-search:not([hidden])').length, 0, 'search UI stays hidden');
            ready();
        });

        $launcher.resourcemgr({
            params: { uri: 'http://myUri', lang: 'en-US' },
            open: false,
            browseUrl: browseUrl,
            downloadUrl: downloadUrl,
            pathParam: 'path',
            root: 'local',
            path: '/',
            appendContainer: '#outside-container .tao-scope'
        });
    });

    QUnit.test('search context renders service results without client filtering', function (assert) {
        const ready = assert.async();
        assert.expect(7);
        let finished = false;

        mockSearch(function () {
            return fixtures.searchResults;
        });

        const $launcher = $('#launcher');
        $launcher.on('create.resourcemgr', function () {
            const $modal = $('#outside-container .resourcemgr');
            const $input = $modal.find('.asset-search-input');

            assert.equal($modal.find('.asset-search:not([hidden])').length, 1, 'search UI is visible');
            assert.ok($input.length === 1, 'search input exists');

            $modal.on('searchresults.resourcemgr', function (e, result) {
                if (finished) {
                    return;
                }
                finished = true;
                assert.equal(result.items.length, 2, 'service results are kept as-is');
                assert.equal($modal.find('.files-list tr').length, 2, 'result rows are rendered');
                assert.ok($modal.find('.files-list tr .meta.location').length > 0, 'location column is shown');
                assert.equal(
                    $modal.find('.files-list tr[data-file="asset://cat"] .meta.updated').text(),
                    '2026-08-01 10:00',
                    'updatedAt is formatted as UTC YYYY-MM-DD HH:mm'
                );
                assert.equal(
                    $modal.find('.files-list tr[data-file="asset://cat"] .meta.location').text(),
                    '/images',
                    'location shows catalog path'
                );
                ready();
            });

            runSearchFromUi($modal, 'cat');
        });

        createManager({
            initialPath: '/images',
            initialSelection: 'asset://cat'
        });
    });

    QUnit.test('browse-shaped searchUrl response is filtered locally by query only', function (assert) {
        const ready = assert.async();
        assert.expect(4);
        let finished = false;

        mockSearch(function () {
            return fixtures.searchBrowseFallback;
        });

        const $launcher = $('#launcher');
        $launcher.on('create.resourcemgr', function () {
            const $modal = $('#outside-container .resourcemgr');

            $modal.on('searchresults.resourcemgr', function (e, result) {
                if (finished) {
                    return;
                }
                finished = true;
                assert.equal(result.total, 1, 'query filters browse children');
                assert.equal(result.items.length, 1, 'one matching asset remains');
                assert.equal(result.items[0].name, 'beep.mp3', 'matched asset by query text');
                assert.equal($modal.find('.files-list tr').length, 1, 'one result row is rendered');
                ready();
            });

            runSearchFromUi($modal, 'beep.mp3');
        });

        createManager({ browseSearchFallback: true });
    });

    QUnit.test('currentAsset resolve opens parent folder and preselects when selectable', function (assert) {
        const ready = assert.async();
        assert.expect(2);

        $.mockjax.clear();
        mockAdvancedSearchApis();
        mockBrowseWithCurrentAssetResolve(function () {
            return {
                data: {
                    parentPath: '/images',
                    currentAsset: {
                        uri: 'asset://cat',
                        label: 'cat.png',
                        name: 'cat.png',
                        mime: 'image/png',
                        location: '/images'
                    }
                }
            };
        });
        mockSearch(function () {
            return fixtures.searchResults;
        });

        const $launcher = $('#launcher');
        $launcher.on('create.resourcemgr', function () {
            const $modal = $('#outside-container .resourcemgr');
            whenTableRows($modal, function () {
                assert.equal(
                    $modal.find('.files-list tr[data-file="asset://cat"]').length,
                    1,
                    'current asset row is present'
                );
                assert.ok(
                    $modal.find('.files-list tr[data-file="asset://cat"]').hasClass('active'),
                    'current asset is preselected'
                );
                ready();
            });
        });

        createManager({
            currentAsset: 'asset://cat'
        });
    });

    QUnit.test('currentAsset resolve opens parent without selection when unavailable', function (assert) {
        const ready = assert.async();
        assert.expect(2);

        $.mockjax.clear();
        mockAdvancedSearchApis();
        mockBrowseWithCurrentAssetResolve(function () {
            return {
                data: { parentPath: '/images', currentAsset: null }
            };
        });
        mockSearch(function () {
            return fixtures.searchResults;
        });

        const $launcher = $('#launcher');
        $launcher.on('create.resourcemgr', function () {
            const $modal = $('#outside-container .resourcemgr');
            whenTableRows($modal, function () {
                assert.equal(
                    $modal.find('.files-list tr.active[data-file]').length,
                    0,
                    'no row is preselected when currentAsset cannot be resolved'
                );
                assert.equal(
                    $modal.find('.files-list tr[data-file="asset://cat"]').length,
                    1,
                    'parent folder contents still render'
                );
                ready();
            });
        });

        createManager({
            currentAsset: 'asset://missing'
        });
    });

    QUnit.test('reopen with currentAsset preselects after create without context', function (assert) {
        const ready = assert.async();
        assert.expect(2);

        $.mockjax.clear();
        mockAdvancedSearchApis();
        mockBrowseWithCurrentAssetResolve(function () {
            return {
                data: {
                    parentPath: '/images',
                    currentAsset: {
                        uri: 'asset://cat',
                        label: 'cat.png',
                        name: 'cat.png',
                        mime: 'image/png',
                        location: '/images'
                    }
                }
            };
        });
        mockSearch(function () {
            return fixtures.searchResults;
        });

        const $launcher = $('#launcher');
        $launcher.one('create.resourcemgr', function () {
            window.setTimeout(function () {
                $launcher.resourcemgr({
                    currentAsset: 'asset://cat',
                    browseUrl: browseUrl,
                    searchUrl: searchUrl,
                    downloadUrl: downloadUrl,
                    pathParam: 'path',
                    open: true
                });

                const $modal = $('#outside-container .resourcemgr');
                whenTableRows($modal, function () {
                    const started = Date.now();
                    (function pollActive() {
                        const $cat = $modal.find('.files-list tr[data-file="asset://cat"]');
                        if ($cat.length && $cat.hasClass('active')) {
                            assert.equal($cat.length, 1, 'parent folder shows current asset after reopen');
                            assert.ok($cat.hasClass('active'), 'current asset is preselected on reopen');
                            ready();
                            return;
                        }
                        if (Date.now() - started > 5000) {
                            assert.equal($cat.length, 1, 'parent folder shows current asset after reopen');
                            assert.ok($cat.hasClass('active'), 'current asset is preselected on reopen');
                            ready();
                            return;
                        }
                        window.setTimeout(pollActive, 20);
                    })();
                });
            }, 50);
        });

        createManager({ open: false });
    });

    QUnit.test('currentAsset resolve AJAX fail shows warning and skips preselect', function (assert) {
        const ready = assert.async();
        assert.expect(3);
        const safety = window.setTimeout(function () {
            assert.ok(false, 'timed out waiting for resolve failure handling');
            ready();
        }, 4000);

        $.mockjax.clear();
        mockAdvancedSearchApis();
        mockBrowseWithCurrentAssetResolve(function () {
            this.status = 500;
            this.responseText = { success: false };
        });
        mockSearch(function () {
            return fixtures.searchResults;
        });

        const $launcher = $('#launcher');
        $launcher.on('create.resourcemgr', function () {
            const stored = $launcher.data('ui.resourcemgr');
            assert.notOk(stored.initialSelection, 'resolve failure clears initialSelection');

            window.setTimeout(function () {
                window.clearTimeout(safety);
                assert.equal(
                    $('#outside-container .resourcemgr .files-list tr.active[data-file]').length,
                    0,
                    'no row is preselected after resolve failure'
                );
                assert.ok(
                    $('#outside-container .resourcemgr .feedback').length > 0,
                    'resolve failure surfaces warning feedback'
                );
                ready();
            }, 50);
        });

        createManager({
            currentAsset: 'asset://missing'
        });
    });

    QUnit.test('superseded currentAsset resolve keeps the latest selection', function (assert) {
        const ready = assert.async();
        assert.expect(2);
        let resolveSeq = 0;

        $.mockjax.clear();
        mockAdvancedSearchApis();
        mockBrowseWithCurrentAssetResolve(function () {
            resolveSeq += 1;
            const seq = resolveSeq;
            if (seq === 1) {
                this.responseTime = 250;
            }
            const uri = seq === 1 ? 'asset://dog' : 'asset://cat';
            return {
                data: {
                    parentPath: '/images',
                    currentAsset: {
                        uri: uri,
                        label: uri.replace('asset://', ''),
                        name: uri.replace('asset://', ''),
                        mime: 'image/png',
                        location: '/images'
                    }
                }
            };
        });
        mockSearch(function () {
            return fixtures.searchResults;
        });

        createManager({
            currentAsset: 'asset://dog',
            open: false
        });

        const $launcher = $('#launcher');
        window.setTimeout(function () {
            $launcher.resourcemgr({
                currentAsset: 'asset://cat',
                browseUrl: browseUrl,
                searchUrl: searchUrl,
                downloadUrl: downloadUrl,
                pathParam: 'path',
                open: false
            });
        }, 50);

        window.setTimeout(function () {
            const stored = $launcher.data('ui.resourcemgr');
            assert.equal(stored.initialSelection, 'asset://cat', 'latest resolve wins over stale in-flight resolve');
            assert.ok(stored.contextToken >= 2, 'reopen bumps context token');
            ready();
        }, 1500);
    });

    QUnit.test('empty and error search states are recoverable', function (assert) {
        const ready = assert.async();
        assert.expect(7);
        let step = 0;

        mockSearch(function () {
            return fixtures.searchEmpty;
        });

        const $launcher = $('#launcher');
        $launcher.on('create.resourcemgr', function () {
            const $modal = $('#outside-container .resourcemgr');

            $modal.on('searchresults.resourcemgr', function (e, result) {
                step += 1;
                if (step === 1) {
                    assert.equal(result.total, 0, 'empty success payload');
                    assert.ok(
                        /No assets match your search/i.test(String($modal.find('.empty').text())),
                        'empty message is shown in the table area'
                    );
                    assert.equal(
                        $modal.find('.files-wrapper').css('display'),
                        'none',
                        'table is hidden when empty'
                    );
                    assert.notEqual(
                        $modal.find('.empty').css('display'),
                        'none',
                        'No files placeholder is shown'
                    );

                    $.mockjax.clear();
                    mockAdvancedSearchApis();
                    mockBrowse();
                    $.mockjax({
                        url: searchUrl,
                        status: 500,
                        statusText: 'error',
                        responseText: 'error'
                    });
                    runSearchFromUi($modal, 'boom');
                    return;
                }

                assert.ok(result.error, 'error flag is set');
                assert.equal($modal.find('.asset-search-error:not([hidden])').length, 1, 'error UI is visible');
                assert.equal(
                    $modal.find('.empty').css('display'),
                    'none',
                    'empty placeholder stays hidden on error'
                );
                ready();
            });

            runSearchFromUi($modal, 'missing');
        });

        createManager();
    });

    QUnit.test('Search button stays disabled until query has at least 3 characters', function (assert) {
        const ready = assert.async();
        assert.expect(2);

        mockSearch(function () {
            return fixtures.searchResults;
        });

        const $launcher = $('#launcher');
        $launcher.on('create.resourcemgr', function () {
            const $modal = $('#outside-container .resourcemgr');
            const $input = $modal.find('.asset-search-input');
            const $submit = $modal.find('.asset-search-submit');

            $input.val('ab').trigger('input');
            assert.ok($submit.prop('disabled'), 'two characters keep Search disabled');
            $input.val('abc').trigger('input');
            assert.ok(!$submit.prop('disabled'), 'three characters enable Search');
            ready();
        });

        createManager();
    });

    QUnit.test('Search button sends query and Clear all returns to browse', function (assert) {
        const ready = assert.async();
        assert.expect(7);
        let searchCalls = 0;
        const safety = window.setTimeout(function () {
            assert.ok(false, 'timed out waiting for Search/Clear flow');
            ready();
        }, 5000);

        mockSearch(function (settings) {
            searchCalls += 1;
            assert.equal(settings.data.query, 'planet', 'Search button posts the typed query');
            return fixtures.searchResults;
        });

        const $launcher = $('#launcher');
        $launcher.on('create.resourcemgr', function () {
            const $modal = $('#outside-container .resourcemgr');
            const $input = $modal.find('.asset-search-input');

            $modal.one('searchresults.resourcemgr', function () {
                assert.equal(searchCalls, 1, 'one search request was made');
                assert.ok($modal.find('.file-selector').hasClass('search-mode'), 'search mode is active');

                $modal.one('searchclear.resourcemgr', function () {
                    window.clearTimeout(safety);
                    assert.ok(!$modal.find('.file-selector').hasClass('search-mode'), 'Clear all exits search mode');
                    ready();
                });

                $modal.find('.asset-search-clear').trigger('click');
            });

            // Typing alone must not search (no debounce trigger)
            $input.val('planet').trigger('input');
            assert.equal(searchCalls, 0, 'input does not trigger search without Search click');
            assert.ok(!$modal.find('.asset-search-submit').prop('disabled'), 'Search enables after params change');
            assert.ok(
                !$modal.find('.asset-search-clear').is('[hidden]') &&
                    !$modal.find('.asset-search-clear').hasClass('hidden'),
                'Clear all appears after params change'
            );
            $modal.find('.asset-search-submit').trigger('click');
        });

        createManager();
    });

    QUnit.test('browseSearchFallback disabled yields empty results for browse-shaped payload', function (assert) {
        const ready = assert.async();
        assert.expect(3);

        mockSearch(function () {
            return fixtures.searchBrowseFallback;
        });

        const $launcher = $('#launcher');
        $launcher.on('create.resourcemgr', function () {
            const $modal = $('#outside-container .resourcemgr');

            $modal.one('searchresults.resourcemgr', function (e, result) {
                assert.equal(result.items.length, 0, 'browse-shaped payload is not filtered locally');
                assert.equal($modal.find('.files-list tr').length, 0, 'no rows are rendered');

                window.setTimeout(function () {
                    assert.ok(
                        /unavailable|No assets match/i.test($modal.find('.empty').text()),
                        'empty endpoint message is shown in the table area'
                    );
                    ready();
                }, 0);
            });

            runSearchFromUi($modal, 'beep');
        });

        createManager({ browseSearchFallback: false });
    });

    QUnit.module('Resource Manager upload', {
        beforeEach: function () {
            clearDom();
            advancedSearchEnabled = true;
            mockAdvancedSearchApis();
        },
        afterEach: clearDom
    });

    QUnit.test('filenew refetches folder listing so uploaded assets appear', function (assert) {
        const ready = assert.async();
        assert.expect(3);
        let imagesBrowseLoads = 0;

        $.mockjax({
            url: browseUrl,
            dataType: 'json',
            response: function (settings) {
                const path = settings.data && settings.data.path;
                if (path === '/images') {
                    imagesBrowseLoads += 1;
                    if (imagesBrowseLoads >= 2) {
                        this.responseText = {
                            data: {
                                path: '/images',
                                label: 'Images',
                                childrenLimit: 10,
                                total: 2,
                                permissions: ['READ', 'WRITE', 'UPLOAD'],
                                children: fixtures.browseImages.data.children.concat([
                                    {
                                        uri: 'asset://new-upload',
                                        name: 'new-upload.png',
                                        mime: 'image/png',
                                        size: 100,
                                        location: '/images',
                                        updatedAt: '2026-09-01T10:00:00Z',
                                        permissions: ['READ', 'DOWNLOAD']
                                    }
                                ])
                            }
                        };
                    } else {
                        this.responseText = fixtures.browseImages;
                    }
                    return;
                }
                this.responseText = fixtures.browseRoot;
            }
        });

        const $launcher = $('#launcher');
        $launcher.on('create.resourcemgr', function () {
            const $modal = $('#outside-container .resourcemgr');
            const $target = $launcher.data('ui.resourcemgr').$target;

            whenTableRows($modal, function () {
                assert.equal($modal.find('.files-list tr').length, 1, 'initial folder page has one asset');

                const loadsBeforeUpload = imagesBrowseLoads;
                $target.trigger('filenew.resourcemgr', [
                    {
                        uri: 'asset://new-upload',
                        name: 'new-upload.png',
                        mime: 'image/png'
                    },
                    '/images'
                ]);

                const started = Date.now();
                (function poll() {
                    const rowCount = $modal.find('.files-list tr').length;
                    if (rowCount >= 2 && imagesBrowseLoads > loadsBeforeUpload) {
                        assert.ok(imagesBrowseLoads > loadsBeforeUpload, 'browse is called again after upload');
                        assert.equal(rowCount, 2, 'refetched listing includes the uploaded asset');
                        ready();
                        return;
                    }
                    if (Date.now() - started > 3000) {
                        assert.ok(
                            imagesBrowseLoads > loadsBeforeUpload,
                            'browse is called again after upload'
                        );
                        assert.equal(rowCount, 2, 'refetched listing includes the uploaded asset');
                        ready();
                        return;
                    }
                    window.setTimeout(poll, 30);
                })();
            });
        });

        createManager({
            open: true,
            initialPath: '/images'
        });
    });

    QUnit.test('filedelete refetches folder listing without duplicate rows', function (assert) {
        const ready = assert.async();
        assert.expect(3);
        let imagesBrowseLoads = 0;
        const twoFilesPayload = {
            data: {
                path: '/images',
                label: 'Images',
                childrenLimit: 10,
                total: 2,
                permissions: ['READ', 'WRITE', 'UPLOAD', 'DELETE'],
                children: [
                    fixtures.browseImages.data.children[0],
                    {
                        uri: 'asset://dog',
                        name: 'dog.png',
                        mime: 'image/png',
                        size: 512,
                        location: '/images',
                        updatedAt: '2026-08-02T10:00:00Z',
                        permissions: ['READ', 'DOWNLOAD', 'DELETE']
                    }
                ]
            }
        };

        $.mockjax({
            url: browseUrl,
            dataType: 'json',
            response: function (settings) {
                const path = settings.data && settings.data.path;
                if (path === '/images') {
                    imagesBrowseLoads += 1;
                    if (imagesBrowseLoads >= 2) {
                        this.responseText = fixtures.browseImages;
                    } else {
                        this.responseText = twoFilesPayload;
                    }
                    return;
                }
                this.responseText = fixtures.browseRoot;
            }
        });

        const $launcher = $('#launcher');
        $launcher.on('create.resourcemgr', function () {
            const $modal = $('#outside-container .resourcemgr');
            const $target = $launcher.data('ui.resourcemgr').$target;

            whenTableRows($modal, function () {
                assert.equal($modal.find('.files-list tr').length, 2, 'initial folder page has two assets');

                const loadsBeforeDelete = imagesBrowseLoads;
                $target.trigger('filedelete.resourcemgr', ['asset://dog']);

                const started = Date.now();
                (function poll() {
                    const $rows = $modal.find('.files-list tr');
                    const uris = $rows
                        .map(function () {
                            return $(this).data('file');
                        })
                        .get();
                    const uniqueUriCount = uris.filter(function (uri, index) {
                        return uris.indexOf(uri) === index;
                    }).length;

                    if ($rows.length === 1 && imagesBrowseLoads > loadsBeforeDelete) {
                        assert.ok(imagesBrowseLoads > loadsBeforeDelete, 'browse is called again after delete');
                        assert.equal(uniqueUriCount, 1, 'remaining row is not duplicated');
                        ready();
                        return;
                    }
                    if (Date.now() - started > 3000) {
                        assert.ok(imagesBrowseLoads > loadsBeforeDelete, 'browse is called again after delete');
                        assert.equal(uniqueUriCount, $rows.length, 'remaining rows are not duplicated');
                        ready();
                        return;
                    }
                    window.setTimeout(poll, 30);
                })();
            });
        });

        createManager({
            open: true,
            initialPath: '/images'
        });
    });

    QUnit.module('Destroy', {
        beforeEach: clearDom,
        afterEach: clearDom
    });

    QUnit.test('ResourceManager destroy', function (assert) {
        const ready = assert.async();
        assert.expect(1);
        const $launcher = $('#launcher');

        $launcher.on('open.resourcemgr', function () {
            $launcher.resourcemgr('destroy');
        });
        $launcher.on('destroy.resourcemgr', function () {
            assert.ok(true, 'resource manager is destoyed');
            ready();
        });

        $launcher.resourcemgr({
            params: {
                filters: 'image/gif,audio/mpeg',
                uri: 'http://myUri',
                lang: 'en-US'
            },
            open: true
        });
    });
});
