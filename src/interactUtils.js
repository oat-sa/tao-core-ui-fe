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
        window.addEventListener('mouseleave', iFrameDragFixCb);
    },
    iFrameDragFixOff: function iFrameDragFixOff() {
        window.removeEventListener('mouseleave', iFrameDragFixCb);
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
    },

    /**
     * Improve touch devices support:
     *  - prevent native scroll while dragging
     *  - start drag only after longpress:
     *    when user is scrolling through the long page, he can accidentally get his finger on the draggable element:
     *    this will cause unwanted, unnoticed drag and can mess up his response.
     * @example
     *  touchPatch = interactUtils.touchPatchFactory();
     *  interact(selector)
     *      .draggable({
                onstart: () => {
                    touchPatch.onstart();
                },
                onend: () => {
                    touchPatch.onend();
                }
            })
            .actionChecker(touchPatch.actionChecker);
        ...
        function destroy() {
`         touchPatch.destroy()
          interact(selector).unset();
        }
     * @returns {Object}
     */
    touchPatchFactory: function touchPatchFactory() {
        const delayBefore = 300;
        const distanceTolerance = 20; //while waiting for delayBefore, finger can move a little bit

        interact.pointerMoveTolerance(distanceTolerance);
        let isDragging = false;

        // webKit requires cancelable `touchmove` events to be added as early as possible
        // alternative: `touch-action: pinch-zoom` css: add it after drag start [?]; or have it always - worse ux
        function touchmoveListener(e) {
            if (isDragging) {
                e.preventDefault();
            }
        }
        window.addEventListener('touchmove', touchmoveListener, { passive: false });

        function contextmenuListener(e) {
            e.preventDefault();
        }

        return {
            /**
             * @param {PointerEvent} pointer
             * @param {PointerEvent} event
             * @param {Object} action
             * @param {Object} interactable
             * @returns {Object}
             */
            actionChecker: (pointer, event, action, interactable, element) => {
                if (event && action && action.name === 'drag') {
                    const isTouch = event.pointerType === 'touch';
                    interactable.options[action.name].delay = isTouch ? delayBefore : 0;

                    if (isTouch && !element.dataset.noContextMenu) {
                        //prevent context menu on longpress
                        //this listener can stay forever until the element is destroyed
                        element.addEventListener('contextmenu', contextmenuListener);
                        element.dataset.noContextMenu = true;
                    }
                }
                return action;
            },
            onstart: () => {
                isDragging = true;
            },
            onend: () => {
                isDragging = false;
            },
            destroy: () => {
                window.removeEventListener('touchmove', touchmoveListener);
            }
        };
    },

    /**
     * Builds a scroll observer that will make sure the dragged element keeps an accurate positioning
     * @example
     * scrollObserver = interactUtils.scrollObserverFactory($container);
     * dragOptions = {
            autoScroll: {
                container: scrollObserver.getScrollContainer().get(0)
            },
            onstart: function (e) {
                scrollObserver.start($activeChoice);
            },
            onend: function (e) {
                scrollObserver.stop();
            }
        };
     * @param {jQuery} $scrollContainer
     * @returns {scrollObserver}
     */
    scrollObserverFactory: function scrollObserverFactory($scrollContainer) {
        let currentDraggable = null;
        let beforeY = 0;
        let beforeX = 0;
        let afterY = 0;
        let afterX = 0;

        // reset the scroll observer context
        function resetScrollObserver() {
            currentDraggable = null;
            beforeY = 0;
            beforeX = 0;
            afterY = 0;
            afterX = 0;
        }

        // keep the position of the dragged element accurate with the scroll position
        function onScrollCb() {
            let x;
            let y;
            if (currentDraggable) {
                beforeY = afterY;
                beforeX = afterX;

                if (afterY === 0 && beforeY === 0) beforeY = this.scrollTop;
                if (afterX === 0 && beforeX === 0) beforeX = this.scrollLeft;

                afterY = this.scrollTop;
                afterX = this.scrollLeft;

                y = (parseInt(currentDraggable.getAttribute('data-y'), 10) || 0) + (afterY - beforeY);
                x = (parseInt(currentDraggable.getAttribute('data-x'), 10) || 0) + (afterX - beforeX);

                // translate the element
                currentDraggable.style.webkitTransform = currentDraggable.style.transform = `translate(${x}px, ${y}px)`;

                // update the position attributes
                currentDraggable.setAttribute('data-x', x);
                currentDraggable.setAttribute('data-y', y);
            }
        }

        // find the scroll container within the parents if any
        $scrollContainer.parents().each(function findScrollContainer() {
            const $el = $(this);
            const ovf = $el.css('overflow');
            if (ovf !== 'hidden' && ovf !== 'visible') {
                $scrollContainer = $el;
                return false;
            }
        });

        // make sure the drop zones will follow the scroll
        interact.dynamicDrop(true);

        /**
         * @typedef {Object} scrollObserver
         */
        return {
            /**
             * Gets the scroll container
             * @returns {jQuery}
             */
            getScrollContainer: function getScrollContainer() {
                return $scrollContainer;
            },

            /**
             * Initializes the scroll observer while dragging a choice
             * @param {HTMLElement|jQuery} draggedElement
             */
            start: function start(draggedElement) {
                resetScrollObserver();
                currentDraggable = draggedElement instanceof $ ? draggedElement.get(0) : draggedElement;
                $scrollContainer.on('scroll.scrollObserver', _.throttle(onScrollCb, 50));
            },

            /**
             * Tears down the the scroll observer once the dragging is done
             */
            stop: function stop() {
                $scrollContainer.off('.scrollObserver');
                resetScrollObserver();
            }
        };
    }
};

export default interactHelper;
