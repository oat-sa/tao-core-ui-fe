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
define(['jquery', 'core/eventifier'], function ($, eventifier) {
    'use strict';

    const registry = new Map();
    let index = 0;
    let delay = 0;

    const STATE_ENDED = 0;
    const STATE_PLAYING = 1;
    const STATE_PAUSED = 2;

    const reYoutube = /([?&/]v[=/])([\w-]+)([&/]?)/;

    function youtubeManagerMockFactory() {
        return {
            add(elem, player, options) {
                player._key = player._key || `K${index++}`;
                registry.set(player._key, player);

                setTimeout(() => {
                    if (!registry.has(player._key)) {
                        return;
                    }
                    const $elem = $(elem);
                    let mute = false;
                    let state = STATE_ENDED;
                    let volume = 100;
                    const target = eventifier({
                        position: 0,
                        duration: 100,

                        getIframe() {
                            return elem;
                        },
                        addEventListener(ev, cb) {
                            this.on(ev, cb);
                        },
                        removeEventListener(ev) {
                            this.off(ev);
                        },
                        destroy() {
                            registry.delete(player._key);
                        },
                        getCurrentTime() {
                            return this.position;
                        },
                        getDuration() {
                            return this.duration;
                        },
                        getVolume() {
                            return volume;
                        },
                        setVolume(value) {
                            volume = value;
                        },
                        seekTo(value) {
                            this.position = value;
                            if (state !== STATE_PAUSED) {
                                this.playVideo();
                            }
                        },
                        playVideo() {
                            state = STATE_PLAYING;
                            player.onStateChange({
                                data: state
                            });
                        },
                        pauseVideo() {
                            state = STATE_PAUSED;
                            player.onStateChange({
                                data: state
                            });
                        },
                        stopVideo() {
                            state = STATE_ENDED;
                            player.onStateChange({
                                data: state
                            });
                        },
                        mute() {
                            mute = true;
                        },
                        unMute() {
                            mute = false;
                        },
                        isMuted() {
                            return mute;
                        },
                        cueVideoById(id) {
                            const list = $elem.attr('data-video-list').split(',');
                            if (list.length && !list[0]) {
                                list[0] = id;
                            } else {
                                list.push(id);
                            }
                            $elem.attr('data-video-list', list.join(','));
                        },
                        loadVideoById(id) {
                            $elem.attr('data-video-list', '');
                            $elem.attr('data-video-id', id);
                        }
                    });

                    $elem.attr('data-video-list', '');
                    $elem.attr('data-option-controls', options.controls);

                    player.onReady({ target });
                }, delay);
            },
            remove(elem, player) {
                registry.delete(player._key);
            },
            extractYoutubeId(url) {
                const res = reYoutube.exec(url);
                return (res && res[2]) || url;
            }
        };
    }

    youtubeManagerMockFactory.setDelay = value => (delay = value);

    return youtubeManagerMockFactory;
});
