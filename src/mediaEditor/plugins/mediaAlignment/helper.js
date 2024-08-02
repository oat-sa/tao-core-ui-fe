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
 * Copyright (c) 2021-2023  (original work) Open Assessment Technologies SA;
 */
import context from 'context';
import _ from 'lodash';

export const FLOAT_LEFT_CLASS = 'wrap-left';
export const FLOAT_RIGHT_CLASS = 'wrap-right';
export const CENTER_CLASS = 'tao-centered';

const searchRecurse = (parentElement, serial) => {
    if (!parentElement) {
        return null;
    }
    if (parentElement.serial === serial) {
        return parentElement;
    }
    let found = null;
    _.some(parentElement['elements'], childElement => {
        if (childElement.serial === serial) {
            found = parentElement;
        } else if (childElement['elements']) {
            found = searchRecurse(childElement, serial);
        } else if (childElement['prompt']) {
            found = searchRecurse(childElement.prompt.bdy, serial);
        }
        if (found) {
            return true;
        }
    });
    return found;
};

export const positionFloat = function positionFloat(widget, position) {
    if (!position) {
        return;
    }

    widget.$container.removeClass(`${FLOAT_LEFT_CLASS} ${FLOAT_RIGHT_CLASS} ${CENTER_CLASS}`);
    widget.$original.removeClass(`${FLOAT_LEFT_CLASS} ${FLOAT_RIGHT_CLASS} ${CENTER_CLASS}`);

    let className;

    switch (position) {
        case 'right':
            className = FLOAT_RIGHT_CLASS;
            break;
        case 'left':
            className = FLOAT_LEFT_CLASS;
            break;
        case 'center':
            className = CENTER_CLASS;
            break;
        case 'default':
            className = '';
    }

    // Update DOM
    widget.$container.addClass(className);
    // Update model
    const prevClassName = widget.element.attr('class') || '';
    if (className) {
        widget.element.attr('class', className);
    } else {
        widget.element.removeAttr('class');
    }

    if (!context.featureFlags['FEATURE_FLAG_DISABLE_FIGURE_WIDGET'] && prevClassName !== className) {
        // Re-build Figure widget to toggle between inline/block
        const parent = searchRecurse(widget.element.bdy.rootElement.bdy, widget.serial);
        // avoid changes on Figure in a prompt
        if (parent.contentModel && parent.contentModel === 'inlineStatic') {
            _.defer(() => {
                widget.element.data('widget').refresh();
            });
            return;
        }
        widget.element.data('widget').changeState('sleep');
        _.defer(() => {
            if (parent && parent.data('widget')) {
                parent.data('widget').changeState('active');
                _.defer(() => {
                    parent.data('widget').changeState('sleep');
                    _.defer(() => {
                        widget.element.data('widget').changeState('active');
                    });
                });
            }
        });
    }
    widget.$original.trigger('contentChange.qti-widget');
};

export const initAlignment = function initAlignment(widget) {
    if (widget.element.hasClass(FLOAT_LEFT_CLASS)) {
        return positionFloat(widget, 'left');
    }
    if (widget.element.hasClass(FLOAT_RIGHT_CLASS)) {
        return positionFloat(widget, 'right');
    }
    if (widget.element.hasClass(CENTER_CLASS)) {
        return positionFloat(widget, 'center');
    }
};
