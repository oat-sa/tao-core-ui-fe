import $ from 'jquery';
import _ from 'lodash';
import Pluginifier from 'core/pluginifier';
import assetSearch from 'ui/resourcemgr/assetSearch';
import fileBrowser from 'ui/resourcemgr/fileBrowser';
import filePreview from 'ui/resourcemgr/filePreview';
import fileSelector from 'ui/resourcemgr/fileSelector';
import feedback from 'ui/feedback';
import layout from 'ui/resourcemgr/tpl/layout';
import urlUtil from 'util/url';
import 'ui/modal';
import 'ui/resourcemgr/css/resourcemgr.css';

var ns = 'resourcemgr';
var dataNs = 'ui.' + ns;

var defaults = {
    mediaSources: [{ root: 'local', path: '/' }],
    open: true,
    appendContainer: '.tao-scope:first',
    title: '',
    pathParam: 'path',
    // Advanced Search metadata filters (same endpoints as ui/searchModal)
    rootClassUri: 'http://www.tao.lu/Ontologies/TAOMedia.rdf#Media',
    classMappingUrl: urlUtil.route('getWithMapping', 'ClassMetadata', 'tao'),
    statusUrl: urlUtil.route('status', 'AdvancedSearch', 'tao'),
    maxListSize: 5
};

/**
 * The ResourceMgr component helps you to browse and select external resources.
 * @exports ui/resourcemgr
 */
