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
 * Copyright (c) 2020 (original work) Open Assessment Technologies SA;
 */
define(['jquery', 'ui/searchModal'], function($, searchModalFactory) {

    QUnit.module('searchModal');

    QUnit.test('module', function(assert) {
        assert.expect(1);
        assert.ok(typeof searchModalFactory === 'function', 'The module expose a function');
    });

    QUnit.test('search component modal is correctly rendered', function(assert) {
        const ready = assert.async();
        const searchModal = searchModalFactory({
            query: 'mathematics',
            url: ''
        });

        setTimeout(function() {
            const $container = $('.search-modal');
            const searchInput = $container.find('.search-bar-container input');
            const clearButton = $('.btn-clear');
            const closeButton = $('.modal-close-left');

            assert.expect(5);

            assert.equal($container.length, 1, 'search component modal is created');
            assert.equal(searchInput.val(), 'mathematics', 'search input value is correctly set');

            clearButton.trigger('click');
            assert.equal(searchInput.val(), '', 'search input value is correctly cleaned');
            assert.equal($container.find('.no-datatable-container .icon-find').length, 1, 'Correct message is displayed when click on clear button');

            setTimeout(function() {
                closeButton.trigger('click');
                setTimeout(function() {
                    const $container = $('.search-modal');
                    assert.equal($container.length, 0, 'search component modal is destroyed');
                    ready();
                }, 500);
            }, 500);
        }, 500);
    });
});
