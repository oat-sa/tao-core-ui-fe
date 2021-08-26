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

/**
 * A Regex to detect Apple mobile browsers
 * @type {RegExp}
 */
const reAppleMobiles = /ip(hone|od)/i;

/**
 * A list of MIME types with codec declaration
 * @type {Object}
 */
const supportedMimeTypes = {
    // video
    'video/webm': 'video/webm; codecs="vp8, vorbis"',
    'video/mp4': 'video/mp4; codecs="avc1.42E01E, mp4a.40.2"',
    'video/ogg': 'video/ogg; codecs="theora, vorbis"',
    // audio
    'audio/mpeg': 'audio/mpeg;',
    'audio/mp4': 'audio/mp4; codecs="mp4a.40.5"',
    'audio/ogg': 'audio/ogg; codecs="vorbis"',
    'audio/wav': 'audio/wav; codecs="1"'
};

/**
 * Support detection
 * @type {Object}
 */
export default {
    /**
     * Checks if the browser can play media
     * @param {HTMLMediaElement} media The media element on which check support
     * @param {String} [mimeType] An optional MIME type to precise the support
     * @returns {Boolean}
     * @private
     */
    checkSupport(media, mimeType) {
        const support = !!media.canPlayType;

        if (support && mimeType) {
            return !!media.canPlayType(supportedMimeTypes[mimeType] || mimeType).replace(/no/, '');
        }

        return support;
    },

    /**
     * Checks if the browser can play video and audio
     * @param {String} [type] The type of media (audio or video)
     * @param {String} [mime] A media MIME type to check
     * @returns {Boolean}
     */
    canPlay(type, mime) {
        if (type) {
            switch (type.toLowerCase()) {
                case 'audio':
                    return this.canPlayAudio(mime);

                case 'youtube':
                    return this.canPlayVideo();

                case 'video':
                    return this.canPlayVideo(mime);

                default:
                    return false;
            }
        }
        return this.canPlayAudio() && this.canPlayVideo();
    },

    /**
     * Checks if the browser can play audio
     * @param {String} [mime] A media MIME type to check
     * @returns {Boolean}
     */
    canPlayAudio(mime) {
        return this.checkSupport(document.createElement('audio'), mime);
    },

    /**
     * Checks if the browser can play video
     * @param {String} [mime] A media MIME type to check
     * @returns {Boolean}
     */
    canPlayVideo(mime) {
        return this.checkSupport(document.createElement('video'), mime);
    },

    /**
     * Checks if the browser allows to control the media playback
     * @returns {Boolean}
     */
    canControl() {
        return !reAppleMobiles.test(window.navigator.userAgent);
    }
};
