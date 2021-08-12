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

import $ from 'jquery';
import UrlParser from 'util/urlParser';
import eventifier from 'core/eventifier';
import support from 'ui/mediaplayer/support';
import audioTpl from 'ui/mediaplayer/tpl/audio';
import videoTpl from 'ui/mediaplayer/tpl/video';
import sourceTpl from 'ui/mediaplayer/tpl/source';

/**
 * CSS namespace
 * @type {String}
 */
const ns = '.mediaplayer';

/**
 * Range value of the volume
 * @type {Number}
 */
const volumeRange = 100;

/**
 * List of media events that can be listened to for debugging
 * @type {String[]}
 */
const mediaEvents = [
    'abort',
    'canplay',
    'canplaythrough',
    'canshowcurrentframe',
    'dataunavailable',
    'durationchange',
    'emptied',
    'empty',
    'ended',
    'error',
    'loadeddata',
    'loadedfirstframe',
    'loadedmetadata',
    'loadstart',
    'pause',
    'play',
    'playing',
    'progress',
    'ratechange',
    'seeked',
    'seeking',
    'stalled',
    'suspend',
    'timeupdate',
    'volumechange',
    'waiting'
];

/**
 * List of player events that can be listened to for debugging
 * @type {String[]}
 */
const playerEvents = [
    'end',
    'error',
    'pause',
    'play',
    'playing',
    'ready',
    'recovererror',
    'resize',
    'stalled',
    'timeupdate'
];

/**
 * Defines a player object dedicated to the native HTML5 player
 * @param {jQuery} $container - Where to render the player
 * @param {Object} config - The list of config entries
 * @param {Array} config.sources - The list of media sources
 * @param {String} [config.type] - The type of player (video or audio) (default: video)
 * @param {Boolean} [config.preview] - Enables the media preview (load media metadata)
 * @param {Boolean} [config.debug] - Enables the debug mode
 * @returns {Object} player
 */
export default function html5PlayerFactory($container, config = {}) {
    const type = config.type || 'video';
    const sources = config.sources || [];

    let $media;
    let media;
    let played;
    let stalled = false;

    const player = {
        init() {
            const tpl = 'audio' === type ? audioTpl : videoTpl;
            const page = new UrlParser(window.location);
            let cors = false;
            let preload = config.preview ? 'metadata' : 'none';
            let poster = '';
            let link = '';
            let result = false;

            sources.forEach(source => {
                if (!page.sameDomain(source.src)) {
                    cors = true;
                }
                if (source.poster) {
                    poster = source.poster;
                }
                if (source.link) {
                    link = source.link;
                }
            });

            $media = $(tpl({ cors, preload, poster, link }));
            $container.append($media);

            media = null;
            played = false;

            media = $media.get(0);
            result = !!(media && media.canPlayType);

            // remove the browser native controls if we can use the API instead
            if (support.canControl()) {
                $media.removeAttr('controls');
            }

            $media
                .on(`play${ns}`, () => {
                    played = true;
                    this.trigger('play');
                })
                .on(`pause${ns}`, () => {
                    this.trigger('pause');
                })
                .on(`ended${ns}`, () => {
                    played = false;
                    this.trigger('end');
                })
                .on(`timeupdate${ns}`, () => {
                    this.trigger('timeupdate');
                })
                .on('loadstart', () => {
                    if (stalled) {
                        return;
                    }

                    if (media.networkState === HTMLMediaElement.NETWORK_NO_SOURCE) {
                        this.trigger('error');
                    }
                })
                .on(`error${ns}`, () => {
                    if (media.networkState === HTMLMediaElement.NETWORK_NO_SOURCE) {
                        this.trigger('error');
                    } else {
                        this.trigger('recovererror', media.networkState === HTMLMediaElement.NETWORK_LOADING);
                    }
                })
                .on(`loadedmetadata${ns}`, () => {
                    this.trigger('ready');
                })
                .on(`stalled${ns}`, () => {
                    stalled = true;
                    this.trigger('stalled');
                })
                .on(`playing${ns}`, () => {
                    stalled = false;
                    this.trigger('playing');
                });

            // install debug logger
            if (config.debug) {
                const networkState = () => media && media.networkState;
                const readyState = () => media && media.readyState;
                const getDebugContext = action => `[html5-${type}(networkState=${networkState()},readyState=${readyState()}):${action}]`;
                window.console.log(getDebugContext('installed'), media);
                mediaEvents.forEach(eventName => {
                    $media.on(eventName + ns, e => {
                        window.console.log(getDebugContext('media event'), eventName, $media && $media.find('source').attr('src'), e);
                    });
                });
                playerEvents.forEach(eventName => {
                    this.on(eventName, (...args) => {
                        window.console.log(getDebugContext('player event'), eventName, $media && $media.find('source').attr('src'), ...args);
                    });
                });
            }

            sources.forEach(source => $media.append(sourceTpl(source)));

            return result;
        },

        destroy() {
            this.stop();
            this.removeAllListeners();

            if ($media) {
                $media.off(ns).remove();
            }

            $media = null;
            media = null;
            played = false;
        },

        getMedia() {
            return media;
        },

        getMediaSize() {
            if (media) {
                return {
                    width: media.videoWidth,
                    height: media.videoHeight
                }
            }
            return {};
        },

        getPosition() {
            if (media) {
                return media.currentTime;
            }
            return 0;
        },

        getDuration() {
            if (media) {
                return media.duration;
            }
            return 0;
        },

        getVolume() {
            let value = 0;
            if (media) {
                value = parseFloat(media.volume) * volumeRange;
            }
            return value;
        },

        setVolume(value) {
            if (media) {
                media.volume = parseFloat(value) / volumeRange;
            }
        },

        setSize(width, height) {
            this.trigger('resize', width, height);
        },

        seek(value) {
            if (media) {
                media.currentTime = parseFloat(value);
                if (!played) {
                    this.play();
                }
            }
        },

        play() {
            if (media) {
                media.play();
            }
        },

        pause() {
            if (media) {
                media.pause();
            }
        },

        stop() {
            if (media && played) {
                media.currentTime = media.duration;
            }
        },

        mute(state) {
            if (media) {
                media.muted = !!state;
            }
        },

        isMuted() {
            if (media) {
                return !!media.muted;
            }
            return false;
        },

        addMedia(src, type) {
            if (media) {
                if (!support.checkSupport(media, type)) {
                    return false;
                }
            }

            if (src && $media) {
                $media.append(sourceTpl({ src, type }));
                return true;
            }
            return false;
        },

        setMedia(src, type) {
            if ($media) {
                $media.empty();
                return this.addMedia(src, type);
            }
            return false;
        }
    };

    return eventifier(player);
}