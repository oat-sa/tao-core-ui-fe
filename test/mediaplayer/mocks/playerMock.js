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
define([
    'jquery',
    'core/eventifier',
    'test/mediaplayer/mocks/mediaMock',
    'tpl!test/mediaplayer/mocks/tpl/player',
    'tpl!test/mediaplayer/mocks/tpl/source'
], function ($, eventifier, mediaMock, playerTpl, sourceTpl) {
    'use strict';

    function playerMockFactory($container, config = {}) {
        const type = config.type || 'video';
        const sources = config.sources || [];
        const polling = config.polling || 10;
        const duration = (config.duration || 100) * polling;

        let playback = false;
        let loaded = false;
        let stalled = false;
        let media;

        const player = {
            init() {
                this.$media = $(playerTpl({ type }));
                $container.append(this.$media);

                media = void 0;
                playback = false;
                loaded = false;
                stalled = false;

                media = mediaMock(this.$media.get(0), { polling, duration });

                this.$media
                    .on('play', () => {
                        playback = true;
                        this.trigger('play');
                    })
                    .on('pause', () => {
                        this.trigger('pause');
                    })
                    .on('ended', () => {
                        playback = false;
                        this.trigger('end');
                    })
                    .on('timeupdate', () => {
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
                    .on('error', () => {
                        if (media.networkState === HTMLMediaElement.NETWORK_NO_SOURCE) {
                            this.trigger('error');
                        } else {
                            this.trigger('recovererror', media.networkState === HTMLMediaElement.NETWORK_LOADING);
                        }
                    })
                    .on('canplay', () => {
                        loaded = true;
                        this.trigger('ready');
                    })
                    .on('stalled', () => {
                        stalled = true;
                        this.trigger('stalled');
                    })
                    .on('playing', () => {
                        stalled = false;
                        this.trigger('playing');
                    });

                sources.forEach(source => {
                    const { src, type } = source;
                    this.addMedia(src, type);
                });

                return true;
            },

            destroy() {
                this.stop();
                this.removeAllListeners();

                if (this.$media) {
                    this.$media.off().remove();
                }

                this.$media = void 0;
                media = void 0;
                playback = false;
                loaded = false;
                stalled = false;
            },

            recover() {
                this.play();
            },

            getMedia() {
                return media;
            },

            getPosition() {
                if (media) {
                    return media.currentTime / polling;
                }
                return 0;
            },

            getDuration() {
                if (media) {
                    return media.duration / polling;
                }
                return 0;
            },

            getVolume() {
                let value = 0;
                if (media) {
                    value = parseFloat(media.volume) * 100;
                }
                return value;
            },

            setVolume(value) {
                if (media) {
                    media.volume = parseFloat(value) / 100;
                }
            },

            setSize(width, height) {
                this.trigger('resize', width, height);
            },

            seek(value) {
                if (media) {
                    media.currentTime = parseFloat(value) * polling;
                    if (!playback) {
                        this.play();
                    }
                }
            },

            play() {
                if (media) {
                    media.play().catch(() => {});
                }
            },

            pause() {
                if (media) {
                    media.pause();
                }
            },

            stop() {
                if (media && playback) {
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

            addMedia(src, type, id) {
                if (this.$media) {
                    this.$media.append(sourceTpl({ src, type, id }));
                    return true;
                }
                return false;
            },

            setMedia(src, type, id) {
                if (this.$media) {
                    this.$media.empty();
                    return this.addMedia(src, type, id);
                }
                return false;
            }
        };

        return eventifier(player);
    }

    return playerMockFactory;
});
