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
import _ from 'lodash';
import eventifier from 'core/eventifier';
import support from 'ui/mediaplayer/support';

/**
 * Enables the debug mode
 * @type {Boolean}
 */
const debugMode = false;

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
 * Defines a player object dedicated to the native HTML5 player
 * @param {mediaplayer} mediaplayer
 * @returns {Object} player
 */
export default function html5PlayerFactory(mediaplayer) {
    let $media;
    let media;
    let played;
    let stalled = false;

    const player = {
        init() {
            let result = false;
            let mediaElem;

            $media = mediaplayer.$media;
            media = null;
            played = false;

            if ($media) {
                mediaElem = $media.get(0);
                if (mediaElem && mediaElem.canPlayType) {
                    media = mediaElem;
                    result = true;
                }

                if (!!support.canControl()) {
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

                if (debugMode) {
                    // install debug logger
                    mediaEvents.forEach(ev => {
                        $media.on(ev + ns, e => {
                            window.console.log(
                                e.type,
                                $media && $media.find('source').attr('src'),
                                'networkState', media && media.networkState,
                                'readyState', media && media.readyState
                            );
                        });
                    });
                }
            }

            return result;
        },

        destroy() {
            if ($media) {
                $media.off(ns).attr('controls', '');
            }

            this.stop();
            this.removeAllListeners();

            $media = null;
            media = null;
            played = false;
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

        addMedia(url, type) {
            if (media) {
                if (!support.checkSupport(media, type)) {
                    return false;
                }
            }

            if (url && $media) {
                $media.append(`<source src="${url}" type="${type}" />`);
                return true;
            }
            return false;
        },

        setMedia(url, type) {
            if ($media) {
                $media.empty();
                return this.addMedia(url, type);
            }
            return false;
        }
    };

    return eventifier(player);
}