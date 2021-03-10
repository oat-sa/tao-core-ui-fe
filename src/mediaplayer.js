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
 * Copyright (c) 2015 (original work) Open Assessment Technologies SA ;
 */
/**
 * @author Jean-Sébastien Conan <jean-sebastien.conan@vesperiagroup.com>
 */

import $ from 'jquery';
import _ from 'lodash';
import async from 'async';
import UrlParser from 'util/urlParser';
import eventifier from 'core/eventifier';
import mimetype from 'core/mimetype';
import store from 'core/store';
import playerTpl from 'ui/mediaplayer/tpl/player';
import 'ui/mediaplayer/css/player.css';
import 'nouislider';

/**
 * Enable the debug mode
 * @type {boolean}
 * @private
 */
const _debugMode = false;

/**
 * CSS namespace
 * @type {String}
 * @private
 */
const _ns = '.mediaplayer';

/**
 * A Regex to extract ID from Youtube URLs
 * @type {RegExp}
 * @private
 */
const _reYoutube = /([?&\/]v[=\/])([\w-]+)([&\/]?)/;

/**
 * A Regex to detect Apple mobile browsers
 * @type {RegExp}
 * @private
 */
const _reAppleMobiles = /ip(hone|od)/i;

/**
 * Array slice method needed to slice arguments
 * @type {Function}
 * @private
 */
const _slice = [].slice;

/**
 * Minimum value of the volume
 * @type {Number}
 * @private
 */
const _volumeMin = 0;

/**
 * Maximum value of the volume
 * @type {Number}
 * @private
 */
const _volumeMax = 100;

/**
 * Range value of the volume
 * @type {Number}
 * @private
 */
const _volumeRange = _volumeMax - _volumeMin;

/**
 * Threshold (minium requires space above the player) to display the volume
 * above the bar.
 * @type {Number}
 */
const volumePositionThreshold = 200;

/**
 * Some default values
 * @type {Object}
 * @private
 */
const _defaults = {
    type: 'video/mp4',
    video: {
        width: '100%',
        height: 'auto'
    },
    audio: {
        width: '100%',
        height: 'auto'
    },
    youtube: {
        width: 640,
        height: 360
    },
    options: {
        volume: Math.floor(_volumeRange * 0.8),
        startMuted: false,
        maxPlays: 0,
        replayTimeout: 0,
        canPause: true,
        canSeek: true,
        loop: false,
        autoStart: false
    }
};

/**
 * A list of MIME types with codec declaration
 * @type {Object}
 * @private
 */
