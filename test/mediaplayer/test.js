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
 * Copyright (c) 2015-2021 (original work) Open Assessment Technologies SA ;
 */
define(['jquery', 'lodash', 'ui/mediaplayer', 'core/store'], function ($, _, mediaplayer, store) {
    'use strict';

    QUnit.module('mediaplayer', {
        afterEach() {
            store.reset();
        }
    });

    QUnit.test('module', assert => {
        assert.equal(typeof mediaplayer, 'function', 'The mediaplayer module exposes a function');
        assert.equal(typeof mediaplayer(), 'object', 'The mediaplayer factory produces an object');
        assert.equal(
            typeof mediaplayer.canPlay,
            'function',
            'The mediaplayer factory exposes a function telling if the browser can play video and audio'
        );
        assert.equal(
            typeof mediaplayer.canPlayAudio,
            'function',
            'The mediaplayer factory exposes a function telling if the browser can play audio'
        );
        assert.equal(
            typeof mediaplayer.canPlayVideo,
            'function',
            'The mediaplayer factory exposes a function telling if the browser can play video'
        );
        assert.equal(
            typeof mediaplayer.canControl,
            'function',
            'The mediaplayer factory exposes a function telling if the browser allows to control the media playback'
        );
        assert.notStrictEqual(
            mediaplayer(),
            mediaplayer(),
            'The mediaplayer factory provides a different object on each call'
        );
    });

    QUnit.cases
        .init([
            { title: 'init' },
            { title: 'destroy' },
            { title: 'render' },
            { title: 'seek' },
            { title: 'play' },
            { title: 'stop' },
            { title: 'pause' },
            { title: 'resume' },
            { title: 'restart' },
            { title: 'rewind' },
            { title: 'mute' },
            { title: 'unmute' },
            { title: 'setVolume' },
            { title: 'getVolume' },
            { title: 'getPosition' },
            { title: 'getDuration' },
            { title: 'getTimesPlayed' },
            { title: 'resize' },
            { title: 'is' },
            { title: 'enable' },
            { title: 'disable' },
            { title: 'show' },
            { title: 'hide' },
            { title: 'trigger' },
            { title: 'on' },
            { title: 'off' },
            { title: 'getContainer' },
            { title: 'getElement' },
            { title: 'getSources' },
            { title: 'setSource' },
            { title: 'addSource' }
        ])
        .test('API ', (data, assert) => {
            const instance = mediaplayer();
            assert.equal(
                typeof instance[data.title],
                'function',
                `The mediaplayer instance exposes a "${data.title}" function`
            );
        });

    QUnit.test('DOM [audio player]', assert => {
        const ready = assert.async();
        const url = 'samples/audio.mp3';
        const $container = $('#qunit-fixture');
        const instance = mediaplayer({
            url: url,
            type: 'audio/mp3',
            renderTo: $container
        });

        instance.on('render', $dom => {
            const $player = $dom.find('.player');
            const $controls = $dom.find('.controls');
            const $overlay = $player.find('.overlay');
            const $media = $player.find('.media');
            const $source = $media.find('.source');

            assert.ok(true, 'The media player has trigger the render event');

            assert.equal($container.find('.mediaplayer').length, 1, 'The media player has been inserted into the page');

            assert.equal(typeof $dom, 'object', 'The rendered content is returned by the render() method');
            assert.notEqual(
                typeof $dom.jquery,
                'undefined',
                'The rendered content is returned as a jQuery selection by the render() method'
            );
            assert.equal($dom.length, 1, 'The rendered content contains a root element');

            assert.equal($player.length, 1, 'The rendered content contains a player element');
            assert.equal($player.find('.media[data-type="audio"]').length, 1, 'The player is related to audio');

            assert.equal($media.length, 1, 'The rendered content contains a media element');
            assert.equal(
                $media.is('[data-type="audio"]'),
                true,
                'The rendered content uses an audio tag to embed the audio track'
            );

            assert.equal($source.length, 1, 'The rendered content contains an audio source');
            assert.equal($source.attr('data-src'), url, 'Audio source targets the right URL');

            assert.equal($overlay.length, 1, 'The rendered content contains an overlay element');
            assert.equal(
                $overlay.find('[data-control="play"]').length,
                1,
                'The overlay element contains a play control'
            );
            assert.equal(
                $overlay.find('[data-control="pause"]').length,
                1,
                'The overlay element contains a pause control'
            );

            assert.equal($controls.length, 1, 'The rendered content contains a controls element');
            assert.equal($controls.find('.bar').length, 1, 'The controls element contains a bar element');
            assert.equal(
                $controls.find('[data-control="play"]').length,
                1,
                'The controls element contains a play control'
            );
            assert.equal(
                $controls.find('[data-control="pause"]').length,
                1,
                'The controls element contains a pause control'
            );
            assert.equal(
                $controls.find('[data-control="time-cur"]').length,
                1,
                'The controls element contains a current position control'
            );
            assert.equal(
                $controls.find('[data-control="time-end"]').length,
                1,
                'The controls element contains a duration control'
            );
            assert.equal(
                $controls.find('[data-control="mute"]').length,
                1,
                'The controls element contains a mute control'
            );
            assert.equal(
                $controls.find('[data-control="unmute"]').length,
                1,
                'The controls element contains an unmute control'
            );
            assert.equal(
                $controls.find('.seek .slider').length,
                1,
                'The controls element contains seek slider control'
            );
            assert.equal(
                $controls.find('.volume .slider').length,
                1,
                'The controls element contains volume slider control'
            );

            _.defer(() => {
                instance.destroy();

                assert.equal(
                    $container.find('.mediaplayer').length,
                    0,
                    'The media player has been removed by the destroy action'
                );

                ready();
            });
        });

        instance.on('error', err => {
            assert.ok(false, err.message);
            ready();
        });
    });

    QUnit.test('DOM [video player]', assert => {
        const ready = assert.async();
        const url = 'samples/video.mp4';
        const $container = $('#qunit-fixture');
        const instance = mediaplayer({
            url: url,
            type: 'video/mp4',
            renderTo: $container
        });

        instance.on('render', $dom => {
            const $player = $dom.find('.player');
            const $controls = $dom.find('.controls');
            const $overlay = $player.find('.overlay');
            const $media = $player.find('.media');
            const $source = $media.find('.source');

            assert.ok(true, 'The media player has trigger the render event');

            assert.equal($container.find('.mediaplayer').length, 1, 'The media player has been inserted into the page');

            assert.equal(typeof $dom, 'object', 'The rendered content is returned by the render() method');
            assert.notEqual(
                typeof $dom.jquery,
                'undefined',
                'The rendered content is returned as a jQuery selection by the render() method'
            );
            assert.equal($dom.length, 1, 'The rendered content contains a root element');

            assert.equal($player.length, 1, 'The rendered content contains a player element');
            assert.equal($player.find('.media[data-type="video"]').length, 1, 'The player is related to video');

            assert.equal($media.length, 1, 'The rendered content contains a media element');
            assert.equal(
                $media.is('[data-type="video"]'),
                true,
                'The rendered content uses a video tag to embed the movie'
            );

            assert.equal($source.length, 1, 'The rendered content contains a video source');
            assert.equal($source.attr('data-src'), url, 'Video source targets the right URL');

            assert.equal($overlay.length, 1, 'The rendered content contains an overlay element');
            assert.equal(
                $overlay.find('[data-control="play"]').length,
                1,
                'The overlay element contains a play control'
            );
            assert.equal(
                $overlay.find('[data-control="pause"]').length,
                1,
                'The overlay element contains a pause control'
            );

            assert.equal($controls.length, 1, 'The rendered content contains a controls element');
            assert.equal($controls.find('.bar').length, 1, 'The controls element contains a bar element');
            assert.equal(
                $controls.find('[data-control="play"]').length,
                1,
                'The controls element contains a play control'
            );
            assert.equal(
                $controls.find('[data-control="pause"]').length,
                1,
                'The controls element contains a pause control'
            );
            assert.equal(
                $controls.find('[data-control="time-cur"]').length,
                1,
                'The controls element contains a current position control'
            );
            assert.equal(
                $controls.find('[data-control="time-end"]').length,
                1,
                'The controls element contains a duration control'
            );
            assert.equal(
                $controls.find('[data-control="mute"]').length,
                1,
                'The controls element contains a mute control'
            );
            assert.equal(
                $controls.find('[data-control="unmute"]').length,
                1,
                'The controls element contains an unmute control'
            );
            assert.equal(
                $controls.find('.seek .slider').length,
                1,
                'The controls element contains seek slider control'
            );
            assert.equal(
                $controls.find('.volume .slider').length,
                1,
                'The controls element contains volume slider control'
            );

            _.defer(() => {
                instance.destroy();

                assert.equal(
                    $container.find('.mediaplayer').length,
                    0,
                    'The media player has been removed by the destroy action'
                );

                ready();
            });
        });

        instance.on('error', err => {
            assert.ok(false, err.message);
            ready();
        });
    });

    QUnit.test('DOM [youtube player]', assert => {
        const ready = assert.async();
        const videoId = 'YJWSVUPSQqw';
        const url = `//www.youtube.com/watch?v=${videoId}`;
        const $container = $('#qunit-fixture');
        const instance = mediaplayer({
            url: url,
            type: 'video/youtube',
            renderTo: $container
        });

        instance.on('render', $dom => {
            const $player = $dom.find('.player');
            const $controls = $dom.find('.controls');
            const $overlay = $player.find('.overlay');
            const $media = $player.find('.media');
            const $source = $player.find('.source');

            assert.ok(true, 'The media player has trigger the render event');

            assert.equal($container.find('.mediaplayer').length, 1, 'The media player has been inserted into the page');

            assert.equal(typeof $dom, 'object', 'The rendered content is returned by the render() method');
            assert.notEqual(
                typeof $dom.jquery,
                'undefined',
                'The rendered content is returned as a jQuery selection by the render() method'
            );
            assert.equal($dom.length, 1, 'The rendered content contains a root element');

            assert.equal($player.length, 1, 'The rendered content contains a player element');
            assert.equal($player.find('.media[data-type="youtube"]').length, 1, 'The player is related to video');

            assert.equal($media.length, 1, 'The rendered content contains a media element');
            assert.equal(
                $media.is('[data-type="youtube"]'),
                true,
                'The rendered content uses a placeholder to embed the youtube player'
            );
            assert.equal($source.attr('data-src'), url, 'The video source targets the right URL');
            assert.equal($source.attr('data-type'), 'video/mp4', 'The type is the default one');
            assert.equal($source.attr('data-id'), videoId, 'The video ID contains the right identifier');

            assert.equal($overlay.length, 1, 'The rendered content contains an overlay element');
            assert.equal(
                $overlay.find('[data-control="play"]').length,
                1,
                'The overlay element contains a play control'
            );
            assert.equal(
                $overlay.find('[data-control="pause"]').length,
                1,
                'The overlay element contains a pause control'
            );

            assert.equal($controls.length, 1, 'The rendered content contains a controls element');
            assert.equal($controls.find('.bar').length, 1, 'The controls element contains a bar element');
            assert.equal(
                $controls.find('[data-control="play"]').length,
                1,
                'The controls element contains a play control'
            );
            assert.equal(
                $controls.find('[data-control="pause"]').length,
                1,
                'The controls element contains a pause control'
            );
            assert.equal(
                $controls.find('[data-control="time-cur"]').length,
                1,
                'The controls element contains a current position control'
            );
            assert.equal(
                $controls.find('[data-control="time-end"]').length,
                1,
                'The controls element contains a duration control'
            );
            assert.equal(
                $controls.find('[data-control="mute"]').length,
                1,
                'The controls element contains a mute control'
            );
            assert.equal(
                $controls.find('[data-control="unmute"]').length,
                1,
                'The controls element contains an unmute control'
            );
            assert.equal(
                $controls.find('.seek .slider').length,
                1,
                'The controls element contains seek slider control'
            );
            assert.equal(
                $controls.find('.volume .slider').length,
                1,
                'The controls element contains volume slider control'
            );

            _.defer(() => {
                instance.destroy();

                assert.equal(
                    $container.find('.mediaplayer').length,
                    0,
                    'The media player has been removed by the destroy action'
                );

                ready();
            });
        });

        instance.on('error', err => {
            assert.ok(false, err.message);
            ready();
        });
    });

    const mediaplayerTypes = [
        {
            title: 'audio player',
            type: 'audio',
            url: [
                {
                    src: 'samples/audio.mp3',
                    type: 'audio/mp3'
                },
                {
                    src: 'samples/audio.m4a',
                    type: 'audio/m4a'
                },
                {
                    src: 'samples/audio.ogg',
                    type: 'audio/ogg'
                }
            ]
        },
        {
            title: 'video player',
            type: 'video',
            url: [
                {
                    src: 'samples/video.mp4',
                    type: 'video/mp4'
                },
                {
                    src: 'samples/video.ogm',
                    type: 'video/ogm'
                },
                {
                    src: 'samples/video.webm',
                    type: 'video/webm'
                }
            ]
        },
        {
            title: 'youtube player',
            type: 'youtube',
            url: 'YJWSVUPSQqw',
            url2: 'YUHRY27pg8g'
        }
    ];

    QUnit.cases.init(mediaplayerTypes).test('Events ', (data, assert) => {
        const ready = assert.async();
        const $container = $('#qunit-fixture');
        const instance = mediaplayer({
            url: data.url,
            type: data.type,
            startMuted: true
        });
        let nsIndex = 0;
        const resolveEvent = event =>
            new Promise(resolve => {
                const ns = `.ns${nsIndex++}`;
                instance.on(`${event}${ns}`, (...args) => {
                    instance.off(ns);
                    resolve(args);
                });
            });
        const resolveAction = (action, event) => {
            const next = resolveEvent(event || action);
            instance[action]();
            return next;
        };

        const events = ['render', 'ready', 'play', 'pause', 'update', 'ended', 'destroy', 'custom'];
        const promises = [];
        events.forEach(event => {
            promises.push(
                resolveEvent(event).then(() => {
                    assert.ok(true, `The media player has triggered the ${event} event through the component`);
                })
            );
            promises.push(
                new Promise(resolve => {
                    $container.one(`${event}.mediaplayer`, () => {
                        assert.ok(true, `The media player has triggered the ${event} event through the DOM`);
                        resolve();
                    });
                })
            );
        });

        resolveEvent('render')
            .then(([$dom]) => {
                assert.equal(typeof $dom, 'object', 'The render event provides the DOM');
                assert.ok($dom.is('.mediaplayer'), 'The provided DOM has the right class');
                assert.strictEqual($dom, instance.getElement(), 'The render event provides the right DOM');
                return resolveEvent('ready');
            })
            .then(() => {
                assert.ok(true, 'command #1: play()');
                return resolveAction('play');
            })
            .then(() => resolveEvent('update'))
            .then(() => {
                assert.ok(true, 'command #2: pause()');
                return resolveAction('pause');
            })
            .then(() => {
                assert.ok(true, 'command #3: resume()');
                return resolveAction('resume', 'play');
            })
            .then(() => {
                assert.ok(true, 'command #4: seek(1)');
                instance.seek(1);
                assert.equal(
                    Math.floor(instance.player.getPosition()),
                    1,
                    'The media player has moved forward to the right position'
                );
            })
            .then(() => {
                assert.ok(true, 'command #5: rewind()');
                instance.rewind();
                assert.equal(
                    Math.floor(instance.player.getPosition()),
                    0,
                    'The media player has restarted from the beginning'
                );
            })
            .then(() => {
                assert.ok(true, 'command #6: seek(1)');
                instance.seek(1);
                assert.equal(
                    Math.floor(instance.player.getPosition()),
                    1,
                    'The media player has moved forward to the right position'
                );
            })
            .then(() => {
                assert.ok(true, 'command #7: pause()');
                instance.pause();
                return resolveAction('pause');
            })
            .then(() => {
                const next = resolveEvent('play');
                assert.ok(true, 'command #8: restart()');
                instance.restart();
                assert.equal(
                    Math.floor(instance.player.getPosition()),
                    0,
                    'The media player has restarted from the beginning'
                );
                return next;
            })
            .then(() => {
                assert.ok(true, 'command #9: hide()');
                return resolveAction('hide', 'pause');
            })
            .then(
                () =>
                    new Promise(resolve => {
                        assert.ok(true, 'command #10: play()');
                        instance.play();
                        setTimeout(() => {
                            assert.ok(!instance.is('playing'), 'The player cannot be played while hidden!');
                            resolve();
                        }, 10);
                    })
            )
            .then(() => {
                assert.ok(true, 'command #11: show()');
                return resolveAction('show', 'play');
            })
            .then(() => {
                assert.ok(true, 'command #12: disable()');
                return resolveAction('disable', 'pause');
            })
            .then(
                () =>
                    new Promise(resolve => {
                        assert.ok(true, 'command #13: play()');
                        instance.play();

                        setTimeout(() => {
                            assert.ok(!instance.is('playing'), 'The player cannot be played while disabled!');
                            resolve();
                        }, 10);
                    })
            )
            .then(() => {
                assert.ok(true, 'command #14: enable()');
                return resolveAction('enable', 'play');
            })
            .then(() => {
                assert.ok(true, 'command #15: stop()');
                return resolveAction('stop', 'ended');
            })
            .then(() => {
                assert.ok(true, 'command #16: destroy()');
                return resolveAction('destroy');
            })
            .then(() => Promise.all(promises))
            .catch(err => assert.ok(false, err.message))
            .then(ready);

        instance.render($container);
        instance.trigger('custom');
    });

    QUnit.cases.init(mediaplayerTypes).test('Option autoStart ', (data, assert) => {
        const ready = assert.async();

        const instance = mediaplayer({
            url: data.url,
            type: data.type,
            startMuted: true,
            autoStart: true,
            renderTo: '#qunit-fixture'
        })
            .on('play', () => {
                assert.ok(true, 'The media player has auto started the playback');

                _.defer(() => instance.destroy());
            })
            .on('destroy', ready);
    });

    QUnit.cases.init(mediaplayerTypes).test('Option autoStartAt ', (data, assert) => {
        const ready = assert.async();

        const expected = 1;
        const instance = mediaplayer({
            url: data.url,
            type: data.type,
            startMuted: true,
            autoStartAt: expected,
            renderTo: '#qunit-fixture'
        })
            .on('play', () => {
                instance.pause();
                assert.ok(true, 'The media player has auto started the playback');
                assert.equal(
                    Math.floor(instance.player.getPosition()),
                    expected,
                    'The media player has auto started the playback at the right position'
                );

                _.defer(() => instance.destroy());
            })
            .on('destroy', ready);
    });

    QUnit.cases.init(mediaplayerTypes).test('Option canPause ', (data, assert) => {
        const ready = assert.async();
        Promise.all([
            new Promise(resolve => {
                const instance = mediaplayer({
                    url: data.url,
                    type: data.type,
                    startMuted: true,
                    autoStart: true,
                    canPause: false,
                    renderTo: '#qunit-fixture'
                })
                    .on('play', () => {
                        assert.ok(true, 'The media player has auto started the playback');
                        instance.pause();

                        setTimeout(() => instance.destroy(), 50);
                    })
                    .on('pause', () => {
                        assert.ok(false, 'The media player cannot be paused!');
                    })
                    .on('destroy', resolve);
            }),
            new Promise(resolve => {
                const instance = mediaplayer({
                    url: data.url,
                    type: data.type,
                    startMuted: true,
                    autoStart: true,
                    canPause: true,
                    renderTo: '#qunit-fixture'
                })
                    .on('play', () => {
                        assert.ok(true, 'The media player has auto started the playback');
                        instance.pause();
                    })
                    .on('pause', () => {
                        assert.ok(true, 'The media player can be paused');

                        _.defer(() => instance.destroy());
                    })
                    .on('destroy', resolve);
            })
        ])
            .catch(err => assert.ok(false, err.message))
            .then(ready);
    });

    QUnit.cases.init(mediaplayerTypes).test('Option startMuted ', (data, assert) => {
        const ready = assert.async();
        Promise.all([
            new Promise(resolve => {
                const instance = mediaplayer({
                    url: data.url,
                    type: data.type,
                    startMuted: true,
                    autoStart: true,
                    renderTo: '#qunit-fixture'
                })
                    .on('play', () => {
                        assert.ok(true, 'The media player has auto started the playback');
                        assert.ok(instance.player.isMuted(), 'The media player is muted');
                        assert.ok(instance.is('muted'), 'The media player is muted');

                        instance.pause();

                        _.defer(() => instance.destroy());
                    })
                    .on('destroy', resolve);
            }),
            new Promise(resolve => {
                const instance = mediaplayer({
                    url: data.url,
                    type: data.type,
                    startMuted: false,
                    autoStart: true,
                    renderTo: '#qunit-fixture'
                })
                    .on('play', () => {
                        assert.ok(true, 'The media player has auto started the playback');
                        assert.ok(!instance.player.isMuted(), 'The media player is not muted');
                        assert.ok(!instance.is('muted'), 'The media player is not muted');

                        instance.pause();

                        _.defer(() => instance.destroy());
                    })
                    .on('destroy', resolve);
            })
        ])
            .catch(err => assert.ok(false, err.message))
            .then(ready);
    });

    QUnit.cases.init(mediaplayerTypes).test('Option volume ', (data, assert) => {
        const ready = assert.async();

        const expected = 30;
        const instance = mediaplayer({
            url: data.url,
            type: data.type,
            volume: expected,
            autoStart: true,
            renderTo: '#qunit-fixture'
        })
            .on('play', () => {
                assert.ok(true, 'The media player has auto started the playback');
                assert.equal(instance.player.getVolume(), expected, 'The media player has the right volume set');
                assert.equal(instance.getVolume(), expected, 'The media player must provide the right volume');

                instance.pause();

                _.defer(() => instance.destroy());
            })
            .on('destroy', ready);
    });

    QUnit.cases.init(mediaplayerTypes).test('Option loop ', (data, assert) => {
        const ready = assert.async();

        let count = 0;
        const expected = 2;
        const instance = mediaplayer({
            url: data.url,
            type: data.type,
            loop: true,
            autoStart: true,
            startMuted: true,
            renderTo: '#qunit-fixture'
        })
            .on('play', () => {
                assert.ok(true, 'The media player has started the playback');

                instance.seek(instance.getDuration() - 0.1);
            })
            .on('ended', () => {
                count++;
                assert.ok(true, 'The media player has finished the playback');
                assert.equal(
                    instance.getTimesPlayed(),
                    count,
                    'The media player must provide the right number of plays'
                );

                if (count >= expected) {
                    assert.ok(true, 'The media player has looped the playback');
                    instance.loop = false;

                    _.defer(() => instance.destroy());
                }
            })
            .on('destroy', ready);
    });

    QUnit.cases.init(mediaplayerTypes).test('Option maxPlays ', (data, assert) => {
        const ready = assert.async();

        let count = 0;
        const expected = 1;
        let to;
        const instance = mediaplayer({
            url: data.url,
            type: data.type,
            maxPlays: expected,
            autoStart: true,
            startMuted: true,
            renderTo: '#qunit-fixture'
        })
            .on('play', () => {
                assert.ok(true, 'The media player has started the playback');

                count++;

                if (count > expected) {
                    assert.ok(false, 'The media player cannot play more than allowed!');

                    if (to) {
                        clearTimeout(to);
                        to = null;
                    }

                    _.defer(() => instance.destroy());
                } else {
                    _.defer(() => instance.stop());
                }
            })
            .on('ended', () => {
                assert.ok(true, 'The media player has finished the playback');
                assert.equal(
                    instance.getTimesPlayed(),
                    count,
                    'The media player must provide the right number of plays'
                );

                _.defer(() => instance.play());
            })
            .on('limitreached', () => {
                if (instance.is('playing') || count > expected) {
                    assert.ok(false, 'The media player must be stopped!');
                } else {
                    assert.ok(true, 'The media player has stopped the playback after the play limit has been reached');
                }

                _.defer(() => {
                    to = setTimeout(() => instance.destroy(), 50);

                    instance.play();
                });
            })
            .on('destroy', ready);
    });

    QUnit.cases.init(mediaplayerTypes).test('Option renderTo ', (data, assert) => {
        const ready = assert.async(3);
        const selector = '#qunit-fixture';
        const places = [
            {
                type: 'jQuery',
                container: $(selector)
            },
            {
                type: 'String',
                container: selector
            },
            {
                type: 'HTMLElement',
                container: document.getElementById(selector.substr(1))
            }
        ];

        places.forEach(place => {
            const instance = mediaplayer({
                url: data.url,
                type: data.type,
                renderTo: place.container
            })
                .on('render', $dom => {
                    assert.ok(
                        $dom.parent().is(selector),
                        `The media player has been rendered in the container provided using ${place.type}`
                    );

                    _.defer(() => instance.destroy());
                })
                .on('destroy', ready);
        });
    });

    QUnit.cases.init(mediaplayerTypes).test('Show/Hide ', (data, assert) => {
        const selector = '#qunit-fixture';
        const ready = assert.async();
        const instance = mediaplayer({
            url: data.url,
            type: data.type,
            renderTo: selector
        })
            .on('render', $dom => {
                assert.ok($dom.parent().is(selector), 'The media player has been rendered in the container');

                assert.equal($dom.length, 1, 'the media player exists');
                assert.ok(!$dom.hasClass('hidden'), 'the media player is displayed');
                assert.ok($dom.is(':visible'), 'the media player is displayed');

                _.defer(() => {
                    instance.hide();

                    _.defer(() => {
                        assert.ok($dom.hasClass('hidden'), 'the media player is hidden');
                        assert.ok(!$dom.is(':visible'), 'the media player is hidden');

                        instance.show();

                        _.defer(() => {
                            assert.ok(!$dom.hasClass('hidden'), 'the media player is displayed');
                            assert.ok($dom.is(':visible'), 'the media player is displayed');

                            instance.destroy();
                        });
                    });
                });
            })
            .on('destroy', ready);
    });

    QUnit.cases.init(mediaplayerTypes).test('Enable/Disable ', (data, assert) => {
        const ready = assert.async();
        const selector = '#qunit-fixture';
        const instance = mediaplayer({
            url: data.url,
            type: data.type,
            renderTo: selector
        })
            .on('render', $dom => {
                assert.ok($dom.parent().is(selector), 'The media player has been rendered in the container');

                assert.equal($dom.length, 1, 'the media player exists');
                assert.ok(!$dom.hasClass('disabled'), 'the media player is enabled');

                _.defer(() => {
                    instance.disable();

                    _.defer(() => {
                        assert.ok($dom.hasClass('disabled'), 'the media player is disabled');

                        instance.enable();

                        _.defer(() => {
                            assert.ok(!$dom.hasClass('disabled'), 'the media player is enabled');

                            instance.destroy();
                        });
                    });
                });
            })
            .on('destroy', ready);
    });

    QUnit.cases.init(mediaplayerTypes).test('Sources management ', (data, assert) => {
        const url1 = _.isArray(data.url) ? data.url[0] : data.url;
        const url2 = data.url2 || data.url[1];
        const instance = mediaplayer({
            type: data.type
        });
        let res = instance.getSources();

        assert.equal(res.length, 0, 'The media player has an empty list of sources');

        instance.setSource(url1);
        res = instance.getSources();

        assert.equal(res.length, 1, 'The media player has one media in its list of sources');
        if ('object' === typeof url1) {
            assert.equal(
                res[0].src,
                url1.src,
                'The media player has the right media at the first position in its list of sources'
            );
        } else {
            assert.equal(
                res[0].src,
                url1,
                'The media player has the right media at the first position in its list of sources'
            );
        }

        instance.addSource(url2);
        res = instance.getSources();

        assert.equal(res.length, 2, 'The media player has two media in its list of sources');
        if ('object' === typeof url2) {
            assert.equal(
                res[1].src,
                url2.src,
                'The media player has the right media at the second position in its list of sources'
            );
        } else {
            assert.equal(
                res[1].src,
                url2,
                'The media player has the right media at the second position in its list of sources'
            );
        }

        instance.setSource(url1);
        res = instance.getSources();

        assert.equal(res.length, 1, 'The media player has one media in its list of sources');
        if ('object' === typeof url1) {
            assert.equal(
                res[0].src,
                url1.src,
                'The media player has the right media at the first position in its list of sources'
            );
        } else {
            assert.equal(
                res[0].src,
                url1,
                'The media player has the right media at the first position in its list of sources'
            );
        }

        instance.destroy();
    });

    QUnit.test('stalled', assert => {
        const ready = assert.async();

        assert.expect(5);

        const stalledTimeout = 50;
        const instance = mediaplayer({
            url: 'samples/video.mp4',
            type: 'video',
            renderTo: '#qunit-fixture',
            stalledTimeout
        })
            .on('render.test', $dom => {
                instance.off('.test');

                // set state that should be kept
                instance.timesPlayed = 1;

                $dom.find('.media').trigger('stalled');

                setTimeout(() => {
                    assert.equal(instance.is('stalled'), true, 'player is stalled after timeout');

                    //simulate user click to reload button
                    instance.reload();
                }, stalledTimeout);
            })
            .on('reload', () => {
                assert.ok(true, 'reload event is fired');

                // add listener for rerender
                instance.on('render', $dom => {
                    assert.equal(instance.getTimesPlayed(), 1, 'timesPlayed is kept');
                    assert.equal(instance.is('stalled'), true, 'player still stalled after reload');

                    // simulate video start playing
                    $dom.find('.media').trigger('playing');
                    assert.equal(instance.is('stalled'), false, 'player is not stalled anymore');

                    instance.destroy();
                });
            })
            .on('destroy', ready);
    });
});
