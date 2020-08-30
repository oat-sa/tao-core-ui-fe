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
define(['jquery', 'ui/searchModal'], function ($, searchModalFactory) {
    QUnit.module('searchModal');
    QUnit.test('module', function (assert) {
        assert.expect(1);
        assert.ok(typeof searchModalFactory === 'function', 'The module expose a function');
    });

    QUnit.module('init');
    QUnit.test('searchModal component is correctly initialized', function (assert) {
        const ready = assert.async();
        const instance = searchModalFactory({
            query: 'testing',
            url: '',
            renderTo: '#testable-container'
        });

        instance.on('search-modal.init', function () {
            const $container = $('.search-modal');
            const searchInput = $container.find('.search-bar-container input');

            assert.expect(2);
            assert.equal($('#testable-container')[0], instance.getContainer()[0], 'searchModal component is created');
            assert.equal(searchInput.val(), 'testing', 'search input value is correctly initialized');
            instance.destroy();
            ready();
        });
    });

    QUnit.module('destroy');
    QUnit.test('searchModal component is correctly destroyed', function (assert) {
        const ready = assert.async();
        const instance = searchModalFactory({
            query: '',
            url: '',
            renderTo: '#testable-container'
        });
        $('body').one('opened.modal', function () {
            const $container = $('.search-modal');
            const closeButton = $container.find('.modal-close-left');
            closeButton.trigger('click.modal');
        });
        $('body').one('closed.modal', function () {
            assert.expect(1);
            const $container = $('.search-modal');
            assert.equal($container.length, 0, 'search component modal is destroyed');
            ready();
        });
    });

    QUnit.module('Buttons logic');
    QUnit.test('searchModal buttons work as expected', function (assert) {
        const ready = assert.async();
        const instance = searchModalFactory({
            query: 'testing',
            url: '',
            renderTo: '#testable-container'
        });

        instance.on('search-modal.init', function () {
            const $container = $('.search-modal');
            const searchInput = $container.find('.search-bar-container input');
            const clearButton = $('.btn-clear');

            assert.expect(3);
            assert.equal(searchInput.val(), 'testing', 'search input value is correctly initialized');
            assert.equal($('#testable-container')[0], instance.getContainer()[0], 'searchModal component is created');
            clearButton.trigger('click');
            assert.equal(searchInput.val(), '', 'search input value is correctly cleaned');
            instance.destroy();
            ready();
        });
    });

    QUnit.module('Visual');
    QUnit.test('Visual test', function (assert) {
        const ready = assert.async();
        const instance = searchModalFactory({
            query: '',
            url: '',
            renderTo: '#testable-container'
        });

        assert.expect(1);
        instance.on('search-modal.init', function () {
            assert.ok(true, 'Visual test initialized');
            ready();
        });
    });
});