var resourceMgr = {
    /**
     * Initialize the plugin.
     *
     * Called the jQuery way once registered by the Pluginifier.
     * @example $('selector').resourcemgr({
     *
     *  });
     *
     * @constructor
     * @param {Object} options - the plugin options
     * @param {Sring|Boolean} [options.bindEvent = 'click'] - the event that trigger the toggling
     * @param {String} [options.browseUrl] - folder browse endpoint (legacy alias: options.url)
     * @param {String} [options.url] - legacy alias for browseUrl
     * @param {String} [options.searchUrl] - scoped asset-search endpoint; omit for browse-only
     * @param {Boolean} [options.browseSearchFallback=true] - client filter when searchUrl returns browse-shaped `{ children }`
     * @param {String} [options.initialPath] - folder to open on start (within the media source tree)
     * @param {String} [options.initialSelection] - asset URI to preselect when present in results
     * @param {String} [options.currentAsset] - asset URI/path to resolve to parent folder + selection
     * @param {String} [options.pathParam='path'] - query parameter name for folder/asset path
     * @param {String} [options.rootClassUri=TAOMedia#Media] - Assets class URI for Advanced Search criteria (metadata filters)
     * @param {String} [options.classMappingUrl] - ClassMetadata mapping endpoint for criteria list
     * @param {String} [options.statusUrl] - Advanced Search status endpoint
     * @param {Number} [options.maxListSize=5] - max list values per criterion in filters UI
     * @fires ResourceMgr#create.resourcemgr
     * @returns {jQueryElement} for chaining
     */
    init: function(options) {
        var that = resourceMgr;

        //get options using default
        options = _.defaults(options, defaults);
        if (!options.browseUrl && options.url) {
            options.browseUrl = options.url;
        }

        return this.each(function() {
            var $elt = $(this);
            var $target;

            if (!$elt.data(dataNs)) {
                //add data to the element
                $elt.data(dataNs, options);

                //auto bind events configured in options
                _.functions(options).forEach(function(eventName) {
                    $elt.on(eventName + '.' + ns, function() {
                        options[eventName].apply($elt, arguments);
                    });
                });

                $target = options.$target || that._createTarget($elt);

                $target.modal({
                    startClosed: true,
                    minWidth: 'responsive'
                });

                //rethrow some events
                $target.on('select.' + ns, function(e, files) {
                    that._close($elt);
                    $elt.trigger(e, [files]);
                });
                $target.on('closed.modal', function() {
                    $elt.trigger('close.' + ns);
                });

                that._resolveCurrentAssetContext(options).always(function(resolvedOptions) {
                    options = resolvedOptions;
                    $elt.data(dataNs, options);
                    // coderabbit: ignored — create/open must follow _startBrowsers so the modal is not empty; ajaxTimeoutMs already bounds context resolution
                    that._startBrowsers($elt, options);

                    /**
                     * The plugin have been created.
                     * @event ResourceMgr#create.resourcemgr
                     */
                    $elt.trigger('create.' + ns, [options.$target[0]]);

                    if (options.open) {
                        that._open($elt);
                    }
                });
            } else {
                // Reopen: consumer may pass a new currentAsset (edit/change after create).
                that._reopenWithContext($elt, options);
            }
        });
    },

    /**
     * Merge reopen options, re-resolve currentAsset, re-apply folder/selection, then open.
     * @param {jQuery} $elt
     * @param {Object} incoming - options from the latest .resourcemgr(…) call
     */
    _reopenWithContext: function($elt, incoming) {
        const that = resourceMgr;
        const stored = $elt.data(dataNs);
        if (!stored) {
            return;
        }

        stored.currentAsset = incoming.currentAsset;
        if (incoming.params && typeof incoming.params === 'object') {
            stored.params = Object.assign({}, stored.params || {}, incoming.params);
        }
        ['select', 'open', 'close'].forEach(function(key) {
            if (typeof incoming[key] === 'function') {
                stored[key] = incoming[key];
            }
        });

        stored.initialPath = undefined;
        stored.initialSelection = null;
        stored.currentAssetItem = null;
        stored.contextToken = (stored.contextToken || 0) + 1;
        const token = stored.contextToken;
        $elt.data(dataNs, stored);

        that._resolveCurrentAssetContext(stored).always(function(resolved) {
            if (resolved.contextToken !== token) {
                return;
            }
            $elt.data(dataNs, resolved);
            that._applyResolvedContext($elt, resolved);
            that._open($elt);
        });
    },

    /**
     * Notify mounted browser/selector to open parent folder and (re)preselect.
     * @param {jQuery} $elt
     * @param {Object} options
     */
    _applyResolvedContext: function($elt, options) {
        if (!options || !options.$target) {
            return;
        }
        options.$target.trigger('applycontext.' + ns, [
            {
                path: options.initialPath || options.path || '/',
                selection: options.initialSelection || null,
                currentAssetItem: options.currentAssetItem || null
            }
        ]);
    },

    /**
     * Resolve currentAsset via browse/search endpoint into initialPath/initialSelection.
     * @param {Object} options
     * @returns {Promise}
     */
    _resolveCurrentAssetContext: function(options) {
        const deferred = $.Deferred();
        if (!options.currentAsset || (!options.browseUrl && !options.searchUrl)) {
            deferred.resolve(options);
            return deferred.promise();
        }

        const endpoint = options.browseUrl || options.searchUrl;
        const pathParam = options.pathParam || 'path';
        const params = Object.assign({}, options.params || {}, {
            currentAsset: options.currentAsset
        });
        params[pathParam] = options.path || '/';

        $.ajax({
            url: endpoint,
            method: 'GET',
            dataType: 'json',
            timeout: Number(options.ajaxTimeoutMs) > 0 ? Number(options.ajaxTimeoutMs) : 10000,
            data: params
        })
            .done(function(response) {
                const payload = response && response.data ? response.data : response;
                if (payload && payload.parentPath) {
                    options.initialPath = payload.parentPath;
                }
                if (payload && payload.currentAsset && payload.currentAsset.uri) {
                    options.initialSelection = payload.currentAsset.uri;
                    options.currentAssetItem = payload.currentAsset;
                } else {
                    options.initialSelection = null;
                    options.currentAssetItem = null;
                }
                deferred.resolve(options);
            })
            .fail(function() {
                // AC6: keep RM usable without selection; surface recoverable feedback.
                options.initialSelection = null;
                options.currentAssetItem = null;
                if (options.$target && options.$target.length) {
                    feedback(options.$target).warning(
                        'Unable to resolve the current asset. You can still browse and select another file.'
                    );
                }
                deferred.resolve(options);
            });

        return deferred.promise();
    },

    /**
     * Mount file browser / selector / search after options are ready.
     * @param {jQuery} $elt
     * @param {Object} options
     */
    _startBrowsers: function($elt, options) {
        const $fileBrowser = $('.file-browser .file-browser-wrapper', options.$target);
        if (options.mediaSourcesUrl) {
            $.getJSON(options.mediaSourcesUrl)
                .done(function(data) {
                    const mediaSources = data || defaults.mediaSources;
                    for (let i = 0; i < mediaSources.length; i++) {
                        options.root = mediaSources[i].root;
                        options.path = mediaSources[i].path;
                        $fileBrowser.append(
                            '<div class="' + options.root + '"><ul class="folders"></ul></div>'
                        );
                        fileBrowser(options);
                    }
                })
                .fail(function() {
                    for (let i = 0; i < defaults.mediaSources.length; i++) {
                        options.root = defaults.mediaSources[i].root;
                        options.path = defaults.mediaSources[i].path;
                        $fileBrowser.append(
                            '<div class="' + options.root + '"><ul class="folders"></ul></div>'
                        );
                        fileBrowser(options);
                    }
                });
        } else if (options.path && options.root) {
            $fileBrowser.append('<div class="' + options.root + '"><ul class="folders"></ul></div>');
            fileBrowser(options);
        }

        $fileBrowser.find('li.root:last').addClass('active');
        fileSelector(options);
        filePreview(options);
        assetSearch(options);
    },

    _createTarget: function($elt) {
        var options = $elt.data(dataNs);
        if (options) {
            //create an identifier to the target content
            options.targetId = 'resourcemgr-' + $(document).find('.resourcemgr').length;

            //generate
            options.$target = $(
                layout({
                    title: options.title || '',
                    className: options.className || '',
                    assetSearchInputId: options.targetId + '-asset-search'
                })
            );

            options.$target
                .attr('id', options.targetId)
                .css('display', 'none')
                .appendTo(options.appendContainer);

            $elt.data(dataNs, options);
        }
        return options.$target;
    },

    _open: function($elt) {
        var options = $elt.data(dataNs);
        if (options && options.$target) {
            options.$target.modal('open');

            /**
             * Open the resource manager.
             * @event ResourceMgr#open.resourcemgr
             */
            $elt.trigger('open.' + ns);
        }
    },

    _close: function($elt) {
        var options = $elt.data(dataNs);
        if (options && options.$target) {
            options.$target.modal('close');
        }
    },
    /**
     * Destroy completely the plugin.
     *
     * Called the jQuery way once registered by the Pluginifier.
     * @example $('selector').resourcemgr('destroy');
     * @public
     */
    destroy: function() {

        this.each(function() {
            var $elt = $(this);
            var options = $elt.data(dataNs);
            $elt.data(dataNs, null);
            /*eslint no-undefined: "error"*/
            if (typeof options.bindEvent !== 'undefined' && options.bindEvent !== false) {
                $elt.off(options.bindEvent);
            }

            if (options.targetId) {

                options.$target
                    .on('closed.modal', function() {
                        $('#' + options.targetId).remove();
                        $(window).off('resize.resourcemgr');
                        /**
                         * The plugin have been destroyed.
                         * @event ResourceMgr#destroy.resourcemgr
                         */
                        $elt.trigger('destroy.' + ns);
                    })
                    .modal('close');
            } else {
                $(window).off('resize.resourcemgr');
                /**
                 * The plugin have been destroyed.
                 * @event ResourceMgr#destroy.resourcemgr
                 */
                $elt.trigger('destroy.' + ns);
            }
        });
    }
};

//Register the resourcemgr to behave as a jQuery plugin.
Pluginifier.register(ns, resourceMgr);
