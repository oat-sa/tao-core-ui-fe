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
define(['ui/mediaplayer/support', 'test/ui/mediaplayer/mocks/userAgentMock'], function (support, userAgentMockFactory) {
    'use strict';

    const createElementOrigin = document.createElement;

    function createElementMock(element, options) {
        switch (element) {
            case 'audio':
                return {
                    canPlayType(type) {
                        const supportList = {
                            'audio/mpeg;': 'probably',
                            'audio/mp4; codecs="mp4a.40.5"': 'maybe',
                            'audio/wma': 'no'
                        };
                        return supportList[type] || '';
                    }
                };

            case 'video':
                return {
                    canPlayType(type) {
                        const supportList = {
                            'video/webm; codecs="vp8, vorbis"': 'probably',
                            'video/mp4; codecs="avc1.42E01E, mp4a.40.2"': 'maybe',
                            'video/mkv': 'no'
                        };
                        return supportList[type] || '';
                    }
                };

            default:
                return createElementOrigin.call(document, element, options);
        }
    }

    QUnit.module('support', {
        beforeEach() {
            document.createElement = createElementMock;
        },
        afterEach() {
            document.createElement = createElementOrigin;
        }
    });

    QUnit.test('module', assert => {
        assert.expect(1);
        assert.equal(typeof support, 'object', 'The support module exposes an object');
    });

    QUnit.cases
        .init([
            { title: 'checkSupport' },
            { title: 'canPlay' },
            { title: 'canPlayAudio' },
            { title: 'canPlayVideo' },
            { title: 'canControl' }
        ])
        .test('API ', (data, assert) => {
            assert.expect(1);
            assert.equal(
                typeof support[data.title],
                'function',
                `The support helper exposes a "${data.title}" function`
            );
        });

    QUnit.test('checkSupport [not a media]', assert => {
        assert.expect(1);
        assert.strictEqual(
            support.checkSupport(document.createElement('div')),
            false,
            'Support is not available for non media element'
        );
    });

    QUnit.cases
        .init([
            {
                title: 'generic support',
                expected: true
            },
            {
                title: 'video/webm',
                mime: 'video/webm',
                expected: true
            },
            {
                title: 'video/mp4',
                mime: 'video/mp4',
                expected: true
            },
            {
                title: 'video/mp4 with codecs',
                mime: 'video/mp4; codecs="avc1.42E01E, mp4a.40.2"',
                expected: true
            },
            {
                title: 'video/mkv',
                mime: 'video/mkv',
                expected: false
            },
            {
                title: 'unknown type',
                mime: 'dummy',
                expected: false
            }
        ])
        .test('checkSupport ', (data, assert) => {
            assert.expect(1);
            const media = document.createElement('video');
            assert.strictEqual(
                support.checkSupport(media, data.mime),
                data.expected,
                `Detects the support for media with MIME "${data.mime}"`
            );
        });

    QUnit.cases
        .init([
            {
                title: 'generic support',
                expected: true
            },
            {
                title: 'audio/mpeg',
                mime: 'audio/mpeg',
                expected: true
            },
            {
                title: 'audio/mp4',
                mime: 'audio/mp4',
                expected: true
            },
            {
                title: 'audio/mp4 with codecs',
                mime: 'audio/mp4; codecs="mp4a.40.5"',
                expected: true
            },
            {
                title: 'audio/wma',
                mime: 'audio/wma',
                expected: false
            },
            {
                title: 'unknown type',
                mime: 'dummy',
                expected: false
            }
        ])
        .test('canPlayAudio ', (data, assert) => {
            assert.expect(1);
            assert.strictEqual(
                support.canPlayAudio(data.mime),
                data.expected,
                `Detects the support for audio media with MIME "${data.mime}"`
            );
        });

    QUnit.cases
        .init([
            {
                title: 'generic support',
                expected: true
            },
            {
                title: 'video/webm',
                mime: 'video/webm',
                expected: true
            },
            {
                title: 'video/mp4',
                mime: 'video/mp4',
                expected: true
            },
            {
                title: 'video/mp4 with codecs',
                mime: 'video/mp4; codecs="avc1.42E01E, mp4a.40.2"',
                expected: true
            },
            {
                title: 'video/mkv',
                mime: 'video/mkv',
                expected: false
            },
            {
                title: 'unknown type',
                mime: 'dummy',
                expected: false
            }
        ])
        .test('canPlayVideo ', (data, assert) => {
            assert.expect(1);
            assert.strictEqual(
                support.canPlayVideo(data.mime),
                data.expected,
                `Detects the support for video media with MIME "${data.mime}"`
            );
        });

    QUnit.test('canPlay [generic support]', assert => {
        assert.expect(1);
        assert.strictEqual(support.canPlay(), true, 'Detects the generic support is available');
    });

    QUnit.cases
        .init([
            {
                title: 'audio: generic support',
                type: 'audio',
                expected: true
            },
            {
                title: 'audio: audio/mpeg',
                mime: 'audio/mpeg',
                type: 'audio',
                expected: true
            },
            {
                title: 'audio: audio/mp4',
                mime: 'audio/mp4',
                type: 'audio',
                expected: true
            },
            {
                title: 'audio: audio/mp4 with codecs',
                mime: 'audio/mp4; codecs="mp4a.40.5"',
                type: 'audio',
                expected: true
            },
            {
                title: 'audio: audio/wma',
                mime: 'audio/wma',
                type: 'audio',
                expected: false
            },
            {
                title: 'audio: unknown type',
                mime: 'dummy',
                type: 'audio',
                expected: false
            },
            {
                title: 'video: generic support',
                type: 'video',
                expected: true
            },
            {
                title: 'video: video/webm',
                mime: 'video/webm',
                type: 'video',
                expected: true
            },
            {
                title: 'video: video/mp4',
                mime: 'video/mp4',
                type: 'video',
                expected: true
            },
            {
                title: 'video: video/mp4 with codecs',
                mime: 'video/mp4; codecs="avc1.42E01E, mp4a.40.2"',
                type: 'video',
                expected: true
            },
            {
                title: 'video: video/mkv',
                mime: 'video/mkv',
                type: 'video',
                expected: false
            },
            {
                title: 'video: unknown type',
                mime: 'dummy',
                type: 'video',
                expected: false
            },
            {
                title: 'youtube: generic support',
                type: 'youtube',
                expected: true
            },
            {
                title: 'youtube: video/webm',
                mime: 'video/webm',
                type: 'youtube',
                expected: true
            },
            {
                title: 'youtube: video/mp4',
                mime: 'video/mp4',
                type: 'youtube',
                expected: true
            },
            {
                title: 'youtube: video/mp4 with codecs',
                mime: 'video/mp4; codecs="avc1.42E01E, mp4a.40.2"',
                type: 'youtube',
                expected: true
            },
            {
                title: 'youtube: video/mkv',
                mime: 'video/mkv',
                type: 'youtube',
                expected: true
            },
            {
                title: 'youtube: unknown type',
                mime: 'dummy',
                type: 'youtube',
                expected: true
            }
        ])
        .test('canPlay ', (data, assert) => {
            assert.expect(1);
            assert.strictEqual(
                support.canPlay(data.type, data.mime),
                data.expected,
                `Detects the support for ${data.type} media with MIME "${data.mime}"`
            );
        });

    QUnit.cases
        .init([
            {
                title: 'desktop',
                userAgent: 'Mozilla/5.0 (Unit Testing) QUnit/2.0',
                expected: true
            },
            {
                title: 'phone',
                userAgent: 'Mozilla/5.0 (Unit Testing; iphone) QUnit/2.0',
                expected: false
            },
            {
                title: 'tablet',
                userAgent: 'Mozilla/5.0 (Unit Testing; ipod) QUnit/2.0',
                expected: false
            }
        ])
        .test('canControl ', (data, assert) => {
            assert.expect(1);
            const userAgentMock = userAgentMockFactory();
            userAgentMock.setUserAgent(data.userAgent);
            assert.strictEqual(support.canControl(), data.expected, 'Check the controls are allowed');
            userAgentMock.restore();
        });
});
