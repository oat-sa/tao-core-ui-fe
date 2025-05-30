/**
 * @author Bertrand Chevrier <bertrand@taotesting.com>
 */
import $ from 'jquery';
import _ from 'lodash';
import mimeType from 'core/mimetype';
import Pluginifier from 'core/pluginifier';
import mediaplayer from 'ui/mediaplayer';
import iframeNotifier from 'iframeNotifier';
import documentViewer from 'ui/documentViewer';
import pdfViewer from 'ui/documentViewer/providers/pdfViewer';

const ns = 'previewer';
const dataNs = `ui.${ns}`;

//the plugin defaults
const defaults = {
    containerClass: 'previewer'
};

/**
 * Some default size values
 * @type {Object}
 * @private
 */
const _defaultSize = {
    video: {
        width: 480,
        height: 300
    },
    audio: {
        width: 290,
        height: 36
    },
    pdf: {
        width: 340,
        height: 500
    }
};

const previewGenerator = {
    placeHolder: _.template("<p class='nopreview' data-type='${type}'>${desc}</p>"),
    youtubeTemplate: _.template("<div data-src=${jsonurl} data-type='video/youtube'></div>"),
    videoTemplate: _.template("<div data-src=${jsonurl} data-type='${mime}'></div>"),
    audioTemplate: _.template("<div data-src=${jsonurl} data-type='${mime}'></div>"),
    imageTemplate: _.template("<img src=${jsonurl} alt='${name}' />"),
    pdfTemplate: _.template("<div class='pdfpreview'></div>"),
    flashTemplate: _.template(
        "<object data=${jsonurl} type='application/x-shockwave-flash'><param name='movie' value=${jsonurl}></param></object>"
    ),
    mathmlTemplate: _.template('<iframe src=${jsonurl}></iframe>'),
    xmlTemplate: _.template('<pre>${xml}</pre>'),
    htmlTemplate: _.template('<iframe src=${jsonurl}></iframe>'),
    /**
     * Generates the preview tags for a type
     * @memberOf previewGenerator
     * @param {String} type - the file type
     * @param {Object} data - the preview data (url, desc, name)
     * @returns {String} the tags
     */
    generate: function generate(type, data) {
        const tmpl = this[`${type}Template`];
        data.jsonurl = JSON.stringify(data.url);
        if (_.isFunction(tmpl)) {
            return tmpl(data);
        }
    }
};

documentViewer.registerProvider('pdf', pdfViewer);

/**
 * @exports ui/previewer
 */
