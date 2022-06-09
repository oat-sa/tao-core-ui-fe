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

/**
 * CDN for the YouTube API
 * @type {String}
 */
const youtubeApi = 'https://www.youtube.com/iframe_api';

/**
 * A Regex to extract ID from Youtube URLs
 * @type {RegExp}
 */
const reYoutube = /([?&\/]v[=\/])([\w-]+)([&\/]?)/;

/**
 * Installs a Youtube player. The Youtube API must be ready
 * @param {String|jQuery|HTMLElement} elem
 * @param {Object} player
 * @param {Object} [options]
 * @param {Boolean} [options.controls]
 */
function addYoutubePlayer(elem, player, options = {}) {
    const $elem = $(elem);

    new window.YT.Player($elem.get(0), {
        height: '360',
        width: '640',
        videoId: $elem.data('videoId'),
        playerVars: {
            //hd: true,
            autoplay: 0,
            controls: options && options.controls ? 1 : 0,
            rel: 0,
            showinfo: 0,
            wmode: 'transparent',
            modestbranding: 1,
            disablekb: 1,
            playsinline: 1,
            enablejsapi: 1,
            origin: location.hostname
        },
        events: {
            onReady: ev => player.onReady(ev),
            onStateChange: ev => player.onStateChange(ev)
        }
    });
}

/**
 * A local manager for Youtube players.
 * Relies on https://developers.google.com/youtube/iframe_api_reference
 * @type {Object}
 */
export default function youtubeManagerFactory() {
    // The Youtube API injection state
    let injected = false;

    // The Youtube API ready state
    let ready = false;

    // A list of pending players
    let pending = [];

    /**
     * Checks if the Youtube API is ready to use
     * @returns {Boolean}
     */
    function isApiReady() {
        const apiReady = typeof window.YT !== 'undefined' && typeof window.YT.Player !== 'undefined';
        if (apiReady && !ready) {
            ready = true;
            pending.forEach(args => {
                if (args) {
                    addYoutubePlayer(...args);
                }
            });
            pending = [];
        }
        return apiReady;
    }

    /**
     * Injects the Youtube API into the page
     */
    function injectApi() {
        if (!isApiReady()) {
            window.require([youtubeApi], () => {
                const check = () => {
                    if (!isApiReady()) {
                        setTimeout(check, 100);
                    }
                };
                check();
            });
        }

        injected = true;
    }

    return {
        /**
         * Adds a Youtube player
         * @param {String|jQuery|HTMLElement} elem
         * @param {Object} player
         * @param {Object} [options]
         * @param {Boolean} [options.controls]
         */
        add(elem, player, options) {
            if (ready) {
                addYoutubePlayer(elem, player, options);
            } else {
                pending.push([elem, player, options]);

                if (!injected) {
                    injectApi();
                }
            }
        },

        /**
         * Removes a pending Youtube player
         * @param {String|jQuery|HTMLElement} elem
         * @param {Object} player
         */
        remove(elem, player) {
            pending.forEach((args, idx) => {
                if (args && elem === args[0] && player === args[1]) {
                    pending[idx] = null;
                }
            });
        },

        /**
         * Extracts the ID of a Youtube video from an URL
         * @param {String} url
         * @returns {String}
         */
        extractYoutubeId(url) {
            const res = reYoutube.exec(url);
            return (res && res[2]) || url;
        }
    };
}
