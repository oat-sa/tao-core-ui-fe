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
 * Copyright (c) 2015-2019 (original work) Open Assessment Technologies SA ;
 */
/**
 * @author Jean-Sébastien Conan <jean-sebastien.conan@vesperiagroup.com>
 */
define(['ui/dialog/confirm'], function (dialogConfirm) {
    'use strict';

    QUnit.module('dialog/confirm');

    QUnit.test('module', function (assert) {
        const conf1 = dialogConfirm();
        const conf2 = dialogConfirm();
        assert.equal(typeof dialogConfirm, 'function', 'The dialogConfirm module exposes a function');
        assert.equal(typeof conf1, 'object', 'The dialogConfirm factory produces an object');
        assert.notStrictEqual(conf1, conf2, 'The dialogConfirm factory provides a different object on each call');
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

    QUnit.cases.init(dialogApi).test('instance API ', function (data, assert) {
        var instance = dialogConfirm();
        assert.equal(
            typeof instance[data.name],
            'function',
            `The dialogConfirm instance exposes a "${data.title}" function`
        );
        instance.destroy();
    });

    const confirmCases = [
        {
            message: 'must accept',
            button: 'ok',
            title: 'accept'
        },
        {
            message: 'must refuse',
            button: 'cancel',
            title: 'refuse',
            options: {
                buttons: {
                    labels: {
                        ok: 'new ok label',
                        cancel: 'new cancel label'
                    }
                }
            }
        }
    ];

    QUnit.cases.init(confirmCases).test('use ', function (data, assert) {
        var ready = assert.async();
        var accept = function () {
            assert.equal(
                data.button,
                'ok',
                'The dialogConfirm has triggered the accept callback function when hitting the ok button!'
            );
            ready();
        };
        var refuse = function () {
            assert.equal(
                data.button,
                'cancel',
                'The dialogConfirm has triggered the refuse callback function when hitting the cancel button!'
            );
            ready();
        };
        var modal = dialogConfirm(data.message, accept, refuse, data.options || {});

        assert.equal(typeof modal, 'object', 'The dialogConfirm instance is an object');
        assert.equal(typeof modal.getDom(), 'object', 'The dialogConfirm instance gets a DOM element');
        assert.ok(!!modal.getDom().length, 'The dialogConfirm instance gets a DOM element');
        assert.equal(modal.getDom().parent().length, 1, 'The dialogConfirm box is rendered by default');
        assert.equal(
            modal.getDom().find('.message').text(),
            data.message,
            'The dialogConfirm box displays the message'
        );

        assert.equal(modal.getDom().find('button').length, 3, 'The dialogConfirm box displays 2 buttons');
        assert.equal(
            modal.getDom().find('button[data-control="ok"]').length,
            1,
            "The dialogConfirm box displays a 'ok' button"
        );
        assert.equal(
            modal.getDom().find('button[data-control="cancel"]').length,
            1,
            "The dialogConfirm box displays a 'cancel' button"
        );

        if (data.options && data.options.buttons) {
            assert.equal(
                modal.getDom().find('button[data-control="ok"] .label').text(),
                data.options.buttons.labels.ok,
                'The dialogConfirm box displays correct label'
            );
            assert.equal(
                modal.getDom().find('button[data-control="cancel"] .label').text(),
                data.options.buttons.labels.cancel,
                'The dialogConfirm box displays correct label'
            );
        }

        modal.getDom().find(`button[data-control="${data.button}"]`).click();
    });
});