const previewer = {
    /**
     * Initialize the plugin.
     *
     * Called the jQuery way once registered by the Pluginifier.
     * @example $('selector').previewer({ url : 'test.mp4', type : 'video/mp4' });
     * @public
     *
     * @constructor
     * @param {Object} [options] - the plugin options
     * @returns {jQueryElement} for chaining
     * @fires playerready when the mediaplayer (video) is sucessfully loaded and configured
     */
    init: function(options) {
        //get options using default
        options = _.defaults(options || {}, defaults);

        return this.each(function() {
            const $elt = $(this);
            if (!$elt.data(dataNs)) {
                if (!$elt.hasClass(options.containerClass)) {
                    $elt.addClass(options.containerClass);
                }

                $elt.data(dataNs, options);
                previewer._update($elt);

                /**
                 * The plugin has been created.
                 * @event previewer#create.previewer
                 */
                $elt.trigger(`create.${ns}`);
            } else {
                $elt.previewer('update', options);
            }
        });
    },
    /**
     * Update the preview
     * @example $('selector').previewer('update', {url: 'foo.mp3', type : 'audio/mp3'});
     * @public
     * @param {Object} data - the new options for the preview
     * @returns {jQueryElement} for chaining
     */
    update: function(data) {
        return this.each(function() {
            const $elt = $(this);
            const options = $elt.data(dataNs);
            $elt.data(dataNs, _.merge(options, data));
            previewer._update($elt);
        });
    },
    /**
     * Set the player
     * @param {JQueryElement} $elt
     * @param {Object} player
     * @private
     */
    _setPlayer: function($elt, player) {
        $elt.data('player', player);
    },
    /**
     * Uninstalls the player if any
     * @param {JQueryElement} $elt
     * @private
     */
    _clearPlayer: function($elt) {
        if ($elt.parents('.qti-item').length) {
            // avoid clear in qti mode
            return;
        }
        if ($elt && $elt.data('player')) {
            $elt.data('player').destroy();
            $elt.removeData('player');
        }
    },
    /**
     * Update the preview
     * @private
     * @param {jQueryElement} $elt - the current element
     */
    _update: function($elt) {
        let player;
        let $content, $controls;
        let options = $elt.data(dataNs);
        let content, type;

        previewer._clearPlayer($elt);
        if (options) {
            type = options.type || mimeType.getFileType({ mime: options.mime, name: options.url });

            if (options.url) {
                if (!options.name) {
                    options.name = options.url.substring(
                        options.url.lastIndexOf('/') + 1,
                        options.url.lastIndexOf('.')
                    );
                }
                content = previewGenerator.generate(type, options);
            }

            if (!content) {
                content = previewGenerator.placeHolder({
                    desc: '',
                    type: options.type || options.mime || ''
                });
            }
            $content = $(content);

            $content.on('load', function() {
                iframeNotifier.parent('imageloaded');
            });

            if (options.width) {
                $content.attr('width', options.width);
            }
            if (options.height) {
                $content.attr('height', options.height);
            }

            $elt.empty().html($content);
            if (options.url) {
                if (type === 'audio' || type === 'video') {
                    const defSize = _defaultSize[type] || _defaultSize.video;
                    const width = options.width || defSize.width;
                    const height = options.height || defSize.height;
                    player = mediaplayer({
                        url: options.url,
                        type: options.mime,
                        renderTo: $content,
                        transcriptionUrl: options.transcriptionUrl,
                        width,
                        height,
                    })
                    .on('ready', function() {
                        /**
                         * @event playerready
                         */
                        $elt.trigger('playerready');
                    });
                    previewer._setPlayer($elt, player);

                    // stop video and free the socket on escape keypress(modal window hides)
                    $('body')
                        .off('keydown.mediaelement')
                        .on('keydown.mediaelement', function(event) {
                            if (event.keyCode === 27) {
                                previewer._clearPlayer($elt);
                            }
                        });

                    // stop the video and free the socket on file select from the action icons
                    // stop video, free the socket and remove player interface on video deletion
                    // stop video and free the socket on all other cases when video is selected or temporary hidden or modal window is closed
                    $controls = $(
                        '.actions a:nth-child(1), .actions a:nth-child(3), .icon-close, .upload-switcher, .select-action, .files li>span',
                        '#mediaManager'
                    );
                    $controls.off('mousedown.mediaelement').on('mousedown.mediaelement', function(event) {
                        event.stopPropagation();
                        if (!$(this).closest('.mediaplayer').length) {
                            $controls.off('mousedown.mediaelement');
                            previewer._clearPlayer($elt);
                        }
                    });
                } else if (type === 'pdf') {
                    documentViewer({
                        renderTo: $content,
                        replace: true,
                        width: options.width || _defaultSize.pdf.width,
                        height: options.height || _defaultSize.pdf.height
                    }).load(options.url, 'pdf');

                    //if the documenviewer is used within the test runner (the old one)
                    //we need to inform it the content will change.
                    //this is an already deperecated feature, but we need backward compat
                    _.defer(function() {
                        iframeNotifier.parent('imageloaded');
                    });
                }
            }

            /**
             * The plugin has been created.
             * @event previewer#update.previewer
             */
            $elt.trigger(`update.${ns}`);
        }
    },
    /**
     * Destroy completely the plugin.
     *
     * Called the jQuery way once registered by the Pluginifier.
     * @example $('selector').previewer('destroy');
     * @public
     */
    destroy: function() {
        this.each(function() {
            const $elt = $(this);
            previewer._clearPlayer($elt);
            /**
             * The plugin has been destroyed.
             * @event previewer#destroy.previewer
             */
            $elt.trigger(`destroy.${ns}`);
        });
    }
};

//Register the incrementer to behave as a jQuery plugin.
Pluginifier.register(ns, previewer);

/**
 * The only exposed function is used to start listening on data-attr
 *
 * @public
 * @example define(['ui/previewer'], function(previewer){ previewer($('rootContainer')); });
 * @param {jQueryElement} $container - the root context to listen in
 */
export default function listenDataAttr($container) {
    $container.find('[data-preview]').each(function() {
        const $elt = $(this);
        $elt.previewer({
            url: $elt.data('preview'),
            type: $elt.data('preview-type'),
            mime: $elt.data('preview-mime'),
            width: $elt.width(),
            height: $elt.height()
        });
    });
}
