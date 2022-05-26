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
 * Copyright (c) 2021 (original work) Open Assessment Technologies SA ;
 *
 */
import $ from 'jquery';
import _ from 'lodash';
import __ from 'i18n';
import initMediaEditor from './initMediaEditor';
import extractLabel from './extractLabel';

export const initAdvanced = function (widget) {
    const $form = widget.$form;
    let src = '';
    if (widget.element.is('img')) {
        src = widget.element.attr('src');
    } else {
        const img = _.find(widget.element.getBody().elements, elem => elem.is('img'));
        src = img ? img.attr('src') : '';
    }

    if (src) {
        $form.find('[data-role=advanced]').show();
    } else {
        $form.find('[data-role=advanced]').hide();
    }
};

export const initUpload = function (widget) {
    const $form = widget.$form,
        options = widget.options,
        img = widget.element.is('img') ? widget.element : _.find(widget.element.getBody().elements, elem => elem.is('img')),
        $uploadTrigger = $form.find('[data-role="upload-trigger"]'),
        $src = $form.find('input[name=src]'),
        $alt = $form.find('input[name=alt]');

    const _openResourceMgr = function () {
        $uploadTrigger.resourcemgr({
            title: __(
                'Please select an image file from the resource manager. You can add files from your computer with the button "Add file(s)".'
            ),
            appendContainer: options.mediaManager.appendContainer,
            mediaSourcesUrl: options.mediaManager.mediaSourcesUrl,
            browseUrl: options.mediaManager.browseUrl,
            uploadUrl: options.mediaManager.uploadUrl,
            deleteUrl: options.mediaManager.deleteUrl,
            downloadUrl: options.mediaManager.downloadUrl,
            fileExistsUrl: options.mediaManager.fileExistsUrl,
            params: {
                uri: options.uri,
                lang: options.lang,
                filters: [
                    { mime: 'image/jpeg' },
                    { mime: 'image/png' },
                    { mime: 'image/gif' },
                    { mime: 'image/svg+xml' },
                    { mime: 'application/x-gzip', extension: 'svgz' }
                ]
            },
            pathParam: 'path',
            path: options.mediaManager.path,
            root: options.mediaManager.root,
            select: function (e, files) {
                let file, alt;
                let confirmBox, cancel, save;
                if (files && files.length) {
                    file = files[0].file;
                    alt = files[0].alt;
                    $src.val(file);
                    if ($.trim($alt.val()) === '') {
                        if (alt === '') {
                            alt = extractLabel(file);
                        }
                        img.attr('alt', alt);
                        $alt.val(alt).trigger('change');
                    } else {
                        confirmBox = $('.change-alt-modal-feedback', $form);
                        cancel = confirmBox.find('.cancel');
                        save = confirmBox.find('.save');

                        $('.alt-text', confirmBox).html(`"${$alt.val()}"<br>${__('with')}<br>"${alt}" ?`);

                        confirmBox.modal({ width: 500 });

                        save.off('click').on('click', function () {
                            img.attr('alt', alt);
                            $alt.val(alt).trigger('change');
                            confirmBox.modal('close');
                        });

                        cancel.off('click').on('click', function () {
                            confirmBox.modal('close');
                        });
                    }

                    _.defer(function () {
                        img.attr('off-media-editor', 1);
                        $src.trigger('change');
                    });
                }
            },
            open: function () {
                // hide tooltip if displayed
                if ($src.data('$tooltip')) {
                    $src.blur().data('$tooltip').hide();
                }
            },
            close: function () {
                // triggers validation:
                $src.blur();
            }
        });
    };

    $uploadTrigger.on('click', _openResourceMgr);

    //if empty, open file manager immediately
    if (!$src.val()) {
        _openResourceMgr();
    }
};

export default function initAll(widget, mediaEditor, options) {
    initAdvanced(widget);
    initMediaEditor(widget, mediaEditor, options);
    initUpload(widget);
}

