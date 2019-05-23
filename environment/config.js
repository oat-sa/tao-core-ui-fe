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
        // json: '/node_modules/requirejs-plugins/src/json',
        // async: '/node_modules/requirejs-plugins/src/async',
        // text: '/node_modules/text/text',

        'qunit-parameterize': '/environment/qunit2-parameterize',
        qunit: '/node_modules/qunit/qunit',
        'test/ui': '/test',

        'jquery.autocomplete': '/node_modules/jquery-autocomplete/jquery.autocomplete',

        'lib/popper/tooltip': '/node_modules/tooltip.js/dist/umd/tooltip',
        popper: '/node_modules/popper.js/dist/umd/popper',
        lib: '/lib',

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
        }
    },
    waitSeconds: 15
});

define('qunitLibs', ['qunit/qunit', 'css!qunit/qunit.css']);
define('qunitEnv', ['qunitLibs', 'qunit-parameterize'], function() {
    requirejs.config({nodeIdCompat: true});
});

define('context', ['module'], function(module) {
    return module.config();
});

define('i18n', [], () => text => text);
