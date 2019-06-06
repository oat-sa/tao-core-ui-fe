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
 * Copyright (c) 2015 (original work) Open Assessment Technologies SA ;
 */
/**
 * @author Jean-Sébastien Conan <jean-sebastien.conan@vesperiagroup.com>
 */
define(['jquery', 'lodash', 'ui/modal', 'tpl!test/ui/modal/modal'], function($, _, modalListener, modalTpl) {
    'use strict';

    QUnit.module('modal');

    QUnit.test('module', function(assert) {
        assert.equal(typeof modalListener, 'function', 'The modal module exposes a function');
        assert.equal(typeof $().modal, 'function', "The modal module inject a jQuery plugin named 'modal'");
    });

    QUnit.test('install', function(assert) {
        var ready2 = assert.async();
        var ready1 = assert.async();
        var $container = $('#modal-1');
        var $modal = $(modalTpl());
        $container.append($modal);

        $modal.on('opened.modal', function() {
            assert.ok(true, 'The modal is now visible');
            ready();

            $modal.modal('close');
        });
        $modal.on('closed.modal', function() {
            assert.ok(true, 'The modal is now hidden');
            ready1();
        });
        $modal.on('create.modal', function() {
            assert.ok(true, 'The modal is created');
            ready2();
        });

        var ready = assert.async();
        $modal.modal();

        assert.equal($container.children().length, 2, 'The modal append 2 elements');
        assert.equal($container.find('.modal').length, 1, 'The modal is contained');
        assert.equal($container.find('.modal-bg').length, 1, 'The modal appends an overlay');

        assert.ok($modal.is('.modal'), 'The modal has the right class');

        assert.equal($modal.children().length, 2, 'The modal displays 2 elements');
        assert.equal($modal.find('.modal-body').length, 1, 'The modal appends a body');
        assert.equal($modal.find('.modal-close').length, 1, 'The modal appends a close button');
    });

    QUnit.test('destroy', function(assert) {
        var ready2 = assert.async();
        var ready1 = assert.async();
        var $container = $('#modal-2');
        var $modal = $(modalTpl());
        $container.append($modal);

        $modal.on('opened.modal', function() {
            assert.ok(true, 'The modal is now visible');
            ready();

            $modal.modal('destroy');
        });
        $modal.on('closed.modal', function() {
            assert.ok(false, 'The modal is must not be hidden when destroyed');
        });
        $modal.on('create.modal', function() {
            assert.ok(true, 'The modal is created');
            ready1();
        });
        $modal.on('destroyed.modal', function() {
            assert.equal($container.find('.modal-bg').length, 0, 'The modal has removed the overlay');
            assert.ok(true, 'The modal is now destroyed');

            ready2();
        });

        var ready = assert.async();
        $modal.modal();

        assert.equal($container.children().length, 2, 'The modal append 2 elements');
        assert.equal($container.find('.modal').length, 1, 'The modal is contained');
        assert.equal($container.find('.modal-bg').length, 1, 'The modal appends an overlay');

        assert.ok($modal.is('.modal'), 'The modal has the right class');

        assert.equal($modal.children().length, 2, 'The modal displays 2 elements');
        assert.equal($modal.find('.modal-body').length, 1, 'The modal appends a body');
        assert.equal($modal.find('.modal-close').length, 1, 'The modal appends a close button');
    });

    QUnit.test('events', function(assert) {
        var ready3 = assert.async();
        var ready2 = assert.async();
        var ready1 = assert.async();
        var ready = assert.async(2);

        var $container = $('#modal-1');
        var $modal = $(modalTpl());
        var closed = false;
        $container.append($modal);

        $modal.on('opened.modal', function() {
            assert.ok(true, 'The modal is now visible');
            ready();

            if (closed) {
                $modal.modal('destroy');
            } else {
                $modal.modal('close');
            }
        });
        $modal.on('closed.modal', function(e, reason) {
            assert.ok(true, 'The modal is now hidden');
            assert.equal(typeof e, 'object', 'A event object is provided');
            assert.equal(reason, 'api', 'The exit reason has been provided');
            ready1();

            closed = true;
            $modal.modal('open');
        });
        $modal.on('create.modal', function() {
            assert.ok(true, 'The modal is created');
            ready2();
        });
        $modal.on('destroyed.modal', function() {
            assert.equal($container.find('.modal-bg').length, 0, 'The modal has removed the overlay');
            assert.ok(true, 'The modal is now destroyed');

            ready3();
        });

        $modal.modal();

        assert.equal($container.children().length, 2, 'The modal append 2 elements');
        assert.equal($container.find('.modal').length, 1, 'The modal is contained');
        assert.equal($container.find('.modal-bg').length, 1, 'The modal appends an overlay');

        assert.ok($modal.is('.modal'), 'The modal has the right class');

        assert.equal($modal.children().length, 2, 'The modal displays 2 elements');
        assert.equal($modal.find('.modal-body').length, 1, 'The modal appends a body');
        assert.equal($modal.find('.modal-close').length, 1, 'The modal appends a close button');
    });

    // Modal position does not depend on the main page scroll (BODY OR HTML)
    QUnit.test('mainScroll', function(assert) {
        var ready = assert.async();
        assert.expect(2);

        var $container = $('#modal-1');
        var $modal = $(modalTpl());
        $modal.css({ position: 'absolute' });
        $container.append($modal);

        $modal.on('opened.modal', function() {
            assert.ok(true, 'The modal is visible');
            assert.equal($modal.css('top'), '40px', 'Default scroll value used for the position');
            ready();
        });

        $modal.modal();
    });

    // Modal position should be changed when the modal in the container
    QUnit.test('innerScroll', function(assert) {
        var ready = assert.async();
        assert.expect(2);
        var $container = $('#modal-1');
        var $modal = $(modalTpl());
        var $scrolledContainer = $('<div style="height: 200px; overflow: auto;"></div>');
        var $content = $('<div style="height: 1000px;">Body</div>');
        $modal.css({ position: 'absolute' });
        $scrolledContainer.append($content);
        $scrolledContainer.append($modal);
        $container.append($scrolledContainer);
        $scrolledContainer.scrollTop(500);

        $modal.on('opened.modal', function() {
            assert.ok(true, 'The modal is visible');
            assert.equal($modal.css('top'), '540px', 'Modal window opened in the scrolled position');
            ready();
        });

        $modal.modal();
    });
});
