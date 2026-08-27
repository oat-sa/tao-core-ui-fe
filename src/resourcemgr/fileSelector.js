/*
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
 * Foundation, Inc., 31 Milk St # 960789 Boston, MA 02196 USA.
 *
 * Copyright (c) 2015-2026 (original work) Open Assessment Technologies SA;
 *
 */

/**
 *
 * @author Bertrand <bertrand@taotesting.com>
 */
import $ from 'jquery';
import _ from 'lodash';
import async from 'async';
import __ from 'i18n';
import mimeType from 'core/mimetype';
import fileSelectTpl from 'ui/resourcemgr/tpl/fileSelect';
import feedback from 'ui/feedback';
import context from 'context';
import 'ui/uploader';
import updatePermissions from './util/updatePermissions';
import loggerFactory from 'core/logger';
import { DEFAULT_SORT, sortAssetItems } from 'ui/resourcemgr/assetSearchContract';

const ns = 'resourcemgr';
const logger = loggerFactory(`ui/${ns}`);
const ROW_SELECTOR = '.files-list tr';

function shortenPath(path) {
    let tokens = path.replace(/\/$/, '').split('/');
    let start = tokens.length - 3;
    let end = tokens.length - 1;
    let title = _.map(tokens, function (token, index) {
        return index > start && token ? (index < end ? token[0] : token) : void 0;
    });
    title = title.filter(Boolean);
    return title.join('/');
}

/**
 * Normalize a catalog folder path for the Location column.
 * Strips URI schemes and media-root labels (Assets/Media); keeps directory path only.
 * @param {String} location
 * @returns {String}
 */
