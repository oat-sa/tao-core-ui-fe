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
import async from 'async';
import request from 'core/dataProvider/request';
import eventifier from 'core/eventifier';
import mimetype from 'core/mimetype';
import store from 'core/store';
import support from 'ui/mediaplayer/support';
import players from 'ui/mediaplayer/players';
import playerTpl from 'ui/mediaplayer/tpl/player';
import 'ui/mediaplayer/css/player.css';
import 'nouislider';

/**
 * CSS namespace
 * @type {String}
 */
const ns = '.mediaplayer';

/**
 * Minimum value of the volume
 * @type {Number}
 */
const volumeMin = 0;

/**
 * Maximum value of the volume
 * @type {Number}
 */
const volumeMax = 100;

/**
 * Threshold (minimum required space above the player) to display the volume
 * above the bar.
 * @type {Number}
 */
const volumePositionThreshold = 200;

/**
 * Some default values
 * @type {Object}
 */
const defaults = {
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
        volume: 80,
        startMuted: false,
        maxPlays: 0,
        replayTimeout: 0,
        canPause: true,
        canSeek: true,
        loop: false,
        autoStart: false,
        preview: true,
        debug: false
    }
};

/**
 * Ensures a value is a number
 * @param {Number|String} value
 * @returns {Number}
 */
const ensureNumber = value => {
    const floatValue = parseFloat(value);
    return isFinite(floatValue) ? floatValue : 0;
};

/**
 * Format a number to string with leading zeros
 * @param {Number} n
 * @param {Number} len
 * @returns {String}
 */
