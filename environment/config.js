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

requirejs.config({
    baseUrl: '/',
    paths: {
        css: '/node_modules/require-css/css',
        json: '/node_modules/requirejs-plugins/src/json',
        text: '/node_modules/text/text',
        tpl: '/lib/tpl',

        'qunit-parameterize': '/environment/qunit2-parameterize',
        qunit: '/node_modules/qunit/qunit',
        'test/ui': '/test',

        'jquery.autocomplete': '/node_modules/devbridge-autocomplete/dist/jquery.autocomplete',
        'jquery.mockjax': '/node_modules/jquery-mockjax/dist/jquery.mockjax',
        'jquery.fileDownload': '/lib/jquery.fileDownload',

        'lib/popper/tooltip': '/node_modules/tooltip.js/dist/umd/tooltip',
        popper: '/node_modules/popper.js/dist/umd/popper',
        select2: '/node_modules/select2/select2',
        interact: '/node_modules/interactjs/dist/interact',
        'lib/dompurify/purify': '/node_modules/dompurify/dist/purify',
        'lib/gamp/gamp': '/node_modules/gamp/src/gamp',
        'lib/flatpickr': '/node_modules/flatpickr/dist',
        'lib/moo/moo': '/node_modules/moo/moo',
        'lib/decimal/decimal': '/node_modules/decimal.js/decimal',
        'lib/expr-eval/expr-eval': '/node_modules/@oat-sa/expr-eval/dist/bundle',
        iframeNotifier: '/lib/iframeNotifier',
        async: '/node_modules/async/lib/async',
        nouislider: '/lib/sliders/jquery.nouislider',
        helpers: '/lib/helpers',
        lib: '/lib',
        layout: '/layout',

        taoCss: '/css',

        'ui/tooltip/default': '/src/tooltip/default',

        core: '/node_modules/@oat-sa/tao-core-sdk/dist/core',
        util: '/node_modules/@oat-sa/tao-core-sdk/dist/util',
        ui: '/dist',

        jquery: '/node_modules/@oat-sa/tao-core-libs/dist/jquery',
        lodash: '/node_modules/@oat-sa/tao-core-libs/dist/lodash',
        moment: '/node_modules/@oat-sa/tao-core-libs/dist/moment',
        handlebars: '/node_modules/@oat-sa/tao-core-libs/dist/handlebars'
    },
    shim: {
        'qunit-parameterize': {
            deps: ['qunit/qunit']
        },
        'lib/flatpickr/l10n/index': {
            deps: ['lib/flatpickr/flatpickr']
        }
    },
    waitSeconds: 15
});

define('qunitLibs', ['qunit/qunit', 'css!qunit/qunit.css']);
define('qunitEnv', ['qunitLibs', 'qunit-parameterize'], function() {
    requirejs.config({ nodeIdCompat: true });
});

define('context', ['module'], function(module) {
    return module.config();
});

define('i18n', [], () => text => text);
