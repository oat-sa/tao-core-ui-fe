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
    'jquery.mockjax'
], function ($, resourceMgr, contract, fixtures) {
    'use strict';

    const browseUrl = '/mock/resourcemgr/browse';
    const searchUrl = '/mock/resourcemgr/search';
    const downloadUrl = '/mock/resourcemgr/download';

    $.mockjaxSettings.logger = null;
    $.mockjaxSettings.responseTime = 1;

    function clearDom() {
        $('#outside-container .resourcemgr').remove();
        $('#outside-container .modal-bg').remove();
        const $launcher = $('#launcher');
        $launcher.off();
        $launcher.removeData();
        $.mockjax.clear();
    }

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

    function mockSearch(responseFactory) {
        $.mockjax({
            url: searchUrl,
            dataType: 'json',
            response: function (settings) {
                this.responseText = responseFactory(settings);
            }
        });
    }

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
                searchDebounceMs: 0,
                appendContainer: '#outside-container .tao-scope'
            },
            extra || {}
        );
        $launcher.resourcemgr(options);
        return $launcher;
    }

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
        assert.expect(8);

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

    QUnit.module('Resource Manager search', {
        beforeEach: function () {
            clearDom();
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
        assert.expect(6);
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
                assert.ok(
                    /\d{1,2}\/\d{1,2}\/2026.*10:00/.test($modal.find('.files-list tr[data-file="asset://cat"] .meta.updated').text()),
                    'updatedAt is formatted with the configured locale'
                );
                ready();
            });

            $input.val('cat').trigger('input');
        });

        createManager({
            initialPath: '/images',
            initialSelection: 'asset://cat'
        });
    });

    QUnit.test('browse-shaped searchUrl response is filtered locally by query and mime filters', function (assert) {
        const ready = assert.async();
        assert.expect(4);
        let finished = false;

        mockSearch(function () {
            return fixtures.searchBrowseFallback;
        });

        const $launcher = $('#launcher');
        $launcher.on('create.resourcemgr', function () {
            const $modal = $('#outside-container .resourcemgr');
            const $input = $modal.find('.asset-search-input');

            $modal.on('searchresults.resourcemgr', function (e, result) {
                if (finished) {
                    return;
                }
                finished = true;
                assert.equal(result.total, 1, 'query filters browse children');
                assert.equal(result.items.length, 1, 'one matching asset remains');
                assert.equal(result.items[0].name, 'beep.mp3', 'matched asset respects mime filters');
                assert.equal($modal.find('.files-list tr').length, 1, 'one result row is rendered');
                ready();
            });

            $input.val('beep.mp3').trigger('input');
        });

        createManager();
    });

    QUnit.test('empty and error search states are recoverable', function (assert) {
        const ready = assert.async();
        assert.expect(5);
        let step = 0;

        mockSearch(function () {
            return fixtures.searchEmpty;
        });

        const $launcher = $('#launcher');
        $launcher.on('create.resourcemgr', function () {
            const $modal = $('#outside-container .resourcemgr');
            const $input = $modal.find('.asset-search-input');

            $modal.on('searchresults.resourcemgr', function (e, result) {
                step += 1;
                if (step === 1) {
                    assert.equal(result.total, 0, 'empty success payload');
                    assert.ok(
                        String($modal.find('.asset-search-status').text()).length > 0,
                        'empty status is announced'
                    );

                    $.mockjax.clear();
                    mockBrowse();
                    $.mockjax({
                        url: searchUrl,
                        status: 500,
                        statusText: 'error',
                        responseText: 'error'
                    });
                    $input.val('boom').trigger('input');
                    return;
                }

                assert.ok(result.error, 'error flag is set');
                assert.equal($modal.find('.asset-search-error:not([hidden])').length, 1, 'error UI is visible');
                assert.equal($modal.find('.empty:visible').length, 0, 'empty placeholder stays hidden on error');
                ready();
            });

            $input.val('missing').trigger('input');
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
            const $input = $modal.find('.asset-search-input');

            $modal.one('searchresults.resourcemgr', function () {
                $modal.find('.files-list tr[data-file="asset://cat"] a.select').trigger('click');
            });

            $input.val('cat').trigger('input');
        });

        createManager();
    });

    QUnit.test('browse listing renders a sortable asset table', function (assert) {
        const ready = assert.async();
        assert.expect(8);
        const browseCalls = [];

        $.mockjax.clear();
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

            $input.val('cat').trigger('input');
        });

        createManager();
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
