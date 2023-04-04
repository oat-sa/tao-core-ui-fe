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
 * Copyright (c) 2018-2023 Open Assessment Technologies SA ;
 */
define([
    'ui/maths/calculator/pluginsLoader',
    'ui/maths/calculator/plugins/core/degrad',
    'ui/maths/calculator/plugins/core/history',
    'ui/maths/calculator/plugins/core/remind',
    'ui/maths/calculator/plugins/core/stepNavigation',
    'test/ui/maths/calculator/pluginsLoader/plugin1',
    'test/ui/maths/calculator/pluginsLoader/plugin2'
], function (
    loadPlugins,
    pluginDegradFactory,
    pluginHistoryFactory,
    pluginRemindFactory,
    pluginStepNavigationFactory,
    plugin1,
    plugin2
) {
    'use strict';

    const defaultPlugins = [
        pluginDegradFactory,
        pluginHistoryFactory,
        pluginRemindFactory,
        pluginStepNavigationFactory
    ];

    QUnit.module('loader');

    QUnit.test('module', assert => {
        assert.expect(3);
        assert.equal(typeof loadPlugins, 'function', 'The module exposes a function');
        assert.ok(loadPlugins() instanceof Promise, 'The loader produces a promise');
        assert.notStrictEqual(loadPlugins(), loadPlugins(), 'The loader provides a different object on each call');
    });

    QUnit.test('default', assert => {
        const ready = assert.async();
        assert.expect(1);

        loadPlugins()
            .then(plugins => {
                assert.deepEqual(plugins, defaultPlugins, 'Default plugins are loaded');
                ready();
            })
            .catch(err => {
                //eslint-disable-next-line no-console
                console.error(err);
                assert.ok(false, 'Should not fail!');
                ready();
            });
    });

    QUnit.test('static plugins', assert => {
        const ready = assert.async();
        const loadedPlugins = [plugin1, plugin2];

        assert.expect(1);

        loadPlugins({
            test: loadedPlugins
        })
            .then(plugins => {
                assert.deepEqual(plugins, defaultPlugins.concat(loadedPlugins), 'All plugins are loaded');
                ready();
            })
            .catch(err => {
                //eslint-disable-next-line no-console
                console.error(err);
                assert.ok(false, 'Should not fail!');
                ready();
            });
    });

    QUnit.test('dynamic plugins', assert => {
        const ready = assert.async();
        const loadedPlugins = [plugin1, plugin2];

        assert.expect(1);

        loadPlugins(null, [
            {
                category: 'test',
                module: 'test/ui/maths/calculator/pluginsLoader/plugin1',
                bundle: 'test/ui/maths/calculator/pluginsLoader/bundle'
            },
            {
                category: 'test',
                module: 'test/ui/maths/calculator/pluginsLoader/plugin2',
                bundle: 'test/ui/maths/calculator/pluginsLoader/bundle'
            }
        ])
            .then(plugins => {
                assert.deepEqual(plugins, defaultPlugins.concat(loadedPlugins), 'All plugins are loaded');
                ready();
            })
            .catch(err => {
                //eslint-disable-next-line no-console
                console.error(err);
                assert.ok(false, 'Should not fail!');
                ready();
            });
    });
});
