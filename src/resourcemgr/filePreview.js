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
 * Foundation, Inc., 31 Milk St # 960789 Boston, MA 02196 USA.
 *
 * Copyright (c) 2018-2026 (original work) Open Assessment Technologies SA;
 */
import $ from 'jquery';
import _ from 'lodash';
import bytes from 'util/bytes';
import context from 'context';
import 'ui/previewer';

const ns = 'resourcemgr';
const EMPTY_META = '\u2014';

export default function(options) {
    const $container = options.$target;
    const $filePreview = $('.file-preview', $container);
    const $previewer = $('.previewer', $container);
    const $propType = $('.prop-type', $filePreview);
    const $propSize = $('.prop-size', $filePreview);
    const $propUrl = $('.prop-url', $filePreview);
    const $link = $('a', $propUrl);
    const $selectButton = $('.select-action', $filePreview);
    let currentSelection = [];

    $container.on(`fileselect.${ns}`, function(e, file) {
        const $listItem = $container[0].querySelector(`[data-file='${file.file}']`);
        if (file && file.file && $listItem && $listItem.dataset) {
            startPreview(file, $listItem.dataset.preview === 'true', $listItem.dataset.download === 'true', $listItem.dataset.select === 'true');
            currentSelection = file;
        } else {
            stopPreview();
        }
    });
    $container.on(`filedelete.${ns}`, function (e, path) {
        if (currentSelection.file === path) {
            stopPreview();
        }
    });

    $selectButton.on('click', function(e) {
        e.preventDefault();

        const data = _.pick(currentSelection, ['file', 'type', 'mime', 'size', 'alt']);
        if (context.mediaSources && context.mediaSources.length === 0 && data.file.indexOf('local/') > -1) {
            data.file = data.file.substring(6);
        }

        $container.trigger(`select.${ns}`, [[data]]);
    });

    /**
     * @param {*} value
     * @returns {string}
     */
    function metaOrDash(value) {
        if (value === null || typeof value === 'undefined' || value === '') {
            return EMPTY_META;
        }
        return String(value);
    }

    function startPreview(file, preview, download, select) {
        if (preview) {
            $previewer.previewer(file);
            if (file.type || file.mime) {
                $propType.text(
                    file.type && file.mime ? `${file.type} (${file.mime})` : metaOrDash(file.type || file.mime)
                );
            } else {
                $propType.text(EMPTY_META);
            }
            $propSize.text(
                file.size === null || typeof file.size === 'undefined' || file.size === ''
                    ? EMPTY_META
                    : bytes.hrSize(file.size)
            );
        } else {
            $propType.text(EMPTY_META);
            $propSize.text(EMPTY_META);
        }
        if(download) {
            $link.attr('href', file.download).attr('download', file.file);
            if ($link.hasClass('hidden')) {
                $link.removeClass('hidden');
            }
        } else {
            $link.attr('href', '#').attr('download', '#');
            $link.addClass('hidden');
        }
        if (select) {
            $selectButton.removeAttr('disabled');
        }
    }

    function stopPreview() {
        $previewer.previewer('update', { url: false });
        $propType.text(EMPTY_META);
        $propSize.text(EMPTY_META);
        $('a', $propUrl).addClass('hidden');
        $selectButton.attr('disabled', 'disabled');
    }
}
