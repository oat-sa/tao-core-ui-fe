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
 * Copyright (c) 2021 (original work) Open Assessment Technologies SA (under the project TAO-PRODUCT);
 */
import 'jquery';
import _ from 'lodash';
import mimeType from 'core/mimetype';
import alignmentHelper from 'ui/mediaEditor/plugins/mediaAlignment/helper';
import mediaEditorComponent from 'ui/mediaEditor/mediaEditorComponent';
import { mediaSizer } from './mediaSizer';

const getMedia = (imgQtiElement, $imgNode, cb) => {
    //init data-responsive:
    if (typeof imgQtiElement.data('responsive') === 'undefined') {
        if (imgQtiElement.attr('width') && !/[0-9]+%/.test(imgQtiElement.attr('width'))) {
            imgQtiElement.data('responsive', false);
        } else {
            imgQtiElement.data('responsive', true);
        }
    }

    if (
        typeof imgQtiElement.attr('original-width') !== 'undefined' &&
        typeof imgQtiElement.attr('original-height') !== 'undefined' &&
        typeof imgQtiElement.attr('type') !== 'undefined' &&
        typeof imgQtiElement.attr('src') !== 'undefined' &&
        typeof imgQtiElement.attr('width') !== 'undefined' &&
        typeof imgQtiElement.attr('height') !== 'undefined'
    ) {
        cb({
            $node: $imgNode,
            type: imgQtiElement.attr('type'),
            src: imgQtiElement.attr('src'),
            width: imgQtiElement.attr('width'),
            height: imgQtiElement.attr('height'),
            responsive: imgQtiElement.data('responsive')
        });
    } else {
        mimeType.getResourceType($imgNode.attr('src'), function (err, type) {
            imgQtiElement.attr('type', type);
            cb({
                $node: $imgNode,
                type: imgQtiElement.attr('type'),
                src: imgQtiElement.attr('src'),
                width: imgQtiElement.attr('width'),
                height: imgQtiElement.attr('height'),
                responsive: imgQtiElement.data('responsive')
            });
        });
    }
};

const getMediaCb = (media, widget, mediaEditor, options) => {
    const $mediaResizer = widget.$form.find('.img-resizer');
    media.$container = widget.$container.parents('.widget-box');
    if (media.$container.length) {
        // eslint-disable-next-line no-unused-vars
        mediaEditor = mediaEditorComponent($mediaResizer, media, options).on('change', function (nMedia) {
            media = nMedia;
            widget.$original.prop('style', null); // not allowed by qti
            widget.$original.removeAttr('style');
            alignmentHelper.positionFloat(widget, media.align);
            mediaSizer(media, widget);
            widget.$original.removeClass('hidden');
        });
    }
};

export default function initMediaEditor(widget, mediaEditor, options) {
    if (mediaEditor) {
        mediaEditor.destroy();
    }

    if (!widget.$form.find('input[name=src]').val()) {
        return;
    }
    let $img = widget.$original;
    let imgElem = widget.element;
    if (widget.element.is('figure')) {
        $img = widget.$original.find('img');
        imgElem = _.find(widget.element.getBody().elements, elem => elem.is('img'));
    }

    getMedia(imgElem, $img, (m) => getMediaCb(m, widget, mediaEditor, options));
}
