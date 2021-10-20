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
 * @type {string}
 */
const ns = '.mediaplayer';

/**
 * Range value of the volume
 * @type {number}
 */
const volumeRange = 100;

/**
 * Delay before considering a media stalled
 * @type {number}
 */
const stalledDetectionDelay = 2000;

/**
 * List of media events that can be listened to for debugging
 * @type {string[]}
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
 * @type {string[]}
 */
const playerEvents = ['end', 'error', 'pause', 'play', 'playing', 'ready', 'resize', 'stalled', 'timeupdate'];

/**
 * Defines a player object dedicated to the native HTML5 player
 * @param {jQuery} $container - Where to render the player
 * @param {object} config - The list of config entries
 * @param {Array} config.sources - The list of media sources
 * @param {string} [config.type] - The type of player (video or audio) (default: video)
 * @param {boolean} [config.preview] - Enables the media preview (load media metadata)
 * @param {boolean} [config.debug] - Enables the debug mode
 * @returns {object} player
 */
export default function html5PlayerFactory($container, config = {}) {
    const type = config.type || 'video';
    const sources = config.sources || [];
    const updateObserver = reminderManagerFactory();
    const timeObserver = timeObserverFactory();

    let $media;
    let media;
    let state = {};

    const getDebugContext = action => {
        const networkState = media && media.networkState;
        const readyState = media && media.readyState;
        return `[html5-${type}(networkState=${networkState},readyState=${readyState}):${action}]`;
    };
    // eslint-disable-next-line
    const debug = (action, ...args) =>
        (config.debug === true || config.debug === action) && window.console.log(getDebugContext(action), ...args);

    return eventifier({
        init() {
            const tpl = 'audio' === type ? audioTpl : videoTpl;
            const page = new UrlParser(window.location);
            let cors = false;
            let preload = config.preview ? 'metadata' : 'none';
            let poster = '';
            let link = '';
            let result = false;

            state = {};

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

            media = $media.get(0);
            result = !!(media && support.checkSupport(media));

            // Remove the browser native controls if we can use the API instead
            if (support.canControl()) {
                $media.removeAttr('controls');
            }

            // Detect stalled video when the timer suddenly jump to the end
            timeObserver.removeAllListeners().on('irregularity', position => {
                if (state.playback && state.stallDetection) {
                    this.stalled(position);
                }
            });

            $media
                .on(`play${ns}`, () => {
                    state.playback = true;
                    state.playedViaApi = false;
                    timeObserver.init(media.currentTime, media.duration);
                    this.trigger('play');
                })
                .on(`pause${ns}`, () => {
                    if (
                        state.stallDetection &&
                        !state.pausedViaApi &&
                        updateObserver.running &&
                        updateObserver.elapsed < 100
                    ) {
                        // The pause event may be triggered after a connectivity issue as the player is out of data
                        this.stalled();
                    }
                    state.pausedViaApi = false;
                    state.playing = false;
                    updateObserver.stop();
                    this.trigger('pause');
                })
                .on(`seeked${ns}`, () => {
                    // When the user try changing the current playing position while the network is down,
                    // the player will end the playback by moving straight to the end.
                    if (state.seekedViaApi && state.seekAt !== media.currentTime) {
                        state.stallDetection = true;
                    }
                    state.seekedViaApi = false;
                })
                .on(`ended${ns}`, () => {
                    updateObserver.forget().stop();
                    timeObserver.update(media.currentTime);
                    state.playback = false;
                    state.playing = false;
                    this.trigger('end');
                })
                .on(`timeupdate${ns}`, () => {
                    state.playing = true;
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

                    // The media may be unreachable straight from the beginning
                    this.detectStalledNetwork();
                })
                .on(`waiting${ns}`, () => {
                    // The "waiting" event means the player is pending data,
                    // it may be the symptom of a connectivity issue
                    this.detectStalledNetwork();
                })
                .on(`error${ns}`, () => {
                    if (media.networkState === HTMLMediaElement.NETWORK_NO_SOURCE) {
                        // No source means the player does not support the supplied media,
                        // there is nothing that we can do from this stage.
                        this.trigger('error');
                    } else {
                        // Other errors need special attention as they can be recoverable
                        this.handleError(media.error);
                    }
                })
                .on('loadedmetadata', () => {
                    timeObserver.init(media.currentTime, media.duration);
                    this.ready();
                })
                .on(`canplay${ns}`, () => {
                    if (!state.stalled) {
                        state.stallDetection = false;
                        this.ready();
                    }
                })
                .on(`stalled${ns}`, () => {
                    // The "stalled" event may be triggered once the player is halted after initialisation,
                    // but this does not mean the playback is actually stalled, hence we only take care of the playing state
                    if (state.playing) {
                        this.handleError(media.error);
                    }
                })
                .on(`playing${ns}`, () => {
                    if (state.stallDetection) {
                        // The "playing" event may occur after a connectivity issue.
                        // For the sake of the stall detection, we need to discard this event
                        return;
                    }
                    updateObserver.forget().start();
                    state.playing = true;
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
            // Discard legitimate and non-blocking errors
            switch (error && error.name) {
                case 'NotAllowedError':
                    debug('api call', 'handleError', 'the autoplay is not allowed without a user interaction', error);
                    return;

                case 'AbortError':
                    debug('api call', 'handleError', 'the action has been aborted for some reason', error);
                    return;
            }

            debug('api call', 'handleError', error);

            // Detect if the playback can continue a bit
            const canContinueTemporarily =
                media &&
                (media.readyState === HTMLMediaElement.HAVE_ENOUGH_DATA ||
                    media.readyState === HTMLMediaElement.HAVE_FUTURE_DATA ||
                    media.readyState === HTMLMediaElement.HAVE_CURRENT_DATA);

            // If a connectivity error occurs we may need to enter in stalled mode unless we can wait a bit
            if (error instanceof MediaError && error.code === MediaError.MEDIA_ERR_NETWORK && !canContinueTemporarily) {
                this.stalled();
                return;
            }

            // To this point, there is a big chance the media is stalled.
            // We start an observer to remind as soon as an irregularity occurs on the time update
            state.stallDetection = true;
            updateObserver.remind(() => {
                // The last time update is a bit old, the media is most probably stalled now
                if (updateObserver.elapsed >= stalledDetectionDelay) {
                    this.stalled();
                }
            }, stalledDetectionDelay);

            updateObserver.start();
        },

        ready() {
            if (!state.ready) {
                state.ready = true;
                this.trigger('ready');
            }
        },

        detectStalledNetwork() {
            // Install an observer that will watch the network state after a small delay.
            // It is needed since the network state may need time to settle.
            setTimeout(() => {
                if (
                    media &&
                    media.networkState === HTMLMediaElement.NETWORK_NO_SOURCE &&
                    media.readyState === HTMLMediaElement.HAVE_NOTHING
                ) {
                    if (!state.ready) {
                        this.trigger('ready');
                    }
                    this.stalled();
                }
            }, stalledDetectionDelay);
        },

        stalled(position) {
            debug('api call', 'stalled');

            if (media) {
                if ('undefined' !== typeof position) {
                    state.stalledAt = position;
                } else {
                    state.stalledAt = timeObserver.position;
                }
            }
            state.stalled = true;
            state.stallDetection = false;
            updateObserver.forget().stop();

            this.pause();
            this.trigger('stalled');
        },

        recover() {
            debug('api call', 'recover');

            state.stalled = false;
            state.stallDetection = false;
            if (media) {
                media.load();
                if (state.stalledAt) {
                    this.seek(state.stalledAt);
                }
                if ((state.playback && !state.playing) || state.playedViaApi) {
                    this.play();
                }
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
            state = {};
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
                state.seekedViaApi = true;
                state.seekAt = media.currentTime;
                timeObserver.seek(media.currentTime);
                if (!state.playback) {
                    this.play();
                }
            }
        },

        play() {
            debug('api call', 'play');

            if (media) {
                state.playedViaApi = true;
                const startPlayPromise = media.play();
                if ('undefined' !== typeof startPlayPromise) {
                    startPlayPromise.catch(error => this.handleError(error));
                }
            }
        },

        pause() {
            debug('api call', 'pause');

            if (media) {
                state.pausedViaApi = true;
                media.pause();
            }
        },

        stop() {
            debug('api call', 'stop');

            if (media && state.playback) {
                media.currentTime = media.duration;
            }
        },

        mute(muted) {
            debug('api call', 'mute', muted);

            if (media) {
                media.muted = !!muted;
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
