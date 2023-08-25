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
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
 *
 * Copyright (c) 2015 (original work) Open Assessment Technologies SA;
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

let ns = 'resourcemgr';

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
    let $fileContainer = $('.files', $fileSelector);
    let $placeholder = $('.empty', $fileSelector);
    let $uploader = $('.file-upload-container', $fileSelector);
    let parentSelector = `#${$container.attr('id')} .file-selector`;
    let $pathTitle = $fileSelector.find('h1 > .title');
    let $browserTitle = $('.file-browser > h1', $container);

    //set up the uploader
    if (disableUpload) {
        let $switcher = $('.upload-switcher', $fileSelector);
        $switcher.remove();
    } else {
        setUpUploader(root);
    }
    //update current folder
    $container.on(`folderselect.${ns}`, function (e, fullPath, data, activePath, content) {
        let files;

        data = data.map(function (dataItem) {
            if (Array.isArray(dataItem.permissions)) {
                updatePermissions(dataItem);
            }
            return dataItem;
        });

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
            files = _.filter(data, function (item) {
                return !!item.uri;
            }).map(function (file) {
                file.type = mimeType.getFileType(file);
                if (typeof file.identifier === 'undefined') {
                    file.display = `${fullPath}/${file.name}`.replace('//', '/');
                } else {
                    file.display = file.identifier + file.name;
                }

                file.viewUrl = `${options.downloadUrl}?${$.param(options.params)}&${
                    options.pathParam
                }=${encodeURIComponent(file.uri)}`;
                file.downloadUrl = `${file.viewUrl}&svgzsupport=true`;
                return file;
            });

            updateFiles(fullPath, files);

            if (activePath) {
                $(`li[data-file="${activePath}"]`).trigger('click');
            }
        }
    });

    //listen for file activation
    $(parentSelector)
        .off('click', '.files li')
        .on('click', '.files li', function (e) {
            const clickedItem = e.target;
            if (clickedItem.hasAttribute('data-delete') || $(clickedItem).hasClass('icon-bin')) {
                return;
            }
            let $selected = $(this);
            let $files = $('.files > li', $fileSelector);
            let data = _.clone($selected.data());

            $files.removeClass('active');
            $selected.addClass('active');
            $container.trigger(`fileselect.${ns}`, [data]);
        });

    //select a file
    $(parentSelector)
        .off('click', '.files li a.select')
        .on('click', '.files li a.select', function (e) {
            e.preventDefault();
            let data = _.pick($(this).parents('li').data(), ['file', 'type', 'mime', 'size', 'alt']);
            if (context.mediaSources && context.mediaSources.length === 0 && data.file.indexOf('local/') > -1) {
                data.file = data.file.substring(6);
            }
            $container.trigger(`select.${ns}`, [[data]]);
        });

    //delete a file
    $fileContainer.on('delete.deleter', function (e, $target) {
        let path,
            params = {};
        if (e.namespace === 'deleter' && $target.length) {
            path = $target.data('file');
            params[options.pathParam] = path;
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

        $uploader.on('upload.uploader', function (e, file, result) {
            let path =
                $(`[data-display="${currentPath}"]`).data('path') || $(`[data-display="/${currentPath}"]`).data('path');
            if (!path) {
                path = currentPath;
            }
            $container.trigger(`filenew.${ns}`, [result, path]);
        });
        $uploader.on('fail.uploader', function (e, file, err) {
            errors.push(__('Unable to upload file %s : %s', file.name, err.message));
        });

        $uploader.on('end.uploader', function () {
            if (errors.length === 0) {
                _.delay(switchUpload, 500);
            } else {
                feedback().error(`<ul><li>${errors.join('</li><li>')}</li></ul>`, { encodeHtml: false });
            }
            //reset errors
            errors = [];
        });

        $uploader.uploader({
            upload: true,
            multiple: true,
            uploadUrl: `${options.uploadUrl}?${$.param(options.params)}&${options.pathParam}=${currentPath}`,
            fileSelect: function (files, done) {
                let givenLength = files.length;
                let fileNames = [];
                $fileContainer.find('li > .desc').each(function () {
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
                        return _.contains(filters, checkType);
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
                                `${options.fileExistsUrl}?${$.param(options.params)}&${options.pathParam}=${pathParam}`,
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
                            if (_.contains(fileNames, file.name.toLowerCase())) {
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
                    options.pathParam
                }=${currentPath}&relPath=${currentPath}`
            });
        });

        function switchUpload() {
            if ($fileContainer.css('display') === 'none') {
                $uploader.hide();
                $fileContainer.show();
                // Note: show() would display as inline, not inline-block!
                $switcher.filter('.upload').css({ display: 'inline-block' });
                $switcher.filter('.listing').hide();
                $browserTitle.text(__('Browse folders:'));
            } else {
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
            switchUpload();
        });
    }

    function updateFiles(path, files) {
        $fileContainer.empty();
        if (files.length) {
            $placeholder.hide();
            $fileContainer.append(
                fileSelectTpl({
                    files: files
                })
            );
        } else if ($fileContainer.css('display') !== 'none') {
            $placeholder.show();
        }
    }
}
