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
 * Copyright (c) 2020  (original work) Open Assessment Technologies SA;
 */

//only valid for a state
const positionFloat = function positionFloat (widget, position) {
    const $container = widget.$container,
        elt = widget.element;

    $container.removeClass('rgt lft');

    elt.removeClass('rgt');
    elt.removeClass('lft');
    switch(position) {
        case 'right':
            $container.addClass('rgt');
            elt.addClass('rgt');
            break;
        case 'left':
            $container.addClass('lft');
            elt.addClass('lft');
            break;
    }
};

export const initAlign = function initAlign (widget) {
    let align = 'default';

    if (widget.element.hasClass('rgt')) {
        align = 'right';
    } else if (widget.element.hasClass('lft')) {
        align = 'left';
    }

    positionFloat(widget, align);
    widget.$form.find('select[name=align]').val(align);
};