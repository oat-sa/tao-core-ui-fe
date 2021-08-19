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
define(['jquery'], function ($) {
    'use strict';

    function mediaMock(element, { videoWidth = 320, videoHeight = 200, readyDelay = 0 } = {}) {
        const $element = $(element);
        const polling = 10;
        let currentTime = 0;
        let duration = 100;
        let pollingHandler;
        let playing = false;
        const stopPolling = () => {
            if (pollingHandler) {
                clearInterval(pollingHandler);
            }
            pollingHandler = null;
        };

        $element
            .on('play', () => {
                if (!pollingHandler) {
                    pollingHandler = setInterval(() => {
                        if (element.currentTime < duration) {
                            element.currentTime += polling;
                            $element.trigger('timeupdate');
                        } else {
                            stopPolling();
                            if (playing) {
                                $element.trigger('ended');
                            }
                        }
                    }, polling);
                }
            })
            .on('ended', stopPolling)
            .on('pause', stopPolling);

        Object.assign(element, {
            networkState: 0,
            readyState: 0,
            currentSrc: '',
            videoWidth,
            videoHeight,
            volume: 1,
            muted: false,
            get duration() {
                return duration;
            },
            set duration(value) {
                duration = value;
            },
            get currentTime() {
                return currentTime;
            },
            set currentTime(value) {
                console.log('update', value);
                if (value >= duration) {
                    currentTime = duration;
                    playing = false;
                    $element.trigger('ended');
                } else {
                    currentTime = value;
                }
            },
            play() {
                $element.trigger('play');
                $element.trigger('playing');
                playing = true;
                return Promise.resolve();
            },
            pause() {
                playing = false;
                $element.trigger('pause');
            }
        });

        setTimeout(() => $element.trigger('canplay'), readyDelay);

        return element;
    }

    return mediaMock;
});
