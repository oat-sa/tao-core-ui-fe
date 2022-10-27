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
define(['ui/mediaplayer/youtubeManager'], function (youtubeManager) {
    'use strict';

    const youtubeApi = 'https://www.youtube.com/iframe_api';
    const requireOrigin = window.require;

    let requireDelay = 50;
    let playerDelay = 10;

    function Player(elem, config) {
        if (elem && config) {
            elem.setAttribute('data-rendered', config.videoId);
        }
        if (config && config.events) {
            if ('function' === typeof config.events.onReady) {
                window.setTimeout(() => config.events.onReady({ config }), playerDelay);
            }
        }
    }

    function requireMock(dependencies, callback) {
        if (Array.isArray(dependencies) && dependencies.includes(youtubeApi)) {
            window.YT = { Player };
            return setTimeout(callback, requireDelay);
        }
        requireOrigin(dependencies, callback);
    }

    QUnit.module('youtubeManager', {
        beforeEach() {
            window.require = requireMock;
        },
        afterEach() {
            window.require = requireOrigin;
            window.YT = void 0;
        }
    });

    QUnit.test('module', assert => {
        assert.expect(3);
        assert.equal(typeof youtubeManager, 'function', 'The youtubeManager module exposes a function');
        assert.equal(typeof youtubeManager(), 'object', 'The youtubeManager factory produces an object');
        assert.notStrictEqual(
            youtubeManager(),
            youtubeManager(),
            'The youtubeManager factory provides a different object on each call'
        );
    });

    QUnit.cases
        .init([{ title: 'add' }, { title: 'remove' }, { title: 'extractYoutubeId' }])
        .test('API ', (data, assert) => {
            assert.expect(1);
            const instance = youtubeManager();
            assert.equal(
                typeof instance[data.title],
                'function',
                `The youtubeManager instance exposes a "${data.title}" function`
            );
        });

    QUnit.cases
        .init([
            {
                title: 'with controls',
                config: {
                    controls: true
                },
                fixture: 'player-1',
                videoId: 'WX7YQ',
                height: '360',
                width: '640',
                playerVars: {
                    autoplay: 0,
                    controls: 1,
                    rel: 0,
                    showinfo: 0,
                    wmode: 'transparent',
                    modestbranding: 1,
                    disablekb: 1,
                    playsinline: 1,
                    enablejsapi: 1,
                    origin: location.hostname
                }
            },
            {
                title: 'without controls',
                config: {
                    controls: false
                },
                fixture: 'player-1',
                videoId: 'H56DZO',
                height: '360',
                width: '640',
                playerVars: {
                    autoplay: 0,
                    controls: 0,
                    rel: 0,
                    showinfo: 0,
                    wmode: 'transparent',
                    modestbranding: 1,
                    disablekb: 1,
                    playsinline: 1,
                    enablejsapi: 1,
                    origin: location.hostname
                }
            }
        ])
        .test('add ', (data, assert) => {
            assert.expect(8);
            const ready = assert.async();
            const instance = youtubeManager();
            const fixture = document.getElementById(data.fixture);
            const player = {
                onReady(e) {
                    assert.ok(true, 'The player is ready');
                    assert.strictEqual(
                        fixture.getAttribute('data-rendered'),
                        data.videoId,
                        'The player has been rendered'
                    );
                    assert.strictEqual(typeof e, 'object', 'The event object is supplied');
                    assert.strictEqual(typeof e.config, 'object', 'The player config is supplied (test mock)');
                    assert.strictEqual(e.config.height, data.height, 'The player was created with the expected height');
                    assert.strictEqual(e.config.width, data.width, 'The player was created with the expected width');
                    assert.strictEqual(
                        e.config.videoId,
                        data.videoId,
                        'The player was created with the expected videoId'
                    );
                    assert.deepEqual(
                        e.config.playerVars,
                        data.playerVars,
                        'The player was created with the expected config'
                    );
                    ready();
                }
            };

            fixture.setAttribute('data-video-id', data.videoId);
            instance.add(fixture, player, data.config);
        });

    QUnit.test('add multiple', assert => {
        assert.expect(15);
        const ready = assert.async();
        const instance = youtubeManager();
        const players = [
            {
                fixture: 'player-1',
                videoId: 'WX7YQ'
            },
            {
                fixture: 'player-2',
                videoId: 'CV96Q'
            },
            {
                fixture: 'player-3',
                videoId: 'P0XN3'
            }
        ];

        requireDelay = 100;
        Promise.all(
            players.map(
                data =>
                    new Promise(resolve => {
                        const fixture = document.getElementById(data.fixture);
                        const player = {
                            onReady(e) {
                                assert.ok(true, 'The player is ready');
                                assert.strictEqual(
                                    fixture.getAttribute('data-rendered'),
                                    data.videoId,
                                    'The player has been rendered'
                                );
                                assert.strictEqual(typeof e, 'object', 'The event object is supplied');
                                assert.strictEqual(
                                    typeof e.config,
                                    'object',
                                    'The player config is supplied (test mock)'
                                );
                                assert.strictEqual(
                                    e.config.videoId,
                                    data.videoId,
                                    'The player was created with the expected videoId'
                                );
                                resolve();
                            }
                        };

                        fixture.setAttribute('data-video-id', data.videoId);
                        instance.add(fixture, player);
                    })
            )
        )
            .catch(err => assert.ok(false, err.message))
            .then(ready);
    });

    QUnit.test('remove', assert => {
        assert.expect(6);
        const ready = assert.async();
        const instance = youtubeManager();
        const players = [
            {
                fixture: 'player-1',
                videoId: 'WX7YQ'
            },
            {
                fixture: 'player-2',
                videoId: 'CV96Q'
            },
            {
                fixture: 'player-3',
                videoId: 'P0XN3'
            }
        ];

        requireDelay = 100;
        Promise.all(
            players.map(
                data =>
                    new Promise((resolve, reject) => {
                        const fixture = document.getElementById(data.fixture);
                        const timeout = setTimeout(() => {
                            assert.ok(true, 'The player should have been removed');
                            assert.strictEqual(
                                fixture.getAttribute('data-rendered'),
                                null,
                                'The player has not been rendered'
                            );
                            resolve();
                        }, 300);

                        const player = {
                            onReady() {
                                clearTimeout(timeout);
                                assert.ok(false, 'The player should be removed');
                                assert.strictEqual(
                                    fixture.getAttribute('data-rendered'),
                                    null,
                                    'The player should not be rendered'
                                );
                                reject();
                            }
                        };

                        fixture.setAttribute('data-video-id', data.videoId);
                        instance.add(fixture, player);

                        setTimeout(() => {
                            instance.remove(fixture, player);
                        }, 50);
                    })
            )
        )
            .catch(err => assert.ok(false, err.message))
            .then(ready);
    });

    QUnit.cases
        .init([
            { title: 'already id', url: 'YJWSVUPSQqw', expected: 'YJWSVUPSQqw' },
            { title: 'long url', url: 'https//www.youtube.com/watch?v=YJWSVUPSQqw', expected: 'YJWSVUPSQqw' },
            { title: 'short url', url: 'https//youtu.be/watch?v=YJWSVUPSQqw', expected: 'YJWSVUPSQqw' }
        ])
        .test('extractYoutubeId ', (data, assert) => {
            assert.expect(1);
            const instance = youtubeManager();
            assert.equal(
                instance.extractYoutubeId(data.url),
                data.expected,
                'extractYoutubeId returned the expected id'
            );
        });
});
