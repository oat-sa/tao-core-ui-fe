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
     * Poll until the assets table has rows (or timeout), then invoke callback.
     * @param {jQuery} $modal - Resource Manager modal root
     * @param {function(): void} callback - Called when rows appear or after ~2s
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

    QUnit.test('legacy url option is accepted as browseUrl alias', function (assert) {
        const ready = assert.async();
        assert.expect(2);

        const legacyBrowseUrl = '/mock/resourcemgr/legacy-browse';
        let browseCalled = false;

        $.mockjax({
            url: legacyBrowseUrl,
            dataType: 'json',
            response: function () {
                browseCalled = true;
                this.responseText = fixtures.browseRoot;
            }
        });
        mockSearch(function () {
            return fixtures.searchResults;
        });

        const $launcher = $('#launcher');
        $launcher.on('create.resourcemgr', function () {
            whenTableRows($('#outside-container .resourcemgr'), function () {
                assert.ok(browseCalled, 'legacy url option drives browse requests');
                assert.equal(
                    $('#outside-container .resourcemgr .files-list tr').length,
                    2,
                    'browse listing renders via legacy url alias'
                );
                ready();
            });
        });

        $launcher.resourcemgr({
            params: { uri: 'http://myUri', lang: 'en-US', filters: 'image/png' },
            open: false,
            url: legacyBrowseUrl,
            searchUrl: searchUrl,
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

        createManager();
    });

    QUnit.test('currentAsset resolve opens parent folder and preselects when selectable', function (assert) {
        const ready = assert.async();
        assert.expect(2);

        $.mockjax.clear();
        mockAdvancedSearchApis();
        $.mockjax({
            url: browseUrl,
            dataType: 'json',
            response: function (settings) {
                if (settings.data && settings.data.currentAsset) {
                    this.responseText = {
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
                    return;
                }
                const path = settings.data && settings.data.path;
                this.responseText = path === '/images' ? fixtures.browseImages : fixtures.browseRoot;
            }
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
        $.mockjax({
            url: browseUrl,
            dataType: 'json',
            response: function (settings) {
                if (settings.data && settings.data.currentAsset) {
                    this.responseText = {
                        data: { parentPath: '/images', currentAsset: null }
                    };
                    return;
                }
                const path = settings.data && settings.data.path;
                this.responseText = path === '/images' ? fixtures.browseImages : fixtures.browseRoot;
            }
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

        // AC4: after resolve returns currentAsset=null, RM opens parentPath without selection.
        createManager({
            currentAsset: 'asset://missing'
        });
    });

    QUnit.test('reopen with currentAsset preselects after create without context', function (assert) {
        const ready = assert.async();
        assert.expect(2);

        $.mockjax.clear();
        mockAdvancedSearchApis();
        $.mockjax({
            url: browseUrl,
            dataType: 'json',
            response: function (settings) {
                if (settings.data && settings.data.currentAsset) {
                    this.responseText = {
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
                    return;
                }
                const path = settings.data && settings.data.path;
                this.responseText = path === '/images' ? fixtures.browseImages : fixtures.browseRoot;
            }
        });
        mockSearch(function () {
            return fixtures.searchResults;
        });

        const $launcher = $('#launcher');
        $launcher.on('create.resourcemgr', function () {
            // AC3: create had no currentAsset; reopen as edit/change with filled src.
            $launcher.resourcemgr({
                currentAsset: 'asset://cat',
                browseUrl: browseUrl,
                searchUrl: searchUrl,
                downloadUrl: downloadUrl,
                pathParam: 'path'
            });

            const $modal = $('#outside-container .resourcemgr');
            const started = Date.now();
            (function poll() {
                const $cat = $modal.find('.files-list tr[data-file="asset://cat"]');
                if ($cat.length && $cat.hasClass('active')) {
                    assert.equal($cat.length, 1, 'parent folder shows current asset after reopen');
                    assert.ok($cat.hasClass('active'), 'current asset is preselected on reopen');
                    ready();
                    return;
                }
                if (Date.now() - started > 2500) {
                    assert.equal($cat.length, 1, 'parent folder shows current asset after reopen');
                    assert.ok($cat.hasClass('active'), 'current asset is preselected on reopen');
                    ready();
                    return;
                }
                window.setTimeout(poll, 20);
            })();
        });

        createManager();
    });

    QUnit.test('reopen without currentAsset keeps create behaviour (no preselect)', function (assert) {
        const ready = assert.async();
        assert.expect(1);

        mockBrowse();
        mockSearch(function () {
            return fixtures.searchResults;
        });

        const $launcher = $('#launcher');
        $launcher.on('create.resourcemgr', function () {
            $launcher.resourcemgr({
                browseUrl: browseUrl,
                searchUrl: searchUrl,
                downloadUrl: downloadUrl,
                pathParam: 'path'
            });

            const $modal = $('#outside-container .resourcemgr');
            window.setTimeout(function () {
                assert.equal(
                    $modal.find('.files-list tr.active[data-file]').length,
                    0,
                    'reopen without currentAsset does not preselect a row'
                );
                ready();
            }, 200);
        });

        createManager();
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
                        String($modal.find('.asset-search-status').text()).length > 0,
                        'empty status is announced'
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

    QUnit.test('selection works in search mode', function (assert) {
        const ready = assert.async();
        assert.expect(2);

        mockSearch(function (settings) {
            assert.equal(settings.data.page, 1, 'first search starts at page 1');
            return fixtures.searchResults;
        });

        const $launcher = $('#launcher');
        $launcher.on('select.resourcemgr', function (e, files) {
            assert.equal(files[0].file, 'asset://cat', 'selected file URI is emitted');
            ready();
        });

        $launcher.on('create.resourcemgr', function () {
            const $modal = $('#outside-container .resourcemgr');

            $modal.one('searchresults.resourcemgr', function () {
                $modal.find('.files-list tr[data-file="asset://cat"] a.select').trigger('click');
            });

            runSearchFromUi($modal, 'cat');
        });

        createManager();
    });

    QUnit.test('download action does not change row selection', function (assert) {
        const ready = assert.async();
        assert.expect(3);

        mockSearch(function () {
            return fixtures.searchResults;
        });

        const $launcher = $('#launcher');
        $launcher.on('create.resourcemgr', function () {
            const $modal = $('#outside-container .resourcemgr');

            $modal.one('searchresults.resourcemgr', function () {
                const $catRow = $modal.find('.files-list tr[data-file="asset://cat"]');
                const $catalogRow = $modal.find('.files-list tr[data-file="asset://catalog"]');

                $catRow.find('.desc').trigger('click');
                assert.ok($catRow.hasClass('active'), 'cat row is selected before download click');

                const $download = $catalogRow.find('a.download');
                assert.ok($download.length, 'catalog row exposes a download action');
                $download.trigger('focus');
                $download.on('click.test', function (e) {
                    e.preventDefault();
                });
                $download.trigger('click');
                $download.off('click.test');

                const $selectedCat = $modal.find('.files-list tr[data-file="asset://cat"]');
                const $selectedCatalog = $modal.find('.files-list tr[data-file="asset://catalog"]');
                assert.ok($selectedCat.hasClass('active') && !$selectedCatalog.hasClass('active'), 'download click keeps prior selection');
                ready();
            });

            runSearchFromUi($modal, 'cat');
        });

        createManager();
    });

    QUnit.test('search UI mounts Advanced Search filters and Search/Clear controls', function (assert) {
        const ready = assert.async();
        assert.expect(7);
        const safety = window.setTimeout(function () {
            assert.ok(false, 'timed out waiting for search UI');
            ready();
        }, 5000);

        const $launcher = $('#launcher');
        $launcher.on('create.resourcemgr', function () {
            const $modal = $('#outside-container .resourcemgr');
            assert.equal($modal.find('.file-browser .asset-search:not([hidden])').length, 1, 'search lives in left pane');
            assert.equal($modal.find('.asset-search-submit').length, 1, 'Search button is present');
            assert.equal($modal.find('.asset-search-clear').length, 1, 'Clear all button is present');
            assert.equal($modal.find('.resources-title').text().trim(), 'Resources', 'Resources heading is shown');
            assert.equal($modal.find('.asset-search-filters').length, 1, 'filters mount point exists');

            const started = Date.now();
            (function poll() {
                const $addCriteria = $modal.find('.add-criteria-container');
                if ($addCriteria.length && !$addCriteria.hasClass('disabled')) {
                    window.clearTimeout(safety);
                    assert.ok(
                        /Add filter/i.test($addCriteria.find('a').text()),
                        'Add filter is visible when Advanced Search is enabled'
                    );
                    assert.equal(
                        $addCriteria.find('a .icon-plus').length,
                        1,
                        'Add filter uses a plain plus icon'
                    );
                    ready();
                    return;
                }
                if (Date.now() - started > 3000) {
                    window.clearTimeout(safety);
                    assert.ok(false, 'Add filter did not become visible');
                    ready();
                    return;
                }
                window.setTimeout(poll, 20);
            })();
        });

        createManager();
    });

    QUnit.test('Search button sends query and Clear all returns to browse', function (assert) {
        const ready = assert.async();
        assert.expect(5);
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
            $modal.find('.asset-search-submit').trigger('click');
        });

        createManager();
    });

    QUnit.test('folder tree clicks are ignored in search mode (AC2)', function (assert) {
        const ready = assert.async();
        assert.expect(4);
        const safety = window.setTimeout(function () {
            assert.ok(false, 'timed out waiting for search-mode folder click guard');
            ready();
        }, 5000);

        mockSearch(function () {
            return fixtures.searchResults;
        });

        const $launcher = $('#launcher');
        $launcher.on('create.resourcemgr', function () {
            const $modal = $('#outside-container .resourcemgr');

            $modal.one('searchresults.resourcemgr', function (e, result) {
                assert.equal(result.path, '/', 'search keeps original scope path');
                assert.ok($modal.find('.file-selector').hasClass('search-mode'), 'search mode is on');

                const activePathBefore = $modal.find('.folders li.active > a').data('path');
                const $imagesLink = $modal.find('.folders a').filter(function () {
                    return $(this).data('path') === '/images';
                });
                assert.ok($imagesLink.length > 0, 'images folder link exists');

                $imagesLink.trigger('click');

                window.setTimeout(function () {
                    window.clearTimeout(safety);
                    const activePathAfter = $modal.find('.folders li.active > a').data('path');
                    assert.equal(
                        activePathAfter,
                        activePathBefore,
                        'tree active folder is unchanged after click in search mode'
                    );
                    ready();
                }, 50);
            });

            runSearchFromUi($modal, 'cat');
        });

        createManager();
    });

    QUnit.test('disabled Advanced Search hides Add filter', function (assert) {
        const ready = assert.async();
        assert.expect(2);
        advancedSearchEnabled = false;
        const safety = window.setTimeout(function () {
            assert.ok(false, 'timed out waiting for disabled filters');
            ready();
        }, 5000);

        const $launcher = $('#launcher');
        $launcher.on('create.resourcemgr', function () {
            const $modal = $('#outside-container .resourcemgr');
            assert.equal($modal.find('.asset-search:not([hidden])').length, 1, 'universal search remains visible');

            const started = Date.now();
            (function poll() {
                const $addCriteria = $modal.find('.add-criteria-container');
                if ($addCriteria.length && $addCriteria.hasClass('disabled')) {
                    window.clearTimeout(safety);
                    assert.ok(true, 'Add filter is disabled when Advanced Search is off');
                    ready();
                    return;
                }
                if (Date.now() - started > 2000) {
                    window.clearTimeout(safety);
                    assert.ok(
                        !$addCriteria.length || $addCriteria.hasClass('disabled') || !$addCriteria.is(':visible'),
                        'Add filter is disabled when Advanced Search is off'
                    );
                    ready();
                    return;
                }
                window.setTimeout(poll, 20);
            })();
        });

        createManager();
    });

    QUnit.test('Add filter criterion contributes to Search query and Clear restores options', function (assert) {
        const ready = assert.async();
        assert.expect(5);
        let lastQuery = '';
        let lastMetadata = null;
        let searchCalls = 0;
        const safety = window.setTimeout(function () {
            assert.ok(false, 'timed out waiting for filter Search flow, lastQuery=' + lastQuery);
            ready();
        }, 8000);

        mockSearch(function (settings) {
            searchCalls += 1;
            lastQuery = String((settings.data && settings.data.query) || '');
            lastMetadata = (settings.data && settings.data.metadata) || null;
            return fixtures.searchResults;
        });

        const $launcher = $('#launcher');
        $launcher.on('create.resourcemgr', function () {
            const $modal = $('#outside-container .resourcemgr');

            const started = Date.now();
            (function waitReady() {
                const $addCriteria = $modal.find('.add-criteria-container');
                const $select = $modal.find('.add-criteria-container select');
                const optionCountBefore = $select.find('option').filter(function () {
                    return Boolean($(this).val());
                }).length;

                if ($addCriteria.length && !$addCriteria.hasClass('disabled') && optionCountBefore > 0) {
                    $select.select2('val', 'inBothTextParentUri').trigger('change');

                    const $filter = $modal.find('.advanced-criteria-container .filter-container');
                    assert.ok($filter.length >= 1, 'selecting a criterion renders a filter card');

                    $filter.find('input').first().val('alpha').trigger('input').trigger('change');

                    let finished = false;
                    function afterSearch() {
                        if (finished) {
                            return;
                        }
                        finished = true;
                        $modal.off('searchresults.resourcemgr');
                        assert.equal(lastQuery, '', 'universal query stays empty for filter-only search');
                        assert.equal(
                            lastMetadata && lastMetadata.inBothTextParentUri,
                            'alpha',
                            'search request includes structured metadata criterion'
                        );

                        $modal.find('.asset-search-clear').trigger('click');

                        assert.equal(
                            $modal.find('.advanced-criteria-container .filter-container').length,
                            0,
                            'Clear all removes filter cards'
                        );
                        const optionCountAfter = $modal
                            .find('.add-criteria-container select option')
                            .filter(function () {
                                return Boolean($(this).val());
                            }).length;
                        assert.equal(
                            optionCountAfter,
                            optionCountBefore,
                            'Clear all restores criterion options in Add filter'
                        );
                        window.clearTimeout(safety);
                        ready();
                    }

                    $modal.one('searchresults.resourcemgr', afterSearch);
                    $modal.find('.asset-search-submit').trigger('click');

                    window.setTimeout(function () {
                        if (searchCalls > 0) {
                            afterSearch();
                        }
                    }, 150);
                    return;
                }
                if (Date.now() - started > 5000) {
                    window.clearTimeout(safety);
                    assert.ok(false, 'Add filter did not become ready with options');
                    ready();
                    return;
                }
                window.setTimeout(waitReady, 20);
            })();
        });

        createManager();
    });

    QUnit.test('browse listing renders a sortable asset table', function (assert) {
        const ready = assert.async();
        assert.expect(8);
        const browseCalls = [];

        $.mockjax.clear();
        mockAdvancedSearchApis();
        $.mockjax({
            url: browseUrl,
            dataType: 'json',
            response: function (settings) {
                browseCalls.push(settings.data || {});
                this.responseText =
                    settings.data && settings.data.path === '/images'
                        ? fixtures.browseImages
                        : fixtures.browseRoot;
            }
        });

        const $launcher = $('#launcher');
        $launcher.on('create.resourcemgr', function () {
            const $modal = $('#outside-container .resourcemgr');
            whenTableRows($modal, function () {
                assert.equal($modal.find('table.files thead th').length, 3, 'three column headers');
                assert.ok($modal.find('.files-list tr').length > 0, 'browse rows are rendered');
                assert.ok($modal.find('.files-list tr .meta.location').length > 0, 'location is shown in browse');
                assert.equal(
                    $modal.find('.files-list tr .desc').first().text(),
                    'banner.png',
                    'default label sort is ascending'
                );

                const callsBeforeSort = browseCalls.length;
                $modal.find('.files thead th[data-sort-by="label"]').trigger('click');

                const started = Date.now();
                (function poll() {
                    const last = browseCalls[browseCalls.length - 1] || {};
                    if (browseCalls.length > callsBeforeSort && last.sortBy === 'label' && last.sortDir === 'desc') {
                        assert.equal(browseCalls.length, callsBeforeSort + 1, 'browse is refetched once');
                        assert.equal(last.sortBy, 'label', 'same column is kept');
                        assert.equal(last.sortDir, 'desc', 'direction is toggled');
                        assert.equal(
                            $modal.find('.files-list tr .desc').first().text(),
                            'intro.mp3',
                            'rows are reordered even if the service ignores sort'
                        );
                        ready();
                        return;
                    }
                    if (Date.now() - started > 2000) {
                        assert.equal(browseCalls.length, callsBeforeSort + 1, 'browse is refetched once');
                        assert.equal(last.sortBy, 'label', 'same column is kept');
                        assert.equal(last.sortDir, 'desc', 'direction is toggled');
                        assert.equal(
                            $modal.find('.files-list tr .desc').first().text(),
                            'intro.mp3',
                            'rows are reordered even if the service ignores sort'
                        );
                        ready();
                        return;
                    }
                    window.setTimeout(poll, 20);
                })();
            });
        });

        createManager();
    });

    QUnit.test('browse sort refetches only the active media source', function (assert) {
        const ready = assert.async();
        assert.expect(2);
        const browseCalls = [];
        const mediaSourcesUrl = '/mock/resourcemgr/media-sources';

        $.mockjax.clear();
        mockAdvancedSearchApis();
        $.mockjax({
            url: mediaSourcesUrl,
            dataType: 'json',
            responseText: [
                { root: 'local', path: '/' },
                { root: 'mediamanager', path: '/' }
            ]
        });
        $.mockjax({
            url: browseUrl,
            dataType: 'json',
            response: function (settings) {
                browseCalls.push(settings.data || {});
                this.responseText = fixtures.browseRoot;
            }
        });

        const $launcher = $('#launcher');
        $launcher.on('create.resourcemgr', function () {
            const $modal = $('#outside-container .resourcemgr');
            const started = Date.now();

            (function waitForBothSources() {
                const bothTrees =
                    $modal.find('.file-browser .local li.root').length > 0 &&
                    $modal.find('.file-browser .mediamanager li.root').length > 0;
                if (bothTrees && $modal.find('.files-list tr').length && browseCalls.length >= 2) {
                    const callsBeforeSort = browseCalls.length;
                    $modal.find('.files thead th[data-sort-by="location"]').trigger('click');

                    const sortStarted = Date.now();
                    (function poll() {
                        if (browseCalls.length > callsBeforeSort) {
                            assert.equal(browseCalls.length, callsBeforeSort + 1, 'only the active source is refetched');
                            assert.equal(
                                browseCalls[browseCalls.length - 1].sortBy,
                                'location',
                                'active source uses the new sort'
                            );
                            ready();
                            return;
                        }
                        if (Date.now() - sortStarted > 2000) {
                            assert.equal(browseCalls.length, callsBeforeSort + 1, 'only the active source is refetched');
                            assert.equal(
                                browseCalls[browseCalls.length - 1].sortBy,
                                'location',
                                'active source uses the new sort'
                            );
                            ready();
                            return;
                        }
                        window.setTimeout(poll, 20);
                    })();
                    return;
                }
                if (Date.now() - started > 2000) {
                    assert.ok(false, 'both media sources should finish loading');
                    assert.ok(false, 'sort refetch should run');
                    ready();
                    return;
                }
                window.setTimeout(waitForBothSources, 20);
            })();
        });

        createManager({ mediaSourcesUrl: mediaSourcesUrl });
    });

    QUnit.test('search column click refetches with toggled sortDir', function (assert) {
        const ready = assert.async();
        assert.expect(4);
        const searchCalls = [];

        mockSearch(function (settings) {
            searchCalls.push(settings.data || {});
            return fixtures.searchResults;
        });

        const $launcher = $('#launcher');
        $launcher.on('create.resourcemgr', function () {
            const $modal = $('#outside-container .resourcemgr');
            const $input = $modal.find('.asset-search-input');

            $modal.one('searchresults.resourcemgr', function () {
                assert.equal(searchCalls[0].sortBy, 'label', 'search starts with label sort');
                assert.equal(searchCalls[0].sortDir, 'asc', 'search starts ascending');

                $modal.find('.files thead th[data-sort-by="label"]').trigger('click');

                const started = Date.now();
                (function poll() {
                    const last = searchCalls[searchCalls.length - 1] || {};
                    if (searchCalls.length > 1 && last.sortDir === 'desc') {
                        assert.equal(last.sortBy, 'label', 'same column is kept');
                        assert.equal(last.sortDir, 'desc', 'direction is toggled');
                        ready();
                        return;
                    }
                    if (Date.now() - started > 2000) {
                        assert.equal(last.sortBy, 'label', 'same column is kept');
                        assert.equal(last.sortDir, 'desc', 'direction is toggled');
                        ready();
                        return;
                    }
                    window.setTimeout(poll, 20);
                })();
            });

            runSearchFromUi($modal, 'cat');
        });

        createManager();
    });

    QUnit.test('search pagination sends page param and loads next page', function (assert) {
        const ready = assert.async();
        assert.expect(5);
        const searchCalls = [];

        mockSearch(function (settings) {
            searchCalls.push(settings.data || {});
            const page = Number(settings.data && settings.data.page) || 1;
            return page === 2 ? fixtures.searchPage2 : fixtures.searchPaginated;
        });

        const $launcher = $('#launcher');
        $launcher.on('create.resourcemgr', function () {
            const $modal = $('#outside-container .resourcemgr');

            $modal.one('searchresults.resourcemgr', function () {
                assert.equal(searchCalls[0].page, 1, 'first search uses page 1');

                const waitPaginationStarted = Date.now();
                (function waitPagination() {
                    if (!$modal.find('.pagination-bottom button .icon-forward').length) {
                        if (Date.now() - waitPaginationStarted > 2000) {
                            assert.ok(false, 'pagination should appear for multi-page results');
                            ready();
                            return;
                        }
                        window.setTimeout(waitPagination, 20);
                        return;
                    }

                    assert.ok(true, 'pagination is shown');
                    $modal.find('.pagination-bottom button .icon-forward').first().trigger('click');

                    const started = Date.now();
                    (function poll() {
                        const last = searchCalls[searchCalls.length - 1] || {};
                        if (searchCalls.length > 1 && Number(last.page) === 2) {
                            assert.equal(last.page, 2, 'next click requests page 2');
                            assert.equal(
                                $modal.find('.files-list tr[data-file="asset://page2"]').length,
                                1,
                                'page 2 row is rendered'
                            );

                            $modal.find('.pagination-bottom button .icon-backward').first().trigger('click');

                            const prevStarted = Date.now();
                            (function pollPrev() {
                                const prevLast = searchCalls[searchCalls.length - 1] || {};
                                if (searchCalls.length > 2 && Number(prevLast.page) === 1) {
                                    assert.equal(prevLast.page, 1, 'prev click requests page 1 again');
                                    ready();
                                    return;
                                }
                                if (Date.now() - prevStarted > 2000) {
                                    assert.equal(Number(prevLast.page), 1, 'prev click requests page 1 again');
                                    ready();
                                    return;
                                }
                                window.setTimeout(pollPrev, 20);
                            })();
                            return;
                        }
                        if (Date.now() - started > 3000) {
                            assert.equal(Number(last.page), 2, 'next click requests page 2');
                            assert.ok(false, 'timed out waiting for page 2');
                            ready();
                            return;
                        }
                        window.setTimeout(poll, 20);
                    })();
                })();
            });

            runSearchFromUi($modal, 'page');
        });

        createManager();
    });

    QUnit.test('initialSelection preselects row in active search results', function (assert) {
        const ready = assert.async();
        assert.expect(2);

        mockSearch(function () {
            return fixtures.searchResults;
        });

        const $launcher = $('#launcher');
        $launcher.on('create.resourcemgr', function () {
            const $modal = $('#outside-container .resourcemgr');

            $modal.one('searchresults.resourcemgr', function () {
                const $row = $modal.find('.files-list tr[data-file="asset://cat"]');
                assert.equal($row.length, 1, 'search result row exists');
                assert.ok($row.hasClass('active'), 'initialSelection preselects in search mode');
                ready();
            });

            runSearchFromUi($modal, 'cat');
        });

        createManager({
            initialSelection: 'asset://cat'
        });
    });

    QUnit.test('delete action in search results calls deleteUrl with asset path', function (assert) {
        const ready = assert.async();
        assert.expect(3);
        const deleteUrl = '/mock/resourcemgr/delete';
        const deleteCalls = [];

        mockSearch(function () {
            return fixtures.searchDeletable;
        });
        $.mockjax({
            url: deleteUrl,
            dataType: 'json',
            response: function (settings) {
                deleteCalls.push(settings.data || {});
                this.responseText = { deleted: true };
            }
        });

        const $launcher = $('#launcher');
        $launcher.on('create.resourcemgr', function () {
            const $modal = $('#outside-container .resourcemgr');

            $modal.one('searchresults.resourcemgr', function () {
                const $delete = $modal.find('.files-list tr[data-file="asset://deletable"] a.delete');
                assert.equal($delete.length, 1, 'delete action is shown for deletable search row');
                $delete.trigger('click');

                const started = Date.now();
                (function poll() {
                    if (deleteCalls.length) {
                        assert.equal(deleteCalls[0].path, 'asset://deletable', 'deleteUrl receives asset path');
                        assert.equal(
                            $modal.find('.files-list tr[data-file="asset://deletable"]').length,
                            0,
                            'row is removed after delete'
                        );
                        ready();
                        return;
                    }
                    if (Date.now() - started > 2000) {
                        assert.ok(false, 'deleteUrl was not called');
                        ready();
                        return;
                    }
                    window.setTimeout(poll, 20);
                })();
            });

            runSearchFromUi($modal, 'deletable');
        });

        createManager({ deleteUrl: deleteUrl });
    });

    QUnit.test('search sort refetches location and updatedAt in both directions', function (assert) {
        const ready = assert.async();
        assert.expect(8);
        const searchCalls = [];

        mockSearch(function (settings) {
            searchCalls.push(settings.data || {});
            return fixtures.searchResults;
        });

        const $launcher = $('#launcher');
        $launcher.on('create.resourcemgr', function () {
            const $modal = $('#outside-container .resourcemgr');

            $modal.one('searchresults.resourcemgr', function () {
                function clickAndPoll($th, expectedField, expectedDir, done) {
                    $th.trigger('click');
                    const started = Date.now();
                    (function poll() {
                        const last = searchCalls[searchCalls.length - 1] || {};
                        if (last.sortBy === expectedField && last.sortDir === expectedDir) {
                            assert.equal(last.sortBy, expectedField, expectedField + ' sort field');
                            assert.equal(last.sortDir, expectedDir, expectedField + ' ' + expectedDir);
                            done();
                            return;
                        }
                        if (Date.now() - started > 2000) {
                            assert.equal(last.sortBy, expectedField, expectedField + ' sort field');
                            assert.equal(last.sortDir, expectedDir, expectedField + ' ' + expectedDir);
                            done();
                            return;
                        }
                        window.setTimeout(poll, 20);
                    })();
                }

                clickAndPoll($modal.find('.files thead th[data-sort-by="location"]'), 'location', 'asc', function () {
                    clickAndPoll(
                        $modal.find('.files thead th[data-sort-by="location"]'),
                        'location',
                        'desc',
                        function () {
                            clickAndPoll(
                                $modal.find('.files thead th[data-sort-by="updatedAt"]'),
                                'updatedAt',
                                'asc',
                                function () {
                                    clickAndPoll(
                                        $modal.find('.files thead th[data-sort-by="updatedAt"]'),
                                        'updatedAt',
                                        'desc',
                                        function () {
                                            ready();
                                        }
                                    );
                                }
                            );
                        }
                    );
                });
            });

            runSearchFromUi($modal, 'cat');
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
                        /unavailable|No assets match/i.test($modal.find('.asset-search-status').text()),
                        'status explains empty endpoint mismatch'
                    );
                    ready();
                }, 0);
            });

            runSearchFromUi($modal, 'beep');
        });

        createManager({ browseSearchFallback: false });
    });

    QUnit.test('currentAsset resolve AJAX fail shows warning and skips preselect', function (assert) {
        const ready = assert.async();
        assert.expect(3);
        const safety = window.setTimeout(function () {
            assert.ok(false, 'timed out waiting for resolve failure handling');
            ready();
        }, 5000);

        $.mockjax.clear();
        mockAdvancedSearchApis();
        $.mockjax({
            url: browseUrl,
            dataType: 'json',
            response: function (settings) {
                if (settings.data && settings.data.currentAsset) {
                    this.status = 500;
                    this.responseText = { success: false };
                    return;
                }
                const path = settings.data && settings.data.path;
                this.responseText = path === '/images' ? fixtures.browseImages : fixtures.browseRoot;
            }
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

    QUnit.module('Init', {
        beforeEach: clearDom,
        afterEach: clearDom
    });

    QUnit.test('Resource manager Loading but not open', function (assert) {
        const ready = assert.async();
        assert.expect(3);
        const $launcher = $('#launcher');

        $launcher.on('create.resourcemgr', function () {
            assert.ok($('#outside-container .resourcemgr').length === 1, 'The resource manager modal is created');
            assert.ok($('#outside-container .modal-bg').length === 1, 'The background is set');
            assert.ok($('#outside-container .resourcemgr').hasClass('opened') === false, 'The modal is hidden');
            ready();
        });

        $launcher.resourcemgr({
            params: {
                filters: 'image/gif,audio/mpeg',
                uri: 'http://myUri',
                lang: 'en-US'
            },
            open: false
        });
    });

    QUnit.test('Resource manager Loading with eventBinding', function (assert) {
        const ready = assert.async();
        assert.expect(2);
        const $launcher = $('#launcher');

        $launcher.resourcemgr({
            params: {
                filters: 'image/gif,audio/mpeg',
                uri: 'http://myUri',
                lang: 'en-US'
            },
            open: false,
            select: function () {
                assert.ok(true, 'The resource manager bind correctly the select');
            },
            create: function () {
                assert.ok(true, 'The resource manager bind correctly the create');
                ready();
            }
        });

        $('#outside-container .resourcemgr').trigger('select.resourcemgr');
    });

    QUnit.module('Loading', {
        beforeEach: clearDom,
        afterEach: clearDom
    });

    QUnit.test('Resource manager loading and open', function (assert) {
        const ready = assert.async();
        assert.expect(3);
        const $launcher = $('#launcher');

        $launcher.on('open.resourcemgr', function () {
            assert.ok($('#outside-container .resourcemgr').length === 1, 'The resource manager modal is created');
            assert.ok($('#outside-container .modal-bg').length === 1, 'The background is set');
            assert.ok($('#outside-container .resourcemgr').css('display') !== 'none', 'The modal is shown');
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

    QUnit.test('Resource manager select and close', function (assert) {
        const ready = assert.async();
        assert.expect(1);
        const $launcher = $('#launcher');

        $launcher.on('close.resourcemgr', function () {
            assert.ok(true, 'the modal is closed on select resource');
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

        $('#outside-container .resourcemgr').trigger('select.resourcemgr');
    });

    QUnit.test('Resource manager close and reopen', function (assert) {
        const ready = assert.async();
        assert.expect(2);
        const $launcher = $('#launcher');

        $launcher.on('close.resourcemgr', function () {
            assert.ok(true, 'the modal is closed on select resource');

            $launcher.on('open.resourcemgr', function () {
                assert.ok(true, 'the modal is reopen');
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
        $launcher.resourcemgr({
            params: {
                filters: 'image/gif,audio/mpeg',
                uri: 'http://myUri',
                lang: 'en-US'
            },
            open: true
        });

        $('#outside-container .resourcemgr').trigger('select.resourcemgr');
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
