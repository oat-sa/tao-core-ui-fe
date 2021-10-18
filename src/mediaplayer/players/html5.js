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
import reminderManagerFactory from 'ui/mediaplayer/utils/reminder';
import timeObserverFactory from 'ui/mediaplayer/utils/timeObserver';

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
const playerEvents = ['end', 'error', 'pause', 'play', 'playing', 'ready', 'resize', 'stalled', 'timeupdate'];

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
    const updateObserver = reminderManagerFactory();
    const timeObserver = timeObserverFactory();

    let $media;
    let media;
    let playback = false;
    let loaded = false;
    let stalled = false;

    const getDebugContext = action => {
        const networkState = media && media.networkState;
        const readyState = media && media.readyState;
        return `[html5-${type}(networkState=${networkState},readyState=${readyState}):${action}]`;
    };
    // eslint-disable-next-line
    const debug = (action, ...args) => config.debug && window.console.log(getDebugContext(action), ...args);

    return eventifier({
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

            playback = false;
            loaded = false;
            stalled = false;

            media = $media.get(0);
            result = !!(media && support.checkSupport(media));

            // remove the browser native controls if we can use the API instead
            if (support.canControl()) {
                $media.removeAttr('controls');
            }

            // detect stalled video when the timer suddenly jump to the end
            timeObserver.removeAllListeners().on('irregularity', () => {
                if (playback && stalled) {
                    this.trigger('stalled');
                }
            });

            $media
                .on(`play${ns}`, () => {
                    playback = true;
                    timeObserver.init(media.currentTime, media.duration);
                    this.trigger('play');
                })
                .on(`pause${ns}`, () => {
                    updateObserver.stop();
                    this.trigger('pause');
                })
                .on(`ended${ns}`, () => {
                    updateObserver.forget().stop();
                    timeObserver.update(media.currentTime);
                    playback = false;
                    this.trigger('end');
                })
                .on(`timeupdate${ns}`, () => {
                    updateObserver.start();
                    timeObserver.update(media.currentTime);
                    this.trigger('timeupdate');
                })
                .on('loadstart', () => {
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
                        this.handleError(media.error);
                    }
                })
                .on('loadedmetadata', () => {
                    timeObserver.init(media.currentTime, media.duration);
                })
                .on(`canplay${ns}`, () => {
                    loaded = true;
                    this.trigger('ready');
                })
                .on(`stalled${ns}`, () => {
                    this.handleError(media.error);
                })
                .on(`playing${ns}`, () => {
                    updateObserver.forget().start();
                    this.trigger('playing');
                });

            // install debug logger
            if (config.debug) {
                debug('installed', media);
                mediaEvents.forEach(eventName => {
                    $media.on(eventName + ns, e => debug('media event', eventName, media && media.currentSrc, e));
                });
                playerEvents.forEach(eventName => {
                    this.on(eventName, (...args) =>
                        debug('player event', eventName, media && media.currentSrc, ...args)
                    );
                });
            }

            sources.forEach(source => this.addMedia(source.src, source.type));

            return result;
        },

        handleError(error) {
            stalled = true;
            const delay = 2000;
            updateObserver.remind(() => {
                if (updateObserver.elapsed >= delay) {
                    this.trigger('stalled');
                }
            }, delay);
        },

        recover() {
            stalled = false;
            if (media) {
                media.load();
            }
        },

        destroy() {
            debug('api call', 'destroy');

            this.stop();
            this.removeAllListeners();
            updateObserver.forget();
            timeObserver.removeAllListeners();

            if ($media) {
                $media.off(ns).remove();
            }

            $media = void 0;
            media = void 0;
            playback = false;
            loaded = false;
            stalled = false;
        },

        getMedia() {
            debug('api call', 'getMedia', media);

            return media;
        },

        getMediaSize() {
            let size = {};
            if (media) {
                size = {
                    width: media.videoWidth,
                    height: media.videoHeight
                };
            }

            debug('api call', 'getMediaSize', size);
            return size;
        },

        getPosition() {
            let position = 0;
            if (media) {
                position = media.currentTime;
            }

            debug('api call', 'getPosition', position);
            return position;
        },

        getDuration() {
            let duration = 0;
            if (media) {
                duration = media.duration;
            }

            debug('api call', 'getDuration', duration);
            return duration;
        },

        getVolume() {
            let volume = 0;
            if (media) {
                volume = parseFloat(media.volume) * volumeRange;
            }

            debug('api call', 'getVolume', volume);
            return volume;
        },

        setVolume(volume) {
            debug('api call', 'setVolume', volume);

            if (media) {
                media.volume = parseFloat(volume) / volumeRange;
            }
        },

        setSize(width, height) {
            debug('api call', 'setSize', width, height);

            this.trigger('resize', width, height);
        },

        seek(time) {
            debug('api call', 'seek', time);

            if (media) {
                media.currentTime = parseFloat(time);
                timeObserver.seek(media.currentTime);
                if (!playback) {
                    this.play();
                }
            }
        },

        play() {
            debug('api call', 'play');

            if (media) {
                const startPlayPromise = media.play();
                if ('undefined' !== typeof startPlayPromise) {
                    startPlayPromise.catch(error => this.handleError(error));
                }
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
            let mute = false;
            if (media) {
                mute = !!media.muted;
            }

            debug('api call', 'isMuted', mute);
            return mute;
        },

        addMedia(src, srcType) {
            debug('api call', 'addMedia', src, srcType);

            if (media) {
                if (!support.checkSupport(media, srcType)) {
                    return false;
                }
            }

            if (src && $media) {
                $media.append(sourceTpl({ src, type: srcType }));
                return true;
            }
            return false;
        },

        setMedia(src, srcType) {
            debug('api call', 'setMedia', src, srcType);

            if ($media) {
                $media.empty();
                return this.addMedia(src, srcType);
            }
            return false;
        }
    });
}