const _mimeTypes = {
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
 * Extracts the ID of a Youtube video from an URL
 * @param {String} url
 * @returns {String}
 * @private
 */
const _extractYoutubeId = function (url) {
    const res = _reYoutube.exec(url);
    return (res && res[2]) || url;
};

/**
 * Ensures a value is a number
 * @param {Number|String} value
 * @returns {Number}
 * @private
 */
const _ensureNumber = function (value) {
    value = parseFloat(value);
    return isFinite(value) ? value : 0;
};

/**
 * Format a number to string with leading zeros
 * @param {Number} n
 * @param {Number} len
 * @returns {String}
 * @private
 */
const _leadingZero = function (n, len) {
    let value = n.toString();
    while (value.length < len) {
        value = `0${value}`;
    }
    return value;
};

/**
 * Formats a time value to string
 * @param {Number} time
 * @returns {String}
 * @private
 */
const _timerFormat = function (time) {
    const seconds = Math.floor(time % 60);
    const minutes = Math.floor(time / 60) % 60;
    const hours = Math.floor(time / 3600);
    const parts = [];

    if (hours) {
        parts.push(hours);
    }
    parts.push(_leadingZero(minutes, 2));
    parts.push(_leadingZero(seconds, 2));

    return parts.join(':');
};

/**
 * Checks if a type needs to be adjusted
 * @param {String} type
 * @returns {Boolean}
 * @private
 */
const _needTypeAdjust = function (type) {
    return 'string' === typeof type && type.indexOf('application') === 0;
};

/**
 * Adjust bad type by apllying heuristic on URI
 * @param {Object|String} source
 * @returns {String}
 * @private
 */
const _getAdjustedType = function (source) {
    let type = 'video/ogg';
    const url = (source && source.src) || source;
    const ext = url && url.substr(-4);
    if (ext === '.ogg' || ext === '.oga') {
        type = 'audio/ogg';
    }
    return type;
};

/**
 * Extract a list of media sources from a config object
 * @param {Object} config
 * @returns {Array}
 * @private
 */
const _configToSources = function (config) {
    let sources = config.sources || [];
    let url = config.url;

    if (!_.isArray(sources)) {
        sources = [sources];
    }

    if (url) {
        if (!_.isArray(config.url)) {
            url = [url];
        }
        sources = sources.concat(url);
    }

    return sources;
};

/**
 * Checks if the browser can play media
 * @param {HTMLMediaElement} media The media element on which check support
 * @param {String} [mimeType] An optional MIME type to precise the support
 * @returns {Boolean}
 * @private
 */
const _checkSupport = function (media, mimeType) {
    let support = !!media.canPlayType;
    if (mimeType && support) {
        support = !!media.canPlayType(_mimeTypes[mimeType] || mimeType).replace(/no/, '');
    }
    return support;
};

/**
 * Checks if the browser can play media
 * @param {String} sizeProps Width or Height
 * @returns {Boolean}
 * @private
 */
const _isResponsiveSize = function (sizeProps) {
    return /%/.test(sizeProps) || sizeProps === 'auto';
};

/**
 * Support dection
 * @type {Object}
 * @private
 */
const _support = {
    /**
     * Checks if the browser can play video and audio
     * @param {String} [type] The type of media (audio or video)
     * @param {String} [mime] A media MIME type to check
     * @returns {Boolean}
     */
    canPlay: function canPlay(type, mime) {
        if (type) {
            switch (type.toLowerCase()) {
                case 'audio':
                    return this.canPlayAudio(mime);
                case 'youtube':
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
    canPlayAudio: function canPlayAudio(mime) {
        if (!this._mediaAudio) {
            this._mediaAudio = document.createElement('audio');
        }

        return _checkSupport(this._mediaAudio, mime);
    },

    /**
     * Checks if the browser can play video
     * @param {String} [mime] A media MIME type to check
     * @returns {Boolean}
     */
    canPlayVideo: function canPlayVideo(mime) {
        if (!this._mediaVideo) {
            this._mediaVideo = document.createElement('video');
        }

        return _checkSupport(this._mediaVideo, mime);
    },

    /**
     * Checks if the browser allows to control the media playback
     * @returns {Boolean}
     */
    canControl: function canControl() {
        return !_reAppleMobiles.test(navigator.userAgent);
    }
};

/**
 * A local manager for Youtube players.
 * Relies on https://developers.google.com/youtube/iframe_api_reference
 * @type {Object}
 * @private
 */
const _youtubeManager = {
    /**
     * The Youtube API injection state
     * @type {Boolean}
     */
    injected: false,

    /**
     * The Youtube API ready state
     * @type {Boolean}
     */
    ready: false,

    /**
     * A list of pending players
     * @type {Array}
     */
    pending: [],

    /**
     * Add a Youtube player
     * @param {String|jQuery|HTMLElement} elem
     * @param {Object} player
     * @param {Object} [options]
     * @param {Boolean} [options.controls]
     */
    add: function add(elem, player, options) {
        if (this.ready) {
            this.create(elem, player, options);
        } else {
            this.pending.push([elem, player, options]);

            if (!this.injected) {
                this.injectApi();
            }
        }
    },

    /**
     * Removes a pending Youtube player
     * @param {String|jQuery|HTMLElement} elem
     * @param {Object} player
     */
    remove: function remove(elem, player) {
        const pending = this.pending;
        _.forEach(pending, function (args, idx) {
            if (args && elem === args[0] && player === args[1]) {
                pending[idx] = null;
            }
        });
    },

    /**
     * Install a Youtube player. The Youtube API must be ready
     * @param {String|jQuery|HTMLElement} elem
     * @param {Object} player
     * @param {Object} [options]
     * @param {Boolean} [options.controls]
     */
    create: function create(elem, player, options) {
        let $elem;

        if (!this.ready) {
            return this.add(elem, player, options);
        }

        if (!options) {
            options = {};
        }

        $elem = $(elem);

        new window.YT.Player($elem.get(0), {
            height: '360',
            width: '640',
            videoId: $elem.data('videoId'),
            playerVars: {
                //hd: true,
                autoplay: 0,
                controls: options.controls ? 1 : 0,
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
                onReady: player.onReady.bind(player),
                onStateChange: player.onStateChange.bind(player)
            }
        });
    },

    /**
     * Called when the Youtube API is ready. Should install all pending players.
     */
    apiReady: function apiReady() {
        const pending = this.pending;

        this.pending = [];
        this.ready = true;

        _.forEach(pending, args => {
            if (args) {
                this.create.apply(this, args);
            }
        });
    },

    /**
     * Checks if the Youtube API is ready to use
     * @returns {Boolean}
     */
    isApiReady: function isApiReady() {
        const apiReady = typeof window.YT !== 'undefined' && typeof window.YT.Player !== 'undefined';
        if (apiReady && !this.ready) {
            _youtubeManager.apiReady();
        }
        return apiReady;
    },

    /**
     * Injects the Youtube API into the page
     */
    injectApi: function injectApi() {
        if (!this.isApiReady()) {
            window.require(['https://www.youtube.com/iframe_api'], () => {
                const check = () => {
                    if (!this.isApiReady()) {
                        setTimeout(check, 100);
                    }
                };
                check();
            });
        }

        this.injected = true;
    }
};

/**
 * Defines a player object dedicated to youtube media
 * @param {mediaplayer} mediaplayer
 * @private
 * @returns {Object} player
 */
const _youtubePlayer = function (mediaplayer) {
    let $component;
    let $media;
    let media;
    let player;
    let interval;
    let destroyed;
    let initWidth, initHeight;

    function loopEvents(callback) {
        _.forEach(
            ['onStateChange', 'onPlaybackQualityChange', 'onPlaybackRateChange', 'onError', 'onApiChange'],
            callback
        );
    }

    if (mediaplayer) {
        player = {
            init: function _youtubePlayerInit() {
                $component = mediaplayer.$component;
                $media = mediaplayer.$media;
                media = null;
                destroyed = false;

                if ($media) {
                    _youtubeManager.add($media, this, {
                        controls: mediaplayer.is('nogui')
                    });
                }

                return !!$media;
            },

            onReady: function _youtubePlayerOnReady(event) {
                const callbacks = this._callbacks;

                media = event.target;
                $media = $(media.getIframe());
                this._callbacks = null;

                if (!destroyed) {
                    if (_debugMode) {
                        // install debug logger
                        loopEvents(function (ev) {
                            media.addEventListener(ev, function (e) {
                                window.console.log(ev, e);
                            });
                        });
                    }

                    if (initWidth && initHeight) {
                        this.setSize(initWidth, initHeight);
                    }

                    mediaplayer._onReady();

                    if (callbacks) {
                        _.forEach(callbacks, function (cb) {
                            cb();
                        });
                    }
                } else {
                    this.destroy();
                }
            },

            onStateChange: function _youtubePlayerOnStateChange(event) {
                this.stopPolling();

                if (!destroyed) {
                    switch (event.data) {
                        // ended
                        case 0:
                            mediaplayer._onEnd();
                            break;

                        // playing
                        case 1:
                            mediaplayer._onPlay();
                            this.startPolling();
                            break;

                        // paused
                        case 2:
                            mediaplayer._onPause();
                            break;
                    }
                }
            },

            stopPolling: function _youtubePlayerStopPolling() {
                if (interval) {
                    clearInterval(interval);
                    interval = null;
                }
            },

            startPolling: function _youtubePlayerStartPolling() {
                interval = setInterval(function () {
                    mediaplayer._onTimeUpdate();
                }, mediaplayerFactory.youtubePolling);
            },

            destroy: function _youtubePlayerDestroy() {
                destroyed = true;

                if (media) {
                    loopEvents(function (ev) {
                        media.removeEventListener(ev);
                    });
                    media.destroy();
                } else {
                    _youtubeManager.remove($media, this);
                }

                this.stopPolling();

                $media = null;
                media = null;
            },

            getPosition: function _youtubePlayerGetPosition() {
                if (media) {
                    return media.getCurrentTime();
                }
                return 0;
            },

            getDuration: function _youtubePlayerGetDuration() {
                if (media) {
                    return media.getDuration();
                }
                return 0;
            },

            getVolume: function _youtubePlayerGetVolume() {
                let value = 0;
                if (media) {
                    value = (media.getVolume() * _volumeRange) / 100 + _volumeMin;
                }
                return value;
            },

            setVolume: function _youtubePlayerSetVolume(value) {
                if (media) {
                    media.setVolume(((parseFloat(value) - _volumeMin) / _volumeRange) * 100);
                }
            },

            setSize: function _youtubePlayerSetSize(width, height) {
                if ($component) {
                    $component.width(width).height(height);
                }
                if (!media) {
                    initWidth = width;
                    initHeight = height;
                }
            },

            seek: function _youtubePlayerSeek(value) {
                if (media) {
                    media.seekTo(parseFloat(value), true);
                }
            },

            play: function _youtubePlayerPlay() {
                if (media) {
                    media.playVideo();
                }
            },

            pause: function _youtubePlayerPause() {
                if (media) {
                    media.pauseVideo();
                }
            },

            stop: function _youtubePlayerStop() {
                if (media) {
                    media.stopVideo();
                    mediaplayer._onEnd();
                }
            },

            mute: function _youtubePlayerMute(state) {
                if (media) {
                    media[state ? 'mute' : 'unMute']();
                }
            },

            isMuted: function _youtubePlayerIsMuted() {
                if (media) {
                    return media.isMuted();
                }
                return false;
            },

            addMedia: function _youtubePlayerSetMedia(url) {
                const id = _extractYoutubeId(url);
                const cb =
                    id &&
                    function () {
                        media.cueVideoById(id);
                    };
                if (cb) {
                    if (media) {
                        cb();
                    } else {
                        this._callbacks = this._callbacks || [];
                        this._callbacks.push(cb);
                    }
                    return true;
                }
                return false;
            },

            setMedia: function _youtubePlayerSetMedia(url) {
                const id = _extractYoutubeId(url);
                const cb =
                    id &&
                    function () {
                        media.loadVideoById(id);
                    };
                if (cb) {
                    if (media) {
                        cb();
                    } else {
                        this._callbacks = [cb];
                    }
                    return true;
                }
                return false;
            }
        };
    }

    return player;
};

/**
 * Defines a player object dedicated to native player
 * @param {mediaplayer} mediaplayer
 * @returns {Object} player
 * @private
 */
const _nativePlayer = function (mediaplayer) {
    let $component;
    let $media;
    let media;
    let player;
    let played;

    if (mediaplayer) {
        player = {
            init: function _nativePlayerInit() {
                let result = false;
                let mediaElem;

                $component = mediaplayer.$component;
                $media = mediaplayer.$media;
                media = null;
                played = false;

                if ($media) {
                    mediaElem = $media.get(0);
                    if (mediaElem && mediaElem.canPlayType) {
                        media = mediaElem;
                        result = true;
                    }

                    if (!mediaplayer.is('nogui')) {
                        $media.removeAttr('controls');
                    }

                    $media
                        .on(`play${_ns}`, function () {
                            played = true;
                            mediaplayer._onPlay();
                        })
                        .on(`pause${_ns}`, function () {
                            mediaplayer._onPause();
                        })
                        .on(`ended${_ns}`, function () {
                            played = false;
                            mediaplayer._onEnd();
                        })
                        .on(`timeupdate${_ns}`, function () {
                            mediaplayer._onTimeUpdate();
                        })
                        .on('loadstart', function () {
                            if (media.networkState === HTMLMediaElement.NETWORK_NO_SOURCE) {
                                mediaplayer._onError();
                            }
                        })
                        .on(`error${_ns}`, function () {
                            if (media.networkState === HTMLMediaElement.NETWORK_NO_SOURCE) {
                                mediaplayer._onError();
                            } else {
                                mediaplayer._onRecoverError();

                                // recover from playing error
                                if (
                                    media.networkState === HTMLMediaElement.NETWORK_LOADING &&
                                    mediaplayer.is('playing')
                                ) {
                                    mediaplayer.render();
                                }
                            }
                        })
                        .on(`loadedmetadata${_ns}`, function () {
                            if (mediaplayer.is('error')) {
                                mediaplayer._onRecoverError();
                            }
                            mediaplayer._onReady();
                        });

                    if (_debugMode) {
                        // install debug logger
                        _.forEach(
                            [
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
                                'loadedfirstframe',
                                'loadedmetadata',
                                'loadstart',
                                'pause',
                                'play',
                                'progress',
                                'ratechange',
                                'seeked',
                                'seeking',
                                'suspend',
                                'timeupdate',
                                'volumechange',
                                'waiting'
                            ],
                            function (ev) {
                                $media.on(ev + _ns, function (e) {
                                    window.console.log(
                                        e.type,
                                        $media && $media.find('source').attr('src'),
                                        media && media.networkState
                                    );
                                });
                            }
                        );
                    }
                }

                return result;
            },

            destroy: function _nativePlayerDestroy() {
                if ($media) {
                    $media.off(_ns).attr('controls', '');
                }

                this.stop();

                $media = null;
                media = null;
                played = false;
            },

            getPosition: function _nativePlayerGetPosition() {
                if (media) {
                    return media.currentTime;
                }
                return 0;
            },

            getDuration: function _nativePlayerGetDuration() {
                if (media) {
                    return media.duration;
                }
                return 0;
            },

            getVolume: function _nativePlayerGetVolume() {
                let value = 0;
                if (media) {
                    value = parseFloat(media.volume) * _volumeRange + _volumeMin;
                }
                return value;
            },

            setVolume: function _nativePlayerSetVolume(value) {
                if (media) {
                    media.volume = (parseFloat(value) - _volumeMin) / _volumeRange;
                }
            },

            setSize: function _nativePlayerSetSize(width, height) {
                if ($component) {
                    $component.width(width).height(height);
                }
            },

            seek: function _nativePlayerSeek(value) {
                if (media) {
                    media.currentTime = parseFloat(value);
                    if (!played) {
                        this.play();
                    }
                }
            },

            play: function _nativePlayerPlay() {
                if (media) {
                    media.play();
                }
            },

            pause: function _nativePlayerPause() {
                if (media) {
                    media.pause();
                }
            },

            stop: function _nativePlayerStop() {
                if (media && played) {
                    media.currentTime = media.duration;
                }
            },

            mute: function _nativePlayerMute(state) {
                if (media) {
                    media.muted = !!state;
                }
            },

            isMuted: function _nativePlayerIsMuted() {
                if (media) {
                    return !!media.muted;
                }
                return false;
            },

            addMedia: function _nativePlayerSetMedia(url, type) {
                type = type || _defaults.type;
                if (media) {
                    if (!_checkSupport(media, type)) {
                        return false;
                    }
                }

                if (url && $media) {
                    $media.append(`<source src="${url}" type="${_mimeTypes[type] || type}" />`);
                    return true;
                }
                return false;
            },

            setMedia: function _nativePlayerSetMedia(url, type) {
                if ($media) {
                    $media.empty();
                    return this.addMedia(url, type);
                }
                return false;
            }
        };
    }

    return player;
};

/**
 * Defines the list of available players
 * @type {Object}
 * @private
 */
const _players = {
    audio: _nativePlayer,
    video: _nativePlayer,
    youtube: _youtubePlayer
};

/**
 * Defines a media player object
 * @type {Object}
 */
const mediaplayer = {
    /**
     * Initializes the media player
     * @param {Object} config
     * @param {String} config.type - The type of media to play
     * @param {String|Array} config.url - The URL to the media
     * @param {String|jQuery|HTMLElement} [config.renderTo] - An optional container in which renders the player
     * @param {Boolean} [config.loop] - The media will be played continuously
     * @param {Boolean} [config.canPause] - The play can be paused
     * @param {Boolean} [config.canSeek] - The player allows to reach an arbitrary position within the media using the duration bar
     * @param {Boolean} [config.startMuted] - The player should be initially muted
     * @param {Boolean} [config.autoStart] - The player starts as soon as it is displayed
     * @param {Number} [config.autoStartAt] - The time position at which the player should start
     * @param {Number} [config.maxPlays] - Sets a few number of plays (default: infinite)
     * @param {Number} [config.replayTimeout] - disable the possibility to replay a media after this timeout, in seconds (default: 0)
     * @param {Number} [config.volume] - Sets the sound volume (default: 80)
     * @param {Number} [config.width] - Sets the width of the player (default: depends on media type)
     * @param {Number} [config.height] - Sets the height of the player (default: auto)
     * @returns {mediaplayer}
     */
    init: function init(config) {
        // load the config set, discard null values in order to allow defaults to be set
        this.config = _.omit(config || {}, function (value) {
            return typeof value === 'undefined' || value === null;
        });
        _.defaults(this.config, _defaults.options);
        this._setType(this.config.type || _defaults.type);

        this._reset();
        this._updateVolumeFromStore();
        this._initEvents();
        this._initSources(() => {
            if (!this.is('youtube')) {
                _.each(this.config.sources, source => {
                    if (source && source.type && source.type.indexOf('audio') === 0) {
                        this._setType(source.type);
                        this._initType();
                        return false;
                    }
                });
            }
            if (this.config.renderTo) {
                _.defer(() => {
                    this.render();
                });
            }
        });

        return this;
    },

    /**
     * Uninstalls the media player
     * @returns {mediaplayer}
     */
    destroy: function destroy() {
        /**
         * Triggers a destroy event
         * @event mediaplayer#destroy
         */
        this.trigger('destroy');

        if (this.player) {
            this.player.destroy();
        }

        if (this.$component) {
            this._unbindEvents();
            this._destroySlider(this.$seekSlider);
            this._destroySlider(this.$volumeSlider);

            this.$component.remove();
        }

        this._reset();

        return this;
    },

    /**
     * Renders the media player according to the media type
     * @param {String|jQuery|HTMLElement} [to]
     * @returns {mediaplayer}
     */
    render: function render(to) {
        const renderTo = to || this.config.renderTo || this.$container;

        if (this.$component) {
            this.destroy();
        }

        this._initState();
        this._buildDom();
        this._updateDuration(0);
        this._updatePosition(0);
        this._bindEvents();
        this._playingState(false, true);
        this._initPlayer();
        this._initSize();
        this.resize(this.config.width, this.config.height);
        this.config.is.rendered = true;

        if (renderTo) {
            this.$container = $(renderTo).append(this.$component);
        }

        /**
         * Triggers a render event
         * @event mediaplayer#render
         * @param {jQuery} $component
         */
        this.trigger('render', this.$component);

        return this;
    },

    /**
     * Sets the start position inside the media
     * @param {Number} time - The start position in seconds
     * @param {*} [internal] - Internal use
     * @returns {mediaplayer}
     */
    seek: function seek(time, internal) {
        if (this._canPlay()) {
            this._updatePosition(time, internal);

            this.execute('seek', this.position);

            if (!this.is('ready')) {
                this.autoStartAt = this.position;
            }
            this.loop = !!this.config.loop;
        }

        return this;
    },

    /**
     * Plays the media
     * @param {Number} [time] - An optional start position in seconds
     * @returns {mediaplayer}
     */
    play: function play(time) {
        if (this._canPlay()) {
            if (typeof time !== 'undefined') {
                this.seek(time);
            }

            this.execute('play');

            if (!this.is('ready')) {
                this.autoStart = true;
            }

            this.loop = !!this.config.loop;

            if (this.timerId) {
                cancelAnimationFrame(this.timerId);
            }
        }

        return this;
    },

    /**
     * Pauses the media
     * @param {Number} [time] - An optional time position in seconds
     * @returns {mediaplayer}
     */
    pause: function pause(time) {
        if (this._canPause()) {
            if (typeof time !== 'undefined') {
                this.seek(time);
            }

            this.execute('pause');

            if (!this.is('ready')) {
                this.autoStart = false;
            }
        }

        return this;
    },

    /**
     * Resumes the media
     * @returns {mediaplayer}
     */
    resume: function resume() {
        if (this._canResume()) {
            this.play();
        }

        return this;
    },

    /**
     * Stops the playback
     * @returns {mediaplayer}
     */
    stop: function stop() {
        this.loop = false;
        this.execute('stop');

        if (!this.is('ready')) {
            this.autoStart = false;
        }

        return this;
    },

    /**
     * Restarts the media from the beginning
     * @returns {mediaplayer}
     */
    restart: function restart() {
        this.play(0);

        return this;
    },

    /**
     * Rewind the media to the beginning
     * @returns {mediaplayer}
     */
    rewind: function rewind() {
        this.seek(0);

        return this;
    },

    /**
     * Mutes the media
     * @param {Boolean} [state] - A flag to set the mute state (default: true)
     * @returns {mediaplayer}
     */
    mute: function mute(state) {
        if (typeof state === 'undefined') {
            state = true;
        }
        this.execute('mute', state);
        this._setState('muted', state);

        if (!this.is('ready')) {
            this.startMuted = state;
        }

        return this;
    },

    /**
     * Restore the sound of the media after a mute
     * @returns {mediaplayer}
     */
    unmute: function unmute() {
        this.mute(false);

        return this;
    },

    /**
     * Sets the sound volume of the media being played
     * @param {Number} value - A value between 0 and 100
     * @param {*} [internal] - Internal use
     * @returns {mediaplayer}
     */
    setVolume: function setVolume(value, internal) {
        this._updateVolume(value, internal);

        this.execute('setVolume', this.volume);

        return this;
    },

    /**
     * Gets the sound volume applied to the media being played
     * @returns {Number} Returns a value between 0 and 100
     */
    getVolume: function getVolume() {
        return this.volume;
    },

    /**
     * Gets the current displayed position inside the media
     * @returns {Number}
     */
    getPosition: function getPosition() {
        return this.position;
    },

    /**
     * Gets the duration of the media
     * @returns {Number}
     */
    getDuration: function getDuration() {
        return this.duration;
    },

    /**
     * Gets the number of times the media has been played
     * @returns {Number}
     */
    getTimesPlayed: function getTimesPlayed() {
        return this.timesPlayed;
    },

    /**
     * Gets the type of player
     * @returns {String}
     */
    getType: function getType() {
        return this.type;
    },

    /**
     * Gets the DOM container
     * @returns {jQuery}
     */
    getContainer: function getContainer() {
        if (!this.$container && this.$component) {
            let $container = this.$component.parent();
            if ($container.length) {
                this.$container = $container;
            }
        }
        return this.$container;
    },

    /**
     * Gets the underlying DOM element
     * @returns {jQuery}
     */
    getElement: function getElement() {
        return this.$component;
    },

    /**
     * Gets the list of media
     * @returns {Array}
     */
    getSources: function getSources() {
        return this.config.sources.slice();
    },

    /**
     * Sets the media source. If a source has been already set, it will be replaced.
     * @param {String|Object} src - The media URL, or an object containing the source and the type
     * @param {Function} [callback] - A function called to provide the added media source object
     * @returns {mediaplayer}
     */
    setSource: function setSource(src, callback) {
        this._getSource(src, function (source) {
            this.config.sources = [source];

            if (this.is('rendered')) {
                this.player.setMedia(source.src, source.type);
            }

            if (callback) {
                callback.call(this, source);
            }
        });

        return this;
    },

    /**
     * Adds a media source.
     * @param {String|Object} src - The media URL, or an object containing the source and the type
     * @param {Function} [callback] - A function called to provide the added media source object
     * @returns {mediaplayer}
     */
    addSource: function addSource(src, callback) {
        this._getSource(src, function (source) {
            this.config.sources.push(source);

            if (this.is('rendered')) {
                this.player.addMedia(source.src, source.type);
            }

            if (callback) {
                callback.call(this, source);
            }
        });

        return this;
    },

    /**
     * Tells if the media is in a particular state
     * @param {String} state
     * @returns {Boolean}
     */
    is: function is(state) {
        return !!this.config.is[state];
    },

    /**
     * Changes the size of the player
     * @param {Number} width
     * @param {Number} height
     * @returns {mediaplayer}
     */
    resize: function resize(width, height) {
        this.execute('setSize', width, height);

        return this;
    },

    /**
     * Enables the media player
     * @returns {mediaplayer}
     */
    enable: function enable() {
        this._fromState('disabled');

        return this;
    },

    /**
     * Disables the media player
     * @returns {mediaplayer}
     */
    disable: function disable() {
        this._toState('disabled');
        this.trigger('disabled');

        return this;
    },

    /**
     * Shows the media player
     * @returns {mediaplayer}
     */
    show: function show() {
        this._fromState('hidden');

        return this;
    },

    /**
     * hides the media player
     * @returns {mediaplayer}
     */
    hide: function hide() {
        this._toState('hidden');

        return this;
    },
    /**
     * get media original size
     * @returns {Object}
     */
    getMediaOriginalSize: function getMediaOriginalSize() {
        if (this.is('youtube')) {
            return _defaults.youtube;
        }
        if (this.is('video') && this.$media) {
            return {
                width: this.$media.get(0).videoWidth,
                height: this.$media.get(0).videoHeight
            };
        }

        return {};
    },
    /**
     * Ensures the right media type is set
     * @param {String} type
     * @private
     */
    _setType: function _setType(type) {
        if (type.indexOf('youtube') !== -1) {
            this.type = 'youtube';
        } else if (type.indexOf('audio') === 0) {
            this.type = 'audio';
        } else {
            this.type = 'video';
        }
    },

    /**
     * Ensures the type is correctly applied
     * @private
     */
    _initType: function _initType() {
        const is = this.config.is;
        is.youtube = 'youtube' === this.type;
        is.video = 'video' === this.type || 'youtube' === this.type;
        is.audio = 'audio' === this.type;
    },

    /**
     * Gets a source descriptor.
     * @param {String|Object} src - The media URL, or an object containing the source and the type
     * @param {Function} callback - A function called to provide the media source object
     */
    _getSource: function _getSource(src, callback) {
        let source;
        const done = () => {
            if (_needTypeAdjust(source.type)) {
                source.type = _getAdjustedType(source);
            }

            if (this.is('youtube')) {
                source.id = _extractYoutubeId(source.src);
            }

            callback.call(this, source);
        };

        if (_.isString(src)) {
            source = {
                src: src
            };
        } else {
            source = _.clone(src);
        }

        if (this.is('youtube') && !source.type) {
            source.type = _defaults.type;
        }

        if (!source.type) {
            mimetype.getResourceType(source.src, function (err, type) {
                if (err) {
                    type = _defaults.type;
                }
                source.type = type;
                done();
            });
        } else {
            done();
        }
    },

    /**
     * Ensures the sources are correctly set
     * @param {Function} callback - A function called once all sources have been initialized
     * @private
     */
    _initSources: function _initSources(callback) {
        const sources = _configToSources(this.config);

        this.config.sources = [];

        async.each(
            sources,
            (source, cb) => {
                this.addSource(source, function (src) {
                    cb(null, src);
                });
            },
            callback
        );
    },

    /**
     * Installs the events manager onto the instance
     * @private
     */
    _initEvents: function _initEvents() {
        eventifier(this);

        const triggerEvent = this.trigger;
        this.trigger = function trigger(eventName) {
            if (this.$component) {
                this.$component.trigger(eventName + _ns, _slice.call(arguments, 1));
            }
            return triggerEvent.apply(this, arguments);
        };
    },

    /**
     * Ensures the right size is set according to the media type
     * @private
     */
    _initSize: function _initSize() {
        const type = this.is('video') ? 'video' : 'audio';
        const defaults = _defaults[type] || _defaults.video;

        this.config.width = this.config.width || defaults.width;
        this.config.height = 'auto';
    },

    /**
     * Initializes the right player instance
     * @private
     */
    _initPlayer: function _initPlayer() {
        const player = _players[this.type];
        let error;

        if (_support.canPlay(this.type)) {
            if (_.isFunction(player)) {
                this.player = player(this);
            }

            if (this.player) {
                error = !this.player.init();
            } else {
                error = true;
            }
        } else {
            error = true;
        }

        this._setState('error', error);
        this._setState('nogui', !_support.canControl());
        this._setState('loading', true);
    },

    /**
     * Initializes the player state
     * @private
     */
    _initState: function _initState() {
        let isCORS = false;
        let page;

        if (!this.is('youtube')) {
            page = new UrlParser(window.location);
            isCORS = _.some(this.config.sources, function (source) {
                return !page.sameDomain(source.src);
            });
        }

        this._setState('cors', isCORS);
        this._setState('ready', false);
    },

    /**
     * Resets the internals attributes
     * @private
     */
    _reset: function _reset() {
        this.config.is = {};
        this._initType();

        this.$component = null;
        this.$container = null;
        this.$player = null;
        this.$media = null;
        this.$controls = null;
        this.$seek = null;
        this.$seekSlider = null;
        this.$sound = null;
        this.$volume = null;
        this.$volumeControl = null;
        this.$volumeSlider = null;
        this.$position = null;
        this.$duration = null;
        this.player = null;

        this.duration = 0;
        this.position = 0;
        this.timesPlayed = 0;

        this.volume = this.config.volume;
        this.autoStart = this.config.autoStart;
        this.autoStartAt = this.config.autoStartAt;
        this.startMuted = this.config.startMuted;
    },

    /**
     * Builds the DOM content
     * @private
     */
    _buildDom: function _buildDom() {
        const configForTemplate = _.clone(this.config);
        configForTemplate.type = this.type;
        this.$component = $(playerTpl(configForTemplate));
        this.$player = this.$component.find('.player');
        this.$media = this.$component.find('.media');
        this.$controls = this.$component.find('.controls');

        this.$seek = this.$controls.find('.seek .slider');
        this.$sound = this.$controls.find('.sound');
        this.$volumeControl = this.$controls.find('.volume');
        this.$volume = this.$controls.find('.volume .slider');
        this.$position = this.$controls.find('[data-control="time-cur"]');
        this.$duration = this.$controls.find('[data-control="time-end"]');

        this.$volumeSlider = this._renderSlider(this.$volume, this.volume, _volumeMin, _volumeMax, true);
    },

    /**
     * Renders a slider onto an element
     * @param {jQuery} $elt - The element on which renders the slider
     * @param {Number} [value] - The current value of the slider
     * @param {Number} [min] - The min value of the slider
     * @param {Number} [max] - The max value of the slider
     * @param {Boolean} [vertical] - Tells if the slider must be vertical
     * @returns {jQuery} - Returns the element
     * @private
     */
    _renderSlider: function _renderSlider($elt, value, min, max, vertical) {
        let orientation, direction;

        if (vertical) {
            orientation = 'vertical';
            direction = 'rtl';
        } else {
            orientation = 'horizontal';
            direction = 'ltr';
        }

        return $elt.noUiSlider({
            start: _ensureNumber(value) || 0,
            step: 1,
            connect: 'lower',
            orientation: orientation,
            direction: direction,
            animate: true,
            range: {
                min: _ensureNumber(min) || 0,
                max: _ensureNumber(max) || 0
            }
        });
    },

    /**
     * Destroys a slider bound to an element
     * @param {jQuery} $elt
     * @private
     */
    _destroySlider: function _destroySlider($elt) {
        if ($elt) {
            $elt.get(0).destroy();
        }
    },

    /**
     * Binds events onto the rendered player
     * @private
     */
    _bindEvents: function _bindEvents() {
        let overing = false;

        this.$component.on(`contextmenu${_ns}`, function (event) {
            event.preventDefault();
        });

        this.$controls.on(`click${_ns}`, '.action', event => {
            const $target = $(event.target);
            const $action = $target.closest('.action');
            const id = $action.data('control');

            if (_.isFunction(this[id])) {
                this[id]();
            }
        });

        this.$player.on(`click${_ns}`, () => {
            if (this.is('playing')) {
                this.pause();
            } else {
                this.play();
            }
        });

        this.$seek.on(`change${_ns}`, (event, value) => {
            this.seek(value, true);
        });

        $(document).on(`updateVolume${_ns}`, (event, value) => {
            this.setVolume(value);
        });

        this.$volume.on(`change${_ns}`, (event, value) => {
            this.unmute();
            $(document).trigger(`updateVolume${_ns}`, value);
            this.setVolume(value, true);
        });

        this.$sound.on(`mouseover${_ns}`, 'a', () => {
            let position;

            if (!overing && !this.$volumeControl.hasClass('up') && !this.$volumeControl.hasClass('down')) {
                overing = true;
                position = this.$controls[0].getBoundingClientRect();
                if (position && position.top && position.top < volumePositionThreshold) {
                    this.$volumeControl.addClass('down');
                } else {
                    this.$volumeControl.addClass('up');
                }

                //close the volume control after 15s
                this.overingTimer = _.delay(() => {
                    if (this.$volumeControl) {
                        this.$volumeControl.removeClass('up down');
                    }
                    overing = false;
                }, 15000);
                this.$volumeControl.one(`mouseleave${_ns}`, () => {
                    this.$volumeControl.removeClass('up down');
                    overing = false;
                });
            }
        });
    },

    /**
     * Unbinds events from the rendered player
     * @private
     */
    _unbindEvents: function _unbindEvents() {
        this.$component.off(_ns);
        this.$player.off(_ns);
        this.$controls.off(_ns);
        this.$seek.off(_ns);
        this.$volume.off(_ns);

        //if the volume is opened and the player destroyed,
        //prevent the callback to run
        if (this.overingTimer) {
            clearTimeout(this.overingTimer);
        }

        $(document).off(_ns);
    },

    /**
     * Updates the volume slider
     * @param {Number} value
     * @private
     */
    _updateVolumeSlider: function _updateVolumeSlider(value) {
        if (this.$volumeSlider) {
            this.$volumeSlider.val(value);
        }
    },

    /**
     * Updates the displayed volume
     * @param {Number} value
     * @param {*} [internal]
     * @private
     */
    _updateVolume: function _updateVolume(value, internal) {
        this.volume = Math.max(_volumeMin, Math.min(_volumeMax, parseFloat(value)));
        this._storeVolume(this.volume);
        if (!internal) {
            this._updateVolumeSlider(value);
        }
    },

    /**
     * Updates the time slider
     * @param {Number} value
     * @private
     */
    _updatePositionSlider: function _updatePositionSlider(value) {
        if (this.$seekSlider) {
            this.$seekSlider.val(value);
        }
    },

    /**
     * Updates the time label
     * @param {Number} value
     * @private
     */
    _updatePositionLabel: function _updatePositionLabel(value) {
        if (this.$position) {
            this.$position.text(_timerFormat(value));
        }
    },

    /**
     * Updates the displayed time position
     * @param {Number} value
     * @param {*} [internal]
     * @private
     */
    _updatePosition: function _updatePosition(value, internal) {
        this.position = Math.max(0, Math.min(this.duration, parseFloat(value)));

        if (!internal) {
            this._updatePositionSlider(this.position);
        }
        this._updatePositionLabel(this.position);
    },

    /**
     * Updates the duration slider
     * @param {Number} value
     * @private
     */
    _updateDurationSlider: function _updateDurationSlider(value) {
        if (this.$seekSlider) {
            this._destroySlider(this.$seekSlider);
            this.$seekSlider = null;
        }

        if (value && isFinite(value)) {
            this.$seekSlider = this._renderSlider(this.$seek, 0, 0, value);
            this.$seekSlider.attr('disabled', !this.config.canSeek);
        }
    },

    /**
     * Updates the duration label
     * @param {Number} value
     * @private
     */
    _updateDurationLabel: function _updateDurationLabel(value) {
        if (this.$duration) {
            if (value && isFinite(value)) {
                this.$duration.text(_timerFormat(value)).show();
            } else {
                this.$duration.hide();
            }
        }
    },

    /**
     * Updates the displayed duration
     * @param {Number} value
     * @private
     */
    _updateDuration: function _updateDuration(value) {
        this.duration = Math.abs(parseFloat(value));
        this._updateDurationSlider(this.duration);
        this._updateDurationLabel(this.duration);
    },

    /**
     * Event called when the media is ready
     * @private
     */
    _onReady: function _onReady() {
        this._updateDuration(this.player.getDuration());
        this._setState('ready', true);
        this._setState('canplay', true);
        this._setState('canpause', this.config.canPause);
        this._setState('canseek', this.config.canSeek);
        this._setState('loading', false);

        /**
         * Triggers a media ready event
         * @event mediaplayer#ready
         */
        this.trigger('ready');

        // set the initial state
        this.setVolume(this.volume);
        this.mute(!!this.startMuted);
        if (this.autoStartAt) {
            this.seek(this.autoStartAt);
        } else if (this.autoStart) {
            this.play();
        }
    },

    /**
     * Update volume in DBIndex store
     * @param {Number} volume
     * @returns {Promise}
     * @private
     */
    _storeVolume: function _storeVolume(volume) {
        return store('mediaVolume').then(function (volumeStore) {
            volumeStore.setItem('volume', volume);
        });
    },

    /**
     * Get volume from DBIndex store
     * @returns {Promise}
     * @private
     */
    _updateVolumeFromStore: function _updateVolumeFromStore() {
        return store('mediaVolume')
            .then(function (volumeStore) {
                return volumeStore.getItem('volume');
            })
            .then(volume => {
                if (_.isNumber(volume)) {
                    this.volume = Math.max(_volumeMin, Math.min(_volumeMax, parseFloat(volume)));
                    this.setVolume(this.volume);
                }
            });
    },

    /**
     * Event called when the media throws unrecoverable error
     * @private
     */
    _onError: function _onError() {
        this._setState('error', true);
        this._setState('loading', false);

        /**
         * Triggers an unrecoverable media error event
         * @event mediaplayer#error
         */
        this.trigger('error');
    },

    /**
     * Event called when the media throws recoverable error
     * @private
     */
    _onRecoverError: function _onRecoverError() {
        this._setState('error', false);

        /**
         * Triggers a recoverable media error event
         * @event mediaplayer#recovererror
         */
        this.trigger('recovererror');
    },

    /**
     * Event called when the media is played
     * @private
     */
    _onPlay: function _onPlay() {
        this._playingState(true);

        /**
         * Triggers a media playback event
         * @event mediaplayer#play
         */
        this.trigger('play', this.$media[0]);
    },

    /**
     * Event called when the media is paused
     * @private
     */
    _onPause: function _onPause() {
        this._playingState(false);

        /**
         * Triggers a media paused event
         * @event mediaplayer#pause
         */
        this.trigger('pause');
    },

    /**
     * Event called when the media is ended
     * @private
     */
    _onEnd: function _onEnd() {
        this.timesPlayed++;
        this._playingState(false, true);
        this._updatePosition(0);

        // disable GUI when the play limit is reached
        if (this._playLimitReached()) {
            this._disableGUI();

            /**
             * Triggers a play limit reached event
             * @event mediaplayer#limitreached
             */
            this.trigger('limitreached');
        } else if (this.loop) {
            this.restart();
        } else if (parseInt(this.config.replayTimeout, 10) > 0) {
            this.replayTimeoutStartMs = new window.Date().getTime();
            this._replayTimeout();
        }

        /**
         * Triggers a media ended event
         * @event mediaplayer#ended
         */
        this.trigger('ended');
    },

    /**
     * Event called when the time position has changed
     * @private
     */
    _onTimeUpdate: function _onTimeUpdate() {
        this._updatePosition(this.player.getPosition());

        /**
         * Triggers a media time update event
         * @event mediaplayer#update
         */
        this.trigger('update');
    },

    /**
     * Run a timer to disable the possibility of replaying a media
     * @private
     */
    _replayTimeout: function _replayTimeout() {
        const nowMs = new window.Date().getTime(),
            elapsedSeconds = Math.floor((nowMs - this.replayTimeoutStartMs) / 1000);

        this.timerId = requestAnimationFrame(this._replayTimeout.bind(this));

        if (elapsedSeconds >= parseInt(this.config.replayTimeout, 10)) {
            this._disableGUI();
            this.disable();
            cancelAnimationFrame(this.timerId);
        }
    },

    /**
     * Disable the player GUI
     * @private
     */
    _disableGUI: function disableGUI() {
        this._setState('ready', false);
        this._setState('canplay', false);
    },

    /**
     * Checks if the play limit has been reached
     * @returns {Boolean}
     * @private
     */
    _playLimitReached: function _playLimitReached() {
        return this.config.maxPlays && this.timesPlayed >= this.config.maxPlays;
    },

    /**
     * Checks if the media can be played
     * @returns {Boolean}
     * @private
     */
    _canPlay: function _canPlay() {
        return this.is('ready') && !this.is('disabled') && !this.is('hidden') && !this._playLimitReached();
    },

    /**
     * Checks if the media can be paused
     * @returns {Boolean}
     * @private
     */
    _canPause: function _canPause() {
        return !!this.config.canPause;
    },

    /**
     * Checks if the media can be sought
     * @returns {Boolean}
     * @private
     */
    _canSeek: function _canSeek() {
        return !!this.config.canSeek;
    },

    /**
     * Checks if the playback can be resumed
     * @returns {Boolean}
     * @private
     */
    _canResume: function _canResume() {
        return this.is('paused') && this._canPlay();
    },

    /**
     * Sets the media is in a particular state
     * @param {String} name
     * @param {Boolean} value
     * @returns {mediaplayer}
     */
    _setState: function _setState(name, value) {
        value = !!value;

        this.config.is[name] = value;

        if (this.$component) {
            this.$component.toggleClass(name, value);
        }

        return this;
    },

    /**
     * Restores the media player from a particular state and resumes the playback
     * @param {String} stateName
     * @returns {mediaplayer}
     * @private
     */
    _fromState: function _fromState(stateName) {
        this._setState(stateName, false);
        this.resume();

        return this;
    },

    /**
     * Sets the media player to a particular state and pauses the playback
     * @param {String} stateName
     * @returns {mediaplayer}
     * @private
     */
    _toState: function _toState(stateName) {
        this.pause();
        this._setState(stateName, true);

        return this;
    },

    /**
     * Sets the playing state
     * @param {Boolean} state
     * @param {Boolean} [ended]
     * @returns {mediaplayer}
     * @private
     */
    _playingState: function _playingState(state, ended) {
        this._setState('playing', !!state);
        this._setState('paused', !state);
        this._setState('ended', !!ended);

        return this;
    },

    /**
     * Executes a command onto the media
     * @param {String} command - The name of the command to execute
     * @returns {*}
     * @private
     */
    execute: function execute(command) {
        const ctx = this.player;
        const method = ctx && ctx[command];

        if (_.isFunction(method)) {
            return method.apply(ctx, _slice.call(arguments, 1));
        }
    }
};

/**
 * Builds a media player instance
 * @param {Object} config
 * @param {String} config.type - The type of media to play
 * @param {String|Array} config.url - The URL to the media
 * @param {String|jQuery|HTMLElement} [config.renderTo] - An optional container in which renders the player
 * @param {Boolean} [config.loop] - The media will be played continuously
 * @param {Boolean} [config.canPause] - The play can be paused
 * @param {Boolean} [config.startMuted] - The player should be initially muted
 * @param {Boolean} [config.autoStart] - The player starts as soon as it is displayed
 * @param {Number} [config.autoStartAt] - The time position at which the player should start
 * @param {Number} [config.maxPlays] - Sets a few number of plays (default: infinite)
 * @param {Number} [config.volume] - Sets the sound volume (default: 80)
 * @param {Number} [config.width] - Sets the width of the player (default: depends on media type)
 * @param {Number} [config.height] - Sets the height of the player (default: auto)
 * @event render - Event triggered when the player is rendering
 * @event error - Event triggered when the player throws an unrecoverable error
 * @event recovererror - Event triggered when the player throws a recoverable error
 * @event ready - Event triggered when the player is fully ready
 * @event play - Event triggered when the playback is starting
 * @event update - Event triggered while the player is playing
 * @event pause - Event triggered when the playback is paused
 * @event ended - Event triggered when the playback is ended
 * @event limitreached - Event triggered when the play limit has been reached
 * @event destroy - Event triggered when the player is destroying
 * @returns {mediaplayer}
 */
const mediaplayerFactory = function mediaplayerFactory(config) {
    const player = _.clone(mediaplayer);
    return player.init(config);
};

/**
 * Tells if the browser can play audio and video
 * @param {String} [type] The type of media (audio or video)
 * @param {String} [mime] A media MIME type to check
 * @type {Boolean}
 */
mediaplayerFactory.canPlay = function canPlay(type, mime) {
    return _support.canPlay(type, mime);
};

/**
 * Tells if the browser can play audio
 * @param {String} [mime] A media MIME type to check
 * @type {Boolean}
 */
mediaplayerFactory.canPlayAudio = function canPlayAudio(mime) {
    return _support.canPlayAudio(mime);
};

/**
 * Tells if the browser can play video
 * @param {String} [mime] A media MIME type to check
 * @type {Boolean}
 */
mediaplayerFactory.canPlayVideo = function canPlayVideo(mime) {
    return _support.canPlayVideo(mime);
};

/**
 * Checks if the browser allows to control the media playback
 * @returns {Boolean}
 */
mediaplayerFactory.canControl = function canControl() {
    return _support.canControl();
};

/**
 * The polling interval used to update the progress bar while playing a YouTube video.
 * Note : the YouTube API does not provide events to update this progress bar...
 * @type {Number}
 */
mediaplayerFactory.youtubePolling = 100;

export default mediaplayerFactory;
