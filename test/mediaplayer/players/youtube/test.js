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
define([
    'jquery',
    'ui/mediaplayer/players/youtube',
    'ui/mediaplayer/youtubeManager',
    'ui/mediaplayer/support'
], function ($, playerFactory, youtubeManagerFactory, support) {
    'use strict';

    QUnit.module('youtube player', {
        afterEach() {
            support.reset();
        }
    });

    QUnit.test('module', assert => {
        assert.expect(3);
        const $container = $('#qunit-fixture');
        const config = {};
        assert.equal(typeof playerFactory, 'function', 'The youtube module exposes a factory function');
        assert.equal(
            typeof playerFactory($container, config),
            'object',
            'The youtubePlayer factory produces an object'
        );
        assert.notStrictEqual(
            playerFactory($container, config),
            playerFactory($container, config),
            'The youtubePlayer factory provides a different object on each call'
        );
    });

    QUnit.cases
        .init([
            { title: 'init' },
            { title: 'destroy' },
            { title: 'getMedia' },
            { title: 'getPosition' },
            { title: 'getDuration' },
            { title: 'getVolume' },
            { title: 'setVolume' },
            { title: 'setSize' },
            { title: 'seek' },
            { title: 'play' },
            { title: 'pause' },
            { title: 'stop' },
            { title: 'mute' },
            { title: 'isMuted' },
            { title: 'addMedia' },
            { title: 'setMedia' },
            { title: 'onReady' },
            { title: 'onStateChange' },
            { title: 'stopPolling' },
            { title: 'startPolling' }
        ])
        .test('API ', (data, assert) => {
            assert.expect(1);
            const $container = $('#qunit-fixture');
            const config = {};
            const player = playerFactory($container, config);
            assert.equal(
                typeof player[data.title],
                'function',
                `The youtubePlayer instance exposes a "${data.title}" function`
            );
        });

    QUnit.cases
        .init([
            { title: 'can control', control: true, expectedControl: false },
            { title: 'cannot control', control: false, expectedControl: true }
        ])
        .test('init ', (data, assert) => {
            assert.expect(7);
            const ready = assert.async();
            const $container = $('#qunit-fixture');
            const videoId = 'YJWSVUPSQqw';
            const videoSrc = `https://www.youtube.com/watch?v=${videoId}`;
            const config = { sources: [{ src: videoSrc }] };
            support.setControl(data.control);
            const player = playerFactory($container, config);

            assert.equal($container.children().length, 0, 'The container is empty');
            player.on('ready', () => {
                const $media = $container.find('.media');
                assert.equal($media.length, 1, 'The player has been rendered');
                assert.equal(
                    $media.attr('data-video-src'),
                    videoSrc,
                    'The player has been set with the right video source'
                );
                assert.equal($media.attr('data-video-id'), videoId, 'The player has been set with the right video id');
                assert.equal($media.attr('data-type'), 'youtube', 'The player has been set with the right type');
                assert.equal(
                    $media.attr('data-option-controls'),
                    `${data.expectedControl}`,
                    'The player has been set with the controls option'
                );

                ready();
            });

            assert.ok(player.init(), 'The initialisation completed well');
        });

    QUnit.test('init with multiple sources', assert => {
        assert.expect(5);
        const ready = assert.async();
        const $container = $('#qunit-fixture');
        const videoId1 = 'YJWSVUPSQqw';
        const videoId2 = 'YUHRY27pg8g';
        const videoId3 = 'XGW5P90UnEf';
        const videoSrc1 = `https://www.youtube.com/watch?v=${videoId1}`;
        const videoSrc2 = `https://www.youtube.com/watch?v=${videoId2}`;
        const videoSrc3 = `https://www.youtube.com/watch?v=${videoId3}`;
        const config = {
            sources: [{ src: videoSrc1 }, { src: videoSrc2 }, { src: videoSrc3 }]
        };
        const player = playerFactory($container, config);

        assert.equal($container.children().length, 0, 'The container is empty');
        player
            .on('ready', () => {
                const $media = $container.find('.media');
                assert.equal($media.length, 1, 'The player has been rendered');
                assert.equal(
                    $media.attr('data-video-src'),
                    videoSrc1,
                    'The player has been set with the right video source'
                );
                assert.equal($media.attr('data-video-id'), videoId1, 'The player has been set with the right video id');
                assert.equal(
                    $media.attr('data-video-list'),
                    `${videoId2},${videoId3}`,
                    'The player has been set with the right video list'
                );

                ready();
            })
            .init();
    });

    QUnit.test('destroy', assert => {
        assert.expect(3);
        const ready = assert.async();
        const $container = $('#qunit-fixture');
        const videoId = 'YJWSVUPSQqw';
        const videoSrc = `https://www.youtube.com/watch?v=${videoId}`;
        const config = { sources: [{ src: videoSrc }] };
        const player = playerFactory($container, config);

        assert.equal($container.children().length, 0, 'The container is empty');
        player
            .on('ready', () => {
                assert.equal($container.find('.media').length, 1, 'The player has been rendered');

                player.destroy();

                assert.equal($container.find('.media').length, 0, 'The player has been removed');

                ready();
            })
            .init();
    });

    QUnit.test('getMedia', assert => {
        assert.expect(4);
        const ready = assert.async();
        const $container = $('#qunit-fixture');
        const videoId = 'YJWSVUPSQqw';
        const videoSrc = `https://www.youtube.com/watch?v=${videoId}`;
        const config = { sources: [{ src: videoSrc }] };
        const player = playerFactory($container, config);

        assert.equal(typeof player.getMedia(), 'undefined', 'There is no media yet');
        player
            .on('ready', () => {
                assert.equal(typeof player.getMedia(), 'object', 'The media is available');
                assert.equal(typeof player.getMedia().playVideo, 'function', 'The media has the expected api');

                player.destroy();

                assert.equal(typeof player.getMedia(), 'undefined', 'The media has been removed');

                ready();
            })
            .init();
    });

    QUnit.test('getPosition', assert => {
        assert.expect(4);
        const ready = assert.async();
        const $container = $('#qunit-fixture');
        const videoId = 'YJWSVUPSQqw';
        const videoSrc = `https://www.youtube.com/watch?v=${videoId}`;
        const config = { sources: [{ src: videoSrc }] };
        const player = playerFactory($container, config);

        assert.strictEqual(player.getPosition(), 0, 'Initial position set even if no media is there yet');
        player
            .on('ready', () => {
                const media = player.getMedia();
                assert.strictEqual(player.getPosition(), 0, 'Initial position set');

                media.position = 42;
                assert.strictEqual(player.getPosition(), 42, 'Position changed');

                player.destroy();

                assert.strictEqual(player.getPosition(), 0, 'Initial position reset after destroy');

                ready();
            })
            .init();
    });

    QUnit.test('getDuration', assert => {
        assert.expect(4);
        const ready = assert.async();
        const $container = $('#qunit-fixture');
        const videoId = 'YJWSVUPSQqw';
        const videoSrc = `https://www.youtube.com/watch?v=${videoId}`;
        const config = { sources: [{ src: videoSrc }] };
        const player = playerFactory($container, config);

        assert.strictEqual(player.getDuration(), 0, 'Initial duration set even if no media is there yet');
        player
            .on('ready', () => {
                const media = player.getMedia();
                assert.strictEqual(player.getDuration(), 100, 'Initial duration set');

                media.duration = 128;
                assert.strictEqual(player.getDuration(), 128, 'Duration changed');

                player.destroy();

                assert.strictEqual(player.getDuration(), 0, 'Initial duration reset after destroy');

                ready();
            })
            .init();
    });

    QUnit.test('getVolume/setVolume', assert => {
        assert.expect(6);
        const ready = assert.async();
        const $container = $('#qunit-fixture');
        const videoId = 'YJWSVUPSQqw';
        const videoSrc = `https://www.youtube.com/watch?v=${videoId}`;
        const config = { sources: [{ src: videoSrc }] };
        const player = playerFactory($container, config);

        assert.strictEqual(player.getVolume(), 0, 'Initial volume set even if no media is there yet');
        player.setVolume(55);
        assert.strictEqual(player.getVolume(), 0, 'Cannot change the volume if no media is there yet');
        player
            .on('ready', () => {
                const media = player.getMedia();
                assert.strictEqual(player.getVolume(), 100, 'Initial volume set');

                player.setVolume(33);
                assert.strictEqual(media.getVolume(), 33, 'Volume changed on the media');
                assert.strictEqual(player.getVolume(), 33, 'Volume changed on the player');

                player.destroy();

                assert.strictEqual(player.getVolume(), 0, 'Initial volume reset after destroy');

                ready();
            })
            .init();
    });

    QUnit.test('setSize', assert => {
        assert.expect(4);
        const ready = assert.async();
        const $container = $('#qunit-fixture');
        const videoId = 'YJWSVUPSQqw';
        const videoSrc = `https://www.youtube.com/watch?v=${videoId}`;
        const expectedWidth = 128;
        const expectedHeight = 64;
        const config = { sources: [{ src: videoSrc }] };
        const player = playerFactory($container, config);

        player.on('resize.test', (width, height) => {
            assert.strictEqual(width, expectedWidth, 'The resize event has been triggered with the expected width');
            assert.strictEqual(height, expectedHeight, 'The resize event has been triggered with the expected height');
        });

        player.setSize(expectedWidth, expectedHeight);

        player
            .on('ready', () => {
                ready();
            })
            .init();
    });

    QUnit.test('seek', assert => {
        assert.expect(8);
        const ready = assert.async();
        const $container = $('#qunit-fixture');
        const videoId = 'YJWSVUPSQqw';
        const videoSrc = `https://www.youtube.com/watch?v=${videoId}`;
        const config = { sources: [{ src: videoSrc }], polling: 10 };
        const player = playerFactory($container, config);

        player
            .on('play', () => {
                assert.ok(false, 'The playback should not start');
            })
            .seek(10);

        assert.strictEqual(player.getPosition(), 0, 'The position should not have changed');

        setTimeout(() => {
            player
                .off('play')
                .on('timeupdate', () => {
                    assert.ok(true, 'The playback is ongoing');

                    player
                        .off('play')
                        .on('play', () => {
                            assert.ok(false, 'The playback should not start');
                        })
                        .pause();
                })
                .on('play', () => {
                    assert.ok(true, 'The playback has started');
                })
                .on('pause', () => {
                    assert.ok(true, 'The playback is paused');

                    player.seek(30);

                    assert.strictEqual(player.getPosition(), 30, 'Position changed again');

                    setTimeout(() => player.stop(), 100);
                })
                .on('end', () => {
                    assert.ok(true, 'The playback has stopped');
                    player.destroy();
                    ready();
                })
                .on('ready', () => {
                    assert.strictEqual(player.getPosition(), 0, 'Initial position set');

                    player.seek(10);

                    assert.strictEqual(player.getPosition(), 10, 'Position changed');
                })
                .init();
        }, 50);
    });

    QUnit.test('play/stop', assert => {
        assert.expect(3);
        const ready = assert.async();
        const $container = $('#qunit-fixture');
        const videoId = 'YJWSVUPSQqw';
        const videoSrc = `https://www.youtube.com/watch?v=${videoId}`;
        const config = { sources: [{ src: videoSrc }], polling: 10 };
        const player = playerFactory($container, config);

        player
            .on('play', () => {
                assert.ok(false, 'The playback should not start');
            })
            .play();

        setTimeout(() => {
            player
                .off('play')
                .on('timeupdate', () => {
                    assert.ok(true, 'The playback is ongoing');
                    player.stop();
                })
                .on('play', () => {
                    assert.ok(true, 'The playback has started');
                })
                .on('end', () => {
                    assert.ok(true, 'The playback has stopped');
                    player.destroy();
                    ready();
                })
                .on('ready', () => {
                    player.play();
                })
                .init();
        }, 50);
    });

    QUnit.test('play/pause', assert => {
        assert.expect(3);
        const ready = assert.async();
        const $container = $('#qunit-fixture');
        const videoId = 'YJWSVUPSQqw';
        const videoSrc = `https://www.youtube.com/watch?v=${videoId}`;
        const config = { sources: [{ src: videoSrc }], polling: 10 };
        const player = playerFactory($container, config);

        player
            .on('play', () => {
                assert.ok(false, 'The playback should not start');
            })
            .play();

        setTimeout(() => {
            player
                .off('play')
                .on('timeupdate', () => {
                    assert.ok(true, 'The playback is ongoing');
                    player.pause();
                })
                .on('play', () => {
                    assert.ok(true, 'The playback has started');
                })
                .on('pause', () => {
                    assert.ok(true, 'The playback has stopped');
                    player.destroy();
                    ready();
                })
                .on('ready', () => {
                    player.play();
                })
                .init();
        }, 50);
    });

    QUnit.test('mute', assert => {
        assert.expect(6);
        const ready = assert.async();
        const $container = $('#qunit-fixture');
        const videoId = 'YJWSVUPSQqw';
        const videoSrc = `https://www.youtube.com/watch?v=${videoId}`;
        const config = { sources: [{ src: videoSrc }] };
        const player = playerFactory($container, config);

        assert.strictEqual(player.isMuted(), false, 'Initial mute state set even if no media is there yet');
        player.mute(true);
        assert.strictEqual(player.isMuted(), false, 'Cannot change the mute state if no media is there yet');
        player
            .on('ready', () => {
                assert.strictEqual(player.isMuted(), false, 'Initial mute state set');

                player.mute(true);
                assert.strictEqual(player.isMuted(), true, 'Muted');

                player.mute(false);
                assert.strictEqual(player.isMuted(), false, 'unMuted');

                player.mute(true);
                player.destroy();

                assert.strictEqual(player.isMuted(), false, 'Initial mute state reset after destroy');

                ready();
            })
            .init();
    });

    QUnit.test('addMedia', assert => {
        assert.expect(4);
        const ready = assert.async();
        const $container = $('#qunit-fixture');
        const videoId1 = 'YJWSVUPSQqw';
        const videoId2 = 'YUHRY27pg8g';
        const videoId3 = 'XGW5P90UnEf';
        const videoSrc1 = `https://www.youtube.com/watch?v=${videoId1}`;
        const videoSrc2 = `https://www.youtube.com/watch?v=${videoId2}`;
        const videoSrc3 = `https://www.youtube.com/watch?v=${videoId3}`;
        const config = { sources: [{ src: videoSrc1 }] };
        const player = playerFactory($container, config);

        player.addMedia(videoSrc2);
        player
            .on('ready', () => {
                const $media = $container.find('.media');
                assert.equal($media.length, 1, 'The player has been rendered');
                assert.equal($media.attr('data-video-id'), videoId1, 'The player has been set with the right video id');
                assert.equal(
                    $media.attr('data-video-list'),
                    videoId2,
                    'The player has been set with the initial video list'
                );

                player.addMedia(videoSrc3);

                assert.equal(
                    $media.attr('data-video-list'),
                    `${videoId2},${videoId3}`,
                    'The player has been set with the updated video list'
                );

                ready();
            })
            .init();
    });

    QUnit.test('setMedia', assert => {
        assert.expect(5);
        const ready = assert.async();
        const $container = $('#qunit-fixture');
        const videoId1 = 'YJWSVUPSQqw';
        const videoId2 = 'YUHRY27pg8g';
        const videoId3 = 'XGW5P90UnEf';
        const videoSrc1 = `https://www.youtube.com/watch?v=${videoId1}`;
        const videoSrc2 = `https://www.youtube.com/watch?v=${videoId2}`;
        const videoSrc3 = `https://www.youtube.com/watch?v=${videoId3}`;
        const config = { sources: [{ src: videoSrc1 }] };
        const player = playerFactory($container, config);

        player.setMedia(videoSrc2);
        player.addMedia(videoSrc3);
        player
            .on('ready', () => {
                const $media = $container.find('.media');
                assert.equal($media.length, 1, 'The player has been rendered');
                assert.equal($media.attr('data-video-id'), videoId2, 'The player has been set with the right video id');
                assert.equal(
                    $media.attr('data-video-list'),
                    videoId3,
                    'The player has been set with the initial video list'
                );

                player.setMedia(videoSrc3);

                assert.equal($media.attr('data-video-id'), videoId3, 'The player has been set with the new video id');
                assert.equal($media.attr('data-video-list'), '', 'The video list still did not change');

                ready();
            })
            .init();
    });
});
