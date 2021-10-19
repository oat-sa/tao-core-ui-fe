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
 * Copyright (c) 2021 (original work) Open Assessment Technologies SA ;
 */
define(['ui/mediaplayer/utils/reminder'], function (reminderManagerFactory) {
    'use strict';

    let performanceNow;

    QUnit.module('reminderManager', {
        beforeEach: function() {
            performanceNow = performance.now;
        },
        afterEach: function() {
            performance.now = performanceNow;
        }
    });

    QUnit.test('module', assert => {
        assert.equal(typeof reminderManagerFactory, 'function', 'The reminderManager module exposes a function');
        assert.equal(typeof reminderManagerFactory(), 'object', 'The reminderManager factory produces an object');
        assert.notStrictEqual(
            reminderManagerFactory(),
            reminderManagerFactory(),
            'The reminderManager factory provides a different object on each call'
        );
    });

    QUnit.cases
        .init([
            { title: 'start' },
            { title: 'stop' },
            { title: 'remind' },
            { title: 'forget' }
        ])
        .test('API ', (data, assert) => {
            const instance = reminderManagerFactory();
            assert.equal(
                typeof instance[data.title],
                'function',
                `The reminderManager instance exposes a "${data.title}" function`
            );
        });

    QUnit.test('Default values', assert => {
        const reminderManager = reminderManagerFactory();
        performance.now = () => 1234;
        assert.equal(reminderManager.running, false, 'reminderManager is stopped');
        assert.equal(reminderManager.elapsed, 0, 'reminderManager reports zero elapsed time');
    });

    QUnit.test('Start & stop', assert => {
        const reminderManager = reminderManagerFactory();

        performance.now = () => 1234;
        reminderManager.start();
        performance.now = () => 1334;
        assert.equal(reminderManager.running, true, 'reminderManager is running');
        assert.equal(reminderManager.elapsed, 100, 'reminderManager calculates correct elapsed time');

        reminderManager.stop();
        assert.equal(reminderManager.running, false, 'reminderManager is stopped');
        assert.equal(reminderManager.elapsed, 0, 'reminderManager reports zero elapsed time');
    });

    QUnit.test('Add 1 reminder', assert => {
        const done = assert.async();

        const reminderManager = reminderManagerFactory();

        let timeoutPassed = false;

        const cb = () => {
            assert.ok(timeoutPassed, 'Callback was called after expected time')
            reminderManager.stop();
            assert.equal(reminderManager.running, false, 'reminderManager is stopped');
            done();
        };

        reminderManager.remind(cb, 20); // 20ms
        reminderManager.start();
        setTimeout(() => timeoutPassed = true, 19);
    });

    // TODO: remind multiple

    // TODO: forget named

    // TODO: forget all

    QUnit.test('Chaining', assert => {
        const cb = () => {};
        const reminderManager = reminderManagerFactory();
        reminderManager
            .stop()
            .start()
            .remind(cb, 10)
            .forget(cb)
            .stop();
        assert.ok(true, 'No error thrown => reminderManager methods are chainable');
    });
});
