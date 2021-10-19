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
define(['ui/mediaplayer/utils/timeObserver'], function (timeObserverFactory) {
    'use strict';

    QUnit.module('timeObserver');

    QUnit.test('module', assert => {
        assert.equal(typeof timeObserverFactory, 'function', 'The timeObserver module exposes a function');
        assert.equal(typeof timeObserverFactory(), 'object', 'The timeObserver factory produces an object');
        assert.notStrictEqual(
            timeObserverFactory(),
            timeObserverFactory(),
            'The timeObserver factory provides a different object on each call'
        );
    });

    QUnit.cases
        .init([
            { title: 'init' },
            { title: 'update' },
            { title: 'seek' }
        ])
        .test('API ', (data, assert) => {
            const instance = timeObserverFactory();
            assert.equal(
                typeof instance[data.title],
                'function',
                `The timeObserver instance exposes a "${data.title}" function`
            );
        });

    QUnit.test('Default values', assert => {
        const timeObserver = timeObserverFactory();
        assert.equal(timeObserver.position, 0, 'position is default value');
        assert.equal(timeObserver.duration, 0, 'duration is default value');
    });

    QUnit.test('Init values', assert => {
        const timeObserver = timeObserverFactory();
        timeObserver.init(7, 11);

        assert.equal(timeObserver.position, 7, 'position is init value');
        assert.equal(timeObserver.duration, 11, 'duration is init value');
    });

    QUnit.test('Update position value - seeking forward works', assert => {
        assert.expect(2);

        const timeObserver = timeObserverFactory();
        timeObserver.init(7, 11);

        timeObserver.on('irregularity', function() {
            assert.ok(false, 'Should not report time irregularity!');
        });

        // +1 sec
        timeObserver.update(8);
        assert.equal(timeObserver.position, 8, 'position is updated');
        assert.equal(timeObserver.duration, 11, 'duration is unchanged');
    });

    QUnit.test('Update position value - seeking backward works', assert => {
        assert.expect(2);

        const timeObserver = timeObserverFactory();
        timeObserver.init(7, 11);

        timeObserver.on('irregularity', function() {
            assert.ok(false, 'Should not report time irregularity!');
        });

        // -1 sec
        timeObserver.update(6);
        assert.equal(timeObserver.position, 6, 'position is updated');
        assert.equal(timeObserver.duration, 11, 'duration is unchanged');
    });

    QUnit.test('Update position value - seeking forward & exceeding interval', assert => {
        const done = assert.async();

        const timeObserver = timeObserverFactory();
        timeObserver.init(7, 11);

        timeObserver.after('irregularity', function() {
            assert.ok(true, 'fires irregularity');
            assert.equal(timeObserver.position, 9, 'position is updated');
            done();
        });

        // +2 sec
        timeObserver.update(9);
    });

    QUnit.test('Update position value - seeking forward & exceeding non-default interval', assert => {
        const done = assert.async();

        const interval = 2;
        const timeObserver = timeObserverFactory(interval);
        timeObserver.init(7, 11);

        timeObserver.after('irregularity', function() {
            assert.ok(true, 'fires irregularity');
            assert.equal(timeObserver.position, 10, 'position is updated');
            done();
        });

        // +3 sec
        timeObserver.update(10);
    });

    QUnit.test('Set seek value & update', assert => {
        const done = assert.async();

        const timeObserver = timeObserverFactory();
        timeObserver.init(7, 11);

        timeObserver.seek(5);
        assert.equal(timeObserver.position, 5, 'position is updated by seek');

        timeObserver.after('irregularity', function() {
            assert.ok(true, 'fires irregularity');
            assert.equal(timeObserver.position, 7, 'position is updated');
            done();
        });

        // +2 sec
        timeObserver.update(7);
    });

    QUnit.test('Chaining', assert => {
        const timeObserver = timeObserverFactory();
        timeObserver
            .init(7, 11)
            .seek(8)
            .update(9)
            .seek(10);
        assert.ok(true, 'No error thrown => timeObserver methods are chainable');
    });
});