const leadingZero = (n, len) => {
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
 */
const timerFormat = time => {
    const seconds = Math.floor(time % 60);
    const minutes = Math.floor(time / 60) % 60;
    const hours = Math.floor(time / 3600);
    const parts = [];

    if (hours) {
        parts.push(hours);
    }
    parts.push(leadingZero(minutes, 2));
    parts.push(leadingZero(seconds, 2));

    return parts.join(':');
};

/**
 * Checks if a type needs to be adjusted
 * @param {String} type
 * @returns {Boolean}
 */
const needTypeAdjust = type => {
    return 'string' === typeof type && type.indexOf('application') === 0;
};

/**
 * Adjust bad type by apllying heuristic on URI
 * @param {Object|String} source
 * @returns {String}
 */
const getAdjustedType = source => {
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
 */
const configToSources = config => {
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
 * @param {String} sizeProps Width or Height
 * @returns {Boolean}
 */
const isResponsiveSize = sizeProps => {
    return /%/.test(sizeProps) || sizeProps === 'auto';
};

/**
 * Builds a media player instance
 * @param {Object} config
 * @param {String} config.type - The type of media to play, say `audio`, `video`, or `youtube`. The default is `video`.
 * It might also contain the MIME type of the media as a shorthand.
 * @param {String|Array} [config.url] - The URL to the media. If several media are proposed as alternatives,
 * please look at the `sources` option instead.
 * @param {String} [config.mimeType] - The MIME type of the media. If omitted, the player will try to extract it
 * from the `type` property, otherwise it will request the server to get the content-type.
 * @param {Array} [config.sources] - A list of URL if several media can be proposed. Each entry may be either a
 * string (single URL), or an object containing both the URL and the MIME type ({src: string, type: string}).
 * @param {String|jQuery|HTMLElement} [config.renderTo] - An optional container in which renders the player
 * @param {Boolean} [config.canSeek] - The player allows to reach an arbitrary position within the media using the duration bar
 * @param {Boolean} [config.loop] - The media will be played continuously
 * @param {Boolean} [config.canPause] - The player can be paused
 * @param {Boolean} [config.startMuted] - The player should be initially muted
 * @param {Boolean} [config.autoStart] - The player starts as soon as it is displayed
 * @param {Number} [config.autoStartAt] - The time position at which the player should start
 * @param {Number} [config.maxPlays] - Sets a few number of plays (default: infinite)
 * @param {Number} [config.replayTimeout] - disable the possibility to replay a media after this timeout, in seconds (default: 0)
 * @param {Number} [config.volume] - Sets the sound volume (default: 80)
 * @param {Number} [config.width] - Sets the width of the player (default: depends on media type)
 * @param {Number} [config.height] - Sets the height of the player (default: depends on media type)
 * @param {Boolean} [config.preview] - Enables the media preview (load media metadata)
 * @param {Boolean} [config.debug] - Enables the debug mode
 * @param {number} [config.config.stalledDetectionDelay] - The delay before considering a media is stalled
 * @event render - Event triggered when the player is rendering
 * @event error - Event triggered when the player throws an unrecoverable error
 * @event ready - Event triggered when the player is fully ready
 * @event play - Event triggered when the playback is starting
 * @event update - Event triggered while the player is playing
 * @event pause - Event triggered when the playback is paused
 * @event ended - Event triggered when the playback is ended
 * @event limitreached - Event triggered when the play limit has been reached
 * @event destroy - Event triggered when the player is destroying
 * @returns {mediaplayer}
 */
function mediaplayerFactory(config) {
    /**
     * Defines a media player object
     * @type {Object}
     */
    const mediaplayer = {
        /**
         * Initializes the media player
         * @param {Object} mediaPlayerConfig
         * @returns {mediaplayer}
         */
        init(mediaPlayerConfig) {
            // load the config set, discard null values in order to allow defaults to be set
            this.config = _.omitBy(mediaPlayerConfig || {}, value => typeof value === 'undefined' || value === null);
            _.defaults(this.config, defaults.options);
            if (!this.config.mimeType && 'string' === typeof this.config.type && this.config.type.indexOf('/') > 0) {
                this.config.mimeType = this.config.type;
            }
            this._setType(this.config.type || defaults.type);
            this._reset();
            this._updateVolumeFromStore();
            this._initEvents();
            this._initSources(() => {
                if (!this.is('youtube')) {
                    _.forEach(this.config.sources, source => {
                        if (source && source.type && source.type.indexOf('audio') === 0) {
                            this._setType(source.type);
                            this._initType();
                            return false;
                        }
                    });
                }
                if (this.config.renderTo) {
                    _.defer(() => this.render());
                }
            });
            this._initTranscription();

            return this;
        },

        /**
         * Uninstalls the media player
         * @returns {mediaplayer}
         */
        destroy() {
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
        render(to) {
            const renderTo = to || this.config.renderTo || this.$container;

            if (this.$component) {
                this.destroy();
            }

            this._initState();
            this._buildDom();
            if (this.config.preview) {
                this._updateDuration(0);
                this._updatePosition(0);
            }
            this._bindEvents();
            this._playingState(false, true);
            this._initPlayer();
            this._initSize();

            // Resize for old items with defined height to avoid big jump
            if (this.config.height && this.config.height !== 'auto') {
                this.resize('100%', 'auto');
            } else {
                this.resize(this.config.width, this.config.height);
            }
            this.config.is.rendered = true;

            if (renderTo) {
                this.$container = $(renderTo).append(this.$component);
            }

            // add class if it is stalled
            if (this.is('stalled')) {
                this._setState('stalled', true);
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
         * Reloads media player after it was stalled
         */
        reload() {
            /**
             * Triggers a reload event
             * @event mediaplayer#reload
             */
            this.trigger('reload');

            if (this.player) {
                this.player.recover();
            }
            this._setState('stalled', false);
            this.setInitialStates();
        },

        /**
         * Set initial states
         */
        setInitialStates() {
            if (!this.is('stalled')) {
                this._setState('ready', true);
            }
            this._setState('canplay', true);
            this._setState('canpause', this.config.canPause);
            this._setState('canseek', this.config.canSeek);
            this._setState('loading', false);
        },

        /**
         * Sets the start position inside the media
         * @param {Number} time - The start position in seconds
         * @param {*} [internal] - Internal use
         * @returns {mediaplayer}
         */
        seek(time, internal) {
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
        play(time) {
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
        pause(time) {
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
        resume() {
            if (this._canResume()) {
                this.play();
            }

            return this;
        },

        /**
         * Stops the playback
         * @returns {mediaplayer}
         */
        stop() {
            this.loop = false;
            this.execute('stop');

            if (!this.is('ready')) {
                this.autoStart = false;
            }

            return this;
        },

        /**
         * Starts the media
         * @returns {mediaplayer}
         */
        start() {
            this._setState('preview', true);
            this._setState('loading', true);
            this.play();
        },

        /**
         * Restarts the media from the beginning
         * @returns {mediaplayer}
         */
        restart() {
            this.play(0);

            return this;
        },

        /**
         * Rewind the media to the beginning
         * @returns {mediaplayer}
         */
        rewind() {
            this.seek(0);

            return this;
        },

        /**
         * Mutes the media
         * @param {Boolean} [state] - A flag to set the mute state (default: true)
         * @returns {mediaplayer}
         */
        mute(state) {
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
        unmute() {
            this.mute(false);

            return this;
        },

        /**
         * Sets the sound volume of the media being played
         * @param {Number} value - A value between 0 and 100
         * @param {*} [internal] - Internal use
         * @returns {mediaplayer}
         */
        setVolume(value, internal) {
            this._updateVolume(value, internal);

            this.execute('setVolume', this.volume);

            return this;
        },

        /**
         * Gets the sound volume applied to the media being played
         * @returns {Number} Returns a value between 0 and 100
         */
        getVolume() {
            return this.volume;
        },

        /**
         * Gets the current displayed position inside the media
         * @returns {Number}
         */
        getPosition() {
            return this.position;
        },

        /**
         * Gets the duration of the media
         * @returns {Number}
         */
        getDuration() {
            return this.duration;
        },

        /**
         * Gets the number of times the media has been played
         * @returns {Number}
         */
        getTimesPlayed() {
            return this.timesPlayed;
        },

        /**
         * Gets the type of player
         * @returns {String}
         */
        getType() {
            return this.type;
        },

        /**
         * Gets the DOM container
         * @returns {jQuery}
         */
        getContainer() {
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
        getElement() {
            return this.$component;
        },

        /**
         * Gets the list of media
         * @returns {Array}
         */
        getSources() {
            return this.config.sources.slice();
        },

        /**
         * Sets the media source. If a source has been already set, it will be replaced.
         * @param {String|Object} src - The media URL, or an object containing the source and the type
         * @param {Function} [callback] - A function called to provide the added media source object
         * @returns {mediaplayer}
         */
        setSource(src, callback) {
            this._getSource(src, source => {
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
        addSource(src, callback) {
            this._getSource(src, source => {
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
        is(state) {
            return !!this.config.is[state];
        },

        /**
         * Changes the size of the player
         * @param {Number} width
         * @param {Number} height
         * @returns {mediaplayer}
         */
        resize(width, height) {
            if ((isResponsiveSize(width) && !isResponsiveSize(height)) || this.is('youtube')) {
                // responsive width height should be auto
                // for youtube iframe height is limited by ration
                height = 'auto';
            }
            this.execute('setSize', width, height);

            return this;
        },

        /**
         * Enables the media player
         * @returns {mediaplayer}
         */
        enable() {
            this._fromState('disabled');

            return this;
        },

        /**
         * Disables the media player
         * @returns {mediaplayer}
         */
        disable() {
            this._toState('disabled');
            this.trigger('disabled');

            return this;
        },

        /**
         * Shows the media player
         * @returns {mediaplayer}
         */
        show() {
            this._fromState('hidden');

            return this;
        },

        /**
         * hides the media player
         * @returns {mediaplayer}
         */
        hide() {
            this._toState('hidden');

            return this;
        },
        /**
         * get media original size
         * @returns {Object}
         */
        getMediaOriginalSize() {
            if (this.is('youtube')) {
                return defaults.youtube;
            }
            if (this.is('video') && this.player) {
                return this.player.getMediaSize();
            }
            return {};
        },
        /**
         * Ensures the right media type is set
         * @param {String} type
         * @private
         */
        _setType(type) {
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
        _initType() {
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
        _getSource(src, callback) {
            let source;
            const done = () => {
                if (needTypeAdjust(source.type)) {
                    source.type = getAdjustedType(source);
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

            if (!source.type) {
                if (this.is('youtube')) {
                    source.type = defaults.type;
                } else if (this.config.mimeType) {
                    source.type = this.config.mimeType;
                }
            }

            if (!source.type) {
                mimetype.getResourceType(source.src, (err, type) => {
                    if (err) {
                        type = defaults.type;
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
        _initSources(callback) {
            const sources = configToSources(this.config);

            this.config.sources = [];

            async.each(
                sources,
                (source, cb) => {
                    this.addSource(source, src => cb(null, src));
                },
                callback
            );
        },

        /**
         * Installs the events manager onto the instance
         * @private
         */
        _initEvents() {
            eventifier(this);

            const triggerEvent = this.trigger;
            this.trigger = function trigger(eventName, ...args) {
                if (this.$component) {
                    this.$component.trigger(eventName + ns, ...args);
                }
                return triggerEvent.call(this, eventName, ...args);
            };
        },

        /**
         * Ensures the right size is set according to the media type
         * @private
         */
        _initSize() {
            const type = this.is('video') ? 'video' : 'audio';
            const mediaConfig = defaults[type] || defaults.video;

            this.config.width = this.config.width || mediaConfig.width;
            this.config.height = this.config.height || mediaConfig.height;

            if ((isResponsiveSize(this.config.width) && !isResponsiveSize(this.config.height)) || this.is('youtube')) {
                // responsive width height should be auto
                // for youtube iframe height is limited by ration
                this.config.height = 'auto';
            }
        },

        /**
         * Initializes the right player instance
         * @private
         */
        _initPlayer() {
            const playerFactory = players[this.type];
            let error;

            if (support.canPlay(this.type)) {
                if (_.isFunction(playerFactory)) {
                    const playerConfig = {
                        type: this.getType(),
                        sources: this.getSources(),
                        preview: this.config.preview,
                        debug: this.config.debug,
                        stalledDetectionDelay: this.config.stalledDetectionDelay
                    };
                    this.player = playerFactory(this.$player, playerConfig)
                        .on('resize', (width, height) => {
                            if (this.$component) {
                                this.$component.width(width).height(height);
                            }
                        })
                        .on('ready', () => this._onReady())
                        .on('play', () => this._onPlay())
                        .on('pause', () => this._onPause())
                        .on('timeupdate', () => this._onTimeUpdate())
                        .on('stalled', () => this._onStalled())
                        .on('playing', () => this._onPlaying())
                        .on('end', () => this._onEnd())
                        .on('error', () => this._onError());
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
            this._setState('nogui', !support.canControl());
            this._setState('preview', this.config.preview);
            this._setState('loading', !error);
            if (error) {
                this._setState('ready', true);
                this.trigger('ready');
            }
        },

        /**
         * Initializes the player state
         * @private
         */
        _initState() {
            let isCORS = false;
            let page;

            if (!this.is('youtube')) {
                page = new UrlParser(window.location);
                isCORS = _.some(this.config.sources, source => !page.sameDomain(source.src));
            }

            this._setState('cors', isCORS);
            this._setState('ready', false);
        },

        async _initTranscription() {
            try {
                const response = await request(this.config.transcriptionUrl);
                if (response.success && response.data && response.data.value) {
                    $container.find('.transcription')
                        .replaceWith('<div class="transcription">' + response.data.value + '</div>');
                } else {
                    console.error('Failed to load transcription metadata');
                }
            } catch (error) {
                console.error('Error fetching transcription metadata:', error);
            }
        },

        /**
         * Resets the internals attributes
         * @private
         */
        _reset() {
            this.config.is = {};
            this._initType();

            this.$component = null;
            this.$container = null;
            this.$player = null;
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
        _buildDom() {
            const configForTemplate = _.clone(this.config);
            configForTemplate.type = this.type;
            this.$component = $(playerTpl(configForTemplate));
            this.$player = this.$component.find('.player');
            this.$controls = this.$component.find('.controls');

            this.$seek = this.$controls.find('.seek .slider');
            this.$sound = this.$controls.find('.sound');
            this.$volumeControl = this.$controls.find('.volume');
            this.$volume = this.$controls.find('.volume .slider');
            this.$position = this.$controls.find('[data-control="time-cur"]');
            this.$duration = this.$controls.find('[data-control="time-end"]');

            this.$volumeSlider = this._renderSlider(this.$volume, this.volume, volumeMin, volumeMax, true);
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
        _renderSlider($elt, value, min, max, vertical) {
            let orientation, direction;

            if (vertical) {
                orientation = 'vertical';
                direction = 'rtl';
            } else {
                orientation = 'horizontal';
                direction = 'ltr';
            }

            return $elt.noUiSlider({
                start: ensureNumber(value) || 0,
                step: 1,
                connect: 'lower',
                orientation: orientation,
                direction: direction,
                animate: true,
                range: {
                    min: ensureNumber(min) || 0,
                    max: ensureNumber(max) || 0
                }
            });
        },

        /**
         * Destroys a slider bound to an element
         * @param {jQuery} $elt
         * @private
         */
        _destroySlider($elt) {
            if ($elt) {
                $elt.get(0).destroy();
            }
        },

        /**
         * Binds events onto the rendered player
         * @private
         */
        _bindEvents() {
            let overing = false;

            this.$component.on(`contextmenu${ns}`, event => event.preventDefault());

            this.$controls.on(`click${ns}`, '.action', event => {
                const $target = $(event.target);
                const $action = $target.closest('.action');
                const id = $action.data('control');

                if (_.isFunction(this[id])) {
                    this[id]();
                }
            });

            this.$player.on(`click${ns}`, event => {
                const $target = $(event.target);
                const $action = $target.closest('.action');

                // if action was clicked
                if ($action.length) {
                    const id = $action.data('control');
                    if (_.isFunction(this[id])) {
                        this[id]();
                    }
                } else {
                    // default action is toggle play
                    if (this.is('playing')) {
                        this.pause();
                    } else {
                        this.play();
                    }
                }
            });

            this.$seek.on(`change${ns}`, (event, value) => {
                this.seek(value, true);
            });

            $(document).on(`updateVolume${ns}`, (event, value) => {
                this.setVolume(value);
            });

            this.$volume.on(`change${ns}`, (event, value) => {
                this.unmute();
                $(document).trigger(`updateVolume${ns}`, value);
                this.setVolume(value, true);
            });

            this.$sound.on(`mouseover${ns}`, 'a', () => {
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
                    this.$volumeControl.one(`mouseleave${ns}`, () => {
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
        _unbindEvents() {
            this.$component.off(ns);
            this.$player.off(ns);
            this.$controls.off(ns);
            this.$seek.off(ns);
            this.$volume.off(ns);

            //if the volume is opened and the player destroyed,
            //prevent the callback to run
            if (this.overingTimer) {
                clearTimeout(this.overingTimer);
            }

            $(document).off(ns);
        },

        /**
         * Updates the volume slider
         * @param {Number} value
         * @private
         */
        _updateVolumeSlider(value) {
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
        _updateVolume(value, internal) {
            this.volume = Math.max(volumeMin, Math.min(volumeMax, parseFloat(value)));
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
        _updatePositionSlider(value) {
            if (this.$seekSlider) {
                this.$seekSlider.val(value);
            }
        },

        /**
         * Updates the time label
         * @param {Number} value
         * @private
         */
        _updatePositionLabel(value) {
            if (this.$position) {
                this.$position.text(timerFormat(value));
            }
        },

        /**
         * Updates the displayed time position
         * @param {Number} value
         * @param {*} [internal]
         * @private
         */
        _updatePosition(value, internal) {
            this.position = Math.max(0, Math.min(this.duration || +Infinity, parseFloat(value)));

            if (!internal && this.duration) {
                this._updatePositionSlider(this.position);
            }
            this._updatePositionLabel(this.position);
        },

        /**
         * Updates the duration slider
         * @param {Number} value
         * @private
         */
        _updateDurationSlider(value) {
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
        _updateDurationLabel(value) {
            if (this.$duration) {
                if (value && isFinite(value)) {
                    this.$duration.text(timerFormat(value)).show();
                } else {
                    this.$duration.hide();
                }
            }
        },

        /**
         * Updates the displayed duration
         * @param {Number|String} value
         * @private
         */
        _updateDuration(value) {
            const duration = Math.abs(parseFloat(value));
            if (duration !== this.duration) {
                this.duration = duration;
                this._updateDurationSlider(this.duration);
                this._updateDurationLabel(this.duration);
            }
        },

        /**
         * Event called when the media is ready
         * @private
         */
        _onReady() {
            if (this.is('error')) {
                this._setState('error', false);
            }

            const duration = this.player.getDuration();
            const timePreview = this.config.preview || duration;
            if (timePreview) {
                this._updateDuration(duration);
            }
            this.setInitialStates();

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

            if (this.config.preview && this.$container && this.config.height && this.config.height !== 'auto') {
                this._setMaxHeight();
            }
        },

        /**
         * Set max height limit for container
         * using by old media items with defined height.
         * @private
         */
        _setMaxHeight() {
            const $video = this.$container.find('video.video');
            const controlsHeight = parseInt(window.getComputedStyle(this.$controls[0]).height);
            const scale = $video.height() / this.config.height;
            const playerWidth = this.$container.find('.player').width();
            const videoWidth = $video.width() / scale;

            if (videoWidth > playerWidth) {
                this.execute('setSize', '100%', 'auto');
            } else {
                this.$component.css({ maxHeight: `${this.config.height + controlsHeight}px` });
                this.execute('setSize', Math.floor(videoWidth), 'auto');
            }
        },

        /**
         * Update volume in DBIndex store
         * @param {Number} volume
         * @returns {Promise}
         * @private
         */
        _storeVolume(volume) {
            return store('mediaVolume').then(volumeStore => volumeStore.setItem('volume', volume));
        },

        /**
         * Get volume from DBIndex store
         * @returns {Promise}
         * @private
         */
        _updateVolumeFromStore() {
            return store('mediaVolume')
                .then(volumeStore => volumeStore.getItem('volume'))
                .then(volume => {
                    if (_.isNumber(volume)) {
                        this.volume = Math.max(volumeMin, Math.min(volumeMax, parseFloat(volume)));
                        this.setVolume(this.volume);
                    }
                });
        },

        /**
         * Event called when the media throws unrecoverable error
         * @private
         */
        _onError() {
            this._setState('error', true);
            this._setState('loading', false);

            /**
             * Triggers an unrecoverable media error event
             * @event mediaplayer#error
             */
            this.trigger('error');
        },

        /**
         * Event called when the media is played
         * @private
         */
        _onPlay() {
            this._playingState(true);
            this._setState('preview', true);

            /**
             * Triggers a media playback event
             * @event mediaplayer#play
             */
            this.trigger('play', this.player && this.player.getMedia());
        },

        /**
         * Event called when the media is paused
         * @private
         */
        _onPause() {
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
        _onEnd() {
            this.timesPlayed++;
            this._playingState(false, true);
            this._updatePosition(0);

            // disable when the play limit is reached
            if (this._playLimitReached()) {
                if (!this.is('disabled')) {
                    this.disable();
                }
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
         * Event called when the playback is playing
         * @private
         */
        _onPlaying() {
            this._setState('preview', true);
            this._setState('stalled', false);
            this._setState('ready', true);
        },

        /**
         * Event called when the playback is stalled
         * @private
         */
        _onStalled() {
            this._setState('stalled', true);
            this._setState('ready', false);
        },

        /**
         * Event called when the time position has changed
         * @private
         */
        _onTimeUpdate() {
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
        _replayTimeout() {
            const nowMs = new window.Date().getTime(),
                elapsedSeconds = Math.floor((nowMs - this.replayTimeoutStartMs) / 1000);

            this.timerId = requestAnimationFrame(this._replayTimeout.bind(this));

            if (elapsedSeconds >= parseInt(this.config.replayTimeout, 10)) {
                this.disable();
                cancelAnimationFrame(this.timerId);
            }
        },

        /**
         * Checks if the play limit has been reached
         * @returns {Boolean}
         * @private
         */
        _playLimitReached() {
            return this.config.maxPlays && this.timesPlayed >= this.config.maxPlays;
        },

        /**
         * Checks if the media can be played
         * @returns {Boolean}
         * @private
         */
        _canPlay() {
            return (
                (this.is('ready') || this.is('stalled')) &&
                !this.is('disabled') &&
                !this.is('hidden') &&
                !this._playLimitReached()
            );
        },

        /**
         * Checks if the media can be paused
         * @returns {Boolean}
         * @private
         */
        _canPause() {
            return !!this.config.canPause;
        },

        /**
         * Checks if the media can be sought
         * @returns {Boolean}
         * @private
         */
        _canSeek() {
            return !!this.config.canSeek;
        },

        /**
         * Checks if the playback can be resumed
         * @returns {Boolean}
         * @private
         */
        _canResume() {
            return this.is('paused') && this._canPlay();
        },

        /**
         * Sets the media is in a particular state
         * @param {String} name
         * @param {Boolean} value
         * @returns {mediaplayer}
         */
        _setState(name, value) {
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
        _fromState(stateName) {
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
        _toState(stateName) {
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
        _playingState(state, ended) {
            this._setState('playing', !!state);
            this._setState('paused', !state);
            this._setState('ended', !!ended);

            return this;
        },

        /**
         * Executes a command onto the media
         * @param {String} command - The name of the command to execute
         * @param {*} args - additional arguments
         * @returns {*}
         * @private
         */
        execute(command, ...args) {
            if (this.player && 'function' === typeof this.player[command]) {
                return this.player[command](...args);
            }
        }
    };

    return mediaplayer.init(config);
}

/**
 * Tells if the browser can play audio and video
 * @param {String} [type] The type of media (audio or video)
 * @param {String} [mime] A media MIME type to check
 * @type {Boolean}
 */
mediaplayerFactory.canPlay = function canPlay(type, mime) {
    return support.canPlay(type, mime);
};

/**
 * Tells if the browser can play audio
 * @param {String} [mime] A media MIME type to check
 * @type {Boolean}
 */
mediaplayerFactory.canPlayAudio = function canPlayAudio(mime) {
    return support.canPlayAudio(mime);
};

/**
 * Tells if the browser can play video
 * @param {String} [mime] A media MIME type to check
 * @type {Boolean}
 */
mediaplayerFactory.canPlayVideo = function canPlayVideo(mime) {
    return support.canPlayVideo(mime);
};

/**
 * Checks if the browser allows to control the media playback
 * @returns {Boolean}
 */
mediaplayerFactory.canControl = function canControl() {
    return support.canControl();
};

export default mediaplayerFactory;