function formatLocationDisplay(location) {
    if (location === null || typeof location === 'undefined' || location === '') {
        return '';
    }
    let path = String(location).trim().replace(/\\/g, '/');
    if (!path) {
        return '';
    }

    // Drop URI schemes (taomedia://…, https://…, asset://…)
    path = path.replace(/^[a-z][a-z0-9+.-]*:\/\//i, '');
    // Residual host/path from http(s) after scheme strip
    if (path.indexOf('/') > 0 && /^[^/]+\.[^/]+\//.test(path)) {
        path = path.slice(path.indexOf('/'));
    }

    const segments = path.replace(/^\/+|\/+$/g, '').split('/').filter(Boolean);
    if (!segments.length) {
        return '/';
    }

    // Directory path only: drop trailing filename-like segment
    const last = segments[segments.length - 1];
    if (segments.length > 1 && /\.[a-z0-9]{1,8}$/i.test(last)) {
        segments.pop();
    }

    // Strip media-tree root label prefix (Assets, Media, …)
    const rootLabels = ['assets', 'media', 'mediamanager'];
    if (segments.length && rootLabels.indexOf(segments[0].toLowerCase()) !== -1) {
        segments.shift();
    }

    return segments.length ? `/${segments.join('/')}` : '/';
}

/**
 * Format updatedAt as a fixed UTC date-time (YYYY-MM-DD HH:mm).
 * @param {String} value
 * @returns {String}
 */
function formatUpdatedAtUtc(value) {
    if (!value) {
        return '';
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return String(value);
    }
    const pad = function (n) {
        return String(n).padStart(2, '0');
    };
    return (
        `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())} ` +
        `${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}`
    );
}

function isTextLarger($element, text) {
    let $dummy = $element
        .clone()
        .detach()
        .css({
            position: 'absolute',
            visibility: 'hidden',
            'text-overflow': 'clip',
            width: 'auto'
        })
        .text(text)
        .insertAfter($element);
    let textSize = $dummy.width();
    $dummy.remove();

    return textSize > $element.width();
}

export default function (options) {
    let root = options.root || '/';
    let disableUpload = options.disableUpload || false;
    let $container = options.$target;
    let $fileSelector = $('.file-selector', $container);
    let $filesWrapper = $('.files-wrapper', $fileSelector);
    let $fileContainer = $('.files-list', $fileSelector);
    let $placeholder = $('.empty', $fileSelector);
    let $uploader = $('.file-upload-container', $fileSelector);
    let parentSelector = `#${$container.attr('id')} .file-selector`;
    let $pathTitle = $fileSelector.find('h1 > .title');
    let $browserTitle = $('.file-browser > h1.resources-title', $container);
    if (!$browserTitle.length) {
        $browserTitle = $('.file-browser > h1', $container);
    }
    let searchMode = false;
    let initialSelectionApplied = false;
    let sort = Object.assign({}, DEFAULT_SORT);
    let lastFiles = [];

    //set up the uploader
    if (disableUpload) {
        let $switcher = $('.upload-switcher', $fileSelector);
        $switcher.remove();
    } else {
        setUpUploader(root);
    }

    $container.on(`searchmode.${ns}`, function (e, enabled) {
        searchMode = !!enabled;
        $fileSelector.toggleClass('search-mode', searchMode);
    });

    //update current folder
    $container.on(`folderselect.${ns}`, function (e, fullPath, data, activePath, content) {
        let files;

        if (searchMode) {
            return;
        }

        //update title
        if ($container[0].querySelector('.upload')) {
            if (content && content.permissions && content.permissions.upload) {
                $container[0].querySelector('.upload').classList.remove('hidden');
            } else {
                $container[0].querySelector('.upload').classList.add('hidden');
            }
        }

        $pathTitle.text(isTextLarger($pathTitle, fullPath) ? shortenPath(fullPath) : fullPath);

        //update content here
        if (_.isArray(data)) {
            files = _.filter(data.map(ensurePermissions), function (item) {
                return !!item.uri;
            }).map(function (file) {
                return prepareFileForDisplay(file, fullPath, activePath);
            });

            updateFiles(files);
            applyInitialSelection();
        }
    });

    // Render scoped search results from the service as-is (no client MIME/auth filtering).
    $container.on(`searchresults.${ns}`, function (e, result) {
        const items = (result && result.items) || [];
        const files = items
            .filter(function (item) {
                return item && !!item.uri;
            })
            .map(function (file) {
                return prepareFileForDisplay(ensureSearchPermissions(file), result.path || '', result.path);
            });

        $pathTitle.text(__('Search results'));
        updateFiles(files);

        if (!(result && result.error)) {
            applyInitialSelection(result && result.initialSelection);
        }
    });

    // Reopen resolve (AC3): allow preselect again after folder reload via folderselect.
    $container.on(`applycontext.${ns}`, function (e, ctx) {
        initialSelectionApplied = false;
        options.initialSelection = ctx && ctx.selection ? ctx.selection : null;
        options.currentAssetItem = ctx && ctx.currentAssetItem ? ctx.currentAssetItem : null;
        if (!options.initialSelection) {
            $fileContainer.find('tr.active').removeClass('active');
        }
    });

    function injectTranscriptionMetadata(transcriptionUrl, metadataUri, resourceUri) {
        return `${transcriptionUrl}?metadataUri=${encodeURIComponent(metadataUri)}&resourceUri=${
            resourceUri.replace('taomedia://mediamanager/', '')
        }`;
    }

    /**
     * Normalize ACL flags unless they are already a boolean permission map.
     * @param {Object} item
     * @returns {Object}
     */
    function ensurePermissions(item) {
        if (item.permissions && !Array.isArray(item.permissions) && typeof item.permissions === 'object') {
            return item;
        }
        return updatePermissions(item);
    }

    /**
     * Search results often omit ACL (indexed gateway). Missing/empty ACL must stay pickable
     * (read/preview/download) without inventing write/delete/upload. Explicit ACL arrays and
     * boolean maps are preserved / mapped via updatePermissions.
     * @param {Object} item
     * @returns {Object}
     */
    function ensureSearchPermissions(item) {
        if (!item) {
            return item;
        }
        if (item.permissions && !Array.isArray(item.permissions) && typeof item.permissions === 'object') {
            return item;
        }
        if (!item.permissions || (Array.isArray(item.permissions) && item.permissions.length === 0)) {
            item.permissions = {
                read: true,
                write: false,
                preview: true,
                download: true,
                upload: false,
                delete: false
            };
            return item;
        }
        return updatePermissions(item);
    }

    /**
     * Map a service file record to the selector display model.
     * @param {Object} file
     * @param {String} fullPath
     * @param {String} [folderPath]
     * @returns {Object}
     */
    function prepareFileForDisplay(file, fullPath, folderPath) {
        file.type = mimeType.getFileType(file);
        if (typeof file.identifier === 'undefined') {
            file.display = `${fullPath}/${file.name}`.replace('//', '/');
        } else {
            file.display = file.identifier + file.name;
        }

        file.viewUrl = `${options.downloadUrl}?${$.param(options.params)}&${
            options.pathParam || 'path'
        }=${encodeURIComponent(file.uri)}`;
        file.downloadUrl = `${file.viewUrl}&svgzsupport=true`;
        if (!file.location) {
            file.location = folderPath || fullPath || '';
        }
        file.locationDisplay = formatLocationDisplay(file.location);
        file.updatedAtDisplay = formatUpdatedAtUtc(file.updatedAt);
        return file;
    }

    /**
     * Sync sort classes and aria-sort on table headers.
     */
    function applySortHeader() {
        $fileSelector.find('.files thead th[data-sort-by]').each(function () {
            const $th = $(this);
            const field = $th.attr('data-sort-by');
            $th.removeClass('sorted sorted_asc sorted_desc');
            if (field === sort.field) {
                $th.addClass('sorted').addClass(sort.direction === 'desc' ? 'sorted_desc' : 'sorted_asc');
                $th.attr('aria-sort', sort.direction === 'desc' ? 'descending' : 'ascending');
            } else {
                $th.attr('aria-sort', 'none');
            }
        });
    }

    /**
     * Apply a column click to sort state and notify listeners.
     * @param {String} field
     */
    function changeSort(field) {
        if (!field) {
            return;
        }
        if (field === sort.field) {
            sort = {
                field,
                direction: sort.direction === 'asc' ? 'desc' : 'asc'
            };
        } else {
            sort = {
                field,
                direction: 'asc'
            };
        }
        applySortHeader();
        if (lastFiles.length) {
            updateFiles(lastFiles);
        }
        $container.trigger(`sortchange.${ns}`, [Object.assign({}, sort)]);
    }

    /**
     * Preselect initialSelection once when the matching row is present.
     * When resolve returned a currentAssetItem missing from the page, inject it.
     * @param {String} [selection]
     */
    function applyInitialSelection(selection) {
        const target = selection || options.initialSelection;
        if (!target || initialSelectionApplied) {
            return;
        }
        let $item = $fileContainer.find('tr').filter(function () {
            return $(this).attr('data-file') === String(target);
        });
        if (!$item.length && options.currentAssetItem && String(options.currentAssetItem.uri) === String(target)) {
            const injected = prepareFileForDisplay(
                ensurePermissions(Object.assign({}, options.currentAssetItem)),
                options.currentAssetItem.location || '',
                options.currentAssetItem.location || ''
            );
            updateFiles([injected].concat(lastFiles || []));
            $item = $fileContainer.find('tr').filter(function () {
                return $(this).attr('data-file') === String(target);
            });
        }
        if ($item.length) {
            initialSelectionApplied = true;
            $item.first().trigger('click');
        }
    }

    applySortHeader();

    $(parentSelector)
        .off('click.resourcemgr', '.files thead th[data-sort-by]')
        .on('click.resourcemgr', '.files thead th[data-sort-by]', function (e) {
            e.preventDefault();
            e.stopImmediatePropagation();
            changeSort($(this).attr('data-sort-by'));
        })
        .off('keydown.resourcemgr', '.files thead th[data-sort-by]')
        .on('keydown.resourcemgr', '.files thead th[data-sort-by]', function (e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                e.stopImmediatePropagation();
                changeSort($(this).attr('data-sort-by'));
            }
        });

    //listen for file activation
    $(parentSelector)
        .off('click', ROW_SELECTOR)
        .on('click', ROW_SELECTOR, function (e) {
            if ($(e.target).closest('.row-actions').length) {
                return;
            }
            if ($(e.target).closest('a.select, a.download, a.delete').length) {
                return;
            }
            const clickedItem = e.target;
            if (clickedItem.hasAttribute('data-delete') || $(clickedItem).hasClass('icon-bin')) {
                return;
            }
            let $selected = $(this);
            let $files = $(ROW_SELECTOR, $fileSelector);
            let data = _.clone($selected.data());
            if (
                options.resourceMetadataUrl
                && options.transcriptionMetadata
                && data.file.includes('taomedia://mediamanager/')
            ) {
                data.transcriptionUrl = injectTranscriptionMetadata(
                    options.resourceMetadataUrl,
                    options.transcriptionMetadata,
                    data.file
                );
            }
            $files.removeClass('active');
            $selected.addClass('active');
            $container.trigger(`fileselect.${ns}`, [data]);
        });

    //select a file
    $(parentSelector)
        .off('click', `${ROW_SELECTOR} a.select`)
        .on('click', `${ROW_SELECTOR} a.select`, function (e) {
            e.preventDefault();
            let data = _.pick($(this).closest('tr').data(), ['file', 'type', 'mime', 'size', 'alt']);
            if (context.mediaSources && context.mediaSources.length === 0 && data.file.indexOf('local/') > -1) {
                data.file = data.file.substring(6);
            }
            $container.trigger(`select.${ns}`, [[data]]);
        });

    //delete a file
    $(parentSelector)
        .off('click', `${ROW_SELECTOR} a.delete`)
        .on('click', `${ROW_SELECTOR} a.delete`, function (e) {
            // This function replaces ui/deleter and must follow the same logic.
            // The main difference is that it insert a confirmation dialog before deleting the file.
            e.preventDefault();
            const $elt = $(e.target);
            if ($elt.hasClass(options.disableClass)) {
                return;
            }

            const $target = $elt.closest('tr');
            const path = $target.data('file');
            const hooks = [];

            if (options.hooks && 'function' === typeof options.hooks.deleteFile) {
                hooks.push(options.hooks.deleteFile(path));
            }

            Promise.all(hooks)
                .then(() => {
                    $(this).trigger('delete.deleter', [$target]);
                    $target.trigger('delete', [false]);

                    $target.detach();
                    $target.remove();

                    $fileContainer.trigger('deleted.deleter', [$target]);
                })
                .catch(err => {
                    if (err instanceof Error) {
                        logger.error(err);
                    }
                });
        });
    $fileContainer.on('delete.deleter', function (e, $target) {
        let path,
            params = {};
        if (e.namespace === 'deleter' && $target.length) {
            path = $target.data('file');
            params[options.pathParam || 'path'] = path;
            $.getJSON(options.deleteUrl, _.merge(params, options.params), function (response) {
                if (response.deleted) {
                    $container.trigger(`filedelete.${ns}`, [path]);
                }
            });
        }
    });

    function setUpUploader(currentPath) {
        let errors = [];
        let $switcher = $('.upload-switcher a', $fileSelector);
        let isUploadMode = false;

        $uploader.on('upload.uploader', function (e, file, result) {
            $container.trigger(`filenew.${ns}`, [result, currentPath]);
        });
        $uploader.on('fail.uploader', function (e, file, err) {
            errors.push(
                __('Unable to upload file %s : %s', _.escape(file && file.name), _.escape(err && err.message))
            );
        });

        $uploader.on('end.uploader', function () {
            if (errors.length === 0) {
                setUploadMode(false);
            } else {
                feedback().error(`<ul><li>${errors.join('</li><li>')}</li></ul>`, { encodeHtml: false });
            }
            //reset errors
            errors = [];
        });

        $uploader.uploader({
            upload: true,
            multiple: true,
            uploadUrl: `${options.uploadUrl}?${$.param(options.params)}&${options.pathParam || 'path'}=${currentPath}`,
            fileSelect: function (files, done) {
                let givenLength = files.length;
                let fileNames = [];
                $fileContainer.find('.desc').each(function () {
                    fileNames.push($(this).text().toLowerCase());
                });

                //check the mime-type
                if (options.params.filters) {
                    let filters = [],
                        i;

                    if (!_.isString(options.params.filters)) {
                        for (i in options.params.filters) {
                            filters.push(options.params.filters[i]['mime']);
                        }
                    } else {
                        filters = options.params.filters.split(',');
                    }
                    //TODO check stars
                    files = _.filter(files, function (file) {
                        // Under rare circumstances a browser may report the mime type
                        // with quotes (e.g. "application/foo" instead of application/foo)
                        let checkType = file.type.replace(/^["']+|['"]+$/g, '');
                        return _.includes(filters, checkType);
                    });

                    if (files.length !== givenLength) {
                        //TODO use a feedback popup
                        feedback().error('Unauthorized files have been removed');
                    }
                }

                async.filter(
                    files,
                    function (file, cb) {
                        let result = true;

                        //try to call a server side service to check whether the selected files exists or not.
                        if (options.fileExistsUrl) {
                            let pathParam = `${currentPath}/${file.name}`;
                            pathParam.replace('//', '/');
                            $.getJSON(
                                `${options.fileExistsUrl}?${$.param(options.params)}&${options.pathParam || 'path'}=${pathParam}`,
                                function (response) {
                                    if (response && response.exists === true) {
                                        //eslint-disable-next-line no-alert
                                        result = window.confirm(__('Do you want to override "%s"?', file.name));
                                    }
                                    cb(result);
                                }
                            );
                        } else {
                            //fallback on client side check
                            if (_.includes(fileNames, file.name.toLowerCase())) {
                                //eslint-disable-next-line no-alert
                                result = window.confirm(__('Do you want to override "%s"?', file.name));
                            }
                            cb(result);
                        }
                    },
                    done
                );
            }
        });

        $container.on(`folderselect.${ns}`, function (e, fullPath, data, uri) {
            currentPath = uri;
            $uploader.uploader('options', {
                uploadUrl: `${options.uploadUrl}?${$.param(options.params)}&${
                    options.pathParam || 'path'
                }=${currentPath}&relPath=${currentPath}`
            });
        });

        function setUploadMode(enableUploadMode) {
            if (!enableUploadMode) {
                isUploadMode = false;
                $uploader.hide();
                $filesWrapper.show();
                $fileContainer.show();
                // Note: show() would display as inline, not inline-block!
                $switcher.filter('.upload').css({ display: 'inline-block' });
                $switcher.filter('.listing').hide();
                $browserTitle.text(__('Resources'));
            } else {
                isUploadMode = true;
                $filesWrapper.hide();
                $fileContainer.hide();
                $placeholder.hide();
                $uploader.show();
                $switcher.filter('.upload').hide();
                $switcher.filter('.listing').css({ display: 'inline-block' });
                $browserTitle.text(__('Upload into:'));
                $uploader.uploader('reset');
            }
        }

        //switch to upload mode
        $switcher.click(function (e) {
            e.preventDefault();
            if ($(this).hasClass('upload')) {
                setUploadMode(true);
            } else if ($(this).hasClass('listing')) {
                setUploadMode(false);
            }
        });

        setUploadMode(isUploadMode);
    }

    function updateFiles(files) {
        lastFiles = Array.isArray(files) ? files.slice() : [];
        const sorted = sortAssetItems(lastFiles, sort);
        $fileContainer.empty();
        if (sorted.length) {
            $placeholder.hide();
            $filesWrapper.show();
            $fileContainer.append(
                fileSelectTpl({
                    files: sorted
                })
            );
            $fileContainer.find('a.download').each(function () {
                this.addEventListener('click', function (e) {
                    e.stopPropagation();
                });
            });
        } else if ($fileSelector.find('.asset-search-error:not([hidden])').length === 0) {
            $filesWrapper.hide();
            // Stylesheet defaults `.empty` to display:none; force visible for empty states.
            $placeholder.css('display', 'block');
        } else {
            $filesWrapper.hide();
            $placeholder.hide();
        }
    }
}
