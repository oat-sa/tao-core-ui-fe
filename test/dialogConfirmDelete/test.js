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
/**
 * @author Hanna Dzmitryieva <hanna@taotesting.com>
 */
define(['ui/dialog/confirmDelete'], function(dialogConfirmDelete) {
    'use strict';

    QUnit.module('dialog/confirmDelete');

    QUnit.test('module', function(assert) {
        const conf1 = dialogConfirmDelete();
        const conf2 = dialogConfirmDelete();
        assert.equal(typeof dialogConfirmDelete, 'function', 'The dialogConfirmDelete module exposes a function');
        assert.equal(typeof conf1, 'object', 'The dialogConfirmDelete factory produces an object');
        assert.notStrictEqual(conf1, conf2, 'The dialogConfirmDelete factory provides a different object on each call');
        conf1.destroy();
        conf2.destroy();
    });

    const dialogApi = [
        { name: 'init', title: 'init' },
        { name: 'destroy', title: 'destroy' },
        { name: 'setButtons', title: 'setButtons' },
        { name: 'render', title: 'render' },
        { name: 'show', title: 'show' },
        { name: 'hide', title: 'hide' },
        { name: 'trigger', title: 'trigger' },
        { name: 'on', title: 'on' },
        { name: 'off', title: 'off' },
        { name: 'getDom', title: 'getDom' }
    ];

    QUnit.cases.init(dialogApi).test('instance API ', function(data, assert) {
        const instance = dialogConfirmDelete();
        assert.equal(
            typeof instance[data.name],
            'function',
            `The dialogConfirmDelete instance exposes a "${data.title}" function`
        );
        instance.destroy();
    });

    const confirmCases = [
        {
            message: 'must accept',
            button: 'delete',
            title: 'accept'
        },
        {
            message: 'must refuse',
            button: 'cancel',
            title: 'refuse',
            options: {
                buttons: {
                    labels: {
                        delete: 'new delete label',
                        cancel: 'new cancel label'
                    }
                }
            }
        }
    ];

    QUnit.cases.init(confirmCases).test('use ', function(data, assert) {
        const ready = assert.async();
        const accept = function() {
            assert.equal(
                data.button,
                'delete',
                'The dialogConfirmDelete has triggered the accept callback function when hitting the ok button!'
            );
            ready();
        };
        const refuse = function() {
            assert.equal(
                data.button,
                'cancel',
                'The dialogConfirmDelete has triggered the refuse callback function when hitting the cancel button!'
            );
            ready();
        };
        const modal = dialogConfirmDelete(data.message, accept, refuse, data.options || {});

        assert.equal(typeof modal, 'object', 'The dialogConfirmDelete instance is an object');
        assert.equal(typeof modal.getDom(), 'object', 'The dialogConfirmDelete instance gets a DOM element');
        assert.ok(!!modal.getDom().length, 'The dialogConfirmDelete instance gets a DOM element');
        assert.equal(modal.getDom().parent().length, 1, 'The dialogConfirmDelete box is rendered by default');
        assert.equal(
            modal
                .getDom()
                .find('.message')
                .text(),
            data.message,
            'The dialogConfirmDelete box displays the message'
        );

        assert.equal(modal.getDom().find('button').length, 3, 'The dialogConfirmDelete box displays 2 buttons');
        assert.equal(
            modal.getDom().find('button[data-control="delete"]').length,
            1,
            "The dialogConfirmDelete box displays a 'delete' button"
        );
        assert.equal(
            modal.getDom().find('button[data-control="delete"]').is(':disabled'),
            true,
            "The dialogConfirmDelete box displays disabled 'delete' button"
        );
        assert.equal(
            modal.getDom().find('button[data-control="cancel"]').length,
            1,
            "The dialogConfirmDelete box displays a 'cancel' button"
        );

        if (data.options && data.options.buttons) {
            assert.equal(
                modal
                    .getDom()
                    .find('button[data-control="delete"] .label')
                    .text(),
                data.options.buttons.labels.delete,
                'The dialogConfirmDelete box displays correct label'
            );
            assert.equal(
                modal
                    .getDom()
                    .find('button[data-control="cancel"] .label')
                    .text(),
                data.options.buttons.labels.cancel,
                'The dialogConfirmDelete box displays correct label'
            );
        }
        modal
            .getDom()
            .find('#confirm')
            .click();

        assert.equal(
            modal.getDom().find('button[data-control="delete"]').is(':disabled'),
            false,
            "The dialogConfirmDelete box displays enabled 'delete' button"
        );

        modal
            .getDom()
            .find(`button[data-control="${data.button}"]`)
            .click();
    });
});
