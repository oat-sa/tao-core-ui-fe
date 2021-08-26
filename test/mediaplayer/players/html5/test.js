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
    'ui/mediaplayer/players/html5',
    'ui/mediaplayer/support',
    'util/urlParser',
    'test/mediaplayer/mocks/jqueryParseHtmlMock',
    'test/mediaplayer/mocks/mediaMock'
], function ($, playerFactory, support, UrlParser, parseHTMLMockFactory, mediaMock) {
    'use strict';

    const audioMP3 = { src: '../../samples/audio.mp3', type: 'audio/mp3' };
    const audioM4A = { src: '../../samples/audio.m4a', type: 'audio/m4a' };
    const videoWebM = { src: '../../samples/video.webm', type: 'video/webm' };
    const videoMP4 = { src: '../../samples/video.mp4', type: 'video/mp4' };
    const videoOGV = { src: '../../samples/video.ogv', type: 'video/ogg' };
    const posterURL = '../../samples/poster.png';

    const defaultVideoWidth = 320;
    const defaultVideoHeight = 200;
    const mediaConfig = {
        videoWidth: defaultVideoWidth,
        videoHeight: defaultVideoHeight
    };

    const mockElements = ['audio', 'video', 'source'];
    const reTagName = /(<\s*\/?\s*)(\w+)([^>]*>)/g;
    const parseHTMLFilter = data => {
        if ('string' === typeof data) {
            const parse = reTagName.exec(data);
            if (parse) {
                const tagName = parse[2];
                if (mockElements.includes(tagName)) {
                    return data.replace(reTagName, '$1div$3');
                }
            }
        }
        return data;
    };
    const parseHTMLMock = parseHTMLMockFactory(parseHTMLFilter);

    QUnit.module('players', {
        afterEach() {
            support.reset();
            UrlParser.reset();
            parseHTMLMock.reset();
        }
    });

    QUnit.test('module', assert => {
        assert.expect(3);
        const $container = $('#qunit-fixture');
        const config = {};
        assert.equal(typeof playerFactory, 'function', 'The html5 module exposes a factory function');
        assert.equal(typeof playerFactory($container, config), 'object', 'The html5Player factory produces an object');
        assert.notStrictEqual(
            playerFactory($container, config),
            playerFactory($container, config),
            'The html5Player factory provides a different object on each call'
        );
    });

    QUnit.cases
        .init([
            { title: 'init' },
            { title: 'destroy' },
            { title: 'getMedia' },
            { title: 'getMediaSize' },
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
            { title: 'setMedia' }
        ])
        .test('API ', (data, assert) => {
            assert.expect(1);
            const $container = $('#qunit-fixture');
            const config = {};
            const player = playerFactory($container, config);
            assert.equal(
                typeof player[data.title],
                'function',
                `The html5Player instance exposes a "${data.title}" function`
            );
        });

    QUnit.cases
        .init([
            {
                title: 'audio with no support',
                type: 'audio',
                support: false,
                preview: false,
                controls: false,
                cors: false,
                preload: 'none',
                sources: [audioMP3]
            },
            {
                title: 'audio with controls',
                type: 'audio',
                support: true,
                preview: false,
                controls: true,
                cors: false,
                preload: 'none',
                sources: [audioMP3]
            },
            {
                title: 'audio with crossorigin',
                type: 'audio',
                support: true,
                preview: false,
                controls: false,
                cors: true,
                preload: 'none',
                sources: [audioMP3]
            },
            {
                title: 'audio with no preview',
                type: 'audio',
                support: true,
                preview: false,
                controls: false,
                cors: false,
                preload: 'none',
                sources: [audioMP3]
            },
            {
                title: 'audio with link',
                type: 'audio',
                support: true,
                preview: false,
                controls: false,
                cors: false,
                preload: 'none',
                link: audioMP3.src,
                sources: [{ ...audioMP3, link: audioMP3.src }]
            },
            {
                title: 'audio with multiple sources',
                type: 'audio',
                support: true,
                preview: false,
                controls: false,
                cors: false,
                preload: 'none',
                sources: [audioMP3, audioM4A]
            },
            {
                title: 'video with no support',
                type: 'video',
                support: false,
                preview: false,
                controls: false,
                cors: false,
                preload: 'none',
                poster: '',
                sources: [videoWebM]
            },
            {
                title: 'video with controls',
                type: 'video',
                support: true,
                preview: false,
                controls: true,
                cors: false,
                preload: 'none',
                poster: '',
                sources: [videoWebM]
            },
            {
                title: 'video with crossorigin',
                type: 'video',
                support: true,
                preview: false,
                controls: false,
                cors: true,
                preload: 'none',
                poster: '',
                sources: [videoWebM]
            },
            {
                title: 'video with preview',
                type: 'video',
                support: true,
                preview: true,
                controls: false,
                cors: false,
                preload: 'metadata',
                poster: '',
                sources: [videoWebM]
            },
            {
                title: 'video with poster',
                type: 'video',
                support: true,
                preview: false,
                controls: false,
                cors: false,
                preload: 'none',
                poster: posterURL,
                sources: [{ ...videoWebM, poster: posterURL }]
            },
            {
                title: 'video with link',
                type: 'video',
                support: true,
                preview: false,
                controls: false,
                cors: false,
                preload: 'none',
                poster: '',
                link: videoWebM.src,
                sources: [{ ...videoWebM, link: videoWebM.src }]
            },
            {
                title: 'video with multiple sources',
                type: 'video',
                support: true,
                preview: false,
                controls: false,
                cors: false,
                preload: 'none',
                poster: '',
                sources: [videoWebM, videoMP4]
            }
        ])
        .test('render ', (data, assert) => {
            assert.expect(9 + 3 * data.sources.length * data.support);
            const $container = $('#qunit-fixture');
            const { type, sources, preview } = data;

            support.setControl(data.controls);
            support.setSupport(data.support);
            UrlParser.setSame(!data.cors);

            const player = playerFactory($container, { type, sources, preview });

            assert.equal($container.children().length, 0, 'The container is empty');
            assert.equal(player.init(), data.support, 'The initialisation completed as expected');

            const $media = $container.find('.media');
            const media = $media.get(0);
            assert.equal($media.length, 1, 'The player has been rendered');
            assert.equal(media.tagName, data.type.toUpperCase(), 'The player is using the right type');
            assert.equal(media.hasAttribute('controls'), !data.controls, 'The player has set the controls as expected');
            assert.equal(
                media.hasAttribute('crossorigin'),
                data.cors,
                'The player has set the crossorigin as expected'
            );
            assert.equal($media.attr('preload'), data.preload, 'The player has set the expected preload attribute');
            assert.equal($media.attr('poster'), data.poster, 'The player has set the poster attribute as expected');
            assert.equal($media.find('a').attr('href'), data.link, 'The player has set the link as expected');

            if (data.support) {
                data.sources.forEach((source, index) => {
                    const $source = $media.find(`source:eq(${index})`);
                    assert.equal($source.length, 1, `The source ${index} has been rendered`);
                    assert.equal(
                        $source.attr('src'),
                        source.src,
                        `The source ${index} has been set with the expected src`
                    );
                    assert.equal(
                        $source.attr('type'),
                        source.type,
                        `The source ${index} has been set with the expected type`
                    );
                });
            }
        });

    QUnit.cases
        .init([
            { title: 'audio', source: audioMP3 },
            { title: 'video', source: videoMP4 }
        ])
        .test('init ', (data, assert) => {
            assert.expect(4);
            const ready = assert.async();
            const $container = $('#qunit-fixture');
            const config = { sources: [data.source] };
            parseHTMLMock.install();
            const player = playerFactory($container, config);

            assert.equal($container.children().length, 0, 'The container is empty');
            player.on('ready', () => {
                assert.ok(true, 'The player is ready');
                ready();
            });

            assert.ok(player.init(), 'The initialisation completed well');
            const $media = $container.find('.media');
            assert.equal($media.length, 1, 'The player has been rendered');
            $media.trigger('canplay');
        });

    QUnit.cases
        .init([
            { title: 'audio', source: audioMP3 },
            { title: 'video', source: videoMP4 }
        ])
        .test('destroy ', (data, assert) => {
            assert.expect(6);
            const ready = assert.async();
            const $container = $('#qunit-fixture');
            const config = { sources: [data.source] };
            const duration = 100;
            const player = playerFactory($container, config);

            assert.equal($container.children().length, 0, 'The container is empty');

            parseHTMLMock.install();
            assert.ok(player.init(), 'The initialisation completed well');
            assert.equal($container.find('.media').length, 1, 'The player has been rendered');

            player.on('ready', () => {
                const media = player.getMedia();
                assert.ok(true, 'The player is ready');

                player.play();
                player.destroy();

                assert.equal(media.currentTime, duration, 'The player has been stopped');
                assert.equal($container.find('.media').length, 0, 'The player has been removed');

                ready();
            });

            const media = mediaMock(player.getMedia(), mediaConfig);
            media.currentTime = 0;
            media.duration = duration;
        });

    QUnit.test('getMedia', assert => {
        assert.expect(4);
        const ready = assert.async();
        const $container = $('#qunit-fixture');
        const config = { sources: [videoMP4], type: 'video' };
        const player = playerFactory($container, config);

        assert.equal(typeof player.getMedia(), 'undefined', 'There is no media yet');
        player
            .on('ready', () => {
                assert.equal(typeof player.getMedia(), 'object', 'The media is available');
                assert.strictEqual(
                    player.getMedia(),
                    $container.find('.media').get(0),
                    'The media is the rendered one'
                );

                player.destroy();

                assert.equal(typeof player.getMedia(), 'undefined', 'The media has been removed');

                ready();
            })
            .init();
    });

    QUnit.test('getMediaSize', assert => {
        assert.expect(3);
        const ready = assert.async();
        const $container = $('#qunit-fixture');
        const config = { sources: [videoMP4], type: 'video' };
        const player = playerFactory($container, config);

        assert.deepEqual(player.getMediaSize(), {}, 'Initial media size unknown');

        parseHTMLMock.install();
        player
            .on('ready', () => {
                assert.deepEqual(
                    player.getMediaSize(),
                    {
                        width: defaultVideoWidth,
                        height: defaultVideoHeight
                    },
                    'Initial media size set'
                );

                player.destroy();

                assert.strictEqual(player.getPosition(), 0, 'Initial position reset after destroy');

                ready();
            })
            .init();

        mediaMock(player.getMedia(), mediaConfig);
    });

    QUnit.test('getPosition', assert => {
        assert.expect(4);
        const ready = assert.async();
        const $container = $('#qunit-fixture');
        const config = { sources: [videoMP4], type: 'video' };
        const player = playerFactory($container, config);

        assert.strictEqual(player.getPosition(), 0, 'Initial position set even if no media is there yet');

        parseHTMLMock.install();
        player
            .on('ready', () => {
                const media = player.getMedia();
                assert.strictEqual(player.getPosition(), 0, 'Initial position set');

                media.currentTime = 42;
                assert.strictEqual(player.getPosition(), 42, 'Position changed');

                player.destroy();

                assert.strictEqual(player.getPosition(), 0, 'Initial position reset after destroy');

                ready();
            })
            .init();

        mediaMock(player.getMedia(), mediaConfig);
    });

    QUnit.test('getDuration', assert => {
        assert.expect(4);
        const ready = assert.async();
        const $container = $('#qunit-fixture');
        const config = { sources: [videoMP4], type: 'video' };
        const player = playerFactory($container, config);

        assert.strictEqual(player.getDuration(), 0, 'Initial duration set even if no media is there yet');

        parseHTMLMock.install();
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

        mediaMock(player.getMedia(), mediaConfig);
    });

    QUnit.test('getVolume/setVolume', assert => {
        assert.expect(6);
        const ready = assert.async();
        const $container = $('#qunit-fixture');
        const config = { sources: [videoMP4], type: 'video' };
        const player = playerFactory($container, config);

        assert.strictEqual(player.getVolume(), 0, 'Initial volume set even if no media is there yet');
        player.setVolume(55);
        assert.strictEqual(player.getVolume(), 0, 'Cannot change the volume if no media is there yet');

        parseHTMLMock.install();
        player
            .on('ready', () => {
                const media = player.getMedia();
                assert.strictEqual(player.getVolume(), 100, 'Initial volume set');

                player.setVolume(40);
                assert.strictEqual(media.volume, 0.4, 'Volume changed on the media');
                assert.strictEqual(player.getVolume(), 40, 'Volume changed on the player');

                player.destroy();

                assert.strictEqual(player.getVolume(), 0, 'Initial volume reset after destroy');

                ready();
            })
            .init();

        mediaMock(player.getMedia(), mediaConfig);
    });

    QUnit.test('setSize', assert => {
        assert.expect(2);
        const ready = assert.async();
        const $container = $('#qunit-fixture');
        const config = { sources: [videoMP4], type: 'video' };
        const expectedWidth = 128;
        const expectedHeight = 64;
        const player = playerFactory($container, config);

        player.on('resize.test', (width, height) => {
            assert.strictEqual(width, expectedWidth, 'The resize event has been triggered with the expected width');
            assert.strictEqual(height, expectedHeight, 'The resize event has been triggered with the expected height');
        });

        player.setSize(expectedWidth, expectedHeight);

        parseHTMLMock.install();
        player
            .on('ready', () => {
                ready();
            })
            .init();

        mediaMock(player.getMedia(), mediaConfig);
    });

    QUnit.test('seek', assert => {
        assert.expect(7);
        const ready = assert.async();
        const $container = $('#qunit-fixture');
        const config = { sources: [videoMP4], type: 'video' };
        const player = playerFactory($container, config);

        player
            .on('play', () => {
                assert.ok(false, 'The playback should not start');
            })
            .seek(10);

        assert.strictEqual(player.getPosition(), 0, 'The position should not have changed');

        setTimeout(() => {
            parseHTMLMock.install();

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
                    assert.ok(true, 'The playback is paused');

                    player.seek(30);

                    assert.strictEqual(player.getPosition(), 30, 'Position changed again');

                    player.destroy();
                    ready();
                })
                .on('ready', () => {
                    assert.strictEqual(player.getPosition(), 0, 'Initial position set');

                    player.seek(10);

                    assert.strictEqual(player.getPosition(), 10, 'Position changed');
                })
                .init();

            mediaMock(player.getMedia(), mediaConfig);
        }, 50);
    });

    QUnit.test('play/stop', assert => {
        assert.expect(3);
        const ready = assert.async();
        const $container = $('#qunit-fixture');
        const config = { sources: [videoMP4], type: 'video' };
        const player = playerFactory($container, config);

        player
            .on('play', () => {
                assert.ok(false, 'The playback should not start');
            })
            .play();

        setTimeout(() => {
            parseHTMLMock.install();

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

            mediaMock(player.getMedia(), mediaConfig);
        }, 50);
    });

    QUnit.test('play/pause', assert => {
        assert.expect(3);
        const ready = assert.async();
        const $container = $('#qunit-fixture');
        const config = { sources: [videoMP4], type: 'video' };
        const player = playerFactory($container, config);

        player
            .on('play', () => {
                assert.ok(false, 'The playback should not start');
            })
            .play();

        setTimeout(() => {
            parseHTMLMock.install();

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

            mediaMock(player.getMedia(), mediaConfig);
        }, 50);
    });

    QUnit.test('mute', assert => {
        assert.expect(6);
        const ready = assert.async();
        const $container = $('#qunit-fixture');
        const config = { sources: [videoMP4], type: 'video' };
        const player = playerFactory($container, config);

        parseHTMLMock.install();

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

        mediaMock(player.getMedia(), mediaConfig);
    });

    QUnit.test('addMedia', assert => {
        assert.expect(7);
        const ready = assert.async();
        const $container = $('#qunit-fixture');
        const config = { sources: [videoMP4], type: 'video' };
        const player = playerFactory($container, config);

        parseHTMLMock.install();

        player.addMedia(videoWebM.src, videoWebM.type);
        player
            .on('ready', () => {
                const $media = $container.find('.media');
                assert.equal($media.length, 1, 'The player has been rendered');
                assert.equal($media.find('source').length, 1, 'The player has added 1 source');
                assert.equal($media.find('source').attr('src'), videoMP4.src, 'The source has the expected URL');
                assert.equal($media.find('source').attr('type'), videoMP4.type, 'The source has the expected type');

                player.addMedia(videoOGV.src, videoOGV.type);
                player.addMedia('', videoMP4.type);

                assert.equal($media.find('source').length, 2, 'The player has added another source');
                assert.equal($media.find('source:eq(1)').attr('src'), videoOGV.src, 'The source has the expected URL');
                assert.equal(
                    $media.find('source:eq(1)').attr('type'),
                    videoOGV.type,
                    'The source has the expected type'
                );

                ready();
            })
            .init();

        mediaMock(player.getMedia(), mediaConfig);
    });

    QUnit.test('addMedia with no support', assert => {
        assert.expect(7);
        const ready = assert.async();
        const $container = $('#qunit-fixture');
        const config = { sources: [videoMP4], type: 'video' };
        const player = playerFactory($container, config);

        parseHTMLMock.install();

        player
            .on('ready', () => {
                const $media = $container.find('.media');
                assert.equal($media.length, 1, 'The player has been rendered');
                assert.equal($media.find('source').length, 1, 'The player has added 1 source');
                assert.equal($media.find('source').attr('src'), videoMP4.src, 'The source has the expected URL');
                assert.equal($media.find('source').attr('type'), videoMP4.type, 'The source has the expected type');

                support.setSupport(false);
                player.addMedia(videoOGV.src, videoOGV.type);

                assert.equal($media.find('source').length, 1, 'The player did not add another source');
                assert.equal($media.find('source').attr('src'), videoMP4.src, 'The source still has the expected URL');
                assert.equal(
                    $media.find('source').attr('type'),
                    videoMP4.type,
                    'The source still has the expected type'
                );

                ready();
            })
            .init();

        mediaMock(player.getMedia(), mediaConfig);
    });

    QUnit.test('setMedia', assert => {
        assert.expect(7);
        const ready = assert.async();
        const $container = $('#qunit-fixture');
        const config = { sources: [videoMP4], type: 'video' };
        const player = playerFactory($container, config);

        parseHTMLMock.install();

        player.addMedia(videoWebM.src, videoWebM.type);
        player
            .on('ready', () => {
                const $media = $container.find('.media');
                assert.equal($media.length, 1, 'The player has been rendered');
                assert.equal($media.find('source').length, 1, 'The player has added 1 source');
                assert.equal($media.find('source').attr('src'), videoMP4.src, 'The source has the expected URL');
                assert.equal($media.find('source').attr('type'), videoMP4.type, 'The source has the expected type');

                player.setMedia(videoOGV.src, videoOGV.type);

                assert.equal($media.find('source').length, 1, 'The player has replaced the source');
                assert.equal($media.find('source').attr('src'), videoOGV.src, 'The source has the expected URL');
                assert.equal($media.find('source').attr('type'), videoOGV.type, 'The source has the expected type');

                ready();
            })
            .init();

        mediaMock(player.getMedia(), mediaConfig);
    });
});
