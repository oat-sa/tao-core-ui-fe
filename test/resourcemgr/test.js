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
