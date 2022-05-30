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
import { getImage } from './helper';

export const mediaSizer = function mediaSizer(media, widget) {
    const { img, $img } = getImage(widget);
    const $mediaSpan = widget.$container;

    if (img.data('responsive') !== media.responsive) {
        img.data('responsive', media.responsive);
    }

    _(['width', 'height']).each(function (sizeAttr) {
        let val;
        if (
            media[sizeAttr] === '' ||
            typeof media[sizeAttr] === 'undefined' ||
            media[sizeAttr] === null
        ) {
            img.removeAttr(sizeAttr);
            $mediaSpan.css(sizeAttr, '');
        } else {
            val = Math.round(media[sizeAttr]);
            if (media.responsive) {
                val += '%';
                img.attr(sizeAttr, val);
                $img.attr(sizeAttr, '100%');
            } else {
                img.attr(sizeAttr, val);
            }
            $mediaSpan.css(sizeAttr, val);
        }
        //trigger choice container size adaptation
        widget.$container.trigger('contentChange.qti-widget');
    });
};
