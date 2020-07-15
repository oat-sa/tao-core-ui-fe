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
 * Copyright (c) 2016-2019 (original work) Open Assessment Technologies SA ;
 */
/**
 * Helpers for interact library
 *
 * @author Christope Noël <christophe@taotesting.com>
 */
import $ from 'jquery';
import _ from 'lodash';
import interact from 'interact';
import 'core/mouseEvent';

var interactHelper, simulateDrop;

function iFrameDragFixCb() {
    if (_.isFunction(simulateDrop)) {
        simulateDrop();
    }
    interact.stop();
}

interactHelper = {
    /**
     * Chrome/Safari fix: manually drop a dragged element when the mouse leaves the item runner iframe
     * Without this fix, following behaviour is to be expected:
     *     - drag an element, move the mouse out of the browser window, release mouse button
     *     - when the mouse enter again the browser window, the drag will continue even though the mouse button has been released
     * This only occurs with iFrames.
     * Thus, this fix should be removed when the old test runner is discarded
     *
     * @param {Function} simulateDropCb manually triggers handlers registered for drop and dragend events
     */
    iFrameDragFixOn: function iFrameDragFixOn(simulateDropCb) {
        simulateDrop = simulateDropCb;
        document.body.addEventListener('mouseleave', iFrameDragFixCb);
    },
    iFrameDragFixOff: function iFrameDragFixOff() {
        document.body.removeEventListener('mouseleave', iFrameDragFixCb);
    },

    /**
     * Calculate element zoom due css transform scale to apply scale on move event.
     *
     * @param e {Event} event
     */
    calculateScale: function calculateScale(e) {
        var scaleX = e.getBoundingClientRect().width / e.offsetWidth;
        var scaleY = e.getBoundingClientRect().height / e.offsetHeight;
        return [scaleX, scaleY];
    },
    /**
     * triggers an interact 'tap' event
     * @param {HtmlElement|jQueryElement} element
     * @param {Function} cb callback
     * @param {int} delay in milliseconds before firing the callback
     */
    tapOn: function tapOn(element, cb, delay) {
        var domElement,
            firstEvent,
            secondEvent,
            eventOptions = {
                bubbles: true,
                pointerId: 1,
                cancelable: true,
                pointerType: 'touch',
                width: 100,
                height: 100,
                isPrimary: true
            };
        if (element) {
            domElement = element instanceof $ ? element.get(0) : element;

            if (navigator.userAgent.indexOf('MSIE') !== -1 || navigator.appVersion.indexOf('Trident/') > 0) {
                firstEvent = document.createEvent('HTMLEvents');
                firstEvent.initEvent('pointerdown', false, true);
                secondEvent = document.createEvent('HTMLEvents');
                secondEvent.initEvent('pointerup', false, true);
            } else {
                firstEvent = new PointerEvent('pointerdown', eventOptions);
                secondEvent = new PointerEvent('pointerup', eventOptions);
            }
            domElement.dispatchEvent(firstEvent);
            domElement.dispatchEvent(secondEvent);

            if (cb) {
                _.delay(cb, delay || 0);
            }
        }
    },

    /**
     * This should be bound to the onmove event of a draggable element
     * @param {HtmlElement|jQueryElement} element
     * @param {integer} dx event.dx value
     * @param {integer} dy event.dy value
     */
    moveElement: function moveElement(element, dx, dy) {
        var domElement = element instanceof $ ? element.get(0) : element,
            x = (parseFloat(domElement.getAttribute('data-x')) || 0) + dx,
            y = (parseFloat(domElement.getAttribute('data-y')) || 0) + dy,
            transform = 'translate(' + x + 'px, ' + y + 'px) translateZ(0px)';

        domElement.style.webkitTransform = transform;
        domElement.style.transform = transform;

        domElement.setAttribute('data-x', x);
        domElement.setAttribute('data-y', y);
    },

    /**
     * This can be bound to the onend event of a draggable element, for example
     * @param {HtmlElement|jQueryElement} element
     */
    restoreOriginalPosition: function restoreOriginalPosition(element) {
        var domElement = element instanceof $ ? element.get(0) : element;

        domElement.style.webkitTransform = 'translate(0px, 0px) translateZ(0px)';
        domElement.style.transform = 'translate(0px, 0px) translateZ(0px)';

        domElement.setAttribute('data-x', 0);
        domElement.setAttribute('data-y', 0);
    }
};

export default interactHelper;
