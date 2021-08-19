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
import eventifier from 'core/eventifier';
import support from 'ui/mediaplayer/support';
import youtubeManagerFactory from 'ui/mediaplayer/youtubeManager';
import youtubeTpl from 'ui/mediaplayer/tpl/youtube';

/**
 * The polling interval used to update the progress bar while playing a YouTube video.
 * Note : the YouTube API does not provide events to update this progress bar...
 * @type {Number}
 */
const youtubePolling = 100;

/**
 * A Regex to extract ID from Youtube URLs
 * @type {RegExp}
 */
const reYoutube = /([?&\/]v[=\/])([\w-]+)([&\/]?)/;

/**
 * List of YouTube events that can be listened to for debugging
 * @type {String[]}
 */
const youtubeEvents = [
    'onApiChange',
    'onError',
    'onPlaybackQualityChange',
    'onPlaybackRateChange',
    'onStateChange'
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
    'ready',
    'resize',
    'timeupdate'
];

/**
 * Extracts the ID of a Youtube video from an URL
 * @param {String} url
 * @returns {String}
 */
const extractYoutubeId = url => {
    const res = reYoutube.exec(url);
    return (res && res[2]) || url;
};

/**
 * A local manager for Youtube players.
 * Relies on https://developers.google.com/youtube/iframe_api_reference
 * @type {Object}
 */
const youtubeManager = youtubeManagerFactory();

/**
 * Defines a player object dedicated to youtube media
 * @param {jQuery} $container - Where to render the player
 * @param {Object} config - The list of config entries
 * @param {Array} config.sources - The list of media sources
 * @param {Boolean} [config.debug] - Enables the debug mode
 * @param {Number} [config.polling=100] - The polling interval used to update the progress bar while playing a YouTube video.
 * @returns {Object} player
 */
export default function youtubePlayerFactory($container, config = {}) {
    const sources = config.sources || [];
    const source = sources[0] || {};
    const otherSources = sources.slice(1);

    config.polling = config.polling || youtubePolling;

    let $media;
    let media;
    let interval;
    let destroyed;
    let initWidth;
    let initHeight;
    let callbacks = [];

    // eslint-disable-next-line
    const debug = (action, ...args) => (config.debug && window.console.log(`[youtube:${action}]`, ...args));

    const queueMedia = (url, register) => {
        const id = extractYoutubeId(url);
        if (id) {
            if (media) {
                register(id);
            } else {
                callbacks.push(() => register(id));
            }
            return true;
        }
        return false;
    };

    const player = {
        init() {
            $media = $(youtubeTpl({
                src: source.src,
                id: extractYoutubeId(source.src)
            }));
            $container.append($media);
            otherSources.forEach(source => this.addMedia(source.src));

            media = null;
            destroyed = false;

            youtubeManager.add($media, this, {
                controls: !support.canControl()
            });

            return true;
        },

        onReady(event) {
            media = event.target;
            $media = $(media.getIframe()); // the injected media placeholder is replaced by an iframe by the YouTube lib

            if (!destroyed) {
                // install debug logger
                if (config.debug) {
                    debug('installed', media);
                    youtubeEvents.forEach(eventName => media.addEventListener(eventName, e => {
                        debug('media event', eventName, $media && $media.data('videoSrc'), e);
                    }));
                    playerEvents.forEach(eventName => {
                        this.on(eventName, (...args) => {
                            debug('player event', eventName, $media && $media.data('videoSrc'), ...args);
                        });
                    });
                }

                if (initWidth && initHeight) {
                    this.setSize(initWidth, initHeight);
                }

                callbacks.forEach(cb => cb());
                callbacks = [];

                this.trigger('ready');
            } else {
                this.destroy();
            }
        },

        onStateChange(event) {
            this.stopPolling();

            if (!destroyed) {
                switch (event.data) {
                    // ended
                    case 0:
                        this.trigger('end');
                        break;

                    // playing
                    case 1:
                        this.trigger('play');
                        this.startPolling();
                        break;

                    // paused
                    case 2:
                        this.trigger('pause');
                        break;
                }
            }
        },

        stopPolling() {
            if (interval) {
                window.clearInterval(interval);
                interval = null;
            }
        },

        startPolling() {
            interval = window.setInterval(() => this.trigger('timeupdate'), config.polling);
        },

        destroy() {
            debug('api call', 'destroy');

            destroyed = true;

            this.stopPolling();
            this.removeAllListeners();

            if (media) {
                youtubeEvents.forEach(ev => media.removeEventListener(ev));
                media.destroy();
                media = void(0);
            } else {
                youtubeManager.remove($media, this);
            }

            if ($media) {
                $media.remove();
                $media = void(0);
            }
        },

        getMedia() {
            debug('api call', 'getMedia');

            return media;
        },

        getPosition() {
            debug('api call', 'getPosition');

            if (media) {
                return media.getCurrentTime();
            }
            return 0;
        },

        getDuration() {
            debug('api call', 'getDuration');

            if (media) {
                return media.getDuration();
            }
            return 0;
        },

        getVolume() {
            debug('api call', 'getVolume');

            if (media) {
                return media.getVolume();
            }
            return 0;
        },

        setVolume(value) {
            debug('api call', 'setVolume', value);

            if (media) {
                media.setVolume(parseFloat(value));
            }
        },

        setSize(width, height) {
            debug('api call', 'setSize', width, height);

            this.trigger('resize', width, height);

            if (!media) {
                initWidth = width;
                initHeight = height;
            }
        },

        seek(value) {
            debug('api call', 'seek', value);

            if (media) {
                media.seekTo(parseFloat(value), true);
            }
        },

        play() {
            debug('api call', 'play');

            if (media) {
                media.playVideo();
            }
        },

        pause() {
            debug('api call', 'pause');

            if (media) {
                media.pauseVideo();
            }
        },

        stop() {
            debug('api call', 'stop');

            if (media) {
                media.stopVideo();
                this.trigger('end');
            }
        },

        mute(state) {
            debug('api call', 'mute', state);

            if (media) {
                media[state ? 'mute' : 'unMute']();
            }
        },

        isMuted() {
            debug('api call', 'isMuted');

            if (media) {
                return media.isMuted();
            }
            return false;
        },

        addMedia(url) {
            debug('api call', 'addMedia', url);

            return queueMedia(url, id => media && media.cueVideoById(id));
        },

        setMedia(url) {
            debug('api call', 'setMedia', url);

            callbacks = [];
            return queueMedia(url, id => media && media.loadVideoById(id));
        }
    };

    return eventifier(player);
}
