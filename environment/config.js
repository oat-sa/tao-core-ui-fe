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
 * Copyright (c) 2019 (original work) Open Assessment Technologies SA ;
 */

define(['/node_modules/@oat-sa/tao-core-libs/dist/pathdefinition.js'], function(libPathDefinition) {
    requirejs.config({
        baseUrl: '/',
        paths: Object.assign(
            {},
            {
                css: '/node_modules/require-css/css',
                json: '/node_modules/requirejs-plugins/src/json',
                text: '/node_modules/text/text',

                /* TEST related */
                'qunit-parameterize': '/environment/qunit2-parameterize',
                qunit: '/node_modules/qunit/qunit',
                'test/ui': '/test',

                ui: '/dist',
                core: '/node_modules/@oat-sa/tao-core-sdk/dist/core',
                util: '/node_modules/@oat-sa/tao-core-sdk/dist/util',

                /* LIBS */
                'jquery.autocomplete': '/node_modules/devbridge-autocomplete/dist/jquery.autocomplete',
                'jquery.mockjax': '/node_modules/jquery-mockjax/dist/jquery.mockjax',
                'jquery.fileDownload': '/lib/jquery.fileDownload',
                'lib/flatpickr': '/node_modules/flatpickr/dist',
                'lib/moo/moo': '/node_modules/moo/moo',
                helpers: '/lib/helpers',
                /* LIBS END */

                basicStyle: '/css',

                'lib/simulator': '/node_modules/@oat-sa/tao-core-shared-libs/lib/simulator',

                'ui/tooltip/default': '/src/tooltip/default'
            },
            libPathDefinition
        ),
        shim: {
            'qunit-parameterize': {
                deps: ['qunit/qunit']
            },
            'lib/flatpickr/l10n/index': {
                deps: ['lib/flatpickr/flatpickr']
            },
            select2 : {
                deps: ['jquery']
            }
        },
        waitSeconds: 15
    });

    define('qunitLibs', ['qunit/qunit', 'css!qunit/qunit.css', 'css!basicStyle/basic.css']);
    define('qunitEnv', ['qunitLibs', 'qunit-parameterize'], function() {
        requirejs.config({ nodeIdCompat: true });
    });

    define('context', ['module'], function(module) {
        return module.config();
    });

    define('i18n', [], () => text => text);

    /**
     * Mock layout modules for tests
     */
    define('layout/loading-bar', [], () => ({
        start: () => {},
        stop: () => {}
    }));

    define('layout/logout-event', [], () => () => {});
});
