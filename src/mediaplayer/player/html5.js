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
    let playback = false;
    let loaded = false;
    let stalled = false;

    const getDebugContext = action => {
        const networkState = media && media.networkState;
        const readyState = media && media.readyState;
        return `[html5-${type}(networkState=${networkState},readyState=${readyState}):${action}]`
    };
    // eslint-disable-next-line
    const debug = (action, ...args) => (config.debug && window.console.log(getDebugContext(action), ...args));

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
            playback = false;
            loaded = false;
            stalled = false;

            media = $media.get(0);
            result = !!(media && media.canPlayType);

            // remove the browser native controls if we can use the API instead
            if (support.canControl()) {
                $media.removeAttr('controls');
            }

            $media
                .on(`play${ns}`, () => {
                    playback = true;
                    this.trigger('play');
                })
                .on(`pause${ns}`, () => {
                    this.trigger('pause');
                })
                .on(`ended${ns}`, () => {
                    playback = false;
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

                    if (!config.preview && media.networkState === HTMLMediaElement.NETWORK_IDLE) {
                        this.trigger('ready');
                    }
                })
                .on(`error${ns}`, () => {
                    if (media.networkState === HTMLMediaElement.NETWORK_NO_SOURCE) {
                        this.trigger('error');
                    } else {
                        this.trigger('recovererror', media.networkState === HTMLMediaElement.NETWORK_LOADING);
                    }
                })
                .on(`canplay${ns}`, () => {
                    loaded = true;
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
                debug('installed', media);
                mediaEvents.forEach(eventName => {
                    $media.on(eventName + ns, e => debug('media event', eventName, media && media.currentSrc, e));
                });
                playerEvents.forEach(eventName => {
                    this.on(eventName, (...args) => debug('player event', eventName, media && media.currentSrc, ...args));
                });
            }

            sources.forEach(source => {
                const { src, type } = source;
                this.addMedia(src, type);
            });

            return result;
        },

        destroy() {
            debug('api call', 'destroy');

            this.stop();
            this.removeAllListeners();

            if ($media) {
                $media.off(ns).remove();
            }

            $media = null;
            media = null;
            playback = false;
            loaded = false;
            stalled = false;
        },

        getMedia() {
            debug('api call', 'getMedia');

            return media;
        },

        getMediaSize() {
            debug('api call', 'getMediaSize');

            if (media) {
                return {
                    width: media.videoWidth,
                    height: media.videoHeight
                }
            }
            return {};
        },

        getPosition() {
            debug('api call', 'getPosition');

            if (media) {
                return media.currentTime;
            }
            return 0;
        },

        getDuration() {
            debug('api call', 'getDuration');

            if (media) {
                return media.duration;
            }
            return 0;
        },

        getVolume() {
            debug('api call', 'getVolume');

            let value = 0;
            if (media) {
                value = parseFloat(media.volume) * volumeRange;
            }
            return value;
        },

        setVolume(value) {
            debug('api call', 'setVolume', value);

            if (media) {
                media.volume = parseFloat(value) / volumeRange;
            }
        },

        setSize(width, height) {
            debug('api call', 'setSize', width, height);

            this.trigger('resize', width, height);
        },

        seek(value) {
            debug('api call', 'seek', value);

            if (media) {
                media.currentTime = parseFloat(value);
                if (!playback) {
                    this.play();
                }
            }
        },

        play() {
            debug('api call', 'play');

            if (media) {
                media.play()
                    .catch(err => debug('playback error', err));
            }
        },

        pause() {
            debug('api call', 'pause');

            if (media) {
                media.pause();
            }
        },

        stop() {
            debug('api call', 'stop');

            if (media && playback) {
                media.currentTime = media.duration;
            }
        },

        mute(state) {
            debug('api call', 'mute', state);

            if (media) {
                media.muted = !!state;
            }
        },

        isMuted() {
            debug('api call', 'isMuted');

            if (media) {
                return !!media.muted;
            }
            return false;
        },

        addMedia(src, type) {
            debug('api call', 'addMedia', src, type);

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
            debug('api call', 'setMedia', src, type);

            if ($media) {
                $media.empty();
                return this.addMedia(src, type);
            }
            return false;
        }
    };

    return eventifier(player);
}