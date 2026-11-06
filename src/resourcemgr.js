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
import __ from 'i18n';
import 'ui/modal';
import 'ui/resourcemgr/css/resourcemgr.css';

var ns = 'resourcemgr';
var dataNs = 'ui.' + ns;
var baseDataNs = dataNs + '.base';
// Keys created by a single mount and dropped together with the target.
var mountKeys = [
    '$target',
    'targetId',
    '_browsersStartPromise',
    '_createEventEmitted',
    'contextToken',
    'currentAssetItem',
    'hasAlreadySelected'
];
// Per-call context: consumed by the current mount, never persisted as configuration.
var contextKeys = ['currentAsset', 'initialPath', 'initialSelection'];
// Deleted from the live options when the target is discarded (mount keys + the media source
// pointers that _startBrowsers rewrites).
var runtimeKeys = mountKeys.concat(['root', 'path']);
// Never persisted into the base configuration snapshot.
var baseIgnoredKeys = mountKeys.concat(contextKeys);

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
    maxListSize: 5,
    ajaxTimeoutMs: 30000
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
     * @param {Boolean} [options.browseSearchFallback=false] - client filter when searchUrl returns browse-shaped `{ children }`
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
        var incoming = options && typeof options === 'object' ? options : {};

        return this.each(function() {
            var $elt = $(this);
            var base = $elt.data(baseDataNs);
            var initial;
            var stored;

            if (!base) {
                initial = _.defaults({}, incoming, defaults);
                base = that._createBaseOptions(that._normalizeBrowseUrl(initial));
                $elt.data(baseDataNs, base);

                //auto bind events configured in options
                that._bindConsumerEvents($elt, base);
            } else {
                that._mergeBaseOptions(base, incoming);
                that._normalizeBrowseUrl(base);
                $elt.data(baseDataNs, base);
            }

            stored = $elt.data(dataNs);

            if (!stored) {
                that._mount($elt, that._buildOptions(base, incoming), false);
                return;
            }

            if (stored.$target && stored.$target.length && stored.$target.hasClass('opened')) {
                // Reopen: consumer may pass a new currentAsset (edit/change after create).
                that._reopenWithContext($elt, incoming);
                return;
            }

            that._mount($elt, that._buildOptions(base, incoming), true);
        });
    },

    _createBaseOptions: function(options) {
        var base = _.assign({}, options);
        baseIgnoredKeys.forEach(function(key) {
            delete base[key];
        });
        return base;
    },

    // Keep consumer-provided configuration across remounts without touching runtime state.
    _mergeBaseOptions: function(base, incoming) {
        if (!incoming || typeof incoming !== 'object') {
            return base;
        }
        Object.keys(incoming).forEach(function(key) {
            if (baseIgnoredKeys.indexOf(key) === -1) {
                base[key] = incoming[key];
            }
        });
        return base;
    },

    _normalizeBrowseUrl: function(options) {
        if (!options.browseUrl && options.url) {
            options.browseUrl = options.url;
        }
        return options;
    },

    _buildOptions: function(base, incoming) {
        var fresh = _.assign({}, base);
        resourceMgr._mergeBaseOptions(fresh, incoming);
        contextKeys.forEach(function(key) {
            if (incoming && Object.prototype.hasOwnProperty.call(incoming, key)) {
                fresh[key] = incoming[key];
            }
        });
        resourceMgr._normalizeBrowseUrl(fresh);
        return _.defaults(fresh, defaults);
    },

    _bindConsumerEvents: function($elt, options) {
        _.functions(options).forEach(function(eventName) {
            $elt.on(eventName + '.' + ns, function() {
                const live = $elt.data(dataNs);
                if (live && typeof live[eventName] === 'function') {
                    live[eventName].apply($elt, arguments);
                }
            });
        });
    },

    _unbindConsumerEvents: function($elt, options) {
        _.functions(options || {}).forEach(function(eventName) {
            $elt.off(eventName + '.' + ns);
        });
    },

    _mount: function($elt, options, forceOpen) {
        var that = resourceMgr;
        var current = $elt.data(dataNs);
        var $target;
        var isCurrent;

        if (current && current.$target) {
            that._discard($elt, current.$target);
        }

        $elt.data(dataNs, options);

        $target = that._createTarget($elt);

        $target.modal({
            startClosed: true,
            minWidth: 'responsive',
            animate: false
        });

        //rethrow some events
        $target.on('select.' + ns, function(e, files) {
            that._close($elt);
            $elt.trigger(e, [files]);
        });
        // Capture the target before the close event and defer discard by one tick: a close can come from
        // the select dispatch, so the consumer must still read the modal; close.resourcemgr fires before removal.
        $target.on('closed.modal', function() {
            var live = $elt.data(dataNs);
            var capturedTarget = live && live.$target;
            $elt.trigger('close.' + ns);
            window.setTimeout(function() {
                that._discard($elt, capturedTarget);
            }, 0);
        });

        isCurrent = function() {
            return $elt.data(dataNs) === options;
        };

        that._resolveCurrentAssetContext(options).always(function() {
            if (!isCurrent() || !options.$target) {
                return;
            }

            that._ensureBrowsersStarted($elt, options).always(function() {
                if (!isCurrent() || !options.$target) {
                    return;
                }
                if (!options._createEventEmitted) {
                    options._createEventEmitted = true;
                    $elt.data(dataNs, options);
                    /**
                     * The plugin have been created.
                     * @event ResourceMgr#create.resourcemgr
                     */
                    $elt.trigger('create.' + ns, [options.$target[0]]);
                }

                if (forceOpen || options.open) {
                    that._open($elt);
                }
            });
        });
    },

    /**
     * Merge reopen options, re-resolve currentAsset, re-apply folder/selection, then open.
     * @param {jQuery} $elt
     * @param {Object} incoming - options from the latest .resourcemgr(…) call
     */
    _reopenWithContext: function($elt, incoming) {
        const that = resourceMgr;
        var stored = $elt.data(dataNs);
        var token;

        if (!stored) {
            return;
        }

        contextKeys.forEach(function(key) {
            if (Object.prototype.hasOwnProperty.call(incoming, key)) {
                stored[key] = incoming[key];
            } else {
                delete stored[key];
            }
        });

        if (Object.prototype.hasOwnProperty.call(incoming, 'currentAsset')) {
            stored.initialPath = null;
            stored.initialSelection = null;
        }
        stored.currentAssetItem = null;

        if (incoming.params && typeof incoming.params === 'object') {
            stored.params = Object.assign({}, stored.params || {}, incoming.params);
        }
        ['select', 'open', 'close'].forEach(function(key) {
            if (typeof incoming[key] === 'function') {
                stored[key] = incoming[key];
            }
        });

        stored.contextToken = (stored.contextToken || 1) + 1;
        token = stored.contextToken;

        stored = _.assign({}, stored);
        $elt.data(dataNs, stored);

        that._resolveCurrentAssetContext(stored).always(function(resolved) {
            const current = $elt.data(dataNs);
            if (!current || current.contextToken !== token) {
                return;
            }
            $elt.data(dataNs, resolved);
            that._ensureBrowsersStarted($elt, resolved).always(function() {
                that._applyResolvedContext($elt, resolved);
                that._open($elt);
            });
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
            timeout: Number(options.ajaxTimeoutMs) > 0 ? Number(options.ajaxTimeoutMs) : defaults.ajaxTimeoutMs,
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
                        __('Unable to resolve the current asset. You can still browse and select another file.')
                    );
                }
                deferred.resolve(options);
            });

        return deferred.promise();
    },

    /**
     * Start browsers once and resolve when the tree wrapper is mounted.
     * @param {jQuery} $elt
     * @param {Object} options
     * @returns {Promise}
     */
    _ensureBrowsersStarted: function($elt, options) {
        const stored = $elt.data(dataNs) || options;
        if (stored._browsersStartPromise) {
            return stored._browsersStartPromise;
        }

        stored._browsersStartPromise = this._startBrowsers(stored);
        $elt.data(dataNs, stored);
        return stored._browsersStartPromise;
    },

    /**
     * Mount file browser / selector / search after options are ready.
     * @param {Object} options
     */
    _startBrowsers: function(options) {
        var $target = options.$target;
        var isLive = function() {
            return options.$target === $target;
        };
        const $fileBrowser = $('.file-browser .file-browser-wrapper', options.$target);

        const waitForTreeWrapper = function() {
            const deferred = $.Deferred();
            const isMounted = function() {
                return $fileBrowser.children().length > 0;
            };

            if (!isLive() || isMounted()) {
                deferred.resolve();
                return deferred.promise();
            }

            let attempts = 200;
            const poll = function() {
                if (!isLive()) {
                    deferred.resolve();
                    return;
                }
                if (isMounted()) {
                    deferred.resolve();
                    return;
                }
                attempts -= 1;
                if (attempts <= 0) {
                    deferred.reject();
                    return;
                }
                window.setTimeout(poll, 50);
            };
            poll();
            return deferred.promise();
        };

        const finishMount = function() {
            $fileBrowser.find('li.root:last').addClass('active');
            fileSelector(options);
            filePreview(options);
            assetSearch(options);
        };

        const mountFromSources = function(mediaSources) {
            const sources = mediaSources || defaults.mediaSources;
            for (let i = 0; i < sources.length; i++) {
                options.root = sources[i].root;
                options.path = sources[i].path;
                $fileBrowser.children('.file-browser-scroll').append(
                    '<div class="' + options.root + '"><ul class="folders"></ul></div>'
                );
                fileBrowser(options);
            }
        };

        const afterComponentsMounted = function() {
            finishMount();
            return waitForTreeWrapper();
        };

        if (options.mediaSourcesUrl) {
            return $.getJSON(options.mediaSourcesUrl).then(
                function(data) {
                    if (!isLive()) {
                        return $.Deferred().resolve().promise();
                    }
                    mountFromSources(data || defaults.mediaSources);
                    return afterComponentsMounted();
                },
                function() {
                    if (!isLive()) {
                        return $.Deferred().resolve().promise();
                    }
                    mountFromSources(defaults.mediaSources);
                    return afterComponentsMounted();
                }
            );
        }

        if (options.path && options.root) {
            $fileBrowser.children('.file-browser-scroll').append(
                '<div class="' + options.root + '"><ul class="folders"></ul></div>'
            );
            fileBrowser(options);
        }

        return afterComponentsMounted();
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
                    assetSearchInputId: options.targetId + '-asset-search',
                    assetSearchBodyId: options.targetId + '-asset-search-body'
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

    // Idempotent: a missing or already detached target is ignored, so a deferred discard and a remount in the same tick cannot conflict.
    _discard: function($elt, $target) {
        var live;
        var searchTeardown;

        if (!$target || !$target.length || !$target[0].parentNode) {
            return;
        }

        searchTeardown = $target.data('assetSearchTeardown');
        if (typeof searchTeardown === 'function') {
            searchTeardown();
        }
        $target.removeData('assetSearchTeardown');

        if ($target.hasClass('modal')) {
            $target.modal('destroy');
        }
        $target.remove();

        live = $elt.data(dataNs);
        if (live && live.$target === $target) {
            runtimeKeys.forEach(function(key) {
                delete live[key];
            });
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
        var that = resourceMgr;

        this.each(function() {
            var $elt = $(this);
            var live = $elt.data(dataNs);
            if (!live) {
                $(window).off('resize.resourcemgr');
                /**
                 * The plugin have been destroyed.
                 * @event ResourceMgr#destroy.resourcemgr
                 */
                $elt.trigger('destroy.' + ns);
                return;
            }

            /*eslint no-undefined: "error"*/
            if (typeof live.bindEvent !== 'undefined' && live.bindEvent !== false) {
                $elt.off(live.bindEvent);
            }

            that._discard($elt, live.$target);
            $elt.removeData(dataNs);
            $elt.removeData(baseDataNs);
            $(window).off('resize.resourcemgr');
            that._unbindConsumerEvents($elt, live);
            /**
             * The plugin have been destroyed.
             * @event ResourceMgr#destroy.resourcemgr
             */
            $elt.trigger('destroy.' + ns);
        });
    }
};

//Register the resourcemgr to behave as a jQuery plugin.
Pluginifier.register(ns, resourceMgr);
